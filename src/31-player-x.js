function vvHlsNudge(inst) {
    try {
        if (!VV.active) return;
        var now = Date.now();
        // 有分片正在加载时绝对不要 startLoad：那会中断当前请求。
        // 冷门 CDN 的分片首字节可能要 30s+，反复打断会让 seek 永远失败。
        if (inst && VV.active._fragLoadingSince && now - VV.active._fragLoadingSince < 45000) return;
        // 同一个卡顿不要频繁 startLoad，否则会反复中断分片请求
        if (VV.active._lastNudge && now - VV.active._lastNudge < 15000) return;
        VV.active._lastNudge = now;
        if (inst) {
            var t = VID.currentTime || 0;
            inst.startLoad(t);
        } else if (VID) {
            VID.play().catch(function () {
                try { VID.currentTime = VID.currentTime + 0.1; VID.play().catch(function () {}); } catch (e) {}
            });
        }
    } catch (e) {}
}

// 统一的跳转入口：夹紧到可 seek 范围；服务器不支持 Range 时给出明确提示
function vvSeekTo(t, silent) {
    try {
        if (!VID) return;
        var d = VID.duration || 0;
        // 直播 duration 是 Infinity：不能拿它当上界（pct*dur 会算出 Infinity），
        // 交给下面的 seekable 窗口来夹紧，只能在自己的缓冲窗口内回看。
        if (!isFinite(d)) d = 0;
        if (d > 0) t = Math.max(0, Math.min(d - 0.05, t));
        var sk = VID.seekable;
        if (sk && sk.length) {
            var lo = sk.start(0);
            var hi = sk.end(sk.length - 1);
            if (hi - lo < 0.5 && d > 2 && VID.readyState >= 2) {
                if (!silent) vvToast('该视频不支持跳转（服务器未开启 Range）', true);
                // 把进度条恢复到真实位置，避免停在拖动预览处
                try {
                    var cur = VID.currentTime || 0;
                    if (CSTIME) CSTIME.innerHTML = vvFmtTime(cur);
                    if (d > 0 && CSCUR) {
                        var pct = Math.min(100, (cur / d) * 100);
                        CSCUR.style.width = pct + '%';
                        CSPROGDOT.style.left = pct + '%';
                    }
                } catch (eU) {}
                return;
            }
            // 只有拿到有效范围时才夹紧；HLS 刚加载时 seekable 可能还是 [0,0]
            if (hi - lo >= 0.5) {
                if (t < lo) t = lo;
                if (t > hi - 0.05) t = Math.max(lo, hi - 0.05);
            }
        }
        VID.currentTime = t;
    } catch (e) {}
}

function vvStartWatchdog() {
    vvStopWatchdog();
    if (!VV.active) return;
    VV.active._lastAdv = Date.now();
    VV.active._lastT = -1;
    VV._wdt = setInterval(function () {
        try {
            if (!VV.playerActive || !VID || !VV.active) return;
            // 暂停状态也要处理 seek：用户经常先暂停、拖到未缓冲位置，再点播放
            if (VID.paused && !VID.seeking) { VV.active._lastAdv = Date.now(); VV.active._seekSince = 0; return; }
            if (vvG.progDrag) { VV.active._lastAdv = Date.now(); VV.active._seekSince = Date.now(); return; }
            // 续播/跳转后分片一直加载不出来时，seek 会永久卡住；这里做超时重试和兜底。
            // 但分片正在加载时只能等：中断请求会让慢 CDN 反复从头开始。
            if (VID.seeking) {
                if (!VV.active._seekSince) VV.active._seekSince = Date.now();
                var fragBusy = VV.active._fragLoadingSince && Date.now() - VV.active._fragLoadingSince < 45000;
                if (!fragBusy && Date.now() - VV.active._seekSince > 45000) {
                    VV.active._seekSince = Date.now();
                    if (!VV.active._seekFallback) {
                        VV.active._seekFallback = 1;
                        vvToast('跳转位置加载超时，正在重试…');
                        vvHlsNudge(VV.active.hls);
                    } else {
                        VV.active._seekFallback = 0;
                        var back = VV.active._lastGoodT || 0;
                        vvToast(back > 3 ? '该位置暂时无法加载，已回到 ' + vvFmtTime(back) : '该位置暂时无法加载，已从头播放', true);
                        try { if (VV.active.hls) VV.active.hls.startLoad(back); } catch (eH0) {}
                        try { VID.currentTime = back; } catch (eH1) {}
                    }
                }
                VV.active._lastAdv = Date.now();
                return;
            }
            VV.active._seekSince = 0;
            VV.active._seekFallback = 0;
            if (VID.readyState >= 3) { VV.active._lastAdv = Date.now(); return; }
            if (Date.now() - VV.active._lastAdv > 20000) {
                VV.active._lastAdv = Date.now();
                // 分片还在正常加载（只是慢）就不要提示“卡住”并打断它
                var fragBusy2 = VV.active._fragLoadingSince && Date.now() - VV.active._fragLoadingSince < 45000;
                if (fragBusy2) return;
                VV.active._lastT = -1;
                vvToast('播放卡住，自动恢复中…');
                vvHlsNudge(VV.active.hls);
            }
        } catch (e) {}
    }, 2000);
}

function vvStopWatchdog() {
    try {
        if (VV._wdt) { clearInterval(VV._wdt); VV._wdt = null; }
    } catch (e) {}
}

function vvApplyBrightness(pct) {
    try {
        pct = Math.max(0, Math.min(1, pct));
        if (BRIGHT) BRIGHT.style.opacity = String(Math.max(0, (1 - pct) * 0.92));
        if (VV.active) VV.active.bright = pct;
        // 手势每帧都会调用，只更新画面，停手 500ms 后再写存储
        vvSetLazy('bright', pct);
    } catch (e) {}
}

