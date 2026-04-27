"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function AdminVendorDetailsPage() {
  const router = useRouter();
  const { uid } = useParams();

  const [vendorData, setVendorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function load() {
      if (!uid) return;
      const snap = await getDoc(doc(db, "vendors", uid as string));
      if (snap.exists()) {
        setVendorData(snap.data());
      }
      setLoading(false);
    }
    load();
  }, [uid]);

  async function handleApprove() {
    setUpdating(true);
    try {
      await updateDoc(doc(db, "vendors", uid as string), { approved: true });
      await updateDoc(doc(db, "users", uid as string), { vendorApproved: true });
      setVendorData((prev: any) => ({ ...prev, approved: true }));
      alert("Vendor Approved successfully!");
    } catch (e) {
      alert("Error approving vendor");
    }
    setUpdating(false);
  }

  async function handleReject() {
    setUpdating(true);
    try {
      await updateDoc(doc(db, "vendors", uid as string), { approved: false });
      setVendorData((prev: any) => ({ ...prev, approved: false }));
      alert("Vendor Rejected successfully!");
    } catch (e) {
      alert("Error rejecting vendor");
    }
    setUpdating(false);
  }

  if (loading) return <div className="p-10 text-center">Loading Vendor Profile...</div>;
  if (!vendorData) return <div className="p-10 text-center">Vendor not found.</div>;

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl bg-white shadow-xl">
        
        {/* TOP HEADER */}
        <div className="bg-[#1e7845] text-white p-6 text-center relative">
          <button 
            onClick={() => router.push("/admin/vendors")}
            className="absolute left-6 top-6 text-sm underline hover:text-gray-200"
          >
            &larr; Back
          </button>
          <h1 className="text-3xl font-bold tracking-wide">SUSTAINLY ECOHUB | Vendor Business Profile</h1>
          <p className="text-sm italic mt-2 text-green-100">
            Admin Document Verification & Approval View
          </p>
        </div>

        <div className="p-4 md:p-8 space-y-8">

          {/* ADMIN ACTION PANEL TOP */}
          <div className="flex flex-col md:flex-row items-center justify-between bg-gray-100 p-4 border border-gray-300 rounded-md">
            <div>
              <p className="font-semibold text-gray-800">Status: 
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${vendorData.approved ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                  {vendorData.approved ? "APPROVED" : "PENDING"}
                </span>
              </p>
              <p className="text-sm text-gray-600 mt-1">Review the business details and documents before approval.</p>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <button 
                onClick={handleReject} disabled={updating}
                className="px-6 py-2 border border-red-500 text-red-600 rounded-full font-medium hover:bg-red-50 transition"
              >
                Reject
              </button>
              {!vendorData.approved && (
                <button 
                  onClick={handleApprove} disabled={updating}
                  className="px-6 py-2 bg-[#1e7845] text-white rounded-full font-medium hover:bg-[#165a34] transition shadow-md"
                >
                  Approve
                </button>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-300">
              <tbody>
                {/* SECTION A */}
                <tr>
                  <td colSpan={2} className="bg-[#1e7845] text-white font-bold px-4 py-2 uppercase">A. IDENTITY & LEGAL INFORMATION</td>
                </tr>
                <tr className="bg-[#666] text-white">
                  <td className="w-[40%] px-4 py-2 font-medium border border-gray-300">Company / Brand Name</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900 font-semibold">{vendorData.companyName || "-"}</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Company Registration Type</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.registrationType || "-"}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">CIN / Registration Number</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.cinRegistration || vendorData.registrationNo || "-"}</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">GST Number</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.gstNumber || "-"}</td>
                </tr>
                <tr className="bg-[#666] text-white">
                  <td className="px-4 py-2 font-medium border border-gray-300">Year of Incorporation</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.yearOfIncorporation || vendorData.yearEstablished || "-"}</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Registered Address</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.registeredAddress || "-"}</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">City</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.city || "-"}</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">State / Province</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.state || "-"}</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">PIN / Postal Code</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.pinCode || "-"}</td>
                </tr>
                <tr className="bg-[#666] text-white">
                  <td className="px-4 py-2 font-medium border border-gray-300">Country</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.country || "-"}</td>
                </tr>
                
                <tr>
                  <td colSpan={2} className="bg-[#1e7845] text-white font-bold px-4 py-2 uppercase">A1. CONTACT INFORMATION</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Primary Contact Person Name</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.primaryContactName || "-"}</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Designation / Role</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.designation || "-"}</td>
                </tr>
                <tr className="bg-[#666] text-white">
                  <td className="px-4 py-2 font-medium border border-gray-300">Business Email</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">
                    <a href={`mailto:${vendorData.businessEmail}`} className="text-blue-600 underline">{vendorData.businessEmail || "-"}</a>
                  </td>
                </tr>
                <tr className="bg-[#666] text-white">
                  <td className="px-4 py-2 font-medium border border-gray-300">WhatsApp / Mobile</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.whatsapp || vendorData.phone || "-"}</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Alternate Phone</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.alternatePhone || "-"}</td>
                </tr>

                {/* SECTION B */}
                <tr>
                  <td colSpan={2} className="bg-[#1e7845] text-white font-bold px-4 py-2 mt-4 uppercase border-t-[16px] border-white">B. BUSINESS OVERVIEW</td>
                </tr>
                <tr className="bg-[#666] text-white">
                  <td className="px-4 py-2 font-medium border border-gray-300">Business Type</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.businessType || "-"}</td>
                </tr>
                <tr className="bg-[#666] text-white">
                  <td className="px-4 py-2 font-medium border border-gray-300">Primary Business Category</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.primaryCategory || "-"}</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Sub Categories</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.subCategories || "-"}</td>
                </tr>
                <tr className="bg-[#666] text-white">
                  <td className="px-4 py-2 font-medium border border-gray-300">Company Short Description</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.shortDescription || vendorData.description || "-"}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Key Products / Services (Top 5)</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.keyProducts || "-"}</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Target Industries / Buyers</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.targetIndustries || "-"}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Preferred Buyer Geography</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.preferredBuyerGeography || "-"}</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">No. of Employees</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.noOfEmployees || "-"}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Annual Turnover Range (INR)</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.annualTurnover || "-"}</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Supply / Production Capacity</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.supplyCapacity || "-"}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Minimum Order Quantity (MOQ)</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.moq || "-"}</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Export Capability</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.exportCapability || "-"}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Export Markets</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.exportMarkets || "-"}</td>
                </tr>

                {/* SECTION C */}
                <tr>
                  <td colSpan={2} className="bg-[#1e7845] text-white font-bold px-4 py-2 mt-4 uppercase border-t-[16px] border-white">C. SUSTAINABILITY CREDENTIALS (Brown Lens Verification)</td>
                </tr>
                <tr className="bg-[#666] text-white">
                  <td className="px-4 py-2 font-medium border border-gray-300">Primary Sustainability Certification</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.primarySustainabilityCert || "-"}</td>
                </tr>
                <tr className="bg-[#666] text-white">
                  <td className="px-4 py-2 font-medium border border-gray-300">Issuing / Certifying Body</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.issuingBody || "-"}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Certificate Upload</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">
                    {vendorData.certificateFileUrl ? (
                      <a href={vendorData.certificateFileUrl} target="_blank" className="text-blue-600 underline font-medium">View Certificate Document</a>
                    ) : (
                      "No file uploaded"
                    )}
                  </td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Additional Certification 1</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.additionalCert1 || "-"}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Additional Certification 2</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.additionalCert2 || "-"}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Sustainability Practice Description</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900 whitespace-pre-wrap">{vendorData.sustainabilityPractice || "-"}</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Recycled / Renewable Content %</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.recycledContent || "-"}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Product Carbon Footprint Data</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.carbonFootprint || "-"}</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">EPR Registration (if applicable)</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.eprRegistration || "-"}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Social Compliance (SA8000 / SEDEX)</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.socialCompliance || "-"}</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Net Zero / Carbon Neutral Commitment</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.netZeroCommitment || "-"}</td>
                </tr>

                {/* SECTION D */}
                <tr>
                  <td colSpan={2} className="bg-[#1e7845] text-white font-bold px-4 py-2 mt-4 uppercase border-t-[16px] border-white">D. MARKETPLACE LISTING PREFERENCES</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Listing Tier Subscription Preference</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.listingTier || "-"}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Case Studies / Testimonials?</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.caseStudies || "-"}</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Awards & Recognitions</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.awards || "-"}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Awards & Recognitions IMAGE</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">
                    {vendorData.awardsImageUrl ? (
                      <a href={vendorData.awardsImageUrl} target="_blank" className="text-blue-600 underline font-medium">View Award Image</a>
                    ) : (
                      "No file uploaded"
                    )}
                  </td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Looking for Buyers In</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.lookingForBuyersIn || "-"}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Willing to Offer Product Samples?</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.willingnessToOfferSamples || "-"}</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Payment Terms Accepted</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.paymentTerms || "-"}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Language of Communication</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.language || "-"}</td>
                </tr>

                {/* SECTION E */}
                <tr>
                  <td colSpan={2} className="bg-[#1e7845] text-white font-bold px-4 py-2 mt-4 uppercase border-t-[16px] border-white">E. ECO SCORE SELF-DECLARATION</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Product Lifecycle Stage Addressed</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.lifecycleStage || "-"}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Packaging — Recyclable / Compost?</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.packaging || "-"}</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Energy Source for Manufacturing</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.energySource || "-"}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Water Recycling in Operations</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.waterRecycling || "-"}</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Waste-to-Landfill Reduction Plan</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.wasteReduction || "-"}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">SDG Alignment</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.sdgAlignment || "-"}</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Third-Party Audit Frequency</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.auditFrequency || "-"}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">Third Party Certification Body</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.certifyingBody || "-"}</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">GHG Scope 1 Data Available?</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.ghgScope1 || "-"}</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">GHG Scope 2 Data Available?</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.ghgScope2 || "-"}</td>
                </tr>
                <tr className="bg-[#f5f5f5]">
                  <td className="px-4 py-2 font-medium border border-gray-300 text-gray-800">GHG Scope 3 Data Available?</td>
                  <td className="p-2 border border-gray-300 bg-white text-gray-900">{vendorData.ghgScope3 || "-"}</td>
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
                        <p className="text-xs font-semibold mb-1">Authorised Signatory Name:</p>
                        <p className="font-medium text-gray-900">{vendorData.declarationName || "—"}</p>
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <p className="text-xs font-semibold mb-1">Signature:</p>
                        <p className="font-medium text-gray-900 italic font-serif">{vendorData.declarationSignature || "—"}</p>
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <p className="text-xs font-semibold mb-1">Date:</p>
                        <p className="font-medium text-gray-900">{vendorData.declarationDate || "—"}</p>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ADMIN ACTION PANEL BOTTOM */}
          <div className="flex items-center justify-end gap-3 mt-8">
            <button 
              onClick={handleReject} disabled={updating}
              className="px-8 py-3 border border-red-500 text-red-600 rounded-full font-medium hover:bg-red-50 transition"
            >
              Reject Vendor
            </button>
            {!vendorData.approved && (
              <button 
                onClick={handleApprove} disabled={updating}
                className="px-8 py-3 bg-[#1e7845] text-white rounded-full font-bold hover:bg-[#165a34] transition shadow-lg"
              >
                Approve Vendor
              </button>
            )}
          </div>
        </div>
        
        <div className="bg-[#1e7845] text-white text-xs text-center py-2 mt-4">
          www.sustainlygreen.com | Sustainly Ecohub India Pvt Ltd | Admin Review Mode
        </div>

      </div>
    </main>
  );
}
