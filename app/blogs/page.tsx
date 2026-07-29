import type { Metadata } from "next";
import { fetchPublishedBlogs } from "@/lib/supabasePublic";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import BlogsClient from "./BlogsClient";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Sustainability Insights and Responsible Sourcing Blog",
  description:
    "Read practical sustainability, ESG procurement, responsible sourcing, and green marketplace insights from Sustainly Green.",
  alternates: { canonical: `${getSiteUrl()}/blogs` },
  openGraph: {
    type: "website",
    title: "Sustainability Insights and Responsible Sourcing Blog",
    description:
      "Read practical sustainability, ESG procurement, responsible sourcing, and green marketplace insights from Sustainly Green.",
    url: `${getSiteUrl()}/blogs`,
    siteName: SITE_NAME,
    images: [{ url: "/logo.png", alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sustainability Insights and Responsible Sourcing Blog",
    description:
      "Sustainability, ESG procurement, and responsible sourcing insights.",
    images: ["/logo.png"],
  },
};

export default async function BlogsPage() {
  const blogs = await fetchPublishedBlogs({ limit: 10, offset: 0 }).catch(
    () => [],
  );
  return <BlogsClient initialBlogs={blogs} />;
}
