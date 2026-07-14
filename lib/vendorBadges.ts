export type VendorBadgeType = "verified_supplier" | "eco_verified";

export type VendorBadgeLike = {
  listingVerified?: boolean | null;
  listingBadgeType?: string | null;
  publicContact?: Record<string, unknown> | null;
};

export const VENDOR_BADGES: Record<VendorBadgeType, { label: string; src: string }> = {
  verified_supplier: {
    label: "Verified Supplier",
    src: "/verified-supplier-badge.png",
  },
  eco_verified: {
    label: "Eco Verified",
    src: "/eco-verified-badge.png",
  },
};

export function normalizeVendorBadgeType(value: unknown): VendorBadgeType | null {
  return value === "verified_supplier" || value === "eco_verified" ? value : null;
}

export function getVendorBadgeType(vendor: VendorBadgeLike): VendorBadgeType | null {
  if (!vendor.listingVerified) return null;

  return (
    normalizeVendorBadgeType(vendor.listingBadgeType) ||
    normalizeVendorBadgeType(vendor.publicContact?.sustainlyBadgeType) ||
    "eco_verified"
  );
}

export function getVendorBadgeMeta(vendor: VendorBadgeLike) {
  const type = getVendorBadgeType(vendor);
  return type ? { type, ...VENDOR_BADGES[type] } : null;
}
