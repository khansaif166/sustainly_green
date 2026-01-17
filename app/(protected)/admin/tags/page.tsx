"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PlusCircle } from "lucide-react";

/* ================= PAGE ================= */

type Tag = {
  id: string;
  name: string;
  active: boolean;
};

export default function AdminTagsPage() {
  const [name, setName] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- LOAD ---------------- */
  async function load() {
    const snap = await getDocs(collection(db, "tags"));
    setTags(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  }

  /* ---------------- ADD ---------------- */
  async function addTag() {
    if (!name.trim()) return;

    try {
      setLoading(true);

      await addDoc(collection(db, "tags"), {
        name,
        active: true,
        createdAt: serverTimestamp(),
      });

      setName("");
      load();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="max-w-full mx-auto space-y-8">

      {/* ================= HEADER ================= */}
      <section>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          Tags
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Manage reusable tags for products and listings
        </p>
      </section>

      {/* ================= ADD TAG ================= */}
      <section
        className="
          rounded-3xl
          bg-[var(--color-bg-white)]
          border border-[var(--color-border)]
          shadow-[0_10px_30px_rgba(0,0,0,0.06)]
          p-6
        "
      >
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
          Add Tag
        </h2>

        <div className="flex flex-col sm:flex-row gap-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tag name (e.g. Eco Friendly)"
            className="
              flex-1 rounded-xl
              border border-[var(--color-border)]
              px-4 py-2.5 text-sm
              bg-[var(--color-bg-white)]
              focus:outline-none
              focus:ring-2 focus:ring-[var(--color-ocean-blue)]/30
            "
          />

          <button
            onClick={addTag}
            disabled={loading}
            className="
              inline-flex items-center justify-center gap-2
              rounded-full
              px-5 py-2.5
              text-sm font-medium text-white
              bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
              hover:opacity-90
              disabled:opacity-50
            "
          >
            <PlusCircle className="h-4 w-4" />
            {loading ? "Adding..." : "Add Tag"}
          </button>
        </div>
      </section>

      {/* ================= TAG LIST ================= */}
      <section
        className="
          rounded-3xl
          bg-[var(--color-bg-white)]
          border border-[var(--color-border)]
          shadow-[0_10px_30px_rgba(0,0,0,0.06)]
          p-6
        "
      >
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
          Existing Tags
        </h2>

        {tags.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">
            No tags created yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {tags.map((t) => (
              <span
                key={t.id}
                className="
                  px-4 py-1.5 rounded-full
                  text-xs font-medium
                  bg-[var(--color-bg-soft)]
                  border border-[var(--color-border)]
                  text-[var(--color-text-primary)]
                  hover:bg-[var(--color-bg-white)]
                  transition
                "
              >
                #{t.name}
              </span>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
