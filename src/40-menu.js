function vvSetupMenu() {
    if (typeof GM_registerMenuCommand !== 'function') return;
    try {
        GM_registerMenuCommand('嗅探结果面板', function () { vvOpenPanel(); });
        GM_registerMenuCommand('开启/关闭嗅探（全局）', vvToggleGlobal);
        GM_registerMenuCommand('本站启用/禁用嗅探', vvToggleSite);
        GM_registerMenuCommand('默认倍速（点击切换）', vvCycleSpeed);
        GM_registerMenuCommand('重建播放实例（解码失败/卡死时用）', vvRebuildMedia);
        GM_registerMenuCommand('多页并行播放（当前：' + (VV.cfg.multiPlay ? '开' : '关') + '）', vvToggleMultiPlay);
        GM_registerMenuCommand('后台释放解码器 / 标签页休眠（当前：' + (VV.cfg.hibernate ? '开' : '关') + '）', vvToggleHibernate);
        GM_registerMenuCommand('强制关闭播放器（页面卡死时用）', vvForceClose);
        GM_registerMenuCommand('资源释放自检（退出后卡顿/不释放时用）', vvReleaseAudit);
        GM_registerMenuCommand('立即强制释放播放器资源', vvForceRelease);
        GM_registerMenuCommand('清除所有播放进度', vvClearProgress);
        GM_registerMenuCommand('自检（排查未生效）', vvSelfCheck);
        GM_registerMenuCommand('关于', vvAbout);
    } catch (e) {}
}

function vvToggleGlobal() {
    VV.cfg.enabled = !VV.cfg.enabled;
    vvSet('enabled', VV.cfg.enabled);
    if (VV.cfg.enabled) vvToast('嗅探已开启，刷新页面生效', true);
    else {
        VV.items.length = 0;
        VV.seen = {};
        try { vvToggleBadge(false); } catch (e) {}
        vvToast('嗅探已关闭，刷新页面生效', true);
    }
}

function vvToggleSite() {
    var key = 'offsite:' + location.hostname;
    var off = vvGet(key, false);
    vvSet(key, !off);
    VV.cfg.siteOff = !off;
    vvToast((off ? '本站嗅探已开启' : '本站嗅探已禁用') + '，刷新页面生效', true);
}

function vvCycleSpeed() {
    var opts = [1, 1.25, 1.5, 2, 3];
    var cur = parseFloat(VV.cfg.speed) || 1;
    var idx = opts.indexOf(cur);
    var next = opts[(idx + 1 + opts.length) % opts.length];
    VV.cfg.speed = next;
    vvSet('speed', String(next));
    vvToast('默认倍速：' + (next === 1 ? '正常' : next + 'x') + '（打开播放器时生效）', true);
}

function vvToggleHibernate() {
    VV.cfg.hibernate = !VV.cfg.hibernate;
    vvSet('hibernate', VV.cfg.hibernate);
    if (VV.cfg.hibernate) {
        vvToast('已开启标签页休眠：切到后台时释放视频解码器，回来自动恢复进度', true);
    } else {
        vvToast('已关闭标签页休眠：后台页面将继续占用解码器', true);
    }
}

function vvClearProgress() {
    vvSet('progress', {});
    VV._pmap = {};
    vvToast('播放进度已清空');
}

function vvSelfCheck() {
    var L = [];
    L.push('脚本已加载 ✓');
    L.push('页面: ' + location.href.slice(0, 60));
    L.push('本站嗅探: ' + (VV.cfg.siteOff ? '被禁用！(菜单里启用)' : '正常'));
    L.push('全局嗅探: ' + (VV.cfg.enabled ? '正常' : '被关闭！(菜单里开启)'));
    try { L.push('XHR 钩子: ' + (String(XMLHttpRequest.prototype.open).indexOf('_vvUrl') >= 0 ? '已装 ✓' : '未生效 ✗')); } catch (e) { L.push('XHR 钩子: 异常'); }
    try { L.push('hls.js: ' + (window.Hls && Hls.isSupported() ? '内置可用' : '缺失(仅影响m3u8)')); } catch (e2) { L.push('hls.js: 异常'); }
    try { L.push('资源计时: ' + (window.PerformanceObserver ? 'PerformanceObserver 已启用' : '定时补扫')); } catch (e6) {}
    try { L.push('GM API: ' + ['GM_getValue', 'GM_download', 'GM_xmlhttpRequest'].filter(function (f) { return eval('typeof ' + f) === 'function'; }).length + '/3 可用'); } catch (e3) {}
    L.push('嗅探记录: ' + VV.items.length + ' 条');
    try { L.push('页内 <video>: ' + document.querySelectorAll('video').length + ' 个'); } catch (e4) {}
    if (VV._moTimer !== undefined) L.push('DOM 监听: 已启动 ✓');
    if (VV.err) L.push('脚本错误: ' + VV.err.msg.slice(0, 100));
    try { L.push('UA: ' + navigator.userAgent.slice(0, 60)); } catch (e5) {}
    alert('自检结果（复制反馈给开发者）\n\n' + L.join('\n'));
}

