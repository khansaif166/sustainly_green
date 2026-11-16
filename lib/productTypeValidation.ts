import "server-only";
import { supabaseServiceFetch } from "@/lib/supabaseServer";

export class ProductTypeValidationError extends Error {}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function validateProductTypeSelection(
  body: Record<string, unknown>,
  existingTypeId?: string | null,
) {
  const id = typeof body.productTypeId === "string" ? body.productTypeId.trim() : "";
  if (body.productTypeId !== undefined && body.productTypeId !== null && typeof body.productTypeId !== "string") {
    throw new ProductTypeValidationError("Choose a valid product type.");
  }
  if (!id) return;
  if (body.listingType !== "Product") throw new ProductTypeValidationError("Product types are only available for Product listings.");
  if (!UUID.test(id)) throw new ProductTypeValidationError("Choose a valid product type.");
  const rows = await supabaseServiceFetch<Array<{
    id: string; subcategory_id: string; active: boolean;
    subcategory: { category_id: string } | null;
  }>>(`/rest/v1/product_types?${new URLSearchParams({
    select: "id,subcategory_id,active,subcategory:subcategories(category_id)",
    id: `eq.${id}`, limit: "1",
  })}`);
  const type = rows[0];
  if (!type || type.subcategory_id !== body.subCategoryId || type.subcategory?.category_id !== body.categoryId) {
    throw new ProductTypeValidationError("Product type does not belong to the selected category and subcategory.");
  }
  if (!type.active && id !== existingTypeId) throw new ProductTypeValidationError("This product type is inactive. Choose another type.");
}
