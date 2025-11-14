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
import { MobileTable } from "./MobileTableView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Search, Download, ArrowUpDown, ArrowUp, ArrowDown, Users, Table as TableIcon,
  Settings2, EyeOff, X, Funnel, Loader2, Pin, Grid, Plus, Trash2
} from "lucide-react";
import { AdvancedFiltersClickUp } from "./AdvancedFiltersClickUp";
import { SavedFilterTabs } from "./SavedFilterTabs"; // Import the new component
import { Column, ListItem } from "./types"; // Import ListItem from ./types
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { ManageColumnsDialog } from "./ManageColumnsDialog"; // add import if not present

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
interface ViewConfig {
  id: string;
  name: string;
  filters?: Record<string, any>;
  groupBy?: string;
  sortBy?: string; // Can be comma-separated
  sortDirection?: string; // Can be comma-separated
  apiEndpoint?: string;
}
// FilterGroup and FilterRule: Used for advanced filter logic
interface FilterGroup { id: string; rules: FilterRule[]; logic: "AND" | "OR"; }
interface FilterRule { id: string; field: string; operator: string; value: any; logic?: "AND" | "OR"; }

// --- NEW: Saved Filter Interface ---
interface SavedFilter {
  id: string;
  name: string;
  filterGroups: FilterGroup[];
  createdAt: string;
  createdBy: string;
}

// --- NEW: Interface for a single sort field configuration ---
interface SortField {
  key: string;
  direction: "asc" | "desc";
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
// Responsive pagination controls for navigating pages
function SimplePagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void; }) {
  const [jump, setJump] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const go = (page: number) => { 
    const p = Math.max(1, Math.min(Math.max(1, totalPages), Math.floor(Number(page) || 1))); 
    if (p !== currentPage) onPageChange(p); 
  };

  if (isMobile) {
    // Mobile: Compact pagination with essential controls only
    return (
      <div className="flex flex-col gap-3 w-full">
        {/* Page info */}
        <div className="text-center text-sm text-muted-foreground">
          Page <strong>{currentPage}</strong> of <strong>{Math.max(1, totalPages)}</strong>
        </div>
        
        {/* Navigation controls */}
        <div className="flex items-center justify-between gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => go(currentPage - 1)} 
            disabled={currentPage <= 1}
            className="flex-1 max-w-[100px]"
          >
            Previous
          </Button>
          
          {/* Quick jump input */}
          <div className="flex items-center gap-1 min-w-0">
            <Input 
              type="number" 
              min={1} 
              max={Math.max(1, totalPages)} 
              placeholder="Page" 
              value={jump} 
              onChange={(e: any) => setJump(e.target.value)} 
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { 
                if (e.key === 'Enter') { 
                  go(Number(jump)); 
                  setJump(''); 
                } 
              }} 
              className="w-16 h-8 text-center text-xs"
            />
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => { go(Number(jump)); setJump(''); }}
              className="px-2 h-8 text-xs"
            >
              Go
            </Button>
          </div>
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => go(currentPage + 1)} 
            disabled={currentPage >= Math.max(1, totalPages)}
            className="flex-1 max-w-[100px]"
          >
            Next
          </Button>
        </div>
      </div>
    );
  }

  // Desktop: Full pagination controls
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

// --- Helper Function for Frontend CSV Export ---
// This function escapes values to be safely included in a CSV file.
const escapeCsvValue = (value: any): string => {
  if (value == null) {
    return ''; // Return an empty string for null or undefined
  }
  const stringValue = String(value);
  // If the value contains a comma, a double quote, or a newline, it needs to be wrapped in double quotes.
  if (/[",\r\n]/.test(stringValue)) {
    // Within a quoted field, any double quote must be escaped by another double quote.
    const escapedValue = stringValue.replace(/"/g, '""');
    return `"${escapedValue}"`;
  }
  return stringValue;
};

// --- Main Component ---
// This is the main list/table view component with filtering, sorting, grouping, column hiding, pagination, and timeline view
export function ClickUpListViewUpdated({
  title,
  columns,
  apiEndpoint,
  viewId,
  keyMap, // <-- ADD THIS PROP
  filterConfigs = [],
  views = [],
  onRowSelect,
  idKey,
  showAddButton = false,
  // optional props passed from App.tsx
  rowTransformer,
  initialGroupBy,
  initialSortBy,
  initialSortDirection,
  groupEnabled,
  initialFilters,
  onViewChange,
}: {
  title: string;
  columns: Column[];
  apiEndpoint: string;
  viewId: string;
  keyMap?: Record<string, string>; // <-- DEFINE THE PROP TYPE
  filterConfigs?: FilterConfig[];
  views?: ViewConfig[];
  onRowSelect?: (item: ListItem) => void;
  idKey: string;
  showAddButton?: boolean;
  rowTransformer?: (row: any) => any;
  initialGroupBy?: string | null;
  initialSortBy?: string; 
  initialSortDirection?: "asc" | "desc"; 
  groupEnabled?: boolean;
  initialFilters?: Record<string, any>;
  onViewChange?: () => void;
}) {
  // --- State Management Strategy ---
  // The component uses a combination of "global" and "user-specific" state to meet the requirements.
  //
  // GLOBAL / SHARED STATE:
  // - `savedFilters`: This state is persisted in localStorage with a key that is the same for all users viewing this table
  //   (e.g., 'global-saved-filters-My-Table'). This simulates a shared database of saved filters that everyone can see and use.
  // - Global Column Layouts: Persisted with a `global-column-` prefix, these are managed by Admins and applied to all 'Guest' role users.
  //
  // USER-SPECIFIC STATE:
  // - All other view-related settings (sorting, grouping, applied filters, column order, frozen columns, etc.)
  //   are persisted in localStorage with a unique key prefix for this table instance. This ensures that each user's
  //   personalization settings are saved and restored without affecting other users.
  // - User-Specific Column Layouts: For non-Guest users, their column order and visibility is saved to a personal key.
  //
  // TRANSIENT STATE:
  // - `currentPage`, `isExporting`, etc., are managed with `useState` as they are session-specific and not meant to be persisted.

  // --- Create a unique key prefix for this specific table instance ---
  const localStorageKeyPrefix = `view-${viewId}`;

  // --- State ---
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // --- Mobile detection ---
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // --- GLOBAL / SHARED STATE ---
  // This state is persisted to a "global" localStorage key for this table, making it visible to all users.
  const [savedFilters, setSavedFilters] = useLocalStorageState<SavedFilter[]>(`global-saved-filters-${localStorageKeyPrefix}`, []);
  
  // --- TRANSIENT STATE (Session-specific) ---
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isExporting, setIsExporting] = useState(false);
  const [activeSavedFilterName, setActiveSavedFilterName] = useState<string | null>(null);
  
  // --- MODIFIED: State for bulk editing is now persisted in localStorage ---
  const [pendingChanges, setPendingChanges] = useLocalStorageState<Record<string, Record<string, any>>>(`${localStorageKeyPrefix}-pendingChanges`, {});

  // --- NEW: State for inline editing ---
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnKey: string } | null>(null);
  const [editValue, setEditValue] = useState<any>('');

  // --- MODIFIED: State for multiple sort fields ---
  const [sortByFields, setSortByFields] = useState<SortField[]>(() => {
    if (!initialSortBy) return [];
    const keys = initialSortBy.split(',');
    const directions = (initialSortDirection || '').split(',');
    return keys.map((key, i) => ({
      key,
      direction: directions[i] === 'desc' ? 'desc' : 'asc',
    }));
  });

  // --- MODIFIED: State for multiple grouping fields ---
  const [groupByFields, setGroupByFields] = useState<(string | null)[]>(initialGroupBy ? [initialGroupBy] : []);
  const [groupDirections, setGroupDirections] = useState<Record<string, "asc" | "desc">>({});
  const [frozenColumnKey, setFrozenColumnKey] = useState<string | null>(null);
  
  // --- Mobile view state ---
  const [mobileViewMode, setMobileViewMode] = useState<'table' | 'cards'>('table');

  // --- USER-SPECIFIC STATE (persisted for the current user/browser) ---
   const [searchTerm, setSearchTerm] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState<FilterGroup[]>([]);
  const [activeView, setActiveView] = useState(views[0]?.id || "");

  // Get current view config and filters
  const currentView = useMemo(() => views.find(v => v.id === activeView), [views, activeView]);
  const activeViewFilters = useMemo(() => currentView?.filters || {}, [currentView]);

  // Use the apiEndpoint from the selected view if present, otherwise fallback to the prop
  const effectiveApiEndpoint = currentView?.apiEndpoint || apiEndpoint;

  // --- MODIFIED: Role-based & User-Specific Column Layout Logic ---
  // This logic now correctly loads the most specific layout available for the user.
  const getLayoutKeys = (userId?: string | null) => {
    const prefix = userId ? `user-${userId}-view-${viewId}` : `global-view-${viewId}`;
    return {
      orderKey: `column-order-${prefix}`,
      hiddenKey: `hidden-columns-${prefix}`,
    };
  };

  const [columnOrder, setColumnOrder] = useLocalStorageState<string[]>(
    getLayoutKeys(user?.id).orderKey,
    (() => {
      const userKeys = getLayoutKeys(user?.id);
      const guestKeys = getLayoutKeys(); // No user ID for guest/global

      const userOrder = localStorage.getItem(userKeys.orderKey);
      if (userOrder) return JSON.parse(userOrder) as string[];

      const guestOrder = localStorage.getItem(guestKeys.orderKey);
      if (guestOrder) return JSON.parse(guestOrder) as string[];

      return columns.map(c => c.key);
    })()
  );

  const [hiddenColumns, setHiddenColumns] = useLocalStorageState<string[]>(
    getLayoutKeys(user?.id).hiddenKey,
    (() => {
      const userKeys = getLayoutKeys(user?.id);
      const guestKeys = getLayoutKeys();

      const userHidden = localStorage.getItem(userKeys.hiddenKey);
      if (userHidden) return JSON.parse(userHidden) as string[];

      const guestHidden = localStorage.getItem(guestKeys.hiddenKey);
      if (guestHidden) return JSON.parse(guestHidden) as string[];

      return [];
    })()
  );
  
  const [viewColumnSizing, setViewColumnSizing] = useLocalStorageState<Record<string, Record<string, number>>>(`${localStorageKeyPrefix}-viewColumnSizing`, {});

  useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      const rules = Object.entries(initialFilters).map(([field, value]) => ({
        id: `rule_${field}_${Date.now()}`,
        field,
        operator: "contains", // Use 'contains' for flexible searching
        value: String(value),
      }));
      setAdvancedFilters([{ id: `group_${Date.now()}`, rules, logic: "AND" }]);
    } else if (initialFilters === undefined) {
      // This allows clearing filters when the search is reset
      setAdvancedFilters([]);
    }
  }, [initialFilters]);

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

