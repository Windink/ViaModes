'use strict';

// ============================================================
// 选集：把「这一页有哪些集」认出来，做成能直接点的网格。
//
// 两类来源，行为完全不同，必须分开标注，否则用户点了不知道会发生什么：
//   page  —— 页面上真实的剧集链接（<a href> / data-href），点它会跳到那一集，
//            跳完靠 autoNextLast 让新页面自动接着播；
//   el    —— 站点用 JS 原地切集、没有可跳转地址的元素，点它等于替用户点一下，
//            再重新嗅探，看页面有没有吐出新的视频地址；
//   media —— 已经嗅探到的多条媒体直链本身就是分集（同模板不同数字），
//            点它不跳页，直接换源重开播放器，最快。
//
// 为什么不按「页面上有多少个带数字的链接」直接列出来：
// 影视页里带数字的链接一大堆（年份、播放量、相关推荐、广告位），
// 全列出来就是一屏垃圾。这里按「URL 数字模板」分组，只取成员最多、
// 且集数互不重复的那一组；当前页所在模板额外加权，保证选出的是本剧的选集，
// 而不是侧栏「相关推荐」的另一部剧。
// ============================================================

var VV_EP_MAX_LINKS = 3000;   // 一次最多遍历这么多 a[href]，防止超大页面卡顿
var VV_EP_MAX_ELS = 1200;     // 无 href 的候选元素上限
var VV_EP_MAX_CELLS = 200;    // 网格最多 200 集
var VV_EP_BAD_TEXT = /预告|花絮|评论|下载|演员|简介|详情|全集|更新至|更多|排行榜|会员|VIP|线路|播放地址|收藏|分享|广告/;
var VV_EP_DATA_KEYS = ['data-href', 'data-url', 'data-link', 'data-ep'];
var VV_EP_EL_RX = '[data-href],[data-url],[data-link],[data-ep],[data-num],[onclick]';

// 从可见文本里读集数。返回 null = 这不是一集（和第 0 集区分开）。
// 只认三种写法：「第12集 / 12话 / EP12」「12」「12」这类纯数字短文本；
// 带年份、播放量的长文本一概不认。
function vvEpNum(text) {
    var t = String(text === undefined || text === null ? '' : text)
        .replace(/\s+/g, ' ').trim().slice(0, 40);
    if (!t || VV_EP_BAD_TEXT.test(t)) return null;
    var m = /(?:第\s*)?(\d{1,4})\s*(?:集|话|話|期|回|部)/.exec(t);
    if (!m) m = /(?:^|[^a-z])ep\.?\s*(\d{1,4})(?:$|[^a-z])/i.exec(t);
    if (!m) m = /^(\d{1,3})$/.exec(t);
    if (!m) return null;
    var n = parseInt(m[1], 10);
    return (n >= 0 && n <= 9999) ? n : null;
}

