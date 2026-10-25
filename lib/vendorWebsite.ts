/**
 * A vendor's company website, from the listing details (Excel "Website"
 * column, stored in vendors.public_contact.website). Returns the link and a
 * short label for display — "ecoepicsolar.com" rather than the full URL.
 */
export function vendorWebsite(
  publicContact: Record<string, unknown> | undefined,
  fallback?: unknown,
): { url: string; label: string } | null {
  for (const value of [publicContact?.website, fallback]) {
    if (typeof value !== "string") continue;
    const url = value.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) continue;
    try {
      const label = new URL(url).hostname.replace(/^www\./i, "");
      if (label.includes(".")) return { url, label };
    } catch {
      // not a usable link; try the next value
    }
  }
  return null;
}
