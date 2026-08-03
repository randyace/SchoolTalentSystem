interface JiraAvatarProps {
  name: string;
  initials: string;
  size?: "sm" | "md" | "lg";
  src?: string;
}

export function JiraAvatar({ name, initials, size = "md", src }: JiraAvatarProps) {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-12 h-12 text-base"
  };

  const colors = [
    "bg-[#0052cc]", "bg-[#36b37e]", "bg-[#00875a]", "bg-[#ff8b00]", 
    "bg-[#ff5630]", "bg-[#6554c0]", "bg-[#00b8d9]", "bg-[#253858]"
  ];
  
  const colorIndex = name.length % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div
      className={`
        ${sizeClasses[size]} ${bgColor} text-white
        rounded-full flex items-center justify-center
        font-medium cursor-pointer hover:opacity-80 transition-opacity
      `}
      title={name}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}