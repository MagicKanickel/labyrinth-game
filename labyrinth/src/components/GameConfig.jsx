import { useState } from 'react';

const DIFFICULTIES = [
  { value: 'easy',     label: 'Leicht',     desc: 'Bot spielt zufällig' },
  { value: 'medium',   label: 'Mittel',     desc: 'Bot versucht sein Ziel zu erreichen' },
  { value: 'hard',     label: 'Schwer',     desc: 'Bot blockiert auch den Spieler' },
  { value: 'learning', label: 'Lernmodus',  desc: 'Bot passt sich an Siege/Niederlagen an' },
];

export default function GameConfig({ onStart }) {
  const [config, setConfig] = useState({
    cardsPerPlayer: 4,
    personsCount: 12,
    botDifficulty: 'medium',
    twoPlayer: false,
  });

  const set = (key, val) => setConfig(c => ({ ...c, [key]: val }));

  const minPersons = config.cardsPerPlayer * 2;

  return (
    <div className="config-screen">
      <h1 className="game-title">🔮 Das verrückte Labyrinth</h1>
      <p className="game-subtitle">Finde alle Figuren und kehre zu deinem Startfeld zurück!</p>

      <div className="config-card">
        <h2>Spieleinstellungen</h2>

        {/* Game mode */}
        <div className="config-row vertical">
          <span>Spielmodus</span>
          <div className="mode-grid">
            <button
              className={`diff-btn ${!config.twoPlayer ? 'selected' : ''}`}
              onClick={() => set('twoPlayer', false)}
            >
              <strong>🤖 vs. Bot</strong>
              <small>Spiele gegen den Computer</small>
            </button>
            <button
              className={`diff-btn ${config.twoPlayer ? 'selected' : ''}`}
              onClick={() => set('twoPlayer', true)}
            >
              <strong>👥 2 Spieler</strong>
              <small>Lokal am selben Gerät</small>
            </button>
          </div>
        </div>

        <label className="config-row">
          <span>Karten pro Spieler</span>
          <div className="config-controls">
            <button onClick={() => set('cardsPerPlayer', Math.max(1, config.cardsPerPlayer - 1))}>−</button>
            <span className="config-value">{config.cardsPerPlayer}</span>
            <button onClick={() => set('cardsPerPlayer', Math.min(8, config.cardsPerPlayer + 1))}>+</button>
          </div>
        </label>

        <label className="config-row">
          <span>Figuren auf dem Spielfeld</span>
          <div className="config-controls">
            <button onClick={() => set('personsCount', Math.max(minPersons, config.personsCount - 1))}>−</button>
            <span className="config-value">{config.personsCount}</span>
            <button onClick={() => set('personsCount', Math.min(24, config.personsCount + 1))}>+</button>
          </div>
        </label>

        {!config.twoPlayer && (
          <div className="config-row vertical">
            <span>Bot-Schwierigkeit</span>
            <div className="difficulty-grid">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.value}
                  className={`diff-btn ${config.botDifficulty === d.value ? 'selected' : ''}`}
                  onClick={() => set('botDifficulty', d.value)}
                >
                  <strong>{d.label}</strong>
                  <small>{d.desc}</small>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button className="start-btn" onClick={() => onStart(config)}>
        Spiel starten
      </button>
    </div>
  );
}
