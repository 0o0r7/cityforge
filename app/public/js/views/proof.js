// The proof page: what the settlement actually asserts, and what it does not.

import { circuit } from '../api.js';
import { esc } from '../ui.js';

const SIGNALS = {
  payoutsHash: 'Poseidon commitment of the payout vector — binds each seat’s share.',
  balancesHash: 'Poseidon commitment of the balances the payouts were derived from.',
  pot: 'The pot, recomputed from the action log.',
  cap: 'The most any single seat may receive — equals the pot.',
  nonce: 'Single-use settlement nonce, so one proof cannot be replayed twice.',
  winnerIdx: 'Index of the seat that receives the pot.',
};

const FALLBACK = {
  name: 'settle.circom',
  system: 'groth16',
  curve: 'bn128',
  constraints: 3312,
  publicSignals: ['payoutsHash', 'balancesHash', 'pot', 'cap', 'nonce', 'winnerIdx'],
};

export async function proofView() {
  const meta = await circuit()
    .then((data) => data.circuit)
    .catch(() => FALLBACK);

  const signals = (meta.publicSignals ?? FALLBACK.publicSignals)
    .map(
      (name) =>
        `<div class="signal"><span>${esc(name)}</span><b>${esc(SIGNALS[name] ?? 'Public output of the settlement circuit.')}</b></div>`,
    )
    .join('');

  const node = document.createElement('div');
  node.innerHTML = `
    <div class="page-head">
      <span class="eyebrow">Verifiable settlement</span>
      <h1>Four layers between a roll and a payout.</h1>
      <p class="lead">
        A finished match produces a payout vector. Instead of asking you to trust it, Forge Fair replays
        the game, proves the payout, verifies that proof locally, and can publish it to zkVerify.
      </p>
    </div>

    <div class="split">
      <div class="layers">
        <article class="layer">
          <span class="badge-n">1</span>
          <div>
            <h3>Replay from the revealed seed</h3>
            <p>
              The server keeps the seed secret while the table is live, then publishes it at settlement.
              The full action log is replayed through the same engine, and the resulting balances, pot and
              dice index must equal the state the table ended on. Anyone can run this check offline.
            </p>
          </div>
        </article>
        <article class="layer">
          <span class="badge-n">2</span>
          <div>
            <h3>Prove the payout vector</h3>
            <p>
              A Groth16 circuit takes the payout vector, the balances and a fresh nonce. It asserts that the
              payouts sum to the pot, that no payout exceeds the cap, that the paid seat is the true maximum
              of the committed balances, and that the nonce is unused.
            </p>
          </div>
        </article>
        <article class="layer">
          <span class="badge-n">3</span>
          <div>
            <h3>Verify before responding</h3>
            <p>
              The server verifies the proof against its own verification key before the settlement response
              leaves the process. A proof that does not verify is reported as invalid, never as settled.
            </p>
          </div>
        </article>
        <article class="layer">
          <span class="badge-n">4</span>
          <div>
            <h3>Anchor on zkVerify</h3>
            <p>
              With a Kurier key configured, the proof is submitted to zkVerify. The job moves from submitted
              to finalized with a transaction hash — a public, timestamped record that this payout verified.
              Without a key the settlement still carries a locally verified proof and says it is unattested.
            </p>
          </div>
        </article>
      </div>

      <aside class="stack">
        <div class="panel stack">
          <div class="row" style="justify-content:space-between">
            <span class="eyebrow">Circuit</span>
            <span class="badge ember">${esc(meta.system ?? 'groth16')}</span>
          </div>
          <dl class="proof-rows">
            <div class="proof-row"><dt>File</dt><dd>${esc(meta.name ?? 'settle.circom')}</dd></div>
            <div class="proof-row"><dt>Curve</dt><dd>${esc(meta.curve ?? 'bn128')}</dd></div>
            <div class="proof-row"><dt>Constraints</dt><dd>${esc(meta.constraints ?? '—')}</dd></div>
            <div class="proof-row"><dt>Public signals</dt><dd>${esc((meta.publicSignals ?? []).length)}</dd></div>
          </dl>
        </div>

        <div class="panel stack">
          <span class="eyebrow">Public signals</span>
          <div class="signal-list">${signals}</div>
        </div>

        <div class="note">
          <strong>What this does not cover.</strong>
          The proof says the payout is consistent with the committed balances. It does not prove that every
          move was legal — the replay does that — and it does not make the operator honest about publishing
          the commitment before the first roll. Both assumptions are visible at settlement: you get the seed,
          the action count and the commitment in the same response.
        </div>

        <a class="btn ghost block" href="#/watch">Watch a match settle</a>
      </aside>
    </div>`;

  return node;
}
