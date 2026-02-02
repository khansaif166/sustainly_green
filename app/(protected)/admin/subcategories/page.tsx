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
import { PlusCircle, Pencil, Trash2, X } from "lucide-react";

/* ================= TYPES ================= */

type Category = {
  id: string;
  name: string;
};

type SubCategory = {
  id: string;
  name: string;
  categoryId: string;
};

/* ================= PAGE ================= */

export default function AdminSubCategoriesPage() {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcats, setSubcats] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(false);

  // edit state
  const [editing, setEditing] = useState<SubCategory | null>(null);

  /* ---------------- LOAD DATA ---------------- */
  async function load() {
    const [cSnap, sSnap] = await Promise.all([
      getDocs(collection(db, "categories")),
      getDocs(collection(db, "subcategories")),
    ]);

    setCategories(
      cSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
    );

    setSubcats(
      sSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
    );
  }

  /* ---------------- ADD ---------------- */
  async function addSubCategory() {
    if (!name.trim() || !categoryId) return;

    try {
      setLoading(true);

      await addDoc(collection(db, "subcategories"), {
        name,
        categoryId,
        active: true,
        createdAt: serverTimestamp(),
      });

      resetForm();
      load();
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- UPDATE ---------------- */
  async function updateSubCategory() {
    if (!editing || !name.trim() || !categoryId) return;

    try {
      setLoading(true);

      await updateDoc(doc(db, "subcategories", editing.id), {
        name,
        categoryId,
        updatedAt: serverTimestamp(),
      });

      resetForm();
      load();
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- DELETE ---------------- */
  async function removeSubCategory(id: string) {
    const ok = confirm("Are you sure you want to delete this subcategory?");
    if (!ok) return;

    await deleteDoc(doc(db, "subcategories", id));
    load();
  }

  /* ---------------- HELPERS ---------------- */
  function startEdit(sc: SubCategory) {
    setEditing(sc);
    setName(sc.name);
    setCategoryId(sc.categoryId);
  }

  function resetForm() {
    setName("");
    setCategoryId("");
    setEditing(null);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="max-w-full mx-auto space-y-8">

      {/* ================= HEADER ================= */}
      <section>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          Subcategories
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Manage subcategories under each main category
        </p>
      </section>

      {/* ================= ADD / EDIT CARD ================= */}
      <section className="rounded-3xl bg-[var(--color-bg-white)] border border-[var(--color-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-6">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
          {editing ? "Edit Subcategory" : "Add Subcategory"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Subcategory name"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
          />

          <div className="flex gap-2">
            <button
              onClick={editing ? updateSubCategory : addSubCategory}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]"
            >
              <PlusCircle className="h-4 w-4" />
              {editing ? "Update" : "Add"}
            </button>

            {editing && (
              <button
                onClick={resetForm}
                className="rounded-full px-4 py-2.5 border text-sm"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ================= LIST ================= */}
      <section className="rounded-3xl bg-[var(--color-bg-white)] border border-[var(--color-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-6">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
          Existing Subcategories
        </h2>

        {subcats.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">
            No subcategories added yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subcats.map((sc) => (
              <div
                key={sc.id}
                className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{sc.name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {categories.find(c => c.id === sc.categoryId)?.name}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(sc)}
                    className="p-2 rounded-lg hover:bg-[var(--color-bg-soft)]"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => removeSubCategory(sc.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
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
