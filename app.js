import { seedStore } from "./seed.js";
import {
  deepClone, makeId, normalizeStore, personById, interactionsFor, lastInteraction,
  relationshipState, openCommitmentsFor, opportunitiesFor,
  computeSignals, formatDate, formatRelative,
  peopleToCSV, reportToMarkdown, parseContactsCSV, auditStore, repairStore, buildRelationalOpportunities
} from "./core.js";
import { bootstrapAuth, cloudIsConfigured, hydrateUser, requestPasswordReset, signIn, signOut, signUp, updatePassword, useLocalMode } from "./auth.js";
import { CloudConflictError, deleteCloudAccount, loadCloudWorkspace, saveCloudWorkspace, testCloudConnection } from "./cloud.js";

const LEGACY_STORAGE_KEY = "orbita.store.v2";
const STORAGE_PREFIX = "orbita.store.v3";
const SYNC_META_PREFIX = "orbita.sync.v1";
const ROUTES = {
  today: "Hoy",
  people: "Personas",
  network: "Red",
  data: "Datos"
};

const ui = {
  peopleQuery: "",
  circleFilter: "Todos",
  networkFilter: "Todos",
  networkMode: "goal",
  captureDraft: "",
  capturePersonId: "",
  captureKind: "",
  dataTab: "info",
  onboardingStep: 0
};

let authSession = null;
let authRecovery = false;
let syncTimer = null;
let syncStatus = "local";
let cloudRevision = null;
let store = normalizeStore({});

const viewRoot = document.querySelector("#view-root");
const routeTitle = document.querySelector("#route-title");
const drawerShell = document.querySelector("#drawer-shell");
const drawerContent = document.querySelector("#drawer-content");
const modalShell = document.querySelector("#modal-shell");
const modalContent = document.querySelector("#modal-content");
const commandShell = document.querySelector("#command-shell");
const commandInput = document.querySelector("#command-input");
const commandResults = document.querySelector("#command-results");
const toastStack = document.querySelector("#toast-stack");
const sidebar = document.querySelector("#sidebar");
const mobileScrim = document.querySelector("#mobile-scrim");
const importFile = document.querySelector("#import-file");
const importCsvFile = document.querySelector("#import-csv-file");
const appRoot = document.querySelector("#app");
const authShell = document.querySelector("#auth-shell");
const authContent = document.querySelector("#auth-content");
const onboardingShell = document.querySelector("#onboarding-shell");
const onboardingContent = document.querySelector("#onboarding-content");
const syncChip = document.querySelector("#sync-chip");
const syncLabel = document.querySelector("#sync-label");

const iconPaths = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5M9.5 20v-6h5v6"/>',
  people: '<path d="M16 21v-1.8a4.2 4.2 0 0 0-4.2-4.2H5.2A4.2 4.2 0 0 0 1 19.2V21"/><circle cx="8.5" cy="7" r="4"/><path d="M18 8v6M21 11h-6"/>',
  network: '<circle cx="6" cy="7" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="12" cy="18" r="2.4"/><path d="m8.3 8 2.7 7.5M15.7 8l-2.6 7.5M8.5 7.1l7-.7"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4.2-4.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  note: '<path d="M5 3h10l4 4v14H5z"/><path d="M15 3v5h5M8 12h8M8 16h6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  brief: '<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="M10.2 4.5 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.8 4.5a2 2 0 0 0-3.6 0Z"/><path d="M12 9v4M12 17h.01"/>',
  link: '<path d="M10 13a5 5 0 0 0 7 .1l2-2A5 5 0 0 0 12 4l-1 1"/><path d="M14 11a5 5 0 0 0-7-.1l-2 2A5 5 0 0 0 12 20l1-1"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
  upload: '<path d="M12 17V5M7 10l5-5 5 5"/><path d="M5 21h14"/>',
  spark: '<path d="M12 3l1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z"/><path d="M5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Z"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.7 19.7 0 0 1-8.6-3.1 19.3 19.3 0 0 1-6-6A19.7 19.7 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c1 .3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  external: '<path d="M14 3h7v7M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
  more: '<circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  refresh: '<path d="M20 6v5h-5"/><path d="M4 18v-5h5"/><path d="M18.5 9A7 7 0 0 0 6 6l-2 2M5.5 15A7 7 0 0 0 18 18l2-2"/>',
  archive: '<path d="M3 5h18v4H3zM5 9v11h14V9M10 13h4"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.6 2.6 0 1 1 4.7 1.6c-.9 1-2.3 1.2-2.3 3"/><path d="M12 17h.01"/>',
  cloud: '<path d="M6 19h11a4 4 0 0 0 .6-8A6 6 0 0 0 6.2 9.5 4.8 4.8 0 0 0 6 19Z"/>',
  shield: '<path d="M12 3 5 6v5c0 4.5 2.8 8 7 10 4.2-2 7-5.5 7-10V6Z"/><path d="m9 12 2 2 4-4"/>',
  logout: '<path d="M10 5H5v14h5"/><path d="M14 8l4 4-4 4M8 12h10"/>'
};

function icon(name, size = 18) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.spark}</svg>`;
}

function hydrateIcons(scope = document) {
  scope.querySelectorAll("[data-icon]").forEach(el => { el.innerHTML = icon(el.dataset.icon); });
}

function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeExternalUrl(value = "") {
  try {
    const url = new URL(String(value));
    return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
  } catch {
    return "#";
  }
}

function passwordPolicyError(value = "") {
  const password = String(value);
  if (password.length < 12) return "Usá al menos 12 caracteres.";
  if (!/[a-z]/.test(password)) return "Agregá al menos una minúscula.";
  if (!/[A-Z]/.test(password)) return "Agregá al menos una mayúscula.";
  if (!/[0-9]/.test(password)) return "Agregá al menos un número.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Agregá al menos un símbolo.";
  return "";
}

function storageKey() {
  const scope = authSession?.mode === "cloud" ? authSession.user?.id : "local";
  return `${STORAGE_PREFIX}.${scope || "local"}`;
}

function syncMetaKey() {
  const scope = authSession?.mode === "cloud" ? authSession.user?.id : "local";
  return `${SYNC_META_PREFIX}.${scope || "local"}`;
}

function readSyncMeta() {
  if (authSession?.mode !== "cloud") return null;
  try {
    const raw = localStorage.getItem(syncMetaKey());
    const meta = raw ? JSON.parse(raw) : null;
    return meta && Number(meta.revision) >= 1 ? meta : null;
  } catch {
    return null;
  }
}

function writeSyncMeta(result, localUpdatedAt = store.updatedAt) {
  if (authSession?.mode !== "cloud" || !result?.revision) return;
  const meta = {
    revision: Number(result.revision),
    serverUpdatedAt: result.updatedAt || "",
    localUpdatedAt: localUpdatedAt || "",
    savedAt: new Date().toISOString()
  };
  try { localStorage.setItem(syncMetaKey(), JSON.stringify(meta)); } catch { /* cache metadata is best-effort */ }
}

function persistLocalSnapshot(snapshot = store) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(snapshot));
    return true;
  } catch {
    toast("No pude guardar en este navegador. Exportá un backup antes de continuar.", "warn");
    return false;
  }
}

function legacyStore() {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    return raw ? normalizeStore(JSON.parse(raw)) : null;
  } catch { return null; }
}

function hasLocalSnapshot() {
  try { return Boolean(localStorage.getItem(storageKey())); } catch { return false; }
}

function loadStore({ allowLegacy = false } = {}) {
  try {
    const raw = localStorage.getItem(storageKey());
    if (raw) return normalizeStore(JSON.parse(raw));
    if (allowLegacy) {
      const legacy = legacyStore();
      if (legacy) return legacy;
    }
  } catch { /* normalization fallback below */ }
  return normalizeStore({});
}

function setSyncStatus(status, label = "") {
  syncStatus = status;
  if (!syncChip || !syncLabel) return;
  syncChip.dataset.status = status;
  syncLabel.textContent = label || (status === "synced" ? "SINCRONIZADO" : status === "syncing" ? "GUARDANDO…" : status === "error" ? "ERROR SYNC" : "EN ESTE DISPOSITIVO");
}

function saveStore(message = "Guardado", { sync = true } = {}) {
  store.updatedAt = new Date().toISOString();
  persistLocalSnapshot(store);
  if (authSession?.mode === "cloud" && sync) scheduleCloudSync();
  else setSyncStatus("local");
  renderCurrentRoute();
  updateSignalBadge();
  if (message) toast(message);
}

function handleCloudConflict(error, { quiet = false } = {}) {
  console.error("ORBITA cloud conflict", error);
  setSyncStatus("error", "CONFLICTO");
  if (!quiet) toast("Hay cambios en otro dispositivo. ORBITA no los pisó. Exportá un backup y recargá para resolver.", "warn");
}

function scheduleCloudSync() {
  clearTimeout(syncTimer);
  setSyncStatus("syncing");
  syncTimer = setTimeout(async () => {
    try {
      const session = authSession;
      if (!session?.user?.id) return;
      const result = await saveCloudWorkspace(session.user.id, store, cloudRevision);
      cloudRevision = result.revision;
      writeSyncMeta(result);
      setSyncStatus("synced");
    } catch (error) {
      if (error instanceof CloudConflictError) return handleCloudConflict(error);
      console.error("ORBITA cloud sync", error);
      setSyncStatus("error");
      toast("Tus cambios quedaron guardados en este dispositivo, pero no pude sincronizarlos.", "warn");
    }
  }, 700);
}

async function syncNow({ quiet = false } = {}) {
  if (authSession?.mode !== "cloud" || !authSession.user?.id) {
    setSyncStatus("local");
    if (!quiet) toast("Tus datos están guardados en este dispositivo.");
    return false;
  }
  try {
    setSyncStatus("syncing");
    const result = await saveCloudWorkspace(authSession.user.id, store, cloudRevision);
    cloudRevision = result.revision;
    writeSyncMeta(result);
    setSyncStatus("synced");
    if (!quiet) toast("Espacio sincronizado");
    return true;
  } catch (error) {
    if (error instanceof CloudConflictError) { handleCloudConflict(error, { quiet }); return false; }
    console.error(error);
    setSyncStatus("error");
    if (!quiet) toast("No pude sincronizar. Tus datos de este dispositivo siguen a salvo.", "warn");
    return false;
  }
}

function currentRoute() {
  const route = location.hash.replace(/^#\/?/, "").split("?")[0];
  return ROUTES[route] ? route : "today";
}

function go(route) {
  location.hash = `#/${route}`;
}

function pageHead(index, title, description = "", actions = "") {
  const help = `<button class="icon-btn page-help" data-action="open-help" aria-label="Ayuda sobre ${esc(title)}" title="Ayuda">${icon("help",17)}</button>`;
  return `<header class="page-head"><div class="page-title-wrap"><span class="page-index">${esc(index)}</span><div><h1>${esc(title)}</h1>${description ? `<p>${esc(description)}</p>` : ""}</div></div><div class="page-actions">${actions}${help}</div></header>`;
}
function initials(name) {
  return String(name || "?").trim().split(/\s+/).slice(0, 2).map(x => x[0]?.toUpperCase()).join("") || "?";
}

function avatar(person, extra = "") {
  return `<div class="avatar ${extra}" aria-hidden="true">${esc(initials(person.name))}</div>`;
}

function personMeta(person) {
  return [person.role, person.company].filter(Boolean).join(" · ") || "Sin datos profesionales";
}

function statePill(rel) {
  return `<span class="state-pill ${rel.tone}"><span></span>${esc(rel.label)}</span>`;
}

function circlePill(circle) {
  return `<span class="circle-pill circle-${circle.toLowerCase().replaceAll("é", "e")}">${esc(circle)}</span>`;
}

function emptyState(iconName, title, body, action = "") {
  return `<div class="empty-state"><div class="empty-icon">${icon(iconName, 22)}</div><strong>${esc(title)}</strong><p>${esc(body)}</p>${action}</div>`;
}

