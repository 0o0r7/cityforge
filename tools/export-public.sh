#!/bin/sh
# Build the public release tree (public-export/) from the current source.
# The audit archive, recovered bundles and tooling are deliberately NOT copied.
#
#   sh tools/export-public.sh
#
# Output is committed on the working branch so it can be downloaded from GitHub.
set -eu

cd "$(dirname "$0")/.."
out=public-export

rm -rf "$out"
mkdir -p "$out/app" "$out/docs" "$out/audit"

# product source (no installed dependencies, no local env files)
tar -C app -cf - \
  --exclude=node_modules --exclude=.env --exclude=.env.\* \
  --exclude='*.log' . | tar -C "$out/app" -xf -

cp docs/AZURE-SETUP.md "$out/docs/"
cp audit/FORGE-FAIR-SPEC.md "$out/audit/"
cp audit/SUBMISSION-FORM.md "$out/audit/"

# the spec and the submission form were written inside the private archive: neutralise the
# internal-only references so the public copy does not point at material we cannot publish
sed -i \
  -e 's/Derived from CityForge (this repository.s recovered architecture) for zkVerify Agent Games\./Derived from the internal audit described in PROVENANCE.md, for zkVerify Agent Games./' \
  -e 's/(the CityForge bundle already does this — reuse the approach)/(rejection sampling, no modulo bias)/' \
  -e 's/explorer `arcscan` (values recovered from/explorer `arcscan` (verified live)/' \
  -e '/artifacts\/assets\/ArcOwnerControl-\*\.js/d' \
  -e 's#github.com/0o0r7/cityforge#github.com/0o0r7/forge-fair#g' \
  "$out/audit/FORGE-FAIR-SPEC.md" "$out/audit/SUBMISSION-FORM.md"

cp tools/public-template/README.md "$out/README.md"
cp tools/public-template/PROVENANCE.md "$out/PROVENANCE.md"

cat > "$out/.gitignore" <<'EOF'
node_modules/
.env
.env.*
*.log
.DS_Store
EOF

echo "built $out:"
find "$out" -type f | wc -l | sed 's/^/  files: /'
du -sh "$out" | sed 's/^/  size:  /'
