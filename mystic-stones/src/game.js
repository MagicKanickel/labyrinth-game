export const STONE_COLORS = [
  { hex: '#c0392b', name: 'Rubinrot',   glow: '#ff4444' },
  { hex: '#2980b9', name: 'Saphirblau', glow: '#44aaff' },
  { hex: '#27ae60', name: 'Smaragd',    glow: '#44ff88' },
  { hex: '#f39c12', name: 'Goldgelb',   glow: '#ffcc44' },
  { hex: '#8e44ad', name: 'Amethyst',   glow: '#cc66ff' },
  { hex: '#16a085', name: 'Türkis',     glow: '#44ffdd' },
];

export const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f'];

// 480×480 board, center at (240,240), hex radius 145px
export const BOARD_SIZE = 480;
const CX = 240;
const CY = 240;
const R  = 145;

// pos 0 = center (starts empty), pos 1-6 = hexagonal ring
export const POSITIONS = [
  [CX, CY],
  ...Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI) / 3; // 0°, 60°, 120°, 180°, 240°, 300°
    return [Math.round(CX + R * Math.cos(a)), Math.round(CY - R * Math.sin(a))];
  }),
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function makeCard() {
  const picks = shuffle([...STONE_COLORS]).slice(0, 4);
  return {
    colors:     picks.map(c => c.hex),
    colorNames: picks.map(c => c.name),
    glows:      picks.map(c => c.glow),
    foundCount: 0,
  };
}

export function createGame(playerNames) {
  const order = shuffle([...STONE_COLORS]);
  const stones = order.map((sc, i) => ({
    id:        i,
    color:     sc.hex,
    colorName: sc.name,
    colorGlow: sc.glow,
    position:  i + 1, // positions 1–6; center (0) is empty at start
    flipped:   false,
  }));

  return {
    stones,
    emptyPosition: 0,
    card: makeCard(),
    currentPlayerIndex: 0,
    players: playerNames.map((name, i) => ({
      name,
      score: 0,
      color: PLAYER_COLORS[i],
    })),
    phase:      'choosing', // choosing | busy | celebrating | gameOver
    lastReveal: null,       // { stoneId, correct, color, colorName }
    roundWinner: null,
    gameWinner:  null,
    winnerName:  null,
  };
}