// URL 模板：把「会随集变化的数字」归一成 #，query 只保留键名（token / 时间戳的值每次都不同）。
// /play/1.html?t=111 与 /play/2.html?t=222 → 同一模板；
// /play/1.html 与 /detail/1.html → 不同模板，不会被混成一部剧。
//
// 不能对整条 path 直接 replace(/\d+/g,'#')：真实站点常用随机 ID 当播放页地址，
// 央视网就是 /2020/05/28/VIDE30h8zPNlq5WoButIy45J200528.shtml 这种，
// 每集 VID 里数字的位置和个数都不同，逐位替换会把同一部剧的 31 集拆成 31 个模板，
// 每组只剩 1 条、全被丢掉，选集列表直接空白。所以按路径段处理：
//   · 纯数字段（年份 / 集数 / 分页）→ #
//   · 短的字母数字段（ep1.mp4 / seg3.ts）→ 数字换 #，保留名字
//   · 长的字母数字混合段整体当成一条 ID → 「字母前缀 + #id + 扩展名」
//     前缀保留下来是为了让同一站点里不同剧的 ID 前缀仍有区分度。
function vvEpTemplate(u) {
    var s = String(u || '').split('#')[0];
    var q = s.indexOf('?');
    var segs = (q >= 0 ? s.slice(0, q) : s).split('/');
    for (var i = 0; i < segs.length; i++) {
        var seg = segs[i];
        if (!seg) continue;
        if (/^\d{1,4}$/.test(seg)) { segs[i] = '#'; continue; }
        if (!/\d/.test(seg) || !/[a-z]/i.test(seg)) continue;
        var ext = /\.[a-z0-9]{2,5}$/i.exec(seg);
        if (seg.length >= 8) {
            var lead = /^[a-z]{2,4}/i.exec(seg);
            segs[i] = (lead ? lead[0] : '') + '#id' + (ext ? ext[0] : '');
        } else {
            segs[i] = seg.replace(/\d+/g, '#');
        }
    }
    var path = segs.join('/');
    if (q < 0) return path;
    var keys = [];
    var parts = s.slice(q + 1).split('&');
    for (var i = 0; i < parts.length && i < 12; i++) {
        var k = parts[i].split('=')[0];
        if (k && keys.indexOf(k) < 0) keys.push(k);
    }
    return path + '?' + keys.sort().join('&');
}

function vvEpSameHost(u) {
    try { return new URL(u, location.href).hostname === location.hostname; } catch (e) { return false; }
}

function vvEpAbs(raw) {
    if (!raw) return '';
    var r = String(raw).trim();
    if (!r || r === '#' || /^(?:javascript|mailto|tel|data):/i.test(r)) return '';
    try { return vvAbsUrl(r, location.href); } catch (e) { return ''; }
}

// 从一组候选里挑「最像选集」的一组：成员数最多，当前页所在模板加权。
// 同集数只保留第一条（站点常给同一集配多个线路/清晰度链接）。
function vvEpPickGroup(cands, curTemplate) {
    var groups = {}, order = [];
    for (var i = 0; i < cands.length; i++) {
        var t = cands[i].template;
        if (!t) continue;
        if (!groups[t]) { groups[t] = []; order.push(t); }
        groups[t].push(cands[i]);
    }
    var best = null, bestScore = 0;
    for (var j = 0; j < order.length; j++) {
        var t2 = order[j];
        var arr = groups[t2];
        if (arr.length < 2) continue;
        var seen = {}, list = [];
        for (var k = 0; k < arr.length; k++) {
            var num = arr[k].num;
            if (seen[num]) continue;
            seen[num] = 1;
            list.push(arr[k]);
        }
        if (list.length < 2) continue;
        var score = list.length * 2 + (t2 === curTemplate ? 60 : 0);
        if (score > bestScore) { bestScore = score; best = list; }
    }
    if (!best) return [];
    best.sort(function (a, b) { return a.num - b.num; });
    return best.slice(0, VV_EP_MAX_CELLS);
}

function vvEpCollectLinks() {
    var out = [];
    var list = [];
    try { list = document.querySelectorAll('a[href]'); } catch (e) { return out; }
    var n = Math.min(list.length, VV_EP_MAX_LINKS);
    for (var i = 0; i < n; i++) {
        var a = list[i];
        var txt = '';
        try { txt = a.textContent || a.getAttribute('title') || ''; } catch (e1) {}
        var num = vvEpNum(txt);
        if (num === null) continue;
        var raw = '';
        try { raw = a.getAttribute('href'); } catch (e2) {}
        var full = vvEpAbs(raw);
        if (!full || !vvEpSameHost(full)) continue;   // 外域推荐位不进选集
        out.push({
            kind: 'page', num: num, label: String(num), href: full,
            template: vvEpTemplate(full), el: a, title: txt.slice(0, 30)
        });
    }
    return out;
}