function renderCurrentRoute() {
  if (!authSession) return;
  const route = currentRoute();
  routeTitle.textContent = ROUTES[route];
  document.querySelector("#profile-name").textContent = store.profile.name || "Mi espacio";
  document.querySelector("#profile-role").textContent = store.profile.role || "Founder";
  document.querySelectorAll("[data-route]").forEach(btn => { const active=btn.dataset.route===route; btn.classList.toggle("active",active); if(active) btn.setAttribute("aria-current","page"); else btn.removeAttribute("aria-current"); });
  const renderer={today:todayView,people:peopleView,network:networkView,data:dataView}[route];
  viewRoot.innerHTML=renderer(); hydrateIcons(viewRoot); viewRoot.focus({preventScroll:true}); closeMobileNav();
}
function updateSignalBadge() {
  const count = computeSignals(store).filter(signal => signal.type !== "meeting").length;
  const badge = document.querySelector("#today-badge");
  badge.textContent = count ? String(Math.min(count, 99)) : "";
  badge.hidden = !count;
}

function relationshipPulse() {
  if (!store.people.length) return 0;
  const inCadence = store.people.filter(person => ["good", "neutral"].includes(relationshipState(store, person).tone)).length;
  return Math.round((inCadence / store.people.length) * 100);
}
function topTags(limit=4){const counts=new Map();store.people.flatMap(p=>p.tags||[]).forEach(t=>counts.set(t,(counts.get(t)||0)+1));return [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([name,count])=>({name,count}))}
function interactionsThisWeek(){const d=new Date();d.setDate(d.getDate()-7);return store.interactions.filter(i=>new Date(i.date)>=d).length}
function donutBackground(counts){
  const values=[counts.Estratégico||0,counts.Cercano||0,counts.Activo||0,counts.Nuevo||0],total=Math.max(values.reduce((a,b)=>a+b,0),1),colors=["#2747ff","#dcff00","#62b36d","#413d36"];
  let cursor=0;const parts=[];values.forEach((value,index)=>{const start=cursor;cursor+=value/total*100;parts.push(`${colors[index]} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`)});
  if(values.every(v=>v===0))return "background:#252622";
  return `background:conic-gradient(${parts.join(",")})`;
}


function relationalGoalResults() {
  return buildRelationalOpportunities(store, store.profile.currentGoal || "");
}

function relationalGoalPanel() {
  const goal = store.profile.currentGoal || "";
  const results = relationalGoalResults();
  const hasGoal = Boolean(goal.trim());
  return `<section class="goal-intelligence" aria-labelledby="current-goal-title">
    <div class="goal-intelligence-head">
      <div>
        <span class="eyebrow">OBJETIVO ACTUAL</span>
        <h2 id="current-goal-title" class="current-goal-copy">${hasGoal ? esc(goal) : "Definí qué querés lograr ahora."}</h2>
        <p>ORBITA cruza este objetivo con evidencia que ya registraste en tu red. Si no hay sustento suficiente, no recomienda nada.</p>
      </div>
      <span class="agent-mode">EXPLICABLE</span>
    </div>
    <form id="relational-goal-form" class="goal-form-v06">
      <label for="relational-goal-input">CAMBIAR OBJETIVO</label>
      <div class="goal-input-row">
        <input id="relational-goal-input" name="goal" value="${esc(goal)}" maxlength="280" autocomplete="off" placeholder="Ej: Estoy levantando una ronda pre-seed" aria-label="Objetivo actual" />
        <button class="btn btn-ghost goal-change" type="button" data-action="focus-goal">CAMBIAR</button>
        <button class="btn btn-acid" type="submit">${icon("spark",15)} ANALIZAR MI RED</button>
      </div>
    </form>
    ${!hasGoal ? `<div class="goal-first-run"><span>OBJETIVO → RED → EVIDENCIA → OPORTUNIDAD → ACCIÓN</span><p>Empezá con un objetivo concreto. ORBITA trabaja únicamente con el contexto guardado.</p></div>` :
      results.length ? `<div class="ranked-opportunities">
        <div class="ranked-opportunities-head"><div><span class="eyebrow">OPORTUNIDADES PARA TU OBJETIVO</span><strong>${results.length} relación${results.length===1?"":"es"} con evidencia suficiente</strong></div><small>Ordenadas por relevancia contextual</small></div>
        <div class="opportunity-rank-list">${results.slice(0,3).map((result,index)=>relationalOpportunityCard(result,index)).join("")}</div>
        <button class="text-btn opportunity-all" data-action="open-goal-network">VER LA RED POR OBJETIVO →</button>
      </div>` :
      `<div class="agent-no-match"><strong>NO ENCONTRÉ EVIDENCIA SUFICIENTE</strong><p>Con los datos registrados no puedo sostener una recomendación para “${esc(goal)}”. Agregá contexto real o probá otro objetivo.</p></div>`
    }
  </section>`;
}

function relationalOpportunityCard(result, index) {
  const person = personById(store, result.contact_id);
  if (!person) return "";
  return `<article class="opportunity-rank ${index===0?"primary":""}">
    <div class="opportunity-rank-index"><span>RANK</span><strong>0${index+1}</strong></div>
    <div class="opportunity-rank-main">
      <span class="opportunity-person-meta">${esc(personMeta(person))}</span>
      <h3>${esc(person.name)}</h3>
      <p>${esc(result.reason)}</p>
      <div class="opportunity-proof"><span>${result.evidence.length} evidencia${result.evidence.length===1?"":"s"}</span><span>Confianza ${esc(result.confidence)}</span></div>
    </div>
    <div class="opportunity-rank-score"><strong>${result.relevance_score}</strong><span>RELEVANCIA</span></div>
    <div class="opportunity-rank-actions">
      <button class="btn btn-acid" data-action="agent-opportunity" data-id="${esc(person.id)}">VER POR QUÉ</button>
      <button class="btn btn-ghost" data-action="open-person" data-id="${esc(person.id)}">ABRIR RELACIÓN</button>
    </div>
  </article>`;
}

function attentionQueue() {
  const signals = computeSignals(store).filter(signal => signal.type !== "meeting").slice(0, 6);
  if (!signals.length) return `<div class="attention-empty"><strong>Tu red está al día.</strong><p>No hay señales urgentes. Registrá lo que pase para mantener contexto útil.</p><button class="text-btn" data-action="open-capture">CAPTURAR ALGO →</button></div>`;
  return `<div class="attention-list">${signals.map(signal => {
    const person = personById(store, signal.personId);
    if (!person) return "";
    const action = signal.type === "commitment"
      ? `data-action="edit-commitment" data-id="${esc(signal.entityId)}"`
      : `data-action="open-person" data-id="${esc(person.id)}"`;
    const actionLabel = signal.type === "commitment" ? "RESOLVER" : "ABRIR";
    return `<button class="attention-row ${signal.tone==="risk"?"risk":""}" ${action}>
      <span class="attention-type">${esc(signal.title)}</span>
      <span class="attention-person"><strong>${esc(person.name)}</strong><small>${esc(signal.body)}</small></span>
      <span class="attention-when">${esc(signal.meta)}</span>
      <span class="attention-action">${actionLabel} ${icon("arrow",14)}</span>
    </button>`;
  }).join("")}</div>`;
}

function todayView(){
  const contextualized=store.people.filter(p=>Boolean(p.relation||p.notes||(p.tags||[]).length)).length;
  if(!store.people.length)return `${pageHead("01","HOY","Inteligencia y acción sobre tu red")}<section class="onboarding-card v06-empty"><div class="onboarding-mark">${icon("network",30)}</div><span class="eyebrow">TU ÓRBITA ESTÁ VACÍA</span><h2>Agregá una relación para empezar a construir contexto.</h2><p>ORBITA necesita hechos registrados para poder detectar señales y oportunidades reales.</p><button class="btn btn-acid" data-action="capture-kind" data-kind="person">${icon("plus")} AGREGAR PRIMERA RELACIÓN</button></section>`;
  return `${pageHead("01","HOY","Tu sistema operativo relacional",`<span class="date-chip">${esc(new Intl.DateTimeFormat("es-AR",{day:"2-digit",month:"short",year:"numeric"}).format(new Date()).toUpperCase())}</span>`)}
    ${relationalGoalPanel()}
    <section class="attention-section">
      <div class="section-head v06-section-head"><div><span class="eyebrow">NECESITA TU ATENCIÓN</span><h2>Qué merece movimiento ahora</h2></div><button class="text-btn" data-action="open-capture">CAPTURAR +</button></div>
      ${attentionQueue()}
    </section>
    <section class="today-secondary single">
      <div class="today-context">
        <span class="eyebrow">MEMORIA RELACIONAL</span>
        <strong>${contextualized}<small> / ${store.people.length} relaciones con contexto</small></strong>
        <p>${store.interactions.length} interacciones registradas · ${store.commitments.filter(c=>c.status!=="done").length} compromisos abiertos.</p>
      </div>
    </section>`;
}

function peopleView(){
  const q=ui.peopleQuery.trim().toLowerCase();
  const people=store.people.filter(p=>ui.circleFilter==="Todos"||p.circle===ui.circleFilter).filter(p=>!q||[p.name,p.role,p.company,p.city,p.tags.join(" "),p.relation].join(" ").toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name,"es"));
  return `${pageHead("02","PERSONAS","Relaciones con historia, no registros de CRM")}
    <div class="people-toolbar v06-people-toolbar">
      <label class="inline-search">${icon("search",17)}<input id="people-search" value="${esc(ui.peopleQuery)}" placeholder="Buscar personas, empresas o contexto…" /></label>
      <button class="btn btn-primary" data-action="capture-kind" data-kind="person">${icon("plus")} NUEVA RELACIÓN</button>
    </div>
    <div class="filter-chips v06-filter-chips">${["Todos","Cercano","Estratégico","Activo","Nuevo"].map(c=>`<button class="filter-chip ${ui.circleFilter===c?"active":""}" data-action="people-filter" data-value="${esc(c)}">${esc(c)}</button>`).join("")}<span class="result-count">${people.length} RELACIONES</span></div>
    ${people.length?`<section class="people-list v06-people-list">${people.map(personRow).join("")}</section>`:emptyState("search","Sin relaciones que coincidan","Probá otro término o agregá una relación.",`<button class="btn btn-primary" data-action="capture-kind" data-kind="person">Agregar relación</button>`)}
    <button class="import-strip v06-import-strip" data-action="import-csv">${icon("upload",22)}<div><strong>IMPORTAR CONTACTOS</strong><span>CSV · después podés enriquecer cada relación con contexto real</span></div>${icon("arrow",15)}</button>`;
}

function personRow(p){
  const last=lastInteraction(store,p.id),rel=relationshipState(store,p),pending=openCommitmentsFor(store,p.id).length;
  return `<button type="button" class="person-row v06-person-row" data-action="open-person" data-id="${esc(p.id)}" aria-label="Abrir relación con ${esc(p.name)}">
    <div class="person-main">${avatar(p)}<div><strong>${esc(p.name)}</strong><span>${esc(personMeta(p))}</span></div></div>
    <div class="person-cell-secondary"><span>ÚLTIMO CONTACTO</span><strong>${esc(last?formatRelative(last.date):"Sin historial")}</strong></div>
    <div class="person-cell-secondary"><span>ESTADO</span>${statePill(rel)}</div>
    <div class="person-relationship-meta">${circlePill(p.circle)}${pending?`<span class="pending-count">${pending} pendiente${pending===1?"":"s"}</span>`:""}</div>
    <span class="row-open">${icon("arrow",16)}</span>
  </button>`;
}

