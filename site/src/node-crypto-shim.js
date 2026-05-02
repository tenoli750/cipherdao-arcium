export function randomBytes(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function createHash() {
  throw new Error("Node createHash is not available in the browser bundle");
}
