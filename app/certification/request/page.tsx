"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/layouts/Footer";
import { getStoredSession } from "@/lib/supabaseAuth";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/* ---------- TYPES ---------- */
type Certification = {
  id: string;
  name: string;
};

export default function CertificationRequestPage() {

  const router = useRouter();

  const [certifications,setCertifications] =
    useState<Certification[]>([]);

  const [form,setForm] = useState({
    certificationId:"",
    contactPerson:"",
    designation:"",
    employees:"",
    locations:"",
    timeline:"",
    businessScope:"",
    previousCertification:"",
    message:""
  });

  const [loading,setLoading] = useState(false);

  /* ================= LOAD DATA ================= */
  useEffect(()=>{

    async function load() {
      const session = getStoredSession();

      if(!session){
        router.push("/login");
        return;
      }

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return;
      }

      const params = new URLSearchParams({
        select: "id,name",
        status: "eq.Active",
        order: "name.asc",
      });
      const response = await fetch(`${SUPABASE_URL}/rest/v1/certifications?${params}`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      const rows = await response.json();

      setCertifications(Array.isArray(rows) ? rows : []);
    }

    load();

  },[router]);

  function update(
    key:string,
    value:string
  ){
    setForm(prev=>({
      ...prev,
      [key]:value
    }));
  }

  /* ================= SUBMIT ================= */
  async function submitRequest(){

    if(!form.certificationId){
      alert("Select certification");
      return;
    }

    setLoading(true);

    try {
      const session = getStoredSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/certification/requests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || "Unable to submit request.");
      }

      alert("Certification request submitted ✅");

      router.push("/vendor/dashboard");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to submit request.");
    } finally {
      setLoading(false);
    }
  }

  /* ================= UI ================= */

  return (
    <>
    <Header/>
    <main className="max-w-3xl mx-auto py-14 px-6">

      <h1 className="text-3xl font-semibold text-[var(--color-text-primary)] mb-2">
        Certification Request
      </h1>

      <p className="text-sm text-[var(--color-text-secondary)] mb-8">
        Provide details to start certification evaluation.
      </p>

      <div className="bg-white rounded-3xl p-8 space-y-6 shadow-sm">

        {/* CERTIFICATION */}
        <div>
          <label className="form-label">
            Certification Type
          </label>

          <select
            value={form.certificationId}
            onChange={(e)=>
              update("certificationId",e.target.value)
            }
            className="form-input"
          >
            <option value="">
              Select Certification
            </option>

            {certifications.map(c=>(
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* CONTACT */}
        <div className="grid md:grid-cols-2 gap-4">

          <div>
            <label className="form-label">
              Contact Person
            </label>
            <input
              className="form-input"
              onChange={(e)=>
                update("contactPerson",e.target.value)
              }
            />
          </div>

          <div>
            <label className="form-label">
              Designation
            </label>
            <input
              className="form-input"
              onChange={(e)=>
                update("designation",e.target.value)
              }
            />
          </div>

        </div>

        {/* COMPANY INFO */}
        <div className="grid md:grid-cols-2 gap-4">

          <div>
            <label className="form-label">
              Number of Employees
            </label>
            <input
              className="form-input"
              placeholder="Ex: 50"
              onChange={(e)=>
                update("employees",e.target.value)
              }
            />
          </div>

          <div>
            <label className="form-label">
              Operational Locations
            </label>
            <input
              className="form-input"
              placeholder="Cities / Countries"
              onChange={(e)=>
                update("locations",e.target.value)
              }
            />
          </div>

        </div>

        {/* TIMELINE */}
        <div>
          <label className="form-label">
            Certification Timeline
          </label>

          <select
            className="form-input"
            onChange={(e)=>
              update("timeline",e.target.value)
            }
          >
            <option value="">Select timeline</option>
            <option>Immediately</option>
            <option>1–3 Months</option>
            <option>3–6 Months</option>
            <option>Planning Stage</option>
          </select>
        </div>

        {/* SCOPE */}
        <div>
          <label className="form-label">
            Scope of Certification
          </label>

          <textarea
            className="form-input h-24"
            placeholder="Products, services, manufacturing units..."
            onChange={(e)=>
              update("businessScope",e.target.value)
            }
          />
        </div>

        {/* PREVIOUS */}
        <div>
          <label className="form-label">
            Previous Certification (if any)
          </label>

          <input
            className="form-input"
            placeholder="ISO 9001, ESG etc"
            onChange={(e)=>
              update("previousCertification",e.target.value)
            }
          />
        </div>

        {/* MESSAGE */}
        <div>
          <label className="form-label">
            Additional Notes
          </label>

          <textarea
            className="form-input h-28"
            onChange={(e)=>
              update("message",e.target.value)
            }
          />
        </div>

        {/* SUBMIT */}
        <button
          onClick={submitRequest}
          className="
          w-full rounded-full py-3
          text-white font-semibold
          bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
          hover:brightness-95 transition
          "
        >
          {loading
            ? "Submitting..."
            : "Submit Certification Request"}
        </button>

      </div>

    </main>
    <Footer/>
    </>
  );
}
