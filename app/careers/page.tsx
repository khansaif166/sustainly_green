"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Briefcase, MapPin, Clock, Mail, ArrowLeft } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/layouts/Footer";
import Link from "next/link";

/* ================= TYPES ================= */

type Job = {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
};

/* ================= PAGE ================= */

export default function CareersPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      const q = query(
        collection(db, "careers"),
        where("active", "==", true),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);
      setJobs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setLoading(false);
    }

    loadJobs();
  }, []);

  return (
    <>
      <Header />
      <main className="max-w-full mx-auto px-6 py-16 space-y-14">
        <Link
          href="/"
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
          Back to Home
        </Link>

        {/* ================= HERO ================= */}
        <section className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-text-primary)]">
            Careers at Sustainly Green
          </h1>

          <p className="text-sm md:text-base text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Join us in building a sustainable, eco-friendly marketplace. We’re
            always looking for passionate people who want to make an impact.
          </p>
        </section>

        {/* ================= JOB LIST ================= */}
        <section className="space-y-6">
          {loading && (
            <p className="text-sm text-[var(--color-text-secondary)] text-center">
              Loading job openings…
            </p>
          )}

          {!loading && jobs.length === 0 && (
            <p className="text-sm text-[var(--color-text-secondary)] text-center">
              No openings available right now. Please check back soon.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="
                rounded-3xl
                bg-[var(--color-bg-white)]
                border border-[var(--color-border)]
                shadow-[0_10px_30px_rgba(0,0,0,0.06)]
                p-6 space-y-4
              "
              >
                {/* HEADER */}
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {job.title}
                  </h2>

                  <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                    {job.department}
                  </p>
                </div>

                {/* META */}
                <div className="flex flex-wrap gap-4 text-xs text-[var(--color-text-secondary)]">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {job.location}
                  </span>

                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {job.type.replace("_", " ")}
                  </span>
                </div>

                {/* DESCRIPTION */}
                {/* <p className="text-sm text-[var(--color-text-primary)] opacity-80 line-clamp-4">
                  {job.description}
                </p> */}
                <Link
                  href={`/careers/${job.id}`}
                  className="
    inline-flex items-center justify-center
    mt-4
    px-5 py-2.5
    rounded-full
    text-sm font-medium text-white
    bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
    hover:opacity-90
    transition
  "
                >
                  View & Apply
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ================= APPLY VIA EMAIL (COMMON) ================= */}
        <section
          className="
          rounded-3xl
          bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
          text-white
          p-8 text-center space-y-3
        "
        >
          <h3 className="text-lg font-semibold">Apply via Email</h3>

          <p className="text-sm opacity-90">
            Interested in any of the roles above? Send your CV and a short
            introduction to:
          </p>

          <a
            href="mailto:support@sustainlygreen.com"
            className="
            inline-flex items-center gap-2
            mt-2
            px-6 py-3
            rounded-full
            bg-white text-[var(--color-primary-green)]
            text-sm font-medium
            hover:opacity-90
          "
          >
            <Mail className="h-4 w-4" />
            support@sustainlygreen.com
          </a>
        </section>
      </main>
      <Footer />
    </>
  );
}
