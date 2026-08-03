import { AlertTriangle, CheckCircle, Info, AlertCircle } from "lucide-react";
import { ReactNode } from "react";
import { JiraButton } from "./JiraButton";

interface JiraSectionMessageProps {
  variant?: "info" | "warning" | "error" | "success";
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}

export function JiraSectionMessage({ 
  variant = "info", 
  children, 
  title,
  actions 
}: JiraSectionMessageProps) {
  const variants = {
    info: {
      bg: "bg-[#e9f2ff]",
      border: "border-[#cce0ff]",
      icon: Info,
      iconColor: "text-[#0c66e4]",
      titleColor: "text-[#0c66e4]"
    },
    warning: {
      bg: "bg-[#fffae6]",
      border: "border-[#ffeaa7]",
      icon: AlertTriangle,
      iconColor: "text-[#f79009]",
      titleColor: "text-[#b45309]"
    },
    error: {
      bg: "bg-[#ffebe6]",
      border: "border-[#ffc5ba]",
      icon: AlertCircle,
      iconColor: "text-[#ca3521]",
      titleColor: "text-[#ca3521]"
    },
    success: {
      bg: "bg-[#dcfff1]",
      border: "border-[#baf3d0]",
      icon: CheckCircle,
      iconColor: "text-[#22a06b]",
      titleColor: "text-[#1f845a]"
    }
  };

  const config = variants[variant];
  const IconComponent = config.icon;

  return (
    <div className={`
      ${config.bg} ${config.border} border rounded-lg p-4
    `}>
      <div className="flex items-start space-x-3">
        <IconComponent className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
        
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={`text-base font-medium mb-2 ${config.titleColor}`}>
              {title}
            </h3>
          )}
          <div className="text-[#172b4d] text-sm leading-6 mb-3">
            {children}
          </div>
          
          {actions && (
            <div className="flex gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}