import { Search, Hash, User, Calendar, Zap, Plus, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

interface JiraCommandBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JiraCommandBar({ isOpen, onClose }: JiraCommandBarProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const commands = [
    {
      id: "create-issue",
      title: "Create Issue",
      subtitle: "Create a new issue in current project",
      icon: Plus,
      category: "Actions",
      shortcut: "⌘+I"
    },
    {
      id: "search-issues",
      title: "Search Issues",
      subtitle: "Search across all issues",
      icon: Search,
      category: "Search",
      shortcut: "⌘+K"
    },
    {
      id: "proj-123",
      title: "PROJ-123",
      subtitle: "Update user authentication flow",
      icon: Hash,
      category: "Issues"
    },
    {
      id: "proj-124",
      title: "PROJ-124",
      subtitle: "Fix login page responsiveness",
      icon: Hash,
      category: "Issues"
    },
    {
      id: "john-doe",
      title: "John Doe",
      subtitle: "Product Manager",
      icon: User,
      category: "People"
    },
    {
      id: "quick-filters",
      title: "My Open Issues",
      subtitle: "Issues assigned to you",
      icon: Zap,
      category: "Quick Filters"
    },
    {
      id: "calendar",
      title: "Release Calendar",
      subtitle: "View upcoming releases",
      icon: Calendar,
      category: "Views"
    }
  ];

  const filteredCommands = commands.filter(command =>
    command.title.toLowerCase().includes(query.toLowerCase()) ||
    command.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex(prev => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[activeIndex]) {
            console.log("Execute:", filteredCommands[activeIndex].id);
            onClose();
          }
          break;
        case "Escape":
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeIndex, filteredCommands, onClose]);

  if (!isOpen) return null;

  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, typeof commands>);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-50"
        onClick={onClose}
      />
      
      {/* Command Bar */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl bg-white rounded-lg shadow-2xl border border-[#dfe1e6] z-50">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-[#f4f5f7]">
          <Search className="w-5 h-5 text-[#5e6c84] mr-3" />
          <input
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 outline-none text-[#172b4d] placeholder-[#5e6c84]"
            autoFocus
          />
          <div className="text-xs text-[#5e6c84] bg-[#f4f5f7] px-2 py-1 rounded">
            ESC
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
            <div key={category}>
              <div className="px-4 py-2 text-xs text-[#5e6c84] uppercase tracking-wide bg-[#f4f5f7]">
                {category}
              </div>
              {categoryCommands.map((command, index) => {
                const globalIndex = filteredCommands.indexOf(command);
                return (
                  <button
                    key={command.id}
                    onClick={() => {
                      console.log("Execute:", command.id);
                      onClose();
                    }}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 text-left
                      transition-colors border-l-2
                      ${globalIndex === activeIndex
                        ? "bg-[#deebff] border-[#0052cc]"
                        : "border-transparent hover:bg-[#f4f5f7]"
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <command.icon className="w-4 h-4 text-[#5e6c84]" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-[#172b4d] truncate">{command.title}</div>
                        <div className="text-xs text-[#5e6c84] truncate">{command.subtitle}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {command.shortcut && (
                        <div className="text-xs text-[#5e6c84] bg-[#f4f5f7] px-2 py-1 rounded">
                          {command.shortcut}
                        </div>
                      )}
                      <ArrowRight className="w-3 h-3 text-[#5e6c84]" />
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {filteredCommands.length === 0 && query && (
          <div className="px-4 py-8 text-center text-[#5e6c84]">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <div>No results found for "{query}"</div>
          </div>
        )}
      </div>
    </>
  );
}