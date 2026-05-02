"use client";

import React from "react";
import { Input, Select, MultiSelect, Divider } from "./FormFields";
import { Users, TrendingUp, MapPin, BarChart3 } from "lucide-react";

const BUYER_SEGMENTS = [
  { label: "Corporate / Listed Company", value: "corporate" },
  { label: "MSME", value: "msme" },
  { label: "Distributor", value: "distributor" },
  { label: "Retailer", value: "retailer" },
];

const INDUSTRIES = [
  { label: "Manufacturing", value: "manufacturing" },
  { label: "IT / Software", value: "it-software" },
  { label: "FMCG / Consumer Goods", value: "fmcg" },
  { label: "Pharmaceuticals", value: "pharma" },
  { label: "Construction / Real Estate", value: "construction" },
  { label: "Food & Beverage", value: "food-beverage" },
  { label: "Retail", value: "retail" },
  { label: "Logistics / Supply Chain", value: "logistics" },
  { label: "Education", value: "education" },
  { label: "Healthcare", value: "healthcare" },
  { label: "Energy / Power", value: "energy" },
  { label: "Finance / Banking", value: "finance" },
  { label: "Government / PSU", value: "govt" },
  { label: "Other", value: "other" },
];

const EMPLOYEE_RANGES = [
  { label: "1–10", value: "1-10" },
  { label: "11–50", value: "11-50" },
  { label: "51–200", value: "51-200" },
  { label: "201–500", value: "201-500" },
  { label: "501–1000", value: "501-1000" },
  { label: "1001–5000", value: "1001-5000" },
  { label: "5000+", value: "5000+" },
];

const REVENUE_RANGES = [
  { label: "Under ₹1 Cr", value: "under-1cr" },
  { label: "₹1–5 Cr", value: "1-5cr" },
  { label: "₹5–25 Cr", value: "5-25cr" },
  { label: "₹25–100 Cr", value: "25-100cr" },
  { label: "₹100–500 Cr", value: "100-500cr" },
  { label: "₹500 Cr – ₹1000 Cr", value: "500-1000cr" },
  { label: "₹1000 Cr+", value: "1000cr+" },
];

const PROCUREMENT_BUDGETS = [
  { label: "Under ₹10 Lakh / year", value: "under-10l" },
  { label: "₹10–50 Lakh / year", value: "10-50l" },
  { label: "₹50 Lakh – ₹1 Cr / year", value: "50l-1cr" },
  { label: "₹1–5 Cr / year", value: "1-5cr-pa" },
  { label: "₹5 Cr+ / year", value: "5cr+" },
];

const GEOGRAPHIES = [
  { label: "Pan India", value: "pan-india" },
  { label: "North India", value: "north" },
  { label: "South India", value: "south" },
  { label: "East India", value: "east" },
  { label: "West India", value: "west" },
  { label: "Tier 1 Cities Only", value: "tier1" },
  { label: "Tier 2 & 3 Cities", value: "tier2-3" },
  { label: "South Asia (SAARC)", value: "saarc" },
  { label: "Global", value: "global" },
];

const KEY_MARKETS_OPTIONS = [
  "Mumbai", "Delhi", "Bengaluru", "Chennai", "Hyderabad",
  "Pune", "Ahmedabad", "Kolkata", "Jaipur", "Surat",
  "Export", "MENA", "SEA", "Europe", "USA",
];

export const Step2Overview = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Business Overview</h2>
        <p className="text-gray-500 mt-1 text-sm">
          Tell us about your organization's scale, segment, and procurement geography.
        </p>
      </div>

      {/* Segment — highlighted as most important */}
      <div className="p-4 bg-green-50 border border-green-100 rounded-2xl">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">
          ⭐ Buyer Segment — This controls your Step 5 fields
        </p>
        <Select
          name="buyerSegment"
          label="Buyer Segment"
          options={BUYER_SEGMENTS}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Select name="industry" label="Primary Industry" options={INDUSTRIES} required />
        <Select name="secondaryIndustry" label="Secondary Industry" options={INDUSTRIES} />
        <Select name="noOfEmployees" label="Total Employees" options={EMPLOYEE_RANGES} icon={Users} required />
        <Select name="annualRevenue" label="Annual Revenue" options={REVENUE_RANGES} icon={TrendingUp} required />
        <Input
          name="noOfLocations"
          label="No. of Operational Locations"
          placeholder="e.g. 5"
        />
        <Select name="procurementBudget" label="Sustainability Procurement Budget" options={PROCUREMENT_BUDGETS} icon={BarChart3} />
      </div>

      <Divider label="Geography" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Select
          name="geographyOfOperation"
          label="Geography of Operation"
          options={GEOGRAPHIES}
          icon={MapPin}
          required
        />
        <MultiSelect
          name="keyMarkets"
          label="Key Markets / Cities"
          options={KEY_MARKETS_OPTIONS}
          max={8}
        />
      </div>
    </div>
  );
};
