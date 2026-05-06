"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { LucideIcon, Upload, X, Check } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  icon?: LucideIcon;
}

export const Input: React.FC<InputProps> = ({ name, label, icon: Icon, ...props }) => {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name]?.message as string;

  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-sm font-medium text-gray-700 ml-1">{label}</label>
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors">
            <Icon size={18} />
          </div>
        )}
        <input
          {...register(name)}
          {...props}
          className={`w-full ${Icon ? 'pl-10' : 'px-4'} py-2.5 bg-white border ${error ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 placeholder:text-gray-400`}
        />
      </div>
      {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
    </div>
  );
};

export const TextArea: React.FC<InputProps & { rows?: number }> = ({ name, label, ...props }) => {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name]?.message as string;

  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-sm font-medium text-gray-700 ml-1">{label}</label>
      <textarea
        {...register(name)}
        {...(props as any)}
        className={`w-full px-4 py-2.5 bg-white border ${error ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 placeholder:text-gray-400 resize-none`}
      />
      {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
    </div>
  );
};

export const Select: React.FC<InputProps & { options: { label: string; value: string }[] }> = ({ name, label, options, ...props }) => {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name]?.message as string;

  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-sm font-medium text-gray-700 ml-1">{label}</label>
      <select
        {...register(name)}
        className={`w-full px-4 py-2.5 bg-white border ${error ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 appearance-none`}
      >
        <option value="">Select {label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
    </div>
  );
};

export const Toggle: React.FC<{ name: string; label: string }> = ({ name, label }) => {
  const { register, watch, setValue } = useFormContext();
  const checked = watch(name);

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => setValue(name, !checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-green-600' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
      <input type="checkbox" {...register(name)} className="hidden" />
    </div>
  );
};

export const MultiSelect: React.FC<{ name: string; label: string; options?: string[]; max?: number }> = ({ name, label, options, max = 5 }) => {
  const { setValue, watch, formState: { errors } } = useFormContext();
  const selected: string[] = watch(name) || [];
  const [inputValue, setInputValue] = React.useState("");
  const error = errors[name]?.message as string;

  const handleAdd = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !selected.includes(trimmed) && selected.length < max) {
      setValue(name, [...selected, trimmed]);
      setInputValue("");
    }
  };

  const handleRemove = (val: string) => {
    setValue(name, selected.filter(s => s !== val));
  };

  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-sm font-medium text-gray-700 ml-1">{label} (Max {max})</label>
      <div className={`min-h-[45px] flex flex-wrap gap-2 p-2 bg-white border ${error ? 'border-red-500' : 'border-gray-200'} rounded-xl focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500 transition-all`}>
        {selected.map(item => (
          <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-100">
            {item}
            <button type="button" onClick={() => handleRemove(item)} className="hover:text-green-900"><X size={12} /></button>
          </span>
        ))}
        {selected.length < max && (
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd(inputValue);
              }
            }}
            placeholder={selected.length === 0 ? `Type and press Enter...` : ""}
            className="flex-1 outline-none text-sm text-gray-900 min-w-[100px]"
          />
        )}
      </div>
      {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
    </div>
  );
};

export const FileUpload: React.FC<{ name: string; label: string }> = ({ name, label }) => {
  const { setValue, watch } = useFormContext();
  const file = watch(name);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setValue(name, f, { shouldDirty: true, shouldValidate: true });
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue(name, null, { shouldDirty: true, shouldValidate: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-sm font-medium text-gray-700 ml-1">{label}</label>
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer hover:bg-gray-50 flex flex-col items-center justify-center gap-2 ${file ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-400'}`}
      >
        <input type="file" ref={fileInputRef} onChange={handleFile} className="hidden" />
        {file ? (
          <>
            <div className="flex items-center gap-4 w-full px-4">
              {file instanceof File && file.type.startsWith('image/') ? (
                <div className="w-12 h-12 rounded-lg border border-gray-100 overflow-hidden shrink-0 shadow-sm">
                  <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                  <Check size={24} />
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {file instanceof File ? file.name : "File Selected"}
                </p>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mt-0.5">Ready to upload</p>
              </div>
              <button 
                type="button" 
                onClick={handleRemove}
                className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                title="Remove file"
              >
                <X size={20} />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              <Upload size={20} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (max. 10MB)</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
