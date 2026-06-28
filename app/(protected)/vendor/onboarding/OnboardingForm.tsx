"use client";

import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { getStoredSession } from "@/lib/supabaseAuth";
import { uploadFileToSupabaseStorage } from "@/lib/storage";
import { onboardingSchema, OnboardingFormData } from "./schema";
import { Stepper } from "./_components/Stepper";
import { Step1Identity } from "./_components/Step1Identity";
import { Step2Business } from "./_components/Step2Business";
import { Step3Sustainability } from "./_components/Step3Sustainability";
import { Step4Marketplace } from "./_components/Step4Marketplace";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

type CatalogCategory = { id: string; name: string };
type CatalogSubcategory = { id: string; name: string; categoryId: string };

export const OnboardingForm = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [subcategories, setSubcategories] = useState<CatalogSubcategory[]>([]);

  const methods = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema) as any,
    mode: "onChange",
    defaultValues: {
      subCategories: [],
      keyProducts: [],
      exportCapability: false,
      willingnessToOfferSamples: false,
      sdgAlignment: [],
      declarationAgreed: false,
      logoFile: null,
    }
  });

  const { handleSubmit, trigger, formState: { isValid }, reset } = methods;

  // Auth & Prefill
  useEffect(() => {
    async function loadVendor() {
      const session = getStoredSession();
      if (!session) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("/api/vendor/profile", {
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
          throw new Error(payload?.error?.message || "Unable to load vendor profile.");
        }

        if (payload.vendor) {
          reset({ ...payload.vendor } as any);
        }

        const catalogResponse = await fetch("/api/vendor/catalog", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (catalogResponse.ok) {
          const catalog = await catalogResponse.json();
          setCategories(catalog.categories || []);
          setSubcategories(catalog.subcategories || []);
        }
      } catch (error) {
        console.error("Vendor profile load failed:", error);
      } finally {
        setLoading(false);
      }
    }

    void loadVendor();
  }, [reset, router]);

  const handleNext = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) {
      fieldsToValidate = [
        "companyName", "registrationType", "cinRegistration", "gstNumber", 
        "yearOfIncorporation", "registeredAddress", "city", "state", 
        "pinCode", "country", "primaryContactName", "designation", 
        "businessEmail", "whatsapp"
      ];
    } else if (step === 2) {
      fieldsToValidate = [
        "businessType", "primaryCategory", "shortDescription", 
        "keyProducts"
      ];
    } else if (step === 3) {
      fieldsToValidate = [
        "primarySustainabilityCert", "issuingBody", "sustainabilityPractice"
      ];
    }

    const isStepValid = await trigger(fieldsToValidate as any);
    if (isStepValid) setStep(prev => prev + 1);
  };

  const onSubmit = async (data: OnboardingFormData) => {
    const session = getStoredSession();
    if (!session) {
      router.push("/login");
      return;
    }

    setSubmitting(true);

    try {
      const { logoFile, certificateFile, awardsFile, ...cleanData } = data;

      // Upload files to storage and attach URLs before sending to API
      if (logoFile instanceof File) {
        const result = await uploadFileToSupabaseStorage(logoFile, {
          bucket: "marketplace",
          folder: "vendors/logos",
          accessToken: session.accessToken,
        });
        (cleanData as Record<string, unknown>).logoUrl = result.url;
      }

      if (certificateFile instanceof File) {
        const result = await uploadFileToSupabaseStorage(certificateFile, {
          bucket: "marketplace",
          folder: "vendors/certificates",
          accessToken: session.accessToken,
        });
        (cleanData as Record<string, unknown>).certificateFileUrl = result.url;
      }

      if (awardsFile instanceof File) {
        const result = await uploadFileToSupabaseStorage(awardsFile, {
          bucket: "marketplace",
          folder: "vendors/awards",
          accessToken: session.accessToken,
        });
        (cleanData as Record<string, unknown>).awardsImageUrl = result.url;
      }

      const response = await fetch("/api/vendor/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanData),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error?.message || "Something went wrong.");
      }

      router.push("/vendor/dashboard");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      <Stepper currentStep={step} totalSteps={4} />

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="p-8 md:p-12">
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              {step === 1 && <Step1Identity />}
              {step === 2 && <Step2Business categories={categories} subcategories={subcategories} />}
              {step === 3 && <Step3Sustainability />}
              {step === 4 && <Step4Marketplace />}

              <div className="mt-12 flex items-center justify-between pt-8 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep(prev => prev - 1)}
                  disabled={step === 1 || submitting}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                    step === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <ChevronLeft size={20} />
                  Back
                </button>

                {step < 4 ? (
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
                    type="submit"
                    disabled={submitting || !isValid}
                    className="flex items-center gap-2 px-10 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 hover:shadow-green-300 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
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
            </form>
          </FormProvider>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-400">
          Step {step} of 4 • Sustainly Ecohub India Pvt Ltd
        </p>
      </div>
    </div>
  );
};