function vvApplyVolume(pct) {
    try {
        pct = Math.max(0, Math.min(1, pct));
        // 手势调音量一律视为"取消静音"：不然上一轮为省解码器做的临时静音
        // 会把用户这一下抬手吞掉，看起来像"滑了没反应"。
        try { VID.muted = false; } catch (eM) {}
        try { VV._userMuted = false; } catch (eUM) {}
        VID.volume = pct;
        if (VV.active) VV.active.vol = pct;
        // vol 只持久化非零值，0 单独记成静音开关。
        // 只存 vol 的话，一次滑到底就会让"之后每一次打开都是静音"，
        // 而界面上没有任何按钮能看出音量是 0——用户只会说"播着没声音"。
        if (pct > 0.01) {
            vvSetLazy('vol', pct);
            vvSetLazy('mute', 0);
            VV._userMuted = false;
        } else {
            vvSetLazy('mute', 1);
            VV._userMuted = true;
        }
    } catch (e) {}
}

function vvShowSeek(text) {
    try {
        SEEKTIP.innerHTML = vvEscape(text);
        SEEKTIP.classList.add('on');
    } catch (e) {}
}

function vvHideSeek() {
    try { SEEKTIP.classList.remove('on'); } catch (e) {}
}

function vvShowGes(text) {
    try {
        GESTIP.innerHTML = vvEscape(text);
        GESTIP.classList.add('on');
    } catch (e) {}
}

function vvHideGes() {
    try { GESTIP.classList.remove('on'); } catch (e) {}
}

function vvInCtrlZone(el) {
    try {
        var t = el;
        while (t && t !== ROOT) {
            if (t.classList && (t.classList.contains('vv-cs-top') || t.classList.contains('vv-cs-bottom') || t.classList.contains('vv-sheet') || t.classList.contains('vv-lockmark') || t.classList.contains('vv-center-play'))) return true;
            t = t.parentNode;
        }
    } catch (e) {}
    return false;
}

var vvG = { mode: 'none', pass: false, sx: 0, sy: 0, t0: 0, startT: 0, startB: 1, startV: 1, longTimer: null, boost: false, tapT: 0, singleTimer: null, moved: false, progDrag: false, progT: null, gtgt: null };

var vvLastTouch = 0;

