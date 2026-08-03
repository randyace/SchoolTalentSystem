import { ChevronDown } from "lucide-react";

interface JiraSelectProps {
  options: { value: string; label: string }[];
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
}

export function JiraSelect({ options, placeholder, value, onChange, label }: JiraSelectProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm text-[#5e6c84]">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="
            w-full px-3 py-2 border border-[#dfe1e6] rounded appearance-none
            focus:outline-none focus:ring-2 focus:ring-[#0052cc] focus:border-transparent
            text-[#172b4d] bg-white cursor-pointer
          "
        >
          {placeholder && (
            <option value="" disabled>{placeholder}</option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#5e6c84] pointer-events-none" />
      </div>
    </div>
  );
}