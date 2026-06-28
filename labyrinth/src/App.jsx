import { useState } from 'react';
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
            💡 {hint.type === 'push' ? `Tipp: ${hint.side} → Reihe ${hint.index}` : 'Tipp: grünes Feld'}
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

// ── Online game view ──────────────────────────────────────────────────────────
function OnlineGame({ og }) {
  const { gameState, myId, chat, timeLeft, isMyTurn, pushTile, movePiece, skipMove, rotateExtra, sendChat, voteKick, returnToMenu } = og;
  if (!gameState) return <div className="app"><div className="status-bar">Verbinde…</div></div>;

  const { phase, board, extraTile, players, currentPlayerIndex, lastPush, reachableTiles, newTilePos, winner, config } = gameState;
  const currentPlayer = players[currentPlayerIndex];
  const myPlayer      = players.find(p => p.id === myId);

  const phaseLabel =
    phase === 'push' ? (isMyTurn ? 'Schiebe eine Platte ein' : `${currentPlayer?.name} schiebt ein…`) :
    phase === 'move' ? (isMyTurn ? 'Wähle ein Zielfeld'      : `${currentPlayer?.name} bewegt sich…`) : '';

  // Adapt players for offline CardPanel (add isBot=false, currentCardIndex)
  const adaptedPlayers = players.map(p => ({
    ...p,
    isBot: false,
    cards: Array.from({ length: p.cardCount ?? 0 }, (_, i) => i + 1), // fake ids for count
    currentCardIndex: p.currentCardIndex ?? 0,
  }));

  return (
    <div className="app online-layout">
      {phase === 'end' && (winner != null ? (
        <WinOverlay winner={players[winner]} onNewGame={returnToMenu} />
      ) : (
        <WinOverlay winner={null} onNewGame={returnToMenu} abandoned />
      ))}

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

      <div className="cards-row">
        {players.map((p, i) => {
          // Only show MY card face-up; others see card count
          const isMe = p.id === myId;
          return (
            <CardPanel
              key={p.id}
              player={{
                ...p,
                isBot: false,
                cards: Array.from({ length: p.cardCount ?? 0 }),
                currentCardIndex: p.currentCardIndex ?? 0,
              }}
              isActive={currentPlayerIndex === i && phase !== 'end'}
              hideAll={!isMe}
              peekable={false}
            />
          );
        })}
      </div>

      <div className="board-area online-board-area">
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
            onRotate={(rot) => rotateExtra(rot)}
            phase={isMyTurn ? phase : 'spectating'}
          />
        )}
      </div>

      {phase === 'move' && isMyTurn && (
        <div className="skip-bar">
          <button className="skip-btn" onClick={skipMove}>Hier bleiben</button>
        </div>
      )}

      <ChatPanel
        chat={chat}
        players={players}
        myId={myId}
        onSend={sendChat}
        onVoteKick={voteKick}
        showVotekick
      />
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
