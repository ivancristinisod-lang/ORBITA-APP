import { seedStore } from "./seed.js";
import {
  deepClone, makeId, normalizeStore, personById, interactionsFor, lastInteraction,
  relationshipState, openCommitmentsFor, opportunitiesFor, upcomingMeetings,
  computeSignals, buildMeetingBrief, formatDate, formatDateTime, formatRelative,
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
  agenda: "Agenda",
  data: "Datos"
};

const ui = {
  peopleQuery: "",
  circleFilter: "Todos",
  networkFilter: "Todos",
  capturePersonId: "",
  captureKind: "",
  agendaMode: "week",
  agendaAnchor: new Date().toISOString().slice(0,10),
  dataTab: "summary",
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
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
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
  syncLabel.textContent = label || (status === "synced" ? "SINCRONIZADO" : status === "syncing" ? "GUARDANDO…" : status === "error" ? "ERROR SYNC" : "LOCAL");
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
      toast("Tus cambios quedaron guardados localmente, pero no pude sincronizar la nube.", "warn");
    }
  }, 700);
}

async function syncNow({ quiet = false } = {}) {
  if (authSession?.mode !== "cloud" || !authSession.user?.id) {
    setSyncStatus("local");
    if (!quiet) toast("Este espacio está en modo local.");
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
    if (!quiet) toast("No pude sincronizar. Tus datos locales siguen a salvo.", "warn");
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
  const renderer={today:todayView,people:peopleView,network:networkView,agenda:agendaView,data:dataView}[route];
  viewRoot.innerHTML=renderer(); hydrateIcons(viewRoot); viewRoot.focus({preventScroll:true}); closeMobileNav();
}
function updateSignalBadge() {
  const count = computeSignals(store).length;
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
  return `<section class="relational-agent card">
    <div class="agent-head">
      <div>
        <span class="eyebrow">AGENTE RELACIONAL</span>
        <h2>¿Qué necesitás conseguir ahora?</h2>
        <p>ÓRBITA cruza tu objetivo con el contexto que ya existe en tu red. Cada resultado muestra evidencia y separa hechos de inferencias.</p>
      </div>
      <span class="agent-mode">LOCAL · EXPLICABLE</span>
    </div>
    <form id="relational-goal-form" class="agent-form">
      <input id="relational-goal-input" name="goal" value="${esc(goal)}" maxlength="280" autocomplete="off" placeholder="Ej: Estoy levantando una ronda pre-seed" aria-label="Objetivo actual" />
      <button class="btn btn-acid" type="submit">${icon("spark",15)} Analizar mi red</button>
    </form>
    ${!hasGoal ? `<div class="agent-empty"><span>OBJETIVO → RED → EVIDENCIA → OPORTUNIDAD → ACCIÓN</span><p>Escribí un objetivo real. ÓRBITA no completa huecos con información externa.</p></div>` :
      results.length ? `<div class="agent-results">
        <div class="agent-results-head"><span>${results.length} OPORTUNIDAD${results.length===1?"":"ES"} CON EVIDENCIA</span><small>Ordenadas por relevancia</small></div>
        <div class="agent-result-grid">${results.slice(0,3).map((result,index)=>relationalOpportunityCard(result,index)).join("")}</div>
      </div>` :
      `<div class="agent-no-match"><strong>NO HAY EVIDENCIA SUFICIENTE</strong><p>Con los datos registrados no puedo sostener una recomendación para “${esc(goal)}”. Probá otro objetivo o agregá contexto real a tu red.</p></div>`
    }
  </section>`;
}

function relationalOpportunityCard(result, index) {
  const person = personById(store, result.contact_id);
  if (!person) return "";
  return `<button class="agent-result ${index===0?"primary":""}" data-action="agent-opportunity" data-id="${esc(person.id)}">
    <div class="agent-rank">0${index+1}</div>
    <div class="agent-result-main">
      <span>${esc(person.role || person.company || "Relación")}</span>
      <strong>${esc(person.name)}</strong>
      <p>${esc(result.reason)}</p>
    </div>
    <div class="agent-score"><strong>${result.relevance_score}</strong><span>RELEVANCIA</span></div>
  </button>`;
}

function todayView(){
  const signals=computeSignals(store).slice(0,3),meetings=upcomingMeetings(store).slice(0,3),pulse=relationshipPulse();
  const risky=store.people.filter(p=>["warn","risk"].includes(relationshipState(store,p).tone)).length;
  const contextualized=store.people.filter(p=>Boolean(p.relation||p.notes||(p.tags||[]).length)).length;
  const openCommitments=store.commitments.filter(c=>c.status!=="done").length;
  if(!store.people.length)return `${pageHead("01","HOY","Tu centro de mando relacional")}<section class="onboarding-card"><div class="onboarding-mark">${icon("network",30)}</div><h2>Construí tu primera órbita</h2><p>Agregá una persona y registrá una interacción real. ORBITA empieza a ordenar el contexto desde ahí.</p><button class="btn btn-acid" data-action="capture-kind" data-kind="person">${icon("plus")} Agregar primera persona</button></section>`;
  return `${pageHead("01","HOY","Tu centro de mando relacional",`<span class="date-chip">${esc(new Intl.DateTimeFormat("es-AR",{day:"2-digit",month:"short",year:"numeric"}).format(new Date()).toUpperCase())}</span>`)}
  ${relationalGoalPanel()}
  <div class="today-layout">
    <section class="pulse-card"><span class="pulse-label">TU PULSO RELACIONAL</span><strong class="pulse-number">${pulse}</strong><div class="pulse-foot"><span>EN CADENCIA</span><b>${risky} fuera de cadencia</b></div></section>
    <section class="card movement-card"><div class="section-head"><span class="eyebrow">PRÓXIMOS MOVIMIENTOS</span><button class="text-btn" data-action="capture-kind" data-kind="meeting">+ Agendar</button></div><div class="movement-list">${meetings.length?meetings.map(m=>{const p=personById(store,m.personId);return `<div class="movement-row-shell"><button class="movement-row" data-action="brief-meeting" data-id="${esc(m.id)}"><div><strong>${esc(m.title)}</strong><span>${esc(formatDateTime(m.start))}${p?` · ${esc(p.name)}`:""}</span></div>${icon("arrow",15)}</button><button class="icon-btn inline-edit" data-action="edit-meeting" data-id="${esc(m.id)}" aria-label="Editar ${esc(m.title)}" title="Editar reunión">${icon("edit",14)}</button></div>`}).join(""):`<button class="movement-row" data-action="capture-kind" data-kind="meeting"><div><strong>Agendá tu próximo movimiento</strong><span>No hay reuniones próximas</span></div>${icon("arrow",15)}</button>`}</div></section>
    <section class="signals-panel"><div class="signals-title"><strong>SEÑALES IMPORTANTES</strong><button class="text-btn" data-route="people">VER TODAS</button></div><div class="signal-cards">${signals.length?signals.map((s,i)=>signalCard(s,i)).join(""):`<button class="signal-card neon" data-action="capture-kind" data-kind="interaction"><small>Red en orden</small><strong>No hay señales urgentes. Registrá una interacción nueva.</strong><footer><span>Ahora</span>${icon("spark",17)}</footer></button>`}</div></section>
    <section class="focus-strip"><div class="focus-block"><div><span>TU FOCO DE HOY</span><strong>${risky?`Reactivar ${risky} relación${risky===1?"":"es"}`:"Registrar una conversación valiosa"}</strong></div><button class="focus-arrow" data-route="people" aria-label="Abrir personas">${icon("arrow",18)}</button></div><div class="focus-block"><div><span>MEMORIA RELACIONAL</span><strong>${store.interactions.length} registros <small>en ${contextualized} relaciones con contexto</small></strong></div><span class="focus-fact">${openCommitments} compromisos abiertos</span></div></section>
  </div>`;
}
function signalCard(signal,index){const p=personById(store,signal.personId);if(!p)return"";const cls=signal.tone==="risk"?"orange":index===1?"blue":"neon";let action=`data-action="open-person" data-id="${esc(p.id)}"`;if(signal.type==="meeting")action=`data-action="brief-meeting" data-id="${esc(signal.entityId)}"`;if(signal.type==="commitment")action=`data-action="edit-commitment" data-id="${esc(signal.entityId)}"`;const ic=signal.type==="meeting"?"calendar":signal.type==="commitment"?"check":"spark";return `<button class="signal-card ${cls}" ${action}><small>${esc(signal.title)}</small><strong>${esc(p.name)} — ${esc(signal.body)}</strong><footer><span>${esc(signal.meta)}</span><span class="signal-action">${signal.type==="commitment"?"EDITAR":signal.type==="meeting"?"PREPARAR":"ABRIR"} ${icon(ic,16)}</span></footer></button>`}

function peopleView(){const q=ui.peopleQuery.trim().toLowerCase();const people=store.people.filter(p=>ui.circleFilter==="Todos"||p.circle===ui.circleFilter).filter(p=>!q||[p.name,p.role,p.company,p.city,p.tags.join(" "),p.relation].join(" ").toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name,"es"));return `${pageHead("02","PERSONAS","Conocé. Comprendé. Activá.")}<div class="people-toolbar"><label class="inline-search">${icon("search",17)}<input id="people-search" value="${esc(ui.peopleQuery)}" placeholder="Buscar personas, empresas, tags..." /></label><button class="btn btn-primary" data-action="capture-kind" data-kind="person">${icon("plus")} Nueva persona</button></div><div class="filter-chips">${["Todos","Cercano","Estratégico","Activo","Nuevo"].map(c=>`<button class="filter-chip ${ui.circleFilter===c?"active":""}" data-action="people-filter" data-value="${esc(c)}">${esc(c)}</button>`).join("")}<span class="result-count">${people.length} PERSONAS</span></div>${people.length?`<section class="people-list">${people.map(personRow).join("")}</section>`:emptyState("search","Sin resultados","Probá otro término o agregá una persona.",`<button class="btn btn-primary" data-action="capture-kind" data-kind="person">Agregar persona</button>`)}<button class="import-strip" data-action="import-csv">${icon("upload",24)}<div><strong>IMPORTAR CONTACTOS</strong><span>Desde CSV · todo se procesa y guarda localmente</span></div><div class="import-lines"></div></button>`}
function personRow(p){const last=lastInteraction(store,p.id),rel=relationshipState(store,p),pending=openCommitmentsFor(store,p.id).length;return `<article class="person-row" data-action="open-person" data-id="${esc(p.id)}" tabindex="0"><div class="person-main">${avatar(p)}<div><strong>${esc(p.name)}</strong><span>${esc(personMeta(p))}</span></div></div><div class="person-cell-secondary"><span>ÚLTIMO CONTACTO</span><strong>${esc(last?formatRelative(last.date):"Sin historial")}</strong></div><div class="person-cell-secondary"><span>PEND.</span><strong>${pending}</strong></div><div>${circlePill(p.circle)}</div><div>${statePill(rel)}</div><div class="row-actions"><button class="icon-btn row-edit" data-action="edit-person" data-id="${esc(p.id)}" aria-label="Editar ${esc(p.name)}" title="Editar persona">${icon("edit",15)}</button><button class="icon-btn row-open" data-action="open-person" data-id="${esc(p.id)}" aria-label="Abrir ${esc(p.name)}" title="Abrir perfil">${icon("arrow",15)}</button></div></article>`}

