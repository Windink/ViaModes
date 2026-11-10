// ===== 多页面并行播放的治理 =====
// 手机上 Via（Android WebView）的视频解码走 MediaCodec，同时可用的解码器实例数是硬上限。
// 用户明确要求"同时播几个"，所以这里不能简单锁死单实例，改为：
//   1. 登记表（谁在播），跨页面共享
//   2. 单实例模式（默认）：只有最早的页面在播，其余自动挂起 —— 防解码器耗尽
//   3. 并行模式（可开）：允许多页同时播，但按并发数压缩每页的缓冲与内存上限，
//      把"多个解码器"的压力降到能撑住的范围内；画质档位一律不压（画质红线）
// 两种模式都保留了：挂起后释放解码器、实例重建、强制关闭逃生门。

var VV_LEASE_TTL = 9000;    // 登记表里超过 9 秒没续的条目视为已退出
var VV_LEASE_TICK = 2500;
// 进后台后延迟交还解码器的宽限。系统弹窗（下载、分享、权限框）会让页面隐藏一两秒就回来，
// 这段时间不拆播放实例；真切走超过宽限才彻底释放。单测会把这个值调成 0 来验超时分支。
var VV_BG_RELEASE_MS = 1200;

function vvLeaseId() {
    if (!VV._pageId) {
        VV._pageId = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }
    return VV._pageId;
}

// 登记表：{ id: { ts, first, url } }
//
// 每个页签写自己的一条（独立 key），读的时候扫前缀。
// 之前是"读整个对象 → 改自己那条 → 整个写回"，两个页签同时续登就会互相覆盖，
// 登记表时不时少一条，仲裁结果跟着飘。独立 key 没有这个竞态。
var VV_LEASE_PREFIX = 'vvs:lease:';

function vvPlayersRead() {
    var out = {};
    var now = Date.now();
    try {
        var del = [];
        for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (!k || k.indexOf(VV_LEASE_PREFIX) !== 0) continue;
            var e = null;
            try { e = JSON.parse(localStorage.getItem(k)); } catch (e1) {}
            if (!e || typeof e !== 'object') continue;
            if (now - (e.ts || 0) >= VV_LEASE_TTL) { del.push(k); continue; }
            out[k.slice(VV_LEASE_PREFIX.length)] = e;
        }
        for (var d = 0; d < del.length; d++) { try { localStorage.removeItem(del[d]); } catch (eD) {} }
    } catch (e2) {}
    return out;
}

function vvPlayersWrite(url) {
    var me = vvLeaseId();
    var prev = null;
    try { prev = JSON.parse(localStorage.getItem(VV_LEASE_PREFIX + me) || 'null'); } catch (e0) {}
    // first = 首次登记时间，续登只刷新 ts（心跳）。
    // 主页面必须按 first 排，否则每 2.5 秒续登一次会让"主页面"在多个页面间来回跳，
    // 表现为多个页面互相抢权、轮流挂起。
    var rec = {
        ts: Date.now(),
        first: (prev && prev.first) || Date.now(),
        url: url || (prev && prev.url) || ''
    };
    try { localStorage.setItem(VV_LEASE_PREFIX + me, JSON.stringify(rec)); } catch (e1) {}
    return vvPlayersRead();
}

