import { Home, Database, Map, Users, Calendar, FileText, Bot, Settings, LogOut, User } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "events", label: "Events", icon: Map },
    { id: "digitalrecordings", label: "Digital Recordings", icon: Calendar },
    { id: "medialog", label: "New Media Log", icon: Users },
    { id: "aux", label: "Aux File", icon: FileText },
    { id: "padhramanis", label: "Padhramanis", icon: Database },
    { id: "ai-assistant", label: "AI Assistant", icon: Bot },
    { id: "user-management", label: "User Management", icon: User },
  ];

  return (
    <div className="w-72 h-full flex flex-col backdrop-blur-xl bg-gradient-to-b from-slate-900/95 via-slate-800/90 to-slate-900/95 border-r border-slate-700/50 rounded-r-2xl shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Data Library</h2>
            <p className="text-xs text-slate-400">Analytics Dashboard</p>
          </div>
        </div>
        
        {/* User Profile */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <Avatar className="w-8 h-8">
            <AvatarImage src="" />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">JD</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">John Doe</p>
            <p className="text-xs text-slate-400 truncate">Administrator</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start gap-3 h-11 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30 shadow-lg" 
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50"
                }`}
                onClick={() => onViewChange(item.id)}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-blue-400"></div>
                )}
              </Button>
            );
          })}
        </div>
        
        <Separator className="my-6 bg-slate-700/50" />
        
        {/* Settings & Logout */}
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50 transition-all duration-200"
            onClick={() => onViewChange("settings")}
          >
            <Settings className="w-4 h-4" />
            <span className="font-medium">Settings</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11 rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Logout</span>
          </Button>
        </div>
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="text-xs text-slate-500 text-center">
          © 2024 Data Library v2.1.0
        </div>
      </div>
    </div>
  );
}