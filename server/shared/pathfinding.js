const DIRS = [
  { dr: -1, dc:  0, from: 'top',    to: 'bottom' },
  { dr:  0, dc:  1, from: 'right',  to: 'left'   },
  { dr:  1, dc:  0, from: 'bottom', to: 'top'    },
  { dr:  0, dc: -1, from: 'left',   to: 'right'  },
];

function getReachableTiles(board, startRow, startCol) {
  const visited = new Set([`${startRow},${startCol}`]);
  const queue = [[startRow, startCol]];
  const result = [[startRow, startCol]];

  while (queue.length) {
    const [row, col] = queue.shift();
    const conn = board[row][col].connections;
    for (const { dr, dc, from, to } of DIRS) {
      const nr = row + dr, nc = col + dc;
      if (nr < 0 || nr > 6 || nc < 0 || nc > 6) continue;
      const key = `${nr},${nc}`;
      if (visited.has(key)) continue;
      if (conn[from] && board[nr][nc].connections[to]) {
        visited.add(key);
        queue.push([nr, nc]);
        result.push([nr, nc]);
      }
    }
  }
  return result;
}

module.exports = { getReachableTiles };
