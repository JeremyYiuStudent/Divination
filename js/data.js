/* Reference data for every oracle. Names and attributions only —
   interpretation is left to the person casting. */
window.DATA = (function () {
  'use strict';

  /* ----------------------------------------------------------- I Ching */
  // Keyed by line pattern bottom→top (1 = yang). `i` indexes kingWen.
  const trigrams = {
    '111': { i: 0, zh: '乾', py: 'Qián', image: 'Heaven', sym: '☰' },
    '100': { i: 1, zh: '震', py: 'Zhèn', image: 'Thunder', sym: '☳' },
    '010': { i: 2, zh: '坎', py: 'Kǎn', image: 'Water', sym: '☵' },
    '001': { i: 3, zh: '艮', py: 'Gèn', image: 'Mountain', sym: '☶' },
    '000': { i: 4, zh: '坤', py: 'Kūn', image: 'Earth', sym: '☷' },
    '011': { i: 5, zh: '巽', py: 'Xùn', image: 'Wind', sym: '☴' },
    '101': { i: 6, zh: '離', py: 'Lí', image: 'Fire', sym: '☲' },
    '110': { i: 7, zh: '兌', py: 'Duì', image: 'Lake', sym: '☱' },
  };

  // King Wen number by [lower trigram][upper trigram].
  const kingWen = [
    [1, 34, 5, 26, 11, 9, 14, 43],
    [25, 51, 3, 27, 24, 42, 21, 17],
    [6, 40, 29, 4, 7, 59, 64, 47],
    [33, 62, 39, 52, 15, 53, 56, 31],
    [12, 16, 8, 23, 2, 20, 35, 45],
    [44, 32, 48, 18, 46, 57, 50, 28],
    [13, 55, 63, 22, 36, 37, 30, 49],
    [10, 54, 60, 41, 19, 61, 38, 58],
  ];

  const hexagrams = [
    ['乾', 'Qián', 'The Creative'],
    ['坤', 'Kūn', 'The Receptive'],
    ['屯', 'Zhūn', 'Difficulty at the Beginning'],
    ['蒙', 'Méng', 'Youthful Folly'],
    ['需', 'Xū', 'Waiting'],
    ['訟', 'Sòng', 'Conflict'],
    ['師', 'Shī', 'The Army'],
    ['比', 'Bǐ', 'Holding Together'],
    ['小畜', 'Xiǎo Chù', 'The Taming Power of the Small'],
    ['履', 'Lǚ', 'Treading'],
    ['泰', 'Tài', 'Peace'],
    ['否', 'Pǐ', 'Standstill'],
    ['同人', 'Tóng Rén', 'Fellowship'],
    ['大有', 'Dà Yǒu', 'Possession in Great Measure'],
    ['謙', 'Qiān', 'Modesty'],
    ['豫', 'Yù', 'Enthusiasm'],
    ['隨', 'Suí', 'Following'],
    ['蠱', 'Gǔ', 'Work on What Has Been Spoiled'],
    ['臨', 'Lín', 'Approach'],
    ['觀', 'Guān', 'Contemplation'],
    ['噬嗑', 'Shì Kè', 'Biting Through'],
    ['賁', 'Bì', 'Grace'],
    ['剝', 'Bō', 'Splitting Apart'],
    ['復', 'Fù', 'Return'],
    ['無妄', 'Wú Wàng', 'Innocence'],
    ['大畜', 'Dà Chù', 'The Taming Power of the Great'],
    ['頤', 'Yí', 'Nourishment'],
    ['大過', 'Dà Guò', 'Preponderance of the Great'],
    ['坎', 'Kǎn', 'The Abysmal'],
    ['離', 'Lí', 'The Clinging'],
    ['咸', 'Xián', 'Influence'],
    ['恆', 'Héng', 'Duration'],
    ['遯', 'Dùn', 'Retreat'],
    ['大壯', 'Dà Zhuàng', 'The Power of the Great'],
    ['晉', 'Jìn', 'Progress'],
    ['明夷', 'Míng Yí', 'Darkening of the Light'],
    ['家人', 'Jiā Rén', 'The Family'],
    ['睽', 'Kuí', 'Opposition'],
    ['蹇', 'Jiǎn', 'Obstruction'],
    ['解', 'Xiè', 'Deliverance'],
    ['損', 'Sǔn', 'Decrease'],
    ['益', 'Yì', 'Increase'],
    ['夬', 'Guài', 'Breakthrough'],
    ['姤', 'Gòu', 'Coming to Meet'],
    ['萃', 'Cuì', 'Gathering Together'],
    ['升', 'Shēng', 'Pushing Upward'],
    ['困', 'Kùn', 'Oppression'],
    ['井', 'Jǐng', 'The Well'],
    ['革', 'Gé', 'Revolution'],
    ['鼎', 'Dǐng', 'The Cauldron'],
    ['震', 'Zhèn', 'The Arousing'],
    ['艮', 'Gèn', 'Keeping Still'],
    ['漸', 'Jiàn', 'Development'],
    ['歸妹', 'Guī Mèi', 'The Marrying Maiden'],
    ['豐', 'Fēng', 'Abundance'],
    ['旅', 'Lǚ', 'The Wanderer'],
    ['巽', 'Xùn', 'The Gentle'],
    ['兌', 'Duì', 'The Joyous'],
    ['渙', 'Huàn', 'Dispersion'],
    ['節', 'Jié', 'Limitation'],
    ['中孚', 'Zhōng Fú', 'Inner Truth'],
    ['小過', 'Xiǎo Guò', 'Preponderance of the Small'],
    ['既濟', 'Jì Jì', 'After Completion'],
    ['未濟', 'Wèi Jì', 'Before Completion'],
  ];

  /* ------------------------------------------------------------- Tarot */
  // [name, glyph, attribution, Hebrew letter, letter name] — Golden Dawn.
  const majors = [
    ['The Fool', '🜁', 'Air', 'א', 'Aleph'],
    ['The Magician', '☿', 'Mercury', 'ב', 'Beth'],
    ['The High Priestess', '☽', 'Moon', 'ג', 'Gimel'],
    ['The Empress', '♀', 'Venus', 'ד', 'Daleth'],
    ['The Emperor', '♈', 'Aries', 'ה', 'Heh'],
    ['The Hierophant', '♉', 'Taurus', 'ו', 'Vav'],
    ['The Lovers', '♊', 'Gemini', 'ז', 'Zayin'],
    ['The Chariot', '♋', 'Cancer', 'ח', 'Cheth'],
    ['Strength', '♌', 'Leo', 'ט', 'Teth'],
    ['The Hermit', '♍', 'Virgo', 'י', 'Yod'],
    ['Wheel of Fortune', '♃', 'Jupiter', 'כ', 'Kaph'],
    ['Justice', '♎', 'Libra', 'ל', 'Lamed'],
    ['The Hanged Man', '🜄', 'Water', 'מ', 'Mem'],
    ['Death', '♏', 'Scorpio', 'נ', 'Nun'],
    ['Temperance', '♐', 'Sagittarius', 'ס', 'Samekh'],
    ['The Devil', '♑', 'Capricorn', 'ע', 'Ayin'],
    ['The Tower', '♂', 'Mars', 'פ', 'Peh'],
    ['The Star', '♒', 'Aquarius', 'צ', 'Tzaddi'],
    ['The Moon', '♓', 'Pisces', 'ק', 'Qoph'],
    ['The Sun', '☉', 'Sun', 'ר', 'Resh'],
    ['Judgement', '🜂', 'Fire', 'ש', 'Shin'],
    ['The World', '♄', 'Saturn', 'ת', 'Tav'],
  ];
  const suits = [
    { id: 'wands', name: 'Wands', el: 'Fire', color: '#b85a26' },
    { id: 'cups', name: 'Cups', el: 'Water', color: '#2f68a0' },
    { id: 'swords', name: 'Swords', el: 'Air', color: '#56687d' },
    { id: 'pentacles', name: 'Pentacles', el: 'Earth', color: '#9c7a1c' },
  ];
  const ranks = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'];

  /* ------------------------------------------------------------- Runes */
  // [glyph, name, sound, name meaning, can be merkstave]
  const runes = [
    ['ᚠ', 'Fehu', 'f', 'cattle; wealth', true],
    ['ᚢ', 'Uruz', 'u', 'aurochs', true],
    ['ᚦ', 'Thurisaz', 'th', 'giant; thorn', true],
    ['ᚨ', 'Ansuz', 'a', 'a god of the Æsir', true],
    ['ᚱ', 'Raidho', 'r', 'riding; journey', true],
    ['ᚲ', 'Kenaz', 'k', 'torch', true],
    ['ᚷ', 'Gebo', 'g', 'gift', false],
    ['ᚹ', 'Wunjo', 'w', 'joy', true],
    ['ᚺ', 'Hagalaz', 'h', 'hail', false],
    ['ᚾ', 'Naudhiz', 'n', 'need', false],
    ['ᛁ', 'Isa', 'i', 'ice', false],
    ['ᛃ', 'Jera', 'j', 'year; harvest', false],
    ['ᛇ', 'Eihwaz', 'ï', 'yew', false],
    ['ᛈ', 'Perthro', 'p', 'lot-cup (meaning uncertain)', true],
    ['ᛉ', 'Algiz', 'z', 'elk; protection', true],
    ['ᛊ', 'Sowilo', 's', 'sun', false],
    ['ᛏ', 'Tiwaz', 't', 'the god Týr', true],
    ['ᛒ', 'Berkano', 'b', 'birch', true],
    ['ᛖ', 'Ehwaz', 'e', 'horse', true],
    ['ᛗ', 'Mannaz', 'm', 'man; humankind', true],
    ['ᛚ', 'Laguz', 'l', 'water; lake', true],
    ['ᛜ', 'Ingwaz', 'ng', 'the god Ing', false],
    ['ᛟ', 'Othala', 'o', 'inheritance; homeland', true],
    ['ᛞ', 'Dagaz', 'd', 'day', false],
  ].map(([glyph, name, sound, meaning, rev], i) => ({
    glyph, name, sound, meaning, rev, i,
    aett: ['Freyr’s Ætt', 'Hagal’s Ætt', 'Týr’s Ætt'][Math.floor(i / 8)],
  }));

  /* ------------------------------------------------------------- Ogham */
  // [glyph, name, letter, tree / meaning, aicme]
  const ogham = [
    ['ᚁ', 'Beith', 'B', 'birch', 'Aicme Beithe'],
    ['ᚂ', 'Luis', 'L', 'rowan', 'Aicme Beithe'],
    ['ᚃ', 'Fearn', 'F', 'alder', 'Aicme Beithe'],
    ['ᚄ', 'Sail', 'S', 'willow', 'Aicme Beithe'],
    ['ᚅ', 'Nion', 'N', 'ash', 'Aicme Beithe'],
    ['ᚆ', 'Uath', 'H', 'hawthorn', 'Aicme hÚatha'],
    ['ᚇ', 'Dair', 'D', 'oak', 'Aicme hÚatha'],
    ['ᚈ', 'Tinne', 'T', 'holly', 'Aicme hÚatha'],
    ['ᚉ', 'Coll', 'C', 'hazel', 'Aicme hÚatha'],
    ['ᚊ', 'Ceirt', 'Q', 'apple', 'Aicme hÚatha'],
    ['ᚋ', 'Muin', 'M', 'vine', 'Aicme Muine'],
    ['ᚌ', 'Gort', 'G', 'ivy', 'Aicme Muine'],
    ['ᚍ', 'nGéadal', 'NG', 'broom; reed', 'Aicme Muine'],
    ['ᚎ', 'Straif', 'Z', 'blackthorn', 'Aicme Muine'],
    ['ᚏ', 'Ruis', 'R', 'elder', 'Aicme Muine'],
    ['ᚐ', 'Ailm', 'A', 'pine; fir', 'Aicme Ailme'],
    ['ᚑ', 'Onn', 'O', 'gorse', 'Aicme Ailme'],
    ['ᚒ', 'Úr', 'U', 'heather', 'Aicme Ailme'],
    ['ᚓ', 'Eadhadh', 'E', 'aspen', 'Aicme Ailme'],
    ['ᚔ', 'Iodhadh', 'I', 'yew', 'Aicme Ailme'],
    ['ᚕ', 'Éabhadh', 'EA', 'grove; aspen', 'Forfeda'],
    ['ᚖ', 'Ór', 'OI', 'gold; spindle', 'Forfeda'],
    ['ᚗ', 'Uilleann', 'UI', 'honeysuckle', 'Forfeda'],
    ['ᚘ', 'Ifín', 'IA', 'gooseberry; pine', 'Forfeda'],
    ['ᚙ', 'Eamhancholl', 'AE', 'witch hazel', 'Forfeda'],
  ].map(([glyph, name, letter, tree, aicme], i) => ({ glyph, name, letter, tree, aicme, i, forfeda: i >= 20 }));

  /* ---------------------------------------------------------- Geomancy */
  // Key = rows head→feet, 1 = single point (odd), 2 = double (even).
  const geomancy = {
    '1111': { name: 'Via', eng: 'The Way', planet: 'Moon' },
    '2222': { name: 'Populus', eng: 'The People', planet: 'Moon' },
    '2112': { name: 'Conjunctio', eng: 'Conjunction', planet: 'Mercury' },
    '1221': { name: 'Carcer', eng: 'The Prison', planet: 'Saturn' },
    '2211': { name: 'Fortuna Major', eng: 'Greater Fortune', planet: 'Sun' },
    '1122': { name: 'Fortuna Minor', eng: 'Lesser Fortune', planet: 'Sun' },
    '2121': { name: 'Acquisitio', eng: 'Gain', planet: 'Jupiter' },
    '1212': { name: 'Amissio', eng: 'Loss', planet: 'Venus' },
    '1222': { name: 'Laetitia', eng: 'Joy', planet: 'Jupiter' },
    '2221': { name: 'Tristitia', eng: 'Sorrow', planet: 'Saturn' },
    '1211': { name: 'Puella', eng: 'The Girl', planet: 'Venus' },
    '1121': { name: 'Puer', eng: 'The Boy', planet: 'Mars' },
    '2122': { name: 'Rubeus', eng: 'Red', planet: 'Mars' },
    '2212': { name: 'Albus', eng: 'White', planet: 'Mercury' },
    '2111': { name: 'Caput Draconis', eng: 'Head of the Dragon', planet: 'North Node' },
    '1112': { name: 'Cauda Draconis', eng: 'Tail of the Dragon', planet: 'South Node' },
  };

  return { trigrams, kingWen, hexagrams, tarot: { majors, suits, ranks }, runes, ogham, geomancy };
})();

