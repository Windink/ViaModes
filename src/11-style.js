var VV_CSS = `
/* ============================================================
   设计令牌
   all: initial 不会重置自定义属性，所以令牌可以直接挂在浮层根节点上。
   ============================================================ */
.vv-badge, .vv-panel-wrap, .vv-player-root, .vv-toast, .vv-save-seek, .vv-share-wrap { all: initial; }
.vv-player-root, .vv-panel-wrap, .vv-badge, .vv-share-wrap, .vv-toast, .vv-save-seek {
  --vv-accent: #4d8dff;
  --vv-accent-2: #7fb2ff;
  --vv-accent-weak: rgba(77,141,255,.16);
  --vv-accent-line: rgba(77,141,255,.42);
  --vv-glass: rgba(19,20,27,.80);
  --vv-glass-2: rgba(18,19,26,.90);
  --vv-line: rgba(255,255,255,.10);
  --vv-line-2: rgba(255,255,255,.18);
  --vv-t1: #fff;
  --vv-t2: rgba(255,255,255,.66);
  --vv-t3: rgba(255,255,255,.42);
  --vv-r-lg: 22px;
  --vv-r-md: 14px;
  --vv-r-sm: 10px;
  --vv-ease: cubic-bezier(.32,.72,0,1);
  --vv-blur: 18px;
}
/* all: initial 把 box-sizing 打回 content-box，这里统一收口。
   max-width/max-height 必须一起清掉：站点几乎都会写 video{max-height:…}，
   而 max-* 不在我们显式声明的属性里，会原样漏进播放器（实测 max-height:38vh
   会把 360x520 的播放器视频压成 198px 高，下面留一大块黑）。 */
.vv-player-root *, .vv-panel-wrap *, .vv-badge *, .vv-share-wrap *,
.vv-toast *, .vv-save-seek * { box-sizing: border-box; max-width: none; max-height: none; }

/* ============================================================
   外部播放器浮层（.vv-share-*）
   ============================================================ */
.vv-share-wrap { position: fixed; left: 0; top: 0; width: 100%; height: 100%; z-index: 2147483647; background: rgba(8,8,12,.78); display: flex; align-items: flex-end; font-family: system-ui, -apple-system, sans-serif; }
.vv-share { width: 100%; max-height: 86%; overflow-y: auto; overscroll-behavior: contain; background: var(--vv-glass-2); border-top: 1px solid var(--vv-line-2); border-radius: var(--vv-r-lg) var(--vv-r-lg) 0 0; color: #e9eaee; padding: 18px 18px calc(env(safe-area-inset-bottom, 0px) + 18px); box-shadow: 0 -20px 48px rgba(0,0,0,.5); animation: vvSlideUp .22s var(--vv-ease); }
.vv-share-head { display: flex; align-items: center; margin-bottom: 10px; }
.vv-share-title { flex: 1; font-size: 17px; font-weight: 700; color: #fff; letter-spacing: .01em; }
.vv-share-x { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: 1px solid var(--vv-line); border-radius: 50%; background: rgba(255,255,255,.08); color: #cfd2dc; font-size: 13px; line-height: 1; transition: background .16s var(--vv-ease); }
.vv-share-x:active { background: rgba(255,255,255,.16); }
.vv-share-sub { font-size: 12px; line-height: 1.65; color: var(--vv-t2); margin-bottom: 12px; }
.vv-share-url { font-size: 11px; line-height: 1.55; color: rgba(255,255,255,.52); background: rgba(0,0,0,.30); border: 1px solid var(--vv-line); border-radius: var(--vv-r-md); padding: 10px 12px; word-break: break-all; margin-bottom: 12px; font-family: ui-monospace, Menlo, monospace; }
.vv-share-btns { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.vv-share-btn { flex: 1 1 46%; min-height: 44px; border: 1px solid var(--vv-line); border-radius: var(--vv-r-md); background: rgba(255,255,255,.07); color: #e9eaee; font-size: 13px; padding: 0 10px; transition: background .16s var(--vv-ease), transform .12s var(--vv-ease); }
.vv-share-btn:active { background: rgba(255,255,255,.13); transform: scale(.985); }
.vv-share-btn.primary { background: var(--vv-accent); border-color: transparent; font-weight: 600; box-shadow: 0 6px 18px rgba(77,141,255,.32); }
.vv-share-btn[disabled] { opacity: .5; }
.vv-share-log { font-size: 12px; line-height: 1.75; color: rgba(255,255,255,.58); background: rgba(0,0,0,.30); border: 1px solid var(--vv-line); border-radius: var(--vv-r-md); padding: 11px 12px; word-break: break-all; font-family: ui-monospace, Menlo, monospace; }
.vv-share-line { margin-bottom: 2px; }
.vv-share-verdict { margin-top: 9px; padding-top: 9px; border-top: 1px solid var(--vv-line); color: var(--vv-accent-2); font-weight: 600; font-family: system-ui, sans-serif; }

/* ============================================================
   悬浮角标
   ============================================================ */
.vv-badge { position: fixed; z-index: 2147483647; width: 46px; height: 46px; border-radius: 50%; background: linear-gradient(160deg, rgba(77,141,255,.96), rgba(96,68,230,.96)); border: 1px solid rgba(255,255,255,.20); box-shadow: 0 6px 18px rgba(61,125,255,.38), 0 2px 6px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.22); display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; transform: translateY(16px); transition: opacity .25s var(--vv-ease), transform .25s var(--vv-ease); touch-action: none; user-select: none; -webkit-user-select: none; }
.vv-badge.show { opacity: 1; transform: translateY(0); }
.vv-badge-num { position: absolute; top: -4px; right: -6px; min-width: 18px; height: 18px; line-height: 18px; text-align: center; border-radius: 9px; background: #ff4d4f; color: #fff; font-size: 11px; font-weight: 700; padding: 0 4px; box-sizing: content-box; font-family: system-ui, sans-serif; box-shadow: 0 1px 4px rgba(0,0,0,.35); }
.vv-badge-play { width: 0; height: 0; border-style: solid; border-width: 9px 0 9px 15px; border-color: transparent transparent transparent #fff; margin-left: 4px; }

/* ============================================================
   嗅探列表面板
   ============================================================ */
.vv-panel-wrap { position: fixed; left: 0; top: 0; width: 100%; height: 100%; z-index: 2147483647; background: rgba(8,9,13,.66); display: none; font-family: system-ui, -apple-system, sans-serif; }
.vv-panel-wrap.open { display: flex; flex-direction: column; justify-content: flex-end; }
.vv-panel { background: var(--vv-glass-2); border-top: 1px solid var(--vv-line-2); border-radius: var(--vv-r-lg) var(--vv-r-lg) 0 0; max-height: 72%; display: flex; flex-direction: column; color: #e9eaee; padding-bottom: env(safe-area-inset-bottom, 0px); box-shadow: 0 -20px 48px rgba(0,0,0,.5); animation: vvSlideUp .22s var(--vv-ease); }
@keyframes vvSlideUp { from { transform: translateY(40%); opacity: .4; } to { transform: translateY(0); opacity: 1; } }
.vv-head { display: flex; align-items: center; padding: 18px 16px 10px 20px; }
.vv-head-title { font-size: 17px; font-weight: 700; color: #fff; flex: 1; letter-spacing: .01em; }
.vv-head-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 30px; background: rgba(255,255,255,.08); border: 1px solid var(--vv-line); color: var(--vv-t2); font-size: 12px; padding: 5px 12px; border-radius: 15px; margin-left: 8px; font-family: inherit; transition: background .16s var(--vv-ease); }
.vv-head-btn:active { background: rgba(255,255,255,.16); }
.vv-list { overflow-y: auto; overscroll-behavior: contain; padding: 4px 12px 14px 12px; -webkit-overflow-scrolling: touch; }
.vv-row { display: flex; align-items: center; background: rgba(255,255,255,.05); border: 1px solid var(--vv-line); border-radius: var(--vv-r-md); padding: 12px; margin-bottom: 8px; transition: background .16s var(--vv-ease), transform .12s var(--vv-ease); }
.vv-row:active { background: rgba(255,255,255,.08); }
.vv-row-info { flex: 1; min-width: 0; }
.vv-row-name { font-size: 13.5px; color: #fff; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vv-row-sub { font-size: 11px; color: var(--vv-t3); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vv-row-tags { margin-top: 6px; display: flex; align-items: center; }
/* 标签改成"淡色底 + 亮色字"：饱和实底在深色面板里亮度太高，一行三个会把视线全抢走 */
.vv-tag { font-size: 10px; font-weight: 700; color: #fff; border-radius: 6px; padding: 2px 7px; margin-right: 6px; font-family: system-ui, sans-serif; letter-spacing: .02em; }
.vv-tag.HLS { background: rgba(255,125,41,.18); color: #ffab6b; }
.vv-tag.MP4, .vv-tag.M4V, .vv-tag.MOV { background: rgba(77,141,255,.18); color: #9cc2ff; }
.vv-tag.WEBM, .vv-tag.MKV, .vv-tag.FLV, .vv-tag.AVI, .vv-tag.WMV { background: rgba(18,183,106,.18); color: #5ddc9b; }
.vv-tag.AUDIO { background: rgba(180,84,255,.18); color: #c69bff; }
.vv-tag.BLOB { background: rgba(255,255,255,.10); color: var(--vv-t2); }
.vv-row-acts { display: flex; align-items: center; margin-left: 10px; }
.vv-btn-play { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; border: none; background: var(--vv-accent); color: #fff; font-size: 15px; margin-left: 6px; font-family: inherit; box-shadow: 0 6px 16px rgba(77,141,255,.34); transition: transform .12s var(--vv-ease), background .16s var(--vv-ease); }
.vv-btn-play:active { transform: scale(.92); background: #3f7ef0; }
.vv-btn-mini { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--vv-line); background: rgba(255,255,255,.07); color: var(--vv-t2); font-size: 13px; margin-left: 6px; font-family: inherit; transition: background .16s var(--vv-ease), transform .12s var(--vv-ease); }
.vv-btn-mini:active { background: rgba(255,255,255,.14); transform: scale(.92); }
.vv-empty { text-align: center; color: var(--vv-t3); padding: 46px 20px; font-size: 13px; }
.vv-prefix-note { padding: 8px 20px 6px; font-size: 11px; color: var(--vv-t3); }

/* ============================================================
   轻提示
   ============================================================ */
.vv-toast { position: fixed; left: 50%; bottom: 14%; transform: translateX(-50%); background: rgba(24,25,32,.94); border: 1px solid var(--vv-line); color: #fff; padding: 11px 18px; border-radius: 22px; font-size: 13px; z-index: 2147483647; opacity: 0; transition: opacity .25s var(--vv-ease); pointer-events: none; max-width: 82vw; font-family: system-ui, sans-serif; box-shadow: 0 8px 24px rgba(0,0,0,.42); }
.vv-toast.show { opacity: 1; }
.vv-save-seek { position: fixed; left: 50%; bottom: 8%; transform: translateX(-50%); background: rgba(24,25,32,.95); color: #fff; padding: 10px 14px; border-radius: 14px; font-size: 13px; z-index: 2147483647; display: flex; align-items: center; font-family: system-ui, sans-serif; box-shadow: 0 4px 18px rgba(0,0,0,.4); }
.vv-save-seek button { margin-left: 12px; border: none; background: rgba(255,255,255,.14); color: #fff; padding: 7px 12px; border-radius: 12px; font-size: 12px; font-family: inherit; }
.vv-save-seek button.primary { background: var(--vv-accent); }

/* ============================================================
   播放器外壳
   ============================================================ */
.vv-player-root { position: fixed; left: 0; top: 0; width: 100%; height: 100vh; height: 100dvh; z-index: 2147483647; background: #000; color: #fff; font-family: system-ui, -apple-system, sans-serif; touch-action: none; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; }
/* all: initial：连站点的 video{display/position/filter/transform} 一起清掉，
   否则站点给 video 加的圆角、滤镜、内边距都会渗进来 */
.vv-player-video { all: initial; display: block; width: 100%; height: 100%; max-width: none; max-height: none; object-fit: contain; background: #000; }
.vv-bright { position: absolute; inset: 0; background: #000; opacity: 0; pointer-events: none; z-index: 140; }

/* ---- 控制栏 ---- */
.vv-cs-top { position: absolute; left: 0; top: 0; width: 100%; z-index: 200; display: flex; align-items: center; gap: 4px;
  padding: calc(env(safe-area-inset-top, 0px) + 6px) calc(env(safe-area-inset-right, 0px) + 8px) 34px calc(env(safe-area-inset-left, 0px) + 8px);
  opacity: 0; pointer-events: none; transition: opacity .22s var(--vv-ease);
  background: linear-gradient(180deg, rgba(0,0,0,.68), rgba(0,0,0,.28) 58%, transparent); }
.vv-cs-bottom { position: absolute; left: 0; bottom: 0; width: 100%; z-index: 200;
  padding: 30px calc(env(safe-area-inset-right, 0px) + 10px) calc(env(safe-area-inset-bottom, 0px) + 6px) calc(env(safe-area-inset-left, 0px) + 10px);
  opacity: 0; pointer-events: none; transition: opacity .22s var(--vv-ease);
  background: linear-gradient(0deg, rgba(0,0,0,.78), rgba(0,0,0,.30) 56%, transparent); }
.vv-player-root.cs-on .vv-cs-top,
.vv-player-root.cs-on .vv-cs-bottom,
.vv-player-root.cs-on .vv-center-play { opacity: 1; pointer-events: auto; }

/* 顶栏右侧三个次要操作收进一枚玻璃胶囊：既归组，又不和标题抢注意力 */
.vv-top-acts { display: flex; align-items: center; gap: 2px; height: 36px; padding: 0 4px; border-radius: 999px; background: rgba(255,255,255,.08); border: 1px solid var(--vv-line); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
.vv-top-acts .vv-csbtn { min-width: 34px; height: 32px; padding: 0 4px; border-radius: 999px; }

.vv-title { color: #fff; font-size: 15px; font-weight: 600; letter-spacing: .01em; line-height: 1.3; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0 6px; text-shadow: 0 1px 6px rgba(0,0,0,.5); }

/* ---- 通用图标按钮 ---- */
.vv-csbtn { display: inline-flex; align-items: center; justify-content: center; min-width: 40px; height: 40px; padding: 0 6px; border: none; border-radius: 12px; background: transparent; color: #fff; font: inherit; font-size: 12.5px; line-height: 1; -webkit-tap-highlight-color: transparent; transition: background .16s var(--vv-ease), transform .16s var(--vv-ease), opacity .16s; }
.vv-csbtn:active { background: rgba(255,255,255,.12); transform: scale(.94); }
.vv-csbtn:focus-visible { outline: 2px solid var(--vv-accent); outline-offset: 2px; }
.vv-ico { display: block; flex: 0 0 auto; }

/* ---- 底部动作行 ---- */
.vv-act-row { display: flex; align-items: center; margin-top: 2px; gap: 4px; }
.vv-spacer { flex: 1; }
#vv-play-btn { width: 44px; height: 44px; border-radius: 14px; }
.vv-next-btn { gap: 4px; color: #fff; }
.vv-next-t { margin-left: 2px; font-size: 12px; white-space: nowrap; }

/* 胶囊 chip：只表达一件事，非默认值才变蓝 */
.vv-chip { display: inline-flex; align-items: center; justify-content: center; min-width: 52px; height: 30px; padding: 0 12px; border-radius: 999px;
  border: 1px solid var(--vv-line); background: rgba(255,255,255,.08); color: var(--vv-t1); font-size: 12px; font-weight: 600; letter-spacing: .01em;
  transition: background .18s var(--vv-ease), border-color .18s var(--vv-ease), color .18s var(--vv-ease); }
.vv-chip.on { background: var(--vv-accent-weak); border-color: var(--vv-accent-line); color: var(--vv-accent-2); }
/* 顺序很重要：同特异性，靠后覆盖 */
.vv-chip--q { display: none; }
.vv-chip--q.show { display: inline-flex; }

/* ---- 进度条 ---- */
.vv-prog-row { display: flex; align-items: center; }
.vv-time { color: var(--vv-t2); font-size: 11.5px; min-width: 38px; font-variant-numeric: tabular-nums; white-space: nowrap; letter-spacing: .01em; }
#vv-cur { text-align: left; }
#vv-dur { text-align: right; }
.vv-prog { position: relative; flex: 1; height: 34px; margin: 0 8px; touch-action: none; }
.vv-prog-track, .vv-prog-buf, .vv-prog-cur { position: absolute; left: 0; top: 50%; height: 3px; margin-top: -1.5px; border-radius: 3px; transition: height .14s var(--vv-ease), margin-top .14s var(--vv-ease); }
.vv-prog-track { right: 0; background: rgba(255,255,255,.18); }
.vv-prog-buf { width: 0; background: rgba(255,255,255,.26); }
/* 已播放段用纯白而不是品牌蓝：任何一段视频背景下都能读，蓝色留给"激活态" */
.vv-prog-cur { width: 0; background: #fff; }
.vv-prog-dot { position: absolute; top: 50%; left: 0; width: 13px; height: 13px; margin: -6.5px 0 0 -6.5px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 1px rgba(0,0,0,.16), 0 2px 8px rgba(0,0,0,.55); transition: width .14s var(--vv-ease), height .14s var(--vv-ease), margin .14s var(--vv-ease); }
.vv-prog.dragging .vv-prog-track,
.vv-prog.dragging .vv-prog-buf,
.vv-prog.dragging .vv-prog-cur { height: 5px; margin-top: -2.5px; }
.vv-prog.dragging .vv-prog-dot { width: 15px; height: 15px; margin: -7.5px 0 0 -7.5px; }

/* ---- 手势/拖动提示 ---- */
.vv-seek-tip { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 220; opacity: 0; pointer-events: none;
  padding: 7px 13px; border-radius: var(--vv-r-sm); background: rgba(16,17,23,.82); border: 1px solid var(--vv-line); color: #fff;
  font-size: 12.5px; font-variant-numeric: tabular-nums; white-space: nowrap; transition: opacity .14s var(--vv-ease); }
/* 拖进度条时吸附在拇指上方，而不是浮在画面中央 */
.vv-seek-tip.scrub { top: auto; bottom: calc(env(safe-area-inset-bottom, 0px) + 96px); transform: translateX(-50%); padding: 6px 11px; font-size: 12px; font-weight: 600; box-shadow: 0 8px 22px rgba(0,0,0,.45); }
.vv-seek-tip.scrub::after { content: ''; position: absolute; left: 50%; bottom: -3.5px; width: 7px; height: 7px; margin-left: -3.5px; transform: rotate(45deg); background: inherit; border-right: 1px solid var(--vv-line); border-bottom: 1px solid var(--vv-line); }
.vv-seek-tip.on, .vv-ges-tip.on { opacity: 1; }
.vv-ges-tip { position: absolute; top: 10%; left: 50%; transform: translateX(-50%); z-index: 220; opacity: 0; pointer-events: none;
  padding: 7px 14px; border-radius: 999px; background: rgba(16,17,23,.74); border: 1px solid var(--vv-line); color: #fff;
  font-size: 12.5px; font-variant-numeric: tabular-nums; transition: opacity .16s var(--vv-ease); }

/* ---- 中央播放键：不用 backdrop-filter，72px 的模糊圆会把画面正中抹成一团脏斑 ---- */
.vv-center-play { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center;
  width: 72px; height: 72px; padding: 0; border-radius: 50%; border: 1px solid rgba(255,255,255,.16); background: rgba(0,0,0,.42); color: #fff;
  z-index: 180; opacity: 0; pointer-events: none;
  box-shadow: 0 10px 30px rgba(0,0,0,.4);
  transition: opacity .22s var(--vv-ease), transform .12s var(--vv-ease), background .16s var(--vv-ease); }
.vv-center-play:active { transform: translate(-50%, -50%) scale(.94); }
.vv-center-play svg { margin-left: 2px; }
/* 播放中的暂停态不需要那个光学偏移 */
.vv-center-play.pause svg { margin-left: 0; }

/* ============================================================
   加载
   ============================================================ */
.vv-loading { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display: none; flex-direction: column; align-items: center; gap: 9px;
  z-index: 185; pointer-events: none; min-width: 148px; max-width: 78vw; padding: 20px 24px 18px; border-radius: var(--vv-r-lg);
  background: var(--vv-glass); border: 1px solid var(--vv-line); color: #fff;
  box-shadow: 0 18px 44px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.06);
  backdrop-filter: blur(var(--vv-blur)); -webkit-backdrop-filter: blur(var(--vv-blur)); }
.vv-loading.on { display: flex; }
.vv-loading.indet .vv-lr-svg { opacity: .9; }
/* 这个类以前完全没有样式，导致"缓冲中…"和明细行挤在一起没有层级 */
.vv-load-text { font-size: 12.5px; font-weight: 600; letter-spacing: .01em; color: #fff; }
.vv-load-detail { font-size: 11.5px; color: rgba(255,255,255,.5); line-height: 1.45; max-width: 190px; text-align: center; font-variant-numeric: tabular-nums; }
.vv-load-detail:empty { display: none; }
/* 环形几何（viewBox 58 / r=19 / 周长 119.4）属于契约，一律不改；
   这里只把渲染尺寸放大到 64px —— 58px 时内径只有 35px，"46%" 这种三位数会贴到描边上。
   放大用外框尺寸实现，SVG 内部坐标与 dasharray 都不受影响。 */
.vv-lr { position: relative; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; }
.vv-lr-svg { width: 64px; height: 64px; transform: rotate(-90deg); }
.vv-lr-bg { fill: none; stroke: rgba(255,255,255,.16); stroke-width: 3; }
.vv-lr-fg { fill: none; stroke: #fff; stroke-width: 3; stroke-linecap: round; stroke-dasharray: 119.4; stroke-dashoffset: 119.4; transition: stroke-dashoffset .25s linear; }
.vv-lr-num { position: absolute; font-size: 12px; font-weight: 700; letter-spacing: -.02em; font-variant-numeric: tabular-nums; font-family: system-ui, sans-serif; }
.vv-loading.indet .vv-lr-fg { stroke-dasharray: 26 119.4; animation: vv-lr-spin 1.05s linear infinite; transition: none; transform-box: view-box; transform-origin: 50% 50%; }
@keyframes vv-lr-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* ---- 顶部细进度条 ---- */
.vv-loadbar { position: absolute; left: 0; right: 0; top: 0; height: 2px; background: rgba(255,255,255,.10); opacity: 0; transition: opacity .2s; z-index: 205; pointer-events: none; overflow: hidden; }
.vv-loadbar.on { opacity: 1; }
.vv-loadbar-fill { height: 100%; width: 0; background: linear-gradient(90deg, var(--vv-accent), var(--vv-accent-2)); transition: width .25s linear; }
.vv-loadbar.indet .vv-loadbar-fill { width: 38%; animation: vv-lb-slide 1.05s ease-in-out infinite; }
@keyframes vv-lb-slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }

/* ============================================================
   起播失败卡片
   ============================================================ */
.vv-err { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display: none; flex-direction: column; align-items: center; gap: 9px;
  color: #fff; font-size: 13px; z-index: 190; width: 78vw; max-width: 300px; padding: 22px 20px 16px; border-radius: var(--vv-r-lg);
  background: var(--vv-glass-2); border: 1px solid var(--vv-line); text-align: center;
  box-shadow: 0 20px 50px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.06);
  backdrop-filter: blur(var(--vv-blur)); -webkit-backdrop-filter: blur(var(--vv-blur)); }
.vv-err.on { display: flex; }
.vv-err-ico { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; margin-bottom: 2px; border-radius: 50%; border: 1px solid rgba(255,90,90,.28); background: rgba(255,90,90,.14); color: #ff8a8a; font-size: 20px; font-weight: 700; }
.vv-err-t { font-size: 15px; font-weight: 600; letter-spacing: .01em; }
.vv-err-m { font-size: 12.5px; color: var(--vv-t2); line-height: 1.6; word-break: break-word; }
.vv-err-btns { display: flex; gap: 8px; margin-top: 10px; flex-wrap: nowrap; justify-content: center; }
.vv-err-btn { height: 36px; padding: 0 14px; border: 1px solid var(--vv-line); border-radius: 999px; background: rgba(255,255,255,.09); color: #fff; font-size: 12.5px; font-weight: 600; font-family: inherit; white-space: nowrap; flex: 0 0 auto; transition: background .16s var(--vv-ease), transform .12s var(--vv-ease); }
.vv-err-btn:active { background: rgba(255,255,255,.16); transform: scale(.96); }
.vv-err-btn.primary { background: var(--vv-accent); border-color: transparent; box-shadow: 0 6px 18px rgba(77,141,255,.32); }
/* 加载中隐藏中央播放按钮，否则会压在环形进度圈上 */
.vv-player-root.vv-loading-on .vv-center-play { opacity: 0; pointer-events: none; }

/* ============================================================
   底部菜单
   ============================================================ */
.vv-sheet { position: absolute; left: 0; bottom: 0; width: 100%; z-index: 320; display: none;
  max-height: 62vh; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch;
  padding: 0 0 calc(env(safe-area-inset-bottom, 0px) + 10px);
  border-radius: var(--vv-r-lg) var(--vv-r-lg) 0 0; border-top: 1px solid var(--vv-line-2);
  background: var(--vv-glass-2); color: #e9eaee; font-size: 14px;
  box-shadow: 0 -20px 48px rgba(0,0,0,.48);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
.vv-sheet.open { display: block; animation: vvSheetIn .24s var(--vv-ease); }
@keyframes vvSheetIn { from { transform: translateY(16px); opacity: 0; } to { transform: none; opacity: 1; } }
/* 拖拽把手 */
.vv-sheet::before { content: ''; display: block; width: 36px; height: 4px; margin: 8px auto 2px; border-radius: 2px; background: rgba(255,255,255,.22); }
.vv-sheet-group { padding: 14px 20px 6px; font-size: 11px; font-weight: 600; letter-spacing: .08em; color: var(--vv-t3); }
.vv-sheet-item { display: flex; align-items: center; gap: 12px; min-height: 50px; padding: 10px 18px; margin: 0 6px; border-radius: var(--vv-r-md); transition: background .16s var(--vv-ease); }
.vv-sheet-item:active { background: rgba(255,255,255,.07); }
.vv-sheet-item.on { color: var(--vv-accent-2); font-weight: 600; }
.vv-sheet-item.off { opacity: .42; pointer-events: none; }
.vv-sheet-ico { display: flex; flex: 0 0 18px; width: 18px; justify-content: center; color: var(--vv-t2); }
.vv-sheet-item.on .vv-sheet-ico { color: var(--vv-accent); }
.vv-sheet-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.vv-sheet-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vv-sheet-sub { margin-top: 3px; font-size: 11px; font-weight: 400; color: var(--vv-t3); }
.vv-sheet-check { display: flex; flex: 0 0 auto; color: var(--vv-accent); }
.vv-switch { position: relative; flex: 0 0 auto; width: 38px; height: 22px; border-radius: 11px; background: rgba(255,255,255,.16); transition: background .18s var(--vv-ease); }
.vv-switch::after { content: ''; position: absolute; left: 2px; top: 2px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .18s var(--vv-ease); }
.vv-sheet-item.on .vv-switch { background: var(--vv-accent); }
.vv-sheet-item.on .vv-switch::after { transform: translateX(16px); }

/* ============================================================
   锁屏
   ============================================================ */
.vv-lockmark { position: absolute; right: 12px; top: 14%; display: none; align-items: center; justify-content: center;
  width: 40px; height: 40px; padding: 0; border-radius: 50%; border: 1px solid var(--vv-line-2); background: rgba(0,0,0,.42); color: #fff;
  z-index: 210; font-size: 17px; opacity: 0; pointer-events: none; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  transition: opacity .2s var(--vv-ease), background .16s var(--vv-ease); }
/* 控制栏可见时不再额外浮一枚锁：底栏已经有锁按钮，两个锁只会让人分不清点哪个。
   锁定后控制栏整体隐藏，这枚浮动锁是唯一的解锁入口，所以 locked 态必须保留 display:flex。 */
.vv-player-root.locked .vv-lockmark { display: flex; opacity: .92; pointer-events: auto; }
.vv-player-root.locked .vv-cs-top,
.vv-player-root.locked .vv-cs-bottom,
.vv-player-root.locked .vv-center-play { opacity: 0 !important; pointer-events: none !important; }

/* ============================================================
   短屏 / 横屏适配
   ============================================================ */
@media (max-height: 480px) {
  .vv-cs-top { padding-bottom: 20px; }
  .vv-cs-bottom { padding-top: 18px; }
  .vv-csbtn { min-width: 36px; height: 36px; border-radius: 10px; }
  #vv-play-btn { width: 38px; height: 38px; border-radius: 12px; }
  .vv-prog { height: 28px; }
  .vv-center-play { width: 60px; height: 60px; }
  .vv-loading { padding: 16px 20px 14px; gap: 7px; }
  .vv-sheet { max-height: 80vh; }
  .vv-sheet-item { min-height: 44px; padding: 8px 16px; font-size: 13.5px; }
  .vv-seek-tip.scrub { bottom: calc(env(safe-area-inset-bottom, 0px) + 74px); }
}
@media (orientation: landscape) and (max-height: 480px) {
  .vv-cs-bottom { padding-left: calc(env(safe-area-inset-left, 0px) + 20px); padding-right: calc(env(safe-area-inset-right, 0px) + 20px); }
}
@media (prefers-reduced-motion: reduce) {
  /* 只关装饰动画；vv-lr-spin / vv-lb-slide 承载"还在动"的信息，不能停 */
  .vv-sheet.open, .vv-panel, .vv-share { animation: none; }
  .vv-csbtn, .vv-chip, .vv-sheet-item, .vv-prog-dot,
  .vv-prog-track, .vv-prog-buf, .vv-prog-cur, .vv-center-play { transition-duration: .001ms; }
}
`;
