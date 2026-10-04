const MEMO_PREFIX = "orbita:v1:introduction";

function canonicalString(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalString).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalString(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function canonicalRelationalClaim({ actorId, targetId, type = "introduction", version = 1 } = {}) {
  const cleanActor = String(actorId || "").trim();
  const cleanTarget = String(targetId || "").trim();
  if (!cleanActor || !cleanTarget) throw new Error("actorId and targetId are required");
  return {
    protocol: "orbita",
    version: Number(version) || 1,
    type: String(type || "introduction").trim().toLowerCase(),
    actor_id: cleanActor,
    target_id: cleanTarget
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
  return `${MEMO_PREFIX}:${cleanType}:${cleanDigest}`;
}

export function solanaExplorerUrl(signature) {
  const clean = String(signature || "").trim();
  if (!clean) return "";
  return `https://explorer.solana.com/tx/${encodeURIComponent(clean)}?cluster=devnet`;
}

export function attestationPrivacySummary() {
  return {
    onChain: ["protocol/version", "attestation type", "SHA-256 digest"],
    private: ["names", "emails", "phones", "notes", "goal", "relationship context", "evidence"]
  };
}
