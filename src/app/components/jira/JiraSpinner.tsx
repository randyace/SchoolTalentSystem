import { Loader2 } from "lucide-react";
import { ReactNode } from "react";

interface JiraSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  children?: ReactNode;
  className?: string;
}

export function JiraSpinner({ 
  size = "md", 
  label = "Loading...",
  children,
  className = ""
}: JiraSpinnerProps) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  };

  if (children) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Loader2 className={`${sizes[size]} animate-spin text-[#0c66e4] mx-auto mb-3`} />
          <div className="text-[#5e6c84] text-sm">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Loader2 className={`${sizes[size]} animate-spin text-[#0c66e4]`} />
      {label && (
        <span className="text-[#5e6c84] text-sm" aria-live="polite">
          {label}
        </span>
      )}
    </div>
  );
}

// Loading overlay component
export function JiraLoadingOverlay({ 
  isLoading, 
  children,
  message = "Loading..."
}: {
  isLoading: boolean;
  children: ReactNode;
  message?: string;
}) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <JiraSpinner size="lg">
            {message}
          </JiraSpinner>
        </div>
      )}
    </div>
  );
}

// Skeleton loader for content
export function JiraSkeleton({ 
  lines = 3,
  className = ""
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`
            bg-[#f4f5f7] rounded animate-pulse
            ${i === 0 ? 'h-4 w-3/4' : ''}
            ${i === 1 ? 'h-4 w-full' : ''}
            ${i === 2 ? 'h-4 w-2/3' : ''}
            ${i > 2 ? 'h-4 w-5/6' : ''}
          `}
        />
      ))}
    </div>
  );
}