const handleCellEdit = async (rowIndex: number, column: Column, newValue: any) => {
  // Get the updated row
  const updatedRow = { ...finalItems[rowIndex], [column.key]: newValue };

  // Set LastModifiedBy to current user's email
  if (user?.email) {
    updatedRow.LastModifiedBy = user.email;
  }

  // Remove audit fields (backend sets them)
  delete updatedRow.LastModifiedTimestamp;

  // Exit edit mode immediately
  setEditingCell(null);

  // Don't save if the value hasn't changed
  if (finalItems[rowIndex][column.key] === newValue) {
    return;
  }

  const savingToast = toast.loading(`Updating ${column.label}...`);

  // Determine endpoint and row id key
  let endpoint = "";
let rowId = "";

if (effectiveApiEndpoint.includes("digitalrecording")) {
  endpoint = "/digitalrecording";
  rowId = updatedRow.RecordingCode;
} else if (effectiveApiEndpoint.includes("auxfiles")) {
  endpoint = "/auxfiles";
  rowId = updatedRow.AuxCode; // <-- FIXED HERE
} else if (effectiveApiEndpoint.includes("newmedialog")) {
  endpoint = "/newmedialog";
  rowId = updatedRow.MLUniqueID;
} else if (effectiveApiEndpoint.includes("events")) {
  endpoint = "/events";
  rowId = updatedRow.EventID;
} else if (effectiveApiEndpoint.includes("audio")) {
  endpoint = "/audio";
  rowId = updatedRow.AID;
} else if (effectiveApiEndpoint.includes("bhajantype")) {
  endpoint = "/bhajantype";
  rowId = updatedRow.BTID;
} else if (effectiveApiEndpoint.includes("digitalmastercategory")) {
  endpoint = "/digital-master-category";
  rowId = updatedRow.DMCID;
} else if (effectiveApiEndpoint.includes("distributionlabel")) {
  endpoint = "/distribution-label";
  rowId = updatedRow.LabelID;
} else if (effectiveApiEndpoint.includes("editingtype")) {
  endpoint = "/editing-type";
  rowId = updatedRow.EdID;
} else if (effectiveApiEndpoint.includes("editingstatus")) {
  endpoint = "/editing-status";
  rowId = updatedRow.EdID;
} else if (effectiveApiEndpoint.includes("eventcategory")) {
  endpoint = "/event-category";
  rowId = updatedRow.EventCategoryID;
} else if (effectiveApiEndpoint.includes("footagetype")) {
  endpoint = "/footage-type";
  rowId = updatedRow.FootageID;
} else if (effectiveApiEndpoint.includes("formattype")) {
  endpoint = "/format-type";
  rowId = updatedRow.FTID;
} else if (effectiveApiEndpoint.includes("granths")) {
  endpoint = "/granths";
  rowId = updatedRow.ID;
} else if (effectiveApiEndpoint.includes("language")) {
  endpoint = "/language";
  rowId = updatedRow.STID;
} else if (effectiveApiEndpoint.includes("master-quality")) {
  endpoint = "/master-quality";
  rowId = updatedRow.MQID;
} else if (effectiveApiEndpoint.includes("organizations")) {
  endpoint = "/organizations";
  rowId = updatedRow.OrganizationID;
} else if (effectiveApiEndpoint.includes("neweventcategory")) {
  endpoint = "/new-event-category";
  rowId = updatedRow.SrNo || updatedRow.CategoryID;
} else if (effectiveApiEndpoint.includes("newcities")) {
  endpoint = "/new-cities";
  rowId = updatedRow.CityID;
} else if (effectiveApiEndpoint.includes("newcountries")) {
  endpoint = "/new-countries";
  rowId = updatedRow.CountryID;
} else if (effectiveApiEndpoint.includes("newstates")) {
  endpoint = "/new-states";
  rowId = updatedRow.StateID;
} else if (effectiveApiEndpoint.includes("occasions")) {
  endpoint = "/occasions";
  rowId = updatedRow.OccasionID;
} else if (effectiveApiEndpoint.includes("topicnumbersource")) {
  endpoint = "/topic-number-source";
  rowId = updatedRow.TNID;
} else if (effectiveApiEndpoint.includes("time-of-day")) {
  endpoint = "/time-of-day";
  rowId = updatedRow.TimeID;
}  else if (effectiveApiEndpoint.includes("aux-file-type")) {
  endpoint = "/aux-file-type";
  rowId = updatedRow.AuxTypeID;
} else if (effectiveApiEndpoint.includes("topic-given-by")) {
  endpoint = "/topic-given-by";
  rowId = updatedRow.TGBID;
} else {
  endpoint = effectiveApiEndpoint.startsWith("/") ? effectiveApiEndpoint : `/${effectiveApiEndpoint}`;
  rowId = updatedRow[idKey];
}
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}/${rowId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedRow),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to save changes.');
    }

    toast.success("Update saved successfully!", { id: savingToast });
    // Refetch data to show the update
    await queryClient.invalidateQueries({ queryKey: [endpoint] });

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
    createdAt: new Date().toISOString(),
    createdBy: user?.email || "", // <-- Add this line!
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
    // This effect might not be needed anymore with the new logic,
    // but we'll keep it to ensure views are reset correctly.
    // The primary logic is now in the useMemo hook above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, columns.map(col => col.key).join(",")]);

  // Get current column order and sizing for the active view
  const columnSizing = viewColumnSizing[activeView] || {};

  const itemsPerPage = 50;

  // Set active view when views change
  useEffect(() => { setActiveView(views[0]?.id || ""); }, [views]);

  // --- MODIFIED: Determine active sort fields from state ---
  const activeSortBy = sortByFields.map(f => f.key).join(',');
  const activeSortDirection = sortByFields.map(f => f.direction).join(',');

  // --- MODIFIED: Check if any grouping is active ---
  const isGroupingActive = groupByFields.some(field => field && field !== "none");

  // --- NEW: Determine if we need to fetch all data ---
  // Fetch all data if grouping is active. Sorting is now handled by the API.
  const shouldFetchAllForGrouping = isGroupingActive;

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
    activeSortBy, // <-- Pass the combined string
    activeSortDirection, // <-- Pass the combined string
  ],
  queryFn: () =>
    fetchDataFromApi({
      apiEndpoint: effectiveApiEndpoint,
      page: currentPage,
      limit: itemsPerPage,
      searchTerm,
      filters: activeViewFilters,
      advancedFilters,
      sortBy: activeSortBy, // <-- Pass the combined string
      sortDirection: activeSortDirection as "asc" | "desc", // <-- Pass the combined string
    }),
  enabled: !shouldFetchAllForGrouping,
  staleTime: 60 * 1000, // 1 minute
  placeholderData: previous => previous, // <-- This keeps previous data while fetching
});

