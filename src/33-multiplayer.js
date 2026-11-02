// ===== 多页面并行播放的治理 =====
// 手机上 Via（Android WebView）的视频解码走 MediaCodec，同时可用的解码器实例数是硬上限。
// 用户明确要求"同时播几个"，所以这里不能简单锁死单实例，改为：
//   1. 登记表（谁在播），跨页面共享
//   2. 单实例模式（默认）：只有最早的页面在播，其余自动挂起 —— 防解码器耗尽
//   3. 并行模式（可开）：允许多页同时播，但按并发数自动压缩每页的缓冲与分辨率，
//      把"多个解码器"的压力降到能撑住的范围内
// 两种模式都保留了：挂起后释放解码器、实例重建、强制关闭逃生门。

var VV_LEASE_KEY = 'playLease';
var VV_LEASE_TTL = 9000;    // 登记表里超过 9 秒没续的条目视为已退出
var VV_LEASE_TICK = 2500;

function vvLeaseId() {
    if (!VV._pageId) {
        VV._pageId = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }
    return VV._pageId;
}

// 登记表：{ id: { ts, url } }
function vvPlayersRead() {
    var l = vvGet(VV_LEASE_KEY, null);
    if (!l || typeof l !== 'object') return {};
    var list = l.players && typeof l.players === 'object' ? l.players : l;
    var out = {};
    var now = Date.now();
    for (var k in list) {
        if (!list[k] || typeof list[k] !== 'object') continue;
        if (now - (list[k].ts || 0) < VV_LEASE_TTL) out[k] = list[k];
    }
    return out;
}

function vvPlayersWrite(url) {
    var me = vvLeaseId();
    var list = vvPlayersRead();
    // first = 首次登记时间，续登只刷新 ts（心跳）。
    // 主页面必须按 first 排，否则每 2.5 秒续登一次会让"主页面"在多个页面间来回跳，
    // 表现为多个页面互相抢权、轮流挂起。
    var prev = list[me];
    list[me] = {
        ts: Date.now(),
        first: (prev && prev.first) || Date.now(),
        url: url || (prev && prev.url) || ''
    };
    vvSet(VV_LEASE_KEY, { players: list });
    return list;
}

function vvPlayersUnregister() {
    try {
        var me = vvLeaseId();
        var list = vvPlayersRead();
        if (list[me]) {
            delete list[me];
            vvSet(VV_LEASE_KEY, { players: list });
        }
    } catch (e) {}
}

function vvPlayersCount() {
    var n = 0;
    var list = vvPlayersRead();
    for (var k in list) n++;
    return n;
}

// 单实例模式下的"主页面"：登记最早的优先（按首次登记时间，不受续登刷新影响）
function vvPlayersOwner() {
    var list = vvPlayersRead();
    var owner = null, best = Infinity;
    for (var k in list) {
        var e = list[k] || {};
        var t = e.first || e.ts || 0;
        if (t < best || (t === best && (!owner || k < owner))) {
            best = t;
            owner = k;
        }
    }
    return owner;
}

// 挂起：停拉流 + 暂停画面，把解码器和带宽让出来
function vvSuspendPlayback(reason) {
    try {
        if (!VV.active) return;
        if (VV.active._suspended) return;
        VV.active._suspended = true;
        VV.active._suspendReason = reason || 'other';
        VV.active._suspendAt = Date.now();
        try { if (VID) VID.pause(); } catch (e1) {}
        try { if (VV.active.hls) VV.active.hls.stopLoad(); } catch (e2) {}
        if (reason === 'other') {
            vvShowLoading('已挂起：另一个页面正在播放');
            vvToast('另一个页面正在播放，本页已自动挂起（可在脚本菜单改为并行播放）', true);
        }
    } catch (e) {}
}

// 长时间挂起就彻底释放解码器：Android WebView 的 MediaCodec 数量有限，
// 一个挂着的 <video> 也会占住一个，硬撑会把整台设备的视频能力拖垮。
function vvReleaseDecoder() {
    try {
        // 原来这里要求 VV.active.hls 存在才继续，导致直链 mp4 在后台永远不主动释放，
        // 只能指望 WebView 冻结页面时顺手回收（不冻结的机型就一直占着 MediaCodec）。
        // 直链同样要摘 src 才会归还解码器，所以判据改成"有没有在播"，而不是"有没有 hls"。
        if (!VV.active) return;
        VV.active._suspendT = VID ? (VID.currentTime || 0) : 0;
        if (VV.active.hls) {
            try { VV.active.hls.destroy(); } catch (e1) {}
            VV.active.hls = null;
            VV.active._inst = null;
        }
        try { if (VID) { VID.pause(); VID.removeAttribute('src'); VID.load(); } } catch (e2) {}
    } catch (e) {}
}