// 桌面/鼠标场景：触摸后浏览器可能补发鼠标事件，短时间内忽略，避免双触发
function vvIsMouseLike(e) {
    try {
        if (e && e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return false;
        return Date.now() - vvLastTouch > 800;
    } catch (e2) { return true; }
}

// 手指在播放器上时暂停“置顶检测”，避免 DOM 重排打断拖动进度条/横滑 seek
function vvMarkTouch(on) {
    try {
        clearTimeout(VV._touchTimer);
        VV._touchDown = !!on;
        if (on) VV._touchTimer = setTimeout(function () { VV._touchDown = false; }, 60000);
    } catch (e) {}
}

function vvBindGestures() {
    ROOT.addEventListener('touchstart', function () { vvLastTouch = Date.now(); vvMarkTouch(true); }, true);
    ROOT.addEventListener('touchend', function () { vvMarkTouch(false); }, true);
    ROOT.addEventListener('touchcancel', function () { vvMarkTouch(false); }, true);
    ROOT.addEventListener('touchstart', vvGesStart, { passive: false });
    ROOT.addEventListener('touchmove', vvGesMove, { passive: false });
    ROOT.addEventListener('touchend', vvGesEnd, { passive: false });
    ROOT.addEventListener('touchcancel', vvGesCancel, { passive: false });
    // 鼠标移动显示控制栏（桌面浏览器 / 接鼠标的平板）
    ROOT.addEventListener('mousemove', function (e) {
        if (!VV.active || !vvIsMouseLike(e)) return;
        var now = Date.now();
        if (VV._lastMouseCS && now - VV._lastMouseCS < 150) return;
        VV._lastMouseCS = now;
        vvShowCS();
    }, { passive: true });
    ROOT.addEventListener('mousedown', function (e) {
        if (!VV.active || !vvIsMouseLike(e)) return;
        vvShowCS();
    });
    // 鼠标单击画面切换播放/暂停；控制栏上的按钮各自处理
    ROOT.addEventListener('click', function (e) {
        if (!VV.active || !vvIsMouseLike(e)) return;
        if (vvInCtrlZone(e.target)) return;
        // 同触屏：菜单开着时点画面先收菜单，而不是把视频暂停掉
        var s = vvGetSheet();
        if (s && s.classList.contains('open')) { vvHideSheet(); return; }
        vvTogglePlay();
    });
    ROOT.addEventListener('contextmenu', function (e) { e.preventDefault(); });
}

function vvGesStart(e) {
    if (!VV.active) return;
    try {
        if (vvInCtrlZone(e.target)) { vvG.pass = true; return; }
        vvG.pass = false;
        var t = e.touches[0];
        vvG.sx = t.clientX;
        vvG.sy = t.clientY;
        vvG.t0 = Date.now();
        vvG.mode = 'none';
        vvG.moved = false;
        // 记住按下瞬间控制栏是显示还是隐藏，供 vvInvokeSingle 判断该显示还是该隐藏
        vvG.csOn0 = !!(ROOT && ROOT.classList.contains('cs-on'));
        try {
            vvG.startT = VID.currentTime || 0;
            vvG.startV = VID.volume || 1;
        } catch (ev) {}
        vvG.startB = vvGet('bright', 1);
        clearTimeout(vvG.longTimer);
        vvG.longTimer = setTimeout(function () {
            if (vvG.t0 && !vvG.moved && VV.playerActive && !VV.active.locked && VID && !VID.paused) {
                vvG.boost = true;
                try {
                    var bx = Math.min(4, (VV.active.speed || 1) * 2);
                    VID.playbackRate = bx;
                    vvShowGes('▶▶ ' + bx + 'x 倍速中，松手恢复');
                } catch (e2) {}
            }
        }, 520);
    } catch (e3) {
        vvG.pass = true;
    }
}

function vvGesMove(e) {
    if (!VV.active || vvG.pass) return;
    try {
        var t = e.touches[0];
        var dx = t.clientX - vvG.sx;
        var dy = t.clientY - vvG.sy;
        if (vvG.mode === 'none' && Math.sqrt(dx * dx + dy * dy) > 16) {
            vvG.moved = true;
            clearTimeout(vvG.longTimer);
            if (Math.abs(dx) > Math.abs(dy)) vvG.mode = 'h';
            else if (t.clientX < window.innerWidth / 2) vvG.mode = 'bright';
            else vvG.mode = 'vol';
        }
        if (vvG.mode === 'h') {
            e.preventDefault();
            var dur = VID.duration || 0;
            // 直播没有总长，横向滑动快进的 delta 会按窗口长度算，直接忽略
            if (dur > 0 && isFinite(dur) && !vvIsLive()) {
                var delta = (dx / window.innerWidth) * dur * 0.75;
                var tgt = Math.max(0, Math.min(dur - 0.3, vvG.startT + delta));
                vvG.gtgt = tgt;
                var sign = delta >= 0 ? '+' : '−';
                vvShowSeek(sign + vvFmtTime(Math.abs(delta)) + '  →  ' + vvFmtTime(tgt));
                try {
                    CSCUR.style.width = (tgt / dur * 100) + '%';
                    CSPROGDOT.style.left = (tgt / dur * 100) + '%';
                } catch (eP) {}
            }
        } else if (vvG.mode === 'bright') {
            e.preventDefault();
            var pct = Math.max(0.08, Math.min(1, vvG.startB - dy / (window.innerHeight * 0.75)));
            vvApplyBrightness(pct);
            vvShowGes('☀ 亮度 ' + Math.round(pct * 100) + '%');
        } else if (vvG.mode === 'vol') {
            e.preventDefault();
            var vp = Math.max(0, Math.min(1, vvG.startV - dy / (window.innerHeight * 0.65)));
            vvApplyVolume(vp);
            vvShowGes((vp === 0 ? '🔇' : '🔊') + ' 音量 ' + Math.round(vp * 100) + '%');
        }
    } catch (em) {}
}

function vvGesEnd(e) {
    if (!VV.active || vvG.pass) { vvG.pass = false; return; }
    try {
        clearTimeout(vvG.longTimer);
        if (vvG.boost) {
            vvG.boost = false;
            try { VID.playbackRate = VV.active.speed || 1; } catch (eB) {}
            vvHideGes();
        }
        if (vvG.mode === 'h') {
            e.preventDefault();
            vvHideSeek();
            if (typeof vvG.gtgt === 'number' && VID.duration) vvSeekTo(vvG.gtgt);
        } else if (vvG.mode === 'bright' || vvG.mode === 'vol') {
            e.preventDefault();
            vvHideGes();
        } else {
            var quick = Date.now() - vvG.t0 < 300 && !vvG.moved;
            if (quick) {
                // 菜单开着时单击立即可关，不走 300ms 双击判定：
                // 等那 300ms 才收菜单，手感就是"点了没反应"。
                // 菜单浮在画面上，这时双击快进也没有意义。
                var sOpen = vvGetSheet();
                if (sOpen && sOpen.classList.contains('open')) {
                    vvHideSheet();
                } else if (Date.now() - vvG.tapT < 300) {
                    clearTimeout(vvG.singleTimer);
                    vvG.tapT = 0;
                    vvInvokeDouble(e);
                } else {
                    vvG.tapT = Date.now();
                    vvG.singleTimer = setTimeout(function () { vvInvokeSingle(); }, 300);
                }
            }
        }
        vvG.mode = 'none';
        vvG.gtgt = null;
        vvShowCS();
    } catch (e4) {}
}

// 触摸被系统/广告重排打断时，尽量把已经预览到的跳转目标提交，避免“拖了但没跳”
function vvGesCancel(e) {
    try {
        clearTimeout(vvG.longTimer);
        if (vvG.boost) {
            vvG.boost = false;
            try { VID.playbackRate = VV.active.speed || 1; } catch (eB) {}
        }
        if (vvG.mode === 'h' && typeof vvG.gtgt === 'number' && VID.duration) vvSeekTo(vvG.gtgt);
        vvG.mode = 'none';
        vvG.gtgt = null;
        vvG.progDrag = false;
        vvHideSeek();
        vvHideGes();
    } catch (e) {}
}

function vvInvokeSingle() {
    try {
        // 菜单开着的时候，点画面只负责收起菜单，不改变控制栏显隐：
        // 菜单是浮在画面上的，用户点空白的第一意图一定是"关掉这个菜单"。
        var s = vvGetSheet();
        if (s && s.classList.contains('open')) { vvHideSheet(); return; }
        // 以"按下瞬间"控制栏的状态决定显示还是隐藏。
        // 不能直接判断当前 class：vvGesEnd 末尾会先调 vvShowCS() 把 cs-on 打开，
        // 那样单击就只会隐藏，永远唤不出控制栏。
        if (vvG.csOn0) ROOT.classList.remove('cs-on');
        else vvShowCS();
    } catch (e) {}
}

function vvInvokeDouble(e) {
    try {
        var x = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : 0;
        var W = window.innerWidth;
        if (vvIsLive()) {
            // 直播的双击快进/快退会一头撞到窗口边缘，只保留中间区域切播放/暂停
            if (x >= W / 3 && x <= W * 2 / 3) vvTogglePlay();
            else vvShowGes('直播流不支持快进');
            return;
        }
        if (x < W / 3) {
            vvSeekTo(Math.max(0, VID.currentTime - 10));
            vvShowSeek('快退 10s ▶ ' + vvFmtTime(VID.currentTime));
        } else if (x > W * 2 / 3) {
            vvSeekTo(Math.min(VID.duration || 1e9, VID.currentTime + 10));
            vvShowSeek('快进 10s ▶ ' + vvFmtTime(VID.currentTime));
        } else {
            vvTogglePlay();
            return;
        }
        setTimeout(vvHideSeek, 700);
        ROOT.classList.add('cs-on');
        vvShowCS();
    } catch (e2) {}
}

function vvProgCommit() {
    try {
        if (vvG.progDrag && typeof vvG.progT === 'number' && VID && VID.duration) vvSeekTo(vvG.progT);
    } catch (e) {}
    vvG.progDrag = false;
    vvHideSeek();
    vvShowCS();
}

function vvBindProgress() {
    if (!CSPROG) return;
    try {
        CSPROG.addEventListener('touchstart', function (e) {
            e.stopPropagation();
            if (e.cancelable) e.preventDefault();
            vvG.pass = false;
            vvG.progDrag = true;
            vvProgDrag(e.touches[0].clientX);
        }, { passive: false });
        CSPROG.addEventListener('touchmove', function (e) {
            e.stopPropagation();
            if (e.cancelable) e.preventDefault();
            if (vvG.progDrag && e.touches[0]) vvProgDrag(e.touches[0].clientX);
        }, { passive: false });
        CSPROG.addEventListener('touchend', function (e) {
            e.stopPropagation();
            if (e.cancelable) e.preventDefault();
            vvProgCommit();
        }, { passive: false });
        // 触摸被系统手势/广告重排打断时也要提交，否则拖动后不会跳转
        CSPROG.addEventListener('touchcancel', function (e) {
            e.stopPropagation();
            vvProgCommit();
        }, { passive: false });

        // 鼠标拖动进度条（桌面浏览器 / 接鼠标的平板）
        CSPROG.addEventListener('mousedown', function (e) {
            if (!vvIsMouseLike(e)) return;
            e.stopPropagation();
            if (e.cancelable) e.preventDefault();
            vvG.pass = false;
            vvG.progDrag = true;
            vvProgDrag(e.clientX);
            vvShowCS();
        });
        ROOT.addEventListener('mousemove', function (e) {
            if (!vvG.progDrag || !vvIsMouseLike(e)) return;
            if (e.cancelable) e.preventDefault();
            vvProgDrag(e.clientX);
        });
        ROOT.addEventListener('mouseup', function (e) {
            if (!vvG.progDrag || !vvIsMouseLike(e)) return;
            if (e.cancelable) e.preventDefault();
            vvProgCommit();
        });
    } catch (e) {}
}

function vvProgDrag(x) {
    try {
        var rect = CSPROG.getBoundingClientRect();
        // 控制栏隐藏/收起时进度条宽度会是 0，此时按 x 算出来的比例会直接顶到 100%，
        // 表现成"一碰进度条就跳到片尾"。宽度异常时直接忽略这次拖动。
        if (!(rect.width > 4)) return;
        var pct = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
        var dur = VID.duration || 0;
        // 直播不能拖：总长只是当前窗口长度，拖过去立刻卡在窗口边缘
        if (vvIsLive()) return;
        if (!(dur > 0) || !isFinite(dur)) return;
        var t = pct * dur;
        vvG.progT = t;
        CSCUR.style.width = (pct * 100) + '%';
        CSPROGDOT.style.left = (pct * 100) + '%';
        vvShowSeek(vvFmtTime(t) + ' / ' + vvFmtTime(dur));
    } catch (e) {}
}

function vvOnEnded() {
    try {
        if (!VV.active || VV._endHandled) return;
        VV._endHandled = true;
        vvSaveNow();
        try {
            var m = vvGetProgressMap();
            var ent = m[VV.active.key];
            if (ent) { ent.t = 0; ent.u = Date.now(); vvSaveProgressMap(m); }
        } catch (eS) {}
        clearTimeout(vvG.longTimer);
        if (vvG.boost) { vvG.boost = false; VID.playbackRate = VV.active.speed || 1; }
        if (VV.cfg.autoplayNext && VV.active && VV.active.nextItem) {
            vvToast('连播下一集...');
            var nx = VV.active.nextItem;
            setTimeout(function () {
                if (VV.playerActive) openPlayer(nx);
            }, 600);
            return;
        }
        if (VV.cfg.autoplayNext && VV.active && VV.active.nextPage) {
            vvNavNext();
            return;
        }
        vvToast('播放结束');
        setTimeout(function () { if (VV.playerActive) closePlayer(); }, 1600);
    } catch (e) {}
}

function vvNavNext() {
    try {
        if (!VV.active || !VV.active.nextPage) return;
        vvSet('autoNextLast', { ts: Date.now() });
        var go = VV.active.nextPage;
        closePlayer();
        location.href = go;
    } catch (e) {}
}

function vvNumInfo(u) {
    try {
        var s = String(u);
        var q = s.indexOf('?');
        var p = q >= 0 ? s.slice(0, q) : s;
        var runs = [], r0, rx = /\d+/g;
        while ((r0 = rx.exec(p)) !== null) runs.push({ n: r0[0], pos: r0.index });
        for (var i = runs.length - 1; i >= 0; i--) {
            var num = parseInt(runs[i].n, 10);
            if (num >= 0 && num < 9998) return { num: num, len: runs[i].n.length, pos: runs[i].pos, base: s };
        }
    } catch (e) {}
    return null;
}

function vvBumpNum(info, add) {
    try {
        var n = info.num + add;
        var s = String(n);
        while (s.length < info.len) s = '0' + s;
        return info.base.slice(0, info.pos) + s + info.base.slice(info.pos + info.len);
    } catch (e) {}
    return null;
}

function vvTemplize(u) {
    return String(u).replace(/\d+/g, '#');
}

function vvProbeUrl(url, isHls, cb) {
    if (typeof GM_xmlhttpRequest !== 'function') { cb(true); return; }
    try {
        GM_xmlhttpRequest({
            method: isHls ? 'GET' : 'HEAD',
            url: url,
            timeout: 9000,
            headers: { Referer: location.href },
            onload: function (r) {
                var ok = r.status >= 200 && r.status < 400;
                if (ok && isHls) {
                    var t = (r.responseText || '').slice(0, 512);
                    if (t.indexOf('#EXTM3U') < 0) ok = false;
                }
                cb(ok);
            },
            onerror: function () { cb(false); },
            ontimeout: function () { cb(false); }
        });
    } catch (e) { cb(true); }
}

function vvFindNext() {
    try {
        if (!VV.active) return;
        var item = VV.active.item;
        var cands = [];
        var mi = vvNumInfo(item.url);
        if (mi && parseInt(mi.num, 10) > 0 && mi.num < 900) {
            for (var k = 1; k <= 2; k++) {
                var nu = vvBumpNum(mi, k);
                if (nu) cands.push({ url: nu, via: 'media' });
            }
        }
        try {
            var page = location.href;
            var pi = vvNumInfo(page);
            if (pi) {
                var links = document.querySelectorAll('a[href]');
                var pageTem = vvTemplize(page.split('#')[0]);
                for (var i = 0; i < links.length; i++) {
                    var l = links[i].getAttribute('href');
                    if (!l || l.indexOf('javascript:') === 0) continue;
                    var full;
                    try { full = new URL(l, location.href).href; } catch (e2) {}
                    var li = full ? vvNumInfo(full) : null;
                    if (li && Math.abs(li.num - pi.num) === 1 && vvTemplize(full.split('#')[0]) === pageTem) {
                        cands.push({ url: full, via: 'page' });
                        break;
                    }
                }
            }
        } catch (e3) {}
        if (!cands.length) return;
        var cand = cands[0];
        if (cand.via === 'page') {
            VV.active.nextPage = cand.url;
            vvShowNext(true);
            return;
        }
        vvProbeUrl(cand.url, VV.active.item.type === 'HLS', function (ok) {
            if (ok && VV.active) {
                VV.active.nextItem = { url: cand.url, type: VV.active.item.type, name: VV.active.item.name };
                vvShowNext(true);
            }
        });
    } catch (e) {}
}

function vvShowNext(on) {
    try {
        var b = document.getElementById('vv-next-btn');
        // 直播永远不显示"下一集"：页面里搜到的频道/相关视频链接会被当成剧集
        if (b) b.style.display = (on && !vvIsLive()) ? '' : 'none';
    } catch (e) {}
}

function vvGoNext() {
    try {
        if (VV.active && VV.active.nextItem) { openPlayer(VV.active.nextItem); return; }
        if (VV.active && VV.active.nextPage) { vvNavNext(); return; }
        vvToast('没有检测到下一集');
    } catch (e) {}
}

function vvGetSheet() {
    try { return document.getElementById('vv-sheet'); } catch (e) {}
    return null;
}

function vvHideSheet() {
    try {
        var s = vvGetSheet();
        if (s) { s.classList.remove('open'); s.innerHTML = ''; }
        // 菜单收起后控制栏要保持可见并重新计时。
        // 原来是"菜单一关就把控制栏也收掉"，点空白关菜单会连带把界面清空，
        // 看起来像"点一下全没了"，只能再点一次把控制栏唤回来。
        vvShowCS();
    } catch (e) {}
}

function vvSheetShow(items) {
    try {
        var s = vvGetSheet();
        if (!s) return;
        s.innerHTML = '';
        items.forEach(function (it) {
            var row = vvEl('div', 'vv-sheet-item' + (it.on ? ' on' : ''));
            row.innerHTML = vvEscape(it.label);
            row.addEventListener('click', function (e) {
                e.stopPropagation();
                var keep = it.act();
                if (!keep) vvHideSheet();
            });
            s.appendChild(row);
        });
        s.classList.add('open');
        vvShowCS();
    } catch (e) {}
}

function vvSpeedMenu() {
    var opts = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
    var cur = VV.active ? VV.active.speed : 1;
    var items = opts.map(function (o) {
        return {
            label: (o === 1 ? '正常' : o + 'x') + (o === cur ? '  ✓' : ''),
            on: o === cur,
            act: function () {
                vvSetSpeed(o);
                return false;
            }
        };
    });
    vvSheetShow(items);
}

function vvLevelLabel(lv, idx) {
    try {
        var h = lv && lv.height ? lv.height + 'P' : ('线路' + (idx + 1));
        var b = lv && lv.bitrate ? Math.round(lv.bitrate / 1000) + 'kbps' : '';
        return h + (b ? ' · ' + b : '');
    } catch (e) { return '线路' + (idx + 1); }
}

function vvAudioLabel(tr, idx) {
    try {
        var n = tr && (tr.name || tr.lang) || ('音轨' + (idx + 1));
        if (tr && tr.name && tr.lang && tr.name !== tr.lang) n += ' (' + tr.lang + ')';
        return n;
    } catch (e) { return '音轨' + (idx + 1); }
}

function vvUpdateSpeedChip() {
    try {
        var a = VV.active;
        var chip = document.getElementById('vv-speed-chip');
        if (!a || !chip) return;
        var s = a.speed && a.speed !== 1 ? (a.speed + 'x') : '倍速';
        var q = '';
        if (a.levels && a.levels.length > 1) {
            if (a.qIndex === undefined) q = a.qAutoHeight ? ('自动·' + a.qAutoHeight + 'P') : '自动';
            else q = (a.levels[a.qIndex] && a.levels[a.qIndex].height) ? (a.levels[a.qIndex].height + 'P') : ('线路' + (a.qIndex + 1));
        }
        chip.innerHTML = vvEscape(s + (q ? ' · ' + q : ''));
    } catch (e) {}
}

function vvSetSpeed(sp) {
    try {
        VV.active.speed = sp;
        VID.playbackRate = sp;
        vvSet('speed', String(sp));
        vvUpdateSpeedChip();
        vvToast('倍速 ' + (sp === 1 ? '正常' : sp + 'x'));
    } catch (e) {}
}

function vvBufAhead() {
    try {
        var t = VID.currentTime || 0;
        var b = VID.buffered;
        if (!b || !b.length) return 0;
        for (var i = 0; i < b.length; i++) {
            if (t >= b.start(i) - 0.5 && t <= b.end(i) + 0.5) return Math.max(0, b.end(i) - t);
        }
        return Math.max(0, b.end(b.length - 1) - t);
    } catch (e) { return 0; }
}

// 生成可复制的播放诊断，用来区分：源/网络慢、解码掉帧、还是 hls.js 策略问题
function vvDiagText() {
    var a = VV.active || {};
    var v = VID || {};
    var lines = [];
    var push = function (s) { lines.push(s); };
    push('Via 视频播放诊断 v' + VV.version + (VV.build ? '  build ' + VV.build : ''));
    try { push('UA: ' + navigator.userAgent); } catch (e0) {}
    push('类型: ' + ((a.item && a.item.type) || '?') + '  倍速: ' + (v.playbackRate || 1) + 'x');
    push('画面: ' + (v.videoWidth || 0) + 'x' + (v.videoHeight || 0) + '  时长: ' + vvFmtTime(v.duration || 0));
    push('状态: ready=' + (v.readyState || 0) + ' network=' + (v.networkState || 0) +
        ' paused=' + !!v.paused + ' seeking=' + !!v.seeking);
    var ahead = vvBufAhead();
    push('缓冲: ' + ahead.toFixed(1) + 's ahead');
    var dropPct = 0;
    try {
        var q = v.getVideoPlaybackQuality && v.getVideoPlaybackQuality();
        if (q && q.totalVideoFrames) {
            dropPct = q.droppedVideoFrames / q.totalVideoFrames * 100;
            push('丢帧: ' + q.droppedVideoFrames + ' / ' + q.totalVideoFrames +
                ' (' + dropPct.toFixed(2) + '%)');
        } else if (typeof v.webkitDroppedFrameCount === 'number') {
            var totalF = v.webkitDecodedFrameCount || 0;
            if (totalF) dropPct = v.webkitDroppedFrameCount / totalF * 100;
            push('丢帧: ' + v.webkitDroppedFrameCount + ' / ' + totalF +
                (totalF ? ' (' + dropPct.toFixed(2) + '%)' : ''));
        }
    } catch (eQ) {}
    var waitMs = (a._waitMs || 0) + (a._waitStart ? Date.now() - a._waitStart : 0);
    push('卡顿: ' + (a._waitCount || 0) + ' 次 / 累计 ' + Math.round(waitMs) + 'ms');
    if (a.hls) {
        var inst = a.hls;
        var lv = inst.levels && inst.currentLevel >= 0 ? inst.levels[inst.currentLevel] : null;
        var lvLoad = inst.levels && inst.loadLevel >= 0 ? inst.levels[inst.loadLevel] : null;
        push('HLS: ' + (inst.autoLevelEnabled ? '自动' : '手动') +
            ' 当前=' + (lv ? ((lv.height || '?') + 'P/' + Math.round((lv.bitrate || 0) / 1000) + 'k') : '?') +
            ' 加载=' + (lvLoad ? ((lvLoad.height || '?') + 'P') : '?'));
        push('码率估计: ' + (inst.bandwidthEstimate ? (inst.bandwidthEstimate / 1000000).toFixed(2) + ' Mbps' : '?'));
        var loads = a._fragLoads || [];
        var avg = 0;
        for (var li = 0; li < loads.length; li++) avg += loads[li];
        if (loads.length) avg = Math.round(avg / loads.length);
        push('分片: 最近 ' + (a._fragMs ? a._fragMs + 'ms' : '?') +
            ' / ' + (a._fragBytes ? Math.round(a._fragBytes / 1024) + 'KB' : '?') +
            '  平均 ' + (avg ? avg + 'ms' : '?'));
        if (a._fragLoadingSince) push('分片加载中: ' + ((Date.now() - a._fragLoadingSince) / 1000).toFixed(1) + 's');
        // 负载率 = 播放消耗速率 ÷ 实际下载速率，不依赖分片时长也能算。
        // ≥100% 表示下载已经追不上播放，必然持续卡顿，换什么播放策略都没用。
        var dlKbs = (a._fragMsSum && a._fragBytesSum)
            ? a._fragBytesSum / a._fragMsSum
            : ((a._fragMs && a._fragBytes) ? a._fragBytes / a._fragMs : 0);
        var needKbs = lv && lv.bitrate ? lv.bitrate / 8000 : 0;
        var loadPct = (dlKbs && needKbs) ? needKbs / dlKbs * 100 : 0;
        if (dlKbs) {
            push('速率: 下载 ' + dlKbs.toFixed(1) + 'KB/s  需要 ' + needKbs.toFixed(1) +
                'KB/s  负载 ' + Math.round(loadPct) + '%');
        }
        // 分片时长只用于参考：不是所有清单都能拿到 details
        var tdur = 0;
        try {
            var ld = inst.latestLevelDetails;
            if (!ld && inst.levels && inst.levels.length) {
                var liD = inst.loadLevel >= 0 ? inst.loadLevel : (inst.currentLevel >= 0 ? inst.currentLevel : 0);
                ld = inst.levels[liD] && inst.levels[liD].details;
            }
            if (!ld) {
                for (var liE = 0; liE < inst.levels.length; liE++) {
                    if (inst.levels[liE].details && inst.levels[liE].details.targetDuration) { ld = inst.levels[liE].details; break; }
                }
            }
            if (ld && ld.targetDuration) tdur = ld.targetDuration;
        } catch (eTd) {}
        if (tdur) push('分片时长: ' + tdur.toFixed(1) + 's' + (loadPct ? '  按分片时长算占用 ' + Math.round(avg / (tdur * 1000) * 100) + '%' : ''));
        var verdict;
        var curH = lv && lv.height ? lv.height + 'P' : '当前档';
        var loadingSec = a._fragLoadingSince ? (Date.now() - a._fragLoadingSince) / 1000 : 0;
        if (loadPct >= 100) {
            verdict = inst.autoLevelEnabled
                ? '源或 CDN 限速：下载 ' + dlKbs.toFixed(0) + 'KB/s，播放要 ' + needKbs.toFixed(0) + 'KB/s，调策略没用'
                : '手动锁了 ' + curH + '：要 ' + needKbs.toFixed(0) + 'KB/s，只有 ' + dlKbs.toFixed(0) + 'KB/s';
        } else if (loadingSec > 6) {
            verdict = '有分片已等 ' + loadingSec.toFixed(0) + 's 未返回：源太慢，或正在硬等';
        } else if (dropPct >= 2) {
            verdict = 'WebView 软解超载：网络够快但丢帧 ' + dropPct.toFixed(1) + '%，要限码率';
        } else if (ahead < 2 && loadPct >= 60) {
            verdict = '策略偏紧：缓冲只剩 ' + ahead.toFixed(1) + 's，负载 ' + Math.round(loadPct) + '% 已到临界';
        } else if (loadPct >= 60) {
            verdict = '网络偏紧：负载 ' + Math.round(loadPct) + '%，还没卡死但缓冲在走低';
        } else if (ahead >= 2) {
            verdict = '网络与解码都正常：卡顿来自 seek、重排或事件抖动';
        } else {
            verdict = '缓冲已空但下载很快：ABR 起播或切档瞬间的抖动';
        }
        push('判定: ' + verdict);
    } else {
        push('内核: 系统原生 / MP4');
        if (dropPct >= 2) push('判定: 解码超载，码率超出设备软解能力');
    }
    try {
        var mem = performance.memory;
        if (mem) push('JS 堆: ' + Math.round(mem.usedJSHeapSize / 1048576) + 'MB / ' + Math.round(mem.jsHeapSizeLimit / 1048576) + 'MB');
    } catch (eM) {}
    push('页面可见: ' + !document.hidden);
    // 独占模式的现场：这一行是"为什么别的页不肯让出解码器"的唯一可靠答案。
    // 三个信号全绿（visible + rAF 在跑 + 有焦点）的页面会一直认为自己在台前，
    // 只有它自己不拆；这时要看别的页面这一行是不是也全绿（那就是多窗口/分屏场景，
    // 靠 hasFocus 区分，需要持续失焦 4 秒才判定）。
    try {
        var visTxt = '';
        try { visTxt = document.visibilityState || '?'; } catch (eV) {}
        var focTxt = '未知';
        try { focTxt = vvHasFocus() ? '有' : '无'; } catch (eF) {}
        push('独占判定: ' + (VV._bg ? '后台（已交出解码器）' : '前台（持有解码器）') +
            '  vis=' + visTxt + ' 焦点=' + focTxt +
            (VV._focusEverTrue ? '' : '(不可用)') +
            (VV._noFocusAt ? ' 已失焦' + Math.round((Date.now() - VV._noFocusAt) / 1000) + 's' : ''));
        push('解码器: 本页管线 ' + vvMediaPipelineCount() + ' 条' +
            '  已交还 ' + (VV._releaseTotal || 0) + ' 条' +
            '  后台巡检 ' + (VV._sweepCount || 0) + ' 轮' +
            '  拦下起播 ' + (VV._gateBlocked || 0) + ' 次' +
            '（其中拦下装源 ' + (VV._gateSrcBlocked || 0) + ' 次）');
        // 声音状态：排查"画面在动却听不到声音"时，这一行就能定性
        // （是我们的临时静音没还原，还是站点自己在 muted）。
        try {
            var _pv = document.querySelector('.vv-player-video');
            push('声音: ' + (_pv ? ('muted=' + _pv.muted + ' vol=' + (Math.round(_pv.volume * 100) / 100)) : '无播放器') +
                '  存储 vol=' + vvGet('vol', 1) + ' mute=' + vvGet('mute', 0));
        } catch (eSnd) {}
        if (VV._lastReleaseAt) {
            push('最近交还: ' + Math.round((Date.now() - VV._lastReleaseAt) / 1000) + 's 前（' + (VV._lastReleaseWhy || '?') + '）');
        }
        // 跨页通道是否真的通。"我看的那页独占"要靠别的页知道该让位，
        // 而 localStorage 按域名隔离——十个不同视频站互相看不见。
        // 这里显示到底走通了哪条通道；两条都没通就说明只能靠"失焦/停帧"各自判定。
        push('跨页通道: ' + (VV._gmBusOk ? 'GM 脚本级（跨站可用）'
            : VV._lsBusOk ? 'localStorage（仅同站）' : '尚未收到过其它页的通知'));
        // 嗅探开销：判断"这站是本来就卡，还是被我们拖卡的"。
        // 丢弃数不为 0 说明页面的 DOM 增速超过了我们的处理速度（瀑布流/弹幕/自动轮播的典型特征）。
        // 省读是"没有去读的响应体次数"，被挡住的是 js/css/html 这类读了也没用的东西。
        try {
            push('嗅探开销: 条目 ' + VV.items.length +
                '  DOM ' + (VV._moNodes || 0) + (VV._moDropped ? '(丢弃' + VV._moDropped + ')' : '') +
                '  省读 ' + (VV._bodySkip || 0) + ' 次/' + Math.round((VV._bodySkipKb || 0) / 102.4) / 10 + 'MB');
        } catch (eCost) {}
    } catch (eX) {}
    return lines.join('\n');
}

try { VV._diagText = vvDiagText; VV._bufAhead = vvBufAhead; } catch (eD) {}

function vvMenuSheet() {
    var act = VV.active;
    if (!act) return;
    var dur = VID.duration || 0;
    var items = [];
    items.push({
        label: '标记片头（跳过当前位置之前）',
        on: act.skipS > 0,
        act: function () {
            act.skipS = Math.max(0, (VID.currentTime || 0) - 0.2);
            vvSaveProgressField();
            vvToast('已标记片头 ' + vvFmtTime(act.skipS));
            return false;
        }
    });
    if (dur > 0) {
        items.push({
            label: '标记片尾（在本位置结束）',
            on: act.skipE > 0,
            act: function () {
                act.skipE = Math.max(0, dur - (VID.currentTime || 0) - 0.2);
                vvSaveProgressField();
                vvToast('已标记片尾，距结尾 ' + vvFmtTime(act.skipE));
                return false;
            }
        });
    }
    if (act.skipS > 0 || act.skipE > 0) {
        items.push({
            label: '清除片头片尾标记',
            act: function () {
                act.skipS = 0;
                act.skipE = 0;
                vvSaveProgressField();
                vvToast('已清除');
                return false;
            }
        });
    }
    items.push({
        label: '多页并行播放：' + (VV.cfg.multiPlay ? '开' : '关'),
        on: VV.cfg.multiPlay,
        act: function () {
            vvToggleMultiPlay();
            return false;
        }
    });
    items.push({
        label: '连播（自动下一集）：' + (VV.cfg.autoplayNext ? '开' : '关'),
        on: VV.cfg.autoplayNext,
        act: function () {
            VV.cfg.autoplayNext = !VV.cfg.autoplayNext;
            vvSet('autoplayNext', VV.cfg.autoplayNext);
            vvToast('连播已' + (VV.cfg.autoplayNext ? '开启' : '关闭'));
            return false;
        }
    });
    if (act.hls && act.levels && act.levels.length > 1) {
        items.push({
            label: '画质：' + (act.qIndex === undefined ? (act.qAutoHeight ? '自动·' + act.qAutoHeight + 'P' : '自动') : (act.levels[act.qIndex].height ? act.levels[act.qIndex].height + 'P' : ('线路' + (act.qIndex + 1)))),
            act: function () {
                vvQualityMenu();
                return true;
            }
        });
    }
    if (act.hls && act.audioTracks && act.audioTracks.length > 1) {
        var ai = act.hlsInst && typeof act.hlsInst.audioTrack === 'number' ? act.hlsInst.audioTrack : act.audioIndex;
        items.push({
            label: '音轨：' + vvAudioLabel(act.audioTracks[ai] || act.audioTracks[0], ai),
            act: function () {
                vvAudioMenu();
                return true;
            }
        });
    }
    if (act.item && act.item.type === 'HLS') {
        var eng = VV.cfg.hlsEngine || 'auto';
        var engLabel = eng === 'native' ? '系统原生' : (eng === 'hlsjs' ? 'hls.js' : '自动');
        items.push({
            label: 'HLS 内核：' + engLabel + '（点按切换）',
            act: function () {
                var next = eng === 'auto' ? 'native' : (eng === 'native' ? 'hlsjs' : 'auto');
                if (next === 'native' && !vvCanNativeHls()) {
                    vvToast('系统 WebView 不支持原生 HLS', true);
                    return false;
                }
                VV.cfg.hlsEngine = next;
                vvSet('hlsEngine', next);
                var t = VID.currentTime || 0;
                vvToast('已切换 HLS 内核，重新加载…', true);
                vvLoadMedia(act.item);
                var onMeta = function () {
                    try { VID.removeEventListener('loadedmetadata', onMeta); } catch (eR) {}
                    try {
                        if (t > 0.5) {
                            if (act.hls) act.hls.startLoad(t);
                            VID.currentTime = t;
                        }
                    } catch (eS) {}
                };
                try { VID.addEventListener('loadedmetadata', onMeta); } catch (eA) {}
                return false;
            }
        });
    }
    items.push({
        label: '复制播放诊断',
        act: function () {
            var txt = vvDiagText();
            vvCopy(txt);
            var q = null;
            try { q = VID.getVideoPlaybackQuality && VID.getVideoPlaybackQuality(); } catch (eQ) {}
            var drop = q && q.totalVideoFrames ? (q.droppedVideoFrames / q.totalVideoFrames * 100).toFixed(1) + '%' : '?';
            vvToast('诊断已复制 · 缓冲 ' + vvBufAhead().toFixed(1) + 's · 丢帧 ' + drop, true);
            return false;
        }
    });
    items.push({
        label: '从头播放',
        act: function () {
            vvSeekTo(0);
            return false;
        }
    });
    items.push({
        label: '下载此视频',
        act: function () {
            vvDownloadItem(act.item);
            return false;
        }
    });
    items.push({
        label: '重建播放实例（解码失败/卡死时用）',
        act: function () {
            vvRebuildMedia();
            return false;
        }
    });
    items.push({
        label: '用外部播放器播放（独立进程，可并行）',
        act: function () {
            var ok = vvOpenExternal(act.item);
            vvToast(ok ? '已唤起系统选择器，选 VLC / MX 等即可' : '无法唤起外部应用，请用「外部播放器 / 复制链接」导出 .m3u', true);
            return false;
        }
    });
    items.push({
        label: '外部播放器 / 复制链接',
        act: function () {
            vvShareOpen(act.item);
            return false;
        }
    });
    vvSheetShow(items);
}

function vvSaveProgressField() {
    try {
        var m = vvGetProgressMap();
        m[VV.active.key] = {
            t: (m[VV.active.key] && m[VV.active.key].t) || (VID.currentTime || 0),
            d: VID.duration || 0,
            s: VV.active.skipS,
            e: VV.active.skipE,
            u: Date.now()
        };
        vvSaveProgressMap(m);
    } catch (e) {}
}

function vvBuildQualityMenu(levels, hlsInst) {
    if (!VV.active) return;
    VV.active.levels = levels;
    VV.active.hlsInst = hlsInst;
    try {
        if (hlsInst && hlsInst.currentLevel >= 0 && levels[hlsInst.currentLevel] && levels[hlsInst.currentLevel].height) {
            VV.active.qAutoHeight = levels[hlsInst.currentLevel].height;
        }
    } catch (eL) {}
    vvUpdateSpeedChip();
}

function vvQualityMenu() {
    try {
        var act = VV.active;
        if (!act || !act.levels) return;
        var items = [{
            label: '自动（自适应）' + (act.qIndex === undefined ? '  ✓' : ''),
            on: act.qIndex === undefined,
            act: function () {
                // 用 nextLevel 而不是 currentLevel：后者会立刻 flush 缓冲重拉，
                // 弱网下切档瞬间必卡 2~5 秒；nextLevel 等到下个分片边界平滑切。
                try { act.hlsInst.nextLevel = -1; } catch (e) {}
                act.qIndex = undefined;
                act.qAutoHeight = 0;
                vvToast('画质 自动');
                vvBuildQualityMenu(act.levels, act.hlsInst);
                return false;
            }
        }];
        act.levels.forEach(function (lv, idx) {
            items.push({
                label: vvLevelLabel(lv, idx) + (act.qIndex === idx ? '  ✓' : ''),
                on: act.qIndex === idx,
                act: function () {
                    try { act.hlsInst.nextLevel = idx; } catch (e2) {}
                    act.qIndex = idx;
                    act.qAutoHeight = lv.height || 0;
                    vvToast('画质 ' + vvLevelLabel(lv, idx) + '（下一段生效）');
                    vvBuildQualityMenu(act.levels, act.hlsInst);
                    return false;
                }
            });
        });
        vvSheetShow(items);
    } catch (e) {}
}

function vvAudioMenu() {
    try {
        var act = VV.active;
        if (!act || !act.audioTracks || act.audioTracks.length < 2) return;
        var cur = act.hlsInst && typeof act.hlsInst.audioTrack === 'number' ? act.hlsInst.audioTrack : act.audioIndex;
        var items = act.audioTracks.map(function (tr, idx) {
            return {
                label: vvAudioLabel(tr, idx) + (cur === idx ? '  ✓' : ''),
                on: cur === idx,
                act: function () {
                    try { act.hlsInst.audioTrack = idx; } catch (eA) {}
                    act.audioIndex = idx;
                    vvToast('音轨 ' + vvAudioLabel(tr, idx));
                    return false;
                }
            };
        });
        vvSheetShow(items);
    } catch (e) {}
}