function networkView(){
  const goal=store.profile.currentGoal||"";
  const hasGoal=Boolean(goal.trim());
  const goalMode=ui.networkMode==="goal";

  if(goalMode&&!hasGoal){
    return `${pageHead("03","RED","Leé tu red desde lo que querés lograr")}
      <section class="network-goal-empty">
        <span class="eyebrow">RED PARA TU OBJETIVO</span>
        <h2>Definí un objetivo para leer tu red.</h2>
        <p>ORBITA necesita saber qué querés lograr para determinar qué relaciones son relevantes ahora.</p>
        <div class="network-empty-actions">
          <button class="btn btn-acid" data-action="define-goal">DEFINIR OBJETIVO</button>
          <button class="btn btn-ghost" data-action="network-mode" data-value="all">VER RED COMPLETA</button>
        </div>
      </section>`;
  }

  const people=store.people.filter(p=>ui.networkFilter==="Todos"||p.circle===ui.networkFilter);
  const circles=["Cercano","Estratégico","Activo","Nuevo"];
  const radii={Cercano:18,"Estratégico":29,Activo:39,Nuevo:47};
  const grouped=Object.fromEntries(circles.map(c=>[c,people.filter(p=>p.circle===c)]));
  const ranked=goalMode&&hasGoal?buildRelationalOpportunities(store,goal):[];
  const rankMap=new Map(ranked.map((item,index)=>[item.contact_id,{...item,rank:index+1}]));
  const nodes=circles.flatMap(c=>grouped[c].map((p,i,a)=>{
    const angle=((Math.PI*2)/Math.max(a.length,1))*i-Math.PI/2+circles.indexOf(c)*.55;
    const r=radii[c],match=rankMap.get(p.id);
    const relevanceClass=goalMode?(match?"goal-relevant":"goal-muted"):"";
    const rankLabel=match?` · #${match.rank} para tu objetivo`:"";
    return `<button class="network-node circle-node-${c.toLowerCase().replaceAll("é","e")} ${relevanceClass}" style="left:${50+Math.cos(angle)*r}%;top:${50+Math.sin(angle)*r}%" data-action="open-person" data-id="${esc(p.id)}" aria-label="Abrir ${esc(p.name)}" title="${esc(p.name)} · ${esc(personMeta(p))}${esc(rankLabel)}"><span class="node-avatar">${esc(initials(p.name))}</span>${match?`<b class="node-rank">0${match.rank}</b>`:""}</button>`;
  })).join("");
  const tags=topTags(4);
  const visibleSignals=computeSignals(store).filter(signal=>signal.type!=="meeting").length;

  return `${pageHead("03","RED",goalMode?"Red para tu objetivo":"Vista completa de tus relaciones")}
    <section class="network-command goal-first-command">
      <div class="network-goal-context">
        <span>${goalMode?"RED PARA TU OBJETIVO":"RED COMPLETA"}</span>
        <strong>${goalMode?esc(goal):`${store.people.length} relaciones registradas`}</strong>
        ${goalMode?`<small>${store.people.length} relaciones analizadas · ${ranked.length} con evidencia relevante</small>`:""}
      </div>
      <div class="network-secondary-actions">
        ${goalMode?`<button class="btn btn-ghost" data-action="network-mode" data-value="all">VER RED COMPLETA</button>`:`<button class="btn btn-acid" data-action="network-mode" data-value="goal" ${!hasGoal?"disabled":""}>VOLVER A RED POR OBJETIVO</button>`}
        <button class="btn btn-ghost" data-action="cycle-network-filter">${icon("filter")} ${esc(ui.networkFilter)}</button>
      </div>
    </section>
    <div class="network-v06-layout">
      <section class="network-stage">
        <div class="orbit-map v06-orbit-map">
          <i class="orbit-ring ring-1"></i><i class="orbit-ring ring-2"></i><i class="orbit-ring ring-3"></i><i class="orbit-ring ring-4"></i>
          <div class="network-center"><strong>TÚ</strong><span>${esc(store.profile.role||"Founder")}</span></div>${nodes}
        </div>
        <div class="network-legend">${circles.map(c=>`<span class="legend-${c.toLowerCase().replaceAll("é","e")}"><i></i>${esc(c)}</span>`).join("")}</div>
      </section>
      <aside class="network-intelligence">
        <div><span class="eyebrow">${goalMode?"RELEVANCIA CONTEXTUAL":"LECTURA DE RED"}</span><h2>${goalMode?"Relaciones relevantes para lo que querés lograr":`${store.people.length} relaciones registradas`}</h2></div>
        ${goalMode ? (ranked.length?`<div class="network-ranked-mini">${ranked.slice(0,5).map((item,index)=>{const p=personById(store,item.contact_id);return p?`<button data-action="agent-opportunity" data-id="${esc(p.id)}"><span>0${index+1}</span><div><strong>${esc(p.name)}</strong><small>${esc(item.reason)}</small></div><b>${item.relevance_score}</b></button>`:""}).join("")}</div>`:`<p class="muted-copy">No hay relaciones con evidencia suficiente para este objetivo.</p>`) :
        `<div class="network-readout"><div><strong>${new Set(store.people.map(p=>p.company).filter(Boolean)).size}</strong><span>organizaciones</span></div><div><strong>${store.people.filter(p=>["Cercano","Estratégico"].includes(p.circle)).length}</strong><span>relaciones cercanas / estratégicas</span></div><div><strong>${visibleSignals}</strong><span>señales activas</span></div></div><div class="topics-block"><span class="eyebrow">TEMAS PRESENTES</span><div class="topic-chips">${tags.map(t=>`<span class="topic-chip">${esc(t.name)} · ${t.count}</span>`).join("")||`<span class="muted-copy">Todavía no hay tags.</span>`}</div></div>`}
        <p class="network-trust-note">La prominencia visual representa contexto y relevancia para una tarea; no el valor de una persona.</p>
      </aside>
    </div>`;
}

function activityRows(limit=5){return [...store.interactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,limit).map(i=>{const p=personById(store,i.personId);return `<article class="recent-row"><button class="recent-main" data-action="edit-interaction" data-id="${esc(i.id)}"><span class="soft-icon">${icon("note",13)}</span><span><strong>${esc(i.title)}</strong><span>${esc(p?.name||"")} · ${esc(formatRelative(i.date))}</span></span><span class="activity-type">${esc(i.type)}</span></button><button class="icon-btn" data-action="open-person" data-id="${esc(i.personId)}" aria-label="Abrir persona" title="Abrir relación">${icon("arrow",14)}</button></article>`}).join("")}
function dataSummary(){const counts=Object.fromEntries(["Cercano","Estratégico","Activo","Nuevo"].map(c=>[c,store.people.filter(p=>p.circle===c).length])),total=Math.max(store.people.length,1),recent=store.people.filter(p=>Date.now()-new Date(p.createdAt)<30*864e5).length,openCommitments=store.commitments.filter(c=>c.status!=="done").length;return `<div class="metric-grid"><div class="metric-card blue"><small>PERSONAS EN TU RED</small><strong>${store.people.length}</strong><span>contexto registrado</span></div><div class="metric-card paper"><small>NUEVAS ESTE MES</small><strong>${recent}</strong><span>altas registradas</span></div><div class="metric-card acid"><small>INTERACCIONES ESTA SEMANA</small><strong>${interactionsThisWeek()}</strong><span>actividad registrada</span></div><div class="metric-card"><small>COMPROMISOS ABIERTOS</small><strong>${openCommitments}</strong><span>pendientes reales</span></div></div><div class="data-bottom"><section class="data-panel"><span class="eyebrow">ACTIVIDAD RECIENTE</span>${activityRows(5)||`<p class="muted-copy">Sin actividad.</p>`}</section><section class="data-panel"><span class="eyebrow">DISTRIBUCIÓN DE TU RED</span><div class="dist-wrap"><div class="donut-holder"><div class="donut" style="${donutBackground(counts)}"></div><div class="donut-center"><strong>${store.people.length}</strong><span>NODOS</span></div></div><div class="dist-legend">${[["#2747ff","Estratégicas",counts.Estratégico],["#dcff00","Cercanas",counts.Cercano],["#62b36d","Activas",counts.Activo],["#6d685f","Nuevas",counts.Nuevo]].map(([c,n,v])=>`<div><i style="background:${c}"></i><span>${n}</span><strong>${Math.round(v/total*100)}%</strong></div>`).join("")}</div></div></section><section class="data-panel"><span class="eyebrow">INSIGHTS CLAVE</span><div class="insight-list"><div class="insight">${icon("link",15)}<div><strong>${store.people.filter(p=>relationshipState(store,p).tone==="good").length} relaciones están al día</strong><span>Según la cadencia que definiste.</span></div></div><div class="insight">${icon("clock",15)}<div><strong>${computeSignals(store).filter(signal=>signal.type!=="meeting").length} señales requieren atención</strong><span>Calculadas desde fechas y pendientes reales.</span></div></div><div class="insight">${icon("people",15)}<div><strong>${topTags(1)[0]?.name||"Sin tema dominante"}</strong><span>Es el tag más repetido en tu red.</span></div></div></div></section></div>`}
function dataFiles(){return `<div class="data-bottom" style="grid-template-columns:1fr 1fr"><section class="data-panel"><span class="eyebrow">EXPORTAR</span><h2>Descargar información</h2><div class="export-list"><button data-action="export-json"><span class="export-icon">${icon("download")}</span><div><strong>Backup completo</strong><span>JSON reimportable</span></div>${icon("arrow",14)}</button><button data-action="export-csv"><span class="export-icon">${icon("download")}</span><div><strong>Personas</strong><span>CSV para Excel / Sheets</span></div>${icon("arrow",14)}</button><button data-action="export-report"><span class="export-icon">${icon("download")}</span><div><strong>Informe de red</strong><span>Markdown de lectura humana</span></div>${icon("arrow",14)}</button></div></section><section class="data-panel"><span class="eyebrow">IMPORTAR</span><h2>Traer información</h2><div class="export-list"><button data-action="import-json"><span class="export-icon">${icon("upload")}</span><div><strong>Backup ORBITA</strong><span>Reemplaza el estado actual tras confirmar</span></div>${icon("arrow",14)}</button><button data-action="import-csv"><span class="export-icon">${icon("upload")}</span><div><strong>Contactos CSV</strong><span>Agrega personas a tu red</span></div>${icon("arrow",14)}</button></div></section></div>`}
function dataInfo(){
  return `<div class="data-v06-stack"><section class="data-intro"><span class="eyebrow">MI INFORMACIÓN</span><h2>Tu red es portable y sigue bajo tu control.</h2><p>Importá, exportá y respaldá tu workspace sin mezclar herramientas técnicas con el uso diario.</p></section>${dataFiles()}</div>`;
}

function dataSystem(){
  const audit=auditStore(store);
  return `<div class="data-v06-stack"><section class="data-panel v06-system-health"><div class="section-head"><div><span class="eyebrow">SISTEMA</span><h2>${audit.ok?"Workspace consistente":"Hay datos para revisar"}</h2></div><span class="audit-badge ${audit.ok?"good":"risk"}">${audit.errors} ERR · ${audit.warnings} AVISOS</span></div><p class="muted-copy">ORBITA revisa referencias, IDs y fechas sin inventar ni completar información.</p><div class="system-actions"><button class="btn btn-primary" data-action="open-audit">${icon("shield")} ABRIR AUDITORÍA</button><button class="btn btn-ghost" data-action="reset-demo">${icon("refresh")} RESTAURAR DEMO</button></div></section><section class="data-panel"><div class="section-head"><div><span class="eyebrow">ACTIVIDAD</span><h2>Registros recientes</h2></div><button class="text-btn" data-action="capture-kind" data-kind="interaction">REGISTRAR +</button></div>${activityRows(12)||`<p class="muted-copy">Sin actividad registrada.</p>`}</section></div>`;
}

function dataAccount(){
  const email=authSession?.user?.email||"—",cloud=authSession?.mode==="cloud";
  return `<div class="data-v06-stack"><section class="data-panel account-panel v06-account-panel"><div class="section-head"><div><span class="eyebrow">CUENTA</span><h2>${esc(store.profile.name)}</h2><p class="muted-copy">${esc(store.profile.role)} · ${esc(store.profile.focus)}</p></div><span class="account-state ${cloud?"cloud":"local"}">${cloud?icon("cloud",14):icon("database",14)} ${cloud?"SYNC ACTIVO":"EN ESTE DISPOSITIVO"}</span></div><dl class="profile-dl"><div><dt>Email</dt><dd>${esc(email)}</dd></div><div><dt>Guardado</dt><dd>${cloud?"Cuenta conectada + copia en este dispositivo":"Datos en este dispositivo"}</dd></div><div><dt>Estado</dt><dd>${cloud?esc(syncStatus):"Disponible"}</dd></div></dl><div class="account-actions">${cloud?`<button class="btn btn-primary" data-action="sync-now">${icon("cloud")} SINCRONIZAR</button>`:""}<button class="btn btn-ghost" data-action="edit-profile">EDITAR PERFIL</button><button class="btn btn-ghost" data-action="sign-out">${icon("logout")} SALIR</button></div></section>${cloud?`<section class="danger-card"><span class="eyebrow">ZONA DE RIESGO</span><h2>Eliminar cuenta cloud</h2><p class="muted-copy">La eliminación requiere confirmación explícita y borra el workspace asociado.</p><button class="btn btn-danger" data-action="delete-account">${icon("shield")} ELIMINAR CUENTA</button></section>`:""}</div>`;
}

