import { Plus, X, Edit, MessageSquare, Flag, Link2 } from "lucide-react";
import { useState } from "react";

interface JiraFABProps {
  position?: "bottom-right" | "bottom-left";
  actions?: {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    color?: string;
  }[];
}

export function JiraFloatingActionButton({ 
  position = "bottom-right",
  actions 
}: JiraFABProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const defaultActions = [
    {
      label: "Create Issue",
      icon: Plus,
      onClick: () => console.log("Create Issue"),
      color: "bg-[#0052cc]"
    },
    {
      label: "Quick Comment",
      icon: MessageSquare,
      onClick: () => console.log("Quick Comment"),
      color: "bg-[#36b37e]"
    },
    {
      label: "Flag Issue",
      icon: Flag,
      onClick: () => console.log("Flag Issue"),
      color: "bg-[#ff8b00]"
    },
    {
      label: "Copy Link",
      icon: Link2,
      onClick: () => console.log("Copy Link"),
      color: "bg-[#6554c0]"
    }
  ];

  const fabActions = actions || defaultActions;

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6"
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-40`}>
      {/* Action Buttons */}
      {isExpanded && (
        <div className="mb-4 space-y-3">
          {fabActions.map((action, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 animate-in slide-in-from-bottom duration-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {position === "bottom-right" && (
                <div className="bg-white text-[#172b4d] px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap">
                  {action.label}
                </div>
              )}
              
              <button
                onClick={() => {
                  action.onClick();
                  setIsExpanded(false);
                }}
                className={`
                  w-12 h-12 ${action.color} text-white rounded-full shadow-lg
                  flex items-center justify-center hover:scale-110 transition-transform
                `}
                title={action.label}
              >
                <action.icon className="w-5 h-5" />
              </button>
              
              {position === "bottom-left" && (
                <div className="bg-white text-[#172b4d] px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap">
                  {action.label}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-14 h-14 bg-[#0052cc] text-white rounded-full shadow-lg
          flex items-center justify-center hover:bg-[#0747a6] 
          transition-all duration-200 hover:scale-110
          ${isExpanded ? 'rotate-45' : 'rotate-0'}
        `}
      >
        {isExpanded ? (
          <X className="w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </button>
    </div>
  );
}