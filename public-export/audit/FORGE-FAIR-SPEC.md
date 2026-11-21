# Forge Fair — minimum real product specification

> **Implementation status (2026-11-21).** §6's cross-match public ledger and hash chain are **not
> implemented**. What exists is the per-settlement anchor: each match publishes its own `Finalized`
> reference (job id + tx hash) on the settlement card, and the payout is held until that reference is
> final. Submission copy must not claim a ledger or a hash chain.

Derived from the internal audit described in PROVENANCE.md, for zkVerify Agent Games.
Written 2026-11-20 20:50 UTC. Deadline 2026-11-21 22:00 UTC → **≈ 25 h remaining**.

## 0. The constraint that shapes everything

The deliverable must be a **working product**, not a demo or a mockup. That rules out a recorded fixture
standing in for a live path, a "proof" that was generated once and replayed, and a payout that is printed on
screen instead of attested by a finalized verification. Every claim below must be reproducible by a third party
from public data.

It equally rules out the full game: a 40-tile board with trading, mortgages and auctions cannot be built,
tested and deployed in 25 hours without at least one of those components degenerating into a mockup. So the
board shrinks; the **money loop does not**.

## 1. Product statement

**Forge Fair is a playable on-chain board game whose settlement is provable — players never have to trust the
house.** One sentence for the submission form: *the agent runs the money in a game and proves, on zkVerify,
that the pot reached the true winner with no hidden rake.*

Who it helps: any on-chain game or betting surface where the operator is the adversary — the player needs to
verify the payout without trusting the server, and the operator needs to prove it did not cheat without
publishing its seed or strategy.

## 2. Scope

### In
- A playable board, 2–4 players, one browser client.
- Committed-seed dice: commit at room creation, reveal at settlement. A roll cannot be re-rolled after the
  board is visible.
- A **closed virtual-credit economy**: every player starts with the same credit balance, credits are zero-sum,
  and no faucet, wallet or funded token is required to play.
- A Groth16 proof per settlement, verified on **zkVerify mainnet through Kurier** and gated on `Finalized`
  before any credit is moved or recorded.
- Optional on-chain mirror: the same settlement replayed as a USDC transfer on Arc Testnet, only if a faucet
  cooperates. Its absence weakens nothing — see §6.
- A public ledger: every settlement with its commitment, its payouts, and its finalized verification reference,
  replayable by anyone.

### Out (and said so on the submission page)
- Trading, auctions, mortgages, houses/hotels, chance-card decks beyond a fixed effect table.
- Multi-round tournaments, matchmaking, ratings.
- Any real-money use. Credits are not a token, are not redeemable and are not transferable outside a game.

## 3. Game rules (the whole rulebook)

- Board: 16 tiles, ring layout. 1 start, 9 properties in two price tiers, 3 tax tiles, 2 rest tiles, 1 jail
  (skip one turn). Fixed rent table — rent depends only on tile id, never on negotiation.
- 2d6 from the committed seed stream: `roll_i = 1 + (keccak(seed ‖ i) mod 6)` per die, rejection-sampled to
  avoid modulo bias (rejection sampling, no modulo bias).
- Entry stake `S` credits per player, escrowed from the starting balance at join. Pot = `n · S`. The total
  credit supply never changes: credits only move between players, they are never minted or burned.
- Landing on an unowned property: buy for its price out of the player's balance into the pot. Owned: pay rent to
  the owner from balance.
- Elimination: a player whose balance cannot cover a due payment is eliminated; their remaining balance is
  returned and their properties become unowned.
- End: one survivor, or 24 rounds elapsed → ranking by final balance.
- Settlement: a single payout vector `p[]` over all players, `sum(p) = pot`.

One honest weakness of a closed credit economy: a player who controls both sides of a game can farm a global
ranking. Mitigation, stated rather than hidden — the ledger ranks nothing globally; it attests per-game
settlements, and any future ranking must count distinct opponents, not raw winnings.

## 4. The proof

Two layers, and the split is deliberate — it is what makes this buildable in the window while staying honest.

**Layer 1 — replay.** The seed is revealed at settlement. Anyone can re-run the deterministic engine from
`(seed, joins, actions)` and recompute the entire game and the payout vector. This proves *the rules were
followed*. No circuit needed.

**Layer 2 — `settle.circom`.** Proves the credits moved exactly as committed, in one shot:

| | Signal |
|---|---|
| public | `potCommitment`, `payoutsHash`, `pot`, `cap`, `settlementNonce`, `winnerIdx` |
| private | `payouts[4]`, `balances[4]`, `salts[4]` |

Constraints (implemented in `app/circuits/settle.circom`, **built and tested**):
1. `Poseidon(payouts, salts, nonce) == payoutsHash` — the vector is the one committed before the settlement.
2. `Σ payouts == pot` — no hidden rake, nothing withheld.
3. `payouts[i] ≤ cap` — no payout above the committed ceiling.
4. The player at `winnerIdx` receives the **whole** pot.
5. `balances[winnerIdx] ≥ balances[j]` for all `j` — the winner is the true argmax, not the operator's pick.
6. The nonce is folded into both commitments — a settled vector cannot be replayed for a second settlement.

Measured: **3312 constraints, proof in 337 ms**, and four tampering attempts (hidden rake, wrong winner, cap
breach, inflated pot) are each rejected at witness generation. Build notes and the ptau caveat are in
`app/circuits/README.md`.

**Honest limit:** the circuit does not re-run the board in zero knowledge. It proves *conservation, cap,
true-winner and single-use* against a committed vector; the rules themselves are covered by replay. Both are
stated on the ledger page rather than blurred into one "fully verified" claim.

## 5. Agent flow

