"use client";

import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = ({ className, variant = "primary", size = "md", ...props }: ButtonProps) => {
  const variants = {
    primary: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
    secondary: "bg-gray-900 text-white hover:bg-gray-800 shadow-sm",
    outline: "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100",
    ghost: "text-gray-600 hover:bg-gray-100",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs font-semibold",
    md: "px-4 py-2 text-sm font-bold",
    lg: "px-6 py-3 text-base font-bold",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
};

// Badge
export const Badge = ({ children, className, variant = "pending" }: { children: React.ReactNode; className?: string; variant?: string }) => {
  const variants: Record<string, string> = {
    approved: "bg-green-100 text-green-700 border-green-200",
    active: "bg-green-100 text-green-700 border-green-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
    inactive: "bg-gray-100 text-gray-700 border-gray-200",
    new: "bg-blue-100 text-blue-700 border-blue-200",
  };

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", variants[variant.toLowerCase()] || variants.pending, className)}>
      {children}
    </span>
  );
};

// Table
export const Table = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm", className)}>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">{children}</table>
    </div>
  </div>
);

export const THead = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-gray-50 border-b border-gray-100">{children}</thead>
);

export const TBody = ({ children }: { children: React.ReactNode }) => (
  <tbody className="divide-y divide-gray-50">{children}</tbody>
);

export const TH = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <th className={cn("px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider", className)}>{children}</th>
);

export const TD = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <td className={cn("px-6 py-4 text-sm text-gray-600", className)}>{children}</td>
);

// Modal
export const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// Drawer
export const Drawer = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-white shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Tabs
export const Tabs = ({ tabs, activeTab, onTabChange }: { tabs: { id: string; label: string }[]; activeTab: string; onTabChange: (id: string) => void }) => (
  <div className="flex items-center gap-1 p-1 bg-gray-100/80 rounded-2xl border border-gray-200/50 w-fit">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className={cn(
          "px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-200",
          activeTab === tab.id 
            ? "bg-white text-green-600 shadow-sm" 
            : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
        )}
      >
        {tab.label}
      </button>
    ))}
  </div>
);
