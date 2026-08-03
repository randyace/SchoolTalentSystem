import { X, ExternalLink, MoreHorizontal } from "lucide-react";
import { ReactNode } from "react";
import { JiraButton } from "./JiraButton";

interface JiraDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
}

export function JiraDrawer({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  actions,
  width = "lg" 
}: JiraDrawerProps) {
  if (!isOpen) return null;

  const widthClasses = {
    sm: "w-96",
    md: "w-[32rem]",
    lg: "w-[40rem]",
    xl: "w-[48rem]"
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`
        fixed right-0 top-0 h-full bg-white shadow-2xl z-50 flex flex-col
        ${widthClasses[width]}
        animate-in slide-in-from-right duration-300
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#dfe1e6]">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg text-[#172b4d] truncate">{title}</h2>
              <button className="p-1 hover:bg-[#f4f5f7] rounded">
                <ExternalLink className="w-4 h-4 text-[#5e6c84]" />
              </button>
            </div>
            {subtitle && (
              <p className="text-sm text-[#5e6c84] mt-1">{subtitle}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <button className="p-2 hover:bg-[#f4f5f7] rounded">
              <MoreHorizontal className="w-4 h-4 text-[#5e6c84]" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-[#f4f5f7] rounded"
            >
              <X className="w-4 h-4 text-[#5e6c84]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Footer Actions */}
        {actions && (
          <div className="border-t border-[#dfe1e6] p-6">
            <div className="flex justify-end space-x-2">
              {actions}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Sample drawer content component
export function JiraIssueDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <JiraDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="PROJ-123: Update user authentication flow"
      subtitle="Story • Created 2 days ago • Updated 1 hour ago"
      actions={
        <>
          <JiraButton variant="secondary">Close</JiraButton>
          <JiraButton variant="primary">Save changes</JiraButton>
        </>
      }
    >
      <div className="p-6 space-y-6">
        {/* Description */}
        <section>
          <h3 className="text-sm text-[#5e6c84] uppercase tracking-wide mb-3">Description</h3>
          <div className="prose prose-sm max-w-none">
            <p className="text-[#172b4d]">
              We need to update the user authentication flow to improve security and user experience. 
              This includes implementing multi-factor authentication and streamlining the login process.
            </p>
            <ul className="mt-3 space-y-1">
              <li>Add MFA support</li>
              <li>Improve error messaging</li>
              <li>Update UI components</li>
            </ul>
          </div>
        </section>

        {/* Activity */}
        <section>
          <h3 className="text-sm text-[#5e6c84] uppercase tracking-wide mb-3">Activity</h3>
          <div className="space-y-4">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-[#0052cc] rounded-full flex items-center justify-center text-white text-xs">
                JD
              </div>
              <div className="flex-1">
                <div className="text-sm">
                  <span className="text-[#172b4d]">John Doe</span>
                  <span className="text-[#5e6c84]"> moved this issue to In Progress</span>
                </div>
                <div className="text-xs text-[#5e6c84] mt-1">2 hours ago</div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-[#36b37e] rounded-full flex items-center justify-center text-white text-xs">
                JS
              </div>
              <div className="flex-1">
                <div className="text-sm">
                  <span className="text-[#172b4d]">Jane Smith</span>
                  <span className="text-[#5e6c84]"> added a comment</span>
                </div>
                <div className="text-xs text-[#5e6c84] mt-1">1 day ago</div>
                <div className="mt-2 p-3 bg-[#f4f5f7] rounded text-sm text-[#172b4d]">
                  I've reviewed the requirements and they look good. Let's proceed with the implementation.
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </JiraDrawer>
  );
}