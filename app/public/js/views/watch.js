// Spectate: a real bot match, replayed frame by frame with commentary.

import { post } from '../api.js';
import { renderBoard } from '../board.js';
import { settlementCard, watchAttestation } from '../settlement.js';
import { sfx } from '../sound.js';
import { esc, money, seatColor, seatName, toast } from '../ui.js';

const BOT_NAMES = ['Ada', 'Boro', 'Cy', 'Dee'];
const ACTION_LABEL = { roll: 'rolls', buy: 'buys', skip: 'passes', join: 'buys in' };

let demo = null;
let timer = null;

export function watchView(ctx) {
  return demo ? player(ctx) : intro(ctx);
}

/* ------------------------------------------------------------------ intro */

function intro(ctx) {
  const node = document.createElement('div');
  node.innerHTML = `
    <div class="page-head">
      <span class="eyebrow">Spectate</span>
      <h1>Watch the machine play.</h1>
      <p class="lead">
        Three seats, one deterministic bot, one real room. Every move is narrated as it happens, and the
        finished match settles through the same replay and the same Groth16 proof as a human table.
      </p>
    </div>
    <div class="lobby">
      <div class="lobby-card">
        <span class="eyebrow">Ready when you are</span>
        <p class="lead" style="font-size:14px">
          The bot keeps 200 in reserve after a purchase, so it plays a real game rather than buying itself
          broke. A match runs about 40–90 moves.
        </p>
        <button class="btn primary block" type="button" data-run>Run a bot match</button>
        <div class="lobby-note">
          <span>The seed stays on the server until you verify the match.</span>
          <span>Nothing is pre-recorded: this creates a new room every time.</span>
        </div>
      </div>
      <aside class="lobby-side">
        <div class="panel stack">
          <span class="eyebrow">How to read it</span>
          <ul class="guide-block" style="gap:6px;padding-left:18px;list-style:disc;color:var(--muted);font-size:13px">
            <li>Play, pause or step the commentary.</li>
            <li>Balances, deeds and the pot update on the board.</li>
            <li>At the end, verify the match to see the proof and the zkVerify anchor.</li>
          </ul>
        </div>
        <a class="panel stack" href="#/play" style="text-decoration:none">
          <span class="eyebrow">Your turn</span>
          <strong>Play a table yourself</strong>
          <span class="muted" style="font-size:13px">Two to four seats on one device, same rules, same settlement.</span>
        </a>
      </aside>
    </div>`;

  node.querySelector('[data-run]').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = 'Setting the table…';
    try {
      sfx.click();
      const created = await post('/api/demo', { players: 3, names: BOT_NAMES.slice(0, 3) });
      demo = { ...created, index: 0, playing: true, speed: 2, settlement: null, stopPoll: null };
      ctx.rerender();
    } catch (error) {
      button.disabled = false;
      button.textContent = 'Run a bot match';
      toast(error.message, 'bad');
    }
  });

  return node;
}

/* ----------------------------------------------------------------- player */

