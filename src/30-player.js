function openPlayer(item) {
    if (!item || !item.url) { vvToast('无效视频'); return; }
    vvEnsureStyle();
    // 释放自检用的计数：真机上反复开关时，靠这对数字判断有没有越开越多
    VV._openCount = (VV._openCount || 0) + 1;
    var root = vvEnsurePlayerRoot();
    vvBringToFront(root);
    VV.playerActive = true;
    vvKeepPlayerTop();
    vvToggleBadge(false);
    vvSetPageFreeze(true);
    vvPausePageMedia();
    // 先把话放出去：别的页签收到就交还解码器。Android 的硬件解码器是设备级的，
    // 不打招呼的话，多开几个视频页就会轮到"分片能下、就是不出画"。
    try { vvRequestPeerRelease(); } catch (ePR) {}
    VV.active = {
        item: item,
        url: item.url,
        key: vvVideoKey(item.url),
        hls: null,
        speed: parseFloat(VV.cfg.speed) || 1,
        // 老数据里可能是 0（旧版手势滑到底直接存 0），当成正常的 1 处理
        vol: (function () { var v = vvGet('vol', 1); return (typeof v === 'number' && v > 0) ? v : 1; })(),
        bright: vvGet('bright', 1),
        locked: false,
        levels: [],
        audioTracks: [],
        audioIndex: 0,
        qAutoHeight: 0,
        nextItem: null,
        nextPage: null,
        resumeInfo: null,
        skipS: 0,
        skipE: 0,
        lastSave: 0,
        _lastGoodT: 0,
        _fragLoadingSince: 0,
        _buffering: false,
        _loaded: 0,
        _total: 0,
        _spd: 0,
        _spdT: 0,
        _spdB: 0
    };
    var p = vvProgGet(vvGetProgressMap(), VV.active.url || '');
    if (p) {
        VV.active.skipS = p.s || 0;
        VV.active.skipE = p.e || 0;
        VV.active.resumeInfo = p;
    }
    vvApplyBrightness(VV.active.bright);
    // 音量/静音分开存：
    //   vol  只存"非零音量"（用户最后一次听到的音量）
    //   mute 单独记"是不是静音"
    // 老版本只存 vol，一次手势滑到底（vol=0）之后就永久静音，界面上还没有任何
    // 按钮能看出来，用户感知就是"视频播着但没声音"。这里顺手把这种情况修好：
    // 读到的 vol 是 0 就当作 1，静音状态只看 mute。
    var _sv = VV.active.vol;
    var _sm = vvGet('mute', 0);
    try {
        VID.volume = (typeof _sv === 'number' && _sv > 0) ? _sv : 1;
        VID.muted = (_sm === 1 || _sm === true);
        // 记住"这是用户自己的选择"：巡检里的声音自愈不能把它当成我们压下去的静音
        VV._userMuted = !!VID.muted;
    } catch (e) {}
    try { VID.playbackRate = VV.active.speed; } catch (eS) {}
    // 抢占播放权：同一时间只允许一个页面拉流，避免多个 m3u8 页面把解码器吃光
    vvLeaseStart();
    vvSetTitle(vvShortName(item, 0));
    try { vvUpdateSpeedChip(); } catch (eChip) {}
    vvHideSheet();
    VV._endHandled = false;
    vvShowLoading(item.type === 'HLS' ? 'm3u8 加载中…' : '加载视频…');
    vvLoadMedia(item);
    vvArmFrameWatch();
    vvStartWatchdog();
    setTimeout(function () { vvFindNext(); }, 1400);
    vvShowCS();
}

// 播放器打开后广告仍可能继续插入 <html>；只在被遮挡时原子重排，避免影响播放
function vvKeepPlayerTop() {
    vvStopPlayerTop();
    VV._playerTopTimer = setInterval(function () {
        try {
            if (!VV.playerActive || !ROOT || !ROOT.parentNode) { vvStopPlayerTop(); return; }
            if (ROOT.style.display === 'none') return; // 小窗模式
            // 手指在播放器上时不要重排 DOM，否则可能触发 touchcancel，导致进度条拖了不跳
            if (VV._touchDown || (typeof vvG !== 'undefined' && vvG.progDrag)) return;
            if (vvIsOccluded(ROOT)) vvBringPlayerToFront();
        } catch (e) {
            vvStopPlayerTop();
        }
    }, 2500);
}

// 某些旧 WebView 在 appendChild 移动节点后会重置播放位置/暂停状态，这里做兜底恢复
function vvBringPlayerToFront() {
    var t = 0, paused = true, rate = 1, seeking = false;
    try {
        if (VID) {
            t = VID.currentTime;
            paused = VID.paused;
            rate = VID.playbackRate;
            seeking = VID.seeking;
        }
    } catch (e) {}
    vvBringToFront(ROOT);
    try {
        if (VID && !seeking && t > 0.2 && Math.abs(VID.currentTime - t) > 0.8) VID.currentTime = t;
        if (VID && rate && VID.playbackRate !== rate) VID.playbackRate = rate;
        if (VID && !paused && VID.paused) VID.play().catch(function () {});
    } catch (e2) {}
}

function vvStopPlayerTop() {
    try {
        if (VV._playerTopTimer) { clearInterval(VV._playerTopTimer); VV._playerTopTimer = null; }
    } catch (e) {}
}

function vvVideoKey(url) {
    // 进度记忆的 key。这里刻意【不用】媒体域名：
    // 多 CDN 的站点（某视频站点、腾讯、B 站等）同一个视频每次刷新会换 CDN 域名
    // （cdn12.example.com / cdn11.example.com / cdn10.example.com …），
    // 用 host+path 做 key 会让同一个视频每次都被当成新视频，进度永远记不住。
    try {
        var u = new URL(url);
        var path = u.pathname || '';
        // 1) 路径里带视频 ID（32 位 hex 或 UUID，如某视频站点 guid、多数站的 vid）：
        //    直接用它做 key。同一个视频往往有多个清单变体
        //    （/asp/enc/hls/…、/asp/hls/…、/asp/hlsaudio/…），它们路径不同但 guid 相同，
        //    用 guid 才能让这些变体共享同一份进度。
        var m = /[0-9a-f]{32}/i.exec(path)
            || /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.exec(path);
        if (m) return 'id:' + m[0].toLowerCase();
        // 2) 路径太短太通用（/v.mp4、/video/1.mp4 这种）时补上域名，避免不同站点互相串进度
        if (path.length < 24) return u.hostname.replace(/^www\./, '') + path;
        // 3) 其余用 pathname —— 跨 CDN 稳定
        return path;
    } catch (e) {
        return String(url).slice(0, 180);
    }
}

// 兼容旧格式（host+path）的历史进度记录，避免升级后用户记录全丢
function vvProgGet(map, url) {
    var k = vvVideoKey(url);
    if (map[k]) return map[k];
    try {
        var u = new URL(url);
        var oldK = u.hostname.replace(/^www\./, '') + u.pathname;
        if (map[oldK]) return map[oldK];
    } catch (e) {}
    return null;
}

function vvSetPageFreeze(on) {
    try {
        document.documentElement.style.overflow = on ? 'hidden' : '';
        document.body.style.overflow = on ? 'hidden' : '';
    } catch (e) {}
}

// 播放器打开时，把页面里其它 media 的**解码器**收回来。
// 只 pause 不释放是无效的：<video> 仍然握着一条完整的解码管线，
// 同一页两路（站点原生 + 我们的）在 1080p 下就可能把硬件解码器顶满。
function vvPausePageMedia() {
    if (!VV._pageMedia) VV._pageMedia = [];
    try {
        var els = document.querySelectorAll('video,audio');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (!el || (ROOT && ROOT.contains(el))) continue;
            if (el.mediaKeys) continue;
            var src = el.currentSrc || el.getAttribute('src') || '';
            if (!src) continue;
            // 只处理"确实在播"的那几路：暂停的元素本身不产生解码负载，
            // 盲目拆掉会破坏站点播放器的状态（视频黑掉、之后 play() 一直不 resolve）。
            // 在播的才是真占着 MediaCodec 的。
            var playing = false;
            try { playing = !el.paused && !el.ended && el.readyState > 0; } catch (eP) {}
            if (!playing) continue;
            var dup = false;
            for (var j = 0; j < VV._pageMedia.length; j++) {
                if (VV._pageMedia[j] && VV._pageMedia[j].el === el) { dup = true; break; }
            }
            if (dup) continue;
            VV._pageMedia.push({
                el: el, src: src, blob: src.indexOf('blob:') === 0,
                t: el.currentTime || 0, paused: !!el.paused,
                // 用“用户原本的静音状态”，别用此刻的 el.muted：
                // 上一轮让出解码器可能刚把它临时静音，拿当前值记下来就永远静音了。
                muted: (el.__vvMuted !== undefined ? el.__vvMuted : !!el.muted)
            });
            vvDetachMedia(el);
        }
    } catch (e) {}
}

function vvResumePageMedia() {
    var list = VV._pageMedia || [];
    VV._pageMedia = [];
    if (!list.length) return;
    // 后台页签里绝对不能重新起播：一起播就等于又占一个硬件解码器，
    // 而用户根本看不见它——这正是"开几个页签后新页签播不动"的来源之一。
    // 所以这里只在可见时恢复；不可见就先把清单存着，等回到前台再恢复。
    if (typeof vvTabHidden === 'function' && vvTabHidden()) {
        VV._pageMediaDeferred = (VV._pageMediaDeferred || []).concat(list);
        return;
    }
    vvResumePageMediaNow(list);
}

