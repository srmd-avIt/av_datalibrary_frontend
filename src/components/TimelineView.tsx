/// <reference types="vite/client" />

import React, { useState, useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Calendar, Loader2, AlertTriangle } from "lucide-react";
import { parse, isValid, format, parseISO } from "date-fns";
import { SimplePagination } from "./ui/pagination";

// --- Interfaces ---
interface TimelineItem {
  EventID: string | number;
  FromDate: string;
  ToDate?: string;
  EventName?: string;
  EventCode?: string;
  Yr?: string;
  EventRemarks?: string;
  fkEventCategory?: string;
  NewEventCategory?: string;
  [key: string]: any;
}

interface ApiResponse {
  data: TimelineItem[];
  pagination: {
    totalPages: number;
    totalItems: number;
  };
}

interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: any;
  logic?: "AND" | "OR";
}

interface FilterGroup {
  id: string;
  rules: FilterRule[];
  logic: "AND" | "OR";
}

// --- API Fetcher Function ---
const API_BASE_URL = import.meta.env.VITE_API_URL;

async function fetchDataFromApi({
  apiEndpoint,
  page = 1,
  limit = 50,
  filters = {},
  advancedFilters = [],
  groupBy,
  groupDirection,
  sortBy,
  sortDirection,
}: {
  apiEndpoint: string;
  page?: number;
  limit?: number;
  filters?: Record<string, any>;
  advancedFilters?: FilterGroup[];
  groupBy?: string;
  groupDirection?: "asc" | "desc";
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}): Promise<ApiResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "all") {
      params.append(key, String(value));
    }
  });
  if (advancedFilters && advancedFilters.length > 0) {
    params.append("advanced_filters", JSON.stringify(advancedFilters));
  }
  if (groupBy && groupBy !== "none") params.append("groupBy", groupBy);
  if (groupDirection) params.append("groupDirection", groupDirection);
  if (sortBy && sortBy !== "none") params.append("sortBy", sortBy);
  if (sortDirection) params.append("sortDirection", sortDirection);

  if (!API_BASE_URL) throw new Error("API URL not configured. Set VITE_API_URL in .env");
  const url = new URL(API_BASE_URL);
  url.pathname += apiEndpoint.startsWith("/") ? apiEndpoint : `/${apiEndpoint}`;
  url.search = params.toString();

  const response = await fetch(url.href, { cache: "no-store" });
  if (!response.ok) throw new Error(`API error: ${response.statusText} for URL: ${url.href}`);
  return await response.json();
}

