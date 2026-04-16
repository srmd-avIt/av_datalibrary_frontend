import React, { useState, useMemo, useEffect } from "react";

import { 
  Home, Database, LayoutDashboard, Map, Users, Grid3x3, Wand2, Stamp, 
  Building, BadgeCheck, AudioLines, Calendar, FileText, Bot, LogOut, 
  User, ChevronLeft, ChevronRight, Music, Hash, Layers, Gift, Flag, 
  MapPin, Tag, Globe, Book, Film, Edit, ChevronDown, Folder, List, 
  ListFilter, Scissors, ListTree, FolderKanban, X, Columns, HardDrive, 
  LayoutGrid, CheckSquare, Search, Plus, Eye,
  SearchCheck,
  Share2,
  MessageCircle,
  CheckCircle,
  Mountain,
  BookOpen,
  Mic
} from "lucide-react";

import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useAuth } from "../contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

// --- CSS for sidebar scrollbar styling ---
const sidebarScrollCss = `
  nav::-webkit-scrollbar {
    width: 6px;
  }
  nav::-webkit-scrollbar-track {
    background: transparent;
  }
  nav::-webkit-scrollbar-thumb {
    background: rgba(100, 116, 139, 0.3);
    border-radius: 3px;
  }
  nav::-webkit-scrollbar-thumb:hover {
    background: rgba(100, 116, 139, 0.5);
  }
`;

// --- Hook for detecting mobile screen ---
const useMobile = () => {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 768 : false));

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isMobile;
};

// --- Hook for slideshow animation in menu ---
function useSlideshow(trigger: boolean, count: number, delay: number = 100) {
  const [visibleCount, setVisibleCount] = useState(trigger ? 0 : count);
  useEffect(() => {
    if (trigger) {
      setVisibleCount(0);
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setVisibleCount(i);
        if (i >= count) clearInterval(interval);
      }, delay);
      return () => clearInterval(interval);
    } else {
      setVisibleCount(count);
    }
  }, [trigger, count, delay]);
  return visibleCount;
}

// --- Independent Component: SidebarItem ---
interface SidebarItemProps {
  item: any;
  activeView: string;
  collapsed: boolean;
  isOpen: boolean;
  onToggle: (id: string) => void;
  onClick: (id: string) => void;
  openMenus: Record<string, boolean>;
}

