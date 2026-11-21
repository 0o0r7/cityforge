# Historical Case File: ARC-Monopoly → CityForge
**Version 5 (English edition, after the fourth sandbox reset, 2026-11-09) · Type: read-only technical validation audit · Hard constraint: no code/commit/push/merge changes to the audited project · This repository = backup of evidence and documentation, not project code**

## Section A — Documented timeline (from API data and public evidence)
| Time (UTC) | Event | Source |
|---|---|---|
| 2026-05-18 | Creation of the CF account `Account owner` (`98d8795e…`) and zone `kinetivent.eu.cc` | `cf-api/02_accounts.json`, `cf-api/15_zones.json` |
| 2026-08-01 | Deployment of the personal worker `my-vless-proxy` (quick_editor, active through 08-02) + zone `404stranger.eu.cc` | `cf-api/04_services.json`, `cf-api/15_zones.json` |
| 2026-08-12 | Zone `quantixlabs.eu.cc` | `cf-api/15_zones.json` |
| 2026-08-22 19:44–20:19 | Full deployment of `cityforge-edge`: 9 versions (v1 upload → v2,v3 secret → v4–v8 version_upload → v9 upload+deploy) via wrangler; migration_tag v2 (DO SQLite); `SESSION_SECRET` and `PROFILE_BRIDGE_SECRET` set | `cf-api/06_deployments.json`, `cf-api/07_versions.json` |
| 2026-08-22 20:19:48 | Last worker modification — **project frozen** | `cf-api/04_services.json` |
| ~before 2026-11-08 | Deletion of the hosting Manus project (`cityforge-2z7rzsms.manus.space`) — manus.im response: "Permission denied — [not_found] project not found" | screenshot cf-05 (lost in a sandbox reset; reproducible with a manus.im login) |
| 2026-11-09 11:11:40 | Creation of the CF account "Chalk Tangelo" (`780b9303…`) — origin of the account trap | `cf-api/02_accounts.json` |
| 2026-11-09 ~17:24 | Public deep-dive: artifact refetch with byte-identical sizes → deployment stability (F-CF14); `__manus___debug-collector.js` still served (25,168 B) | artifacts README (held outside this repository) |
| 2026-11-09/10 ~20:06–20:55 | Public audit → agent audit (wrong account) → **two complete direct token-based audit runs** | `cf-api/AUDIT-REPORT-DIRECT.md` |

## Section B — Public deep-dive of CityForge (findings F-CF)
*Target: `https://cityforge-edge.0o0r7-web3.workers.dev/` — all from public access, without a token.*

- **F-CF1** Manus-scaffolded app: Vite + React 19.2.1 + Tailwind + shadcn/ui + TanStack Query + tRPC + superjson + socket.io + viem/ox/abitype.
- **F-CF2** Healthy static shell: `root.html` 368,243 B · `index-P14T8RX6.js` 793,128 B · `index-Pjaa9_yt.css` 134,224 B · `ArcOwnerControl-6aTkiLY4.js` 180,011 B · `__manus___debug-collector.js` 25,168 B (the last item is no longer served as of 2026-11-09 ~20:45 due to F-EDGE-13 — no copy exists in this repository; only size/hash are recorded in text).
- **F-CF3** The complete Manus Previewer runtime (~367 KB) is inlined in the HTML — evidence of Manus-side scaffold and build.
- **F-CF4** Leaked source path: `/home/ubuntu/cityforge-arc-game/client/src/...` in source maps/comments.
- **F-CF5** Owner-only page `ArcOwnerControl.tsx` in the bundle (owner controls, no link from the UI) — its bundle was recovered during the audit and is held outside this repository.
- **F-CF6** UI banner: "The live city connection needs to reconnect" on the match page (`/match/<64-hex>`, ~296 KB) — root cause later documented as F-EDGE-1.
- **F-CF7** ~~Earlier claim: "dead backend (1101 everywhere)"~~ — **refuted by the direct audit; see F-EDGE-2.** (Retained in the file for methodological transparency.)
- **F-CF8** The Manus project is deleted (`[not_found] project not found`) → the backend's hardcoded origin has no owner.
- **F-CF9** ARC Testnet is live: chainId `0x4cef52` (5042002) ✓ matches the bundle, block 71,561,447, gas 25 gwei, RPC `rpc.testnet.arc.network`, explorer `testnet.arcscan.app`.
- **F-CF10** Canonical multicall3 `0xcA11bde05977b3631167028862bE2a173976CA11` is the only contract in the bundle.
- **F-CF11** The city-mark contract address appears in no bundle — it came from the backend → NFT claim flow unreachable (full mechanism documented in F-EDGE-3).
- **F-CF12** Three small embedded ERC-20 bytecodes (798 / 1,410 / 11,188 hex chars) — visible in the recovered main bundle `index-P14T8RX6.js` (held outside this repository).
- **F-CF13** Account trap: the initial token only saw the freshly created "Chalk Tangelo" account, which does not host cityforge-edge (404 code 10007) — the agent report saw only that account too.
- **F-CF14** Artifact refetch with byte-identical sizes → stable/unchanged deployment (third confirmation: second audit run, 2026-11-09 ~20:45).

