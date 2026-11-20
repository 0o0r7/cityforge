// Bot match: a real room played by a deterministic strategy, frame by frame.
//
// This is not a simulation of a game — it is a game. The room it produces settles
// through the same endpoint as a human match, so the proof at the end is the proof of
// exactly these actions. The seed stays on the server until settlement, so watching the
// bot cannot reveal a roll in advance.

import { TILES } from './engine/board.js';
import { apply } from './engine/game.js';

// Keep this much after a purchase; a bot that buys itself to zero loses to rent.
const BUFFER = 200;
const MAX_STEPS = 600;

const fallback = (id) => String(id).toUpperCase();

function nextAction(state) {
  if (state.pendingBuy) {
    const player = state.players.find((p) => p.id === state.pendingBuy.playerId);
    const tile = TILES[state.pendingBuy.tileId];
    const affordable = player.balance - tile.price >= BUFFER;
    return { type: affordable ? 'buy' : 'skip', playerId: player.id };
  }
  return { type: 'roll', playerId: state.players[state.turn].id };
}

function snapshot(state) {
  return {
    players: state.players.map((p) => ({ ...p })),
    owners: { ...state.owners },
    pot: state.pot,
    turn: state.turn,
    round: state.round,
    status: state.status,
  };
}

/** One sentence per action, read from what actually changed. */
function narrate(before, after, action, name) {
  const actor = after.players.find((p) => p.id === action.playerId);
  const prev = before.players.find((p) => p.id === action.playerId);
  const who = name(action.playerId);

  if (action.type === 'join') return `${who} buys in for 200.`;

  if (action.type === 'roll') {
    const entry = [...after.log].reverse().find((e) => e.type === 'roll' || e.type === 'held');
    if (!entry || entry.type === 'held') return `${who} sits the turn out in the Hold.`;
    const [a, b] = entry.dice;
    const tile = TILES[entry.pos];
    const base = `${who} rolls ${a} + ${b} = ${a + b} → ${tile.name}.`;
    if (actor.out && !prev.out) return `${base} Cannot cover it — ${who} is out.`;
    if (tile.kind === 'property') {
      const holder = after.owners[tile.id];
      if (holder && holder !== action.playerId) return `${base} Rent ${tile.rent} to ${name(holder)}.`;
      if (holder === action.playerId) return `${base} Own deed, no rent.`;
      if (after.pendingBuy) return `${base} Deed open at ${tile.price}.`;
      return `${base} Too thin to buy.`;
    }
    if (tile.kind === 'tax') return `${base} ${tile.amount} to the pot.`;
    if (tile.kind === 'jail') return `${base} Held for a turn.`;
    return base;
  }

  if (action.type === 'buy') {
    const entry = [...after.log].reverse().find((e) => e.type === 'buy');
    return `${who} buys ${TILES[entry.tileId].name} for ${entry.price}.`;
  }

  if (action.type === 'skip') {
    const tile = before.pendingBuy ? TILES[before.pendingBuy.tileId] : null;
    return `${who} passes on ${tile ? tile.name : 'the deed'}.`;
  }

  return `${who} ${action.type}.`;
}

/** Plays `room` to the end in place and returns the frames a spectator can replay. */
export function runBot(room, names = []) {
  const name = (id) => {
    const index = room.playerIds.indexOf(id);
    const custom = index >= 0 ? names[index] : null;
    return custom ? String(custom).slice(0, 12) : fallback(id);
  };
  const frames = [];
  let guard = 0;

  while (room.state.status !== 'settled' && guard < MAX_STEPS) {
    guard += 1;
    const action = nextAction(room.state);
    const before = structuredClone(room.state);
    const after = apply(room.state, action, room.seed);
    room.state = after;
    room.actions.push(action);

    const entry = [...after.log].reverse().find((e) => e.type === 'roll');
    const rolled = action.type === 'roll' && entry && entry.playerId === action.playerId;

    frames.push({
      n: frames.length + 1,
      action: action.type,
      playerId: action.playerId,
      dice: rolled ? entry.dice : null,
      narration: narrate(before, after, action, name),
      state: snapshot(after),
    });
  }

  room.seen = Date.now();
  return { frames };
}
