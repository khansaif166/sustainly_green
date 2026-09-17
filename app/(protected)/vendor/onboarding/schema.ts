import { z } from "zod";

/**
 * Fields marked optional below are not necessarily optional by intent — many are
 * hidden by SHOW_FULL_ONBOARDING in onboardingConfig.ts. A hidden field with a
 * .min(1) validator would block submission with an error the vendor cannot see
 * or fix, so the validator is relaxed rather than the field removed.
 *
 * Still mandatory: the fields the marketplace actually renders, plus the
 * declaration. companyName, city and state feed the vendor page title;
 * shortDescription gates indexability via isCompleteVendor().
 */
export const onboardingSchema = z.object({
  // STEP 1: IDENTITY & CONTACT
  companyName: z.string().min(1, "Company Name is required"),
  logoFile: z.any().optional(),
  registrationType: z.string().optional(),
  cinRegistration: z.string().optional(),
  gstNumber: z.string().optional(),
  yearOfIncorporation: z.string().optional(),
  registeredAddress: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pinCode: z.string().optional(),
  country: z.string().optional(),
  primaryContactName: z.string().optional(),
  designation: z.string().optional(),
  businessEmail: z.string().email("Invalid email"),
  whatsapp: z.string().min(1, "Mobile is required"),
  alternatePhone: z.string().optional(),

  // STEP 2: BUSINESS OVERVIEW
  businessType: z.string().optional(),
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
  // Certification is optional for now — vendors without one yet shouldn't be
  // blocked from completing onboarding. Revisit once Green Lens verification
  // can handle "no certification yet" as its own review state.
  primarySustainabilityCert: z.string().optional(),
  issuingBody: z.string().optional(),
  certificateFile: z.any().optional(), // Handled separately for upload
  additionalCerts: z.array(z.object({
    name: z.string(),
    id: z.string(),
    expiry: z.string()
  })).optional(),
  sustainabilityPractice: z.string().optional(),
  recycledContent: z.string().optional(),
  carbonFootprint: z.string().optional(),
  eprRegistration: z.string().optional(),
  socialCompliance: z.string().optional(),
  netZeroCommitment: z.string().optional(),

  // STEP 4: MARKETPLACE + DECLARATION
  listingTier: z.string().optional(),
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
