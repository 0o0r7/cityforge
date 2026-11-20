import test from 'node:test';
import assert from 'node:assert/strict';

import { CIRCUIT, proveSettlement, readSignals, settlementWitness } from '../src/zk/prove.js';

// A real settlement from the engine: pot 2970, balances [770, 0, 20, 240], winner 0.
const settled = { payouts: [2970, 0, 0, 0], balances: [770, 0, 20, 240], pot: 2970, winnerIdx: 0 };

test('a real settlement proves and verifies locally', async () => {
  const result = await proveSettlement(settled);
  assert.equal(result.verified, true);
  assert.equal(result.publicSignals.length, CIRCUIT.publicSignals.length);
  assert.equal(result.signals.pot, '2970');
  assert.equal(result.signals.cap, '2970');
  assert.equal(result.signals.winnerIdx, '0');
  assert.match(result.signals.payoutsHash, /^\d+$/);
  assert.match(result.signals.balancesHash, /^\d+$/);
});

test('public signals are named in circuit order', () => {
  const signals = readSignals(['1', '2', '3', '4', '5', '6']);
  assert.deepEqual(signals, {
    payoutsHash: '1',
    balancesHash: '2',
    pot: '3',
    cap: '4',
    nonce: '5',
    winnerIdx: '6',
  });
});

test('a hand-picked winner is rejected at witness generation', async () => {
  await assert.rejects(
    () => proveSettlement({ ...settled, winnerIdx: 2 }),
    /Assert Failed|Error in template/,
  );
});

test('a hidden rake is rejected at witness generation', async () => {
  await assert.rejects(
    () => proveSettlement({ ...settled, payouts: [2969, 1, 0, 0] }),
    /Assert Failed|Error in template/,
  );
});

test('the witness carries fresh salts and a nonce per settlement', () => {
  const a = settlementWitness(settled);
  const b = settlementWitness(settled);
  assert.notEqual(a.nonce, b.nonce);
  assert.notDeepEqual(a.salts, b.salts);
  assert.deepEqual(a.payouts, ['2970', '0', '0', '0']);
});
