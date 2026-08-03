import { X, Plus, Hash, User, Flag, Calendar } from "lucide-react";
import { useState } from "react";
import { JiraButton } from "./JiraButton";
import { JiraInput } from "./JiraInput";
import { JiraSelect } from "./JiraSelect";
import { JiraAvatar } from "./JiraAvatar";

interface JiraQuickAddProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JiraQuickAdd({ isOpen, onClose }: JiraQuickAddProps) {
  const [issueType, setIssueType] = useState("story");
  const [title, setTitle] = useState("");
  const [project, setProject] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState("medium");

  const issueTypes = [
    { value: "story", label: "Story", color: "bg-[#63ba3c]" },
    { value: "bug", label: "Bug", color: "bg-[#e34935]" },
    { value: "task", label: "Task", color: "bg-[#4bade8]" },
    { value: "epic", label: "Epic", color: "bg-[#904ee2]" }
  ];

  const projects = [
    { value: "proj-alpha", label: "Project Alpha" },
    { value: "proj-beta", label: "Project Beta" },
    { value: "proj-gamma", label: "Project Gamma" }
  ];

  const assignees = [
    { value: "john-doe", label: "John Doe" },
    { value: "jane-smith", label: "Jane Smith" },
    { value: "bob-wilson", label: "Bob Wilson" }
  ];

  const priorities = [
    { value: "highest", label: "Highest" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
    { value: "lowest", label: "Lowest" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating issue:", { issueType, title, project, assignee, priority });
    onClose();
    // Reset form
    setIssueType("story");
    setTitle("");
    setProject("");
    setAssignee("");
    setPriority("medium");
  };

  if (!isOpen) return null;

  const selectedIssueType = issueTypes.find(type => type.value === issueType);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-lg shadow-2xl z-50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#dfe1e6]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#0052cc] rounded-lg">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg text-[#172b4d]">Create Issue</h2>
              <p className="text-sm text-[#5e6c84]">Quickly create a new issue</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#f4f5f7] rounded"
          >
            <X className="w-4 h-4 text-[#5e6c84]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Issue Type */}
          <div>
            <label className="block text-sm text-[#5e6c84] mb-2">Issue Type</label>
            <div className="grid grid-cols-2 gap-2">
              {issueTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setIssueType(type.value)}
                  className={`
                    flex items-center space-x-2 p-3 rounded border transition-colors
                    ${issueType === type.value
                      ? 'border-[#0052cc] bg-[#deebff]'
                      : 'border-[#dfe1e6] hover:bg-[#f4f5f7]'
                    }
                  `}
                >
                  <div className={`w-4 h-4 rounded ${type.color}`}></div>
                  <span className="text-sm text-[#172b4d]">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <JiraInput
            label="Summary *"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          {/* Project */}
          <JiraSelect
            label="Project *"
            options={projects}
            placeholder="Select project"
            value={project}
            onChange={setProject}
          />

          {/* Assignee */}
          <JiraSelect
            label="Assignee"
            options={[
              { value: "", label: "Unassigned" },
              ...assignees
            ]}
            placeholder="Assign to someone"
            value={assignee}
            onChange={setAssignee}
          />

          {/* Priority */}
          <JiraSelect
            label="Priority"
            options={priorities}
            value={priority}
            onChange={setPriority}
          />

          {/* Quick Actions */}
          <div className="flex items-center space-x-4 pt-2">
            <button
              type="button"
              className="flex items-center space-x-2 text-sm text-[#5e6c84] hover:text-[#172b4d]"
            >
              <Calendar className="w-4 h-4" />
              <span>Set due date</span>
            </button>
            <button
              type="button"
              className="flex items-center space-x-2 text-sm text-[#5e6c84] hover:text-[#172b4d]"
            >
              <Flag className="w-4 h-4" />
              <span>Add labels</span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end space-x-2 p-6 border-t border-[#dfe1e6] bg-[#f4f5f7]">
          <JiraButton variant="secondary" onClick={onClose}>
            Cancel
          </JiraButton>
          <JiraButton 
            variant="primary" 
            onClick={handleSubmit}
            disabled={!title || !project}
          >
            Create Issue
          </JiraButton>
        </div>
      </div>
    </>
  );
}