function vvResumePageMediaNow(list) {
    if (!list || !list.length) return;
    if (typeof vvTabHidden === 'function' && vvTabHidden()) {
        VV._pageMediaDeferred = (VV._pageMediaDeferred || []).concat(list);
        return;
    }
    // 延迟恢复：退出播放器时刚 destroy 掉 MSE，Android WebView 回收 MediaCodec 需要一点时间，
    // 立刻 play() 会撞上"解码器忙"，表现就是页面视频黑着不动，要等一阵或干脆关页签。
    // 首次 700ms（给我们的硬释放让路），被拒的话再补一次，多数机型第二次就能起来。
    setTimeout(function () {
        if (typeof vvTabHidden === 'function' && vvTabHidden()) {
            VV._pageMediaDeferred = (VV._pageMediaDeferred || []).concat(list);
            return;
        }
        for (var i = 0; i < list.length; i++) {
            (function (rec) {
                // 兼容旧格式（纯元素）
                var el = (rec && rec.el) ? rec.el : rec;
                if (!el) return;
                // 没被摘过 src 的（保守模式 / 后来自己恢复了）：直接接着播
                var hasSrc = vvHasSrc(el);
                if (hasSrc) {
                    try { el.play().catch(function () {}); } catch (e1) {}
                    return;
                }
                if (!rec || !rec.src) return;
                // 被摘过的：装回去再播。直链基本都能成功；
                // blob 只有在页面还没 revoke、MediaSource 还没 closed 时才有机会。
                vvAttachMedia(el, rec.src, rec.t, rec.paused === false, function () {
                    if (rec.blob) vvMediaLost(el);
                }, rec.muted);
            })(list[i]);
        }
    }, 700);
}

var ROOT = null, VID = null, BRIGHT = null, TOPBAR = null, BOTBAR = null, CBTN = null,
    CSPLAY = null, CSPAUSE = null, CSTIME = null, CSPROG = null, CSBUF = null, CSCUR = null,
    CSPROGDOT = null, SPEEDCHIP = null, LOCKMARK = null, SEEKTIP = null, GESTIP = null, QUAL = null,
    LOADING = null, LOADBAR = null, LOADFILL = null, ERRBOX = null;

// 环形进度周长（r=19 → 2πr ≈ 119.38）
var VV_LOAD_CIRC = 119.4;
// HLS 显示百分比时认为"缓冲到位"的目标秒数（够播就算 100%）
var VV_LOAD_TARGET_S = 15;

function vvEnsurePlayerRoot() {
    if (ROOT) { try { document.documentElement.appendChild(ROOT); } catch (e) {} return ROOT; }
    vvEnsureStyle();
    ROOT = vvEl('div', 'vv-player-root');
    ROOT.id = 'vv-player-root';
    VID = vvEl('video', 'vv-player-video');
    VID.setAttribute('playsinline', '');
    VID.setAttribute('webkit-playsinline', '');
    VID.setAttribute('x5-playsinline', '');
    VID.setAttribute('preload', 'auto');
    VID.controls = false;
    BRIGHT = vvEl('div', 'vv-bright');
    LOADING = vvEl('div', 'vv-loading');
    LOADING.innerHTML =
        '<div class="vv-lr">' +
        '<svg class="vv-lr-svg" viewBox="0 0 58 58">' +
        '<circle class="vv-lr-bg" cx="29" cy="29" r="19"></circle>' +
        '<circle class="vv-lr-fg" cx="29" cy="29" r="19"></circle>' +
        '</svg>' +
        '<div class="vv-lr-num">0%</div>' +
        '</div>' +
        '<div class="vv-load-text">加载中…</div>' +
        '<div class="vv-load-detail"></div>';
    // 顶部细进度条：缓冲时给出"还在走"的直观反馈（不确定进度）
    LOADBAR = vvEl('div', 'vv-loadbar');
    LOADBAR.innerHTML = '<div class="vv-loadbar-fill"></div>';
    LOADFILL = LOADBAR.querySelector('.vv-loadbar-fill');

    // 起播失败卡片。很多站（某综艺平台的一次性 pm token、某影视平台的纯 blob 流）在第三方播放器里
    // 必然拉不到流；原来只弹一条 toast 就消失，用户看到的是"黑屏 + 一直转圈"。
    // 这里给一个持久卡片，写清原因并给出退路（重试 / 外部播放器 / 返回）。
    ERRBOX = vvEl('div', 'vv-err');
    ERRBOX.innerHTML =
        '<div class="vv-err-ico">!</div>' +
        '<div class="vv-err-t">无法播放</div>' +
        '<div class="vv-err-m"></div>' +
        '<div class="vv-err-btns">' +
        '<button class="vv-err-btn primary" data-a="retry">重试</button>' +
        '<button class="vv-err-btn" data-a="ext">外部播放器</button>' +
        '<button class="vv-err-btn" data-a="close">返回</button>' +
        '</div>';
    ERRBOX.addEventListener('click', function (e) {
        var b = e.target && e.target.closest ? e.target.closest('.vv-err-btn') : null;
        if (!b) return;
        e.stopPropagation();
        var a = b.getAttribute('data-a');
        if (a === 'retry') {
            vvHideErr();
            try {
                if (VV.active && VV.active.item) openPlayer(VV.active.item);
            } catch (eR) {}
        } else if (a === 'ext') {
            try { if (VV.active) vvOpenExternal(VV.active.item, VV.active.hls); } catch (eE) {}
        } else {
            try { closePlayer(); } catch (eC) {}
        }
    }, true);

    TOPBAR = vvEl('div', 'vv-cs-top');
    var backBtn = vvEl('button', 'vv-csbtn', '✕');
    backBtn.id = 'vv-back';
    var title = vvEl('div', 'vv-title', '');
    title.id = 'vv-title';
    var pipBtn = vvEl('button', 'vv-csbtn', '');
    pipBtn.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><rect x="12" y="12" width="8" height="6" rx="1" fill="#fff" stroke="none"/></svg>';
    pipBtn.style.padding = '8px 8px';
    var fsBtn = vvEl('button', 'vv-csbtn', '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M7 3H3v4M17 3h4v4M7 21H3v-4M17 21h4v-4"/></svg>');
    fsBtn.style.padding = '8px 8px';
    var dlTop = vvEl('button', 'vv-csbtn', '⭳');
    dlTop.addEventListener('click', function () { if (VV.active) vvDownloadItem(VV.active.item); });
    TOPBAR.appendChild(backBtn);
    TOPBAR.appendChild(title);
    TOPBAR.appendChild(pipBtn);
    TOPBAR.appendChild(fsBtn);
    TOPBAR.appendChild(dlTop);

    BOTBAR = vvEl('div', 'vv-cs-bottom');
    var progRow = vvEl('div', 'vv-prog-row');
    CSTIME = vvEl('div', 'vv-time', '00:00');
    CSPROG = vvEl('div', 'vv-prog');
    CSPROG.innerHTML = '<div class="vv-prog-track"></div><div class="vv-prog-buf"></div><div class="vv-prog-cur"></div><div class="vv-prog-dot"></div>';
    CSBUF = CSPROG.querySelector('.vv-prog-buf');
    CSCUR = CSPROG.querySelector('.vv-prog-cur');
    CSPROGDOT = CSPROG.querySelector('.vv-prog-dot');
    var durEl = vvEl('div', 'vv-time', '00:00');
    durEl.id = 'vv-dur';
    progRow.appendChild(CSTIME);
    progRow.appendChild(CSPROG);
    progRow.appendChild(durEl);

    var actRow = vvEl('div');
    actRow.style.cssText = 'display:flex;align-items:center;margin-top:2px';
    CSPLAY = vvEl('button', 'vv-csbtn', '⏸');
    CSPLAY.style.fontSize = '20px';
    CSPLAY.style.width = '44px';
    var speedChip = vvEl('button', 'vv-csbtn', '倍速');
    speedChip.style.fontSize = '12px';
    speedChip.style.color = '#cfe0ff';
    speedChip.id = 'vv-speed-chip';
    var lockBtn = vvEl('button', 'vv-csbtn', '🔒');
    lockBtn.style.fontSize = '15px';
    lockBtn.id = 'vv-lock-btn';
    var nextBtn = vvEl('button', 'vv-csbtn', '下一集 ▶｜');
    nextBtn.style.fontSize = '12px';
    nextBtn.style.color = '#cfd1d8';
    nextBtn.id = 'vv-next-btn';
    nextBtn.style.display = 'none';
    var copyBtn = vvEl('button', 'vv-csbtn', '⧉');
    copyBtn.style.fontSize = '14px';
    var moreBtn = vvEl('button', 'vv-csbtn', '⋯');
    moreBtn.style.fontSize = '17px';
    var spacer = vvEl('div');
    spacer.style.cssText = 'flex:1';
    actRow.appendChild(CSPLAY);
    actRow.appendChild(speedChip);
    actRow.appendChild(spacer);
    actRow.appendChild(nextBtn);
    actRow.appendChild(lockBtn);
    actRow.appendChild(copyBtn);
    actRow.appendChild(moreBtn);

    BOTBAR.appendChild(progRow);
    BOTBAR.appendChild(actRow);

    CBTN = vvEl('button', 'vv-center-play', '▶');
    LOCKMARK = vvEl('button', 'vv-lockmark', '🔓');
    SEEKTIP = vvEl('div', 'vv-seek-tip', '');
    GESTIP = vvEl('div', 'vv-ges-tip', '');
    QUAL = null;

    var sheet = vvEl('div', 'vv-sheet');
    sheet.id = 'vv-sheet';

    ROOT.appendChild(VID);
    ROOT.appendChild(BRIGHT);
    ROOT.appendChild(LOADBAR);
    ROOT.appendChild(LOADING);
    ROOT.appendChild(ERRBOX);
    ROOT.appendChild(TOPBAR);
    ROOT.appendChild(BOTBAR);
    ROOT.appendChild(CBTN);
    ROOT.appendChild(LOCKMARK);
    ROOT.appendChild(SEEKTIP);
    ROOT.appendChild(GESTIP);
    ROOT.appendChild(sheet);
    document.documentElement.appendChild(ROOT);

    backBtn.addEventListener('click', function () { closePlayer(); });
    pipBtn.addEventListener('click', vvTryPip);
    fsBtn.addEventListener('click', vvTryFs);
    CSPLAY.addEventListener('click', vvTogglePlay);
    CBTN.addEventListener('click', vvTogglePlay);
    speedChip.addEventListener('click', function (e) { e.stopPropagation(); vvSpeedMenu(); });
    lockBtn.addEventListener('click', function (e) { e.stopPropagation(); vvToggleLock(); });
    LOCKMARK.addEventListener('click', function (e) { e.stopPropagation(); vvToggleLock(); });
    copyBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (VV.active) { vvCopy(VV.active.item.url); vvToast('已复制链接'); }
    });
    nextBtn.addEventListener('click', function (e) { e.stopPropagation(); vvGoNext(); });
    moreBtn.addEventListener('click', function (e) { e.stopPropagation(); vvMenuSheet(); });

    vvBindGestures();
    vvBindVideo();
    vvBindProgress();
    return ROOT;
}

