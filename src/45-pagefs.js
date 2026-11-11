// ============================================================
// 网页铺满（原名「页面全屏」）
//
// 做的事只有一件：把站点自己的播放器（video / iframe / canvas）铺满
// WebView 可视区，不用先打开嗅探播放器。**不调用** requestFullscreen()。
//
// 关于浏览器栏的边界（实测结论，别再按「保留状态栏」来宣传）：
//   · 我们从不碰 Via 的地址栏 / 底部工具栏，它们是 WebView 之外的系统 UI；
//   · 栏显示与否 100% 由 Via 自己的「下滑隐藏、上滑显示」决定，
//     用 scrollTo 这类程序化滚动叫不回来（没有手势，Via 不认）；
//   · 所以本文件也不锁页面滚动 —— 锁了就既叫不回栏、也让用户没法自己上滑。
//
// 它和播放器顶栏那枚「沉浸全屏」是两种独立模式：
//   · 网页铺满   = 网页层（本文件，脚本菜单 / 顶栏按钮）
//   · 沉浸全屏   = ROOT.requestFullscreen()，系统全屏，栏被隐藏
//
// 实现上只用 class + !important CSS，不写目标元素的 inline style、不移动
// video 节点：MSE/blob 流靠 DOM 位置活着，搬一次 DOM 就黑屏；
// 退出时摘 class 即可，页面样式零残留。
//
// 取目标按「实际能看见的画面」来挑，因为真实站点里视频不一定老老实实
// 躺在顶层文档的 <video> 里：
//   · <video> 在 open shadow root 里（自研播放器很常见）
//   · <video> 在 iframe 里（第三方播放器 / 站点用 iframe 隔离播放页）
//   · 画面被画到 <canvas> 上，<video> 只是 0 尺寸的解码器
// 这三种以前都会「点了没反应」，现在分别有对应兜底。
// ============================================================

if (!VV._pageFs) {
    VV._pageFs = {
        on: false,          // 菜单开关状态
        bound: false,       // document 级事件只绑一次
        timer: 0,           // 1.5s 巡检：视频延迟插入 / 被移除 / 播放器切换
        deepAt: 0,          // 上次深挖 shadow root 的时间（限制频率）
        deepPick: null,     // 深挖到的 shadow 视频
        video: null,        // 当前被铺满的 <video>（仅 kind=video）
        iframe: null,       // 当前被铺满的 <iframe>（仅 kind=iframe）
        canvas: null,       // 当前被铺满的 <canvas>（仅 kind=canvas）
        target: null,       // 实际挂 class 的元素（上面三者之一）
        kind: '',           // 'video' | 'iframe' | 'canvas'
        anc: [],            // 临时清掉 containing block 的祖先
        inner: null,        // iframe 内部（同源时）的注入记录
        shade: null,        // 黑底遮罩
        exit: null,         // 可见的退出按钮（Via 没有 Esc，必须有出口）
        suspended: false    // 内置播放器打开时暂时挂起
    };
}

// iframe 内部注入的样式：iframe 被拉满后，里面的 video 还得跟着满，
// 否则只会得到「大黑框里一个小画面」。
var VV_PAGEFS_INNER_CSS =
    '.vv-pagefs-inner-anc{transform:none!important;-webkit-transform:none!important;' +
    'filter:none!important;-webkit-filter:none!important;perspective:none!important;' +
    'will-change:auto!important;contain:none!important;' +
    'backdrop-filter:none!important;-webkit-backdrop-filter:none!important;' +
    'opacity:1!important;isolation:auto!important;mix-blend-mode:normal!important}' +
    '.vv-pagefs-inner-front-anc{z-index:2147483002!important}' +
    '.vv-pagefs-inner-video{position:fixed!important;left:0!important;top:0!important;' +
    'width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;' +
    'min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;' +
    'border:0!important;border-radius:0!important;object-fit:contain!important;' +
    'background:#000!important;opacity:1!important;visibility:visible!important;' +
    'z-index:2147483001!important}';

var VV_PAGEFS_ANC_PROPS = ['transform', '-webkit-transform', 'filter', '-webkit-filter',
    'perspective', 'will-change', 'contain', 'backdrop-filter', '-webkit-backdrop-filter'];

