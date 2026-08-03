import { CheckCircle } from "lucide-react";
import { ReactNode } from "react";

interface JiraProgressProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "error";
  label?: string;
  showValue?: boolean;
  children?: ReactNode;
}

export function JiraProgress({
  value,
  max = 100,
  size = "md",
  variant = "default",
  label,
  showValue = false,
  children
}: JiraProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizes = {
    sm: "h-1",
    md: "h-2", 
    lg: "h-3"
  };

  const variants = {
    default: "bg-[#0c66e4]",
    success: "bg-[#22a06b]",
    warning: "bg-[#f79009]",
    error: "bg-[#ca3521]"
  };

  const isComplete = percentage >= 100;

  return (
    <div className="w-full">
      {(label || showValue || children) && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {isComplete && variant === "success" && (
              <CheckCircle className="w-4 h-4 text-[#22a06b]" />
            )}
            {label && (
              <span className="text-sm text-[#172b4d]">{label}</span>
            )}
            {children}
          </div>
          {showValue && (
            <span className="text-sm text-[#5e6c84]">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div className={`w-full bg-[#f4f5f7] rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`${sizes[size]} ${variants[variant]} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Circular progress variant
export function JiraCircularProgress({
  value,
  max = 100,
  size = 60,
  strokeWidth = 6,
  variant = "default",
  children
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: "default" | "success" | "warning" | "error";
  children?: ReactNode;
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const variants = {
    default: "#0c66e4",
    success: "#22a06b", 
    warning: "#f79009",
    error: "#ca3521"
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f4f5f7"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={variants[variant]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}