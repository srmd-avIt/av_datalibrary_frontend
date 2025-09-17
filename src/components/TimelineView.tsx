import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
// ✅ FIX 3: Added 'endOfWeek' to the import list
import { format, parseISO, startOfWeek, isValid, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, endOfWeek } from "date-fns";
import { keepPreviousData } from '@tanstack/react-query' // ✅ FIX 2a: Import the placeholderData function

// --- UI Imports ---
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { Calendar, Loader2 } from "lucide-react";

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

type ViewMode = "day" | "week" | "month" | "year";

// --- API Fetcher Function ---
// ✅ FIX 1: TypeScript now understands `import.meta.env` because of the vite-env.d.ts file.
const API_BASE_URL = import.meta.env.VITE_API_URL;

async function fetchDataFromApi({ apiEndpoint }: { apiEndpoint: string }): Promise<ApiResponse> {
  const params = new URLSearchParams({ page: "1", limit: "50" });

  if (!API_BASE_URL) {
    throw new Error("API URL not configured. Set VITE_API_URL in .env");
  }

  const url = new URL(API_BASE_URL);
  url.pathname += apiEndpoint.startsWith("/") ? apiEndpoint : `/${apiEndpoint}`;
  url.search = params.toString();

  console.log("🔗 Fetching:", url.href);

  const response = await fetch(url.href, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText} for URL: ${url.href}`);
  }

  const json = await response.json();
  console.log("📦 API Response:", json);
  return json;
}

// --- Component Props ---
interface TimelineViewProps {
  apiEndpoint: string;
  onItemSelect?: (item: TimelineItem) => void;
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

// --- The Standalone Component ---
export function TimelineView({ apiEndpoint, onItemSelect }: TimelineViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const dateRange = useMemo(() => {
    let startDate, endDate;
    switch (viewMode) {
      case 'day': startDate = startOfDay(currentDate); endDate = endOfDay(currentDate); break;
      case 'week': startDate = startOfWeek(currentDate); endDate = endOfWeek(currentDate); break;
      case 'month': startDate = startOfMonth(currentDate); endDate = endOfMonth(currentDate); break;
      case 'year': startDate = startOfYear(currentDate); endDate = endOfYear(currentDate); break;
    }
    return { startDate, endDate };
  }, [viewMode, currentDate]);

  const { data: queryData, isFetching } = useQuery<ApiResponse>({
  queryKey: [apiEndpoint], // ❌ no dateRange in the key anymore
  queryFn: () => fetchDataFromApi({ apiEndpoint }),
  placeholderData: keepPreviousData,
});

  
  // ✅ FIX 4: Correctly and safely access the data. `queryData` can be undefined on the first render.
  const items = queryData?.data || [];

  const groupedData: Record<string, TimelineItem[]> = useMemo(() => {
    const sorted = [...items]
      .filter(item => item.FromDate && typeof item.FromDate === 'string')
      .sort((a, b) => new Date(a.FromDate).getTime() - new Date(b.FromDate).getTime());

    return sorted.reduce((groups, item) => {
      try {
        const itemDate = parseISO(item.FromDate);
        if (!isValid(itemDate)) return groups;
        let key = "";
        switch (viewMode) {
          case "day": key = format(itemDate, "yyyy-MM-dd"); break;
          case "week": const weekStart = startOfWeek(itemDate, { weekStartsOn: 1 }); key = format(weekStart, "yyyy-'W'ww"); break;
          case "month": key = format(itemDate, "yyyy-MM"); break;
          case "year": key = format(itemDate, "yyyy"); break;
        }
        if (key) {
          if (!groups[key]) groups[key] = [];
          groups[key].push(item);
        }
      } catch (e) {
        console.error("Failed to parse date for item:", item.FromDate, item);
      }
      return groups;
    }, {} as Record<string, TimelineItem[]>);
  }, [items, viewMode]);

  const formatGroupTitle = (key: string) => {
    try {
      switch (viewMode) {
        case "day": return format(parseISO(key), "EEEE, MMMM do, yyyy");
        case "week":
          const year = parseInt(key.substring(0, 4));
          const week = parseInt(key.substring(6));
          const d = new Date(year, 0, (week - 1) * 7 + 1);
          const weekStartDt = startOfWeek(d, { weekStartsOn: 1 });
          const weekEndDt = new Date(weekStartDt); weekEndDt.setDate(weekEndDt.getDate() + 6);
          return `${format(weekStartDt, "MMM do")} - ${format(weekEndDt, "MMM do, yyyy")}`;
        case "month": return format(parseISO(key + "-01"), "MMMM yyyy");
        case "year": return key;
        default: return key;
      }
    } catch { return key; }
  };

  const getCategoryColor = (category?: string) => {
    const colors: { [key: string]: string } = { "Satsang": "bg-blue-500", "Festival": "bg-orange-500", "Pratishtha": "bg-green-500", "Padhramani": "bg-purple-500" };
    return (category && colors[category]) || "bg-gray-500";
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    const multiplier = direction === "next" ? 1 : -1;
    switch (viewMode) {
      case "day": newDate.setDate(currentDate.getDate() + multiplier); break;
      case "week": newDate.setDate(currentDate.getDate() + 7 * multiplier); break;
      case "month": newDate.setMonth(currentDate.getMonth() + multiplier); break;
      case "year": newDate.setFullYear(currentDate.getFullYear() + multiplier); break;
    }
    setCurrentDate(newDate);
  };

  return (
    <div className="p-6 space-y-6 bg-background">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">Events Timeline</h2>
          <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>Previous</Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
          <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>Next</Button>
        </div>
      </div>

      {/* Timeline Content */}
      <div className={`relative space-y-6 transition-opacity duration-300 min-h-[300px] ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
        {Object.entries(groupedData).map(([groupKey, groupItems]) => (
          <div key={groupKey} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <h3 className="text-lg font-medium">{formatGroupTitle(groupKey)}</h3>
              </div>
              <Separator className="flex-1" />
              <Badge variant="secondary">{groupItems.length} events</Badge>
            </div>
            <div className="relative">
              <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-border -z-10"></div>
              <div className="space-y-6">
                {groupItems.map((item) => (
                  <div key={item.EventID} className="relative flex gap-6">
                    <div className="relative flex-shrink-0">
                      <div className={`w-4 h-4 mt-1 rounded-full ${getCategoryColor(item.fkEventCategory)} border-2 border-background`}></div>
                    </div>
                    <Card className="flex-1 cursor-pointer hover:shadow-md transition-shadow" onClick={() => onItemSelect?.(item)}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-4">
                            <h4 className="font-bold text-lg">{item.EventName || 'Untitled Event'}</h4>
                            <span className="text-sm text-muted-foreground">{formatDisplayDate(item.FromDate)}</span>
                          </div>
                          <Badge className={`${getCategoryColor(item.fkEventCategory)} text-white`}>{item.fkEventCategory || 'Event'}</Badge>
                        </div>
                        <Separator />
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between"><span className="text-muted-foreground">Event Code</span><span className="font-medium">{item.EventCode || 'N/A'}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Year</span><span className="font-medium">{item.Yr || 'N/A'}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">From Date</span><span className="font-medium">{formatDisplayDate(item.FromDate)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">To Date</span><span className="font-medium">{formatDisplayDate(item.ToDate)}</span></div>
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
          </div>
        ))}
        {isFetching && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-background/50">
            <div className="flex flex-col items-center gap-2 p-4 bg-background rounded-lg border">
              <Loader2 className="w-6 h-6 animate-spin" />
              <h3 className="text-lg font-medium">Loading Events...</h3>
            </div>
          </div>
        )}
        {!isFetching && Object.keys(groupedData).length === <strong>0</strong> && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Events Found</h3>
            <p className="text-muted-foreground">There are no events to display for the selected time period.</p>
          </div>
        )}
      </div>
    </div>
  );
}