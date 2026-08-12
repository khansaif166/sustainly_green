import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/layouts/Footer";
import { fetchActiveCareerById, type PublicCareer } from "@/lib/supabasePublic";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import JobApplyForm from "./JobApplyForm";

export const revalidate = 900;

type JobPageProps = {
  params: Promise<{ id: string }>;
};

function compact(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

const getJob = cache(async (id: string) => {
  try {
    return await fetchActiveCareerById(id);
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: JobPageProps): Promise<Metadata> {
  const { id } = await params;
  const job = await getJob(id);
  const canonical = `${getSiteUrl()}/careers/${encodeURIComponent(id)}`;

  if (!job) {
    return {
      title: "Job not found",
      robots: { index: false, follow: false },
      alternates: { canonical },
    };
  }

  const title = compact(`${job.title} - ${job.department} | ${SITE_NAME}`, 60);
  const description = compact(
    job.description ||
      `Apply for the ${job.title} role at ${SITE_NAME}, based in ${job.location}.`,
    155,
  );

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  FULLTIME: "FULL_TIME",
  FULL_TIME: "FULL_TIME",
  PARTTIME: "PART_TIME",
  PART_TIME: "PART_TIME",
  CONTRACT: "CONTRACTOR",
  CONTRACTOR: "CONTRACTOR",
  TEMPORARY: "TEMPORARY",
  TEMP: "TEMPORARY",
  INTERN: "INTERN",
  INTERNSHIP: "INTERN",
  VOLUNTEER: "VOLUNTEER",
};

function jobStructuredData(job: PublicCareer, canonical: string) {
  const siteUrl = getSiteUrl();
  const normalizedType = job.type
    ? EMPLOYMENT_TYPE_MAP[job.type.toUpperCase().replace(/[\s-]/g, "_")] ||
      EMPLOYMENT_TYPE_MAP[job.type.toUpperCase().replace(/[\s_-]/g, "")]
    : undefined;
  const isRemote = /remote/i.test(job.location || "");

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description || job.title,
    identifier: {
      "@type": "PropertyValue",
      name: SITE_NAME,
      value: job.id,
    },
    datePosted: job.createdAt || undefined,
    employmentType: normalizedType || undefined,
    hiringOrganization: {
      "@type": "Organization",
      name: SITE_NAME,
      sameAs: siteUrl,
    },
    ...(isRemote
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: {
            "@type": "Country",
            name: "IN",
          },
        }
      : {
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: job.location || undefined,
              addressCountry: "IN",
            },
          },
        }),
    url: canonical,
  };
}

export default async function JobDetailPage({ params }: JobPageProps) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) notFound();

  const canonical = `${getSiteUrl()}/careers/${encodeURIComponent(id)}`;
  const structuredData = jobStructuredData(job, canonical);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-14 space-y-10">
        <Link
          href="/careers"
          className="
            inline-flex items-center gap-2
            px-5 py-2.5
            rounded-full text-sm font-medium
            bg-[var(--color-bg-white)]
            text-[var(--color-ocean-blue)]
            border border-[var(--color-border)]
            hover:bg-[var(--color-ocean-blue)]
            hover:text-white
            transition
          "
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Career Page
        </Link>

        {/* ================= JOB HEADER ================= */}
        <section className="space-y-3">
          <h1 className="text-3xl font-semibold text-[var(--color-text-primary)]">
            {job.title}
          </h1>

          <p className="text-sm text-[var(--color-text-secondary)]">
            {job.department}
          </p>

          <div className="flex gap-4 text-xs text-[var(--color-text-secondary)]">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.location}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {job.type.replace("_", " ")}
            </span>
          </div>
        </section>

        {/* ================= DESCRIPTION ================= */}
        <section className="rounded-3xl bg-[var(--color-bg-white)] border border-[var(--color-border)] p-6 text-sm whitespace-pre-line">
          {job.description}
        </section>

        {/* ================= APPLY FORM ================= */}
        <JobApplyForm jobId={job.id} jobTitle={job.title} />
      </main>
      <Footer />
    </>
  );
}
