// Play: lobby, then the hotseat table.

import { api, post } from '../api.js';
import { renderBoard } from '../board.js';
import { settlementCard, watchAttestation } from '../settlement.js';
import { sfx } from '../sound.js';
import { esc, money, seatColor, seatName, toast } from '../ui.js';

const ROOM_KEY = 'ff.room';
const NAMES_KEY = 'ff.names';
const COUNT_KEY = 'ff.count';

let room = null;
let names = [];
let settlement = null;
let stopPoll = null;
let lastDice = null;
let rollingUntil = 0;

function readNames() {
  try {
    const saved = JSON.parse(localStorage.getItem(NAMES_KEY) || '[]');
    return Array.isArray(saved) ? saved.map(String) : [];
  } catch {
    return [];
  }
}

export async function playView(ctx) {
  if (!names.length) names = readNames();

  if (!room) {
    const saved = localStorage.getItem(ROOM_KEY);
    if (saved) {
      try {
        room = await api(`/api/rooms/${saved}`);
      } catch {
        localStorage.removeItem(ROOM_KEY);
      }
    }
  }

  return room ? table(ctx) : lobby(ctx);
}

/* ------------------------------------------------------------------ lobby */

function lobby(ctx) {
  const node = document.createElement('div');
  let count = Math.min(4, Math.max(2, Number(localStorage.getItem(COUNT_KEY)) || 2));

  node.innerHTML = `
    <div class="page-head">
      <span class="eyebrow">New table</span>
      <h1>Take a seat.</h1>
      <p class="lead">
        Two to four seats on one device. Stake 200 credits each, buy what you land on, and keep enough
        in reserve to survive the tolls.
      </p>
    </div>
    <div class="lobby">
      <form class="lobby-card" id="lobby-form" novalidate>
        <div class="row" style="justify-content:space-between">
          <span class="eyebrow">Seats</span>
          <div class="segmented" role="group" aria-label="Number of seats" id="count-picker">
            ${[2, 3, 4]
              .map((n) => `<button type="button" data-count="${n}" aria-pressed="${n === count}">${n}</button>`)
              .join('')}
          </div>
        </div>
        <div class="seat-inputs" id="seat-inputs"></div>
        <div class="lobby-note" id="lobby-note"></div>
        <button class="btn primary block" type="submit">Deal in</button>
      </form>
      <aside class="lobby-side">
        <div class="panel stack">
          <span class="eyebrow">The board</span>
          <div class="board compact" data-board role="grid" aria-label="Board layout"></div>
          <p class="faint" style="font-size:12px">Sixteen tiles in a ring. Tolls and deeds feed one pot; rent moves between seats.</p>
        </div>
        <a class="panel stack" href="#/watch" style="text-decoration:none">
          <span class="eyebrow">Spectate</span>
          <strong>Watch a bot match</strong>
          <span class="muted" style="font-size:13px">
            Three seats played by a deterministic bot, narrated move by move, settled with the same proof.
          </span>
        </a>
      </aside>
    </div>`;

  renderBoard(node.querySelector('[data-board]'), { tiles: ctx.tiles, compact: true });

  const seatsHost = node.querySelector('#seat-inputs');
  const note = node.querySelector('#lobby-note');

  const paintSeats = () => {
    seatsHost.innerHTML = Array.from({ length: count }, (_, i) => `
      <div class="seat-input" style="--seat:${seatColor(i)}">
        <span class="seat-dot" aria-hidden="true"></span>
        <div class="field">
          <input type="text" maxlength="12" data-seat="${i}" value="${esc(names[i] ?? `P${i + 1}`)}"
            aria-label="Seat ${i + 1} name" autocomplete="off" spellcheck="false" />
        </div>
      </div>`).join('');
    note.innerHTML = `
      <span>Stake 200 per seat — the pot opens at ${money(count * 200)}.</span>
      <span>24 rounds max. Highest balance takes the pot.</span>`;
  };

  paintSeats();

  node.querySelector('#count-picker').addEventListener('click', (event) => {
    const button = event.target.closest('[data-count]');
    if (!button) return;
    count = Number(button.dataset.count);
    node.querySelectorAll('#count-picker button').forEach((b) => {
      b.setAttribute('aria-pressed', String(Number(b.dataset.count) === count));
    });
    paintSeats();
    sfx.click();
  });

  node.querySelector('#lobby-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const inputs = [...node.querySelectorAll('input[data-seat]')];
    names = inputs.map((input, i) => input.value.trim().slice(0, 12) || `P${i + 1}`);

    try {
      sfx.click();
      const created = await post('/api/rooms', { players: count });
      localStorage.setItem(NAMES_KEY, JSON.stringify(names));
      localStorage.setItem(COUNT_KEY, String(count));
      localStorage.setItem(ROOM_KEY, created.id);
      room = created;
      settlement = null;
      lastDice = null;
      ctx.rerender();
    } catch (error) {
      sfx.error();
      toast(error.message, 'bad');
    }
  });

  return node;
}

