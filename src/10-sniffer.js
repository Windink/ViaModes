if (window.top !== window.self) { throw new Error('via-vp: iframe skip'); }

var VV_PROTO = location.protocol;
if (VV_PROTO !== 'http:' && VV_PROTO !== 'https:') { throw new Error('via-vp: scheme skip'); }

var vvSiteKey = 'offsite:' + location.hostname;
var vvSiteOff = vvGet(vvSiteKey, false);
VV.cfg.siteOff = vvSiteOff;

// ---- 响应体取值闸门 ----
//
// 以前是"只要 ct 以 text 开头就读一遍 body"，覆盖面看着广，代价却极高：
// fetch 分支要 resp.clone().text()，等于把整个响应体再复制一份字符串。
// 一个装了二三十个脚本的资讯/视频站，光 JS bundle 就有几十 MB，
// 首屏阶段我们要白白复制几十 MB、再对每份跑一遍正则预检。
// 低端机（2~4GB 内存、单核大核）上表现为首屏卡顿、掉帧，严重时 WebView 直接 OOM 白屏。
// 这也解释了"有的站开十几个没事、有的站开一个就卡"——差别在站点的响应体规模，不在页签数。
//
// 现在的判据：
//   1) 只放行"可能是接口数据"的类型（json / plain / 表单 / m3u8 清单）；
//   2) js、css、html、xml、svg、event-stream 一律不碰；
//   3) 超过 256KB 的一律不碰（真清单和真接口都远小于这个量级）。
var VV_BODY_CT = {
    'application/json': 1,
    'application/x-json': 1,
    'text/json': 1,
    'text/plain': 1,
    'application/x-www-form-urlencoded': 1,
    'application/vnd.apple.mpegurl': 1,
    'application/x-mpegurl': 1,
    'audio/mpegurl': 1,
    'audio/x-mpegurl': 1
};
var VV_BODY_MAX = 262144;
// 空 ct 的响应不放行：那多半是流式资源或二进制，读它风险大于收益。
// 例外是"小且不是静态资源"的响应——部分老接口不发 ct，漏了就是真的搜不到。
var VV_STATIC_EXT = /\.(?:js|mjs|css|html?|xml|svg|png|jpe?g|gif|webp|woff2?|ttf|otf|ico)(?:[?#]|$)/i;

function vvWantBody(ct, len, url) {
    var yes = vvWantBodyRaw(ct, len, url);
    // 记一笔账：卡死/卡顿类问题没法靠"感觉"定位，
    // 得能直接说出"这次页面加载我们省掉了多少次读取、多少字节"。
    try {
        if (yes) VV._bodyRead = (VV._bodyRead || 0) + 1;
        else {
            VV._bodySkip = (VV._bodySkip || 0) + 1;
            if (len) VV._bodySkipKb = (VV._bodySkipKb || 0) + Math.round(len / 1024);
        }
    } catch (eB) {}
    return yes;
}

function vvWantBodyRaw(ct, len, url) {
    if (len > VV_BODY_MAX) return false;
    var c = ct ? String(ct).split(';')[0].trim().toLowerCase() : '';
    if (c) {
        if (VV_BODY_CT[c]) return true;
        return /\+json$/.test(c);   // application/vnd.api+json 之类
    }
    return len > 0 && len <= 65536 && !VV_STATIC_EXT.test(url || '');
}

var VvOfOpen = XMLHttpRequest.prototype.open;
var VvOfSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function (method, url) {
    var self = this;
    self._vvUrl = url;
    self._vvMethod = method;
    return VvOfOpen.apply(self, arguments);
};

XMLHttpRequest.prototype.send = function () {
    var self = this;
    if (!self._vvHooked) {
        self._vvHooked = true;
        try { self.addEventListener('load', function () { vvOnXhr(self); }); } catch (e) {}
    }
    return VvOfSend.apply(self, arguments);
};

function vvOnXhr(xhr) {
    try {
        var rt = xhr.responseType;
        if (rt && rt !== 'text' && rt !== 'json' && rt !== '') return;
        var ct = '';
        var len = 0;
        try { ct = (xhr.getResponseHeader && xhr.getResponseHeader('Content-Type')) || ''; } catch (eC) {}
        try { len = Number(xhr.getResponseHeader && xhr.getResponseHeader('Content-Length')) || 0; } catch (eL) {}
        var r = vvResolve(xhr._vvUrl || '', ct);
        if (r) {
            // URL 本身就认出来了：只有 HLS 清单需要读 body（要挑码率），其余不必读。
            if (r.type === 'HLS') {
                try { vvNoteHlsBody(r, xhr.responseText || '', xhr.responseURL || xhr._vvUrl); } catch (eH) {}
            }
            vvPushItem(r);
            return;
        }
        // 没认出来，才需要读 body 找线索。但先过闸门：
        // JS/CSS/HTML 这类大响应读了纯属浪费（见 vvWantBody 注释）。
        if (rt === 'json') {
            if (xhr.response && vvWantBody(ct || 'application/json', len, xhr._vvUrl)) {
                vvScanText(JSON.stringify(xhr.response), 'api');
            }
            return;
        }
        if (!vvWantBody(ct, len, xhr._vvUrl)) return;
        var txt = xhr.responseText;
        if (txt && txt.length < 600000) vvScanText(txt, null);
    } catch (e) {}
}

var VvOfFetch = window.fetch;
if (typeof VvOfFetch === 'function') {
    window.fetch = function () {
        var args = arguments;
        var inputUrl = '';
        try {
            var inp = args[0];
            if (typeof inp === 'string') inputUrl = inp;
            else if (inp && inp.url) inputUrl = inp.url;
        } catch (e) {}
        var p = VvOfFetch.apply(window, args);
        if (inputUrl) {
            p.then(function (resp) {
                try {
                    var ct = '';
                    try { ct = resp.headers.get('Content-Type') || ''; } catch (e2) {}
                    var len = 0;
                    try { len = Number(resp.headers.get('Content-Length')) || 0; } catch (e3) {}
                    var url = (resp && resp.url) || inputUrl;
                    var r = vvResolve(url, ct);
                    if (r) {
                        // 清单要读 body 才能挑码率；其余类型 URL 已经说明一切，不必读。
                        if (r.type === 'HLS') {
                            try {
                                resp.clone().text().then(function (t) {
                                    try { vvNoteHlsBody(r, t, url); } catch (eH) {}
                                }).catch(function () {});
                            } catch (eH2) {}
                        }
                        vvPushItem(r);
                        return;
                    }
                    if (ct && (ct.indexOf('video') === 0 || ct.indexOf('m3u8') >= 0 || ct.indexOf('mpegurl') >= 0)) {
                        var r2 = vvResolve(inputUrl, ct);
                        if (r2) vvPushItem(r2);
                        return;
                    }
                    // 闸门必须在 clone 之前：clone() 本身就是一次流复制 + 全量缓冲，
                    // "先读了再看有没有用"等于把代价付完了才决定不读。
                    if (!vvWantBody(ct, len, url)) return;
                    resp.clone().text().then(function (t) {
                        if (t && t.length < 600000) vvScanText(t, null);
                    }).catch(function () {});
                } catch (e1) {}
            }, function () {});
        }
        return p;
    };
}

var VvWeak = {};
var VvObserved = false;

function vvScanNode(node) {
    if (!node) return;
    if (node.nodeType === 1) {
        vvCheckMediaNode(node);
        // 只在"确实是容器"时才做子树查询。叶子节点（<img>、<span>、<br>、文本包装）
        // 占新增节点的绝大多数，对它们调 querySelectorAll 纯属白跑。
        if (node.childElementCount && node.querySelectorAll) {
            try {
                var vids = node.querySelectorAll('video,source');
                for (var i = 0; i < vids.length; i++) vvCheckMediaNode(vids[i]);
            } catch (e3) {}
        }
    }
}

function vvCheckMediaNode(n) {
    try {
        // 用 nodeName 而不是 tagName.toLowerCase()：这个函数会被 MutationObserver
        // 按属性变更频率调用（懒加载图片每张都会改 src），每次少分配一个字符串，
        // 在图片瀑布流页面上差的是每秒几百次分配。
        var nm = n.nodeName;
        var tag = '';
        if (nm === 'VIDEO' || nm === 'SOURCE') tag = 'video';
        else if (nm === 'A') tag = 'a';
        else return;
        var u = '';
        if (tag === 'video') u = n.getAttribute('src') || n.src || '';
        else u = n.getAttribute('href') || '';
        if (!u) return;
        var r = vvResolve(u, '');
        // 顺手记下封面：起播等待期要用它顶住黑屏（见 vvShowPoster）。
        // 只取 video 自己的 poster，别去猜站点结构。
        if (r && tag === 'video') {
            try {
                var ps = n.getAttribute('poster') || '';
                if (ps) r.poster = ps;
            } catch (eP) {}
        }
        if (r && vvPushItem(r) && tag === 'video' && n.currentSrc && n.currentSrc.indexOf('blob:') === 0) {
            vvPushItem(vvResolve(n.currentSrc, ''));
        }
        if (tag === 'video') vvWatchVideoEl(n);
        // 顺手把页面视频的 preload="auto" 降级，避免没起播也整段预载（见 12-autoplay.js）
        if (tag === 'video') { try { vvApTamePreload(n); } catch (eA) {} }
    } catch (e) {}
}

function vvWatchVideoEl(videoEl) {
    if (!videoEl || videoEl._vvWatched) return;
    videoEl._vvWatched = true;
    var onMeta = function () {
        try {
            var cs = videoEl.currentSrc || videoEl.src || '';
            if (cs && cs.indexOf('blob:') === 0) vvPushItem(vvResolve(cs, ''));
        } catch (e) {}
    };
    videoEl.addEventListener('loadedmetadata', onMeta, true);
    videoEl.addEventListener('loadeddata', onMeta, true);
}

function vvScanDOM() {
    try {
        if (!document.body) return;
        vvScanNode(document.body);
    } catch (e) {}
}

var vvMoQueue = [];
// 队列上限。这个数字不是随便定的：它要能装下"一屏懒加载 + 一次无限滚动"的量，
// 又不能装到让 drain 追不上。以前没有上限，在弹幕/瀑布流/自动轮播这类
// "每秒新增几百个节点"的页面上，生产速度长期高于消费速度，队列会一路涨到几十万，
// 内存翻倍、主线程被自己的扫描任务占满——表现出来就是"页面越来越卡，最后卡死"。
// 这和站点是否在播视频无关，所以"有的站开十几个都没事，有的站开一个就卡"。
var VV_MO_MAX = 320;
var VV_MO_BUDGET = 8;      // 每批最多占用主线程 8ms，超了就排下一批

function vvDrainMoQueue() {
    VV._moTimer = null;
    // 播放中不再扫描新增节点，把 CPU 让给视频解码；关闭播放器时会全页补扫一次
    if (VV.playerActive) { vvMoQueue = []; return; }
    var q = vvMoQueue;
    vvMoQueue = [];
    var n = Math.min(q.length, 120);
    var t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0;
    var i = 0;
    for (; i < n; i++) {
        try { vvScanNode(q[i]); } catch (eS) {}
        // 时间预算：单个节点可能是几千节点的子树根（一次渲染整块列表），
        // 固定"120 个"这种按数量分批挡不住它。按毫秒切才真的不会卡帧。
        if (t0 && i > 0 && (i & 7) === 0 && performance.now() - t0 > VV_MO_BUDGET) { i++; break; }
    }
    VV._moNodes = (VV._moNodes || 0) + i;
    if (i < q.length) {
        // 广告/瀑布流页面一次可能新增大量节点，分批处理，避免单帧长时间占用主线程
        vvMoQueue = q.slice(i).concat(vvMoQueue);
        VV._moTimer = setTimeout(vvDrainMoQueue, 120);
    }
}

if (window.MutationObserver) {
    var vvMO = new MutationObserver(function (muts) {
        if (VV.playerActive) return; // 播放中挂起节点嗅探
        for (var i = 0; i < muts.length; i++) {
            var m = muts[i];
            if (m.type === 'attributes') {
                // 先按 nodeName 粗筛，别把懒加载图片的 src 变更也送进 vvResolve。
                // 大图站每屏几十次属性变更，全送进去就是每秒几百次 URL 解析。
                var tn = m.target && m.target.nodeName;
                if (tn === 'VIDEO' || tn === 'SOURCE' || tn === 'A' || tn === 'IFRAME') vvCheckMediaNode(m.target);
                continue;
            }
            var an = m.addedNodes;
            for (var j = 0; j < an.length; j++) {
                var node = an[j];
                if (node && node.nodeType === 1) vvMoQueue.push(node);
            }
        }
        if (vvMoQueue.length > VV_MO_MAX) {
            // 丢最旧的：新节点更可能是当前这一屏的播放器
            VV._moDropped = (VV._moDropped || 0) + (vvMoQueue.length - VV_MO_MAX);
            vvMoQueue = vvMoQueue.slice(vvMoQueue.length - VV_MO_MAX);
        }
        // 只处理新增节点，不再每次 DOM 变动都全量扫描整页
        if (vvMoQueue.length && !VV._moTimer) {
            VV._moTimer = setTimeout(vvDrainMoQueue, 150);
        }
    });
    VvObserved = true;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        vvStartDomScan();
    }, false);
} else {
    vvStartDomScan();
}

