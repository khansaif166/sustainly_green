"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { uploadFileWithProgress } from "@/lib/storage";
import { OnboardingFormData } from "../../../vendor/onboarding/schema";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Save, 
  X, 
  ExternalLink,
  ShieldCheck,
  Building2,
  User,
  ShoppingBag,
  Info
} from "lucide-react";
import { Input, Select, TextArea, MultiSelect, Toggle, FileUpload } from "../../../vendor/onboarding/_components/FormFields";

export default function AdminVendorDetailsPage() {
  const router = useRouter();
  const { uid } = useParams();

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vendorData, setVendorData] = useState<any>(null);

  const methods = useForm<OnboardingFormData>({
    mode: "onChange",
  });

  const { reset, handleSubmit } = methods;

  useEffect(() => {
    async function load() {
      if (!uid) return;
      const snap = await getDoc(doc(db, "vendors", uid as string));
      if (snap.exists()) {
        const data = snap.data();
        setVendorData(data);
        reset(data as any);
      }
      setLoading(false);
    }
    load();
  }, [uid, reset]);

  const handleApprove = async () => {
    if (!uid) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "vendors", uid as string), { approved: true });
      await updateDoc(doc(db, "users", uid as string), { vendorApproved: true });
      setVendorData((prev: any) => ({ ...prev, approved: true }));
    } catch (e) {
      alert("Error approving vendor");
    }
    setSubmitting(false);
  };

  const handleReject = async () => {
    if (!uid) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "vendors", uid as string), { approved: false });
      setVendorData((prev: any) => ({ ...prev, approved: false }));
    } catch (e) {
      alert("Error rejecting vendor");
    }
    setSubmitting(false);
  };

  const onSubmit = async (data: OnboardingFormData) => {
    if (!uid) return;
    setSubmitting(true);
    try {
      let logoUrl = "";
      let certUrl = "";
      let awardsUrl = "";

      if (data.logoFile instanceof File) {
        const path = `vendors/${uid}/logos/${Date.now()}_${data.logoFile.name}`;
        logoUrl = await uploadFileWithProgress(data.logoFile, path);
      }

      if (data.certificateFile instanceof File) {
        const path = `vendors/${uid}/certs/${Date.now()}_${data.certificateFile.name}`;
        certUrl = await uploadFileWithProgress(data.certificateFile, path);
      }
      
      if (data.awardsFile instanceof File) {
        const path = `vendors/${uid}/awards/${Date.now()}_${data.awardsFile.name}`;
        awardsUrl = await uploadFileWithProgress(data.awardsFile, path);
      }

      const { logoFile, certificateFile, awardsFile, ...cleanData } = data;
      
      const payload: any = {
        ...cleanData,
        updatedAt: serverTimestamp(),
      };
      
      // Handle Logo
      if (logoUrl) {
        payload.logoUrl = logoUrl;
      } else if (data.logoFile === null) {
        payload.logoUrl = ""; // Delete logo
      }

      // Handle Certificate
      if (certUrl) {
        payload.certificateFileUrl = certUrl;
      } else if (data.certificateFile === null) {
        payload.certificateFileUrl = ""; // Delete certificate
      }

      // Handle Awards
      if (awardsUrl) {
        payload.awardsImageUrl = awardsUrl;
      } else if (data.awardsFile === null) {
        payload.awardsImageUrl = ""; // Delete awards
      }

      await updateDoc(doc(db, "vendors", uid as string), payload);
      setVendorData((prev: any) => ({ ...prev, ...payload }));
      setIsEditing(false);
      alert("Vendor profile updated successfully!");
    } catch (e) {
      console.error(e);
      alert("Error updating vendor profile");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!vendorData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500 font-medium">Vendor profile not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-green-600 hover:underline">Go Back</button>
      </div>
    );
  }

  const SectionHeader = ({ icon: Icon, title, description }: any) => (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
        <Icon size={20} />
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );

  const DataItem = ({ label, value }: { label: string; value: any }) => (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value || "—"}</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#fafbfc] py-8 px-4 md:py-12">
      <div className="w-full mx-auto space-y-8 px-4 md:px-8 lg:px-12">
        
        {/* Top Navigation & Status Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/admin/vendors")}
              className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                {vendorData.logoUrl ? (
                  <img src={vendorData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="text-green-600" size={32} />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{vendorData.companyName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    vendorData.approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {vendorData.approved ? <CheckCircle2 size={12} /> : <Info size={12} />}
                    {vendorData.approved ? 'Verified Vendor' : 'Pending Verification'}
                  </span>
                  <span className="text-xs text-gray-400">• Updated {vendorData.updatedAt?.seconds ? new Date(vendorData.updatedAt.seconds * 1000).toLocaleDateString() : '—'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-all"
                >
                  <X size={18} /> Cancel
                </button>
                <button 
                  onClick={handleSubmit(onSubmit as any)}
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-all disabled:opacity-50"
                >
                  {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-sm"
                >
                  <Edit3 size={18} /> Edit Profile
                </button>
                {!vendorData.approved && (
                  <button 
                    onClick={handleApprove}
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-all disabled:opacity-50"
                  >
                    Approve Vendor
                  </button>
                )}
                {vendorData.approved && (
                  <button 
                    onClick={handleReject}
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded-xl font-medium hover:bg-red-100 transition-all"
                  >
                    <XCircle size={18} /> Suspend Vendor
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <FormProvider {...methods}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Identity Section */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <SectionHeader 
                  icon={User} 
                  title="Identity & Legal" 
                  description="Company registration and contact details" 
                />
                
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <FileUpload name="logoFile" label="Company Logo" />
                        {vendorData.logoUrl && !methods.watch("logoFile") && (
                          <div className="mt-2 flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100 w-fit">
                            <img src={vendorData.logoUrl} className="w-8 h-8 rounded object-cover border border-gray-200" alt="Current" />
                            <span className="text-xs text-gray-500 font-medium italic">Current Logo</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Input name="companyName" label="Company Name *" />
                    <Select name="registrationType" label="Registration Type *" options={[{label: "Pvt Ltd", value: "pvt-ltd"}, {label: "LLP", value: "llp"}, {label: "Sole Proprietorship", value: "sole-proprietorship"}]} />
                    <Input name="cinRegistration" label="CIN Number *" />
                    <Input name="gstNumber" label="GST Number *" />
                    <Input name="yearOfIncorporation" label="Year of Incorporation *" />
                    <Input name="businessEmail" label="Business Email *" />
                    <Input name="whatsapp" label="WhatsApp/Mobile *" />
                    <Input name="primaryContactName" label="Primary Contact Name *" />
                    <Input name="designation" label="Designation *" />
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Input name="registeredAddress" label="Registered Address *" />
                      <Input name="city" label="City *" />
                      <Input name="state" label="State *" />
                      <Input name="pinCode" label="PIN Code *" />
                      <Input name="country" label="Country *" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-4">
                    <DataItem label="Company Name" value={vendorData.companyName} />
                    <DataItem label="Registration Type" value={vendorData.registrationType} />
                    <DataItem label="CIN Number" value={vendorData.cinRegistration} />
                    <DataItem label="GST Number" value={vendorData.gstNumber} />
                    <DataItem label="Incorporation Year" value={vendorData.yearOfIncorporation} />
                    <DataItem label="Business Email" value={vendorData.businessEmail} />
                    <DataItem label="Primary Contact" value={vendorData.primaryContactName} />
                    <DataItem label="Designation" value={vendorData.designation} />
                    <DataItem label="WhatsApp/Mobile" value={vendorData.whatsapp} />
                    <div className="col-span-full">
                      <DataItem label="Registered Address" value={`${vendorData.registeredAddress}, ${vendorData.city}, ${vendorData.state}, ${vendorData.pinCode}, ${vendorData.country}`} />
                    </div>
                  </div>
                )}
              </div>

              {/* Business Overview Section */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <SectionHeader 
                  icon={Building2} 
                  title="Business Overview" 
                  description="Operations, scale and market reach" 
                />
                
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select name="businessType" label="Business Type *" options={[{label: "Manufacturer", value: "manufacturer"}, {label: "Trader", value: "trader"}]} />
                    <Input name="primaryCategory" label="Primary Category *" />
                    <div className="md:col-span-2">
                      <MultiSelect name="subCategories" label="Sub-Categories" max={3} />
                    </div>
                    <div className="md:col-span-2">
                      <TextArea name="shortDescription" label="Company Description *" rows={3} />
                    </div>
                    <MultiSelect name="keyProducts" label="Key Products" max={5} />
                    <Toggle name="exportCapability" label="Export Capability" />
                    <Input name="exportMarkets" label="Export Markets" />
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-4">
                      <DataItem label="Business Type" value={vendorData.businessType} />
                      <DataItem label="Primary Category" value={vendorData.primaryCategory} />
                      <DataItem label="Export Capability" value={vendorData.exportCapability ? 'Yes' : 'No'} />
                      <DataItem label="Export Markets" value={vendorData.exportMarkets} />
                    </div>
                    <div className="pt-6 border-t border-gray-50">
                      <DataItem label="Company Description" value={vendorData.shortDescription} />
                    </div>
                    <div className="pt-6 border-t border-gray-50">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Key Products / Services</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(vendorData.keyProducts) ? (
                          vendorData.keyProducts.map((p: string) => (
                            <span key={p} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                              {p}
                            </span>
                          ))
                        ) : vendorData.keyProducts ? (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                            {vendorData.keyProducts}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs italic">No products listed</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sustainability Section */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <SectionHeader 
                  icon={ShieldCheck} 
                  title="Sustainability Credentials" 
                  description="Environmental compliance and certifications" 
                />
                
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input name="primarySustainabilityCert" label="Primary Certification *" />
                    <Input name="issuingBody" label="Issuing Body *" />
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <FileUpload name="certificateFile" label="Sustainability Certificate (Update)" />
                        {vendorData.certificateFileUrl && !methods.watch("certificateFile") && (
                          <div className="mt-2 flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100 w-fit">
                            <ShieldCheck size={16} className="text-green-600" />
                            <span className="text-xs text-gray-500 font-medium italic truncate max-w-[200px]">Current Certificate</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <TextArea name="sustainabilityPractice" label="Sustainability Description *" rows={3} />
                    </div>
                    <Input name="recycledContent" label="Recycled Content %" />
                    <Input name="carbonFootprint" label="Carbon Footprint" />
                    <Input name="socialCompliance" label="Social Compliance" />
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-green-600 shadow-sm">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{vendorData.primarySustainabilityCert}</p>
                          <p className="text-xs text-gray-500">Issued by {vendorData.issuingBody}</p>
                        </div>
                      </div>
                      {vendorData.certificateFileUrl && (
                        <a 
                          href={vendorData.certificateFileUrl} 
                          target="_blank" 
                          className="flex items-center gap-2 px-4 py-2 bg-white text-green-600 text-sm font-bold rounded-xl border border-green-200 hover:bg-green-600 hover:text-white transition-all shadow-sm"
                        >
                          <ExternalLink size={16} /> View Certificate
                        </a>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-4">
                      <DataItem label="Recycled Content %" value={vendorData.recycledContent} />
                      <DataItem label="Carbon Footprint" value={vendorData.carbonFootprint} />
                      <DataItem label="Social Compliance" value={vendorData.socialCompliance} />
                    </div>
                    <div className="pt-6 border-t border-gray-50">
                      <DataItem label="Sustainability Practice" value={vendorData.sustainabilityPractice} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Sidebar Info */}
            <div className="space-y-8">
              
              {/* Marketplace Preferences */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <SectionHeader 
                  icon={ShoppingBag} 
                  title="Marketplace" 
                  description="Preferences & listing" 
                />
                
                <div className="space-y-6">
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-4">
                    <DataItem label="Listing Tier" value={vendorData.listingTier} />
                    <DataItem label="Language" value={vendorData.language} />
                    <DataItem label="Payment Terms" value={vendorData.paymentTerms} />
                  </div>
                  
                  {vendorData.awardsImageUrl && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Awards & Recognitions</p>
                      <a href={vendorData.awardsImageUrl} target="_blank" className="block relative group overflow-hidden rounded-2xl border border-gray-100">
                        <img src={vendorData.awardsImageUrl} alt="Award" className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-500" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ExternalLink className="text-white" />
                        </div>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Verification Checklist (Non-functional, for UI) */}
              <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-xl">
                <h3 className="text-lg font-bold mb-4">Verification Checklist</h3>
                <div className="space-y-4">
                  {[
                    { label: "Valid GST/CIN Registered", check: !!vendorData.gstNumber },
                    { label: "Sustainability Certificate Provided", check: !!vendorData.certificateFileUrl },
                    { label: "Contact Details Verified", check: !!vendorData.whatsapp },
                    { label: "Eco-Score Evaluation", check: vendorData.approved },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.check ? 'bg-green-500' : 'bg-gray-700'}`}>
                        <CheckCircle2 size={14} />
                      </div>
                      <span className={`text-sm ${item.check ? 'text-white' : 'text-gray-400'}`}>{item.label}</span>
                    </div>
                  ))}
                </div>
                
                {!vendorData.approved && (
                  <div className="mt-8 pt-8 border-t border-gray-800">
                    <p className="text-xs text-gray-400 mb-4">Once you approve, the vendor will be notified and their profile will be live on the marketplace.</p>
                    <button 
                      onClick={handleApprove}
                      disabled={submitting}
                      className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all active:scale-95"
                    >
                      Approve & Go Live
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </FormProvider>
      </div>
    </main>
  );
}