function vvPlayersUnregister() {
    try {
        localStorage.removeItem(VV_LEASE_PREFIX + vvLeaseId());
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

// 彻底交还解码器（不是"挂起"）。
//
// 关键区别：pause() 只是停止送帧，MediaCodec 还挂在 media 进程里；
// 只有把 <video> 退回"无资源"状态（摘 src + load()）才会 release。
// 而且必须连 hls 一起销毁——只 destroy hls 不摘 src，MediaSource 还在，
// SourceBuffer 的解码器照样活着。
function vvReleaseDecoder() {
    try {
        if (!VV.active) {
            // 播放器已退出但 VID 还活着（异常路径），也照样清干净
            try { if (VID) vvHardReleaseVideo(VID); } catch (eA) {}
            return;
        }
        var t = 0;
        try { t = (VID && isFinite(VID.currentTime) && VID.currentTime > 0) ? VID.currentTime : 0; } catch (eT) {}
        if (t > 0) VV.active._suspendT = t;
        if (VV.active.hls) {
            try { VV.active.hls.stopLoad(); } catch (e0) {}
            try { VV.active.hls.detachMedia(); } catch (e0b) {}
            try { VV.active.hls.destroy(); } catch (e1) {}
            VV.active.hls = null;
            VV.active._inst = null;
        }
        // 池里的残渣（重建失败留下的旧实例）一并清掉
        try { vvKillAllHls(); } catch (e1b) {}
        try { vvHardReleaseVideo(VID); } catch (e2) {}
        VV.active._mediaReleased = true;
        VV.active._suspended = true;
        if (!VV.active._suspendReason) VV.active._suspendReason = 'hidden';
        if (!VV.active._suspendAt) VV.active._suspendAt = Date.now();
    } catch (e) {}
}

function vvResumePlayback() {
    try {
        if (!VV.active || !VV.active._suspended) return;
        if (vvTabHidden()) { VV._resumeBlock = 'hidden'; return; }
        // 留痕：回前台没恢复时，靠 _resumeBlock/_resumeAt 区分「判成后台被挡掉」还是
        // 「压根没有第二次调用」——这两种情况的修法完全不同，不能只凭终态猜。
        VV._resumeBlock = '';
        VV._resumeAt = Date.now();
        VV.active._suspended = false;
        VV.active._suspendReason = '';
        VV.active._suspendAt = 0;
        // 顺手把临时静音还原（有些机型 pause 后元素会被静音，回来必须还原）
        try { vvRestoreAudio(VID); } catch (eRA) {}
        // 判据只能是「管线有没有真被拆过」，不能是「有没有 hls 实例」：
        // mp4 直链本来就没有 hls，按旧判据每次恢复都会掉进「重建播放实例」，
        // 哪怕只是被系统弹窗挡了一下、src 和 video 全都还在。
        if (!VV.active._mediaReleased) {
            try {
                if (VV.active.hls) VV.active.hls.startLoad(VID.currentTime || 0);
            } catch (e1) {}
            try { if (VID) VID.play().catch(function () {}); } catch (e2) {}
            vvHideLoading();
        } else {
            // 管线已经被拆掉了：只能整条重建（进度从 _suspendT 续上）
            VV.active._mediaReleased = false;
            try { vvRebuildMedia(); } catch (e3) {}
        }
    } catch (e) {}
}

// ---- 前台/后台判定 ----
// 为什么不只靠 visibilitychange：Via 这类 WebView 壳切标签时不一定会给后台页面派发它，
// 一旦不派发，本页的释放逻辑就永远不触发，解码器一直挂着——
// 表现就是"开了几个页签之后，新页签能加载但播不动，关掉几个才好"。
// 所以这里加一条 rAF 心跳：页面不可见时浏览器会停掉 requestAnimationFrame，
// 这条信号比事件更难被骗过。
function vvRafBeat() {
    VV._rafArmed = false;
    VV._rafSeen = true;
    VV._rafLast = Date.now();
    vvArmRaf();
}

function vvArmRaf() {
    if (VV._rafArmed) return;
    try {
        if (typeof requestAnimationFrame !== 'function') return;
        VV._rafArmed = true;
        requestAnimationFrame(vvRafBeat);
    } catch (e) { VV._rafArmed = false; }
}

function vvHasFocus() {
    try { return !!(document.hasFocus && document.hasFocus()); } catch (e) { return true; }
}

// 焦点信号是否可信：有些 WebView 根本没有"焦点"概念，hasFocus() 恒为 false。
// 恒 false 还拿它当判据的话，页面会在启动几秒后把自己拆掉——所以必须先"见过 true"才启用。
function vvFocusUsable() {
    if (VV._focusEverTrue) return true;
    try {
        if (vvHasFocus()) { VV._focusEverTrue = true; return true; }
    } catch (e) {}
    return false;
}

// 多窗口 / 分屏时，两个页面 visibility 都是 visible、rAF 也都在跑，
// 只有"窗口焦点"能区分用户正在看哪一个。但要防误判：点地址栏、系统弹窗、
// 输入法升起都会短暂失焦，所以要求"持续失焦"超过阈值才算。
var VV_NOFOCUS_MS = 4000;
function vvFocusLostLong() {
    if (!vvFocusUsable()) return false;
    try {
        if (vvHasFocus()) { VV._noFocusAt = 0; return false; }
    } catch (e) { return false; }
    if (!VV._noFocusAt) VV._noFocusAt = Date.now();
    if (Date.now() - VV._noFocusAt < VV_NOFOCUS_MS) return false;
    // 关键限定：失焦本身**不足以**证明"用户去看别的页了"。
    // 点地址栏、系统弹窗、输入法、无头环境都会让 hasFocus 长期为 false，
    // 单靠它判定就是无缘无故把自己拆掉（本地跑 UI 用例时整条链路卡死就是这么来的）。
    // 只有"确实有别的页签在最近宣称过自己在台前"，失焦才算数。
    return vvPeerFrontSeen();
}

// ---- 前台宣告 ----
// 每个页签在自己处于台前时写一条心跳，别人读到就知道"台前在别处"。
// 这是失焦判定的前置证据，也是"我看的那页独占"能被别的页确认的唯一方式。
// 每个页签写自己的一条（独立 key），不是一个共用 key。
// 共用一个 key 的话后写的会覆盖前写的：分屏时 A 失焦后读到的可能还是 A 自己那条，
// 于是"有别的页在台前"永远不成立，失焦判定形同虚设。
var VV_FRONT_PREFIX = 'vvs:front:';
var VV_GM_FRONT = 'vvfront';

function vvAnnounceFront() {
    var now = Date.now();
    var me = vvLeaseId();
    try { localStorage.setItem(VV_FRONT_PREFIX + me, JSON.stringify({ ts: now })); } catch (e0) {}
    try {
        if (typeof GM_setValue === 'function') GM_setValue(VV_GM_FRONT, { id: me, ts: now });
    } catch (e1) {}
}

// 最近 12 秒内，有没有**别的**页签宣称自己在台前。带 2 秒缓存：
// 这个函数被 900ms 的巡检反复调用，GM_getValue 在某些壳里是同步 IPC，不适合每次都问。
function vvPeerFrontSeen() {
    var now = Date.now();
    if (VV._peerFrontAt && now - VV._peerFrontAt < 2000) return !!VV._peerFrontSeen;
    VV._peerFrontAt = now;
    var seen = false;
    var me = vvLeaseId();
    // 本地：扫前缀，顺手清过期条目（页签关掉后不该继续"证明"别人在台前）
    try {
        var del = [];
        for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (!k || k.indexOf(VV_FRONT_PREFIX) !== 0) continue;
            var id = k.slice(VV_FRONT_PREFIX.length);
            var e = null;
            try { e = JSON.parse(localStorage.getItem(k)); } catch (e1) {}
            if (!e || now - (e.ts || 0) > 12000) { del.push(k); continue; }
            if (id !== me) seen = true;
        }
        for (var d = 0; d < del.length; d++) { try { localStorage.removeItem(del[d]); } catch (eD) {} }
    } catch (e2) {}
    // GM 通道（跨站唯一可能通的）：只有一个 key，但够判断"台前在别处"
    try {
        if (typeof GM_getValue === 'function') {
            var r = GM_getValue(VV_GM_FRONT, null);
            if (r && r.id && r.id !== me && now - (r.ts || 0) <= 12000) seen = true;
        }
    } catch (e3) {}
    VV._peerFrontSeen = seen;
    return seen;
}

// 只做"事实判断"，不改状态
function vvTabHidden() {
    try {
        if (document.visibilityState === 'hidden' || document.hidden === true) return true;
    } catch (e0) {}
    try {
        if (VV._rafSeen) {
            var gap = Date.now() - (VV._rafLast || 0);
            // 阈值从 1.6s 提到 2.6s。原因：重页面（首屏解析、瀑布流批量渲染、
            // 广告/统计脚本）出现 1~2 秒的长任务很常见，主线程一忙 rAF 就断，
            // 1.6s 会把"本页自己卡了一下"误判成"用户切走了"。
            // 误判的代价远大于晚一秒发现切走：我们会拆它的解码器、还拦住它重建，
            // 站点于是永远停在加载中——用户看到的就是"这个网站一点就卡死"。
            if (gap > 2600) {
                // 已经重新可见但 rAF 链断了（个别内核恢复后不补帧）：补一次
                if (!document.hidden && gap > 3200 && !VV._rafArmed) vvArmRaf();
                // 光凭 rAF 停顿还不够：要么 document 确实隐藏，要么别的页签宣称在台前。
                // 两个证据都没有时，最可能的是本页主线程被自己卡住了，不是切走。
                if (document.hidden || vvPeerFrontSeen()) return true;
            }
        }
    } catch (e1) {}
    return vvFocusLostLong();
}

// 本页现在挂着几条媒体管线（= 可能各占一个 MediaCodec）。
// 判断"还攥着资源"一律用 src 属性/IDL，不看 currentSrc——后者在 load() 后会残留一会儿。
function vvMediaPipelineCount() {
    var n = 0;
    try {
        var els = document.querySelectorAll('video,audio');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (!el) continue;
            try { if (el.mediaKeys) continue; } catch (eK) {}
            if (vvHasSrc(el)) n++;
        }
    } catch (e) {}
    return n;
}

// 状态机：两次采样都判后台才动作，避免主线程卡一下（解析大页面）被误判成切标签
function vvVisibilityTick() {
    try {
        if (vvTabHidden()) {
            VV._hidStreak = (VV._hidStreak || 0) + 1;
            if (!VV._bg && VV._hidStreak >= 2) vvEnterBackground();
            else if (VV._bg) vvBackgroundSweep();
        } else {
            VV._hidStreak = 0;
            if (VV._bg) vvLeaveBackground();
            else if (VV._peerReleased && VV._hib && VV._hib.length) {
                // 之前为了给别人让位拆掉了本页的播放器，现在用户真的回到这一页了：
                // 把能装回去的装回去（直链基本都能成，MSE 看站点有没有 revoke）。
                try { vvThawMedia(); } catch (eT) {}
            }
            // 回到前台后「挂起」标记还挂着，就在这里一轮一轮重试到真的恢复为止。
            //
            // 为什么不能只靠 vvLeaveBackground 里那一次：它只发生在 bg:1→0 那一瞬，
            // 而那一刻 vvResumePlayback 内部还要再判一次 vvTabHidden()，判据里的
            // rAF 间隔（>2.6s 才算切走）和邻居「我在台前」心跳（12s 有效、2s 缓存）
            // 都带滞后，刚切回来的一两秒里仍可能被判成后台 → 那一次被挡掉。
            // 之后没有任何路径会再试：vvLeaseTick 只恢复 _suspendReason==='other' 的，
            // 于是加载永远停在被切走那一刻的进度，用户看到的是
            // 「切出去回个消息，回来就再也不动了」。
            //
            // 排除 'other'：那是「别的页在播，本页让位」，什么时候恢复由 vvLeaseTick
            // 仲裁；这里硬恢复会变成两页同时抢解码器。
            if (VV.playerActive && VV.active && VV.active._suspended &&
                VV.active._suspendReason !== 'other') {
                try { vvResumePlayback(); } catch (eR) {}
            }
            // 前台每轮都补一次声音：只要这页在前台、没有待恢复的记录，
            // 就不该有任何元素停在我们压下去的静音态。
            try { vvRestorePageAudio(); } catch (eAH) {}
            try { vvRestorePlayerAudio(); } catch (ePH) {}
        }
    } catch (e) {}
    try { vvArmRaf(); } catch (e2) {}
}

// 后台页的补漏巡检。
//
// 为什么"进后台那一刻拆一次"不够：站点会在后台把播放器自己重建起来
// （自动连播、切集、预加载下一集、悬浮广告位），拆完又被装回去，
// 解码器一路没真正归还。这条巡检不看事件，每轮把新冒出来的管线再收走。
function vvBackgroundSweep() {
    try {
        if (VV.cfg.hibernate === false || VV.cfg.multiPlay) return;
        VV._sweepCount = (VV._sweepCount || 0) + 1;
        if (vvMediaPipelineCount() > 0) vvReleaseAllMedia('sweep');
        if (VV.playerActive && VV.active && !VV.active._mediaReleased &&
            !vvBgReleasePending()) vvReleaseDecoder();
    } catch (e) {}
}

