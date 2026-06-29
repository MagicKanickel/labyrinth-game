export default function MagicCard({ card, roundWinner, players }) {
  const { colors, colorNames, glows, foundCount } = card;
  const won = roundWinner != null;

  return (
    <div className={`magic-card${won ? ' magic-card--won' : ''}`}>
      <div className="magic-card-label">
        {won ? '✨ Gewonnen!' : '📜 Karte'}
      </div>

      {won && (
        <div className="magic-card-winner" style={{ color: players[roundWinner]?.color }}>
          {players[roundWinner]?.name}
        </div>
      )}

      <div className="card-colors">
        {colors.map((color, i) => {
          const status = i < foundCount ? 'found' : i === foundCount ? 'active' : 'pending';
          return (
            <div key={i} className={`card-color card-color--${status}`}
              style={{ '--c': color, '--g': glows[i] }}>
              <div className="card-gem" />
              <div className="card-color-name">{colorNames[i]}</div>
              {status === 'found'  && <span className="card-badge card-badge--check">✓</span>}
              {status === 'active' && <span className="card-badge card-badge--arrow">▶</span>}
            </div>
          );
        })}
      </div>

      {!won && (
        <div className="card-progress">
          <div className="card-progress-bar" style={{ width: `${(foundCount / 4) * 100}%` }} />
        </div>
      )}
    </div>
  );
}
