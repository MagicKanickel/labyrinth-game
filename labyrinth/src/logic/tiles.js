export const TILE_TYPES = { STRAIGHT: 'straight', CURVE: 'curve', T: 't' };

// Base connections at rotation=0
const BASE = {
  straight: { top: true,  right: false, bottom: true,  left: false },
  curve:    { top: false, right: true,  bottom: true,  left: false },
  t:        { top: false, right: true,  bottom: true,  left: true  },
};

export function getConnections(type, rotation) {
  let { top, right, bottom, left } = BASE[type];
  const steps = ((rotation / 90) % 4 + 4) % 4;
  // Each 90° CW rotation: new = [left, top, right, bottom]
  for (let i = 0; i < steps; i++) {
    [top, right, bottom, left] = [left, top, right, bottom];
  }
  return { top, right, bottom, left };
}

export function createTile(type, rotation = 0, person = null) {
  return { type, rotation: ((rotation % 360) + 360) % 360, person, connections: getConnections(type, rotation) };
}

export function rotateTile(tile, steps = 1) {
  const rotation = (tile.rotation + steps * 90) % 360;
  return { ...tile, rotation, connections: getConnections(tile.type, rotation) };
}
