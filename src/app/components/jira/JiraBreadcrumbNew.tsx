import { ChevronRight, Home, MoreHorizontal } from "lucide-react";
import { ReactNode } from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
  current?: boolean;
}

interface JiraBreadcrumbNewProps {
  items: BreadcrumbItem[];
  maxItems?: number;
  showHome?: boolean;
}

export function JiraBreadcrumbNew({ 
  items, 
  maxItems = 5,
  showHome = true 
}: JiraBreadcrumbNewProps) {
  const processedItems = showHome 
    ? [{ label: "Home", href: "/", icon: <Home className="w-4 h-4" /> }, ...items]
    : items;

  const shouldCollapse = processedItems.length > maxItems;
  let displayItems = processedItems;

  if (shouldCollapse) {
    const firstItems = processedItems.slice(0, 1);
    const lastItems = processedItems.slice(-(maxItems - 2));
    displayItems = [
      ...firstItems,
      { label: "...", href: undefined },
      ...lastItems
    ];
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm">
      {displayItems.map((item, index) => {
        const isLast = index === displayItems.length - 1;
        const isEllipsis = item.label === "...";

        return (
          <div key={index} className="flex items-center space-x-1">
            {isEllipsis ? (
              <button className="p-1 hover:bg-[#f4f5f7] rounded text-[#5e6c84]">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                {item.href ? (
                  <a
                    href={item.href}
                    className={`
                      flex items-center space-x-1 px-2 py-1 rounded hover:bg-[#f4f5f7] transition-colors
                      ${isLast 
                        ? 'text-[#172b4d] cursor-default' 
                        : 'text-[#0c66e4] hover:text-[#0747a6]'
                      }
                    `}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.icon}
                    <span className="truncate max-w-32">{item.label}</span>
                  </a>
                ) : (
                  <span className="flex items-center space-x-1 px-2 py-1 text-[#172b4d]">
                    {item.icon}
                    <span className="truncate max-w-32">{item.label}</span>
                  </span>
                )}
              </div>
            )}
            
            {!isLast && (
              <ChevronRight className="w-4 h-4 text-[#8993a4]" />
            )}
          </div>
        );
      })}
    </nav>
  );
}