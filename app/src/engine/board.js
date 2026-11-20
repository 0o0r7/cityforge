// The board: 16 tiles in a ring. Rent depends only on the tile, never on negotiation,
// so the whole rulebook fits in this file and can be replayed by a stranger.

export const TILES = [
  { id: 0, kind: 'start', name: 'Start' },
  { id: 1, kind: 'property', name: 'Ash Gate', tier: 1, price: 100, rent: 20 },
  { id: 2, kind: 'property', name: 'Cinder Row', tier: 1, price: 100, rent: 20 },
  { id: 3, kind: 'tax', name: 'Toll', amount: 50 },
  { id: 4, kind: 'property', name: 'Iron Yard', tier: 2, price: 200, rent: 50 },
  { id: 5, kind: 'rest', name: 'Rest' },
  { id: 6, kind: 'property', name: 'Copper Lane', tier: 1, price: 100, rent: 20 },
  { id: 7, kind: 'property', name: 'Salt Market', tier: 2, price: 200, rent: 50 },
  { id: 8, kind: 'jail', name: 'Hold' },
  { id: 9, kind: 'property', name: 'Bell Court', tier: 1, price: 100, rent: 20 },
  { id: 10, kind: 'tax', name: 'Levy', amount: 50 },
  { id: 11, kind: 'property', name: 'Forge Works', tier: 2, price: 200, rent: 50 },
  { id: 12, kind: 'rest', name: 'Well' },
  { id: 13, kind: 'property', name: 'High Vault', tier: 2, price: 200, rent: 50 },
  { id: 14, kind: 'property', name: 'Mill Row', tier: 1, price: 100, rent: 20 },
  { id: 15, kind: 'tax', name: 'Gate Duty', amount: 50 },
];

export const BOARD_SIZE = TILES.length;

export function tileAt(pos) {
  return TILES[pos];
}
