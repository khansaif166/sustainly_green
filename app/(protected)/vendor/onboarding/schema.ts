import { z } from "zod";

export const onboardingSchema = z.object({
  // STEP 1: IDENTITY & CONTACT
  companyName: z.string().min(1, "Company Name is required"),
  logoFile: z.any().optional(),
  registrationType: z.string().min(1, "Registration Type is required"),
  cinRegistration: z.string().min(1, "CIN is required"),
  gstNumber: z.string().min(1, "GST is required"),
  yearOfIncorporation: z.string().min(1, "Year is required"),
  registeredAddress: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pinCode: z.string().min(1, "PIN is required"),
  country: z.string().min(1, "Country is required"),
  primaryContactName: z.string().min(1, "Contact Name is required"),
  designation: z.string().min(1, "Designation is required"),
  businessEmail: z.string().email("Invalid email"),
  whatsapp: z.string().min(1, "Mobile is required"),
  alternatePhone: z.string().optional(),

  // STEP 2: BUSINESS OVERVIEW
  businessType: z.string().min(1, "Business Type is required"),
  primaryCategory: z.string().min(1, "Category is required"),
  subCategories: z.array(z.string()).max(3, "Max 3 subcategories"),
  shortDescription: z.string().min(1, "Description is required"),
  keyProducts: z.array(z.string()).max(5, "Max 5 key products"),
  targetIndustries: z.string().optional(),
  preferredBuyerGeography: z.string().optional(),
  supplyCapacity: z.string().optional(),
  moq: z.string().optional(),
  exportCapability: z.boolean(),
  exportMarkets: z.string().optional(),

  // STEP 3: SUSTAINABILITY
  primarySustainabilityCert: z.string().min(1, "Certification is required"),
  issuingBody: z.string().min(1, "Certifying Body is required"),
  certificateFile: z.any().optional(), // Handled separately for upload
  additionalCerts: z.array(z.object({
    name: z.string(),
    id: z.string(),
    expiry: z.string()
  })).optional(),
  sustainabilityPractice: z.string().min(1, "Sustainability Description is required"),
  recycledContent: z.string().optional(),
  carbonFootprint: z.string().optional(),
  eprRegistration: z.string().optional(),
  socialCompliance: z.string().optional(),
  netZeroCommitment: z.string().optional(),

  // STEP 4: MARKETPLACE + DECLARATION
  listingTier: z.string().min(1, "Listing Tier is required"),
  caseStudies: z.string().optional(),
  awards: z.string().optional(),
  awardsFile: z.any().optional(),
  lookingForBuyersIn: z.string().optional(),
  willingnessToOfferSamples: z.boolean(),
  paymentTerms: z.string().optional(),
  language: z.string().optional(),

  // ECO SCORE (Optional)
  lifecycleStage: z.string().optional(),
  packaging: z.string().optional(),
  energySource: z.string().optional(),
  waterRecycling: z.string().optional(),
  wasteReduction: z.string().optional(),
  sdgAlignment: z.array(z.string()).optional(),
  auditFrequency: z.string().optional(),
  certifyingBody: z.string().optional(),
  ghgScope1: z.string().optional(),
  ghgScope2: z.string().optional(),
  ghgScope3: z.string().optional(),

  // DECLARATION
  declarationAgreed: z.boolean().refine((val) => val === true, {
    message: "You must agree to the declaration",
  }),
  declarationName: z.string().min(1, "Name is required"),
  declarationDate: z.string().min(1, "Date is required"),
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
