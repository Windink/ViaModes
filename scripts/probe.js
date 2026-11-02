const fs = require('fs');
const s = fs.readFileSync('dist/via-video-player.user.js', 'utf8');
console.log('len', s.length);
console.log('tail30', JSON.stringify(s.slice(-30)));
console.log('endsWith', s.endsWith('})();'));
const lit = '})();';
console.log('litcode', [...lit].map(c => c.charCodeAt(0)));
console.log('byCode', s.endsWith(String.fromCharCode(125, 41, 40, 41, 59)));
console.log('bySlice', s.slice(-5) === '})();');
console.log('sliceCode', [...s.slice(-5)].map(c => c.charCodeAt(0)));
console.log('litChar', '})'.length + '();'.length, JSON.stringify('})();'));
for (let i = 0; i < 5; i++) {
    console.log(i, 'file', s.charCodeAt(s.length - 6 + i), 'lit', '})();'.charCodeAt(i));
}
const t = require('fs').readFileSync('dist/via-video-player.user.js', 'utf8');
const p = 'window.__vvTest';
const tt = t.replace(/\}\(\)\;\s*$/, p + '})();');
console.log('smoke-replace worked:', tt.includes(p));
