"use client";

import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { getStoredSession } from "@/lib/supabaseAuth";
import {
  buyerOnboardingSchema,
  BuyerOnboardingFormData,
  STEP1_FIELDS,
  STEP2_FIELDS,
  STEP3_FIELDS,
  STEP4_FIELDS,
  STEP5_FIELDS,
} from "./schema";
import { Stepper } from "./_components/Stepper";
import { Step1Identity } from "./_components/Step1Identity";
import { Step2Overview } from "./_components/Step2Overview";
import { Step3Sustainability } from "./_components/Step3Sustainability";
import { Step4Procurement } from "./_components/Step4Procurement";
import { Step5SegmentAndSubmit } from "./_components/Step5SegmentAndSubmit";
import { ChevronLeft, ChevronRight, Check, Save } from "lucide-react";

const TOTAL_STEPS = 5;

const STEP_FIELDS: Record<number, readonly string[]> = {
  1: STEP1_FIELDS,
  2: STEP2_FIELDS,
  3: STEP3_FIELDS,
  4: STEP4_FIELDS,
  5: STEP5_FIELDS,
};

function clean<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [
        k,
        v !== null && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)
          ? clean(v as object)
          : v,
      ])
  ) as Partial<T>;
}

function buildBuyerPayload(data: Partial<BuyerOnboardingFormData>, status: "draft" | "submitted") {
  const { declarationAgreed, ...rest } = data;

  return clean({
    companyInfo: {
      companyName: rest.companyName,
      brandName: rest.brandName,
      organisationType: rest.organisationType,
      stockListed: rest.stockListed,
      cinRegistration: rest.cinRegistration,
      gstNumber: rest.gstNumber,
      registeredAddress: rest.registeredAddress,
      city: rest.city,
      state: rest.state,
      pinCode: rest.pinCode,
      country: rest.country,
      contactPerson: rest.contactPerson,
      designation: rest.designation,
      department: rest.department,
      email: rest.email,
      mobile: rest.mobile,
      alternatePhone: rest.alternatePhone,
      linkedin: rest.linkedin,
      website: rest.website,
    },
    businessOverview: {
      buyerSegment: rest.buyerSegment,
      industry: rest.industry,
      secondaryIndustry: rest.secondaryIndustry,
      noOfEmployees: rest.noOfEmployees,
      annualRevenue: rest.annualRevenue,
      noOfLocations: rest.noOfLocations,
      procurementBudget: rest.procurementBudget,
      geographyOfOperation: rest.geographyOfOperation,
      keyMarkets: rest.keyMarkets ?? [],
    },
    sustainability: {
      sustainabilityPolicy: rest.sustainabilityPolicy,
      esgReport: rest.esgReport,
      sustainabilityDescription: rest.sustainabilityDescription,
      certifications: rest.certifications ?? [],
    },
    procurement: {
      categoriesNeeded: rest.categoriesNeeded ?? [],
      secondaryCategories: rest.secondaryCategories ?? [],
      procurementVolume: rest.procurementVolume,
      vendorLocationPreference: rest.vendorLocationPreference,
      preferredVendorSize: rest.preferredVendorSize,
      minCertificationRequired: rest.minCertificationRequired,
      pricingModel: rest.pricingModel,
      orderFrequency: rest.orderFrequency,
      typicalOrderValue: rest.typicalOrderValue,
      paymentTerms: rest.paymentTerms,
      communicationMode: rest.communicationMode,
      siteAuditRequired: rest.siteAuditRequired,
      ndaRequired: rest.ndaRequired,
      multiLocationDelivery: rest.multiLocationDelivery,
    },
    segmentDetails: {
      stockSymbol: rest.stockSymbol,
      sustainabilityCommittee: rest.sustainabilityCommittee,
      brsrCompliance: rest.brsrCompliance,
      vendorDiversityPolicy: rest.vendorDiversityPolicy,
      vendorCode: rest.vendorCode,
      esgScore: rest.esgScore,
      sustainabilityIndex: rest.sustainabilityIndex,
      csrSpend: rest.csrSpend,
      udyamNumber: rest.udyamNumber,
      msmeCategory: rest.msmeCategory,
      reasonForSustainableSourcing: rest.reasonForSustainableSourcing,
      budgetSensitivity: rest.budgetSensitivity,
      premiumWillingness: rest.premiumWillingness,
      sourcingType: rest.sourcingType,
      groupBuyingInterest: rest.groupBuyingInterest,
      tradeAssociation: rest.tradeAssociation,
      coverageArea: rest.coverageArea,
      noOfRetailOutlets: rest.noOfRetailOutlets,
      monthlyVolume: rest.monthlyVolume,
      coldChainCapability: rest.coldChainCapability,
      existingBrands: rest.existingBrands,
      exclusiveInterest: rest.exclusiveInterest,
      trackRecord: rest.trackRecord,
      creditTermsPreferred: rest.creditTermsPreferred,
      retailFormat: rest.retailFormat,
      storeOrSkuCount: rest.storeOrSkuCount,
      monthlyOrders: rest.monthlyOrders,
      platformPresence: rest.platformPresence,
    },
    declaration: {
      agreed: declarationAgreed,
      name: rest.declarationName,
      designation: rest.declarationDesignation,
      date: rest.declarationDate,
    },
    status,
  });
}

