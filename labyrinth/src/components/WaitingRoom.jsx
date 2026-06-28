import ChatPanel from './ChatPanel';

const DIFFICULTIES = [
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
];

export default function WaitingRoom({
  isHost, code, players, config, chat, myId,
  onStart, onUpdateConfig, onSendChat, onVoteKick, onLeave,
}) {
  const connected = players.filter(p => p.connected);

  function set(key, val) { onUpdateConfig({ [key]: val }); }

  return (
    <div className="waiting-room">
      <div className="waiting-left">
        {/* Header */}
        <div className="waiting-header">
          <h2>🔒 Private Lobby</h2>
          {code && (
            <div className="lobby-code-display">
              <span className="lobby-code-label">Code</span>
              <span className="lobby-code">{code}</span>
              <button
                className="copy-btn"
                onClick={() => navigator.clipboard.writeText(code)}
                title="In Zwischenablage kopieren"
              >📋</button>
            </div>
          )}
        </div>

        {/* Player list */}
        <div className="waiting-players">
          <h3>Spieler ({connected.length}/{config.maxPlayers})</h3>
          {players.map(p => (
            <div key={p.id} className={`waiting-player ${p.connected ? '' : 'disconnected'}`}>
              <span className="player-dot" style={{ background: p.color }} />
              <span className="waiting-player-name">{p.name}</span>
              {p.id === myId && <span className="you-badge">Du</span>}
              {isHost && p.id !== myId && p.connected && (
                <button className="kick-btn" onClick={() => onVoteKick(p.id)} title="Spieler entfernen">✕</button>
              )}
            </div>
          ))}
        </div>

        {/* Config (host only) */}
        {isHost && (
          <div className="waiting-config">
            <h3>Einstellungen</h3>
            <label className="config-row">
              <span>Max. Spieler</span>
              <div className="config-controls">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d.value}
                    className={`diff-btn small ${config.maxPlayers === d.value ? 'selected' : ''}`}
                    onClick={() => set('maxPlayers', d.value)}
                  >{d.label}</button>
                ))}
              </div>
            </label>

            <label className="config-row">
              <span>Karten pro Spieler</span>
              <div className="config-controls">
                <button onClick={() => set('cardsPerPlayer', Math.max(1, (config.cardsPerPlayer ?? 4) - 1))}>−</button>
                <span className="config-value">{config.cardsPerPlayer ?? 4}</span>
                <button onClick={() => set('cardsPerPlayer', Math.min(8, (config.cardsPerPlayer ?? 4) + 1))}>+</button>
              </div>
            </label>

            <label className="config-row">
              <span>Zugzeit (Sek.)</span>
              <div className="config-controls">
                <button onClick={() => set('turnTime', Math.max(10, (config.turnTime ?? 60) - 10))}>−</button>
                <span className="config-value">{config.turnTime ?? 60}s</span>
                <button onClick={() => set('turnTime', Math.min(120, (config.turnTime ?? 60) + 10))}>+</button>
              </div>
            </label>

            <label className="config-row">
              <span>Figuren</span>
              <div className="config-controls">
                <button onClick={() => set('personsCount', Math.max(8, (config.personsCount ?? 12) - 1))}>−</button>
                <span className="config-value">{config.personsCount ?? 12}</span>
                <button onClick={() => set('personsCount', Math.min(24, (config.personsCount ?? 12) + 1))}>+</button>
              </div>
            </label>

            <button
              className="start-btn"
              disabled={connected.length < 2}
              onClick={onStart}
              style={{ marginTop: 8 }}
            >
              {connected.length < 2 ? 'Warte auf Spieler…' : 'Spiel starten'}
            </button>
          </div>
        )}

        {!isHost && (
          <div className="waiting-info">Warte auf Host…</div>
        )}

        <button className="skip-btn" style={{ marginTop: 'auto' }} onClick={onLeave}>← Verlassen</button>
      </div>

      <ChatPanel chat={chat} players={players} myId={myId} onSend={onSendChat} onVoteKick={onVoteKick} showVotekick={!isHost} />
    </div>
  );
}