function vvSetTitle(s) {
    try { document.getElementById('vv-title').innerHTML = vvEscape(s); } catch (e) {}
}

function vvShowLoading(text) {
    try {
        if (!LOADING) return;
        var tx = LOADING.querySelector('.vv-load-text');
        if (tx) tx.innerHTML = vvEscape(text || '加载中…');
        LOADING.classList.add('on');
        if (ROOT) ROOT.classList.add('vv-loading-on');
        vvSetLoadPct(null, true);
        vvShowLoadBar(true);
        vvStartLoadTick();
    } catch (e) {}
}

// 加载中的进度刷新定时器：HLS 的缓冲深度变化没有 progress 事件，需要轮询
function vvStartLoadTick() {
    try {
        if (VV._loadTick) return;
        VV._loadTick = setInterval(function () {
            try {
                if (!LOADING || !LOADING.classList.contains('on')) { vvStopLoadTick(); return; }
                vvUpdateLoadProgress();
            } catch (e) {}
        }, 300);
    } catch (e) {}
}

function vvStopLoadTick() {
    try {
        if (VV._loadTick) { clearInterval(VV._loadTick); VV._loadTick = null; }
    } catch (e) {}
}

function vvHideLoading() {
    try {
        if (LOADING) {
            LOADING.classList.remove('on');
            LOADING.classList.remove('indet');
        }
        if (ROOT) ROOT.classList.remove('vv-loading-on');
    } catch (e) {}
    vvShowLoadBar(false);
    vvStopLoadTick();
}

// 顶部细进度条：只在"确实在等数据"时出现
function vvShowLoadBar(on) {
    try {
        if (!LOADBAR) return;
        LOADBAR.classList.toggle('on', !!on);
        if (!on) {
            LOADBAR.classList.remove('indet');
            if (LOADFILL) LOADFILL.style.width = '0';
        }
    } catch (e) {}
}

// ---- 起播失败卡片 ----
// 为什么需要它：不少站点的视频源在第三方播放器里根本拉不到
//   · 某综艺平台：m3u8 带一次性 pm token，页面播放器消费后第三方再请求必 403
//   · 某影视平台：只用 blob:（MSE 会话句柄），离开原页面就失效
// 原来只弹一条 toast，2 秒后消失，用户看到的是黑屏 + 无限转圈，不知道该干什么。
function vvShowErr(msg, title) {
    try {
        if (!ERRBOX) return;
        var t = ERRBOX.querySelector('.vv-err-t');
        var m = ERRBOX.querySelector('.vv-err-m');
        if (t) t.textContent = title || '无法播放';
        if (m) m.textContent = msg || '';
        ERRBOX.classList.add('on');
        vvHideLoading();
    } catch (e) {}
}

function vvHideErr() {
    try { if (ERRBOX) ERRBOX.classList.remove('on'); } catch (e) {}
}

// 起播看门狗：打开后一段时间仍没有画面数据 → 给错误卡片，而不是让用户对着黑屏
function vvArmStartWatchdog() {
    try {
        if (VV._startWdog) { clearTimeout(VV._startWdog); VV._startWdog = null; }
        VV._startWdog = setTimeout(function () {
            VV._startWdog = null;
            try {
                if (!VV.playerActive || !VID) return;
                if (VID.readyState >= 2 || (VV.active && VV.active._sawFrame)) return;
                var act = VV.active || {};
                var netFail = act._netFail || 0;
                var code = act._lastHttpCode || 0;
                // 已经拿到元数据/分片，却一直没出画面：先按"解码器抢不到"自救，
                // 别把这种情形误报成"防盗链/地址失效"。
                if (VID.readyState >= 1 && !act._blobOnly && !act._nativeTried) {
                    if (vvCodecRescue('watchdog')) return;
                    vvShowErr('设备的硬件解码器被占满了：同时打开的视频页签太多，系统没有空闲解码器给这一页。\n关掉 2～3 个视频页签后再点播放即可。', '解码器不够用');
                    return;
                }
                var why;
                if (code === 403 || netFail >= 3) {
                    why = '源站拒绝了请求（' + (code ? 'HTTP ' + code : '多次连接失败') + '）。很多站点（如某综艺平台）的播放地址是一次性鉴权的，被页面播放器用过之后第三方就无法复用。';
                } else if (act._blobOnly) {
                    why = '该页面只用浏览器内部的视频流（blob），离开页面上下文就无法播放。';
                } else {
                    why = '长时间没有拿到画面数据。可能是防盗链、需要登录，或线路暂时不可用。';
                }
                vvShowErr(why, '这个视频源播不了');
            } catch (eW) {}
        }, 12000);
    } catch (e) {}
}

function vvDisarmStartWatchdog() {
    try { if (VV._startWdog) { clearTimeout(VV._startWdog); VV._startWdog = null; } } catch (e) {}
}

// ---- 解码器抢不到时的自救 ----
//
// 现象：播放器"能加载"（hls 拉到分片、进度条也在动），但画面一直是黑的，
//       currentTime 卡在 0 不走；关掉几个其它视频页签后又正常。
// 这不是网络问题，是设备级的硬件解码器被占满了（Android 的 MediaCodec 实例数是硬上限，
// 一个后台页签里的 <video> 也会占一个）。JS 没有办法"跨页签释放"，
// 能做的是三件事：本页全交出来 → 广播让别的页签也交 → 降到最低码率重来一次。
function vvArmFrameWatch() {
    vvDisarmFrameWatch();
    var act = VV.active;
    if (!act) return;
    var t0 = Date.now();
    VV._frameWatch = setInterval(function () {
        try {
            if (!VV.playerActive || !VID || VV.active !== act) { vvDisarmFrameWatch(); return; }
            var el = Date.now() - t0;
            if (el > 7000) { vvDisarmFrameWatch(); return; }
            if (VID.error) { vvDisarmFrameWatch(); return; }
            // 有画面在走：正常
            if (!VID.paused && VID.currentTime > 0.08) { vvDisarmFrameWatch(); return; }
            // 数据已经够了（HAVE_CURRENT_DATA 以上）却一帧都不出 → 解码器没拿到
            if (el > 3200 && !VID.paused && VID.readyState >= 2) {
                vvDisarmFrameWatch();
                vvCodecRescue('no-frame');
            }
        } catch (e) { vvDisarmFrameWatch(); }
    }, 600);
}

function vvDisarmFrameWatch() {
    try { if (VV._frameWatch) { clearInterval(VV._frameWatch); VV._frameWatch = 0; } } catch (e) {}
}

function vvCodecRescue(why) {
    try {
        var act = VV.active;
        if (!act || !act.item) return false;
        act._rescue = act._rescue || 0;
        // 三次：0.9s / 2.5s / 5s。
        // 一次不够——别的页签从"发现自己失去焦点"到真正把 MediaCodec 交出来
        // 要几秒（本页 4 秒的失焦确认阈值 + 释放耗时），只试一次就判死等于
        // 让用户以为这页废了，其实再等几秒解码器就空出来了。
        if (act._rescue >= 3) return false;
        act._rescue++;
        var wait = act._rescue === 1 ? 900 : act._rescue === 2 ? 2500 : 5000;
        var pos = 0;
        try { pos = (VID && isFinite(VID.currentTime) && VID.currentTime > 0) ? VID.currentTime : 0; } catch (eP) {}
        if (!pos) pos = act._suspendT || 0;
        act._suspendT = pos;
        act._forceLow = true;
        VV._lastRescue = { ts: Date.now(), why: why || '', n: act._rescue };
        vvToast(act._rescue === 1 ? '没能拿到硬件解码器，正在让出资源并降档重试…'
            : act._rescue === 2 ? '再试一次（其它页面正在归还解码器）…'
                : '最后一次尝试（已降到最低清晰度）…', true);
        // 1) 广播：请其它页签把解码器交出来
        try { vvRequestPeerRelease(); } catch (e0) {}
        // 2) 本页全交：hls / 播放器 <video> / 站点自带的 MSE 播放器
        try { vvKillMedia(); } catch (e1) {}
        try { vvKillAllHls(); } catch (e2) {}
        try { vvDeepHibernateBlob(); } catch (e3) {}
        // 3) 给 media 进程一点时间真正 release，再重建
        setTimeout(function () {
            try {
                if (!VV.playerActive || VV.active !== act) return;
                act._mediaReleased = false;
                vvRebuildMedia();
            } catch (e4) {}
        }, wait);
        return true;
    } catch (e) { return false; }
}

// 设置加载进度：pct 为 null/NaN 时进入"不确定态"（只显示动画，不显示百分比）
function vvSetLoadPct(pct, indet, detail) {
    try {
        if (!LOADING) return;
        var ring = LOADING.querySelector('.vv-lr-fg');
        var num = LOADING.querySelector('.vv-lr-num');
        var det = LOADING.querySelector('.vv-load-detail');
        var C = 119.4; // r=19 的周长
        if (indet || pct === null || pct === undefined || isNaN(pct)) {
            LOADING.classList.add('indet');
            if (ring) ring.style.strokeDashoffset = '0';
            if (num) num.textContent = '';
            if (LOADBAR) {
                LOADBAR.classList.add('indet');
                if (LOADFILL) LOADFILL.style.width = '';
            }
        } else {
            var p = Math.max(0, Math.min(100, pct));
            LOADING.classList.remove('indet');
            if (ring) ring.style.strokeDashoffset = String(C * (1 - p / 100));
            if (num) num.textContent = Math.round(p) + '%';
            if (LOADBAR) {
                LOADBAR.classList.remove('indet');
                if (LOADFILL) LOADFILL.style.width = p + '%';
            }
        }
        if (det) det.textContent = detail || '';
    } catch (e) {}
}

