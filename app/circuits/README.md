# settle.circom — build, prove, and what it actually proves

Measured on 2026-11-20 in a `node:22` container, single CPU.

| Step | Time | Notes |
|---|---|---|
| `circom` binary | ~5 s | prebuilt `circom-linux-amd64` v2.2.2 from GitHub releases |
| `powersoftau new bn128 12` | 1 s | 1.5 MB |
| `powersoftau contribute` | 3 s | dev entropy |
| `powersoftau prepare phase2` | 46 s | **one-time**, reusable for any circuit ≤ 2^12 |
| `groth16 setup` (`zKey.newZKey`) | ~20 s | 3312 constraints |
| **prove** | **337 ms** | wasm witness + Groth16 |
| verify | ~10 ms | |

## The ptau caveat — stated, not hidden

Every public ptau mirror we tried returns **403** (`hermez.s3-eu-west-1.amazonaws.com`,
`storage.googleapis.com/zkevm/ptau`), so the file is generated locally. That means *we* ran the ceremony,
which in production would be a trust assumption: whoever ran it could in principle forge proofs. For a
hackathon build this is disclosed on the ledger page rather than papered over. A real deployment replaces
`p.ptau` with a public ceremony file; nothing else changes.

## Build

```sh
npm i circomlib@2.0.5 snarkjs@0.7.4
./circom settle.circom --r1cs --wasm --sym -l node_modules
# once: powersoftau new bn128 12 → contribute → prepare phase2  (≈50 s)
node -e "require('snarkjs').zKey.newZKey('settle.r1cs','p12.ptau','settle.zkey')"
```

## What the constraints enforce

Verified by four negative cases — each is **rejected** at witness generation:

| Attempt | Result |
|---|---|
| hidden rake: `payouts = [2969, 1, 0, 0]` with the same pot | rejected |
| wrong winner: `winnerIdx = 2` when player 0 holds the maximum | rejected |
| cap breach: `cap` below the payout | rejected |
| inflated pot: pot and payout both raised by 1 | rejected |

Positive case: a real settlement from the engine (`pot 2970`, balances `[770, 0, 20, 240]`) proves in 337 ms
and verifies, with both Poseidon outputs matching commitments computed independently in JavaScript.

## The limit, in one sentence

The circuit binds a **committed vector** — it proves conservation, the cap, that the whole pot reaches the
true argmax, and single-use of the nonce. It does **not** re-run the board in zero knowledge; following the
rules is covered by replaying the game from the revealed seed. The ledger page says both.