function dataAdvanced(){
  return `<div class="data-v06-stack"><section class="data-intro"><span class="eyebrow">AVANZADO</span><h2>Lectura de workspace y herramientas secundarias.</h2><p>Esta sección concentra información que puede ser útil sin competir con la experiencia principal.</p></section>${dataSummary()}<section class="danger-card"><span class="eyebrow">MANTENIMIENTO</span><h2>Empezar con un workspace vacío</h2><p class="muted-copy">Hacé un backup antes. Esta acción reemplaza los datos actuales.</p><button class="btn btn-danger" data-action="erase-all">${icon("trash")} EMPEZAR VACÍO</button></section></div>`;
}

function dataView(){
  const tab=["info","system","account","advanced"].includes(ui.dataTab)?ui.dataTab:"info";
  const content=tab==="info"?dataInfo():tab==="system"?dataSystem():tab==="account"?dataAccount():dataAdvanced();
  return `${pageHead("04","DATOS","Control, portabilidad y herramientas avanzadas")}<div class="data-layout v06-data-layout"><aside class="data-nav v06-data-nav">${[["info","archive","Mi información"],["system","shield","Sistema"],["account","person","Cuenta"],["advanced","database","Avanzado"]].map(([id,ic,label])=>`<button class="${tab===id?"active":""}" data-action="data-tab" data-value="${id}">${icon(ic,14)} ${label}</button>`).join("")}</aside><section class="data-content">${content}</section></div>`;
}

function relationshipTimeline(person){
  const items=[
    ...interactionsFor(store,person.id).map(i=>({date:i.date,label:"INTERACCIÓN",title:i.title,body:i.notes||i.type,action:"edit-interaction",id:i.id,tone:"human"})),
    ...store.commitments.filter(c=>c.personId===person.id).map(c=>({date:c.dueDate||c.createdAt||"",label:"COMPROMISO",title:c.title,body:c.status==="done"?"Cumplido":"Pendiente",action:"edit-commitment",id:c.id,tone:c.status==="done"?"done":"commitment"})),
    ...store.opportunities.filter(o=>o.personId===person.id).map(o=>({date:o.createdAt||"",label:"OPORTUNIDAD",title:o.title,body:[o.stage,o.notes].filter(Boolean).join(" · "),action:"edit-opportunity",id:o.id,tone:"opportunity"}))
  ].filter(item=>item.date).sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(!items.length)return `<p class="muted-copy">Todavía no hay historia registrada.</p>`;
  return `<div class="relationship-timeline">${items.map(item=>`<button class="relationship-event ${item.tone}" data-action="${item.action}" data-id="${esc(item.id)}"><span class="relationship-event-date">${esc(formatDate(item.date))}</span><i></i><span class="relationship-event-copy"><small>${esc(item.label)}</small><strong>${esc(item.title)}</strong><span>${esc(item.body||"")}</span></span>${icon("arrow",13)}</button>`).join("")}</div>`;
}

function openPersonDrawer(personId) {
  const person=personById(store,personId);
  if(!person)return toast("La persona ya no existe.","warn");
  const commitments=store.commitments.filter(c=>c.personId===person.id),openCommitments=commitments.filter(c=>c.status!=="done");
  const opportunities=store.opportunities.filter(o=>o.personId===person.id),openOpportunities=opportunities.filter(o=>o.stage!=="Cerrada");
  const rel=relationshipState(store,person),last=lastInteraction(store,person.id);
  const goal=store.profile.currentGoal||"",goalMatch=goal.trim()?buildRelationalOpportunities(store,goal).find(item=>item.contact_id===person.id):null;
  drawerContent.innerHTML=`
    <div class="drawer-head v06-person-head"><button class="icon-btn drawer-close" data-action="close-drawer" aria-label="Cerrar">${icon("close")}</button><div class="drawer-person">${avatar(person,"avatar-lg")}<div><span class="eyebrow">RELACIÓN</span><div class="drawer-title-line"><h2>${esc(person.name)}</h2></div><p>${esc(personMeta(person))}${person.city?` · ${esc(person.city)}`:""}</p></div></div><div class="drawer-actions"><button class="btn btn-ghost" data-action="edit-person" data-id="${esc(person.id)}">${icon("edit")} EDITAR</button><button class="btn btn-primary" data-action="capture-for-person" data-id="${esc(person.id)}">${icon("plus")} REGISTRAR</button></div></div>
    <div class="drawer-body v06-person-body">
      <section class="relationship-hero-meta"><div>${circlePill(person.circle)}</div><div>${statePill(rel)}</div><div><span>ÚLTIMO CONTACTO</span><strong>${esc(last?formatRelative(last.date):"Sin historial")}</strong></div></section>
      <section class="drawer-section person-now"><div class="section-head"><div><span class="eyebrow">AHORA</span><h3>Por qué esta relación importa hoy</h3></div></div>
        <div class="person-now-grid">
          ${openCommitments[0]?`<button data-action="edit-commitment" data-id="${esc(openCommitments[0].id)}"><small>COMPROMISO ABIERTO</small><strong>${esc(openCommitments[0].title)}</strong><span>${openCommitments[0].dueDate?esc(formatDate(openCommitments[0].dueDate)):"Sin fecha"}</span></button>`:""}
          ${openOpportunities[0]?`<button data-action="edit-opportunity" data-id="${esc(openOpportunities[0].id)}"><small>OPORTUNIDAD</small><strong>${esc(openOpportunities[0].title)}</strong><span>${esc(openOpportunities[0].stage)}</span></button>`:""}
          ${goalMatch?`<button class="goal-match" data-action="agent-opportunity" data-id="${esc(person.id)}"><small>OBJETIVO ACTUAL</small><strong>${goalMatch.relevance_score} relevancia</strong><span>${esc(goalMatch.reason)}</span></button>`:""}
          ${!nextMeeting&&!openCommitments.length&&!openOpportunities.length&&!goalMatch?`<div class="person-now-empty"><strong>Sin movimiento pendiente.</strong><span>Registrá una interacción cuando haya contexto nuevo.</span></div>`:""}
        </div>
      </section>
      <section class="drawer-section"><div class="section-head"><div><span class="eyebrow">CONTEXTO</span><h3>Qué conviene recordar</h3></div><button class="text-btn" data-action="edit-person" data-id="${esc(person.id)}">EDITAR</button></div><p class="context-copy">${esc(person.relation||"Todavía no agregaste contexto relacional.")}</p>${person.tags.length?`<div class="tag-list">${person.tags.map(t=>`<span>${esc(t)}</span>`).join("")}</div>`:""}${person.notes?`<div class="private-note"><span>NOTA PRIVADA</span><p>${esc(person.notes)}</p></div>`:""}</section>
      <section class="drawer-section"><div class="section-head"><div><span class="eyebrow">COMPROMISOS</span><h3>Pendientes y cumplidos</h3></div><button class="text-btn" data-action="capture-kind" data-kind="commitment" data-person-id="${esc(person.id)}">AGREGAR +</button></div>${commitments.length?`<div class="mini-list">${commitments.map(c=>`<div class="mini-row ${c.status==="done"?"done":""}"><button class="check-btn ${c.status==="done"?"checked":""}" data-action="toggle-commitment" data-id="${esc(c.id)}">${icon("check",14)}</button><div><strong>${esc(c.title)}</strong><span>${c.dueDate?formatDate(c.dueDate):"Sin fecha"}</span></div><button class="icon-btn" data-action="edit-commitment" data-id="${esc(c.id)}">${icon("edit",15)}</button></div>`).join("")}</div>`:`<p class="muted-copy">Sin compromisos registrados.</p>`}</section>
      <section class="drawer-section"><div class="section-head"><div><span class="eyebrow">OPORTUNIDADES</span><h3>Posibilidades abiertas</h3></div><button class="text-btn" data-action="capture-kind" data-kind="opportunity" data-person-id="${esc(person.id)}">AGREGAR +</button></div>${opportunities.length?`<div class="opportunity-list">${opportunities.map(o=>`<button data-action="edit-opportunity" data-id="${esc(o.id)}"><div><strong>${esc(o.title)}</strong><span>${esc(o.notes||"Sin notas")}</span></div><span class="stage-pill">${esc(o.stage)}</span></button>`).join("")}</div>`:`<p class="muted-copy">Sin oportunidades registradas.</p>`}</section>
      <section class="drawer-section"><div class="section-head"><div><span class="eyebrow">HISTORIA</span><h3>Memoria longitudinal</h3></div><button class="text-btn" data-action="capture-kind" data-kind="interaction" data-person-id="${esc(person.id)}">REGISTRAR +</button></div>${relationshipTimeline(person)}</section>
      <section class="drawer-section contact-section"><div class="section-head"><div><span class="eyebrow">DATOS DE CONTACTO</span><h3>Información secundaria</h3></div><button class="text-btn" data-action="edit-person" data-id="${esc(person.id)}">EDITAR</button></div><div class="contact-grid">${person.email?`<a href="mailto:${esc(person.email)}">${icon("mail")}<span>${esc(person.email)}</span></a>`:`<span>${icon("mail")}<span>Sin email</span></span>`}${person.phone?`<a href="tel:${esc(person.phone)}">${icon("phone")}<span>${esc(person.phone)}</span></a>`:`<span>${icon("phone")}<span>Sin teléfono</span></span>`}${person.linkedin?`<a href="${esc(safeExternalUrl(person.linkedin))}" target="_blank" rel="noreferrer">${icon("external")}<span>LinkedIn</span></a>`:`<span>${icon("external")}<span>Sin LinkedIn</span></span>`}</div></section>
      <section class="drawer-danger"><button class="text-danger" data-action="delete-person" data-id="${esc(person.id)}">${icon("trash",15)} Eliminar persona y sus registros</button></section>
    </div>`;
  openDrawer();
}

function openAgentOpportunity(personId) {
  const goal=store.profile.currentGoal||"";
  const result=buildRelationalOpportunities(store,goal).find(item=>item.contact_id===personId);
  const person=personById(store,personId);
  if(!result||!person)return toast("No hay evidencia suficiente para esta oportunidad.","warn");
  drawerContent.innerHTML=`
    <div class="drawer-head agent-evidence-head">
      <button class="icon-btn drawer-close" data-action="close-drawer" aria-label="Cerrar">${icon("close")}</button>
      <div><span class="eyebrow">POR QUÉ ORBITA TE MUESTRA ESTA RELACIÓN</span><h2>${esc(person.name)}</h2><p>${esc(personMeta(person))}</p></div>
      <div class="agent-drawer-score"><strong>${result.relevance_score}</strong><span>RELEVANCIA</span></div>
    </div>
    <div class="drawer-body agent-drawer v06-evidence-drawer">
      <section class="agent-goal-context"><span class="eyebrow">OBJETIVO ACTUAL</span><strong>${esc(goal)}</strong><p>${esc(result.reason)}</p></section>
      <section class="drawer-section fact-zone"><div class="section-head"><div><span class="eyebrow">EVIDENCIA FACTUAL</span><h3>Lo que está registrado</h3></div><span class="evidence-count">${result.evidence.length} fuente${result.evidence.length===1?"":"s"}</span></div><div class="evidence-list">${result.evidence.map(fact=>`<article><span>${esc(fact.source)}</span><p>${esc(fact.text)}</p>${fact.date?`<time>${esc(formatDate(fact.date))}</time>`:""}</article>`).join("")}</div></section>
      <section class="drawer-section inference-box"><span class="eyebrow">INFERENCIA DE ORBITA</span><p>${esc(result.inference)}</p><small>Confianza ${esc(result.confidence)} · Esta capa interpreta evidencia; no la reemplaza.</small></section>
      <section class="next-action-box"><span class="eyebrow">SIGUIENTE MOVIMIENTO</span><strong>${esc(result.suggested_action)}</strong></section>
      <div class="drawer-footer-actions"><button class="btn btn-primary" data-action="open-person" data-id="${esc(person.id)}">${icon("person")} ABRIR RELACIÓN</button><button class="btn btn-ghost" data-action="capture-kind" data-kind="interaction" data-person-id="${esc(person.id)}">${icon("note")} REGISTRAR INTERACCIÓN</button></div>
    </div>`;
  openDrawer();
}

