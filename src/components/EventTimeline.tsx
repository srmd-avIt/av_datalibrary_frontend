"use client";

import React, { useEffect, useMemo, useState } from "react";
import * as Select from "@radix-ui/react-select";
import { Loader2, X, ChevronDown, ChevronUp, Check, Eye, Calendar, Layers, ChevronLeft } from "lucide-react";
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

    // Priority 1: Handle dd-mm-yyyy, dd/mm/yyyy, or dd.mm.yyyy format.
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
  NewEventFrom?: string; 
  NewEventTo?: string;   
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
  const [groupBy, setGroupBy] = useState<"NewEventFrom" | "NewEventTo" | "none">("none");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  const [openDateKey, setOpenDateKey] = useState<string | null>(null);

  // --- NEW: State for Mobile Details Overlay ---
  const [mobileSelectedEvent, setMobileSelectedEvent] = useState<Event | null>(null);

  const [searchMode, setSearchMode] = useState<'anniversary' | 'specific'>('anniversary');

  useEffect(() => {
    const onResize = () => {
      const mobileState = window.innerWidth <= 768;
      setIsMobile(mobileState);
      if (mobileState) {
        document.body.style.backgroundColor = "#0b1120"; // Native app dark theme
      } else {
        document.body.style.backgroundColor = "";
      }
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      document.body.style.backgroundColor = "";
    };
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

        const token = localStorage.getItem('app-token');
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          }
        });

        if (res.status === 401 || res.status === 403) {
          console.error("Timeline: Unauthorized access. Redirecting...");
          localStorage.removeItem('app-token');
          localStorage.removeItem('google-token');
          window.location.href = '/'; 
          return;
        }

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
    setSearchMode('anniversary'); 
  };

  // --- Handlers for Show Details ---
  const handleShowDetails = (event: Event) => {
    if (isMobile) {
      setMobileSelectedEvent(event);
    } else {
      onShowDetails(event);
    }
  };

  const effectivePageSize = isMobile ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE;

  const { pagedDates, groupedEvents, pagedEvents, totalPages, totalEvents } = useMemo(() => {
    if (!allEvents.length) return { pagedDates: [], groupedEvents: {}, pagedEvents: [], totalPages: 0, totalEvents: 0 };

    const filtered = allEvents.filter((ev) => {
      const evStart = parseFlexibleDate(ev.NewEventFrom);
      
      if (!startDate) return true;
      if (!evStart) return false;

      if (searchMode === 'anniversary') {
        return evStart.getMonth() === startDate.getMonth() && evStart.getDate() === startDate.getDate();
      }

      const evEnd = parseFlexibleDate(ev.NewEventTo); 
      const effectiveEvEnd = evEnd || evStart; 

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
  }, [allEvents, groupBy, page, startDate, endDate, effectivePageSize, searchMode]); 

  const formatDateForDisplay = (d: string | number | Date) => {
    const pd = typeof d === "string" || typeof d === "number" ? parseFlexibleDate(d) : d instanceof Date ? d : null;
    if (!pd) return "Invalid Date";
    try {
      return format(pd, "dd-MM-yyyy"); 
    } catch {
      return pd.toDateString();
    }
  };

  const hasResults = groupBy === "none" ? pagedEvents.length > 0 : pagedDates.length > 0;
  const toggleDateAccordion = (dateKey: string) => setOpenDateKey((p) => (p === dateKey ? null : dateKey));
  const groupByOptions = { none: "No Group", NewEventFrom: "From Date" };

  // ==========================================
  // 📱 MOBILE DETAILS OVERLAY
  // ==========================================
  const renderMobileDetailsView = () => {
    if (!mobileSelectedEvent) return null;

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
            onClick={() => setMobileSelectedEvent(null)}
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
            {mobileSelectedEvent.EventName || mobileSelectedEvent.EventCode || "Event Details"}
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
          {Object.entries(mobileSelectedEvent).map(([key, value]) => {
            // Ignore completely empty/useless fields
            if (value === null || value === undefined || value === "") return null;

            // Beautifully format fields that look like dates
            let displayValue = String(value);
            if (key.toLowerCase().includes("date") || key.toLowerCase().includes("from") || key.toLowerCase().includes("to")) {
              const pd = parseFlexibleDate(value as any);
              if (pd) displayValue = format(pd, "dd-MM-yyyy");
            }

            return (
              <div
                key={key}
                style={{
                  backgroundColor: "#1e293b",
                  padding: "14px",
                  borderRadius: "10px",
                  border: "1px solid #334155",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              >
                <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, fontWeight: 500 }}>
                  {key}
                </div>
                <div style={{ fontSize: 15, color: "#f8fafc", wordBreak: "break-word" }}>
                  {displayValue}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };


  // ==========================================
  // 📱 MOBILE VIEW
  // ==========================================
  const renderMobileView = () => (
    <>
      {renderMobileDetailsView()}
      
      <div style={{ display: mobileSelectedEvent ? "none" : "flex", flexDirection: "column", minHeight: "100dvh", backgroundColor: "#0b1120", color: "white" }}>
        
        {/* Sticky Header */}
        <div style={{ padding: "24px 16px 16px", backgroundColor: "rgba(15,23,42,0.8)", borderBottom: "1px solid rgba(30,41,59,0.8)", position: "sticky", top: 0, zIndex: 20, backdropFilter: "blur(12px)" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "white" }}>{title}</h1>
          <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
            {totalEvents > 0 ? `${totalEvents} events found` : "No events"}
          </p>
        </div>

        {/* Filters Section */}
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          
          {/* Group By Filter */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '0 12px', border: '1px solid #334155' }}>
            <Layers size={16} color="#cbd5e1" style={{ marginRight: 8 }} />
            <select 
              value={groupBy} 
              onChange={(e) => setGroupBy(e.target.value as any)} 
              style={{ background: 'transparent', color: '#cbd5e1', border: 'none', outline: 'none', fontSize: '14px', fontWeight: 500, padding: '12px 0', width: '100%' }}
            >
              {Object.entries(groupByOptions).map(([val, label]) => (
                <option key={val} value={val} style={{ background: '#0f172a' }}>Group: {label}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '0 12px', border: '1px solid #334155', position: 'relative' }}>
            <Calendar size={16} color="#cbd5e1" style={{ marginRight: 8 }} />
            <span style={{ position: 'absolute', left: '36px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#cbd5e1', pointerEvents: 'none', fontWeight: 500, display: startDate ? 'none' : 'block' }}>
              Select Date...
            </span>
            <input 
              type="date" 
              value={startDate ? format(startDate, "yyyy-MM-dd") : ""} 
              onChange={(e) => {
                setSearchMode('anniversary');
                const newDate = e.target.value ? new Date(e.target.value) : null;
                if (newDate) newDate.setMinutes(newDate.getMinutes() + newDate.getTimezoneOffset());
                setStartDate(newDate);
                setEndDate(null);
              }}
              style={{ 
                background: 'transparent', color: startDate ? '#fff' : 'transparent', border: 'none', outline: 'none', fontSize: '14px', padding: '12px 0', width: '100%', WebkitAppearance: 'none'
              }}
            />
            <style>{`input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.8) grayscale(1) brightness(1.2); }`}</style>
          </div>
        </div>

        {/* Active Filter Pill */}
        {startDate && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(30,41,59,0.6)', border: '1px solid #334155', borderRadius: '8px', padding: '10px 16px', margin: '0 16px 16px 16px' }}>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              Showing: <span style={{ fontWeight: 600, color: 'white' }}>{formatDateForDisplay(startDate)}</span>
            </p>
            <button onClick={handleResetDates} style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', color: '#f87171', fontSize: '13px', fontWeight: 500, padding: 0 }}>
              <X size={14} style={{ marginRight: 4 }} /> Clear
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div style={{ padding: "0 16px 80px 16px", flex: 1, overflowY: "auto" }}>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px" }}>
              <Loader2 style={{ width: 32, height: 32, color: "#3b82f6", animation: "spin 1s linear infinite" }} />
              <span style={{ marginTop: 12, color: "#94a3b8", fontSize: 14 }}>Loading events...</span>
            </div>
          )}

          {error && (
            <div style={{ backgroundColor: "rgba(127,29,29,0.2)", border: "1px solid #991b1b", borderRadius: "8px", padding: "16px" }}>
              <p style={{ fontWeight: 600, color: "#fca5a5", margin: 0 }}>Error loading events</p>
              <p style={{ fontSize: "12px", color: "#fecaca", marginTop: "8px", margin: 0 }}>{error}</p>
            </div>
          )}

          {!loading && !error && !hasResults && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p style={{ color: "#64748b", fontSize: "15px" }}>No events found for the selected criteria.</p>
            </div>
          )}

          {!loading && !error && hasResults && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {groupBy !== "none" ? (
                pagedDates.map((dateKey) => {
                  const eventsForDate = (groupedEvents as GroupedEvents)[dateKey] || [];
                  const open = openDateKey === dateKey;
                  return (
                    <div key={dateKey} style={{ backgroundColor: "rgba(30,41,59,0.4)", border: "1px solid #334155", borderRadius: "10px", overflow: "hidden" }}>
                      <button
                        onClick={() => toggleDateAccordion(dateKey)}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "transparent", border: "none", textAlign: "left", color: "white" }}
                      >
                        <div>
                          <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>{formatDateForDisplay(dateKey)}</h2>
                          <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, marginTop: "2px" }}>{eventsForDate.length} event(s)</p>
                        </div>
                        {open ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
                      </button>
                      {open && (
                        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #334155", display: "flex", flexDirection: "column", gap: "12px", paddingTop: "16px" }}>
                          {eventsForDate.map((ev: Event) => <EventCard key={ev.EventID} event={ev} isMobile onShowDetails={handleShowDetails} />)}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                pagedEvents.map((ev) => <EventCard key={ev.EventID} event={ev} isMobile onShowDetails={handleShowDetails} />)
              )}
            </div>
          )}
        </div>

        {/* Sticky Bottom Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div style={{ position: "fixed", bottom: 0, left: 0, width: "100%", padding: "12px 16px", backgroundColor: "rgba(15,23,42,0.95)", backdropFilter: "blur(10px)", borderTop: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 30 }}>
            <button 
              onClick={() => setPage((p) => Math.max(1, p - 1))} 
              disabled={page === 1} 
              style={{ padding: "8px 16px", borderRadius: "8px", backgroundColor: "#1e293b", color: page === 1 ? "#64748b" : "white", border: "1px solid #334155", fontWeight: 500, fontSize: "13px" }}
            >
              Prev
            </button>
            <span style={{ fontSize: "13px", color: "#cbd5e1", fontWeight: 500 }}>
              Page <strong style={{ color: "white" }}>{page}</strong> of {totalPages}
            </span>
            <button 
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages} 
              style={{ padding: "8px 16px", borderRadius: "8px", backgroundColor: "#1e293b", color: page === totalPages ? "#64748b" : "white", border: "1px solid #334155", fontWeight: 500, fontSize: "13px" }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );

  // ==========================================
  // 💻 DESKTOP VIEW
  // ==========================================
  const renderDesktopView = () => (
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
        <div className="flex flex-col items-center justify-center h-64 bg-black/25 backdrop-blur-md rounded-xl">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="mt-3 text-white font-medium">Loading events...</span>
        </div>
      )}

      {error && ( <div className="bg-red-900/50 border border-red-700 text-red-300 rounded-lg p-4"><p className="font-semibold text-white">Error loading events</p><pre className="text-xs mt-2 text-white">{error}</pre></div> )}
      {!loading && !error && !hasResults && ( <div className="text-center py-16"><p className="text-slate-400 text-lg text-white">No events found for the selected criteria.</p></div> )}

      {!loading && !error && hasResults && (
        <>
          {groupBy !== "none" ? (
            <div className="space-y-8">
              {pagedDates.map((dateKey) => (
                <div key={dateKey} className="relative pl-8">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-700" />
                  <div className="absolute left-0 top-1.5 w-6 h-6 bg-slate-700 rounded-full border-4 border-slate-900 flex items-center justify-center"><div className="w-2 h-2 bg-blue-500 rounded-full" /></div>
                  <h2 className="text-xl font-semibold text-white mb-4 -mt-1">{formatDateForDisplay(dateKey)}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {((groupedEvents as GroupedEvents)[dateKey] || []).map((ev) => <EventCard key={ev.EventID} event={ev} onShowDetails={handleShowDetails} />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pagedEvents.map((ev) => <EventCard key={ev.EventID} event={ev} isMobile={isMobile} onShowDetails={handleShowDetails} />)}
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

  return isMobile ? renderMobileView() : renderDesktopView();
};

const formatDateForCard = (d: string | number | undefined) => {
  if (!d) return "N/A";
  const pd = parseFlexibleDate(d);
  if (!pd) return String(d);
  try {
    return format(pd, "dd-MM-yyyy"); 
  } catch {
    return String(d);
  }
};

const EventCard: React.FC<{ event: Event; isMobile?: boolean; onShowDetails: (event: Event) => void; }> = ({ event, isMobile = false, onShowDetails }) => {
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
        <p><span className="font-semibold text-slate-400 w-16 inline-block">From:</span> {formatDateForCard(event.NewEventFrom)}</p>
        <p><span className="font-semibold text-slate-400 w-16 inline-block">To:</span> {formatDateForCard(event.NewEventTo)}</p>
      </div>
    </div>
  );
};

const formatDisplaySafe = (val: string | number | undefined) => {
  if (!val && val !== 0) return "—";
  const pd = parseFlexibleDate(val as any);
  if (!pd) return String(val);
  try {
    return format(pd, "dd-MM-yyyy"); 
  } catch {
    return String(val);
  }
};