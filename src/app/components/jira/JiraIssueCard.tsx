import { JiraStatusBadge } from "./JiraStatusBadge";
import { JiraPriorityIcon } from "./JiraPriorityIcon";
import { JiraAvatar } from "./JiraAvatar";

interface JiraIssueCardProps {
  title: string;
  issueKey: string;
  status: string;
  priority: "Highest" | "High" | "Medium" | "Low" | "Lowest";
  assignee: {
    name: string;
    avatar: string;
  };
  type: "Story" | "Bug" | "Task" | "Epic" | "Subtask";
}

export function JiraIssueCard({ title, issueKey, status, priority, assignee, type }: JiraIssueCardProps) {
  const typeColors = {
    Story: "bg-[#63ba3c]",
    Bug: "bg-[#e34935]",
    Task: "bg-[#4bade8]",
    Epic: "bg-[#904ee2]",
    Subtask: "bg-[#4bade8]"
  };

  return (
    <div className="bg-white border border-[#dfe1e6] rounded p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-4 h-4 rounded ${typeColors[type]}`}></div>
          <span className="text-xs text-[#5e6c84] uppercase tracking-wide">{issueKey}</span>
        </div>
        <JiraPriorityIcon priority={priority} />
      </div>
      
      <h4 className="text-[#172b4d] mb-3 leading-tight">{title}</h4>
      
      <div className="flex items-center justify-between">
        <JiraStatusBadge status={status} />
        <JiraAvatar name={assignee.name} initials={assignee.avatar} size="sm" />
      </div>
    </div>
  );
}