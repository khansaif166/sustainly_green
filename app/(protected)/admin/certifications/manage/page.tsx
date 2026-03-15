"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
  deleteDoc,
  doc
} from "firebase/firestore";

export default function ManageCertifications() {

  const [name,setName] = useState("");
  const [list,setList] = useState<any[]>([]);

  useEffect(()=>{
    load();
  },[]);

  async function load(){
    const snap = await getDocs(
      collection(db,"certifications_master")
    );

    setList(
      snap.docs.map(d=>({
        id:d.id,
        ...d.data()
      }))
    );
  }

  async function addCertification(){

    if(!name.trim()) return;

    await addDoc(
      collection(db,"certifications_master"),
      {
        name,
        active:true,
        createdAt:serverTimestamp()
      }
    );

    setName("");
    load();
  }

  async function remove(id:string){
    await deleteDoc(
      doc(db,"certifications_master",id)
    );
    load();
  }

  return(
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-semibold">
        Manage Certifications
      </h1>

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