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
| Steal the VFY | Swiss 7 rounds → top-16 knockout, 20 turns/match | Automated, head-to-head | **Over** — schedule 13–17 Nov |
| Wildcard | Build any useful agent, on-chain or off-chain | **Manual panel review**, 23 Nov – 1 Dec | **Open — the only winnable track** |
| Creator Track | Public thread / video / article with receipts | Manual review | **Open** — second pool, same build can be documented |

Judgement window 23 Nov – 1 Dec 2026; winners announced 5 Dec 2026.

### 1.1 Why the two live-scored tracks are out of reach
Proof Gatekeeper standings are cumulative. The public leaderboard shows 507 agents entered, with the leader at
676.9 points. A newcomer can only join the 21 Nov compensatory round (8 tasks), whose ceiling is roughly
8 × (+12 + reliability) ≈ 100 points — far below the current top three (676.9 / 667.4 / 666.3). Steal the VFY
finished its Swiss stage and knockout bracket before today. Neither can be won from here.

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

## 2. Verdict on this repository as it stands

**This repository cannot be submitted as-is.** It is an audit and evidence snapshot, not an application:

- No application source: no `package.json`, no server, no build step. The only code is
  `audit/cf-api/cityforge-edge-worker-source.js` (recovered evidence, 828 lines) and
  `tools/cf_edge_audit.sh` (a GET-only audit script).
- The CityForge backend is frozen since 2026-08-22, its CORS is pinned to a deleted Manus origin, and the
  hosting project no longer exists. It cannot be revived as a live demo inside the window.
- `artifacts/` holds minified production bundles and an HTML shell — readable as evidence, not runnable as source.

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

**Concept — proof-gated payment agent for stablecoin rails.** An agent is asked to move USDC (the repo's own
domain: Arc Testnet, chainId 5042002, USDC as native gas). Before it authorises anything it requires a Groth16
proof that the payment satisfies a committed policy — recipient allowlist membership, per-transfer cap, budget,
expiry block, single-use nonce — verifies that proof through **Kurier** until it reaches `Finalized`, and only
then acts. Every decision is recorded with its finalized verification reference, so a third party can check why
the agent paid without seeing the policy internals. This mirrors the trap taxonomy the arena itself uses
(VK substitution, threshold mismatch, proof reuse, expiry, recipient mismatch, amount overflow) and turns the
repo's audit findings into the threat model.

Fallback if the custom circuit overruns: reuse the published, mainnet-registered `gatekeeper` circuit
(`vk_hash 0x6b79c6…77b0`) so the proof path stays real while the custom circuit is finished.

### 3.1 Hour-by-hour (25 h budget, ~20 h of work)
| Block | Work | Owner |
|---|---|---|
| H0–1 | Register at `/register` (X or wallet), connect GitHub + prize wallet, create Kurier API key | User |
| H1–3 | Repo scaffold, `policy.circom`, compile, vkey, `register-vk` on Kurier | Build |
| H3–8 | Agent service: policy engine, proof generation, Kurier submit + poll, signed responses, tests | Build |
| H8–11 | Deploy public HTTPS endpoint, health check, one end-to-end finalized proof | Build + user credentials |
| H11–15 | Demo UI (request → APPROVE/REJECT with reason + proof + finalized reference) | Build |
| H15–18 | README, 3-minute video, public thread | Build |
| H18–20 | Wildcard submission form + Creator Track entry | User |
| H20–25 | Buffer, retries, judge-facing polish | — |

### 3.2 Hard dependencies and risks
1. **Public HTTPS hosting.** The endpoint must be live and stable through judging (23 Nov – 1 Dec). A sandbox
   preview is not suitable: its host rotates and it is a development environment. A real deploy target and its
   credentials are required (Cloudflare Workers matches the account already evidenced in this audit, or any
   PaaS).
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
- https://docs.zkverify.io/ — supported proof systems, Kurier guide, quickstart
- https://x.com/ZKVProtocol — organisers' channel
- github.com/zkVerify — `zkverifyjs`, `zkverifyjs-starter-template`, `zkverify-evm-dapp-example`, `awesome-zkVerify`
