// Settlement: the payout card, the proof block, and the zkVerify poll.

import { api } from './api.js';
import { esc, money, seatColor, seatName, short } from './ui.js';

export function attestationLine(attestation) {
  const status = attestation?.status ?? 'not-configured';
  switch (status) {
    case 'finalized':
      return `<span class="badge ok">finalized on zkVerify</span> <span class="mono">tx ${esc(short(attestation.txHash, 18))}</span>`;
    case 'pending':
    case 'submitted':
      return `<span class="badge warn">${esc(attestation.jobStatus ?? 'submitted')}</span> <span class="mono">job ${esc(short(attestation.jobId, 14))}</span>`;
    case 'failed':
    case 'error':
      return `<span class="badge bad">${esc(status)}</span> <span class="mono">${esc(attestation.reason ?? 'no detail')}</span>`;
    default:
      return `<span class="badge">not attested</span> <span class="mono">${esc(
        attestation?.reason ?? 'Kurier key not set — proof verified locally',
      )}</span>`;
  }
}

export function proofBlock(zk) {
  if (!zk || zk.error) {
    return `<div class="proof">
      <div class="proof-head">
        <span class="eyebrow">Settlement proof</span>
        <span class="badge bad">unavailable</span>
      </div>
      <p class="proof-note">${esc(zk?.error ?? 'no proof returned')}</p>
    </div>`;
  }

  const signals = zk.signals ?? {};
  return `<div class="proof">
    <div class="proof-head">
      <span class="eyebrow">Settlement proof</span>
      <span class="badge ${zk.localVerify ? 'ok' : 'bad'}">${zk.localVerify ? 'groth16 verified' : 'invalid'}</span>
    </div>
    <dl class="proof-rows">
      <div class="proof-row"><dt>Circuit</dt><dd>${esc(zk.circuit?.name ?? 'settle.circom')} · ${esc(
        zk.circuit?.constraints ?? '—',
      )} constraints</dd></div>
      <div class="proof-row"><dt>Proved in</dt><dd>${esc(zk.proveMs ?? '—')} ms</dd></div>
      <div class="proof-row"><dt>Payouts hash</dt><dd>${esc(short(signals.payoutsHash, 18))}</dd></div>
      <div class="proof-row"><dt>Balances hash</dt><dd>${esc(short(signals.balancesHash, 18))}</dd></div>
      <div class="proof-row"><dt>Nonce</dt><dd>${esc(short(signals.nonce, 18))}</dd></div>
      <div class="proof-row"><dt>zkVerify</dt><dd data-attest>${attestationLine(zk.attestation)}</dd></div>
    </dl>
    <p class="proof-note">
      The circuit checks that payouts sum to the pot, that no payout exceeds it, that the winner is
      the true leader of the committed balances, and that the settlement nonce is single-use.
    </p>
  </div>`;
}

export function settlementCard({ settlement, room, names = [] }) {
  const winner = settlement.winnerIdx;
  // The payout is not published until the zkVerify attestation is final: a submitted job is
  // not a verified one, and showing the amounts early would contradict the product's claim.
  const gated = ['pending', 'submitted'].includes(settlement.zk?.attestation?.status);
  const payouts = (settlement.payouts ?? []).map((payout, i) => {
    const player = room.players[i];
    const label = seatName(i, names);
    return `<li class="${i === winner ? 'winner' : ''}">
      <span class="seat-dot" style="--seat:${seatColor(i)}"></span>
      <span>${esc(label)} <span class="faint">· ${money(player?.balance ?? settlement.balances[i])} left</span></span>
      <span class="amount">${gated ? 'held' : payout ? `+${money(payout)}` : '—'}</span>
    </li>`;
  });

  return `<section class="settle" data-gate="${gated ? 'pending' : 'open'}" aria-label="Settlement">
    <div class="settle-head">
      <span class="eyebrow">Settled · round ${esc(Math.min(room.round, 24))}</span>
      ${
        gated
          ? `<h2>Payout held until <em>zkVerify</em> finalizes</h2>`
          : `<h2><em>${esc(seatName(winner, names))}</em> takes ${money(settlement.payouts?.[winner] ?? 0)}</h2>`
      }
      <p class="muted">Pot ${money(settlement.pot)} · ${esc(settlement.replay?.actions ?? 0)} actions replayed ${
        settlement.replay?.ok ? 'and matched the final state' : '<strong>— mismatch</strong>'
      }</p>
    </div>
    <ul class="payouts">${payouts.join('')}</ul>
    ${proofBlock(settlement.zk)}
    <div class="seed-reveal">
      <span class="eyebrow">Seed revealed</span>
      <code>${esc(settlement.seed)}</code>
      <span class="proof-note">sha256(seed) = ${esc(settlement.commitment)} — compare it with the commitment published before the first roll.</span>
    </div>
  </section>`;
}

/**
 * Polls the zkVerify job behind a settlement until it reaches a final state.
 * `onFinal` re-renders the settlement so a held payout is published the moment the
 * verification is final.
 */
export function watchAttestation(roomId, root, initial, onFinal) {
  const slot = root?.querySelector('[data-attest]');
  if (!slot || !initial?.jobId) return () => {};
  if (['finalized', 'failed', 'error'].includes(initial.status)) return () => {};

  let tries = 0;
  const timer = setInterval(async () => {
    tries += 1;
    try {
      const next = await api(`/api/rooms/${roomId}/attestation`);
      if (next.status === 'finalized') {
        clearInterval(timer);
        if (onFinal) onFinal(next);
        else slot.innerHTML = attestationLine(next);
        return;
      }
      slot.innerHTML = attestationLine(next);
      // Finalization has taken from ~25 s to >10 min on mainnet, so the poll keeps going
      // for eight minutes; a job that lands later is still picked up on the next page load.
      if (['failed', 'error'].includes(next.status) || tries >= 120) clearInterval(timer);
    } catch {
      if (tries >= 120) clearInterval(timer);
    }
  }, 4000);

  return () => clearInterval(timer);
}
