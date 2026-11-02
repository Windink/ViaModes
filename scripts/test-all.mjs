// 全套测试编排：一条命令跑完所有层级
//   node scripts/test-all.mjs
// 层级：构建 → 单元 smoke → 浏览器 e2e → UI 功能矩阵 → 性能基准 → 浮层截图 → 加载进度截图
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const run = (label, cmd, args, env) => new Promise((resolve) => {
    console.log('\n============================================================');
    console.log('▶ ' + label);
    console.log('============================================================');
    const t0 = Date.now();
    const p = spawn(process.execPath, [cmd, ...args], {
        cwd: process.cwd(),
        env: { ...process.env, ...(env || {}) },
        stdio: 'inherit'
    });
    p.on('exit', (code) => {
        const secs = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(`\n—— ${label}: ${code === 0 ? '通过' : '失败(退出码 ' + code + ')'}  耗时 ${secs}s ——`);
        resolve({ label, code, secs });
    });
});

// 端口分配：避开常用端口，防止冲突
const base = 8070 + (Number(process.env.PORT_OFFSET) || 0);
const ports = { e2e: base, ui: base + 1, bench: base + 2, share: base + 3, load: base + 4 };

const results = [];

results.push(await run('① 构建 + 语法检查', 'build.mjs', []));

results.push(await run('② 单元烟雾测试（Node vm）', 'scripts/smoke.mjs', []));

results.push(await run('③ 浏览器端到端验证（真实 HLS）', 'scripts/e2e-verify.mjs', [], { PORT: String(ports.e2e) }));

results.push(await run('④ UI 功能矩阵（真实事件）', 'scripts/ui-verify.mjs', [], { PORT: String(ports.ui) }));

results.push(await run('⑤ 性能基准 + 截图', 'scripts/bench.mjs', [], { PORT: String(ports.bench) }));

results.push(await run('⑥ 外部播放器浮层截图', 'scripts/share-shot.mjs', [], { PORT: String(ports.share) }));

results.push(await run('⑦ 加载进度界面截图', 'scripts/load-shot.mjs', [], { PORT: String(ports.load) }));

console.log('\n\n################ 总览 ################');
let failed = 0;
for (const r of results) {
    if (r.code !== 0) failed++;
    console.log(`${r.code === 0 ? '✔' : '✘'}  ${r.label}  (${r.secs}s)`);
}
console.log(`\n${failed === 0 ? '全部通过' : failed + ' 项失败'}`);
process.exit(failed ? 1 : 0);
