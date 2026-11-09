import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const SRC = 'src';
const OUT = 'dist/via-video-player.user.js';
const VER_FILE = '.version';
const HASH_FILE = '.tmp/build.hash';
const MODULES = ['00-core.js', '10-sniffer.js', '11-style.js', '20-ui.js', '30-player.js', '31-player-x.js', '32-share.js', '33-multiplayer.js', '40-menu.js', '45-pagefs.js', '50-boot.js'];

// ---- 版本号必须每次改动都变 ----
// Via 的「更新」是按 @version 比较的，版本号不动 = 永远不更新。
// 之前连着几轮修复都停在 0.1.3，装进 Via 的其实一直是第一版，
// 这是"改了还是没用"的一个真实来源。这里用产物哈希判断有没有变，
// 变了就把 patch 位 +1，并把 build 时间一起写进头部，方便一眼核对装的哪版。
let body = '';

// hls.js 以 Apache-2.0 分发，第 4(a) 条要求向接收方提供许可证副本与版权声明。
// 原始 min 文件不带 banner，这里在产物中补上保留型注释（/*! 开头，压缩工具默认保留），
// 仓库内 vendor/LICENSE-hlsjs 与 vendor/LICENSE-Apache-2.0 存放许可证全文。
// 只加注释、不改 vendor 文件本身，因此不需要按 4(b) 标注"修改过的文件"。
const HLS_BANNER = '/*! hls.js 1.7.3 | Copyright (c) 2017 Dailymotion (http://www.dailymotion.com)'
    + ' | Licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0)'
    + ' | https://github.com/video-dev/hls.js'
    + ' | 本副本为官方 dist/hls.light.min.js 原样内联，未修改；许可证全文见 vendor/LICENSE-hlsjs 与 vendor/LICENSE-Apache-2.0 */';

if (existsSync('vendor/hls.light.min.js')) {
    const size = (await statSync('vendor/hls.light.min.js')).size;
    if (size > 20000) {
        let vendor = await readFile('vendor/hls.light.min.js', 'utf8');
        body += 'var VV_HLS_URLS = ["https://fastly.jsdelivr.net/npm/hls.js@1/dist/hls.light.min.js","https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.light.min.js","https://unpkg.com/hls.js@1/dist/hls.light.min.js"];\n';
        body += HLS_BANNER + '\n';
        body += '(function(){try{' + vendor + '}catch(e){}})();\n';
        // 站点常在之后注入自家魔改版 hls.js（页面自带的定制构建就是），会覆盖 window.Hls。
        // 先把我们这份干净的标准版引用抓在全局上，播放时优先用它，避免被页面定制版接管。
        body += 'try{ if (window.Hls) window.__vvHlsCtor = window.Hls; }catch(e){}\n';
        console.log('vendor hls.js inlined:', size, 'bytes');
    }
} else {
    body += 'var VV_HLS_URLS = ["https://fastly.jsdelivr.net/npm/hls.js@1/dist/hls.light.min.js","https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.light.min.js","https://unpkg.com/hls.js@1/dist/hls.light.min.js"];\n';
    console.log('vendor hls.js missing, runtime CDN fallback only');
}

