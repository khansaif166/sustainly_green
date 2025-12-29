"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Category = {
  id: string;
  name: string;
};

type SubCategory = {
  id: string;
  name: string;
  categoryId: string;
};

export default function AdminSubCategoriesPage() {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcats, setSubcats] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    const c = await getDocs(collection(db, "categories"));
    const s = await getDocs(collection(db, "subcategories"));

    setCategories(c.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    setSubcats(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
  }

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
    <main className="p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Subcategories
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage subcategories under each main category
        </p>
      </div>

      {/* Add Subcategory Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Add Subcategory
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          >
            <option value="">Select category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Subcategory name"
            className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          />

          <button
            onClick={addSubCategory}
            disabled={loading}
            className="rounded-xl bg-black text-white text-sm font-medium px-4 py-2 hover:bg-black/90 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
      </div>

      {/* Subcategory List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Existing Subcategories
        </h2>

        {subcats.length === 0 ? (
          <p className="text-sm text-gray-500">
            No subcategories added yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subcats.map(sc => (
              <div
                key={sc.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 text-sm hover:shadow-sm transition"
              >
                <span className="font-medium text-gray-900">
                  {sc.name}
                </span>

                <span className="text-xs text-gray-400">
                  {categories.find(c => c.id === sc.categoryId)?.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