const { data: allDataForGrouping, isLoading: isGroupingDataLoading } = useQuery<ApiResponse>({
  queryKey: [
    effectiveApiEndpoint,
    'all-for-grouping',
    searchTerm,
    JSON.stringify(activeViewFilters),
    JSON.stringify(advancedFilters),
    activeSortBy, // <-- Pass the combined string
    activeSortDirection, // <-- Pass the combined string
  ],
  queryFn: () =>
    fetchDataFromApi({
      apiEndpoint: effectiveApiEndpoint,
      page: 1,
      limit: 1000000,
      searchTerm,
      filters: activeViewFilters,
      advancedFilters,
      sortBy: activeSortBy, // <-- Pass the combined string
      sortDirection: activeSortDirection as "asc" | "desc", // <-- Pass the combined string
    }),
  enabled: shouldFetchAllForGrouping,
  staleTime: 60 * 1000,
  placeholderData: previous => previous,
});

  // --- Data and pagination ---
  // Use all data if grouping, otherwise use paginated data. Both are now sorted by the API.
  let allItems = shouldFetchAllForGrouping ? (allDataForGrouping?.data || []) : (queryData?.data || []);
  
  // --- NEW: Apply keyMap transformation if it exists ---
  const transformedApiItems = useMemo(() => {
    if (!keyMap || Object.keys(keyMap).length === 0) {
      return allItems;
    }
    return allItems.map(item => {
      const newItem: Record<string, any> = {};
      for (const key in item) {
        const newKey = keyMap[key] || key;
        newItem[newKey] = item[key];
      }
      return newItem;
    });
  }, [allItems, keyMap]);

  // Apply optional rowTransformer (provided by App.tsx for digitalrecordings)
  const transformedItems = React.useMemo(() => {
    if (!rowTransformer || typeof rowTransformer !== "function") return transformedApiItems;
    try {
      return (transformedApiItems || []).map((r: any) => rowTransformer(r));
    } catch (e) {
      console.error("rowTransformer error:", e);
      return transformedApiItems;
    }
  }, [transformedApiItems, rowTransformer]);
  
  // Use transformed items as rows for sorting/grouping/pagination
  let rows = transformedItems;

  // --- REMOVED: Client-side sorting logic has been removed. ---
  // The component now relies entirely on the API for sorting.
  const sortedData = rows;

  // --- MODIFIED: Client-side pagination now uses the API-sorted data ---
  const finalItems = useMemo(() => {
    if (shouldFetchAllForGrouping) {
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return sortedData.slice(start, end);
    }
    return sortedData; // For paginated view, use the client-sorted data
  }, [sortedData, currentPage, itemsPerPage, shouldFetchAllForGrouping]);

  // Overlay any staged pendingChanges onto the finalItems so the UI shows staged edits
  const finalItemsWithPendingChanges = useMemo(() => {
    if (!pendingChanges || Object.keys(pendingChanges).length === 0) return finalItems;
    return finalItems.map(item => {
      const rowId = item[idKey];
      const changes = pendingChanges[rowId];
      if (!changes) return item;
      return { ...item, ...changes };
    });
  }, [finalItems, pendingChanges, idKey]);

  const totalItems = shouldFetchAllForGrouping ? (sortedData.length) : (queryData?.pagination?.totalItems || 0);
  const totalPages = shouldFetchAllForGrouping ? Math.ceil(totalItems / itemsPerPage) : (queryData?.pagination?.totalPages || 1);


  // Reset page when filters/search/view change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, JSON.stringify(activeViewFilters), JSON.stringify(advancedFilters), activeView, activeSortBy, activeSortDirection]);

  // --- Grouping logic ---
  // This logic now correctly operates on `sortedData` and `finalItems`.
  const groupedData: Record<string, any> = useMemo(() => {
    const activeGroupBy = groupByFields.filter((f): f is string => f !== null && f !== "none");
    if (activeGroupBy.length === 0) {
      return { "": finalItems };
    }

    const recursiveGroup = (items: ListItem[], fields: string[], level: number): Record<string, any> => {
      if (fields.length === 0) {
        return items;
      }
      const [currentField, ...restFields] = fields;
      const groupDirection = groupDirections[currentField] || "asc";

      const groups = items.reduce((acc, item) => {
        const groupValue = item[currentField] ?? "Ungrouped";
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

      const result: Record<string, any> = {};
      for (const key of sortedGroupKeys) {
        result[key] = recursiveGroup(groups[key], restFields, level + 1);
      }
      return result;
    };

    return recursiveGroup(sortedData, activeGroupBy, 0);
  }, [sortedData, finalItems, groupByFields, groupDirections]);

  // --- Export logic ---
  // MODIFIED: This function now handles the entire export process on the frontend.
  const handleExport = async () => {
    setIsExporting(true);
    toast.info("Preparing your export. This may take a moment for large datasets.");

    try {
      // 1. Fetch ALL data that matches the current filters and sorting from the API
      const allDataResponse = await fetchDataFromApi({
        apiEndpoint: effectiveApiEndpoint,
        page: 1,
        limit: 1000000, // Fetch a very large number of items to get all of them
        searchTerm,
        filters: activeViewFilters,
        advancedFilters,
        sortBy: activeSortBy,
        sortDirection: activeSortDirection as "asc" | "desc",
      });

      let itemsToExport = allDataResponse.data || [];

      // 2. Apply the same transformations as the displayed data (keyMap and rowTransformer)
      if (keyMap && Object.keys(keyMap).length > 0) {
        itemsToExport = itemsToExport.map(item => {
          const newItem: Record<string, any> = {};
          for (const key in item) {
            const newKey = keyMap[key] || key;
            newItem[newKey] = item[key];
          }
          // Ensure 'id' property exists for ListItem type
          if (!('id' in newItem)) {
            newItem.id = item.id ?? item[keyMap['id']] ?? '';
          }
          return newItem as ListItem;
        });
      }

      if (rowTransformer && typeof rowTransformer === "function") {
        itemsToExport = itemsToExport.map(r => rowTransformer(r));
      }

      if (itemsToExport.length === 0) {
        toast.warning("No data to export for the current filters.");
        setIsExporting(false);
        return;
      }

      // 3. Convert the JSON data to a CSV string using only the currently visible columns
      const headers = visibleColumns.map(col => col.label);
      const dataKeys = visibleColumns.map(col => col.key);

      const csvRows = [
        headers.map(escapeCsvValue).join(','), // Create the header row
        ...itemsToExport.map(row =>
          dataKeys.map(key => escapeCsvValue(row[key])).join(',')
        )
      ];

      const csvContent = csvRows.join('\n');

      // 4. Create a Blob from the CSV string and trigger a download in the browser
      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for Excel compatibility
      const filename = `${title.toLowerCase().replace(/\s+/g, '_')}_export_${new Date().toISOString().slice(0,10)}.csv`;

      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Export started successfully!");

    } catch (err) {
      console.error("Export error:", err);
      toast.error('Failed to export data. Please check the console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  // --- Utility functions for grouping/sorting UI ---
  const getAvailableGroupByFields = () => { return columns.filter(col => col.filterable !== false).map(col => ({ value: col.key, label: col.label })); };
  const getAvailableSortFields = () => { return columns.filter(col => col.sortable).map(col => ({ value: col.key, label: col.label })); };
  
  // --- NEW: Handler for single-column sort via table header click ---
  const handleHeaderSort = (columnKey: string) => {
    setSortByFields(prevFields => {
      // Find if the column is already being sorted
      const existingField = prevFields.find(f => f.key === columnKey);

      // If it's already the primary sort field, just toggle its direction
      if (existingField && prevFields.length === 1 && prevFields[0].key === columnKey) {
        return [{ ...existingField, direction: existingField.direction === 'asc' ? 'desc' : 'asc' }];
      }
      
      // Otherwise, make this column the single sort field
      return [{ key: columnKey, direction: 'asc' }];
    });
  };

  const getSortIcon = (columnKey: string) => {
    const sortField = sortByFields.find(f => f.key === columnKey);
    if (!sortField) return <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-50" />;
    return sortField.direction === "asc" ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />;
  };

  const visibleColumns = useMemo(() => columns.filter(col => !hiddenColumns.includes(col.key)), [columns, hiddenColumns]);

  // --- Add button handler ---
  const handleAddClick = () => {
    // TODO: Implement add logic or open a modal for adding a new item
    toast.info("Add button clicked!");
  };

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
    onColumnOrderChange: (newOrder) => {
      const newOrderArray = typeof newOrder === 'function' ? newOrder(columnOrder) : newOrder;
      setColumnOrder(newOrderArray);
    },
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

  // --- State for adding new entries ---
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<Record<string, any>>({});

  // Filter columns for form (exclude LastModifiedBy, LastModifiedTimestamp, idKey, and keys containing 'id')
  const formColumns = columns.filter(
    col =>
      col.key !== "LastModifiedBy" &&
      col.key !== "LastModifiedTimestamp" &&
      col.key !== "LastModifiedTs" &&
      col.key !== idKey &&
      !/id$/i.test(col.key) // Exclude keys ending with 'id' (case-insensitive)
  );


  // Handle input change
  const handleAddFormChange = (key: string, value: any) => {
    setAddForm(f => ({ ...f, [key]: value }));
  };

  // Handle submit
  const handleAddSubmit = async () => {
    if (!hasAccess(title, 'write')) {
      toast.error("You don't have permission to add entries.");
      setAddOpen(false);
      return;
    }
    try {
      let response;
      // Get user email if available
      const userEmail = user?.email || "";

      // Segment Category
      if (apiEndpoint === "/segment-category") {
        response = await fetch(`${API_BASE_URL}/segment-category`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            SegCatName: addForm.SegCatName || "",
            LastModifiedBy: userEmail
          }),
        });
      }
      // Topic Given By
      else if (apiEndpoint === "/topic-given-by") {
        response = await fetch(`${API_BASE_URL}/topic-given-by`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            TGB_Name: addForm.TGB_Name || "",
            LastModifiedBy: userEmail
          }),
        });
      }
      // Aux File Type
      else if (apiEndpoint === "/aux-file-type") {
        response = await fetch(`${API_BASE_URL}/aux-file-type`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            AuxFileType: addForm.AuxFileType || "",
            LastModifiedBy: userEmail
          }),
        });
      }
      // Audio
      else if (apiEndpoint === "/audio") {
        response = await fetch(`${API_BASE_URL}/audio`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            AudioList: addForm.AudioList || "",
            Distribution: addForm.Distribution || "",
            LastModifiedBy: userEmail
          }),
        });
      }
      // Bhajan Type
      else if (apiEndpoint === "/bhajan-type") {
        response = await fetch(`${API_BASE_URL}/bhajan-type`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            BhajanName: addForm.BhajanName || "",
            LastModifiedBy: userEmail
          }),
        });
      }
      // Digital Master Category
      else if (apiEndpoint === "/digital-master-category") {
        response = await fetch(`${API_BASE_URL}/digital-master-category`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            DMCategory_name: addForm.DMCategory_name || "",
            LastModifiedBy: userEmail
          }),
        });
      }
      // Distribution Label
      else if (apiEndpoint === "/distribution-label") {
        response = await fetch(`${API_BASE_URL}/distribution-label`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            LabelName: addForm.LabelName || "",
            LastModifiedBy: userEmail
          }),
        });
      }
      // Editing Type
      else if (apiEndpoint === "/editing-type") {
        response = await fetch(`${API_BASE_URL}/editing-type`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            EdType: addForm.EdType || "",
            AudioVideo: addForm.AudioVideo || "",
            LastModifiedBy: userEmail
          }),
        });
      }
      // Editing Status
      else if (apiEndpoint === "/editing-status") {
        response = await fetch(`${API_BASE_URL}/editing-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            EdType: addForm.EdType || "",
            AudioVideo: addForm.AudioVideo || "",
            LastModifiedBy: userEmail
          }),
        });
      }
      // Event Category
      else if (apiEndpoint === "/event-category") {
        response = await fetch(`${API_BASE_URL}/event-category`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            EventCategory: addForm.EventCategory || "",
            LastModifiedBy: userEmail
          }),
        });
      }
      // Footage Type
      else if (apiEndpoint === "/footage-type") {
        response = await fetch(`${API_BASE_URL}/footage-type`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            FootageTypeList: addForm.FootageTypeList || "",
            LastModifiedBy: userEmail
          }),
        });
      }
      // Format Type
      else if (apiEndpoint === "/format-type") {
        response = await fetch(`${API_BASE_URL}/format-type`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Type: addForm.Type || "",
            LastModifiedBy: userEmail
          }),
        });
      }
      // Granths
      else if (apiEndpoint === "/granths") {
        response = await fetch(`${API_BASE_URL}/granths`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Name: addForm.Name || "",
            LastModifiedBy: userEmail
          }),
        });
      }
      // Language
      else if (apiEndpoint === "/language") {
        response = await fetch(`${API_BASE_URL}/language`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            TitleLanguage: addForm.TitleLanguage || "",
            LastModifiedBy: userEmail
          }),
        });
      }
      // New Event Category
      else if (apiEndpoint === "/new-event-category") {
        response = await fetch(`${API_BASE_URL}/new-event-category`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            NewEventCategoryName: addForm.NewEventCategoryName || "",
            MARK_DISCARD: addForm.MARK_DISCARD || "0",
            LastModifiedBy: userEmail
          }),
        });
      }
      // New Cities
      else if (apiEndpoint === "/new-cities") {
        response = await fetch(`${API_BASE_URL}/new-cities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            City: addForm.City || "",
            LastModifiedBy: userEmail
          }),
        });
      }
      // New Countries
      else if (apiEndpoint === "/new-countries") {
        response = await fetch(`${API_BASE_URL}/new-countries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Country: addForm.Country || "",
            LastModifiedBy: userEmail
          }),
        });
      }
      // New States
      else if (apiEndpoint === "/new-states") {
        response = await fetch(`${API_BASE_URL}/new-states`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            State: addForm.State || "",
            LastModifiedBy: userEmail
          }),
        });
      }
      // Master Quality
      else if (apiEndpoint === "/master-quality") {
        response = await fetch(`${API_BASE_URL}/master-quality`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            MQName: addForm.MQName || "",
            LastModifiedBy: userEmail
          }),
        });
      }
      // Organizations
      else if (apiEndpoint === "/organizations") {
        response = await fetch(`${API_BASE_URL}/organizations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Organization: addForm.Organization || "",
            LastModifiedBy: userEmail
          }),
        });
      }
      // Occasions
      else if (apiEndpoint === "/occasions") {
        response = await fetch(`${API_BASE_URL}/occasions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Occasion: addForm.Occasion || "",
            LastModifiedBy: userEmail
          }),
        });
      }
      // Topic Number Source
      else if (apiEndpoint === "/topic-number-source") {
        response = await fetch(`${API_BASE_URL}/topic-number-source`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            TNName: addForm.TNName || "",
            LastModifiedBy: userEmail
          }),
        });
      }
      // Time of Day
      else if (apiEndpoint === "/time-of-day") {
        response = await fetch(`${API_BASE_URL}/time-of-day`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            TimeList: addForm.TimeList || "",
            LastModifiedBy: userEmail
          }),
        });
      }
      // Default: fallback to generic
      else {
        response = await fetch(`${API_BASE_URL}${apiEndpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...addForm, LastModifiedBy: userEmail }),
        });
      }

      if (!response.ok) throw new Error("Failed to add entry");
      toast.success("Entry added!");
      setAddOpen(false);
      setAddForm({});
      await queryClient.invalidateQueries({ queryKey: [apiEndpoint] });
    } catch (e) {
      toast.error("Failed to add entry");
    }
  };

  // --- Cell editing: always use sortedData ---
  const handleCellChange = (rowIndex: number, columnKey: string, newValue: any) => {
    // Use sortedData for editing, so it works with grouping and paging
    const item = sortedData[rowIndex];
    if (!item) return;

    const rowId = item[idKey];
    const originalValue = item[columnKey];

    setEditingCell(null);

    if (newValue === originalValue) {
      if (pendingChanges[rowId] && pendingChanges[rowId][columnKey] !== undefined) {
        setPendingChanges(prev => {
          const newRowChanges = { ...prev[rowId] };
          delete newRowChanges[columnKey];
          if (Object.keys(newRowChanges).length === 0) {
            const newTotalChanges = { ...prev };
            delete newTotalChanges[rowId];
            return newTotalChanges;
          }
          return { ...prev, [rowId]: newRowChanges };
        });
      }
      return;
    }

    setPendingChanges(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [columnKey]: newValue,
      }
    }));
  };

  // --- Bulk update: already uses sortedData ---
  const handleBulkUpdate = async () => {
    const changesToSave = Object.entries(pendingChanges);
    if (changesToSave.length === 0) {
      toast.info("No changes to save.");
      return;
    }

    const savingToast = toast.loading(`Saving ${changesToSave.length} update(s)...`);

    const updatePromises = changesToSave.map(async ([rowId, changes]) => {
      // Always search the full dataset (`sortedData`)
      const originalItem = sortedData.find(item => String(item[idKey]) === String(rowId));
      if (!originalItem) {
        return { status: 'rejected', reason: `Original item with ID ${rowId} not found.` };
      }
      const updatedRow = { ...originalItem, ...changes };
      // Add audit fields
      if (user?.email) {
        updatedRow.LastModifiedBy = user.email;
      }
      delete updatedRow.LastModifiedTimestamp;

      // Determine the correct endpoint and ID for this specific row
      let endpoint = "";
      let resolvedRowId = "";

      if (effectiveApiEndpoint.includes("digitalrecording")) {
        endpoint = "/digitalrecording";
        resolvedRowId = updatedRow.RecordingCode;
      } else if (effectiveApiEndpoint.includes("auxfiles")) {
        endpoint = "/auxfiles";
        resolvedRowId = updatedRow.AuxCode;
      } else if (effectiveApiEndpoint.includes("newmedialog")) {
        endpoint = "/newmedialog";
        resolvedRowId = updatedRow.MLUniqueID;
      } else if (effectiveApiEndpoint.includes("events")) {
        endpoint = "/events";
        resolvedRowId = updatedRow.EventID;
      } else if (effectiveApiEndpoint.includes("audio")) {
        endpoint = "/audio";
        resolvedRowId = updatedRow.AID;
      } else if (effectiveApiEndpoint.includes("bhajantype")) {
        endpoint = "/bhajantype";
        resolvedRowId = updatedRow.BTID;
      } else if (effectiveApiEndpoint.includes("digitalmastercategory")) {
        endpoint = "/digital-master-category";
        resolvedRowId = updatedRow.DMCID;
      } else if (effectiveApiEndpoint.includes("distributionlabel")) {
        endpoint = "/distribution-label";
        resolvedRowId = updatedRow.LabelID;
      } else if (effectiveApiEndpoint.includes("editingtype")) {
        endpoint = "/editing-type";
        resolvedRowId = updatedRow.EdID;
      } else if (effectiveApiEndpoint.includes("editingstatus")) {
        endpoint = "/editing-status";
        resolvedRowId = updatedRow.EdID;
      } else if (effectiveApiEndpoint.includes("eventcategory")) {
        endpoint = "/event-category";
        resolvedRowId = updatedRow.EventCategoryID;
      } else if (effectiveApiEndpoint.includes("footagetype")) {
        endpoint = "/footage-type";
        resolvedRowId = updatedRow.FootageID;
      } else if (effectiveApiEndpoint.includes("formattype")) {
        endpoint = "/formattype";
        resolvedRowId = updatedRow.FTID;
      } else if (effectiveApiEndpoint.includes("granths")) {
        endpoint = "/granths";
        resolvedRowId = updatedRow.ID;
      } else if (effectiveApiEndpoint.includes("language")) {
        endpoint = "/language";
        resolvedRowId = updatedRow.STID;
      } else if (effectiveApiEndpoint.includes("master-quality")) {
        endpoint = "/master-quality";
        resolvedRowId = updatedRow.MQID;
      } else if (effectiveApiEndpoint.includes("organizations")) {
        endpoint = "/organizations";
        resolvedRowId = updatedRow.OrganizationID;
      } else if (effectiveApiEndpoint.includes("neweventcategory")) {
        endpoint = "/new-event-category";
        resolvedRowId = updatedRow.SrNo || updatedRow.CategoryID;
      } else if (effectiveApiEndpoint.includes("newcities")) {
        endpoint = "/newcities";
        resolvedRowId = updatedRow.CityID;
      } else if (effectiveApiEndpoint.includes("newcountries")) {
        endpoint = "/newcountries";
        resolvedRowId = updatedRow.CountryID;
      } else if (effectiveApiEndpoint.includes("newstates")) {
        endpoint = "/newstates";
        resolvedRowId = updatedRow.StateID;
      } else if (effectiveApiEndpoint.includes("occasions")) {
        endpoint = "/occasions";
        resolvedRowId = updatedRow.OccasionID;
      } else if (effectiveApiEndpoint.includes("topicnumbersource")) {
        endpoint = "/topicnumbersource";
        resolvedRowId = updatedRow.TNID;
      } else if (effectiveApiEndpoint.includes("time-of-day")) {
        endpoint = "/time-of-day";
        resolvedRowId = updatedRow.TimeID;
      }  else if (effectiveApiEndpoint.includes("aux-file-type")) {
        endpoint = "/aux-file-type";
        resolvedRowId = updatedRow.AuxTypeID;
      } else if (effectiveApiEndpoint.includes("topic-given-by")) {
        endpoint = "/topic-given-by";
        resolvedRowId = updatedRow.TGBID;
      } else {
        endpoint = effectiveApiEndpoint.startsWith("/") ? effectiveApiEndpoint : `/${effectiveApiEndpoint}`;
        resolvedRowId = updatedRow[idKey];
      }

      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}/${resolvedRowId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedRow),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to update ${resolvedRowId}`);
        }
        return { status: 'fulfilled', value: resolvedRowId };
      } catch (error: any) {
        return { status: 'rejected', reason: error.message, rowId };
      }
    });

    const results = await Promise.allSettled(updatePromises);

    let successfulUpdates = 0;
    let failedUpdates = 0;

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.status === 'fulfilled') {
        successfulUpdates++;
      } else {
        failedUpdates++;
        const reason = result.status === 'rejected' ? result.reason : (result.value as any).reason;
        console.error(`Failed to update an item:`, reason);
      }
    });

    if (failedUpdates > 0) {
      toast.error(`${failedUpdates} update(s) failed. ${successfulUpdates} saved.`, { id: savingToast });
    } else {
      toast.success(`${successfulUpdates} update(s) saved successfully!`, { id: savingToast });
    }

    setPendingChanges({});
    await queryClient.invalidateQueries({ queryKey: [effectiveApiEndpoint] });
  };
  // Handler to discard pending changes
  const handleDiscardChanges = () => {
    setPendingChanges({});
    toast.info("All pending changes discarded.");
  };

  // --- Render ---
  return (
    <div className={`${isMobile ? 'p-2 space-y-3' : 'p-6 space-y-4'}`}>
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
        currentUser={user ? { email: user.email, role: user.role } : { email: '', role: '' }}
      />
      {/* Main card container */}
      <Card className="border-0 shadow-sm bg-card">
        {/* Card header: tabs, export, filters, grouping, sorting, column hiding, search */}
        <CardHeader className="p-6 border-b bg-muted/20 rounded-t-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Mobile: Title and table indicator */}
            {isMobile ? (
              <div className="flex items-center gap-3 w-full">
                {/* Mobile View Toggle */}
                <div className="flex bg-white rounded-md border border-gray-200 p-1">
                  <button
                    onClick={() => setMobileViewMode('table')}
                    className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                      mobileViewMode === 'table'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    <TableIcon className="w-3 h-3" />
                    Table
                  </button>
                  <button
                    onClick={() => setMobileViewMode('cards')}
                    className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                      mobileViewMode === 'cards'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    <Grid className="w-3 h-3" />
                    Cards
                  </button>
                </div>
                <div className="ml-auto flex gap-2">
                  {/* --- NEW: Bulk Edit Buttons for Mobile --- */}
                  {Object.keys(pendingChanges).length > 0 && (
                    <>
                      <Button variant="destructive" size="sm" className="gap-2 h-8" onClick={handleDiscardChanges}>
                        <X className="w-4 h-4" />
                      </Button>
                      <Button variant="default" size="sm" className="gap-2 h-8" onClick={handleBulkUpdate}>
                        Save ({Object.keys(pendingChanges).length})
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm" className="gap-2 h-8 text-xs border-slate-600 text-white hover:bg-slate-800" onClick={handleExport} disabled={isExporting}>
                    {isExporting ? (<Loader2 className="w-3 h-3 animate-spin" />) : (<Download className="w-3 h-3" />)}
                    {isExporting ? 'Export' : 'Export'}
                  </Button>
                  {showAddButton && hasAccess(title, 'write') && (
                    <Button variant="default" size="sm" className="gap-2 h-8" onClick={() => setAddOpen(true)}>
                      + Add
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Desktop: Tabs for table/timeline */}
                <Tabs value="table">
                  <TabsList className="grid grid-cols-1 w-fit">
                    <TabsTrigger value="table" className="flex items-center gap-2"><TableIcon className="w-4 h-4" />Table</TabsTrigger>
                  </TabsList>
                </Tabs>
                {/* Desktop: Export button */}
                <div className="flex items-center gap-2">
                  {/* --- NEW: Bulk Edit Buttons for Desktop --- */}
                  {Object.keys(pendingChanges).length > 0 && (
                    <>
                      <Button variant="destructive" size="sm" className="gap-2 h-8" onClick={handleDiscardChanges}>
                        <X className="w-4 h-4" />
                        Discard
                      </Button>
                      <Button variant="default" size="sm" className="gap-2 h-8" onClick={handleBulkUpdate}>
                        Save Changes ({Object.keys(pendingChanges).length})
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm" className="gap-2 h-8" onClick={handleExport} disabled={isExporting}>
                    {isExporting ? (<Loader2 className="w-4 h-4 animate-spin" />) : (<Download className="w-4 h-4" />)}
                    {isExporting ? 'Exporting...' : 'Export'}
                  </Button>
                  {showAddButton && hasAccess(title, 'write') && (
                    <Button variant="default" size="sm" className="gap-2 h-8" onClick={() => setAddOpen(true)}>
                      + Add
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
          {/* Mobile-first search */}
          {isMobile && (
            <div className="pt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-10 h-10 text-base"
                />
              </div>
            </div>
          )}

          {/* Mobile vs Desktop Controls */}
          {isMobile ? (
            /* Mobile: Comprehensive controls in compact layout */
            <div className="pt-4 space-y-3">
              {/* Mobile Controls Row 1: Freeze, Filter, Sort */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Mobile Freeze Column Controls */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-8 text-xs">
                      <Pin className="w-3 h-3" />
                      {frozenColumnKey ? `Freeze: ${columns.find(c => c.key === frozenColumnKey)?.label}` : "Freeze"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-3">
                      <div className="font-medium text-sm">Freeze up to column</div>
                      <Select value={frozenColumnKey || 'none'} onValueChange={(value: string) => setFrozenColumnKey(value === 'none' ? null : value)}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select column to freeze" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No columns frozen</SelectItem>
                          {visibleColumns.map((col) => (
                            <SelectItem key={col.key} value={col.key}>{col.label}</SelectItem>
                          ))}
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

                {/* Mobile Advanced Filters */}
                <AdvancedFiltersClickUp 
                  filters={finalFilterConfigs} 
                  onFiltersChange={setAdvancedFilters} 
                  data={finalItems} 
                  onSaveFilter={handleSaveFilter} 
                />

                {/* Mobile Sort By */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-8 text-xs">
                      <ArrowUpDown className="w-3 h-3" />
                      {sortByFields.length > 0 ? `${getAvailableSortFields().find(f => f.value === sortByFields[0].key)?.label}` : "Sort"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-3">
                      <div className="font-medium text-sm">Sort by field</div>
                      <Select value={sortByFields[0]?.key || 'none'} onValueChange={(v: string) => {
                        if (v === 'none') {
                          setSortByFields([]);
                        } else {
                          setSortByFields([{ key: v, direction: 'asc' }]);
                        }
                      }}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No sorting</SelectItem>
                          {getAvailableSortFields().map((field) => (
                            <SelectItem key={field.value} value={field.value}>Sort by {field.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {sortByFields.length > 0 && (
                        <>
                          <div className="font-medium text-sm">Sort direction</div>
                          <Select value={sortByFields[0].direction} onValueChange={(value: "asc" | "desc") => {
                            const newFields = [...sortByFields];
                            newFields[0].direction = value;
                            setSortByFields(newFields);
                          }}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="asc">Ascending</SelectItem>
                              <SelectItem value="desc">Descending</SelectItem>
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                {sortByFields.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => setSortByFields([])} title="Clear sorting">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Mobile Controls Row 2: Group, Columns */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Mobile Group By */}
                <Popover>
                  <PopoverTrigger asChild>

                    <Button variant="outline" size="sm" className="gap-2 h-8 text-xs">
                      <Users className="w-3 h-3" />
                      {groupByFields[0] !== "none" ? `${getAvailableGroupByFields().find(f => f.value === groupByFields[0])?.label}` : "Group"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-3">
                      <div className="font-medium text-sm">Group by field</div>
                      <Select value={groupByFields[0] || 'none'} onValueChange={(v: string) => {
                        setGroupByFields(v === 'none' ? [] : [v]);
                        setGroupDirections(prev => ({ ...prev, [v]: "asc" }));
                      }}>
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
                      {(groupByFields[0] && groupByFields[0] !== "none") && (
                        <>
                          <div className="font-medium text-sm">Sort groups</div>
                          <Select value={groupDirections[groupByFields[0] ?? ""] ?? "asc"} onValueChange={(value: "asc" | "desc") => setGroupDirections(prev => ({...prev, [groupByFields[0] ?? ""]: value}))}>
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
                {groupByFields[0] !== "none" && (
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => setGroupByFields([])} title="Clear grouping">
                    <X className="w-4 h-4" />
                  </Button>
                )}

                {/* Mobile Column Visibility */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-8 text-xs">
                      <EyeOff className="w-3 h-3" />
                      Columns
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72" align="start">
                    <div className="space-y-3">
                      <div className="font-medium text-sm">Show/Hide Columns</div>
                      {/* --- NEW: Select/Deselect All for Mobile --- */}
                      <div className="flex items-center space-x-2 border-b pb-2 mb-2">
                        <Checkbox
                          id="mobile-select-all-columns"
                          checked={hiddenColumns.length === 0}
                          onCheckedChange={(checked) => {
                            setHiddenColumns(checked ? [] : columns.map(c => c.key));
                          }}
                        />
                        <label htmlFor="mobile-select-all-columns" className="text-sm font-medium">
                          {hiddenColumns.length > 0 ? "Show All" : "Hide All"}
                        </label>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {columns.map((column) => (
                          <div key={column.key} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`mobile-column-${column.key}`} 
                              checked={!hiddenColumns.includes(column.key)} 
                              onCheckedChange={(checked: boolean) => { 
                                setHiddenColumns(prevHidden => {
                                  if (checked) { 
                                    return prevHidden.filter(c => c !== column.key); 
                                  } else { 
                                    return [...prevHidden, column.key]; 
                                  } 
                                });
                              }} 
                            />
                            <label htmlFor={`mobile-column-${column.key}`} className="text-sm truncate">{column.label}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          ) : (
            /* Desktop: Full controls layout */
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                {/* Advanced filters */}
                <AdvancedFiltersClickUp 
                  filters={finalFilterConfigs} 
                  onFiltersChange={setAdvancedFilters} 
                  data={finalItems} 
                  onSaveFilter={handleSaveFilter} 
                />

                {/* --- Freeze Column Button & Popover --- */}
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

                {/* --- MODIFIED: Grouping controls for multiple fields --- */} 
                <div className="flex items-center gap-1">
                  <Popover>
                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="gap-2 h-8"><Users className="w-4 h-4" />Group</Button></PopoverTrigger>
                    <PopoverContent className="w-80 p-3" align="start">
                      <div className="space-y-3">
                        <div className="font-medium text-sm">Group by fields</div>
                        {groupByFields.map((field, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Select value={field || 'none'} onValueChange={(v: string) => {
                              const newFields = [...groupByFields];
                              newFields[index] = v === 'none' ? null : v;
                              setGroupByFields(newFields.filter(f => f !== null));
                            }}>
                              <SelectTrigger className="h-8 flex-1">
                                <SelectValue placeholder="Select field" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">-- No Grouping --</SelectItem>
                                {getAvailableGroupByFields().map((f) => (
                                  <SelectItem key={f.value} value={f.value} disabled={groupByFields.includes(f.value)}>{f.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                              const newFields = [...groupByFields];
                              newFields.splice(index, 1);
                              setGroupByFields(newFields);
                            }}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setGroupByFields([...groupByFields, null])}>
                          <Plus className="w-4 h-4" /> Add grouping level
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  {isGroupingActive && (<Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => setGroupByFields([])} title="Clear all groupings"><X className="w-4 h-4" /></Button>)}
                </div>
                
                {/* --- MODIFIED: Sorting controls for multiple fields --- */}
                <div className="flex items-center gap-1">
                  <Popover>
                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="gap-2 h-8"><ArrowUpDown className="w-4 h-4" />Sort</Button></PopoverTrigger>
                    <PopoverContent className="w-80 p-3" align="start">
                      <div className="space-y-3">
                        <div className="font-medium text-sm">Sort by fields</div>
                        {sortByFields.map((field, index) => (
                                                  <div key={index} className="flex items-center gap-2">
                                                    <Select value={field.key} onValueChange={(v: string) => {
                                                      const newFields = [...sortByFields];
                                                      newFields[index] = { ...newFields[index], key: v };
                                                      setSortByFields(newFields);
                                                    }}>
                                                      <SelectTrigger className="h-8 flex-1">
                                                        <SelectValue placeholder="Select field" />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        {getAvailableSortFields().map((f) => (
                                                          <SelectItem key={f.value} value={f.value} disabled={sortByFields.some(sf => sf.key === f.value)}>{f.label}</SelectItem>
                                                        ))}
                                                      </SelectContent>
                                                    </Select>
                                                    <Select value={field.direction} onValueChange={(v: "asc" | "desc") => {
                                                      const newFields = [...sortByFields];
                                                      newFields[index] = { ...newFields[index], direction: v };
                                                      setSortByFields(newFields);
                                                    }}>
                                                      <SelectTrigger className="h-8 w-28">
                                                        <SelectValue />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        <SelectItem value="asc">Ascending</SelectItem>
                                                        <SelectItem value="desc">Descending</SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                                      const newFields = [...sortByFields];
                                                      newFields.splice(index, 1);
                                                      setSortByFields(newFields);
                                                    }}>
                                                      <Trash2 className="w-4 h-4 text-destructive" />
                                                    </Button>
                                                  </div>
                                                ))}
                        <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setSortByFields([...sortByFields, { key: '', direction: 'asc' }])}>
                          <Plus className="w-4 h-4" /> Add sorting level
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                 
                  {sortByFields.length > 0 && (<Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => setSortByFields([])} title="Clear all sorting"><X className="w-4 h-4" /></Button>)}
                </div>
              </div>
              
              {/* Search and column hiding */}
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
        <EyeOff className="w-4 h-4" />Hide
      </Button>
    </PopoverTrigger>

    <PopoverContent className="w-64 max-h-72 overflow-y-auto" align="end"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "#475569 #1e293b", // subtle scrollbar colors for Firefox
      }}
    >
      <div className="space-y-3">
        <div className="font-medium">Show/Hide Columns</div>

        {/* Select/Deselect All */}
        <div className="flex items-center space-x-2 border-b pb-2 mb-2">
          <Checkbox
            id="desktop-select-all-columns"
            checked={hiddenColumns.length === 0}
            onCheckedChange={(checked) => {
              setHiddenColumns(checked ? [] : columns.map((c) => c.key));
            }}
          />
          <label
            htmlFor="desktop-select-all-columns"
            className="text-sm font-medium"
          >
            {hiddenColumns.length > 0 ? "Show All" : "Hide All"}
          </label>
        </div>

        {/* Scrollable Column List */}
        <div
          className="space-y-2 pr-1"
          style={{
            maxHeight: "200px",
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "#475569 #f0f2f5ff",
          }}
        >
          {columns.map((column) => (
            <div key={column.key} className="flex items-center space-x-2">
              <Checkbox
                id={`column-${column.key}`}
                checked={!hiddenColumns.includes(column.key)}
                onCheckedChange={(checked: boolean) => {
                  setHiddenColumns((prevHidden) => {
                    if (checked) {
                      return prevHidden.filter((c) => c !== column.key);
                    } else {
                      return [...prevHidden, column.key];
                    }
                  });
                }}
              />
              <label
                htmlFor={`column-${column.key}`}
                className="text-sm text-foreground"
              >
                {column.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </PopoverContent>
  </Popover>
</div>

            </div>
          )}
        </CardHeader>
        {/* Card content: table or timeline */}
        <CardContent className="p-0">
            <div className={`${isMobile ? 'overflow-y-auto mobile-scroll' : 'overflow-x-auto'} relative custom-scrollbar`} style={{ maxHeight: isMobile ? 'calc(100vh - 280px)' : '60vh' }}>
              {/* Initial loading state (blocks the whole view) */}
              {(isLoading || isGroupingDataLoading) && <div className="p-8 text-center flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading...</div>}
              
              {/* Error state */}
              {error && <div className="p-8 text-center text-red-500">Error: {(error as Error).message}</div>}

              {/* Empty state */}
              {!(isLoading || isGroupingDataLoading) && finalItems.length === 0 && <div className="p-8 text-center">No results found.</div>}
              
              {/* Data display */}
              {finalItems.length > 0 && (
                <div className={`transition-opacity duration-300 ${isFetching && !isLoading && !isGroupingDataLoading ? 'opacity-50' : 'opacity-100'}`}>
                  {/* Mobile view: Full table functionality with mobile responsiveness */}
                  {isMobile ? (
                    <div className="p-2 pb-6">
                      <MobileTable
                        items={finalItems}
                        columns={visibleColumns as any}
                        onRowSelect={(item) => onRowSelect?.(item as any)}
                        onSort={handleHeaderSort} // onSort is now handled by the popover
                        getSortIcon={getSortIcon}
                        groupedData={groupedData as any}
                        activeGroupBy={groupByFields.join(',')}
                        activeView={activeView}
                        idKey={idKey}
                        isLoading={isLoading || isGroupingDataLoading}
                        frozenColumnKey={frozenColumnKey}
                        columnOrder={columnOrder}
                        columnSizing={columnSizing}
                        editingCell={editingCell}
                        editValue={editValue}
                        setEditValue={setEditValue}
                        setEditingCell={setEditingCell}
                        // Pass all the state management props
                        sortBy={activeSortBy}
                        sortDirection={activeSortDirection as "asc" | "desc"}
                        setSortBy={(v) => setSortByFields(v === 'none' ? [] : [{key: v, direction: 'asc'}])}
                        setSortDirection={(v) => setSortByFields(prev => prev.length > 0 ? [{...prev[0], direction: v as 'asc' | 'desc'}] : [])}
                        groupBy={groupByFields[0] || 'none'}
                        groupDirection={groupDirections[groupByFields[0] || ''] || 'asc'}
                        setGroupBy={(field) => setGroupByFields(field === 'none' ? [] : [field])}
                        setGroupDirection={(dir) => setGroupDirections(prev => ({...prev, [groupByFields[0] || '']: dir}))}
                        setFrozenColumnKey={setFrozenColumnKey}
                        hiddenColumns={hiddenColumns}
                        setHiddenColumns={setHiddenColumns}
                        sortedData={sortedData}
                        viewMode={mobileViewMode}
                        setViewMode={setMobileViewMode}
                        handleUpdateCell={handleUpdateCell}
                          handleCellDoubleClick={handleCellDoubleClick}
                         isMobile={isMobile}
                           handleCellEdit={(rowIndex, column, newValue) => handleCellChange(rowIndex, column.key, newValue)}
                      />
                    </div>
                  ) : (
                    /* Desktop view: Full table with drag, resize, grouping, sorting, selection */
                    <DraggableResizableTable
                      data={finalItemsWithPendingChanges}
                      columns={visibleColumns as any}
                      onRowSelect={(item) => onRowSelect?.(item as any)}
                      onSort={handleHeaderSort} // onSort is now handled by the popover
                      getSortIcon={getSortIcon}
                      groupedData={groupedData as any}
                      groupByFields={groupByFields.filter(f => f).map(f => ({ key: f!, direction: groupDirections[f!] || 'asc' }))}
                      idKey={idKey}
                       handleCellEdit={(rowIndex, column, newValue) => handleCellChange(rowIndex, column.key, newValue)}
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
                      setViewColumnOrder={setColumnOrder}
                    />
                  )}
                </div>
              )}

              {/* Background fetching indicator (buffering) */}
              {isFetching && !isLoading && !isGroupingDataLoading && (
               <div className="fixed inset-0 z-50 flex items-center justify-center">
  <div className="bg-background/80 backdrop-blur-sm text-foreground rounded-full px-4 py-2 text-xs flex items-center gap-2 shadow-lg border">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span>Buffering...</span>
  </div>
</div>

              )}
            </div>
        </CardContent>
        {/* Pagination and results count */}
        { !(isLoading || isGroupingDataLoading) && totalItems > 0 &&
          <div className={`border-t ${isMobile ? 'p-4 space-y-3' : 'p-6'}`}>
            {/* Mobile Layout */}
            {isMobile ? (
              <div className="space-y-3">
                {/* Results count and clear filters */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{totalItems} results</span>
                  {(advancedFilters.some(group => group.rules.length > 0) || Object.keys(activeViewFilters).length > 0) && (
                    <Button 
                      
                      variant="ghost" 
                      size="sm" 
                      onClick={() => { 
                        setAdvancedFilters([]); 
                        setActiveView(views[0]?.id || ""); 
                      }} 
                      className="text-muted-foreground hover:text-foreground text-xs h-8"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
                
                {/* Pagination */}
                {!(isGroupingActive && totalPages <= 1) && (
                  <SimplePagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={(p) => setCurrentPage(Number(p))}
                  />
                )}
              </div>
            ) : (
              /* Desktop Layout */
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div><span>{totalItems} results</span></div>
                {/* Show pagination unless grouping is active and there's only one page */}
                {!(isGroupingActive && totalPages <= 1) && (
                  <div className="flex items-center gap-4">
                      {(advancedFilters.some(group => group.rules.length > 0) || Object.keys(activeViewFilters).length > 0) && (
                          <Button variant="ghost" size="sm" onClick={() => { setAdvancedFilters([]); setActiveView(views[0]?.id || ""); }} className="text-muted-foreground hover:text-foreground">Clear filters</Button>
                      )}
                      <SimplePagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => setCurrentPage(Number(p))}/>
                  </div>
                )}
              </div>
            )}
          </div>
        }
      </Card>

      {/* Add Entry Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New {title}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={e => {
              e.preventDefault();
              handleAddSubmit();
            }}
            className="space-y-6"
          >
            {formColumns.map(col => (
              <div key={col.key}>
                <label className="block text-sm font-medium mb-2">{col.label}</label>
                <Input
                  value={addForm[col.key] || ""}
                  onChange={e => handleAddFormChange(col.key, e.target.value)}
                  required
                />
              </div>
            ))}
           <DialogFooter>
  {isMobile ? (
    // Mobile: Stack buttons vertically, full width, larger touch targets
    <div className="flex flex-col gap-2 w-full">

       <Button
        type="submit"
        variant="default"
        className="w-full h-12 text-base"
        disabled={!hasAccess(title, 'write')}
      >
        Add
      </Button>
      
      <Button
        type="button"
        variant="outline"
        onClick={() => setAddOpen(false)}
        className="w-full h-12 text-base"
      >
        Cancel
      </Button>
     
    </div>
  ) : (
    // Desktop: Side by side, fixed width
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setAddOpen(false)}
        style={{ width: "120px" }}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        variant="default"
        style={{ width: "120px" }}
        disabled={!hasAccess(title, 'write')}
      >
        Add
      </Button>
    </>
  )}
</DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}