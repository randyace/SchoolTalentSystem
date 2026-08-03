import { Plus, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { JiraIssueCard } from "./JiraIssueCard";
import { JiraMoreButton } from "./JiraMoreButton";

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  issues: Array<{
    id: string;
    title: string;
    issueKey: string;
    priority: "Highest" | "High" | "Medium" | "Low" | "Lowest";
    assignee: { name: string; avatar: string };
    type: "Story" | "Bug" | "Task" | "Epic" | "Subtask";
  }>;
}

export function JiraKanbanBoard() {
  const [columns, setColumns] = useState<KanbanColumn[]>([
    {
      id: "todo",
      title: "To Do",
      color: "bg-[#dfe1e6]",
      issues: [
        {
          id: "1",
          title: "Fix login page responsiveness",
          issueKey: "PROJ-124",
          priority: "Medium",
          assignee: { name: "Jane Smith", avatar: "JS" },
          type: "Bug"
        },
        {
          id: "2",
          title: "Add new dashboard widgets",
          issueKey: "PROJ-125",
          priority: "Low",
          assignee: { name: "Bob Wilson", avatar: "BW" },
          type: "Task"
        }
      ]
    },
    {
      id: "inprogress",
      title: "In Progress",
      color: "bg-[#0052cc]",
      issues: [
        {
          id: "3",
          title: "Update user authentication flow",
          issueKey: "PROJ-123",
          priority: "High",
          assignee: { name: "John Doe", avatar: "JD" },
          type: "Story"
        }
      ]
    },
    {
      id: "review",
      title: "In Review",
      color: "bg-[#ffab00]",
      issues: [
        {
          id: "4",
          title: "Implement dark mode toggle",
          issueKey: "PROJ-126",
          priority: "Medium",
          assignee: { name: "Alice Brown", avatar: "AB" },
          type: "Story"
        }
      ]
    },
    {
      id: "done",
      title: "Done",
      color: "bg-[#36b37e]",
      issues: [
        {
          id: "5",
          title: "Update documentation",
          issueKey: "PROJ-127",
          priority: "Low",
          assignee: { name: "Jane Smith", avatar: "JS" },
          type: "Task"
        },
        {
          id: "6",
          title: "Fix header navigation bug",
          issueKey: "PROJ-128",
          priority: "High",
          assignee: { name: "John Doe", avatar: "JD" },
          type: "Bug"
        }
      ]
    }
  ]);

  return (
    <div className="h-full bg-[#f4f5f7] p-6">
      <div className="flex space-x-4 h-full overflow-x-auto">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-80 bg-white rounded-lg shadow-sm border border-[#dfe1e6] flex flex-col"
          >
            {/* Column Header */}
            <div className="p-4 border-b border-[#f4f5f7]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${column.color}`}></div>
                  <h3 className="text-sm text-[#172b4d] uppercase tracking-wide">
                    {column.title}
                  </h3>
                  <span className="text-xs text-[#5e6c84] bg-[#f4f5f7] px-2 py-1 rounded-full">
                    {column.issues.length}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <button className="p-1 hover:bg-[#f4f5f7] rounded">
                    <Plus className="w-4 h-4 text-[#5e6c84]" />
                  </button>
                  <JiraMoreButton size="sm" />
                </div>
              </div>
            </div>

            {/* Column Issues */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {column.issues.map((issue) => (
                <div key={issue.id} className="transform hover:scale-[1.02] transition-transform">
                  <JiraIssueCard
                    title={issue.title}
                    issueKey={issue.issueKey}
                    status={column.title}
                    priority={issue.priority}
                    assignee={issue.assignee}
                    type={issue.type}
                  />
                </div>
              ))}
              
              {/* Add Issue Button */}
              <button className="w-full p-4 border-2 border-dashed border-[#dfe1e6] rounded text-[#5e6c84] hover:border-[#0052cc] hover:text-[#0052cc] hover:bg-[#deebff]/30 transition-colors">
                <Plus className="w-4 h-4 mx-auto mb-1" />
                <span className="text-sm">Create issue</span>
              </button>
            </div>
          </div>
        ))}
        
        {/* Add Column */}
        <div className="flex-shrink-0 w-80">
          <button className="w-full h-32 border-2 border-dashed border-[#dfe1e6] rounded-lg text-[#5e6c84] hover:border-[#0052cc] hover:text-[#0052cc] hover:bg-[#deebff]/30 transition-colors flex flex-col items-center justify-center">
            <Plus className="w-6 h-6 mb-2" />
            <span className="text-sm">Add column</span>
          </button>
        </div>
      </div>
    </div>
  );
}