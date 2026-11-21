# Feasibility: entering zkVerify Agent Games with this repository

Research date: **2026-11-20 20:26 UTC** (13:26 America/Phoenix).
Hard deadline for all entries: **2026-11-21 22:00 UTC** = **2026-11-21 15:00 America/Phoenix**.
Time remaining at research time: **25 h 34 m**.

All facts below were read from the official sources listed at the bottom of this file on the research date.

## 1. What the arena actually is

Agent Games is run by zkVerify (built by Horizen Labs). 400,000 VFY total, **100,000 VFY per track**, split
50 / 30 / 20 across the top three (1st 50,000 · 2nd 30,000 · 3rd 20,000). Entry is free.

| Track | Format | Scored how | Status on 2026-11-20 |
|---|---|---|---|
| Proof Gatekeeper | 8 daily rounds, 8 tasks/day, 60 s deadline per task | Automated, cumulative across rounds | **Effectively over** — rounds 13–20 Nov; round 08 closes 20:30 UTC today |
| Steal the VFY | Swiss 7 rounds → top-16 knockout, 20 turns/match | Automated, head-to-head | **Live, running late** — page prints schedule 13–17 Nov, live block shows R5 of 7 as the current round |
| Wildcard | Build any useful agent, on-chain or off-chain | **Manual panel review**, 23 Nov – 1 Dec | **Open — the only winnable track** |
| Creator Track | Public thread / video / article with receipts | Manual review | **Open** — second pool, same build can be documented |

Judgement window 23 Nov – 1 Dec 2026; winners announced 5 Dec 2026.

### 1.1 Why the two live-scored tracks are out of reach

**Proof Gatekeeper** standings are cumulative. `/api/leaderboard` reports 507 agents, 477 of them entered here,
with 681.9 / 672.4 / 671.3 at the top. A newcomer can only join the 21 Nov make-up window (8 tasks, ceiling
roughly 8 × (+12 + reliability) ≈ 100 points) — far below the top three. Not winnable.

**Steal the VFY — verified 2026-11-20, corrected.** The page still prints "Schedule 13 Nov – 17 Nov 2026", but
the live tournament block on that same page reads **53 agents paired · R5 current round · 61 matches**, and the
leaderboard API reports 67 agents entered, 28 of them scoring above zero. Agent records confirm ongoing play
(`pidz-stealer`: Swiss rounds 4 and 5; `pecker`: rounds 1–5). The rules page allows mid-tournament entry —
"register mid-tournament to join from the next Swiss round, until the final round is paired" — and the
organisers' X account was still posting "Submit now" for this track on **2026-11-18 09:17 UTC**, a day after the
printed schedule end. The platform announcement feed carries no closing notice for it. **So the track is behind
schedule, and registration is not formally closed.**

It is still not a winnable target. Seven Swiss rounds are planned and R5 is current, so a new agent joins at R6
and can play at most two matches. Best case, two wins: 2 × (+18 + reliability ≤ +2) = **40 points**. Current
standings: 1st 73 (`pecker`), 2nd 64 (`VK-SENTINEL`), 3rd 62 (`MP-gatekeeper-01`). Top-16 knockout qualification
and any prize are out of reach, and no announcement promises rounds beyond seven. Entry also demands the most
expensive build in the event — a committed policy circuit plus per-turn Groth16 proofs — for a guaranteed zero.

### 1.2 What Wildcard actually requires
- **Agent link** — a public repository, demo, or write-up showing the agent.
- **Public endpoint** — a public HTTPS endpoint for the agent, as requested in the submission form.
- **Use case** — the problem, who the agent helps, what it does.
- **Build context** — how it works and the key decisions behind it.
- **zkVerify (optional)** — explain the checkable claim and add a proof reference when available.
- **Bonus** — share the build publicly.

Reviewers look for: a useful problem, a working implementation, a clear explanation, verifiability as an
optional plus, and the public share. Agents without zkVerify stay eligible — but "make verification essential"
is the axis the organisers push, and it is the only differentiator a small team can win on.

### 1.3 Submission window vs. prize probability — not the same thing

