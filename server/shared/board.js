const { createTile, TILE_TYPES } = require('./tiles');

const CHARACTERS = [
  { id: 1,  name: 'Drache',        emoji: '🐉' },
  { id: 2,  name: 'Hexe',          emoji: '🧙' },
  { id: 3,  name: 'Geist',         emoji: '👻' },
  { id: 4,  name: 'Fledermaus',    emoji: '🦇' },
  { id: 5,  name: 'Totenkopf',     emoji: '💀' },
  { id: 6,  name: 'Spinne',        emoji: '🕷️' },
  { id: 7,  name: 'Eule',          emoji: '🦉' },
  { id: 8,  name: 'Wolf',          emoji: '🐺' },
  { id: 9,  name: 'Schatz',        emoji: '💎' },
  { id: 10, name: 'Schlüssel',     emoji: '🗝️' },
  { id: 11, name: 'Buch',          emoji: '📖' },
  { id: 12, name: 'Krone',         emoji: '👑' },
  { id: 13, name: 'Schwert',       emoji: '⚔️' },
  { id: 14, name: 'Schild',        emoji: '🛡️' },
  { id: 15, name: 'Ring',          emoji: '💍' },
  { id: 16, name: 'Trank',         emoji: '🧪' },
  { id: 17, name: 'Karte',         emoji: '🗺️' },
  { id: 18, name: 'Kerze',         emoji: '🕯️' },
  { id: 19, name: 'Spiegel',       emoji: '🪞' },
  { id: 20, name: 'Harfe',         emoji: '🎵' },
  { id: 21, name: 'Maus',          emoji: '🐭' },
  { id: 22, name: 'Schmetterling', emoji: '🦋' },
  { id: 23, name: 'Frosch',        emoji: '🐸' },
  { id: 24, name: 'Pilz',          emoji: '🍄' },
];

function getCharacter(id) {
  return CHARACTERS.find(c => c.id === id);
}

function isFixed(row, col) {
  return row % 2 === 0 && col % 2 === 0;
}

const FIXED_INNER_PERSONS = { '2,2': 9, '2,4': 10, '4,2': 11, '4,4': 12 };

function createFixedTile(row, col) {
  if (row === 0 && col === 0) return createTile(TILE_TYPES.CURVE, 0);
  if (row === 0 && col === 6) return createTile(TILE_TYPES.CURVE, 90);
  if (row === 6 && col === 0) return createTile(TILE_TYPES.CURVE, 270);
  if (row === 6 && col === 6) return createTile(TILE_TYPES.CURVE, 180);

  const person = FIXED_INNER_PERSONS[`${row},${col}`] ?? null;

  if (row === 0) return createTile(TILE_TYPES.T, 0,   person);
  if (row === 6) return createTile(TILE_TYPES.T, 180, person);
  if (col === 0) return createTile(TILE_TYPES.T, 270, person);
  if (col === 6) return createTile(TILE_TYPES.T, 90,  person);

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

function createInitialBoard(personCount = 12) {
  const fixedPersonIds = Object.values(FIXED_INNER_PERSONS);
  const extraCount = Math.max(0, Math.min(personCount - fixedPersonIds.length, CHARACTERS.length - fixedPersonIds.length));
  const movablePersonIds = shuffle(
    CHARACTERS.filter(c => !fixedPersonIds.includes(c.id)).map(c => c.id)
  ).slice(0, extraCount);

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

module.exports = { CHARACTERS, getCharacter, createInitialBoard };
