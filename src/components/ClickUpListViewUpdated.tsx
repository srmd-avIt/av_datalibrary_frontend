/// <reference types="vite/client" />
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
  Settings2, EyeOff, X, Funnel, Loader2, Pin, Grid, Plus, Trash2, CheckCircle2,
  ChevronLeft, ChevronRight, ChevronDown, Menu
} from "lucide-react";
import { AdvancedFiltersClickUp } from "./AdvancedFiltersClickUp";
import { SavedFilterTabs } from "./SavedFilterTabs"; 
import { Column, ListItem } from "./types"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { ManageColumnsDialog } from "./ManageColumnsDialog"; 

import useLocalStorageState from "../hooks/useLocalStorageState"; 
import { useAuth } from "../contexts/AuthContext"; 
import { useQueryClient } from "@tanstack/react-query"; 
import { toast } from "sonner"; 
import '../styles/globals.css';
import { useDebounce } from "../hooks/useDebounce";

// --- Interfaces ---
interface FilterConfig { key: string; label: string; type: "text" | "select" | "date" | "number"; options?: { value: string; label: string; }[]; }
interface ViewConfig {
  id: string;
  name: string;
  filters?: Record<string, any>;
  groupBy?: string;
  sortBy?: string; 
  sortDirection?: string; 
  apiEndpoint?: string;
}
interface FilterGroup { id: string; rules: FilterRule[]; logic: "AND" | "OR"; }
interface FilterRule { id: string; field: string; operator: string; value: any; logic?: "AND" | "OR"; }

interface SavedFilter {
  id: string;
  name: string;
  filterGroups: FilterGroup[];
  createdAt: string;
  createdBy: string;
}

interface SortField {
  key: string;
  direction: "asc" | "desc";
}

interface ApiResponse {
  data: ListItem[];
  pagination: {
    totalPages: number;
    totalItems: number;
  };
}

// --- API Fetcher Function ---
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
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (searchTerm) params.append("search", searchTerm);

  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "all") {
      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (v !== null && v !== "") params.append(key, String(v));
        });
      } else {
        params.append(key, String(value));
      }
    }
  });

  if (advancedFilters && advancedFilters.length > 0) {
    const sanitizedGroups = advancedFilters
      .map((group) => ({
        ...group,
        rules: group.rules.filter(
          (rule) =>
            rule.field && rule.operator && rule.value !== undefined && rule.value !== null && rule.value !== ""
        ),
      }))
      .filter((group) => group.rules.length > 0);

    if (sanitizedGroups.length > 0) {
      params.append("advanced_filters", JSON.stringify(sanitizedGroups));
    }
  }

  if (sortBy && sortBy !== "none") {
    params.append("sortBy", sortBy);
    params.append("sortDirection", sortDirection || "asc");
  }

  if (!API_BASE_URL) throw new Error("API URL not configured. Set VITE_API_URL in .env");

  const url = new URL(API_BASE_URL);
  url.pathname += apiEndpoint.startsWith("/") ? apiEndpoint : `/${apiEndpoint}`;
  url.search = params.toString();

  const token = localStorage.getItem('app-token');

  const response = await fetch(url.href, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '', 
    }
  });

  if (response.status === 401 || response.status === 403) {
    console.error("JWT Token is invalid or missing. Redirecting to login...");
    localStorage.removeItem('app-token');
    localStorage.removeItem('google-token');
    window.location.href = '/'; 
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    
  return response.json();
}

// --- SimplePagination ---
function SimplePagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void; }) {
  const [jump, setJump] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const go = (page: number) => { 
    const p = Math.max(1, Math.min(Math.max(1, totalPages), Math.floor(Number(page) || 1))); 
    if (p !== currentPage) onPageChange(p); 
  };

  const renderMobile = () => (
    <div className="flex flex-col gap-1 w-full px-1">
      <div className="text-center text-[11px] text-slate-400 mb-1">
        Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{Math.max(1, totalPages)}</strong>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button size="sm" onClick={() => go(currentPage - 1)} disabled={currentPage <= 1} style={{ flex: 1, height: "26px", fontSize: "11px", backgroundColor: "#1e293b", border: "1px solid #334155", color: "white", borderRadius: "6px", padding: "0 6px" }}>
          Prev
        </Button>
        <div className="flex items-center gap-1 min-w-0">
          <Input type="number" min={1} max={Math.max(1, totalPages)} placeholder="Pg" value={jump} onChange={(e: any) => setJump(e.target.value)} onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { go(Number(jump)); setJump(''); } }} style={{ width: "45px", height: "26px", fontSize: "11px", textAlign: "center", backgroundColor: "#0f172a", border: "1px solid #334155", color: "white", borderRadius: "6px", padding: "0 4px" }} />
          <Button size="sm" onClick={() => { go(Number(jump)); setJump(''); }} style={{ height: "26px", fontSize: "11px", backgroundColor: "#3b82f6", color: "white", borderRadius: "6px", padding: "0 8px" }}>
            Go
          </Button>
        </div>
        <Button size="sm" onClick={() => go(currentPage + 1)} disabled={currentPage >= Math.max(1, totalPages)} style={{ flex: 1, height: "26px", fontSize: "11px", backgroundColor: "#1e293b", border: "1px solid #334155", color: "white", borderRadius: "6px", padding: "0 6px" }}>
          Next
        </Button>
      </div>
    </div>
  );

  const renderDesktop = () => (
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

  return isMobile ? renderMobile() : renderDesktop();
}

