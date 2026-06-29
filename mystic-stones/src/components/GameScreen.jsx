import { POSITIONS, BOARD_SIZE } from '../game';
import Stone     from './Stone';
import MagicCard from './MagicCard';

const HALF = BOARD_SIZE / 2;

export default function GameScreen({ state, onFlip }) {
  const {
    stones, emptyPosition, card, currentPlayerIndex,
    players, phase, lastReveal, roundWinner,
  } = state;

  const canFlip = phase === 'choosing';
  const cp      = players[currentPlayerIndex];

  return (
    <div className="screen game-screen">

      {/* ── LEFT: player list ── */}
      <div className="game-sidebar">
        <div className="sidebar-label">Spieler</div>

        {players.map((p, i) => (
          <div key={i} className={`player-entry${i === currentPlayerIndex ? ' player-entry--active' : ''}`}>
            <span className="pe-dot" style={{ background: p.color, boxShadow: `0 0 8px ${p.color}` }} />
            <span className="pe-name">{p.name}</span>
            <div className="pe-gems">
              {Array.from({ length: 3 }).map((_, gi) => (
                <span key={gi} className={`score-gem${gi < p.score ? ' score-gem--lit' : ''}`}>◆</span>
              ))}
            </div>
          </div>
        ))}

        {/* Reveal feedback */}
        {lastReveal && (
          <div className={`reveal-box${lastReveal.correct ? ' reveal-box--ok' : ' reveal-box--err'}`}
            style={{ '--rc': lastReveal.color, '--rg': lastReveal.colorGlow }}>
            <div className="reveal-icon">{lastReveal.correct ? '✓' : '✗'}</div>
            <div className="reveal-color-ball" />
            <div className="reveal-color-name">{lastReveal.colorName}</div>
          </div>
        )}
      </div>

      {/* ── CENTER: hex board ── */}
      <div className="game-board-outer">
        <div className="game-board" style={{ width: BOARD_SIZE, height: BOARD_SIZE }}>
          {/* Decorative SVG */}
          <svg className="board-svg" viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}>
            {POSITIONS.slice(1).map(([x, y], i) => (
              <line key={`s${i}`}
                x1={HALF} y1={HALF} x2={x} y2={y}
                stroke="rgba(160,110,240,0.1)" strokeWidth="1" strokeDasharray="3 8" />
            ))}
            {POSITIONS.slice(1).map(([x, y], i) => {
              const [nx, ny] = POSITIONS[1 + ((i + 1) % 6)];
              return <line key={`r${i}`} x1={x} y1={y} x2={nx} y2={ny}
                stroke="rgba(160,110,240,0.07)" strokeWidth="1" />;
            })}
            <circle cx={HALF} cy={HALF} r="20" fill="none"
              stroke="rgba(180,130,255,0.15)" strokeWidth="1" />
          </svg>

          {/* Pedestals */}
          {POSITIONS.map(([x, y], i) => (
            <div key={i}
              className={`stone-pedestal${i === emptyPosition ? ' stone-pedestal--empty' : ''}`}
              style={{ left: x, top: y }}
            />
          ))}

          {/* Stones */}
          {stones.map(stone => {
            const [px, py] = POSITIONS[stone.position];
            return (
              <Stone
                key={stone.id}
                stone={stone}
                px={px} py={py}
                canFlip={canFlip}
                onFlip={onFlip}
              />
            );
          })}
        </div>

        {/* Turn indicator below board */}
        {cp && (
          <div className="turn-banner" style={{ '--pc': cp.color }}>
            <span className="turn-pulse" />
            <span className="turn-name">{cp.name}</span>
            <span className="turn-sub">wählt einen Stein</span>
          </div>
        )}
      </div>

      {/* ── RIGHT: card + celebrating overlay ── */}
      <div className="game-right">
        <MagicCard card={card} roundWinner={roundWinner} players={players} />
      </div>

      {/* Celebrating overlay */}
      {phase === 'celebrating' && roundWinner != null && (
        <div className="celebrate-overlay">
          <div className="celebrate-burst">✨</div>
          <div className="celebrate-text" style={{ color: players[roundWinner].color }}>
            {players[roundWinner].name}
          </div>
          <div className="celebrate-sub">hat die Karte gewonnen!</div>
        </div>
      )}
    </div>
  );
}
