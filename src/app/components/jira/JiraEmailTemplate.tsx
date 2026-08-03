import { 
  Mail, 
  Send, 
  Save, 
  Eye, 
  Copy, 
  Download,
  Settings,
  Users,
  Clock,
  Tag,
  Image,
  Palette,
  Layout,
  Type,
  Link2,
  Calendar
} from "lucide-react";
import { useState } from "react";
import { JiraButton } from "./JiraButton";
import { JiraInput } from "./JiraInput";
import { JiraSelect } from "./JiraSelect";
import { JiraTooltip } from "./JiraTooltip";
import { JiraRichTextEditor } from "./JiraRichTextEditor";
import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: "notification" | "assignment" | "reminder" | "report";
  variables: string[];
  lastModified: string;
}

const emailTemplates: EmailTemplate[] = [
  {
    id: "issue-assigned",
    name: "Issue Assigned",
    subject: "Issue {{issueKey}} has been assigned to you",
    content: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #172b4d; margin-bottom: 20px;">Issue Assignment Notification</h2>
        
        <div style="background: #f4f5f7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #0052cc;">{{issueKey}}: {{issueTitle}}</h3>
          <p style="margin: 0; color: #5e6c84;">Priority: {{issuePriority}} | Status: {{issueStatus}}</p>
        </div>
        
        <p>Hi {{assigneeName}},</p>
        <p>The issue <strong>{{issueKey}}</strong> has been assigned to you by {{reporterName}}.</p>
        
        <div style="margin: 20px 0;">
          <a href="{{issueUrl}}" style="background: #0052cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Issue</a>
        </div>
        
        <p style="color: #5e6c84; font-size: 12px;">This is an automated notification from Jira.</p>
      </div>
    `,
    type: "assignment",
    variables: ["issueKey", "issueTitle", "issuePriority", "issueStatus", "assigneeName", "reporterName", "issueUrl"],
    lastModified: "2 hours ago"
  },
  {
    id: "sprint-report",
    name: "Sprint Report",
    subject: "Sprint {{sprintName}} Summary Report",
    content: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #172b4d; margin-bottom: 20px;">Sprint Summary</h2>
        
        <div style="background: #e3fcef; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #006644;">{{sprintName}} Completed</h3>
          <p style="margin: 0; color: #5e6c84;">{{sprintStartDate}} - {{sprintEndDate}}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0;">
          <div style="text-align: center; padding: 15px; background: #f4f5f7; border-radius: 8px;">
            <div style="font-size: 24px; font-weight: bold; color: #172b4d;">{{completedIssues}}</div>
            <div style="color: #5e6c84; font-size: 12px;">Completed</div>
          </div>
          <div style="text-align: center; padding: 15px; background: #f4f5f7; border-radius: 8px;">
            <div style="font-size: 24px; font-weight: bold; color: #172b4d;">{{totalStoryPoints}}</div>
            <div style="color: #5e6c84; font-size: 12px;">Story Points</div>
          </div>
          <div style="text-align: center; padding: 15px; background: #f4f5f7; border-radius: 8px;">
            <div style="font-size: 24px; font-weight: bold; color: #172b4d;">{{teamVelocity}}</div>
            <div style="color: #5e6c84; font-size: 12px;">Velocity</div>
          </div>
        </div>
        
        <div style="margin: 20px 0;">
          <a href="{{sprintReportUrl}}" style="background: #0052cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Full Report</a>
        </div>
      </div>
    `,
    type: "report",
    variables: ["sprintName", "sprintStartDate", "sprintEndDate", "completedIssues", "totalStoryPoints", "teamVelocity", "sprintReportUrl"],
    lastModified: "1 day ago"
  },
  {
    id: "due-date-reminder",
    name: "Due Date Reminder",
    subject: "Reminder: {{issueKey}} is due {{dueDate}}",
    content: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #172b4d; margin-bottom: 20px;">Due Date Reminder</h2>
        
        <div style="background: #fff4e6; border-left: 4px solid #ff8b00; padding: 20px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #974f00;">{{issueKey}}: {{issueTitle}}</h3>
          <p style="margin: 0; color: #5e6c84;">Due: {{dueDate}} | Assigned to: {{assigneeName}}</p>
        </div>
        
        <p>This is a friendly reminder that the following issue is due soon:</p>
        
        <div style="margin: 20px 0;">
          <a href="{{issueUrl}}" style="background: #ff8b00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Issue</a>
        </div>
        
        <p style="color: #5e6c84; font-size: 12px;">You can update your notification preferences in your profile settings.</p>
      </div>
    `,
    type: "reminder",
    variables: ["issueKey", "issueTitle", "dueDate", "assigneeName", "issueUrl"],
    lastModified: "3 days ago"
  }
];

export function JiraEmailTemplate() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(emailTemplates[0]);
  const [subject, setSubject] = useState(selectedTemplate.subject || "");
  const [content, setContent] = useState(selectedTemplate.content || "");
  const [previewMode, setPreviewMode] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const handleTemplateChange = (templateId: string) => {
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setSubject(template.subject || "");
      setContent(template.content || "");
    }
  };

  const renderPreview = () => {
    // Replace variables with sample data for preview
    const sampleData: Record<string, string> = {
      issueKey: "PROJ-123",
      issueTitle: "Update user authentication flow",
      issuePriority: "High",
      issueStatus: "In Progress",
      assigneeName: "John Doe",
      reporterName: "Jane Smith",
      issueUrl: "#",
      sprintName: "Sprint 24",
      sprintStartDate: "Nov 1, 2024",
      sprintEndDate: "Nov 15, 2024",
      completedIssues: "12",
      totalStoryPoints: "34",
      teamVelocity: "28",
      sprintReportUrl: "#",
      dueDate: "Tomorrow"
    };

    let previewContent = String(content || "");
    let previewSubject = String(subject || "");

    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      previewContent = previewContent.replace(regex, value);
      previewSubject = previewSubject.replace(regex, value);
    });

    return { subject: previewSubject, content: previewContent };
  };

  const preview = renderPreview();

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg text-[#172b4d] flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Email Templates
          </h3>
          
          <div className="flex items-center space-x-2">
            <JiraButton variant="secondary" size="sm">
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </JiraButton>
            <JiraButton variant="primary" size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </JiraButton>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm text-[#5e6c84] mb-2">Template</label>
            <JiraSelect
              options={emailTemplates.map(template => ({
                value: template.id,
                label: template.name
              }))}
              value={selectedTemplate.id}
              onChange={handleTemplateChange}
            />
          </div>
          
          <div>
            <label className="block text-sm text-[#5e6c84] mb-2">Type</label>
            <div className="flex items-center space-x-2">
              <div className={`
                px-3 py-1 rounded-full text-sm
                ${selectedTemplate.type === 'notification' ? 'bg-[#deebff] text-[#0052cc]' : ''}
                ${selectedTemplate.type === 'assignment' ? 'bg-[#e3fcef] text-[#006644]' : ''}
                ${selectedTemplate.type === 'reminder' ? 'bg-[#fff4e6] text-[#974f00]' : ''}
                ${selectedTemplate.type === 'report' ? 'bg-[#eae6ff] text-[#5243aa]' : ''}
              `}>
                {selectedTemplate.type}
              </div>
              <span className="text-sm text-[#5e6c84]">
                Last modified {selectedTemplate.lastModified}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Template Editor */}
      <Tabs defaultValue="editor" className="w-full">
        <TabsList>
          <TabsTrigger value="editor">
            <Settings className="w-4 h-4 mr-2" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="variables">
            <Tag className="w-4 h-4 mr-2" />
            Variables
          </TabsTrigger>
          <TabsTrigger value="test">
            <Send className="w-4 h-4 mr-2" />
            Test
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#5e6c84] mb-2">Subject Line</label>
                <JiraInput
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject..."
                />
              </div>
              
              <div>
                <label className="block text-sm text-[#5e6c84] mb-2">Email Content</label>
                <JiraRichTextEditor
                  value={content}
                  onChange={setContent}
                  height="400px"
                  toolbar="full"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="p-4 bg-[#f4f5f7] rounded-lg">
                <div className="text-sm text-[#5e6c84] mb-1">Subject:</div>
                <div className="text-[#172b4d] font-medium">{preview.subject}</div>
              </div>
              
              <div 
                className="border border-[#dfe1e6] rounded-lg p-6 bg-white"
                dangerouslySetInnerHTML={{ __html: preview.content }}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="variables" className="space-y-4">
          <Card className="p-6">
            <h4 className="text-[#172b4d] mb-4">Available Variables</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {selectedTemplate.variables.map((variable) => (
                <div key={variable} className="flex items-center justify-between p-3 border border-[#dfe1e6] rounded-lg">
                  <div>
                    <div className="text-sm text-[#172b4d] font-mono">
                      {`{{${variable}}}`}
                    </div>
                    <div className="text-xs text-[#5e6c84] capitalize">
                      {variable.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  </div>
                  <JiraTooltip content="Copy to clipboard">
                    <button
                      onClick={() => navigator.clipboard.writeText(`{{${variable}}}`)}
                      className="p-1 hover:bg-[#f4f5f7] rounded"
                    >
                      <Copy className="w-4 h-4 text-[#5e6c84]" />
                    </button>
                  </JiraTooltip>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-[#e9f2ff] rounded-lg">
              <h5 className="text-sm text-[#0052cc] mb-2">Usage</h5>
              <p className="text-sm text-[#172b4d]">
                Use variables in your template by wrapping them in double curly braces, like <code>{"{{issueKey}}"}</code>. 
                These will be automatically replaced with actual values when the email is sent.
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card className="p-6">
            <h4 className="text-[#172b4d] mb-4">Send Test Email</h4>
            
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm text-[#5e6c84] mb-2">Test Email Address</label>
                <JiraInput
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your.email@company.com"
                  type="email"
                />
              </div>
              
              <div className="p-4 bg-[#fff4e6] rounded-lg">
                <div className="text-sm text-[#974f00] mb-2">Preview Note</div>
                <p className="text-sm text-[#5e6c84]">
                  The test email will use sample data to replace template variables. 
                  This lets you see how the email will look when sent to real recipients.
                </p>
              </div>
              
              <JiraButton 
                variant="primary" 
                disabled={!testEmail}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Test Email
              </JiraButton>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Email template gallery component
export function JiraEmailTemplateGallery() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {emailTemplates.map((template) => (
        <Card key={template.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <h4 className="text-[#172b4d]">{template.name}</h4>
            <div className={`
              px-2 py-1 rounded-full text-xs
              ${template.type === 'notification' ? 'bg-[#deebff] text-[#0052cc]' : ''}
              ${template.type === 'assignment' ? 'bg-[#e3fcef] text-[#006644]' : ''}
              ${template.type === 'reminder' ? 'bg-[#fff4e6] text-[#974f00]' : ''}
              ${template.type === 'report' ? 'bg-[#eae6ff] text-[#5243aa]' : ''}
            `}>
              {template.type}
            </div>
          </div>
          
          <p className="text-sm text-[#5e6c84] mb-3">{template.subject}</p>
          
          <div className="flex items-center justify-between text-xs text-[#8993a4]">
            <span>{template.variables.length} variables</span>
            <span>{template.lastModified}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}