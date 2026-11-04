'use strict';
var VV_MARK = '__VIA_VIDEO_PLAYER__';
var VV_STORE = 'via.vp.';

if (window[VV_MARK]) {
    throw new Error('via-vp: already loaded');
}
window[VV_MARK] = true;

var VV_ERR_CAPTURE = null;
try {
    window.addEventListener('error', function (e) {
        if (VV_ERR_CAPTURE) return;
        var m = e && (e.message || (e.error && e.error.message));
        if (!m) return;
        if (VV_ERR_CAPTURE === null && typeof VV === 'undefined') VV_ERR_CAPTURE = { msg: String(m) };
        else if (typeof VV !== 'undefined' && !VV.err) VV.err = { msg: String(m) };
    }, true);
} catch (eEr) {}

var VV_TYPE_CN = { HLS: 'm3u8', MP4: 'mp4', M4V: 'm4v', WEBM: 'webm', MKV: 'mkv', FLV: 'flv', MOV: 'mov', AVI: 'avi', WMV: 'wmv', AUDIO: '音频', BLOB: '原生流' };

var VV_EXT_TYPE = {
    m3u8: 'HLS', mp4: 'MP4', m4v: 'M4V', webm: 'WEBM', mkv: 'MKV', flv: 'FLV', f4v: 'FLV',
    mov: 'MOV', avi: 'AVI', wmv: 'WMV', '3gp': 'AVI',
    mp3: 'AUDIO', m4a: 'AUDIO', aac: 'AUDIO', ogg: 'AUDIO', oga: 'AUDIO', opus: 'AUDIO', wav: 'AUDIO', flac: 'AUDIO'
};

var VV_CT_TYPE = {
    'application/vnd.apple.mpegurl': 'HLS', 'application/x-mpegurl': 'HLS', 'application/mpegurl': 'HLS',
    'audio/mpegurl': 'HLS', 'audio/x-mpegurl': 'HLS', 'video/mp4': 'MP4', 'video/x-m4v': 'M4V',
    'video/quicktime': 'MOV', 'video/webm': 'WEBM', 'video/x-matroska': 'MKV', 'video/x-flv': 'FLV',
    'video/avi': 'AVI', 'video/msvideo': 'AVI', 'video/x-ms-wmv': 'WMV', 'video/3gpp': 'AVI',
    'audio/mpeg': 'AUDIO', 'audio/mp4': 'AUDIO', 'audio/aac': 'AUDIO', 'audio/ogg': 'AUDIO',
    'audio/x-ogg': 'AUDIO', 'audio/wav': 'AUDIO', 'audio/x-wav': 'AUDIO', 'audio/x-flac': 'AUDIO'
};