// 后台页禁止起播。
//
// 只"事后拆"是拉锯战：站点被定时器唤醒 → play() → 我们拆 → 它再 play()。
// 在源头挡住更省事，也避免这中间反复向 media 进程申请/释放解码器
// （那本身就会失败，还会让系统判定"解码器资源紧张"）。
// 用 NotAllowedError 而不是别的错误：这是站点最熟悉的"被自动播放策略拦了"，
// 各家播放器都有兜底（显示"点击播放"），不会白屏也不会刷错误上报。
function vvGateActive() {
    try {
        if (VV.cfg.hibernate === false) return false;
        if (VV.cfg.multiPlay) return false;
        // _yielded 是"已经答应让位给别人"，_bg 是"判定为后台"。
        // 两个都要挡：分屏时本页可能仍然可见（_bg 为 false），
        // 但它已经把解码器交出去了，站点重建播放器必须拦住。
        return !!(VV._bg || VV._yielded);
    } catch (e) { return false; }
}

// 拦"建源"比拦 play() 狠得多：拦错了，站点就再也建不出播放管线，
// 页面永远停在加载圈上——用户看到的是"卡死"，而且是不可自愈的那种。
// 所以这里用比 vvGateActive 更硬的证据：
//   · 主动让位（收到别的页签的求让）
//   · document 真的隐藏了
//   · 或者 rAF 停了且有"别的页签在台前"的证据
// 缺一条就不拦。宁可让后台页偶尔多建一条管线（下一轮 sweep 会拆掉），
// 也不能因为一次"本页卡了 2 秒"的误判把正常页面钉死。
function vvSrcGateActive() {
    try {
        if (VV.cfg.hibernate === false) return false;
        if (VV.cfg.multiPlay) return false;
        if (VV._yielded) return true;
        if (!VV._bg) return false;
        try { if (document.hidden === true || document.visibilityState === 'hidden') return true; } catch (eH) {}
        try { if (vvPeerFrontSeen()) return true; } catch (eP) {}
        return false;
    } catch (e) { return false; }
}

function vvInstallPlayGate() {
    if (VV._playGate) return;
    try {
        var proto = window.HTMLMediaElement && HTMLMediaElement.prototype;
        if (!proto || typeof proto.play !== 'function') return;
        var orig = proto.play;
        VV._playGate = orig;
        proto.play = function () {
            var blocked = false;
            try { blocked = vvGateActive(); } catch (e0) {}
            if (blocked) {
                VV._gateBlocked = (VV._gateBlocked || 0) + 1;
                VV._gateBlockedAt = Date.now();
                try { this.pause(); } catch (e1) {}
                try {
                    var p = Promise.reject(new DOMException('vv: background page', 'NotAllowedError'));
                    // 内部先挂一个空 catch：既让调用方看到标准的 NotAllowedError，
                    // 又不会在控制台刷一堆 unhandledrejection（站点常常不 catch）。
                    try { p.catch(function () {}); } catch (e2b) {}
                    return p;
                } catch (e2) {
                    return orig.apply(this, arguments);
                }
            }
            return orig.apply(this, arguments);
        };
    } catch (e) {}
}

// 后台页连"装源"这一步都不许做。
//
// 只拦 play() 是打不赢的：hls.js 那一系在后台会自己走一遍
//   src = URL.createObjectURL(new MediaSource()) → appendBuffer → play()
// 管线和解码器在 play() 之前就建好了。我们事后拆、它再建，形成"拆-建"拉锯——
// 实测 8 个 m3u8 页签里总有一两页每隔几秒就冒出一条管线（pipelines 计数在 0/1 之间跳）。
// 在 src 的 setter 上直接吞掉赋值，等于把拉锯的源头掐掉：后台页再也建不出新管线。
// 清空（v 为空）永远放行，否则站点连"停播"都做不了。
function vvSrcBlocked(el) {
    try {
        if (VV._allowSrc) return false;
        if (!el) return false;
        if (ROOT && ROOT.contains(el)) return false;   // 我们自己的播放器要用
        if (!vvSrcGateActive()) return false;
        VV._gateSrcBlocked = (VV._gateSrcBlocked || 0) + 1;
        VV._gateBlocked = (VV._gateBlocked || 0) + 1;
        VV._lastGateAt = Date.now();
        return true;
    } catch (e) { return false; }
}

function vvInstallSrcGuard() {
    if (VV._srcGuard) return;
    VV._srcGuard = true;
    function wrapCtor(C) {
        try {
            var p = C && C.prototype;
            if (!p) return;
            var d = Object.getOwnPropertyDescriptor(p, 'src');
            if (!d || !d.set) return;
            Object.defineProperty(p, 'src', {
                configurable: true,
                enumerable: !!d.enumerable,
                get: function () { return d.get.call(this); },
                set: function (v) {
                    if (v && vvSrcBlocked(this)) return;
                    d.set.call(this, v);
                }
            });
        } catch (e) {}
    }
    wrapCtor(window.HTMLMediaElement);
    wrapCtor(window.HTMLSourceElement);
    // 走属性写法（el.setAttribute('src', u)）的站点也不少，一起挡。
    // 只对 media/source 生效：img/script 的 src 跟解码器无关，别误伤。
    try {
        var sa = Element.prototype.setAttribute;
        Element.prototype.setAttribute = function (k, v) {
            try {
                if (v && String(k || '').toLowerCase() === 'src') {
                    var tag = String(this.tagName || '').toLowerCase();
                    if ((tag === 'video' || tag === 'audio' || tag === 'source') && vvSrcBlocked(this)) return;
                }
            } catch (e0) {}
            return sa.call(this, k, v);
        };
    } catch (e) {}
}

// ---- 跨页签求让 ----
// 解码器是设备级资源，一个页签没法直接去释放另一个页签的 MediaCodec。
// 但所有页签跑的是同一个脚本、共用同一份存储，所以可以"打招呼"：
// 谁要开播就广播一条请求，别的页签看到就主动把解码器交出来。
var VV_PEER_KEY = 'releaseReq';
// GM 存储是"脚本级"的，所有站点共用一份；localStorage 是按 origin 隔离的。
// 用户真实用法是多开十个**不同**视频站 —— 那条路两边都看不见对方，
// 跨页协调完全失效，只能各页各自猜。所以再开一条 GM 通道，双通道广播。
// 能不能真读到别的页签写的值取决于壳的实现（有的只给本地缓存），所以"先探后用"：
// 一旦真的读到过别人写的值，就把 _gmBusOk 置位，自检面板能看到。
var VV_GM_BUS = 'vvbus';

function vvRequestPeerRelease() {
    var rec = { ts: Date.now(), from: vvLeaseId() };
    try { vvSharedSet(VV_PEER_KEY, rec); } catch (e) {}
    try {
        if (typeof GM_setValue === 'function') GM_setValue(VV_GM_BUS, rec);
    } catch (e2) {}
}

// 处理一条"求让"记录。viaGm 只用于标记通道是否真的通，不影响动作。
function vvPeerHandleOne(r, viaGm) {
    if (!r || !r.ts) return;
    if (r.from === vvLeaseId()) return;
    if (Date.now() - (r.ts || 0) > 8000) return;
    if (VV._peerHandled === r.ts) return;
    // 多窗口/分屏时两边都在前台，谁都"看得见"。这时按"最后一次用户操作"决胜：
    // 对方宣告得比我最近一次操作更晚，才让位；我刚点过这页就没理由让。
    if (VV._claimAt && r.ts <= VV._claimAt) return;
    VV._peerHandled = r.ts;
    if (viaGm) {
        VV._gmBusOk = true;
        VV._gmBusAt = r.ts;
    } else {
        VV._lsBusOk = true;
    }
    // 让位态：不是"暂停"，是"这页现在不该持有解码器"。
    // 它和 _bg 分开记，因为让位之后本页可能仍然 reported 可见（分屏），
    // 只靠 _bg 判断的话，站点一重建播放器就又被它占回去了。
    VV._yielded = true;
    VV._yieldedAt = Date.now();
    VV._yieldFrom = r.from || '';
    vvReleaseAllMedia('peer');
}

