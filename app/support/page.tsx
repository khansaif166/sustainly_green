import type { Metadata } from "next";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import SupportClient from "./SupportClient";

const title = "Support";
const description = `Get buyer support, vendor support, or answers to general enquiries from the ${SITE_NAME} team.`;
const canonical = `${getSiteUrl()}/support`;

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

export default function SupportPage() {
  return <SupportClient />;
}
