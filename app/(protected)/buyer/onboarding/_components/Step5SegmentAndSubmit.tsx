"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Input, Select, TextArea, MultiSelect, Toggle, Divider } from "./FormFields";
import { CalendarDays, PenLine } from "lucide-react";

// ─── CORPORATE FIELDS ─────────────────────────────────────────────────────────
const CorporateFields = () => (
  <div className="space-y-5 animate-in fade-in duration-300">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-2 h-2 rounded-full bg-blue-500" />
      <p className="text-sm font-semibold text-blue-700">Corporate / Listed Company Fields</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Input name="stockSymbol" label="Stock Symbol / Ticker" placeholder="e.g. RELIANCE / TCS" />
      <Select
        name="sustainabilityCommittee"
        label="Sustainability Committee"
        options={[
          { label: "Yes – board-level", value: "board-level" },
          { label: "Yes – management-level", value: "management-level" },
          { label: "In formation", value: "forming" },
          { label: "No", value: "no" },
        ]}
      />
      <Select
        name="brsrCompliance"
        label="BRSR Filing Status"
        options={[
          { label: "Mandatory filer (Top 1000 NSE/BSE)", value: "mandatory" },
          { label: "Voluntary filer", value: "voluntary" },
          { label: "Not applicable", value: "na" },
        ]}
      />
      <Select
        name="vendorDiversityPolicy"
        label="Vendor Diversity Policy"
        options={[
          { label: "Yes – active policy", value: "active" },
          { label: "Yes – in draft", value: "draft" },
          { label: "No", value: "no" },
        ]}
      />
      <Input name="vendorCode" label="Vendor Code of Conduct" placeholder="URL or document reference" />
      <Input name="esgScore" label="ESG Score (if rated)" placeholder="e.g. MSCI: AA / EcoVadis: 72" />
      <Input name="sustainabilityIndex" label="Sustainability Index Membership" placeholder="e.g. DJSI, FTSE4Good" />
      <Input name="csrSpend" label="Annual CSR Spend (INR Cr)" placeholder="e.g. 12.5" />
    </div>
  </div>
);

// ─── MSME FIELDS ─────────────────────────────────────────────────────────────
const MSMEFields = () => (
  <div className="space-y-5 animate-in fade-in duration-300">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-2 h-2 rounded-full bg-orange-500" />
      <p className="text-sm font-semibold text-orange-700">MSME-Specific Fields</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Input name="udyamNumber" label="Udyam Registration Number" placeholder="UDYAM-XX-00-0000000" />
      <Select
        name="msmeCategory"
        label="MSME Category"
        options={[
          { label: "Micro", value: "micro" },
          { label: "Small", value: "small" },
          { label: "Medium", value: "medium" },
        ]}
      />
      <div className="md:col-span-2">
        <TextArea
          name="reasonForSustainableSourcing"
          label="Primary Reason for Sustainable Sourcing"
          placeholder="e.g. client mandates, cost savings, brand value, regulatory compliance…"
          rows={3}
          required
        />
      </div>
      <Select
        name="budgetSensitivity"
        label="Budget Sensitivity"
        options={[
          { label: "Very price sensitive", value: "very-sensitive" },
          { label: "Moderately sensitive", value: "moderate" },
          { label: "Value over price", value: "value-focused" },
        ]}
        required
      />
      <Select
        name="premiumWillingness"
        label="Willingness to Pay Green Premium"
        options={[
          { label: "Up to 5%", value: "5" },
          { label: "5–10%", value: "5-10" },
          { label: "10–20%", value: "10-20" },
          { label: "No premium", value: "none" },
        ]}
      />
      <Select
        name="sourcingType"
        label="Sourcing Type"
        options={[
          { label: "Direct from manufacturer", value: "direct" },
          { label: "Through distributor", value: "distributor" },
          { label: "E-commerce / Marketplace", value: "marketplace" },
          { label: "Mixed", value: "mixed" },
        ]}
      />
      <Select
        name="groupBuyingInterest"
        label="Interested in Group Buying / Collective Procurement?"
        options={[
          { label: "Yes – very interested", value: "yes" },
          { label: "Open to it", value: "open" },
          { label: "No", value: "no" },
        ]}
      />
      <Input name="tradeAssociation" label="Trade Association / Chamber Membership" placeholder="e.g. FICCI, CII, NASSCOM" />
    </div>
  </div>
);

