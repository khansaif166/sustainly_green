import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/app/components/layouts/Footer";
import Header from "@/app/components/Header";
import Link from "next/link";
import { fetchPublishedBlogById } from "@/lib/supabasePublic";
import { blogHref } from "@/lib/slug";
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
  // Canonical always points at the slug form when the post has one, so the
  // UUID and slug URLs never compete with each other in search.
  const canonical = `${getSiteUrl()}${
    blog ? blogHref(blog.id, blog.slug) : `/blogs/${encodeURIComponent(id)}`
  }`;

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

/**
 * Pulls Q&A pairs out of the rendered post body so a FAQPage can be emitted
 * without duplicating the copy in code. Expects the shape the editor produces
 * for an FAQ section: an <h2 id="faq"> followed by alternating paragraphs,
 * the question bolded and the answer plain, ending at the next <h2>.
 *
 * Returns null when fewer than two pairs are found — a FAQPage with one entry
 * (or with headings mistaken for questions) is worse than none, since invalid
 * structured data can suppress the whole result.
 */
function extractFaq(content: string) {
  const section = content.split(/<h2[^>]*id="faq"[^>]*>/i)[1];
  if (!section) return null;

  const body = section.split(/<h2[\s>]/i)[0];
  const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map((m) => m[1]);
  const strip = (v: string) =>
    v.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  const faqs: Array<{ q: string; a: string }> = [];
  for (let i = 0; i < paragraphs.length - 1; i += 1) {
    const isQuestion = /^\s*<strong>[\s\S]*<\/strong>\s*$/i.test(paragraphs[i]);
    if (!isQuestion) continue;
    const answer = strip(paragraphs[i + 1]);
    if (!answer) continue;
    faqs.push({ q: strip(paragraphs[i]), a: answer });
    i += 1;
  }

  return faqs.length >= 2 ? faqs : null;
}

function breadcrumbStructuredData(blog: { title: string }, canonical: string) {
  const siteUrl = getSiteUrl();
  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Blogs", item: `${siteUrl}/blogs` },
      { "@type": "ListItem", position: 3, name: blog.title, item: canonical },
    ],
  };
}

function faqStructuredData(content: string) {
  const faqs = extractFaq(content);
  if (!faqs) return null;
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
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

  // Must match the canonical generateMetadata emits, or the JSON-LD would
  // claim a different URL than the <link rel="canonical"> on the same page.
  const canonical = `${getSiteUrl()}${blogHref(blog.id, blog.slug)}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      blogStructuredData(blog, canonical),
      breadcrumbStructuredData(blog, canonical),
      faqStructuredData(blog.content),
    ].filter(Boolean),
  };

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
