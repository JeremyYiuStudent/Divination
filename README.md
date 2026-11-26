# Divination

A visual, animation-heavy collection of traditional divination methods. Each oracle follows the
traditional procedure, draws its randomness from `crypto.getRandomValues`, and shows each result with
its general traditional meaning. Applying that meaning is left to you.

The interface is in **English and Simplified Chinese** (the 中文 / EN button in the top bar; the first
visit follows the browser language). It is built for desktop and phones in portrait.

On phones the app is a single screen that never scrolls. Swipe through the oracles on the home screen
and tap one to begin. Each ritual is scaled to fit the space between the header and the buttons. When
it finishes, the reading opens as a full-screen sheet over the header, with swipeable pages (one per
card, rune, stave, hexagram or group of figures). The ⌄ button lowers the sheet to show the table again.

Live at **<https://jeremyyiu.org/divination/>** (deployed as a submodule of
[JeremyYiuResume](https://github.com/JeremyYiuStudent/JeremyYiuResume)).

## Run it

No build step and no dependencies.

- Open `index.html` directly in a browser, **or**
- `node serve.js`, then visit <http://localhost:5173>

## The oracles

| Oracle | Method |
| --- | --- |
| **I Ching** 易經 | *Three coins* (inscribed side 2, plain side 3, six tosses) or the *yarrow stalks*: 49 stalks divided, one set apart, counted off by fours, three changes per line. Shows the primary hexagram, changing lines, and the relating hexagram. |
| **Tarot** | Full 78-card deck (or Major Arcana only), riffle-shuffled, with optional reversals. Spread the deck and choose cards from the fan (or deal from the top). Single card, Past/Present/Future, or Celtic Cross. Card faces are the Rider–Waite–Smith deck (1909, Pamela Colman Smith, public domain) loaded from Wikimedia Commons, with a drawn fallback face for when you are offline. |
| **Runes** | Elder Futhark, 24 staves. Odin’s rune or the three Norns drawn blind from the pouch, or all 24 cast on the cloth and three chosen face down. Optional merkstave for the runes that can be reversed. |
| **Ogham** | The 20 feda (optionally the 5 forfeda), drawn blind from a bound bundle of staves. |
| **Geomancy** | Sixteen lines of points, struck by a falling stylus or tapped by hand, counted off in pairs into the four Mothers. These unfold into the full shield chart: Daughters, Nieces, Witnesses, Judge, and Reconciler. |
| **Kau Cim** 求籤 | Hold to shake the cylinder of 100 sticks until one falls (two at once means you shake again), then confirm it with the moon blocks (聖筊 holy / 笑筊 laughing / 陰筊 yin). The moon blocks can also be cast on their own. |

Meanings live in `js/meanings.js`: one line per hexagram, upright and reversed for each tarot card, upright and merkstave for each rune, and one line each for the ogham letters and geomantic figures. Kau Cim stick numbers have no universal meaning, because each temple set has its own verses, so only the moon-block outcomes carry meanings.

Every result is saved to the **Journal** (kept in this browser's local storage only) and can be copied
as text. The ☾/♪ buttons in the top bar open the journal and toggle the synthesized sound effects.

## Deploying changes

The site sits behind Cloudflare, which tells browsers to cache CSS and JS for four hours. Every
stylesheet and script in `index.html` therefore carries a `?v=N` version. **Bump N with every change
to a CSS or JS file**, or returning visitors keep the old files. `index.html` itself is never cached.

## Structure

```
index.html            shell, fonts, script order
css/main.css          theme, layout, shared controls
css/<oracle>.css      per-oracle styling and animation
js/core.js            RNG, Web Audio sound, router, starfield, journal, UI helpers
js/data.js            hexagrams, trigrams, tarot, runes, ogham, geomantic figures (+ Chinese names)
js/meanings.js        generic meanings for every result, English and Chinese
js/oracles/*.js       one self-registering module per oracle
serve.js              optional zero-dependency static server
```

To add an oracle, create `js/oracles/<name>.js` that calls `Div.App.register({ id, name, native, hue,
subtitle, blurb, art, mount(root, ctx) })`. Text fields take `{ en, zh }` pairs; inside `mount`, use
`Div.L(en, zh)` for strings, then add its script and stylesheet to `index.html`.
`ctx.wait` / `ctx.anim` stop resolving once the view is left, so ritual sequences can't leak.
For phones, give the ritual's container the `stagebox` class and call `ctx.fit(el, [w, h])`. The
container then gets a `--k` scale for a drawing designed at w × h px. Hand the finished reading to
`Div.UI.reading({ title, pages, getText, onAgain })`, which shows it as a panel on desktop and as a
swipeable sheet on phones.
