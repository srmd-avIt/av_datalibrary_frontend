import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  ArrowLeft, ListTree, FileText, X, Loader2, RefreshCw, ChevronRight,
  Plus, Search, ChevronLeft, ChevronDown, Pencil, Check, Filter,
  SlidersHorizontal, CheckSquare, Square, Calendar, Mail, Layers, Lock
} from "lucide-react";
import { ClickUpListViewUpdated } from "./ClickUpListViewUpdated";
import { getColorForString } from "./ui/utils";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL as string;

// ─── Tag renderer ─────────────────────────────────────────────────────────────
const categoryTagRenderer = (value: string | null | undefined) => {
  if (!value) return <span className="text-slate-500"></span>;
  const getTextColorForBg = (hex: string): string => {
    return "#ffffff";
  };
  const values = value.split(",").map((v) => v.trim()).filter(Boolean);
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {values.map((val, index) => {
        const bgColor = getColorForString(val);
        return (
          <div
            key={index}
            className="inline-block whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold border backdrop-blur-sm"
            style={{
              backgroundColor: `${bgColor}55`,
              borderColor: `${bgColor}66`,
              color: getTextColorForBg(bgColor),
            }}
          >
            {val}
          </div>
        );
      })}
    </div>
  );
};


// ─── ML Updations count renderer ──────────────────────────────────────────────

// ─── Count badge renderer ──────────────────────────────────────────────────────
const auxCountRenderer = (value: number | null | undefined) => {
  const count = Number(value) || 0;
  const hasRecords = count > 0;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "0.75rem",
        fontWeight: 600,
        background: hasRecords ? "rgba(99,102,241,0.18)" : "rgba(100,116,139,0.12)",
        border: `1px solid ${hasRecords ? "rgba(99,102,241,0.4)" : "rgba(100,116,139,0.25)"}`,
        color: hasRecords ? "#a5b4fc" : "#64748b",
        whiteSpace: "nowrap",
        cursor: hasRecords ? "pointer" : "default",
      }}
    >
      AuxFiles ({count})
    </span>
  );
};


const mlUpdationsCountRenderer = (value: number | null | undefined) => {
  const count = Number(value) || 0;
  const hasRecords = count > 0;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "0.75rem",
        fontWeight: 600,
        background: hasRecords ? "rgba(245,158,11,0.18)" : "rgba(100,116,139,0.12)",
        border: `1px solid ${hasRecords ? "rgba(245,158,11,0.4)" : "rgba(100,116,139,0.25)"}`,
        color: hasRecords ? "#fcd34d" : "#64748b",
        whiteSpace: "nowrap",
        cursor: hasRecords ? "pointer" : "default",
      }}
    >
      Related ML Updations ({count})
    </span>
  );
};
// ─── Satsang Category columns ─────────────────────────────────────────────────
const SATSANG_CATEGORY_COLUMNS = [
  { key: "MLUniqueID",        label: "ML Unique ID",             sortable: true, editable: false },
  { key: "Yr",                label: "Year",                     sortable: true, editable: false },
  {
    key: "EventName - EventCode",
    label: "Event Name - Code",
    sortable: true,
    editable: false,
    render: (_v: any, row: any) => {
      const en = row.EventName || "";
      const ec = row.EventCode || row.fkEventCode || "";
      return `${en}${en && ec ? " - " : ""}${ec}`;
    },
  },
  {
    key: "DetailSub",
    label: "Detail - Sub Detail",
    sortable: true,
    editable: false,
    render: (v: any, row: any) => {
      if (v) return v;
      const d = row.Detail || "";
      const s = row.SubDetail || "";
      return `${d}${d && s ? " - " : ""}${s}`;
    },
  },
  { key: "Topic",            label: "Topic",                    sortable: true, editable: false, render: categoryTagRenderer },
  { key: "SubDuration",      label: "Sub Duration",             sortable: true, editable: false },
  { key: "Segment Category", label: "Segment Category",         sortable: true, editable: false, render: categoryTagRenderer },
  { key: "FootageType",      label: "Footage Type",             sortable: true, editable: false, render: categoryTagRenderer },
  { key: "Synopsis",         label: "Synopsis",                 sortable: true, editable: false },
  { key: "EditingStatus",    label: "Editing Status",           sortable: true, editable: false, render: categoryTagRenderer },
  { key: "Language",         label: "Language",                 sortable: true, editable: false, render: categoryTagRenderer },
  { key: "Remarks",          label: "Remarks",                  sortable: true, editable: false },
  { key: "SatsangStart",     label: "Satsang Start",            sortable: true, editable: false },
  { key: "SatsangEnd",       label: "Satsang End",              sortable: true, editable: false },
  { key: "Masterquality",    label: "Master Quality - DR Table",sortable: true, editable: false, render: categoryTagRenderer },
  { key: "ContentFrom",      label: "Content From",             sortable: true, editable: false },
  { key: "fkCity",           label: "City",                     sortable: true, editable: false, render: categoryTagRenderer },
  { key: "Number",           label: "Number",                   sortable: true, editable: false, render: categoryTagRenderer },
  { key: "fkOccasion",       label: "Occasion",                 sortable: true, editable: false, render: categoryTagRenderer },
  { key: "Keywords",         label: "Keywords",                 sortable: true, editable: false, render: categoryTagRenderer },
  { key: "Guidance",         label: "Guidance",                 sortable: true, editable: false },
  { key: "fkGranth",         label: "Granth",                   sortable: true, editable: false, render: categoryTagRenderer },
  // These are the two columns seen in your screenshot:
  {
    key: "relatedAuxFilesCount",
    label: "Related AuxFiles",
    sortable: true,
    editable: false,
    render: auxCountRenderer,
  },
  {
    key: "relatedMLUpdationsCount", // This key should match what your API returns
    label: "Related ML Updations",
    sortable: true,
    editable: false,
    render: mlUpdationsCountRenderer,
  },
];

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type TabView = "satsang_category" | "aux_ml_status";

const TABS: { id: TabView; label: string; icon: React.ReactNode }[] = [
  { id: "satsang_category", label: "Satsang Category",       icon: <ListTree size={14} /> },
  { id: "aux_ml_status",    label: "AUX ML Updations Status", icon: <FileText size={14} /> },
];

// ─── MM Status options ─────────────────────────────────────────────────────────
const MM_STATUS_OPTIONS = ["Submit to MM", "Confirmed"];

const MM_STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "Submit to MM": { bg: "rgba(251,191,36,0.15)",  border: "rgba(251,191,36,0.4)",  text: "#fbbf24" },
  "Confirmed":    { bg: "rgba(52,211,153,0.15)",  border: "rgba(52,211,153,0.4)",  text: "#34d399" },
};

function MMStatusBadge({ value }: { value: string }) {
  const colors = MM_STATUS_COLORS[value] || { bg: "rgba(100,116,139,0.15)", border: "rgba(100,116,139,0.3)", text: "#94a3b8" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: "12px",
      fontSize: "0.72rem", fontWeight: 600, whiteSpace: "nowrap",
      background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text,
    }}>
      {value || "—"}
    </span>
  );
}

// ─── Searchable ML ID dropdown with infinite scroll ───────────────────────────
interface MLIDDropdownProps {
  value: string;
  token?: string;
  onChange: (val: string) => void;
  locked?: boolean;
}

