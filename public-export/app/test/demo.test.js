import test from 'node:test';
import assert from 'node:assert/strict';

import { runBot } from '../src/demo.js';
import { apply, createGame } from '../src/engine/game.js';

const SEED = 'c0ffee'.repeat(6).slice(0, 32);

function seatedRoom(players = 3) {
  const ids = Array.from({ length: players }, (_, i) => `p${i + 1}`);
  let state = createGame({ seed: SEED, players: ids });
  const actions = [];
  for (const playerId of ids) {
    const action = { type: 'join', playerId };
    state = apply(state, action, SEED);
    actions.push(action);
  }
  return { seed: SEED, playerIds: ids, actions, state };
}

test('the bot plays a real room to settlement', () => {
  const room = seatedRoom(3);
  const { frames } = runBot(room);

  assert.equal(room.state.status, 'settled');
  assert.ok(frames.length > 10, 'a match is more than a few moves');
  assert.equal(frames.at(-1).state.status, 'settled');
  assert.equal(frames.length, room.actions.length - 3, 'one frame per action after the joins');
});

test('every frame carries narration and a snapshot', () => {
  const { frames } = runBot(seatedRoom(2));

  for (const frame of frames) {
    assert.ok(frame.narration.length > 5, `frame ${frame.n}: ${frame.narration}`);
    assert.equal(frame.state.players.length, 2);
    assert.ok(Number.isFinite(frame.state.pot));
    assert.equal(typeof frame.state.owners, 'object');
  }
});

test('the bot keeps its reserve when it buys', () => {
  const { frames } = runBot(seatedRoom(4));

  for (const frame of frames) {
    if (frame.action !== 'buy') continue;
    const buyer = frame.state.players.find((player) => player.id === frame.playerId);
    assert.ok(buyer.balance >= 200, `frame ${frame.n}: balance ${buyer.balance}`);
  }
});

test('narration names the tile a roll landed on', () => {
  const { frames } = runBot(seatedRoom(2));
  const rolled = frames.filter((frame) => frame.action === 'roll' && frame.dice);

  assert.ok(rolled.length > 0);
  for (const frame of rolled.slice(0, 10)) {
    assert.match(frame.narration, /rolls \d \+ \d = \d+ → /);
  }
});
