// 限速静态服务：只为复现「慢视频资源下播放器的判据」，不是给生产用的。
//
// 用法：
//   node scripts/slow-serve.mjs
//   SLOW_PORT=8102 VERBOSE=1 node scripts/slow-serve.mjs
//   打开 http://127.0.0.1:8102/e2e/media/bb720.mp4?kbps=8
//
// 查询参数：
//   kbps=8        限速（KB/s），按 50ms 一片发送，带背压，不会一次性灌满缓冲区
//   stallAfter=N  发到第 N 字节后停住（模拟 CDN 抖动：TCP 不断、媒体元素只会等）
//   stallMs=N     停多久再继续；给个很大的值就是「假活源」（连着但一个字节也不来）
//
// VERBOSE=1 每秒打一行实际发出的字节数——限速实现写错时（比如没背压）从这一行就能
// 看出实际吞吐和 kbps 对不上，避免把服务自身的 bug 当成播放器的结论。
import http from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { join, normalize, sep } from 'node:path';

const ROOT = process.cwd();
const PORT = Number(process.env.SLOW_PORT || 8102);
const VERBOSE = !!process.env.VERBOSE;
// 只允许读工作区内的文件：这是本地测试服务，但别给路径穿越留口子
const GUARD = ROOT + sep;

function pickFile(pathname) {
    const file = normalize(join(ROOT, decodeURIComponent(pathname)));
    if (file !== ROOT && !file.startsWith(GUARD)) return null;
    try {
        const st = statSync(file);
        return st.isFile() ? { file, total: st.size } : null;
    } catch (e) {
        return null;
    }
}

// HLS 用：清单与分片的 MIME 必须分开给，别一律当 video/mp4
function mimeOf(file) {
    if (/\.m3u8?$/i.test(file)) return 'application/vnd.apple.mpegurl';
    if (/\.ts$/i.test(file)) return 'video/mp2t';
    if (/\.m4s$/i.test(file)) return 'video/iso.segment';
    return 'video/mp4';
}

const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://127.0.0.1');
    if (u.pathname === '/health') { res.end('ok'); return; }
    // 页面测试台跑在另一个端口（serve.mjs），限速资源在本地就是跨源：
    // hls.js 用 XHR 取清单和分片，没有这几个头会直接判网络失败，
    // 于是「慢」被误当成「源坏了」，测出来的是错的东西。
    const cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges'
    };
    if (req.method === 'OPTIONS') {
        res.writeHead(204, cors);
        res.end();
        return;
    }
    const hit = pickFile(u.pathname);
    if (!hit) { res.writeHead(404, cors); res.end('no file'); return; }

    const kbps = Math.max(1, Number(u.searchParams.get('kbps') || 8));
    const stallAfter = Number(u.searchParams.get('stallAfter') || 0);
    const stallMs = Number(u.searchParams.get('stallMs') || 0);
    const total = hit.total;
    let start = 0, end = total - 1, code = 200;
    const rg = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    if (rg) {
        if (rg[1]) start = Number(rg[1]);
        if (rg[2]) end = Number(rg[2]);
        code = 206;
    }
    const len = end - start + 1;
    const head = {
        'Content-Type': mimeOf(hit.file),
        'Content-Length': String(len),
        'Accept-Ranges': 'bytes',
        // 别让浏览器缓存替我们省掉流量：这个服务就是在量"没缓存时慢慢下"的行为
        'Cache-Control': 'no-store',
        ...cors
    };
    if (code === 206) head['Content-Range'] = `bytes ${start}-${end}/${total}`;
    res.writeHead(code, head);
    res.flushHeaders && res.flushHeaders();

    const t0 = Date.now();
    const part = Math.max(256, Math.round((kbps * 1024) / 20)); // 每 50ms 一片
    let sent = 0, closed = false, lastLog = Date.now(), stalled = false;
    req.on('close', () => { closed = true; });
    const rs = createReadStream(hit.file, { start, end, highWaterMark: part });
    rs.on('data', (b) => {
        rs.pause();
        if (closed) return;
        res.write(b);
        sent += b.length;
        if (VERBOSE && Date.now() - lastLog > 1000) {
            lastLog = Date.now();
            const secs = (Date.now() - t0) / 1000;
            console.log(`  ${secs.toFixed(1)}s sent=${sent}B (${Math.round(sent / secs / 1024)}KB/s)`);
        }
        if (stallAfter && !stalled && sent >= stallAfter) {
            stalled = true;
            console.log(`  [stall] ${sent}B 处停 ${stallMs}ms`);
            setTimeout(() => { if (!closed) rs.resume(); }, stallMs);
            return;
        }
        setTimeout(() => { if (!closed) rs.resume(); }, 50);
    });
    rs.on('end', () => { if (!closed) res.end(); });
    rs.on('error', () => { try { res.end(); } catch (e) {} });
});

server.listen(PORT, '127.0.0.1', () => console.log('slow serve on', PORT));