for (const f of MODULES) {
    let code = await readFile(`${SRC}/${f}`, 'utf8');
    code = code.replace(/^\s*(['"])use strict\1;?\s*$/m, '');
    body += code.trim() + '\n';
}

const hash = createHash('sha1').update(body).digest('hex').slice(0, 12);
let ver = '0.1.3';
try { ver = (await readFile(VER_FILE, 'utf8')).trim() || ver; } catch (e) {}
let prevHash = '';
try { prevHash = (await readFile(HASH_FILE, 'utf8')).trim(); } catch (e) {}
const bumped = prevHash !== hash;
if (bumped) {
    const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(ver);
    ver = m ? `${m[1]}.${m[2]}.${Number(m[3]) + 1}` : '0.1.4';
    await writeFile(VER_FILE, ver + '\n', 'utf8');
    console.log('version ->', ver, '(source changed)');
} else {
    console.log('version stays', ver, '(no source change)');
}
try { await writeFile(HASH_FILE, hash + '\n', 'utf8'); } catch (e) {}

// ---- 变更记录必须跟着版本走 ----
// 约定：每次改动源码，先把要点写进 CHANGELOG.md 的「未发布」段。
// 只要「未发布」有内容、且当前版本在 CHANGELOG 里还没条目，就自动定版为
// `## v当前版本 — 日期` 并补一个空的「未发布」段。
// 定版条件不看「本次构建版本有没有自增」，这样「先 build 后补记」的时序也能自愈；
// 若「未发布」为空且当前版本无条目，则一直报警，直到补上为止。
// 只提醒不阻断：中间构建（调试期间的连续 build）不该被卡住。
const CHANGELOG = 'CHANGELOG.md';
const CHANGELOG_HEAD = '## 未发布';

async function syncChangelog() {
    let txt = '';
    try { txt = await readFile(CHANGELOG, 'utf8'); } catch (e) {
        console.log('\n  !!! 找不到 CHANGELOG.md，本次改动没有任何版本记录。\n');
        return;
    }

    const hasVersion = (t) =>
        new RegExp('^## v' + ver.replace(/\./g, '\\.') + '(?:\\s|$)', 'm').test(t);

    // 第一步：当前版本还没有条目，就把「未发布」段定版上去
    if (!hasVersion(txt)) {
        const headAt = txt.indexOf(CHANGELOG_HEAD);
        if (headAt < 0) {
            console.log('\n  !!! CHANGELOG.md 里找不到「' + CHANGELOG_HEAD + '」段，无法自动定版。\n');
            return;
        }
        const rest = txt.slice(headAt + CHANGELOG_HEAD.length);
        const nextIdx = rest.search(/\n## /);
        const sectionRaw = nextIdx < 0 ? rest : rest.slice(0, nextIdx);
        const tailRaw = nextIdx < 0 ? '' : rest.slice(nextIdx);
        // 只算真实条目：去掉空行与 `### 新增` 这类小标题后还有没有字
        const meaningful = sectionRaw.split('\n')
            .filter((l) => l.trim() && !/^###\s/.test(l.trim()))
            .join('').trim();
        if (meaningful) {
            const date = new Date().toISOString().slice(0, 10);
            txt = txt.slice(0, headAt)
                + CHANGELOG_HEAD + '\n\n'
                + `## v${ver} — ${date}\n\n`
                + sectionRaw.trim() + '\n\n'
                + tailRaw.replace(/^\n+/, '');
            await writeFile(CHANGELOG, txt, 'utf8');
            console.log('changelog -> v' + ver, '(' + date + ')');
        }
    }

    // 第二步：校验当前版本确实留下了条目。定版成功会通过；漏记则每次都提醒。
    if (!hasVersion(txt)) {
        console.log('');
        console.log('  !!! CHANGELOG 漏记 !!! 当前版本是 v' + ver + '，但 CHANGELOG.md 里没有它的条目。');
        console.log('  请到「' + CHANGELOG_HEAD + '」段补上这一版改了什么（写清原因，不要只写「优化」「修复」），');
        console.log('  再重新 build，条目会自动定版为 v' + ver + '。');
        console.log('');
    }
}

await syncChangelog();

const build = new Date().toISOString().replace('T', ' ').slice(0, 16);

const HEADER = `// ==UserScript==
// @name         Via 视频嗅探播放器
// @name:en      Via Video Sniffer & Player
// @namespace    viamodes.local
// @version      ${ver}
// @vvbuild      ${build}
// @author       ViaModes
// @description  网页视频嗅探 + 全屏播放器：网页铺满（把站点播放器放大到可视区）、悬浮角标、mp4/m3u8 播放、手势调节音量亮度与快进、倍速、画质/音轨切换、进度记忆、锁屏、片头片尾、连播、调 Via 下载
// @description:en  Sniff web videos and play with a fullscreen player; page-fill mode enlarges the site's own player to the viewport (gestures, speed, resume, m3u8, next-episode, download)
// @match        http://*/*
// @match        https://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @connect      *
// @run-at       document-start
// @license      MIT
// ==/UserScript==
`;

let out = HEADER + '(function(){\n"use strict";\n';
out += `var VV_VERSION = ${JSON.stringify(ver)}, VV_BUILD = ${JSON.stringify(build)};\n`;
out += body;
out += '})();\n';
await writeFile(OUT, out, 'utf8');
console.log('built', OUT, out.length, 'bytes', 'v' + ver);
execFileSync(process.execPath, ['--check', OUT], { stdio: 'inherit' });
console.log('syntax OK');
