import { RICH_INDUSTRIES } from "./richVendorIndustries";
import { phoneDial, richContentSchema, safeWebUrl, type CatalogOptions, type RichContent, type RichFieldKey } from "./richVendorProfile";

export const richPrefillColumns = [
  "company_name", "short_description", "primary_category", "sub_categories",
  "primary_contact_name", "designation", "business_email", "whatsapp", "alternate_phone",
  "target_industries", "preferred_buyer_geography", "public_contact",
].join(",");

export type RichPrefillSource = Partial<{
  company_name: string | null;
  short_description: string | null;
  primary_category: string | null;
  sub_categories: string[] | null;
  primary_contact_name: string | null;
  designation: string | null;
  business_email: string | null;
  whatsapp: string | null;
  alternate_phone: string | null;
  target_industries: string | null;
  preferred_buyer_geography: string | null;
  public_contact: Record<string, unknown> | null;
}>;

function normalizedName(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

const industryNames = new Map<string, string>(RICH_INDUSTRIES.map(name => [normalizedName(name), name]));

function matchCategories(source: RichPrefillSource, catalog: CatalogOptions): RichContent["categories"] {
  const name = normalizedName(source.primary_category);
  const category = name && catalog.categories.find(item => normalizedName(item.name) === name);
  if (!category) return [];

  const names = new Set((source.sub_categories ?? []).map(normalizedName).filter(Boolean));
  const subcategories = catalog.subcategories
    .filter(item => item.category_id === category.id && names.has(normalizedName(item.name)))
    .slice(0, 5);
  return subcategories.length
    ? subcategories.map(item => ({ categoryId: category.id, subcategoryId: item.id }))
    : [{ categoryId: category.id, subcategoryId: "" }];
}

function matchIndustries(value: string | null | undefined) {
  const names = (value ?? "").split(/[;|\n]+/).filter(name => name.trim()).flatMap(name => {
    const whole = industryNames.get(normalizedName(name));
    return whole ? [whole] : name.split(",").map(part => industryNames.get(normalizedName(part)));
  });
  return names.every(name => name !== undefined) ? [...new Set(names)] : undefined;
}

export function prefillRichContent(content: RichContent, source: RichPrefillSource, catalog: CatalogOptions): RichContent | undefined {
  if (content.basicPrefillReviewed) return;

  const imported = source.public_contact ?? {};
  const primaryContact = normalizedName(source.primary_contact_name);
  const sameContact = content.fields.contactName === undefined || normalizedName(content.fields.contactName) === primaryContact;

  const candidates: [RichFieldKey, ...unknown[]][] = [
    ["brandName", imported.brand, source.company_name],
    ["tagline", imported.tagline],
    ["about", source.short_description],
    ["industry", industryNames.get(normalizedName(imported.industry)), industryNames.get(normalizedName(source.primary_category))],
    ["website", safeWebUrl(imported.website)],
    ["mapUrl", safeWebUrl(imported.mapLink)],
    ["hours", imported.operatingHours],
    ["contactName", source.primary_contact_name],
    ["contactRole", sameContact && primaryContact ? source.designation : undefined],
    ["phone", phoneDial(source.alternate_phone), phoneDial(imported.phone)],
    ["whatsapp", phoneDial(source.whatsapp)],
    ["email", source.business_email],
    ["preferredIndustries", matchIndustries(source.target_industries)],
    ["preferredGeography", source.preferred_buyer_geography ? [source.preferred_buyer_geography] : undefined],
  ];

  const fields = { ...content.fields };
  let filledFields = false;
  for (const [key, ...values] of candidates) {
    if (fields[key] !== undefined) continue;
    for (const value of values) {
      if (value == null) continue;
      const parsed = richContentSchema.safeParse({ fields: { [key]: value } });
      const valid = parsed.success ? parsed.data.fields[key] : undefined;
      if (valid === undefined) continue;
      fields[key] = valid;
      filledFields = true;
      break;
    }
  }

  const suggestedCategories = content.categories.length ? [] : matchCategories(source, catalog);
  const linkedin = safeWebUrl(imported.linkedin);
  const socialLinks = linkedin && linkedin.length <= 2048 && content.socialLinks.length < 12 &&
    !content.socialLinks.some(link => link.platform === "LinkedIn" || link.url === linkedin)
    ? [...content.socialLinks, { platform: "LinkedIn" as const, url: linkedin }]
    : content.socialLinks;

  if (!filledFields && !suggestedCategories.length && socialLinks === content.socialLinks) return;

  // Saving this draft records that it was reviewed. Cleared suggestions stay cleared.
  return {
    ...content,
    fields,
    categories: suggestedCategories.length ? suggestedCategories : content.categories,
    socialLinks,
    basicPrefillReviewed: true,
  };
}
