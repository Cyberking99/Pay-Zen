import React from 'react';

interface CustomFieldProps {
  field: {
    name: string;
    type: 'text' | 'textarea' | 'select';
    required?: boolean;
    options?: string[];
  };
  value: string;
  onChange: (name: string, value: string) => void;
  placeholder?: string;
}

export const CustomField: React.FC<CustomFieldProps> = ({
  field,
  value,
  onChange,
  placeholder,
}) => {
  const baseInputClass = "w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:border-[#A3FF50] focus:ring-1 focus:ring-[#A3FF50] transition-all duration-200";

  const renderField = () => {
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={placeholder || field.name}
            className={`${baseInputClass} min-h-[80px] resize-none`}
            rows={3}
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            className={baseInputClass}
          >
            <option value="">Select {field.name}...</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      
      default: // text
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={placeholder || field.name}
            className={baseInputClass}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        {field.name}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderField()}
    </div>
  );
};
