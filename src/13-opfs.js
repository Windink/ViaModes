// OPFS 播放缓存：把 hls.js 下载过的媒体分片存进 Origin Private File System，
// 同 URL 再播直接命中缓存、不发网络请求。重复观看 / 弱网回看 / 换页面回播
// 都是直接从磁盘读，起播与 seek 的网络等待直接消失。
//
// 设计要点：
// - 只缓存媒体分片（fLoader 只接 fragment 加载），清单每次照常拉——直播轮换、
//   防盗链地址轮换、码率表变更都不受缓存干扰。
// - key = host + path（刻意去 query：分片 URL 的 query 常是一次性 token，
//   留着它缓存永远命不中）；byte-range 分片（fMP4 常见的 EXT-X-BYTERANGE）
//   再拼上 range 区间，同一个 m4s 文件的不同段各存各的。
//   注意不能用 vvVideoKey（那是续播进度的语义归并 key，会把整个视频的所有
//   分片归并成一个 key）。假设同一 host+path 的分片内容不变（token 只在 query）。
// - AES-128/SAMPLE-AES 加密流照样缓存：loader 拿到的本来就是密文分片，
//   hls.js 命中后照常解密，key 请求走 manifest loader 不受影响。
// - 写缓存 fire-and-forget：绝不阻塞播放链路，写失败静默（配额满了就走驱逐）。
// - LRU 驱逐：总量超上限后按最近命中时间删到 80%。索引存目录内 index.json，
//   启动时与目录实际文件对账，孤儿/悬空条目互删，进程被杀也不留脏数据。

var VV_OPFS_DIR = 'vv-cache';
var VV_OPFS_INDEX = 'index.json';
var VV_OPFS_MAX = 512 * 1024 * 1024;   // 容量上限，超出 LRU 删到 80%
var VV_OPFS_EVICT_TO = 0.8;

var vvOpfs = {
    supported: false,   // 环境支持 OPFS（探测过）
    ready: false,       // root 与索引已就绪
    root: null,
    index: null,        // Map(key -> {f, k, size, at})
    bytes: 0,
    hits: 0,
    misses: 0,
    writes: 0,
    errors: 0,
    _saving: null,      // index.json 的防抖定时器
    _inner: null        // hls.js 默认 loader 构造器（vvLoadHls 里注入）
};

function vvOpfsEnabled() {
    return vvOpfs.supported && VV.cfg.opfsCache !== false;
}

// djb2 变体：文件名要落在合法字符里，碰撞由索引里的 key 原文校验兜底
function vvOpfsHash(str) {
    var h = 5381;
    for (var i = str.length - 1; i >= 0; i--) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
    return h.toString(36) + '_' + str.length.toString(36);
}

function vvOpfsKey(url, rangeStart, rangeEnd) {
    var k;
    try {
        var u = new URL(url);
        k = u.hostname.replace(/^www\./, '') + (u.pathname || '');
    } catch (e) {
        k = String(url || '').split('?')[0].slice(0, 200);
    }
    if (rangeEnd > 0) k += '@' + rangeStart + '-' + rangeEnd;
    return k;
}

function vvOpfsInit() {
    if (vvOpfs.ready) return Promise.resolve(true);
    // 重入保护：boot 时模块顶层已发起 init，cacheWait/__vv.cache 再调一次时
    // 若并发重跑，两个 init 会在「索引还没读进来」的空 Map 上跑对账，
    // 把已落盘的分片文件当孤儿删光（真修过：桌面验证里新页面 entries=0 就是它）。
    if (vvOpfs._initing) return vvOpfs._initing;
    if (!self.navigator || !self.navigator.storage || !self.navigator.storage.getDirectory) {
        vvOpfs.supported = false;
        return Promise.resolve(false);
    }
    vvOpfs._initing = self.navigator.storage.getDirectory().then(function (root) {
        var dir = null;
        return root.getDirectoryHandle(VV_OPFS_DIR, { create: true }).then(function (d) {
            dir = d;
            vvOpfs.root = dir;
            return vvOpfsLoadIndex(dir);
        }).then(function (hasIndex) {
            return vvOpfsReconcile(dir, hasIndex);
        }).then(function () {
            vvOpfs.supported = true;
            vvOpfs.ready = true;
            // 尽量申请持久化存储：best-effort，WebView 上多半拿不到，拿到就更稳
            try { self.navigator.storage.persist && self.navigator.storage.persist(); } catch (eP) {}
            return true;
        });
    }).catch(function (e) {
        vvOpfs.errors++;
        vvOpfs.supported = false;
        vvOpfs.ready = false;
        return false;
    }).then(function (r) {
        vvOpfs._initing = null;
        return r;
    });
    return vvOpfs._initing;
}

