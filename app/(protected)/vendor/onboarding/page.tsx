"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { uploadFileWithProgress } from "@/lib/storage";
import { onAuthStateChanged, User } from "firebase/auth";

export default function VendorOnboardingPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  /* ------------------ FORM STATE ------------------ */
  const [formData, setFormData] = useState({
    // A
    companyName: "",
    registrationType: "",
    cinRegistration: "",
    gstNumber: "",
    yearOfIncorporation: "",
    registeredAddress: "",
    city: "",
    state: "",
    pinCode: "",
    country: "",
    primaryContactName: "",
    designation: "",
    businessEmail: "",
    whatsapp: "",
    alternatePhone: "",
    
    // B
    businessType: "",
    primaryCategory: "",
    subCategories: "",
    shortDescription: "",
    keyProducts: "",
    targetIndustries: "",
    preferredBuyerGeography: "",
    noOfEmployees: "",
    annualTurnover: "",
    supplyCapacity: "",
    moq: "",
    exportCapability: "",
    exportMarkets: "",

    // C
    primarySustainabilityCert: "",
    issuingBody: "",
    additionalCert1: "",
    additionalCert2: "",
    sustainabilityPractice: "",
    recycledContent: "",
    carbonFootprint: "",
    eprRegistration: "",
    socialCompliance: "",
    netZeroCommitment: "",

    // D
    listingTier: "",
    caseStudies: "",
    awards: "",
    lookingForBuyersIn: "",
    willingnessToOfferSamples: "",
    paymentTerms: "",
    language: "",

    // E
    lifecycleStage: "",
    packaging: "",
    energySource: "",
    waterRecycling: "",
    wasteReduction: "",
    sdgAlignment: "",
    auditFrequency: "",
    certifyingBody: "",
    ghgScope1: "",
    ghgScope2: "",
    ghgScope3: "",

    // F
    declarationName: "",
    declarationSignature: "",
    declarationDate: "",
  });

  const [certFile, setCertFile] = useState<File | null>(null);
  const [awardsFile, setAwardsFile] = useState<File | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ------------------ AUTH ------------------ */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoadingAuth(false);
      
      if (u) {
        // PREFILL IF EXISTS
        const snap = await getDoc(doc(db, "vendors", u.uid));
        if (snap.exists()) {
          setFormData((prev) => ({ ...prev, ...snap.data() }));
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!loadingAuth && !user) router.push("/login");
  }, [loadingAuth, user, router]);

  /* ------------------ HELPERS ------------------ */
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  /* ------------------ SUBMIT ------------------ */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!formData.companyName || !formData.businessEmail || !formData.whatsapp) {
      setError("Please fill all mandatory fields marked with *");
      return;
    }

    setSubmitting(true);

    try {
      let certUrl = "";
      let awardsUrl = "";

      if (certFile) {
        const path = `vendors/${user?.uid}/certs/${Date.now()}_${certFile.name}`;
        certUrl = await uploadFileWithProgress(certFile, path);
      }
      
      if (awardsFile) {
        const path = `vendors/${user?.uid}/awards/${Date.now()}_${awardsFile.name}`;
        awardsUrl = await uploadFileWithProgress(awardsFile, path);
      }

      const payload = {
        uid: user!.uid,
        ...formData,
        ...(certUrl && { certificateFileUrl: certUrl }),
        ...(awardsUrl && { awardsImageUrl: awardsUrl }),
        approved: false,
        updatedAt: serverTimestamp(),
      };
      
      // If it's a new vendor profile, set createdAt
      const existing = await getDoc(doc(db, "vendors", user!.uid));
      if (!existing.exists()) {
        (payload as any).createdAt = serverTimestamp();
      }

      await setDoc(doc(db, "vendors", user!.uid), payload, { merge: true });

      await setDoc(
        doc(db, "users", user!.uid),
        {
          role: "VENDOR",
          vendorProfileComplete: true,
          companyName: formData.companyName,
        },
        { merge: true }
      );

      router.push("/vendor/dashboard");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ------------------ UI ------------------ */
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl bg-white shadow-xl">
        
        {/* TOP HEADER */}
        <div className="bg-[#1e7845] text-white p-6 text-center">
          <h1 className="text-3xl font-bold tracking-wide">SUSTAINLY ECOHUB | Vendor Business Profile</h1>
          <p className="text-sm italic mt-2 text-green-100">
            Complete all mandatory fields (*) — Your profile powers the Brown Lens Verification & Eco Score
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-8">
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-300">
              <tbody>
                {/* SECTION A */}
                <tr>
                  <td colSpan={2} className="bg-[#1e7845] text-white font-bold px-4 py-2 uppercase">A. IDENTITY & LEGAL INFORMATION</td>
                </tr>
                <tr className="bg-[#666] text-white">
                  <td className="w-[40%] px-4 py-2 font-medium border border-gray-300">Company / Brand Name *</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="companyName" value={formData.companyName} onChange={handleChange} required className="w-full p-2 outline-none text-black" placeholder="e.g. Ecobuild Solutions Pvt Ltd" /></td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Company Registration Type *</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="registrationType" value={formData.registrationType} onChange={handleChange} required className="w-full p-2 outline-none text-black" placeholder="Pvt Ltd / LLP / Proprietorship / Partnership" /></td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">CIN / Registration Number *</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="cinRegistration" value={formData.cinRegistration} onChange={handleChange} required className="w-full p-2 outline-none text-black" placeholder="e.g. U74999MH2020PTC123456" /></td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">GST Number *</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="gstNumber" value={formData.gstNumber} onChange={handleChange} required className="w-full p-2 outline-none text-black" placeholder="e.g. 27AABCU9603R1ZX" /></td>
                </tr>
                <tr className="bg-[#666] text-white">
                  <td className="px-4 py-2 font-medium border border-gray-300">Year of Incorporation *</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="yearOfIncorporation" value={formData.yearOfIncorporation} onChange={handleChange} required className="w-full p-2 outline-none text-black" placeholder="e.g. 2018" /></td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Registered Address *</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="registeredAddress" value={formData.registeredAddress} onChange={handleChange} required className="w-full p-2 outline-none text-black" placeholder="Street / Building Name" /></td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">City *</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="city" value={formData.city} onChange={handleChange} required className="w-full p-2 outline-none text-black" placeholder="e.g. Mumbai" /></td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">State / Province *</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="state" value={formData.state} onChange={handleChange} required className="w-full p-2 outline-none text-black" placeholder="e.g. Maharashtra" /></td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">PIN / Postal Code *</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="pinCode" value={formData.pinCode} onChange={handleChange} required className="w-full p-2 outline-none text-black" placeholder="e.g. 400001" /></td>
                </tr>
                <tr className="bg-[#666] text-white">
                  <td className="px-4 py-2 font-medium border border-gray-300">Country *</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="country" value={formData.country} onChange={handleChange} required className="w-full p-2 outline-none text-black" placeholder="India / UAE / UK etc." /></td>
                </tr>
                
                <tr>
                  <td colSpan={2} className="bg-[#1e7845] text-white font-bold px-4 py-2 uppercase">A1. CONTACT INFORMATION</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Primary Contact Person Name *</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="primaryContactName" value={formData.primaryContactName} onChange={handleChange} required className="w-full p-2 outline-none text-black" placeholder="Full name of authorized representative" /></td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Designation / Role *</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="designation" value={formData.designation} onChange={handleChange} required className="w-full p-2 outline-none text-black" placeholder="e.g. Managing Director / Head of Sales" /></td>
                </tr>
                <tr className="bg-[#666] text-white">
                  <td className="px-4 py-2 font-medium border border-gray-300">Business Email *</td>
                  <td className="p-0 border border-gray-300 bg-white"><input type="email" name="businessEmail" value={formData.businessEmail} onChange={handleChange} required className="w-full p-2 outline-none text-black" placeholder="Official company email" /></td>
                </tr>
                <tr className="bg-[#666] text-white">
                  <td className="px-4 py-2 font-medium border border-gray-300">WhatsApp / Mobile *</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="whatsapp" value={formData.whatsapp} onChange={handleChange} required className="w-full p-2 outline-none text-black" placeholder="With country code e.g. +91 98765 43210" /></td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Alternate Phone</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="alternatePhone" value={formData.alternatePhone} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="Landline or secondary number" /></td>
                </tr>

                {/* SECTION B */}
                <tr>
                  <td colSpan={2} className="bg-[#1e7845] text-white font-bold px-4 py-2 mt-4 uppercase border-t-[16px] border-white">B. BUSINESS OVERVIEW</td>
                </tr>
                <tr className="bg-[#666] text-white">
                  <td className="px-4 py-2 font-medium border border-gray-300">Business Type *</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="businessType" value={formData.businessType} onChange={handleChange} required className="w-full p-2 outline-none text-black" placeholder="Manufacturer / Trader / Exporter / Service Provider / Distributor" /></td>
                </tr>
                <tr className="bg-[#666] text-white">
                  <td className="px-4 py-2 font-medium border border-gray-300">Primary Business Category *</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="primaryCategory" value={formData.primaryCategory} onChange={handleChange} required className="w-full p-2 outline-none text-black" placeholder="e.g. Renewable Energy / Sustainable Packaging / Green Textiles" /></td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Sub Categories (up to 3)</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="subCategories" value={formData.subCategories} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="Separate by comma" /></td>
                </tr>
                <tr className="bg-[#666] text-white">
                  <td className="px-4 py-2 font-medium border border-gray-300">Company Short Description *</td>
                  <td className="p-0 border border-gray-300 bg-white"><textarea name="shortDescription" value={formData.shortDescription} onChange={handleChange} required rows={2} className="w-full p-2 outline-none text-black resize-none" placeholder="2-3 lines about what you do (shown on marketplace profile)" /></td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Key Products / Services (Top 5) *</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="keyProducts" value={formData.keyProducts} onChange={handleChange} required className="w-full p-2 outline-none text-black" placeholder="List your top 5 products or service offerings" /></td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Target Industries / Buyers</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="targetIndustries" value={formData.targetIndustries} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="e.g. FMCG, IT, Manufacturing, Hospitality" /></td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Preferred Buyer Geography</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="preferredBuyerGeography" value={formData.preferredBuyerGeography} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="Pan-India / Tamil Nadu / Export / All India" /></td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">No. of Employees *</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="noOfEmployees" value={formData.noOfEmployees} onChange={handleChange} required className="w-full p-2 outline-none text-black" placeholder="1-10 / 11-50 / 51-200 / 201-500 / 500+" /></td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Annual Turnover Range (INR) *</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="annualTurnover" value={formData.annualTurnover} onChange={handleChange} required className="w-full p-2 outline-none text-black" placeholder="<1 Cr / 1-5 Cr / 5-25 Cr / 25-100 Cr / 100 Cr+" /></td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Supply / Production Capacity</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="supplyCapacity" value={formData.supplyCapacity} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="e.g. 5,000 units/month or 50 MT/month" /></td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Minimum Order Quantity (MOQ)</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="moq" value={formData.moq} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="e.g. 100 units / 500 kg" /></td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Export Capability</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="exportCapability" value={formData.exportCapability} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="Yes / No — If Yes, list target markets" /></td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Export Markets</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="exportMarkets" value={formData.exportMarkets} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="e.g. UAE, UK, USA, Singapore" /></td>
                </tr>

                {/* SECTION C */}
                <tr>
                  <td colSpan={2} className="bg-[#1e7845] text-white font-bold px-4 py-2 mt-4 uppercase border-t-[16px] border-white">C. SUSTAINABILITY CREDENTIALS (Brown Lens Verification)</td>
                </tr>
                <tr>
                  <td colSpan={2} className="bg-orange-50 text-orange-600 text-xs px-4 py-1 border border-gray-300 italic">
                    ⚠ All certifications will be verified by our Brown Lens Framework before profile goes live.
                  </td>
                </tr>
                <tr className="bg-[#666] text-white">
                  <td className="px-4 py-2 font-medium border border-gray-300">Primary Sustainability Certification *</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="primarySustainabilityCert" value={formData.primarySustainabilityCert} onChange={handleChange} required className="w-full p-2 outline-none text-black" placeholder="e.g. ISO 14001 / GreenPro / FSC / Fair Trade / BIS Green" /></td>
                </tr>
                <tr className="bg-[#666] text-white">
                  <td className="px-4 py-2 font-medium border border-gray-300">Issuing / Certifying Body *</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="issuingBody" value={formData.issuingBody} onChange={handleChange} required className="w-full p-2 outline-none text-black" placeholder="e.g. Bureau Veritas / NABCB / Rainforest Alliance" /></td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Certificate Upload (file path/link) *</td>
                  <td className="p-2 border border-gray-300 bg-white">
                    <input type="file" onChange={(e) => setCertFile(e.target.files?.[0] || null)} className="w-full text-sm text-black" />
                  </td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Additional Certification 1</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="additionalCert1" value={formData.additionalCert1} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="Name + Certificate No + Expiry" /></td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Additional Certification 2</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="additionalCert2" value={formData.additionalCert2} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="Name + Certificate No + Expiry" /></td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Sustainability Practice Description *</td>
                  <td className="p-0 border border-gray-300 bg-white"><textarea name="sustainabilityPractice" value={formData.sustainabilityPractice} onChange={handleChange} required rows={2} className="w-full p-2 outline-none text-black resize-none" placeholder="How does your business actively reduce environmental impact?" /></td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Recycled / Renewable Content %</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="recycledContent" value={formData.recycledContent} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="e.g. 80% recycled PET / 100% renewable energy used" /></td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Product Carbon Footprint Data</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="carbonFootprint" value={formData.carbonFootprint} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="If available — kg CO2e per unit / tonne" /></td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">EPR Registration (if applicable)</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="eprRegistration" value={formData.eprRegistration} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="EPR Reg. No. under CPCB / MoEFCC" /></td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Social Compliance (SA8000 / SEDEX)</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="socialCompliance" value={formData.socialCompliance} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="Yes / No / In Progress" /></td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Net Zero / Carbon Neutral Commitment</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="netZeroCommitment" value={formData.netZeroCommitment} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="Target year + verification body if pledged" /></td>
                </tr>

                {/* SECTION D */}
                <tr>
                  <td colSpan={2} className="bg-[#1e7845] text-white font-bold px-4 py-2 mt-4 uppercase border-t-[16px] border-white">D. MARKETPLACE LISTING PREFERENCES</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Listing Tier Subscription Preference *</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="listingTier" value={formData.listingTier} onChange={handleChange} required className="w-full p-2 outline-none text-black" placeholder="Sprout (Free) / Starter / Grow / Pro" /></td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Case Studies / Testimonials?</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="caseStudies" value={formData.caseStudies} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="Yes / No — Links if available" /></td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Awards & Recognitions</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="awards" value={formData.awards} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="e.g. CII GreenCo Gold 2023, Startup India Certified" /></td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Awards & Recognitions IMAGE</td>
                  <td className="p-2 border border-gray-300 bg-white"><input type="file" onChange={(e) => setAwardsFile(e.target.files?.[0] || null)} className="w-full text-sm text-black" /></td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Looking for Buyers In</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="lookingForBuyersIn" value={formData.lookingForBuyersIn} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="B2B Corporate / Government / Export / All" /></td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Willing to Offer Product Samples?</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="willingnessToOfferSamples" value={formData.willingnessToOfferSamples} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="Yes / No / On Request" /></td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Payment Terms Accepted</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="Advance / 30 days net / LC / Negotiable" /></td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Language of Communication</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="language" value={formData.language} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="English / Hindi / Tamil / Other" /></td>
                </tr>

                {/* SECTION E */}
                <tr>
                  <td colSpan={2} className="bg-[#1e7845] text-white font-bold px-4 py-2 mt-4 uppercase border-t-[16px] border-white">E. ECO SCORE SELF-DECLARATION (Verified post-onboarding)</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Product Lifecycle Stage Addressed</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="lifecycleStage" value={formData.lifecycleStage} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="Raw Material / Manufacturing / Distribution / End-of-Life" /></td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Packaging — Recyclable / Compost?</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="packaging" value={formData.packaging} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="Yes / Partial / No" /></td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Energy Source for Manufacturing</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="energySource" value={formData.energySource} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="Solar / Wind / Grid / Mixed — specify %" /></td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Water Recycling in Operations</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="waterRecycling" value={formData.waterRecycling} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="Yes / Partial / No" /></td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Waste-to-Landfill Reduction Plan</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="wasteReduction" value={formData.wasteReduction} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="Describe briefly or % reduction target" /></td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">SDG Alignment (select all that apply)</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="sdgAlignment" value={formData.sdgAlignment} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="e.g. SDG 7, SDG 12, SDG 13, SDG 15" /></td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Third-Party Audit Frequency</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="auditFrequency" value={formData.auditFrequency} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="Annual / Biennial / Never / In Progress" /></td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Third Party Certification Body</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="certifyingBody" value={formData.certifyingBody} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="TUV / SGS / INTERTEK /  (Link to Admin CBs)" /></td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">GHG Scope 1 Data Available?</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="ghgScope1" value={formData.ghgScope1} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="Yes / No / Partial" /></td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">GHG Scope 2 Data Available?</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="ghgScope2" value={formData.ghgScope2} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="Yes / No / Partial" /></td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">GHG Scope 3 Data Available?</td>
                  <td className="p-0 border border-gray-300 bg-white"><input name="ghgScope3" value={formData.ghgScope3} onChange={handleChange} className="w-full p-2 outline-none text-black" placeholder="Yes / No / Not measured" /></td>
                </tr>

                {/* SECTION F */}
                <tr>
                  <td colSpan={2} className="bg-[#1e7845] text-white font-bold px-4 py-2 mt-4 uppercase border-t-[16px] border-white">F. DECLARATION & SUBMISSION</td>
                </tr>
                <tr className="bg-green-50">
                  <td colSpan={2} className="p-4 border border-gray-300 text-gray-800 text-sm">
                    <p className="mb-4">
                      I hereby declare that all information provided above is true and accurate. I authorise Sustainly Ecohub India Pvt Ltd to verify my sustainability credentials through the Brown Lens Framework and list my company on the Sustainly Green marketplace (www.sustainlygreen.com) subject to approval.
                    </p>
                    <div className="flex flex-wrap gap-4 mt-2">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-semibold mb-1">Authorised Signatory Name:</label>
                        <input name="declarationName" value={formData.declarationName} onChange={handleChange} required className="w-full border-b border-black bg-transparent outline-none p-1" />
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-semibold mb-1">Signature:</label>
                        <input name="declarationSignature" value={formData.declarationSignature} onChange={handleChange} required className="w-full border-b border-black bg-transparent outline-none p-1 placeholder-gray-400" placeholder="Type full name to sign" />
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-semibold mb-1">Date:</label>
                        <input type="date" name="declarationDate" value={formData.declarationDate} onChange={handleChange} required className="w-full border-b border-black bg-transparent outline-none p-1" />
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {error && <p className="text-sm text-red-600 font-medium text-center">{error}</p>}

          <div className="flex justify-center mt-8">
            <button
              type="submit"
              disabled={submitting}
              className="px-10 py-3 rounded-full text-white font-bold shadow-lg bg-[#1e7845] hover:bg-[#165a34] transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit for Approval"}
            </button>
          </div>
        </form>
        
        <div className="bg-[#1e7845] text-white text-xs text-center py-2 mt-4">
          www.sustainlygreen.com | Sustainly Ecohub India Pvt Ltd | Vendor Onboarding
        </div>

      </div>
    </main>
  );
}