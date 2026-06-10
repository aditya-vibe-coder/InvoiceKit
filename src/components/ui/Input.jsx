import React from 'react';

export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input 
        className={`px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
        {...props} 
      />
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
}
