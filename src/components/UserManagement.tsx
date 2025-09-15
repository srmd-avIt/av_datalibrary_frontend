import { useState } from "react";
import { ClickUpListView } from "./ClickUpListView";
import { Badge } from "./ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Crown, Shield, Eye, CircleDot } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive" | "Pending";
  avatar?: string;
  joinedDate: string;
  lastActive: string;
  permissions: string[];
  auth: string;
}

const mockUsers: User[] = [
  {
    id: "1",
    name: "Liam Smith",
    email: "smith@example.com",
    role: "Project Manager",
    status: "Active",
    joinedDate: "24 Jun 2024, 9:23 pm",
    lastActive: "2024-12-10",
    permissions: ["read", "write", "delete", "admin"],
    auth: "Enabled"
  },
  {
    id: "2",
    name: "Noah Anderson",
    email: "anderson@example.com",
    role: "UX Designer",
    status: "Active",
    joinedDate: "15 Mar 2023, 2:45 pm",
    lastActive: "2024-12-09",
    permissions: ["read", "write"],
    auth: "Enabled"
  },
  {
    id: "3",
    name: "Isabella Garcia",
    email: "garcia@example.com",
    role: "Front-End Developer",
    status: "Inactive",
    joinedDate: "10 Apr 2022, 11:30 am",
    lastActive: "2024-12-01",
    permissions: ["read"],
    auth: "Enabled"
  },
  {
    id: "4",
    name: "William Clark",
    email: "clark@example.com",
    role: "Product Owner",
    status: "Active",
    joinedDate: "28 Feb 2023, 6:15 pm",
    lastActive: "2024-12-08",
    permissions: ["read", "write"],
    auth: "Enabled"
  },
  {
    id: "5",
    name: "James Hart",
    email: "hart@example.com",
    role: "Business Analyst",
    status: "Active",
    joinedDate: "19 May 2023, 7:55 am",
    lastActive: "2024-12-07",
    permissions: ["read", "write"],
    auth: "Enabled"
  },
  {
    id: "6",
    name: "Benjamin Lewis",
    email: "lewis@example.com",
    role: "Data Analyst",
    status: "Active",
    joinedDate: "03 Jan 2024, 12:05 pm",
    lastActive: "2024-12-06",
    permissions: ["read", "write"],
    auth: "Enabled"
  },
  {
    id: "7",
    name: "Amelia Davis",
    email: "davis@example.com",
    role: "UX Designer",
    status: "Inactive",
    joinedDate: "21 Jul 2023, 8:40 pm",
    lastActive: "2024-11-15",
    permissions: ["read"],
    auth: "Enabled"
  },
  {
    id: "8",
    name: "Emma Johnson",
    email: "johnson@example.com",
    role: "UX Designer",
    status: "Active",
    joinedDate: "16 Sep 2023, 3:25 pm",
    lastActive: "2024-12-05",
    permissions: ["read", "write"],
    auth: "Enabled"
  },
  {
    id: "9",
    name: "Olivia Brown",
    email: "brown@example.com",
    role: "Marketing Specialist",
    status: "Active",
    joinedDate: "04 Nov 2022, 9:50 am",
    lastActive: "2024-12-04",
    permissions: ["read", "write"],
    auth: "Enabled"
  },
  {
    id: "10",
    name: "Ava Williams",
    email: "williams@example.com",
    role: "Software Engineer",
    status: "Active",
    joinedDate: "30 Dec 2023, 4:35 pm",
    lastActive: "2024-12-03",
    permissions: ["read", "write", "delete"],
    auth: "Enabled"
  },
  {
    id: "11",
    name: "Sophia Jones",
    email: "jones@example.com",
    role: "Front-End Developer",
    status: "Active",
    joinedDate: "05 Jun 2023, 7:10 pm",
    lastActive: "2024-12-02",
    permissions: ["read", "write"],
    auth: "Enabled"
  }
];

export function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active": return <CircleDot className="w-2 h-2 text-green-500 fill-current" />;
      case "Inactive": return <CircleDot className="w-2 h-2 text-red-500 fill-current" />;
      case "Pending": return <CircleDot className="w-2 h-2 text-yellow-500 fill-current" />;
      default: return <CircleDot className="w-2 h-2 text-gray-500 fill-current" />;
    }
  };

  const views = [
    { id: "all", name: "All" },
    { id: "active", name: "Active", filters: { status: "Active" } },
    { id: "inactive", name: "Inactive", filters: { status: "Inactive" } },
    { id: "managers", name: "Managers", filters: { role: "Manager" } },
    { id: "recent", name: "Recent", sortBy: "joinedDate", sortDirection: "desc" as const },
  ];

  const columns = [
    {
      key: "name",
      label: "Full name",
      sortable: true,
      render: (value: string, user: User) => (
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      render: (value: string) => (
        <span className="text-muted-foreground">{value}</span>
      )
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      filterable: true
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(value)}
          <span className={value === "Active" ? "text-green-700" : value === "Inactive" ? "text-red-700" : "text-yellow-700"}>
            {value}
          </span>
        </div>
      )
    },
    {
      key: "joinedDate",
      label: "Joined date",
      sortable: true
    },
    {
      key: "auth",
      label: "2F Auth",
      render: (value: string) => (
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          {value}
        </Badge>
      )
    }
  ];

  const handleAddUser = () => {
    setIsAddDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setUsers(users.filter(u => u.id !== user.id));
  };

  const UserForm = ({ user, onSave, onCancel }: { user?: User; onSave: (user: Partial<User>) => void; onCancel: () => void }) => {
    const [formData, setFormData] = useState({
      name: user?.name || "",
      email: user?.email || "",
      role: user?.role || "UX Designer",
      status: user?.status || "Active" as "Active" | "Inactive" | "Pending"
    });

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter full name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter email address"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={formData.role} onValueChange={(value: string) => setFormData({ ...formData, role: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Project Manager">Project Manager</SelectItem>
              <SelectItem value="UX Designer">UX Designer</SelectItem>
              <SelectItem value="Front-End Developer">Front-End Developer</SelectItem>
              <SelectItem value="Product Owner">Product Owner</SelectItem>
              <SelectItem value="Business Analyst">Business Analyst</SelectItem>
              <SelectItem value="Data Analyst">Data Analyst</SelectItem>
              <SelectItem value="Marketing Specialist">Marketing Specialist</SelectItem>
              <SelectItem value="Software Engineer">Software Engineer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value: "Active" | "Inactive" | "Pending") => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button onClick={() => onSave(formData)} className="flex-1">
            {user ? "Update User" : "Create User"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <ClickUpListView
        title="User management"
        data={users}
        columns={columns}
        views={views}
        searchKey="name"
        onRowSelect={(user) => console.log("Selected user:", user)}
        onAdd={handleAddUser}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
      />

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <UserForm
            onSave={(userData) => {
              const newUser: User = {
                id: Date.now().toString(),
                name: userData.name!,
                email: userData.email!,
                role: userData.role!,
                status: userData.status!,
                joinedDate: new Date().toLocaleDateString('en-US', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric', 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                }).replace(',', ','),
                lastActive: "Never",
                permissions: ["read", "write"],
                auth: "Enabled"
              };
              setUsers([...users, newUser]);
              setIsAddDialogOpen(false);
            }}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <UserForm
              user={selectedUser}
              onSave={(userData) => {
                setUsers(users.map(user =>
                  user.id === selectedUser.id
                    ? { ...user, ...userData }
                    : user
                ));
                setIsEditDialogOpen(false);
                setSelectedUser(null);
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedUser(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}