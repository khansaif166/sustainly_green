/**
 * Product SEO rules, shared by the product forms (live word counter), the
 * vendor product API (server-side enforcement) and the admin SEO Health page.
 * Keep this file free of server-only imports so client components can use it.
 */

/** Upper bound for the description field (the DB column is unbounded text). */
export const DESCRIPTION_MAX_CHARS = 5000;

/** Vendors cannot submit a new/rewritten description shorter than this. */
export const MIN_DESCRIPTION_WORDS = 100;

/** Target length that gives Google enough unique content to index a page. */
export const RECOMMENDED_DESCRIPTION_WORDS = 150;

/** Below this a description is "thin" — the main cause of non-indexing. */
const THIN_DESCRIPTION_WORDS = 50;

export function wordCount(text: string | null | undefined): number {
  const trimmed = (text || "").trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/** Validation message for a description, or null when it is long enough. */
export function descriptionError(text: string | null | undefined): string | null {
  const words = wordCount(text);
  if (words >= MIN_DESCRIPTION_WORDS) return null;
  return `Description must be at least ${MIN_DESCRIPTION_WORDS} words (currently ${words}). Describe the material, sizes/variants, uses, certifications and delivery so buyers — and Google — can find this listing.`;
}

export type DescriptionHint = {
  words: number;
  tone: "bad" | "ok" | "good";
  text: string;
};

/** Live feedback for the word counter under the description textarea. */
export function descriptionHint(text: string): DescriptionHint {
  const words = wordCount(text);
  if (words < MIN_DESCRIPTION_WORDS) {
    return {
      words,
      tone: "bad",
      text: `${words} words · minimum ${MIN_DESCRIPTION_WORDS} (${MIN_DESCRIPTION_WORDS - words} more needed)`,
    };
  }
  if (words < RECOMMENDED_DESCRIPTION_WORDS) {
    return {
      words,
      tone: "ok",
      text: `${words} words · good, ${RECOMMENDED_DESCRIPTION_WORDS}+ words ranks better`,
    };
  }
  return { words, tone: "good", text: `${words} words · great length for search` };
}

// ── Catalogue health ────────────────────────────────────────────────────────

export type SeoIssueCode =
  | "NO_DESCRIPTION"
  | "THIN_DESCRIPTION"
  | "SHORT_DESCRIPTION"
  | "DUPLICATE_DESCRIPTION"
  | "DUPLICATE_TITLE"
  | "NO_IMAGE"
  | "ONE_IMAGE"
  | "VAGUE_TITLE"
  | "LONG_TITLE"
  | "NO_PRICE"
  | "NO_CATEGORY";

export type SeoSeverity = "critical" | "warning";

export const SEO_ISSUES: Record<
  SeoIssueCode,
  { label: string; fix: string; severity: SeoSeverity; penalty: number }
> = {
  NO_DESCRIPTION: {
    label: "No description",
    fix: `Write a ${RECOMMENDED_DESCRIPTION_WORDS}+ word description.`,
    severity: "critical",
    penalty: 45,
  },
  THIN_DESCRIPTION: {
    label: `Thin description (<${THIN_DESCRIPTION_WORDS} words)`,
    fix: `Expand to ${RECOMMENDED_DESCRIPTION_WORDS}+ words: material, sizes, uses, certifications, delivery, FAQs.`,
    severity: "critical",
    penalty: 35,
  },
  SHORT_DESCRIPTION: {
    label: `Short description (<${MIN_DESCRIPTION_WORDS} words)`,
    fix: `Add detail to reach ${RECOMMENDED_DESCRIPTION_WORDS}+ words.`,
    severity: "warning",
    penalty: 15,
  },
  DUPLICATE_DESCRIPTION: {
    label: "Duplicate description",
    fix: "Same text as another listing — Google indexes only one. Rewrite it.",
    severity: "critical",
    penalty: 25,
  },
  DUPLICATE_TITLE: {
    label: "Duplicate title",
    fix: "Another listing has the same title. Merge them or make each title specific.",
    severity: "critical",
    penalty: 20,
  },
  NO_IMAGE: {
    label: "No image",
    fix: "Add 3–5 real product photos.",
    severity: "critical",
    penalty: 25,
  },
  ONE_IMAGE: {
    label: "Only 1 image",
    fix: "Add 2–4 more photos (angles, packaging, in use).",
    severity: "warning",
    penalty: 8,
  },
  VAGUE_TITLE: {
    label: "Vague title",
    fix: "Use material + product + size/variant, e.g. “Organic Raw Chia Seeds – 500g”.",
    severity: "warning",
    penalty: 10,
  },
  LONG_TITLE: {
    label: "Title too long",
    fix: "Keep titles under 70 characters so Google doesn't cut them off.",
    severity: "warning",
    penalty: 5,
  },
  NO_PRICE: {
    label: "No price",
    fix: "Add a price or starting price to qualify for Google's product rich results.",
    severity: "warning",
    penalty: 10,
  },
  NO_CATEGORY: {
    label: "No category",
    fix: "Assign a category so the product appears on its category page.",
    severity: "warning",
    penalty: 10,
  },
};

export type SeoProductInput = {
  id: string;
  title: string;
  description: string | null;
  vendorName: string | null;
  categoryId: string | null;
  price: number | string | null;
  priceType: string | null;
  imageCount: number;
  updatedAt?: string | null;
};

export type SeoProductReport = {
  id: string;
  title: string;
  vendorName: string;
  words: number;
  imageCount: number;
  score: number;
  issues: SeoIssueCode[];
  updatedAt?: string | null;
};

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Same rule the public product page uses to decide whether a price is shown. */
export function hasPublicPrice(price: number | string | null, priceType: string | null) {
  const value = typeof price === "string" ? Number(price) : price;
  return typeof value === "number" && Number.isFinite(value) && value > 0 && priceType !== "Price on Request";
}

export function analyzeProductSeo(products: SeoProductInput[]): SeoProductReport[] {
  const titleCounts = new Map<string, number>();
  const descriptionCounts = new Map<string, number>();
  // Descriptions are compared on their opening text: copy-pasted listings
  // usually differ only in a trailing size or name, if at all.
  const descriptionKey = (text: string | null) => {
    if (wordCount(text) < 5) return "";
    return normalize(text || "").slice(0, 160);
  };

  for (const product of products) {
    const title = normalize(product.title);
    if (title) titleCounts.set(title, (titleCounts.get(title) || 0) + 1);
    const key = descriptionKey(product.description);
    if (key) descriptionCounts.set(key, (descriptionCounts.get(key) || 0) + 1);
  }

  return products.map((product) => {
    const issues: SeoIssueCode[] = [];
    const words = wordCount(product.description);
    const title = product.title.trim();

    if (words === 0) issues.push("NO_DESCRIPTION");
    else if (words < THIN_DESCRIPTION_WORDS) issues.push("THIN_DESCRIPTION");
    else if (words < MIN_DESCRIPTION_WORDS) issues.push("SHORT_DESCRIPTION");

    const key = descriptionKey(product.description);
    if (key && (descriptionCounts.get(key) || 0) > 1) issues.push("DUPLICATE_DESCRIPTION");
    if ((titleCounts.get(normalize(title)) || 0) > 1) issues.push("DUPLICATE_TITLE");

    if (product.imageCount === 0) issues.push("NO_IMAGE");
    else if (product.imageCount === 1) issues.push("ONE_IMAGE");

    if (wordCount(title) <= 2) issues.push("VAGUE_TITLE");
    else if (title.length > 70) issues.push("LONG_TITLE");

    if (!hasPublicPrice(product.price, product.priceType)) issues.push("NO_PRICE");
    if (!product.categoryId) issues.push("NO_CATEGORY");

    const penalty = issues.reduce((sum, code) => sum + SEO_ISSUES[code].penalty, 0);

    return {
      id: product.id,
      title,
      vendorName: product.vendorName || "Unknown vendor",
      words,
      imageCount: product.imageCount,
      score: Math.max(0, 100 - penalty),
      issues,
      updatedAt: product.updatedAt,
    };
  });
}
