"use client";

import React from "react";
import { Select, TextArea, FileUpload, Input } from "./FormFields";
import { ShieldCheck, Info } from "lucide-react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/* ── Hardcoded fallback lists ── */
const FALLBACK_CERTS: { label: string; value: string }[] = [
  // Indian national standards
  { label: "BIS (Bureau of Indian Standards)", value: "BIS" },
  { label: "India Organic (APEDA)", value: "INDIA_ORGANIC" },
  { label: "GRIHA – Green Rating for Integrated Habitat Assessment", value: "GRIHA" },
  { label: "GreenPro (CII-Indian Green Building Council)", value: "GREENPRO" },
  { label: "IGBC – Indian Green Building Council Rating", value: "IGBC" },
  { label: "BRSR – Business Responsibility & Sustainability Reporting", value: "BRSR" },
  { label: "EPR Registration (Extended Producer Responsibility)", value: "EPR" },
  // ISO standards
  { label: "ISO 14001 – Environmental Management System", value: "ISO_14001" },
  { label: "ISO 50001 – Energy Management System", value: "ISO_50001" },
  { label: "ISO 26000 – Social Responsibility Guidance", value: "ISO_26000" },
  { label: "ISO 45001 – Occupational Health & Safety", value: "ISO_45001" },
  { label: "ISO 9001 – Quality Management System", value: "ISO_9001" },
  { label: "ISO 20400 – Sustainable Procurement", value: "ISO_20400" },
  // Global sustainability certifications
  { label: "FSC – Forest Stewardship Council", value: "FSC" },
  { label: "PEFC – Programme for Endorsement of Forest Certification", value: "PEFC" },
  { label: "OEKO-TEX Standard 100", value: "OEKO_TEX_100" },
  { label: "GOTS – Global Organic Textile Standard", value: "GOTS" },
  { label: "GRS – Global Recycle Standard", value: "GRS" },
  { label: "Bluesign", value: "BLUESIGN" },
  { label: "Fair Trade Certified", value: "FAIR_TRADE" },
  { label: "Rainforest Alliance Certified", value: "RAINFOREST_ALLIANCE" },
  { label: "RSPO – Roundtable on Sustainable Palm Oil", value: "RSPO" },
  { label: "B Corp Certification", value: "B_CORP" },
  { label: "Cradle to Cradle (C2C)", value: "C2C" },
  { label: "Carbon Neutral Certified", value: "CARBON_NEUTRAL" },
  { label: "Science Based Targets (SBTi)", value: "SBTI" },
  { label: "LEED – Leadership in Energy & Environmental Design", value: "LEED" },
  { label: "Energy Star", value: "ENERGY_STAR" },
  { label: "EU Ecolabel", value: "EU_ECOLABEL" },
  { label: "Nordic Swan Ecolabel", value: "NORDIC_SWAN" },
  { label: "EPD – Environmental Product Declaration", value: "EPD" },
  { label: "SA8000 – Social Accountability", value: "SA8000" },
  { label: "SEDEX / SMETA Audit", value: "SEDEX" },
  { label: "REACH Compliance (EU)", value: "REACH" },
  { label: "RoHS Compliance", value: "ROHS" },
  { label: "Zero Waste Certified", value: "ZERO_WASTE" },
  { label: "Responsible Jewellery Council (RJC)", value: "RJC" },
  { label: "STeP by OEKO-TEX", value: "STEP_OEKO_TEX" },
  { label: "TCO Certified", value: "TCO" },
  { label: "UL Environment Certified", value: "UL_ENV" },
  { label: "Other / Proprietary Certification", value: "OTHER" },
];

const FALLBACK_BODIES: { label: string; value: string }[] = [
  // Indian bodies
  { label: "Bureau of Indian Standards (BIS)", value: "BIS_BODY" },
  { label: "Quality Council of India (QCI)", value: "QCI" },
  { label: "NABCB – National Accreditation Board for Certification Bodies", value: "NABCB" },
  { label: "APEDA – Agricultural & Processed Food Products Export Development Authority", value: "APEDA" },
  { label: "CII – Confederation of Indian Industry", value: "CII" },
  { label: "TERI – The Energy and Resources Institute", value: "TERI" },
  // Global certification & audit bodies
  { label: "Bureau Veritas", value: "BUREAU_VERITAS" },
  { label: "TÜV SÜD", value: "TUV_SUD" },
  { label: "TÜV Rheinland", value: "TUV_RHEINLAND" },
  { label: "SGS Group", value: "SGS" },
  { label: "Intertek", value: "INTERTEK" },
  { label: "DNV (Det Norske Veritas)", value: "DNV" },
  { label: "Lloyd's Register", value: "LLOYDS" },
  { label: "LRQA (Lloyd's Register Quality Assurance)", value: "LRQA" },
  { label: "NSF International", value: "NSF" },
  { label: "UL (Underwriters Laboratories)", value: "UL" },
  { label: "Control Union", value: "CONTROL_UNION" },
  { label: "IMO – Institut für Marktökologie", value: "IMO" },
  { label: "BSI Group", value: "BSI" },
  { label: "ISOQAR", value: "ISOQAR" },
  // Standards bodies
  { label: "Forest Stewardship Council (FSC)", value: "FSC_BODY" },
  { label: "Rainforest Alliance", value: "RA_BODY" },
  { label: "Fair Trade USA", value: "FAIR_TRADE_USA" },
  { label: "Fair Trade International (FLO)", value: "FLO" },
  { label: "OEKO-TEX Association", value: "OEKO_TEX_BODY" },
  { label: "Textile Exchange", value: "TEXTILE_EXCHANGE" },
  { label: "B Lab (B Corp)", value: "B_LAB" },
  { label: "GBCI – Green Business Certification Inc. (LEED)", value: "GBCI" },
  // Big-4 / assurance firms
  { label: "KPMG", value: "KPMG" },
  { label: "Deloitte", value: "DELOITTE" },
  { label: "EY (Ernst & Young)", value: "EY" },
  { label: "PwC", value: "PWC" },
  { label: "Other / Self-certified", value: "OTHER_BODY" },
];

async function supabaseOptions(table: "certifications" | "certifying_bodies") {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

  const params = new URLSearchParams({
    select: "id,name",
    status: "eq.Active",
    order: "name.asc",
  });

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) return [];

    const rows = (await response.json()) as Array<{ id: string; name: string }>;
    return rows.map((row) => ({ label: row.name, value: row.id }));
  } catch {
    return [];
  }
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

        setCerts(certRows.length > 0 ? certRows : FALLBACK_CERTS);
        setBodies(bodyRows.length > 0 ? bodyRows : FALLBACK_BODIES);
      } catch (error) {
        setCerts(FALLBACK_CERTS);
        setBodies(FALLBACK_BODIES);
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
