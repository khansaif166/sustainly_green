"use client";

import React from "react";
import { Input, Select, Toggle, FileUpload, MultiSelect } from "./FormFields";
import { useFormContext } from "react-hook-form";
import { ChevronDown, ChevronUp, ScrollText } from "lucide-react";

export const Step4Marketplace = () => {
  const { register, formState: { errors } } = useFormContext();
  const [showEcoScore, setShowEcoScore] = React.useState(false);
  const [showMarketplace, setShowMarketplace] = React.useState(true);

  const errorDeclaration = errors.declarationAgreed?.message as string;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Marketplace Preferences (Collapsible) */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <button 
          type="button"
          onClick={() => setShowMarketplace(!showMarketplace)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <div>
            <h3 className="font-bold text-gray-900">Marketplace Preferences</h3>
            <p className="text-xs text-gray-500">Optional configuration for your store</p>
          </div>
          {showMarketplace ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        {showMarketplace && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white animate-in slide-in-from-top-2 duration-300">
            <Select 
              name="listingTier" 
              label="Listing Tier Subscription *" 
              options={[
                { label: "Starter", value: "starter" },
                { label: "Grow", value: "grow" },
                { label: "Pro", value: "pro" },
              ]} 
            />
            <Input name="lookingForBuyersIn" label="Looking for Buyers In" placeholder="e.g. B2B Corporate" />
            <Input name="paymentTerms" label="Payment Terms" placeholder="e.g. Advance, 30 days" />
            <Input name="language" label="Language of Communication" placeholder="English, Hindi, etc." />
            <Toggle name="willingnessToOfferSamples" label="Willing to offer samples?" />
            <FileUpload name="awardsFile" label="Upload Awards / Recognitions" />
          </div>
        )}
      </div>

      {/* Eco Score Self-Declaration (Optional/Collapsible) */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <button 
          type="button"
          onClick={() => setShowEcoScore(!showEcoScore)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <div>
            <h3 className="font-bold text-gray-900">Eco Score Self-Declaration</h3>
            <p className="text-xs text-gray-500">Optional details to boost your score</p>
          </div>
          {showEcoScore ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        {showEcoScore && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white animate-in slide-in-from-top-2 duration-300">
            <Input name="lifecycleStage" label="Product Lifecycle Stage" placeholder="e.g. Raw Material" />
            <Input name="packaging" label="Packaging - Recyclable?" placeholder="Yes/Partial/No" />
            <Input name="energySource" label="Energy Source" placeholder="Solar, Wind, Grid" />
            <Input name="waterRecycling" label="Water Recycling" placeholder="Yes/No" />
            <MultiSelect name="sdgAlignment" label="SDG Alignment" options={["SDG 7", "SDG 12", "SDG 13"]} />
            <Input name="auditFrequency" label="Audit Frequency" placeholder="Annual, Biennial" />
          </div>
        )}
      </div>

      {/* Declaration */}
      <div className="p-6 bg-green-50/50 border border-green-100 rounded-2xl space-y-6">
        <div className="flex gap-4">
          <div className="mt-1 text-green-600"><ScrollText size={24} /></div>
          <div>
            <h3 className="font-bold text-gray-900 uppercase tracking-tight">Declaration & Submission</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              I hereby declare that all information provided above is true and accurate. I authorize Sustainly Ecohub India Pvt Ltd to verify my credentials and list my company on the marketplace subject to approval.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                {...register("declarationAgreed")} 
                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 bg-white checked:border-green-600 checked:bg-green-600 transition-all" 
              />
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              </div>
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              I agree to the terms and conditions mentioned above *
            </span>
          </label>
          {errorDeclaration && <p className="text-xs text-red-500 ml-8">{errorDeclaration}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-green-100">
          <Input name="declarationName" label="Authorized Signatory Name *" placeholder="Type full name to sign" />
          <Input name="declarationDate" label="Date *" type="date" />
        </div>
      </div>
    </div>
  );
};
