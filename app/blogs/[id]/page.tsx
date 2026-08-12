import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/app/components/layouts/Footer";
import Header from "@/app/components/Header";
import Link from "next/link";
import { fetchPublishedBlogById } from "@/lib/supabasePublic";
import { getSiteUrl, SITE_NAME } from "@/lib/site";

export const revalidate = 3600;

type BlogPageProps = {
  params: Promise<{ id: string }>;
};

const getBlog = cache(async (id: string) => {
  try {
    return await fetchPublishedBlogById(id);
  } catch {
    return null;
  }
});

function compact(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { id } = await params;
  const blog = await getBlog(id);
  const canonical = `${getSiteUrl()}/blogs/${encodeURIComponent(id)}`;

  if (!blog) {
    return {
      title: "Blog not found",
      robots: { index: false, follow: false },
      alternates: { canonical },
    };
  }

  const title = compact(`${blog.title} | ${SITE_NAME}`, 60);
  const description = compact(
    blog.excerpt ||
      blog.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() ||
      `Read ${blog.title} on ${SITE_NAME}.`,
    155,
  );
  const image = blog.image || "/logo.png";

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      images: [{ url: image, alt: blog.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

function blogStructuredData(
  blog: NonNullable<Awaited<ReturnType<typeof getBlog>>>,
  canonical: string,
) {
  const siteUrl = getSiteUrl();
  const description =
    blog.excerpt ||
    blog.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: description || undefined,
    image: blog.image ? [blog.image] : undefined,
    datePublished: blog.createdAt || undefined,
    dateModified: blog.createdAt || undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${siteUrl}/logo.png` },
    },
  };
}

export default async function BlogDetail({ params }: BlogPageProps) {
  const { id } = await params;
  const blog = await getBlog(id);

  if (!blog) notFound();

  const canonical = `${getSiteUrl()}/blogs/${encodeURIComponent(id)}`;
  const structuredData = blogStructuredData(blog, canonical);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <Header />
      <div className="w-full mx-auto px-6 pt-10">
        <nav className="text-sm text-gray-500 flex items-center gap-2">
          <Link href="/" className="hover:text-black">
            Home
          </Link>

          <span>/</span>

          <Link href="/blogs" className="hover:text-black">
            Blogs
          </Link>

          <span>/</span>

          <span className="text-gray-800 font-medium">{blog.title}</span>
        </nav>
      </div>
      <div className="w-auto mx-auto py-16 px-6 flex flex-col md:flex-col items-start gap-10">
        {/* Blog Image */}
        <div className="w-full">
          {blog.image && (
            <img
              src={blog.image}
              alt={blog.title}
              className="w-[350px] rounded-2xl shadow-md object-cover"
            />
          )}
        </div>

        {/* Blog Content */}
        <div className=" w-full">
          <h1 className="text-4xl font-bold mb-6 leading-tight">
            {blog.title}
          </h1>

          <div
            className="prose max-w-none text-gray-700 text-lg leading-relaxed"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </div>
      </div>
      <Footer />
    </>
  );
}
