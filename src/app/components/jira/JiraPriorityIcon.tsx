import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface JiraPriorityIconProps {
  priority: "Highest" | "High" | "Medium" | "Low" | "Lowest";
}

export function JiraPriorityIcon({ priority }: JiraPriorityIconProps) {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "Highest":
        return { icon: ArrowUp, color: "text-[#cd1316]", bg: "bg-[#cd1316]" };
      case "High":
        return { icon: ArrowUp, color: "text-[#ea7100]", bg: "bg-[#ea7100]" };
      case "Medium":
        return { icon: Minus, color: "text-[#e38500]", bg: "bg-[#e38500]" };
      case "Low":
        return { icon: ArrowDown, color: "text-[#57a55a]", bg: "bg-[#57a55a]" };
      case "Lowest":
        return { icon: ArrowDown, color: "text-[#2d8738]", bg: "bg-[#2d8738]" };
      default:
        return { icon: Minus, color: "text-[#e38500]", bg: "bg-[#e38500]" };
    }
  };

  const { icon: Icon, color } = getPriorityConfig(priority);

  return (
    <div className="flex items-center space-x-1">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-xs text-[#5e6c84]">{priority}</span>
    </div>
  );
}