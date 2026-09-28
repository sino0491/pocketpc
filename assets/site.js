// Page behavior: nav, reveals, feature animations, Smart Glasses HUD and Connect.
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const seen = (el, cb, threshold = .2) => new IntersectionObserver(es => es.forEach(e => cb(e.isIntersecting, e)), { threshold }).observe(el);

  // Nav: solid background after scrolling, highlight the current section
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('solid', scrollY > 20);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const navObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['features', 'glasses', 'connect', 'help'].forEach(id => { const s = document.getElementById(id); if (s) navObs.observe(s); });

  // Reveal on scroll
  const rev = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rev.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('[data-reveal]').forEach(el => rev.observe(el));

  // Marquee: duplicate once for a seamless loop
  const mq = $('#marquee');
  if (mq) mq.innerHTML += mq.innerHTML;

  // Cards: spotlight and a gentle tilt that follow the pointer
  if (hover && !reduce) $$('[data-tilt]').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', x * 100 + '%');
      card.style.setProperty('--my', y * 100 + '%');
      card.style.transition = 'transform .15s ease-out, border-color .3s';
      card.style.transform = `perspective(1000px) rotateX(${(.5 - y) * 4}deg) rotateY(${(x - .5) * 4}deg) translateY(-2px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transition = ''; card.style.transform = ''; });
  });

  // Resolution counter
  const vres = $('#vres');
  if (vres) {
    const RES = [['720p', 'Display glasses', 30], ['1080p', 'Glasses and monitors', 22], ['1440p', 'Monitors', 16], ['4K', 'TVs', 10]];
    let i = 0, vis = false;
    seen(vres, v => { vis = v; });
    const step = () => {
      const [n, l, px] = RES[i++ % RES.length];
      $('#resNum').innerHTML = `<span>${n}</span>`;
      $('#resLbl').textContent = l;
      vres.style.setProperty('--px', px + 'px');
    };
    step();
    if (!reduce) setInterval(() => vis && !document.hidden && step(), 1900);
  }

  // Trackpad gestures
  const vg = $('#vgest');
  if (vg) {
    const GS = [['move', 'Move', 'one finger'], ['tap', 'Click', 'tap'], ['scroll', 'Scroll', 'two fingers'], ['menu', 'Copy and paste', 'two-finger click']];
    let i = 0, vis = false;
    seen(vg, v => { vis = v; });
    const step = () => { const [g, t, d] = GS[i++ % GS.length]; vg.dataset.g = g; $('#gLbl').innerHTML = `<b>${t}</b> · ${d}`; };
    step();
    if (!reduce) setInterval(() => vis && !document.hidden && step(), 2600);
  }

  // Built-in apps tabs
  const APPD = {
    files: ['Files', 'Browse, import, organize and preview your files.'],
    terminal: ['Terminal', 'SSH into your Mac or server from anywhere.'],
    settings: ['Settings', 'Pointer speed, scrolling and your web apps.'],
    sound: ['Sound', 'Send audio to AirPods or the display, and set the volume from your iPhone.'],
  };
  const appTabs = $$('.apps-tabs [data-app]');
  let appAuto = true, appIx = 0, appVis = false;
  const row = (c, t, m = '', d = 0) => `<div class="va-row" style="animation-delay:${d}s"><i style="background:${c}"></i>${t}<em>${m}</em></div>`;
  const APPV = {
    files: () => `<div class="va">${row('#3d8bfd', 'Photos', 'Folder', 0)}${row('#3d8bfd', 'Projects', 'Folder', .06)}${row('#8a93a4', 'Budget 2026.csv', '38 KB', .12)}${row('#e64b50', 'Launch Video.mov', '48.6 MB', .18)}${row('#e0527a', 'Q4 Roadmap.pdf', '1.8 MB', .24)}</div>`,
    terminal: () => `<div class="va dark"><div class="va-term"><div style="animation-delay:0s">Connecting to my-mac.local…</div><div style="animation-delay:.6s"><span class="p">me@my-mac ~ %</span> uptime</div><div style="animation-delay:1.2s">up 12 days, 3 users</div><div style="animation-delay:1.8s"><span class="p">me@my-mac ~ %</span> ls</div><div style="animation-delay:2.4s">Desktop  Projects  site</div></div></div>`,
    settings: () => `<div class="va" style="background:#f2f3f6"><div class="va-set"><div class="va-row"><i style="background:#3977f6"></i>Pointer speed<em>1×</em></div><div class="va-row" style="animation-delay:.08s"><i style="background:#1cc8c1"></i>Natural scrolling<button class="tog" aria-checked="true" tabindex="-1"></button></div><div class="va-row" style="animation-delay:.16s"><i style="background:#6b5cff"></i>Web apps<em>Add to Dock</em></div><div class="va-row" style="animation-delay:.24s"><i style="background:#6a788b"></i>Clear Website Data</div></div></div>`,
    sound: () => `<div class="va" style="background:#f2f3f6"><div class="va-snd"><div class="va-row"><i style="background:#8a93a4"></i>iPhone<span class="ck">✓</span></div><div class="va-row on" style="animation-delay:.08s"><i style="background:#3977f6"></i>AirPods<span class="ck">✓</span></div><div class="va-row" style="animation-delay:.16s"><i style="background:#6b5cff"></i>Display<span class="ck">✓</span></div><div class="vol">🔈<span></span>🔊</div></div></div>`,
  };
  function selectApp(k) {
    const vapp = $('#vapp');
    if (vapp) vapp.innerHTML = APPV[k]();
    appTabs.forEach(b => b.setAttribute('aria-selected', b.dataset.app === k));
    $('#appsDesc').innerHTML = `<h4>${APPD[k][0]}</h4><p>${APPD[k][1]}</p>`;
    appIx = Object.keys(APPD).indexOf(k);
  }
  appTabs.forEach(b => {
    b.addEventListener('click', () => { appAuto = false; selectApp(b.dataset.app); });
    b.addEventListener('pointerenter', () => { if (hover) { appAuto = false; selectApp(b.dataset.app); } });
  });
  if ($('#builtin')) { seen($('#builtin'), v => { appVis = v; }); selectApp('files'); }
  if (!reduce) setInterval(() => { if (appAuto && appVis && !document.hidden) selectApp(Object.keys(APPD)[(appIx + 1) % 4]); }, 3200);

  // Real capture: flattens as it scrolls into view
  const capFrame = $('#capFrame'), capture = $('#capture');
  if (capFrame && !reduce) {
    let raf = 0;
    const upd = () => {
      raf = 0;
      const r = capture.getBoundingClientRect(), vh = innerHeight;
      const p = Math.max(0, Math.min(1, (vh - r.top) / (vh * .75)));
      capFrame.style.setProperty('--rx', (1 - p) * 16 + 'deg');
      capFrame.style.setProperty('--sc', .92 + p * .08);
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
    upd();
  }

  // Connect: device picker
  const DEVN = {
    glasses: "Glasses must accept video over USB-C (DisplayPort). Glasses with only a camera or speakers and no display aren't supported.",
    monitor: 'Connect a USB-C monitor directly, or an HDMI monitor with a compatible video adapter.',
    tv: 'Connect a TV with a compatible USB-C video adapter, or use AirPlay with an Apple TV or AirPlay TV.',
  };
  const devBtns = $$('[data-dev]').filter(b => b.tagName === 'BUTTON');
  let devAuto = true, devIx = 0, devVis = false;
  function selectDev(k) {
    devBtns.forEach(b => b.setAttribute('aria-pressed', b.dataset.dev === k));
    $$('g.dev').forEach(g => g.classList.toggle('on', g.dataset.dev === k));
    $('#devNote').textContent = DEVN[k];
    devIx = Object.keys(DEVN).indexOf(k);
  }
  devBtns.forEach(b => b.addEventListener('click', () => { devAuto = false; selectDev(b.dataset.dev); }));
  if ($('.cable-svg')) seen($('.cable-svg'), v => { devVis = v; });
  if (!reduce) setInterval(() => { if (devAuto && devVis && !document.hidden) selectDev(Object.keys(DEVN)[(devIx + 1) % 3]); }, 3400);

  // ---------- Smart Glasses HUD ----------
  const hv = $('#hv'), hudbox = $('#hudbox'), lens = $('#lens');
  if (!hv) return;
  let HS = 1;
  const fitHud = () => { const V = hudbox.clientWidth < 560 ? 640 : 960; HS = hudbox.clientWidth / V; hv.style.width = V + 'px'; hv.style.transform = `scale(${HS})`; hv.style.height = hudbox.clientHeight / HS + 'px'; };
  new ResizeObserver(fitHud).observe(hudbox);
  fitHud();

  $$('[data-view]').forEach(b => b.addEventListener('click', () => {
    $$('[data-view]').forEach(x => x.setAttribute('aria-pressed', x === b));
    lens.classList.toggle('raw', b.dataset.view === 'raw');
  }));

  let modeTok = 0, auto = true, gVis = false, curMode = 'translate';
  seen(lens, v => { gVis = v; }, .25);
  const MODES = ['translate', 'notes', 'walk'];
  const FINE = {
    translate: 'Download supported languages ahead of time to translate offline. Timing varies with your iPhone, language and audio quality.',
    notes: 'Summaries need an iPhone with Apple Intelligence; other iPhones still get the full transcript. An optional shortcut also saves notes to Apple Notes.',
    walk: 'Route searches use Apple Maps. Directions keep updating while your iPhone is locked and stop when navigation ends.',
  };
  const modeBtns = $$('.mode');
  async function hs(ms, tok) { await sleep(ms); while (!gVis || document.hidden) { await sleep(300); if (tok !== modeTok) throw 0; } if (tok !== modeTok) throw 0; }
  const prog = f => { const b = $('.mode[aria-selected="true"] .bar'); if (b) b.style.width = Math.round(f * 100) + '%'; };
  async function words(el, text, ms, tok) {
    for (const w of text.split(' ')) {
      const s = document.createElement('span');
      s.className = 'w'; s.textContent = w + ' ';
      el.appendChild(s);
      await hs(reduce ? 0 : ms, tok);
    }
  }

  const CONVO = [
    { o: 'Disculpe, ¿sabe dónde está la estación de tren?', t: 'Excuse me, do you know where the train station is?' },
    { you: 1, o: "Yes, it's about two blocks north of here, next to the pharmacy.", t: 'Sí, está a unos dos bloques al norte de aquí, al lado de la farmacia.' },
    { o: 'Perfecto, muchas gracias. ¿Y el tren a la ciudad sale cada media hora?', t: 'Perfect, thank you very much. And does the train to the city leave every half hour?' },
    { you: 1, o: 'I think it leaves every 20 minutes during the day.', t: 'Creo que sale cada 20 minutos durante el día.' },
    { o: 'Genial, voy a comprar el boleto ahora mismo, que tenga un buen día.', t: "Great, I'm going to buy the ticket right now, have a good day." },
  ];
  async function runTranslate(tok) {
    hv.innerHTML = '<div class="hud-h"><span>LIVE TRANSLATION · Spanish → English</span><span class="rec">LISTENING</span></div><div class="thread"></div>';
    const th = $('.thread', hv);
    for (let i = 0; i < CONVO.length; i++) {
      const m = CONVO[i], b = document.createElement('div');
      b.className = 'hb' + (m.you ? ' you' : '');
      b.innerHTML = `<small>${m.you ? 'YOU · ENGLISH' : 'SPANISH'}</small><div class="o"></div><div class="t"></div>`;
      th.appendChild(b);
      while (th.children.length > 5) th.firstChild.remove();
      await words($('.o', b), m.o, m.you ? 90 : 60, tok);
      await hs(300, tok);
      await words($('.t', b), m.t, m.you ? 50 : 100, tok);
      prog((i + 1) / CONVO.length);
      await hs(1200, tok);
    }
    await hs(1500, tok);
  }

  const MEETING = [
    ["Okay, let's lock the date for the beta launch.", 'Beta launch'],
    ['Design needs the final screenshots by Thursday.', 'Screenshots'],
    ["I'll send the updated budget right after this call.", 'Budget'],
    ["Great. Let's review sign-ups again next Monday.", 'Next steps'],
  ];
  async function runNotes(tok) {
    hv.innerHTML = `<div class="hud-h"><span>AI NOTES · Team sync</span><span class="rec" id="rt">REC 3:12</span></div>
      <div class="notes-grid"><div><div class="cap-h">LIVE CAPTIONS</div><div class="caps"></div></div><div><div class="cap-h">TOPICS</div><div class="topics"></div></div></div>
      <div class="saved"><div><b>✓ Saved to Files</b><div>Transcript · Summary · ${MEETING.length} topics</div></div></div>`;
    const caps = $('.caps', hv), topics = $('.topics', hv), rt = $('#rt'), t0 = Date.now();
    const timer = setInterval(() => {
      if (tok !== modeTok) return clearInterval(timer);
      const s = 192 + Math.floor((Date.now() - t0) / 1000);
      rt.textContent = `REC ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    }, 1000);
    try {
      for (let i = 0; i < MEETING.length; i++) {
        $$('p', caps).forEach(p => p.classList.add('old'));
        const p = document.createElement('p');
        caps.appendChild(p);
        while (caps.children.length > 4) caps.firstChild.remove();
        await words(p, MEETING[i][0], 110, tok);
        await hs(350, tok);
        const t = document.createElement('span');
        t.textContent = MEETING[i][1];
        topics.appendChild(t);
        prog((i + 1) / (MEETING.length + 1));
        await hs(1000, tok);
      }
      clearInterval(timer);
      rt.textContent = 'STOPPED';
      $('.saved', hv).classList.add('show');
      prog(1);
      await hs(2800, tok);
    } finally { clearInterval(timer); }
  }

  const ROUTE = 'M300 290 L300 190 L130 190 L130 60';
  const FT = 5.5, SEG = [100, 270, 400];
  const STEPS = [['Turn left onto Oak Street', 'left'], ['Turn right onto 3rd Avenue', 'right'], ['Arrive at Central Station', 'arrive']];
  const ARROWS = {
    straight: 'M50 88 V22 M30 42 L50 22 L70 42',
    left: 'M64 90 V52 Q64 38 50 38 H24 M38 24 L24 38 L38 52',
    right: 'M36 90 V52 Q36 38 50 38 H76 M62 24 L76 38 L62 52',
    arrive: 'M50 90 V20 M50 22 L78 32 L50 44',
  };
  async function runWalk(tok) {
    hv.innerHTML = `<div class="hud-h"><span>WALKING DIRECTIONS</span><span id="eta">0.4 mi · 8 min</span></div>
      <div class="walk">
        <div class="turn"><svg viewBox="0 0 100 100"><path id="arrow" d="${ARROWS.left}"/></svg><div><b id="instr">${STEPS[0][0]}</b><div class="dist" id="dist">550 ft</div></div></div>
        <svg class="map" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet">
          <path class="street" d="M300 320 V20 M20 190 H390 M130 320 V20 M20 60 H390"/>
          <text x="310" y="265">Main St</text><text x="180" y="180">Oak St</text><text x="140" y="120">3rd Ave</text>
          <path class="route" d="${ROUTE}"/><path class="walked" id="walked" d="${ROUTE}"/>
          <circle cx="130" cy="60" r="11" fill="none" stroke="#54ff61" stroke-width="3"/><text x="150" y="45">Central Station</text>
          <circle class="me-ring" id="ring" r="10" cx="300" cy="290"/><circle class="me" id="me" r="9" cx="300" cy="290"/>
        </svg>
      </div>`;
    const path = $('#walked', hv), me = $('#me', hv), ring = $('#ring', hv), total = path.getTotalLength();
    const instr = $('#instr', hv), dist = $('#dist', hv), arrow = $('#arrow', hv), eta = $('#eta', hv);
    path.style.strokeDasharray = `0 ${total + 10}`;
    let step = 0;
    const dur = 12000;
    let L = 0, last = performance.now();
    while (L < total) {
      await new Promise(r => requestAnimationFrame(r));
      if (tok !== modeTok) throw 0;
      const now = performance.now();
      if (gVis && !document.hidden) L = Math.min(total, L + (now - last) / dur * total);
      last = now;
      const pt = path.getPointAtLength(L);
      me.setAttribute('cx', pt.x); me.setAttribute('cy', pt.y);
      ring.setAttribute('cx', pt.x); ring.setAttribute('cy', pt.y);
      path.style.strokeDasharray = `${L} ${total + 10}`;
      while (step < 2 && L >= SEG[step]) {
        step++;
        instr.textContent = STEPS[step][0];
        arrow.setAttribute('d', ARROWS[STEPS[step][1]]);
      }
      const d = (SEG[step] - L) * FT;
      dist.textContent = `${Math.max(0, Math.round(d / 10) * 10)} ft`;
      const rem = (total - L) * FT;
      eta.textContent = `${(rem / 5280).toFixed(1)} mi · ${Math.max(1, Math.round(rem / 264))} min`;
      prog(L / total);
    }
    instr.textContent = 'You have arrived';
    dist.textContent = 'Central Station';
    dist.style.fontSize = '30px';
    arrow.setAttribute('d', ARROWS.arrive);
    eta.textContent = 'ARRIVED';
    await hs(2600, tok);
  }

  const RUN = { translate: runTranslate, notes: runNotes, walk: runWalk };
  function setMode(m, manual) {
    if (manual) auto = false;
    curMode = m;
    modeBtns.forEach(b => {
      const on = b.dataset.mode === m;
      b.setAttribute('aria-selected', on);
      const bar = $('.bar', b);
      bar.style.transition = 'none'; bar.style.width = '0'; void bar.offsetWidth; bar.style.transition = '';
    });
    $('#fine').textContent = FINE[m];
    run(m);
  }
  async function run(m) {
    const tok = ++modeTok;
    try {
      await RUN[m](tok);
      if (tok !== modeTok) return;
      if (auto) setMode(MODES[(MODES.indexOf(m) + 1) % MODES.length]);
      else setMode(m);
    } catch (_) { /* superseded by another mode */ }
  }
  modeBtns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode, true)));
  addEventListener('pp:select', e => {
    if (e.detail.mode) setMode(e.detail.mode, true);
    if (e.detail.app) { appAuto = false; selectApp(e.detail.app); }
  });
  setMode('translate');
})();
