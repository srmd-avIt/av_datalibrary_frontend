import React, { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from 'date-fns';
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
import { DraggableResizableTable } from "./DraggableResizableTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Search, Download, ArrowUpDown, ArrowUp, ArrowDown, Users, Table as TableIcon,
  Settings2, EyeOff, X, Funnel, Loader2,Pin
} from "lucide-react";
import { AdvancedFiltersClickUp } from "./AdvancedFiltersClickUp";
import { SavedFilterTabs } from "./SavedFilterTabs"; // Import the new component
import { Column, ListItem } from "./types"; // Import ListItem from ./types

// --- REMOVED: Local Column definition is no longer needed ---

import useLocalStorageState from "../hooks/useLocalStorageState"; 
import { useAuth } from "../contexts/AuthContext"; // For permission checks
import { useQueryClient } from "@tanstack/react-query"; // To invalidate cache
import { toast } from "sonner"; // For notifications
import'../styles/globals.css';

// --- Vite env types for TypeScript ---
/// <reference types="vite/client" />

// --- Interfaces ---
// ListItem and Column are now imported from './types', so local definitions are removed.

// FilterConfig: Used for advanced filtering UI
interface FilterConfig { key: string; label: string; type: "text" | "select" | "date" | "number"; options?: { value: string; label: string; }[]; }
// ViewConfig: Used for saved views (grouping, sorting, filters, etc.)
interface ViewConfig { id: string; name: string; filters?: Record<string, any>; groupBy?: string; sortBy?: string; sortDirection?: "asc" | "desc"; apiEndpoint?: string; }
// FilterGroup and FilterRule: Used for advanced filter logic
interface FilterGroup { id: string; rules: FilterRule[]; logic: "AND" | "OR"; }
interface FilterRule { id: string; field: string; operator: string; value: any; logic?: "AND" | "OR"; }