function networkView(){const people=store.people.filter(p=>ui.networkFilter==="Todos"||p.circle===ui.networkFilter);const circles=["Cercano","Estratégico","Activo","Nuevo"],radii={Cercano:18,"Estratégico":29,Activo:38,Nuevo:46},grouped=Object.fromEntries(circles.map(c=>[c,people.filter(p=>p.circle===c)]));const nodes=circles.flatMap(c=>grouped[c].map((p,i,a)=>{const angle=((Math.PI*2)/Math.max(a.length,1))*i-Math.PI/2+circles.indexOf(c)*.55,r=radii[c];return `<button class="network-node circle-node-${c.toLowerCase().replaceAll("é","e")}" style="left:${50+Math.cos(angle)*r}%;top:${50+Math.sin(angle)*r}%" data-action="open-person" data-id="${esc(p.id)}" aria-label="Abrir ${esc(p.name)}" title="${esc(p.name)} · ${esc(personMeta(p))}"><span class="node-avatar">${esc(initials(p.name))}</span></button>`})).join("");const tags=topTags(4),opps=store.opportunities.filter(o=>o.stage!=="Cerrada").length,strong=store.people.filter(p=>["Cercano","Estratégico"].includes(p.circle)).length,meetings=upcomingMeetings(store),next=meetings[0];return `${pageHead("03","RED","Visualizá el poder de tu red",`<button class="btn btn-ghost" data-action="cycle-network-filter">${icon("filter")} Filtro: ${esc(ui.networkFilter)}</button>`)}<div class="network-layout"><aside class="network-metrics"><div class="net-metric"><strong>${store.people.length}</strong><span>NODOS</span></div><div class="net-metric"><strong>${new Set(store.people.map(p=>p.company).filter(Boolean)).size}</strong><span>ORGANIZACIONES</span></div><div class="net-metric"><strong>${strong}</strong><span>RELACIONES<br/>CLAVE</span></div><div class="net-metric"><strong>${opps}</strong><span>OPORTUNIDADES</span></div><button class="net-opportunity" data-action="open-opportunities">VER OPORTUNIDADES ↗</button></aside><section class="card network-card"><div class="network-toolbar"><span>${people.length} personas visibles · tocá un nodo para abrir su relación</span></div><div class="orbit-map"><div class="network-center"><strong>TÚ</strong></div>${nodes}</div></section><aside class="network-aside"><section><span class="eyebrow">TEMA DOMINANTE</span><h3>${esc(tags[0]?.name||"Sin tema dominante")}</h3><p class="muted-copy">${tags[0]?.count||0} relaciones etiquetadas con este tema</p></section><section><span class="eyebrow">EN TU RED</span><div class="connected-avatars">${store.people.slice(0,5).map(p=>avatar(p,"avatar-xs")).join("")}</div></section><section><span class="eyebrow">TEMAS CLAVE</span><div class="topic-chips">${tags.map(t=>`<span class="topic-chip">${esc(t.name)}</span>`).join("")||`<span class="topic-chip">Sin tags</span>`}</div></section>${next?`<button class="network-event actionable" data-action="brief-meeting" data-id="${esc(next.id)}"><span class="eyebrow">PRÓXIMO EVENTO</span><strong>${esc(next.title)}</strong><span>${esc(formatDateTime(next.start))}</span><small>ABRIR BRIEF →</small></button>`:`<button class="network-event actionable" data-action="capture-kind" data-kind="meeting"><span class="eyebrow">PRÓXIMO EVENTO</span><strong>Sin evento próximo</strong><span>Agendá una reunión</span><small>AGENDAR →</small></button>`}</aside></div>`}