// 统计下载速度（KB/s）：用 video 元素的 progress 事件增量
function vvTrackSpeed(bytes) {
    try {
        var act = VV.active;
        if (!act) return;
        var now = Date.now();
        if (act._spdT) {
            var dt = (now - act._spdT) / 1000;
            if (dt > 0.35) {
                var delta = bytes - (act._spdB || 0);
                if (delta > 0) {
                    var kbps = delta / dt / 1024;
                    // 指数平滑，避免速度数字剧烈跳动
                    act._spd = act._spd ? (act._spd * 0.6 + kbps * 0.4) : kbps;
                }
                act._spdT = now;
                act._spdB = bytes;
            }
        } else {
            act._spdT = now;
            act._spdB = bytes;
        }
    } catch (e) {}
}

// HLS 模式：没有"总大小"概念，用"已缓冲时长 / 目标缓冲时长"当进度
function vvHlsLoadPct() {
    try {
        if (!VID || !VID.buffered || VID.buffered.length === 0) return null;
        var cur = VID.currentTime || 0;
        var end = 0;
        for (var i = 0; i < VID.buffered.length; i++) {
            if (cur >= VID.buffered.start(i) - 0.5 && cur <= VID.buffered.end(i) + 0.5) {
                end = VID.buffered.end(i);
                break;
            }
        }
        if (!end) end = VID.buffered.end(VID.buffered.length - 1);
        var ahead = Math.max(0, end - cur);
        if (ahead <= 0) return null;
        return Math.min(100, (ahead / VV_LOAD_TARGET_S) * 100);
    } catch (e) {
        return null;
    }
}

// 统一的进度刷新：
// - 直链 mp4：能拿到总长度就用真实下载百分比，否则退回"缓冲时长比"
// - HLS：没有"总大小"概念，用"已缓冲时长 / 目标缓冲时长"当进度
// 大转圈只在"正在等数据"时出现；mp4 播放起来之后，细进度条继续显示下载进度直到完成
function vvUpdateLoadProgress() {
    try {
        if (!LOADING) return;
        var act = VV.active;
        if (!act) return;
        var isHls = act.item && act.item.type === 'HLS';
        var pct = null, detail = '';
        var ahead = 0;
        try {
            if (VID && VID.buffered && VID.buffered.length) {
                ahead = Math.max(0, VID.buffered.end(VID.buffered.length - 1) - (VID.currentTime || 0));
            }
        } catch (eA) {}
        if (isHls) {
            var sp = act._fragMsSum > 0 ? (act._fragBytesSum / act._fragMsSum) * 1000 / 1024 : (act._spd || 0);
            if (ahead > 0) pct = Math.min(100, (ahead / VV_LOAD_TARGET_S) * 100);
            if (sp > 0) detail = vvFmtSpeed(sp);
            if (ahead > 0) detail = (detail ? detail + ' · ' : '') + '已缓冲 ' + ahead.toFixed(1) + 's';
        } else {
            var total = act._total || 0, loaded = act._loaded || 0;
            if (total > 0) {
                pct = Math.min(100, (loaded / total) * 100);
                detail = vvFmtBytes(loaded) + ' / ' + vvFmtBytes(total);
                if (act._spd > 0) detail += ' · ' + vvFmtSpeed(act._spd);
            } else if (ahead > 0) {
                pct = Math.min(100, (ahead / VV_LOAD_TARGET_S) * 100);
                detail = '已缓冲 ' + ahead.toFixed(1) + 's';
                if (act._spd > 0) detail += ' · ' + vvFmtSpeed(act._spd);
            }
        }
        var spinnerOn = LOADING.classList.contains('on');
        if (spinnerOn) {
            // 只有"播放中卡顿"才强制不确定态：
            // 缓冲深的时候 ahead 可能已经远超目标（seek 后预读 80s），
            // 照"已缓冲/目标"算就是 100%，会出现「满环 + 写着缓冲中」的矛盾画面。
            // 但起播首屏加载不能这么处理 —— 那时 _lastGoodT 还是 0（还没成功播过一帧），
            // 必须照常显示百分比，否则用户首屏永远看不到进度。
            var playedBefore = (act._lastGoodT || 0) > 0.5;
            var indetNow = (pct === null) || (!!act._buffering && playedBefore);
            vvSetLoadPct(indetNow ? null : pct, indetNow, detail);
        } else {
            // 不在加载：只有直链还没下完时，才让顶部细条继续显示下载进度
            if (!isHls && total > 0 && loaded < total) {
                vvShowLoadBar(true);
                if (LOADBAR) {
                    LOADBAR.classList.remove('indet');
                    if (LOADFILL) LOADFILL.style.width = pct + '%';
                }
            } else {
                vvShowLoadBar(false);
            }
        }
    } catch (e) {}
}

// 分片首字节超时：正常播放要短（慢分片尽快失败 → ABR 降档重试），
// seek 时放宽（慢 CDN 也别被中途放弃，否则跳转永远失败）。
var VV_FRAG_TTF = 10000;
var VV_FRAG_MAX_LOAD = 60000;
var VV_FRAG_TTF_SEEK = 45000;
var VV_FRAG_MAX_LOAD_SEEK = 180000;

// —— MSE codec 约束位兜底 ——
// 很多直播/点播码流的 H.264 SPS 带 constraint_set 标志，hls.js 据此拼出的 MIME 形如
// avc1.640128；而 Chromium 系（含 Android WebView）的 mp4 demuxer 只认约束字节为 00 的
// 等价写法 avc1.640028，addSourceBuffer 直接抛 NotSupportedError。外部表现就是
// "加载圈转到 100% 然后黑屏"或者一直转圈，错误卡只说无法播放，完全看不出是编码标号问题。
// 这里在创建 SourceBuffer 前做一次等价改写：profile 与 level 原样保留，只把约束位归零，
// 且必须 isTypeSupported 为 true 才换，避免把本来就播不了的流硬塞进去。
var VV_MS_PATCHED = false;

