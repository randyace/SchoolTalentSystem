import { useState } from "react";
import { 
  MoreVertical, 
  Edit3, 
  Copy, 
  Trash2, 
  Archive,
  Flag,
  Clock,
  Calendar,
  User,
  Tag
} from "lucide-react";
import { JiraTable } from "./JiraTable";
import { JiraButton } from "./JiraButton";
import { JiraInput } from "./JiraInput";
import { JiraSelect } from "./JiraSelect";
import { JiraStatusBadge } from "./JiraStatusBadge";
import { JiraPriorityIcon } from "./JiraPriorityIcon";
import { JiraTooltip } from "./JiraTooltip";
import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface TableView {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
  columns: string[];
  filters: any[];
  sortBy: string;
}

export function JiraAdvancedTableView() {
  const [currentView, setCurrentView] = useState("default");
  const [showViewManager, setShowViewManager] = useState(false);
  const [inlineEditCell, setInlineEditCell] = useState<string | null>(null);

  const tableViews: TableView[] = [
    {
      id: "default",
      name: "All Issues",
      description: "Default view showing all issues",
      isDefault: true,
      columns: ["type", "key", "title", "status", "priority", "assignee", "created"],
      filters: [],
      sortBy: "updated"
    },
    {
      id: "my-open",
      name: "My Open Issues",
      description: "Issues assigned to me that are not done",
      columns: ["key", "title", "status", "priority", "updated"],
      filters: [{ field: "assignee", value: "currentUser" }, { field: "status", operator: "not", value: "Done" }],
      sortBy: "updated"
    },
    {
      id: "recently-updated",
      name: "Recently Updated",
      description: "Issues updated in the last 7 days",
      columns: ["key", "title", "assignee", "status", "updated"],
      filters: [{ field: "updated", operator: "since", value: "7d" }],
      sortBy: "updated"
    },
    {
      id: "backlog",
      name: "Backlog",
      description: "Issues ready for development",
      columns: ["type", "key", "title", "priority", "storyPoints", "assignee"],
      filters: [{ field: "status", value: "To Do" }],
      sortBy: "priority"
    }
  ];

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl text-[#172b4d]">Issue Views</h2>
          <div className="flex items-center space-x-2">
            {tableViews.map((view) => (
              <button
                key={view.id}
                onClick={() => setCurrentView(view.id)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm transition-colors
                  ${currentView === view.id
                    ? "bg-[#e9f2ff] text-[#0c66e4] border border-[#cce0ff]"
                    : "text-[#5e6c84] hover:bg-[#f4f5f7] hover:text-[#172b4d]"
                  }
                `}
              >
                {view.name}
                {view.isDefault && (
                  <span className="ml-1 text-xs opacity-70">(Default)</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <JiraButton variant="secondary" size="sm">
            Save view
          </JiraButton>
          <JiraButton 
            variant="subtle" 
            size="sm"
            onClick={() => setShowViewManager(!showViewManager)}
          >
            Manage views
          </JiraButton>
        </div>
      </div>

      {/* Current View Info */}
      <div className="bg-[#f4f5f7] rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[#172b4d] mb-1">
              {tableViews.find(v => v.id === currentView)?.name}
            </h3>
            <p className="text-sm text-[#5e6c84]">
              {tableViews.find(v => v.id === currentView)?.description}
            </p>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-[#5e6c84]">
            <div className="flex items-center space-x-1">
              <Tag className="w-4 h-4" />
              <span>Columns: {tableViews.find(v => v.id === currentView)?.columns.length}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>Auto-refresh: Off</span>
            </div>
          </div>
        </div>
      </div>

      {/* View Manager Modal */}
      {showViewManager && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg text-[#172b4d]">Manage Table Views</h3>
            <JiraButton 
              variant="subtle" 
              size="sm"
              onClick={() => setShowViewManager(false)}
            >
              Close
            </JiraButton>
          </div>
          
          <div className="space-y-4">
            {tableViews.map((view) => (
              <div key={view.id} className="flex items-center justify-between p-3 border border-[#dfe1e6] rounded-lg">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[#172b4d]">{view.name}</span>
                    {view.isDefault && (
                      <span className="text-xs bg-[#e9f2ff] text-[#0c66e4] px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#5e6c84] mt-1">{view.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-[#8993a4]">
                    <span>{view.columns.length} columns</span>
                    <span>{view.filters.length} filters</span>
                    <span>Sort by {view.sortBy}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <JiraButton variant="subtle" size="sm">
                    <Edit3 className="w-4 h-4" />
                  </JiraButton>
                  <JiraButton 
                    variant="subtle" 
                    size="sm"
                    onClick={() => setCurrentView(view.id)}
                  >
                    Use view
                  </JiraButton>
                  {!view.isDefault && (
                    <JiraButton variant="subtle" size="sm">
                      <Trash2 className="w-4 h-4 text-[#ca3521]" />
                    </JiraButton>
                  )}
                </div>
              </div>
            ))}
            
            <JiraButton variant="primary" className="w-full">
              Create new view
            </JiraButton>
          </div>
        </Card>
      )}

      {/* Enhanced Table Features */}
      <Tabs defaultValue="table" className="w-full">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="settings">View Settings</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          <JiraTable />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg text-[#172b4d] mb-4">View Configuration</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#5e6c84] mb-2">View Name</label>
                  <JiraInput placeholder="Enter view name" />
                </div>
                
                <div>
                  <label className="block text-sm text-[#5e6c84] mb-2">Description</label>
                  <textarea 
                    className="w-full p-3 border border-[#dfe1e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0c66e4] focus:border-transparent"
                    rows={3}
                    placeholder="Describe this view..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#5e6c84] mb-2">Default Sort</label>
                  <JiraSelect
                    options={[
                      { value: "updated", label: "Last Updated" },
                      { value: "created", label: "Created Date" },
                      { value: "priority", label: "Priority" },
                      { value: "status", label: "Status" },
                      { value: "key", label: "Issue Key" }
                    ]}
                    placeholder="Select sort field"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm text-[#5e6c84] mb-3">Display Options</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="w-4 h-4 text-[#0c66e4]" defaultChecked />
                      <span className="text-sm text-[#172b4d]">Show row numbers</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="w-4 h-4 text-[#0c66e4]" defaultChecked />
                      <span className="text-sm text-[#172b4d]">Enable bulk selection</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="w-4 h-4 text-[#0c66e4]" />
                      <span className="text-sm text-[#172b4d]">Compact row height</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="w-4 h-4 text-[#0c66e4]" defaultChecked />
                      <span className="text-sm text-[#172b4d]">Show column tooltips</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm text-[#5e6c84] mb-3">Performance</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="w-4 h-4 text-[#0c66e4]" />
                      <span className="text-sm text-[#172b4d]">Auto-refresh (30s)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="w-4 h-4 text-[#0c66e4]" defaultChecked />
                      <span className="text-sm text-[#172b4d]">Lazy load rows</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <JiraButton variant="secondary">Reset to default</JiraButton>
              <JiraButton variant="primary">Save changes</JiraButton>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg text-[#172b4d] mb-4">Table Automation</h3>
            <div className="space-y-4">
              <div className="p-4 border border-[#dfe1e6] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[#172b4d]">Auto-assign High Priority Issues</h4>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="w-4 h-4 text-[#0c66e4]" />
                    <span className="text-sm text-[#5e6c84]">Enabled</span>
                  </label>
                </div>
                <p className="text-sm text-[#5e6c84] mb-3">
                  Automatically assign new high priority issues to available team members
                </p>
                <div className="flex items-center space-x-2">
                  <Flag className="w-4 h-4 text-[#f79009]" />
                  <span className="text-sm text-[#5e6c84]">Triggers when priority = High</span>
                </div>
              </div>

              <div className="p-4 border border-[#dfe1e6] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[#172b4d]">Notify on Status Change</h4>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="w-4 h-4 text-[#0c66e4]" defaultChecked />
                    <span className="text-sm text-[#5e6c84]">Enabled</span>
                  </label>
                </div>
                <p className="text-sm text-[#5e6c84] mb-3">
                  Send notifications when issues move to specific statuses
                </p>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-[#0c66e4]" />
                  <span className="text-sm text-[#5e6c84]">Triggers on status change</span>
                </div>
              </div>

              <JiraButton variant="primary">
                Create new automation
              </JiraButton>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}