function agendaDate(value=ui.agendaAnchor){const d=new Date(`${value}T12:00:00`);return Number.isNaN(d.getTime())?new Date():d}
function dateKey(date){const d=new Date(date.getTime()-date.getTimezoneOffset()*60000);return d.toISOString().slice(0,10)}
function weekStart(date=agendaDate()){const d=new Date(date),day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);d.setHours(12,0,0,0);return d}
function isSameDay(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()}
function meetingRow(m){const p=personById(store,m.personId);return `<article class="agenda-event-row ${m.status==="done"?"done":""}"><button class="agenda-event-main" data-action="brief-meeting" data-id="${esc(m.id)}"><div class="agenda-date"><strong>${new Intl.DateTimeFormat("es-AR",{hour:"2-digit",minute:"2-digit"}).format(new Date(m.start))}</strong><span>${esc(formatDate(m.start))}</span></div><div class="agenda-main"><strong>${esc(m.title)}</strong><span>${esc(p?.name||"Sin persona")} · ${m.durationMin} min · ${m.status==="done"?"Realizada":"Próxima"}</span></div></button><button class="icon-btn" data-action="edit-meeting" data-id="${esc(m.id)}" aria-label="Editar reunión" title="Editar reunión">${icon("edit",15)}</button></article>`}
function calendarWeekView(){const start=weekStart(),days=Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(d.getDate()+i);return d}),hours=Array.from({length:10},(_,i)=>8+i);return `<div class="calendar-week"><div class="time-col"><div class="time-head"></div>${hours.map(h=>`<div class="time-label">${String(h).padStart(2,"0")}:00</div>`).join("")}</div>${days.map(day=>{const events=store.meetings.filter(m=>isSameDay(new Date(m.start),day));return `<div class="day-col"><button class="day-head ${isSameDay(day,new Date())?"today":""}" data-action="agenda-select-date" data-value="${dateKey(day)}"><span>${new Intl.DateTimeFormat("es-AR",{weekday:"short"}).format(day).toUpperCase()}</span><strong>${day.getDate()}</strong></button><div class="time-grid"></div>${events.map((m,i)=>{const d=new Date(m.start),top=50+Math.max(0,(d.getHours()+d.getMinutes()/60-8))*38,tone=i%3===1?"blue":i%3===2?"dark":"";return `<button class="cal-event ${tone} ${m.status==="done"?"done":""}" style="top:${top}px" data-action="brief-meeting" data-id="${esc(m.id)}" title="${esc(m.title)}"><strong>${esc(m.title)}</strong><span>${esc(personById(store,m.personId)?.name||"")}</span></button>`}).join("")}</div>`}).join("")}</div>`}
function calendarDayView(){const selected=agendaDate(),events=store.meetings.filter(m=>isSameDay(new Date(m.start),selected)).sort((a,b)=>new Date(a.start)-new Date(b.start));return `<div class="day-agenda"><div class="selected-day-head"><span>${new Intl.DateTimeFormat("es-AR",{weekday:"long",day:"numeric",month:"long"}).format(selected)}</span><button class="text-btn" data-action="capture-kind" data-kind="meeting">+ Nueva reunión</button></div>${events.length?events.map(meetingRow).join(""):emptyState("calendar","Sin reuniones este día","Podés agendar una reunión o elegir otra fecha.",`<button class="btn btn-acid" data-action="capture-kind" data-kind="meeting">Nueva reunión</button>`)}</div>`}
function calendarMonthView(){const now=agendaDate(),first=new Date(now.getFullYear(),now.getMonth(),1,12),offset=(first.getDay()+6)%7,start=new Date(first);start.setDate(first.getDate()-offset);const days=Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d});return `<div class="month-grid">${days.map(d=>{const events=store.meetings.filter(m=>isSameDay(new Date(m.start),d));return `<button class="month-day ${isSameDay(d,new Date())?"today":""} ${d.getMonth()!==now.getMonth()?"outside":""}" data-action="agenda-select-date" data-value="${dateKey(d)}"><strong>${d.getDate()}</strong>${events.length?`<div class="month-event-dot" title="${events.length} evento(s)"></div><span>${events.length} evento${events.length===1?"":"s"}</span>`:""}</button>`}).join("")}</div>`}
function agendaRangeLabel(){const d=agendaDate();if(ui.agendaMode==="day")return new Intl.DateTimeFormat("es-AR",{day:"numeric",month:"long",year:"numeric"}).format(d);if(ui.agendaMode==="month")return new Intl.DateTimeFormat("es-AR",{month:"long",year:"numeric"}).format(d);const start=weekStart(d),end=new Date(start);end.setDate(end.getDate()+6);return `${new Intl.DateTimeFormat("es-AR",{day:"2-digit",month:"short"}).format(start)} — ${new Intl.DateTimeFormat("es-AR",{day:"2-digit",month:"short"}).format(end)}`}
function agendaView(){const meetings=upcomingMeetings(store),next=meetings[0],person=next?personById(store,next.personId):null,commitments=store.commitments.filter(c=>c.status!=="done").sort((a,b)=>(a.dueDate||"9999").localeCompare(b.dueDate||"9999")),today=agendaDate(),content=ui.agendaMode==="day"?calendarDayView():ui.agendaMode==="month"?calendarMonthView():calendarWeekView();return `${pageHead("04","AGENDA","Tu tiempo, tu ventaja competitiva",`<button class="btn btn-primary" data-action="capture-kind" data-kind="meeting">${icon("plus")} Nuevo evento</button>`)}<div class="agenda-shell"><aside class="agenda-left"><div class="date-tile"><span>${new Intl.DateTimeFormat("es-AR",{month:"long",year:"numeric"}).format(today).toUpperCase()}</span><strong>${today.getDate()}</strong><b>${new Intl.DateTimeFormat("es-AR",{weekday:"long"}).format(today)}</b></div><div class="next-meeting-card"><span class="eyebrow">PRÓXIMA REUNIÓN</span>${next?`<div class="time">${new Intl.DateTimeFormat("es-AR",{hour:"2-digit",minute:"2-digit"}).format(new Date(next.start))}</div><strong>${esc(person?.name||next.title)}</strong><span>${esc(next.title)}</span><div class="split-actions"><button class="btn" data-action="brief-meeting" data-id="${esc(next.id)}">PREPARAR ${icon("arrow",13)}</button><button class="icon-btn" data-action="edit-meeting" data-id="${esc(next.id)}" title="Editar">${icon("edit",14)}</button></div>`:`<strong class="empty-title">Agenda libre</strong><button class="btn" data-action="capture-kind" data-kind="meeting">AGENDAR ${icon("plus",13)}</button>`}</div><div class="agenda-pending"><div class="section-head"><span class="eyebrow">PENDIENTES</span><button class="text-btn" data-action="capture-kind" data-kind="commitment">+ Nuevo</button></div>${commitments.slice(0,3).map(c=>{const p=personById(store,c.personId);return `<button class="pending-mini" data-action="edit-commitment" data-id="${esc(c.id)}"><strong>${esc(c.title)}</strong><span>${esc(p?.name||"")}${c.dueDate?` · ${esc(formatDate(c.dueDate))}`:""}</span></button>`}).join("")||`<p class="muted-copy">Sin pendientes.</p>`}</div></aside><section class="calendar-card"><div class="calendar-toolbar"><div class="calendar-nav"><button class="icon-btn" data-action="agenda-nav" data-value="-1" aria-label="Anterior">←</button><button class="text-btn calendar-range" data-action="agenda-today">${esc(agendaRangeLabel())}</button><button class="icon-btn" data-action="agenda-nav" data-value="1" aria-label="Siguiente">→</button></div><div class="view-switch">${[["day","DÍA"],["week","SEMANA"],["month","MES"]].map(([m,l])=>`<button class="${ui.agendaMode===m?"active":""}" data-action="agenda-mode" data-value="${m}">${l}</button>`).join("")}</div></div>${content}</section><aside class="agenda-right"><section class="agenda-prepare"><span class="eyebrow">PREPÁRATE</span>${person?`<div class="profile-line">${avatar(person)}<div><strong>${esc(person.name)}</strong><span>${esc(personMeta(person))}</span></div></div><span class="eyebrow">TEMAS SUGERIDOS</span><ul class="prepare-list"><li>${esc(person.tags?.[0]||"Contexto actual")}</li><li>${esc(openCommitmentsFor(store,person.id)[0]?.title||"Próximo paso")}</li><li>${esc(opportunitiesFor(store,person.id)[0]?.title||"Actualizar relación")}</li></ul><div class="prepare-docs"><span>ÚLTIMO CONTACTO</span><span>${esc(lastInteraction(store,person.id)?formatRelative(lastInteraction(store,person.id).date):"Sin historial")}</span></div><button class="btn" data-action="open-person" data-id="${esc(person.id)}">VER PERFIL ${icon("arrow",13)}</button>`:`<p class="muted-copy">Cuando tengas una reunión próxima, ORBITA concentra acá el contexto de esa persona.</p>`}</section><section class="protected-time"><span class="eyebrow">CONTEXTO DE AGENDA</span><strong>${meetings.length}</strong><span class="muted-copy">reuniones próximas</span><div class="bar-chart">${[9,15,12,25,32].map(h=>`<i style="height:${h}px"></i>`).join("")}</div></section></aside></div>`}

