/* Lantern Heir — game data. Original names, bestiary, and places. */
(function (root) {
  const LH = root.LH = root.LH || {};

  LH.VERSION = '1.0.0';
  LH.TITLE = 'LANTERN HEIR';

  LH.BALANCE = {
    stepMs: 1150,
    textCps: 14,
    msgHold: 0.85,
    animMs: 320,
    fadeMs: 280,
    encMinSteps: 4,
    fastXp: 3,
    fastGold: 2.5,
    levelCap: 40,
    poisonEvery: 4,
    roadEnc: 0.007,
    /* Thorough-path encounter rates used by maps (estimator reads these). */
    dungeonEnc: 0.04,
    wildEnc: {
      grass: 0.042,
      forest: 0.05,
      swamp: 0.048,
      sand: 0.04,
      snow: 0.044,
      flower: 0.03,
      crack: 0.06,
      road: 0.007
    }
  };

  const T = LH.T = {
    NONE: 0,
    GRASS: 1,
    FOREST: 2,
    MOUNTAIN: 3,
    WATER: 4,
    SAND: 5,
    SWAMP: 6,
    SNOW: 7,
    ROAD: 8,
    WALL: 9,
    ROOF: 10,
    DOOR: 11,
    TREE: 12,
    FLOOR: 13,
    WOOD: 14,
    CARPET: 15,
    STONE: 16,
    CLIFF: 17,
    THORN: 18,
    WHITEOUT: 19,
    STORM: 20,
    DUSK: 21,
    SLIDE: 22,
    BRIDGE: 23,
    NIGHT: 24,
    CAVE: 25,
    CRACK: 26,
    FLOWER: 27,
    LAVA: 28
  };

  /* gate(state) => true if the tile can be walked. */
  LH.TERRAIN = [];
  function terr(id, o) { LH.TERRAIN[id] = o; }
  const W = LH.BALANCE.wildEnc;
  terr(T.NONE, { solid: true, enc: 0 });
  terr(T.GRASS, { enc: W.grass });
  terr(T.FOREST, { enc: W.forest });
  terr(T.MOUNTAIN, { solid: true, enc: 0 });
  terr(T.WATER, { solid: true, enc: 0 });
  terr(T.SAND, { enc: W.sand });
  terr(T.SWAMP, { enc: W.swamp });
  terr(T.SNOW, { enc: W.snow });
  terr(T.ROAD, { enc: W.road });
  terr(T.WALL, { solid: true });
  terr(T.ROOF, { solid: true });
  terr(T.DOOR, { enc: 0 });
  terr(T.TREE, { solid: true });
  terr(T.FLOOR, { enc: 0 });
  terr(T.WOOD, { enc: 0 });
  terr(T.CARPET, { enc: 0 });
  terr(T.STONE, { enc: 0 });
  terr(T.CLIFF, { gate: s => !!s.flags.hooks });
  terr(T.THORN, { gate: s => (s.items.shears || 0) > 0 || s.weapon === 'shears' || s.accessory === 'shears' });
  terr(T.WHITEOUT, { gate: s => !!s.flags.cloak });
  terr(T.STORM, { gate: s => !!s.flags.lens });
  terr(T.DUSK, { gate: s => s.flags.lampDew === 'set' });
  terr(T.SLIDE, { gate: s => s.flags.lampStone === 'set' });
  terr(T.BRIDGE, { gate: s => !!s.flags.bridgeFixed });
  terr(T.NIGHT, { gate: s => !!s.flags.nightPass });
  terr(T.CAVE, { enc: 0 });
  terr(T.CRACK, { enc: W.crack });
  terr(T.FLOWER, { enc: W.flower });
  terr(T.LAVA, { solid: true });

  LH.passable = function (terrain, state) {
    const t = LH.TERRAIN[terrain];
    if (!t) return false;
    if (t.gate) return !!(state && t.gate(state));
    return !t.solid;
  };

  LH.xpToNext = function (level) {
    /* 1.15 keeps a full clear, including side dungeons, near level 40. */
    return Math.round((12 * Math.pow(level, 1.72) + 4 * level) * 1.15);
  };

  LH.growth = function (level) {
    let hp = 22, mp = 0, atk = 6, def = 4, agi = 6, wis = 4;
    for (let L = 2; L <= level; L++) {
      hp += 5 + Math.floor(L / 5);
      if (L >= 3) mp += 3 + (L % 6 === 0 ? 2 : 0);
      atk += 1 + (L % 4 === 0 ? 1 : 0);
      def += 1 + (L % 5 === 0 ? 1 : 0);
      agi += 1;
      wis += 1 + (L % 5 === 0 ? 1 : 0);
    }
    return { hp, mp, atk, def, agi, wis };
  };

  function item(o) { return o; }
  const ITEMS = LH.ITEMS = {};
  function addItem(o) { ITEMS[o.id] = o; }

  /* Weapons */
  addItem(item({ id: 'stick', name: 'WALKING STICK', slot: 'weapon', atk: 4, price: 0 }));
  addItem(item({ id: 'shortblade', name: 'SHORTBLADE', slot: 'weapon', atk: 12, price: 70 }));
  addItem(item({ id: 'ironedge', name: 'IRON EDGE', slot: 'weapon', atk: 22, price: 220 }));
  addItem(item({ id: 'broadsword', name: 'BROADSWORD', slot: 'weapon', atk: 34, price: 560 }));
  addItem(item({ id: 'cliffcleaver', name: 'CLIFF CLEAVER', slot: 'weapon', atk: 48, price: 1300 }));
  addItem(item({ id: 'tidesaber', name: 'TIDE SABER', slot: 'weapon', atk: 62, price: 2500 }));
  addItem(item({ id: 'glasscia', name: 'GLASS SCIMITAR', slot: 'weapon', atk: 78, price: 4600 }));
  addItem(item({ id: 'frostbrand', name: 'FROST BRAND', slot: 'weapon', atk: 94, price: 8200 }));
  addItem(item({ id: 'thornpike', name: 'THORNPIKE', slot: 'weapon', atk: 110, price: 12000 }));
  addItem(item({ id: 'dawnbrand', name: 'DAWNBRAND', slot: 'weapon', atk: 132, price: 0, unique: true }));

  /* Armor */
  addItem(item({ id: 'cloth', name: 'CLOTH TUNIC', slot: 'armor', def: 2, price: 0 }));
  addItem(item({ id: 'leather', name: 'LEATHER COAT', slot: 'armor', def: 8, price: 50 }));
  addItem(item({ id: 'chainshirt', name: 'CHAIN SHIRT', slot: 'armor', def: 16, price: 200 }));
  addItem(item({ id: 'scalemail', name: 'SCALE MAIL', slot: 'armor', def: 26, price: 520 }));
  addItem(item({ id: 'ridgeplate', name: 'RIDGE PLATE', slot: 'armor', def: 38, price: 1200 }));
  addItem(item({ id: 'tidemail', name: 'TIDE MAIL', slot: 'armor', def: 50, price: 2400 }));
  addItem(item({ id: 'embercoat', name: 'EMBER COAT', slot: 'armor', def: 64, price: 4400 }));
  addItem(item({ id: 'frostplate', name: 'FROST PLATE', slot: 'armor', def: 78, price: 7800 }));
  addItem(item({ id: 'thornmail', name: 'THORNMAIL', slot: 'armor', def: 92, price: 11500 }));
  addItem(item({ id: 'dawnplate', name: 'DAWN PLATE', slot: 'armor', def: 110, price: 0, unique: true }));

  /* Shields */
  addItem(item({ id: 'potlid', name: 'POT LID', slot: 'shield', def: 3, price: 30 }));
  addItem(item({ id: 'woodshield', name: 'WOOD SHIELD', slot: 'shield', def: 8, price: 110 }));
  addItem(item({ id: 'ironshield', name: 'IRON SHIELD', slot: 'shield', def: 15, price: 340 }));
  addItem(item({ id: 'crestshield', name: 'CREST SHIELD', slot: 'shield', def: 24, price: 900 }));
  addItem(item({ id: 'mirrorshield', name: 'MIRROR SHIELD', slot: 'shield', def: 34, price: 2000 }));
  addItem(item({ id: 'frostward', name: 'FROST WARD', slot: 'shield', def: 44, price: 4200 }));
  addItem(item({ id: 'sunaegis', name: 'SUN AEGIS', slot: 'shield', def: 56, price: 7600 }));

  /* Accessories */
  addItem(item({ id: 'luckcharm', name: 'LUCK CHARM', slot: 'accessory', luck: 10, price: 0, unique: true }));
  addItem(item({ id: 'wisering', name: 'WISE RING', slot: 'accessory', wis: 8, price: 1800 }));
  addItem(item({ id: 'swiftboots', name: 'SWIFT BOOTS', slot: 'accessory', agi: 8, price: 1800 }));
  addItem(item({ id: 'heartlocket', name: 'HEART LOCKET', slot: 'accessory', hp: 30, price: 2800 }));
  addItem(item({ id: 'manapendant', name: 'MANA PENDANT', slot: 'accessory', mp: 18, price: 2800 }));
  addItem(item({ id: 'marshband', name: 'MARSH BAND', slot: 'accessory', def: 6, price: 0, unique: true }));
  addItem(item({ id: 'minershelm', name: 'MINER HELM', slot: 'accessory', def: 4, hp: 16, price: 0, unique: true }));
  addItem(item({ id: 'warmcloak', name: 'WARMCLOAK', slot: 'accessory', def: 10, price: 0, unique: true }));
  addItem(item({ id: 'heirrimg', name: 'HEIR RING', slot: 'accessory', atk: 8, def: 8, wis: 6, hp: 20, price: 0, unique: true }));

  /* Consumables */
  addItem(item({ id: 'mendleaf', name: 'MENDLEAF', slot: 'use', price: 8, heal: 32 }));
  addItem(item({ id: 'strongbalm', name: 'STRONGBALM', slot: 'use', price: 48, heal: 100 }));
  addItem(item({ id: 'fullbalm', name: 'FULLBALM', slot: 'use', price: 240, heal: 9999 }));
  addItem(item({ id: 'manadrop', name: 'MANA DROP', slot: 'use', price: 36, mp: 14 }));
  addItem(item({ id: 'manavial', name: 'MANA VIAL', slot: 'use', price: 140, mp: 45 }));
  addItem(item({ id: 'clearroot', name: 'CLEARROOT', slot: 'use', price: 12, cure: 'poison' }));
  addItem(item({ id: 'torch', name: 'TORCH', slot: 'use', price: 18, light: true }));
  addItem(item({ id: 'veilpowder', name: 'VEIL POWDER', slot: 'use', price: 60, flee: true }));
  addItem(item({ id: 'wakepowder', name: 'WAKE POWDER', slot: 'use', price: 24, cure: 'sleep' }));

  /* Quest goods (not equipment) */
  addItem(item({ id: 'nails', name: 'IRON NAILS', slot: 'quest', price: 90 }));
  addItem(item({ id: 'shears', name: 'IRON SHEARS', slot: 'quest', price: 5400 }));
  addItem(item({ id: 'locket', name: 'BRASS LOCKET', slot: 'quest', price: 0, unique: true }));
  addItem(item({ id: 'lily', name: 'MARSH LILY', slot: 'quest', price: 0 }));
  addItem(item({ id: 'pelt', name: 'FROST PELT', slot: 'quest', price: 0 }));
  addItem(item({ id: 'shard', name: 'EMBER SHARD', slot: 'quest', price: 0 }));
  addItem(item({ id: 'glass', name: 'BEETLE GLASS', slot: 'quest', price: 0 }));
  addItem(item({ id: 'songcrystal', name: 'SONG CRYSTAL', slot: 'quest', price: 0, unique: true }));

  LH.SHOPS = {
    keep: { name: 'CHAPEL STORES', items: ['mendleaf', 'clearroot', 'torch'] },
    mill: { name: "MIRA'S WARES", items: ['shortblade', 'leather', 'potlid', 'mendleaf', 'clearroot', 'torch'] },
    reed: { name: 'REED MARKET', items: ['ironedge', 'chainshirt', 'woodshield', 'mendleaf', 'strongbalm', 'clearroot', 'torch'] },
    fair: { name: 'FAIRHOLLOW GOODS', items: ['broadsword', 'scalemail', 'ironshield', 'nails', 'strongbalm', 'manadrop', 'veilpowder', 'wakepowder'] },
    stone: { name: 'STONE HEARTH', items: ['cliffcleaver', 'ridgeplate', 'crestshield', 'strongbalm', 'manadrop', 'torch'] },
    salt: { name: 'SALTWHARF', items: ['tidesaber', 'tidemail', 'mirrorshield', 'strongbalm', 'manavial', 'veilpowder'] },
    ash: { name: 'ASHMARKET', items: ['glasscia', 'embercoat', 'fullbalm', 'manavial', 'clearroot'] },
    white: { name: 'WHITE HEARTH', items: ['frostbrand', 'frostplate', 'frostward', 'fullbalm', 'manavial'] },
    thorn: { name: 'THORNREST', items: ['thornpike', 'thornmail', 'swiftboots', 'wisering', 'fullbalm'] },
    vigil: { name: 'VIGIL SUPPLY', items: ['shears', 'sunaegis', 'heartlocket', 'manapendant', 'fullbalm', 'manavial', 'veilpowder'] }
  };

  LH.SPELLS = [
    { id: 'spark', name: 'EMBER SPARK', lv: 3, mp: 2, kind: 'dmg', elem: 'fire', power: 18 },
    { id: 'mend', name: 'MEND', lv: 4, mp: 3, kind: 'heal', power: 30, field: true },
    { id: 'cleanse', name: 'CLEANSE', lv: 6, mp: 2, kind: 'cure', field: true },
    { id: 'ward', name: 'WARD', lv: 8, mp: 4, kind: 'ward', turns: 4 },
    { id: 'frost', name: 'FROST NEEDLE', lv: 10, mp: 5, kind: 'dmg', elem: 'ice', power: 34 },
    { id: 'doze', name: 'DOZE', lv: 12, mp: 4, kind: 'sleep', hit: 0.62 },
    { id: 'lantern', name: 'LANTERN', lv: 13, mp: 2, kind: 'light', field: true },
    { id: 'waygate', name: 'WAYGATE', lv: 15, mp: 8, kind: 'waygate', field: true },
    { id: 'gust', name: 'GUST', lv: 16, mp: 7, kind: 'dmg', elem: 'wind', power: 52 },
    { id: 'mend2', name: 'MEND II', lv: 18, mp: 8, kind: 'heal', power: 85, field: true },
    { id: 'kindle', name: 'KINDLE STEP', lv: 20, mp: 5, kind: 'haste', turns: 4 },
    { id: 'bolt', name: 'ARC BOLT', lv: 22, mp: 10, kind: 'dmg', elem: 'bolt', power: 74 },
    { id: 'mend3', name: 'MEND III', lv: 25, mp: 14, kind: 'heal', power: 180, field: true },
    { id: 'blaze', name: 'BLAZE', lv: 27, mp: 15, kind: 'dmg', elem: 'fire', power: 108 },
    { id: 'still', name: 'STILLNESS', lv: 30, mp: 10, kind: 'stop', hit: 0.55 },
    { id: 'renew', name: 'RENEW', lv: 33, mp: 22, kind: 'heal', power: 9999, field: true },
    { id: 'dawn', name: 'DAWNBURST', lv: 36, mp: 20, kind: 'dmg', elem: 'radiant', power: 140 }
  ];
  LH.spellById = {};
  LH.SPELLS.forEach(s => { LH.spellById[s.id] = s; });

  /* Enemy-only techniques. */
  LH.ENEMY_SPELLS = {
    venom: { name: 'VENOM BITE', power: 6, elem: 'poison', poison: 0.7 },
    spit: { name: 'ICE SPIT', power: 16, elem: 'ice' },
    cinder: { name: 'CINDER POP', power: 18, elem: 'fire' },
    brine: { name: 'BRINE LASH', power: 22, elem: 'water' },
    gloom: { name: 'GLOOM SIGH', power: 14, elem: 'dark', sleep: 0.35 },
    quake: { name: 'STONE QUAKE', power: 26, elem: 'earth' },
    rime: { name: 'RIME', power: 30, elem: 'ice' },
    pyre: { name: 'PYRE', power: 34, elem: 'fire' },
    dirge: { name: 'DIRGE', power: 28, elem: 'dark' },
    unmake: { name: 'UNMAKE', power: 42, elem: 'dark' }
  };

  function mon(id, name, lv, kind, hue, hp, atk, def, agi, res, xp, gold, extra) {
    const m = { id, name, lv, kind, hue, hp, atk, def, agi, res, xp, gold };
    if (extra) Object.assign(m, extra);
    return m;
  }

  const MON = [
    mon('puddlekin', 'PUDDLEKIN', 1, 'blob', 200, 8, 7, 2, 3, 1, 5, 4),
    mon('dustnib', 'DUSTNIB', 2, 'bat', 30, 7, 8, 1, 8, 1, 6, 5),
    mon('fieldvole', 'FIELDVOLE', 2, 'beast', 25, 11, 8, 3, 6, 1, 6, 5),
    mon('thornpup', 'THORNPUP', 3, 'beast', 90, 13, 10, 3, 5, 2, 7, 6),
    mon('sproutling', 'SPROUTLING', 3, 'plant', 110, 12, 7, 4, 2, 2, 6, 4, { poison: 0.2, family: 'plant' }),

    mon('mireling', 'MIRELING', 6, 'blob', 130, 22, 16, 6, 5, 3, 14, 12, { poison: 0.25 }),
    mon('bogcroak', 'BOGCROAK', 7, 'beast', 100, 26, 18, 7, 7, 3, 16, 13),
    mon('reedlurker', 'REEDLURKER', 7, 'plant', 140, 30, 17, 10, 4, 4, 17, 14, { family: 'plant' }),
    mon('mothbane', 'MOTHBANE', 8, 'insect', 280, 20, 20, 5, 12, 3, 16, 12, { sleep: 0.18 }),
    mon('mudguard', 'MUDGUARD', 9, 'armor', 40, 36, 19, 14, 3, 5, 20, 16),

    mon('hedgebandit', 'HEDGE BANDIT', 11, 'human', 20, 34, 24, 10, 10, 4, 26, 22),
    mon('copperant', 'COPPERANT', 11, 'insect', 35, 28, 22, 12, 8, 5, 24, 18),
    mon('strayhound', 'STRAY HOUND', 12, 'beast', 15, 32, 26, 9, 12, 4, 27, 20),
    mon('sunmoth', 'SUNMOTH', 12, 'insect', 50, 24, 21, 6, 14, 3, 23, 18, { sleep: 0.2 }),
    mon('scaremask', 'SCAREMASK', 13, 'undead', 270, 40, 25, 12, 6, 6, 30, 22, { family: 'undead' }),

    mon('pewhaunt', 'PEW HAUNT', 13, 'undead', 260, 44, 30, 12, 8, 6, 34, 24, { family: 'undead' }),
    mon('chorister', 'DROWNED VOICE', 14, 'undead', 220, 48, 28, 16, 5, 8, 38, 26, { family: 'undead', spells: [{ id: 'gloom', p: 0.3 }] }),

    mon('gravelimp', 'GRAVEL IMP', 15, 'human', 10, 50, 34, 16, 9, 6, 42, 32),
    mon('craghorn', 'CRAGHORN', 16, 'beast', 0, 58, 38, 18, 7, 7, 48, 36),
    mon('cavewick', 'CAVEWICK', 16, 'wisp', 45, 36, 32, 10, 14, 5, 40, 30, { family: 'wisp' }),
    mon('tombward', 'TOMB WARD', 17, 'armor', 210, 68, 36, 24, 4, 10, 54, 40, { family: 'undead' }),
    mon('ledgecrawler', 'LEDGE CRAWLER', 17, 'insect', 80, 46, 40, 14, 11, 6, 46, 34),

    mon('tidenipper', 'TIDE NIPPER', 19, 'crab', 190, 62, 44, 18, 10, 8, 60, 46),
    mon('gullraider', 'GULL RAIDER', 19, 'bird', 200, 52, 48, 14, 16, 6, 58, 48),
    mon('brinejelly', 'BRINE JELLY', 20, 'blob', 175, 74, 42, 20, 6, 8, 64, 42, { poison: 0.3 }),
    mon('wreckghost', 'WRECK GHOST', 21, 'undead', 250, 66, 50, 16, 12, 8, 70, 50, { family: 'undead' }),
    mon('coralbrute', 'CORAL BRUTE', 21, 'beast', 340, 84, 52, 22, 5, 10, 76, 54),

    mon('dunescuttler', 'DUNE SCUTTLER', 23, 'insect', 40, 82, 56, 22, 12, 8, 88, 64),
    mon('glassbeetle', 'GLASS BEETLE', 24, 'insect', 60, 94, 60, 28, 8, 12, 96, 70, { drop: { item: 'glass', p: 0.4 } }),
    mon('cinderimp', 'CINDER IMP', 24, 'elemental', 15, 74, 64, 18, 14, 8, 92, 66, { family: 'elemental', spells: [{ id: 'cinder', p: 0.35 }] }),
    mon('sandwraith', 'SAND WRAITH', 25, 'wisp', 35, 78, 62, 16, 16, 8, 94, 64, { family: 'wisp' }),
    mon('ashhound', 'ASH HOUND', 25, 'beast', 18, 100, 66, 24, 12, 10, 104, 74),

    mon('snowpip', 'SNOWPIP', 27, 'beast', 190, 104, 68, 26, 14, 10, 118, 80),
    mon('frostwolf', 'FROST WOLF', 28, 'beast', 210, 124, 76, 28, 16, 10, 136, 90, { drop: { item: 'pelt', p: 0.5 } }),
    mon('icewisp', 'ICE WISP', 28, 'wisp', 185, 94, 72, 20, 18, 12, 126, 82, { family: 'wisp', spells: [{ id: 'spit', p: 0.4 }] }),
    mon('palesentinel', 'PALE SENTINEL', 30, 'armor', 200, 146, 78, 36, 8, 14, 156, 100),
    mon('shivertroll', 'SHIVER TROLL', 30, 'beast', 220, 168, 82, 30, 6, 12, 168, 108),

    mon('thornmauler', 'THORN MAULER', 31, 'plant', 120, 156, 86, 32, 12, 14, 176, 110, { family: 'plant' }),
    mon('briarstag', 'BRIAR STAG', 32, 'beast', 100, 176, 92, 30, 14, 12, 196, 120),
    mon('gloomowl', 'GLOOM OWL', 32, 'bird', 260, 136, 90, 24, 20, 10, 186, 114, { sleep: 0.22 }),
    mon('roottyrant', 'ROOT TYRANT', 33, 'plant', 130, 198, 94, 36, 8, 16, 220, 130, { family: 'plant' }),

    mon('shadesoldier', 'SHADE SOLDIER', 35, 'undead', 270, 190, 100, 38, 14, 16, 240, 140, { family: 'undead' }),
    mon('voidmoth', 'VOID MOTH', 35, 'insect', 280, 156, 104, 28, 22, 12, 230, 132, { family: 'wisp' }),
    mon('lampthief', 'LAMP THIEF', 36, 'human', 300, 176, 108, 32, 18, 14, 250, 150),
    mon('dreadbanner', 'DREAD BANNER', 37, 'undead', 265, 220, 112, 40, 12, 18, 280, 160, { family: 'undead', spells: [{ id: 'dirge', p: 0.35 }] }),
    mon('fragment', 'SPIRE FRAGMENT', 37, 'wisp', 290, 166, 116, 30, 20, 14, 260, 150, { family: 'wisp', spells: [{ id: 'dirge', p: 0.3 }] }),

    /* Bosses */
    mon('dewcap', 'DEWCAP ANCIENT', 5, 'plant', 100, 52, 16, 6, 4, 4, 48, 40, {
      boss: true, family: 'plant', weak: { fire: 1.45 },
      win(s) { s.flags.lampDew = s.flags.lampDew || 'held'; }
    }),
    mon('mirewarden', 'MIRE WARDEN', 9, 'armor', 80, 130, 28, 16, 6, 8, 140, 110, {
      boss: true, spells: [{ id: 'venom', p: 0.4 }],
      win(s) { s.flags.hooks = true; }
    }),
    mon('drownedcantor', 'DROWNED CANTOR', 14, 'undead', 230, 200, 36, 18, 8, 10, 260, 180, {
      boss: true, family: 'undead', weak: { fire: 1.3, radiant: 1.6 }, spells: [{ id: 'gloom', p: 0.45 }],
      win(s) { s.flags.lens = true; }
    }),
    mon('gravemarch', 'GRAVEMARCH', 18, 'armor', 240, 320, 50, 26, 8, 14, 480, 320, {
      boss: true, family: 'undead', weak: { radiant: 1.5 }, spells: [{ id: 'quake', p: 0.4 }],
      win(s) { s.flags.lampStone = s.flags.lampStone || 'held'; }
    }),
    mon('ridgewyrm', 'RIDGE WYRM', 20, 'dragon', 0, 380, 56, 24, 11, 12, 700, 1400, {
      boss: true, family: 'dragon', spells: [{ id: 'cinder', p: 0.45 }],
      win(s) { s.flags.ridgeDead = true; }
    }),
    mon('gullking', 'GULL KING', 21, 'bird', 45, 340, 54, 20, 16, 10, 520, 480, {
      boss: true,
      win(s) { s.flags.bell = true; }
    }),
    mon('brinesovereign', 'BRINE REGENT', 24, 'serpent', 195, 460, 64, 28, 12, 14, 820, 640, {
      boss: true, weak: { bolt: 1.5 }, resist: { ice: 0.5 }, spells: [{ id: 'brine', p: 0.45 }],
      win(s) { s.flags.lampTide = s.flags.lampTide || 'held'; }
    }),
    mon('ashseraph', 'ASH SERAPH', 28, 'elemental', 20, 620, 76, 32, 14, 16, 1200, 900, {
      boss: true, family: 'elemental', weak: { ice: 1.5 }, resist: { fire: 0.45 }, spells: [{ id: 'pyre', p: 0.5 }],
      win(s) {
        s.flags.lampEmber = s.flags.lampEmber || 'held';
        s.items.shard = (s.items.shard || 0) + 1;
      }
    }),
    mon('palewarden', 'PALE WARDEN', 33, 'armor', 190, 820, 90, 42, 12, 18, 1800, 1200, {
      boss: true, weak: { fire: 1.45 }, resist: { ice: 0.45 }, spells: [{ id: 'rime', p: 0.5 }],
      win(s) { s.flags.lampFrost = s.flags.lampFrost || 'held'; }
    }),
    mon('cindersaint', 'CINDER SAINT', 36, 'elemental', 40, 1100, 108, 44, 16, 20, 2800, 2400, {
      boss: true, family: 'elemental', weak: { ice: 1.25, radiant: 1.2 }, spells: [{ id: 'pyre', p: 0.55 }],
      win(s) { s.flags.saintDead = true; if (!LH.owned(s, 'dawnbrand')) s.items.dawnbrand = (s.items.dawnbrand || 0) + 1; }
    }),
    mon('sovereign', 'HOLLOW SOVEREIGN', 40, 'sovereign', 275, 1680, 118, 48, 16, 22, 0, 0, {
      boss: true, family: 'undead', weak: { radiant: 1.65 }, resist: { dark: 0.5 },
      spells: [{ id: 'unmake', p: 0.4 }, { id: 'dirge', p: 0.25 }],
      phase2: { name: 'SOVEREIGN UNBOUND', atk: 138, def: 40, hue: 320 },
      win(s) {
        s.flags.sovereignDead = true;
        if (!LH.owned(s, 'heirrimg')) s.items.heirrimg = (s.items.heirrimg || 0) + 1;
        s.gold += 3000;
      }
    })
  ];

  LH.MONSTERS = {};
  MON.forEach(m => { LH.MONSTERS[m.id] = m; });

  LH.ENCOUNTERS = {
    vale: ['puddlekin', 'puddlekin', 'dustnib', 'fieldvole', 'thornpup', 'sproutling'],
    marsh: ['mireling', 'bogcroak', 'reedlurker', 'mothbane', 'mudguard'],
    meadow: ['hedgebandit', 'copperant', 'strayhound', 'sunmoth', 'scaremask'],
    chapel: ['pewhaunt', 'chorister', 'scaremask', 'sunmoth'],
    peaks: ['gravelimp', 'craghorn', 'cavewick', 'tombward', 'ledgecrawler'],
    coast: ['tidenipper', 'gullraider', 'brinejelly', 'wreckghost', 'coralbrute'],
    desert: ['dunescuttler', 'glassbeetle', 'cinderimp', 'sandwraith', 'ashhound'],
    frost: ['snowpip', 'frostwolf', 'icewisp', 'palesentinel', 'shivertroll'],
    thorn: ['thornmauler', 'briarstag', 'gloomowl', 'roottyrant'],
    night: ['shadesoldier', 'voidmoth', 'lampthief', 'dreadbanner', 'fragment'],
    ridge: ['craghorn', 'ledgecrawler', 'cavewick', 'gravelimp']
  };

  LH.LAMPS = [
    ['lampDew', 'DEWLAMP'],
    ['lampStone', 'STONE LAMP'],
    ['lampTide', 'TIDE LAMP'],
    ['lampEmber', 'EMBER LAMP'],
    ['lampFrost', 'FROST LAMP']
  ];

  LH.lampsSet = function (s) {
    let n = 0;
    for (const [k] of LH.LAMPS) if (s.flags[k] === 'set') n++;
    return n;
  };
  LH.lampsHeldOrSet = function (s) {
    let n = 0;
    for (const [k] of LH.LAMPS) if (s.flags[k]) n++;
    return n;
  };

  LH.owned = function (s, id) {
    if (!s || !id) return false;
    if ((s.items[id] || 0) > 0) return true;
    return s.weapon === id || s.armor === id || s.shield === id || s.accessory === id;
  };

  LH.goalText = function (s) {
    const f = s.flags;
    if (f.ending) return 'THE LAMPS ARE LIT. DUSKREACH IS QUIET.';
    if (!f.metQueen) return 'SPEAK WITH QUEEN MAELIS.';
    if (f.lampDew !== 'set') {
      if (f.lampDew === 'held') return 'SET THE DEWLAMP IN THE SANCTUM, EAST OF THE VALE.';
      return 'FIND THE DEWLAMP IN DEWSPRING CAVE, SOUTH OF MILLHAVEN.';
    }
    if (!f.hooks) return 'THE MARSH ROAD IS OPEN. SEEK THE MIRE WARDEN FOR CLIMBING HOOKS.';
    if (!f.chapelKey) return 'ASK THE PRIEST IN FAIRHOLLOW ABOUT THE SUNKEN CHAPEL.';
    if (!f.lens) return 'THE SUNKEN CHAPEL IN THE SOUTH MEADOW HIDES THE SUN LENS.';
    if (f.lampStone !== 'set') {
      if (f.lampStone === 'held') return 'SET THE STONE LAMP IN THE SANCTUM.';
      return 'CROSS THE CLIFF WITH YOUR HOOKS. THE STONE LAMP IS IN LANTERN CRYPT.';
    }
    if (!f.bell) return 'SALTWHARF IS OPEN. RETRIEVE THE HARBOR BELL FROM THE GULL WRECK.';
    if (!f.ferry) return 'RETURN THE HARBOR BELL TO THE CAPTAIN IN SALTWHARF.';
    if (f.lampTide !== 'set') {
      if (f.lampTide === 'held') return 'SET THE TIDE LAMP IN THE SANCTUM.';
      return 'USE THE FERRY TOKEN AND CLAIM THE TIDE LAMP IN TIDEVAULT.';
    }
    if (!f.bridgeFixed) return 'BRING IRON NAILS FROM FAIRHOLLOW TO THE REEDMARKET CARPENTER.';
    if (f.lampEmber !== 'set') {
      if (f.lampEmber === 'held') return 'SET THE EMBER LAMP IN THE SANCTUM.';
      return 'CROSS THE GLASS STORM WITH THE SUN LENS. THE PYRAMID HOLDS THE EMBER LAMP.';
    }
    if (!f.cloak) return 'THE TAILOR IN WHITEHEARTH NEEDS AN EMBER SHARD AND 3 FROST PELTS.';
    if (f.lampFrost !== 'set') {
      if (f.lampFrost === 'held') return 'SET THE FROST LAMP IN THE SANCTUM.';
      return 'THE WARMCLOAK WILL PART THE WHITEOUT. ICEHOLLOW HIDES THE FROST LAMP.';
    }
    if (!f.nightPass) return 'SET EVERY LAMP. THE KEEPER WILL GRANT THE NIGHT PASS.';
    if (!f.sovereignDead) return 'THE NIGHT ROAD LEAVES SALTWHARF. END THE HOLLOW SOVEREIGN.';
    return 'WALK THE LIT REALM.';
  };

  /* ---- talkers: return { lines, apply?, yes? } ---- */
  function linesOf(s) { return { lines: s }; }

  LH.talkers = {
    queen(s) {
      const n = s.name || 'HEIR';
      if (!s.flags.metQueen) {
        return {
          lines: [
            'THE DUSK CAME THE NIGHT THE FIVE LAMPS CRACKED.',
            'I AM MAELIS, QUEEN OF FIRSTKEEP. THE OLD LAW NAMES YOU LANTERN HEIR, ' + n + '.',
            'SEEK THE DEWLAMP IN DEWSPRING CAVE, SOUTH OF MILLHAVEN.',
            'SET EACH LAMP IN THE SANCTUM OF FIVE, ON THE EASTERN ROAD.',
            'IF THE DARK TAKES YOU, YOU WILL WAKE HERE. I HAVE SET ASIDE COIN.',
            'FACE A SOUL AND PRESS THE SIGIL TO SPEAK. THE OTHER SIGIL OPENS YOUR PACK.'
          ],
          apply(st) { st.flags.metQueen = true; st.gold += 100; }
        };
      }
      if (s.flags.ending) {
        return linesOf(['THE LAMPS HOLD, ' + n + '. WALK DUSKREACH WHILE THE LIGHT LASTS.']);
      }
      const set = LH.lampsSet(s);
      return linesOf([
        set + ' OF THE FIVE LAMPS ARE SET.',
        LH.goalText(s)
      ]);
    },
    steward(s) {
      return {
        lines: ['THE QUEEN GRANTS YOU REST. SLEEP WITHOUT COIN?'],
        yes: { inn: 0 }
      };
    },
    bren() {
      return linesOf([
        'I AM BREN, OF THE GATE.',
        'MILLHAVEN LIES SOUTH. STAY ON THE ROAD IF YOU ARE TIRED OF TEETH.'
      ]);
    },
    otis() {
      return {
        lines: ['CHAPEL STORES ARE THIN, BUT THE LEAVES ARE HONEST.'],
        apply() {},
        shop: 'keep'
      };
    },
    scholar() {
      return linesOf([
        'FIVE LAMPS: DEW, STONE, TIDE, EMBER, FROST.',
        'SOCKET THEM AT THE SANCTUM. ONLY THEN DOES THE NIGHT ROAD OPEN.'
      ]);
    },
    mira() {
      return { lines: ['MIRA, AT YOUR SERVICE. STEEL AND LEAVES.'], shop: 'mill' };
    },
    hob() {
      return { lines: ['BEDS ARE WARM. EIGHT COIN FOR THE NIGHT?'], yes: { inn: 8 } };
    },
    child(s) {
      if (s.flags.locketDone) return linesOf(['THANK YOU FOR THE LOCKET. I WILL NOT DROP IT AGAIN.']);
      if ((s.items.locket || 0) > 0) {
        return {
          lines: ['MY LOCKET! TAKE THIS. MOTHER BAKED TOO MUCH ANYWAY.'],
          apply(st) {
            st.items.locket = (st.items.locket || 1) - 1;
            st.flags.locketDone = true;
            st.gold += 60;
            st.items.mendleaf = (st.items.mendleaf || 0) + 3;
          }
        };
      }
      return linesOf(['I DROPPED A BRASS LOCKET IN THE EAST OF THE VALE, BY A LONE TREE.']);
    },
    elderMill() {
      return linesOf([
        'DEWSPRING BREATHES SOUTH OF HERE, UNDER THE HILL.',
        'THE OLD CAP IN THE DEEP IS SLOW, BUT IT HITS LIKE A MILLSTONE.'
      ]);
    },
    reedShop() {
      return { lines: ['MARSH STOCK. IRON THAT DOES NOT RUST IF YOU ARE LUCKY.'], shop: 'reed' };
    },
    reedInn() {
      return { lines: ['THE REEDS CREAK, BUT THE BEDS DO NOT. TWELVE COIN?'], yes: { inn: 12 } };
    },
    healer(s) {
      if (s.flags.lilyDone) return linesOf(['THE MARSH BAND SUITS YOU. THE MIRES WILL BITE LESS.']);
      if ((s.items.lily || 0) >= 3) {
        return {
          lines: ['THREE LILIES. I WILL BRAID A MARSH BAND FOR YOU.'],
          apply(st) {
            st.items.lily -= 3;
            st.flags.lilyDone = true;
            st.items.marshband = (st.items.marshband || 0) + 1;
            st.items.clearroot = (st.items.clearroot || 0) + 4;
          }
        };
      }
      return linesOf(['BRING THREE MARSH LILIES FROM THE SOUTH MIRE. THEY GLOW AT DUSK.']);
    },
    carpenter(s) {
      if (s.flags.bridgeFixed) return linesOf(['THE EAST BRIDGE WILL HOLD. MIND THE GLASS STORM BEYOND.']);
      if (s.flags.lampTide !== 'set') {
        return linesOf(['I WILL NOT BUILD INTO A LIVING TIDE. SET THE TIDE LAMP, THEN COME BACK.']);
      }
      if ((s.items.nails || 0) < 1) {
        return linesOf(['I NEED A BOX OF IRON NAILS. FAIRHOLLOW SELLS THEM.']);
      }
      return {
        lines: ['GOOD NAILS. THE BRIDGE TO THE CINDERFLATS IS OPEN.'],
        apply(st) { st.items.nails -= 1; st.flags.bridgeFixed = true; }
      };
    },
    fisher() {
      return linesOf(['EAST OF THE MARSH THE RIVER EATS BRIDGES. WEST, ONLY FROGS.']);
    },
    fairShop() {
      return { lines: ['FAIRHOLLOW. BROAD STEEL, AND NAILS IF YOU ARE BUILDING.'], shop: 'fair' };
    },
    fairInn() {
      return { lines: ['A FAIR PRICE FOR A FAIR BED. TWENTY-EIGHT COIN?'], yes: { inn: 28 } };
    },
    priest(s) {
      if (s.flags.lens) return linesOf(['THE SUN LENS IS YOURS. THE GLASS STORM WILL PART FOR IT.']);
      if (s.flags.chapelKey) return linesOf(['THE SUNKEN CHAPEL IS SOUTH IN THE MEADOW. THE LENS IS INSIDE.']);
      if (s.flags.lampDew !== 'set') return linesOf(['SET THE DEWLAMP. THEN I WILL TRUST YOU WITH THE CHAPEL KEY.']);
      return {
        lines: ['TAKE THE CHAPEL KEY. A SUN LENS SLEEPS WITH THE DROWNED CANTOR.'],
        apply(st) { st.flags.chapelKey = true; }
      };
    },
    bard(s) {
      if (s.flags.songDone) return linesOf(['THE CRYSTAL STILL SINGS. I OWE YOU A VERSE.']);
      if ((s.items.songcrystal || 0) > 0) {
        return {
          lines: ['YOU FOUND THE SONG CRYSTAL. TAKE THE CHARM. IT LIKES COWARDS AND HEROES BOTH.'],
          apply(st) {
            st.items.songcrystal -= 1;
            st.flags.songDone = true;
            st.gold += 220;
            if (!LH.owned(st, 'luckcharm')) st.items.luckcharm = (st.items.luckcharm || 0) + 1;
          }
        };
      }
      return linesOf(['A SONG CRYSTAL LIES IN THE SUNKEN CHAPEL. I WILL PAY, AND MORE.']);
    },
    fairGuard() {
      return linesOf(['THE CLIFF NORTH OF THE MEADOW WANTS HOOKS. THE MARSH WARDEN HOARDS THEM.']);
    },
    keeper(s) {
      const got = [];
      const apply = (st) => {
        for (const [k, name] of LH.LAMPS) {
          if (st.flags[k] === 'held') { st.flags[k] = 'set'; got.push(name); }
        }
        if (LH.lampsSet(st) === 5 && !st.flags.nightPass) st.flags.nightPass = true;
      };
      /* Preview without mutating, then apply on confirm. */
      const preview = [];
      for (const [k, name] of LH.LAMPS) if (s.flags[k] === 'held') preview.push(name);
      const lines = [];
      if (preview.length) lines.push('THE PEDESTALS TAKE THE ' + preview.join(', ') + '.');
      else lines.push('BRING A LAMP AND I WILL SET IT.');
      const after = LH.lampsSet(s) + preview.length;
      if (after >= 5 && !s.flags.nightPass) {
        lines.push('ALL FIVE BURN. THE NIGHT PASS IS YOURS. THE SPIRE ROAD LEAVES SALTWHARF.');
      } else {
        lines.push(after + ' OF 5 LAMPS ARE SET.');
      }
      return { lines, apply };
    },
    pilgrim(s) {
      return linesOf(['I WALKED FROM THE COAST. THE KEEPER DOES NOT SLEEP. LAMPS SET: ' + LH.lampsSet(s) + '.']);
    },
    stoneShop() { return { lines: ['RIDGE STEEL. HEAVY, LIKE THE MOUNTAIN.'], shop: 'stone' }; },
    stoneInn() { return { lines: ['THE WIND PAYS NO BILL. YOU DO. FORTY COIN?'], yes: { inn: 40 } }; },
    miner(s) {
      if (s.flags.minerDone) return linesOf(['JOSS CAME HOME. THE HELM IS YOURS TO KEEP.']);
      if (s.flags.jossMet) {
        return {
          lines: ['JOSS LIVES? TAKE THE MINER HELM. IT HAS TURNED FALLING ROCK BEFORE.'],
          apply(st) {
            st.flags.minerDone = true;
            st.gold += 180;
            if (!LH.owned(st, 'minershelm')) st.items.minershelm = (st.items.minershelm || 0) + 1;
          }
        };
      }
      return linesOf(['MY BROTHER JOSS WENT INTO LANTERN CRYPT AND DID NOT COME OUT.']);
    },
    joss(s) {
      if (s.flags.jossMet) return linesOf(['I WILL REST, THEN WALK HOME. TELL THE MINER.']);
      return {
        lines: ['YOU ARE NOT A TOMB WARD. GOOD. TELL MY BROTHER IN STONEHEARTH I AM ALIVE.'],
        apply(st) { st.flags.jossMet = true; }
      };
    },
    saltShop() { return { lines: ['TIDE-STEEL AND POWDER. THE WRECKERS HATE BOTH.'], shop: 'salt' }; },
    saltInn() { return { lines: ['HARBOR BED. FIFTY-FIVE COIN, AND THE GULLS ARE FREE.'], yes: { inn: 55 } }; },
    captain(s) {
      if (s.flags.ferry) return linesOf(['THE TOKEN IS TRUE. THE DOCKHAND WILL SAIL YOU TO TIDEVAULT.']);
      if (!s.flags.bell) return linesOf(['WRECKERS STOLE THE HARBOR BELL. IT IS IN THE GULL WRECK, SOUTH OF TOWN.']);
      return {
        lines: ['THE BELL. TAKE THIS FERRY TOKEN. TIDEVAULT IS NOT A KIND PLACE.'],
        apply(st) { st.flags.ferry = true; }
      };
    },
    dockhand(s) {
      if (!s.flags.ferry) return linesOf(['NO TOKEN, NO CROSSING. THE CAPTAIN IS STUBBORN.']);
      return {
        lines: ['SAIL TO TIDEVAULT?'],
        yes: { warp: 'tidevault-f1' }
      };
    },
    sailor() { return linesOf(['THE REGENT UNDER THE WATER USED TO BE A PERSON. THE TIDE ATE THE REST.']); },
    ashShop() { return { lines: ['GLASS AND EMBER. DO NOT LICK THE SCIMITARS.'], shop: 'ash' }; },
    ashInn() { return { lines: ['OASIS WATER AND A BED. SEVENTY COIN?'], yes: { inn: 70 } }; },
    ashElder() {
      return linesOf([
        'THE GLASS STORM SOUTH OF TOWN CUTS ANYONE WITHOUT A SUN LENS.',
        'THE PYRAMID SLEEPS BEHIND IT.'
      ]);
    },
    glazier(s) {
      if (s.flags.glassDone) return linesOf(['FINE GLASS. I HAVE COIN IF YOU FIND MORE, BUT ONE TRADE IS ENOUGH.']);
      if ((s.items.glass || 0) >= 4) {
        return {
          lines: ['FOUR SHARDS OF BEETLE GLASS. HERE IS A FAIR PURSE.'],
          apply(st) { st.items.glass -= 4; st.flags.glassDone = true; st.gold += 400; }
        };
      }
      return linesOf(['GLASS BEETLES IN THE DUNES DROP REAL GLASS. FOUR PIECES AND I WILL PAY.']);
    },
    whiteShop() { return { lines: ['FROST-FORGED. IT WILL NOT STICK TO YOUR PALM.'], shop: 'white' }; },
    whiteInn() { return { lines: ['A STOVE AND A QUILT. NINETY COIN?'], yes: { inn: 90 } }; },
    tailor(s) {
      if (s.flags.cloak) return linesOf(['THE WARMCLOAK HOLDS. THE WHITEOUT WILL PART.']);
      const pelts = s.items.pelt || 0;
      const shard = s.items.shard || 0;
      if (pelts >= 3 && shard >= 1) {
        return {
          lines: ['SHARD AND PELTS. THE WARMCLOAK IS YOURS. WEAR IT INTO THE WHITEOUT.'],
          apply(st) {
            st.items.pelt -= 3;
            st.items.shard -= 1;
            st.flags.cloak = true;
            if (!LH.owned(st, 'warmcloak')) st.items.warmcloak = (st.items.warmcloak || 0) + 1;
          }
        };
      }
      return linesOf([
        'I CAN SEW A WARMCLOAK FROM AN EMBER SHARD AND THREE FROST PELTS.',
        'A HUNTER CACHE IN THE WESTERN SNOW HOLDS PELTS. THE SHARD IS IN THE PYRAMID.',
        'YOU HAVE ' + pelts + ' PELTS AND ' + shard + ' SHARD.'
      ]);
    },
    hunter() { return linesOf(['THE CACHE IS WEST OF THE VILLAGE, A STONE CAIRN. WOLVES GUARD THE OPEN SNOW IF YOU WANT MORE PELTS.']); },
    thornShop() { return { lines: ['THE WILDS SELL WHAT THE COAST CANNOT FORGE.'], shop: 'thorn' }; },
    thornInn() { return { lines: ['ROOT-TEA AND A HAMMOCK. ONE HUNDRED TEN COIN?'], yes: { inn: 110 } }; },
    hermit() {
      return linesOf([
        'THE FIRST FLAME RUIN IS NORTH OF THE VILLAGE.',
        'IRON SHEARS FROM VIGIL CUT THE THORN WALL ON THE PEAKS ROAD.'
      ]);
    },
    vigilShop() { return { lines: ['LAST STORES BEFORE THE SPIRE. SHEARS, BALMS, AND AEGIS.'], shop: 'vigil' }; },
    vigilInn() { return { lines: ['SLEEP BEFORE THE END. ONE HUNDRED FORTY COIN?'], yes: { inn: 140 } }; },
    watcher(s) {
      if (!s.flags.nightPass) return linesOf(['THE NORTH ROAD IS SHUT. FIVE LAMPS, OR NOTHING.']);
      return linesOf(['THE PASS IS OPEN. THE SOVEREIGN WAITS IN NIGHTSPIRE.']);
    },
    veteran() {
      return linesOf([
        'THE SOVEREIGN HATES DAWNBURST. BRING FULLBALMS.',
        'WHEN IT SHEDS ITS CLOAK, DO NOT PANIC. WARD, THEN STRIKE.'
      ]);
    }
  };

  /* Dungeon specs. Floors are serpentine chambers so the walk is long on purpose. */
  LH.DUNGEONS = [
    { id: 'dewspring', name: 'DEWSPRING CAVE', floors: 3, cols: 5, rows: 4, tileset: 'cave', enc: 'vale', encRate: 0.032, darkFrom: 99, boss: 'dewcap', mouth: { x: 96, y: 348 } },
    { id: 'mirefen', name: 'MIREFEN', floors: 4, cols: 6, rows: 4, tileset: 'swamp', enc: 'marsh', encRate: 0.036, darkFrom: 99, boss: 'mirewarden', mouth: { x: 118, y: 470 } },
    { id: 'chapel', name: 'SUNKEN CHAPEL', floors: 3, cols: 5, rows: 4, tileset: 'dungeon', enc: 'chapel', encRate: 0.036, darkFrom: 99, boss: 'drownedcantor', mouth: { x: 300, y: 360 }, lockedMouth: 'chapel',
      chests: [{ floor: 2, along: 0.55, id: 'songcrystal', item: 'songcrystal', qty: 1 }] },
    { id: 'crypt', name: 'LANTERN CRYPT', floors: 4, cols: 6, rows: 5, tileset: 'dungeon', enc: 'peaks', encRate: 0.038, darkFrom: 3, boss: 'gravemarch', mouth: { x: 230, y: 55 },
      npcs: [{ floor: 2, along: 0.45, ref: 'joss', name: 'JOSS' }] },
    { id: 'ridge', name: 'RIDGE NEST', floors: 3, cols: 5, rows: 4, tileset: 'cave', enc: 'ridge', encRate: 0.038, darkFrom: 99, boss: 'ridgewyrm', mouth: { x: 175, y: 110 } },
    { id: 'wreck', name: 'GULL WRECK', floors: 3, cols: 6, rows: 4, tileset: 'cave', enc: 'coast', encRate: 0.038, darkFrom: 99, boss: 'gullking', mouth: { x: 352, y: 214 } },
    { id: 'tidevault', name: 'TIDEVAULT', floors: 4, cols: 6, rows: 5, tileset: 'cave', enc: 'coast', encRate: 0.04, darkFrom: 3, boss: 'brinesovereign', mouth: null, ferry: true },
    { id: 'pyramid', name: 'GLASS PYRAMID', floors: 5, cols: 7, rows: 5, tileset: 'sand', enc: 'desert', encRate: 0.04, darkFrom: 4, boss: 'ashseraph', mouth: { x: 310, y: 488 } },
    { id: 'icehollow', name: 'ICEHOLLOW', floors: 5, cols: 7, rows: 5, tileset: 'ice', enc: 'frost', encRate: 0.04, darkFrom: 3, boss: 'palewarden', mouth: { x: 368, y: 58 } },
    { id: 'ruin', name: 'FIRST FLAME', floors: 5, cols: 7, rows: 5, tileset: 'dungeon', enc: 'thorn', encRate: 0.04, darkFrom: 3, boss: 'cindersaint', mouth: { x: 88, y: 42 },
      chests: [{ floor: 5, along: 0.3, id: 'dawnplate', item: 'dawnplate', qty: 1 }] },
    { id: 'nightspire', name: 'NIGHTSPIRE', floors: 6, cols: 7, rows: 6, tileset: 'night', enc: 'night', encRate: 0.042, darkFrom: 2, boss: 'sovereign', mouth: { x: 340, y: 140 },
      chests: [{ floor: 3, along: 0.7, id: 'spire-balm', item: 'fullbalm', qty: 2 }] }
  ];

  /* Loot by dungeon tier: chest index 0..n cycled. */
  LH.LOOT = {
    dewspring: [{ item: 'mendleaf', qty: 3 }, { gold: 30 }, { item: 'clearroot', qty: 2 }, { item: 'torch', qty: 2 }],
    mirefen: [{ item: 'strongbalm', qty: 1 }, { gold: 80 }, { item: 'clearroot', qty: 3 }, { item: 'manadrop', qty: 1 }],
    chapel: [{ item: 'manadrop', qty: 2 }, { gold: 120 }, { item: 'wakepowder', qty: 1 }],
    crypt: [{ item: 'strongbalm', qty: 2 }, { gold: 200 }, { item: 'torch', qty: 3 }, { item: 'manadrop', qty: 2 }],
    ridge: [{ gold: 400 }, { item: 'fullbalm', qty: 1 }, { item: 'manavial', qty: 1 }],
    wreck: [{ gold: 260 }, { item: 'strongbalm', qty: 2 }, { item: 'veilpowder', qty: 2 }],
    tidevault: [{ item: 'manavial', qty: 1 }, { gold: 380 }, { item: 'fullbalm', qty: 1 }, { item: 'veilpowder', qty: 2 }],
    pyramid: [{ item: 'fullbalm', qty: 1 }, { gold: 520 }, { item: 'manavial', qty: 2 }, { item: 'clearroot', qty: 3 }],
    icehollow: [{ item: 'fullbalm', qty: 2 }, { gold: 700 }, { item: 'manavial', qty: 2 }],
    ruin: [{ gold: 900 }, { item: 'fullbalm', qty: 2 }, { item: 'manavial', qty: 2 }],
    nightspire: [{ item: 'fullbalm', qty: 2 }, { gold: 800 }, { item: 'manavial', qty: 2 }, { item: 'veilpowder', qty: 3 }]
  };

  /*
   * World geometry. Clearings are pockets. Roads are switchbacks through
   * the mountain so the shortest path is the long path.
   * Coordinates are tuned so pockets do not touch.
   */
  LH.WORLD = {
    w: 400,
    h: 520,
    clearings: [
      { id: 'vale', x: 28, y: 300, w: 96, h: 84, terrain: T.GRASS },
      { id: 'meadow', x: 250, y: 300, w: 96, h: 84, terrain: T.GRASS },
      { id: 'salt', x: 300, y: 168, w: 84, h: 78, terrain: T.GRASS },
      { id: 'marsh', x: 24, y: 430, w: 120, h: 74, terrain: T.SWAMP },
      { id: 'desert', x: 248, y: 428, w: 130, h: 78, terrain: T.SAND },
      { id: 'peaks', x: 158, y: 28, w: 96, h: 96, terrain: T.GRASS },
      { id: 'frost', x: 304, y: 24, w: 80, h: 92, terrain: T.SNOW },
      { id: 'thorn', x: 24, y: 24, w: 84, h: 96, terrain: T.FOREST },
      { id: 'night', x: 312, y: 128, w: 60, h: 28, terrain: T.CRACK }
    ],
    /* Each road is a chain of switchback segments. Gates sit on that path. */
    roads: [
      { id: 'vale-meadow', segs: [
        { axis: 'h', y: 342, x1: 124, x2: 250, step: 10, amp: 28 }
      ] },
      { id: 'vale-marsh', segs: [
        { axis: 'v', x: 70, y1: 384, y2: 430, step: 6, amp: 30, gate: { at: 0.22, terrain: T.DUSK, len: 1 } }
      ] },
      { id: 'meadow-peaks', segs: [
        { axis: 'v', x: 270, y1: 300, y2: 214, step: 8, amp: 14, gate: { at: 0.18, terrain: T.CLIFF, len: 1 } },
        { axis: 'h', y: 214, x1: 270, x2: 206, step: 8, amp: 16 },
        { axis: 'v', x: 206, y1: 214, y2: 124, step: 8, amp: 16 }
      ] },
      { id: 'peaks-frost', segs: [
        { axis: 'h', y: 70, x1: 254, x2: 304, step: 8, amp: 20 }
      ] },
      { id: 'peaks-thorn', segs: [
        { axis: 'h', y: 80, x1: 108, x2: 158, step: 6, amp: 22, gate: { at: 0.35, terrain: T.THORN, len: 1 } }
      ] },
      { id: 'meadow-salt', segs: [
        { axis: 'v', x: 328, y1: 246, y2: 300, step: 8, amp: 16, gate: { at: 0.4, terrain: T.SLIDE, len: 1 } }
      ] },
      { id: 'marsh-desert', segs: [
        { axis: 'h', y: 448, x1: 144, x2: 248, step: 8, amp: 16, gate: { at: 0.5, terrain: T.BRIDGE, len: 1 } }
      ] },
      { id: 'salt-night', segs: [
        { axis: 'v', x: 340, y1: 156, y2: 168, step: 12, amp: 0, gate: { at: 0.5, terrain: T.NIGHT, len: 1 } }
      ] }
    ],
    /* Fixed barriers inside pockets. */
    belts: [
      { terrain: T.STORM, x: 248, y: 470, w: 130, h: 2 },
      { terrain: T.WHITEOUT, x: 350, y: 24, w: 2, h: 92 }
    ],
  };

  /* Towns list above is documentation for world.js; the actual layouts live there
     so coordinates stay next to the tile math. This array is the contract. */

  LH.regionAt = function (x, y) {
    const C = LH.WORLD.clearings;
    for (let i = 0; i < C.length; i++) {
      const c = C[i];
      if (x >= c.x && y >= c.y && x < c.x + c.w && y < c.y + c.h) return c.id;
    }
    if (y >= 428) return x < 200 ? 'marsh' : 'desert';
    if (y >= 280) return x < 200 ? 'vale' : 'meadow';
    if (y >= 150) return x < 220 ? 'meadow' : 'salt';
    if (x < 140) return 'thorn';
    if (x < 270) return 'peaks';
    return 'frost';
  };

  LH.countSetPreview = LH.lampsSet;
})(typeof window !== 'undefined' ? window : globalThis);
