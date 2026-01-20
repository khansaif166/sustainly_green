"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Download,
  Trash2,
  Search,
  Briefcase,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";

/* ================= TYPES ================= */

type JobApplication = {
  id: string;
  jobId: string;
  jobTitle: string;
  name: string;
  email: string;
  phone?: string;
  resumeURL: string;
  createdAt?: any;
};

/* ================= PAGE ================= */

export default function AdminJobApplicationsPage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 10;

  /* ================= LOAD ================= */

  useEffect(() => {
    async function load() {
      const q = query(
        collection(db, "jobApplications"),
        orderBy("createdAt", "desc"),
      );

      const snap = await getDocs(q);

      setApplications(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })),
      );

      setLoading(false);
    }

    load();
  }, []);

  const filteredApplications = applications.filter((a) => {
  const matchSearch =
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase());

  const matchJob =
    jobFilter === "ALL" || a.jobTitle === jobFilter;

  return matchSearch && matchJob;
});

const totalPages = Math.ceil(filteredApplications.length / PAGE_SIZE);

const paginatedApplications = filteredApplications.slice(
  (page - 1) * PAGE_SIZE,
  page * PAGE_SIZE
);


  /* ================= DELETE ================= */

  async function deleteApplication(id: string) {
    if (!confirm("Delete this application permanently?")) return;

    await deleteDoc(doc(db, "jobApplications", id));

    setApplications((prev) => prev.filter((a) => a.id !== id));
  }

  /* ================= FILTER ================= */

  const filtered = useMemo(() => {
    return applications.filter((a) => {
      const q = search.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.jobTitle.toLowerCase().includes(q)
      );
    });
  }, [applications, search]);

  if (loading) {
    return (
      <p className="p-6 text-sm text-[var(--color-text-secondary)]">
        Loading applications…
      </p>
    );
  }

  return (
    <main className="max-w-full mx-auto space-y-8">
      {/* ================= HEADER ================= */}
      <section>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          Job Applications
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Review resumes submitted for careers
        </p>
      </section>

      {/* ================= SEARCH ================= */}
      <section className="rounded-2xl bg-[var(--color-bg-white)] flex justify-between border border-[var(--color-border)] p-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-secondary)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or job title"
            className="w-full rounded-xl border border-[var(--color-border)] pl-9 pr-3 py-2.5 text-sm"
          />
        </div>
        <select
    value={jobFilter}
    onChange={(e) => {
      setJobFilter(e.target.value);
      setPage(1);
    }}
    className="border border-[var(--color-border)] rounded-xl px-4 py-2 text-sm w-full md:w-1/3"
  >
    <option value="ALL">All Jobs</option>
    {[...new Set(applications.map(a => a.jobTitle))].map((job) => (
      <option key={job} value={job}>{job}</option>
    ))}
  </select>
      </section>

      {/* ================= TABLE ================= */}
      <section className="rounded-3xl bg-[var(--color-bg-white)] border border-[var(--color-border)] overflow-hidden">
        <div className="grid grid-cols-6 gap-4 px-5 py-3 border-b text-xs font-semibold text-[var(--color-text-secondary)]">
          <span>Candidate</span>
          <span>Job</span>
          <span>Email</span>
          <span>Phone</span>
          <span>Date</span>
          <span>Actions</span>
        </div>

        {filtered.length === 0 && (
          <p className="p-6 text-sm text-[var(--color-text-secondary)]">
            No applications found.
          </p>
        )}

        {filtered.map((a) => (
          <div
            key={a.id}
            className="grid grid-cols-6 gap-4 px-5 py-4 border-b  border-[var(--color-border)] last:border-b-0 text-sm items-center"
          >
            {/* Candidate */}
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-[var(--color-bg-soft)] flex items-center justify-center text-xs font-semibold">
                {a.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{a.name}</p>
              </div>
            </div>

            {/* Job */}
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 opacity-60" />
              <span className="truncate">{a.jobTitle}</span>
            </div>

            {/* Email */}
            <div className="flex items-center gap-2 truncate">
              <Mail className="h-4 w-4 opacity-60" />
              <span className="truncate">{a.email}</span>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 opacity-60" />
              <span>{a.phone || "—"}</span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 text-xs opacity-80">
              <Calendar className="h-4 w-4" />
              {a.createdAt?.toDate
                ? a.createdAt.toDate().toLocaleString()
                : "—"}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <a
                href={a.resumeURL}
                target="_blank"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border border-[var(--color-border)] hover:bg-[var(--color-bg-soft)]"
              >
                <Download className="h-4 w-4" /> Resume
              </a>

              <button
                onClick={() => deleteApplication(a.id)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
