import React, { useState, useMemo, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

// --- UI Imports ---
import { Card, CardContent, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { 
  Search, Download, ArrowUpDown, ArrowUp, ArrowDown, Users, Table as TableIcon, 
  Calendar, Settings2, EyeOff, X, Funnel
} from "lucide-react";
import { AdvancedFiltersClickUp } from "./AdvancedFiltersClickUp";
import { TimelineView } from "./TimelineView";
import { Pagination } from "./ui/pagination";

// --- Interfaces ---
interface ListItem { 
  id: string | number; 
  date: string; // Add date to satisfy TimelineItem
  [key: string]: any; 
}
interface Column { key: string; label: string; sortable?: boolean; filterable?: boolean; render?: (value: any, item: ListItem) => React.ReactNode; }
interface FilterConfig { key: string; label: string; type: "text" | "select" | "date" | "number" | "checkbox"; options?: string[]; }
interface ViewConfig { id: string; name: string; filters?: Record<string, any>; groupBy?: string; sortBy?: string; sortDirection?: "asc" | "desc"; }
interface FilterGroup { id: string; rules: FilterRule[]; logic: "AND" | "OR"; }
interface FilterRule { id: string; field: string; operator: string; value: any; logic?: "AND" | "OR"; }

// --- API Response Type ---
interface ApiResponse {
  data: ListItem[];
  pagination: {
    totalPages: number;
    totalItems: number;
  };
}

// --- API Fetcher Function ---
const API_BASE_URL = import.meta.env.VITE_API_URL;

async function fetchDataFromApi({ apiEndpoint, page, limit, searchTerm, filters, sortBy, sortDirection, advancedFilters, dateRange }): Promise<ApiResponse> {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (searchTerm) params.append('search', searchTerm);
  if (sortBy && sortBy !== 'none') {
      params.append('sortBy', sortBy);
      params.append('sortDir', sortDirection);
  }
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "all") params.append(key, String(value));
  });
  if (advancedFilters.length > 0 && advancedFilters.some(g => g.rules.length > 0)) {
    params.append('advanced_filters', JSON.stringify(advancedFilters));
  }
  if (dateRange?.startDate) params.append('start_date', dateRange.startDate.toISOString());
  if (dateRange?.endDate) params.append('end_date', dateRange.endDate.toISOString());

  if (!API_BASE_URL) throw new Error("API URL not configured. Set VITE_API_URL in .env");
  
  const url = new URL(API_BASE_URL);
  url.pathname += apiEndpoint.startsWith('/') ? apiEndpoint : `/${apiEndpoint}`;
  url.search = params.toString();
  
  console.log("Requesting URL:", url.href);
  const response = await fetch(url.href);
  if (!response.ok) throw new Error(`API error: ${response.statusText} for URL: ${url.href}`);
  return response.json(); 
}

// --- Component Props ---
interface ClickUpListViewUpdatedProps {
  title: string;
  columns: Column[];
  apiEndpoint: string;
  filterConfigs?: FilterConfig[];
  views?: ViewConfig[];
  onRowSelect?: (item: ListItem) => void;
  idKey: string;
}

