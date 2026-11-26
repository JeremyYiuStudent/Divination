/* Core: randomness, sound, DOM helpers, app shell, router, sky. */
(function () {
  'use strict';

  const reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  /** Scale a duration for reduced-motion users. */
  const T = (ms) => (reduced ? Math.round(ms * 0.35) : ms);
  const never = () => new Promise(() => {});

  /* ------------------------------------------------------------------ store */
  const store = {
    get(k, d) {
      try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set(k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ }
    },
  };

  /* ------------------------------------------------------------------- i18n
     Two languages: English and Simplified Chinese. Views are rebuilt when
     the language changes, so strings are resolved at render time.          */
  const I18N = {
    lang: store.get('div.lang', null) || ((navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'),
  };
  /** Pick the string for the current language. */
  const L = (en, zh) => (I18N.lang === 'zh' && zh != null ? zh : en);
  /** Resolve an {en, zh} pair (anything else passes through). */
  const tr = (v) => (v && typeof v === 'object' && !Array.isArray(v) && 'en' in v ? (I18N.lang === 'zh' && v.zh != null ? v.zh : v.en) : v);

  function applyStaticText() {
    document.documentElement.lang = I18N.lang === 'zh' ? 'zh-Hans' : 'en';
    document.querySelectorAll('[data-en]').forEach((el) => {
      el.textContent = I18N.lang === 'zh' ? el.dataset.zh : el.dataset.en;
    });
    document.querySelectorAll('[data-en-label]').forEach((el) => {
      el.setAttribute('aria-label', I18N.lang === 'zh' ? el.dataset.zhLabel : el.dataset.enLabel);
    });
    const lb = document.getElementById('lang-btn');
    if (lb) { lb.textContent = I18N.lang === 'zh' ? 'EN' : '中文'; lb.setAttribute('aria-label', I18N.lang === 'zh' ? 'Switch to English' : '切换到简体中文'); }
  }

  /* -------------------------------------------------------------------- RNG
     Every divinatory outcome is drawn from the browser's cryptographic
     generator, with rejection sampling so integer ranges are unbiased.     */
  const RNG = {
    u32() { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0]; },
    /** Uniform integer in [0, n). */
    int(n) {
      const limit = Math.floor(0x100000000 / n) * n;
      let x;
      do { x = this.u32(); } while (x >= limit);
      return x % n;
    },
    /** Uniform integer in [a, b]. */
    range(a, b) { return a + this.int(b - a + 1); },
    coin() { return this.int(2) === 1; },
    pick(arr) { return arr[this.int(arr.length)]; },
    /** Fisher–Yates, in place. */
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = this.int(i + 1);
        const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
      return arr;
    },
  };

  /* ------------------------------------------------------------------ sound
     Small synthesized palette — no audio files.                          */
  const Sfx = (() => {
    let ac = null, master = null, noiseBuf = null;
    let on = store.get('div.sound', true);

    function ctx() {
      if (!on) return null;
      if (!ac) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        ac = new C();
        master = ac.createGain();
        master.gain.value = 0.55;
        const comp = ac.createDynamicsCompressor();
        master.connect(comp); comp.connect(ac.destination);
        noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ac.state === 'suspended') ac.resume();
      return ac;
    }

    function tone(f, o = {}) {
      const a = ctx(); if (!a) return;
      const { dur = 1, type = 'sine', gain = 0.15, attack = 0.005, when = 0, glide } = o;
      const t = a.currentTime + when;
      const osc = a.createOscillator(), g = a.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f, t);
      if (glide) osc.frequency.exponentialRampToValueAtTime(glide, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(gain, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g); g.connect(master);
      osc.start(t); osc.stop(t + dur + 0.05);
    }

    function noise(o = {}) {
      const a = ctx(); if (!a) return;
      const { dur = 0.3, gain = 0.2, freq = 1200, q = 1, type = 'bandpass', when = 0, attack = 0.004, sweep } = o;
      const t = a.currentTime + when;
      const src = a.createBufferSource();
      src.buffer = noiseBuf; src.loop = true;
      const f = a.createBiquadFilter();
      f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
      if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur);
      const g = a.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(gain, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(master);
      src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
    }

    const r = (a, b) => a + Math.random() * (b - a);

    return {
      get on() { return on; },
      set(v) { on = v; store.set('div.sound', v); if (v) ctx(); },
      unlock() { ctx(); },
      tick() { tone(r(1700, 1900), { dur: 0.05, type: 'triangle', gain: 0.025 }); },
      bell(f = 528, gain = 0.07) {
        [1, 2.76, 5.4, 8.93].forEach((m, i) => tone(f * m, { dur: 2.6 - i * 0.5, gain: gain / (i + 1), attack: 0.003 }));
      },
      chime(f = 660) { this.bell(f, 0.05); tone(f * 1.5, { dur: 1.8, gain: 0.025, when: 0.08 }); },
      reveal() {
        [392, 493.9, 587.3, 784].forEach((f, i) => tone(f, { dur: 3.2, gain: 0.035, attack: 0.5 + i * 0.1, when: i * 0.06 }));
        noise({ dur: 2.4, gain: 0.03, freq: 6000, q: 0.6, attack: 0.8 });
      },
      coin() {
        tone(r(2500, 3100), { dur: 0.35, type: 'triangle', gain: 0.05 });
        tone(r(3800, 4400), { dur: 0.22, gain: 0.03 });
        noise({ dur: 0.04, gain: 0.12, freq: 5200, q: 2 });
      },
      clack() {
        noise({ dur: 0.07, gain: 0.35, freq: r(800, 1100), q: 5 });
        tone(r(200, 260), { dur: 0.12, type: 'triangle', gain: 0.1 });
      },
      stone() {
        noise({ dur: 0.06, gain: 0.25, freq: r(1900, 2600), q: 7 });
        tone(r(600, 900), { dur: 0.08, type: 'triangle', gain: 0.05 });
      },
      thud() { tone(110, { dur: 0.3, gain: 0.2, glide: 50 }); noise({ dur: 0.1, gain: 0.12, freq: 300, type: 'lowpass' }); },
      whoosh(d = 0.5) { noise({ dur: d, gain: 0.1, freq: 500, q: 0.8, sweep: 3200, attack: d * 0.45 }); },
      rattle(n = 5) {
        for (let i = 0; i < n; i++) noise({ dur: 0.045, gain: 0.16, freq: r(1400, 3000), q: 6, when: i * 0.05 + Math.random() * 0.02 });
      },
      sand() { noise({ dur: 0.05, gain: 0.05, freq: r(3000, 5000), q: 0.8 }); },
      flip() { noise({ dur: 0.18, gain: 0.08, freq: 1800, q: 0.7, sweep: 700, attack: 0.02 }); },
    };
  })();

  /* -------------------------------------------------------------------- DOM */
  function h(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* --------------------------------------------------------------- UI kit */
  const UI = {
    btn(label, onClick, opts = {}) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn' + (opts.primary ? ' primary' : '') + (opts.cls ? ' ' + opts.cls : '');
      b.innerHTML = label;
      b.addEventListener('click', (e) => { Sfx.tick(); if (onClick) onClick(e); });
      return b;
    },
    seg(options, value, onChange) {
      const w = h('<div class="seg" role="radiogroup"></div>');
      options.forEach((o) => {
        const b = h(`<button type="button" role="radio">${o.label}</button>`);
        const sel = o.value === value;
        b.classList.toggle('on', sel);
        b.setAttribute('aria-checked', sel);
        b.addEventListener('click', () => {
          if (w.classList.contains('locked')) return;
          $$('button', w).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
          Sfx.tick();
          onChange(o.value);
        });
        w.appendChild(b);
      });
      return w;
    },
    toggle(label, checked, onChange) {
      const l = h(`<label class="toggle"><input type="checkbox"${checked ? ' checked' : ''}><span class="track"><span class="knob"></span></span><span class="tlabel">${label}</span></label>`);
      $('input', l).addEventListener('change', (e) => { Sfx.tick(); onChange(e.target.checked); });
      return l;
    },
    /** Lock / unlock every control inside a container. */
    lock(container, locked) {
      $$('.seg', container).forEach((s) => s.classList.toggle('locked', locked));
      $$('.toggle input', container).forEach((i) => { i.disabled = locked; });
      container.classList.toggle('is-locked', locked);
    },
    resultActions(getText, onAgain) {
      const w = h('<div class="result-actions"></div>');
      w.append(
        UI.btn(L('Begin anew', '重新开始'), onAgain, { primary: true }),
        UI.btn(L('Copy result', '复制结果'), async () => {
          try { await navigator.clipboard.writeText(getText()); App.toast(L('Copied to clipboard', '已复制到剪贴板')); }
          catch (e) { App.toast(L('Copy is unavailable here', '此处无法复制')); }
        })
      );
      return w;
    },
  };

  /* ------------------------------------------------------------- run ctx
     Each mounted view gets a context. When the view is left, pending waits
     and animations never resolve, so ritual sequences simply stop.        */
  function makeCtx() {
    const timers = new Set();
    const cleanups = [];
    const ctx = {
      alive: true,
      wait(ms) {
        return new Promise((res) => {
          const id = setTimeout(() => { timers.delete(id); if (ctx.alive) res(); }, T(ms));
          timers.add(id);
        });
      },
      later(fn, ms) {
        const id = setTimeout(() => { timers.delete(id); if (ctx.alive) fn(); }, T(ms));
        timers.add(id);
      },
      /** Web Animation that commits its end state, then resolves. */
      anim(el, keyframes, opts) {
        if (typeof opts === 'number') opts = { duration: opts };
        opts = Object.assign({ easing: 'cubic-bezier(.2,.7,.2,1)' }, opts);
        opts.duration = T(opts.duration || 400);
        opts.delay = T(opts.delay || 0);
        opts.fill = 'both';
        const a = el.animate(keyframes, opts);
        return a.finished.then(() => {
          if (!ctx.alive) return never();
          try { a.commitStyles(); } catch (e) { /* detached */ }
          a.cancel();
          return a;
        }, () => never());
      },
      on(target, ev, fn, o) {
        target.addEventListener(ev, fn, o);
        cleanups.push(() => target.removeEventListener(ev, fn, o));
      },
      onDestroy(fn) { cleanups.push(fn); },
      destroy() {
        ctx.alive = false;
        timers.forEach(clearTimeout);
        cleanups.forEach((f) => { try { f(); } catch (e) { /* ignore */ } });
      },
    };
    return ctx;
  }

  /* -------------------------------------------------------------- app */
  const App = {
    oracles: [],
    reduced, T, store,
    register(o) { this.oracles.push(o); },

    toast(msg) {
      const t = $('#toast');
      t.textContent = msg;
      t.classList.add('show');
      clearTimeout(this._toastT);
      this._toastT = setTimeout(() => t.classList.remove('show'), 2200);
    },

    /** Gold particle burst from the centre of an element. */
    sparkle(el, count = 16) {
      if (reduced || !el || !el.getBoundingClientRect) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      for (let i = 0; i < count; i++) {
        const p = document.createElement('i');
        p.className = 'spark';
        p.style.left = cx + 'px'; p.style.top = cy + 'px';
        document.body.appendChild(p);
        const ang = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * Math.max(60, r.width * 0.7);
        const a = p.animate([
          { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
          { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(0)`, opacity: 0 },
        ], { duration: 700 + Math.random() * 600, easing: 'cubic-bezier(.1,.7,.3,1)' });
        a.onfinish = () => p.remove();
      }
    },

    record(oracleId, title, detail) {
      const list = store.get('div.journal', []);
      list.unshift({ t: Date.now(), o: oracleId, title, detail });
      store.set('div.journal', list.slice(0, 150));
      renderJournal();
      const b = $('#journal-btn');
      b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse');
    },

    modal(contentEl) {
      const m = $('#modal');
      const body = $('.modal-body', m);
      body.innerHTML = '';
      body.appendChild(contentEl);
      m.hidden = false;
      requestAnimationFrame(() => m.classList.add('open'));
      Sfx.flip();
    },
    closeModal() {
      const m = $('#modal');
      m.classList.remove('open');
      setTimeout(() => { if (!m.classList.contains('open')) m.hidden = true; }, 350);
    },
  };

  /* ------------------------------------------------------------ journal */
  function renderJournal() {
    const list = store.get('div.journal', []);
    const ol = $('#journal-list');
    if (!ol) return;
    if (!list.length) {
      ol.innerHTML = `<li class="empty">${L('No castings yet. Whatever you draw will be written here.', '尚无记录。每一次占卜都会记在这里。')}</li>`;
      return;
    }
    ol.innerHTML = list.map((e) => {
      const o = App.oracles.find((x) => x.id === e.o);
      const d = new Date(e.t);
      const loc = I18N.lang === 'zh' ? 'zh-CN' : undefined;
      return `<li><div class="j-meta"><span class="j-oracle">${o ? esc(tr(o.name)) : esc(e.o)}</span><time>${d.toLocaleDateString(loc, { month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })}</time></div><div class="j-title">${esc(e.title)}</div>${e.detail ? `<div class="j-detail">${esc(e.detail)}</div>` : ''}</li>`;
    }).join('');
  }

  function setJournal(open) {
    const j = $('#journal');
    j.classList.toggle('open', open);
    j.setAttribute('aria-hidden', !open);
    $('#scrim').classList.toggle('show', open);
    if (open) { renderJournal(); Sfx.flip(); }
  }

  /* -------------------------------------------------------------- router */
  let current = { el: null, ctx: null };

  function show(build) {
    const stage = $('#stage');
    const old = current;
    if (old.ctx) old.ctx.destroy();
    if (old.el) {
      const oe = old.el;
      oe.classList.add('leaving');
      setTimeout(() => oe.remove(), 450);
    }
    const ctx = makeCtx();
    const el = build(ctx);
    stage.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('entered')));
    current = { el, ctx };
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  }

  function homeView(ctx) {
    const el = h(`<section class="view home">
      <div class="hero">
        <div class="sigil-wrap">${sigilSVG()}</div>
        <h1 class="hero-title">${L('Divination', '占卜')}</h1>
        <p class="lede">${L('Six oracles, cast the old ways. Choose one, quiet the mind, and begin.', '六种古法占卜。择一而行，静心之后，即可开始。')}</p>
      </div>
      <div class="oracle-grid"></div>
      <p class="footnote">${L('Every cast draws on your device’s cryptographic random source. The meanings shown are the traditional ones; how they apply is yours to read.', '每一次起卦都取自设备的加密随机数。所示释义为传统通释，如何解读由你自己决定。')}</p>
    </section>`);
    const grid = $('.oracle-grid', el);
    App.oracles.forEach((o, i) => {
      const tile = h(`<a class="oracle-tile" href="#/${o.id}" style="--i:${i};--hue:${o.hue}">
        <div class="tile-glare"></div>
        <div class="tile-art">${o.art}</div>
        <div class="tile-native">${tr(o.native)}</div>
        <h2>${tr(o.name)}</h2>
        <p>${tr(o.blurb)}</p>
        <span class="tile-cta">${L('Begin', '开始')} <span aria-hidden="true">→</span></span>
      </a>`);
      ctx.on(tile, 'pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = tile.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        tile.style.setProperty('--rx', ((0.5 - y) * 10).toFixed(2) + 'deg');
        tile.style.setProperty('--ry', ((x - 0.5) * 12).toFixed(2) + 'deg');
        tile.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
        tile.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
      });
      ctx.on(tile, 'pointerleave', () => {
        tile.style.setProperty('--rx', '0deg'); tile.style.setProperty('--ry', '0deg');
      });
      ctx.on(tile, 'pointerenter', () => Sfx.tick());
      grid.appendChild(tile);
    });
    return el;
  }

  function sigilSVG() {
    const runes = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛟᛞ';
    const tris = '☰☱☲☳☴☵☶☷';
    let outer = '', mid = '', ticks = '';
    [...runes].forEach((c, i) => {
      const a = (i / 24) * 360;
      outer += `<text transform="rotate(${a} 150 150) translate(150 24)" class="sg-rune">${c}</text>`;
    });
    [...tris].forEach((c, i) => {
      const a = (i / 8) * 360;
      mid += `<text transform="rotate(${a} 150 150) translate(150 66)" class="sg-tri">${c}</text>`;
    });
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const r1 = 104, r2 = i % 3 === 0 ? 96 : 100;
      ticks += `<line x1="${150 + Math.cos(a) * r1}" y1="${150 + Math.sin(a) * r1}" x2="${150 + Math.cos(a) * r2}" y2="${150 + Math.sin(a) * r2}"/>`;
    }
    const star = (() => {
      let d = '';
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
        const rr = i % 2 ? 14 : 44;
        d += (i ? 'L' : 'M') + (150 + Math.cos(a) * rr).toFixed(1) + ' ' + (150 + Math.sin(a) * rr).toFixed(1);
      }
      return d + 'Z';
    })();
    return `<svg class="sigil" viewBox="0 0 300 300" aria-hidden="true">
      <g class="sg-ring sg-r1"><circle cx="150" cy="150" r="140"/><circle cx="150" cy="150" r="114"/>${outer}</g>
      <g class="sg-ring sg-r2"><circle cx="150" cy="150" r="106" class="faint"/>${ticks}${mid}</g>
      <g class="sg-ring sg-r3"><circle cx="150" cy="150" r="56"/><path d="${star}" class="sg-star"/><circle cx="150" cy="150" r="5" class="sg-core"/></g>
    </svg>`;
  }

  function oracleView(o) {
    return (ctx) => {
      const el = h(`<section class="view oracle oracle-${o.id}" style="--hue:${o.hue}">
        <div class="oracle-head">
          <a class="back" href="#/"><span aria-hidden="true">←</span> ${L('All oracles', '全部占卜')}</a>
          <div class="oracle-titles">
            <div class="oracle-native">${tr(o.native)}</div>
            <h1>${tr(o.name)}</h1>
            <p>${tr(o.subtitle)}</p>
          </div>
        </div>
        <div class="oracle-body"></div>
      </section>`);
      o.mount($('.oracle-body', el), ctx);
      return el;
    };
  }

  function route() {
    const id = location.hash.replace(/^#\/?/, '');
    const o = App.oracles.find((x) => x.id === id);
    show(o ? oracleView(o) : homeView);
    document.title = o ? `${tr(o.name)} · ${L('Divination', '占卜')}` : L('Divination', '占卜');
  }

  /* ----------------------------------------------------------------- sky */
  function startSky() {
    const c = $('#sky');
    const g = c.getContext('2d');
    let W, H, stars = [], shoot = null;
    let mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5;

    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      c.width = W * dpr; c.height = H * dpr;
      c.style.width = W + 'px'; c.style.height = H + 'px';
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(500, Math.round((W * H) / 4200));
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H, z: Math.random(),
        r: Math.random() * 1.1 + 0.25, p: Math.random() * 6.283, s: 0.4 + Math.random() * 1.6,
        gold: Math.random() < 0.14,
      }));
      if (reduced) draw(0);
    }

    function draw(t) {
      mx += (tmx - mx) * 0.04; my += (tmy - my) * 0.04;
      g.clearRect(0, 0, W, H);
      const sy = window.scrollY || 0;
      for (const s of stars) {
        const tw = reduced ? 0.8 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.001 * s.s + s.p));
        const ox = (mx - 0.5) * s.z * -28;
        let y = (s.y + (my - 0.5) * s.z * -18 - sy * s.z * 0.06) % H;
        if (y < 0) y += H;
        g.globalAlpha = tw * (0.35 + 0.65 * s.z);
        g.fillStyle = s.gold ? '#f3d79a' : '#e6e4ff';
        g.beginPath(); g.arc(s.x + ox, y, s.r * (0.6 + 0.7 * s.z), 0, 6.283); g.fill();
      }
      if (!reduced) {
        if (!shoot && Math.random() < 0.0025) {
          shoot = { x: W * (0.3 + Math.random() * 0.7), y: Math.random() * H * 0.45, vx: -(7 + Math.random() * 5), vy: 2.5 + Math.random() * 2.5, life: 0 };
        }
        if (shoot) {
          shoot.life++; shoot.x += shoot.vx; shoot.y += shoot.vy;
          const tx = shoot.x - shoot.vx * 14, ty = shoot.y - shoot.vy * 14;
          const gr = g.createLinearGradient(shoot.x, shoot.y, tx, ty);
          gr.addColorStop(0, 'rgba(255,240,210,.95)'); gr.addColorStop(1, 'rgba(255,240,210,0)');
          g.globalAlpha = Math.max(0, 1 - shoot.life / 55);
          g.strokeStyle = gr; g.lineWidth = 1.5;
          g.beginPath(); g.moveTo(shoot.x, shoot.y); g.lineTo(tx, ty); g.stroke();
          if (shoot.life > 55) shoot = null;
        }
      }
      g.globalAlpha = 1;
    }

    function loop(t) { draw(t); requestAnimationFrame(loop); }
    addEventListener('resize', resize);
    addEventListener('pointermove', (e) => { tmx = e.clientX / W; tmy = e.clientY / H; }, { passive: true });
    resize();
    if (!reduced) requestAnimationFrame(loop);
    else addEventListener('scroll', () => draw(0), { passive: true });
  }

  function startGlow() {
    const el = $('#glow');
    if (reduced || matchMedia('(pointer: coarse)').matches) { el.remove(); return; }
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function f() {
      x += (tx - x) * 0.12; y += (ty - y) * 0.12;
      el.style.transform = `translate(${x}px, ${y}px)`;
      requestAnimationFrame(f);
    })();
  }

  /* ---------------------------------------------------------------- boot */
  function boot() {
    startSky();
    startGlow();

    applyStaticText();
    $('#lang-btn').addEventListener('click', () => {
      I18N.lang = I18N.lang === 'zh' ? 'en' : 'zh';
      store.set('div.lang', I18N.lang);
      applyStaticText();
      renderJournal();
      App.closeModal();
      Sfx.tick();
      route();
    });

    const sb = $('#sound-btn');
    const syncSound = () => { sb.setAttribute('aria-pressed', Sfx.on); sb.classList.toggle('off', !Sfx.on); };
    syncSound();
    sb.addEventListener('click', () => { Sfx.set(!Sfx.on); syncSound(); Sfx.chime(880); });
    // Audio contexts need a user gesture before they can start.
    addEventListener('pointerdown', () => Sfx.unlock(), { once: true });

    $('#journal-btn').addEventListener('click', () => setJournal(true));
    $('#journal-close').addEventListener('click', () => setJournal(false));
    $('#scrim').addEventListener('click', () => setJournal(false));
    $('#journal-clear').addEventListener('click', () => {
      if (!confirm(L('Clear every entry in the journal?', '确定清空全部记录吗？'))) return;
      store.set('div.journal', []); renderJournal();
    });

    const m = $('#modal');
    $('.modal-close', m).addEventListener('click', () => App.closeModal());
    m.addEventListener('click', (e) => { if (e.target === m) App.closeModal(); });
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { App.closeModal(); setJournal(false); }
    });

    addEventListener('hashchange', route);
    route();
  }

  window.Div = { App, RNG, Sfx, UI, h, $, $$, esc, boot, L, tr, I18N };
})();
