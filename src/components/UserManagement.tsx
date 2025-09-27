/**
 * UserManagement Component - ClickUp-style User Management Interface
 * 
 * A comprehensive user management system inspired by ClickUp's interface.
 * Features include advanced filtering, role management, bulk actions, user invitations,
 * permission levels, and detailed user profiles.
 * 
 * Features:
 * - ClickUp-style list view with advanced filtering
 * - Role-based permissions (Owner, Admin, Member, Guest)
 * - Bulk user actions (activate, deactivate, delete, change roles)
 * - User invitation system
 * - Team/workspace management
 * - Activity tracking and last seen
 * - Advanced search and filtering
 * - User profile management
 * - Permission matrix
 * 
 * @component
 */

import { useState, useMemo, useEffect } from "react";
import { ClickUpListView } from "./ClickUpListView";
import { Badge } from "./ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  Crown, 
  Shield, 
  Eye, 
  CircleDot, 
  UserPlus, 
  Mail, 
  MoreHorizontal,
  Calendar,
  Clock,
  Users,
  Settings,
  Trash2,
  UserX,
  UserCheck,
  Send,
  Copy,
  Download,
  Filter,
  Search,
  ChevronDown
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { toast } from "sonner";

/**
 * User interface with comprehensive user data
 */
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
  permissions: UserPermission[];
  teams: string[];
  department?: string;
  location?: string;
  timezone?: string;
  phone?: string;
  title?: string;
  twoFactorEnabled: boolean;
  invitedBy?: string;
  notes?: string;
}

/**
 * Permission structure for granular access control
 */
interface UserPermission {
  resource: string;
  actions: string[];
}

/**
 * User invitation interface
 */
interface UserInvitation {
  email: string;
  role: "Owner" | "Admin" | "Member" | "Guest";
  teams: string[];
  message?: string;
  expiresIn: number; // days
}

