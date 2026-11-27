/* Lantern Heir — explore, talk, battle, save. */
(function () {
  const LH = window.LH;
  const gfx = LH.gfx;
  const T = LH.T;
  const SAVE_KEY = 'lantern-heir-save-v1';
  const SET_KEY = 'lantern-heir-settings-v1';
  const VW = 192, VH = 224, TILE = 16;

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let settings = loadSettings();
  let state = null;
  let map = null;
  let mode = 'title';
  let titleCur = 0;
  let name = 'ALDER';
  let nameRow = 3, nameCol = 6;
  let menu = null;
  let battle = null;
  let box = { active: false, lines: [], i: 0, shown: 0, ready: false, onDone: null };
  let moveT = 0;
  let hop = 0;
  let encCd = 0;
  let warpLock = false;
  let toast = '';
  let toastT = 0;
  let fade = 0;
  let repT = 0;
  let anim = 0;
  let lastTs = 0;
  const held = { up: false, down: false, left: false, right: false, a: false, b: false };
  const edges = { up: false, down: false, left: false, right: false, a: false, b: false };
  let lastDir = 'down';

  const NAME_ROWS = [
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    ['I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'],
    ['Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X'],
    ['Y', 'Z', '-', "'", '.', 'DEL', 'OK']
  ];

  const WIN_LINES = {
    dewcap: 'THE DEWLAMP IS YOURS.',
    mirewarden: 'YOU TAKE THE CLIMBING HOOKS.',
    drownedcantor: 'THE SUN LENS CATCHES.',
    gravemarch: 'THE STONE LAMP IS YOURS.',
    gullking: 'YOU RECOVER THE HARBOR BELL.',
    brinesovereign: 'THE TIDE LAMP IS YOURS.',
    ashseraph: 'THE EMBER LAMP AND A SHARD.',
    palewarden: 'THE FROST LAMP IS YOURS.',
    cindersaint: 'DAWNBRAND COMES FREE.',
    ridgewyrm: 'THE RIDGE WYRM STILLS.',
    sovereign: 'THE SPIRE GOES QUIET.'
  };

  function spd() { return settings.speed || 1; }

  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem(SET_KEY) || 'null');
      if (s && s.speed) return { speed: s.speed, fast: !!s.fast, mute: !!s.mute };
    } catch (e) { /* ignore */ }
    return { speed: 1, fast: false, mute: false };
  }
  function saveSettings() {
    try { localStorage.setItem(SET_KEY, JSON.stringify(settings)); } catch (e) { /* ignore */ }
    const tag = document.getElementById('speedtag');
    if (tag) tag.textContent = settings.speed + '×';
    const mute = document.getElementById('btn-mute');
    if (mute) mute.textContent = settings.mute ? '×' : '♪';
    LH.audio.setMute(settings.mute);
    LH.audio.setSpeed(settings.speed);
  }

  function freshState(heroName) {
    const st = LH.START;
    return {
      v: 1,
      name: heroName,
      map: st.map,
      x: st.x,
      y: st.y,
      dir: 'up',
      level: 1,
      xp: 0,
      gold: 0,
      hp: 22,
      mp: 0,
      bonusHp: 0,
      weapon: 'stick',
      armor: 'cloth',
      shield: null,
      accessory: null,
      items: {},
      flags: {},
      opened: {},
      playMs: 0,
      steps: 0,
      poison: false,
      checkpoint: { map: st.map, x: st.x, y: st.y }
    };
  }

  function recompute() {
    const g = LH.growth(state.level);
    const w = LH.ITEMS[state.weapon] || {};
    const a = LH.ITEMS[state.armor] || {};
    const sh = LH.ITEMS[state.shield] || {};
    const ac = LH.ITEMS[state.accessory] || {};
    state.maxHp = g.hp + (state.bonusHp || 0) + (ac.hp || 0);
    state.maxMp = g.mp + (ac.mp || 0);
    state.atk = g.atk + (w.atk || 0) + (ac.atk || 0);
    state.def = g.def + (a.def || 0) + (sh.def || 0) + (ac.def || 0);
    state.agi = g.agi + (ac.agi || 0);
    state.wis = g.wis + (ac.wis || 0);
    state.luck = 5 + (ac.luck || 0);
    if (state.hp > state.maxHp) state.hp = state.maxHp;
    if (state.mp > state.maxMp) state.mp = state.maxMp;
  }

  function saveGame() {
    if (!state) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }
  function hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  }
  function loadGame() {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    state = raw;
    recompute();
    mode = 'explore';
    enterMap(state.map, state.x, state.y, true);
    if (mode === 'explore') LH.audio.music((map && map.music) || 'field');
  }

  function gainGold(n) {
    if (settings.fast) n = Math.floor(n * LH.BALANCE.fastGold);
    state.gold = Math.max(0, Math.min(999999, state.gold + n));
  }

  function grantXp(n) {
    const ups = [];
    if (settings.fast) n = Math.floor(n * LH.BALANCE.fastXp);
    if (state.level >= LH.BALANCE.levelCap) return ups;
    state.xp += n;
    while (state.level < LH.BALANCE.levelCap && state.xp >= LH.xpToNext(state.level)) {
      state.xp -= LH.xpToNext(state.level);
      const prev = state.maxHp;
      const prevMp = state.maxMp;
      state.level++;
      recompute();
      state.hp += Math.max(0, state.maxHp - prev);
      state.mp += Math.max(0, state.maxMp - prevMp);
      ups.push(state.level);
    }
    if (state.level >= LH.BALANCE.levelCap) state.xp = 0;
    return ups;
  }

  function give(id, qty) {
    qty = qty || 1;
    const it = LH.ITEMS[id];
    if (!it) return false;
    if (it.unique && LH.owned(state, id)) return false;
    const have = state.items[id] || 0;
    if (have + qty > 20) return false;
    state.items[id] = have + qty;
    return true;
  }

  function wrap(text) {
    const words = String(text).split(' ');
    const lines = [];
    let cur = '';
    words.forEach(w => {
      const n = cur ? cur + ' ' + w : w;
      if (n.length > 28 && cur) { lines.push(cur); cur = w; }
      else cur = n;
    });
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
  }

  function say(lines, onDone) {
    const flat = [];
    (lines || []).forEach(l => wrap(l).forEach(w => flat.push(w)));
    box.lines = flat.length ? flat : ['...'];
    box.i = 0;
    box.shown = 0;
    box.ready = false;
    box.onDone = onDone || null;
    box.active = true;
  }

  function updateBox(dt, advance) {
    if (!box.active) return;
    const line = box.lines[box.i];
    const cps = LH.BALANCE.textCps * spd();
    if (box.shown < line.length) {
      box.shown += cps * dt;
      if (advance) box.shown = line.length;
      return;
    }
    if (!box.ready) {
      box.ready = true;
      box.wait = LH.BALANCE.msgHold / spd();
    }
    box.wait -= dt;
    if (advance || box.wait <= 0) {
      box.i++;
      box.shown = 0;
      box.ready = false;
      if (box.i >= box.lines.length) {
        box.active = false;
        const cb = box.onDone;
        box.onDone = null;
        if (cb) cb();
      }
    }
  }

  function enterMap(id, x, y, quiet) {
    map = LH.maps[id];
    if (!map) { say(['LOST: ' + id]); return; }
    state.map = id;
    state.x = x;
    state.y = y;
    state.light = false;
    encCd = 5;
    warpLock = true;
    fade = 1;
    if (!quiet) {
      toast = map.name;
      toastT = 1.5;
      LH.audio.music(map.music || 'field');
    }
    if (id === 'world' && !state.flags.tutorial) {
      state.flags.tutorial = true;
      saveGame();
      startBattle('puddlekin');
      return;
    }
    saveGame();
  }

  function blocked(x, y) {
    if (!map || x < 0 || y < 0 || x >= map.w || y >= map.h) return true;
    if (!LH.passable(map.tiles[y * map.w + x], state)) return true;
    if ((map.blocks || []).some(b => b.x === x && b.y === y && !state.flags[b.flag])) return true;
    if (map.npcs.some(n => n.x === x && n.y === y)) return true;
    if (map.chests.some(c => c.x === x && c.y === y)) return true;
    if (map.signs.some(s => s.x === x && s.y === y)) return true;
    return false;
  }
  function ahead(x, y, dir) {
    if (dir === 'up') return [x, y - 1];
    if (dir === 'down') return [x, y + 1];
    if (dir === 'left') return [x - 1, y];
    return [x + 1, y];
  }
  function warpAt(x, y) {
    return (map.warps || []).find(w => w.x === x && w.y === y) || null;
  }
  function triggerAt(x, y) {
    return (map.triggers || []).find(t => t.x === x && t.y === y) || null;
  }

  function tryMove(dir) {
    state.dir = dir;
    const nx = dir === 'left' ? state.x - 1 : dir === 'right' ? state.x + 1 : state.x;
    const ny = dir === 'up' ? state.y - 1 : dir === 'down' ? state.y + 1 : state.y;
    if (blocked(nx, ny)) {
      const b = (map.blocks || []).find(bl => bl.x === nx && bl.y === ny && !state.flags[bl.flag]);
      if (b && b.deny) say([b.deny]);
      else LH.audio.sfx('cancel');
      return;
    }
    const w = warpAt(nx, ny);
    state.x = nx;
    state.y = ny;
    state.steps = (state.steps || 0) + 1;
    hop = 1;
    if (state.poison && state.steps % LH.BALANCE.poisonEvery === 0) {
      state.hp -= Math.max(1, Math.round(state.maxHp * 0.05));
      if (state.hp <= 0) { die(); return; }
    }
    const lily = (map.pickups || []).find(p => p.kind === 'lily' && p.x === nx && p.y === ny);
    if (lily && !state.opened[lily.id]) {
      state.opened[lily.id] = true;
      state.items.lily = (state.items.lily || 0) + 1;
      say(['YOU PICK A MARSH LILY.']);
      saveGame();
      return;
    }
    const trig = triggerAt(nx, ny);
    if (trig && !state.flags[trig.flag]) {
      startBattle(trig.boss);
      return;
    }
    if (w) {
      if (!warpLock) {
        warpLock = true;
        enterMap(w.to, w.tx, w.ty);
        return;
      }
    } else warpLock = false;
    if (encCd > 0) encCd--;
    else rollEncounter();
    if (state.steps % 3 === 0) saveGame();
  }

  function rollEncounter() {
    let rate = 0;
    let table = null;
    if (map.encRate) {
      rate = map.encRate;
      table = map.encTable;
    } else if (map.id === 'world') {
      const ter = map.tiles[state.y * map.w + state.x];
      const info = LH.TERRAIN[ter] || {};
      rate = info.enc || 0;
      if (ter === T.ROAD) table = 'scaled';
      else if (map.region) table = map.regionNames[map.region[state.y * map.w + state.x]] || 'vale';
    }
    if (!rate || !table || Math.random() >= rate) return;
    let id;
    if (table === 'scaled') {
      const pool = Object.keys(LH.MONSTERS).filter(k => {
        const m = LH.MONSTERS[k];
        return !m.boss && m.lv >= state.level - 2 && m.lv <= state.level + 1;
      });
      id = pool.length ? pool[(Math.random() * pool.length) | 0] : 'puddlekin';
    } else {
      const list = LH.ENCOUNTERS[table] || LH.ENCOUNTERS.vale;
      id = list[(Math.random() * list.length) | 0];
    }
    encCd = LH.BALANCE.encMinSteps;
    startBattle(id);
  }

  function interact() {
    const spots = [ahead(state.x, state.y, state.dir), [state.x, state.y]];
    for (let s = 0; s < spots.length; s++) {
      const x = spots[s][0], y = spots[s][1];
      const npc = map.npcs.find(n => n.x === x && n.y === y);
      if (npc) { talkNpc(npc); return; }
      const chest = map.chests.find(c => c.x === x && c.y === y);
      if (chest) { openChest(chest); return; }
      const sign = map.signs.find(sg => sg.x === x && sg.y === y);
      if (sign) { say([sign.text]); return; }
      const f = (map.pickups || []).find(p => p.kind === 'fountain' && p.x === x && p.y === y);
      if (f) { drink(f); return; }
    }
    LH.audio.sfx('cancel');
  }

  function talkNpc(npc) {
    const fn = LH.talkers[npc.ref];
    if (!fn) { say(['...']); return; }
    const res = fn(state);
    const goldBefore = state.gold;
    say(res.lines, () => {
      if (res.apply) res.apply(state);
      const delta = state.gold - goldBefore;
      if (settings.fast && delta > 0) gainGold(Math.floor(delta * (LH.BALANCE.fastGold - 1)));
      recompute();
      saveGame();
      if (res.shop) openShop(res.shop);
      else if (res.yes) openChoice(res.yes);
    });
  }

  function openChest(c) {
    if (state.opened[c.id]) { say(['EMPTY.']); return; }
    if (c.givesFlag) {
      state.opened[c.id] = true;
      state.flags[c.givesFlag] = true;
      LH.audio.sfx('chest');
      say(['A KEY TURNS. THE WAY IS OPEN.']);
      saveGame();
      return;
    }
    if (c.item) {
      if (!give(c.item, c.qty || 1)) {
        if (LH.ITEMS[c.item] && LH.ITEMS[c.item].unique && LH.owned(state, c.item)) {
          state.opened[c.id] = true;
          say(['YOU ALREADY HOLD ' + LH.ITEMS[c.item].name + '.']);
          saveGame();
        } else say(['YOUR PACK IS FULL.']);
        return;
      }
    }
    state.opened[c.id] = true;
    if (c.gold) gainGold(c.gold);
    LH.audio.sfx('chest');
    const bits = [];
    if (c.item) bits.push(LH.ITEMS[c.item].name);
    if (c.gold) bits.push(c.gold + ' GOLD');
    say(['FOUND ' + (bits.join(' AND ') || 'DUST') + '.']);
    saveGame();
  }

  function drink(p) {
    if (state.opened[p.id]) { say(['THE SPRING IS STILL.']); return; }
    state.opened[p.id] = true;
    state.bonusHp = (state.bonusHp || 0) + 8;
    recompute();
    state.hp = state.maxHp;
    state.mp = state.maxMp;
    state.poison = false;
    LH.audio.sfx('heal');
    say(['YOU DRINK. VITALITY RISES.']);
    saveGame();
  }

  function openChoice(yes) {
    menu = {
      kind: 'choice',
      items: [{ id: 'yes', label: 'YES' }, { id: 'no', label: 'NO' }],
      cursor: 0,
      yes
    };
    mode = 'menu';
  }

  function doYes(yes) {
    mode = 'explore';
    menu = null;
    if (yes.inn != null) {
      const cost = yes.inn;
      if (state.gold < cost) { say(['NOT ENOUGH COIN.']); return; }
      state.gold -= cost;
      state.hp = state.maxHp;
      state.mp = state.maxMp;
      state.poison = false;
      state.checkpoint = { map: state.map, x: state.x, y: state.y };
      LH.audio.sfx('inn');
      say(['YOU WAKE RESTED.']);
      saveGame();
      return;
    }
    if (yes.warp) {
      const dest = LH.maps[yes.warp];
      if (dest) enterMap(yes.warp, dest.stairsUpLand.x, dest.stairsUpLand.y);
    }
  }

  function openShop(id) {
    const shop = LH.SHOPS[id];
    menu = { kind: 'shop', shop, tab: 'buy', cursor: 0 };
    mode = 'menu';
  }

  function shopList() {
    if (!menu || menu.kind !== 'shop') return [];
    if (menu.tab === 'buy') {
      return menu.shop.items.map(id => {
        const it = LH.ITEMS[id];
        return { id, label: it.name, price: it.price, item: it };
      });
    }
    const list = [];
    Object.keys(state.items).forEach(id => {
      const it = LH.ITEMS[id];
      if (!it || !it.price || state.items[id] <= 0) return;
      if (state.weapon === id || state.armor === id || state.shield === id || state.accessory === id) return;
      list.push({ id, label: it.name, price: Math.floor(it.price / 2), qty: state.items[id], item: it });
    });
    return list;
  }

  function buyItem(it) {
    if (it.unique && LH.owned(state, it.id)) { say(['YOU HAVE ONE.']); return; }
    if (state.gold < it.price) { say(['NOT ENOUGH COIN.']); return; }
    if ((state.items[it.id] || 0) >= 20) { say(['YOUR PACK IS FULL.']); return; }
    state.gold -= it.price;
    state.items[it.id] = (state.items[it.id] || 0) + 1;
    LH.audio.sfx('chest');
    saveGame();
    if (it.slot === 'weapon' || it.slot === 'armor' || it.slot === 'shield' || it.slot === 'accessory') {
      say(['BOUGHT ' + it.name + '.', 'EQUIP IT?'], () => openChoice({ equip: it.id }));
    }
  }

  function sellItem(row) {
    const have = state.items[row.id] || 0;
    if (have <= 0) return;
    state.items[row.id] = have - 1;
    if (state.items[row.id] <= 0) delete state.items[row.id];
    state.gold = Math.min(999999, state.gold + Math.floor((LH.ITEMS[row.id].price || 0) / 2));
    LH.audio.sfx('menu');
    saveGame();
  }

  function equipId(id) {
    const it = LH.ITEMS[id];
    if (!it) return;
    const slot = it.slot;
    if (slot !== 'weapon' && slot !== 'armor' && slot !== 'shield' && slot !== 'accessory') return;
    if ((state.items[id] || 0) <= 0 && state[slot] !== id) return;
    const prev = state[slot];
    if (prev && prev !== id) state.items[prev] = (state.items[prev] || 0) + 1;
    if (state[slot] !== id) {
      state.items[id] = (state.items[id] || 1) - 1;
      if (state.items[id] <= 0) delete state.items[id];
    }
    state[slot] = id;
    recompute();
    saveGame();
  }

  function openFieldMenu() {
    menu = {
      kind: 'field',
      cursor: 0,
      items: [
        { id: 'status', label: 'STATUS' },
        { id: 'spell', label: 'SPELL' },
        { id: 'item', label: 'ITEM' },
        { id: 'equip', label: 'EQUIP' },
        { id: 'options', label: 'OPTIONS' },
        { id: 'close', label: 'CLOSE' }
      ]
    };
    mode = 'menu';
  }

  function openOptions(back) {
    menu = { kind: 'options', cursor: 0, back: back || 'title' };
    mode = 'menu';
  }

  function optionRows() {
    return [
      { id: 'speed', label: 'SPEED ' + settings.speed + 'X' },
      { id: 'fast', label: 'FAST GROWTH ' + (settings.fast ? 'ON' : 'OFF') },
      { id: 'mute', label: 'MUTE ' + (settings.mute ? 'ON' : 'OFF') },
      { id: 'close', label: 'CLOSE' }
    ];
  }

  function cycleSpeed(dir) {
    const opts = [1, 2, 4, 8];
    let i = opts.indexOf(settings.speed);
    if (i < 0) i = 0;
    i = (i + dir + opts.length) % opts.length;
    settings.speed = opts[i];
    saveSettings();
    LH.audio.sfx('menu');
  }

  function learnedSpells() {
    return LH.SPELLS.filter(s => s.lv <= state.level);
  }

  function castField(sp) {
    if (state.mp < sp.mp) { say(['NOT ENOUGH MP.']); return; }
    if (sp.kind === 'heal') {
      state.mp -= sp.mp;
      const n = Math.min(state.maxHp - state.hp, sp.power + state.wis);
      state.hp += n;
      LH.audio.sfx('heal');
      say(['MEND RESTORES ' + n + '.']);
    } else if (sp.kind === 'cure') {
      state.mp -= sp.mp;
      state.poison = false;
      say(['THE POISON LEAVES.']);
    } else if (sp.kind === 'light') {
      state.mp -= sp.mp;
      state.light = true;
      say(['THE DARK RECEDES.']);
    } else if (sp.kind === 'waygate') {
      if (!map.return && !map.dungeon) { say(['NOTHING HAPPENS.']); return; }
      state.mp -= sp.mp;
      const dest = map.return;
      if (dest) enterMap(dest.map, dest.x, dest.y);
      else say(['NOTHING HAPPENS.']);
    } else say(['NOT HERE.']);
    saveGame();
  }

  function useItem(id, inBattle) {
    const it = LH.ITEMS[id];
    if (!it || (state.items[id] || 0) <= 0) return false;
    if (it.heal) {
      const n = Math.min(state.maxHp - state.hp, it.heal);
      state.hp += n;
      state.items[id]--;
      if (state.items[id] <= 0) delete state.items[id];
      LH.audio.sfx('heal');
      say([it.name + ' RESTORES ' + n + '.'], inBattle ? () => enemyTurn() : null);
      return true;
    }
    if (it.mp) {
      const n = Math.min(state.maxMp - state.mp, it.mp);
      state.mp += n;
      state.items[id]--;
      if (state.items[id] <= 0) delete state.items[id];
      say([it.name + ' RESTORES ' + n + ' MP.'], inBattle ? () => enemyTurn() : null);
      return true;
    }
    if (it.cure === 'poison') {
      state.poison = false;
      state.items[id]--;
      if (state.items[id] <= 0) delete state.items[id];
      say(['THE POISON CLEARS.'], inBattle ? () => enemyTurn() : null);
      return true;
    }
    if (it.cure === 'sleep' && inBattle) {
      battle.psleep = 0;
      state.items[id]--;
      if (state.items[id] <= 0) delete state.items[id];
      say(['YOU SHAKE AWAKE.'], () => enemyTurn());
      return true;
    }
    if (it.light && !inBattle) {
      state.light = true;
      state.items[id]--;
      if (state.items[id] <= 0) delete state.items[id];
      say(['THE TORCH CATCHES.']);
      return true;
    }
    if (it.flee && inBattle) {
      state.items[id]--;
      if (state.items[id] <= 0) delete state.items[id];
      if (battle.boss) { say(['IT WILL NOT LET YOU GO.'], () => enemyTurn()); }
      else { say(['YOU SLIP AWAY.'], () => endBattle(false)); }
      return true;
    }
    say(['NOT NOW.']);
    return false;
  }

  function usableItems(inBattle) {
    return Object.keys(state.items).filter(id => {
      const it = LH.ITEMS[id];
      if (!it || it.slot === 'quest') return false;
      if (it.heal || it.mp || it.cure || it.flee || it.light) return (state.items[id] || 0) > 0;
      return false;
    });
  }

  /* ---------- battle ---------- */
  function phys(atk, def) {
    const raw = atk * 1.12 - def * 0.5;
    const roll = 0.88 + Math.random() * 0.24;
    let d = Math.max(1, Math.round(raw * roll));
    if (Math.random() < 0.04 + (state.luck || 0) * 0.002) d = Math.round(d * 1.6);
    return d;
  }

  function startBattle(id) {
    const proto = LH.MONSTERS[id];
    if (!proto) return;
    battle = {
      id,
      name: proto.name,
      hp: proto.hp,
      maxHp: proto.hp,
      atk: proto.atk,
      def: proto.def,
      agi: proto.agi,
      res: proto.res || 0,
      kind: proto.kind,
      hue: proto.hue,
      boss: !!proto.boss,
      family: proto.family || '',
      spells: proto.spells || [],
      poison: proto.poison || 0,
      sleep: proto.sleep || 0,
      gold: proto.gold,
      xp: proto.xp,
      drop: proto.drop || null,
      weak: proto.weak || null,
      resist: proto.resist || null,
      phase2: proto.phase2 || null,
      phased: false,
      phase: 'busy',
      cursor: 0,
      ward: 0,
      haste: 0,
      stop: 0,
      esleep: 0,
      psleep: 0
    };
    mode = 'battle';
    LH.audio.music(proto.boss ? 'boss' : 'battle');
    saveGame();
    say([proto.name + ' DRAWS NEAR!'], () => beginCommand());
  }

  function beginCommand() {
    if (!battle) return;
    if (battle.psleep > 0) {
      if (Math.random() < 0.45) {
        battle.psleep = 0;
        say(['YOU WAKE.'], () => { battle.phase = 'command'; battle.cursor = 0; });
      } else {
        battle.psleep--;
        say(['YOU ARE ASLEEP.'], () => enemyTurn());
      }
      return;
    }
    battle.phase = 'command';
    battle.cursor = 0;
  }

  function playerAttack() {
    battle.phase = 'busy';
    let dmg = phys(state.atk + (battle.haste ? 2 : 0), battle.def);
    if (battle.ward > 0) { /* ward is defensive */ }
    battle.hp -= dmg;
    LH.audio.sfx('hit');
    const lines = [state.name + ' ATTACKS!', battle.name + ' TAKES ' + dmg + '.'];
    if (battle.hp <= 0) say(lines, () => winBattle());
    else say(lines, () => enemyTurn());
  }

  function elemMod(elem) {
    let m = 1;
    if (battle.weak && battle.weak[elem]) m *= battle.weak[elem];
    if (battle.resist && battle.resist[elem]) m *= battle.resist[elem];
    if (elem === 'radiant' && battle.family === 'undead' && !(battle.weak && battle.weak.radiant)) m *= 1.5;
    if (elem === 'fire' && battle.family === 'plant' && !(battle.weak && battle.weak.fire)) m *= 1.25;
    return m;
  }

  function castBattle(sp) {
    if (state.mp < sp.mp) { say(['NOT ENOUGH MP.']); battle.phase = 'command'; return; }
    state.mp -= sp.mp;
    battle.phase = 'busy';
    if (sp.kind === 'dmg') {
      const mod = elemMod(sp.elem);
      let dmg = Math.max(1, Math.round((sp.power + state.wis * 0.85 - battle.res * 0.45) * mod * (0.9 + Math.random() * 0.2)));
      battle.hp -= dmg;
      LH.audio.sfx('spell');
      const note = mod > 1.2 ? ' IT BITES DEEP.' : mod < 0.8 ? ' THE BLOW FADES.' : '';
      const lines = [state.name + ' CASTS ' + sp.name + '!', battle.name + ' TAKES ' + dmg + '.' + note];
      if (battle.hp <= 0) say(lines, () => winBattle());
      else say(lines, () => enemyTurn());
    } else if (sp.kind === 'heal') {
      const n = sp.power >= 999 ? (state.maxHp - state.hp) : Math.min(state.maxHp - state.hp, sp.power + state.wis);
      state.hp += n;
      LH.audio.sfx('heal');
      say([sp.name + ' RESTORES ' + n + '.'], () => enemyTurn());
    } else if (sp.kind === 'cure') {
      state.poison = false;
      say(['THE POISON LEAVES.'], () => enemyTurn());
    } else if (sp.kind === 'ward') {
      battle.ward = sp.turns;
      say(['A WARD RISES.'], () => enemyTurn());
    } else if (sp.kind === 'haste') {
      battle.haste = sp.turns;
      say(['YOUR STEP KINDLES.'], () => enemyTurn());
    } else if (sp.kind === 'sleep' || sp.kind === 'stop') {
      const chance = (sp.hit || 0.5) - battle.res * 0.012 - (battle.boss ? 0.15 : 0);
      if (Math.random() < chance) {
        if (sp.kind === 'sleep') battle.esleep = 2 + ((Math.random() * 2) | 0);
        else battle.stop = 1;
        say([battle.name + (sp.kind === 'sleep' ? ' SLEEPS.' : ' STILLS.')], () => enemyTurn());
      } else say(['IT RESISTS.'], () => enemyTurn());
    } else {
      state.mp += sp.mp;
      say(['NOT IN BATTLE.']);
      battle.phase = 'command';
    }
  }

  function tryRun() {
    battle.phase = 'busy';
    if (battle.boss) { say(['NO ESCAPE.'], () => enemyTurn()); return; }
    const chance = Math.max(0.12, Math.min(0.9, 0.42 + (state.agi - battle.agi) * 0.02 + state.luck * 0.005));
    if (Math.random() < chance) say(['YOU GOT AWAY.'], () => endBattle(false));
    else say(['CUT OFF!'], () => enemyTurn());
  }

  function enemyTurn() {
    if (!battle) return;
    if (battle.hp <= 0) { winBattle(); return; }
    if (battle.phase2 && !battle.phased && battle.hp <= battle.maxHp * 0.5) {
      battle.phased = true;
      battle.name = battle.phase2.name;
      battle.atk = battle.phase2.atk;
      battle.def = battle.phase2.def;
      battle.hue = battle.phase2.hue;
      battle.hp = Math.min(battle.maxHp, battle.hp + Math.round(battle.maxHp * 0.08));
      say(['THE CLOAK SPLITS. ' + battle.name + '!'], () => enemyAct());
      return;
    }
    enemyAct();
  }

  function enemyAct() {
    if (battle.esleep > 0) {
      battle.esleep--;
      if (Math.random() < 0.35) battle.esleep = 0;
      say([battle.esleep ? battle.name + ' SLEEPS.' : battle.name + ' WAKES.'], () => {
        if (battle.esleep) beginCommand(); else enemyAct();
      });
      return;
    }
    if (battle.stop > 0) {
      battle.stop--;
      say([battle.name + ' CANNOT MOVE.'], () => beginCommand());
      return;
    }
    const lines = [];
    if (battle.poisonOn) {
      const d = Math.max(1, Math.round(battle.maxHp * 0.05));
      battle.hp -= d;
      lines.push('POISON WORRIES ' + battle.name + ' FOR ' + d + '.');
      if (battle.hp <= 0) { say(lines, () => winBattle()); return; }
    }
    let acted = false;
    if (battle.spells.length && Math.random() < 0.38) {
      const sp = battle.spells[(Math.random() * battle.spells.length) | 0];
      if (Math.random() < (sp.p || 0.4)) {
        const def = LH.ENEMY_SPELLS[sp.id];
        if (def) {
          let dmg = Math.max(1, Math.round(def.power + battle.atk * 0.12 - state.def * 0.2));
          if (battle.ward > 0) dmg = Math.max(1, Math.floor(dmg * 0.65));
          state.hp -= dmg;
          if (def.poison && Math.random() < def.poison) state.poison = true;
          if (def.sleep && Math.random() < def.sleep) battle.psleep = 2;
          lines.push(battle.name + ' USES ' + def.name + '!');
          lines.push(state.name + ' TAKES ' + dmg + '.');
          acted = true;
          LH.audio.sfx('hurt');
        }
      }
    }
    if (!acted) {
      let dmg = phys(battle.atk, state.def + (battle.ward > 0 ? 8 : 0));
      if (battle.ward > 0) {
        dmg = Math.max(1, Math.floor(dmg * 0.72));
        battle.ward--;
      }
      state.hp -= dmg;
      if (battle.poison && Math.random() < battle.poison) state.poison = true;
      if (battle.sleep && Math.random() < battle.sleep) battle.psleep = 2;
      lines.push(battle.name + ' STRIKES!');
      lines.push(state.name + ' TAKES ' + dmg + '.');
      LH.audio.sfx('hurt');
    }
    if (state.poison) lines.push('POISON BITES.');
    if (state.hp <= 0) {
      state.hp = 0;
      say(lines, () => loseBattle());
    } else say(lines, () => {
      if (battle.haste > 0) battle.haste--;
      beginCommand();
    });
  }

  function winBattle() {
    const proto = LH.MONSTERS[battle.id];
    const xp = battle.xp;
    const gold = battle.gold;
    const lines = [battle.name + ' FALLS.'];
    if (xp || gold) {
      const xg = settings.fast ? Math.floor(xp * LH.BALANCE.fastXp) : xp;
      const gg = settings.fast ? Math.floor(gold * LH.BALANCE.fastGold) : gold;
      lines.push('GAINED ' + xg + ' XP AND ' + gg + ' GOLD.');
    }
    gainGold(gold);
    if (battle.drop && Math.random() < battle.drop.p) {
      if (give(battle.drop.item, 1)) lines.push('FOUND ' + LH.ITEMS[battle.drop.item].name + '.');
    }
    state.flags['dead-' + battle.id] = true;
    if (proto.win) proto.win(state);
    if (WIN_LINES[battle.id]) lines.push(WIN_LINES[battle.id]);
    const ups = grantXp(xp);
    ups.forEach(lv => {
      lines.push(state.name + ' REACHES LEVEL ' + lv + '!');
      LH.SPELLS.filter(s => s.lv === lv).forEach(s => lines.push('LEARNED ' + s.name + '.'));
    });
    recompute();
    const bossId = battle.id;
    say(lines, () => {
      LH.audio.sfx(ups.length ? 'level' : 'victory');
      if (bossId === 'sovereign') startEnding();
      else endBattle(true);
    });
  }

  function loseBattle() {
    LH.audio.sfx('die');
    battle = null;
    die();
  }

  function endBattle() {
    battle = null;
    mode = 'explore';
    encCd = LH.BALANCE.encMinSteps + 2;
    LH.audio.music(map.music || 'field');
    saveGame();
  }

  function die() {
    battle = null;
    state.gold = Math.floor(state.gold / 2);
    state.poison = false;
    recompute();
    state.hp = state.maxHp;
    state.mp = state.maxMp;
    const c = state.checkpoint || { map: LH.START.map, x: LH.START.x, y: LH.START.y };
    mode = 'explore';
    enterMap(c.map, c.x, c.y);
    say(['THE LANTERN GOES DARK.', 'YOU WAKE UNDER A FAMILIAR ROOF. HALF YOUR GOLD WAS LOST.']);
  }

  function startEnding() {
    mode = 'ending';
    state.flags.ending = true;
    battle = null;
    LH.audio.music('ending');
    say([
      'THE SPIRE INHALES. THE FIVE LAMPS ANSWER.',
      'A THIN DAWN TOUCHES DUSKREACH.',
      state.name + ', THE LANTERN HOLDS.',
      'QUEEN MAELIS IS WAITING.',
      'THE END'
    ], () => {
      recompute();
      state.hp = state.maxHp;
      state.mp = state.maxMp;
      state.poison = false;
      state.checkpoint = { map: 'firstkeep', x: LH.START.x, y: LH.START.y };
      enterMap('firstkeep', LH.START.x, LH.START.y);
      mode = 'explore';
    });
  }

  function newGame(hero) {
    state = freshState(hero.slice(0, 8) || 'ALDER');
    recompute();
    state.hp = state.maxHp;
    state.mp = state.maxMp;
    mode = 'explore';
    enterMap(LH.START.map, LH.START.x, LH.START.y);
    const queen = map.npcs.find(n => n.ref === 'queen');
    if (queen) talkNpc(queen);
  }

  /* ---------- input ---------- */
  function press(k) {
    if (!held[k]) edges[k] = true;
    held[k] = true;
    if (k === 'up' || k === 'down' || k === 'left' || k === 'right') lastDir = k;
  }
  function release(k) { held[k] = false; }
  function takeEdges() {
    const e = {
      up: edges.up, down: edges.down, left: edges.left, right: edges.right, a: edges.a, b: edges.b
    };
    edges.up = edges.down = edges.left = edges.right = edges.a = edges.b = false;
    return e;
  }
  function dirHeld() {
    if (held[lastDir]) return lastDir;
    if (held.up) return 'up';
    if (held.down) return 'down';
    if (held.left) return 'left';
    if (held.right) return 'right';
    return null;
  }

  function bindHold(el, key) {
    if (!el) return;
    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      LH.audio.unlock();
      press(key);
    });
    const up = e => { e.preventDefault(); release(key); };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  const KEYMAP = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', W: 'up', s: 'down', S: 'down', a: 'left', A: 'left', d: 'right', D: 'right',
    z: 'a', Z: 'a', Enter: 'a', x: 'b', X: 'b', Escape: 'b', Backspace: 'b'
  };
  window.addEventListener('keydown', e => {
    const k = KEYMAP[e.key];
    if (!k) return;
    e.preventDefault();
    if (e.repeat) return;
    LH.audio.unlock();
    press(k);
  });
  window.addEventListener('keyup', e => {
    const k = KEYMAP[e.key];
    if (k) release(k);
  });
  window.addEventListener('pointerdown', () => LH.audio.unlock());

  /* ---------- update ---------- */
  function moveCursor(listLen, edge, dt) {
    if (!menu) return;
    if (edge.up || edge.down) {
      menu.cursor = (menu.cursor + (edge.up ? -1 : 1) + listLen) % listLen;
      repT = 0.28;
      LH.audio.sfx('menu');
      return;
    }
    const d = dirHeld();
    if ((d === 'up' || d === 'down') && listLen) {
      repT -= dt;
      if (repT <= 0) {
        menu.cursor = (menu.cursor + (d === 'up' ? -1 : 1) + listLen) % listLen;
        repT = 0.14 / Math.sqrt(spd());
        LH.audio.sfx('menu');
      }
    }
  }

  function updateExplore(dt, edge) {
    const d = dirHeld();
    if (d) {
      moveT -= dt;
      if (moveT <= 0) {
        tryMove(d);
        moveT = (LH.BALANCE.stepMs / 1000) / spd();
      }
    } else moveT = 0;
    if (hop > 0) hop = Math.max(0, hop - dt * spd() * 4);
    if (edge.a) interact();
    else if (edge.b) openFieldMenu();
  }

  function updateTitle(edge) {
    const items = titleItems();
    if (edge.up || edge.down) {
      titleCur = (titleCur + (edge.up ? -1 : 1) + items.length) % items.length;
      LH.audio.sfx('menu');
    }
    if (edge.a) {
      const it = items[titleCur];
      if (it.id === 'new') {
        if (hasSave()) {
          menu = {
            kind: 'choice',
            items: [{ id: 'yes', label: 'YES' }, { id: 'no', label: 'NO' }],
            cursor: 1,
            yes: { overwrite: true }
          };
          mode = 'menu';
        } else { mode = 'name'; name = 'ALDER'; nameRow = 3; nameCol = 6; }
      } else if (it.id === 'cont' && hasSave()) {
        try { loadGame(); } catch (e) { say(['SAVE COULD NOT BE READ.']); mode = 'title'; }
      } else if (it.id === 'opt') openOptions('title');
      else LH.audio.sfx('cancel');
    }
  }

  function titleItems() {
    return [
      { id: 'new', label: 'NEW GAME' },
      { id: 'cont', label: 'CONTINUE', disabled: !hasSave() },
      { id: 'opt', label: 'OPTIONS' }
    ];
  }

  function updateName(edge) {
    const row = NAME_ROWS[nameRow];
    if (edge.left) { nameCol = (nameCol - 1 + row.length) % row.length; LH.audio.sfx('menu'); }
    if (edge.right) { nameCol = (nameCol + 1) % row.length; LH.audio.sfx('menu'); }
    if (edge.up) {
      nameRow = (nameRow + NAME_ROWS.length - 1) % NAME_ROWS.length;
      nameCol = Math.min(nameCol, NAME_ROWS[nameRow].length - 1);
      LH.audio.sfx('menu');
    }
    if (edge.down) {
      nameRow = (nameRow + 1) % NAME_ROWS.length;
      nameCol = Math.min(nameCol, NAME_ROWS[nameRow].length - 1);
      LH.audio.sfx('menu');
    }
    if (edge.a) {
      const cell = NAME_ROWS[nameRow][nameCol];
      if (cell === 'OK') {
        if (!name.length) { LH.audio.sfx('cancel'); return; }
        newGame(name);
      } else if (cell === 'DEL') name = name.slice(0, -1);
      else if (name.length < 8) name += cell;
    }
    if (edge.b) name = name.slice(0, -1);
  }

  function updateMenu(edge, dt) {
    if (!menu) { mode = 'explore'; return; }
    if (menu.kind === 'shop') {
      const list = shopList();
      if (!list.length) menu.cursor = 0;
      else if (menu.cursor >= list.length) menu.cursor = list.length - 1;
      const len = Math.max(1, list.length);
      moveCursor(len, edge, dt);
      if (edge.left || edge.right) menu.tab = menu.tab === 'buy' ? 'sell' : 'buy';
      if (edge.b) { mode = 'explore'; menu = null; return; }
      if (edge.a && list.length) {
        const row = list[menu.cursor % list.length];
        if (menu.tab === 'buy') buyItem(row.item);
        else sellItem(row);
      }
      return;
    }
    if (menu.kind === 'options') {
      const rows = optionRows();
      moveCursor(rows.length, edge, dt);
      const id = rows[menu.cursor].id;
      if (id === 'speed' && (edge.left || edge.right || edge.a)) cycleSpeed(edge.left ? -1 : 1);
      if (edge.a && id === 'fast') { settings.fast = !settings.fast; saveSettings(); LH.audio.sfx('menu'); }
      if (edge.a && id === 'mute') { settings.mute = !settings.mute; saveSettings(); }
      if ((edge.a && id === 'close') || edge.b) {
        if (menu.back === 'title') { mode = 'title'; menu = null; }
        else { openFieldMenu(); }
      }
      return;
    }
    if (menu.kind === 'choice') {
      moveCursor(2, edge, dt);
      if (edge.b || (edge.a && menu.items[menu.cursor].id === 'no')) {
        mode = menu.yes && menu.yes.overwrite ? 'title' : 'explore';
        menu = null;
        return;
      }
      if (edge.a && menu.items[menu.cursor].id === 'yes') {
        const yes = menu.yes;
        if (yes.overwrite) { mode = 'name'; name = 'ALDER'; nameRow = 3; nameCol = 6; menu = null; return; }
        if (yes.equip) { equipId(yes.equip); mode = 'explore'; menu = null; say(['EQUIPPED.']); return; }
        doYes(yes);
      }
      return;
    }
    const items = menu.kind === 'field' ? menu.items : menu.items;
    moveCursor(items.length, edge, dt);
    if (edge.b) {
      if (menu.kind === 'field') { mode = 'explore'; menu = null; }
      else if (menu.parent) menu = menu.parent;
      else { mode = 'explore'; menu = null; }
      return;
    }
    if (!edge.a) return;
    const pick = items[menu.cursor];
    if (menu.kind === 'field') {
      if (pick.id === 'close') { mode = 'explore'; menu = null; }
      else if (pick.id === 'status') menu = { kind: 'status', cursor: 0, items: [{ id: 'back', label: 'CLOSE' }], parent: menu };
      else if (pick.id === 'options') openOptions('field');
      else if (pick.id === 'spell') {
        const spells = learnedSpells().filter(s => s.field);
        menu = {
          kind: 'spell',
          cursor: 0,
          parent: menu,
          items: spells.map(s => ({ id: s.id, label: s.name + ' ' + s.mp + 'MP', spell: s })).concat([{ id: 'back', label: 'BACK' }])
        };
      } else if (pick.id === 'item') {
        const ids = usableItems(false);
        menu = {
          kind: 'item',
          cursor: 0,
          parent: menu,
          items: ids.map(id => ({ id, label: LH.ITEMS[id].name + ' x' + state.items[id] })).concat([{ id: 'back', label: 'BACK' }])
        };
      } else if (pick.id === 'equip') {
        menu = {
          kind: 'equip',
          cursor: 0,
          parent: menu,
          items: [
            { id: 'weapon', label: 'WEAPON' },
            { id: 'armor', label: 'ARMOR' },
            { id: 'shield', label: 'SHIELD' },
            { id: 'accessory', label: 'RING' },
            { id: 'back', label: 'BACK' }
          ]
        };
      }
      return;
    }
    if (pick.id === 'back') { menu = menu.parent || null; if (!menu) mode = 'explore'; return; }
    if (menu.kind === 'spell' && pick.spell) {
      const sp = pick.spell;
      mode = 'explore';
      const parent = null;
      menu = null;
      castField(sp);
      return;
    }
    if (menu.kind === 'item' && pick.id !== 'back') {
      const id = pick.id;
      mode = 'explore';
      menu = null;
      useItem(id, false);
      saveGame();
      return;
    }
    if (menu.kind === 'equip' && pick.id !== 'back') {
      const slot = pick.id;
      const choices = Object.keys(LH.ITEMS).filter(id => {
        const it = LH.ITEMS[id];
        return it.slot === slot && ((state.items[id] || 0) > 0 || state[slot] === id);
      }).map(id => ({ id, label: LH.ITEMS[id].name + (state[slot] === id ? ' *' : '') }));
      choices.push({ id: 'none', label: 'UNEQUIP' });
      choices.push({ id: 'back', label: 'BACK' });
      menu = { kind: 'equip-pick', slot, cursor: 0, parent: menu, items: choices };
      return;
    }
    if (menu.kind === 'equip-pick') {
      if (pick.id === 'none') {
        const slot = menu.slot;
        if (state[slot]) {
          state.items[state[slot]] = (state.items[state[slot]] || 0) + 1;
          state[slot] = null;
          recompute();
          saveGame();
        }
      } else equipId(pick.id);
      menu = menu.parent;
    }
  }

  function updateBattle(edge) {
    if (!battle || battle.phase === 'busy') return;
    if (battle.phase === 'command') {
      const cmds = ['FIGHT', 'SPELL', 'ITEM', 'RUN'];
      if (edge.up || edge.down) {
        battle.cursor = (battle.cursor + (edge.up ? -1 : 1) + cmds.length) % cmds.length;
        LH.audio.sfx('menu');
      }
      if (edge.a) {
        const cmd = cmds[battle.cursor];
        if (cmd === 'FIGHT') playerAttack();
        else if (cmd === 'RUN') tryRun();
        else if (cmd === 'SPELL') { battle.phase = 'spell'; battle.sub = 0; }
        else if (cmd === 'ITEM') { battle.phase = 'item'; battle.sub = 0; }
      }
      return;
    }
    if (battle.phase === 'spell') {
      const spells = learnedSpells().filter(s => s.kind !== 'light' && s.kind !== 'waygate');
      const len = spells.length || 1;
      if (edge.up || edge.down) battle.sub = (battle.sub + (edge.up ? -1 : 1) + len) % len;
      if (edge.b) { battle.phase = 'command'; return; }
      if (edge.a && spells.length) castBattle(spells[battle.sub]);
      return;
    }
    if (battle.phase === 'item') {
      const ids = usableItems(true);
      const len = ids.length || 1;
      if (edge.up || edge.down) battle.sub = (battle.sub + (edge.up ? -1 : 1) + len) % len;
      if (edge.b) { battle.phase = 'command'; return; }
      if (edge.a && ids.length) useItem(ids[battle.sub], true);
    }
  }

  function update(dt, edge) {
    anim += dt;
    if (toastT > 0) toastT -= dt;
    if (fade > 0) fade = Math.max(0, fade - dt / (LH.BALANCE.fadeMs / 1000 / spd()));
    if (state && mode !== 'title' && mode !== 'name') state.playMs = (state.playMs || 0) + dt * 1000;
    if (box.active) {
      updateBox(dt, edge.a || edge.b);
      return;
    }
    if (mode === 'title') updateTitle(edge);
    else if (mode === 'name') updateName(edge);
    else if (mode === 'menu') updateMenu(edge, dt);
    else if (mode === 'battle') updateBattle(edge);
    else if (mode === 'explore') updateExplore(dt, edge);
  }

  /* ---------- draw ---------- */
  function clear() {
    ctx.fillStyle = '#07060a';
    ctx.fillRect(0, 0, VW, VH);
  }

  function drawMap() {
    if (!map || !state) return;
    const camX = Math.max(0, Math.min(map.w * TILE - VW, state.x * TILE - (VW >> 1) + 8));
    const camY = Math.max(0, Math.min(map.h * TILE - VH, state.y * TILE - (VH >> 1) + 8));
    const x0 = Math.max(0, (camX / TILE) | 0);
    const y0 = Math.max(0, (camY / TILE) | 0);
    const x1 = Math.min(map.w, x0 + (VW / TILE) + 2);
    const y1 = Math.min(map.h, y0 + (VH / TILE) + 2);
    const frame = ((anim * spd()) | 0) % 2;
    const dark = map.dark && !state.light;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        if (dark && (Math.abs(x - state.x) + Math.abs(y - state.y) > 3)) continue;
        const ter = map.tiles[y * map.w + x];
        gfx.drawTile(ctx, ter, x * TILE - camX, y * TILE - camY, frame, state);
      }
    }
    const drawObj = (x, y, fn) => fn(x * TILE - camX, y * TILE - camY);
    (map.pickups || []).forEach(p => {
      if (p.kind === 'fountain') {
        drawObj(p.x, p.y, (px, py) => {
          ctx.fillStyle = '#3a6a88';
          ctx.fillRect(px + 3, py + 8, 10, 6);
          ctx.fillStyle = state.opened[p.id] ? '#6aa0b8' : '#9ad0e8';
          ctx.fillRect(px + 5, py + 6, 6, 4);
        });
      } else if (p.kind === 'lily' && !state.opened[p.id]) {
        drawObj(p.x, p.y, (px, py) => {
          ctx.fillStyle = '#d8e8ff';
          ctx.fillRect(px + 7, py + 4, 2, 8);
          ctx.fillStyle = '#f4f0ff';
          ctx.fillRect(px + 5, py + 3, 6, 3);
        });
      }
    });
    map.chests.forEach(c => {
      drawObj(c.x, c.y, (px, py) => {
        ctx.fillStyle = state.opened[c.id] ? '#5a4030' : '#a87830';
        ctx.fillRect(px + 3, py + 6, 10, 7);
        ctx.fillStyle = '#f2d36a';
        ctx.fillRect(px + 3, py + 6, 10, 2);
      });
    });
    map.signs.forEach(s => {
      drawObj(s.x, s.y, (px, py) => {
        ctx.fillStyle = '#6a5030';
        ctx.fillRect(px + 7, py + 4, 2, 10);
        ctx.fillStyle = '#e6d2a4';
        ctx.fillRect(px + 3, py + 3, 10, 6);
      });
    });
    const ents = map.npcs.map(n => ({ y: n.y, n })).concat([{ y: state.y, hero: true }]);
    ents.sort((a, b) => a.y - b.y);
    ents.forEach(e => {
      if (e.hero) {
        const bob = hop > 0.5 ? -1 : 0;
        gfx.drawHero(ctx, state.dir, state.x * TILE - camX, state.y * TILE - camY + bob, hop > 0 && ((anim * 8) | 0) % 2 === 0);
      } else if (!dark || Math.abs(e.n.x - state.x) + Math.abs(e.n.y - state.y) <= 3) {
        gfx.drawNpc(ctx, e.n.sprite, e.n.x * TILE - camX, e.n.y * TILE - camY);
      }
    });
  }

  function hud() {
    if (!state) return;
    ctx.fillStyle = 'rgba(8,6,12,0.88)';
    ctx.fillRect(0, 0, VW, 18);
    gfx.drawText(ctx, state.name + ' LV' + state.level, 4, 2, '#f4e6c8', 1);
    gfx.drawText(ctx, 'HP' + state.hp, 4, 10, state.hp < state.maxHp * 0.3 ? '#e07070' : '#c8e0b0', 1);
    gfx.drawText(ctx, 'MP' + state.mp, 52, 10, '#a8c8f0', 1);
    gfx.drawText(ctx, 'G' + state.gold, 100, 10, '#f2d36a', 1);
    if (state.poison) gfx.drawText(ctx, 'PSN', 150, 2, '#80c060', 1);
  }

  function drawBox() {
    if (!box.active) return;
    gfx.frameRect(ctx, 4, VH - 52, VW - 8, 48);
    const line = box.lines[box.i] || '';
    const shown = line.slice(0, Math.floor(box.shown));
    const parts = wrap(shown);
    gfx.drawText(ctx, parts[0] || '', 10, VH - 44, '#f4e6c8', 1);
    if (parts[1]) gfx.drawText(ctx, parts[1], 10, VH - 34, '#f4e6c8', 1);
    if (box.ready && (Math.floor(anim * 3) % 2 === 0)) gfx.drawText(ctx, '>', VW - 16, VH - 18, '#f2d36a', 1);
  }

  function drawToast() {
    if (toastT > 0 && toast) {
      gfx.frameRect(ctx, 36, 28, 120, 18);
      gfx.drawText(ctx, toast, 42, 33, '#f4e6c8', 1);
    }
  }

  function menuItemsNow() {
    if (!menu) return [];
    if (menu.kind === 'options') return optionRows();
    if (menu.kind === 'shop') return shopList();
    return menu.items || [];
  }

  function drawMenuBox(title, rows, cursor) {
    gfx.frameRect(ctx, 16, 36, 160, 150);
    if (title) gfx.drawText(ctx, title, 24, 42, '#f2d36a', 1);
    const start = Math.max(0, cursor - 6);
    rows.slice(start, start + 7).forEach((r, i) => {
      const on = start + i === cursor;
      const col = r.disabled ? '#6a6058' : on ? '#f2d36a' : '#f4e6c8';
      const label = (on ? '> ' : '  ') + (r.label || r.id || '');
      gfx.drawText(ctx, label, 24, 56 + i * 12, col, 1);
    });
  }

  function drawMenu() {
    if (!menu) return;
    if (menu.kind === 'status') {
      gfx.frameRect(ctx, 6, 22, 180, 196);
      const lines = statusLines();
      lines.forEach((l, i) => gfx.drawText(ctx, l, 12, 28 + i * 10, '#f4e6c8', 1));
      return;
    }
    if (menu.kind === 'shop') {
      const rows = shopList();
      gfx.frameRect(ctx, 8, 28, 176, 168);
      gfx.drawText(ctx, menu.shop.name, 14, 34, '#f2d36a', 1);
      gfx.drawText(ctx, menu.tab === 'buy' ? 'BUY' : 'SELL', 14, 46, '#f4e6c8', 1);
      gfx.drawText(ctx, 'G' + state.gold, 100, 46, '#f2d36a', 1);
      const start = Math.max(0, menu.cursor - 5);
      rows.slice(start, start + 6).forEach((r, i) => {
        const on = start + i === menu.cursor;
        gfx.drawText(ctx, (on ? '>' : ' ') + r.label, 14, 62 + i * 12, on ? '#f2d36a' : '#f4e6c8', 1);
        gfx.drawText(ctx, String(r.price), 132, 62 + i * 12, '#f2d36a', 1);
      });
      if (!rows.length) gfx.drawText(ctx, 'NOTHING', 14, 70, '#f4e6c8', 1);
      gfx.drawText(ctx, 'B CLOSE  L/R TAB', 14, 176, '#a89880', 1);
      return;
    }
    const title = menu.kind === 'options' ? 'OPTIONS' : menu.kind === 'choice' ? 'CHOOSE' : '';
    drawMenuBox(title, menuItemsNow(), menu.cursor || 0);
    if (menu.kind === 'options') {
      gfx.drawText(ctx, 'ARROWS Z X', 24, 160, '#a89880', 1);
    }
  }

  function statusLines() {
    const w = LH.ITEMS[state.weapon];
    const a = LH.ITEMS[state.armor];
    const sh = LH.ITEMS[state.shield];
    const ac = LH.ITEMS[state.accessory];
    const next = state.level >= LH.BALANCE.levelCap ? 'MAX' : state.xp + '/' + LH.xpToNext(state.level);
    const goal = wrap(LH.goalText(state));
    const mins = Math.floor((state.playMs || 0) / 60000);
    const lines = [
      state.name + '  LV ' + state.level,
      'XP ' + next,
      'HP ' + state.hp + '/' + state.maxHp,
      'MP ' + state.mp + '/' + state.maxMp,
      'ATK ' + state.atk + ' DEF ' + state.def,
      'AGI ' + state.agi + ' WIS ' + state.wis,
      'GOLD ' + state.gold,
      w ? w.name : 'NO WEAPON',
      a ? a.name : 'NO ARMOR',
      sh ? sh.name : 'NO SHIELD',
      ac ? ac.name : 'NO RING',
      'LAMPS ' + LH.lampsSet(state) + '/5',
      'TIME ' + mins + ' MIN'
    ];
    goal.forEach(g => lines.push(g));
    return lines.slice(0, 16);
  }

  function drawBattle() {
    if (!battle) return;
    ctx.fillStyle = '#14101c';
    ctx.fillRect(0, 0, VW, VH);
    ctx.fillStyle = '#241c30';
    ctx.fillRect(0, 96, VW, 40);
    const mon = {
      name: battle.name, hue: battle.hue, kind: battle.kind
    };
    gfx.drawMonster(ctx, mon, 72, 18, ((anim * 2) | 0) % 2 === 0);
    gfx.drawText(ctx, battle.name, 8, 78, '#f4e6c8', 1);
    const ratio = Math.max(0, battle.hp / battle.maxHp);
    ctx.fillStyle = '#2a2030';
    ctx.fillRect(8, 90, 100, 5);
    ctx.fillStyle = ratio > 0.5 ? '#70b060' : ratio > 0.25 ? '#d0a040' : '#c05050';
    ctx.fillRect(8, 90, Math.round(100 * ratio), 5);
    gfx.drawText(ctx, 'HP ' + state.hp + '/' + state.maxHp, 112, 100, '#c8e0b0', 1);
    gfx.drawText(ctx, 'MP ' + state.mp + '/' + state.maxMp, 112, 110, '#a8c8f0', 1);
    if (!box.active && battle.phase === 'command') {
      gfx.frameRect(ctx, 6, 130, 90, 70);
      ['FIGHT', 'SPELL', 'ITEM', 'RUN'].forEach((c, i) => {
        gfx.drawText(ctx, (battle.cursor === i ? '>' : ' ') + c, 12, 138 + i * 14, battle.cursor === i ? '#f2d36a' : '#f4e6c8', 1);
      });
    }
    if (!box.active && (battle.phase === 'spell' || battle.phase === 'item')) {
      gfx.frameRect(ctx, 6, 120, 180, 96);
      let rows = [];
      if (battle.phase === 'spell') {
        rows = learnedSpells().filter(s => s.kind !== 'light' && s.kind !== 'waygate')
          .map(s => s.name + ' ' + s.mp);
      } else {
        rows = usableItems(true).map(id => LH.ITEMS[id].name + ' x' + state.items[id]);
      }
      if (!rows.length) gfx.drawText(ctx, 'NONE', 14, 130, '#f4e6c8', 1);
      const start = Math.max(0, battle.sub - 4);
      rows.slice(start, start + 5).forEach((r, i) => {
        const on = start + i === battle.sub;
        gfx.drawText(ctx, (on ? '>' : ' ') + r, 12, 128 + i * 12, on ? '#f2d36a' : '#f4e6c8', 1);
      });
    }
  }

  function drawTitle() {
    clear();
    gfx.ell(ctx, 96, 48, 18, 22, '#3a2410');
    gfx.ell(ctx, 96, 40, 10, 12, '#e6a030');
    gfx.ell(ctx, 96, 36, 4, 6, '#fff0c0');
    ctx.fillStyle = '#6a4020';
    ctx.fillRect(90, 62, 12, 16);
    gfx.drawText(ctx, 'LANTERN', 42, 86, '#f2d36a', 2);
    gfx.drawText(ctx, 'HEIR', 66, 106, '#f4e6c8', 2);
    gfx.drawText(ctx, 'DUSKREACH', 60, 128, '#a89880', 1);
    const items = titleItems();
    items.forEach((it, i) => {
      const on = i === titleCur;
      const col = it.disabled ? '#5a5048' : on ? '#f2d36a' : '#f4e6c8';
      gfx.drawText(ctx, (on ? '> ' : '  ') + it.label, 52, 150 + i * 16, col, 1);
    });
    if (LH.buildErrors && LH.buildErrors.length) {
      gfx.drawText(ctx, 'MAP ERROR', 8, 210, '#e07070', 1);
    }
  }

  function drawName() {
    clear();
    gfx.drawText(ctx, 'NAME THE HEIR', 42, 8, '#f2d36a', 1);
    gfx.frameRect(ctx, 36, 22, 120, 16);
    gfx.drawText(ctx, name || '_', 42, 26, '#f4e6c8', 1);
    NAME_ROWS.forEach((row, r) => {
      row.forEach((cell, c) => {
        const on = r === nameRow && c === nameCol;
        gfx.drawText(ctx, cell, 16 + c * 22, 52 + r * 18, on ? '#f2d36a' : '#f4e6c8', 1);
      });
    });
    gfx.drawText(ctx, 'A PICK  B ERASE', 28, 200, '#a89880', 1);
  }

  function draw() {
    clear();
    if (mode === 'title') drawTitle();
    else if (mode === 'name') drawName();
    else if (mode === 'battle' || (battle && box.active && mode === 'battle')) {
      drawBattle();
    } else if (state && map && mode !== 'ending') {
      drawMap();
      hud();
      drawToast();
      if (mode === 'menu') drawMenu();
    } else if (mode === 'ending') {
      ctx.fillStyle = '#1a140c';
      ctx.fillRect(0, 0, VW, VH);
      gfx.ell(ctx, 96, 70, 20, 24, '#e6b050');
      gfx.drawText(ctx, 'DAWN', 72, 110, '#f2d36a', 2);
    }
    if (mode === 'battle' || mode === 'explore' || mode === 'menu' || mode === 'ending') drawBox();
    if (fade > 0) {
      ctx.fillStyle = 'rgba(0,0,0,' + fade + ')';
      ctx.fillRect(0, 0, VW, VH);
    }
    const root = document.documentElement;
    root.dataset.mode = mode;
    root.dataset.box = box.active ? '1' : '0';
    root.dataset.boxi = String(box.i);
    root.dataset.boxn = String(box.lines.length);
    root.dataset.speed = String(settings.speed);
    if (state) {
      root.dataset.map = state.map || '';
      root.dataset.x = String(state.x);
      root.dataset.y = String(state.y);
      root.dataset.level = String(state.level);
      root.dataset.battle = battle ? battle.id : '';
    }
  }

  function frame(ts) {
    const dt = Math.min(0.05, lastTs ? (ts - lastTs) / 1000 : 0.016);
    lastTs = ts;
    if (document.hidden) { requestAnimationFrame(frame); return; }
    const edge = takeEdges();
    try { update(dt, edge); }
    catch (err) {
      console.error(err);
      gfx.drawText(ctx, 'ERROR', 8, 8, '#e07070', 1);
    }
    try { draw(); }
    catch (err) { console.error(err); }
    requestAnimationFrame(frame);
  }

  function layout() {
    const stage = document.getElementById('stage');
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const sx = rect.width / VW;
    const sy = rect.height / VH;
    let scale = Math.min(sx, sy);
    const int = Math.floor(scale);
    if (int >= 2) scale = int;
    else if (int >= 1 && scale - int < 0.2) scale = int;
    canvas.style.width = Math.floor(VW * scale) + 'px';
    canvas.style.height = Math.floor(VH * scale) + 'px';
  }

  function boot() {
    LH.buildAll();
    if (LH.buildErrors && LH.buildErrors.length) console.warn(LH.buildErrors);
    saveSettings();
    document.querySelectorAll('#dpad button').forEach(b => bindHold(b, b.dataset.k));
    bindHold(document.getElementById('btn-a'), 'a');
    bindHold(document.getElementById('btn-b'), 'b');
    document.getElementById('btn-mute').addEventListener('pointerdown', e => {
      e.preventDefault();
      settings.mute = !settings.mute;
      saveSettings();
      LH.audio.unlock();
    });
    document.getElementById('btn-fs').addEventListener('pointerdown', e => {
      e.preventDefault();
      const el = document.documentElement;
      if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => {});
      else if (document.exitFullscreen) document.exitFullscreen();
    });
    window.addEventListener('resize', layout);
    window.addEventListener('orientationchange', layout);
    document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
    layout();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
    LH.audio.music('title');
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
