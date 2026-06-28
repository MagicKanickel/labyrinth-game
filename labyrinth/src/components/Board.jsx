import TileView from './TileView';

const TILE   = 56;
const ARROW  = 36;
const GAP    = 2;
const MOVABLE = [1, 3, 5];

// board-grid has border:3px + padding:2px → content starts 5px from outer edge
const GRID_OFFSET = 5;

// Pixel center of board tile (r, c) relative to the outer position:relative wrapper
const tileCenter = (r, c) => ({
  x: GRID_OFFSET + ARROW + GAP + c * (TILE + GAP) + TILE / 2,
  y: GRID_OFFSET + ARROW + GAP + r * (TILE + GAP) + TILE / 2,
});

const ARROW_SYMBOLS = { left: '→', right: '←', top: '↓', bottom: '↑' };
const ARROW_TITLES  = {
  left: 'Links einschieben', right: 'Rechts einschieben',
  top:  'Oben einschieben',  bottom: 'Unten einschieben',
};
const OPP = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' };

const SLIDE_SIDE = {
  left:   { dir: 'Left',   dx: -(TILE + GAP), dy: 0 },
  right:  { dir: 'Right',  dx:  (TILE + GAP), dy: 0 },
  top:    { dir: 'Top',    dx: 0, dy: -(TILE + GAP) },
  bottom: { dir: 'Bottom', dx: 0, dy:  (TILE + GAP) },
};

// Start positions per player id
const START_POS = { '0,0': 0, '6,6': 1 };

export default function Board({
  board,
  players,
  reachableTiles,
  phase,
  lastPush,
  newTilePos,       // { row, col, count }
  animatingPlayer,  // player id whose move should animate
  hint,             // { type:'push'|'move', side?, index?, row?, col? }
  onPush,
  onMove,
}) {
  const canPush = phase === 'push';
  const canMove = phase === 'move';

  const isForbidden  = (side, index) => !!(lastPush && lastPush.side === OPP[side] && lastPush.index === index);
  const isReachable  = (r, c) => reachableTiles.some(([rr, cc]) => rr === r && cc === c);
  const isNewTile    = (r, c) => newTilePos && r === newTilePos.row && c === newTilePos.col;
  const isHintMove   = (r, c) => hint?.type === 'move' && hint.row === r && hint.col === c;
  const isHintArrow  = (side, idx) => hint?.type === 'push' && hint.side === side && hint.index === idx;

  // Build push arrows
  const arrows = ['left', 'right', 'top', 'bottom'].flatMap(side =>
    MOVABLE.map(index => {
      const isH     = side === 'left' || side === 'right';
      const gridCol  = isH ? (side === 'left' ? 1 : 9) : index + 2;
      const gridRow  = !isH ? (side === 'top' ? 1 : 9) : index + 2;
      const forbidden = isForbidden(side, index);
      const isHint   = isHintArrow(side, index);

      return (
        <button
          key={`${side}-${index}`}
          className={`push-arrow${forbidden ? ' forbidden' : ''}${isHint ? ' hint-arrow' : ''}`}
          style={{ gridRow, gridColumn: gridCol, width: ARROW, height: ARROW }}
          disabled={!canPush || forbidden}
          onClick={() => onPush(side, index)}
          title={forbidden ? 'Rückgängig-Zug verboten' : ARROW_TITLES[side]}
        >
          {ARROW_SYMBOLS[side]}
        </button>
      );
    })
  );

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        className="board-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `${ARROW}px repeat(7, ${TILE}px) ${ARROW}px`,
          gridTemplateRows:    `${ARROW}px repeat(7, ${TILE}px) ${ARROW}px`,
          gap: GAP,
        }}
      >
        {arrows}

        {board.map((row, r) =>
          row.map((tile, c) => {
            const isNew = isNewTile(r, c);
            const side  = lastPush?.index === r ? (lastPush?.side === 'left' ? 'left' : 'right') :
                          lastPush?.index === c ? (lastPush?.side === 'top'  ? 'top'  : 'bottom') : null;
            const slideClass = isNew && side ? `tile-slide-${SLIDE_SIDE[side]?.dir.toLowerCase()}` : '';
            const playerStart = START_POS[`${r},${c}`];
            const startColor  = playerStart != null ? players[playerStart]?.color : null;

            return (
              <div
                key={isNew ? `${r}-${c}-${newTilePos.count}` : `${r}-${c}`}
                className={slideClass}
                style={{ gridRow: r + 2, gridColumn: c + 2 }}
              >
                <TileView
                  tile={tile}
                  isReachable={canMove && isReachable(r, c)}
                  isHintMove={canMove && isHintMove(r, c)}
                  isStart={playerStart != null}
                  startColor={startColor}
                  onClick={canMove && isReachable(r, c) ? () => onMove(r, c) : undefined}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Player pieces overlay */}
      {players.map(player => {
        const { row, col } = player.position;
        const { x, y } = tileCenter(row, col);
        const animate = animatingPlayer === player.id;
        return (
          <div
            key={player.id}
            className="player-piece"
            style={{
              position: 'absolute',
              left: x,
              top: y,
              background: player.color,
              transition: animate ? 'left 0.45s ease-out, top 0.45s ease-out' : 'none',
            }}
            title={player.name}
          >
            <span className="player-piece-initial">{player.name[0]}</span>
          </div>
        );
      })}
    </div>
  );
}
