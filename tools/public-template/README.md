# Forge Fair

A 16-tile property game for 2–4 seats whose settlement you can verify instead of trusting the house.
A seed is committed before the first roll, the finished match is replayed from the revealed seed, and the
payout vector is proved with Groth16 and anchored on zkVerify mainnet.

**Live:** https://forge-fair-eda0e7.azurewebsites.net — press *Run a bot match* on `#/watch`, then
*Verify this match*.

## The claim

| Layer | What it proves |
| --- | --- |
| Committed seed | Dice cannot be re-rolled after the board is visible. |
| Deterministic replay | The final state and payout vector are exactly what the committed rules produce. |
| Groth16 circuit (`app/circuits/settle.circom`, 3,312 constraints) | Payouts sum to the pot, no payout exceeds the cap, the paid seat is the true leader, the settlement nonce is single-use. |
| zkVerify (Kurier, mainnet) | A public, timestamped record that this payout vector satisfied those constraints before credit moved. |

A finalized reference settlement:

- jobId `98c68b29-e58c-11f1-838e-1e6a0d14f999`
- tx `0x88c223d2a292fe3f45ba71529b7c3c62a6232a355020566a5c20674060459277`
- status Finalized, `2026-11-21T09:19:25Z`

## Honest limits

- No cross-match ledger or hash chain: each match shows its own finalized reference.
- Hotseat only; no remote seats, no wallets, no faucet. Credits are a closed zero-sum score.
- Rooms live in memory and are lost on restart.
- The circuit proves the money moved as committed; the rules themselves are proved by deterministic replay,
  not by the circuit. The proof page says so.

## Run

```sh
cd app
npm install
npm start     # http://localhost:3000
npm test      # engine, replay, settlement, circuit and bot-match tests
```

Static front end (`app/public`) plus a Node HTTP server (`app/src/server.js`). No build step — the browser
loads ES modules directly.

## Screens

| Route | What it is |
| --- | --- |
| `#/` | Landing: the commit → play → prove loop. |
| `#/play` | Lobby (2–4 seats) and the hotseat table. |
| `#/watch` | A bot match replayed with commentary, then verified. |
| `#/guide` | Rulebook. |
| `#/proof` | The verification layers, circuit facts and public signals. |

## API

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/board` | The 16 tiles. |
| GET | `/api/circuit` | Circuit metadata (name, curve, constraints, signals). |
| POST | `/api/rooms` | `{ players: 2..4 }` → room with every seat joined. |
| GET | `/api/rooms/:id` | Public room view. |
| POST | `/api/rooms/:id/action` | `{ type: 'roll' \| 'buy' \| 'skip' }`. |
| POST | `/api/rooms/:id/settle` | Replay, prove, pay out; reveals the seed. |
| GET | `/api/rooms/:id/attestation` | zkVerify job status for the settlement. |
| POST | `/api/demo` | `{ players, names }` → a bot match played to the end, as narrated frames. |

## Docs

- `audit/FORGE-FAIR-SPEC.md` — threat model, two-layer settlement, circuit design.
- `docs/AZURE-SETUP.md` — deployment notes.
- `PROVENANCE.md` — where the threat model comes from.
