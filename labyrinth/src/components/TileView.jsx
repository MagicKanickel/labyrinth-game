import { getCharacter } from '../logic/board';

const S = 56;
const P = 19;   // path start
const W = 18;   // path width

const WALL = '#2d5a27';
const PATH = '#e8d5a3';

export default function TileView({
  tile,
  isReachable = false,
  isHintMove = false,   // learning mode: best move destination
  isStart = false,      // corner start tile
  startColor = null,    // color of the owning player
  onClick,
  isExtra = false,
}) {
  const { connections: c, person } = tile;
  const char = person ? getCharacter(person) : null;

  const hlFill   = isHintMove ? 'rgba(80,220,120,0.30)' : isReachable ? 'rgba(255,230,80,0.32)' : 'none';
  const hlStroke = isHintMove ? 'rgba(80,220,120,0.9)'  : isReachable ? 'rgba(255,230,80,0.75)' : 'none';

  return (
    <svg
      width={S} height={S}
      onClick={onClick}
      style={{
        display: 'block',
        cursor: onClick ? 'pointer' : 'default',
        filter: isExtra ? 'drop-shadow(0 0 6px rgba(255,255,255,0.4))' : undefined,
      }}
    >
      {/* Wall */}
      <rect width={S} height={S} fill={WALL} rx={isExtra ? 4 : 0} />

      {/* Path segments */}
      <rect x={P}   y={P}   width={W} height={W}     fill={PATH} />
      {c.top    && <rect x={P}   y={0}   width={W} height={P}     fill={PATH} />}
      {c.right  && <rect x={P+W} y={P}   width={S-P-W} height={W} fill={PATH} />}
      {c.bottom && <rect x={P}   y={P+W} width={W} height={S-P-W} fill={PATH} />}
      {c.left   && <rect x={0}   y={P}   width={P} height={W}     fill={PATH} />}

      {/* Start-position marker */}
      {isStart && startColor && (
        <>
          <rect width={S} height={S} fill="none" stroke={startColor} strokeWidth={3} strokeOpacity={0.7} />
          <text x={S/2} y={10} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill={startColor} fontWeight="bold" style={{ userSelect: 'none' }}>
            START
          </text>
        </>
      )}

      {/* Person emoji */}
      {char && (
        <text x={S/2} y={S/2+1} textAnchor="middle" dominantBaseline="middle" fontSize={18} style={{ userSelect: 'none' }}>
          {char.emoji}
        </text>
      )}

      {/* Reachable / hint highlight */}
      {(isReachable || isHintMove) && (
        <rect width={S} height={S} fill={hlFill} stroke={hlStroke} strokeWidth={2} style={{ pointerEvents: 'none' }} />
      )}
    </svg>
  );
}
