// Deterministic game engine.
//
// State holds no seed: only its commitment. Every transition is a pure function of
// (state, action, seed), so anyone holding the revealed seed can replay the whole
// game and recompute the payout vector. That replay is layer 1 of the proof; the
// circuit is layer 2.

import { BOARD_SIZE, TILES } from './board.js';
import { rollDice, seedCommitment } from './dice.js';

export const START_BALANCE = 1000;
export const STAKE = 200;
export const MAX_ROUNDS = 24;

export function createGame({ seed, players }) {
  return {
    seedCommitment: seedCommitment(seed),
    players: players.map((id) => ({
      id,
      balance: START_BALANCE,
      pos: 0,
      jailed: false,
      out: false,
      staked: false,
    })),
    owners: {},
    pot: 0,
    turn: 0,
    round: 1,
    diceIndex: 0,
    pendingBuy: null,
    status: 'open',
    log: [],
  };
}

export function apply(state, action, seed) {
  const next = structuredClone(state);
  switch (action.type) {
    case 'join':
      return applyJoin(next, action);
    case 'roll':
      return applyRoll(next, action, seed);
    case 'buy':
      return applyBuy(next, action);
    case 'skip':
      return applySkip(next);
    default:
      throw new Error(`unknown action: ${action.type}`);
  }
}

function applyJoin(state, action) {
  if (state.status !== 'open') throw new Error('joining is closed');
  const player = state.players.find((p) => p.id === action.playerId);
  if (!player) throw new Error('unknown player');
  if (player.staked) throw new Error('already joined');
  player.balance -= STAKE;
  player.staked = true;
  state.pot += STAKE;
  state.log.push({ type: 'join', playerId: player.id });
  if (state.players.every((p) => p.staked)) state.status = 'active';
  return state;
}

function applyRoll(state, action, seed) {
  if (state.status !== 'active') throw new Error('game is not active');
  if (state.pendingBuy) throw new Error('a purchase decision is pending');
  const player = state.players[state.turn];

  if (player.jailed) {
    player.jailed = false;
    state.log.push({ type: 'held', playerId: player.id });
    advance(state);
    checkEnd(state);
    return state;
  }

  const [a, b] = rollDice(seed, state.diceIndex);
  state.diceIndex += 1;
  player.pos = (player.pos + a + b) % BOARD_SIZE;
  const tile = TILES[player.pos];
  state.log.push({ type: 'roll', playerId: player.id, dice: [a, b], pos: player.pos, tile: tile.id });

  if (tile.kind === 'property') {
    const owner = state.owners[tile.id];
    if (!owner) {
      if (player.balance >= tile.price) state.pendingBuy = { playerId: player.id, tileId: tile.id };
    } else if (owner !== player.id) {
      const holder = state.players.find((p) => p.id === owner);
      if (holder && !holder.out) {
        if (player.balance < tile.rent) {
          eliminate(state, player);
        } else {
          player.balance -= tile.rent;
          holder.balance += tile.rent;
        }
      }
    }
  } else if (tile.kind === 'tax') {
    if (player.balance < tile.amount) {
      eliminate(state, player);
    } else {
      player.balance -= tile.amount;
      state.pot += tile.amount;
    }
  } else if (tile.kind === 'jail') {
    player.jailed = true;
  }

  if (!state.pendingBuy) advance(state);
  checkEnd(state);
  return state;
}

function applyBuy(state) {
  const pending = state.pendingBuy;
  if (!pending) throw new Error('nothing to buy');
  const player = state.players.find((p) => p.id === pending.playerId);
  const tile = TILES[pending.tileId];
  if (player.balance < tile.price) throw new Error('insufficient balance');
  player.balance -= tile.price;
  state.pot += tile.price;
  state.owners[tile.id] = player.id;
  state.pendingBuy = null;
  state.log.push({ type: 'buy', playerId: player.id, tileId: tile.id, price: tile.price });
  advance(state);
  checkEnd(state);
  return state;
}

function applySkip(state) {
  if (!state.pendingBuy) throw new Error('nothing to skip');
  state.pendingBuy = null;
  state.log.push({ type: 'skip', playerId: state.players[state.turn].id });
  advance(state);
  checkEnd(state);
  return state;
}

function eliminate(state, player) {
  player.out = true;
  state.pot += player.balance;
  player.balance = 0;
  for (const [tileId, owner] of Object.entries(state.owners)) {
    if (owner === player.id) delete state.owners[tileId];
  }
  state.log.push({ type: 'eliminate', playerId: player.id });
}

function advance(state) {
  const n = state.players.length;
  for (let step = 1; step <= n; step += 1) {
    const idx = (state.turn + step) % n;
    if (!state.players[idx].out) {
      if (idx <= state.turn) state.round += 1;
      state.turn = idx;
      return;
    }
  }
}

function checkEnd(state) {
  const alive = state.players.filter((p) => !p.out).length;
  if (alive <= 1 || state.round > MAX_ROUNDS) {
    state.status = 'settled';
    state.pendingBuy = null;
  }
}

/**
 * The payout vector. `balances` is read before distribution, so the winner is the true
 * argmax of committed balances — exactly what the circuit checks. Ties are permitted:
 * the circuit asserts `>=`, so a tied leader is still a valid winner.
 */
export function settle(state) {
  const balances = state.players.map((p) => p.balance);
  let winnerIdx = 0;
  for (let i = 1; i < balances.length; i += 1) {
    if (balances[i] > balances[winnerIdx]) winnerIdx = i;
  }
  const payouts = balances.map(() => 0);
  payouts[winnerIdx] = state.pot;
  return { pot: state.pot, balances, payouts, winnerIdx, cap: state.pot };
}

/** Replay from the revealed seed — the check any stranger can run. */
export function replay(seed, playerIds, actions) {
  let state = createGame({ seed, players: playerIds });
  for (const action of actions) state = apply(state, action, seed);
  return state;
}
