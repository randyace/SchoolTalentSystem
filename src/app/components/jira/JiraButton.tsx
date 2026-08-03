import { ReactNode } from "react";

interface JiraButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "subtle" | "link";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
}

export function JiraButton({ children, variant = "primary", size = "md", onClick, disabled }: JiraButtonProps) {
  const baseClasses = "inline-flex items-center justify-center rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[#0052cc] focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-[#0052cc] text-white hover:bg-[#0747a6] disabled:bg-[#f4f5f7] disabled:text-[#a5adba]",
    secondary: "bg-white border border-[#dfe1e6] text-[#42526e] hover:bg-[#f4f5f7] disabled:bg-[#f4f5f7] disabled:text-[#a5adba]",
    subtle: "bg-transparent text-[#42526e] hover:bg-[#f4f5f7] disabled:text-[#a5adba]",
    link: "bg-transparent text-[#0052cc] hover:text-[#0747a6] hover:underline disabled:text-[#a5adba]"
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-3 text-base"
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}