function activityRows(limit=5){return [...store.interactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,limit).map(i=>{const p=personById(store,i.personId);return `<article class="recent-row"><button class="recent-main" data-action="edit-interaction" data-id="${esc(i.id)}"><span class="soft-icon">${icon("note",13)}</span><span><strong>${esc(i.title)}</strong><span>${esc(p?.name||"")} · ${esc(formatRelative(i.date))}</span></span><span class="activity-type">${esc(i.type)}</span></button><button class="icon-btn" data-action="open-person" data-id="${esc(i.personId)}" aria-label="Abrir persona" title="Abrir relación">${icon("arrow",14)}</button></article>`}).join("")}
function dataSummary(){const counts=Object.fromEntries(["Cercano","Estratégico","Activo","Nuevo"].map(c=>[c,store.people.filter(p=>p.circle===c).length])),total=Math.max(store.people.length,1),recent=store.people.filter(p=>Date.now()-new Date(p.createdAt)<30*864e5).length,openCommitments=store.commitments.filter(c=>c.status!=="done").length;return `<div class="metric-grid"><div class="metric-card blue"><small>PERSONAS EN TU RED</small><strong>${store.people.length}</strong><span>contexto registrado</span></div><div class="metric-card paper"><small>NUEVAS ESTE MES</small><strong>${recent}</strong><span>altas registradas</span></div><div class="metric-card acid"><small>INTERACCIONES ESTA SEMANA</small><strong>${interactionsThisWeek()}</strong><span>actividad registrada</span></div><div class="metric-card"><small>COMPROMISOS ABIERTOS</small><strong>${openCommitments}</strong><span>pendientes reales</span></div></div><div class="data-bottom"><section class="data-panel"><span class="eyebrow">ACTIVIDAD RECIENTE</span>${activityRows(5)||`<p class="muted-copy">Sin actividad.</p>`}</section><section class="data-panel"><span class="eyebrow">DISTRIBUCIÓN DE TU RED</span><div class="dist-wrap"><div class="donut-holder"><div class="donut" style="${donutBackground(counts)}"></div><div class="donut-center"><strong>${store.people.length}</strong><span>NODOS</span></div></div><div class="dist-legend">${[["#2747ff","Estratégicas",counts.Estratégico],["#dcff00","Cercanas",counts.Cercano],["#62b36d","Activas",counts.Activo],["#6d685f","Nuevas",counts.Nuevo]].map(([c,n,v])=>`<div><i style="background:${c}"></i><span>${n}</span><strong>${Math.round(v/total*100)}%</strong></div>`).join("")}</div></div></section><section class="data-panel"><span class="eyebrow">INSIGHTS CLAVE</span><div class="insight-list"><div class="insight">${icon("link",15)}<div><strong>${store.people.filter(p=>relationshipState(store,p).tone==="good").length} relaciones están al día</strong><span>Según la cadencia que definiste.</span></div></div><div class="insight">${icon("clock",15)}<div><strong>${computeSignals(store).length} señales requieren atención</strong><span>Calculadas desde fechas y pendientes reales.</span></div></div><div class="insight">${icon("people",15)}<div><strong>${topTags(1)[0]?.name||"Sin tema dominante"}</strong><span>Es el tag más repetido en tu red.</span></div></div></div></section></div>`}
function dataRelations(){return `<section class="data-panel"><div class="section-head"><div><span class="eyebrow">RELACIONES</span><h2>Estado de tu red</h2></div><button class="btn btn-small" data-route="people">Abrir personas</button></div><div class="people-list" style="margin-top:10px">${store.people.map(personRow).join("")||`<p class="muted-copy" style="padding:12px">Sin personas.</p>`}</div></section>`}
function dataConnections(){const tags=topTags(8),opps=store.opportunities.filter(o=>o.stage!=="Cerrada").sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)),counts=Object.fromEntries(["Cercano","Estratégico","Activo","Nuevo"].map(c=>[c,store.people.filter(p=>p.circle===c).length]));return `<div class="data-bottom two-col"><section class="data-panel"><span class="eyebrow">CONEXIONES</span><h2>Mapa por intención</h2><p class="muted-copy">La red se organiza por círculos definidos por vos; ORBITA no puntúa el valor humano.</p><div class="dist-wrap"><div class="donut-holder"><div class="donut" style="${donutBackground(counts)}"></div><div class="donut-center"><strong>${store.people.length}</strong><span>NODOS</span></div></div><div class="dist-legend">${["Cercano","Estratégico","Activo","Nuevo"].map((c,i)=>`<div><i style="background:${["#dcff00","#2747ff","#62b36d","#6d685f"][i]}"></i><span>${c}</span><strong>${store.people.filter(p=>p.circle===c).length}</strong></div>`).join("")}</div></div><button class="btn btn-small" data-route="network">Abrir mapa de red</button></section><section class="data-panel"><div class="section-head"><div><span class="eyebrow">OPORTUNIDADES</span><h2>Posibilidades abiertas</h2></div><button class="text-btn" data-action="capture-kind" data-kind="opportunity">+ Nueva</button></div><div class="opportunity-list compact">${opps.map(o=>{const p=personById(store,o.personId);return `<button data-action="edit-opportunity" data-id="${esc(o.id)}"><div><strong>${esc(o.title)}</strong><span>${esc(p?.name||"")} · ${esc(o.notes||"Sin notas")}</span></div><span class="stage-pill">${esc(o.stage)}</span></button>`}).join("")||`<p class="muted-copy">Todavía no registraste oportunidades.</p>`}</div><div class="topics-block"><span class="eyebrow">TEMAS DE LA RED</span><div class="topic-chips">${tags.map(t=>`<span class="topic-chip">${esc(t.name)} · ${t.count}</span>`).join("")||`<span class="muted-copy">Todavía no hay tags.</span>`}</div></div></section></div>`}
function dataActivity(){return `<section class="data-panel"><div class="section-head"><div><span class="eyebrow">ACTIVIDAD</span><h2>Historial manual</h2></div><button class="btn btn-small" data-action="capture-kind" data-kind="interaction">Registrar</button></div><div style="margin-top:10px">${activityRows(20)||`<p class="muted-copy">Sin actividad registrada.</p>`}</div></section>`}
function dataFiles(){return `<div class="data-bottom" style="grid-template-columns:1fr 1fr"><section class="data-panel"><span class="eyebrow">EXPORTAR</span><h2>Descargar información</h2><div class="export-list"><button data-action="export-json"><span class="export-icon">${icon("download")}</span><div><strong>Backup completo</strong><span>JSON reimportable</span></div>${icon("arrow",14)}</button><button data-action="export-csv"><span class="export-icon">${icon("download")}</span><div><strong>Personas</strong><span>CSV para Excel / Sheets</span></div>${icon("arrow",14)}</button><button data-action="export-report"><span class="export-icon">${icon("download")}</span><div><strong>Informe de red</strong><span>Markdown de lectura humana</span></div>${icon("arrow",14)}</button></div></section><section class="data-panel"><span class="eyebrow">IMPORTAR</span><h2>Traer información</h2><div class="export-list"><button data-action="import-json"><span class="export-icon">${icon("upload")}</span><div><strong>Backup ORBITA</strong><span>Reemplaza el estado actual tras confirmar</span></div>${icon("arrow",14)}</button><button data-action="import-csv"><span class="export-icon">${icon("upload")}</span><div><strong>Contactos CSV</strong><span>Agrega personas a tu red</span></div>${icon("arrow",14)}</button></div></section></div>`}
function dataSettings(){const audit=auditStore(store),bytes=audit.sizeBytes,email=authSession?.user?.email||"—",cloud=authSession?.mode==="cloud";return `<div class="settings-stack"><div class="data-bottom" style="grid-template-columns:1fr 1fr"><section class="data-panel"><div class="section-head"><div><span class="eyebrow">PERFIL</span><h2>Tu espacio</h2></div><button class="text-btn" data-action="edit-profile">Editar</button></div><dl class="profile-dl"><div><dt>Nombre</dt><dd>${esc(store.profile.name)}</dd></div><div><dt>Rol</dt><dd>${esc(store.profile.role)}</dd></div><div><dt>Foco</dt><dd>${esc(store.profile.focus)}</dd></div><div><dt>Almacenamiento</dt><dd>${(bytes/1024).toFixed(1)} KB</dd></div></dl></section><section class="data-panel account-panel"><div class="section-head"><div><span class="eyebrow">CUENTA Y SEGURIDAD</span><h2>${cloud?"Cuenta cloud":"Modo local"}</h2></div><span class="account-state ${cloud?"cloud":"local"}">${cloud?icon("cloud",14):icon("database",14)} ${cloud?"SYNC ACTIVO":"SOLO NAVEGADOR"}</span></div><dl class="profile-dl"><div><dt>Email</dt><dd>${esc(email)}</dd></div><div><dt>Sesión</dt><dd>${cloud?"Supabase Auth":"Desarrollo local"}</dd></div><div><dt>Estado</dt><dd>${esc(syncStatus)}</dd></div></dl><div class="account-actions">${cloud?`<button class="btn btn-primary" data-action="sync-now">${icon("cloud")} Sincronizar ahora</button>`:""}<button class="btn btn-ghost" data-action="start-onboarding">Repetir onboarding</button><button class="btn btn-ghost" data-action="sign-out">${icon("logout")} Salir</button></div></section></div><div class="data-bottom" style="grid-template-columns:1fr 1fr"><section class="data-panel audit-preview"><div class="section-head"><div><span class="eyebrow">SALUD DEL WORKSPACE</span><h2>${audit.ok?"Todo consistente":"Requiere atención"}</h2></div><span class="audit-badge ${audit.ok?"good":"risk"}">${audit.errors} ERR · ${audit.warnings} AVISOS</span></div><p class="muted-copy">Revisa referencias huérfanas, IDs, fechas y tamaño del workspace.</p><button class="btn btn-ghost" data-action="open-audit">${icon("shield")} Ejecutar auditoría</button></section><section class="danger-card"><span class="eyebrow">MANTENIMIENTO</span><h2>Reiniciar datos</h2><p class="muted-copy">Hacé un backup antes. Estas acciones reemplazan el estado guardado y, si usás cloud, se sincronizan.</p><div class="danger-actions"><button class="btn btn-ghost" data-action="reset-demo">${icon("refresh")} Restaurar demo</button><button class="btn btn-danger" data-action="erase-all">${icon("trash")} Empezar vacío</button>${cloud?`<button class="btn btn-danger" data-action="delete-account">${icon("shield")} Eliminar cuenta cloud</button>`:""}</div></section></div></div>`}
function dataView(){const tab=ui.dataTab,content=tab==="summary"?dataSummary():tab==="relations"?dataRelations():tab==="connections"?dataConnections():tab==="activity"?dataActivity():tab==="files"?dataFiles():dataSettings();return `${pageHead("05","DATOS","Información que impulsa decisiones",`<button class="btn btn-primary" data-action="export-report">${icon("download")} Exportar informe</button>`)}<div class="data-layout"><aside class="data-nav">${[["summary","database","Resumen"],["relations","people","Relaciones"],["connections","network","Conexiones"],["activity","note","Actividad"],["files","archive","Archivos"],["settings","refresh","Configuración"]].map(([id,ic,label])=>`<button class="${tab===id?"active":""}" data-action="data-tab" data-value="${id}">${icon(ic,14)} ${label}</button>`).join("")}</aside><section class="data-content">${content}</section></div>`}

