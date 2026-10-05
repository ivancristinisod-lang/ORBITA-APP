import { getValidSession } from "./auth.js";
import { cloudConfigured, runtimeConfig } from "./config.js";
import { buildRelationalOpportunities } from "./core.js";

const PRODUCT_VERSION = "0.7.0-alpha.1";
const STORE_PREFIX = "orbita.store.v3";
const ALPHA_MODE_KEY = "orbita.alpha.workspace-mode";
const SESSION_KEY = "orbita.alpha.session-id";
const LAST_SESSION_PREFIX = "orbita.alpha.last-session";
const SESSION_GAP_MS = 30 * 60 * 1000;

let activeUserId = "";
let activeSession = null;
let activationBusy = false;

function routeName() {
  const route = (location.hash.match(/^#\/(today|people|network|data)/)?.[1] || "today").toLowerCase();
  return route;
}

function workspaceMode() {
  return localStorage.getItem(ALPHA_MODE_KEY) || "real";
}

function setWorkspaceMode(mode) {
  localStorage.setItem(ALPHA_MODE_KEY, mode === "demo" ? "demo" : "real");
}

function sessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function readWorkspace(userId) {
  if (!userId) return null;
  try {
    return JSON.parse(localStorage.getItem(`${STORE_PREFIX}.${userId}`) || "null");
  } catch {
    return null;
  }
}

function telemetryHeaders(session) {
  return {
    apikey: runtimeConfig.supabasePublishableKey,
    Authorization: `Bearer ${session.accessToken}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal"
  };
}

async function postRow(table, row, session = activeSession) {
  if (!session || session.mode !== "cloud" || !cloudConfigured()) return { ok: false, skipped: true };
  try {
    const response = await fetch(`${runtimeConfig.supabaseUrl}/rest/v1/${table}`, {
      method: "POST",
      headers: telemetryHeaders(session),
      body: JSON.stringify(row)
    });
    if (response.ok) return { ok: true, duplicate: false };
    const body = await response.text();
    if (response.status === 409 || body.includes("23505") || body.toLowerCase().includes("duplicate")) {
      return { ok: false, duplicate: true };
    }
    console.warn(`ORBITA Private Alpha ${table}`, response.status);
    return { ok: false, status: response.status };
  } catch (error) {
    console.warn(`ORBITA Private Alpha ${table}`, error);
    return { ok: false, network: true };
  }
}

async function track(eventName, properties = {}, { allowDemo = false } = {}) {
  if (!activeSession?.user?.id) return { ok: false, skipped: true };
  if (!allowDemo && workspaceMode() === "demo") return { ok: false, skipped: true };
  return postRow("orbita_funnel_events", {
    user_id: activeSession.user.id,
    event_name: eventName,
    session_id: sessionId(),
    route: routeName(),
    product_version: PRODUCT_VERSION,
    properties
  });
}

async function trackSession(session) {
  const userId = session.user?.id;
  if (!userId) return;
  const key = `${LAST_SESSION_PREFIX}.${userId}`;
  const now = Date.now();
  const previous = Number(localStorage.getItem(key) || 0);
  const first = await track("first_login", {}, { allowDemo: true });
  if (first.duplicate && (!previous || now - previous >= SESSION_GAP_MS)) {
    await track("return_session", {}, { allowDemo: true });
  } else if (!first.ok && !first.duplicate && previous && now - previous >= SESSION_GAP_MS) {
    await track("return_session", {}, { allowDemo: true });
  }
  localStorage.setItem(key, String(now));
}

async function maybeTrackWorkspaceMilestones() {
  if (!activeSession?.user?.id || workspaceMode() === "demo") return;
  const workspace = readWorkspace(activeSession.user.id);
  if (!workspace) return;
  const people = Array.isArray(workspace.people) ? workspace.people : [];
  const goal = String(workspace.profile?.currentGoal || "").trim();

  if (goal) await track("goal_created");
  if (people.length >= 1) await track("first_person_created");
  if (people.length >= 3) await track("third_person_created");

  if (goal && people.length) {
    try {
      const ranked = buildRelationalOpportunities(workspace, goal);
      if (ranked.length > 0) {
        await track("first_opportunity_shown", { result_count_bucket: ranked.length >= 5 ? "5+" : String(ranked.length) });
      }
    } catch {
      // Funnel measurement must never affect product behavior.
    }
  }
}

async function activateForCloudUser() {
  if (activationBusy) return;
  activationBusy = true;
  try {
    const session = await getValidSession();
    const userId = session?.mode === "cloud" ? session.user?.id : "";
    if (!userId) {
      activeUserId = "";
      activeSession = null;
      return;
    }
    activeSession = session;
    if (activeUserId !== userId) {
      activeUserId = userId;
      await trackSession(session);
      await maybeTrackWorkspaceMilestones();
    }
    ensureFeedbackEntry();
    enhanceOpportunityDrawer();
  } finally {
    activationBusy = false;
  }
}

function ensureFeedbackEntry() {
  const help = document.querySelector(".sidebar-help");
  if (!help || document.querySelector("#alpha-feedback-entry")) return;
  const button = document.createElement("button");
  button.id = "alpha-feedback-entry";
  button.className = "sidebar-feedback";
  button.type = "button";
  button.dataset.alphaAction = "open-feedback";
  button.innerHTML = `<span class="feedback-dot">!</span><span><strong>FEEDBACK</strong><small>Problema o comentario</small></span>`;
  help.insertAdjacentElement("afterend", button);
}

function closeFeedback() {
  const shell = document.querySelector("#modal-shell");
  shell?.classList.remove("open");
  shell?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
}

function openFeedback() {
  const shell = document.querySelector("#modal-shell");
  const content = document.querySelector("#modal-content");
  if (!shell || !content) return;
  content.innerHTML = `
    <div class="modal-head alpha-feedback-head">
      <div><span class="eyebrow">PRIVATE ALPHA</span><h2>Enviar feedback</h2><p>Contanos qué pasó. No adjuntamos nombres, notas ni datos de tu red.</p></div>
      <button class="icon-btn" type="button" data-alpha-action="close-feedback" aria-label="Cerrar">×</button>
    </div>
    <form id="alpha-feedback-form" class="entity-form">
      <div class="form-grid">
        <label class="form-field wide"><span>TIPO</span><select name="issue_type" required>
          <option value="feedback">Comentario</option>
          <option value="bug">Problema</option>
          <option value="blocking_bug">Me impide seguir</option>
          <option value="other">Otro</option>
        </select></label>
        <label class="form-field wide"><span>MENSAJE *</span><textarea name="message" rows="5" maxlength="4000" required placeholder="¿Qué intentabas hacer? ¿Qué esperabas que pasara?"></textarea></label>
      </div>
      <p class="alpha-feedback-privacy">Se registra pantalla, versión, hora y contexto técnico no sensible.</p>
      <div class="form-footer"><span id="alpha-feedback-status"></span><div><button class="btn btn-ghost" type="button" data-alpha-action="close-feedback">Cancelar</button><button class="btn btn-primary" type="submit">ENVIAR</button></div></div>
    </form>`;
  shell.classList.add("open");
  shell.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  setTimeout(() => content.querySelector("textarea")?.focus(), 30);
}

async function submitFeedback(form) {
  const status = form.querySelector("#alpha-feedback-status");
  const submit = form.querySelector('button[type="submit"]');
  const data = new FormData(form);
  const message = String(data.get("message") || "").trim();
  const issueType = String(data.get("issue_type") || "feedback");
  if (!message) return;
  submit.disabled = true;
  if (status) status.textContent = "Enviando…";
  const syncLabel = document.querySelector("#sync-label")?.textContent || "";
  const result = await postRow("orbita_tester_feedback", {
    user_id: activeSession.user.id,
    screen: routeName(),
    issue_type: issueType,
    message,
    product_version: PRODUCT_VERSION,
    technical_context: {
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      online: navigator.onLine,
      sync_state: syncLabel.slice(0, 80)
    }
  });
  if (result.ok) {
    if (status) status.textContent = "Recibido. Gracias.";
    setTimeout(closeFeedback, 650);
  } else {
    if (status) status.textContent = "No pudimos enviarlo. Reintentá.";
    submit.disabled = false;
  }
}

function enhanceOpportunityDrawer() {
  const drawer = document.querySelector("#drawer-content .v06-evidence-drawer");
  if (!drawer || drawer.querySelector(".alpha-relevant-btn")) return;
  const footer = drawer.querySelector(".drawer-footer-actions");
  if (!footer) return;
  const relevant = document.createElement("button");
  relevant.type = "button";
  relevant.className = "btn btn-ghost alpha-relevant-btn";
  relevant.dataset.alphaAction = "mark-relevant";
  relevant.textContent = "✓ ME SIRVE";
  footer.prepend(relevant);
}

function opportunityContext() {
  const score = Number(document.querySelector("#drawer-content .agent-drawer-score strong")?.textContent || 0);
  const evidenceText = document.querySelector("#drawer-content .evidence-count")?.textContent || "";
  const evidenceCount = Number(evidenceText.match(/\d+/)?.[0] || 0);
  return {
    score_bucket: score >= 75 ? "75+" : score >= 50 ? "50-74" : "<50",
    evidence_count: evidenceCount
  };
}

async function markRelevant(button) {
  const result = await track("opportunity_marked_relevant", opportunityContext());
  if (result.ok || result.duplicate) {
    button.disabled = true;
    button.textContent = "✓ REGISTRADO";
  }
}

// Observe only UI shell changes. This adds PMF instrumentation without touching the product engine.
const observer = new MutationObserver(() => {
  ensureFeedbackEntry();
  enhanceOpportunityDrawer();
});
observer.observe(document.documentElement, { childList: true, subtree: true });

document.addEventListener("click", event => {
  const alpha = event.target.closest("[data-alpha-action]");
  if (alpha) {
    if (alpha.dataset.alphaAction === "open-feedback") openFeedback();
    else if (alpha.dataset.alphaAction === "close-feedback") closeFeedback();
    else if (alpha.dataset.alphaAction === "mark-relevant") markRelevant(alpha);
    return;
  }

  const action = event.target.closest("[data-action]");
  if (!action || !activeSession) return;
  if (action.dataset.action === "onboarding-finish" && action.dataset.value === "demo") setWorkspaceMode("demo");
  if (action.dataset.action === "onboarding-next") setWorkspaceMode("real");
  if (action.dataset.action === "erase-all" || action.dataset.action === "import-csv") setWorkspaceMode("real");

  if (action.dataset.action === "agent-opportunity") {
    track("opportunity_opened");
    setTimeout(enhanceOpportunityDrawer, 40);
  }
  if (action.dataset.action === "capture-kind" && action.dataset.kind === "interaction" && action.closest(".v06-evidence-drawer")) {
    track("action_started");
  }
});

document.addEventListener("submit", event => {
  const form = event.target;
  if (form.id === "alpha-feedback-form") {
    event.preventDefault();
    submitFeedback(form);
    return;
  }
  if (!activeSession || workspaceMode() === "demo") return;
  if (form.id === "onboarding-goal-form" || form.id === "relational-goal-form") {
    setWorkspaceMode("real");
    setTimeout(maybeTrackWorkspaceMilestones, 120);
  }
  if (form.id === "entity-form" && !form.dataset.id) {
    setTimeout(maybeTrackWorkspaceMilestones, 120);
  }
});

window.addEventListener("hashchange", () => {
  setTimeout(() => {
    ensureFeedbackEntry();
    maybeTrackWorkspaceMilestones();
  }, 80);
});

setInterval(activateForCloudUser, 2500);
setTimeout(activateForCloudUser, 250);
