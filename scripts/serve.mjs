import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = process.cwd();
const port = Number(process.env.PORT || 8099);

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
    if (pathname.endsWith('/')) pathname += 'index.html';
    // 破缓存别名：Via 按 URL 路径缓存子资源，加 ?t= 时间戳和 Cache-Control: no-store 都不管用，
    // 改了产品代码照样跑旧版（真机上排查了很久才发现）。测试页改用一个全新路径，
    // 服务器统一映射回构建产物，这样缓存永远命中不了。
    if (/^\/dist\/vv-\d+\.js$/.test(pathname)) pathname = '/dist/via-video-player.user.js';
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
