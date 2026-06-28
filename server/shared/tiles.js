const TILE_TYPES = { STRAIGHT: 'straight', CURVE: 'curve', T: 't' };

const BASE = {
  straight: { top: true,  right: false, bottom: true,  left: false },
  curve:    { top: false, right: true,  bottom: true,  left: false },
  t:        { top: false, right: true,  bottom: true,  left: true  },
};

function getConnections(type, rotation) {
  let { top, right, bottom, left } = BASE[type];
  const steps = ((rotation / 90) % 4 + 4) % 4;
  for (let i = 0; i < steps; i++) {
    [top, right, bottom, left] = [left, top, right, bottom];
  }
  return { top, right, bottom, left };
}

function createTile(type, rotation = 0, person = null) {
  return { type, rotation: ((rotation % 360) + 360) % 360, person, connections: getConnections(type, rotation) };
}

function rotateTile(tile, steps = 1) {
  const rotation = (tile.rotation + steps * 90) % 360;
  return { ...tile, rotation, connections: getConnections(tile.type, rotation) };
}

module.exports = { TILE_TYPES, getConnections, createTile, rotateTile };