function vvResumePlayback() {
    try {
        if (!VV.active || !VV.active._suspended) return;
        if (document.hidden) return;
        VV.active._suspended = false;
        VV.active._suspendReason = '';
        if (VV.active.hls) {
            try { VV.active.hls.startLoad(VID.currentTime || 0); } catch (e1) {}
            try { if (VID) VID.play().catch(function () {}); } catch (e2) {}
        } else {
            try { vvRebuildMedia(); } catch (e3) {}
        }
        vvHideLoading();
    } catch (e) {}
}

// 并行预算：并发页数越多，每页分到的缓冲和分辨率越少。
// 解码器的占用跟分辨率强相关（1080P 一路大约是 360P 的 6~8 倍），
// 并行时主动压档，是"能同时播几个"的关键，而不是让 ABR 随机撞墙。
function vvApplyParallelBudget(count) {
    try {
        var inst = VV.active && VV.active.hls;
        if (!inst) return;
        var cfg = inst.config;
        var ml = count <= 1 ? 36 : count === 2 ? 20 : 12;
        var ms = count <= 1 ? 50 * 1000 * 1000 : count === 2 ? 24 * 1000 * 1000 : 12 * 1000 * 1000;
        if (cfg.maxBufferLength !== ml) cfg.maxBufferLength = ml;
        if (cfg.maxMaxBufferLength !== ml * 2) cfg.maxMaxBufferLength = ml * 2;
        if (cfg.maxBufferSize !== ms) cfg.maxBufferSize = ms;

        // 并行时给清晰度设上限，避免多个高分辨率解码器把池撑爆
        try {
            var levels = inst.levels || [];
            var cap = -1;
            if (count >= 2 && levels.length) {
                var targetH = count >= 3 ? 360 : 480;
                var best = -1, bestH = Infinity;
                for (var i = 0; i < levels.length; i++) {
                    var h = (levels[i] && levels[i].height) || 0;
                    if (h && h <= targetH && h < bestH) { bestH = h; best = i; }
                }
                if (best < 0) {
                    bestH = Infinity;
                    for (var j = 0; j < levels.length; j++) {
                        var hh = (levels[j] && levels[j].height) || Infinity;
                        if (hh < bestH) { bestH = hh; best = j; }
                    }
                }
                cap = best;
            }
            if (inst.autoLevelCapping !== cap) inst.autoLevelCapping = cap;
        } catch (e2) {}
    } catch (e) {}
}

// 周期仲裁
function vvLeaseTick() {
    try {
        if (!VV.playerActive || !VV.active) return;
        // 隐藏的页面不参与抢权，否则会把正在看的那一页挤掉
        if (document.hidden) return;
        var url = (VV.active.item && VV.active.item.url) || '';
        var list = vvPlayersWrite(url);
        var count = 0;
        for (var k in list) count++;

        if (VV.cfg.multiPlay) {
            // 并行模式：都播，只按并发数压缩资源
            vvApplyParallelBudget(count);
            if (VV.active._suspended && VV.active._suspendReason === 'other') vvResumePlayback();
            return;
        }

        var owner = vvPlayersOwner();
        var me = vvLeaseId();
        if (count > 1 && owner && owner !== me) {
            vvSuspendPlayback('other');
        } else {
            vvApplyParallelBudget(count);
            if (VV.active._suspended && VV.active._suspendReason === 'other') vvResumePlayback();
        }
        // 挂起超过 20 秒就释放解码器，别占着不放
        if (VV.active._suspended && VV.active._suspendAt &&
            Date.now() - VV.active._suspendAt > 20000 && VV.active.hls) {
            vvReleaseDecoder();
        }
    } catch (e) {}
}

function vvLeaseStart() {
    vvLeaseStop();
    try {
        vvPlayersWrite((VV.active && VV.active.item && VV.active.item.url) || '');
        VV._leaseTimer = setInterval(vvLeaseTick, VV_LEASE_TICK);
    } catch (e) {}
}

function vvLeaseStop() {
    try {
        if (VV._leaseTimer) clearInterval(VV._leaseTimer);
        VV._leaseTimer = 0;
        vvPlayersUnregister();
    } catch (e) {}
}

