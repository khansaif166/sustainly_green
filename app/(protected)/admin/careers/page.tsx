"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PlusCircle } from "lucide-react";

/* ================= TYPES ================= */

type Job = {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  active: boolean;
};

/* ================= PAGE ================= */

export default function AdminCareersPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    department: "",
    location: "",
    type: "FULL_TIME",
    description: "",
  });

  /* ================= LOAD ================= */
  async function loadJobs() {
    const snap = await getDocs(collection(db, "careers"));
    setJobs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  }

  /* ================= ADD ================= */
  async function addJob() {
    if (!form.title || !form.description) return;

    try {
      setLoading(true);

      await addDoc(collection(db, "careers"), {
        ...form,
        active: true,
        createdAt: serverTimestamp(),
      });

      setForm({
        title: "",
        department: "",
        location: "",
        type: "FULL_TIME",
        description: "",
      });

      loadJobs();
    } finally {
      setLoading(false);
    }
  }

  /* ================= TOGGLE ================= */
  async function toggleJob(id: string, active: boolean) {
    await updateDoc(doc(db, "careers", id), {
      active: !active,
    });

    setJobs((prev) =>
      prev.map((j) =>
        j.id === id ? { ...j, active: !active } : j
      )
    );
  }

  useEffect(() => {
    loadJobs();
  }, []);

  return (
    <main className="max-w-full mx-auto space-y-8">

      {/* ================= HEADER ================= */}
      <section>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          Careers
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Manage job openings displayed on the website
        </p>
      </section>

      {/* ================= ADD JOB ================= */}
      <section
  className="
    relative
    rounded-3xl
    bg-[var(--color-bg-white)]
    border border-[var(--color-border)]
    shadow-[0_12px_40px_rgba(0,0,0,0.08)]
    p-6 md:p-8
    space-y-6
  "
>
  {/* HEADER */}
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
        Add Job Opening
      </h2>
      <p className="text-sm text-[var(--color-text-secondary)] mt-1">
        Create and publish a new career opportunity
      </p>
    </div>
  </div>

  {/* FORM GRID */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
    {/* Job Title */}
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[var(--color-text-secondary)]">
        Job Title
      </label>
      <input
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Frontend Developer"
        className="
          w-full rounded-xl
          border border-[var(--color-border)]
          px-4 py-2.5 text-sm
          bg-[var(--color-bg-white)]
          focus:outline-none
          focus:ring-2 focus:ring-[var(--color-ocean-blue)]/30
        "
      />
    </div>

    {/* Department */}
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[var(--color-text-secondary)]">
        Department
      </label>
      <input
        value={form.department}
        onChange={(e) =>
          setForm({ ...form, department: e.target.value })
        }
        placeholder="Engineering, Sales, Operations"
        className="
          w-full rounded-xl
          border border-[var(--color-border)]
          px-4 py-2.5 text-sm
          bg-[var(--color-bg-white)]
          focus:outline-none
          focus:ring-2 focus:ring-[var(--color-ocean-blue)]/30
        "
      />
    </div>

    {/* Location */}
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[var(--color-text-secondary)]">
        Location
      </label>
      <input
        value={form.location}
        onChange={(e) =>
          setForm({ ...form, location: e.target.value })
        }
        placeholder="Remote / Bengaluru / Mumbai"
        className="
          w-full rounded-xl
          border border-[var(--color-border)]
          px-4 py-2.5 text-sm
          bg-[var(--color-bg-white)]
          focus:outline-none
          focus:ring-2 focus:ring-[var(--color-ocean-blue)]/30
        "
      />
    </div>

    {/* Job Type */}
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[var(--color-text-secondary)]">
        Job Type
      </label>
      <select
        value={form.type}
        onChange={(e) => setForm({ ...form, type: e.target.value })}
        className="
          w-full rounded-xl
          border border-[var(--color-border)]
          px-4 py-2.5 text-sm
          bg-[var(--color-bg-white)]
          focus:outline-none
          focus:ring-2 focus:ring-[var(--color-ocean-blue)]/30
        "
      >
        <option value="FULL_TIME">Full Time</option>
        <option value="PART_TIME">Part Time</option>
        <option value="INTERNSHIP">Internship</option>
        <option value="REMOTE">Remote</option>
      </select>
    </div>
  </div>

  {/* DESCRIPTION */}
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-[var(--color-text-secondary)]">
      Job Description
    </label>
    <textarea
      value={form.description}
      onChange={(e) =>
        setForm({ ...form, description: e.target.value })
      }
      placeholder="Describe responsibilities, requirements, and benefits…"
      rows={5}
      className="
        w-full rounded-xl
        border border-[var(--color-border)]
        px-4 py-3 text-sm
        bg-[var(--color-bg-white)]
        focus:outline-none
        focus:ring-2 focus:ring-[var(--color-ocean-blue)]/30
      "
    />
  </div>

  {/* ACTION */}
  <div className="flex justify-end pt-2">
    <button
      onClick={addJob}
      disabled={loading}
      className="
        inline-flex items-center gap-2
        px-6 py-2.5 rounded-full
        text-sm font-semibold text-white
        bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
        hover:opacity-90
        disabled:opacity-50
        transition
      "
    >
      <PlusCircle className="h-4 w-4" />
      {loading ? "Posting..." : "Post Job"}
    </button>
  </div>
</section>


      {/* ================= LIST ================= */}
      <section
        className="
          rounded-3xl bg-[var(--color-bg-white)]
          border border-[var(--color-border)]
          shadow-[0_10px_30px_rgba(0,0,0,0.06)]
          p-6
        "
      >
        <h2 className="text-sm font-semibold mb-4">Posted Jobs</h2>

        {jobs.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">
            No job postings yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((j) => (
              <div
                key={j.id}
                className="
                  rounded-2xl border border-[var(--color-border)]
                  p-4 space-y-2
                "
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{j.title}</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {j.department} • {j.location} • {j.type.replace("_", " ")}
                    </p>
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium
                      ${
                        j.active
                          ? "bg-[var(--color-primary-green)]/10 text-[var(--color-primary-green)]"
                          : "bg-gray-100 text-gray-500"
                      }
                    `}
                  >
                    {j.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
                  {j.description}
                </p>

                <button
                  onClick={() => toggleJob(j.id, j.active)}
                  className="text-xs text-[var(--color-ocean-blue)] hover:underline"
                >
                  {j.active ? "Disable" : "Enable"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
