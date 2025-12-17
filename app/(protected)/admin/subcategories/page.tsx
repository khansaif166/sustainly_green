"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminSubCategoriesPage() {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [subcats, setSubcats] = useState<any[]>([]);

  async function load() {
    const c = await getDocs(collection(db, "categories"));
    const s = await getDocs(collection(db, "subcategories"));
    setCategories(c.docs.map(d => ({ id: d.id, ...d.data() })));
    setSubcats(s.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function addSubCategory() {
    if (!name || !categoryId) return;

    await addDoc(collection(db, "subcategories"), {
      name,
      categoryId,
      active: true,
      createdAt: serverTimestamp(),
    });

    setName("");
    load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="p-6 max-w-xl">
      <h1 className="text-xl font-semibold mb-4">Subcategories</h1>

      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm w-full mb-2"
      >
        <option value="">Select category</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <div className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Subcategory name"
          className="border rounded-lg px-3 py-2 text-sm flex-1"
        />
        <button
          onClick={addSubCategory}
          className="bg-black text-white rounded-full px-4 text-sm"
        >
          Add
        </button>
      </div>

      {subcats.map(sc => (
        <div key={sc.id} className="border rounded-lg px-3 py-2 text-sm">
          {sc.name}
        </div>
      ))}
    </main>
  );
}