// Mock data with comprehensive user information
const mockUsers: User[] = [
  {
    id: "1",
    name: "Liam Smith",
    email: "liam.smith@company.com",
    role: "Owner",
    status: "Active",
    joinedDate: "24 Jun 2024",
    lastActive: "2 minutes ago",
    lastActiveDate: new Date(Date.now() - 2 * 60 * 1000),
    permissions: [
      { resource: "workspace", actions: ["read", "write", "delete", "admin"] },
      { resource: "projects", actions: ["read", "write", "delete", "admin"] },
      { resource: "users", actions: ["read", "write", "delete", "admin"] }
    ],
    teams: ["Engineering", "Leadership"],
    department: "Engineering",
    location: "San Francisco, CA",
    timezone: "PST",
    phone: "+1 (555) 123-4567",
    title: "Chief Technology Officer",
    twoFactorEnabled: true,
    notes: "Founder and technical lead"
  },
  {
    id: "2",
    name: "Noah Anderson",
    email: "noah.anderson@company.com",
    role: "Admin",
    status: "Active",
    joinedDate: "15 Mar 2023",
    lastActive: "1 hour ago",
    lastActiveDate: new Date(Date.now() - 60 * 60 * 1000),
    permissions: [
      { resource: "workspace", actions: ["read", "write"] },
      { resource: "projects", actions: ["read", "write", "delete"] },
      { resource: "users", actions: ["read", "write"] }
    ],
    teams: ["Design", "Product"],
    department: "Design",
    location: "New York, NY",
    timezone: "EST",
    phone: "+1 (555) 234-5678",
    title: "Head of Design",
    twoFactorEnabled: true,
    invitedBy: "Liam Smith"
  },
  {
    id: "3",
    name: "Isabella Garcia",
    email: "isabella.garcia@company.com",
    role: "Member",
    status: "Inactive",
    joinedDate: "10 Apr 2022",
    lastActive: "2 weeks ago",
    lastActiveDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    permissions: [
      { resource: "projects", actions: ["read", "write"] }
    ],
    teams: ["Engineering"],
    department: "Engineering",
    location: "Austin, TX",
    timezone: "CST",
    title: "Frontend Developer",
    twoFactorEnabled: false,
    invitedBy: "Liam Smith"
  },
  {
    id: "4",
    name: "William Clark",
    email: "william.clark@company.com",
    role: "Member",
    status: "Active",
    joinedDate: "28 Feb 2023",
    lastActive: "5 minutes ago",
    lastActiveDate: new Date(Date.now() - 5 * 60 * 1000),
    permissions: [
      { resource: "projects", actions: ["read", "write"] }
    ],
    teams: ["Product", "Marketing"],
    department: "Product",
    location: "Seattle, WA",
    timezone: "PST",
    title: "Product Manager",
    twoFactorEnabled: true,
    invitedBy: "Noah Anderson"
  },
  {
    id: "5",
    name: "James Hart",
    email: "james.hart@company.com",
    role: "Guest",
    status: "Active",
    joinedDate: "19 May 2023",
    lastActive: "3 days ago",
    lastActiveDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    permissions: [
      { resource: "projects", actions: ["read"] }
    ],
    teams: ["External"],
    department: "Consulting",
    location: "Remote",
    timezone: "EST",
    title: "Business Consultant",
    twoFactorEnabled: false,
    invitedBy: "William Clark"
  },
  {
    id: "6",
    name: "Sarah Mitchell",
    email: "sarah.mitchell@company.com",
    role: "Member",
    status: "Pending",
    joinedDate: "01 Dec 2024",
    lastActive: "Never",
    lastActiveDate: new Date(),
    permissions: [
      { resource: "projects", actions: ["read", "write"] }
    ],
    teams: ["Marketing"],
    department: "Marketing",
    title: "Marketing Specialist",
    twoFactorEnabled: false,
    invitedBy: "William Clark"
  },
  {
    id: "7",
    name: "Alex Johnson",
    email: "alex.johnson@company.com",
    role: "Admin",
    status: "Invited",
    joinedDate: "05 Dec 2024",
    lastActive: "Never",
    lastActiveDate: new Date(),
    permissions: [
      { resource: "workspace", actions: ["read", "write"] },
      { resource: "projects", actions: ["read", "write", "delete"] }
    ],
    teams: ["Engineering", "DevOps"],
    department: "Engineering",
    title: "DevOps Engineer",
    twoFactorEnabled: false,
    invitedBy: "Liam Smith"
  },
  {
    id: "8",
    name: "Emma Wilson",
    email: "emma.wilson@company.com",
    role: "Admin",
    status: "Active",
    joinedDate: "12 Jan 2023",
    lastActive: "15 minutes ago",
    lastActiveDate: new Date(Date.now() - 15 * 60 * 1000),
    permissions: [
      { resource: "workspace", actions: ["read", "write"] },
      { resource: "projects", actions: ["read", "write", "delete"] },
      { resource: "users", actions: ["read", "write"] }
    ],
    teams: ["Sales", "Leadership"],
    department: "Sales",
    location: "Chicago, IL",
    timezone: "CST",
    phone: "+1 (555) 345-6789",
    title: "VP of Sales",
    twoFactorEnabled: true,
    invitedBy: "Liam Smith",
    notes: "Leads enterprise sales initiatives"
  },
  {
    id: "9",
    name: "Michael Rodriguez",
    email: "michael.rodriguez@company.com",
    role: "Member",
    status: "Active",
    joinedDate: "08 Sep 2023",
    lastActive: "2 hours ago",
    lastActiveDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
    permissions: [
      { resource: "projects", actions: ["read", "write"] }
    ],
    teams: ["Engineering", "DevOps"],
    department: "Engineering",
    location: "Denver, CO",
    timezone: "MST",
    phone: "+1 (555) 456-7890",
    title: "Backend Developer",
    twoFactorEnabled: true,
    invitedBy: "Alex Johnson"
  },
  {
    id: "10",
    name: "Sophia Chen",
    email: "sophia.chen@company.com",
    role: "Member",
    status: "Active",
    joinedDate: "22 Nov 2022",
    lastActive: "30 minutes ago",
    lastActiveDate: new Date(Date.now() - 30 * 60 * 1000),
    permissions: [
      { resource: "projects", actions: ["read", "write"] }
    ],
    teams: ["Design", "Product"],
    department: "Design",
    location: "Los Angeles, CA",
    timezone: "PST",
    phone: "+1 (555) 567-8901",
    title: "UX/UI Designer",
    twoFactorEnabled: false,
    invitedBy: "Noah Anderson"
  },
 
];

// Available teams/groups
const availableTeams = [
  "Engineering",
  "Design", 
  "Product",
  "Marketing",
  "Sales",
  "Support",
  "Leadership",
  "DevOps",
  "External"
];

interface UserManagementProps {
  data?: User[];
  onRowSelect?: (user: User) => void;
  filterConfigs?: any[];
}

