import TileView from './TileView';

export default function ExtraTilePanel({ extraTile, canRotate, onRotate, phase, hint }) {
  const rotSteps = (hint?.type === 'push' && hint.rotation != null)
    ? ((hint.rotation - extraTile.rotation + 360) % 360) / 90
    : 0;

  return (
    <div className="extra-tile-panel">
      <div className="extra-tile-label">Extraplatte</div>
      <div className="extra-tile-wrapper">
        <TileView tile={extraTile} isExtra />
      </div>
      {phase === 'push' && (
        <button
          className={`rotate-btn${rotSteps > 0 ? ' hint-arrow' : ''}`}
          onClick={() => onRotate((extraTile.rotation + 90) % 360)}
          disabled={!canRotate}
          title="Extraplatte drehen"
        >
          ↻ Drehen
        </button>
      )}
      {phase === 'push' && rotSteps > 0 && (
        <p className="extra-hint hint-rotate">💡 Noch {rotSteps}× drehen</p>
      )}
      {phase === 'push' && canRotate && rotSteps === 0 && (
        <p className="extra-hint">Wähle einen Pfeil um einzuschieben</p>
      )}
      {phase === 'move' && (
        <p className="extra-hint">Wähle ein Feld zum Bewegen</p>
      )}
    </div>
  );
}
