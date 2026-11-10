import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

let code = await readFile('dist/via-video-player.user.js', 'utf8');
const endMark = '})();';
const last = code.lastIndexOf(endMark);
const probe = 'window.__vvTest={resolve:vvResolve,scan:vvScanText,scanPerf:vvScanPerf,noteHlsBody:vvNoteHlsBody,hlsConfig:vvHlsConfig,hlsSeekMode:vvHlsSetSeekMode,levelLabel:vvLevelLabel,audioLabel:vvAudioLabel,push:vvPushItem,VV:VV,pageFs:vvPageFsState,pageFsSet:vvPageFsSet,pageFsToggle:vvTogglePageFullscreen,pageFsVideo:vvPageFsVideo,pageFsPick:vvPageFsPick,pageFsDiag:vvPageFsDiag,pageFsDiagnose:vvPageFsDiagnose,pageFsTick:vvPageFsTick,pageFsBtn:vvPageFsSyncBtn,epNum:vvEpNum,epTemplate:vvEpTemplate,epScan:vvEpisodesScan,epDiag:vvEpisodesDiag,epPickGroup:vvEpPickGroup,epCurrent:vvEpCurrent,icons:VV_ICONS,setFs:function(v){document.fullscreenElement=v;},itemRank:vvItemRank,looksAudio:vvLooksLikeAudioHls,videoKey:vvVideoKey,shortName:vvShortName,seekTo:vvSeekTo,setVid:function(v){VID=v;},getVid:function(){return VID;},buildM3U:vvBuildM3U,buildCmd:vvBuildCmd,judgeProbe:vvJudgeProbe,shareName:vvShareName,buildIntent:vvBuildIntent,playersRead:vvPlayersRead,playersWrite:vvPlayersWrite,playersUnregister:vvPlayersUnregister,playersCount:vvPlayersCount,playersOwner:vvPlayersOwner,leaseId:vvLeaseId,setPageId:function(id){VV._pageId=id;},hibernateMedia:vvHibernateMedia,thawMedia:vvThawMedia,installSrcGuard:vvInstallSrcGuard,hardTeardown:vvHardTeardown,cfg:function(){return VV.cfg;},setCfg:function(k,v){VV.cfg[k]=v;},enterBg:vvEnterBackground,leaveBg:vvLeaveBackground,tabHidden:vvTabHidden,tick:vvVisibilityTick,requestPeer:vvRequestPeerRelease,peerSeen:vvPeerReleaseSeen,releaseDecoder:vvReleaseDecoder,deepHib:vvDeepHibernateBlob,rescue:vvCodecRescue,resumeTarget:vvResumeTarget,saveNow:vvSaveNow,progMap:vvGetProgressMap,resumePageMedia:vvResumePageMedia,releaseAllMedia:vvReleaseAllMedia,pausePageMedia:vvPausePageMedia,setActive:function(a){VV.active=a;},setPlayerActive:function(v){VV.playerActive=v;},mediaPipelines:vvMediaPipelineCount,sweep:vvBackgroundSweep,gateActive:vvGateActive,detachMedia:vvDetachMedia,attachMedia:vvAttachMedia,restoreAudio:vvRestoreAudio,origMuted:vvOrigMuted,restorePageAudio:vvRestorePageAudio,restorePlayerAudio:vvRestorePlayerAudio,hardRelease:vvHardReleaseVideo,setBg:function(v){VV._bg=v;},setFocusEver:function(v){VV._focusEverTrue=v;},announceFront:vvAnnounceFront,peerFrontSeen:vvPeerFrontSeen,focusLostLong:vvFocusLostLong,announceFrontRaw:function(id,ts){try{localStorage.setItem("vvs:front:"+id,JSON.stringify({ts:ts}));}catch(e){}},clearFront:function(){try{var d=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf("vvs:front:")===0)d.push(k);}for(var j=0;j<d.length;j++)localStorage.removeItem(d[j]);}catch(e){}},hasPriorityOverlay:vvHasPriorityOverlay,mini:vvMiniWindow,pip:vvTryPip,setRoot:function(r){ROOT=r;},setMini:function(v){VV._mini=v;},resetTeardown:function(){_vvTornDown=false;_vvReleasedOnce=false;},lowFxSync:vvSyncLowFx,lowFxToggle:vvToggleLowFx,setCurTime:vvSetCurTime,setCurTimeEl:function(e){CSTIME=e;},setBarPct:vvSetBarPct,getDurEl:function(){return DUREL;},apState:function(){try{return {blocked:VV_AP.blocked,hooked:VV_AP.hooked,allow:vvApCfgOn()};}catch(e){return null;}},apTame:vvApTamePreload,apRestore:vvApRestorePreload,apAllowNext:vvApAllowNext,stopPagePreload:vvStopPagePreload,restorePagePreload:vvRestorePagePreload,preHeldLen:function(){return VV_PRELOAD_HELD.length;},setGesture:function(ts){VV_AP.lastGesture=ts;}};})();\n';
const test = code.slice(0, last) + probe;

const elStub = () => ({
    style: {},
    setAttribute() {}, getAttribute() { return null; },
    addEventListener() {}, removeEventListener() {},
    classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} },
    appendChild() {}, removeChild() {}, remove() {},
    querySelector() { return elStub(); },
    querySelectorAll() { return []; },
    getBoundingClientRect() { return { left: 0, width: 100, top: 0, height: 100 }; },
    set innerHTML(v) { this._html = v; },
    get innerHTML() { return this._html || ''; },
    offsetWidth: 46
});

const documentStub = {
    readyState: 'loading',
    // 前后台判定要看这两个字段。默认"可见"：绝大多数用例都是前台场景，
    // 需要模拟切走的用例自己把 hidden 置 true（见"硬证据"那一组）。
    hidden: false,
    visibilityState: 'visible',
    addEventListener() {},
    createElement() { return elStub(); },
    createDocumentFragment() { return { appendChild() {} }; },
    querySelectorAll() { return []; },
    getElementById() { return null; },
    documentElement: Object.assign(elStub(), { style: {} }),
    body: Object.assign(elStub(), { style: {} })
};

const winStub = {};
winStub.self = winStub;
winStub.top = winStub;
winStub.window = winStub;
winStub.parent = winStub;
winStub.location = { protocol: 'https:', hostname: 'example.com', href: 'https://example.com/a/page1', origin: 'https://example.com' };
winStub.document = documentStub;
winStub.navigator = {};
winStub.performance = { getEntriesByType() { return []; } };
winStub.localStorage = {
    _m: {},
    getItem(k) { return k in this._m ? this._m[k] : null; },
    setItem(k, v) { this._m[k] = String(v); },
    removeItem(k) { delete this._m[k]; },
    key(i) { const ks = Object.keys(this._m); return i >= 0 && i < ks.length ? ks[i] : null; },
    get length() { return Object.keys(this._m).length; }
};
// media 原型：srcGuard 包的是 HTMLMediaElement.prototype.src 的 setter，
// 沙箱里没有这个构造器的话，门禁装不上，测了也等于没测。
winStub.HTMLMediaElement = class HTMLMediaElementStub {
    constructor() { this._src = ''; this._attrs = {}; this.played = 0; this.pausedCount = 0; this.nodeName = 'VIDEO'; }
    get src() { return this._src; }
    set src(v) { this._src = String(v == null ? '' : v); }
    getAttribute(k) { return this._attrs[k] === undefined ? null : this._attrs[k]; }
    setAttribute(k, v) { this._attrs[k] = String(v); }
    removeAttribute(k) { delete this._attrs[k]; }
    load() {}
    pause() { this.pausedCount++; }
    play() { this.played++; return Promise.resolve(); }
};
winStub.HTMLSourceElement = class HTMLSourceElementStub {
    constructor() { this._src = ''; }
    get src() { return this._src; }
    set src(v) { this._src = String(v == null ? '' : v); }
};
winStub.Element = class ElementStub { setAttribute() {} getAttribute() { return null; } };
winStub.alert = function () {};
winStub.addEventListener = function () {};
winStub.innerWidth = 400;
winStub.innerHeight = 800;
winStub.XMLHttpRequest = function () {};
winStub.XMLHttpRequest.prototype = { open() {}, send() {}, addEventListener() {}, getResponseHeader() { return ''; }, responseType: '' };
winStub.screen = { orientation: {} };
winStub.history = {};
winStub.setTimeout = setTimeout;
winStub.clearTimeout = clearTimeout;
winStub.setInterval = setInterval;
winStub.clearInterval = clearInterval;
winStub.requestAnimationFrame = (f) => setTimeout(f, 0);
winStub.Image = function () {};
winStub.FileReader = function () {};
winStub.Blob = function () {};
winStub.URL = URL;
winStub.URLSearchParams = URLSearchParams;

const sandbox = Object.assign(Object.create(null), winStub);
sandbox.window = winStub;
sandbox.globalThis = sandbox;
sandbox.console = console;

vm.runInNewContext(test, sandbox, { filename: 'via-video-player.user.js' });

const T = sandbox.window.__vvTest;
let pass = 0, fail = 0;
function eq(name, actual, expect) {
    const ok = JSON.stringify(actual) === JSON.stringify(expect);
    if (ok) { pass++; console.log('ok  -', name); }
    else { fail++; console.log('FAIL -', name, 'got:', JSON.stringify(actual), 'want:', JSON.stringify(expect)); }
}

eq('mp4', T.resolve('https://cdn.a.com/v/movie.mp4')?.type, 'MP4');
eq('m3u8', T.resolve('https://a.com/index.m3u8?token=abc')?.type, 'HLS');
eq('blob', T.resolve('blob:https://a.com/uuid')?.type, 'BLOB');
eq('ct-hls', T.resolve('https://a.com/plain/name', 'application/vnd.apple.mpegurl')?.type, 'HLS');
eq('ct-video', T.resolve('https://a.com/plain/name', 'video/mp4')?.type, 'MP4');
eq('reject page', T.resolve('https://a.com/watch/123'), null);
eq('reject img', T.resolve('https://a.com/logo.png'), null);
eq('dot m3u8 name', T.resolve('https://a.com/v/tears-of-steel.ism/.m3u8', 'application/vnd.apple.mpegurl')?.name, 'tears-of-steel');

T.VV.items.length = 0;
T.scan('var s="https://cdn.b.com/hls/01.m3u8"; also https://x.com/a.mp4 and https://x.com/pic.png', null);
eq('scan hls', T.VV.items.some(i => i.type === 'HLS'), true);
eq('scan mp4', T.VV.items.some(i => i.type === 'MP4'), true);
eq('scan noise', T.VV.items.some(i => i.url.includes('pic.png')), false);

const url1 = 'https://c.com/v/a.mp4';
eq('push once', T.push({ url: url1, type: 'MP4', name: 'a' }), true);
eq('push dedup', T.push({ url: url1, type: 'MP4', name: 'a' }), false);

