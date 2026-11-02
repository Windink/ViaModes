import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

let code = await readFile('dist/via-video-player.user.js', 'utf8');
const endMark = '})();';
const last = code.lastIndexOf(endMark);
const probe = 'window.__vvTest={resolve:vvResolve,scan:vvScanText,scanPerf:vvScanPerf,noteHlsBody:vvNoteHlsBody,hlsConfig:vvHlsConfig,hlsSeekMode:vvHlsSetSeekMode,levelLabel:vvLevelLabel,audioLabel:vvAudioLabel,push:vvPushItem,VV:VV,itemRank:vvItemRank,looksAudio:vvLooksLikeAudioHls,videoKey:vvVideoKey,shortName:vvShortName,seekTo:vvSeekTo,setVid:function(v){VID=v;},getVid:function(){return VID;},buildM3U:vvBuildM3U,buildCmd:vvBuildCmd,judgeProbe:vvJudgeProbe,shareName:vvShareName,buildIntent:vvBuildIntent,playersRead:vvPlayersRead,playersWrite:vvPlayersWrite,playersUnregister:vvPlayersUnregister,playersCount:vvPlayersCount,playersOwner:vvPlayersOwner,leaseId:vvLeaseId,setPageId:function(id){VV._pageId=id;},hibernateMedia:vvHibernateMedia,thawMedia:vvThawMedia,hardTeardown:vvHardTeardown,cfg:function(){return VV.cfg;},setCfg:function(k,v){VV.cfg[k]=v;}};})();\n';
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
winStub.localStorage = { _m: {}, getItem(k) { return k in this._m ? this._m[k] : null; }, setItem(k, v) { this._m[k] = v; }, removeItem(k) { delete this._m[k]; } };
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
// 某视频站点一次会吐出 /asp/hls/（视频）、/asp/hlsaudio/（音轨）、/asp/audio/…/mp3/（音频）
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
// 某视频站点同一个视频有多条清单（enc/hls/hlsaudio/audio）且每次换 CDN 域名，
// 用 host+path 做 key 会让进度永远记不住。
eq('key 用视频 ID（去 CDN 域名）', T.videoKey('https://cdn10.example.com/asp/hls/main/0303000a/3/default/738e9fd675ae41779b5f221b61213e56/main.m3u8'),
    'id:738e9fd675ae41779b5f221b61213e56');
eq('key 跨 CDN 一致',
    T.videoKey('https://cdn9.example.com/asp/enc/hls/main/0303000a/3/default/738e9fd675ae41779b5f221b61213e56/main.m3u8'),
    T.videoKey('https://cdn11.example.com/asp/hls/main/0303000a/3/default/738e9fd675ae41779b5f221b61213e56/main.m3u8'));
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
        loaded: false, played: false, _attrs: {},
        getAttribute(k) { return this._attrs[k] === undefined ? null : this._attrs[k]; },
        setAttribute(k, v) { this._attrs[k] = v; },
        removeAttribute(k) { delete this._attrs[k]; },
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
eq('休眠记下了原地址', T.VV._hib && T.VV._hib.length, 1);
eq('休眠跳过了 blob 流', (T.VV._hib || []).some((x) => x.el === fakeBlob), false);
eq('休眠记下了进度', T.VV._hib[0].t, 12);
documentStub.querySelectorAll = origQSA;
T.thawMedia();
eq('解冻装回 src', fakeVideo2.src, 'https://cdn.a.com/v/2.mp4');
eq('解冻后不重复挂起', T.VV._hib, null);

eq('hibernate 配置默认开', T.cfg().hibernate, true);
T.setCfg('hibernate', false);
eq('hibernate 配置可切换', T.cfg().hibernate, false);

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
    let d2 = 0;
    T.VV._hlsPool = [{ stopLoad() {}, detachMedia() {}, destroy() { d2++; } }];
    T.hardTeardown(true);
    T.hardTeardown(true);
    eq('关标签页：final 清理只执行一次', d2, 1);
}

console.log(`\nsmoke tests: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
