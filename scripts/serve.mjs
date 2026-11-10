import http from 'node:http';
import { createReadStream, readFileSync, appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createHash } from 'node:crypto';

const root = process.cwd();
const port = Number(process.env.PORT || 8099);
const HLS_CACHE = join(root, '.tmp', 'hlscache');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8'
};

http.createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent((req.url || '/').split('?')[0]);
    // ---- 真机/模拟器探针上报 ----
    // 多标签场景没法靠桌面自动化读页面状态（每个标签是独立 WebView），
    // 所以让被测页面自己把状态 POST 回来，落成一行行 JSON 直接看时间线。
    if (pathname === '/__report' && req.method === 'POST') {
      let body = '';
      req.on('data', (c) => { body += c; if (body.length > 200000) req.destroy(); });
      req.on('end', () => {
        try {
          mkdirSync(join(root, '.tmp'), { recursive: true });
          appendFileSync(join(root, '.tmp', 'report.log'), body.trim() + '\n');
        } catch (e) {}
        res.statusCode = 204;
        res.end();
      });
      return;
    }
    if (pathname === '/__report/clear') {
      try {
        mkdirSync(join(root, '.tmp'), { recursive: true });
        writeFileSync(join(root, '.tmp', 'report.log'), '');
      } catch (e) {}
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('cleared');
      return;
    }
    if (pathname.endsWith('/')) pathname += 'index.html';
    // 破缓存别名：Via 按 URL 路径缓存子资源，加 ?t= 时间戳和 Cache-Control: no-store 都不管用，
    // 改了产品代码照样跑旧版（真机上排查了很久才发现）。测试页改用一个全新路径，
    // 服务器统一映射回构建产物，这样缓存永远命中不了。
    if (/^\/dist\/vv-\d+\.js$/.test(pathname)) pathname = '/dist/via-video-player.user.js';
    // 测试页同理：Via 的 WebView 缓存是"按 URL 路径"的，带 ?t= 或 Cache-Control 都拦不住，
    // 改了页面照样跑旧的（诊断字段都对不上，白测一轮）。用带版本号的路径别名强制换 key。
    if (/^\/e2e\/mumu-tab-[A-Za-z0-9._-]+\.html$/.test(pathname)) pathname = '/e2e/mumu-tab.html';
    // 选集真机测试台同理：每轮换一个别名路径，避开 Via 按 URL 路径命中的缓存
    if (/^\/e2e\/episodes-android-[A-Za-z0-9._-]+\.html$/.test(pathname)) pathname = '/e2e/episodes-android.html';
    // 小窗 / 导出浮层真机测试台同理
    if (/^\/e2e\/pip-share-android-[A-Za-z0-9._-]+\.html$/.test(pathname)) pathname = '/e2e/pip-share-android.html';
    // 播放态模糊层帧率探针同理
    if (/^\/e2e\/perf-play-android-[A-Za-z0-9._-]+\.html$/.test(pathname)) pathname = '/e2e/perf-play-android.html';
    // 画质红线真机验证台同理
    if (/^\/e2e\/quality-android-[A-Za-z0-9._-]+\.html$/.test(pathname)) pathname = '/e2e/quality-android.html';
    if (/^\/e2e\/open-ab-android-[A-Za-z0-9._-]+\.html$/.test(pathname)) pathname = '/e2e/open-ab-android.html';
    if (/^\/e2e\/open-ab-hls-android-[A-Za-z0-9._-]+\.html$/.test(pathname)) pathname = '/e2e/open-ab-hls-android.html';
    // HLS 对照页的「网页臂」必须用插件内联的同一份 hls.js（light 构建），
    // 否则比的是 hls.js 两个构建的差异，不是播放器本身的差异。
    if (/^\/e2e\/vendor\/hls-light(?:-[A-Za-z0-9._-]+)?\.js$/.test(pathname)) pathname = '/vendor/hls.light.min.js';
    if (/^\/e2e\/vendor\/hls-[A-Za-z0-9._-]+\.js$/.test(pathname)) pathname = '/e2e/vendor/hls.min.js';
    // HLS 镜像代理：/__hls?u=<远程绝对地址>
    // 为什么需要：公网测试流（mux / test-videos）从国内拉一个 1080p 分片要 20s+，
    // 两臂都卡在网络上，量出来的只是 CDN 速度。这里把清单和分片按 URL 缓存到本地磁盘，
    // 第一次慢、之后两臂都走 loopback，才是「播放器本身的差异」。
    // 清单里的相对地址会被改写成同样的代理地址（子清单 / 分片都是相对路径）。
    if (pathname === '/__hls') {
      const q = new URL(req.url, 'http://x');
      const target = q.searchParams.get('u') || '';
      if (!/^https?:\/\//.test(target)) { res.statusCode = 400; res.end('400 bad u'); return; }
      const key = createHash('sha1').update(target).digest('hex');
      const ext = (/\.[A-Za-z0-9]+$/.exec(target.split('?')[0]) || ['.bin'])[0];
      const isPlaylist = ext === '.m3u8';
      const cacheFile = join(HLS_CACHE, key + ext);
      let buf = null;
      try { if (!isPlaylist) buf = readFileSync(cacheFile); } catch (e) {}
      if (!buf) {
        const up = await fetch(target, {
          headers: {
            // 部分 CDN 对非浏览器 UA 限速；带上移动 UA 更接近真实播放
            'user-agent': 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/110 Mobile Safari/537.36',
            accept: '*/*'
          }
        });
        if (!up.ok) {
          res.statusCode = up.status;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end('upstream ' + up.status + ' ' + target);
          return;
        }
        buf = Buffer.from(await up.arrayBuffer());
        if (!isPlaylist) {
          try { mkdirSync(HLS_CACHE, { recursive: true }); writeFileSync(cacheFile, buf); } catch (e) {}
        }
      }
      let body = buf, ct = isPlaylist ? 'application/vnd.apple.mpegurl' : 'video/mp2t';
      if (isPlaylist) {
        const prox = (u) => '/__hls?u=' + encodeURIComponent(new URL(u, target).href);
        body = Buffer.from(buf.toString('utf8').split('\n').map((line) => {
          const s = line.trim();
          if (!s) return line;
          if (s[0] !== '#') return prox(s);                       // 子清单 / 分片
          return line.replace(/URI="([^"]+)"/g, (_m, u) => 'URI="' + prox(u) + '"');  // KEY / MAP
        }).join('\n'));
      }
      res.setHeader('Content-Type', ct);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.setHeader('Content-Length', String(body.length));
      res.end(body);
      return;
    }
    // 防盗链测试端点：没有 Referer 一律 403，用来验证"外链自检"能识别出防盗链
    if (pathname === '/guard/stream.m3u8') {
        if (!req.headers.referer) {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('403 referer required');
            return;
        }
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Cache-Control', 'no-store');
        res.end('#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:6\n#EXT-X-ENDLIST\n');
        return;
    }
    // 压测用的动态大响应：/__blob?kb=1500&ct=text/javascript&seed=mp4
    // 用来复现"重站"场景（几十个 JS bundle、大 JSON 接口）。
    // seed=mp4 时正文里掺满 .mp4 字样——专门验证"大响应即使含视频链接也不该被整份读进来"。
    if (pathname === '/__blob') {
      const q = new URL(req.url, 'http://x');
      const kb = Math.min(8192, Math.max(1, Number(q.searchParams.get('kb')) || 1));
      const ct = q.searchParams.get('ct') || 'text/plain; charset=utf-8';
      const size = kb * 1024;
      const line = q.searchParams.get('seed') === 'mp4'
        ? Buffer.from('/media/clip-0001.mp4\n')
        : Buffer.from('x'.repeat(63) + '\n');
      const buf = Buffer.alloc(size);
      for (let o = 0; o < size; o += line.length) line.copy(buf, o, 0, Math.min(line.length, size - o));
      res.setHeader('Content-Type', ct);
      res.setHeader('Content-Length', String(size));
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-VV-Blob', String(size));
      res.end(buf);
      return;
    }
    const file = normalize(join(root, pathname));
    if (!file.startsWith(normalize(root))) {
      res.statusCode = 403;
      res.end('403');
      return;
    }
    const info = await stat(file);
    if (!info.isFile()) throw new Error('not file');
    res.setHeader('Content-Type', TYPES[extname(file).toLowerCase()] || 'application/octet-stream');
    // 必须 no-store 而不是 no-cache：Via 的 WebView 会忽略 no-cache 直接吃本地缓存，
    // 结果改了产品代码仍跑旧版脚本，自动化结论会完全反过来（真机上排查了很久才发现）。
    // 连 ?t= 时间戳都不管用——它按路径缓存，所以只能从响应头禁掉。
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // 支持 Range，否则浏览器会把 mp4 视为不可 seek（seekable = [0,0]）
    // ?noRange=1 用于测试“服务器不支持跳转”的提示
    const range = req.headers.range;
    const noRange = /(?:\?|&)noRange=1(?:&|$)/.test(req.url || '');
    if (range && !noRange) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (m) {
        let start = m[1] ? parseInt(m[1], 10) : 0;
        let end = m[2] ? parseInt(m[2], 10) : info.size - 1;
        if (isNaN(start)) start = 0;
        if (isNaN(end) || end >= info.size) end = info.size - 1;
        if (start > end || start >= info.size) {
          res.statusCode = 416;
          res.setHeader('Content-Range', `bytes */${info.size}`);
          res.end();
          return;
        }
        res.statusCode = 206;
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Range', `bytes ${start}-${end}/${info.size}`);
        res.setHeader('Content-Length', end - start + 1);
        createReadStream(file, { start, end }).pipe(res);
        return;
      }
    }

    if (!noRange) res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', info.size);
    createReadStream(file).pipe(res);
  } catch (e) {
    res.statusCode = 404;
    res.end('404');
  }
}).listen(port, () => {
  console.log(`e2e server http://localhost:${port}/`);
});
