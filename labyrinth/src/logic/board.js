import { createTile, TILE_TYPES } from './tiles';

export const CHARACTERS = [
  { id: 1,  name: 'Drache',     emoji: '🐉' },
  { id: 2,  name: 'Hexe',       emoji: '🧙' },
  { id: 3,  name: 'Geist',      emoji: '👻' },
  { id: 4,  name: 'Fledermaus', emoji: '🦇' },
  { id: 5,  name: 'Totenkopf',  emoji: '💀' },
  { id: 6,  name: 'Spinne',     emoji: '🕷️' },
  { id: 7,  name: 'Eule',       emoji: '🦉' },
  { id: 8,  name: 'Wolf',       emoji: '🐺' },
  { id: 9,  name: 'Schatz',     emoji: '💎' },
  { id: 10, name: 'Schlüssel',  emoji: '🗝️' },
  { id: 11, name: 'Buch',       emoji: '📖' },
  { id: 12, name: 'Krone',      emoji: '👑' },
  { id: 13, name: 'Schwert',    emoji: '⚔️' },
  { id: 14, name: 'Schild',     emoji: '🛡️' },
  { id: 15, name: 'Ring',       emoji: '💍' },
  { id: 16, name: 'Trank',      emoji: '🧪' },
  { id: 17, name: 'Karte',      emoji: '🗺️' },
  { id: 18, name: 'Kerze',      emoji: '🕯️' },
  { id: 19, name: 'Spiegel',    emoji: '🪞' },
  { id: 20, name: 'Harfe',      emoji: '🎵' },
  { id: 21, name: 'Maus',       emoji: '🐭' },
  { id: 22, name: 'Schmetterling', emoji: '🦋' },
  { id: 23, name: 'Frosch',     emoji: '🐸' },
  { id: 24, name: 'Pilz',       emoji: '🍄' },
];

export function getCharacter(id) {
  return CHARACTERS.find(c => c.id === id);
}

// Fixed tile positions: both row AND col are even (0-indexed)
export function isFixed(row, col) {
  return row % 2 === 0 && col % 2 === 0;
}

// Persons placed on the 4 inner fixed T-junctions
const FIXED_INNER_PERSONS = { '2,2': 9, '2,4': 10, '4,2': 11, '4,4': 12 };

function createFixedTile(row, col) {
  // Corner start tiles
  if (row === 0 && col === 0) return createTile(TILE_TYPES.CURVE, 0);   // right+bottom
  if (row === 0 && col === 6) return createTile(TILE_TYPES.CURVE, 90);  // bottom+left
  if (row === 6 && col === 0) return createTile(TILE_TYPES.CURVE, 270); // top+right
  if (row === 6 && col === 6) return createTile(TILE_TYPES.CURVE, 180); // top+left

  const person = FIXED_INNER_PERSONS[`${row},${col}`] ?? null;

  // Edge T-junctions open toward the inside
  if (row === 0) return createTile(TILE_TYPES.T, 0,   person); // R+B+L
  if (row === 6) return createTile(TILE_TYPES.T, 180, person); // T+R+L
  if (col === 0) return createTile(TILE_TYPES.T, 270, person); // T+R+B
  if (col === 6) return createTile(TILE_TYPES.T, 90,  person); // T+B+L

  // Inner fixed tiles
  const rotMap = { '2,2': 270, '2,4': 180, '4,2': 0, '4,4': 90 };
  return createTile(TILE_TYPES.T, rotMap[`${row},${col}`] ?? 0, person);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createInitialBoard(personCount = 12) {
  // 49 board tiles + 1 extra = 50 total; 16 fixed → 34 movable
  const fixedPersonIds = Object.values(FIXED_INNER_PERSONS);
  const extraPersonCount = Math.max(0, Math.min(personCount - fixedPersonIds.length, CHARACTERS.length - fixedPersonIds.length));
  const movablePersonIds = shuffle(
    CHARACTERS.filter(c => !fixedPersonIds.includes(c.id)).map(c => c.id)
  ).slice(0, extraPersonCount);

  // 34 movable tiles: 12 straight, 12 curve, 10 T
  const specs = shuffle([
    ...Array(12).fill(TILE_TYPES.STRAIGHT),
    ...Array(12).fill(TILE_TYPES.CURVE),
    ...Array(10).fill(TILE_TYPES.T),
  ]);

  const movableTiles = specs.map((type, i) => {
    const rotation = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
    const person = i < movablePersonIds.length ? movablePersonIds[i] : null;
    return createTile(type, rotation, person);
  });

  const shuffled = shuffle(movableTiles);
  let idx = 0;
  const board = Array.from({ length: 7 }, (_, row) =>
    Array.from({ length: 7 }, (_, col) =>
      isFixed(row, col) ? createFixedTile(row, col) : shuffled[idx++]
    )
  );

  return { board, extraTile: shuffled[idx] };
}
