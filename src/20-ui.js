var vvUI = { badge: null, panel: null };

// 分享 / 选集浮层与页内小窗都和面板同级（z-index 都是 2147483647），
// 谁在 DOM 末尾谁就盖住谁。面板的定时置顶巡检不能在有这些层时抢顶，
// 否则从面板点「导出」打开的浮层会在 2 秒后被整块盖住，看着像界面自己关了。
function vvHasPriorityOverlay() {
    try {
        if (document.getElementById('vv-share-wrap')) return true;
        var ep = document.getElementById('vv-ep-wrap');
        if (ep && ep.classList.contains('open')) return true;
        if (VV._mini) return true;
    } catch (e) {}
    return false;
}

function vvAddCss(css) {
    try {
        if (typeof GM_addStyle === 'function') { GM_addStyle(css); return; }
    } catch (e) {}
    try {
        var st = document.createElement('style');
        st.innerHTML = css;
        document.documentElement.appendChild(st);
    } catch (e2) {}
}

function vvEnsureStyle() {
    if (VV._cssDone) return;
    if (!document.documentElement) return;
    vvAddCss(VV_CSS);
    VV._cssDone = true;
}

function vvBadge() {
    vvEnsureStyle();
    if (!vvUI.badge) {
        var b = vvEl('div', 'vv-badge');
        b.id = 'vv-badge';
        b.innerHTML = '<div class="vv-badge-play"></div><div class="vv-badge-num"></div>';
        b.addEventListener('touchstart', function (e) {
            var t = e.touches[0];
            b._touching = true;
            b._sx = t.clientX; b._sy = t.clientY; b._moved = false;
            b._longPressed = false;
            // 长按 0.7 秒打开资源自检。Via 不一定注册 GM 菜单，
            // 所以这里留一条不依赖任何 GM API 的入口。
            try { clearTimeout(b._lpTimer); } catch (eLP) {}
            b._lpTimer = setTimeout(function () {
                if (b._touching && !b._moved) {
                    b._longPressed = true;
                    b._touching = false;
                    try { vvReleaseAudit(); } catch (eA) {}
                }
            }, 700);
        }, { passive: true });
        b.addEventListener('touchmove', function (e) {
            var t = e.touches[0];
            if (Math.abs(t.clientX - b._sx) > 6 || Math.abs(t.clientY - b._sy) > 6) b._moved = true;
            if (b._moved) {
                var x = Math.max(4, Math.min(window.innerWidth - 50, t.clientX - 23));
                var y = Math.max(4, Math.min(window.innerHeight - 60, t.clientY - 23));
                b.style.left = x + 'px';
                b.style.top = y + 'px';
                b.style.right = 'auto';
                b.style.bottom = 'auto';
            }
        }, { passive: true });
        b.addEventListener('touchend', function () {
            b._touching = false;
            try { clearTimeout(b._lpTimer); } catch (eLP2) {}
            if (b._longPressed) return;
            if (b._moved) {
                var x = parseFloat(b.style.left || 0);
                b._dragged = true;
                b.style.left = '';
                b.style.top = '';
                b.style.right = '';
                b.style.bottom = '';
                b.setAttribute('data-pos', x > window.innerWidth / 2 ? 'r' : 'l');
                vvBadgePos(b);
            }
        });
        b.addEventListener('click', function () {
            if (b._dragged) { b._dragged = false; return; }
            // 长按刚弹过自检，松手带来的这次 click 要吞掉
            if (b._longPressed) { b._longPressed = false; return; }
            vvOpenPanel();
        });
        document.documentElement.appendChild(b);
        vvUI.badge = b;
        vvBadgePos(b);
    }
    return vvUI.badge;
}

function vvBadgePos(b) {
    var pos = b.getAttribute('data-pos') || vvGet('badgePos', 'r');
    if (pos === 'l') { b.style.left = '10px'; b.style.bottom = '30%'; b.style.right = 'auto'; }
    else { b.style.right = '10px'; b.style.bottom = '30%'; b.style.left = 'auto'; }
}

function vvKeepBadgeTop(b) {
    if (VV._badgeTopTimer) return;
    VV._badgeTopTimer = setInterval(function () {
        try {
            if (VV.playerActive || !VV.items.length || !b.classList.contains('show') || !b.parentNode) {
                clearInterval(VV._badgeTopTimer);
                VV._badgeTopTimer = null;
                return;
            }
            // 页面可能在播放中不断插入广告浮层，被盖住时才把角标重新压到最上层
            if (vvHasPriorityOverlay()) return;
            if (!b._touching && vvIsOccluded(b)) vvBringToFront(b);
        } catch (e) {
            clearInterval(VV._badgeTopTimer);
            VV._badgeTopTimer = null;
        }
    }, 2500);
}

function vvStopBadgeTop() {
    try {
        if (VV._badgeTopTimer) { clearInterval(VV._badgeTopTimer); VV._badgeTopTimer = null; }
    } catch (e) {}
}

