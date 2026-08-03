import { useState } from "react";
import { JiraBanner } from "./JiraBanner";
import { JiraInlineMessage } from "./JiraInlineMessage";
import { JiraSectionMessage } from "./JiraSectionMessage";
import { JiraSpinner, JiraCircularProgress, JiraSkeleton } from "./JiraSpinner";
import { JiraEmptyState } from "./JiraEmptyState";
import { JiraTooltip } from "./JiraTooltip";
import { JiraProgress } from "./JiraProgress";
import { JiraBreadcrumbNew } from "./JiraBreadcrumbNew";
import { JiraButton } from "./JiraButton";
import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { 
  Home, 
  Users, 
  Settings, 
  Palette, 
  Layout, 
  MessageSquare, 
  BarChart3,
  Zap,
  Sparkles
} from "lucide-react";

export function JiraComponentShowcase() {
  const [activeTab, setActiveTab] = useState("messages");
  const [progress, setProgress] = useState(75);

  return (
    <div className="min-h-screen bg-[#f4f5f7] p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Sparkles className="w-8 h-8 text-[#0c66e4]" />
            <h1 className="text-3xl text-[#172b4d]">Atlassian Design System Refresh</h1>
          </div>
          
          <p className="text-[#5e6c84] max-w-2xl mx-auto">
            Explore the latest components and patterns from the Atlassian Design System, 
            featuring improved accessibility, refined interactions, and modern visual design.
          </p>

          <JiraBreadcrumbNew
            items={[
              { label: "Design System", href: "#" },
              { label: "Components", href: "#" },
              { label: "Showcase", current: true }
            ]}
          />
        </div>

        {/* Feature Banner */}
        <JiraBanner
          variant="announcement"
          action={
            <div className="flex space-x-2">
              <Badge variant="secondary">New</Badge>
              <JiraButton variant="link" size="sm">Documentation</JiraButton>
            </div>
          }
        >
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4" />
            <span>
              <strong>Design Tokens 2.0:</strong> New color palette, spacing scale, and typography system now available.
            </span>
          </div>
        </JiraBanner>

        {/* Component Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="messages" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Messages</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Feedback</span>
            </TabsTrigger>
            <TabsTrigger value="navigation" className="flex items-center space-x-2">
              <Layout className="w-4 h-4" />
              <span>Navigation</span>
            </TabsTrigger>
            <TabsTrigger value="loading" className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Loading</span>
            </TabsTrigger>
            <TabsTrigger value="empty" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Empty States</span>
            </TabsTrigger>
          </TabsList>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <div className="grid gap-6">
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
                    <a href="#" className="text-[#ca3521] underline ml-1">Status page</a>
                  </JiraBanner>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg text-[#172b4d] mb-4">Inline Messages</h3>
                <div className="space-y-4">
                  <JiraInlineMessage variant="success" title="Changes Saved">
                    Your project settings have been updated successfully.
                  </JiraInlineMessage>
                  
                  <JiraInlineMessage variant="warning">
                    Some features may not work properly in older browsers.
                  </JiraInlineMessage>
                  
                  <JiraInlineMessage variant="info" title="Pro Tip">
                    Use keyboard shortcuts to navigate faster through your issues.
                  </JiraInlineMessage>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg text-[#172b4d] mb-4">Progress Indicators</h3>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm text-[#5e6c84] mb-2 block">Project Progress</label>
                    <JiraProgress value={progress} showValue label="Sprint completion" />
                    <div className="flex space-x-2 mt-2">
                      <JiraButton 
                        variant="subtle" 
                        size="sm"
                        onClick={() => setProgress(Math.max(0, progress - 10))}
                      >
                        -10%
                      </JiraButton>
                      <JiraButton 
                        variant="subtle" 
                        size="sm"
                        onClick={() => setProgress(Math.min(100, progress + 10))}
                      >
                        +10%
                      </JiraButton>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <JiraCircularProgress value={85} variant="success">
                      <span className="text-sm text-[#22a06b]">85%</span>
                    </JiraCircularProgress>
                    <div>
                      <div className="text-sm text-[#172b4d]">Code Coverage</div>
                      <div className="text-xs text-[#5e6c84]">Above target</div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg text-[#172b4d] mb-4">Interactive Tooltips</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <JiraTooltip content="Create a new issue in this project">
                      <JiraButton variant="primary" className="w-full">
                        Create Issue
                      </JiraButton>
                    </JiraTooltip>
                    
                    <JiraTooltip content="Bulk edit multiple issues at once" position="left">
                      <JiraButton variant="secondary" className="w-full">
                        Bulk Edit
                      </JiraButton>
                    </JiraTooltip>
                  </div>

                  <div className="text-sm text-[#5e6c84]">
                    Hover or focus on buttons to see enhanced tooltips with better positioning and timing.
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Navigation Tab */}
          <TabsContent value="navigation" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg text-[#172b4d] mb-4">Enhanced Breadcrumbs</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm text-[#5e6c84] mb-2">Standard Navigation</h4>
                  <JiraBreadcrumbNew
                    items={[
                      { label: "Projects", href: "#" },
                      { label: "Alpha Team", href: "#" },
                      { label: "Sprint 24", href: "#" },
                      { label: "Board", current: true }
                    ]}
                  />
                </div>

                <div>
                  <h4 className="text-sm text-[#5e6c84] mb-2">With Icons</h4>
                  <JiraBreadcrumbNew
                    items={[
                      { label: "Dashboard", href: "#", icon: <Home className="w-4 h-4" /> },
                      { label: "Team", href: "#", icon: <Users className="w-4 h-4" /> },
                      { label: "Settings", current: true, icon: <Settings className="w-4 h-4" /> }
                    ]}
                    showHome={false}
                  />
                </div>

                <div>
                  <h4 className="text-sm text-[#5e6c84] mb-2">Long Path (Auto-collapse)</h4>
                  <JiraBreadcrumbNew
                    items={[
                      { label: "Organization", href: "#" },
                      { label: "Marketing Team", href: "#" },
                      { label: "Q4 Campaign", href: "#" },
                      { label: "Social Media", href: "#" },
                      { label: "Facebook Ads", href: "#" },
                      { label: "Campaign Analytics", current: true }
                    ]}
                    maxItems={4}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Loading Tab */}
          <TabsContent value="loading" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg text-[#172b4d] mb-4">Loading Indicators</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm text-[#5e6c84] mb-2">Inline Spinners</h4>
                    <div className="space-y-3">
                      <JiraSpinner size="sm" label="Saving..." />
                      <JiraSpinner size="md" label="Processing request..." />
                      <JiraSpinner size="lg">
                        Loading workspace data...
                      </JiraSpinner>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm text-[#5e6c84] mb-2">Circular Progress</h4>
                    <div className="flex items-center space-x-4">
                      <JiraCircularProgress value={30} size={40} />
                      <JiraCircularProgress value={60} variant="warning" size={50} />
                      <JiraCircularProgress value={100} variant="success" size={60}>
                        <span className="text-lg">✓</span>
                      </JiraCircularProgress>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg text-[#172b4d] mb-4">Skeleton Loading</h3>
                <div className="space-y-4">
                  <h4 className="text-sm text-[#5e6c84]">Content Placeholders</h4>
                  <JiraSkeleton lines={4} />
                  
                  <div className="text-xs text-[#5e6c84] mt-4">
                    Skeleton loaders provide visual feedback while content is being fetched.
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Empty States Tab */}
          <TabsContent value="empty" className="space-y-6">
            <div className="grid gap-6">
              <Card className="p-6">
                <h3 className="text-lg text-[#172b4d] mb-4">Contextual Empty States</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="border border-[#dfe1e6] rounded-lg">
                    <JiraEmptyState
                      variant="no-content"
                      title="No issues yet"
                      description="Create your first issue to get started."
                      actions={
                        <JiraButton variant="primary" size="sm">
                          Create Issue
                        </JiraButton>
                      }
                    />
                  </div>

                  <div className="border border-[#dfe1e6] rounded-lg">
                    <JiraEmptyState
                      variant="no-results"
                      title="No matches"
                      description="Try adjusting your search criteria."
                      actions={
                        <JiraButton variant="secondary" size="sm">
                          Clear filters
                        </JiraButton>
                      }
                    />
                  </div>

                  <div className="border border-[#dfe1e6] rounded-lg">
                    <JiraEmptyState
                      variant="error"
                      title="Connection error"
                      description="Check your internet connection."
                      actions={
                        <JiraButton variant="primary" size="sm">
                          Retry
                        </JiraButton>
                      }
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg text-[#172b4d] mb-4">Section Messages</h3>
                <JiraSectionMessage
                  variant="info"
                  title="Welcome to the Component Library"
                  actions={
                    <>
                      <JiraButton variant="secondary" size="sm">
                        View documentation
                      </JiraButton>
                      <JiraButton variant="primary" size="sm">
                        Get started
                      </JiraButton>
                    </>
                  }
                >
                  This showcase demonstrates the latest Atlassian Design System components 
                  with improved accessibility, refined visual design, and better user experience patterns.
                  Each component follows the latest design tokens and interaction guidelines.
                </JiraSectionMessage>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}