function vvPageFsState() {
    var st = VV._pageFs, sys = null;
    try { sys = document.fullscreenElement || document.webkitFullscreenElement || null; } catch (eS) {}
    return {
        on: !!st.on,
        suspended: !!st.suspended,
        video: !!st.video,
        target: !!st.target,
        kind: st.kind || '',
        iframe: !!st.iframe,
        canvas: !!st.canvas,
        anc: (st.anc || []).length,
        shade: !!st.shade,
        exit: !!st.exit,
        timer: !!st.timer,
        bound: !!st.bound,
        sys: !!sys,
        player: !!VV.playerActive
    };
}

function vvPageFsWin(el) {
    try {
        var d = el && el.ownerDocument;
        if (d && d.defaultView) return d.defaultView;
    } catch (e) {}
    return window;
}

// 元素是否真的「看得见」：0 尺寸、display:none、opacity:0 的都不算。
function vvPageFsVisible(el) {
    if (!el) return false;
    try {
        var cs = vvPageFsWin(el).getComputedStyle ? vvPageFsWin(el).getComputedStyle(el) : null;
        if (cs) {
            var disp = cs.display || '', vis = cs.visibility || '', op = cs.opacity;
            if (disp === 'none' || vis === 'hidden' || vis === 'collapse') return false;
            if (op !== undefined && op !== '' && parseFloat(op) === 0) return false;
        }
    } catch (eC) {}
    try {
        var r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
        if (r && (r.width < 2 || r.height < 2)) return false;
    } catch (eR) {}
    return true;
}

function vvPageFsArea(el) {
    try {
        var r = el.getBoundingClientRect();
        return Math.max(0, r.width) * Math.max(0, r.height);
    } catch (e) { return 0; }
}

// 是不是脚本自己播放器里的元素（跨 shadow 边界往上找）
function vvPageFsOwned(el) {
    var n = el, guard = 0;
    while (n && guard++ < 48) {
        try { if (n.closest && n.closest('#vv-player-root,.vv-player-root,#vv-pagefs-exit')) return true; } catch (e) {}
        var root = null;
        try { root = n.getRootNode ? n.getRootNode() : null; } catch (e2) {}
        if (root && root.host) { n = root.host; continue; }
        n = n.parentNode || null;
    }
    return false;
}

// 收集元素：deep=true 时连 open shadow root 一起挖。
// shadow 只在常规层挑不出目标时才挖，避免每次巡检都遍历整页。
function vvPageFsCollect(sel, deep) {
    var out = [], roots = [document], guard = 0;
    while (roots.length && guard++ < 24) {
        var r = roots.shift();
        if (!r) continue;
        try {
            var hit = r.querySelectorAll(sel);
            for (var i = 0; i < hit.length; i++) out.push(hit[i]);
        } catch (e1) {}
        if (!deep) continue;
        try {
            var all = r.querySelectorAll('*');
            for (var j = 0; j < all.length; j++) {
                if (all[j] && all[j].shadowRoot) roots.push(all[j].shadowRoot);
            }
        } catch (e2) {}
    }
    return out;
}

// 给候选打分：面积为主，正在播 / 有源 额外加权。
// 排除脚本自己的播放器元素，否则会把内置播放器又套一层。
function vvPageFsScore(el, kind) {
    if (!el || vvPageFsOwned(el)) return -1;
    if (!vvPageFsVisible(el)) return -1;
    var score = vvPageFsArea(el);
    if (kind === 'video') {
        try { if (!el.paused && el.readyState > 0) score += 100000000; } catch (eP) {}
        try {
            if (el.currentSrc || el.getAttribute('src') || (el.querySelectorAll && el.querySelectorAll('source').length)) score += 100000;
        } catch (eA) {}
    }
    return score;
}

function vvPageFsBest(list, kind) {
    var best = null, bestScore = -1;
    for (var i = 0; i < list.length; i++) {
        var s = vvPageFsScore(list[i], kind);
        if (s > bestScore) { bestScore = s; best = list[i]; }
    }
    return best;
}

