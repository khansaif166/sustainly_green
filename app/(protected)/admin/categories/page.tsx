"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";

type Category = {
  id: string;
  name: string;
  imageUrl?: string;
};

export default function AdminCategoriesPage() {
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  /* ---------------- FETCH ---------------- */
  async function fetchCategories() {
    const snap = await getDocs(collection(db, "categories"));
    setCategories(
      snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
    );
  }

  /* ---------------- IMAGE UPLOAD ---------------- */
  async function uploadCategoryImage(file: File) {
    const imageRef = ref(
      storage,
      `categories/${Date.now()}-${file.name}`
    );
    await uploadBytes(imageRef, file);
    return getDownloadURL(imageRef);
  }

  /* ---------------- ADD / UPDATE ---------------- */
  async function saveCategory() {
    if (!name.trim()) return;

    try {
      setLoading(true);

      let imageUrl: string | undefined;

      if (image) {
        imageUrl = await uploadCategoryImage(image);
      }

      if (editingId) {
        // 🔁 UPDATE
        await updateDoc(doc(db, "categories", editingId), {
          name,
          ...(imageUrl && { imageUrl }),
          slug: name.toLowerCase().replace(/\s+/g, "-"),
          updatedAt: serverTimestamp(),
        });
      } else {
        // ➕ ADD
        if (!imageUrl) return;

        await addDoc(collection(db, "categories"), {
          name,
          slug: name.toLowerCase().replace(/\s+/g, "-"),
          imageUrl,
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

  /* ---------------- EDIT ---------------- */
  function startEdit(category: Category) {
    setName(category.name);
    setEditingId(category.id);
    setImage(null);
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <main className="p-6 max-w-xl">
      <h1 className="text-xl font-semibold mb-4">Categories</h1>

      {/* Add / Edit Form */}
      <div className="space-y-3 mb-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          className="border rounded-lg px-3 py-2 text-sm w-full"
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
          className="text-sm"
        />

        <div className="flex gap-2">
          <button
            onClick={saveCategory}
            disabled={loading}
            className="bg-black text-white rounded-full px-4 py-2 text-sm"
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
              className="border rounded-full px-4 py-2 text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Category List */}
      <div className="space-y-3 ">
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm "
          >
            <div className="flex items-center gap-3 ">
              {c.imageUrl && (
                <img
                  src={c.imageUrl}
                  alt={c.name}
                  className="w-12 h-12 rounded-md object-cover"
                />
              )}
              <span className="font-medium">{c.name}</span>
            </div>

            <button
              onClick={() => startEdit(c)}
              className="text-xs text-blue-600 hover:underline"
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
