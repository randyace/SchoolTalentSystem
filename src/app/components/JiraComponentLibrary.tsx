import { useState } from "react";
import { JiraNavigation } from "./jira/JiraNavigation";
import { JiraIssueCard } from "./jira/JiraIssueCard";
import { JiraStatusBadge } from "./jira/JiraStatusBadge";
import { JiraPriorityIcon } from "./jira/JiraPriorityIcon";
import { JiraButton } from "./jira/JiraButton";
import { JiraInput } from "./jira/JiraInput";
import { JiraSelect } from "./jira/JiraSelect";
import { JiraAvatar } from "./jira/JiraAvatar";
import { JiraBreadcrumb } from "./jira/JiraBreadcrumb";
import { JiraBreadcrumbNew } from "./jira/JiraBreadcrumbNew";
import { JiraFilter } from "./jira/JiraFilter";
import { JiraTable } from "./jira/JiraTable";
import { JiraAdvancedTableView } from "./jira/JiraAdvancedTableView";
import { JiraDataTables } from "./jira/JiraDataTables";
import { JiraSidebar } from "./jira/JiraSidebar";
import { JiraNavigationHierarchy, JiraCompactNavigation, JiraNavigationBreadcrumb } from "./jira/JiraNavigationHierarchy";
import { JiraAccordionShowcase } from "./jira/JiraAccordionMenu";
import { JiraRichTextEditor, JiraCommentEditor } from "./jira/JiraRichTextEditor";
import { JiraEmailTemplate, JiraEmailTemplateGallery } from "./jira/JiraEmailTemplate";
import { JiraDrawer, JiraIssueDrawer } from "./jira/JiraDrawer";
import { JiraMoreButton } from "./jira/JiraMoreButton";
import { JiraCommandBar } from "./jira/JiraCommandBar";
import { JiraFloatingActionButton } from "./jira/JiraFloatingActionButton";
import { JiraNotificationPanel } from "./jira/JiraNotificationPanel";
import { JiraQuickAdd } from "./jira/JiraQuickAdd";
import { JiraBanner } from "./jira/JiraBanner";
import { JiraInlineMessage } from "./jira/JiraInlineMessage";
import { JiraSectionMessage } from "./jira/JiraSectionMessage";
import { JiraSpinner, JiraLoadingOverlay, JiraSkeleton } from "./jira/JiraSpinner";
import { JiraEmptyState, JiraNoIssuesFound, JiraNoProjectAccess, JiraErrorState } from "./jira/JiraEmptyState";
import { JiraTooltip } from "./jira/JiraTooltip";
import { JiraProgress, JiraCircularProgress } from "./jira/JiraProgress";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  Bell, 
  Search, 
  Plus, 
  Menu, 
  Home, 
  Users, 
  Settings, 
  HelpCircle, 
  RefreshCw, 
  Table, 
  Navigation, 
  TreePine, 
  Layers3,
  FileText,
  Edit3,
  Mail,
  BarChart3
} from "lucide-react";

