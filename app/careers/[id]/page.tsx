"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Briefcase, MapPin, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/layouts/Footer";

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

export default function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  /* ================= LOAD JOB ================= */

  useEffect(() => {
    async function loadJob() {
      const snap = await getDoc(doc(db, "careers", id as string));
      if (snap.exists()) {
        setJob(snap.data() as Job);
      }
      setLoading(false);
    }

    loadJob();
  }, [id]);

  /* ================= APPLY ================= */

  async function apply() {
    if (!job || !form.name || !form.email) return;

    try {
      setSubmitting(true);

      await addDoc(collection(db, "jobApplications"), {
        jobId: id,
        jobTitle: job.title,
        ...form,
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      setForm({ name: "", email: "", phone: "" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <p className="p-6 text-sm text-[var(--color-text-secondary)]">
        Loading job…
      </p>
    );
  }

  if (!job) {
    return (
      <p className="p-6 text-sm text-[var(--color-text-secondary)]">
        Job not found.
      </p>
    );
  }

  return (
    <>
    <Header/>
    <main className="max-w-4xl mx-auto px-6 py-14 space-y-10">
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
      <section
        className="
          rounded-3xl
          bg-[var(--color-bg-white)]
          border border-[var(--color-border)]
          p-6
          text-sm
          text-[var(--color-text-primary)]
          whitespace-pre-line
        "
      >
        {job.description}
      </section>

      {/* ================= APPLY FORM ================= */}
      <section
        className="
          rounded-3xl
          bg-[var(--color-bg-white)]
          border border-[var(--color-border)]
          shadow-[0_10px_30px_rgba(0,0,0,0.06)]
          p-6 space-y-4
        "
      >
        <h2 className="text-lg font-semibold">Apply for this position</h2>

        {success && (
          <p className="text-sm text-[var(--color-primary-green)]">
            Application submitted successfully.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Full Name */}
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-[var(--color-text-secondary)]">
      Full Name
    </label>
    <input
      type="text"
      placeholder="John Doe"
      value={form.name}
      onChange={(e) => setForm({ ...form, name: e.target.value })}
      className="
        w-full px-4 py-3 rounded-xl text-sm
        bg-[var(--color-bg-white)]
        border border-[var(--color-border)]
        text-[var(--color-text-primary)]
        placeholder:text-[var(--color-text-muted)]
        focus:outline-none
        focus:ring-2
        focus:ring-[var(--color-primary-green)]/30
      "
    />
  </div>

  {/* Email */}
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-[var(--color-text-secondary)]">
      Email Address
    </label>
    <input
      type="email"
      placeholder="you@email.com"
      value={form.email}
      onChange={(e) => setForm({ ...form, email: e.target.value })}
      className="
        w-full px-4 py-3 rounded-xl text-sm
        bg-[var(--color-bg-white)]
        border border-[var(--color-border)]
        text-[var(--color-text-primary)]
        placeholder:text-[var(--color-text-muted)]
        focus:outline-none
        focus:ring-2
        focus:ring-[var(--color-primary-green)]/30
      "
    />
  </div>

  {/* Phone */}
  <div className="flex flex-col gap-1 md:col-span-2">
    <label className="text-xs font-medium text-[var(--color-text-secondary)]">
      Phone Number <span className="text-[var(--color-text-muted)]">(optional)</span>
    </label>
    <input
      type="tel"
      placeholder="+91 98765 43210"
      value={form.phone}
      onChange={(e) => setForm({ ...form, phone: e.target.value })}
      className="
        w-full px-4 py-3 rounded-xl text-sm
        bg-[var(--color-bg-white)]
        border border-[var(--color-border)]
        text-[var(--color-text-primary)]
        placeholder:text-[var(--color-text-muted)]
        focus:outline-none
        focus:ring-2
        focus:ring-[var(--color-primary-green)]/30
      "
    />
  </div>
</div>


        <button
          onClick={apply}
          disabled={submitting}
          className="
            inline-flex items-center gap-2
            px-6 py-3 rounded-full text-sm font-medium text-white
            bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
            hover:opacity-90 disabled:opacity-50
          "
        >
          {submitting ? "Submitting…" : "Submit Application"}
        </button>
      </section>
    </main>
    <Footer/>
    </>
  );
}
