import type { Metadata } from "next";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import TermsClient from "./TermsClient";

const title = "Terms and Conditions";
const description = `Terms and Conditions of Use for ${SITE_NAME}, operated by Sustainly Ecohub India Pvt Ltd.`;
const canonical = `${getSiteUrl()}/terms`;

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

export default function TermsPage() {
  return <TermsClient />;
}
