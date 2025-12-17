"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminTagsPage() {
  const [name, setName] = useState("");
  const [tags, setTags] = useState<any[]>([]);

  async function load() {
    const snap = await getDocs(collection(db, "tags"));
    setTags(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function addTag() {
    if (!name.trim()) return;

    await addDoc(collection(db, "tags"), {
      name,
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
      <h1 className="text-xl font-semibold mb-4">Tags</h1>

      <div className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tag name"
          className="border rounded-lg px-3 py-2 text-sm flex-1"
        />
        <button
          onClick={addTag}
          className="bg-black text-white rounded-full px-4 text-sm"
        >
          Add
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map(t => (
          <span
            key={t.id}
            className="px-3 py-1 rounded-full border text-xs"
          >
            {t.name}
          </span>
        ))}
      </div>
    </main>
  );
}