// 后台 iframe 里若有正在播的视频，给它和顶层视频同等的「正在播」权重，
// 这样「顶层小广告 video + iframe 大播放器」能选对。
function vvPageFsIframeScore(f) {
    if (!f || vvPageFsOwned(f) || !vvPageFsVisible(f)) return { score: -1, inner: null };
    var inner = vvPageFsIframeInner(f);
    var area = vvPageFsArea(f);
    var s = area;
    if (inner) {
        try { if (!inner.paused && inner.readyState > 0) s += 100000000; } catch (e) {}
    }
    return { score: s, inner: inner, area: area };
}

// iframe 里是不是装着播放器：
//   · 同源 → 直接看内部有没有 <video>（有就优先，且不受面积门槛限制）
//   · 跨域 → 读不到，只能按「够大」判断（第三方播放器一般都在内容区铺满）
function vvPageFsIframeInner(f) {
    try {
        var doc = f.contentDocument;
        if (!doc) return null;
        var vs = doc.querySelectorAll('video');
        var best = null, bestScore = -1;
        for (var i = 0; i < vs.length; i++) {
            if (!vvPageFsVisible(vs[i])) continue;
            var s = 0;
            try { if (!vs[i].paused && vs[i].readyState > 0) s += 100000000; } catch (e) {}
            s += vvPageFsArea(vs[i]);
            if (s > bestScore) { bestScore = s; best = vs[i]; }
        }
        return best;
    } catch (e) { return null; }   // 跨域
}

// 挑「主画面」：video / shadow 里的 video → iframe → canvas
// 视频和 iframe 之间按分数比（面积 + 是否在播），canvas 只在前两者都没有时兜底，
// 否则页面上一块大的背景动画 canvas 会把真视频挤掉。
function vvPageFsPick() {
    var st = VV._pageFs;
    var vw = 0, vh = 0;
    try { vw = window.innerWidth; vh = window.innerHeight; } catch (e0) {}
    // 视口读不到时给个保守默认，否则面积门槛会变成 NaN（任何 iframe/canvas 都放行）
    if (!(vw > 0)) vw = 360;
    if (!(vh > 0)) vh = 640;
    var minIframe = Math.max(12000, vw * vh * 0.15);

    // ① 顶层 <video>
    var bestV = vvPageFsBest(vvPageFsCollect('video', false), 'video');
    var bestVScore = bestV ? vvPageFsScore(bestV, 'video') : -1;

    // ② 顶层没有合格 video，才去 shadow root 里挖（5s 一次，避免拖慢重站）
    if (!bestV) {
        var now = Date.now();
        if (!st.deepAt || now - st.deepAt > 5000) {
            st.deepAt = now;
            st.deepPick = vvPageFsBest(vvPageFsCollect('video', true), 'video');
        }
        if (st.deepPick) {
            var sc = vvPageFsScore(st.deepPick, 'video');
            if (sc >= 0) { bestV = st.deepPick; bestVScore = sc; }
        }
    }

    // ③ iframe（同源有视频 / 跨域够大）
    var frames = vvPageFsCollect('iframe', false);
    var bestF = null, bestFScore = -1, bestFInner = null;
    for (var i = 0; i < frames.length; i++) {
        var info = vvPageFsIframeScore(frames[i]);
        if (info.score < 0) continue;
        // 同源且内部有视频 → 一定是播放器；跨域读不到，用面积兜底
        if (!info.inner && info.area < minIframe) continue;
        if (info.score > bestFScore) { bestFScore = info.score; bestF = frames[i]; bestFInner = info.inner; }
    }

    if (bestV && bestF) {
        return bestFScore > bestVScore
            ? { el: bestF, kind: 'iframe', inner: bestFInner }
            : { el: bestV, kind: 'video' };
    }
    if (bestV) return { el: bestV, kind: 'video' };
    if (bestF) return { el: bestF, kind: 'iframe', inner: bestFInner };

    // ④ 最后兜底：画面被画到 canvas 上（video 只做解码）
    var cvs = vvPageFsCollect('canvas', false), bestC = null, bestCScore = -1;
    for (var k = 0; k < cvs.length; k++) {
        if (vvPageFsOwned(cvs[k]) || !vvPageFsVisible(cvs[k])) continue;
        var a = vvPageFsArea(cvs[k]);
        if (a < minIframe) continue;
        if (a > bestCScore) { bestCScore = a; bestC = cvs[k]; }
    }
    if (bestC) return { el: bestC, kind: 'canvas' };

    return null;
}