// 资源计时嗅探：模拟脚本注入前/页面自身已加载的媒体资源
T.VV.items.length = 0;
T.VV.seen = {};
T.VV.cfg.siteOff = false;
sandbox.window.performance.getEntriesByType = () => [
    { name: 'https://cdn.d.com/preload/master.m3u8' },
    { name: 'https://cdn.d.com/preload/clip.mp4?x=1' },
    { name: 'https://cdn.d.com/preload/pic.jpg' }
];
eq('perf scan count', T.scanPerf(), 2);
eq('perf hls', T.VV.items.some(i => i.url.includes('master.m3u8')), true);
eq('perf mp4', T.VV.items.some(i => i.url.includes('clip.mp4')), true);
eq('perf dedup', T.scanPerf(), 0);

// m3u8 主清单：子清单/音轨清单不单独刷屏
T.VV.items.length = 0;
T.VV.seen = {};
T.VV.hlsMasters = {};
T.VV.hlsVariants = {};
T.VV.hlsRoots = {};
T.push({ url: 'https://e.com/master.m3u8', type: 'HLS', name: 'master' });
T.push({ url: 'https://e.com/720.m3u8', type: 'HLS', name: '720' });
T.push({ url: 'https://e.com/audio.m3u8', type: 'HLS', name: 'audio' });
T.noteHlsBody({ url: 'https://e.com/master.m3u8', type: 'HLS' },
    '#EXTM3U\n#EXT-X-MEDIA:TYPE=AUDIO,URI="audio.m3u8"\n#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=1280x720\n720.m3u8\n',
    'https://e.com/master.m3u8');
eq('hls master marked', T.VV.hlsMasters['https://e.com/master.m3u8'], true);
eq('hls variant dropped', T.VV.items.some(i => i.url === 'https://e.com/720.m3u8'), false);
eq('hls audio dropped', T.VV.items.some(i => i.url === 'https://e.com/audio.m3u8'), false);
eq('hls master kept', T.VV.items.some(i => i.url === 'https://e.com/master.m3u8'), true);

// fMP4 分片不能当成独立 mp4；只有位于已知 m3u8 目录下才算分片
eq('hls segment dropped', T.push({ url: 'https://e.com/v2/main.mp4', type: 'MP4', name: 'main' }), false);
eq('hls segment absent', T.VV.items.some(i => i.url.includes('/v2/main.mp4')), false);
eq('plain mp4 kept', T.push({ url: 'https://g.com/movie.mp4', type: 'MP4', name: 'movie' }), true);
eq('seg name without root kept', T.push({ url: 'https://h.com/main.mp4', type: 'MP4', name: 'main' }), true);

// ===== 列表排序：不能靠"到达顺序"决定第一条（真实站点实测暴露的问题） =====
// 多码率站点一次会吐出 /asp/hls/（视频）、/asp/hlsaudio/（音轨）、/asp/audio/…/mp3/（音频）
// 和一条 blob:，抓取顺序随机；若按到达顺序 unshift，用户点第一条就可能黑屏。
eq('rank mp4 最靠前', T.itemRank({ type: 'MP4', url: 'https://a.com/v.mp4' }) < T.itemRank({ type: 'HLS', url: 'https://a.com/main.m3u8' }), true);
eq('rank 视频 m3u8 早于音轨', T.itemRank({ type: 'HLS', url: 'https://a.com/hls/main.m3u8' }) < T.itemRank({ type: 'HLS', url: 'https://a.com/hlsaudio/main.m3u8' }), true);
eq('rank blob 最后', T.itemRank({ type: 'BLOB', url: 'blob:https://a.com/x' }) > T.itemRank({ type: 'AUDIO', url: 'https://a.com/a.mp3' }), true);

eq('音轨判定 hlsaudio', T.looksAudio('https://a.com/asp/hlsaudio/hls/main/030/main.m3u8'), true);
eq('音轨判定 audio 目录', T.looksAudio('https://a.com/asp/audio/7/3/8/e/mp3/main.m3u8'), true);
eq('视频清单不误判', T.looksAudio('https://a.com/asp/hls/main/030/main.m3u8'), false);
eq('加密视频清单不误判', T.looksAudio('https://a.com/asp/enc/hls/main/030/main.m3u8'), false);
eq('非 m3u8 不判音轨', T.looksAudio('https://a.com/audio.mp4'), false);

// 乱序推入后，第一条必须是可播的视频清单
T.VV.items.length = 0;
T.VV.seen = {};
T.VV.hlsMasters = {}; T.VV.hlsVariants = {}; T.VV.hlsRoots = {}; T.VV.hlsMasterRoots = {};
T.push({ url: 'blob:https://tv.example.com/aaaa', type: 'BLOB', name: '' });
T.push({ url: 'https://cdn.example.com/asp/hlsaudio/hls/main/0303000a/main.m3u8', type: 'HLS', name: 'main' });
T.push({ url: 'https://cdn.example.com/asp/hls/main/0303000a/main.m3u8', type: 'HLS', name: 'main' });
T.push({ url: 'https://cdn.example.com/movie.mp4', type: 'MP4', name: 'movie' });
eq('排序后首条是 mp4', T.VV.items[0].type, 'MP4');
eq('音轨不在前两位', T.VV.items.slice(0, 2).some(i => i.url.indexOf('hlsaudio') >= 0), false);
eq('blob 排最后', T.VV.items[T.VV.items.length - 1].type, 'BLOB');

// ===== 进度记忆 key：跨 CDN / 跨清单变体必须稳定 =====
// 多 CDN 站点同一个视频有多条清单（enc/hls/hlsaudio/audio）且每次换 CDN 域名，
// 用 host+path 做 key 会让进度永远记不住。
eq('key 用视频 ID（去 CDN 域名）', T.videoKey('https://cdn-a.example.com/asp/hls/main/0303000a/3/default/738e9fd675ae41779b5f221b61213e56/main.m3u8'),
    'id:738e9fd675ae41779b5f221b61213e56');
eq('key 跨 CDN 一致',
    T.videoKey('https://cdn-b.example.com/asp/enc/hls/main/0303000a/3/default/738e9fd675ae41779b5f221b61213e56/main.m3u8'),
    T.videoKey('https://cdn-c.example.net/asp/hls/main/0303000a/3/default/738e9fd675ae41779b5f221b61213e56/main.m3u8'));
eq('key 跨清单变体一致（视频/音轨共享进度）',
    T.videoKey('https://a.com/asp/hls/main/738e9fd675ae41779b5f221b61213e56/main.m3u8'),
    T.videoKey('https://a.com/asp/hlsaudio/hls/main/738e9fd675ae41779b5f221b61213e56/main.m3u8'));
eq('key 无 ID 时用 pathname',
    T.videoKey('https://cdn.x.com/videos/2024/aaa-bbb/full_hd_movie.mp4'), '/videos/2024/aaa-bbb/full_hd_movie.mp4');
eq('key 短路径补域名',
    T.videoKey('https://cdn.x.com/v.mp4'), 'cdn.x.com/v.mp4');

// ===== 标题：通用文件名（main/index/playlist）不能直接显示 =====
T.VV.items.length = 0;
T.VV.seen = {};
eq('通用名 main 不显示为标题', /^main$/.test(T.shortName({ name: 'main', type: 'HLS', url: 'https://a.com/main.m3u8' }, 0)), false);
eq('有意义的文件名照常显示', T.shortName({ name: 'tears-of-steel', type: 'HLS', url: 'https://a.com/x.m3u8' }, 0), 'tears-of-steel');

// 媒体清单（#EXTINF）位于已知主清单子目录时按变体移除
T.push({ url: 'https://e.com/v2/prog_index.m3u8', type: 'HLS', name: 'prog' });
T.noteHlsBody({ url: 'https://e.com/v2/prog_index.m3u8', type: 'HLS' },
    '#EXTM3U\n#EXT-X-TARGETDURATION:4\n#EXTINF:4.0,\nmain.mp4\n',
    'https://e.com/v2/prog_index.m3u8');
eq('media playlist dropped', T.VV.items.some(i => i.url.includes('prog_index')), false);
eq('media playlist marked', T.VV.hlsVariants['https://e.com/v2/prog_index.m3u8'], true);

// 720p.m3u8 这类清晰度子清单也要合并
T.push({ url: 'https://e.com/720p.m3u8', type: 'HLS', name: '720p' });
T.noteHlsBody({ url: 'https://e.com/720p.m3u8', type: 'HLS' },
    '#EXTM3U\n#EXT-X-TARGETDURATION:4\n#EXTINF:4.0,\nseg-1.ts\n', 'https://e.com/720p.m3u8');
eq('720p variant dropped', T.VV.items.some(i => i.url.includes('720p.m3u8')), false);

// 根目录 m3u8 不登记为 HLS 目录，避免误杀同域 main.mp4
T.push({ url: 'https://i.com/master.m3u8', type: 'HLS', name: 'root-master' });
eq('root hls no host-wide filter', T.push({ url: 'https://i.com/main.mp4', type: 'MP4', name: 'main' }), true);

// 主清单 body 读不到时（CORS/代理），仅凭主清单 URL 目录过滤子目录变体
T.VV.items.length = 0;
T.VV.seen = {};
T.VV.hlsRoots = {};
T.VV.hlsMasterRoots = {};
T.VV.hlsVariants = {};
eq('master url kept', T.push({ url: 'https://m.com/hls/master.m3u8', type: 'HLS', name: 'master' }), true);
eq('apple subdir variant dropped', T.push({ url: 'https://m.com/hls/v2/prog_index.m3u8', type: 'HLS', name: 'prog' }), false);
eq('apple audio variant dropped', T.push({ url: 'https://m.com/hls/a1/prog_index.m3u8', type: 'HLS', name: 'prog' }), false);
eq('other master kept', T.push({ url: 'https://m.com/other/master.m3u8', type: 'HLS', name: 'master' }), true);
eq('unrelated media playlist kept', T.push({ url: 'https://m.com/other2/stream.m3u8', type: 'HLS', name: 'stream' }), true);

// 变体先入列、主清单后到：登记主目录时要把已有变体清掉
T.VV.items.length = 0;
T.VV.seen = {};
T.VV.hlsRoots = {};
T.VV.hlsMasterRoots = {};
T.VV.hlsVariants = {};
eq('early variant kept', T.push({ url: 'https://n.com/hls/v2/prog_index.m3u8', type: 'HLS', name: 'prog' }), true);
eq('late master kept', T.push({ url: 'https://n.com/hls/master.m3u8', type: 'HLS', name: 'master' }), true);
eq('late master drops existing variant', T.VV.items.some(i => i.url.includes('/hls/v2/prog_index')), false);

