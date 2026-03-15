"use client";

import { useEffect,useState } from "react";
import { auth,db } from "@/lib/firebase";
import {
 collection,
 query,
 where,
 getDocs
} from "firebase/firestore";

export default function VendorCertifications(){

const [data,setData]=useState([]);

useEffect(()=>{

async function load(){

 const uid = auth.currentUser?.uid;

 const q=query(
  collection(db,"certificationRequests"),
  where("vendorId","==",uid)
 );

 const snap=await getDocs(q);

 setData(
  snap.docs.map(d=>({id:d.id,...d.data()}))
 );
}

load();

},[]);

return(
<main className="p-10">

<h1 className="text-2xl font-semibold mb-6">
My Certifications
</h1>

<div className="space-y-4">

{data.map((r:any)=>(
<div key={r.id}
className="bg-white p-6 rounded-2xl border">

<p>Certification: {r.certificationType}</p>
<p>Status: {r.status}</p>

</div>
))}

</div>
</main>
);
}