/* Kau Cim (求籤) — shake the bamboo cylinder until one of the hundred
   sticks falls, then confirm it by casting the moon blocks (擲筊). */
(function () {
  'use strict';
  const { App, RNG, Sfx, UI, h, $, $$, L } = window.Div;
  const QIAN = () => L('籤', '签'); // traditional in English mode, simplified in Chinese mode

  const ZH = '〇一二三四五六七八九';
  function zhNum(n) {
    if (n === 100) return '一百';
    if (n < 10) return ZH[n];
    const t = Math.floor(n / 10), u = n % 10;
    return (t === 1 ? '' : ZH[t]) + '十' + (u ? ZH[u] : '');
  }

  const OUTCOMES = {
    holy: {
      zhT: '聖筊', zhS: '圣筊', py: 'Shèng jiǎo', en: 'Holy blocks', enZh: '圣杯 · 允',
      note: 'One flat face up, one round — the answer is yes. Yin and yang are in agreement; the gods consent.',
      noteZh: '一平一凸——答案为「是」。阴阳相合，神明应允。',
    },
    laugh: {
      zhT: '笑筊', zhS: '笑筊', py: 'Xiào jiǎo', en: 'Laughing blocks', enZh: '笑杯 · 未明',
      note: 'Both flat faces up — the gods laugh. The question is unclear or already known; rephrase it or ask again.',
      noteZh: '两平面朝上——神明一笑。问题不清或答案已明，宜换个问法或再问。',
    },
    yin: {
      zhT: '陰筊', zhS: '阴筊', py: 'Yīn jiǎo', en: 'Yin blocks', enZh: '阴杯 · 否',
      note: 'Both round faces up — the answer is no, or the time is not right. Reconsider before asking again.',
      noteZh: '两凸面朝上——答案为「否」，或时机未到。宜先反省再问。',
    },
  };
  const ocName = (o) => L(o.zhT, o.zhS);
  const ocLabel = (o) => L(o.en, o.enZh);
  const ocNote = (o) => L(o.note, o.noteZh);

  function blockSVG(face) {
    // A crescent; the round (convex) face is glossy, the flat face is matte.
    const d = 'M8 52 C14 16 106 16 112 52 C100 40 20 40 8 52 Z';
    return face === 'round'
      ? `<svg viewBox="0 0 120 60" aria-hidden="true"><defs><radialGradient id="jbR" cx=".45" cy=".25" r=".8"><stop offset="0" stop-color="#ff8a6e"/><stop offset=".45" stop-color="#c3271b"/><stop offset="1" stop-color="#5e0b07"/></radialGradient></defs><path d="${d}" fill="url(#jbR)" stroke="#3d0603" stroke-width="1.2"/><path d="M26 30 C44 20 76 20 94 30" stroke="#ffd2c2" stroke-opacity=".55" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`
      : `<svg viewBox="0 0 120 60" aria-hidden="true"><path d="${d}" fill="#d8a06c" stroke="#7a3a14" stroke-width="1.2"/><path d="M14 48 C24 26 96 26 106 48" stroke="#a8683a" stroke-opacity=".6" stroke-width="1" fill="none"/><path d="M22 44 C34 30 86 30 98 44" stroke="#a8683a" stroke-opacity=".45" stroke-width="1" fill="none"/><path d="${d}" fill="none" stroke="#b5291d" stroke-width="3.5"/></svg>`;
  }
  function blockEl() {
    return h(`<div class="jb"><div class="jb-inner"><div class="jb-face jb-flat">${blockSVG('flat')}</div><div class="jb-face jb-round">${blockSVG('round')}</div></div><div class="jb-shadow"></div></div>`);
  }

  App.register({
    id: 'kaucim',
    name: { en: 'Kau Cim', zh: '求签' },
    native: { en: '求籤', zh: 'Kau Cim · 灵签' },
    hue: 2,
    subtitle: { en: 'Kneel, shake the bamboo cylinder until a single stick falls, then ask the moon blocks to confirm it.', zh: '跪而摇动签筒，直至一支签落下，再掷筊请神明确认。' },
    blurb: { en: 'Shake the cylinder of one hundred fortune sticks, then cast the crescent moon blocks to confirm.', zh: '摇动装有一百支签的签筒，再掷新月形筊杯确认。' },
    art: `<div class="art-kc"><div class="akc-sticks">${Array.from({ length: 9 }, (_, i) => `<i style="--x:${i};--h:${70 + ((i * 37) % 22)}px"></i>`).join('')}</div><div class="akc-cup">籤</div></div>`,

    mount(root, ctx) {
      let mode = App.store.get('kc.mode', 'sticks');
      let state = 'ready';
      let stickNo = 0;
      let attempts = 0;
      let blockCasts = [];

      root.innerHTML = `
        <div class="controls kc-controls"></div>
        <div class="status kc-status"></div>
        <div class="kc-stage"></div>
        <div class="actions kc-actions"></div>
        <div class="result-wrap kc-result"></div>`;
      const controls = $('.kc-controls', root);
      const status = $('.kc-status', root);
      const stage = $('.kc-stage', root);
      const actions = $('.kc-actions', root);
      const resultBox = $('.kc-result', root);

      controls.append(UI.seg([
        { value: 'sticks', label: L('Fortune Sticks', '求签') },
        { value: 'blocks', label: L('Moon Blocks Only', '仅掷筊') },
      ], mode, (v) => { mode = v; App.store.set('kc.mode', v); reset(); }));

      function say(text) {
        status.innerHTML = text;
        status.classList.remove('swap'); void status.offsetWidth; status.classList.add('swap');
      }
      function setActions(...els) { actions.innerHTML = ''; els.forEach((e) => e && actions.appendChild(e)); }

      /* ------------------------------------------------------- layout */
      function reset() {
        attempts = 0; blockCasts = [];
        resultBox.innerHTML = '';
        UI.lock(controls, false);
        buildStage();
      }

      function buildStage() {
        state = 'ready'; stickNo = 0;
        const sticks = Array.from({ length: 34 }, (_, i) => {
          const x = 14 + (i / 33) * 72 + (Math.random() - 0.5) * 3;
          return `<i class="kc-stick" style="left:${x.toFixed(1)}%;--h:${(244 + Math.random() * 46).toFixed(0)}px;--r:${((x - 50) * 0.1 + (Math.random() - 0.5) * 2).toFixed(1)}deg;z-index:${Math.round(Math.random() * 3)}"></i>`;
        }).join('');
        stage.innerHTML = `
          <div class="kc-altar${mode === 'blocks' ? ' blocks-only' : ''}">
            <div class="kc-incense" aria-hidden="true"><i></i><i></i><i></i></div>
            ${mode === 'sticks' ? `<div class="kc-cup-wrap" role="button" tabindex="0" aria-label="${L('Hold to shake the cylinder', '按住摇动签筒')}">
              <div class="kc-cup">
                <div class="kc-rim"></div>
                <div class="kc-sticks">${sticks}</div>
                <div class="kc-tube"><span class="kc-band b1"></span><span class="kc-band b2"></span><span class="kc-tube-label">${QIAN()}</span></div>
              </div>
              <div class="kc-progress"><i></i></div>
            </div>` : ''}
            <div class="kc-floor">
              <div class="kc-fallen"></div>
              <div class="kc-blocks"></div>
            </div>
          </div>`;
        const blocks = $('.kc-blocks', stage);
        blocks.append(blockEl(), blockEl());
        if (mode === 'sticks') {
          say(L('Hold the cylinder and shake it — gently, steadily — until one stick falls.', '按住签筒，轻柔而稳定地摇动，直到一支签落下。'));
          setupShake();
        } else {
          blocks.classList.add('ready');
          say(L('Hold the two crescent blocks together, then let them fall.', '双手合持两片筊杯，诚心默问，然后掷下。'));
          setActions(UI.btn(L('Cast the moon blocks', '掷筊'), () => castBlocks(), { primary: true }));
        }
      }

      /* ------------------------------------------------------ shaking */
      function setupShake() {
        const wrap = $('.kc-cup-wrap', stage);
        const cup = $('.kc-cup', stage);
        const bar = $('.kc-progress i', stage);
        let holding = false, progress = 0, target = 0, riser = null, last = 0, rattleT = 0, raf = 0;

        const btn = UI.btn(L('Hold to shake', '按住摇签'), null, { primary: true, cls: 'kc-hold' });
        setActions(btn);

        function start(e) {
          if (state !== 'ready') return;
          if (e && e.preventDefault) e.preventDefault();
          if (e && e.pointerId !== undefined && e.currentTarget.setPointerCapture) {
            try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
          }
          holding = true;
          UI.lock(controls, true);
          cup.classList.add('shaking');
          if (!riser) {
            const all = $$('.kc-stick', stage);
            riser = all[Math.floor(all.length * 0.3 + Math.random() * all.length * 0.4)];
            riser.classList.add('riser');
            target = 1500 + Math.random() * 1700;
          }
          if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
          say(L('The sticks rattle against each other…', '签枝在筒中簌簌作响……'));
        }
        function stop() {
          if (!holding) return;
          holding = false;
          cup.classList.remove('shaking');
          if (state === 'ready') say(L('Keep shaking — hold until a stick falls.', '继续摇——按住直到有签落下。'));
        }
        function tick(now) {
          raf = 0;
          if (!ctx.alive || state !== 'ready') return;
          const dt = Math.min(64, now - last); last = now;
          if (holding) {
            progress += dt;
            if (now - rattleT > 95) { Sfx.rattle(2); rattleT = now; }
          } else {
            progress = Math.max(0, progress - dt * 0.35);
          }
          const p = Math.min(1, progress / target);
          if (riser) riser.style.setProperty('--rise', (-p * 70).toFixed(1) + 'px');
          bar.style.transform = `scaleX(${p})`;
          if (progress >= target) { holding = false; cup.classList.remove('shaking'); fall(riser); return; }
          if (holding || progress > 0) raf = requestAnimationFrame(tick);
        }

        [wrap, btn].forEach((el) => {
          el.addEventListener('pointerdown', start);
          el.addEventListener('pointerup', stop);
          el.addEventListener('pointercancel', stop);
          el.addEventListener('lostpointercapture', stop);
          el.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) start(e); });
          el.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') stop(); });
          el.addEventListener('contextmenu', (e) => e.preventDefault());
        });
        ctx.onDestroy(() => cancelAnimationFrame(raf));
      }

      /* -------------------------------------------------------- fall */
      async function fall(riser) {
        state = 'falling';
        setActions();
        const two = RNG.int(100) < 6; // now and then two sticks tumble out together
        stickNo = RNG.range(1, 100);
        attempts++;
        const fallen = $('.kc-fallen', stage);
        const r1 = riser.getBoundingClientRect();
        riser.classList.add('gone');
        const big = h(`<div class="kc-bigstick"><span class="kc-no">第${zhNum(stickNo)}${QIAN()}</span><span class="kc-ar">${stickNo}</span></div>`);
        fallen.innerHTML = '';
        fallen.appendChild(big);
        const r2 = big.getBoundingClientRect();
        const dx = r1.left + r1.width / 2 - (r2.left + r2.width / 2);
        const dy = r1.top + r1.height / 2 - (r2.top + r2.height / 2);
        Sfx.whoosh(0.4);
        ctx.later(() => Sfx.clack(), 620);
        ctx.later(() => Sfx.clack(), 780);
        const anims = [ctx.anim(big, [
          { transform: `translate(${dx}px, ${dy}px) rotate(-90deg) scale(.55)`, opacity: 0.9 },
          { transform: `translate(${dx * 0.5 + 40}px, ${dy * 0.4 - 30}px) rotate(-30deg) scale(.8)`, offset: 0.45 },
          { transform: 'translate(0, 0) rotate(-6deg) scale(1)', offset: 0.75 },
          { transform: 'translate(0, -12px) rotate(-3deg) scale(1)', offset: 0.85 },
          { transform: 'translate(0, 0) rotate(-4deg) scale(1)', opacity: 1 },
        ], { duration: 900, easing: 'cubic-bezier(.4,.1,.5,1)' })];

        if (two) {
          const other = $$('.kc-stick:not(.gone):not(.riser)', stage)[5];
          if (other) other.classList.add('gone');
          const big2 = h(`<div class="kc-bigstick second"><span class="kc-no">${QIAN()}</span></div>`);
          fallen.appendChild(big2);
          anims.push(ctx.anim(big2, [
            { transform: `translate(${dx - 30}px, ${dy}px) rotate(-90deg) scale(.55)`, opacity: 0.9 },
            { transform: 'translate(0, 0) rotate(8deg) scale(1)', opacity: 1 },
          ], { duration: 1000, delay: 80, easing: 'cubic-bezier(.4,.1,.5,1)' }));
        }
        await Promise.all(anims);

        if (two) {
          state = 'two';
          say(L('Two sticks fell together. By custom they are returned, and the cylinder is shaken again.', '两支签同时落下。按习俗须放回，重新摇签。'));
          setActions(UI.btn(L('Gather the sticks', '收回签枝'), () => regather(), { primary: true }));
          return;
        }
        App.sparkle(big, 16);
        Sfx.bell(440, 0.05);
        state = 'fallen';
        say(L(`Stick <b>${stickNo}</b> has fallen — 第${zhNum(stickNo)}籤. Ask the moon blocks whether it is the right one.`, `第 <b>${zhNum(stickNo)}</b> 签落下。请掷筊问神明是否就是此签。`));
        $('.kc-blocks', stage).classList.add('ready');
        setActions(UI.btn(L('Cast the moon blocks', '掷筊'), () => castBlocks(), { primary: true }));
      }

      async function regather() {
        setActions();
        await ctx.anim($('.kc-floor', stage), [{ opacity: 1 }, { opacity: 0, transform: 'translateY(-30px)' }], 400);
        buildStage();
        Sfx.rattle(6);
        say(L('The sticks are back in the cylinder. Shake again until one falls.', '签已放回筒中。再次摇签，直到一支落下。'));
      }

      /* -------------------------------------------------- moon blocks */
      async function castBlocks() {
        if (state === 'casting') return;
        const prev = state;
        state = 'casting';
        setActions();
        const flatUp = [RNG.coin(), RNG.coin()];
        const outcome = flatUp[0] !== flatUp[1] ? 'holy' : flatUp[0] ? 'laugh' : 'yin';
        const els = $$('.jb', stage);
        Sfx.whoosh(0.4);
        await Promise.all(els.map((el, i) => {
          const inner = $('.jb-inner', el), sh = $('.jb-shadow', el);
          const spins = 3 + Math.floor(Math.random() * 3);
          const endX = spins * 360 + (flatUp[i] ? 0 : 180);
          const endZ = (i ? 1 : -1) * (8 + Math.random() * 30);
          const spread = Math.min(1, stage.clientWidth / 600); // keep blocks on screen on narrow phones
          const dx = (i ? 1 : -1) * (20 + Math.random() * 40) * spread;
          const dur = 1150 + i * 120 + Math.random() * 120;
          ctx.later(() => Sfx.clack(), dur * 0.72);
          ctx.later(() => Sfx.clack(), dur * 0.88);
          return Promise.all([
            ctx.anim(el, [
              { transform: 'translate(0, 40px) scale(.9)', easing: 'cubic-bezier(.2,.6,.4,1)' },
              { transform: `translate(${dx * 0.5}px, -${Math.round(120 + 70 * spread)}px) scale(1.15)`, offset: 0.38, easing: 'cubic-bezier(.6,0,.9,.5)' },
              { transform: `translate(${dx}px, 0) scale(1)`, offset: 0.72, easing: 'ease-out' },
              { transform: `translate(${dx * 1.1}px, -16px) scale(1)`, offset: 0.82, easing: 'ease-in' },
              { transform: `translate(${dx * 1.15}px, 0) scale(1)` },
            ], { duration: dur, easing: 'linear' }),
            ctx.anim(inner, [
              { transform: 'rotateX(0deg) rotateZ(0deg)' },
              { transform: `rotateX(${endX}deg) rotateZ(${endZ}deg)` },
            ], { duration: dur * 0.85, easing: 'cubic-bezier(.25,.6,.35,1)' }),
            ctx.anim(sh, [
              { opacity: 0.6, transform: 'scale(1)' }, { opacity: 0.15, transform: 'scale(.5)', offset: 0.38 },
              { opacity: 0.6, transform: 'scale(1)', offset: 0.72 }, { opacity: 0.6, transform: 'scale(1)' },
            ], { duration: dur, easing: 'linear' }),
          ]);
        }));
        const o = OUTCOMES[outcome];
        blockCasts.push(outcome);
        Sfx.bell(outcome === 'holy' ? 523 : 349, 0.05);
        if (outcome === 'holy') App.sparkle($('.kc-blocks', stage), 22);

        if (mode === 'blocks') {
          state = 'ready';
          say(L(`<b>${o.zhT}</b> ${o.py} — ${o.en}.`, `<b>${o.zhS}</b> · ${o.enZh}`));
          showBlocksResult(o);
          App.record('kaucim', L(`Moon blocks: ${o.zhT} ${o.en}`, `掷筊：${o.zhS}`), ocNote(o));
          setActions(UI.btn(L('Cast again', '再掷一次'), () => castBlocks(), { primary: true }));
          return;
        }
        if (outcome === 'holy') {
          state = 'confirmed';
          UI.lock(controls, false);
          say(L(`<b>${o.zhT}</b> — the blocks confirm stick ${stickNo}.`, `<b>${o.zhS}</b>——神明应允，确认第${zhNum(stickNo)}签。`));
          Sfx.reveal();
          showStickResult(o);
        } else {
          state = prev;
          say(L(`<b>${o.zhT}</b> ${o.py} — ${o.en}. ${o.note} The stick is returned; shake again.`, `<b>${o.zhS}</b>——${o.noteZh}此签放回，重新摇签。`));
          setActions(UI.btn(L('Return the stick', '放回此签'), () => regather(), { primary: true }));
        }
      }

      function showBlocksResult(o) {
        const panel = h(`<div class="result panel kc-res">
          <div class="kc-verdict"><div class="kc-vzh">${ocName(o)}</div><div class="kc-vpy">${o.py}</div><div class="kc-ven">${ocLabel(o)}</div><p class="meaning"><span class="meaning-label">${L('Traditional meaning', '传统释义')}</span>${ocNote(o)}</p></div>
          <div class="kc-history">${blockCasts.slice(-12).map((c) => `<span class="kc-h ${c}" title="${ocLabel(OUTCOMES[c])}">${ocName(OUTCOMES[c])}</span>`).join('')}</div>
        </div>`);
        resultBox.innerHTML = '';
        resultBox.appendChild(panel);
      }

      function showStickResult(o) {
        const panel = h(`<div class="result panel kc-res">
          <h3>${L('Your Fortune Stick', '所求之签')}</h3>
          <div class="kc-slip">
            <div class="kc-slip-no">第${zhNum(stickNo)}${QIAN()}</div>
            <div class="kc-slip-ar">${L(`Stick № ${stickNo}`, `第 ${stickNo} 签`)}</div>
            <div class="kc-slip-conf">${ocName(o)} · ${L(`confirmed on ${attempts === 1 ? 'the first draw' : `draw ${attempts}`}`, attempts === 1 ? '首次即获确认' : `第 ${attempts} 次获确认`)}</div>
          </div>
          <p class="guide">${L(
            'A stick confirmed by holy blocks means the gods have agreed to answer, and this number is their reply. Its meaning lies in the verse that the temple’s set assigns to it — each set (Guanyin, Wong Tai Sin, Mazu and others) has its own hundred verses, usually graded from upper (上) through middle (中) to lower (下) fortune.',
            '经圣筊确认的签，表示神明愿意作答，此签号即是回应。其含义见于庙宇签谱中对应的签诗——观音灵签、黄大仙灵签、妈祖灵签等各有一百首，通常分上、中、下等签。')}</p>
          <p class="hint">${L(`Look up stick ${stickNo} in the set you follow.`, `请在你所依循的签谱中查阅第${zhNum(stickNo)}签。`)}</p>
        </div>`);
        panel.appendChild(UI.resultActions(() => L(`Kau Cim — Stick ${stickNo} (第${zhNum(stickNo)}籤), confirmed by ${o.zhT}`, `求签 — 第${zhNum(stickNo)}签，${o.zhS}确认`), () => { reset(); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
        resultBox.innerHTML = '';
        resultBox.appendChild(panel);
        App.record('kaucim', L(`Stick ${stickNo} · 第${zhNum(stickNo)}籤`, `第${zhNum(stickNo)}签`), L(`Confirmed with ${o.zhT} after ${attempts} draw${attempts > 1 ? 's' : ''}`, `经 ${attempts} 次摇签，${o.zhS}确认`));
        ctx.later(() => panel.scrollIntoView({ behavior: App.reduced ? 'auto' : 'smooth', block: 'nearest' }), 300);
      }

      reset();
    },
  });
})();
