"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminCategoriesPage() {
  const [name, setName] = useState("");
  const [categories, setCategories] = useState<any[]>([]);

  async function fetchCategories() {
    const snap = await getDocs(collection(db, "categories"));
    setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function addCategory() {
    if (!name.trim()) return;

    await addDoc(collection(db, "categories"), {
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      active: true,
      createdAt: serverTimestamp(),
    });

    setName("");
    fetchCategories();
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <main className="p-6 max-w-xl">
      <h1 className="text-xl font-semibold mb-4">Categories</h1>

      <div className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          className="border rounded-lg px-3 py-2 text-sm flex-1"
        />
        <button
          onClick={addCategory}
          className="bg-black text-white rounded-full px-4 text-sm"
        >
          Add
        </button>
      </div>

      <div className="space-y-2">
        {categories.map((c) => (
          <div
            key={c.id}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {c.name}
          </div>
        ))}
      </div>
    </main>
  );
}
