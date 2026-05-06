"use client";

import React from "react";
import { Input, Select, FileUpload } from "./FormFields";
import { useFormContext } from "react-hook-form";
import { Building, Hash, Calendar, MapPin, Mail, Phone, User as UserIcon, Briefcase, Image } from "lucide-react";

export const Step1Identity = () => {
  const { watch } = useFormContext();
  const currentLogoUrl = watch("logoUrl");
  const newLogoFile = watch("logoFile");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Identity & Legal</h2>
        <p className="text-gray-500 mt-1">Please provide your company details as per official records.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <FileUpload name="logoFile" label="Company Logo" />
          {currentLogoUrl && !newLogoFile && (
            <div className="mt-2 flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100 w-fit">
              <img src={currentLogoUrl} className="w-8 h-8 rounded object-cover border border-gray-200" alt="Current Logo" />
              <span className="text-xs text-gray-500 font-medium italic">Current Logo</span>
            </div>
          )}
        </div>
        <Input 
          name="companyName" 
          label="Company / Brand Name *" 
          placeholder="e.g. Ecobuild Solutions Pvt Ltd" 
          icon={Building} 
        />
        <Select 
          name="registrationType" 
          label="Registration Type *" 
          options={[
            { label: "Pvt Ltd", value: "pvt-ltd" },
            { label: "LLP", value: "llp" },
            { label: "Proprietorship", value: "proprietorship" },
            { label: "Partnership", value: "partnership" },
          ]} 
        />
        <Input 
          name="cinRegistration" 
          label="CIN / Registration Number *" 
          placeholder="e.g. U74999MH2020PTC123456" 
          icon={Hash} 
        />
        <Input 
          name="gstNumber" 
          label="GST Number *" 
          placeholder="e.g. 27AABCU9603R1ZX" 
          icon={Hash} 
        />
        <Input 
          name="yearOfIncorporation" 
          label="Year of Incorporation *" 
          placeholder="e.g. 2018" 
          type="number"
          icon={Calendar} 
        />
        <div className="md:col-span-2">
          <Input 
            name="registeredAddress" 
            label="Registered Address *" 
            placeholder="Street / Building Name" 
            icon={MapPin} 
          />
        </div>
        <Input name="city" label="City *" placeholder="e.g. Mumbai" />
        <Input name="state" label="State *" placeholder="e.g. Maharashtra" />
        <Input name="pinCode" label="PIN Code *" placeholder="e.g. 400001" />
        <Input name="country" label="Country *" placeholder="e.g. India" />
      </div>

      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Primary Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            name="primaryContactName" 
            label="Contact Person Name *" 
            placeholder="Authorized representative" 
            icon={UserIcon} 
          />
          <Input 
            name="designation" 
            label="Designation *" 
            placeholder="e.g. Managing Director" 
            icon={Briefcase} 
          />
          <Input 
            name="businessEmail" 
            label="Business Email *" 
            placeholder="Official email address" 
            type="email"
            icon={Mail} 
          />
          <Input 
            name="whatsapp" 
            label="WhatsApp / Mobile *" 
            placeholder="+91 98765 43210" 
            icon={Phone} 
          />
          <Input 
            name="alternatePhone" 
            label="Alternate Phone" 
            placeholder="Secondary number" 
            icon={Phone} 
          />
        </div>
      </div>
    </div>
  );
};
