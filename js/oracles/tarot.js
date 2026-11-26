/* Tarot — 78-card deck, riffle shuffle with reversals, fan & choose, spreads. */
(function () {
  'use strict';
  const { App, RNG, Sfx, UI, h, $, $$, esc, L, tr } = window.Div;
  const D = window.DATA;
  const ME = window.MEANINGS;
  const VS = '︎'; // force text (not emoji) presentation

  const SPREADS = {
    one: { name: { en: 'Single Card', zh: '单张牌' }, short: { en: 'One Card', zh: '单张' }, n: 1, layout: 'row', positions: [{ en: 'The Card', zh: '此牌' }] },
    three: {
      name: { en: 'Past · Present · Future', zh: '过去 · 现在 · 未来' }, short: { en: 'Three Cards', zh: '三张' }, n: 3, layout: 'row',
      positions: [{ en: 'Past', zh: '过去' }, { en: 'Present', zh: '现在' }, { en: 'Future', zh: '未来' }],
    },
    celtic: {
      name: { en: 'Celtic Cross', zh: '凯尔特十字' }, short: { en: 'Celtic Cross', zh: '凯尔特十字' }, n: 10, layout: 'celtic',
      positions: [
        { en: 'Present', zh: '现状' }, { en: 'Challenge', zh: '阻碍' }, { en: 'Foundation', zh: '根基' }, { en: 'Recent Past', zh: '近期过去' },
        { en: 'Crown', zh: '目标' }, { en: 'Near Future', zh: '近期未来' }, { en: 'Self', zh: '自我' }, { en: 'Environment', zh: '环境' },
        { en: 'Hopes & Fears', zh: '希望与恐惧' }, { en: 'Outcome', zh: '结果' },
      ],
    },
  };

  const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
  const COURT = { 11: ['Page', '♟'], 12: ['Knight', '♞'], 13: ['Queen', '♛'], 14: ['King', '♚'] };

  function buildDeck(majorsOnly) {
    const d = D.tarot.majors.map((m, i) => ({
      key: 'M' + i, major: true, num: i, name: m[0], zh: D.tarot.majorsZh[i][0], sym: m[1], attr: m[2], attrZh: D.tarot.majorsZh[i][1],
      heb: m[3], hebName: m[4], mean: ME.tarot.majors[i], reversed: false,
    }));
    if (!majorsOnly) {
      D.tarot.suits.forEach((s) => D.tarot.ranks.forEach((r, ri) => d.push({
        key: s.id + (ri + 1), major: false, suit: s, rank: ri + 1, rankName: r, rankZh: D.tarot.ranksZh[ri],
        name: `${r} of ${s.name}`, zh: s.zh + D.tarot.ranksZh[ri], mean: ME.tarot.minors[s.id][ri], reversed: false,
      })));
    }
    return d;
  }
  const cname = (c) => L(c.name, c.zh);
  /** The traditional meaning for the card in the orientation it was drawn. */
  function meaning(c, reversed) {
    const m = c.mean;
    return reversed ? L(m[2], m[3]) : L(m[0], m[1]);
  }

  /* ------------------------------------------------------------ artwork */
  function injectDefs() {
    if (document.getElementById('tarot-defs')) return;
    const svg = h(`<svg id="tarot-defs" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
      <linearGradient id="tg-parch" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#f8efd6"/><stop offset=".6" stop-color="#efe0b9"/><stop offset="1" stop-color="#dcc595"/></linearGradient>
      <radialGradient id="tg-sky" cx=".5" cy=".38" r=".75"><stop offset="0" stop-color="#3a3189"/><stop offset=".6" stop-color="#1a1550"/><stop offset="1" stop-color="#0b0926"/></radialGradient>
      <radialGradient id="tg-halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff4cf" stop-opacity=".9"/><stop offset="1" stop-color="#fff4cf" stop-opacity="0"/></radialGradient>
      <symbol id="s-cups" viewBox="0 0 40 40"><path fill="currentColor" d="M6.5 5.5h27c0 11.5-5.8 17.5-13.5 17.5S6.5 17 6.5 5.5z"/><path fill="currentColor" d="M18 22.5h4v8.5h-4z"/><path fill="currentColor" d="M10.5 36.5c1.6-3.6 5.2-5.3 9.5-5.3s7.9 1.7 9.5 5.3z"/><path d="M9.5 9h21" stroke="#fff" stroke-opacity=".45" stroke-width="1.3" fill="none"/></symbol>
      <symbol id="s-wands" viewBox="0 0 40 40"><g transform="rotate(18 20 20)" fill="currentColor"><rect x="17.9" y="3" width="4.2" height="35" rx="2"/><path d="M22 11c4.2-1.4 6.6.6 7.6 3-3.2.3-5.6 0-7.6-1.2zM18 18c-4.2-1.4-6.6.6-7.6 3 3.2.3 5.6 0 7.6-1.2zM22 25.5c4.2-1.4 6.6.6 7.6 3-3.2.3-5.6 0-7.6-1.2z"/><circle cx="20" cy="4.2" r="2.8"/></g></symbol>
      <symbol id="s-swords" viewBox="0 0 40 40"><g fill="currentColor"><path d="M20 1.5l3.1 5.2V27h-6.2V6.7z"/><path d="M9.5 26.6h21v3.2h-21z"/><path d="M18.5 29.8h3v6h-3z"/><circle cx="20" cy="37.3" r="2.3"/></g><path d="M20 6v19" stroke="#fff" stroke-opacity=".45" stroke-width="1"/></symbol>
      <symbol id="s-pentacles" viewBox="0 0 40 40"><circle cx="20" cy="20" r="17.5" fill="currentColor"/><circle cx="20" cy="20" r="14.6" fill="#f6eacb"/><path d="M20 7 L27.64 30.52 L7.64 15.98 L32.36 15.98 L12.36 30.52 Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></symbol>
    </defs></svg>`);
    document.body.appendChild(svg);
  }

  const BACK = (() => {
    let star = '';
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 ? 11 : 32;
      star += (i ? 'L' : 'M') + (100 + Math.cos(a) * r).toFixed(1) + ' ' + (170 + Math.sin(a) * r).toFixed(1);
    }
    let rays = '';
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const r1 = 50, r2 = i % 2 ? 58 : 66;
      rays += `<line x1="${(100 + Math.cos(a) * r1).toFixed(1)}" y1="${(170 + Math.sin(a) * r1).toFixed(1)}" x2="${(100 + Math.cos(a) * r2).toFixed(1)}" y2="${(170 + Math.sin(a) * r2).toFixed(1)}"/>`;
    }
    const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 340"><defs><radialGradient id="g" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="#2d2468"/><stop offset="1" stop-color="#0b0921"/></radialGradient><pattern id="p" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M8 0L16 8L8 16L0 8Z" fill="none" stroke="#d9b56c" stroke-opacity=".2" stroke-width=".7"/><circle cx="8" cy="8" r=".9" fill="#d9b56c" fill-opacity=".4"/></pattern></defs><rect width="200" height="340" rx="12" fill="url(#g)"/><rect x="12" y="12" width="176" height="316" rx="6" fill="url(#p)"/><rect x="6.5" y="6.5" width="187" height="327" rx="9" fill="none" stroke="#d9b56c" stroke-width="1.6"/><rect x="12" y="12" width="176" height="316" rx="6" fill="none" stroke="#d9b56c" stroke-opacity=".55"/><g stroke="#d9b56c" stroke-opacity=".7" stroke-width="1">${rays}</g><circle cx="100" cy="170" r="46" fill="#0b0921" stroke="#d9b56c" stroke-width="1.5"/><circle cx="100" cy="170" r="39" fill="none" stroke="#d9b56c" stroke-opacity=".45"/><path d="${star}Z" fill="#d9b56c"/><circle cx="100" cy="170" r="4.5" fill="#0b0921"/><g fill="#d9b56c"><circle cx="100" cy="40" r="3"/><circle cx="100" cy="300" r="3"/><path d="M100 24l4 10-4 4-4-4z"/><path d="M100 316l4-10-4-4-4 4z"/></g></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
  })();

  // Card back is shared with the home tile, so publish it right away.
  document.documentElement.style.setProperty('--tback', BACK);

  function seeded(n) {
    let s = (n + 7) * 9301 + 49297;
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  }

  const PIPS = {
    2: [[.5, 0], [.5, 1]],
    3: [[.5, 0], [.5, .5], [.5, 1]],
    4: [[0, 0], [1, 0], [0, 1], [1, 1]],
    5: [[0, 0], [1, 0], [.5, .5], [0, 1], [1, 1]],
    6: [[0, 0], [1, 0], [0, .5], [1, .5], [0, 1], [1, 1]],
    7: [[0, 0], [1, 0], [.5, .25], [0, .5], [1, .5], [0, 1], [1, 1]],
    8: [[0, 0], [1, 0], [.5, .25], [0, .5], [1, .5], [.5, .75], [0, 1], [1, 1]],
    9: [[0, 0], [1, 0], [0, 1 / 3], [1, 1 / 3], [.5, .5], [0, 2 / 3], [1, 2 / 3], [0, 1], [1, 1]],
    10: [[0, 0], [1, 0], [.5, 1 / 6], [0, 1 / 3], [1, 1 / 3], [0, 2 / 3], [1, 2 / 3], [.5, 5 / 6], [0, 1], [1, 1]],
  };

  function rays(cx, cy, r1, r2, n, cls) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = i % 2 ? r2 - (r2 - r1) * 0.45 : r2;
      s += `<line x1="${(cx + Math.cos(a) * r1).toFixed(1)}" y1="${(cy + Math.sin(a) * r1).toFixed(1)}" x2="${(cx + Math.cos(a) * rr).toFixed(1)}" y2="${(cy + Math.sin(a) * rr).toFixed(1)}"/>`;
    }
    return `<g class="${cls || 'tf-rays'}">${s}</g>`;
  }

  function faceSVG(c) {
    let inner = '', top = '';
    if (c.major) {
      top = ROMAN[c.num];
      const rnd = seeded(c.num);
      let stars = '';
      for (let i = 0; i < 14; i++) {
        const a = rnd() * Math.PI * 2, r = 20 + rnd() * 36;
        stars += `<circle cx="${(100 + Math.cos(a) * r).toFixed(1)}" cy="${(158 + Math.sin(a) * r).toFixed(1)}" r="${(0.5 + rnd() * 1.1).toFixed(2)}"/>`;
      }
      inner = `
        <circle cx="100" cy="158" r="76" class="tf-dash"/>
        ${rays(100, 158, 66, 74, 48)}
        <circle cx="100" cy="158" r="62" fill="url(#tg-sky)" stroke="#8a6a2c" stroke-width="2"/>
        <g fill="#f6dc9c" opacity=".85">${stars}</g>
        <circle cx="100" cy="158" r="34" fill="url(#tg-halo)" opacity=".28"/>
        <text x="100" y="160" class="tf-sym">${c.sym}${VS}</text>
        <text x="100" y="252" class="tf-heb">${c.heb}</text>
        <text x="100" y="272" class="tf-attr">${L(c.attr, c.attrZh)}</text>`;
    } else if (c.rank === 1) {
      top = L('ACE', '王牌');
      inner = `
        ${rays(100, 162, 56, 78, 40, 'tf-rays suit')}
        <circle cx="100" cy="162" r="54" fill="url(#tg-halo)" opacity=".55"/>
        <use href="#s-${c.suit.id}" x="52" y="114" width="96" height="96" style="color:${c.suit.color}"/>
        <text x="100" y="262" class="tf-attr">${L(c.suit.el, c.suit.elZh)}</text>`;
    } else if (c.rank <= 10) {
      top = ROMAN[c.rank];
      const size = c.rank >= 9 ? 30 : 34;
      inner = PIPS[c.rank].map(([fx, fy]) => {
        const x = 56 + fx * 88, y = 78 + fy * 180;
        const flip = fy > 0.5 ? ` transform="rotate(180 ${x} ${y})"` : '';
        return `<use href="#s-${c.suit.id}" x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" style="color:${c.suit.color}"${flip}/>`;
      }).join('');
    } else {
      const [title, glyph] = COURT[c.rank];
      top = L(title.toUpperCase(), c.rankZh);
      inner = `
        ${rays(100, 140, 52, 60, 36)}
        <circle cx="100" cy="140" r="50" fill="url(#tg-sky)" stroke="#8a6a2c" stroke-width="2"/>
        <text x="100" y="143" class="tf-court">${glyph}${VS}</text>
        <use href="#s-${c.suit.id}" x="76" y="204" width="48" height="48" style="color:${c.suit.color}"/>
        <text x="100" y="272" class="tf-attr">${L(c.suit.el, c.suit.elZh)}</text>`;
    }
    const zhName = L(null, c.zh);
    const nm = zhName || c.name.toUpperCase();
    const fs = zhName ? 15 : nm.length <= 9 ? 13 : nm.length <= 13 ? 11.5 : nm.length <= 16 ? 10.2 : 9.2;
    return `<svg class="tface" viewBox="0 0 200 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(cname(c))}">
      <rect width="200" height="340" rx="12" fill="url(#tg-parch)"/>
      <rect x="7" y="7" width="186" height="326" rx="8" fill="none" stroke="#8a6a2c" stroke-width="1.6"/>
      <rect x="12" y="12" width="176" height="316" rx="5" fill="none" stroke="#b8934a" stroke-width=".7"/>
      <g fill="#8a6a2c"><path d="M12 22l4-6 4 6-4 6z" transform="translate(-2 -2)"/><path d="M180 22l4-6 4 6-4 6z" transform="translate(2 -2)"/><path d="M12 318l4-6 4 6-4 6z" transform="translate(-2 2)"/><path d="M180 318l4-6 4 6-4 6z" transform="translate(2 2)"/></g>
      <text x="100" y="44" class="tf-top">${top}</text>
      <path d="M58 52h84" stroke="#b8934a" stroke-width=".8"/>
      ${inner}
      <path d="M22 286h156l-9 13 9 13H22l9-13z" fill="#1c173f" stroke="#b8934a" stroke-width="1"/>
      <text x="100" y="${zhName ? 304.5 : 303.5}" class="tf-name${zhName ? ' zh' : ''}" style="font-size:${fs}px">${esc(nm)}</text>
    </svg>`;
  }

  /* ------------------------------------------------ Rider–Waite–Smith art
     Pamela Colman Smith's 1909 illustrations (public domain), bundled in
     assets/rws from the Wikimedia Commons scans. The drawn face sits
     underneath as a fallback if an image is missing. */
  const pad = (n) => String(n).padStart(2, '0');
  function rwsUrl(c) {
    return c.major ? `assets/rws/major-${pad(c.num)}.jpg` : `assets/rws/${c.suit.id}-${pad(c.rank)}.jpg`;
  }
  function cardFace(c) {
    const zh = L(null, c.zh);
    return `<span class="rws">${faceSVG(c)}<img src="${rwsUrl(c)}" alt="${esc(cname(c))}" decoding="async" draggable="false"
      onload="this.classList.add('loaded')" onerror="this.remove()">${zh ? `<span class="rws-zh">${esc(zh)}</span>` : ''}</span>`;
  }
  function preload(cards) { cards.forEach((c) => { const i = new Image(); i.src = rwsUrl(c); }); }

  /* ------------------------------------------------------------ oracle */
  App.register({
    id: 'tarot',
    name: { en: 'Tarot', zh: '塔罗' },
    native: { en: '', zh: 'Tarot' },
    hue: 265,
    subtitle: { en: 'Shuffle the seventy-eight, spread the deck, and draw what calls to you.', zh: '洗匀七十八张牌，展开牌组，抽出召唤你的那几张。' },
    blurb: { en: 'Shuffle the full deck, reversals and all, then choose your cards from the fan.', zh: '洗匀整副牌（含逆位），再从扇形牌阵中亲手选牌。' },
    art: `<div class="art-tarot">${[0, 1, 2].map((i) => `<i style="--k:${i - 1}"></i>`).join('')}</div>`,

    mount(root, ctx) {
      injectDefs();

      let spreadId = App.store.get('tarot.spread', 'three');
      let reversals = App.store.get('tarot.rev', true);
      let majorsOnly = App.store.get('tarot.majors', false);
      let deck = [];
      let phase = 'deck';
      let shuffles = 0;
      let busy = false;
      let chosen = [];
      let fanEls = [];
      let picks = [];
      let slots = [];
      let revealed = 0;

      root.innerHTML = `
        <div class="controls tc-controls"></div>
        <div class="status tc-status"></div>
        <div class="tc-table"></div>
        <div class="actions tc-actions"></div>
        <div class="result-wrap tc-result"></div>`;
      const controls = $('.tc-controls', root);
      const status = $('.tc-status', root);
      const table = $('.tc-table', root);
      const actions = $('.tc-actions', root);
      const resultBox = $('.tc-result', root);

      controls.append(
        UI.seg(Object.entries(SPREADS).map(([k, s]) => ({ value: k, label: tr(s.short) })), spreadId, (v) => {
          spreadId = v; App.store.set('tarot.spread', v);
          if (phase === 'deck') say(deckStatus());
          else if (phase === 'done') resetDeck();
        }),
        UI.toggle(L('Reversals', '逆位'), reversals, (v) => { reversals = v; App.store.set('tarot.rev', v); resetDeck(); }),
        UI.toggle(L('Major Arcana only', '仅大阿尔卡那'), majorsOnly, (v) => { majorsOnly = v; App.store.set('tarot.majors', v); resetDeck(); })
      );

      function say(text) {
        status.innerHTML = text;
        status.classList.remove('swap'); void status.offsetWidth; status.classList.add('swap');
      }
      function setActions(...els) { actions.innerHTML = ''; els.forEach((e) => e && actions.appendChild(e)); }
      const sp = () => SPREADS[spreadId];

      function deckStatus() {
        return shuffles
          ? L(`Shuffled ${shuffles === 1 ? 'once' : shuffles + ' times'}. Shuffle again, or spread the deck for a ${tr(sp().name).toLowerCase()} reading.`,
            `已洗牌 ${shuffles} 次。可以再洗，或展开牌组进行「${tr(sp().name)}」占卜。`)
          : L(`The ${deck.length} cards rest in order. Shuffle when your mind is settled.`, `${deck.length} 张牌依序排放。心绪平静后，开始洗牌。`);
      }

      /* ---------------------------------------------- deck stage */
      function resetDeck() {
        deck = buildDeck(majorsOnly);
        phase = 'deck'; shuffles = 0; chosen = []; picks = []; revealed = 0; busy = false;
        resultBox.innerHTML = '';
        UI.lock(controls, false);
        table.innerHTML = `<div class="tc-deckstage"><div class="tc-deck">${Array.from({ length: 14 }, (_, i) => `<div class="tc-mini" style="z-index:${i};transform:${base(i)}"></div>`).join('')}</div><div class="tc-count">${L(`${deck.length} cards`, `共 ${deck.length} 张`)}</div></div>`;
        say(deckStatus());
        setActions(UI.btn(L('Shuffle the deck', '洗牌'), shuffle, { primary: true }));
      }
      const base = (i) => `translate(${(-i * 0.6).toFixed(1)}px, ${(-i * 0.9).toFixed(1)}px)`;

      async function riffle() {
        const minis = $$('.tc-mini', table);
        const half = Math.ceil(minis.length / 2);
        Sfx.whoosh(0.3);
        await Promise.all(minis.map((m, i) => {
          const left = i < half, k = left ? i : i - half;
          return ctx.anim(m, [{ transform: `translate(${left ? -96 : 96}px, ${-k * 1.4}px) rotate(${left ? -9 : 9}deg)` }], { duration: 360, delay: k * 10 });
        }));
        const order = [];
        for (let k = 0; k < half; k++) {
          if (minis[k]) order.push(minis[k]);
          if (minis[half + k]) order.push(minis[half + k]);
        }
        order.forEach((m, j) => { m.style.zIndex = j; ctx.later(() => Sfx.tick(), 40 + j * 38); });
        await Promise.all(order.map((m, j) => ctx.anim(m, [{ transform: `${base(j)} translateY(-14px)` }, { transform: base(j) }], { duration: 280, delay: j * 38, easing: 'cubic-bezier(.3,.8,.3,1.2)' })));
        // keep DOM order matching the new stacking
        order.forEach((m) => m.parentNode.appendChild(m));
      }

      async function bridge() {
        const minis = $$('.tc-mini', table);
        await Promise.all(minis.map((m, i) => ctx.anim(m, [
          { transform: base(i) },
          { transform: `${base(i)} translateY(${-18 - (minis.length - i) * 2}px) rotateX(18deg)`, offset: 0.5 },
          { transform: base(i) },
        ], { duration: 520, delay: i * 14, easing: 'ease-in-out' })));
      }

      async function shuffle() {
        if (busy) return;
        busy = true;
        UI.lock(controls, true);
        $$('button', actions).forEach((b) => { b.disabled = true; });
        say(L('Shuffling…', '洗牌中……'));
        await riffle();
        await riffle();
        await bridge();
        RNG.shuffle(deck);
        deck.forEach((c) => { c.reversed = reversals && RNG.coin(); });
        shuffles++;
        busy = false;
        UI.lock(controls, false);
        say(deckStatus());
        setActions(
          UI.btn(L('Shuffle again', '再洗一次'), shuffle),
          UI.btn(L('Spread the deck', '展开牌组'), toFan, { primary: true })
        );
      }

      /* ------------------------------------------------ fan stage */
      function toFan() {
        if (busy) return;
        phase = 'fan';
        chosen = [];
        UI.lock(controls, true);
        const n = sp().n;
        const W = Math.max(300, table.clientWidth);
        const N = deck.length;
        const cw = Math.round(Math.max(44, Math.min(84, W / 13)));
        const ch = cw * 1.7;
        const narrow = W < 600;
        const A = ((narrow ? Math.min(170, 70 + N * 1.3) : Math.min(124, 50 + N)) * Math.PI) / 180;
        const R = Math.max(130, (W - cw - 16) / (2 * Math.sin(A / 2)));
        const height = R * (1 - Math.cos(A / 2)) + ch + 70;

        const fan = h(`<div class="tc-fan" style="height:${height.toFixed(0)}px;--fcw:${cw}px"></div>`);
        fanEls = deck.map((c, i) => {
          const a = ((-A / 2 + (A * i) / (N - 1)) * 180) / Math.PI;
          const el = h(`<button type="button" class="tc-fcard" aria-label="${L('Card', '第')} ${i + 1}${L('', ' 张')}" style="--a:${a.toFixed(2)}deg;transform-origin:50% ${R.toFixed(0)}px;transition-delay:${(i * 7)}ms"><span class="tc-badge"></span></button>`);
          el.dataset.a = a;
          el.addEventListener('click', () => choose(i));
          el.addEventListener('pointerenter', () => { if (!el.classList.contains('chosen')) Sfx.tick(); });
          fan.appendChild(el);
          return el;
        });
        table.innerHTML = '';
        table.appendChild(fan);
        requestAnimationFrame(() => requestAnimationFrame(() => fan.classList.add('open')));
        Sfx.whoosh(0.9);
        say(L(`Choose <b>${n}</b> card${n > 1 ? 's' : ''} from the spread deck — let your hand decide.`, `从展开的牌中选出 <b>${n}</b> 张——让手替你决定。`));
        const top = h(`<button type="button" class="linkbtn">${L('or deal from the top of the deck', '或直接从牌顶发牌')}</button>`);
        top.addEventListener('click', dealTop);
        setActions(top);
      }

      function choose(i) {
        if (phase !== 'fan' || busy) return;
        const n = sp().n;
        const el = fanEls[i];
        const at = chosen.indexOf(i);
        if (at >= 0) {
          chosen.splice(at, 1);
          el.classList.remove('chosen');
          chosen.forEach((ci, k) => { $('.tc-badge', fanEls[ci]).textContent = k + 1; });
          Sfx.tick();
        } else if (chosen.length < n) {
          chosen.push(i);
          el.classList.add('chosen');
          $('.tc-badge', el).textContent = chosen.length;
          Sfx.flip();
          Sfx.chime(500 + chosen.length * 40);
        }
        const left = n - chosen.length;
        if (left > 0) say(L(`Choose <b>${left}</b> more card${left > 1 ? 's' : ''}. <span class="muted-s">Tap a chosen card to return it.</span>`, `还需选 <b>${left}</b> 张。<span class="muted-s">再点已选的牌可放回。</span>`));
        else { busy = true; say(L('The cards are chosen.', '牌已选定。')); ctx.later(toSpread, 650); }
      }

      async function dealTop() {
        if (phase !== 'fan' || busy) return;
        busy = true;
        const n = sp().n;
        for (let k = chosen.length; k < n; k++) {
          // take the first cards not already chosen, in deck order
          let i = 0;
          while (chosen.includes(i)) i++;
          chosen.push(i);
          fanEls[i].classList.add('chosen');
          $('.tc-badge', fanEls[i]).textContent = chosen.length;
          Sfx.flip();
          await ctx.wait(160);
        }
        say(L('Dealt from the top.', '已从牌顶发牌。'));
        await ctx.wait(500);
        toSpread();
      }

      /* --------------------------------------------- spread stage */
      function spreadCw() {
        const W = table.clientWidth || 800;
        if (spreadId === 'one') return Math.round(Math.min(230, Math.max(150, W * 0.36)));
        if (spreadId === 'three') return Math.round(Math.min(190, Math.max(88, (W - 80) / 3.4)));
        return Math.round(Math.min(118, Math.max(40, (W - 8) / 7.4)));
      }

      async function toSpread() {
        phase = 'spread';
        busy = true;
        setActions();
        const S = sp();
        const from = chosen.map((i) => ({ r: fanEls[i].getBoundingClientRect(), a: parseFloat(fanEls[i].dataset.a) }));
        picks = chosen.map((i) => deck[i]);
        preload(picks);
        const fan = $('.tc-fan', table);
        fan.classList.add('gather');
        Sfx.whoosh(0.5);
        await ctx.wait(420);

        const cw = spreadCw();
        const spread = h(`<div class="tc-spread layout-${S.layout}" style="--cw:${cw}px">${S.positions.map((p, k) => `
          <div class="tc-slot pos${k + 1}${picks[k].reversed ? ' reversed' : ''}" data-k="${k}">
            <button type="button" class="tc-card" aria-label="${S.n > 1 ? L('Position ', '位置 ') + (k + 1) + ', ' : ''}${esc(tr(p))} — ${L('face down', '背面朝上')}">
              <span class="tc-inner"><span class="tc-face tc-back"></span><span class="tc-face tc-front"><span class="tc-orient">${cardFace(picks[k])}</span></span></span>
            </button>
            <div class="tc-label">${S.n > 1 ? `<b>${k + 1}</b>` : ''}<span>${esc(tr(p))}</span></div>
          </div>`).join('')}</div>`);
        table.innerHTML = '';
        table.appendChild(spread);
        slots = $$('.tc-slot', spread);

        slots.forEach((slot, k) => {
          const r2 = slot.getBoundingClientRect();
          const r1 = from[k].r;
          const dx = r1.left + r1.width / 2 - (r2.left + r2.width / 2);
          const dy = r1.top + r1.height / 2 - (r2.top + r2.height / 2);
          const s = (parseFloat(fan.style.getPropertyValue('--fcw')) || 60) / cw;
          ctx.later(() => Sfx.flip(), k * 150 + 200);
          ctx.anim(slot, [
            { transform: `translate(${dx}px, ${dy}px) rotate(${from[k].a}deg) scale(${s})`, opacity: 0.6 },
            { transform: 'none', opacity: 1 },
          ], { duration: 950, delay: k * 150, easing: 'cubic-bezier(.2,.8,.2,1)' });
          $('.tc-card', slot).addEventListener('click', () => onCard(k));
        });
        await ctx.wait(950 + S.n * 150);
        busy = false;
        say(S.n === 1 ? L('Turn the card when you are ready.', '准备好后，翻开这张牌。') : L('Turn each card when you are ready, in any order.', '准备好后逐一翻牌，顺序随意。'));
        setActions(UI.btn(L('Reveal all', '全部翻开'), revealAll, { primary: true }));
        spread.scrollIntoView({ behavior: App.reduced ? 'auto' : 'smooth', block: 'nearest' });
      }

      function onCard(k) {
        const slot = slots[k];
        if (!slot) return;
        if (slot.classList.contains('flipped')) { openCard(k); return; }
        if (busy) return;
        flip(k);
      }

      function flip(k) {
        const slot = slots[k];
        if (slot.classList.contains('flipped')) return;
        slot.classList.add('flipped');
        const c = picks[k];
        $('.tc-card', slot).setAttribute('aria-label', `${tr(sp().positions[k])}: ${cname(c)}${c.reversed ? L(', reversed', '，逆位') : ''}`);
        Sfx.flip();
        ctx.later(() => { Sfx.chime(c.major ? 523 : 659); App.sparkle(slot, c.major ? 22 : 12); }, 380);
        revealed++;
        if (revealed === picks.length) ctx.later(finish, 900);
      }

      async function revealAll() {
        if (busy) return;
        busy = true;
        setActions();
        for (let k = 0; k < slots.length; k++) {
          if (!slots[k].classList.contains('flipped')) { flip(k); await ctx.wait(320); }
        }
        busy = false;
      }

      function finish() {
        phase = 'done';
        UI.lock(controls, false);
        setActions();
        const S = sp();
        say(L('The reading is laid out. Tap any card to look closer.', '牌阵已展开。点击任一张牌可放大查看。'));
        Sfx.reveal();
        const rows = picks.map((c, k) => `<li style="--d:${k}"><div class="tr-head"><span class="tr-pos">${S.n > 1 ? `<b>${k + 1}</b>` : ''}${esc(tr(S.positions[k]))}</span><span class="tr-name">${esc(cname(c))}</span>${c.reversed ? `<span class="badge">${L('Reversed', '逆位')}</span>` : '<span></span>'}</div><p class="tr-mean">${esc(meaning(c, c.reversed))}</p></li>`).join('');
        const panel = h(`<div class="result panel tc-res"><h3>${esc(tr(S.name))}</h3><ol class="tc-list">${rows}</ol><p class="hint">${L('Meanings shown are the general traditional senses for each card as drawn.', '所示为每张牌按正逆位的传统通释。')}<br>${L('Card art: the Rider–Waite–Smith deck (1909), illustrated by Pamela Colman Smith — public domain (scans from Wikimedia Commons).', '牌面：莱德–韦特–史密斯塔罗（1909），帕梅拉·科尔曼·史密斯绘制——公有领域（扫描件取自维基共享资源）。')}</p></div>`);
        panel.appendChild(UI.resultActions(summary, () => { resetDeck(); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
        resultBox.innerHTML = '';
        resultBox.appendChild(panel);
        App.record('tarot', `${tr(S.name)}: ${picks.map((c) => cname(c) + (c.reversed ? L(' (R)', '（逆）') : '')).join(L(', ', '、'))}`,
          picks.map((c, k) => `${tr(S.positions[k])} — ${cname(c)}${c.reversed ? L(' reversed', '逆位') : ''}: ${meaning(c, c.reversed)}`).join(' · '));
      }

      function summary() {
        const S = sp();
        return `${L('Tarot', '塔罗')} — ${tr(S.name)}\n` + picks.map((c, k) => `${k + 1}. ${tr(S.positions[k])}: ${cname(c)}${c.reversed ? L(' (reversed)', '（逆位）') : ''} — ${meaning(c, c.reversed)}`).join('\n');
      }

      function openCard(k) {
        const c = picks[k];
        const S = sp();
        const facts = c.major
          ? `<div><dt>${L('Arcana', '牌类')}</dt><dd>${L('Major', '大阿尔卡那')} · ${ROMAN[c.num]}</dd></div><div><dt>${L('Attribution', '对应')}</dt><dd>${c.sym}${VS} ${L(c.attr, c.attrZh)}</dd></div><div><dt>${L('Hebrew letter', '希伯来字母')}</dt><dd>${c.heb} ${c.hebName}</dd></div>`
          : `<div><dt>${L('Arcana', '牌类')}</dt><dd>${L('Minor', '小阿尔卡那')} · ${L(c.suit.name, c.suit.zh)}</dd></div><div><dt>${L('Element', '元素')}</dt><dd>${L(c.suit.el, c.suit.elZh)}</dd></div><div><dt>${L('Rank', '牌阶')}</dt><dd>${L(c.rankName, c.rankZh)}</dd></div>`;
        const el = h(`<div class="tc-modal">
          <div class="tc-big${c.reversed ? ' reversed' : ''}">${cardFace(c)}</div>
          <div class="tc-info">
            <div class="eyebrow">${S.n > 1 ? L(`Position ${k + 1} · `, `位置 ${k + 1} · `) : ''}${esc(tr(S.positions[k]))}</div>
            <h2>${esc(cname(c))}</h2>
            <p class="tc-orientation">${c.reversed ? L('Reversed', '逆位') : L('Upright', '正位')}</p>
            <div class="tc-means">
              <p class="meaning${c.reversed ? ' muted' : ''}"><span class="meaning-label">${L('Upright', '正位')}${c.reversed ? '' : L(' · as drawn', ' · 本次')}</span>${esc(meaning(c, false))}</p>
              <p class="meaning${c.reversed ? '' : ' muted'}"><span class="meaning-label">${L('Reversed', '逆位')}${c.reversed ? L(' · as drawn', ' · 本次') : ''}</span>${esc(meaning(c, true))}</p>
            </div>
            <dl class="tc-facts">${facts}</dl>
          </div>
        </div>`);
        App.modal(el);
      }

      resetDeck();
    },
  });

  window.Div.tarotFace = faceSVG;
})();