// 重建播放实例：hls.js 实例坏掉（解码器分配失败/流中断到死）时的就地自愈，
// 不用重启浏览器。
function vvRebuildMedia() {
    try {
        if (!VV.active || !VV.active.item) { vvToast('当前没有正在播放的视频', true); return; }
        var t = VV.active._suspendT || (VID ? (VID.currentTime || 0) : 0);
        var item = VV.active.item;
        VV.active._suspendT = 0;
        vvToast('正在重建播放实例…');
        vvLoadMedia(item);
        var onMeta = function () {
            try { VID.removeEventListener('loadedmetadata', onMeta); } catch (eR) {}
            try {
                if (t > 0.5) {
                    if (VV.active && VV.active.hls) VV.active.hls.startLoad(t);
                    VID.currentTime = t;
                }
            } catch (eS) {}
        };
        try { VID.addEventListener('loadedmetadata', onMeta); } catch (eA) {}
    } catch (e) {}
}

// 页面已经卡死时的逃生门：不管播放器内部状态如何，强制拆掉界面、解除冻结
function vvForceClose() {
    try {
        if (VV._leaseTimer) clearInterval(VV._leaseTimer);
        VV._leaseTimer = 0;
        vvPlayersUnregister();
        try { if (VV.active && VV.active.hls) VV.active.hls.destroy(); } catch (e1) {}
        try { if (VID) { VID.pause(); VID.removeAttribute('src'); VID.load(); } } catch (e2) {}
        try { vvSetPageFreeze(false); } catch (e3) {}
        try { vvResumePageMedia(); } catch (e4) {}
        try { vvStopWatchdog(); } catch (e5) {}
        try { vvStopPlayerTop(); } catch (e6) {}
        try { if (ROOT && ROOT.parentNode) ROOT.parentNode.removeChild(ROOT); } catch (e7) {}
        ROOT = null; VID = null; BRIGHT = null; TOPBAR = null; BOTBAR = null;
        CBTN = null; CSPLAY = null; CSTIME = null; CSPROG = null; CSBUF = null;
        CSCUR = null; CSPROGDOT = null; LOCKMARK = null; SEEKTIP = null; GESTIP = null; LOADING = null;
        VV.playerActive = false;
        VV.active = null;
        if (VV.items.length) vvToggleBadge(true);
        vvToast('已强制关闭播放器');
    } catch (e) {}
}

// 切换单实例 / 并行播放
function vvToggleMultiPlay() {
    VV.cfg.multiPlay = !VV.cfg.multiPlay;
    vvSet('multiPlay', VV.cfg.multiPlay);
    if (VV.cfg.multiPlay) {
        vvToast('已开启多页并行播放：多个页面可同时播放，缓冲与清晰度会自动压缩', true);
        try { if (VV.active) vvApplyParallelBudget(vvPlayersCount()); } catch (e) {}
    } else {
        vvToast('已关闭并行播放：同一时间只允许一个页面播放（防解码器耗尽）', true);
    }
}

// 页面级媒体休眠：后台标签页把原生 <video> 的 src 摘掉，
// 从而真正释放 MediaCodec（只 pause 是不会释放的，元素仍占着一个解码器）。
// 回前台再把 src 装回去并回到原进度。
// 这比浏览器级"丢弃标签页"更精确：页面状态、DOM、表单都还在，只有媒体管线被释放。
function vvHibernateMedia() {
    try {
        if (VV._hib) return;
        var list = [];
        var els = document.querySelectorAll('video,audio');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            try {
                if (ROOT && ROOT.contains(el)) continue;             // 内置播放器另有一套
                if (el.mediaKeys) continue;                        // DRM 不动
                var src = el.currentSrc || el.getAttribute('src');
                if (!src) continue;
                if (src.indexOf('blob:') === 0) continue;          // MSE 流摘了恢复不了
                var t = el.currentTime || 0;
                var wasPaused = !!el.paused;
                list.push({ el: el, src: src, t: t, paused: wasPaused });
                try { el.pause(); } catch (e1) {}
                try { el.removeAttribute('src'); el.load(); } catch (e2) {}
            } catch (e3) {}
        }
        VV._hib = list;
    } catch (e) {}
}

