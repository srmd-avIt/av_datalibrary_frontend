/**
 * UserManagement Component - ClickUp-style User Management Interface
 * 
 * A comprehensive user management system with granular, interactive permission controls.
 * Features a "View Access" column to manage user rights for different app sections.
 * Also includes sorting, searching, bulk actions, and persistent add/delete via a backend API.
 * 
 * @component
 */

import { useState, useMemo, useEffect } from "react";
import { Badge } from "./ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  Crown, Shield, Eye, CircleDot, Mail, MoreHorizontal, Settings, Trash2, UserX,
  UserCheck, Search, ChevronDown, ChevronUp, ChevronsUpDown, Users, UserPlus,
  AlertTriangle, Pencil, XCircle // Added icons for permissions
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger // For nested menus
} from "./ui/dropdown-menu";
import { toast } from "sonner";

// ===================================================================================
// --- 1. PERMISSION SETUP ---
// ===================================================================================

const APP_RESOURCES = [
  "Dashboard", "Events", "Media Log", "Digital Recordings", "Aux Files", "AI Assistant", "User Management"
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
  lastActive: string; // The raw string/timestamp from the API
  lastActiveDate: Date; // The parsed Date object
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

interface UserManagementProps {
  onRowSelect?: (user: User) => void;
}

// ===================================================================================
// --- 2. MAIN COMPONENT ---
// ===================================================================================

export function UserManagement({ onRowSelect }: UserManagementProps) {
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

  const parseLastActive = (dateOrString: string): Date => {
    const parsedDate = new Date(dateOrString);
    if (dateOrString && !isNaN(parsedDate.getTime())) {
        return parsedDate;
    }
    if (typeof dateOrString !== 'string' || dateOrString.toLowerCase() === 'never') return new Date(0);
    const now = new Date();
    const parts = dateOrString.toLowerCase().split(' ');
    if (parts.length < 2) return now;
    const value = parseInt(parts[0], 10);
    const unit = parts[1];
    if (isNaN(value)) return now;
    if (unit.startsWith('minute')) return new Date(now.getTime() - value * 60 * 1000);
    if (unit.startsWith('hour')) return new Date(now.getTime() - value * 60 * 60 * 1000);
    if (unit.startsWith('day')) return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
    if (unit.startsWith('week')) return new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000);
    return now;
  };

  const formatRelativeTime = (date: Date): string => {
    if (!date || date.getTime() === 0) return 'Never';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const inputDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (inputDay.getTime() === today.getTime()) return "Today";
    if (inputDay.getTime() === yesterday.getTime()) return "Yesterday";

    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 6);
    if (inputDay > oneWeekAgo) {
      return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
    }
    
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  };

  const getDefaultPermissions = (role: User['role']): UserPermission[] => {
    const allEdit: UserPermission[] = APP_RESOURCES.map(r => ({ resource: r, actions: ['read', 'write'] }));
    const allView: UserPermission[] = APP_RESOURCES.filter(r => r !== 'User Management').map(r => ({ resource: r, actions: ['read'] }));
    
    switch(role) {
        case 'Owner':
        case 'Admin':
            return allEdit;
        case 'Member':
            return allView;
        case 'Guest':
            return [{ resource: 'Dashboard', actions: ['read'] }];
        default:
            return [];
    }
  };

  const getAccessLevel = (user: User, resource: string): AccessLevel => {
    const permission = user.permissions.find(p => p.resource === resource);
    if (!permission || permission.actions.length === 0) return 'No Access';
    if (permission.actions.includes('write')) return 'Edit Access';
    if (permission.actions.includes('read')) return 'View Only';
    return 'No Access';
  };

  const handlePermissionChange = (userId: string, resource: string, level: AccessLevel) => {
    let updatedPermissions: UserPermission[] = [];
    
    setUsers(currentUsers => currentUsers.map(user => {
        if (user.id !== userId) return user;
        const otherPermissions = user.permissions.filter(p => p.resource !== resource);
        updatedPermissions = [...otherPermissions];
        if (level === 'View Only') {
            updatedPermissions.push({ resource, actions: ['read'] });
        } else if (level === 'Edit Access') {
            updatedPermissions.push({ resource, actions: ['read', 'write'] });
        }
        return { ...user, permissions: updatedPermissions };
    }));
    
    const apiCall = fetch(`${import.meta.env.VITE_API_URL}/users/${userId}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions: updatedPermissions }),
    });

    toast.promise(apiCall, {
      loading: `Saving permissions for ${resource}...`,
      success: 'Permissions saved successfully.',
      error: 'Failed to save permissions.'
    });
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/users`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        const processedUsers: User[] = data.map((user: any) => {
          const lastActiveDate = new Date(user.lastActive);
          const formattedDate = lastActiveDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            joinedDate: user.joinedDate,
            lastActive: formattedDate, // Only the date
            lastActiveDate,
            teams: user.teams || [],
            department: user.department,
            location: user.location,
            permissions: [],
            twoFactorEnabled: false,
            title: user.role,
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

  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setIsProfileDialogOpen(true);
    onRowSelect?.(user);
  };

  const handleBulkSelect = (userId: string, selected: boolean) => {
    setSelectedUsers(prev => selected ? [...prev, userId] : prev.filter(id => id !== userId));
  };
  
  const sortedAndFilteredUsers = useMemo(() => {
    let filtered = [...users];
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        Object.values(user).some(val => String(val).toLowerCase().includes(lowercasedQuery))
      );
    }
    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const aValue = sortConfig.key === 'lastActive' ? a.lastActiveDate.getTime() : a[sortConfig.key];
        const bValue = sortConfig.key === 'lastActive' ? b.lastActiveDate.getTime() : b[sortConfig.key];
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [users, searchQuery, sortConfig]);

  const handleSelectAll = (selected: boolean) => {
    setSelectedUsers(selected ? sortedAndFilteredUsers.map(user => user.id) : []);
  };

  const executeBulkAction = (action: string) => {
    let message = "";
    setUsers(currentUsers => {
      let updatedUsers = [...currentUsers];
      switch (action) {
        case "activate":
          updatedUsers = updatedUsers.map(u => selectedUsers.includes(u.id) ? { ...u, status: "Active" } : u);
          message = `Activated ${selectedUsers.length} users`;
          break;
        case "deactivate":
          updatedUsers = updatedUsers.map(u => selectedUsers.includes(u.id) ? { ...u, status: "Inactive" } : u);
          message = `Deactivated ${selectedUsers.length} users`;
          break;
        case "delete":
          updatedUsers = updatedUsers.filter(u => !selectedUsers.includes(u.id));
          message = `Removed ${selectedUsers.length} users from view.`;
          break;
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
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newUserData, lastActive: formattedDate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add user.");
      }

      const createdUser = await response.json();
      const processedUser = {
        ...createdUser,
        lastActive: formattedDate,
        lastActiveDate: now,
        title: createdUser.role,
      };

      setUsers((prevUsers) => [processedUser, ...prevUsers]);
      setIsAddUserDialogOpen(false);
      toast.success(`User "${createdUser.name}" added successfully.`);
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error(error.message || "An unexpected error occurred.");
    }
  };

  const handleDeleteConfirmation = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    const { id, name } = userToDelete;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete user.");
      }

      setUsers((prev) => prev.filter((u) => u.id !== id));
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      toast.success(`User "${name}" was deleted successfully.`);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "An unexpected error occurred.");
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };
  
  const AddUserForm = ({ onAddUser }: { onAddUser: (data: any) => void }) => {
    const [formData, setFormData] = useState({
      name: "",
      email: "",
      role: "Member" as "Member" | "Admin" | "Guest",
      department: "",
      location: "",
      teams: [] as string[],
    });

    const handleTeamChange = (team: string, checked: boolean) => {
      setFormData((prev) => ({
        ...prev,
        teams: checked ? [...prev.teams, team] : prev.teams.filter((t) => t !== team),
      }));
    };

    const handleSubmit = () => {
      if (!formData.name || !formData.email) {
        toast.error("Name and Email are required.");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.error("Please enter a valid email address.");
        return;
      }

      try {
        onAddUser(formData); // Call the parent function to add the user
      } catch (error) {
        console.error("Error adding user:", error);
        toast.error("An unexpected error occurred while adding the user.");
      }
    };

    return (
      <div className="space-y-4 pt-4">
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Jane Doe"
          />
        </div>
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="name@company.com"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g., Engineering"
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., San Francisco, CA"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="role">Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Guest">Guest</SelectItem>
                <SelectItem value="Member">Member</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Teams</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>
                    {formData.teams.length > 0
                      ? `${formData.teams.length} selected`
                      : "Select Teams"}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Available Teams</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableTeams.map((team) => (
                  <DropdownMenuCheckboxItem
                    key={team}
                    checked={formData.teams.includes(team)}
                    onCheckedChange={(checked) => handleTeamChange(team, !!checked)}
                  >
                    {team}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} className="flex-1">
            Add User
          </Button>
          <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  };
  
  const UserProfile = ({ user }: { user: User }) => (
    <div className="space-y-6">
      <div className="flex items-center gap-4"><Avatar style={{ width: "4rem", height: "4rem" }}><AvatarImage src={user.avatar} /><AvatarFallback style={{ background: "linear-gradient(to right, #3b82f6, #8b5cf6)", color: "#ffffff", fontSize: "1.125rem", fontWeight: 500 }}>{user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</AvatarFallback></Avatar><div><h3 className="text-xl font-semibold text-slate-100">{user.name}</h3><p className="text-slate-400">{user.title || "No title"}</p><div className="flex items-center gap-2 mt-1">{getRoleIcon(user.role)}<span className="text-sm text-slate-300">{user.role}</span></div></div></div>
    </div>
  );

  return (
    <div className="p-6 space-y-6" style={{ background: 'radial-gradient(circle, rgba(15,23,42,1) 0%, rgba(3,7,18,1) 100%)', color: '#e2e8f0' }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div><h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#f8fafc" }}>User Management</h1><p style={{ color: "#94a3b8", marginTop: "0.25rem" }}>Manage team members, roles, and permissions</p></div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {selectedUsers.length > 0 && (<DropdownMenu open={isBulkActionOpen} onOpenChange={setIsBulkActionOpen}><DropdownMenuTrigger asChild><Button variant="outline" size="sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users className="h-4 w-4" /> {selectedUsers.length} selected <ChevronDown className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => executeBulkAction("activate")}><UserCheck className="mr-2 h-4 w-4"/>Activate</DropdownMenuItem><DropdownMenuItem onSelect={() => executeBulkAction("deactivate")}><UserX className="mr-2 h-4 w-4"/>Deactivate</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => executeBulkAction("delete")} className="text-red-500 focus:text-red-500"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>)}
          <Button onClick={() => setIsAddUserDialogOpen(true)}><UserPlus className="h-4 w-4 mr-2" /> Add User</Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <Card style={{ backgroundColor: "rgba(30,41,59,0.3)", border: "1px solid rgba(51,65,85,0.5)" }}><CardContent className="p-4 flex justify-between items-center"><div><p className="text-sm text-slate-400">Total Users</p><p className="text-2xl font-bold">{users.length}</p></div><Users className="h-8 w-8 text-blue-400"/></CardContent></Card>
        <Card style={{ backgroundColor: "rgba(30,41,59,0.3)", border: "1px solid rgba(51,65,85,0.5)" }}><CardContent className="p-4 flex justify-between items-center"><div><p className="text-sm text-slate-400">Active</p><p className="text-2xl font-bold">{users.filter(u => u.status === "Active").length}</p></div><UserCheck className="h-8 w-8 text-green-400"/></CardContent></Card>
        <Card style={{ backgroundColor: "rgba(30,41,59,0.3)", border: "1px solid rgba(51,65,85,0.5)" }}><CardContent className="p-4 flex justify-between items-center"><div><p className="text-sm text-slate-400">Pending</p><p className="text-2xl font-bold">{users.filter(u => u.status === "Invited" || u.status === "Pending").length}</p></div><Mail className="h-8 w-8 text-yellow-400"/></CardContent></Card>
        <Card style={{ backgroundColor: "rgba(30,41,59,0.3)", border: "1px solid rgba(51,65,85,0.5)" }}><CardContent className="p-4 flex justify-between items-center"><div><p className="text-sm text-slate-400">Admins</p><p className="text-2xl font-bold">{users.filter(u => u.role === "Admin" || u.role === "Owner").length}</p></div><Shield className="h-8 w-8 text-purple-400"/></CardContent></Card>
      </div>

      <div style={{ position: "relative", maxWidth: "24rem" }}><Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", width: "1rem", height: "1rem", color: "#94a3b8" }} /><Input placeholder="Search users by any field..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingLeft: "2.5rem", backgroundColor: "rgba(30,41,59,0.5)", border: "1px solid rgba(51,65,85,0.5)", color: "#f8fafc" }} /></div>

      <div style={{ borderRadius: '0.5rem', border: '1px solid rgba(51, 65, 85, 0.5)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '1600px', fontSize: '0.875rem', textAlign: 'left', color: '#d1d5db' }}>
            <thead style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', backgroundColor: 'rgba(30, 41, 59, 0.5)' }}>
              <tr>{columns.map((col) => (<th key={col.key} scope="col" style={{ padding: '0.75rem 1rem' }}>{col.sortable ? (<div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => requestSort(col.key as keyof User)}>{col.label} {getSortIcon(col.key)}</div>) : ( col.key === 'select' ? <Checkbox checked={selectedUsers.length > 0 && sortedAndFilteredUsers.length > 0 && selectedUsers.length === sortedAndFilteredUsers.length} onCheckedChange={handleSelectAll} /> : col.label )}</th>))}</tr>
            </thead>
            <tbody>
              {sortedAndFilteredUsers.length > 0 ? (
                sortedAndFilteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: "1px solid rgba(51, 65, 85, 0.5)",
                      cursor: "default", // Change cursor to default
                    }}
                    className="hover:bg-slate-800/20"
                  >
                    {columns.map((col) => (
                      <td
                        key={`${user.id}-${col.key}`}
                        style={{ padding: "0.75rem 1rem", verticalAlign: "middle" }}
                      >
                        {(() => {
                          switch (col.key) {
                            case "select":
                              return (
                                <div>
                                  <Checkbox
                                    checked={selectedUsers.includes(user.id)}
                                    onCheckedChange={(c) => handleBulkSelect(user.id, !!c)}
                                  />
                                </div>
                              );
                            case "name":
                              return (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.75rem",
                                  }}
                                >
                                  <Avatar style={{ width: "36px", height: "36px" }}>
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback
                                      style={{
                                        background:
                                          "linear-gradient(to right, #3b82f6, #9333ea)",
                                        color: "#ffffff",
                                      }}
                                    >
                                      {user.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div
                                      style={{
                                        fontWeight: 500,
                                        color: "#f1f5f9",
                                      }}
                                    >
                                      {user.name}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "0.75rem",
                                        color: "#94a3b8",
                                      }}
                                    >
                                      {user.title}
                                    </div>
                                  </div>
                                </div>
                              );
                            case "email":
                              return <span>{user.email}</span>;
                            case "role":
                              return (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                  }}
                                >
                                  {getRoleIcon(user.role)}
                                  <span>{user.role}</span>
                                </div>
                              );
                            case "status":
                              return (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                  }}
                                >
                                  {getStatusIcon(user.status)}
                                  <span
                                    style={{
                                      color:
                                        user.status === "Active"
                                          ? "#4ade80"
                                          : user.status === "Inactive"
                                          ? "#9ca3af"
                                          : user.status === "Pending"
                                          ? "#facc15"
                                          : "#60a5fa",
                                    }}
                                  >
                                    {user.status}
                                  </span>
                                </div>
                              );
                            case "viewAccess":
                              return (
                                <div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-[150px] justify-between"
                                      >
                                        Manage Access{" "}
                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-64">
                                      <DropdownMenuLabel>
                                        Permissions for {user.name}
                                      </DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      {APP_RESOURCES.map((resource) => {
                                        const currentLevel = getAccessLevel(
                                          user,
                                          resource
                                        );
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
                                            <DropdownMenuSubContent>
                                              <DropdownMenuItem
                                                onSelect={() =>
                                                  handlePermissionChange(
                                                    user.id,
                                                    resource,
                                                    "No Access"
                                                  )
                                                }
                                              >
                                                <XCircle className="mr-2 h-4 w-4 text-red-500" />{" "}
                                                No Access
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onSelect={() =>
                                                  handlePermissionChange(
                                                    user.id,
                                                    resource,
                                                    "View Only"
                                                  )
                                                }
                                              >
                                                <Eye className="mr-2 h-4 w-4 text-blue-500" />{" "}
                                                View Only
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onSelect={() =>
                                                  handlePermissionChange(
                                                    user.id,
                                                    resource,
                                                    "Edit Access"
                                                  )
                                                }
                                              >
                                                <Pencil className="mr-2 h-4 w-4 text-green-500" />{" "}
                                                Edit Access
                                              </DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                          </DropdownMenuSub>
                                        );
                                      })}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              );
                            case "department":
                              return <span>{user.department || "—"}</span>;
                            case "location":
                              return <span>{user.location || "—"}</span>;
                            case "joinedDate":
                              return <span>{user.joinedDate}</span>;
                            case "teams":
                              return (
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "0.25rem",
                                  }}
                                >
                                  {user.teams.slice(0, 2).map((t) => (
                                    <Badge
                                      key={t}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {t}
                                    </Badge>
                                  ))}
                                  {user.teams.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{user.teams.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              );
                            case "lastActive":
                              return (
                                <span style={{ color: "#94a3b8" }}>{user.lastActive}</span>
                              );
                            case "actions":
                              return (
                                <div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Send Message
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setUsers((prev) =>
                                            prev.map((u) =>
                                              u.id === user.id
                                                ? {
                                                    ...u,
                                                    status:
                                                      u.status === "Active"
                                                        ? "Inactive"
                                                        : "Active",
                                                  }
                                                : u
                                            )
                                          );
                                          toast.success(
                                            `User ${
                                              user.status === "Active"
                                                ? "deactivated"
                                                : "activated"
                                            }`
                                          );
                                        }}
                                      >
                                        {user.status === "Active" ? (
                                          <UserX className="mr-2 h-4 w-4" />
                                        ) : (
                                          <UserCheck className="mr-2 h-4 w-4" />
                                        )}
                                        {user.status === "Active"
                                          ? "Deactivate"
                                          : "Activate"}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-red-500 focus:text-red-500"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteConfirmation(user);
                                        }}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              );
                            default:
                              return String((user as any)[col.key] || "");
                          }
                        })()}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-8 text-slate-400"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus /> Add New User</DialogTitle></DialogHeader><AddUserForm onAddUser={handleAddUser} /></DialogContent></Dialog>
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>User Profile</DialogTitle></DialogHeader>{selectedUser && <UserProfile user={selectedUser} />}</DialogContent></Dialog>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-red-500" />Confirm Deletion</DialogTitle>
                <DialogDescription className="pt-2">Are you sure you want to delete the user "{userToDelete?.name}"?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDeleteUser}>Confirm Delete</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}