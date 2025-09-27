// SIDEBAR SLIDING CHANGE: Added ChevronLeft and ChevronRight icons for toggle button
import { Home, Database, Map, Users, Calendar, FileText, Bot, Settings, LogOut, User, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
// GOOGLE AUTH INTEGRATION: Added authentication context for user management and logout
import { useAuth } from "../contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

// SIDEBAR SLIDING CHANGE: Added collapsed and onToggleCollapse props for sliding functionality
interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ activeView, onViewChange, collapsed, onToggleCollapse }: SidebarProps) {
  const { user, logout } = useAuth();
  
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "events", label: "Events", icon: Map },
    { id: "digitalrecordings", label: "Digital Recordings", icon: Calendar },
    { id: "medialog", label: "New Media Log", icon: Users },
    { id: "aux", label: "Aux File", icon: FileText },
    { id: "ai-assistant", label: "AI Assistant", icon: Bot },
    { id: "user-management", label: "User Management", icon: User },
  ];

  return (
    // SIDEBAR SLIDING CHANGE: Dynamic width based on collapsed state (w-16 collapsed, w-72 expanded) with smooth transitions
    <div className={`${collapsed ? 'w-16' : 'w-72'} h-full flex flex-col backdrop-blur-xl bg-gradient-to-b from-slate-900/95 via-slate-800/90 to-slate-900/95 border-r border-slate-700/50 rounded-r-2xl shadow-2xl transition-all duration-300 relative`}>
      {/* SIDEBAR SLIDING CHANGE: ClickUp-style toggle button positioned on the right edge */}
    <Button
  variant="ghost"
  size="sm"
  style={{
    position: "absolute",
    top: "1.5rem",
    right: collapsed ? "-0.75rem" : "0.75rem", // move outside when collapsed
    width: "1.5rem",
    height: "1.5rem",
    borderRadius: "9999px",
    backgroundColor: "rgb(30 41 59)",
    border: "1px solid rgba(51, 65, 85, 0.5)",
    zIndex: 50,
    padding: 0,
    cursor: "pointer",
    transition: "all 0.3s ease",
  }}
  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(51 65 85)")}
  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgb(30 41 59)")}
  onClick={onToggleCollapse}
>
  {collapsed ? <ChevronRight className="w-3 h-3 text-slate-300" /> : <ChevronLeft className="w-3 h-3 text-slate-300" />}
</Button>



      {/* SIDEBAR SLIDING CHANGE: Header with responsive padding and layout */}
      <div className={`${collapsed ? 'p-3' : 'p-6'} border-b border-slate-700/50 transition-all duration-300`}>
        {/* SIDEBAR SLIDING CHANGE: Flex layout changes to center when collapsed, gap when expanded */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} mb-4`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          {/* SIDEBAR SLIDING CHANGE: Conditionally render text content only when expanded */}
          {!collapsed && (
            <div>
              <h2 className="text-xl font-bold text-white">Data Library</h2>
              <p className="text-xs text-slate-400">Analytics Dashboard</p>
            </div>
          )}
        </div>
        
        {/* GOOGLE AUTH INTEGRATION: Updated user profile section to show authenticated user info */}
        {!collapsed && user && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.picture} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">
                {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
        {/* SIDEBAR SLIDING CHANGE: Show only avatar when collapsed, centered */}
        {collapsed && user && (
          <div className="flex justify-center">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.picture} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">
                {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
      
      {/* SIDEBAR SLIDING CHANGE: Navigation with responsive padding and button layouts */}
      <nav className={`flex-1 ${collapsed ? 'p-2' : 'p-4'} transition-all duration-300`}>
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              // SIDEBAR SLIDING CHANGE: Dynamic button layout - centered icons when collapsed, left-aligned with text when expanded
              <Button
                key={item.id}
                variant="ghost"
                size={collapsed ? "sm" : "default"}
                className={`w-full ${collapsed ? 'justify-center p-0 h-10' : 'justify-start gap-3 h-11'} rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30 shadow-lg" 
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50"
                }`}
                onClick={() => onViewChange(item.id)}
                // SIDEBAR SLIDING CHANGE: Add tooltips when collapsed for accessibility
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4" />
                {/* SIDEBAR SLIDING CHANGE: Conditionally render labels and active indicators only when expanded */}
                {!collapsed && (
                  <>
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-blue-400"></div>
                    )}
                  </>
                )}
              </Button>
            );
          })}
        </div>
        
        <Separator className="my-6 bg-slate-700/50" />
        
        {/* SIDEBAR SLIDING CHANGE: Settings & Logout with responsive layouts and tooltips */}
        <div className="space-y-1">
          {/* SIDEBAR SLIDING CHANGE: Same responsive button pattern as navigation items */}
          <Button
            variant="ghost"
            size={collapsed ? "sm" : "default"}
            className={`w-full ${collapsed ? 'justify-center p-0 h-10' : 'justify-start gap-3 h-11'} rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50 transition-all duration-200`}
            onClick={() => onViewChange("settings")}
            // SIDEBAR SLIDING CHANGE: Tooltip for settings when collapsed
            title={collapsed ? "Settings" : undefined}
          >
            <Settings className="w-4 h-4" />
            {!collapsed && <span className="font-medium">Settings</span>}
          </Button>
          {/* GOOGLE AUTH INTEGRATION: Updated logout button to call authentication logout */}
          <Button
            variant="ghost"
            size={collapsed ? "sm" : "default"}
            className={`w-full ${collapsed ? 'justify-center p-0 h-10' : 'justify-start gap-3 h-11'} rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all duration-200`}
            onClick={logout}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="font-medium">Logout</span>}
          </Button>
        </div>
      </nav>
      
      {/* SIDEBAR SLIDING CHANGE: Footer only visible when sidebar is expanded */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-700/50">
          <div className="text-xs text-slate-500 text-center">
            © 2024 Data Library v2.1.0
          </div>
        </div>
      )}
    </div>
  );
}