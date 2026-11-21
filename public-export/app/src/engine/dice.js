// Committed-seed dice.
//
// The operator publishes sha256(seed) when the room is created, so a roll cannot be
// re-rolled after the board is visible. Rejection sampling keeps the six outcomes
// uniform: 252 is the largest multiple of 6 that fits in a byte, so bytes 252..255
// are discarded instead of folded in with a modulo.

import { createHash } from 'node:crypto';

export function seedCommitment(seed) {
  return createHash('sha256').update(String(seed)).digest('hex');
}

function fairDie(seed, index, dieIndex) {
  for (let attempt = 0; attempt < 256; attempt += 1) {
    const byte = createHash('sha256')
      .update(`${seed}:${index}:${dieIndex}:${attempt}`)
      .digest()[0];
    if (byte < 252) return (byte % 6) + 1;
  }
  throw new Error('dice stream exhausted');
}

/** Returns the [die, die] pair for the n-th roll of this seed. Deterministic and replayable. */
export function rollDice(seed, index) {
  return [fairDie(seed, index, 0), fairDie(seed, index, 1)];
}
