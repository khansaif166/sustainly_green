"use client";

import React from "react";
import { Input, Select, MultiSelect, TextArea, Toggle } from "./FormFields";
import { useFormContext } from "react-hook-form";

type CategoryOption = { id: string; name: string };
type SubcategoryOption = { id: string; name: string; categoryId: string };

type Step2BusinessProps = {
  categories?: CategoryOption[];
  subcategories?: SubcategoryOption[];
};

export const Step2Business = ({ categories = [], subcategories = [] }: Step2BusinessProps) => {
  const { watch, setValue } = useFormContext();
  const exportEnabled = watch("exportCapability");
  const primaryCategory = watch("primaryCategory");
  const selectedCategory = categories.find((category) => category.name === primaryCategory || category.id === primaryCategory);
  const mappedSubcategories = selectedCategory
    ? subcategories.filter((item) => item.categoryId === selectedCategory.id)
    : [];
  const subcategoryOptions = (mappedSubcategories.length > 0 ? mappedSubcategories : subcategories)
    .map((item) => item.name);

  React.useEffect(() => {
    const selected = watch("subCategories") || [];
    if (!selectedCategory || !Array.isArray(selected) || selected.length === 0) return;

    const allowed = new Set(subcategoryOptions);
    const next = selected.filter((item) => allowed.has(item));
    if (next.length !== selected.length) {
      setValue("subCategories", next, { shouldDirty: true, shouldValidate: true });
    }
  }, [primaryCategory, selectedCategory, setValue, subcategoryOptions, watch]);

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
        {categories.length > 0 ? (
          <Select
            name="primaryCategory"
            label="Primary Category *"
            options={categories.map((category) => ({ label: category.name, value: category.name }))}
          />
        ) : (
          <Input
            name="primaryCategory"
            label="Primary Category *"
            placeholder="e.g. Renewable Energy"
          />
        )}
        
        <MultiSelect 
          name="subCategories" 
          label="Sub Categories" 
          options={subcategoryOptions}
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
