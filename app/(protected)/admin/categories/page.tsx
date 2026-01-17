"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

/* ================= TYPES ================= */

type Category = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  active: boolean;
};

/* ================= PAGE ================= */

export default function AdminCategoriesPage() {
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  /* ================= FETCH ================= */

  async function fetchCategories() {
    const snap = await getDocs(collection(db, "categories"));
    setCategories(
      snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }))
    );
  }

  /* ================= IMAGE UPLOAD ================= */

  async function uploadCategoryImage(file: File) {
    const imageRef = ref(storage, `categories/${Date.now()}-${file.name}`);
    await uploadBytes(imageRef, file);
    return getDownloadURL(imageRef);
  }

  /* ================= ADD / UPDATE ================= */

  async function saveCategory() {
    if (!name.trim()) return;

    try {
      setLoading(true);

      let imageUrl: string | undefined;

      if (image) {
        imageUrl = await uploadCategoryImage(image);
      }

      const payload = {
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        ...(imageUrl && { imageUrl }),
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        // ✏️ UPDATE
        await updateDoc(doc(db, "categories", editingId), payload);
      } else {
        // ➕ ADD
        if (!imageUrl) {
          alert("Category image is required");
          return;
        }

        await addDoc(collection(db, "categories"), {
          ...payload,
          active: true,
          createdAt: serverTimestamp(),
        });
      }

      resetForm();
      fetchCategories();
    } catch (err) {
      console.error("SAVE_CATEGORY_ERROR", err);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setName("");
    setImage(null);
    setEditingId(null);
  }

  /* ================= EDIT ================= */

  function startEdit(category: Category) {
    setName(category.name);
    setEditingId(category.id);
    setImage(null);
  }

  /* ================= ENABLE / DISABLE ================= */

  async function toggleCategory(id: string, active: boolean) {
    await updateDoc(doc(db, "categories", id), {
      active: !active,
      updatedAt: serverTimestamp(),
    });

    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !active } : c))
    );
  }

  /* ================= DELETE (OPTIONAL) ================= */

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category permanently?")) return;

    await deleteDoc(doc(db, "categories", id));
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
  <main className="max-w-full mx-auto space-y-8">

    {/* ================= HEADER ================= */}
    <section>
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
        Categories
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)] mt-1">
        Manage product categories displayed across the platform
      </p>
    </section>

    {/* ================= FORM CARD ================= */}
    <section
      className="
        rounded-3xl
        bg-[var(--color-bg-white)]
        border border-[var(--color-border)]
        shadow-[0_10px_30px_rgba(0,0,0,0.06)]
        p-6 space-y-4
        max-w-full
      "
    >
      <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
        {editingId ? "Edit Category" : "Add New Category"}
      </h2>

      {/* Name */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">
          Category Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Eg. Sustainable Packaging"
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

      {/* Image */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-[var(--color-text-secondary)] mr-3">
          Category Image
        </label>
       <div className="space-y-1">

  <label
    className="
      flex items-center justify-center
      gap-3
      w-full
      px-4 py-6
      rounded-xl
      border-2 border-dashed border-[var(--color-border)]
      bg-[var(--color-bg-soft)]
      cursor-pointer
      hover:bg-[var(--color-bg-white)]
      transition
    "
  >
    <span className="text-sm text-[var(--color-text-secondary)]">
      {image ? image.name : "Click to upload image"}
    </span>

    <input
      type="file"
      accept="image/*"
      onChange={(e) => setImage(e.target.files?.[0] || null)}
      className="hidden"
    />
  </label>

  <p className="text-[10px] text-[var(--color-text-muted)]">
    PNG, JPG up to 5MB
  </p>
</div>

      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={saveCategory}
          disabled={loading}
          className="
            inline-flex items-center justify-center
            px-5 py-2.5 rounded-full
            text-sm font-medium text-white
            bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
            hover:opacity-90
            disabled:opacity-50
          "
        >
          {loading
            ? "Saving..."
            : editingId
            ? "Update Category"
            : "Add Category"}
        </button>

        {editingId && (
          <button
            onClick={resetForm}
            className="
              px-5 py-2.5 rounded-full
              text-sm
              border border-[var(--color-border)]
              text-[var(--color-text-primary)]
              hover:bg-[var(--color-bg-soft)]
            "
          >
            Cancel
          </button>
        )}
      </div>
    </section>

    {/* ================= CATEGORY LIST ================= */}
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {categories.map((c) => (
        <div
          key={c.id}
          className="
            flex items-center justify-between
            rounded-2xl
            bg-[var(--color-bg-white)]
            border border-[var(--color-border)]
            p-4
            shadow-[0_6px_20px_rgba(0,0,0,0.05)]
          "
        >
          {/* LEFT */}
          <div className="flex items-center gap-4">
            {c.imageUrl && (
              <img
                src={c.imageUrl}
                alt={c.name}
                className="w-14 h-14 rounded-xl object-cover"
              />
            )}

            <div>
              <p className="font-medium text-[var(--color-text-primary)]">
                {c.name}
              </p>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full
                  ${
                    c.active
                      ? "bg-[var(--color-primary-green)]/10 text-[var(--color-primary-green)]"
                      : "bg-red-100 text-red-600"
                  }
                `}
              >
                {c.active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-3 text-xs">
            <button
              onClick={() => startEdit(c)}
              className="text-[var(--color-ocean-blue)] hover:underline"
            >
              Edit
            </button>

            <button
              onClick={() => toggleCategory(c.id, c.active)}
              className="text-[var(--color-text-primary)] hover:underline"
            >
              {c.active ? "Disable" : "Enable"}
            </button>

            <button
              onClick={() => deleteCategory(c.id)}
              className="text-red-600 hover:underline"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </section>

  </main>
);
}