// 用户一碰屏幕就宣告主权。比"失焦判定"早 4 秒，而且是真凭实据：
// 手指在这页上，别的页就该让。节流 5 秒，滚动时不至于狂写存储。
function vvClaimFront() {
    var now = Date.now();
    // 8 秒节流：同一次"回到这页"里用户会连点几下，没必要每下都落一次存储。
    // 真需要更快的场景（切页签）由 vvLeaveBackground 的广播负责。
    if (VV._claimAt && now - VV._claimAt < 8000) return;
    VV._claimAt = now;
    // 我刚操作了这页 → 之前收到过的让位请求作废
    if (VV._yielded && now - (VV._yieldedAt || 0) > 800) VV._yielded = false;
    try { vvAnnounceFront(); } catch (e0) {}
    try { vvRequestPeerRelease(); } catch (e) {}
}

function vvPeerReleaseSeen() {
    try { vvPeerHandleOne(vvSharedGet(VV_PEER_KEY, null), false); } catch (e0) {}
    try {
        if (typeof GM_getValue === 'function') vvPeerHandleOne(GM_getValue(VV_GM_BUS, null), true);
    } catch (e1) {}
}

// 并行预算：并发页数越多，每页分到的缓冲与内存越少。
// 画质红线：只压缓冲与内存，不动清晰度档位——分辨率由源和 ABR 决定，
// 真要省资源由用户在画质菜单手动选低档，脚本不擅自降画质。
// 多解码器并发的兜底是默认的单实例模式，而不是压画质。
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

        // 画质红线：保持 autoLevelCapping = -1（不封顶）。
        // 以前并行 2/3 页会把档位压到 ≤480P / ≤360P，用户要的原画质直接没了；
        // 并发解码器压力交给默认单实例模式与上面的缓冲预算消化。
        // 用户手选档位走 nextLevel，与 capping 互不干扰，这里不碰。
        try {
            if (inst.autoLevelCapping !== -1) inst.autoLevelCapping = -1;
        } catch (e2) {}
    } catch (e) {}
}

// 周期仲裁
function vvLeaseTick() {
    try {
        // 别的页签正在开播、请求让出解码器：这条必须在"本页在不在播"之前判断，
        // 否则本页一退出就没人理会别人的求让了。
        vvPeerReleaseSeen();
        if (!VV.playerActive || !VV.active) return;
        // 隐藏的页面不参与抢权，否则会把正在看的那一页挤掉
        if (vvTabHidden()) return;
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
        // 兜底：挂起超过 8 秒还没恢复，就直接把解码器交出去（正常路径在进后台那一刻就交了）
        if (VV.active._suspended && VV.active._suspendAt &&
            Date.now() - VV.active._suspendAt > 8000 && !VV.active._mediaReleased) {
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
        if (VV._releaseTimer) { clearTimeout(VV._releaseTimer); VV._releaseTimer = 0; }
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
        if (VV._releaseTimer) { clearTimeout(VV._releaseTimer); VV._releaseTimer = 0; }
        vvPlayersUnregister();
        try { if (VV.active && VV.active.hls) VV.active.hls.destroy(); } catch (e1) {}
        try { if (VID) { VID.pause(); VID.removeAttribute('src'); VID.load(); } } catch (e2) {}
        try { vvSetPageFreeze(false); } catch (e3) {}
        // 网页铺满的黑底遮罩也会让人以为「页面被冻住」，逃生门一并拆掉
        try { vvPageFsSet(false, true); } catch (ePF) {}
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
        vvToast('已开启多页并行播放：多个页面可同时播放，只压缩缓冲与内存，画质不变', true);
        try { if (VV.active) vvApplyParallelBudget(vvPlayersCount()); } catch (e) {}
    } else {
        vvToast('已关闭并行播放：同一时间只允许一个页面播放（防解码器耗尽）', true);
    }
}

// ---- 全局"活跃视频页"计数 ----
// 设备解码器是全局资源，但"我这一页在播"只有本页知道。
// 每个页签在自己有在播的媒体时写一条带 TTL 的心跳，谁都能读到"现在全设备有几路在播"。
// 用途：页签多到有压力时（>=3 路），后台就别再"只暂停"，直接把 MSE 也交还，
// 否则十个视频页会一路把硬件解码器占满，最后连站点自己的播放器都起不来。
var VV_ACTIVE_PREFIX = 'vvs:active:';
var VV_ACTIVE_TTL = 12000;

function vvActiveTouch() {
    var has = false;
    try {
        var els = document.querySelectorAll('video,audio');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (!el) continue;
            // 判据是"还挂着媒体管线"，不是"正在播"：
            // 暂停的 MSE 元素同样占着一条管线，只是不产生帧。
            // 用"在播"做判据的话，后台页把自己标成非活跃，压力永远算不出来。
            try {
                if (!el.ended && (el.currentSrc || el.src || el.getAttribute('src'))) { has = true; break; }
            } catch (e0) {}
        }
    } catch (e1) {}
    try {
        var k = VV_ACTIVE_PREFIX + vvLeaseId();
        // 只在"状态变了"或"心跳快过期"时才动 localStorage。
        // 这是同步磁盘操作：十几个页签每 2 秒各写一次，累积起来是实打实的主线程阻塞，
        // 还会让其它页签的 storage 回调被反复唤醒。TTL 是 12 秒，6 秒刷一次完全够。
        if (has) {
            var prev = VV._actMark || 0;
            if (!prev || Date.now() - prev > 6000) {
                localStorage.setItem(k, JSON.stringify({ ts: Date.now() }));
                VV._actMark = Date.now();
            }
        } else if (VV._actMark) {
            localStorage.removeItem(k);
            VV._actMark = 0;
        }
    } catch (e2) {}
    return has;
}

function vvActiveCount() {
    var n = 0, now = Date.now(), del = [];
    try {
        for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (!k || k.indexOf(VV_ACTIVE_PREFIX) !== 0) continue;
            var e = null;
            try { e = JSON.parse(localStorage.getItem(k)); } catch (e1) {}
            if (!e || now - (e.ts || 0) > VV_ACTIVE_TTL) { del.push(k); continue; }
            n++;
        }
        for (var d = 0; d < del.length; d++) { try { localStorage.removeItem(del[d]); } catch (e2) {} }
    } catch (e3) {}
    return n;
}

function vvActiveClear() {
    try { localStorage.removeItem(VV_ACTIVE_PREFIX + vvLeaseId()); } catch (e) {}
}

// ---- 真正归还一路解码器 ----
// 这是整套"播放不了"问题的根：pause() 不等于释放。
// <video> 只要还挂着资源，就握着一条完整的解码管线（demuxer + decoder + renderer），
// MediaCodec 实例不会退回系统。必须让它回到"无资源"状态：摘 src（或 srcObject）再 load()。
// 注意 load() 不能省：按 HTML 规范，removeAttribute('src') 本身不会触发资源选择算法，
// 只摘不 load，浏览器手里的播放器一动不动。
// 判断元素现在是否还攥着资源。
// 注意不能只看 getAttribute('src')：站点常用 `<source>` 子元素或直接写 el.src 属性，
// 这时属性值是 null 但元素确实有源，误判会让你把好好的播放器又"恢复"一次。
function vvHasSrc(el) {
    if (!el) return false;
    // 只看"属性/IDL"，不看 currentSrc：
    // 摘掉 src + load() 之后 currentSrc 会残留一会儿（资源选择还没跑完），
    // 拿它判断"没拆过"会让我们跳过恢复，页面就一直黑着。
    try { if (el.src) return true; } catch (e0) {}
    try { if (el.getAttribute && el.getAttribute('src')) return true; } catch (e1) {}
    return false;
}

