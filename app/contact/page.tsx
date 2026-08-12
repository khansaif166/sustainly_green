import type { Metadata } from "next";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import ContactClient from "./ContactClient";

const title = "Contact Us";
const description = `Get in touch with ${SITE_NAME}. Reach out with questions, feedback, or partnership inquiries and our team will get back to you.`;
const canonical = `${getSiteUrl()}/contact`;

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

export default function ContactPage() {
  return <ContactClient />;
}