function openCapture(personId="") {
  ui.capturePersonId=personId;
  ui.captureKind="";
  ui.captureDraft="";
  modalContent.innerHTML=`
    <div class="modal-head capture-head"><div><span class="eyebrow">CAPTURAR</span><h2>¿Qué pasó?</h2><p>Escribí contexto libre y después elegí cómo guardarlo. ORBITA mantiene estructura y trazabilidad; no inventa campos automáticamente.</p></div><button class="icon-btn" data-action="close-modal">${icon("close")}</button></div>
    <div class="capture-v06">
      <label class="capture-draft-label" for="capture-draft"><span>CONTEXTO RÁPIDO</span><textarea id="capture-draft" rows="5" placeholder="Me crucé con Pablo en un evento. Está buscando startups para invertir. Le prometí mandarle la demo el lunes."></textarea></label>
      <div class="capture-type-label"><span>¿CÓMO QUERÉS GUARDARLO?</span><small>Elegí un tipo para completar solo los campos necesarios.</small></div>
      <div class="capture-types">
        ${captureType("person","person","Persona","Crear una nueva relación")}
        ${captureType("interaction","note","Interacción","Registrar lo que pasó")}
        ${captureType("commitment","check","Compromiso","Guardar un próximo paso")}
        ${captureType("opportunity","spark","Oportunidad","Registrar una posibilidad")}
      </div>
    </div>`;
  openModal();
}

function applyCaptureDraft(kind,draft){
  if(!draft)return;
  const form=document.querySelector("#entity-form");
  if(!form)return;
  const firstLine=draft.split(/[.!?\n]/)[0].trim().slice(0,120);
  const title=form.elements?.title;
  const notes=form.elements?.notes;
  const relation=form.elements?.relation;
  if(title&&!title.value)title.value=firstLine||draft.slice(0,120);
  if(notes&&!notes.value)notes.value=draft;
  if(kind==="person"&&relation&&!relation.value)relation.value=draft;
}

function captureType(kind, iconName, title, body) {
  return `<button class="capture-type" data-action="capture-kind" data-kind="${kind}" ${ui.capturePersonId ? `data-person-id="${esc(ui.capturePersonId)}"` : ""}><span>${icon(iconName,22)}</span><div><strong>${esc(title)}</strong><p>${esc(body)}</p></div>${icon("arrow",16)}</button>`;
}

function personOptions(selected = "") {
  return `<option value="">Elegí una persona</option>${[...store.people].sort((a,b)=>a.name.localeCompare(b.name,"es")).map(p => `<option value="${esc(p.id)}" ${p.id === selected ? "selected" : ""}>${esc(p.name)}${p.company ? ` · ${esc(p.company)}` : ""}</option>`).join("")}`;
}

function localDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function formShell(kind, title, subtitle, fields, id = "") {
  return `<div class="modal-head"><div><span class="eyebrow">${id ? "EDITAR" : "NUEVO REGISTRO"}</span><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div><button class="icon-btn" type="button" data-action="close-modal">${icon("close")}</button></div><form class="entity-form" id="entity-form" data-kind="${esc(kind)}" data-id="${esc(id)}">${fields}<div class="form-footer">${id && kind !== "profile" ? `<button class="text-danger form-delete" type="button" data-action="delete-entity" data-kind="${esc(kind)}" data-id="${esc(id)}">${icon("trash",15)} Eliminar</button>` : `<span></span>`}<div><button class="btn btn-ghost" type="button" data-action="close-modal">Cancelar</button><button class="btn btn-primary" type="submit">Guardar</button></div></div></form>`;
}

function field(label, name, value = "", opts = {}) {
  const { type = "text", required = false, placeholder = "", wide = false, hint = "", min = "", max = "" } = opts;
  return `<label class="form-field ${wide ? "wide" : ""}"><span>${esc(label)}${required ? " *" : ""}</span><input type="${esc(type)}" name="${esc(name)}" value="${esc(value)}" ${required ? "required" : ""} ${placeholder ? `placeholder="${esc(placeholder)}"` : ""} ${min !== "" ? `min="${esc(min)}"` : ""} ${max !== "" ? `max="${esc(max)}"` : ""}/>${hint ? `<small>${esc(hint)}</small>` : ""}</label>`;
}

function textareaField(label, name, value = "", placeholder = "", wide = true) {
  return `<label class="form-field ${wide ? "wide" : ""}"><span>${esc(label)}</span><textarea name="${esc(name)}" rows="4" placeholder="${esc(placeholder)}">${esc(value)}</textarea></label>`;
}

function selectField(label, name, options, selected = "", wide = false) {
  return `<label class="form-field ${wide ? "wide" : ""}"><span>${esc(label)}</span><select name="${esc(name)}">${options.map(o => { const value = typeof o === "string" ? o : o.value; const text = typeof o === "string" ? o : o.label; return `<option value="${esc(value)}" ${value === selected ? "selected" : ""}>${esc(text)}</option>`; }).join("")}</select></label>`;
}

function personSelectField(selected = "") {
  return `<label class="form-field wide"><span>Persona *</span><select name="personId" required>${personOptions(selected)}</select></label>`;
}

function openEntityForm(kind, id = "", presetPersonId = "") {
  closeDrawer(false);
  let html = "";
  if (kind === "person") {
    const p = id ? personById(store, id) : null;
    html = formShell(kind, p ? p.name : "Nueva persona", "Guardá solo lo que te resulte útil. Nada es obligatorio salvo el nombre.", `
      <div class="form-grid">
        ${field("Nombre", "name", p?.name, { required: true, placeholder: "Nombre y apellido" })}
        ${field("Rol", "role", p?.role, { placeholder: "Founder, inversor, diseñador…" })}
        ${field("Empresa / proyecto", "company", p?.company)}
        ${field("Ciudad", "city", p?.city)}
        ${field("Email", "email", p?.email, { type: "email" })}
        ${field("Teléfono", "phone", p?.phone)}
        ${field("LinkedIn / URL", "linkedin", p?.linkedin, { type: "url" })}
        ${selectField("Círculo", "circle", ["Cercano", "Estratégico", "Activo", "Nuevo"], p?.circle || "Activo")}
        ${field("Cadencia deseada (días)", "cadenceDays", p?.cadenceDays || store.profile.defaultCadenceDays || 30, { type: "number", min: 1, max: 365, hint: "Cuánto tiempo querés dejar pasar antes de retomar." })}
        ${field("Próximo follow-up", "nextFollowUp", p?.nextFollowUp || "", { type: "date" })}
        ${field("Tags", "tags", p?.tags?.join(", ") || "", { wide: true, placeholder: "IA, fintech, comunidad…" })}
        ${textareaField("Contexto relacional", "relation", p?.relation || "", "¿Quién es para vos? ¿Qué une esta relación? ¿Qué conviene recordar?")}
        ${textareaField("Nota privada", "notes", p?.notes || "", "Información que querés tener a mano.")}
      </div>`, id);
  } else if (kind === "interaction") {
    const entity = id ? store.interactions.find(x => x.id === id) : null;
    html = formShell(kind, entity ? "Editar interacción" : "Registrar interacción", "Una buena memoria relacional empieza por registrar qué pasó, no por escribir mucho.", `<div class="form-grid">
      ${personSelectField(entity?.personId || presetPersonId)}
      ${selectField("Tipo", "type", ["Reunión", "Mensaje", "Llamada", "Café", "Evento", "Nota"], entity?.type || "Reunión")}
      ${field("Fecha y hora", "date", localDateTime(entity?.date || new Date().toISOString()), { type: "datetime-local", required: true })}
      ${field("Título", "title", entity?.title || "", { required: true, wide: true, placeholder: "Qué pasó en una frase" })}
      ${textareaField("Notas", "notes", entity?.notes || "", "Decisiones, contexto, temas o próximos pasos.")}
    </div>`, id);
  } else if (kind === "commitment") {
    const entity = id ? store.commitments.find(x => x.id === id) : null;
    html = formShell(kind, entity ? "Editar compromiso" : "Nuevo compromiso", "Un pendiente concreto que no querés perder.", `<div class="form-grid">
      ${personSelectField(entity?.personId || presetPersonId)}
      ${field("Compromiso", "title", entity?.title || "", { required: true, wide: true, placeholder: "Ej. Enviar presentación" })}
      ${field("Fecha límite", "dueDate", entity?.dueDate || "", { type: "date" })}
      ${selectField("Estado", "status", [{value:"open",label:"Pendiente"},{value:"done",label:"Cumplido"}], entity?.status || "open")}
    </div>`, id);
  } else if (kind === "opportunity") {
    const entity = id ? store.opportunities.find(x => x.id === id) : null;
    html = formShell(kind, entity ? "Editar oportunidad" : "Nueva oportunidad", "Registrá una posibilidad sin convertir la relación en un pipeline de ventas.", `<div class="form-grid">
      ${personSelectField(entity?.personId || presetPersonId)}
      ${field("Oportunidad", "title", entity?.title || "", { required: true, wide: true, placeholder: "Qué posibilidad existe" })}
      ${selectField("Etapa", "stage", ["Idea", "Explorando", "Activa", "Cerrada"], entity?.stage || "Idea")}
      ${textareaField("Notas", "notes", entity?.notes || "", "Por qué importa, qué falta validar, próximo paso.")}
    </div>`, id);
  } else if (kind === "profile") {
    html = formShell(kind, "Tu espacio", "Identidad, foco y preferencias relacionales. Todo se puede cambiar.", `<div class="form-grid">
      ${field("Nombre del espacio", "name", store.profile.name, { required: true })}
      ${field("Rol", "role", store.profile.role)}
      ${field("Foco", "focus", store.profile.focus, { wide: true })}
      ${field("Cadencia base (días)", "defaultCadenceDays", store.profile.defaultCadenceDays || 30, { type: "number", min: 1, max: 365 })}
      ${field("Objetivos", "goals", (store.profile.goals || []).join(", "), { wide: true, hint: "Ej: followups, network, opportunities" })}
    </div>`, "profile");
  }
  modalContent.innerHTML = html;
  openModal();
}

function submitEntityForm(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const kind = form.dataset.kind;
  const id = form.dataset.id;
  if (kind === "person") {
    const payload = {
      id: id || makeId("p"), name: data.name.trim(), role: data.role.trim(), company: data.company.trim(), city: data.city.trim(), email: data.email.trim(), phone: data.phone.trim(), linkedin: data.linkedin.trim(), circle: data.circle, cadenceDays: Number(data.cadenceDays || 30), nextFollowUp: data.nextFollowUp || "", tags: data.tags.split(",").map(x => x.trim()).filter(Boolean), relation: data.relation.trim(), notes: data.notes.trim(), createdAt: id ? personById(store,id)?.createdAt : new Date().toISOString()
    };
    if (id) store.people = store.people.map(p => p.id === id ? payload : p); else store.people.push(payload);
  } else if (kind === "interaction") {
    const payload = { id: id || makeId("i"), personId: data.personId, type: data.type, date: new Date(data.date).toISOString(), title: data.title.trim(), notes: data.notes.trim(), source: "manual" };
    if (id) store.interactions = store.interactions.map(x => x.id === id ? payload : x); else store.interactions.push(payload);
  } else if (kind === "commitment") {
    const payload = { id: id || makeId("c"), personId: data.personId, title: data.title.trim(), dueDate: data.dueDate || "", status: data.status, createdAt: id ? store.commitments.find(x=>x.id===id)?.createdAt : new Date().toISOString() };
    if (id) store.commitments = store.commitments.map(x => x.id === id ? payload : x); else store.commitments.push(payload);
  } else if (kind === "opportunity") {
    const payload = { id: id || makeId("o"), personId: data.personId, title: data.title.trim(), stage: data.stage, notes: data.notes.trim(), createdAt: id ? store.opportunities.find(x=>x.id===id)?.createdAt : new Date().toISOString() };
    if (id) store.opportunities = store.opportunities.map(x => x.id === id ? payload : x); else store.opportunities.push(payload);
  } else if (kind === "profile") {
    store.profile = {
      ...store.profile,
      name: data.name.trim(),
      role: data.role.trim(),
      focus: data.focus.trim(),
      defaultCadenceDays: Math.max(1, Math.min(365, Number(data.defaultCadenceDays || 30))),
      goals: String(data.goals || "").split(",").map(x => x.trim()).filter(Boolean).slice(0, 8)
    };
  }
  closeModal();
  saveStore(id ? "Cambios guardados" : "Registro creado");
}