// 站点用 JS 原地切集：<li onclick="play(3)">第3集</li>。
// 这类元素没有 href，只能替用户点一下；同一父容器视为同一个选集组。
function vvEpCollectEls() {
    var out = [];
    var list = [];
    try { list = document.querySelectorAll(VV_EP_EL_RX); } catch (e) { return out; }
    var n = Math.min(list.length, VV_EP_MAX_ELS);
    var seq = 0;
    for (var i = 0; i < n; i++) {
        var el = list[i];
        // a[href] 已经在 links 组里处理过，别重复
        try { if (el.tagName === 'A' && el.getAttribute('href')) continue; } catch (e0) {}
        var txt = '';
        try { txt = el.textContent || el.getAttribute('title') || ''; } catch (e1) {}
        var num = vvEpNum(txt);
        if (num === null) {
            var dn = '';
            try { dn = el.getAttribute('data-num') || ''; } catch (e2) {}
            if (/^\d{1,4}$/.test(dn)) num = parseInt(dn, 10);
        }
        if (num === null) continue;
        var href = '';
        for (var d = 0; d < VV_EP_DATA_KEYS.length; d++) {
            var v = '';
            try { v = el.getAttribute(VV_EP_DATA_KEYS[d]) || ''; } catch (e3) {}
            var abs = vvEpAbs(v);
            if (abs && vvEpSameHost(abs)) { href = abs; break; }
        }
        var p = null;
        try { p = el.parentNode; } catch (e4) {}
        var group = '';
        if (p) {
            if (!p._vvEpGroup) { seq++; p._vvEpGroup = 'el' + Date.now().toString(36) + '_' + seq; }
            group = p._vvEpGroup;
        }
        out.push({
            kind: href ? 'page' : 'el', num: num, label: String(num),
            href: href || '', template: href ? vvEpTemplate(href) : group,
            el: el, title: txt.slice(0, 30)
        });
    }
    return out;
}

// 媒体直链的集号只从「文件名主干」最后一段数字里取，不能用 vvNumInfo：
// 后者取的是 URL 里最后一个数字，对 ep1.mp4 / ep2.mp4 一律读成 4（扩展名 mp4），
// 三条不同集会被去重成一条，选集组直接消失。
function vvEpMediaNum(u) {
    var s = String(u || '').split('#')[0].split('?')[0];
    var file = s.slice(s.lastIndexOf('/') + 1).replace(/\.[a-z0-9]{2,5}$/i, '');
    var last = null, m, rx = /\d+/g;
    while ((m = rx.exec(file)) !== null) last = m[0];
    if (last === null) return null;
    var n = parseInt(last, 10);
    return (n >= 0 && n <= 999) ? n : null;
}

// 嗅探到的多条直链若呈「同模板不同数字」，本身就是一套选集，点它不用跳页。
// 排除纯音频 / 音轨清单 / blob 死链，并把 720p、1080p 这类码率数字挡在外面。
function vvEpCollectMedia() {
    var groups = {}, order = [];
    for (var i = 0; i < VV.items.length; i++) {
        var it = VV.items[i];
        if (!it || !it.url || it.type === 'BLOB' || it.type === 'AUDIO') continue;
        if (it.type === 'HLS' && vvLooksLikeAudioHls(it.url)) continue;
        if (/\d{3,4}p(?:\.|_|\/|$)/i.test(it.url)) continue;
        var t = vvEpTemplate(it.url);
        if (!groups[t]) { groups[t] = []; order.push(t); }
        groups[t].push(it);
    }
    var best = [];
    for (var j = 0; j < order.length; j++) {
        var arr = groups[order[j]];
        if (arr.length < 2) continue;
        var seen = {}, list = [];
        for (var k = 0; k < arr.length; k++) {
            var num = vvEpMediaNum(arr[k].url);
            if (num === null) num = k + 1;
            if (num < 0 || num > 999 || seen[num]) continue;
            seen[num] = 1;
            list.push({ kind: 'media', num: num, label: String(num), item: arr[k], href: arr[k].url });
        }
        if (list.length > best.length) best = list;
    }
    if (best.length < 2) return [];
    best.sort(function (a, b) { return a.num - b.num; });
    return best.slice(0, VV_EP_MAX_CELLS);
}

