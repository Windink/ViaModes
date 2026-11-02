// ===== 外链导出与兼容性自检 =====
// 站内能播、把链接丢给 VLC / MX / N_m3u8DL 就失败，几乎只有三种原因：
//   1. 防盗链：CDN 校验 Referer，缺了就 403
//   2. 鉴权：需要页面 Cookie / Authorization，外部播放器没有
//   3. 签名过期或一次性令牌：链接离开页面就已经死了
// 这里把当前页面上下文打包成外部播放器能吃的格式，并做一次可复现的链路探测。

function vvShareName(item) {
    var n = '';
    try { n = vvSafeName((item && item.name) || 'video'); } catch (e) { n = 'video'; }
    return n.replace(/[,;]/g, ' ').replace(/[\r\n]+/g, ' ').slice(0, 60) || 'video';
}

function vvIsHls(url) {
    return /\.m3u8(?:$|[?#])/i.test(url || '');
}

// VLC / mpv / PotPlayer 都认这个 .m3u：把 Referer 和 UA 写进播放列表里
function vvBuildM3U(item) {
    var ua = '';
    try { ua = navigator.userAgent || ''; } catch (eU) {}
    var ref = '';
    try { ref = location.href || ''; } catch (eR) {}
    var lines = ['#EXTM3U', '#EXTINF:-1,' + vvShareName(item)];
    if (ref) lines.push('#EXTVLCOPT:http-referrer=' + ref);
    if (ua) lines.push('#EXTVLCOPT:http-user-agent=' + ua);
    if (vvIsHls(item.url)) lines.push('#EXTVLCOPT:network-caching=3000');
    lines.push(item.url);
    return lines.join('\n');
}

function vvBuildCmd(item) {
    var ua = '';
    try { ua = navigator.userAgent || ''; } catch (eU) {}
    var ref = '';
    try { ref = location.href || ''; } catch (eR) {}
    var ext = vvIsHls(item.url) ? '.m3u8' : '.mp4';
    var q = function (s) { return '"' + String(s).replace(/"/g, '\\"') + '"'; };
    return 'curl -L --retry 2 -A ' + q(ua) + ' -e ' + q(ref) +
        ' -o ' + q(vvShareName(item) + ext) + ' ' + q(item.url);
}

function vvSaveText(name, text, mime) {
    try {
        var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.rel = 'noopener';
        document.documentElement.appendChild(a);
        a.click();
        setTimeout(function () {
            try { URL.revokeObjectURL(url); } catch (e1) {}
            try { a.parentNode.removeChild(a); } catch (e2) {}
        }, 4000);
        return true;
    } catch (e) { return false; }
}

// 生成 Android intent:// 链接：把播放交给「另一个 App」的独立进程去解码。
// 这就是那类浏览器能扛多路的关键——播放器在别的进程，
// 有自己的 MediaCodec 配额，一个崩了也不牵连页面。
// 脚本在 Via 的 WebView 里没有起 Activity 的权限，只能"请求"系统去起，
// 所以能不能成，取决于 Via 是否放行外部应用跳转。
function vvBuildIntent(item, mimeOverride) {
    var url = String((item && item.url) || '');
    var hash = url.indexOf('#');
    if (hash >= 0) url = url.slice(0, hash);
    var scheme = url.indexOf('https://') === 0 ? 'https' : 'http';
    var bare = url.replace(/^https?:\/\//, '');
    bare = bare.replace(/ /g, '%20').replace(/;/g, '%3B');
    var mime = mimeOverride ||
        (item && item.type === 'HLS' ? 'application/vnd.apple.mpegurl' :
            (item && item.type === 'MP4' ? 'video/mp4' : 'video/*'));
    return 'intent://' + bare + '#Intent;scheme=' + scheme +
        ';action=android.intent.action.VIEW;type=' + mime + ';end';
}

// 触发系统选择器：交给 VLC / MX / 系统播放器等任意外部播放器
function vvOpenExternal(item, mimeOverride) {
    try {
        var intent = vvBuildIntent(item, mimeOverride);
        var a = document.createElement('a');
        a.href = intent;
        a.style.display = 'none';
        a.rel = 'noopener';
        document.documentElement.appendChild(a);
        a.click();
        setTimeout(function () {
            try { if (a.parentNode) a.parentNode.removeChild(a); } catch (e) {}
        }, 3000);
        return true;
    } catch (e) {
        return false;
    }
}

// ---- 链路探测 ----
// 用三种请求模拟"外部播放器"的处境，比对着看状态码就知道缺的是 Referer 还是 Cookie。
function vvFetchProbe(url, opts, timeoutMs) {
    return new Promise(function (resolve) {
        var done = false;
        var t0 = Date.now();
        var timer = 0;
        var ctl = null;
        function fin(o) {
            if (done) return;
            done = true;
            if (timer) clearTimeout(timer);
            o.ms = Date.now() - t0;
            resolve(o);
        }
        try { ctl = new AbortController(); } catch (eC) {}
        timer = setTimeout(function () {
            fin({ ok: false, err: '超时 ' + Math.round((timeoutMs || 8000) / 1000) + 's' });
            try { if (ctl) ctl.abort(); } catch (eA) {}
        }, timeoutMs || 8000);
        try {
            var o = { method: 'GET', cache: 'no-store' };
            if (ctl) o.signal = ctl.signal;
            for (var k in (opts || {})) o[k] = opts[k];
            fetch(url, o).then(function (r) {
                fin({ ok: true, status: r.status });
            }).catch(function (e) {
                fin({ ok: false, err: String((e && e.message) || e) });
            });
        } catch (e) {
            fin({ ok: false, err: String((e && e.message) || e) });
        }
    });
}

// GM_xmlhttpRequest 走 Via 的 native 通道：不带 Referer、不带 Cookie，
// 行为和外部播放器最接近，而且不受 CORS 限制。
function vvGmProbe(url, timeoutMs) {
    return new Promise(function (resolve) {
        if (typeof GM_xmlhttpRequest !== 'function') { resolve(null); return; }
        var done = false;
        var t0 = Date.now();
        function fin(o) {
            if (done) return;
            done = true;
            o.ms = Date.now() - t0;
            resolve(o);
        }
        setTimeout(function () { fin({ ok: false, err: '超时' }); }, timeoutMs || 9000);
        try {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                timeout: timeoutMs || 9000,
                headers: {},
                onload: function (r) { fin({ ok: true, status: r.status, gm: true }); },
                onerror: function () { fin({ ok: false, err: '请求失败' }); },
                ontimeout: function () { fin({ ok: false, err: '超时' }); }
            });
        } catch (e) {
            fin({ ok: false, err: String((e && e.message) || e) });
        }
    });
}

function vvProbeText(label, r) {
    if (!r) return label + ': 不可用';
    if (!r.ok) return label + ': ' + r.err + ' (' + r.ms + 'ms)';
    return label + ': HTTP ' + r.status + ' (' + r.ms + 'ms)';
}

function vvJudgeProbe(bare, ref, ck) {
    function blocked(r) { return !!(r && r.ok && (r.status === 401 || r.status === 403)); }
    function good(r) { return !!(r && r.ok && r.status >= 200 && r.status < 400); }
    function corsFail(r) { return !!(r && !r.ok && /fetch|network|cors|load failed/i.test(r.err || '')); }
    if (blocked(bare) && (good(ref) || good(ck))) {
        return '防盗链：裸链 ' + bare.status + '，带 Referer 就通 → 用「导出 .m3u」交给外部播放器';
    }
    if (blocked(bare) && blocked(ck)) {
        return '令牌失效或 IP 绑定：带 Cookie 也 ' + bare.status + ' → 回页面重新嗅探一条新链接';
    }
    if (good(bare) && (ref || ck) && !good(ref) && !good(ck)) {
        return '加了请求头反而被拒 → 服务器挑 Referer，导出的 .m3u 需要换成别的 Referer';
    }
    if (good(bare)) {
        return '链接可移植：裸链就能拉 → 外部失败是播放器不支持该封装（HLS 用 VLC / mpv），或只认 UA';
    }
    if (corsFail(bare) && (!ck || corsFail(ck))) {
        return '页面内判不了（CORS 拦截），但外部播放器不受 CORS 限制 → 直接用 .m3u 试，别用浏览器验';
    }
    return '结果矛盾，看上面三行状态码：相同则是源的问题，只差在裸链则是请求头的问题';
}

// 返回 { lines: [...], verdict: '...' }
function vvShareProbe(item) {
    var url = item.url;
    var isHls = item.type === 'HLS' || vvIsHls(url);
    var bare = vvFetchProbe(url, { referrerPolicy: 'no-referrer', credentials: 'omit' }, 8000);
    var ref = vvFetchProbe(url, { referrer: location.href, referrerPolicy: 'strict-origin-when-cross-origin', credentials: 'omit' }, 8000);
    return Promise.all([bare, ref]).then(function (arr) {
        return vvGmProbe(url, 9000).then(function (gm) {
            var b = arr[0], r = arr[1];
            // 页面内带 Cookie 的对照：只在裸链失败时才跑，避免和 ACAO:* 冲突产生假阴性
            var ckP = (b.ok && b.status >= 200 && b.status < 400)
                ? Promise.resolve(null)
                : vvFetchProbe(url, { referrer: location.href, credentials: 'include' }, 8000);
            return ckP.then(function (ck) {
                var lines = [
                    vvProbeText('裸链（无 Referer/无 Cookie）', b),
                    vvProbeText('加页面 Referer', r)
                ];
                if (ck) lines.push(vvProbeText('再加 Cookie', ck));
                if (gm) lines.push(vvProbeText('GM 直连（最像外部播放器）', gm));
                if (!isHls) lines.push('提示：mp4 还需要服务器支持 Range，否则外部播放器拖不动进度');
                var judgeBase = gm && !gm.ok && b && b.ok === false ? gm : b;
                return { lines: lines, verdict: vvJudgeProbe(judgeBase, r, ck || gm) };
            });
        });
    });
}

// ---- 浮层 UI ----
function vvShareClose() {
    try {
        var w = document.getElementById('vv-share-wrap');
        if (w && w.parentNode) w.parentNode.removeChild(w);
        // 角标还原：面板或播放器在的时候不该冒出来
        var b = vvBadge();
        if (b) b.style.display = '';
        if (!VV.playerActive && !VV._panelOpen && VV.items.length) vvToggleBadge(true);
    } catch (e) {}
}

function vvShareOpen(item) {
    if (!item || !item.url) { vvToast('没有可分享的链接', true); return; }
    vvShareClose();
    var wrap = vvEl('div', 'vv-share-wrap');
    wrap.id = 'vv-share-wrap';
    var box = vvEl('div', 'vv-share');

    var head = vvEl('div', 'vv-share-head');
    var title = vvEl('div', 'vv-share-title', '外部播放器');
    var x = vvEl('button', 'vv-share-x', '✕');
    head.appendChild(title);
    head.appendChild(x);

    var sub = vvEl('div', 'vv-share-sub',
        '站内能播、外部失败，通常是链接缺少页面上下文（Referer / Cookie / 签名）。' +
        '「用外部播放器播放」会把播放交给另一个 App 的独立进程去解码 —— 这就是多路并行不打架的关键。');
    var urlBox = vvEl('div', 'vv-share-url');
    urlBox.textContent = item.url.length > 160 ? item.url.slice(0, 160) + '…' : item.url;

    var btns = vvEl('div', 'vv-share-btns');
    var log = vvEl('div', 'vv-share-log');
    log.textContent = '点「自检」看这个链接离开页面后还能不能被拉取。\n' +
        '提示：「用外部播放器播放」需要 Via 允许跳转外部应用；若没反应，请改用「导出 .m3u」在 VLC 里打开。';

    function mkBtn(label, cls, fn) {
        var b = vvEl('button', 'vv-share-btn' + (cls ? ' ' + cls : ''), label);
        b.addEventListener('click', function (e) { e.stopPropagation(); fn(); });
        btns.appendChild(b);
        return b;
    }

    mkBtn('导出 .m3u（带请求头）', 'primary', function () {
        var txt = vvBuildM3U(item);
        var ok = vvSaveText(vvShareName(item) + '.m3u', txt, 'audio/x-mpegurl;charset=utf-8');
        if (ok) vvToast('已导出 .m3u，用 VLC 打开', true);
        else { vvCopy(txt); vvToast('无法保存，已复制播放列表内容', true); }
    });
    mkBtn('用外部播放器播放', 'primary', function () {
        var ok = vvOpenExternal(item);
        vvToast(ok ? '已唤起系统选择器，选 VLC / MX 等即可' : '无法唤起外部应用，请用「导出 .m3u」', true);
    });
    if (item.type === 'HLS') {
        mkBtn('外部播放器（兼容 MIME）', '', function () {
            var ok = vvOpenExternal(item, 'application/x-mpegURL');
            vvToast(ok ? '已唤起系统选择器' : '无法唤起外部应用', true);
        });
    }
    mkBtn('复制 curl 命令', '', function () {
        vvCopy(vvBuildCmd(item));
        vvToast('已复制 curl，可在电脑上直接下载');
    });
    mkBtn('只复制链接', '', function () {
        vvCopy(item.url);
        vvToast('已复制裸链（外部可能被拒）');
    });
    var btnProbe = mkBtn('自检兼容性', '', function () {
        log.textContent = '正在用三种方式请求…';
        btnProbe.disabled = true;
        vvShareProbe(item).then(function (res) {
            log.innerHTML = '';
            res.lines.forEach(function (l) {
                var d = vvEl('div', 'vv-share-line', l);
                log.appendChild(d);
            });
            var v = vvEl('div', 'vv-share-verdict', '判定：' + res.verdict);
            log.appendChild(v);
            btnProbe.disabled = false;
        }).catch(function (e) {
            log.textContent = '自检失败：' + ((e && e.message) || e);
            btnProbe.disabled = false;
        });
        return true;
    });

    x.addEventListener('click', vvShareClose);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) vvShareClose(); });

    box.appendChild(head);
    box.appendChild(sub);
    box.appendChild(urlBox);
    box.appendChild(btns);
    box.appendChild(log);
    wrap.appendChild(box);
    document.documentElement.appendChild(wrap);
    // 角标是 fixed + 最高层级，会压在浮层按钮上，直接藏掉
    try { var b = vvBadge(); if (b) b.style.display = 'none'; } catch (eT) {}
    try { if (typeof vvBringToFront === 'function') vvBringToFront(wrap); } catch (eB) {}
}
