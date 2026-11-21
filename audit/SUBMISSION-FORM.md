# Forge Fair — paste-ready submission form

> Field-for-field copy for the Agent Games **Submissions → New submission** form.
> Every value below is taken from the running build and was verified against the live deployment.
> Deadline: **2026-11-21 22:00 UTC**.
>
> **Credentials stay with the account owner.** A session cookie or login token is full account access and must
> never be pasted into chat, a repository file or a secret store. Sign in yourself and paste the values below.

---

## Wildcard tab

| Form field | Paste this |
| --- | --- |
| **Project title** * | `Forge Fair — provable settlement for on-chain games` |
| **GitHub repository link** * | `https://github.com/0o0r7/cityforge` |
| **Agent endpoint** (optional) | `https://forge-fair-eda0e7.azurewebsites.net` |
| **Proof reference** (optional) | `0x88c223d2a292fe3f45ba71529b7c3c62a6232a355020566a5c20674060459277` |
| **Additional links** (optional) | see below |

### Additional links

```
https://forge-fair-eda0e7.azurewebsites.net/#/watch
https://forge-fair-eda0e7.azurewebsites.net/#/proof
https://github.com/0o0r7/cityforge/blob/main/audit/FORGE-FAIR-SPEC.md
```

### What it does * (limit 2000)

Forge Fair is a playable 2–4 seat board game whose settlement a player can verify instead of trusting the
house. A seed is committed when the room opens and stays server-side until settlement, so a roll cannot be
re-rolled after the board is visible. When the match ends the server replays it from the revealed seed, and
the replay must reproduce the exact final state and payout vector.

The payout vector is then proved with Groth16 over a 3,312-constraint circuit: payouts sum to the pot, no
payout exceeds the cap, the paid seat is the true leader of the committed balances, and the settlement nonce
is single-use. The server verifies that proof locally before responding, then submits it to zkVerify mainnet
through Kurier and polls until Finalized. The settlement card holds the payout until that point, then
publishes the amounts with the verification tx.

zkVerify is what makes the claim checkable: each match leaves a public, timestamped record that this payout
vector existed and satisfied those constraints before a single credit moved. Credits are a closed zero-sum
score — no wallet, faucet or gas — so the verifiable path cannot be blocked by a testnet.

Honest limits: there is no cross-match ledger or hash chain (each match shows its own finalized reference);
the table is hotseat only; rooms live in memory; and the circuit proves conservation, the cap, the true winner
and single-use, while the rules themselves are checked by deterministic replay.

*(character count: 1,468)*

### Message to judges (limit 1000)

This is a live, working build, not a recorded demo. Play it here:
https://forge-fair-eda0e7.azurewebsites.net/#/watch — press "Run a bot match", set 4×, and when the match ends
press "Verify this match". The payout is withheld, then the proof row flips to FINALIZED ON ZKVERIFY with the
tx hash and the amounts are published.

The proof reference above is a real finalized mainnet settlement through Kurier (jobId
98c68b29-e58c-11f1-838e-1e6a0d14f999, finalized 2026-11-21T09:19:25Z). GET
/api/rooms/<roomId>/attestation on the live endpoint re-reads it while the room is alive.

What we deliberately did not build, and say so on the proof page: no cross-match ledger or hash chain, no
remote seats, and no claim that the circuit replays the board — the circuit proves the money moved as
committed, and the deterministic replay proves the rules were followed.

*(character count: 859)*

---

## Creator Track tab

Same build. Use the same title, repository link and endpoint, plus a public write-up from your own account
with `#AgentGames` and a mention of `@ZKVProtocol`. Suggested outline:

- The problem: in on-chain games the operator is the adversary.
- The two-layer proof (deterministic replay + `settle.circom`) and why the split is honest.
- The finalized mainnet reference above.
- What is deliberately not built.

---

## Proof reference — full record

| | |
| --- | --- |
| jobId | `98c68b29-e58c-11f1-838e-1e6a0d14f999` |
| tx hash | `0x88c223d2a292fe3f45ba71529b7c3c62a6232a355020566a5c20674060459277` |
| block hash | `0x2c587a36742890c8f3923f046a7f6e1526c723e107034d0f458dcdf9abaa9255` |
| network | zkVerify mainnet (Kurier) |
| status | Finalized |
| finalized at | `2026-11-21T09:19:25Z` |

The settlement card on the live deployment renders the same job id and tx hash.

---

## What only the account owner can do

- Register at the Agent Games `/register` page (X account or wallet) and connect GitHub.
- Connect the prize wallet.
- Create the Kurier API key and place it in the app's secret store.
- Submit the Wildcard form and post the Creator Track write-up.
