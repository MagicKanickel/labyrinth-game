import { useState } from 'react';

export default function OnlineMenu({ nickname, onSaveNickname, onCreateLobby, onJoinMatchmaking, onBack, error, onClearError }) {
  const [name, setName]     = useState(nickname);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining]   = useState(false);
  const [creating, setCreating] = useState(false);

  const valid = name.trim().length >= 2;

  function handleCreate() {
    onSaveNickname(name.trim());
    onCreateLobby({});
    setCreating(true);
  }

  function handleJoin() {
    if (!joinCode.trim()) return;
    onSaveNickname(name.trim());
    setJoining(true);
    // joinLobby is called from parent via the join button click
    // We need to pass the join code up
    onBack({ action: 'join', code: joinCode.trim().toUpperCase(), nickname: name.trim() });
  }

  function handleMatchmaking() {
    onSaveNickname(name.trim());
    onJoinMatchmaking();
  }

  return (
    <div className="config-screen">
      <h1 className="game-title">🔮 Online spielen</h1>
      <p className="game-subtitle">Spiele gegen andere Spieler weltweit</p>

      {error && (
        <div className="online-error" onClick={onClearError}>
          ⚠️ {error} <span style={{ float: 'right', cursor: 'pointer' }}>✕</span>
        </div>
      )}

      <div className="config-card">
        <h2>Dein Name</h2>
        <div className="config-row">
          <input
            className="name-input"
            placeholder="Nickname (min. 2 Zeichen)"
            value={name}
            maxLength={20}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && valid && handleCreate()}
          />
        </div>
      </div>

      <div className="online-mode-grid">
        {/* Private lobby */}
        <div className="online-mode-card">
          <div className="online-mode-icon">🔒</div>
          <h3>Private Lobby</h3>
          <p>Erstelle eine Lobby und lade Freunde ein</p>
          <button className="start-btn" disabled={!valid} onClick={handleCreate}>
            Lobby erstellen
          </button>
          <div className="or-divider">oder beitreten</div>
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <input
              className="code-input"
              placeholder="XXXXXX"
              value={joinCode}
              maxLength={6}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && valid && joinCode.length === 6 && handleJoin()}
            />
            <button
              className="start-btn"
              style={{ padding: '8px 16px', flex: '0 0 auto', width: 'auto' }}
              disabled={!valid || joinCode.length !== 6}
              onClick={handleJoin}
            >
              Beitreten
            </button>
          </div>
        </div>

        {/* Public matchmaking */}
        <div className="online-mode-card">
          <div className="online-mode-icon">🌍</div>
          <h3>Public Match</h3>
          <p>Automatische Spielersuche — bis zu 4 Spieler, 30s Zugzeit</p>
          <button className="start-btn" disabled={!valid} onClick={handleMatchmaking}>
            Spieler suchen
          </button>
        </div>
      </div>

      <button className="skip-btn" style={{ marginTop: 16 }} onClick={onBack}>
        ← Zurück zum Menü
      </button>
    </div>
  );
}
