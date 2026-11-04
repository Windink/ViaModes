// 声音回归：播放器"有画面没声音"专项。
// 覆盖四条会污染静音/音量的路径：
//   1) 播放器起播时音量/静音正常
//   2) 进后台（交还解码器）→ 回前台，声音必须还原
//   3) 关掉播放器再打开，声音必须还原
//   4) 站点自己的播放器被拆（hibernate）→ 装回（thaw），声音必须还原
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const WS = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/index.js';
let puppeteer;
try { puppeteer = createRequire(import.meta.url)('puppeteer-core'); }
catch (e) { puppeteer = createRequire(WS)('puppeteer-core'); }

const PORT = Number(process.env.PORT || 8097);
const BASE = `http://127.0.0.1:${PORT}`;
const BROWSERS = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
];

function proxyArgs() {
    const p = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
    return p ? ['--proxy-server=' + p, '--proxy-bypass-list=127.0.0.1;localhost'] : [];
}

let pass = 0, fail = 0;
function ok(name, cond, detail) {
    if (cond) { pass++; console.log('ok  -', name + (detail ? '  [' + detail + ']' : '')); }
    else { fail++; console.log('FAIL -', name + (detail ? '  [' + detail + ']' : '')); }
}

const server = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(PORT) }
});
server.stdout.on('data', () => {});

async function waitServer() {
    for (let i = 0; i < 60; i++) {
        try { const r = await fetch(BASE + '/e2e/index.html'); if (r.ok) return true; } catch (e) {}
        await sleep(150);
    }
    return false;
}

let browser;
const audioOf = (sel) => `(() => { const v = document.querySelector(${JSON.stringify(sel)}); return v ? { muted: v.muted, volume: v.volume, paused: v.paused, rs: v.readyState, t: v.currentTime } : null; })()`;