function vvFixMimeCodec(mime) {
    try {
        if (!mime || typeof mime !== 'string' || mime.indexOf('avc') < 0) return mime;
        var MS = window.MediaSource;
        if (!MS || typeof MS.isTypeSupported !== 'function') return mime;
        if (MS.isTypeSupported(mime)) return mime;
        var out = mime.replace(/avc([13])\.([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/g, function (all, ver, prof, cons, lev) {
            if (cons === '00') return all;
            return 'avc' + ver + '.' + prof + '00' + lev;
        });
        if (out !== mime && MS.isTypeSupported(out)) return out;
    } catch (e) {}
    return mime;
}

function vvPatchMseCodec() {
    if (VV_MS_PATCHED) return;
    VV_MS_PATCHED = true;
    try {
        var MS = window.MediaSource;
        if (!MS || !MS.prototype || typeof MS.prototype.addSourceBuffer !== 'function') return;
        var orig = MS.prototype.addSourceBuffer;
        MS.prototype.addSourceBuffer = function (mime) {
            var m = mime;
            try { m = vvFixMimeCodec(mime); } catch (e) {}
            try {
                return orig.call(this, m);
            } catch (e2) {
                // 改写后仍失败：退回原写法，让 hls.js 走自己的错误分支（别把原始错误吞掉）
                if (m !== mime) return orig.call(this, mime);
                throw e2;
            }
        };
    } catch (e) {}
}

// hls.js 每次拉分片都会重新读 config.fragLoadPolicy.default，
// 所以运行时改这两个字段，对下一片立即生效。
function vvHlsSetSeekMode(inst, on) {
    try {
        if (!inst || !inst.config || !inst.config.fragLoadPolicy) return;
        var d = inst.config.fragLoadPolicy.default;
        if (!d) return;
        d.maxTimeToFirstByteMs = on ? VV_FRAG_TTF_SEEK : VV_FRAG_TTF;
        d.maxLoadTimeMs = on ? VV_FRAG_MAX_LOAD_SEEK : VV_FRAG_MAX_LOAD;
    } catch (e) {}
}

// hls.js 移动端参数：参考官方 API 的 loadPolicy / gap controller 建议。
// 目标：弱网起播快、seek 遇到小缓冲空洞不卡死、断流后从当前位置恢复。
function vvHlsConfig() {
    return {
        enableWorker: true,
        lowLatencyMode: false,
        capLevelToPlayerSize: true,
        capLevelOnFPSDrop: true,
        startLevel: 0,
        startFragPrefetch: true,
        testBandwidth: false,
        abrBandWidthUpFactor: 0.6,
        // 点播不是直播，缓冲越深越抗抖：36s 目标（6s 分片约 6 片余量），
        // 回看缓冲压到 20s，把内存让给前向缓冲。
        backBufferLength: 20,
        maxBufferLength: 36,
        maxMaxBufferLength: 72,
        maxBufferSize: 50 * 1000 * 1000,
        maxBufferHole: 0.5,
        nudgeOffset: 0.2,
        nudgeMaxRetry: 6,
        highBufferWatchdogPeriod: 2,
        maxFragLookUpTolerance: 0.5,
        // 2Mbps 起估：原来 500k 会让前 30 秒一直在最低档爬坡，每次升档都吃空缓冲
        abrEwmaDefaultEstimate: 2000000,
        manifestLoadPolicy: {
            default: {
                maxTimeToFirstByteMs: 12000,
                maxLoadTimeMs: 30000,
                timeoutRetry: { maxNumRetry: 2, retryDelayMs: 0, maxRetryDelayMs: 0 },
                errorRetry: { maxNumRetry: 3, retryDelayMs: 800, maxRetryDelayMs: 8000 }
            }
        },
        playlistLoadPolicy: {
            default: {
                maxTimeToFirstByteMs: 12000,
                maxLoadTimeMs: 30000,
                timeoutRetry: { maxNumRetry: 2, retryDelayMs: 0, maxRetryDelayMs: 0 },
                errorRetry: { maxNumRetry: 3, retryDelayMs: 800, maxRetryDelayMs: 8000 }
            }
        },
        fragLoadPolicy: {
            default: {
                // 默认走快速失败；seek 期间由 vvHlsSetSeekMode 放宽
                maxTimeToFirstByteMs: VV_FRAG_TTF,
                maxLoadTimeMs: VV_FRAG_MAX_LOAD,
                timeoutRetry: { maxNumRetry: 2, retryDelayMs: 0, maxRetryDelayMs: 0 },
                errorRetry: { maxNumRetry: 4, retryDelayMs: 1000, maxRetryDelayMs: 10000 }
            }
        }
    };
}

function vvCanNativeHls() {
    try { return !!(VID && VID.canPlayType && VID.canPlayType('application/vnd.apple.mpegurl')); } catch (e) { return false; }
}

// 优先用构建时内联的标准版 hls.js：很多站点会往页面里注入自家魔改版并覆盖 window.Hls
// （某电视台是 1.6.7-ch 定制版），第三方再拿它 new 实例时行为完全不可控，常见表现就是
// 主清单能解析、分片却永远进不了 SourceBuffer，最后只剩黑屏。
function vvPickHlsCtor() {
    try {
        var own = window.__vvHlsCtor;
        if (own && typeof own.isSupported === 'function' && own.isSupported()) return own;
    } catch (e1) {}
    try {
        var g = window.Hls;
        if (g && typeof g.isSupported === 'function' && g.isSupported()) return g;
    } catch (e2) {}
    return null;
}

function vvHasMseHls() {
    return !!vvPickHlsCtor();
}

function vvLoadMedia(item) {
    vvKillMedia();
    // vvKillMedia → vvHardReleaseVideo 会把音量压成 0、静音打开（为了立刻止住残余音频）。
    // 重建时第一件事就是把用户原来的音量/静音还回去，否则整条重建之后画面在动、
    // 声音一直是 0——用户感知就是"播放没声音"，而且每次从后台切回来都要中一次。
    try { vvRestoreAudio(VID); } catch (eVA) {}
    if (VV.active) {
        VV.active._waitCount = 0;
        VV.active._waitMs = 0;
        VV.active._waitStart = 0;
        VV.active._fragLoads = [];
        VV.active._fragMs = 0;
        VV.active._fragBytes = 0;
        VV.active._fragMsSum = 0;
        VV.active._fragBytesSum = 0;
        VV.active._fragLoadingSince = 0;
        VV.active._loaded = 0;
        VV.active._total = 0;
        VV.active._spd = 0;
        VV.active._spdT = 0;
        VV.active._spdB = 0;
        VV.active._buffering = false;
        VV.active._sawFrame = false;
        VV.active._lastHttpCode = 0;
        VV.active._blobOnly = false;
        VV.active._netFail = 0;
        try { clearTimeout(VV.active._seekModeTimer); } catch (eSM) {}
        VV.active._seekModeTimer = 0;
    }
    var url = item.url;
    // 起播看门狗：打开后 12s 还没有画面就给错误卡片（不同站点策略差异很大，不能只靠 toast）
    vvHideErr();
    vvArmStartWatchdog();
    if (item.type === 'BLOB') {
        // blob: 是页面自己 MSE 会话的句柄，换到独立播放器必然拿不到数据
        if (VV.active) VV.active._blobOnly = true;
        vvAttachDirect(url, true);
        return;
    }
    if (item.type === 'HLS') {
        // 先把 codec 约束位的兜底补丁装上，hls.js 建 SourceBuffer 时才能被接住
        vvPatchMseCodec();
        var engine = VV.cfg.hlsEngine || 'auto';
        // 系统原生 HLS 通常更省电/更流畅，也不受 CORS 限制；但部分 WebView 不支持
        if (engine === 'native') {
            if (vvCanNativeHls()) {
                if (VV.active) VV.active._nativeTried = true;
                vvAttachDirect(url, false);
                vvToast('使用系统 HLS 播放');
                return;
            }
            vvToast('系统不支持原生 HLS，改用 hls.js', true);
        }
        // 系统 WebView 支持原生 HLS 且没有 MSE 能力时直接走原生，省去 CDN 等待
        if (!vvHasMseHls() && vvCanNativeHls()) {
            if (VV.active) VV.active._nativeTried = true;
            vvAttachDirect(url, false);
            vvToast('使用系统 HLS 播放');
            return;
        }
        vvLoadHls(function (ok, hlsCtor) {
            if (!ok) {
                vvAttachDirect(url, false);
                vvToast('无法加载 hls.js，尝试原生播放 m3u8', true);
                return;
            }
            try {
                // hls.js 的 Events/ErrorTypes 是构造函数上的静态成员，实例上没有
                var hlsEv = hlsCtor.Events || {};
                var hlsErr = hlsCtor.ErrorTypes || {};
                var inst = vvTrackHls(new hlsCtor(vvHlsConfig()));
                VV.active.hls = inst;
                if (hlsEv.MANIFEST_PARSED) inst.on(hlsEv.MANIFEST_PARSED, function () {
                    try {
                        VV.active._netFail = 0;
                        VV.active._hlsRetried = false;
                        var ls = inst.levels || [];
                        if (ls.length > 1) vvBuildQualityMenu(ls, inst);
                        // 解码器吃紧过：直接钉在最省的一档，别让 ABR 又爬回 1080P
                        if (VV.active && VV.active._forceLow && ls.length) {
                            try { inst.autoLevelCapping = 0; } catch (eL0) {}
                        }
                        var ats = inst.audioTracks || [];
                        VV.active.hlsInst = inst;
                        VV.active.audioTracks = ats;
                        if (ats.length > 1) {
                            VV.active.audioIndex = typeof inst.audioTrack === 'number' ? inst.audioTrack : 0;
                            vvUpdateSpeedChip();
                        }
                    } catch (eQ) {}
                });
                if (hlsEv.LEVEL_SWITCHED) inst.on(hlsEv.LEVEL_SWITCHED, function (eL, dataL) {
                    try {
                        var lv = inst.levels && inst.levels[dataL.level];
                        if (lv && lv.height) {
                            VV.active.qAutoHeight = lv.height;
                            vvUpdateSpeedChip();
                        }
                    } catch (eLS) {}
                });
                if (hlsEv.FRAG_LOADING) inst.on(hlsEv.FRAG_LOADING, function () {
                    try { if (VV.active) VV.active._fragLoadingSince = Date.now(); } catch (eFL0) {}
                });
                if (hlsEv.FRAG_LOADED) inst.on(hlsEv.FRAG_LOADED, function (eF, dataF) {
                    try {
                        if (VV.active) {
                            VV.active._fragLoadingSince = 0;
                            VV.active._netFail = 0;
                            VV.active._mediaFail = 0;
                            VV.active._hlsRetried = false;
                            var st = dataF && dataF.frag && dataF.frag.stats;
                            if (st && st.loading && st.loading.start && st.loading.end) {
                                VV.active._fragMs = Math.max(0, Math.round(st.loading.end - st.loading.start));
                                VV.active._fragBytes = st.loaded || (st.loading && st.loading.bytes) || 0;
                                VV.active._fragMsSum = (VV.active._fragMsSum || 0) + VV.active._fragMs;
                                VV.active._fragBytesSum = (VV.active._fragBytesSum || 0) + VV.active._fragBytes;
                                VV.active._fragLoads = VV.active._fragLoads || [];
                                VV.active._fragLoads.push(VV.active._fragMs);
                                if (VV.active._fragLoads.length > 8) VV.active._fragLoads.shift();
                            }
                            vvUpdateLoadProgress();
                        }
                    } catch (eFL) {}
                });
                // 分片失败/超时后要清掉“正在加载”标记，watchdog 才能重试
                ['FRAG_LOAD_ERROR', 'FRAG_LOAD_TIMEOUT', 'FRAG_LOAD_EMERGENCY_ABORTED'].forEach(function (en) {
                    if (hlsEv[en]) inst.on(hlsEv[en], function () {
                        try { if (VV.active) VV.active._fragLoadingSince = 0; } catch (eFL2) {}
                    });
                });
                if (hlsEv.ERROR) inst.on(hlsEv.ERROR, function (eType, data) {
                    if (!data) return;
                    // 留一份现场：真机上"能加载但播不了"到底是网络、鉴权还是解码器，
                    // 只看界面是分不出来的，自检面板要靠这条判断。
                    try {
                        VV._lastHlsErr = {
                            type: data.type || '', details: data.details || '',
                            fatal: !!data.fatal,
                            code: (data.response && data.response.code) || 0,
                            at: Date.now()
                        };
                    } catch (eLE) {}
                    try {
                        if (!data.fatal) {
                            // 记录最近一次 HTTP 状态，供失败卡片判断"是 403 还是网络问题"
                            try {
                                if (data.response && data.response.code && VV.active) {
                                    VV.active._lastHttpCode = data.response.code;
                                }
                            } catch (eC0) {}
                            // 只在完全没有画面数据时轻推一下；seek 过程中不要反复 startLoad 打断分片加载
                            if (data.details === 'bufferStalledError' && VID && VID.readyState < 2) vvHlsNudge(inst);
                            return;
                        }
                        // 403 基本等于"这个地址不给第三方便用"（一次性 token / 防盗链），
                        // 重试再多次也不会好，直接给失败卡片，别让用户对着黑屏等
                        var hc = 0;
                        try { hc = (data.response && data.response.code) || 0; } catch (eC1) {}
                        if (hc === 403 || hc === 401) {
                            try { if (VV.active) VV.active._lastHttpCode = hc; } catch (eC2) {}
                            vvShowErr('源站返回 HTTP ' + hc + '，拒绝第三方播放。这类站点（如某综艺平台、部分影视站）的播放地址是一次性鉴权的，被页面播放器用掉后无法复用。可以点「外部播放器」试试，或直接在页面里播放。', '这个视频源播不了');
                            try { inst.stopLoad(); } catch (eC3) {}
                            return;
                        }
                        var pos = Math.max(0, (VID && VID.currentTime) || 0);
                        if (data.type === hlsErr.NETWORK_ERROR) {
                            VV.active._netFail = (VV.active._netFail || 0) + 1;
                            // 自动模式下 hls.js 连续拉流失败（常见于 CORS/防盗链）时尝试系统原生 HLS
                            if (VV.cfg.hlsEngine === 'auto' && VV.active._netFail >= 3 && !VV.active._nativeTried && vvCanNativeHls()) {
                                VV.active._nativeTried = true;
                                try { inst.destroy(); } catch (eND) {}
                                VV.active.hls = null;
                                VV.active._inst = null;
                                vvToast('hls.js 拉流失败，改用系统 HLS', true);
                                var natT = pos;
                                vvAttachDirect(url, false);
                                var onNatMeta = function () {
                                    try { VID.removeEventListener('loadedmetadata', onNatMeta); } catch (eNM) {}
                                    try { if (natT > 0.5) VID.currentTime = natT; } catch (eNS) {}
                                };
                                try { VID.addEventListener('loadedmetadata', onNatMeta); } catch (eNA) {}
                                return;
                            }
                            if (VV.active._netFail <= 6) {
                                vvToast('m3u8 网络断流，第 ' + VV.active._netFail + ' 次重连…');
                                setTimeout(function () {
                                    try {
                                        // 主清单/子清单失败时只 startLoad 往往无效，需要重新 loadSource
                                        var needManifest = /manifest|level/i.test(data.details || '') || !inst.levels || !inst.levels.length;
                                        if (needManifest) inst.loadSource(url);
                                        inst.startLoad(pos);
                                    } catch (eN) {}
                                }, 1000 * Math.min(4, VV.active._netFail));
                            } else {
                                vvHideLoading();
                                vvToast('m3u8 多次重连失败，试试下载或换线路', true);
                            }
                        } else if (data.type === hlsErr.MEDIA_ERROR) {
                            VV.active._mediaFail = (VV.active._mediaFail || 0) + 1;
                            // "分片下载正常、就是不出画"在 hls.js 里几乎都落到这里：
                            // addSourceBuffer / appendBuffer 拿不到解码器。
                            // 原地 recoverMediaError 救不了这种情况，第二次就直接让位 + 重建。
                            if (VV.active._mediaFail >= 2 && vvCodecRescue('media')) return;
                            if (VV.active._mediaFail <= 3) {
                                vvToast('解码异常，正在恢复…');
                                setTimeout(function () {
                                    try {
                                        if (VV.active._mediaFail === 2 && inst.swapAudioCodec) inst.swapAudioCodec();
                                        inst.recoverMediaError();
                                    } catch (eM) {}
                                }, 400);
                            } else {
                                vvToast('解码持续失败：可能同时打开的 m3u8 页面太多，关掉其他页面后用「重建播放实例」', true);
                            }
                        } else {
                            if (!VV.active._hlsRetried) {
                                VV.active._hlsRetried = true;
                                vvToast('m3u8 加载失败，重新拉流中…');
                                setTimeout(function () {
                                    try {
                                        inst.loadSource(url);
                                        inst.startLoad(pos);
                                    } catch (eR) {}
                                }, 1000);
                            } else {
                                vvHideLoading();
                                vvToast('m3u8 无法播放，可复制链接换播放器', true);
                            }
                        }
                    } catch (eErr) {}
                });
                inst.attachMedia(VID);
                inst.loadSource(url);
                VV.active._inst = inst;
                // 立即在用户手势内调用 play，避免 hls.js 等待播放才拉流、以及自动播放被拦截
                VID.play().catch(function () {
                    try { inst.startLoad(); } catch (eP2) {}
                });
            } catch (e2) {
                vvAttachDirect(url, false);
                vvToast('m3u8 初始化失败，尝试原生播放', true);
            }
        });
        return;
    }
    vvAttachDirect(url, item.type === 'BLOB');
}

function vvAttachDirect(url, isBlob) {
    try {
        VID.src = url;
        VID.load();
        VID.play().catch(function () {
            if (isBlob) vvToast('原生流可能已失效，建议退回网页内播放', true);
        });
    } catch (e1) {
        vvToast('播放失败');
    }
}

// —— hls 实例池 ——
// 每个 new 出来的 Hls 都登记在这里，destroy 时自动出池。关闭播放器时再统一清一次池，
// 这样无论哪条分支（换源、失败重试、连续起播）漏掉了 destroy，都不会把实例和它背后的
// Worker / SourceBuffer / MediaCodec 留在页面里——Android WebView 上这类残留正是
// "退出播放器后要过一会、甚至关了页签才恢复正常"的元凶。
function vvTrackHls(inst) {
    try {
        if (!inst) return inst;
        if (!VV._hlsPool) VV._hlsPool = [];
        VV._hlsPool.push(inst);
        var rawDestroy = inst.destroy;
        inst.destroy = function () {
            try {
                var arr = VV._hlsPool || [];
                var i = arr.indexOf(inst);
                if (i >= 0) arr.splice(i, 1);
                VV._killCount = (VV._killCount || 0) + 1;
            } catch (e0) {}
            try { if (typeof rawDestroy === 'function') return rawDestroy.call(inst); } catch (e1) {}
        };
    } catch (e) {}
    return inst;
}

function vvKillAllHls() {
    var pool = (VV._hlsPool || []).slice();
    VV._hlsPool = [];
    for (var i = 0; i < pool.length; i++) {
        var inst = pool[i];
        try { if (inst && typeof inst.stopLoad === 'function') inst.stopLoad(); } catch (e1) {}
        try { if (inst && typeof inst.detachMedia === 'function') inst.detachMedia(); } catch (e2) {}
        try { if (inst && typeof inst.destroy === 'function') inst.destroy(); } catch (e3) {}
    }
}

// 硬释放一个 video 元素占着的解码器。
//
// Android WebView 上 pause() 只是停播，MediaCodec 仍然被 media 进程持有；
// 真正让它 release 的只有「把元素回退到没有资源的状态」这一条路径：
//   pause → 断 srcObject → 摘 src → 清 <source> → load()
// 顺序不能换：先 load() 再摘 src 等于让 WebView 重新挂一次空资源。
// 而且这一步必须在元素还留在文档里时做，元素脱离 DOM 之后再 load() 多半是空操作。
function vvHardReleaseVideo(v) {
    if (!v) return;
    var wasSrc = '';
    try { wasSrc = v.currentSrc || v.src || ''; } catch (e0) {}
    // 先把用户原本的音量/静音记下来，再往里写"静音 + 音量 0"。
    // 释放时静音是必要的（pause 在某些机型上有延迟，残余音频会漏出来），
    // 但这是**临时状态**：重建播放实例时必须还原，否则画面在播、一点声音没有。
    // 只记一次：重建过程中可能连着释放好几轮，第一轮记的才是用户真正设的值。
    try { if (v.__vvMuted === undefined) v.__vvMuted = (v.muted === true); } catch (eM0) {}
    try { if (v.__vvVol === undefined) v.__vvVol = (typeof v.volume === 'number' ? v.volume : 1); } catch (eV0) {}
    try { v.pause(); } catch (e1) {}
    // 释放后万一还有残余音频，静音能立刻止住（pause 在某些机型上有延迟）
    try {
        v.__vvUsMuted = true;
        v.muted = true;
        VV._muteBy = 'hard';
        VV._muteCount = (VV._muteCount || 0) + 1;
    } catch (e2) {}
    try { v.volume = 0; } catch (e3) {}
    try { v.srcObject = null; } catch (e4) {}
    try { v.removeAttribute('src'); } catch (e5) {}
    try { while (v.firstChild) v.removeChild(v.firstChild); } catch (e6) {}
    // load() 走一遍"空资源"加载算法，WebView 在这里 teardown 解码器
    try { v.load(); } catch (e7) {}
    // 兜底 revoke：hls.js 正常会自己撤销它创建的 blob，但 detachMedia 与 destroy
    // 的先后顺序一变就可能漏掉，漏掉的 blob 会连带 MediaSource 一起挂在内存里
    try {
        if (wasSrc && wasSrc.indexOf('blob:') === 0) URL.revokeObjectURL(wasSrc);
    } catch (e8) {}
}

// 把 vvHardReleaseVideo / vvDetachMedia 为省资源临时压掉的音量还原回去。
// 没有这一步，用户看到的现象就是"视频在播但没声音"——而且每次从后台切回来都会中一次。
function vvRestoreAudio(v) {
    if (!v) return false;
    if (v.__vvMuted === undefined) return false;
    try { VV._muteBy = 'restore'; VV._restoreCount = (VV._restoreCount || 0) + 1; } catch (eMk) {}
    try {
        // 静音照原样还原：用户本来就是静音看的，不能擅自开声音
        v.muted = (v.__vvMuted === true);
        try { VV._userMuted = (v.__vvMuted === true); } catch (eUM) {}
        // 音量无条件还原：硬释放会把它压成 0，而"静音 + 音量 0"是两个开关，
        // 只还原静音的话，用户后面一取消静音仍然是 0，看起来还是没声音。
        var vol = (typeof v.__vvVol === 'number' && v.__vvVol > 0) ? v.__vvVol : 1;
        if (!v.volume) v.volume = vol;
    } catch (e0) {}
    try { delete v.__vvMuted; delete v.__vvVol; } catch (e1) {}
    return true;
}

function vvKillMedia() {
    vvDisarmStartWatchdog();
    try { vvDisarmFrameWatch(); } catch (eFW) {}
    var act = VV.active;
    var inst = act && act.hls;
    // 先把引用断掉：destroy 抛错时也不会留下一个"看起来还在"的悬挂实例，
    // 下次 openPlayer 就不会误判成"已有实例可复用"。
    if (act) {
        act.hls = null;
        act._inst = null;
        try { clearTimeout(act._seekModeTimer); } catch (eSM2) {}
        act._seekModeTimer = 0;
    }
    if (inst) {
        // stopLoad 先停掉还在飞的分片请求，detachMedia 断开 MSE，最后 destroy 释放 Worker。
        // 三步都是同步返回，但 destroy 内部的 transmuxer 清理是排到微任务之后的，
        // 所以后面给 video 的硬释放要留出一点时间，不能同一个 tick 全干完。
        try { if (typeof inst.stopLoad === 'function') inst.stopLoad(); } catch (e0) {}
        try { if (typeof inst.detachMedia === 'function') inst.detachMedia(); } catch (e1) {}
        try { inst.destroy(); } catch (e2) {}
    }
    vvHardReleaseVideo(VID);
}

function vvLoadHls(cb) {
    var own = vvPickHlsCtor();
    if (own) {
        cb(true, own);
        return;
    }
    var urls = VV_HLS_URLS;
    var idx = 0;
    function tryNext() {
        if (idx < urls.length) {
            var s = document.createElement('script');
            s.src = urls[idx++];
            s.onload = function () {
                var got = vvPickHlsCtor();
                if (got) {
                    try { window.__vvHlsCtor = got; } catch (eS) {}
                    cb(true, got);
                } else {
                    tryNext();
                }
            };
            s.onerror = function () { try { s.parentNode.removeChild(s); } catch (e) {} tryNext(); };
            try { document.documentElement.appendChild(s); } catch (e) { cb(false); }
            return;
        }
        if (typeof GM_xmlhttpRequest === 'function') {
            try {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: urls[0],
                    onload: function (r) {
                        try {
                            if (r && r.status >= 200 && r.status < 400 && r.responseText && r.responseText.length > 1000) {
                                (0, eval)(r.responseText);
                                var got = vvPickHlsCtor();
                                if (got) {
                                    try { window.__vvHlsCtor = got; } catch (eS2) {}
                                    cb(true, got);
                                    return;
                                }
                                cb(false);
                            } else cb(false);
                        } catch (e) { cb(false); }
                    },
                    onerror: function () { cb(false); },
                    ontimeout: function () { cb(false); },
                    timeout: 15000
                });
                return;
            } catch (eG) {}
        }
        cb(false);
    }
    tryNext();
}

