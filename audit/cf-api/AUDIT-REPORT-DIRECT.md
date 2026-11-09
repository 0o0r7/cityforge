# Direct Cloudflare API Audit Report — cityforge-edge
**Executed:** 2026-11-09 (UTC ~20:06–20:20, re-acquired ~20:45–20:55 after a sandbox reset) · **Method:** Bearer token in env, GET-only + public game-API functional test · **Supersedes:** the earlier Cloudflare agent report (Chalk Tangelo account), which was incomplete/based on the wrong account.

## 0. Executive summary
1. Token `d3bac7fb…` now sees **two accounts**: `0o0r7.web3@gmail.com's Account` (id `98d8795e246386dd8cfe24e22b128426`, subdomain **`0o0r7-web3`**) and `Chalk Tangelo` (`780b9303…`). The earlier agent report only saw the second account and correctly reported "cityforge-edge is not there"; the audit against the correct account is now **complete**.
2. **The backend is alive.** The case file's earlier conclusion ("all /api/* → 1101, backend dead") is **refuted**: the 1101 error reproduces only with a POST lacking a valid JSON body (`await request.json()` without try/catch). The entire gameplay loop (session → room → state → roll → buy → endTurn + AI turn) passed via live curl.
3. **The real root cause of the broken UX:** CORS hardcoded to the dead Manus origin (`https://cityforge-2z7rzsms.manus.space`) — the deployed frontend on workers.dev cannot call its own API from the browser, and the WebSocket gets 403.
4. The worker has been **frozen since 2026-08-22T20:19:48Z**; architecture: Worker + ASSETS + 2 Durable Objects (SQLite) + 2 secrets. No KV/D1/R2/Queues/Cron (R2 is not even enabled on the account — code 10042).

## 1. Results of the 16 GET steps
| # | Endpoint | Status | Note |
|---|---|---|---|
| 01 | /user/tokens/verify | ✅ 200 | active until 2026-11-17 |
| 02 | /accounts | ✅ 200 | two accounts (above) |
| 03 | subdomain | ✅ 200 | `0o0r7-web3` |
| 04 | workers/services | ✅ 200 | cityforge-edge + my-vless-proxy |
| 05 | settings | ✅ 200 | full bindings (section 2) |
| 06 | deployments | ✅ 200 | 9 deployments, all on 2026-08-22 |
| 07 | versions | ✅ 200 | 9 versions (v1–v9) |
| 08 | schedules | ✅ 200 | empty (no cron) |
| 09 | subinfo | ✅ 200 | **full worker source** (multipart worker.js, 828 lines) |
| 10 | KV namespaces | ❌ 401 | token scope (doctrine: no retry) |
| 11 | R2 buckets | ❌ 403 10042 | "Enable R2 through the Dashboard" → R2 is **disabled on the account** (structural, not just scope) |
| 12 | D1 database | ❌ 401 | token scope |
| 13 | DO namespaces | ✅ 200 | two SQLite namespaces |
| 14 | queues | ✅ 200 | empty |
| 15 | zones | ✅ 200 | three eu.cc zones |
| 16 | audit_logs | ❌ 403 | token scope |

Raw evidence: this folder, `01…16.json` + `cityforge-edge-worker-source.js`. Two independent runs (20:12 and 20:45 UTC) produced byte-identical sizes → confirms deployment stability and audit reproducibility.

## 2. Worker configuration — cityforge-edge
- **ID/tag:** script_tag `313fb7d4b34f4540a8256bf74ebeef0a` · created 2026-08-22T19:44:10Z · modified 2026-08-22T20:19:48Z
- **compatibility_date:** 2026-08-20 · **usage_model:** standard · default placement
- **has_assets: true** (the frontend is served by the worker itself) · **has_modules: true** · last_deployed_from: wrangler · migration_tag: v2
- **Bindings:** `CITYFORGE_QUOTA` → DO `CityforgeQuota` (`86b83ed9c2b543c7ae9634469d3cde76`) · `CITYFORGE_ROOMS` → DO `CityforgeRoom` (`eee6c991e4bf4cf5999ca6831b7347df`) · secrets: `PROFILE_BRIDGE_SECRET`, `SESSION_SECRET` (values redacted)
- **DO namespaces:** both `use_sqlite: true`
- **Cron/Queues:** none

## 3. Deployment timeline (all 2026-08-22 UTC)
| Time | Event |
|---|---|
| 19:44:10 | Service created, v1 (`upload`) |
| 19:44:20 → 19:48:49 | v2 and v3 (`secret` — the two secrets set) |
| 19:48–19:55 | v4–v6 (`version_upload`) |
| 19:55:33 → 20:13:17 | v7–v8 + deployments |
| 20:16:40 / 20:19:44 | Final two deployments (v9 `upload`) |
| 20:19:48 | Last modification — **frozen from this moment** |

Author of all: `0o0r7.web3@gmail.com` via wrangler.