const SidebarItem = ({ item, activeView, collapsed, isOpen, onToggle, onClick, openMenus }: SidebarItemProps) => {
  const Icon = item.icon;
  
  // Logic to check if any child (or nested child) is active
  const checkIsActive = (node: any): boolean => {
    if (node.id === activeView) return true;
    if (node.children) {
      return node.children.some((child: any) => checkIsActive(child));
    }
    return false;
  };

  const isActive = checkIsActive(item);
  const visibleCount = useSlideshow(isOpen, item.children ? item.children.length : 0, 80);

  const isSmallScreen = typeof window !== "undefined" && window.innerWidth <= 600;
  const iconSize = isSmallScreen ? "18px" : "16px";

  if (item.children && item.children.length > 0) {
    return (
      <div className="mb-1">
        <Button
          variant="ghost"
          size={collapsed ? "sm" : "default"}
          style={{
            display: "flex", alignItems: "center", width: "100%", justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? "0" : isSmallScreen ? "0 12px" : "0 16px",
            height: collapsed ? "40px" : isSmallScreen ? "44px" : "44px",
            gap: collapsed ? "0px" : isSmallScreen ? "12px" : "12px",
            borderRadius: "16px", transition: "all 200ms", fontSize: isSmallScreen ? "15px" : "16px", textAlign: "left",
          }}
          className={`w-full ${collapsed ? "justify-center p-0 h-10" : "gap-3 h-11"} rounded-xl transition-all duration-200 ${isActive || isOpen ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30 shadow-lg" : "text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50"}`}
          onClick={() => onToggle(item.id)}
          title={collapsed ? item.label : undefined}
        >
          <Icon className="w-4 h-4" style={{ width: iconSize, height: iconSize }} />
          {!collapsed && (
            <><span className="font-medium" style={{ fontWeight: 500, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "left" }}>{item.label}</span>
            {isOpen ? <ChevronDown className="ml-auto w-4 h-4" /> : <ChevronRight className="ml-auto w-4 h-4" />}</>
          )}
        </Button>
        {!collapsed && isOpen && (
          <div className="pl-4 pt-1 space-y-1">
            {item.children?.map((child: any, idx: number) => {
              if (idx >= visibleCount) return null;
              
              // Child logic to ensure nested menus stay closed unless clicked
              const isChildSubMenuOpen = openMenus[child.id] || false;

              return (
                <SidebarItem 
                  key={child.id}
                  item={child}
                  activeView={activeView}
                  collapsed={collapsed}
                  isOpen={isChildSubMenuOpen} 
                  onToggle={onToggle}
                  onClick={onClick}
                  openMenus={openMenus}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Standard Item
  return (
    <div className="mb-1">
      <Button variant="ghost" size={collapsed ? "sm" : "default"}
        style={{
          display: "flex", alignItems: "center", width: "100%", justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? "0" : isSmallScreen ? "0 12px" : "0 16px",
          height: collapsed ? "40px" : isSmallScreen ? "44px" : "44px",
          gap: collapsed ? "0px" : isSmallScreen ? "12px" : "12px",
          borderRadius: "12px", transition: "all 200ms", fontSize: isSmallScreen ? "15px" : "16px",
          ...(activeView === item.id ? { background: "linear-gradient(to right, rgba(59,130,246,0.20), rgba(147,51,234,0.20))", color: "white", border: "1px solid rgba(59,130,246,0.30)", boxShadow: "0 0 10px rgba(59,130,246,0.25)" } : { color: "rgb(203,213,225)", border: "1px solid transparent", cursor: "pointer" }),
        }}
        onClick={() => onClick(item.id)}
        title={collapsed ? item.label : undefined}
      >
        <Icon style={{ width: iconSize, height: iconSize }} />
        {!collapsed && (
          <>
            <span style={{ fontWeight: 500, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "left" }}>{item.label}</span>
            {activeView === item.id && (<div style={{ marginLeft: "auto", width: isSmallScreen ? "6px" : "8px", height: isSmallScreen ? "6px" : "8px", borderRadius: "9999px", backgroundColor: "rgb(96,165,250)" }}></div>)}
          </>
        )}
      </Button>
    </div>
  );
};

// --- Independent Component: SidebarSection ---
const SidebarSection = ({ items, activeView, collapsed, openMenus, toggleMenu, handleMenuClick }: any) => {
  return (
    <div className="space-y-1">
      {items.map((item: any) => {
        if (!item) return null;
        return (
          <SidebarItem 
            key={item.id}
            item={item}
            activeView={activeView}
            collapsed={collapsed}
            isOpen={openMenus[item.id] || false}
            onToggle={toggleMenu}
            onClick={handleMenuClick}
            openMenus={openMenus}
          />
        );
      })}
    </div>
  );
};

interface SidebarProps {
  activeView: string;
  onViewChange: (viewId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isOpen: boolean;
  onClose?: () => void;
}

export function Sidebar({ activeView, onViewChange, collapsed, onToggleCollapse, isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const isMobile = useMobile();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  
  const isHomeViewActive = activeView === "dashboard";

  const allMenuItems = [
    { id: "dashboard", label: "Home", icon: Home },
    { id: "digitalrecordings_gsheet", label: "Project Hub", icon: LayoutGrid },
    {
        id: "list_parent",
        label: "List",
        icon: List,
        children: [
            { id: "satsang_dashboard", label: "Satsang Search", icon: LayoutDashboard },
            { id: "events", label: "Events", icon: Map },
            { id: "non_event_production", label: "Non Event Production", icon: Database },
            { id: "eventtimeline", label: "Event Timeline", icon: Calendar },
            { id: "digitalrecordings", label: "Digital Recordings", icon: HardDrive},
            {
              id: "medialog-parent",
              label: "Media Log",
              icon: FolderKanban,
              children: [
                { id: "medialog_all", label: "ML formal & Informal", icon: List },
                { id: "medialog_formal", label: "ML Formal", icon: Folder },
                { id: "medialog_pending_gsheet", label: "MLFormal (Pending Push to DB)", icon: Building },
                { id: "medialog_all_except_satsang", label: "All Except Satsang", icon: ListFilter },
                { id: "medialog_satsang_extracted_clips", label: "Satsang Extracted Clips", icon: Scissors },
                { id: "medialog_satsang_category", label: "Satsang Category (AS IS)", icon: ListTree },
                { id: "data_sharing_ps", label: "PS", icon: Mic },
                { id: "data_sharing_su", label: "SU", icon: BookOpen },
                { id: "data_sharing_dyatra", label: "Dyatra Satsangs", icon: Mountain },
                { id: "data_sharing_gm", label: "GM (PPG Approved)", icon: CheckCircle },
                { id: "data_sharing_prasangik", label: "Prasangik Udbodhan", icon: MessageCircle },
                { id: "data_sharing_nemiji", label: "Nemiji Sessions", icon: Users }
              ],
            },
            { id: "aux", label: "Aux Files", icon: FileText },
            { id:"edited_highlights", label:"List of Edited Highlights", icon: Bot},
            {
              id: "master-data",
              label: "Dropdowns ",
              icon: Layers,
              children:  [
                { id: "audio", label: "Audio", icon: Music },
                { id: "auxfiletype", label: "Aux File Type", icon: FileText },
                { id: "bhajanType", label: "Bhajan Type", icon: AudioLines },
                { id: "digitalMasterCategory", label: "Digital Master Category", icon: Database },
                { id: "distributionLabel", label: "Distribution Label", icon:  Stamp },
                { id: "editingstatus", label: "Editing Status", icon: Edit },
                { id: "editingType", label: "Editing Type", icon: Wand2 },
                { id: "eventCategory", label: "Event Category", icon: Grid3x3 },
                { id: "footageType", label: "Footage Type", icon: Film },
                { id: "formatType", label: "Format Type", icon: Layers },
                { id: "granths", label: "Granths", icon: Book },
                { id: "language", label: "Language", icon: Globe },
                { id: "masterquality", label: "Master Quality", icon: BadgeCheck },
                { id: "newEventCategory", label: "New Event Category", icon: Tag },
                { id: "newCities", label: "New Cities", icon: MapPin },
                { id: "newCountries", label: "New Countries", icon: Flag },
                { id: "newStates", label: "New States", icon: Map },
                { id: "occasions", label: "Occasions", icon: Gift },
                { id: "organization", label: "Organization", icon: Users },
                { id: "timeOfDay", label: "Time Of Day", icon: Calendar },
                { id: "topicNumberSource", label: "Topic Number Source", icon: Hash },
                { id: "topicgivenby", label: "TopicGivenBy", icon: ListTree},
                { id: "segmentcategory", label: "Segment Category", icon: List },
              ],
            },
        ]
    },
    { id: "column-management", label: "Column Management", icon: Columns, requiredRoles: ['Admin', 'Owner'] },
    { id: "user-management", label: "User Management", icon: User, requiredRoles: ['Admin', 'Owner'] }
  ];

  const visibleMenuItems = useMemo(() => {
    if (!user) return [];
    if (user.role === "Owner" || user.role === "Admin") return allMenuItems;
    
    const permMap: { [key: string]: Set<string> } = {};
    (user.permissions || []).forEach((p) => { permMap[p.resource] = new Set(p.actions); });

    const filterItems = (items: any[]): any[] => {
        return items.map((item) => {
            if (item.id === "list_parent") {
                const visibleChildren = filterItems(item.children || []);
                return visibleChildren.length > 0 ? { ...item, children: visibleChildren } : null;
            }
            if (item.children && item.children.length > 0) {
              const visibleChildren = filterItems(item.children);
              if (visibleChildren.length > 0) return { ...item, children: visibleChildren };
              return null;
            }
            const actions = permMap[item.label];
            if (actions && (actions.has("read") || actions.has("write"))) return item;
            if (item.requiredRoles && item.requiredRoles.includes(user.role)) return item;
            return null;
          }).filter(Boolean);
    };

    return filterItems(allMenuItems);
  }, [user, allMenuItems]);

  const handleMenuClick = (id: string) => {
    onViewChange(id);
    if (collapsed || isMobile) onClose?.(); 
  };

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderMobileView = () => (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 40, backgroundColor: "rgba(0,0,0,0.7)", opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none", transition: "opacity 0.3s ease" }} onClick={onClose} />
      <div style={{ position: "fixed", top: 0, left: 0, width: "85vw", maxWidth: "340px", height: "100dvh", backgroundColor: "#0b1120", transform: isOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.3s ease-in-out", zIndex: 50, display: "flex", flexDirection: "column" }}>
        
        <div style={{ padding: "20px", borderBottom: "1px solid rgba(100,116,139,0.3)", position: "relative" }}>
          <Button variant="ghost" size="sm" onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", borderRadius: "999px" }}><X style={{ width: "16px", height: "16px", color: "#cbd5e1" }} /></Button>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(to right, #3b82f6, #9333ea)", display: "flex", alignItems: "center", justifyContent: "center" }}><Database style={{ width: "20px", height: "20px", color: "#fff" }} /></div>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#fff", margin: 0 }}>Data Library</h2>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>Analytics Dashboard</p>
            </div>
          </div>

          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "12px", backgroundColor: "rgba(30,41,59,0.5)", border: "1px solid rgba(100,116,139,0.3)", marginBottom: "16px" }}>
              <Avatar style={{ width: "32px", height: "32px" }}>
                <AvatarImage src={user.picture} />
                <AvatarFallback style={{ background: "linear-gradient(to right, #3b82f6, #9333ea)", color: "#fff" }}>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</p>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</p>
              </div>
            </div>
          )}

          
        </div>

        <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
          <SidebarSection items={visibleMenuItems} activeView={activeView} collapsed={false} openMenus={openMenus} toggleMenu={toggleMenu} handleMenuClick={handleMenuClick} />
        </nav>

        <div style={{ padding: "16px", borderTop: "1px solid rgba(30,41,59,0.8)" }}>
          <Button 
            variant="ghost" 
            onClick={logout} 
            style={{ width: "100%", color: "#f87171", gap: "12px" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <LogOut style={{ width: "20px" }} />Logout
          </Button>
        </div>
      </div>
    </>
  );

  const renderDesktopView = () => (
    <>
      <style dangerouslySetInnerHTML={{ __html: sidebarScrollCss }} />
      <div style={{ width: collapsed ? "64px" : "288px", height: "100%", display: "flex", flexDirection: "column", background: "rgba(15,23,42,0.95)", borderRight: "1px solid rgba(100,116,139,0.3)", transition: "all 0.3s ease", position: "relative", borderTopRightRadius: "16px", borderBottomRightRadius: "16px" }}>
        
        <Button variant="ghost" size="sm" onClick={onToggleCollapse} style={{ position: "absolute", top: "1.5rem", right: collapsed ? "-0.75rem" : "0.75rem", borderRadius: "9999px", backgroundColor: "rgb(30,41,59)", zIndex: 50, border: "1px solid rgba(51,65,85,0.5)" }}>
          {collapsed ? <ChevronRight size={12} color="#cbd5e1" /> : <ChevronLeft size={12} color="#cbd5e1" />}
        </Button>

        <div style={{ padding: collapsed ? "12px" : "24px", borderBottom: "1px solid rgba(100,116,139,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: "12px", marginBottom: "16px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(to right, #3b82f6, #9333ea)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Database size={20} color="#fff" /></div>
            {!collapsed && (
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", margin: 0 }}>Data Library</h2>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>Analytics Dashboard</p>
              </div>
            )}
          </div>

          {user && !collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "12px", backgroundColor: "rgba(30,41,59,0.5)", border: "1px solid rgba(100,116,139,0.3)", marginBottom: "16px" }}>
              <Avatar style={{ width: "32px", height: "32px" }}>
                <AvatarImage src={user.picture} />
                <AvatarFallback style={{ background: "linear-gradient(to right, #3b82f6, #9333ea)", color: "#fff" }}>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</p>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</p>
              </div>
            </div>
          )}

          
        </div>

        <nav style={{ flex: 1, padding: collapsed ? "8px" : "16px", overflowY: "auto" }}>
          <SidebarSection items={visibleMenuItems} activeView={activeView} collapsed={collapsed} openMenus={openMenus} toggleMenu={toggleMenu} handleMenuClick={handleMenuClick} />
          
          <div style={{ margin: "24px 0", height: "1px", background: "rgba(100,116,139,0.3)" }} />
          
          <Button 
            variant="ghost" 
            onClick={logout} 
            title={collapsed ? "Logout" : undefined}
            style={{ 
              width: "100%", 
              justifyContent: collapsed ? "center" : "flex-start", 
              color: "#cbd5e1", 
              gap: "12px",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={e => { 
                e.currentTarget.style.color = "#f87171"; 
                e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
                e.currentTarget.style.border = "1px solid rgba(239, 68, 68, 0.3)";
            }}
            onMouseLeave={e => { 
                e.currentTarget.style.color = "#cbd5e1"; 
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.border = "1px solid transparent";
            }}
          >
            <LogOut size={16} />{!collapsed && <span style={{ fontWeight: 500 }}>Logout</span>}
          </Button>
        </nav>

        {!collapsed && (
          <div style={{ padding: "16px", borderTop: "1px solid rgba(100,116,139,0.3)", fontSize: "12px", color: "#64748b", textAlign: "center" }}>
            © 2025 Data Library v2.1.0
          </div>
        )}
      </div>
    </>
  );

  return isMobile ? renderMobileView() : renderDesktopView();
}