function vvThawMedia() {
    try {
        var list = VV._hib || [];
        VV._hib = null;
        for (var i = 0; i < list.length; i++) {
            var it = list[i];
            try {
                var done = function (rec) {
                    return function () {
                        try { if (rec.t > 0.5) rec.el.currentTime = rec.t; } catch (e) {}
                        try { if (!rec.paused) rec.el.play().catch(function () {}); } catch (e2) {}
                    };
                };
                it.el.addEventListener('loadedmetadata', done(it), { once: true });
                it.el.src = it.src;
                it.el.load();
            } catch (e) {}
        }
    } catch (e) {}
}

// 页面隐藏时，把这个页面里所有 <video>/<audio> 都暂停：
// Android 上后台标签页不会释放 MediaCodec，只有暂停或销毁页面才会让出来。
// 这条对"不用内置播放器、就用页面原生的视频"的站点同样有效。
function vvPauseHiddenMedia() {
    try {
        if (VV._hiddenMedia) return;
        VV._hiddenMedia = [];
        var els = document.querySelectorAll('video,audio');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            try {
                if (el && !el.paused && !el.ended) {
                    VV._hiddenMedia.push(el);
                    el.pause();
                }
            } catch (e) {}
        }
    } catch (e2) {}
}

function vvResumeHiddenMedia() {
    try {
        var list = VV._hiddenMedia || [];
        VV._hiddenMedia = null;
        for (var i = 0; i < list.length; i++) {
            try { list[i].play().catch(function () {}); } catch (e) {}
        }
    } catch (e2) {}
}

// 进入/离开后台的统一入口
function vvEnterBackground() {
    try {
        if (VV.cfg.hibernate) vvHibernateMedia();
        else vvPauseHiddenMedia();
        if (VV.playerActive) {
            vvSuspendPlayback('hidden');
            vvPlayersUnregister();
            // 后台页面不再参与仲裁（vvLeaseTick 在 hidden 时直接返回），
            // 所以这里自己起一个定时器：后台超过 20 秒就主动释放解码器，
            // 否则它会一直占着 MediaCodec，把其它页面的视频能力拖垮。
            try {
                if (VV._hibTimer) clearTimeout(VV._hibTimer);
                VV._hibTimer = setTimeout(function () {
                    VV._hibTimer = 0;
                    try {
                        if (document.hidden && VV.active && VV.active._suspended && VV.active.hls) {
                            vvReleaseDecoder();
                        }
                    } catch (e) {}
                }, 20000);
            } catch (e2) {}
        }
    } catch (e) {}
}

function vvLeaveBackground() {
    try {
        try { if (VV._hibTimer) { clearTimeout(VV._hibTimer); VV._hibTimer = 0; } } catch (e0) {}
        if (VV.cfg.hibernate) vvThawMedia();
        else vvResumeHiddenMedia();
        if (VV.playerActive) {
            vvLeaseTick();
            vvResumePlayback();
        }
    } catch (e) {}
}

// 有些 WebView 壳切标签时根本不派发 visibilitychange，
// 所以额外轮询焦点状态：只要看到"曾经有焦点 → 现在没有"，就当作进了后台。
function vvFocusPoll() {
    try {
        var focused = false;
        try { focused = (document.hasFocus && document.hasFocus()) || document.visibilityState === 'visible'; } catch (e1) {}
        if (VV._focusSeen === undefined) { VV._focusSeen = focused; return; }
        if (VV._focusSeen && !focused && !VV._bg) {
            VV._bg = true;
            vvEnterBackground();
        } else if (focused && VV._bg) {
            VV._bg = false;
            vvLeaveBackground();
        }
        if (focused) VV._focusSeen = true;
    } catch (e2) {}
}

