// Pure push logic shared by game hook and bot

export function applyPush(board, extraTile, side, index, players) {
  const newBoard = board.map(row => row.map(tile => ({ ...tile })));
  const newPlayers = players.map(p => ({ ...p, position: { ...p.position } }));
  let pushedOut;

  if (side === 'left') {
    pushedOut = newBoard[index][6];
    for (let c = 6; c > 0; c--) newBoard[index][c] = newBoard[index][c - 1];
    newBoard[index][0] = { ...extraTile };
    newPlayers.forEach(p => {
      if (p.position.row === index)
        p.position.col = p.position.col === 6 ? 0 : p.position.col + 1;
    });
  } else if (side === 'right') {
    pushedOut = newBoard[index][0];
    for (let c = 0; c < 6; c++) newBoard[index][c] = newBoard[index][c + 1];
    newBoard[index][6] = { ...extraTile };
    newPlayers.forEach(p => {
      if (p.position.row === index)
        p.position.col = p.position.col === 0 ? 6 : p.position.col - 1;
    });
  } else if (side === 'top') {
    pushedOut = newBoard[6][index];
    for (let r = 6; r > 0; r--) newBoard[r][index] = newBoard[r - 1][index];
    newBoard[0][index] = { ...extraTile };
    newPlayers.forEach(p => {
      if (p.position.col === index)
        p.position.row = p.position.row === 6 ? 0 : p.position.row + 1;
    });
  } else { // bottom
    pushedOut = newBoard[0][index];
    for (let r = 0; r < 6; r++) newBoard[r][index] = newBoard[r + 1][index];
    newBoard[6][index] = { ...extraTile };
    newPlayers.forEach(p => {
      if (p.position.col === index)
        p.position.row = p.position.row === 0 ? 6 : p.position.row - 1;
    });
  }

  return { newBoard, pushedOut, newPlayers };
}

const OPPOSITE = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' };

export function isReversePush(lastPush, side, index) {
  if (!lastPush) return false;
  return lastPush.side === OPPOSITE[side] && lastPush.index === index;
}

export function getAllPushPositions(lastPush) {
  const positions = [];
  for (const side of ['left', 'right', 'top', 'bottom']) {
    for (const index of [1, 3, 5]) {
      if (!isReversePush(lastPush, side, index)) {
        positions.push({ side, index });
      }
    }
  }
  return positions;
}
