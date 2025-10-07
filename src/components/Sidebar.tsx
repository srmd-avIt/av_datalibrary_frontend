// src/components/Sidebar.js

import { Home, Database, Map, Users, Calendar, FileText, Bot, LogOut, User, ChevronLeft, ChevronRight, Music, Hash, Layers, Gift, Flag, MapPin, Tag, Globe, Book, Film, Edit, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useAuth } from "../contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { useMemo, useState } from "react";
import'../styles/globals.css';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

// Define types for menu items, including children for nesting
type MenuItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  children?: Omit<MenuItem, 'children'>[];
};

export function Sidebar({ activeView, onViewChange, collapsed, onToggleCollapse }: SidebarProps) {
  const { user, logout } = useAuth();
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(false);
  
  // This is the MASTER list of all possible views in the app.
  // The 'label' MUST match the resource name in your UserManagement component's APP_RESOURCES array.
  const allMenuItems: MenuItem[] = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "events", label: "Events", icon: Map },
    { id: "digitalrecordings", label: "Digital Recordings", icon: Calendar },
    { id: "medialog", label: "Media Log", icon: Users },
    { id: "aux", label: "Aux Files", icon: FileText },
    {
      id: "master-data",
      label: "Dropdowns",
      icon: Layers,
      children: [
        { id: "audio", label: "Audio", icon: Music },
        { id: "bhajanType", label: "Bhajan Type", icon: Music },
        { id: "digitalMasterCategory", label: "Digital Master Category", icon: Database },
        { id: "distributionLabel", label: "Distribution Label", icon: Tag },
        { id: "editingType", label: "Editing Type", icon: Edit },
        { id: "eventCategory", label: "Event Category", icon: Calendar },
        { id: "footageType", label: "Footage Type", icon: Film },
        { id: "formatType", label: "Format Type", icon: Layers },
        { id: "granths", label: "Granths", icon: Book },
        { id: "language", label: "Language", icon: Globe },
        { id: "newEventCategory", label: "New Event Category", icon: Tag },
        { id: "newCities", label: "New Cities", icon: MapPin },
        { id: "newCountries", label: "New Countries", icon: Flag },
        { id: "newStates", label: "New States", icon: Map },
        { id: "occasions", label: "Occasions", icon: Gift },
        { id: "topicNumberSource", label: "Topic Number Source", icon: Hash },
      ],
    },
    { id: "user-management", label: "User Management", icon: User }
  ];

  // Logic to filter the menu items based on user permissions
  const visibleMenuItems = useMemo(() => {
    if (!user) return []; // If user isn't loaded, show nothing

    // Owners and Admins are superusers, they see everything
    if (user.role === 'Owner' || user.role === 'Admin') {
        return allMenuItems;
    }

    // For other roles (Member, Guest), filter based on their specific permissions
    // A resource is considered "allowed" if it exists in the permissions array (meaning it's not "No Access")
    const allowedResources = new Set(user.permissions.map(p => p.resource));

    return allMenuItems.filter(item => {
        // Always show the Dashboard to logged-in users
        if (item.label === 'Dashboard') {
            return true;
        }
        // For all other items, check if its label exists in the user's allowed resources
        return allowedResources.has(item.label);
    });
  }, [user]); // This will re-calculate only when the user object changes (e.g., on login/logout)

  return (
    <div
      className={`${collapsed ? 'w-16' : 'w-72'} h-full flex flex-col backdrop-blur-xl bg-gradient-to-b from-slate-900/95 via-slate-800/90 to-slate-900/95 border-r border-slate-700/50 rounded-r-2xl shadow-2xl transition-all duration-300 relative`}
    >
      <Button
        variant="ghost"
        size="sm"
        style={{
          position: "absolute",
          top: "1.5rem",
          right: collapsed ? "-0.75rem" : "0.75rem",
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
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "rgb(51 65 85)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "rgb(30 41 59)")
        }
        onClick={onToggleCollapse}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-slate-300" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-slate-300" />
        )}
      </Button>

      <div
        className={`${
          collapsed ? "p-3" : "p-6"
        } border-b border-slate-700/50 transition-all duration-300`}
      >
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : "gap-3"
          } mb-4`}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-xl font-bold text-white">Data Library</h2>
              <p className="text-xs text-slate-400">Analytics Dashboard</p>
            </div>
          )}
        </div>

        {!collapsed && user && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.picture} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">
                {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
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

      {/* Add overflow-y-auto to make the sidebar scrollable */}
      <nav
        className={`flex-1 ${collapsed ? "p-2" : "p-4"} overflow-y-auto transition-all duration-300 custom-sidebar-scrollbar`}
      >
        <div className="space-y-1">
          {/* We now map over the dynamically filtered `visibleMenuItems` */}
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isParentActive = item.children?.some(child => child.id === activeView);
            const isActive = activeView === item.id || (isParentActive && !isMasterDataOpen);

            if (item.children) {
              return (
                <div key={item.id}>
                  <Button
                    variant="ghost"
                    size={collapsed ? "sm" : "default"}
                    className={`w-full ${
                      collapsed ? "justify-center p-0 h-10" : "justify-start gap-3 h-11"
                    } rounded-xl transition-all duration-200 ${
                      isActive || (isParentActive && isMasterDataOpen)
                        ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30 shadow-lg"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50"
                    }`}
                    onClick={() => setIsMasterDataOpen(!isMasterDataOpen)}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-4 h-4" />
                    {!collapsed && (
                      <>
                        <span className="font-medium">{item.label}</span>
                        {isMasterDataOpen ? (
                          <ChevronDown className="ml-auto w-4 h-4" />
                        ) : (
                          <ChevronRight className="ml-auto w-4 h-4" />
                        )}
                      </>
                    )}
                  </Button>
                  {!collapsed && isMasterDataOpen && (
                    <div className="pl-4 pt-1 space-y-1">
                      {item.children.map(child => {
                        const ChildIcon = child.icon;
                        const isChildActive = activeView === child.id;
                        return (
                          <Button
                            key={child.id}
                            variant="ghost"
                            size="default"
                            className={`w-full justify-start gap-3 h-11 rounded-xl transition-all duration-200 ${
                              isChildActive
                                ? "bg-slate-700/50 text-white"
                                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                            }`}
                            onClick={() => onViewChange(child.id)}
                          >
                            <ChildIcon className="w-4 h-4" />
                            <span className="font-medium">{child.label}</span>
                            {isChildActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400"></div>}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Button
                key={item.id}
                variant="ghost"
                size={collapsed ? "sm" : "default"}
                className={`w-full ${
                  collapsed ? "justify-center p-0 h-10" : "justify-start gap-3 h-11"
                } rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30 shadow-lg"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50"
                }`}
                onClick={() => onViewChange(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4" />
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

        <div className="space-y-1">
          <Button
            variant="ghost"
            size={collapsed ? "sm" : "default"}
            className={`w-full ${
              collapsed ? "justify-center p-0 h-10" : "justify-start gap-3 h-11"
            } rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all duration-200`}
            onClick={logout}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="font-medium">Logout</span>}
          </Button>
        </div>
      </nav>

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