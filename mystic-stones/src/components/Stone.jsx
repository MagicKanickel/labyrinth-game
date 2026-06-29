// Individual stone – position (left/top) injected by parent so CSS transition animates moves
export default function Stone({ stone, px, py, canFlip, onFlip }) {
  const { id, color, colorGlow, flipped } = stone;

  return (
    <div
      className={`stone-wrapper${canFlip ? ' stone-wrapper--clickable' : ''}`}
      style={{ left: px, top: py, animationDelay: `${id * 0.55}s` }}
      onClick={() => canFlip && onFlip(id)}
    >
      <div className={`stone-inner${flipped ? ' stone-inner--flipped' : ''}`}>
        <div className="stone-face">
          <span className="stone-rune">᛭</span>
        </div>
        <div className="stone-back" style={{ '--c': color, '--g': colorGlow }} />
      </div>
    </div>
  );
}
