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
                epDiag: vvEpisodesDiag,
                epNum: vvEpNum,
                epTemplate: vvEpTemplate,
                badge: vvToggleBadge,
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
