import { AlertTriangle, CheckCircle, Info, AlertCircle, X } from "lucide-react";
import { ReactNode } from "react";

interface JiraInlineMessageProps {
  variant?: "info" | "warning" | "error" | "success";
  children: ReactNode;
  title?: string;
  onDismiss?: () => void;
}

export function JiraInlineMessage({ 
  variant = "info", 
  children, 
  title,
  onDismiss 
}: JiraInlineMessageProps) {
  const variants = {
    info: {
      bg: "bg-[#e9f2ff]",
      icon: Info,
      iconColor: "text-[#0c66e4]",
      titleColor: "text-[#0c66e4]"
    },
    warning: {
      bg: "bg-[#fffae6]",
      icon: AlertTriangle,
      iconColor: "text-[#f79009]",
      titleColor: "text-[#b45309]"
    },
    error: {
      bg: "bg-[#ffebe6]",
      icon: AlertCircle,
      iconColor: "text-[#ca3521]",
      titleColor: "text-[#ca3521]"
    },
    success: {
      bg: "bg-[#dcfff1]",
      icon: CheckCircle,
      iconColor: "text-[#22a06b]",
      titleColor: "text-[#1f845a]"
    }
  };

  const config = variants[variant];
  const IconComponent = config.icon;

  return (
    <div className={`${config.bg} rounded-lg p-3 flex items-start space-x-3`}>
      <IconComponent className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
      
      <div className="flex-1 min-w-0">
        {title && (
          <div className={`text-sm font-medium mb-1 ${config.titleColor}`}>
            {title}
          </div>
        )}
        <div className="text-[#172b4d] text-sm leading-5">
          {children}
        </div>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3 text-[#5e6c84]" />
        </button>
      )}
    </div>
  );
}