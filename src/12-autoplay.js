// ---- 网页原生视频自动播放拦截 ----
//
// 很多站点一进页面就自动起播。在 Android WebView 里这会立刻占住一条硬件解码器
// （MediaCodec）并开始拉流：用户其实还没打算看，既白费流量，又会让随后打开的内置
// 播放器抢不到解码器（表现是"分片能下、就是不出画"）。
//
// 这里只治「页面自己的 <video>」，不动内置播放器（VID 在 ROOT 里），也不碰音频播放器：
//   1) 在 document-start 包住 HTMLMediaElement.prototype.play：没有真实用户手势时，
//      对页面 video 直接返回 NotAllowedError —— 和浏览器自动播放策略表现一致，
//      站点播放器会像被浏览器拦下一样退回收起 / 待点播状态；
//   2) 兜住 autoplay 属性起播（这类不走 play()）：监听 play 事件，非手势起播就暂停，
//      并摘掉 autoplay，避免它反复重试；
//   3) 把页面 video 的 preload="auto" 降到 metadata：拿得到时长/首帧，又不至于整段预载。
//
// 「用户点过页面」的判定用 transient activation（navigator.userActivation.isActive）
// 加上 1.2s 内有过 pointerdown/touchstart/click/keydown 的兜底窗口：站点自己的播放、
// 续播、以及我们恢复页面媒体的链路都不受影响（后者还会用 vvApAllowNext 显式放行）。
//
// 开关：更多菜单「网页视频自动播放」，配置项 pageAutoplay，默认 false = 拦截。

var VV_AP = {
    origPlay: null,
    lastGesture: 0,
    blocked: 0,
    hooked: false
};

function vvApCfgOn() {
    // 语义：cfg.pageAutoplay = true 表示「允许网页自动播放」
    try { return !!(VV && VV.cfg && VV.cfg.pageAutoplay); } catch (e) { return false; }
}

function vvApIsOurs(el) {
    try { return !!(ROOT && el && ROOT.contains(el)); } catch (e) { return false; }
}

function vvApIsVideo(el) {
    try { return !!(el && el.nodeName === 'VIDEO'); } catch (e) { return false; }
}

// 用户是不是刚和页面交互过。transient activation 只在手势的同一任务（及很短时间内）为真，
// 站点播放器通常在 click 处理里同步调 play()，这一条就够；异步再起播的用时间窗兜。
function vvApActivated() {
    try {
        if (typeof navigator !== 'undefined' && navigator.userActivation &&
            navigator.userActivation.isActive) return true;
    } catch (e0) {}
    return (Date.now() - VV_AP.lastGesture) < 1200;
}

function vvApShouldBlock(el) {
    if (!el) return false;
    if (vvApCfgOn()) return false;          // 配置里放开了自动播放
    if (!vvApIsVideo(el)) return false;     // 只治视频，不碰音频播放器
    if (vvApIsOurs(el)) return false;       // 内置播放器自己
    if (el.__vvApAllow) return false;       // 我们恢复页面媒体时的一次性放行
    if (vvApActivated()) return false;      // 用户已经点过页面
    return true;
}

function vvApNotAllowed() {
    try { return new DOMException('play() rejected: page autoplay blocked', 'NotAllowedError'); }
    catch (e) {
        var err = new Error('play() rejected: page autoplay blocked');
        err.name = 'NotAllowedError';
        return err;
    }
}

// 我们自己的恢复链路（vvAttachMedia / vvResumePageMediaNow）调用前打个标记，
// 让紧接着的那一次 play() 放行。play() 的判定是同步的，10ms 后清掉即可。
function vvApAllowNext(el) {
    if (!el) return;
    try { el.__vvApAllow = true; } catch (e) {}
    setTimeout(function () { try { el.__vvApAllow = false; } catch (e) {} }, 10);
}

// 只降级显式的 preload="auto"。留 metadata 给站点拿时长和首帧，不整段预载。
function vvApTamePreload(el) {
    try {
        if (!vvApIsVideo(el) || vvApIsOurs(el)) return;
        if (vvApCfgOn() || vvApActivated()) return;
        if (el.getAttribute('preload') === 'auto') {
            if (!el.__vvApPre) el.__vvApPre = 'auto';
            el.setAttribute('preload', 'metadata');
        }
    } catch (e) {}
}

// force=true 用于关闭内置播放器时强制还原。
// 播放器开着的时候不还原：那是"我们正在播"的时段，页面预载会跟播放器抢带宽
// （30-player 的 vvStopPagePreload 会把它按成 none）。
function vvApRestorePreload(force) {
    try {
        if (!force && VV && VV.playerActive) return;
        var els = document.querySelectorAll('video');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (!el.__vvApPre) continue;
            try { el.setAttribute('preload', el.__vvApPre); } catch (e0) {}
            try { el.__vvApPre = ''; } catch (e1) {}
        }
    } catch (e) {}
}

function vvApInstall() {
    if (VV_AP.hooked) return;
    VV_AP.hooked = true;

    // 1) 包 play()：JS 主动起播（含站点播放器初始化时的那一次）
    try {
        var proto = (typeof HTMLMediaElement !== 'undefined') ? HTMLMediaElement.prototype : null;
        if (proto && typeof proto.play === 'function' && !proto.__vvApHooked) {
            VV_AP.origPlay = proto.play;
            proto.__vvApHooked = true;
            proto.play = function () {
                try {
                    if (vvApShouldBlock(this)) {
                        VV_AP.blocked++;
                        try { this.autoplay = false; this.removeAttribute('autoplay'); } catch (eA) {}
                        try { this.pause(); } catch (eP) {}
                        return Promise.reject(vvApNotAllowed());
                    }
                } catch (eC) {}
                return VV_AP.origPlay.apply(this, arguments);
            };
        }
    } catch (eInst) {}

    // 2) 兜住 autoplay 属性：浏览器自己起播时不经过 play()，只能从事件上拦
    try {
        document.addEventListener('play', function (e) {
            var el = e && e.target;
            if (!vvApShouldBlock(el)) return;
            VV_AP.blocked++;
            try { el.autoplay = false; el.removeAttribute('autoplay'); } catch (eA) {}
            try { el.pause(); } catch (eP) {}
        }, true);
    } catch (eEv) {}

    // 3) 手势：记时间点，并把之前降级的 preload 还回去
    var mark = function () {
        VV_AP.lastGesture = Date.now();
        vvApRestorePreload();
    };
    var types = ['pointerdown', 'touchstart', 'mousedown', 'click', 'keydown'];
    for (var i = 0; i < types.length; i++) {
        try { window.addEventListener(types[i], mark, true); } catch (eW) {}
    }
}

vvApInstall();
