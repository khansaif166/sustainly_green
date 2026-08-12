import type { Metadata } from "next";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import AboutClient from "./AboutClient";

const title = "About Us";
const description = `Learn about ${SITE_NAME}, India's B2B sustainability marketplace connecting verified eco-friendly vendors with conscious buyers.`;
const canonical = `${getSiteUrl()}/about`;

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

export default function AboutPage() {
  return <AboutClient />;
}