export function ClickUpListViewUpdated({
  title,
  columns,
  apiEndpoint,
  filterConfigs = [],
  views = [],
  onRowSelect,
  idKey
}: ClickUpListViewUpdatedProps) {
  // --- STATE MANAGEMENT ---
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("none");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [advancedFilters, setAdvancedFilters] = useState<FilterGroup[]>([]);
  const [activeView, setActiveView] = useState(views[0]?.id || "all");
  const [activeTab, setActiveTab] = useState("table");
  const [groupBy, setGroupBy] = useState<string>("none");
  const [groupDirection, setGroupDirection] = useState<"asc" | "desc">("asc");
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  
  // --- Timeline State ---
  const [timelineViewMode, setTimelineViewMode] = useState<"day" | "week" | "month" | "year">("month");
  const [timelineCurrentDate, setTimelineCurrentDate] = useState(new Date());

  const itemsPerPage = 50;

  const defaultViews: ViewConfig[] = [
    { id: "all", name: "All" },
    { id: "active", name: "Active", filters: { status: "Active" } },
    { id: "planned", name: "Planned", filters: { status: "Planned" } },
    { id: "completed", name: "Completed", filters: { status: "Completed" } }
  ];

  const finalViews = views.length > 0 ? views : defaultViews;

  const currentView = useMemo(() => finalViews.find(v => v.id === activeView) || finalViews[0], [finalViews, activeView]);
  const activeViewFilters = useMemo(() => currentView.filters || {}, [currentView]);
  const activeSortBy = sortBy !== "none" ? sortBy : currentView.sortBy || "none";
  const activeSortDirection = sortDirection || currentView.sortDirection || "asc";
  const activeGroupBy = groupBy !== "none" ? groupBy : currentView.groupBy || "none";

  const timelineDateRange = useMemo(() => {
    if (activeTab !== 'timeline') return null;
    let startDate, endDate;
    switch (timelineViewMode) {
        case 'day':
            startDate = startOfDay(timelineCurrentDate);
            endDate = endOfDay(timelineCurrentDate);
            break;
        case 'week':
            startDate = startOfWeek(timelineCurrentDate);
            endDate = endOfWeek(timelineCurrentDate);
            break;
        case 'month':
            startDate = startOfMonth(timelineCurrentDate);
            endDate = endOfMonth(timelineCurrentDate);
            break;
        case 'year':
            startDate = startOfYear(timelineCurrentDate);
            endDate = endOfYear(timelineCurrentDate);
            break;
    }
    return { startDate, endDate };
  }, [activeTab, timelineViewMode, timelineCurrentDate]);

  const { data: queryData, isLoading, error, isFetching } = useQuery<ApiResponse>({
    queryKey: [apiEndpoint, currentPage, searchTerm, JSON.stringify(activeViewFilters), JSON.stringify(advancedFilters), activeSortBy, activeSortDirection, JSON.stringify(timelineDateRange)],
    queryFn: () => fetchDataFromApi({
      apiEndpoint, page: currentPage, limit: itemsPerPage, searchTerm,
      filters: activeViewFilters, advancedFilters, sortBy: activeSortBy, sortDirection: activeSortDirection,
      dateRange: timelineDateRange
    }),
    placeholderData: keepPreviousData,
  });

  const items = queryData?.data || [];
  const pagination = queryData?.pagination || { totalPages: 1, totalItems: 0 };

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm, JSON.stringify(activeViewFilters), JSON.stringify(advancedFilters)]);
  
  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(columnKey);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (activeSortBy !== columnKey) return <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-50" />;
    return activeSortDirection === "asc" ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />;
  };

  const visibleColumns = useMemo(() => columns.filter(col => !hiddenColumns.includes(col.key)), [columns, hiddenColumns]);
  
  const groupedData: Record<string, ListItem[]> = useMemo(() => {
    if (!activeGroupBy || activeGroupBy === "none" || !items.length) return { "": items };
    
    const groups = items.reduce((acc, item) => {
      const groupValue = item[activeGroupBy] || "Ungrouped";
      if (!acc[groupValue]) acc[groupValue] = [];
      acc[groupValue].push(item);
      return acc;
    }, {} as Record<string, ListItem[]>);

    const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
      const direction = groupDirection === "asc" ? 1 : -1;
      if (a < b) return -1 * direction;
      if (a > b) return 1 * direction;
      return 0;
    });

    const sortedGroups: Record<string, ListItem[]> = {};
    sortedGroupKeys.forEach(key => {
      sortedGroups[key] = groups[key];
    });

    return sortedGroups;
  }, [items, activeGroupBy, groupDirection]);

  const getAvailableGroupByFields = () => {
    return columns
      .filter(col => col.filterable !== false)
      .map(col => ({ value: col.key, label: col.label }));
  };

  const getAvailableSortFields = () => {
    return columns
      .filter(col => col.sortable)
      .map(col => ({ value: col.key, label: col.label }));
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your {title.toLowerCase()} data with advanced filtering and views.
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
      <Card className="border-0 shadow-sm bg-card">
        <CardHeader className="p-6 border-b bg-muted/20 rounded-t-lg">
          <div className="flex items-center justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 w-fit">
                <TabsTrigger value="table" className="flex items-center gap-2">
                  <TableIcon className="w-4 h-4" />
                  Table
                </TabsTrigger>
                <TabsTrigger value="timeline" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Timeline
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 h-8">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 pt-4">
            <div className="flex items-center gap-2">
              {/* Advanced Filters */}
              <AdvancedFiltersClickUp
                filters={filterConfigs || []}
                onFiltersChange={setAdvancedFilters}
                data={items}
              />

              {/* Group By */}
              <div className="flex items-center gap-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-8">
                      <Users className="w-4 h-4" />
                      {groupBy !== "none" ? `Group: ${getAvailableGroupByFields().find(f => f.value === groupBy)?.label}` : "Group"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-3">
                      <div className="font-medium text-sm">Group by field</div>
                      <Select value={groupBy} onValueChange={setGroupBy}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No grouping</SelectItem>
                          {getAvailableGroupByFields().map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {groupBy !== "none" && (
                        <>
                          <div className="font-medium text-sm">Sort groups</div>
                          <Select value={groupDirection} onValueChange={(value: "asc" | "desc") => setGroupDirection(value)}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="asc">Ascending (A-Z)</SelectItem>
                              <SelectItem value="desc">Descending (Z-A)</SelectItem>
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                
                {groupBy !== "none" && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" 
                    onClick={() => setGroupBy("none")}
                    title="Clear grouping"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-1">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-36 h-8">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No sorting</SelectItem>
                    {getAvailableSortFields().map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        Sort by {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {sortBy !== "none" && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" 
                    onClick={() => setSortBy("none")}
                    title="Clear sorting"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {sortBy !== "none" && (
                <Select value={sortDirection} onValueChange={(value: "asc" | "desc") => setSortDirection(value)}>
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              )}
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

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-8">
                    <EyeOff className="w-4 h-4" />
                    Hide
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
        </CardHeader>

        <CardContent className="p-0">
          {activeTab === 'table' && (
            <div className="overflow-x-auto relative" style={{ maxHeight: '60vh' }}>
              { (isLoading && !isFetching) && <div className="p-8 text-center">Loading...</div> }
              { error && <div className="p-8 text-center text-red-500">Error: {(error as Error).message}</div> }
              { !isLoading && items.length === 0 && <div className="p-8 text-center">No results found.</div> }
              { items.length > 0 && 
                <div className={`transition-opacity duration-300 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
                  <Table className="min-w-full table-fixed">
                    <TableHeader>
                      <TableRow>
                        {visibleColumns.map((col, index) => (
                          <TableHead 
                            key={col.key} 
                            onClick={() => col.sortable && handleSort(col.key)} 
                            className={`${col.sortable ? 'cursor-pointer group' : ''} sticky top-0 z-10 bg-card/95 backdrop-blur-sm ${index === 0 ? 'left-0 z-20' : ''}`}
                          >
                            <div className="flex items-center gap-2 px-4 py-3">
                              {col.label}
                              {col.sortable && getSortIcon(col.key)}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(groupedData).map(([groupName, groupItems]) => (
                        <React.Fragment key={groupName}>
                          {activeGroupBy !== 'none' && (
                            <TableRow className="sticky top-12 z-[15]">
                              <TableCell colSpan={visibleColumns.length} className="bg-muted/90 backdrop-blur-sm font-semibold">
                                {groupName} ({groupItems.length})
                              </TableCell>
                            </TableRow>
                          )}
                          {groupItems.map(item => (
                            <TableRow key={item[idKey]} onClick={() => onRowSelect?.(item)} className="hover:bg-muted/50">
                              {visibleColumns.map((col, index) => (
                                <TableCell 
                                  key={col.key} 
                                  className={`${index === 0 ? 'sticky left-0 z-10 bg-card' : ''} border-b`}
                                >
                                  {col.render ? col.render(item[col.key], item) : String(item[col.key] ?? '')}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              }
            </div>
          )}
          {activeTab === 'timeline' && (
            <TimelineView 
              data={items.map(item => ({ ...item, id: String(item.id) }))} 
              onItemSelect={onRowSelect}
              viewMode={timelineViewMode}
              onViewModeChange={setTimelineViewMode}
              currentDate={timelineCurrentDate}
              onCurrentDateChange={setTimelineCurrentDate}
              isLoading={isFetching}
            />
          )}
        </CardContent>

        { !isLoading && items.length > 0 &&
          <div className="flex items-center justify-between text-sm text-muted-foreground p-6 border-t">
              <div>
                  <span>{pagination.totalItems} results</span>
              </div>
              <div className="flex items-center gap-4">
                  {(advancedFilters.some(group => group.rules.length > 0) || Object.keys(activeViewFilters).length > 0) && (
                      <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                          setAdvancedFilters([]);
                          setActiveView("all");
                      }}
                      className="text-muted-foreground hover:text-foreground"
                      >
                      Clear filters
                      </Button>
                  )}
                  <Pagination currentPage={currentPage} totalPages={pagination.totalPages} onPageChange={setCurrentPage} />
              </div>
          </div>
        }
      </Card>
    </div>
  );
}