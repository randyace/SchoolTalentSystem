import { 
  ChevronRight, 
  ChevronDown, 
  Home, 
  FolderOpen, 
  Settings,
  Star,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Users,
  Calendar,
  BarChart3,
  Target,
  Workflow,
  GitBranch,
  Layers3,
  Archive,
  Bug,
  FileText,
  Clock,
  PieChart,
  Zap,
  Bookmark
} from "lucide-react";
import { useState } from "react";
import { JiraTooltip } from "./JiraTooltip";
import { Card } from "../ui/card";

interface TreeNode {
  id: string;
  label: string;
  icon?: any;
  type: "folder" | "item" | "action";
  children?: TreeNode[];
  badge?: number;
  active?: boolean;
  favorite?: boolean;
  color?: string;
  description?: string;
}

interface JiraNavigationHierarchyProps {
  showBreadcrumb?: boolean;
  compact?: boolean;
}

export function JiraNavigationHierarchy({ 
  showBreadcrumb = true, 
  compact = false 
}: JiraNavigationHierarchyProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(["projects", "project-alpha", "issues-filters", "reports"])
  );
  const [selectedNode, setSelectedNode] = useState<string>("board");
  const [navigationPath, setNavigationPath] = useState<string[]>(["Your work", "Projects", "Project Alpha", "Board"]);

  const navigationTree: TreeNode[] = [
    {
      id: "your-work",
      label: "Your work",
      icon: Home,
      type: "folder",
      children: [
        { id: "assigned-to-me", label: "Assigned to me", icon: Users, type: "item", badge: 5 },
        { id: "recent-issues", label: "Recent issues", icon: Clock, type: "item" },
        { id: "created-recently", label: "Created recently", icon: Plus, type: "item", badge: 2 },
        { id: "resolved-recently", label: "Resolved recently", icon: Archive, type: "item" },
        { id: "updated-recently", label: "Updated recently", icon: FileText, type: "item", badge: 8 }
      ]
    },
    {
      id: "projects",
      label: "Projects",
      icon: FolderOpen,
      type: "folder",
      children: [
        {
          id: "starred-projects",
          label: "Starred",
          icon: Star,
          type: "folder",
          children: [
            {
              id: "project-alpha",
              label: "Project Alpha",
              type: "folder",
              color: "bg-[#0052cc]",
              favorite: true,
              children: [
                { id: "board", label: "Board", icon: Layers3, type: "item", active: true },
                { id: "backlog", label: "Backlog", icon: Archive, type: "item" },
                { id: "timeline", label: "Timeline", icon: Calendar, type: "item" },
                {
                  id: "issues-filters",
                  label: "Issues and filters",
                  icon: Filter,
                  type: "folder",
                  children: [
                    { id: "search-issues", label: "Search for issues", icon: Search, type: "item" },
                    { id: "all-issues", label: "All issues", icon: FileText, type: "item", badge: 23 },
                    { id: "my-open-issues", label: "My open issues", icon: Bug, type: "item", badge: 5 },
                    { id: "reported-by-me", label: "Reported by me", icon: Users, type: "item", badge: 2 },
                    { id: "recently-viewed", label: "Recently viewed", icon: Clock, type: "item" }
                  ]
                },
                {
                  id: "reports",
                  label: "Reports",
                  icon: BarChart3,
                  type: "folder",
                  children: [
                    { id: "burnup-chart", label: "Burnup Chart", icon: PieChart, type: "item" },
                    { id: "velocity-chart", label: "Velocity Chart", icon: BarChart3, type: "item" },
                    { id: "sprint-report", label: "Sprint Report", icon: Clock, type: "item" },
                    { id: "version-report", label: "Version Report", icon: GitBranch, type: "item" }
                  ]
                },
                {
                  id: "project-settings",
                  label: "Project settings",
                  icon: Settings,
                  type: "folder",
                  children: [
                    { id: "access", label: "Access", icon: Users, type: "item" },
                    { id: "workflows", label: "Workflows", icon: Workflow, type: "item" },
                    { id: "automation", label: "Automation", icon: Zap, type: "item" },
                    { id: "issue-types", label: "Issue types", icon: Archive, type: "item" }
                  ]
                }
              ]
            },
            {
              id: "design-system",
              label: "Design System",
              type: "folder",
              color: "bg-[#6554c0]",
              favorite: true,
              children: [
                { id: "ds-board", label: "Board", icon: Layers3, type: "item" },
                { id: "ds-backlog", label: "Backlog", icon: Archive, type: "item" },
                { id: "ds-timeline", label: "Timeline", icon: Calendar, type: "item" }
              ]
            }
          ]
        },
        {
          id: "recent-projects",
          label: "Recent",
          icon: Clock,
          type: "folder",
          children: [
            {
              id: "project-beta",
              label: "Project Beta",
              type: "folder",
              color: "bg-[#36b37e]",
              children: [
                { id: "beta-board", label: "Board", icon: Layers3, type: "item" },
                { id: "beta-backlog", label: "Backlog", icon: Archive, type: "item" }
              ]
            },
            {
              id: "project-gamma",
              label: "Project Gamma",
              type: "folder",
              color: "bg-[#ff5630]",
              children: [
                { id: "gamma-board", label: "Board", icon: Layers3, type: "item" },
                { id: "gamma-backlog", label: "Backlog", icon: Archive, type: "item" }
              ]
            }
          ]
        },
        { id: "view-all-projects", label: "View all projects", type: "action" }
      ]
    },
    {
      id: "filters",
      label: "Filters",
      icon: Filter,
      type: "folder",
      children: [
        { id: "my-filters", label: "My filters", icon: Bookmark, type: "item" },
        { id: "shared-filters", label: "Shared with me", icon: Users, type: "item", badge: 3 },
        { id: "create-filter", label: "Create filter", icon: Plus, type: "action" }
      ]
    },
    {
      id: "dashboards",
      label: "Dashboards",
      icon: BarChart3,
      type: "folder",
      children: [
        { id: "system-dashboard", label: "System Dashboard", icon: BarChart3, type: "item" },
        { id: "my-dashboard", label: "My Dashboard", icon: Target, type: "item" },
        { id: "create-dashboard", label: "Create dashboard", icon: Plus, type: "action" }
      ]
    }
  ];

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const selectNode = (nodeId: string, nodePath: string[]) => {
    setSelectedNode(nodeId);
    setNavigationPath(nodePath);
  };

  const renderTreeNode = (node: TreeNode, level: number = 0, parentPath: string[] = []): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const currentPath = [...parentPath, node.label];
    
    const itemClass = `
      flex items-center justify-between px-3 py-1.5 rounded text-sm transition-colors cursor-pointer group
      ${isSelected 
        ? 'bg-[#deebff] text-[#0052cc]' 
        : 'text-[#5e6c84] hover:bg-[#ebecf0] hover:text-[#172b4d]'
      }
      ${compact ? 'py-1' : 'py-1.5'}
    `;

    const indentStyle = { paddingLeft: `${level * 20 + 12}px` };

    return (
      <div key={node.id}>
        <div
          className={itemClass}
          style={indentStyle}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id);
            }
            if (node.type === "item") {
              selectNode(node.id, currentPath);
            }
          }}
        >
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            {hasChildren && (
              <div className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </div>
            )}
            
            {node.color ? (
              <div className={`w-4 h-4 rounded ${node.color} flex-shrink-0`} />
            ) : node.icon ? (
              <node.icon className="w-4 h-4 flex-shrink-0" />
            ) : (
              <div className="w-4 h-4 flex-shrink-0" />
            )}
            
            <span className="truncate flex-1">{node.label}</span>
            
            {node.badge && (
              <span className="bg-[#dfe1e6] text-[#5e6c84] text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">
                {node.badge}
              </span>
            )}
            
            {node.favorite && (
              <Star className="w-3 h-3 text-[#f79009] flex-shrink-0" />
            )}
          </div>

          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 flex-shrink-0">
            {node.type === "action" && (
              <Plus className="w-3 h-3" />
            )}
            <JiraTooltip content="More actions">
              <MoreHorizontal className="w-3 h-3" />
            </JiraTooltip>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {node.children!.map(child => renderTreeNode(child, level + 1, currentPath))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-80 h-96 flex flex-col">
      {/* Breadcrumb */}
      {showBreadcrumb && (
        <div className="p-3 border-b border-[#f4f5f7]">
          <div className="text-xs text-[#5e6c84] flex items-center space-x-1">
            {navigationPath.map((segment, index) => (
              <div key={index} className="flex items-center space-x-1">
                {index > 0 && <ChevronRight className="w-3 h-3" />}
                <span className={index === navigationPath.length - 1 ? "text-[#172b4d]" : ""}>
                  {segment}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-0.5">
          {navigationTree.map(node => renderTreeNode(node))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-[#f4f5f7] bg-[#fafbfc]">
        <div className="flex items-center justify-between text-sm">
          <button className="text-[#0052cc] hover:underline">
            Collapse all
          </button>
          <button className="text-[#0052cc] hover:underline">
            Expand all
          </button>
        </div>
      </div>
    </Card>
  );
}

// Compact navigation for use in smaller spaces
export function JiraCompactNavigation() {
  return (
    <JiraNavigationHierarchy showBreadcrumb={false} compact={true} />
  );
}

// Navigation breadcrumb component
export function JiraNavigationBreadcrumb({ 
  path = ["Your work", "Projects", "Project Alpha", "Board"]
}: { 
  path?: string[] 
}) {
  return (
    <div className="flex items-center space-x-1 text-sm text-[#5e6c84] p-2 bg-[#f4f5f7] border border-[#dfe1e6] rounded-lg">
      <Home className="w-4 h-4" />
      {path.map((segment, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="w-3 h-3" />
          <button 
            className={`hover:text-[#172b4d] transition-colors ${
              index === path.length - 1 ? "text-[#172b4d] font-medium" : ""
            }`}
          >
            {segment}
          </button>
        </div>
      ))}
    </div>
  );
}