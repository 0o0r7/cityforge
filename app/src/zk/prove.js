// Settlement proof — layer 2 of the settlement check.
//
// Layer 1 is the deterministic replay of the game from the revealed seed: it proves the
// rules were followed. Layer 2 is this Groth16 proof over app/circuits/settle.circom: it
// binds the payout vector the operator actually pays to the committed balances, so a
// hidden rake, a cap breach or a hand-picked winner cannot survive a verifier. The two
// layers are reported separately in the settlement response rather than merged into one
// "fully verified" claim.

import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const snarkjs = require('snarkjs');

const ZK_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'zk');
const SEATS = 4; // Settle(MAXP) is compiled with four seats

export const CIRCUIT = {
  name: 'settle.circom',
  system: 'groth16',
  curve: 'bn128',
  constraints: 3312,
  // public outputs first, then the public inputs declared in the circuit
  publicSignals: ['payoutsHash', 'balancesHash', 'pot', 'cap', 'nonce', 'winnerIdx'],
};

let loaded;
async function artifacts() {
  if (!loaded) {
    const [wasm, zkey, vk] = await Promise.all([
      readFile(join(ZK_DIR, 'settle.wasm')),
      readFile(join(ZK_DIR, 'settle.zkey')),
      readFile(join(ZK_DIR, 'verification_key.json'), 'utf8'),
    ]);
    loaded = { wasm, zkey, vk: JSON.parse(vk) };
  }
  return loaded;
}

const fieldElement = () => BigInt(`0x${randomBytes(30).toString('hex')}`).toString();

/**
 * The private witness for one settlement. Fresh salts and a fresh nonce per settlement
 * make the commitment single-use: the same vector cannot be proved twice.
 */
export function settlementWitness({ payouts, balances, pot, winnerIdx }) {
  const pad = (list) => Array.from({ length: SEATS }, (_, i) => String(list[i] ?? 0));
  return {
    payouts: pad(payouts),
    balances: pad(balances),
    salts: Array.from({ length: SEATS }, fieldElement),
    pot: String(pot),
    cap: String(pot),
    nonce: fieldElement(),
    winnerIdx: String(winnerIdx),
  };
}

/** Name the public signals so the client never has to guess their order. */
export function readSignals(publicSignals) {
  return Object.fromEntries(CIRCUIT.publicSignals.map((name, i) => [name, publicSignals[i] ?? null]));
}

/** Prove, then verify locally against the verification key before anything is returned. */
export async function proveSettlement(settlement) {
  const { wasm, zkey, vk } = await artifacts();
  const started = Date.now();
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    settlementWitness(settlement),
    wasm,
    zkey,
  );
  const proveMs = Date.now() - started;
  const verified = await snarkjs.groth16.verify(vk, publicSignals, proof);
  return { proof, publicSignals, signals: readSignals(publicSignals), proveMs, verified };
}

export async function verificationKey() {
  return (await artifacts()).vk;
}
