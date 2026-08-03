import { 
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
  Plus,
  MoreHorizontal,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Edit,
  Trash2,
  Clock,
  Users,
  Target,
  BarChart3,
  FileText,
  CheckSquare,
  AlertTriangle,
  Zap
} from "lucide-react";
import { useState } from "react";
import { JiraButton } from "./JiraButton";
import { JiraStatusBadge } from "./JiraStatusBadge";
import { JiraPriorityIcon } from "./JiraPriorityIcon";
import { JiraAvatar } from "./JiraAvatar";
import { JiraTooltip } from "./JiraTooltip";
import { JiraProgress } from "./JiraProgress";
import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

// Sprint Burndown Table
export function JiraSprintBurndownTable() {
  const burndownData = [
    { day: "Day 1", planned: 120, actual: 120, completed: 0, remaining: 120 },
    { day: "Day 2", planned: 108, actual: 115, completed: 5, remaining: 115 },
    { day: "Day 3", planned: 96, actual: 105, completed: 15, remaining: 105 },
    { day: "Day 4", planned: 84, actual: 95, completed: 25, remaining: 95 },
    { day: "Day 5", planned: 72, actual: 85, completed: 35, remaining: 85 },
    { day: "Day 6", planned: 60, actual: 70, completed: 50, remaining: 70 },
    { day: "Day 7", planned: 48, actual: 55, completed: 65, remaining: 55 },
    { day: "Day 8", planned: 36, actual: 40, completed: 80, remaining: 40 },
    { day: "Day 9", planned: 24, actual: 30, completed: 90, remaining: 30 },
    { day: "Day 10", planned: 12, actual: 15, completed: 105, remaining: 15 }
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg text-[#172b4d] flex items-center">
          <TrendingDown className="w-5 h-5 mr-2" />
          Sprint Burndown
        </h3>
        <div className="flex items-center space-x-2">
          <JiraButton variant="subtle" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </JiraButton>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#dfe1e6]">
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Day</th>
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Planned</th>
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Actual</th>
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Completed</th>
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Remaining</th>
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Variance</th>
            </tr>
          </thead>
          <tbody>
            {burndownData.map((day, index) => {
              const variance = day.actual - day.planned;
              const isOnTrack = Math.abs(variance) <= 5;
              const isBehind = variance > 5;

              return (
                <tr key={index} className="border-b border-[#f4f5f7] hover:bg-[#f4f5f7]">
                  <td className="py-3 px-3 text-sm text-[#172b4d]">{day.day}</td>
                  <td className="py-3 px-3 text-sm text-[#5e6c84]">{day.planned}</td>
                  <td className="py-3 px-3 text-sm text-[#172b4d] font-medium">{day.actual}</td>
                  <td className="py-3 px-3 text-sm text-[#22a06b]">{day.completed}</td>
                  <td className="py-3 px-3 text-sm text-[#172b4d]">{day.remaining}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-2">
                      {isOnTrack ? (
                        <Minus className="w-4 h-4 text-[#5e6c84]" />
                      ) : isBehind ? (
                        <TrendingUp className="w-4 h-4 text-[#de350b]" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-[#22a06b]" />
                      )}
                      <span className={`text-sm ${
                        isOnTrack ? 'text-[#5e6c84]' : 
                        isBehind ? 'text-[#de350b]' : 'text-[#22a06b]'
                      }`}>
                        {variance > 0 ? '+' : ''}{variance}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// Team Performance Table
export function JiraTeamPerformanceTable() {
  const teamData = [
    {
      member: { name: "John Doe", avatar: "JD" },
      role: "Developer",
      assigned: 8,
      completed: 6,
      inProgress: 2,
      storyPoints: 34,
      velocity: 28,
      utilization: 85
    },
    {
      member: { name: "Jane Smith", avatar: "JS" },
      role: "Designer",
      assigned: 5,
      completed: 4,
      inProgress: 1,
      storyPoints: 22,
      velocity: 20,
      utilization: 90
    },
    {
      member: { name: "Bob Wilson", avatar: "BW" },
      role: "QA Engineer",
      assigned: 6,
      completed: 5,
      inProgress: 1,
      storyPoints: 18,
      velocity: 16,
      utilization: 75
    },
    {
      member: { name: "Alice Brown", avatar: "AB" },
      role: "Product Manager",
      assigned: 4,
      completed: 3,
      inProgress: 1,
      storyPoints: 15,
      velocity: 12,
      utilization: 95
    }
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg text-[#172b4d] flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Team Performance
        </h3>
        <div className="flex items-center space-x-2">
          <JiraButton variant="subtle" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            This Sprint
          </JiraButton>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#dfe1e6]">
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Team Member</th>
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Assigned</th>
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Completed</th>
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">In Progress</th>
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Story Points</th>
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Velocity</th>
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Utilization</th>
            </tr>
          </thead>
          <tbody>
            {teamData.map((member, index) => (
              <tr key={index} className="border-b border-[#f4f5f7] hover:bg-[#f4f5f7]">
                <td className="py-3 px-3">
                  <div className="flex items-center space-x-3">
                    <JiraAvatar 
                      name={member.member.name} 
                      initials={member.member.avatar} 
                      size="sm" 
                    />
                    <div>
                      <div className="text-sm text-[#172b4d]">{member.member.name}</div>
                      <div className="text-xs text-[#5e6c84]">{member.role}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-sm text-[#172b4d]">{member.assigned}</td>
                <td className="py-3 px-3 text-sm text-[#22a06b] font-medium">{member.completed}</td>
                <td className="py-3 px-3 text-sm text-[#0747a6]">{member.inProgress}</td>
                <td className="py-3 px-3 text-sm text-[#172b4d] font-medium">{member.storyPoints}</td>
                <td className="py-3 px-3 text-sm text-[#172b4d]">{member.velocity}</td>
                <td className="py-3 px-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-12">
                      <JiraProgress 
                        value={member.utilization} 
                        variant={member.utilization >= 90 ? "success" : member.utilization >= 70 ? "default" : "warning"}
                        size="sm"
                      />
                    </div>
                    <span className="text-sm text-[#172b4d]">{member.utilization}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// Release Timeline Table
export function JiraReleaseTimelineTable() {
  const releases = [
    {
      version: "v2.4.0",
      status: "Released",
      date: "2024-01-15",
      features: 12,
      bugs: 8,
      progress: 100,
      lead: { name: "John Doe", avatar: "JD" }
    },
    {
      version: "v2.5.0",
      status: "In Progress",
      date: "2024-02-28",
      features: 15,
      bugs: 5,
      progress: 75,
      lead: { name: "Jane Smith", avatar: "JS" }
    },
    {
      version: "v2.6.0",
      status: "Planning",
      date: "2024-04-15",
      features: 20,
      bugs: 3,
      progress: 25,
      lead: { name: "Bob Wilson", avatar: "BW" }
    },
    {
      version: "v3.0.0",
      status: "Planned",
      date: "2024-07-01",
      features: 35,
      bugs: 0,
      progress: 5,
      lead: { name: "Alice Brown", avatar: "AB" }
    }
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg text-[#172b4d] flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Release Timeline
        </h3>
        <div className="flex items-center space-x-2">
          <JiraButton variant="secondary" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Plan Release
          </JiraButton>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#dfe1e6]">
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Version</th>
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Status</th>
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Target Date</th>
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Features</th>
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Bug Fixes</th>
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Progress</th>
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Release Lead</th>
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {releases.map((release, index) => (
              <tr key={index} className="border-b border-[#f4f5f7] hover:bg-[#f4f5f7]">
                <td className="py-3 px-3">
                  <span className="text-sm text-[#172b4d] font-medium">{release.version}</span>
                </td>
                <td className="py-3 px-3">
                  <JiraStatusBadge 
                    status={release.status} 
                    variant={
                      release.status === "Released" ? "success" :
                      release.status === "In Progress" ? "inprogress" :
                      release.status === "Planning" ? "todo" : "default"
                    }
                  />
                </td>
                <td className="py-3 px-3 text-sm text-[#5e6c84]">
                  {new Date(release.date).toLocaleDateString()}
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center space-x-1">
                    <Zap className="w-4 h-4 text-[#0747a6]" />
                    <span className="text-sm text-[#172b4d]">{release.features}</span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4 text-[#de350b]" />
                    <span className="text-sm text-[#172b4d]">{release.bugs}</span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-16">
                      <JiraProgress 
                        value={release.progress} 
                        variant={release.progress === 100 ? "success" : "default"}
                        size="sm"
                      />
                    </div>
                    <span className="text-sm text-[#172b4d]">{release.progress}%</span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <JiraTooltip content={release.lead.name}>
                    <div>
                      <JiraAvatar 
                        name={release.lead.name} 
                        initials={release.lead.avatar} 
                        size="sm" 
                      />
                    </div>
                  </JiraTooltip>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center space-x-1">
                    <JiraTooltip content="View details">
                      <button className="p-1 hover:bg-[#e4e6ea] rounded">
                        <Eye className="w-4 h-4 text-[#5e6c84]" />
                      </button>
                    </JiraTooltip>
                    <JiraTooltip content="Edit release">
                      <button className="p-1 hover:bg-[#e4e6ea] rounded">
                        <Edit className="w-4 h-4 text-[#5e6c84]" />
                      </button>
                    </JiraTooltip>
                    <JiraTooltip content="More actions">
                      <button className="p-1 hover:bg-[#e4e6ea] rounded">
                        <MoreHorizontal className="w-4 h-4 text-[#5e6c84]" />
                      </button>
                    </JiraTooltip>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// Component Dependencies Table
export function JiraComponentDependenciesTable() {
  const dependencies = [
    {
      component: "Authentication Service",
      type: "Service",
      dependsOn: ["User Database", "JWT Library"],
      dependents: ["Web App", "Mobile App", "API Gateway"],
      health: "Healthy",
      lastUpdated: "2 hours ago"
    },
    {
      component: "Payment Gateway",
      type: "External API",
      dependsOn: ["Stripe API", "Database"],
      dependents: ["Checkout Service", "Billing Service"],
      health: "Warning",
      lastUpdated: "1 day ago"
    },
    {
      component: "Notification Service",
      type: "Microservice",
      dependsOn: ["Message Queue", "Email Provider"],
      dependents: ["User Service", "Order Service"],
      health: "Healthy",
      lastUpdated: "30 minutes ago"
    },
    {
      component: "Analytics Engine",
      type: "Service",
      dependsOn: ["Data Warehouse", "Processing Queue"],
      dependents: ["Dashboard", "Reports"],
      health: "Error",
      lastUpdated: "5 hours ago"
    }
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg text-[#172b4d] flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Component Dependencies
        </h3>
        <div className="flex items-center space-x-2">
          <JiraButton variant="subtle" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </JiraButton>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#dfe1e6]">
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Component</th>
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Type</th>
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Dependencies</th>
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Dependents</th>
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Health</th>
              <th className="text-left py-3 px-3 text-xs text-[#5e6c84] uppercase tracking-wide">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {dependencies.map((item, index) => (
              <tr key={index} className="border-b border-[#f4f5f7] hover:bg-[#f4f5f7]">
                <td className="py-3 px-3">
                  <div>
                    <div className="text-sm text-[#172b4d] font-medium">{item.component}</div>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <span className="text-sm text-[#5e6c84]">{item.type}</span>
                </td>
                <td className="py-3 px-3">
                  <div className="flex flex-wrap gap-1">
                    {item.dependsOn.map((dep, i) => (
                      <span key={i} className="text-xs bg-[#f4f5f7] text-[#5e6c84] px-2 py-1 rounded-full">
                        {dep}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="flex flex-wrap gap-1">
                    {item.dependents.map((dep, i) => (
                      <span key={i} className="text-xs bg-[#e9f2ff] text-[#0747a6] px-2 py-1 rounded-full">
                        {dep}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      item.health === "Healthy" ? "bg-[#22a06b]" :
                      item.health === "Warning" ? "bg-[#ff8b00]" : "bg-[#de350b]"
                    }`} />
                    <span className={`text-sm ${
                      item.health === "Healthy" ? "text-[#22a06b]" :
                      item.health === "Warning" ? "text-[#ff8b00]" : "text-[#de350b]"
                    }`}>
                      {item.health}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-[#5e6c84]" />
                    <span className="text-sm text-[#5e6c84]">{item.lastUpdated}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// Main component that showcases all data tables
export function JiraDataTables() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <FileText className="w-6 h-6 text-[#0c66e4]" />
        <div>
          <h2 className="text-xl text-[#172b4d]">Advanced Data Tables</h2>
          <p className="text-[#5e6c84]">Specialized tables for different data visualization needs</p>
        </div>
      </div>

      <Tabs defaultValue="burndown" className="w-full">
        <TabsList>
          <TabsTrigger value="burndown">Sprint Burndown</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
          <TabsTrigger value="releases">Release Timeline</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
        </TabsList>

        <TabsContent value="burndown">
          <JiraSprintBurndownTable />
        </TabsContent>

        <TabsContent value="team">
          <JiraTeamPerformanceTable />
        </TabsContent>

        <TabsContent value="releases">
          <JiraReleaseTimelineTable />
        </TabsContent>

        <TabsContent value="dependencies">
          <JiraComponentDependenciesTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}