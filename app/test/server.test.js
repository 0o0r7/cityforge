import test from 'node:test';
import assert from 'node:assert/strict';

import { server } from '../src/server.js';

let base;

test.before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function call(path, options) {
  const response = await fetch(base + path, {
    headers: { 'content-type': 'application/json' },
    ...options,
  });
  return { status: response.status, body: await response.json() };
}

test('serves the board and the page', async () => {
  const board = await call('/api/board');
  assert.equal(board.status, 200);
  assert.equal(board.body.tiles.length, 16);

  const page = await fetch(base + '/');
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Forge Fair/);
});

test('a room plays to settlement and replays to the same state', async () => {
  const created = await call('/api/rooms', { method: 'POST', body: JSON.stringify({ players: 2 }) });
  assert.equal(created.status, 201);
  let room = created.body;
  assert.equal(room.status, 'active');
  assert.equal(room.pot, 400);
  assert.equal(room.seed, null, 'the seed stays hidden while the game runs');

  for (let i = 0; i < 400 && room.status === 'active'; i += 1) {
    const type = room.pendingBuy ? 'buy' : 'roll';
    const moved = await call(`/api/rooms/${room.id}/action`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
    assert.ok([200, 409].includes(moved.status), `unexpected status ${moved.status}`);
    room = moved.body.error ? (await call(`/api/rooms/${room.id}`)).body : moved.body;
  }

  assert.equal(room.status, 'settled');

  const settled = await call(`/api/rooms/${room.id}/settle`, { method: 'POST' });
  assert.equal(settled.status, 200);
  assert.equal(settled.body.replay.ok, true, 'replay must reproduce the final state');
  assert.equal(settled.body.seed.length, 32);
  assert.equal(settled.body.payouts[settled.body.winnerIdx], settled.body.pot);
});

test('rejects an action on a finished room and an unknown room', async () => {
  const missing = await call('/api/rooms/does-not-exist');
  assert.equal(missing.status, 404);

  const created = await call('/api/rooms', { method: 'POST', body: JSON.stringify({ players: 2 }) });
  const bad = await call(`/api/rooms/${created.body.id}/action`, {
    method: 'POST',
    body: JSON.stringify({ type: 'teleport' }),
  });
  assert.equal(bad.status, 409);
  assert.match(bad.body.error, /unknown action/);
});
