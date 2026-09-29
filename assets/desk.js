// Hero demo: a PocketPC desktop on a display, driven by the iPhone trackpad.
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const VW = 960, VH = 540, MENU = 22, GAP = 6, DT = VH - 62;
  const rig = $('#rig');
  if (!rig) return;
  const stage = $('#demo'), desk = $('#desk'), vd = $('#vd'), layersEl = $('#layers'), dockEl = $('#dock');
  const cursorEl = $('#cursor'), pad = $('#pad'), glow = $('#glow'), glow2 = $('#glow2'), pv = $('#pv'), phoneScreen = $('#phoneScreen');
  const launch = $('#launch'), launchGrid = $('#launchGrid'), menuEl = $('#menu'), noticeEl = $('#notice'), wsHud = $('#wsHud');
  const kpanel = $('#kpanel'), vfs = $('#vfs'), ovLabels = $('#ovLabels'), pkb = $('#pkb'), psheet = $('#psheet'), kbdIn = $('#kbdIn');
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const icon = n => `<svg class="i"><use href="#i-${n}"/></svg>`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const chev = d => `<svg class="i" viewBox="0 0 24 24"><path d="${d === 'l' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}"/></svg>`;
  const lines = ws => ws.map(w => `<i style="width:${w}%"></i>`).join('');

  // ---------- Scaling and coordinates ----------
  let PS = 1;
  function fit() {
    vd.style.transform = `scale(${desk.clientWidth / VW})`;
    PS = phoneScreen.clientWidth / 270;
    pv.style.transform = `scale(${PS})`;
    pv.style.height = phoneScreen.clientHeight / PS + 'px';
  }
  const ro = new ResizeObserver(fit);
  ro.observe(desk); ro.observe(phoneScreen);
  fit();
  // Measured at use time so page-level transforms (scroll scaling, theater mode) never skew the mapping.
  const vr = () => { const r = vd.getBoundingClientRect(); return { l: r.left, t: r.top, s: r.width / VW || 1 }; };
  const vrect = el => { const r = el.getBoundingClientRect(), v = vr(); return { x: (r.left - v.l) / v.s, y: (r.top - v.t) / v.s, w: r.width / v.s, h: r.height / v.s }; };
  const vpos = el => { const r = vrect(el); return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; };
  const toV = e => { const v = vr(); return { x: (e.clientX - v.l) / v.s, y: (e.clientY - v.t) / v.s }; };
  function hit(x, y) {
    const v = vr(), el = document.elementFromPoint(v.l + x * v.s, v.t + y * v.s);
    return el && vd.contains(el) ? el : null;
  }
  const fire = el => el && el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

  // ---------- Web pages ----------
  const SITES = {
    Mail: { url: 'mail.example.com/inbox', tint: '#3977f6', g: 'M', page: 'mail' },
    Docs: { url: 'docs.example.com/launch-plan', tint: '#4a7cf0', g: 'D', page: 'docs' },
    Video: { url: 'video.example.com/watch', tint: '#e64b50', g: '▶', page: 'video' },
    Maps: { url: 'maps.example.com', tint: '#2fb866', g: 'M', page: 'maps' },
    Music: { url: 'music.example.com/listen', tint: '#fc3c64', g: '♪', page: 'music' },
    Photos: { url: 'photos.example.com/library', tint: '#f0a23b', g: 'P', page: 'photos' },
    News: { url: 'news.example.com/technology', tint: '#6b5cff', g: 'N', page: 'news', title: 'Technology News' },
  };
  const FAVS = ['Mail', 'Docs', 'Video', 'Maps', 'Music', 'Photos'];
  const MAIL = [
    ['Maya Chen', 'Q4 launch plan', 'Here is the updated timeline for the beta and the press kit.', '9:41', '#e0527a', 1],
    ['Design Team', 'Final screenshots', 'All six are ready for review. Let us know what you think.', '9:12', '#6b5cff', 1],
    ['Sam Rivera', 'Lunch on Friday?', 'There is a new place near the office that just opened.', '8:30', '#1cc8c1', 1],
    ['Travel', 'Your trip to Lisbon', 'Your itinerary and boarding passes are attached.', 'Yesterday', '#f0a23b', 0],
    ['Jordan Lee', 'Notes from the sync', 'A quick summary of what we decided today.', 'Yesterday', '#3977f6', 0],
    ['Calendar', 'Team sync at 10:00', 'Tomorrow, conference room B.', 'Mon', '#2fb866', 0],
    ['Priya Patel', 'Photos from the weekend', 'Sharing the album from the hike.', 'Sun', '#b36bff', 0],
  ];
  const ALBUMS = [['Night Drive', 'Neon Coast', '#fc3c64', '#b36bff'], ['Morning Light', 'The Fields', '#f0a23b', '#e0527a'], ['Deep Focus', 'Various Artists', '#1cc8c1', '#2f7bf6'], ['Blue Hour', 'Lumen', '#3977f6', '#6b5cff'], ['Weekend', 'Palm Radio', '#2fb866', '#1cc8c1'], ['Golden', 'Aster', '#f7c948', '#f0a23b'], ['Low Tide', 'Harbor', '#5e5ce6', '#1cc8c1'], ['Echoes', 'North Lane', '#e64b50', '#f0a23b']];
  const PAGE = {
    start: () => `<div class="pg pg-start">
        <div class="sp-logo">Start Page</div>
        <div class="sp-search" data-field>${icon('search')}<span class="typed"></span><i class="caret" hidden></i><span class="ph">Search the web</span></div>
        <div class="fav-h">Favorites</div>
        <div class="favs">${FAVS.map(f => `<button class="fav" data-site="${f}"><i style="background:${SITES[f].tint}">${SITES[f].g}</i>${f}</button>`).join('')}</div>
        <button class="news-link" data-site="News">Technology News ↗</button></div>`,
    search: p => {
      const q = esc(p.q), Q = q.charAt(0).toUpperCase() + q.slice(1);
      const R = [[Q, 'guide.example.com', '#2f7bf6'], [`${Q}: a complete guide`, 'learn.example.org', '#1cc8c1'], [`How to get started with ${q}`, 'howto.example.net', '#6b5cff'], [`${Q}, ideas and examples`, 'ideas.example.com', '#f0a23b'], [`Top questions about ${q}`, 'forum.example.org', '#e0527a'], [`${Q} explained`, 'video.example.com', '#e64b50'], [`The best of ${q}`, 'blog.example.net', '#2fb866']];
      return `<div class="pg pg-search"><div class="sr-head"><b class="sr-logo">Search</b><div class="sr-box" data-field>${icon('search')}${q}</div></div>
        <div class="sr-tabs"><span class="on">All</span><span>Images</span><span>Videos</span><span>News</span><span>Maps</span></div>
        ${R.map((r, i) => `<div class="sr" style="animation-delay:${i * 60}ms"><div class="sr-site"><i style="background:${r[2]}">${r[1][0].toUpperCase()}</i>${r[1]}</div><span class="sr-t">${r[0]}</span><div class="sr-d">${lines([94, 78])}</div></div>`).join('')}</div>`;
    },
    mail: () => `<div class="pg pg-mail"><aside class="ml-side"><button class="ml-new">Compose</button><div class="on">Inbox<b>3</b></div><div>Starred</div><div>Sent</div><div>Drafts</div><div>Archive</div></aside>
        <div class="ml-list">${MAIL.map(m => `<div class="ml-row${m[5] ? ' unread' : ''}"><i style="background:${m[4]}">${m[0][0]}</i><div><b>${m[0]}</b><span>${m[1]}</span><em>${m[2]}</em></div><time>${m[3]}</time></div>`).join('')}</div></div>`,
    docs: () => `<div class="pg pg-docs"><div class="dc-bar"><i></i><i></i><i></i><span>Launch Plan</span></div><div class="dc-page"><h5>Launch Plan</h5><p class="dc-sub">Beta · Last edited just now</p>${lines([96, 92, 88, 60])}<h6>Goals</h6>${lines([90, 84, 70])}<h6>Timeline</h6>${lines([94, 86, 90, 52])}<h6>Next steps</h6>${lines([88, 76])}</div></div>`,
    video: () => `<div class="pg pg-video"><div class="vd-player"><div class="vd-img"></div><button class="vd-play" data-vplay aria-label="Play">${icon('play')}</button><div class="vd-ctrl"><span class="vd-track"><i></i></span><button class="vd-fs" data-vfs aria-label="Full screen">${icon('expand')}</button></div></div>
        <div class="vd-meta"><b>Scenic Drive in 4K</b><span>Countryside road · 12:04</span></div>
        <div class="vd-next"><i style="background-position:10% 60%;background-size:260%"></i><i style="background-position:80% 30%;background-size:300%"></i><i style="background-position:45% 90%;background-size:240%"></i></div></div>`,
    maps: () => `<div class="pg pg-maps"><svg viewBox="0 0 560 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="560" height="320" fill="#e9efe7"/><path d="M0 252 C 120 232, 180 282, 300 262 S 480 222, 560 242 L560 320 L0 320Z" fill="#bcd9f2"/>
        <rect x="330" y="36" width="120" height="78" rx="12" fill="#cfe6c4"/><rect x="52" y="54" width="96" height="62" rx="10" fill="#cfe6c4"/>
        <g stroke="#fff" stroke-width="11" fill="none" stroke-linecap="round"><path d="M0 150 H560"/><path d="M200 0 V320"/><path d="M0 62 Q 280 112 560 40"/><path d="M420 0 L 382 320"/><path d="M60 320 L 120 150"/></g>
        <path d="M0 150 H560" stroke="#f7d47a" stroke-width="6"/>
        <path d="M110 205 L 200 150 L 325 150 L 325 124" stroke="#2f7bf6" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="110" cy="205" r="7" fill="#2f7bf6" stroke="#fff" stroke-width="3"/>
        <g transform="translate(325 124)"><g class="pin-drop"><path d="M0 0 C -8 -11 -12 -17 -12 -24 A12 12 0 1 1 12 -24 C 12 -17 8 -11 0 0Z" fill="#e64b50"/><circle cx="0" cy="-24" r="4.5" fill="#fff"/></g></g>
        <text x="342" y="84" font-size="11" fill="#4b7a45" font-weight="600">City Park</text><text x="214" y="142" font-size="10" fill="#8a93a4">Main St</text></svg>
        <div class="mp-search">${icon('search')}Coffee nearby</div><div class="mp-zoom"><span>+</span><span>−</span></div></div>`,
    music: () => `<div class="pg pg-music"><div class="mu-h">Listen Now</div><div class="mu-grid">${ALBUMS.map(a => `<div class="mu-a"><i style="background:linear-gradient(135deg,${a[2]},${a[3]})"></i><b>${a[0]}</b>${a[1]}</div>`).join('')}</div>
        <div class="mu-player"><i></i><div>Night Drive<span>Neon Coast</span></div><span class="mu-eq"><b></b><b></b><b></b></span></div></div>`,
    photos: () => `<div class="pg pg-photos"><div class="ph-h"><b>Library</b><span>Today · 24 photos</span></div><div class="ph-grid">${Array.from({ length: 16 }, (_, i) => `<i style="background-position:${(i * 37) % 100}% ${(i * 53) % 100}%;animation-delay:${i * 25}ms"></i>`).join('')}</div></div>`,
    news: () => `<div class="pg pg-news"><div class="nw-h">Technology <span>TOP STORIES</span></div>
        <div class="nw-lead"><i></i><div class="nw-lines"><i class="t" style="width:92%"></i><i class="t" style="width:70%"></i><i style="width:96%"></i><i style="width:88%"></i><i style="width:60%"></i></div></div>
        ${['#f0a23b,#e0527a', '#1cc8c1,#2f7bf6', '#6b5cff,#b36bff', '#2fb866,#1cc8c1'].map(g => `<div class="nw-row"><i style="background:linear-gradient(135deg,${g})"></i><div><i class="t" style="width:88%"></i><i style="width:94%"></i><i style="width:64%"></i></div></div>`).join('')}</div>`,
  };

  // ---------- Window contents ----------
  const TPL = {
    browser: () => `<div class="bw-tabs"></div>
      <div class="bw-bar"><button class="bw-nav" data-bw="back" aria-label="Back">${chev('l')}</button><button class="bw-nav" data-bw="fwd" aria-label="Forward">${chev('r')}</button><button class="bw-nav" data-bw="reload" aria-label="Reload">⟳</button><div class="bw-url" data-field>${icon('search')}<span class="u"></span><i class="caret" hidden></i></div><span class="bw-star">☆</span></div>
      <div class="bw-load"><i></i></div><div class="bw-view scrl"></div>`,
    chats: () => `<div class="cw">
        <div class="cw-rail"><i class="on" style="background:linear-gradient(135deg,#1cc8c1,#0f8f8a)"></i><i style="background:linear-gradient(135deg,#b36bff,#6b5cff)"></i><i style="background:linear-gradient(135deg,#f0a23b,#e0527a)"></i><i class="add">+</i></div>
        <div class="cw-panes"><div class="cw-pane"></div><div class="cw-pane"></div></div></div>`,
    terminal: () => `<div class="tkeys"><span>Auto · Wi‑Fi</span><span>^C</span><span>Esc</span><span>Tab</span><span>←</span><span>↑</span><span>↓</span></div><div class="term scrl"></div>`,
    files: () => `<div class="fw">
        <div class="fw-side"><small>FAVORITES</small><div class="on">My files</div><div>Downloads</div><div>Trash</div></div>
        <div class="fw-main scrl"><h4>My files</h4>
          ${[['Photos', '#3d8bfd', 'Folder'], ['Projects', '#3d8bfd', 'Folder'], ['Travel Plans', '#3d8bfd', 'Folder'], ['Brand Colors.png', '#d65ad1', '612 KB'], ['Budget 2026.csv', '#8a93a4', '38 KB'], ['Launch Video.mov', '#e64b50', '48.6 MB'], ['Meeting Notes.txt', '#8a93a4', '6 KB'], ['Podcast Intro.m4a', '#f0a23b', '3.9 MB'], ['Q4 Roadmap.pdf', '#e0527a', '1.8 MB']]
            .map(f => `<div class="frow"><i style="background:${f[1]}"></i>${f[0]}<em>${f[2]}</em></div>`).join('')}
        </div></div>`,
    settings: () => `<div class="sw scrl">
        <div class="sw-head"><span class="logo"></span><span><b>PocketPC</b><small>Version 1.0.0 · A desktop computer powered by your iPhone</small></span></div>
        <div class="sw-h">Pointer and scrolling</div>
        <div class="sw-card">
          <div class="sw-row"><span>Pointer speed<small>How far the pointer moves per swipe</small></span><span class="stepper"><button data-speed="-1" aria-label="Slower">−</button><output>1×</output><button data-speed="1" aria-label="Faster">+</button></span></div>
          <div class="sw-row"><span>Natural scrolling<small>Content follows your fingers</small></span><button class="tog" role="switch" aria-checked="true" aria-label="Natural scrolling"></button></div>
        </div>
        <div class="sw-h">Web apps</div>
        <div class="sw-card"><div class="sw-row"><span>Install a website as an app<small>Its own Dock icon and window</small></span><button class="pill-btn" data-add>＋ Add to Dock</button></div></div>
        <div class="sw-h">Keyboard and mouse</div>
        <div class="sw-card"><div class="sw-row"><span>Keyboard shortcuts<small class="kbd">⌃Space apps · ⌘Tab windows · ⌘1–5 workspaces</small></span><button class="pill-btn" data-cmd="shortcuts">⌘ Show</button></div>
        <div class="sw-row"><span>Bluetooth keyboard and mouse<small>Pair in iPhone Settings</small></span></div></div>
        <div class="sw-h">Privacy</div>
        <div class="sw-card"><div class="sw-row"><span>Clear Website Data<small>Cookies, cache and saved sessions</small></span></div></div>
      </div>`,
    web: n => `<div class="wa"><div class="wa-side"><i></i><i></i><i></i><i></i></div><div class="wa-main"><b>My Web App${n > 1 ? ' 2' : ''}</b><small>Installed from Settings · opens in its own window</small><div class="wa-cards"><i></i><i></i><i></i></div>
      <div class="wa-chart"><svg viewBox="0 0 300 90" preserveAspectRatio="none"><path d="M0 72 C 40 62, 60 30, 100 40 S 160 72, 200 38 S 260 20, 300 26" fill="none" stroke="#8ff1ea" stroke-width="2.5"/></svg></div></div></div>`,
  };

  // ---------- App registry ----------
  const G = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const APPS = {
    browser: { name: 'Browser', icon: 'globe', tint: G('#5b9bff', '#2f6bea'), def: [18, 34, 560, 392], open: true },
    chats: { name: 'AI Chats', icon: 'chat', tint: G('#8a88ff', '#5e5ce6'), def: [592, 34, 350, 230], open: true },
    terminal: { name: 'Terminal', icon: 'term', tint: G('#3a4452', '#1f262f'), def: [592, 276, 350, 184], open: true, dark: true },
    files: { name: 'Files', icon: 'folder', tint: G('#86a8ee', '#5577c4'), def: [150, 60, 470, 330] },
    settings: { name: 'Settings', icon: 'gear', tint: G('#8d99ab', '#5e6b7e'), def: [436, 44, 330, 404] },
  };
  const CORE = Object.keys(APPS);
  let webCount = 0, lastWeb = null, Z = 10, cur = 1, focused = null;
  const AREA = { x: GAP, y: MENU + GAP, w: VW - GAP * 2, h: DT - MENU - GAP * 2 };
  const HALF = (AREA.w - GAP) / 2;
  const ZONES = { left: [AREA.x, AREA.y, HALF, AREA.h], right: [AREA.x + HALF + GAP, AREA.y, HALF, AREA.h], max: [AREA.x, AREA.y, AREA.w, AREA.h] };

  const layers = [];
  for (let i = 1; i <= 5; i++) {
    const L = document.createElement('div');
    L.className = 'ws-layer';
    L.style.transform = `translateX(${(i - 1) * VW}px)`;
    layersEl.appendChild(L);
    layers.push(L);
  }

  function makeWin(id, n) {
    const a = APPS[id];
    a.id = id;
    const w = document.createElement('div');
    w.className = 'win hidden' + (a.dark ? ' dark' : '');
    w.dataset.app = id;
    w.innerHTML = `<div class="tb"><span class="lights"><button class="lt r" data-act="close" aria-label="Close ${a.name}"></button><button class="lt y" data-act="min" aria-label="Minimize ${a.name}"></button><button class="lt g" data-act="max" aria-label="Zoom ${a.name}"></button></span><span class="ttl">${a.name}</span><button class="wa-btn" data-act="more" aria-label="Window actions"></button></div><div class="wc">${a.web ? TPL.web(n) : TPL[id]()}</div><i class="rz" data-rz></i>`;
    a.el = w;
    a.state = 'closed';
    a.ws = 1;
    layers[0].appendChild(w);
    setRect(a, a.def);
  }
  function setRect(a, r) { [a.x, a.y, a.w, a.h] = r; place(a); }
  function place(a) { const s = a.el.style; s.left = a.x + 'px'; s.top = a.y + 'px'; s.width = a.w + 'px'; s.height = a.h + 'px'; }
  function animRect(a, r) { a.el.classList.add('anim'); setRect(a, r); clearTimeout(a.at); a.at = setTimeout(() => a.el.classList.remove('anim'), 520); }
  function resetStyle(el) { el.style.transition = 'none'; el.style.transform = ''; el.style.opacity = ''; void el.offsetWidth; el.style.transition = ''; }

  // ---------- Dock and launcher ----------
  function renderDock() {
    const btn = (id, a) => `<button class="di" data-dock="${id}" style="background:${a.tint}" aria-label="${a.name}">${icon(a.icon)}<span class="tip">${a.name}</span></button>`;
    const webs = Object.keys(APPS).filter(k => APPS[k].web);
    dockEl.innerHTML = btn('launcher', { name: 'Apps', icon: 'apps', tint: G('#9d8cff', '#6b5cff') })
      + CORE.map(k => btn(k, APPS[k])).join('')
      + (webs.length ? '<span class="dsep"></span>' + webs.map(k => btn(k, APPS[k])).join('') : '');
    syncDock();
  }
  const dockBtn = id => $(`[data-dock="${id}"]`, dockEl);
  function syncDock() { for (const k in APPS) { const b = dockBtn(k); if (b) b.classList.toggle('run', APPS[k].state !== 'closed'); } }
  function bounceDock(id) { const b = dockBtn(id); if (b) { b.classList.remove('bounce'); void b.offsetWidth; b.classList.add('bounce'); } }
  function renderLaunch() {
    launchGrid.innerHTML = Object.keys(APPS).map((k, i) => `<button class="la" data-launch="${k}" style="--i:${i}"><i style="background:${APPS[k].tint}">${icon(APPS[k].icon)}</i>${APPS[k].name}</button>`).join('');
  }
  function toggleLaunch(show = !launch.classList.contains('show')) {
    if (show) { closeMenu(); exitOverview(); renderLaunch(); }
    launch.classList.toggle('show', show);
  }

  // ---------- Window management ----------
  function focus(id) {
    for (const k in APPS) APPS[k].el.classList.toggle('focus', k === id);
    focused = id || null;
    if (id) APPS[id].el.style.zIndex = ++Z;
    $('#mbApp').textContent = id ? APPS[id].name : 'Desktop';
  }
  function dockPoint(id) {
    const b = dockBtn(id);
    return b ? vpos(b) : { x: VW / 2, y: VH };
  }
  function fromDock(a) {
    const p = dockPoint(a.id), el = a.el;
    el.classList.remove('hidden');
    el.style.transition = 'none';
    el.style.transformOrigin = `${p.x - a.x}px ${p.y - a.y}px`;
    el.style.transform = 'scale(.05)';
    el.style.opacity = '0';
    void el.offsetWidth;
    el.style.transition = '';
    el.style.transform = '';
    el.style.opacity = '';
  }
  function openApp(id) {
    const a = APPS[id];
    if (!a) return;
    closeMenu(); toggleLaunch(false);
    if (ov) exitOverview();
    if (a.state === 'open') {
      if (a.ws !== cur) switchWs(a.ws);
      focus(id);
      return;
    }
    if (a.state === 'closed') {
      a.ws = cur;
      layers[cur - 1].appendChild(a.el);
      a.max = a.snapped = a.full = false;
      a.el.classList.remove('full');
      setRect(a, a.def);
      bounceDock(id);
      if (id === 'browser') brReset();
      if (id === 'terminal') termIntro();
    } else if (a.ws !== cur) {
      a.ws = cur;
      layers[cur - 1].appendChild(a.el);
    }
    a.state = 'open';
    focus(id);
    fromDock(a);
    syncDock();
    syncFs();
  }
  function topWindow() {
    let best = null, bz = -1;
    for (const k in APPS) { const a = APPS[k]; if (a.state === 'open' && a.ws === cur && +a.el.style.zIndex > bz) { bz = +a.el.style.zIndex; best = k; } }
    return best;
  }
  function closeApp(id) {
    const a = APPS[id];
    if (!a || a.state === 'closed') return;
    if (a.full) setFull(a, false, true);
    if (id === focused && kbdOpen) closeKbd();
    a.state = 'closed';
    const el = a.el;
    el.style.transformOrigin = '50% 50%';
    el.style.transform = 'scale(.9)';
    el.style.opacity = '0';
    setTimeout(() => { if (a.state !== 'closed') return; el.classList.add('hidden'); resetStyle(el); }, 320);
    syncDock();
    focus(topWindow());
  }
  function minApp(id) {
    const a = APPS[id];
    if (!a || a.state !== 'open') return;
    if (a.full) setFull(a, false, true);
    a.state = 'min';
    const p = dockPoint(id), el = a.el;
    el.style.transformOrigin = `${p.x - a.x}px ${p.y - a.y}px`;
    el.style.transform = 'scale(.05)';
    el.style.opacity = '0';
    setTimeout(() => { if (a.state !== 'min') return; el.classList.add('hidden'); resetStyle(el); }, 470);
    syncDock();
    focus(topWindow());
  }
  function maxApp(id) {
    const a = APPS[id];
    if (!a) return;
    if (a.full) { setFull(a, false); return; }
    if (a.max || a.snapped) { animRect(a, a.prev || a.def); a.max = a.snapped = false; }
    else { a.prev = [a.x, a.y, a.w, a.h]; animRect(a, ZONES.max); a.max = true; }
    focus(id);
  }
  function snapTo(id, z) {
    const a = APPS[id];
    if (!a || a.state !== 'open') return;
    if (a.full) setFull(a, false, true);
    if (!a.max && !a.snapped) a.prev = [a.x, a.y, a.w, a.h];
    animRect(a, ZONES[z]);
    a.max = z === 'max'; a.snapped = !a.max;
    focus(id);
  }
  function setFull(a, on, instant) {
    if (!a) return;
    if (on && !a.full) {
      a.fprev = [a.x, a.y, a.w, a.h]; a.full = true; a.el.classList.add('full');
      instant ? setRect(a, [0, 0, VW, VH]) : animRect(a, [0, 0, VW, VH]);
      focus(a.id);
    } else if (!on && a.full) {
      a.full = false; a.el.classList.remove('full');
      const r = a.fprev || a.def;
      instant ? setRect(a, r) : animRect(a, r);
    }
    syncFs();
  }
  function syncFs() { vd.classList.toggle('fs', Object.values(APPS).some(a => a.full && a.state === 'open' && a.ws === cur)); }
  function exitAllFull() { Object.values(APPS).forEach(a => a.full && setFull(a, false)); }
  function tileWorkspace() {
    closeMenu(); exitOverview();
    const list = Object.values(APPS).filter(a => a.state === 'open' && a.ws === cur).sort((p, q) => +q.el.style.zIndex - +p.el.style.zIndex);
    const n = list.length;
    if (!n) { notice('No open windows on this desktop'); return; }
    const { x, y, w, h } = AREA, g = GAP;
    let R;
    if (n === 1) R = [[x, y, w, h]];
    else if (n === 2) R = [[x, y, HALF, h], [x + HALF + g, y, HALF, h]];
    else if (n === 3) R = [[x, y, HALF, h], [x + HALF + g, y, HALF, (h - g) / 2], [x + HALF + g, y + (h + g) / 2, HALF, (h - g) / 2]];
    else {
      const cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols), rh = (h - g * (rows - 1)) / rows;
      R = list.map((_, i) => {
        const r = Math.floor(i / cols), inRow = r === rows - 1 ? n - cols * (rows - 1) : cols, cw = (w - g * (inRow - 1)) / inRow;
        return [x + (i % cols) * (cw + g), y + r * (rh + g), cw, rh];
      });
    }
    list.forEach((a, i) => {
      if (a.full) setFull(a, false, true);
      if (!a.max && !a.snapped) a.prev = [a.x, a.y, a.w, a.h];
      animRect(a, R[i]);
      a.snapped = true; a.max = false;
    });
  }
  function moveToWs(id, n) {
    const a = APPS[id];
    if (!a || a.state !== 'open' || a.ws === n) return;
    if (a.full) setFull(a, false, true);
    const el = a.el, dir = n > a.ws ? 1 : -1;
    el.style.transition = 'transform .45s cubic-bezier(.16,1,.3,1), opacity .35s';
    el.style.transform = `translateX(${dir * 70}px) scale(.94)`;
    el.style.opacity = '0';
    a.moving = true;
    setTimeout(() => {
      a.moving = false;
      a.ws = n;
      layers[n - 1].appendChild(el);
      resetStyle(el);
      focus(topWindow());
    }, 380);
    notice(`${a.name} moved to Desktop ${n}`);
  }
  function cycleWindows() {
    const list = Object.values(APPS).filter(a => a.state === 'open' && a.ws === cur).sort((p, q) => +p.el.style.zIndex - +q.el.style.zIndex);
    if (list.length > 1) focus(list[0].id);
  }

  // Workspaces
  let hudT = 0;
  function switchWs(n, instant) {
    if (ov) exitOverview();
    closeMenu();
    cur = n;
    layers.forEach((L, i) => {
      L.style.transition = instant ? 'none' : '';
      L.style.transform = `translateX(${(i + 1 - n) * VW}px)`;
    });
    $$('.wsn', vd).forEach(b => b.classList.toggle('on', +b.dataset.ws === n));
    focus(topWindow());
    syncFs();
    if (!instant) {
      $('b', wsHud).textContent = `Desktop ${n}`;
      $$('i', wsHud).forEach((d, i) => d.classList.toggle('on', i === n - 1));
      wsHud.classList.add('show');
      clearTimeout(hudT);
      hudT = setTimeout(() => wsHud.classList.remove('show'), 900);
    }
  }

  // Window overview
  let ov = false, ovList = [];
  function enterOverview() {
    closeMenu(); toggleLaunch(false); exitAllFull();
    ovList = Object.values(APPS).filter(a => a.state === 'open' && a.ws === cur && !a.moving);
    if (!ovList.length) { notice('No open windows on this desktop'); return; }
    ov = true;
    vd.classList.add('overview');
    const n = ovList.length, cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols);
    const ax = 40, ay = 46, aw = VW - 80, ah = VH - 46 - 96, cw = aw / cols, ch = ah / rows;
    ovLabels.innerHTML = '';
    ovList.forEach((a, i) => {
      const c = i % cols, r = Math.floor(i / cols), inRow = r === rows - 1 ? n - cols * (rows - 1) : cols, off = (cols - inRow) * cw / 2;
      const sc = Math.min((cw - 40) / a.w, (ch - 48) / a.h, 1);
      const tx = ax + off + c * cw + (cw - a.w * sc) / 2, ty = ay + r * ch + (ch - 22 - a.h * sc) / 2;
      a.el.style.transformOrigin = '0 0';
      a.el.style.transform = `translate(${tx - a.x}px, ${ty - a.y}px) scale(${sc})`;
      const l = document.createElement('span');
      l.className = 'ovl';
      l.textContent = a.name;
      l.style.left = tx + a.w * sc / 2 + 'px';
      l.style.top = ty + a.h * sc + 9 + 'px';
      ovLabels.appendChild(l);
    });
  }
  function exitOverview(id) {
    if (!ov) return;
    ov = false;
    vd.classList.remove('overview');
    ovList.forEach(a => { a.el.style.transform = ''; });
    ovLabels.innerHTML = '';
    if (id) focus(id);
  }

  // ---------- Menus ----------
  let menuItems = [], menuId = null;
  function showMenu(id, items, x, y, opts = {}) {
    menuItems = items;
    menuId = id;
    menuEl.innerHTML = items.map((it, i) => it === '-' ? '<i class="sep"></i>' : `<button class="mi" role="menuitem" data-mi="${i}"${it.off ? ' disabled' : ''}><span>${it.t}</span>${it.k ? `<kbd>${it.k}</kbd>` : ''}</button>`).join('');
    menuEl.classList.remove('show', 'up');
    const w = menuEl.offsetWidth, h = menuEl.offsetHeight;
    let my = opts.above ? y - h : y;
    if (!opts.above && my + h > VH - 4) my = y - h;
    menuEl.style.left = clamp(x, 4, VW - w - 4) + 'px';
    menuEl.style.top = clamp(my, MENU + 2, VH - h - 4) + 'px';
    menuEl.classList.toggle('up', !!opts.above);
    void menuEl.offsetWidth;
    menuEl.classList.add('show');
  }
  function closeMenu() {
    if (!menuId) return;
    menuId = null;
    menuEl.classList.remove('show');
    $$('.mt.open', vd).forEach(b => b.classList.remove('open'));
  }
  const BAR = ['pocketpc', 'app', 'file', 'edit', 'view', 'window', 'help'];
  function openBarMenu(mt) {
    const id = mt.dataset.menu, r = vrect(mt);
    showMenu(id, barMenu(id), r.x, MENU + 1);
    $$('.mt', vd).forEach(b => b.classList.toggle('open', b === mt));
  }
  function barMenu(id) {
    const f = focused, has = !!f, A = f ? APPS[f].name : 'Desktop', nums = [1, 2, 3, 4, 5];
    switch (id) {
      case 'pocketpc': return [
        { t: 'About PocketPC', cmd: () => notice('PocketPC 1.0 · a desktop that runs on your iPhone') }, '-',
        { t: 'Settings…', cmd: () => openApp('settings') }, '-',
        { t: 'All Apps', k: '⌃Space', cmd: () => toggleLaunch(true) },
        { t: 'Open Apps', k: '⇧⌘O', cmd: enterOverview }, '-',
        { t: 'Keyboard Shortcuts', k: '⇧⌘K', cmd: showShortcuts }];
      case 'app': return [{ t: `Hide ${A}`, k: '⌘H', off: !has, cmd: () => minApp(f) }, '-', { t: `Quit ${A}`, k: '⇧⌘W', off: !has, cmd: () => closeApp(f) }];
      case 'file': return [
        { t: 'New Window', cmd: () => openApp(f && !APPS[f].web ? f : 'browser') },
        { t: 'New Tab', k: '⌘T', off: !has, cmd: () => { openApp('browser'); brNewTab(); } },
        { t: 'Open Location…', k: '⌘L', off: !has, cmd: () => { openApp('browser'); openKbd('browser'); } }, '-',
        { t: 'Close Tab', k: '⌘W', off: !has, cmd: () => (f === 'browser' ? brCloseTab(curTab) : closeApp(f)) },
        { t: 'Close Window', k: '⇧⌘W', off: !has, cmd: () => closeApp(f) }];
      case 'edit': return [
        { t: 'Cut', k: '⌘X', off: !has }, { t: 'Copy', k: '⌘C', off: !has, cmd: () => notice('Copied') }, { t: 'Paste', k: '⌘V', off: !has },
        { t: 'Select All', k: '⌘A', off: !has }, '-', { t: 'Find…', k: '⌘F', off: !has }];
      case 'view': return [
        { t: 'Reload', k: '⌘R', off: !has, cmd: () => f === 'browser' && brRender() }, '-',
        { t: 'Zoom In', k: '⌘+', off: f !== 'browser', cmd: () => zoom(1) },
        { t: 'Zoom Out', k: '⌘−', off: f !== 'browser', cmd: () => zoom(-1) },
        { t: 'Actual Size', k: '⌘0', off: f !== 'browser', cmd: () => zoom(0) }, '-',
        { t: 'Enter Full Screen', off: !has, cmd: () => setFull(APPS[f], true) }];
      case 'window': return [
        { t: 'Minimize', off: !has, cmd: () => minApp(f) },
        { t: 'Zoom', k: '⇧⌘↑', off: !has, cmd: () => snapTo(f, 'max') }, '-',
        { t: 'Tile Window to Left', k: '⇧⌘←', off: !has, cmd: () => snapTo(f, 'left') },
        { t: 'Tile Window to Right', k: '⇧⌘→', off: !has, cmd: () => snapTo(f, 'right') },
        { t: 'Window Overview', k: '⇧⌘O', cmd: enterOverview },
        { t: 'Tile Workspace', k: '⇧⌘L', cmd: tileWorkspace }, '-',
        ...nums.map(n => ({ t: `Move to Desktop ${n}`, k: `⌥⌘${n}`, off: !has || n === cur, cmd: () => moveToWs(f, n) })), '-',
        { t: 'Cycle Windows', k: '⌘⇥', cmd: cycleWindows }];
      case 'help': return [
        { t: 'Keyboard Shortcuts', k: '⇧⌘K', cmd: showShortcuts },
        { t: 'PocketPC Help', cmd: () => notice('Two-finger click for menus · Right-click the Dock to keep apps · Drag a window’s title bar to move it', 4200) }];
    }
    return [];
  }
  function winActions(id) {
    const a = APPS[id];
    return [
      { t: 'Snap Left', cmd: () => snapTo(id, 'left') }, { t: 'Snap Right', cmd: () => snapTo(id, 'right') },
      { t: a.max || a.snapped ? 'Restore Size' : 'Maximize', cmd: () => maxApp(id) },
      { t: 'Enter Full Screen', cmd: () => setFull(a, true) }, '-',
      ...[1, 2, 3, 4, 5].map(n => ({ t: `Move to workspace ${n}`, off: n === a.ws, cmd: () => moveToWs(id, n) }))];
  }
  function contextAt(x, y, el) {
    closeMenu();
    const dockB = el && el.closest('[data-dock]'), wsB = el && el.closest('.wsn'), win = el && el.closest('.win');
    if (wsB) { if (focused) moveToWs(focused, +wsB.dataset.ws); return; }
    if (dockB) {
      const id = dockB.dataset.dock, a = APPS[id];
      if (!a) return;
      const r = vrect(dockB);
      showMenu('dock', [
        { t: 'New Window', cmd: () => openApp(id) }, '-',
        { t: a.web ? 'Remove from Dock' : 'Keep in Dock', cmd: () => (a.web ? removeWebApp(id) : notice(`${a.name} stays in the Dock`)) }, '-',
        { t: 'Quit', off: a.state === 'closed', cmd: () => closeApp(id) }], r.x - 10, r.y - 6, { above: true });
      return;
    }
    if (win && !ov) {
      const id = win.dataset.app;
      focus(id);
      const br = id === 'browser';
      showMenu('ctx', [
        { t: 'Back', off: !br || !tabs[curTab].back.length, cmd: brBack }, { t: 'Reload', off: !br, cmd: () => brRender() }, '-',
        { t: 'Copy', cmd: () => notice('Copied') }, { t: 'Paste' }, { t: 'Select All' }], x, y);
      return;
    }
    if (ov || launch.classList.contains('show')) return;
    showMenu('desktop', [
      { t: 'New Browser Window', cmd: () => openApp('browser') }, '-',
      { t: 'Tile Workspace', cmd: tileWorkspace }, { t: 'Open Apps', cmd: enterOverview }, '-',
      { t: 'Settings…', cmd: () => openApp('settings') }], x, y);
  }

  // ---------- Notices, shortcuts panel, video ----------
  let noticeT = 0;
  function notice(t, ms = 2600) {
    noticeEl.textContent = t;
    noticeEl.classList.add('show');
    clearTimeout(noticeT);
    noticeT = setTimeout(() => noticeEl.classList.remove('show'), ms);
  }
  const SHORTCUTS = [['⌃Space', 'All apps'], ['⌘Tab', 'Next window'], ['⌘1–5', 'Switch workspace'], ['⌥⌘1–5', 'Move window'], ['⇧⌘←', 'Tile left'], ['⇧⌘→', 'Tile right'], ['⇧⌘↑', 'Maximize'], ['⇧⌘O', 'Window overview'], ['⇧⌘L', 'Tile workspace'], ['⌘T', 'New tab'], ['⌘W', 'Close tab'], ['⌘L', 'Address bar'], ['⌘R', 'Reload'], ['⌘F', 'Find in page']];
  function showShortcuts() {
    closeMenu();
    kpanel.innerHTML = `<h5>Keyboard Shortcuts<button data-kclose aria-label="Close">✕</button></h5><dl>${SHORTCUTS.map(([k, t]) => `<dt>${k}</dt><dd>${t}</dd>`).join('')}</dl>`;
    kpanel.classList.add('show');
  }
  const hideShortcuts = () => kpanel.classList.remove('show');
  const videoFull = on => vfs.classList.toggle('show', on);

  // ---------- Browser ----------
  let tabs = [], curTab = 0, typedQ = '', zoomIx = 1;
  const ZOOMS = [.8, 1, 1.2, 1.4];
  const pageTitle = p => p.k === 'start' ? 'Start Page' : p.k === 'search' ? p.q : (SITES[p.s].title || p.s);
  const pageUrl = p => p.k === 'start' ? '' : p.k === 'search' ? p.q : SITES[p.s].url;
  const pageFav = p => p.k === 'site' ? `<i class="fi" style="background:${SITES[p.s].tint}">${SITES[p.s].g}</i>` : `<i class="fi" style="background:${p.k === 'search' ? '#8a93a4' : '#2f7bf6'}">${p.k === 'search' ? '⌕' : '★'}</i>`;
  const bEl = s => $(s, APPS.browser.el);
  function brRender(anim = true) {
    const t = tabs[curTab];
    bEl('.bw-tabs').innerHTML = tabs.map((x, i) => `<span class="bw-tab${i === curTab ? ' on' : ''}${x.fresh ? ' fresh' : ''}" data-tab="${i}">${pageFav(x.page)}<span class="tt">${esc(pageTitle(x.page))}</span><button class="x" data-tabx="${i}" aria-label="Close tab">×</button></span>`).join('') + '<button class="bw-plus" data-bw="newtab" aria-label="New tab">+</button>';
    tabs.forEach(x => { x.fresh = false; });
    bEl('[data-bw="back"]').disabled = !t.back.length;
    bEl('[data-bw="fwd"]').disabled = !t.fwd.length;
    const view = bEl('.bw-view');
    view.innerHTML = PAGE[t.page.k === 'site' ? SITES[t.page.s].page : t.page.k](t.page);
    view.firstElementChild.style.zoom = ZOOMS[zoomIx];
    view.scrollTop = 0;
    $('.ttl', APPS.browser.el).textContent = t.page.k === 'start' ? 'Browser' : pageTitle(t.page);
    if (anim) { const l = bEl('.bw-load'); l.classList.remove('go'); void l.offsetWidth; l.classList.add('go'); }
    brTypeDraw();
  }
  function brGo(page) { const t = tabs[curTab]; t.back.push(t.page); t.fwd = []; t.page = page; typedQ = ''; brRender(); }
  function brBack() { const t = tabs[curTab]; if (!t.back.length) return; t.fwd.push(t.page); t.page = t.back.pop(); brRender(); }
  function brFwd() { const t = tabs[curTab]; if (!t.fwd.length) return; t.back.push(t.page); t.page = t.fwd.pop(); brRender(); }
  function brNewTab(page = { k: 'start' }) {
    if (tabs.length >= 5) { tabs.splice(0, 1); curTab = Math.max(0, curTab - 1); }
    tabs.push({ page, back: [], fwd: [], fresh: true });
    curTab = tabs.length - 1;
    typedQ = '';
    brRender();
  }
  function brCloseTab(i) {
    if (tabs.length === 1) tabs[0] = { page: { k: 'start' }, back: [], fwd: [] };
    else { tabs.splice(i, 1); if (curTab > i || curTab >= tabs.length) curTab = Math.max(0, curTab - 1); }
    typedQ = '';
    brRender(false);
  }
  function brSelect(i) { if (i === curTab) return; curTab = i; typedQ = ''; brRender(false); }
  function brReset() { tabs = [{ page: { k: 'start' }, back: [], fwd: [] }]; curTab = 0; typedQ = ''; zoomIx = 1; brRender(false); }
  function zoom(d) {
    if (focused !== 'browser') return;
    zoomIx = d === 0 ? 1 : clamp(zoomIx + d, 0, ZOOMS.length - 1);
    const pg = bEl('.bw-view').firstElementChild;
    if (pg) pg.style.zoom = ZOOMS[zoomIx];
    notice(`Zoom ${Math.round(ZOOMS[zoomIx] * 100)}%`, 1400);
  }
  function brTypeDraw() {
    const el = APPS.browser.el, t = tabs[curTab], onStart = t.page.k === 'start', typing = kbdOpen && kbdTarget === 'browser';
    const box = $('.sp-search', el), url = $('.bw-url', el), u = $('.u', url);
    if (onStart && box) {
      $('.typed', box).textContent = typedQ;
      $('.ph', box).hidden = !!typedQ || typing;
      $('.caret', box).hidden = !typing;
      box.classList.toggle('typing', typing);
      url.classList.remove('typing'); $('.caret', url).hidden = true;
      u.textContent = 'Search or enter website';
    } else {
      url.classList.toggle('typing', typing);
      $('.caret', url).hidden = !typing;
      u.textContent = typing ? typedQ : pageUrl(t.page);
    }
  }

  // ---------- Settings, web apps, chats, terminal ----------
  const SPEEDS = [.5, .75, 1, 1.5, 2];
  let speedIx = 2, natural = true;
  function addWebApp() {
    const btn = $('[data-add]', APPS.settings.el);
    if (webCount >= 2) { notice('Your web apps are in the Dock'); return; }
    webCount++;
    const id = 'web' + webCount;
    lastWeb = id;
    APPS[id] = { name: webCount > 1 ? 'Web App 2' : 'Web App', icon: 'globe', tint: G('#1cc8c1', '#2f7bf6'), def: [206 + webCount * 36, 64 + webCount * 22, 440, 300], web: true };
    makeWin(id, webCount);
    renderDock();
    dockBtn(id).classList.add('new');
    btn.textContent = '✓ Added to Dock';
    setTimeout(() => { if (btn.isConnected) btn.textContent = '＋ Add to Dock'; }, 1600);
    notice(`${APPS[id].name} added to the Dock`);
  }
  function removeWebApp(id) { const a = APPS[id]; if (!a || !a.web) return; a.el.remove(); delete APPS[id]; renderDock(); focus(topWindow()); }
  function removeWebApps() {
    for (const k of Object.keys(APPS)) if (APPS[k].web) { APPS[k].el.remove(); delete APPS[k]; }
    webCount = 0; lastWeb = null;
    renderDock();
  }

  const CHAT = [['Summarize this article in three bullets', 3], ['Draft a friendly reply to Sam', 2], ['Plan a 3-day trip to Lisbon', 4], ['Explain this spreadsheet formula', 2]];
  let chatIx = 0;
  function chatStep() {
    $$('.cw-pane', APPS.chats.el).forEach((p, i) => {
      const [q, n] = CHAT[(chatIx + i * 2) % CHAT.length];
      p.innerHTML = `<div class="cw-h"><i style="background:${i ? 'linear-gradient(135deg,#b36bff,#6b5cff)' : 'linear-gradient(135deg,#1cc8c1,#0f8f8a)'}"></i>Assistant ${i + 1}</div>
        <div class="bub me" style="animation-delay:${i * .5}s">${q}</div>
        <div class="dots" style="animation:bubIn .4s ${i * .5 + .4}s both"><i></i><i></i><i></i></div>`;
      setTimeout(() => {
        const d = $('.dots', p);
        if (d) d.outerHTML = `<div class="bub ai">${Array.from({ length: n }, (_, j) => `<span style="width:${92 - j * 14}%"></span>`).join('')}</div>`;
      }, 1500 + i * 700);
    });
    chatIx++;
  }

  const PROMPT = '<span class="p">me@my-mac ~ %</span> ';
  const term = { lines: [], input: '', ready: false };
  let termTok = 0;
  function termDraw() {
    const box = $('.term', APPS.terminal.el);
    if (!box) return;
    box.innerHTML = term.lines.slice(-60).join('\n') + (term.lines.length ? '\n' : '') + PROMPT + esc(term.input) + '<i class="c"></i>';
    box.scrollTop = box.scrollHeight;
  }
  function termRespond(c) {
    const [cmd, ...args] = c.split(/\s+/), arg = args.join(' ');
    switch (cmd) {
      case '': return '';
      case 'ls': return /proj/i.test(arg) ? 'launch-plan.md   screenshots   site' : 'Desktop    Documents    Downloads    Projects';
      case 'pwd': return '/Users/me';
      case 'whoami': return 'me';
      case 'hostname': return 'my-mac.local';
      case 'date': return new Date().toString().replace(/ GMT.*/, '');
      case 'uptime': return 'up 12 days, 3:41, 2 users, load averages: 1.21 1.35 1.40';
      case 'echo': return esc(arg);
      case 'clear': return null;
      case 'git': return args[0] === 'pull' ? 'Already up to date.' : args[0] === 'status' ? 'On branch main\nnothing to commit, working tree clean' : 'usage: git <command> [<args>]';
      case 'help': return '<span class="dim">Try: ls, pwd, uptime, date, echo hello, git status, clear</span>';
      default: return `zsh: command not found: ${esc(cmd)}`;
    }
  }
  function termExec(cmd) {
    term.lines.push(PROMPT + esc(cmd));
    term.input = '';
    const out = termRespond(cmd.trim());
    if (out === null) term.lines = [];
    else if (out) term.lines.push(out);
    termDraw();
  }
  async function termIntro() {
    const tok = ++termTok;
    term.lines = []; term.input = ''; term.ready = false;
    termDraw();
    const S = [['o', '<span class="dim">Connecting to my-mac.local (port 22)…</span>'], ['o', '<span class="ok">Connected.</span> Last login: Mon Sep 28 on ttys001'], ['c', 'ls Projects'], ['c', 'git pull']];
    for (const [k, a] of S) {
      if (tok !== termTok) return;
      if (k === 'o') { await sleep(reduce ? 0 : 450); if (tok !== termTok) return; term.lines.push(a); termDraw(); continue; }
      for (const ch of a) { await sleep(reduce ? 0 : 60 + Math.random() * 60); if (tok !== termTok) return; term.input += ch; termDraw(); }
      await sleep(reduce ? 0 : 240);
      if (tok !== termTok) return;
      termExec(term.input);
    }
    term.ready = true;
  }

  // ---------- Keyboard (iPhone keyboard, or your own) ----------
  const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  const keyRow = s => [...s].map(k => `<button data-k="${k}" tabindex="-1">${k}</button>`).join('');
  pkb.innerHTML = `<div class="row">${keyRow(ROWS[0])}</div><div class="row">${keyRow(ROWS[1])}</div>`
    + `<div class="row"><button class="fn" tabindex="-1" aria-label="Shift">⇧</button>${keyRow(ROWS[2])}<button class="fn bk" tabindex="-1" aria-label="Delete">⌫</button></div>`
    + `<div class="row"><button class="fn" tabindex="-1">123</button><button class="sp" tabindex="-1">space</button><button class="ret" tabindex="-1">go</button></div>`;
  let kbdOpen = false, kbdTarget = 'browser', kbdScripted = false;
  function setPhoneBtn(k, on) { const b = $(`[data-p="${k}"]`, pv); if (b) b.setAttribute('aria-pressed', on); }
  function openKbd(target) {
    kbdTarget = target || (focused === 'terminal' ? 'terminal' : 'browser');
    if (kbdTarget === 'browser') { if (APPS.browser.state !== 'open' || APPS.browser.ws !== cur) openApp('browser'); else focus('browser'); }
    else focus('terminal');
    toggleSheet(false);
    kbdOpen = true;
    kbdScripted = touring;
    pkb.classList.add('show');
    setPhoneBtn('kbd', true);
    brTypeDraw();
    if (!kbdScripted) { kbdIn.value = ''; try { kbdIn.focus({ preventScroll: true }); } catch (_) { kbdIn.focus(); } }
  }
  function closeKbd() {
    if (!kbdOpen) return;
    kbdOpen = false;
    pkb.classList.remove('show');
    setPhoneBtn('kbd', false);
    brTypeDraw();
    if (document.activeElement === kbdIn) kbdIn.blur();
  }
  const keyFor = ch => ch === ' ' ? $('.sp', pkb) : $(`[data-k="${ch.toLowerCase()}"]`, pkb);
  function flashKey(el) { if (!el) return; el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 120); }
  function typeChar(ch) {
    flashKey(keyFor(ch));
    if (kbdTarget === 'terminal') { if (!term.ready) return; term.input = (term.input + ch).slice(0, 60); termDraw(); return; }
    typedQ = (typedQ + ch).slice(0, 64);
    brTypeDraw();
  }
  function typeBack() {
    flashKey($('.bk', pkb));
    if (kbdTarget === 'terminal') { term.input = term.input.slice(0, -1); termDraw(); return; }
    typedQ = typedQ.slice(0, -1);
    brTypeDraw();
  }
  function typeEnter() {
    flashKey($('.ret', pkb));
    if (kbdTarget === 'terminal') { if (term.ready) termExec(term.input); return; }
    const q = typedQ.trim();
    typedQ = '';
    closeKbd();
    if (!q) return;
    const host = q.toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    const site = Object.keys(SITES).find(k => SITES[k].url.split('/')[0] === host || k.toLowerCase() === host);
    brGo(site ? { k: 'site', s: site } : { k: 'search', q });
  }
  kbdIn.addEventListener('input', () => { const v = kbdIn.value; kbdIn.value = ''; for (const ch of v) typeChar(ch); });
  kbdIn.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter') { e.preventDefault(); typeEnter(); }
    else if (e.key === 'Backspace') { e.preventDefault(); typeBack(); }
    else if (e.key === 'Escape') { e.preventDefault(); closeKbd(); }
  });
  kbdIn.addEventListener('blur', () => setTimeout(() => { if (kbdOpen && !kbdScripted && document.activeElement !== kbdIn) closeKbd(); }, 150));
  pkb.addEventListener('pointerdown', e => e.preventDefault());
  pkb.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    takeOver();
    if (b.dataset.k) typeChar(b.dataset.k);
    else if (b.classList.contains('sp')) typeChar(' ');
    else if (b.classList.contains('bk')) typeBack();
    else if (b.classList.contains('ret')) typeEnter();
  });

  // Sound output sheet
  const OUTS = [['iPhone', '<svg class="i" viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/></svg>'], ['AirPods', '<svg class="i" viewBox="0 0 24 24"><path d="M5 13a7 7 0 0 1 14 0v4a2 2 0 0 1-2 2h-1v-6h3M5 13v4a2 2 0 0 0 2 2h1v-6H5"/></svg>'], ['Display', icon('tv')]];
  let soundOut = 0;
  function toggleSheet(show = !psheet.classList.contains('show')) {
    if (show) psheet.innerHTML = `<h6>Play sound on</h6>${OUTS.map((o, i) => `<button data-out="${i}" class="${i === soundOut ? 'on' : ''}"><i>${o[1]}</i>${o[0]}<b>✓</b></button>`).join('')}`;
    psheet.classList.toggle('show', show);
  }
  psheet.addEventListener('click', e => {
    const b = e.target.closest('[data-out]');
    if (!b) return;
    soundOut = +b.dataset.out;
    $('#soundOut').textContent = OUTS[soundOut][0];
    toggleSheet(false);
  });

  // ---------- Pointer, clicks and ripples ----------
  let cx = 470, cy = 300, hovEl = null, hovT = 0, virtualCursor = false;
  function placeCursor() { cursorEl.style.transform = `translate(${cx}px, ${cy}px)`; vhover(); }
  function cursorOn(on = true) {
    virtualCursor = on;
    cursorEl.classList.toggle('off', !on);
    if (!on && hovEl) { hovEl.classList.remove('vh'); hovEl = null; }
  }
  function vhover(force) {
    if (!virtualCursor) return;
    const now = performance.now();
    if (!force && now - hovT < 50) return;
    hovT = now;
    const el = hit(cx, cy), h = el && el.closest('.di, .mi:not([disabled]), .mt');
    if (h === hovEl) return;
    if (hovEl) hovEl.classList.remove('vh');
    hovEl = h;
    if (!h) return;
    h.classList.add('vh');
    if (h.classList.contains('mt') && menuId && BAR.includes(menuId) && h.dataset.menu !== menuId) openBarMenu(h);
  }
  placeCursor();
  function ripple(x, y, alt) {
    const r = document.createElement('i');
    r.className = 'ripple' + (alt ? ' alt' : '');
    r.style.left = x + 'px'; r.style.top = y + 'px';
    vd.appendChild(r);
    setTimeout(() => r.remove(), 520);
  }
  function clickAtCursor() {
    ripple(cx, cy);
    const el = hit(cx, cy);
    if (el) fire(el);
    else closeMenu();
  }
  function secondaryClick() { ripple(cx, cy, true); contextAt(cx, cy, hit(cx, cy)); }
  function scrollTarget() {
    const el = hit(cx, cy);
    let s = el && el.closest('.scrl');
    if (!s && focused) s = $('.scrl', APPS[focused].el);
    return s;
  }

  let justDragged = 0;
  vd.addEventListener('click', e => {
    const t = e.target;
    if (performance.now() - justDragged < 90) return;
    const mi = t.closest('.mi');
    if (mi) { const it = menuItems[+mi.dataset.mi]; closeMenu(); if (it && !it.off && it.cmd) it.cmd(); return; }
    const mt = t.closest('.mt');
    if (mt) { if (menuId === mt.dataset.menu) closeMenu(); else openBarMenu(mt); return; }
    if (menuId) { if (!t.closest('.menu')) closeMenu(); return; }
    if (kpanel.classList.contains('show')) { if (t.closest('[data-kclose]') || !t.closest('.panel')) hideShortcuts(); return; }
    if (t.closest('.vfs')) { videoFull(false); return; }
    const lt = t.closest('.lt, .wa-btn');
    if (lt && !ov) {
      const id = lt.closest('.win').dataset.app, act = lt.dataset.act;
      if (act === 'close') closeApp(id);
      else if (act === 'min') minApp(id);
      else if (act === 'max') maxApp(id);
      else { const a = APPS[id]; focus(id); showMenu('win', winActions(id), a.x + a.w - 186, a.y + 26); }
      return;
    }
    const ws = t.closest('.wsn');
    if (ws) { switchWs(+ws.dataset.ws); return; }
    const d = t.closest('[data-dock]');
    if (d) { d.dataset.dock === 'launcher' ? toggleLaunch() : openApp(d.dataset.dock); return; }
    const la = t.closest('[data-launch]');
    if (la) { openApp(la.dataset.launch); return; }
    if (t.closest('.launch')) { toggleLaunch(false); return; }
    if (t.closest('.ov-shade')) { exitOverview(); return; }
    const win = t.closest('.win');
    if (!win) return;
    if (ov) { exitOverview(win.dataset.app); return; }
    const id = win.dataset.app;
    focus(id);
    if (id === 'browser') browserClick(t);
    else if (id === 'settings') settingsClick(t, win);
    else if (id === 'files') { const r = t.closest('.frow'); if (r) $$('.frow', win).forEach(x => x.classList.toggle('sel', x === r)); }
    else if (id === 'terminal' && t.closest('.term')) openKbd('terminal');
  });
  function browserClick(t) {
    const x = t.closest('[data-tabx]');
    if (x) { brCloseTab(+x.dataset.tabx); return; }
    const tab = t.closest('[data-tab]');
    if (tab) { brSelect(+tab.dataset.tab); return; }
    const b = t.closest('[data-bw]');
    if (b) { const k = b.dataset.bw; if (k === 'back') brBack(); else if (k === 'fwd') brFwd(); else if (k === 'reload') brRender(); else brNewTab(); return; }
    const s = t.closest('[data-site]');
    if (s) { brGo({ k: 'site', s: s.dataset.site }); return; }
    if (t.closest('[data-vfs]')) { const p = t.closest('.vd-player'); if (p) p.classList.add('playing'); videoFull(true); return; }
    if (t.closest('[data-vplay], .vd-img')) { const p = t.closest('.vd-player'); if (p) p.classList.toggle('playing'); return; }
    if (t.closest('[data-field]')) openKbd('browser');
  }
  function settingsClick(t, win) {
    const sp = t.closest('[data-speed]');
    if (sp) { speedIx = clamp(speedIx + +sp.dataset.speed, 0, SPEEDS.length - 1); $('output', win).textContent = SPEEDS[speedIx] + '×'; return; }
    const tog = t.closest('.tog');
    if (tog) { natural = tog.getAttribute('aria-checked') !== 'true'; tog.setAttribute('aria-checked', natural); return; }
    if (t.closest('[data-add]')) { addWebApp(); return; }
    if (t.closest('[data-cmd="shortcuts"]')) showShortcuts();
  }
  vd.addEventListener('dblclick', e => {
    const tb = e.target.closest('.tb');
    if (tb && !e.target.closest('button') && !ov) maxApp(tb.parentNode.dataset.app);
  });
  vd.addEventListener('contextmenu', e => {
    e.preventDefault();
    takeOver();
    const p = toV(e);
    contextAt(p.x, p.y, e.target);
  });
  $('#menubar').addEventListener('pointerover', e => {
    const mt = e.target.closest('.mt');
    if (mt && menuId && BAR.includes(menuId) && menuId !== mt.dataset.menu) openBarMenu(mt);
  });

  // ---------- Dragging, snapping and resizing ----------
  let drag = null, snapEl = null, snapZone = null, sizing = null;
  function startDrag(a, vx, vy) {
    if (!a || a.state !== 'open' || ov || a.full) return;
    closeMenu();
    if (a.max || a.snapped) {
      const r = a.prev || a.def, fx = (vx - a.x) / a.w;
      a.w = r[2]; a.h = r[3]; a.x = vx - fx * a.w; a.max = a.snapped = false;
      place(a);
    }
    drag = { a, ox: vx - a.x, oy: vy - a.y, sx: vx, sy: vy };
    a.el.classList.add('dragging');
    focus(a.id);
    snapEl = document.createElement('div');
    snapEl.className = 'snap';
    snapEl.style.zIndex = Z - 1;
    a.el.parentNode.appendChild(snapEl);
  }
  function moveDrag(vx, vy) {
    if (!drag) return;
    const a = drag.a;
    a.x = clamp(vx - drag.ox, -a.w + 80, VW - 80);
    a.y = clamp(vy - drag.oy, MENU, VH - 40);
    place(a);
    const z = vx < 14 ? 'left' : vx > VW - 14 ? 'right' : vy < MENU + 8 ? 'max' : null;
    if (z !== snapZone) {
      snapZone = z;
      if (z) { const r = ZONES[z]; Object.assign(snapEl.style, { left: r[0] + 'px', top: r[1] + 'px', width: r[2] + 'px', height: r[3] + 'px' }); }
      snapEl.classList.toggle('show', !!z);
    }
  }
  function endDrag() {
    if (!drag) return;
    const a = drag.a;
    a.el.classList.remove('dragging');
    if (Math.hypot(a.x + drag.ox - drag.sx, a.y + drag.oy - drag.sy) > 3) justDragged = performance.now();
    if (snapZone) {
      a.prev = [a.x, a.y, a.w, a.h];
      animRect(a, ZONES[snapZone]);
      a.max = snapZone === 'max';
      a.snapped = !a.max;
    }
    const el = snapEl;
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
    snapEl = snapZone = drag = null;
  }
  function startResize(a, vx, vy) {
    if (!a || a.state !== 'open' || ov || a.full) return;
    sizing = { a, sx: vx, sy: vy, w: a.w, h: a.h };
    a.max = a.snapped = false;
    a.el.classList.add('sizing');
    focus(a.id);
  }
  function moveResize(vx, vy) {
    const s = sizing;
    s.a.w = clamp(s.w + vx - s.sx, 230, VW - s.a.x - 2);
    s.a.h = clamp(s.h + vy - s.sy, 150, VH - s.a.y - 2);
    place(s.a);
  }
  function endResize() { sizing.a.el.classList.remove('sizing'); sizing = null; justDragged = performance.now(); }

  // Real mouse or touch on the display
  let mouseOp = null;
  vd.addEventListener('pointerdown', e => {
    takeOver();
    if (e.pointerType === 'mouse') cursorOn(false);
    if (e.button !== 0 || ov) return;
    const rz = e.target.closest('[data-rz]'), tb = e.target.closest('.tb');
    const p = toV(e);
    if (rz) { closeMenu(); startResize(APPS[rz.parentNode.dataset.app], p.x, p.y); if (sizing) mouseOp = 'size'; }
    else if (tb && !e.target.closest('button')) { startDrag(APPS[tb.parentNode.dataset.app], p.x, p.y); if (drag) mouseOp = 'drag'; }
    if (mouseOp) { try { vd.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); }
  });
  vd.addEventListener('pointermove', e => {
    if (!mouseOp) return;
    const p = toV(e);
    if (mouseOp === 'drag') moveDrag(p.x, p.y); else moveResize(p.x, p.y);
  });
  const endMouse = () => { if (mouseOp === 'drag') endDrag(); else if (mouseOp === 'size') endResize(); mouseOp = null; };
  vd.addEventListener('pointerup', endMouse);
  vd.addEventListener('pointercancel', endMouse);
  desk.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !touring) cursorOn(false); });

  // ---------- iPhone trackpad ----------
  let dragMode = false, pd = null, two = null;
  const pts = new Map();
  function glowAt(g, e) {
    const r = pad.getBoundingClientRect(), s = r.width / pad.offsetWidth || 1;
    g.style.left = (e.clientX - r.left) / s + 'px';
    g.style.top = (e.clientY - r.top) / s + 'px';
  }
  function glowAtCursor() {
    glow.style.left = 20 + (cx / VW) * (pad.offsetWidth - 40) + 'px';
    glow.style.top = 20 + (cy / VH) * (pad.offsetHeight - 40) + 'px';
  }
  const onPadUI = e => e.target.closest('.p-kb, .p-sheet, .p-connect');
  pad.addEventListener('pointerdown', e => {
    if (onPadUI(e)) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    takeOver();
    pad.classList.add('used');
    try { pad.setPointerCapture(e.pointerId); } catch (_) {}
    const g = pts.size ? glow2 : glow;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY, g });
    glowAt(g, e);
    g.classList.add('on');
    cursorOn(true);
    if (pts.size === 1) {
      pd = { t: performance.now(), moved: 0 };
      if (dragMode) {
        const el = hit(cx, cy), win = el && el.closest('.win');
        if (win && !ov) startDrag(APPS[win.dataset.app], cx, cy);
      }
    } else if (pts.size === 2) {
      two = { t: performance.now(), moved: 0 };
      pd = null;
      if (drag) endDrag();
    }
    e.preventDefault();
  });
  pad.addEventListener('pointermove', e => {
    const p = pts.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    glowAt(p.g, e);
    if (two) {
      two.moved += Math.hypot(dx, dy);
      const s = scrollTarget();
      if (s) s.scrollTop += (natural ? -dy : dy) * 1.4;
      return;
    }
    if (!pd) return;
    pd.moved += Math.hypot(dx, dy);
    const gain = (VW / pad.getBoundingClientRect().width) * .95 * SPEEDS[speedIx];
    cx = clamp(cx + dx * gain, 0, VW - 4);
    cy = clamp(cy + dy * gain, 0, VH - 4);
    placeCursor();
    if (drag) moveDrag(cx, cy);
  });
  const padUp = e => {
    const p = pts.get(e.pointerId);
    if (!p) return;
    pts.delete(e.pointerId);
    p.g.classList.remove('on');
    if (two) {
      if (!pts.size) {
        if (two.moved < 14 && performance.now() - two.t < 450) secondaryClick();
        two = null;
        glow.classList.remove('on'); glow2.classList.remove('on');
      }
      return;
    }
    if (!pd) return;
    const tap = pd.moved < 8 && performance.now() - pd.t < 320;
    pd = null;
    if (drag) endDrag();
    else if (tap) clickAtCursor();
  };
  pad.addEventListener('pointerup', padUp);
  pad.addEventListener('pointercancel', padUp);
  pad.addEventListener('contextmenu', e => {
    e.preventDefault();
    if (onPadUI(e)) return;
    takeOver();
    cursorOn(true);
    secondaryClick();
  });
  pad.addEventListener('wheel', e => {
    if (onPadUI(e)) return;
    e.preventDefault();
    takeOver();
    cursorOn(true);
    const s = scrollTarget();
    if (s) s.scrollTop += e.deltaY * (e.deltaMode === 1 ? 16 : 1);
  }, { passive: false });

  // Phone buttons
  const go = (sel, detail) => {
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    if (detail) window.dispatchEvent(new CustomEvent('pp:select', { detail }));
  };
  function phoneAction(k, user) {
    const b = $(`[data-p="${k}"]`, pv);
    if (b && k !== 'drag' && k !== 'kbd') { b.classList.add('flash'); setTimeout(() => b.classList.remove('flash'), 260); }
    switch (k) {
      case 'kbd': kbdOpen ? closeKbd() : openKbd(); break;
      case 'search': openKbd('browser'); break;
      case 'drag': dragMode = !dragMode; b.setAttribute('aria-pressed', dragMode); if (dragMode && user) notice('Drag is on: move a window by dragging on the trackpad'); break;
      case 'apps': toggleLaunch(); break;
      case 'windows': ov ? exitOverview() : enterOverview(); break;
      case 'browse': openApp('browser'); break;
      case 'controls': openApp('settings'); break;
      case 'sound': toggleSheet(); break;
      case 'airplay': go('#connect'); break;
      case 'notes': go('#glasses', { mode: 'notes' }); break;
      case 'glasses': go('#glasses', { mode: 'translate' }); break;
    }
  }
  pv.addEventListener('click', e => {
    const b = e.target.closest('[data-p]');
    if (!b) return;
    if (e.isTrusted) takeOver();
    phoneAction(b.dataset.p, e.isTrusted);
  });

  // Keyboard: 1–5 switch workspaces while the pointer is over the demo; Esc closes things
  let overRig = false;
  rig.addEventListener('pointerenter', () => { overRig = true; });
  rig.addEventListener('pointerleave', () => { overRig = false; });
  function escapeAll() {
    const had = !!menuId || kpanel.classList.contains('show') || launch.classList.contains('show') || ov || vfs.classList.contains('show') || vd.classList.contains('fs') || psheet.classList.contains('show');
    closeMenu(); hideShortcuts(); toggleLaunch(false); exitOverview(); videoFull(false); exitAllFull(); toggleSheet(false);
    return had;
  }
  document.addEventListener('keydown', e => {
    if (e.target === kbdIn || (e.target.matches && e.target.matches('input, textarea, select'))) return;
    const th = stage.classList.contains('theater');
    if (e.key === 'Escape' && (overRig || th)) { if (!escapeAll() && th) theater(false); return; }
    if (!overRig && !th) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^[1-5]$/.test(e.key)) { takeOver(); switchWs(+e.key); e.preventDefault(); }
  });

  // Clocks
  function tick() {
    const d = new Date();
    const wd = d.toLocaleDateString('en-US', { weekday: 'short' }), mo = d.toLocaleDateString('en-US', { month: 'short' });
    const t = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    $('#clock').textContent = `${wd} ${mo} ${d.getDate()}  ${t}`;
    $('#pclock').textContent = t.replace(/\s?[AP]M/, '');
  }
  tick();
  setInterval(tick, 15000);

  // ---------- Reset ----------
  function resetDesk() {
    closeMenu(); hideShortcuts(); toggleLaunch(false); exitOverview(); videoFull(false); toggleSheet(false); closeKbd();
    removeWebApps();
    for (const k of CORE) {
      const a = APPS[k];
      a.max = a.snapped = a.full = a.moving = false;
      a.el.classList.remove('full', 'anim', 'dragging', 'sizing');
      a.ws = 1;
      layers[0].appendChild(a.el);
      setRect(a, a.def);
      a.state = a.open ? 'open' : 'closed';
      a.el.classList.toggle('hidden', !a.open);
      a.el.style.transform = ''; a.el.style.opacity = '';
    }
    APPS.chats.el.style.zIndex = 3; APPS.terminal.el.style.zIndex = 4; APPS.browser.el.style.zIndex = 6; Z = 10;
    speedIx = 2; natural = true; dragMode = false;
    $('output', APPS.settings.el).textContent = '1×';
    $('.tog', APPS.settings.el).setAttribute('aria-checked', 'true');
    setPhoneBtn('drag', false);
    $$('.frow.sel', APPS.files.el).forEach(r => r.classList.remove('sel'));
    brReset();
    termIntro();
    switchWs(1, true);
    syncFs();
    focus('browser');
    syncDock();
  }

  // ---------- Guided tour ----------
  let touring = false, tourTok = 0, paused = false, chIx = -1, heroVisible = true, tookOver = false;
  const cap = $('#cap'), tourN = $('#tourN'), chipsBox = $('#chips'), toggleBtn = $('#tourToggle'), hintEl = $('#tourHint');
  async function w(ms, tok) {
    await sleep(ms);
    if (tok !== tourTok) throw 0;
    while (!heroVisible || document.hidden || paused) { await sleep(250); if (tok !== tourTok) throw 0; }
  }
  function moveTo(x, y, tok, dur) {
    const sx = cx, sy = cy, d = dur || Math.min(1100, 380 + Math.hypot(x - sx, y - sy) * 1.1), t0 = performance.now();
    glow.classList.add('on');
    return new Promise((res, rej) => {
      const f = t => {
        if (tok !== tourTok) return rej(0);
        let k = Math.min(1, (t - t0) / d);
        k = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        cx = sx + (x - sx) * k; cy = sy + (y - sy) * k;
        placeCursor(); glowAtCursor();
        if (drag) moveDrag(cx, cy);
        if (k < 1) requestAnimationFrame(f); else res();
      };
      requestAnimationFrame(f);
    });
  }
  async function tapFx(tok) { glow.classList.add('tap'); await w(120, tok); glow.classList.remove('tap'); ripple(cx, cy); }
  async function clickEl(el, tok) { if (!el) return; const p = vpos(el); await moveTo(p.x, p.y, tok); await tapFx(tok); fire(el); vhover(true); await w(150, tok); }
  async function press(k, tok) { phoneAction(k, false); await w(220, tok); }
  async function typeText(s, tok) { for (const ch of s) { typeChar(ch); await w(reduce ? 0 : 50 + Math.random() * 55, tok); } }
  async function twoFingerScroll(amount, tok) {
    const s = scrollTarget();
    if (!s) return;
    glow2.style.left = parseFloat(glow.style.left) + 34 + 'px';
    glow2.style.top = glow.style.top;
    glow2.classList.add('on');
    const g1 = parseFloat(glow.style.top), start = s.scrollTop, t0 = performance.now(), d = 900;
    await new Promise((res, rej) => {
      const f = t => {
        if (tok !== tourTok) return rej(0);
        const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3);
        s.scrollTop = start + amount * e;
        glow.style.top = glow2.style.top = g1 - 70 * e + 'px';
        if (k < 1) requestAnimationFrame(f); else res();
      };
      requestAnimationFrame(f);
    });
    glow2.classList.remove('on');
  }
  async function prep(tok) {
    closeMenu(); hideShortcuts(); toggleLaunch(false); exitOverview(); videoFull(false); exitAllFull(); toggleSheet(false);
    if (kbdOpen) closeKbd();
    if (cur !== 1) { switchWs(1); await w(700, tok); }
  }
  async function ensureOpen(id, tok) {
    const a = APPS[id];
    if (a.state !== 'open' || a.ws !== cur) { await clickEl(dockBtn(id), tok); await w(700, tok); }
    else focus(id);
  }

  async function chSnap(tok) {
    await prep(tok);
    await clickEl(dockBtn('files'), tok); await w(950, tok);
    const f = APPS.files;
    await moveTo(f.x + f.w * .55, f.y + 13, tok);
    await tapFx(tok);
    startDrag(f, cx, cy);
    await moveTo(4, 250, tok, 1000); await w(380, tok);
    endDrag(); await w(850, tok);
    await ensureOpen('browser', tok);
    const b = APPS.browser, gx = clamp(ZONES.left[0] + ZONES.left[2] + 40, b.x + 40, b.x + b.w - 40);
    await moveTo(gx, b.y + 13, tok);
    await tapFx(tok);
    startDrag(b, cx, cy);
    await moveTo(VW - 4, 250, tok, 1100); await w(380, tok);
    endDrag(); await w(1100, tok);
  }
  async function chType(tok) {
    await prep(tok);
    await ensureOpen('browser', tok);
    if (tabs[curTab].page.k !== 'start') { await clickEl(bEl('.bw-plus'), tok); await w(600, tok); }
    await clickEl(bEl('.sp-search'), tok); await w(450, tok);
    await typeText('desktop websites on a big screen', tok);
    await w(450, tok);
    typeEnter(); await w(1600, tok);
    await moveTo(VW * .72, 300, tok);
    await twoFingerScroll(170, tok); await w(1100, tok);
  }
  async function chWeb(tok) {
    await prep(tok);
    await ensureOpen('browser', tok);
    await clickEl(bEl('.bw-plus'), tok); await w(650, tok);
    await clickEl(bEl('[data-site="Video"]'), tok); await w(1000, tok);
    await clickEl(bEl('[data-vplay]'), tok); await w(1300, tok);
    await clickEl(bEl('[data-vfs]'), tok); await w(2800, tok);
    await clickEl(vfs, tok); await w(900, tok);
  }
  async function chWebApp(tok) {
    await prep(tok);
    await clickEl(dockBtn('settings'), tok); await w(1000, tok);
    await clickEl($('[data-add]', APPS.settings.el), tok); await w(1300, tok);
    if (lastWeb && dockBtn(lastWeb)) { await clickEl(dockBtn(lastWeb), tok); await w(1500, tok); }
  }
  async function chSpaces(tok) {
    await prep(tok);
    if (!focused) focus(topWindow());
    await clickEl($('.mt[data-menu="window"]', vd), tok); await w(650, tok);
    const item = $$('.mi', menuEl).find(m => m.textContent.startsWith('Move to Desktop 2'));
    await clickEl(item, tok); await w(1000, tok);
    await clickEl($('.wsn[data-ws="2"]', vd), tok); await w(1600, tok);
    await clickEl($('.wsn[data-ws="1"]', vd), tok); await w(1100, tok);
  }
  async function chOverview(tok) {
    await prep(tok);
    await press('windows', tok); await w(1500, tok);
    const pick = (APPS.chats.state === 'open' && APPS.chats.ws === cur) ? APPS.chats.el : ovList[0] && ovList[0].el;
    if (ov && pick) { await clickEl(pick, tok); await w(1300, tok); }
  }
  async function chTile(tok) {
    await prep(tok);
    await press('apps', tok); await w(1200, tok);
    await clickEl($('[data-launch="terminal"]', launchGrid), tok); await w(1000, tok);
    await clickEl($('.mt[data-menu="window"]', vd), tok); await w(650, tok);
    const item = $$('.mi', menuEl).find(m => m.textContent.startsWith('Tile Workspace'));
    await clickEl(item, tok); await w(2600, tok);
  }
  const CH = [
    { label: 'Snap windows', cap: 'Drag a window to the edge of the display to snap it into place.', est: 7600, run: chSnap },
    { label: 'Type', cap: 'Type on your iPhone, and the words appear on the big screen.', est: 7200, run: chType },
    { label: 'Desktop web', cap: 'Full desktop websites in tabs. Video goes full screen on the display.', est: 8200, run: chWeb },
    { label: 'Web apps', cap: 'Turn any website into an app, with its own Dock icon and window.', est: 5600, run: chWebApp },
    { label: 'Workspaces', cap: 'Five workspaces. Send a window to another desktop from the Window menu.', est: 6200, run: chSpaces },
    { label: 'Overview', cap: 'See every open window at once, then pick one.', est: 4200, run: chOverview },
    { label: 'Tile', cap: 'Open apps from the app grid, then tile the whole workspace in one step.', est: 6600, run: chTile },
  ];
  chipsBox.innerHTML = CH.map((c, i) => `<button class="ch" data-ch="${i}">${c.label}<i></i></button>`).join('');
  const chips = $$('.ch', chipsBox);
  let capT = 0;
  function setCaption(t) {
    if (cap.textContent === t) return;
    cap.classList.add('swap');
    clearTimeout(capT);
    capT = setTimeout(() => { cap.textContent = t; cap.classList.remove('swap'); }, 260);
  }
  let progRaf = 0;
  function setChapter(i) {
    chIx = i;
    chips.forEach((c, j) => { c.classList.toggle('on', j === i); c.classList.toggle('done', j < i); c.style.setProperty('--p', j < i ? 1 : 0); });
    setCaption(CH[i].cap);
    tourN.textContent = `${i + 1} / ${CH.length}`;
    cancelAnimationFrame(progRaf);
    let acc = 0, last = performance.now();
    const f = now => {
      if (heroVisible && !document.hidden && !paused) acc += now - last;
      last = now;
      if (!touring || chIx !== i) return;
      chips[i].style.setProperty('--p', Math.min(.97, acc / CH[i].est));
      progRaf = requestAnimationFrame(f);
    };
    progRaf = requestAnimationFrame(f);
    const c = chips[i];
    if (c.parentNode.scrollWidth > c.parentNode.clientWidth) c.parentNode.scrollTo({ left: c.offsetLeft - c.parentNode.clientWidth / 2 + c.offsetWidth / 2, behavior: 'smooth' });
  }
  function setMode(tour) {
    toggleBtn.innerHTML = icon(tour && !paused ? 'pause' : 'play');
    toggleBtn.setAttribute('aria-label', tour ? (paused ? 'Resume tour' : 'Pause tour') : 'Play tour');
    tourN.hidden = !tour;
    if (!tour) {
      chips.forEach(c => { c.classList.remove('on', 'done'); c.style.setProperty('--p', 0); });
      setCaption("You're in control. Try the trackpad, the Dock, the menus and the keyboard.");
    }
  }
  async function runTour(start = 0) {
    const tok = ++tourTok;
    touring = true; paused = false; tookOver = false;
    if (!bootDone) finishBoot();
    setMode(true);
    cursorOn(true);
    try {
      let i = start;
      for (;;) {
        await w(0, tok);
        setChapter(i);
        await CH[i].run(tok);
        chips[i].style.setProperty('--p', 1);
        await w(700, tok);
        i++;
        if (i >= CH.length) {
          i = 0;
          layersEl.style.opacity = 0;
          await w(550, tok);
          resetDesk();
          layersEl.style.opacity = 1;
          await w(900, tok);
        }
      }
    } catch (_) { if (drag) endDrag(); }
  }
  function takeOver() {
    tookOver = true;
    if (!bootDone) finishBoot();
    if (!touring) return;
    touring = false; paused = false;
    tourTok++;
    glow.classList.remove('on', 'tap'); glow2.classList.remove('on');
    layersEl.style.opacity = 1;
    if (kbdOpen && kbdScripted) closeKbd();
    setMode(false);
  }
  chipsBox.addEventListener('click', e => {
    const c = e.target.closest('[data-ch]');
    if (c) runTour(+c.dataset.ch);
  });
  toggleBtn.addEventListener('click', () => {
    if (touring) { paused = !paused; setMode(true); }
    else runTour((chIx + 1) % CH.length);
  });

  // Theater mode
  const expandBtn = $('#expand');
  function theater(on) {
    stage.classList.toggle('theater', on);
    document.documentElement.classList.toggle('lock', on);
    expandBtn.innerHTML = icon(on ? 'close' : 'expand');
    expandBtn.setAttribute('aria-label', on ? 'Close expanded demo' : 'Expand demo');
    requestAnimationFrame(fit);
  }
  expandBtn.addEventListener('click', () => theater(!stage.classList.contains('theater')));
  $('#theaterClose').addEventListener('click', () => theater(false));

  // ---------- Boot: the iPhone connects and the display powers on ----------
  let bootDone = false;
  function finishBoot() {
    if (bootDone) return;
    bootDone = true;
    rig.classList.remove('boot', 'linking');
    rig.classList.add('on');
    resetDesk();
  }
  async function boot() {
    if (bootDone) return;
    await sleep(700);
    if (bootDone) return;
    const b = $('[data-connect="usbc"]', pv);
    b.classList.add('press'); await sleep(260); b.classList.remove('press');
    rig.classList.add('linking');
    await sleep(1000);
    if (bootDone) return;
    rig.classList.add('on');
    await sleep(900);
    if (bootDone) return;
    for (const k of ['terminal', 'chats', 'browser']) { openApp(k); await sleep(180); }
    rig.classList.remove('boot', 'linking');
    bootDone = true;
    APPS.chats.el.style.zIndex = 3; APPS.terminal.el.style.zIndex = 4; APPS.browser.el.style.zIndex = 6; Z = 10;
    await sleep(1200);
    if (!tookOver && !touring) runTour(0);
  }
  // Tapping AirPlay or USB-C on the connect card skips ahead
  $('#pConnect').addEventListener('click', () => {
    if (bootDone) return;
    finishBoot();
    setTimeout(() => { if (!touring && !tookOver) runTour(0); }, 1100);
  });

  // ---------- Start ----------
  for (const k of CORE) makeWin(k);
  renderDock();
  brReset();
  switchWs(1, true);
  focus(null);
  chatStep();
  setInterval(() => { if (heroVisible && !document.hidden && !reduce && bootDone) chatStep(); }, 6500);
  new IntersectionObserver(es => { heroVisible = es[0].isIntersecting; }, { threshold: .15 }).observe(rig);
  setMode(true);
  if (reduce) {
    finishBoot();
    setMode(false);
    setCaption('Drag on the iPhone trackpad or click anything on the display to try it.');
  } else {
    rig.classList.add('boot');
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); boot(); } }, { threshold: .3 });
    io.observe(rig);
  }
})();