function deleteEntity(kind, id) {
  const map = { interaction: "interactions", commitment: "commitments", opportunity: "opportunities" };
  const collection = map[kind];
  if (!collection) return;
  if (!confirm("¿Eliminar este registro? Esta acción no se puede deshacer.")) return;
  store[collection] = store[collection].filter(x => x.id !== id);
  closeModal();
  saveStore("Registro eliminado");
}

function deletePerson(id) {
  const person = personById(store, id);
  if (!person) return;
  if (!confirm(`¿Eliminar a ${person.name} y todo su historial, compromisos, oportunidades y reuniones?`)) return;
  store.people = store.people.filter(p => p.id !== id);
  store.interactions = store.interactions.filter(x => x.personId !== id);
  store.commitments = store.commitments.filter(x => x.personId !== id);
  store.opportunities = store.opportunities.filter(x => x.personId !== id);
  store.meetings = store.meetings.filter(x => x.personId !== id);
  closeDrawer();
  saveStore("Persona eliminada");
}

function openDrawer() {
  drawerShell.classList.add("open");
  drawerShell.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  hydrateIcons(drawerContent);
}

function closeDrawer(removeScroll = true) {
  drawerShell.classList.remove("open");
  drawerShell.setAttribute("aria-hidden", "true");
  if (removeScroll && !modalShell.classList.contains("open") && !commandShell.classList.contains("open")) document.body.classList.remove("no-scroll");
}

function openModal() {
  modalShell.classList.add("open");
  modalShell.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  hydrateIcons(modalContent);
  setTimeout(() => modalContent.querySelector("input,select,textarea,button")?.focus(), 30);
}

function closeModal() {
  modalShell.classList.remove("open");
  modalShell.setAttribute("aria-hidden", "true");
  if (!drawerShell.classList.contains("open") && !commandShell.classList.contains("open")) document.body.classList.remove("no-scroll");
}

function openCommand() {
  commandShell.classList.add("open");
  commandShell.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  commandInput.value = "";
  renderCommandResults("");
  setTimeout(() => commandInput.focus(), 30);
}

function closeCommand() {
  commandShell.classList.remove("open");
  commandShell.setAttribute("aria-hidden", "true");
  if (!drawerShell.classList.contains("open") && !modalShell.classList.contains("open")) document.body.classList.remove("no-scroll");
}

function renderCommandResults(query) {
  const q = query.trim().toLowerCase();
  const people = store.people.filter(p => !q || [p.name,p.role,p.company,p.tags.join(" "),p.relation].join(" ").toLowerCase().includes(q)).slice(0, 8);
  const actions = [
    { label: "Capturar interacción", kind: "interaction", icon: "note" },
    { label: "Agregar persona", kind: "person", icon: "person" },
    { label: "Crear compromiso", kind: "commitment", icon: "check" }
  ].filter(a => !q || a.label.toLowerCase().includes(q));
  const interactions = q ? store.interactions.filter(i => `${i.title} ${i.notes}`.toLowerCase().includes(q)).slice(0, 5) : [];
  commandResults.innerHTML = `${actions.length ? `<div class="command-group"><span>ACCIONES</span>${actions.map(a => `<button data-action="command-capture" data-kind="${a.kind}">${icon(a.icon)}<div><strong>${esc(a.label)}</strong><span>Nuevo registro manual</span></div></button>`).join("")}</div>` : ""}${people.length ? `<div class="command-group"><span>PERSONAS</span>${people.map(p => `<button data-action="command-person" data-id="${esc(p.id)}">${avatar(p,"avatar-xs")}<div><strong>${esc(p.name)}</strong><span>${esc(personMeta(p))}</span></div></button>`).join("")}</div>` : ""}${interactions.length ? `<div class="command-group"><span>MEMORIA</span>${interactions.map(i => { const p=personById(store,i.personId); return `<button data-action="command-person" data-id="${esc(i.personId)}">${icon("note")}<div><strong>${esc(i.title)}</strong><span>${esc(p?.name || "")} · ${esc(i.notes.slice(0,70))}</span></div></button>`; }).join("")}</div>` : ""}${!actions.length && !people.length && !interactions.length ? emptyState("search","Sin resultados","Probá con otro término.") : ""}`;
  hydrateIcons(commandResults);
}

function toast(message, tone = "good") {
  const el = document.createElement("div");
  el.className = `toast ${tone}`;
  el.innerHTML = `${icon(tone === "warn" ? "alert" : "check", 16)}<span>${esc(message)}</span>`;
  toastStack.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 220); }, 2600);
}

