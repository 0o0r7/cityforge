// Help: one field guide that explains the loop, the closed economy and the proof.

let scrim = null;
let lastFocus = null;

function build() {
  scrim = document.createElement('div');
  scrim.className = 'help-scrim';
  scrim.hidden = true;
  scrim.innerHTML = `
    <div class="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" tabindex="-1">
      <header class="help-head">
        <div>
          <span class="eyebrow">Field guide</span>
          <h2 id="help-title">How Forge Fair works</h2>
          <p class="muted">A 16-tile property game where the payout proves itself.</p>
        </div>
        <button class="icon-btn" type="button" data-help-close aria-label="Close help">✕</button>
      </header>

      <div class="help-body">
        <section class="help-block">
          <h3>The match</h3>
          <p>
            Two to four seats share one device. Each seat buys in for 200 credits and that buy-in goes
            straight into the pot. On your turn you roll two dice, move clockwise from Start, and resolve
            the tile you land on: buy an unowned deed, pay rent to its owner, or pay a toll into the pot.
          </p>
          <p>
            A match ends when one solvent seat remains, or after round 24. Either way the highest balance
            takes the pot; seats that tie with the leader share the win.
          </p>
        </section>

        <section class="help-block">
          <h3>A closed, zero-sum economy</h3>
          <p>
            Credits are a score, not a token. There is no deposit, no withdrawal and no faucet: the only
            credits that ever exist are the buy-ins the seats put in. Rent moves credits between seats, and
            tolls, deeds and bankrupt seats all feed the pot. Nothing is created or destroyed.
          </p>
          <ul class="help-list">
            <li><b>Buy-in</b> — 200 credits per seat, straight into the pot.</li>
            <li><b>Rent</b> — paid seat to seat, so it stays inside the table.</li>
            <li><b>Tolls and deeds</b> — paid into the pot, never out of the game.</li>
            <li><b>Bankruptcy</b> — remaining credits join the pot and your deeds return to the market.</li>
            <li><b>Payout</b> — the pot leaves once, to the leader, at settlement.</li>
          </ul>
          <p class="muted">
            Because the loop is closed, the final balances and the pot must agree exactly. That equality is
            what the settlement circuit checks.
          </p>
        </section>

        <section class="help-block">
          <h3>Dice you can audit</h3>
          <p>
            When the table opens, the server publishes <span class="mono">sha256(seed)</span>. Every die is
            drawn from that seed, so no roll can be re-chosen once the board is visible. The seed itself is
            revealed only after the last move, and it must hash to the published commitment.
          </p>
        </section>

        <section class="help-block">
          <h3>Settlement on zkVerify</h3>
          <p>
            At settlement the server replays the whole game from the revealed seed, then proves the payout
            vector with a Groth16 circuit (3,312 constraints on bn128). The proof asserts that the payouts
            sum to the pot, that no payout exceeds the cap, that the paid seat is the true leader, and that
            the settlement nonce is unused.
          </p>
          <p>
            The proof is verified locally before the response leaves the server, and then submitted to
            zkVerify through Kurier. A finalized job is a public, timestamped record — a transaction hash
            you can look up — that this exact payout verified. Without a Kurier key the settlement still
            carries a locally verified proof and reports its anchor as unattested, never as proven on-chain.
          </p>
        </section>
      </div>

      <footer class="help-foot">
        <a class="btn primary" href="#/play" data-help-close>Deal in</a>
        <a class="btn ghost" href="#/guide" data-help-close>Full rulebook</a>
        <a class="btn quiet" href="#/proof" data-help-close>The proof</a>
      </footer>
    </div>`;

  document.body.append(scrim);

  scrim.addEventListener('click', (event) => {
    if (event.target === scrim || event.target.closest('[data-help-close]')) close();
  });
}

export function openHelp() {
  if (!scrim) build();
  lastFocus = document.activeElement;
  scrim.hidden = false;
  document.body.classList.add('help-open');
  requestAnimationFrame(() => scrim.querySelector('.help-modal')?.focus());
}

export function closeHelp() {
  if (!scrim || scrim.hidden) return;
  scrim.hidden = true;
  document.body.classList.remove('help-open');
  if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  lastFocus = null;
}

function close() {
  closeHelp();
}

export function wireHelp() {
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-open-help]')) {
      event.preventDefault();
      openHelp();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeHelp();
  });
}
