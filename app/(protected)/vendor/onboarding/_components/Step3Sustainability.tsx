"use client";

import React from "react";
import { Select, TextArea, FileUpload, Input } from "./FormFields";
import { ShieldCheck, Info } from "lucide-react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function supabaseOptions(table: "certifications" | "certifying_bodies") {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

  const params = new URLSearchParams({
    select: "id,name",
    status: "eq.Active",
    order: "name.asc",
  });

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!response.ok) return [];

  const rows = (await response.json()) as Array<{ id: string; name: string }>;
  return rows.map((row) => ({ label: row.name, value: row.id }));
}

export const Step3Sustainability = () => {
  const [certs, setCerts] = React.useState<{label: string, value: string}[]>([]);
  const [bodies, setBodies] = React.useState<{label: string, value: string}[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [certRows, bodyRows] = await Promise.all([
          supabaseOptions("certifications"),
          supabaseOptions("certifying_bodies"),
        ]);

        setCerts(certRows);
        setBodies(bodyRows);
      } catch (error) {
        console.error("Error loading master data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadMasterData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start gap-4 p-4 bg-orange-50 border border-orange-100 rounded-2xl">
        <div className="mt-1 text-orange-500"><Info size={20} /></div>
        <div>
          <h4 className="text-sm font-bold text-orange-900">Green Lens Verification</h4>
          <p className="text-xs text-orange-700 mt-1 leading-relaxed">
            All certifications will be verified by our Green Lens Framework. Providing accurate data speeds up your profile approval process.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Select 
            name="primarySustainabilityCert" 
            label="Primary Sustainability Certification *" 
            options={certs}
            disabled={loading}
            icon={ShieldCheck}
          />
        </div>
        <Select 
          name="issuingBody" 
          label="Issuing / Certifying Body *" 
          options={bodies}
          disabled={loading}
        />
        <FileUpload name="certificateFile" label="Upload Primary Certificate *" />

        <div className="md:col-span-2">
          <TextArea 
            name="sustainabilityPractice" 
            label="Sustainability Practice Description *" 
            placeholder="How does your business actively reduce environmental impact?" 
            rows={4}
          />
        </div>

        <Input name="recycledContent" label="Recycled / Renewable Content %" placeholder="e.g. 80%" />
        <Input name="carbonFootprint" label="Carbon Footprint Data" placeholder="kg CO2e per unit" />
        <Input name="eprRegistration" label="EPR Registration (if applicable)" placeholder="EPR Reg. No." />
        <Select 
          name="socialCompliance" 
          label="Social Compliance" 
          options={[
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
            { label: "In Progress", value: "in-progress" },
          ]} 
        />
        <div className="md:col-span-2">
          <Input name="netZeroCommitment" label="Net Zero / Carbon Neutral Commitment" placeholder="Target year + verification body" />
        </div>
      </div>
    </div>
  );
};