// 主清单 body 能读到：非标准文件名也要登记主目录
T.VV.items.length = 0;
T.VV.seen = {};
T.VV.hlsRoots = {};
T.VV.hlsMasterRoots = {};
T.VV.hlsVariants = {};
T.push({ url: 'https://p.com/hls/start.m3u8', type: 'HLS', name: 'start' });
eq('pre-body variant kept', T.push({ url: 'https://p.com/hls/v2/prog_index.m3u8', type: 'HLS', name: 'prog' }), true);
T.noteHlsBody({ url: 'https://p.com/hls/start.m3u8', type: 'HLS' },
    '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=1280x720\nv3/prog_index.m3u8\n',
    'https://p.com/hls/start.m3u8');
eq('master body root registered', T.VV.hlsMasterRoots['https://p.com/hls/'], 1);
eq('master body drops existing variant', T.VV.items.some(i => i.url.includes('/hls/v2/prog_index')), false);
eq('master body variant dropped', T.push({ url: 'https://p.com/hls/v3/prog_index.m3u8', type: 'HLS', name: 'prog' }), false);
eq('master body same-level mp4 kept', T.push({ url: 'https://p.com/hls/movie.mp4', type: 'MP4', name: 'movie' }), true);

// 本站禁用时不再继续收集
T.VV.cfg.siteOff = true;
eq('site off blocks push', T.push({ url: 'https://f.com/off.mp4', type: 'MP4' }), false);
T.VV.cfg.siteOff = false;

// hls.js 移动端参数与音轨/画质文案
const hcfg = T.hlsConfig();
eq('hls maxBufferHole', hcfg.maxBufferHole, 0.5);
eq('hls nudgeMaxRetry', hcfg.nudgeMaxRetry, 6);
eq('hls frag retry', hcfg.fragLoadPolicy.default.errorRetry.maxNumRetry, 4);
eq('hls play ttf', hcfg.fragLoadPolicy.default.maxTimeToFirstByteMs, 10000);
eq('hls play maxLoad', hcfg.fragLoadPolicy.default.maxLoadTimeMs, 60000);
eq('hls buffer target', hcfg.maxBufferLength, 36);
eq('hls buffer max', hcfg.maxMaxBufferLength, 72);
eq('hls back buffer', hcfg.backBufferLength, 20);
eq('hls abr estimate', hcfg.abrEwmaDefaultEstimate, 2000000);
eq('hls manifest ttf', hcfg.manifestLoadPolicy.default.maxTimeToFirstByteMs, 12000);
eq('hls prefetch', hcfg.startFragPrefetch, true);
// 画质红线：脚本不做任何主动降档，档位只由 ABR 按带宽和用户手选决定
eq('hls 不按播放器尺寸封顶', hcfg.capLevelToPlayerSize, false);
eq('hls 不因掉帧降档', hcfg.capLevelOnFPSDrop, false);
eq('hls 起播交给 ABR 自动选档', hcfg.startLevel, -1);

// seek 模式：放宽超时保证跳转不被中途放弃，回到播放再收紧
const hinst = { config: T.hlsConfig() };
T.hlsSeekMode(hinst, true);
eq('hls seek ttf', hinst.config.fragLoadPolicy.default.maxTimeToFirstByteMs, 45000);
eq('hls seek maxLoad', hinst.config.fragLoadPolicy.default.maxLoadTimeMs, 180000);
T.hlsSeekMode(hinst, false);
eq('hls seek restored ttf', hinst.config.fragLoadPolicy.default.maxTimeToFirstByteMs, 10000);
eq('hls seek restored maxLoad', hinst.config.fragLoadPolicy.default.maxLoadTimeMs, 60000);
let seekModeSafe = true;
try { T.hlsSeekMode(null, true); T.hlsSeekMode({}, true); T.hlsSeekMode({ config: {} }, true); } catch (e) { seekModeSafe = false; }
eq('hls seek mode tolerant', seekModeSafe, true);
eq('level label', T.levelLabel({ height: 720, bitrate: 2500000 }, 0), '720P · 2500kbps');
eq('audio label', T.audioLabel({ name: 'English', lang: 'en' }, 0), 'English (en)');

function fakeVid(duration, readyState, range) {
    return {
        currentTime: 0,
        duration,
        readyState,
        seekable: {
            length: range ? 1 : 0,
            start() { return range ? range[0] : 0; },
            end() { return range ? range[1] : 0; }
        }
    };
}

T.setVid(fakeVid(100, 4, [0, 100]));
T.seekTo(30);
eq('seek in range', T.getVid().currentTime, 30);

T.setVid(fakeVid(100, 4, [0, 0]));
T.seekTo(30);
eq('seek no range blocked', T.getVid().currentTime, 0);

T.setVid(fakeVid(100, 1, [0, 0]));
T.seekTo(30);
eq('seek before seekable', T.getVid().currentTime, 30);

T.setVid(fakeVid(100, 4, [10, 90]));
T.seekTo(5);
eq('seek clamp low', T.getVid().currentTime, 10);
T.seekTo(95);
eq('seek clamp high', T.getVid().currentTime, 89.95);

