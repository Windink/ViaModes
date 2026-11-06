import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const SRC = 'src';
const OUT = 'dist/via-video-player.user.js';
const VER_FILE = '.version';
const HASH_FILE = '.tmp/build.hash';
const MODULES = ['00-core.js', '10-sniffer.js', '11-style.js', '20-ui.js', '30-player.js', '31-player-x.js', '32-share.js', '33-multiplayer.js', '40-menu.js', '50-boot.js'];

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
if (prevHash !== hash) {
    const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(ver);
    ver = m ? `${m[1]}.${m[2]}.${Number(m[3]) + 1}` : '0.1.4';
    await writeFile(VER_FILE, ver + '\n', 'utf8');
    console.log('version ->', ver, '(source changed)');
} else {
    console.log('version stays', ver, '(no source change)');
}
try { await writeFile(HASH_FILE, hash + '\n', 'utf8'); } catch (e) {}

const build = new Date().toISOString().replace('T', ' ').slice(0, 16);

const HEADER = `// ==UserScript==
// @name         Via 视频嗅探播放器
// @name:en      Via Video Sniffer & Player
// @namespace    viamodes.local
// @version      ${ver}
// @vvbuild      ${build}
// @author       ViaModes
// @description  网页视频嗅探 + 全屏播放器：悬浮角标、mp4/m3u8 播放、手势调节音量亮度与快进、倍速、画质/音轨切换、进度记忆、锁屏、片头片尾、连播、调 Via 下载
// @description:en  Sniff web videos and play with a Quark-style fullscreen player (gestures, speed, resume, m3u8, next-episode, download)
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