function flattenBuyerPayload(buyer: any, profile: any): Partial<BuyerOnboardingFormData> {
  const ci = buyer?.companyInfo || {};
  const bo = buyer?.businessOverview || {};
  const sus = buyer?.sustainability || {};
  const pro = buyer?.procurement || {};
  const seg = buyer?.segmentDetails || {};
  const decl = buyer?.declaration || {};

  return {
    ...ci,
    ...bo,
    ...sus,
    ...pro,
    ...seg,
    declarationAgreed: Boolean(decl.agreed || decl.name),
    declarationName: decl.name || profile?.name || "",
    declarationDesignation: decl.designation || "",
    declarationDate: decl.date || new Date().toISOString().split("T")[0],
    email: ci.email || profile?.email || "",
    contactPerson: ci.contactPerson || profile?.name || "",
  };
}

export const BuyerOnboardingForm = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  const methods = useForm<BuyerOnboardingFormData>({
    resolver: zodResolver(buyerOnboardingSchema),
    mode: "onTouched",
    defaultValues: {
      categoriesNeeded: [],
      secondaryCategories: [],
      keyMarkets: [],
      certifications: [],
      existingBrands: [],
      platformPresence: [],
      declarationAgreed: false,
      declarationDate: new Date().toISOString().split("T")[0],
    },
  });

  const { trigger, getValues, reset } = methods;

  // ─── Auth & Prefill ────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadBuyer() {
      const session = getStoredSession();

      if (!session) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("/api/buyer/profile", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          router.push("/login");
          return;
        }

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error?.message || "Unable to load buyer profile.");
        }

        reset({
          ...getValues(),
          ...flattenBuyerPayload(payload.buyer, payload.profile),
        } as any);
      } catch (err) {
        console.error("Buyer profile load failed:", err);
      } finally {
        setLoading(false);
      }
    }

    void loadBuyer();
  }, [reset, router]);

  // ─── Step Navigation ───────────────────────────────────────────────────────
  const handleNext = async () => {
    const fields = STEP_FIELDS[step];
    const isStepValid = await trigger(fields as any);
    if (isStepValid) setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => prev - 1);

  // ─── Save Draft ────────────────────────────────────────────────────────────
  const saveDraft = async () => {
    const session = getStoredSession();
    if (!session) {
      router.push("/login");
      return;
    }

    setSavingDraft(true);
    try {
      const response = await fetch("/api/buyer/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildBuyerPayload(getValues(), "draft")),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error?.message || "Draft save failed.");
      }

      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
    } catch (err) {
      console.error("Draft save failed:", err);
    } finally {
      setSavingDraft(false);
    }
  };

  // ─── Final Submit ──────────────────────────────────────────────────────────
  const handleFinalSubmit = async () => {
    // Validate each step in order so errors are always on a visible step.
    const stepChecks: [number, readonly string[]][] = [
      [1, STEP1_FIELDS],
      [2, STEP2_FIELDS],
      [3, STEP3_FIELDS],
      [4, STEP4_FIELDS],
      [5, STEP5_FIELDS],
    ];

    for (const [stepNum, fields] of stepChecks) {
      const valid = await trigger(fields as any);
      if (!valid) {
        setStep(stepNum);
        return;
      }
    }

    const session = getStoredSession();
    if (!session) { router.push("/login"); return; }

    setSubmitting(true);
    try {
      const data = getValues() as BuyerOnboardingFormData;
      const response = await fetch("/api/buyer/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildBuyerPayload(data, "submitted")),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error?.message || "Something went wrong.");
      }

      router.push("/buyer/dashboard");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading Spinner ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      <Stepper currentStep={step} />

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="p-8 md:p-12">
          <FormProvider {...methods}>
            <form onSubmit={(e) => e.preventDefault()}>
              {step === 1 && <Step1Identity />}
              {step === 2 && <Step2Overview />}
              {step === 3 && <Step3Sustainability />}
              {step === 4 && <Step4Procurement />}
              {step === 5 && <Step5SegmentAndSubmit />}

              {/* Navigation */}
              <div className="mt-12 flex items-center justify-between pt-8 border-t border-gray-100">
                {/* Back */}
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={step === 1 || submitting}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                    step === 1 ? "opacity-0 pointer-events-none" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <ChevronLeft size={20} />
                  Back
                </button>

                {/* Right-side controls */}
                <div className="flex items-center gap-3">
                  {/* Save Draft */}
                  <button
                    type="button"
                    onClick={saveDraft}
                    disabled={savingDraft}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
                  >
                    {draftSaved ? (
                      <>
                        <Check size={16} className="text-green-500" />
                        <span className="text-green-600">Saved!</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        {savingDraft ? "Saving…" : "Save Draft"}
                      </>
                    )}
                  </button>

                  {/* Next / Submit */}
                  {step < TOTAL_STEPS ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 hover:shadow-green-300 transition-all active:scale-95"
                    >
                      Next Step
                      <ChevronRight size={20} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFinalSubmit}
                      disabled={submitting}
                      className="flex items-center gap-2 px-10 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 hover:shadow-green-300 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
                    >
                      {submitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        <>
                          Complete Onboarding
                          <Check size={20} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>

      {/* Footer step indicator */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-400">
          Step {step} of {TOTAL_STEPS} • Sustainly Ecohub India Pvt Ltd
        </p>
        {/* Progress bar */}
        <div className="mx-auto mt-3 w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