var VV_SCAN_RX = /(?:https?:)?\/\/[^\s"'`<>\\)\]{}]{4,600}?\.(?:m3u8|mp4|m4v|webm|mkv|flv|f4v)(?:\?[^\s"'`<>\)\]{}]{0,300})?/gi;

var VV = {
    // 构建时由 build.mjs 注入（VV_VERSION 会随改动自动 +1）。
    // 写死版本号是之前"改了还是没生效"的根源：Via 按 @version 判断要不要更新，
    // 版本号不动，装进去的就永远是旧脚本。
    version: (typeof VV_VERSION !== 'undefined' ? VV_VERSION : '0.1.3'),
    build: (typeof VV_BUILD !== 'undefined' ? VV_BUILD : ''),
    items: [],
    seen: {},
    hlsMasters: {},
    hlsVariants: {},
    hlsRoots: {},
    hlsMasterRoots: {},
    badge: null,
    playerActive: false,
    _panelOpen: false,
    uiBuilt: false,
    cfg: {
        enabled: vvGet('enabled', true),
        speed: vvGet('speed', '1.0'),
        // 控制栏自动收起延时。3 秒在手机上偏短：刚要伸手点画质/倍速，栏已经没了。
        // 菜单（底部 sheet）打开期间不计时，见 vvShowCS()。
        autoHide: 4500,
        autoplayNext: vvGet('autoplayNext', false),
        // auto = 有 MSE 用 hls.js；native = 优先系统 HLS；hlsjs = 强制 hls.js
        hlsEngine: vvGet('hlsEngine', 'auto'),
        // 多页并行播放：开启后多个页面可同时播（缓冲与清晰度自动压缩），关闭则只允许一个
        multiPlay: vvGet('multiPlay', false),
        // 标签页休眠：页面切到后台时摘掉原生 <video> 的 src，真正释放 MediaCodec
        hibernate: vvGet('hibernate', true)
    }
};

try { window.__VV_DEBUG__ = VV; } catch (eVV) {}

function vvGet(key, def) {
    try {
        if (typeof GM_getValue === 'function') {
            var v = GM_getValue(key, undefined);
            if (v !== undefined && v !== null) return v;
        }
    } catch (e) {}
    try {
        var s = localStorage.getItem(VV_STORE + key);
        if (s !== null) return JSON.parse(s);
    } catch (e2) {}
    return def;
}

function vvSet(key, val) {
    try {
        if (typeof GM_setValue === 'function') {
            GM_setValue(key, val);
            return;
        }
    } catch (e) {}
    try {
        localStorage.setItem(VV_STORE + key, JSON.stringify(val));
    } catch (e2) {}
}

function vvDel(key) {
    try {
        if (typeof GM_deleteValue === 'function') GM_deleteValue(key);
    } catch (e) {}
    try { localStorage.removeItem(VV_STORE + key); } catch (e2) {}
}

// ---- 跨页签协调专用存储 ----
// 必须走 localStorage，不能走 GM 存储。
// GM_setValue 是脚本级的持久化接口，Via 这类壳里各标签页各自持有一份缓存，
// 别的页签写进去的值本页不一定能立刻读到，更没有 storage 事件；
// 用它做"谁在播 / 请让出解码器"的协调，等于各说各话——多开几个页签就失效。
// localStorage 是同一源共享的存储区，写入立刻对其它页签可见，还能触发 storage 事件。
var VV_SHARED_PREFIX = 'vvs:';

function vvSharedSet(key, val) {
    try {
        localStorage.setItem(VV_SHARED_PREFIX + key, JSON.stringify(val));
        return true;
    } catch (e) { return false; }
}

function vvSharedGet(key, def) {
    try {
        var s = localStorage.getItem(VV_SHARED_PREFIX + key);
        if (s !== null) return JSON.parse(s);
    } catch (e) {}
    return def;
}

// 高频手势（亮度/音量）不要每一帧都写 GM 存储，停下来 500ms 再落盘
function vvSetLazy(key, val) {
    try {
        VV._lazyTimers = VV._lazyTimers || {};
        VV._lazyVals = VV._lazyVals || {};
        VV._lazyVals[key] = val;
        clearTimeout(VV._lazyTimers[key]);
        VV._lazyTimers[key] = setTimeout(function () {
            VV._lazyTimers[key] = null;
            var v = VV._lazyVals[key];
            delete VV._lazyVals[key];
            vvSet(key, v);
        }, 500);
    } catch (e) {}
}

// 关闭播放器/页面隐藏时，把还没落盘的延迟写入立即刷掉
function vvFlushLazy() {
    try {
        var t = VV._lazyTimers || {};
        var vals = VV._lazyVals || {};
        for (var k in t) {
            if (!t[k]) continue;
            clearTimeout(t[k]);
            t[k] = null;
            if (Object.prototype.hasOwnProperty.call(vals, k)) {
                vvSet(k, vals[k]);
                delete vals[k];
            }
        }
    } catch (e) {}
}

function vvGetProgressMap() {
    // 缓存进度表，避免播放中每 10 秒都同步读一次 GM 存储
    if (VV._pmap && typeof VV._pmap === 'object') return VV._pmap;
    var m = vvGet('progress', {});
    if (!m || typeof m !== 'object') m = {};
    VV._pmap = m;
    return m;
}

function vvSaveProgressMap(map) {
    var keys = Object.keys(map);
    if (keys.length > 300) {
        keys.sort(function (a, b) { return (map[a].u || 0) - (map[b].u || 0); });
        var drop = keys.length - 300;
        for (var i = 0; i < drop; i++) delete map[keys[i]];
    }
    VV._pmap = map;
    vvSet('progress', map);
}

function vvEl(tag, cls, html) {
    var d = document.createElement(tag);
    if (cls) d.className = cls;
    if (html !== undefined && html !== null) d.innerHTML = html;
    return d;
}

// 把界面移到 <html> 末尾：同 z-index 时后插入的元素在上，可压过页面广告浮层
// 优先 moveBefore（原子移动，不触发媒体重载/动画重播），旧 WebView 回退 appendChild
function vvBringToFront(el) {
    try {
        var p = document.documentElement;
        if (!el || !p || p.lastElementChild === el) return;
        if (typeof p.moveBefore === 'function') {
            try { p.moveBefore(el, null); return; } catch (eM) {}
        }
        p.appendChild(el);
    } catch (e) {}
}

// 用几个采样点判断浮层是否被页面广告盖住；只在实际被盖住时才重排，避免动画反复重播
function vvIsOccluded(el) {
    try {
        if (!el || !el.getBoundingClientRect || !el.parentNode) return false;
        var r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return false;
        var ix = Math.min(12, r.width / 2);
        var iy = Math.min(12, r.height / 2);
        var pts = [
            [r.left + r.width / 2, r.top + r.height / 2],
            [r.left + ix, r.top + iy],
            [r.right - ix, r.top + iy],
            [r.left + ix, r.bottom - iy],
            [r.right - ix, r.bottom - iy]
        ];
        for (var i = 0; i < pts.length; i++) {
            var t = document.elementFromPoint(pts[i][0], pts[i][1]);
            if (!t) continue;
            if (el === t || el.contains(t)) continue;
            // 插件自己的 toast / 续播提示压在播放器上不算遮挡
            if (t.closest && t.closest('.vv-toast, .vv-save-seek')) continue;
            return true;
        }
    } catch (e) {}
    return false;
}

function vvEscape(s) {
    return String(s === undefined || s === null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function vvFmtTime(sec) {
    // 直播流没有有限时长（duration = Infinity），别让 NaN 漏到界面上；NaN（还没加载完）仍按 0 处理
    if (sec === Infinity || sec === -Infinity) return '直播';
    sec = Math.max(0, Math.floor(sec || 0));
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = sec % 60;
    var mm = (m < 10 ? '0' : '') + m;
    var ss = (s < 10 ? '0' : '') + s;
    if (h > 0) return h + ':' + mm + ':' + ss;
    return mm + ':' + ss;
}

function vvFmtBytes(b) {
    b = Number(b) || 0;
    if (b <= 0) return '0 B';
    if (b < 1024) return Math.round(b) + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    if (b < 1073741824) return (b / 1048576).toFixed(1) + ' MB';
    return (b / 1073741824).toFixed(2) + ' GB';
}

function vvFmtSpeed(kbps) {
    kbps = Number(kbps) || 0;
    if (kbps <= 0) return '';
    if (kbps < 1024) return Math.round(kbps) + ' KB/s';
    return (kbps / 1024).toFixed(1) + ' MB/s';
}

// m3u8/mp4 的通用文件名没有任何信息量：
// 某视频站点所有清单都叫 main.m3u8，直接显示标题栏就是一堆 "main"，用户完全看不出在播什么。
var VV_GENERIC_NAME = /^(?:main|index|master|manifest|playlist|media|video|movie|stream|chunklist|prog_index|out|output|hls|live|default|source|file|test|\d{1,4})$/i;

function vvPageTitle() {
    try {
        var t = (document.title || '').replace(/\s+/g, ' ').trim();
        if (t) return t.slice(0, 60);
    } catch (e) {}
    return '';
}

function vvShortName(item, idx) {
    var nm = item.name || '';
    if (nm && !VV_GENERIC_NAME.test(nm)) return vvEscape(nm);
    // 通用文件名 → 退回页面标题，信息量远大于文件名
    var pt = vvPageTitle();
    if (pt) return vvEscape(pt) + (idx > 0 ? ' #' + (idx + 1) : '');
    var host = '';
    try { host = new URL(item.url).hostname.replace(/^www\./, ''); } catch (e) { host = ''; }
    if (!host) host = '页面流';
    return '【' + (VV_TYPE_CN[item.type] || '视频') + '】' + (idx + 1) + ' · ' + host;
}

function vvAbsUrl(u, base) {
    try { return new URL(u, base || location.href).href; } catch (e) { return u; }
}

function vvHlsRoot(u) {
    try {
        var x = new URL(u);
        var p = x.pathname || '';
        var i = p.lastIndexOf('/');
        return x.origin + p.slice(0, i + 1);
    } catch (e) { return ''; }
}

// HLS 的 fMP4 分片常叫 main.mp4 / init.mp4 / seg-1.mp4 / 0001.mp4。
// 只看扩展名会把它们当成独立 mp4 视频，必须结合已知的 m3u8 目录过滤。
function vvIsHlsSegmentUrl(u) {
    try {
        var x = new URL(u);
        var p = x.pathname || '';
        var file = p.slice(p.lastIndexOf('/') + 1).toLowerCase();
        if (!/\.(?:mp4|m4s|m4a|aac|ts)$/.test(file)) return false;
        var named = /^(?:init|main|seg|segment|chunk|frag|fragment|part|index|video|audio|media|file|out)[-_]?\d*\.(?:mp4|m4s|m4a|aac|ts)$/.test(file);
        if (!named && !/^\d+\.(?:mp4|m4s|m4a|aac|ts)$/.test(file)) return false;
        var roots = VV.hlsRoots || {};
        var originRoot = x.origin + '/';
        for (var root in roots) {
            if (!root || u.indexOf(root) !== 0) continue;
            // 根目录只过滤子目录里的分片；同目录的 main.mp4 可能是普通视频
            if (root === originRoot && u.slice(root.length).indexOf('/') < 0) continue;
            return true;
        }
    } catch (e) {}
    return false;
}

// 媒体清单（#EXTINF）如果位于已知主清单目录的子目录，或名字像变体清单，就不再单独展示
function vvLooksLikeHlsVariant(item) {
    try {
        var u = item && item.url;
        if (!u) return false;
        var roots = VV.hlsRoots || {};
        for (var root in roots) {
            if (!root || u.indexOf(root) !== 0) continue;
            var rest = u.slice(root.length);
            var file = rest.slice(rest.lastIndexOf('/') + 1).toLowerCase();
            if (rest.indexOf('/') >= 0) return true;
            if (/^(?:index|prog_index|playlist|media|main|video|audio|stream|chunklist|\d{3,4}p(?:\d+)?)[-_]?\d*\.m3u8$/.test(file)) return true;
        }
    } catch (e) {}
    return false;
}

function vvDropItemsUnderMaster(root) {
    if (!root) return;
    var changed = false;
    for (var i = VV.items.length - 1; i >= 0; i--) {
        var it = VV.items[i];
        if (!it || !it.url || it.url.indexOf(root) !== 0) continue;
        var drop = it.type === 'HLS' ? vvIsHlsVariantUnderMaster(it) : vvIsHlsSegmentUrl(it.url);
        if (drop) {
            VV.items.splice(i, 1);
            delete VV.seen[it.url];
            changed = true;
        }
    }
    if (changed) {
        try { if (vvUI && vvUI.panel && VV._panelOpen) vvRenderPanel(vvUI.panel); } catch (e0) {}
        try { if (VV.items.length) vvShowBadgeNew(); } catch (e1) {}
    }
}

// 已知主清单目录下的子目录清单，或同目录的 720p/index 等，视为变体
function vvIsHlsVariantUnderMaster(item) {
    try {
        var u = item && item.url;
        if (!u) return false;
        var own = vvHlsRoot(u);
        var file = u.split('?')[0].split('#')[0];
        file = file.slice(file.lastIndexOf('/') + 1).toLowerCase();
        // 另一个主清单不要误杀
        if (/^(?:master|manifest|playlist)\.m3u8$/.test(file)) return false;
        var masters = VV.hlsMasterRoots || {};
        for (var root in masters) {
            if (!root || u.indexOf(root) !== 0) continue;
            if (root !== own) return true;
        }
        if (masters[own]) {
            if (/^(?:index|prog_index|playlist|media|main|video|audio|stream|chunklist|\d{3,4}p(?:\d+)?)[-_]?\d*\.m3u8$/.test(file)) return true;
        }
    } catch (e) {}
    return false;
}

// 解析 master m3u8，记录各码率子清单，避免播放列表里出现一堆同名变体
function vvNoteHlsBody(item, text, base) {
    if (!item || item.type !== 'HLS' || !text || text.length > 600000) return;
    var t = String(text);
    if (t.indexOf('#EXT-X-STREAM-INF') >= 0) {
        VV.hlsMasters[item.url] = true;
        var mroot = vvHlsRoot(item.url);
        if (mroot) {
            VV.hlsMasterRoots = VV.hlsMasterRoots || {};
            VV.hlsMasterRoots[mroot] = 1;
            vvDropItemsUnderMaster(mroot);
        }
        var lines = t.split(/\r?\n/);
        var expect = false;
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line) continue;
            // 音轨/字幕/iframe 清单也属于主清单，不单独展示
            if (line.indexOf('#EXT-X-MEDIA:') === 0 || line.indexOf('#EXT-X-I-FRAME-STREAM-INF:') === 0) {
                var um = /URI="([^"]+)"/i.exec(line);
                if (um) {
                    var mu = vvAbsUrl(um[1], base || item.url);
                    VV.hlsVariants[mu] = item.url;
                    vvDropItemByUrl(mu);
                }
                continue;
            }
            if (line.indexOf('#EXT-X-STREAM-INF') === 0) { expect = true; continue; }
            if (line.charAt(0) === '#') continue;
            if (expect) {
                expect = false;
                var abs = vvAbsUrl(line, base || item.url);
                if (/\.m3u8(?:[?#]|$)/i.test(abs)) {
                    VV.hlsVariants[abs] = item.url;
                    vvDropItemByUrl(abs);
                }
            }
        }
        return;
    }
    // 媒体清单：hls.js 会加载 prog_index / chunklist 等子清单，
    // 若它位于已知主清单目录下，标记为变体并移除，避免列表刷屏
    if (t.indexOf('#EXTINF') >= 0 && vvLooksLikeHlsVariant(item)) {
        VV.hlsVariants[item.url] = true;
        vvDropItemByUrl(item.url);
        return;
    }
    if (VV.hlsVariants[item.url]) return;
}

function vvDropItemByUrl(url) {
    var changed = false;
    for (var i = VV.items.length - 1; i >= 0; i--) {
        if (VV.items[i].url === url) {
            VV.items.splice(i, 1);
            delete VV.seen[url];
            changed = true;
        }
    }
    if (changed) {
        try { if (vvUI && vvUI.panel && VV._panelOpen) vvRenderPanel(vvUI.panel); } catch (e0) {}
        try { if (VV.items.length) vvShowBadgeNew(); } catch (e1) {}
    }
}

function vvResolve(rawUrl, contentType) {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    var u = rawUrl.trim();
    if (!u || u.length > 2048) return null;
    if (u.indexOf('data:') === 0 || u.indexOf('javascript:') === 0 || u.indexOf('about:') === 0) return null;
    if (u.indexOf('blob:') === 0) {
        return { url: u, type: 'BLOB', name: '' };
    }
    if (u.indexOf('//') === 0) u = location.protocol + u;
    var lo = u.toLowerCase();
    if (lo.indexOf('http://') !== 0 && lo.indexOf('https://') !== 0) {
        // 站内相对地址（<video src="/v/1.mp4">）按当前页面补全
        try {
            var abs = new URL(u, location.href);
            if (abs.protocol === 'http:' || abs.protocol === 'https:') u = abs.href;
        } catch (eAbs) {}
        lo = u.toLowerCase();
    }
    if (lo.indexOf('http://') !== 0 && lo.indexOf('https://') !== 0) return null;

    var type = null;
    var ct = (contentType || '').split(';')[0].trim().toLowerCase();
    if (ct) type = VV_CT_TYPE[ct] || null;

    var qMark = u.indexOf('#');
    var path = qMark >= 0 ? u.slice(0, qMark) : u;
    var qPos = path.indexOf('?');
    var pathOnly = qPos >= 0 ? path.slice(0, qPos) : path;
    var segIdx = pathOnly.lastIndexOf('/');
    var file = pathOnly.slice(segIdx + 1);
    var dotIdx = file.lastIndexOf('.');
    var ext = dotIdx > 0 ? file.slice(dotIdx + 1).toLowerCase() : '';
    var stem = dotIdx > 0 ? file.slice(0, dotIdx) : '';
    var name = '';
    try { name = stem ? decodeURIComponent(stem) : ''; } catch (e3) { name = stem; }
    // 有些 HLS 地址以 /.m3u8 结尾（如 Unified Streaming），用上级目录名当标题
    if (!name && segIdx > 0) {
        var parent = pathOnly.slice(0, segIdx).split('/').pop() || '';
        try { parent = decodeURIComponent(parent); } catch (eP) {}
        name = parent.replace(/\.(?:ism|mpd|m3u8)$/i, '');
    }

    if (!type && ext) type = VV_EXT_TYPE[ext] || null;
    if (!type && qPos >= 0) {
        var parts = path.slice(qPos + 1);
        var dec = parts;
        try { dec = decodeURIComponent(parts); } catch (e4) {}
        var mm = /(?:https?|%68%74%74%70)[^\s&"']{8,}?\.m3u8[^\s&"']{0,200}/i.exec(dec);
        if (mm) {
            var mu = mm[0].replace(/\\u002f/gi, '/').replace(/\\u0026/gi, '&');
            return vvResolve(mu, null);
        }
    }
    if (!type) return null;
    if (ext === 'ts' || ext === 'm4s' || ext === 'key') return null;

    var host = '';
    try { host = new URL(u).hostname.replace(/^www\./, ''); } catch (e5) { host = u.slice(0, 30); }
    if (!name) name = host;

    return { url: u, type: type, name: name.slice(-60), host: host };
}

// 是否是"纯音频"的 HLS 清单（只有声音没有画面）。
// 某视频站点这类站点会同时吐出 /asp/hls/…（视频）、/asp/hlsaudio/…（音轨）、
// /asp/audio/…/mp3/…（音频）多个主清单，点错就变黑屏，必须在列表里降权。
function vvLooksLikeAudioHls(url) {
    var p = String(url || '').toLowerCase();
    if (p.indexOf('.m3u8') < 0) return false;
    var path = p.split('?')[0];
    var segs = path.split('/');
    for (var i = 0; i < segs.length; i++) {
        var s = segs[i];
        if (!s || s === 'main.m3u8' || s === 'index.m3u8' || s === 'playlist.m3u8') continue;
        if (/(?:^|[-_.])(?:audio|mp3|aac|audioonly)(?:$|[-_.])/.test(s)) return true;
        if (/^(?:hlsaudio|audioonly|audio_stream|audio-stream|audiom3u8)$/.test(s)) return true;
    }
    return false;
}

// 列表排序权重：越小越可信、越靠前。
// 嗅探是异步的，条目到达顺序随机；不能靠到达先后决定谁在第一位，
// 否则用户默认点到的可能是音轨清单或 blob 死链。
function vvItemRank(item) {
    if (!item) return 9;
    if (item.type === 'BLOB') return 9;
    if (item.type === 'AUDIO') return 4;
    if (item.type === 'HLS') return vvLooksLikeAudioHls(item.url) ? 3 : 1;
    // mp4 / webm / mkv 等直链最可信
    return 0;
}

function vvPushItem(item) {
    if (!item || !item.url || VV.seen[item.url]) return false;
    if (!VV.cfg.enabled || VV.cfg.siteOff) return false;
    if (item.type === 'HLS') {
        var hroot = vvHlsRoot(item.url);
        if (hroot) {
            VV.hlsRoots = VV.hlsRoots || {};
            VV.hlsRoots[hroot] = 1;
        }
        if (VV.hlsVariants[item.url]) return false;
        // 主清单 body 读不到时（CORS/代理），靠主清单文件名登记目录，
        // 后续同目录子目录里的 prog_index / chunklist 就不会刷屏
        var hfile = item.url.split('?')[0].split('#')[0];
        hfile = hfile.slice(hfile.lastIndexOf('/') + 1).toLowerCase();
        if (/^(?:master|manifest|playlist)\.m3u8$/.test(hfile) && hroot) {
            VV.hlsMasterRoots = VV.hlsMasterRoots || {};
            VV.hlsMasterRoots[hroot] = 1;
            vvDropItemsUnderMaster(hroot);
        }
        if (vvIsHlsVariantUnderMaster(item)) return false;
    } else if (vvIsHlsSegmentUrl(item.url)) {
        return false;
    }
    if (item.type === 'BLOB') {
        // 原生流只保留最新一条，避免 MSE 反复建流刷屏
        for (var bi = VV.items.length - 1; bi >= 0; bi--) {
            if (VV.items[bi].type === 'BLOB') {
                delete VV.seen[VV.items[bi].url];
                VV.items.splice(bi, 1);
            }
        }
    }
    VV.seen[item.url] = true;
    item.foundAt = Date.now();
    item.uid = 'vv' + (Date.now().toString(36)) + (Math.random() * 1e6 | 0).toString(36);
    // 按"可信度"插入，而不是永远插到最前：
    // 嗅探到达顺序是随机的（某视频站点两次加载，首条可能在 enc / hlsaudio 之间跳），
    // 若按到达顺序排，用户点第一条就可能点到纯音频清单（黑屏）或 blob 死链。
    // 规则：rank 小的靠前；同 rank 内新的在前（保持原有的"最近发现"直觉）。
    var myRank = vvItemRank(item);
    var at = VV.items.length;
    for (var bj = 0; bj < VV.items.length; bj++) {
        if (vvItemRank(VV.items[bj]) > myRank) { at = bj; break; }
    }
    VV.items.splice(at, 0, item);
    if (VV.items.length > 60) {
        var old = VV.items.pop();
        delete VV.seen[old.url];
    }
    try { if (vvUI && vvUI.panel && VV._panelOpen) vvRenderPanel(vvUI.panel); } catch (eR) {}
    vvShowBadgeNew();
    return true;
}

function vvScanText(text, source) {
    if (!text || text.length > 600000) return;
    // 先做低成本预检，绝大多数 API 文本不含视频扩展名，直接跳过昂贵的正则
    if (text.indexOf('.m3u8') < 0 && text.indexOf('.mp4') < 0 && text.indexOf('.m4v') < 0 &&
        text.indexOf('.webm') < 0 && text.indexOf('.mkv') < 0 && text.indexOf('.flv') < 0 &&
        text.indexOf('.f4v') < 0) return;
    var hits = 0;
    var m;
    VV_SCAN_RX.lastIndex = 0;
    while ((m = VV_SCAN_RX.exec(text)) !== null) {
        var r = vvResolve(m[0].replace(/\\u002f/gi, '/').replace(/\\u0026/gi, '&'), null);
        if (r) {
            if (source && r.name.length < 3) r.name += ' (' + source + ')';
            vvPushItem(r);
            hits++;
        }
        if (hits >= 5) break;
    }
    if (hits >= 5) VV_SCAN_RX.lastIndex = 0;
}

function vvToast(msg, long) {
    try {
        var t = document.getElementById('vv-toast');
        if (!t) {
            t = vvEl('div', '', '');
            t.id = 'vv-toast';
            document.documentElement.appendChild(t);
        }
        t.innerHTML = vvEscape(msg);
        t.className = 'vv-toast' + (long ? ' show-long' : '') + ' show';
        vvBringToFront(t);
        clearTimeout(t._tm);
        t._tm = setTimeout(function () {
            t.className = 'vv-toast';
        }, long ? 4200 : 2200);
    } catch (e) {}
}
