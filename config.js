export const runtimeConfig = Object.freeze({
  supabaseUrl: "__ORBITA_SUPABASE_URL__",
  supabasePublishableKey: "__ORBITA_SUPABASE_PUBLISHABLE_KEY__",
  appUrl: "__ORBITA_APP_URL__"
});

export function cloudConfigured() {
  const url = runtimeConfig.supabaseUrl;
  const key = runtimeConfig.supabasePublishableKey;
  return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) &&
    key.startsWith("sb_publishable_");
}
