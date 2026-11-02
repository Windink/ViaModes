// 真实浏览器端到端验证：Chrome + MSE + 公开 HLS 流
// 关注点：本次修改的缓冲深度、fragLoadPolicy 动态切换、seek 后恢复播放
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { setTimeout as sleep } from 'node:timers/promises';

const WS = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/index.js';
let puppeteer;
try {
    // 优先用项目本地依赖
    puppeteer = createRequire(import.meta.url)('puppeteer-core');
} catch (e) {
    // 回退到本机 node 工作区
    puppeteer = createRequire(WS)('puppeteer-core');
}

const PORT = Number(process.env.PORT || 8099);
const BASE = `http://127.0.0.1:${PORT}`;
const BROWSERS = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
];
const PAGE_TIMEOUT = 45000;

let pass = 0, fail = 0;
function ok(name, cond, detail) {
    if (cond) { pass++; console.log('ok  -', name + (detail ? '  [' + detail + ']' : '')); }
    else { fail++; console.log('FAIL -', name + (detail ? '  [' + detail + ']' : '')); }
}

// 本机到公网 HLS 源要经过系统代理，Chrome 默认直连会慢到测不出缓冲
function proxyArgs() {
    const p = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
    if (!p) return [];
    console.log('using proxy', p);
    return ['--proxy-server=' + p, '--proxy-bypass-list=127.0.0.1;localhost'];
}

// 启动静态服务器
const server = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe']
});
server.stdout.on('data', () => {});

async function waitServer() {
    for (let i = 0; i < 50; i++) {
        try {
            const r = await fetch(BASE + '/e2e/index.html');
            if (r.ok) return true;
        } catch (e) {}
        await sleep(150);
    }
    return false;
}

const cleanup = () => { try { server.kill(); } catch (e) {} };

