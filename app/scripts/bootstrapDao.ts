import * as anchor from "@coral-xyz/anchor";
import {
  createProgram,
  createProposal,
  createProvider,
  DEVNET_CLUSTER_OFFSET,
  deriveDaoPda,
  initComputationDefinitions,
  initializeDao,
  initPrivateBallot
} from "../privateDaoClient";

const rpcUrl = process.env.RPC_URL ?? "http://127.0.0.1:8899";
const keypairPath = process.env.KEYPAIR ?? `${process.env.HOME}/.config/solana/id.json`;
const clusterOffset = Number(process.env.ARCIUM_CLUSTER_OFFSET ?? DEVNET_CLUSTER_OFFSET);
const title = process.env.PROPOSAL_TITLE ?? "Fund confidential governance grants";
const proposalId = new anchor.BN(process.env.PROPOSAL_ID ?? Date.now().toString());
const closesInSeconds = Number(process.env.CLOSES_IN_SECONDS ?? 3 * 24 * 60 * 60);

async function main() {
  const provider = createProvider(rpcUrl, keypairPath);
  anchor.setProvider(provider);
  const program = createProgram(provider);
  const closesAtUnix = new anchor.BN(Math.floor(Date.now() / 1000) + closesInSeconds);

  console.log("RPC:", rpcUrl);
  console.log("Program:", program.programId.toBase58());
  console.log("DAO PDA:", deriveDaoPda(program.programId).toBase58());

  try {
    const sig = await initializeDao({ program });
    console.log("initializeDao:", sig);
  } catch (error) {
    console.log("initializeDao skipped:", error instanceof Error ? error.message : error);
  }

  console.log("Initializing Arcium computation definitions...");
  const compDefSigs = await initComputationDefinitions({ program });
  console.log("compDef signatures:", compDefSigs);

  console.log("Creating proposal:", title);
  const proposal = await createProposal({
    program,
    proposalId,
    title,
    closesAtUnix
  });
  console.log("createProposal:", proposal.signature);
  console.log("Proposal PDA:", proposal.proposal.toBase58());

  console.log("Initializing private ballot state in Arcium...");
  const ballot = await initPrivateBallot({
    program,
    proposal: proposal.proposal,
    clusterOffset
  });
  console.log("initPrivateBallot:", ballot.signature);
  console.log("finalized:", ballot.finalizeSignature);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
