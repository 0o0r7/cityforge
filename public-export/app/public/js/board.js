// Board rendering. Pure presentation: it takes a room snapshot and paints it.

import { esc, money, seatColor, seatName } from './ui.js';

/** 5x5 perimeter, clockwise from the bottom-left corner. */
export function cellFor(index) {
  if (index < 5) return { row: 5, col: index + 1 };
  if (index < 9) return { row: 5 - (index - 4), col: 5 };
  if (index < 13) return { row: 1, col: 5 - (index - 8) };
  return { row: 1 + (index - 12), col: 1 };
}

const KIND_LABEL = {
  start: 'start',
  property: (tile) => `T${tile.tier}`,
  tax: 'tax',
  rest: 'rest',
  jail: 'hold',
};

function kindLabel(tile) {
  const label = KIND_LABEL[tile.kind];
  return typeof label === 'function' ? label(tile) : label || tile.kind;
}

function tileMeta(tile, ownerLabel) {
  if (tile.kind === 'property') {
    return ownerLabel
      ? `<span class="owner">${esc(ownerLabel)}</span> · rent ${tile.rent}`
      : `${tile.price} · rent ${tile.rent}`;
  }
  if (tile.kind === 'tax') return `pay ${tile.amount}`;
  if (tile.kind === 'jail') return 'lose a turn';
  if (tile.kind === 'start') return 'collect nothing';
  return 'safe';
}

export function renderBoard(container, { tiles, room = null, dice = null, compact = false, rolling = false, names = [] }) {
  if (!container) return;
  container.classList.toggle('compact', Boolean(compact));
  container.replaceChildren();

  const players = room?.players ?? [];
  const owners = room?.owners ?? {};

  tiles.forEach((tile, index) => {
    const { row, col } = cellFor(index);
    const ownerId = owners[tile.id] ?? owners[String(tile.id)] ?? null;
    const ownerIndex = ownerId ? players.findIndex((player) => player.id === ownerId) : -1;
    const ownerLabel = ownerIndex >= 0 ? seatName(ownerIndex, names) : null;
    const here = players.map((player, i) => ({ player, i })).filter(({ player }) => !player.out && player.pos === tile.id);

    const node = document.createElement('div');
    node.className = 'tile';
    node.dataset.kind = tile.kind;
    node.style.gridRow = String(row);
    node.style.gridColumn = String(col);
    node.setAttribute('role', 'gridcell');
    node.setAttribute(
      'aria-label',
      [
        tile.name,
        tile.kind === 'property' ? `${tile.price} to buy, ${tile.rent} rent` : kindLabel(tile),
        ownerLabel ? `owned by ${ownerLabel}` : null,
        here.length ? `occupied by ${here.map(({ i }) => seatName(i, names)).join(', ')}` : null,
      ]
        .filter(Boolean)
        .join('. '),
    );

    if (ownerIndex >= 0) {
      node.classList.add('owned');
      node.style.setProperty('--owner', seatColor(ownerIndex));
    }
    if (room?.pendingBuy?.tileId === tile.id) node.classList.add('pending');
    if (here.length) node.classList.add('occupied');

    const tokens = here
      .map(
        ({ player, i }) =>
          `<span class="token" style="--seat:${seatColor(i)}" title="${esc(seatName(i, names))}">${i + 1}</span>`,
      )
      .join('');

    node.innerHTML = `
      <div class="tile-top">
        <span class="name">${esc(tile.name)}</span>
        <span class="kind">${esc(kindLabel(tile))}</span>
      </div>
      <div>
        <div class="meta">${tileMeta(tile, ownerLabel)}</div>
        <div class="tokens">${tokens}</div>
      </div>`;

    container.append(node);
  });

  const center = document.createElement('div');
  center.className = 'board-center';
  center.setAttribute('aria-hidden', 'false');

  if (room) {
    const mover = room.players?.[room.turn];
    const moverName = mover ? seatName(room.turn, names) : null;
    const dieMarkup =
      dice && dice.length === 2
        ? `<div class="dice-pair${rolling ? ' rolling' : ''}"><span class="die">${dice[0]}</span><span class="die">${dice[1]}</span></div>`
        : '';
    center.innerHTML = `
      ${dieMarkup}
      <div class="pot-label">Pot</div>
      <div class="pot">${money(room.pot)}</div>
      <div class="turn">${
        room.status === 'settled'
          ? 'Settled'
          : `<b style="color:${seatColor(room.turn)}">${esc(moverName ?? '—')}</b> to move · round ${room.round}/24`
      }</div>`;
  } else {
    center.innerHTML = `
      <div class="pot-label">Forge Fair</div>
      <div class="pot">16</div>
      <div class="turn">tiles · 2–4 seats · one provable payout</div>`;
  }

  container.append(center);
}
