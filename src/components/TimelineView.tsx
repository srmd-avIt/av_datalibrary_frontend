import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Calendar, Loader2 } from "lucide-react";
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
// Helper to safely format dates for display
const formatDisplayDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A';
  try {
    const dt = parseISO(dateString);
    return isValid(dt) ? format(dt, "MMM do, yyyy") : 'Invalid Date';
  } catch {
    return 'Invalid Date';
  }
};

const getCategoryColor = (category?: string) => {
  const colors: { [key: string]: string } = {
    "Satsang": "bg-blue-500",
    "Festival": "bg-orange-500",
    "Pratishtha": "bg-green-500",
    "Padhramani": "bg-purple-500"
  };
  return (category && colors[category]) || "bg-gray-500";
};

type ViewMode = "all" | "date" | "month" | "year";

export function TimelineView({ apiEndpoint, page, limit, onPageChange, onItemSelect, filters, advancedFilters, groupBy, groupDirection, sortBy, sortDirection }: TimelineViewProps) {
  const { data, isLoading, isFetching } = useQuery<ApiResponse>({
    queryKey: [
      apiEndpoint,
      page,
      limit,
      JSON.stringify(filters),
      JSON.stringify(advancedFilters),
      groupBy,
      groupDirection,
      sortBy,
      sortDirection,
    ],
    queryFn: () =>
      fetchDataFromApi({
        apiEndpoint,
        page,
        limit,
        filters,
        advancedFilters,
        groupBy,
        groupDirection,
        sortBy,
        sortDirection,
      }),
    keepPreviousData: true,
  });

  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [currentDate, setCurrentDate] = useState(new Date());

  const items = data?.data || [];
  const pagination = data?.pagination ?? { totalPages: 1, totalItems: 0 };

  // Group data by the selected view mode and current date
  const groupedData = useMemo(() => {
    if (!items.length) return {};

    const sorted = [...items].sort((a, b) => new Date(a.FromDate).getTime() - new Date(b.FromDate).getTime());
    let groups: Record<string, TimelineItem[]> = {};

    switch (viewMode) {
      case "date":
        // Group by the full FromDate string (e.g., "DD-MM-YYYY")
        sorted.forEach(item => {
          const key = item.FromDate || "Unknown Date";
          if (!groups[key]) groups[key] = [];
          groups[key].push(item);
        });
        break;
      case "month":
        // Group by month and year from FromDate (format: "DD-MM-YYYY")
        sorted.forEach(item => {
          const date = parse(item.FromDate, "dd-MM-yyyy", new Date());
          if (isValid(date)) {
            const key = format(date, "yyyy-MM"); // e.g., "2012-12"
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
          } else {
            if (!groups["Unknown Month"]) groups["Unknown Month"] = [];
            groups["Unknown Month"].push(item);
          }
        });
        break;
      case "year":
        // Group by Yr property
        sorted.forEach(item => {
          const key = item.Yr || "Unknown Year";
          if (!groups[key]) groups[key] = [];
          groups[key].push(item);
        });
        break;
      default:
        groups = { All: sorted };
    }
    // If no events in the current period, show all
    if (Object.keys(groups).length === 0) {
      return { All: items };
    }
    return groups;
  }, [items, viewMode, currentDate]);

  const filteredItems = useMemo(() => {
    let arr = [...(data?.data || [])];
    // Sort
    if (sortBy && sortBy !== "none") {
      arr.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return -1;
        if (bVal == null) return 1;
        if (typeof aVal === "number" && typeof bVal === "number") return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        return String(aVal).localeCompare(String(bVal)) * (sortDirection === "asc" ? 1 : -1);
      });
    }
    // Group
    if (groupBy && groupBy !== "none") {
      const groups: Record<string, TimelineItem[]> = {};
      arr.forEach(item => {
        const key = item[groupBy] ?? "Ungrouped";
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });
      // Optionally sort group keys
      const sortedKeys = Object.keys(groups).sort((a, b) => groupDirection === "asc" ? a.localeCompare(b) : b.localeCompare(a));
      const sortedGroups: Record<string, TimelineItem[]> = {};
      sortedKeys.forEach(key => { sortedGroups[key] = groups[key]; });
      return sortedGroups;
    }
    return { "": arr };
  }, [data, groupBy, groupDirection, sortBy, sortDirection]);

  const formatGroupTitle = (key: string) => {
    if (/^\d{4}-\d{2}$/.test(key)) {
      const date = parse(key, "yyyy-MM", new Date());
      return format(date, "MMMM yyyy");
    }
    // Handle "dd-MM-yyyy" format for the date view
    if (/^\d{2}-\d{2}-\d{4}$/.test(key)) {
      const date = parse(key, "dd-MM-yyyy", new Date());
      return isValid(date) ? format(date, "MMMM do, yyyy") : key;
    }
    return key;
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case "date":
        newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1));
        break;
      case "month":
        newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
        break;
      case "year":
        newDate.setFullYear(currentDate.getFullYear() + (direction === "next" ? 1 : -1));
        break;
    }
    setCurrentDate(newDate);
  };

  return (
    <div className="p-6 space-y-6 bg-background">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">Events Timeline</h2>
    <select
  className="border rounded px-2 py-1 bg-black text-white"
  style={{
    WebkitAppearance: 'none',
    appearance: 'none',
    backgroundImage:
      "url(\"data:image/svg+xml;utf8,<svg fill='white' height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.5rem center',
    backgroundSize: '1rem',
    paddingRight: '2rem', // extra space for arrow
  }}
  value={viewMode}
  onChange={e => setViewMode(e.target.value as ViewMode)}
>
  <option style={{ backgroundColor: '#000', color: '#fff' }} value="all">All</option>
  <option style={{ backgroundColor: '#000', color: '#fff' }} value="date">Date</option>
  <option style={{ backgroundColor: '#000', color: '#fff' }} value="month">Month</option>
  <option style={{ backgroundColor: '#000', color: '#fff' }} value="year">Year</option>
</select>


        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
            Next
          </Button>
        </div>
      </div>
      <div className={`relative space-y-6 transition-opacity duration-300 min-h-[300px] ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
        {Object.entries(groupedData).length > 0 ? (
          Object.entries(groupedData as Record<string, TimelineItem[]>).map(([groupKey, groupItems]) => (
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
                {(groupItems as TimelineItem[]).map((item) => (
                  <div key={item.EventID} className="relative flex gap-6">
                    <div className="relative flex-shrink-0">
                      <div className={`w-4 h-4 mt-1 rounded-full ${getCategoryColor(item.fkEventCategory)} border-2 border-background`}></div>
                    </div>
                    <Card className="flex-1 cursor-pointer hover:shadow-md transition-shadow" onClick={() => onItemSelect?.(item)}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-4">
                            <h4 className="font-bold text-lg">{item.EventName || 'Untitled Event'}</h4>
                            <span className="text-sm text-muted-foreground">{(item.FromDate)}</span>
                          </div>
                          <Badge className={`${getCategoryColor(item.fkEventCategory)} text-white`}>{item.NewEventCategory || 'Event'}</Badge>
                        </div>
                        <Separator />
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between"><span className="text-muted-foreground">Event Code</span><span className="font-medium">{item.EventCode || 'N/A'}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Year</span><span className="font-medium">{item.Yr || 'N/A'}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">From Date</span><span className="font-medium">{(item.FromDate)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">To Date</span><span className="font-medium">{(item.ToDate)}</span></div>
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
        ) : isFetching ? null : (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Events Found</h3>
            <p className="text-muted-foreground">There are no events to display.</p>
          </div>
        )}
        {isFetching && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-background/50">
            <div className="flex flex-col items-center gap-2 p-4 bg-background rounded-lg border">
              <Loader2 className="w-6 h-6 animate-spin" />
              <h3 className="text-lg font-medium">Loading Events...</h3>
            </div>
          </div>
        )}
      </div>
       {/* ✅ Pagination */}
      {items.length > 0 && (
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