function vvOpfsLoadIndex(dir) {
    return dir.getFileHandle(VV_OPFS_INDEX).then(function (fh) {
        return fh.getFile().then(function (f) {
            if (!f.size) { vvOpfs.index = new Map(); return true; }
            return f.arrayBuffer().then(function (buf) {
                try {
                    var arr = JSON.parse(new TextDecoder().decode(buf));
                    vvOpfs.index = new Map(arr);
                    var n = 0;
                    arr.forEach(function (en) { n += en.size || 0; });
                    vvOpfs.bytes = n;
                } catch (eJ) { vvOpfs.index = new Map(); }
                return true;
            });
        });
    }).catch(function (e) {
        // 没有 index.json（首次）或读不了：空索引起步；
        // hasIndex=false 让对账【不删孤儿】——读到失败不该毁掉磁盘上还能用的缓存
        vvOpfs.index = new Map();
        return false;
    });
}

// 索引与目录对账：目录里不在索引的文件、索引里指向不存在文件的条目，都清掉。
// onlyIfIndexed=true（index.json 确实读到了）才删孤儿文件；
// 索引读失败时只修索引不删文件，等下次保存索引后自然对齐。
function vvOpfsReconcile(dir, onlyIfIndexed) {
    var seen = new Map();   // fileName -> size
    return new Promise(function (resolve) {
        var iter = dir.entries();
        var step = function () {
            iter.next().then(function (r) {
                if (r.done) return resolve(seen);
                var name = r.value[0];
                if (name !== VV_OPFS_INDEX) {
                    r.value[1].getFile().then(function (f) {
                        seen.set(name, f.size);
                    }).catch(function () {}).then(step, step);
                } else {
                    step();
                }
            }).catch(function () { resolve(seen); });
        };
        step();
    }).then(function (seen) {
        var idx = vvOpfs.index;
        var dropFiles = [];
        idx.forEach(function (en, key) {
            if (seen.has(en.f)) { en.size = seen.get(en.f); seen.delete(en.f); }
            else dropFiles.push(key);
        });
        dropFiles.forEach(function (key) { idx.delete(key); });
        // 目录里的孤儿文件（索引丢了但文件还在）：只在索引可信时删，别占配额
        var kills = [];
        if (onlyIfIndexed) {
            seen.forEach(function (_sz, name) { kills.push(dir.removeEntry(name).catch(function (e) {})); });
        }
        // 对账后重算总量
        var total = 0;
        idx.forEach(function (en) { total += en.size || 0; });
        vvOpfs.bytes = total;
        return Promise.all(kills).then(function () {
            if (dropFiles.length || kills.length) vvOpfsSaveIndex(0);
        });
    });
}

function vvOpfsSaveIndex(delayMs) {
    if (!vvOpfs.root || !vvOpfs.index) return;
    if (vvOpfs._saving) { clearTimeout(vvOpfs._saving); vvOpfs._saving = null; }
    vvOpfs._saving = setTimeout(function () {
        vvOpfs._saving = null;
        try {
            var arr = [];
            vvOpfs.index.forEach(function (en, key) { arr.push([key, en]); });
            vvOpfs.root.getFileHandle(VV_OPFS_INDEX, { create: true }).then(function (fh) {
                return fh.createWritable().then(function (w) {
                    return w.write(new TextEncoder().encode(JSON.stringify(arr))).then(function () {
                        return w.close();
                    });
                });
            }).catch(function (e) { vvOpfs.errors++; });
        } catch (eS) { vvOpfs.errors++; }
    }, delayMs === 0 ? 0 : 2000);
}

function vvOpfsGet(key) {
    var en = vvOpfs.index.get(key);
    if (!en) return Promise.resolve(null);
    return vvOpfs.root.getFileHandle(en.f).then(function (fh) {
        return fh.getFile();
    }).then(function (f) {
        if (f.size !== en.size) throw new Error('size-mismatch');
        return f.arrayBuffer();
    }).then(function (buf) {
        en.at = Date.now();          // 命中即刷新 LRU 时间
        vvOpfsSaveIndex(2000);
        return buf;
    }).catch(function (e) {
        // 悬空条目：文件被系统清了或对账没跑到，删条目当 MISS
        vvOpfs.index.delete(key);
        vvOpfs.bytes -= en.size || 0;
        return null;
    });
}

