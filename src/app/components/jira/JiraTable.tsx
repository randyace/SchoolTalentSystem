import { 
  ChevronUp, 
  ChevronDown, 
  MoreHorizontal, 
  Filter, 
  Columns3, 
  Download,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  ArrowUpDown,
  Search,
  X
} from "lucide-react";
import { useState, useMemo } from "react";
import { JiraStatusBadge } from "./JiraStatusBadge";
import { JiraPriorityIcon } from "./JiraPriorityIcon";
import { JiraAvatar } from "./JiraAvatar";
import { JiraButton } from "./JiraButton";
import { JiraInput } from "./JiraInput";
import { JiraSelect } from "./JiraSelect";
import { JiraMoreButton } from "./JiraMoreButton";
import { JiraTooltip } from "./JiraTooltip";

interface Issue {
  key: string;
  type: "Story" | "Bug" | "Task" | "Epic" | "Subtask";
  title: string;
  status: string;
  priority: "Highest" | "High" | "Medium" | "Low" | "Lowest";
  assignee: { name: string; initials: string };
  reporter: { name: string; initials: string };
  created: string;
  updated: string;
  labels?: string[];
  storyPoints?: number;
  timeTracking?: { original: string; remaining: string; logged: string };
}

type SortField = keyof Issue;
type SortDirection = "asc" | "desc";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  visible: boolean;
  width?: string;
}

const defaultColumns: Column[] = [
  { key: "select", label: "", visible: true, width: "w-12" },
  { key: "type", label: "Type", sortable: true, visible: true, width: "w-20" },
  { key: "key", label: "Key", sortable: true, visible: true, width: "w-28" },
  { key: "title", label: "Summary", sortable: true, visible: true, width: "flex-1 min-w-64" },
  { key: "status", label: "Status", sortable: true, visible: true, width: "w-32" },
  { key: "priority", label: "Priority", sortable: true, visible: true, width: "w-24" },
  { key: "assignee", label: "Assignee", sortable: true, visible: true, width: "w-32" },
  { key: "reporter", label: "Reporter", sortable: true, visible: false, width: "w-32" },
  { key: "created", label: "Created", sortable: true, visible: true, width: "w-28" },
  { key: "updated", label: "Updated", sortable: true, visible: true, width: "w-28" },
  { key: "storyPoints", label: "Story Points", sortable: true, visible: false, width: "w-24" },
  { key: "actions", label: "", visible: true, width: "w-12" }
];

