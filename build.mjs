import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { build as bundle } from "esbuild";

const root = process.cwd();
const out = path.join(root, "dist");
const publicFiles = ["index.html", "styles.css", "app.js", "core.js", "seed.js", "auth.js", "cloud.js", "config.js", "solana.js", "404.html"];

for (const file of [...publicFiles, "orbita-mark.svg", "orbita-logo.png"]) await access(path.join(root, file));

function validateCloudEnv() {
  // V0.5 stage gate:
  // ORBITA remains a fully usable local-first Functional Alpha until cloud is
  // explicitly enabled. Partial env configuration must never break production.
  const enableCloud = String(process.env.ORBITA_ENABLE_CLOUD || "").toLowerCase() === "true";
  const url = process.env.ORBITA_SUPABASE_URL || "";
  const key = process.env.ORBITA_SUPABASE_PUBLISHABLE_KEY || "";
  const explicitAppUrl = process.env.ORBITA_APP_URL || "";
  const inferredAppUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "";
  const appUrl = explicitAppUrl || inferredAppUrl;

  if (!enableCloud) {
    const supplied = [url, key, explicitAppUrl].filter(Boolean).length;
    if (supplied > 0) {
      console.warn("ORBITA cloud variables are present but cloud is intentionally disabled. Running LOCAL ALPHA. Set ORBITA_ENABLE_CLOUD=true only when backend integration is ready for QA.");
    }
    return { configured: false, url: "", key: "", appUrl: "" };
  }

  if (!url || !key) {
    throw new Error("Cloud activation requested but configuration is incomplete. Set ORBITA_SUPABASE_URL and ORBITA_SUPABASE_PUBLISHABLE_KEY before ORBITA_ENABLE_CLOUD=true.");
  }
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
    throw new Error("ORBITA_SUPABASE_URL is invalid.");
  }
  if (!key.startsWith("sb_publishable_")) {
    throw new Error("ORBITA_SUPABASE_PUBLISHABLE_KEY must be a modern sb_publishable_ key. Secret/service/legacy keys are rejected from browser builds.");
  }

  if (appUrl) {
    let parsed;
    try { parsed = new URL(appUrl); } catch { throw new Error("ORBITA_APP_URL is invalid."); }
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
      throw new Error("ORBITA_APP_URL must use HTTPS (localhost excepted for development).");
    }
  }

  return {
    configured: true,
    url,
    key,
    appUrl: appUrl ? appUrl.replace(/\/$/, "") : ""
  };
}

const cloud = validateCloudEnv();

await rm(out, { recursive: true, force: true });
await mkdir(path.join(out, "assets"), { recursive: true });
for (const file of publicFiles) await cp(path.join(root, file), path.join(out, file));
await cp(path.join(root, "orbita-mark.svg"), path.join(out, "assets", "orbita-mark.svg"));
await cp(path.join(root, "orbita-logo.png"), path.join(out, "assets", "orbita-logo.png"));
const solanaEntry = await readFile(path.join(root, "solana-client.entry.js"), "utf8");
await bundle({
  absWorkingDir: root,
  nodePaths: [path.join(root, "node_modules")],
  stdin: { contents: solanaEntry, resolveDir: root, sourcefile: "solana-client.entry.js", loader: "js" },
  outfile: "dist/solana-client.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2022"],
  minify: true,
  legalComments: "none"
});

const replacements = {
  "__ORBITA_SUPABASE_URL__": cloud.url || "__ORBITA_SUPABASE_URL__",
  "__ORBITA_SUPABASE_PUBLISHABLE_KEY__": cloud.key || "__ORBITA_SUPABASE_PUBLISHABLE_KEY__",
  "__ORBITA_APP_URL__": cloud.appUrl || "__ORBITA_APP_URL__"
};
let config = await readFile(path.join(out, "config.js"), "utf8");
for (const [placeholder, value] of Object.entries(replacements)) {
  config = config.replaceAll(placeholder, String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"'));
}
await writeFile(path.join(out, "config.js"), config);

const html = await readFile(path.join(out, "index.html"), "utf8");
if (!html.includes("ORBITA") || !html.includes('id="view-root"') || !html.includes('id="auth-shell"')) {
  throw new Error("Build sanity check failed.");
}

console.log(`ORBITA build complete → ${out}`);
console.log(cloud.configured
  ? "Runtime mode: CLOUD ALPHA (validated + injected)"
  : "Runtime mode: LOCAL ALPHA (backend adapters ready, cloud disabled by stage gate)");