function player(ctx) {
  const { tiles } = ctx;
  const node = document.createElement('div');

  node.innerHTML = `
    <div class="watch">
      <div class="table-main">
        <div class="table-bar">
          <div class="meta">
            <div class="stat"><span>Round</span><b data-round>—</b></div>
            <div class="stat"><span>Pot</span><b data-pot>—</b></div>
            <div class="stat"><span>To move</span><b data-turn>—</b></div>
          </div>
          <span class="badge ember">bot match</span>
        </div>

        <div class="board-wrap">
          <div class="board compact" data-board role="grid" aria-label="Bot match board"></div>
        </div>

        <div class="watch-controls">
          <button class="btn primary sm" type="button" data-toggle>Pause</button>
          <button class="btn ghost sm" type="button" data-step>Step</button>
          <button class="btn quiet sm" type="button" data-restart>Restart</button>
          <div class="segmented" role="group" aria-label="Playback speed">
            ${[1, 2, 4].map((s) => `<button type="button" data-speed="${s}" aria-pressed="${s === demo.speed}">${s}×</button>`).join('')}
          </div>
          <span class="spacer"></span>
          <span class="mono" data-count>0 / 0</span>
          <div class="progress"><i data-progress style="width:0%"></i></div>
        </div>

        <div data-settle></div>
      </div>

      <aside class="rail">
        <div class="narration">
          <div class="row" style="justify-content:space-between">
            <span class="eyebrow">Commentary</span>
            <span class="mono">${esc(demo.id.slice(0, 8))}</span>
          </div>
          <div class="now">
            <span class="who" data-who>—</span>
            <span class="line" data-line>—</span>
          </div>
          <ol class="narration-list" data-list></ol>
        </div>

        <div class="panel stack">
          <span class="eyebrow">Seats</span>
          <ul class="seats" data-seats></ul>
        </div>
      </aside>
    </div>`;

  const boardEl = node.querySelector('[data-board]');
  const seatsEl = node.querySelector('[data-seats]');
  const settleEl = node.querySelector('[data-settle]');

  function paint() {
    const frame = demo.frames[demo.index];
    if (!frame) return;
    const state = frame.state;

    node.querySelector('[data-round]').textContent = `${Math.min(state.round, 24)}/24`;
    node.querySelector('[data-pot]').textContent = money(state.pot);
    node.querySelector('[data-turn]').textContent =
      state.status === 'settled' ? 'match over' : seatName(state.turn, BOT_NAMES);
    node.querySelector('[data-count]').textContent = `${demo.index + 1} / ${demo.frames.length}`;
    node.querySelector('[data-progress]').style.width = `${Math.round(((demo.index + 1) / demo.frames.length) * 100)}%`;
    node.querySelector('[data-toggle]').textContent = demo.playing ? 'Pause' : 'Play';

    renderBoard(boardEl, {
      tiles,
      room: state,
      names: BOT_NAMES,
      dice: frame.dice,
      compact: true,
      rolling: frame.action === 'roll',
    });

    const playerIndex = demo.players.indexOf(frame.playerId);
    node.querySelector('[data-who]').textContent =
      playerIndex >= 0 ? `${seatName(playerIndex, BOT_NAMES)} ${ACTION_LABEL[frame.action] ?? 'moves'}` : 'table';
    node.querySelector('[data-line]').textContent = frame.narration;

    const from = Math.max(0, demo.index - 24);
    node.querySelector('[data-list]').innerHTML = demo.frames
      .slice(from, demo.index + 1)
      .map(
        (item, i) =>
          `<li class="${from + i === demo.index ? 'current' : 'seen'}">
            <span class="n">${String(item.n).padStart(2, '0')}</span>
            <span>${esc(item.narration)}</span>
          </li>`,
      )
      .join('');

    seatsEl.innerHTML = state.players
      .map((seat, i) => {
        const active = i === state.turn && state.status === 'active';
        return `<li class="seat ${active ? 'active' : ''} ${seat.out ? 'out' : ''}" style="--seat:${seatColor(i)}">
          <span class="seat-dot" aria-hidden="true"></span>
          <span class="seat-name">
            <strong>${esc(seatName(i, BOT_NAMES))}</strong>
            <span class="bar"><i style="width:${Math.min(100, Math.round(seat.balance / 20))}%"></i></span>
          </span>
          <span class="seat-balance">${money(seat.balance)}<small>${seat.out ? 'out' : 'credits'}</small></span>
        </li>`;
      })
      .join('');

    const finished = demo.index === demo.frames.length - 1 && state.status === 'settled';
    if (finished && !demo.settlement) {
      settleEl.innerHTML = `
        <div class="panel stack">
          <span class="eyebrow">End of match</span>
          <p class="muted">The table is settled on the server. Verify it to reveal the seed and the payout proof.</p>
          <button class="btn primary" type="button" data-verify>Verify this match</button>
        </div>`;
    }
  }

  function schedule() {
    clearTimeout(timer);
    if (!demo?.playing) return;
    timer = setTimeout(() => {
      if (demo.index < demo.frames.length - 1) {
        demo.index += 1;
        paint();
        schedule();
      } else {
        demo.playing = false;
        paint();
      }
    }, Math.round(1000 / demo.speed));
  }

  async function verify() {
    const button = node.querySelector('[data-verify]');
    if (button) {
      button.disabled = true;
      button.textContent = 'Replaying and proving…';
    }
    try {
      const settlement = await post(`/api/rooms/${demo.id}/settle`);
      demo.settlement = settlement;
      const last = demo.frames.at(-1).state;
      const roomView = {
        round: last.round,
        players: settlement.balances.map((balance) => ({ balance })),
      };
      const render = () =>
        settlementCard({ settlement, room: roomView, names: BOT_NAMES });
      settleEl.innerHTML = render();
      sfx.win();
      demo.stopPoll?.();
      demo.stopPoll = watchAttestation(demo.id, settleEl, settlement.zk?.attestation, (attestation) => {
        settlement.zk = { ...settlement.zk, attestation };
        settleEl.innerHTML = render();
      });
    } catch (error) {
      if (button) {
        button.disabled = false;
        button.textContent = 'Verify this match';
      }
      toast(error.message, 'bad');
    }
  }

  node.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    if (button.dataset.toggle !== undefined) {
      demo.playing = !demo.playing;
      if (demo.playing && demo.index === demo.frames.length - 1) demo.index = 0;
      paint();
      schedule();
    } else if (button.dataset.step !== undefined) {
      demo.playing = false;
      demo.index = Math.min(demo.frames.length - 1, demo.index + 1);
      paint();
      schedule();
    } else if (button.dataset.restart !== undefined) {
      demo.index = 0;
      demo.playing = true;
      demo.settlement = null;
      demo.stopPoll?.();
      demo.stopPoll = null;
      settleEl.innerHTML = '';
      paint();
      schedule();
    } else if (button.dataset.speed !== undefined) {
      demo.speed = Number(button.dataset.speed);
      node.querySelectorAll('[data-speed]').forEach((b) => {
        b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === demo.speed));
      });
      schedule();
    } else if (button.dataset.verify !== undefined) {
      verify();
    }
  });

  ctx.onCleanup(() => {
    clearTimeout(timer);
    demo.stopPoll?.();
  });

  paint();
  schedule();

  return node;
}
