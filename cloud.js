import { cloudConfigured, runtimeConfig } from "./config.js";
import { getValidSession } from "./auth.js";

export class CloudConflictError extends Error {
  constructor(message = "El workspace cambió en otro dispositivo.") {
    super(message);
    this.name = "CloudConflictError";
    this.code = "ORB_CONFLICT";
  }
}

class CloudApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "CloudApiError";
    this.status = status;
  }
}

function headers(token, extra = {}) {
  return {
    apikey: runtimeConfig.supabasePublishableKey,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...extra
  };
}

async function api(path, options = {}) {
  if (!cloudConfigured()) throw new Error("Cloud sync no configurado.");
  const session = await getValidSession();
  if (!session || session.mode !== "cloud") throw new Error("Sesión cloud no disponible.");
  const response = await fetch(`${runtimeConfig.supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: headers(session.accessToken, options.headers || {})
  });
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!response.ok) {
    throw new CloudApiError(
      response.status,
      payload?.message || payload?.hint || payload?.details || `Sync ${response.status}`
    );
  }
  return payload;
}

export async function loadCloudWorkspace(userId) {
  const rows = await api(
    `orbita_workspaces?select=workspace,updated_at,revision,payload_schema_version&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
    { method: "GET" }
  );
  return Array.isArray(rows) && rows[0]
    ? {
        workspace: rows[0].workspace,
        updatedAt: rows[0].updated_at,
        revision: Number(rows[0].revision || 1),
        payloadSchemaVersion: Number(rows[0].payload_schema_version || 3)
      }
    : null;
}

export async function saveCloudWorkspace(userId, workspace, expectedRevision = null) {
  if (expectedRevision == null) {
    try {
      const rows = await api("orbita_workspaces?select=revision,updated_at,payload_schema_version", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ user_id: userId, workspace })
      });
      const row = Array.isArray(rows) ? rows[0] : null;
      if (!row) throw new Error("No se recibió confirmación del guardado cloud.");
      return {
        revision: Number(row.revision || 1),
        updatedAt: row.updated_at,
        payloadSchemaVersion: Number(row.payload_schema_version || 3)
      };
    } catch (error) {
      if (error instanceof CloudApiError && error.status === 409) throw new CloudConflictError();
      throw error;
    }
  }

  const revision = Math.max(1, Number(expectedRevision));
  const rows = await api(
    `orbita_workspaces?user_id=eq.${encodeURIComponent(userId)}&revision=eq.${revision}&select=revision,updated_at,payload_schema_version`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ workspace })
    }
  );
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) throw new CloudConflictError();
  return {
    revision: Number(row.revision),
    updatedAt: row.updated_at,
    payloadSchemaVersion: Number(row.payload_schema_version || 3)
  };
}

export async function deleteCloudAccount() {
  if (!cloudConfigured()) throw new Error("Cloud no configurado.");
  const session = await getValidSession();
  if (!session || session.mode !== "cloud") throw new Error("Sesión cloud no disponible.");
  const response = await fetch(`${runtimeConfig.supabaseUrl}/functions/v1/delete-account`, {
    method: "POST",
    headers: headers(session.accessToken),
    body: JSON.stringify({ confirm: "ELIMINAR" })
  });
  const text = await response.text();
  let payload = {};
  try { payload = text ? JSON.parse(text) : {}; } catch { payload = {}; }
  if (!response.ok || payload?.ok !== true) {
    throw new Error(payload?.error || `No pudimos eliminar la cuenta (${response.status}).`);
  }
  return true;
}

export async function testCloudConnection(userId) {
  await loadCloudWorkspace(userId);
  return true;
}
