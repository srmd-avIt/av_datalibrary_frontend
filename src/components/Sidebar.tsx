// src/components/Sidebar.js

import { Home, Database, Map, Users, Calendar, FileText, Bot, LogOut, User, ChevronLeft, ChevronRight, Music, Hash, Layers, Gift, Flag, MapPin, Tag, Globe, Book, Film, Edit, ChevronDown, Folder, List, ListFilter, Scissors, ListTree, FolderKanban, X } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useAuth } from "../contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { useMemo, useState, useEffect } from "react"; // <-- Import useEffect
import'../styles/globals.css';

// --- MODIFIED: Props are now optional to support both mobile and desktop modes ---
interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  
  // Desktop-specific props
  collapsed?: boolean;
  onToggleCollapse?: () => void; 
  
  // Mobile-specific props
  isOpen?: boolean;
  onClose?: () => void;
}

// Define types for menu items, including children for nesting
type MenuItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  children?: Omit<MenuItem, 'children'>[];
};

export function Sidebar({ 
  activeView, 
  onViewChange, 
  collapsed = false, // Default values to prevent errors
  onToggleCollapse = () => {}, 
  isOpen = false,
  onClose = () => {} 
}: SidebarProps) {
  const { user, logout } = useAuth();
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(false);
  const [isMediaLogOpen, setIsMediaLogOpen] = useState(false);

  // --- NEW: Internal state to detect mobile view ---
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768); // Standard mobile breakpoint
    };
    
    // Check on initial render
    checkScreenSize();
    
    // Add event listener for screen resize
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup listener on component unmount
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);


  // --- All the menu item definitions and permission logic remains exactly the same ---
  const allMenuItems: MenuItem[] = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "events", label: "Events", icon: Map },
    { id: "eventtimeline", label: "Event Timeline", icon: Calendar },
    { id: "digitalrecordings", label: "Digital Recordings", icon: Calendar },
     {
      id: "medialog-parent",
      label: "Media Log",
      icon: FolderKanban,
      children: [
        { id: "medialog_all", label: "ML formal & Informal", icon: List },
        { id: "medialog_formal", label: "ML Formal", icon: Folder },
        { id: "medialog_all_except_satsang", label: "All Except Satsang", icon: ListFilter },
        { id: "medialog_satsang_extracted_clips", label: "Satsang Extracted Clips", icon: Scissors },
        { id: "medialog_satsang_category", label: "Satsang Category", icon: ListTree },
      ],
    },
    { id: "aux", label: "Aux Files", icon: FileText },
    {
      id: "master-data",
      label: "Dropdowns ",
      icon: Layers,
      children:  [
        { id: "audio", label: "Audio", icon: Music },
        { id: "auxfiletype", label: "Aux File Type", icon: FileText },
        { id: "bhajanType", label: "Bhajan Type", icon: Music },
        { id: "digitalMasterCategory", label: "Digital Master Category", icon: Database },
        { id: "distributionLabel", label: "Distribution Label", icon: Tag },
        { id: "editingstatus", label: "Editing Status", icon: Edit },
        { id: "editingType", label: "Editing Type", icon: Edit },
        { id: "eventCategory", label: "Event Category", icon: Calendar },
        { id: "footageType", label: "Footage Type", icon: Film },
        { id: "formatType", label: "Format Type", icon: Layers },
        { id: "granths", label: "Granths", icon: Book },
        
        { id: "language", label: "Language", icon: Globe },
        { id: "masterquality", label: "Master Quality", icon: Layers },
        { id: "newEventCategory", label: "New Event Category", icon: Tag },
        { id: "newCities", label: "New Cities", icon: MapPin },
        { id: "newCountries", label: "New Countries", icon: Flag },
        { id: "newStates", label: "New States", icon: Map },
        { id: "occasions", label: "Occasions", icon: Gift },
        { id: "organization", label: "Organization", icon: Users },
        { id: "timeOfDay", label: "Time Of Day", icon: Calendar },
        { id: "topicNumberSource", label: "Topic Number Source", icon: Hash },
        { id: "topicgivenby", label: "TopicGivenBy", icon: Tag },
        { id: "segmentcategory", label: "Segment Category", icon: List },

      ],
    },
    { id: "user-management", label: "User Management", icon: User }
  ];

  const visibleMenuItems = useMemo(() => {
    if (!user) return [];
    if (user.role === 'Owner' || user.role === 'Admin') return allMenuItems;
    const allowedResources = new Set(user.permissions.map(p => p.resource));
    const result = allMenuItems.map(item => {
      if (item.label === 'Dashboard') return item;
      if (item.children) {
        const visibleChildren = item.children.filter(child => allowedResources.has(child.label));
        if (visibleChildren.length > 0) return { ...item, children: visibleChildren };
        return null;
      }
      if (allowedResources.has(item.label)) return item;
      return null;
    }).filter(Boolean);
    return result;
  }, [user]);

  // Helper for mobile navigation to close the drawer after a click
  const handleNavigate = (view: string) => {
    onViewChange(view);
    onClose();
  };

  // --- RENDER LOGIC: Conditionally render mobile or desktop view ---

  if (isMobile) {
    // --- MOBILE DRAWER VIEW ---
    return (
      <>
        {/* Overlay */}
        <div
          className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={onClose}
        />
        {/* Sidebar Drawer */}
        <div
          className={`fixed top-0 left-0 h-full w-72 flex flex-col bg-gradient-to-b from-slate-900/95 via-slate-800/90 to-slate-900/95 border-r border-slate-700/50 shadow-2xl transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'transform translate-x-0' : 'transform -translate-x-full'}`}
        >
          {/* Mobile Header */}
          <div className="p-6 border-b border-slate-700/50 relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 w-8 h-8 rounded-full p-0"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4 text-slate-300" />
            </Button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center"><Database className="w-5 h-5 text-white" /></div>
              <div>
                <h2 className="text-xl font-bold text-white">Data Library</h2>
                <p className="text-xs text-slate-400">Analytics Dashboard</p>
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <Avatar className="w-8 h-8"><AvatarImage src={user.picture} /><AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">{user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{user.name}</p><p className="text-xs text-slate-400 truncate">{user.email}</p></div>
              </div>
            )}
          </div>

          {/* Mobile Navigation (uses the un-collapsed styles) */}
          <nav className="flex-1 p-4 overflow-y-auto custom-sidebar-scrollbar">
            <div className="space-y-1">
              {visibleMenuItems.map((item) => {
                if (!item) return null;
                const Icon = item.icon;
                const isParentActive = item.children?.some(child => child.id === activeView);
                const isActive = activeView === item.id || isParentActive;

                if (item.id === "medialog-parent" || item.id === "master-data") {
                  const isOpenState = item.id === "medialog-parent" ? isMediaLogOpen : isMasterDataOpen;
                  const setIsOpen = item.id === "medialog-parent" ? setIsMediaLogOpen : setIsMasterDataOpen;
                  return (
                    <div key={item.id}>
                      <Button variant="ghost" size="default" className={`w-full justify-start gap-3 h-11 rounded-xl ${isActive || isOpenState ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30" : "text-slate-300 hover:text-white hover:bg-slate-800/50"}`} onClick={() => setIsOpen(!isOpenState)}>
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{item.label}</span>
                        {isOpenState ? <ChevronDown className="ml-auto w-4 h-4" /> : <ChevronRight className="ml-auto w-4 h-4" />}
                      </Button>
                      {isOpenState && (
                        <div className="pl-4 pt-1 space-y-1">
                          {item.children?.map(child => {
                            const ChildIcon = child.icon;
                            const isChildActive = activeView === child.id;
                            return (
                              <Button key={child.id} variant="ghost" size="default" className={`w-full justify-start gap-3 h-11 rounded-xl ${isChildActive ? "bg-slate-700/50 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`} onClick={() => handleNavigate(child.id)}>
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
                  <Button key={item.id} variant="ghost" size="default" className={`w-full justify-start gap-3 h-11 rounded-xl ${isActive ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30" : "text-slate-300 hover:text-white hover:bg-slate-800/50"}`} onClick={() => handleNavigate(item.id)}>
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                    {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-blue-400"></div>}
                  </Button>
                );
              })}
            </div>

            <Separator className="my-6 bg-slate-700/50" />

            <div className="space-y-1">
              <Button variant="ghost" size="default" className="w-full justify-start gap-3 h-11 rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-500/10" onClick={() => { logout(); onClose(); }}>
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Logout</span>
              </Button>
            </div>
          </nav>

          <div className="p-4 border-t border-slate-700/50">
            <div className="text-xs text-slate-500 text-center">© 2025 Data Library v2.1.0</div>
          </div>
        </div>
      </>
    );
  }

  // --- DESKTOP STATIC VIEW (Your original code) ---
  return (
    <div
      className={`${collapsed ? 'w-16' : 'w-72'} h-full flex flex-col backdrop-blur-xl bg-gradient-to-b from-slate-900/95 via-slate-800/90 to-slate-900/95 border-r border-slate-700/50 rounded-r-2xl shadow-2xl transition-all duration-300 relative`}
    >
      <Button
        variant="ghost"
        size="sm"
        style={{ position: "absolute", top: "1.5rem", right: collapsed ? "-0.75rem" : "0.75rem", width: "1.5rem", height: "1.5rem", borderRadius: "9999px", backgroundColor: "rgb(30 41 59)", border: "1px solid rgba(51, 65, 85, 0.5)", zIndex: 50, padding: 0, cursor: "pointer", transition: "all 0.3s ease" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(51 65 85)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgb(30 41 59)")}
        onClick={onToggleCollapse}
      >
        {collapsed ? <ChevronRight className="w-3 h-3 text-slate-300" /> : <ChevronLeft className="w-3 h-3 text-slate-300" />}
      </Button>

      <div className={`${collapsed ? "p-3" : "p-6"} border-b border-slate-700/50 transition-all duration-300`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} mb-4`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center"><Database className="w-5 h-5 text-white" /></div>
          {!collapsed && (<div><h2 className="text-xl font-bold text-white">Data Library</h2><p className="text-xs text-slate-400">Analytics Dashboard</p></div>)}
        </div>

        {!collapsed && user && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <Avatar className="w-8 h-8"><AvatarImage src={user.picture} /><AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">{user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</AvatarFallback></Avatar>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{user.name}</p><p className="text-xs text-slate-400 truncate">{user.email}</p></div>
          </div>
        )}
        {collapsed && user && (
          <div className="flex justify-center">
            <Avatar className="w-8 h-8"><AvatarImage src={user.picture} /><AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">{user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</AvatarFallback></Avatar>
          </div>
        )}
      </div>

      <nav className={`flex-1 ${collapsed ? "p-2" : "p-4"} overflow-y-auto transition-all duration-300 custom-sidebar-scrollbar`}>
        <div className="space-y-1">
          {visibleMenuItems.map((item) => {
            if (!item) return null;
            const Icon = item.icon;
            const isParentActive = item.children?.some(child => child.id === activeView);
            const isActive = activeView === item.id || isParentActive;

            if (item.id === "medialog-parent" || item.id === "master-data") {
              const isOpenState = item.id === "medialog-parent" ? isMediaLogOpen : isMasterDataOpen;
              const setIsOpen = item.id === "medialog-parent" ? setIsMediaLogOpen : setIsMasterDataOpen;
              return (
                <div key={item.id}>
                  <Button variant="ghost" size={collapsed ? "sm" : "default"} className={`w-full ${collapsed ? "justify-center p-0 h-10" : "justify-start gap-3 h-11"} rounded-xl transition-all duration-200 ${isActive || isOpenState ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30 shadow-lg" : "text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50"}`} onClick={() => setIsOpen(!isOpenState)} title={collapsed ? item.label : undefined}>
                    <Icon className="w-4 h-4" />
                    {!collapsed && (<><span className="font-medium">{item.label}</span>{isOpenState ? <ChevronDown className="ml-auto w-4 h-4" /> : <ChevronRight className="ml-auto w-4 h-4" />}</>)}
                  </Button>
                  {!collapsed && isOpenState && (
                    <div className="pl-4 pt-1 space-y-1">
                      {item.children?.map(child => {
                        const ChildIcon = child.icon;
                        const isChildActive = activeView === child.id;
                        return (
                          <Button key={child.id} variant="ghost" size="default" className={`w-full justify-start gap-3 h-11 rounded-xl transition-all duration-200 ${isChildActive ? "bg-slate-700/50 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`} onClick={() => onViewChange(child.id)}>
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
              <Button key={item.id} variant="ghost" size={collapsed ? "sm" : "default"} className={`w-full ${collapsed ? "justify-center p-0 h-10" : "justify-start gap-3 h-11"} rounded-xl transition-all duration-200 ${isActive ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30 shadow-lg" : "text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50"}`} onClick={() => onViewChange(item.id)} title={collapsed ? item.label : undefined}>
                <Icon className="w-4 h-4" />
                {!collapsed && (
                  <>
                    <span className="font-medium">{item.label}</span>
                    {isActive && (<div className="ml-auto w-2 h-2 rounded-full bg-blue-400"></div>)}
                  </>
                )}
              </Button>
            );
          })}
        </div>
        <Separator className="my-6 bg-slate-700/50" />
        <div className="space-y-1">
          <Button variant="ghost" size={collapsed ? "sm" : "default"} className={`w-full ${collapsed ? "justify-center p-0 h-10" : "justify-start gap-3 h-11"} rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all duration-200`} onClick={logout} title={collapsed ? "Logout" : undefined}>
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="font-medium">Logout</span>}
          </Button>
        </div>
      </nav>
      {!collapsed && (
        <div className="p-4 border-t border-slate-700/50">
          <div className="text-xs text-slate-500 text-center">© 2025 Data Library v2.1.0</div>
        </div>
      )}
    </div>
  );
}