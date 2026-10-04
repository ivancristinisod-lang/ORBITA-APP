import { access, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const required = [
  "index.html", "styles.css", "app.js", "core.js", "seed.js", "auth.js", "cloud.js", "config.js", "orbita-mark.svg", "orbita-logo.png",
  "vercel.json", "package.json", "README.md", "PROJECT_STATUS.md", "QA-REPORT.md", "ORBITA_CANON_V0.5.md",
  "AUTH-SETUP.md", "SECURITY.md", "AUDIT-REPORT-V0.5.md", ".env.example",
  "supabase/schema.sql",
  "supabase/migrations/20260815153417_orbita_v05_hardened_workspace.sql",
  "supabase/migrations/20260815153451_orbita_v05_optimize_rls_initplans.sql",
  "supabase/migrations/20260815153845_orbita_v05_server_fields_and_revision.sql",
  "supabase/functions/delete-account/index.ts",
  "ARCHITECTURE-DECISIONS.md", "PRODUCT-STAGE.md", "ORBITA_V0.6_EXPERIENCE.md",
  "solana.js", "CHANGELOG_HACKATHON.md", "DEMO.md", "ARCHITECTURE_HACKATHON.md", "SECURITY_HACKATHON.md",
  ".github/workflows/validate.yml"
];
for (const file of required) await access(path.join(root, file));

const read = file => readFile(path.join(root, file), "utf8");
const [html, css, app, core, auth, cloud, config, solana, sql, vercel, pkg, workflow, edge] = await Promise.all([
  read("index.html"), read("styles.css"), read("app.js"), read("core.js"), read("auth.js"), read("cloud.js"), read("config.js"), read("solana.js"),
  read("supabase/schema.sql"), read("vercel.json"), read("package.json"), read(".github/workflows/validate.yml"), read("supabase/functions/delete-account/index.ts")
]);

const checks = [
  [html.includes('id="view-root"'), "view root"],
  [html.includes('id="auth-shell"'), "auth shell"],
  [html.includes('id="onboarding-shell"'), "onboarding shell"],
  [html.includes('id="sync-chip"'), "sync status"],
  [html.includes('id="import-csv-file"'), "CSV input"],
  [css.includes("--acid:#dcff00"), "acid palette"],
  [css.includes("--blue:#2747ff"), "blue palette"],
  [css.includes("ORBITA V0.5"), "V0.5 compatibility UX layer"],
  [css.includes("ORBITA V0.6 — EXPERIENCE UPGRADE"), "V0.6 experience layer"],
  [css.includes(":focus-visible"), "keyboard focus"],
  [app.includes("function todayView"), "today route"],
  [app.includes("function peopleView"), "people route"],
  [app.includes("function networkView"), "network route"],
  [app.includes("function agendaView"), "agenda route"],
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
  [app.includes("openMeetingBrief"), "meeting brief"],
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
  [vercel.includes("https://tbxrglthrieafejxjecm.supabase.co"), "exact Supabase CSP origin"],
  [!vercel.includes("https://*.supabase.co"), "no wildcard Supabase CSP"],
  [vercel.includes('"value": "no-referrer"'), "private referrer policy"],
  [vercel.includes("no-store, max-age=0"), "runtime config no-store"],
  [pkg.includes('"version":"0.6.0"'), "V0.6 version"],
  [pkg.includes('"node":">=22 <25"'), "Node range"],
  [workflow.includes("node-version: 24"), "CI Node 24"]
];
for (const [ok, label] of checks) if (!ok) throw new Error(`Check failed: ${label}`);

for (const file of ["app.js", "core.js", "seed.js", "auth.js", "cloud.js", "config.js", "solana.js", "build.mjs", "dev.mjs"]) {
  const result = spawnSync(process.execPath, ["--check", path.join(root, file)], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${file} syntax failed:\n${result.stderr}`);
}

const declaredActions = [...new Set((html + app).match(/data-action=\\?"([a-z0-9-]+)/g)?.map(x => x.match(/data-action=\\?"([a-z0-9-]+)/)[1]) || [])];
const handledActions = new Set([...app.matchAll(/action === "([a-z0-9-]+)"/g)].map(m => m[1]));
const missingActions = declaredActions.filter(action => !handledActions.has(action));
if (missingActions.length) throw new Error(`Unimplemented UI actions: ${missingActions.join(", ")}`);

const routes = [...new Set((html + app).match(/data-route=\\?"([a-z0-9-]+)/g)?.map(x => x.match(/data-route=\\?"([a-z0-9-]+)/)[1]) || [])];
const allowedRoutes = new Set(["today", "people", "network", "agenda", "data"]);
const invalidRoutes = routes.filter(route => !allowedRoutes.has(route));
if (invalidRoutes.length) throw new Error(`Invalid routes: ${invalidRoutes.join(", ")}`);

const browserSource = app + auth + cloud + config;
if (/sb_secret_|service_role/i.test(browserSource)) {
  throw new Error("Security check failed: browser source mentions a secret/service-role credential.");
}
if (/sb_secret_[A-Za-z0-9_-]+/.test(edge)) {
  throw new Error("Security check failed: Edge Function contains a literal secret key.");
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
  env: { ...process.env, ORBITA_ENABLE_CLOUD: "true", ORBITA_SUPABASE_URL: "https://tbxrglthrieafejxjecm.supabase.co", ORBITA_SUPABASE_PUBLISHABLE_KEY: "sb_secret_SHOULD_NEVER_BUILD", ORBITA_APP_URL: "https://orbita-ten-khaki.vercel.app" }
});
if (secretBuild.status === 0) throw new Error("Security check failed: secret-shaped browser build key was accepted when cloud activation was requested.");

console.log(`Checks passed (${required.length + checks.length + 14} assertions; ${declaredActions.length} UI actions covered).`);
