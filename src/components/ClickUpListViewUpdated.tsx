// Main imports for React, TanStack Query, TanStack Table, DnD-kit, UI components, icons, and custom components
import React, { useState, useMemo, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import {
 useReactTable,
 getCoreRowModel,
 flexRender,
 ColumnDef,
  ColumnOrderState,
} from "@tanstack/react-table";
// DnD-kit for drag-and-drop column reordering
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

// UI components and icons
import { Card, CardContent, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { DraggableResizableTable } from "./DraggableResizableTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Search, Download, ArrowUpDown, ArrowUp, ArrowDown, Users, Table as TableIcon,
  Calendar, Settings2, EyeOff, X, Funnel, Loader2
} from "lucide-react";
import { AdvancedFiltersClickUp } from "./AdvancedFiltersClickUp";
import { TimelineView } from "./TimelineView";

// --- Interfaces ---
// ListItem: Represents a row of data
interface ListItem {
  id: string | number;
  date?: string;
  [key: string]: any;
}
// Column: Table column definition
interface Column { key: string; label: string; sortable?: boolean; filterable?: boolean; render?: (value: any, item: ListItem) => React.ReactNode; }
// FilterConfig: Used for advanced filtering UI
interface FilterConfig { key: string; label: string; type: "text" | "select" | "date" | "number" | "checkbox"; options?: string[]; }
// ViewConfig: Used for saved views (grouping, sorting, filters, etc.)
interface ViewConfig { id: string; name: string; filters?: Record<string, any>; groupBy?: string; sortBy?: string; sortDirection?: "asc" | "desc"; apiEndpoint?: string; }
// FilterGroup and FilterRule: Used for advanced filter logic
interface FilterGroup { id: string; rules: FilterRule[]; logic: "AND" | "OR"; }
interface FilterRule { id: string; field: string; operator: string; value: any; logic?: "AND" | "OR"; }

// --- API Response Type ---
// Structure of API response for paginated data
interface ApiResponse {
  data: ListItem[];
  pagination: {
    totalPages: number;
    totalItems: number;
  };
}

// --- API Fetcher Function ---
// Fetches data from the backend API with support for pagination, search, filters, and advanced filters
const API_BASE_URL = import.meta.env.VITE_API_URL;

async function fetchDataFromApi({
  apiEndpoint,
  page,
  limit,
  searchTerm,
  filters,
  advancedFilters,
}: {
  apiEndpoint: string;
  page: number;
  limit: number;
  searchTerm?: string;
  filters?: Record<string, any>;
  advancedFilters?: FilterGroup[];
}): Promise<ApiResponse> {
  // Build query params for API request
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (searchTerm) params.append("search", searchTerm);

  // Add simple filters
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== "all"
    ) {
      params.append(key, String(value));
    }
  });

  // Add advanced filters if present
  if (advancedFilters && advancedFilters.length > 0) {
    const sanitizedGroups = advancedFilters
      .map((group) => ({
        ...group,
        rules: group.rules.filter(
          (rule) =>
            rule.field &&
            rule.operator &&
            rule.value !== undefined &&
            rule.value !== null &&
            rule.value !== ""
        ),
      }))
      .filter((group) => group.rules.length > 0);

    if (sanitizedGroups.length > 0) {
      params.append("advanced_filters", JSON.stringify(sanitizedGroups));
    }
  }

  if (!API_BASE_URL)
    throw new Error("API URL not configured. Set VITE_API_URL in .env");

  // Build full API URL
  const url = new URL(API_BASE_URL);
  url.pathname += apiEndpoint.startsWith("/") ? apiEndpoint : `/${apiEndpoint}`;
  url.search = params.toString();

  // Fetch data from API
  const response = await fetch(url.href);
  if (!response.ok)
    throw new Error(
      `API error: ${response.statusText} for URL: ${url.href}`
    );
  return response.json();
}