// ---- 声音自愈 ----
//
// 为了交还解码器，我们会把 <video> 临时压成 muted=true / volume=0。
// 还原它原本只挂在几条明确的路径上（attach 成功 / thaw / 重建），
// 但真实 WebView 里"回到前台"有很多条：visibilitychange、页面冻结后 resume、
// bfcache pageshow、Via 自己的前后台切换、还有站点在后台把播放器重建一遍。
// 漏掉任何一条，用户看到的就是"切回来画面在动、一点声音没有"。
//
// 与其把每条路径都补一遍（补不完），不如在巡检里做一次幂等兜底：
// 前台、没有待恢复记录的元素，一律回到"用户原本的静音/音量"。
function vvRestorePageAudio() {
    var n = 0;
    try {
        // 后台/让位态一律不动：这时开声音等于让用户听见一个看不见的页面。
        // 等用户真的回到这页（_yielded 由 vvLeaveBackground 清掉）再补。
        if (vvTabHidden() || VV._bg || VV._yielded) return 0;
    } catch (e0) {}
    try {
        var els = document.querySelectorAll('video,audio');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            try {
                if (!el || (ROOT && ROOT.contains(el))) continue;
                if (!el.__vvUsMuted) continue;
                if (VV._hib && VV._hib.length) {
                    // 有挂起的恢复记录：让 vvThawMedia / vvAttachMedia 走它们的流程，
                    // 这里只把"已经装回去、但还静着"的补一下。
                    var pending = false;
                    for (var j = 0; j < VV._hib.length; j++) {
                        if (VV._hib[j] && VV._hib[j].el === el) { pending = true; break; }
                    }
                    if (pending && !vvHasSrc(el)) continue;
                }
                var wantMuted = (el.__vvMuted === true);
                if (el.muted !== wantMuted) el.muted = wantMuted;
                if (!el.volume) el.volume = (typeof el.__vvVol === 'number' && el.__vvVol > 0) ? el.__vvVol : 1;
                delete el.__vvUsMuted;
                delete el.__vvMuted;
                delete el.__vvVol;
                if (!wantMuted) n++;
            } catch (e1) {}
        }
    } catch (e2) {}
    return n;
}

// 播放器自己的 <video> 同理：用户没有主动静音，就不该是静音态。
function vvRestorePlayerAudio() {
    try {
        if (!VID || !VV.playerActive) return 0;
        if (vvTabHidden() || VV._bg || VV._yielded) return 0;
        if (VID.__vvMuted !== undefined) return 0;     // 有挂起的释放，等它自己还原
        if (VV._userMuted) return 0;                   // 用户自己按的静音，别抢
        var n = 0;
        if (VID.muted) { VID.muted = false; n++; }
        if (!VID.volume) { VID.volume = (typeof VV.active === 'object' && VV.active && VV.active.vol > 0) ? VV.active.vol : 1; n++; }
        return n;
    } catch (e) { return 0; }
}

// 元素"用户原本的静音状态"。
// 不能直接用 el.muted：我们自己为了立刻止住残余音频会临时把它设成 true，
// 这时候再记录一次，就会把"临时静音"固化成用户的选择——之后每次都静音。
function vvOrigMuted(el) {
    try {
        if (el && el.__vvMuted !== undefined) return !!el.__vvMuted;
    } catch (e0) {}
    try { return !!(el && el.muted); } catch (e1) { return false; }
}

function vvDetachMedia(el) {
    if (!el) return false;
    // 和 vvHardReleaseVideo 一样：静音是临时措施，先把用户原本的状态记下来，
    // 装回去的时候（vvAttachMedia / vvThawMedia）要原样还原，否则就是"有画面没声音"。
    try { if (el.__vvMuted === undefined) el.__vvMuted = (el.muted === true); } catch (eM0) {}
    try { if (el.__vvVol === undefined) el.__vvVol = (typeof el.volume === 'number' ? el.volume : 1); } catch (eV0) {}
    try { el.pause(); } catch (e0) {}
    try {
        el.__vvUsMuted = true;
        if (el.muted !== true) {
            el.muted = true;
            if (typeof VV === 'object') { VV._muteBy = 'detach'; VV._muteCount = (VV._muteCount || 0) + 1; }
        }
    } catch (e1) {}
    try { if (el.srcObject) el.srcObject = null; } catch (e2) {}
    try { el.removeAttribute('src'); } catch (e3) {}
    // 必须连 <source> 子元素一起清：只摘 video 的 src 属性再 load()，
    // 资源选择算法会重新去选 <source src>，当场又建一条管线——
    // 等于"拆了但又装回去"，解码器一路没还。
    try { while (el.firstChild) el.removeChild(el.firstChild); } catch (e3b) {}
    try { el.load(); } catch (e4) {}
    return true;
}

// 把一路媒体装回去。直链可以直接恢复；blob/MSE 只有页面没 revoke 才有机会，
// 大部分站点在 detach 后 MediaSource 已 closed，会走到 onFail。
function vvAttachMedia(el, src, t, autoplay, onFail, muted) {
    if (!el || !src) return;
    var done = false;
    function ok() {
        if (done) return;
        done = true;
        try { el.removeEventListener('loadedmetadata', ok); } catch (eR) {}
        try { if (t > 0.5 && isFinite(t)) el.currentTime = t; } catch (eS) {}
        // 还原原来的静音状态：detach 时为了立刻省资源设了 muted，
        // 恢复后如果不还原，用户会以为视频没声音。
        try { el.muted = !!muted; } catch (eM) {}
        // 元素可能刚被"硬释放"过（volume 被压成 0）：只还原 muted 不够，
        // volume 还是 0 的话照样没声音。
        try {
            if (!el.volume) el.volume = (typeof el.__vvVol === 'number' && el.__vvVol > 0) ? el.__vvVol : 1;
        } catch (eV) {}
        try { delete el.__vvMuted; delete el.__vvVol; } catch (eDel) {}
        if (autoplay) { try { vvApAllowNext(el); } catch (eA) {} try { el.play().catch(function () {}); } catch (eP) {} }
    }
    function bad() {
        if (done) return;
        done = true;
        try { el.removeEventListener('loadedmetadata', ok); } catch (eR) {}
        // 装不回去也要把临时静音还回去：站点随后会自己重建播放器，
        // 元素如果还停在 muted=true，重建出来的是一路"有声轨但没声音"的视频。
        try { vvRestoreAudio(el); } catch (eRM) {}
        if (onFail) { try { onFail(); } catch (eF) {} }
    }
    try { el.addEventListener('loadedmetadata', ok); } catch (eL) {}
    try { el.addEventListener('error', bad, { once: true }); } catch (eE) {}
    try { el.src = src; el.load(); } catch (eA) { bad(); }
    // 有的流已经缓存在内存里，不会再派发 loadedmetadata
    setTimeout(function () { try { if (el.readyState >= 1) ok(); } catch (eT) {} }, 1200);
}

// 用户点提示条时的第一步：先不刷新，把让位时记下的**直链**源重新挂回去。
//
// 为什么不能直接刷新：刷新会把页面脚本整条重跑一遍，站点自己的播放器、
// 自动连播、甚至"新窗口播放"那套逻辑跟着一起跑——用户看到的后果就是
// "点一次重载，凭空多出一串页签"。能就地恢复就地恢复，只有 MSE
// （blob: 对应的 MediaSource 已经 closed）才真去刷新。
function vvReviveYielded() {
    var list = (VV._hib || []).slice();
    var retry = [];
    for (var i = 0; i < list.length; i++) {
        var it = list[i];
        if (it && it.src && !it.blob) retry.push(it);
    }
    if (!retry.length) return 0;
    // 本页此刻还在 _yielded 态，正常路径会故意把装源拦下来；
    // 用户亲自动手了就得放行，只放开这一小段窗口，2.5 秒后自动收回。
    VV._allowSrc = true;
    for (var j = 0; j < retry.length; j++) {
        try {
            vvAttachMedia(retry[j].el, retry[j].src, retry[j].t,
                retry[j].paused === false, null, retry[j].muted);
        } catch (e0) {}
    }
    setTimeout(function () { try { VV._allowSrc = false; } catch (e1) {} }, 2500);
    return retry.length;
}