export function UserManagement({ 
  data = mockUsers, 
  onRowSelect, 
  filterConfigs = [] 
}: UserManagementProps) {
  const [users, setUsers] = useState<User[]>(data);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  /**
   * Get role icon based on user role
   */
  const getRoleIcon = (role: string) => {
   switch (role) {
  case "Owner":
    return <Crown style={{ width: "16px", height: "16px", color: "#eab308" }} />; // yellow-500
  case "Admin":
    return <Shield style={{ width: "16px", height: "16px", color: "#3b82f6" }} />; // blue-500
  case "Member":
    return <Users style={{ width: "16px", height: "16px", color: "#22c55e" }} />; // green-500
  case "Guest":
    return <Eye style={{ width: "16px", height: "16px", color: "#6b7280" }} />; // gray-500
  default:
    return <Users style={{ width: "16px", height: "16px", color: "#6b7280" }} />; // gray-500
}

  };

  /**
   * Get status icon and color based on user status
   */
  const getStatusIcon = (status: string) => {
  const baseStyle = { width: "12px", height: "12px" }; // w-3 h-3 → 12px

  switch (status) {
    case "Active":
      return <CircleDot style={{ ...baseStyle, color: "#22c55e", fill: "currentColor" }} />; // green-500
    case "Inactive":
      return <CircleDot style={{ ...baseStyle, color: "#6b7280", fill: "currentColor" }} />; // gray-500
    case "Pending":
      return <CircleDot style={{ ...baseStyle, color: "#eab308", fill: "currentColor" }} />; // yellow-500
    case "Invited":
      return <CircleDot style={{ ...baseStyle, color: "#3b82f6", fill: "currentColor" }} />; // blue-500
    default:
      return <CircleDot style={{ ...baseStyle, color: "#6b7280", fill: "currentColor" }} />; // gray-500
  }
};


  /**
   * Format last active time in human-readable format
   */
  const formatLastActive = (lastActive: string, lastActiveDate: Date) => {
    if (lastActive === "Never") return "Never";
    
    const now = new Date();
    const diff = now.getTime() - lastActiveDate.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  /**
   * Handle row selection for bulk actions
   */
  const handleRowSelect = (user: User) => {
    setSelectedUser(user);
    setIsProfileDialogOpen(true);
    // Also call the external onRowSelect if provided
    if (onRowSelect) {
      onRowSelect(user);
    }
  };

  /**
   * Handle bulk user selection
   */
  const handleBulkSelect = (userId: string, selected: boolean) => {
    if (selected) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  /**
   * Handle select all users
   */
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  /**
   * Execute bulk actions on selected users
   */
  const executeBulkAction = (action: string) => {
    switch (action) {
      case "activate":
        setUsers(users.map(user => 
          selectedUsers.includes(user.id) 
            ? { ...user, status: "Active" as const }
            : user
        ));
        toast.success(`Activated ${selectedUsers.length} users`);
        break;
      case "deactivate":
        setUsers(users.map(user => 
          selectedUsers.includes(user.id) 
            ? { ...user, status: "Inactive" as const }
            : user
        ));
        toast.success(`Deactivated ${selectedUsers.length} users`);
        break;
      case "delete":
        setUsers(users.filter(user => !selectedUsers.includes(user.id)));
        toast.success(`Deleted ${selectedUsers.length} users`);
        break;
      case "make-admin":
        setUsers(users.map(user => 
          selectedUsers.includes(user.id) 
            ? { ...user, role: "Admin" as const }
            : user
        ));
        toast.success(`Made ${selectedUsers.length} users Admin`);
        break;
      case "make-member":
        setUsers(users.map(user => 
          selectedUsers.includes(user.id) 
            ? { ...user, role: "Member" as const }
            : user
        ));
        toast.success(`Made ${selectedUsers.length} users Member`);
        break;
    }
    setSelectedUsers([]);
    setIsBulkActionOpen(false);
  };

  /**
   * Filter configurations for advanced filtering
   */
  const getFilterConfigs = () => filterConfigs.length > 0 ? filterConfigs : [
    { key: "role", label: "Role", type: "select" as const, options: ["Owner", "Admin", "Member", "Guest"] },
    { key: "status", label: "Status", type: "select" as const, options: ["Active", "Inactive", "Pending", "Invited"] },
    { key: "department", label: "Department", type: "select" as const },
    { key: "location", label: "Location", type: "text" as const },
    { key: "joinedDate", label: "Join Date", type: "date" as const },
    { key: "lastActiveDate", label: "Last Active", type: "date" as const },
    { key: "twoFactorEnabled", label: "2FA Enabled", type: "checkbox" as const }
  ];

  // Column definitions for the user table
  const columns = [
    {
      key: "select",
      label: "",
      width: 50,
      render: (value: any, user: User) => (
        <Checkbox
          checked={selectedUsers.includes(user.id)}
          onCheckedChange={(checked) => handleBulkSelect(user.id, !!checked)}
        />
      )
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      width: 250,
      render: (value: string, user: User) => (
        <div className="flex items-center gap-3">
         <Avatar style={{ width: "36px", height: "36px" }}> {/* w-9 h-9 → 36px */}
  <AvatarImage src={user.avatar} />
  <AvatarFallback
    style={{
      background: "linear-gradient(to right, #3b82f6, #9333ea)", // from-blue-500 to-purple-600
      color: "#ffffff", // text-white
      fontSize: "14px", // text-sm
      fontWeight: 500, // font-medium
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: "100%",
      borderRadius: "50%", // keep it circular
    }}
  >
    {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
  </AvatarFallback>
</Avatar>

          <div className="flex flex-col">
            <span className="font-medium text-slate-100">{value}</span>
            <span className="text-xs text-slate-400">{user.title || "No title"}</span>
          </div>
        </div>
      )
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      width: 200,
      render: (value: string) => (
        <span className="text-slate-300">{value}</span>
      )
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      width: 120,
      render: (value: string, user: User) => (
        <div className="flex items-center gap-2">
          {getRoleIcon(value)}
          <span className="font-medium">{value}</span>
        </div>
      )
    },
  {
  key: "status",
  label: "Status",
  sortable: true,
  width: 100,
  render: (value: string) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px", // gap-2 = 0.5rem
      }}
    >
      {getStatusIcon(value)}
      <span
        style={{
          color:
            value === "Active"
              ? "#4ade80" // text-green-400
              : value === "Inactive"
              ? "#9ca3af" // text-gray-400
              : value === "Pending"
              ? "#facc15" // text-yellow-400
              : "#60a5fa", // text-blue-400
        }}
      >
        {value}
      </span>
    </div>
  ),
},
    {
      key: "teams",
      label: "Teams",
      width: 150,
      render: (value: string[], user: User) => (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 2).map((team) => (
            <Badge key={team} variant="secondary" className="text-xs">
              {team}
            </Badge>
          ))}
          {value.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{value.length - 2}
            </Badge>
          )}
        </div>
      )
    },
    {
      key: "lastActive",
      label: "Last Active",
      sortable: true,
      width: 120,
      render: (value: string, user: User) => (
        <span className="text-slate-400 text-sm">
          {formatLastActive(value, user.lastActiveDate)}
        </span>
      )
    },
    {
      key: "twoFactorEnabled",
      label: "2FA",
      width: 80,
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"} className="text-xs">
          {value ? "Enabled" : "Disabled"}
        </Badge>
      )
    },
    {
    key: "viewAccess",
    label: "View Access",
    width: 200,
    render: (value: any, user: User) => {
      // Map roles to access levels
      const roleAccessMap: Record<string, string> = {
        Owner: "Full Access",
        Admin: "Full Access",
        Member: "Limited Access",
        Guest: "View Only",
      };

      // Get the access level based on the user's role
      const accessLevel = roleAccessMap[user.role] || "Unknown Access";

      return (
        <div>
          {user.permissions.map((permission) => (
            <div key={permission.resource}>
              {permission.resource.charAt(0).toUpperCase() +
              permission.resource.slice(1)}{" "}
            View ({accessLevel})
            </div>
          ))}
        </div>
      );
    },
  },
  
    {
      key: "actions",
      label: "Actions",
      width: 50,
      render: (value: any, user: User) => (
       <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button
      variant="ghost"
      size="sm"
      style={{
        width: "2rem", // w-8
        height: "2rem", // h-8
        padding: "0",
      }}
    >
      <MoreHorizontal style={{ width: "1rem", height: "1rem" }} />
    </Button>
  </DropdownMenuTrigger>

  <DropdownMenuContent
    align="end"
    style={{
      backgroundColor: "rgba(30,41,59,0.95)", // bg-slate-800/95
      backdropFilter: "blur(12px)", // backdrop-blur-xl
      border: "1px solid rgba(51,65,85,0.5)", // border-slate-700/50
    }}
  >
    <DropdownMenuItem
      onClick={() => handleRowSelect(user)}
      style={{
        color: "#f1f5f9", // text-slate-100
        display: "flex",
        alignItems: "center",
        padding: "0.5rem 0.75rem",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(51,65,85,0.5)"; // hover:bg-slate-700/50
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <Eye style={{ width: "1rem", height: "1rem", marginRight: "0.5rem" }} />
      View Profile
    </DropdownMenuItem>

    <DropdownMenuItem
      style={{
        color: "#f1f5f9",
        display: "flex",
        alignItems: "center",
        padding: "0.5rem 0.75rem",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(51,65,85,0.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <Mail style={{ width: "1rem", height: "1rem", marginRight: "0.5rem" }} />
      Send Message
    </DropdownMenuItem>
           <DropdownMenuSeparator
  style={{
    backgroundColor: "rgba(51,65,85,0.5)", // bg-slate-700/50
    height: "1px",
    margin: "0.25rem 0",
  }}
/>

<DropdownMenuItem
  onClick={() => {
    setUsers(
      users.map((u) =>
        u.id === user.id
          ? {
              ...u,
              status:
                user.status === "Active"
                  ? ("Inactive" as const)
                  : ("Active" as const),
            }
          : u
      )
    );
    toast.success(
      `User ${user.status === "Active" ? "deactivated" : "activated"}`
    );
  }}
  style={{
    color: "#f1f5f9", // text-slate-100
    display: "flex",
    alignItems: "center",
    padding: "0.5rem 0.75rem",
    cursor: "pointer",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = "rgba(51,65,85,0.5)"; // hover:bg-slate-700/50
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = "transparent";
  }}
>
  {user.status === "Active" ? (
    <UserX style={{ width: "1rem", height: "1rem", marginRight: "0.5rem" }} />
  ) : (
    <UserCheck style={{ width: "1rem", height: "1rem", marginRight: "0.5rem" }} />
  )}
  {user.status === "Active" ? "Deactivate" : "Activate"}
</DropdownMenuItem>

<DropdownMenuItem
  onClick={() => {
    setUsers(users.filter((u) => u.id !== user.id));
    toast.success("User deleted");
  }}
  style={{
    color: "#f87171", // text-red-400
    display: "flex",
    alignItems: "center",
    padding: "0.5rem 0.75rem",
    cursor: "pointer",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.2)"; // hover:bg-red-500/20
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = "transparent";
  }}
>
  <Trash2 style={{ width: "1rem", height: "1rem", marginRight: "0.5rem" }} />
  Delete User
</DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    
    return users.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.teams.some(team => team.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [users, searchQuery]);

  /**
   * User Invitation Component
   */
  const UserInviteForm = () => {
  const [inviteData, setInviteData] = useState<UserInvitation>({
    email: "",
    role: "Member",
    teams: [],
    message: "",
    expiresIn: 7,
  });

  const [emailError, setEmailError] = useState<string | null>(null);

  // Email validation regex
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleInvite = async () => {
    console.log("Send Invitation button clicked"); // Debugging
    if (!emailPattern.test(inviteData.email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setEmailError(null);

    try {
      const requestBody = {
        email: inviteData.email,
        role: inviteData.role,
        teams: inviteData.teams,
        message: inviteData.message,
        appLink: "https://your-app-link.com", // Replace with your app link
      };

      console.log("Request body:", requestBody); // Debugging

      const response = await fetch(`${import.meta.env.VITE_API_URL}/send-invitation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("API Response:", response); // Debugging

      if (response.ok) {
        toast.success(`Invitation sent to ${inviteData.email}`);
        setInviteData({
          email: "",
          role: "Member",
          teams: [],
          message: "",
          expiresIn: 7,
        });
        setIsInviteDialogOpen(false);
      } else {
        const errorData = await response.json();
        toast.error(`Failed to send invitation: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("An error occurred while sending the invitation.");
    }
  };

  return (
    <div className="space-y-6">
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          value={inviteData.email}
          onChange={(e) =>
            setInviteData({ ...inviteData, email: e.target.value })
          }
          placeholder="Enter email address"
          style={{
            backgroundColor: "rgba(15,23,42,0.5)", // bg-slate-900/50
            border: "1px solid rgba(51,65,85,0.5)", // border-slate-700/50
            color: "#f1f5f9", // text-slate-100
            padding: "0.5rem 0.75rem",
            borderRadius: "0.375rem",
          }}
        />
        {emailError && (
          <span className="text-red-500 text-sm">{emailError}</span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Label htmlFor="role">Role *</Label>
        <Select
          value={inviteData.role}
          onValueChange={(value: any) =>
            setInviteData({ ...inviteData, role: value })
          }
        >
          <SelectTrigger
            style={{
              backgroundColor: "rgba(15,23,42,0.5)", // bg-slate-900/50
              border: "1px solid rgba(51,65,85,0.5)", // border-slate-700/50
              color: "#f1f5f9", // text-slate-100
              padding: "0.5rem 0.75rem",
              borderRadius: "0.375rem",
            }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            style={{
              backgroundColor: "rgba(30,41,59,0.95)", // bg-slate-800/95
              backdropFilter: "blur(12px)", // backdrop-blur-xl
              border: "1px solid rgba(51,65,85,0.5)", // border-slate-700/50
              borderRadius: "0.375rem",
              padding: "0.25rem",
            }}
          >
            <SelectItem value="Guest">Guest</SelectItem>
            <SelectItem value="Member">Member</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleInvite}
          disabled={!inviteData.email}
          className="flex-1"
        >
          <Send className="w-4 h-4 mr-2" />
          Send Invitation
        </Button>
        <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

  /**
   * User Profile Component
   */
  const UserProfile = ({ user }: { user: User }) => {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar
  style={{
    width: "4rem",  // w-16
    height: "4rem", // h-16
    borderRadius: "9999px", // fully rounded
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  }}
>
  <AvatarImage
    src={user.avatar}
    style={{
      width: "100%",
      height: "100%",
      objectFit: "cover",
    }}
  />
  <AvatarFallback
    style={{
      background: "linear-gradient(to right, #3b82f6, #8b5cf6)", // from-blue-500 to-purple-600
      color: "#ffffff",
      fontSize: "1.125rem", // text-lg
      fontWeight: 500, // font-medium
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
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
  <h3
    style={{
      fontSize: "1.25rem", // text-xl
      fontWeight: 600,     // font-semibold
      color: "#f8fafc",    // text-slate-100
      margin: 0,
    }}
  >
    {user.name}
  </h3>
  <p
    style={{
      color: "#94a3b8",   // text-slate-400
      margin: "0.25rem 0 0 0",
    }}
  >
    {user.title || "No title"}
  </p>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "0.5rem", // gap-2
      marginTop: "0.25rem", // mt-1
    }}
  >
    {getRoleIcon(user.role)}
    <span
      style={{
        fontSize: "0.875rem", // text-sm
        color: "#d1d5db",    // text-slate-300
      }}
    >
      {user.role}
    </span>
  </div>
</div>

        </div>

        <Tabs defaultValue="details" className="w-full">
         <TabsList
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    width: "100%",
    backgroundColor: "rgba(30, 41, 59, 0.5)", // bg-slate-800/50
  }}
>
  <TabsTrigger
    value="details"
    style={{
      color: "#e5e7eb", // text-slate-200
    }}
  >
    Details
  </TabsTrigger>
  <TabsTrigger
    value="permissions"
    style={{
      color: "#e5e7eb",
    }}
  >
    Permissions
  </TabsTrigger>
  <TabsTrigger
    value="activity"
    style={{
      color: "#e5e7eb",
    }}
  >
    Activity
  </TabsTrigger>
</TabsList>

          
         <TabsContent value="details" style={{ display: "block", gap: "1rem" }}> {/* space-y-4 */}
  {/* Contact Information Card */}
  <Card
    style={{
      backgroundColor: "rgba(30,41,59,0.3)", // bg-slate-800/30
      border: "1px solid rgba(51,65,85,0.5)", // border-slate-700/50
      padding: "0.5rem",
      borderRadius: "0.5rem",
    }}
  >
    <CardHeader>
      <CardTitle style={{ color: "#f8fafc" }}>Contact Information</CardTitle> {/* text-slate-100 */}
    </CardHeader>
    <CardContent style={{ display: "grid", gap: "0.75rem" }}> {/* space-y-3 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
        <div>
          <Label style={{ color: "#cbd5e1" }}>Email</Label> {/* text-slate-300 */}
          <p style={{ color: "#f8fafc" }}>{user.email}</p>
        </div>
        <div>
          <Label style={{ color: "#cbd5e1" }}>Phone</Label>
          <p style={{ color: "#f8fafc" }}>{user.phone || "Not provided"}</p>
        </div>
        <div>
          <Label style={{ color: "#cbd5e1" }}>Location</Label>
          <p style={{ color: "#f8fafc" }}>{user.location || "Not provided"}</p>
        </div>
        <div>
          <Label style={{ color: "#cbd5e1" }}>Timezone</Label>
          <p style={{ color: "#f8fafc" }}>{user.timezone || "Not provided"}</p>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Work Information Card */}
  <Card
    style={{
      backgroundColor: "rgba(30,41,59,0.3)",
      border: "1px solid rgba(51,65,85,0.5)",
      padding: "0.5rem",
      borderRadius: "0.5rem",
    }}
  >
    <CardHeader>
      <CardTitle style={{ color: "#f8fafc" }}>Work Information</CardTitle>
    </CardHeader>
    <CardContent style={{ display: "grid", gap: "0.75rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
        <div>
          <Label style={{ color: "#cbd5e1" }}>Department</Label>
          <p style={{ color: "#f8fafc" }}>{user.department || "Not assigned"}</p>
        </div>
        <div>
          <Label style={{ color: "#cbd5e1" }}>Joined Date</Label>
          <p style={{ color: "#f8fafc" }}>{user.joinedDate}</p>
        </div>
      </div>
      <div>
        <Label style={{ color: "#cbd5e1" }}>Teams</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
          {user.teams.map((team) => (
            <Badge key={team} variant="secondary">{team}</Badge>
          ))}
        </div>
      </div>
      {user.invitedBy && (
        <div>
          <Label style={{ color: "#cbd5e1" }}>Invited By</Label>
          <p style={{ color: "#f8fafc" }}>{user.invitedBy}</p>
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>

          
        <TabsContent value="permissions" style={{ display: "block", gap: "1rem" }}> {/* space-y-4 */}
  <Card
    style={{
      backgroundColor: "rgba(30,41,59,0.3)", // bg-slate-800/30
      border: "1px solid rgba(51,65,85,0.5)", // border-slate-700/50
      borderRadius: "0.5rem",
      padding: "0.5rem",
    }}
  >
    <CardHeader>
      <CardTitle style={{ color: "#f8fafc" }}>Access Permissions</CardTitle> {/* text-slate-100 */}
    </CardHeader>
    <CardContent>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}> {/* space-y-3 */}
        {user.permissions.map((permission, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.75rem",
              backgroundColor: "rgba(15,23,43,0.3)", // bg-slate-900/30
              borderRadius: "0.5rem",
            }}
          >
            <div>
              <p style={{ fontWeight: 500, color: "#f8fafc", textTransform: "capitalize" }}>
                {permission.resource}
              </p>
              <p style={{ fontSize: "0.875rem", color: "#cbd5e1" }}>
                {permission.actions.join(", ")}
              </p>
            </div>
            <Badge
              variant="outline"
              style={{
                padding: "0.25rem 0.5rem",
                border: "1px solid #cbd5e1",
                borderRadius: "0.25rem",
                fontSize: "0.75rem",
                color: "#f8fafc",
              }}
            >
              {permission.actions.length} permissions
            </Badge>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
</TabsContent>

          
       <TabsContent value="activity" style={{ display: "block", gap: "1rem" }}> {/* space-y-4 */}
  <Card
    style={{
      backgroundColor: "rgba(30,41,59,0.3)", // bg-slate-800/30
      border: "1px solid rgba(51,65,85,0.5)", // border-slate-700/50
      borderRadius: "0.5rem",
      padding: "0.5rem",
    }}
  >
    <CardHeader>
      <CardTitle style={{ color: "#f8fafc" }}>Recent Activity</CardTitle>
    </CardHeader>
    <CardContent>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}> {/* space-y-3 */}
        {/* Last Active */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.75rem",
            backgroundColor: "rgba(15,23,43,0.3)", // bg-slate-900/30
            borderRadius: "0.5rem",
          }}
        >
          <div
            style={{
              width: "0.5rem", // w-2
              height: "0.5rem", // h-2
              backgroundColor: "#22c55e", // green-500
              borderRadius: "50%",
            }}
          ></div>
          <div>
            <p style={{ color: "#f8fafc" }}>
              Last active: {formatLastActive(user.lastActive, user.lastActiveDate)}
            </p>
            <p style={{ fontSize: "0.875rem", color: "#cbd5e1" }}>
              Status: {user.status}
            </p>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.75rem",
            backgroundColor: "rgba(15,23,43,0.3)", // bg-slate-900/30
            borderRadius: "0.5rem",
          }}
        >
          <Settings style={{ width: "1rem", height: "1rem", color: "#60a5fa" }} /> {/* text-blue-400 */}
          <div>
            <p style={{ color: "#f8fafc" }}>Two-Factor Authentication</p>
            <p style={{ fontSize: "0.875rem", color: "#cbd5e1" }}>
              {user.twoFactorEnabled ? "Enabled" : "Disabled"}
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</TabsContent>

        </Tabs>
      </div>
    );
  };

  // Update users when data prop changes
  useEffect(() => {
    setUsers(data);
  }, [data]);

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
  {/* Title Section */}
  <div>
    <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#f8fafc" }}>User Management</h1>
    <p style={{ color: "#94a3b8", marginTop: "0.25rem" }}>
      Manage team members, roles, and permissions
    </p>
  </div>

  {/* Actions Section */}
  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
    {selectedUsers.length > 0 && (
      <DropdownMenu open={isBulkActionOpen} onOpenChange={setIsBulkActionOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.25rem 0.5rem",
              cursor: "pointer",
            }}
          >
            <Users style={{ width: "1rem", height: "1rem" }} />
            {selectedUsers.length} selected
            <ChevronDown style={{ width: "1rem", height: "1rem" }} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          style={{
            backgroundColor: "rgba(30,41,59,0.95)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(51,65,85,0.5)",
            borderRadius: "0.375rem",
          }}
        >
          <DropdownMenuItem
            onClick={() => executeBulkAction("activate")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#f8fafc",
              padding: "0.5rem",
              cursor: "pointer",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(51,65,85,0.3)")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <UserCheck style={{ width: "1rem", height: "1rem" }} />
            Activate Users
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => executeBulkAction("deactivate")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#f8fafc",
              padding: "0.5rem",
              cursor: "pointer",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(51,65,85,0.3)")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <UserX style={{ width: "1rem", height: "1rem" }} />
            Deactivate Users
          </DropdownMenuItem>

          <DropdownMenuSeparator style={{ backgroundColor: "rgba(51,65,85,0.5)", height: "1px" }} />

          <DropdownMenuItem
            onClick={() => executeBulkAction("make-admin")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#f8fafc",
              padding: "0.5rem",
              cursor: "pointer",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(51,65,85,0.3)")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <Shield style={{ width: "1rem", height: "1rem" }} />
            Make Admin
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => executeBulkAction("make-member")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#f8fafc",
              padding: "0.5rem",
              cursor: "pointer",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(51,65,85,0.3)")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <Users style={{ width: "1rem", height: "1rem" }} />
            Make Member
          </DropdownMenuItem>

          <DropdownMenuSeparator style={{ backgroundColor: "rgba(51,65,85,0.5)", height: "1px" }} />

          <DropdownMenuItem
            onClick={() => executeBulkAction("delete")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#f87171",
              padding: "0.5rem",
              cursor: "pointer",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(248,113,113,0.2)")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <Trash2 style={{ width: "1rem", height: "1rem" }} />
            Delete Users
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )}

    <Button
      onClick={() => setIsInviteDialogOpen(true)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.25rem 0.5rem",
        cursor: "pointer",
      }}
    >
      <UserPlus style={{ width: "1rem", height: "1rem" }} />
      Invite User
    </Button>
  </div>
</div>


      {/* Stats Cards */}
    <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "1rem",
    // For responsive 4 columns on medium screens, you may use a media query in CSS
  }}
>
  {/* Total Users Card */}
  <Card style={{ backgroundColor: "rgba(30,41,59,0.3)", border: "1px solid rgba(51,65,85,0.5)" }}>
    <CardContent style={{ padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "0.875rem", color: "#94a3b8" }}>Total Users</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 600, color: "#f8fafc" }}>{users.length}</p>
        </div>
        <Users style={{ width: "2rem", height: "2rem", color: "#60a5fa" }} />
      </div>
    </CardContent>
  </Card>

  {/* Active Users Card */}
  <Card style={{ backgroundColor: "rgba(30,41,59,0.3)", border: "1px solid rgba(51,65,85,0.5)" }}>
    <CardContent style={{ padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "0.875rem", color: "#94a3b8" }}>Active Users</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 600, color: "#f8fafc" }}>
            {users.filter(u => u.status === "Active").length}
          </p>
        </div>
        <UserCheck style={{ width: "2rem", height: "2rem", color: "#4ade80" }} />
      </div>
    </CardContent>
  </Card>

  {/* Pending Invites Card */}
  <Card style={{ backgroundColor: "rgba(30,41,59,0.3)", border: "1px solid rgba(51,65,85,0.5)" }}>
    <CardContent style={{ padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "0.875rem", color: "#94a3b8" }}>Pending Invites</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 600, color: "#f8fafc" }}>
            {users.filter(u => u.status === "Invited" || u.status === "Pending").length}
          </p>
        </div>
        <Mail style={{ width: "2rem", height: "2rem", color: "#facc15" }} />
      </div>
    </CardContent>
  </Card>

  {/* Admins Card */}
  <Card style={{ backgroundColor: "rgba(30,41,59,0.3)", border: "1px solid rgba(51,65,85,0.5)" }}>
    <CardContent style={{ padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "0.875rem", color: "#94a3b8" }}>Admins</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 600, color: "#f8fafc" }}>
            {users.filter(u => u.role === "Admin" || u.role === "Owner").length}
          </p>
        </div>
        <Shield style={{ width: "2rem", height: "2rem", color: "#a78bfa" }} />
      </div>
    </CardContent>
  </Card>
