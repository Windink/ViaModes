import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const SRC = 'src';
const OUT = 'dist/via-video-player.user.js';
const VER_FILE = '.version';
const HASH_FILE = '.tmp/build.hash';
const MODULES = ['00-core.js', '10-sniffer.js', '11-style.js', '20-ui.js', '30-player.js', '31-player-x.js', '32-share.js', '33-multiplayer.js', '40-menu.js', '45-pagefs.js', '46-episodes.js', '50-boot.js'];

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
    + ' | 本副本为官方 dist/hls.light.min.js 原样内联（仅去掉 sourceMappingURL 注释行），'
    + '以字符串形式随脚本分发、首次播放 m3u8 时才编译；许可证全文见 vendor/LICENSE-hlsjs 与 vendor/LICENSE-Apache-2.0 */';

if (existsSync('vendor/hls.light.min.js')) {
    const size = (await statSync('vendor/hls.light.min.js')).size;
    if (size > 20000) {
        let vendor = await readFile('vendor/hls.light.min.js', 'utf8');
        // 去掉 sourceMappingURL：产物里没有 .map 文件，留着只会让开发者工具反复找 404。
        vendor = vendor.replace(/\n?\/\/#\s*sourceMappingURL=[^\n]*\s*$/, '');
        // 按需编译：hls.js 占产物体积的一大半（~386KB），但绝大多数页面根本不播 m3u8。
        // 原先在 document-start 直接执行，等于每个页面都完整解析一遍这份代码。
        // 改成字符串字面量后，引擎只需扫描字符串、不建 AST 也不生成字节码，
        // 真正编译推迟到首次播放 HLS（见 src/30-player.js 的 vvCompileHlsInline）。
        //
        // 用模板字面量承载：源码里的引号不用转义，只把反斜杠转一次（108 处），
        // 体积几乎等于原文件；JSON.stringify 会额外转义 5000 多个双引号，白白多 5KB。
        // 前提是源码里不能出现反引号或 `${`（否则会被当成插值）。当前 hls.js 两者都没有，
        // 但换版本时可能出现——这里做校验，命中就自动回退到 JSON 转义，绝不产出坏产物。
        const tmplSafe = vendor.indexOf('`') < 0 && vendor.indexOf('${') < 0;
        const inline = tmplSafe
            ? '`' + vendor.replace(/\\/g, '\\\\') + '`'
            : JSON.stringify(vendor)
                .replace(/\u2028/g, '\\u2028')
                .replace(/\u2029/g, '\\u2029');
        body += 'var VV_HLS_URLS = ["https://fastly.jsdelivr.net/npm/hls.js@1/dist/hls.light.min.js","https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.light.min.js","https://unpkg.com/hls.js@1/dist/hls.light.min.js"];\n';
        body += HLS_BANNER + '\n';
        body += 'var VV_HLS_INLINE = ' + inline + ';\n';
        console.log('vendor hls.js inlined as source:', size, 'bytes (compiled on demand,',
            tmplSafe ? 'template literal' : 'json escaped', ')');
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
// 约定：每次改动（含只改文档 / 注释 / 测试）先把要点写进 CHANGELOG.md 的「未发布」段。
// 只要「未发布」有内容、且当前版本还没被任何条目覆盖，就自动定版并补一个空的「未发布」段。
//
// 允许「几个版本写成一条」：条目可以是单版本 `## v0.1.53 — 日期`，
// 也可以是区间 `## v0.1.53–v0.1.55 — 日期`（区间内的版本都算已记录）。
// 定版时会自己算起点：从「已记录的最高版本 + 1」到当前版本，跳了几版就写成区间，
// 所以中间那些过渡版本不用单独成条。
//
// 定版条件不看「本次构建版本有没有自增」，这样「先 build 后补记」的时序也能自愈；
// 若「未发布」为空且当前版本未被覆盖，则一直报警，直到补上为止。
// 只提醒不阻断：中间构建（调试期间的连续 build）不该被卡住。
const CHANGELOG = 'CHANGELOG.md';
const CHANGELOG_HEAD = '## 未发布';

const parseVer = (s) => String(s).split('.').map(Number);
const cmpVer = (a, b) => (a[0] - b[0]) || (a[1] - b[1]) || (a[2] - b[2]);
// 标题两种写法：`## v0.1.53 — 日期`、`## v0.1.53–v0.1.55 — 日期`
const TITLE_RE = /^## v(\d+\.\d+\.\d+)(?:\s*(?:[–—~-]|至)\s*v?(\d+\.\d+\.\d+))?/gm;

function loggedRanges(txt) {
    const out = [];
    TITLE_RE.lastIndex = 0;
    let m;
    while ((m = TITLE_RE.exec(txt)) !== null) {
        out.push([parseVer(m[1]), parseVer(m[2] || m[1])]);
    }
    return out;
}

// 当前版本是否已被某条记录覆盖（单版本精确匹配，或落在区间内）
function isCovered(txt) {
    const cur = parseVer(ver);
    return loggedRanges(txt).some(([lo, hi]) => cmpVer(cur, lo) >= 0 && cmpVer(cur, hi) <= 0);
}

async function syncChangelog() {
    let txt = '';
    try { txt = await readFile(CHANGELOG, 'utf8'); } catch (e) {
        console.log('\n  !!! 找不到 CHANGELOG.md，本次改动没有任何版本记录。\n');
        return;
    }

    // 第一步：当前版本未被覆盖，就把「未发布」段定版上去
    if (!isCovered(txt)) {
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
            // 起点 = 已记录的最高版本 + 1；跨了几版就写成区间，避免中间版号也要单独成条
            const ranges = loggedRanges(txt);
            const cur = parseVer(ver);
            let start = ver;
            if (ranges.length) {
                let hi = ranges[0][1];
                for (const r of ranges) if (cmpVer(r[1], hi) > 0) hi = r[1];
                // 只在同一 minor 下推算，跨 minor 时保守地只记当前版本
                if (hi[0] === cur[0] && hi[1] === cur[1] && hi[2] + 1 < cur[2]) {
                    start = `${cur[0]}.${cur[1]}.${hi[2] + 1}`;
                }
            }
            const title = start === ver ? `## v${ver}` : `## v${start}–v${ver}`;
            const date = new Date().toISOString().slice(0, 10);
            txt = txt.slice(0, headAt)
                + CHANGELOG_HEAD + '\n\n'
                + `${title} — ${date}\n\n`
                + sectionRaw.trim() + '\n\n'
                + tailRaw.replace(/^\n+/, '');
            await writeFile(CHANGELOG, txt, 'utf8');
            console.log('changelog -> ' + title.slice(3), '(' + date + ')');
        }
    }

    // 第二步：校验当前版本确实被某条记录覆盖。定版成功会通过；漏记则每次都提醒。
    if (!isCovered(txt)) {
        console.log('');
        console.log('  !!! CHANGELOG 漏记 !!! 当前版本是 v' + ver + '，但没有任何条目覆盖到它。');
        console.log('  请到「' + CHANGELOG_HEAD + '」段补上这几版改了什么（写清原因，不要只写「优化」「修复」），');
        console.log('  再重新 build；跨了几个版本会自动合并成 `## v起始–v' + ver + '`。');
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
