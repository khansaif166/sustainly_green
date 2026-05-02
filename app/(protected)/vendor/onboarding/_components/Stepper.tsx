"use client";

import React from "react";
import { Check, User, Building2, ShieldCheck, ShoppingBag } from "lucide-react";

interface StepperProps {
  currentStep: number;
  totalSteps: number;
}

const steps = [
  { id: 1, label: "Identity", icon: User },
  { id: 2, label: "Business", icon: Building2 },
  { id: 3, label: "Sustainability", icon: ShieldCheck },
  { id: 4, label: "Marketplace", icon: ShoppingBag },
];

export const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 mb-12">
      <div className="relative flex justify-between">
        {/* Background Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 -z-10" />
        
        {/* Active Progress Line */}
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-green-500 -translate-y-1/2 -z-10 transition-all duration-500" 
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center gap-3">
              <div 
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${
                  isActive 
                    ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-200 scale-110' 
                    : isCompleted 
                      ? 'bg-white border-green-500 text-green-600 shadow-sm' 
                      : 'bg-white border-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? <Check size={20} strokeWidth={3} /> : <Icon size={20} />}
              </div>
              <div className="flex flex-col items-center">
                <span className={`text-[10px] uppercase tracking-wider font-bold ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                  Step {step.id}
                </span>
                <span className={`text-xs font-semibold ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
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
