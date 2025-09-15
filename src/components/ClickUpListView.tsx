import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "./ui/dropdown-menu";
import { 
  Search, 
  Plus, 
  Filter, 
  EyeOff, 
  Settings2, 
  Download, 
  ChevronDown, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
  Table as TableIcon,
  LayoutGrid,
  List
} from "lucide-react";

interface ListItem {
  id: string;
  [key: string]: any;
}

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, item: ListItem) => React.ReactNode;
}

interface FilterConfig {
  key: string;
  label: string;
  type: "select" | "multiselect" | "text" | "date";
  options?: string[];
}

interface ViewConfig {
  id: string;
  name: string;
  filters?: Record<string, any>;
  groupBy?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

interface ClickUpListViewProps {
  title: string;
  data: ListItem[];
  columns: Column[];
  filterConfigs?: FilterConfig[];
  views?: ViewConfig[];
  onRowSelect?: (item: ListItem) => void;
  onAdd?: () => void;
  onEdit?: (item: ListItem) => void;
  onDelete?: (item: ListItem) => void;
  searchKey?: string;
}

export function ClickUpListView({
  title,
  data,
  columns,
  filterConfigs = [],
  views = [],
  onRowSelect,
  onAdd,
  onEdit,
  onDelete,
  searchKey = "name"
}: ClickUpListViewProps) {
  const [activeView, setActiveView] = useState(views[0]?.id || "all");
  const [activeTab, setActiveTab] = useState("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<string>("none");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [groupBy, setGroupBy] = useState<string>("none");
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Default views if none provided
  const defaultViews: ViewConfig[] = [
    { id: "all", name: "All" },
    { id: "active", name: "Active", filters: { status: "Active" } },
    { id: "inactive", name: "Inactive", filters: { status: "Inactive" } },
    { id: "recent", name: "Recent", sortBy: "joinedDate", sortDirection: "desc" },
  ];

  const finalViews = views.length > 0 ? views : defaultViews;

  // Apply current view configuration
  const currentView = finalViews.find(v => v.id === activeView) || finalViews[0];
  const activeFilters = { ...filters, ...currentView.filters };
  const activeSortBy = sortBy !== "none" ? sortBy : currentView.sortBy || "none";
  const activeSortDirection = sortDirection || currentView.sortDirection || "asc";
  const activeGroupBy = groupBy !== "none" ? groupBy : currentView.groupBy || "none";

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data;

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item[searchKey]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && value !== "all") {
        if (Array.isArray(value)) {
          filtered = filtered.filter(item => value.includes(item[key]));
        } else {
          filtered = filtered.filter(item => item[key] === value);
        }
      }
    });

    // Apply sorting
    if (activeSortBy && activeSortBy !== "none") {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[activeSortBy];
        const bVal = b[activeSortBy];
        const direction = activeSortDirection === "asc" ? 1 : -1;
        
        if (aVal < bVal) return -1 * direction;
        if (aVal > bVal) return 1 * direction;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, searchKey, activeFilters, activeSortBy, activeSortDirection]);

  // Group data if groupBy is set
  const groupedData = useMemo(() => {
    if (!activeGroupBy || activeGroupBy === "none") return { "": processedData };
    
    return processedData.reduce((groups, item) => {
      const groupValue = item[activeGroupBy] || "Ungrouped";
      if (!groups[groupValue]) groups[groupValue] = [];
      groups[groupValue].push(item);
      return groups;
    }, {} as Record<string, ListItem[]>);
  }, [processedData, activeGroupBy]);

  const visibleColumns = columns.filter(col => !hiddenColumns.includes(col.key));

  const handleSort = (columnKey: string) => {
    if (activeSortBy === columnKey) {
      setSortDirection(activeSortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(columnKey);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (activeSortBy !== columnKey || activeSortBy === "none") return <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-50" />;
    return activeSortDirection === "asc" ? 
      <ArrowUp className="w-4 h-4 text-primary" /> : 
      <ArrowDown className="w-4 h-4 text-primary" />;
  };

  const handleRowSelection = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedRows([...selectedRows, itemId]);
    } else {
      setSelectedRows(selectedRows.filter(id => id !== itemId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(processedData.map(item => item.id));
    } else {
      setSelectedRows([]);
    }
  };

  const renderTableContent = () => (
    <Table>
      <TableHeader>
        <TableRow className="border-b hover:bg-transparent">
          <TableHead className="w-12">
            <Checkbox
              checked={selectedRows.length === processedData.length && processedData.length > 0}
              onCheckedChange={handleSelectAll}
            />
          </TableHead>
          {visibleColumns.map((column) => (
            <TableHead 
              key={column.key} 
              className={`${column.sortable ? 'cursor-pointer group hover:bg-muted/30' : ''} font-medium text-muted-foreground`}
              onClick={() => column.sortable && handleSort(column.key)}
            >
              <div className="flex items-center gap-2">
                {column.label}
                {column.sortable && getSortIcon(column.key)}
              </div>
            </TableHead>
          ))}
          <TableHead className="w-16">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.entries(groupedData).map(([groupName, items]) => (
          <React.Fragment key={groupName}>
            {activeGroupBy && activeGroupBy !== "none" && (
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableCell colSpan={visibleColumns.length + 2} className="font-medium text-sm py-2">
                  {groupName} ({items.length})
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow 
                key={item.id}
                className="cursor-pointer hover:bg-muted/30 border-b border-border/50"
                onClick={() => onRowSelect?.(item)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedRows.includes(item.id)}
                    onCheckedChange={(checked) => handleRowSelection(item.id, checked as boolean)}
                  />
                </TableCell>
                {visibleColumns.map((column) => (
                  <TableCell key={column.key} className="py-3">
                    {column.render ? column.render(item[column.key], item) : item[column.key]}
                  </TableCell>
                ))}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(item)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onDelete(item)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your team members and their account permissions here.
          </p>
        </div>
      </div>

      {/* Views Tabs */}
      <div className="flex items-center gap-4 border-b">
        <div className="flex items-center gap-1">
          {finalViews.map((view) => (
            <Button
              key={view.id}
              variant={activeView === view.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView(view.id)}
              className={`h-8 px-3 rounded-md ${
                activeView === view.id 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {view.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b bg-muted/20 rounded-t-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between">
              <TabsList className="grid grid-cols-3 w-fit">
                <TabsTrigger value="table" className="flex items-center gap-2">
                  <TableIcon className="w-4 h-4" />
                  Table
                </TabsTrigger>
                <TabsTrigger value="board" className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  Board
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <List className="w-4 h-4" />
                  List
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                {onAdd && (
                  <Button size="sm" onClick={onAdd} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add User
                  </Button>
                )}
              </div>
            </div>

            {/* Filters and Controls */}
            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center gap-2">
                {/* Role Filter */}
                <Select value={filters.role || "all"} onValueChange={(value) => setFilters({...filters, role: value === "all" ? undefined : value})}>
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={filters.status || "all"} onValueChange={(value) => setFilters({...filters, status: value === "all" ? undefined : value})}>
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>

                {/* Add Filter Button */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-8">
                      <Filter className="w-4 h-4" />
                      Add filter
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="start">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Group by</label>
                        <Select value={groupBy} onValueChange={setGroupBy}>
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No grouping</SelectItem>
                            <SelectItem value="role">Role</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                            <SelectItem value="country">Country</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Sort by</label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No sorting</SelectItem>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="joinedDate">Joined Date</SelectItem>
                            <SelectItem value="lastActive">Last Active</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-64 h-8"
                  />
                </div>

                <Button variant="outline" size="sm" className="gap-2 h-8">
                  <EyeOff className="w-4 h-4" />
                  Hide
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-8">
                      <Settings2 className="w-4 h-4" />
                      Customize
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="end">
                    <div className="space-y-3">
                      <div className="font-medium">Show/Hide Columns</div>
                      {columns.map((column) => (
                        <div key={column.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`column-${column.key}`}
                            checked={!hiddenColumns.includes(column.key)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setHiddenColumns(hiddenColumns.filter(c => c !== column.key));
                              } else {
                                setHiddenColumns([...hiddenColumns, column.key]);
                              }
                            }}
                          />
                          <label htmlFor={`column-${column.key}`} className="text-sm">
                            {column.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <TabsContent value="table" className="mt-0">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  {renderTableContent()}
                </div>
              </CardContent>
            </TabsContent>

            <TabsContent value="board" className="mt-0">
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  Board view coming soon...
                </div>
              </CardContent>
            </TabsContent>

            <TabsContent value="list" className="mt-0">
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  List view coming soon...
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>

      {/* Results Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          {selectedRows.length > 0 ? (
            <span>{selectedRows.length} selected</span>
          ) : (
            <span>{processedData.length} results</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {Object.keys(activeFilters).length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setFilters({})}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}