import { InputHTMLAttributes } from "react";

interface JiraInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function JiraInput({ label, error, className = "", ...props }: JiraInputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm text-[#5e6c84]">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-3 py-2 border border-[#dfe1e6] rounded 
          focus:outline-none focus:ring-2 focus:ring-[#0052cc] focus:border-transparent
          placeholder-[#a5adba] text-[#172b4d]
          disabled:bg-[#f4f5f7] disabled:text-[#a5adba]
          ${error ? 'border-[#de350b]' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-[#de350b]">{error}</p>
      )}
    </div>
  );
}