## Section C — Cloudflare API audit (completing the agent report)
Agent report (Chalk Tangelo account only): subdomain `chalk-tangelo-780`, cityforge-edge absent there (404/10007 on settings/deployments/versions). That report was correct on its own terms but **incomplete**: it could not see the hosting account.
**Direct completion (2026-11-09, two runs):** the token also sees the correct account; the 16-step audit was completed in full → report + evidence: `cf-api/AUDIT-REPORT-DIRECT.md` and `cf-api/*.json`.

## Section D — Direct token-based audit: findings F-EDGE
**The case file's decisive results:**
1. **The backend is alive** — the full gameplay loop passed via curl (session 201 → room 201 → state → roll(4) → buy(520−180=340 ✓) → endTurn + AI turn → round 2). Server-authoritative engine, crypto-secure dice (rejection sampling), four AI personalities, 4-rooms/minute quota via a DO.
2. **Root cause of the broken UX = hardcoded CORS** to the dead Manus origin (`cityforge-2z7rzsms.manus.space`); the workers.dev frontend cannot call its own API from the browser, and the WebSocket gets 403 → the F-CF6 banner.
3. **The 1101 mystery solved:** 1101 reproduces only with an empty/invalid JSON body (`request.json()` without try/catch in 4 endpoints) → it was an artifact of our earlier test method, not backend death.
4. **The NFT/Monopoly-claim flow** (`profile-binding` → `winnerTicket` signed with HMAC, 10-minute expiry) depends on the deleted Manus backend → dead.
5. Additional findings F-EDGE-4 through F-EDGE-13 (CSRF/SameSite=None, DO storage leak, shared HMAC key, observability off, frozen since 2026-08-22, R2 disabled on the account, deterministic 1101 on the debug-collector path…) → full table in `cf-api/AUDIT-REPORT-DIRECT.md`.

**Valuable backup output:** the complete worker source (828 lines) was recovered via the `subinfo` API — the only known copy of the backend after the Manus project deletion. It is held outside this repository and is not redistributed here.

## Open items
1. Gameplay-experience choice for the 40-game catalog (A = all 40 / B⭐ = 15 partial + 10 page_only / C = proceed to the Word report).
2. Claim-to-code validation of `visual-review-en.md` (engine.ts, GameCanvas.tsx, render-v2.ts, Math.random determinism violation).
3. Final Word report (2D/2.5D/3D comparison + feasibility matrix + recommendation).
4. Screenshots cf-01..05 were lost in a sandbox reset — regenerate if needed.
5. `__manus___debug-collector.js` (25,168 B) is no longer served (F-EDGE-13) — recovery only via an external archive.

## Audit doctrines (fixed)
- Read-only against CF configuration; POST only against the product's public API (equivalent to player behavior).
- Token only in the env of the same command; never on disk/in output. After the "rotate now" announcement → the user rotates.
- Scope errors (401/403) → no retry, logged.
- Earlier unevidenced claims → refuted/confirmed by direct testing with the correction recorded explicitly (F-CF7 → F-EDGE-2).
