# Forge Fair — the app

A 16-tile property game for 2–4 seats, with a settlement you can check: the dice come
from a seed committed before the first roll, the finished match is replayed from the
revealed seed, and the payout vector is proved with Groth16 and (optionally) anchored on
zkVerify through Kurier.

## Run

```sh
cd app
npm install
npm start          # http://localhost:3000
npm test           # engine, replay, settlement, circuit and bot-match tests
```

The app is a static front end (`app/public`) plus a Node HTTP server (`app/src/server.js`).
No build step: the browser loads ES modules directly, so edits are live on reload.

## Screens

| Route     | What it is                                                                 |
| --------- | -------------------------------------------------------------------------- |
| `#/`      | Landing: pitch, the commit → play → prove loop, a live board illustration.  |
| `#/play`  | Lobby (2–4 seats, names) and then the hotseat table.                        |
| `#/watch` | A real bot match, replayed frame by frame with commentary, then verified.   |
| `#/guide` | Rulebook: objective, turn, tile table, money, endgame, fairness, controls.  |
| `#/proof` | The four verification layers, circuit facts and public signals.            |

The table is saved in `localStorage` (`ff.room`), so a refresh reopens the same match.
Seat names are cosmetic and stay on the client.

## API

| Method | Path                        | Notes                                                        |
| ------ | --------------------------- | ------------------------------------------------------------ |
| GET    | `/api/board`                | The 16 tiles.                                                 |
| GET    | `/api/circuit`              | Settlement circuit metadata (name, curve, constraints, signals). |
| POST   | `/api/rooms`                | `{ players: 2..4 }` → room with every seat joined.            |
| GET    | `/api/rooms/:id`            | Public room view.                                             |
| POST   | `/api/rooms/:id/action`     | `{ type: 'roll' \| 'buy' \| 'skip' }`.                        |
| POST   | `/api/rooms/:id/settle`     | Replay, prove, pay out; reveals the seed.                     |
| GET    | `/api/rooms/:id/attestation`| zkVerify job status for the settlement.                       |
| POST   | `/api/demo`                 | `{ players, names }` → a bot match played to the end, as frames with narration. |

`POST /api/demo` creates a real room and plays it to settlement on the server. The client
only replays the frames it gets back; the seed stays server-side until the match is
settled, so watching cannot leak a future roll.

## Layout of the front end

```
public/
├── index.html            shell: header, nav, footer, #view
├── css/                  tokens → base → layout → game → views
└── js/
    ├── app.js            hash router, view lifecycle, sound toggle
    ├── api.js            JSON client (+ board/circuit caches)
    ├── board.js          board + tile + token rendering
    ├── settlement.js     payout card, proof block, attestation poll
    ├── sound.js          WebAudio blips, one toggle, no assets
    ├── ui.js             escaping, seat colours, formatting, toasts
    └── views/            home, play, watch, guide, proof
```

## Controls

`R` roll · `B` buy · `S` pass · `♪` sound on/off. All three shortcuts are ignored while
typing in an input.

## Known limits

- **Hotseat only.** The API is already room-based, but there is no transport for remote
  seats: two to four players share one screen.
- **Rooms live in memory** for two hours; a redeploy ends a match in progress.
- **No accounts, no wallet.** Credits are a closed score, not a token.
- **zkVerify is optional.** Without `KURIER_API_KEY` the settlement still carries a
  locally verified proof and reports itself as unattested.