function openPersonDrawer(personId) {
  const person = personById(store, personId);
  if (!person) return toast("La persona ya no existe.", "warn");
  const interactions = interactionsFor(store, person.id);
  const commitments = store.commitments.filter(c => c.personId === person.id);
  const opportunities = store.opportunities.filter(o => o.personId === person.id);
  const personMeetings = store.meetings.filter(m => m.personId === person.id).sort((a,b) => new Date(b.start) - new Date(a.start));
  const rel = relationshipState(store, person);
  const nextMeeting = upcomingMeetings(store).find(m => m.personId === person.id);

  drawerContent.innerHTML = `
    <div class="drawer-head"><button class="icon-btn drawer-close" data-action="close-drawer" aria-label="Cerrar">${icon("close")}</button><div class="drawer-person">${avatar(person, "avatar-lg")}<div><div class="drawer-title-line"><h2>${esc(person.name)}</h2>${circlePill(person.circle)}</div><p>${esc(personMeta(person))}${person.city ? ` · ${esc(person.city)}` : ""}</p></div></div><div class="drawer-actions"><button class="btn btn-ghost" data-action="edit-person" data-id="${esc(person.id)}">${icon("edit")} Editar</button><button class="btn btn-primary" data-action="capture-for-person" data-id="${esc(person.id)}">${icon("plus")} Registrar</button></div></div>

    <div class="drawer-body">
      <section class="relationship-strip"><div><span>Estado</span>${statePill(rel)}</div><div><span>Cadencia</span><strong>${person.cadenceDays} días</strong></div><div><span>Último registro</span><strong>${esc(interactions[0] ? formatRelative(interactions[0].date) : "Sin historial")}</strong></div><div><span>Próximo follow-up</span><strong>${esc(person.nextFollowUp ? formatDate(person.nextFollowUp) : "Sin fecha")}</strong></div></section>

      ${nextMeeting ? `<section class="brief-banner"><div><span class="eyebrow">PRÓXIMA REUNIÓN</span><strong>${esc(nextMeeting.title)}</strong><span>${esc(formatDateTime(nextMeeting.start))}</span></div><button class="btn btn-small" data-action="brief-meeting" data-id="${esc(nextMeeting.id)}">Abrir brief</button></section>` : ""}

      <section class="drawer-section"><div class="section-head"><div><span class="eyebrow">CONTEXTO</span><h3>Qué importa de esta relación</h3></div><button class="text-btn" data-action="edit-person" data-id="${esc(person.id)}">Editar</button></div><p class="context-copy">${esc(person.relation || "Todavía no agregaste contexto relacional.")}</p>${person.tags.length ? `<div class="tag-list">${person.tags.map(t => `<span>${esc(t)}</span>`).join("")}</div>` : ""}${person.notes ? `<div class="private-note"><span>NOTA</span><p>${esc(person.notes)}</p></div>` : ""}</section>

      <section class="drawer-section"><div class="section-head"><div><span class="eyebrow">COMPROMISOS</span><h3>Pendientes y cumplidos</h3></div><button class="text-btn" data-action="capture-kind" data-kind="commitment" data-person-id="${esc(person.id)}">+ Agregar</button></div>${commitments.length ? `<div class="mini-list">${commitments.map(c => `<div class="mini-row ${c.status === "done" ? "done" : ""}"><button class="check-btn ${c.status === "done" ? "checked" : ""}" data-action="toggle-commitment" data-id="${esc(c.id)}">${icon("check",14)}</button><div><strong>${esc(c.title)}</strong><span>${c.dueDate ? formatDate(c.dueDate) : "Sin fecha"}</span></div><button class="icon-btn" data-action="edit-commitment" data-id="${esc(c.id)}">${icon("edit",15)}</button></div>`).join("")}</div>` : `<p class="muted-copy">Sin compromisos registrados.</p>`}</section>

      <section class="drawer-section"><div class="section-head"><div><span class="eyebrow">OPORTUNIDADES</span><h3>Posibilidades abiertas</h3></div><button class="text-btn" data-action="capture-kind" data-kind="opportunity" data-person-id="${esc(person.id)}">+ Agregar</button></div>${opportunities.length ? `<div class="opportunity-list">${opportunities.map(o => `<button data-action="edit-opportunity" data-id="${esc(o.id)}"><div><strong>${esc(o.title)}</strong><span>${esc(o.notes || "Sin notas")}</span></div><span class="stage-pill">${esc(o.stage)}</span></button>`).join("")}</div>` : `<p class="muted-copy">Sin oportunidades registradas.</p>`}</section>

      <section class="drawer-section"><div class="section-head"><div><span class="eyebrow">REUNIONES</span><h3>Agenda de esta relación</h3></div><button class="text-btn" data-action="capture-kind" data-kind="meeting" data-person-id="${esc(person.id)}">+ Agendar</button></div>${personMeetings.length ? `<div class="opportunity-list">${personMeetings.map(m => `<button data-action="edit-meeting" data-id="${esc(m.id)}"><div><strong>${esc(m.title)}</strong><span>${esc(formatDateTime(m.start))} · ${m.durationMin} min</span></div><span class="stage-pill">${m.status === "done" ? "Realizada" : "Próxima"}</span></button>`).join("")}</div>` : `<p class="muted-copy">Sin reuniones registradas.</p>`}</section>

      <section class="drawer-section"><div class="section-head"><div><span class="eyebrow">HISTORIAL</span><h3>Interacciones</h3></div><button class="text-btn" data-action="capture-kind" data-kind="interaction" data-person-id="${esc(person.id)}">+ Registrar</button></div>${interactions.length ? `<div class="timeline">${interactions.map(i => `<article><div class="timeline-dot"></div><div class="timeline-date">${esc(formatDate(i.date))}</div><div class="timeline-content"><div class="timeline-title"><strong>${esc(i.title)}</strong><span>${esc(i.type)}</span></div>${i.notes ? `<p>${esc(i.notes)}</p>` : ""}<button class="text-btn subtle" data-action="edit-interaction" data-id="${esc(i.id)}">Editar</button></div></article>`).join("")}</div>` : `<p class="muted-copy">Todavía no registraste interacciones.</p>`}</section>

      <section class="drawer-section contact-section"><div class="section-head"><div><span class="eyebrow">CONTACTO</span><h3>Datos básicos</h3></div><button class="text-btn" data-action="edit-person" data-id="${esc(person.id)}">Editar</button></div><div class="contact-grid">${person.email ? `<a href="mailto:${esc(person.email)}">${icon("mail")}<span>${esc(person.email)}</span></a>` : `<span>${icon("mail")}<span>Sin email</span></span>`}${person.phone ? `<a href="tel:${esc(person.phone)}">${icon("phone")}<span>${esc(person.phone)}</span></a>` : `<span>${icon("phone")}<span>Sin teléfono</span></span>`}${person.linkedin ? `<a href="${esc(safeExternalUrl(person.linkedin))}" target="_blank" rel="noreferrer">${icon("external")}<span>LinkedIn</span></a>` : `<span>${icon("external")}<span>Sin LinkedIn</span></span>`}</div></section>

      <section class="drawer-danger"><button class="text-danger" data-action="delete-person" data-id="${esc(person.id)}">${icon("trash",15)} Eliminar persona y sus registros</button></section>
    </div>`;
  openDrawer();
}


