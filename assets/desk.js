// Hero demo: a PocketPC desktop on a display, driven by the iPhone trackpad.
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const VW = 960, VH = 540, MENU = 22;
  const desk = $('#desk'), vd = $('#vd'), layersEl = $('#layers'), dockEl = $('#dock');
  const cursorEl = $('#cursor'), pad = $('#pad'), glow = $('#glow'), pv = $('#pv'), phoneScreen = $('#phoneScreen');
  const launch = $('#launch'), launchGrid = $('#launchGrid'), rig = $('#rig');
  if (!desk) return;

  let S = 1, PS = 1;
  function fit() {
    S = desk.clientWidth / VW;
    vd.style.transform = `scale(${S})`;
    PS = phoneScreen.clientWidth / 270;
    pv.style.transform = `scale(${PS})`;
    pv.style.height = (phoneScreen.clientHeight / PS) + 'px';
  }
  new ResizeObserver(fit).observe(desk);
  new ResizeObserver(fit).observe(phoneScreen);
  fit();

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const icon = (name) => `<svg class="i"><use href="#i-${name}"/></svg>`;

  // ---------- Window contents ----------
  const FAVS = [['Mail', '#3977f6', 'M'], ['Docs', '#4a7cf0', 'D'], ['Video', '#e64b50', '▶'], ['Maps', '#2fb866', 'M'], ['Music', '#fc3c64', '♪'], ['Photos', '#f0a23b', 'P']];
  const TPL = {
    browser: () => `
      <div class="bw-tabs"><span class="bw-tab on" data-tab="start">${icon('globe')}<span class="tt">Start Page</span></span><span class="plus">+</span></div>
      <div class="bw-bar"><span>‹</span><span>›</span><span>⟳</span><span class="bw-url">Search or enter website</span><span>☆</span></div>
      <div class="bw-page">
        <div class="sp-logo">Start Page</div>
        <div class="sp-search">${icon('search')}<span class="typed"></span><i class="caret" hidden></i><span class="ph">Search the web</span></div>
        <div class="fav-h">Favorites</div>
        <div class="favs">${FAVS.map(f => `<span class="fav" data-fav="${f[0]}"><i style="background:${f[1]}">${f[2]}</i>${f[0]}</span>`).join('')}</div>
        <span class="news-link">Technology News ↗</span>
      </div>
      <div class="results"><div class="t"></div><div style="width:86%"></div><div style="width:72%"></div><div class="t" style="width:36%"></div><div style="width:90%"></div><div style="width:64%"></div><div class="t" style="width:48%"></div><div style="width:80%"></div></div>`,
    chats: () => `
      <div class="cw">
        <div class="cw-rail"><i class="on" style="background:linear-gradient(135deg,#1cc8c1,#0f8f8a)"></i><i style="background:linear-gradient(135deg,#b36bff,#6b5cff)"></i><i style="background:linear-gradient(135deg,#f0a23b,#e0527a)"></i><i class="add">+</i></div>
        <div class="cw-panes">
          <div class="cw-pane" data-pane="1"></div>
          <div class="cw-pane" data-pane="2"></div>
        </div>
      </div>`,
    terminal: () => `<div class="term"></div>`,
    files: () => `
      <div class="fw">
        <div class="fw-side"><small>FAVORITES</small><div class="on">My files</div><div>Downloads</div><div>Trash</div></div>
        <div class="fw-main"><h4>My files</h4>
          ${[['Photos', '#3d8bfd', 'Folder'], ['Projects', '#3d8bfd', 'Folder'], ['Travel Plans', '#3d8bfd', 'Folder'], ['Budget 2026.csv', '#8a93a4', '38 KB'], ['Launch Video.mov', '#e64b50', '48.6 MB'], ['Meeting Notes.txt', '#8a93a4', '6 KB'], ['Podcast Intro.m4a', '#f0a23b', '3.9 MB'], ['Q4 Roadmap.pdf', '#e0527a', '1.8 MB']]
            .map(f => `<div class="frow"><i style="background:${f[1]}"></i>${f[0]}<em>${f[2]}</em></div>`).join('')}
        </div>
      </div>`,
    settings: () => `
      <div class="sw">
        <div class="sw-head"><span class="logo"></span><span><b>PocketPC</b><small>Version 1.0.0 · A desktop computer powered by your iPhone</small></span></div>
        <div class="sw-h">Pointer and scrolling</div>
        <div class="sw-card">
          <div class="sw-row"><span>Pointer speed<small>How far the pointer moves per swipe</small></span><span class="stepper"><button data-speed="-1" aria-label="Slower">−</button><output>1×</output><button data-speed="1" aria-label="Faster">+</button></span></div>
          <div class="sw-row"><span>Natural scrolling<small>Content follows your fingers</small></span><button class="tog" role="switch" aria-checked="true" aria-label="Natural scrolling"></button></div>
        </div>
        <div class="sw-h">Web apps</div>
        <div class="sw-card"><div class="sw-row"><span>Install a website as an app<small>Its own Dock icon and window</small></span><button class="pill-btn" data-add>＋ Add to Dock</button></div></div>
        <div class="sw-h">Keyboard and mouse</div>
        <div class="sw-card"><div class="sw-row"><span>Keyboard shortcuts<small class="kbd">⌃Space apps · ⌘Tab windows · ⌘1–5 workspaces</small></span></div>
        <div class="sw-row"><span>Bluetooth keyboard and mouse<small>Pair in iPhone Settings</small></span></div></div>
      </div>`,
    web: (n) => `<div class="wa"><b>My Web App ${n > 1 ? n : ''}</b><div class="blk"></div><div style="width:80%"></div><div style="width:62%"></div><div style="width:70%"></div></div>`,
  };

  // ---------- App registry ----------
  const G = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const APPS = {
    browser: { name: 'Browser', icon: 'globe', tint: G('#5b9bff', '#2f6bea'), def: [18, 34, 548, 398], open: true },
    chats: { name: 'AI Chats', icon: 'chat', tint: G('#8a88ff', '#5e5ce6'), def: [580, 34, 362, 238], open: true },
    terminal: { name: 'Terminal', icon: 'term', tint: G('#3a4452', '#1f262f'), def: [580, 284, 362, 176], open: true, dark: true },
    files: { name: 'Files', icon: 'folder', tint: G('#86a8ee', '#5577c4'), def: [150, 60, 470, 330] },
    settings: { name: 'Settings', icon: 'gear', tint: G('#8d99ab', '#5e6b7e'), def: [436, 44, 330, 412] },
  };
  const CORE = Object.keys(APPS);
  let webCount = 0, Z = 10, cur = 1, focused = null;

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
    w.innerHTML = `<div class="tb"><span class="lights"><button class="lt r" data-act="close" aria-label="Close ${a.name}"></button><button class="lt y" data-act="min" aria-label="Minimize ${a.name}"></button><button class="lt g" data-act="max" aria-label="Full screen ${a.name}"></button></span>${a.name}</div><div class="wc">${a.web ? TPL.web(n) : TPL[id]()}</div>`;
    a.el = w;
    a.state = 'closed';
    a.ws = 1;
    layers[0].appendChild(w);
    setRect(a, a.def);
  }
  function setRect(a, r) { [a.x, a.y, a.w, a.h] = r; place(a); }
  function place(a) { const s = a.el.style; s.left = a.x + 'px'; s.top = a.y + 'px'; s.width = a.w + 'px'; s.height = a.h + 'px'; }
  function animRect(a, r) { a.el.classList.add('anim'); setRect(a, r); setTimeout(() => a.el.classList.remove('anim'), 480); }

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
  function renderLaunch() {
    launchGrid.innerHTML = Object.keys(APPS).map(k => `<button class="la" data-launch="${k}"><i style="background:${APPS[k].tint}">${icon(APPS[k].icon)}</i>${APPS[k].name}</button>`).join('');
  }
  function toggleLaunch(show = !launch.classList.contains('show')) {
    if (show) { exitOverview(); renderLaunch(); }
    launch.classList.toggle('show', show);
  }

  // ---------- Window management ----------
  function focus(id) {
    for (const k in APPS) APPS[k].el.classList.toggle('focus', k === id);
    focused = id;
    if (id) { Z += 2; APPS[id].el.style.zIndex = Z; }
    $('#mbApp').textContent = id ? APPS[id].name : 'Desktop';
  }
  function dockPoint(id) {
    const b = dockBtn(id), v = vd.getBoundingClientRect();
    if (!b) return { x: VW / 2, y: VH };
    const r = b.getBoundingClientRect();
    return { x: (r.left + r.width / 2 - v.left) / S, y: (r.top + r.height / 2 - v.top) / S };
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
  function toDock(a, done) {
    const p = dockPoint(a.id), el = a.el;
    el.style.transformOrigin = `${p.x - a.x}px ${p.y - a.y}px`;
    el.style.transform = 'scale(.05)';
    el.style.opacity = '0';
    setTimeout(() => {
      el.classList.add('hidden');
      el.style.transition = 'none'; el.style.transform = ''; el.style.opacity = '';
      void el.offsetWidth; el.style.transition = '';
      done && done();
    }, 460);
  }
  function openApp(id) {
    const a = APPS[id];
    if (!a) return;
    toggleLaunch(false);
    if (ov) exitOverview();
    if (a.state === 'open') {
      if (a.ws !== cur) switchWs(a.ws);
      focus(id);
      return;
    }
    if (a.state === 'closed') {
      a.ws = cur;
      layers[cur - 1].appendChild(a.el);
      a.max = a.snapped = false;
      setRect(a, a.def);
      const b = dockBtn(id);
      if (b) { b.classList.remove('bounce'); void b.offsetWidth; b.classList.add('bounce'); }
    } else if (a.ws !== cur) {
      a.ws = cur;
      layers[cur - 1].appendChild(a.el);
    }
    a.state = 'open';
    focus(id);
    fromDock(a);
    syncDock();
  }
  function topWindow() {
    let best = null, bz = -1;
    for (const k in APPS) { const a = APPS[k]; if (a.state === 'open' && a.ws === cur && +a.el.style.zIndex > bz) { bz = +a.el.style.zIndex; best = k; } }
    return best;
  }
  function closeApp(id) {
    const a = APPS[id];
    a.state = 'closed';
    a.el.style.transformOrigin = '50% 50%';
    a.el.style.transform = 'scale(.9)';
    a.el.style.opacity = '0';
    setTimeout(() => {
      a.el.classList.add('hidden');
      a.el.style.transition = 'none'; a.el.style.transform = ''; a.el.style.opacity = '';
      void a.el.offsetWidth; a.el.style.transition = '';
    }, 320);
    syncDock();
    focus(topWindow());
  }
  function minApp(id) { const a = APPS[id]; a.state = 'min'; toDock(a); syncDock(); focus(topWindow()); }
  function maxApp(id) {
    const a = APPS[id];
    if (a.max || a.snapped) { animRect(a, a.prev || a.def); a.max = a.snapped = false; }
    else { a.prev = [a.x, a.y, a.w, a.h]; animRect(a, [0, MENU, VW, VH - MENU]); a.max = true; }
    focus(id);
  }

  // Workspaces
  function switchWs(n, instant) {
    if (ov) exitOverview();
    cur = n;
    layers.forEach((L, i) => {
      L.style.transition = instant ? 'none' : '';
      L.style.transform = `translateX(${(i + 1 - n) * VW}px)`;
    });
    $$('.wsn', vd).forEach(b => b.classList.toggle('on', +b.dataset.ws === n));
    focus(topWindow());
  }

  // Window overview
  let ov = false, ovList = [];
  function enterOverview() {
    toggleLaunch(false);
    ovList = Object.values(APPS).filter(a => a.state === 'open' && a.ws === cur);
    if (!ovList.length) return;
    ov = true;
    vd.classList.add('overview');
    const n = ovList.length, cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols);
    const ax = 40, ay = 46, aw = VW - 80, ah = VH - 46 - 86, cw = aw / cols, ch = ah / rows;
    ovList.forEach((a, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const sc = Math.min((cw - 34) / a.w, (ch - 34) / a.h, 1);
      const tx = ax + c * cw + (cw - a.w * sc) / 2, ty = ay + r * ch + (ch - a.h * sc) / 2;
      a.el.style.transformOrigin = '0 0';
      a.el.style.transform = `translate(${tx - a.x}px, ${ty - a.y}px) scale(${sc})`;
    });
  }
  function exitOverview(id) {
    if (!ov) return;
    ov = false;
    vd.classList.remove('overview');
    ovList.forEach(a => { a.el.style.transform = ''; });
    if (id) focus(id);
  }

  // ---------- Dragging and snapping ----------
  let drag = null, snapEl = null, snapZone = null, justDragged = 0;
  const ZONES = { left: [0, MENU, VW / 2, VH - MENU], right: [VW / 2, MENU, VW / 2, VH - MENU], max: [0, MENU, VW, VH - MENU] };
  function startDrag(a, vx, vy) {
    if (!a || a.state !== 'open' || ov) return;
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
    a.x = Math.max(-a.w + 60, Math.min(VW - 60, vx - drag.ox));
    a.y = Math.max(MENU, Math.min(VH - 40, vy - drag.oy));
    place(a);
    const z = vx < 14 ? 'left' : vx > VW - 14 ? 'right' : vy < MENU + 8 ? 'max' : null;
    if (z !== snapZone) {
      snapZone = z;
      if (z) { const r = ZONES[z]; Object.assign(snapEl.style, { left: r[0] + 8 + 'px', top: r[1] + 8 + 'px', width: r[2] - 16 + 'px', height: r[3] - 16 + 'px' }); }
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

  // ---------- Browser, settings and chats behavior ----------
  const B = () => APPS.browser.el;
  function browserReset() {
    const el = B();
    $('.bw-tabs', el).innerHTML = `<span class="bw-tab on" data-tab="start">${icon('globe')}<span class="tt">Start Page</span></span><span class="plus">+</span>`;
    $('.typed', el).textContent = '';
    $('.ph', el).hidden = false;
    $('.caret', el).hidden = true;
    $('.results', el).classList.remove('show');
    $('.bw-url', el).textContent = 'Search or enter website';
  }
  function browserShow(title, url) {
    const el = B(), tabs = $('.bw-tabs', el);
    $$('.bw-tab', tabs).forEach(t => t.classList.remove('on'));
    const existing = $$('.bw-tab', tabs).find(t => t.dataset.tab === title);
    if (existing) existing.classList.add('on');
    else {
      if ($$('.bw-tab', tabs).length >= 4) $$('.bw-tab', tabs)[1].remove();
      const t = document.createElement('span');
      t.className = 'bw-tab on'; t.dataset.tab = title;
      t.innerHTML = `${icon('globe')}<span class="tt">${title}</span>`;
      tabs.insertBefore(t, $('.plus', tabs));
    }
    $('.bw-url', el).textContent = url;
    $('.results', el).classList.add('show');
  }
  function browserStart() {
    const el = B();
    $$('.bw-tab', el).forEach(t => t.classList.toggle('on', t.dataset.tab === 'start'));
    $('.results', el).classList.remove('show');
    $('.bw-url', el).textContent = 'Search or enter website';
  }

  const SPEEDS = [.5, .75, 1, 1.5, 2];
  let speedIx = 2;
  function addWebApp() {
    const btn = $('[data-add]', APPS.settings.el);
    if (webCount >= 2) { btn.textContent = 'Dock is ready'; return; }
    webCount++;
    const id = 'web' + webCount;
    APPS[id] = { name: webCount > 1 ? 'Web App 2' : 'Web App', icon: 'globe', tint: G('#1cc8c1', '#2f7bf6'), def: [180 + webCount * 40, 70 + webCount * 24, 420, 300], web: true };
    makeWin(id, webCount);
    renderDock();
    const b = dockBtn(id);
    b.classList.add('new');
    btn.textContent = '✓ Added to Dock';
    setTimeout(() => { if (btn.isConnected) btn.textContent = '＋ Add to Dock'; }, 1600);
  }
  function removeWebApps() {
    for (const k of Object.keys(APPS)) if (APPS[k].web) { APPS[k].el.remove(); delete APPS[k]; }
    webCount = 0;
    renderDock();
  }

  // Chats: a small looping conversation in each pane
  const CHAT = [
    ['Summarize this article in three bullets', 3],
    ['Draft a friendly reply to Sam', 2],
    ['Plan a 3-day trip to Lisbon', 4],
    ['Explain this spreadsheet formula', 2],
  ];
  let chatIx = 0;
  function chatStep() {
    const panes = $$('.cw-pane', APPS.chats.el);
    panes.forEach((p, i) => {
      const [q, lines] = CHAT[(chatIx + i * 2) % CHAT.length];
      p.innerHTML = `<div class="cw-h"><i style="background:${i ? 'linear-gradient(135deg,#b36bff,#6b5cff)' : 'linear-gradient(135deg,#1cc8c1,#0f8f8a)'}"></i>Assistant ${i + 1}</div>
        <div class="bub me" style="animation-delay:${i * .5}s">${q}</div>
        <div class="dots" style="animation:bubIn .4s ${i * .5 + .4}s both"><i></i><i></i><i></i></div>`;
      setTimeout(() => {
        const d = $('.dots', p);
        if (d) d.outerHTML = `<div class="bub ai">${Array.from({ length: lines }, (_, j) => `<span style="width:${92 - j * 14}%"></span>`).join('')}</div>`;
      }, 1500 + i * 700);
    });
    chatIx++;
  }

  // Terminal: types a short SSH session
  const TERM = [
    ['o', 'Connecting to my-mac.local (port 22)…'],
    ['o', '<span class="ok">Connected.</span> Last login: Mon Sep 28 on ttys001'],
    ['c', 'me@my-mac ~ % ', 'ls Projects'],
    ['o', 'launch-plan.md   screenshots   site'],
    ['c', 'me@my-mac ~ % ', 'git pull'],
    ['o', 'Already up to date.'],
    ['p', 'me@my-mac ~ % '],
  ];
  let termTok = 0;
  async function termRun() {
    const tok = ++termTok, box = $('.term', APPS.terminal.el);
    const lines = [];
    const draw = (extra = '') => { box.innerHTML = lines.slice(-7).join('\n') + extra; };
    for (const [k, a, b] of TERM) {
      if (tok !== termTok) return;
      if (k === 'o') { await sleep(450); lines.push(a); draw(); }
      else if (k === 'p') { lines.push(`<span class="p">${a}</span><i class="c"></i>`); draw(); }
      else {
        let typed = '';
        for (const ch of b) { if (tok !== termTok) return; typed += ch; draw('\n' + `<span class="p">${a}</span>${typed}<i class="c"></i>`); await sleep(70 + Math.random() * 60); }
        await sleep(250);
        lines.push(`<span class="p">${a}</span>${b}`);
        draw();
      }
    }
  }

  // ---------- Phone keyboard ----------
  const pkb = $('#pkb');
  pkb.innerHTML = [10, 9, 7].map(n => `<div>${'<i></i>'.repeat(n)}</div>`).join('') + '<div><i></i><i class="w"></i><i></i></div>';
  let typing = false;
  async function kbdDemo(text = 'desktop websites on a big screen') {
    if (typing) return;
    typing = true;
    openApp('browser');
    browserStart();
    const el = B(), out = $('.typed', el), caret = $('.caret', el);
    out.textContent = '';
    $('.ph', el).hidden = true;
    caret.hidden = false;
    pkb.classList.add('show');
    const keys = $$('i', pkb);
    await sleep(380);
    for (const ch of text) {
      out.textContent += ch;
      const k = ch === ' ' ? $('i.w', pkb) : keys[(ch.charCodeAt(0) * 7) % 26];
      k.classList.add('hit');
      setTimeout(() => k.classList.remove('hit'), 110);
      await sleep(reduce ? 0 : 55 + Math.random() * 55);
    }
    await sleep(350);
    pkb.classList.remove('show');
    caret.hidden = true;
    browserShow(text.split(' ').slice(0, 2).join(' '), 'Search: ' + text);
    typing = false;
  }

  // ---------- Pointer, clicks and ripples ----------
  let cx = 470, cy = 300;
  function placeCursor() { cursorEl.style.transform = `translate(${cx}px, ${cy}px)`; }
  function cursorOn(on = true) { cursorEl.classList.toggle('off', !on); }
  placeCursor();
  function ripple(x, y) {
    const r = document.createElement('i');
    r.className = 'ripple';
    r.style.left = x + 'px'; r.style.top = y + 'px';
    vd.appendChild(r);
    setTimeout(() => r.remove(), 520);
  }
  function clickAtCursor() {
    ripple(cx, cy);
    const v = vd.getBoundingClientRect();
    const el = document.elementFromPoint(v.left + cx * S + 1, v.top + cy * S + 1);
    if (!el || !vd.contains(el)) return;
    const t = el.closest('button, .fav, .news-link, .bw-tab, .sp-search, .win, .launch, .ov-shade');
    if (t) t.click();
  }

  vd.addEventListener('click', e => {
    const t = e.target;
    if (performance.now() - justDragged < 80) return;
    const lt = t.closest('.lt');
    if (lt && !ov) {
      const id = lt.closest('.win').dataset.app, act = lt.dataset.act;
      if (act === 'close') closeApp(id); else if (act === 'min') minApp(id); else maxApp(id);
      return;
    }
    const ws = t.closest('.wsn'); if (ws) { switchWs(+ws.dataset.ws); return; }
    const d = t.closest('[data-dock]');
    if (d) { d.dataset.dock === 'launcher' ? toggleLaunch() : openApp(d.dataset.dock); return; }
    const la = t.closest('[data-launch]'); if (la) { openApp(la.dataset.launch); return; }
    if (t.closest('.launch')) { toggleLaunch(false); return; }
    if (t.closest('.ov-shade')) { exitOverview(); return; }
    const win = t.closest('.win');
    if (!win) return;
    if (ov) { exitOverview(win.dataset.app); return; }
    focus(win.dataset.app);
    const sp = t.closest('[data-speed]');
    if (sp) {
      speedIx = Math.max(0, Math.min(SPEEDS.length - 1, speedIx + +sp.dataset.speed));
      $('output', win).textContent = SPEEDS[speedIx] + '×';
      return;
    }
    const tog = t.closest('.tog'); if (tog) { tog.setAttribute('aria-checked', tog.getAttribute('aria-checked') !== 'true'); return; }
    if (t.closest('[data-add]')) { addWebApp(); return; }
    const fav = t.closest('[data-fav]'); if (fav) { browserShow(fav.dataset.fav, fav.dataset.fav.toLowerCase() + '.example.com'); return; }
    const tab = t.closest('.bw-tab');
    if (tab) { tab.dataset.tab === 'start' ? browserStart() : browserShow(tab.dataset.tab, $('.bw-url', win).textContent); return; }
    if (t.closest('.sp-search')) kbdDemo();
  });
  vd.addEventListener('dblclick', e => {
    const tb = e.target.closest('.tb');
    if (tb && !e.target.closest('.lt') && !ov) maxApp(tb.parentNode.dataset.app);
  });

  // Real mouse on the display
  const toV = e => { const v = vd.getBoundingClientRect(); return { x: (e.clientX - v.left) / S, y: (e.clientY - v.top) / S }; };
  let mouseDrag = false;
  vd.addEventListener('pointerdown', e => {
    takeOver();
    if (e.pointerType === 'mouse') cursorOn(false);
    const tb = e.target.closest('.tb');
    if (tb && !e.target.closest('.lt') && !ov && e.button === 0) {
      const p = toV(e);
      startDrag(APPS[tb.parentNode.dataset.app], p.x, p.y);
      if (drag) { mouseDrag = true; tb.setPointerCapture(e.pointerId); e.preventDefault(); }
    }
  });
  vd.addEventListener('pointermove', e => { if (mouseDrag) { const p = toV(e); moveDrag(p.x, p.y); } });
  const endMouse = () => { if (mouseDrag) { mouseDrag = false; endDrag(); } };
  vd.addEventListener('pointerup', endMouse);
  vd.addEventListener('pointercancel', endMouse);
  desk.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !touring) cursorOn(false); });

  // iPhone trackpad
  let dragMode = false, padDown = null;
  const PADW = 242, PADH = 322;
  function glowAt(x, y) { glow.style.left = x + 'px'; glow.style.top = y + 'px'; }
  function glowAtCursor() { glowAt(20 + (cx / VW) * (PADW - 40), 20 + (cy / VH) * (PADH - 40)); }
  pad.addEventListener('pointerdown', e => {
    takeOver();
    pad.classList.add('used');
    pad.setPointerCapture(e.pointerId);
    cursorOn(true);
    const r = pad.getBoundingClientRect();
    padDown = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, w: r.width };
    glowAt((e.clientX - r.left) / PS, (e.clientY - r.top) / PS);
    glow.classList.add('on');
    if (dragMode) {
      const v = vd.getBoundingClientRect();
      const el = document.elementFromPoint(v.left + cx * S + 1, v.top + cy * S + 1);
      const win = el && el.closest && el.closest('.win');
      if (win && vd.contains(win)) startDrag(APPS[win.dataset.app], cx, cy);
    }
    e.preventDefault();
  });
  pad.addEventListener('pointermove', e => {
    if (!padDown) return;
    const dx = e.clientX - padDown.x, dy = e.clientY - padDown.y;
    padDown.moved += Math.hypot(dx, dy);
    padDown.x = e.clientX; padDown.y = e.clientY;
    const gain = (VW / padDown.w) * .95 * SPEEDS[speedIx];
    cx = Math.max(0, Math.min(VW - 4, cx + dx * gain));
    cy = Math.max(0, Math.min(VH - 4, cy + dy * gain));
    placeCursor();
    if (drag) moveDrag(cx, cy);
    const r = pad.getBoundingClientRect();
    glowAt((e.clientX - r.left) / PS, (e.clientY - r.top) / PS);
  });
  const padUp = () => {
    if (!padDown) return;
    const tap = padDown.moved < 8 && performance.now() - padDown.t < 320;
    padDown = null;
    glow.classList.remove('on');
    if (drag) endDrag();
    else if (tap) clickAtCursor();
  };
  pad.addEventListener('pointerup', padUp);
  pad.addEventListener('pointercancel', padUp);

  // Phone buttons
  const go = (sel, detail) => {
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    if (detail) window.dispatchEvent(new CustomEvent('pp:select', { detail }));
  };
  function phoneAction(k) {
    const b = $(`[data-p="${k}"]`, pv);
    if (b && k !== 'drag') { b.classList.add('flash'); setTimeout(() => b.classList.remove('flash'), 260); }
    switch (k) {
      case 'kbd': return kbdDemo();
      case 'drag': dragMode = !dragMode; b.setAttribute('aria-pressed', dragMode); break;
      case 'apps': toggleLaunch(); break;
      case 'windows': ov ? exitOverview() : enterOverview(); break;
      case 'browse': openApp('browser'); break;
      case 'controls': openApp('settings'); break;
      case 'airplay': go('#connect'); break;
      case 'notes': go('#glasses', { mode: 'notes' }); break;
      case 'glasses': go('#glasses', { mode: 'translate' }); break;
      case 'sound': go('#builtin', { app: 'sound' }); break;
    }
  }
  pv.addEventListener('click', e => {
    const b = e.target.closest('[data-p]');
    if (!b) return;
    if (e.isTrusted) takeOver();
    phoneAction(b.dataset.p);
  });

  // Keyboard: 1–5 switch workspaces while the pointer is over the demo
  let overRig = false;
  rig.addEventListener('pointerenter', () => { overRig = true; });
  rig.addEventListener('pointerleave', () => { overRig = false; });
  document.addEventListener('keydown', e => {
    if (!overRig || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^[1-5]$/.test(e.key)) { takeOver(); switchWs(+e.key); }
    if (e.key === 'Escape') { toggleLaunch(false); exitOverview(); }
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

  // ---------- Reset and guided tour ----------
  function resetDesk() {
    toggleLaunch(false);
    exitOverview();
    removeWebApps();
    for (const k of CORE) {
      const a = APPS[k];
      a.max = a.snapped = false;
      a.ws = 1;
      layers[0].appendChild(a.el);
      setRect(a, a.def);
      a.state = a.open ? 'open' : 'closed';
      a.el.classList.toggle('hidden', !a.open);
      a.el.style.transform = ''; a.el.style.opacity = '';
    }
    APPS.chats.el.style.zIndex = 3; APPS.terminal.el.style.zIndex = 4; APPS.browser.el.style.zIndex = 6; Z = 10;
    speedIx = 2;
    $('output', APPS.settings.el).textContent = '1×';
    browserReset();
    switchWs(1, true);
    focus('browser');
    syncDock();
  }

  let touring = false, tourTok = 0;
  const demoMsg = $('#demoMsg'), replay = $('#replay');
  async function w(ms, tok) { await sleep(ms); if (tok !== tourTok) throw 0; }
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
  const vpos = el => { const r = el.getBoundingClientRect(), v = vd.getBoundingClientRect(); return { x: (r.left + r.width / 2 - v.left) / S, y: (r.top + r.height / 2 - v.top) / S }; };
  async function tapT(tok) { glow.classList.add('tap'); await w(130, tok); glow.classList.remove('tap'); clickAtCursor(); await w(160, tok); }
  async function clickEl(el, tok) { const p = vpos(el); await moveTo(p.x, p.y, tok); await tapT(tok); }
  async function press(k, tok) { phoneAction(k); await w(200, tok); }
  let heroVisible = true;
  new IntersectionObserver(es => { heroVisible = es[0].isIntersecting; }, { threshold: .15 }).observe(rig);
  async function whenVisible(tok) { while (!heroVisible || document.hidden) await w(400, tok); }

  async function runTour() {
    const tok = ++tourTok;
    touring = true;
    cursorOn(true);
    demoMsg.textContent = 'Playing a demo. Drag on the iPhone trackpad or click anything on the display to take over.';
    replay.hidden = true;
    try {
      for (;;) {
        await whenVisible(tok);
        await w(900, tok);
        await clickEl(dockBtn('files'), tok); await w(1000, tok);
        const f = APPS.files;
        await moveTo(f.x + f.w / 2 + 40, f.y + 12, tok);
        startDrag(f, cx, cy);
        await moveTo(5, 250, tok, 1000); await w(250, tok);
        endDrag(); await w(900, tok);
        await clickEl(dockBtn('settings'), tok); await w(900, tok);
        await clickEl($('[data-add]', APPS.settings.el), tok); await w(1300, tok);
        await whenVisible(tok);
        await clickEl(dockBtn('browser'), tok); await w(500, tok);
        await press('kbd', tok); await w(3600, tok);
        await clickEl($('.wsn[data-ws="2"]', vd), tok); await w(1500, tok);
        await clickEl($('.wsn[data-ws="1"]', vd), tok); await w(1000, tok);
        await press('windows', tok); await w(1800, tok);
        await clickEl(APPS.chats.el, tok); await w(1600, tok);
        await press('apps', tok); await w(1500, tok);
        await clickEl($('[data-launch="terminal"]', launchGrid), tok); await w(1800, tok);
        layersEl.style.opacity = 0; await w(550, tok);
        resetDesk(); layersEl.style.opacity = 1;
        await w(900, tok);
      }
    } catch (_) { if (drag) endDrag(); }
  }
  function takeOver() {
    if (!touring) return;
    touring = false;
    tourTok++;
    glow.classList.remove('on', 'tap');
    layersEl.style.opacity = 1;
    demoMsg.textContent = "You're in control: drag on the iPhone to move the pointer, tap to click, or use your mouse on the display.";
    replay.hidden = false;
  }
  replay.addEventListener('click', () => { resetDesk(); cx = 470; cy = 300; placeCursor(); runTour(); });

  // ---------- Boot ----------
  for (const k of CORE) makeWin(k);
  renderDock();
  resetDesk();
  chatStep();
  termRun();
  setInterval(() => { if (heroVisible && !document.hidden && !reduce) chatStep(); }, 6500);
  setInterval(() => { if (heroVisible && !document.hidden && !reduce) termRun(); }, 11000);
  if (reduce) {
    demoMsg.textContent = 'Drag on the iPhone trackpad or click anything on the display to try it.';
    replay.hidden = true;
  } else {
    setTimeout(runTour, 1200);
  }
})();
