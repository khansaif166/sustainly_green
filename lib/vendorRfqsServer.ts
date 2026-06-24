import { supabaseServiceFetch } from "@/lib/supabaseServer";

export type VendorRfqRow = {
  id: string;
  buyer_id: string | null;
  vendor_id: string | null;
  product_id: string | null;
  requirement_title: string;
  requirement_type: string | null;
  category: string | null;
  estimated_quantity: string | null;
  delivery_country: string | null;
  required_timeline: string | null;
  additional_details: string | null;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  status: string;
  vendor_response: {
    price?: number;
    currency?: string;
    deliveryTimeline?: string;
    message?: string;
  } | null;
  vendor_contact: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type VendorContactRow = {
  business_email: string | null;
  whatsapp: string | null;
  alternate_phone: string | null;
};

export const VENDOR_RFQ_SELECT = [
  "id",
  "buyer_id",
  "vendor_id",
  "product_id",
  "requirement_title",
  "requirement_type",
  "category",
  "estimated_quantity",
  "delivery_country",
  "required_timeline",
  "additional_details",
  "buyer_name",
  "buyer_email",
  "buyer_phone",
  "status",
  "vendor_response",
  "vendor_contact",
  "created_at",
  "updated_at",
].join(",");

function mapStatus(status: string) {
  return status === "CANCELLED" ? "REJECTED" : status;
}

export function mapVendorRfq(row: VendorRfqRow) {
  return {
    id: row.id,
    buyerId: row.buyer_id,
    vendorId: row.vendor_id,
    productId: row.product_id,
    requirementTitle: row.requirement_title,
    requirementType: row.requirement_type || "",
    category: row.category || "",
    estimatedQuantity: row.estimated_quantity || "",
    deliveryCountry: row.delivery_country || "",
    requiredTimeline: row.required_timeline || "",
    additionalDetails: row.additional_details || "",
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    buyerPhone: row.buyer_phone || "",
    status: mapStatus(row.status),
    vendorResponse: row.vendor_response || undefined,
    vendorContact: row.vendor_contact || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadVendorRfq(id: string, vendorId: string) {
  const params = new URLSearchParams({
    select: VENDOR_RFQ_SELECT,
    id: `eq.${id}`,
    vendor_id: `eq.${vendorId}`,
    limit: "1",
  });

  const rows = await supabaseServiceFetch<VendorRfqRow[]>(
    `/rest/v1/rfqs?${params.toString()}`,
  );

  return rows[0] || null;
}

export async function loadVendorContact(vendorId: string) {
  const params = new URLSearchParams({
    select: "business_email,whatsapp,alternate_phone",
    id: `eq.${vendorId}`,
    limit: "1",
  });

  const rows = await supabaseServiceFetch<VendorContactRow[]>(
    `/rest/v1/vendors?${params.toString()}`,
  );

  return rows[0] || null;
}
