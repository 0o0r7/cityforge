// Rules: short enough to read before a match, exact enough to settle an argument.

import { esc, money } from '../ui.js';

export function guideView({ tiles }) {
  const node = document.createElement('div');

  const rows = tiles
    .map((tile) => {
      const kind =
        tile.kind === 'property' ? `Deed · tier ${tile.tier}` : tile.kind === 'tax' ? 'Toll' : tile.kind === 'jail' ? 'Hold' : tile.kind === 'start' ? 'Start' : 'Rest';
      const price = tile.kind === 'property' ? money(tile.price) : '—';
      const effect =
        tile.kind === 'property'
          ? `Rent ${money(tile.rent)} to the owner`
          : tile.kind === 'tax'
            ? `${money(tile.amount)} into the pot`
            : tile.kind === 'jail'
              ? 'Lose the next turn'
              : 'Nothing happens';
      return `<tr><td>${esc(tile.name)}</td><td>${esc(kind)}</td><td>${price}</td><td>${esc(effect)}</td></tr>`;
    })
    .join('');

  node.innerHTML = `
    <div class="page-head">
      <span class="eyebrow">Rulebook</span>
      <h1>Sixteen tiles, one pot.</h1>
      <p class="lead">
        Forge Fair is a property game for two to four seats on a single device. Buy deeds, charge rent,
        keep enough credits to survive the tolls — and when the last round ends, the highest balance
        takes the pot.
      </p>
    </div>

    <div class="guide">
      <nav class="guide-nav" aria-label="Rulebook sections">
        <a href="#/guide#objective">Objective</a>
        <a href="#/guide#turn">A turn</a>
        <a href="#/guide#board">The board</a>
        <a href="#/guide#money">Money and the pot</a>
        <a href="#/guide#end">How a match ends</a>
        <a href="#/guide#fair">Why it is fair</a>
        <a href="#/guide#controls">Controls</a>
        <a href="#/guide#faq">FAQ</a>
      </nav>

      <div class="guide-body">
        <section class="guide-block" id="objective">
          <span class="eyebrow">Objective</span>
          <h2>Finish with the largest balance</h2>
          <p>
            Every seat buys in for 200 credits and that money goes straight into the pot. At settlement the
            seat with the highest balance takes the whole pot. Ties are allowed: the proof accepts any seat
            that is level with the leader.
          </p>
        </section>

        <section class="guide-block" id="turn">
          <span class="eyebrow">A turn</span>
          <h2>Roll, land, resolve</h2>
          <ul>
            <li>Roll two dice. The sum moves you clockwise from Start.</li>
            <li>An unowned deed can be bought at its printed price, or passed on.</li>
            <li>A deed owned by someone else charges you rent, paid straight to that seat.</li>
            <li>A toll goes into the pot. The Hold costs you one turn.</li>
            <li>If you cannot cover a toll or a rent, you are out: your remaining credits join the pot and your deeds return to the market.</li>
          </ul>
        </section>

        <section class="guide-block" id="board">
          <span class="eyebrow">The board</span>
          <h2>What each tile does</h2>
          <table class="tile-table">
            <thead>
              <tr><th>Tile</th><th>Type</th><th>Price</th><th>Effect</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </section>

        <section class="guide-block" id="money">
          <span class="eyebrow">Money</span>
          <h2>The pot only grows</h2>
          <p>
            Credits never leave the table. Buys, tolls and bankrupt seats all feed the pot, rent moves between
            seats, and the pot is paid out once at the end. That closed loop is what the settlement circuit
            checks: the payouts must add up to exactly the pot.
          </p>
        </section>

        <section class="guide-block" id="end">
          <span class="eyebrow">Endgame</span>
          <h2>One seat left, or twenty-four rounds</h2>
          <p>
            A match ends when a single solvent seat remains, or after round 24. Either way the settlement is the
            same: replay the game from the seed, take the highest balance, pay it the pot.
          </p>
        </section>

        <section class="guide-block" id="fair">
          <span class="eyebrow">Fairness</span>
          <h2>Commit, reveal, replay</h2>
          <p>
            Before the first roll the table publishes a commitment to the dice seed. The seed itself is only
            revealed after the game is over, so nobody — including the server — can pick rolls with the board
            in view. The revealed seed must hash to the published commitment, and the action log must replay
            to the exact final state.
          </p>
          <p>
            The payout then goes through a Groth16 circuit and, when a Kurier key is configured, is anchored on
            zkVerify. See <a href="#/proof">the proof</a> for the details.
          </p>
        </section>

        <section class="guide-block" id="controls">
          <span class="eyebrow">Controls</span>
          <h2>Keyboard and sound</h2>
          <ul>
            <li><span class="mono">R</span> — roll the dice on your turn.</li>
            <li><span class="mono">B</span> — buy the deed you just landed on.</li>
            <li><span class="mono">S</span> — pass on it.</li>
            <li>The ♪ button in the header turns sound effects on and off.</li>
            <li>Your table is saved in this browser: closing the tab does not forfeit the match.</li>
          </ul>
        </section>

        <section class="guide-block" id="faq">
          <span class="eyebrow">FAQ</span>
          <h2>Reasonable questions</h2>
          <details class="faq">
            <summary>Can I play with strangers online?</summary>
            <p>Not yet. This build is hotseat: two to four seats sharing one screen. The engine, the API and the settlement are already room-based, so networked play is a transport problem rather than a rules problem.</p>
          </details>
          <details class="faq">
            <summary>What happens if I refresh in the middle of a match?</summary>
            <p>The table reopens where you left it. Rooms live in server memory for two hours, so a long break or a redeploy will end the match.</p>
          </details>
          <details class="faq">
            <summary>Is there real money involved?</summary>
            <p>No. Credits are a closed score, not a token: there is no deposit, no withdrawal and no faucet. The only on-chain step is the optional verification of the settlement proof.</p>
          </details>
          <details class="faq">
            <summary>What does the proof actually prove?</summary>
            <p>That the payout vector is consistent with a commitment of the final balances: it sums to the pot, no payout exceeds it, the winner is the true leader, and the nonce has not been used before. It does not prove that the actions were legal — the replay does that, and both are shown at settlement.</p>
          </details>
        </section>
      </div>
    </div>`;

  return node;
}
