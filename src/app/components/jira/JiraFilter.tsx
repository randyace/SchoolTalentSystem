import { X, Filter } from "lucide-react";
import { JiraButton } from "./JiraButton";
import { JiraSelect } from "./JiraSelect";
import { JiraInput } from "./JiraInput";

export function JiraFilter() {
  const projects = [
    { value: "all", label: "All Projects" },
    { value: "proj1", label: "Project Alpha" },
    { value: "proj2", label: "Project Beta" }
  ];

  const statuses = [
    { value: "all", label: "All Statuses" },
    { value: "todo", label: "To Do" },
    { value: "inprogress", label: "In Progress" },
    { value: "done", label: "Done" }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-[#5e6c84]" />
          <span className="text-sm text-[#172b4d]">Filters</span>
        </div>
        <JiraButton variant="link" size="sm">Clear all</JiraButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <JiraInput placeholder="Search issues..." />
        <JiraSelect options={projects} placeholder="Project" />
        <JiraSelect options={statuses} placeholder="Status" />
        <JiraButton variant="secondary">
          More filters
        </JiraButton>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center bg-[#deebff] text-[#0052cc] px-2 py-1 rounded text-sm">
          <span>Assignee: John Doe</span>
          <button className="ml-2 hover:bg-[#b3d4ff] rounded">
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center bg-[#deebff] text-[#0052cc] px-2 py-1 rounded text-sm">
          <span>Priority: High</span>
          <button className="ml-2 hover:bg-[#b3d4ff] rounded">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}