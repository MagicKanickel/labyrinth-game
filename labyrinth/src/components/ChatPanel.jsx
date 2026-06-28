import { useState, useEffect, useRef } from 'react';

export default function ChatPanel({ chat, players, myId, onSend, onVoteKick, showVotekick = true, onToggle }) {
  const [msg, setMsg]   = useState('');
  const bottomRef       = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  function submit(e) {
    e.preventDefault();
    if (!msg.trim()) return;
    onSend(msg.trim());
    setMsg('');
  }

  const others = players.filter(p => p.connected && p.id !== myId);

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-header-top">
          <span>💬 Chat</span>
          {onToggle && (
            <button className="chat-toggle-btn" onClick={onToggle} title="Chat ausblenden">✕</button>
          )}
        </div>
        {showVotekick && others.length > 0 && (
          <div className="votekick-section">
            {others.map(p => (
              <button
                key={p.id}
                className="votekick-btn"
                onClick={() => onVoteKick(p.id)}
                title={`Votekick gegen ${p.name}`}
              >
                <span className="player-dot" style={{ background: p.color }} />
                {p.name} <span className="kick-icon">⊘</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="chat-messages">
        {chat.map((m, i) => (
          <div key={i} className={`chat-msg ${m.system ? 'system' : ''}`}>
            {!m.system && <span className="chat-from">{m.from}: </span>}
            <span className="chat-text">{m.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-row" onSubmit={submit}>
        <input
          className="chat-input"
          placeholder="Nachricht…"
          value={msg}
          maxLength={200}
          onChange={e => setMsg(e.target.value)}
        />
        <button type="submit" className="chat-send-btn" disabled={!msg.trim()}>➤</button>
      </form>
    </div>
  );
}
