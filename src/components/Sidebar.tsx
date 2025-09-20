import React, { useState } from "react";
import { Home, Database, Map, Users, Calendar, FileText, Bot, Settings, LogOut, User, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "events", label: "Events", icon: Map },
    { id: "digitalrecordings", label: "Digital Recordings", icon: Calendar },
    { id: "medialog", label: "New Media Log", icon: Users },
    { id: "aux", label: "Aux File", icon: FileText },
    { id: "ai-assistant", label: "AI Assistant", icon: Bot },
    { id: "user-management", label: "User Management", icon: User },
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className={`h-full flex flex-col backdrop-blur-xl bg-gradient-to-b from-slate-900/95 via-slate-800/90 to-slate-900/95 border-r border-slate-700/50 rounded-r-2xl shadow-2xl transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-72'}`}>
        {/* Header */}
        <div className={`p-4 border-b border-slate-700/50 ${isCollapsed ? 'px-4' : 'p-6'}`}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <div>
                  <h2 className="text-xl font-bold text-white">Data Library</h2>
                  <p className="text-xs text-slate-400">Analytics Dashboard</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/50"
              onClick={toggleSidebar}
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </Button>
          </div>
          
          {/* User Profile */}
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 ${isCollapsed ? 'justify-center' : ''}`}>
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src="" />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">JD</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">John Doe</p>
                <p className="text-xs text-slate-400 truncate">Administrator</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-3 h-11 rounded-xl transition-all duration-200 ${isCollapsed ? 'justify-center' : ''} ${
                        isActive 
                          ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30 shadow-lg" 
                          : "text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50"
                      }`}
                      onClick={() => onViewChange(item.id)}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isCollapsed ? 'h-5 w-5' : ''}`} />
                      {!isCollapsed && <span className="font-medium">{item.label}</span>}
                      {!isCollapsed && isActive && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-blue-400"></div>
                      )}
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
                      <p>{item.label}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>
          
          {!isCollapsed && <Separator className="my-6 bg-slate-700/50" />}
          
          {/* Settings & Logout */}
          <div className={`space-y-1 ${isCollapsed ? 'mt-6 border-t border-slate-700/50 pt-4' : ''}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 h-11 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50 transition-all duration-200 ${isCollapsed ? 'justify-center' : ''}`}
                  onClick={() => onViewChange("settings")}
                >
                  <Settings className={`w-4 h-4 flex-shrink-0 ${isCollapsed ? 'h-5 w-5' : ''}`} />
                  {!isCollapsed && <span className="font-medium">Settings</span>}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
                  <p>Settings</p>
                </TooltipContent>
              )}
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 h-11 rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all duration-200 ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <LogOut className={`w-4 h-4 flex-shrink-0 ${isCollapsed ? 'h-5 w-5' : ''}`} />
                  {!isCollapsed && <span className="font-medium">Logout</span>}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="bg-red-900/80 text-white border-red-700">
                  <p>Logout</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50 mt-auto">
          {!isCollapsed && (
            <div className="text-xs text-slate-500 text-center">
              © 2024 v2.1.0
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}