// ─── DISTRIBUTOR FIELDS ───────────────────────────────────────────────────────
const DistributorFields = () => (
  <div className="space-y-5 animate-in fade-in duration-300">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-2 h-2 rounded-full bg-purple-500" />
      <p className="text-sm font-semibold text-purple-700">Distributor-Specific Fields</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Input name="coverageArea" label="Distribution Coverage Area" placeholder="e.g. Maharashtra, Goa, Karnataka" required />
      <Input name="noOfRetailOutlets" label="No. of Retail Outlets Served" placeholder="e.g. 250" />
      <Select
        name="monthlyVolume"
        label="Average Monthly Distribution Volume"
        options={[
          { label: "Under ₹10 Lakh", value: "under-10l" },
          { label: "₹10–50 Lakh", value: "10-50l" },
          { label: "₹50 Lakh – ₹1 Cr", value: "50l-1cr" },
          { label: "₹1–5 Cr", value: "1-5cr" },
          { label: "₹5 Cr+", value: "5cr+" },
        ]}
      />
      <Select
        name="coldChainCapability"
        label="Cold Chain Capability"
        options={[
          { label: "Yes – full cold chain", value: "full" },
          { label: "Partial", value: "partial" },
          { label: "No", value: "no" },
        ]}
      />
      <MultiSelect name="existingBrands" label="Current Brands / Principals" max={6} />
      <Select
        name="exclusiveInterest"
        label="Interested in Exclusive Distribution?"
        options={[
          { label: "Yes", value: "yes" },
          { label: "Non-exclusive preferred", value: "non-exclusive" },
          { label: "No preference", value: "any" },
        ]}
      />
      <Input name="trackRecord" label="Years in Distribution Business" placeholder="e.g. 8 years" />
      <Select
        name="creditTermsPreferred"
        label="Credit Terms Preferred from Suppliers"
        options={[
          { label: "Advance payment", value: "advance" },
          { label: "Net 15", value: "net-15" },
          { label: "Net 30", value: "net-30" },
          { label: "Net 45+", value: "net-45+" },
          { label: "Consignment", value: "consignment" },
        ]}
      />
    </div>
  </div>
);

// ─── RETAILER FIELDS ─────────────────────────────────────────────────────────
const RetailerFields = () => (
  <div className="space-y-5 animate-in fade-in duration-300">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-2 h-2 rounded-full bg-pink-500" />
      <p className="text-sm font-semibold text-pink-700">Retailer-Specific Fields</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Select
        name="retailFormat"
        label="Retail Format"
        options={[
          { label: "Standalone store", value: "standalone" },
          { label: "Mall / High-street", value: "mall" },
          { label: "Supermarket / Hypermarket", value: "supermarket" },
          { label: "Department store", value: "department" },
          { label: "Specialty store", value: "specialty" },
          { label: "Online-only (D2C)", value: "d2c" },
          { label: "Omnichannel", value: "omnichannel" },
        ]}
        required
      />
      <Input name="storeOrSkuCount" label="No. of Stores / Active SKUs" placeholder="e.g. 12 stores / 2,000 SKUs" />
      <Select
        name="monthlyOrders"
        label="Monthly Order Volume"
        options={[
          { label: "Under ₹5 Lakh", value: "under-5l" },
          { label: "₹5–20 Lakh", value: "5-20l" },
          { label: "₹20–50 Lakh", value: "20-50l" },
          { label: "₹50 Lakh – ₹1 Cr", value: "50l-1cr" },
          { label: "₹1 Cr+", value: "1cr+" },
        ]}
      />
      <MultiSelect
        name="platformPresence"
        label="Online Platform Presence"
        options={["Amazon", "Flipkart", "Myntra", "Nykaa", "Meesho", "Blinkit", "Zepto", "Swiggy Instamart", "Own Website"]}
        max={5}
      />
    </div>
  </div>
);

// ─── STEP 5 CONTAINER ─────────────────────────────────────────────────────────
export const Step5SegmentAndSubmit = () => {
  const { watch, register, formState: { errors } } = useFormContext();
  const buyerSegment = watch("buyerSegment");

  const declarationError = errors["declarationAgreed"]?.message as string;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Segment Details & Declaration</h2>
        <p className="text-gray-500 mt-1 text-sm">
          A few final details tailored to your buyer segment.
        </p>
      </div>

      {/* Dynamic segment block */}
      {!buyerSegment && (
        <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-gray-200 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-2xl mb-3">
            ⬆
          </div>
          <p className="text-sm font-semibold text-gray-700">No Buyer Segment selected</p>
          <p className="text-xs text-gray-400 mt-1">Go back to Step 2 and choose your segment to unlock these fields.</p>
        </div>
      )}

      {buyerSegment === "corporate" && <CorporateFields />}
      {buyerSegment === "msme" && <MSMEFields />}
      {buyerSegment === "distributor" && <DistributorFields />}
      {buyerSegment === "retailer" && <RetailerFields />}

      {/* Declaration */}
      <div>
        <Divider label="Declaration" />
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 space-y-5">
          {/* Checkbox */}
          <label
            className={`flex items-start gap-3 cursor-pointer group ${declarationError ? "text-red-600" : "text-gray-700"}`}
          >
            <div className="mt-0.5">
              <input
                type="checkbox"
                {...register("declarationAgreed")}
                className="hidden"
                id="declarationAgreed"
              />
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  watch("declarationAgreed")
                    ? "bg-green-600 border-green-600"
                    : declarationError
                    ? "border-red-400"
                    : "border-gray-300 group-hover:border-green-400"
                }`}
              >
                {watch("declarationAgreed") && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm leading-relaxed">
              I hereby declare that the information provided above is true and accurate to the best of my knowledge. 
              I authorise Sustainly to use this information to connect with relevant sustainable vendors. 
              I understand this is not a binding procurement commitment.
            </span>
          </label>
          {declarationError && <p className="text-xs text-red-500 ml-8">⚠ {declarationError}</p>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            <Input
              name="declarationName"
              label="Full Name (Digital Signature)"
              placeholder="Your legal name"
              icon={PenLine}
              required
            />
            <Input
              name="declarationDesignation"
              label="Designation"
              placeholder="Your role / title"
            />
            <Input
              name="declarationDate"
              label="Date"
              type="date"
              defaultValue={today}
              icon={CalendarDays}
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
};