export function JiraComponentLibrary() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [commandBarOpen, setCommandBarOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [loadingOverlay, setLoadingOverlay] = useState(false);
  const [emptyStateType, setEmptyStateType] = useState<"no-issues" | "no-access" | "error">("no-issues");
  const [currentTab, setCurrentTab] = useState("overview");

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col">
      {/* System Banner */}
      {showBanner && (
        <JiraBanner
          variant="announcement"
          onDismiss={() => setShowBanner(false)}
          action={
            <JiraButton variant="link" size="sm">
              Learn more
            </JiraButton>
          }
        >
          <strong>Complete Component Library now available!</strong> 
          Rich text editor, email templates, advanced data tables, and accordion menus are now included.
        </JiraBanner>
      )}

      <div className="flex flex-1">
        {/* Enhanced Sidebar with Hierarchy */}
        <JiraSidebar 
          collapsed={sidebarCollapsed} 
          onCollapse={setSidebarCollapsed}
        />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Navigation */}
          <div className="bg-white border-b border-[#dfe1e6] px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2 hover:bg-[#f4f5f7] rounded lg:hidden"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl text-[#172b4d]">Jira Component Library</h1>
                  <JiraBreadcrumbNew
                    items={[
                      { label: "Components", href: "#" },
                      { label: "Jira Library", current: true }
                    ]}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <JiraTooltip content="Search components and documentation">
                  <JiraButton
                    variant="subtle"
                    onClick={() => setCommandBarOpen(true)}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search (⌘K)
                  </JiraButton>
                </JiraTooltip>
                
                <JiraTooltip content="View notifications">
                  <button
                    onClick={() => setNotificationPanelOpen(true)}
                    className="relative p-2 hover:bg-[#f4f5f7] rounded"
                  >
                    <Bell className="w-5 h-5 text-[#5e6c84]" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#de350b] rounded-full"></div>
                  </button>
                </JiraTooltip>
                
                <JiraButton
                  variant="primary"
                  onClick={() => setQuickAddOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </JiraButton>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <main className="flex-1 p-6 overflow-y-auto">
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="mb-6 grid w-full grid-cols-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="navigation">Navigation</TabsTrigger>
                <TabsTrigger value="data-tables">Data Tables</TabsTrigger>
                <TabsTrigger value="text-editor">Text Editor</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="accordion">Accordion</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
                <TabsTrigger value="forms">Forms</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-8">
                {/* Component Overview */}
                <section>
                  <h2 className="text-xl text-[#172b4d] mb-4">Component Overview</h2>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="p-6 text-center">
                      <Layers3 className="w-8 h-8 text-[#0c66e4] mx-auto mb-3" />
                      <h3 className="text-lg text-[#172b4d] mb-2">50+ Components</h3>
                      <p className="text-sm text-[#5e6c84]">Complete UI component library</p>
                    </Card>
                    
                    <Card className="p-6 text-center">
                      <Navigation className="w-8 h-8 text-[#22a06b] mx-auto mb-3" />
                      <h3 className="text-lg text-[#172b4d] mb-2">Navigation</h3>
                      <p className="text-sm text-[#5e6c84]">Hierarchical navigation systems</p>
                    </Card>
                    
                    <Card className="p-6 text-center">
                      <Table className="w-8 h-8 text-[#ff8b00] mx-auto mb-3" />
                      <h3 className="text-lg text-[#172b4d] mb-2">Data Tables</h3>
                      <p className="text-sm text-[#5e6c84]">Advanced table components</p>
                    </Card>
                    
                    <Card className="p-6 text-center">
                      <Edit3 className="w-8 h-8 text-[#6554c0] mx-auto mb-3" />
                      <h3 className="text-lg text-[#172b4d] mb-2">Rich Editor</h3>
                      <p className="text-sm text-[#5e6c84]">Rich text editing capabilities</p>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card className="p-6">
                      <h3 className="text-lg text-[#172b4d] mb-4">Quick Start</h3>
                      <div className="space-y-4">
                        <JiraInlineMessage variant="success" title="Library Ready!">
                          All components are built using Atlassian Design System patterns and are ready to use.
                        </JiraInlineMessage>
                        
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="p-4 bg-[#f4f5f7] rounded-lg">
                            <FileText className="w-6 h-6 text-[#0c66e4] mb-2" />
                            <h4 className="text-sm text-[#172b4d] mb-1">Components</h4>
                            <p className="text-xs text-[#5e6c84]">Reusable UI components with consistent styling</p>
                          </div>
                          
                          <div className="p-4 bg-[#f4f5f7] rounded-lg">
                            <Layers3 className="w-6 h-6 text-[#22a06b] mb-2" />
                            <h4 className="text-sm text-[#172b4d] mb-1">Patterns</h4>
                            <p className="text-xs text-[#5e6c84]">Design patterns for complex interactions</p>
                          </div>
                          
                          <div className="p-4 bg-[#f4f5f7] rounded-lg">
                            <Settings className="w-6 h-6 text-[#ff8b00] mb-2" />
                            <h4 className="text-sm text-[#172b4d] mb-1">Customizable</h4>
                            <p className="text-xs text-[#5e6c84]">Flexible components with configuration options</p>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Issue Components */}
                    <Card className="p-6">
                      <h3 className="text-lg text-[#172b4d] mb-4">Core Issue Components</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm text-[#5e6c84] mb-3">Issue Cards</h4>
                          <div className="space-y-3">
                            <JiraIssueCard
                              title="Update user authentication flow"
                              issueKey="PROJ-123"
                              status="In Progress"
                              priority="High"
                              assignee={{ name: "John Doe", avatar: "JD" }}
                              type="Story"
                            />
                            <JiraIssueCard
                              title="Fix login page responsiveness"
                              issueKey="PROJ-124"
                              status="To Do"
                              priority="Medium"
                              assignee={{ name: "Jane Smith", avatar: "JS" }}
                              type="Bug"
                            />
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm text-[#5e6c84] mb-3">Status & Priority</h4>
                          <div className="space-y-4">
                            <div>
                              <div className="text-xs text-[#5e6c84] mb-2">Status Badges</div>
                              <div className="flex flex-wrap gap-2">
                                <JiraStatusBadge status="To Do" />
                                <JiraStatusBadge status="In Progress" />
                                <JiraStatusBadge status="In Review" />
                                <JiraStatusBadge status="Done" />
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-[#5e6c84] mb-2">Priority Icons</div>
                              <div className="flex gap-4">
                                <JiraTooltip content="Highest Priority">
                                  <div><JiraPriorityIcon priority="Highest" /></div>
                                </JiraTooltip>
                                <JiraTooltip content="High Priority">
                                  <div><JiraPriorityIcon priority="High" /></div>
                                </JiraTooltip>
                                <JiraTooltip content="Medium Priority">
                                  <div><JiraPriorityIcon priority="Medium" /></div>
                                </JiraTooltip>
                                <JiraTooltip content="Low Priority">
                                  <div><JiraPriorityIcon priority="Low" /></div>
                                </JiraTooltip>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="navigation" className="space-y-6">
                <div className="flex items-center space-x-4 mb-6">
                  <TreePine className="w-6 h-6 text-[#0c66e4]" />
                  <div>
                    <h2 className="text-xl text-[#172b4d]">Navigation Hierarchy</h2>
                    <p className="text-[#5e6c84]">Hierarchical navigation with expandable project structures and breadcrumbs</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Navigation Breadcrumb */}
                  <Card className="p-6">
                    <h3 className="text-lg text-[#172b4d] mb-4">Navigation Breadcrumb</h3>
                    <div className="space-y-4">
                      <JiraNavigationBreadcrumb />
                      <JiraNavigationBreadcrumb path={["Your work", "Filters", "My Filters"]} />
                      <JiraNavigationBreadcrumb path={["Dashboards", "System Dashboard"]} />
                    </div>
                  </Card>

                  {/* Hierarchical Navigation */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    <Card className="p-6">
                      <h3 className="text-lg text-[#172b4d] mb-4">Full Navigation Tree</h3>
                      <div className="flex justify-center">
                        <JiraNavigationHierarchy />
                      </div>
                    </Card>

                    <Card className="p-6">
                      <h3 className="text-lg text-[#172b4d] mb-4">Compact Navigation</h3>
                      <div className="flex justify-center">
                        <JiraCompactNavigation />
                      </div>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="data-tables" className="space-y-6">
                <JiraDataTables />
              </TabsContent>

              <TabsContent value="text-editor" className="space-y-6">
                <div className="flex items-center space-x-4 mb-6">
                  <Edit3 className="w-6 h-6 text-[#0c66e4]" />
                  <div>
                    <h2 className="text-xl text-[#172b4d]">Rich Text Editor</h2>
                    <p className="text-[#5e6c84]">Advanced text editing with formatting, media, and collaboration features</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg text-[#172b4d] mb-4">Full Editor</h3>
                    <JiraRichTextEditor 
                      placeholder="Start typing your content here..."
                      toolbar="full"
                      showPreview={true}
                      height="350px"
                    />
                  </Card>

                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="p-6">
                      <h3 className="text-lg text-[#172b4d] mb-4">Basic Editor</h3>
                      <JiraRichTextEditor 
                        placeholder="Basic formatting options..."
                        toolbar="basic"
                        height="200px"
                      />
                    </Card>

                    <Card className="p-6">
                      <h3 className="text-lg text-[#172b4d] mb-4">Comment Editor</h3>
                      <JiraCommentEditor onSubmit={(content) => console.log("Comment:", content)} />
                    </Card>
                  </div>

                  <Card className="p-6">
                    <h3 className="text-lg text-[#172b4d] mb-4">Editor Features</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="text-sm text-[#5e6c84] mb-3">Formatting</h4>
                        <ul className="text-sm text-[#5e6c84] space-y-1">
                          <li>• Bold, italic, underline</li>
                          <li>• Headings and paragraphs</li>
                          <li>• Lists and quotes</li>
                          <li>• Text alignment</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-sm text-[#5e6c84] mb-3">Media</h4>
                        <ul className="text-sm text-[#5e6c84] space-y-1">
                          <li>• Image insertion</li>
                          <li>• Link creation</li>
                          <li>• File attachments</li>
                          <li>• Code blocks</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-sm text-[#5e6c84] mb-3">Collaboration</h4>
                        <ul className="text-sm text-[#5e6c84] space-y-1">
                          <li>• @ mentions</li>
                          <li>• Live preview</li>
                          <li>• Character count</li>
                          <li>• Auto-save</li>
                        </ul>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="email" className="space-y-6">
                <div className="flex items-center space-x-4 mb-6">
                  <Mail className="w-6 h-6 text-[#0c66e4]" />
                  <div>
                    <h2 className="text-xl text-[#172b4d]">Email Templates</h2>
                    <p className="text-[#5e6c84]">Create and manage email templates for notifications and communication</p>
                  </div>
                </div>

                <JiraEmailTemplate />

                <Card className="p-6">
                  <h3 className="text-lg text-[#172b4d] mb-4">Template Gallery</h3>
                  <JiraEmailTemplateGallery />
                </Card>
              </TabsContent>

              <TabsContent value="accordion" className="space-y-6">
                <JiraAccordionShowcase />
              </TabsContent>

              <TabsContent value="messages" className="space-y-6">
                <section>
                  <h2 className="text-xl text-[#172b4d] mb-4">Message Components</h2>
                  <div className="space-y-6">
                    <Card className="p-6">
                      <h3 className="text-lg text-[#172b4d] mb-4">System Messages</h3>
                      <div className="space-y-4">
                        <JiraBanner variant="info">
                          <strong>System Update:</strong> Maintenance scheduled for tonight at 2 AM EST.
                        </JiraBanner>
                        
                        <JiraBanner 
                          variant="warning"
                          action={<JiraButton variant="link" size="sm">Review</JiraButton>}
                        >
                          <strong>Storage Warning:</strong> Your workspace is approaching the storage limit.
                        </JiraBanner>
                        
                        <JiraBanner variant="error">
                          <strong>Service Disruption:</strong> We're experiencing issues with our API.
                        </JiraBanner>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <h3 className="text-lg text-[#172b4d] mb-4">Section Messages</h3>
                      <JiraSectionMessage 
                        variant="info" 
                        title="Getting Started"
                        actions={
                          <>
                            <JiraButton variant="secondary" size="sm">Learn more</JiraButton>
                            <JiraButton variant="primary" size="sm">Get started</JiraButton>
                          </>
                        }
                      >
                        Welcome to the enhanced Jira component library! These components provide 
                        consistent patterns and improved accessibility across all Atlassian products.
                      </JiraSectionMessage>
                    </Card>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="forms" className="space-y-6">
                <section>
                  <h2 className="text-xl text-[#172b4d] mb-4">Form Components</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="p-6">
                      <h3 className="text-lg text-[#172b4d] mb-4">Interactive Buttons</h3>
                      <div className="flex flex-wrap gap-2">
                        <JiraTooltip content="Primary action button">
                          <JiraButton variant="primary">Create Issue</JiraButton>
                        </JiraTooltip>
                        <JiraButton variant="secondary">Cancel</JiraButton>
                        <JiraButton variant="subtle">More Actions</JiraButton>
                        <JiraButton variant="link">View Details</JiraButton>
                      </div>

                      <div className="mt-6">
                        <h4 className="text-sm text-[#5e6c84] mb-3">Action Buttons</h4>
                        <div className="flex items-center space-x-4">
                          <span className="text-[#5e6c84]">More button:</span>
                          <JiraMoreButton />
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <h3 className="text-lg text-[#172b4d] mb-4">Form Controls</h3>
                      <div className="space-y-4 max-w-xs">
                        <JiraInput placeholder="Search issues..." />
                        <JiraSelect
                          options={[
                            { value: "all", label: "All Projects" },
                            { value: "proj1", label: "Project Alpha" },
                            { value: "proj2", label: "Project Beta" }
                          ]}
                          placeholder="Select project"
                        />
                      </div>
                    </Card>
                  </div>
                </section>
              </TabsContent>
            </Tabs>

            {/* Loading Overlay Demo */}
            <JiraLoadingOverlay isLoading={loadingOverlay} message="Loading component library..." />
          </main>
        </div>
      </div>

      {/* Floating Action Button */}
      <JiraFloatingActionButton />

      {/* Modals & Panels */}
      <JiraIssueDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <JiraCommandBar isOpen={commandBarOpen} onClose={() => setCommandBarOpen(false)} />
      <JiraNotificationPanel isOpen={notificationPanelOpen} onClose={() => setNotificationPanelOpen(false)} />
      <JiraQuickAdd isOpen={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  );
}