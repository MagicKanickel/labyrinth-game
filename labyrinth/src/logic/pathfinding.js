const DIRS = [
  { dr: -1, dc: 0, from: 'top',    to: 'bottom' },
  { dr:  0, dc: 1, from: 'right',  to: 'left'   },
  { dr:  1, dc: 0, from: 'bottom', to: 'top'    },
  { dr:  0, dc:-1, from: 'left',   to: 'right'  },
];

export function getReachableTiles(board, startRow, startCol) {
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

// Returns 7×7 distance matrix; Infinity = unreachable
export function getDistances(board, startRow, startCol) {
  const dist = Array.from({ length: 7 }, () => Array(7).fill(Infinity));
  dist[startRow][startCol] = 0;
  const queue = [[startRow, startCol]];

  while (queue.length) {
    const [row, col] = queue.shift();
    const conn = board[row][col].connections;
    for (const { dr, dc, from, to } of DIRS) {
      const nr = row + dr, nc = col + dc;
      if (nr < 0 || nr > 6 || nc < 0 || nc > 6) continue;
      if (dist[nr][nc] !== Infinity) continue;
      if (conn[from] && board[nr][nc].connections[to]) {
        dist[nr][nc] = dist[row][col] + 1;
        queue.push([nr, nc]);
      }
    }
  }
  return dist;
}
