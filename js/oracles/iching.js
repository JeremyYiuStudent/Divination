/* I Ching — three-coin method and the yarrow-stalk method. */
(function () {
  'use strict';
  const { App, RNG, Sfx, UI, h, $, L, tr } = window.Div;
  const D = window.DATA;
  const ME = window.MEANINGS;

  const KIND = {
    6: { yang: false, ch: true, name: { en: 'Old Yin', zh: '老阴' }, mark: '×' },
    7: { yang: true, ch: false, name: { en: 'Young Yang', zh: '少阳' }, mark: '' },
    8: { yang: false, ch: false, name: { en: 'Young Yin', zh: '少阴' }, mark: '' },
    9: { yang: true, ch: true, name: { en: 'Old Yang', zh: '老阳' }, mark: '○' },
  };
  const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
  const ORD_ZH = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
  const kname = (v) => tr(KIND[v].name);

  function hexOf(bits) {
    const lo = D.trigrams[bits.slice(0, 3).join('')];
    const up = D.trigrams[bits.slice(3, 6).join('')];
    const n = D.kingWen[lo.i][up.i];
    const [zhT, py, en] = D.hexagrams[n - 1];
    const zhS = D.hexZhS[n - 1];
    // Full Chinese name: upper image + lower image + name, or 'X为Y' for a doubled trigram.
    const full = lo === up ? zhS + '为' + up.imageZh : up.imageZh + lo.imageZh + zhS;
    return { n, zh: L(zhT, zhS), py, en, full, lo, up, bits, meaning: L(ME.hex[n - 1][0], ME.hex[n - 1][1]) };
  }

  function hexFigure(cls) {
    const el = h(`<div class="hexfig ${cls || ''}"></div>`);
    for (let i = 0; i < 6; i++) {
      el.appendChild(h(`<div class="hl" data-i="${i}"><span class="hl-pos">${i + 1}</span><div class="hl-bar"><i></i><i></i></div><span class="hl-mark"></span></div>`));
    }
    return el;
  }
  function setLine(fig, i, yang, mark) {
    const l = fig.children[i];
    l.classList.add('drawn');
    l.classList.toggle('yang', yang);
    l.classList.toggle('yin', !yang);
    l.classList.toggle('changing', !!mark);
    l.querySelector('.hl-mark').textContent = mark || '';
  }

  function coinEl() {
    return h(`<div class="coin-wrap">
      <div class="coin"><div class="coin-inner">
        <div class="coin-face inscribed"><span class="ct">乾</span><span class="cb">隆</span><span class="cr">通</span><span class="cl">寶</span><i class="hole"></i></div>
        <div class="coin-face plain"><span class="cm cm-l">ᠪᠣᠣ</span><span class="cm cm-r">ᠴᡳᠣᠸᠠᠨ</span><i class="hole"></i></div>
      </div></div>
      <div class="coin-shadow"></div>
      <div class="coin-val"></div>
    </div>`);
  }

  function hexCard(hx, label) {
    return `<div class="hexcard">
      <div class="eyebrow">${label}</div>
      <div class="hc-glyph">${String.fromCodePoint(0x4DC0 + hx.n - 1)}</div>
      <div class="hc-num">${L(`Hexagram ${hx.n}`, `第 ${hx.n} 卦`)}</div>
      <div class="hc-zh">${hx.zh}</div>
      <div class="hc-py">${L(hx.py, hx.full + ' · ' + hx.py)}</div>
      ${L(`<div class="hc-en">${hx.en}</div>`, '')}
      <div class="hc-tri">
        <div><span class="tsym">${hx.up.sym}</span> ${L(`${hx.up.py} ${hx.up.zh} · ${hx.up.image}<small>above</small>`, `${hx.up.zhS} · ${hx.up.imageZh}<small>上卦</small>`)}</div>
        <div><span class="tsym">${hx.lo.sym}</span> ${L(`${hx.lo.py} ${hx.lo.zh} · ${hx.lo.image}<small>below</small>`, `${hx.lo.zhS} · ${hx.lo.imageZh}<small>下卦</small>`)}</div>
      </div>
      <p class="meaning"><span class="meaning-label">${L('General meaning', '通释')}</span>${hx.meaning}</p>
    </div>`;
  }

  function stickRow(n) {
    let s = '';
    for (let i = 0; i < n; i++) {
      s += `<i style="--h:${(86 + Math.random() * 14).toFixed(1)}%;--r:${((Math.random() - 0.5) * 4).toFixed(2)}deg"></i>`;
    }
    return s;
  }

  App.register({
    id: 'iching',
    name: { en: 'I Ching', zh: '易经' },
    native: { en: '易經', zh: '周易 · I Ching' },
    hue: 42,
    subtitle: { en: 'The Book of Changes. Build a hexagram line by line, from the bottom up.', zh: '变化之书。自下而上，一爻一爻成卦。' },
    blurb: { en: 'Toss three coins or divide the forty-nine yarrow stalks six times to build a hexagram.', zh: '掷三枚铜钱，或分四十九根蓍草，六次成卦。' },
    art: `<div class="art-hex">${[1, 0, 1, 0, 1, 0].map((b, i) => `<i class="${b ? 'yang' : 'yin'}" style="--d:${i}"><b></b><b></b></i>`).join('')}</div>`,

    mount(root, ctx) {
      let method = App.store.get('iching.method', 'coins');
      let lines = [];
      let busy = false;
      let pace = 1; // yarrow ritual speed; quicker when casting the remaining lines at once
      const coinAngles = [0, 0, 0];

      root.innerHTML = `
        <div class="controls ic-controls"></div>
        <div class="status ic-status"></div>
        <div class="ic-stage">
          <div class="ic-ritual panel">
            <div class="ic-coins"></div>
            <div class="ic-yarrow" hidden>
              <div class="yr-field">
                <div class="yr-pile yr-left"></div>
                <div class="yr-pile yr-right"></div>
              </div>
              <div class="yr-meta"><span>${L('Taiji stalk set apart · 1', '太极一策 · 置而不用')}</span><span>${L('Set aside', '已去')} <b class="yr-aside">0</b></span><span>${L('Remaining', '余策')} <b class="yr-left-n">49</b></span></div>
            </div>
            <div class="ic-tally"></div>
          </div>
          <div class="ic-figures">
            <div class="ic-col ic-primary-col">
              <div class="eyebrow">${L('Primary', '本卦')}</div>
              <div class="ic-fig-slot"></div>
              <div class="ic-plate"></div>
            </div>
            <div class="ic-arrow" hidden>→</div>
            <div class="ic-col ic-relating-col" hidden>
              <div class="eyebrow">${L('Relating', '之卦')}</div>
              <div class="ic-fig-slot"></div>
              <div class="ic-plate"></div>
            </div>
          </div>
        </div>
        <div class="actions ic-actions"></div>
        <div class="result-wrap ic-result"></div>`;

      const controls = $('.ic-controls', root);
      const status = $('.ic-status', root);
      const coinsBox = $('.ic-coins', root);
      const yarrow = $('.ic-yarrow', root);
      const pileL = $('.yr-left', root), pileR = $('.yr-right', root);
      const asideN = $('.yr-aside', root), leftN = $('.yr-left-n', root);
      const tally = $('.ic-tally', root);
      const actions = $('.ic-actions', root);
      const resultBox = $('.ic-result', root);
      const primCol = $('.ic-primary-col', root), relCol = $('.ic-relating-col', root);
      const arrow = $('.ic-arrow', root);
      const primFig = hexFigure('primary');
      const relFig = hexFigure('relating');
      $('.ic-fig-slot', primCol).appendChild(primFig);
      $('.ic-fig-slot', relCol).appendChild(relFig);

      const coins = [coinEl(), coinEl(), coinEl()];
      coins.forEach((c) => coinsBox.appendChild(c));

      const seg = UI.seg([
        { value: 'coins', label: L('Three Coins', '三枚铜钱') },
        { value: 'yarrow', label: L('Yarrow Stalks', '蓍草揲蓍') },
      ], method, (v) => { method = v; App.store.set('iching.method', v); if (lines.length === 6) reset(); else applyMethod(); });
      controls.appendChild(seg);

      const castBtn = UI.btn('', () => castOne(), { primary: true });
      const allBtn = h(`<button type="button" class="linkbtn">${L('cast the remaining lines in one motion', '一气呵成，起完余下各爻')}</button>`);
      allBtn.addEventListener('click', () => castAll());
      actions.append(castBtn, allBtn);

      function say(text) {
        status.textContent = text;
        status.classList.remove('swap'); void status.offsetWidth; status.classList.add('swap');
      }

      function applyMethod() {
        coinsBox.hidden = method !== 'coins';
        yarrow.hidden = method !== 'yarrow';
        tally.textContent = '';
        if (method === 'yarrow') { pileL.innerHTML = stickRow(24); pileR.innerHTML = stickRow(25); asideN.textContent = '0'; leftN.textContent = '49'; }
        updateUI();
      }

      function updateUI() {
        const n = lines.length + 1;
        castBtn.innerHTML = method === 'coins'
          ? L(`Toss the coins <small>· line ${n} of 6</small>`, `掷钱 <small>· 第 ${n} / 6 爻</small>`)
          : L(`Divide the stalks <small>· line ${n} of 6</small>`, `分蓍 <small>· 第 ${n} / 6 爻</small>`);
        castBtn.disabled = busy;
        allBtn.hidden = busy || lines.length === 0 || lines.length >= 6;
        UI.lock(controls, lines.length > 0);
        if (!busy && lines.length === 0) {
          say(method === 'coins'
            ? L('Hold the three coins. When you are ready, toss them six times.', '手持三枚铜钱，静心之后，掷六次。')
            : L('Fifty stalks; one is set apart. Divide the remaining forty-nine.', '大衍之数五十，其用四十有九。分而为二。'));
        }
      }

      /* ---------------------------------------------------- coins */
      async function tossCoins() {
        const plain = [RNG.coin(), RNG.coin(), RNG.coin()]; // plain side = yang = 3
        const vals = plain.map((p) => (p ? 3 : 2));
        tally.classList.remove('show');
        Sfx.whoosh(0.45);
        await Promise.all(coins.map((c, i) => {
          const coin = $('.coin', c), inner = $('.coin-inner', c), sh = $('.coin-shadow', c);
          $('.coin-val', c).classList.remove('show');
          const start = coinAngles[i] % 360;
          const end = (5 + Math.floor(Math.random() * 3)) * 360 + (plain[i] ? 180 : 0);
          coinAngles[i] = end;
          const dur = 1150 + i * 150 + Math.random() * 150;
          const up = 150 + Math.random() * 70;
          const dx = (Math.random() - 0.5) * 30;
          const tilt = (Math.random() - 0.5) * 40;
          ctx.later(() => Sfx.coin(), dur * 0.84);
          ctx.later(() => Sfx.coin(), dur * 0.93);
          return Promise.all([
            ctx.anim(coin, [
              { transform: 'translate(0,0) scale(1)', easing: 'cubic-bezier(.2,.6,.4,1)' },
              { transform: `translate(${dx * 0.5}px,-${up}px) scale(1.2)`, offset: 0.42, easing: 'cubic-bezier(.6,0,.85,.5)' },
              { transform: `translate(${dx}px,0) scale(1)`, offset: 0.84, easing: 'ease-out' },
              { transform: `translate(${dx}px,-10px) scale(1.02)`, offset: 0.92, easing: 'ease-in' },
              { transform: `translate(${dx}px,0) scale(1)` },
            ], { duration: dur, easing: 'linear' }),
            ctx.anim(inner, [
              { transform: `rotateX(${start}deg) rotateZ(0deg)` },
              { transform: `rotateX(${end}deg) rotateZ(${tilt}deg)` },
            ], { duration: dur * 0.84, easing: 'cubic-bezier(.25,.6,.35,1)' }),
            ctx.anim(sh, [
              { transform: 'scale(1)', opacity: 0.55 },
              { transform: 'scale(.4)', opacity: 0.15, offset: 0.42 },
              { transform: 'scale(1)', opacity: 0.55, offset: 0.84 },
              { transform: 'scale(1)', opacity: 0.55 },
            ], { duration: dur, easing: 'linear' }),
          ]);
        }));
        coins.forEach((c, i) => {
          const v = $('.coin-val', c);
          v.textContent = vals[i] === 3 ? L('3 · yang side', '3 · 阳面') : L('2 · yin side', '2 · 阴面');
          v.classList.add('show');
        });
        const sum = vals[0] + vals[1] + vals[2];
        tally.innerHTML = `<span>${vals.join(' + ')} = <b>${sum}</b></span><span class="tk">${kname(sum)}</span>`;
        tally.classList.add('show');
        return sum;
      }

      /* --------------------------------------------------- yarrow */
      async function yarrowLine() {
        let n = 49, aside = 0;
        asideN.textContent = '0'; leftN.textContent = '49';
        tally.classList.remove('show');
        for (let c = 0; c < 3; c++) {
          // Uniform split whose width is a multiple of four, so the remainders are exactly fair.
          const span = Math.floor((n - 8) / 4) * 4;
          const left = 4 + RNG.int(span);
          const right = n - left;
          pileL.innerHTML = stickRow(left);
          pileR.innerHTML = stickRow(right);
          say(L(`Change ${c + 1} of 3 — the ${n} stalks are divided in two.`, `第 ${c + 1} 变（共三变）—— ${n} 策分而为二。`));
          tally.classList.remove('show');
          Sfx.whoosh(0.35);
          await Promise.all([
            ctx.anim(pileL, [{ transform: 'translateX(28%)', opacity: 0.4 }, { transform: 'none', opacity: 1 }], 600 * pace),
            ctx.anim(pileR, [{ transform: 'translateX(-28%)', opacity: 0.4 }, { transform: 'none', opacity: 1 }], 600 * pace),
          ]);
          tally.innerHTML = `<span>${L('Left', '左')} <b>${left}</b></span><span>${L('Right', '右')} <b>${right}</b></span>`;
          tally.classList.add('show');
          await ctx.wait(350 * pace);

          const rs = Array.from(pileR.children);
          const taken = rs[rs.length - 1];
          taken.classList.add('taken');
          Sfx.tick();
          await ctx.wait(400 * pace);

          const r1 = left % 4 || 4;
          const r2 = (right - 1) % 4 || 4;
          Array.from(pileL.children).forEach((s, i) => s.classList.toggle('alt', Math.floor(i / 4) % 2 === 1));
          rs.slice(0, right - 1).forEach((s, i) => s.classList.toggle('alt', Math.floor(i / 4) % 2 === 1));
          say(L('Each pile is counted off by fours.', '揲之以四，以象四时。'));
          await ctx.wait(650 * pace);

          const remL = Array.from(pileL.children).slice(left - r1);
          const remR = rs.slice(right - 1 - r2, right - 1);
          remL.concat(remR).forEach((s) => s.classList.add('rem'));
          tally.innerHTML = `<span>${L('Remainders', '余数')} <b>${r1}</b> + <b>${r2}</b> + <b>1</b></span>`;
          Sfx.chime(520 + c * 90);
          await ctx.wait(650 * pace);

          remL.concat(remR, [taken]).forEach((s) => s.classList.add('gone'));
          const removed = 1 + r1 + r2;
          aside += removed; n -= removed;
          asideN.textContent = aside; leftN.textContent = n;
          await ctx.wait(450 * pace);
        }
        const v = n / 4;
        pileL.innerHTML = stickRow(Math.ceil(n / 2));
        pileR.innerHTML = stickRow(Math.floor(n / 2));
        tally.innerHTML = `<span>${L(`${n} stalks remain`, `余 ${n} 策`)} · ${n} ÷ 4 = <b>${v}</b></span><span class="tk">${kname(v)}</span>`;
        tally.classList.add('show');
        return v;
      }

      /* ---------------------------------------------------- flow */
      async function castOne() {
        if (busy || lines.length >= 6) return;
        busy = true;
        updateUI();
        const idx = lines.length;
        if (idx === 0 && innerWidth <= 700) {
          // On phones, frame the coins and the hexagram together before the first toss.
          const top = $('.ic-stage', root).getBoundingClientRect().top + scrollY - 56;
          window.scrollTo({ top, behavior: App.reduced ? 'auto' : 'smooth' });
        }
        if (method === 'coins') say(L(`The ${ORD[idx]} line.`, `${ORD_ZH[idx]}。`));
        const v = method === 'coins' ? await tossCoins() : await yarrowLine();
        lines.push(v);
        const k = KIND[v];
        setLine(primFig, idx, k.yang, k.mark);
        Sfx.bell(k.yang ? 392 : 330, 0.05);
        say(L(`The ${ORD[idx]} line is ${k.name.en.toLowerCase()}${k.ch ? ', a changing line' : ''}.`, `${ORD_ZH[idx]}为${k.name.zh}${k.ch ? '，是变爻' : ''}。`));
        await ctx.wait(650);
        busy = false;
        if (lines.length === 6) finish();
        else updateUI();
      }

      async function castAll() {
        pace = 0.45;
        while (lines.length < 6 && ctx.alive) {
          await castOne();
          await ctx.wait(150);
        }
      }

      async function finish() {

        castBtn.hidden = true; allBtn.hidden = true;
        const bits = lines.map((v) => (KIND[v].yang ? 1 : 0));
        const prim = hexOf(bits);
        const chg = lines.map((v, i) => (KIND[v].ch ? i : -1)).filter((i) => i >= 0);
        say(L('The hexagram is complete.', '六爻已成，卦象已定。'));
        await ctx.wait(300);
        primFig.classList.add('complete');
        $('.ic-plate', primCol).innerHTML = plate(prim);
        $('.ic-plate', primCol).classList.add('show');
        Sfx.reveal();
        App.sparkle(primFig, 24);

        let rel = null;
        if (chg.length) {
          rel = hexOf(bits.map((b, i) => (chg.includes(i) ? 1 - b : b)));
          await ctx.wait(1100);
          say(L(chg.length === 1 ? 'One line is changing…' : `${chg.length} lines are changing…`, `有 ${chg.length} 个变爻……`));
          arrow.hidden = false; relCol.hidden = false;
          for (let i = 0; i < 6; i++) {
            setLine(relFig, i, KIND[lines[i]].yang, '');
            await ctx.wait(70);
          }
          await ctx.wait(700);
          for (const i of chg) {
            setLine(relFig, i, !KIND[lines[i]].yang, '');
            relFig.children[i].classList.add('flash');
            primFig.children[i].classList.add('flash');
            Sfx.chime(440 + i * 60);
            await ctx.wait(420);
          }
          relFig.classList.add('complete');
          $('.ic-plate', relCol).innerHTML = plate(rel);
          $('.ic-plate', relCol).classList.add('show');
          await ctx.wait(500);
          say(L(`Hexagram ${prim.n} changing to hexagram ${rel.n}.`, `${prim.full}之${rel.full}（第 ${prim.n} 卦变第 ${rel.n} 卦）。`));
        } else {
          say(L(`Hexagram ${prim.n}, with no changing lines.`, `${prim.full}（第 ${prim.n} 卦），无变爻。`));
        }
        UI.lock(controls, false);
        showResult(prim, rel, chg);
      }

      function plate(hx) {
        return L(`<b>${hx.n}</b> ${hx.zh} <span>${hx.py}</span><em>${hx.en}</em>`, `<b>${hx.n}</b> ${hx.zh} <span>${hx.py}</span><em>${hx.full}</em>`);
      }

      function summaryText(prim, rel, chg) {
        const name = (hx) => L(`Hexagram ${hx.n} ${hx.zh} ${hx.py} (${hx.en})`, `第 ${hx.n} 卦 ${hx.full}`);
        let s = L('I Ching — ', '易经 — ') + name(prim) + '\n' + prim.meaning;
        if (rel) s += L(`\nChanging lines ${chg.map((i) => i + 1).join(', ')} → `, `\n变爻：${chg.map((i) => ORD_ZH[i]).join('、')} → `) + name(rel) + '\n' + rel.meaning;
        s += L('\nLines (bottom to top): ', '\n六爻（自下而上）：') + lines.join(' ');
        return s;
      }

      function showResult(prim, rel, chg) {
        const lineRows = lines.map((v, i) => `<li class="${KIND[v].ch ? 'ch' : ''}"><span class="ln">${L(`Line ${i + 1}`, ORD_ZH[i])}</span><span class="lv">${v}</span><span class="lk">${kname(v)}${KIND[v].ch ? L(' · changing', ' · 变爻') : ''}</span></li>`).join('');
        const guide = rel
          ? L('The primary hexagram describes the situation as it stands; the relating hexagram shows where it is tending. Traditionally the changing lines carry particular weight.',
            '本卦描述当前的处境，之卦显示事态发展的趋向。传统上，变爻的爻辞尤为关键。')
          : L('With no changing lines, the primary hexagram speaks as a whole.', '无变爻，以本卦卦辞整体论断。');
        const panel = h(`<div class="result panel ic-res">
          <h3>${L('The Reading', '卦象')}</h3>
          <div class="ic-cards">${hexCard(prim, L('Primary', '本卦'))}${rel ? `<div class="ic-cards-arrow"><span>→</span><small>${L(`line${chg.length > 1 ? 's' : ''} ${chg.map((i) => i + 1).join(', ')}`, chg.map((i) => ORD_ZH[i]).join('、'))}</small></div>${hexCard(rel, L('Relating', '之卦'))}` : ''}</div>
          <p class="guide">${guide}</p>
          <ol class="ic-linelist">${lineRows}</ol>
          <p class="hint">${L('Lines are numbered from the bottom.', '爻位自下而上计数。')} ${rel ? L('Changing lines are marked ○ (old yang) and × (old yin).', '变爻以 ○（老阳）与 ×（老阴）标示。') : ''}</p>
        </div>`);
        panel.appendChild(UI.resultActions(() => summaryText(prim, rel, chg), reset));
        resultBox.innerHTML = '';
        resultBox.appendChild(panel);
        App.record('iching',
          L(`Hexagram ${prim.n} ${prim.py} — ${prim.en}${rel ? ` → ${rel.n} ${rel.py}` : ''}`, `${prim.full}${rel ? '之' + rel.full : ''}`),
          prim.meaning + (rel ? L(` · Changing lines ${chg.map((i) => i + 1).join(', ')}`, ` · 变爻：${chg.map((i) => ORD_ZH[i]).join('、')}`) : ''));
        ctx.later(() => panel.scrollIntoView({ behavior: App.reduced ? 'auto' : 'smooth', block: 'start' }), 200);
      }

      function reset() {
        lines = []; busy = false; pace = 1;
        [primFig, relFig].forEach((f) => {
          f.classList.remove('complete');
          Array.from(f.children).forEach((l) => { l.className = 'hl'; l.querySelector('.hl-mark').textContent = ''; });
        });
        $$plates().forEach((p) => { p.classList.remove('show'); p.innerHTML = ''; });
        relCol.hidden = true; arrow.hidden = true;
        resultBox.innerHTML = '';
        castBtn.hidden = false;
        coins.forEach((c) => $('.coin-val', c).classList.remove('show'));
        applyMethod();
        window.scrollTo({ top: 0, behavior: App.reduced ? 'auto' : 'smooth' });
      }
      function $$plates() { return [$('.ic-plate', primCol), $('.ic-plate', relCol)]; }

      applyMethod();
    },
  });
})();