// 兼容旧接口：只返回被选中的 <video>
function vvPageFsVideo() {
    var t = vvPageFsPick();
    return t && t.kind === 'video' ? t.el : null;
}

// 诊断：点了没反应时，用来告诉用户页面上到底有什么
function vvPageFsDiag() {
    var t = null;
    try { t = vvPageFsPick(); } catch (e) {}
    var rect = null;
    if (t && t.el) {
        try {
            var r = t.el.getBoundingClientRect();
            rect = { w: Math.round(r.width), h: Math.round(r.height) };
        } catch (e2) {}
    }
    return {
        videos: vvPageFsCollect('video', false).length,
        shadowVideos: vvPageFsCollect('video', true).length,
        iframes: vvPageFsCollect('iframe', false).length,
        canvases: vvPageFsCollect('canvas', false).length,
        kind: t ? t.kind : '',
        target: t && t.el ? String(t.el.tagName || '') : '',
        rect: rect
    };
}

// 菜单里的「诊断」：一句话说明现状，方便回报「哪个站点没反应」
function vvPageFsDiagnose() {
    var d = vvPageFsDiag(), st = vvPageFsState();
    var msg = '网页铺满' + (st.on ? '已开' : '未开') +
        ' · video ' + d.videos + '（shadow ' + d.shadowVideos + '）' +
        ' · iframe ' + d.iframes + ' · canvas ' + d.canvases +
        (d.target ? ' · 目标 ' + d.target + (d.rect ? ' ' + d.rect.w + '×' + d.rect.h : '') : ' · 未找到目标');
    try { vvToast(msg, true); } catch (e1) {}
    try {
        // 只在 ?vvdebug=1 时打控制台，免得正常浏览时刷一堆日志
        if (/(?:\?|&)vvdebug=1(?:&|$)/.test((window.location && window.location.search) || '')) {
            console.log('[ViaModes] 网页铺满诊断', { state: st, diag: d, picked: vvPageFsPick() });
        }
    } catch (e2) {}
    return msg;
}

// position:fixed 会被祖先的 transform/filter/perspective/contain 变成
// 「相对该祖先定位」，这是网页全屏最常见的失效原因（全屏后视频还缩在原来那一小块）。
// 只给 computed 值确实非默认的祖先挂 class，退出时摘掉，布局零改动。
function vvPageFsAncestors(v) {
    var hit = [], p = null, win = vvPageFsWin(v);
    // 只走到 <html> 为止：给根元素挂 class 改不了它自己的样式（选择器要求后代），
    // 而且整站被套进根层叠上下文的极端情况，靠 video 自己 fixed 也够用了。
    var root = null;
    try { root = v.ownerDocument ? v.ownerDocument.documentElement : null; } catch (eR) {}
    try { p = v.parentNode; } catch (e0) {}
    while (p && hit.length < 16) {
        // 穿过 shadow 边界：shadow root 的 parentNode 是 null，要跳到 host 才找得到外层祖先
        if (p.nodeType !== 1) {
            try { p = p.host || p.parentNode || null; } catch (eS) { p = null; }
            continue;
        }
        if (p === root) break;
        try {
            var cs = win.getComputedStyle ? win.getComputedStyle(p) : null;
            if (cs) {
                var needClear = false;
                for (var i = 0; i < VV_PAGEFS_ANC_PROPS.length; i++) {
                    var k = VV_PAGEFS_ANC_PROPS[i];
                    var val = '';
                    try { val = cs.getPropertyValue ? cs.getPropertyValue(k) : (cs[k] || ''); } catch (eV) {}
                    val = String(val || '').trim();
                    if (val && val !== 'none' && val !== 'auto' && val !== 'normal' && val !== '0s') {
                        needClear = true; break;
                    }
                }
                // positioned 且 z-index 非 auto 会新建层叠上下文：video 自己再高的 z-index
                // 也出不了这个祖先，而黑底遮罩在根上下文里 → 整块视频被盖住（真机全黑）。
                // 央视网的播放器外层就是 position:relative;z-index:2 的 video_box。
                var stacked = false;
                try {
                    var pos = String(cs.position || 'static');
                    var zi = String(cs.zIndex || 'auto');
                    stacked = (pos !== 'static' && zi !== 'auto' && zi !== '');
                } catch (eZ) {}
                if (needClear || stacked) {
                    // 两个类一起挂：外层文档里只有 .vv-pagefs-anc 生效，
                    // shadow root / iframe 内部只有 .vv-pagefs-inner-anc 生效。
                    p.classList.add('vv-pagefs-anc');
                    p.classList.add('vv-pagefs-inner-anc');
                    if (stacked) {
                        p.classList.add('vv-pagefs-front-anc');
                        p.classList.add('vv-pagefs-inner-front-anc');
                    }
                    hit.push(p);
                }
            }
        } catch (e1) {}
        try { p = p.parentNode; } catch (e2) { break; }
    }
    return hit;
}

