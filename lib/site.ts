const FALLBACK_SITE_URL = "https://www.sustainlygreen.com";

export const SITE_NAME = "Sustainly Green";
export const SITE_DESCRIPTION =
  "India's B2B sustainability marketplace for discovering verified green suppliers, sustainable products, certifications, and responsible sourcing solutions.";

export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || FALLBACK_SITE_URL;

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}
