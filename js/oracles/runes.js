/* Elder Futhark runes — draw from the pouch, or cast all on the cloth. */
(function () {
  'use strict';
  const { App, RNG, Sfx, UI, h, $, $$, esc, L, tr } = window.Div;
  const D = window.DATA;
  const ME = window.MEANINGS;

  const METHODS = {
    one: { label: { en: 'Odin’s Rune', zh: '奥丁之符' }, n: 1, pos: [{ en: 'The Rune', zh: '此符' }], kind: 'pouch' },
    norns: {
      label: { en: 'The Three Norns', zh: '命运三女神' }, n: 3, kind: 'pouch',
      pos: [{ en: 'Urðr · what was', zh: '乌尔德 · 已然' }, { en: 'Verðandi · what is becoming', zh: '薇儿丹蒂 · 正在形成' }, { en: 'Skuld · what shall be', zh: '诗蔻蒂 · 将然' }],
    },
    cast: { label: { en: 'Casting on Cloth', zh: '布上撒符' }, n: 3, pos: [{ en: 'First', zh: '第一' }, { en: 'Second', zh: '第二' }, { en: 'Third', zh: '第三' }], kind: 'cast' },
  };

  const rr = (a, b) => a + Math.random() * (b - a);
  function stoneShape() {
    const a = rr(40, 60), b = rr(40, 60), c = rr(40, 60), d = rr(40, 60);
    return `${a.toFixed(0)}% ${(100 - a).toFixed(0)}% ${b.toFixed(0)}% ${(100 - b).toFixed(0)}% / ${c.toFixed(0)}% ${d.toFixed(0)}% ${(100 - d).toFixed(0)}% ${(100 - c).toFixed(0)}%`;
  }
  function stoneEl(rune, merk) {
    const el = h(`<div class="stone${merk ? ' merk' : ''}" style="--shape:${stoneShape()};--tone:${rr(-8, 8).toFixed(1)}%">
      <div class="st-inner">
        <div class="st-face st-blank"></div>
        <div class="st-face st-carved"><span class="st-glyph">${rune.glyph}</span></div>
      </div>
    </div>`);
    return el;
  }

  function pouchSVG() {
    return `<svg viewBox="0 0 200 220" class="pouch-svg" aria-hidden="true">
      <defs>
        <radialGradient id="pg" cx=".38" cy=".45" r=".7"><stop offset="0" stop-color="#8a5a34"/><stop offset=".65" stop-color="#5a3519"/><stop offset="1" stop-color="#2e1a0b"/></radialGradient>
        <linearGradient id="pn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7b4d2b"/><stop offset="1" stop-color="#4a2c14"/></linearGradient>
      </defs>
      <ellipse cx="100" cy="206" rx="70" ry="9" fill="rgba(0,0,0,.45)"/>
      <path d="M62 70 C20 96 18 186 60 200 C84 208 116 208 140 200 C182 186 180 96 138 70 Z" fill="url(#pg)"/>
      <path d="M70 84 C52 110 50 170 70 190" stroke="#a87548" stroke-opacity=".35" stroke-width="3" fill="none"/>
      <path d="M62 70 C70 52 76 36 70 22 C90 30 110 30 130 22 C124 36 130 52 138 70 Z" fill="url(#pn)"/>
      <path d="M60 70 Q100 82 140 70" stroke="#c9a56a" stroke-width="4" fill="none"/>
      <path d="M60 70 Q100 82 140 70" stroke="#3a240f" stroke-width="1" stroke-dasharray="3 4" fill="none"/>
      <path d="M136 72 C150 86 156 104 150 118" stroke="#c9a56a" stroke-width="3" fill="none"/>
      <circle cx="150" cy="121" r="5" fill="#d9b56c"/>
      <text x="100" y="150" text-anchor="middle" class="pouch-rune">ᛟ</text>
    </svg>`;
  }

  const gloss = (r) => L(r.meaning, r.meaningZh);
  /** Traditional sense of the rune in the orientation it was drawn. */
  function runeMeaning(d) {
    const m = ME.runes[d.rune.i];
    return d.merk ? L(m[2], m[3]) : L(m[0], m[1]);
  }

  function runeCard(d, label, k) {
    const r = d.rune;
    return `<div class="rn-card" style="--d:${k}">
      <div class="eyebrow">${esc(label)}</div>
      <div class="rn-glyph${d.merk ? ' merk' : ''}">${r.glyph}</div>
      <div class="rn-name">${r.name}</div>
      <div class="rn-meta">/${r.sound}/ · “${gloss(r)}”</div>
      <div class="rn-aett">${L(r.aett, r.aettZh)}</div>
      ${d.merk ? `<span class="badge">${L('Merkstave', '逆位')}</span>` : r.rev ? `<span class="rn-up">${L('Upright', '正位')}</span>` : `<span class="rn-up">${L('Cannot be reversed', '无逆位')}</span>`}
      <p class="meaning"><span class="meaning-label">${L('General meaning', '通释')}</span>${esc(runeMeaning(d))}</p>
    </div>`;
  }

  App.register({
    id: 'runes',
    name: { en: 'Runes', zh: '卢恩符文' },
    native: 'ᚠᚢᚦᚨᚱᚲ',
    hue: 200,
    subtitle: { en: 'The twenty-four staves of the Elder Futhark, drawn blind from the pouch or cast upon white cloth.', zh: '古弗萨克的二十四枚符文，自袋中盲抽，或撒于白布之上。' },
    blurb: { en: 'Draw from the pouch for Odin’s rune or the three Norns, or cast all twenty-four upon the cloth.', zh: '从袋中抽取奥丁之符或命运三女神，或将二十四枚符文撒于布上。' },
    art: `<div class="art-runes"><span class="stone-mini" style="--r:-10deg">ᚱ</span><span class="stone-mini big" style="--r:4deg">ᚨ</span><span class="stone-mini" style="--r:12deg">ᛉ</span></div>`,

    mount(root, ctx) {
      let methodId = App.store.get('runes.method', 'norns');
      let allowMerk = App.store.get('runes.merk', true);
      let bag = [];
      let drawn = [];
      let busy = false;
      let phase = 'ready';

      root.innerHTML = `
        <div class="controls rn-controls"></div>
        <div class="status rn-status"></div>
        <div class="rn-table"></div>
        <div class="actions rn-actions"></div>
        <div class="result-wrap rn-result"></div>`;
      const controls = $('.rn-controls', root);
      const status = $('.rn-status', root);
      const table = $('.rn-table', root);
      const actions = $('.rn-actions', root);
      const resultBox = $('.rn-result', root);

      controls.append(
        UI.seg(Object.entries(METHODS).map(([k, m]) => ({ value: k, label: tr(m.label) })), methodId, (v) => {
          methodId = v; App.store.set('runes.method', v); reset();
        }),
        UI.toggle(L('Merkstave (reversed)', '允许逆位'), allowMerk, (v) => { allowMerk = v; App.store.set('runes.merk', v); })
      );

      const M = () => { const m = METHODS[methodId]; return { n: m.n, kind: m.kind, label: tr(m.label), pos: m.pos.map(tr) }; };
      function say(text) {
        status.innerHTML = text;
        status.classList.remove('swap'); void status.offsetWidth; status.classList.add('swap');
      }
      function setActions(...els) { actions.innerHTML = ''; els.forEach((e) => e && actions.appendChild(e)); }
      const orient = (rune) => allowMerk && rune.rev && RNG.coin();

      function slotsHTML() {
        return `<div class="rn-slots n${M().n}">${M().pos.map((p) => `<div class="rn-slot"><div class="rn-well"></div><div class="rn-label">${esc(p)}</div></div>`).join('')}</div>`;
      }

      function reset() {
        bag = RNG.shuffle(D.runes.slice());
        drawn = []; busy = false; phase = 'ready';
        resultBox.innerHTML = '';
        UI.lock(controls, false);
        if (M().kind === 'pouch') {
          table.innerHTML = `<div class="rn-pouchstage"><button type="button" class="rn-pouch" aria-label="${L('Draw a rune from the pouch', '从袋中抽取符文')}">${pouchSVG()}</button>${slotsHTML()}</div>`;
          $('.rn-pouch', table).addEventListener('click', drawFromPouch);
          say(M().n === 1 ? L('Reach into the pouch and draw a single rune.', '伸手入袋，抽出一枚符文。') : L('Draw three runes from the pouch, one for each Norn.', '从袋中抽出三枚符文，每位女神一枚。'));
          setActions(UI.btn(L('Draw a rune', '抽取符文'), drawFromPouch, { primary: true }));
        } else {
          table.innerHTML = `<div class="rn-caststage"><div class="rn-cloth"><div class="rn-cloth-ring"></div></div>${slotsHTML()}</div>`;
          say(L('Gather all twenty-four runes and cast them upon the cloth.', '拢起全部二十四枚符文，撒向白布。'));
          setActions(UI.btn(L('Cast the runes', '撒出符文'), castAll, { primary: true }));
        }
      }

      /* ----------------------------------------------------- pouch */
      async function drawFromPouch() {
        if (busy || phase === 'done' || drawn.length >= M().n) return;
        busy = true;
        UI.lock(controls, true);
        $$('button', actions).forEach((b) => { b.disabled = true; });
        const pouch = $('.rn-pouch', table);
        Sfx.rattle(7);
        await ctx.anim(pouch, [
          { transform: 'rotate(0deg) scale(1)' }, { transform: 'rotate(-7deg) scale(1.03)' }, { transform: 'rotate(6deg) scale(1.02)' },
          { transform: 'rotate(-4deg)' }, { transform: 'rotate(2deg)' }, { transform: 'rotate(0deg) scale(1)' },
        ], { duration: 700, easing: 'ease-in-out' });

        const rune = bag.pop();
        const merk = orient(rune);
        const k = drawn.length;
        drawn.push({ rune, merk });
        const well = $$('.rn-well', table)[k];
        const st = stoneEl(rune, merk);
        well.appendChild(st);
        const pr = pouch.getBoundingClientRect(), sr = st.getBoundingClientRect();
        const dx = pr.left + pr.width / 2 - (sr.left + sr.width / 2);
        const dy = pr.top + pr.height * 0.3 - (sr.top + sr.height / 2);
        Sfx.whoosh(0.35);
        await ctx.anim(st, [
          { transform: `translate(${dx}px, ${dy}px) scale(.2)`, opacity: 0 },
          { transform: `translate(${dx * 0.6}px, ${dy - 110}px) scale(.9) rotate(-20deg)`, opacity: 1, offset: 0.45 },
          { transform: 'translate(0,0) scale(1) rotate(0deg)' },
        ], { duration: 900, easing: 'cubic-bezier(.3,.6,.3,1)' });
        Sfx.stone();
        await ctx.wait(300);
        st.classList.add('revealed');
        Sfx.flip();
        ctx.later(() => { Sfx.chime(440 + k * 110); App.sparkle(st, 14); }, 350);
        await ctx.wait(900);
        busy = false;
        const left = M().n - drawn.length;
        if (left === 0) { finish(); return; }
        say(L(`${rune.name}${merk ? ', merkstave' : ''}. Draw again — ${left} more.`, `${rune.name}${merk ? '（逆位）' : ''}。继续抽取——还剩 ${left} 枚。`));
        setActions(UI.btn(L('Draw a rune', '抽取符文'), drawFromPouch, { primary: true }));
      }

      /* ------------------------------------------------------ cast */
      async function castAll() {
        if (busy) return;
        busy = true; phase = 'casting';
        UI.lock(controls, true);
        setActions();
        say(L('The runes are cast…', '符文已撒出……'));
        const cloth = $('.rn-cloth', table);
        const order = RNG.shuffle(D.runes.slice());
        // Scatter positions (cosmetic) inside the cloth circle, avoiding overlaps.
        const pts = [];
        let tries = 0;
        while (pts.length < order.length && tries < 4000) {
          tries++;
          const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.4;
          const p = { x: 0.5 + Math.cos(a) * r, y: 0.5 + Math.sin(a) * r };
          if (pts.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > 0.105 - Math.min(0.03, tries / 80000))) pts.push(p);
        }
        while (pts.length < order.length) pts.push({ x: 0.5 + rr(-0.35, 0.35), y: 0.5 + rr(-0.35, 0.35) });

        const stones = order.map((rune, i) => {
          const merk = orient(rune);
          const st = stoneEl(rune, merk);
          st.classList.add('cast');
          st.style.left = (pts[i].x * 100).toFixed(2) + '%';
          st.style.top = (pts[i].y * 100).toFixed(2) + '%';
          st._rot = rr(-40, 40).toFixed(1) + 'deg';
          st.style.setProperty('--rot', st._rot);
          st._rune = rune; st._merk = merk;
          st.setAttribute('role', 'button');
          st.setAttribute('tabindex', '0');
          st.setAttribute('aria-label', L('A face-down rune', '一枚背面朝上的符文'));
          cloth.appendChild(st);
          return st;
        });
        await Promise.all(stones.map((st, i) => {
          const delay = i * 45 + Math.random() * 60;
          ctx.later(() => Sfx.stone(), delay + 520);
          return ctx.anim(st, [
            { transform: `translate(-50%, -50%) translate(${rr(-60, 60)}px, -420px) rotate(${rr(-180, 180)}deg) scale(1.3)`, opacity: 0 },
            { transform: `translate(-50%, -50%) translate(0, 0) rotate(${st._rot}) scale(1)`, opacity: 1, offset: 0.75 },
            { transform: `translate(-50%, -50%) translate(0, -8px) rotate(${st._rot}) scale(1)`, offset: 0.87 },
            { transform: `translate(-50%, -50%) rotate(${st._rot}) scale(1)` },
          ], { duration: 720, delay, easing: 'cubic-bezier(.3,.5,.4,1)' });
        }));
        busy = false; phase = 'picking';
        say(L('Without looking, choose three stones — one at a time.', '不看符面，逐一选出三枚石头。'));
        stones.forEach((st) => {
          st.addEventListener('click', () => pick(st));
          st.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(st); } });
        });
      }

      async function pick(st) {
        if (busy || phase !== 'picking' || st.classList.contains('picked')) return;
        busy = true;
        const k = drawn.length;
        drawn.push({ rune: st._rune, merk: st._merk });
        st.classList.add('picked');
        const well = $$('.rn-well', table)[k];
        const r1 = st.getBoundingClientRect();
        st.classList.remove('cast');
        st.style.left = st.style.top = '';
        st.style.transform = '';
        well.appendChild(st);
        const r2 = st.getBoundingClientRect();
        const dx = r1.left + r1.width / 2 - (r2.left + r2.width / 2);
        const dy = r1.top + r1.height / 2 - (r2.top + r2.height / 2);
        Sfx.whoosh(0.3);
        await ctx.anim(st, [
          { transform: `translate(${dx}px, ${dy}px) scale(.82)` },
          { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 60}px) scale(1.1)`, offset: 0.5 },
          { transform: 'none' },
        ], { duration: 750, easing: 'cubic-bezier(.3,.6,.3,1)' });
        Sfx.stone();
        st.classList.add('revealed');
        Sfx.flip();
        ctx.later(() => { Sfx.chime(440 + k * 110); App.sparkle(st, 14); }, 350);
        await ctx.wait(800);
        busy = false;
        if (drawn.length === M().n) {
          $$('.rn-cloth .stone', table).forEach((s) => s.classList.add('dim'));
          finish();
        } else {
          say(L(`${st._rune.name}${st._merk ? ', merkstave' : ''}. Choose ${M().n - drawn.length} more.`, `${st._rune.name}${st._merk ? '（逆位）' : ''}。再选 ${M().n - drawn.length} 枚。`));
        }
      }

      /* ---------------------------------------------------- result */
      function finish() {
        phase = 'done';
        UI.lock(controls, false);
        setActions();
        say(M().n === 1 ? L('The rune is drawn.', '符文已抽出。') : L('The runes are drawn.', '符文已全部抽出。'));
        Sfx.reveal();
        const panel = h(`<div class="result panel rn-res"><h3>${esc(M().label)}</h3><div class="rn-cards">${drawn.map((d, k) => runeCard(d, M().pos[k], k)).join('')}</div></div>`);
        panel.appendChild(UI.resultActions(summary, () => { reset(); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
        resultBox.innerHTML = '';
        resultBox.appendChild(panel);
        App.record('runes', `${M().label}: ${drawn.map((d) => d.rune.name + (d.merk ? L(' (merkstave)', '（逆）') : '')).join(L(', ', '、'))}`,
          drawn.map((d) => `${d.rune.glyph} ${d.rune.name} — ${runeMeaning(d)}`).join(' · '));
        ctx.later(() => panel.scrollIntoView({ behavior: App.reduced ? 'auto' : 'smooth', block: 'nearest' }), 300);
      }
      function summary() {
        return `${L('Runes', '卢恩符文')} — ${M().label}\n` + drawn.map((d, k) => `${M().pos[k]}: ${d.rune.glyph} ${d.rune.name} (${gloss(d.rune)})${d.merk ? L(' — merkstave', '（逆位）') : ''} — ${runeMeaning(d)}`).join('\n');
      }

      reset();
    },
  });
})();
