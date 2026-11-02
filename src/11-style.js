var VV_CSS = `
.vv-badge, .vv-panel-wrap, .vv-player-root, .vv-toast, .vv-save-seek, .vv-share-wrap { all: initial; }
.vv-share-wrap { position: fixed; left: 0; top: 0; width: 100%; height: 100%; z-index: 2147483647; background: rgba(8,8,12,.8); display: flex; align-items: flex-end; font-family: system-ui, -apple-system, sans-serif; box-sizing: border-box; }
.vv-share { width: 100%; max-height: 86%; overflow-y: auto; background: #17181f; border-radius: 18px 18px 0 0; color: #e9eaee; padding: 16px 18px calc(env(safe-area-inset-bottom, 0px) + 18px); box-sizing: border-box; animation: vvSlideUp .2s ease; }
.vv-share-head { display: flex; align-items: center; margin-bottom: 8px; }
.vv-share-title { flex: 1; font-size: 17px; font-weight: 700; color: #fff; }
.vv-share-x { width: 30px; height: 30px; border: none; border-radius: 50%; background: #2a2c36; color: #cfd2dc; font-size: 13px; line-height: 1; }
.vv-share-sub { font-size: 12px; line-height: 1.6; color: #9aa0ae; margin-bottom: 10px; }
.vv-share-url { font-size: 11px; line-height: 1.5; color: #7f8697; background: #101117; border: 1px solid #24262f; border-radius: 10px; padding: 9px 11px; word-break: break-all; margin-bottom: 12px; font-family: ui-monospace, Menlo, monospace; }
.vv-share-btns { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.vv-share-btn { flex: 1 1 46%; min-height: 42px; border: 1px solid #2c2f3a; border-radius: 11px; background: #21232c; color: #e9eaee; font-size: 13px; padding: 0 10px; box-sizing: border-box; }
.vv-share-btn.primary { background: linear-gradient(135deg, #3d7dff, #6f5bff); border-color: transparent; font-weight: 600; }
.vv-share-btn[disabled] { opacity: .55; }
.vv-share-log { font-size: 12px; line-height: 1.75; color: #a8aebc; background: #101117; border: 1px solid #24262f; border-radius: 10px; padding: 10px 12px; word-break: break-all; font-family: ui-monospace, Menlo, monospace; }
.vv-share-line { margin-bottom: 2px; }
.vv-share-verdict { margin-top: 8px; padding-top: 8px; border-top: 1px solid #24262f; color: #7fb2ff; font-weight: 600; font-family: system-ui, sans-serif; }
.vv-badge { position: fixed; z-index: 2147483647; width: 46px; height: 46px; border-radius: 50%; background: linear-gradient(135deg, #3d7dff 0%, #8f47ff 100%); box-shadow: 0 4px 14px rgba(61,125,255,.45), 0 2px 6px rgba(0,0,0,.3); display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; transform: translateY(16px); transition: opacity .25s ease, transform .25s ease; touch-action: none; user-select: none; -webkit-user-select: none; }
.vv-badge.show { opacity: 1; transform: translateY(0); }
.vv-badge-num { position: absolute; top: -4px; right: -6px; min-width: 18px; height: 18px; line-height: 18px; text-align: center; border-radius: 9px; background: #ff4d4f; color: #fff; font-size: 11px; font-weight: 700; padding: 0 4px; box-sizing: content-box; font-family: system-ui, sans-serif; }
.vv-badge-play { width: 0; height: 0; border-style: solid; border-width: 9px 0 9px 15px; border-color: transparent transparent transparent #fff; margin-left: 4px; }
.vv-panel-wrap { position: fixed; left: 0; top: 0; width: 100%; height: 100%; z-index: 2147483647; background: rgba(10,10,14,.74); display: none; font-family: system-ui, -apple-system, sans-serif; }
.vv-panel-wrap.open { display: flex; flex-direction: column; justify-content: flex-end; }
.vv-panel { background: #16171d; border-radius: 18px 18px 0 0; max-height: 72%; display: flex; flex-direction: column; color: #e9eaee; padding-bottom: env(safe-area-inset-bottom, 0px); animation: vvSlideUp .22s ease; }
@keyframes vvSlideUp { from { transform: translateY(40%); opacity: .4; } to { transform: translateY(0); opacity: 1; } }
.vv-head { display: flex; align-items: center; padding: 16px 16px 10px 20px; }
.vv-head-title { font-size: 17px; font-weight: 700; color: #fff; flex: 1; }
.vv-head-btn { background: rgba(255,255,255,.08); border: none; color: #cfd1d8; font-size: 12px; padding: 7px 12px; border-radius: 15px; margin-left: 8px; font-family: inherit; }
.vv-list { overflow-y: auto; padding: 2px 12px 14px 12px; -webkit-overflow-scrolling: touch; }
.vv-row { display: flex; align-items: center; background: #23252d; border-radius: 12px; padding: 12px; margin-bottom: 8px; }
.vv-row-info { flex: 1; min-width: 0; }
.vv-row-name { font-size: 13px; color: #fff; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vv-row-sub { font-size: 11px; color: #83878f; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vv-row-tags { margin-top: 6px; display: flex; align-items: center; }
.vv-tag { font-size: 10px; font-weight: 700; color: #fff; border-radius: 4px; padding: 2px 6px; margin-right: 6px; font-family: system-ui, sans-serif; }
.vv-tag.HLS { background: #ff7d29; }
.vv-tag.MP4, .vv-tag.M4V, .vv-tag.MOV { background: #2f7bff; }
.vv-tag.WEBM, .vv-tag.MKV, .vv-tag.FLV, .vv-tag.AVI, .vv-tag.WMV { background: #12b76a; }
.vv-tag.AUDIO { background: #b454ff; }
.vv-tag.BLOB { background: #5c616b; }
.vv-row-acts { display: flex; align-items: center; margin-left: 10px; }
.vv-btn-play { width: 38px; height: 38px; border-radius: 50%; border: none; background: linear-gradient(135deg, #3d7dff, #8f47ff); color: #fff; font-size: 15px; margin-left: 6px; font-family: inherit; }
.vv-btn-mini { width: 30px; height: 30px; border-radius: 50%; border: none; background: rgba(255,255,255,.1); color: #cfd1d8; font-size: 13px; margin-left: 6px; font-family: inherit; }
.vv-empty { text-align: center; color: #83878f; padding: 46px 20px; font-size: 13px; }
.vv-prefix-note { padding: 8px 20px 6px; font-size: 11px; color: #585d66; }
.vv-toast { position: fixed; left: 50%; bottom: 14%; transform: translateX(-50%); background: rgba(24,25,32,.95); color: #fff; padding: 11px 18px; border-radius: 22px; font-size: 13px; z-index: 2147483647; opacity: 0; transition: opacity .25s; pointer-events: none; max-width: 82vw; font-family: system-ui, sans-serif; box-shadow: 0 4px 18px rgba(0,0,0,.4); }
.vv-toast.show { opacity: 1; }
.vv-save-seek { position: fixed; left: 50%; bottom: 8%; transform: translateX(-50%); background: rgba(24,25,32,.95); color: #fff; padding: 10px 14px; border-radius: 14px; font-size: 13px; z-index: 2147483647; display: flex; align-items: center; font-family: system-ui, sans-serif; box-shadow: 0 4px 18px rgba(0,0,0,.4); }
.vv-save-seek button { margin-left: 12px; border: none; background: rgba(255,255,255,.14); color: #fff; padding: 7px 12px; border-radius: 12px; font-size: 12px; font-family: inherit; }
.vv-save-seek button.primary { background: #3d7dff; }
.vv-player-root { position: fixed; left: 0; top: 0; width: 100%; height: 100vh; height: 100dvh; z-index: 2147483647; background: #000; font-family: system-ui, -apple-system, sans-serif; touch-action: none; user-select: none; -webkit-user-select: none; }
.vv-player-video { width: 100%; height: 100%; object-fit: contain; background: #000; }
.vv-bright { position: absolute; inset: 0; background: #000; opacity: 0; pointer-events: none; z-index: 140; }
.vv-cs-top { position: absolute; left: 0; top: 0; width: 100%; padding: calc(env(safe-area-inset-top, 0px) + 8px) 12px 8px; box-sizing: border-box; display: flex; align-items: center; z-index: 200; opacity: 0; pointer-events: none; transition: opacity .2s ease; background: linear-gradient(rgba(0,0,0,.72), transparent); }
.vv-cs-bottom { position: absolute; left: 0; bottom: 0; width: 100%; padding: 6px 12px calc(env(safe-area-inset-bottom, 0px) + 10px); box-sizing: border-box; z-index: 200; opacity: 0; pointer-events: none; transition: opacity .2s ease; background: linear-gradient(transparent, rgba(0,0,0,.72)); }
.vv-player-root.cs-on .vv-cs-top, .vv-player-root.cs-on .vv-cs-bottom { opacity: 1; pointer-events: auto; }
.vv-player-root.cs-on .vv-cs-top { opacity: 1; pointer-events: auto; }
.vv-csbtn { background: transparent; border: none; color: #fff; font-size: 16px; padding: 8px 10px; margin: 0 2px; font-family: inherit; }
.vv-title { color: #fff; font-size: 14px; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0 6px; }
.vv-center-play { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 64px; height: 64px; border-radius: 50%; border: none; background: rgba(20,20,26,.55); color: #fff; font-size: 22px; z-index: 180; opacity: 0; pointer-events: none; transition: opacity .2s; }
.vv-player-root.cs-on .vv-center-play { opacity: 1; pointer-events: auto; }
.vv-loading { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display: none; flex-direction: column; align-items: center; gap: 10px; color: #fff; font-size: 13px; z-index: 185; pointer-events: none; background: rgba(0,0,0,.45); padding: 20px 22px 18px; border-radius: 18px; min-width: 132px; max-width: 78vw; box-shadow: 0 6px 24px rgba(0,0,0,.28); text-shadow: 0 1px 4px rgba(0,0,0,.6); }
.vv-loading.on { display: flex; }
/* ---- 起播失败卡片：源站 403 / 一次性鉴权 / 只有 blob 流时给出明确出口，而不是黑屏 ---- */
.vv-err { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display: none; flex-direction: column; align-items: center; gap: 8px; color: #fff; font-size: 13px; z-index: 190; background: rgba(18,18,22,.86); padding: 20px 18px 16px; border-radius: 18px; width: 78vw; max-width: 300px; box-sizing: border-box; box-shadow: 0 8px 30px rgba(0,0,0,.45); text-align: center; }
.vv-err.on { display: flex; }
.vv-err-ico { width: 34px; height: 34px; border-radius: 50%; background: rgba(255,84,84,.16); color: #ff6b6b; font-size: 20px; font-weight: 700; display: flex; align-items: center; justify-content: center; margin-bottom: 2px; }
.vv-err-t { font-size: 14px; font-weight: 600; }
.vv-err-m { font-size: 12px; opacity: .78; line-height: 1.55; word-break: break-word; }
.vv-err-btns { display: flex; gap: 8px; margin-top: 8px; flex-wrap: nowrap; justify-content: center; }
.vv-err-btn { background: rgba(255,255,255,.14); border: none; color: #fff; font-size: 12px; padding: 8px 12px; border-radius: 999px; font-family: inherit; white-space: nowrap; flex: 0 0 auto; }
.vv-err-btn.primary { background: #3d7dff; }
.vv-err-btn:active { opacity: .75; }
/* 加载中隐藏中央播放按钮，否则会压在环形进度圈上 */
.vv-player-root.vv-loading-on .vv-center-play { opacity: 0; pointer-events: none; }
.vv-spinner { width: 34px; height: 34px; border: 3px solid rgba(255,255,255,.28); border-top-color: #fff; border-radius: 50%; animation: vv-spin .8s linear infinite; }
@keyframes vv-spin { to { transform: rotate(360deg); } }
/* ---- 加载进度：环形进度 + 百分比 + 明细 ---- */
.vv-lr { position: relative; width: 58px; height: 58px; display: flex; align-items: center; justify-content: center; }
.vv-lr-svg { width: 58px; height: 58px; transform: rotate(-90deg); }
.vv-lr-bg { fill: none; stroke: rgba(255,255,255,.22); stroke-width: 3; }
.vv-lr-fg { fill: none; stroke: #fff; stroke-width: 3; stroke-linecap: round; stroke-dasharray: 119.4; stroke-dashoffset: 119.4; transition: stroke-dashoffset .25s linear; }
.vv-lr-num { position: absolute; font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; font-family: system-ui, sans-serif; }
.vv-loading.indet .vv-lr-fg { stroke-dasharray: 26 119.4; animation: vv-lr-spin 1.05s linear infinite; transition: none; transform-box: view-box; transform-origin: 50% 50%; }
@keyframes vv-lr-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.vv-load-detail { font-size: 12px; opacity: .92; font-variant-numeric: tabular-nums; font-family: system-ui, sans-serif; max-width: 190px; text-align: center; line-height: 1.45; margin-top: -2px; }
.vv-load-detail:empty { display: none; }
/* ---- 顶部细进度条（缓冲时）---- */
.vv-loadbar { position: absolute; left: 0; right: 0; top: 0; height: 3px; background: rgba(255,255,255,.14); opacity: 0; transition: opacity .2s; z-index: 205; pointer-events: none; overflow: hidden; }
.vv-loadbar.on { opacity: 1; }
.vv-loadbar-fill { height: 100%; width: 0; background: #3d7dff; transition: width .25s linear; }
.vv-loadbar.indet .vv-loadbar-fill { width: 38%; animation: vv-lb-slide 1.05s ease-in-out infinite; }
@keyframes vv-lb-slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
.vv-prog-row { display: flex; align-items: center; padding: 0 4px; }
.vv-prog { flex: 1; position: relative; height: 28px; }
.vv-prog-track { position: absolute; left: 0; right: 0; top: 12px; height: 4px; background: rgba(255,255,255,.22); border-radius: 3px; }
.vv-prog-buf { position: absolute; left: 0; top: 12px; height: 4px; background: rgba(255,255,255,.35); border-radius: 3px; width: 0; }
.vv-prog-cur { position: absolute; left: 0; top: 12px; height: 4px; background: #3d7dff; border-radius: 3px; width: 0; }
.vv-prog-dot { position: absolute; top: 8px; left: 0; width: 12px; height: 12px; margin-left: -6px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.5); }
.vv-prog-range { position: absolute; inset: 0; opacity: 0; width: 100%; height: 100%; margin: 0; -webkit-appearance: none; appearance: none; background: transparent; }
.vv-time { color: #d9dbe2; font-size: 11px; margin: 0 8px; font-variant-numeric: tabular-nums; white-space: nowrap; font-family: system-ui, sans-serif; }
.vv-seek-tip { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); background: rgba(20,20,26,.65); color: #fff; padding: 8px 14px; border-radius: 10px; font-size: 13px; z-index: 220; opacity: 0; pointer-events: none; font-variant-numeric: tabular-nums; font-family: system-ui, sans-serif; }
.vv-ges-tip { position: absolute; top: 10%; left: 50%; transform: translateX(-50%); background: rgba(20,20,26,.65); color: #fff; padding: 7px 14px; border-radius: 16px; font-size: 13px; z-index: 220; opacity: 0; pointer-events: none; font-variant-numeric: tabular-nums; font-family: system-ui, sans-serif; }
.vv-ges-tip.on, .vv-seek-tip.on { opacity: 1; }
.vv-sheet { position: absolute; left: 0; bottom: 0; width: 100%; background: #1d1e26; border-radius: 14px 14px 0 0; z-index: 320; padding: 6px 0 calc(env(safe-area-inset-bottom, 0px) + 8px); box-sizing: border-box; display: none; color: #e9eaee; font-size: 14px; max-height: 62vh; overflow-y: auto; -webkit-overflow-scrolling: touch; }
.vv-sheet.open { display: block; }
.vv-sheet-item { padding: 13px 22px; display: flex; align-items: center; }
.vv-sheet-item.on { color: #6ea8ff; font-weight: 600; }
.vv-sheet-item.off { opacity: .5; pointer-events: none; }
.vv-lockmark { position: absolute; right: 14px; top: 14%; width: 40px; height: 40px; border-radius: 50%; background: rgba(20,20,26,.55); color: #fff; z-index: 210; display: none; align-items: center; justify-content: center; font-size: 17px; border: none; opacity: 0; pointer-events: none; transition: opacity .2s; }
.vv-player-root.cs-on .vv-lockmark { opacity: 1; pointer-events: auto; display: flex; }
.vv-player-root.locked .vv-lockmark { display: flex; pointer-events: auto; opacity: .9; }
.vv-player-root.locked .vv-cs-top, .vv-player-root.locked .vv-cs-bottom, .vv-player-root.locked .vv-center-play { opacity: 0 !important; pointer-events: none !important; }
`;
