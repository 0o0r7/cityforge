# Verification: Run 1 vs Run 2 — cross-check record

**Prepared:** 2026-11-09/10 · **Purpose:** formal integrity cross-check between the two independent executions of the direct Cloudflare API audit, after the workspace sandbox was reset between them.

## Context
| Run | Time (UTC) | What happened |
|---|---|---|
| Run 1 | ~20:06–20:20 (2026-11-09) | Full 16-step GET audit + worker source recovery + live gameplay smoke test. Documents delivered to the user (v3). Sandbox files wiped afterwards by a workspace reset. |
| Run 2 | ~20:45–20:55 (2026-11-09) | Same 16 GET steps re-executed + public artifacts re-fetched. Repository v4 built and pushed to GitHub (commit `aa5fdf2`). |

The Run-1 document copies (v3, as delivered in chat) were later provided back and were compared against the current documents; the comparison is recorded here. The copies themselves are not retained in this repository, which is English-only.

## 1. Raw evidence cross-check (16 JSON files)
| Evidence | Run 1 size (B) | Run 2 size (B) | Match |
|---|---|---|---|
| 01_verify.json | 220 | 220 | ✓ |
| 02_accounts.json | 873 | 873 | ✓ |
| 03_subdomain.json | 105 | 105 | ✓ |
| 04_services.json | 4,964 | 4,964 | ✓ |
| 05_settings.json | 910 | 910 | ✓ |
| 06_deployments.json | 4,568 | 4,568 | ✓ |
| 07_versions.json | 4,104 | 4,104 | ✓ |
| 08_schedules.json | 95 | 95 | ✓ |
| 09_subinfo.json | 37,452 | 37,452 | ✓ |
| 10_kv_namespaces.json | 104 | 104 | ✓ |
| 11_r2_buckets.json | 134 | 134 | ✓ |
| 12_d1_databases.json | 104 | 104 | ✓ |
| 13_do_namespaces.json | 572 | 572 | ✓ |
| 14_queues.json | 195 | 195 | ✓ |
| 15_zones.json | 3,876 | 3,876 | ✓ |
| 16_audit_logs.json | 199 | 199 | ✓ |

Run-1 sizes were recorded in the audit session log; Run-2 sizes are reproducible from the committed files. **All 16 match byte-for-byte in size.** (Full SHA-256 comparison of Run-1 files is pending: the user's returned copies included the two Markdown documents, not the 16 JSONs. If the Run-1 JSONs surface, extend this table with hashes.)

Current Run-2 SHA-256 (16-char prefixes) for future comparison:
`01_verify` b89b154e9be4b4f91 · `09_subinfo` 433bcf319294cba49 (full values in commit history; regenerate with `sha256sum audit/cf-api/*.json`).

## 2. Worker source cross-check (source held outside this repository)
| Property | Run 1 | Run 2 | Match |
|---|---|---|---|
| Characters | 37,267 | 37,267 | ✓ |
| Lines | 828 | 828 | ✓ |
| Integrity markers (origin constant, DO classes, ticket issuer) | present | present | ✓ |
| SHA-256 | (not computed in Run 1) | `0733d8b185803b15…` | n/a |

## 3. Document cross-check (v3 → v4/v5)
The returned Run-1 copies (`AUDIT-REPORT-DIRECT.md`, `HISTORY-ARC-MONOPOLY.md`) were compared as received, including the UI-export markdown escaping in the originals. After normalization, the content deltas to the current documents are exactly the intended updates and **no contradictions**:

| Delta | Direction |
|---|---|
| Header/version note updated to reflect the two-run execution | editorial |
| Timeline: +2 rows (17:24 deep-dive state; two audit runs) and `cf-api/` prefixes on evidence refs | additive |
| F-CF2: note that `__manus___debug-collector.js` stopped being served (new F-EDGE-13) | additive |
| F-CF5/6/11/12: cross-references to preserved artifacts | additive |
| F-CF14: third stability confirmation noted | additive |
| F-EDGE table: +F-EDGE-13 row | additive |
| Open items: +item 5 (debug-collector unrecoverable from source) | additive |
| F-CF7 strikethrough formatting fixed (`~~~` → `~~…~~`) | editorial |

## 4. Genuine difference between runs (server-side, not an audit error)
`GET /__manus___debug-collector.js`: 200 / 25,168 B at ~17:24 UTC → deterministic 500 `error code: 1101` at ~20:45 UTC (reproduced 9+ times, multiple paths/UA/query variants), while all other assets kept serving byte-identically. Recorded as **F-EDGE-13**. This is the only observed state change of the deployment between the two runs.

## 5. Gameplay smoke test
Executed in Run 1 only (session 201 → room 201 → state → roll(4) → buy(520−180=340 ✓) → endTurn + AI turn → round 2). Not re-executed in Run 2; its conclusions stand because the worker source is identical across runs (section 2).

## 6. Conclusion
- No contradiction between the two independent runs.
- Evidence sizes identical across all 16 endpoints; worker source identical.
- One genuine server-side observation change (F-EDGE-13), documented and explained.
- Document evolution v3 → v4/v5 is purely additive/editorial; corrections are explicit and traceable.
