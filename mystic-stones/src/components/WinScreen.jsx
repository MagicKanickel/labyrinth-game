const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  left:     `${(i * 29 + 5) % 100}%`,
  top:      `${(i * 41 + 15) % 100}%`,
  size:     3 + (i % 5),
  delay:    `${((i * 0.25) % 3).toFixed(2)}s`,
  duration: `${(2.5 + (i % 4)).toFixed(1)}s`,
}));

export default function WinScreen({ winnerName, players, onRestart, onMenu }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="screen win-screen">
      <div className="ambient-particles">
        {PARTICLES.map((p, i) => (
          <span key={i} className="ambient-particle ambient-particle--gold" style={{
            left: p.left, top: p.top,
            width: p.size, height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }} />
        ))}
      </div>

      <div className="win-content">
        <div className="win-sparkle-row">✨ ⭐ ✨ 🌟 ✨ ⭐ ✨</div>
        <h1 className="win-title">Sieg!</h1>
        <div className="win-winner-name">{winnerName}</div>
        <div className="win-winner-sub">hat das Spiel gewonnen!</div>

        <div className="win-scoreboard">
          {sorted.map((p, i) => (
            <div key={i} className={`win-row${i === 0 ? ' win-row--first' : ''}`}>
              <span className="win-dot" style={{ background: p.color, boxShadow: `0 0 8px ${p.color}` }} />
              <span className="win-player-name">{p.name}</span>
              <span className="win-score">{p.score} {p.score === 1 ? 'Karte' : 'Karten'}</span>
            </div>
          ))}
        </div>

        <div className="win-buttons">
          <button className="magic-btn magic-btn--ghost" onClick={onMenu}>🏠 Menü</button>
          <button className="magic-btn" onClick={onRestart}>🔄 Nochmal</button>
        </div>
      </div>
    </div>
  );
}
