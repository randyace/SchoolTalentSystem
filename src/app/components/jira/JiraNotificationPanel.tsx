import { Bell, X, Check, Clock, User, MessageSquare, AlertTriangle, Settings } from "lucide-react";
import { useState } from "react";
import { JiraAvatar } from "./JiraAvatar";

interface Notification {
  id: string;
  type: "mention" | "assignment" | "comment" | "update" | "alert";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  avatar?: string;
  project?: string;
  issueKey?: string;
}

interface JiraNotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JiraNotificationPanel({ isOpen, onClose }: JiraNotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "mention",
      title: "You were mentioned",
      message: "John Doe mentioned you in PROJ-123",
      timestamp: "2 minutes ago",
      read: false,
      avatar: "JD",
      project: "Project Alpha",
      issueKey: "PROJ-123"
    },
    {
      id: "2",
      type: "assignment",
      title: "Issue assigned",
      message: "PROJ-124 was assigned to you",
      timestamp: "1 hour ago",
      read: false,
      project: "Project Beta",
      issueKey: "PROJ-124"
    },
    {
      id: "3",
      type: "comment",
      title: "New comment",
      message: "Jane Smith commented on PROJ-125",
      timestamp: "3 hours ago",
      read: true,
      avatar: "JS",
      project: "Project Gamma",
      issueKey: "PROJ-125"
    },
    {
      id: "4",
      type: "update",
      title: "Status changed",
      message: "PROJ-126 moved to In Progress",
      timestamp: "1 day ago",
      read: true,
      project: "Project Alpha",
      issueKey: "PROJ-126"
    },
    {
      id: "5",
      type: "alert",
      title: "Release reminder",
      message: "Version 2.1.0 release scheduled for tomorrow",
      timestamp: "1 day ago",
      read: true,
      project: "Project Alpha"
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "mention":
        return MessageSquare;
      case "assignment":
        return User;
      case "comment":
        return MessageSquare;
      case "update":
        return Clock;
      case "alert":
        return AlertTriangle;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "mention":
        return "text-[#0052cc]";
      case "assignment":
        return "text-[#36b37e]";
      case "comment":
        return "text-[#5e6c84]";
      case "update":
        return "text-[#ff8b00]";
      case "alert":
        return "text-[#de350b]";
      default:
        return "text-[#5e6c84]";
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#dfe1e6]">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-[#5e6c84]" />
            <h2 className="text-lg text-[#172b4d]">Notifications</h2>
            {unreadCount > 0 && (
              <div className="w-5 h-5 bg-[#de350b] text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[#0052cc] hover:underline"
              >
                Mark all read
              </button>
            )}
            <button className="p-1 hover:bg-[#f4f5f7] rounded">
              <Settings className="w-4 h-4 text-[#5e6c84]" />
            </button>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-[#f4f5f7] rounded"
            >
              <X className="w-4 h-4 text-[#5e6c84]" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Bell className="w-12 h-12 text-[#5e6c84] opacity-50 mb-4" />
              <h3 className="text-[#172b4d] mb-2">No notifications</h3>
              <p className="text-sm text-[#5e6c84]">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f4f5f7]">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const iconColor = getNotificationColor(notification.type);
                
                return (
                  <div
                    key={notification.id}
                    className={`
                      p-4 hover:bg-[#f4f5f7] cursor-pointer transition-colors
                      ${!notification.read ? 'bg-[#deebff]/30 border-l-2 border-[#0052cc]' : ''}
                    `}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {notification.avatar ? (
                          <JiraAvatar 
                            name={notification.avatar} 
                            initials={notification.avatar} 
                            size="sm" 
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-full bg-[#f4f5f7] flex items-center justify-center`}>
                            <Icon className={`w-4 h-4 ${iconColor}`} />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm text-[#172b4d] truncate">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-[#0052cc] rounded-full ml-2"></div>
                          )}
                        </div>
                        
                        <p className="text-sm text-[#5e6c84] mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs text-[#5e6c84]">
                            {notification.timestamp}
                          </span>
                          {notification.project && (
                            <>
                              <span className="text-xs text-[#5e6c84]">•</span>
                              <span className="text-xs text-[#5e6c84]">
                                {notification.project}
                              </span>
                            </>
                          )}
                          {notification.issueKey && (
                            <>
                              <span className="text-xs text-[#5e6c84]">•</span>
                              <span className="text-xs text-[#0052cc]">
                                {notification.issueKey}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}