/* Simplified Chinese names, layered onto the reference data above. */
(function (D) {
  'use strict';
  const tri = { '111': ['乾', '天'], '100': ['震', '雷'], '010': ['坎', '水'], '001': ['艮', '山'], '000': ['坤', '地'], '011': ['巽', '风'], '101': ['离', '火'], '110': ['兑', '泽'] };
  Object.keys(tri).forEach((k) => { D.trigrams[k].zhS = tri[k][0]; D.trigrams[k].imageZh = tri[k][1]; });

  D.hexZhS = ['乾', '坤', '屯', '蒙', '需', '讼', '师', '比', '小畜', '履', '泰', '否', '同人', '大有', '谦', '豫',
    '随', '蛊', '临', '观', '噬嗑', '贲', '剥', '复', '无妄', '大畜', '颐', '大过', '坎', '离', '咸', '恒',
    '遁', '大壮', '晋', '明夷', '家人', '睽', '蹇', '解', '损', '益', '夬', '姤', '萃', '升', '困', '井',
    '革', '鼎', '震', '艮', '渐', '归妹', '丰', '旅', '巽', '兑', '涣', '节', '中孚', '小过', '既济', '未济'];

  const majorsZh = [
    ['愚人', '风元素'], ['魔术师', '水星'], ['女祭司', '月亮'], ['皇后', '金星'], ['皇帝', '白羊座'], ['教皇', '金牛座'],
    ['恋人', '双子座'], ['战车', '巨蟹座'], ['力量', '狮子座'], ['隐士', '处女座'], ['命运之轮', '木星'], ['正义', '天秤座'],
    ['倒吊人', '水元素'], ['死神', '天蝎座'], ['节制', '射手座'], ['恶魔', '摩羯座'], ['高塔', '火星'], ['星星', '水瓶座'],
    ['月亮', '双鱼座'], ['太阳', '太阳'], ['审判', '火元素'], ['世界', '土星'],
  ];
  D.tarot.majorsZh = majorsZh;
  const suitZh = { wands: ['权杖', '火'], cups: ['圣杯', '水'], swords: ['宝剑', '风'], pentacles: ['星币', '土'] };
  D.tarot.suits.forEach((s) => { s.zh = suitZh[s.id][0]; s.elZh = suitZh[s.id][1]; });
  D.tarot.ranksZh = ['王牌', '二', '三', '四', '五', '六', '七', '八', '九', '十', '侍从', '骑士', '王后', '国王'];

  const runeZh = ['牲畜；财富', '原牛', '巨人；荆棘', '阿萨神族之神', '骑行；旅程', '火炬', '礼物', '喜悦', '冰雹', '需要', '冰', '年；收成',
    '紫杉', '签杯（含义不明）', '驼鹿；守护', '太阳', '提尔神', '桦树', '马', '人；人类', '水；湖', '英格神', '遗产；故土', '白昼'];
  D.runes.forEach((r, i) => { r.meaningZh = runeZh[i]; r.aettZh = ['弗雷之族', '哈格尔之族', '提尔之族'][Math.floor(i / 8)]; });

  const treeZh = ['桦树', '花楸', '桤木', '柳树', '白蜡树', '山楂', '橡树', '冬青', '榛树', '苹果树', '葡萄藤', '常春藤', '金雀花；芦苇',
    '黑刺李', '接骨木', '松；冷杉', '荆豆', '石楠', '白杨', '紫杉', '林地；白杨', '黄金；卫矛', '忍冬', '醋栗；松', '金缕梅'];
  const aicmeZh = { 'Aicme Beithe': '桦之组', 'Aicme hÚatha': '山楂之组', 'Aicme Muine': '藤之组', 'Aicme Ailme': '松之组', 'Forfeda': '附加字母' };
  D.ogham.forEach((f, i) => { f.treeZh = treeZh[i]; f.aicmeZh = aicmeZh[f.aicme]; });

  const geoZh = {
    Via: '道路', Populus: '众人', Conjunctio: '结合', Carcer: '牢狱', 'Fortuna Major': '大吉', 'Fortuna Minor': '小吉',
    Acquisitio: '获得', Amissio: '失去', Laetitia: '喜悦', Tristitia: '悲伤', Puella: '少女', Puer: '少年',
    Rubeus: '赤', Albus: '白', 'Caput Draconis': '龙首', 'Cauda Draconis': '龙尾',
  };
  const planetZh = { Moon: '月亮', Mercury: '水星', Saturn: '土星', Sun: '太阳', Jupiter: '木星', Venus: '金星', Mars: '火星', 'North Node': '北交点', 'South Node': '南交点' };
  Object.values(D.geomancy).forEach((f) => { f.zh = geoZh[f.name]; f.planetZh = planetZh[f.planet]; });
})(window.DATA);
