(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.GovernanceCore = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  const CHOICES = ["yes", "no", "abstain"];

  function assertChoice(choice) {
    if (!CHOICES.includes(choice)) {
      throw new Error("Unknown vote choice: " + choice);
    }
  }

  function randomHex(bytes) {
    const out = new Uint8Array(bytes);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(out);
    } else {
      for (let i = 0; i < out.length; i += 1) {
        out[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(out, function (value) {
      return value.toString(16).padStart(2, "0");
    }).join("");
  }

  function stableHash(input) {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function makeEncryptedReceipt(params) {
    assertChoice(params.choice);
    const nonce = randomHex(16);
    const body = [
      params.proposalId,
      params.wallet,
      params.choice,
      params.round,
      nonce
    ].join(":");
    const commitment = stableHash(body + ":commit");
    const cipherA = stableHash(body + ":a");
    const cipherB = stableHash(body + ":b");
    return {
      id: "rcpt_" + commitment,
      proposalId: params.proposalId,
      voter: params.wallet,
      choice: params.choice,
      nonce: nonce,
      ciphertext: "arc_" + cipherA + cipherB,
      commitment: commitment,
      createdAt: Date.now()
    };
  }

  function tallyVotes(receipts) {
    const result = { yes: 0, no: 0, abstain: 0, total: 0 };
    for (const receipt of receipts) {
      assertChoice(receipt.choice);
      result[receipt.choice] += 1;
      result.total += 1;
    }
    return result;
  }

  function resultPercentages(result) {
    const total = Math.max(result.total, 1);
    return {
      yes: Math.round((result.yes / total) * 100),
      no: Math.round((result.no / total) * 100),
      abstain: Math.round((result.abstain / total) * 100)
    };
  }

  function createProofId(proposalId, receipts, result) {
    const payload = receipts
      .map(function (receipt) {
        return receipt.commitment + ":" + receipt.ciphertext;
      })
      .join("|");
    return "proof_" + stableHash(proposalId + ":" + payload + ":" + JSON.stringify(result));
  }

  return {
    CHOICES: CHOICES,
    makeEncryptedReceipt: makeEncryptedReceipt,
    tallyVotes: tallyVotes,
    resultPercentages: resultPercentages,
    createProofId: createProofId,
    stableHash: stableHash
  };
});
