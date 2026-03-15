"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

/* ================= TYPES ================= */

type CertificationLead = {
  id: string;
  companyName?: string;
  email?: string;
  phone?: string;
  certificationName?: string;
  contactPerson?: string;
  designation?: string;
  employees?: string;
  locations?: string;
  timeline?: string;
  businessScope?: string;
  previousCertification?: string;
  message?: string;
  status?: string;
};

/* ================= PAGE ================= */

export default function AdminCertifications() {

  const [data,setData] =
    useState<CertificationLead[]>([]);

  const [loading,setLoading] =
    useState(true);

  useEffect(()=>{
    load();
  },[]);

  /* ================= LOAD ================= */

  async function load(){

    /* certification master */
    const certSnap =
      await getDocs(
        collection(db,"certifications_master")
      );

    const certMap:any = {};

    certSnap.docs.forEach(d=>{
      certMap[d.id] = d.data().name;
    });

    /* requests */
    const snap = await getDocs(
      query(
        collection(db,"certification_requests"),
        orderBy("createdAt","desc")
      )
    );

    setData(
      snap.docs.map(d=>{
        const r:any = d.data();

        return{
          id:d.id,
          ...r,
          certificationName:
            certMap[r.certificationId] || "—",
          status:r.status || "NEW"
        };
      })
    );

    setLoading(false);
  }

  /* ================= STATUS STYLE ================= */

  function statusStyle(status:string){

    if(status==="APPROVED")
      return "bg-emerald-100 text-emerald-700";

    if(status==="REJECTED")
      return "bg-red-100 text-red-700";

    return "bg-yellow-100 text-yellow-700";
  }

  /* ================= UI ================= */

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-semibold">
        Certification Requests
      </h1>

      {/* GRID */}
      <div className="
        grid
        gap-6
        md:grid-cols-2
        xl:grid-cols-3
      ">

        {loading && (
          <div className="col-span-full text-center py-20 text-gray-500">
            Loading certification requests...
          </div>
        )}

        {!loading && data.map(r=>(
          
          <div
            key={r.id}
            className="
              bg-white
              border border-[var(--color-border)]
              rounded-3xl
              shadow-sm
              hover:shadow-md
              transition
              flex flex-col
              justify-between
            "
          >

            {/* ================= HEADER ================= */}
            <div className="p-6 space-y-5">

              <div className="flex justify-between items-start">

                <div>
                  <p className="text-lg font-semibold">
                    {r.companyName}
                  </p>

                  <p className="text-sm text-gray-500">
                    {r.email}
                  </p>

                  <p className="text-xs text-gray-400">
                    {r.phone || "—"}
                  </p>
                </div>

                <span
                  className={`
                    px-3 py-1
                    rounded-full
                    text-xs
                    font-semibold
                    ${statusStyle(r.status!)}
                  `}
                >
                  {r.status}
                </span>

              </div>

              {/* CERTIFICATION */}
              <span className="
                inline-block
                px-3 py-1
                rounded-full
                text-xs
                font-medium
                bg-blue-100
                text-blue-700
              ">
                {r.certificationName}
              </span>


              {/* ================= INFO GRID ================= */}
              <div className="
                grid
                grid-cols-2
                gap-4
                text-sm
              ">
                <Info label="Contact" value={r.contactPerson}/>
                <Info label="Designation" value={r.designation}/>
                <Info label="Employees" value={r.employees}/>
                <Info label="Locations" value={r.locations}/>
                <Info label="Timeline" value={r.timeline}/>
                <Info label="Previous Cert." value={r.previousCertification}/>
              </div>

              {/* BUSINESS */}
              <Block
                title="Business Scope"
                value={r.businessScope}
              />

              {/* NOTES */}
              <Block
                title="Additional Notes"
                value={r.message}
              />

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}

/* ================= COMPONENTS ================= */

function Info({
  label,
  value
}:{
  label:string;
  value?:string;
}){

  return(
    <div className="
      bg-gray-50
      rounded-xl
      p-3
    ">
      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p className="font-medium">
        {value || "—"}
      </p>
    </div>
  );
}

function Block({
  title,
  value
}:{
  title:string;
  value?:string;
}){

  if(!value) return null;

  return(
    <div>
      <p className="text-xs text-gray-500 mb-1">
        {title}
      </p>

      <div className="
        bg-gray-50
        rounded-xl
        p-3
        text-sm
        text-gray-700
      ">
        {value}
      </div>
    </div>
  );
}