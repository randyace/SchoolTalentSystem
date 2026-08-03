import { 
  ChevronDown, 
  ChevronRight, 
  Home, 
  FolderOpen, 
  Settings, 
  Users, 
  BarChart3,
  Search,
  Filter,
  Calendar,
  Target,
  Layers3,
  GitBranch,
  Bug,
  FileText,
  Zap,
  Archive,
  Star,
  Clock,
  Plus,
  MoreHorizontal,
  Shield,
  Database,
  Globe,
  Smartphone,
  Monitor,
  Code,
  Palette,
  HelpCircle
} from "lucide-react";
import { useState, ReactNode } from "react";
import { JiraButton } from "./JiraButton";
import { JiraTooltip } from "./JiraTooltip";
import { JiraAvatar } from "./JiraAvatar";
import { Card } from "../ui/card";

interface AccordionItem {
  id: string;
  title: string;
  icon?: any;
  badge?: number | string;
  children?: AccordionItem[];
  action?: ReactNode;
  description?: string;
  active?: boolean;
}

interface JiraAccordionMenuProps {
  items: AccordionItem[];
  variant?: "default" | "compact" | "detailed";
  allowMultiple?: boolean;
  showIcons?: boolean;
  onItemClick?: (item: AccordionItem) => void;
}

export function JiraAccordionMenu({
  items,
  variant = "default",
  allowMultiple = false,
  showIcons = true,
  onItemClick
}: JiraAccordionMenuProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    
    if (allowMultiple) {
      if (newExpanded.has(itemId)) {
        newExpanded.delete(itemId);
      } else {
        newExpanded.add(itemId);
      }
    } else {
      if (newExpanded.has(itemId)) {
        newExpanded.clear();
      } else {
        newExpanded.clear();
        newExpanded.add(itemId);
      }
    }
    
    setExpandedItems(newExpanded);
  };

  const renderItem = (item: AccordionItem, level: number = 0): ReactNode => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const indentClass = level > 0 ? `ml-${level * 4}` : '';

    return (
      <div key={item.id} className="border-b border-[#f4f5f7] last:border-b-0">
        <div
          className={`
            flex items-center justify-between p-3 cursor-pointer transition-colors
            ${item.active ? 'bg-[#deebff] text-[#0052cc]' : 'hover:bg-[#f4f5f7]'}
            ${variant === 'compact' ? 'p-2' : 'p-3'}
            ${indentClass}
          `}
          onClick={() => {
            if (hasChildren) {
              toggleItem(item.id);
            }
            onItemClick?.(item);
          }}
        >
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {hasChildren && (
              <div className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-[#5e6c84]" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#5e6c84]" />
                )}
              </div>
            )}
            
            {showIcons && item.icon && (
              <item.icon className={`w-4 h-4 flex-shrink-0 ${
                item.active ? 'text-[#0052cc]' : 'text-[#5e6c84]'
              }`} />
            )}
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span className={`text-sm truncate ${
                  item.active ? 'text-[#0052cc] font-medium' : 'text-[#172b4d]'
                }`}>
                  {item.title}
                </span>
                
                {item.badge && (
                  <span className={`
                    text-xs px-2 py-0.5 rounded-full flex-shrink-0
                    ${typeof item.badge === 'number' 
                      ? 'bg-[#dfe1e6] text-[#5e6c84]' 
                      : 'bg-[#e9f2ff] text-[#0747a6]'
                    }
                  `}>
                    {item.badge}
                  </span>
                )}
              </div>
              
              {variant === 'detailed' && item.description && (
                <div className="text-xs text-[#5e6c84] mt-1 truncate">
                  {item.description}
                </div>
              )}
            </div>
          </div>

          {item.action && (
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {item.action}
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="bg-[#fafbfc]">
            {item.children!.map(child => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border border-[#dfe1e6] rounded-lg overflow-hidden bg-white">
      {items.map(item => renderItem(item))}
    </div>
  );
}

// Project navigation accordion
export function JiraProjectAccordion() {
  const projectItems: AccordionItem[] = [
    {
      id: "your-work",
      title: "Your work",
      icon: Home,
      badge: 8,
      description: "Issues assigned to you",
      children: [
        { id: "assigned", title: "Assigned to me", icon: Users, badge: 5 },
        { id: "reported", title: "Reported by me", icon: FileText, badge: 3 },
        { id: "recent", title: "Recently viewed", icon: Clock }
      ]
    },
    {
      id: "projects",
      title: "Projects",
      icon: FolderOpen,
      description: "All project spaces",
      children: [
        {
          id: "starred",
          title: "Starred",
          icon: Star,
          children: [
            { 
              id: "project-alpha", 
              title: "Project Alpha", 
              badge: "Active",
              action: <JiraTooltip content="Project settings"><Settings className="w-4 h-4 text-[#5e6c84]" /></JiraTooltip>
            },
            { 
              id: "design-system", 
              title: "Design System", 
              badge: "Active",
              action: <JiraTooltip content="Project settings"><Settings className="w-4 h-4 text-[#5e6c84]" /></JiraTooltip>
            }
          ]
        },
        {
          id: "recent-projects",
          title: "Recent",
          icon: Clock,
          children: [
            { id: "project-beta", title: "Project Beta" },
            { id: "project-gamma", title: "Project Gamma" }
          ]
        }
      ]
    },
    {
      id: "filters",
      title: "Filters",
      icon: Filter,
      description: "Saved search filters",
      children: [
        { id: "my-filters", title: "My filters", badge: 4 },
        { id: "shared-filters", title: "Shared with me", badge: 2 },
        { 
          id: "create-filter", 
          title: "Create filter", 
          icon: Plus,
          action: <JiraButton variant="subtle" size="sm">Create</JiraButton>
        }
      ]
    },
    {
      id: "dashboards",
      title: "Dashboards",
      icon: BarChart3,
      description: "Project dashboards and reports",
      children: [
        { id: "system-dashboard", title: "System Dashboard", active: true },
        { id: "team-dashboard", title: "Team Dashboard" },
        { id: "custom-dashboard", title: "Custom Dashboard" }
      ]
    }
  ];

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 border-b border-[#dfe1e6] bg-[#f4f5f7]">
        <h3 className="text-[#172b4d] font-medium">Project Navigation</h3>
      </div>
      <JiraAccordionMenu 
        items={projectItems} 
        variant="detailed"
        allowMultiple={true}
      />
    </Card>
  );
}

// Settings accordion
export function JiraSettingsAccordion() {
  const settingsItems: AccordionItem[] = [
    {
      id: "general",
      title: "General Settings",
      icon: Settings,
      description: "Basic configuration options",
      children: [
        { id: "profile", title: "Profile & Account", icon: Users },
        { id: "notifications", title: "Notifications", icon: Globe, badge: 3 },
        { id: "privacy", title: "Privacy & Security", icon: Shield },
        { id: "integrations", title: "Connected Apps", icon: Zap, badge: "New" }
      ]
    },
    {
      id: "project-settings",
      title: "Project Settings",
      icon: FolderOpen,
      description: "Project-specific configurations",
      children: [
        { id: "access", title: "Project Access", icon: Users },
        { id: "workflows", title: "Workflows", icon: GitBranch },
        { id: "issue-types", title: "Issue Types", icon: Archive },
        { id: "automation", title: "Automation Rules", icon: Zap, badge: 5 }
      ]
    },
    {
      id: "system",
      title: "System Administration",
      icon: Database,
      description: "System-wide settings",
      children: [
        { id: "user-management", title: "User Management", icon: Users },
        { id: "global-permissions", title: "Global Permissions", icon: Shield },
        { id: "backup", title: "Backup & Recovery", icon: Archive },
        { id: "audit-logs", title: "Audit Logs", icon: FileText }
      ]
    },
    {
      id: "appearance",
      title: "Appearance",
      icon: Palette,
      description: "Visual customization",
      children: [
        { id: "theme", title: "Theme Settings", icon: Palette },
        { id: "layout", title: "Layout Options", icon: Monitor },
        { id: "mobile", title: "Mobile Settings", icon: Smartphone }
      ]
    }
  ];

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 border-b border-[#dfe1e6] bg-[#f4f5f7]">
        <h3 className="text-[#172b4d] font-medium">Settings</h3>
      </div>
      <JiraAccordionMenu 
        items={settingsItems} 
        variant="detailed"
        allowMultiple={false}
      />
    </Card>
  );
}

// FAQ accordion
export function JiraFAQAccordion() {
  const faqItems: AccordionItem[] = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: HelpCircle,
      children: [
        { 
          id: "create-account", 
          title: "How do I create an account?",
          description: "Learn how to set up your Jira account and get started with your first project."
        },
        { 
          id: "first-project", 
          title: "How do I create my first project?",
          description: "Step-by-step guide to creating and configuring your first Jira project."
        },
        { 
          id: "invite-team", 
          title: "How do I invite team members?",
          description: "Add team members to your project and manage their permissions."
        }
      ]
    },
    {
      id: "issues",
      title: "Working with Issues",
      icon: Bug,
      children: [
        { 
          id: "create-issue", 
          title: "How do I create an issue?",
          description: "Learn the different ways to create and configure issues in Jira."
        },
        { 
          id: "assign-issue", 
          title: "How do I assign issues?",
          description: "Assign issues to team members and track their progress."
        },
        { 
          id: "issue-workflow", 
          title: "Understanding issue workflows",
          description: "Learn how issues move through different statuses in your workflow."
        }
      ]
    },
    {
      id: "reports",
      title: "Reports & Analytics",
      icon: BarChart3,
      children: [
        { 
          id: "burndown-chart", 
          title: "How to read burndown charts?",
          description: "Understand your team's progress with burndown and burnup charts."
        },
        { 
          id: "velocity", 
          title: "What is team velocity?",
          description: "Learn how velocity helps you plan and estimate future work."
        },
        { 
          id: "custom-reports", 
          title: "Creating custom reports",
          description: "Build custom dashboards and reports for your specific needs."
        }
      ]
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      icon: Archive,
      children: [
        { 
          id: "login-issues", 
          title: "I can't log in to my account",
          description: "Common login problems and how to resolve them."
        },
        { 
          id: "permission-errors", 
          title: "Permission denied errors",
          description: "Understanding and resolving permission-related issues."
        },
        { 
          id: "performance", 
          title: "Jira is running slowly",
          description: "Tips to improve Jira performance and troubleshoot slow loading."
        }
      ]
    }
  ];

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 border-b border-[#dfe1e6] bg-[#f4f5f7]">
        <h3 className="text-[#172b4d] font-medium">Frequently Asked Questions</h3>
      </div>
      <JiraAccordionMenu 
        items={faqItems} 
        variant="detailed"
        allowMultiple={true}
      />
    </Card>
  );
}

// Main accordion showcase component
export function JiraAccordionShowcase() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Layers3 className="w-6 h-6 text-[#0c66e4]" />
        <div>
          <h2 className="text-xl text-[#172b4d]">Accordion Menus</h2>
          <p className="text-[#5e6c84]">Collapsible navigation and content organization</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <JiraProjectAccordion />
          <JiraFAQAccordion />
        </div>
        
        <div className="space-y-6">
          <JiraSettingsAccordion />
          
          {/* Compact example */}
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-[#dfe1e6] bg-[#f4f5f7]">
              <h3 className="text-[#172b4d] font-medium">Compact Menu</h3>
            </div>
            <JiraAccordionMenu 
              items={[
                {
                  id: "tools",
                  title: "Development Tools",
                  icon: Code,
                  children: [
                    { id: "github", title: "GitHub Integration", icon: GitBranch },
                    { id: "jenkins", title: "Jenkins CI/CD", icon: Zap },
                    { id: "docker", title: "Docker Registry", icon: Archive }
                  ]
                },
                {
                  id: "monitoring",
                  title: "Monitoring",
                  icon: BarChart3,
                  badge: 2,
                  children: [
                    { id: "alerts", title: "Active Alerts", badge: 2 },
                    { id: "metrics", title: "System Metrics" },
                    { id: "logs", title: "Application Logs" }
                  ]
                }
              ]}
              variant="compact"
              allowMultiple={true}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}