// 把「铺满」样式注入到某个独立样式作用域里（iframe 的 document / shadow root）。// 外层页面的样式表穿不过这两个边界，不注入就是「class 加了但一点反应没有」。
function vvPageFsStyleAttach(v, root, cls) {
    var st = VV._pageFs;
    if (!v || !root) return null;
    var style = null;
    try { style = root.getElementById ? root.getElementById('vv-pagefs-inner-style') : null; } catch (e0) {}
    if (!style) {
        try {
            var doc = root.ownerDocument || root;   // ShadowRoot 自己没有 createElement
            style = doc.createElement('style');
            style.id = 'vv-pagefs-inner-style';
            style.appendChild(doc.createTextNode(VV_PAGEFS_INNER_CSS));
            var host = (root.head || root.documentElement || root);
            host.appendChild(style);
        } catch (e1) { style = null; }
    }
    var anc = [];
    try { v.classList.add(cls); } catch (e2) {}
    anc = vvPageFsAncestors(v);
    st.inner = { root: root, style: style, el: v, cls: cls, anc: anc };
    return st.inner;
}

// 同源 iframe：把内部主视频也拉满，否则 iframe 变大只是空框变大。
// 跨域读不到 contentDocument，直接跳过 —— iframe 本身的播放器一般自适应。
function vvPageFsInnerAttach(f, innerHint) {
    var st = VV._pageFs;
    st.inner = null;
    var doc = null, v = innerHint || null;
    try { doc = f.contentDocument; } catch (e) { return; }
    if (!doc || !doc.documentElement) return;
    try {
        if (!v) v = vvPageFsPickVideoIn(doc);
        if (!v) {
            // 内层没有 <video>（例如播放器又套了一层），只把 iframe 放大就够了
            return;
        }
        vvPageFsStyleAttach(v, doc, 'vv-pagefs-inner-video');
    } catch (e4) { st.inner = null; }
}

// 在一个独立文档里挑主视频（iframe 内部用）
function vvPageFsPickVideoIn(doc) {
    var vs = null, best = null, bestScore = -1;
    try { vs = doc.querySelectorAll('video'); } catch (e) { return null; }
    for (var i = 0; i < vs.length; i++) {
        if (!vvPageFsVisible(vs[i])) continue;
        var s = vvPageFsArea(vs[i]);
        try { if (!vs[i].paused && vs[i].readyState > 0) s += 100000000; } catch (e2) {}
        if (s > bestScore) { bestScore = s; best = vs[i]; }
    }
    return best;
}

function vvPageFsInnerDetach() {
    var st = VV._pageFs, inner = st.inner;
    st.inner = null;
    if (!inner) return;
    try { if (inner.el && inner.cls) inner.el.classList.remove(inner.cls); } catch (e1) {}
    var anc = inner.anc || [];
    for (var i = 0; i < anc.length; i++) {
        try { anc[i].classList.remove('vv-pagefs-anc'); } catch (e2) {}
        try { anc[i].classList.remove('vv-pagefs-inner-anc'); } catch (e3) {}
        try { anc[i].classList.remove('vv-pagefs-front-anc'); } catch (e4) {}
        try { anc[i].classList.remove('vv-pagefs-inner-front-anc'); } catch (e5) {}
    }
    try { if (inner.style && inner.style.parentNode) inner.style.parentNode.removeChild(inner.style); } catch (e4) {}
}

