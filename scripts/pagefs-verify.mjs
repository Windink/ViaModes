// 网页铺满（原名「页面全屏」）真实浏览器验证
//   node scripts/pagefs-verify.mjs
// 验证的是 smoke（Node vm）覆盖不到的部分：真实 CSS 是否铺满视口、
// 祖先 transform 是否被临时清掉、退出后页面样式是否零残留、是否不锁滚动，
// 以及最关键的「绝不调用 requestFullscreen()」——那会进系统全屏、把浏览器栏藏掉。
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { setTimeout as sleep } from 'node:timers/promises';
import { existsSync } from 'node:fs';

const WS = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/index.js';
let puppeteer;
try { puppeteer = createRequire(import.meta.url)('puppeteer-core'); }
catch (e) { puppeteer = createRequire(WS)('puppeteer-core'); }

const PORT = Number(process.env.PORT || 8091);
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
        args: ['--no-sandbox', '--mute-audio', '--disable-dev-shm-usage',
            '--window-size=412,892'].concat(proxyArgs()),
        defaultViewport: { width: 412, height: 892 }
    });
    const page = await browser.newPage();

    // 记录任何一次系统全屏请求：网页铺满的实现里一次都不该出现
    await page.evaluateOnNewDocument(() => {
        window.__vvFsCalls = 0;
        const orig = Element.prototype.requestFullscreen;
        Element.prototype.requestFullscreen = function () {
            window.__vvFsCalls++;
            return orig ? orig.apply(this, arguments) : Promise.resolve();
        };
    });

    await page.goto(BASE + '/e2e/index.html?vvdebug=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForFunction(() => !!(window.__vv && window.__vv.pageFs), { timeout: 15000 });
    ok('调试句柄挂载', true);

    const r = await page.evaluate(() => {
        const out = { vw: window.innerWidth, vh: window.innerHeight };
        // 页面原有的 video 全部藏起来，保证探测 video 被选为「主视频」
        document.querySelectorAll('video').forEach((v) => { v.style.display = 'none'; });
        const wrap = document.createElement('div');
        wrap.id = 'tf-wrap';
        // 故意造 containing block：这是网页全屏最容易失效的场景
        wrap.style.cssText = 'transform:translateZ(0);width:260px;height:160px;';
        const v = document.createElement('video');
        v.id = 'probe-video';
        v.style.cssText = 'width:200px;height:120px;';
        v.setAttribute('playsinline', '');
        wrap.appendChild(v);
        document.body.appendChild(wrap);

        out.before = {
            pos: getComputedStyle(v).position,
            w: v.getBoundingClientRect().width,
            inline: v.style.cssText,
            ancTransform: getComputedStyle(wrap).transform
        };

        window.__vv.pageFsSet(true);
        const cs = getComputedStyle(v), rect = v.getBoundingClientRect();
        const shade = document.getElementById('vv-pagefs-shade');
        const exit = document.getElementById('vv-pagefs-exit');
        out.on = {
            state: window.__vv.pageFs(),
            pos: cs.position, w: rect.width, h: rect.height,
            ancTransform: getComputedStyle(wrap).transform,
            ancClass: wrap.className,
            inline: v.style.cssText,
            htmlClass: document.documentElement.className,
            shade: !!shade,
            shadeOn: shade ? /on/.test(shade.className) : false,
            shadeZ: shade ? getComputedStyle(shade).zIndex : '',
            exit: !!exit,
            exitZ: exit ? getComputedStyle(exit).zIndex : '',
            exitTop: exit ? exit.getBoundingClientRect().top : -1,
            fullscreenElement: !!document.fullscreenElement,
            fsCalls: window.__vvFsCalls,
            // 浏览器栏归 Via 手势管：铺满不能锁页面滚动，锁了用户就没法上滑唤回栏
            htmlOverflow: getComputedStyle(document.documentElement).overflow,
            bodyOverflow: getComputedStyle(document.body).overflow,
            lockClass: /vv-pagefs-lock/.test(document.documentElement.className)
        };

        if (exit) exit.click();
        out.off = {
            state: window.__vv.pageFs(),
            pos: getComputedStyle(v).position,
            w: v.getBoundingClientRect().width,
            inline: v.style.cssText,
            ancTransform: getComputedStyle(wrap).transform,
            ancClass: wrap.className,
            htmlClass: document.documentElement.className,
            shade: !!document.getElementById('vv-pagefs-shade'),
            exit: !!document.getElementById('vv-pagefs-exit')
        };
        return out;
    });

    ok('开启前 video 不是 fixed', r.before.pos !== 'fixed', r.before.pos);
    ok('开启前祖先确实有 transform', r.before.ancTransform !== 'none' && r.before.ancTransform !== '', r.before.ancTransform);
    ok('开启后状态 on', r.on.state.on, JSON.stringify(r.on.state));
    ok('开启后视频 fixed 铺满视口', r.on.pos === 'fixed' && Math.abs(r.on.w - r.vw) < 2 && Math.abs(r.on.h - r.vh) < 2,
        `${r.on.pos} ${Math.round(r.on.w)}x${Math.round(r.on.h)} / 视口 ${r.vw}x${r.vh}`);
    ok('祖先 transform 被临时清掉', r.on.ancTransform === 'none', r.on.ancTransform);
    ok('祖先只加 class 不改 inline', /vv-pagefs-anc/.test(r.on.ancClass));
    ok('video 的 inline style 未被改写', r.on.inline === r.before.inline, r.on.inline);
    ok('html 挂上 vv-pagefs-on', /vv-pagefs-on/.test(r.on.htmlClass));
    ok('铺满不锁页面滚动（否则无法上滑唤回浏览器栏）',
        r.on.htmlOverflow !== 'hidden' && r.on.bodyOverflow !== 'hidden' && r.on.lockClass === false,
        `html=${r.on.htmlOverflow} body=${r.on.bodyOverflow} lock=${r.on.lockClass}`);
    ok('黑底遮罩可见', r.on.shade && r.on.shadeOn, String(r.on.shadeOn));
    ok('退出按钮在右上角', r.on.exit && r.on.exitTop >= 0 && r.on.exitTop < 40, 'top=' + r.on.exitTop);
    ok('退出按钮层级高于遮罩', Number(r.on.exitZ) > Number(r.on.shadeZ), r.on.exitZ + ' > ' + r.on.shadeZ);
    // 用户核心诉求：状态栏必须保留 → 一次系统全屏都不能发起
    ok('没有进入系统全屏', r.on.fullscreenElement === false);
    ok('从未调用 requestFullscreen', r.on.fsCalls === 0, String(r.on.fsCalls));

    ok('点退出按钮后状态 off', r.off.state.on === false);
    ok('退出后遮罩与按钮移除', !r.off.shade && !r.off.exit);
    ok('退出后 html class 清除', !/vv-pagefs-on/.test(r.off.htmlClass));
    ok('退出后 video 不再是 fixed', r.off.pos !== 'fixed', r.off.pos);
    ok('退出后视频尺寸还原', Math.abs(r.off.w - r.before.w) < 2, String(r.off.w));
    ok('退出后祖先 transform 还原', r.off.ancTransform === r.before.ancTransform, r.off.ancTransform);
    ok('退出后祖先 class 清除', !/vv-pagefs-anc/.test(r.off.ancClass), r.off.ancClass);
    ok('退出后 inline style 零残留', r.off.inline === r.before.inline);

    const waiting = await page.evaluate(() => {
        const v = document.getElementById('probe-video');
        v.style.display = 'none';
        window.__vv.pageFsSet(true);
        const shade = document.getElementById('vv-pagefs-shade');
        const res = {
            on: window.__vv.pageFs().on,
            shadeOn: shade ? /on/.test(shade.className) : true,
            video: window.__vv.pageFs().video
        };
        // 站点延迟插入 / 重新显示视频：巡检应在它出现后自动铺满
        v.style.display = '';
        window.__vv.pageFsTick();
        res.afterVideo = window.__vv.pageFs().video;
        res.afterPos = getComputedStyle(v).position;
        window.__vv.pageFsSet(false);
        res.leftover = !!document.getElementById('vv-pagefs-shade');
        return res;
    });
    ok('无视频时挂着等待', waiting.on && !waiting.video);
    ok('无视频时不挂黑屏遮罩', waiting.shadeOn === false);
    ok('视频出现后自动铺满', waiting.afterVideo && waiting.afterPos === 'fixed', waiting.afterPos);
    ok('等待态退出也无残留', waiting.leftover === false);

    const cycles = await page.evaluate(() => {
        const arr = [];
        for (let i = 0; i < 3; i++) {
            window.__vv.pageFsSet(true);
            window.__vv.pageFsSet(false);
            arr.push(window.__vv.pageFs());
        }
        return arr;
    });
    ok('连续开关 3 轮无状态残留', cycles.every((s) => !s.on && !s.shade && !s.exit && !s.video && !s.timer),
        JSON.stringify(cycles));
    ok('网页层全程没有请求系统全屏', await page.evaluate(() => window.__vvFsCalls === 0));

    // ---- 播放器顶栏：两枚全屏按钮并列、互斥、状态同步 ----
    const bar = await page.evaluate(async () => {
        const out = {};
        // 让沉浸全屏只记录调用、不真的切 viewport，headless 下更稳定
        const origReq = Element.prototype.requestFullscreen;
        Element.prototype.requestFullscreen = function () {
            window.__vvFsCalls++;
            return Promise.resolve();
        };
        window.__vv.open({ url: location.origin + '/e2e/flower.mp4', name: 'probe', type: 'MP4' });
        await new Promise((r) => setTimeout(r, 400));
        const top = document.querySelector('.vv-cs-top');
        const acts = top ? Array.from(top.querySelectorAll('.vv-top-acts .vv-csbtn'))
            .map((b) => b.getAttribute('data-act')) : [];
        out.acts = acts;
        const wf = document.querySelector('.vv-cs-top [data-act="webfs"]');
        const fs = document.querySelector('.vv-cs-top [data-act="fs"]');
        out.wfLabel = wf ? wf.title : '';
        out.fsLabel = fs ? fs.title : '';
        out.initialOn = wf ? /\bon\b/.test(wf.className) : true;
        out.initialPressed = wf ? wf.getAttribute('aria-pressed') : 'x';

        if (wf) wf.click();
        out.afterClick = window.__vv.pageFs();
        out.btnClass = wf ? wf.className : '';
        out.pressed = wf ? wf.getAttribute('aria-pressed') : '';
        const exit = document.getElementById('vv-pagefs-exit');
        out.exitHidden = exit ? /hide/.test(exit.className) : true;
        out.fsCallsWebFs = window.__vvFsCalls;

        window.__vv.pageFsSet(false, true);
        out.afterMenuOff = wf ? wf.className : '';
        out.pressedOff = wf ? wf.getAttribute('aria-pressed') : '';

        // 互斥：先开页面全屏，再点旁边那枚沉浸全屏
        if (wf) wf.click();
        out.mutexBefore = window.__vv.pageFs().on;
        if (fs) fs.click();
        out.mutexAfter = window.__vv.pageFs().on;
        out.btnAfterMutex = wf ? wf.className : '';
        out.fsCallsAfter = window.__vvFsCalls;

        Element.prototype.requestFullscreen = origReq;
        window.__vv.close();
        return out;
    });
    ok('顶栏五枚按钮、选集在最左且两枚全屏相邻', bar.acts.join(',') === 'episodes,pip,fs,webfs,download', bar.acts.join(','));
    ok('两枚按钮名称区分两种全屏',
        /沉浸全屏/.test(bar.fsLabel) && /隐藏状态栏/.test(bar.fsLabel) &&
        /网页铺满/.test(bar.wfLabel) && !/状态栏/.test(bar.wfLabel),
        bar.fsLabel + ' / ' + bar.wfLabel);
    ok('播放器重建时按钮初始未激活', bar.initialOn === false && bar.initialPressed === 'false',
        bar.initialOn + ' / ' + bar.initialPressed);
    ok('点页面全屏按钮即开启', bar.afterClick.on === true, JSON.stringify(bar.afterClick));
    ok('按钮点亮且 aria-pressed=true', /\bon\b/.test(bar.btnClass) && bar.pressed === 'true',
        bar.btnClass + ' / ' + bar.pressed);
    ok('播放器内不叠网页层退出胶囊', bar.exitHidden === true);
    ok('页面全屏按钮不请求系统全屏', bar.fsCallsWebFs === 0, String(bar.fsCallsWebFs));
    ok('菜单关闭后按钮同步回未激活', !/\bon\b/.test(bar.afterMenuOff) && bar.pressedOff === 'false',
        bar.afterMenuOff + ' / ' + bar.pressedOff);
    ok('点沉浸全屏会静默关掉页面全屏', bar.mutexBefore === true && bar.mutexAfter === false,
        bar.mutexBefore + ' → ' + bar.mutexAfter);
    ok('沉浸全屏按钮确实走 requestFullscreen', bar.fsCallsAfter === 1, String(bar.fsCallsAfter));
    ok('互斥后顶栏按钮也同步熄灭', !/\bon\b/.test(bar.btnAfterMutex), bar.btnAfterMutex);

    // 多了一枚按钮，360px 窄屏（Via 常见宽度）不能把标题挤没或顶出屏幕
    await sleep(300);
    await page.setViewport({ width: 360, height: 740 });
    const narrow = await page.evaluate(() => {
        window.__vv.open({ url: location.origin + '/e2e/flower.mp4', name: 'probe', type: 'MP4' });
        const acts = document.querySelector('.vv-top-acts');
        const title = document.querySelector('.vv-title');
        const r = acts ? acts.getBoundingClientRect() : null;
        const t = title ? title.getBoundingClientRect() : null;
        const res = {
            actsRight: r ? r.right : 9999,
            actsW: r ? r.width : 0,
            titleW: t ? t.width : 0,
            vw: window.innerWidth
        };
        window.__vv.close();
        return res;
    });
    ok('360px 窄屏顶栏不溢出且标题仍有空间',
        narrow.actsRight <= narrow.vw + 1 && narrow.titleW > 40,
        `胶囊 ${Math.round(narrow.actsW)}px / 右缘 ${Math.round(narrow.actsRight)} of ${narrow.vw} / 标题 ${Math.round(narrow.titleW)}px`);
} catch (e) {
    fail++;
    console.log('FAIL - 验证脚本异常: ' + (e && e.stack || e));
} finally {
    if (browser) { try { await browser.close(); } catch (e) {} }
    cleanup();
}

console.log(`\npage-fs verify: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
