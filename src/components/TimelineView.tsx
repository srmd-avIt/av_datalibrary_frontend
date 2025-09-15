import React, { useState, useMemo } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { Clock, MapPin, Users, User, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "../data/date-fns";

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

interface TimelineViewProps {
  data: TimelineItem[];
  onItemSelect?: (item: TimelineItem) => void;
}

type ViewMode = "day" | "week" | "month" | "year";

export function TimelineView({ data, onItemSelect }: TimelineViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const groupedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    switch (viewMode) {
      case "day":
        return sorted.reduce((groups, item) => {
          const date = format(parseISO(item.date), "yyyy-MM-dd");
          if (!groups[date]) groups[date] = [];
          groups[date].push(item);
          return groups;
        }, {} as Record<string, TimelineItem[]>);
      
      case "week":
        return sorted.reduce((groups, item) => {
          const date = parseISO(item.date);
          const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
          const weekKey = format(weekStart, "yyyy-'W'ww");
          if (!groups[weekKey]) groups[weekKey] = [];
          groups[weekKey].push(item);
          return groups;
        }, {} as Record<string, TimelineItem[]>);
      
      case "month":
        return sorted.reduce((groups, item) => {
          const monthKey = format(parseISO(item.date), "yyyy-MM");
          if (!groups[monthKey]) groups[monthKey] = [];
          groups[monthKey].push(item);
          return groups;
        }, {} as Record<string, TimelineItem[]>);
      
      case "year":
        return sorted.reduce((groups, item) => {
          const yearKey = format(parseISO(item.date), "yyyy");
          if (!groups[yearKey]) groups[yearKey] = [];
          groups[yearKey].push(item);
          return groups;
        }, {} as Record<string, TimelineItem[]>);
      
      default:
        return { "All": sorted };
    }
  }, [data, viewMode]);

  const formatGroupTitle = (key: string) => {
    try {
      switch (viewMode) {
        case "day":
          return format(parseISO(key), "EEEE, MMMM do, yyyy");
        case "week":
          const weekStart = parseISO(key.replace(/W\d+/, "01"));
          const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
          return `${format(weekStart, "MMM do")} - ${format(weekEnd, "MMM do, yyyy")}`;
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
    switch (viewMode) {
      case "day":
        newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1));
        break;
      case "week":
        newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
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
    <div className="p-6 space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">Events Timeline</h2>
          <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
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
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
            Next
          </Button>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="space-y-6">
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
              <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-border"></div>
              
              <div className="space-y-6">
                {items.map((item, index) => {
                  const isExpanded = expandedItems.includes(item.id);
                  const isLast = index === items.length - 1;
                  
                  return (
                    <div key={item.id} className="relative flex gap-6">
                      {/* Timeline Node */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${getTypeColor(item.type || '')} border-2 border-background`}></div>
                        {!isLast && <div className="absolute left-1.5 top-3 w-0.5 h-6 bg-border"></div>}
                      </div>

                      {/* Event Card */}
                      <Card 
                        className="flex-1 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => onItemSelect?.(item)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge className={`${getTypeColor(item.type || '')} text-white`}>
                                  {item.type || 'Event'}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {format(parseISO(item.FormDate), "MMM do, yyyy 'at' h:mm a")}
                                </span>
                              </div>

                              <h4 className="font-medium text-lg">{item.topic || 'Untitled Event'}</h4>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{item.location || 'Unknown'}, {item.country || 'Unknown'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{item.duration || 0}h</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>{(item.attendees || 0).toLocaleString()}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{item.speaker || 'Unknown Speaker'}</span>
                              </div>

                              {isExpanded && item.notes && (
                                <div className="mt-3 p-3 bg-muted rounded-lg">
                                  <p className="text-sm">{item.notes}</p>
                                </div>
                              )}
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded(item.id);
                              }}
                              className="flex-shrink-0"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
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

        {Object.keys(groupedData).length === 0 && (
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