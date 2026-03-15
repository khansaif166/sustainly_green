"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/layouts/Footer";

/* ---------- TYPES ---------- */
type Certification = {
  id: string;
  name: string;
};

export default function CertificationRequestPage() {

  const router = useRouter();

  const [vendor,setVendor] = useState<any>(null);
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

    const unsub = onAuthStateChanged(auth, async(user)=>{

      if(!user){
        router.push("/login");
        return;
      }

      const vendorSnap =
        await getDoc(doc(db,"vendors",user.uid));

      if(vendorSnap.exists()){
        setVendor(vendorSnap.data());
      }

      const certSnap =
        await getDocs(collection(db,"certifications_master"));

      setCertifications(
        certSnap.docs.map(d=>({
          id:d.id,
          ...(d.data() as any)
        }))
      );
    });

    return ()=>unsub();

  },[]);

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

    await addDoc(
      collection(db,"certification_requests"),
      {
        vendorId:auth.currentUser?.uid,

        companyName:vendor?.companyName,
        email:vendor?.businessEmail,
        phone:vendor?.phone,

        ...form,

        status:"NEW",
        createdAt:serverTimestamp()
      }
    );

    setLoading(false);

    alert("Certification request submitted ✅");

    router.push("/vendor/dashboard");
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