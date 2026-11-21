# Submission checklist — Forge Fair / zkVerify Agent Games

Single source of truth for the submission. If a task is not on this list, it does not get built.
Deadline: **2026-11-21 22:00 UTC**. Judging: 23 Nov – 1 Dec. Winners: 5 Dec.

---

## A. Entry mechanics (yours — nobody else can do these)

- [ ] Register at the Agent Games `/register` page (X account or wallet)
- [ ] Connect GitHub account
- [ ] Connect the prize wallet
- [ ] Create the **Kurier API key** and put it in Secrets
- [ ] Provide the three Azure values (see `docs/AZURE-SETUP.md`)
- [ ] Submit the **Wildcard** form before the deadline
- [ ] Submit the **Creator Track** entry (same build, public write-up, `#AgentGames` + tag `@ZKVProtocol`)

## B. What the Wildcard form asks for — and where it comes from

| Field | Source |
|---|---|
| Agent link (public repo / demo / write-up) | this repository |
| Public HTTPS endpoint | the Azure deployment |
| Use case — problem, who it helps, what it does | §1 of `audit/FORGE-FAIR-SPEC.md` |
| Build context — how it works, key decisions | §4–§6 of the spec |
| zkVerify claim + proof reference | the ledger page, one finalized settlement |
| Public share (bonus) | the thread |

## C. zkVerify technical requirements

- [ ] Kurier API key present and working
- [ ] Circuit compiled; vkey generated
- [ ] vkey registered via `register-vk` (required for a custom circuit)
- [ ] Proof submitted through Kurier and polled until **`Finalized`**
- [ ] `jobId`, verification tx hash and block captured and stored with the settlement
- [ ] The settlement card on the public deployment renders that reference (job id + tx hash)
- [ ] Re-verification path exists: a stranger can check the reference independently

## D. Product invariants (must hold at every commit)

- [ ] **Conservation:** `Σ balances + pot == players × START_BALANCE` after every action
- [ ] **Zero-sum credits:** nothing minted, nothing burned
- [ ] **Deterministic replay:** same seed + same actions ⇒ identical state and identical payout vector
- [ ] **Seed secrecy:** the seed never leaves the server before settlement; only its commitment is public
- [x] **Anchor before payout:** the settlement card holds the payout (`held`) until the attestation is
      `Finalized`, then publishes the amounts. Credits are a closed score with no chain transfer, so this
      is a publication rule, not a token transfer.
- [ ] **Hash chain:** *not implemented* — do not claim it. There is no cross-match ledger; each match
      shows its own finalized reference.
- [ ] **Idempotency:** one settlement per nonce; the ledger row is the lock, not process memory
- [ ] **Honest labels:** the circuit proves conservation, cap, true winner and single-use — *not* a full
      zero-knowledge replay of the board. Say so wherever the claim appears.

## E. Anti-drift rules (the "no debugging at the end" promise)

- [ ] Health endpoint live from hour 1
- [ ] Deploy to Azure by **H10**, not at the end — a late first deploy is the classic way to lose
- [ ] Circuit fallback pre-decided: if `settle.circom` is not proving by H8, cut to conservation + nonce only
- [ ] **Scope freeze at H13.** After that: no new features, only fixes
- [ ] **Feature freeze at H18.** After that: only submission paperwork
- [ ] Every settlement attempt is written to the ledger, including failures — no silent retries
- [ ] No test data left in the ledger at submission time
- [ ] `docker compose` up locally before every push

## F. Security and hygiene

- [ ] No secrets in the repository; only `/run/base44/app.env` at runtime
- [ ] Public endpoint rate-limited
- [ ] No PII stored; player ids are generated, not emails
- [ ] Failures return a clean error, never a stack trace or a path
- [ ] The audit findings from this repo are referenced as the threat model, not reproduced as bugs

## G. Definition of done

- [ ] One full game played end to end on the public endpoint
- [ ] One settlement with a real `Finalized` reference on the ledger
- [ ] A stranger can replay the game from the revealed seed and get the same payout vector
- [ ] 3-minute video recorded
- [ ] Public thread posted
- [ ] Both forms submitted