// 真机专用：桌面浏览器没有 MediaCodec，这类问题只能在手机上观察。
// 这里把"播放器退场后还占着资源"的证据摊开，用户照屏幕念/截图就能定位。
function vvReleaseAudit() {
    var L = [];
    var pool = 0;
    try { pool = (VV._hlsPool || []).length; } catch (e0) {}
    var root = null;
    try { root = document.getElementById('vv-player-root'); } catch (e1) {}

    L.push('播放器层: ' + (root ? '还在页面里 ✗' : '已移除 ✓'));
    L.push('hls 实例残留: ' + pool + (pool ? ' 个 ✗' : ' ✓'));
    try { if (window.Hls) L.push('hls.js: ' + (window.Hls.version || '已加载')); } catch (e2) {}

    try {
        var vs = document.querySelectorAll('video');
        L.push('页内 video: ' + vs.length + ' 个');
        var busy = 0;
        for (var i = 0; i < vs.length && i < 5; i++) {
            var v = vs[i];
            var src = '';
            try { src = v.currentSrc || v.src || ''; } catch (eS) {}
            var kind = src.indexOf('blob:') === 0 ? 'MSE/自建' : (src ? '直链' : '无源');
            if (!v.paused || v.readyState > 1) busy++;
            L.push('  · rs=' + v.readyState + ' ' + (v.paused ? '暂停' : '播放中') + ' ' + kind);
        }
        if (vs.length > 5) L.push('  · 其余 ' + (vs.length - 5) + ' 个略');
        if (!root && busy === 0) L.push('状态: 解码器应已全部让出 ✓');
    } catch (e3) {}

    L.push('本次打开播放器: ' + (VV._openCount || 0) + ' 次');
    L.push('累计销毁实例: ' + (VV._killCount || 0) + ' 个');
    try {
        var a = VV._lastAudit;
        if (a) {
            var ago = Math.round((Date.now() - a.ts) / 1000);
            L.push('上次退出 +0.9s: 实例 ' + a.pool + ' / video ' + a.videos + ' / 层 ' + (a.root ? '还在' : '已移除') + '（' + ago + ' 秒前）');
        } else L.push('上次退出: 还没有关闭过播放器');
    } catch (e4) {}

    try {
        if (performance.memory) L.push('JS 堆: ' + Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB');
    } catch (e5) {}

    L.push('UA: ' + navigator.userAgent.slice(0, 48));

    alert('资源释放自检\n\n' + L.join('\n') +
        '\n\n判读：\n· 「播放器层」应为已移除\n· 「hls 实例残留」应为 0\n· 退出后页面 video 仍「播放中/MSE」= 解码器被占\n\n仍不正常就点菜单「立即强制释放播放器资源」，看是否立刻恢复。');
}

function vvForceRelease() {
    var n = 0;
    try { n = (VV._hlsPool || []).length; } catch (e0) {}
    try { vvKillAllHls(); } catch (e1) {}
    var cnt = 0;
    try { if (VID) { vvHardReleaseVideo(VID); cnt++; } } catch (e2) {}
    try {
        var root = document.getElementById('vv-player-root');
        if (root) {
            var vs = root.querySelectorAll('video');
            for (var i = 0; i < vs.length; i++) { vvHardReleaseVideo(vs[i]); cnt++; }
            try { if (root.parentNode) root.parentNode.removeChild(root); } catch (eR) {}
        }
    } catch (e3) {}
    try {
        var left = (VV._hlsPool || []).length;
        alert('已强制释放\n\n· hls 实例: ' + n + ' 个\n· video 元素: ' + cnt + ' 个\n· 残留实例: ' + left +
            '\n\n页面立刻恢复 → 问题在释放链，请把「自检」截图给我。\n毫无变化 → 占用来自站点自己的播放器。');
    } catch (e4) {}
}

function vvAbout() {
    try {
        alert('Via 视频嗅探播放器 v' + VV.version +
            '\n\n功能：视频嗅探·全屏手势播放器·倍速·进度记忆·m3u8·连播·下载' +
            '\n\n使用：嗅探角标出现后点击打开列表；▶ 播放进内置播放器。' +
            '\n\n限制：部分站点加密流（blob）无法导出；m3u8 下载需第三方工具。' +
            '\n\n作者：ViaModes · 本地运行，不上传任何数据');
    } catch (e) {}
}

function vvConsumeAutoNext() {
    try {
        var f = vvGet('autoNextLast', null);
        if (f && Date.now() - f.ts < 240000) {
            vvDel('autoNextLast');
            setTimeout(function () {
                try {
                    var cand = null;
                    for (var i = 0; i < VV.items.length; i++) {
                        if (VV.items[i].type !== 'BLOB') { cand = VV.items[i]; break; }
                    }
                    if (cand && VV.playerActive === false) {
                        vvToast('连播：自动续播下一集', true);
                        openPlayer(cand);
                    }
                } catch (e2) {}
            }, 3000);
        }
    } catch (e) {}
}
