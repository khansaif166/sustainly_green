import { z } from "zod";
import { RICH_INDUSTRIES } from "./richVendorIndustries";

export const AD_LIMITS = { banner: 5, video: 3 } as const;
export const PROFILE_VIDEO_LIMIT = 3;
export type AdKind = keyof typeof AD_LIMITS;
export const MEDIA = {
  cover: { label: "Cover image", limit: 1, type: "image" },
  director: { label: "Director photo", limit: 1, type: "image" },
  contact: { label: "Contact person photo", limit: 1, type: "image" },
  gallery: { label: "Company and product gallery", limit: 20, type: "image" },
  partner: { label: "Trusted partner logos", limit: 5, type: "image" },
  intro: { label: "Company introduction video", limit: 1, type: "video" },
  video: { label: "Product and facility videos", limit: PROFILE_VIDEO_LIMIT, type: "video" },
  brochure: { label: "Company brochure", limit: 1, type: "pdf" },
  report: { label: "Sustainability report or policy", limit: 1, type: "pdf" },
  credential: { label: "Certification documents", limit: 20, type: "pdf" },
  award: { label: "Award images", limit: 20, type: "image" },
} as const;
export type MediaPurpose = keyof typeof MEDIA;
export type AssetType = (typeof MEDIA)[MediaPurpose]["type"];
export const ASSET_LIMIT_MB = { image: 5, pdf: 5, video: 25 } as const;
export const PROFILE_ATTACHMENT_BATCH_LIMIT_MB = 25;
export const ASSET_MIME_TYPES = {
  image: ["image/jpeg", "image/png", "image/webp"],
  pdf: ["application/pdf"],
  video: ["video/mp4", "video/webm"],
} satisfies Record<AssetType, string[]>;

const buyers = ["Brand Owners", "Manufacturers", "Retailers", "Wholesalers", "Distributors", "Importers", "Exporters", "Hotels", "Corporate Procurement", "Government", "E-commerce Sellers"];
export const CERTIFICATE_SCOPES = ["Company", "Facility", "Product", "Process", "Packaging"] as const;
export const CLAIM_STATUSES = ["Self-Declared", "Evidence Uploaded", "Sustainly Reviewed", "Third-Party Certified"] as const;
export const SOCIAL_PLATFORMS = ["LinkedIn", "Instagram", "Facebook", "YouTube", "X", "Other"] as const;

type Field = {
  key: string;
  label: string;
  type: "text" | "long" | "number" | "url" | "boolean" | "list" | "select";
  max?: number;
  options?: readonly string[];
};

export const RICH_FIELDS = [
  { title: "Company profile", fields: [
    { key: "brandName", label: "Display / brand name", type: "text", max: 100 },
    { key: "tagline", label: "Company tagline", type: "text", max: 120 },
    { key: "about", label: "About the company", type: "long" },
    { key: "industry", label: "Industry", type: "select", options: RICH_INDUSTRIES },
    { key: "website", label: "Company website", type: "url" },
    { key: "mapUrl", label: "Map location link", type: "url" },
    { key: "hours", label: "Business hours", type: "long" },
    { key: "udyam", label: "UDYAM registration number", type: "text" },
    { key: "buyersServed", label: "Buyer types served", type: "list", options: buyers },
    { key: "customersServed", label: "Number of customers served", type: "number" },
    { key: "employeeBand", label: "Employee size", type: "select", options: ["1–10", "11–50", "51–200", "201–500", "501–1,000", "1,000+", "5,000+", "10,000+", "100,000+"] },
  ] },
  { title: "People and contact", fields: [
    { key: "directorName", label: "Director name", type: "text" },
    { key: "directorRole", label: "Director title", type: "text" },
    { key: "publishDirector", label: "Publish director name and photo", type: "boolean" },
    { key: "contactName", label: "Public contact person name", type: "text" },
    { key: "contactRole", label: "Public contact person title", type: "text" },
    { key: "publishContact", label: "Publish contact person name and photo", type: "boolean" },
    { key: "phone", label: "Public company phone", type: "text" },
    { key: "whatsapp", label: "Public company WhatsApp", type: "text" },
    { key: "email", label: "Public company email", type: "text" },
  ] },
  { title: "Products and production", fields: [
    { key: "supplies", label: "Supplies / sells", type: "list", options: ["Finished Products", "Raw Materials", "Organic Ingredients", "Sustainable Packaging", "Private Label Manufacturing", "Testing Services", "ESG Advisory"] },
    { key: "offeringTypes", label: "Product offering types", type: "list", options: ["Finished Products", "Raw Materials", "Ingredients", "Components", "Packaging Materials", "Recycled Materials", "By-products", "Equipment", "Services"] },
    { key: "productionModels", label: "Supply / manufacturing models", type: "list", options: ["Made to Stock", "Made to Order", "Bulk Supply", "Small-Batch", "Private Label", "White Label", "OEM", "ODM", "Contract Manufacturing", "Custom Formulation"] },
  ] },
  { title: "Sustainability and commercial preferences", fields: [
    { key: "focusAreas", label: "Sustainability focus areas", type: "list", options: ["Organic", "Natural", "Recycled Materials", "Circular Economy", "Sustainable Packaging", "Low Carbon", "Renewable Energy", "Water Conservation", "Waste Reduction", "Ethical Sourcing", "Traceability", "Vegan", "Cruelty-Free"] },
    { key: "preferredBuyers", label: "Preferred buyer types", type: "list", options: buyers },
    { key: "preferredIndustries", label: "Preferred buyer industries", type: "list", max: 5, options: RICH_INDUSTRIES },
    { key: "preferredGeography", label: "Preferred buyer geography", type: "list" },
  ] },
  { title: "Procurement preferences", fields: [
    { key: "seekingMaterials", label: "Seeking raw materials or ingredients", type: "boolean" },
    { key: "procurementCategories", label: "Procurement needs", type: "list", options: ["Raw Materials", "Ingredients", "Packaging", "Components", "Machinery", "Testing", "Certification", "Logistics", "Waste Management", "Consulting"] },
    { key: "materialsNeeded", label: "Materials or ingredients needed", type: "list" },
    { key: "supplierLocations", label: "Preferred supplier locations", type: "list" },
    { key: "supplierRequirements", label: "Preferred supplier requirements", type: "list", options: ["Organic", "GRS", "FSC", "Recycled Content", "Traceable", "Low Carbon", "Fair Trade", "Vegan", "Other"] },
    { key: "publishProcurement", label: "Publish procurement preferences", type: "boolean" },
  ] },
] as const satisfies readonly { title: string; fields: readonly Field[] }[];

