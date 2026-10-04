export const SOLANA_CLUSTER = "devnet";
export const SOLANA_RPC_URL = "https://api.devnet.solana.com";
export const MEMO_PROTOCOL_PREFIX = "orbita:v1";
export const INTRODUCTION_MEMO_PATTERN = /^orbita:v1:introduction:[a-f0-9]{64}$/;
const BASE58_PATTERN = /^[1-9A-HJ-NP-Za-km-z]+$/;

function canonicalString(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalString).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalString(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function canonicalRelationalClaim({ actorId, targetId, eventId, type = "introduction", version = 1 } = {}) {
  const cleanActor = String(actorId || "").trim();
  const cleanTarget = String(targetId || "").trim();
  const cleanEvent = String(eventId || "").trim();
  if (!cleanActor || !cleanTarget || !cleanEvent) throw new Error("actorId, targetId and eventId are required");
  return {
    protocol: "orbita",
    version: Number(version) || 1,
    type: String(type || "introduction").trim().toLowerCase(),
    actor_id: cleanActor,
    target_id: cleanTarget,
    event_id: cleanEvent
  };
}

export async function hashRelationalClaim(claim) {
  const bytes = new TextEncoder().encode(canonicalString(claim));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

export function buildSolanaMemoPayload(digest, type = "introduction") {
  const cleanDigest = String(digest || "").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(cleanDigest)) throw new Error("A SHA-256 digest is required");
  const cleanType = String(type || "introduction").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const memo = `${MEMO_PROTOCOL_PREFIX}:${cleanType}:${cleanDigest}`;
  if (cleanType === "introduction" && !INTRODUCTION_MEMO_PATTERN.test(memo)) {
    throw new Error("Memo privacy assertion failed");
  }
  return memo;
}

export function isValidSolanaSignature(value) {
  const clean = String(value || "").trim();
  return (clean.length === 87 || clean.length === 88) && BASE58_PATTERN.test(clean);
}

export function solanaExplorerUrl(signature) {
  const clean = String(signature || "").trim();
  if (!isValidSolanaSignature(clean)) return "";
  return `https://explorer.solana.com/tx/${encodeURIComponent(clean)}?cluster=devnet`;
}

export function assertAttestationReceipt({ signature, memo, digest, wallet, confirmationStatus } = {}) {
  if (!isValidSolanaSignature(signature)) throw new Error("La red no devolvió una firma válida.");
  if (!INTRODUCTION_MEMO_PATTERN.test(String(memo || ""))) throw new Error("El Memo no superó el control de privacidad.");
  if (!/^[a-f0-9]{64}$/.test(String(digest || "")) || !String(memo).endsWith(String(digest))) {
    throw new Error("El digest de la prueba no coincide.");
  }
  if (!BASE58_PATTERN.test(String(wallet || "")) || String(wallet).length < 32 || String(wallet).length > 44) {
    throw new Error("La wallet conectada no es válida.");
  }
  if (!new Set(["confirmed", "finalized"]).has(confirmationStatus)) {
    throw new Error("La transacción todavía no está confirmada.");
  }
  return true;
}

export function verifyFetchedAttestation({ rpcTransaction, rpcStatus, signature, memo, digest, wallet } = {}) {
  assertAttestationReceipt({ signature, memo, digest, wallet, confirmationStatus: rpcStatus?.confirmationStatus });
  if (!rpcStatus || rpcStatus.err || !rpcTransaction || rpcTransaction.meta?.err) return false;
  const signatures = rpcTransaction.transaction?.signatures || [];
  if (!signatures.includes(signature)) return false;
  const accountKeys = rpcTransaction.transaction?.message?.accountKeys || [];
  const walletSigned = accountKeys.some(key => {
    if (typeof key === "string") return key === wallet;
    return key?.pubkey === wallet && key?.signer === true;
  });
  if (!walletSigned) return false;
  const instructions = rpcTransaction.transaction?.message?.instructions || [];
  const memos = instructions
    .filter(instruction => instruction?.program === "spl-memo" || String(instruction?.programId || "").startsWith("Memo"))
    .map(instruction => typeof instruction.parsed === "string" ? instruction.parsed : instruction.parsed?.info)
    .filter(Boolean);
  return memos.includes(memo) && memo.endsWith(digest);
}

export async function executeUserSignedAttestation({ connect, send, memo }) {
  if (!INTRODUCTION_MEMO_PATTERN.test(String(memo || ""))) throw new Error("El Memo no superó el control de privacidad.");
  const wallet = await connect();
  const receipt = await send({ memo, wallet });
  return { ...receipt, wallet };
}

export function attestationPrivacySummary() {
  return {
    onChain: ["protocol/version", "attestation type", "SHA-256 digest"],
    private: ["names", "emails", "phones", "notes", "goal", "relationship context", "evidence"]
  };
}
