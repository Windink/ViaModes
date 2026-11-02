const rx = /(?:https?:)?\/\/[^\s"'`<>\\)\]{}]{8,600}?\.(?:m3u8|mp4|m4v|webm|mkv|flv|f4v)(?:\?[^\s"'`<>\)\]{}]{0,300})?/gi;
const text = 'var s="https://cdn.b.com/hls/01.m3u8"; also https://x.com/a.mp4 and https://x.com/pic.png';
let m, n = 0;
while ((m = rx.exec(text)) !== null) { n++; console.log(n, JSON.stringify(m[0])); }
const rx2 = /(?:https?:)?\/\/[^\s"'`<>\\)\]{}]{8,600}?\.mp4/g;
console.log('R2', JSON.stringify(rx2.exec('also https://x.com/a.mp4 and')));
