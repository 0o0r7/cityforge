import test from 'node:test';
import assert from 'node:assert/strict';

import { BOARD_SIZE, TILES } from '../src/engine/board.js';
import { rollDice, seedCommitment } from '../src/engine/dice.js';
import { MAX_ROUNDS, STAKE, START_BALANCE, apply, createGame, replay, settle } from '../src/engine/game.js';

const IDS = ['p1', 'p2', 'p3', 'p4'];

/** Plays a whole game, asserting conservation after every single transition. */
function playOut(seed, ids) {
  let state = createGame({ seed, players: ids });
  const actions = [];
  const step = (action) => {
    state = apply(state, action, seed);
    actions.push(action);
    const total = state.players.reduce((sum, p) => sum + p.balance, 0) + state.pot;
    assert.equal(total, ids.length * START_BALANCE, `conservation broken after ${action.type}`);
  };
  for (const id of ids) step({ type: 'join', playerId: id });
  let guard = 0;
  while (state.status !== 'settled' && guard < 1000) {
    step(state.pendingBuy ? { type: 'buy' } : { type: 'roll' });
    guard += 1;
  }
  assert.equal(state.status, 'settled', 'game never settled');
  return { state, actions };
}

test('board is a 16-tile ring with nine properties', () => {
  assert.equal(BOARD_SIZE, 16);
  assert.equal(TILES.length, 16);
  assert.equal(TILES.filter((t) => t.kind === 'property').length, 9);
  assert.deepEqual(TILES.map((t) => t.id), [...Array(16).keys()]);
});

test('dice are deterministic, in range, and unbiased enough to matter', () => {
  const seed = 'seed-abc';
  assert.deepEqual(rollDice(seed, 0), rollDice(seed, 0));
  assert.notDeepEqual(rollDice(seed, 0), rollDice('seed-xyz', 0));

  const counts = new Array(6).fill(0);
  for (let i = 0; i < 3000; i += 1) {
    for (const die of rollDice(seed, i)) {
      assert.ok(die >= 1 && die <= 6, `die out of range: ${die}`);
      counts[die - 1] += 1;
    }
  }
  const expected = 1000;
  for (const c of counts) {
    assert.ok(Math.abs(c - expected) < 120, `distribution skewed: ${counts.join(',')}`);
  }
});

test('commitment is stable and does not reveal the seed', () => {
  const seed = 'a-very-secret-seed';
  assert.equal(seedCommitment(seed), seedCommitment(seed));
  assert.equal(seedCommitment(seed).length, 64);
  assert.ok(!seedCommitment(seed).includes(seed));
});

test('pot after all joins equals players times stake', () => {
  let state = createGame({ seed: 's1', players: IDS });
  for (const id of IDS) state = apply(state, { type: 'join', playerId: id }, 's1');
  assert.equal(state.pot, IDS.length * STAKE);
  assert.equal(state.status, 'active');
});

test('a full game settles and conserves credits', () => {
  const { state } = playOut('seed-four', IDS);
  assert.ok(state.round <= MAX_ROUNDS + 1);
  assert.equal(state.pendingBuy, null);
});

test('replay from the revealed seed reproduces the identical game', () => {
  const seed = 'seed-replay';
  const { state, actions } = playOut(seed, IDS);
  const again = replay(seed, IDS, actions);
  assert.deepEqual(again, state);
  assert.deepEqual(settle(again), settle(state));
});

test('a different seed produces a different game', () => {
  const a = playOut('seed-one', IDS).state;
  const b = playOut('seed-two', IDS).state;
  assert.notDeepEqual(settle(a).balances, settle(b).balances);
});

test('settlement: payouts sum to the pot and the winner is the true argmax', () => {
  const { state } = playOut('seed-settle', IDS);
  const result = settle(state);
  assert.equal(result.payouts.reduce((a, b) => a + b, 0), result.pot);
  const best = Math.max(...result.balances);
  assert.equal(result.balances[result.winnerIdx], best);
  assert.equal(result.payouts[result.winnerIdx], result.pot);
  assert.equal(result.cap, result.pot);
});

test('illegal actions are rejected', () => {
  const state = createGame({ seed: 's2', players: ['a', 'b'] });
  assert.throws(() => apply(state, { type: 'roll' }, 's2'), /not active/);
  assert.throws(() => apply(state, { type: 'join', playerId: 'zz' }, 's2'), /unknown player/);
  assert.throws(() => apply(state, { type: 'buy' }, 's2'), /nothing to buy/);
});
