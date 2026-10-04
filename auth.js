import { cloudConfigured, runtimeConfig } from "./config.js";

const SESSION_KEY = "orbita.auth.session.v1";
const LOCAL_SESSION_KEY = "orbita.auth.local.v1";

function readJson(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
}

function writeJson(key, value) {
  if (value == null) localStorage.removeItem(key);
  else localStorage.setItem(key, JSON.stringify(value));
}

function sessionFromPayload(payload) {
  if (!payload?.access_token) return null;
  const expiresIn = Number(payload.expires_in || 3600);
  return {
    mode: "cloud",
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || "",
    expiresAt: Date.now() + expiresIn * 1000,
    user: payload.user || null
  };
}

async function authRequest(path, { method = "POST", body, token, redirectTo } = {}) {
  if (!cloudConfigured()) throw new Error("Supabase no está configurado en esta build.");
  const headers = {
    apikey: runtimeConfig.supabasePublishableKey,
    "Content-Type": "application/json"
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const url = new URL(`${runtimeConfig.supabaseUrl}/auth/v1${path}`);
  if (redirectTo) url.searchParams.set("redirect_to", redirectTo);
  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let payload = {};
  try { payload = text ? JSON.parse(text) : {}; } catch { payload = { message: text }; }
  if (!response.ok) throw new Error(payload.msg || payload.message || payload.error_description || payload.error || `Auth ${response.status}`);
  return payload;
}

export function getStoredSession() {
  const local = readJson(LOCAL_SESSION_KEY);
  if (local?.mode === "local") return local;
  const cloud = readJson(SESSION_KEY);
  return cloud?.mode === "cloud" ? cloud : null;
}

export function useLocalMode() {
  const session = {
    mode: "local",
    user: { id: "local", email: "local@orbita.app", user_metadata: { name: "Mi espacio" } },
    createdAt: new Date().toISOString()
  };
  writeJson(LOCAL_SESSION_KEY, session);
  writeJson(SESSION_KEY, null);
  return session;
}

export function leaveLocalMode() {
  writeJson(LOCAL_SESSION_KEY, null);
}

export async function signIn(email, password) {
  leaveLocalMode();
  const payload = await authRequest("/token?grant_type=password", { body: { email, password } });
  const session = sessionFromPayload(payload);
  if (!session) throw new Error("No se recibió una sesión válida.");
  writeJson(SESSION_KEY, session);
  return session;
}

export async function signUp(email, password, name = "") {
  leaveLocalMode();
  const redirectTo = effectiveAppUrl();
  const payload = await authRequest("/signup", {
    body: { email, password, data: name ? { name } : {} },
    redirectTo
  });
  const session = sessionFromPayload(payload);
  if (session) writeJson(SESSION_KEY, session);
  return { session, user: payload.user || null, pendingConfirmation: !session };
}

export async function requestPasswordReset(email) {
  const redirectTo = effectiveAppUrl();
  await authRequest("/recover", { body: { email }, redirectTo });
}

export async function updatePassword(password) {
  const session = await getValidSession();
  if (!session || session.mode !== "cloud") throw new Error("Necesitás una sesión válida.");
  await authRequest("/user", { method: "PUT", body: { password }, token: session.accessToken });
}

export async function signOut() {
  const session = getStoredSession();
  if (session?.mode === "cloud") {
    try { await authRequest("/logout", { token: session.accessToken }); } catch { /* local cleanup still wins */ }
  }
  writeJson(SESSION_KEY, null);
  writeJson(LOCAL_SESSION_KEY, null);
}

export async function refreshSession(session = getStoredSession()) {
  if (!session || session.mode !== "cloud" || !session.refreshToken) return null;
  const payload = await authRequest("/token?grant_type=refresh_token", { body: { refresh_token: session.refreshToken } });
  const fresh = sessionFromPayload(payload);
  if (!fresh) return null;
  writeJson(SESSION_KEY, fresh);
  return fresh;
}

export async function getValidSession() {
  const session = getStoredSession();
  if (!session) return null;
  if (session.mode === "local") return session;
  if (session.expiresAt > Date.now() + 90_000) return session;
  try { return await refreshSession(session); }
  catch { writeJson(SESSION_KEY, null); return null; }
}

export async function bootstrapAuth() {
  const redirect = parseAuthRedirect();
  if (redirect?.error) return { session: null, recovery: false, error: redirect.error };
  if (redirect?.session) {
    writeJson(SESSION_KEY, redirect.session);
    writeJson(LOCAL_SESSION_KEY, null);
    return { session: redirect.session, recovery: redirect.recovery, error: "" };
  }
  const session = await getValidSession();
  return { session, recovery: false, error: "" };
}

export function cloudIsConfigured() { return cloudConfigured(); }

export function effectiveAppUrl() {
  if (runtimeConfig.appUrl && !runtimeConfig.appUrl.startsWith("__")) return runtimeConfig.appUrl.replace(/\/$/, "");
  if (typeof location !== "undefined" && /^https?:/.test(location.origin)) return location.origin;
  return "";
}

function parseAuthRedirect() {
  if (typeof location === "undefined") return null;
  const rawHash = location.hash.startsWith("#") ? location.hash.slice(1) : location.hash;
  if (!rawHash.includes("access_token=") && !rawHash.includes("error=")) return null;
  const params = new URLSearchParams(rawHash);
  const authError = params.get("error_description") || params.get("error");
  if (authError) {
    history.replaceState(null, "", `${location.pathname}${location.search}#/today`);
    return { error: authError };
  }
  const accessToken = params.get("access_token");
  if (!accessToken) return null;
  const expiresIn = Number(params.get("expires_in") || 3600);
  const session = {
    mode: "cloud",
    accessToken,
    refreshToken: params.get("refresh_token") || "",
    expiresAt: Date.now() + expiresIn * 1000,
    user: null
  };
  history.replaceState(null, "", `${location.pathname}${location.search}#/today`);
  return { session, recovery: params.get("type") === "recovery" };
}

export async function hydrateUser(session) {
  if (!session || session.mode !== "cloud") return session;
  try {
    const user = await authRequest("/user", { method: "GET", token: session.accessToken });
    const hydrated = { ...session, user };
    writeJson(SESSION_KEY, hydrated);
    return hydrated;
  } catch {
    return session;
  }
}
