function vvMain() {
    try {
        vvEnsureStyle();
        vvSetupMenu();
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
                hlsConfig: vvHlsConfig,
                hlsSeekMode: vvHlsSetSeekMode,
                diag: vvDiagText,
                bufAhead: vvBufAhead,
                open: openPlayer,
                close: closePlayer,
                openPanel: vvOpenPanel,
                closePanel: function () { try { if (vvUI && vvUI.panel) vvUI.panel.close(); } catch (e) {} },
                badge: vvToggleBadge,
                shareProbe: vvShareProbe,
                buildM3U: vvBuildM3U,
                buildCmd: vvBuildCmd,
                buildIntent: vvBuildIntent,
                shareOpen: vvShareOpen,
                leaseWrite: function (id, ts) { var p = {}; p[id] = { ts: ts, url: '' }; vvSet(VV_LEASE_KEY, { players: p }); },
                leaseRead: vvPlayersRead,
                leaseId: vvLeaseId,
                leaseTick: vvLeaseTick,
                playersCount: vvPlayersCount,
                multiPlay: vvToggleMultiPlay,
                rebuild: vvRebuildMedia,
                forceClose: vvForceClose,
                suspend: vvSuspendPlayback,
                resume: vvResumePlayback,
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
                videoSrcLen: function () {
                    var v = document.querySelector('.vv-player-video');
                    return v ? (v.currentSrc || v.getAttribute('src') || '').length : -1;
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
