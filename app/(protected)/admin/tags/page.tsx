"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";

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
  const [editingId, setEditingId] = useState<string | null>(null);

  /* ---------------- LOAD ---------------- */
  async function load() {
    const snap = await getDocs(collection(db, "tags"));
    setTags(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  }

  /* ---------------- ADD / UPDATE ---------------- */
  async function saveTag() {
    if (!name.trim()) return;

    try {
      setLoading(true);

      if (editingId) {
        await updateDoc(doc(db, "tags", editingId), {
          name,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "tags"), {
          name,
          active: true,
          createdAt: serverTimestamp(),
        });
      }

      resetForm();
      load();
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- EDIT ---------------- */
  function startEdit(tag: Tag) {
    setName(tag.name);
    setEditingId(tag.id);
  }

  /* ---------------- DELETE ---------------- */
  async function deleteTag(id: string) {
    if (!confirm("Delete this tag permanently?")) return;

    await deleteDoc(doc(db, "tags", id));
    setTags((prev) => prev.filter((t) => t.id !== id));
  }

  function resetForm() {
    setName("");
    setEditingId(null);
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

      {/* ================= ADD / EDIT TAG ================= */}
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
          {editingId ? "Edit Tag" : "Add Tag"}
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
            onClick={saveTag}
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
            {loading
              ? "Saving..."
              : editingId
              ? "Update Tag"
              : "Add Tag"}
          </button>

          {editingId && (
            <button
              onClick={resetForm}
              className="
                rounded-full
                px-5 py-2.5
                text-sm border
                border-[var(--color-border)]
              "
            >
              Cancel
            </button>
          )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {tags.map((t) => (
              <div
                key={t.id}
                className="
                  flex items-center justify-between
                  rounded-xl border border-[var(--color-border)]
                  px-4 py-2
                "
              >
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  #{t.name}
                </span>

                <div className="flex gap-3 text-xs">
                  <button
                    onClick={() => startEdit(t)}
                    className="text-[var(--color-ocean-blue)] hover:underline flex items-center gap-1"
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>

                  <button
                    onClick={() => deleteTag(t.id)}
                    className="text-red-600 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
