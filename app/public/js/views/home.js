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
      <div class="section-head">
        <span class="eyebrow">How it works</span>
        <h2>Rules decide the moves. The circuit checks the payout.</h2>
        <p class="lead">
          Three things carry the game: a short rule set, an economy that never leaks a credit, and a
          settlement you can verify without trusting this server.
        </p>
      </div>

      <div class="mechanics">
        <article class="mechanic">
          <span class="mechanic-tag">The game</span>
          <h3>Roll, land, resolve</h3>
          <ul class="mechanic-list">
            <li>Two dice, sixteen tiles, two to four seats on one device.</li>
            <li>Land on a free deed and buy it, or pass.</li>
            <li>Land on someone’s deed and pay them rent.</li>
            <li>Tolls feed the pot; the Hold costs you a turn.</li>
            <li>Twenty-four rounds, or one solvent seat left.</li>
          </ul>
          <a class="mechanic-link" href="#/guide">Read the full rulebook</a>
        </article>

        <article class="mechanic">
          <span class="mechanic-tag">The economy</span>
          <h3>Zero-sum, on purpose</h3>
          <p>
            Credits are a closed score, not a token. No deposit, no withdrawal, no faucet — the only
            credits in play are the buy-ins.
          </p>
          <ul class="economy-flow" aria-label="Where credits move">
            <li><span>Buy-ins</span><b>→ pot</b></li>
            <li><span>Rent</span><b>seat → seat</b></li>
            <li><span>Tolls &amp; deeds</span><b>→ pot</b></li>
            <li><span>Bankrupt seat</span><b>→ pot</b></li>
            <li class="out"><span>Payout</span><b>pot → leader</b></li>
          </ul>
          <p class="mechanic-foot">The pot leaves once, so balances and pot must agree exactly.</p>
        </article>

        <article class="mechanic">
          <span class="mechanic-tag">The settlement</span>
          <h3>Proved, then anchored on zkVerify</h3>
          <ul class="mechanic-list">
            <li>Commitment to the dice seed is published before the first roll.</li>
            <li>The finished game is replayed from the revealed seed.</li>
            <li>A Groth16 proof binds the payout to the pot, cap, leader and a fresh nonce.</li>
            <li>The proof is verified locally before the response leaves the server.</li>
            <li>zkVerify finalizes it with a public transaction hash.</li>
          </ul>
          <a class="mechanic-link" href="#/proof">See what the proof asserts</a>
        </article>
      </div>

      <div class="row" style="margin-top:18px">
        <button class="btn ghost" type="button" data-open-help>Open the field guide</button>
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