type FieldValue = string | number | boolean | string[];
export type RichFieldKey = (typeof RICH_FIELDS)[number]["fields"][number]["key"];
const text = (max: number) => z.string().trim().max(max);
const uuid = z.uuid();
const optionalDate = z.union([z.literal(""), z.iso.date()]);
const optionalUrl = text(2048).refine(value => !value || Boolean(safeWebUrl(value)), "Enter a valid HTTP or HTTPS URL.");

export const NEWS_HEADLINE_LIMIT = 160;
export const NEWS_BODY_LIMIT = 6000;

const newsUpdateSchema = z.object({
  id: uuid,
  headline: text(NEWS_HEADLINE_LIMIT),
  date: optionalDate,
  body: text(NEWS_BODY_LIMIT),
  imageId: z.union([z.literal(""), uuid]),
  sourceUrl: optionalUrl,
  published: z.boolean(),
}).refine(item => !item.published || Boolean(item.headline && item.date && item.body),
  "Enter a headline, display date and body to publish an update.");

export type RichNewsUpdate = z.output<typeof newsUpdateSchema>;
export type PublicNewsUpdate = Pick<RichNewsUpdate, "id" | "headline" | "date" | "body"> & {
  imageUrl?: string;
  sourceUrl?: string;
};

export const richContentSchema = z.strictObject({
  fields: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])).default({}).transform((values, ctx) => {
    const fields: Partial<Record<RichFieldKey, FieldValue>> = {};
    for (const group of RICH_FIELDS) {
      for (const entry of group.fields) {
        const field: Field = entry;
        const value = values[field.key];
        if (value === undefined || value === "") continue;
        const schema = field.type === "boolean" ? z.boolean()
          : field.type === "number" ? z.number().int().min(0).max(2_147_483_647)
          : field.type === "list" ? z.array(text(120).min(1)).max(field.max ?? 20)
          : field.type === "url" ? optionalUrl
          : text(field.max ?? (field.type === "long" ? 6000 : 160));
        const parsed = schema.safeParse(value);
        const selected = Array.isArray(value) ? value : [value];
        const validOptions = !field.options || selected.every(item => typeof item === "string" && field.options?.includes(item));
        if (!parsed.success || !validOptions || (field.key === "brandName" && typeof value === "string" && value.trim().length < 2) ||
            (field.key === "email" && !z.email().safeParse(value).success) ||
            ((field.key === "phone" || field.key === "whatsapp") && !phoneDial(value))) {
          ctx.addIssue({ code: "custom", message: `Check the value for ${field.label}.` });
          continue;
        }
        if (parsed.data !== "" && (!Array.isArray(parsed.data) || parsed.data.length)) {
          fields[entry.key] = Array.isArray(parsed.data) ? Array.from(new Set(parsed.data)) : parsed.data;
        }
      }
    }
    return fields;
  }),
  socialLinks: z.array(z.object({ platform: z.enum(SOCIAL_PLATFORMS), url: optionalUrl.refine(Boolean) })).max(12).default([]),
  categories: z.array(z.object({ categoryId: uuid, subcategoryId: z.union([z.literal(""), uuid]) })).max(5).default([]),
  certificates: z.array(z.object({
    name: text(160).min(1), issuer: text(160), bodyId: z.union([z.literal(""), uuid]),
    number: text(120), scope: z.union([z.literal(""), z.enum(CERTIFICATE_SCOPES)]),
    issued: optionalDate, expires: optionalDate, proofUrl: optionalUrl,
    documentId: z.union([z.literal(""), uuid]),
  }).refine(item => !item.issued || !item.expires || item.issued <= item.expires, "Certificate expiry cannot precede issue date.")).max(20).default([]),
  awards: z.array(z.object({
    name: text(160).min(1), issuer: text(160),
    year: text(4).refine(value => !value || /^[12]\d{3}$/.test(value), "Enter a four-digit award year."),
    proofUrl: optionalUrl, imageId: z.union([z.literal(""), uuid]),
  })).max(20).default([]),
  memberships: z.array(z.object({ name: text(160).min(1), proofUrl: optionalUrl })).max(20).default([]),
  news: z.array(newsUpdateSchema)
    .refine(items => new Set(items.map(item => item.id)).size === items.length, "Each update must have a unique ID.")
    .default([]),
  claimStatus: z.enum(CLAIM_STATUSES).optional(),
  basicPrefillReviewed: z.literal(true).optional(),
});
export type RichContent = z.output<typeof richContentSchema>;