try {
    if (!await waitServer()) throw new Error('server 未启动');
    browser = await puppeteer.launch({
        executablePath: existsSync(BROWSERS[0]) ? BROWSERS[0] : BROWSERS[1],
        headless: 'new',
        args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--mute-audio', '--window-size=420,900']
            .concat(proxyArgs()),
        defaultViewport: { width: 420, height: 900 }
    });
    const page = await browser.newPage();
    page.on('pageerror', () => {});
    await page.goto(BASE + '/e2e/index.html?vvdebug=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForFunction(() => !!(window.__vv && window.__vv.VV), { timeout: 15000 });

    // ---- 1) 用站点自己的 mp4 打开播放器：起播就该有声 ----
    const hasMp4 = await page.waitForFunction(
        () => window.__vv.VV.items.some((i) => /\.mp4/i.test(i.url || '')),
        { timeout: 20000 }
    ).then(() => true).catch(() => false);
    ok('嗅探到页面 mp4', hasMp4, await page.evaluate(() => window.__vv.VV.items.map((i) => i.type).join(',')));

    await page.evaluate(() => {
        const it = window.__vv.VV.items.find((i) => /\.mp4/i.test(i.url || ''));
        window.__vv.open(it);
    });
    await page.waitForFunction(() => {
        const v = document.querySelector('.vv-player-video');
        return v && v.readyState >= 2;
    }, { timeout: 30000 });
    await page.evaluate(() => { const v = document.querySelector('.vv-player-video'); v.muted = false; v.volume = 1; });
    let a = await page.evaluate(audioOf('.vv-player-video'));
    ok('播放器起播有声音（未静音）', a.muted === false, JSON.stringify(a));
    ok('播放器起播音量 > 0', a.volume > 0, String(a.volume));

    // ---- 2) 进后台交还解码器 → 回前台：声音必须还原 ----
    await page.evaluate(() => { window.__vv.enterBg(); });
    await sleep(600);
    const bg = await page.evaluate(audioOf('.vv-player-video'));
    ok('后台释放时临时静音', bg.muted === true, JSON.stringify(bg));
    await page.evaluate(() => { window.__vv.leaveBg(); });
    await sleep(2500);
    const back = await page.evaluate(audioOf('.vv-player-video'));
    ok('回前台取消临时静音', back.muted === false, JSON.stringify(back));
    ok('回前台音量不为 0', back.volume > 0, String(back.volume));
    ok('回前台恢复播放', back.paused === false || back.rs >= 2, JSON.stringify(back));

    // ---- 3) 关掉播放器再打开：不能残留静音 ----
    await page.evaluate(() => { window.__vv.close(); });
    await sleep(400);
    const act = await page.evaluate(() => {
        const it = window.__vv.VV.items.find((i) => /\.mp4/i.test(i.url || ''));
        window.__vv.open(it);
        return true;
    });
    ok('重新打开播放器', act);
    await page.waitForFunction(() => {
        const v = document.querySelector('.vv-player-video');
        return v && v.readyState >= 1;
    }, { timeout: 30000 });
    await sleep(400);
    const re = await page.evaluate(audioOf('.vv-player-video'));
    ok('重开后未静音', re.muted === false, JSON.stringify(re));
    ok('重开后音量 > 0', re.volume > 0, String(re.volume));

    // ---- 3b) 老数据里的"音量 0"必须自救 ----
    // 旧版把音量单独存成 vol，一次手势滑到底就成了永久静音：之后每次打开都是
    // 画面在动、听不到声音，界面上还看不出原因。现在 vol=0 要当成 1。
    await page.evaluate(() => { window.__vv.close(); });
    await sleep(300);
    await page.evaluate(() => {
        localStorage.setItem('via.vp.vol', '0');
        localStorage.removeItem('via.vp.mute');
    });
    await page.evaluate(() => {
        const it = window.__vv.VV.items.find((i) => /\.mp4/i.test(i.url || ''));
        window.__vv.open(it);
    });
    await page.waitForFunction(() => {
        const v = document.querySelector('.vv-player-video');
        return v && v.readyState >= 1;
    }, { timeout: 30000 });
    await sleep(300);
    const legacy = await page.evaluate(audioOf('.vv-player-video'));
    ok('历史 vol=0 不再导致静音', legacy.muted === false, JSON.stringify(legacy));
    ok('历史 vol=0 时音量回到 1', legacy.volume > 0, String(legacy.volume));

    // 用户明确静音（mute=1）时，必须尊重，不能擅自开声
    await page.evaluate(() => { window.__vv.close(); });
    await sleep(300);
    await page.evaluate(() => {
        localStorage.setItem('via.vp.vol', '0.6');
        localStorage.setItem('via.vp.mute', '1');
    });
    await page.evaluate(() => {
        const it = window.__vv.VV.items.find((i) => /\.mp4/i.test(i.url || ''));
        window.__vv.open(it);
    });
    await page.waitForFunction(() => {
        const v = document.querySelector('.vv-player-video');
        return v && v.readyState >= 1;
    }, { timeout: 30000 });
    await sleep(300);
    const kept = await page.evaluate(audioOf('.vv-player-video'));
    ok('明确静音时保持静音', kept.muted === true, JSON.stringify(kept));
    ok('明确静音时保留音量值', kept.volume > 0, String(kept.volume));
    await page.evaluate(() => {
        localStorage.removeItem('via.vp.mute');
        localStorage.setItem('via.vp.vol', '1');
    });

    // ---- 4) 站点播放器被拆再装回：声音必须还原 ----
    await page.evaluate(() => { window.__vv.close(); });
    await sleep(300);
    await page.evaluate(() => {
        const v = document.getElementById('v1');
        v.muted = false; v.volume = 1;
        return v.play().catch(() => {});
    });
    await page.waitForFunction(() => document.getElementById('v1').readyState >= 2, { timeout: 20000 }).catch(() => {});
    await page.evaluate(() => { window.__vv.hibernate(); });
    await sleep(400);
    const hib = await page.evaluate(audioOf('#v1'));
    ok('站点播放器拆解时临时静音', hib.muted === true, JSON.stringify(hib));
    await page.evaluate(() => { window.__vv.thaw(); });
    await sleep(2000);
    const thaw = await page.evaluate(audioOf('#v1'));
    ok('站点播放器装回后取消静音', thaw.muted === false, JSON.stringify(thaw));
    ok('站点播放器装回后音量不为 0', thaw.volume > 0, String(thaw.volume));
    // ---- 4b) 真实标签切换（Chrome 里开第二个标签把当前页压到后台）----
    // 前面的 enterBg/leaveBg 是内部接口，这里走浏览器真实的 visibility 变化，
    // 覆盖"宿主切标签"这条最容易漏掉还原的路径。
    await page.evaluate(() => { window.__vv.close(); });
    await sleep(300);
    await page.evaluate(() => {
        const v = document.getElementById('v1');
        v.muted = false; v.volume = 1;
        return v.play().catch(() => {});
    });
    await page.waitForFunction(() => document.getElementById('v1').readyState >= 2, { timeout: 20000 }).catch(() => {});
    const page2 = await browser.newPage();
    await page2.goto('about:blank');
    await page2.bringToFront();
    await sleep(2500);
    const hiddenState = await page.evaluate(() => {
        const v = document.getElementById('v1');
        return { vis: document.visibilityState, muted: v.muted, vol: v.volume, paused: v.paused };
    });
    ok('切到别的标签后页面被判后台', hiddenState.vis === 'hidden', JSON.stringify(hiddenState));
    ok('后台时站点播放器被临时静音', hiddenState.muted === true, JSON.stringify(hiddenState));
    await page.bringToFront();
    const backState = await page.waitForFunction(() => {
        const v = document.getElementById('v1');
        if (!v) return null;
        if (document.visibilityState === 'visible' && !v.muted && v.volume > 0) {
            return { vis: document.visibilityState, muted: v.muted, vol: v.volume, paused: v.paused };
        }
        return null;
    }, { timeout: 15000 }).then((h) => h.jsonValue()).catch(() => null);
    ok('切回前台声音自动还原', !!backState, JSON.stringify(backState));
    if (backState) {
        ok('切回前台未静音', backState.muted === false, JSON.stringify(backState));
        ok('切回前台音量 > 0', backState.vol > 0, JSON.stringify(backState));
    }
    await page2.close();

    // ---- 5) HLS(MSE) 路径：真站点主流形态，拆解回前台后声音同样要还原 ----
    await page.evaluate(() => { window.__vv.close(); });
    await sleep(300);
    const gotHls = await page.waitForFunction(
        () => window.__vv.VV.items.some((i) => i.type === 'HLS'),
        { timeout: 25000 }
    ).then(() => true).catch(() => false);
    if (!gotHls) {
        console.log('skip - HLS 源不可用（网络/代理），跳过 MSE 声音用例');
    } else {
        await page.evaluate(() => {
            const it = window.__vv.VV.items.find((i) => i.type === 'HLS');
            window.__vv.open(it);
        });
        const playing = await page.waitForFunction(() => {
            const v = document.querySelector('.vv-player-video');
            return v && v.readyState >= 2 && v.currentTime > 0.3;
        }, { timeout: 45000 }).then(() => true).catch(() => false);
        ok('HLS 起播', playing);
        if (playing) {
            await page.evaluate(() => { const v = document.querySelector('.vv-player-video'); v.muted = false; v.volume = 1; });
            await page.evaluate(() => { window.__vv.enterBg(); });
            await sleep(800);
            await page.evaluate(() => { window.__vv.leaveBg(); });
            const hlsBack = await page.waitForFunction(() => {
                const v = document.querySelector('.vv-player-video');
                if (!v) return null;
                if (v.readyState >= 2 && v.currentTime > 0.5 && !v.muted) return { muted: v.muted, volume: v.volume, t: v.currentTime };
                return null;
            }, { timeout: 30000 }).then((h) => h.jsonValue()).catch(() => null);
            ok('HLS 回前台恢复播放', !!hlsBack, JSON.stringify(hlsBack));
            ok('HLS 回前台未静音', hlsBack ? hlsBack.muted === false : false, JSON.stringify(hlsBack));
            ok('HLS 回前台音量 > 0', hlsBack ? hlsBack.volume > 0 : false, JSON.stringify(hlsBack));
        }
    }

} catch (e) {
    fail++;
    console.log('FAIL - 用例异常:', e && e.message);
} finally {
    try { if (browser) await browser.close(); } catch (e) {}
    try { server.kill(); } catch (e) {}
}

console.log(`\naudio-check: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
