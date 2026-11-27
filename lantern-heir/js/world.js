/* Lantern Heir — overworld, towns, and serpentine dungeons. */
(function (root) {
  const LH = root.LH = root.LH || {};
  const T = LH.T;
  const RW = 9, RH = 7, GAP = 7, PAD = 3;

  function idx(w, x, y) { return y * w + x; }

  function makeMap(id, name, w, h) {
    return {
      id, name, w, h,
      tiles: new Uint8Array(w * h),
      npcs: [], chests: [], signs: [], pickups: [], warps: [],
      blocks: [], triggers: [],
      music: 'field', tileset: 'world', encRate: 0
    };
  }

  function setTile(map, x, y, t) {
    if (x < 0 || y < 0 || x >= map.w || y >= map.h) return false;
    map.tiles[idx(map.w, x, y)] = t;
    return true;
  }
  function getTile(map, x, y) {
    if (x < 0 || y < 0 || x >= map.w || y >= map.h) return T.NONE;
    return map.tiles[idx(map.w, x, y)];
  }

  function hash(x, y) {
    let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) >>> 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
    return (n ^ (n >>> 16)) >>> 0;
  }

  function carvePolyline(map, pts) {
    const out = [];
    function push(x, y) {
      x = x | 0; y = y | 0;
      if (!setTile(map, x, y, T.ROAD)) return;
      const last = out[out.length - 1];
      if (!last || last[0] !== x || last[1] !== y) out.push([x, y]);
    }
    for (let i = 0; i < pts.length - 1; i++) {
      let x = pts[i][0], y = pts[i][1];
      const x2 = pts[i + 1][0], y2 = pts[i + 1][1];
      const dx = Math.sign(x2 - x), dy = Math.sign(y2 - y);
      push(x, y);
      if (dx && dy) throw new Error('diagonal road segment');
      while (x !== x2 || y !== y2) {
        x += dx; y += dy;
        push(x, y);
      }
    }
    if (pts.length === 1) push(pts[0][0], pts[0][1]);
    return out;
  }

  function switchback(seg) {
    const pts = [];
    const step = Math.max(1, seg.step | 0);
    const amp = seg.amp | 0;
    if (seg.axis === 'h') {
      const y = seg.y, x1 = seg.x1, x2 = seg.x2;
      const dir = x2 >= x1 ? 1 : -1;
      pts.push([x1, y]);
      let x = x1, side = 1;
      let guard = 0;
      while (x !== x2) {
        if (++guard > 5000) break;
        let nx = x + dir * step;
        if ((dir > 0 && nx > x2) || (dir < 0 && nx < x2)) nx = x2;
        if (amp > 0 && nx !== x2) {
          pts.push([x, y + side * amp]);
          pts.push([nx, y + side * amp]);
          pts.push([nx, y]);
        } else pts.push([nx, y]);
        side = -side;
        x = nx;
      }
    } else {
      const x = seg.x, y1 = seg.y1, y2 = seg.y2;
      const dir = y2 >= y1 ? 1 : -1;
      pts.push([x, y1]);
      let y = y1, side = 1;
      let guard = 0;
      while (y !== y2) {
        if (++guard > 5000) break;
        let ny = y + dir * step;
        if ((dir > 0 && ny > y2) || (dir < 0 && ny < y2)) ny = y2;
        if (amp > 0 && ny !== y2) {
          pts.push([x + side * amp, y]);
          pts.push([x + side * amp, ny]);
          pts.push([x, ny]);
        } else pts.push([x, ny]);
        side = -side;
        y = ny;
      }
    }
    return pts;
  }

  function walkable(map, x, y, state) {
    if (x < 0 || y < 0 || x >= map.w || y >= map.h) return false;
    if (!LH.passable(getTile(map, x, y), state)) return false;
    if (map.blocks) {
      for (let i = 0; i < map.blocks.length; i++) {
        const b = map.blocks[i];
        if (b.x === x && b.y === y && !(state && state.flags && state.flags[b.flag])) return false;
      }
    }
    return true;
  }

  LH.walkable = walkable;

  LH.bfs = function (map, sx, sy, tx, ty, state) {
    const w = map.w, h = map.h;
    if (sx < 0 || sy < 0 || tx < 0 || ty < 0 || sx >= w || tx >= w || sy >= h || ty >= h) return -1;
    const seen = new Uint8Array(w * h);
    const dist = new Int32Array(w * h);
    const qx = new Int32Array(w * h);
    const qy = new Int32Array(w * h);
    let qs = 0, qe = 0;
    const s0 = idx(w, sx, sy);
    seen[s0] = 1;
    qx[qe] = sx; qy[qe] = sy; qe++;
    while (qs < qe) {
      const x = qx[qs], y = qy[qs]; qs++;
      const d = dist[idx(w, x, y)];
      if (x === tx && y === ty) return d;
      const dirs = [1, 0, -1, 0, 0, 1, 0, -1];
      for (let k = 0; k < 8; k += 2) {
        const nx = x + dirs[k], ny = y + dirs[k + 1];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const i = idx(w, nx, ny);
        if (seen[i]) continue;
        if (!walkable(map, nx, ny, state)) continue;
        seen[i] = 1;
        dist[i] = d + 1;
        qx[qe] = nx; qy[qe] = ny; qe++;
      }
    }
    return -1;
  };

  function blocksAsChoke(map, x, y, state) {
    const i = idx(map.w, x, y);
    const old = map.tiles[i];
    map.tiles[i] = T.MOUNTAIN;
    const nbs = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].filter(p => walkable(map, p[0], p[1], state));
    let choke = false;
    if (nbs.length >= 2) {
      const d = LH.bfs(map, nbs[0][0], nbs[0][1], nbs[1][0], nbs[1][1], state);
      choke = d < 0;
    }
    map.tiles[i] = old;
    return choke;
  }

  function buildOverworld(maps) {
    const spec = LH.WORLD;
    const map = makeMap('world', 'DUSKREACH', spec.w, spec.h);
    map.region = new Uint8Array(spec.w * spec.h);
    const names = ['none', 'vale', 'meadow', 'salt', 'marsh', 'desert', 'peaks', 'frost', 'thorn', 'night'];
    const rindex = {};
    names.forEach((n, i) => { rindex[n] = i; });
    map.regionNames = names;
    for (let y = 0; y < spec.h; y++) {
      for (let x = 0; x < spec.w; x++) {
        const i = idx(spec.w, x, y);
        map.tiles[i] = T.MOUNTAIN;
        map.region[i] = rindex[LH.regionAt(x, y)] || 0;
      }
    }
    for (const c of spec.clearings) {
      for (let y = c.y; y < c.y + c.h; y++) {
        for (let x = c.x; x < c.x + c.w; x++) {
          if (x < 0 || y < 0 || x >= spec.w || y >= spec.h) continue;
          const i = idx(spec.w, x, y);
          let ter = c.terrain;
          const hv = hash(x, y) % 100;
          if (ter === T.GRASS && hv < 8) ter = T.FLOWER;
          map.tiles[i] = ter;
          map.region[i] = rindex[c.id] || map.region[i];
        }
      }
    }
    /* Decorative sea, far from every clearing. */
    for (let y = 0; y < spec.h; y++) {
      for (let x = 392; x < spec.w; x++) setTile(map, x, y, T.WATER);
    }

    const base = map.tiles.slice();
    map.roadLengths = {};
    for (const road of spec.roads) {
      let carved = [];
      for (const seg of road.segs) {
        const pts = switchback(seg);
        const part = carvePolyline(map, pts);
        if (seg.gate) {
          const at = Math.max(0, Math.min(part.length - 1, Math.floor(seg.gate.at * part.length)));
          let placed = false;
          for (let rad = 0; rad < part.length && !placed; rad++) {
            for (const sign of [0, 1, -1]) {
              const k = at + sign * rad;
              if (k < 0 || k >= part.length) continue;
              const [gx, gy] = part[k];
              const bi = idx(spec.w, gx, gy);
              if (base[bi] !== T.MOUNTAIN) continue;
              if (!blocksAsChoke(map, gx, gy, emptyState())) continue;
              setTile(map, gx, gy, seg.gate.terrain);
              placed = true;
              break;
            }
            if (placed) break;
          }
          if (!placed) LH.buildErrors.push('gate failed on ' + road.id);
        }
        carved = carved.concat(part);
      }
      map.roadLengths[road.id] = carved.length;
    }

    for (const b of spec.belts) {
      for (let y = b.y; y < b.y + b.h; y++) {
        for (let x = b.x; x < b.x + b.w; x++) setTile(map, x, y, b.terrain);
      }
    }
    maps.world = map;
    return map;
  }

  function emptyState() {
    return { flags: {}, items: {}, weapon: null, armor: null, shield: null, accessory: null };
  }
  LH.emptyState = emptyState;
  LH.openState = function () {
    return {
      flags: {
        hooks: true, cloak: true, lens: true, bridgeFixed: true, nightPass: true, chapelKey: true,
        lampDew: 'set', lampStone: 'set'
      },
      items: { shears: 1 },
      weapon: null, armor: null, shield: null, accessory: null
    };
  };

  function stampHouse(map, doorX, doorY) {
    const x0 = doorX - 4, y0 = doorY - 5;
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 9; x++) {
        if (y === 5 && x === 4) continue;
        setTile(map, x0 + x, y0 + y, y === 0 ? T.ROOF : T.WALL);
      }
    }
    setTile(map, doorX, doorY, T.DOOR);
  }

  function stampCave(map, x, y) {
    setTile(map, x, y, T.CAVE);
    const ring = [[0, -1], [-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]];
    for (const d of ring) {
      const tx = x + d[0], ty = y + d[1];
      const t = getTile(map, tx, ty);
      if (t === T.GRASS || t === T.FLOWER || t === T.FOREST || t === T.SAND || t === T.SNOW || t === T.SWAMP || t === T.CRACK || t === T.ROAD) {
        setTile(map, tx, ty, T.MOUNTAIN);
      }
    }
  }

  function carveBuilding(map, x, y, bw, bh, floor) {
    for (let yy = 0; yy < bh; yy++) {
      for (let xx = 0; xx < bw; xx++) {
        const edge = xx === 0 || yy === 0 || xx === bw - 1 || yy === bh - 1;
        setTile(map, x + xx, y + yy, edge ? T.WALL : floor);
      }
    }
    const doorX = x + (bw >> 1);
    const doorY = y + bh - 1;
    setTile(map, doorX, doorY, floor);
    return { doorX, doorY, ix: x + (bw >> 1), iy: y + (bh >> 1) };
  }

  const SLOT_SPRITE = {
    shop: 'merchant', inn: 'merchant', house: 'elder', plaza: 'merchant',
    guard: 'guard', child: 'child', priest: 'priest', captain: 'captain',
    tailor: 'tailor', miner: 'miner', hermit: 'hermit', keeper: 'keeper'
  };

  function buildStandardTown(def) {
    const w = 36, h = 28;
    const map = makeMap(def.id, def.name, w, h);
    map.music = 'town';
    map.tileset = 'town';
    map.tiles.fill(T.GRASS);
    for (let x = 0; x < w; x++) { setTile(map, x, 0, T.TREE); setTile(map, x, h - 1, T.TREE); }
    for (let y = 0; y < h; y++) { setTile(map, 0, y, T.TREE); setTile(map, w - 1, y, T.TREE); }
    const shop = carveBuilding(map, 2, 2, 14, 9, T.WOOD);
    const inn = carveBuilding(map, 20, 2, 14, 9, T.WOOD);
    const house = carveBuilding(map, 2, 14, 12, 8, T.WOOD);
    for (let y = 11; y <= 26; y++) setTile(map, 18, y, T.ROAD);
    setTile(map, 18, h - 1, T.DOOR);
    const slots = { shop, inn, house, plaza: { ix: 24, iy: 18 } };
    def.npcs.forEach(n => {
      const slot = slots[n.slot] || slots.plaza;
      const x = n.x != null ? n.x : slot.ix;
      const y = n.y != null ? n.y : slot.iy;
      map.npcs.push({
        x, y, ref: n.ref, name: n.name,
        sprite: n.sprite || SLOT_SPRITE[n.slot] || 'merchant'
      });
    });
    (def.chests || []).forEach(c => map.chests.push(c));
    map.signs.push({ x: 19, y: 25, text: def.name });
    map.warps.push({ x: 18, y: h - 1, to: 'world', tx: def.door[0], ty: def.door[1] + 1 });
    map.enter = { x: 18, y: h - 2 };
    return map;
  }

  function buildCastle(door) {
    const w = 29, h = 24;
    const map = makeMap('firstkeep', 'FIRSTKEEP', w, h);
    map.music = 'town';
    map.tileset = 'castle';
    map.tiles.fill(T.WALL);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) setTile(map, x, y, T.CARPET);
    }
    for (let x = 1; x < w - 1; x++) setTile(map, x, 8, T.WALL);
    setTile(map, 14, 8, T.CARPET);
    setTile(map, 14, 3, T.STONE);
    map.npcs.push(
      { x: 14, y: 4, ref: 'queen', name: 'MAELIS', sprite: 'queen' },
      { x: 6, y: 4, ref: 'scholar', name: 'SCHOLAR IVE', sprite: 'elder' },
      { x: 22, y: 4, ref: 'otis', name: 'OTIS', sprite: 'priest' },
      { x: 6, y: 14, ref: 'steward', name: 'STEWARD CAL', sprite: 'elder' },
      { x: 20, y: 16, ref: 'bren', name: 'BREN', sprite: 'guard' }
    );
    setTile(map, 14, h - 1, T.DOOR);
    map.warps.push({ x: 14, y: h - 1, to: 'world', tx: door[0], ty: door[1] + 1 });
    map.enter = { x: 14, y: h - 2 };
    map.start = { x: 14, y: 6, dir: 'up' };
    return map;
  }

  function buildSanctum(door) {
    const w = 22, h = 16;
    const map = makeMap('sanctum', 'SANCTUM OF FIVE', w, h);
    map.music = 'town';
    map.tileset = 'sanctum';
    map.tiles.fill(T.WALL);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) setTile(map, x, y, T.STONE);
    }
    for (let y = 4; y <= 8; y++) setTile(map, 11, y, T.CARPET);
    map.npcs.push(
      { x: 11, y: 5, ref: 'keeper', name: 'KEEPER SOLEN', sprite: 'keeper' },
      { x: 5, y: 10, ref: 'pilgrim', name: 'PILGRIM', sprite: 'elder' }
    );
    setTile(map, 11, h - 1, T.DOOR);
    map.warps.push({ x: 11, y: h - 1, to: 'world', tx: door[0], ty: door[1] + 1 });
    map.enter = { x: 11, y: h - 2 };
    return map;
  }

  function roomOrigin(c, r) {
    return { x: PAD + c * (RW + GAP), y: PAD + r * (RH + GAP) };
  }

  function snake(cols, rows) {
    const order = [];
    for (let r = 0; r < rows; r++) {
      const cs = [];
      for (let c = 0; c < cols; c++) cs.push(c);
      if (r % 2) cs.reverse();
      for (const c of cs) order.push([c, r]);
    }
    return order;
  }

  function buildFloor(spec, f) {
    const cols = spec.cols, rows = spec.rows;
    const w = PAD + cols * (RW + GAP) - GAP + PAD;
    const h = PAD + rows * (RH + GAP) - GAP + PAD;
    const map = makeMap(spec.id + '-f' + f, spec.name + ' ' + f, w, h);
    map.music = 'dungeon';
    map.tileset = spec.tileset;
    map.encRate = spec.encRate;
    map.encTable = spec.enc;
    map.dark = f >= spec.darkFrom;
    map.dungeon = spec.id;
    map.floor = f;
    map.tiles.fill(T.WALL);
    const order = snake(cols, rows);
    const rooms = order.map(([c, r]) => roomOrigin(c, r));
    function carveRoom(ox, oy) {
      for (let y = 0; y < RH; y++) {
        for (let x = 0; x < RW; x++) {
          const edge = x === 0 || y === 0 || x === RW - 1 || y === RH - 1;
          setTile(map, ox + x, oy + y, edge ? T.WALL : T.FLOOR);
        }
      }
    }
    rooms.forEach(rm => carveRoom(rm.x, rm.y));
    const corridors = [];
    for (let i = 0; i < order.length - 1; i++) {
      const a = rooms[i], b = rooms[i + 1];
      const tiles = [];
      const midA = { x: a.x + (RW >> 1), y: a.y + (RH >> 1) };
      const midB = { x: b.x + (RW >> 1), y: b.y + (RH >> 1) };
      if (a.y === b.y) {
        const y = midA.y;
        const x1 = Math.min(a.x + RW - 1, b.x + RW - 1);
        const x2 = Math.max(a.x, b.x);
        for (let x = x1; x <= x2; x++) { setTile(map, x, y, T.FLOOR); tiles.push([x, y]); }
      } else {
        const x = midA.x;
        const y1 = Math.min(a.y + RH - 1, b.y + RH - 1);
        const y2 = Math.max(a.y, b.y);
        for (let y = y1; y <= y2; y++) { setTile(map, x, y, T.FLOOR); tiles.push([x, y]); }
      }
      corridors.push(tiles);
    }
    const first = rooms[0];
    const last = rooms[rooms.length - 1];
    map.stairsUp = { x: first.x + (RW >> 1), y: first.y + 1 };
    map.stairsUpLand = { x: map.stairsUp.x, y: map.stairsUp.y + 1 };
    setTile(map, map.stairsUp.x, map.stairsUp.y, T.FLOOR);
    const lastFloor = f === spec.floors;
    if (!lastFloor) {
      map.stairsDown = { x: last.x + (RW >> 1), y: last.y + (RH >> 1) };
      map.stairsDownLand = { x: map.stairsDown.x, y: map.stairsDown.y - 1 };
    } else {
      const bx = last.x + (RW >> 1);
      const by = last.y + (RH >> 1);
      map.triggers.push({ x: bx, y: by, boss: spec.boss, flag: 'dead-' + spec.boss });
    }
    const lock = !(spec.id === 'dewspring' && f === 1);
    if (lock && corridors.length) {
      const ci = Math.min(corridors.length - 1, Math.floor(corridors.length * 0.62));
      const tiles = corridors[ci];
      const door = tiles[tiles.length >> 1];
      const flag = spec.id + '-f' + f + '-key';
      map.blocks.push({ x: door[0], y: door[1], flag, deny: 'THE DOOR IS LOCKED.' });
      const keyRoom = rooms[Math.max(0, Math.floor(order.length * 0.35))];
      map.chests.push({
        id: flag, x: keyRoom.x + 2, y: keyRoom.y + 2,
        givesFlag: flag, gold: 0
      });
    }
    const loot = LH.LOOT[spec.id] || [{ gold: 20 }];
    const chestRooms = [Math.floor(order.length * 0.22), Math.floor(order.length * 0.78)];
    chestRooms.forEach((ri, n) => {
      const rm = rooms[Math.max(0, Math.min(rooms.length - 1, ri))];
      const spot = n === 0 ? [rm.x + RW - 3, rm.y + 2] : [rm.x + 2, rm.y + RH - 3];
      if (spot[0] === map.stairsUp.x && spot[1] === map.stairsUp.y) return;
      const drop = loot[(f + n) % loot.length];
      map.chests.push(Object.assign({ id: spec.id + '-f' + f + '-c' + n, x: spot[0], y: spot[1] }, drop));
    });
    (spec.chests || []).forEach(c => {
      if (c.floor !== f) return;
      const rm = rooms[Math.max(0, Math.min(rooms.length - 1, Math.floor(order.length * c.along)))];
      map.chests.push({ id: c.id, x: rm.x + 3, y: rm.y + 3, item: c.item, qty: c.qty || 1, gold: c.gold || 0 });
    });
    (spec.npcs || []).forEach(n => {
      if (n.floor !== f) return;
      const rm = rooms[Math.max(0, Math.min(rooms.length - 1, Math.floor(order.length * n.along)))];
      map.npcs.push({
        x: rm.x + (RW >> 1), y: rm.y + 2,
        ref: n.ref, name: n.name, sprite: 'miner'
      });
    });
    /* Keep stairs tiles clear of chests. */
    map.chests = map.chests.filter(c => {
      if (map.stairsUp && c.x === map.stairsUp.x && c.y === map.stairsUp.y) return false;
      if (map.stairsDown && c.x === map.stairsDown.x && c.y === map.stairsDown.y) return false;
      return getTile(map, c.x, c.y) === T.FLOOR;
    });
    return map;
  }

  function linkDungeon(spec, floors, maps) {
    for (let i = 0; i < floors.length; i++) {
      const map = floors[i];
      const up = map.stairsUp;
      if (i === 0) {
        if (spec.mouth) {
          map.warps.push({ x: up.x, y: up.y, to: 'world', tx: spec.mouth.x, ty: spec.mouth.y + 1 });
          map.return = { map: 'world', x: spec.mouth.x, y: spec.mouth.y + 1 };
        } else {
          map.warps.push({ x: up.x, y: up.y, to: 'saltwharf', tx: 18, ty: 26 });
          map.return = { map: 'saltwharf', x: 18, y: 26 };
        }
      } else {
        map.return = floors[0].return;
        const prev = floors[i - 1];
        map.warps.push({
          x: up.x, y: up.y, to: prev.id,
          tx: prev.stairsDownLand.x, ty: prev.stairsDownLand.y
        });
      }
      if (map.stairsDown) {
        const next = floors[i + 1];
        map.warps.push({
          x: map.stairsDown.x, y: map.stairsDown.y, to: next.id,
          tx: next.stairsUpLand.x, ty: next.stairsUpLand.y
        });
      }
      maps[map.id] = map;
    }
    if (spec.mouth) {
      const world = maps.world;
      const m = spec.mouth;
      stampCave(world, m.x, m.y);
      const warp = {
        x: m.x, y: m.y, to: floors[0].id,
        tx: floors[0].stairsUpLand.x, ty: floors[0].stairsUpLand.y
      };
      if (spec.lockedMouth === 'chapel') {
        world.blocks.push({ x: m.x, y: m.y, flag: 'chapelKey', deny: 'THE CHAPEL DOOR IS LOCKED.' });
      }
      world.warps.push(warp);
      /* Approach tile south of the mouth must stay open. */
      const south = getTile(world, m.x, m.y + 1);
      if (south === T.MOUNTAIN || south === T.WALL || south === T.WATER) {
        setTile(world, m.x, m.y + 1, T.GRASS);
      }
    }
  }

  const TOWN_DEFS = [
    { id: 'millhaven', name: 'MILLHAVEN', door: [46, 358], npcs: [
      { slot: 'shop', ref: 'mira', name: 'MIRA' },
      { slot: 'inn', ref: 'hob', name: 'HOB' },
      { slot: 'plaza', ref: 'child', name: 'PIP', sprite: 'child' },
      { slot: 'house', ref: 'elderMill', name: 'NESS' }
    ], chests: [{ id: 'mill-leaf', x: 30, y: 20, item: 'mendleaf', qty: 2 }] },
    { id: 'reedmarket', name: 'REEDMARKET', door: [55, 455], npcs: [
      { slot: 'shop', ref: 'reedShop', name: 'VENDOR' },
      { slot: 'inn', ref: 'reedInn', name: 'HOST' },
      { slot: 'plaza', ref: 'healer', name: 'HEALER SENNA', sprite: 'priest' },
      { slot: 'house', ref: 'carpenter', name: 'CARPENTER DODD' },
      { slot: 'plaza', ref: 'fisher', name: 'FISHER', x: 28, y: 22, sprite: 'merchant' }
    ] },
    { id: 'fairhollow', name: 'FAIRHOLLOW', door: [286, 348], npcs: [
      { slot: 'shop', ref: 'fairShop', name: 'MERCHANT' },
      { slot: 'inn', ref: 'fairInn', name: 'HOST' },
      { slot: 'house', ref: 'priest', name: 'PRIEST ELUN', sprite: 'priest' },
      { slot: 'plaza', ref: 'bard', name: 'BARD LUTE', x: 24, y: 20, sprite: 'merchant' },
      { slot: 'plaza', ref: 'fairGuard', name: 'GUARD', x: 28, y: 16, sprite: 'guard' }
    ] },
    { id: 'stonehearth', name: 'STONEHEARTH', door: [190, 78], npcs: [
      { slot: 'shop', ref: 'stoneShop', name: 'SMITH' },
      { slot: 'inn', ref: 'stoneInn', name: 'HOST' },
      { slot: 'house', ref: 'miner', name: 'MINER BRAM', sprite: 'miner' }
    ] },
    { id: 'saltwharf', name: 'SALTWHARF', door: [316, 190], npcs: [
      { slot: 'shop', ref: 'saltShop', name: 'CHANDLER' },
      { slot: 'inn', ref: 'saltInn', name: 'HOST' },
      { slot: 'house', ref: 'captain', name: 'CAPTAIN RYE', sprite: 'captain' },
      { slot: 'plaza', ref: 'dockhand', name: 'DOCKHAND', x: 30, y: 16, sprite: 'merchant' },
      { slot: 'plaza', ref: 'sailor', name: 'SAILOR', x: 10, y: 22, sprite: 'merchant' }
    ] },
    { id: 'ashmarket', name: 'ASHMARKET', door: [276, 448], npcs: [
      { slot: 'shop', ref: 'ashShop', name: 'GLASSWRIGHT' },
      { slot: 'inn', ref: 'ashInn', name: 'HOST' },
      { slot: 'house', ref: 'ashElder', name: 'ELDER SABLE' },
      { slot: 'plaza', ref: 'glazier', name: 'GLAZIER', x: 28, y: 20 }
    ] },
    { id: 'whitehearth', name: 'WHITEHEARTH', door: [322, 70], npcs: [
      { slot: 'shop', ref: 'whiteShop', name: 'SMITH' },
      { slot: 'inn', ref: 'whiteInn', name: 'HOST' },
      { slot: 'house', ref: 'tailor', name: 'TAILOR NIA', sprite: 'tailor' },
      { slot: 'plaza', ref: 'hunter', name: 'HUNTER', x: 26, y: 20 }
    ] },
    { id: 'thornrest', name: 'THORNREST', door: [50, 74], npcs: [
      { slot: 'shop', ref: 'thornShop', name: 'WARDEN' },
      { slot: 'inn', ref: 'thornInn', name: 'HOST' },
      { slot: 'house', ref: 'hermit', name: 'HERMIT', sprite: 'hermit' }
    ] },
    { id: 'vigil', name: 'VIGIL', door: [360, 206], npcs: [
      { slot: 'shop', ref: 'vigilShop', name: 'QUARTERMASTER' },
      { slot: 'inn', ref: 'vigilInn', name: 'HOST' },
      { slot: 'house', ref: 'watcher', name: 'WATCHER', sprite: 'guard' },
      { slot: 'plaza', ref: 'veteran', name: 'VETERAN', x: 26, y: 20, sprite: 'guard' }
    ] }
  ];

  function placeTowns(maps) {
    const world = maps.world;
    const castleDoor = [58, 328];
    maps.firstkeep = buildCastle(castleDoor);
    stampHouse(world, castleDoor[0], castleDoor[1]);
    world.warps.push({
      x: castleDoor[0], y: castleDoor[1], to: 'firstkeep',
      tx: maps.firstkeep.enter.x, ty: maps.firstkeep.enter.y
    });
    const sancDoor = [318, 322];
    maps.sanctum = buildSanctum(sancDoor);
    stampHouse(world, sancDoor[0], sancDoor[1]);
    world.warps.push({
      x: sancDoor[0], y: sancDoor[1], to: 'sanctum',
      tx: maps.sanctum.enter.x, ty: maps.sanctum.enter.y
    });
    TOWN_DEFS.forEach(def => {
      const map = buildStandardTown(def);
      maps[def.id] = map;
      stampHouse(world, def.door[0], def.door[1]);
      world.warps.push({
        x: def.door[0], y: def.door[1], to: def.id,
        tx: map.enter.x, ty: map.enter.y
      });
    });
    world.signs.push(
      { x: 64, y: 330, text: 'FIRSTKEEP' },
      { x: 52, y: 360, text: 'MILLHAVEN' }
    );
    world.chests.push(
      { id: 'locket', x: 108, y: 362, item: 'locket', qty: 1 },
      { id: 'peltcache', x: 318, y: 96, item: 'pelt', qty: 3 },
      { id: 'vale-cache', x: 36, y: 370, gold: 45 },
      { id: 'meadow-cache', x: 262, y: 366, item: 'manadrop', qty: 2 },
      { id: 'salt-cache', x: 308, y: 180, gold: 180 },
      { id: 'ash-cache', x: 260, y: 450, gold: 240 }
    );
    world.pickups.push(
      { kind: 'fountain', id: 'fount-vale', x: 40, y: 312 },
      { kind: 'fountain', id: 'fount-marsh', x: 36, y: 478 },
      { kind: 'fountain', id: 'fount-peaks', x: 200, y: 46 },
      { kind: 'fountain', id: 'fount-frost', x: 330, y: 40 },
      { kind: 'lily', id: 'lily1', x: 36, y: 492 },
      { kind: 'lily', id: 'lily2', x: 96, y: 490 },
      { kind: 'lily', id: 'lily3', x: 78, y: 448 }
    );
  }

  function validate(maps) {
    const err = LH.buildErrors;
    const open = LH.openState();
    const castle = maps.firstkeep;
    if (!walkable(castle, castle.start.x, castle.start.y, open)) err.push('start blocked');
    const south = LH.bfs(castle, castle.start.x, castle.start.y, 14, 22, open);
    if (south < 0) err.push('cannot leave throne');
    /* Dungeon connectivity with and without keys. */
    LH.DUNGEONS.forEach(spec => {
      for (let f = 1; f <= spec.floors; f++) {
        const map = maps[spec.id + '-f' + f];
        if (!map) { err.push('missing ' + spec.id + ' ' + f); continue; }
        const locked = emptyState();
        const keyed = emptyState();
        map.blocks.forEach(b => { keyed.flags[b.flag] = true; });
        const sx = map.stairsUpLand.x, sy = map.stairsUpLand.y;
        const key = map.chests.find(c => c.givesFlag);
        if (key) {
          if (LH.bfs(map, sx, sy, key.x, key.y, locked) < 0) err.push('key unreachable ' + map.id);
        }
        if (map.stairsDown) {
          if (LH.bfs(map, sx, sy, map.stairsDown.x, map.stairsDown.y, keyed) < 0) err.push('stairs unreachable ' + map.id);
        }
        if (map.triggers.length) {
          const t = map.triggers[0];
          if (LH.bfs(map, sx, sy, t.x, t.y, keyed) < 0) err.push('boss unreachable ' + map.id);
        }
        map.warps.forEach(w => {
          const dest = maps[w.to];
          if (!dest) err.push('bad warp ' + map.id + ' -> ' + w.to);
          else if (!walkable(dest, w.tx, w.ty, open)) err.push('warp lands in wall ' + map.id + ' -> ' + w.to);
        });
      }
    });
    const world = maps.world;
    world.warps.forEach(w => {
      const dest = maps[w.to];
      if (!dest) err.push('world warp missing ' + w.to);
      else if (!walkable(dest, w.tx, w.ty, open)) err.push('world warp blocked ' + w.to);
    });
    /* Every town door approach (south tile) should be walkable with all gates open. */
    TOWN_DEFS.concat([
      { id: 'firstkeep', door: [58, 328] },
      { id: 'sanctum', door: [318, 322] }
    ]).forEach(def => {
      const x = def.door[0], y = def.door[1] + 1;
      if (!walkable(world, x, y, open)) err.push('town approach blocked ' + def.id);
    });
    /* Mouth approaches. */
    LH.DUNGEONS.forEach(spec => {
      if (!spec.mouth) return;
      if (!walkable(world, spec.mouth.x, spec.mouth.y + 1, open)) err.push('cave approach blocked ' + spec.id);
    });
    /* Props stand on passable ground. */
    world.chests.forEach(c => {
      if (!walkable(world, c.x, c.y, open)) err.push('chest buried ' + c.id);
    });
    world.pickups.forEach(p => {
      if (!LH.passable(getTile(world, p.x, p.y), open)) err.push('pickup buried ' + p.id);
    });
    /* NPCs stand on floors. */
    Object.keys(maps).forEach(id => {
      const map = maps[id];
      map.npcs.forEach(n => {
        if (!walkable(map, n.x, n.y, open)) err.push('npc in wall ' + id + ' ' + n.name);
      });
    });
  }

  LH.buildAll = function () {
    LH.buildErrors = [];
    const maps = {};
    buildOverworld(maps);
    placeTowns(maps);
    LH.DUNGEONS.forEach(spec => {
      const floors = [];
      for (let f = 1; f <= spec.floors; f++) floors.push(buildFloor(spec, f));
      linkDungeon(spec, floors, maps);
    });
    validate(maps);
    LH.maps = maps;
    const castle = maps.firstkeep;
    LH.START = { map: 'firstkeep', x: castle.start.x, y: castle.start.y, dir: 'up' };
    return maps;
  };
})(typeof window !== 'undefined' ? window : globalThis);
