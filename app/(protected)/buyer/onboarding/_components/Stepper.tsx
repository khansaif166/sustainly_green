"use client";

import React from "react";
import { Check, Building2, BarChart3, Leaf, ShoppingCart, Layers } from "lucide-react";

interface StepperProps {
  currentStep: number;
}

const steps = [
  { id: 1, label: "Business Identity", icon: Building2 },
  { id: 2, label: "Overview",          icon: BarChart3 },
  { id: 3, label: "Sustainability",    icon: Leaf },
  { id: 4, label: "Procurement",       icon: ShoppingCart },
  { id: 5, label: "Segment & Submit",  icon: Layers },
];

export const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mb-10">
      <div className="relative flex justify-between items-start">
        {/* Background track */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-100 -z-10" />

        {/* Progress fill */}
        <div
          className="absolute top-6 left-0 h-0.5 bg-green-500 -z-10 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />

        {steps.map((step) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2.5 flex-1 first:items-start last:items-end">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${
                  isActive
                    ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-200 scale-110"
                    : isCompleted
                    ? "bg-white border-green-500 text-green-600 shadow-sm"
                    : "bg-white border-gray-200 text-gray-400"
                }`}
              >
                {isCompleted ? <Check size={18} strokeWidth={3} /> : <Icon size={20} />}
              </div>
              <div className="flex flex-col items-center text-center">
                <span
                  className={`text-[10px] uppercase tracking-wider font-bold ${
                    isActive ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  Step {step.id}
                </span>
                <span
                  className={`text-xs font-semibold leading-tight max-w-[72px] text-center ${
                    isActive ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