function vvBindVideo() {
    VID.addEventListener('loadedmetadata', function () {
        try {
            var d = VV.active && VV.active.resumeInfo;
            var maxT = (VID.duration && isFinite(VID.duration)) ? Math.max(0, VID.duration - 0.1) : 0;
            var resumeT = d && d.t > 5 ? (maxT ? Math.min(d.t, maxT) : d.t) : 0;
            if (resumeT > 5 && Math.abs(VID.currentTime - resumeT) > 3) {
                VID.currentTime = resumeT;
                // HLS 续播时让 hls.js 直接从目标位置拉流，避免只 seek 不加载而卡住
                try { if (VV.active.hls) VV.active.hls.startLoad(resumeT); } catch (eH) {}
                vvToast('已回到上次位置 ' + vvFmtTime(resumeT));
            }
            if (VV.active.skipS > 2 && VID.currentTime < VV.active.skipS) {
                var skipT = maxT ? Math.min(VV.active.skipS, maxT) : VV.active.skipS;
                VID.currentTime = skipT;
                try { if (VV.active.hls) VV.active.hls.startLoad(skipT); } catch (eS) {}
                vvToast('已跳过片头');
            }
            try { document.getElementById('vv-dur').innerHTML = vvFmtTime(VID.duration); } catch (eD) {}
            try { VID.playbackRate = VV.active.speed || 1; } catch (eR) {}
            VID.play().catch(function () {});
        } catch (e) {}
    });
    VID.addEventListener('timeupdate', vvOnTime);
    // mp4/直链：progress 事件给出已下载字节与总字节 → 真实百分比 + 下载速度
    VID.addEventListener('progress', function (e) {
        try {
            if (!VV.active) return;
            if (e && e.lengthComputable && e.total > 0) {
                VV.active._total = e.total;
                VV.active._loaded = e.loaded;
                vvTrackSpeed(e.loaded);
            } else if (e && e.loaded > 0) {
                VV.active._loaded = e.loaded;
                vvTrackSpeed(e.loaded);
            }
            vvUpdateLoadProgress();
        } catch (eP) {}
    });
    // 缓冲/下载中定时刷新进度（HLS 缓冲深度变化没有 progress 事件）
    VID.addEventListener('durationchange', function () { try { vvUpdateLoadProgress(); } catch (eD2) {} });
    VID.addEventListener('seeking', function () {
        if (!VV.active) return;
        VV.active._seekSince = Date.now();
        VV.active._seekFallback = 0;
        // 跳转期间放宽分片超时：慢 CDN 的首字节可能要 20s+，
        // 用 10s 会在中途 abort，跳转永远成功不了。
        vvHlsSetSeekMode(VV.active.hls, true);
        try { clearTimeout(VV.active._seekModeTimer); } catch (eS0) {}
        // 兜底：万一 playing 一直没触发，90s 后回到快速失败模式，避免长期挂在慢分片上
        VV.active._seekModeTimer = setTimeout(function () {
            VV.active._seekModeTimer = 0;
            vvHlsSetSeekMode(VV.active && VV.active.hls, false);
        }, 90000);
    });
    VID.addEventListener('seeked', function () {
        if (!VV.active) return;
        VV.active._seekSince = 0;
        VV.active._seekFallback = 0;
    });
    VID.addEventListener('pause', function () { vvUpdatePlayUI(); vvSaveNow(); });
    VID.addEventListener('play', function () { vvUpdatePlayUI(); });
    VID.addEventListener('playing', function () {
        if (VV.active && VV.active._waitStart) {
            VV.active._waitMs = (VV.active._waitMs || 0) + (Date.now() - VV.active._waitStart);
            VV.active._waitStart = 0;
        }
        // 已经有画面了：起播看门狗收工，错误卡片也收起
        if (VV.active) VV.active._sawFrame = true;
        vvDisarmStartWatchdog();
        vvHideErr();
        // 缓冲已经接上，恢复正常播放的短超时，让后续慢分片能触发降档
        try { clearTimeout(VV.active && VV.active._seekModeTimer); } catch (eS1) {}
        if (VV.active) VV.active._seekModeTimer = 0;
        vvHlsSetSeekMode(VV.active && VV.active.hls, false);
        if (VV.active) VV.active._buffering = false;
        vvHideLoading();
    });
    VID.addEventListener('canplay', function () {
        try {
            // 明确在缓冲中时不要被 canplay 提前收掉（canplay 在起播瞬间就会触发）
            if (VV.active && VV.active._buffering) return;
            vvHideLoading();
        } catch (e) {}
    });
    VID.addEventListener('waiting', function () {
        if (VV.active) {
            VV.active._waitCount = (VV.active._waitCount || 0) + 1;
            if (!VV.active._waitStart) VV.active._waitStart = Date.now();
            VV.active._buffering = true;
            vvShowLoading('缓冲中…');
        }
    });
    VID.addEventListener('ended', vvOnEnded);
    VID.addEventListener('error', function () {
        vvHideLoading();
        if (!VID) return;
        var act = VV.active;
        // 系统原生 HLS 失败时回退 hls.js（只尝试一次，避免来回切换）
        if (act && act.item && act.item.type === 'HLS' && act._nativeTried && !act.hls && !act._nativeFailed && vvHasMseHls()) {
            act._nativeFailed = true;
            vvToast('系统 HLS 播放失败，改用 hls.js', true);
            vvLoadMedia(act.item);
            return;
        }
        if (VID.src && VID.src.indexOf('m3u8') < 0) {
            var code = VID.error && VID.error.code;
            var msg = (VID.error && VID.error.message) || '';
            // 用 _blobOnly 判断"这是页面自己的 MSE 句柄"，不能看 src 是不是 blob：
            // 我们自己的 hls.js 也是走 blob 的，按 src 判会把正常播放误报成"页面私有流"。
            if (act && act._blobOnly) {
                vvShowErr('这条是页面自己 MSE 会话的句柄（blob），只能留在原页面播放器里用，独立播放器拿不到数据。', '这个视频源播不了');
            } else if (code === 3 || (code === 4 && act && act.hls)) {
                // MSE 管线已经建起来却解码失败：这是"拿不到解码器"，不是地址问题。
                // 先说清原因，再自救一次（降到最低档 + 让别的页签让出解码器）。
                if (vvCodecRescue('media-error')) return;
                vvShowErr('解码失败：设备没有空闲的硬件解码器（同时打开的视频页签太多），或这个编码本机不支持。\n关掉几个视频页签后再点播放。', '解码器不够用');
            } else if (code === 4) {
                vvShowErr('地址打不开（可能已过期、需要 Referer/Cookie，或是防盗链限制）。可以点「外部播放器」再试，或用页面自带的播放器。', '这个视频源播不了');
            } else {
                vvToast('视频加载失败' + (msg ? '：' + msg.slice(0, 40) : '，可能需要防盗链或已失效'), true);
            }
        }
    });
    // 只挂一次：这段在每次 openPlayer 都会执行（ROOT 每次关闭都会被回收），
    // 不加保护就会每开一次播放器多一个 document 级监听，久用之后回调越堆越多。
    if (!VV._visBound) {
        VV._visBound = true;
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                vvFlushLazy();
                vvSaveNow();
            }
        });
    }
}

