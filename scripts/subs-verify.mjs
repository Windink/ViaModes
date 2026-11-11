// 字幕桌面预检（真机前先在桌面 Chrome 验证 hls.js 字幕链路与菜单 UI）
//   node scripts/subs-verify.mjs
// 覆盖：master 清单解析出 2 条字幕轨 → 更多菜单「字幕」行 → 子菜单选中中文
// → subtitleTrack=0 / TextTrack showing / cue 文本命中 → 切 English → 关闭。
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { setTimeout as sleep } from 'node:timers/promises';
import { existsSync } from 'node:fs';

const WS = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/index.js';
let puppeteer;
try { puppeteer = createRequire(import.meta.url)('puppeteer-core'); }
catch (e) { puppeteer = createRequire(WS)('puppeteer-core'); }

const PORT = Number(process.env.PORT || 8094);
const BASE = `http://127.0.0.1:${PORT}`;
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
    await page.goto(BASE + '/e2e/subs-android.html?vvdebug=1&driver=desktop', { waitUntil: 'domcontentloaded', timeout: 45000 });
    // 设备页靠 Via 注入脚本；桌面没有扩展，手动把 dist 注进来
    // （页面自己的 main() 会因 __vv 缺席先 fatal 一轮，无碍，桌面流程全部由本脚本驱动）
    await page.addScriptTag({ path: 'dist/via-video-player.user.js' });
    await page.waitForFunction(() => !!(window.__vv && window.__vv.open), { timeout: 15000 });

    // 开播放器（桌面 no-user-gesture 政策直接可播）
    await page.evaluate(() => {
        window.__vv.open({ url: location.origin + '/e2e/media/hls-subs/master.m3u8', name: 'subs', type: 'HLS', source: 'test' });
    });
    await page.waitForFunction(() => {
        const v = document.querySelector('.vv-player-root video');
        return !!(v && v.duration > 15);
    }, { timeout: 20000 });
    ok('播放器起播且时长 ~20s', true);

    // 等字幕轨清单解析
    await page.waitForFunction(() => (window.__vv.subs().tracks || []).length >= 2, { timeout: 10000 });
    const tracks = await page.evaluate(() => window.__vv.subs());
    ok('两条字幕轨', tracks.tracks.length === 2, JSON.stringify(tracks.tracks));

    // 菜单 UI：更多 → 字幕 → 中文（点击后二级菜单渲染有延迟，轮询重试避免时序 flake）
    const clickRow = (src) => page.evaluate((rxSrc) => {
        const r = new RegExp(rxSrc);
        const rows = document.querySelectorAll('#vv-sheet .vv-sheet-item');
        for (const row of rows) {
            const lb = row.querySelector('.vv-sheet-label');
            if (lb && r.test(lb.textContent || '')) { row.click(); return true; }
        }
        return false;
    }, src);
    await page.evaluate(() => { window.__vv.menuSheet(); });
    const clickRowUntil = async (src, untilFn, timeoutMs) => {
        const deadline = Date.now() + (timeoutMs || 8000);
        while (Date.now() < deadline) {
            const clicked = await clickRow(src);
            if (await page.evaluate(untilFn)) return true;
            await sleep(300);
        }
        return false;
    };
    ok('更多菜单有「字幕」行并跳到子菜单',
        await clickRowUntil('^\\s*字幕[:：]', () => {
            const rows = document.querySelectorAll('#vv-sheet .vv-sheet-item .vv-sheet-label');
            for (const lb of rows) if (/^\s*关闭字幕\s*$/.test(lb.textContent || '')) return true;
            return false;
        }));
    ok('字幕子菜单选中中文',
        await clickRowUntil('^\\s*中文\\s*$', () => window.__vv.subs().sel === 0));
    ok('选中中文轨（subtitleTrack=0）', (await page.evaluate(() => window.__vv.subs())).sel === 0);

    const showing = await page.waitForFunction(() => window.__vv.subs().modes.indexOf('showing') >= 0,
        { timeout: 8000 }).then(() => true).catch(() => false);
    ok('TextTrack 被渲染（mode=showing）', showing,
        JSON.stringify((await page.evaluate(() => window.__vv.subs())).modes));

    const zhHit = await page.waitForFunction(() => {
        const v = document.querySelector('.vv-player-root video');
        if (!v) return false;
        for (let i = 0; i < v.textTracks.length; i++) {
            const cs = v.textTracks[i].cues;
            if (!cs) continue;
            for (let j = 0; j < cs.length; j++) if (/中文字幕/.test(String(cs[j].text || ''))) return true;
        }
        return false;
    }, { timeout: 12000 }).then(() => true).catch(() => false);
    ok('中文 cue 已解析', zhHit);

    // 切英文 → 关闭
    await page.evaluate(() => { window.__vv.subSet(1); });
    await page.waitForFunction(() => window.__vv.subs().sel === 1, { timeout: 8000 });
    ok('切到 English 轨', true);
    const enHit = await page.waitForFunction(() => {
        const v = document.querySelector('.vv-player-root video');
        if (!v) return false;
        for (let i = 0; i < v.textTracks.length; i++) {
            const cs = v.textTracks[i].cues;
            if (!cs) continue;
            for (let j = 0; j < cs.length; j++) if (/English subtitle/.test(String(cs[j].text || ''))) return true;
        }
        return false;
    }, { timeout: 12000 }).then(() => true).catch(() => false);
    ok('English cue 已解析', enHit);

    await page.evaluate(() => { window.__vv.subSet(-1); });
    await sleep(400);
    const fin = await page.evaluate(() => window.__vv.subs());
    ok('关闭字幕（sel=-1）', fin.sel === -1, 'sel=' + fin.sel);
    ok('关闭后无 showing 轨', fin.modes.indexOf('showing') < 0, JSON.stringify(fin.modes));
} catch (e) {
    fail++;
    console.log('FAIL - 验证脚本异常: ' + (e && e.stack || e));
} finally {
    if (browser) { try { await browser.close(); } catch (e) {} }
    cleanup();
}

console.log(`\nsubs verify: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
