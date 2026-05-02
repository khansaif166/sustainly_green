"use client";

import React from "react";
import { Select, MultiSelect, Input, Divider } from "./FormFields";

const CATEGORIES = [
  "Packaging – Eco / Recycled",
  "Office Supplies – Green",
  "Furniture – Sustainable",
  "Apparel – Organic / Fair Trade",
  "Food & Beverages – Organic",
  "Cleaning Products – Biodegradable",
  "Electronics – Energy Efficient",
  "Construction Materials – Green",
  "Solar / Renewable Energy",
  "Waste Management Solutions",
  "Water Conservation Products",
  "IT Equipment – Refurbished",
  "Paper – FSC Certified",
  "Stationery – Recycled",
  "Industrial Equipment – Efficient",
  "Transportation – EV / Low Emission",
];

const CERTIFICATION_REQUIREMENTS = [
  { label: "No certification required", value: "none" },
  { label: "Any green / eco label", value: "any-green" },
  { label: "ISO 14001", value: "iso-14001" },
  { label: "GRS / GOTS Certified", value: "grs-gots" },
  { label: "Organic Certification", value: "organic" },
  { label: "BIS Certification", value: "bis" },
  { label: "International standard (specify)", value: "international" },
];

const PRICING_MODELS = [
  { label: "Fixed Price", value: "fixed" },
  { label: "Rate Contract", value: "rate-contract" },
  { label: "Negotiated per order", value: "negotiated" },
  { label: "RFQ based", value: "rfq" },
  { label: "Auction / Tender", value: "auction" },
];

const ORDER_FREQUENCY = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Bi-weekly", value: "biweekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "One-time project", value: "one-time" },
];

const ORDER_VALUES = [
  { label: "Under ₹50,000", value: "under-50k" },
  { label: "₹50k – ₹5 Lakh", value: "50k-5l" },
  { label: "₹5 Lakh – ₹25 Lakh", value: "5l-25l" },
  { label: "₹25 Lakh – ₹1 Cr", value: "25l-1cr" },
  { label: "₹1 Cr+", value: "1cr+" },
];

const PAYMENT_TERMS = [
  { label: "Advance / Prepaid", value: "advance" },
  { label: "Net 15", value: "net-15" },
  { label: "Net 30", value: "net-30" },
  { label: "Net 45", value: "net-45" },
  { label: "Net 60", value: "net-60" },
  { label: "Letter of Credit", value: "lc" },
];

const COMM_MODES = [
  { label: "Email", value: "email" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Dedicated Account Manager", value: "account-manager" },
  { label: "Supplier Portal", value: "portal" },
  { label: "ERP Integration", value: "erp" },
];

const YES_NO = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
  { label: "Depends on order value", value: "case-by-case" },
];

const VENDOR_SIZES = [
  { label: "Micro (< 10 employees)", value: "micro" },
  { label: "Small (10–50)", value: "small" },
  { label: "Medium (50–250)", value: "medium" },
  { label: "Large (250+)", value: "large" },
  { label: "No preference", value: "any" },
];

const VENDOR_LOCATIONS = [
  { label: "Pan India", value: "pan-india" },
  { label: "Same state preferred", value: "same-state" },
  { label: "Metro cities only", value: "metro" },
  { label: "Specific region (mention in key markets)", value: "specific" },
  { label: "No preference", value: "any" },
];

export const Step4Procurement = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Procurement Preferences</h2>
        <p className="text-gray-500 mt-1 text-sm">
          Define what you need to source and your procurement approach.
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-5">
        <MultiSelect
          name="categoriesNeeded"
          label="Primary Categories Needed"
          options={CATEGORIES}
          max={6}
          required
        />
        <MultiSelect
          name="secondaryCategories"
          label="Secondary / Future Categories"
          options={CATEGORIES}
          max={4}
        />
      </div>

      <Divider label="Vendor Criteria" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          name="procurementVolume"
          label="Estimated Annual Volume"
          placeholder="e.g. 500 MT / 10,000 units / ₹50 Lakh"
        />
        <Select
          name="vendorLocationPreference"
          label="Preferred Vendor Location"
          options={VENDOR_LOCATIONS}
        />
        <Select
          name="preferredVendorSize"
          label="Preferred Vendor Size"
          options={VENDOR_SIZES}
        />
        <Select
          name="minCertificationRequired"
          label="Minimum Certification Required"
          options={CERTIFICATION_REQUIREMENTS}
          required
        />
      </div>

      <Divider label="Order Terms" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Select name="pricingModel" label="Preferred Pricing Model" options={PRICING_MODELS} />
        <Select name="orderFrequency" label="Order Frequency" options={ORDER_FREQUENCY} />
        <Select name="typicalOrderValue" label="Typical Order Value" options={ORDER_VALUES} />
        <Select name="paymentTerms" label="Payment Terms" options={PAYMENT_TERMS} />
        <Select name="communicationMode" label="Preferred Communication" options={COMM_MODES} />
      </div>

      <Divider label="Compliance Requirements" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Select name="siteAuditRequired" label="Site Audit Required" options={YES_NO} />
        <Select name="ndaRequired" label="NDA Required" options={YES_NO} />
        <Select name="multiLocationDelivery" label="Multi-location Delivery" options={YES_NO} />
      </div>
    </div>
  );
};
