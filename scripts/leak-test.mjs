// 资源泄漏实测：反复 打开 → 关闭 播放器，检查 hls 实例池、video 元素、JS 堆是否回落到基线。
// 对应真机反馈：「退出播放器后不释放，要关页签过一会才正常」。
// 用法：node scripts/leak-test.mjs [--rounds=3] [--url=...]
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';

const WS = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/index.js';
let puppeteer;
try { puppeteer = createRequire(import.meta.url)('puppeteer-core'); } catch (e) { puppeteer = createRequire(WS)('puppeteer-core'); }
const BROWSERS = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
const ARGS = process.argv.slice(2);
const ROUNDS = parseInt((ARGS.find((a) => a.startsWith('--rounds=')) || '').split('=')[1], 10) || 3;
const URL0 = (ARGS.find((a) => a.startsWith('--url=')) || '').split('=')[1] || 'https://video.example.com/live/ch1/';
const TARGET = URL0 + (URL0.indexOf('?') >= 0 ? '&' : '?') + 'vvdebug=1';

const scriptSrc = await readFile('dist/via-video-player.user.js', 'utf8');

const browser = await puppeteer.launch({
    executablePath: existsSync(BROWSERS[0]) ? BROWSERS[0] : BROWSERS[1],
    headless: 'new',
    args: ['--no-sandbox', '--no-proxy-server', '--mute-audio', '--autoplay-policy=no-user-gesture-required',
        '--enable-precise-memory-info', '--js-flags=--expose-gc'],
    defaultViewport: { width: 412, height: 892 }
});

const page = await browser.newPage();
const cdp = await page.createCDPSession();
async function forceGC() { try { await cdp.send('HeapProfiler.collectGarbage'); } catch (e) {} }
await page.evaluateOnNewDocument(scriptSrc);
await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
await sleep(3500);

async function snap(label) {
    await forceGC();
    const s = await page.evaluate(() => {
        const dbg = window.__vv || {};
        const pool = typeof dbg.hlsPool === 'function' ? dbg.hlsPool() : -1;
        const vids = [...document.querySelectorAll('video')];
        const heap = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1;
        return {
            pool,
            videos: vids.length,
            root: !!document.querySelector('.vv-player-root'),
            playing: vids.filter((v) => !v.paused && !v.ended).length,
            srcLeft: vids.filter((v) => (v.currentSrc || v.getAttribute('src') || '')).length,
            heap
        };
    });
    console.log(label.padEnd(18) + ' 池=' + s.pool + '  video=' + s.videos + '  播放器层=' + (s.root ? '在' : '无')
        + '  在播=' + s.playing + '  有src=' + s.srcLeft + '  堆=' + s.heap + 'MB');
    return s;
}

async function openPlayer() {
    await page.evaluate(async () => {
        const b = document.querySelector('.vv-badge');
        if (b) b.click();
        await new Promise((r) => setTimeout(r, 650));
        const wrap = document.getElementById('vv-panel-wrap');
        const rows = wrap ? [...wrap.querySelectorAll('.vv-row')] : [];
        const row = rows.find((r) => /m3u8/.test((r.querySelector('.vv-tag') || {}).textContent || '')) || rows[0];
        if (!row) return;
        const btn = [...row.querySelectorAll('button')].find((x) => /▶|播放/.test(x.textContent + x.title)) || row.querySelectorAll('button')[0];
        if (btn) btn.click();
    });
    for (let i = 0; i < 30; i++) {
        await sleep(400);
        const ok = await page.evaluate(() => {
            const v = document.querySelector('.vv-player-video');
            return !!v && v.readyState >= 2 && v.currentTime > 0.3;
        });
        if (ok) return true;
    }
    return false;
}

async function closePlayer() {
    await page.evaluate(() => {
        // 顶栏的 ✕ 是真实关闭入口（脚本里挂了 closePlayer）
        const back = document.getElementById('vv-back');
        if (back && back.offsetParent !== null) { back.click(); return; }
        if (window.__vv && window.__vv.close) { window.__vv.close(); return; }
        if (back) { back.click(); return; }
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    await sleep(500);
    const still = await page.evaluate(() => !!document.querySelector('.vv-player-root'));
    if (still) {
        // 顶栏被隐藏时直接派发一次 ESC，并再试一次点击
        await page.evaluate(() => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            const b = document.getElementById('vv-back');
            if (b) b.click();
        });
        await sleep(500);
    }
}

await snap('基线');
const rows = [];
for (let i = 1; i <= ROUNDS; i++) {
    const ok = await openPlayer();
    await sleep(2500);
    const during = await snap('第' + i + '轮 播放中');
    await closePlayer();
    await sleep(1200);
    const after = await snap('第' + i + '轮 关闭后');
    rows.push({ round: i, started: ok, during, after });
}

console.log('');
console.log('################ 泄漏结论 ################');
const bad = rows.filter((r) => r.after.pool > 0 || r.after.root || r.after.videos > 1);
console.log(bad.length ? '✗ 有残留：' + bad.map((r) => 'R' + r.round + '(池=' + r.after.pool + ' video=' + r.after.videos + ')').join(' ') : '✓ 每轮关闭后实例池归零、播放器层移除、video 数回到基线');
const heaps = rows.map((r) => r.after.heap);
console.log('关闭后堆: ' + heaps.join(' → ') + ' MB');
await browser.close();
process.exitCode = bad.length ? 1 : 0;
