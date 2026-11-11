function vvMain() {
    try {
        vvEnsureStyle();
        vvSetupMenu();
        vvPageFsSetup();
        vvSetupLifecycle();
        vvConsumeAutoNext();
        setTimeout(vvvSyncBadge, 900);
        function vvvSyncBadge() { if (VV.items.length && !VV.playerActive) vvShowBadgeNew(); }
    } catch (e) {}
    // 排查与自动化验证用的内部句柄，只在地址带 ?vvdebug=1 时挂到 window
    try {
        if (/(?:\?|&)vvdebug=1(?:&|$)/.test(location.search || '')) {
            window.__vv = {
                VV: VV,
                // Via 里 vvSet 优先走 GM_setValue（脚本私有存储），页面 localStorage 读不到；
                // 真机验证「跳页自动续播」这类跨页标记时只能从脚本这一侧读
                get: vvGet,
                hlsConfig: vvHlsConfig,
                hlsSeekMode: vvHlsSetSeekMode,
                // 直播落位守卫的现场：真机 hls.js 的 details.live 到底判没判对，
                // 以及带着「旧续播位置 + 跳过片头」时起播还会不会落位。
                // 只读，不改任何状态；参数故意取极端值，方便一条断言就盖住两种输入。
                liveProbe: function () {
                    try {
                        var v = VID;
                        var lv = (VV.active && VV.active.hls && VV.active.hls.levels) || [];
                        var known = false, levelLive = false;
                        for (var i = 0; i < lv.length; i++) {
                            var dt = lv[i] && lv[i].details;
                            if (dt && typeof dt.live === 'boolean') {
                                known = true;
                                if (dt.live) levelLive = true;
                            }
                        }
                        var dur = v && isFinite(v.duration) ? v.duration : 0;
                        return {
                            live: vvIsLive(),
                            levelLive: known ? levelLive : null,
                            levels: lv.length,
                            dur: v ? String(v.duration) : 'none',
                            cur: v ? v.currentTime : null,
                            target: vvStartTarget({ t: 120, d: 600 }, dur, 90)
                        };
                    } catch (e) { return { err: String(e) }; }
                },
                diag: vvDiagText,
                bufAhead: vvBufAhead,
                open: openPlayer,
                close: closePlayer,
                openPanel: vvOpenPanel,
                closePanel: function () { try { if (vvUI && vvUI.panel) vvUI.panel.close(); } catch (e) {} },
                epScan: vvEpisodesScan,
                epOpen: vvEpisodesOpen,
                epClose: vvEpisodesClose,
                epGo: vvEpGo,
                // 连播下一集解析的现场：选集表优先 / 媒体 bump 兜底
                findNext: vvFindNext,
                // 字幕现场：轨道列表 / 当前选中 / TextTrack 模式与 cue 数（真机验证用）
                subs: function () {
                    var a = VV.active || {};
                    return {
                        tracks: (a.subTracks || []).map(function (t, i) {
                            return { i: i, name: t.name || '', lang: t.lang || '' };
                        }),
                        sel: a.hlsInst && typeof a.hlsInst.subtitleTrack === 'number' ? a.hlsInst.subtitleTrack : null,
                        tt: (function () { try { return VID ? VID.textTracks.length : -1; } catch (e) { return -1; } })(),
                        modes: (function () {
                            try {
                                var out = [], tts = VID.textTracks;
                                for (var i = 0; i < tts.length; i++) out.push(tts[i].mode);
                                return out;
                            } catch (e2) { return []; }
                        })(),
                        cues: (function () {
                            try {
                                var n = 0, tts = VID.textTracks;
                                for (var i = 0; i < tts.length; i++) if (tts[i].cues) n += tts[i].cues.length;
                                return n;
                            } catch (e3) { return -1; }
                        })()
                    };
                },
                subSet: function (idx) { try { vvSubPick(idx); } catch (e) {} },
                menuSheet: vvMenuSheet,
                // 播放缓存现场：支持/开关/命中计数/索引条目（真机验证 OPFS 用）。
                // cfgReady 由驱动侧轮询等待——索引是异步加载的，boot 时可能还没就绪。
                cache: function () {
                    return {
                        supported: vvOpfs.supported,
                        ready: vvOpfs.ready,
                        enabled: vvOpfsEnabled(),
                        hits: vvOpfs.hits,
                        misses: vvOpfs.misses,
                        writes: vvOpfs.writes,
                        bytes: vvOpfs.bytes,
                        entries: vvOpfs.index ? vvOpfs.index.size : 0,
                        errors: vvOpfs.errors
                    };
                },
                cacheWait: function () { return vvOpfsInit(); },
                cacheClear: function () { return vvOpfsClear(); },
                cacheSet: function (on) {
                    VV.cfg.opfsCache = !!on;
                    vvSet('opfsCache', VV.cfg.opfsCache);
                },
                epDiag: vvEpisodesDiag,
                epNum: vvEpNum,
                epTemplate: vvEpTemplate,
                badge: vvToggleBadge,
                // 角标数字防抖的现场：真机上验「连续变化不刷、稳定后一次到位」
                showBadgeNew: vvShowBadgeNew,
                badgeNum: function () {
                    try {
                        var b = vvUI.badge && vvUI.badge.querySelector('.vv-badge-num');
                        return b ? b.textContent : '';
                    } catch (e) { return ''; }
                },
                // 网页铺满（原名页面全屏）：现场状态与手动开关
                pageFs: vvPageFsState,
                pageFsSet: vvPageFsSet,
                pageFsToggle: vvTogglePageFullscreen,
                pageFsVideo: vvPageFsVideo,
                pageFsPick: vvPageFsPick,
                pageFsDiag: vvPageFsDiag,
                pageFsDiagnose: vvPageFsDiagnose,
                pageFsTick: vvPageFsTick,
                pageFsBtn: vvPageFsSyncBtn,
                shareProbe: vvShareProbe,
                buildM3U: vvBuildM3U,
                buildCmd: vvBuildCmd,
                buildIntent: vvBuildIntent,
                shareOpen: vvShareOpen,
                shareClose: vvShareClose,
                mini: vvMiniWindow,
                pip: vvTryPip,
                hasPriorityOverlay: vvHasPriorityOverlay,
                // 播放态低特效：只读状态与手动切换，供真机帧率探针复验
                lowFxSync: vvSyncLowFx,
                lowFxToggle: vvToggleLowFx,
                // 网页自动播放拦截：拦了几次、钩子装上没有、当前是否放行
                apState: function () {
                    try { return { blocked: VV_AP.blocked, hooked: VV_AP.hooked, allow: vvApCfgOn() }; } catch (e) { return null; }
                },
                apRestorePreload: function () { try { vvApRestorePreload(); } catch (e) {} },
                leaseWrite: function (id, ts) {
                    try {
                        if (!ts) { localStorage.removeItem(VV_LEASE_PREFIX + id); return; }
                        // first 设得足够早：仲裁按 first 排，本页的 first 是打开播放器那一刻，
                        // 不设早一点就永远轮不到对方当 owner，测不出挂起。
                        localStorage.setItem(VV_LEASE_PREFIX + id,
                            JSON.stringify({ ts: ts, first: ts - 3600000, url: '' }));
                    } catch (e) {}
                },
                leaseRead: vvPlayersRead,
                leaseId: vvLeaseId,
                leaseTick: vvLeaseTick,
                playersCount: vvPlayersCount,
                multiPlay: vvToggleMultiPlay,
                rebuild: vvRebuildMedia,
                forceClose: vvForceClose,
                suspend: vvSuspendPlayback,
                resume: vvResumePlayback,
                restorePageAudio: function () { try { return vvRestorePageAudio(); } catch (e) { return -1; } },
                restorePlayerAudio: function () { try { return vvRestorePlayerAudio(); } catch (e) { return -1; } },
                hibernate: vvHibernateMedia,
                thaw: vvThawMedia,
                enterBg: vvEnterBackground,
                leaveBg: vvLeaveBackground,
                setLoadPct: vvSetLoadPct,
                loadProgress: vvUpdateLoadProgress,
                stopLoadTick: vvStopLoadTick,
                showErr: vvShowErr,
                hideErr: vvHideErr,
                armWatchdog: vvArmStartWatchdog,
                disarmWatchdog: vvDisarmStartWatchdog,
                // 起播诊断：看门狗放宽了几次、有没有触发解码器自救、最近一次拿到分片的时间。
                // 真机上"插件起播比网页慢"只能靠这几个数分辨是网络慢还是重建循环。
                startDiag: function () {
                    var a = VV.active || {};
                    var now = Date.now();
                    return {
                        ext: a._wdogExtend || 0,
                        extAll: VV._startWdogExtend || 0,
                        rescue: a._rescue || 0,
                        lastRescue: VV._lastRescue || null,
                        fragMs: a._fragMs || 0,
                        fragAgo: a._fragLoadedAt ? now - a._fragLoadedAt : -1,
                        loading: !!a._fragLoadingSince,
                        // 清单在飞 / 最近一次真的有字节到账（直连 mp4 也能看到）
                        manif: !!a._manifLoadingSince,
                        netAgo: a._netAt ? now - a._netAt : -1,
                        // 判死走的是 dead 分支（HTTP>=400 / 连续失败）还是证据分支，
                        // 光看 flow 分不出来——这两个字段是给"为什么 12s 就弹了卡片"用的
                        httpCode: a._lastHttpCode || 0,
                        netFail: a._netFail || 0,
                        flow: (function () { try { return vvNetFlow(a, now); } catch (eF) { return -1; } })(),
                        wdogAge: a._wdogT0 ? Math.round((now - a._wdogT0) / 1000) : 0,
                        // 续播落位：早落位的目标位（0 = 没走早落位）、直连是否用了 #t=
                        early: a._earlyT || 0,
                        srcFrag: a._srcFrag ? 1 : 0,
                        rx: VID ? VID.readyState : -1,
                        t: VID ? +(VID.currentTime || 0).toFixed(2) : -1
                    };
                },
                // 泄漏自查：存活 hls 实例数（应为 0）、播放器视频元素是否还有 src
                hlsPool: function () { return (VV._hlsPool || []).length; },
                killAllHls: vvKillAllHls,
                // 关标签页/离开页面时最后一次清理的时间戳（0 表示从没触发过）
                lastTeardown: function () { return VV._lastTeardown || 0; },
                tornDown: function () { return !!_vvTornDown; },
                // 后台判定 / 释放链路的现场状态（排查"多页签播不动"用）
                tabHidden: function () { try { return vvTabHidden(); } catch (e) { return null; } },
                bg: function () { return { bg: !!VV._bg, since: VV._bgAt || 0, count: VV._bgCount || 0, rafGap: VV._rafSeen ? Date.now() - (VV._rafLast || 0) : -1 }; },
                // 前台判定的原始信号。「为什么不肯让出解码器」这个问题，看这一个就够：
                // vis=visible + rafGap 小 + hasFocus=true 的页面，会一直认为自己在前台。
                front: function () {
                    var vis = '';
                    try { vis = document.visibilityState || ''; } catch (e0) {}
                    var foc = null;
                    try { foc = vvHasFocus(); } catch (e1) {}
                    return {
                        bg: !!VV._bg,
                        hidden: vvTabHidden(),
                        vis: vis,
                        hasFocus: foc,
                        focusUsable: !!VV._focusEverTrue,
                        noFocusMs: VV._noFocusAt ? Date.now() - VV._noFocusAt : 0,
                        rafGap: VV._rafSeen ? Date.now() - (VV._rafLast || 0) : -1,
                        streak: VV._hidStreak || 0,
                        gate: vvGateActive(),
                        blocked: VV._gateBlocked || 0,
                        blockedSrc: VV._gateSrcBlocked || 0,
                        srcGuard: !!VV._srcGuard,
                        sweep: VV._sweepCount || 0,
                        pipelines: vvMediaPipelineCount(),
                        lastReleaseAt: VV._lastReleaseAt || 0,
                        muteBy: VV._muteBy || '',
                        muteCount: VV._muteCount || 0,
                        restoreCount: VV._restoreCount || 0,
                        hibCount: (VV._hib || []).length,
                        lastReleaseWhy: VV._lastReleaseWhy || ''
                    };
                },
                sweep: function () { try { vvBackgroundSweep(); } catch (e) {} },
                pipelines: function () { try { return vvMediaPipelineCount(); } catch (e) { return -1; } },
                visibilityTick: function () { try { vvVisibilityTick(); } catch (e) {} },
                requestPeerRelease: function () { try { vvRequestPeerRelease(); } catch (e) {} },
                peerReleaseSeen: function () { try { vvPeerReleaseSeen(); } catch (e) {} },
                deepHibernateBlob: function () { try { return vvDeepHibernateBlob(); } catch (e) { return -1; } },
                codecRescue: function (why) { try { return vvCodecRescue(why || 'api'); } catch (e) { return false; } },
                lastRescue: function () { return VV._lastRescue || null; },
                // 本页当前有多少条媒体管线（=可能各占一个解码器）
                mediaCount: function () {
                    var n = 0, withSrc = 0;
                    try {
                        var vs = document.querySelectorAll('video,audio');
                        n = vs.length;
                        for (var i = 0; i < vs.length; i++) {
                            var s = '';
                            try { s = vs[i].currentSrc || vs[i].getAttribute('src') || ''; } catch (e1) {}
                            if (s) withSrc++;
                        }
                    } catch (e2) {}
                    return { el: n, withSrc: withSrc, pool: (VV._hlsPool || []).length, playerActive: !!VV.playerActive };
                },
                videoSrcLen: function () {
                    var v = document.querySelector('.vv-player-video');
                    if (!v) return -1;
                    // 判据用 src 属性/IDL，不用 currentSrc：
                    // 摘掉 src + load() 之后 currentSrc 会残留一小会儿（要等资源选择跑完），
                    // 拿它判断"还没释放"会误报。真正的释放信号是属性没了。
                    var s = '';
                    try { s = v.getAttribute('src') || ''; } catch (e0) {}
                    if (!s) { try { s = v.src || ''; } catch (e1) {} }
                    return s.length;
                },
                // 页面级解码器治理：本页还挂着几条媒体管线、被别的页签叫停过几次
                releaseAllMedia: function (why) { try { return vvReleaseAllMedia(why || 'api'); } catch (e) { return -1; } },
                pausePageMedia: function () { try { vvPausePageMedia(); } catch (e) {} },
                // 页面预载治理：按住几条、守卫有没有在跑、当前页面还剩几条在拉的媒体
                stopPagePreload: function () { try { vvStopPagePreload(); } catch (e) {} },
                preloadState: function () {
                    var n = 0;
                    try {
                        var els = document.querySelectorAll('video,audio');
                        for (var i = 0; i < els.length; i++) {
                            var s = '';
                            try { s = els[i].currentSrc || els[i].getAttribute('src') || ''; } catch (e0) {}
                            if (s && els[i].networkState === 2) n++;
                        }
                    } catch (e1) {}
                    return {
                        held: (VV._pagePreload || []).length,
                        guard: !!VV._preloadTimer,
                        loadingNow: n,
                        aborts: VV._preloadAbort || 0
                    };
                },
                pageMedia: function () { return (VV._pageMedia || []).length; },
                peerStats: function () {
                    return {
                        released: !!VV._peerReleased,
                        at: VV._peerReleasedAt || 0,
                        n: VV._peerReleaseCount || 0,
                        handled: VV._peerHandled || 0,
                        timer: !!VV._peerTimer
                    };
                },
                // 嗅探开销自查：卡顿/卡死时先看这里，判断是"页面本身就重"还是"我们把页面拖重了"。
                // bodySkip 是省下来的响应体读取次数（js/css/html 这类），
                // moDropped 是 DOM 洪峰时主动丢弃的节点数（丢弃说明页面的节点生产速度超过了消费速度）。
                cost: function () {
                    return {
                        items: VV.items.length,
                        moNodes: VV._moNodes || 0,
                        moDropped: VV._moDropped || 0,
                        moQueue: (typeof vvMoQueue !== 'undefined' && vvMoQueue) ? vvMoQueue.length : 0,
                        bodyRead: VV._bodyRead || 0,
                        bodySkip: VV._bodySkip || 0,
                        bodySkipMb: +(((VV._bodySkipKb || 0) / 1024).toFixed(1)),
                        seen: Object.keys(VV.seen || {}).length,
                        perfSeen: (typeof vvPerfSeen !== 'undefined' && vvPerfSeen) ? Object.keys(vvPerfSeen).length : 0
                    };
                }
            };
        }
    } catch (eD) {}
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', vvMain, false);
} else {
    vvMain();
}
