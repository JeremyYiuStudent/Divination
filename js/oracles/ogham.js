/* Ogham — staves drawn blind from a bound bundle. */
(function () {
  'use strict';
  const { App, RNG, Sfx, UI, h, $, $$, esc, L, tr } = window.Div;
  const D = window.DATA;
  const ME = window.MEANINGS;

  const METHODS = {
    one: { label: { en: 'A Single Few', zh: '单支' }, n: 1, pos: [{ en: 'The Few', zh: '此字' }] },
    three: { label: { en: 'Three Feda', zh: '三支' }, n: 3, pos: [{ en: 'Past', zh: '过去' }, { en: 'Present', zh: '现在' }, { en: 'Future', zh: '未来' }] },
  };
  const tree = (f) => L(f.tree, f.treeZh);
  const fMeaning = (f) => L(ME.ogham[f.i][0], ME.ogham[f.i][1]);
  const rr = (a, b) => a + Math.random() * (b - a);

  function staveEl(f) {
    return h(`<div class="stave" style="--grain:${rr(0, 100).toFixed(0)}%;--tint:${rr(-6, 6).toFixed(1)}%">
      <div class="sv-inner">
        <div class="sv-face sv-plain"></div>
        <div class="sv-face sv-carved"><span class="sv-glyph">᚛${f ? f.glyph : ''}᚜</span></div>
      </div>
    </div>`);
  }

  App.register({
    id: 'ogham',
    name: { en: 'Ogham', zh: '欧甘树文' },
    native: '᚛ᚑᚌᚐᚋ᚜',
    hue: 130,
    subtitle: { en: 'The tree-letters of early Ireland, cut on staves of wood and drawn blind from the bundle.', zh: '古爱尔兰的树木字母，刻于木条之上，自一束中盲抽。' },
    blurb: { en: 'Shake the bound bundle of staves and draw one or three of the feda, the tree-letters.', zh: '摇动捆扎的木条，抽出一支或三支树木字母。' },
    art: `<div class="art-ogham">${['ᚁ', 'ᚇ', 'ᚔ'].map((g, i) => `<span style="--r:${(i - 1) * 9}deg"><b>᚛${g}᚜</b></span>`).join('')}</div>`,

    mount(root, ctx) {
      let methodId = App.store.get('ogham.method', 'three');
      let forfeda = App.store.get('ogham.forfeda', false);
      let pool = [];
      let drawn = [];
      let busy = false;

      root.innerHTML = `
        <div class="controls og-controls"></div>
        <div class="status og-status"></div>
        <div class="og-table"></div>
        <div class="actions og-actions"></div>
        <div class="result-wrap og-result"></div>`;
      const controls = $('.og-controls', root);
      const status = $('.og-status', root);
      const table = $('.og-table', root);
      const actions = $('.og-actions', root);
      const resultBox = $('.og-result', root);

      controls.append(
        UI.seg(Object.entries(METHODS).map(([k, m]) => ({ value: k, label: tr(m.label) })), methodId, (v) => {
          methodId = v; App.store.set('ogham.method', v); reset();
        }),
        UI.toggle(L('Include the forfeda', '加入附加字母'), forfeda, (v) => { forfeda = v; App.store.set('ogham.forfeda', v); reset(); })
      );

      const M = () => { const m = METHODS[methodId]; return { n: m.n, label: tr(m.label), pos: m.pos.map(tr) }; };
      function say(text) {
        status.innerHTML = text;
        status.classList.remove('swap'); void status.offsetWidth; status.classList.add('swap');
      }
      function setActions(...els) { actions.innerHTML = ''; els.forEach((e) => e && actions.appendChild(e)); }

      function reset() {
        pool = RNG.shuffle(D.ogham.filter((f) => forfeda || !f.forfeda));
        drawn = []; busy = false;
        resultBox.innerHTML = '';
        UI.lock(controls, false);
        const n = pool.length;
        table.innerHTML = `<div class="og-stage">
          <div class="og-bundle" role="button" tabindex="0" aria-label="${L('Draw a stave from the bundle', '从木束中抽出一支')}"><div class="og-cord"></div></div>
          <div class="og-slots">${M().pos.map((p) => `<div class="og-slot"><div class="og-well"></div><div class="og-label">${esc(p)}</div></div>`).join('')}</div>
        </div>`;
        const bundle = $('.og-bundle', table);
        for (let i = 0; i < n; i++) {
          const st = staveEl(null);
          const a = -17 + (34 * i) / (n - 1) + rr(-1.5, 1.5);
          st.style.setProperty('--a', a.toFixed(2) + 'deg');
          st.style.setProperty('--lift', rr(-16, 0).toFixed(1) + 'px');
          st.style.zIndex = Math.round(rr(0, n));
          bundle.insertBefore(st, $('.og-cord', bundle));
        }
        bundle.addEventListener('click', draw);
        bundle.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); draw(); } });
        say(L(`${n} staves are bound together. Draw ${M().n === 1 ? 'one' : 'three, one at a time'}.`, `${n} 支木条捆在一起。${M().n === 1 ? '抽出一支。' : '逐一抽出三支。'}`));
        setActions(UI.btn(L('Draw a stave', '抽一支'), draw, { primary: true }));
      }

      async function draw() {
        if (busy || drawn.length >= M().n) return;
        busy = true;
        UI.lock(controls, true);
        $$('button', actions).forEach((b) => { b.disabled = true; });
        const bundle = $('.og-bundle', table);
        Sfx.rattle(4); ctx.later(() => Sfx.clack(), 220);
        await ctx.anim(bundle, [
          { transform: 'rotate(0deg)' }, { transform: 'rotate(-4deg) translateY(-4px)' }, { transform: 'rotate(4deg)' },
          { transform: 'rotate(-2deg) translateY(-2px)' }, { transform: 'rotate(0deg)' },
        ], { duration: 620, easing: 'ease-in-out' });

        const f = pool.pop();
        const k = drawn.length;
        drawn.push(f);

        // Any physical stave will do; which letter it carries was settled by the shuffle.
        const candidates = $$('.stave:not(.drawn)', bundle);
        const st = candidates[Math.floor(Math.random() * candidates.length)];
        st.classList.add('drawn');
        $('.sv-glyph', st).textContent = `᚛${f.glyph}᚜`;
        const a = st.style.getPropertyValue('--a');
        const lift = st.style.getPropertyValue('--lift');
        st.style.zIndex = 100;
        Sfx.whoosh(0.4);
        await ctx.anim(st, [
          { transform: `rotate(${a}) translateY(${lift})` },
          { transform: `rotate(${a}) translateY(-170px)` },
        ], { duration: 700, easing: 'cubic-bezier(.4,0,.2,1)' });

        const r1 = st.getBoundingClientRect();
        const well = $$('.og-well', table)[k];
        st.style.transform = '';
        well.appendChild(st);
        const r2 = st.getBoundingClientRect();
        const dx = r1.left + r1.width / 2 - (r2.left + r2.width / 2);
        const dy = r1.top + r1.height / 2 - (r2.top + r2.height / 2);
        await ctx.anim(st, [
          { transform: `translate(${dx}px, ${dy}px) rotate(${a})` },
          { transform: 'none' },
        ], { duration: 800, easing: 'cubic-bezier(.25,.8,.25,1)' });
        Sfx.clack();
        await ctx.wait(200);
        st.classList.add('revealed');
        Sfx.flip();
        ctx.later(() => { Sfx.chime(392 + k * 98); App.sparkle(st, 14); }, 400);
        await ctx.wait(1000);
        busy = false;
        if (drawn.length === M().n) { finish(); return; }
        say(L(`${f.name}, ${f.tree}. Draw ${M().n - drawn.length} more.`, `${f.name}（${f.treeZh}）。再抽 ${M().n - drawn.length} 支。`));
        setActions(UI.btn(L('Draw a stave', '抽一支'), draw, { primary: true }));
      }

      function finish() {
        UI.lock(controls, false);
        setActions();
        say(M().n === 1 ? L('The stave is drawn.', '木条已抽出。') : L('The staves are drawn.', '木条已全部抽出。'));
        Sfx.reveal();
        const cards = drawn.map((f, k) => `<div class="og-card" style="--d:${k}">
          <div class="eyebrow">${esc(M().pos[k])}</div>
          <div class="og-cglyph"><span>᚛${f.glyph}᚜</span></div>
          <div class="og-name">${f.name}</div>
          <div class="og-meta">${f.letter} · ${tree(f)}</div>
          <div class="og-aicme">${L(f.aicme, f.aicmeZh)}</div>
          <p class="meaning"><span class="meaning-label">${L('General meaning', '通释')}</span>${esc(fMeaning(f))}</p>
        </div>`).join('');
        const panel = h(`<div class="result panel og-res"><h3>${esc(M().label)}</h3><div class="og-cards">${cards}</div></div>`);
        panel.appendChild(UI.resultActions(summary, () => { reset(); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
        resultBox.innerHTML = '';
        resultBox.appendChild(panel);
        App.record('ogham', `${M().label}: ${drawn.map((f) => f.name).join(L(', ', '、'))}`, drawn.map((f) => `${f.name} (${tree(f)}) — ${fMeaning(f)}`).join(' · '));
        ctx.later(() => panel.scrollIntoView({ behavior: App.reduced ? 'auto' : 'smooth', block: 'nearest' }), 300);
      }
      function summary() {
        return `${L('Ogham', '欧甘树文')} — ${M().label}\n` + drawn.map((f, k) => `${M().pos[k]}: ${f.glyph} ${f.name} (${f.letter}, ${tree(f)}) — ${fMeaning(f)}`).join('\n');
      }

      reset();
    },
  });
})();