const escapeCsvValue = (value: any): string => {
  if (value == null) return '';
  const stringValue = String(value);
  if (/[",\r\n]/.test(stringValue)) {
    const escapedValue = stringValue.replace(/"/g, '""');
    return `"${escapedValue}"`;
  }
  return stringValue;
};

// --- Main Component ---
export function ClickUpListViewUpdated({
  title,
  columns,
  apiEndpoint,
  viewId,
  keyMap,
  filterConfigs = [],
  views = [],
  onRowSelect,
  idKey,
  showAddButton = false,
  rowTransformer,
  initialGroupBy,
  initialSortBy,
  initialSortDirection,
  groupEnabled,
  initialFilters,
  onViewChange,
  onOpenSidebar
}: {
  title: string;
  columns: Column[];
  apiEndpoint: string;
  viewId: string;
  keyMap?: Record<string, string>;
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
  onOpenSidebar?: () => void;
}) {
  const localStorageKeyPrefix = `view-${viewId}`;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Custom Mobile States
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [mobileSelectedRow, setMobileSelectedRow] = useState<any | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [groupLimits, setGroupLimits] = useState<Record<string, number>>({});
  
  // State to track which specific ENTIRE COLUMNS are expanded on mobile
  const [expandedColumns, setExpandedColumns] = useState<Record<string, boolean>>({});
  

  useEffect(() => {
    const checkMobile = () => {
      const mobileState = window.innerWidth <= 768;
      setIsMobile(mobileState);
      // Dark theme background & class for mobile view targeting
      if (mobileState) {
        document.body.style.backgroundColor = "#0b1120";
        document.body.classList.add('mobile-app-view');
      } else {
        document.body.style.backgroundColor = "";
        document.body.classList.remove('mobile-app-view');
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      document.body.style.backgroundColor = "";
      document.body.classList.remove('mobile-app-view');
    };
  }, []);
  
  const [savedFilters, setSavedFilters] = useLocalStorageState<SavedFilter[]>(`global-saved-filters-${localStorageKeyPrefix}`, []);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isExporting, setIsExporting] = useState(false);
  const [activeSavedFilterName, setActiveSavedFilterName] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useLocalStorageState<Record<string, Record<string, any>>>(`${localStorageKeyPrefix}-pendingChanges`, {});
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnKey: string } | null>(null);
  const [editValue, setEditValue] = useState<any>('');

  const [sortByFields, setSortByFields] = useState<SortField[]>(() => {
    if (!initialSortBy) return [];
    const keys = initialSortBy.split(',');
    const directions = (initialSortDirection || '').split(',');
    return keys.map((key, i) => ({
      key,
      direction: directions[i] === 'desc' ? 'desc' : 'asc',
    }));
  });

  const [groupByFields, setGroupByFields] = useState<(string | null)[]>(initialGroupBy ? [initialGroupBy] : []);
  const [groupDirections, setGroupDirections] = useState<Record<string, "asc" | "desc">>({});
  const [frozenColumnKey, setFrozenColumnKey] = useState<string | null>(null);

  // Clear expanded state and limits if group fields change
  useEffect(() => {
    setExpandedGroups({});
    setGroupLimits({});
    setExpandedColumns({});
  }, [groupByFields]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [advancedFilters, setAdvancedFilters] = useState<FilterGroup[]>([]);
  const [activeView, setActiveView] = useState(views[0]?.id || "");

  const currentView = useMemo(() => views.find(v => v.id === activeView), [views, activeView]);
  const activeViewFilters = useMemo(() => currentView?.filters || {}, [currentView]);
  const effectiveApiEndpoint = currentView?.apiEndpoint || apiEndpoint;

  const getLayoutKeys = (userId?: string | null) => {
    const prefix = userId ? `user-${userId}-view-${viewId}` : `global-view-${viewId}`;
    return { orderKey: `column-order-${prefix}`, hiddenKey: `hidden-columns-${prefix}` };
  };

  const [columnOrder, setColumnOrder] = useLocalStorageState<string[]>(
    getLayoutKeys(user?.id).orderKey,
    (() => {
      const userKeys = getLayoutKeys(user?.id);
      const guestKeys = getLayoutKeys();
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

  const hasAccess = useMemo(() => {
    return (resourceName: string, accessLevel: 'read' | 'write' = 'read'): boolean => {
      if (!user) return false;
      if (user.role === 'Admin' || user.role === 'Owner') return true;
      const permission = user.permissions.find((p) => p.resource === resourceName);
      if (!permission) return false;
      return permission.actions.includes(accessLevel);
    };
  }, [user]);

  const handleCellDoubleClick = (rowIndex: number, column: Column, value: any) => {
    if (!column.editable) return;
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
    setEditingCell(null);
    if (editValue === originalValue) return;

    const savingToast = toast.loading(`Updating ${columnKey}...`);
    try {
      const token = localStorage.getItem('app-token');
      const response = await fetch(`${API_BASE_URL}${effectiveApiEndpoint}/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '', 
        },
        body: JSON.stringify({ [columnKey]: editValue }),
      });

      if (response.status === 401 || response.status === 403) {
        toast.error("Session expired. Please log in again.", { id: savingToast });
        localStorage.removeItem('app-token');
        localStorage.removeItem('google-token');
        setTimeout(() => { window.location.href = '/'; }, 1500);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.sqlMessage || errorData.message || errorData.error || errorData.toString() || `Failed to update ${id}`;
        toast.error(`Error: ${errorMsg}`, { id: savingToast });
        return;
      }

      toast.success("Update saved successfully!", { id: savingToast });
      await queryClient.invalidateQueries({ queryKey: [effectiveApiEndpoint] });
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: savingToast });
    }
  };

  const handleCellEdit = async (rowIndex: number, column: Column, newValue: any) => {
    const updatedRow = { ...finalItems[rowIndex], [column.key]: newValue };
    if (user?.email) updatedRow.LastModifiedBy = user.email;
    delete updatedRow.LastModifiedTimestamp;
    setEditingCell(null);
    if (finalItems[rowIndex][column.key] === newValue) return;

    const savingToast = toast.loading(`Updating ${column.label}...`);
    let endpoint = "";
    let rowId = "";

    if (effectiveApiEndpoint.includes("digitalrecording")) { endpoint = "/digitalrecording"; rowId = updatedRow.RecordingCode; }
    else if (effectiveApiEndpoint.includes("auxfiles")) { endpoint = "/auxfiles"; rowId = updatedRow.new_auxid; }
    else if (effectiveApiEndpoint.includes("newmedialog")) { endpoint = "/newmedialog"; rowId = updatedRow.MLUniqueID; }
    else if (effectiveApiEndpoint.includes("events")) { endpoint = "/events"; rowId = updatedRow.EventID; }
    else if (effectiveApiEndpoint.includes("audio")) { endpoint = "/audio"; rowId = updatedRow.AID; }
    else if (effectiveApiEndpoint.includes("bhajantype")) { endpoint = "/bhajan-type"; rowId = updatedRow.BTID; }
    else if (effectiveApiEndpoint.includes("digitalmastercategory")) { endpoint = "/digital-master-category"; rowId = updatedRow.DMCID; }
    else if (effectiveApiEndpoint.includes("distributionlabel")) { endpoint = "/distribution-label"; rowId = updatedRow.LabelID; }
    else if (effectiveApiEndpoint.includes("editingtype")) { endpoint = "/editing-type"; rowId = updatedRow.EdID; }
    else if (effectiveApiEndpoint.includes("editingstatus")) { endpoint = "/editing-status"; rowId = updatedRow.EdID; }
    else if (effectiveApiEndpoint.includes("eventcategory")) { endpoint = "/event-category"; rowId = updatedRow.EventCategoryID; }
    else if (effectiveApiEndpoint.includes("footagetype")) { endpoint = "/footage-type"; rowId = updatedRow.FootageID; }
    else if (effectiveApiEndpoint.includes("formattype")) { endpoint = "/formattype"; rowId = updatedRow.FTID; }
    else if (effectiveApiEndpoint.includes("granths")) { endpoint = "/granths"; rowId = updatedRow.ID; }
    else if (effectiveApiEndpoint.includes("language")) { endpoint = "/language"; rowId = updatedRow.STID; }
    else if (effectiveApiEndpoint.includes("master-quality")) { endpoint = "/master-quality"; rowId = updatedRow.MQID; }
    else if (effectiveApiEndpoint.includes("organizations")) { endpoint = "/organizations"; rowId = updatedRow.OrganizationID; }
    else if (effectiveApiEndpoint.includes("neweventcategory")) { endpoint = "/new-event-category"; rowId = updatedRow.SrNo || updatedRow.CategoryID; }
    else if (effectiveApiEndpoint.includes("newcities")) { endpoint = "/new-cities"; rowId = updatedRow.CityID; }
    else if (effectiveApiEndpoint.includes("newcountries")) { endpoint = "/new-countries"; rowId = updatedRow.CountryID; }
    else if (effectiveApiEndpoint.includes("newstates")) { endpoint = "/new-states"; rowId = updatedRow.StateID; }
    else if (effectiveApiEndpoint.includes("occasions")) { endpoint = "/occasions"; rowId = updatedRow.OccasionID; }
    else if (effectiveApiEndpoint.includes("topicnumbersource")) { endpoint = "/topicnumbersource"; rowId = updatedRow.TNID; }
    else if (effectiveApiEndpoint.includes("time-of-day")) { endpoint = "/time-of-day"; rowId = updatedRow.TimeID; }  
    else if (effectiveApiEndpoint.includes("aux-file-type")) { endpoint = "/aux-file-type"; rowId = updatedRow.AuxTypeID; }
    else if (effectiveApiEndpoint.includes("topic-given-by")) { endpoint = "/topic-given-by"; rowId = updatedRow.TGBID; }
    else { endpoint = effectiveApiEndpoint.startsWith("/") ? effectiveApiEndpoint : `/${effectiveApiEndpoint}`; rowId = updatedRow[idKey]; }

    try {
      const token = localStorage.getItem('app-token');
      const response = await fetch(`${API_BASE_URL}${endpoint}/${rowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": token ? `Bearer ${token}` : '' },
        body: JSON.stringify(updatedRow),
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('app-token');
        localStorage.removeItem('google-token');
        window.location.href = '/'; 
        return;
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.sqlMessage || errorData.message || errorData.error || errorData.toString() || `Failed to update ${rowId}`;
        return { status: 'rejected', reason: errorMsg, rowId };
      }
      toast.success("Update saved successfully!", { id: savingToast });
      await queryClient.invalidateQueries({ queryKey: [endpoint] });
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: savingToast });
    }
  };

  const handleSaveFilter = (name: string, filterGroups: FilterGroup[]) => {
    const newSavedFilter: SavedFilter = { 
      id: `filter_${Date.now()}`, name, filterGroups, createdAt: new Date().toISOString(), createdBy: user?.email || "", 
    };
    setSavedFilters(prev => {
      const existing = prev.find(f => f.name === name);
      if (existing) return prev.map(f => f.name === name ? { ...newSavedFilter, id: existing.id } : f);
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
      if (savedFilter) setAdvancedFilters(savedFilter.filterGroups);
    } else {
      setAdvancedFilters([]);
    }
  };

  useEffect(() => {}, [activeView, columns.map(col => col.key).join(",")]);
  const columnSizing = viewColumnSizing[activeView] || {};
  const itemsPerPage = 50;
  useEffect(() => { setActiveView(views[0]?.id || ""); }, [views]);

  const activeSortBy = sortByFields.map(f => f.key).join(',');
  const activeSortDirection = sortByFields.map(f => f.direction).join(',');
  const isGroupingActive = groupByFields.some(field => field && field !== "none");
  const shouldFetchAllForGrouping = isGroupingActive;

  const finalFilterConfigs = useMemo(() => {
    if (filterConfigs && filterConfigs.length > 0) {
      return filterConfigs.map(fc => ({
        ...fc, options: fc.options ? fc.options.map(opt => typeof opt === "string" ? { value: opt, label: opt } : opt) : undefined,
      }));
    }
    return columns.filter((col) => col.filterable !== false).map((col) => ({
      key: col.key, label: col.label, type: "text" as "text", options: undefined,
    }));
  }, [columns, filterConfigs]);

  const { data: queryData, isLoading, error, isFetching } = useQuery<ApiResponse>({
    queryKey: [
      effectiveApiEndpoint, currentPage, debouncedSearchTerm, searchTerm,
      JSON.stringify(activeViewFilters), JSON.stringify(advancedFilters), JSON.stringify(initialFilters),
      activeSortBy, activeSortDirection, 
    ],
    queryFn: () => fetchDataFromApi({
      apiEndpoint: effectiveApiEndpoint, page: currentPage, limit: itemsPerPage, searchTerm: debouncedSearchTerm,
      filters: { ...activeViewFilters, ...initialFilters }, advancedFilters,
      sortBy: activeSortBy, sortDirection: activeSortDirection as "asc" | "desc", 
    }),
    enabled: !shouldFetchAllForGrouping,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: previous => previous,
  });

  const { data: allDataForGrouping, isLoading: isGroupingDataLoading } = useQuery<ApiResponse>({
    queryKey: [
      effectiveApiEndpoint, 'all-for-grouping', searchTerm,
      JSON.stringify(activeViewFilters), JSON.stringify(advancedFilters), JSON.stringify(initialFilters),
      activeSortBy, activeSortDirection, 
    ],
    queryFn: () => fetchDataFromApi({
      apiEndpoint: effectiveApiEndpoint, page: 1, limit: 1000000, searchTerm,
      filters: { ...activeViewFilters, ...initialFilters }, advancedFilters,
      sortBy: activeSortBy, sortDirection: activeSortDirection as "asc" | "desc", 
    }),
    enabled: shouldFetchAllForGrouping,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: previous => previous,
  });

  let allItems = shouldFetchAllForGrouping ? (allDataForGrouping?.data || []) : (queryData?.data || []);
  
  const transformedApiItems = useMemo(() => {
    if (!keyMap || Object.keys(keyMap).length === 0) return allItems;
    return allItems.map(item => {
      const newItem: Record<string, any> = {};
      for (const key in item) {
        const newKey = keyMap[key] || key;
        newItem[newKey] = item[key];
      }
      return newItem;
    });
  }, [allItems, keyMap]);

  const transformedItems = React.useMemo(() => {
    if (!rowTransformer || typeof rowTransformer !== "function") return transformedApiItems;
    try { return (transformedApiItems || []).map((r: any) => rowTransformer(r)); } 
    catch (e) { console.error("rowTransformer error:", e); return transformedApiItems; }
  }, [transformedApiItems, rowTransformer]);
  
  let rows = transformedItems;

  const sortedData = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    if (!activeSortBy || activeSortBy === "none") return rows;
    const keys = activeSortBy.split(',');
    const directions = (activeSortDirection || "").split(',');
    return [...rows].sort((a, b) => {
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const direction = directions[i] || 'asc';
        const dirMult = direction === 'desc' ? -1 : 1;
        const valA = a[key];
        const valB = b[key];
        if (valA === valB) continue;
        if (valA === null || valA === undefined || valA === "") return 1;
        if (valB === null || valB === undefined || valB === "") return -1;
        const strA = String(valA).trim();
        const strB = String(valB).trim();
        const isNumA = /^\d+$/.test(strA);
        const isNumB = /^\d+$/.test(strB);
        if (isNumA && !isNumB) return -1 * dirMult;
        if (!isNumA && isNumB) return 1 * dirMult;
        let comparison = 0;
        if (isNumA && isNumB) {
          comparison = Number(strA) - Number(strB);
        } else {
          comparison = strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
        }
        if (comparison !== 0) return comparison * dirMult;
      }
      return 0;
    });
  }, [rows, activeSortBy, activeSortDirection]);

  const finalItems = useMemo(() => {
    if (shouldFetchAllForGrouping) {
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return sortedData.slice(start, end);
    }
    return sortedData; 
  }, [sortedData, currentPage, itemsPerPage, shouldFetchAllForGrouping]);

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

  useEffect(() => { setCurrentPage(1); }, [searchTerm, JSON.stringify(activeViewFilters), JSON.stringify(advancedFilters), activeView, activeSortBy, activeSortDirection, JSON.stringify(initialFilters)]);

  const groupedData: Record<string, any> = useMemo(() => {
    const activeGroupBy = groupByFields.filter((f): f is string => f !== null && f !== "none");
    if (activeGroupBy.length === 0) return { "": finalItems };
    const recursiveGroup = (items: ListItem[], fields: string[], level: number): Record<string, any> => {
      if (fields.length === 0) return items;
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
        const toNum = (v: string) => { const n = Number(v); return Number.isFinite(n) ? n : null; };
        const aNum = toNum(String(a)); const bNum = toNum(String(b));
        if (aNum !== null && bNum !== null) return (aNum - bNum) * direction;
        if (aNum !== null && bNum === null) return -1 * direction;
        if (aNum === null && bNum !== null) return 1 * direction;
        const aStr = String(a).toLowerCase(); const bStr = String(b).toLowerCase();
        if (aStr < bStr) return -1 * direction;
        if (aStr > bStr) return 1 * direction;
        return 0;
      });
      const result: Record<string, any> = {};
      for (const key of sortedGroupKeys) result[key] = recursiveGroup(groups[key], restFields, level + 1);
      return result;
    };
    return recursiveGroup(sortedData, activeGroupBy, 0);
  }, [sortedData, finalItems, groupByFields, groupDirections]);

  const handleExport = async () => {
    setIsExporting(true);
    toast.info("Preparing your export. This may take a moment for large datasets.");
    try {
      const allDataResponse = await fetchDataFromApi({
        apiEndpoint: effectiveApiEndpoint, page: 1, limit: 1000000, searchTerm,
        filters: { ...activeViewFilters, ...initialFilters }, advancedFilters,
        sortBy: activeSortBy, sortDirection: activeSortDirection as "asc" | "desc",
      });
      let itemsToExport = allDataResponse.data || [];
      if (keyMap && Object.keys(keyMap).length > 0) {
        itemsToExport = itemsToExport.map(item => {
          const newItem: Record<string, any> = {};
          for (const key in item) { const newKey = keyMap[key] || key; newItem[newKey] = item[key]; }
          if (!('id' in newItem)) newItem.id = item.id ?? item[keyMap['id']] ?? '';
          return newItem as ListItem;
        });
      }
      if (rowTransformer && typeof rowTransformer === "function") {
        itemsToExport = itemsToExport.map(r => rowTransformer(r));
      }
      if (itemsToExport.length === 0) { toast.warning("No data to export for the current filters."); setIsExporting(false); return; }

      const headers = visibleColumns.map(col => col.label);
      const dataKeys = visibleColumns.map(col => col.key);

      const extractText = (value: any): string => {
        if (typeof value === "string" || typeof value === "number") return String(value);
        if (React.isValidElement(value)) {
          const props = value.props as { children?: React.ReactNode };
          const children = props && "children" in props ? props.children : undefined;
          if (children === undefined || children === null) return "";
          if (Array.isArray(children)) return children.map(extractText).join(" ");
          return extractText(children);
        }
        if (Array.isArray(value)) {
          if (value.every(v => typeof v === "string" || typeof v === "number")) return value.join(", ");
          return value.map(extractText).join(" ");
        }
        return ""; 
      };

      const csvRows = [
        headers.map(escapeCsvValue).join(','),
        ...itemsToExport.map(row => visibleColumns.map(col => {
            let value = row[col.key];
            if (typeof col.render === "function") value = col.render(value, row);
            value = extractText(value);
            return escapeCsvValue(value);
          }).join(',')
        )
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); 
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

  const getAvailableGroupByFields = () => { return columns.filter(col => col.filterable !== false).map(col => ({ value: col.key, label: col.label })); };
  const getAvailableSortFields = () => { return columns.filter(col => col.sortable).map(col => ({ value: col.key, label: col.label })); };
  
  const getSortIcon = (columnKey: string) => {
    const sortField = sortByFields.find(f => f.key === columnKey);
    if (!sortField) return <ArrowUpDown className="w-4 h-4 text-slate-400" />;
    return sortField.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };
  
  const handleHeaderSort = (columnKey: string) => {
    setSortByFields(prevFields => {
      const existingField = prevFields.find(f => f.key === columnKey);
      if (existingField && prevFields.length === 1 && prevFields[0].key === columnKey) {
        return [{ ...existingField, direction: existingField.direction === 'asc' ? 'desc' : 'asc' }];
      }
      return [{ key: columnKey, direction: 'asc' }];
    });
  };

  const visibleColumns = useMemo(() => columns.filter(col => !hiddenColumns.includes(col.key)), [columns, hiddenColumns]);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<Record<string, any>>({});
  const formColumns = columns.filter(col => col.key !== "LastModifiedBy" && col.key !== "LastModifiedTimestamp" && col.key !== "LastModifiedTs" && col.key !== idKey && !/id$/i.test(col.key));

  const handleAddFormChange = (key: string, value: any) => { setAddForm(f => ({ ...f, [key]: value })); };

  const handleAddSubmit = async () => {
    if (!hasAccess(title, 'write')) { toast.error("You don't have permission to add entries."); setAddOpen(false); return; }
    try {
      const token = localStorage.getItem('app-token');
      const userEmail = user?.email || "";
      const requestHeaders = { "Content-Type": "application/json", "Authorization": token ? `Bearer ${token}` : '' };
      let response: Response;
      
      if (apiEndpoint === "/segment-category") { response = await fetch(`${API_BASE_URL}/segment-category`, { method: "POST", headers: requestHeaders, body: JSON.stringify({ SegCatName: addForm.SegCatName || "", LastModifiedBy: userEmail }), }); }
      else if (apiEndpoint === "/topic-given-by") { response = await fetch(`${API_BASE_URL}/topic-given-by`, { method: "POST", headers: requestHeaders, body: JSON.stringify({ TGB_Name: addForm.TGB_Name || "", LastModifiedBy: userEmail }), }); }
      else if (apiEndpoint === "/aux-file-type") { response = await fetch(`${API_BASE_URL}/aux-file-type`, { method: "POST", headers: requestHeaders, body: JSON.stringify({ AuxFileType: addForm.AuxFileType || "", LastModifiedBy: userEmail }), }); }
      else if (apiEndpoint === "/audio") { response = await fetch(`${API_BASE_URL}/audio`, { method: "POST", headers: requestHeaders, body: JSON.stringify({ AudioList: addForm.AudioList || "", Distribution: addForm.Distribution || "", LastModifiedBy: userEmail }), }); }
      else if (apiEndpoint === "/bhajan-type") { response = await fetch(`${API_BASE_URL}/bhajan-type`, { method: "POST", headers: requestHeaders, body: JSON.stringify({ BhajanName: addForm.BhajanName || "", LastModifiedBy: userEmail }), }); }
      else if (apiEndpoint === "/digital-master-category") { response = await fetch(`${API_BASE_URL}/digital-master-category`, { method: "POST", headers: requestHeaders, body: JSON.stringify({ DMCategory_name: addForm.DMCategory_name || "", LastModifiedBy: userEmail }), }); }
      else if (apiEndpoint === "/distribution-label") { response = await fetch(`${API_BASE_URL}/distribution-label`, { method: "POST", headers: requestHeaders, body: JSON.stringify({ LabelName: addForm.LabelName || "", LastModifiedBy: userEmail }), }); }
      else if (apiEndpoint === "/editing-type") { response = await fetch(`${API_BASE_URL}/editing-type`, { method: "POST", headers: requestHeaders, body: JSON.stringify({ EdType: addForm.EdType || "", AudioVideo: addForm.AudioVideo || "", LastModifiedBy: userEmail }), }); }
      else if (apiEndpoint === "/editing-status") { response = await fetch(`${API_BASE_URL}/editing-status`, { method: "POST", headers: requestHeaders, body: JSON.stringify({ EdType: addForm.EdType || "", AudioVideo: addForm.AudioVideo || "", LastModifiedBy: userEmail }), }); }
      else if (apiEndpoint === "/event-category") { response = await fetch(`${API_BASE_URL}/event-category`, { method: "POST", headers: requestHeaders, body: JSON.stringify({ EventCategory: addForm.EventCategory || "", LastModifiedBy: userEmail }), }); }
      else if (apiEndpoint === "/footage-type") { response = await fetch(`${API_BASE_URL}/footage-type`, { method: "POST", headers: requestHeaders, body: JSON.stringify({ FootageTypeList: addForm.FootageTypeList || "", LastModifiedBy: userEmail }), }); }
      else if (apiEndpoint === "/format-type") { response = await fetch(`${API_BASE_URL}/format-type`, { method: "POST", headers: requestHeaders, body: JSON.stringify({ Type: addForm.Type || "", LastModifiedBy: userEmail }), }); }
      else if (apiEndpoint === "/granths") { response = await fetch(`${API_BASE_URL}/granths`, { method: "POST", headers: requestHeaders, body: JSON.stringify({ Name: addForm.Name || "", LastModifiedBy: userEmail }), }); }
      else if (apiEndpoint === "/language") { response = await fetch(`${API_BASE_URL}/language`, { method: "POST", headers: requestHeaders, body: JSON.stringify({ TitleLanguage: addForm.TitleLanguage || "", LastModifiedBy: userEmail }), }); }
      else if (apiEndpoint === "/new-event-category") { response = await fetch(`${API_BASE_URL}/new-event-category`, { method: "POST", headers: requestHeaders, body: JSON.stringify({ NewEventCategoryName: addForm.NewEventCategoryName || "", MARK_DISCARD: addForm.MARK_DISCARD || "0", LastModifiedBy: userEmail }), }); }
      else if (apiEndpoint === "/new-cities") { response = await fetch(`${API_BASE_URL}/new-cities`, { method: "POST", headers: requestHeaders, body: JSON.stringify({ City: addForm.City || "", LastModifiedBy: userEmail }), }); }
      else if (apiEndpoint === "/new-countries") { response = await fetch(`${API_BASE_URL}/new-countries`, { method: "POST", headers: requestHeaders, body: JSON.stringify({ Country: addForm.Country || "", LastModifiedBy: userEmail }), }); }
      else if (apiEndpoint === "/new-states") { response = await fetch(`${API_BASE_URL}/new-states`, { method: "POST", headers: requestHeaders, body: JSON.stringify({ State: addForm.State || "", LastModifiedBy: userEmail }), }); }
      else if (apiEndpoint === "/master-quality") { response = await fetch(`${API_BASE_URL}/master-quality`, { method: "POST", headers: requestHeaders, body: JSON.stringify({ MQName: addForm.MQName || "", LastModifiedBy: userEmail }), }); }
      else if (apiEndpoint === "/organizations") { response = await fetch(`${API_BASE_URL}/organizations`, { method: "POST", headers: requestHeaders, body: JSON.stringify({ Organization: addForm.Organization || "", LastModifiedBy: userEmail }), }); }
      else if (apiEndpoint === "/occasions") { response = await fetch(`${API_BASE_URL}/occasions`, { method: "POST", headers: requestHeaders, body: JSON.stringify({ Occasion: addForm.Occasion || "", LastModifiedBy: userEmail }), }); }
      else if (apiEndpoint === "/google-sheet/digital-recordings") {
        response = await fetch(`${API_BASE_URL}/google-sheet/digital-recordings`, {
          method: "POST", headers: requestHeaders,
          body: JSON.stringify({
            fkEventCode: addForm.fkEventCode || "", RecordingName: addForm.RecordingName || "", RecordingCode: addForm.RecordingCode || "", Duration: addForm.Duration || "", DistributionDriveLink: addForm.DistributionDriveLink || "", BitRate: addForm.BitRate || "", Dimension: addForm.Dimension || "", Masterquality: addForm.Masterquality || "", fkMediaName: addForm.fkMediaName || "", Filesize: addForm.Filesize || "", FilesizeInBytes: addForm.FilesizeInBytes || "", NoOfFiles: addForm.NoOfFiles || "", RecordingRemarks: addForm.RecordingRemarks || "", CounterError: addForm.CounterError || "", ReasonError: addForm.ReasonError || "", MasterProductTitle: addForm.MasterProductTitle || "", fkDistributionLabel: addForm.fkDistributionLabel || "", ProductionBucket: addForm.ProductionBucket || "", fkDigitalMasterCategory: addForm.fkDigitalMasterCategory || "", AudioBitrate: addForm.AudioBitrate || "", AudioTotalDuration: addForm.AudioTotalDuration || "", QcRemarksCheckedOn: addForm.QcRemarksCheckedOn || "", PreservationStatus: addForm.PreservationStatus || "", QCSevak: addForm.QCSevak || "", QcStatus: addForm.QcStatus || "", SubmittedDate: addForm.SubmittedDate || "", PresStatGuidDt: addForm.PresStatGuidDt || "", InfoOnCassette: addForm.InfoOnCassette || "", IsInformal: addForm.IsInformal || "", AssociatedDR: addForm.AssociatedDR || "", Teams: addForm.Teams || "", LastModifiedBy: userEmail,
          }),
        });
      }
      else if (apiEndpoint === "/topic-number-source") { response = await fetch(`${API_BASE_URL}/topic-number-source`, { method: "POST", headers: requestHeaders, body: JSON.stringify({ TNName: addForm.TNName || "", LastModifiedBy: userEmail }), }); }
      else if (apiEndpoint === "/time-of-day") { response = await fetch(`${API_BASE_URL}/time-of-day`, { method: "POST", headers: requestHeaders, body: JSON.stringify({ TimeList: addForm.TimeList || "", LastModifiedBy: userEmail }), }); }
      else { response = await fetch(`${API_BASE_URL}${apiEndpoint}`, { method: "POST", headers: requestHeaders, body: JSON.stringify({ ...addForm, LastModifiedBy: userEmail }), }); }

      if (response.status === 401 || response.status === 403) {
        toast.error("Session expired. Please log in again.");
        localStorage.removeItem('app-token'); localStorage.removeItem('google-token');
        setTimeout(() => { window.location.href = '/'; }, 1500); return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMsg = '';
        if (typeof errorData === 'object' && errorData !== null) {
          if (errorData.sqlMessage) errorMsg += `❌ ${errorData.sqlMessage}\n`;
          if (errorData.message) errorMsg += `Message: ${errorData.message}\n`;
          if (errorData.sql) errorMsg += `SQL:\n${errorData.sql}\n`;
          if (errorData.stack) errorMsg += `Stack:\n${errorData.stack}\n`;
          if (errorData.code) errorMsg += `Code: ${errorData.code}\n`;
          if (errorData.errno) errorMsg += `Errno: ${errorData.errno}\n`;
          if (errorData.sqlState) errorMsg += `SQLState: ${errorData.sqlState}\n`;
          if (!errorMsg) errorMsg = JSON.stringify(errorData, null, 2);
        } else { errorMsg = String(errorData) || "Failed to add entry"; }
        showErrorDialog(errorMsg, "Add Entry Error");
        toast.error("Failed to add entry"); return;
      }
      toast.success("Entry added!");
      setAddOpen(false); setAddForm({});
      await queryClient.invalidateQueries({ queryKey: [apiEndpoint] });
    } catch (e: any) {
      showErrorDialog(e?.message || String(e), "Add Entry Error");
      toast.error("Failed to add entry");
    }
  };

  const handleCellChange = (rowIndex: number, columnKey: string, newValue: any) => {
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
            const newTotalChanges = { ...prev }; delete newTotalChanges[rowId]; return newTotalChanges;
          }
          return { ...prev, [rowId]: newRowChanges };
        });
      }
      return;
    }

    setPendingChanges(prev => ({ ...prev, [rowId]: { ...prev[rowId], [columnKey]: newValue } }));
  };

  const handleBulkUpdate = async () => {
    const changesToSave = Object.entries(pendingChanges);
    if (changesToSave.length === 0) { toast.info("No changes to save."); return; }
    const savingToast = toast.loading(`Saving ${changesToSave.length} update(s)...`);

    const updatePromises = changesToSave.map(async ([rowId, changes]) => {
      const originalItem = sortedData.find(item => String(item[idKey]) === String(rowId));
      if (!originalItem) return { status: 'rejected', reason: `Original item with ID ${rowId} not found.`, rowId };
      const updatedRow = { ...originalItem, ...changes };
      if (user?.email) updatedRow.LastModifiedBy = user.email;
      delete updatedRow.LastModifiedTimestamp;

      let endpoint = ""; let resolvedRowId = "";
      if (effectiveApiEndpoint.includes("digitalrecording")) { endpoint = "/digitalrecording"; resolvedRowId = updatedRow.RecordingCode; }
      else if (effectiveApiEndpoint.includes("auxfiles")) { endpoint = "/auxfiles"; resolvedRowId = updatedRow.AuxCode; }
      else if (effectiveApiEndpoint.includes("newmedialog")) { endpoint = "/newmedialog"; resolvedRowId = updatedRow.MLUniqueID; }
      else if (effectiveApiEndpoint.includes("events")) { endpoint = "/events"; resolvedRowId = updatedRow.EventID; }
      else if (effectiveApiEndpoint.includes("non-event-production")) { endpoint = "/non-event-production"; resolvedRowId = updatedRow.SMCode; }
      else if (effectiveApiEndpoint.includes("audio")) { endpoint = "/audio"; resolvedRowId = updatedRow.AID; }
      else if (effectiveApiEndpoint.includes("bhajantype")) { endpoint = "/bhajantype"; resolvedRowId = updatedRow.BTID; }
      else if (effectiveApiEndpoint.includes("digitalmastercategory")) { endpoint = "/digital-master-category"; resolvedRowId = updatedRow.DMCID; }
      else if (effectiveApiEndpoint.includes("distributionlabel")) { endpoint = "/distribution-label"; resolvedRowId = updatedRow.LabelID; }
      else if (effectiveApiEndpoint.includes("editingtype")) { endpoint = "/editing-type"; resolvedRowId = updatedRow.EdID; }
      else if (effectiveApiEndpoint.includes("editingstatus")) { endpoint = "/editing-status"; resolvedRowId = updatedRow.EdID; }
      else if (effectiveApiEndpoint.includes("eventcategory")) { endpoint = "/event-category"; resolvedRowId = updatedRow.EventCategoryID; }
      else if (effectiveApiEndpoint.includes("footagetype")) { endpoint = "/footage-type"; resolvedRowId = updatedRow.FootageID; }
      else if (effectiveApiEndpoint.includes("formattype")) { endpoint = "/formattype"; resolvedRowId = updatedRow.FTID; }
      else if (effectiveApiEndpoint.includes("granths")) { endpoint = "/granths"; resolvedRowId = updatedRow.ID; }
      else if (effectiveApiEndpoint.includes("language")) { endpoint = "/language"; resolvedRowId = updatedRow.STID; }
      else if (effectiveApiEndpoint.includes("master-quality")) { endpoint = "/master-quality"; resolvedRowId = updatedRow.MQID; }
      else if (effectiveApiEndpoint.includes("organizations")) { endpoint = "/organizations"; resolvedRowId = updatedRow.OrganizationID; }
      else if (effectiveApiEndpoint.includes("neweventcategory")) { endpoint = "/new-event-category"; resolvedRowId = updatedRow.SrNo || updatedRow.CategoryID; }
      else if (effectiveApiEndpoint.includes("newcities")) { endpoint = "/newcities"; resolvedRowId = updatedRow.CityID; }
      else if (effectiveApiEndpoint.includes("newcountries")) { endpoint = "/newcountries"; resolvedRowId = updatedRow.CountryID; }
      else if (effectiveApiEndpoint.includes("newstates")) { endpoint = "/newstates"; resolvedRowId = updatedRow.StateID; }
      else if (effectiveApiEndpoint.includes("occasions")) { endpoint = "/occasions"; resolvedRowId = updatedRow.OccasionID; }
      else if (effectiveApiEndpoint.includes("topicnumbersource")) { endpoint = "/topicnumbersource"; resolvedRowId = updatedRow.TNID; }
      else if (effectiveApiEndpoint.includes("time-of-day")) { endpoint = "/time-of-day"; resolvedRowId = updatedRow.TimeID; }  
      else if (effectiveApiEndpoint.includes("aux-file-type")) { endpoint = "/aux-file-type"; resolvedRowId = updatedRow.AuxTypeID; }
      else if (effectiveApiEndpoint.includes("topic-given-by")) { endpoint = "/topic-given-by"; resolvedRowId = updatedRow.TGBID; }
      else { endpoint = effectiveApiEndpoint.startsWith("/") ? effectiveApiEndpoint : `/${effectiveApiEndpoint}`; resolvedRowId = updatedRow[idKey]; }

      try {
        const token = localStorage.getItem('app-token');
        const response = await fetch(`${API_BASE_URL}${endpoint}/${resolvedRowId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": token ? `Bearer ${token}` : "" },
          body: JSON.stringify(updatedRow),
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('app-token'); localStorage.removeItem('google-token');
          window.location.href = '/'; return { status: 'rejected', reason: "Session expired", rowId };
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          let errorMsg = '';
          if (typeof errorData === 'object' && errorData !== null) {
            if (errorData.sqlMessage) errorMsg += `❌ ${errorData.sqlMessage}\n`;
            if (errorData.message) errorMsg += `Message: ${errorData.message}\n`;
            if (errorData.sql) errorMsg += `SQL:\n${errorData.sql}\n`;
            if (errorData.stack) errorMsg += `Stack:\n${errorData.stack}\n`;
            if (errorData.code) errorMsg += `Code: ${errorData.code}\n`;
            if (errorData.errno) errorMsg += `Errno: ${errorData.errno}\n`;
            if (errorData.sqlState) errorMsg += `SQLState: ${errorData.sqlState}\n`;
            if (!errorMsg) errorMsg = JSON.stringify(errorData, null, 2);
          } else { errorMsg = String(errorData) || `Failed to update ${resolvedRowId}`; }
          return { status: 'rejected', reason: errorMsg, rowId };
        }
        return { status: 'fulfilled', value: resolvedRowId };
      } catch (error: any) {
        return { status: 'rejected', reason: error?.message || String(error), rowId };
      }
    });

    const results = await Promise.allSettled(updatePromises);
    let successfulUpdates = 0; let failedUpdates = 0; const failedDetails: string[] = [];

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const value = result.value;
        if (value && (value as any).status === 'fulfilled') { successfulUpdates++; } 
        else if (value && (value as any).status === 'rejected') {
          failedUpdates++; let reason = (value as any).reason || (value as any).rowId || 'Unknown';
          if (typeof reason !== 'string') reason = JSON.stringify(reason, null, 2);
          try {
            const parsed = JSON.parse(reason);
            if (parsed && typeof parsed === 'object') {
              let details = '';
              if (parsed.sqlMessage) details += `❌ ${parsed.sqlMessage}\n`;
              if (parsed.message) details += `Message: ${parsed.message}\n`;
              if (parsed.sql) details += `SQL:\n${parsed.sql}\n`;
              if (parsed.stack) details += `Stack:\n${parsed.stack}\n`;
              if (parsed.code) details += `Code: ${parsed.code}\n`;
              if (parsed.errno) details += `Errno: ${parsed.errno}\n`;
              if (parsed.sqlState) details += `SQLState: ${parsed.sqlState}\n`;
              if (parsed.error && !details) details += `Error: ${parsed.error}\n`;
              if (!details) details = JSON.stringify(parsed, null, 2);
              reason = details;
            }
          } catch { }
          failedDetails.push(`ID ${ (value as any).rowId || 'unknown' }: ${reason}`);
        } else { failedUpdates++; failedDetails.push(`Unknown failure: ${JSON.stringify(value, null, 2)}`); }
      } else {
        failedUpdates++; let reason = result.reason;
        if (typeof reason !== 'string') reason = JSON.stringify(reason, null, 2);
        failedDetails.push(`Promise rejected: ${String(reason)}`);
      }
    });

    if (failedUpdates > 0) {
      const summary = `${failedUpdates} update(s) failed. ${successfulUpdates} saved.`;
      toast.error(summary, { id: savingToast });
      const detailsMsg = failedDetails.length > 0 ? `\n\nDetails:\n${failedDetails.join('\n')}` : '';
      showErrorDialog(`${summary}${detailsMsg}`, 'Update results');
    } else {
      toast.success(`${successfulUpdates} update(s) saved successfully!`, { id: savingToast });
    }

    setPendingChanges({});
    await queryClient.invalidateQueries({ queryKey: [effectiveApiEndpoint] });
  };

  const handleDiscardChanges = () => { setPendingChanges({}); toast.info("All pending changes discarded."); };

  const [errorDialog, setErrorDialog] = useState<{ open: boolean; title?: string; message?: string }>({ open: false, title: "Error", message: "", });
  const showErrorDialog = (message: string, title = "Error") => { setErrorDialog({ open: true, title, message }); };

  // ==========================================
  // 📱 MOBILE APP UI (Dark Theme + Sticky Table)
  // ==========================================
  
  const renderMobileDetailsView = () => {
    if (!mobileSelectedRow) return null;

    // Try to get a title from the first visible column
    const titleVal = visibleColumns.length > 0 ? mobileSelectedRow[visibleColumns[0].key] : "Entry Details";

    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          backgroundColor: "#0b1120",
          display: "flex",
          flexDirection: "column",
          fontFamily: "sans-serif",
          height: "100dvh",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "16px",
            borderBottom: "1px solid #1e293b",
            backgroundColor: "rgba(30,41,59,0.95)",
            backdropFilter: "blur(8px)",
            position: "sticky",
            top: 0,
            zIndex: 10,
            boxShadow: "0 1px 3px rgba(0,0,0,0.5)"
          }}
        >
          <ChevronLeft
            style={{ width: 28, height: 28, color: "#cbd5e1", cursor: "pointer", marginRight: 12 }}
            onClick={() => setMobileSelectedRow(null)}
          />
          <h2
            style={{
              color: "#ffffff",
              fontSize: 18,
              fontWeight: 600,
              margin: 0,
              flex: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {titleVal || "Entry Details"}
          </h2>
        </div>

        {/* Content - All Columns */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            paddingBottom: "80px", // space for bottom swiping
          }}
        >
          {columns.map((col) => {
            let cellValue = mobileSelectedRow[col.key];
            if (typeof col.render === "function") {
              cellValue = col.render(cellValue, mobileSelectedRow);
            }

            return (
              <div
                key={col.key}
                style={{
                  backgroundColor: "#1e293b",
                  padding: "14px",
                  borderRadius: "10px",
                  border: "1px solid #334155",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              >
                <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, fontWeight: 500 }}>
                  {col.label}
                </div>
                <div style={{ fontSize: 15, color: "#f8fafc", wordBreak: "break-word" }}>
                  {cellValue !== undefined && cellValue !== null && cellValue !== "" ? (
                    cellValue
                  ) : (
                    <span style={{ color: "#475569" }}>-</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDataRow = (row: any, keyMapVal: string | number) => {
    return (
      <tr
        key={keyMapVal}
        onClick={() => setMobileSelectedRow(row)} // Click anywhere to open details
        style={{
          borderBottom: "1px solid rgba(30,41,59,0.5)",
          cursor: "pointer" // Indicate that row is clickable
        }}
      >
        {visibleColumns.map((col, cIndex) => {
          let cellValue = row[col.key];
          if (typeof col.render === "function") {
            cellValue = col.render(cellValue, row);
          }

          // Check if this entire column is expanded
          const isColumnExpanded = expandedColumns[col.key];

          return (
            <td
              key={col.key}
              style={{
                padding: "6px 8px", // Reduced padding for compactness
                color: "#cbd5e1",
                fontSize: "12px", // Reduced font size to see more data
                position: cIndex === 0 ? "sticky" : "static",
                left: cIndex === 0 ? 0 : undefined,
                backgroundColor: cIndex === 0 ? "#0b1120" : undefined,
                borderRight: cIndex === 0 ? "1px solid #1e293b" : undefined,
                zIndex: cIndex === 0 ? 20 : undefined,
                
                // Dynamic styling for column expansion
                whiteSpace: isColumnExpanded ? "normal" : "nowrap",
                wordBreak: isColumnExpanded ? "break-word" : "normal",
                minWidth: isColumnExpanded ? "200px" : undefined, // widen when expanded
                maxWidth: isColumnExpanded ? "85vw" : (cIndex === 0 ? 110 : 140), // narrower non-expanded widths
                overflow: isColumnExpanded ? "visible" : "hidden",
                textOverflow: isColumnExpanded ? "clip" : "ellipsis",
                verticalAlign: isColumnExpanded ? "top" : "middle",
                transition: "all 0.2s ease-in-out",
              }}
            >
              {cIndex === 0 ? (
                <div style={{ display: "flex", alignItems: isColumnExpanded ? "flex-start" : "center", gap: 6 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#3b82f6", flexShrink: 0, marginTop: isColumnExpanded ? 4 : 0 }} />
                  <span style={{ fontWeight: 500, color: "#f1f5f9" }}>
                    {cellValue}
                  </span>
                </div>
              ) : (
                cellValue
              )}
            </td>
          );
        })}
      </tr>
    );
  };

  const renderMobileTableRows = () => {
    if (!isGroupingActive) {
      return finalItems.map((row, rIndex) => renderDataRow(row, row[idKey] || rIndex));
    }

    const renderGroup = (groupData: any, level: number, parentKey: string = "") => {
      // Reached the end: it's an array of matching rows
      if (Array.isArray(groupData)) {
        const currentLimit = groupLimits[parentKey] || 50;
        const visibleItems = groupData.slice(0, currentLimit);
        
        const rows = visibleItems.map((row, rIndex) => renderDataRow(row, `${parentKey}-${row[idKey] || rIndex}`));
        
      // Show "Load More" row if there are more items to show in this group
        if (groupData.length > currentLimit) {
          rows.push(
            <tr key={`${parentKey}-load-more`} style={{ backgroundColor: "#0f172a" }}>
              <td 
                colSpan={visibleColumns.length} 
                style={{ 
                  padding: "6px 8px", // Adjusted padding to match rows
                  textAlign: "left",
                  fontSize: "12px",
                  position: "sticky", 
                  left: 0,
                  borderBottom: "1px solid #1e293b"
                }}
              >
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setGroupLimits(prev => ({ ...prev, [parentKey]: currentLimit + 50 }));
                  }}
                  style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#cbd5e1" }}
                >
                  Load More ({groupData.length - currentLimit} remaining)
                </Button>
              </td>
            </tr>
          );
        }
        
        return rows;
      }

      // Still grouping: render group headers
      return Object.entries(groupData).map(([key, value]) => {
        const groupKey = `${parentKey}-${key}`;
        const isExpanded = !!expandedGroups[groupKey];
        const currentField = columns.find(c => c.key === groupByFields[level])?.label || groupByFields[level] || "Group";
        
        return (
          <React.Fragment key={groupKey}>
            <tr 
              onClick={() => setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))}
              style={{ backgroundColor: "#0f172a", borderBottom: "1px solid #1e293b", cursor: "pointer" }}
            >
              <td
                colSpan={visibleColumns.length}
                style={{
                  padding: "6px 8px", // Reduced padding
                  fontWeight: 600,
                  fontSize: "12px",
                  color: "#f8fafc",
                  position: "sticky",
                  left: 0,
                  backgroundColor: "#0f172a",
                  zIndex: 25,
                  borderRight: "none"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", paddingLeft: level * 12 }}>
                  {isExpanded ? (
                    <ChevronDown style={{ width: 14, height: 14, color: "#cbd5e1", marginRight: 4 }} />
                  ) : (
                    <ChevronRight style={{ width: 14, height: 14, color: "#cbd5e1", marginRight: 4 }} />
                  )}
                  <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#3b82f6", marginRight: 6 }} />
                  <span>{currentField}: {key}</span>
                  <Badge variant="outline" style={{ marginLeft: 6, backgroundColor: "#1e293b", color: "#94a3b8", border: "none", fontSize: "10px", padding: "0 4px", height: "18px" }}>
                    {Array.isArray(value) ? value.length : (typeof value === 'object' && value !== null ? Object.keys(value as object).length : 0)}
                  </Badge>
                </div>
              </td>
            </tr>
            {isExpanded && renderGroup(value, level + 1, groupKey)}
          </React.Fragment>
        );
      });
    };

    return renderGroup(groupedData, 0);
  };

 const renderMobileView = () => (
  <>
  {renderMobileDetailsView()}
  <div
    style={{
      display: mobileSelectedRow ? "none" : "flex",
      flexDirection: "column",
      height: "100dvh",
      backgroundColor: "#0b1120",
      color: "#e2e8f0",
      fontFamily: "sans-serif",
      position: "relative"
    }}
  >
    {/* Global styles for the spinner so it works inline, and aggressively shrinking internal popups */}
    <style>{`
      @keyframes inline-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      /* Force the internal filter button of AdvancedFiltersClickUp to match our new smaller pill icon buttons */
      .mobile-filter-container button {
        width: auto !important;
        height: 26px !important;
        padding: 0 8px !important;
        border-radius: 13px !important;
        background-color: ${advancedFilters.length > 0 ? '#3b82f6' : '#1e293b'} !important;
        border-color: ${advancedFilters.length > 0 ? '#2563eb' : '#334155'} !important;
        color: white !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 12px !important; 
        gap: 4px !important;
      }
      .mobile-filter-container button svg {
        width: 12px !important;
        height: 12px !important;
        margin: 0 !important;
      }

      /* ---------------------------------------------------- */
      /* SHRINK ALL POPOVERS AND DIALOGS IN MOBILE VIEW      */
      /* ---------------------------------------------------- */
      .mobile-app-view [data-radix-popper-content-wrapper] {
        max-width: 95vw !important;
        z-index: 150 !important;
      }
      .mobile-app-view [data-radix-popper-content-wrapper] .bg-popover,
      .mobile-app-view [data-radix-popper-content-wrapper] [role="dialog"],
      .mobile-app-view [data-state="open"][role="dialog"],
      .mobile-app-view .dialog-content {
        padding: 12px !important;
        border-radius: 12px !important;
      }

      /* Make inputs, selects, and internal buttons smaller */
      .mobile-app-view [data-radix-popper-content-wrapper] input,
      .mobile-app-view [data-radix-popper-content-wrapper] button:not(.mobile-filter-container button),
      .mobile-app-view [data-radix-popper-content-wrapper] [role="combobox"],
      .mobile-app-view [data-radix-popper-content-wrapper] select,
      .mobile-app-view [data-state="open"][role="dialog"] input,
      .mobile-app-view [data-state="open"][role="dialog"] button:not(.mobile-filter-container button),
      .mobile-app-view [data-state="open"][role="dialog"] [role="combobox"] {
        height: 28px !important;
        min-height: 28px !important;
        font-size: 12px !important;
        padding: 0 8px !important;
        border-radius: 6px !important;
      }

      /* Shrink text */
      .mobile-app-view [data-radix-popper-content-wrapper] label,
      .mobile-app-view [data-radix-popper-content-wrapper] .text-sm,
      .mobile-app-view [data-state="open"][role="dialog"] label,
      .mobile-app-view [data-state="open"][role="dialog"] .text-sm {
        font-size: 12px !important;
        line-height: 1.2 !important;
      }

      /* Reduce layout gaps */
      .mobile-app-view [data-radix-popper-content-wrapper] .space-y-4 > * + *,
      .mobile-app-view [data-state="open"][role="dialog"] .space-y-4 > * + * {
        margin-top: 8px !important;
      }
      .mobile-app-view [data-radix-popper-content-wrapper] .gap-4,
      .mobile-app-view [data-state="open"][role="dialog"] .gap-4 {
        gap: 8px !important;
      }
      .mobile-app-view [data-radix-popper-content-wrapper] .p-4,
      .mobile-app-view [data-state="open"][role="dialog"] .p-4 {
        padding: 10px !important;
      }
    `}</style>

    {/* Top Control Bar - Collapsible Search & Icon Buttons */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: showMobileSearch ? "flex-start" : "flex-end",
        gap: 6,
        padding: "6px 8px",
        backgroundColor: "#0b1120",
        borderBottom: "1px solid rgba(30,41,59,0.5)",
        flexShrink: 0,
        overflowX: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none"
      }}
    >
      {showMobileSearch ? (
        <div style={{ display: "flex", alignItems: "center", width: "100%", gap: 8 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              style={{
                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#94a3b8"
              }}
            />
            <Input
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="Search..."
              style={{
                width: "100%", paddingLeft: 30, paddingRight: 30, height: 30, fontSize: 13, borderRadius: 15, border: "1px solid #334155", backgroundColor: "#1e293b", color: "#ffffff", boxShadow: "none"
              }}
            />
            {searchTerm && (
              <X
                onClick={() => setSearchTerm("")}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#94a3b8", cursor: "pointer"
                }}
              />
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowMobileSearch(false)}
            style={{ color: "#94a3b8", padding: "0 4px", height: 30 }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Search Toggle Icon (Circle) */}
          <Button 
            variant="outline" 
            onClick={() => setShowMobileSearch(true)}
            style={{ 
              flexShrink: 0, width: 26, height: 26, padding: 0, borderRadius: "50%", backgroundColor: searchTerm ? "#3b82f6" : "#1e293b", borderColor: searchTerm ? "#2563eb" : "#334155", color: "white" 
            }}
          >
            <Search style={{ width: 12, height: 12 }} />
          </Button>

          {/* Filter Component - Rendered Directly (Custom CSS makes it a pill with text) */}
          <div className="mobile-filter-container" style={{ flexShrink: 0 }}>
            <AdvancedFiltersClickUp filters={finalFilterConfigs} onFiltersChange={setAdvancedFilters} data={finalItems} onSaveFilter={handleSaveFilter} />
          </div>

          {/* Sort Popover (Pill) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" style={{ flexShrink: 0, height: 26, padding: "0 8px", borderRadius: "13px", backgroundColor: sortByFields.length > 0 ? "#3b82f6" : "#1e293b", borderColor: sortByFields.length > 0 ? "#2563eb" : "#334155", color: "white", fontSize: "12px", display: "flex", gap: "4px" }}>
                <ArrowUpDown style={{ width: 12, height: 12 }} />
                Sort
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              style={{ width: 260, padding: 12, backgroundColor: "#0f172a", border: "1px solid #334155", color: "#ffffff", borderRadius: 8, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }} 
              align="end" side="bottom"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: "#e2e8f0" }}>Sort by field</div>
                <Select value={sortByFields[0]?.key || 'none'} onValueChange={(v: string) => { if (v === 'none') setSortByFields([]); else setSortByFields([{ key: v, direction: 'asc' }]); }}>
                  <SelectTrigger style={{ height: 28, fontSize: 12, backgroundColor: "#1e293b", border: "1px solid #475569", color: "#e2e8f0", borderRadius: 6, padding: "0 10px" }}>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: "#1e293b", border: "1px solid #475569", color: "#e2e8f0", borderRadius: 6 }}>
                    <SelectItem value="none">No sorting</SelectItem>
                    {getAvailableSortFields().map((field) => (<SelectItem key={field.value} value={field.value}>{field.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>

          {/* Group Popover (Pill) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" style={{ flexShrink: 0, height: 26, padding: "0 8px", borderRadius: "13px", backgroundColor: groupByFields[0] !== "none" && groupByFields.length > 0 ? "#3b82f6" : "#1e293b", borderColor: groupByFields[0] !== "none" && groupByFields.length > 0 ? "#2563eb" : "#334155", color: "white", fontSize: "12px", display: "flex", gap: "4px" }}>
                <Users style={{ width: 12, height: 12 }} />
                Group
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              style={{ width: 260, padding: 12, backgroundColor: "#0f172a", border: "1px solid #334155", color: "#ffffff", borderRadius: 8, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }} 
              align="end" side="bottom"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: "#e2e8f0" }}>Group by field</div>
                <Select value={groupByFields[0] || 'none'} onValueChange={(v: string) => { setGroupByFields(v === 'none' ? [] : [v]); setGroupDirections(prev => ({ ...prev, [v]: "asc" })); }}>
                  <SelectTrigger style={{ height: 28, fontSize: 12, backgroundColor: "#1e293b", border: "1px solid #475569", color: "#e2e8f0", borderRadius: 6, padding: "0 10px" }}>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: "#1e293b", border: "1px solid #475569", color: "#e2e8f0", borderRadius: 6 }}>
                    <SelectItem value="none">No grouping</SelectItem>
                    {getAvailableGroupByFields().map((field) => (<SelectItem key={field.value} value={field.value}>{field.label}</SelectItem>))}
                  </SelectContent>
                </Select>
                {groupByFields[0] && groupByFields[0] !== "none" && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    style={{ width: "100%", backgroundColor: "#dc2626", color: "#ffffff", border: "none", height: 28, fontSize: 12, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} 
                    onClick={() => setGroupByFields([])}
                  >
                    <X style={{ width: 12, height: 12, marginRight: 6 }} /> Clear Grouping
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>

    {/* Table Area */}
    <div
      style={{
        flex: 1,
        overflow: "auto",
        backgroundColor: "#0b1120"
      }}
    >
      {(isLoading || isGroupingDataLoading) && (
       <div
          style={{
            padding: "40px 0",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12
          }}
        >
         <Loader2 style={{ width: 32, height: 32, color: "#3b82f6", animation: "inline-spin 1s linear infinite" }} />
          <span style={{ color: "#94a3b8", fontSize: 14 }}>Loading records...</span>
        </div>
      )}
      {error &&<div
          style={{
            padding: 16,
            margin: 16,
            textAlign: "center",
            color: "#f87171",
            backgroundColor: "rgba(127,29,29,0.3)",
            borderRadius: 8,
            border: "1px solid rgba(153,27,27,0.5)",
            fontSize: 14
          }}
        >Error: {(error as Error).message}</div>}
      {!(isLoading || isGroupingDataLoading) && finalItems.length === 0 &&<div
          style={{
            padding: 40,
            textAlign: "center",
            color: "#64748b"
          }}
        >No results found.</div>}

      {finalItems.length > 0 && !(isLoading || isGroupingDataLoading) && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            whiteSpace: "nowrap",
            fontSize: 12 // Reduced to see more data
          }}
        >
          <thead
            style={{
              position: "sticky",
              top: 0,
              backgroundColor: "#1e293b",
              color: "#cbd5e1",
              zIndex: 30
            }}
          >
            <tr>
              {visibleColumns.map((col, index) => (
                <th
                  key={col.key}
                  onClick={() => {
                    // Toggle expansion state for the entire column
                    setExpandedColumns(prev => ({ ...prev, [col.key]: !prev[col.key] }));
                  }}
                  style={{
                    padding: "6px 8px", // Reduced header padding
                    fontWeight: 600,
                    borderBottom: "1px solid #334155",
                    letterSpacing: 0.5,
                    position: index === 0 ? "sticky" : "static",
                    left: index === 0 ? 0 : undefined,
                    backgroundColor: "#1e293b",
                    borderRight: index === 0 ? "1px solid #334155" : undefined,
                    zIndex: index === 0 ? 40 : undefined,
                    cursor: "pointer",
                    whiteSpace: expandedColumns[col.key] ? "normal" : "nowrap",
                    minWidth: expandedColumns[col.key] ? "200px" : undefined, // expand header width too
                    transition: "all 0.2s ease-in-out"
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span>{col.label}</span>
                    <span style={{ fontSize: '10px', opacity: 0.5, marginLeft: '4px' }}>
                      {expandedColumns[col.key] ? "[-]" : "[+]"}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renderMobileTableRows()}
          </tbody>
        </table>
      )}
    </div>

    {/* Sticky Pagination */}
    {finalItems.length > 0 && !(isLoading || isGroupingDataLoading) && (
      <div
        style={{
          padding: Object.keys(pendingChanges).length > 0 ? "6px 10px 56px 10px" : "6px 10px",
          backgroundColor: "#0f172a",
          borderTop: "1px solid #1e293b",
          zIndex: 30,
          flexShrink: 0
        }}
      >
        <SimplePagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => setCurrentPage(Number(p))} />
      </div>
    )}

    {/* Bulk Edit Action Bar (Only visible if pending changes exist) */}
    {Object.keys(pendingChanges).length > 0 && (
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          backgroundColor: "rgba(30,41,59,0.95)",
          backdropFilter: "blur(8px)",
          borderTop: "1px solid #1e293b",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "center", 
          alignItems: "center",
          gap: "8px", 
          zIndex: 40,
          boxShadow: "0 -4px 10px rgba(0,0,0,0.5)"
        }}
      >
        <Button
          onClick={handleDiscardChanges}
          style={{
            flex: 1, height: 40, backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.5)", color: "#f87171", borderRadius: 8, cursor: "pointer"
          }}
        >Discard</Button>
        <Button
          onClick={handleBulkUpdate}
          style={{
            flex: 1, height: 40, backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: 8, cursor: "pointer"
          }}
        >Save ({Object.keys(pendingChanges).length})</Button>
      </div>
    )}
  </div>
  </>
);

  // ==========================================
  // 💻 DESKTOP UI (Exactly as you provided)
  // ==========================================
  const renderDesktopView = () => (
    <div className="p-6 space-y-4 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your {title.toLowerCase()} data with advanced filtering and views.
          </p>
        </div>
      </div>
      
      {views && views.length > 1 && (
        <div className="flex gap-2 mb-4">
          {views.map((view) => (
            <Button key={view.id} variant={activeView === view.id ? "default" : "outline"} size="sm" onClick={() => setActiveView(view.id)}>
              {view.name}
            </Button>
          ))}
        </div>
      )}
      
      <SavedFilterTabs savedFilters={savedFilters} activeFilterName={activeSavedFilterName} onSelectFilter={handleSelectFilter} onDeleteFilter={handleDeleteFilter} currentUser={user ? { email: user.email, role: user.role } : { email: '', role: '' }} />
      
      <Card className="border-0 shadow-sm bg-card">
        <CardHeader className="p-6 border-b bg-muted/20 rounded-t-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <Tabs value="table">
              <TabsList className="grid grid-cols-1 w-fit">
                <TabsTrigger value="table" className="flex items-center gap-2"><TableIcon className="w-4 h-4" />Table</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              {Object.keys(pendingChanges).length > 0 && (
                <>
                  <Button variant="destructive" size="sm" className="gap-2 h-8" onClick={handleDiscardChanges}><X className="w-4 h-4" />Discard</Button>
                  <Button variant="default" size="sm" className="gap-2 h-8" onClick={handleBulkUpdate}>Save Changes ({Object.keys(pendingChanges).length})</Button>
                </>
              )}
              <Button variant="outline" size="sm" className="gap-2 h-8" onClick={handleExport} disabled={isExporting}>
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isExporting ? "Exporting..." : "Export"}
              </Button>
              {showAddButton && hasAccess(title, 'write') && (<Button variant="default" size="sm" className="gap-2 h-8" onClick={() => setAddOpen(true)}>+ Add</Button>)}
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <AdvancedFiltersClickUp filters={finalFilterConfigs} onFiltersChange={setAdvancedFilters} data={finalItems} onSaveFilter={handleSaveFilter} />
              <div className="flex items-center gap-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-8"><Pin className="w-4 h-4" />{frozenColumnKey ? `Freeze: ${columns.find(c => c.key === frozenColumnKey)?.label}` : "Freeze"}</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-3">
                      <div className="font-medium text-sm">Freeze up to column</div>
                      <Select value={frozenColumnKey || 'none'} onValueChange={(value: string) => setFrozenColumnKey(value === 'none' ? null : value)}>
                        <SelectTrigger className="h-8"><SelectValue placeholder="Select column to freeze" /></SelectTrigger>
                        <SelectContent><SelectItem value="none">No columns frozen</SelectItem>{visibleColumns.map((col) => (<SelectItem key={col.key} value={col.key}>{col.label}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                  </PopoverContent>
                </Popover>
                {frozenColumnKey && (<Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => setFrozenColumnKey(null)} title="Unfreeze columns"><X className="w-4 h-4" /></Button>)}
              </div>
              <div className="flex items-center gap-1">
                <Popover>
                  <PopoverTrigger asChild><Button variant="outline" size="sm" className="gap-2 h-8"><Users className="w-4 h-4" />Group</Button></PopoverTrigger>
                  <PopoverContent className="w-80 p-3" align="start">
                    <div className="space-y-3">
                      <div className="font-medium text-sm">Group by fields</div>
                      {groupByFields.map((field, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Select value={field || 'none'} onValueChange={(v: string) => { const newFields = [...groupByFields]; newFields[index] = v === 'none' ? null : v; setGroupByFields(newFields.filter(f => f !== null)); }}>
                            <SelectTrigger className="h-8 flex-1"><SelectValue placeholder="Select field" /></SelectTrigger>
                            <SelectContent><SelectItem value="none">-- No Grouping --</SelectItem>{getAvailableGroupByFields().map((f) => (<SelectItem key={f.value} value={f.value} disabled={groupByFields.includes(f.value)}>{f.label}</SelectItem>))}</SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { const newFields = [...groupByFields]; newFields.splice(index, 1); setGroupByFields(newFields); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setGroupByFields([...groupByFields, null])}><Plus className="w-4 h-4" /> Add grouping level</Button>
                    </div>
                  </PopoverContent>
                </Popover>
                {isGroupingActive && (<Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => setGroupByFields([])} title="Clear all groupings"><X className="w-4 h-4" /></Button>)}
              </div>
              <div className="flex items-center gap-1">
                <Popover>
                  <PopoverTrigger asChild><Button variant="outline" size="sm" className="gap-2 h-8"><ArrowUpDown className="w-4 h-4" />Sort</Button></PopoverTrigger>
                  <PopoverContent className="w-80 p-3" align="start">
                    <div className="space-y-3">
                      <div className="font-medium text-sm">Sort by fields</div>
                      {sortByFields.map((field, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Select value={field.key} onValueChange={(v: string) => { const newFields = [...sortByFields]; newFields[index] = { ...newFields[index], key: v }; setSortByFields(newFields); }}>
                            <SelectTrigger className="h-8 flex-1"><SelectValue placeholder="Select field" /></SelectTrigger>
                            <SelectContent>{getAvailableSortFields().map((f) => (<SelectItem key={f.value} value={f.value} disabled={sortByFields.some(sf => sf.key === f.value)}>{f.label}</SelectItem>))}</SelectContent>
                          </Select>
                          <Select value={field.direction} onValueChange={(v: "asc" | "desc") => { const newFields = [...sortByFields]; newFields[index] = { ...newFields[index], direction: v }; setSortByFields(newFields); }}>
                            <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="asc">Ascending</SelectItem><SelectItem value="desc">Descending</SelectItem></SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { const newFields = [...sortByFields]; newFields.splice(index, 1); setSortByFields(newFields); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setSortByFields([...sortByFields, { key: '', direction: 'asc' }])}><Plus className="w-4 h-4" /> Add sorting level</Button>
                    </div>
                  </PopoverContent>
                </Popover>
                {sortByFields.length > 0 && (<Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => setSortByFields([])} title="Clear all sorting"><X className="w-4 h-4" /></Button>)}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-64 h-8" />
              </div>
              <Popover>
                <PopoverTrigger asChild><Button variant="outline" size="sm" className="gap-2 h-8"><EyeOff className="w-4 h-4" />Hide</Button></PopoverTrigger>
                <PopoverContent className="w-64 max-h-72 overflow-y-auto" align="end" style={{ scrollbarWidth: "thin", scrollbarColor: "#475569 #1e293b" }}>
                  <div className="space-y-3">
                    <div className="font-medium">Show/Hide Columns</div>
                    <div className="flex items-center space-x-2 border-b pb-2 mb-2">
                      <Checkbox id="desktop-select-all-columns" checked={hiddenColumns.length === 0} onCheckedChange={(checked) => { setHiddenColumns(checked ? [] : columns.map((c) => c.key)); }} />
                      <label htmlFor="desktop-select-all-columns" className="text-sm font-medium">{hiddenColumns.length > 0 ? "Show All" : "Hide All"}</label>
                    </div>
                    <div className="space-y-2 pr-1" style={{ maxHeight: "200px", overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "#475569 #f0f2f5ff" }}>
                      {columns.map((column) => (
                        <div key={column.key} className="flex items-center space-x-2">
                          <Checkbox id={`column-${column.key}`} checked={!hiddenColumns.includes(column.key)} onCheckedChange={(checked: boolean) => { setHiddenColumns((prevHidden) => { if (checked) { return prevHidden.filter((c) => c !== column.key); } else { return [...prevHidden, column.key]; } }); }} />
                          <label htmlFor={`column-${column.key}`} className="text-sm text-foreground">{column.label}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto relative custom-scrollbar" style={{ maxHeight: '60vh' }}>
            {(isLoading || isGroupingDataLoading) && (<div className="p-8 text-center flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading...</div>)}
            {error && <div className="p-8 text-center text-red-500">Error: {(error as Error).message}</div>}
            {!(isLoading || isGroupingDataLoading) && finalItems.length === 0 && <div className="p-8 text-center">No results found.</div>}
            {finalItems.length > 0 && (
              <div className={`transition-opacity duration-300 ${isFetching && !isLoading && !isGroupingDataLoading ? 'opacity-50' : 'opacity-100'}`}>
                <DraggableResizableTable data={finalItemsWithPendingChanges} columns={visibleColumns as any} onRowSelect={(item) => onRowSelect?.(item as any)} onSort={handleHeaderSort} getSortIcon={getSortIcon} groupedData={groupedData as any} groupByFields={groupByFields.filter(f => f).map(f => ({ key: f!, direction: groupDirections[f!] || 'asc' }))} idKey={idKey} handleCellEdit={(rowIndex, column, newValue) => handleCellChange(rowIndex, column.key, newValue)} editingCell={editingCell} editValue={editValue} setEditValue={setEditValue} handleUpdateCell={handleUpdateCell} handleCellDoubleClick={handleCellDoubleClick} setEditingCell={setEditingCell} sortedData={sortedData} frozenColumnKey={frozenColumnKey} columnOrder={columnOrder} columnSizing={columnSizing} setViewColumnOrder={setColumnOrder} />
              </div>
            )}
            {isFetching && !isLoading && !isGroupingDataLoading && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="bg-background/80 backdrop-blur-sm text-foreground rounded-full px-4 py-2 text-xs flex items-center gap-2 shadow-lg border"><Loader2 className="w-4 h-4 animate-spin" /><span>Buffering...</span></div>
              </div>
            )}
          </div>
        </CardContent>
        {!(isLoading || isGroupingDataLoading) && totalItems > 0 &&
          <div className="border-t p-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div><span>{totalItems} results</span></div>
              {!(isGroupingActive && totalPages <= 1) && (
                <div className="flex items-center gap-4">
                  {(advancedFilters.some(group => group.rules.length > 0) || Object.keys(activeViewFilters).length > 0) && (<Button variant="ghost" size="sm" onClick={() => { setAdvancedFilters([]); setActiveView(views[0]?.id || ""); }} className="text-muted-foreground hover:text-foreground">Clear filters</Button>)}
                  <SimplePagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => setCurrentPage(Number(p))}/>
                </div>
              )}
            </div>
          </div>
        }
      </Card>

      {/* Dialogs... (Add & Error remain unchanged) */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent style={{ maxHeight: "90vh", overflowY: "auto" }}>
          <DialogHeader><DialogTitle>Add New {title}</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); handleAddSubmit(); }} className="space-y-6">
            {formColumns.map(col => (
              <div key={col.key}>
                <label className="block text-sm font-medium mb-2">{col.label}</label>
                <Input value={addForm[col.key] || ""} onChange={e => handleAddFormChange(col.key, e.target.value)} required />
              </div>
            ))}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} style={{ width: "120px" }}>Cancel</Button>
              <Button type="submit" style={{ width: "120px" }} disabled={!hasAccess(title, "write")}>Add</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader><DialogTitle>{errorDialog.title}</DialogTitle></DialogHeader>
          <div className="py-2 text-sm whitespace-pre-wrap" style={{ maxHeight: 400, overflowY: "auto", wordBreak: "break-word" }}>{errorDialog.message}</div>
          <DialogFooter style={{ display: "flex", justifyContent: "flex-end", paddingTop: "12px" }}>
            <button onClick={() => setErrorDialog({ open: false, title: "Error", message: "" })} style={{ padding: "8px 16px", borderRadius: "8px", backgroundColor: "rgb(51, 65, 85)", color: "white", fontSize: "14px", fontWeight: 500, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", transition: "all 0.2s ease-in-out" }}>Close</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Return specific view based on screen size
  return isMobile ? renderMobileView() : renderDesktopView();
}