"use client";

import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { uploadFileWithProgress } from "@/lib/storage";
import { onAuthStateChanged, User } from "firebase/auth";
import { onboardingSchema, OnboardingFormData } from "./schema";
import { Stepper } from "./_components/Stepper";
import { Step1Identity } from "./_components/Step1Identity";
import { Step2Business } from "./_components/Step2Business";
import { Step3Sustainability } from "./_components/Step3Sustainability";
import { Step4Marketplace } from "./_components/Step4Marketplace";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

export const OnboardingForm = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const snap = await getDoc(doc(db, "vendors", u.uid));
        if (snap.exists()) {
          const data = snap.data();
          reset({ ...data } as any);
        }
        setLoading(false);
      } else {
        router.push("/login");
      }
    });
    return () => unsub();
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
    if (!user) return;
    setSubmitting(true);

    try {
      let logoUrl = "";
      let certUrl = "";
      let awardsUrl = "";

      if (data.logoFile instanceof File) {
        const path = `vendors/${user.uid}/logos/${Date.now()}_${data.logoFile.name}`;
        logoUrl = await uploadFileWithProgress(data.logoFile, path);
      }

      if (data.certificateFile instanceof File) {
        const path = `vendors/${user.uid}/certs/${Date.now()}_${data.certificateFile.name}`;
        certUrl = await uploadFileWithProgress(data.certificateFile, path);
      }
      
      if (data.awardsFile instanceof File) {
        const path = `vendors/${user.uid}/awards/${Date.now()}_${data.awardsFile.name}`;
        awardsUrl = await uploadFileWithProgress(data.awardsFile, path);
      }

      const { logoFile, certificateFile, awardsFile, ...cleanData } = data;

      const payload = {
        uid: user.uid,
        ...cleanData,
        ...(logoUrl && { logoUrl }),
        ...(certUrl && { certificateFileUrl: certUrl }),
        ...(awardsUrl && { awardsImageUrl: awardsUrl }),
        approved: false,
        updatedAt: serverTimestamp(),
      };
      
      const existing = await getDoc(doc(db, "vendors", user.uid));
      if (!existing.exists()) {
        (payload as any).createdAt = serverTimestamp();
      }

      await setDoc(doc(db, "vendors", user.uid), payload, { merge: true });

      await setDoc(
        doc(db, "users", user.uid),
        {
          role: "VENDOR",
          vendorProfileComplete: true,
          companyName: data.companyName,
        },
        { merge: true }
      );

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
              {step === 2 && <Step2Business />}
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
