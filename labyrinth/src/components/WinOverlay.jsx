import { useMemo } from 'react';

const COLORS = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#e67e22', '#1abc9c', '#ff6b9d'];
const SHAPES = ['●', '■', '▲', '★', '◆'];

function randomBetween(a, b) { return a + Math.random() * (b - a); }

export default function WinOverlay({ winner, onNewGame }) {
  const confetti = useMemo(() => (
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left:    randomBetween(0, 100),
      delay:   randomBetween(0, 1.8),
      dur:     randomBetween(2.0, 3.5),
      size:    randomBetween(10, 22),
      color:   COLORS[i % COLORS.length],
      shape:   SHAPES[i % SHAPES.length],
      xDrift:  randomBetween(-120, 120),
      rot:     randomBetween(0, 720),
    }))
  ), []);

  return (
    <div className="win-overlay">
      {/* Confetti particles */}
      {confetti.map(p => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            fontSize: p.size,
            color: p.color,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            '--x-drift': `${p.xDrift}px`,
            '--rot': `${p.rot}deg`,
          }}
        >
          {p.shape}
        </span>
      ))}

      {/* Winner card */}
      <div
        className="win-card"
        style={{ borderColor: winner.color, boxShadow: `0 0 60px ${winner.color}66, 0 0 120px ${winner.color}33` }}
      >
        <div className="win-trophy">🏆</div>
        <div className="win-name" style={{ color: winner.color }}>{winner.name}</div>
        <div className="win-subtitle">hat gewonnen!</div>
        <div className="win-stars">⭐ ⭐ ⭐</div>
        <button className="start-btn win-btn" onClick={onNewGame}>
          Neues Spiel
        </button>
      </div>
    </div>
  );
}
