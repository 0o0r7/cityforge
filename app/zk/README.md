# zk — settlement circuit artifacts

These are the compiled outputs of `app/circuits/settle.circom` (Groth16, bn128, 3312
constraints). `app/src/zk/prove.js` loads them at settlement time, proves the payout vector
and verifies it locally before the settlement response leaves the server.

| File | Size | sha256 |
|---|---|---|
| `settle.wasm` | 3.2 MB | `e1a2251ee6fa926cf97196f3fc19e127f56421e0cdb6859d61625895164b340c` |
| `settle.zkey` | 1.5 MB | `e31dc47d513daee43dd46dfee12af3a1941d3b6f112a27055eaa2e3b04ab09c5` |
| `verification_key.json` | 3.8 KB | `cc1067d043f25650cecbc2157ebc9518ba30899fafd66ed170cbeef30bd5b219` |

## Rebuilding

```sh
npm i circomlib@2.0.5 snarkjs@0.7.4 circom2@0.2.23
node node_modules/circom2/cli.js settle.circom --r1cs --wasm --sym -l node_modules
# ptau 2^12, generated locally (see app/circuits/README.md for the trust caveat)
snarkjs powersoftau new bn128 12 pot12_0000.ptau
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="forge-fair-dev" -e="..."
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau
snarkjs groth16 setup settle.r1cs pot12_final.ptau settle_0000.zkey
snarkjs zkey contribute settle_0000.zkey settle.zkey --name="forge-fair-dev" -e="..."
snarkjs zkey export verificationkey settle.zkey verification_key.json
```

Measured on the sandbox: witness + proof **≈ 0.7 s**, local verify ≈ 10 ms, 6 public signals
(`payoutsHash`, `balancesHash`, `pot`, `cap`, `nonce`, `winnerIdx`).

## Anchoring

`app/src/zk/zkverify.js` submits each settlement proof through Kurier. Configure
`KURIER_API_KEY` (dashboard: <https://kurier.xyz>, testnet: <https://testnet.kurier.xyz>);
`KURIER_API_URL` defaults to `https://api.kurier.xyz/api/v1`. The verification key is
registered once per process, then each settlement is submitted and polled until
`Finalized`. With no key, the settlement reports `attestation.status = "not-configured"`
instead of pretending the proof was anchored.
