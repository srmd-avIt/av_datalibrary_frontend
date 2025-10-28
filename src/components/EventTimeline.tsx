"use client";

import React, { useEffect, useMemo, useState } from "react";
import * as Select from "@radix-ui/react-select";
import { Loader2, X, ChevronDown, ChevronUp, Check, Eye } from "lucide-react";
import { format, subDays, addDays } from "date-fns";

const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL) || "";

// HELPER FUNCTION: Checks if two dates are on the same day (ignoring time)
const isSameDay = (date1: Date | null, date2: Date | null): boolean => {
  if (!date1 || !date2) {
    return false;
  }
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};


const parseFlexibleDate = (dateInput: string | number | null | undefined): Date | null => {
  if (!dateInput && dateInput !== 0) return null;
  const asDate = new Date(dateInput as any);
  if (!isNaN(asDate.getTime())) return asDate;
  if (typeof dateInput === "number" || /^\d{5}$/.test(String(dateInput))) {
    const excelEpoch = new Date((Number(dateInput) - 25569) * 86400 * 1000);
    if (!isNaN(excelEpoch.getTime())) return excelEpoch;
  }
  const parts = String(dateInput).match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (parts) {
    const year = parseInt(parts[3], 10) < 100 ? 2000 + parseInt(parts[3], 10) : parseInt(parts[3], 10);
    const month = parseInt(parts[2], 10) - 1;
    const day = parseInt(parts[1], 10);
    const constructed = new Date(year, month, day);
    if (!isNaN(constructed.getTime())) return constructed;
  }
  return null;
};

type Event = {
  EventID: number | string;
  EventCode?: string;
  EventName?: string;
  FromDate?: string;
  ToDate?: string;
  fkEventCategory?: string;
  [key: string]: any;
};

type GroupedEvents = Record<string, Event[]>;

const DESKTOP_PAGE_SIZE = 50;
const MOBILE_PAGE_SIZE = 20;

interface EventTimelineProps {
  apiEndpoint?: string;
  title?: string;
  onShowDetails: (event: Event) => void;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({
  apiEndpoint = "/events",
  title = "Event Timeline",
  onShowDetails,
}) => {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [groupBy, setGroupBy] = useState<"FromDate" | "ToDate" | "none">("none");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  const [openDateKey, setOpenDateKey] = useState<string | null>(null);

  // --- NEW: State to control filtering behavior ---
  const [searchMode, setSearchMode] = useState<'anniversary' | 'specific'>('anniversary');

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const base = API_BASE_URL || "";
        const url = `${base}${apiEndpoint}${
          base || apiEndpoint.startsWith("/") ? "?limit=100000" : "?limit=100000"
        }`;
        const res = await fetch(url);
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`API ${res.status}: ${txt}`);
        }
        const json = await res.json();
        const items = json?.data || json || [];
        setAllEvents(Array.isArray(items) ? items : []);
      } catch (err: any) {
        setError(err?.message || "Failed to fetch events");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [apiEndpoint]);

  useEffect(() => setPage(1), [groupBy, startDate, endDate, isMobile, searchMode]);

  const handleResetDates = () => {
    setStartDate(null);
    setEndDate(null);
    setSearchMode('anniversary'); // Reset to default mode
  };

  // --- MODIFIED: Button handler now sets the mode to 'specific' ---
  const handleSetDate = (date: Date) => {
    setSearchMode('specific');
    setStartDate(date);
    setEndDate(null);
  };
  
  const handleFindPreviousEventDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let mostRecentPastDate: Date | null = null;

    for (const event of allEvents) {
      const eventToDate = parseFlexibleDate(event.ToDate);

      if (eventToDate && eventToDate < today) {
        if (!mostRecentPastDate || eventToDate > mostRecentPastDate) {
          mostRecentPastDate = eventToDate;
        }
      }
    }
    
    if (mostRecentPastDate) {
      handleSetDate(mostRecentPastDate); // This now correctly sets the mode
    }
  };

  const effectivePageSize = isMobile ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE;

  const { pagedDates, groupedEvents, pagedEvents, totalPages, totalEvents } = useMemo(() => {
    if (!allEvents.length) return { pagedDates: [], groupedEvents: {}, pagedEvents: [], totalPages: 0, totalEvents: 0 };

    // --- FINAL CORRECTED FILTER LOGIC ---
    const filtered = allEvents.filter((ev) => {
      const evStart = parseFlexibleDate(ev.FromDate);
      const evEnd = parseFlexibleDate(ev.ToDate);
      if (!startDate && !endDate) return true;
      
      if (startDate && !endDate) {
        if (!evStart) return false;
        
        // Check the search mode to apply the correct filter logic
        if (searchMode === 'specific') {
          // Exact date match (Year, Month, Day) - used by buttons
          return isSameDay(evStart, startDate);
        } else {
          // Anniversary match (Month, Day only) - used by date picker
          return evStart.getMonth() === startDate.getMonth() && evStart.getDate() === startDate.getDate();
        }
      }

      if (!evStart || !evEnd) return false;
      const afterStart = startDate ? evEnd >= startDate : true;
      const beforeEnd = endDate ? evStart <= endDate : true;
      return afterStart && beforeEnd;
    });

    if (groupBy === "none") {
      const calcPages = Math.max(1, Math.ceil(filtered.length / effectivePageSize));
      const paged = filtered.slice((page - 1) * effectivePageSize, page * effectivePageSize);
      return { pagedDates: [], groupedEvents: {}, pagedEvents: paged, totalPages: calcPages, totalEvents: filtered.length };
    }

    const grouped = filtered.reduce((acc: GroupedEvents, ev) => {
      const raw = ev[groupBy];
      const pd = parseFlexibleDate(raw);
      if (!pd) return acc;
      const key = format(pd, "yyyy-MM-dd");
      if (!acc[key]) acc[key] = [];
      acc[key].push(ev);
      return acc;
    }, {});

    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
    const calcPages = Math.max(1, Math.ceil(sortedDates.length / effectivePageSize));
    const sliceDates = sortedDates.slice((page - 1) * effectivePageSize, page * effectivePageSize);
    return { pagedDates: sliceDates, groupedEvents: grouped, pagedEvents: [], totalPages: calcPages, totalEvents: filtered.length };
  }, [allEvents, groupBy, page, startDate, endDate, effectivePageSize, searchMode]); // Added searchMode to dependencies

  const formatDateForDisplay = (d: string | number) => {
    const pd = parseFlexibleDate(d);
    if (!pd) return "Invalid Date";
    try {
      return format(pd, "MMMM d, yyyy");
    } catch {
      return pd.toDateString();
    }
  };

  const hasResults = groupBy === "none" ? pagedEvents.length > 0 : pagedDates.length > 0;
  const toggleDateAccordion = (dateKey: string) => setOpenDateKey((p) => (p === dateKey ? null : dateKey));
  const groupByOptions = { none: "No Group", FromDate: "From Date" };

  const today = new Date();
  const tomorrow = addDays(today, 1);
  
  const baseButtonClass = "px-3 py-2 text-sm rounded-md transition-colors";
  const activeButtonClass = "bg-blue-600 hover:bg-blue-500 text-white font-semibold";
  const inactiveButtonClass = "bg-slate-700 hover:bg-slate-600 text-slate-300";
