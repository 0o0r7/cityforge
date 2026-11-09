# CityForge Public Artifacts — snapshot

**Captured:** 2026-11-09 (UTC ~17:24 first pass, ~20:45 this repository's re-acquisition)
**Source:** `https://cityforge-edge.0o0r7-web3.workers.dev/` (public access, no token)
**Purpose:** deep-dive evidence (F-CF2 through F-CF12 in `../audit/HISTORY-ARC-MONOPOLY.md`) — after the Manus project deletion, these files are the only known copies of the published frontend.

## Files and integrity (SHA-256)

| File | Size (bytes) | SHA-256 (first 16) |
|---|---|---|
| `root.html` | 368,243 | `81586f6399f9465b` |
| `assets/index-P14T8RX6.js` | 793,128 | `a98f17db51d88efd` |
| `assets/index-Pjaa9_yt.css` | 134,224 | `8947efd669db608e` |
| `assets/ArcOwnerControl-6aTkiLY4.js` | 180,011 | `39ef54e858aedb07` |
| `headers-root.txt` | — | root response headers (server date, cf-ray, NEL) |

Full hashes are reproducible with `sha256sum`; complete values are recorded in the commit history.

## Key findings inside these files
- `root.html` — the Manus Previewer runtime (~367 KB inlined), Manus scaffold.
- `index-P14T8RX6.js` — main React 19.2.1 bundle; ARC chain: chainId `0x4cef52`, canonical multicall3 `0xcA11bde05977b3631167028862bE2a173976CA11`, three ERC-20 bytecodes (798/1,410/11,188 hex chars), leaked source path `/home/ubuntu/cityforge-arc-game/client/src/...`; no city-mark contract address.
- `index-Pjaa9_yt.css` — Tailwind + shadcn/ui styling.
- `ArcOwnerControl-6aTkiLY4.js` — owner-only control page (F-CF5).

## ⚠️ Missing file: `__manus___debug-collector.js`
In the 17:24 UTC snapshot it was still served (25,168 B), but from the ~20:45 re-acquisition onward its path returns a **deterministic 500/error 1101** (F-EDGE-13). No copy exists in this repository; if recovery is needed, use public caches (archive.org / Google cache) or any local copy from the earlier snapshot.

## Provenance note
These files were fetched read-only from the public URL; no change has been observed in the deployment since 2026-08-22 (three refetches with identical sizes — F-CF14). This snapshot is therefore a valid capture of the project's published state.
