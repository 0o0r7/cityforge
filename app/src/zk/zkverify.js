// zkVerify anchoring through Kurier.
//
// A locally verified proof is not an anchor: the operator holds the verification key and
// could, in principle, prove whatever it likes. Kurier submits the Groth16 proof to the
// zkVerify chain, which returns a job id that reaches `Finalized` once the verification is
// on chain — a public, timestamped record that this payout vector satisfied the
// constraints. Without an API key the settlement still carries a locally verified proof
// and says, explicitly, that it is unattested.

const DEFAULT_URL = 'https://api.kurier.xyz/api/v1';
const PROOF_OPTIONS = { library: 'snarkjs', curve: 'bn128' };
const TIMEOUT_MS = 20000;
// Registering a key is an on-chain step and takes ~20-30s the first time.
const REGISTER_TIMEOUT_MS = 90000;
const FINAL = new Set(['Finalized', 'Aggregated']);
const PENDING = new Set(['Queued', 'Valid', 'Submitted', 'IncludedInBlock', 'AggregationPending']);

const NOT_CONFIGURED =
  'KURIER_API_KEY is not set — the proof is verified locally only, not attested on zkVerify';

function config() {
  const key = (process.env.KURIER_API_KEY || '').trim();
  if (!key) return null;
  return { key, base: (process.env.KURIER_API_URL || DEFAULT_URL).replace(/\/+$/, '') };
}

/** What the settlement page may show about the anchor, never the key itself. */
export function attestationConfig() {
  const cfg = config();
  if (!cfg) return { configured: false, network: null };
  return { configured: true, network: /testnet/i.test(cfg.base) ? 'testnet' : 'mainnet' };
}

async function request(cfg, path, init, timeout = TIMEOUT_MS) {
  const response = await fetch(cfg.base + path, {
    ...init,
    signal: AbortSignal.timeout(timeout),
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    // The API key sits in the URL path, so never echo the request URL back.
    throw new Error(String(body.message || body.error || `Kurier responded ${response.status}`));
  }
  return body;
}

let vkHash = null;
let registering = null;

async function registerKey(cfg, vk) {
  const body = await request(
    cfg,
    `/register-vk/${cfg.key}`,
    {
      method: 'POST',
      body: JSON.stringify({ proofType: 'groth16', proofOptions: PROOF_OPTIONS, vk }),
    },
    REGISTER_TIMEOUT_MS,
  );
  const hash = body.vkHash || body.meta?.vkHash;
  if (!hash) throw new Error('Kurier did not return a vkHash for the settlement key');
  return hash;
}

/** Register once per process; concurrent settlements await the same registration. */
function ensureKey(cfg, vk) {
  if (vkHash) return Promise.resolve(vkHash);
  if (!registering) {
    registering = registerKey(cfg, vk)
      .then((hash) => {
        vkHash = hash;
        return hash;
      })
      .finally(() => {
        registering = null;
      });
  }
  return registering;
}

/**
 * Register the settlement key ahead of the first settlement, so the one-time on-chain
 * registration (~20s) does not sit inside a settlement request.
 */
export async function prewarm(vk) {
  const cfg = config();
  if (!cfg) return null;
  try {
    return await ensureKey(cfg, vk);
  } catch {
    return null;
  }
}

/** Submit one settlement proof. Returns immediately with the job id; status is polled. */
export async function submitAttestation({ proof, publicSignals, vk }) {
  const cfg = config();
  if (!cfg) return { status: 'not-configured', reason: NOT_CONFIGURED };
  try {
    const hash = await ensureKey(cfg, vk);
    const submitted = await request(cfg, `/submit-proof/${cfg.key}`, {
      method: 'POST',
      body: JSON.stringify({
        proofType: 'groth16',
        vkRegistered: true,
        proofOptions: PROOF_OPTIONS,
        proofData: { proof, publicSignals, vk: vkHash },
      }),
    });
    const base = { jobId: submitted.jobId ?? null, vkHash: hash, network: attestationConfig().network };
    if (submitted.optimisticVerify !== 'success') {
      return { ...base, status: 'failed', reason: 'Kurier rejected the proof at submission' };
    }
    return { ...base, status: 'submitted', optimisticVerify: submitted.optimisticVerify };
  } catch (error) {
    return { status: 'error', reason: error.message };
  }
}

/** One job-status read. `finalized` is the only state that counts as anchored. */
export async function attestationStatus(jobId) {
  const cfg = config();
  if (!cfg) return { status: 'not-configured', reason: NOT_CONFIGURED };
  try {
    const job = await request(cfg, `/job-status/${cfg.key}/${encodeURIComponent(jobId)}`, {
      method: 'GET',
    });
    const jobStatus = job.status || 'unknown';
    const status = FINAL.has(jobStatus)
      ? 'finalized'
      : PENDING.has(jobStatus)
        ? 'pending'
        : jobStatus === 'Failed'
          ? 'failed'
          : 'unknown';
    return {
      status,
      jobId,
      jobStatus,
      network: attestationConfig().network,
      txHash: job.txHash ?? null,
      blockHash: job.blockHash ?? null,
      statement: job.statement ?? null,
      aggregationId: job.aggregationId ?? null,
      updatedAt: job.updatedAt ?? null,
    };
  } catch (error) {
    return { status: 'error', jobId, reason: error.message };
  }
}
