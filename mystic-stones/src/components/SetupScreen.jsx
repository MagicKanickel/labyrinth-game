import { useState } from 'react';

const DOT_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f'];
const DEFAULTS   = ['Spieler 1', 'Spieler 2', 'Spieler 3', 'Spieler 4'];

export default function SetupScreen({ onStart, onBack }) {
  const [count, setCount] = useState(2);
  const [names, setNames] = useState(DEFAULTS);

  function handleStart() {
    const active = names.slice(0, count).map((n, i) => n.trim() || DEFAULTS[i]);
    onStart(active);
  }

  return (
    <div className="screen setup-screen">
      <div className="setup-card">
        <h2 className="setup-title">Spieler einrichten</h2>

        <div className="player-count-row">
          {[2, 3, 4].map(n => (
            <button
              key={n}
              className={`count-btn${count === n ? ' count-btn--active' : ''}`}
              onClick={() => setCount(n)}
            >
              {n} Spieler
            </button>
          ))}
        </div>

        <div className="name-inputs">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="name-input-row">
              <span className="name-dot" style={{ background: DOT_COLORS[i], boxShadow: `0 0 8px ${DOT_COLORS[i]}` }} />
              <input
                className="name-input"
                value={names[i]}
                onChange={e => setNames(n => n.map((v, j) => j === i ? e.target.value : v))}
                placeholder={DEFAULTS[i]}
                maxLength={20}
              />
            </div>
          ))}
        </div>

        <div className="setup-buttons">
          <button className="magic-btn magic-btn--ghost" onClick={onBack}>← Zurück</button>
          <button className="magic-btn" onClick={handleStart}>✦ Los geht's ✦</button>
        </div>
      </div>
    </div>
  );
}
