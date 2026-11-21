pragma circom 2.1.6;

// Settlement invariant proof for Forge Fair.
//
// Public:  payoutsHash, balancesHash, pot, cap, nonce, winnerIdx
// Private: payouts[], balances[], salts[]
//
// Claims proved, and nothing beyond them:
//   1. The payout vector is the one committed before the settlement (Poseidon + salts + nonce).
//   2. Payouts sum exactly to the pot — no hidden rake.
//   3. No single payout exceeds the committed cap.
//   4. The entire pot goes to the player at winnerIdx.
//   5. balances[winnerIdx] is the maximum of the committed balances — the winner is the true
//      argmax, not the operator's pick. Ties are allowed (>=), matching the engine's tiebreak.
//
// The nonce is folded into both commitments, so a settled vector cannot be replayed for a
// second settlement.
//
// What this circuit does NOT do: it does not re-run the board in zero knowledge. Following the
// rules is covered by deterministic replay from the revealed seed. Both facts are stated on the
// public ledger page rather than blurred into one "fully verified" claim.

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";

template Settle(MAXP) {
    signal input payouts[MAXP];
    signal input balances[MAXP];
    signal input salts[MAXP];

    signal input pot;
    signal input cap;
    signal input nonce;
    signal input winnerIdx;

    signal output payoutsHash;
    signal output balancesHash;

    // ---- 64-bit range checks so the comparisons below are sound ----
    component payoutBits[MAXP];
    component balanceBits[MAXP];
    for (var i = 0; i < MAXP; i++) {
        payoutBits[i] = Num2Bits(64);
        payoutBits[i].in <== payouts[i];
        balanceBits[i] = Num2Bits(64);
        balanceBits[i].in <== balances[i];
    }

    component potBits;
    potBits = Num2Bits(64);
    potBits.in <== pot;

    component capBits;
    capBits = Num2Bits(64);
    capBits.in <== cap;

    // ---- commitments ----
    component payoutCommit;
    payoutCommit = Poseidon(2 * MAXP + 1);
    for (var i = 0; i < MAXP; i++) {
        payoutCommit.inputs[i] <== payouts[i];
        payoutCommit.inputs[MAXP + i] <== salts[i];
    }
    payoutCommit.inputs[2 * MAXP] <== nonce;
    payoutsHash <== payoutCommit.out;

    component balanceCommit;
    balanceCommit = Poseidon(MAXP + 1);
    for (var i = 0; i < MAXP; i++) {
        balanceCommit.inputs[i] <== balances[i];
    }
    balanceCommit.inputs[MAXP] <== nonce;
    balancesHash <== balanceCommit.out;

    // ---- 2. conservation: sum(payouts) == pot ----
    signal payoutAcc[MAXP + 1];
    payoutAcc[0] <== 0;
    for (var i = 0; i < MAXP; i++) {
        payoutAcc[i + 1] <== payoutAcc[i] + payouts[i];
    }
    payoutAcc[MAXP] === pot;

    // ---- 3. no payout above the cap ----
    component capCheck[MAXP];
    for (var i = 0; i < MAXP; i++) {
        capCheck[i] = LessEqThan(64);
        capCheck[i].in[0] <== payouts[i];
        capCheck[i].in[1] <== cap;
        capCheck[i].out === 1;
    }

    // ---- 4 & 5. winner index: in range, unique, true argmax, receives the pot ----
    component winnerInRange;
    winnerInRange = LessThan(8);
    winnerInRange.in[0] <== winnerIdx;
    winnerInRange.in[1] <== MAXP;
    winnerInRange.out === 1;

    component isWinner[MAXP];
    signal winnerBalanceSel[MAXP];
    signal winnerPayoutSel[MAXP];
    signal balanceAcc[MAXP + 1];
    signal winnerAcc[MAXP + 1];
    balanceAcc[0] <== 0;
    winnerAcc[0] <== 0;

    for (var i = 0; i < MAXP; i++) {
        isWinner[i] = IsEqual();
        isWinner[i].in[0] <== winnerIdx;
        isWinner[i].in[1] <== i;
        winnerBalanceSel[i] <== isWinner[i].out * balances[i];
        winnerPayoutSel[i] <== isWinner[i].out * payouts[i];
        balanceAcc[i + 1] <== balanceAcc[i] + winnerBalanceSel[i];
        winnerAcc[i + 1] <== winnerAcc[i] + winnerPayoutSel[i];
    }

    // the winner receives the whole pot
    winnerAcc[MAXP] === pot;

    // and nobody is richer than the winner
    component argmax[MAXP];
    for (var j = 0; j < MAXP; j++) {
        argmax[j] = LessEqThan(64);
        argmax[j].in[0] <== balances[j];
        argmax[j].in[1] <== balanceAcc[MAXP];
        argmax[j].out === 1;
    }
}

// Outputs are public by construction; only inputs may be listed here.
component main {public [pot, cap, nonce, winnerIdx]} = Settle(4);