// Inside your EventTimeline component, after allEvents is defined
const mostRecentPastEventDate = useMemo(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // normalize to midnight
  let mostRecent: Date | null = null;

  for (const ev of allEvents) {
    const evTo = parseFlexibleDate(ev.ToDate);
    if (evTo && evTo < today) {
      if (!mostRecent || evTo > mostRecent) mostRecent = evTo;
    }
  }

  return mostRecent;
}, [allEvents]);


  return (
    <div className="p-4 md:p-6 text-slate-200 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            <div className="text-slate-400 font-medium mt-1">
                {totalEvents > 0 ? `${totalEvents} events found` : "No events"}
            </div>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
  {/* Previous Button */}
 <button
  onClick={handleFindPreviousEventDate}
  style={{
    padding: "8px 12px",
    fontSize: "14px",
    borderRadius: "6px",
    fontWeight: 500,
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
    backgroundColor: isSameDay(startDate, mostRecentPastEventDate)
      ? "#2563eb" // active: blue
      : "#334155", // default: dark
    color: "#fff",
  }}
 
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = isSameDay(startDate, mostRecentPastEventDate)
      ? "#2563eb"
      : "#334155";
  }}
>
  Previous
</button>


  {/* Today Button */}
  <button
    onClick={() => handleSetDate(today)}
    style={{
      padding: "8px 12px",
      fontSize: "14px",
      borderRadius: "6px",
      fontWeight: 600,
      border: "none",
      cursor: "pointer",
      transition: "all 0.2s ease",
      backgroundColor: isSameDay(startDate, today) ? "#2563eb" : "#334155",
      color: "#fff",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = isSameDay(startDate, today)
        ? "#3b82f6"
        : "#475569";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = isSameDay(startDate, today)
        ? "#2563eb"
        : "#334155";
    }}
  >
    Today
  </button>

  {/* Next Button */}
  <button
    onClick={() => handleSetDate(tomorrow)}
    style={{
      padding: "8px 12px",
      fontSize: "14px",
      borderRadius: "6px",
      fontWeight: 500,
      border: "none",
      cursor: "pointer",
      transition: "all 0.2s ease",
      backgroundColor: isSameDay(startDate, tomorrow) ? "#2563eb" : "#334155",
      color: "#fff",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = isSameDay(startDate, tomorrow)
        ? "#3b82f6"
        : "#475569";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = isSameDay(startDate, tomorrow)
        ? "#2563eb"
        : "#334155";
    }}
  >
    Next
  </button>