function downloadText(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function openMobileNav() {
  sidebar.classList.add("open");
  mobileScrim.classList.add("open");
}
function closeMobileNav() {
  sidebar.classList.remove("open");
  mobileScrim.classList.remove("open");
}

function showAuth(view = "login", message = "") {
  authShell.classList.add("open");
  authShell.setAttribute("aria-hidden", "false");
  onboardingShell.classList.remove("open");
  appRoot.classList.add("app-locked");
  const configured = cloudIsConfigured();
  const titles = { login: ["VOLVÉ A TU RED", "Ingresar a ORBITA"], signup: ["NUEVO ESPACIO", "Crear cuenta"], recover: ["RECUPERAR ACCESO", "Restablecer contraseña"], password: ["NUEVA CONTRASEÑA", "Protegé tu cuenta"] };
  const [eyebrow, title] = titles[view] || titles.login;
  let form = "";
  if (!configured) {
    form = `<div class="auth-notice"><strong>ACCESO A ORBITA</strong><p>Entrá a tu espacio relacional y seguí trabajando con tu red y tu contexto.</p></div><button class="auth-primary" data-action="auth-local">ENTRAR →</button><p class="auth-footnote">Tus datos permanecen en este dispositivo mientras no conectes una cuenta.</p>`;
  } else if (view === "signup") {
    form = `<form id="auth-signup-form" class="auth-form"><label><span>NOMBRE</span><input name="name" autocomplete="name" placeholder="Iván" /></label><label><span>EMAIL</span><input name="email" type="email" autocomplete="email" required placeholder="vos@empresa.com" /></label><label><span>CONTRASEÑA</span><input name="password" type="password" autocomplete="new-password" minlength="12" required placeholder="12+ caracteres" /><small>12+ caracteres · mayúscula · minúscula · número · símbolo</small></label><button class="auth-primary" type="submit">CREAR CUENTA →</button></form><button class="auth-link" data-action="auth-view" data-value="login">Ya tengo cuenta</button>`;
  } else if (view === "recover") {
    form = `<form id="auth-recover-form" class="auth-form"><label><span>EMAIL</span><input name="email" type="email" autocomplete="email" required placeholder="vos@empresa.com" /></label><button class="auth-primary" type="submit">ENVIAR ENLACE →</button></form><button class="auth-link" data-action="auth-view" data-value="login">Volver al login</button>`;
  } else if (view === "password") {
    form = `<form id="auth-password-form" class="auth-form"><label><span>NUEVA CONTRASEÑA</span><input name="password" type="password" autocomplete="new-password" minlength="12" required placeholder="12+ caracteres" /><small>12+ caracteres · mayúscula · minúscula · número · símbolo</small></label><label><span>REPETIR CONTRASEÑA</span><input name="confirm" type="password" autocomplete="new-password" minlength="12" required /></label><button class="auth-primary" type="submit">ACTUALIZAR CONTRASEÑA →</button></form>`;
  } else {
    form = `<form id="auth-login-form" class="auth-form"><label><span>EMAIL</span><input name="email" type="email" autocomplete="email" required placeholder="vos@empresa.com" /></label><label><span>CONTRASEÑA</span><input name="password" type="password" autocomplete="current-password" required /></label><button class="auth-primary" type="submit">INGRESAR →</button></form><div class="auth-links"><button class="auth-link" data-action="auth-view" data-value="recover">Olvidé mi contraseña</button><button class="auth-link" data-action="auth-view" data-value="signup">Crear cuenta</button></div>`;
  }
  authContent.innerHTML = `<section class="auth-brand"><img src="/assets/orbita-mark.svg" alt=""/><strong>ORBITA</strong><span>INTELIGENCIA RELACIONAL</span><p>Tu red no es una lista de contactos.<br/>Es contexto, historia y próximos movimientos.</p></section><section class="auth-card"><div class="auth-card-head"><span>${eyebrow}</span><h1>${title}</h1><p>${configured ? "Acceso privado a tu espacio relacional." : "Acceso directo a tu espacio relacional."}</p></div>${message ? `<div class="auth-message">${esc(message)}</div>` : ""}${form}<div class="auth-security">${icon("shield",16)} <span>ORBITA nunca necesita una secret/service key en el navegador.</span></div></section>`;
  hydrateIcons(authContent);
  setTimeout(() => authContent.querySelector("input")?.focus(), 30);
}

function hideAuth() {
  authShell.classList.remove("open");
  authShell.setAttribute("aria-hidden", "true");
  appRoot.classList.remove("app-locked");
}

function showOnboarding(step=ui.onboardingStep) {
  ui.onboardingStep=Math.max(0,Math.min(2,step));
  onboardingShell.classList.add("open");
  onboardingShell.setAttribute("aria-hidden","false");
  const hasCurrent=store.people.length>0;
  const progress=[0,1,2].map(i=>`<i class="${i<=ui.onboardingStep?"active":""}"></i>`).join("");
  let body="";
  if(ui.onboardingStep===0){
    body=`<div class="onboard-hero v06-onboard-hero"><span class="eyebrow">INTELIGENCIA RELACIONAL</span><h1>Tu red ya contiene oportunidades que probablemente no estás viendo.</h1><p>ORBITA convierte contexto real en mejores decisiones, sin transformar personas en leads ni inventar conexiones.</p><div class="onboard-loop"><span>OBJETIVO</span><i>→</i><span>RED</span><i>→</i><span>EVIDENCIA</span><i>→</i><span>OPORTUNIDAD</span><i>→</i><span>ACCIÓN</span></div><div class="onboard-primary-actions"><button class="auth-primary" data-action="onboarding-next">CREAR MI ÓRBITA →</button><button class="btn btn-ghost" data-action="onboarding-finish" data-value="demo">EXPLORAR DEMO</button></div></div>`;
  }else if(ui.onboardingStep===1){
    body=`<form id="onboarding-profile-form" class="onboard-form v06-onboard-form"><span class="eyebrow">01 · TU ESPACIO</span><h2>Primero, ubicá tu contexto.</h2><p>Solo lo mínimo para que la experiencia se sienta propia.</p><div class="form-grid"><label class="form-field"><span>NOMBRE</span><input name="name" required value="${esc(store.profile.name==="Mi espacio"?"":store.profile.name)}" placeholder="Iván"/></label><label class="form-field"><span>ROL</span><input name="role" value="${esc(store.profile.role)}" placeholder="Founder"/></label><label class="form-field wide"><span>PROYECTO / EMPRESA</span><input name="focus" value="${esc(store.profile.focus==="Networking profesional"?"":store.profile.focus)}" placeholder="SØD Ecosystem"/></label></div><div class="onboard-actions"><button type="button" class="btn btn-ghost" data-action="onboarding-back">ATRÁS</button><button class="btn btn-primary" type="submit">CONTINUAR →</button></div></form>`;
  }else{
    body=`<form id="onboarding-goal-form" class="onboard-form v06-goal-onboarding"><span class="eyebrow">02 · OBJETIVO ACTUAL</span><h2>¿Qué querés lograr ahora?</h2><p>Podés cambiarlo cuando quieras. ORBITA usa este objetivo para ordenar la red por relevancia contextual.</p><label class="onboard-goal-field"><textarea name="goal" rows="3" maxlength="280" required placeholder="Estoy levantando una ronda pre-seed">${esc(store.profile.currentGoal||"")}</textarea></label><div class="goal-examples"><button type="button" data-action="goal-example" data-value="Encontrar clientes">Encontrar clientes</button><button type="button" data-action="goal-example" data-value="Buscar inversores">Buscar inversores</button><button type="button" data-action="goal-example" data-value="Conseguir feedback">Conseguir feedback</button><button type="button" data-action="goal-example" data-value="Encontrar talento">Encontrar talento</button></div><div class="onboard-actions"><button type="button" class="btn btn-ghost" data-action="onboarding-back">ATRÁS</button><button class="btn btn-acid" type="submit">ENTRAR A MI RED →</button></div>${hasCurrent?`<small class="onboard-existing">Tus ${store.people.length} relaciones actuales se conservan.</small>`:""}</form>`;
  }
  onboardingContent.innerHTML=`<section class="onboard-shell v06-onboard-shell"><header><div class="onboard-brand"><img src="/assets/orbita-mark.svg" alt=""/><strong>ORBITA</strong></div><div class="onboard-progress">${progress}</div>${hasCurrent?`<button class="onboard-skip" data-action="onboarding-finish" data-value="keep">Cerrar</button>`:"<span></span>"}</header>${body}</section>`;
  hydrateIcons(onboardingContent);
}

function hideOnboarding() {
  onboardingShell.classList.remove("open");
  onboardingShell.setAttribute("aria-hidden", "true");
}

function finishOnboarding(mode = "keep") {
  const profile = { ...store.profile };
  if (mode === "demo") {
    store = normalizeStore(deepClone(seedStore));
    if (!profile.currentGoal) profile.currentGoal = "Estoy levantando una ronda pre-seed";
  }
  else if (mode === "legacy") store = legacyStore() || store;
  else if (mode === "empty") store = normalizeStore({ profile, people: [], interactions: [], commitments: [], opportunities: [], meetings: [] });
  store.profile = { ...store.profile, ...profile, onboardingComplete: true };
  hideOnboarding();
  saveStore("Tu espacio está listo");
  if (!store.people.length) {
    go("people");
    setTimeout(() => openEntityForm("person"), 180);
  }
}

function openDeleteAccountModal() {
  if (authSession?.mode !== "cloud") return toast("La eliminación de cuenta solo aplica a cuentas cloud.", "warn");
  const email = authSession.user?.email || "tu cuenta";
  modalContent.innerHTML = `<div class="modal-head"><div><span class="eyebrow">CUENTA Y PRIVACIDAD</span><h2>Eliminar cuenta definitivamente</h2><p>Esto elimina el usuario de Auth y, por cascada, su workspace cloud. No se puede deshacer.</p></div><button class="icon-btn" data-action="close-modal">${icon("close")}</button></div><form id="delete-account-form" class="entity-form"><div class="auth-notice"><strong>${esc(email)}</strong><p>Antes de continuar, descargá un backup si querés conservar tus datos. Tu sesión actual dejará de ser recuperable.</p></div><label class="form-field wide"><span>ESCRIBÍ ELIMINAR PARA CONFIRMAR</span><input name="confirm" autocomplete="off" required pattern="ELIMINAR" placeholder="ELIMINAR" /></label><div class="modal-actions"><button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-danger" type="submit">${icon("trash")} Eliminar cuenta y datos</button></div></form>`;
  openModal();
}

function openHelp(topic = currentRoute()) {
  const guides = {
    today: ["HOY", "Tu centro de mando", "Acá viven tu objetivo actual, oportunidades explicables y relaciones que necesitan atención. No es un feed: debería ayudarte a decidir qué hacer."],
    people: ["PERSONAS", "Tu memoria relacional", "Abrí cualquier persona para editar contexto, registrar interacciones, compromisos y oportunidades."],
    network: ["RED", "Una vista, no un ranking", "Los círculos los definís vos. ORBITA no asigna valor humano automáticamente ni convierte vínculos en puntajes."],
    data: ["DATOS", "Control y portabilidad", "Exportá JSON/CSV/Markdown, auditá el estado, revisá la cuenta y controlá dónde se guarda tu información."]
  };
  const [label,title,body] = guides[topic] || guides.today;
  drawerContent.innerHTML = `<div class="drawer-head"><button class="icon-btn drawer-close" data-action="close-drawer">${icon("close")}</button><div><span class="eyebrow">AYUDA · ${label}</span><h2>${title}</h2><p>Guía rápida de ORBITA.</p></div></div><div class="drawer-body help-body"><section class="help-lead"><p>${body}</p></section><section class="drawer-section"><span class="eyebrow">LO ESENCIAL</span><div class="help-steps"><div><strong>1</strong><p><b>Capturá.</b> Persona, interacción, compromiso u oportunidad.</p></div><div><strong>2</strong><p><b>Volvé al contexto.</b> Cada relación reúne su historia completa.</p></div><div><strong>3</strong><p><b>Actuá.</b> Hoy y Red te muestran lo que merece atención y qué relaciones pueden ayudarte.</p></div></div></section><section class="drawer-section"><span class="eyebrow">ATAJOS</span><div class="shortcut-list"><div><kbd>⌘/Ctrl K</kbd><span>Buscar personas o crear registros</span></div><div><kbd>ESC</kbd><span>Cerrar paneles y modales</span></div></div></section><section class="drawer-section"><span class="eyebrow">DATOS Y PRIVACIDAD</span><p class="context-copy">Sin una cuenta conectada, tus datos permanecen en este dispositivo. Si activás sincronización, ORBITA mantiene un workspace asociado a tu cuenta.</p></section><div class="drawer-footer-actions"><button class="btn btn-primary" data-action="open-capture">${icon("plus")} Capturar algo</button><button class="btn btn-ghost" data-action="start-onboarding">Repetir onboarding</button></div></div>`;
  openDrawer();
}

function openAuditDrawer() {
  const audit = auditStore(store);
  const status = audit.ok ? "SALUDABLE" : "REQUIERE ATENCIÓN";
  drawerContent.innerHTML = `<div class="drawer-head"><button class="icon-btn drawer-close" data-action="close-drawer">${icon("close")}</button><div><span class="eyebrow">AUDITORÍA DEL WORKSPACE</span><h2>${status}</h2><p>${audit.errors} errores · ${audit.warnings} advertencias · ${(audit.sizeBytes/1024).toFixed(1)} KB</p></div></div><div class="drawer-body"><section class="audit-score ${audit.ok?"good":"risk"}"><strong>${audit.ok?"OK":"!"}</strong><div><h3>${audit.ok?"La estructura de datos es consistente.":"Hay referencias o datos que conviene reparar."}</h3><p>La auditoría revisa IDs duplicados, referencias huérfanas, fechas inválidas y tamaño del workspace.</p></div></section><section class="drawer-section"><span class="eyebrow">HALLAZGOS</span>${audit.issues.length?`<div class="audit-list">${audit.issues.map(i=>`<div class="audit-item ${i.severity}"><span>${i.severity==="error"?"ERROR":"AVISO"}</span><p>${esc(i.message)}</p></div>`).join("")}</div>`:`<p class="context-copy">No encontramos problemas estructurales en este workspace.</p>`}</section><div class="drawer-footer-actions">${audit.issues.length?`<button class="btn btn-primary" data-action="repair-store">${icon("refresh")} Reparar automáticamente</button>`:""}<button class="btn btn-ghost" data-action="export-json">${icon("download")} Backup antes de tocar nada</button></div></div>`;
  openDrawer();
}

async function enterApp(session, { recovery = false } = {}) {
  authSession = session?.mode === "cloud" ? await hydrateUser(session) : session;
  authRecovery = recovery;
  if (recovery && authSession?.mode === "cloud") {
    showAuth("password");
    return;
  }
  hideAuth();
  if (authSession?.mode === "cloud" && authSession.user?.id) {
    const hasLocal = hasLocalSnapshot();
    const local = loadStore();
    const meta = readSyncMeta();
    try {
      const remote = await loadCloudWorkspace(authSession.user.id);
      if (remote?.workspace) {
        cloudRevision = remote.revision;
        const remoteStore = normalizeStore(remote.workspace);
        const localChangedSinceSync = Boolean(meta?.localUpdatedAt && local.updatedAt && meta.localUpdatedAt !== local.updatedAt);
        const remoteAdvancedSinceSync = Boolean(meta?.revision && remote.revision > Number(meta.revision));

        if (localChangedSinceSync && remoteAdvancedSinceSync) {
          store = local;
          setSyncStatus("error", "CONFLICTO");
          toast("Detectamos cambios en este dispositivo y en tu cuenta. ORBITA no sobrescribió ninguno automáticamente.", "warn");
        } else if (localChangedSinceSync && !remoteAdvancedSinceSync) {
          store = local;
          scheduleCloudSync();
        } else if (!meta) {
          // A fresh browser has no trusted local snapshot. Never let normalizeStore()'s
          // newly-created timestamp overwrite an existing cloud workspace.
          if (!hasLocal) {
            store = remoteStore;
            persistLocalSnapshot(store);
            writeSyncMeta(remote, store.updatedAt);
            setSyncStatus("synced");
          } else {
            const localTime = Date.parse(local.updatedAt || 0) || 0;
            const remoteTime = Date.parse(remote.updatedAt || remoteStore.updatedAt || 0) || 0;
            store = localTime > remoteTime ? local : remoteStore;
            if (localTime > remoteTime) scheduleCloudSync();
            else { persistLocalSnapshot(store); writeSyncMeta(remote, store.updatedAt); setSyncStatus("synced"); }
          }
        } else {
          store = remoteStore;
          persistLocalSnapshot(store);
          writeSyncMeta(remote, store.updatedAt);
          setSyncStatus("synced");
        }
      } else {
        store = local;
        setSyncStatus("syncing");
        const result = await saveCloudWorkspace(authSession.user.id, store, null);
        cloudRevision = result.revision;
        writeSyncMeta(result);
        setSyncStatus("synced");
      }
    } catch (error) {
      console.error("ORBITA cloud bootstrap", error);
      store = local;
      if (error instanceof CloudConflictError) handleCloudConflict(error);
      else setSyncStatus("error");
    }
  } else {
    store = loadStore({ allowLegacy: true });
    setSyncStatus("local");
  }
  if (!location.hash || location.hash.includes("access_token=")) location.hash = "#/today";
  renderCurrentRoute();
  updateSignalBadge();
  if (!store.profile.onboardingComplete) showOnboarding(0);
}

async function bootstrap() {
  try {
    const result = await bootstrapAuth();
    if (!result.session) {
      showAuth("login", result.error || "");
      return;
    }
    await enterApp(result.session, { recovery: result.recovery });
  } catch (error) {
    console.error(error);
    showAuth("login", "No pudimos recuperar tu sesión. Volvé a ingresar.");
  }
}

async function handleAction(target) {
  const el = target.closest("[data-action],[data-route]");
  if (!el) return;
  if (el.dataset.route) { if (el.dataset.route === "network" && (store.profile.currentGoal || "").trim()) ui.networkMode = "goal"; go(el.dataset.route); return; }
  const action = el.dataset.action;
  const id = el.dataset.id;
  if (action === "auth-view") showAuth(el.dataset.value || "login");
  else if (action === "auth-local") { authSession = useLocalMode(); await enterApp(authSession); }
  else if (action === "focus-goal") { const input=document.querySelector("#relational-goal-input"); input?.focus(); input?.select(); }
  else if (action === "open-goal-network") { ui.networkMode="goal"; go("network"); renderCurrentRoute(); }
  else if (action === "define-goal") { ui.networkMode="goal"; go("today"); renderCurrentRoute(); setTimeout(()=>{ const input=document.querySelector("#relational-goal-input"); input?.focus(); input?.select(); },40); }
  else if (action === "goal-example") { const field=document.querySelector('#onboarding-goal-form textarea[name="goal"]'); if(field){ field.value=el.dataset.value||""; field.focus(); } }
  else if (action === "onboarding-next") showOnboarding(ui.onboardingStep + 1);
  else if (action === "onboarding-back") showOnboarding(ui.onboardingStep - 1);
  else if (action === "onboarding-finish") finishOnboarding(el.dataset.value || "keep");
  else if (action === "open-help") openHelp(currentRoute());
  else if (action === "start-onboarding") { closeDrawer(); showOnboarding(0); }
  else if (action === "sync-now") await syncNow();
  else if (action === "open-audit") openAuditDrawer();
  else if (action === "repair-store") { if (confirm("¿Reparar el workspace? ORBITA normalizará datos y eliminará referencias huérfanas. Recomendamos descargar un backup antes.")) { store = repairStore(store); closeDrawer(); saveStore("Workspace reparado"); } }
  else if (action === "sign-out") { if (authSession?.mode === "cloud") await syncNow({ quiet: true }); await signOut(); authSession = null; cloudRevision = null; closeDrawer(); closeModal(); closeCommand(); showAuth("login"); }
  else if (action === "delete-account") openDeleteAccountModal();
  else if (action === "open-capture") openCapture();
  else if (action === "capture-kind") {
    const draft=document.querySelector("#capture-draft")?.value.trim()||"";
    ui.captureDraft=draft;
    const kind=el.dataset.kind;
    openEntityForm(kind, "", el.dataset.personId || ui.capturePersonId || "");
    applyCaptureDraft(kind,draft);
    ui.captureDraft="";
  }
  else if (action === "capture-for-person") openCapture(id);
  else if (action === "open-person") openPersonDrawer(id);
  else if (action === "edit-person") openEntityForm("person", id);
  else if (action === "edit-interaction") openEntityForm("interaction", id);
  else if (action === "edit-commitment") openEntityForm("commitment", id);
  else if (action === "edit-opportunity") openEntityForm("opportunity", id);
  else if (action === "agent-opportunity") openAgentOpportunity(id);
  else if (action === "close-drawer") closeDrawer();
  else if (action === "close-modal") closeModal();
  else if (action === "close-command") closeCommand();
  else if (action === "delete-person") deletePerson(id);
  else if (action === "delete-entity") deleteEntity(el.dataset.kind, id);
  else if (action === "toggle-commitment") {
    const c = store.commitments.find(x => x.id === id); if (!c) return; c.status = c.status === "done" ? "open" : "done"; saveStore(c.status === "done" ? "Compromiso completado" : "Compromiso reabierto"); if (drawerShell.classList.contains("open")) openPersonDrawer(c.personId);
  }
  else if (action === "people-filter") { ui.circleFilter = el.dataset.value; renderCurrentRoute(); }
  else if (action === "network-filter") { ui.networkFilter = el.dataset.value; renderCurrentRoute(); }
  else if (action === "network-mode") { ui.networkMode = el.dataset.value === "goal" ? "goal" : "all"; renderCurrentRoute(); }
  else if (action === "cycle-network-filter") { const opts=["Todos","Cercano","Estratégico","Activo","Nuevo"]; ui.networkFilter=opts[(opts.indexOf(ui.networkFilter)+1)%opts.length]; renderCurrentRoute(); }
  else if (action === "open-opportunities") { go("today"); renderCurrentRoute(); }
  else if (action === "data-tab") { ui.dataTab=el.dataset.value||"summary"; renderCurrentRoute(); }
  else if (action === "import-csv") importCsvFile.click();
  else if (action === "export-json") { downloadText(`orbita-backup-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(store,null,2), "application/json"); toast("Backup descargado"); }
  else if (action === "export-csv") { downloadText(`orbita-personas-${new Date().toISOString().slice(0,10)}.csv`, "\uFEFF"+peopleToCSV(store), "text/csv;charset=utf-8"); toast("CSV descargado"); }
  else if (action === "export-report") { downloadText(`orbita-informe-${new Date().toISOString().slice(0,10)}.md`, reportToMarkdown(store), "text/markdown;charset=utf-8"); toast("Informe descargado"); }
  else if (action === "import-json") importFile.click();
  else if (action === "edit-profile") openEntityForm("profile", "profile");
  else if (action === "reset-demo") { if (confirm("¿Restaurar la demo inicial? Se reemplazarán los datos actuales.")) { const profile={...store.profile,onboardingComplete:true}; store = normalizeStore({...deepClone(seedStore),profile}); closeDrawer(); saveStore("Demo restaurada"); } }
  else if (action === "erase-all") { if (confirm("¿Empezar desde cero? Exportá un backup antes si querés conservar tus datos.")) { store = normalizeStore({ profile: store.profile, people:[],interactions:[],commitments:[],opportunities:[],meetings:[] }); closeDrawer(); saveStore("Espacio vacío creado"); go("today"); } }
  else if (action === "command-capture") { closeCommand(); openEntityForm(el.dataset.kind); }
  else if (action === "command-person") { closeCommand(); openPersonDrawer(id); }
}

document.addEventListener("click", event => handleAction(event.target));
document.addEventListener("keydown", event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); commandShell.classList.contains("open") ? closeCommand() : openCommand(); return; }
  if (event.key === "Escape") { if (commandShell.classList.contains("open")) closeCommand(); else if (modalShell.classList.contains("open")) closeModal(); else if (drawerShell.classList.contains("open")) closeDrawer(); else closeMobileNav(); return; }
  if ((event.key === "Enter" || event.key === " ") && event.target.matches('[tabindex][data-action]')) { event.preventDefault(); handleAction(event.target); }
});

document.addEventListener("input", event => {
  if (event.target.id === "people-search") { ui.peopleQuery = event.target.value; const pos = event.target.selectionStart; renderCurrentRoute(); const input = document.querySelector("#people-search"); input?.focus(); input?.setSelectionRange(pos,pos); }
});

document.addEventListener("submit", async event => {
  const form = event.target;
  if (form.id === "relational-goal-form") {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    store.profile.currentGoal = String(data.goal || "").trim().slice(0, 280);
    if (store.profile.currentGoal) ui.networkMode = "goal";
    saveStore(store.profile.currentGoal ? "Red analizada" : "Objetivo limpiado");
    return;
  }
  if (form.id === "entity-form") { event.preventDefault(); submitEntityForm(form); return; }
  if (form.id === "auth-login-form") {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const button = form.querySelector('button[type="submit"]'); if (button) button.disabled = true;
    try { const session = await signIn(String(data.email).trim(), String(data.password)); await enterApp(session); }
    catch (error) { showAuth("login", error.message || "No pudimos iniciar sesión."); }
    return;
  }
  if (form.id === "auth-signup-form") {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const passwordError = passwordPolicyError(data.password);
    if (passwordError) { showAuth("signup", passwordError); return; }
    const button = form.querySelector('button[type="submit"]'); if (button) button.disabled = true;
    try {
      const result = await signUp(String(data.email).trim(), String(data.password), String(data.name || "").trim());
      if (result.session) await enterApp(result.session);
      else showAuth("login", "Cuenta creada. Revisá tu email para confirmar el acceso antes de ingresar.");
    } catch (error) { showAuth("signup", error.message || "No pudimos crear la cuenta."); }
    return;
  }
  if (form.id === "auth-recover-form") {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    try { await requestPasswordReset(String(data.email).trim()); showAuth("login", "Si la cuenta existe, vas a recibir un enlace para recuperar el acceso."); }
    catch (error) { showAuth("recover", error.message || "No pudimos enviar el enlace."); }
    return;
  }
  if (form.id === "auth-password-form") {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const passwordError = passwordPolicyError(data.password);
    if (passwordError) { showAuth("password", passwordError); return; }
    if (data.password !== data.confirm) { showAuth("password", "Las contraseñas no coinciden."); return; }
    try { await updatePassword(String(data.password)); authRecovery = false; await enterApp(authSession, { recovery: false }); toast("Contraseña actualizada"); }
    catch (error) { showAuth("password", error.message || "No pudimos actualizar la contraseña."); }
    return;
  }
  if (form.id === "delete-account-form") {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (String(data.confirm || "") !== "ELIMINAR") { toast("Escribí ELIMINAR para confirmar.", "warn"); return; }
    const button = form.querySelector('button[type="submit"]'); if (button) button.disabled = true;
    try {
      await deleteCloudAccount();
      try { localStorage.removeItem(storageKey()); localStorage.removeItem(syncMetaKey()); } catch { /* best effort */ }
      await signOut();
      authSession = null;
      cloudRevision = null;
      store = normalizeStore({});
      closeModal(); closeDrawer(); closeCommand();
      showAuth("login", "Cuenta y workspace eliminados. Podés crear una cuenta nueva cuando quieras.");
    } catch (error) {
      if (button) button.disabled = false;
      toast(error.message || "No pudimos eliminar la cuenta.", "warn");
    }
    return;
  }
  if (form.id === "onboarding-profile-form") {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    store.profile = { ...store.profile, name: String(data.name).trim() || "Mi espacio", role: String(data.role || "").trim(), focus: String(data.focus || "").trim() };
    showOnboarding(2); return;
  }
  if (form.id === "onboarding-goal-form") {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    store.profile = { ...store.profile, currentGoal: String(data.goal || "").trim().slice(0,280) };
    if (store.profile.currentGoal) ui.networkMode = "goal";
    finishOnboarding(store.people.length ? "keep" : "empty");
    return;
  }
});

document.querySelector("#search-trigger").addEventListener("click", openCommand);
document.querySelector("#mobile-menu").addEventListener("click", openMobileNav);
mobileScrim.addEventListener("click", closeMobileNav);
commandInput.addEventListener("input", () => renderCommandResults(commandInput.value));

importFile.addEventListener("change", async () => {
  const file = importFile.files?.[0];
  importFile.value = "";
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.people) || !Array.isArray(parsed.interactions) || !Array.isArray(parsed.commitments) || !Array.isArray(parsed.opportunities) || !Array.isArray(parsed.meetings)) throw new Error("Formato inválido");
    let normalized = normalizeStore(parsed);
    const audit = auditStore(normalized);
    if (!confirm(`Importar ${normalized.people.length} personas y reemplazar los datos actuales?${audit.errors ? `\n\nDetectamos ${audit.errors} problema(s) estructural(es) y ORBITA intentará repararlos.` : ""}`)) return;
    if (audit.errors) normalized = repairStore(normalized);
    store = normalized;
    saveStore("Backup importado y validado");
  } catch {
    toast("El archivo no parece ser un backup válido de ORBITA.", "warn");
  }
});

importCsvFile.addEventListener("change", async () => {
  const file=importCsvFile.files?.[0]; importCsvFile.value=""; if(!file)return;
  try {
    const contacts=parseContactsCSV(await file.text());
    const existing=new Set(store.people.map(p=>(p.email||`${p.name}|${p.company}`).trim().toLowerCase()));
    let added=0, skipped=0;
    for(const contact of contacts){const key=(contact.email||`${contact.name}|${contact.company}`).trim().toLowerCase();if(existing.has(key)){skipped++;continue;}existing.add(key);store.people.push({id:makeId("p"),...contact,linkedin:"",circle:"Nuevo",cadenceDays:store.profile.defaultCadenceDays||30,nextFollowUp:"",notes:"",createdAt:new Date().toISOString()});added++;}
    if(!added) throw new Error("Todos los contactos ya existen");
    saveStore(`${added} contacto${added===1?"":"s"} importado${added===1?"":"s"}${skipped?` · ${skipped} duplicado${skipped===1?"":"s"} omitido${skipped===1?"":"s"}`:""}`); go("people");
  } catch(error){ toast(`No pude importar el CSV: ${error.message}`,"warn"); }
});

window.addEventListener("hashchange", renderCurrentRoute);

hydrateIcons();
bootstrap();
