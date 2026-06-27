"use client";

import { useEffect, useState } from "react";
import { getStoredSession } from "@/lib/supabaseAuth";

export default function ManageCertifications() {

  const [name,setName] = useState("");
  const [list,setList] = useState<any[]>([]);
  const [error,setError] = useState("");

  function getAuthHeaders() {
    const session = getStoredSession();
    if (!session) throw new Error("Please sign in again.");
    return {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  useEffect(()=>{
    load();
  },[]);

  async function load(){
    try {
      const response = await fetch("/api/admin/certifications/master/certifications", {
        headers: { Authorization: getAuthHeaders().Authorization },
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message || "Unable to load certifications.");
      }
      setList(payload.items || []);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load certifications.");
    }
  }

  async function addCertification(){

    if(!name.trim()) return;

    try {
      const response = await fetch("/api/admin/certifications/master/certifications", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, status: "Active" }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message || "Unable to add certification.");
      }

      setName("");
      load();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to add certification.");
    }
  }

  async function remove(id:string){
    try {
      const response = await fetch(`/api/admin/certifications/master/certifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: getAuthHeaders().Authorization },
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error?.message || "Unable to delete certification.");
      }
      load();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to delete certification.");
    }
  }

  return(
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-semibold">
        Manage Certifications
      </h1>

      {error && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* ADD */}
      <div className="flex gap-3">
        <input
          value={name}
          onChange={(e)=>setName(e.target.value)}
          placeholder="Certification name"
          className="border p-2 rounded w-80"
        />

        <button
          onClick={addCertification}
          className="bg-black text-white px-4 rounded"
        >
          Add
        </button>
      </div>

      {/* LIST */}
      <div className="bg-white border rounded-xl">
        {list.map(c=>(
          <div
            key={c.id}
            className="flex justify-between p-4 border-t"
          >
            <span>{c.name}</span>

            <button
              onClick={()=>remove(c.id)}
              className="text-red-600"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