A fair challenge, and it corrects the wording above: **are these two tracks closed to entry? No.** All tracks
share one deadline (2026-11-21 22:00 UTC) and registration stays open until it; Steal the VFY explicitly allows
mid-tournament entry. "Closed" was imprecise. What is closed is the **gap to the podium**, and it is closed by
arithmetic rather than by a form:

- **Proof Gatekeeper** — standings are cumulative. Top three sit at 681.9 / 672.4 / 671.3; a newcomer's entire
  remaining ceiling is one make-up window of 8 tasks ≈ 100 points. No ordering of correct answers closes a
  570-point gap in one window.
- **Steal the VFY** — seven Swiss rounds planned, R5 current. A new agent enters at R6 and can play at most two
  matches: 2 × (+18 + reliability ≤ +2) = 40 points, against 62 for third place.

The one development that would overturn this: an announcement of *additional* rounds beyond seven. Nothing in
the platform announcement feed promises them; if one appears, re-run the arithmetic before dismissing the track.

Entering is only cheap where the build already exists. For these two it does not — each needs a committed-policy
circuit plus per-turn proofs, and that build buys a ceiling of 40–100 points. The same effort spent on a product
the panel reviews is the better trade.

## 2. Verdict on this repository as it stands

**This repository cannot be submitted as-is.** It is an audit and evidence snapshot, not an application:

- No application source: no `package.json`, no server, no build step. The only code is
  `tools/cf_edge_audit.sh` (a GET-only audit script). The recovered 828-line worker source was reviewed during
  the audit and is held outside this repository.
- The CityForge backend is frozen since 2026-08-22, its CORS is pinned to a deleted Manus origin, and the
  hosting project no longer exists. It cannot be revived as a live demo inside the window.
- The predecessor's minified production bundles and HTML shell were recovered during the audit; they are held
  outside this repository — readable as evidence, not runnable as source.

What the repository *does* contribute is domain knowledge and credibility: server-authoritative Arc Testnet
USDC flows, HMAC-signed session and claim tickets, and a documented set of real payment-authorisation failures
(session takeover via `POST /api/room/<id>/initialize`, state deadlock, 500s leaking paths). That is exactly the
problem class the event rewards — proof-backed payment authorisation — and it is a defensible origin story for a
new agent.

**Conclusion: the entry has to be a new, small, excellent agent built in this window, using this repo's domain
and audit findings as its motivation.** The remaining question is whether that fits in ~25 hours.

## 3. Recommended entry (highest expected value)

One build, two pools: submit it to **Wildcard**, then document the same build for the **Creator Track**
(`#AgentGames`, tag `@ZKVProtocol`). Separate 100,000 VFY pools, one body of work.

**Concept — "Forge Fair": a playable on-chain game whose settlement is provable.** This is CityForge's idea,
rebuilt around the one thing the arena is actually about: nobody has to trust the house. The game keeps the
ARC-Monopoly shape — players take turns, dice decide movement, landing on an owned tile moves USDC, bankruptcy
eliminates a player — but the money loop is executed by a **settlement agent** that cannot cheat silently:

- The dice outcome derives from a committed seed, so a roll cannot be re-rolled after seeing the board.
- Every settlement (rent, payout, elimination, final split) ships with a Groth16 proof of a small invariant set:
  payouts sum exactly to the pot, each payout is within the committed cap, the paid party matches the committed
  winner index, and the settlement nonce is single-use.
- The proof is verified on **zkVerify mainnet through Kurier** and must reach `Finalized` before the transfer is
  signed on Arc Testnet (chainId 5042002, USDC as native gas).
- A public ledger page lists every settlement with its finalized verification reference, so a player can check
  the house took no hidden rake — without the agent revealing its seed or strategy.

The repo's audit supplies the threat model, not decoration: session takeover on room initialisation, the
bankruptcy deadlock that freezes a 3–4 player game, and the dead HMAC winner-ticket flow are exactly the failures
this design removes by making settlement verifiable instead of trusted.

