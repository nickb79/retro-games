# Lantern Heir

## 1.0.0

Original top-down, turn-based journey. Phone browser, no build step.

### Playtime model (1×, fast growth off)

This is a model, not a finished human playthrough. Distances are shortest paths from the map generator (`LH.bfs` on the built maps). Times use the constants in `js/data.js`:

- step time `1150 ms`
- text `14` characters per second
- line hold `0.85 s` after the line finishes
- at least `4` steps between encounters, then a roll each step
- expected steps between fights = `4 + 1/rate`

A normal fight is counted as 19 lines (approach, four rounds of attack and reply, victory and reward) at 18 characters each, plus `5.5 s` of unscaled decision time per round, plus 10% extra on the text and hold for spells, items, and level-up lines. Bosses use eight rounds. Menu, shop, and inn time is a flat `2.2 h`. Story strings in the data file are about `0.4 h` of reading. Speed scales walking, text, hold, and the music clock. It does not scale the decision time.

| Piece | Steps or fights | Hours at 1× |
| --- | --- | --- |
| Story roads and clearings (21 legs, gates opened in order) | 16,482 | 5.3 |
| Side trips (locket, lilies, fountains, pelts, ridge mouth, thorn road) | 1,417 | 0.5 |
| Town interiors (11 towns, two visits, 60 tiles) | 1,320 | 0.4 |
| Six deaths, 350 tiles back from the last inn or the queen | 2,100 | 0.7 |
| 12% extra overworld for wrong turns | 1,978 | 0.6 |
| Dewspring and Mirefen, in and out (Waygate is not learned yet), ×1.12 for chests | 5,288 | 1.7 |
| Later dungeons one way, ×1.12, Waygate home | 16,760 | 5.4 |
| Ridge Nest (round trip) and First Flame (one way) | 5,040 | 1.6 |
| About 1,110 random fights |  | 20.5 |
| 11 bosses |  | 0.4 |
| Menus, shops, inns, story text |  | 2.6 |
| **Total** | **50,385 steps** | **about 40** |

Road encounter rate is `0.007` (about one fight per 147 steps). Dungeon rates are `0.032` to `0.042` (about one fight per 28–35 steps). Clearing grass is `0.042`.

Random-fight XP on the main route, using each dungeon's table average, lands in the mid-30s. Ridge Nest and First Flame are what push a completionist to the level cap of 40. Cumulative XP to reach a level, from `xpToNext` (`round((12 * level^1.72 + 4 * level) * 1.15)`):

| Level | Cumulative XP |
| --- | --- |
| 5 | 346 |
| 9 | 1,871 |
| 13 | 5,237 |
| 17 | 11,013 |
| 20 | 17,240 |
| 24 | 28,461 |
| 28 | 43,441 |
| 32 | 62,623 |
| 36 | 86,431 |
| 40 | 115,273 |

Expected levels if fights are won rather than fled:

| Region | Levels |
| --- | --- |
| Vale, Millhaven, Dewspring | 1–6 |
| Reedmarsh, Mirefen | 6–11 |
| Meadow, Sunken Chapel | 11–14 |
| High peaks, Lantern Crypt | 14–18 |
| Saltmere, Gull Wreck, Tidevault | 18–23 |
| Cinderflats, Glass Pyramid | 23–27 |
| Frostmarch, Icehollow | 27–32 |
| Nightspire | 32–38 |
| Ridge Nest and First Flame | up to 40 |

Walking back out of a late dungeon instead of casting Waygate adds another full traverse and extra fights. That is longer than this model and will overshoot level 40. The 1× column assumes Waygate from the chapel onward.

8× divides only the system time (steps, text, hold). Decisions stay. That model is about 13 hours if every fight is still played. Fast growth (3× XP, 2.5× gold) plus fleeing about half the fights, with the rest ending in two rounds, is about 7 hours at 8×. Inn prices and sell prices are not boosted.

Level 1 is 22 HP, 6 attack, 4 defense. Each level adds HP, and from level 3 MP. Level 40 before gear is about 365 HP, 126 MP, 55 attack, 51 defense.
