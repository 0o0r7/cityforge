# cityforge — Audit Documentation & Evidence Backup

This repository is the **official backup of the CityForge technical validation audit** (the ARC-Monopoly successor from the Candle Climber catalog), created on 2026-11-09 to preserve evidence and the recovered source code against recurring workspace sandbox resets.

## Why this backup matters
- The Manus project that hosted CityForge has been **deleted** (`[not_found] project not found`), and the `cityforge-edge` Worker has been **frozen since 2026-08-22**.
- The only known copy of the backend source (828 lines) was recovered via the Cloudflare `subinfo` API and lives only here: [`audit/cf-api/cityforge-edge-worker-source.js`](audit/cf-api/cityforge-edge-worker-source.js).
- The published frontend snapshot (bundles) is preserved under [`artifacts/`](artifacts/README.md) with SHA-256 provenance.

## Repository layout
```
cityforge/
├── README.md                        ← this file
├── audit/
│   ├── HISTORY-ARC-MONOPOLY.md      ← master case file: timeline + findings F-CF1..14 and F-EDGE-1..13
│   ├── VERIFICATION-RUN1-vs-RUN2.md ← formal cross-check between the two independent audit runs
│   ├── archive/run1/                ← run-1 documents as received (verbatim copies, unmodified)
│   └── cf-api/
│       ├── AUDIT-REPORT-DIRECT.md   ← direct Cloudflare API audit report (16 GET steps + live test)
│       ├── 01_verify.json … 16_audit_logs.json   ← raw API evidence (two runs, identical sizes)
│       └── cityforge-edge-worker-source.js       ← recovered full worker source (828 lines)
├── artifacts/
│   ├── README.md                    ← provenance + hashes + the missing file (debug-collector)
│   ├── root.html                    ← 368,243 B — contains the full Manus Previewer runtime
│   ├── assets/index-P14T8RX6.js     ← 793,128 B — main bundle (React/Arc/multicall3)
│   ├── assets/index-Pjaa9_yt.css    ← 134,224 B
│   ├── assets/ArcOwnerControl-6aTkiLY4.js ← 180,011 B — owner-only page
│   └── headers-root.txt             ← root response headers
└── tools/
    └── cf_edge_audit.sh             ← audit reproduction script (GET-only, token via env)
```

## Key findings (one-glance summary)
| # | Finding |
|---|---|
| 1 | **The backend is alive** — the full gameplay loop (session → room → roll → buy → AI turn) passed via live curl; the earlier "1101 = dead backend" claim was refuted (1101 reproduces only with an empty/invalid JSON body). |
| 2 | **Root cause of the broken UX:** CORS is hardcoded to the dead Manus origin → the workers.dev frontend cannot call its own API from the browser; WebSocket is 403 as well. |
| 3 | **The NFT claim flow** (winnerTicket, HMAC-signed, 10-minute validity) depends on the deleted Manus backend → dead. |
| 4 | Server-authoritative dice via `crypto.getRandomValues` with rejection sampling (no `Math.random`); HMAC-SHA256 sessions with constant-time comparison. |
| 5 | Worker frozen since 2026-08-22T20:19:48Z; R2 disabled on the account; no KV/D1/Queues/Cron — a pure DO+SQLite architecture. |

## Reproducing the audit
```bash
export CF_TOKEN='<token with Workers Scripts:Read scope on the 0o0r7 account>'
bash tools/cf_edge_audit.sh   # output goes to audit/cf-api/*.json
```
Doctrine: GET-only; token passed via env only; scope errors (401/403) are logged without retry; rotate the token immediately after the run.

## Documentation policy (standing rules)
1. **Language & tone:** all authored documentation in this repository is written in **English** with a clean technical tone. Raw evidence (API JSON responses, the recovered worker source, and as-received copies under `archive/`) is preserved verbatim and is exempt from authoring rules.
2. **Naming:** the blockchain is spelled **ARC** (not "ARK"). The project is referred to as **ARC-Monopoly**. The ARC Testnet chainId is `5042002` (`0x4cef52`).

## Deliberately not included
- Any token, cookie, or secret value (secret values are redacted by Cloudflare itself and were never extracted).
- Workspace `.env` files and any other confidential data.
- Screenshots cf-01..05 (lost in a sandbox reset; reproducible on demand).
- The Candle Climber application code (it has its own repository).

## License
Documentation and evidence belong to the 0o0r7 audit research. The recovered worker source is code owned by the account owner (`0o0r7.web3@gmail.com`) and is kept here solely as that owner's private backup.
