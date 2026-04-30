import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  castPrivateVote,
  createProgram,
  createProvider,
  DEVNET_CLUSTER_OFFSET,
  PrivateVoteChoice,
  voterHashFromWallet
} from "../privateDaoClient";

const choice = (process.env.CHOICE ?? "yes") as PrivateVoteChoice;
const proposal = process.env.PROPOSAL;
const stateNonce = process.env.STATE_NONCE;
const rpcUrl = process.env.RPC_URL ?? "http://127.0.0.1:8899";
const keypairPath = process.env.KEYPAIR ?? `${process.env.HOME}/.config/solana/id.json`;
const clusterOffset = Number(process.env.ARCIUM_CLUSTER_OFFSET ?? DEVNET_CLUSTER_OFFSET);

async function main() {
  if (!proposal) throw new Error("Set PROPOSAL=<proposal pda>");
  if (!stateNonce) throw new Error("Set STATE_NONCE=<encrypted_state_nonce as bigint>");

  const provider = createProvider(rpcUrl, keypairPath);
  anchor.setProvider(provider);
  const program = createProgram(provider);
  const wallet = provider.wallet.publicKey;

  const result = await castPrivateVote({
    program,
    proposal: new PublicKey(proposal),
    voterHash: voterHashFromWallet(wallet),
    choice,
    encryptedStateNonce: BigInt(stateNonce),
    clusterOffset
  });

  console.log("castPrivateVote:", result.signature);
  console.log("finalized:", result.finalizeSignature);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
