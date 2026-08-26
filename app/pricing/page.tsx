import type { Metadata } from "next";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import PricingClient from "./PricingClient";

const title = "Pricing";
const description = `Explore ${SITE_NAME} plans for suppliers and buyers — from a free Community listing to Verified, Growth, and Impact Partner tiers with SEO visibility, RFQs, and ESG support.`;
const canonical = `${getSiteUrl()}/pricing`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: {
    type: "website",
    title,
    description,
    url: canonical,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function PricingPage() {
  return <PricingClient />;
}
