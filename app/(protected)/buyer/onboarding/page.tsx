"use client";

import { BuyerOnboardingForm } from "./BuyerOnboardingForm";

export default function BuyerOnboardingPage() {
  return (
    <main className="min-h-screen bg-[#fafbfc] py-12 px-4 md:py-20">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-green-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-teal-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-[40%] left-[30%] w-[20%] h-[20%] bg-emerald-50 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="w-full mx-auto space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-widest">
            Buyer Onboarding
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Source Sustainably.{" "}
            <span className="text-green-600">Lead Responsibly.</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Join the Sustainly Green Marketplace. Complete your buyer profile to discover verified
            eco-friendly suppliers that align with your procurement goals.
          </p>
        </div>

        {/* Form Section */}
        <BuyerOnboardingForm />

        {/* Footer info */}
        <div className="text-center pt-8 border-t border-gray-100">
          <p className="text-sm text-gray-400">
            © 2026 Sustainly Ecohub India Pvt Ltd. All rights reserved.
            Need help?{" "}
            <a
              href="mailto:support@sustainlygreen.com"
              className="text-green-600 font-medium hover:underline"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