Scope discipline — what "real product" means here, and what does not fit in 24 h: the board is compact (not 40
tiles with mortgages and trading), but the loop is complete and runs end to end with real testnet USDC, real
proofs and real finalized references. No mockups, no recorded fixtures standing in for a live path. A full
Monopoly clone in this window would end as a mockup, which is the one outcome to avoid.

Fallback if the custom circuit overruns: reuse the published, mainnet-registered `gatekeeper` circuit
(`vk_hash 0x6b79c6…77b0`) so the proof path stays real while the custom circuit is finished.

### 3.1 Hour-by-hour (25 h budget, ~20 h of work)
| Block | Work | Owner |
|---|---|---|
| H0–1 | Register at `/register` (X or wallet), connect GitHub + prize wallet, create Kurier API key, choose host | User |
| H1–2 | Repo scaffold; game engine (committed-seed dice, compact board, elimination) | Build |
| H2–6 | `settle.circom` invariants, compile, vkey, `register-vk` on Kurier | Build |
| H6–10 | Settlement agent: prover, Kurier submit/poll to `Finalized`, Arc USDC transfer, idempotency | Build |
| H10–13 | Deploy endpoint + playable web client + public ledger page | Build + user credentials |
| H13–15 | End-to-end run: two real wallets, one full game, one finalized reference on the ledger | Build |
| H15–18 | README, 3-minute video, public thread | Build |
| H18–20 | Wildcard submission form + Creator Track entry | User |
| H20–25 | Buffer, retries, judge-facing polish | — |

### 3.2 Hard dependencies and risks
1. **Public HTTPS hosting.** The endpoint must be live and stable through judging (23 Nov – 1 Dec). A sandbox
   preview is not suitable: its host rotates and it is a development environment. A real deploy target and its
   credentials are required. Note: Groth16 proving with snarkjs is memory- and CPU-hungry, so a small container
   host is the safer target for the prover; an edge runtime such as Cloudflare Workers fits only the HTTP edge.
2. **Identity steps are the user's alone.** Account creation, GitHub connection, prize wallet, and the
   submission form cannot be delegated.
3. **Kurier API key** — email sign-up, free; needed before any proof can be finalized on mainnet.
4. **Circuit input layout.** The published circuits' public-signal ordering is not fully documented; a
   purpose-built circuit avoids reverse-engineering the `.wasm` under time pressure.
5. **Manual review, no live scoring.** Quality of the write-up and the demo carries the entry. A working
   implementation with a thin explanation loses to a slightly smaller build with a sharp one.

## 4. Sources consulted (2026-11-20)
- https://agentgames.zkverify.io/ — timeline, prize pool, stats
- https://agentgames.zkverify.io/events — track overview
- https://agentgames.zkverify.io/events/proof-gatekeeper — round schedule, trap taxonomy, score model
- https://agentgames.zkverify.io/events/steal-the-vfy — schedule, protocol, score model
- https://agentgames.zkverify.io/events/wildcard — submission requirements, judging criteria
- https://agentgames.zkverify.io/events/creator-track — formats, eligibility hashtags
- https://agentgames.zkverify.io/build — agent contract, HMAC/preflight, circuits, Kurier, security checklist
- https://agentgames.zkverify.io/rules — participation, HMAC secret, uptime, one-agent-one-owner
- https://agentgames.zkverify.io/guide — registration flow
- https://agentgames.zkverify.io/leaderboard — 507 agents, top scores
- https://agentgames.zkverify.io/api/circuit-info — vk hashes and artifact URLs
- https://agentgames.zkverify.io/api/leaderboard — per-track scores and event membership (2026-11-20)
- https://agentgames.zkverify.io/api/notifications — platform announcement feed, 6 items (2026-11-20)
- https://agentgames.zkverify.io/agents/&lt;id&gt; — per-agent round and match records
- https://docs.zkverify.io/ — supported proof systems, Kurier guide, quickstart
- https://x.com/ZKVProtocol — organisers' channel
- github.com/zkVerify — `zkverifyjs`, `zkverifyjs-starter-template`, `zkverify-evm-dapp-example`, `awesome-zkVerify`
