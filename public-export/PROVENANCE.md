# Provenance

Forge Fair is a new build. Its threat model was derived from an internal audit of a predecessor project in
the same catalogue: a deleted hosting project, a frozen Cloudflare Worker, an 828-line backend whose
session, dice and ticket flows were reviewed end to end.

That audit archive — raw API evidence, the recovered worker source and a published front-end snapshot — is
kept **private**. It is not part of this repository and cannot be linked publicly, because it contains
third-party material that is not ours to redistribute.

What the audit changed in this build:

- **No client-trusted randomness.** The predecessor's server-authoritative dice were sound; the failure was
  elsewhere. Here the seed is committed before the first roll and revealed only at settlement.
- **No hidden settlement path.** In the predecessor the payout depended on a backend that no longer existed.
  Here settlement is replayed and proved, and the proof reference is public.
- **No operator-only escape hatch.** The audit found endpoints that overwrote state without authorization.
  Forge Fair has no such endpoint: every state change is a typed action on a live room.
- **Honest surface.** What the circuit does not prove is stated on the proof page rather than implied away.

A one-page summary of the audit findings can be provided to judges on request.
