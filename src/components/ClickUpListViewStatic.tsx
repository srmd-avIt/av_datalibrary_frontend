import React, { useState, useMemo, useEffect } from "react";

// --- UI Imports ---
import { Card, CardContent, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { DraggableResizableTable } from "./DraggableResizableTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Search, Download, ArrowUpDown, ArrowUp, ArrowDown, Users, Table as TableIcon,
  Calendar, Settings2, EyeOff, X, Funnel, Loader2
} from "lucide-react";
import { AdvancedFiltersClickUp } from "./AdvancedFiltersClickUp";
import { SavedFilterTabs } from "./SavedFilterTabs";
import { Column, FilterConfig, FilterGroup, FilterRule, ListItem, SavedFilter, ViewConfig } from "./types";

// --- Component ---
export function ClickUpListViewStatic({ title, columns, data, searchKey = "name", filterConfigs = [], views = [], onRowSelect }: {
  title: string;
  columns: Column[];
  data: ListItem[];
  searchKey?: string;
  filterConfigs?: FilterConfig[];
  views?: ViewConfig[];
  onRowSelect?: (item: ListItem) => void;
}) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("none");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [advancedFilters, setAdvancedFilters] = useState<FilterGroup[]>([]);
  const [activeView, setActiveView] = useState(views[0]?.id || "");
  const [activeTab, setActiveTab] = useState("table");
  const [groupBy, setGroupBy] = useState<string>("none");
  const [groupDirection, setGroupDirection] = useState<"asc" | "desc">("asc");
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [activeSavedFilter, setActiveSavedFilter] = useState<string | null>(null);

  useEffect(() => { setActiveView(views[0]?.id || ""); }, [views]);

  const currentView = useMemo(() => views.find(v => v.id === activeView), [views, activeView]);
  const activeViewFilters = useMemo(() => currentView?.filters || {}, [currentView]);

  const activeSortBy = sortBy !== "none" ? sortBy : currentView?.sortBy || "none";
  const activeSortDirection = sortDirection || currentView?.sortDirection || "asc";
  const activeGroupBy = groupBy !== "none" ? groupBy : currentView?.groupBy || "none";

  const finalFilterConfigs = useMemo(() => {
    // Only allow types supported by AdvancedFiltersClickUp
    const allowedTypes = ["number", "text", "select", "date"];
    if (filterConfigs && filterConfigs.length > 0) {
      return filterConfigs.filter(fc => allowedTypes.includes(fc.type));
    }
    return columns
      .filter(col => col.filterable !== false && (!('type' in col) || allowedTypes.includes((col as any).type)))
      .map((col): FilterConfig => ({
        key: col.key,
        label: col.label,
        type: 'type' in col && allowedTypes.includes((col as any).type) ? ((col as any).type as "number" | "text" | "select" | "date") : "text"
      }));
  }, [columns, filterConfigs]);

  // Apply search and filters
  const filteredItems = useMemo(() => {
    let items = [...data];

    // Apply search
    if (searchTerm) {
      items = items.filter(item => {
        const searchValue = String(item[searchKey] || "").toLowerCase();
        return searchValue.includes(searchTerm.toLowerCase());
      });
    }

    // Apply view filters
    Object.entries(activeViewFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "" && value !== "all") {
        items = items.filter(item => String(item[key]).toLowerCase() === String(value).toLowerCase());
      }
    });

    // Apply advanced filters
    if (advancedFilters.length > 0) {
      advancedFilters.forEach(group => {
        if (group.rules.length > 0) {
          items = items.filter(item => {
            const results = group.rules.map(rule => {
              const itemValue = item[rule.field];
              const ruleValue = rule.value;
              
              switch (rule.operator) {
                case "contains":
                  return String(itemValue || "").toLowerCase().includes(String(ruleValue).toLowerCase());
                case "equals":
                  return String(itemValue) === String(ruleValue);
                case "greater_than":
                  return Number(itemValue) > Number(ruleValue);
                case "less_than":
                  return Number(itemValue) < Number(ruleValue);
                default:
                  return true;
              }
            });
            
            return group.logic === "AND" ? results.every(r => r) : results.some(r => r);
          });
        }
      });
    }

    return items;
  }, [data, searchTerm, searchKey, activeViewFilters, advancedFilters]);

  const finalItems = useMemo(() => {
    const src = filteredItems.slice();
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
  }, [filteredItems, activeSortBy, activeSortDirection]);

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

  const getAvailableGroupByFields = () => { return columns.filter(col => col.filterable !== false).map(col => ({ value: col.key, label: col.label })); };
  const getAvailableSortFields = () => { return columns.filter(col => col.sortable).map(col => ({ value: col.key, label: col.label })); };
  const handleSort = (columnKey: string) => { if (sortBy === columnKey) { setSortDirection(prev => prev === "asc" ? "desc" : "asc"); } else { setSortBy(columnKey); setSortDirection("asc"); } };
  const getSortIcon = (columnKey: string) => { if (activeSortBy !== columnKey) return <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-50" />; return activeSortDirection === "asc" ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />; };
  const visibleColumns = useMemo(() => columns.filter(col => !hiddenColumns.includes(col.key)), [columns, hiddenColumns]);

  const handleSaveFilter = (name: string, filterGroups: FilterGroup[]) => {
    const newFilter: SavedFilter = {
      id: `filter_${Date.now()}`,
      name,
      filterGroups,
      createdAt: new Date().toISOString()
    };
    setSavedFilters(prev => [...prev, newFilter]);
  };

  const handleSavedFilterSelect = (filterId: string | null) => {
    setActiveSavedFilter(filterId);
    if (filterId) {
      const savedFilter = savedFilters.find(f => f.id === filterId);
      if (savedFilter) {
        setAdvancedFilters(savedFilter.filterGroups);
      }
    } else {
      setAdvancedFilters([]);
    }
  };

  const handleSavedFilterDelete = (filterId: string) => {
    setSavedFilters(prev => prev.filter(f => f.id !== filterId));
    if (activeSavedFilter === filterId) {
      setActiveSavedFilter(null);
      setAdvancedFilters([]);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your {title.toLowerCase()} data with advanced filtering and views.</p>
        </div>
      </div>

      {/* Saved Filter Tabs */}
      <SavedFilterTabs
        savedFilters={savedFilters}
        activeFilterName={activeSavedFilter}
        onSelectFilter={handleSavedFilterSelect}
        onDeleteFilter={handleSavedFilterDelete}
      />

      <Card className="border-0 shadow-sm bg-card">
        <CardHeader className="p-6 border-b bg-muted/20 rounded-t-lg">
          <div className="flex items-center justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-1 w-fit">
                <TabsTrigger value="table" className="flex items-center gap-2"><TableIcon className="w-4 h-4" />Table</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-4 pt-4">
            <div className="flex items-center gap-2">
              <AdvancedFiltersClickUp 
                filters={finalFilterConfigs.filter(fc => fc.type !== "checkbox")}
                onFiltersChange={setAdvancedFilters} 
                data={finalItems} 
                onSaveFilter={handleSaveFilter}
              />
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
              <div className="flex items-center gap-1">
                <Select value={sortBy} onValueChange={(v: string) => setSortBy(v)}><SelectTrigger className="w-36 h-8"><SelectValue placeholder="Sort by" /></SelectTrigger><SelectContent><SelectItem value="none">No sorting</SelectItem>{getAvailableSortFields().map((field) => (<SelectItem key={field.value} value={field.value}>Sort by {field.label}</SelectItem>))}</SelectContent></Select>
                {sortBy !== "none" && (<Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => setSortBy("none")} title="Clear sorting"><X className="w-4 h-4" /></Button>)}
              </div>
              {sortBy !== "none" && (<Select value={sortDirection} onValueChange={(value: string) => setSortDirection(value as "asc" | "desc")}><SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="asc">Ascending</SelectItem><SelectItem value="desc">Descending</SelectItem></SelectContent></Select>)}
            </div>
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
        <CardContent className="p-0">
          {activeTab === 'table' && (
            <>
              {finalItems.length === 0 && <div className="p-8 text-center">No results found.</div>}
              {finalItems.length > 0 && (
                <DraggableResizableTable
                  data={finalItems as any}
                  columns={visibleColumns as any}
                  sortedData={finalItems as any}
                  frozenColumnKey={null}
                  columnOrder={visibleColumns.map(col => col.key)}
                  columnSizing={{}}
                  onRowSelect={(item) => onRowSelect?.(item as any)}
                  onSort={handleSort}
                  getSortIcon={getSortIcon}
                  groupedData={groupedData as any}
                  idKey="id"
                  // --- MODIFIED: Add required editing props with dummy values ---
                  editingCell={null}
                  editValue={""}
                  setEditValue={() => {}}
                  setEditingCell={() => {}}
                  handleUpdateCell={() => {}}
                  handleCellDoubleClick={() => {}}
                />
              )}
            </>
          )}
        </CardContent>
        {finalItems.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground p-6 border-t">
            <div><span>{finalItems.length} results</span></div>
            <div className="flex items-center gap-4">
              {(advancedFilters.some(group => group.rules.length > 0) || Object.keys(activeViewFilters).length > 0 || activeSavedFilter) && (
                <Button variant="ghost" size="sm" onClick={() => { 
                  setAdvancedFilters([]); 
                  setActiveView(views[0]?.id || ""); 
                  setActiveSavedFilter(null); 
                }} className="text-muted-foreground hover:text-foreground">Clear filters</Button>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}