function vvKeepPanelTop(w) {
    if (VV._panelTopTimer) return;
    VV._panelTopTimer = setInterval(function () {
        try {
            if (!w.classList.contains('open') || !w.parentNode) {
                clearInterval(VV._panelTopTimer);
                VV._panelTopTimer = null;
                return;
            }
            if (vvHasPriorityOverlay()) return;
            if (!w._touching && vvIsOccluded(w)) vvBringToFront(w);
        } catch (e) {
            clearInterval(VV._panelTopTimer);
            VV._panelTopTimer = null;
        }
    }, 2500);
}

function vvStopPanelTop() {
    try {
        if (VV._panelTopTimer) { clearInterval(VV._panelTopTimer); VV._panelTopTimer = null; }
    } catch (e) {}
}

function vvShowBadgeNew() {
    // 分享 / 选集浮层开着时别把角标放出来：它同样挂在 <html> 末尾且 z-index 同级
    if (VV.items.length === 0 || VV.playerActive || VV._panelOpen || vvHasPriorityOverlay()) return;
    try {
        var b = vvBadge();
        var num = b.querySelector('.vv-badge-num');
        if (num) num.innerHTML = String(VV.items.length);
        vvBringToFront(b);
        b.classList.add('show');
        vvKeepBadgeTop(b);
    } catch (e) {}
}

function vvToggleBadge(show) {
    try {
        var b = vvBadge();
        if (show) {
            if (vvHasPriorityOverlay()) return;
            vvBringToFront(b);
            b.classList.add('show');
            vvKeepBadgeTop(b);
        } else {
            b.classList.remove('show');
            vvStopBadgeTop();
        }
    } catch (e) {}
}

function vvOpenPanel() {
    // 打开面板时补扫一次资源计时，能看到脚本注入前/页面自行加载的媒体
    try { vvScanPerf(); } catch (eP) {}
    if (!VV.items.length) { vvToast('暂无嗅探结果，先播放一下视频'); return; }
    try { vvEnsurePanel().open(); } catch (e) {}
}

function vvEnsurePanel() {
    vvEnsureStyle();
    if (vvUI.panel) return vvUI.panel;
    var wrap = vvEl('div', 'vv-panel-wrap');
    wrap.id = 'vv-panel-wrap';
    var panel = vvEl('div', 'vv-panel');
    var head = vvEl('div', 'vv-head');
    var title = vvEl('div', 'vv-head-title', '视频嗅探');
    var btnEp = vvEl('button', 'vv-head-btn', '选集');
    var btnScan = vvEl('button', 'vv-head-btn', '刷新');
    var btnClear = vvEl('button', 'vv-head-btn', '清空');
    var btnClose = vvEl('button', 'vv-head-btn');
    btnClose.innerHTML = vvIcon('close', 14);
    btnClose.setAttribute('aria-label', '关闭');
    btnClose.title = '关闭';
    head.appendChild(title);
    head.appendChild(btnEp);
    head.appendChild(btnScan);
    head.appendChild(btnClear);
    head.appendChild(btnClose);
    var note = vvEl('div', 'vv-prefix-note', '播放进内置播放器 · 下载 · 导出给外部播放器');
    var list = vvEl('div', 'vv-list');
    panel.appendChild(head);
    panel.appendChild(note);
    panel.appendChild(list);
    wrap.appendChild(panel);
    document.documentElement.appendChild(wrap);
    wrap.addEventListener('touchstart', function () { wrap._touching = true; }, { passive: true });
    wrap.addEventListener('touchend', function () { wrap._touching = false; }, { passive: true });
    wrap.addEventListener('touchcancel', function () { wrap._touching = false; }, { passive: true });

    var api = {
        wrap: wrap,
        list: list,
        title: title,
        open: function () {
            try {
                if (!document.getElementById('vv-panel-wrap')) document.documentElement.appendChild(wrap);
                vvRenderPanel(api);
                vvBringToFront(wrap);
                wrap.classList.add('open');
                vvKeepPanelTop(wrap);
                vvToggleBadge(false);
                VV._panelOpen = true;
            } catch (e) {}
        },
        close: function () {
            wrap.classList.remove('open');
            vvStopPanelTop();
            VV._panelOpen = false;
            if (VV.items.length && !VV.playerActive) vvToggleBadge(true);
        },
        refresh: function () {
            vvToast('正在重新扫描页面...');
            vvScanDOM();
            try { vvScanPerf(); } catch (eP) {}
            setTimeout(function () { vvShowBadgeNew(); vvRenderPanel(api); }, 700);
        },
        clear: function () {
            VV.items.length = 0;
            VV.seen = {};
            vvRenderPanel(api);
            vvToast('已清空');
        }
    };
    btnEp.addEventListener('click', function () { vvEpisodesOpen(); });
    btnScan.addEventListener('click', api.refresh);
    btnClear.addEventListener('click', api.clear);
    btnClose.addEventListener('click', api.close);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) api.close(); });
    vvUI.panel = api;
    return api;
}

