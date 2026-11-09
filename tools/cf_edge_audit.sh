#!/usr/bin/env bash
# CityForge Edge - read-only Cloudflare API audit (GET only). Token via env CF_TOKEN only.
set -u
OUT="/home/z/my-project/repos/cityforge/audit/cf-api"
mkdir -p "$OUT"
ACC="98d8795e246386dd…"
W="cityforge-edge"
BASE="https://api.cloudflare.com/client/v4"
step(){ local name="$1" url="$2" code
  code=$(curl -sS -m 45 -w '%{http_code}' -o "$OUT/$name.json" \
    -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json" "$url")
  echo "[$name] HTTP $code ($(stat -c%s "$OUT/$name.json") bytes)"; }
step 01_verify        "$BASE/user/tokens/verify"
step 02_accounts      "$BASE/accounts?per_page=50"
step 03_subdomain     "$BASE/accounts/$ACC/workers/subdomain"
step 04_services      "$BASE/accounts/$ACC/workers/services"
step 05_settings      "$BASE/accounts/$ACC/workers/scripts/$W/settings"
step 06_deployments   "$BASE/accounts/$ACC/workers/scripts/$W/deployments"
step 07_versions      "$BASE/accounts/$ACC/workers/scripts/$W/versions?per_page=30"
step 08_schedules     "$BASE/accounts/$ACC/workers/scripts/$W/schedules"
step 09_subinfo       "$BASE/accounts/$ACC/workers/scripts/$W/subinfo"
step 10_kv_namespaces "$BASE/accounts/$ACC/storage/kv/namespaces?per_page=100"
step 11_r2_buckets    "$BASE/accounts/$ACC/r2/buckets?per_page=100"
step 12_d1_databases  "$BASE/accounts/$ACC/d1/database?per_page=100"
step 13_do_namespaces "$BASE/accounts/$ACC/workers/durable_objects/namespaces"
step 14_queues        "$BASE/accounts/$ACC/queues"
step 15_zones         "$BASE/zones?per_page=50"
step 16_audit_logs    "$BASE/accounts/$ACC/audit_logs?per_page=50&since=2026-11-01T00:00:00Z"
echo DONE