// --- NEW: Saved Filter Interface ---
interface SavedFilter {
  id: string;
  name: string;
  filterGroups: FilterGroup[];
  createdAt: string;
}

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
  sortBy,
  sortDirection,
}: {
  apiEndpoint: string;
  page: number;
  limit: number;
  searchTerm?: string;
  filters?: Record<string, any>;
  advancedFilters?: FilterGroup[];
  sortBy?: string;
  sortDirection?: "asc" | "desc";
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

  // Add sorting parameters
  if (sortBy && sortBy !== "none") {
    params.append("sortBy", sortBy);
    params.append("sortDirection", sortDirection || "asc");
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
  // --- State Management Strategy ---
  // The component uses a combination of "global" and "user-specific" state to meet the requirements.
  //
  // GLOBAL / SHARED STATE:
  // - `savedFilters`: This state is persisted in localStorage with a key that is the same for all users viewing this table
  //   (e.g., 'global-saved-filters-My-Table'). This simulates a shared database of saved filters that everyone can see and use.
  //
  // USER-SPECIFIC STATE:
  // - All other view-related settings (sorting, grouping, applied filters, column order, frozen columns, etc.)
  //   are persisted in localStorage with a unique key prefix for this table instance. This ensures that each user's
  //   personalization settings are saved and restored without affecting other users.
  //
  // TRANSIENT STATE:
  // - `currentPage`, `isExporting`, etc., are managed with `useState` as they are session-specific and not meant to be persisted.

  // --- Create a unique key prefix for this specific table instance ---
  const localStorageKeyPrefix = `tableView-${title.replace(/\s/g, '-')}`;

  // --- State ---
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // --- GLOBAL / SHARED STATE ---
  // This state is persisted to a "global" localStorage key for this table, making it visible to all users.
  const [savedFilters, setSavedFilters] = useLocalStorageState<SavedFilter[]>(`global-saved-filters-${localStorageKeyPrefix}`, []);
  
  // --- TRANSIENT STATE (Session-specific) ---
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isExporting, setIsExporting] = useState(false);
  
  // --- NEW: State for inline editing ---
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnKey: string } | null>(null);
  const [editValue, setEditValue] = useState<any>('');

  // --- TRANSIENT STATE for Sort, Group, and Freeze ---
  const [sortBy, setSortBy] = useState("none");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [groupBy, setGroupBy] = useState("none");
  const [groupDirection, setGroupDirection] = useState<"asc" | "desc">("asc");
  const [frozenColumnKey, setFrozenColumnKey] = useState<string | null>(null);

  // --- USER-SPECIFIC STATE (persisted for the current user/browser) ---
   const [searchTerm, setSearchTerm] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState<FilterGroup[]>([]);
  const [activeView, setActiveView] = useState(views[0]?.id || "");
  const [hiddenColumns, setHiddenColumns] = useLocalStorageState<string[]>(`${localStorageKeyPrefix}-hiddenColumns`, []);
  const [activeSavedFilterName, setActiveSavedFilterName] = useLocalStorageState<string | null>(`${localStorageKeyPrefix}-activeSavedFilterName`, null);
  const [viewColumnOrder, setViewColumnOrder] = useLocalStorageState<Record<string, string[]>>(`${localStorageKeyPrefix}-viewColumnOrder`, {});
  const [viewColumnSizing, setViewColumnSizing] = useLocalStorageState<Record<string, Record<string, number>>>(`${localStorageKeyPrefix}-viewColumnSizing`, {});

  // --- NEW: Permission Check Logic ---
  const hasAccess = useMemo(() => {
    return (resourceName: string, accessLevel: 'read' | 'write' = 'read'): boolean => {
      if (!user) return false;
      if (user.role === 'Admin' || user.role === 'Owner') return true;
      const permission = user.permissions.find((p) => p.resource === resourceName);
      if (!permission) return false;
      return permission.actions.includes(accessLevel);
    };
  }, [user]);

  // --- NEW: Handlers for Inline Editing ---
  const handleCellDoubleClick = (rowIndex: number, column: Column, value: any) => {
    // Check 1: Is the column definition marked as editable?
    if (!column.editable) return;
    // Check 2: Does the user have 'write' access for this resource?
    if (!hasAccess(title, 'write')) {
      toast.error(`You don't have permission to edit ${title}.`);
      return;
    }
    setEditingCell({ rowIndex, columnKey: column.key });
    setEditValue(value);
  };

  const handleUpdateCell = async () => {
    if (!editingCell) return;

    const { rowIndex, columnKey } = editingCell;
    const item = finalItems[rowIndex];
    const id = item[idKey];
    const originalValue = item[columnKey];

    // Exit edit mode immediately
    setEditingCell(null);

    // Don't save if the value hasn't changed
    if (editValue === originalValue) {
      return;
    }

    const savingToast = toast.loading(`Updating ${columnKey}...`);

    try {
      const response = await fetch(`${API_BASE_URL}${effectiveApiEndpoint}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [columnKey]: editValue }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save changes.');
      }

      toast.success("Update saved successfully!", { id: savingToast });
      // Refetch data to show the update
      await queryClient.invalidateQueries({ queryKey: [effectiveApiEndpoint] });

    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: savingToast });
      console.error("Failed to update cell:", error);
    }
  };


  const handleSaveFilter = (name: string, filterGroups: FilterGroup[]) => {
    const newSavedFilter: SavedFilter = { 
      id: `filter_${Date.now()}`,
      name, 
      filterGroups,
      createdAt: new Date().toISOString()
    };
    setSavedFilters(prev => {
      const existing = prev.find(f => f.name === name);
      if (existing) {
        return prev.map(f => f.name === name ? { ...newSavedFilter, id: existing.id } : f);
      }
      return [...prev, newSavedFilter];
    });
    setActiveSavedFilterName(name);
    setAdvancedFilters(filterGroups);
  };

  const handleDeleteFilter = (name: string) => {
    setSavedFilters(prev => prev.filter(f => f.name !== name));
    if (activeSavedFilterName === name) {
      setActiveSavedFilterName(null);
      setAdvancedFilters([]);
    }
  };

  const handleSelectFilter = (name: string | null) => {
    setActiveSavedFilterName(name);
    if (name) {
      const savedFilter = savedFilters.find(f => f.name === name);
      if (savedFilter) {
        setAdvancedFilters(savedFilter.filterGroups);
      }
    } else {
      setAdvancedFilters([]);
    }
  };

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
     // --- NEW: Reset freeze when view or columns change to prevent invalid state ---
    setFrozenColumnKey(null);
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

  // --- NEW: Determine if we need to fetch all data ---
  // Fetch all data if grouping is active. Sorting is now handled by the API.
  const shouldFetchAllForGrouping = activeGroupBy !== "none";

  // Build filter configs for advanced filter UI
  const finalFilterConfigs = useMemo(() => {
    if (filterConfigs && filterConfigs.length > 0) {
      // Map options to correct shape if needed
      return filterConfigs.map(fc => ({
        ...fc,
        options: fc.options
          ? fc.options.map(opt =>
              typeof opt === "string"
                ? { value: opt, label: opt }
                : opt
            )
          : undefined,
      }));
    }
    return columns
      .filter((col) => col.filterable !== false)
      .map((col) => ({
        key: col.key,
        label: col.label,
        type: "text" as "text", // Explicitly cast to the correct type
        options: undefined,
      }));
  }, [columns, filterConfigs]);

  // --- Query for PAGINATED data (when not grouping) ---
  const { data: queryData, isLoading, error, isFetching } = useQuery<ApiResponse>({
    queryKey: [
      effectiveApiEndpoint,
      currentPage,
      searchTerm,
      JSON.stringify(activeViewFilters),
      JSON.stringify(advancedFilters),
      activeSortBy,
      activeSortDirection,
    ],
    queryFn: () =>
      fetchDataFromApi({
        apiEndpoint: effectiveApiEndpoint,
        page: currentPage,
        limit: itemsPerPage,
        searchTerm,
        filters: activeViewFilters,
        advancedFilters,
        sortBy: activeSortBy,
        sortDirection: activeSortDirection,
      }),
    // Only run this query if grouping is NOT active.
    // The API will handle pagination and sorting.
    enabled: !shouldFetchAllForGrouping,
    staleTime: 5000, // Data will be considered fresh for 5 seconds
  });

  // --- NEW: Query for ALL data (when grouping IS active) ---
  // This query fetches the entire dataset, pre-sorted by the API.
  const { data: allDataForGrouping, isLoading: isGroupingDataLoading } = useQuery<ApiResponse>({
    queryKey: [effectiveApiEndpoint, 'all-for-grouping', searchTerm, JSON.stringify(activeViewFilters), JSON.stringify(advancedFilters), activeSortBy, activeSortDirection],
    queryFn: () =>
      fetchDataFromApi({
        apiEndpoint: effectiveApiEndpoint,
        page: 1,
        limit: 1000000, // Fetch a very large number of items to get all data
        searchTerm,
        filters: activeViewFilters,
        advancedFilters,
        sortBy: activeSortBy,
        sortDirection: activeSortDirection,
      }),
    // CRITICAL: Only run this query when grouping is enabled.
    enabled: shouldFetchAllForGrouping,
    staleTime: 60000, // Cache all-data requests for 1 minute
  });

  // --- Data and pagination ---
  // Use all data if grouping, otherwise use paginated data. Both are now sorted by the API.
  const allItems = shouldFetchAllForGrouping ? (allDataForGrouping?.data || []) : (queryData?.data || []);
  
  // --- REMOVED: Client-side sorting logic has been removed. ---
  // The component now relies entirely on the API for sorting.
  const sortedData = allItems;

  // --- MODIFIED: Client-side pagination now uses the API-sorted data ---
  const finalItems = useMemo(() => {
    if (shouldFetchAllForGrouping) {
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return sortedData.slice(start, end);
    }
    return sortedData; // For paginated view, use the client-sorted data
  }, [sortedData, currentPage, itemsPerPage, shouldFetchAllForGrouping]);

  const totalItems = shouldFetchAllForGrouping ? (sortedData.length) : (queryData?.pagination.totalItems || 0);
  const totalPages = shouldFetchAllForGrouping ? Math.ceil(totalItems / itemsPerPage) : (queryData?.pagination.totalPages || 1);


  // Reset page when filters/search/view change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, JSON.stringify(activeViewFilters), JSON.stringify(advancedFilters), activeView, activeSortBy, activeSortDirection]);

  // --- Grouping logic ---
  // This logic now correctly operates on `sortedData` and `finalItems`.
  const groupedData: Record<string, ListItem[]> = useMemo(() => {
    if (activeGroupBy === "none") {
      // When not grouping, return a single group with the current page's items
      return { "": finalItems };
    }
    
    // When grouping, reduce the entire 'sortedData' dataset into groups.
    const groups = sortedData.reduce((acc, item) => {
      const groupValue = item[activeGroupBy] ?? "Ungrouped";
      if (!acc[groupValue]) acc[groupValue] = [];
      acc[groupValue].push(item);
      return acc;
    }, {} as Record<string, ListItem[]>);

    // --- Sort group keys ---
    const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
      const direction = groupDirection === "asc" ? 1 : -1;
      if (a < b) return -1 * direction;
      if (a > b) return 1 * direction;
      return 0;
    });

    const sortedGroups: Record<string, ListItem[]> = {};
    sortedGroupKeys.forEach(key => { sortedGroups[key] = groups[key]; });
    return sortedGroups;
  }, [sortedData, finalItems, activeGroupBy, groupDirection]);

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
  const colDefs: ColumnDef<any>[] = useMemo(
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
  function DraggableHeader({ header }: { header: any }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
      useSortable({ id: header.column.id });
    return (
      <th
        ref={setNodeRef}
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
      {/* Saved Filter Tabs */}
      <SavedFilterTabs
        savedFilters={savedFilters}
        activeFilterName={activeSavedFilterName}
        onSelectFilter={handleSelectFilter}
        onDeleteFilter={handleDeleteFilter}
      />
      {/* Main card container */}
      <Card className="border-0 shadow-sm bg-card">
        {/* Card header: tabs, export, filters, grouping, sorting, column hiding, search */}
        <CardHeader className="p-6 border-b bg-muted/20 rounded-t-lg">
          <div className="flex items-center justify-between">
            {/* Tabs for table/timeline */}
            <Tabs value="table">
              <TabsList className="grid grid-cols-1 w-fit">
                <TabsTrigger value="table" className="flex items-center gap-2"><TableIcon className="w-4 h-4" />Table</TabsTrigger>
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
              <AdvancedFiltersClickUp 
                filters={finalFilterConfigs} 
                onFiltersChange={setAdvancedFilters} 
                data={finalItems} 
                onSaveFilter={handleSaveFilter} 
              />

                {/* --- NEW: Freeze Column Button & Popover --- */}
              <div className="flex items-center gap-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-8">
                      <Pin className="w-4 h-4" />
                      {frozenColumnKey ? `Freeze: ${columns.find(c => c.key === frozenColumnKey)?.label}` : "Freeze"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-3">
                      <div className="font-medium text-sm">Freeze up to column</div>
                      <Select value={frozenColumnKey || 'none'} onValueChange={(value: string) => setFrozenColumnKey(value === 'none' ? null : value)}>
                        <SelectTrigger className="h-8"><SelectValue placeholder="Select column to freeze" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No columns frozen</SelectItem>
                          {visibleColumns.map((col) => (<SelectItem key={col.key} value={col.key}>{col.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </PopoverContent>
                </Popover>
                {frozenColumnKey && (
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => setFrozenColumnKey(null)} title="Unfreeze columns">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Grouping controls */} 
              <div className="flex items-center gap-1">
                <Popover>
                  <PopoverTrigger asChild><Button variant="outline" size="sm" className="gap-2 h-8"><Users className="w-4 h-4" />{groupBy !== "none" ? `Group: ${getAvailableGroupByFields().find(f => f.value === groupBy)?.label}` : "Group"}</Button></PopoverTrigger>
                  <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-3">
                      <div className="font-medium text-sm">Group by field</div>
                      <Select
                        value={groupBy}
                        onValueChange={(v: string) => setGroupBy(v)}
                      >
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
                          <Select
                            value={groupDirection}
                            onValueChange={(value: "asc" | "desc") => setGroupDirection(value)}
                          >
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
                {groupBy !== "none" && (<Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => setGroupBy("none")} title="Clear grouping"><X className="w-4 h-4" /></Button>)}
              </div>
              {/* Sorting controls */}
              <div className="flex items-center gap-1">
                <Select value={sortBy} onValueChange={(v: string) => setSortBy(v)}><SelectTrigger className="w-36 h-8"><SelectValue placeholder="Sort by" /></SelectTrigger><SelectContent><SelectItem value="none">No sorting</SelectItem>{getAvailableSortFields().map((field) => (<SelectItem key={field.value} value={field.value}>Sort by {field.label}</SelectItem>))}</SelectContent></Select>
                {sortBy !== "none" && (<Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => setSortBy("none")} title="Clear sorting"><X className="w-4 h-4" /></Button>)}
              </div>
              {sortBy !== "none" && (<Select value={sortDirection} onValueChange={(value: string) => setSortDirection(value as "asc" | "desc")}><SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="asc">Ascending</SelectItem><SelectItem value="desc">Descending</SelectItem></SelectContent></Select>)}
            </div>
            {/* Search and column hiding */}
            <div className="flex items-center gap-2 ml-auto">
              <div className="relative"><Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-64 h-8"/></div>
              <Popover>
                <PopoverTrigger asChild><Button variant="outline" size="sm" className="gap-2 h-8"><EyeOff className="w-4 h-4" />Hide</Button></PopoverTrigger>
                <PopoverContent className="w-64" align="end">
                  <div className="space-y-3">
                    <div className="font-medium">Show/Hide Columns</div>
                    {columns.map((column) => (
                      <div key={column.key} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`column-${column.key}`} 
                          checked={!hiddenColumns.includes(column.key)} 
                          onCheckedChange={(checked: boolean) => { 
                            if (checked) { 
                              setHiddenColumns(hiddenColumns.filter(c => c !== column.key)); 
                            } else { 
                              setHiddenColumns([...hiddenColumns, column.key]); 
                            } 
                          }} 
                        />
                        <label htmlFor={`column-${column.key}`} className="text-sm">{column.label}</label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        {/* Card content: table or timeline */}
        <CardContent className="p-0">
            <div className="overflow-x-auto relative custom-scrollbar" style={{ maxHeight: '60vh' }}>
              {/* Initial loading state (blocks the whole view) */}
              {(isLoading || isGroupingDataLoading) && <div className="p-8 text-center flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading...</div>}
              
              {/* Error state */}
              {error && <div className="p-8 text-center text-red-500">Error: {(error as Error).message}</div>}

              {/* Empty state */}
              {!(isLoading || isGroupingDataLoading) && finalItems.length === 0 && <div className="p-8 text-center">No results found.</div>}
              
              {/* Data display */}
              {finalItems.length > 0 && (
                <div className={`transition-opacity duration-300 ${isFetching && !isLoading && !isGroupingDataLoading ? 'opacity-50' : 'opacity-100'}`}>
                  {/* Main table with drag, resize, grouping, sorting, selection */}
                  <DraggableResizableTable
                    data={activeGroupBy === 'none' ? finalItems : (groupedData as any)}
                    columns={visibleColumns as any}
                    onRowSelect={(item) => onRowSelect?.(item as any)}
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                    groupedData={groupedData as any}
                    activeGroupBy={activeGroupBy}
                    idKey={idKey}
                    // --- Pass editing props to the table ---
                    editingCell={editingCell}
                    editValue={editValue}
                    setEditValue={setEditValue}
                    handleUpdateCell={handleUpdateCell}
                    handleCellDoubleClick={handleCellDoubleClick}
                    setEditingCell={setEditingCell} // Pass the setter function
                    sortedData={sortedData} // Pass the sorted data array
                     // --- Pass freeze props to the table component ---
                    frozenColumnKey={frozenColumnKey}
                    columnOrder={columnOrder}
                    columnSizing={columnSizing}
                  />
                </div>
              )}

              {/* Background fetching indicator (buffering) */}
              {isFetching && !isLoading && !isGroupingDataLoading && (
                <div className="absolute top-4 right-4 z-20 bg-background/80 backdrop-blur-sm text-foreground rounded-full px-4 py-2 text-xs flex items-center gap-2 shadow-lg border">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Buffering...</span>
                </div>
              )}
            </div>
        </CardContent>
        {/* Pagination and results count */}
        { !(isLoading || isGroupingDataLoading) && totalItems > 0 &&
          <div className="flex items-center justify-between text-sm text-muted-foreground p-6 border-t">
              <div><span>{totalItems} results</span></div>
              {/* Show pagination unless grouping is active and there's only one page */}
              {!(activeGroupBy !== 'none' && totalPages <= 1) && (
                <div className="flex items-center gap-4">
                    {(advancedFilters.some(group => group.rules.length > 0) || Object.keys(activeViewFilters).length > 0) && (
                        <Button variant="ghost" size="sm" onClick={() => { setAdvancedFilters([]); setActiveView(views[0]?.id || ""); }} className="text-muted-foreground hover:text-foreground">Clear filters</Button>
                    )}
                    <SimplePagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => setCurrentPage(Number(p))}/>
                </div>
              )}
          </div>
        }
      </Card>
    </div>
  );
}