// iframe 内部跳转后会换掉 contentDocument，注入的样式随之消失，要补一次
function vvPageFsInnerSync() {
    var st = VV._pageFs;
    if (!st.iframe) return;
    var doc = null;
    try { doc = st.iframe.contentDocument; } catch (e) {}
    if (!doc) return;                                   // 跨域，无能为力也不需要
    if (!st.inner || st.inner.root !== doc) vvPageFsInnerAttach(st.iframe);
}

function vvPageFsFront() {
    var st = VV._pageFs;
    try { if (st.shade) vvBringToFront(st.shade); } catch (e1) {}
    try { if (st.exit) vvBringToFront(st.exit); } catch (e2) {}
}

// 这里曾经有一段「开屏时向上滚几个像素，把被滚走的浏览器栏叫回来」的逻辑。
// 真机 A/B 实测无效，已删除，别再复活它：
//   · Via 的栏由原生手势方向驱动，window.scrollTo 不带手势，innerH 一直停在隐藏态；
//   · 之前还配了 overflow:hidden 滚动锁，反而让用户连上滑唤回栏都做不了；
//   · 现在不锁滚动，用户像平时一样上滑即可让 Via 自己把栏显示回来。


function vvPageFsEnsureUi() {
    var st = VV._pageFs;
    if (!st.shade) {
        var shade = vvEl('div', 'vv-pagefs-shade');
        shade.id = 'vv-pagefs-shade';
        // 站点常见的「全局 div 样式」会污染这里，所以 CSS 里带 all:initial；
        // 遮罩不接事件，点视频还是站点自己的控件说了算。
        try { document.documentElement.appendChild(shade); } catch (eA) {}
        st.shade = shade;
    }
    if (!st.exit) {
        var btn = vvEl('button', 'vv-pagefs-exit');
        btn.id = 'vv-pagefs-exit';
        btn.setAttribute('type', 'button');
        btn.setAttribute('aria-label', '退出网页铺满');
        btn.title = '退出网页铺满';
        btn.innerHTML = vvIcon('fsExit', 15) + '<span>退出网页铺满</span>';
        btn.addEventListener('click', function (e) {
            try { e.stopPropagation(); } catch (e1) {}
            try { e.preventDefault(); } catch (e2) {}
            vvPageFsSet(false);
        }, false);
        try { document.documentElement.appendChild(btn); } catch (eB) {}
        st.exit = btn;
    }
    vvPageFsFront();
    vvPageFsSyncExitBtn();
}

function vvPageFsDropUi() {
    var st = VV._pageFs;
    try { if (st.shade && st.shade.parentNode) st.shade.parentNode.removeChild(st.shade); } catch (e1) {}
    try { if (st.exit && st.exit.parentNode) st.exit.parentNode.removeChild(st.exit); } catch (e2) {}
    st.shade = null;
    st.exit = null;
}

function vvPageFsAttach(t) {
    var st = VV._pageFs;
    if (!t || !t.el) {
        try { if (st.shade) st.shade.classList.remove('on'); } catch (e0) {}
        st.video = null; st.iframe = null; st.canvas = null; st.target = null; st.kind = '';
        return;
    }
    st.target = t.el;
    st.kind = t.kind || 'video';
    st.video = t.kind === 'video' ? t.el : null;
    st.iframe = t.kind === 'iframe' ? t.el : null;
    st.canvas = t.kind === 'canvas' ? t.el : null;
    st.inner = null;

    var rt = null;
    if (st.kind === 'video') {
        try { rt = t.el.getRootNode ? t.el.getRootNode() : null; } catch (eR) {}
    }
    if (rt && rt.host) {
        // shadow root 里的视频：外层页面的样式表根本穿不进 shadow root，
        // 只挂 class 会是「加了但毫无反应」，必须把样式注入到 root 内部。
        vvPageFsStyleAttach(t.el, rt, 'vv-pagefs-inner-video');
        st.anc = st.inner ? st.inner.anc : [];
    } else {
        try { t.el.classList.add('vv-pagefs-video'); } catch (e1) {}
        st.anc = vvPageFsAncestors(t.el);
        if (st.kind === 'iframe') vvPageFsInnerAttach(t.el, t.inner);
    }
    try { if (st.shade) st.shade.classList.add('on'); } catch (e2) {}
    vvPageFsFront();
}