/* ------------------------------------------------------------------ table */

function describe(entry, tiles) {
  const who = (id) => {
    const index = room?.players?.findIndex((player) => player.id === id) ?? -1;
    return index >= 0 ? seatName(index, names) : String(id ?? '—').toUpperCase();
  };

  switch (entry.type) {
    case 'join':
      return `${who(entry.playerId)} buys in for 200.`;
    case 'roll':
      return `${who(entry.playerId)} rolls ${entry.dice.join(' + ')} → ${tiles[entry.pos]?.name ?? entry.pos}.`;
    case 'buy':
      return `${who(entry.playerId)} buys ${tiles[entry.tileId]?.name} for ${money(entry.price)}.`;
    case 'skip':
      return `${who(entry.playerId)} passes on the deed.`;
    case 'held':
      return `${who(entry.playerId)} sits the turn out in the Hold.`;
    case 'eliminate':
      return `${who(entry.playerId)} cannot cover it — out of the game.`;
    default:
      return entry.type;
  }
}

function table(ctx) {
  const { tiles } = ctx;
  const node = document.createElement('div');
  let busy = false;

  node.innerHTML = `
    <div class="table">
      <div class="table-main">
        <div class="table-bar">
          <div class="meta">
            <div class="stat"><span>Round</span><b data-round>—</b></div>
            <div class="stat"><span>Pot</span><b data-pot>—</b></div>
            <div class="stat"><span>To move</span><b data-turn>—</b></div>
          </div>
          <div class="row">
            <span class="room-code">table <span data-room>—</span>
              <button type="button" data-copy aria-label="Copy table id">copy</button>
            </span>
            <button class="btn quiet sm" type="button" data-new>New table</button>
          </div>
        </div>
        <div class="board-wrap">
          <div class="board" data-board role="grid" aria-label="Game board"></div>
        </div>
        <div class="action-panel" data-actions></div>
        <div data-settle></div>
      </div>

      <aside class="rail">
        <div class="panel stack">
          <div class="row" style="justify-content:space-between">
            <span class="eyebrow">Seats</span>
            <span class="mono" data-status></span>
          </div>
          <ul class="seats" data-seats></ul>
        </div>
        <div class="feed">
          <div class="feed-head"><span>Table feed</span><span data-feed-count></span></div>
          <ol class="feed-list" data-feed></ol>
        </div>
      </aside>
    </div>`;

  const boardEl = node.querySelector('[data-board]');
  const seatsEl = node.querySelector('[data-seats]');
  const actionsEl = node.querySelector('[data-actions]');
  const feedEl = node.querySelector('[data-feed]');
  const settleEl = node.querySelector('[data-settle]');

  function paint() {
    node.querySelector('[data-round]').textContent = `${Math.min(room.round, 24)}/24`;
    node.querySelector('[data-pot]').textContent = money(room.pot);
    node.querySelector('[data-turn]').textContent =
      room.status === 'settled' ? 'match over' : seatName(room.turn, names);
    node.querySelector('[data-room]').textContent = room.id.slice(0, 8);
    node.querySelector('[data-status]').textContent =
      room.status === 'settled' ? 'match over' : `round ${Math.min(room.round, 24)}`;

    renderBoard(boardEl, {
      tiles,
      room,
      names,
      dice: lastDice,
      rolling: Date.now() < rollingUntil,
    });

    seatsEl.innerHTML = room.players
      .map((player, i) => {
        const active = i === room.turn && room.status === 'active';
        return `<li class="seat ${active ? 'active' : ''} ${player.out ? 'out' : ''}" style="--seat:${seatColor(i)}">
          <span class="seat-dot" aria-hidden="true"></span>
          <span class="seat-name">
            <strong>${esc(seatName(i, names))}</strong>
            <span class="bar"><i style="width:${Math.min(100, Math.round(player.balance / 20))}%"></i></span>
          </span>
          <span class="seat-balance">${money(player.balance)}<small>${player.out ? 'out' : 'credits'}</small></span>
        </li>`;
      })
      .join('');

    if (room.status === 'settled') {
      actionsEl.innerHTML = `
        <p class="hint">Match over — the settlement is below the board.</p>
        <button class="btn ghost block" type="button" data-new>Start a new table</button>`;
    } else if (room.pendingBuy) {
      const tile = tiles[room.pendingBuy.tileId];
      actionsEl.innerHTML = `
        <div class="buy-card">
          <span class="eyebrow">Deed open</span>
          <span class="tile-name">${esc(tile.name)}</span>
          <span class="buy-meta"><span>Price ${money(tile.price)}</span><span>Rent ${money(tile.rent)}</span></span>
        </div>
        <div class="action-main">
          <button class="btn primary" type="button" data-buy>Buy for ${money(tile.price)}</button>
          <button class="btn ghost" type="button" data-skip>Pass</button>
        </div>
        <p class="hint"><strong>${esc(seatName(room.turn, names))}</strong> landed on an unclaimed deed.</p>`;
    } else {
      actionsEl.innerHTML = `
        <button class="btn primary btn-roll" type="button" data-roll>Roll dice</button>
        <p class="hint"><strong>${esc(seatName(room.turn, names))}</strong> to move · <span class="mono">R</span> to roll</p>`;
    }

    const entries = room.log.slice(-40).reverse();
    feedEl.innerHTML = entries
      .map(
        (entry, i) =>
          `<li><span class="n">${String(room.log.length - i).padStart(2, '0')}</span><span>${esc(
            describe(entry, tiles),
          )}</span></li>`,
      )
      .join('');
    node.querySelector('[data-feed-count]').textContent = `${room.log.length} moves`;
  }

  async function act(type) {
    if (busy || !room || room.status === 'settled') return;
    busy = true;
    try {
      if (type === 'roll') sfx.roll();
      else if (type === 'buy') sfx.coin();
      else sfx.click();

      const next = await post(`/api/rooms/${room.id}/action`, { type });
      const roll = [...next.log].reverse().find((entry) => entry.type === 'roll');
      if (type === 'roll' && roll) {
        lastDice = roll.dice;
        rollingUntil = Date.now() + 500;
      }
      room = next;
      paint();
      if (room.status === 'settled') await loadSettlement(true);
    } catch (error) {
      sfx.error();
      toast(error.message, 'bad');
    } finally {
      busy = false;
    }
  }

  async function loadSettlement(scroll = false) {
    settleEl.innerHTML = `
      <div class="panel stack">
        <span class="eyebrow">Settlement</span>
        <p class="muted">Replaying the match from the revealed seed and proving the payout…</p>
      </div>`;
    try {
      settlement = await post(`/api/rooms/${room.id}/settle`);
      const view = room;
      settleEl.innerHTML = settlementCard({ settlement, room: view, names });
      if (scroll) settleEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      sfx.win();
      stopPoll?.();
      stopPoll = watchAttestation(room.id, settleEl, settlement.zk?.attestation, (attestation) => {
        settlement.zk = { ...settlement.zk, attestation };
        settleEl.innerHTML = settlementCard({ settlement, room: view, names });
      });
    } catch (error) {
      settleEl.innerHTML = `<div class="panel"><p class="bad">${esc(error.message)}</p></div>`;
    }
  }

  function newTable(button) {
    const live = room && room.status !== 'settled';
    if (live && button?.dataset.armed !== 'yes') {
      // Two-step confirmation instead of a native dialog: no focus trap, no surprise.
      button.dataset.armed = 'yes';
      button.textContent = 'Confirm — abandon table';
      setTimeout(() => {
        if (!button.isConnected) return;
        button.dataset.armed = 'no';
        button.textContent = 'New table';
      }, 4000);
      return;
    }
    stopPoll?.();
    stopPoll = null;
    room = null;
    settlement = null;
    lastDice = null;
    localStorage.removeItem(ROOM_KEY);
    ctx.rerender();
  }

  node.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.roll !== undefined) act('roll');
    else if (button.dataset.buy !== undefined) act('buy');
    else if (button.dataset.skip !== undefined) act('skip');
    else if (button.dataset.new !== undefined) newTable(button);
    else if (button.dataset.copy !== undefined) {
      navigator.clipboard?.writeText(room.id).then(
        () => toast('Table id copied'),
        () => toast('Copy failed', 'bad'),
      );
    }
  });

  const onKey = (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target.closest('input, textarea, select, [contenteditable]')) return;
    const key = event.key.toLowerCase();
    if (key === 'r' && !room.pendingBuy) act('roll');
    else if (key === 'b' && room.pendingBuy) act('buy');
    else if (key === 's' && room.pendingBuy) act('skip');
  };
  document.addEventListener('keydown', onKey);
  ctx.onCleanup(() => {
    document.removeEventListener('keydown', onKey);
    stopPoll?.();
  });

  paint();
  if (room.status === 'settled' && !settlement) loadSettlement();

  return node;
}
