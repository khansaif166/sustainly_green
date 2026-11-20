export type CatalogCategory = { id: string; name: string; slug?: string };
export type CatalogSubcategory = { id: string; categoryId: string };
export type CatalogProductType = { id: string; subcategoryId: string };

export function resolveBrowseTaxonomy(
  listingType: "Product" | "Service" | "Vendor",
  values: { category: string; subcategory: string; productType: string },
  categories: CatalogCategory[],
  subcategories: CatalogSubcategory[],
  productTypes: CatalogProductType[],
) {
  const category = values.category ? categories.find(item => item.id === values.category || item.slug?.toLowerCase() === values.category.toLowerCase()) : undefined;
  const subcategory = values.subcategory ? subcategories.find(item => item.id === values.subcategory && item.categoryId === category?.id) : undefined;
  const productType = values.productType ? productTypes.find(item => item.id === values.productType && item.subcategoryId === subcategory?.id) : undefined;
  const valid = (!values.category || !!category) && (!values.subcategory || !!subcategory) &&
    (!values.productType || (listingType === "Product" && !!productType)) &&
    (listingType !== "Vendor" || (!values.subcategory && !values.productType));
  return { valid, category, subcategory, productType };
}