// 页面即将被销毁时的清理：关标签页 / 导航离开 / WebView 被系统回收。
//
// 这条路径和"点播放器返回"完全是两回事：它不会进 closePlayer()，而且页面一销毁，
// 所有 setTimeout、微任务、异步回调都不再执行——所以这里必须全部同步做完，
// 任何"等一下再释放"的兜底都等不到。
//
// final=true 表示页面确定要没了（pagehide 且非 bfcache），此时连定时器一起清掉。
// final=false 用于 beforeunload 这种"可能还会进 bfcache 活过来"的场合，只物理释放。
var _vvTornDown = false;
function vvHardTeardown(final) {
    // 留下时间戳：真机上关标签页后没法回看日志，只能靠这个外部可读的痕迹判断
    // "是我们清理的"还是"WebView 自己回收的"，排查释放类问题离不开它。
    try { VV._lastTeardown = Date.now(); } catch (eTS) {}
    if (final) {
        if (_vvTornDown) return;
        _vvTornDown = true;
        try { if (VV._hibTimer) { clearTimeout(VV._hibTimer); VV._hibTimer = 0; } } catch (e0) {}
        try { if (VV._focusTimer) { clearInterval(VV._focusTimer); VV._focusTimer = 0; } } catch (e0b) {}
        try { if (ROOT) clearTimeout(ROOT._csTimer); } catch (e0c) {}
        try { vvStopLoadTick(); } catch (e0d) {}
        try { vvLeaseStop(); } catch (e1) {}
    }
    // hls 实例池可能不止一个（重建失败、旧实例 destroy 抛错都会留下残余），全清。
    try { vvKillAllHls(); } catch (e2) {}
    // 直链 mp4 没有 hls 实例，上面这步完全管不到它。必须单独硬释放播放器自己的 video，
    // 否则关掉标签后 MediaCodec 会一直挂着，直到 WebView 进程被回收。
    try { vvHardReleaseVideo(VID); } catch (e3) {}
    // 站点自带的播放器也一起还回去：标签都要关了，没有理由让它继续占着解码器。
    // 用查 DOM 而不是靠 VID，因为 closePlayer 之后 VID 已经被置成 null 了。
    try {
        var vs = document.querySelectorAll('video,audio');
        for (var i = 0; i < vs.length; i++) {
            if (vs[i] !== VID) vvHardReleaseVideo(vs[i]);
        }
    } catch (e4) {}
    try {
        if (VV.active) {
            VV.active.hls = null;
            VV.active._inst = null;
            // 标成已挂起：万一页面进了 bfcache 又被恢复，vvResumePlayback 靠这个标记重建
            VV.active._suspended = true;
            VV.active._suspendReason = 'hidden';
        }
    } catch (e5) {}
}

// 全局生命周期：页面隐藏时挂起并让出播放权，页面关闭时彻底销毁实例释放解码器
function vvSetupLifecycle() {
    if (VV._lifeReady) return;
    VV._lifeReady = true;
    try {
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) vvEnterBackground();
            else vvLeaveBackground();
        });
    } catch (e2) {}
    try {
        VV._focusTimer = setInterval(vvFocusPoll, 1500);
    } catch (e2b) {}
    try {
        window.addEventListener('focus', function () {
            if (VV._bg) { VV._bg = false; vvLeaveBackground(); }
        });
        window.addEventListener('blur', function () {
            if (!VV._bg) { VV._bg = true; vvEnterBackground(); }
        });
    } catch (e2c) {}
    try {
        window.addEventListener('pagehide', function (ev) {
            try {
                if (ev && ev.persisted) {
                    // 进 bfcache：页面还活着，只挂起别销毁，回来还能接着播
                    if (VV.playerActive) {
                        vvSuspendPlayback('hidden');
                        vvPlayersUnregister();
                    }
                    return;
                }
                // 真正要走了（关标签页 / 导航走 / 页面被回收）
                vvHardTeardown(true);
            } catch (e4) {}
        });
    } catch (e5) {}
    // 关页面前的最后一次机会。有些内核 pagehide 派发得晚甚至不派发，
    // 这一层更早、更稳；因为页面可能还会进 bfcache 活过来，这里不置永久标记。
    try {
        window.addEventListener('beforeunload', function () {
            try { vvHardTeardown(false); } catch (eb) {}
        });
    } catch (e5b) {}
    // Page Lifecycle 的 freeze：页面被冻结时 CPU 已挂起，解码器还挂在 media 进程里。
    // 这里立刻归还，比后台那个 20 秒定时器更早；解冻后走正常的恢复逻辑重建。
    try {
        document.addEventListener('freeze', function () {
            try {
                if (VV.playerActive && VV.active) {
                    vvSuspendPlayback('hidden');
                    vvPlayersUnregister();
                    vvReleaseDecoder();
                }
            } catch (ez) {}
        });
    } catch (e5c) {}
    // 从 bfcache 恢复：上一次 pagehide/beforeunload 可能已经把 _vvTornDown 置位，
    // 不复位的话，恢复后再关标签页就永远不会再清理了（静默失效，最难查的一类）。
    try {
        window.addEventListener('pageshow', function (ev) {
            try {
                _vvTornDown = false;
                if (ev && ev.persisted && VV.playerActive) vvLeaveBackground();
            } catch (ep) {}
        });
    } catch (e5d) {}
}
