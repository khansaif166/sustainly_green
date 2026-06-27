"use client";

import React from "react";
import { useFormContext, useController } from "react-hook-form";
import { LucideIcon, Upload, X, Check } from "lucide-react";

// ─── INPUT ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  icon?: LucideIcon;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({ name, label, icon: Icon, required, ...props }) => {
  const { control, formState: { errors } } = useFormContext();
  const { field } = useController({ name, control, defaultValue: "" });
  const error = errors[name]?.message as string;

  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-sm font-medium text-gray-700 ml-1">
        {label}{required && <span className="text-green-500 ml-0.5">*</span>}
      </label>
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors">
            <Icon size={18} />
          </div>
        )}
        <input
          {...field}
          value={field.value ?? ""}
          {...props}
          className={`w-full ${Icon ? "pl-10" : "px-4"} py-2.5 bg-white border ${
            error ? "border-red-400 bg-red-50" : "border-gray-200"
          } rounded-xl outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 placeholder:text-gray-400 text-sm`}
        />
      </div>
      {error && <p className="text-xs text-red-500 ml-1 flex items-center gap-1">⚠ {error}</p>}
    </div>
  );
};

// ─── TEXTAREA ─────────────────────────────────────────────────────────────────
export const TextArea: React.FC<InputProps & { rows?: number }> = ({ name, label, required, rows, ...props }) => {
  const { control, formState: { errors } } = useFormContext();
  const { field } = useController({ name, control, defaultValue: "" });
  const error = errors[name]?.message as string;

  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-sm font-medium text-gray-700 ml-1">
        {label}{required && <span className="text-green-500 ml-0.5">*</span>}
      </label>
      <textarea
        {...field}
        value={field.value ?? ""}
        rows={rows}
        {...(props as any)}
        className={`w-full px-4 py-2.5 bg-white border ${
          error ? "border-red-400 bg-red-50" : "border-gray-200"
        } rounded-xl outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 placeholder:text-gray-400 resize-none text-sm`}
      />
      {error && <p className="text-xs text-red-500 ml-1">⚠ {error}</p>}
    </div>
  );
};

// ─── SELECT ───────────────────────────────────────────────────────────────────
export const Select: React.FC<InputProps & { options: { label: string; value: string }[] }> = ({
  name, label, options, required,
}) => {
  const { control, formState: { errors } } = useFormContext();
  const { field } = useController({ name, control, defaultValue: "" });
  const error = errors[name]?.message as string;

  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-sm font-medium text-gray-700 ml-1">
        {label}{required && <span className="text-green-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select
          {...field}
          value={field.value ?? ""}
          className={`w-full px-4 py-2.5 bg-white border ${
            error ? "border-red-400 bg-red-50" : "border-gray-200"
          } rounded-xl outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 appearance-none text-sm pr-10`}
        >
          <option value="">Select {label}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="text-xs text-red-500 ml-1">⚠ {error}</p>}
    </div>
  );
};

// ─── TOGGLE ───────────────────────────────────────────────────────────────────
export const Toggle: React.FC<{ name: string; label: string }> = ({ name, label }) => {
  const { watch, setValue } = useFormContext();
  const checked = watch(name);

  return (
    <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => setValue(name, !checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
          checked ? "bg-green-600" : "bg-gray-200"
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`} />
      </button>
    </div>
  );
};

// ─── MULTI-SELECT (Tag Input) ─────────────────────────────────────────────────
export const MultiSelect: React.FC<{
  name: string;
  label: string;
  options?: string[];
  max?: number;
  required?: boolean;
}> = ({ name, label, options, max = 10, required }) => {
  const { setValue, watch, formState: { errors } } = useFormContext();
  const selected: string[] = watch(name) || [];
  const [inputValue, setInputValue] = React.useState("");
  const [showDropdown, setShowDropdown] = React.useState(false);
  const error = errors[name]?.message as string;

  const filtered = options
    ? options.filter((o) => !selected.includes(o) && o.toLowerCase().includes(inputValue.toLowerCase()))
    : [];

  const handleAdd = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !selected.includes(trimmed) && selected.length < max) {
      setValue(name, [...selected, trimmed], { shouldValidate: true });
      setInputValue("");
    }
    setShowDropdown(false);
  };

  const handleRemove = (val: string) => {
    setValue(name, selected.filter((s) => s !== val), { shouldValidate: true });
  };

  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-sm font-medium text-gray-700 ml-1">
        {label}{required && <span className="text-green-500 ml-0.5">*</span>}
        <span className="text-gray-400 font-normal ml-1">(max {max})</span>
      </label>
      <div className={`min-h-[46px] flex flex-wrap gap-1.5 p-2 bg-white border ${
        error ? "border-red-400" : "border-gray-200"
      } rounded-xl focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500 transition-all relative`}>
        {selected.map((item) => (
          <span key={item} className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-100">
            {item}
            <button type="button" onClick={() => handleRemove(item)} className="hover:text-green-900 transition-colors">
              <X size={11} />
            </button>
          </span>
        ))}
        {selected.length < max && (
          <div className="relative flex-1">
            <input
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); setShowDropdown(true); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleAdd(inputValue); }
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder={selected.length === 0 ? "Type and press Enter…" : ""}
              className="flex-1 outline-none text-sm text-gray-900 min-w-[120px] w-full py-0.5"
            />
            {showDropdown && filtered.length > 0 && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-auto min-w-[200px]">
                {filtered.slice(0, 8).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onMouseDown={() => handleAdd(opt)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 hover:text-green-700 transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 ml-1">⚠ {error}</p>}
    </div>
  );
};

// ─── FILE UPLOAD ──────────────────────────────────────────────────────────────
export const FileUpload: React.FC<{ name: string; label: string }> = ({ name, label }) => {
  const { setValue, watch } = useFormContext();
  const file = watch(name);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-sm font-medium text-gray-700 ml-1">{label}</label>
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-center ${
          file ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-400 hover:bg-gray-50"
        }`}
      >
        <input type="file" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if (f) setValue(name, f); }} className="hidden" />
        {file ? (
          <>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <Check size={20} />
            </div>
            <p className="text-sm font-medium text-green-700 truncate max-w-xs">{file.name}</p>
            <button type="button" onClick={(e) => { e.stopPropagation(); setValue(name, null); }} className="text-xs text-red-500 hover:underline">
              Remove
            </button>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              <Upload size={20} />
            </div>
            <p className="text-sm font-medium text-gray-700">Click to upload</p>
            <p className="text-xs text-gray-400">PDF, JPG, PNG (max. 10MB)</p>
          </>
        )}
      </div>
    </div>
  );
};

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
export const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-6">
    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
  </div>
);

// ─── FORM SECTION DIVIDER ─────────────────────────────────────────────────────
export const Divider: React.FC<{ label: string }> = ({ label }) => (
  <div className="relative flex items-center my-6">
    <div className="flex-1 h-px bg-gray-100" />
    <span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
    <div className="flex-1 h-px bg-gray-100" />
  </div>
);
