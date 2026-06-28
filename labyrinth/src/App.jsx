import { useState, useRef, useEffect, useCallback } from 'react';
import { useGame }       from './hooks/useGame';
import { useOnlineGame } from './hooks/useOnlineGame';
import GameConfig    from './components/GameConfig';
import Board         from './components/Board';
import CardPanel     from './components/CardPanel';
import ExtraTilePanel from './components/ExtraTilePanel';
import WinOverlay    from './components/WinOverlay';
import OnlineMenu    from './components/OnlineMenu';
import WaitingRoom   from './components/WaitingRoom';
import ChatPanel     from './components/ChatPanel';
import './App.css';

// ── Offline game ─────────────────────────────────────────────────────────────
function OfflineGame() {
  const { state, startGame, rotateExtra, pushTile, movePlayer, skipMove, resetGame, hint } = useGame();
  const {
    phase, board, extraTile, players, currentPlayerIndex,
    lastPush, winner, reachableTiles, animatingPlayer, newTilePos, config,
  } = state;

  if (phase === 'config') return <GameConfig onStart={startGame} />;

  const currentPlayer = players[currentPlayerIndex];
  const isHumanTurn   = currentPlayer && !currentPlayer.isBot;
  const isLearning    = config.botDifficulty === 'learning' && !config.twoPlayer;
  const isTwoPlayer   = !!config.twoPlayer;

  const phaseLabel =
    phase === 'push' ? (isHumanTurn ? 'Schiebe eine Platte ein' : 'Bot schiebt ein…') :
    phase === 'move' ? (isHumanTurn ? 'Wähle ein Zielfeld'      : 'Bot bewegt sich…') : '';

  return (
    <div className="app">
      {phase === 'end' && winner != null && (
        <WinOverlay winner={players[winner]} onNewGame={resetGame} />
      )}
      <div className="status-bar">
        <span className="status-player" style={{ color: currentPlayer.color }}>● {currentPlayer.name}</span>
        <span className="status-phase">{phaseLabel}</span>
        {isLearning && hint && (
          <span className="hint-label">
            {hint.type === 'push'
              ? (() => {
                  const sides = { left: 'Links', right: 'Rechts', top: 'Oben', bottom: 'Unten' };
                  const steps = ((hint.rotation - extraTile.rotation + 360) % 360) / 90;
                  return `💡 Tipp: ${sides[hint.side]} → Reihe ${hint.index + 1}${steps > 0 ? ` (${steps}× drehen)` : ''}`;
                })()
              : '💡 Tipp: grünes Feld'}
          </span>
        )}
        <button className="reset-btn" onClick={resetGame}>Neues Spiel</button>
      </div>

      <div className="cards-row">
        {players.map((player, i) => (
          <CardPanel
            key={player.id}
            player={player}
            isActive={currentPlayerIndex === i && phase !== 'end'}
            hideAll={!isTwoPlayer && player.isBot && !isLearning}
            peekable={isTwoPlayer}
          />
        ))}
      </div>

      <div className="board-area">
        <Board
          board={board}
          players={players}
          reachableTiles={reachableTiles}
          phase={phase}
          lastPush={lastPush}
          newTilePos={newTilePos}
          animatingPlayer={animatingPlayer}
          hint={isLearning ? hint : null}
          onPush={(side, index) => { if (isHumanTurn && phase === 'push') pushTile(side, index); }}
          onMove={(r, c)        => { if (isHumanTurn && phase === 'move') movePlayer(r, c); }}
        />
        <ExtraTilePanel
          extraTile={extraTile}
          canRotate={isHumanTurn}
          onRotate={rotateExtra}
          phase={phase}
          hint={isLearning ? hint : null}
        />
      </div>

      {phase === 'move' && isHumanTurn && (
        <div className="skip-bar">
          <button className="skip-btn" onClick={skipMove}>Hier bleiben</button>
        </div>
      )}
    </div>
  );
}