function vvOpfsPut(key, data) {
    if (!vvOpfsEnabled() || !vvOpfs.ready || !data || !data.byteLength) return;
    if (data.byteLength > VV_OPFS_MAX) return;   // 单片超过总上限的流不值得缓存
    try {
        var en = vvOpfs.index.get(key);
        if (en) { vvOpfs.bytes -= en.size || 0; } // 同 key 重下（token 换了之类），覆盖旧份
        var f = vvOpfsHash(key);
        vvOpfs.root.getFileHandle(f, { create: true }).then(function (fh) {
            return fh.createWritable().then(function (w) {
                return w.write(data).then(function () { return w.close(); });
            });
        }).then(function () {
            vvOpfs.index.set(key, { f: f, k: key, size: data.byteLength, at: Date.now() });
            vvOpfs.bytes += data.byteLength;
            vvOpfs.writes++;
            vvOpfsEvict();
            // put 是缓存的命脉：索引丢了磁盘上的分片就全废了，立即提交不等防抖
            // （页面在防抖窗口内被关掉的话，createWritable 的原子提交会随页面一起
            // 被掐断，index.json 从未落地——分片文件还在但索引空了，缓存全作废。
            // 桌面验证里「新页面 entries=0」就是这个时序压出来的）。
            vvOpfsSaveIndex(0);
        }).catch(function (e) { vvOpfs.errors++; });
    } catch (eP) { vvOpfs.errors++; }
}

function vvOpfsEvict() {
    if (vvOpfs.bytes <= VV_OPFS_MAX) return;
    var list = [];
    vvOpfs.index.forEach(function (en, key) { list.push([key, en]); });
    list.sort(function (a, b) { return a[1].at - b[1].at; });   // 最久未命中在前
    var target = VV_OPFS_MAX * VV_OPFS_EVICT_TO;
    var kills = [];
    for (var i = 0; i < list.length && vvOpfs.bytes > target; i++) {
        var key = list[i][0], en = list[i][1];
        vvOpfs.bytes -= en.size || 0;
        vvOpfs.index.delete(key);
        kills.push(vvOpfs.root.removeEntry(en.f).catch(function (e) {}));
    }
    if (kills.length) vvOpfsSaveIndex(0);
}

function vvOpfsClear() {
    var n = vvOpfs.index ? vvOpfs.index.size : 0;
    var bytes = vvOpfs.bytes;
    if (!vvOpfs.ready) return Promise.resolve({ n: 0, bytes: 0 });
    var kills = [];
    vvOpfs.index.forEach(function (en) { kills.push(vvOpfs.root.removeEntry(en.f).catch(function (e) {})); });
    vvOpfs.index = new Map();
    vvOpfs.bytes = 0;
    vvOpfsSaveIndex(0);
    return Promise.all(kills).then(function () { return { n: n, bytes: bytes }; });
}

// ---- hls.js fragment loader 包装 ----
// 接口对齐 hls.js 1.7：实例必须有 stats（frag.stats 直接引用 loader 实例的 stats），
// load(context, config, callbacks)，abort()/destroy()。命中缓存时手工构造 stats
// （loading.start=first=end=命中时刻），回调走 setTimeout 异步化，保持与网络加载
// 相同的事件顺序（FRAG_LOADED 等看门狗字段照常翻转）。
function vvOpfsSetInner(hlsCtor) {
    try { vvOpfs._inner = hlsCtor && hlsCtor.DefaultConfig && hlsCtor.DefaultConfig.loader; } catch (e) {}
}

function vvOpfsFragLoader(cfg) {
    if (vvOpfs._inner) this._i = new vvOpfs._inner(cfg);
    this.stats = {
        aborted: false, loaded: 0, retry: 0, total: 0, chunkCount: 0, bwEstimate: 0,
        loading: { start: 0, first: 0, end: 0 }, parsing: { start: 0, end: 0 }, buffering: { start: 0, first: 0, end: 0 }
    };
}

