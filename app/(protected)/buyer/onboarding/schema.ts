import { z } from "zod";

// ─── STEP 1: BUSINESS IDENTITY ────────────────────────────────────────────────
const step1Schema = z.object({
  companyName: z.string().min(1, "Company Name is required"),
  brandName: z.string().optional(),
  organisationType: z.string().min(1, "Organisation Type is required"),
  stockListed: z.string().min(1, "Please select an option"),
  cinRegistration: z.string().min(1, "CIN is required"),
  gstNumber: z.string().min(1, "GST Number is required"),
  registeredAddress: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pinCode: z.string().min(1, "PIN Code is required"),
  country: z.string().min(1, "Country is required"),
  contactPerson: z.string().min(1, "Contact Person is required"),
  designation: z.string().min(1, "Designation is required"),
  department: z.string().optional(),
  email: z.string().email("Invalid email address"),
  mobile: z.string().min(1, "Mobile number is required"),
  alternatePhone: z.string().optional(),
  linkedin: z.string().optional(),
  website: z.string().optional(),
});

// ─── STEP 2: BUSINESS OVERVIEW ────────────────────────────────────────────────
const step2Schema = z.object({
  buyerSegment: z.string().min(1, "Buyer Segment is required"),
  industry: z.string().min(1, "Industry is required"),
  secondaryIndustry: z.string().optional(),
  noOfEmployees: z.string().min(1, "Employee count is required"),
  annualRevenue: z.string().min(1, "Revenue range is required"),
  noOfLocations: z.string().optional(),
  procurementBudget: z.string().optional(),
  geographyOfOperation: z.string().min(1, "Geography is required"),
  keyMarkets: z.array(z.string()).optional(),
});

// ─── STEP 3: SUSTAINABILITY ───────────────────────────────────────────────────
const step3Schema = z.object({
  sustainabilityPolicy: z.string().min(1, "Sustainability Policy is required"),
  esgReport: z.string().min(1, "ESG Report status is required"),
  sustainabilityDescription: z.string().optional(),
  certifications: z.array(z.string()).optional(),
});

// ─── STEP 4: PROCUREMENT ─────────────────────────────────────────────────────
const step4Schema = z.object({
  categoriesNeeded: z.array(z.string()).min(1, "At least one category is required"),
  secondaryCategories: z.array(z.string()).optional(),
  procurementVolume: z.string().optional(),
  vendorLocationPreference: z.string().optional(),
  preferredVendorSize: z.string().optional(),
  minCertificationRequired: z.string().min(1, "Minimum certification is required"),
  pricingModel: z.string().optional(),
  orderFrequency: z.string().optional(),
  typicalOrderValue: z.string().optional(),
  paymentTerms: z.string().optional(),
  communicationMode: z.string().optional(),
  siteAuditRequired: z.string().optional(),
  ndaRequired: z.string().optional(),
  multiLocationDelivery: z.string().optional(),
});

// ─── STEP 5: SEGMENT DETAILS (CONDITIONAL) ───────────────────────────────────
const step5Schema = z.object({
  // Corporate / Listed
  stockSymbol: z.string().optional(),
  sustainabilityCommittee: z.string().optional(),
  brsrCompliance: z.string().optional(),
  vendorDiversityPolicy: z.string().optional(),
  vendorCode: z.string().optional(),
  esgScore: z.string().optional(),
  sustainabilityIndex: z.string().optional(),
  csrSpend: z.string().optional(),

  // MSME
  udyamNumber: z.string().optional(),
  msmeCategory: z.string().optional(),
  reasonForSustainableSourcing: z.string().optional(),
  budgetSensitivity: z.string().optional(),
  premiumWillingness: z.string().optional(),
  sourcingType: z.string().optional(),
  groupBuyingInterest: z.string().optional(),
  tradeAssociation: z.string().optional(),

  // Distributor
  coverageArea: z.string().optional(),
  noOfRetailOutlets: z.string().optional(),
  monthlyVolume: z.string().optional(),
  coldChainCapability: z.string().optional(),
  existingBrands: z.array(z.string()).optional(),
  exclusiveInterest: z.string().optional(),
  trackRecord: z.string().optional(),
  creditTermsPreferred: z.string().optional(),

  // Retailer
  retailFormat: z.string().optional(),
  storeOrSkuCount: z.string().optional(),
  monthlyOrders: z.string().optional(),
  platformPresence: z.array(z.string()).optional(),

  // Declaration
  declarationAgreed: z.boolean().refine((val) => val === true, {
    message: "You must agree to the declaration",
  }),
  declarationName: z.string().min(1, "Name is required"),
  declarationDesignation: z.string().optional(),
  declarationDate: z.string().min(1, "Date is required"),
});

// ─── COMBINED SCHEMA ──────────────────────────────────────────────────────────
export const buyerOnboardingSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)
  .merge(step5Schema);

export type BuyerOnboardingFormData = z.infer<typeof buyerOnboardingSchema>;

// ─── STEP FIELD MAPS (for validation) ─────────────────────────────────────────
export const STEP1_FIELDS = [
  "companyName", "organisationType", "stockListed", "cinRegistration",
  "gstNumber", "registeredAddress", "city", "state", "pinCode", "country",
  "contactPerson", "designation", "email", "mobile",
] as const;

export const STEP2_FIELDS = [
  "buyerSegment", "industry", "noOfEmployees", "annualRevenue", "geographyOfOperation",
] as const;

export const STEP3_FIELDS = [
  "sustainabilityPolicy", "esgReport",
] as const;

export const STEP4_FIELDS = [
  "categoriesNeeded", "minCertificationRequired",
] as const;

export const STEP5_FIELDS = [
  "declarationAgreed", "declarationName", "declarationDate",
] as const;
