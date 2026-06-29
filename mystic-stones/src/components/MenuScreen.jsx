import { useState, useRef, useCallback, useMemo } from 'react';
import { POSITIONS, BOARD_SIZE } from '../game';

const HALF = BOARD_SIZE / 2;

// Deterministic ambient particles (no Math.random in render)
const PARTICLES = Array.from({ length: 32 }, (_, i) => ({
  left:     `${(i * 31 + 11) % 100}%`,
  top:      `${(i * 47 + 7)  % 100}%`,
  size:     2 + (i % 4),
  delay:    `${((i * 0.37) % 4).toFixed(2)}s`,
  duration: `${(3 + (i % 6)).toFixed(1)}s`,
}));

export default function MenuScreen({ onPlay }) {
  const [offsets, setOffsets] = useState(() => Array(6).fill({ x: 0, y: 0 }));
  const boardRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = BOARD_SIZE / rect.width;
    const scaleY = BOARD_SIZE / rect.height;
    const bx = (e.clientX - rect.left) * scaleX;
    const by = (e.clientY - rect.top)  * scaleY;

    setOffsets(POSITIONS.slice(1).map(([px, py]) => {
      const dx   = bx - px;
      const dy   = by - py;
      const dist = Math.hypot(dx, dy);
      if (dist > 140 || dist < 1) return { x: 0, y: 0 };
      const force = ((140 - dist) / 140) * 20;
      return { x: -(dx / dist) * force, y: -(dy / dist) * force };
    }));
  }, []);

  const handleMouseLeave = useCallback(() => {
    setOffsets(Array(6).fill({ x: 0, y: 0 }));
  }, []);

  return (
    <div className="screen menu-screen">
      <div className="ambient-particles">
        {PARTICLES.map((p, i) => (
          <span key={i} className="ambient-particle" style={{
            left: p.left, top: p.top,
            width: p.size, height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }} />
        ))}
      </div>

      <div className="menu-content">
        <div className="menu-title-area">
          <h1 className="menu-title">Mystic Stones</h1>
          <p className="menu-subtitle">Das magische Gedächtnisrätsel</p>
        </div>

        <div className="menu-board-perspective">
          <div
            className="menu-board"
            ref={boardRef}
            style={{ width: BOARD_SIZE, height: BOARD_SIZE }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* SVG decorations */}
            <svg className="board-svg" viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}>
              {/* Spoke lines from center */}
              {POSITIONS.slice(1).map(([x, y], i) => (
                <line key={`spoke-${i}`}
                  x1={POSITIONS[0][0]} y1={POSITIONS[0][1]} x2={x} y2={y}
                  stroke="rgba(160,110,240,0.12)" strokeWidth="1" strokeDasharray="4 9"
                />
              ))}
              {/* Outer ring */}
              {POSITIONS.slice(1).map(([x, y], i) => {
                const [nx, ny] = POSITIONS[1 + ((i + 1) % 6)];
                return <line key={`rim-${i}`} x1={x} y1={y} x2={nx} y2={ny}
                  stroke="rgba(160,110,240,0.08)" strokeWidth="1" />;
              })}
              {/* Center glyph */}
              <circle cx={HALF} cy={HALF} r="18" fill="none"
                stroke="rgba(180,130,255,0.18)" strokeWidth="1" />
              <circle cx={HALF} cy={HALF} r="8" fill="none"
                stroke="rgba(180,130,255,0.12)" strokeWidth="1" />
            </svg>

            {/* Pedestals */}
            {POSITIONS.map(([x, y], i) => (
              <div key={i} className="stone-pedestal" style={{ left: x, top: y }} />
            ))}

            {/* Animated stones */}
            {POSITIONS.slice(1).map(([x, y], i) => (
              <div
                key={i}
                className="menu-stone"
                style={{
                  left: x + offsets[i].x,
                  top:  y + offsets[i].y,
                  animationDelay: `${i * 0.38}s`,
                }}
              >
                <div className="menu-stone-rune">᛭</div>
              </div>
            ))}
          </div>
        </div>

        <button className="magic-btn menu-play-btn" onClick={onPlay}>
          ✦ Spiel beginnen ✦
        </button>

        <p className="menu-hint">
          Bewege die Maus über die Steine
        </p>
      </div>
    </div>
  );
}
