// 网页铺满失效复现（真实浏览器 × 多种站点布局）
//   node scripts/pagefs-probe.mjs
// pagefs-verify 只测了「干净页 + 一个 transform 祖先」，覆盖不到真实站点的刁钻结构。
// 这里把移动端视频站最常见的几种包裹结构逐一造出来，看网页铺满到底在哪一类上失效。
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { setTimeout as sleep } from 'node:timers/promises';
import { existsSync } from 'node:fs';

const WS = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/index.js';
let puppeteer;
try { puppeteer = createRequire(import.meta.url)('puppeteer-core'); }
catch (e) { puppeteer = createRequire(WS)('puppeteer-core'); }

const PORT = Number(process.env.PORT || 8093);
const BASE = `http://127.0.0.1:${PORT}`;
const BROWSERS = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
];

let pass = 0, fail = 0;
function ok(name, cond, detail) {
    if (cond) { pass++; console.log('ok   - ' + name + (detail ? '  [' + detail + ']' : '')); }
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
        args: ['--no-sandbox', '--mute-audio', '--disable-dev-shm-usage', '--window-size=412,892'].concat(proxyArgs()),
        defaultViewport: { width: 412, height: 892 }
    });
    const page = await browser.newPage();
    page.on('pageerror', () => {});
    await page.goto(BASE + '/e2e/index.html?vvdebug=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForFunction(() => !!(window.__vv && window.__vv.pageFs), { timeout: 15000 });

    // 场景构造器跑在页面里：每个场景返回「网页铺满开启后」的实测结果
    const scenarios = await page.evaluate(async () => {
        const VW = window.innerWidth, VH = window.innerHeight;
        const out = [];
        const host = document.createElement('div');
        host.id = 'probe-host';
        document.body.appendChild(host);

        // 页面原有 video 全部藏起来，避免抢「主视频」
        document.querySelectorAll('video').forEach((v) => { v.style.display = 'none'; });

        const mkVideo = (css) => {
            const v = document.createElement('video');
            v.className = 'site-video';
            v.muted = true;
            v.setAttribute('playsinline', '');
            v.src = '/e2e/flower.mp4';
            if (css) v.style.cssText = css;
            return v;
        };

        // 找出「谁盖在视口中心」。遮罩平时是 pointer-events:none，
        // 直接 elementFromPoint 会穿透它、命中下面的 VIDEO，测出来的永远是「没盖住」，
        // 但绘制层级上遮罩可能实实在在压着视频（真机表现为开了铺满一片黑）。
        // 所以测量时临时让它参与命中测试，测完立刻还原，不改产品样式。
        const coverAt = () => {
            const shade = document.getElementById('vv-pagefs-shade');
            let old = '';
            try {
                if (shade) {
                    old = shade.style.pointerEvents || '';
                    shade.style.setProperty('pointer-events', 'auto', 'important');
                }
                const el = document.elementFromPoint(Math.round(VW / 2), Math.round(VH / 2));
                return el ? (el.tagName + (el.className ? '.' + String(el.className).split(/\s+/)[0] : '')) : 'null';
            } finally {
                if (shade) {
                    if (old) shade.style.setProperty('pointer-events', old);
                    else shade.style.removeProperty('pointer-events');
                }
            }
        };

        // 最近的「层叠上下文」祖先：它的 z-index 就是 video 能画到的最上层边界
        const stackOf = (v) => {
            let p = v.parentNode, found = null;
            while (p && p !== document.documentElement) {
                if (p.nodeType === 1) {
                    const cs = getComputedStyle(p);
                    const z = cs.zIndex;
                    const sc = (z !== 'auto' && cs.position !== 'static') ||
                        (cs.opacity !== '1') || (cs.transform !== 'none') ||
                        (cs.filter !== 'none') || (cs.isolation === 'isolate') ||
                        /paint|layout|content|strict/.test(cs.contain || '');
                    if (sc) { found = { tag: p.tagName, z: z, pos: cs.position, contain: cs.contain }; break; }
                }
                p = p.parentNode;
            }
            return found;
        };

        const run = (name, build) => {
            host.innerHTML = '';
            let v = build(host);
            // 同一页里前面的 video 会残留，全部藏起来只留当前场景
            document.querySelectorAll('video').forEach((x) => {
                if (x !== v) x.style.display = 'none';
            });
            if (v) v.style.removeProperty('display');
            const res = { name: name, picked: null, pos: '', w: 0, h: 0, cover: '', stack: null, shade: false };
            try {
                window.__vv.pageFsSet(true, true);
                const st = window.__vv.pageFs();
                res.picked = st.video;
                res.kind = st.kind;
                if (v) {
                    const cs = getComputedStyle(v), r = v.getBoundingClientRect();
                    res.pos = cs.position;
                    res.w = Math.round(r.width);
                    res.h = Math.round(r.height);
                    res.stack = stackOf(v);
                    res.shade = st.shade;
                    res.cover = coverAt();
                    res.ancFrontZ = v.parentNode ? getComputedStyle(v.parentNode).zIndex : '';
                    res.videoTop = Math.round(r.top) + ',' + Math.round(r.left);
                }
            } catch (e) {
                res.err = String(e && e.message || e);
            }
            try { window.__vv.pageFsSet(false, true); } catch (e) {}
            res.ancAfter = v && v.parentNode ? String(v.parentNode.className || '') : '';
            out.push(res);
            if (v && v.parentNode) v.parentNode.removeChild(v);
            if (v && v.parentNode === null && v.__wrap) v.__wrap.remove();
            return res;
        };

        // ① 干净页：video 直接挂 body
        run('plain', (h) => {
            const v = mkVideo('width:320px;height:180px');
            h.appendChild(v);
            v.__wrap = v;
            return v;
        });

        // ② 播放器外层带 transform（经典的「全屏后还缩在小框里」）
        run('transform', (h) => {
            const w = document.createElement('div');
            w.style.cssText = 'transform:translateZ(0);width:320px;height:180px;overflow:hidden';
            const v = mkVideo('width:100%;height:100%');
            w.appendChild(v); h.appendChild(w);
            return v;
        });

        // ③ 播放器外层是低 z-index 的层叠上下文（遮罩可能把它盖住）
        run('stacking-z1', (h) => {
            const w = document.createElement('div');
            w.style.cssText = 'position:relative;z-index:1;width:320px;height:180px';
            const v = mkVideo('width:100%;height:100%');
            w.appendChild(v); h.appendChild(w);
            return v;
        });

        // ④ 外层 contain:paint（现代播放器常见，会把 fixed 关在盒子里）
        run('contain-paint', (h) => {
            const w = document.createElement('div');
            w.style.cssText = 'contain:paint;width:320px;height:180px;overflow:hidden';
            const v = mkVideo('width:100%;height:100%');
            w.appendChild(v); h.appendChild(w);
            return v;
        });

        // ⑤ video 在 shadow DOM 里
        run('shadow-dom', (h) => {
            const hostEl = document.createElement('div');
            hostEl.style.cssText = 'width:320px;height:180px';
            h.appendChild(hostEl);
            const sr = hostEl.attachShadow({ mode: 'open' });
            const v = mkVideo('width:100%;height:100%');
            sr.appendChild(v);
            return v;
        });

        // ⑥ body 带 transform（整站都被关进一个层叠上下文）
        run('body-transform', (h) => {
            document.body.style.transform = 'translateZ(0)';
            const w = document.createElement('div');
            w.style.cssText = 'width:320px;height:180px';
            const v = mkVideo('width:100%;height:100%');
            w.appendChild(v); h.appendChild(w);
            return v;
        });
        document.body.style.transform = '';

        // ⑦ 站点自己已经有全屏 fixed 播放器容器 + overflow:hidden
        run('site-fixed-player', (h) => {
            const w = document.createElement('div');
            w.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;overflow:hidden;background:#000;z-index:999';
            const v = mkVideo('width:100%;height:100%');
            w.appendChild(v); h.appendChild(w);
            return v;
        });

        // ⑧ video 被站点藏在 0 尺寸盒子里（只留解码用），同时有个大 canvas 显示画面
        run('canvas-decoder', (h) => {
            const w = document.createElement('div');
            w.style.cssText = 'width:320px;height:180px;overflow:hidden';
            const v = mkVideo('width:0;height:0;opacity:0');
            const c = document.createElement('canvas');
            c.width = 320; c.height = 180;
            c.style.cssText = 'width:100%;height:100%;background:#123';
            w.appendChild(v); w.appendChild(c); h.appendChild(w);
            return c;   // 量的是 canvas：它才是被铺满的那个
        });

        // ⑨ iframe 里播（同源）
        let iframeRes = { name: 'iframe-same-origin' };
        try {
            host.innerHTML = '';
            const f = document.createElement('iframe');
            f.style.cssText = 'width:360px;height:203px;border:0';
            f.srcdoc = '<video id="iv" playsinline muted style="width:100%;height:100%" src="/e2e/flower.mp4"></video>';
            host.appendChild(f);
            await new Promise((r) => setTimeout(r, 600));
            window.__vv.pageFsSet(true, true);
            const iv = f.contentDocument && f.contentDocument.getElementById('iv');
            iframeRes.kind = window.__vv.pageFs().kind;
            iframeRes.iframePos = getComputedStyle(f).position;
            iframeRes.iframeW = Math.round(f.getBoundingClientRect().width);
            iframeRes.innerPos = iv ? getComputedStyle(iv).position : 'n/a';
            iframeRes.innerW = iv ? Math.round(iv.getBoundingClientRect().width) : 0;
            iframeRes.injected = !!(f.contentDocument && f.contentDocument.getElementById('vv-pagefs-inner-style'));
            window.__vv.pageFsSet(false, true);
            iframeRes.leftoverStyle = !!(f.contentDocument && f.contentDocument.getElementById('vv-pagefs-inner-style'));
            iframeRes.leftoverClass = iv ? iv.className : '';
            f.remove();
        } catch (e) { iframeRes.err = String(e && e.message || e); }
        out.push(iframeRes);

        // ⑩ iframe 里播（跨域：localhost 与 127.0.0.1 不同源，读不到 contentDocument）
        let xRes = { name: 'iframe-cross-origin' };
        try {
            host.innerHTML = '';
            const f = document.createElement('iframe');
            f.style.cssText = 'width:360px;height:203px;border:0';
            f.src = 'http://localhost:' + location.port + '/e2e/index.html';
            host.appendChild(f);
            await new Promise((r) => setTimeout(r, 900));
            window.__vv.pageFsSet(true, true);
            xRes.kind = window.__vv.pageFs().kind;
            xRes.pos = getComputedStyle(f).position;
            xRes.w = Math.round(f.getBoundingClientRect().width);
            xRes.h = Math.round(f.getBoundingClientRect().height);
            window.__vv.pageFsSet(false, true);
            f.remove();
        } catch (e) { xRes.err = String(e && e.message || e); }
        out.push(xRes);

        host.remove();
        document.querySelectorAll('video').forEach((x) => { x.style.display = ''; });
        return { list: out, vw: VW, vh: VH };
    });

    const { list, vw, vh } = scenarios;
    const full = (r) => r.pos === 'fixed' && Math.abs(r.w - vw) < 3 && Math.abs(r.h - vh) < 3;
    const covered = (r) => /vv-pagefs-shade|^BODY/i.test(String(r.cover || ''));

    for (const r of list) {
        if (r.name === 'iframe-same-origin') {
            ok('iframe 同源：iframe 元素本身被铺满',
                r.iframePos === 'fixed' && Math.abs(r.iframeW - vw) < 3,
                `${r.kind} ${r.iframePos} ${r.iframeW}/${vw}`);
            ok('iframe 同源：内部视频跟着铺满',
                r.innerPos === 'fixed' && Math.abs(r.innerW - vw) < 3,
                `${r.innerPos} ${r.innerW}/${vw}`);
            ok('iframe 同源：样式注入到内层文档', r.injected === true);
            ok('iframe 同源：退出后内层零残留',
                r.leftoverStyle === false && !/vv-pagefs/.test(r.leftoverClass || ''),
                `style=${r.leftoverStyle} class="${r.leftoverClass}"`);
            continue;
        }
        if (r.name === 'iframe-cross-origin') {
            ok('iframe 跨域：按面积识别并铺满 iframe',
                r.kind === 'iframe' && r.pos === 'fixed' && Math.abs(r.w - vw) < 3 && Math.abs(r.h - vh) < 3,
                `${r.kind} ${r.pos} ${r.w}x${r.h} / ${vw}x${vh}`);
            continue;
        }
        if (r.name === 'canvas-decoder') {
            ok('canvas 解码：选中 canvas 兜底而不是黑屏 video',
                r.kind === 'canvas' && r.pos === 'fixed' && Math.abs(r.w - vw) < 3,
                `${r.kind} ${r.pos} ${r.w}x${r.h}`);
            continue;
        }
        ok(`[${r.name}] 选中视频并 fixed 铺满`, full(r), `${r.pos} ${r.w}x${r.h} / ${vw}x${vh}`);
        ok(`[${r.name}] 遮罩没盖住视频`, !covered(r), '中心处最上层=' + r.cover);
        if (r.name === 'stacking-z1') {
            ok('低 z-index 播放器外层被抬到遮罩之上', r.ancFrontZ === '2147483002',
                '祖先 z=' + r.ancFrontZ + ' / 遮罩 z=2147483000');
        }
        // 祖先上两个作用域类（外层 / shadow、iframe 内层）退出后都不该有残留
        ok(`[${r.name}] 退出后祖先 class 零残留`, !/vv-pagefs/.test(String(r.ancAfter || '')),
            '祖先 class="' + (r.ancAfter || '') + '"');
        if (r.stack && Number(r.stack.z) > 0 && Number(r.stack.z) < 2147483000) {
            console.log(`     · 层叠上下文 ${r.stack.tag} z=${r.stack.z} pos=${r.stack.pos}`);
        }
    }
    console.log(`\nviewport ${vw}x${vh}`);
} catch (e) {
    fail++;
    console.log('FAIL - 探针异常: ' + (e && e.stack || e));
} finally {
    if (browser) { try { await browser.close(); } catch (e) {} }
    cleanup();
}

console.log(`\npage-fs probe: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
