/**
 * WaveBench App Configuration
 * 
 * GitHub Actions secret injection placeholders.
 * When deployed via GitHub Actions, values are automatically injected from GitHub Secrets:
 *  - SUPABASE_URL
 *  - SUPABASE_PUBLISHABLE_KEY
 */

window.WAVEBENCH_CONFIG = {
  // Supabase Project URL (Injected via GitHub Actions or set manually for local testing)
  SUPABASE_URL: "SUPABASE_URL_PLACEHOLDER",

  // Supabase Publishable Key (Client Public Key - Injected via GitHub Actions or set manually)
  SUPABASE_PUBLISHABLE_KEY: "SUPABASE_PUBLISHABLE_KEY_PLACEHOLDER",

  // Set to false for live Supabase database submissions.
  // Automatically falls back to mock mode if placeholders are not replaced.
  MOCK_SUBMISSION: false
};

// Initialize Supabase JS Client safely
(function initSupabaseClient() {
  const config = window.WAVEBENCH_CONFIG;
  const isPlaceholder = !config.SUPABASE_URL || config.SUPABASE_URL.includes("PLACEHOLDER") || !config.SUPABASE_PUBLISHABLE_KEY || config.SUPABASE_PUBLISHABLE_KEY.includes("PLACEHOLDER");
  
  if (isPlaceholder) {
    console.warn("WaveBench Config Notice: Supabase URL/Publishable Key placeholders detected. Running in Demo / Mock Submission mode.");
    config.MOCK_SUBMISSION = true;
    window.supabaseClient = null;
    return;
  }

  if (typeof supabase !== "undefined" && supabase.createClient) {
    window.supabaseClient = supabase.createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY);
    console.log("Supabase Client initialized successfully with Publishable Key.");
  } else {
    console.warn("Supabase JS library not loaded.");
    config.MOCK_SUBMISSION = true;
  }
})();