// --- Component Props ---
interface TimelineViewProps {
  apiEndpoint: string;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onItemSelect?: (item: any) => void;
  filters?: Record<string, any>;
  advancedFilters?: FilterGroup[];
  groupBy?: string;
  groupDirection?: "asc" | "desc";
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

// --- Robust Helper Functions ---
const parseDateString = (dateString: string | null | undefined): Date | null => {
    if (!dateString) return null;
    try {
        let date = parseISO(dateString);
        if (isValid(date)) return date;
        date = parse(dateString, "dd-MM-yyyy", new Date());
        if (isValid(date)) return date;
        date = parse(dateString, "yyyy-MM-dd", new Date());
        if (isValid(date)) return date;
        return null;
    } catch {
        return null;
    }
};

const formatDisplayDate = (dateString: string | null | undefined) => {
  const date = parseDateString(dateString);
  return date ? format(date, "MMM do, yyyy") : 'N/A';
};

const getCategoryColor = (category?: string) => {
  const colors: { [key: string]: string } = {
    Satsang: "bg-blue-500", Festival: "bg-orange-500", Pratishtha: "bg-green-500", Padhramani: "bg-purple-500",
  };
  return (category && colors[category]) || "bg-gray-500";
};

type ViewMode = "all" | "date" | "month" | "year";
type FilterMode = "all" | "past" | "today" | "future";

export function TimelineView({ apiEndpoint, page, limit, onPageChange, onItemSelect, filters, advancedFilters = [], groupBy, groupDirection, sortBy = 'FromDate', sortDirection = 'desc' }: TimelineViewProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  // **KEY LOGIC**: Dynamically build the API query parameters based on UI state.
  const apiParams = useMemo(() => {
    let dynamicFilters: FilterGroup[] = [];
    let dynamicSortBy = sortBy;
    let dynamicSortDirection = sortDirection;
    
    // This format is sent to your API. Ensure your backend can parse "yyyy-MM-dd".
    const today = format(new Date(), "yyyy-MM-dd");

    switch (filterMode) {
      case "past":
        dynamicFilters.push({ id: "dateFilter", logic: "AND", rules: [{ id: "rule1", field: "FromDate", operator: "lt", value: today }] });
        dynamicSortBy = "FromDate";
        dynamicSortDirection = "desc"; // Show most recent past events first
        break;
      case "today":
        dynamicFilters.push({ id: "dateFilter", logic: "AND", rules: [{ id: "rule1", field: "FromDate", operator: "eq", value: today }] });
        dynamicSortBy = "FromDate";
        dynamicSortDirection = "asc";
        break;
      case "future":
        dynamicFilters.push({ id: "dateFilter", logic: "AND", rules: [{ id: "rule1", field: "FromDate", operator: "gte", value: today }] });
        dynamicSortBy = "FromDate";
        dynamicSortDirection = "asc"; // Show upcoming events first
        break;
    }

    return {
      finalAdvancedFilters: [...advancedFilters, ...dynamicFilters],
      finalSortBy: dynamicSortBy,
      finalSortDirection: dynamicSortDirection,
    };
  }, [filterMode, advancedFilters, sortBy, sortDirection]);

  // **UNIFIED DATA FETCHING**: A single, simple query hook.
  const { data, isFetching, isError, error } = useQuery<ApiResponse, Error>({
    // The queryKey MUST include every variable the query depends on.
    // This is how React Query knows to refetch when you click a filter button.
    queryKey: [
        apiEndpoint, 
        page, 
        limit, 
        JSON.stringify(filters), 
        JSON.stringify(apiParams.finalAdvancedFilters), // This changes when filterMode changes!
        groupBy, 
        groupDirection, 
        apiParams.finalSortBy, 
        apiParams.finalSortDirection
    ],
    queryFn: () => fetchDataFromApi({ 
        apiEndpoint, 
        page, 
        limit, 
        filters, 
        advancedFilters: apiParams.finalAdvancedFilters, 
        groupBy, 
        groupDirection, 
        sortBy: apiParams.finalSortBy, 
        sortDirection: apiParams.finalSortDirection 
    }),
    placeholderData: keepPreviousData,
  });

  const items = data?.data || [];
  const pagination = data?.pagination ?? { totalPages: 1, totalItems: 0 };
  
  // Client-side grouping: This happens *after* the API has returned the correct, filtered data.
  const groupedData = useMemo(() => {
    if (!items.length) return {};
    const groups: Record<string, TimelineItem[]> = {};

    items.forEach(item => {
      let key: string;
      const date = parseDateString(item.FromDate);
      if (!date) {
        key = "Unknown Date";
      } else {
        switch (viewMode) {
          case "date": key = format(date, "yyyy-MM-dd"); break;
          case "month": key = format(date, "yyyy-MM"); break;
          case "year": key = item.Yr || format(date, "yyyy"); break;
          default: key = "All Events";
        }
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [items, viewMode]);

  const formatGroupTitle = (key: string) => {
    if (key === "All Events" || key === "Unknown Date") return key;
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(key)) return format(parse(key, "yyyy-MM-dd", new Date()), "MMMM do, yyyy");
      if (/^\d{4}-\d{2}$/.test(key)) return format(parse(key, "yyyy-MM", new Date()), "MMMM yyyy");
    } catch { return key; }
    return key;
  };
  
  const getButtonVariant = (mode: FilterMode) => filterMode === mode ? 'default' : 'outline';

  return (
    <div className="p-6 space-y-6 bg-background">
      {/* UI Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">Events Timeline</h2>
           <select className="border rounded px-2 py-1 bg-card text-card-foreground" value={viewMode} onChange={e => setViewMode(e.target.value as ViewMode)}>
              <option value="all">No Grouping</option>
              <option value="date">Group by Date</option>
              <option value="month">Group by Month</option>
              <option value="year">Group by Year</option>
            </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={getButtonVariant('past')} size="sm" onClick={() => setFilterMode("past")}>Previous</Button>
          <Button variant={getButtonVariant('today')} size="sm" onClick={() => setFilterMode("today")}>Today</Button>
          <Button variant={getButtonVariant('future')} size="sm" onClick={() => setFilterMode("future")}>Next</Button>
          <Button variant={getButtonVariant('all')} size="sm" onClick={() => setFilterMode("all")}>All Events</Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`relative space-y-6 transition-opacity duration-300 min-h-[300px] ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
        {isError && (
            <div className="text-center py-12 text-destructive">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Failed to Load Events</h3>
                <p className="text-sm bg-destructive/10 p-2 rounded-md">{error?.message}</p>
            </div>
        )}
        
        {!isError && Object.keys(groupedData).length > 0 ? (
          Object.entries(groupedData).map(([groupKey, groupItems]) => (
            <div key={groupKey} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <h3 className="text-lg font-medium">{formatGroupTitle(groupKey)}</h3>
                </div>
                <Separator className="flex-1" />
                <Badge variant="secondary">{groupItems.length} events</Badge>
              </div>
              <div className="space-y-6">
                {groupItems.map((item) => (
                  <div key={item.EventID} className="relative flex gap-6">
                    {/* ... Card rendering logic ... */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-4 h-4 mt-1 rounded-full ${getCategoryColor(item.fkEventCategory)} border-2 border-background`}></div>
                    </div>
                    <Card className="flex-1 cursor-pointer hover:shadow-md transition-shadow" onClick={() => onItemSelect?.(item)}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-4">
                            <h4 className="font-bold text-lg">{item.EventName || 'Untitled Event'}</h4>
                          </div>
                          <Badge className={`${getCategoryColor(item.fkEventCategory)} text-white`}>{item.NewEventCategory || 'Event'}</Badge>
                        </div>
                        <Separator />
                        <div className="space-y-1 text-sm">
                           <div className="flex justify-between"><span className="text-muted-foreground">From Date</span><span className="font-medium">{(item.FromDate)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">To Date</span><span className="font-medium">{(item.ToDate)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Year</span><span className="font-medium">{item.Yr || 'N/A'}</span></div>
                        </div>
                        {item.EventRemarks && (
                          <div>
                            <span className="text-muted-foreground text-sm">Remarks</span>
                            <p className="mt-1 text-sm bg-muted p-3 rounded-lg max-h-24 overflow-y-auto">{item.EventRemarks}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : !isFetching && !isError ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Events Found</h3>
            <p className="text-muted-foreground">There are no events matching your criteria.</p>
          </div>
        ) : null}
        
        {isFetching && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-background/50">
            <div className="flex flex-col items-center gap-2 p-4 bg-background rounded-lg border">
              <Loader2 className="w-6 h-6 animate-spin" />
              <h3 className="text-lg font-medium">Loading Events...</h3>
            </div>
          </div>
        )}
      </div>

       {/* Pagination */}
       {!isError && items.length > 0 && (
        <div className="mt-4 flex justify-end">
          <SimplePagination
            currentPage={page}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}