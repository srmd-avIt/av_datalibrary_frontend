/**
 * UserManagement Component - ClickUp-style User Management Interface
 * 
 * A comprehensive user management system with granular, interactive permission controls.
 * Features a "View Access" column to manage user rights for different app sections,
 * governed by Role-Based Access Control (RBAC).
 * 
 * @component
 */

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Badge } from "./ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent } from "./ui/card";
import { 
  Crown, Shield, Eye, CircleDot, Mail, MoreHorizontal, Trash2, UserX,
  UserCheck, Search, ChevronDown, ChevronUp, ChevronsUpDown, Users, UserPlus,
  AlertTriangle, Pencil, XCircle, Filter
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger,
  DropdownMenuRadioGroup, DropdownMenuRadioItem
} from "./ui/dropdown-menu";
import { toast } from "sonner";

// ===================================================================================
// --- 1. CONFIGURATION & TYPES (Unchanged) ---
// ===================================================================================

const APP_RESOURCES = [
  "Dashboard",
  "Events",
  "Media Log",
  "Digital Recordings",
  "Aux Files",
  "AI Assistant",
  "User Management",
  "Audio",
  "Bhajan Type",
  "Digital Master Category",
  "Distribution Label",
  "Editing Type",
  "Event Category",
  "Footage Type",
  "Format Type",
  "Granths",
  "Language",
  "New Event Category",
  "New Cities",
  "New Countries",
  "New States",
  "Occasions",
  
  "Topic Number Source"
];

type AccessLevel = "No Access" | "View Only" | "Edit Access";

interface User {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member" | "Guest";
  status: "Active" | "Inactive" | "Pending" | "Invited";
  avatar?: string;
  joinedDate: string;
  lastActive: string;
  lastActiveDate: Date;
  teams: string[];
  department?: string;
  location?: string;
  title?: string;
  twoFactorEnabled: boolean;
  permissions: UserPermission[];
  phone?: string;
  timezone?: string;
  invitedBy?: string;
  notes?: string;
}

interface UserPermission {
  resource: string;
  actions: ("read" | "write")[];
}

const availableTeams = [ "Engineering", "Design", "Product", "Marketing", "Sales", "Support", "Leadership", "DevOps" ];

const groupableFields: (keyof User)[] = ['role', 'status', 'department', 'location'];

interface UserManagementProps {
  onRowSelect?: (user: User) => void;
}

// ===================================================================================
// --- 2. MAIN COMPONENT (With Relative Time Logic) ---
// ===================================================================================

