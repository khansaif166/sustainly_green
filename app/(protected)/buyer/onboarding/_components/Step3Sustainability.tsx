"use client";

import React from "react";
import { Select, TextArea, MultiSelect } from "./FormFields";

const POLICY_OPTIONS = [
  { label: "Formal policy – published on website", value: "published" },
  { label: "Formal policy – internal only", value: "internal" },
  { label: "In development", value: "in-development" },
  { label: "No formal policy yet", value: "none" },
];

const ESG_OPTIONS = [
  { label: "Yes – published annually", value: "published" },
  { label: "Yes – internal only", value: "internal" },
  { label: "Preparing first report", value: "preparing" },
  { label: "No", value: "no" },
];

const CERTIFICATION_OPTIONS = [
  "ISO 14001",
  "ISO 50001",
  "ISO 26000",
  "GRI Standards",
  "BRSR",
  "SA8000",
  "B Corp Certification",
  "CDP Disclosure",
  "ECOVADIS",
  "Green Building (LEED/IGBC)",
  "Responsible Business Alliance",
  "UN Global Compact",
  "Science Based Targets (SBTi)",
  "SASB Standards",
];

export const Step3Sustainability = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sustainability Commitments</h2>
        <p className="text-gray-500 mt-1 text-sm">
          Share your organization's environmental and social governance standing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Select
          name="sustainabilityPolicy"
          label="Sustainability Policy Status"
          options={POLICY_OPTIONS}
          required
        />
        <Select
          name="esgReport"
          label="ESG Report Published"
          options={ESG_OPTIONS}
          required
        />
      </div>

      <TextArea
        name="sustainabilityDescription"
        label="Describe Your Sustainability Initiatives"
        placeholder="Briefly describe your key environmental, social, or governance initiatives and commitments…"
        rows={4}
      />

      <MultiSelect
        name="certifications"
        label="Certifications / Standards Complied With"
        options={CERTIFICATION_OPTIONS}
        max={8}
      />

      {/* Info card */}
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 text-sm">
          ℹ
        </div>
        <p className="text-sm text-blue-700">
          This information helps Sustainly match you with verified green suppliers and prioritizes 
          vendors who align with your ESG requirements. It will not be publicly displayed without consent.
        </p>
      </div>
    </div>
  );
};