function vvStartDomScan() {
    if (VV._domScanned) return;
    VV._domScanned = true;
    if (VvObserved) {
        try { vvMO.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'href'] }); } catch (e) {}
    }
    document.addEventListener('loadedmetadata', function (evt) {
        vvWatchVideoEl(evt.target);
        vvCheckMediaNode(evt.target);
    }, true);
    vvStartPerfScan();
    setTimeout(vvScanDOM, 10);
    setTimeout(vvScanDOM, 400);
    setTimeout(vvScanDOM, 1600);
}

// 资源计时嗅探：油猴没有 chrome.webRequest，但 PerformanceObserver / performance
// 资源条目能看到页面自身（包括脚本注入前）请求过的媒体 URL，弥补 XHR/fetch/DOM 盲区。
var vvPerfCursor = 0;
var vvPerfSeen = {};
var vvPerfTimer = null;

function vvScanPerf(limit) {
    try {
        if (VV.cfg.siteOff || !VV.cfg.enabled) return 0;
        if (VV.playerActive) return 0; // 播放中挂起资源计时扫描
        var perf = window.performance || (typeof performance !== 'undefined' ? performance : null);
        if (!perf || typeof perf.getEntriesByType !== 'function') return 0;
        var entries = perf.getEntriesByType('resource');
        if (!entries || !entries.length) return 0;
        // 资源条目是累积列表；用游标分批处理，避免广告页几千条资源卡住主线程
        if (vvPerfCursor > entries.length) vvPerfCursor = 0;
        var end = Math.min(entries.length, vvPerfCursor + (limit || 400));
        var added = 0;
        for (var i = vvPerfCursor; i < end; i++) {
            var e = entries[i];
            var u = e && (e.name || e.url);
            if (!u || vvPerfSeen[u]) continue;
            vvPerfSeen[u] = 1;
            var r = vvResolve(u, '');
            if (r && vvPushItem(r)) added++;
        }
        vvPerfCursor = end;
        if (end < entries.length) vvSchedulePerf(120);
        return added;
    } catch (e) { return 0; }
}

function vvSchedulePerf(delay) {
    try {
        if (vvPerfTimer) return;
        vvPerfTimer = setTimeout(function () {
            vvPerfTimer = null;
            vvScanPerf();
        }, delay || 300);
    } catch (e) {}
}

function vvStartPerfScan() {
    if (VV._perfStarted) return;
    VV._perfStarted = true;
    vvScanPerf();
    try {
        if (window.PerformanceObserver) {
            var po = new PerformanceObserver(function () { vvSchedulePerf(250); });
            po.observe({ entryTypes: ['resource'] });
            VV._perfObs = po;
        }
    } catch (e) {}
    // 兼容不支持 PerformanceObserver 的旧 WebView；覆盖首屏和懒加载资源
    [400, 1600, 4000, 8000].forEach(function (ms) {
        setTimeout(vvScanPerf, ms);
    });
}
