import { FileText, Search, Inbox, Plus, RefreshCw } from "lucide-react";
import { ReactNode } from "react";
import { JiraButton } from "./JiraButton";

interface JiraEmptyStateProps {
  variant?: "no-content" | "no-results" | "no-access" | "error" | "custom";
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  illustration?: ReactNode;
}

export function JiraEmptyState({
  variant = "no-content",
  title,
  description,
  icon,
  actions,
  illustration
}: JiraEmptyStateProps) {
  const variants = {
    "no-content": {
      icon: FileText,
      iconColor: "text-[#8993a4]"
    },
    "no-results": {
      icon: Search,
      iconColor: "text-[#8993a4]"
    },
    "no-access": {
      icon: Inbox,
      iconColor: "text-[#8993a4]"
    },
    "error": {
      icon: RefreshCw,
      iconColor: "text-[#ca3521]"
    },
    "custom": {
      icon: FileText,
      iconColor: "text-[#8993a4]"
    }
  };

  const config = variants[variant];
  const IconComponent = icon || config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center max-w-md mx-auto">
      {illustration ? (
        <div className="mb-6">
          {illustration}
        </div>
      ) : (
        <div className="mb-6">
          <div className="w-16 h-16 rounded-full bg-[#f4f5f7] flex items-center justify-center mb-4">
            <IconComponent className={`w-8 h-8 ${config.iconColor}`} />
          </div>
        </div>
      )}

      <h3 className="text-lg text-[#172b4d] mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-[#5e6c84] text-sm leading-6 mb-6">
          {description}
        </p>
      )}

      {actions && (
        <div className="flex flex-col sm:flex-row gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

// Preset empty states
export function JiraNoIssuesFound() {
  return (
    <JiraEmptyState
      variant="no-results"
      title="No issues found"
      description="Try adjusting your search criteria or filters to find what you're looking for."
      actions={
        <>
          <JiraButton variant="secondary">
            Clear filters
          </JiraButton>
          <JiraButton variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Create issue
          </JiraButton>
        </>
      }
    />
  );
}

export function JiraNoProjectAccess() {
  return (
    <JiraEmptyState
      variant="no-access"
      title="No access to this project"
      description="You don't have permission to view this project. Contact your administrator for access."
      actions={
        <JiraButton variant="secondary">
          Request access
        </JiraButton>
      }
    />
  );
}

export function JiraErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <JiraEmptyState
      variant="error"
      title="Something went wrong"
      description="We couldn't load this content. Please try again or contact support if the problem persists."
      actions={
        <JiraButton variant="primary" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try again
        </JiraButton>
      }
    />
  );
}