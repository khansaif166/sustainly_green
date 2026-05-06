"use client";

import React from "react";
import { Input, Select, MultiSelect, TextArea, Toggle } from "./FormFields";
import { useFormContext } from "react-hook-form";

export const Step2Business = () => {
  const { watch } = useFormContext();
  const exportEnabled = watch("exportCapability");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Business Overview</h2>
        <p className="text-gray-500 mt-1">Tell us more about what your business does and its scale.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select 
          name="businessType" 
          label="Business Type *" 
          options={[
            { label: "Manufacturer", value: "manufacturer" },
            { label: "Trader", value: "trader" },
            { label: "Exporter", value: "exporter" },
            { label: "Service Provider", value: "service-provider" },
            { label: "Distributor", value: "distributor" },
          ]} 
        />
        <Input 
          name="primaryCategory" 
          label="Primary Category *" 
          placeholder="e.g. Renewable Energy" 
        />
        
        <MultiSelect 
          name="subCategories" 
          label="Sub Categories" 
          max={3}
        />

        <div className="md:col-span-2">
          <TextArea 
            name="shortDescription" 
            label="Company Description *" 
            placeholder="A brief summary of your business (2-3 lines)" 
            rows={3}
          />
        </div>

        <MultiSelect 
          name="keyProducts" 
          label="Key Products / Services *" 
          max={5}
        />

        <Input 
          name="targetIndustries" 
          label="Target Industries" 
          placeholder="e.g. FMCG, IT, Hospitality" 
        />

        <Input name="supplyCapacity" label="Supply Capacity" placeholder="e.g. 5,000 units/month" />
        <Input name="moq" label="Minimum Order Quantity (MOQ)" placeholder="e.g. 100 units" />

        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <Toggle name="exportCapability" label="Do you have export capability?" />
          {exportEnabled && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <Input name="exportMarkets" label="Target Export Markets" placeholder="e.g. UAE, UK, USA" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