// 站点给「当前集」加的选中态：优先信 DOM，比从 URL 里猜数字可靠。
// 选中态可能挂在 <a> 自己，也可能挂在外层 <li>，两级都看。
function vvEpIsCurrentEl(el) {
    var RX = /(?:^|[\s_-])(?:on|cur|current|active|selected|now|playing)(?:$|[\s_-])/i;
    try {
        if (el.getAttribute && /^(?:page|true)$/i.test(el.getAttribute('aria-current') || '')) return true;
    } catch (e0) {}
    for (var k = 0, p = el; k < 2 && p; k++) {
        try {
            var c = p.className;
            if (c && typeof c === 'object' && c.baseVal !== undefined) c = c.baseVal;
            if (RX.test(String(c || ''))) return true;
        } catch (e1) {}
        try { p = p.parentNode; } catch (e2) { break; }
    }
    return false;
}

// 集号必须在这组候选里恰好出现一次才采信，避免把年份 / 播放量当集数。
function vvEpNumInCands(n, page) {
    if (n === null || n < 0 || n > 999) return -1;
    var hit = 0;
    for (var i = 0; i < page.length; i++) if (page[i].num === n) hit++;
    return hit === 1 ? n : -1;
}

// URL 里的数字只是最后兜底，而且必须长得像集号：/play/3.html、?ep=3、#ep=3。
// 不能再拿整条 URL 的「最后一个数字」当集号——路径里的 /e2e/、CDN 主机名、
// 重定向后随机 ID 里的数字都会命中，真机上表现为「高亮永远停在第 2 集」。
function vvEpNumFromUrl(page) {
    var s = location.href;
    var m = /(?:[?&#])(?:ep|p|num|play|episode)[=:_-]?(\d{1,3})(?=$|[&#])/i.exec(s);
    if (!m) {
        var last = s.split('#')[0].split('?')[0].split('/').pop() || '';
        m = /^(\d{1,3})(?:\.[a-z0-9]{2,5})?$/i.exec(last);
    }
    return m ? vvEpNumInCands(parseInt(m[1], 10), page) : -1;
}

function vvEpCurrent(page, media) {
    var hereFull = location.href;
    var here = hereFull.split('#')[0];
    var res = { page: -1, media: -1 };
    // 先比完整地址（带 #ep=3 的站内锚点式选集），再比去掉锚点的地址
    for (var h = 0; h < page.length; h++) {
        if (page[h].href && page[h].href === hereFull) { res.page = page[h].num; break; }
    }
    if (res.page < 0) {
        for (var i = 0; i < page.length; i++) {
            if (page[i].href && page[i].href.split('#')[0] === here) { res.page = page[i].num; break; }
        }
    }
    // 跨页面选集常见：每集一个随机 ID 地址，还会重定向，URL 里根本没有集号。
    // 这时站点 DOM 上的选中态、以及标题里的「第 N 集」才是唯一可靠信号。
    if (res.page < 0) {
        for (var a = 0; a < page.length; a++) {
            if (vvEpIsCurrentEl(page[a].el)) { res.page = page[a].num; break; }
        }
    }
    if (res.page < 0) {
        // 「第 7 集」和「第7集」都要认，标题里有没有空格全看站点
        var tm = /(?:第\s*|EP\.?\s*)(\d{1,4})\s*(?:集|话|話|期|回|部)/i.exec(document.title || '');
        if (tm) res.page = vvEpNumInCands(parseInt(tm[1], 10), page);
    }
    // URL 里的数字只是最后兜底，随机 ID / 重定向页面上它纯属噪声，
    // 所以排在 DOM 和标题之后，且只认明确像集号的那几个位置。
    if (res.page < 0) res.page = vvEpNumFromUrl(page);
    try {
        var cur = VV.active && VV.active.item ? VV.active.item.url : '';
        for (var k = 0; k < media.length; k++) if (media[k].item.url === cur) { res.media = media[k].num; break; }
    } catch (e2) {}
    return res;
}

// 扫描结果缓存 800ms：菜单项要显示集数，紧跟着点开面板不该把 DOM 再遍历两遍。
function vvEpisodesScan(force) {
    if (!force && VV._epCache && VV._epCache.data && Date.now() - VV._epCache.ts < 800) return VV._epCache.data;
    var curTem = vvEpTemplate(location.href);
    var links = vvEpCollectLinks();
    var els = vvEpCollectEls();
    var page = vvEpPickGroup(links, curTem);
    // 链接组已经能认出选集时，不再混入 JS 元素组，避免同一集出现两格
    if (!page.length) page = vvEpPickGroup(els, curTem);
    var media = vvEpCollectMedia();
    var data = {
        page: page, media: media, current: vvEpCurrent(page, media),
        linkCands: links.length, elCands: els.length, curTemplate: curTem
    };
    VV._epCache = { ts: Date.now(), data: data };
    return data;
}

// 诊断：列表没出来时，先搞清是「页面没有剧集链接」还是「我们没认出来」。
function vvEpisodesDiag() {
    var links = vvEpCollectLinks();
    var els = vvEpCollectEls();
    var counts = {}, top = [];
    for (var i = 0; i < links.length; i++) counts[links[i].template] = (counts[links[i].template] || 0) + 1;
    for (var t in counts) top.push({ template: t, n: counts[t] });
    top.sort(function (a, b) { return b.n - a.n; });
    var d = vvEpisodesScan(true);
    return {
        aLinks: (function () { try { return document.querySelectorAll('a[href]').length; } catch (e) { return -1; } })(),
        linkCands: links.length,
        elCands: els.length,
        topGroups: top.slice(0, 3),
        curTemplate: d.curTemplate,
        sniffed: VV.items.length,
        page: d.page.length,
        media: d.media.length,
        current: d.current
    };
}

function vvEpisodesDiagnose() {
    var d = vvEpisodesDiag();
    var L = [];
    L.push('页面地址: ' + location.href.slice(0, 90));
    L.push('a[href] 总数: ' + d.aLinks + ' / 文本像集数的: ' + d.linkCands);
    L.push('JS 切集候选元素: ' + d.elCands);
    L.push('嗅探到的媒体: ' + d.sniffed + ' 条');
    L.push('当前 URL 模板: ' + d.curTemplate.slice(0, 90));
    for (var i = 0; i < d.topGroups.length; i++) {
        L.push('链接模板 ' + (i + 1) + ': ' + d.topGroups[i].n + ' 条 · ' + d.topGroups[i].template.slice(0, 80));
    }
    L.push('最终选集: 页面链接 ' + d.page + ' 集 / 媒体直链 ' + d.media + ' 集');
    L.push('当前集: 页面 ' + d.current.page + ' / 媒体 ' + d.current.media);
    alert('选集 诊断（复制反馈给开发者）\n\n' + L.join('\n') +
        '\n\n判读：\n· 「文本像集数」为 0 → 站点剧集不是数字文本，或还没渲染出来，先播一下视频再打开选集\n· 模板条数 ≥2 但「最终选集」为 0 → 集数重复/不在本站，把模板发我\n· 只有「媒体直链」有集 → 直接换源即可，不用跳页');
    return L.join('\n');
}

function vvEpisodesClose() {
    try {
        var w = document.getElementById('vv-ep-wrap');
        if (w) { w.classList.remove('open'); var g = w.querySelector('.vv-ep-grid'); if (g) g.innerHTML = ''; }
    } catch (e) {}
    VV._epOpen = false;
    try { if (ROOT) ROOT.classList.remove('ep-open'); } catch (e2) {}
    // 挑完集把控制栏重新点亮并重新计时，否则用户会觉得「点一下界面全没了」
    try { if (VV.playerActive) vvShowCS(); } catch (e3) {}
}

function vvEpEnsureWrap() {
    var w = document.getElementById('vv-ep-wrap');
    if (w) return w;
    w = vvEl('div', 'vv-ep-wrap');
    w.id = 'vv-ep-wrap';
    var box = vvEl('div', 'vv-ep');
    var head = vvEl('div', 'vv-ep-head');
    var title = vvEl('div', 'vv-ep-title', '选集');
    var btnRefresh = vvEl('button', 'vv-ep-btn', '刷新');
    var btnClose = vvEl('button', 'vv-ep-btn');
    btnClose.innerHTML = vvIcon('close', 14);
    btnClose.title = '关闭';
    btnClose.setAttribute('aria-label', '关闭');
    head.appendChild(title);
    head.appendChild(btnRefresh);
    head.appendChild(btnClose);
    var note = vvEl('div', 'vv-ep-note', '');
    var grid = vvEl('div', 'vv-ep-grid');
    var foot = vvEl('div', 'vv-ep-foot', '');
    box.appendChild(head);
    box.appendChild(note);
    box.appendChild(grid);
    box.appendChild(foot);
    w.appendChild(box);
    document.documentElement.appendChild(w);
    btnRefresh.addEventListener('click', function () {
        vvEpRender(vvEpisodesScan(true));
        vvToast('已重新扫描本页');
    });
    btnClose.addEventListener('click', vvEpisodesClose);
    w.addEventListener('click', function (e) { if (e.target === w) vvEpisodesClose(); });
    w.addEventListener('touchstart', function () { w._touching = true; }, { passive: true });
    w.addEventListener('touchend', function () { w._touching = false; }, { passive: true });
    return w;
}

function vvEpAddSection(frag, label, sub, list, curNum) {
    if (!list.length) return;
    var h = vvEl('div', 'vv-ep-sec', vvEscape(label) + (sub ? ' · ' + vvEscape(sub) : ''));
    frag.appendChild(h);
    var row = vvEl('div', 'vv-ep-cells');
    for (var i = 0; i < list.length; i++) {
        var ep = list[i];
        var cell = vvEl('div', 'vv-ep-cell' + (ep.num === curNum ? ' on' : ''), vvEscape(ep.label));
        cell.setAttribute('data-num', String(ep.num));
        cell.setAttribute('data-kind', ep.kind);
        cell.setAttribute('role', 'button');
        cell.setAttribute('aria-label', '第 ' + ep.num + ' 集');
        cell.title = '第 ' + ep.num + ' 集' + (ep.title ? ' · ' + ep.title : '');
        cell._ep = ep;
        cell.addEventListener('click', function () { vvEpGo(this._ep); });
        row.appendChild(cell);
    }
    frag.appendChild(row);
}

function vvEpRender(data) {
    var w = vvEpEnsureWrap();
    var title = w.querySelector('.vv-ep-title');
    var note = w.querySelector('.vv-ep-note');
    var grid = w.querySelector('.vv-ep-grid');
    var foot = w.querySelector('.vv-ep-foot');
    var total = data.page.length + data.media.length;
    if (title) title.innerHTML = '选集 · ' + total + ' 集';
    if (note) {
        note.innerHTML = data.page.length
            ? '点集数会打开该集页面' + (VV.cfg.epAutoPlay ? '并自动续播' : '') + '；蓝色为当前集'
            : '下面是已嗅探到的分集视频地址，点集数直接换源、不跳页';
    }
    if (foot) {
        foot.innerHTML = (data.media.length ? '视频直链换源无需跳页 · ' : '') +
            '找不到想要的集？先播放一下视频再点「刷新」';
    }
    if (grid) {
        var frag = document.createDocumentFragment();
        vvEpAddSection(frag, '本页剧集', data.page.length ? String(data.page.length) + ' 集' : '',
            data.page, data.current.page);
        vvEpAddSection(frag, '嗅探到的视频', data.media.length ? String(data.media.length) + ' 集' : '',
            data.media, data.current.media);
        grid.innerHTML = '';
        grid.appendChild(frag);
    }
}

function vvEpisodesOpen() {
    vvEnsureStyle();
    var data = vvEpisodesScan(true);
    if (!data.page.length && !data.media.length) {
        vvToast('没找到剧集列表。先播放一下视频，或用菜单「选集 诊断」看页面结构', true);
        return;
    }
    vvEpRender(data);
    var w = document.getElementById('vv-ep-wrap');
    if (!w) return;
    vvBringToFront(w);
    w.classList.add('open');
    VV._epOpen = true;
    // 挑集期间控制栏不许自动收起（和底部菜单同一套规则）
    try { if (ROOT && VV.playerActive) ROOT.classList.add('ep-open'); } catch (e) {}
    try { if (VV.playerActive) vvShowCS(); } catch (e2) {}
}

// 原地切集：站点用 JS 切集（点一下元素），或只换 URL 锚点（hashchange）。
// 两者都不会整页刷新，只能靠重新嗅探拿到新一集的视频地址。
function vvEpGoElement(ep, hashUrl) {
    var before = [];
    for (var i = 0; i < VV.items.length; i++) before.push(VV.items[i].url);
    if (VV.cfg.epAutoPlay) vvSet('autoNextLast', { ts: Date.now(), why: 'ep', num: ep.num });
    if (hashUrl) {
        try { location.href = hashUrl; } catch (e) {}
    } else {
        try { if (ep.el) ep.el.click(); } catch (e2) {}
    }
    vvToast('已切到第 ' + ep.num + ' 集，正在找新的视频地址…', true);
    setTimeout(function () {
        try { vvScanDOM(); vvScanPerf(); } catch (e1) {}
        // 没跳页的话，这条续播标记不能留着，否则下次刷新页面会莫名自动播
        try { vvDel('autoNextLast'); } catch (e2) {}
        var cand = null;
        for (var j = 0; j < VV.items.length; j++) {
            var it = VV.items[j];
            if (!it || it.type === 'BLOB' || it.type === 'AUDIO') continue;
            if (it.type === 'HLS' && vvLooksLikeAudioHls(it.url)) continue;
            if (before.indexOf(it.url) >= 0) continue;
            cand = it; break;
        }
        if (!cand) { vvToast('页面没吐出新的视频地址，可点「刷新」再扫一次', true); return; }
        try { openPlayer(cand); } catch (e3) {}
        try { vvSetTitle('第 ' + ep.num + ' 集 · ' + vvPageTitle()); } catch (e4) {}
    }, 1500);
}

function vvEpGo(ep) {
    if (!ep) return;
    vvEpisodesClose();
    if (ep.kind === 'media') {
        if (ep.item) {
            try { openPlayer(ep.item); } catch (e) {}
            try { vvSetTitle('第 ' + ep.num + ' 集 · ' + vvPageTitle()); } catch (e2) {}
            vvToast('已切到第 ' + ep.num + ' 集');
        }
        return;
    }
    if (ep.kind === 'el') { vvEpGoElement(ep, null); return; }
    var hereFull = location.href;
    var here = hereFull.split('#')[0];
    var go = ep.href || '';
    if (!go) { vvToast('第 ' + ep.num + ' 集没有可跳转的链接', true); return; }
    var goBase = go.split('#')[0];
    var sameHash = (go.split('#')[1] || '') === (hereFull.split('#')[1] || '');
    if (go === hereFull || (goBase === here && sameHash)) {
        vvToast('已经在第 ' + ep.num + ' 集');
        return;
    }
    // 只换锚点的 SPA 选集（#/play/5）不是整页跳转：交给站点 hashchange，
    // 再重新嗅探。若只按 path 比较，会被误判成「已经在当前集」而点了没反应。
    if (goBase === here) {
        try { if (VV.playerActive) closePlayer(); } catch (e4) {}
        vvEpGoElement(ep, go);
        return;
    }
    if (VV.cfg.epAutoPlay) vvSet('autoNextLast', { ts: Date.now(), why: 'ep', num: ep.num });
    else vvDel('autoNextLast');
    try { if (VV.playerActive) closePlayer(); } catch (e3) {}
    vvToast('正在打开第 ' + ep.num + ' 集' + (VV.cfg.epAutoPlay ? '，将自动续播' : ''), true);
    location.href = ep.href;
}