let browser;
try {
    if (!await waitServer()) throw new Error('e2e server 未启动');
    console.log('server ready', BASE);

    browser = await puppeteer.launch({
        executablePath: (await import('node:fs')).existsSync(BROWSERS[0]) ? BROWSERS[0] : BROWSERS[1],
        headless: 'new',
        args: [
            '--no-sandbox',
            '--autoplay-policy=no-user-gesture-required',
            '--mute-audio',
            '--disable-dev-shm-usage',
            '--window-size=420,900'
        ].concat(proxyArgs()),
        defaultViewport: { width: 420, height: 900 }
    });

    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e && e.message || e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

    await page.goto(BASE + '/e2e/index.html?vvdebug=1', { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT });

    // 脚本注入 + 调试句柄
    await page.waitForFunction(() => !!(window.__vv && window.__vv.VV), { timeout: 15000 });
    ok('调试句柄挂载', true);

    const hlsReady = await page.evaluate(() => !!(window.Hls && Hls.isSupported()));
    ok('hls.js 可用（内联或 CDN）', hlsReady);
    if (!hlsReady) throw new Error('hls.js 不可用，无法继续');

    // 等页面自身播放器拿到清单，供嗅探钩子收集
    await page.waitForFunction(
        () => document.getElementById('log').textContent.includes('hls.js ready levels='),
        { timeout: PAGE_TIMEOUT }
    ).catch(() => {});
    const levels = await page.evaluate(() => {
        const t = document.getElementById('log').textContent;
        const m = /hls\.js ready levels=(\d+)/.exec(t);
        return m ? Number(m[1]) : -1;
    });
    ok('页面 HLS 清单就绪', levels > 0, 'levels=' + levels);

    // 等嗅探到 HLS 资源
    const got = await page.waitForFunction(
        () => window.__vv.VV.items.some((i) => i.type === 'HLS'),
        { timeout: 20000 }
    ).then(() => true).catch(() => false);
    ok('嗅探到 m3u8', got, (await page.evaluate(() => window.__vv.VV.items.map((i) => i.type).join(','))) || '');

    // 用插件自己的播放器打开这条流
    const opened = await page.evaluate(() => {
        const item = window.__vv.VV.items.find((i) => i.type === 'HLS');
        if (!item) return false;
        window.__vv.open(item);
        return true;
    });
    ok('播放器打开', opened);

    await page.waitForFunction(() => {
        const a = window.__vv.VV.active;
        return !!(a && a.hls && a.hls.levels && a.hls.levels.length);
    }, { timeout: PAGE_TIMEOUT });
    ok('插件内 hls.js 实例就绪', true);

    // ---- 配置注入 ----
    const cfg = await page.evaluate(() => {
        const c = window.__vv.VV.active.hls.config;
        return {
            maxBufferLength: c.maxBufferLength,
            maxMaxBufferLength: c.maxMaxBufferLength,
            backBufferLength: c.backBufferLength,
            maxBufferSize: c.maxBufferSize,
            abrEwmaDefaultEstimate: c.abrEwmaDefaultEstimate,
            ttf: c.fragLoadPolicy.default.maxTimeToFirstByteMs,
            maxLoad: c.fragLoadPolicy.default.maxLoadTimeMs
        };
    });
    ok('缓冲目标 36s', cfg.maxBufferLength === 36, String(cfg.maxBufferLength));
    ok('缓冲上限 72s', cfg.maxMaxBufferLength === 72, String(cfg.maxMaxBufferLength));
    ok('回看缓冲 20s', cfg.backBufferLength === 20, String(cfg.backBufferLength));
    ok('缓冲字节上限 50MB', cfg.maxBufferSize === 50000000, String(cfg.maxBufferSize));
    ok('带初始计 2Mbps', cfg.abrEwmaDefaultEstimate === 2000000, String(cfg.abrEwmaDefaultEstimate));
    ok('播放态分片超时 10s', cfg.ttf === 10000, String(cfg.ttf));
    ok('播放态 maxLoad 60s', cfg.maxLoad === 60000, String(cfg.maxLoad));

    // ---- 缓冲是否真的能超过旧的 24s 上限 ----
    await page.evaluate(() => {
        const v = document.querySelector('.vv-player-video');
        if (v) v.play().catch(() => {});
    });
    // 采样期间同时记录实际下载速率：源站限速时缓冲本来就填不满，
    // 那是网络问题不是策略问题，不能判 FAIL。
    let maxAhead = 0, dlPeak = 0;
    for (let i = 0; i < 40; i++) {
        const s = await page.evaluate(() => {
            const a = window.__vv.VV.active || {};
            const dl = (a._fragBytesSum && a._fragMsSum) ? a._fragBytesSum / a._fragMsSum : 0;
            return { ahead: window.__vv.bufAhead(), dl: dl };
        });
        if (s.ahead > maxAhead) maxAhead = s.ahead;
        if (s.dl > dlPeak) dlPeak = s.dl;
        if (maxAhead >= 26) break;
        await sleep(1000);
    }
    const vstate = await page.evaluate(() => {
        const v = document.querySelector('.vv-player-video');
        const inst = window.__vv.VV.active.hls;
        return {
            paused: v.paused, ready: v.readyState, dur: Math.round(v.duration || 0),
            idx: inst.currentLevel, auto: inst.autoLevelEnabled,
            bwK: Math.round((inst.bandwidthEstimate || 0) / 1000),
            lvls: inst.levels.map((l) => Math.round((l.bitrate || 0) / 1000)).join('/'),
            bufLen: inst.config.maxBufferLength, bufSize: inst.config.maxBufferSize
        };
    });
    console.log('video state:', JSON.stringify(vstate));
    // 能不能填满 36s 缓冲取决于源站吞吐，不是播放器策略。
    // 带宽估计值会虚高（只统计瞬时速度），所以以实际下载速率和播放消耗的对比为准：
    // 下载跟不上播放消耗时，缓冲本来就填不满，这条只能跳过而不是判 FAIL。
    // 注意 dlKbs/needKbs 必须真的解析到（>0），否则视为"测不出来"，一律 skip。
    const diagPre = await page.evaluate(() => window.__vv.diag());
    const dlM = /速率: 下载 ([\d.]+)KB\/s  需要 ([\d.]+)KB\/s/.exec(diagPre);
    const dlKbs = dlM ? parseFloat(dlM[1]) : 0;
    const needKbs = dlM ? parseFloat(dlM[2]) : 0;
    // 采样期间的实际下载峰值（KB/s），比瞬时诊断值更接近"这段时间真实能拉多少"
    const needPeak = (vstate.lvls || '').split('/')
        .map((x) => parseFloat(x) || 0)
        .reduce((a, b) => Math.max(a, b), 0) / 8;   // 最高档码率 kbps → KB/s
    const canFill = dlPeak > 0 && needPeak > 0 && dlPeak >= needPeak * 1.15;
    if (canFill) {
        ok('缓冲深度突破旧 24s 上限', maxAhead > 24, 'maxAhead=' + maxAhead.toFixed(1) + 's');
    } else {
        console.log('skip - 缓冲深度（源站吞吐不足：采样期下载峰值 ' + dlPeak.toFixed(0) + 'KB/s，' +
            '播放需要 ' + needPeak.toFixed(0) + 'KB/s，带宽估计 ' + vstate.bwK + 'kbps，' +
            '填不满 36s 缓冲，无法验证深度）');
    }

    // ---- seek 期间超时放宽 ----
    // 不能睡等 300ms 再读：seek 若在缓冲区内瞬间完成，playing 后已收回 10s，会造成偶发 FAIL。
    // 改成在 seeking 事件里读（插件的 seeking 监听先注册，此刻值必已放宽）。
    const seekRes = await page.evaluate(() => new Promise((resolve) => {
        const v = document.querySelector('.vv-player-video');
        const inst = window.__vv.VV.active.hls;
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            v.removeEventListener('seeking', onSeeking);
            resolve({
                before: v.currentTime,
                target: v.currentTime,
                during: inst.config.fragLoadPolicy.default.maxTimeToFirstByteMs,
                duringLoad: inst.config.fragLoadPolicy.default.maxLoadTimeMs
            });
        };
        const onSeeking = () => finish();
        v.addEventListener('seeking', onSeeking);
        const before = v.currentTime;
        setTimeout(() => {
            // 回跳 3s：落在已缓冲区间（backBufferLength=20s），seeked/playing 会立刻到来，
            // 断言因此确定；远端慢速跳转由「慢网远程 seek」用例单独覆盖
            v.currentTime = Math.max(before - 3, 0.5);
        }, 30);
        setTimeout(finish, 5000);
    }));
    ok('seek 中分片超时放宽到 45s', seekRes.during === 45000, String(seekRes.during));
    ok('seek 中 maxLoad 180s', seekRes.duringLoad === 180000, String(seekRes.duringLoad));

    // ---- 恢复播放后收紧 ----
    const played = await page.waitForFunction(() => {
        const v = document.querySelector('.vv-player-video');
        return v && v.readyState >= 3 && !v.seeking && !v.paused;
    }, { timeout: 30000 }).then(() => true).catch(() => false);
    ok('seek 后恢复播放', played);

    if (played) {
        await sleep(400);
        const back = await page.evaluate(() => ({
            ttf: window.__vv.VV.active.hls.config.fragLoadPolicy.default.maxTimeToFirstByteMs,
            t: document.querySelector('.vv-player-video').currentTime
        }));
        ok('播放恢复后超时收紧到 10s', back.ttf === 10000, String(back.ttf));
        ok('seek 目标生效', Math.abs(back.t - seekRes.target) < 12, 't=' + back.t.toFixed(1) + ' target=' + seekRes.target.toFixed(1));
    }

    // ---- 慢网下跳到未缓冲位置仍能落地（45s 宽限的核心价值）----
    const farSeek = await page.evaluate(() => {
        const v = document.querySelector('.vv-player-video');
        v.currentTime = Math.min(v.currentTime + 15, (v.duration || 60) - 20);
        return v.currentTime;
    });
    const farOk = await page.waitForFunction((t) => {
        const v = document.querySelector('.vv-player-video');
        return !v.seeking && v.readyState >= 3 && !v.paused && Math.abs(v.currentTime - t) < 25;
    }, { timeout: 90000 }, farSeek).then(() => true).catch(() => false);
    ok('慢网下跳到未缓冲位置仍成功', farOk, 'target=' + farSeek.toFixed(1));

    // ---- 手动切档走 nextLevel（不立刻 flush 缓冲）----
    const levelRes = await page.evaluate(async () => {
        const inst = window.__vv.VV.active.hls;
        const before = { cur: inst.currentLevel, auto: inst.autoLevelEnabled };
        const idx = inst.levels.length > 1 ? 1 : 0;
        inst.nextLevel = idx;
        await new Promise((r) => setTimeout(r, 200));
        return {
            before, idx,
            manual: typeof inst.manualLevel === 'number' ? inst.manualLevel : null,
            auto: inst.autoLevelEnabled,
            cur: inst.currentLevel
        };
    });
    ok('nextLevel 切档进入手动模式', levelRes.auto === false && levelRes.manual === levelRes.idx,
        JSON.stringify(levelRes));
    ok('切档不立刻 flush 当前码率', levelRes.cur === levelRes.before.cur,
        'cur ' + levelRes.before.cur + ' -> ' + levelRes.cur);

    // 恢复自动，避免影响后续
    await page.evaluate(() => { window.__vv.VV.active.hls.nextLevel = -1; });

    // ---- 诊断面板输出判定 ----
    const diag = await page.evaluate(() => window.__vv.diag());
    ok('诊断输出下载速率与负载', /速率: 下载 [\d.]+KB\/s  需要 [\d.]+KB\/s  负载 \d+%/.test(diag));
    ok('诊断给出判定结论', /判定:/.test(diag), (diag.split('\n').find((l) => l.includes('判定:')) || '').slice(0, 70));

    // ---- 外链导出自检：本地起一个"必须带 Referer"的端点 ----
    const share = await page.evaluate(async () => {
        const item = { url: location.origin + '/guard/stream.m3u8', type: 'HLS', name: 'guard' };
        const probe = await window.__vv.shareProbe(item);
        return {
            ref: location.href,
            url: item.url,
            lines: probe.lines,
            verdict: probe.verdict,
            m3u: window.__vv.buildM3U(item),
            cmd: window.__vv.buildCmd(item)
        };
    });
    ok('自检探测出裸链被拒', /裸链.*HTTP 403/.test(share.lines.join('\n')), share.lines[0]);
    ok('自检探测出带 Referer 可通', /加页面 Referer: HTTP 200/.test(share.lines.join('\n')), share.lines[1]);
    ok('自检判定为防盗链', /防盗链/.test(share.verdict), share.verdict.slice(0, 60));
    ok('导出的 m3u 带当前页 Referer', share.m3u.includes('#EXTVLCOPT:http-referrer=' + share.ref), share.ref);
    ok('导出的 m3u 末行是原始链接', share.m3u.trim().split('\n').pop() === share.url, share.m3u.trim().split('\n').pop());
    ok('curl 命令包含 Referer 与 UA', /-e "/.test(share.cmd) && /-A "/.test(share.cmd), share.cmd.slice(0, 60));

    // 浮层能真正渲染出来
    const shareUi = await page.evaluate(() => {
        window.__vv.shareOpen({ url: location.origin + '/guard/stream.m3u8', type: 'HLS', name: 'guard' });
        const w = document.getElementById('vv-share-wrap');
        const btns = w ? w.querySelectorAll('.vv-share-btn') : [];
        const labels = [];
        for (let i = 0; i < btns.length; i++) labels.push(btns[i].textContent);
        const intent = window.__vv.buildIntent
            ? window.__vv.buildIntent({ url: location.origin + '/guard/stream.m3u8', type: 'HLS' })
            : '';
        return { exists: !!w, btns: btns.length, labels, intent };
    });
    ok('外部播放器浮层渲染', shareUi.exists && shareUi.btns === 6, JSON.stringify(shareUi.labels));
    ok('浮层提供「用外部播放器播放」', shareUi.labels.some((l) => /用外部播放器播放/.test(l)), shareUi.labels.join(' | '));
    ok('intent 指向当前链接的独立进程播放', /^intent:\/\//.test(shareUi.intent) && shareUi.intent.indexOf('action=android.intent.action.VIEW') > 0, shareUi.intent.slice(0, 60));
    await page.evaluate(() => { const w = document.getElementById('vv-share-wrap'); if (w) w.remove(); });

    // ---- 标签页休眠：后台摘掉页面原生 <video> 的 src 以释放解码器 ----
    const hib = await page.evaluate(async () => {
        const v = document.getElementById('v1');
        if (!v) return { skip: true };
        const before = v.getAttribute('src') || v.src;
        v.currentTime = 0;
        window.__vv.hibernate();
        const during = v.getAttribute('src');
        const rec = (window.__vv.VV._hib || []).map((x) => x.src);
        window.__vv.thaw();
        await new Promise((r) => setTimeout(r, 800));
        return {
            before: before,
            during: during,
            rec: rec,
            after: v.getAttribute('src') || v.src,
            rootSkipped: !(window.__vv.VV._hib || []).some((x) => x.el && x.el.classList && x.el.classList.contains('vv-player-video'))
        };
    });
    ok('页面原生 video 记下了待恢复信息', hib.rec && hib.rec.length >= 1, JSON.stringify(hib.rec));
    ok('休眠时原生 video 的 src 被摘掉', !hib.during, 'during=' + hib.during);
    ok('内置播放器的 video 不受影响', hib.rootSkipped === true);
    ok('回前台后 src 装回', !!hib.after && /flower\.mp4/.test(hib.after), 'after=' + hib.after);

    // ---- 跨页面播放锁：别的页面在播时本页自动挂起，退出后自动恢复 ----
    const leaseTest = await page.evaluate(async () => {
        window.__vv.leaseWrite('other-page', Date.now());
        await new Promise((r) => setTimeout(r, 3300));
        const a = window.__vv.VV.active;
        const v = document.querySelector('.vv-player-video');
        const suspended = !!(a && a._suspended);
        const paused = v ? v.paused : false;
        window.__vv.leaseWrite('other-page', 0);
        await new Promise((r) => setTimeout(r, 3300));
        const b = window.__vv.VV.active;
        return { suspended, paused, resumed: !(b && b._suspended) };
    });
    ok('别的页面在播时本页自动挂起', leaseTest.suspended && leaseTest.paused, JSON.stringify(leaseTest));
    ok('对方退出后本页自动恢复', leaseTest.resumed, JSON.stringify(leaseTest));

    // ---- 并行模式：允许多页同时播，并按并发数压缩缓冲与清晰度 ----
    const parallel = await page.evaluate(async () => {
        window.__vv.multiPlay();               // 打开并行模式
        window.__vv.leaseWrite('peer-1', Date.now());
        await new Promise((r) => setTimeout(r, 3300));
        const inst = window.__vv.VV.active.hls;
        const out = {
            suspended: !!window.__vv.VV.active._suspended,
            buf: inst.config.maxBufferLength,
            bufSize: inst.config.maxBufferSize,
            cap: inst.autoLevelCapping,
            levels: (inst.levels || []).length
        };
        window.__vv.leaseWrite('peer-1', 0);
        await new Promise((r) => setTimeout(r, 3300));
        out.bufAfter = inst.config.maxBufferLength;
        out.capAfter = inst.autoLevelCapping;
        window.__vv.multiPlay();               // 恢复单实例模式
        return out;
    });
    ok('并行模式下不挂起本页', parallel.suspended === false, JSON.stringify(parallel));
    ok('并发 2 时缓冲压缩到 20s', parallel.buf === 20, JSON.stringify(parallel));
    ok('并发 2 时字节上限压缩到 24MB', parallel.bufSize === 24000000, JSON.stringify(parallel));
    ok('并发 2 时限制清晰度上限', parallel.cap >= 0 && parallel.levels > 1, JSON.stringify(parallel));
    ok('只剩一页后缓冲恢复 36s', parallel.bufAfter === 36, JSON.stringify(parallel));
    ok('只剩一页后解除清晰度限制', parallel.capAfter === -1, JSON.stringify(parallel));

    // ---- 重建实例：实例坏掉后可原地重建，不需要重启浏览器 ----
    const rebuild = await page.evaluate(async () => {
        const before = document.querySelector('.vv-player-video').currentTime;
        window.__vv.rebuild();
        await new Promise((r) => setTimeout(r, 1500));
        const a = window.__vv.VV.active;
        return { hasHls: !!(a && a.hls), before };
    });
    ok('可原地重建播放实例', rebuild.hasHls, JSON.stringify(rebuild));

    // ---- 强制关闭：页面卡死时的逃生门（解冻 + 移除全屏层） ----
    const forced = await page.evaluate(async () => {
        window.__vv.forceClose();
        await new Promise((r) => setTimeout(r, 300));
        return {
            active: window.__vv.VV.playerActive,
            rootLeft: !!document.querySelector('.vv-player-root'),
            overflow: document.documentElement.style.overflow || ''
        };
    });
    ok('强制关闭能拆掉播放器层', forced.active === false && !forced.rootLeft, JSON.stringify(forced));
    ok('强制关闭会解除页面冻结', forced.overflow === '', JSON.stringify(forced));

    // ---- 无致命错误 ----
    const fatal = errors.filter((e) => !/favicon|net::ERR|Failed to load resource/i.test(e));
    ok('无未捕获运行时错误', fatal.length === 0, fatal.slice(0, 3).join(' | '));

    console.log('\n--- 诊断快照 ---\n' + diag);
    console.log(`\ne2e verify: ${pass} passed, ${fail} failed`);
    process.exitCode = fail ? 1 : 0;
} catch (e) {
    console.error('E2E ERROR:', e && e.message);
    process.exitCode = 1;
} finally {
    try { if (browser) await browser.close(); } catch (e) {}
    cleanup();
}
