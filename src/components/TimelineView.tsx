import React, { useState, useMemo } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { Clock, MapPin, Users, User, Calendar, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { format, parseISO, startOfWeek } from "date-fns";

interface TimelineItem {
  id: string;
  date: string;
  location?: string;
  country?: string;
  duration?: number;
  attendees?: number;
  topic?: string;
  speaker?: string;
  type?: string;
  notes?: string;
  [key: string]: any;
}

type ViewMode = "day" | "week" | "month" | "year";

interface TimelineViewProps {
  data: TimelineItem[];
  onItemSelect?: (item: TimelineItem) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  currentDate: Date;
  onCurrentDateChange: (date: Date) => void;
  isLoading?: boolean;
}

export function TimelineView({ 
  data, 
  onItemSelect,
  viewMode,
  onViewModeChange,
  currentDate,
  onCurrentDateChange,
  isLoading
}: TimelineViewProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const groupedData: Record<string, TimelineItem[]> = useMemo(() => {
    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return sorted.reduce((groups, item) => {
      try {
        const itemDate = parseISO(item.date);
        let key = "";
        switch (viewMode) {
          case "day":
            key = format(itemDate, "yyyy-MM-dd");
            break;
          case "week":
            const weekStart = startOfWeek(itemDate);
            key = format(weekStart, "yyyy-'W'ww");
            break;
          case "month":
            key = format(itemDate, "yyyy-MM");
            break;
          case "year":
            key = format(itemDate, "yyyy");
            break;
        }
        if (key) {
          if (!groups[key]) groups[key] = [];
          groups[key].push(item);
        }
      } catch (e) {
        console.error("Invalid date format for item:", item);
      }
      return groups;
    }, {} as Record<string, TimelineItem[]>);

  }, [data, viewMode]);

  const formatGroupTitle = (key: string) => {
    try {
      switch (viewMode) {
        case "day":
          return format(parseISO(key), "EEEE, MMMM do, yyyy");
        case "week":
          const year = parseInt(key.substring(0, 4));
          const week = parseInt(key.substring(6));
          const weekStartDt = startOfWeek(new Date(year, 0, 1));
          weekStartDt.setDate(weekStartDt.getDate() + (week - 1) * 7);
          const weekEndDt = new Date(weekStartDt);
          weekEndDt.setDate(weekEndDt.getDate() + 6);
          return `${format(weekStartDt, "MMM do")} - ${format(weekEndDt, "MMM do, yyyy")}`;
        case "month":
          return format(parseISO(key + "-01"), "MMMM yyyy");
        case "year":
          return key;
        default:
          return key;
      }
    } catch {
      return key;
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      "Satsang": "bg-blue-500",
      "Discourse": "bg-purple-500", 
      "Prayer Meeting": "bg-green-500",
      "Festival": "bg-orange-500",
      "Regular": "bg-blue-500",
      "Special Event": "bg-red-500"
    };
    return colors[type as keyof typeof colors] || "bg-gray-500";
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    const multiplier = direction === "next" ? 1 : -1;
    switch (viewMode) {
      case "day":
        newDate.setDate(currentDate.getDate() + multiplier);
        break;
      case "week":
        newDate.setDate(currentDate.getDate() + 7 * multiplier);
        break;
      case "month":
        newDate.setMonth(currentDate.getMonth() + multiplier);
        break;
      case "year":
        newDate.setFullYear(currentDate.getFullYear() + multiplier);
        break;
    }
    onCurrentDateChange(newDate);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">Events Timeline</h2>
          <Select value={viewMode} onValueChange={(value: ViewMode) => onViewModeChange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => onCurrentDateChange(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
            Next
          </Button>
        </div>
      </div>

      {/* Timeline Content */}
      <div className={`relative space-y-6 transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
        {Object.entries(groupedData).map(([groupKey, items]) => (
          <div key={groupKey} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <h3 className="text-lg font-medium">{formatGroupTitle(groupKey)}</h3>
              </div>
              <Separator className="flex-1" />
              <Badge variant="secondary">{items.length} events</Badge>
            </div>

            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-border -z-10"></div>
              
              <div className="space-y-6">
                {items.map((item) => {
                  const isExpanded = expandedItems.includes(item.id);
                  
                  return (
                    <div key={item.id} className="relative flex gap-6">
                      {/* Timeline Node */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-4 h-4 mt-1 rounded-full ${getTypeColor(item.type || '')} border-2 border-background`}></div>
                      </div>

                      {/* Event Card */}
                      <Card 
                        className="flex-1 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => onItemSelect?.(item)}
                      >
                        <CardContent className="p-4 space-y-4">
                          {/* Event Name as Title */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-bold text-lg">{item.EventName || 'Untitled Event'}</h4>
                              <span className="text-sm text-muted-foreground">
                                {format(parseISO(item.date), "MMM do, yyyy")}
                              </span>
                            </div>
                            <Badge className={`${getTypeColor(item.type || '')} text-white`}>
                              {item.type || 'Event'}
                            </Badge>
                          </div>

                          <Separator />

                          {/* Details Section */}
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Event Code</span>
                              <span className="font-medium">{item.EventCode}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Year</span>
                              <span className="font-medium">{item.Yr}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">From Date</span>
                              <span className="font-medium">{item.FromDate || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">To Date</span>
                              <span className="font-medium">{item.ToDate || 'N/A'}</span>
                            </div>
                          </div>

                          {/* Remarks Section */}
                          <div>
                            <span className="text-muted-foreground text-sm">Remarks</span>
                            <p className="mt-1 text-sm bg-muted p-3 rounded-lg h-20 overflow-y-auto">
                              {item.EventRemarks || "No remarks provided."}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
            <div className="text-center py-12 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
                <h3 className="text-lg font-medium">Loading Events...</h3>
            </div>
        )}

        {!isLoading && Object.keys(groupedData).length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No events found</h3>
            <p className="text-muted-foreground">There are no events to display for the selected time period.</p>
          </div>
        )}
      </div>
    </div>
  );
}