// --- SimplePagination ---
// Pagination controls for navigating pages
function SimplePagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void; }) {
  const [jump, setJump] = useState<string>('');
  const go = (page: number) => { const p = Math.max(1, Math.min(Math.max(1, totalPages), Math.floor(Number(page) || 1))); if (p !== currentPage) onPageChange(p); };
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => go(1)} disabled={currentPage <= 1}>First</Button>
        <Button size="sm" variant="ghost" onClick={() => go(currentPage - 1)} disabled={currentPage <= 1}>Prev</Button>
      </div>
      <div className="text-sm">Page <strong>{currentPage}</strong> of <strong>{Math.max(1, totalPages)}</strong></div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => go(currentPage + 1)} disabled={currentPage >= Math.max(1, totalPages)}>Next</Button>
        <Button size="sm" variant="ghost" onClick={() => go(totalPages)} disabled={currentPage >= Math.max(1, totalPages)}>Last</Button>
      </div>
      <div className="ml-4 flex items-center gap-2">
        <Input type="number" min={1} max={Math.max(1, totalPages)} placeholder="Go to" value={jump} onChange={(e: any) => setJump(e.target.value)} onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { go(Number(jump)); setJump(''); } }} className="w-20 h-8" />
        <Button size="sm" onClick={() => { go(Number(jump)); setJump(''); }}>Go</Button>
      </div>
    </div>
  );
}

