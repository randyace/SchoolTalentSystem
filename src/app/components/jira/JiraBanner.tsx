import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from "lucide-react";
import { ReactNode } from "react";

interface JiraBannerProps {
  variant?: "info" | "warning" | "error" | "success" | "announcement";
  children: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  icon?: ReactNode;
}

export function JiraBanner({ 
  variant = "info", 
  children, 
  action, 
  onDismiss,
  icon 
}: JiraBannerProps) {
  const variants = {
    info: {
      bg: "bg-[#e9f2ff]",
      border: "border-l-[#0c66e4]",
      icon: Info,
      iconColor: "text-[#0c66e4]"
    },
    warning: {
      bg: "bg-[#fffae6]", 
      border: "border-l-[#f79009]",
      icon: AlertTriangle,
      iconColor: "text-[#f79009]"
    },
    error: {
      bg: "bg-[#ffebe6]",
      border: "border-l-[#ca3521]", 
      icon: AlertCircle,
      iconColor: "text-[#ca3521]"
    },
    success: {
      bg: "bg-[#dcfff1]",
      border: "border-l-[#22a06b]",
      icon: CheckCircle, 
      iconColor: "text-[#22a06b]"
    },
    announcement: {
      bg: "bg-[#f3f0ff]",
      border: "border-l-[#8b5cf6]",
      icon: Info,
      iconColor: "text-[#8b5cf6]"
    }
  };

  const config = variants[variant];
  const IconComponent = icon || config.icon;

  return (
    <div className={`
      ${config.bg} border-l-4 ${config.border} p-4 flex items-start space-x-3
      shadow-sm border border-transparent border-l-4
    `}>
      <IconComponent className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
      
      <div className="flex-1 min-w-0">
        <div className="text-[#172b4d] text-sm leading-5">
          {children}
        </div>
      </div>

      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-[#5e6c84]" />
        </button>
      )}
    </div>
  );
}