export function JiraTable() {
  const [issues] = useState<Issue[]>([
    {
      key: "PROJ-123",
      type: "Story",
      title: "Update user authentication flow",
      status: "In Progress",
      priority: "High",
      assignee: { name: "John Doe", initials: "JD" },
      reporter: { name: "Jane Smith", initials: "JS" },
      created: "2 days ago",
      updated: "1 hour ago",
      labels: ["authentication", "security"],
      storyPoints: 8,
      timeTracking: { original: "2d", remaining: "1d", logged: "1d" }
    },
    {
      key: "PROJ-124",
      type: "Bug",
      title: "Fix login page responsiveness on mobile devices",
      status: "To Do",
      priority: "Medium",
      assignee: { name: "Jane Smith", initials: "JS" },
      reporter: { name: "Bob Wilson", initials: "BW" },
      created: "1 day ago",
      updated: "3 hours ago",
      labels: ["ui", "mobile"],
      storyPoints: 3
    },
    {
      key: "PROJ-125",
      type: "Task",
      title: "Update API documentation for v2.0",
      status: "Done",
      priority: "Low",
      assignee: { name: "Alice Brown", initials: "AB" },
      reporter: { name: "John Doe", initials: "JD" },
      created: "3 days ago",
      updated: "2 days ago",
      labels: ["documentation"],
      storyPoints: 2
    },
    {
      key: "PROJ-126",
      type: "Epic",
      title: "Implement new dashboard design system",
      status: "In Progress",
      priority: "Highest",
      assignee: { name: "Bob Wilson", initials: "BW" },
      reporter: { name: "Alice Brown", initials: "AB" },
      created: "1 week ago",
      updated: "5 hours ago",
      labels: ["design-system", "dashboard"],
      storyPoints: 21
    },
    {
      key: "PROJ-127",
      type: "Subtask",
      title: "Create wireframes for dashboard components",
      status: "In Review",
      priority: "High",
      assignee: { name: "Alice Brown", initials: "AB" },
      reporter: { name: "Bob Wilson", initials: "BW" },
      created: "5 days ago",
      updated: "1 day ago",
      labels: ["design", "wireframes"],
      storyPoints: 5
    }
  ]);

  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  const [sortField, setSortField] = useState<SortField>("updated");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showColumnManager, setShowColumnManager] = useState(false);

  const typeColors = {
    Story: "bg-[#63ba3c]",
    Bug: "bg-[#e34935]",
    Task: "bg-[#4bade8]",
    Epic: "bg-[#904ee2]",
    Subtask: "bg-[#4bade8]"
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = () => {
    if (selectedIssues.size === filteredAndSortedIssues.length) {
      setSelectedIssues(new Set());
    } else {
      setSelectedIssues(new Set(filteredAndSortedIssues.map(issue => issue.key)));
    }
  };

  const handleSelectIssue = (issueKey: string) => {
    const newSelected = new Set(selectedIssues);
    if (newSelected.has(issueKey)) {
      newSelected.delete(issueKey);
    } else {
      newSelected.add(issueKey);
    }
    setSelectedIssues(newSelected);
  };

  const toggleColumnVisibility = (columnKey: string) => {
    setColumns(prev => prev.map(col => 
      col.key === columnKey ? { ...col, visible: !col.visible } : col
    ));
  };

  const filteredAndSortedIssues = useMemo(() => {
    let filtered = issues;
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(issue => 
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.key.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(issue => issue.status === statusFilter);
    }
    
    // Sort
    return filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === "asc" ? comparison : -comparison;
      }
      
      if (typeof aValue === "number" && typeof bValue === "number") {
        const comparison = aValue - bValue;
        return sortDirection === "asc" ? comparison : -comparison;
      }
      
      return 0;
    });
  }, [issues, searchQuery, statusFilter, sortField, sortDirection]);

  const visibleColumns = columns.filter(col => col.visible);

  const renderCell = (issue: Issue, columnKey: string) => {
    switch (columnKey) {
      case "select":
        return (
          <button
            onClick={() => handleSelectIssue(issue.key)}
            className="p-1 hover:bg-[#f4f5f7] rounded"
          >
            {selectedIssues.has(issue.key) ? (
              <CheckSquare className="w-4 h-4 text-[#0c66e4]" />
            ) : (
              <Square className="w-4 h-4 text-[#5e6c84]" />
            )}
          </button>
        );
      
      case "type":
        return (
          <JiraTooltip content={issue.type}>
            <div className={`w-4 h-4 rounded ${typeColors[issue.type]}`} />
          </JiraTooltip>
        );
      
      case "key":
        return (
          <button className="text-[#0c66e4] hover:underline text-sm font-medium">
            {issue.key}
          </button>
        );
      
      case "title":
        return (
          <div className="min-w-0 flex-1">
            <div className="text-[#172b4d] text-sm truncate" title={issue.title}>
              {issue.title}
            </div>
            {issue.labels && issue.labels.length > 0 && (
              <div className="flex gap-1 mt-1">
                {issue.labels.slice(0, 2).map((label, index) => (
                  <span 
                    key={index}
                    className="inline-block bg-[#f4f5f7] text-[#5e6c84] text-xs px-2 py-0.5 rounded-full"
                  >
                    {label}
                  </span>
                ))}
                {issue.labels.length > 2 && (
                  <span className="text-xs text-[#5e6c84]">
                    +{issue.labels.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      
      case "status":
        return <JiraStatusBadge status={issue.status} />;
      
      case "priority":
        return <JiraPriorityIcon priority={issue.priority} />;
      
      case "assignee":
        return (
          <JiraTooltip content={issue.assignee.name}>
            <div>
              <JiraAvatar 
                name={issue.assignee.name} 
                initials={issue.assignee.initials} 
                size="sm" 
              />
            </div>
          </JiraTooltip>
        );
      
      case "reporter":
        return (
          <JiraTooltip content={issue.reporter.name}>
            <div>
              <JiraAvatar 
                name={issue.reporter.name} 
                initials={issue.reporter.initials} 
                size="sm" 
              />
            </div>
          </JiraTooltip>
        );
      
      case "created":
      case "updated":
        return (
          <span className="text-[#5e6c84] text-sm">
            {issue[columnKey as keyof Issue]}
          </span>
        );
      
      case "storyPoints":
        return issue.storyPoints ? (
          <span className="text-[#172b4d] text-sm font-medium">
            {issue.storyPoints}
          </span>
        ) : (
          <span className="text-[#5e6c84] text-sm">-</span>
        );
      
      case "actions":
        return <JiraMoreButton size="sm" />;
      
      default:
        return null;
    }
  };

  const allStatuses = [...new Set(issues.map(issue => issue.status))];

  return (
    <div className="bg-white rounded-lg border border-[#dfe1e6] overflow-hidden">
      {/* Table Header Actions */}
      <div className="flex items-center justify-between p-4 border-b border-[#f4f5f7]">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5e6c84]" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-[#dfe1e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0c66e4] focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#5e6c84] hover:text-[#172b4d]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <JiraSelect
            options={[
              { value: "", label: "All statuses" },
              ...allStatuses.map(status => ({ value: status, label: status }))
            ]}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            placeholder="Filter by status"
          />
        </div>

        <div className="flex items-center space-x-2">
          {selectedIssues.size > 0 && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-[#e9f2ff] rounded-lg">
              <span className="text-sm text-[#0c66e4]">
                {selectedIssues.size} selected
              </span>
              <JiraButton variant="link" size="sm">
                Bulk edit
              </JiraButton>
            </div>
          )}
          
          <JiraTooltip content="Export table">
            <JiraButton variant="subtle" size="sm">
              <Download className="w-4 h-4" />
            </JiraButton>
          </JiraTooltip>
          
          <JiraTooltip content="Configure columns">
            <JiraButton 
              variant="subtle" 
              size="sm"
              onClick={() => setShowColumnManager(!showColumnManager)}
            >
              <Columns3 className="w-4 h-4" />
            </JiraButton>
          </JiraTooltip>
        </div>
      </div>

      {/* Column Manager */}
      {showColumnManager && (
        <div className="p-4 bg-[#f4f5f7] border-b border-[#dfe1e6]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm text-[#172b4d]">Configure Columns</h4>
            <button
              onClick={() => setShowColumnManager(false)}
              className="p-1 hover:bg-[#e4e6ea] rounded"
            >
              <X className="w-4 h-4 text-[#5e6c84]" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {columns.filter(col => col.key !== "select" && col.key !== "actions").map((column) => (
              <label key={column.key} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={column.visible}
                  onChange={() => toggleColumnVisibility(column.key)}
                  className="w-4 h-4 text-[#0c66e4] border-[#dfe1e6] rounded focus:ring-[#0c66e4]"
                />
                <span className="text-sm text-[#172b4d]">{column.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#dfe1e6] bg-[#f4f5f7]">
              {visibleColumns.map((column) => (
                <th
                  key={column.key}
                  className={`text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide ${column.width || ""}`}
                >
                  {column.key === "select" ? (
                    <button
                      onClick={handleSelectAll}
                      className="p-1 hover:bg-[#e4e6ea] rounded"
                    >
                      {selectedIssues.size === filteredAndSortedIssues.length && filteredAndSortedIssues.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-[#0c66e4]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#5e6c84]" />
                      )}
                    </button>
                  ) : column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key as SortField)}
                      className="flex items-center space-x-1 hover:text-[#172b4d] transition-colors"
                    >
                      <span>{column.label}</span>
                      {sortField === column.key ? (
                        sortDirection === "asc" ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                      )}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedIssues.map((issue) => (
              <tr
                key={issue.key}
                className={`
                  border-b border-[#f4f5f7] hover:bg-[#f4f5f7] transition-colors
                  ${selectedIssues.has(issue.key) ? "bg-[#e9f2ff]/50" : ""}
                `}
              >
                {visibleColumns.map((column) => (
                  <td key={column.key} className="py-3 px-3">
                    {renderCell(issue, column.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedIssues.length === 0 && (
        <div className="text-center py-12">
          <div className="text-[#5e6c84] mb-2">No issues found</div>
          <div className="text-sm text-[#8993a4]">
            Try adjusting your search or filter criteria
          </div>
        </div>
      )}

      {/* Table Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#f4f5f7] bg-[#fafbfc]">
        <div className="text-sm text-[#5e6c84]">
          Showing {filteredAndSortedIssues.length} of {issues.length} issues
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-[#5e6c84]">Rows per page:</span>
          <select className="border border-[#dfe1e6] rounded px-2 py-1 text-sm">
            <option>25</option>
            <option>50</option>
            <option>100</option>
          </select>
        </div>
      </div>
    </div>
  );
}