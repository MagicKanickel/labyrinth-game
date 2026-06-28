import TileView from './TileView';

export default function ExtraTilePanel({ extraTile, canRotate, onRotate, phase }) {
  return (
    <div className="extra-tile-panel">
      <div className="extra-tile-label">Extraplatte</div>
      <div className="extra-tile-wrapper">
        <TileView tile={extraTile} isExtra />
      </div>
      {phase === 'push' && (
        <button
          className="rotate-btn"
          onClick={() => onRotate((extraTile.rotation + 90) % 360)}
          disabled={!canRotate}
          title="Extraplatte drehen"
        >
          ↻ Drehen
        </button>
      )}
      {phase === 'push' && canRotate && (
        <p className="extra-hint">Wähle einen Pfeil um einzuschieben</p>
      )}
      {phase === 'move' && (
        <p className="extra-hint">Wähle ein Feld zum Bewegen</p>
      )}
    </div>
  );
}
