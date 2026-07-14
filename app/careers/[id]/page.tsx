"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MapPin, Clock, ArrowLeft, UploadCloud } from "lucide-react";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/layouts/Footer";
import { fetchActiveCareerById } from "@/lib/supabasePublic";
import { uploadFileToSupabaseStorage } from "@/lib/storage";

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

  const [resume, setResume] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  /* ================= LOAD JOB ================= */

  useEffect(() => {
    async function loadJob() {
      const row = await fetchActiveCareerById(id as string);
      setJob(row);
      setLoading(false);
    }

    loadJob();
  }, [id]);

  /* ================= APPLY ================= */

  async function apply() {
    if (!job || !form.name || !form.email) {
      alert("Please fill all required fields.");
      return;
    }

    if (!resume) {
      alert("Please upload your resume before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      const uploadedResume = resume
        ? await uploadFileToSupabaseStorage(resume, {
            bucket: "resumes",
            folder: `applications/${id}`,
          })
        : null;

      const response = await fetch("/api/careers/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careerId: id,
          jobTitle: job.title,
          name: form.name,
          email: form.email,
          phone: form.phone,
          resumeUrl: "",
          resumeStoragePath: uploadedResume?.path || "",
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error?.message || "Unable to submit application.");
      }

      setSuccess(true);
      setForm({ name: "", email: "", phone: "" });
      setResume(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to submit application.");
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
        <section className="rounded-3xl bg-[var(--color-bg-white)] border border-[var(--color-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-6 space-y-5">
          <h2 className="text-lg font-semibold">Apply for this position</h2>

          {success && (
            <p className="text-sm text-[var(--color-primary-green)]">
              Application submitted successfully.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <input
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border text-sm"
            />

            {/* Email */}
            <input
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border text-sm"
            />

            {/* Phone */}
            <input
              placeholder="Phone (optional)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border text-sm md:col-span-2"
            />
          </div>

          {/* ================= RESUME UPLOAD ================= */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">
              Upload Resume (PDF/DOC)
            </label>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-ocean-blue)]">
                <UploadCloud className="h-4 w-4" />
                {resume ? resume.name : "Choose File"}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  hidden
                  onChange={(e) => setResume(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              PDF, DOC, and DOCX files are accepted.
            </p>
          </div>

          {/* ================= SUBMIT ================= */}
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
      <Footer />
    </>
  );
}