```
create room  → commit seed, open joins
join         → escrow stake credits, add player
turn         → derive roll, apply rules, append action log (no money moves)
settle       → build payout vector → prove → Kurier submit → poll to Finalized
             → sign Arc transfer → publish ledger entry
```

- The transfer is signed **only** after `Finalized`. A pending or failed verification leaves the settlement in
  `PROVEN_FAILED`, visible on the ledger — never silently retried into a payout.
- Idempotency: one settlement per `settlementNonce`; the ledger row is the lock, not process memory.
- Every state transition is persisted; the agent restarts mid-game without corrupting a pot.

## 6. Settlement anchor — why no faucet is needed

A virtual credit is a number in a database, so on its own it proves nothing: the operator can rewrite it. The
proof only becomes load-bearing when the committed vector is anchored somewhere the operator cannot edit.
**zkVerify is that anchor.** Each settlement's commitment is submitted through Kurier and reaches `Finalized`,
which leaves an immutable, public, timestamped record that *this* payout vector existed and satisfied the
constraints *before* a single credit was credited. No gas, no token, no wallet.

Tamper-evidence across games comes from a hash chain: each settlement's commitment includes the previous
settlement's hash, so altering one historical entry invalidates every later verification reference. The ledger
is append-only by construction, not by policy.

### 6.1 Optional: Arc Testnet mirror

- `chainId 5042002`, RPC `rpc.testnet.arc.network`, explorer `arcscan` (verified live)
- USDC is the **native gas token**; there is no ERC-20 hop. Balances and transfers are plain value transfers.
- Built only after the credit path is finished and only if the faucet works. It is a demonstration of the same
  signed settlement against real chain state, labelled as a mirror — never a substitute for the anchor.
- Other testnet tokens (Sepolia ETH, zkVerify tokens) are deliberately **not** used: they add gas and faucet
  friction and buy nothing that a finalized verification reference does not already provide.

## 6.1 Hosting — Azure for Students

DigitalOcean is no longer part of the GitHub Student Pack, so the earlier suggestion is out. Azure for Students
($100, no card required, already active) is the better fit anyway:

- **Target: App Service on Linux, B1, always-on.** HTTPS and a hostname come for free, the container restarts
  itself, and `/home` is persistent — which matters because the settlement ledger is the lock that makes
  idempotency work across restarts.
- **Not Container Apps.** It scales to zero (a judging endpoint must answer instantly) and its storage is
  stateless; making it correct needs min-replicas 1 plus an Azure Files mount. More moving parts, no benefit at
  this size.
- **Not a VM.** TLS, reverse proxy, patching and firewall rules would eat hours that the circuit needs.
- **Cost.** A B1 for 23 Nov – 1 Dec is roughly $4 — comfortably inside the $100 credit, so no free-tier sleeping.

## 7. Public surface

- `POST /rooms` · `POST /rooms/:id/join` · `POST /rooms/:id/roll` · `POST /rooms/:id/buy` · `POST /rooms/:id/settle`
- `GET /rooms/:id` — state, seed commitment, action log
- `GET /ledger` — settlements with `prevHash`, `potCommitment`, `payoutsHash`, `jobId`, zkVerify tx, block, seed
- `GET /health`
- Web client: the board, the turn loop, and a **Verify** button that re-runs the game from the revealed seed in
  the browser and diffs the result against the ledger's payout vector.

## 8. 25-hour plan

| Window (UTC) | Work |
|---|---|
| H0–2 | Scaffold; deterministic engine + committed-seed dice + unit tests |
| H2–6 | `settle.circom`, compile, ptau, vkey, `register-vk` on Kurier |
| H6–10 | Agent: prover, Kurier submit/poll, Arc transfer, idempotency, restart safety |
| H10–13 | Web client (board, turn loop, verify button) + ledger page |
| H13–15 | Deploy; one full game with two real wallets; one finalized reference end to end |
| H15–18 | README, 3-minute video, public thread |
| H18–20 | Wildcard form + Creator Track entry |
| H20–25 | Buffer — expect the circuit to eat it |

## 9. Risks, with the fallback for each

| Risk | Likelihood | Fallback |
|---|---|---|
| circom toolchain / ptau friction in the sandbox | Medium | Prove a reduced statement (conservation + nonce only) — still a real zkVerify proof |
| Arc faucet or RPC unusable | Medium | Costs only the optional mirror (§6.1). The product, the proof and the anchor are unaffected — this is why the economy is credit-based |
| Kurier key / rate limits | Low | Queue settlements; ledger shows `PENDING_VERIFICATION` honestly |
| Proving too slow for the UI | Low | Prove server-side, stream status to the client |
| Host under-provisioned | Low | A ~5k-constraint Groth16 proof needs ~200–300 MB and 1–3 s in Node, so a 1 GB container is enough — no GPU, no large instance |
| Board UI eats the schedule | High | Ship the turn loop as a functional table view first; polish only if H13 is met |

## 10. Division of labour

The build is mine. These cannot be delegated and are on the critical path:

1. Register at `/register` (X or wallet), connect GitHub and the prize wallet.
2. Create the Kurier API key.
3. Nothing for the economy — credits need no wallet, no faucet and no funding. A funded Arc wallet is needed
   only for the optional mirror in §6.1.
4. A host for the public endpoint and the prover.
5. Record the 3-minute video and post the public thread.

## 11. What is submitted where

- **Wildcard** — primary. This product, judged on usefulness, working implementation, explanation, verifiability.
- **Creator Track** — same build, documented publicly. Separate 100,000 VFY pool.
- **Proof Gatekeeper / Steal the VFY** — not entered. See §1.3 of `AGENT-GAMES-FEASIBILITY.md`: entry is open,
  the podium is arithmetically out of reach, and the build they require is not the build this product needs.
