/* Geomancy — sixteen lines of marks in the sand, reduced to the four
   Mothers, from which the whole shield chart is derived. */
(function () {
  'use strict';
  const { App, RNG, Sfx, UI, h, $, esc, L } = window.Div;
  const D = window.DATA;
  const ME = window.MEANINGS;

  const ROWS = [{ en: 'Head', zh: '头' }, { en: 'Neck', zh: '颈' }, { en: 'Body', zh: '身' }, { en: 'Feet', zh: '足' }];
  const NUM = ['I', 'II', 'III', 'IV'];
  const NUM_ZH = ['一', '二', '三', '四'];
  const row = (r) => L(ROWS[r].en, ROWS[r].zh);
  // Position titles in the shield chart.
  const T = {
    mother: (i) => L(`Mother ${NUM[i]}`, `母${NUM_ZH[i]}`),
    daughter: (i) => L(`Daughter ${NUM[i]}`, `女${NUM_ZH[i]}`),
    niece: (i) => L(`Niece ${NUM[i]}`, `侄${NUM_ZH[i]}`),
    rw: () => L('Right Witness', '右证人'),
    lw: () => L('Left Witness', '左证人'),
    judge: () => L('Judge', '判官'),
    recon: () => L('Reconciler', '调和者'),
  };
  const fname = (f) => L(f.name, `${f.name} · ${f.zh}`);
  const fgloss = (f) => L(`${f.eng} · ${f.planet}`, `${f.zh} · ${f.planetZh}`);
  const fmean = (rows) => { const m = ME.geo[rows.join('')]; return L(m[0], m[1]); };
  const fig = (rows) => D.geomancy[rows.join('')];
  // Figures are added row by row: an odd sum gives one point, an even sum two.
  const add = (a, b) => a.map((x, i) => ((x + b[i]) % 2 ? 1 : 2));

  function figHTML(rows, title, extra) {
    const f = fig(rows);
    return `<div class="gm-fig ${extra || ''}">
      <div class="gm-ftitle">${title}</div>
      <div class="gm-dots">${rows.map((r) => `<div class="gm-drow">${r === 1 ? '<i></i>' : '<i></i><i></i>'}</div>`).join('')}</div>
      <div class="gm-fname">${f.name}</div>
    </div>`;
  }

  App.register({
    id: 'geomancy',
    name: { en: 'Geomancy', zh: '地占术' },
    native: 'Ars Geomantiae',
    hue: 28,
    subtitle: { en: 'Sixteen lines struck in the sand, counted off in pairs, unfolded into the shield chart.', zh: '在沙上点出十六行，两两划去，展开为完整的盾形图。' },
    blurb: { en: 'Strike sixteen lines of points in the sand and watch the Mothers unfold into the full shield chart.', zh: '在沙盘上点出十六行，看四母图形展开成完整的盾形图。' },
    art: `<div class="art-geo">${[[2, 2, 1, 1], [1, 2, 1, 2], [2, 1, 1, 1]].map((f) => `<div class="ag-fig">${f.map((r) => `<div>${r === 1 ? '<i></i>' : '<i></i><i></i>'}</div>`).join('')}</div>`).join('')}</div>`,

    mount(root, ctx) {
      let mode = App.store.get('geo.mode', 'stylus');
      let counts = [];
      let busy = false;
      let phase = 'ready';
      let handRow = 0;

      root.innerHTML = `
        <div class="controls gm-controls"></div>
        <div class="status gm-status"></div>
        <div class="gm-stage stagebox">
          <div class="gm-tray panel"></div>
          <div class="gm-shield-wrap"></div>
        </div>
        <div class="actions gm-actions"></div>
        <div class="result-wrap gm-result"></div>`;
      const controls = $('.gm-controls', root);
      const status = $('.gm-status', root);
      const gstage = $('.gm-stage', root);
      const tray = $('.gm-tray', root);
      const actions = $('.gm-actions', root);
      const shieldWrap = $('.gm-shield-wrap', root);
      const resultBox = $('.gm-result', root);
      ctx.fit(gstage, [340, 515], 1.2); // sized for the shield chart; the tray stretches on its own

      controls.append(UI.seg([
        { value: 'stylus', label: L('Let the stylus fall', '由笔自落') },
        { value: 'hand', label: L('Mark by hand', '亲手点沙') },
      ], mode, (v) => { mode = v; App.store.set('geo.mode', v); reset(); }));

      function say(text) {
        status.innerHTML = `<span>${text}</span>`;
        status.classList.remove('swap'); void status.offsetWidth; status.classList.add('swap');
      }
      function setActions(...els) { actions.innerHTML = ''; els.forEach((e) => e && actions.appendChild(e)); }

      function trayHTML() {
        let s = '';
        for (let m = 0; m < 4; m++) {
          s += `<div class="gm-group"><div class="gm-glabel">${T.mother(m)}</div>`;
          for (let r = 0; r < 4; r++) {
            s += `<div class="gm-line" data-l="${m * 4 + r}"><span class="gm-rlabel">${row(r)}</span><div class="gm-marks"></div><div class="gm-out"></div></div>`;
          }
          s += '</div>';
        }
        return s;
      }
      const lineEl = (i) => $(`.gm-line[data-l="${i}"]`, tray);
      // On phones the tray is taller than the screen; keep the line being marked in view.
      function keepVisible(el) {
        if (App.phone()) return; // the whole tray is on screen
        const r = el.getBoundingClientRect();
        const bottom = innerHeight - (innerWidth <= 700 ? 120 : 24);
        if (r.bottom > bottom || r.top < 70) el.scrollIntoView({ block: 'center', behavior: App.reduced ? 'auto' : 'smooth' });
      }

      function addMark(i) {
        const marks = $('.gm-marks', lineEl(i));
        const b = document.createElement('b');
        b.style.setProperty('--y', (Math.random() * 8 - 4).toFixed(1) + 'px');
        b.style.setProperty('--s', (0.75 + Math.random() * 0.5).toFixed(2));
        marks.appendChild(b);
        Sfx.sand();
      }

      function reset() {
        counts = []; busy = false; phase = 'ready'; handRow = 0;
        tray.innerHTML = trayHTML();
        tray.classList.remove('done', 'hand');
        gstage.classList.remove('shield');
        shieldWrap.innerHTML = '';
        resultBox.innerHTML = '';
        UI.lock(controls, false);
        if (mode === 'stylus') {
          say(L('Clear the mind, and let the stylus strike sixteen lines of points without counting.', '清空思绪，让笔不加计数地点出十六行。'));
          setActions(UI.btn(L('Strike the sand', '点沙'), runStylus, { primary: true }));
        } else {
          tray.classList.add('hand');
          say(L('Tap the sand to make points — without counting — then move to the next line.', '轻点沙盘留下点——不要计数——再进入下一行。'));
          setActions();
          startHand();
        }
      }

      /* ------------------------------------------------ stylus mode */
      async function runStylus() {
        if (busy) return;
        busy = true; phase = 'marking';
        UI.lock(controls, true);
        setActions();
        say(L('The stylus moves across the sand…', '笔尖在沙上移动……'));
        for (let i = 0; i < 16; i++) {
          const n = RNG.range(8, 23); // eight odd and eight even possibilities
          counts.push(n);
          lineEl(i).classList.add('active');
          keepVisible(lineEl(i));
          for (let j = 0; j < n; j++) { addMark(i); await ctx.wait(26); }
          lineEl(i).classList.remove('active');
          lineEl(i).classList.add('marked');
          await ctx.wait(60);
        }
        await countOff();
      }

      /* --------------------------------------------------- hand mode */
      function startHand() {
        phase = 'marking';
        lineEl(0).classList.add('active');
        const next = UI.btn(L('Next line <small>· 1 of 16</small>', '下一行 <small>· 1 / 16</small>'), nextLine, { primary: true });
        next.disabled = true;
        setActions(next);
        tray.onclick = (e) => {
          if (phase !== 'marking' || mode !== 'hand' || busy) return;
          addMark(handRow);
          const n = $('.gm-marks', lineEl(handRow)).children.length;
          next.disabled = n === 0;
          if (n === 1) UI.lock(controls, true);
        };
        ctx.on(window, 'keydown', (e) => {
          if (phase !== 'marking' || mode !== 'hand') return;
          if (e.key === 'Enter') { e.preventDefault(); if (!next.disabled) nextLine(); }
          else if (e.key === ' ' && e.target === document.body) { e.preventDefault(); tray.onclick(e); }
        });
        function nextLine() {
          if (busy) return;
          const n = $('.gm-marks', lineEl(handRow)).children.length;
          if (!n) return;
          counts.push(n);
          lineEl(handRow).classList.remove('active');
          lineEl(handRow).classList.add('marked');
          handRow++;
          if (handRow === 16) { tray.onclick = null; setActions(); countOff(); return; }
          lineEl(handRow).classList.add('active');
          keepVisible(lineEl(handRow));
          next.innerHTML = L(`Next line <small>· ${handRow + 1} of 16</small>`, `下一行 <small>· ${handRow + 1} / 16</small>`);
          next.disabled = true;
          say(L(`Line ${handRow + 1} of 16 — ${ROWS[handRow % 4].en.toLowerCase()} of Mother ${NUM[Math.floor(handRow / 4)]}. Tap the sand, then Enter.`, `第 ${handRow + 1} / 16 行——${T.mother(Math.floor(handRow / 4))}之${ROWS[handRow % 4].zh}。轻点沙盘，然后按下一行。`));
        }
      }

      /* ---------------------------------------------------- count off */
      async function countOff() {
        busy = true; phase = 'counting';
        say(L('Now the points are struck out in pairs, two by two…', '现在将点两两划去……'));
        tray.scrollIntoView({ block: 'start', behavior: App.reduced ? 'auto' : 'smooth' });
        await ctx.wait(500);
        const rowsVals = counts.map((n) => (n % 2 ? 1 : 2));
        await Promise.all(counts.map(async (n, i) => {
          await ctx.wait(i * 90);
          const marks = Array.from($('.gm-marks', lineEl(i)).children);
          const keep = rowsVals[i];
          for (let j = n - 1; j >= keep; j -= 2) {
            marks[j].classList.add('struck');
            if (marks[j - 1]) marks[j - 1].classList.add('struck');
            await ctx.wait(45);
          }
          marks.slice(0, keep).forEach((m) => m.classList.add('keep'));
          const out = $('.gm-out', lineEl(i));
          out.innerHTML = keep === 1 ? '<i></i>' : '<i></i><i></i>';
          out.classList.add('show');
          Sfx.tick();
        }));
        await ctx.wait(400);
        tray.classList.add('done');
        Sfx.chime(587);
        const mothers = [0, 1, 2, 3].map((m) => rowsVals.slice(m * 4, m * 4 + 4));
        say(L('The four Mothers are formed.', '四母已成。'));
        await ctx.wait(700);
        await buildShield(mothers);
      }

      /* ------------------------------------------------- shield chart */
      async function buildShield(M) {
        phase = 'shield';
        const Dt = [0, 1, 2, 3].map((r) => M.map((m) => m[r])); // daughters: rows read across the mothers
        const N = [add(M[0], M[1]), add(M[2], M[3]), add(Dt[0], Dt[1]), add(Dt[2], Dt[3])];
        const RW = add(N[0], N[1]);
        const LW = add(N[2], N[3]);
        const J = add(RW, LW);
        const RC = add(J, M[0]);
        const chart = { M, Dt, N, RW, LW, J, RC };

        shieldWrap.innerHTML = `<div class="gm-shield panel">
          <div class="gm-shield-title eyebrow">${L('The Shield Chart', '盾形图')} <span>${L('· read from right to left', '· 自右向左读')}</span></div>
          <div class="gm-grid"><div class="gm-glab d phone-only">${L('Daughters', '四女')}</div><div class="gm-glab m phone-only">${L('Mothers', '四母')}</div></div>
          <div class="gm-recon"></div>
        </div>`;
        const grid = $('.gm-grid', shieldWrap);
        gstage.classList.add('shield'); // on phones the chart takes the tray's place
        if (!App.phone()) shieldWrap.scrollIntoView({ behavior: App.reduced ? 'auto' : 'smooth', block: 'start' });
        await ctx.wait(500);

        const place = async (rows, title, cls, parents, target) => {
          parents.forEach((p) => p.classList.add('src'));
          const el = h(figHTML(rows, title, cls));
          (target || grid).appendChild(el);
          Sfx.bell(330 + Math.random() * 200, 0.035);
          await ctx.wait(420);
          parents.forEach((p) => p.classList.remove('src'));
          return el;
        };

        const mEls = [];
        for (let i = 0; i < 4; i++) mEls.push(await place(M[i], T.mother(i), `m${i + 1}`, []));
        say(L('The Daughters are read across the Mothers, row by row.', '横读四母，逐行得出四女。'));
        const dEls = [];
        for (let i = 0; i < 4; i++) dEls.push(await place(Dt[i], T.daughter(i), `d${i + 1}`, mEls));
        say(L('Each pair is added to give the Nieces…', '两两相加，得出四侄……'));
        const nEls = [];
        nEls.push(await place(N[0], T.niece(0), 'n1', [mEls[0], mEls[1]]));
        nEls.push(await place(N[1], T.niece(1), 'n2', [mEls[2], mEls[3]]));
        nEls.push(await place(N[2], T.niece(2), 'n3', [dEls[0], dEls[1]]));
        nEls.push(await place(N[3], T.niece(3), 'n4', [dEls[2], dEls[3]]));
        say(L('…then the Witnesses…', '……再得两位证人……'));
        const rw = await place(RW, T.rw(), 'rw', [nEls[0], nEls[1]]);
        const lw = await place(LW, T.lw(), 'lw', [nEls[2], nEls[3]]);
        say(L('…and from the Witnesses, the Judge.', '……由两位证人得出判官。'));
        await ctx.wait(300);
        const j = await place(J, T.judge(), 'judge', [rw, lw]);
        Sfx.reveal();
        App.sparkle(j, 26);
        await ctx.wait(700);
        await place(RC, T.recon(), 'recon', [j, mEls[0]], App.phone() ? grid : $('.gm-recon', shieldWrap));
        say(L(`The Judge is <b>${fig(J).name}</b>.`, `判官为 <b>${fig(J).name}（${fig(J).zh}）</b>。`));
        busy = false; phase = 'done';
        UI.lock(controls, false);
        showResult(chart);
      }

      function showResult(c) {
        const rows = [
          ...c.M.map((r, i) => [T.mother(i), r]),
          ...c.Dt.map((r, i) => [T.daughter(i), r]),
          ...c.N.map((r, i) => [T.niece(i), r]),
          [T.rw(), c.RW], [T.lw(), c.LW], [T.judge(), c.J], [T.recon(), c.RC],
        ];
        const keyFig = (title, r, cls) => { const f = fig(r); return `<div class="gm-key ${cls}"><div class="eyebrow">${title}</div>${dotsHTML(r)}<div class="gm-kname">${fname(f)}</div><div class="gm-kgloss">${fgloss(f)}</div><p class="meaning">${esc(fmean(r))}</p></div>`; };
        const dotsHTML = (r) => `<div class="gm-kdots phone-only">${r.map((x) => `<div class="gm-drow">${x === 1 ? '<i></i>' : '<i></i><i></i>'}</div>`).join('')}</div>`;
        const item = ([pos, r], k) => {
          const f = fig(r);
          return `<li class="${r === c.J ? 'is-judge' : ''}" style="--d:${k}"><span class="gp">${pos}</span><span class="gmini">${r.map((x) => `<span>${x === 1 ? '•' : '• •'}</span>`).join('')}</span><span class="gn">${f.name}</span><span class="ge">${fgloss(f)}</span><span class="gm-lmean">${esc(fmean(r))}</span></li>`;
        };
        const guide = L('The Judge answers the question as a whole. The Right Witness speaks for the querent and the past, the Left Witness for the matter and the future; the Reconciler (Judge + First Mother) adds a final nuance.', '判官回答整体问题。右证人代表求问者与过去，左证人代表所问之事与未来；调和者（判官 + 母一）补充最后的细节。');
        // Phones page through the other figures two at a time; desktop lists all sixteen.
        const mini = ([pos, r]) => {
          const f = fig(r);
          return `<div class="gm-pc">${dotsHTML(r).replace('phone-only', '')}<div class="gm-pc-text"><div class="eyebrow">${pos}</div><div class="gm-pc-name">${fname(f)} <span>${fgloss(f)}</span></div><p class="gm-pc-mean">${esc(fmean(r))}</p></div></div>`;
        };
        const pairs = [
          [L('Mothers I–II', '母一、母二'), 0], [L('Mothers III–IV', '母三、母四'), 2],
          [L('Daughters I–II', '女一、女二'), 4], [L('Daughters III–IV', '女三、女四'), 6],
          [L('Nieces I–II', '侄一、侄二'), 8], [L('Nieces III–IV', '侄三、侄四'), 10],
        ];
        const pages = [
          { cls: 'judge', label: T.judge(), html: keyFig(T.judge(), c.J, 'judge') + `<p class="guide phone-only">${guide}</p>` },
          { cls: 'half', label: T.rw(), html: keyFig(T.rw(), c.RW, 'rw') },
          { cls: 'half', label: T.lw(), html: keyFig(T.lw(), c.LW, 'lw') },
          { cls: 'phone-only', label: T.recon(), html: keyFig(T.recon(), c.RC, 'recon') },
          ...pairs.map(([name, from]) => ({ cls: 'phone-only gm-pair', label: name, html: rows.slice(from, from + 2).map(mini).join('') })),
          { cls: 'desk-only', html: `<p class="guide">${guide}</p><h3 class="gm-sub">${L('All Figures', '全部图形')}</h3><ol class="gm-list">${rows.map(item).join('')}</ol>` },
        ];
        const panel = UI.reading({
          cls: 'gm-res', title: L('The Judgement', '判断'), pages, onAgain: reset,
          getText: () => L('Geomancy — shield chart', '地占术 — 盾形图') + '\n' + rows.map(([p, r]) => `${p}: ${fname(fig(r))} — ${fmean(r)}`).join('\n'),
        });
        resultBox.innerHTML = '';
        resultBox.appendChild(panel);
        App.record('geomancy', L(`Judge: ${fig(c.J).name} (${fig(c.J).eng})`, `判官：${fig(c.J).name}（${fig(c.J).zh}）`),
          fmean(c.J) + L(` · Witnesses ${fig(c.RW).name} & ${fig(c.LW).name}`, ` · 证人：${fig(c.RW).zh}、${fig(c.LW).zh}`));
      }

      reset();
    },
  });
})();
