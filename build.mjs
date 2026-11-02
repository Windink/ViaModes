import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const SRC = 'src';
const OUT = 'dist/via-video-player.user.js';
const MODULES = ['00-core.js', '10-sniffer.js', '11-style.js', '20-ui.js', '30-player.js', '31-player-x.js', '32-share.js', '33-multiplayer.js', '40-menu.js', '50-boot.js'];

const HEADER = `// ==UserScript==
// @name         Via 视频嗅探播放器
// @name:en      Via Video Sniffer & Player
// @namespace    viamodes.local
// @version      0.1.3
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

if (existsSync('vendor/hls.light.min.js')) {
    const size = (await statSync('vendor/hls.light.min.js')).size;
    if (size > 20000) {
        let vendor = await readFile('vendor/hls.light.min.js', 'utf8');
        out += 'var VV_HLS_URLS = ["https://fastly.jsdelivr.net/npm/hls.js@1/dist/hls.light.min.js","https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.light.min.js","https://unpkg.com/hls.js@1/dist/hls.light.min.js"];\n';
        out += '(function(){try{' + vendor + '}catch(e){}})();\n';
        // 站点常在之后注入自家魔改版 hls.js（某电视台的 1.6.7-ch 就是），会覆盖 window.Hls。
        // 先把我们这份干净的标准版引用抓在全局上，播放时优先用它，避免被页面定制版接管。
        out += 'try{ if (window.Hls) window.__vvHlsCtor = window.Hls; }catch(e){}\n';
        console.log('vendor hls.js inlined:', size, 'bytes');
    }
} else {
    out += 'var VV_HLS_URLS = ["https://fastly.jsdelivr.net/npm/hls.js@1/dist/hls.light.min.js","https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.light.min.js","https://unpkg.com/hls.js@1/dist/hls.light.min.js"];\n';
    console.log('vendor hls.js missing, runtime CDN fallback only');
}

for (const f of MODULES) {
    let code = await readFile(`${SRC}/${f}`, 'utf8');
    code = code.replace(/^\s*(['"])use strict\1;?\s*$/m, '');
    out += code.trim() + '\n';
}

out += '})();\n';
await writeFile(OUT, out, 'utf8');
console.log('built', OUT, out.length, 'bytes');
execFileSync(process.execPath, ['--check', OUT], { stdio: 'inherit' });
console.log('syntax OK');
