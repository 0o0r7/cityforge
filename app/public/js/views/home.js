// Home: the pitch, the loop, and a live board that is not a screenshot.

import { renderBoard } from '../board.js';

// A plausible mid-game table, used only as the hero illustration.
const PREVIEW_ROOM = {
  players: [
    { id: 'p1', balance: 770, pos: 3, out: false },
    { id: 'p2', balance: 420, pos: 9, out: false },
    { id: 'p3', balance: 1010, pos: 13, out: false },
  ],
  owners: { 1: 'p1', 4: 'p3', 11: 'p3', 14: 'p2' },
  pot: 1860,
  turn: 2,
  round: 9,
  status: 'active',
  pendingBuy: null,
};

export function homeView({ tiles }) {
  const node = document.createElement('div');

  node.innerHTML = `
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">16 tiles · 2–4 seats · one honest payout</span>
        <h1>A board game where the <em>payout proves itself</em>.</h1>
        <p class="lead">
          Forge Fair is a compact property game. The dice come from a seed the table commits to
          before the first roll, and every settlement arrives with a proof you can check yourself —
          on this machine, or on zkVerify.
        </p>
        <div class="hero-actions">
          <a class="btn primary" href="#/play">Deal in</a>
          <a class="btn ghost" href="#/watch">Watch a bot match</a>
        </div>
        <div class="hero-facts">
          <span>No accounts</span>
          <span>No wallet</span>
          <span>24 rounds max</span>
          <span>Groth16 · 3,312 constraints</span>
        </div>
      </div>
      <div class="hero-art">
        <div class="board compact" data-preview-board role="grid" aria-label="Example board"></div>
        <div class="hero-art-foot">
          <span>Round 9 · pot 1,860 · P3 leads on deeds</span>
          <span class="badge ember">live table</span>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <span class="eyebrow">The loop</span>
        <h2>Three steps, no trust required</h2>
        <p class="lead">The rules are the engine. The engine is the proof. Nothing in between asks you to believe an operator.</p>
      </div>
      <div class="steps">
        <article class="step">
          <span class="n">1</span>
          <h3>Commit</h3>
          <p>
            When the table opens, the server publishes <span class="mono">sha256(seed)</span>. Every
            die comes from that seed, so a roll cannot be re-rolled once the board is visible.
          </p>
        </article>
        <article class="step">
          <span class="n">2</span>
          <h3>Play</h3>
          <p>
            Two to four seats on one device. Roll, buy deeds, collect rent, survive the tolls. Twenty-four
            rounds, or until one seat is left solvent.
          </p>
        </article>
        <article class="step">
          <span class="n">3</span>
          <h3>Prove</h3>
          <p>
            At settlement the server replays the whole game from the revealed seed, then proves the payout
            vector with Groth16 and anchors it on zkVerify.
          </p>
        </article>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <span class="eyebrow">Why it holds up</span>
        <h2>Fair by construction, not by policy</h2>
      </div>
      <div class="feature-grid">
        <article class="feature">
          <span class="glyph" aria-hidden="true">⌾</span>
          <div>
            <h3>Committed dice</h3>
            <p>Uniform 1–6 with rejection sampling from the seed. The commitment goes out before the first move and the seed after the last.</p>
          </div>
        </article>
        <article class="feature">
          <span class="glyph" aria-hidden="true">↻</span>
          <div>
            <h3>Deterministic replay</h3>
            <p>Anyone holding the seed and the action log can recompute every balance and the final payout, with no access to this server.</p>
          </div>
        </article>
        <article class="feature">
          <span class="glyph" aria-hidden="true">∑</span>
          <div>
            <h3>Circuit-checked payout</h3>
            <p>The proof binds the payout vector to a commitment of the balances: sums to the pot, capped, true leader, fresh nonce.</p>
          </div>
        </article>
        <article class="feature">
          <span class="glyph" aria-hidden="true">◇</span>
          <div>
            <h3>Public anchor</h3>
            <p>Each settlement can be submitted to zkVerify through Kurier. A finalized job is a timestamped record that the proof verified.</p>
          </div>
        </article>
      </div>
    </section>

    <section class="section">
      <div class="cta-band">
        <div>
          <h2 style="font-size:1.5rem">Take a seat.</h2>
          <p class="muted" style="margin-top:6px">Hotseat play, 2–4 players, one device. A match runs 5–10 minutes.</p>
        </div>
        <div class="row">
          <a class="btn primary" href="#/play">Deal in</a>
          <a class="btn ghost" href="#/guide">Read the rules</a>
        </div>
      </div>
    </section>`;

  renderBoard(node.querySelector('[data-preview-board]'), {
    tiles,
    room: PREVIEW_ROOM,
    names: ['Ada', 'Boro', 'Cy'],
    compact: true,
  });

  return node;
}
