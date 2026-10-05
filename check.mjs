import { access, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const required = [
  "index.html", "styles.css", "alpha.css", "app.js", "alpha.js", "core.js", "seed.js", "auth.js", "cloud.js", "config.js", "orbita-mark.svg", "orbita-logo.png",
  "vercel.json", "package.json", "README.md", "PROJECT_STATUS.md", "QA-REPORT.md", "ORBITA_CANON_V0.5.md", "ORBITA_CANON_V0.6.1.md", "CODEX_TOMORROW_HANDOFF.md",
  "AUTH-SETUP.md", "SECURITY.md", "AUDIT-REPORT-V0.5.md", ".env.example",
  "supabase/schema.sql",
  "supabase/migrations/20260815153417_orbita_v05_hardened_workspace.sql",
  "supabase/migrations/20260815153451_orbita_v05_optimize_rls_initplans.sql",
  "supabase/migrations/20260815153845_orbita_v05_server_fields_and_revision.sql",
  "supabase/migrations/20261005133000_orbita_private_alpha.sql",
  "supabase/functions/delete-account/index.ts",
  "ARCHITECTURE-DECISIONS.md", "PRODUCT-STAGE.md", "ORBITA_V0.6_EXPERIENCE.md",
  "solana.js", "CHANGELOG_HACKATHON.md", "DEMO.md", "ARCHITECTURE_HACKATHON.md", "SECURITY_HACKATHON.md",
  ".github/workflows/validate.yml"
];
for (const file of required) await access(path.join(root, file));

const read = file => readFile(path.join(root, file), "utf8");
const [html, css, alphaCss, app, alpha, core, auth, cloud, config, solana, sql, alphaSql, vercel, pkg, workflow, edge] = await Promise.all([
  read("index.html"), read("styles.css"), read("alpha.css"), read("app.js"), read("alpha.js"), read("core.js"), read("auth.js"), read("cloud.js"), read("config.js"), read("solana.js"),
  read("supabase/schema.sql"), read("supabase/migrations/20261005133000_orbita_private_alpha.sql"), read("vercel.json"), read("package.json"), read(".github/workflows/validate.yml"), read("supabase/functions/delete-account/index.ts")
]);

const checks = [
  [html.includes('id="view-root"'), "view root"],
  [html.includes('id="auth-shell"'), "auth shell"],
  [html.includes('id="onboarding-shell"'), "onboarding shell"],
  [html.includes('id="sync-chip"'), "sync status"],
  [html.includes('id="import-csv-file"'), "CSV input"],
  [html.includes('src="/alpha.js"') && html.includes('href="/alpha.css"'), "Private Alpha assets loaded"],
  [css.includes("--acid:#dcff00"), "acid palette"],
  [css.includes("--blue:#2747ff"), "blue palette"],
  [css.includes("ORBITA V0.5"), "V0.5 compatibility UX layer"],
  [css.includes("ORBITA V0.6 — EXPERIENCE UPGRADE"), "V0.6 experience layer"],
  [css.includes(":focus-visible"), "keyboard focus"],
  [app.includes("function todayView"), "today route"],
  [app.includes("function peopleView"), "people route"],
  [app.includes("function networkView"), "network route"],
  [app.includes("function dataView"), "data route"],
  [app.includes("function showAuth"), "auth UI"],
  [app.includes("function showOnboarding"), "onboarding UI"],
  [app.includes("function openHelp"), "help center"],
  [app.includes("function openAuditDrawer"), "workspace audit UI"],
  [app.includes("function openDeleteAccountModal"), "account deletion UX"],
  [app.includes('form.id === "delete-account-form"'), "account deletion submit"],
  [app.includes("function passwordPolicyError"), "password policy"],
  [app.includes("password.length < 12"), "12-char password baseline"],
  [app.includes("function hasLocalSnapshot"), "real local snapshot detection"],
  [app.includes("Never let normalizeStore()"), "fresh-browser overwrite regression guard"],
  [app.includes("scheduleCloudSync"), "cloud sync"],
  [app.includes("submitEntityForm"), "CRUD"],
  [core.includes("computeSignals"), "signal engine"],
  [core.includes("parseContactsCSV"), "CSV parser"],
  [core.includes("auditStore"), "data audit"],
  [core.includes("repairStore"), "data repair"],
  [core.includes("buildRelationalOpportunities"), "relational opportunity engine"],
  [app.includes('id="relational-goal-form"'), "founder goal UI"],
  [app.includes("function attentionQueue"), "needs-attention queue"],
  [app.includes("function relationshipTimeline"), "relationship timeline"],
  [app.includes('action === "network-mode"'), "goal-aware network mode"],
  [app.includes('id="capture-draft"'), "freeform relational capture"],
  [app.includes('id="onboarding-goal-form"'), "goal-first onboarding"],
  [app.includes("PROBAR CON UNA RED DEMO"), "one-click demo onboarding"],
  [app.includes("EMPEZAR CON MI RED"), "own-network onboarding path"],
  [!app.includes('id="onboarding-profile-form"'), "identity setup removed from first-value onboarding"],
  [!app.includes("tutorialTip") && !css.includes(".tutorial-tip"), "contextual tutorial banners removed"],
  [css.includes(".onboard-choice-grid") && css.includes("V0.6.3 — VISUAL FINISH"), "V0.6.3 compact visual styles"],
  [app.includes('document.body.classList.add("no-scroll")') && app.includes('document.body.classList.remove("no-scroll")'), "onboarding prevents double document scroll"],
  [app.includes('networkMode: "goal"'), "network defaults goal-first"],
  [app.includes('data-action="open-goal-network"'), "HOY to goal-network CTA"],
  [app.includes('data-action="network-mode" data-value="all"'), "full network fallback"],
  [!html.includes('data-route="agenda"'), "Agenda removed from primary navigation"],
  [!app.includes("function agendaView"), "Agenda view removed"],
  [!app.includes("function openMeetingBrief"), "Meeting Brief UI removed"],
  [!app.includes('data-kind="meeting"'), "meeting capture removed"],
  [!app.includes('brief-meeting'), "meeting brief action removed"],
  [!app.includes("LOCAL · EXPLICABLE"), "local implementation badge removed"],
  [app.includes('const collections = ["people","interactions","commitments","opportunities","meetings"]'), "legacy meeting backup compatibility"],
  [app.includes('data-action="define-goal"'), "network empty-state goal CTA"],
  [!app.includes("PREPARAR ACCIÓN"), "relational CTA semantics aligned"],
  [app.includes('aria-label="Abrir relación con'), "people rows have semantic accessible labels"],
  [!app.includes("!nextMeeting"), "person detail has no removed Agenda variable"],
  [app.includes('esc(topTags(1)[0]?.name||"Sin tema dominante")'), "dominant tag output is escaped"],
  [app.includes("const persisted = persistLocalSnapshot(store)"), "save success reflects local persistence"],
  [app.includes('collections.some(key => key in parsed && !Array.isArray(parsed[key]))'), "JSON import validates present collections without requiring missing legacy arrays"],
  [core.includes("function recordList"), "malformed collection entries are normalized safely"],
  [core.includes("function boundedNumber"), "invalid numeric data falls back safely"],
  [!core.includes("Reuniones próximas:"), "legacy meetings stay out of active Markdown report"],
  [html.includes('class="mobile-add" data-action="open-capture" aria-label="Capturar"'), "mobile capture has accessible name"],
  [solana.includes("orbita:v1:introduction"), "privacy-minimal Solana memo adapter"],
  [auth.includes('/token?grant_type=password'), "password auth"],
  [auth.includes('/recover'), "password recovery"],
  [cloud.includes("class CloudConflictError"), "cloud conflict type"],
  [cloud.includes("revision=eq.${revision}"), "optimistic concurrency filter"],
  [cloud.includes("deleteCloudAccount"), "server-side account deletion client"],
  [cloud.includes("payload_schema_version"), "payload schema metadata"],
  [config.includes('key.startsWith("sb_publishable_")'), "publishable-only runtime config"],
  [sql.includes("enable row level security"), "RLS enabled"],
  [sql.includes("force row level security"), "FORCE RLS"],
  [sql.includes("revoke all on table public.orbita_workspaces from public, anon, authenticated"), "default table grants revoked"],
  [sql.includes("grant update (workspace)"), "least-privilege update grant"],
  [sql.includes("payload_schema_version integer"), "payload schema column"],
  [sql.includes("revision bigint"), "server revision column"],
  [sql.includes("new.revision = old.revision + 1"), "server revision increment"],
  [sql.includes("is_anonymous"), "anonymous Auth users blocked"],
  [sql.includes("on delete cascade"), "workspace deletion cascade"],
  [edge.includes('Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")'), "service credential server-side env only"],
  [edge.includes('body.confirm !== "ELIMINAR"'), "destructive confirmation"],
  [edge.includes("ALLOWED_ORIGINS"), "edge origin allowlist"],
  [vercel.includes("https://tbxrglthrieafejxjecm.supabase.co"), "exact dedicated ORBITA Supabase CSP origin"],
  [!vercel.includes("https://*.supabase.co"), "no wildcard Supabase CSP"],
  [vercel.includes('"value": "no-referrer"'), "private referrer policy"],
  [vercel.includes("no-store, max-age=0"), "runtime config no-store"],
  [pkg.includes('"version":"0.7.0-alpha.1"'), "V0.7.0 Private Alpha version"],
  [pkg.includes('"node":">=22 <25"'), "Node range"],
  [workflow.includes("node-version: 24"), "CI Node 24"],

  // Private Alpha contract
  [alphaSql.includes("create table if not exists public.orbita_tester_registry"), "tester registry table"],
  [alphaSql.includes("create table if not exists public.orbita_funnel_events"), "funnel events table"],
  [alphaSql.includes("create table if not exists public.orbita_tester_feedback"), "tester feedback table"],
  [alphaSql.includes("orbita_require_private_alpha_invite"), "invite-only Auth trigger"],
  [alphaSql.includes("orbita_link_private_alpha_user"), "tester to Auth linkage trigger"],
  [alphaSql.includes("survey_response_id text unique"), "survey respondent reference without survey duplication"],
  [alphaSql.includes("source_kind in ('customer_discovery', 'self_test', 'direct')"), "simulated records excluded from tester registry"],
  [alphaSql.includes("force row level security"), "Private Alpha tables force RLS"],
  [alpha.includes('"tester_invited"') === false, "tester_invited is server-side only"],
  [alpha.includes('track("first_login"'), "first login telemetry"],
  [alpha.includes('track("return_session"'), "return session telemetry"],
  [alpha.includes('track("goal_created"'), "goal telemetry"],
  [alpha.includes('track("first_person_created"'), "first person telemetry"],
  [alpha.includes('track("third_person_created"'), "third person telemetry"],
  [alpha.includes('track("first_opportunity_shown"'), "first opportunity telemetry"],
  [alpha.includes('track("opportunity_opened"'), "opportunity opened telemetry"],
  [alpha.includes('track("opportunity_marked_relevant"'), "opportunity relevance telemetry"],
  [alpha.includes('track("action_started"'), "action-start telemetry"],
  [alpha.includes("orbita_tester_feedback"), "tester support feedback client"],
  [alpha.includes("workspaceMode() === \"demo\""), "demo excluded from PMF product funnel"],
  [alphaCss.includes(".sidebar-feedback"), "minimal feedback entry styling"],
  [!alpha.includes("Fedetaque") && !alphaSql.includes("Fedetaque") && !alpha.includes("Federico Luis Taqueño") && !alphaSql.includes("Federico Luis Taqueño"), "no tester PII committed to public repo"]
];
for (const [ok, label] of checks) if (!ok) throw new Error(`Check failed: ${label}`);

for (const file of ["app.js", "alpha.js", "core.js", "seed.js", "auth.js", "cloud.js", "config.js", "solana.js", "build.mjs", "dev.mjs"]) {
  const result = spawnSync(process.execPath, ["--check", path.join(root, file)], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${file} syntax failed:\n${result.stderr}`);
}

const declaredActions = [...new Set((html + app).match(/data-action=\\?"([a-z0-9-]+)/g)?.map(x => x.match(/data-action=\\?"([a-z0-9-]+)/)[1]) || [])];
const handledActions = new Set([...app.matchAll(/action === "([a-z0-9-]+)"/g)].map(m => m[1]));
const missingActions = declaredActions.filter(action => !handledActions.has(action));
if (missingActions.length) throw new Error(`Unimplemented UI actions: ${missingActions.join(", ")}`);

const routes = [...new Set((html + app).match(/data-route=\\?"([a-z0-9-]+)/g)?.map(x => x.match(/data-route=\\?"([a-z0-9-]+)/)[1]) || [])];
const allowedRoutes = new Set(["today", "people", "network", "data"]);
const invalidRoutes = routes.filter(route => !allowedRoutes.has(route));
if (invalidRoutes.length) throw new Error(`Invalid routes: ${invalidRoutes.join(", ")}`);
if (routes.length !== 4 || ![...allowedRoutes].every(route => routes.includes(route))) {
  throw new Error(`Expected exactly 4 canonical routes, got: ${routes.join(", ")}`);
}

const visibleProductCopy = html + app;
for (const forbidden of ["LOCAL · EXPLICABLE", "LOCAL ALPHA", "SOLO NAVEGADOR", "FUNCTIONAL ALPHA · ACCESO LOCAL"]) {
  if (visibleProductCopy.includes(forbidden)) throw new Error(`Visible implementation copy remains: ${forbidden}`);
}

const browserSource = app + alpha + auth + cloud + config;
if (/sb_secret_|service_role/i.test(browserSource)) {
  throw new Error("Security check failed: browser source mentions a secret/service-role credential.");
}
if (/sb_secret_[A-Za-z0-9_-]+/.test(edge)) {
  throw new Error("Security check failed: Edge Function contains a literal secret key.");
}

for (const forbiddenTelemetryKey of ["relation", "notes", "email", "phone", "linkedin", "currentGoal", "goal_text", "person_name"]) {
  if (new RegExp(`properties\\s*[:=][\\s\\S]{0,160}${forbiddenTelemetryKey}`, "i").test(alpha)) {
    throw new Error(`Privacy check failed: telemetry properties may contain relational content key ${forbiddenTelemetryKey}.`);
  }
}

const partialCloud = spawnSync(process.execPath, [path.join(root, "build.mjs")], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env, ORBITA_ENABLE_CLOUD: "false", ORBITA_SUPABASE_URL: "https://tbxrglthrieafejxjecm.supabase.co", ORBITA_SUPABASE_PUBLISHABLE_KEY: "", ORBITA_APP_URL: "" }
});
if (partialCloud.status !== 0) throw new Error("Stage-gate check failed: partial cloud config must not break LOCAL ALPHA.");

const secretBuild = spawnSync(process.execPath, [path.join(root, "build.mjs")], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env, ORBITA_ENABLE_CLOUD: "true", ORBITA_SUPABASE_URL: "https://tbxrglthrieafejxjecm.supabase.co", ORBITA_SUPABASE_PUBLISHABLE_KEY: "sb_secret_SHOULD_NEVER_BUILD", ORBITA_APP_URL: "https://orbita-app-kappa.vercel.app" }
});
if (secretBuild.status === 0) throw new Error("Security check failed: secret-shaped browser build key was accepted when cloud activation was requested.");

console.log(`Checks passed (${required.length + checks.length + 14} assertions; ${declaredActions.length} UI actions covered).`);