function MLIDDropdown({ value, token, onChange, locked = false }: MLIDDropdownProps) {
  const [open, setOpen]               = useState(false);
  const [search, setSearch]           = useState("");
  const [options, setOptions]         = useState<string[]>([]);
  const [loading, setLoading]         = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(false);
  const containerRef  = React.useRef<HTMLDivElement>(null);
  const listRef       = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const searchRef     = React.useRef("");
  const searchTimer   = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPage = useCallback(async (q: string, pg: number, replace: boolean) => {
    if (pg === 1) setLoading(true); else setLoadingMore(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const params = new URLSearchParams({ page: String(pg), limit: "50", ...(q ? { search: q } : {}) });
      const res = await fetch(`${API_BASE}/newmedialog/mlids?${params}`, { headers });
      const json = await res.json();
      const incoming: string[] = json.data || [];
      setOptions(prev => replace ? incoming : [...prev, ...incoming]);
      setHasMore(json.hasMore || false);
      setPage(pg);
    } catch { /* silent */ }
    finally { setLoading(false); setLoadingMore(false); }
  }, [token]);

  useEffect(() => {
    if (open) {
      setSearch("");
      searchRef.current = "";
      fetchPage("", 1, true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setOptions([]);
      setPage(1);
      setHasMore(false);
    }
  }, [open, fetchPage]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleListScroll = () => {
    const el = listRef.current;
    if (!el || loadingMore || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      fetchPage(searchRef.current, page + 1, false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setSearch(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      searchRef.current = v;
      setOptions([]);
      setPage(1);
      fetchPage(v, 1, true);
    }, 250);
  };

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "9px 12px",
          background: locked ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${locked ? "rgba(52,211,153,0.25)" : open ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: open && !locked ? "8px 8px 0 0" : "8px",
          cursor: locked ? "default" : "pointer",
          userSelect: "none", transition: "border-color 0.15s",
        }}
      >
        <span
          onClick={() => { if (!locked) setOpen(o => !o); }}
          style={{ flex: 1, fontSize: "0.85rem", color: value ? (locked ? "#6ee7b7" : "#e2e8f0") : "#475569" }}
        >
          {value || "Select MLUniqueID…"}
        </span>
        {value && !locked && (
          <button
            type="button"
            onMouseDown={e => { e.stopPropagation(); onChange(""); setOpen(false); }}
            style={{ background: "none", border: "none", padding: "0 4px", cursor: "pointer", display: "flex", alignItems: "center", color: "#475569", flexShrink: 0 }}
          >
            <X size={13} />
          </button>
        )}
        {!locked && (
          <div onClick={() => setOpen(o => !o)} style={{ display: "flex", paddingLeft: "4px" }}>
            <ChevronDown
              size={14}
              style={{ color: "#64748b", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </div>
        )}
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
          background: "#1e293b",
          border: "1px solid rgba(99,102,241,0.4)", borderTop: "none",
          borderRadius: "0 0 8px 8px",
          boxShadow: "0 12px 32px rgba(0,0,0,0.7)",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.07)", position: "relative" }}>
            <Search size={12} style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "#475569", pointerEvents: "none" }} />
            <input
              ref={searchInputRef}
              value={search}
              onChange={handleSearchChange}
              placeholder="Search MLUniqueID…"
              autoComplete="off"
              style={{ width: "100%", paddingLeft: "28px", paddingRight: "8px", paddingTop: "7px", paddingBottom: "7px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#e2e8f0", fontSize: "0.8rem", outline: "none", boxSizing: "border-box" }}
            />
            {loading && (
              <Loader2 size={11} style={{ position: "absolute", right: "18px", top: "50%", transform: "translateY(-50%)", color: "#475569", animation: "spin 1s linear infinite" }} />
            )}
          </div>

          <div ref={listRef} onScroll={handleListScroll}
            style={{ maxHeight: "200px", overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "#334155 transparent" }}>
            {loading && options.length === 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px", color: "#475569", fontSize: "0.78rem" }}>
                <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Loading…
              </div>
            )}
            {!loading && options.length === 0 && (
              <div style={{ padding: "12px", fontSize: "0.78rem", color: "#475569" }}>No results</div>
            )}
            {options.map((id) => (
              <button key={id} type="button" onMouseDown={() => handleSelect(id)}
                style={{ display: "block", width: "100%", padding: "8px 14px", background: value === id ? "rgba(99,102,241,0.2)" : "none", border: "none", color: value === id ? "#a5b4fc" : "#e2e8f0", fontSize: "0.82rem", cursor: "pointer", textAlign: "left", fontWeight: value === id ? 600 : 400 }}
              >
                {id}
              </button>
            ))}
            {loadingMore && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", color: "#475569", fontSize: "0.75rem" }}>
                <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> Loading more…
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add Record Modal ──────────────────────────────────────────────────────────
interface AddAuxMLModalProps {
  token?: string;
  onClose: () => void;
  onSuccess: () => void;
  initialRelatedML?: string;
}

function formatTimestamp(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function AddAuxMLModal({ token, onClose, onSuccess, initialRelatedML }: AddAuxMLModalProps) {
  const [form, setForm]     = useState({ "MM Status": "", "Related ML": initialRelatedML || "", "Remarks": "" });
  const [timestamp, setTimestamp] = useState(() => formatTimestamp(new Date()));
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => {
    const id = setInterval(() => setTimestamp(formatTimestamp(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form["MM Status"]) { setError("Please select an MM Status."); return; }
    setSaving(true);
    setError("");
    const payload = { ...form, "Status Changed Timestamp": timestamp };
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/google-sheet/aux-ml-status`, {
        method: "POST", headers, body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to save."); }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "28px", width: "min(440px, 92vw)", boxShadow: "0 24px 64px rgba(0,0,0,0.7)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "22px" }}>
          <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Plus size={15} color="white" />
          </div>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#f1f5f9" }}>Add AUX ML Status Record</h3>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "4px", display: "flex" }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
              Related ML
            </label>
            <MLIDDropdown
              value={form["Related ML"]}
              token={token}
              locked={!!initialRelatedML}
              onChange={(val) => setForm(f => ({ ...f, "Related ML": val }))}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
              MM Status <span style={{ color: "#f87171", fontWeight: 500 }}>*</span>
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {MM_STATUS_OPTIONS.map((opt) => {
                const colors = MM_STATUS_COLORS[opt] || { bg: "rgba(100,116,139,0.15)", border: "rgba(100,116,139,0.3)", text: "#94a3b8" };
                const active = form["MM Status"] === opt;
                return (
                  <button key={opt} type="button"
                    onClick={() => setForm(f => ({ ...f, "MM Status": opt }))}
                    style={{ padding: "7px 14px", borderRadius: "8px", border: `1px solid ${active ? colors.border : "rgba(255,255,255,0.08)"}`, background: active ? colors.bg : "rgba(255,255,255,0.03)", color: active ? colors.text : "#64748b", fontSize: "0.8rem", fontWeight: active ? 700 : 500, cursor: "pointer", transition: "all 0.15s" }}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Remarks</label>
            <textarea
              value={form["Remarks"]} onChange={e => setForm(f => ({ ...f, "Remarks": e.target.value }))}
              placeholder="Optional remarks…" rows={3}
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "9px 12px", color: "#e2e8f0", fontSize: "0.85rem", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
              Status Changed Timestamp
            </label>
            <div style={{
              padding: "9px 12px", background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px",
              fontSize: "0.85rem", color: "#64748b", fontVariantNumeric: "tabular-nums",
            }}>
              {timestamp}
            </div>
          </div>

          {error && <p style={{ margin: 0, fontSize: "0.78rem", color: "#f87171" }}>{error}</p>}

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "4px" }}>
            <button type="button" onClick={onClose} style={{ padding: "8px 18px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", fontSize: "0.83rem", cursor: "pointer", fontWeight: 600 }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding: "8px 20px", borderRadius: "8px", background: "linear-gradient(135deg,#6366f1,#a855f7)", border: "none", color: "white", fontSize: "0.83rem", cursor: saving ? "not-allowed" : "pointer", fontWeight: 600, opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: "6px" }}>
              {saving && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
              {saving ? "Saving…" : "Add Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add AuxFile Modal ────────────────────────────────────────────────────────
function AddAuxFileModal({ token, onClose, onSuccess, initialMLID, existingAuxFile }: { 
  token?: string; 
  onClose: () => void; 
  onSuccess: () => void; 
  initialMLID: string;
  existingAuxFile?: AuxFile;
}) {
  const { user } = useAuth(); // Access current user context
  const isLocked = !!existingAuxFile;

  // Auto-fill logic based on screenshot
  const generateAutoValues = () => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const generatedID = `${initialMLID}_SRT_English_${dateStr}`;
    const fullTimestamp = now.toString();
    const userEmail = user?.email || "";

    return { generatedID, fullTimestamp, userEmail };
  };

  const defaults = generateAutoValues();

  const [form, setForm] = useState({
    AUXID: existingAuxFile?.AUXID || defaults.generatedID,
    new_auxid: existingAuxFile?.new_auxid || defaults.generatedID,
    fkMLID: initialMLID,
    SRTLink: existingAuxFile?.SRTLink || "",
    AuxFileType: existingAuxFile?.AuxFileType || "SRT",
    CreatedOn: existingAuxFile?.CreatedOn || defaults.fullTimestamp,
    CreatedBy: existingAuxFile?.CreatedBy || defaults.userEmail,
    ModifiedOn: existingAuxFile?.ModifiedOn || defaults.fullTimestamp,
    ModifiedBy: existingAuxFile?.ModifiedBy || defaults.userEmail
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.new_auxid) { setError("new_auxid is required."); return; }
    if (!form.SRTLink) { setError("SRTLink is required."); return; }
    
    setSaving(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const res = await fetch(`${API_BASE}/srt-submission/related-auxfiles`, {
        method: "POST", headers, body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to save AuxFile"); }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "24px", width: "min(500px, 92vw)", maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={14} color="white" />
            </div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#f1f5f9" }}>
              {isLocked ? "AuxFile Details" : "Add AuxFile"}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
           <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>fkMLID *</label>
            <input disabled value={form.fkMLID} style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", padding: "9px 12px", borderRadius: "8px", color: "#f1f5f9", fontWeight: 600, fontSize: "0.85rem", boxSizing: "border-box" }} />
          </div>

          {[
            { label: "AUXID", key: "AUXID", required: true },
            { label: "new_auxid", key: "new_auxid", required: true },
            { label: "SRTLink", key: "SRTLink", placeholder: "URL to SRT file", required: true },
            { label: "CreatedOn", key: "CreatedOn", disabled: true },
            { label: "CreatedBy", key: "CreatedBy", disabled: true },
            { label: "ModifiedOn", key: "ModifiedOn", disabled: true },
            { label: "ModifiedBy", key: "ModifiedBy", disabled: true },
          ].map(f => {
            const isDisabled = isLocked || f.disabled;
            return (
              <div key={f.key}>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                  {f.label} {f.required && !isLocked && <span style={{ color: "#f87171" }}>*</span>}
                </label>
                <input 
                  disabled={isDisabled}
                  value={(form as any)[f.key]} 
                  onChange={e => setForm({...form, [f.key]: e.target.value})}
                  placeholder={f.placeholder || ""}
                  style={{ width: "100%", background: isDisabled ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "9px 12px", borderRadius: "8px", color: isDisabled ? "#f1f5f9" : "#e2e8f0", fontWeight: isDisabled ? 600 : 400, fontSize: "0.85rem", outline: "none", boxSizing: "border-box", opacity: 1, WebkitTextFillColor: isDisabled ? "#f1f5f9" : "unset" }} 
                />
              </div>
            );
          })}

          {error && <p style={{ color: "#f87171", fontSize: "0.8rem", margin: 0 }}>{error}</p>}

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
            <button type="button" onClick={onClose} style={{ padding: "9px 20px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
              Close
            </button>
            {!isLocked && (
              <button type="submit" disabled={saving} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 24px", borderRadius: "8px", background: "linear-gradient(135deg,#6366f1,#a855f7)", border: "none", color: "white", fontSize: "0.85rem", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                {saving ? "Saving..." : "Save"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Filter Panel Drawer ──────────────────────────────────────────────────────
interface AuxMLFilters {
  relatedML: string[];
  mmStatus: string[];
  remarks: string;
  timestampStart: string;
  timestampEnd: string;
}

function AuxMLFilterSidebar({ 
  isOpen, 
  onClose, 
  filters, 
  setFilters,
  onClear,
  uniqueRelatedMLs,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  filters: AuxMLFilters; 
  setFilters: React.Dispatch<React.SetStateAction<AuxMLFilters>>;
  onClear: () => void;
  uniqueRelatedMLs: string[];
}) {
  if (!isOpen) return null;

  const [mlSearch, setMlSearch] = useState("");
  const [expanded, setExpanded] = useState({
    relatedML: false,
    mmStatus: false,
    remarks: false,
    timestamp: false
  });

  const toggleExpand = (key: keyof typeof expanded) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const toggleStatus = (s: string) => {
    setFilters(prev => ({
      ...prev,
      mmStatus: prev.mmStatus.includes(s) 
        ? prev.mmStatus.filter(x => x !== s) 
        : [...prev.mmStatus, s]
    }));
  };

  const toggleRelatedML = (ml: string) => {
    setFilters(prev => ({
      ...prev,
      relatedML: prev.relatedML.includes(ml)
        ? prev.relatedML.filter(id => id !== ml)
        : [...prev.relatedML, ml]
    }));
  };

  const filteredMLs = useMemo(() => {
    if (!mlSearch) return uniqueRelatedMLs;
    return uniqueRelatedMLs.filter(ml => ml.toLowerCase().includes(mlSearch.toLowerCase()));
  }, [uniqueRelatedMLs, mlSearch]);

  return (
    <div style={{ 
      position: "fixed", top: 0, right: 0, bottom: 0, width: "320px", 
      background: "#0f172a", borderLeft: "1px solid rgba(255,255,255,0.1)",
      zIndex: 1100, display: "flex", flexDirection: "column",
      boxShadow: "-10px 0 30px rgba(0,0,0,0.5)",
      animation: "slideInRight 0.25s ease-out" 
    }}>
      <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex" }}>
            <ArrowLeft size={18} />
          </button>
          <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "#f1f5f9" }}>Filter</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }} className="detail-scroll">
        {/* Related ML */}
        <div style={{ marginBottom: "28px" }}>
          <div onClick={() => toggleExpand('relatedML')} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", cursor: "pointer" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#f1f5f9" }}>Related ML</span>
            {expanded.relatedML ? <ChevronDown size={14} color="#64748b" /> : <ChevronRight size={14} color="#64748b" />}
          </div>
          {expanded.relatedML && (
            <>
              <input 
                type="text" 
                value={mlSearch}
                onChange={(e) => setMlSearch(e.target.value)}
                placeholder="Search ML IDs..."
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 12px", color: "#e2e8f0", fontSize: "0.85rem", outline: "none", borderRadius: "6px", marginBottom: "8px" }}
              />
              <div style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", padding: "4px" }}>
                {filteredMLs.map(ml => {
                  const isChecked = filters.relatedML.includes(ml);
                  return (
                    <div key={ml} onClick={() => toggleRelatedML(ml)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px", cursor: "pointer", borderRadius: "4px" }}>
                      {isChecked ? <CheckSquare size={18} color="#6366f1" /> : <Square size={18} color="#475569" />}
                      <span style={{ fontSize: "0.85rem", color: isChecked ? "#e2e8f0" : "#94a3b8" }}>{ml}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* MM Status */}
        <div style={{ marginBottom: "28px" }}>
           <div onClick={() => toggleExpand('mmStatus')} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", cursor: "pointer" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#f1f5f9" }}>MM Status</span>
            {expanded.mmStatus ? <ChevronDown size={14} color="#64748b" /> : <ChevronRight size={14} color="#64748b" />}
          </div>
          {expanded.mmStatus && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {["Submit to MM", "Confirmed", "Blank"].map(s => {
                const actualValue = s === "Blank" ? "" : s;
                const isChecked = filters.mmStatus.includes(actualValue);
                return (
                  <div key={s} onClick={() => toggleStatus(actualValue)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", cursor: "pointer" }}>
                    {isChecked ? <CheckSquare size={18} color="#6366f1" /> : <Square size={18} color="#475569" />}
                    <span style={{ fontSize: "0.85rem", color: isChecked ? "#e2e8f0" : "#94a3b8" }}>{s}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Remarks */}
        <div style={{ marginBottom: "28px" }}>
          <div onClick={() => toggleExpand('remarks')} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", cursor: "pointer" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#f1f5f9" }}>Remarks</span>
            {expanded.remarks ? <ChevronDown size={14} color="#64748b" /> : <ChevronRight size={14} color="#64748b" />}
          </div>
          {expanded.remarks && (
            <input 
              type="text" 
              value={filters.remarks || ""}
              onChange={e => setFilters(f => ({ ...f, remarks: e.target.value }))}
              placeholder="Filter by remarks..."
              style={{ width: "100%", background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "8px 0", color: "#e2e8f0", fontSize: "0.85rem", outline: "none" }}
            />
          )}
        </div>

        {/* Timestamp - RANGE PICKER */}
        <div style={{ marginBottom: "28px" }}>
          <div onClick={() => toggleExpand('timestamp')} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", cursor: "pointer" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#f1f5f9" }}>Status Changed Timestamp</span>
            {expanded.timestamp ? <ChevronDown size={14} color="#64748b" /> : <ChevronRight size={14} color="#64748b" />}
          </div>
          {expanded.timestamp && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Start date</span>
                <input 
                  type="date" 
                  value={filters.timestampStart || ""}
                  onChange={e => setFilters(f => ({ ...f, timestampStart: e.target.value }))}
                  style={{ 
                    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", 
                    padding: "10px 12px", color: "#e2e8f0", fontSize: "0.85rem", 
                    outline: "none", borderRadius: "8px", boxSizing: "border-box" 
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>End date</span>
                <input 
                  type="date" 
                  value={filters.timestampEnd || ""}
                  onChange={e => setFilters(f => ({ ...f, timestampEnd: e.target.value }))}
                  style={{ 
                    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", 
                    padding: "10px 12px", color: "#e2e8f0", fontSize: "0.85rem", 
                    outline: "none", borderRadius: "8px", boxSizing: "border-box" 
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "12px" }}>
        <button onClick={onClear} style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "transparent", border: "1px solid #334155", color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>Clear</button>
        <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "linear-gradient(135deg,#6366f1,#a855f7)", border: "none", color: "white", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>Done</button>
      </div>
    </div>
  );
}

// ─── AUX ML Updations Status view ─────────────────────────────────────────────
interface AuxMLRow {
  "MM Status": string;
  "Related ML": string;
  "Remarks": string;
  "Status Changed Timestamp": string;
  [key: string]: string;
}

interface AuxMLStatusViewProps {
  token?: string;
  canEdit?: boolean;
  canViewSatsang?: boolean;
}

// ─── AUX ML Detail Panel (with inline satsang drill-down) ────────────────────
function AuxMLDetailPanel({ row, onClose, token, onSuccess, canEdit = false, canViewSatsang = false }: {
  row: AuxMLRow;
  onClose: () => void;
  token?: string;
  onSuccess?: () => void;
  canEdit?: boolean;
  canViewSatsang?: boolean;
}) {
  const relatedML = row["Related ML"];
  const [mlRecord, setMlRecord]             = useState<any>(null);
  const [mlLoading, setMlLoading]           = useState(false);
  const [auxFiles, setAuxFiles]             = useState<AuxFile[]>([]);
  const [auxLoading, setAuxLoading]         = useState(false);
  const [mlUpdations, setMlUpdations]       = useState<any[]>([]);
  const [mlUpdLoading, setMlUpdLoading]     = useState(false);
  const [selectedAux, setSelectedAux]       = useState<AuxFile | null>(null);
  const [satsangFromAux, setSatsangFromAux] = useState(false);
  const [editMode, setEditMode]         = useState(false);
  const [remarksEdit, setRemarksEdit]   = useState("");
  const [mmStatusEdit, setMmStatusEdit] = useState("");
  const [editSaving, setEditSaving]     = useState(false);
  const [editError, setEditError]       = useState("");

  const openSatsangDetail = async () => {
    if (!relatedML) return;
    setMlLoading(true);
    setMlRecord(null);
    setAuxFiles([]);
    setSelectedAux(null);
    setSatsangFromAux(false);
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const params = new URLSearchParams({ MLUniqueID: relatedML, limit: "1" });
      const res = await fetch(`${API_BASE}/newmedialog?${params}`, { headers });
      const json = await res.json();
      const record = (json?.data ?? json)?.[0] ?? null;
      setMlRecord(record || null);
      if (record?.MLUniqueID) {
        setAuxLoading(true);
        setMlUpdLoading(true);
        const [auxRes, mlUpdRes] = await Promise.all([
          fetch(`${API_BASE}/srt-submission/related-auxfiles/${encodeURIComponent(record.MLUniqueID)}`, { headers }),
          fetch(`${API_BASE}/google-sheet/aux-ml-status/by-mlid/${encodeURIComponent(record.MLUniqueID)}`, { headers }),
        ]);
        const auxData = await auxRes.json();
        const mlUpdData = await mlUpdRes.json();
        setAuxFiles(auxData?.data || []);
        setMlUpdations(mlUpdData?.data || []);
        setAuxLoading(false);
        setMlUpdLoading(false);
      }
    } catch (err) {
      console.error("Failed to fetch ML record:", err);
    } finally {
      setMlLoading(false);
    }
  };

  const goBack = () => {
    if (editMode) { setEditMode(false); setEditError(""); return; }
    if (satsangFromAux)  { setSatsangFromAux(false); return; }
    if (selectedAux)     { setSelectedAux(null); return; }
    if (mlRecord)        { setMlRecord(null); setAuxFiles([]); setMlUpdations([]); return; }
    onClose();
  };

 const startEdit = () => {
  setRemarksEdit(row["Remarks"] || "");
  // Initialize with the current status so it's not automatically blank
  setMmStatusEdit(row["MM Status"] || ""); 
  setEditMode(true);
  setEditError("");
};

  const cancelEdit = () => {
    setEditMode(false);
    setEditError("");
  };

const handleSaveEdit = async () => {
  setEditSaving(true);
  setEditError("");

  const payload = {
    ...row,
    "Remarks": remarksEdit,
    // This will now send whatever is selected in the UI (Status or Blank)
    "MM Status": mmStatusEdit, 
    "Status Changed Timestamp": formatTimestamp(new Date()),
  };

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/google-sheet/aux-ml-status`, {
      method: "PATCH", headers, body: JSON.stringify(payload),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to save."); }
    setEditMode(false);
    onSuccess?.();
    onClose();
  } catch (err: any) {
    setEditError(err.message || "An error occurred.");
  } finally {
    setEditSaving(false);
  }
};

  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(420px, 95vw)", background: "#0f172a", borderLeft: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", zIndex: 1050, boxShadow: "-8px 0 32px rgba(0,0,0,0.6)", animation: "slideInRight 0.2s ease-out" }}>
      <div style={{ flexShrink: 0, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: "10px", background: "rgba(15,23,42,0.98)" }}>
        {mlRecord && selectedAux && satsangFromAux ? (
          <>
            <button onClick={goBack} style={{ background: "none", border: "none", color: "#6366f1", padding: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", fontWeight: 600 }}>
              <ArrowLeft size={13} /> Back
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mlRecord.MLUniqueID || relatedML}</p>
              <p style={{ margin: "1px 0 0", fontSize: "0.7rem", color: "#64748b" }}>Satsang Details</p>
            </div>
          </>
        ) : mlRecord && selectedAux ? (
          <>
            <button onClick={goBack} style={{ background: "none", border: "none", color: "#6366f1", padding: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", fontWeight: 600 }}>
              <ArrowLeft size={13} /> Back
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedAux.new_auxid || selectedAux.AUXID || "AuxFile"}</p>
              <p style={{ margin: "1px 0 0", fontSize: "0.7rem", color: "#64748b" }}>AuxFile Details</p>
            </div>
          </>
        ) : mlRecord ? (
          <>
            <button onClick={goBack} style={{ background: "none", border: "none", color: "#6366f1", padding: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", fontWeight: 600 }}>
              <ArrowLeft size={13} /> Back
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mlRecord.MLUniqueID || relatedML}</p>
              <p style={{ margin: "1px 0 0", fontSize: "0.7rem", color: "#64748b" }}>Satsang Details</p>
            </div>
          </>
        ) : (
          <>
            <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FileText size={13} color="white" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#f1f5f9" }}>
                {editMode ? (row["MM Status"] ? "Edit Remarks" : "Resubmit Record") : "Record Details"}
              </p>
              <p style={{ margin: "1px 0 0", fontSize: "0.7rem", color: "#64748b" }}>AUX ML Updations Status</p>
            </div>
            {canEdit && !editMode && row["MM Status"] === "Confirmed" ? (
              <span style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "7px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399", fontSize: "0.72rem", fontWeight: 600, flexShrink: 0 }}>
                <Lock size={11} /> Locked
              </span>
            ) : canEdit && !editMode ? (
              <button onClick={startEdit} title={row["MM Status"] ? "Edit remarks" : "Resubmit"} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "7px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                <Pencil size={11} /> {row["MM Status"] ? "Edit" : "Resubmit"}
              </button>
            ) : null}
          </>
        )}
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", padding: "4px", cursor: "pointer", display: "flex" }}>
          <X size={15} />
        </button>
      </div>

      <div style={{ flex: 1, overflow: "auto", scrollbarWidth: "thin", scrollbarColor: "#1e293b transparent" }}>
        {mlLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "24px 16px", color: "#475569", fontSize: "0.82rem" }}>
            <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Loading satsang details…
          </div>
        )}

        {!mlLoading && mlRecord && selectedAux && satsangFromAux && (
          <>
            {DETAIL_FIELDS.map(({ label, get }) => {
              const val = get(mlRecord);
              const display = val && String(val).trim() ? String(val) : null;
              return (
                <div key={label} style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: "0.67rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                  <span style={{ fontSize: "0.82rem", color: display ? "#e2e8f0" : "#334155", lineHeight: 1.5, wordBreak: "break-word" }}>{display || "—"}</span>
                </div>
              );
            })}
          </>
        )}

        {!mlLoading && mlRecord && !selectedAux && (
          <>
            {DETAIL_FIELDS.map(({ label, get }) => {
              const val = get(mlRecord);
              const display = val && String(val).trim() ? String(val) : null;
              return (
                <div key={label} style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: "0.67rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                  <span style={{ fontSize: "0.82rem", color: display ? "#e2e8f0" : "#334155", lineHeight: 1.5, wordBreak: "break-word" }}>{display || "—"}</span>
                </div>
              );
            })}
            <div style={{ padding: "14px 16px 6px" }}>
              <p style={{ margin: "0 0 10px", fontSize: "0.67rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
                Related AuxFiles ({auxLoading ? "…" : auxFiles.length})
              </p>
              {auxLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#475569", padding: "8px 0", fontSize: "0.8rem" }}>
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Loading…
                </div>
              ) : auxFiles.length === 0 ? (
                <p style={{ margin: "0 0 16px", fontSize: "0.78rem", color: "#334155", fontStyle: "italic" }}>No AuxFiles linked.</p>
              ) : (
                <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid rgba(99,102,241,0.2)", marginBottom: "16px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem" }}>
                    <thead>
                      <tr style={{ background: "rgba(99,102,241,0.14)", borderBottom: "1px solid rgba(99,102,241,0.2)" }}>
                        {["new_auxid", "AUXID", "fkMLID", "CreatedOn", "CreatedBy"].map(h => (
                          <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: "#818cf8", fontWeight: 700, whiteSpace: "nowrap", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {auxFiles.map((f, i) => (
                        <tr key={i} onClick={() => setSelectedAux(f)}
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)", cursor: "pointer" }}>
                          <td style={{ padding: "7px 10px", color: "#e2e8f0", whiteSpace: "nowrap" }}>{f.new_auxid || "—"}</td>
                          <td style={{ padding: "7px 10px", color: "#e2e8f0", whiteSpace: "nowrap" }}>{f.AUXID || "—"}</td>
                          <td style={{ padding: "7px 10px", color: "#cbd5e1", whiteSpace: "nowrap" }}>{f.fkMLID || "—"}</td>
                          <td style={{ padding: "7px 10px", color: "#94a3b8", whiteSpace: "nowrap" }}>{f.CreatedOn || "—"}</td>
                          <td style={{ padding: "7px 10px", color: "#94a3b8", whiteSpace: "nowrap" }}>{f.CreatedBy || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div style={{ padding: "14px 16px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ margin: "0 0 10px", fontSize: "0.67rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
                Related ML Updations ({mlUpdLoading ? "…" : mlUpdations.length})
              </p>
              {mlUpdLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#475569", padding: "8px 0", fontSize: "0.8rem" }}>
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Loading…
                </div>
              ) : mlUpdations.length === 0 ? (
                <p style={{ margin: 0, fontSize: "0.78rem", color: "#334155", fontStyle: "italic" }}>No ML Updations linked.</p>
              ) : (
                <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem" }}>
                    <thead>
                      <tr style={{ background: "rgba(245,158,11,0.1)", borderBottom: "1px solid rgba(245,158,11,0.2)" }}>
                        {["MM Status", "Related ML", "Remarks", "Status Changed Timestamp"].map(h => (
                          <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: "#fbbf24", fontWeight: 700, whiteSpace: "nowrap", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mlUpdations.map((u, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                          <td style={{ padding: "7px 10px", whiteSpace: "nowrap" }}>
                            {u["MM Status"] ? <MMStatusBadge value={u["MM Status"]} /> : <span style={{ color: "#334155" }}>—</span>}
                          </td>
                          <td style={{ padding: "7px 10px", color: "#a5b4fc", fontWeight: 600, whiteSpace: "nowrap" }}>{u["Related ML"] || "—"}</td>
                          <td style={{ padding: "7px 10px", color: "#cbd5e1", maxWidth: "140px" }}>
                            <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={u["Remarks"] || ""}>{u["Remarks"] || "—"}</span>
                          </td>
                          <td style={{ padding: "7px 10px", color: "#94a3b8", whiteSpace: "nowrap" }}>{u["Status Changed Timestamp"] || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {!mlLoading && mlRecord && selectedAux && !satsangFromAux && (
          <>
            <div onClick={() => setSatsangFromAux(true)} style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }} title="View satsang details">
              <span style={{ fontSize: "0.67rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>fkMLID</span>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.82rem", color: "#a5b4fc", fontWeight: 600, lineHeight: 1.5 }}>{selectedAux.fkMLID || "—"}</span>
                <ChevronRight size={15} style={{ color: "#475569", flexShrink: 0 }} />
              </span>
            </div>
            {AUX_DETAIL_FIELDS.map(({ label, key }) => {
              const val = selectedAux[key];
              const display = val !== undefined && val !== null && String(val).trim() !== "" ? String(val) : null;
              const isLink = key === "SRTLink";
              return (
                <div key={label} style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: "0.67rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                  {display && isLink ? (
                    <a href={display} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.82rem", color: "#818cf8", textDecoration: "underline", wordBreak: "break-all" }}>{display}</a>
                  ) : (
                    <span style={{ fontSize: "0.82rem", color: display ? "#e2e8f0" : "#334155", lineHeight: 1.5, wordBreak: "break-word" }}>{display || "—"}</span>
                  )}
                </div>
              );
            })}
          </>
        )}

        {!mlLoading && !mlRecord && !editMode && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "0.67rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>MM Status</span>
              {row["MM Status"] ? <MMStatusBadge value={row["MM Status"]} /> : <span style={{ fontSize: "0.85rem", color: "#334155" }}>—</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "0.67rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Related ML</span>
              {relatedML ? (
                canViewSatsang ? (
                  <button type="button" onClick={openSatsangDetail}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "8px", padding: "6px 12px", color: "#a5b4fc", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", width: "fit-content" }}>
                    <ChevronRight size={13} />{relatedML}
                  </button>
                ) : (
                  <span style={{ fontSize: "0.85rem", color: "#a5b4fc", fontWeight: 600 }}>{relatedML}</span>
                )
              ) : (
                <span style={{ fontSize: "0.85rem", color: "#334155" }}>—</span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "0.67rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Remarks</span>
              <span style={{ fontSize: "0.85rem", color: row["Remarks"] ? "#e2e8f0" : "#334155", lineHeight: 1.6, wordBreak: "break-word" }}>{row["Remarks"] || "—"}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "0.67rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status Changed Timestamp</span>
              <span style={{ fontSize: "0.85rem", color: row["Status Changed Timestamp"] ? "#64748b" : "#334155" }}>{row["Status Changed Timestamp"] || "—"}</span>
            </div>
          </>
        )}

      {!mlLoading && !mlRecord && editMode && (
  <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <span style={{ fontSize: "0.67rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Related ML</span>
      <span style={{ fontSize: "0.85rem", color: relatedML ? "#a5b4fc" : "#334155", fontWeight: relatedML ? 600 : 400 }}>{relatedML || "—"}</span>
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <span style={{ fontSize: "0.67rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        MM Status
      </span>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {MM_STATUS_OPTIONS.map(opt => {
          const colors = MM_STATUS_COLORS[opt] || { bg: "rgba(100,116,139,0.15)", border: "rgba(100,116,139,0.3)", text: "#94a3b8" };
          const active = mmStatusEdit === opt;
          return (
            <button key={opt} type="button" onClick={() => setMmStatusEdit(opt)}
              style={{ padding: "7px 14px", borderRadius: "8px", border: `1px solid ${active ? colors.border : "rgba(255,255,255,0.08)"}`, background: active ? colors.bg : "rgba(255,255,255,0.03)", color: active ? colors.text : "#64748b", fontSize: "0.8rem", fontWeight: active ? 700 : 500, cursor: "pointer", transition: "all 0.15s" }}>
              {opt}
            </button>
          );
        })}
        
        {/* BLANK LOGIC BUTTON: Allows user to clear the status while keeping remarks */}
        <button 
          type="button" 
          onClick={() => setMmStatusEdit("")}
          style={{ 
            padding: "7px 14px", borderRadius: "8px", 
            border: `1px solid ${mmStatusEdit === "" ? "rgba(248,113,113,0.4)" : "rgba(255,255,255,0.08)"}`, 
            background: mmStatusEdit === "" ? "rgba(248,113,113,0.1)" : "rgba(255,255,255,0.03)", 
            color: mmStatusEdit === "" ? "#f87171" : "#64748b", 
            fontSize: "0.8rem", cursor: "pointer" 
          }}
        >
          None (Clear)
        </button>
      </div>
      {mmStatusEdit === "" && row["MM Status"] !== "" && (
        <span style={{ fontSize: "0.65rem", color: "#f87171", fontStyle: "italic" }}>Status will be cleared on save</span>
      )}
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "0.67rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Remarks</label>
      <textarea
        value={remarksEdit}
        onChange={e => setRemarksEdit(e.target.value)}
        placeholder="Add remarks…"
        rows={4}
        style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(99,102,241,0.4)", borderRadius: "8px", padding: "9px 12px", color: "#e2e8f0", fontSize: "0.85rem", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
      />
    </div>
    
    {editError && <p style={{ margin: 0, fontSize: "0.78rem", color: "#f87171" }}>{editError}</p>}
    
    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
      <button onClick={cancelEdit} style={{ padding: "8px 16px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", fontSize: "0.82rem", cursor: "pointer", fontWeight: 600 }}>
        Cancel
      </button>
      <button onClick={handleSaveEdit} disabled={editSaving} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 18px", borderRadius: "8px", background: "linear-gradient(135deg,#6366f1,#a855f7)", border: "none", color: "white", fontSize: "0.82rem", cursor: editSaving ? "not-allowed" : "pointer", fontWeight: 600, opacity: editSaving ? 0.7 : 1 }}>
        {editSaving && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
        Save Changes
      </button>
    </div>
  </div>
)}
      </div>
    </div>
  );
}

function AuxMLStatusView({ token, canEdit = false, canViewSatsang = false }: AuxMLStatusViewProps) {
  const [rows, setRows]         = useState<AuxMLRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<AuxMLRow | null>(null);
  
  // ── Filter State ────────────────────────────────────────────────────────────
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterValues, setFilterValues] = useState<AuxMLFilters>({
    relatedML: [],
    mmStatus: [],
    remarks: "",
    timestampStart: "",
    timestampEnd: ""
  });
  // ── Group By State ──────────────────────────────────────────────────────────
  const [groupBy, setGroupBy] = useState<string>("MM Status");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const fetchData = useCallback(async (q = "") => {
    setLoading(true);
    setError("");
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const params = new URLSearchParams({ limit: "9999", ...(q ? { search: q } : {}) });
      const res = await fetch(`${API_BASE}/google-sheet/aux-ml-status?${params}`, { headers });
      if (!res.ok) throw new Error("Failed to fetch data.");
      const json = await res.json();
      setRows(json.data || []);
    } catch (err: any) {
      setError(err.message || "Error loading data.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(""); }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(search);
  };

  const handleClearFilters = () => {
    setFilterValues({ relatedML: [], mmStatus: [], remarks: "", timestampStart: "", timestampEnd: "" });
  };

  // ── Apply Client-Side Filters ────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    const parseTimestamp = (ts: string | null): Date | null => {
        if (!ts) return null;
        const parts = ts.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{1,2}):(\d{1,2})\s*(AM|PM)?/i);
        if (parts) {
            let hours = Number(parts[4]);
            if (parts[7]) {
                if (parts[7].toUpperCase() === 'PM' && hours < 12) hours += 12;
                if (parts[7].toUpperCase() === 'AM' && hours === 12) hours = 0;
            }
            const d = new Date(Number(parts[3]), Number(parts[1]) - 1, Number(parts[2]), hours, Number(parts[5]), Number(parts[6]));
            return isNaN(d.getTime()) ? null : d;
        }
        return null;
    };

    const parseISO = (iso: string): Date | null => {
      if (!iso) return null;
      const d = new Date(iso);
      return isNaN(d.getTime()) ? null : d;
    };

    return rows.filter(row => {
      const matchesML = filterValues.relatedML.length === 0 || 
        filterValues.relatedML.includes(row["Related ML"] || "");
      
      const matchesStatus = filterValues.mmStatus.length === 0 || 
        filterValues.mmStatus.includes(row["MM Status"] || "");
      
      const matchesRemarks = !filterValues.remarks || 
        (row["Remarks"] || "").toLowerCase().includes(filterValues.remarks.toLowerCase());
      
      const itemDate = parseTimestamp(row["Status Changed Timestamp"]);
      const startDate = parseISO(filterValues.timestampStart);
      const endDate = parseISO(filterValues.timestampEnd);

      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999);

      let matchesTime = true;
      if (startDate || endDate) {
          if (!itemDate) {
              matchesTime = false;
          } else {
              if (startDate && itemDate < startDate) matchesTime = false;
              if (endDate && itemDate > endDate) matchesTime = false;
          }
      }

      return matchesML && matchesStatus && matchesRemarks && matchesTime;
    });
  }, [rows, filterValues]);

  // Group filtered rows dynamically
  const groupedRows = useMemo(() => {
    if (groupBy === "none") {
      return [{ key: "All", items: filteredRows }];
    }
    
    const groupMap = new Map<string, AuxMLRow[]>();
    filteredRows.forEach(row => {
      let s = row[groupBy] || "";
      if (groupBy === "MM Status" && !s) s = "Blank"; 
      if (!s) s = "Unknown";
      if (!groupMap.has(s)) groupMap.set(s, []);
      groupMap.get(s)!.push(row);
    });

    let keys = Array.from(groupMap.keys());
    if (groupBy === "MM Status") {
      const STATUS_ORDER = ["Submit to MM", "Confirmed", "Blank"];
      keys = [...STATUS_ORDER.filter(s => groupMap.has(s)), ...keys.filter(k => !STATUS_ORDER.includes(k)).sort()];
    } else {
      keys.sort();
    }

    return keys.map(s => ({ key: s, items: groupMap.get(s)! }));
  }, [filteredRows, groupBy]);

  const COL_WIDTHS = { status: 160, relml: 180, remarks: 300, timestamp: 220 };
  const activeFilterCount = (filterValues.relatedML.length > 0 ? 1 : 0) + 
                            (filterValues.mmStatus.length) + 
                            (filterValues.remarks ? 1 : 0) + 
                            (filterValues.timestampStart ? 1 : 0) +
                            (filterValues.timestampEnd ? 1 : 0);

  const uniqueRelatedMLs = useMemo(() => {
    const allMLs = rows.map(r => r["Related ML"]).filter(Boolean);
    return [...new Set(allMLs)].sort();
  }, [rows]);

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .aux-ml-row:hover { background: rgba(99,102,241,0.07) !important; }
        .filter-badge-dot { width: 8px; height: 8px; background: #6366f1; border-radius: 50%; border: 2px solid #020617; position: absolute; top: 4px; right: 4px; }
        input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(0.6);
            cursor: pointer;
        }
      `}</style>

      {/* Toolbar */}
      <div style={{ flexShrink: 0, padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(15,23,42,0.6)" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, maxWidth: "360px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#475569", pointerEvents: "none" }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search AUX ML status…"
              style={{ width: "100%", paddingLeft: "30px", paddingRight: "10px", paddingTop: "7px", paddingBottom: "7px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "8px", color: "#e2e8f0", fontSize: "0.8rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <button type="submit" style={{ padding: "7px 14px", borderRadius: "8px", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.35)", color: "#a5b4fc", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>Search</button>
        </form>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0 8px', border: '1px solid rgba(255,255,255,0.09)' }}>
            <Layers size={13} color="#94a3b8" style={{ marginRight: 6 }} />
            <select 
              value={groupBy} 
              onChange={(e) => setGroupBy(e.target.value)} 
              style={{ background: 'transparent', color: '#e2e8f0', border: 'none', outline: 'none', fontSize: '0.78rem', padding: '7px 0', cursor: 'pointer' }}
            >
              <option value="none" style={{ background: '#0f172a' }}>Group By: None</option>
              <option value="MM Status" style={{ background: '#0f172a' }}>Group By: MM Status</option>
              <option value="Related ML" style={{ background: '#0f172a' }}>Group By: Related ML</option>
              <option value="Status Changed Timestamp" style={{ background: '#0f172a' }}>Group By: Timestamp</option>
            </select>
          </div>

          <button 
            onClick={() => setIsFilterOpen(true)}
            style={{ position: "relative", background: "rgba(255,255,255,0.05)", border: `1px solid ${activeFilterCount > 0 ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.09)"}`, borderRadius: "8px", padding: "7px 10px", color: activeFilterCount > 0 ? "#a5b4fc" : "#64748b", cursor: "pointer", display: "flex", alignItems: "center" }}
            title="Filters"
          >
            <SlidersHorizontal size={13} />
            {activeFilterCount > 0 && <span className="filter-badge-dot" />}
          </button>
          
          <button onClick={() => fetchData(search)} title="Refresh"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "8px", padding: "7px 10px", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <RefreshCw size={13} />
          </button>
          {canEdit && (
            <button onClick={() => setShowModal(true)}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", background: "linear-gradient(135deg,#6366f1,#a855f7)", border: "none", color: "white", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>
              <Plus size={13} /> Add
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: "auto", scrollbarWidth: "thin", scrollbarColor: "#334155 transparent" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "60px", color: "#475569" }}>
            <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: "0.88rem" }}>Loading…</span>
          </div>
        ) : error ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#f87171", fontSize: "0.85rem" }}>{error}</div>
        ) : filteredRows.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#475569", fontSize: "0.88rem" }}>
            {rows.length > 0 ? "No records match your filters." : "No records found."}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: COL_WIDTHS.status }} />
              <col style={{ width: COL_WIDTHS.relml }} />
              <col style={{ width: COL_WIDTHS.remarks }} />
              <col style={{ width: COL_WIDTHS.timestamp }} />
            </colgroup>
            <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
              <tr style={{ background: "rgba(15,23,42,0.97)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {[
                  { label: "MM Status",               w: COL_WIDTHS.status },
                  { label: "Related ML",               w: COL_WIDTHS.relml },
                  { label: "Remarks",                  w: COL_WIDTHS.remarks },
                  { label: "Status Changed Timestamp", w: COL_WIDTHS.timestamp },
                ].map(col => (
                  <th key={col.label} style={{ padding: "10px 14px", textAlign: "left", fontSize: "0.69rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedRows.map(group => {
                const isStatus = groupBy === "MM Status";
                const isSubmitToMM = isStatus && group.key === "Submit to MM";
                const isConfirmed = isStatus && group.key === "Confirmed";
                
                const isExpanded = expandedGroups.has(group.key);

                const sectionStyle =
                  isSubmitToMM ? { bg: "rgba(251,191,36,0.07)",  border: "rgba(251,191,36,0.25)",  badge: { bg: "rgba(251,191,36,0.18)", border: "rgba(251,191,36,0.45)", text: "#fbbf24" } } :
                  isConfirmed  ? { bg: "rgba(52,211,153,0.07)",  border: "rgba(52,211,153,0.25)",  badge: { bg: "rgba(52,211,153,0.18)", border: "rgba(52,211,153,0.45)", text: "#34d399" } } :
                                 { bg: "rgba(100,116,139,0.07)", border: "rgba(100,116,139,0.2)", badge: { bg: "rgba(100,116,139,0.18)", border: "rgba(100,116,139,0.35)", text: "#94a3b8" } };
                return (
                <React.Fragment key={group.key}>
                  {groupBy !== "none" && (
                  <tr onClick={() => toggleGroup(group.key)} style={{ cursor: "pointer" }}>
                    <td colSpan={4} style={{ padding: "8px 14px", background: sectionStyle.bg, borderTop: `1px solid ${sectionStyle.border}`, borderBottom: `1px solid ${sectionStyle.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {isExpanded ? <ChevronDown size={14} color={sectionStyle.badge.text} /> : <ChevronRight size={14} color={sectionStyle.badge.text} />}
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "3px 12px 3px 8px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700, background: sectionStyle.badge.bg, border: `1px solid ${sectionStyle.badge.border}`, color: sectionStyle.badge.text }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: sectionStyle.badge.text, flexShrink: 0 }} />
                          {group.key}
                          <span style={{ marginLeft: "2px", opacity: 0.7, fontWeight: 500 }}>({group.items.length})</span>
                        </span>
                      </div>
                    </td>
                  </tr>
                  )}
                  {(isExpanded || groupBy === "none") && group.items.map((row, i) => {
                    const isSelected = selectedRow === row;
                    return (
                      <tr key={i} className="aux-ml-row"
                        onClick={() => setSelectedRow(isSelected ? null : row)}
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: isSelected ? "rgba(99,102,241,0.12)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.012)", cursor: "pointer" }}>
                        <td style={{ padding: "10px 14px" }}>
                          <MMStatusBadge value={row["MM Status"]} />
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: "0.82rem", color: row["Related ML"] ? "#a5b4fc" : "#334155", fontWeight: row["Related ML"] ? 600 : 400 }}>
                          {row["Related ML"] || "—"}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.5, wordBreak: "break-word" }}>
                          {row["Remarks"] || "—"}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: "0.78rem", color: "#64748b", whiteSpace: "nowrap" }}>
                          {row["Status Changed Timestamp"] || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <AuxMLFilterSidebar 
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filterValues}
        setFilters={setFilterValues}
        onClear={handleClearFilters}
        uniqueRelatedMLs={uniqueRelatedMLs}
      />

      {showModal && (
        <AddAuxMLModal
          token={token}
          onClose={() => setShowModal(false)}
          onSuccess={() => fetchData("")}
        />
      )}

      {selectedRow && (
        <>
          <div onClick={() => setSelectedRow(null)} style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.35)" }} />
          <AuxMLDetailPanel
            row={selectedRow}
            onClose={() => setSelectedRow(null)}
            token={token}
            canEdit={canEdit}
            canViewSatsang={canViewSatsang}
            onSuccess={() => { setSelectedRow(null); fetchData(search); }}
          />
        </>
      )}
    </>
  );
}

// ─── AuxFiles detail panel ────────────────────────────────────────────────────
interface AuxFile {
  SRTLink?: string;
  AUXID?: string;
  new_auxid?: string;
  fkMLID?: string;
  AuxCode?: string;
  AuxFileType?: string;
  
  NotesRemarks?: string;
  GoogleDriveLink?: string;
  ProjFileName?: string;
  CreatedBy?: string;
  CreatedOn?: string;
  ModifiedBy?: string;
  ModifiedOn?: string;
}

interface DetailPanelProps {
  row: any;
  auxFiles: AuxFile[];
  loading: boolean;
  onClose: () => void;
  onRefresh: () => void;
  token?: string;
  canViewAuxML?: boolean;
  canEditSatsang?: boolean;
  canEditAuxML?: boolean;
}

const DETAIL_FIELDS: { label: string; get: (r: any) => string }[] = [
  { label: "ML Unique ID",            get: (r) => r.MLUniqueID },
  { label: "Footage Sr No",           get: (r) => r.FootageSrNo },
  { label: "Log Serial No",           get: (r) => r.LogSerialNo },
  { label: "DR Code",                 get: (r) => r.fkDigitalRecordingCode },
  { label: "Content From",            get: (r) => r.ContentFrom },
  { label: "Content To",              get: (r) => r.ContentTo },
  { label: "Editing Status",          get: (r) => r.EditingStatus },
  { label: "Footage Type",            get: (r) => r.FootageType },
  { label: "Video Distribution",      get: (r) => r.VideoDistribution },
  { label: "Detail",                  get: (r) => r.Detail },
  { label: "Counter From",            get: (r) => r.CounterFrom },
  { label: "Counter To",              get: (r) => r.CounterTo },
  { label: "Sub Duration",            get: (r) => r.SubDuration },
  { label: "Total Duration",          get: (r) => r.TotalDuration },
  { label: "Language",                get: (r) => r.Language },
  { label: "Speaker / Singer",        get: (r) => r.SpeakerSinger },
  { label: "Country",                 get: (r) => r.fkCountry },
  { label: "State",                   get: (r) => r.fkState },
  { label: "City",                    get: (r) => r.fkCity },
  { label: "Granth",                  get: (r) => r.fkGranth },
  { label: "Topic",                   get: (r) => r.Topic },
  { label: "Satsang Start",           get: (r) => r.SatsangStart },
  { label: "Satsang End",             get: (r) => r.SatsangEnd },
  { label: "Audio MP3 Distribution",  get: (r) => r.AudioMP3Distribution },
  { label: "Audio WAV Distribution",  get: (r) => r.AudioWAVDistribution },
  { label: "Segment Category",        get: (r) => r["Segment Category"] || r.SegmentCategory },
  { label: "Event Code",              get: (r) => r.EventCode || r.fkEventCode },
  { label: "Year",                    get: (r) => r.Yr },
  { label: "Event Name",              get: (r) => r.EventName },
  { label: "Master Quality - DR",     get: (r) => r.Masterquality },
  { label: "Event Name - Code",       get: (r) => r.EventDisplay || [r.EventName, r.EventCode || r.fkEventCode].filter(Boolean).join(" - ") },
  { label: "Detail - Sub Detail",     get: (r) => r.DetailSub || [r.Detail, r.SubDetail].filter(Boolean).join(" - ") },
  { label: "DR - Recording Name",     get: (r) => r.RecordingName },
  { label: "DR Duration",             get: (r) => r.DRDuration || r.Duration || "" },
];

const PANEL_FIELDS: { label: string; get: (r: any) => string }[] = [
  { label: "ML Unique ID",        get: (r) => r.MLUniqueID },
  { label: "Year",                get: (r) => r.Yr },
  { label: "Event Name - Code",   get: (r) => r.EventDisplay || [r.EventName, r.EventCode || r.fkEventCode].filter(Boolean).join(" - ") },
  { label: "Detail - Sub Detail", get: (r) => r.DetailSub || [r.Detail, r.SubDetail].filter(Boolean).join(" - ") },
  { label: "Topic",               get: (r) => r.Topic },
  { label: "Sub Duration",        get: (r) => r.SubDuration },
  { label: "Segment Category",    get: (r) => r["Segment Category"] || r.SegmentCategory },
  { label: "Footage Type",        get: (r) => r.FootageType },
  { label: "Synopsis",            get: (r) => r.Synopsis },
  { label: "Editing Status",      get: (r) => r.EditingStatus },
  { label: "Language",            get: (r) => r.Language },
  { label: "Remarks",             get: (r) => r.Remarks },
  { label: "Satsang Start",       get: (r) => r.SatsangStart },
  { label: "Satsang End",         get: (r) => r.SatsangEnd },
  { label: "Master Quality",      get: (r) => r.Masterquality },
  { label: "Content From",        get: (r) => r.ContentFrom },
  { label: "City",                get: (r) => r.fkCity },
  { label: "Number",              get: (r) => r.Number },
  { label: "Occasion",            get: (r) => r.fkOccasion },
  { label: "Keywords",            get: (r) => r.Keywords },
  { label: "Guidance",            get: (r) => r.Guidance },
  { label: "Granth",              get: (r) => r.fkGranth },
];

const AUX_DETAIL_FIELDS: { label: string; key: keyof AuxFile }[] = [
  { label: "SRTLink",      key: "SRTLink" },
  { label: "AUXID",        key: "AUXID" },
  { label: "new_auxid",    key: "new_auxid" },
  
  { label: "Remarks",      key: "NotesRemarks" },
  { label: "CreatedOn",    key: "CreatedOn" },
  { label: "CreatedBy",    key: "CreatedBy" },
  { label: "ModifiedOn",   key: "ModifiedOn" },
  { label: "ModifiedBy",   key: "ModifiedBy" },
];

function DetailPanel({ row, auxFiles, loading, onClose, onRefresh, token, canViewAuxML = false, canEditSatsang = false, canEditAuxML = false }: DetailPanelProps) {
  const [selectedAux, setSelectedAux]       = useState<AuxFile | null>(null);
  const [selectedMlUpd, setSelectedMlUpd]   = useState<any | null>(null);
  const [mlUpdDrilldown, setMlUpdDrilldown] = useState(false);
  const [mlUpdations, setMlUpdations]       = useState<any[]>([]);
  const [loadingMlUpd, setLoadingMlUpd]     = useState(false);
  const [satsangFromAux, setSatsangFromAux] = useState(false);

  // New Modal States
  const [showAddAuxModal, setShowAddAuxModal] = useState(false);
  const [showAddMLUpdModal, setShowAddMLUpdModal] = useState(false);

  // New Edit States for AuxFile Details
  const [isEditingAux, setIsEditingAux] = useState(false);
  const [editSrtLink, setEditSrtLink] = useState("");
  const [isSavingAux, setIsSavingAux] = useState(false);
  const [auxEditError, setAuxEditError] = useState("");

  const handleEditAux = () => {
    setEditSrtLink(selectedAux?.SRTLink || "");
    setIsEditingAux(true);
    setAuxEditError("");
  };

  const handleCancelAuxEdit = () => {
    setIsEditingAux(false);
    setAuxEditError("");
  };

  const handleSaveAuxEdit = async () => {
    if (!selectedAux?.new_auxid) return;
    setIsSavingAux(true);
    setAuxEditError("");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const payload = { SRTLink: editSrtLink };
      const res = await fetch(`${API_BASE}/srt-submission/related-auxfiles/${encodeURIComponent(selectedAux.new_auxid)}`, {
        method: "PUT", headers, body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to update AuxFile."); }
      
      // Update local state and trigger refresh
      const updatedAux = { ...selectedAux, SRTLink: editSrtLink };
      setSelectedAux(updatedAux);
      onRefresh(); // Refresh the parent list of aux files
      setIsEditingAux(false);
      toast.success("AuxFile updated successfully!");
    } catch (err: any) {
      setAuxEditError(err.message || "An error occurred.");
    } finally {
      setIsSavingAux(false);
    }
  };

  const goBack = () => {
    if (isEditingAux)                                   { handleCancelAuxEdit(); return; }
    if (satsangFromAux)                                 { setSatsangFromAux(false); return; }
    if (selectedMlUpd && mlUpdDrilldown && selectedAux) { setSelectedAux(null); return; }
    if (selectedMlUpd && mlUpdDrilldown)                { setMlUpdDrilldown(false); return; }
    if (selectedMlUpd)                                  { setSelectedMlUpd(null); return; }
    if (selectedAux)                                    { setSelectedAux(null); return; }
    onClose();
  };

  const fetchUpdations = useCallback(() => {
    if (!row?.MLUniqueID) return;
    setLoadingMlUpd(true);
    setMlUpdations([]);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    fetch(`${API_BASE}/google-sheet/aux-ml-status/by-mlid/${encodeURIComponent(row.MLUniqueID)}`, { headers })
      .then(r => r.json())
      .then(d => setMlUpdations(d?.data || []))
      .catch(() => {})
      .finally(() => setLoadingMlUpd(false));
  }, [row?.MLUniqueID, token]);

  useEffect(() => { fetchUpdations(); }, [fetchUpdations]);

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0,
      width: "min(420px, 95vw)",
      background: "#0f172a",
      borderLeft: "1px solid rgba(255,255,255,0.08)",
      display: "flex", flexDirection: "column",
      zIndex: 1000,
      boxShadow: "-8px 0 32px rgba(0,0,0,0.6)",
      animation: "slideInRight 0.2s ease-out",
    }}>
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .detail-scroll::-webkit-scrollbar { width: 5px; }
        .detail-scroll::-webkit-scrollbar-track { background: transparent; }
        .detail-scroll::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        .aux-row:hover { background: rgba(99,102,241,0.08) !important; cursor: pointer; }
      `}</style>

      <div style={{
        flexShrink: 0, padding: "12px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", gap: "10px",
        background: "rgba(15,23,42,0.98)",
      }}>
        {selectedMlUpd && mlUpdDrilldown && selectedAux ? (
          <>
            <button onClick={goBack} style={{ background: "none", border: "none", color: "#6366f1", padding: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", fontWeight: 600 }}>
              <ArrowLeft size={13} /> Back
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selectedAux.new_auxid || selectedAux.AUXID || "AuxFile"}
              </p>
              <p style={{ margin: "1px 0 0", fontSize: "0.68rem", color: "#64748b" }}>AuxFile Details</p>
            </div>
          </>
        ) : selectedMlUpd && mlUpdDrilldown ? (
          <>
            <button onClick={goBack} style={{ background: "none", border: "none", color: "#f59e0b", padding: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", fontWeight: 600 }}>
              <ArrowLeft size={13} /> Back
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {row.MLUniqueID}
              </p>
              <p style={{ margin: "1px 0 0", fontSize: "0.68rem", color: "#64748b" }}>Satsang Details</p>
            </div>
          </>
        ) : selectedMlUpd ? (
          <>
            <button onClick={goBack} style={{ background: "none", border: "none", color: "#f59e0b", padding: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", fontWeight: 600 }}>
              <ArrowLeft size={13} /> Back
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selectedMlUpd["Related ML"] || "ML Updation"}
              </p>
              <p style={{ margin: "1px 0 0", fontSize: "0.68rem", color: "#64748b" }}>ML Updation Details</p>
            </div>
          </>
        ) : selectedAux && satsangFromAux ? (
          <>
            <button onClick={goBack} style={{ background: "none", border: "none", color: "#6366f1", padding: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", fontWeight: 600 }}>
              <ArrowLeft size={13} /> Back
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {row.MLUniqueID}
              </p>
              <p style={{ margin: "1px 0 0", fontSize: "0.68rem", color: "#64748b" }}>Satsang Details</p>
            </div>
          </>
        ) : selectedAux ? (
          <>
            <button onClick={goBack} style={{ background: "none", border: "none", color: "#6366f1", padding: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", fontWeight: 600 }}>
              <ArrowLeft size={13} /> Back
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selectedAux.new_auxid || selectedAux.AUXID || "AuxFile"}
              </p>
              <p style={{ margin: "1px 0 0", fontSize: "0.68rem", color: "#64748b" }}>AuxFile Details</p>
            </div>
            {canEditSatsang && !isEditingAux && (
              <button onClick={handleEditAux} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "7px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                <Pencil size={11} /> Edit
              </button>
            )}
          </>
        ) : (
          <>
            <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FileText size={13} color="white" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#f1f5f9" }}>{row.MLUniqueID}</p>
              <p style={{ margin: "1px 0 0", fontSize: "0.71rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {[row.EventName, row.EventCode].filter(Boolean).join(" – ") || ""}
              </p>
            </div>
            <button onClick={onRefresh} title="Refresh" style={{ background: "none", border: "none", color: "#475569", padding: "4px", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <RefreshCw size={13} />
            </button>
          </>
        )}
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", padding: "4px", cursor: "pointer", display: "flex", alignItems: "center" }}>
          <X size={15} />
        </button>
      </div>

      <div className="detail-scroll" style={{ flex: 1, overflow: "auto", scrollbarWidth: "thin", scrollbarColor: "#1e293b transparent" }}>
        {selectedAux && satsangFromAux ? (
          <>
            {DETAIL_FIELDS.map(({ label, get }) => {
              const val = get(row);
              const display = val !== undefined && val !== null && String(val).trim() !== "" ? String(val) : null;
              return (
                <div key={label} style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: "0.67rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                  <span style={{ fontSize: "0.82rem", color: display ? "#e2e8f0" : "#334155", lineHeight: 1.5, wordBreak: "break-word" }}>{display || "—"}</span>
                </div>
              );
            })}
          </>
        ) : selectedMlUpd && mlUpdDrilldown && selectedAux ? (
          <>
            <div onClick={() => setSelectedAux(null)} style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }} title="Back to satsang">
              <span style={{ fontSize: "0.67rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>fkMLID</span>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.82rem", color: "#e2e8f0", lineHeight: 1.5 }}>{selectedAux.fkMLID || "—"}</span>
                <ChevronRight size={15} style={{ color: "#475569", flexShrink: 0 }} />
              </span>
            </div>
            {AUX_DETAIL_FIELDS.map(({ label, key }) => {
              const val = selectedAux[key];
              const display = val !== undefined && val !== null && String(val).trim() !== "" ? String(val) : null;
              return (
                <div key={label} style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: "0.67rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                  {key === "SRTLink" && isEditingAux ? (
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                       <textarea 
                         value={editSrtLink} 
                         rows={3}
                         onChange={(e) => setEditSrtLink(e.target.value)} 
                         style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(99,102,241,0.4)", borderRadius: "6px", padding: "8px 10px", color: "#e2e8f0", fontSize: "0.82rem", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} 
                       />
                    </div>
                  ) : display && key === "SRTLink" ? (
                    <a href={display} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.82rem", color: "#818cf8", textDecoration: "underline", wordBreak: "break-all" }}>{display}</a>
                  ) : (
                    <span style={{ fontSize: "0.82rem", color: display ? "#e2e8f0" : "#334155", lineHeight: 1.5, wordBreak: "break-word" }}>{display || "—"}</span>
                  )}
                </div>
              );
            })}
            {isEditingAux && auxEditError && (
              <div style={{ padding: "0 16px", color: "#f87171", fontSize: "0.78rem" }}>{auxEditError}</div>
            )}
            {/* Edit / Save buttons for Aux File */}
            <div style={{ padding: "16px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              {isEditingAux ? (
                <>
                  <button onClick={handleCancelAuxEdit} style={{ padding: "6px 14px", borderRadius: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", fontSize: "0.78rem", cursor: "pointer", fontWeight: 600 }}>
                    Cancel
                  </button>
                  <button onClick={handleSaveAuxEdit} disabled={isSavingAux} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 16px", borderRadius: "6px", background: "linear-gradient(135deg,#6366f1,#a855f7)", border: "none", color: "white", fontSize: "0.78rem", cursor: isSavingAux ? "not-allowed" : "pointer", fontWeight: 600, opacity: isSavingAux ? 0.7 : 1 }}>
                    {isSavingAux && <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />}
                    Save
                  </button>
                </>
              ) : (
                canEditSatsang && (
                  <button onClick={handleEditAux} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "6px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>
                    <Pencil size={12} /> Edit
                  </button>
                )
              )}
            </div>
          </>
        ) : selectedMlUpd && mlUpdDrilldown ? (
          <>
            {DETAIL_FIELDS.map(({ label, get }) => {
              const val = get(row);
              const display = val !== undefined && val !== null && String(val).trim() !== "" ? String(val) : null;
              return (
                <div key={label} style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: "0.67rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                  <span style={{ fontSize: "0.82rem", color: display ? "#e2e8f0" : "#334155", lineHeight: 1.5, wordBreak: "break-word" }}>{display || "—"}</span>
                </div>
              );
            })}
            <div style={{ padding: "14px 16px 20px" }}>
              <p style={{ margin: "0 0 10px", fontSize: "0.67rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
                Related AuxFiles ({loading ? "…" : auxFiles.length})
              </p>
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#475569", padding: "12px 0" }}>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: "0.8rem" }}>Loading…</span>
                </div>
              ) : auxFiles.length === 0 ? (
                <p style={{ margin: 0, fontSize: "0.78rem", color: "#334155", fontStyle: "italic" }}>No AuxFiles linked.</p>
              ) : (
                <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid rgba(99,102,241,0.2)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem" }}>
                    <thead>
                      <tr style={{ background: "rgba(99,102,241,0.14)", borderBottom: "1px solid rgba(99,102,241,0.2)" }}>
                        {["SRTLink", "AUXID", "new_auxid", "fkMLID", "CreatedOn"].map(h => (
                          <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: "#818cf8", fontWeight: 700, whiteSpace: "nowrap", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {auxFiles.map((f, i) => (
                        <tr key={i} className="aux-row" onClick={() => setSelectedAux(f)} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                          <td style={{ padding: "7px 10px", color: "#94a3b8", maxWidth: "100px" }}><span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={f.SRTLink || ""}>{f.SRTLink || "—"}</span></td>
                          <td style={{ padding: "7px 10px", color: "#e2e8f0", whiteSpace: "nowrap" }}>{f.AUXID || "—"}</td>
                          <td style={{ padding: "7px 10px", color: "#e2e8f0", whiteSpace: "nowrap" }}>{f.new_auxid || "—"}</td>
                          <td style={{ padding: "7px 10px", color: "#cbd5e1", whiteSpace: "nowrap" }}>{f.fkMLID || "—"}</td>
                          <td style={{ padding: "7px 10px", color: "#94a3b8", whiteSpace: "nowrap" }}>{f.CreatedOn || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : selectedMlUpd ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "0.67rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>MM Status</span>
              {selectedMlUpd["MM Status"] ? <MMStatusBadge value={selectedMlUpd["MM Status"]} /> : <span style={{ fontSize: "0.82rem", color: "#334155" }}>—</span>}
            </div>
            <div onClick={() => setMlUpdDrilldown(true)} style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }} title="View satsang details">
              <span style={{ fontSize: "0.67rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Related ML</span>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.82rem", color: "#a5b4fc", fontWeight: 600, lineHeight: 1.5 }}>{selectedMlUpd["Related ML"] || "—"}</span>
                <ChevronRight size={15} style={{ color: "#475569", flexShrink: 0 }} />
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "0.67rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Remarks</span>
              <span style={{ fontSize: "0.82rem", color: selectedMlUpd["Remarks"] ? "#e2e8f0" : "#334155", lineHeight: 1.5, wordBreak: "break-word" }}>{selectedMlUpd["Remarks"] || "—"}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "0.67rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status Changed Timestamp</span>
              <span style={{ fontSize: "0.82rem", color: selectedMlUpd["Status Changed Timestamp"] ? "#e2e8f0" : "#334155", lineHeight: 1.5 }}>{selectedMlUpd["Status Changed Timestamp"] || "—"}</span>
            </div>
          </>
        ) : selectedAux ? (
          <>
            <div
              onClick={() => setSatsangFromAux(true)}
              style={{
                display: "flex", flexDirection: "column", gap: "2px",
                padding: "10px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                cursor: "pointer",
              }}
              title="View satsang details"
            >
              <span style={{ fontSize: "0.67rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                fkMLID
              </span>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.82rem", color: "#e2e8f0", lineHeight: 1.5 }}>
                  {selectedAux.fkMLID || "—"}
                </span>
                <ChevronRight size={15} style={{ color: "#475569", flexShrink: 0 }} />
              </span>
            </div>

            {AUX_DETAIL_FIELDS.map(({ label, key }) => {
              const val = selectedAux[key];
              const display = val !== undefined && val !== null && String(val).trim() !== "" ? String(val) : null;
              const isLink = key === "SRTLink";
              return (
                <div key={label} style={{
                  display: "flex", flexDirection: "column", gap: "2px",
                  padding: "10px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <span style={{ fontSize: "0.67rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {label}
                  </span>
                {isLink && isEditingAux ? (
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                     <textarea 
                       value={editSrtLink} 
                       rows={3}
                       onChange={(e) => setEditSrtLink(e.target.value)} 
                       style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(99,102,241,0.4)", borderRadius: "6px", padding: "8px 10px", color: "#e2e8f0", fontSize: "0.82rem", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} 
                     />
                  </div>
                ) : display && isLink ? (
                  <a href={display} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.82rem", color: "#818cf8", textDecoration: "underline", wordBreak: "break-all" }}>{display}</a>
                  ) : (
                    <span style={{ fontSize: "0.82rem", color: display ? "#e2e8f0" : "#334155", lineHeight: 1.5, wordBreak: "break-word" }}>
                      {display || "—"}
                    </span>
                  )}
                </div>
              );
            })}
          {isEditingAux && auxEditError && (
            <div style={{ padding: "0 16px", color: "#f87171", fontSize: "0.78rem" }}>{auxEditError}</div>
          )}
          {isEditingAux && (
            <div style={{ padding: "16px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={handleCancelAuxEdit} style={{ padding: "6px 14px", borderRadius: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", fontSize: "0.78rem", cursor: "pointer", fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={handleSaveAuxEdit} disabled={isSavingAux} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 16px", borderRadius: "6px", background: "linear-gradient(135deg,#6366f1,#a855f7)", border: "none", color: "white", fontSize: "0.78rem", cursor: isSavingAux ? "not-allowed" : "pointer", fontWeight: 600, opacity: isSavingAux ? 0.7 : 1 }}>
                {isSavingAux && <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />}
                Save
              </button>
            </div>
          )}
          </>
        ) : (
          <>
            {PANEL_FIELDS.map(({ label, get }) => {
              const val = get(row);
              const display = val !== undefined && val !== null && String(val).trim() !== "" ? String(val) : null;
              return (
                <div key={label} style={{
                  display: "flex", flexDirection: "column", gap: "2px",
                  padding: "10px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <span style={{ fontSize: "0.67rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {label}
                  </span>
                  <span style={{ fontSize: "0.82rem", color: display ? "#e2e8f0" : "#334155", lineHeight: 1.5, wordBreak: "break-word" }}>
                    {display || "—"}
                  </span>
                </div>
              );
            })}

            {/* RELATED AUXFILES SECTION WITH ADD BUTTON */}
            <div style={{ padding: "14px 16px 6px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <p style={{ margin: 0, fontSize: "0.67rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
                  Related AuxFiles ({loading ? "…" : auxFiles.length})
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {canEditSatsang && (
                    <button type="button" onClick={() => setShowAddAuxModal(true)} style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Add</button>
                  )}
                </div>
              </div>

              {loading ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#475569", padding: "12px 0" }}>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: "0.8rem" }}>Loading…</span>
                </div>
              ) : auxFiles.length === 0 ? (
                <p style={{ margin: "0 0 16px", fontSize: "0.78rem", color: "#334155", fontStyle: "italic" }}>No AuxFiles linked.</p>
              ) : (
                <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid rgba(99,102,241,0.2)", marginBottom: "16px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem" }}>
                    <thead>
                      <tr style={{ background: "rgba(99,102,241,0.14)", borderBottom: "1px solid rgba(99,102,241,0.2)" }}>
                        {["SRTLink", "AUXID", "new_auxid", "fkMLID", "CreatedOn", "CreatedBy", "ModifiedOn", "ModifiedBy"].map((h) => (
                          <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: "#818cf8", fontWeight: 700, whiteSpace: "nowrap", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {auxFiles.map((f, i) => (
                        <tr
                          key={i}
                          className="aux-row"
                          onClick={() => setSelectedAux(f)}
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}
                        >
                          <td style={{ padding: "7px 10px", color: "#94a3b8", maxWidth: "120px" }}>
                            <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={f.SRTLink || ""}>{f.SRTLink || "—"}</span>
                          </td>
                          <td style={{ padding: "7px 10px", color: "#e2e8f0", whiteSpace: "nowrap" }}>{f.AUXID || "—"}</td>
                          <td style={{ padding: "7px 10px", color: "#e2e8f0", whiteSpace: "nowrap" }}>{f.new_auxid || "—"} <Mail size={12} style={{ display: 'inline', marginLeft: '4px', verticalAlign: 'middle', opacity: 0.7 }} /></td>
                          <td style={{ padding: "7px 10px", color: "#cbd5e1", whiteSpace: "nowrap" }}>{f.fkMLID || "—"}</td>
                          <td style={{ padding: "7px 10px", color: "#94a3b8", whiteSpace: "nowrap" }}>{f.CreatedOn || "—"}</td>
                          <td style={{ padding: "7px 10px", color: "#94a3b8", whiteSpace: "nowrap" }}>{f.CreatedBy || "—"}</td>
                          <td style={{ padding: "7px 10px", color: "#94a3b8", whiteSpace: "nowrap" }}>{f.ModifiedOn || "—"}</td>
                          <td style={{ padding: "7px 10px", color: "#94a3b8", whiteSpace: "nowrap" }}>{f.ModifiedBy || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* RELATED ML UPDATIONS SECTION WITH ADD BUTTON */}
            {canViewAuxML && (
              <div style={{ padding: "14px 16px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <p style={{ margin: 0, fontSize: "0.67rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
                    Related ML Updations ({loadingMlUpd ? "…" : mlUpdations.length})
                  </p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {canEditAuxML && (
                      <button type="button" onClick={() => setShowAddMLUpdModal(true)} style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Add</button>
                    )}
                  </div>
                </div>

                {loadingMlUpd ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#475569", padding: "12px 0" }}>
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                    <span style={{ fontSize: "0.8rem" }}>Loading…</span>
                  </div>
                ) : mlUpdations.length === 0 ? (
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#334155", fontStyle: "italic" }}>No ML Updations linked.</p>
                ) : (
                  <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid rgba(245,158,11,0.2)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem" }}>
                      <thead>
                        <tr style={{ background: "rgba(245,158,11,0.1)", borderBottom: "1px solid rgba(245,158,11,0.2)" }}>
                          {["MM Status", "Related ML", "Remarks", "Status Changed Timestamp"].map((h) => (
                            <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: "#fbbf24", fontWeight: 700, whiteSpace: "nowrap", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {mlUpdations.map((u, i) => (
                          <tr
                            key={i}
                            className="aux-row"
                            onClick={() => setSelectedMlUpd(u)}
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}
                          >
                            <td style={{ padding: "7px 10px", whiteSpace: "nowrap" }}>
                              {u["MM Status"] ? <MMStatusBadge value={u["MM Status"]} /> : <span style={{ color: "#334155" }}>—</span>}
                            </td>
                            <td style={{ padding: "7px 10px", color: "#a5b4fc", fontWeight: 600, whiteSpace: "nowrap" }}>{u["Related ML"] || "—"}</td>
                            <td style={{ padding: "7px 10px", color: "#cbd5e1", maxWidth: "140px" }}>
                              <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={u["Remarks"] || ""}>{u["Remarks"] || "—"}</span>
                            </td>
                            <td style={{ padding: "7px 10px", color: "#94a3b8", whiteSpace: "nowrap" }}>{u["Status Changed Timestamp"] || "—"} <ChevronRight size={12} style={{ display: 'inline', float: 'right', marginTop: '2px', opacity: 0.5 }} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Forms trigger */}
      {showAddAuxModal && (
        <AddAuxFileModal 
          token={token}
          initialMLID={row.MLUniqueID}
          onClose={() => setShowAddAuxModal(false)}
          onSuccess={onRefresh}
          existingAuxFile={auxFiles.length > 0 ? auxFiles[0] : undefined}
        />
      )}
      {showAddMLUpdModal && (
        <AddAuxMLModal 
          token={token}
          initialRelatedML={row.MLUniqueID}
          onClose={() => setShowAddMLUpdModal(false)}
          onSuccess={fetchUpdations}
        />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  onBack: () => void;
  userEmail?: string;
}

export function SRTSubmissionProject({ onBack }: Props) {
  const { user } = useAuth();
  const isPrivileged = user?.role === "Admin" || user?.role === "Owner";
  const hasPerm = (resource: string, action: "read" | "write"): boolean => {
    if (isPrivileged) return true;
    return !!user?.permissions?.some(p => p.resource === resource && p.actions.includes(action));
  };

  const canViewSatsang = hasPerm("SRT Submission - Satsang Category", "read");
  const canViewAuxML   = hasPerm("SRT Submission - AUX ML Updates",   "read");
  const canEditAuxML   = hasPerm("SRT Submission - AUX ML Updates",   "write");
  const canEditSatsang = hasPerm("SRT Submission - Satsang Category", "write");

  const visibleTabs = TABS.filter(t =>
    (t.id === "satsang_category" && canViewSatsang) ||
    (t.id === "aux_ml_status"    && canViewAuxML)
  );

  const [activeTab, setActiveTab] = useState<TabView>(() =>
    canViewSatsang ? "satsang_category" : canViewAuxML ? "aux_ml_status" : "satsang_category"
  );

  const [selectedRow, setSelectedRow]   = useState<any>(null);
  const [auxFiles, setAuxFiles]          = useState<AuxFile[]>([]);
  const [loadingAux, setLoadingAux]      = useState(false);
  const [panelOpen, setPanelOpen]        = useState(false);

  // --- Map to hold counts of ML Updations from Google Sheets ---
  const [mlUpdationsMap, setMlUpdationsMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchUpdationsMap = async () => {
      try {
        const headers: Record<string, string> = {};
        if (user?.token) headers["Authorization"] = `Bearer ${user.token}`;
        const res = await fetch(`${API_BASE}/google-sheet/aux-ml-status?limit=10000`, { headers });
        if (res.ok) {
          const json = await res.json();
          const map: Record<string, number> = {};
          (json.data || []).forEach((r: any) => {
            const ml = r["Related ML"];
            if (ml) map[ml] = (map[ml] || 0) + 1;
          });
          setMlUpdationsMap(map);
        }
      } catch (e) {
        console.error("Failed to fetch ML Updations Map", e);
      }
    };
    fetchUpdationsMap();
  }, [user?.token]);

  const rowTransformer = useCallback((row: any) => ({
    ...row,
    relatedMLUpdationsCount: mlUpdationsMap[row.MLUniqueID] || 0
  }), [mlUpdationsMap]);

  const fetchAuxFiles = useCallback(async (row: any) => {
    if (!row?.MLUniqueID) return;
    setLoadingAux(true);
    setAuxFiles([]);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (user?.token) headers["Authorization"] = `Bearer ${user.token}`;
    try {
      const res = await fetch(`${API_BASE}/srt-submission/related-auxfiles/${encodeURIComponent(row.MLUniqueID)}`, { headers });
      const data = await res.json();
      setAuxFiles(data?.data || []);
    } catch (err) {
      console.error("Failed to fetch AuxFiles:", err);
    } finally {
      setLoadingAux(false);
    }
  }, [user?.token]);

  const handleRowSelect = useCallback((row: any) => {
    setSelectedRow(row);
    setPanelOpen(true);
    fetchAuxFiles(row);
  }, [fetchAuxFiles]);

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedRow(null);
    setAuxFiles([]);
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#020617", overflow: "hidden" }}>
      <div style={{
        flexShrink: 0, padding: "10px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", gap: "14px",
        background: "rgba(15,23,42,0.97)",
      }}>
        <button
          onClick={onBack}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px", color: "#94a3b8", padding: "5px 11px",
            cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, flexShrink: 0,
          }}
        >
          <ArrowLeft size={13} /> Back
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "7px",
            background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <FileText size={15} color="white" />
          </div>
          <span style={{ fontSize: "1rem", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.3px" }}>
            Data Library – SRT Submission
          </span>
        </div>

        {visibleTabs.length > 1 && <div style={{
          marginLeft: "auto", display: "flex", gap: "4px",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "10px", padding: "3px",
        }}>
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "5px 13px", borderRadius: "7px", border: "none",
                  cursor: "pointer", fontSize: "0.78rem", fontWeight: 600,
                  whiteSpace: "nowrap", transition: "all 0.15s",
                  background: isActive
                    ? "linear-gradient(to right, rgba(99,102,241,0.45), rgba(168,85,247,0.45))"
                    : "transparent",
                  color: isActive ? "#e2e8f0" : "#64748b",
                  boxShadow: isActive ? "0 0 0 1px rgba(99,102,241,0.4)" : "none",
                }}
              >
                {tab.icon}{tab.label}
              </button>
            );
          })}
        </div>}
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", scrollbarWidth: "thin", scrollbarColor: "#334155 transparent" }}>
          <div className="srt-content-area" style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", minHeight: 0 }}>
            {activeTab === "satsang_category" && (
              <ClickUpListViewUpdated
                key="srt_satsang_category"
                title="Satsang Category"
                viewId="srt_satsang_category"
                apiEndpoint="/newmedialog/srt-satsang-category"
                idKey="MLUniqueID"
                columns={SATSANG_CATEGORY_COLUMNS}
                filterConfigs={[]}
                onRowSelect={handleRowSelect}
                initialSortBy="Yr"
                initialSortDirection="desc"
                rowTransformer={rowTransformer}
              />
            )}
            {activeTab === "aux_ml_status" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                <AuxMLStatusView token={user?.token} canEdit={canEditAuxML} canViewSatsang={canViewSatsang} />
              </div>
            )}
          </div>
        </div>

        {panelOpen && selectedRow && (
          <>
            <div onClick={closePanel} style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.35)" }} />
            <DetailPanel
              row={selectedRow}
              auxFiles={auxFiles}
              loading={loadingAux}
              onClose={closePanel}
              onRefresh={() => fetchAuxFiles(selectedRow)}
              token={user?.token}
              canViewAuxML={canViewAuxML}
              canEditSatsang={canEditSatsang}
              canEditAuxML={canEditAuxML}
            />
          </>
        )}
      </div>
    </div>
  );
}