function vvRenderPanel(api) {
    var count = VV.items.length;
    api.title.innerHTML = '视频嗅探（' + count + '）';
    api.list.innerHTML = '';
    if (!count) {
        api.list.innerHTML = '<div class="vv-empty">暂未嗅探到视频<br>播放一下网页里的视频再试试</div>';
        return;
    }
    var frag = document.createDocumentFragment();
    VV.items.forEach(function (item, idx) {
        var row = vvEl('div', 'vv-row');
        try { row.setAttribute('data-url', item.url || ''); } catch (eU) {}
        try { row.setAttribute('data-type', item.type || ''); } catch (eT) {}
        var info = vvEl('div', 'vv-row-info');
        var sub = '';
        try { if (item.url) sub = new URL(item.url).hostname.replace(/^www\./, ''); } catch (e) { sub = ''; }
        // 音轨清单要显式标出来，否则用户分不清为什么点开只有声音
        var tagText = VV_TYPE_CN[item.type] || '视频';
        if (item.type === 'HLS' && vvLooksLikeAudioHls(item.url)) tagText = 'm3u8·音轨';
        info.innerHTML =
            '<div class="vv-row-name">' + vvShortName(item, idx) + '</div>' +
            '<div class="vv-row-tags"><span class="vv-tag ' + item.type + '">' + tagText + '</span></div>' +
            '<div class="vv-row-sub">' + vvEscape(sub) + '</div>';
        var acts = vvEl('div', 'vv-row-acts');
        var btnDl = vvEl('button', 'vv-btn-mini');
        var btnCopy = vvEl('button', 'vv-btn-mini');
        var btnPlay = vvEl('button', 'vv-btn-play');
        btnDl.innerHTML = vvIcon('dl', 15);
        btnCopy.innerHTML = vvIcon('link', 15);
        btnPlay.innerHTML = vvIcon('play', 16);
        btnDl.title = '下载';
        btnCopy.title = '导出';
        // title 是诊断脚本找播放键的兜底路径（它们用 textContent + title 做正则）；
        // 换成纯 SVG 后 textContent 为空，这里必须补上。
        btnPlay.title = '播放';
        btnDl.setAttribute('aria-label', '下载');
        btnCopy.setAttribute('aria-label', '导出给外部播放器');
        btnPlay.setAttribute('aria-label', '播放');
        btnPlay.addEventListener('click', function () {
            api.close();
            setTimeout(function () { openPlayer(item); }, 180);
        });
        btnDl.addEventListener('click', function () { vvDownloadItem(item); });
        btnCopy.addEventListener('click', function () { vvShareOpen(item); });
        acts.appendChild(btnDl);
        acts.appendChild(btnCopy);
        acts.appendChild(btnPlay);
        row.appendChild(info);
        row.appendChild(acts);
        frag.appendChild(row);
    });
    api.list.appendChild(frag);
}

function vvCopy(text) {
    try {
        if (typeof GM_setClipboard === 'function') { GM_setClipboard(text); return; }
    } catch (e) {}
    try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-999px;top:0';
        document.documentElement.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.documentElement.removeChild(ta);
    } catch (e2) {}
}

function vvDownloadItem(item) {
    if (item.type === 'BLOB') { vvToast('这类原生流暂不支持下载，可录屏保存', true); return; }
    if (item.type === 'HLS') {
        vvShareOpen(item);
        vvToast('m3u8 无法直接下载，请导出 .m3u 或用 curl 拉取', true);
        return;
    }
    if (typeof GM_download === 'function') {
        try {
            var fname = vvSafeName(item.name || ('via-video-' + Date.now()));
            if (fname.indexOf('.') < 0) fname += '.mp4';
            GM_download({
                url: item.url,
                name: fname,
                headers: { Referer: location.href },
                onload: function () { vvToast('已交给 Via 下载'); },
                onerror: function (err) { vvToast('下载失败：' + ((err && err.error) || '未知'), true); }
            });
            vvToast('已交给 Via 下载');
            return;
        } catch (e) {}
    }
    try {
        var a = document.createElement('a');
        a.href = item.url;
        a.download = vvSafeName(item.name || 'video');
        a.target = '_blank';
        a.rel = 'noopener';
        document.documentElement.appendChild(a);
        a.click();
        setTimeout(function () { try { document.documentElement.removeChild(a); } catch (eX) {} }, 200);
        vvToast('已触发浏览器下载');
    } catch (e2) {
        vvCopy(item.url);
        vvToast('下载失败，链接已复制', true);
    }
}

function vvSafeName(name) {
    var s = String(name || '').replace(/[\\\/:*?"<>|]/g, '_').trim();
    if (s.length > 60) s = s.slice(0, 60);
    return s || ('video_' + Date.now());
}