function openAgentOpportunity(personId) {
  const goal = store.profile.currentGoal || "";
  const result = buildRelationalOpportunities(store, goal).find(item => item.contact_id === personId);
  const person = personById(store, personId);
  if (!result || !person) return toast("No hay evidencia suficiente para esta oportunidad.", "warn");
  drawerContent.innerHTML = `
    <div class="drawer-head">
      <button class="icon-btn drawer-close" data-action="close-drawer" aria-label="Cerrar">${icon("close")}</button>
      <div>
        <span class="eyebrow">OPORTUNIDAD RELACIONAL</span>
        <h2>${esc(person.name)}</h2>
        <p>${esc(personMeta(person))}</p>
      </div>
      <div class="agent-drawer-score"><strong>${result.relevance_score}</strong><span>RELEVANCIA</span></div>
    </div>
    <div class="drawer-body agent-drawer">
      <section class="agent-goal-context">
        <span class="eyebrow">OBJETIVO</span>
        <strong>${esc(goal)}</strong>
        <p>${esc(result.reason)}</p>
      </section>

      <section class="drawer-section">
        <span class="eyebrow">HECHOS USADOS</span>
        <h3>Evidencia trazable</h3>
        <div class="evidence-list">
          ${result.evidence.map(fact => `<article><span>${esc(fact.source)}</span><p>${esc(fact.text)}</p></article>`).join("")}
        </div>
      </section>

      <section class="drawer-section inference-box">
        <span class="eyebrow">INFERENCIA</span>
        <p>${esc(result.inference)}</p>
        <small>Confianza: ${esc(result.confidence)} · Esto es una inferencia de ÓRBITA, no un hecho guardado.</small>
      </section>

      <section class="next-action-box">
        <span class="eyebrow">SIGUIENTE ACCIÓN</span>
        <strong>${esc(result.suggested_action)}</strong>
      </section>

      <div class="drawer-footer-actions">
        <button class="btn btn-primary" data-action="open-person" data-id="${esc(person.id)}">${icon("person")} Abrir relación</button>
        <button class="btn btn-ghost" data-action="capture-kind" data-kind="interaction" data-person-id="${esc(person.id)}">${icon("note")} Registrar interacción</button>
      </div>
    </div>`;
  openDrawer();
}

function openMeetingBrief(meetingId) {
  const brief = buildMeetingBrief(store, meetingId);
  if (!brief) return toast("No pude construir el brief.", "warn");
  const { meeting, person, interactions, commitments, opportunities, relationship, context, suggestedFocus } = brief;
  drawerContent.innerHTML = `
    <div class="drawer-head"><button class="icon-btn drawer-close" data-action="close-drawer">${icon("close")}</button><div><span class="eyebrow">MEETING BRIEF</span><h2>${esc(meeting.title)}</h2><p>${esc(formatDateTime(meeting.start))} · ${meeting.durationMin} min</p></div><div class="drawer-actions"><button class="btn btn-ghost" data-action="edit-meeting" data-id="${esc(meeting.id)}">${icon("edit")} Editar</button></div></div>
    <div class="drawer-body brief-body">
      <section class="brief-person">${avatar(person, "avatar-lg")}<div><strong>${esc(person.name)}</strong><span>${esc(personMeta(person))}</span></div>${statePill(relationship)}</section>
      <section class="brief-focus"><span class="eyebrow">FOCO SUGERIDO</span><h3>${esc(suggestedFocus)}</h3><p>Esta sugerencia sale de tus compromisos y oportunidades abiertas; no de una inferencia externa.</p></section>
      <section class="drawer-section"><span class="eyebrow">CONTEXTO RELACIONAL</span><p class="context-copy">${esc(context)}</p></section>
      <div class="brief-columns"><section class="drawer-section"><div class="section-head"><div><span class="eyebrow">PENDIENTES</span><h3>Compromisos</h3></div></div>${commitments.length ? commitments.map(c => `<div class="brief-item"><span class="brief-bullet"></span><div><strong>${esc(c.title)}</strong><span>${c.dueDate ? formatDate(c.dueDate) : "Sin fecha"}</span></div></div>`).join("") : `<p class="muted-copy">Sin compromisos abiertos.</p>`}</section><section class="drawer-section"><div class="section-head"><div><span class="eyebrow">POSIBILIDADES</span><h3>Oportunidades</h3></div></div>${opportunities.length ? opportunities.map(o => `<div class="brief-item"><span class="brief-bullet violet"></span><div><strong>${esc(o.title)}</strong><span>${esc(o.stage)}</span></div></div>`).join("") : `<p class="muted-copy">Sin oportunidades abiertas.</p>`}</section></div>
      <section class="drawer-section"><div class="section-head"><div><span class="eyebrow">ÚLTIMOS REGISTROS</span><h3>Historia reciente</h3></div></div>${interactions.length ? interactions.map(i => `<div class="brief-history"><span>${esc(formatDate(i.date))}</span><div><strong>${esc(i.title)}</strong><p>${esc(i.notes || "Sin notas")}</p></div></div>`).join("") : `<p class="muted-copy">Sin historial todavía.</p>`}</section>
      ${meeting.notes ? `<section class="drawer-section"><span class="eyebrow">NOTA DE LA REUNIÓN</span><p class="context-copy">${esc(meeting.notes)}</p></section>` : ""}
      <div class="drawer-footer-actions"><button class="btn btn-primary" data-action="capture-kind" data-kind="interaction" data-person-id="${esc(person.id)}">${icon("note")} Registrar resultado</button><button class="btn btn-ghost" data-action="done-meeting" data-id="${esc(meeting.id)}">${icon("check")} Marcar realizada</button></div>
    </div>`;
  openDrawer();
}

