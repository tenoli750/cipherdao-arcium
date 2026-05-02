import { x25519 } from "@noble/curves/ed25519";
import { RescueCipher } from "../../node_modules/@arcium-hq/client/src/cryptography/rescueCipher.ts";

const CHOICE_TO_U8 = {
  yes: 0,
  no: 1,
  abstain: 2
};

function randomBytes(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function leBytesToBigInt(bytes) {
  let value = 0n;
  for (let i = bytes.length - 1; i >= 0; i -= 1) {
    value = (value << 8n) + BigInt(bytes[i]);
  }
  return value;
}

async function voterHashFromWallet(publicKey) {
  const solanaWeb3 = window.solanaWeb3;
  if (!solanaWeb3) throw new Error("Solana web3 bundle did not load");

  const key = new solanaWeb3.PublicKey(publicKey);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", key.toBytes()));
  return leBytesToBigInt(digest.slice(0, 16));
}

export async function encryptVote(params) {
  if (!(params.choice in CHOICE_TO_U8)) throw new Error("Unknown vote choice");

  const privateKey = x25519.utils.randomSecretKey();
  const ephemeralPublicKey = x25519.getPublicKey(privateKey);
  const mxePublicKey = Uint8Array.from(params.mxePublicKey);
  const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
  const cipher = new RescueCipher(sharedSecret);
  const nonce = randomBytes(16);
  const ciphertexts = cipher.encrypt(
    [
      await voterHashFromWallet(params.publicKey),
      BigInt(CHOICE_TO_U8[params.choice])
    ],
    nonce
  );

  return {
    ciphertexts: ciphertexts.map((ciphertext) => Array.from(ciphertext)),
    ephemeralPublicKey: Array.from(ephemeralPublicKey),
    nonce: leBytesToBigInt(nonce).toString()
  };
}
