import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/app/components/layouts/Footer";
import Header from "@/app/components/Header";
import Link from "next/link";
import { fetchPublishedBlogById } from "@/lib/supabasePublic";
import { blogHref } from "@/lib/slug";
import { fetchPublishedBlogs } from "@/lib/supabasePublic";
import BlogToc, { type Heading } from "./_components/BlogToc";
import ReadingProgress from "./_components/ReadingProgress";
import ShareButtons from "./_components/ShareButtons";
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

/** Section headings, for the contents rail. Ids are authored in the stored HTML. */
function extractHeadings(content: string): Heading[] {
  return [...content.matchAll(/<h2[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/gi)].map(
    (m) => ({
      id: m[1],
      text: m[2].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
    }),
  );
}

/** Rounded up, 200 wpm — the usual reading speed for prose of this kind. */
function readingMinutes(content: string) {
  const words = content.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function formatDate(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

  const headings = extractHeadings(blog.content);
  const minutes = readingMinutes(blog.content);
  const published = formatDate(blog.createdAt);

  // Newest few, minus this one. Failure here must not take the article down.
  const related = (await fetchPublishedBlogs({ limit: 4 }).catch(() => []))
    .filter((b) => b.id !== blog.id)
    .slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <ReadingProgress />
      <Header />

      <article>
        {/* Hero */}
        <header className="border-b border-gray-100 bg-gradient-to-b from-green-50/60 to-white">
          <div className="mx-auto w-full max-w-6xl px-6 pt-8 pb-12">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-sm text-gray-500"
            >
              <Link href="/" className="hover:text-gray-900">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <Link href="/blogs" className="hover:text-gray-900">
                Blogs
              </Link>
              <span aria-hidden="true">/</span>
              <span className="max-w-[46ch] truncate font-medium text-gray-800">
                {blog.title}
              </span>
            </nav>

            <h1 className="mt-6 max-w-4xl text-3xl leading-tight font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              {blog.title}
            </h1>

            {blog.excerpt && (
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-gray-600">
                {blog.excerpt}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-gray-500">
              {published && (
                <time dateTime={blog.createdAt}>{published}</time>
              )}
              {published && <span aria-hidden="true">·</span>}
              <span>{minutes} min read</span>
            </div>

            {blog.image && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={blog.image}
                alt=""
                className="mt-8 aspect-[2/1] w-full rounded-2xl object-cover shadow-sm"
              />
            )}
          </div>
        </header>

        {/* Body + contents rail */}
        <div className="mx-auto w-full max-w-6xl px-6 py-12">
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-12">
            <div className="min-w-0">
              {headings.length > 1 && (
                <details className="mb-8 rounded-xl border border-gray-200 p-4 lg:hidden">
                  <summary className="cursor-pointer text-sm font-semibold text-gray-900">
                    On this page
                  </summary>
                  <ul className="mt-3 space-y-2 text-sm">
                    {headings.map((h) => (
                      <li key={h.id}>
                        <a
                          href={`#${h.id}`}
                          className="text-gray-600 hover:text-green-700"
                        >
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              <div
                className="prose prose-lg max-w-[68ch] text-gray-700
                  prose-headings:scroll-mt-28 prose-headings:font-bold prose-headings:text-gray-900
                  prose-a:font-medium prose-a:text-green-700 prose-a:underline-offset-2
                  hover:prose-a:text-green-800
                  prose-img:rounded-xl
                  prose-table:text-base
                  prose-figcaption:text-sm prose-figcaption:text-gray-500"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />

              <div className="mt-12 border-t border-gray-100 pt-6">
                <ShareButtons url={canonical} title={blog.title} />
              </div>
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto">
                <BlogToc headings={headings} />
              </div>
            </aside>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="border-t border-gray-100 bg-gray-50/60">
            <div className="mx-auto w-full max-w-6xl px-6 py-14">
              <h2 className="text-xl font-bold text-gray-900">Keep reading</h2>
              <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={blogHref(r.id, r.slug)}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
                    >
                      {r.image && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={r.image}
                          alt=""
                          className="aspect-[16/9] w-full object-cover"
                        />
                      )}
                      <span className="flex flex-1 flex-col p-4">
                        <span className="font-semibold text-gray-900 group-hover:text-green-700">
                          {r.title}
                        </span>
                        {r.excerpt && (
                          <span className="mt-2 line-clamp-3 text-sm text-gray-600">
                            {r.excerpt}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </article>

      <Footer />
    </>
  );
}