function vvPageFsDetach() {
    var st = VV._pageFs;
    try { if (st.target) st.target.classList.remove('vv-pagefs-video'); } catch (e1) {}
    var anc = st.anc || [];
    for (var i = 0; i < anc.length; i++) {
        // 祖先同时挂了四个类（外层 / 内层作用域各两个），退出必须都摘掉，
        // 否则 class 里会留下 vv-pagefs-inner-anc 这种无用残留。
        try { anc[i].classList.remove('vv-pagefs-anc'); } catch (e2) {}
        try { anc[i].classList.remove('vv-pagefs-inner-anc'); } catch (e3) {}
        try { anc[i].classList.remove('vv-pagefs-front-anc'); } catch (e4) {}
        try { anc[i].classList.remove('vv-pagefs-inner-front-anc'); } catch (e5) {}
    }
    vvPageFsInnerDetach();
    st.video = null;
    st.iframe = null;
    st.canvas = null;
    st.target = null;
    st.kind = '';
    st.anc = [];
    try { if (st.shade) st.shade.classList.remove('on'); } catch (e3) {}
}

// 系统全屏会隐藏浏览器栏，和「网页铺满」互斥：开启时先退出来，
// 让 Via 的地址栏与底部状态栏回到可见状态。
function vvPageFsExitSys() {
    try {
        var fs = document.fullscreenElement || document.webkitFullscreenElement;
        if (!fs) return;
        var r = null;
        if (document.exitFullscreen) r = document.exitFullscreen();
        else if (document.webkitExitFullscreen) r = document.webkitExitFullscreen();
        else if (document.webkitCancelFullScreen) r = document.webkitCancelFullScreen();
        else if (document.msExitFullscreen) r = document.msExitFullscreen();
        // 新版返回 Promise，被拒时不吞会产生一条 unhandled rejection
        if (r && r.catch) r.catch(function () {});
    } catch (e) {}
}

// 内置播放器顶栏已经有同一枚按钮，网页层右上角就不该再叠一个出口。
function vvPageFsSyncExitBtn() {
    var st = VV._pageFs;
    if (!st.exit) return;
    try {
        var hide = !st.on || !!VV.playerActive;
        if (hide) st.exit.classList.add('hide');
        else st.exit.classList.remove('hide');
    } catch (e) {}
}

// 顶栏按钮的高亮与网页层退出胶囊，都只认同一个状态源。
// 菜单、按钮、打开/关闭播放器、生命周期清理，任何一条路径改了状态都要走这里。
function vvPageFsSyncBtn() {
    var st = VV._pageFs;
    try {
        var b = document.querySelector('.vv-cs-top [data-act="webfs"]');
        if (b) {
            if (st.on) b.classList.add('on');
            else b.classList.remove('on');
            b.setAttribute('aria-pressed', st.on ? 'true' : 'false');
            b.title = st.on ? '网页铺满（已开）' : '网页铺满（把站点播放器放大到可视区）';
        }
    } catch (eB) {}
    vvPageFsSyncExitBtn();
}

// 内置播放器自己就铺满视口，且会暂停/接管页面媒体；期间把网页全屏挂起，
// 关掉播放器再恢复，避免两层 fixed 元素互相打架。
function vvPageFsSync() {
    var st = VV._pageFs;
    if (!st.on) return;
    var shouldSuspend = !!VV.playerActive;
    if (shouldSuspend === !!st.suspended) return;
    st.suspended = shouldSuspend;
    if (shouldSuspend) vvPageFsDetach();
    else vvPageFsAttach(vvPageFsPick());
    vvPageFsSyncBtn();
}

function vvPageFsTick() {
    var st = VV._pageFs;
    if (!st.on) return;
    try {
        // 用户/站点主动进了系统全屏 → 让位，别把两套全屏叠在一起。
        // 这里不能静默退出：点了开、然后什么都没发生是最难排查的观感。
        var fs = document.fullscreenElement || document.webkitFullscreenElement;
        if (fs) {
            vvPageFsSet(false, true);
            try { vvToast('站点自己进入了系统全屏，网页铺满已退出'); } catch (eT) {}
            return;
        }
    } catch (eF) {}
    vvPageFsSync();
    if (st.suspended) return;
    var t = vvPageFsPick();
    if (st.target && (!t || t.el !== st.target)) {
        vvPageFsDetach();
        vvPageFsAttach(t);
    } else if (!st.target && t) {
        vvPageFsAttach(t);
    } else if (st.target && !st.target.parentNode) {
        vvPageFsDetach();
    }
    if (st.iframe) vvPageFsInnerSync();
    // 站点会不断插入广告浮层，只有 UI 真被盖住时才重排
    try { if (st.exit && vvIsOccluded(st.exit)) vvPageFsFront(); } catch (eO) {}
}

