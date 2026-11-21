# Forge Fair — paste-ready submission form

> Fill-in values for the zkVerify Agent Games forms. Everything here is taken from the running build and
> verified against the live deployment; no field claims a ledger or a hash chain, because neither exists.
> Deadline: **2026-11-21 22:00 UTC**.
>
> **Credentials stay with the account owner.** A session cookie or login token is full account access and must
> never be pasted into chat, a repository file or a secret store. Sign in yourself and paste the values below.

---

## 1. Wildcard form

| Field | Value |
| --- | --- |
| Agent link | `https://github.com/0o0r7/cityforge` |
| Public HTTPS endpoint | `https://forge-fair-eda0e7.azurewebsites.net` |
| One-liner | The agent runs the money in a game and proves, on zkVerify, that the pot reached the true winner with no hidden rake. |

### Use case — problem, who it helps, what it does

**Problem.** In any on-chain game or betting surface the operator is the adversary: it holds the dice, the
balances and the payout code, and the player has no way to check that the pot reached the winner it claims.
Publishing the seed or the strategy is not an option, and asking the player to trust an audit is not
verification.

**Who it helps.** Players who need to verify a payout without trusting the server, and operators who need to
prove they did not cheat without disclosing their seed or strategy. The same shape applies to raffles, prize
draws and tournament payouts.

**What it does.** Forge Fair is a playable 2–4 seat board game with a closed credit economy:

1. A seed is committed when the room opens and stays server-side until settlement, so a roll cannot be
   re-rolled after the board is visible.
2. The finished match is replayed from the revealed seed, and the replay must reproduce the exact final state
   and payout vector.
3. The payout vector is proved with Groth16 over `settle.circom` (3,312 constraints): payouts sum to the pot,
   no payout exceeds the cap, the paid seat is the true leader of the committed balances, and the settlement
   nonce is single-use.
4. The server verifies that proof locally before the settlement response leaves the process.
5. The proof is submitted to zkVerify mainnet through Kurier and polled until **Finalized**; the settlement
   card holds the payout until that point, then publishes the amounts with the verification tx.

### Build context — how it works, key decisions

- **No build step.** A static ES-module front end plus a Node HTTP server; the whole game, the API and the
  proof path are readable source.
- **Two layers on purpose.** Layer 1 (deterministic replay from the revealed seed) proves the rules were
  followed. Layer 2 (`settle.circom`) proves the money moved as committed. The split is stated on the proof
  page rather than blurred into one "fully verified" claim.
- **Closed credits, not a token.** Every seat starts equal, credits only move between players, and nothing is
  minted or burned. No wallet, faucet or gas is needed to play, so the verifiable path can never be blocked by
  a testnet.
- **Anchor before payout.** A submitted job is not a verified one: the payout is withheld until the attestation
  is `Finalized`.
- **Pre-warmed verification key.** The key is registered in the background at startup so the first settlement
  does not pay the on-chain registration latency.

### zkVerify claim + proof reference

Groth16 proof submitted through **Kurier on zkVerify mainnet**, reached **Finalized**:

| | |
| --- | --- |
| jobId | `98c68b29-e58c-11f1-838e-1e6a0d14f999` |
| tx hash | `0x88c223d2a292fe3f45ba71529b7c3c62a6232a355020566a5c20674060459277` |
| block hash | `0x2c587a36742890c8f3923f046a7f6e1526c723e107034d0f458dcdf9abaa9255` |
| network | mainnet |
| finalized at | `2026-11-21T09:19:25Z` |

Re-check it yourself: `GET https://forge-fair-eda0e7.azurewebsites.net/api/rooms/<roomId>/attestation` returns
the same job and tx while the room is alive; the settlement card renders the job id and tx hash.

### Honest limits — state these on the form

- **No cross-match ledger and no hash chain.** Each settlement publishes its own finalized reference; there is
  no public index of past settlements.
- **Hotseat only.** The API is room-based, but there is no transport for remote seats yet.
- **Rooms live in memory** for two hours; a redeploy ends a match in progress.
- **zkVerify anchoring is optional.** Without `KURIER_API_KEY` the proof is still verified locally and reports
  itself unattested — never as anchored.
- **The circuit is not a full zero-knowledge replay of the board.** It proves conservation, the cap, the true
  winner and single-use; the rules themselves are checked by the deterministic replay.
- **Credits are a closed score.** Not a token, not redeemable, not transferable outside a game.

### Demo path (three steps, ~90 seconds)

1. Open `https://forge-fair-eda0e7.azurewebsites.net/#/watch` and press **Run a bot match**.
2. Set **4×** and let the 83-frame match finish.
3. Press **Verify this match**: the payout shows as **held**, then the proof row flips to
   **FINALIZED ON ZKVERIFY** with the tx hash and the amounts are published.

---

## 2. Creator Track

Same build, plus a public write-up from the entrant's own account with `#AgentGames` and a mention of
`@ZKVProtocol`. Suggested outline:

- The problem: the operator is the adversary in on-chain games.
- The two-layer proof and why the split is honest.
- One finalized mainnet reference (the table in §1).
- What is deliberately not built (the honest limits above).

---

## 3. What only the account owner can do

- Register at the Agent Games `/register` page (X account or wallet) and connect GitHub.
- Connect the prize wallet.
- Create the Kurier API key and place it in the app's secret store.
- Submit the Wildcard form and post the Creator Track write-up.
