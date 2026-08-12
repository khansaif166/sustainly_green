import type { Metadata } from "next";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import CertificationClient from "./CertificationClient";

const title = "Certification, Testing & Verification";
const description = `Get certified and build buyer trust on ${SITE_NAME}. Find the right sustainability certification, manage renewals, and unlock enterprise deals.`;
const canonical = `${getSiteUrl()}/certification`;

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

export default function CertificationPage() {
  return <CertificationClient />;
}