export type EditorMedia = {
  id: string;
  purpose: MediaPurpose;
  title: string;
  sourceUrl: string | null;
  mimeType: string | null;
  fileVersion?: string | null;
};
export type EditorAd = {
  id: string;
  kind: AdKind;
  title: string;
  sourceUrl: string | null;
  mimeType: string | null;
  linkUrl: string | null;
  fileVersion: string | null;
  sortOrder: number;
  vendorEnabled: boolean;
  adminEnabled: boolean;
  deleted: boolean;
};
export type EditorData = {
  active: boolean;
  editable: boolean;
  approved: boolean;
  revision: number;
  content: RichContent;
  draftContent?: RichContent;
  media: EditorMedia[];
  ads: EditorAd[];
  href: string;
};
export type CatalogOptions = {
  categories: { id: string; name: string }[];
  subcategories: { id: string; name: string; category_id: string }[];
  bodies: { id: string; name: string }[];
};

export function safeWebUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return;
  try {
    const url = new URL(value.trim());
    if (["https:", "http:"].includes(url.protocol) && !url.username && !url.password && url.hostname.includes(".")) return url.href;
  } catch {}
}

export function phoneDial(value: unknown): string | undefined {
  if (typeof value !== "string" || !/^[\d+().\s-]+$/.test(value)) return;
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 7 && digits.length <= 15) return value.trim().startsWith("+") ? `+${digits}` : digits;
}

export function maskRegistration(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return;
  const clean = value.trim();
  const visible = Math.floor(clean.length / 2);
  return clean.slice(0, visible) + "X".repeat(clean.length - visible);
}

export function videoSource(input: unknown): { url: string; key: string; embedded: boolean } | undefined {
  const safe = safeWebUrl(input);
  if (!safe) return;
  const url = new URL(safe);
  if (url.protocol !== "https:") return;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (["youtube.com", "m.youtube.com", "youtube-nocookie.com", "youtu.be"].includes(host)) {
    const id = host === "youtu.be" ? url.pathname.slice(1).split("/")[0]
      : url.pathname === "/watch" ? url.searchParams.get("v")
      : url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
    if (id && /^[\w-]{11}$/.test(id)) {
      return { url: `https://www.youtube-nocookie.com/embed/${id}`, key: `youtube:${id}`, embedded: true };
    }
    return;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const match = url.pathname.match(/^\/(?:video\/)?(\d+)(?:\/([\w-]+))?\/?$/);
    if (!match) return;
    const hash = match[2] || url.searchParams.get("h");
    const suffix = hash && /^[\w-]+$/.test(hash) ? `?h=${hash}` : "";
    return { url: `https://player.vimeo.com/video/${match[1]}${suffix}`, key: `vimeo:${match[1]}`, embedded: true };
  }
  if (!/\.(?:mp4|webm)$/i.test(url.pathname)) return;
  url.hash = "";
  return { url: url.href, key: `direct:${url.origin}${url.pathname}`, embedded: false };
}