// ── Drag-resize helper ────────────────────────────────────────────────────────
function usePanelResize(initial, min, max) {
  const [size, setSize] = useState(initial);
  const sizeRef = useRef(initial);
  useEffect(() => { sizeRef.current = size; }, [size]);

  const onDragStart = useCallback((e, direction = 1) => {
    e.preventDefault();
    const clientX0 = e.touches ? e.touches[0].clientX : e.clientX;
    const startSize = sizeRef.current;
    const move = (me) => {
      const clientX = me.touches ? me.touches[0].clientX : me.clientX;
      setSize(Math.max(min, Math.min(max, startSize + (clientX - clientX0) * direction)));
    };
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend', up);
  }, [min, max]);

  return [size, onDragStart];
}

// ── Online game view ──────────────────────────────────────────────────────────
function OnlineGame({ og }) {
  const [chatOpen, setChatOpen] = useState(true);
  const [leftWidth,  startLeftResize]  = usePanelResize(210, 120, 380);
  const [rightWidth, startRightResize] = usePanelResize(260, 150, 420);
  const { gameState, myId, chat, timeLeft, isMyTurn, pushTile, movePiece, skipMove, rotateExtra, sendChat, voteKick, returnToMenu } = og;
  if (!gameState) return <div className="online-game"><div className="status-bar">Verbinde…</div></div>;

  const { phase, board, extraTile, players, currentPlayerIndex, lastPush, reachableTiles, newTilePos, winner } = gameState;
  const currentPlayer = players[currentPlayerIndex];
  const myPlayer      = players.find(p => p.id === myId);

  const phaseLabel =
    phase === 'push' ? (isMyTurn ? 'Schiebe eine Platte ein' : `${currentPlayer?.name} schiebt ein…`) :
    phase === 'move' ? (isMyTurn ? 'Wähle ein Zielfeld'      : `${currentPlayer?.name} bewegt sich…`) : '';

  return (
    <div className="online-game">
      {phase === 'end' && (winner != null ? (
        <WinOverlay winner={players[winner]} onNewGame={returnToMenu} />
      ) : (
        <WinOverlay winner={null} onNewGame={returnToMenu} abandoned />
      ))}

      {/* Status bar */}
      <div className="status-bar">
        {currentPlayer && (
          <>
            <span className="status-player" style={{ color: currentPlayer.color }}>● {currentPlayer.name}</span>
            <span className="status-phase">{phaseLabel}</span>
          </>
        )}
        {timeLeft != null && phase !== 'end' && (
          <span className={`timer-badge ${timeLeft <= 10 ? 'urgent' : ''}`}>⏱ {timeLeft}s</span>
        )}
        <button className="reset-btn" onClick={returnToMenu}>Verlassen</button>
      </div>

      {/* 3-column main */}
      <div className="online-main">

        {/* LEFT: player list + my card */}
        <div className="online-left" style={{ width: leftWidth, minWidth: leftWidth, maxWidth: leftWidth }}>
          <div className="online-players-list">
            <div className="online-section-title">Spieler</div>
            {players.map((p, i) => (
              <div key={p.id} className={`online-player-row${currentPlayerIndex === i ? ' current-turn' : ''}`}>
                <span className="player-dot" style={{ background: p.color }} />
                <span className="online-player-name">{p.name}</span>
                {p.id === myId && <span className="you-badge">Du</span>}
                <span className="online-found-count">{Math.min(p.currentCardIndex ?? 0, p.cardCount ?? 0)}/{p.cardCount ?? 0}</span>
              </div>
            ))}
          </div>

          {myPlayer && (
            <div className="online-my-card">
              <div className="online-section-title">Deine Karte</div>
              <CardPanel
                player={myPlayer}
                isActive={isMyTurn && phase !== 'end'}
                hideAll={false}
                peekable={true}
              />
            </div>
          )}
        </div>

        {/* Resize handle: left ↔ center */}
        <div
          className="resize-handle-h"
          onMouseDown={(e) => startLeftResize(e, 1)}
          onTouchStart={(e) => startLeftResize(e, 1)}
        />

        {/* CENTER: board + extra tile */}
        <div className="online-center">
          <div className="online-board-scroll">
            {board && (
              <Board
                board={board}
                players={players}
                reachableTiles={reachableTiles ?? []}
                phase={isMyTurn ? phase : 'spectating'}
                lastPush={lastPush}
                newTilePos={newTilePos}
                animatingPlayer={null}
                hint={null}
                onPush={(side, index) => { if (isMyTurn && phase === 'push') pushTile(side, index); }}
                onMove={(r, c)        => { if (isMyTurn && phase === 'move') movePiece(r, c); }}
              />
            )}
            {extraTile && (
              <ExtraTilePanel
                extraTile={extraTile}
                canRotate={isMyTurn && phase === 'push'}
                onRotate={rotateExtra}
                phase={isMyTurn ? phase : 'spectating'}
              />
            )}
          </div>
          {phase === 'move' && isMyTurn && (
            <div className="skip-bar">
              <button className="skip-btn" onClick={skipMove}>Hier bleiben</button>
            </div>
          )}
        </div>

        {/* Resize handle: center ↔ right (only when chat open) */}
        {chatOpen && (
          <div
            className="resize-handle-h"
            onMouseDown={(e) => startRightResize(e, -1)}
            onTouchStart={(e) => startRightResize(e, -1)}
          />
        )}

        {/* RIGHT: collapsible chat */}
        <div
          className={`online-right${chatOpen ? '' : ' chat-collapsed'}`}
          style={{ width: chatOpen ? rightWidth : 40, minWidth: chatOpen ? rightWidth : 40 }}
        >
          {chatOpen ? (
            <ChatPanel
              chat={chat}
              players={players}
              myId={myId}
              onSend={sendChat}
              onVoteKick={voteKick}
              showVotekick
              onToggle={() => setChatOpen(false)}
            />
          ) : (
            <button className="chat-open-tab" onClick={() => setChatOpen(true)} title="Chat öffnen">
              💬
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Matchmaking waiting screen ────────────────────────────────────────────────
function MatchmakingScreen({ info, onLeave }) {
  return (
    <div className="config-screen">
      <div className="matchmaking-spinner">🎲</div>
      <h2>Spieler werden gesucht…</h2>
      {info && (
        <>
          <p style={{ color: '#8b949e' }}>Warteschlange: {info.total} Spieler</p>
          {info.countdown != null && (
            <p style={{ color: '#f1c40f' }}>Startet in {info.countdown}s</p>
          )}
        </>
      )}
      <button className="skip-btn" style={{ marginTop: 24 }} onClick={onLeave}>Abbrechen</button>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState('home'); // home | offline | online
  const og = useOnlineGame();

  // Handle join-from-online-menu
  function handleOnlineBack(action) {
    if (action?.action === 'join') {
      og.saveNickname(action.nickname);
      og.joinLobby(action.code);
    } else {
      setMode('home');
    }
  }

  if (mode === 'offline') return <OfflineGame />;

  if (mode === 'online') {
    if (og.screen === 'menu') {
      return (
        <OnlineMenu
          nickname={og.nickname}
          onSaveNickname={og.saveNickname}
          onCreateLobby={og.createLobby}
          onJoinMatchmaking={og.joinMatchmaking}
          onBack={handleOnlineBack}
          error={og.error}
          onClearError={() => og.setError(null)}
        />
      );
    }
    if (og.screen === 'matchmaking') {
      return <MatchmakingScreen info={og.matchmakingInfo} onLeave={og.leaveMatchmaking} />;
    }
    if (og.screen === 'waiting') {
      return (
        <WaitingRoom
          isHost={og.isHost}
          code={og.lobbyCode}
          players={og.players}
          config={og.config}
          chat={og.chat}
          myId={og.myId}
          onStart={og.startGame}
          onUpdateConfig={og.updateConfig}
          onSendChat={og.sendChat}
          onVoteKick={og.voteKick}
          onLeave={og.returnToMenu}
        />
      );
    }
    if (og.screen === 'game' || og.screen === 'end') {
      return <OnlineGame og={og} />;
    }
  }

  // Home screen
  return (
    <div className="config-screen">
      <h1 className="game-title">🔮 Das verrückte Labyrinth</h1>
      <p className="game-subtitle">Finde alle Figuren und kehre zu deinem Startfeld zurück!</p>
      <div className="home-btn-grid">
        <button className="start-btn home-btn" onClick={() => setMode('offline')}>
          🎮 Offline spielen
        </button>
        <button className="start-btn home-btn online-btn" onClick={() => { og.returnToMenu(); setMode('online'); }}>
          🌐 Online spielen
        </button>
      </div>
    </div>
  );
}