// 直播判定：不能只看 duration。hls.js 对直播给出的 duration 是"当前窗口长度"（十几秒到几分钟），
// 是有限值，按 isFinite 判会当点播；真正可靠的是它解析出的 level details.live。
// 原生 HLS（Android WebView 常见）没有 details，只能靠 duration === Infinity 兜底。
function vvIsLive() {
    try {
        if (!VID) return false;
        var inst = VV.active && VV.active.hls;
        if (inst && inst.levels && inst.levels.length) {
            var anyKnown = false;
            for (var i = 0; i < inst.levels.length; i++) {
                var dt = inst.levels[i] && inst.levels[i].details;
                if (dt && typeof dt.live === 'boolean') {
                    anyKnown = true;
                    if (dt.live) return true;
                }
            }
            if (anyKnown) return false;
        }
        return VID.duration === Infinity;
    } catch (e) {
        return false;
    }
}

function vvOnTime() {
    if (!VV.active) return;
    try {
        var cur = VID.currentTime;
        var dur = VID.duration || 0;
        // 直播：没有总长概念，进度条按比例算会一直是 0% 或 100% 乱跳，
        // 直接把进度条整条点亮 + 时长位写「直播」，并且禁掉拖动/横滑快进（见 31-player-x.js）。
        var live = vvIsLive();
        if (CSTIME) CSTIME.innerHTML = vvFmtTime(cur);
        if (live) {
            // 每帧都校正一次文案：hls.js 在拿到直播窗口后会把 duration 从 Infinity 变成有限值，
            // 那次 durationchange 会带着 loadedmetadata 再写一遍时长位，只写一次会被覆盖回去。
            try {
                var durEl = document.getElementById('vv-dur');
                if (durEl && durEl.innerHTML !== '直播') durEl.innerHTML = '直播';
            } catch (eDL) {}
            if (VV.active._durTxt !== '直播') {
                VV.active._durTxt = '直播';
                // 直播没有"下一集"，把连播按钮收起来（页面里常能嗅到一堆频道链接，会被误判成剧集）
                try {
                    var nb = document.getElementById('vv-next-btn');
                    if (nb) nb.style.display = 'none';
                } catch (eNB1) {}
            }
            if (CSCUR) CSCUR.style.width = '100%';
            if (CSPROGDOT) CSPROGDOT.style.left = '100%';
            if (CSBUF) CSBUF.style.width = '100%';
        } else if (dur > 0 && CSCUR) {
            var pct = Math.min(100, (cur / dur) * 100);
            CSCUR.style.width = pct + '%';
            CSPROGDOT.style.left = pct + '%';
        }
        try {
            if (VID.buffered && VID.buffered.length > 0 && dur > 0 && !live) {
                var bEnd = VID.buffered.end(VID.buffered.length - 1);
                CSBUF.style.width = Math.min(100, (bEnd / dur) * 100) + '%';
            }
        } catch (eB) {}
        var now = Date.now();
        if (VV.active._lastT !== cur) {
            VV.active._lastT = cur;
            VV.active._lastAdv = now;
            // 记录最近一个已经正常播放的位置，seek 失败时回到这里而不是粗暴地回到 0
            if (VID.readyState >= 2 && !VID.seeking) {
                VV.active._lastGoodT = cur;
                // 时间在走 = 已经有画面，起播看门狗可以收工
                if (!VV.active._sawFrame) {
                    VV.active._sawFrame = true;
                    vvDisarmStartWatchdog();
                    vvHideErr();
                }
            }
        }
        if (now - VV.active.lastSave > 10000 && (VID.paused === false)) {
            vvSaveNow();
        }
        // 断流恢复/续播跳转后，只要画面已经能正常推进，就收起"缓冲中"提示。
        // 判定用 readyState >= 3（HAVE_FUTURE_DATA）：只有 >= 2 时数据可能马上又断，
        // 会导致加载提示一闪一闪。
        // 如果明确处于 buffering 状态（waiting 触发），至少要撑过 1.5s，
        // 否则真实播放流里紧随其后的 playing/seeked 会把提示秒关掉，看不到进度。
        if (LOADING && LOADING.classList.contains('on')) {
            var buffering = !!(VV.active && VV.active._buffering);
            if (buffering) {
                var waited = VV.active._waitStart ? (now - VV.active._waitStart) : 0;
                // 兜底：waiting 之后数据其实已经就绪（部分设备不发 playing）→ 视为已恢复
                if (waited > 1500 && VID.readyState >= 3 && !VID.seeking) {
                    VV.active._buffering = false;
                    buffering = false;
                }
            }
            if (!buffering && VID.readyState >= 3 && !VID.seeking) vvHideLoading();
        }
        if (VV.active.skipE > 2 && dur > 0 && cur >= dur - VV.active.skipE && !VID.ended) {
            vvOnEnded();
        }
    } catch (e) {}
}

