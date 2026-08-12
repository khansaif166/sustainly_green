import type { Metadata } from "next";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import HelpClient from "./HelpClient";

const title = "Help & Contact";
const description = `Need assistance? Get buyer support, vendor support, or general enquiries answered by the ${SITE_NAME} team.`;
const canonical = `${getSiteUrl()}/help`;

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

export default function HelpPage() {
  return <HelpClient />;
}
