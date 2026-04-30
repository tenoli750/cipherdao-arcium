const assert = require("assert");
const fs = require("fs");
const path = require("path");
const core = require("../site/src/governance-core");

const root = path.join(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const html = read("site/index.html");
const css = read("site/styles.css");
const program = read("programs/private_dao/src/lib.rs");
const encryptedIx = read("encrypted-ixs/private_vote.rs");

assert(html.includes("CipherDAO"), "site title should be present");
assert(html.includes("data-cast-vote"), "cast vote action should exist");
assert(css.includes(".app-shell"), "app layout styles should exist");
assert(program.includes("#[arcium_program]"), "Solana program should use Arcium macro");
assert(program.includes("verify_output"), "callbacks should verify Arcium output");
assert(encryptedIx.includes("Enc<Mxe, BallotState>"), "encrypted shared state should be MXE-owned");
assert(encryptedIx.includes("init_private_ballot"), "private ballot initialization should exist");
assert(encryptedIx.includes("publish_private_tally"), "final tally instruction should exist");

const receipts = [
  core.makeEncryptedReceipt({ proposalId: "p", wallet: "a", choice: "yes", round: 0 }),
  core.makeEncryptedReceipt({ proposalId: "p", wallet: "b", choice: "no", round: 1 }),
  core.makeEncryptedReceipt({ proposalId: "p", wallet: "c", choice: "yes", round: 2 }),
  core.makeEncryptedReceipt({ proposalId: "p", wallet: "d", choice: "abstain", round: 3 })
];

const tally = core.tallyVotes(receipts);
assert.deepStrictEqual(tally, { yes: 2, no: 1, abstain: 1, total: 4 });
assert(core.createProofId("p", receipts, tally).startsWith("proof_"));

console.log("CipherDAO smoke checks passed");
