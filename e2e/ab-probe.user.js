// ==UserScript==
// @name         AB 探针（真机有/无脚本对照用，不是产品脚本）
// @namespace    viamodes.local.abprobe
// @version      1
// @match        http://*/*
// @match        https://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      127.0.0.1
// @run-at       document-start
// ==/UserScript==

// 目的：给「真实站点上有脚本 vs 无脚本」的对照提供一个**两臂完全相同**的度量探针。
//
// 为什么必须两边都装它：真实站点是 https，页面内的 fetch 打不到 http://127.0.0.1
// （混合内容会被拦），只能靠 GM_xmlhttpRequest 这条 native 通道上报。而产品脚本里没有
// 上报代码（也不该为测试加）。所以把探针独立成一条极小的脚本，两臂都装、都上报，
// 唯一的变量就是主脚本 enabled=0 还是 1 —— 探针本身的开销在两边一样，抵消掉了。
//
// 上报：整页 onload 之后再等 300ms，把 Navigation Timing 与首个内容绘制发回本地服务。
(function () {
    'use strict';
    var PORT = 8099;
    var T0 = (window.performance && performance.now) ? performance.now() : 0;
    var sent = false;

    function navEntry() {
        try {
            var es = performance.getEntriesByType('navigation');
            if (es && es.length) return es[0];
        } catch (e1) {}
        return null;
    }
    function fcp() {
        try {
            var ps = performance.getEntriesByType('paint') || [];
            for (var i = 0; i < ps.length; i++) {
                if (ps[i].name === 'first-contentful-paint') return ps[i].startTime;
            }
        } catch (e2) {}
        return -1;
    }
    // 主脚本是否真的注入了。判据只用**我们自己的**标记，不能用 window.Hls：
    // 站点自己带一份 hls.js 太常见了，那样「无脚本」臂会被误判成有脚本。
    //   __vvHlsCtor 由 dist 里的 vendor 执行后立刻挂上，是我们独有的；
    //   我们的 DOM 类名（vv-badge / vv-player-root / vv-panel-wrap）站点不会撞。
    function injected() {
        try {
            if (window.__vvHlsCtor) return true;
            if (document.querySelector('.vv-badge, .vv-player-root, .vv-panel-wrap')) return true;
        } catch (e3) {}
        return false;
    }

    // 不靠 URL 参数来「武装」：真实站点会重定向并丢掉查询串（CCTV 实测 ?vvmab=1 被吃掉），
    // 那样探针永远不干活。改成装上就上报；驱动每轮开始前删掉 vvmab_last，再按时间戳认新一轮。

    // 上报走 GM_setValue 而不是 HTTP：真机实测在 **https 页面**上，GM_xmlhttpRequest 打
    // http://127.0.0.1 会被 WebView 的明文/混合内容策略拦掉（readyState=4、status=0），
    // 而同一个探针在 http 本地页上能正常发出。GM_setValue 写的是 Via 自己的 variables 表，
    // 驱动再用 adb 读库，绕过整个网络策略问题。
    function post(payload) {
        if (sent) return;
        sent = true;
        payload.tag = 'ab';
        payload.t = Date.now();
        var json = JSON.stringify(payload);
        // 诊断先写：权限是按脚本头的 @grant 解析的，缺了就静默不写，光看结果分不清
        // 「没跑」还是「没权限」。这条永远最先落库。
        try {
            GM_setValue('vvmab_diag', JSON.stringify({
                set: typeof GM_setValue, xhr: typeof GM_xmlhttpRequest,
                why: payload.why || '', at: Date.now()
            }));
        } catch (e0) {}
        try { GM_setValue('vvmab_last', json); } catch (e4) {}
        // 顺带还试一次 HTTP：http 页面能用，落 report.log 更直观；失败无所谓
        try {
            if (typeof GM_xmlhttpRequest === 'function') {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: 'http://127.0.0.1:' + PORT + '/__report',
                    data: json,
                    headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
                });
            }
        } catch (e5) {}
    }

    function collect() {
        var n = navEntry();
        var out = {
            url: location.href.slice(0, 120),
            t0: +(T0 || 0).toFixed(1),
            injected: injected(),
            // 有 Navigation Timing L2 就用它（不受时区与旧 API 精度影响）
            fcp: +fcp().toFixed(1),
            dcl: n ? +n.domContentLoadedEventEnd.toFixed(1) : -1,
            // load 没触发就写 -1：写 0 会被当成"0ms 就 load 完了"，比缺值更误导
            loadEnd: (n && loadFired && n.loadEventEnd > 0) ? +n.loadEventEnd.toFixed(1) : -1,
            domInteractive: n ? +n.domInteractive.toFixed(1) : -1,
            responseEnd: n ? +n.responseEnd.toFixed(1) : -1,
            transferKb: n && n.transferSize ? Math.round(n.transferSize / 1024) : 0,
            // 仅作诊断：探针实际排在主脚本之后，这个差值基本恒 0，量不到主脚本开销，
            // 不要把当结论用（主脚本的页面级代价看 dcl / fcp 的臂间差）
            firstTask: FT >= 0 ? +(FT - T0).toFixed(1) : -1
        };
        return out;
    }

    // 采集时机：**不能等 load**。国内重站点（广告、统计、长尾请求）经常十几秒都不触发 load，
    // 实测在 CCTV 视频页上等到 20s 都没报上来。改成 DOMContentLoaded + 600ms 固定窗口，
    // 两臂用同一个窗口才可比；再用 12s 硬兜底，页面连 DCL 都卡住时也有数。
    var loadFired = false;
    window.addEventListener('load', function () { loadFired = true; }, { once: true });
    var done = false;
    function finish(why) {
        if (done) return;
        done = true;
        var d = collect();
        d.why = why;
        d.loadFired = loadFired;
        post(d);
    }

    // document-start 级别的脚本都是同步执行完才进任务队列的，所以「第一个宏任务开始」的时刻
    // 已经在所有脚本之后。它减去探针自己的起点，就含了主脚本的执行耗时——这是真实站点上
    // 难得能拿到的「脚本本身花多少」的直接证据，不必靠页面加载总时长去差。
    var FT = -1;
    setTimeout(function () { FT = performance.now(); }, 0);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { setTimeout(function () { finish('dcl'); }, 600); });
    } else {
        setTimeout(function () { finish('now'); }, 600);
    }
    setTimeout(function () { finish('hard'); }, 12000);
})();
