export type BrowseType = "Product" | "Service" | "Vendor";

export function browseType(value: string | null | undefined): BrowseType {
  return value?.toLowerCase() === "vendor" ? "Vendor" : value?.toLowerCase() === "service" ? "Service" : "Product";
}

export function browseSort(value: string | null | undefined) {
  return value === "name_az" ? "name_az" : "newest";
}

// Keep legacy badge links working while using the same value as the UI.
export function browseBadge(value: string | null | undefined) {
  return value === "listed" ? "unclaimed" : value || "";
}

export function normalizeBrowseParams(value: string | URLSearchParams) {
  const params = new URLSearchParams(value);
  const type = browseType(params.get("type"));
  if (params.has("sort") && browseSort(params.get("sort")) === "newest") params.delete("sort");
  const badge = browseBadge(params.get("badge"));
  const allowedBadges = type === "Vendor" ? ["verified", "unclaimed", "approved", "claim_requested"] : ["eco_verified"];
  if (badge && allowedBadges.includes(badge)) params.set("badge", badge);
  else params.delete("badge");
  if (params.get("claim_status") === "ALL") params.delete("claim_status");
  if (type !== "Vendor") {
    params.delete("loc");
    params.delete("claim_status");
  } else {
    // Vendor profile categories are separate from the product hierarchy.
    params.delete("category");
  }
  return params;
}

export function updateBrowseParams(value: URLSearchParams, changes: Record<string, string>, resetPage = true) {
  const params = new URLSearchParams(value);
  const patch = { ...changes };
  if ("category" in patch) {
    patch.subcategory = "";
    patch.product_type = "";
  } else if ("subcategory" in patch) patch.product_type = "";
  for (const [key, next] of Object.entries(patch)) {
    if (next) params.set(key, next);
    else params.delete(key);
  }
  if (resetPage) params.delete("page");
  return normalizeBrowseParams(params);
}

export function browseHref(params: URLSearchParams) {
  const query = params.toString();
  return `/browse${query ? `?${query}` : ""}`;
}