vvOpfsFragLoader.prototype.load = function (context, lcfg, callbacks) {
    var self = this;
    if (!self._i || !vvOpfsEnabled() || !vvOpfs.ready || !context || context.responseType !== 'arraybuffer') {
        if (self._i) return self._i.load(context, lcfg, callbacks);
        if (callbacks && callbacks.onError) callbacks.onError({ code: 0, text: 'loader-missing' }, lcfg, context, null);
        return;
    }
    var key = vvOpfsKey(context.url, context.rangeStart, context.rangeEnd);
    // 磁盘读取的真实耗时直接喂给 stats：诊断面板的「下载速率」按分片字节/耗时算，
    // 命中缓存时耗时应计入磁盘读——给 0ms 会让诊断输出 NaN，也给 ABR 一个
    // 如实（命中即快）的带宽样本。
    var t0 = Date.now();
    vvOpfsGet(key).then(function (buf) {
        if (self._dead || self.stats.aborted) return;
        if (buf) {
            vvOpfs.hits++;
            var t1 = Date.now() <= t0 ? t0 + 1 : Date.now();
            self.stats.loaded = self.stats.total = buf.byteLength;
            self.stats.loading = { start: t0, first: t0, end: t1 };
            setTimeout(function () {
                if (self._dead || self.stats.aborted) return;
                try { callbacks.onSuccess({ url: context.url, data: buf }, self.stats, context, null); } catch (eH) {}
            }, 0);
        } else {
            vvOpfs.misses++;
            // hls.js 在 load() 时就把 frag.stats 指到 wrapper 的 stats（e.stats=h.stats），
            // inner 回调参数里的 stats 只是参考值——不把 inner 的网络计时同步回
            // self.stats，诊断的下载速率统计和 ABR 的带宽估计拿到的全是 0。
            self._syncStats = function (stats) {
                if (!stats || self._dead) return;
                try {
                    self.stats.aborted = !!stats.aborted;
                    self.stats.loaded = stats.loaded || 0;
                    self.stats.total = stats.total || 0;
                    self.stats.retry = stats.retry || 0;
                    self.stats.bwEstimate = stats.bwEstimate || 0;
                    self.stats.loading = stats.loading || self.stats.loading;
                    self.stats.parsing = stats.parsing || self.stats.parsing;
                } catch (eS) {}
            };
            self._i.load(context, lcfg, {
                onSuccess: function (resp, stats, ctx, nd) {
                    self._syncStats(stats);
                    try {
                        // resp.data 的 ArrayBuffer 在 hls.js 开 worker 时会被 transfer 给
                        // transmux worker（detach 后 byteLength=0）——异步写 OPFS 前必须
                        // 在本同步栈里先复制一份，否则写出去的是 0 字节文件，
                        // 读回 size 校验失败、删条目重下，死循环。
                        if (resp && resp.data && resp.data.byteLength) vvOpfsPut(key, resp.data.slice(0));
                    } catch (eP) {}
                    if (callbacks.onSuccess) callbacks.onSuccess(resp, stats, ctx, nd);
                },
                onError: function (err, stats, ctx, nd) { self._syncStats(stats); if (callbacks.onError) callbacks.onError(err, stats, ctx, nd); },
                onTimeout: function (stats, ctx, nd) { self._syncStats(stats); if (callbacks.onTimeout) callbacks.onTimeout(stats, ctx, nd); },
                onAbort: function (stats, ctx, nd) { self._syncStats(stats); if (callbacks.onAbort) callbacks.onAbort(stats, ctx, nd); },
                onProgress: function (stats, ctx, nd) { if (stats) self._syncStats(stats); if (callbacks.onProgress) callbacks.onProgress(stats, ctx, nd); }
            });
        }
    }).catch(function (e) {
        vvOpfs.errors++;
        if (!self._dead && !self.stats.aborted && self._i) {
            self._i.load(context, lcfg, callbacks);
        }
    });
};
vvOpfsFragLoader.prototype.abort = function () {
    this.stats.aborted = true;
    if (this._i) { try { this._i.abort(); } catch (e) {} }
};
vvOpfsFragLoader.prototype.destroy = function () {
    this._dead = true;
    if (this._i) { try { this._i.destroy(); } catch (e) {} }
};

try { vvOpfsInit(); } catch (eOI) {}

// 页面隐藏/关闭前把还没落盘的索引刷出去（防抖窗口内被掐的兜底）
try {
    self.addEventListener('pagehide', function () { try { vvOpfsSaveIndex(0); } catch (ePH) {} });
    self.addEventListener('visibilitychange', function () {
        if (self.document && self.document.visibilityState === 'hidden') {
            try { vvOpfsSaveIndex(0); } catch (eVC) {}
        }
    });
} catch (eLS) {}
