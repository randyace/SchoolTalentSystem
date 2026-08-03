import { 
  Home, 
  Search, 
  BarChart3, 
  Settings, 
  Users, 
  FolderOpen, 
  Calendar, 
  Target,
  ChevronDown,
  ChevronRight,
  Plus,
  Minimize2,
  Maximize2,
  Layers3,
  GitBranch,
  Bug,
  Zap,
  FileText,
  Archive,
  Star,
  Filter,
  MoreHorizontal,
  Kanban,
  List,
  BarChart2,
  PieChart,
  Clock,
  Users2,
  Bookmark,
  Workflow
} from "lucide-react";
import { useState } from "react";
import { JiraAvatar } from "./JiraAvatar";
import { JiraTooltip } from "./JiraTooltip";

interface NavigationItem {
  icon: any;
  label: string;
  href?: string;
  active?: boolean;
  badge?: number;
  children?: NavigationItem[];
}

interface Project {
  id: string;
  name: string;
  key: string;
  color: string;
  avatar?: string;
  favorite?: boolean;
  type: "software" | "business" | "service-management";
}

interface JiraSidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

export function JiraSidebar({ collapsed = false, onCollapse }: JiraSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["projects", "project-alpha"]);
  const [selectedProject, setSelectedProject] = useState<string>("project-alpha");
  const [navigationHistory, setNavigationHistory] = useState<string[]>(["Home", "Projects", "Project Alpha"]);
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const mainNavItems: NavigationItem[] = [
    { icon: Home, label: "Your work", href: "#", active: true },
    { icon: FolderOpen, label: "Projects", href: "#" },
    { icon: Filter, label: "Filters", href: "#" },
    { icon: BarChart3, label: "Dashboards", href: "#" },
    { icon: Users2, label: "People", href: "#" },
    { icon: Settings, label: "Apps", href: "#" },
  ];

  const projects: Project[] = [
    { 
      id: "project-alpha", 
      name: "Project Alpha", 
      key: "PA", 
      color: "bg-[#0052cc]", 
      favorite: true,
      type: "software"
    },
    { 
      id: "project-beta", 
      name: "Project Beta", 
      key: "PB", 
      color: "bg-[#36b37e]",
      type: "business" 
    },
    { 
      id: "project-gamma", 
      name: "Project Gamma", 
      key: "PG", 
      color: "bg-[#ff5630]",
      type: "service-management"
    },
    { 
      id: "design-system", 
      name: "Design System", 
      key: "DS", 
      color: "bg-[#6554c0]",
      favorite: true,
      type: "software"
    },
  ];

  const getProjectNavigation = (projectId: string): NavigationItem[] => {
    return [
      { icon: Kanban, label: "Board", href: "#", active: projectId === selectedProject },
      { icon: List, label: "Backlog", href: "#" },
      { icon: Calendar, label: "Timeline", href: "#" },
      { 
        icon: BarChart2, 
        label: "Reports", 
        href: "#",
        children: [
          { icon: PieChart, label: "Burnup Chart", href: "#" },
          { icon: BarChart2, label: "Velocity Chart", href: "#" },
          { icon: Clock, label: "Sprint Report", href: "#" },
        ]
      },
      { 
        icon: Layers3, 
        label: "Issues and filters", 
        href: "#",
        children: [
          { icon: Search, label: "Search for issues", href: "#" },
          { icon: Bug, label: "My open issues", href: "#", badge: 5 },
          { icon: FileText, label: "All issues", href: "#", badge: 23 },
          { icon: Star, label: "Reported by me", href: "#", badge: 2 },
          { icon: Clock, label: "Recently viewed", href: "#" },
        ]
      },
      { 
        icon: Settings, 
        label: "Project settings", 
        href: "#",
        children: [
          { icon: Users, label: "Access", href: "#" },
          { icon: Workflow, label: "Workflows", href: "#" },
          { icon: Zap, label: "Automation", href: "#" },
          { icon: Archive, label: "Issue types", href: "#" },
        ]
      },
    ];
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project.id);
    setNavigationHistory(["Home", "Projects", project.name]);
    if (!expandedSections.includes(project.id)) {
      setExpandedSections(prev => [...prev, project.id]);
    }
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0, parentKey?: string) => {
    const key = parentKey ? `${parentKey}-${item.label}` : item.label;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.includes(key);
    const indentClass = level > 0 ? `ml-${level * 4}` : '';

    return (
      <div key={key}>
        <div
          className={`
            flex items-center justify-between px-3 py-1.5 rounded text-sm transition-colors cursor-pointer
            ${item.active 
              ? 'bg-[#deebff] text-[#0052cc]' 
              : 'text-[#5e6c84] hover:bg-[#ebecf0] hover:text-[#172b4d]'
            }
            ${collapsed ? 'justify-center' : ''}
            ${indentClass}
          `}
          onClick={() => hasChildren && toggleSection(key)}
        >
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className="bg-[#dfe1e6] text-[#5e6c84] text-xs px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </div>
          
          {!collapsed && hasChildren && (
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </div>
          )}
        </div>

        {!collapsed && hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavigationItem(child, level + 1, key))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className={`
      bg-[#f4f5f7] border-r border-[#dfe1e6] h-screen flex flex-col transition-all duration-300
      ${collapsed ? 'w-16' : 'w-72'}
    `}>
      {/* Header */}
      <div className="p-4 border-b border-[#dfe1e6]">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#0747a6] rounded text-white flex items-center justify-center text-sm">
                J
              </div>
              <span className="text-sm text-[#172b4d]">Jira Software</span>
            </div>
          )}
          <JiraTooltip content={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <button
              onClick={() => onCollapse?.(!collapsed)}
              className="p-1 hover:bg-[#ebecf0] rounded"
            >
              {collapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
          </JiraTooltip>
        </div>
        
        {!collapsed && (
          <div className="mt-3">
            <button className="w-full flex items-center justify-between p-2 hover:bg-[#ebecf0] rounded text-sm">
              <div className="flex items-center space-x-2">
                <JiraAvatar name="My Company" initials="MC" size="sm" />
                <span className="text-[#172b4d]">My Company</span>
              </div>
              <ChevronDown className="w-4 h-4 text-[#5e6c84]" />
            </button>
          </div>
        )}

        {/* Navigation Breadcrumb */}
        {!collapsed && navigationHistory.length > 1 && (
          <div className="mt-2 text-xs text-[#5e6c84]">
            {navigationHistory.map((item, index) => (
              <span key={index}>
                {index > 0 && <span className="mx-1">/</span>}
                <span className={index === navigationHistory.length - 1 ? "text-[#172b4d]" : ""}>
                  {item}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {/* Main Navigation */}
          <div className="space-y-1">
            {mainNavItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`
                  flex items-center space-x-3 px-3 py-2 rounded text-sm transition-colors
                  ${item.active 
                    ? 'bg-[#deebff] text-[#0052cc]' 
                    : 'text-[#5e6c84] hover:bg-[#ebecf0] hover:text-[#172b4d]'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5" />
                {!collapsed && <span>{item.label}</span>}
              </a>
            ))}
          </div>

          {!collapsed && (
            <>
              {/* Projects Section */}
              <div className="pt-4">
                <button
                  onClick={() => toggleSection("projects")}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#5e6c84] uppercase tracking-wide hover:bg-[#ebecf0] rounded"
                >
                  <span>Projects</span>
                  <div className="flex items-center space-x-1">
                    <JiraTooltip content="Create project">
                      <Plus className="w-3 h-3 hover:text-[#172b4d]" />
                    </JiraTooltip>
                    {expandedSections.includes("projects") ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </div>
                </button>
                
                {expandedSections.includes("projects") && (
                  <div className="space-y-1 mt-1">
                    {/* Favorites */}
                    <div className="px-3 py-1">
                      <div className="text-xs text-[#8993a4] mb-2 flex items-center">
                        <Star className="w-3 h-3 mr-1" />
                        STARRED
                      </div>
                      {projects.filter(p => p.favorite).map((project) => (
                        <button
                          key={project.id}
                          onClick={() => handleProjectSelect(project)}
                          className={`
                            w-full flex items-center justify-between p-2 text-sm rounded transition-colors
                            ${selectedProject === project.id 
                              ? 'bg-[#deebff] text-[#0052cc]' 
                              : 'text-[#5e6c84] hover:bg-[#ebecf0] hover:text-[#172b4d]'
                            }
                          `}
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <div className={`w-4 h-4 rounded ${project.color} flex-shrink-0`}></div>
                            <span className="truncate">{project.name}</span>
                          </div>
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            {expandedSections.includes(project.id) ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* All Projects */}
                    <div className="px-3 py-1">
                      <div className="text-xs text-[#8993a4] mb-2">RECENT</div>
                      {projects.filter(p => !p.favorite).map((project) => (
                        <button
                          key={project.id}
                          onClick={() => handleProjectSelect(project)}
                          className={`
                            w-full flex items-center justify-between p-2 text-sm rounded transition-colors
                            ${selectedProject === project.id 
                              ? 'bg-[#deebff] text-[#0052cc]' 
                              : 'text-[#5e6c84] hover:bg-[#ebecf0] hover:text-[#172b4d]'
                            }
                          `}
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <div className={`w-4 h-4 rounded ${project.color} flex-shrink-0`}></div>
                            <span className="truncate">{project.name}</span>
                          </div>
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <JiraTooltip content="More actions">
                              <MoreHorizontal className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                            </JiraTooltip>
                            {expandedSections.includes(project.id) ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="px-3 py-1">
                      <button className="w-full text-left text-xs text-[#0052cc] hover:underline">
                        View all projects
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Project Navigation */}
              {selectedProject && expandedSections.includes(selectedProject) && (
                <div className="pt-2 border-t border-[#e4e6ea] mt-2">
                  <div className="px-3 py-1 text-xs text-[#8993a4] uppercase tracking-wide">
                    {projects.find(p => p.id === selectedProject)?.name}
                  </div>
                  <div className="space-y-1">
                    {getProjectNavigation(selectedProject).map(item => 
                      renderNavigationItem(item, 0, selectedProject)
                    )}
                  </div>
                </div>
              )}

              {/* Teams Section */}
              <div className="pt-4">
                <button
                  onClick={() => toggleSection("teams")}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#5e6c84] uppercase tracking-wide hover:bg-[#ebecf0] rounded"
                >
                  <span>Teams</span>
                  <div className="flex items-center space-x-1">
                    <Plus className="w-3 h-3" />
                    {expandedSections.includes("teams") ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </div>
                </button>
                
                {expandedSections.includes("teams") && (
                  <div className="ml-2 space-y-1 mt-1">
                    <a href="#" className="flex items-center space-x-2 px-3 py-1 text-sm text-[#5e6c84] hover:bg-[#ebecf0] hover:text-[#172b4d] rounded">
                      <Users className="w-4 h-4" />
                      <span>Alpha Team</span>
                    </a>
                    <a href="#" className="flex items-center space-x-2 px-3 py-1 text-sm text-[#5e6c84] hover:bg-[#ebecf0] hover:text-[#172b4d] rounded">
                      <Users className="w-4 h-4" />
                      <span>Beta Team</span>
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#dfe1e6]">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2 min-w-0">
              <JiraAvatar name="Current User" initials="CU" size="sm" />
              <div className="text-xs min-w-0">
                <div className="text-[#172b4d] truncate">John Doe</div>
                <div className="text-[#5e6c84] truncate">john@company.com</div>
              </div>
            </div>
          )}
          <JiraTooltip content="Settings">
            <button className="p-1 hover:bg-[#ebecf0] rounded flex-shrink-0">
              <Settings className="w-4 h-4 text-[#5e6c84]" />
            </button>
          </JiraTooltip>
        </div>
      </div>
    </aside>
  );
}