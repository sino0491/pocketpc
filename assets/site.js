// Page behavior: nav, reveals, scroll effects, comparison, feature animations, Smart Glasses HUD and Connect.
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const seen = (el, cb, threshold = .2) => new IntersectionObserver(es => es.forEach(e => cb(e.isIntersecting, e)), { threshold }).observe(el);
  const once = (el, cb, threshold = .35) => { const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); cb(); } }, { threshold }); io.observe(el); };

  // Split text into word spans (--i is each word's index)
  function splitWords(root, unitsForElements) {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement('span');
            s.className = 'w';
            s.textContent = part;
            s.style.setProperty('--i', i++);
            frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          if (unitsForElements) {
            const s = document.createElement('span');
            s.className = 'w';
            s.style.setProperty('--i', i++);
            n.replaceWith(s);
            s.appendChild(n);
          } else walk(n);
        }
      });
    };
    walk(root);
    return $$('.w', root);
  }
  $$('[data-split]').forEach(h => splitWords(h, true));

  // Nav: solid background, current section, mobile menu, scroll progress
  const nav = $('#nav'), menuBtn = $('#menuBtn'), progress = $('#progress');
  const navObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['demo', 'why', 'features', 'real', 'glasses', 'connect', 'privacy', 'help', 'get'].forEach(id => { const s = document.getElementById(id); if (s) navObs.observe(s); });
  const setMenu = open => { nav.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', open); };
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  $$('#mnav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // Reveal on scroll
  const rev = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rev.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('[data-reveal]').forEach(el => rev.observe(el));

  // Marquee: duplicate once for a seamless loop
  const mq = $('#marquee');
  if (mq) mq.innerHTML += mq.innerHTML;

  // Statement: words light up as you scroll
  const lit = $('#lit'), litWords = lit ? splitWords(lit) : [];
  if (reduce) litWords.forEach(w => w.classList.add('on'));

  // Scroll-linked effects
  const heroCopy = $('#heroCopy'), rigScale = $('#rigScale'), stage = $('#demo');
  const capFrame = $('#capFrame'), capture = $('#capture');
  let raf = 0;
  function onScroll() {
    raf = 0;
    const y = scrollY, vh = innerHeight;
    nav.classList.toggle('solid', y > 20);
    const max = document.documentElement.scrollHeight - vh;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;
    if (reduce) return;
    if (heroCopy && y < vh * 1.2) {
      const p = clamp(y / (vh * .45), 0, 1);
      heroCopy.style.transform = `translateY(${y * .12}px) scale(${1 - p * .04})`;
      heroCopy.style.opacity = 1 - p;
    }
    if (rigScale && !stage.classList.contains('theater')) {
      const r = rigScale.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) rigScale.style.transform = `scale(${.94 + .06 * clamp((vh - r.top) / (vh * .75), 0, 1)})`;
    }
    if (lit) {
      const r = lit.getBoundingClientRect();
      const p = clamp((vh * .85 - r.top) / (r.height + vh * .35), 0, 1), n = Math.round(p * litWords.length);
      litWords.forEach((w, i) => w.classList.toggle('on', i < n));
    }
    if (capFrame) {
      const r = capture.getBoundingClientRect();
      if (r.top < vh * 1.2 && r.bottom > -vh * .2) {
        const p = clamp((vh - r.top) / (vh * .8), 0, 1);
        capFrame.style.setProperty('--rx', (1 - p) * 20 + 'deg');
        capFrame.style.setProperty('--sc', .9 + p * .1);
      }
    }
  }
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(onScroll); }, { passive: true });
  addEventListener('resize', () => { if (!raf) raf = requestAnimationFrame(onScroll); });
  onScroll();

  // Cards: spotlight and a gentle tilt that follow the pointer
  if (hover && !reduce) $$('[data-tilt]').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', x * 100 + '%');
      card.style.setProperty('--my', y * 100 + '%');
      card.style.transition = 'transform .15s ease-out, border-color .3s, opacity 1s';
      card.style.transform = `perspective(1100px) rotateX(${(.5 - y) * 3.5}deg) rotateY(${(x - .5) * 3.5}deg) translateY(-3px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transition = ''; card.style.transform = ''; });
  });

  // Feature visuals only animate while on screen
  const vizObs = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('play', e.isIntersecting)), { threshold: .05 });
  $$('.viz').forEach(v => vizObs.observe(v));
  const playing = el => el.classList.contains('play') && !document.hidden;

  // Comparison slider
  const cmp = $('#cmp');
  if (cmp) {
    const scr = $('.cmp-screen', cmp), handle = $('#cmpHandle');
    let p = 50, touched = false, dragging = false;
    const set = v => { p = clamp(v, 0, 100); cmp.style.setProperty('--p', p + '%'); cmp.classList.toggle('lo', p < 16); cmp.classList.toggle('hi', p > 84); handle.setAttribute('aria-valuenow', Math.round(p)); };
    const at = e => { const r = scr.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 100; };
    scr.addEventListener('pointerdown', e => {
      touched = dragging = true;
      try { scr.setPointerCapture(e.pointerId); } catch (_) {}
      scr.classList.add('dragging');
      set(at(e));
    });
    scr.addEventListener('pointermove', e => { if (dragging) set(at(e)); });
    const up = () => { dragging = false; scr.classList.remove('dragging'); };
    scr.addEventListener('pointerup', up);
    scr.addEventListener('pointercancel', up);
    handle.addEventListener('keydown', e => {
      const k = { ArrowLeft: -5, ArrowRight: 5, PageDown: -20, PageUp: 20 }[e.key];
      if (k) { touched = true; set(p + k); e.preventDefault(); }
      else if (e.key === 'Home') { touched = true; set(0); e.preventDefault(); }
      else if (e.key === 'End') { touched = true; set(100); e.preventDefault(); }
    });
    const tween = (a, b, d) => new Promise(res => {
      const t0 = performance.now();
      const f = t => {
        if (touched) return res();
        const k = Math.min(1, (t - t0) / d), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        set(a + (b - a) * e);
        k < 1 ? requestAnimationFrame(f) : res();
      };
      requestAnimationFrame(f);
    });
    if (!reduce) once(cmp, async () => { await sleep(500); await tween(50, 20, 900); await sleep(250); await tween(20, 80, 1400); await sleep(250); await tween(80, 50, 900); }, .5);
  }

  // Resolution counter
  const vres = $('#vres');
  if (vres) {
    const RES = [['720p', 'Display glasses', 30], ['1080p', 'Glasses and monitors', 22], ['1440p', 'Monitors', 16], ['4K', 'TVs', 10]];
    let i = 0;
    const step = () => {
      const [n, l, px] = RES[i++ % RES.length];
      $('#resNum').innerHTML = `<span>${n}</span>`;
      $('#resLbl').textContent = l;
      vres.style.setProperty('--px', px + 'px');
    };
    step();
    if (!reduce) setInterval(() => playing(vres) && step(), 1900);
  }

  // Trackpad gestures
  const vg = $('#vgest');
  if (vg) {
    const GS = [['move', 'Move', 'one finger'], ['tap', 'Click', 'tap'], ['scroll', 'Scroll', 'two fingers'], ['menu', 'Copy and paste', 'two-finger click']];
    let i = 0;
    const step = () => { const [g, t, d] = GS[i++ % GS.length]; vg.dataset.g = g; $('#gLbl').innerHTML = `<b>${t}</b> · ${d}`; };
    step();
    if (!reduce) setInterval(() => playing(vg) && step(), 2600);
  }

  // Keyboard shortcuts
  const vk = $('#vkeys');
  if (vk) {
    const KEYS = [[['⌘', '1–5'], 'Switch workspaces'], [['⌃', 'Space'], 'Open the app grid'], [['⇧', '⌘', '←'], 'Tile a window to the left'], [['⌘', 'Tab'], 'Cycle through windows'], [['⇧', '⌘', 'O'], 'See every window']];
    const row = $('#keysRow'), lbl = $('#keysLbl');
    let i = 0;
    const step = async () => {
      const [ks, t] = KEYS[i++ % KEYS.length];
      row.innerHTML = ks.map((k, j) => `<kbd style="--i:${j}">${k}</kbd>`).join('');
      lbl.textContent = t;
      lbl.style.animation = 'none'; void lbl.offsetWidth; lbl.style.animation = '';
      await sleep(750);
      const kb = $$('kbd', row);
      for (const k of kb) { k.classList.add('down'); await sleep(90); }
      await sleep(260);
      kb.forEach(k => k.classList.remove('down'));
    };
    step();
    if (!reduce) setInterval(() => playing(vk) && step(), 2800);
  }

  // Built-in apps tabs
  const APPD = {
    files: ['Files', 'Browse, import, organize and preview your files.'],
    terminal: ['Terminal', 'SSH into your Mac or server from anywhere.'],
    settings: ['Settings', 'Pointer speed, scrolling and your web apps.'],
    sound: ['Sound', 'Send audio to AirPods or the display, and set the volume from your iPhone.'],
  };
  const appTabs = $$('.apps-tabs [data-app]');
  let appAuto = true, appIx = 0;
  const row = (c, t, m = '', d = 0) => `<div class="va-row" style="animation-delay:${d}s"><i style="background:${c}"></i>${t}<em>${m}</em></div>`;
  const APPV = {
    files: () => `<div class="va">${row('#3d8bfd', 'Photos', 'Folder', 0)}${row('#3d8bfd', 'Projects', 'Folder', .06)}${row('#8a93a4', 'Budget 2026.csv', '38 KB', .12)}${row('#e64b50', 'Launch Video.mov', '48.6 MB', .18)}${row('#e0527a', 'Q4 Roadmap.pdf', '1.8 MB', .24)}${row('#f0a23b', 'Podcast Intro.m4a', '3.9 MB', .3)}</div>`,
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
  if ($('#vapp')) {
    selectApp('files');
    if (!reduce) setInterval(() => { if (appAuto && playing($('#vapp'))) selectApp(Object.keys(APPD)[(appIx + 1) % 4]); }, 3200);
  }

  // Every screen: the display morphs as you scroll through the steps
  const devStage = $('#devStage');
  if (devStage) {
    const STG = { glasses: ['1080p', 'cable', 'USB-C'], monitor: ['1440p', 'cable', 'USB-C or adapter'], tv: ['4K', 'airplay', 'AirPlay or adapter'] };
    const steps = $$('.sstep'), dsRes = $('#dsRes'), dsLink = $('#dsLink');
    const setStage = k => {
      if (devStage.dataset.stage === k) return;
      devStage.dataset.stage = k;
      steps.forEach(s => s.classList.toggle('on', s.dataset.stage === k));
      const [res, ic, link] = STG[k];
      dsRes.textContent = res;
      dsLink.innerHTML = `<svg class="i"><use href="#i-${ic}"/></svg><b>${link}</b>`;
      [dsRes, dsLink].forEach(x => { x.classList.remove('flip'); void x.offsetWidth; x.classList.add('flip'); });
    };
    const so = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setStage(e.target.dataset.stage); }), { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(s => so.observe(s));
  }

  // Numbers count up once
  $$('[data-count]').forEach(el => once(el, () => {
    if (reduce) return;
    const to = +el.dataset.count, from = el.dataset.from ? +el.dataset.from : 0, suf = el.dataset.suffix || '', d = to === 0 ? 1600 : 1200, t0 = performance.now();
    const f = t => {
      const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(from + (to - from) * e) + suf;
      if (k < 1) requestAnimationFrame(f);
    };
    el.textContent = from + suf;
    requestAnimationFrame(f);
  }, .6));

  // ---------- Smart Glasses HUD ----------
  const hv = $('#hv'), hudbox = $('#hudbox'), lens = $('#lens');
  if (!hv) return;
  let HS = 1;
  const fitHud = () => { const V = hudbox.clientWidth < 560 ? 640 : 960; HS = hudbox.clientWidth / V; hv.style.width = V + 'px'; hv.style.transform = `scale(${HS})`; hv.style.height = hudbox.clientHeight / HS + 'px'; };
  new ResizeObserver(fitHud).observe(hudbox);
  fitHud();

  // Look around: the world moves while the HUD stays in view
  if (hover && !reduce) {
    lens.addEventListener('pointermove', e => {
      const r = lens.getBoundingClientRect();
      lens.style.setProperty('--lx', ((e.clientX - r.left) / r.width - .5) * 2);
      lens.style.setProperty('--ly', ((e.clientY - r.top) / r.height - .5) * 2);
    });
    lens.addEventListener('pointerleave', () => { lens.style.setProperty('--lx', 0); lens.style.setProperty('--ly', 0); });
  }

  $$('[data-view]').forEach(b => b.addEventListener('click', () => {
    $$('[data-view]').forEach(x => x.setAttribute('aria-pressed', x === b));
    lens.classList.toggle('raw', b.dataset.view === 'raw');
  }));

  let modeTok = 0, auto = true, gVis = false;
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
    let step = 0, L = 0, last = performance.now();
    const dur = 12000;
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
      dist.textContent = `${Math.max(0, Math.round((SEG[step] - L) * FT / 10) * 10)} ft`;
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
    modeBtns.forEach(b => {
      b.setAttribute('aria-selected', b.dataset.mode === m);
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
      setMode(auto ? MODES[(MODES.indexOf(m) + 1) % MODES.length] : m);
    } catch (_) { /* superseded by another mode */ }
  }
  modeBtns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode, true)));
  addEventListener('pp:select', e => {
    if (e.detail.mode) setMode(e.detail.mode, true);
    if (e.detail.app) { appAuto = false; selectApp(e.detail.app); }
  });
  setMode('translate');
})();