// 被拆掉的 MSE 流装不回来了：不要静默黑屏，给一条能点的提示。
function vvMediaLost(el) {
    try {
        if (VV._lostTip && VV._lostTip.parentNode) return;
        var d = document.createElement('div');
        d.setAttribute('id', 'vv-lost-tip');
        d.style.cssText = 'position:fixed;left:12px;right:12px;bottom:84px;z-index:2147483000;' +
            'background:rgba(24,24,28,.94);color:#fff;font:13px/1.5 -apple-system,sans-serif;' +
            'padding:10px 12px;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.35);' +
            'display:flex;gap:10px;align-items:center;pointer-events:none;';
        var txt = document.createElement('span');
        txt.style.cssText = 'flex:1;';
        txt.textContent = '本页已让出视频解码器';
        var btn = document.createElement('button');
        btn.textContent = '恢复播放';
        btn.style.cssText = 'flex:none;pointer-events:auto;background:#ff5c5c;color:#fff;border:0;border-radius:6px;padding:6px 10px;font-size:12px;';
        function doReload() {
            btn.textContent = '重载中…';
            try { btn.disabled = true; } catch (eD) {}
            // 留个标记：刷新后 5 秒内不把本页判成后台（站点首屏还没挂完播放器时
            // 焦点状态经常是错的，一判后台就拆，拆完又弹条，看起来像"重载没用"）。
            try { sessionStorage.setItem('vvs:reloaded', String(Date.now())); } catch (eS) {}
            try { location.reload(); } catch (eR) {
                try { btn.disabled = false; btn._busy = false; btn.textContent = '恢复播放'; } catch (eR2) {}
            }
        }
        btn.onclick = function () {
            if (btn._busy) return;
            btn._busy = true;
            var retried = 0;
            try { retried = vvReviveYielded(); } catch (eR0) {}
            if (retried > 0) {
                btn.textContent = '恢复中…';
                setTimeout(function () {
                    var back = false;
                    try {
                        var vs = document.querySelectorAll('video');
                        for (var i = 0; i < vs.length; i++) {
                            var v = vs[i];
                            if (!v || (ROOT && ROOT.contains(v))) continue;
                            if (v.readyState >= 2 && vvHasSrc(v)) { back = true; break; }
                        }
                    } catch (eR1) {}
                    if (back) {
                        // 画面回来了就别刷新：刷新会丢页面状态，有的站点还会顺手再开播放器窗口。
                        VV._hib = null;
                        vvRemoveLostTip();
                        return;
                    }
                    doReload();
                }, 1800);
                return;
            }
            doReload();
        };
        d.appendChild(txt); d.appendChild(btn);
        (document.body || document.documentElement).appendChild(d);
        VV._lostTip = d;
        // 不自动消失：用户可能过了半分钟才切回来，这时候正是最需要这个按钮的时候。
        // 站点自己恢复出画面时由 vvRemoveLostTip() 收掉。
    } catch (e) {}
}

function vvRemoveLostTip() {
    try {
        if (VV._lostTip && VV._lostTip.parentNode) VV._lostTip.parentNode.removeChild(VV._lostTip);
        VV._lostTip = null;
    } catch (e) {}
}

// 收到别的页签的"求让"：把本页所有解码器都交出去，包括站点自己的 MSE 播放器。
// 页签之间没法直接操作对方的 MediaCodec，但大家跑同一份脚本、共用一份存储，
// 所以用一条广播来协调——对方要开播，本页立刻停手。
// 后台宽限内不许拆「我们自己的播放器」。系统弹窗（下载、分享、权限框）会让页面
// 隐藏一两秒又回来，这期间只挂起不拆，回来 play() 就能续上；拆了就得整条重建。
// 页面自带的播放器不受宽限影响，一律立刻交还。
function vvBgReleasePending() {
    try {
        return !!(VV._bg && VV._releaseTimer &&
            Date.now() - (VV._bgAt || 0) < VV_BG_RELEASE_MS);
    } catch (e) { return false; }
}

function vvReleaseAllMedia(reason) {
    var n = 0;
    try {
        if (VV.playerActive) {
            // 'bg' 这条路径的释放由 vvEnterBackground 的定时器统一负责；
            // 巡检在宽限内也不许提前拆。让位 / 手动 / 外部 API 仍按原样立即释放。
            var keepOurs = reason === 'bg' ||
                (reason === 'sweep' && vvBgReleasePending());
            if (!keepOurs) {
                try { vvSuspendPlayback(reason === 'peer' ? 'other' : 'hidden'); } catch (e0) {}
                try { vvReleaseDecoder(); } catch (e0b) {}
            }
        }
    } catch (e1) {}
    try {
        var els = document.querySelectorAll('video,audio');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            try {
                if (!el || (ROOT && ROOT.contains(el))) continue;
                if (el.mediaKeys) continue;
                var src = el.currentSrc || el.getAttribute('src');
                if (!src) continue;
                if (!VV._hib) VV._hib = [];
                var hit = false;
                for (var j = 0; j < VV._hib.length; j++) {
                    if (VV._hib[j] && VV._hib[j].el === el) { hit = true; break; }
                }
                if (!hit) {
                    VV._hib.push({
                        el: el, src: src, blob: src.indexOf('blob:') === 0,
                        t: el.currentTime || 0, paused: !!el.paused,
                        muted: vvOrigMuted(el), deep: true
                    });
                }
                vvDetachMedia(el);
                n++;
            } catch (e2) {}
        }
    } catch (e3) {}
    // 主动交还（对方求让 / 用户点菜单让出）都进入"让位态"：
    // 之后站点再想重建播放器会被门禁拦住，否则刚让出的解码器立刻又被它占回去。
    if (reason === 'peer' || reason === 'manual') {
        VV._yielded = true;
        VV._yieldedAt = Date.now();
    }
    VV._peerReleased = true;
    VV._peerReleasedAt = Date.now();
    VV._peerReleaseCount = (VV._peerReleaseCount || 0) + n;
    VV._lastReleaseAt = Date.now();
    VV._lastReleaseWhy = reason || 'api';
    VV._releaseTotal = (VV._releaseTotal || 0) + n;
    // 一路都没拆到就别留个空数组，否则 vvHibernateMedia 的 `if (VV._hib) return`
    // 会误以为"已经休眠过"，后面的后台释放全被跳过。
    if (VV._hib && !VV._hib.length) VV._hib = null;
    return n;
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
                // 暂停的直链也照拆：暂停的 <video> 未必已经把解码器还回去，
                // 一页一路积起来就是好几路白占着，而直链拆了能无损装回。
                // 暂停的 MSE 不拆（见下）。
                var t = el.currentTime || 0;
                var wasPaused = !!el.paused;
                if (src.indexOf('blob:') === 0) {
                    // MSE 的 blob 摘了就装不回去：站点播放器会变成永久黑屏。
                    // 所以后台只暂停（Chromium 会把暂停的 pipeline 挂起），
                    // 真正要抢解码器时（收到别的页签求让 / 本页解码失败）由
                    // vvReleaseAllMedia() 统一深拆——那条路径会明确提示用户。
                    if (wasPaused) continue;   // 暂停的 MSE 不动，拆了就回不来
                    list.push({ el: el, src: src, blob: true, t: t, paused: wasPaused, muted: vvOrigMuted(el), deep: false });
                    try { el.pause(); } catch (eB) {}
                    continue;
                }
                list.push({ el: el, src: src, t: t, paused: wasPaused, muted: vvOrigMuted(el), deep: true });
                vvDetachMedia(el);
            } catch (e3) {}
        }
        VV._hib = list.length ? list : null;
    } catch (e) {}
}

// 解码器真的不够用时的最后一招：连 blob/MSE 的页面播放器一起拆掉。
// 代价是回到这一页时站点自带的播放器可能是黑的（需要用户点一下站点的播放键让它重建），
// 所以只在"点了播放却始终没有画面"时调用。
function vvDeepHibernateBlob() {
    try {
        var els = document.querySelectorAll('video,audio');
        var n = 0;
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            try {
                if (ROOT && ROOT.contains(el)) continue;
                if (el.mediaKeys) continue;
                var src = el.currentSrc || el.getAttribute('src');
                if (!src) continue;
                vvHardReleaseVideo(el);
                n++;
            } catch (e1) {}
        }
        return n;
    } catch (e) { return 0; }
}

