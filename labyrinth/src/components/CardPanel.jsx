import { useState, useEffect } from 'react';
import { getCharacter } from '../logic/board';

export default function CardPanel({ player, isActive, hideAll = false, peekable = false }) {
  const { cards, currentCardIndex, foundAll, color, name } = player;
  const [revealed, setRevealed] = useState(false);

  // Auto-hide when turn changes or a card is found
  useEffect(() => { setRevealed(false); }, [isActive, currentCardIndex]);

  const doneCards   = cards.slice(0, currentCardIndex);
  const currentCard = !foundAll ? cards[currentCardIndex] : null;
  const remainCards = cards.length - currentCardIndex - 1;
  const currentChar = currentCard ? getCharacter(currentCard) : null;

  // What to render inside card-current
  let cardFace;
  if (hideAll) {
    cardFace = (
      <>
        <span className="card-emoji-big">🂠</span>
        <span className="card-label">Versteckt</span>
      </>
    );
  } else if (peekable && !isActive) {
    cardFace = (
      <>
        <span className="card-emoji-big">🂠</span>
        <span className="card-label">Nicht dein Zug</span>
      </>
    );
  } else if (peekable && isActive && !revealed) {
    cardFace = (
      <div className="peek-overlay">
        <span className="peek-icon">👁</span>
        <span className="peek-label">Tippen zum Ansehen</span>
      </div>
    );
  } else {
    cardFace = (
      <>
        <span className="card-emoji-big">{currentChar?.emoji}</span>
        <span className="card-label">{currentChar?.name}</span>
        <span className="card-sublabel">Finde diese Figur!</span>
      </>
    );
  }

  const isClickable = peekable && isActive;

  return (
    <div className={`card-panel ${isActive ? 'active' : ''}`}>
      <div className="card-panel-header" style={{ borderColor: color }}>
        <span className="player-dot" style={{ background: color }} />
        <span>{name}</span>
        {isActive && <span className="turn-badge">Am Zug</span>}
      </div>

      {/* Done pile */}
      {doneCards.length > 0 && (
        <div className="done-pile">
          {doneCards.map(id => {
            const ch = getCharacter(id);
            return (
              <div key={id} className="card-done">
                <span>✓</span>
                <span>{ch?.emoji}</span>
                <span>{ch?.name}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Draw pile with shadow stack */}
      {!foundAll && cards.length > 0 && (
        <div className="draw-pile">
          {remainCards >= 2 && <div className="card-shadow shadow-3" />}
          {remainCards >= 1 && <div className="card-shadow shadow-2" />}
          <div className="card-shadow shadow-1" />

          <div
            className={`card-current${isClickable ? ' peekable' : ''}`}
            style={{ borderColor: color }}
            onClick={isClickable ? () => setRevealed(r => !r) : undefined}
          >
            {cardFace}
          </div>
        </div>
      )}

      {/* All found – back to start */}
      {foundAll && (
        <div className="draw-pile">
          <div className="card-current" style={{ borderColor: color }}>
            <span className="card-emoji-big">🏠</span>
            <span className="card-label">Zurück zum Start!</span>
          </div>
        </div>
      )}

      <div className="card-progress">
        {Math.min(currentCardIndex, cards.length)}/{cards.length} gefunden
      </div>
    </div>
  );
}
