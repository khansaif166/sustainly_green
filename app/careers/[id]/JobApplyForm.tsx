"use client";

import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { uploadFileToSupabaseStorage } from "@/lib/storage";

export default function JobApplyForm({
  jobId,
  jobTitle,
}: {
  jobId: string;
  jobTitle: string;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [resume, setResume] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  /* ================= APPLY ================= */

  async function apply() {
    if (!form.name || !form.email) {
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
            folder: `applications/${jobId}`,
          })
        : null;

      const response = await fetch("/api/careers/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careerId: jobId,
          jobTitle,
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

  return (
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
  );
}
