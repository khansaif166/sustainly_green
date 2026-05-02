"use client";

import React from "react";
import { Input, Select, Divider } from "./FormFields";
import {
  Building, Hash, MapPin, Mail, Phone, User as UserIcon,
  Briefcase, Globe, Link,
} from "lucide-react";

const ORG_TYPES = [
  { label: "Public Limited Company", value: "public-limited" },
  { label: "Private Limited Company", value: "pvt-limited" },
  { label: "LLP", value: "llp" },
  { label: "Proprietorship", value: "proprietorship" },
  { label: "Partnership Firm", value: "partnership" },
  { label: "Government / PSU", value: "govt-psu" },
  { label: "NGO / Trust", value: "ngo-trust" },
  { label: "Cooperative", value: "cooperative" },
  { label: "Other", value: "other" },
];

const STOCK_OPTIONS = [
  { label: "Yes – Listed on NSE/BSE", value: "yes-nse-bse" },
  { label: "Yes – Listed on other exchange", value: "yes-other" },
  { label: "No", value: "no" },
];

export const Step1Identity = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Business Identity</h2>
        <p className="text-gray-500 mt-1 text-sm">
          Provide your organization's official legal and contact details.
        </p>
      </div>

      {/* Legal & Registration */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            name="companyName"
            label="Company Name"
            placeholder="e.g. GreenTech Industries Pvt Ltd"
            icon={Building}
            required
          />
          <Input
            name="brandName"
            label="Brand Name"
            placeholder="e.g. EcoForce (if different)"
            icon={Building}
          />
          <Select
            name="organisationType"
            label="Organisation Type"
            options={ORG_TYPES}
            required
          />
          <Select
            name="stockListed"
            label="Stock Listed"
            options={STOCK_OPTIONS}
            required
          />
          <Input
            name="cinRegistration"
            label="CIN / Registration Number"
            placeholder="e.g. U74999MH2020PTC123456"
            icon={Hash}
            required
          />
          <Input
            name="gstNumber"
            label="GST Number"
            placeholder="e.g. 27AABCU9603R1ZX"
            icon={Hash}
            required
          />
        </div>

        <Divider label="Registered Address" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <Input
              name="registeredAddress"
              label="Street Address"
              placeholder="Building / Street / Area"
              icon={MapPin}
              required
            />
          </div>
          <Input name="city" label="City" placeholder="e.g. Mumbai" required />
          <Input name="state" label="State" placeholder="e.g. Maharashtra" required />
          <Input name="pinCode" label="PIN Code" placeholder="e.g. 400001" required />
          <Input name="country" label="Country" placeholder="e.g. India" required />
        </div>
      </div>

      {/* Primary Contact */}
      <div>
        <Divider label="Primary Contact" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            name="contactPerson"
            label="Contact Person"
            placeholder="Authorized representative"
            icon={UserIcon}
            required
          />
          <Input
            name="designation"
            label="Designation"
            placeholder="e.g. Head of Procurement"
            icon={Briefcase}
            required
          />
          <Input
            name="department"
            label="Department"
            placeholder="e.g. Sustainability, CSR, Procurement"
            icon={Briefcase}
          />
          <Input
            name="email"
            label="Official Email"
            placeholder="name@company.com"
            type="email"
            icon={Mail}
            required
          />
          <Input
            name="mobile"
            label="Mobile Number"
            placeholder="+91 98765 43210"
            icon={Phone}
            required
          />
          <Input
            name="alternatePhone"
            label="Alternate Phone"
            placeholder="Secondary contact number"
            icon={Phone}
          />
          <Input
            name="linkedin"
            label="LinkedIn Profile"
            placeholder="linkedin.com/in/…"
            icon={Link}
          />
          <Input
            name="website"
            label="Company Website"
            placeholder="https://yourcompany.com"
            icon={Globe}
          />
        </div>
      </div>
    </div>
  );
};
