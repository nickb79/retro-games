/* Lantern Heir — pixel font, tiles, and sprites drawn in code. */
(function (root) {
  const LH = root.LH = root.LH || {};
  const T = LH.T;

  /* 5x7 glyphs, original. Each entry is 7 rows of 5 bits. */
  const G = {};
  const RAW = {
    ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
    A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
    D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
    G: ['01111', '10000', '10000', '10111', '10001', '10001', '01111'],
    H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
    K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
    L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
    M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
    N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
    O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
    Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
    R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
    V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
    W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
    X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
    Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
    Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
    '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
    '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
    '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
    '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
    '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
    '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
    '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
    '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
    '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
    '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
    '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
    ',': ['00000', '00000', '00000', '00000', '00100', '00100', '01000'],
    '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
    '?': ['01110', '10001', '00010', '00100', '00100', '00000', '00100'],
    '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
    "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
    ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
    '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
    '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
    '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
    ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
    '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011']
  };
  Object.keys(RAW).forEach(ch => { G[ch] = RAW[ch].map(r => parseInt(r, 2)); });

  function textWidth(text, scale) {
    return text.length * 6 * (scale || 1);
  }

  function drawText(ctx, text, x, y, color, scale) {
    const s = scale || 1;
    ctx.fillStyle = color || '#f4e6c8';
    const str = String(text).toUpperCase();
    let cx = x | 0;
    for (let i = 0; i < str.length; i++) {
      const glyph = G[str[i]] || G[' '];
      for (let row = 0; row < 7; row++) {
        const bits = glyph[row];
        for (let col = 0; col < 5; col++) {
          if (bits & (1 << (4 - col))) ctx.fillRect(cx + col * s, y + row * s, s, s);
        }
      }
      cx += 6 * s;
    }
  }

  function ell(ctx, cx, cy, rx, ry, color) {
    ctx.fillStyle = color;
    const rrx = Math.max(1, rx), rry = Math.max(1, ry);
    for (let y = -rry; y <= rry; y++) {
      const yy = 1 - (y * y) / (rry * rry);
      if (yy <= 0) continue;
      const w = Math.round(rrx * Math.sqrt(yy));
      ctx.fillRect((cx - w) | 0, (cy + y) | 0, w * 2, 1);
    }
  }

  function hsl(h, s, l) { return 'hsl(' + h + ',' + s + '%,' + l + '%)'; }

  function drawTile(ctx, ter, x, y, frame, state) {
    const open = LH.passable(ter, state) && LH.TERRAIN[ter] && LH.TERRAIN[ter].gate;
    if (open) ter = T.ROAD;
    const px = x, py = y;
    switch (ter) {
      case T.GRASS:
      case T.FLOWER: {
        ctx.fillStyle = ((x + y) & 1) ? '#1c4a34' : '#24583c';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#163c2a';
        ctx.fillRect(px + ((x * 3) & 7), py + ((y * 5) & 7), 2, 2);
        if (ter === T.FLOWER) {
          ctx.fillStyle = '#e2b14a';
          ctx.fillRect(px + 8, py + 6, 2, 2);
          ctx.fillStyle = '#d24a58';
          ctx.fillRect(px + 4, py + 10, 2, 2);
        }
        break;
      }
      case T.FOREST:
        ctx.fillStyle = '#143226';
        ctx.fillRect(px, py, 16, 16);
        ell(ctx, px + 8, py + 9, 6, 5, '#1d4a32');
        ell(ctx, px + 5, py + 7, 3, 3, '#2a6240');
        ctx.fillStyle = '#3a2a18';
        ctx.fillRect(px + 7, py + 11, 2, 4);
        break;
      case T.MOUNTAIN:
        ctx.fillStyle = '#4e5566';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#6c7488';
        ctx.beginPath();
        ctx.moveTo(px + 2, py + 14); ctx.lineTo(px + 8, py + 3); ctx.lineTo(px + 14, py + 14);
        ctx.fill();
        ctx.fillStyle = '#9aa3b8';
        ctx.fillRect(px + 7, py + 4, 2, 2);
        break;
      case T.WATER:
        ctx.fillStyle = frame ? '#1a4578' : '#163a66';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = frame ? '#2a6aaa' : '#214f88';
        ctx.fillRect(px, py + 4, 16, 2);
        ctx.fillRect(px + (frame ? 4 : 0), py + 10, 12, 2);
        break;
      case T.SAND:
        ctx.fillStyle = '#c2a15a';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#a88640';
        ctx.fillRect(px + 3, py + 5, 2, 1);
        ctx.fillRect(px + 10, py + 11, 3, 1);
        break;
      case T.SWAMP:
        ctx.fillStyle = '#3a4a28';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#2a381c';
        ctx.fillRect(px, py + 8, 16, 3);
        ctx.fillStyle = '#6a8a40';
        ctx.fillRect(px + 4, py + 4, 1, 4);
        ctx.fillRect(px + 11, py + 6, 1, 3);
        break;
      case T.SNOW:
        ctx.fillStyle = '#d5e4ee';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#f7fbff';
        ctx.fillRect(px + 2, py + 3, 2, 2);
        ctx.fillRect(px + 9, py + 8, 3, 2);
        break;
      case T.ROAD:
        ctx.fillStyle = '#8a7044';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#6e5834';
        ctx.fillRect(px, py + 7, 16, 2);
        ctx.fillStyle = '#a88858';
        ctx.fillRect(px + 4, py + 2, 3, 2);
        break;
      case T.WALL:
        ctx.fillStyle = '#3a3344';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#52485c';
        ctx.fillRect(px, py, 16, 3);
        ctx.fillRect(px, py + 8, 16, 2);
        ctx.fillStyle = '#2a2432';
        ctx.fillRect(px + 7, py, 2, 16);
        break;
      case T.ROOF:
        ctx.fillStyle = '#8c3038';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#b84848';
        ctx.fillRect(px, py + 3, 16, 2);
        ctx.fillRect(px, py + 8, 16, 2);
        ctx.fillRect(px, py + 13, 16, 2);
        break;
      case T.DOOR:
      case T.CAVE:
        ctx.fillStyle = ter === T.CAVE ? '#5c6374' : '#6a5438';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#120c14';
        ctx.fillRect(px + 4, py + 3, 8, 12);
        ctx.fillStyle = '#e6b44a';
        ctx.fillRect(px + 10, py + 8, 2, 2);
        break;
      case T.TREE:
        ctx.fillStyle = '#1c4a34';
        ctx.fillRect(px, py, 16, 16);
        ell(ctx, px + 8, py + 7, 6, 5, '#143c28');
        ctx.fillStyle = '#3a2a18';
        ctx.fillRect(px + 7, py + 10, 2, 5);
        break;
      case T.FLOOR:
        ctx.fillStyle = '#3a3e4a';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#2a2e38';
        ctx.fillRect(px, py + 7, 16, 1);
        ctx.fillRect(px + 7, py, 1, 16);
        break;
      case T.WOOD:
        ctx.fillStyle = '#7a5434';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#5c3e26';
        ctx.fillRect(px, py + 5, 16, 1);
        ctx.fillRect(px, py + 11, 16, 1);
        break;
      case T.CARPET:
        ctx.fillStyle = '#6a2a3a';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#8a3a4a';
        ctx.fillRect(px + 2, py + 2, 12, 1);
        ctx.fillRect(px + 2, py + 13, 12, 1);
        break;
      case T.STONE:
        ctx.fillStyle = '#5a5348';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#3e382e';
        ctx.strokeStyle = '#3e382e';
        ctx.fillRect(px, py + 15, 16, 1);
        ctx.fillRect(px + 15, py, 1, 16);
        break;
      case T.CLIFF:
        ctx.fillStyle = '#5a5048';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#2a241c';
        ctx.fillRect(px + 2, py, 3, 16);
        ctx.fillStyle = '#8a8078';
        ctx.fillRect(px + 10, py + 4, 4, 3);
        break;
      case T.THORN:
        ctx.fillStyle = '#1a3020';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#6a2030';
        ctx.fillRect(px + 3, py + 2, 2, 10);
        ctx.fillRect(px + 8, py + 6, 2, 8);
        ctx.fillRect(px + 5, py + 4, 6, 2);
        break;
      case T.WHITEOUT:
        ctx.fillStyle = '#eef6ff';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#b8c8d8';
        ctx.fillRect(px, py + (frame ? 2 : 6), 16, 3);
        ctx.fillRect(px, py + (frame ? 10 : 12), 16, 2);
        break;
      case T.STORM:
        ctx.fillStyle = '#6a5878';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#d8e0ff';
        ctx.fillRect(px + (frame ? 2 : 8), py + 4, 6, 2);
        ctx.fillRect(px + (frame ? 8 : 2), py + 10, 5, 2);
        break;
      case T.DUSK:
        ctx.fillStyle = '#2a1840';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#6a3088';
        ctx.fillRect(px + 4, py + 2, 8, 12);
        ctx.fillStyle = '#120810';
        ctx.fillRect(px + 7, py + 4, 2, 8);
        break;
      case T.SLIDE:
        ctx.fillStyle = '#6a6058';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#3a342c';
        ctx.fillRect(px + 2, py + 8, 6, 4);
        ctx.fillRect(px + 8, py + 4, 5, 5);
        break;
      case T.BRIDGE:
        ctx.fillStyle = '#5c4030';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#2a6aaa';
        ctx.fillRect(px, py, 16, 4);
        ctx.fillRect(px, py + 12, 16, 4);
        ctx.fillStyle = '#c8a070';
        ctx.fillRect(px, py + 5, 16, 6);
        break;
      case T.NIGHT:
        ctx.fillStyle = '#100818';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#c84ad0';
        ctx.fillRect(px + 6, py + 2, 4, 12);
        ctx.fillRect(px + 2, py + 6, 12, 4);
        break;
      case T.CRACK:
        ctx.fillStyle = '#2a2430';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#4a2060';
        ctx.fillRect(px + 3, py + 2, 2, 12);
        ctx.fillRect(px + 8, py + 6, 5, 2);
        break;
      case T.LAVA:
        ctx.fillStyle = '#6a2010';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = frame ? '#ffb040' : '#e06020';
        ctx.fillRect(px + 3, py + 5, 10, 4);
        break;
      default:
        ctx.fillStyle = '#000';
        ctx.fillRect(px, py, 16, 16);
    }
  }

  const PAL = {
    k: '#140c18', s: '#f0c8a0', d: '#e08a3a', g: '#2c6b4a', G: '#1b4030',
    a: '#ffd56a', p: '#2a2a40', b: '#4a3428', w: '#f4f0e4', r: '#a82838',
    c: '#f2d36a', u: '#6a3a8a', m: '#c8ccd4'
  };

  function blit(ctx, rows, dx, dy, flip) {
    const h = rows.length;
    const w = rows[0].length;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ch = rows[y][flip ? (w - 1 - x) : x];
        const col = PAL[ch];
        if (!col || ch === '.') continue;
        ctx.fillStyle = col;
        ctx.fillRect(dx + x, dy + y, 1, 1);
      }
    }
  }

  const HERO = {
    down: [
      '......kkkk......',
      '.....kggggk.....',
      '....kgddddgk....',
      '....kgdssdgk....',
      '....kgsddsgk....',
      '....kgssssgk....',
      '.....kssssk.....',
      '....kggggggk....',
      '...kggaaaaggk...',
      '...kggggggggk...',
      '...kgggkkgggk...',
      '...kgg....ggk...',
      '...kpp....ppk...',
      '....kb....bk....',
      '....kk....kk....',
      '................'
    ],
    up: [
      '......kkkk......',
      '.....kddddk.....',
      '....kddddddk....',
      '....kddddddk....',
      '....kggggggk....',
      '....kggggggk....',
      '.....kggggk.....',
      '....kggggggk....',
      '...kggaaaaggk...',
      '...kggggggggk...',
      '...kgggkkgggk...',
      '...kgg....ggk...',
      '...kpp....ppk...',
      '....kb....bk....',
      '....kk....kk....',
      '................'
    ],
    side: [
      '......kkkk......',
      '.....kggggk.....',
      '....kgddddk.....',
      '....kgdsssk.....',
      '....kgsddk......',
      '....kgssk.......',
      '.....kgggk......',
      '....kgggggk.....',
      '...kgaaaaggk....',
      '...kgggggggk....',
      '...kggkggggk....',
      '...kgg..gggk....',
      '...kpp...ppk....',
      '....bb...bb.....',
      '................',
      '................'
    ]
  };

  function drawHero(ctx, dir, x, y, frame) {
    const bob = frame ? -1 : 0;
    const rows = dir === 'up' ? HERO.up : dir === 'down' ? HERO.down : HERO.side;
    blit(ctx, rows, x, y + bob, dir === 'left');
  }

  const BODY = [
    '......kkkk......',
    '.....kddddk.....',
    '....kdssssdk....',
    '....kssssssk....',
    '.....kssssk.....',
    '....kcccccck....',
    '...kcccccccck...',
    '...kccckkccck...',
    '...kcc....cck...',
    '...kcc....cck...',
    '....bb....bb....',
    '................'
  ];

  function drawNpc(ctx, sprite, x, y) {
    const map = {
      queen: { d: '#f2d36a', c: '#6a3a8a', skin: '#f0c8a0' },
      elder: { d: '#e8e8f0', c: '#5a6a78', skin: '#e0b898' },
      guard: { d: '#c8ccd4', c: '#3a4a6a', skin: '#f0c8a0' },
      priest: { d: '#f4f0e4', c: '#d8d0c0', skin: '#f0c8a0' },
      merchant: { d: '#6a3a22', c: '#8a5a30', skin: '#f0c8a0' },
      child: { d: '#e08a3a', c: '#3a8a6a', skin: '#f6d0b0' },
      captain: { d: '#4a3428', c: '#2a4a6a', skin: '#e8c0a0' },
      tailor: { d: '#a82848', c: '#c45a78', skin: '#f0c8a0' },
      miner: { d: '#6a5a48', c: '#5a5044', skin: '#e0b090' },
      hermit: { d: '#c8c8b0', c: '#4a5a40', skin: '#d8b898' },
      keeper: { d: '#f2d36a', c: '#3a3058', skin: '#f0c8a0' }
    };
    const pal = map[sprite] || map.merchant;
    const old = Object.assign({}, PAL);
    PAL.d = pal.d;
    PAL.c = pal.c;
    PAL.s = pal.skin;
    const rows = sprite === 'child' ? BODY.map((r, i) => (i < 1 ? '................' : r)) : BODY;
    /* Pad to draw. BODY is 12 rows; place lower. */
    const padded = ['................', '................', '................', '................'].concat(rows);
    blit(ctx, padded.slice(0, 16), x, y, false);
    if (sprite === 'queen') {
      ctx.fillStyle = '#f2d36a';
      ctx.fillRect(x + 6, y + 3, 4, 2);
    }
    PAL.d = old.d; PAL.c = old.c; PAL.s = old.s;
  }

  function drawMonster(ctx, mon, x, y, frame) {
    const h = mon.hue || 0;
    const bob = frame ? 1 : 0;
    const kind = mon.kind;
    ctx.save();
    ctx.translate(0, bob);
    if (kind === 'blob') {
      ell(ctx, x + 24, y + 28, 16, 12, hsl(h, 60, 42));
      ell(ctx, x + 18, y + 24, 6, 4, hsl(h, 70, 62));
      ctx.fillStyle = '#140c18';
      ctx.fillRect(x + 16, y + 26, 3, 3);
      ctx.fillRect(x + 28, y + 26, 3, 3);
    } else if (kind === 'bat') {
      ell(ctx, x + 12, y + 24, 10, 4, hsl(h, 40, 30));
      ell(ctx, x + 36, y + 24, 10, 4, hsl(h, 40, 30));
      ell(ctx, x + 24, y + 26, 8, 7, hsl(h, 45, 38));
      ctx.fillStyle = '#f4e6c8';
      ctx.fillRect(x + 20, y + 24, 2, 2);
      ctx.fillRect(x + 26, y + 24, 2, 2);
    } else if (kind === 'beast' || kind === 'dragon') {
      ell(ctx, x + 26, y + 30, 14, 9, hsl(h, 45, 32));
      ell(ctx, x + 14, y + 22, 8, 7, hsl(h, 45, 36));
      ctx.fillStyle = hsl(h, 40, 22);
      ctx.fillRect(x + 10, y + 16, 3, 6);
      ctx.fillRect(x + 18, y + 16, 3, 5);
      ctx.fillStyle = '#f4e040';
      ctx.fillRect(x + 10, y + 22, 2, 2);
      if (kind === 'dragon') {
        ctx.fillStyle = hsl(h, 70, 50);
        ctx.fillRect(x + 34, y + 18, 8, 3);
      }
    } else if (kind === 'plant') {
      ctx.fillStyle = '#3a2a18';
      ctx.fillRect(x + 22, y + 30, 4, 10);
      ell(ctx, x + 24, y + 22, 14, 12, hsl(h, 55, 36));
      ell(ctx, x + 16, y + 16, 6, 6, hsl(h, 60, 42));
      ctx.fillStyle = '#140c18';
      ctx.fillRect(x + 18, y + 20, 3, 3);
      ctx.fillRect(x + 28, y + 20, 3, 3);
    } else if (kind === 'insect' || kind === 'crab') {
      ell(ctx, x + 24, y + 28, 12, 8, hsl(h, 50, 34));
      ell(ctx, x + 10, y + 20, 6, 8, hsl(h, 45, 40));
      ell(ctx, x + 38, y + 20, 6, 8, hsl(h, 45, 40));
      ctx.fillStyle = '#140c18';
      ctx.fillRect(x + 18, y + 26, 2, 2);
      ctx.fillRect(x + 28, y + 26, 2, 2);
    } else if (kind === 'undead' || kind === 'armor') {
      ctx.fillStyle = hsl(h, 20, 70);
      ctx.fillRect(x + 16, y + 10, 16, 14);
      ctx.fillStyle = '#140c18';
      ctx.fillRect(x + 20, y + 15, 3, 3);
      ctx.fillRect(x + 27, y + 15, 3, 3);
      ctx.fillStyle = hsl(h, 25, 40);
      ctx.fillRect(x + 14, y + 24, 20, 16);
      ctx.fillStyle = hsl(h, 15, 55);
      ctx.fillRect(x + 18, y + 28, 12, 8);
    } else if (kind === 'wisp' || kind === 'elemental') {
      ell(ctx, x + 24, y + 24, 12, 14, hsl(h, 80, 58));
      ell(ctx, x + 24, y + 22, 6, 6, hsl(h, 90, 78));
      ctx.fillStyle = '#140c18';
      ctx.fillRect(x + 20, y + 22, 2, 3);
      ctx.fillRect(x + 27, y + 22, 2, 3);
    } else if (kind === 'bird') {
      ell(ctx, x + 20, y + 26, 8, 6, hsl(h, 40, 40));
      ctx.fillStyle = hsl(h, 50, 32);
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 24); ctx.lineTo(x + 22, y + 20); ctx.lineTo(x + 22, y + 30); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 40, y + 22); ctx.lineTo(x + 24, y + 20); ctx.lineTo(x + 24, y + 30); ctx.fill();
      ctx.fillStyle = '#e8a030';
      ctx.fillRect(x + 12, y + 24, 6, 2);
    } else if (kind === 'serpent') {
      ell(ctx, x + 16, y + 30, 10, 6, hsl(h, 50, 34));
      ell(ctx, x + 28, y + 24, 10, 6, hsl(h, 50, 38));
      ell(ctx, x + 36, y + 16, 8, 6, hsl(h, 55, 42));
      ctx.fillStyle = '#f4e040';
      ctx.fillRect(x + 38, y + 14, 2, 2);
    } else if (kind === 'human') {
      ell(ctx, x + 24, y + 14, 7, 7, '#e0b898');
      ctx.fillStyle = hsl(h, 40, 32);
      ctx.fillRect(x + 14, y + 22, 20, 16);
      ctx.fillStyle = '#140c18';
      ctx.fillRect(x + 20, y + 13, 2, 2);
      ctx.fillRect(x + 27, y + 13, 2, 2);
    } else if (kind === 'sovereign') {
      ell(ctx, x + 24, y + 26, 16, 16, hsl(h, 35, 22));
      ell(ctx, x + 24, y + 16, 8, 9, hsl(h, 40, 30));
      ctx.fillStyle = '#f2d36a';
      ctx.fillRect(x + 18, y + 14, 3, 3);
      ctx.fillRect(x + 28, y + 14, 3, 3);
      ctx.fillStyle = hsl(h, 70, 50);
      ctx.fillRect(x + 8, y + 8, 4, 12);
      ctx.fillRect(x + 36, y + 8, 4, 12);
      ctx.fillRect(x + 22, y + 2, 4, 8);
    } else {
      ell(ctx, x + 24, y + 26, 12, 12, hsl(h, 40, 40));
    }
    ctx.restore();
  }

  function frameRect(ctx, x, y, w, h) {
    ctx.fillStyle = '#100c16';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#f3e2b8';
    ctx.fillRect(x, y, w, 2);
    ctx.fillRect(x, y + h - 2, w, 2);
    ctx.fillRect(x, y, 2, h);
    ctx.fillRect(x + w - 2, y, 2, h);
    ctx.fillStyle = '#8a6230';
    ctx.fillRect(x + 2, y + 2, w - 4, 1);
    ctx.fillRect(x + 2, y + h - 3, w - 4, 1);
  }

  LH.gfx = { drawText, textWidth, drawTile, drawHero, drawNpc, drawMonster, frameRect, ell };
})(typeof window !== 'undefined' ? window : globalThis);