function openCapture(personId = "") {
  ui.capturePersonId = personId;
  ui.captureKind = "";
  modalContent.innerHTML = `
    <div class="modal-head"><div><span class="eyebrow">CAPTURAR</span><h2>¿Qué querés registrar?</h2><p>Elegí el tipo de información. Todo se puede editar después.</p></div><button class="icon-btn" data-action="close-modal">${icon("close")}</button></div>
    <div class="capture-types">
      ${captureType("person", "person", "Persona", "Alguien que querés recordar con contexto")}
      ${captureType("interaction", "note", "Interacción", "Reunión, mensaje, llamada, café o nota")}
      ${captureType("commitment", "check", "Compromiso", "Algo que vos o la relación dejó pendiente")}
      ${captureType("meeting", "calendar", "Reunión", "Un encuentro futuro que querés preparar")}
      ${captureType("opportunity", "spark", "Oportunidad", "Una posibilidad que vale la pena seguir")}
    </div>`;
  openModal();
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
  } else if (kind === "meeting") {
    const entity = id ? store.meetings.find(x => x.id === id) : null;
    const future = new Date(); future.setHours(future.getHours() + 1, 0, 0, 0);
    html = formShell(kind, entity ? "Editar reunión" : "Nueva reunión", "Agendala manualmente para que ORBITA pueda prepararte el contexto.", `<div class="form-grid">
      ${personSelectField(entity?.personId || presetPersonId)}
      ${field("Título", "title", entity?.title || "", { required: true, wide: true, placeholder: "Ej. Café de seguimiento" })}
      ${field("Fecha y hora", "start", localDateTime(entity?.start || future.toISOString()), { type: "datetime-local", required: true })}
      ${field("Duración (min)", "durationMin", entity?.durationMin || 30, { type: "number", min: 5, max: 480 })}
      ${selectField("Estado", "status", [{value:"upcoming",label:"Próxima"},{value:"done",label:"Realizada"}], entity?.status || "upcoming")}
      ${textareaField("Objetivo / nota", "notes", entity?.notes || "", "Qué querés conversar o recordar antes de entrar.")}
    </div>`, id);
  } else if (kind === "profile") {
    html = formShell(kind, "Tu espacio", "Identidad, foco y preferencias relacionales. Todo se puede cambiar.", `<div class="form-grid">
      ${field("Nombre del espacio", "name", store.profile.name, { required: true })}
      ${field("Rol", "role", store.profile.role)}
      ${field("Foco", "focus", store.profile.focus, { wide: true })}
      ${field("Cadencia base (días)", "defaultCadenceDays", store.profile.defaultCadenceDays || 30, { type: "number", min: 1, max: 365 })}
      ${field("Objetivos", "goals", (store.profile.goals || []).join(", "), { wide: true, hint: "Ej: followups, meetings, network, opportunities" })}
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
  } else if (kind === "meeting") {
    const payload = { id: id || makeId("m"), personId: data.personId, title: data.title.trim(), start: new Date(data.start).toISOString(), durationMin: Number(data.durationMin || 30), notes: data.notes.trim(), status: data.status };
    if (id) store.meetings = store.meetings.map(x => x.id === id ? payload : x); else store.meetings.push(payload);
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
  const map = { interaction: "interactions", commitment: "commitments", opportunity: "opportunities", meeting: "meetings" };
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
    { label: "Agendar reunión", kind: "meeting", icon: "calendar" },
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
    form = `<div class="auth-notice"><strong>FUNCTIONAL ALPHA · ACCESO LOCAL</strong><p>ORBITA ya puede usarse de punta a punta sin depender del backend. Tus relaciones, agenda, contexto y cambios quedan guardados en este navegador mientras terminamos la integración cloud.</p></div><button class="auth-primary" data-action="auth-local">ENTRAR A ORBITA →</button><p class="auth-footnote">Backend-ready: Auth, sync y persistencia cloud están desacoplados detrás de adaptadores y se activan cuando pasen QA.</p>`;
  } else if (view === "signup") {
    form = `<form id="auth-signup-form" class="auth-form"><label><span>NOMBRE</span><input name="name" autocomplete="name" placeholder="Iván" /></label><label><span>EMAIL</span><input name="email" type="email" autocomplete="email" required placeholder="vos@empresa.com" /></label><label><span>CONTRASEÑA</span><input name="password" type="password" autocomplete="new-password" minlength="12" required placeholder="12+ caracteres" /><small>12+ caracteres · mayúscula · minúscula · número · símbolo</small></label><button class="auth-primary" type="submit">CREAR CUENTA →</button></form><button class="auth-link" data-action="auth-view" data-value="login">Ya tengo cuenta</button>`;
  } else if (view === "recover") {
    form = `<form id="auth-recover-form" class="auth-form"><label><span>EMAIL</span><input name="email" type="email" autocomplete="email" required placeholder="vos@empresa.com" /></label><button class="auth-primary" type="submit">ENVIAR ENLACE →</button></form><button class="auth-link" data-action="auth-view" data-value="login">Volver al login</button>`;
  } else if (view === "password") {
    form = `<form id="auth-password-form" class="auth-form"><label><span>NUEVA CONTRASEÑA</span><input name="password" type="password" autocomplete="new-password" minlength="12" required placeholder="12+ caracteres" /><small>12+ caracteres · mayúscula · minúscula · número · símbolo</small></label><label><span>REPETIR CONTRASEÑA</span><input name="confirm" type="password" autocomplete="new-password" minlength="12" required /></label><button class="auth-primary" type="submit">ACTUALIZAR CONTRASEÑA →</button></form>`;
  } else {
    form = `<form id="auth-login-form" class="auth-form"><label><span>EMAIL</span><input name="email" type="email" autocomplete="email" required placeholder="vos@empresa.com" /></label><label><span>CONTRASEÑA</span><input name="password" type="password" autocomplete="current-password" required /></label><button class="auth-primary" type="submit">INGRESAR →</button></form><div class="auth-links"><button class="auth-link" data-action="auth-view" data-value="recover">Olvidé mi contraseña</button><button class="auth-link" data-action="auth-view" data-value="signup">Crear cuenta</button></div>`;
  }
  authContent.innerHTML = `<section class="auth-brand"><img src="/assets/orbita-mark.svg" alt=""/><strong>ORBITA</strong><span>INTELIGENCIA RELACIONAL</span><p>Tu red no es una lista de contactos.<br/>Es contexto, historia y próximos movimientos.</p></section><section class="auth-card"><div class="auth-card-head"><span>${eyebrow}</span><h1>${title}</h1><p>${configured ? "Acceso privado a tu espacio relacional." : "Prototipo funcional navegable · persistencia local · backend preparado para integración."}</p></div>${message ? `<div class="auth-message">${esc(message)}</div>` : ""}${form}<div class="auth-security">${icon("shield",16)} <span>ORBITA nunca necesita una secret/service key en el navegador.</span></div></section>`;
  hydrateIcons(authContent);
  setTimeout(() => authContent.querySelector("input")?.focus(), 30);
}

function hideAuth() {
  authShell.classList.remove("open");
  authShell.setAttribute("aria-hidden", "true");
  appRoot.classList.remove("app-locked");
}

function showOnboarding(step = ui.onboardingStep) {
  ui.onboardingStep = Math.max(0, Math.min(3, step));
  onboardingShell.classList.add("open");
  onboardingShell.setAttribute("aria-hidden", "false");
  const hasCurrent = store.people.length > 0;
  const hasLegacy = Boolean(legacyStore());
  const progress = [0,1,2,3].map(i => `<i class="${i <= ui.onboardingStep ? "active" : ""}"></i>`).join("");
  let body = "";
  if (ui.onboardingStep === 0) {
    body = `<div class="onboard-hero"><span class="eyebrow">BIENVENIDO A ORBITA</span><h1>Construí memoria alrededor de tus relaciones.</h1><p>En menos de dos minutos dejamos listo tu espacio. Podés cambiar todo después.</p><div class="onboard-principles"><div><strong>01</strong><span>Personas con contexto</span></div><div><strong>02</strong><span>Próximos movimientos claros</span></div><div><strong>03</strong><span>Tu información bajo control</span></div></div><button class="auth-primary" data-action="onboarding-next">CONFIGURAR MI ESPACIO →</button></div>`;
  } else if (ui.onboardingStep === 1) {
    body = `<form id="onboarding-profile-form" class="onboard-form"><span class="eyebrow">01 · IDENTIDAD</span><h2>¿Cómo querés usar ORBITA?</h2><p>Esto personaliza el lenguaje del producto.</p><div class="form-grid"><label class="form-field"><span>NOMBRE DEL ESPACIO</span><input name="name" required value="${esc(store.profile.name === "Mi espacio" ? "" : store.profile.name)}" placeholder="Iván / KadmonTech"/></label><label class="form-field"><span>ROL</span><input name="role" value="${esc(store.profile.role)}" placeholder="Founder"/></label><label class="form-field wide"><span>FOCO PRINCIPAL</span><input name="focus" value="${esc(store.profile.focus)}" placeholder="Networking, fundraising, alianzas…"/></label></div><div class="onboard-actions"><button type="button" class="btn btn-ghost" data-action="onboarding-back">Atrás</button><button class="btn btn-primary" type="submit">Continuar →</button></div></form>`;
  } else if (ui.onboardingStep === 2) {
    const goals = new Set(store.profile.goals || []);
    const options = [["followups","No perder seguimientos"],["meetings","Llegar mejor preparado a reuniones"],["network","Entender mejor mi red"],["opportunities","Detectar oportunidades"],["memory","Recordar contexto importante"],["introductions","Conectar personas con intención"]];
    body = `<form id="onboarding-goals-form" class="onboard-form"><span class="eyebrow">02 · OBJETIVOS</span><h2>¿Qué querés que ORBITA cuide?</h2><p>Elegí lo que más importa hoy. No estamos fijando tu futuro.</p><div class="goal-grid">${options.map(([id,label])=>`<label class="goal-option"><input type="checkbox" name="goals" value="${id}" ${goals.has(id)?"checked":""}/><span>${icon("check",16)}</span><strong>${label}</strong></label>`).join("")}</div><label class="form-field cadence-field"><span>CADENCIA BASE SUGERIDA</span><select name="defaultCadenceDays"><option value="14" ${store.profile.defaultCadenceDays===14?"selected":""}>14 días</option><option value="30" ${store.profile.defaultCadenceDays===30?"selected":""}>30 días</option><option value="45" ${store.profile.defaultCadenceDays===45?"selected":""}>45 días</option><option value="60" ${store.profile.defaultCadenceDays===60?"selected":""}>60 días</option></select></label><div class="onboard-actions"><button type="button" class="btn btn-ghost" data-action="onboarding-back">Atrás</button><button class="btn btn-primary" type="submit">Continuar →</button></div></form>`;
  } else {
    body = `<div class="onboard-form"><span class="eyebrow">03 · PUNTO DE PARTIDA</span><h2>Elegí cómo empezar.</h2><p>ORBITA es manual-first por ahora. La entrada automática llegará después de entender qué información realmente vale.</p><div class="start-options">${hasCurrent?`<button data-action="onboarding-finish" data-value="keep"><span>${icon("database",21)}</span><div><strong>CONSERVAR MIS DATOS</strong><p>Seguir con las ${store.people.length} personas que ya están en este espacio.</p></div>${icon("arrow",16)}</button>`:""}${hasLegacy?`<button data-action="onboarding-finish" data-value="legacy"><span>${icon("upload",21)}</span><div><strong>RECUPERAR VERSIÓN ANTERIOR</strong><p>Encontramos datos locales de ORBITA V0.4 en este navegador.</p></div>${icon("arrow",16)}</button>`:""}<button data-action="onboarding-finish" data-value="demo"><span>${icon("spark",21)}</span><div><strong>EXPLORAR CON DEMO</strong><p>16 relaciones ficticias para entender el producto completo.</p></div>${icon("arrow",16)}</button><button data-action="onboarding-finish" data-value="empty"><span>${icon("plus",21)}</span><div><strong>EMPEZAR DESDE CERO</strong><p>Un espacio limpio. Tu primera acción será agregar una persona.</p></div>${icon("arrow",16)}</button></div><div class="onboard-actions"><button class="btn btn-ghost" data-action="onboarding-back">Atrás</button></div></div>`;
  }
  onboardingContent.innerHTML = `<section class="onboard-shell"><header><div class="onboard-brand"><img src="/assets/orbita-mark.svg" alt=""/><strong>ORBITA</strong></div><div class="onboard-progress">${progress}</div><button class="onboard-skip" data-action="onboarding-finish" data-value="keep">Saltar</button></header>${body}</section>`;
  hydrateIcons(onboardingContent);
}

function hideOnboarding() {
  onboardingShell.classList.remove("open");
  onboardingShell.setAttribute("aria-hidden", "true");
}

function finishOnboarding(mode = "keep") {
  const profile = { ...store.profile };
  if (mode === "demo") store = normalizeStore(deepClone(seedStore));
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
    today: ["HOY", "Tu centro de mando", "Acá aparecen reuniones próximas, compromisos y relaciones que necesitan atención. No es un feed: debería ayudarte a decidir qué hacer."],
    people: ["PERSONAS", "Tu memoria relacional", "Abrí cualquier persona para editar contexto, registrar interacciones, compromisos, reuniones y oportunidades."],
    network: ["RED", "Una vista, no un ranking", "Los círculos los definís vos. ORBITA no asigna valor humano automáticamente ni convierte vínculos en puntajes."],
    agenda: ["AGENDA", "Preparación antes que calendario", "Usá Día, Semana o Mes. Cada reunión puede abrir un brief construido solamente con la información que registraste."],
    data: ["DATOS", "Control y portabilidad", "Exportá JSON/CSV/Markdown, auditá el estado, revisá la cuenta y controlá dónde se guarda tu información."]
  };
  const [label,title,body] = guides[topic] || guides.today;
  drawerContent.innerHTML = `<div class="drawer-head"><button class="icon-btn drawer-close" data-action="close-drawer">${icon("close")}</button><div><span class="eyebrow">AYUDA · ${label}</span><h2>${title}</h2><p>Guía rápida de ORBITA.</p></div></div><div class="drawer-body help-body"><section class="help-lead"><p>${body}</p></section><section class="drawer-section"><span class="eyebrow">LO ESENCIAL</span><div class="help-steps"><div><strong>1</strong><p><b>Capturá.</b> Persona, interacción, compromiso, oportunidad o reunión.</p></div><div><strong>2</strong><p><b>Volvé al contexto.</b> Cada relación reúne su historia completa.</p></div><div><strong>3</strong><p><b>Actuá.</b> Hoy y Agenda te muestran lo que merece atención.</p></div></div></section><section class="drawer-section"><span class="eyebrow">ATAJOS</span><div class="shortcut-list"><div><kbd>⌘/Ctrl K</kbd><span>Buscar personas o crear registros</span></div><div><kbd>ESC</kbd><span>Cerrar paneles y modales</span></div></div></section><section class="drawer-section"><span class="eyebrow">DATOS Y PRIVACIDAD</span><p class="context-copy">En modo local, todo vive en este navegador. Con Supabase configurado, ORBITA sincroniza un workspace por usuario y la base debe tener RLS habilitado. Nunca uses una secret/service key en frontend.</p></section><div class="drawer-footer-actions"><button class="btn btn-primary" data-action="open-capture">${icon("plus")} Capturar algo</button><button class="btn btn-ghost" data-action="start-onboarding">Repetir onboarding</button></div></div>`;
  openDrawer();
}

function openAuditDrawer() {
  const audit = auditStore(store);
  const status = audit.ok ? "SALUDABLE" : "REQUIERE ATENCIÓN";
  drawerContent.innerHTML = `<div class="drawer-head"><button class="icon-btn drawer-close" data-action="close-drawer">${icon("close")}</button><div><span class="eyebrow">AUDITORÍA DEL WORKSPACE</span><h2>${status}</h2><p>${audit.errors} errores · ${audit.warnings} advertencias · ${(audit.sizeBytes/1024).toFixed(1)} KB</p></div></div><div class="drawer-body"><section class="audit-score ${audit.ok?"good":"risk"}"><strong>${audit.ok?"OK":"!"}</strong><div><h3>${audit.ok?"La estructura de datos es consistente.":"Hay referencias o datos que conviene reparar."}</h3><p>La auditoría revisa IDs duplicados, referencias huérfanas, fechas inválidas y tamaño local.</p></div></section><section class="drawer-section"><span class="eyebrow">HALLAZGOS</span>${audit.issues.length?`<div class="audit-list">${audit.issues.map(i=>`<div class="audit-item ${i.severity}"><span>${i.severity==="error"?"ERROR":"AVISO"}</span><p>${esc(i.message)}</p></div>`).join("")}</div>`:`<p class="context-copy">No encontramos problemas estructurales en este workspace.</p>`}</section><div class="drawer-footer-actions">${audit.issues.length?`<button class="btn btn-primary" data-action="repair-store">${icon("refresh")} Reparar automáticamente</button>`:""}<button class="btn btn-ghost" data-action="export-json">${icon("download")} Backup antes de tocar nada</button></div></div>`;
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
          toast("Detectamos cambios locales y remotos. ORBITA no sobrescribió ninguno automáticamente.", "warn");
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
  if (el.dataset.route) { go(el.dataset.route); return; }
  const action = el.dataset.action;
  const id = el.dataset.id;
  if (action === "auth-view") showAuth(el.dataset.value || "login");
  else if (action === "auth-local") { authSession = useLocalMode(); await enterApp(authSession); }
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
  else if (action === "capture-kind") openEntityForm(el.dataset.kind, "", el.dataset.personId || ui.capturePersonId || "");
  else if (action === "capture-for-person") openCapture(id);
  else if (action === "open-person") openPersonDrawer(id);
  else if (action === "edit-person") openEntityForm("person", id);
  else if (action === "edit-interaction") openEntityForm("interaction", id);
  else if (action === "edit-commitment") openEntityForm("commitment", id);
  else if (action === "edit-opportunity") openEntityForm("opportunity", id);
  else if (action === "edit-meeting") openEntityForm("meeting", id);
  else if (action === "brief-meeting") openMeetingBrief(id);
  else if (action === "agent-opportunity") openAgentOpportunity(id);
  else if (action === "close-drawer") closeDrawer();
  else if (action === "close-modal") closeModal();
  else if (action === "close-command") closeCommand();
  else if (action === "delete-person") deletePerson(id);
  else if (action === "delete-entity") deleteEntity(el.dataset.kind, id);
  else if (action === "toggle-commitment") {
    const c = store.commitments.find(x => x.id === id); if (!c) return; c.status = c.status === "done" ? "open" : "done"; saveStore(c.status === "done" ? "Compromiso completado" : "Compromiso reabierto"); if (drawerShell.classList.contains("open")) openPersonDrawer(c.personId);
  }
  else if (action === "done-meeting") { const m = store.meetings.find(x=>x.id===id); if (!m) return; m.status="done"; closeDrawer(); saveStore("Reunión marcada como realizada"); }
  else if (action === "people-filter") { ui.circleFilter = el.dataset.value; renderCurrentRoute(); }
  else if (action === "network-filter") { ui.networkFilter = el.dataset.value; renderCurrentRoute(); }
  else if (action === "cycle-network-filter") { const opts=["Todos","Cercano","Estratégico","Activo","Nuevo"]; ui.networkFilter=opts[(opts.indexOf(ui.networkFilter)+1)%opts.length]; renderCurrentRoute(); }
  else if (action === "agenda-mode") { ui.agendaMode=el.dataset.value||"week"; renderCurrentRoute(); }
  else if (action === "agenda-select-date") { ui.agendaAnchor=el.dataset.value||ui.agendaAnchor; ui.agendaMode="day"; renderCurrentRoute(); }
  else if (action === "agenda-today") { ui.agendaAnchor=new Date().toISOString().slice(0,10); renderCurrentRoute(); }
  else if (action === "agenda-nav") { const d=agendaDate(); const dir=Number(el.dataset.value||1); if(ui.agendaMode==="month")d.setMonth(d.getMonth()+dir); else d.setDate(d.getDate()+dir*(ui.agendaMode==="week"?7:1)); ui.agendaAnchor=dateKey(d); renderCurrentRoute(); }
  else if (action === "open-opportunities") { ui.dataTab="connections"; go("data"); renderCurrentRoute(); }
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
  if (form.id === "onboarding-goals-form") {
    event.preventDefault();
    const fd = new FormData(form);
    store.profile = { ...store.profile, goals: fd.getAll("goals").map(String), defaultCadenceDays: Number(fd.get("defaultCadenceDays") || 30) };
    showOnboarding(3); return;
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