</div>

      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label htmlFor="groupBySelect" className="text-sm font-medium text-slate-400">Group by:</label>
            <Select.Root value={groupBy} onValueChange={(value) => setGroupBy(value as any)}>
              {/* Select Trigger and Content... (no changes here) */}
               <Select.Trigger
                id="groupBySelect"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                  backgroundColor: "#0f172a", border: "1px solid #475569", borderRadius: 6,
                  color: "white", width: "100%", flex: 1, minWidth: isMobile ? undefined : 150,
                  padding: isMobile ? "6px 12px" : "8px 12px", fontSize: isMobile ? 14 : 16,
                  transition: "all 0.2s", outline: "none", boxShadow: "0 0 0 2px transparent",
                }}
                onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px #3b82f6")}
                onBlur={(e) => (e.currentTarget.style.boxShadow = "0 0 0 0 transparent")}
              >
                <Select.Value placeholder="Select grouping..." />
                <Select.Icon style={{ color: "#94a3b8" }}><ChevronDown size={16} /></Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content
                  position="popper" sideOffset={5}
                  style={{
                    zIndex: 50, backgroundColor: "#1e293b", border: "1px solid #374151",
                    borderRadius: 6, boxShadow: "0 4px 6px rgba(0,0,0,0.1)", padding: 4,
                    width: "var(--radix-select-trigger-width)",
                  }}
                >
                  <Select.ScrollUpButton style={{display: "flex", alignItems: "center", justifyContent: "center", padding: 4, cursor: "default"}} >
                    <ChevronUp size={16} />
                  </Select.ScrollUpButton>
                  <Select.Viewport>
                    {Object.entries(groupByOptions).map(([value, label]) => (
                      <Select.Item
                        key={value} value={value}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          fontSize: 14, borderRadius: 3, padding: "6px 12px", color: "#e5e7eb",
                          position: "relative", userSelect: "none", cursor: "pointer",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#2563eb"; e.currentTarget.style.color = "white"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#e5e7eb"; }}
                      >
                        <Select.ItemText>{label}</Select.ItemText>
                        <Select.ItemIndicator><Check size={16} /></Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                  <Select.ScrollDownButton style={{display: "flex", alignItems: "center", justifyContent: "center", padding: 4, cursor: "default"}}>
                    <ChevronDown size={16} />
                  </Select.ScrollDownButton>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label htmlFor="startDate" className="text-sm font-medium text-slate-400">Date:</label>
            <div style={{ position: "relative", width: "100%", flex: 1, maxWidth: "auto" }}>
              {/* --- MODIFIED: Date picker onChange now sets mode to 'anniversary' --- */}
              <input type="date" id="startDate" value={startDate ? format(startDate, "yyyy-MM-dd") : ""} 
                onChange={(e) => {
                  setSearchMode('anniversary');
                  const newDate = e.target.value ? new Date(e.target.value) : null;
                  // Handle timezone offset for date picker
                  if (newDate) newDate.setMinutes(newDate.getMinutes() + newDate.getTimezoneOffset());
                  setStartDate(newDate);
                  setEndDate(null);
                }}
                style={{
                  backgroundColor: "#0f172a", border: "1px solid #475569", color: "white", borderRadius: 6,
                  width: "100%", padding: isMobile ? "6px 12px" : "8px 12px", fontSize: isMobile ? 14 : 16,
                  appearance: "none", WebkitAppearance: "none", MozAppearance: "textfield", WebkitTextFillColor: "white",
                }}
              />
              <style>{`
                input[type="date"], #startDate { color: #fff; -webkit-text-fill-color: #fff; }
                input[type="date"]::-webkit-datetime-edit, input[type="date"]::-webkit-datetime-edit-field,
                input[type="date"]::-webkit-datetime-edit-month-field, input[type="date"]::-webkit-datetime-edit-day-field,
                input[type="date"]::-webkit-datetime-edit-year-field { color: #fff; -webkit-text-fill-color: #fff; }
                input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1) grayscale(100%) brightness(150%); cursor: pointer; opacity: 0.95; }
                input[type="date"]::-moz-focus-inner { color: #fff; }
              `}</style>
            </div>
          </div>

          {(startDate || endDate) && (
            <button onClick={handleResetDates} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-md text-slate-300">
              <X size={16} /> Reset
            </button>
          )}
        </div>
        <div className="w-full mt-4">
          <p className="text-xs text-slate-500">
            <strong>Tip:</strong> Use the date picker to find events on that day/month across all years.
          </p>
        </div>
      </div>

      {/* The rest of the component JSX is unchanged... */}
      {loading && ( <div className="flex flex-col items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-white" /><span className="mt-3 text-white">Loading events...</span></div> )}
      {error && ( <div className="bg-red-900/50 border border-red-700 text-red-300 rounded-lg p-4"><p className="font-semibold text-white">Error loading events</p><pre className="text-xs mt-2 text-white">{error}</pre></div> )}
      {!loading && !error && !hasResults && ( <div className="text-center py-16"><p className="text-slate-400 text-lg text-white">No events found for the selected criteria.</p></div> )}

      {!loading && !error && hasResults && (
        <>
          {groupBy !== "none" ? (
            isMobile ? (
              <div className="space-y-4">
                {pagedDates.map((dateKey) => {
                  const eventsForDate = (groupedEvents as GroupedEvents)[dateKey] || [];
                  const open = openDateKey === dateKey;
                  return (
                    <div key={dateKey} className="bg-slate-800/40 border border-slate-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleDateAccordion(dateKey)}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left", padding: "12px 16px" }}
                      >
                        <div>
                          <h2 className="text-lg font-semibold text-white">{formatDateForDisplay(dateKey)}</h2>
                          <p className="text-xs text-slate-400">{eventsForDate.length} event(s)</p>
                        </div>
                        <div className="text-slate-300 text-xl">{open ? "▾" : "›"}</div>
                      </button>
                      {open && <div className="p-4 space-y-4 border-t border-slate-700">{eventsForDate.map((ev: Event) => <EventCard key={ev.EventID} event={ev} isMobile onShowDetails={onShowDetails} />)}</div>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-8">
                {pagedDates.map((dateKey) => (
                  <div key={dateKey} className="relative pl-8">
                    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-700" />
                    <div className="absolute left-0 top-1.5 w-6 h-6 bg-slate-700 rounded-full border-4 border-slate-900 flex items-center justify-center"><div className="w-2 h-2 bg-blue-500 rounded-full" /></div>
                    <h2 className="text-xl font-semibold text-white mb-4 -mt-1">{formatDateForDisplay(dateKey)}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {((groupedEvents as GroupedEvents)[dateKey] || []).map((ev) => <EventCard key={ev.EventID} event={ev} onShowDetails={onShowDetails} />)}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className={isMobile ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"}>
              {pagedEvents.map((ev) => <EventCard key={ev.EventID} event={ev} isMobile={isMobile} onShowDetails={onShowDetails} />)}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-md bg-slate-700 text-white disabled:opacity-50 hover:bg-slate-600 transition-colors">Previous</button>
              <span className="text-slate-400 font-medium">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-md bg-slate-700 text-white disabled:opacity-50 hover:bg-slate-600 transition-colors">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const EventCard: React.FC<{ event: Event; isMobile?: boolean; onShowDetails: (event: Event) => void; }> = ({ event, isMobile = false, onShowDetails }) => {
  const from = event.FromDate || event.newEventFrom || "";
  const to = event.ToDate || event.newEventTo || "";
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 shadow-lg hover:border-blue-500 transition-all relative">
      <button
        onClick={() => onShowDetails(event)}
        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white transition-colors"
        title="Show details"
      >
        <Eye size={18} />
      </button>

      <h3 className="font-bold text-base text-white truncate pr-8" title={event.EventName}>{event.EventName || "Untitled"}</h3>
      <p className="text-xs text-slate-500 mb-2">{event.EventCode || ""}</p>
      <div className="text-sm text-slate-300 space-y-1 mt-3">
        <p><span className="font-semibold text-slate-400">Category:</span> {event.fkEventCategory || "N/A"}</p>
        <p><span className="font-semibold text-slate-400">From:</span> {event.FromDate || "N/A"}</p>
        <p><span className="font-semibold text-slate-400">To:</span> {event.ToDate || "N/A"}</p>
      </div>
    </div>
  );
};

const formatDisplaySafe = (val: string | number | undefined) => {
  if (!val && val !== 0) return "—";
  const pd = parseFlexibleDate(val as any);
  if (!pd) return String(val);
  try {
    return format(pd, "MMMM d, yyyy");
  } catch {
    return String(val);
  }
};