function vvPageFsWatch(on) {
    var st = VV._pageFs;
    if (on) {
        if (st.timer) return;
        st.timer = setInterval(function () {
            try { vvPageFsTick(); } catch (e) {}
        }, 1500);
    } else {
        try { if (st.timer) clearInterval(st.timer); } catch (e1) {}
        st.timer = 0;
    }
}

// on=true 开启；silent=true 用于生命周期/逃生门清理，不弹 toast。
// 返回最终状态，方便自动化断言。
function vvPageFsSet(on, silent) {
    var st = VV._pageFs;
    on = !!on;
    if (on === !!st.on) {
        if (!silent) vvToast(on ? '网页铺满已经是开启状态' : '网页铺满本来就是关的');
        return st.on;
    }
    if (on) {
        vvPageFsExitSys();
        st.on = true;
        st.suspended = false;
        st.deepAt = 0;
        vvEnsureStyle();
        // 只加「铺满」这一个状态 class。不锁滚动：栏由 Via 手势控制，
        // 锁了用户就没法上滑把它叫回来。
        try { document.documentElement.classList.add('vv-pagefs-on'); } catch (eC) {}
        vvPageFsEnsureUi();
        // 立刻铺满，不等 1.5s 巡检；播放器开着时先挂起网页层
        var t = vvPageFsPick();
        if (VV.playerActive) { st.suspended = true; vvPageFsDetach(); }
        else { st.suspended = false; vvPageFsAttach(t); }
        vvPageFsWatch(true);
        vvPageFsSetup();
        vvPageFsSyncBtn();
        if (!silent) {
            if (VV.playerActive) {
                vvToast('网页铺满已开启：播放器本来就占满可视区', true);
            } else if (!t) {
                var d = vvPageFsDiag();
                vvToast('暂时没找到视频（video ' + d.videos + ' / iframe ' + d.iframes + '），出现后自动铺满', true);
            } else {
                vvToast('已铺满：' + (t.kind === 'video' ? '视频' : t.kind === 'iframe' ? '内嵌播放器' : '画面') +
                    '已放大到可视区', true);
            }
        }
    } else {
        st.on = false;
        st.suspended = false;
        vvPageFsWatch(false);
        vvPageFsDetach();
        vvPageFsDropUi();
        try { document.documentElement.classList.remove('vv-pagefs-on'); } catch (eD) {}
        vvPageFsSyncBtn();
        if (!silent) vvToast('已退出网页铺满');
    }
    return st.on;
}

function vvTogglePageFullscreen() {
    return vvPageFsSet(!VV._pageFs.on);
}

// document 级事件只绑一次。不开网页铺满时这些监听是空转，
// 所以放在 vvMain 里统一注册，不依赖任何 GM API。
function vvPageFsSetup() {
    var st = VV._pageFs;
    if (st.bound) return;
    st.bound = true;
    var onFsChange = function () {
        try {
            if (VV._pageFs.on && (document.fullscreenElement || document.webkitFullscreenElement)) {
                vvPageFsSet(false, true);
            }
        } catch (e) {}
    };
    try { document.addEventListener('fullscreenchange', onFsChange, false); } catch (e1) {}
    try { document.addEventListener('webkitfullscreenchange', onFsChange, false); } catch (e2) {}
    var onLeave = function () { try { vvPageFsSet(false, true); } catch (e3) {} };
    try { window.addEventListener('pagehide', onLeave, false); } catch (e4) {}
    try { window.addEventListener('beforeunload', onLeave, false); } catch (e5) {}
    var onResize = function () { try { if (VV._pageFs.on) { vvPageFsFront(); vvPageFsTick(); } } catch (e6) {} };
    try { window.addEventListener('resize', onResize, false); } catch (e7) {}
    try { window.addEventListener('orientationchange', onResize, false); } catch (e8) {}
}
