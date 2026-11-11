// OPFS 播放缓存桌面预检（真机前先在桌面 Chrome 验证缓存链路）
//   node scripts/opfs-verify.mjs
// 覆盖：OPFS 支持 → 第一轮 open 全 MISS 并写入 → forceClose → 第二轮同 URL 命中
// → 新页面（模拟进程重启）索引从磁盘恢复并命中。
// 场景与判据同 e2e/opfs-android.html；真机对应 scripts/mumu-opfs.mjs。
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { setTimeout as sleep } from 'node:timers/promises';
import { existsSync } from 'node:fs';

const WS = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/index.js';
let puppeteer;
try { puppeteer = createRequire(import.meta.url)('puppeteer-core'); }
catch (e) { puppeteer = createRequire(WS)('puppeteer-core'); }

const PORT = Number(process.env.PORT || 8096);
const BASE = `http://127.0.0.1:${PORT}`;
const MEDIA = BASE + '/e2e/media/hls-subs/master.m3u8';
const BROWSERS = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
];

let pass = 0, fail = 0;
function ok(name, cond, detail) {
    if (cond) { pass++; console.log('ok  - ' + name + (detail ? '  [' + detail + ']' : '')); }
    else { fail++; console.log('FAIL - ' + name + (detail ? '  [' + detail + ']' : '')); }
}
function proxyArgs() {
    const p = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
    return p ? ['--proxy-server=' + p, '--proxy-bypass-list=127.0.0.1;localhost'] : [];
}

const server = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd: process.cwd(), env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe']
});
server.stdout.on('data', () => {});
const cleanup = () => { try { server.kill(); } catch (e) {} };

let browser;
try {
    for (let i = 0; i < 60; i++) {
        try { if ((await fetch(BASE + '/e2e/index.html')).ok) break; } catch (e) {}
        await sleep(150);
    }
    browser = await puppeteer.launch({
        executablePath: existsSync(BROWSERS[0]) ? BROWSERS[0] : BROWSERS[1],
        headless: 'new',
        args: ['--no-sandbox', '--mute-audio', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'].concat(proxyArgs()),
        defaultViewport: { width: 412, height: 892 }
    });
    const page = await browser.newPage();

    // 通用流程：打开新页面 + 注入 dist + 等句柄
    async function newPlayerPage(tag) {
        const p = await browser.newPage();
        await p.goto(BASE + '/e2e/opfs-android.html?vvdebug=1&driver=desktop&tag=' + tag, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await p.addScriptTag({ path: 'dist/via-video-player.user.js' });
        await p.waitForFunction(() => !!(window.__vv && window.__vv.cache), { timeout: 15000 });
        // 等缓存索引就绪
        const ready = await p.evaluate(() => window.__vv.cacheWait()).then((r) => !!r).catch(() => false);
        return { p, ready };
    }
    async function openAndWait(p, tag) {
        await p.evaluate((t) => {
            document.body.click();
            window.__vv.open({ url: location.origin + '/e2e/media/hls-subs/master.m3u8', name: t, type: 'HLS', source: 'test' });
        }, tag);
        const okVideo = await p.waitForFunction(() => {
            const v = document.querySelector('.vv-player-root video');
            return !!(v && v.readyState >= 2 && v.duration > 15);
        }, { timeout: 20000 }).then(() => true).catch(() => false);
        return okVideo;
    }
    async function waitCacheStat(p, fnSrc, timeoutMs) {
        const dl = Date.now() + (timeoutMs || 12000);
        while (Date.now() < dl) {
            const hit = await p.evaluate('(function(){var c=window.__vv.cache();return (' + fnSrc + ')(c);})()');
            if (hit) return await p.evaluate(() => window.__vv.cache());
            await sleep(250);
        }
        return await p.evaluate(() => window.__vv.cache());
    }

    // ---- 第一轮：写入 ----
    const r1 = await newPlayerPage('verify1');
    ok('OPFS 环境支持且索引就绪', r1.ready,
        JSON.stringify(await r1.p.evaluate(() => window.__vv.cache())));
    ok('第一轮起播出画', await openAndWait(r1.p, 'round1'));
    // 20s 流 maxBufferLength=36s 会一次排满全部 7 片；等 entries 稳定再采样
    const c1 = await waitCacheStat(r1.p, '(c)=>c.entries>=2', 20000);
    ok('第一轮全网络加载并写入（misses>=2, writes>=2，素材视频流共 2 片）', c1.misses >= 2 && c1.writes >= 2,
        'misses=' + c1.misses + ' writes=' + c1.writes);
    ok('缓存有条目（entries>=2，素材视频流共 2 片）', c1.entries >= 2, 'entries=' + c1.entries + ' bytes=' + c1.bytes);
    ok('缓存无写入错误', c1.errors === 0, 'errors=' + c1.errors);
    await r1.p.evaluate(() => window.__vv.forceClose());
    await sleep(800);

    // ---- 第二轮：同 URL 命中 ----
    ok('第二轮起播出画', await openAndWait(r1.p, 'round2'));
    const c2 = await waitCacheStat(r1.p, '(c)=>c.hits>=1');
    ok('第二轮命中缓存（hits>=1）', c2.hits >= 1, 'hits=' + c2.hits + ' misses=' + c2.misses);
    ok('命中后 video 仍在正常播放', await r1.p.evaluate(
        () => { const v = document.querySelector('.vv-player-root video'); return !!v && v.readyState >= 2; }));
    await r1.p.evaluate(() => window.__vv.forceClose());
    await r1.p.close();
    // index.json 的保存有 2s 防抖，等它落盘再开新页面
    await sleep(3000);

    // ---- 第三轮：新页面（新浏览器上下文）验证索引从磁盘恢复 ----
    const r3 = await newPlayerPage('verify3');
    const c3a = await r3.p.evaluate(() => window.__vv.cache());
    ok('新页面索引从磁盘恢复（entries>=2）', c3a.entries >= 2,
        'entries=' + c3a.entries + ' bytes=' + c3a.bytes);
    ok('新页面起播出画', await openAndWait(r3.p, 'round3'));
    const c3 = await waitCacheStat(r3.p, '(c)=>c.hits>=1');
    ok('跨页面命中缓存（hits>=1）', c3.hits >= 1, 'hits=' + c3.hits + ' misses=' + c3.misses);
} catch (e) {
    fail++;
    console.log('FAIL - 验证脚本异常: ' + (e && e.stack || e));
} finally {
    if (browser) { try { await browser.close(); } catch (e) {} }
    cleanup();
}

console.log(`\nopfs verify: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