function vvSaveNow() {
    if (!VV.active || !VID) return;
    try {
        var t = VID.currentTime;
        var d = VID.duration || 0;
        if (!t || t < 4) return;
        // 直播没有可续播的位置，记下来只会让下次进同一频道时莫名其妙跳到某处
        if (!isFinite(d) || vvIsLive()) return;
        var m = vvGetProgressMap();
        m[VV.active.key] = { t: t, d: d, s: VV.active.skipS, e: VV.active.skipE, u: Date.now() };
        vvSaveProgressMap(m);
        VV.active.lastSave = Date.now();
    } catch (e) {}
}

function vvUpdatePlayUI() {
    var paused = true;
    try { paused = VID.paused; } catch (e) {}
    try {
        CSPLAY.innerHTML = paused ? '▶' : '⏸';
        CBTN.innerHTML = paused ? '▶' : '⏸';
    } catch (e2) {}
}

function vvTogglePlay() {
    try {
        if (VID.paused) VID.play().catch(function () {}); else VID.pause();
    } catch (e) {}
    vvShowCS();
}

function vvShowCS() {
    try {
        ROOT.classList.add('cs-on');
        clearTimeout(ROOT._csTimer);
        ROOT._csTimer = 0;
        // 底部菜单开着时不启动自动收起：用户正在菜单里挑选项，
        // 3 秒后把顶/底栏抽走会让人以为"菜单自己没了"，还得再点一次才回来。
        var sht = document.getElementById('vv-sheet');
        if (sht && sht.classList.contains('open')) return;
        ROOT._csTimer = setTimeout(function () {
            if (VID && !VID.paused) ROOT.classList.remove('cs-on');
        }, VV.cfg.autoHide);
    } catch (e) {}
}

function vvHideCS() {
    try { ROOT.classList.remove('cs-on'); } catch (e) {}
}

function closePlayer() {
    // 每一步独立 try：任何一步抛错都不能影响后面的清理，
    // 否则页面会被"冻住"（overflow:hidden + 全屏播放器层），看起来像整个浏览器坏了。
    try { vvFlushLazy(); } catch (e1) {}
    try { vvSaveNow(); } catch (e2) {}
    try { vvStopWatchdog(); } catch (e3) {}
    try { vvStopPlayerTop(); } catch (e4) {}
    try { vvLeaseStop(); } catch (e5) {}
    try { vvKillMedia(); } catch (e6) {}
    // 兜底：任何分支漏掉 destroy 的实例，在这里统一收掉（含 Worker 与 SourceBuffer）
    try { vvKillAllHls(); } catch (e6b) {}
    try { if (vvG.progDrag) { vvG.progDrag = false; vvG.mode = 'none'; vvG.gtgt = null; } } catch (eG) {}
    VV.playerActive = false;
    VV.active = null;
    try { vvSetPageFreeze(false); } catch (ef) {}
    // 如果页面视频在进播放器前被"后台休眠"摘过 src，这里必须装回去，
    // 否则退出播放器后它就是个没有地址的空壳，只能靠关页签恢复。
    try { if (typeof vvThawMedia === 'function') vvThawMedia(); } catch (et) {}
    try { vvResumePageMedia(); } catch (er) {}
    try {
        if (document.fullscreenElement) document.exitFullscreen();
    } catch (ex) {}
    var deadVideo = VID;
    var deadRoot = ROOT;
    // 注意顺序：这里【不能】先把 ROOT 摘掉。
    // Android WebView 的 media 进程只有在 video 仍挂在文档里、并且走完一次
    // 「无资源」的 load() 之后，才会真正 release MediaCodec。先摘 DOM 再 load()
    // 在真机上基本是空操作，解码器会一直占着，直到整页销毁（关页签）为止。
    try { if (deadRoot) deadRoot.style.display = 'none'; } catch (eHide) {}
    setTimeout(function () {
        try { vvHardReleaseVideo(deadVideo); } catch (eR1) {}
        try { if (deadRoot && deadRoot.parentNode) deadRoot.parentNode.removeChild(deadRoot); } catch (eR2) {}
    }, 80);
    // 二次巡检：hls destroy 内部的 transmuxer 清理排在微任务之后，个别机型上
    // 元素摘除的回收也是延迟的。这里再兜一次，池里还有实例就说明有分支漏了 destroy。
    setTimeout(function () {
        // 期间用户可能已经重新打开了播放器，此时池里装的是新实例，不能连坐杀掉
        if (!VV.playerActive) {
            try { if ((VV._hlsPool || []).length) vvKillAllHls(); } catch (eR3) {}
        }
        try { vvHardReleaseVideo(deadVideo); } catch (eR4) {}
        // 留一份关闭后 0.9s 的快照，真机上点「资源释放自检」就能看到它
        try {
            VV._lastAudit = {
                ts: Date.now(),
                pool: (VV._hlsPool || []).length,
                videos: document.querySelectorAll('video').length,
                root: !!document.getElementById('vv-player-root')
            };
        } catch (eR5) {}
        try { deadVideo = null; deadRoot = null; } catch (eR6) {}
    }, 900);
    ROOT = null; VID = null; BRIGHT = null; TOPBAR = null; BOTBAR = null; CBTN = null;
    CSPLAY = null; CSTIME = null; CSPROG = null; CSBUF = null; CSCUR = null; CSPROGDOT = null;
    LOCKMARK = null; SEEKTIP = null; GESTIP = null; LOADING = null; LOADBAR = null; LOADFILL = null;
    ERRBOX = null;
    vvStopLoadTick();
    if (VV.items.length) vvToggleBadge(true);
}

function vvToggleLock() {
    if (!VV.active) return;
    VV.active.locked = !VV.active.locked;
    ROOT.classList.toggle('locked', VV.active.locked);
    LOCKMARK.innerHTML = VV.active.locked ? '🔓' : '🔒';
    vvToast(VV.active.locked ? '已锁定，点右上方图标解锁' : '已解锁');
}

function vvTryPip() {
    try {
        if (VID.requestPictureInPicture) {
            VID.requestPictureInPicture().then(function () { ROOT.style.display = 'none'; vvSetPageFreeze(false); }).catch(function (er) { vvToast('小窗启动失败'); });
            return;
        }
    } catch (e) {}
    vvToast('当前 WebView 不支持小窗');
}

function vvTryFs() {
    try {
        if (document.fullscreenElement) document.exitFullscreen();
        else ROOT.requestFullscreen().then(function () {
            try {
                if (screen.orientation && screen.orientation.lock) {
                    screen.orientation.lock('landscape').catch(function () {});
                }
            } catch (e2) {}
        }).catch(function () { vvToast('全屏不可用'); });
    } catch (e) {
        vvToast('全屏不可用');
    }
}
