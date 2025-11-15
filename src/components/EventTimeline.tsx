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

// --- Fix for instanceof error in parseFlexibleDate ---
const parseFlexibleDate = (dateInput: string | number | null | undefined): Date | null => {
  if (!dateInput && dateInput !== 0) return null;

  // Handle Excel serial numbers first
  if (typeof dateInput === "number" || /^\d{5}$/.test(String(dateInput))) {
    const excelEpoch = new Date((Number(dateInput) - 25569) * 86400 * 1000);
    if (!isNaN(excelEpoch.getTime())) return excelEpoch;
  }

  if (typeof dateInput === 'string') {
    const trimmedInput = dateInput.trim();

    // Priority 1: Handle dd/mm/yyyy format. This is the specified format for the data.
    const dmyParts = trimmedInput.match(/^(\d{1,2})[./-]+(\d{1,2})[./-]+(\d{2,4})$/);
    if (dmyParts) {
      const day = parseInt(dmyParts[1], 10);
      const month = parseInt(dmyParts[2], 10) - 1;
      let year = parseInt(dmyParts[3], 10);
      if (year < 100) year += 2000;

      if (month >= 0 && month < 12 && day > 0 && day <= 31) {
        const d = new Date(year, month, day);
        if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
          return d;
        }
      }
    }

    // Priority 2: Handle ISO 8601 format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmedInput)) {
      const d = new Date(trimmedInput);
      if (!isNaN(d.getTime())) {
        return d;
      }
    }

    return null;
  }

  // --- FIX: Use Object.prototype.toString instead of instanceof ---
  if (
    typeof dateInput === "object" &&
    dateInput !== null &&
    Object.prototype.toString.call(dateInput) === "[object Date]" &&
    !isNaN((dateInput as Date).getTime())
  ) {
    return dateInput as Date;
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

  const effectivePageSize = isMobile ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE;

  const { pagedDates, groupedEvents, pagedEvents, totalPages, totalEvents } = useMemo(() => {
    if (!allEvents.length) return { pagedDates: [], groupedEvents: {}, pagedEvents: [], totalPages: 0, totalEvents: 0 };

    const filtered = allEvents.filter((ev) => {
      const evStart = parseFlexibleDate(ev.FromDate);
      
      // If no date filter is applied, show all events
      if (!startDate) {
        return true;
      }

      // If an event doesn't have a valid start date, it can't be filtered by date.
      if (!evStart) {
        return false;
      }

      // Anniversary search: checks for matching month and day, ignoring the year.
      // This is triggered by the date picker.
      if (searchMode === 'anniversary') {
        return evStart.getMonth() === startDate.getMonth() && evStart.getDate() === startDate.getDate();
      }

      // Specific date search: checks if the selected date falls within the event's range.
      // This is triggered by the 'Previous', 'Today', 'Next' buttons.
      const evEnd = parseFlexibleDate(ev.ToDate);
      const effectiveEvEnd = evEnd || evStart; // Treat events without an end date as single-day events.

      // Normalize all dates to midnight to ensure time of day doesn't affect the comparison.
      const filterDate = new Date(startDate);
      filterDate.setHours(0, 0, 0, 0);

      const eventStartDate = new Date(evStart);
      eventStartDate.setHours(0, 0, 0, 0);

      const eventEndDate = new Date(effectiveEvEnd);
      eventEndDate.setHours(0, 0, 0, 0);

      return eventStartDate <= filterDate && filterDate <= eventEndDate;
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

  const formatDateForDisplay = (d: string | number | Date) => {
    const pd = typeof d === "string" || typeof d === "number" ? parseFlexibleDate(d) : d instanceof Date ? d : null;
    if (!pd) return "Invalid Date";
    try {
      return format(pd, "dd/MM/yyyy");
    } catch {
      return pd.toDateString();
    }
  };

  const hasResults = groupBy === "none" ? pagedEvents.length > 0 : pagedDates.length > 0;
  const toggleDateAccordion = (dateKey: string) => setOpenDateKey((p) => (p === dateKey ? null : dateKey));
  const groupByOptions = { none: "No Group", FromDate: "From Date" };

  return (
    <div className="p-4 md:p-6 text-slate-200 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            <div className="text-slate-400 font-medium mt-1">
                {totalEvents > 0 ? `${totalEvents} events found` : "No events"}
            </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 md:gap-3">
          {/* Group By */}
          <div className="flex items-center gap-2">
            <label htmlFor="groupBySelect" className="text-xs font-medium text-slate-400">Group:</label>
            <Select.Root value={groupBy} onValueChange={(value) => setGroupBy(value as any)}>
               <Select.Trigger
                id="groupBySelect"
                className="flex items-center justify-between gap-2 bg-slate-800 border border-slate-700 rounded-md text-white w-full min-w-[180px] px-3 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Select.Value placeholder="Select grouping..." />
                <Select.Icon className="text-slate-400"><ChevronDown size={16} /></Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content
                  position="popper" sideOffset={5}
                  className="z-50 border border-slate-700 rounded-md shadow-lg p-1 w-[var(--radix-select-trigger-width)]"
                  style={{ backgroundColor: '#0f172a' }}
                >
                  <Select.ScrollUpButton className="flex items-center justify-center p-1 cursor-default" >
                    <ChevronUp size={16} />
                  </Select.ScrollUpButton>
                  <Select.Viewport>
                    {Object.entries(groupByOptions).map(([value, label]) => (
                      <Select.Item
                        key={value} value={value}
                        className="text-sm rounded-[3px] pl-3 pr-8 py-1.5 text-white relative select-none cursor-pointer hover:bg-blue-600 focus:bg-blue-600 focus:outline-none"
                      >
                        <Select.ItemText>{label}</Select.ItemText>
                        <Select.ItemIndicator className="absolute right-2 top-1/2 -translate-y-1/2"><Check size={16} /></Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                  <Select.ScrollDownButton className="flex items-center justify-center p-1 cursor-default">
                    <ChevronDown size={16} />
                  </Select.ScrollDownButton>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <label htmlFor="startDate" className="text-xs font-medium text-slate-400">Date:</label>
            <div className="relative">
              <input type="date" id="startDate" value={startDate ? format(startDate, "yyyy-MM-dd") : ""} 
                onChange={(e) => {
                  setSearchMode('anniversary');
                  const newDate = e.target.value ? new Date(e.target.value) : null;
                  if (newDate) newDate.setMinutes(newDate.getMinutes() + newDate.getTimezoneOffset());
                  setStartDate(newDate);
                  setEndDate(null);
                }}
                className="bg-slate-800 border border-slate-700 text-white rounded-md w-full px-2.5 py-1.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <style>{`
                input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.8) grayscale(1) brightness(1.2); cursor: pointer; }
              `}</style>
            </div>
          </div>
        </div>
      </div>

      {startDate && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-800/50 border border-slate-700 rounded-lg p-3 mb-6 gap-2">
            <p className="text-sm text-slate-300">
                Showing events for: <span className="font-semibold text-white">{formatDateForDisplay(startDate)}</span>
            </p>
            <button onClick={handleResetDates} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded-md text-slate-300 transition-colors self-start sm:self-center">
                <X size={14} /> Clear Filter
            </button>
        </div>
      )}

    {loading && (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "256px", // h-64
      animation: "fadeIn 0.4s ease",
      backdropFilter: "blur(6px)",
      background: "rgba(0,0,0,0.25)",
      borderRadius: "12px",
    }}
  >
    {/* SPINNER */}
    <Loader2
      style={{
        width: "32px",
        height: "32px",
        color: "white",
        animation: "spin 1s linear infinite, glowPulse 1.5s ease-in-out infinite",
        filter: "drop-shadow(0 0 6px rgba(59,130,246,0.7))",
      }}
    />

    {/* TEXT */}
    <span
      style={{
        marginTop: "12px",
        color: "white",
        fontSize: "15px",
        fontWeight: 500,
        animation: "pulseText 1.8s ease-in-out infinite",
      }}
    >
      Loading events...
    </span>

    {/* BONUS: Inject keyframe animations */}
    <style>
      {`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes glowPulse {
          0% { filter: drop-shadow(0 0 2px rgba(59,130,246,0.4)); }
          50% { filter: drop-shadow(0 0 10px rgba(59,130,246,0.9)); }
          100% { filter: drop-shadow(0 0 2px rgba(59,130,246,0.4)); }
        }

        @keyframes pulseText {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}
    </style>
  </div>
)}

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
                        className="w-full flex items-center justify-between text-left p-4"
                      >
                        <div>
                          <h2 className="text-lg font-semibold text-white">{formatDateForDisplay(dateKey)}</h2>
                          <p className="text-xs text-slate-400">{eventsForDate.length} event(s)</p>
                        </div>
                        <ChevronDown size={20} className={`text-slate-300 transition-transform ${open ? 'rotate-180' : ''}`} />
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

const formatDateForCard = (d: string | number | undefined) => {
  if (!d) return "N/A";
  const pd = parseFlexibleDate(d);
  if (!pd) return String(d);
  try {
    return format(pd, "dd/MM/yyyy");
  } catch {
    return String(d);
  }
};

const EventCard: React.FC<{ event: Event; isMobile?: boolean; onShowDetails: (event: Event) => void; }> = ({ event, isMobile = false, onShowDetails }) => {
  const from = event.FromDate || event.newEventFrom || "";
  const to = event.ToDate || event.newEventTo || "";

  const categoryColors: Record<string, string> = {
    "Pravachan": "bg-sky-900/50 border-sky-500/50 hover:border-sky-400/80",
    "Shibir": "bg-emerald-900/50 border-emerald-500/50 hover:border-emerald-400/80",
    "Swadhyay": "bg-purple-900/50 border-purple-500/50 hover:border-purple-400/80",
    "Other": "bg-amber-900/50 border-amber-500/50 hover:border-amber-400/80",
    "Default": "bg-slate-800/50 border-slate-700/60 hover:border-slate-500/80",
  };

  const category = event.fkEventCategory || "Default";
  const colorClass = categoryColors[category] || categoryColors["Default"];

  return (
    <div className={`backdrop-blur-lg rounded-lg p-4 shadow-lg hover:shadow-2xl transition-all relative ${colorClass} ring-1 ring-white/10`}>
      <button
        onClick={() => onShowDetails(event)}
        className="absolute top-3 right-3 p-1 text-slate-400 hover:text-white transition-colors"
        title="Show details"
      >
        <Eye size={18} />
      </button>

      <h3 className="font-bold text-base text-white truncate pr-8" title={event.EventName}>{event.EventName || "Untitled"}</h3>
      <p className="text-sm text-slate-400 mb-3">{event.EventCode || ""}</p>
      
      <div className="text-sm text-slate-300 space-y-1.5 mt-3 border-t border-white/10 pt-3">
        <p><span className="font-semibold text-slate-400 w-16 inline-block">Category:</span> {event.fkEventCategory || "N/A"}</p>
        <p><span className="font-semibold text-slate-400 w-16 inline-block">From:</span> {formatDateForCard(event.FromDate)}</p>
        <p><span className="font-semibold text-slate-400 w-16 inline-block">To:</span> {formatDateForCard(event.ToDate)}</p>
      </div>
    </div>
  );
};

const formatDisplaySafe = (val: string | number | undefined) => {
  if (!val && val !== 0) return "—";
  const pd = parseFlexibleDate(val as any);
  if (!pd) return String(val);
  try {
    return format(pd, "dd/MM/yyyy");
  } catch {
    return String(val);
  }
};