function vvThawMedia() {
    try {
        var list = VV._hib || [];
        VV._hib = null;
        for (var i = 0; i < list.length; i++) {
            var it = list[i];
            try {
                if (vvHasSrc(it.el)) {
                    // 保守模式没拆过：接着播就行
                    if (!it.paused) it.el.play().catch(function () {});
                    continue;
                }
                if (!it.src) continue;
                // MSE（blob:）别装回去：让位时 MediaSource 已经 closed，把 blob URL
                // 重新赋给元素只会得到一条"有管线、没数据"的假管线——pipelines 计数 +1、
                // readyState 一直是 0、画面全黑，既没恢复播放，又白占一个解码器槽位，
                // 正是我们想避免的情况。正确做法是让站点自己的播放器重建
                // （hls.js/shaka 在前台恢复定时器后会发现 media 被 reset 而自行 attach），
                // 我们只负责清干净并观察，起不来再给用户一个明确的恢复入口。
                if (it.blob) {
                    // 让位时元素被压成 muted=true / volume=0，站点重建播放器时
                    // 不会主动改回来（它只负责装源和 play），所以这里必须自己还原。
                    try { vvRestoreAudio(it.el); } catch (eRT) {}
                    try { it.el.load(); } catch (eLB) {}
                    (function (el) {
                        setTimeout(function () {
                            var rs = 0;
                            try { rs = el.readyState || 0; } catch (eRS) {}
                            if (rs < 2) vvMediaLost(el);
                            else vvRemoveLostTip();
                        }, 1800);
                    })(it.el);
                    continue;
                }
                // 被拆过的直链：装回去就行。
                vvAttachMedia(it.el, it.src, it.t, it.paused === false, (function (rec) {
                    return function () {
                        // blob 恢复失败多半不是"装不回去"，而是接管解码器需要时间：
                        // 别的页签从"发现失去焦点"到真正把 MediaCodec 交出来要几秒。
                        // 直接判死会让用户以为这页废了，隔 2.5 秒再试一次。
                        if (!rec._retried) {
                            rec._retried = true;
                            setTimeout(function () {
                                try {
                                    vvAttachMedia(rec.el, rec.src, rec.t, rec.paused === false,
                                        function () { vvMediaLost(rec.el); }, rec.muted);
                                } catch (eR) { vvMediaLost(rec.el); }
                            }, 2500);
                            return;
                        }
                        vvMediaLost(rec.el);
                    };
                })(it), it.muted);
            } catch (e) {}
        }
        VV._peerReleased = false;
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
//
// 这里的核心原则：**后台页签不持有任何解码器**。
// 以前是"先挂起、20 秒后再释放、而且必须存在 hls 实例"，直链 mp4 和刚切走的那十几秒
// 全都在占着 MediaCodec；几个页签一起来就是"新页签能加载但播不动"。
function vvEnterBackground() {
    try {
        if (VV._bg) return;
        // 刚刷新完的 5 秒宽限（见 vvSetupLifecycle）：这段时间不判后台，
        // 否则首屏还没起播就被拆，用户点完"重载"只会看到一个当场黑掉的页面。
        if (VV._bgGraceUntil && Date.now() < VV._bgGraceUntil) return;
        VV._bg = true;
        VV._bgAt = Date.now();        VV._bgCount = (VV._bgCount || 0) + 1;
        try { if (VV._hibTimer) { clearTimeout(VV._hibTimer); VV._hibTimer = 0; } } catch (e0) {}
        try { vvFlushLazy(); } catch (eF) {}
        try { vvSaveNow(); } catch (eS) {}
        // 1) 页面自带的播放器：一律深度交还，不问"全局有几路在播"。
        //
        // 这里是整套机制的核心约束：**非当前页不持有任何解码器**。
        // 以前是"全局活跃 >=3 路才深拆"，两个问题叠在一起让它从不生效：
        //   a) 那个计数存在 localStorage 里，而 localStorage 是按 origin 隔离的，
        //      用户开的十个页签是十个不同站点 → 每页都只数到自己 1 路，永远到不了 3；
        //   b) 默认分支对 blob/MSE 只 pause()，而 pause 根本不归还 MediaCodec。
        // 结果就是十个页签、九个后台页各攥一路硬件解码器，第十个"能加载、出不来画面"。
        if (VV.cfg.hibernate === false) {
            try { vvPauseHiddenMedia(); } catch (eH0) {}
        } else {
            try { vvHibernateMedia(); } catch (eH) {}
            try { vvPauseHiddenMedia(); } catch (eP) {}
            try { vvReleaseAllMedia('bg'); } catch (eRA) {}
        }
        // 2) 我们的播放器：先挂起（pause + stopLoad），解码器留 1.2 秒宽限再交还。
        // 系统弹窗（下载 .m3u、权限框、分享面板）会让页面短暂隐藏又立刻回来，
        // 立即释放的话回前台只能整条重建播放实例——用户点个「导出」就看到
        // 「正在重建播放实例…」和一次播放中断，实测 pip-share 的 toast 断言就是这样被顶掉的。
        // 短暂后台不释放，回来只需 resume play；真切走超过 1.2s 仍按原样彻底交还，
        // 「非当前页不持有解码器」这条核心约束没变。
        if (VV.playerActive) {
            try { vvSuspendPlayback('hidden'); } catch (e1) {}
            try { vvPlayersUnregister(); } catch (e2) {}
            try {
                if (VV._releaseTimer) clearTimeout(VV._releaseTimer);
                VV._releaseTimer = setTimeout(function () {
                    VV._releaseTimer = 0;
                    try {
                        if (VV._bg && VV.active && VV.active._suspended) vvReleaseDecoder();
                    } catch (eR) {}
                }, VV_BG_RELEASE_MS);
            } catch (e3) {}
        }
    } catch (e) {}
}

function vvLeaveBackground() {
    try {
        VV._bg = false;
        VV._bgAt = 0;
        // 回到前台 = 这一页重新持有解码器，之前答应的"让位"作废。
        // 清理时也把 _claimAt 一并更新：否则刚回前台就被别人一条更早的求让按下去。
        VV._yielded = false;
        VV._claimAt = Date.now();
        try { if (VV._hibTimer) { clearTimeout(VV._hibTimer); VV._hibTimer = 0; } } catch (e0) {}
        // 宽限期内回来了：解码器压根没交出去，取消这次释放
        try { if (VV._releaseTimer) { clearTimeout(VV._releaseTimer); VV._releaseTimer = 0; } } catch (eR0) {}
        // 先宣告"我回到前台了"：别的页签读到就立刻让位（同源还有 storage 事件即时触发）。
        // 跨站的靠 GM 通道，两条都不通就只能等对方自己失焦判定。
        try { vvAnnounceFront(); } catch (eF) {}
        try { vvRequestPeerRelease(); } catch (eC) {}
        try { vvThawMedia(); } catch (e1) {}
        try { vvResumeHiddenMedia(); } catch (e2) {}
        // 关播放器时因为在后台而没恢复的页面视频，等回到前台再补上
        try {
            var d = VV._pageMediaDeferred;
            if (d && d.length) {
                VV._pageMediaDeferred = [];
                if (typeof vvResumePageMediaNow === 'function') vvResumePageMediaNow(d);
            }
        } catch (e2b) {}
        if (VV.playerActive && VV.active) {
            try { vvLeaseTick(); } catch (e3) {}
            try { vvResumePlayback(); } catch (e4) {}
        }
        // 回前台立刻补一次声音：巡检是 900ms 一轮，够快但用户能听出来那一下。
        try { vvRestorePageAudio(); } catch (eAH2) {}
        try { vvRestorePlayerAudio(); } catch (ePH2) {}
    } catch (e) {}
}

// 有些 WebView 壳切标签时根本不派发 visibilitychange，
// 所以额外用 rAF 心跳 + 焦点轮询兜底（见 vvVisibilityTick）。
function vvFocusPoll() {
    vvVisibilityTick();
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
// beforeunload 与 pagehide 会先后各调一次，两次都做全量媒体释放等于把同一件事干两遍。
// 页面上摆着几十个 <video>（预加载、广告位、连播预览）的站点，这两遍会明显拖慢关页签——
// 用户感知就是"点关闭，浏览器卡住两秒才反应"。只做一次即可。
var _vvReleasedOnce = false;
function vvHardTeardown(final) {
    // 留下时间戳：真机上关标签页后没法回看日志，只能靠这个外部可读的痕迹判断
    // "是我们清理的"还是"WebView 自己回收的"，排查释放类问题离不开它。
    try { VV._lastTeardown = Date.now(); } catch (eTS) {}
    // 关页签时把自己的"活跃视频页"心跳撤掉，否则别的页会以为这一路还在播，
    // 后台压力判断被幽灵条目顶高，白白多拆解码器。
    try { vvActiveClear(); } catch (eAC) {}
    // 定时器清理和媒体释放分开去重：beforeunload 可能先来（只做释放），
    // pagehide 后到（必须把定时器也停掉）。合成一个标记会让后到的那次什么都不做，
    // 页面在 bfcache 里还会被自己的巡检叫醒。
    if (final) {
        if (_vvTornDown) {
            // 已经彻底清过一轮，后面再来的都是重复事件
        } else {
            _vvTornDown = true;
            try { if (VV._hibTimer) { clearTimeout(VV._hibTimer); VV._hibTimer = 0; } } catch (e0) {}
            try { if (VV._focusTimer) { clearInterval(VV._focusTimer); VV._focusTimer = 0; } } catch (e0b) {}
            try { if (ROOT) clearTimeout(ROOT._csTimer); } catch (e0c) {}
            try { vvStopLoadTick(); } catch (e0d) {}
            try { vvLeaseStop(); } catch (e1) {}
        }
    }
    if (_vvReleasedOnce) return;
    _vvReleasedOnce = true;
    // hls 实例池可能不止一个（重建失败、旧实例 destroy 抛错都会留下残余），全清。
    try { vvKillAllHls(); } catch (e2) {}
    // 直链 mp4 没有 hls 实例，上面这步完全管不到它。必须单独硬释放播放器自己的 video，
    // 否则关掉标签后 MediaCodec 会一直挂着，直到 WebView 进程被回收。
    try { vvHardReleaseVideo(VID); } catch (e3) {}
    // 站点自带的播放器也一起还回去：标签都要关了，没有理由让它继续占着解码器。
    // 用查 DOM 而不是靠 VID，因为 closePlayer 之后 VID 已经被置成 null 了。
    //
    // 只处理"真的挂着源"的元素，而且最多 12 个：
    // 广告站/信息流页面上常有几十个预加载的空 <video>，对每个都 removeAttribute + load()
    // 是纯浪费（系统解码器上限本来只有个位数，后面的不可能各自持有管线），
    // 而关页签这条路径是同步执行的，拖慢的每一毫秒都直接体现在"点了没反应"。
    try {
        var vs = document.querySelectorAll('video,audio');
        var rel = 0;
        for (var i = 0; i < vs.length && rel < 12; i++) {
            var el = vs[i];
            if (!el || el === VID) continue;
            var hs = false;
            try { hs = !!(el.getAttribute('src') || el.src || el.srcObject); } catch (eHS) {}
            if (!hs) continue;
            vvHardReleaseVideo(el);
            rel++;
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
    // 刚点过"重载"的页面：给 5 秒宽限，别在首屏加载期就把它判成后台。
    // 刷新后站点还没挂完播放器，焦点/可见性常常是错的值，一判后台就拆，
    // 拆完又弹"已让出解码器"，用户看到的就是"重载没用，还多了个提示"。
    try {
        if (sessionStorage.getItem('vvs:reloaded')) {
            sessionStorage.removeItem('vvs:reloaded');
            VV._bgGraceUntil = Date.now() + 5000;
        }
    } catch (eRG) {}
    // 后台页不许新建媒体管线（拦 src 赋值），比拦 play() 更靠前一步。
    try { vvInstallSrcGuard(); } catch (eSG) {}
    // 脚本一加载就宣告"我在前台"。
    // 新开的页签通常就是用户想看的那一个，其它页签收到就立刻让位，
    // 不用等它们自己发现失焦（那条要 4 秒）。跨站走 GM 通道，都收不到就靠失焦/停帧。
    try {
        if (!vvTabHidden()) {
            VV._claimAt = Date.now();
            vvAnnounceFront();
            vvRequestPeerRelease();
        }
    } catch (e0i) {}
    // 手指一碰屏幕就宣告主权：比"失焦 4 秒"早得多，而且是真凭实据——手指在这页上。
    try {
        var claim = function () { vvClaimFront(); };
        document.addEventListener('touchstart', claim, { passive: true, capture: true });
        document.addEventListener('pointerdown', claim, { passive: true, capture: true });
        document.addEventListener('keydown', claim, true);
    } catch (e0c) {}
    try {
        document.addEventListener('visibilitychange', function () {
            // 事件到了就直接动作，不用等轮询（轮询是给"事件不到"的壳兜底的）
            if (document.hidden) vvEnterBackground();
            else vvLeaveBackground();
            vvArmRaf();
        });
    } catch (e2) {}
    try {
        vvArmRaf();
        vvInstallPlayGate();
        VV._focusTimer = setInterval(vvFocusPoll, 900);
    } catch (e2b) {}
    // 常驻的"求让"监听：没打开内置播放器的页签也必须能被叫醒。
    // 这条以前只挂在 vvLeaseTick 里，而那个定时器只有打开播放器才启动，
    // 于是"只用站点原生播放器"的页签永远不会让位——多页签播放不动的另一半原因。
    try {
        if (VV._peerTimer) clearInterval(VV._peerTimer);
        VV._peerTimer = setInterval(function () {
            try { vvPeerReleaseSeen(); } catch (e) {}
            try { vvActiveTouch(); } catch (eA) {}
        }, 2000);
    } catch (e2p) {}
    // storage 事件：别的页签一广播就能立刻响应，不用等 2 秒轮询。
    // localStorage 的这个事件只在"其它页签"触发，正好是要的方向。
    try {
        window.addEventListener('storage', function (ev) {
            try {
                if (!ev || !ev.key) return;
                if (ev.key === VV_SHARED_PREFIX + VV_PEER_KEY) vvPeerReleaseSeen();
            } catch (e) {}
        });
    } catch (e2s) {}
    try {
        window.addEventListener('focus', function () {
            // 焦点回来只做"离开后台"的判定，是否真的可见交给 vvVisibilityTick，
            // 避免个别壳里焦点乱跳时反复重建播放管线
            vvVisibilityTick();
            vvArmRaf();
        });
        window.addEventListener('blur', function () {
            // 注意：地址栏、菜单、系统弹窗都会触发 blur，不能一见 blur 就拆解码器。
            // 交给 600ms 后的判定：只有 rAF 也停了（=页面真的不可见）才算进后台。
            setTimeout(function () { try { vvVisibilityTick(); } catch (eB) {} }, 600);
        });
    } catch (e2c) {}
    try {
        window.addEventListener('pagehide', function (ev) {
            try {
                if (ev && ev.persisted) {
                    // 进 bfcache：页面还活着，但已经不可见了——照样要把解码器交出去，
                    // 回来时由 pageshow 整条重建
                    vvEnterBackground();
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
    // 这里立刻归还；解冻（resume）后走正常的重建逻辑。
    try {
        document.addEventListener('freeze', function () {
            try { vvEnterBackground(); } catch (ez) {}
        });
        document.addEventListener('resume', function () {
            try { vvVisibilityTick(); } catch (ez2) {}
        });
    } catch (e5c) {}
    // 从 bfcache 恢复：上一次 pagehide/beforeunload 可能已经把 _vvTornDown 置位，
    // 不复位的话，恢复后再关标签页就永远不会再清理了（静默失效，最难查的一类）。
    try {
        window.addEventListener('pageshow', function (ev) {
            try {
                _vvTornDown = false;
                _vvReleasedOnce = false;
                if (ev && ev.persisted && VV.playerActive) vvLeaveBackground();
            } catch (ep) {}
        });
    } catch (e5d) {}
}
