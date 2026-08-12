import type { Metadata } from "next";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import DealsClient from "./DealsClient";

const title = "Daily Deals";
const description = `Exclusive limited-time offers on verified sustainable products and services from ${SITE_NAME}'s vendor network.`;
const canonical = `${getSiteUrl()}/deals`;

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

export default function DealsPage() {
  return <DealsClient />;
}
