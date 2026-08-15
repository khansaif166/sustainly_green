import { cache } from "react";
import type { Metadata } from "next";
import {
  fetchActiveCategories,
  fetchApprovedProducts,
  fetchApprovedVendors,
} from "@/lib/supabasePublic";
import { getSiteUrl, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import HomeClient, {
  type CategoryItem,
  type ProductCard,
  type SupplierCard,
} from "./HomeClient";

export const revalidate = 900;

const title = "India's B2B Sustainability Marketplace";
const description = SITE_DESCRIPTION;
const canonical = getSiteUrl();

export const metadata: Metadata = {
  title: { absolute: `${title} | ${SITE_NAME}` },
  description,
  alternates: { canonical },
  openGraph: {
    type: "website",
    title: `${title} | ${SITE_NAME}`,
    description,
    url: canonical,
    siteName: SITE_NAME,
    images: [{ url: "/logo.png", alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | ${SITE_NAME}`,
    description,
    images: ["/logo.png"],
  },
};

// Same static fallback data as the original client-side defaults — used
// here as the fallback when the corresponding server fetch returns empty,
// preserving the exact same "fallback when array is empty" behavior.
const sidebarCategories: CategoryItem[] = [
  { id: "renewable-energy", name: "Renewable Energy", icon: "sun" },
  { id: "energy-efficiency", name: "Energy Efficiency", icon: "zap" },
  { id: "water-wastewater", name: "Water & Wastewater", icon: "drop" },
  { id: "waste-management", name: "Waste Management", icon: "recycle" },
  { id: "green-building", name: "Green Building", icon: "building" },
  { id: "sustainable-materials", name: "Sustainable Materials", icon: "hex" },
  { id: "eco-packaging", name: "Eco Packaging", icon: "box" },
  { id: "electric-mobility", name: "Electric Mobility", icon: "truck" },
  { id: "agriculture-organic", name: "Agriculture & Organic", icon: "sprout" },
  { id: "environmental-monitoring", name: "Environmental Monitoring", icon: "chart" },
];

const staticProducts: ProductCard[] = [
  {
    id: "mono-perc-solar-module",
    title: "Mono PERC Solar Module 550W",
    price: "₹23",
    unit: "Watt",
    vendor: "SunPeak Energy",
  },
  {
    id: "solar-led-street-light",
    title: "Solar LED Street Light 100W",
    price: "₹6,800",
    unit: "Piece",
    vendor: "BrightLite Solutions",
  },
  {
    id: "on-grid-solar-inverter",
    title: "On-Grid Solar Inverter 10kW",
    price: "₹56,000",
    unit: "Unit",
    vendor: "VoltEdge Power",
  },
  {
    id: "biogas-plant-25m3",
    title: "Biogas Plant 25m3",
    price: "₹3,50,000",
    unit: "Unit",
    vendor: "GreenGas Systems",
  },
];

const staticFeaturedProducts: ProductCard[] = [
  {
    id: "evaporative-air-cooler",
    title: "Evaporative Air Cooler 15000 CMH",
    price: "₹26,500",
    unit: "Unit",
    vendor: "CoolBreeze Tech",
  },
  {
    id: "recycled-paper-board",
    title: "Recycled Paper Board 1.5mm",
    price: "₹56",
    unit: "Sq.ft.",
    vendor: "EcoPulp Industries",
  },
  {
    id: "rainwater-harvesting-tank",
    title: "Rainwater Harvesting Tank 1000 Ltr",
    price: "₹7,900",
    unit: "Unit",
    vendor: "AquaSave Solutions",
  },
  {
    id: "ac-ev-charger",
    title: "AC EV Charger 7.4kW Type 2",
    price: "₹34,000",
    unit: "Unit",
    vendor: "ChargeGreen",
  },
  {
    id: "organic-waste-composter",
    title: "Organic Waste Composter 200kg/day",
    price: "₹1,06,000",
    unit: "Unit",
    vendor: "CompoTech",
  },
  {
    id: "stainless-water-purifier",
    title: "Stainless Steel Water Purifier 25 LPH",
    price: "₹17,500",
    unit: "Unit",
    vendor: "PureFlow Systems",
  },
];

const staticSuppliers: SupplierCard[] = [
  { id: "ecovolt", name: "EcoVolt Solutions", country: "India", state: "Tamil Nadu", rating: "4.8", mark: "EV", badge: "Claimed" },
  { id: "greenbuild", name: "GreenBuild Exim", country: "Germany", state: "Bavaria", rating: "4.7", mark: "GB", badge: "Claimed" },
  { id: "purewater", name: "PureWater Tech", country: "India", state: "Karnataka", rating: "4.9", mark: "PW", badge: "Claimed" },
  { id: "sustainpack", name: "SustainPack Ltd.", country: "United Kingdom", state: "England", rating: "4.6", mark: "SP", badge: "Claimed" },
];

function categoryIcon(category: { id: string; name: string }, index: number) {
  const key = `${category.id} ${category.name}`.toLowerCase();
  if (key.includes("renewable")) return "sun";
  if (key.includes("energy efficiency")) return "zap";
  if (key.includes("water")) return "drop";
  if (key.includes("waste")) return "recycle";
  if (key.includes("building") || key.includes("infrastructure")) return "building";
  if (key.includes("material")) return "hex";
  if (key.includes("packag")) return "box";
  if (key.includes("mobility") || key.includes("vehicle")) return "truck";
  if (key.includes("agri") || key.includes("organic")) return "sprout";
  if (key.includes("monitor") || key.includes("climate")) return "chart";
  return sidebarCategories[index % sidebarCategories.length]?.icon || "sun";
}

// Same three fetch calls, same args, same error handling (empty catch) as
// the original client-side loadHomepageData effect — only relocated to
// run server-side, and using "fallback when empty" instead of
// "static-default-then-maybe-overwritten".
const getHomepageData = cache(async () => {
  let initialCategories: CategoryItem[] = sidebarCategories;
  try {
    const categories = await fetchActiveCategories(10);

    if (categories.length > 0) {
      initialCategories = categories.map((item, index) => ({
        id: item.id,
        name: item.name,
        icon: categoryIcon(item, index),
      }));
    }
  } catch {}

  let initialBestSellers: ProductCard[] = staticProducts;
  let initialFeaturedProducts: ProductCard[] = staticFeaturedProducts;
  try {
    const products = await fetchApprovedProducts({
      listingType: "Product",
      limit: 6,
    });

    if (products.length > 0) {
      const cards = products.map((product, index) => ({
        id: product.id,
        title: product.title || `Product ${index + 1}`,
        price:
          product.priceType === "Price on Request" ||
          product.price === undefined ||
          product.price <= 0
            ? "Price on request"
            : product.currency === "INR"
              ? `₹${product.price.toLocaleString("en-IN")}`
              : `${product.currency} ${product.price.toLocaleString()}`,
        unit: product.moq ? `MOQ ${product.moq}` : "Unit",
        vendor: product.vendorName,
        image: product.images[0] || undefined,
        ecoVerified: product.ecoVerified,
      }));

      initialBestSellers = cards.slice(0, 4);
      initialFeaturedProducts = cards.slice(0, 6);
    }
  } catch {}

  let initialFeaturedSuppliers: SupplierCard[] = staticSuppliers;
  try {
    const vendors = await fetchApprovedVendors(8);

    if (vendors.length > 0) {
      initialFeaturedSuppliers = vendors.map((vendor, index) => {
        const companyName = vendor.companyName || `Supplier ${index + 1}`;
        return {
          id: vendor.id,
          name: companyName,
          country: vendor.country || vendor.location || "India",
          state: vendor.state || vendor.city || undefined,
          subcategories: vendor.subCategories,
          rating: vendor.isUnclaimed ? "Listed" : "4.8",
          mark: vendor.logoText,
          badge: vendor.isUnclaimed ? "Unclaimed" : "Claimed",
          isUnclaimed: vendor.isUnclaimed,
          listingVerified: vendor.listingVerified,
          listingBadgeType: vendor.listingBadgeType,
          publicContact: vendor.publicContact,
        };
      });
    }
  } catch {}

  return {
    initialCategories,
    initialBestSellers,
    initialFeaturedProducts,
    initialFeaturedSuppliers,
  };
});

export default async function HomePage() {
  const {
    initialCategories,
    initialBestSellers,
    initialFeaturedProducts,
    initialFeaturedSuppliers,
  } = await getHomepageData();

  return (
    <HomeClient
      initialCategories={initialCategories}
      initialBestSellers={initialBestSellers}
      initialFeaturedProducts={initialFeaturedProducts}
      initialFeaturedSuppliers={initialFeaturedSuppliers}
    />
  );
}