// --- Main Component ---
// This is the main list/table view component with filtering, sorting, grouping, column hiding, pagination, and timeline view
export function ClickUpListViewUpdated({ title, columns, apiEndpoint, filterConfigs = [], views = [], onRowSelect, idKey }: {
  title: string;
  columns: Column[];
  apiEndpoint: string;
  filterConfigs?: FilterConfig[];
  views?: ViewConfig[];
  onRowSelect?: (item: ListItem) => void;
  idKey: string;
}) {
  // --- State ---
  // Table and view state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("none");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [advancedFilters, setAdvancedFilters] = useState<FilterGroup[]>([]);
  const [activeView, setActiveView] = useState(views[0]?.id || "");
  const [activeTab, setActiveTab] = useState("table");
  const [groupBy, setGroupBy] = useState<string>("none");
  const [groupDirection, setGroupDirection] = useState<"asc" | "desc">("asc");
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [timelineViewMode, setTimelineViewMode] = useState<"day" | "week" | "month" | "year">("month");
  const [timelineCurrentDate, setTimelineCurrentDate] = useState(new Date());

  // --- Column order and sizing state per view ---
  const [viewColumnOrder, setViewColumnOrder] = useState<Record<string, string[]>>({});
  const [viewColumnSizing, setViewColumnSizing] = useState<Record<string, Record<string, number>>>({});

  // Reset column order and sizing when view or columns change
  useEffect(() => {
    setViewColumnOrder((prev) => ({
      ...prev,
      [activeView]: columns.map((col) => col.key), // Always reset to current columns
    }));
    setViewColumnSizing((prev) => ({
      ...prev,
      [activeView]: {}, // Always reset sizing for new columns
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, columns.map(col => col.key).join(",")]);

  // Get current column order and sizing for the active view
  const columnOrder = viewColumnOrder[activeView] || columns.map((col) => col.key);
  const columnSizing = viewColumnSizing[activeView] || {};

  const itemsPerPage = 50;

  // Set active view when views change
  useEffect(() => { setActiveView(views[0]?.id || ""); }, [views]);

  // Get current view config and filters
  const currentView = useMemo(() => views.find(v => v.id === activeView), [views, activeView]);
  const activeViewFilters = useMemo(() => currentView?.filters || {}, [currentView]);

  // Use the apiEndpoint from the selected view if present, otherwise fallback to the prop
  const effectiveApiEndpoint = currentView?.apiEndpoint || apiEndpoint;

  // Determine active sort/group fields
  const activeSortBy = sortBy !== "none" ? sortBy : currentView?.sortBy || "none";
  const activeSortDirection = sortDirection || currentView?.sortDirection || "asc";
  const activeGroupBy = groupBy !== "none" ? groupBy : currentView?.groupBy || "none";

  // Build filter configs for advanced filter UI
  const finalFilterConfigs = useMemo(() => {
    if (filterConfigs && filterConfigs.length > 0) return filterConfigs;
    return columns
      .filter(col => col.filterable !== false)
      .map(col => ({
        key: col.key,
        label: col.label,
        type: "text" as "number" | "select" | "date" | "text" | "checkbox"
      }));
  }, [columns, filterConfigs]);

  // Timeline date range calculation for timeline view
  const timelineDateRange = useMemo(() => {
    if (activeTab !== 'timeline') return null;
    let startDate, endDate;
    switch (timelineViewMode) {
      case 'month': startDate = startOfMonth(timelineCurrentDate); endDate = endOfMonth(timelineCurrentDate); break;
      case 'year': startDate = startOfYear(timelineCurrentDate); endDate = endOfYear(timelineCurrentDate); break;
    }
    return { startDate, endDate };
  }, [activeTab, timelineViewMode, timelineCurrentDate]);

  // --- Data fetching with TanStack Query ---
  // Fetches paginated, filtered, and sorted data from API
  const { data: queryData, isLoading, error, isFetching } = useQuery<ApiResponse, Error, ApiResponse>({
    queryKey: [
      effectiveApiEndpoint,
      currentPage,
      searchTerm,
      JSON.stringify(activeViewFilters),
      JSON.stringify(advancedFilters),
    ],
    queryFn: () =>
      fetchDataFromApi({
        apiEndpoint: effectiveApiEndpoint,
        page: currentPage,
        limit: itemsPerPage,
        searchTerm,
        filters: activeViewFilters,
        advancedFilters,
      }),
      staleTime: 5000,
    //placeholderData: keepPreviousData,
    //select: (data) => data, // Ensures the returned data is of type ApiResponse
  });

  // --- Data and pagination ---
  const serverItems = queryData?.data || [];
  const pagination = queryData?.pagination ?? { totalPages: 1, totalItems: 0 };
  const totalPages = Math.max(1, Number(pagination.totalPages || 1));

  // Reset page when filters/search/view change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, JSON.stringify(activeViewFilters), JSON.stringify(advancedFilters), activeView, timelineDateRange]);

  // --- Sorting logic ---
  // Sorts items by selected column and direction
  const finalItems = useMemo(() => {
    const src = serverItems.slice();
    if (!activeSortBy || activeSortBy === "none") return src;
    const compare = (a: any, b: any) => {
      if (a == null && b == null) return 0;
      if (a == null) return -1;
      if (b == null) return 1;
      const aDate = typeof a === 'string' ? Date.parse(a) : NaN;
      const bDate = typeof b === 'string' ? Date.parse(b) : NaN;
      if (!isNaN(aDate) && !isNaN(bDate)) { return aDate - bDate; }
      const aNum = typeof a === 'number' ? a : (typeof a === 'string' && a.trim() !== '' && !isNaN(Number(a)) ? Number(a) : NaN);
      const bNum = typeof b === 'number' ? b : (typeof b === 'string' && b.trim() !== '' && !isNaN(Number(b)) ? Number(b) : NaN);
      if (!isNaN(aNum) && !isNaN(bNum)) { return aNum - bNum; }
      const aStr = String(a).toLowerCase();
      const bStr = String(b).toLowerCase();
      return aStr.localeCompare(bStr);
    };
    src.sort((x, y) => {
      const a = x[activeSortBy];
      const b = y[activeSortBy];
      const cmp = compare(a, b);
      return activeSortDirection === "asc" ? cmp : -cmp;
    });
    return src;
  }, [serverItems, activeSortBy, activeSortDirection]);

  // --- Grouping logic ---
  // Groups items by selected field and sorts groups
  const groupedData: Record<string, ListItem[]> = useMemo(() => {
    if (!activeGroupBy || activeGroupBy === "none" || !finalItems.length) return { "": finalItems };
    const groups = finalItems.reduce((acc, item) => {
      const groupValue = item[activeGroupBy] ?? "Ungrouped";
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
    sortedGroupKeys.forEach(key => { sortedGroups[key] = groups[key]; });
    return sortedGroups;
  }, [finalItems, activeGroupBy, groupDirection]);

  // --- Export logic ---
  // Exports filtered and sorted data as CSV
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      Object.entries(activeViewFilters || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "" && value !== "all") params.append(key, String(value));
      });
      if (advancedFilters && advancedFilters.length > 0 && advancedFilters.some(g => g.rules.length > 0)) {
        params.append('advanced_filters', JSON.stringify(advancedFilters));
      }
      if (sortBy && sortBy !== 'none') {
        params.append('sortBy', sortBy);
        params.append('sortDirection', sortDirection || 'asc');
      }
      const exportUrl = new URL(API_BASE_URL);
      const cleanApiEndpoint = apiEndpoint.endsWith('/') ? apiEndpoint.slice(0, -1) : apiEndpoint;
      exportUrl.pathname += `${cleanApiEndpoint}/export`;
      exportUrl.search = params.toString();
      const response = await fetch(exportUrl.href);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Export failed: ${response.statusText} - ${errorText}`);
      }
      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `${title.toLowerCase().replace(/\s/g, '_')}_export.csv`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Export error:", err);
      alert('Failed to export data. Please check the console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  // --- Utility functions for grouping/sorting UI ---
  const getAvailableGroupByFields = () => { return columns.filter(col => col.filterable !== false).map(col => ({ value: col.key, label: col.label })); };
  const getAvailableSortFields = () => { return columns.filter(col => col.sortable).map(col => ({ value: col.key, label: col.label })); };
  const handleSort = (columnKey: string) => { if (sortBy === columnKey) { setSortDirection(prev => prev === "asc" ? "desc" : "asc"); } else { setSortBy(columnKey); setSortDirection("asc"); } };
  const getSortIcon = (columnKey: string) => { if (activeSortBy !== columnKey) return <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-50" />; return activeSortDirection === "asc" ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />; };
  const visibleColumns = useMemo(() => columns.filter(col => !hiddenColumns.includes(col.key)), [columns, hiddenColumns]);

  // --- TanStack Table column definitions ---
  //interface ColDef extends ColumnDef<any> {
  //  accessorKey: string;
  //  header: string;
  //  enableResizing: boolean;
   // cell: (info: { getValue: () => any; row: { original: ListItem } }) => React.ReactNode;
  //}

  // Build column definitions for TanStack Table
  const colDefs = useMemo<ColumnDef<any>[]>(
    () =>
      columns.map(
        (col): ColumnDef<any> => ({
          accessorKey: col.key,
          header: col.label,
          enableResizing: true,
          cell: (info: { getValue: () => any; row: { original: ListItem } }) =>
            col.render ? col.render(info.getValue(), info.row.original) : info.getValue(),
        })
      ),
    [columns]
  );

  // --- Table instance for TanStack Table ---
 // interface TableState {
 //   columnOrder: ColumnOrderState;
 //   columnSizing: Record<string, number>;
 // }

 /* interface TableInstance {
    data: ListItem[];
    columns: ColumnDef<any>[];
    state: TableState;
    onColumnOrderChange: (newOrder: ColumnOrderState) => void;
    onColumnSizingChange: (newSizing: Record<string, number>) => void;
    getCoreRowModel: () => any;
  } */

  // Create table instance with TanStack Table
  /*const table = useReactTable({
    data: finalItems || [],
    columns: colDefs,
    state: { columnOrder, columnSizing },
    onColumnOrderChange: (newOrder) =>
      setViewColumnOrder((prev) => ({ ...prev, [activeView]: newOrder })),
    onColumnSizingChange: (newSizing)=>
      setViewColumnSizing((prev) => ({ ...prev, [activeView]: newSizing })),
    getCoreRowModel: getCoreRowModel(),
  });*/

  const table = useReactTable({
    data: finalItems || [],
    columns: colDefs,
    state: { columnOrder, columnSizing },
    onColumnOrderChange: (newOrder) =>
      setViewColumnOrder((prev) => ({
        ...prev,
        [activeView]: Array.isArray(newOrder) ? newOrder : [...(prev[activeView] || [])],
      })),
    onColumnSizingChange: (newSizing) =>
  setViewColumnSizing((prev) => ({
    ...prev,
    [activeView]: typeof newSizing === "function" ? newSizing(prev[activeView] || {}) : newSizing,
  })),
    getCoreRowModel: getCoreRowModel(),
  });

  // --- DnD-kit Sortable header ---
  // Used for drag-and-drop column reordering and resizing
  function DraggableHeader({ header }: { header: any }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
      useSortable({ id: header.column.id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      cursor: "grab",
      background: isDragging ? "#e0e7ff" : undefined,
      position: "relative",
      width: header.getSize(),
      minWidth: 120, // Set a reasonable min width for header
      maxWidth: 400, // Optional: set a max width
      userSelect: "none",
      whiteSpace: "nowrap", // Prevent text wrapping
      textAlign: "left", // Align text left
      padding: "0.5rem 0.5rem", // Consistent padding
      boxSizing: "border-box", // Ensure padding doesn't affect width
    };
    return (
      <th
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        colSpan={header.colSpan}
        className="border-b bg-card text-sm font-medium"
      >
        <div className="flex items-center justify-start relative w-full h-full">
          {flexRender(header.column.columnDef.header, header.getContext())}
          {header.column.getCanResize() && (
            <div
              onMouseDown={header.getResizeHandler()}
              onTouchStart={header.getResizeHandler()}
              className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none bg-transparent hover:bg-blue-400"
            />
          )}
        </div>
      </th>
    );
  }

  // --- Render ---
  return (
    <div className="p-6 space-y-4">
      {/* Title and description */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your {title.toLowerCase()} data with advanced filtering and views.
          </p>
        </div>
      </div>
      {/* View selection buttons */}
      {views && views.length > 1 && (
        <div className="flex gap-2 mb-4">
          {views.map((view) => (
            <Button
              key={view.id}
              variant={activeView === view.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveView(view.id)}
            >
              {view.name}
            </Button>
          ))}
        </div>
      )}
      {/* Main card container */}
      <Card className="border-0 shadow-sm bg-card">
        {/* Card header: tabs, export, filters, grouping, sorting, column hiding, search */}
        <CardHeader className="p-6 border-b bg-muted/20 rounded-t-lg">
          <div className="flex items-center justify-between">
            {/* Tabs for table/timeline */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className={`grid ${title === 'Events' ? 'grid-cols-2' : 'grid-cols-1'} w-fit`}>
                <TabsTrigger value="table" className="flex items-center gap-2"><TableIcon className="w-4 h-4" />Table</TabsTrigger>
                {title === 'Events' && <TabsTrigger value="timeline" className="flex items-center gap-2"><Calendar className="w-4 h-4" />Timeline</TabsTrigger>}
              </TabsList>
            </Tabs>
            {/* Export button */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 h-8" onClick={handleExport} disabled={isExporting}>
                {isExporting ? (<Loader2 className="w-4 h-4 animate-spin" />) : (<Download className="w-4 h-4" />)}
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            </div>
          </div>
          {/* Filters, grouping, sorting, column hiding, search */}
          <div className="flex items-center gap-4 pt-4">
            <div className="flex items-center gap-2">
              {/* Advanced filters */}
              <AdvancedFiltersClickUp filters={finalFilterConfigs} onFiltersChange={setAdvancedFilters} data={finalItems} />
              {/* Grouping controls */}
              <div className="flex items-center gap-1">
                <Popover>
                  <PopoverTrigger asChild><Button variant="outline" size="sm" className="gap-2 h-8"><Users className="w-4 h-4" />{groupBy !== "none" ? `Group: ${getAvailableGroupByFields().find(f => f.value === groupBy)?.label}` : "Group"}</Button></PopoverTrigger>
                  <PopoverContent className="w-64 p-3" align="start"><div className="space-y-3"><div className="font-medium text-sm">Group by field</div>
<Select value={groupBy} onValueChange={(v: string) => setGroupBy(v as string)}>
  <SelectTrigger className="h-8">
    <SelectValue placeholder="Select field" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">No grouping</SelectItem>
    {getAvailableGroupByFields().map((field) => (
      <SelectItem key={field.value} value={field.value}>{field.label}</SelectItem>
    ))}
  </SelectContent>
</Select>
{groupBy !== "none" && (<>
  <div className="font-medium text-sm">Sort groups</div>
  <Select value={groupDirection} onValueChange={(value: string) => setGroupDirection(value as "asc" | "desc")}>
    <SelectTrigger className="h-8">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="asc">Ascending (A-Z)</SelectItem>
      <SelectItem value="desc">Descending (Z-A)</SelectItem>
    </SelectContent>
  </Select>
</>)}
</div></PopoverContent>
                </Popover>
                {groupBy !== "none" && (<Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => setGroupBy("none")} title="Clear grouping"><X className="w-4 h-4" /></Button>)}
              </div>
              {/* Sorting controls */}
              <div className="flex items-center gap-1">
                <Select value={sortBy} onValueChange={(v: string) => setSortBy(v)}><SelectTrigger className="w-36 h-8"><SelectValue placeholder="Sort by" /></SelectTrigger><SelectContent><SelectItem value="none">No sorting</SelectItem>{getAvailableSortFields().map((field) => (<SelectItem key={field.value} value={field.value}>Sort by {field.label}</SelectItem>))}</SelectContent></Select>
                {sortBy !== "none" && (<Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => setSortBy("none")} title="Clear sorting"><X className="w-4 h-4" /></Button>)}
              </div>
              {/* Sort direction */}
              {sortBy !== "none" && (<Select value={sortDirection} onValueChange={(value: string) => setSortDirection(value as "asc" | "desc")}><SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="asc">Ascending</SelectItem><SelectItem value="desc">Descending</SelectItem></SelectContent></Select>)}
            </div>
            {/* Search and column hiding */}
            <div className="flex items-center gap-2 ml-auto">
              <div className="relative"><Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-64 h-8"/></div>
              <Popover>
                <PopoverTrigger asChild><Button variant="outline" size="sm" className="gap-2 h-8"><EyeOff className="w-4 h-4" />Hide</Button></PopoverTrigger>
                <PopoverContent className="w-64" align="end"><div className="space-y-3"><div className="font-medium">Show/Hide Columns</div>{columns.map((column) => (<div key={column.key} className="flex items-center space-x-2"><Checkbox
  id={`column-${column.key}`}
  checked={!hiddenColumns.includes(column.key)}
  onCheckedChange={(checked: boolean) => {
    if (checked) {
      setHiddenColumns(hiddenColumns.filter(c => c !== column.key));
    } else {
      setHiddenColumns([...hiddenColumns, column.key]);
    }
  }}
/><label htmlFor={`column-${column.key}`} className="text-sm">{column.label}</label></div>))}</div></PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        {/* Card content: table or timeline */}
        <CardContent className="p-0">
          {activeTab === 'table' && (
            <div className="overflow-x-auto relative" style={{ maxHeight: '60vh' }}>
              {(isLoading && !isFetching) && <div className="p-8 text-center">Loading...</div>}
              {error && <div className="p-8 text-center text-red-500">Error: {(error as Error).message}</div>}
              {!isLoading && finalItems.length === 0 && <div className="p-8 text-center">No results found.</div>}
              {finalItems.length > 0 && (
                <div className={`transition-opacity duration-300 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
                  {/* Main table with drag, resize, grouping, sorting, selection */}
                  <DraggableResizableTable
                    data={finalItems}
                    columns={visibleColumns}
                    onRowSelect={(item) => onRowSelect?.(item)}
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                    groupedData={groupedData}
                    activeGroupBy={activeGroupBy}
                    idKey={idKey}
                  />
                </div>
              )}
            </div>
          )}
         {/* Timeline view for events */}
         {activeTab === 'timeline' && title === 'Events' && (
    <TimelineView
      apiEndpoint={apiEndpoint}
      page={currentPage}
      limit={itemsPerPage}
      onPageChange={setCurrentPage}
      filters={activeViewFilters}
      advancedFilters={advancedFilters}
      groupBy={groupBy}
      groupDirection={groupDirection}
      sortBy={sortBy}
      sortDirection={sortDirection}
      onItemSelect={onRowSelect}
    />
)}
        </CardContent>
        {/* Pagination and results count */}
        { !isLoading && finalItems.length > 0 &&
          <div className="flex items-center justify-between text-sm text-muted-foreground p-6 border-t">
              <div><span>{pagination.totalItems} results</span></div>
              <div className="flex items-center gap-4">
                  {(advancedFilters.some(group => group.rules.length > 0) || Object.keys(activeViewFilters).length > 0) && (
                      <Button variant="ghost" size="sm" onClick={() => { setAdvancedFilters([]); setActiveView(views[0]?.id || ""); }} className="text-muted-foreground hover:text-foreground">Clear filters</Button>
                  )}
                  <SimplePagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => setCurrentPage(Number(p))}/>
              </div>
          </div>
        }
      </Card>
    </div>
  );
}