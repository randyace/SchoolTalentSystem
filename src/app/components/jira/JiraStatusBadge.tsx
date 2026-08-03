interface JiraStatusBadgeProps {
  status: string;
}

export function JiraStatusBadge({ status }: JiraStatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "to do":
        return "bg-[#dfe1e6] text-[#42526e]";
      case "in progress":
        return "bg-[#0052cc] text-white";
      case "in review":
        return "bg-[#ffab00] text-[#172b4d]";
      case "done":
        return "bg-[#36b37e] text-white";
      case "blocked":
        return "bg-[#de350b] text-white";
      default:
        return "bg-[#dfe1e6] text-[#42526e]";
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}>
      {status.toUpperCase()}
    </span>
  );
}