export function UserManagement({ onRowSelect }: UserManagementProps) {
  const { user: loggedInUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  const [groupByField, setGroupByField] = useState<string | null>(null);

  const canManageUsers = useMemo(() => {
    if (!loggedInUser) return false;
    return loggedInUser.role === 'Admin' || loggedInUser.role === 'Owner';
  }, [loggedInUser]);

  const getAccessLevel = (user: User, resource: string): AccessLevel => {
    const permission = user.permissions.find(p => p.resource === resource);
    if (!permission || permission.actions.length === 0) return 'No Access';
    if (permission.actions.includes('write')) return 'Edit Access';
    if (permission.actions.includes('read')) return 'View Only';
    return 'No Access';
  };

  const handlePermissionChange = (userId: string, resource: string, level: AccessLevel) => {
    const targetUser = users.find(u => u.id === userId);
    if (!canManageUsers || loggedInUser?.id === userId || targetUser?.role === 'Owner') {
      toast.error("You do not have permission to perform this action.");
      return;
    }
    let updatedPermissions: UserPermission[] = [];
    setUsers(currentUsers => currentUsers.map(user => {
      if (user.id !== userId) return user;
      const otherPermissions = user.permissions.filter(p => p.resource !== resource);
      updatedPermissions = [...otherPermissions];
      if (level === 'View Only') updatedPermissions.push({ resource, actions: ['read'] });
      if (level === 'Edit Access') updatedPermissions.push({ resource, actions: ['read', 'write'] });
      return { ...user, permissions: updatedPermissions };
    }));
    const apiCall = fetch(`${import.meta.env.VITE_API_URL}/users/${userId}/permissions`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ permissions: updatedPermissions }) });
    toast.promise(apiCall, { loading: `Saving permissions...`, success: 'Permissions saved.', error: 'Failed to save permissions.' });
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/users`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        const processedUsers: User[] = data.map((user: any) => {
          const lastActiveDate = new Date(user.lastActive);
          // ✅ MODIFIED: Use the new getRelativeTime function for display
          return {
            ...user,
            lastActive: getRelativeTime(lastActiveDate),
            lastActiveDate,
            permissions: user.permissions || [],
            twoFactorEnabled: false,
            title: user.title || user.role,
          };
        });

        setUsers(processedUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Failed to load users. Please try again.");
      }
    };
    fetchUsers();
  }, []);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Owner": return <Crown style={{ width: "16px", height: "16px", color: "#eab308" }} />;
      case "Admin": return <Shield style={{ width: "16px", height: "16px", color: "#3b82f6" }} />;
      case "Member": return <Users style={{ width: "16px", height: "16px", color: "#22c55e" }} />;
      case "Guest": return <Eye style={{ width: "16px", height: "16px", color: "#6b7280" }} />;
      default: return <Users style={{ width: "16px", height: "16px", color: "#6b7280" }} />;
    }
  };

  const getStatusIcon = (status: string) => {
    const baseStyle = { width: "12px", height: "12px", fill: "currentColor" };
    switch (status) {
      case "Active": return <CircleDot style={{ ...baseStyle, color: "#22c55e" }} />;
      case "Inactive": return <CircleDot style={{ ...baseStyle, color: "#6b7280" }} />;
      case "Pending": return <CircleDot style={{ ...baseStyle, color: "#eab308" }} />;
      case "Invited": return <CircleDot style={{ ...baseStyle, color: "#3b82f6" }} />;
      default: return <CircleDot style={{ ...baseStyle, color: "#6b7280" }} />;
    }
  };

  const sortedAndFilteredUsers = useMemo(() => {
    let filtered = [...users];
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(user => Object.values(user).some(val => String(val).toLowerCase().includes(lowercasedQuery)));
    }
    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const aValue = sortConfig.key === 'lastActive' ? a.lastActiveDate.getTime() : a[sortConfig.key!];
        const bValue = sortConfig.key === 'lastActive' ? b.lastActiveDate.getTime() : b[sortConfig.key!];
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
        if (bValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [users, searchQuery, sortConfig]);

  const groupedUsers = useMemo(() => {
    if (!groupByField) return null;
    const groups = new Map<string, User[]>();
    sortedAndFilteredUsers.forEach(user => {
      const key = (user[groupByField as keyof User] as string) || 'Unassigned';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(user);
    });
    return groups;
  }, [sortedAndFilteredUsers, groupByField]);

  const handleSelectAll = (selected: boolean) => {
    setSelectedUsers(selected ? sortedAndFilteredUsers.map(user => user.id) : []);
  };

  const executeBulkAction = (action: string) => {
    if (!canManageUsers) { toast.error("You do not have permission to perform bulk actions."); return; }
    const usersById = new Map(users.map(u => [u.id, u]));
    const safeSelection = selectedUsers.filter(id => {
      const user = usersById.get(id);
      return user && user.role !== 'Owner' && user.id !== loggedInUser?.id;
    });
    if (safeSelection.length !== selectedUsers.length) toast.info("Owners and your own account were excluded from the bulk action.");
    if (safeSelection.length === 0) { toast.warning("No valid users selected for the action."); setSelectedUsers([]); setIsBulkActionOpen(false); return; }
    let message = "";
    setUsers(currentUsers => {
      let updatedUsers = [...currentUsers];
      switch (action) {
        case "activate":
          updatedUsers = updatedUsers.map(u => safeSelection.includes(u.id) ? { ...u, status: "Active" } : u);
          message = `Activated ${safeSelection.length} users`; break;
        case "deactivate":
          updatedUsers = updatedUsers.map(u => safeSelection.includes(u.id) ? { ...u, status: "Inactive" } : u);
          message = `Deactivated ${safeSelection.length} users`; break;
        case "delete":
          updatedUsers = updatedUsers.filter(u => !safeSelection.includes(u.id));
          message = `Removed ${safeSelection.length} users from view.`; break;
      }
      toast.success(message);
      return updatedUsers;
    });
    setSelectedUsers([]);
    setIsBulkActionOpen(false);
  };
  
  const requestSort = (key: keyof User) => {
    const direction = (sortConfig?.key === key && sortConfig.direction === 'asc') ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return <ChevronsUpDown className="ml-2 h-4 w-4 text-slate-500" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />;
  };

  const columns: { key: keyof User | 'select' | 'actions' | 'viewAccess'; label: string; sortable?: boolean; }[] = [
    { key: "select", label: "" }, { key: "name", label: "Name", sortable: true },
    { key: "email", label: "Email", sortable: true }, { key: "role", label: "Role", sortable: true },
    { key: "viewAccess", label: "View Access" }, { key: "status", label: "Status", sortable: true },
    { key: "department", label: "Department", sortable: true }, { key: "location", label: "Location", sortable: true },
    { key: "teams", label: "Teams" }, { key: "joinedDate", label: "Joined Date", sortable: true },
    { key: "lastActive", label: "Last Active", sortable: true }, { key: "actions", label: "Actions" },
  ];

  const handleAddUser = async (newUserData: Omit<User, 'id' | 'joinedDate' | 'lastActive' | 'status'>) => {
    if (!canManageUsers) { toast.error("You do not have permission to add users."); return; }
    const now = new Date();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newUserData, lastActive: now.toISOString() }) });
      if (!response.ok) throw new Error(await response.text());
      const createdUser = await response.json();
      const processedUser = { ...createdUser, lastActive: "just now", lastActiveDate: now, title: createdUser.role };
      setUsers((prevUsers) => [processedUser, ...prevUsers]);
      setIsAddUserDialogOpen(false);
      toast.success(`User "${createdUser.name}" added successfully.`);
    } catch (error) { console.error("Error adding user:", error); toast.error(error.message || "An unexpected error occurred."); }
  };

  const handleDeleteConfirmation = (user: User) => {
    if (!canManageUsers || user.id === loggedInUser?.id || user.role === 'Owner') {
      toast.error("You do not have permission to delete this user.");
      return;
    }
    setUserToDelete(user); setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    const { id, name } = userToDelete;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await response.text());
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setIsDeleteDialogOpen(false); setUserToDelete(null);
      toast.success(`User "${name}" was deleted successfully.`);
    } catch (error) { console.error("Error deleting user:", error); toast.error(error.message || "An unexpected error occurred."); }
  };
  
  const AddUserForm = ({ onAddUser }: { onAddUser: (data: any) => void }) => {
    const [formData, setFormData] = useState({ name: "", email: "", role: "Member" as "Member" | "Admin" | "Guest", department: "", location: "", teams: [] as string[] });
    const handleTeamChange = (team: string, checked: boolean) => setFormData(prev => ({ ...prev, teams: checked ? [...prev.teams, team] : prev.teams.filter(t => t !== team) }));
    const handleSubmit = () => {
      if (!formData.name || !formData.email) { toast.error("Name and Email are required."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { toast.error("Please enter a valid email address."); return; }
      onAddUser(formData);
    };
    return (
      <div className="space-y-4 pt-4">
        <div className="space-y-2"><Label htmlFor="name" className="text-white">Full Name *</Label><Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Jane Doe"/></div>
        <div className="space-y-2"><Label htmlFor="email" className="text-white">Email Address *</Label><Input id="email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="name@company.com"/></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label htmlFor="department" className="text-white">Department</Label><Input id="department" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} placeholder="e.g., Engineering"/></div>
          <div className="space-y-2"><Label htmlFor="location" className="text-white">Location</Label><Input id="location" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g., San Francisco, CA"/></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label htmlFor="role" className="text-white">Role *</Label><Select value={formData.role} onValueChange={value => setFormData({ ...formData, role: value as any })}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Guest">Guest</SelectItem><SelectItem value="Member">Member</SelectItem><SelectItem value="Admin">Admin</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label className="text-white">Teams</Label><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full justify-between"><span>{formData.teams.length > 0 ? `${formData.teams.length} selected` : "Select Teams"}</span><ChevronDown className="h-4 w-4 opacity-50"/></Button></DropdownMenuTrigger><DropdownMenuContent className="w-56" side="bottom" align="start" sideOffset={4} avoidCollisions={false}><DropdownMenuLabel>Available Teams</DropdownMenuLabel><DropdownMenuSeparator/>{availableTeams.map(team => <DropdownMenuCheckboxItem key={team} checked={formData.teams.includes(team)} onCheckedChange={checked => handleTeamChange(team, !!checked)}>{team}</DropdownMenuCheckboxItem>)}</DropdownMenuContent></DropdownMenu></div>
        </div>
        <div className="flex gap-3 pt-2"><Button onClick={handleSubmit} className="flex-1">Add User</Button><Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)} className="flex items-center gap-2"><XCircle className="h-4 w-4"/>Cancel</Button></div>
      </div>
    );
  };
  
  const UserProfile = ({ user }: { user: User }) => (
    <div className="space-y-6"><div className="flex items-center gap-4"><Avatar style={{ width: "4rem", height: "4rem" }}><AvatarImage src={user.avatar}/><AvatarFallback style={{ background: "linear-gradient(to right, #3b82f6, #8b5cf6)", color: "#ffffff", fontSize: "1.125rem", fontWeight: 500 }}>{user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback></Avatar><div><h3 className="text-xl font-semibold text-slate-100">{user.name}</h3><p className="text-slate-400">{user.title || "No title"}</p><div className="flex items-center gap-2 mt-1">{getRoleIcon(user.role)}<span className="text-sm text-slate-300">{user.role}</span></div></div></div></div>
  );
  
  const renderUserRow = (user: User) => {
    const isTargetOwner = user.role === 'Owner';
    const isTargetSelf = loggedInUser?.id === user.id;
    return (
      <tr key={user.id} style={{ borderBottom: "1px solid rgba(51,65,85,0.5)" }} className="hover:bg-slate-800/20">
        {columns.map((col) => (
          <td key={`${user.id}-${col.key}`} style={{ padding: "0.75rem 1rem", verticalAlign: "middle" }}>
            {(() => {
              switch (col.key) {
                case "select": return <div><Checkbox checked={selectedUsers.includes(user.id)} onCheckedChange={(c) => setSelectedUsers(p => c ? [...p, user.id] : p.filter(id => id !== user.id))}/></div>;
                case "name": return <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}><Avatar style={{ width: "36px", height: "36px" }}><AvatarImage src={user.avatar} /><AvatarFallback style={{ background: "linear-gradient(to right, #3b82f6, #9333ea)", color: "#ffffff" }}>{user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</AvatarFallback></Avatar><div><div style={{ fontWeight: 500, color: "#f1f5f9" }}>{user.name}</div><div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{user.title}</div></div></div>;
                case "email": return <span>{user.email}</span>;
                case "role": return <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>{getRoleIcon(user.role)}<span>{user.role}</span></div>;
                case "status": return <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>{getStatusIcon(user.status)}<span style={{ color: user.status === "Active" ? "#4ade80" : user.status === "Inactive" ? "#9ca3af" : user.status === "Pending" ? "#facc15" : "#60a5fa" }}>{user.status}</span></div>;
                case "viewAccess":
                    const disableManageAccess = !canManageUsers || isTargetSelf || isTargetOwner;
                    const tooltipMessage = isTargetOwner
                      ? "Cannot change an Owner's permissions."
                      : isTargetSelf
                      ? "You cannot change your own permissions."
                      : !canManageUsers
                      ? "Only Admins/Owners can manage access."
                      : `Manage access for ${user.name}`;

                    return (
                      <div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-[150px] justify-between"
                              disabled={disableManageAccess}
                              title={tooltipMessage}
                            >
                              Manage Access <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            className="w-64"
                            side="bottom" // Ensures the dropdown opens downward
                            align="start" // Aligns the dropdown to the start of the button
                            sideOffset={4} // Adds spacing between the button and the dropdown
                            avoidCollisions={false} // Prevents automatic flipping
                          >
                            <DropdownMenuLabel>Permissions for {user.name}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {APP_RESOURCES.map((resource) => {
                              const currentLevel = getAccessLevel(user, resource);
                              return (
                                <DropdownMenuSub key={resource}>
                                  <DropdownMenuSubTrigger>
                                    <span className="flex-1">{resource}</span>
                                    <Badge
                                      variant={
                                        currentLevel === "Edit Access"
                                          ? "default"
                                          : currentLevel === "View Only"
                                          ? "secondary"
                                          : "destructive"
                                      }
                                      className="ml-4"
                                    >
                                      {currentLevel}
                                    </Badge>
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent
                                    sideOffset={4} // Adds spacing between the trigger and the submenu
                                  >
                                    <DropdownMenuItem
                                      onSelect={() =>
                                        handlePermissionChange(user.id, resource, "No Access")
                                      }
                                    >
                                      <XCircle className="mr-2 h-4 w-4 text-red-500" /> No Access
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onSelect={() =>
                                        handlePermissionChange(user.id, resource, "View Only")
                                      }
                                    >
                                      <Eye className="mr-2 h-4 w-4 text-blue-500" /> View Only
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onSelect={() =>
                                        handlePermissionChange(user.id, resource, "Edit Access")
                                      }
                                    >
                                      <Pencil className="mr-2 h-4 w-4 text-green-500" /> Edit
                                      Access
                                    </DropdownMenuItem>
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                case "department": return <span>{user.department || "—"}</span>;
                case "location": return <span>{user.location || "—"}</span>;
                case "joinedDate": return <span>{user.joinedDate}</span>;
                case "teams": return <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>{user.teams.slice(0, 2).map((t) => (<Badge key={t} variant="secondary" className="text-xs">{t}</Badge>))}{user.teams.length > 2 && (<Badge variant="outline" className="text-xs">+{user.teams.length - 2}</Badge>)}</div>;
                case "lastActive": return <span style={{ color: "#94a3b8" }}>{user.lastActive}</span>;
                case "actions":
                    const disableAllActions = !canManageUsers || isTargetSelf || isTargetOwner;
                    const actionTooltip = isTargetOwner ? "Cannot modify an Owner." : isTargetSelf ? "You cannot modify yourself." : !canManageUsers ? "Only Admins/Owners can perform actions." : "More actions";
                    return (<div><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
                        <DropdownMenuItem><Mail className="mr-2 h-4 w-4" />Send Message</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled={disableAllActions} title={actionTooltip} onClick={(e) => { e.stopPropagation(); if (disableAllActions) return; setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u)); toast.success(`User ${user.status === "Active" ? "deactivated" : "activated"}`);}}>
                            {user.status === "Active" ? (<UserX className="mr-2 h-4 w-4" />) : (<UserCheck className="mr-2 h-4 w-4" />)}
                            {user.status === "Active" ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={disableAllActions} title={actionTooltip} className="text-red-500 focus:text-red-500" onClick={(e) => { e.stopPropagation(); if (disableAllActions) return; handleDeleteConfirmation(user);}}>
                            <Trash2 className="mr-2 h-4 w-4" />Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent></DropdownMenu></div>);
                default: return String((user as any)[col.key] || "");
              }
            })()}
          </td>
        ))}
      </tr>
    );
  }

  return (
    <div className="p-6 space-y-6" style={{ background: 'radial-gradient(circle, rgba(15,23,42,1) 0%, rgba(3,7,18,1) 100%)', color: '#e2e8f0' }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div><h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#f8fafc" }}>User Management</h1><p style={{ color: "#94a3b8", marginTop: "0.25rem" }}>Manage team members, roles, and permissions</p></div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {canManageUsers && selectedUsers.length > 0 && (<DropdownMenu open={isBulkActionOpen} onOpenChange={setIsBulkActionOpen}><DropdownMenuTrigger asChild><Button variant="outline" size="sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users className="h-4 w-4" /> {selectedUsers.length} selected <ChevronDown className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => executeBulkAction("activate")}><UserCheck className="mr-2 h-4 w-4"/>Activate</DropdownMenuItem><DropdownMenuItem onSelect={() => executeBulkAction("deactivate")}><UserX className="mr-2 h-4 w-4"/>Deactivate</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => executeBulkAction("delete")} className="text-red-500 focus:text-red-500"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>)}
          <Button onClick={() => setIsAddUserDialogOpen(true)} disabled={!canManageUsers} title={!canManageUsers ? "Only Admins/Owners can add users." : "Add a new user"}><UserPlus className="h-4 w-4 mr-2" /> Add User</Button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <Card style={{ backgroundColor: "rgba(30,41,59,0.3)", border: "1px solid rgba(51,65,85,0.5)" }}><CardContent style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><p style={{ fontSize: "0.875rem", color: "#94a3b8" }}>Total Users</p><p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{users.length}</p></div><Users style={{ height: "2rem", width: "2rem", color: "#60a5fa" }} /></CardContent></Card>
        <Card style={{ backgroundColor: "rgba(30,41,59,0.3)", border: "1px solid rgba(51,65,85,0.5)" }}><CardContent style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><p style={{ fontSize: "0.875rem", color: "#94a3b8" }}>Active</p><p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{users.filter(u => u.status === "Active").length}</p></div><UserCheck style={{ height: "2rem", width: "2rem", color: "#34d399" }} /></CardContent></Card>
        <Card style={{ backgroundColor: "rgba(30,41,59,0.3)", border: "1px solid rgba(51,65,85,0.5)" }}><CardContent style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><p style={{ fontSize: "0.875rem", color: "#94a3b8" }}>Pending</p><p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{users.filter(u => u.status === "Invited" || u.status === "Pending").length}</p></div><Mail style={{ height: "2rem", width: "2rem", color: "#facc15" }} /></CardContent></Card>
        <Card style={{ backgroundColor: "rgba(30,41,59,0.3)", border: "1px solid rgba(51,65,85,0.5)" }}><CardContent style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><p style={{ fontSize: "0.875rem", color: "#94a3b8" }}>Admins</p><p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{users.filter(u => u.role === "Admin" || u.role === "Owner").length}</p></div><Shield style={{ height: "2rem", width: "2rem", color: "#a78bfa" }} /></CardContent></Card>
      </div>
      <div className="flex items-center gap-4">
        <div style={{ position: "relative", flexGrow: 1, maxWidth: "24rem" }}><Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", width: "1rem", height: "1rem", color: "#94a3b8" }} /><Input placeholder="Search users by any field..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingLeft: "2.5rem", backgroundColor: "rgba(30,41,59,0.5)", border: "1px solid rgba(51,65,85,0.5)", color: "#f8fafc" }} /></div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline" style={{ display: 'flex', gap: '0.5rem' }}><Filter className="h-4 w-4" />Filter</Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>View Options</DropdownMenuLabel>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Group by</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={groupByField || ''} onValueChange={(value) => setGroupByField(value === groupByField ? null : value)}>
                  {groupableFields.map(field => (<DropdownMenuRadioItem key={field} value={field}>{field.charAt(0).toUpperCase() + field.slice(1)}</DropdownMenuRadioItem>))}
                </DropdownMenuRadioGroup>
                {groupByField && <><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => setGroupByField(null)}>Clear Grouping</DropdownMenuItem></>}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div style={{ borderRadius: '0.5rem', border: '1px solid rgba(51, 65, 85, 0.5)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '1600px', fontSize: '0.875rem', textAlign: 'left', color: '#d1d5db' }}>
            <thead style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', backgroundColor: 'rgba(30, 41, 59, 0.5)' }}>
              <tr>{columns.map((col) => (<th key={col.key} scope="col" style={{ padding: '0.75rem 1rem' }}>{col.sortable ? (<div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => requestSort(col.key as keyof User)}>{col.label} {getSortIcon(col.key)}</div>) : ( col.key === 'select' ? <Checkbox checked={selectedUsers.length > 0 && sortedAndFilteredUsers.length > 0 && selectedUsers.length === sortedAndFilteredUsers.length} onCheckedChange={handleSelectAll} /> : col.label )}</th>))}</tr>
            </thead>
            <tbody>
              {sortedAndFilteredUsers.length > 0 ? (
                groupedUsers ? (
                  Array.from(groupedUsers.entries()).map(([groupName, usersInGroup]) => (
                    <>
                      <tr key={`group-header-${groupName}`} style={{ backgroundColor: 'rgba(51, 65, 85, 0.3)' }}>
                        <td colSpan={columns.length} style={{ padding: '0.5rem 1rem', fontWeight: 600, color: '#cbd5e1' }}>{groupName} ({usersInGroup.length})</td>
                      </tr>
                      {usersInGroup.map(user => renderUserRow(user))}
                    </>
                  ))
                ) : (
                  sortedAndFilteredUsers.map(user => renderUserRow(user))
                )
              ) : (
                <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}><DialogContent className="sm:max-w-sm border border-white/20 shadow-xl" style={{ backgroundColor: "rgba(30, 72, 110, 0.6)", backdropFilter: "blur(1px) saturate(100%)", WebkitBackdropFilter: "blur(10px) saturate(100%)", borderRadius: "1rem" }}><DialogHeader><DialogTitle className="flex items-center gap-2 text-white"><UserPlus /> Add New User</DialogTitle></DialogHeader><AddUserForm onAddUser={handleAddUser} /></DialogContent></Dialog>
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>User Profile</DialogTitle></DialogHeader>{selectedUser && <UserProfile user={selectedUser} />}</DialogContent></Dialog>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}><DialogContent className="sm:max-w-sm backdrop-blur-md" style={{ backgroundColor: "rgba(0, 29, 57, 0.6)", borderRadius: "0.5rem" }}><DialogHeader><DialogTitle className="flex items-center gap-2 text-white"><AlertTriangle className="text-red-500" />Confirm Deletion</DialogTitle><DialogDescription className="pt-2 text-white">Are you sure you want to delete the user "{userToDelete?.name}"?</DialogDescription></DialogHeader><DialogFooter className="gap-2"><Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="text-black flex items-center gap-2"><XCircle className="h-4 w-4" />Cancel</Button><Button variant="destructive" onClick={handleDeleteUser} className="flex items-center gap-2"><Trash2 className="h-4 w-4" />Confirm Delete</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

// ✅ ADDED: Helper function for relative time formatting
const getRelativeTime = (date: Date): string => {
  if (!date || isNaN(date.getTime())) return 'Never';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const seconds = Math.round(diffMs / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30.44); // Average month length
  const years = Math.round(days / 365.25); // Account for leap years

  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 5) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
};