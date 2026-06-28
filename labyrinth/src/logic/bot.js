import { applyPush, getAllPushPositions } from './push';
import { getReachableTiles, getDistances } from './pathfinding';
import { getConnections } from './tiles';

const ROTATIONS = [0, 90, 180, 270];

// Find where a person is on the board; returns {row,col} or null
function findPerson(board, personId) {
  for (let r = 0; r < 7; r++)
    for (let c = 0; c < 7; c++)
      if (board[r][c].person === personId) return { row: r, col: c };
  return null;
}

// Score a board state for a given player (lower distance to target = better)
function scoreForPlayer(board, player) {
  const card = player.cards[player.currentCardIndex];
  if (card == null) return 0;
  const target = findPerson(board, card);
  if (!target) return 0;
  const dist = getDistances(board, player.position.row, player.position.col);
  const d = dist[target.row][target.col];
  return d === Infinity ? -100 : -d; // higher = better (less distance)
}

// Evaluate best move destination for a given board state
function bestMoveFor(board, player) {
  const reachable = getReachableTiles(board, player.position.row, player.position.col);
  const card = player.cards[player.currentCardIndex];
  if (card == null) {
    // No more cards → go to start
    const target = player.startPosition;
    const found = reachable.find(([r, c]) => r === target.row && c === target.col);
    return found ? { row: found[0], col: found[1] } : { row: reachable[0][0], col: reachable[0][1] };
  }
  const target = findPerson(board, card);
  if (target) {
    const found = reachable.find(([r, c]) => r === target.row && c === target.col);
    if (found) return { row: found[0], col: found[1] };
  }
  // Move to closest reachable tile to target
  const dist = target ? getDistances(board, target.row, target.col) : null;
  if (dist) {
    let best = null, bestD = Infinity;
    for (const [r, c] of reachable) {
      if (dist[r][c] < bestD) { bestD = dist[r][c]; best = { row: r, col: c }; }
    }
    if (best) return best;
  }
  return { row: reachable[0][0], col: reachable[0][1] };
}

// ─── Difficulty implementations ──────────────────────────────────────────────

function randomPushAction(state) {
  const positions = getAllPushPositions(state.lastPush);
  const pos = positions[Math.floor(Math.random() * positions.length)];
  const rotation = ROTATIONS[Math.floor(Math.random() * 4)];
  return { ...pos, rotation };
}

function greedyPushAction(state, bot, human) {
  const positions = getAllPushPositions(state.lastPush);
  let bestScore = -Infinity, bestAction = null;

  for (const pos of positions) {
    for (const rotation of ROTATIONS) {
      const rotated = { ...state.extraTile, rotation, connections: getConnections(state.extraTile.type, rotation) };
      const { newBoard, newPlayers } = applyPush(state.board, rotated, pos.side, pos.index, state.players);
      const newBot = newPlayers[bot.id];
      const score = scoreForPlayer(newBoard, newBot);
      if (score > bestScore) { bestScore = score; bestAction = { ...pos, rotation }; }
    }
  }
  return bestAction ?? randomPushAction(state);
}

function hardPushAction(state, bot, human) {
  const positions = getAllPushPositions(state.lastPush);
  let bestScore = -Infinity, bestAction = null;

  for (const pos of positions) {
    for (const rotation of ROTATIONS) {
      const rotated = { ...state.extraTile, rotation, connections: getConnections(state.extraTile.type, rotation) };
      const { newBoard, newPlayers } = applyPush(state.board, rotated, pos.side, pos.index, state.players);
      const newBot   = newPlayers[bot.id];
      const newHuman = newPlayers[human.id];
      const score = scoreForPlayer(newBoard, newBot) - 0.5 * scoreForPlayer(newBoard, newHuman);
      if (score > bestScore) { bestScore = score; bestAction = { ...pos, rotation }; }
    }
  }
  return bestAction ?? randomPushAction(state);
}

// Learning: stored difficulty level in [0..1], persisted in localStorage
const LEARNING_KEY = 'labyrinth_bot_skill';
function getLearningSkill() {
  return parseFloat(localStorage.getItem(LEARNING_KEY) ?? '0.3');
}
export function updateLearningSkill(botWon) {
  let skill = getLearningSkill();
  skill = botWon ? Math.max(0.1, skill - 0.05) : Math.min(0.9, skill + 0.1);
  localStorage.setItem(LEARNING_KEY, skill.toFixed(2));
}

// ─── Main exported function ───────────────────────────────────────────────────

export function computeBotPush(state) {
  const bot   = state.players.find(p => p.isBot);
  const human = state.players.find(p => !p.isBot);
  const diff  = state.config.botDifficulty;

  if (diff === 'easy') return randomPushAction(state);
  if (diff === 'medium') return greedyPushAction(state, bot, human);
  if (diff === 'hard') return hardPushAction(state, bot, human);

  // Learning: blend random ↔ hard based on stored skill level
  const skill = getLearningSkill();
  return Math.random() < skill
    ? hardPushAction(state, bot, human)
    : randomPushAction(state);
}

export function computeBotMove(state) {
  const bot = state.players.find(p => p.isBot);
  return bestMoveFor(state.board, bot);
}

// ─── Learning-mode hints (compute best move for the HUMAN) ───────────────────

export function computeHintPush(state) {
  const human = state.players.find(p => !p.isBot);
  const bot   = state.players.find(p => p.isBot);
  if (!human) return null;
  return greedyPushAction(state, human, bot);
}

export function computeHintMove(state) {
  const human = state.players.find(p => !p.isBot);
  return human ? bestMoveFor(state.board, human) : null;
}
