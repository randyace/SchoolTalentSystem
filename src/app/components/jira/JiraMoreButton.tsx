import { MoreHorizontal, Edit, Copy, Trash2, Share, Flag, Archive, Link } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface JiraMoreButtonProps {
  actions?: {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: "default" | "danger";
    separator?: boolean;
  }[];
  size?: "sm" | "md";
}

export function JiraMoreButton({ actions, size = "md" }: JiraMoreButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const defaultActions = [
    { label: "Edit", icon: Edit, onClick: () => console.log("Edit") },
    { label: "Copy link", icon: Link, onClick: () => console.log("Copy link") },
    { label: "Share", icon: Share, onClick: () => console.log("Share"), separator: true },
    { label: "Flag", icon: Flag, onClick: () => console.log("Flag") },
    { label: "Archive", icon: Archive, onClick: () => console.log("Archive"), separator: true },
    { label: "Delete", icon: Trash2, onClick: () => console.log("Delete"), variant: "danger" as const }
  ];

  const menuActions = actions || defaultActions;
  
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8"
  };
  
  const iconSizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4"
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          ${sizeClasses[size]} flex items-center justify-center
          text-[#5e6c84] hover:text-[#172b4d] hover:bg-[#f4f5f7] 
          rounded transition-colors
        `}
        title="More actions"
      >
        <MoreHorizontal className={iconSizeClasses[size]} />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-[#dfe1e6] py-1 z-50"
        >
          {menuActions.map((action, index) => (
            <div key={index}>
              {action.separator && index > 0 && (
                <div className="border-t border-[#f4f5f7] my-1" />
              )}
              <button
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2 text-sm text-left
                  hover:bg-[#f4f5f7] transition-colors
                  ${action.variant === "danger" 
                    ? "text-[#de350b] hover:bg-[#ffebe6]" 
                    : "text-[#172b4d]"
                  }
                `}
              >
                <action.icon className="w-4 h-4" />
                <span>{action.label}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}