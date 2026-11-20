// Forge Fair HTTP server.
//
// One process, no dependencies: it holds rooms in memory, exposes the deterministic
// engine over JSON, and serves the static board. The seed never leaves the server until
// the game settles, so a roll cannot be re-rolled after the board is visible.

import { createServer } from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TILES } from './engine/board.js';
import { apply, createGame, replay, settle } from './engine/game.js';
import { CIRCUIT, proveSettlement, verificationKey } from './zk/prove.js';
import { attestationStatus, prewarm, submitAttestation } from './zk/zkverify.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(HERE, '..', 'public');
const PORT = Number(process.env.PORT || 8080);
const ROOM_TTL_MS = 2 * 60 * 60 * 1000;
const MAX_BODY = 64 * 1024;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

/** @type {Map<string, {id: string, seed: string, playerIds: string[], actions: object[], state: object, seen: number}>} */
const rooms = new Map();

function prune() {
  const now = Date.now();
  for (const [id, room] of rooms) {
    if (now - room.seen > ROOM_TTL_MS) rooms.delete(id);
  }
}

function publicView(room) {
  const state = room.state;
  return {
    id: room.id,
    status: state.status,
    round: state.round,
    maxRounds: state.maxRounds ?? null,
    turn: state.turn,
    pot: state.pot,
    players: state.players,
    owners: state.owners,
    pendingBuy: state.pendingBuy,
    diceIndex: state.diceIndex,
    log: state.log.slice(-40),
    commitment: state.seedCommitment,
    seed: state.status === 'settled' ? room.seed : null,
  };
}

/**
 * One settlement, one proof. The witness (salts + nonce) is generated once and the result
 * is cached on the room, so repeated settlement reads return the same proof instead of a
 * second, differently nonced one.
 */
function settlementProof(room) {
  if (!room.proof) {
    room.proof = (async () => {
      const outcome = settle(room.state);
      const proved = await proveSettlement(outcome);
      const attestation = await submitAttestation({
        proof: proved.proof,
        publicSignals: proved.publicSignals,
        vk: await verificationKey(),
      });
      return { ...proved, attestation };
    })().catch((error) => ({ error: error.message }));
  }
  return room.proof;
}

async function settlement(room) {
  const replayed = replay(room.seed, room.playerIds, room.actions);
  const ok =
    JSON.stringify(replayed.players) === JSON.stringify(room.state.players) &&
    replayed.pot === room.state.pot &&
    replayed.diceIndex === room.state.diceIndex;
  const proof = await settlementProof(room);
  const zk = proof.error
    ? { circuit: CIRCUIT, error: proof.error }
    : {
        circuit: CIRCUIT,
        proof: proof.proof,
        publicSignals: proof.publicSignals,
        signals: proof.signals,
        proveMs: proof.proveMs,
        localVerify: proof.verified,
        attestation: proof.attestation,
      };
  return {
    ...settle(room.state),
    seed: room.seed,
    commitment: room.state.seedCommitment,
    replay: { ok, actions: room.actions.length },
    zk,
  };
}

function createRoom(playerCount) {
  const count = Math.min(4, Math.max(2, Number(playerCount) || 2));
  const playerIds = Array.from({ length: count }, (_, i) => `p${i + 1}`);
  const seed = randomBytes(16).toString('hex');
  let state = createGame({ seed, players: playerIds });
  const actions = [];
  for (const playerId of playerIds) {
    const action = { type: 'join', playerId };
    state = apply(state, action, seed);
    actions.push(action);
  }
  const room = {
    id: randomUUID().replace(/-/g, ''),
    seed,
    playerIds,
    actions,
    state,
    proof: null,
    seen: Date.now(),
  };
  rooms.set(room.id, room);
  return room;
}

function step(room, action) {
  const next = apply(room.state, action, room.seed);
  room.state = next;
  room.actions.push(action);
  room.seen = Date.now();
  return next;
}

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error('body too large');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new Error('invalid JSON body');
  }
}

async function serveStatic(res, pathname) {
  const rel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const target = normalize(join(PUBLIC_DIR, rel));
  if (!target.startsWith(PUBLIC_DIR)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  try {
    const file = await readFile(target);
    res.writeHead(200, {
      'content-type': MIME[extname(target)] || 'application/octet-stream',
      'cache-control': 'no-cache',
    });
    res.end(file);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('not found');
  }
}

async function route(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean);

  if (req.method === 'GET' && url.pathname === '/api/board') {
    return send(res, 200, { tiles: TILES });
  }

  if (req.method === 'POST' && url.pathname === '/api/rooms') {
    const body = await readJson(req);
    const room = createRoom(body.players);
    prune();
    return send(res, 201, publicView(room));
  }

  if (parts[0] === 'api' && parts[1] === 'rooms' && parts[2]) {
    const room = rooms.get(parts[2]);
    if (!room) return send(res, 404, { error: 'room not found' });
    room.seen = Date.now();

    if (req.method === 'GET' && parts.length === 3) return send(res, 200, publicView(room));

    if (req.method === 'POST' && parts[3] === 'action' && parts.length === 4) {
      const body = await readJson(req);
      const action = { type: body.type, playerId: body.playerId };
      try {
        step(room, action);
      } catch (error) {
        return send(res, 409, { error: error.message });
      }
      return send(res, 200, publicView(room));
    }

    if (req.method === 'POST' && parts[3] === 'settle' && parts.length === 4) {
      if (room.state.status !== 'settled') {
        return send(res, 409, { error: 'game has not finished yet' });
      }
      return send(res, 200, await settlement(room));
    }

    if (req.method === 'GET' && parts[3] === 'attestation' && parts.length === 4) {
      const proof = await settlementProof(room);
      if (proof.error) return send(res, 500, { error: proof.error });
      if (!proof.attestation?.jobId) return send(res, 200, proof.attestation);
      proof.attestation = await attestationStatus(proof.attestation.jobId);
      return send(res, 200, proof.attestation);
    }

    return send(res, 404, { error: 'unknown route' });
  }

  if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(res, url.pathname);
  return send(res, 405, { error: 'method not allowed' });
}

export const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  route(req, res, url).catch((error) => {
    if (!res.headersSent) send(res, 400, { error: error.message });
    else res.end();
  });
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`forge fair listening on http://0.0.0.0:${PORT}`);
    // One-time on-chain key registration, in the background: a settlement should not
    // wait ~20s for it the first time it runs.
    verificationKey()
      .then((vk) => prewarm(vk))
      .catch(() => {});
  });
}