## 4. Architecture from the source (828 lines)
- **Server-authoritative GameEngine** inside a DO: 20 named districts, 2–4 players, 520 starting credits, phases roll→resolve→(trade)→end; winner: last active player or highest score after round 18.
- **Secure dice:** `secureRandomInt` with rejection sampling over `crypto.getRandomValues` — not the classic `Math.random % n` shortcut; `Math.random` is never used server-side.
- **Four AI personalities** (Mira Vale/Cautious, Rowan Flint/Aggressive, Sage Flores/Opportunist, Toma Reed/Balanced) with deterministic buy/upgrade/trade thresholds.
- **Sessions:** custom base64url + HMAC-SHA256 token, `cityforge_session` cookie (HttpOnly, Secure, SameSite=None, 30 days), constant-time signature comparison.
- **Quota:** DO `CityforgeQuota` — 4 rooms per player per 60-second window.
- **Profile/NFT flow:** `/api/session` with a `profileTicket` (HMAC with PROFILE_BRIDGE_SECRET) → `profile-binding` in the DO → after a win, `/eligibility` issues a 10-minute `edge-winner` ticket → consumed by the Manus backend (which is deleted).

## 5. Findings F-EDGE
| Code | Severity | Finding |
|---|---|---|
| F-EDGE-1 | 🔴 Critical (for UX) | CORS hardcoded to the dead Manus origin only (`cityforge-2z7rzsms.manus.space`); the workers.dev frontend gets responses without ACAO → "reconnect" banner. WebSocket `/connect` returns 403 for any other origin. |
| F-EDGE-2 | 🟠 High | **Corrects an earlier case-file claim:** "dead backend/1101 everywhere" was wrong; 1101 reproduces only with an empty/invalid JSON body (`request.json()` without try/catch in 4 endpoints). The backend is fully functional. |
| F-EDGE-3 | 🟠 High | The profile-binding and winnerTicket flow depends on the deleted Manus backend → the NFT claim is out of reach (re-confirms the related F-CF entry). |
| F-EDGE-4 | 🟡 Medium | No origin/CSRF protection on the HTTP API + SameSite=None cookie: a third-party site with the victim's cookie could submit actions (in practice requires knowing the 64-hex roomId; low but real risk). |
| F-EDGE-5 | 🟡 Medium | Room DOs are stored without cleanup/TTL/alarms; `save()` adds one `event:<n>` key per turn → gradual DO storage leak. |
| F-EDGE-6 | 🟡 Medium | No HMAC key separation: `PROFILE_BRIDGE_SECRET` signs both profileTicket and winnerTicket (key shared across two purposes). |
| F-EDGE-7 | 🟡 Medium | observability/logpush is off for cityforge-edge (unlike my-vless-proxy) → blind debugging; 1101 errors are logged nowhere. |
| F-EDGE-8 | 🟢 Low | `/api/session` has no quota (only room creation is quotaed) → session spam is possible. |
| F-EDGE-9 | 🟢 Low | Secondary 1101 path: `load()` in the DO throws for a nonexistent roomId (no clean 404). |
| F-EDGE-10 | 🟢 Positive | Security roles correctly implemented: crypto-secure dice, HMAC signature + constant-time comparison, HttpOnly/Secure cookie, DO quota, internal bridge authentication with a secret. |
| F-EDGE-11 | 🟢 Structural | Account: R2 disabled (10042); no custom zone for the game (3 unrelated eu.cc zones); the second worker (my-vless-proxy) is personal and unrelated. |
| F-EDGE-12 | 🟢 Stability | Frozen since 2026-08-22 — ~2.5 months without a deployment; consistent with the Manus project death (F-CF13/14). |
| F-EDGE-13 | 🟢 Observation | The path `/__manus___debug-collector.js` (still serving 25,168 B at ~17:24 UTC on 2026-11-09) now returns a **deterministic 1101** (500 text/plain, reproducible across repeated attempts with different UAs and query strings); all other assets serve fine → an ASSETS routing edge case for this specific file. No copy exists in this repository — recovery requires an external cache/archive if it matters. |

## 6. Live functional test (the product's public API — no configuration changes)
| Step | Result |
|---|---|
| POST /api/session | 201 + valid cookie |
| POST /api/rooms {aiCount:1} | 201 — room with Mira Vale, 20 districts |
| GET /api/room/:id/state | 200 |
| POST action roll | 200 — lastDice=4 |
| POST action buy | 200 — 520−180=340 ✓ (district-5 cost exact) |
| POST action endTurn | 200 — AI played, round 2 |
| POST with empty body / broken JSON | **500 + error code: 1101** (mystery reproduced) |
| GET state without a session | clean 401 |

## 7. Limitations and doctrine
- KV/D1/audit-logs scopes were not on the token → abandoned without retry per doctrine; R2 would have failed regardless of scope (disabled at the account level).
- Secret values are redacted by CF and never appeared in any output.
- No write requests (PUT/POST to the CF management API) were issued; the POST tests hit only the product's own public API (equivalent to player behavior).
- **The token can be rotated after this report.** All evidence is stored in this folder.