</div>


      {/* Search and Filter Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
  {/* Search Input */}
  <div style={{ position: "relative", flex: 1, maxWidth: "24rem" }}>
    <Search
      style={{
        position: "absolute",
        left: "0.75rem",
        top: "50%",
        transform: "translateY(-50%)",
        width: "1rem",
        height: "1rem",
        color: "#94a3b8",
      }}
    />
    <Input
      placeholder="Search users..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      style={{
        paddingLeft: "2.5rem",
        width: "100%",
        backgroundColor: "rgba(30,41,59,0.5)",
        border: "1px solid rgba(51,65,85,0.5)",
        color: "#f8fafc",
      }}
    />
  </div>

  {/* Select All Checkbox */}
  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
    <Checkbox
      checked={selectedUsers.length === users.length && users.length > 0}
      onCheckedChange={handleSelectAll}
    />
    <Label style={{ fontSize: "0.875rem", color: "#cbd5e1" }}>Select All</Label>
  </div>
</div>


      {/* User Table */}
      <ClickUpListView
        viewType="users"
        title=""
        data={filteredUsers}
        columns={columns}
        onRowSelect={handleRowSelect}
        filterConfigs={getFilterConfigs()}
        hideHeader={true}
        
      />

      {/* Invite User Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
  <DialogContent
    style={{
      maxWidth: "32rem", // equivalent to sm:max-w-lg
      backgroundColor: "rgba(30,41,59,0.95)", // bg-slate-800/95
      backdropFilter: "blur(10px)", // backdrop-blur-xl
      border: "1px solid rgba(51,65,85,0.5)", // border-slate-700/50
      color: "#f1f5f9", // text-slate-100
      padding: "1rem",
      borderRadius: "0.5rem",
    }}
  >
    <DialogHeader>
      <DialogTitle
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "#f1f5f9",
        }}
      >
        <UserPlus style={{ width: "1.25rem", height: "1.25rem" }} />
        Invite New User
      </DialogTitle>
    </DialogHeader>
    <UserInviteForm />
  </DialogContent>
</Dialog>


      {/* User Profile Dialog */}
     <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
  <DialogContent
    style={{
      maxWidth: "42rem", // sm:max-w-2xl
      backgroundColor: "rgba(30,41,59,0.95)", // bg-slate-800/95
      backdropFilter: "blur(10px)", // backdrop-blur-xl
      border: "1px solid rgba(51,65,85,0.5)", // border-slate-700/50
      color: "#f1f5f9", // text-slate-100
      padding: "1rem",
      borderRadius: "0.5rem",
    }}
  >
    <DialogHeader>
      <DialogTitle style={{ color: "#f1f5f9" }}>
        User Profile
      </DialogTitle>
    </DialogHeader>
    {selectedUser && <UserProfile user={selectedUser} />}
  </DialogContent>
</Dialog>

    </div>
  );
}