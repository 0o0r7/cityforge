// Board client. Talks to /api only; every rule lives in the engine on the server.

const STORE_KEY = 'forge-fair-room';
const $ = (id) => document.getElementById(id);

const ui = {
  board: $('board'),
  commitment: $('commitment'),
  round: $('round'),
  pot: $('pot'),
  turn: $('turn'),
  players: $('players'),
  roll: $('roll'),
  buy: $('buy'),
  skip: $('skip'),
  hint: $('hint'),
  result: $('result'),
  log: $('log'),
  new: $('new'),
  roomId: $('roomId'),
};

let tiles = [];
let room = null;

/** 5x5 perimeter, clockwise from the bottom-left corner. */
function cellFor(i) {
  if (i < 5) return { row: 5, col: i + 1 };
  if (i < 9) return { row: 5 - (i - 4), col: 5 };
  if (i < 13) return { row: 1, col: 5 - (i - 8) };
  return { row: 1 + (i - 12), col: 1 };
}

async function api(path, options) {
  const response = await fetch(path, {
    headers: { 'content-type': 'application/json' },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `request failed (${response.status})`);
  return data;
}

function playerLabel(index) {
  return room?.players?.[index]?.id?.toUpperCase() ?? '—';
}

function renderBoard() {
  const center = ui.board.querySelector('.center') ?? document.createElement('div');
  ui.board.replaceChildren();

  const here = room ? room.players.map((p) => (p.out ? null : p.pos)) : [];

  tiles.forEach((tile, index) => {
    const { row, col } = cellFor(index);
    const el = document.createElement('div');
    el.className = 'tile';
    el.style.gridRow = String(row);
    el.style.gridColumn = String(col);

    const owners = room ? Object.entries(room.owners).filter(([, owner]) => owner) : [];
    const owner = owners.find(([tileId]) => Number(tileId) === tile.id)?.[1];
    if (owner) el.classList.add('owned');
    if (room?.pendingBuy?.tileId === tile.id) el.classList.add('pending');
    if (here.includes(index)) el.classList.add('here');

    const meta =
      tile.kind === 'property'
        ? `${tile.price} · rent ${tile.rent}`
        : tile.kind === 'tax'
          ? `pay ${tile.amount}`
          : tile.kind;

    const chips = room
      ? room.players
          .map((player, i) => ({ player, i }))
          .filter(({ player }) => !player.out && player.pos === index)
          .map(({ player, i }) => `<span class="chip">${playerLabel(i)}</span>`)
          .join('')
      : '';

    el.innerHTML = `
      <div>
        <span class="tier">${tile.tier ? `T${tile.tier}` : ''}</span>
        <div class="name">${tile.name}</div>
      </div>
      <div>
        <div class="meta">${owner ? `${owner.toUpperCase()} · ` : ''}${meta}</div>
        <div class="chips">${chips}</div>
      </div>`;
    ui.board.append(el);
  });

  ui.board.append(center);
}

function renderCenter(lastRoll) {
  let center = ui.board.querySelector('.center');
  if (!center) {
    center = document.createElement('div');
    center.className = 'center';
  }
  if (!room) {
    center.innerHTML = '<div class="big">Forge Fair</div><div class="who">starting…</div>';
    return;
  }
  const player = room.players[room.turn];
  const dice = lastRoll ? `<div class="dice">${lastRoll.join(' · ')}</div>` : '';
  center.innerHTML = `
    ${dice}
    <div class="big">${room.pot}</div>
    <div class="who">pot · ${player ? `${player.id.toUpperCase()} to move` : 'settled'}</div>`;
}

function renderPanel() {
  if (!room) return;
  ui.commitment.textContent = room.commitment;
  ui.round.textContent = String(room.round);
  ui.pot.textContent = String(room.pot);
  ui.turn.textContent = playerLabel(room.turn);
  ui.roomId.textContent = room.id.slice(0, 10);

  ui.players.replaceChildren(
    ...room.players.map((player, i) => {
      const li = document.createElement('li');
      li.className = 'player';
      if (i === room.turn && room.status === 'active') li.classList.add('active');
      if (player.out) li.classList.add('out');
      li.innerHTML = `
        <span class="who"><span class="chip">${playerLabel(i)}</span> ${player.staked ? 'staked' : 'joining'}</span>
        <span class="bal">${player.balance}</span>`;
      return li;
    }),
  );

  const active = room.status === 'active';
  ui.roll.disabled = !active || Boolean(room.pendingBuy);
  ui.buy.hidden = !room.pendingBuy;
  ui.skip.hidden = !room.pendingBuy;
  if (room.pendingBuy) {
    const tile = tiles[room.pendingBuy.tileId];
    ui.buy.textContent = `Buy ${tile.name} · ${tile.price}`;
  }

  if (room.status === 'settled') {
    ui.hint.textContent = 'Game over — settlement below.';
  } else if (room.pendingBuy) {
    ui.hint.textContent = `${room.pendingBuy.playerId.toUpperCase()} landed on an unowned tile.`;
  } else {
    ui.hint.textContent = 'Stake 200 each. Last solvent player takes the pot.';
  }

  const lastRoll = [...room.log].reverse().find((entry) => entry.type === 'roll');
  renderCenter(lastRoll?.dice);

  ui.log.replaceChildren(
    ...room.log
      .slice()
      .reverse()
      .map((entry) => {
        const li = document.createElement('li');
        li.textContent = describe(entry);
        return li;
      }),
  );
}

function describe(entry) {
  const who = (id) => (id ? id.toUpperCase() : '—');
  switch (entry.type) {
    case 'join':
      return `${who(entry.playerId)} staked 200`;
    case 'roll':
      return `${who(entry.playerId)} rolled ${entry.dice.join('+')} → ${tiles[entry.pos]?.name ?? entry.pos}`;
    case 'buy':
      return `${who(entry.playerId)} bought ${tiles[entry.tileId]?.name} for ${entry.price}`;
    case 'skip':
      return `${who(entry.playerId)} passed`;
    case 'held':
      return `${who(entry.playerId)} skipped a turn in the Hold`;
    case 'eliminate':
      return `${who(entry.playerId)} went bankrupt`;
    default:
      return entry.type;
  }
}

async function loadSettlement() {
  const data = await api(`/api/rooms/${room.id}/settle`, { method: 'POST' });
  const winner = room.players[data.winnerIdx]?.id?.toUpperCase() ?? '—';
  ui.result.hidden = false;
  ui.result.innerHTML = `
    <h2>${winner} takes ${data.payouts[data.winnerIdx]}</h2>
    <div>Pot ${data.pot} · balances ${data.balances.join(' / ')}</div>
    <div class="${data.replay.ok ? 'ok' : 'bad'}">
      replay of ${data.replay.actions} actions ${data.replay.ok ? 'matches the final state' : 'MISMATCH'}
    </div>
    <div><span class="label">revealed seed</span><code>${data.seed}</code></div>
    <div><span class="label">commitment</span><code>${data.commitment}</code></div>`;
}

function render() {
  renderBoard();
  renderPanel();
}

async function act(type) {
  const body = type === 'roll' || type === 'buy' || type === 'skip' ? { type } : type;
  try {
    room = await api(`/api/rooms/${room.id}/action`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    render();
    if (room.status === 'settled') await loadSettlement();
  } catch (error) {
    ui.hint.textContent = error.message;
  }
}

async function newGame(players = 2) {
  localStorage.removeItem(STORE_KEY);
  room = await api('/api/rooms', { method: 'POST', body: JSON.stringify({ players }) });
  localStorage.setItem(STORE_KEY, room.id);
  ui.result.hidden = true;
  render();
}

async function boot() {
  tiles = (await api('/api/board')).tiles;

  const saved = localStorage.getItem(STORE_KEY);
  if (saved) {
    try {
      room = await api(`/api/rooms/${saved}`);
    } catch {
      room = null;
    }
  }
  if (!room) {
    await newGame(2);
    return;
  }
  render();
  if (room.status === 'settled') await loadSettlement();
}

ui.roll.addEventListener('click', () => act({ type: 'roll' }));
ui.buy.addEventListener('click', () => act({ type: 'buy' }));
ui.skip.addEventListener('click', () => act({ type: 'skip' }));
ui.new.addEventListener('click', () => newGame(2).catch((error) => (ui.hint.textContent = error.message)));

boot().catch((error) => {
  ui.hint.textContent = `could not start: ${error.message}`;
});
