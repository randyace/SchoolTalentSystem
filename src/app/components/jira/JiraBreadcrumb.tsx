import { ChevronRight } from "lucide-react";

export function JiraBreadcrumb() {
  const breadcrumbs = [
    { label: "Projects", href: "#" },
    { label: "My Project", href: "#" },
    { label: "Kanban Board", href: "#" },
    { label: "PROJ-123", href: "#", current: true }
  ];

  return (
    <nav className="flex items-center space-x-1 text-sm">
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-[#5e6c84] mx-1" />
          )}
          <a
            href={item.href}
            className={`
              hover:text-[#0052cc] transition-colors
              ${item.current ? 'text-[#172b4d]' : 'text-[#5e6c84]'}
            `}
          >
            {item.label}
          </a>
        </div>
      ))}
    </nav>
  );
}