// ---- 外链导出：播放列表必须带 Referer / UA，否则外部播放器必被防盗链挡 ----
const hlsItem = { url: 'https://cdn.a.com/v/index.m3u8?token=abc&e=1', type: 'HLS', name: '电影 01' };
const m3u = T.buildM3U(hlsItem);
eq('m3u 头', m3u.split('\n')[0], '#EXTM3U');
eq('m3u 带 referrer', /#EXTVLCOPT:http-referrer=https:\/\/example\.com\/a\/page1/.test(m3u), true);
eq('m3u 带条目名', /#EXTINF:-1,电影 01/.test(m3u), true);
eq('m3u 末行是链接', m3u.trim().split('\n').pop(), hlsItem.url);
eq('m3u HLS 加缓存', /network-caching=\d+/.test(m3u), true);
const mp4Item = { url: 'https://cdn.a.com/v/movie.mp4', type: 'MP4', name: 'movie.mp4' };
eq('m3u mp4 不加缓存', /network-caching/.test(T.buildM3U(mp4Item)), false);
eq('导出名去掉扩展名', T.buildM3U({ url: mp4Item.url, type: 'MP4', name: 'movie.mp4' }).split('\n')[1], '#EXTINF:-1,movie.mp4');

const cmd = T.buildCmd(hlsItem);
eq('curl 带 referer', /-e "https:\/\/example\.com\/a\/page1"/.test(cmd), true);
eq('curl 带 ua', /-A "/.test(cmd), true);
eq('curl 输出扩展名', /movie\.m3u8|电影 01\.m3u8/.test(cmd) || /-o ".*\.m3u8"/.test(cmd), true);
eq('curl 含目标链接', cmd.indexOf(hlsItem.url) > 0, true);
eq('curl mp4 用 .mp4', /-o ".*\.mp4"/.test(T.buildCmd(mp4Item)), true);

// 判定规则：裸链 403、带 Referer 200 → 防盗链
eq('judge 防盗链', /防盗链/.test(T.judgeProbe({ ok: true, status: 403 }, { ok: true, status: 200 }, null)), true);
eq('judge 令牌失效', /令牌失效/.test(T.judgeProbe({ ok: true, status: 403 }, { ok: true, status: 403 }, { ok: true, status: 403 })), true);
eq('judge 可移植', /可移植/.test(T.judgeProbe({ ok: true, status: 200 }, null, null)), true);
eq('judge cors', /CORS/.test(T.judgeProbe({ ok: false, err: 'Failed to fetch' }, { ok: false, err: 'Failed to fetch' }, null)), true);

// ---- 跨页面播放登记表：谁在播、主页面是谁 ----
eq('初始没有人在播', T.playersCount(), 0);
T.setPageId('pageA');
const idA = T.leaseId();
eq('页面 ID 稳定', T.leaseId(), idA);
T.playersWrite('https://a/1.m3u8');
eq('A 登记后只有 1 个', T.playersCount(), 1);
eq('A 是主页面', T.playersOwner(), 'pageA');
T.setPageId('pageB');
T.playersWrite('https://b/1.m3u8');
eq('B 也登记后共 2 个', T.playersCount(), 2);
eq('最早登记的 A 仍是主', T.playersOwner(), 'pageA');
T.setPageId('pageA');
T.playersWrite('https://a/1.m3u8');
eq('A 续登记后仍是 2 个', T.playersCount(), 2);
eq('主页面仍是 A', T.playersOwner(), 'pageA');
// 续登不能改变主页面（否则多个页面会互相抢权、轮流挂起）
T.setPageId('pageB');
T.playersWrite('https://b/1.m3u8');
T.setPageId('pageA');
T.playersWrite('https://a/1.m3u8');
eq('续登后主页面不变', T.playersOwner(), 'pageA');
T.setPageId('pageB');
T.playersWrite('https://b/1.m3u8');
eq('B 续登后主页面仍不变', T.playersOwner(), 'pageA');
T.setPageId('pageA');
T.playersUnregister();
eq('A 退出后只剩 1 个', T.playersCount(), 1);
eq('主页面变成 B', T.playersOwner(), 'pageB');
T.setPageId('pageC');
T.playersWrite('https://c/1.m3u8');
eq('第三个页面登记后共 2 个', T.playersCount(), 2);

// ---- Android intent：把播放交给外部 App 的独立进程 ----
const hlsIntent = T.buildIntent({ url: 'https://cdn.a.com/v/index.m3u8?token=abc', type: 'HLS' });
eq('intent 前缀正确', hlsIntent.indexOf('intent://'), 0);
eq('intent 带 scheme', /#Intent;scheme=https;/.test(hlsIntent), true);
eq('intent 带 ACTION_VIEW', /action=android\.intent\.action\.VIEW/.test(hlsIntent), true);
eq('intent HLS 的 MIME', /type=application\/vnd\.apple\.mpegurl/.test(hlsIntent), true);
eq('intent 保留查询串', hlsIntent.indexOf('?token=abc') > 0, true);
eq('intent 去掉片段', hlsIntent.indexOf('#EXT') < 0 && hlsIntent.indexOf('#Intent') > 0, true);
const mp4Intent = T.buildIntent({ url: 'http://cdn.a.com/v/m.mp4', type: 'MP4' });
eq('intent mp4 的 MIME', /type=video\/mp4/.test(mp4Intent), true);
eq('intent mp4 用 http scheme', /scheme=http;/.test(mp4Intent), true);
eq('intent 兼容 MIME 可覆盖', /type=application\/x-mpegURL/.test(T.buildIntent({ url: 'https://a/b.m3u8', type: 'HLS' }, 'application/x-mpegURL')), true);
eq('intent 分号被转义', /%3B/.test(T.buildIntent({ url: 'https://a/b;c.m3u8', type: 'HLS' })), true);

// ---- 标签页休眠：后台摘掉原生 <video> 的 src 以释放 MediaCodec ----
function fakeVideo(src, t) {
    return {
        src: src, currentSrc: src, currentTime: t || 0, paused: false, mediaKeys: null,
        readyState: 4, muted: false, volume: 1,
        loaded: false, played: false, _attrs: {},
        getAttribute(k) { return this._attrs[k] === undefined ? null : this._attrs[k]; },
        // 和真实 DOM 一致：属性与 IDL 是联动的。摘掉 src 属性后 el.src 会变成 ''，
        // 桩里如果还留着老值，测"有没有留下管线"就会永远算出 1 条。
        setAttribute(k, v) { this._attrs[k] = v; if (k === 'src') this.src = v; },
        removeAttribute(k) { delete this._attrs[k]; if (k === 'src') this.src = ''; },
        load() { this.loaded = true; },
        pause() { this.paused = true; },
        play() { this.played = true; return Promise.resolve(); },
        addEventListener(ev, fn) { if (ev === 'loadedmetadata') this._onmeta = fn; },
        contains() { return false; }
    };
}
const fakeVideo2 = fakeVideo('https://cdn.a.com/v/2.mp4', 12);
const fakeBlob = fakeVideo('blob:https://a/xyz', 3);
const origQSA = documentStub.querySelectorAll;
documentStub.querySelectorAll = (sel) => (sel === 'video,audio' ? [fakeVideo2, fakeBlob] : []);
T.hibernateMedia();
eq('休眠摘掉了普通 video 的 src', fakeVideo2.getAttribute('src'), null);
// blob 只暂停不深拆：MSE 摘了就装不回去，后台切走就毁掉站点播放器不可接受。
// 真正要抢解码器时（别的页签求让 / 本页解码失败）才由 releaseAllMedia 深拆。
eq('休眠记下了普通流和 blob 流', T.VV._hib && T.VV._hib.length, 2);
eq('休眠不深拆 blob（保留可恢复）', fakeBlob.loaded, false);
eq('休眠把 blob 流暂停了', fakeBlob.paused, true);
eq('休眠记下了 blob 原地址', (T.VV._hib || []).some((x) => x.el === fakeBlob && x.src === 'blob:https://a/xyz'), true);
eq('休眠给 blob 流打了标记', (T.VV._hib || []).some((x) => x.el === fakeBlob && x.blob), true);
eq('休眠记下了进度', T.VV._hib[0].t, 12);
documentStub.querySelectorAll = origQSA;
T.thawMedia();
eq('解冻装回 src', fakeVideo2.src, 'https://cdn.a.com/v/2.mp4');
eq('解冻后不重复挂起', T.VV._hib, null);

// 保守模式：只暂停，不动 src（老设备/站点播放器一拆就废时的回退）
{
    const fv = fakeVideo('https://cdn.a.com/v/soft.mp4', 4);
    const fb = fakeVideo('blob:https://a/soft', 4);
    const q = documentStub.querySelectorAll;
    documentStub.querySelectorAll = (sel) => (sel === 'video,audio' ? [fv, fb] : []);
    T.setCfg('softHibernate', true);
    T.VV._hib = null;
    T.hibernateMedia();
    eq('保守模式不拆 blob', fb.loaded, false);
    eq('保守模式仍暂停 blob', fb.paused, true);
    T.setCfg('softHibernate', false);
    T.VV._hib = null;
    documentStub.querySelectorAll = q;
}

// ---- 独占模式：非当前页不留任何解码器 ----
// 这是"同时开十个页签，只有我看的那页能用"的核心约束。
{
    // 1) detach 必须连 <source> 子元素一起清。
    //    只摘 video 的 src 属性再 load()，资源选择算法会重新去选 <source src>，
    //    当场又挂一条管线——等于"拆了又装回去"，解码器一路没还。
    const vs = fakeVideo('https://cdn.a.com/v/s.mp4', 7);
    const child = { tagName: 'SOURCE' };
    vs.firstChild = child;
    vs.removeChild = function (c) { if (this.firstChild === c) this.firstChild = null; };
    T.detachMedia(vs);
    eq('detach 摘掉了 src 属性', vs.getAttribute('src'), null);
    eq('detach 清掉了 <source> 子元素', vs.firstChild, null);
    eq('detach 触发了 load', vs.loaded, true);
    eq('detach 静音了元素', vs.muted, true);

    // 2) 管线计数：只数"还挂着 src"的，不看暂停状态
    const pv1 = fakeVideo('https://cdn.a.com/v/a.mp4', 1);
    const pv2 = fakeVideo('', 0);
    const qsa0 = documentStub.querySelectorAll;
    documentStub.querySelectorAll = () => [pv1, pv2];
    eq('管线计数只数有 src 的', T.mediaPipelines(), 1);
    T.VV._hib = null;
    documentStub.querySelectorAll = qsa0;

    // 3) 进后台不再看"全局活跃 >=3 路"：那是跨站不成立的判据。
    //    只要判定为后台，一律深拆（含 blob/MSE）。
    const blobBg = fakeVideo('blob:https://a/bg', 9);
    const qsa1 = documentStub.querySelectorAll;
    documentStub.querySelectorAll = (sel) => (sel === 'video,audio' ? [blobBg] : []);
    T.setCfg('hibernate', true);
    T.VV._bg = false;
    T.VV._hib = null;
    T.VV._releaseTotal = 0;
    T.enterBg();
    eq('后台无条件深拆 blob（不再等 3 路）', blobBg.getAttribute('src'), null);
    eq('后台深拆后 load 过', blobBg.loaded, true);
    eq('后台深拆计入统计', T.VV._releaseTotal > 0, true);

    // 4) 播放门禁：只在"后台 + 独占模式"时拦
    T.setBg(false);
    eq('前台不拦起播', T.gateActive(), false);
    T.setBg(true);
    eq('后台拦起播', T.gateActive(), true);
    T.setCfg('multiPlay', true);
    eq('并行模式不拦起播', T.gateActive(), false);
    T.setCfg('multiPlay', false);
    T.setCfg('hibernate', false);
    eq('关闭休眠后不拦起播', T.gateActive(), false);
    T.setCfg('hibernate', true);

    // 5) 巡检补漏：站点在后台把播放器又建起来，下一轮要再收走
    const late = fakeVideo('blob:https://a/late', 5);
    const qsa2 = documentStub.querySelectorAll;
    documentStub.querySelectorAll = (sel) => (sel === 'video,audio' ? [late] : []);
    T.VV._hib = null;
    T.setBg(true);
    T.sweep();
    eq('巡检把后台新冒出来的管线收走', late.getAttribute('src'), null);
    eq('巡检计数累加', T.VV._sweepCount > 0, true);

    // 6) hasFocus 不可用时绝不能当判据：恒 false 的 WebView 会把自己拆掉
    T.setBg(false);
    T.setFocusEver(false);
    eq('焦点信号不可用时不误判后台', T.tabHidden(), false);

    T.VV._hib = null;
    T.setBg(false);
    documentStub.querySelectorAll = qsa2;
}

// ---- 失焦只是"辅助证据"，不能单独判后台 ----
// 本地跑 UI 用例时踩过：hasFocus 长期为 false（无头环境、地址栏、系统弹窗都会），
// 单靠它判定会让页面莫名其妙把自己拆掉，整条播放链路卡死。
{
    const q = documentStub.querySelectorAll;
    documentStub.querySelectorAll = () => [];
    documentStub.hasFocus = () => false;
    T.setFocusEver(true);
    T.VV._noFocusAt = Date.now() - 5000;      // 假装已经失焦 5 秒
    T.VV._peerFrontAt = 0;
    T.VV._peerFrontSeen = false;
    T.clearFront();
    eq('失焦但没别的页在台前 → 不算后台', T.focusLostLong(), false);

    T.announceFrontRaw('pOther', Date.now());
    T.VV._peerFrontAt = 0;
    eq('有别的页宣称在台前 → 失焦成立', T.focusLostLong(), true);

    T.VV._peerFrontAt = 0;
    T.clearFront();
    T.announceFrontRaw(T.leaseId(), Date.now());
    eq('只有自己的宣告不算数', T.focusLostLong(), false);

    T.VV._peerFrontAt = 0;
    T.clearFront();
    T.announceFrontRaw('pOld', Date.now() - 60000);
    eq('过期的宣告不算数', T.focusLostLong(), false);

    T.clearFront();
    T.VV._noFocusAt = 0;
    T.setFocusEver(false);
    documentStub.querySelectorAll = q;
}

eq('hibernate 配置默认开', T.cfg().hibernate, true);
T.setCfg('hibernate', false);
eq('hibernate 配置可切换', T.cfg().hibernate, false);
T.setCfg('hibernate', true);

// ---- 跨页"求让"= 真交还，不是挂起 ----
// 设备级解码器只靠本页省是省不出来的：别的页签里站点自带的 MSE 播放器照样占着。
// 收到求让必须把本页所有 media 都 detach（含 blob），并记下地址以便回填。
{
    const pv = fakeVideo('blob:https://a/peer2', 30);
    const q = documentStub.querySelectorAll;
    documentStub.querySelectorAll = (sel) => (sel === 'video,audio' ? [pv] : []);
    T.setPlayerActive(false);
    T.VV._hib = null;
    T.VV._peerReleased = false;
    const n = T.releaseAllMedia('test');
    eq('求让拆掉了站点 MSE 播放器', pv.loaded, true);
    eq('求让统计到 1 路', n, 1);
    eq('求让标记已让位', T.VV._peerReleased, true);
    eq('求让留了可恢复地址', (T.VV._hib || []).some((x) => x.el === pv && x.src === 'blob:https://a/peer2'), true);
    T.VV._hib = null;
    documentStub.querySelectorAll = q;
}

// ---- MSE 被深拆之后回前台：不能再把 blob 装回去 ----
// 让位时 MediaSource 已经 closed，把同一个 blob: 重新赋给 <video> 只会得到
// 一条"有管线、没数据"的假管线：pipelines 计数 +1、readyState 永远 0、画面全黑。
// 既没恢复播放，又白占一个解码器槽位——正好和我们"只留当前页"的目标相反。
{
    const pv = fakeVideo('blob:https://a/peer3', 20);
    const q = documentStub.querySelectorAll;
    documentStub.querySelectorAll = (sel) => (sel === 'video,audio' ? [pv] : []);
    T.VV._hib = null;
    T.releaseAllMedia('test');
    eq('MSE 让位：src 被摘掉', pv.getAttribute('src'), null);
    T.thawMedia();
    eq('MSE 解冻：不把已关闭的 blob 装回去', pv.getAttribute('src'), null);
    eq('MSE 解冻：不留假管线', T.mediaPipelines(), 0);
    T.VV._hib = null;
    documentStub.querySelectorAll = q;
}

// ---- 后台页不许新建媒体管线（拦 src 赋值）----
// play() 门禁挡不住自动连播/预加载：它们先 src=… 再 play()，管线在 play 之前就建好了。
// 站点（尤其 hls.js 系）在后台会自己重建 MediaSource，我们拆一次它就建一次，
// 形成拉锯——实测后台页的 pipelines 会在 0/1 之间来回跳。
//
// 但这道门禁是双刃的：拦错一次，站点就再也建不出管线，页面永远停在加载圈上。
// 所以它只认"硬证据"——document 真的隐藏，或别的页签确实在台前。
{
    T.installSrcGuard();
    T.clearFront();
    T.setBg(true);
    T.VV._peerFrontAt = 0;
    const soft = new sandbox.window.HTMLMediaElement();
    // 只是"判成了后台"（比如 rAF 停了 2 秒），页面其实还在前台看着：
    // 这一条绝不能拦，否则页面直播播放器就永远起不来了。
    soft.src = 'blob:https://a/soft';
    eq('只有 _bg 没有硬证据：不拦建源', soft.src, 'blob:https://a/soft');
    eq('只有 _bg 没有硬证据：不计入拦源数', (T.VV._gateSrcBlocked || 0), 0);

    documentStub.hidden = true;
    documentStub.visibilityState = 'hidden';
    const mv = new sandbox.window.HTMLMediaElement();
    mv.src = 'blob:https://a/auto';
    eq('真·后台（document 隐藏）：设 src 被拦下（不建管线）', mv.src, '');
    eq('真·后台：拦下装源的计数', (T.VV._gateSrcBlocked || 0) > 0, true);

    documentStub.hidden = false;
    documentStub.visibilityState = 'visible';
    T.setBg(false);
    mv.src = 'blob:https://a/front';
    eq('回前台：设 src 放行', mv.src, 'blob:https://a/front');
    mv.src = '';
    eq('清空 src 永远放行', mv.src, '');
    T.VV._gateSrcBlocked = 0;
    T.VV._gateBlocked = 0;
}
// 换个硬证据再验一次：document 没隐藏，但别的页签在台前（Via 切页签不派发事件时就是这样）
{
    T.setBg(true);
    T.clearFront();
    T.VV._peerFrontAt = 0;
    const a = new sandbox.window.HTMLMediaElement();
    a.src = 'blob:https://a/nopeer';
    eq('后台+无 peer 证据：不拦', a.src, 'blob:https://a/nopeer');
    T.announceFrontRaw('peer-zz', Date.now());
    T.VV._peerFrontAt = 0;
    const b = new sandbox.window.HTMLMediaElement();
    b.src = 'blob:https://a/withpeer';
    eq('后台+别的页签在台前：拦下', b.src, '');
    T.clearFront();
    T.VV._peerFrontAt = 0;
    T.VV._gateSrcBlocked = 0;
    T.VV._gateBlocked = 0;
    T.setBg(false);
}
{
    const ov = fakeVideo('https://cdn.a.com/page.mp4', 8);
    const q = documentStub.querySelectorAll;
    documentStub.querySelectorAll = (sel) => (sel === 'video,audio' ? [ov] : []);
    T.VV._pageMedia = [];
    T.pausePageMedia();
    eq('开播前拆掉本页原生视频', ov.loaded, true);
    eq('开播前记下了恢复信息', T.VV._pageMedia.length, 1);
    eq('开播前记下了地址', T.VV._pageMedia[0].src, 'https://cdn.a.com/page.mp4');
    T.VV._pageMedia = [];
    documentStub.querySelectorAll = q;
}

// ---- 后台 = 零解码器：这是"开几个页签后新页签能加载但播不动"的核心 ----
// Via 这类壳切标签时不一定派发 visibilitychange，所以前后台判定要能靠 rAF 心跳兜底，
// 而且一进后台就必须【立刻】把解码器交出去（不是 pause、也不是 20 秒后）。
{
    T.VV._rafSeen = true;
    T.VV._rafLast = Date.now();
    T.setFocusEver(false);
    eq('rAF 在跳 = 前台', T.tabHidden(), false);

    // 关键回归：重页面的一次长任务（首屏解析、瀑布流批量渲染）会让 rAF 断 1~2 秒。
    // 旧逻辑 1.6 秒就判后台，于是拆解码器 + 拦建源，站点永久停在加载圈上——
    // 用户看到的就是"这个网站一点就卡死"，而轻量站点怎么开都没事。
    T.clearFront();
    T.VV._peerFrontAt = 0;
    T.VV._rafLast = Date.now() - 1200;
    eq('rAF 断 1.2 秒（长任务中）：仍算前台', T.tabHidden(), false);
    T.VV._rafLast = Date.now() - 5000;
    eq('rAF 停 5 秒但没别的页在台前：仍算前台', T.tabHidden(), false);
    T.announceFrontRaw('peer-raf', Date.now());
    T.VV._peerFrontAt = 0;
    eq('rAF 停了 + 别的页签在台前 = 后台（不依赖 visibilitychange）', T.tabHidden(), true);

    // 造一个"播放器开着、正在放 m3u8"的现场
    const pv = fakeVideo('blob:https://a/play', 30);
    let stopped = 0, detached = 0, destroyed = 0;
    const inst = {
        stopLoad() { stopped++; }, detachMedia() { detached++; }, destroy() { destroyed++; },
        levels: [], config: {}
    };
    T.setVid(pv);
    T.setPlayerActive(true);
    T.setActive({ item: { url: 'https://a/b.m3u8', type: 'HLS' }, hls: inst, _suspended: false });
    T.VV._hlsPool = [];
    T.enterBg();

    // stopLoad 会被调两次（挂起一次、彻底释放再一次），幂等，不算问题
    eq('进后台：hls 被 stopLoad', stopped >= 1, true);
    eq('进后台：hls 被 detachMedia', detached, 1);
    eq('进后台：hls 被 destroy', destroyed, 1);
    eq('进后台：播放器 video 的 src 被摘掉', pv.getAttribute('src'), null);
    eq('进后台：播放器 video 走了 load()', pv.loaded, true);
    eq('进后台：记下续播位置', Math.round(T.VV.active._suspendT), 30);
    eq('进后台：标记解码器已释放', T.VV.active._mediaReleased, true);
    eq('进后台：状态机置后台', T.VV._bg, true);
    eq('进后台：后台不重复释放', (T.enterBg(), destroyed), 1);
}

// 后台绝对不能再起播页面视频：一起播就又占一个解码器，而用户根本看不见
{
    const sv = fakeVideo('https://cdn.a.com/other.mp4', 8);
    T.VV._pageMedia = [sv];
    T.VV._pageMediaDeferred = [];
    T.resumePageMedia();
    eq('后台不重启页面视频', sv.played, false);
    eq('后台把待恢复的视频存进 deferred', (T.VV._pageMediaDeferred || []).length, 1);
    T.VV._rafLast = Date.now();
    T.leaveBg();
    eq('回前台后补上恢复', (T.VV._pageMediaDeferred || []).length, 0);
    T.VV.playerActive = false;
    T.VV.active = null;
}

// 跨页签求让：别的页签要开播，本页看到广播就把解码器交出去
{
    const pv2 = fakeVideo('blob:https://a/peer', 12);
    let destroyed2 = 0;
    T.setPageId('pMe');
    T.setVid(pv2);
    T.setPlayerActive(true);
    T.setActive({ item: { url: 'https://a/c.m3u8', type: 'HLS' }, hls: { stopLoad() {}, detachMedia() {}, destroy() { destroyed2++; } }, _suspended: false });
    T.VV._peerHandled = 0;
    sandbox.localStorage.setItem('vvs:releaseReq', JSON.stringify({ ts: Date.now(), from: 'pOther' }));
    T.peerSeen();
    eq('看到别人的求让：销毁本页 hls', destroyed2, 1);
    eq('看到别人的求让：摘掉本页 video 的 src', pv2.getAttribute('src'), null);
    T.peerSeen();
    eq('同一条求让只处理一次', destroyed2, 1);
    T.setPlayerActive(false);
    T.setActive(null);
}

// GM 脚本级通道：多开"不同视频站"时唯一可能通的协调通道
// （localStorage 按 origin 隔离，十个不同站点互相完全看不见）
{
    const store = {};
    sandbox.GM_setValue = (k, v) => { store[k] = v; };
    sandbox.GM_getValue = (k, d) => (k in store ? store[k] : d);
    T.setPageId('pGm');
    T.requestPeer();
    eq('求让同时写进 GM 通道', !!(store['vvbus'] && store['vvbus'].from === 'pGm'), true);

    const pv3 = fakeVideo('blob:https://a/gm', 6);
    T.setVid(pv3);
    T.setPlayerActive(true);
    T.setActive({ item: { url: 'https://a/c.m3u8', type: 'HLS' }, hls: { stopLoad() {}, detachMedia() {}, destroy() {} }, _suspended: false });
    T.VV._peerHandled = 0;
    T.VV._gmBusOk = false;
    T.VV._hib = null;
    store['vvbus'] = { ts: Date.now(), from: 'pOtherGm' };
    T.peerSeen();
    eq('GM 通道能收到别的页签的求让', T.VV._gmBusOk, true);
    eq('GM 通道收到后同样交出解码器', pv3.getAttribute('src'), null);
    T.setPlayerActive(false);
    T.setActive(null);
    delete sandbox.GM_setValue;
    delete sandbox.GM_getValue;
}

// 解码器自救：最多三次，且只重建管线、不再把 ABR 钉在最低档
{
    const rv = fakeVideo('https://cdn.a.com/x.mp4', 5);
    T.setVid(rv);
    T.setPlayerActive(true);
    T.setActive({ item: { url: 'https://cdn.a.com/x.mp4', type: 'MP4' }, hls: null, _suspended: false });
    const r1 = T.rescue('t1');
    const r2 = T.rescue('t2');
    const r3 = T.rescue('t3');
    const r4 = T.rescue('t4');
    // 三次而不是两次：别的页签从"失去焦点"到真正归还 MediaCodec 要几秒，
    // 只试两次（间隔 0.9s）会在解码器还没空出来时就把页面判死。
    eq('自救最多三次', [r1, r2, r3, r4], [true, true, true, false]);
    eq('自救保留诊断标记（不再据此压画质）', T.VV.active._forceLow, true);
    eq('自救会记时间戳', typeof T.VV._lastRescue.ts, 'number');
    T.setPlayerActive(false);
    T.setActive(null);
}

// 关标签页 / 导航离开时的终极清理：这条路径不会进 closePlayer，页面一销毁就再没有
// 任何定时器可用，所以必须同步把 hls 实例和 video 的解码器都还回去。
{
    const tv = fakeVideo('blob:https://a/close', 5);
    tv.src = 'blob:https://a/close';
    tv.currentSrc = 'blob:https://a/close';
    T.setVid(tv);
    let stopped = 0, detached = 0, destroyed = 0;
    T.VV._hlsPool = [{
        stopLoad() { stopped++; }, detachMedia() { detached++; }, destroy() { destroyed++; }
    }];
    const origQ2 = documentStub.querySelectorAll;
    documentStub.querySelectorAll = () => [];
    T.hardTeardown(false);
    documentStub.querySelectorAll = origQ2;
    eq('关标签页：hls 实例 stopLoad', stopped, 1);
    eq('关标签页：hls 实例 detachMedia', detached, 1);
    eq('关标签页：hls 实例 destroy', destroyed, 1);
    eq('关标签页：实例池清空', T.VV._hlsPool.length, 0);
    eq('关标签页：video 的 src 被摘掉', tv.getAttribute('src'), null);
    eq('关标签页：video 调了 load() 归还解码器', tv.loaded, true);
    eq('关标签页：video 被 pause', tv.paused, true);
    eq('关标签页：清理时间戳写入', T.VV._lastTeardown > 0, true);

    // final（pagehide 非 bfcache）要防重入：重复触发不能二次 destroy 已换上的新实例
    T.resetTeardown();
    let d2 = 0;
    T.VV._hlsPool = [{ stopLoad() {}, detachMedia() {}, destroy() { d2++; } }];
    T.hardTeardown(true);
    T.hardTeardown(true);
    eq('关标签页：final 清理只执行一次', d2, 1);

    // 一次卸载过程里 beforeunload 与 pagehide 会先后各来一次。
    // 两次都做全量释放 = 把同一件同步重活干两遍，几十个 <video> 的站点会明显拖慢关页签。
    // 媒体只释放一轮，但定时器仍必须被 final 那次停掉。
    T.resetTeardown();
    let d3 = 0;
    T.VV._hlsPool = [{ stopLoad() {}, detachMedia() {}, destroy() { d3++; } }];
    T.hardTeardown(false);
    T.hardTeardown(true);
    eq('一次卸载：媒体只释放一轮', d3, 1);
    eq('一次卸载：final 仍然停掉巡检', T.VV._focusTimer === 0 || T.VV._focusTimer == null, true);
}

// ---- 让出解码器不等于把声音关掉 ----
// 释放那一刻必须静音（pause 在有些机型上是延迟生效的，残余音频会漏出来），
// 但这是**临时状态**：装回去 / 重建播放实例时必须原样还原。
// 少了这一步，用户看到的就是"画面在播、一点声音没有"，而且每次从后台切回来都中一次。
{
    const va = fakeVideo('https://cdn.a.com/v/snd.mp4', 6);
    va.muted = false; va.volume = 1;
    T.detachMedia(va);
    eq('让出后临时静音', va.muted, true);
    eq('让出记下了原静音状态', va.__vvMuted, false);
    T.attachMedia(va, 'https://cdn.a.com/v/snd.mp4', 6, true, null, false);
    if (va._onmeta) va._onmeta();
    eq('装回后取消静音', va.muted, false);
    eq('装回后音量恢复', va.volume, 1);

    // 用户本来就是静音看的，装回来不能擅自开声音
    const vm = fakeVideo('https://cdn.a.com/v/mute.mp4', 2);
    vm.muted = true; vm.volume = 1;
    T.detachMedia(vm);
    T.attachMedia(vm, 'https://cdn.a.com/v/mute.mp4', 2, true, null, true);
    if (vm._onmeta) vm._onmeta();
    eq('原本静音的装回仍静音', vm.muted, true);

    // 硬释放走的是 volume=0 那条路：只还原 muted 不够，音量也得抬回来
    const vh = fakeVideo('blob:https://a/1', 0);
    vh.muted = false; vh.volume = 1;
    T.hardRelease(vh);
    eq('硬释放临时静音', vh.muted, true);
    eq('硬释放音量清零', vh.volume, 0);
    T.restoreAudio(vh);
    eq('还原后取消静音', vh.muted, false);
    eq('还原后音量不为 0', vh.volume, 1);
}


// ---- 临时静音不能被当成"用户选择静音"记下来 ----
// 让出解码器时我们会把元素临时 muted，如果这时再记录一次状态（休眠/换播放器），
// 记下来的就是"用户要静音"，于是装回来之后永远是静音：画面在动、没声音。
{
    const v1 = fakeVideo('https://cdn.a.com/v/x.mp4', 3);
    v1.muted = false;
    T.detachMedia(v1);
    eq('临时静音后记录到的仍是用户原值', T.origMuted(v1), false);

    const v2 = fakeVideo('https://cdn.a.com/v/y.mp4', 3);
    v2.muted = true;
    eq('用户真静音时记录为静音', T.origMuted(v2), true);

    // 临时静音状态下再走一遍"拆→装"，声音必须能回来
    T.attachMedia(v1, 'https://cdn.a.com/v/x.mp4', 3, true, null, T.origMuted(v1));
    if (v1._onmeta) v1._onmeta();
    eq('临时静音态下重装仍是取消静音', v1.muted, false);
}


// ---- 前台声音自愈：漏掉的恢复路径由巡检兜底 ----
// 真实 WebView 里"回到前台"的路径很多（visibilitychange / freeze-resume / bfcache /
// 宿主自己的前后台切换），任何一条漏掉，用户就是"画面在动、没有声音"。
// 所以除了各条路径自己还原，巡检里还要有一层幂等兜底。
{
    const v1 = fakeVideo('https://cdn.a.com/v/heal.mp4', 5);
    const v2 = fakeVideo('https://cdn.a.com/v/keep.mp4', 5);
    const v3 = fakeVideo('https://cdn.a.com/v/yield.mp4', 5);
    const qsa = documentStub.querySelectorAll;
    documentStub.querySelectorAll = (sel) => (sel === 'video,audio' ? [v1, v2, v3] : []);
    const keepHib = T.VV._hib;
    T.VV._hib = null;
    // 前面的用例可能留下 _bg / _yielded 状态，这里先摆正成"前台、没让位"
    T.setBg(false);
    T.VV._yielded = false;

    // 被我们拆过（临时静音）的元素，在前台会被还原
    v1.muted = false; v1.volume = 1;
    T.detachMedia(v1);
    eq('拆解后是静音态', v1.muted, true);
    const n1 = T.restorePageAudio();
    eq('自愈把被我们静音的元素还原', v1.muted, false);
    eq('自愈计数为 1', n1, 1);
    eq('自愈清掉标记', v1.__vvUsMuted, undefined);

    // 用户本来就静音的，不能被自愈擅自开声
    v2.muted = true; v2.volume = 1;
    T.detachMedia(v2);
    T.restorePageAudio();
    eq('用户静音的元素保持静音', v2.muted, true);
    eq('用户静音的元素标记也清掉', v2.__vvUsMuted, undefined);

    // 让位态（这页已经把解码器给别人了）不许出声
    v3.muted = false; v3.volume = 1;
    T.detachMedia(v3);
    T.VV._yielded = true;
    const n3 = T.restorePageAudio();
    eq('让位态不自愈', n3, 0);
    eq('让位态仍是静音', v3.muted, true);
    T.VV._yielded = false;
    T.restorePageAudio();
    eq('让位结束后自愈补上', v3.muted, false);

    T.VV._hib = keepHib;
    documentStub.querySelectorAll = qsa;

    // 播放器自己的 <video>：用户没按静音就不该静着
    const pv = fakeVideo('https://cdn.a.com/v/player.mp4', 5);
    pv.muted = true; pv.volume = 0;
    delete pv.__vvMuted;
    T.setVid(pv);
    T.setPlayerActive(true);
    T.setActive({ vol: 0.8 });
    T.setBg(false);
    T.VV._yielded = false;
    T.VV._userMuted = false;
    const np = T.restorePlayerAudio();
    eq('播放器自愈取消静音', pv.muted, false);
    eq('播放器自愈恢复音量', pv.volume, 0.8);
    eq('播放器自愈计数 > 0', np > 0, true);

    // 用户自己按了静音，别抢
    pv.muted = true;
    T.VV._userMuted = true;
    T.restorePlayerAudio();
    eq('用户静音时播放器自愈不插手', pv.muted, true);
    T.VV._userMuted = false;
    T.setPlayerActive(false);
    T.setVid(null);
    T.setActive(null);
}

// ---- 页面全屏（网页全屏 · 保留状态栏）----
// 关键回归：绝不调用 requestFullscreen()（那会把 Via 底部状态栏一起藏掉），
// 退出后遮罩 / 退出按钮 / 巡检定时器 / video class 必须全部清干净。
eq('页面全屏实现已打进产物', code.indexOf('function vvPageFsSet') > 0, true);
const pfsCode = code.slice(code.indexOf('function vvPageFsSet'), code.indexOf('function vvTogglePageFullscreen'));
eq('页面全屏不调用系统 Fullscreen API', /requestFullscreen\s*\(/.test(pfsCode), false);
eq('页面全屏初始关闭', T.pageFs().on, false);
eq('开启页面全屏', T.pageFsSet(true), true);
eq('开启后状态 on', T.pageFs().on, true);
eq('开启后遮罩存在', T.pageFs().shade, true);
eq('开启后退出按钮存在', T.pageFs().exit, true);
eq('开启后巡检在跑', T.pageFs().timer, true);
eq('开启后事件已绑定', T.pageFs().bound, true);
eq('重复开启幂等', T.pageFsSet(true), true);
eq('关闭页面全屏', T.pageFsSet(false), false);
eq('退出后无遮罩', T.pageFs().shade, false);
eq('退出后无退出按钮', T.pageFs().exit, false);
eq('退出后巡检已停', T.pageFs().timer, false);
eq('退出后无残留 video class', T.pageFs().video, false);
eq('退出后无残留祖先 class', T.pageFs().anc, 0);
eq('菜单开关可来回切', [T.pageFsToggle(), T.pageFsToggle()], [true, false]);

// 内置播放器自己铺满视口：期间挂起网页层，关掉再恢复
T.setPlayerActive(true);
T.pageFsSet(true);
eq('播放器打开时页面全屏挂起', T.pageFs().suspended, true);
T.setPlayerActive(false);
T.pageFsTick();
eq('播放器关闭后恢复', T.pageFs().suspended, false);

// 系统沉浸全屏会隐藏浏览器栏，网页铺满必须让位
T.setFs({});
T.pageFsTick();
eq('系统全屏时自动让位', T.pageFs().on, false);
T.setFs(null);
eq('让位后无残留 DOM', T.pageFs().shade, false);
T.pageFsSet(false, true);

// 顶栏「网页铺满」按钮：图标、同步函数、开关不破坏状态
eq('页面全屏图标已注册', !!T.icons.webfs, true);
eq('顶栏按钮同步函数可用', typeof T.pageFsBtn, 'function');
T.pageFsSet(true, true);
T.pageFsBtn();
eq('开启后同步不破坏状态', T.pageFs().on, true);
T.pageFsSet(false, true);
T.pageFsBtn();
eq('关闭后同步不破坏状态', T.pageFs().on, false);

// ---- 不锁滚动、不代劳滚动：浏览器栏归 Via 自己的手势管 ----
// 真机实测：程序化 scrollTo 叫不回 Via 的栏（没有手势它不认），
// 而 overflow:hidden 锁住页面反而让用户连上滑唤回都做不到。所以守两条：
// 只加「铺满」状态 class（不加锁），开屏过程中一次都不滚页面。
const realClassList = documentStub.documentElement.classList;
const clsSet = new Set();
documentStub.documentElement.classList = {
    add: (c) => clsSet.add(c),
    remove: (c) => clsSet.delete(c),
    contains: (c) => clsSet.has(c),
    toggle() {}
};
const scrollCalls = [];
const realScrollTo = winStub.scrollTo;
winStub.scrollTo = (x, y) => { scrollCalls.push(y); };
documentStub.documentElement.scrollHeight = 2400;
winStub.scrollY = 500;

T.pageFsSet(true, true);
eq('铺满只加 vv-pagefs-on', clsSet.has('vv-pagefs-on'), true);
eq('铺满不加滚动锁', clsSet.has('vv-pagefs-lock'), false);
eq('开屏不代劳滚动页面', scrollCalls.length, 0);
T.pageFsSet(false, true);
eq('退出后状态 class 摘净', clsSet.size, 0);

winStub.scrollTo = realScrollTo;
winStub.scrollY = 0;
documentStub.documentElement.classList = realClassList;
documentStub.documentElement.scrollHeight = undefined;

// ---- 目标选取：真实站点里「主画面」不一定在顶层文档的 <video> 里 ----
// shadow DOM / iframe / canvas 三种兜底，都对应过「点了完全没反应」的线上情况。
winStub.innerWidth = 412;
winStub.innerHeight = 892;
const qfs = documentStub.querySelectorAll;
const mkEl = (tag, w, h) => {
    const el = elStub();
    el.tagName = tag;
    el.nodeType = 1;
    el.getBoundingClientRect = () => ({ left: 0, top: 0, width: w, height: h });
    el.closest = () => null;
    el.getRootNode = () => documentStub;
    return el;
};
const withQsa = (map, fn) => {
    documentStub.querySelectorAll = (sel) => map[sel] || [];
    try { fn(); } finally { documentStub.querySelectorAll = qfs; }
};

const smallVideo = mkEl('VIDEO', 100, 60);
const bigIframe = mkEl('IFRAME', 400, 300);   // 跨域：contentDocument 读不到
const tinyIframe = mkEl('IFRAME', 120, 90);   // 广告尺寸，不该被当成播放器
const bigCanvas = mkEl('CANVAS', 400, 300);

withQsa({ video: [smallVideo] }, () => {
    const t = T.pageFsPick();
    eq('目标选取：顶层 video 优先', t && t.kind, 'video');
});
withQsa({ video: [], iframe: [bigIframe] }, () => {
    const t = T.pageFsPick();
    eq('目标选取：跨域大 iframe 兜底', t && t.kind, 'iframe');
});
withQsa({ video: [], iframe: [tinyIframe] }, () => {
    eq('目标选取：小 iframe 不当播放器', T.pageFsPick(), null);
});
withQsa({ video: [], iframe: [tinyIframe], canvas: [bigCanvas] }, () => {
    const t = T.pageFsPick();
    eq('目标选取：canvas 解码兜底', t && t.kind, 'canvas');
});
withQsa({ video: [smallVideo], iframe: [bigIframe] }, () => {
    const t = T.pageFsPick();
    eq('目标选取：大 iframe 压过小 video', t && t.kind, 'iframe');
});
withQsa({ video: [smallVideo], iframe: [bigIframe] }, () => {
    const d = T.pageFsDiag();
    eq('诊断：报告各类候选数量', [d.videos, d.iframes, d.canvases], [1, 1, 0]);
    eq('诊断：报告最终目标类型', d.kind, 'iframe');
});
eq('诊断文案可读', typeof T.pageFsDiagnose(), 'string');

// ===== 选集：集数识别、URL 模板分组、干扰排除、当前集判定 =====
eq('选集：中文集数', T.epNum('第12集'), 12);
eq('选集：EP 写法', T.epNum('EP05'), 5);
eq('选集：纯数字短文本', T.epNum(' 3 '), 3);
eq('选集：第 0 集不是「没集数」', T.epNum('第0集'), 0);
eq('选集：预告不算一集', T.epNum('第1集 预告'), null);
eq('选集：年份文本不算集数', T.epNum('2026年11月'), null);
eq('选集：下载链接不算集数', T.epNum('下载 1080P'), null);
eq('选集：token 不影响 URL 模板',
    T.epTemplate('https://a.com/play/1.html?t=111'), T.epTemplate('https://a.com/play/2.html?t=222'));
eq('选集：不同 path 是不同剧',
    T.epTemplate('https://a.com/play/1.html') !== T.epTemplate('https://a.com/detail/1.html'), true);

const qsaEpOrig = documentStub.querySelectorAll;
function withEpDom(links, els, fn) {
    documentStub.querySelectorAll = (sel) => (sel === 'a[href]' ? links : (els || []));
    try { return fn(); } finally { documentStub.querySelectorAll = qsaEpOrig; }
}
function epA(text, href) {
    return {
        tagName: 'A', textContent: text, parentNode: null,
        getAttribute(k) { return k === 'href' ? href : null; },
        setAttribute() {}, addEventListener() {}
    };
}
const epLinks = [];
for (let i = 1; i <= 12; i++) epLinks.push(epA('第' + i + '集', 'https://example.com/play/' + i + '.html'));
epLinks.push(epA('第13集', 'https://other.com/play/13.html'));          // 外域推荐位
epLinks.push(epA('第14集 预告', 'https://example.com/play/14.html'));     // 预告
epLinks.push(epA('2026年11月', 'https://example.com/play/15.html'));      // 没有集数

winStub.location.href = 'https://example.com/play/3.html';
const epScan1 = withEpDom(epLinks, [], () => T.epScan(true));
eq('选集：认出 12 集', epScan1.page.length, 12);
eq('选集：集号按数字排序', epScan1.page.map((p) => p.num), [1,2,3,4,5,6,7,8,9,10,11,12]);
eq('选集：外域与预告不混进列表',
    epScan1.page.some((p) => p.num === 13) || epScan1.page.some((p) => p.num === 14), false);
eq('选集：当前页就是当前集', epScan1.current.page, 3);

// 影视页最常见的误判：分页导航「1 2 3 …」比只有 3 集的剧集格子多。
// 当前页所在模板必须加权，否则选集点开是一堆页码。
const epMix = [];
for (let i = 1; i <= 3; i++) epMix.push(epA('第' + i + '集', 'https://example.com/play/' + i + '.html'));
for (let i = 1; i <= 10; i++) epMix.push(epA(String(i), 'https://example.com/page/' + i + '.html'));
winStub.location.href = 'https://example.com/play/2.html';
const epScan2 = withEpDom(epMix, [], () => T.epScan(true));
eq('选集：当前页模板压过分页导航', epScan2.page.map((p) => p.num), [1, 2, 3]);
eq('选集：分页导航一格没混进来', epScan2.page.length, 3);

// 已嗅探到的同模板直链本身就是分集，点它不跳页
T.VV.items.length = 0;
T.VV.seen = {};
for (let i = 1; i <= 3; i++) T.VV.items.push({ url: 'https://cdn.example.com/v/ep' + i + '.mp4', type: 'MP4', name: 'ep' + i });
const epScan3 = withEpDom([], [], () => T.epScan(true));
eq('选集：同模板直链成组', epScan3.media.length, 3);
eq('选集：直链集号来自 URL', epScan3.media.map((p) => p.num), [1, 2, 3]);

const epDiag = withEpDom(epLinks, [], () => T.epDiag());
eq('选集：诊断报出链接总数', epDiag.aLinks, 15);
eq('选集：诊断报出像集数的链接', epDiag.linkCands, 12);
eq('选集：诊断给出最终集数', epDiag.page, 12);
eq('选集：诊断报出模板分组', epDiag.topGroups.length > 0, true);

// ===== 页内小窗（系统画中画不可用时的降级）与面板抢顶避让 =====
function miniRootStub() {
    const cls = new Set();
    return {
        style: {}, _csTimer: 0, parentNode: {}, offsetWidth: 240, offsetHeight: 135,
        classList: {
            add(...xs) { xs.forEach((x) => cls.add(x)); },
            remove(...xs) { xs.forEach((x) => cls.delete(x)); },
            contains(x) { return cls.has(x); },
            toggle() {}
        },
        _cls: cls,
        appendChild() {}, removeChild() {}, addEventListener() {}, setAttribute() {},
        querySelector() { return null; }, querySelectorAll() { return []; },
        getBoundingClientRect() { return { left: 0, top: 0, width: 240, height: 135 }; }
    };
}
T.setPlayerActive(true);
const mr = miniRootStub();
T.setRoot(mr);
T.setMini(false);
eq('小窗：初始不在小窗状态', T.VV._mini, false);
eq('小窗：进入返回 true', T.mini(true, 'direct'), true);
eq('小窗：VV._mini 置位', T.VV._mini, true);
eq('小窗：mini 类已加', mr._cls.has('mini'), true);
// 前面的网页铺满用例把视口改成了 412px，期望值跟着实际视口算，别写死
const miniW = Math.max(150, Math.min(240, Math.round(winStub.innerWidth * 0.46)));
eq('小窗：宽度按视口 46%', mr.style.width, miniW + 'px');
eq('小窗：高度按 16:9', mr.style.height, Math.round(miniW * 9 / 16) + 'px');
eq('小窗：默认贴右下角', mr.style.left, Math.max(8, winStub.innerWidth - miniW - 12) + 'px');
eq('小窗：页面解除冻结', documentStub.documentElement.style.overflow, '');
eq('小窗：重复进入是幂等的', T.mini(true, 'direct'), true);
T.mini(false);
eq('小窗：退出后 VV._mini 复位', T.VV._mini, false);
eq('小窗：退出后 mini 类摘掉', mr._cls.has('mini'), false);
eq('小窗：退出后内联尺寸清空', [mr.style.width, mr.style.height, mr.style.left, mr.style.top].join('|'), '|||');
eq('小窗：退出后页面重新冻结', documentStub.documentElement.style.overflow, 'hidden');

// Via 的 WebView：pictureInPictureEnabled=false，不该再去调 requestPictureInPicture
documentStub.pictureInPictureEnabled = false;
T.setVid({ requestPictureInPicture: function () { throw new Error('不该调用'); } });
T.pip();
eq('小窗：WebView 不支持系统画中画时直接降级', T.VV._mini, true);
T.mini(false);
// 函数存在但 promise 被拒（真机上就是 NotSupportedError）时也要降级
documentStub.pictureInPictureEnabled = true;
T.setVid({
    requestPictureInPicture: () => Promise.reject(Object.assign(new Error('not available'), { name: 'NotSupportedError' }))
});
T.pip();
await new Promise((r) => setTimeout(r, 0));
eq('小窗：系统画中画被拒时降级', T.VV._mini, true);
T.mini(false);
documentStub.pictureInPictureEnabled = false;

const geOrig = documentStub.getElementById;
documentStub.getElementById = () => null;
eq('面板避让：没有更高优先级浮层时不拦', T.hasPriorityOverlay(), false);
documentStub.getElementById = (id) => (id === 'vv-share-wrap' ? { className: 'vv-share-wrap' } : null);
eq('面板避让：分享浮层在时停手', T.hasPriorityOverlay(), true);
documentStub.getElementById = (id) => (id === 'vv-ep-wrap'
    ? { classList: { contains: (c) => c === 'open' } } : null);
eq('面板避让：选集浮层打开时停手', T.hasPriorityOverlay(), true);
documentStub.getElementById = geOrig;
T.setMini(true);
eq('面板避让：页内小窗时停手', T.hasPriorityOverlay(), true);
T.setMini(false);

// ===== 播放态低特效（默认关毛玻璃）与 timeupdate 的 DOM 写入节流 =====
eq('低特效：默认开启', T.cfg().lowFx, true);
const lfSet = new Set();
const lfRoot = {
    style: {},
    classList: {
        add(x) { lfSet.add(x); }, remove(x) { lfSet.delete(x); }, contains(x) { return lfSet.has(x); }
    }
};
T.setRoot(lfRoot);
T.lowFxSync();
eq('低特效：开启时根层挂上 vv-lowfx', lfRoot.classList.contains('vv-lowfx'), true);
T.lowFxToggle();
eq('低特效：切换后配置为关', T.cfg().lowFx, false);
eq('低特效：切换后 class 立刻摘掉（不用等下次开播放器）', lfRoot.classList.contains('vv-lowfx'), false);
eq('低特效：配置已持久化', JSON.parse(sandbox.localStorage.getItem('via.vp.lowFx')), false);
T.lowFxToggle();
eq('低特效：切回后配置与 class 都恢复',
    T.cfg().lowFx === true && lfRoot.classList.contains('vv-lowfx'), true);

// 当前时间文案：按秒缓存，同秒内多次 timeupdate 不再重建文本节点
let curWrites = 0, curVal = '';
const curEl = {
    get textContent() { return curVal; },
    set textContent(v) { curWrites++; curVal = v; }
};
T.setCurTimeEl(curEl);
T.setCurTime(1.2);
eq('时间文案：首秒写入 00:01', curEl.textContent, '00:01');
eq('时间文案：首秒只写一次 DOM', curWrites, 1);
T.setCurTime(1.4);
T.setCurTime(1.9);
eq('时间文案：同秒内重复回调不写 DOM', curWrites, 1);
T.setCurTime(2.1);
eq('时间文案：跨秒才更新', curEl.textContent, '00:02');
eq('时间文案：跨秒后累计写两次', curWrites, 2);
T.setCurTime(3661.5);
eq('时间文案：小时格式不受缓存影响', curEl.textContent, '1:01:01');

// 进度条：量化到 0.1%（360px 屏上一步 <0.5px），且相同值不重复写 inline style
let barWrites = 0;
const barStyle = {};
const bar = { style: new Proxy(barStyle, {
    set(t, k, v) { barWrites++; t[k] = v; return true; }
}) };
T.setBarPct(bar, 'width', 33.333);
eq('进度条：量化到 0.1%', barStyle.width, '33.3%');
eq('进度条：首次写一次', barWrites, 1);
T.setBarPct(bar, 'width', 33.34);
T.setBarPct(bar, 'width', 33.349);
eq('进度条：不足 0.1% 的变化跳过写入', barWrites, 1);
T.setBarPct(bar, 'width', 33.5);
eq('进度条：跨过量化步长才写', barStyle.width, '33.5%');
eq('进度条：累计写两次', barWrites, 2);
T.setBarPct(bar, 'width', 100);
eq('进度条：直播 100% 边界', barStyle.width, '100%');
T.setBarPct(bar, 'width', 0);
eq('进度条：0% 边界', barStyle.width, '0%');
T.setBarPct(null, 'width', 50);
eq('进度条：元素为空不抛错', true, true);

// ---- 网页自动播放拦截：不让站点一进页面就抢解码器/带宽 ----
{
    eq('网页自动播放：默认关闭（拦截站点起播）', T.cfg().pageAutoplay, false);
    eq('网页自动播放：play 钩子已装', T.apState() && T.apState().hooked, true);

    // 页面自己的视频，无手势起播 → 拒掉并暂停
    const pv = new sandbox.window.HTMLMediaElement();
    pv.nodeName = 'VIDEO';
    const before = T.apState().blocked;
    pv.play().catch(function () {});
    eq('无手势起播：计入拦截', T.apState().blocked, before + 1);
    eq('无手势起播：不进入播放', pv.played, 0);
    eq('无手势起播：被暂停', pv.pausedCount, 1);

    // 用户点过页面后放行
    const pv2 = new sandbox.window.HTMLMediaElement();
    pv2.nodeName = 'VIDEO';
    T.setGesture(Date.now());
    pv2.play();
    eq('有用户手势：放行', pv2.played, 1);
    T.setGesture(0);

    // 配置里主动允许自动播放时完全不拦
    T.setCfg('pageAutoplay', true);
    const pv3 = new sandbox.window.HTMLMediaElement();
    pv3.nodeName = 'VIDEO';
    pv3.play();
    eq('配置允许自动播放：不拦', pv3.played, 1);
    T.setCfg('pageAutoplay', false);

    // 内置播放器（在 ROOT 里）永远不拦
    let ours = null;
    T.setRoot({ contains: function (x) { return x === ours; } });
    ours = new sandbox.window.HTMLMediaElement();
    ours.nodeName = 'VIDEO';
    ours.play();
    eq('内置播放器：不拦', ours.played, 1);
    T.setRoot(null);

    // 恢复页面媒体的一次性放行
    const pv5 = new sandbox.window.HTMLMediaElement();
    pv5.nodeName = 'VIDEO';
    T.apAllowNext(pv5);
    pv5.play();
    eq('恢复链路一次性放行：可播', pv5.played, 1);

    // preload=auto 降级为 metadata，手势后还原
    const pv6 = new sandbox.window.HTMLMediaElement();
    pv6.nodeName = 'VIDEO';
    pv6.setAttribute('preload', 'auto');
    T.apTame(pv6);
    eq('页面视频 preload=auto：降级为 metadata', pv6.getAttribute('preload'), 'metadata');
    const qOld = documentStub.querySelectorAll;
    documentStub.querySelectorAll = function (sel) { return sel === 'video' ? [pv6] : qOld.call(documentStub, sel); };
    // 播放器开着时不还原：那段时间页面预载会跟播放器抢带宽
    T.setPlayerActive(true);
    T.apRestore();
    eq('播放器开着时：手势不还原页面预载', pv6.getAttribute('preload'), 'metadata');
    T.apRestore(true);
    eq('关闭播放器后：preload 强制还原为 auto', pv6.getAttribute('preload'), 'auto');
    documentStub.querySelectorAll = qOld;

    // 页面播放器"暂停了但还在预载"：只改 preload 不够（浏览器仍会发元数据请求），
    // 非 blob 的整条收起来，记进 _pageMedia 等关闭时装回去
    const pv7 = new sandbox.window.HTMLMediaElement();
    pv7.nodeName = 'VIDEO';
    pv7.setAttribute('preload', 'auto');
    pv7.setAttribute('src', 'https://cdn.example.com/a.mp4');
    T.setCfg('multiPlay', false);
    documentStub.querySelectorAll = function (sel) {
        return sel === 'video,audio' ? [pv7] : qOld.call(documentStub, sel);
    };
    T.stopPagePreload();
    eq('页面视频暂停也预载：src 被摘掉', pv7.getAttribute('src'), null);
    eq('摘掉的页面视频记进独立清单（不污染续播清单）', T.preHeldLen(), 1);
    eq('续播清单里没有被塞进的脏记录', (T.VV._pageMedia || []).length, 0);
    T.restorePagePreload();
    eq('关闭播放器后：页面视频 src 装回去', pv7.getAttribute('src'), 'https://cdn.example.com/a.mp4');
    eq('装回时不自动起播', pv7.played | 0, 0);
    T.stopPagePreload();
    // blob/MSE 不能摘（摘了站点的 MediaSource 就 closed），只能压 preload
    const pv8 = new sandbox.window.HTMLMediaElement();
    pv8.nodeName = 'VIDEO';
    pv8.setAttribute('preload', 'auto');
    pv8.setAttribute('src', 'blob:https://cdn.example.com/9e1c');
    T.restorePagePreload();
    T.VV._pageMedia = [];
    documentStub.querySelectorAll = function (sel) {
        return sel === 'video,audio' ? [pv8] : qOld.call(documentStub, sel);
    };
    T.stopPagePreload();
    eq('blob 视频：不摘 src', pv8.getAttribute('src'), 'blob:https://cdn.example.com/9e1c');
    eq('blob 视频：preload 按成 none', pv8.getAttribute('preload'), 'none');
    T.restorePagePreload();
    eq('关闭播放器后：blob 的 preload 还原', pv8.getAttribute('preload'), 'auto');
    T.VV._pageMedia = [];
    documentStub.querySelectorAll = qOld;
}

// ---- 续播位置：别把「已经看完」的视频再跳回结尾 ----
// 10s 的测试片播到 9.9 被记下来，下次打开就 seek 到 9.9 → 立刻 ended → 1.6s 后播放器
// 自己关掉。真机上表现就是「点开闪一下什么都没了」，很容易被当成播放器坏了。
eq('长片从上次位置继续', T.resumeTarget({ t: 120 }, 600), 120);
eq('长片停在最后 15s 内：从头开始', T.resumeTarget({ t: 592 }, 600), 0);
eq('短片（10s）停在结尾：从头开始', T.resumeTarget({ t: 9.9 }, 10), 0);
eq('短片（10s）中途：照旧续播', T.resumeTarget({ t: 6 }, 10), 6);
eq('没有记录就从头开始', T.resumeTarget(null, 100), 0);
eq('只看了 3s 不值得续播', T.resumeTarget({ t: 3 }, 600), 0);
eq('时长未知时按记录续播', T.resumeTarget({ t: 60 }, 0), 60);

// 播完不能再把结尾位置写回去：ended 时清零，紧接着的 pause/close 又会写回 9.9
const sv = new sandbox.window.HTMLMediaElement();
sv.currentTime = 9.9;
sv.duration = 10;
sv.ended = true;
T.setVid(sv);
T.setActive({ key: 'kEnded', url: 'https://example.com/ended.mp4', skipS: 0, skipE: 0 });
T.saveNow();
eq('播完不写结尾位置', Object.prototype.hasOwnProperty.call(T.progMap(), 'kEnded'), false);
sv.ended = false;
sv.currentTime = 5;
T.saveNow();
eq('没播完照常记位置', (T.progMap()['kEnded'] || {}).t, 5);
T.setVid(null);
T.setActive(null);

console.log(`\nsmoke tests: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
