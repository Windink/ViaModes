if (window.top !== window.self) { throw new Error('via-vp: iframe skip'); }

var VV_PROTO = location.protocol;
if (VV_PROTO !== 'http:' && VV_PROTO !== 'https:') { throw new Error('via-vp: scheme skip'); }

var vvSiteKey = 'offsite:' + location.hostname;
var vvSiteOff = vvGet(vvSiteKey, false);
VV.cfg.siteOff = vvSiteOff;

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
        var r = vvResolve(xhr._vvUrl || '', xhr.getResponseHeader && xhr.getResponseHeader('Content-Type') || '');
        if (r) {
            if (r.type === 'HLS') {
                try { vvNoteHlsBody(r, xhr.responseText || '', xhr.responseURL || xhr._vvUrl); } catch (eH) {}
            }
            vvPushItem(r);
            return;
        }
        if (rt === 'json') {            if (xhr.response) vvScanText(JSON.stringify(xhr.response), 'api');
        } else if (rt === '' || rt === 'text') {
            var txt = xhr.responseText;
            if (txt && txt.length < 600000) vvScanText(txt, null);
        }
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
                    var r = vvResolve(resp && resp.url || inputUrl, ct);
                    if (r) {
                        if (r.type === 'HLS') {
                            try {
                                resp.clone().text().then(function (t) {
                                    try { vvNoteHlsBody(r, t, resp.url || inputUrl); } catch (eH) {}
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
                    if (ct && (ct.indexOf('json') >= 0 || ct.indexOf('text') === 0 || ct === '')) {
                        resp.clone().text().then(function (t) { if (t && t.length < 600000) vvScanText(t, null); }).catch(function () {});
                    }
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
        if (node.querySelectorAll) {
            try {
                var vids = node.querySelectorAll('video,source');
                for (var i = 0; i < vids.length; i++) vvCheckMediaNode(vids[i]);
            } catch (e3) {}
        }
    }
}

function vvCheckMediaNode(n) {
    try {
        var tag = n.tagName ? n.tagName.toLowerCase() : '';
        var u = '';
        if (tag === 'video' || tag === 'source') u = n.getAttribute('src') || n.src || '';
        else if (tag === 'a') u = n.getAttribute('href') || '';
        if (!u) return;
        var r = vvResolve(u, '');
        if (r && vvPushItem(r) && tag === 'video' && n.currentSrc && n.currentSrc.indexOf('blob:') === 0) {
            vvPushItem(vvResolve(n.currentSrc, ''));
        }
        if (tag === 'video') vvWatchVideoEl(n);
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

function vvDrainMoQueue() {
    VV._moTimer = null;
    // 播放中不再扫描新增节点，把 CPU 让给视频解码；关闭播放器时会全页补扫一次
    if (VV.playerActive) { vvMoQueue = []; return; }
    var q = vvMoQueue;
    vvMoQueue = [];
    var n = Math.min(q.length, 120);
    for (var i = 0; i < n; i++) vvScanNode(q[i]);
    if (q.length > n) {
        // 广告/瀑布流页面一次可能新增大量节点，分批处理，避免单帧长时间占用主线程
        vvMoQueue = q.slice(n).concat(vvMoQueue);
        VV._moTimer = setTimeout(vvDrainMoQueue, 120);
    }
}

if (window.MutationObserver) {
    var vvMO = new MutationObserver(function (muts) {
        if (VV.playerActive) return; // 播放中挂起节点嗅探
        for (var i = 0; i < muts.length; i++) {
            var m = muts[i];
            if (m.type === 'attributes') {
                vvCheckMediaNode(m.target);
                continue;
            }
            for (var j = 0; j < m.addedNodes.length; j++) {
                var node = m.addedNodes[j];
                if (node && node.nodeType === 1) vvMoQueue.push(node);
            }
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
