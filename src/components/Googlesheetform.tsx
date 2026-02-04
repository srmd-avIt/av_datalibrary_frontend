import React, { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { 
  Save, FileAudio, Database, Activity, CheckCircle, 
  Sparkles, Layers, Plus, ListChecks, Trash2, UploadCloud, 
  CheckSquare, Square, Inbox, Pencil, X, MessageSquare, Send, Eye, RotateCcw,
  AlertCircle, XCircle, ChevronDown, ChevronRight, CheckCircle2, ListFilter, Loader2,
  AtSign, CornerUpLeft, FileSearch, Lock,
  // Hub Icons
  Layout, Wand2, Video, FileText, ArrowRight, ArrowLeft,
  // New Icons for Table View
  TableProperties, LayoutList, Grip, GripVertical
} from "lucide-react";

// --- STATUS OPTIONS ---
const STATUS_OPTIONS = [
  {
    id: "incomplete",
    label: "Submitted to MM",
    icon: AlertCircle,
    color: "#f87171"
  },
  {
    id: "revision",
    label: "Needs Revision",
    icon: RotateCcw,
    color: "#60a5fa"
  },
  {
    id: "inwarding",
    label: "Inwarding",
    icon: Loader2,
    color: "#f59e42"
  },
  {
    id: "submission_confirmed",
    label: "Submission Confirmed",
    icon: CheckCircle2,
    color: "#24fbf0"
  },
  {
    id: "complete",
    label: "Complete",
    icon: CheckCircle,
    color: "#34d399"
  }
];

import { useAuth } from "../contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import * as mm from 'music-metadata-browser';

const API_BASE_URL = (import.meta as any).env.VITE_API_URL;
const cleanBaseUrl = API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');

const STORAGE_KEY = "mis_queue_data_v1";
const PRESERVATION_STATUS_OPTIONS = ["Preserve",  "Pending"];
const MASTER_QUALITY_OPTIONS = ["Audio - High Res", "Audio - Low Res","Only Audio"];

// --- TABLE COLUMN DEFINITIONS ---
const TABLE_COLUMNS = [
  { id: 'select', label: '', width: 40, frozen: true },
  { id: 'actions', label: 'Actions', width: 70, frozen: true },
  { id: 'status', label: 'Status', width: 160 },
  { id: 'RecordingCode', label: 'Recording Code', width: 130 },
  { id: 'fkEventCode', label: 'Event Code', width: 100 },
  { id: 'EventName', label: 'Event Name', width: 250 },
  { id: 'Yr', label: 'Year', width: 60 },
  { id: 'NewEventCategory', label: 'Event Category', width: 140 },
  { id: 'RecordingName', label: 'Recording Name', width: 250 },
  { id: 'Duration', label: 'Duration', width: 80 },
  { id: 'Filesize', label: 'File Size', width: 90 },
  { id: 'FilesizeInBytes', label: 'Bytes', width: 100 },
  { id: 'fkMediaName', label: 'Media Type', width: 100 },
  { id: 'BitRate', label: 'Bitrate', width: 80 },
  { id: 'NoOfFiles', label: 'No. Files', width: 80 },
  { id: 'AudioBitrate', label: 'Audio Bitrate', width: 100 },
  { id: 'Masterquality', label: 'Master Quality', width: 120 },
  { id: 'PreservationStatus', label: 'Preservation', width: 120 },
  { id: 'RecordingRemarks', label: 'DMS Remarks', width: 200 },
  { id: 'MLUniqueID', label: 'ML Unique ID', width: 130 },
  { id: 'AudioWAVCode', label: 'WAV Code', width: 130 },
  { id: 'AudioMP3Code', label: 'MP3 Code', width: 130 },
  { id: 'fkGranth', label: 'Granth', width: 120 },
  { id: 'Number', label: 'Number', width: 80 },
  { id: 'Topic', label: 'Topic', width: 200 },
  { id: 'ContentFrom', label: 'Date From', width: 100 },
  { id: 'SatsangStart', label: 'Satsang Start', width: 80 },
  { id: 'SatsangEnd', label: 'Satsang End', width: 80 },
  { id: 'fkCity', label: 'City', width: 120 },
  { id: 'SubDuration', label: 'Sub Duration', width: 100 },
  { id: 'Detail', label: 'Detail', width: 200 },
  { id: 'Remarks', label: 'Remarks', width: 200 },
];

// --- HELPERS ---
const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h, m, s].map(v => v < 10 ? "0" + v : v).join(":");
};

const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const getMediaMetadata = async (file: File): Promise<any> => {
    try {
        const metadata = await mm.parseBlob(file);
        const duration = metadata.format.duration || 0;
        let bitrate = null;
        if (metadata.format.bitrate) bitrate = Math.round(metadata.format.bitrate / 1000);
        if (duration > 0 || bitrate) return { duration, width: 0, height: 0, bitrate };
    } catch (e) {}
    const isVideo = file.type.startsWith('video');
    const isAudio = file.type.startsWith('audio');
    const ext = file.name.split('.').pop()?.toLowerCase();
    const mediaExts = ['mp3', 'wav', 'mp4', 'mov', 'mkv', 'avi', 'm4a', 'flac', 'aac', 'webm', 'ogg'];
    if (!isVideo && !isAudio && !mediaExts.includes(ext || '')) return { duration: 0, width: 0, height: 0, bitrate: null };
    return new Promise((resolve) => {
        const element = isVideo || (ext && ['mp4','mov','mkv','avi','webm'].includes(ext)) ? document.createElement('video') : document.createElement('audio');
        element.preload = 'metadata';
        element.onloadedmetadata = () => { window.URL.revokeObjectURL(element.src); resolve({ duration: element.duration || 0, width: (element as HTMLVideoElement).videoWidth || 0, height: (element as HTMLVideoElement).videoHeight || 0, bitrate: null }); };
        element.onerror = () => { resolve({ duration: 0, width: 0, height: 0, bitrate: null }); };
        element.src = URL.createObjectURL(file);
    });
};

// Format comments for Google Sheet Logchats column
const formatLogchats = (comments: any[] = []) =>
  comments.map(c => `[LOGS]: [${c.user}]: ${c.text}`).join('\n');

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    function handleResize() { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return windowSize;
}

// --- STYLES ---
const colors = {
    core: { from: "#f43f5e", to: "#ec4899", shadow: "rgba(244, 63, 94, 0.2)" },
    tech: { from: "#06b6d4", to: "#3b82f6", shadow: "rgba(6, 182, 212, 0.2)" },
    class: { from: "#8b5cf6", to: "#d946ef", shadow: "rgba(139, 92, 246, 0.2)" },
    qc: { from: "#f59e0b", to: "#f97316", shadow: "rgba(245, 158, 11, 0.2)" },
    bg: "#0f172a", text: "#ffffff", inputBg: "rgba(0, 0, 0, 0.3)",
    primary: "#7c3aed", secondary: "#3b82f6", success: "#10b981", border: "rgba(255,255,255,0.1)"
};

const styles = {
  wrapper: {
    height: "100vh", width: "100%", minWidth: "320px", 
    backgroundColor: "#020617",
    backgroundImage: `radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.1) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(244, 63, 94, 0.1) 0px, transparent 50%)`,
    padding: "20px", fontFamily: "'Inter', sans-serif", color: colors.text, overflow: "hidden", display: "flex", flexDirection: "column" as "column",
  },
  header: (isCompact: boolean) => ({
    height: isCompact ? "60px" : "80px", flexShrink: 0, marginBottom: isCompact ? "10px" : "20px",
    display: "flex", alignItems: "center", justifyContent: "center", position: "relative" as "relative", transition: "all 0.3s ease",
  }),
  title: (isCompact: boolean) => ({
    fontSize: isCompact ? "1.2rem" : "2rem", 
    fontWeight: "800", background: "linear-gradient(to right, #fff, #94a3b8)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "8px", letterSpacing: "-0.5px", transition: "all 0.3s ease",
  }),
  mainContainer: { display: "grid", gap: "20px", width: "100%", maxWidth: "1920px", margin: "0 auto", flex: 1, minHeight: 0, transition: "all 0.3s ease" },
  columnScroll: { height: "100%", overflowY: "auto" as "auto", paddingRight: "8px", paddingBottom: "100px" },
  unifiedCard: (isCompact: boolean) => ({ background: "rgba(30, 41, 59, 0.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "20px", padding: isCompact ? "16px" : "24px", width: "100%", boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.5)", transition: "padding 0.3s ease" }),
  queueCard: (isCompact: boolean) => ({ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "20px", padding: isCompact ? "16px" : "20px", width: "100%", transition: "padding 0.3s ease", display: "flex", flexDirection: "column" as "column" }),
  commentCard: { background: "#0f172a", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "20px", display: "flex", flexDirection: "column" as "column", height: "100%", overflow: "hidden", boxShadow: "-10px 0 30px rgba(0,0,0,0.3)" },
  queueItem: (isActive: boolean, isEditing: boolean) => ({ background: isEditing ? "rgba(245, 158, 11, 0.1)" : isActive ? "linear-gradient(90deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05))" : "rgba(30, 41, 59, 0.4)", borderLeft: isEditing ? "4px solid #f59e0b" : isActive ? "4px solid #3b82f6" : "4px solid transparent", border: "1px solid rgba(255,255,255,0.05)", borderLeftWidth: "4px", borderRadius: "8px", padding: "12px 14px", marginBottom: "8px", cursor: "pointer", transition: "all 0.2s ease" }),
  chatHeader: { padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(30, 41, 59, 0.5)" },
  chatBody: { flex: 1, overflowY: "auto" as "auto", padding: "20px", display: "flex", flexDirection: "column" as "column", gap: "15px" },
  chatFooter: { padding: "15px", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(30, 41, 59, 0.5)", display: "flex", gap: "10px", position: "relative" as "relative" },
  msgBubble: (isSystem: boolean) => ({ alignSelf: isSystem ? "center" : "flex-start", background: isSystem ? "transparent" : "rgba(59, 130, 246, 0.15)", padding: isSystem ? "5px" : "10px 14px", borderRadius: "12px", borderBottomLeftRadius: isSystem ? "12px" : "2px", maxWidth: "90%", fontSize: "0.85rem", color: isSystem ? "#64748b" : "#e2e8f0", border: isSystem ? "none" : "1px solid rgba(59, 130, 246, 0.2)" }),
  sectionBlock: { marginBottom: "24px" },
  sectionHeader: (theme: any) => ({ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", paddingBottom: "8px", borderBottom: `1px solid rgba(255,255,255,0.05)` }),
  iconBox: (theme: any) => ({ width: "28px", height: "28px", borderRadius: "6px", background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 16px -4px ${theme.shadow}`, color: "#fff" }),
  sectionTitle: { fontSize: "0.95rem", fontWeight: "700", color: "#fff", margin: 0 },
  gridFields: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "10px", rowGap: "14px" },
  inputWrapper: { display: "flex", flexDirection: "column" as "column", gap: "6px" },
  label: { fontSize: "0.65rem", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" as "uppercase", letterSpacing: "0.05em" },
  input: (theme: any, disabled: boolean, isCompact: boolean) => ({ backgroundColor: disabled ? "rgba(255,255,255,0.03)" : colors.inputBg, border: "1px solid rgba(255,255,255,0.1)", color: disabled ? "#94a3b8" : "#fff", height: isCompact ? "34px" : "38px", borderRadius: "8px", padding: "0 12px", transition: "all 0.2s ease", outline: "none", fontSize: "0.85rem", width: "100%", cursor: disabled ? "default" : "text" }),
  dropdownContainer: { position: 'relative' as 'relative', width: '100%' },
  dropdownList: { position: 'absolute' as 'absolute', top: '100%', left: 0, width: '100%', maxHeight: '200px', overflowY: 'auto' as 'auto', backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', zIndex: 1000, marginTop: '4px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' },
  dropdownItem: { padding: '8px 12px', fontSize: '0.85rem', color: '#fff', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  actionBar: { position: "absolute" as "absolute", bottom: "30px", left: "50%", transform: "translateX(-50%)", background: "rgba(15, 23, 42, 0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "10px 20px", borderRadius: "100px", display: "flex", alignItems: "center", gap: "20px", boxShadow: "0 10px 50px rgba(0,0,0,0.8)", zIndex: 100, whiteSpace: "nowrap" as "nowrap" },
  addBtn: (isEditing: boolean, isViewing: boolean) => ({ background: isEditing ? `linear-gradient(to right, #f59e0b, #d97706)` : isViewing ? `rgba(255,255,255,0.1)` : `linear-gradient(to right, #6366f1, #a855f7)`, border: isViewing ? "1px solid rgba(255,255,255,0.2)" : "none", borderRadius: "8px", padding: "0 30px", height: "40px", fontSize: "0.9rem", fontWeight: "600", color: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", flex: 1, whiteSpace: "nowrap" as "nowrap" }),
  resetBtn: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", width: "44px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", cursor: "pointer", transition: "all 0.2s ease" },
  cancelBtn: { background: "transparent", border: `1px solid rgba(255,255,255,0.2)`, borderRadius: "8px", padding: "0 20px", height: "40px", color: "#cbd5e1", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem", whiteSpace: "nowrap" as "nowrap" },
  queueHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 15, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.07)" },
  statusBadge: (status: string) => {
    let bg, color, border;
    switch(status) {
        case 'complete': bg="rgba(16, 185, 129, 0.15)"; color="#34d399"; border="#059669"; break;
        case 'revision': bg="rgba(59, 130, 246, 0.15)"; color="#60a5fa"; border="#2563eb"; break;
        case 'inwarding': bg="rgba(245, 158, 66, 0.15)"; color="#f59e42"; border="#f59e42"; break;
        case 'submission_confirmed': bg="rgba(251, 191, 36, 0.15)"; color="#24fbf0"; border="#24fbf0"; break;
        default: bg="rgba(239, 68, 68, 0.15)";  color="#f87171"; border="#dc2626"; break;
    }
    return { display: "flex", alignItems: "center", gap: 5, fontSize: "0.65rem", fontWeight: "700", textTransform: "uppercase" as "uppercase", background: bg, color: color, border: `1px solid ${border}`, padding: "2px 8px", borderRadius: "100px", cursor: "pointer", transition: "all 0.2s" };
  },
  groupTitle: (status: string, isActive: boolean) => ({ color: status === 'complete' ? '#34d399' : status === 'revision' ? '#60a5fa' : status === 'inwarding' ? '#f59e42' : status === 'submission_confirmed' ? '#24fbf0' : '#f87171', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' as 'uppercase', marginTop: 20, marginBottom: 10, padding: "8px 5px", display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', opacity: isActive ? 1 : 0.7, transition: "opacity 0.2s" }),
  // Table Specific Styles (Updated to support resizing)
  tableHeader: { padding: '12px 6px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' as 'uppercase', color: '#94a3b8', background: 'rgba(30, 41, 59, 0.95)', position: 'sticky' as 'sticky', top: 0, zIndex: 10, whiteSpace: 'nowrap' as 'nowrap', borderBottom: '2px solid rgba(255,255,255,0.08)', userSelect: 'none' as 'none' },
  tableCell: { padding: '8px 10px', fontSize: '0.8rem', color: '#e2e8f0', borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' as 'nowrap', verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis' },
  tableRow: (isActive: boolean) => ({ background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent', cursor: 'pointer', transition: 'background 0.2s' })
};

// --- COMPONENTS ---

const SectionTitle = ({ icon: Icon, title, theme }: any) => (
    <div style={styles.sectionHeader(theme)}>
        <div style={styles.iconBox(theme)}><Icon size={16} /></div>
        <h3 style={styles.sectionTitle}>{title}</h3>
    </div>
);

const SearchableSelect = ({ label, name, options, value, onChange, theme, required, disabled, full, medium, isCompact }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [displayLimit, setDisplayLimit] = useState(50); 
    const wrapperRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const filteredOptions = options.filter((opt: string) => String(opt).toLowerCase().includes(searchTerm.toLowerCase()));
    const visibleOptions = filteredOptions.slice(0, displayLimit);

    useEffect(() => { const handleClickOutside = (event: any) => { if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false); }; document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, []);
    useEffect(() => { if (!isOpen) setDisplayLimit(50); }, [isOpen]);
    useEffect(() => { setDisplayLimit(50); }, [searchTerm]);
    const handleSelect = (val: string) => { onChange({ target: { name, value: val } }); setIsOpen(false); setSearchTerm(""); };
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => { const { scrollTop, scrollHeight, clientHeight } = e.currentTarget; if (scrollTop + clientHeight >= scrollHeight - 20) { if (displayLimit < filteredOptions.length) setDisplayLimit(prev => prev + 50); } };

    return (
        <div style={{ ...styles.inputWrapper, gridColumn: full ? "1 / -1" : medium ? "span 2" : "auto" }} ref={wrapperRef}>
            <Label style={{...styles.label, color: isOpen ? theme.to : styles.label.color }}>{label} {required && <span style={{ color: theme.from, fontSize: "1.2em", lineHeight: 0 }}>*</span>}</Label>
            <div style={styles.dropdownContainer}>
                <Input name={name} value={isOpen ? searchTerm : value} onChange={(e) => { if (isOpen) setSearchTerm(e.target.value); else onChange(e); }} onFocus={() => { if (!disabled) { setIsOpen(true); setSearchTerm(""); } }} placeholder={isOpen ? "Type to search..." : "Select or type..."} style={{...styles.input(theme, disabled, isCompact), borderColor: isOpen ? theme.to : "rgba(255,255,255,0.1)"}} disabled={disabled} autoComplete="off" />
                {isOpen && !disabled && ( <div style={styles.dropdownList} className="hide-scrollbar" onScroll={handleScroll} ref={listRef}> {visibleOptions.length > 0 ? ( <> {visibleOptions.map((opt: string, idx: number) => (
  <div
    key={idx}
    style={styles.dropdownItem}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
    onClick={() => handleSelect(opt)}
  >
    {opt}
  </div>
))} {displayLimit < filteredOptions.length && ( <div style={{...styles.dropdownItem, textAlign: 'center', color: '#64748b', fontSize: '0.75rem'}}> <Loader2 className="animate-spin inline-block mr-2" size={12}/> Loading more... </div> )} </> ) : ( <div style={{...styles.dropdownItem, color: '#94a3b8', cursor: 'default'}}>No matches found</div> )} </div> )}
                <div style={{position: 'absolute', right: 10, top: 10, pointerEvents: 'none', color: '#64748b'}}>{isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</div>
            </div>
        </div>
    );
};

export function GoogleSheetForm({ config, userEmail }: { config: any; userEmail?: string }) {
  const { user: loggedInUser } = useAuth();
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  // Check responsive breakpoints
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1280;
  const isCompact = windowWidth < 1440 || windowHeight < 800; 
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  // --- VIEW MODE STATE ---
  const [viewMode, setViewMode] = useState<'hub' | 'form'>('hub');
  
  // --- QUEUE VIEW MODE (List/Card vs Table) ---
  const [isTableView, setIsTableView] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  // --- HEADER NAV STATE ---
  const [activeNav, setActiveNav] = useState("Dashboard");

  // --- PERMISSION CHECK: AUDIO MERGE PROJECT ---
  const canViewAudioMerge = 
      loggedInUser?.role === "Admin" || 
      loggedInUser?.role === "Owner" || 
      !!loggedInUser?.permissions?.some((p: any) => 
        p.resource === "Audio Merge Project" && 
        (p.actions.includes("read") || p.actions.includes("write"))
      );

  const hasEditAccess = (loggedInUser?.role === "Admin" || loggedInUser?.role === "Owner") || !!loggedInUser?.permissions?.some((p: any) => (p.resource === "Digital Recordings" || p.resource === "Audio Merge Project") && p.actions.includes("write"));
  const canApprove = hasEditAccess;

  // --- ENTRY EDITING LOGIC ---
  const canEditEntry = (item: any) => {
    const status = item._status || 'incomplete';
    return hasEditAccess && status === 'revision';
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isGrouped, setIsGrouped] = useState(false); 
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['incomplete', 'revision', 'complete']));
  const [groupByField, setGroupByField] = useState<string>('_status'); // Default group by Status in Table View
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 }); // Stores position for status dropdown in table view

  // --- COLUMN RESIZING STATE ---
  const [colWidths, setColWidths] = useState<{[key: string]: number}>(() => {
    const initial: any = {};
    TABLE_COLUMNS.forEach(col => initial[col.id] = col.width);
    return initial;
  });

  const [eventCodeOptions, setEventCodeOptions] = useState<{ EventCode: string, EventName: string, Yr?: string, NewEventCategory?: string }[]>([]);
  const [mlIdOptions, setMlIdOptions] = useState<any[]>([]);
  const [userList, setUserList] = useState<{name: string, email: string}[]>([]); 
  const [queue, setQueue] = useState<any[]>(() => { try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : []; } catch (e) { return []; } });
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null); 
  const [editingId, setEditingId] = useState<number | null>(null); 
  const [openStatusDropdown, setOpenStatusDropdown] = useState<number | null>(null); 
  const [commentInput, setCommentInput] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null); 
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null); 
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const activeEntry = queue.find(q => q._id === activeCommentId);
  const isCommentsOpen = !!activeCommentId && !!activeEntry;

  const initialFormState = { fkEventCode: "", EventName: "", Yr: "", NewEventCategory: "", RecordingName: "", RecordingCode: "", Duration: "", DistributionDriveLink: "", BitRate: "", Dimension: "", Masterquality: "", fkMediaName: "", Filesize: "", FilesizeInBytes: "", NoOfFiles: "1", RecordingRemarks: "", CounterError: "", ReasonError: "", MasterProductTitle: "", fkDistributionLabel: "", ProductionBucket: "", fkDigitalMasterCategory: "", AudioBitrate: "", AudioTotalDuration: "", QcRemarksCheckedOn: "", PreservationStatus: "Preserve", QCSevak: "", QcStatus: "", SubmittedDate: "", PresStatGuidDt: "", InfoOnCassette: "", IsInformal: "", AssociatedDR: "", Teams: "", MLUniqueID: "", Detail: "", AudioWAVDRCode: "", fkGranth: "", Number: "", Topic: "", ContentFrom: "", SatsangStart: "", SatsangEnd: "", fkCity: "", SubDuration: "", Remarks: "", files: [] as any[] };
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(queue)); }, [queue]);
  
  useEffect(() => { if (chatBottomRef.current) chatBottomRef.current.scrollIntoView({ behavior: "smooth" }); }, [activeEntry?.comments, activeCommentId]);

  // Close status dropdown on scroll in table view and when switching views
  useEffect(() => {
    const handleScroll = () => {
        if (openStatusDropdown) setOpenStatusDropdown(null);
    };
    const div = tableContainerRef.current;
    if (div) div.addEventListener('scroll', handleScroll);
    return () => { if (div) div.removeEventListener('scroll', handleScroll); };
  }, [openStatusDropdown]);
  
  // Close open dropdowns when switching views to prevent overlap
  useEffect(() => {
    setOpenStatusDropdown(null);
  }, [isTableView]);

  // Initial Data Fetch & Users
  useEffect(() => {
      const fetchData = async () => {
          try {
              // Fetch Dropdowns
              const ecRes = await fetch(`${cleanBaseUrl}/api/event-code/options`); 
              if (ecRes.ok) setEventCodeOptions(await ecRes.json());
              
              const mlRes = await fetch(`${cleanBaseUrl}/api/ml-unique-id/options`); 
              if (mlRes.ok) setMlIdOptions(await mlRes.json());
          } catch (e) { 
              console.error(e); 
          }
      }; 
      const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('app-token');
            const res = await fetch(`${cleanBaseUrl}/api/users/mention-list`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                }
            });
            if (res.ok) {
                setUserList(await res.json());
            }
        } catch (e) {
            console.error(e);
        }
      };
      fetchData();
      fetchUsers();
  }, []);

  // --- COLUMN RESIZING LOGIC ---
  const handleResizeStart = (e: React.MouseEvent, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startWidth = colWidths[columnId] || 100;

    const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        setColWidths(prev => ({
            ...prev,
            [columnId]: Math.max(50, startWidth + deltaX) // Min width 50px
        }));
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleFileScan = async (e: any) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const toastId = toast.loading(`Scanning ${files.length} file(s)...`);

    try {
        let totalBytes = 0;
        let totalDuration = 0;
        let maxRes = { w: 0, h: 0 };
        const distinctExtensions = new Set<string>(); 

        const mediaFiles = files.filter(f => f.name !== ".DS_Store" && f.size > 0);

        mediaFiles.forEach(f => {
            const parts = f.name.split('.');
            if(parts.length > 1) {
                distinctExtensions.add(parts.pop()!.toLowerCase());
            }
        });
        const fileTypeString = Array.from(distinctExtensions).join(', ');

        const metadataPromises = mediaFiles.map(async (file) => {
            totalBytes += file.size;
            const meta = await getMediaMetadata(file);
            return {
                name: file.name,
                size: file.size,
                type: file.type,
                duration: meta.duration,
                width: meta.width,
                height: meta.height,
                bitrate: meta.bitrate, 
            };
        });

        const filesMetadata = await Promise.all(metadataPromises);

        filesMetadata.forEach(meta => {
            totalDuration += meta.duration;
            if (meta.width > maxRes.w) {
                maxRes = { w: meta.width, h: meta.height };
            }
        });

        let bitrateKbps = filesMetadata.length > 0 ? filesMetadata[0].bitrate : null;
        if (!bitrateKbps) {
            const totalBits = totalBytes * 8;
            bitrateKbps = totalDuration > 0 ? (totalBits / totalDuration) / 1000 : 0;
        }
        const bitrateString = bitrateKbps > 0 ? `${Math.floor(bitrateKbps)} kbps` : "";
        const dimensionStr = maxRes.w > 0 ? `${maxRes.w}x${maxRes.h}` : "";

        let quality = "";
        if (maxRes.h >= 2160) quality = "4K";
        else if (maxRes.h >= 1080) quality = "HD";
        else if (maxRes.h >= 720) quality = "HD Ready";
        else if (maxRes.h > 0) quality = "SD";

        setFormData(prev => ({
            ...prev,
            NoOfFiles: mediaFiles.length.toString(),
            Filesize: formatBytes(totalBytes),
            FilesizeInBytes: totalBytes.toString(), 
            fkMediaName: fileTypeString, 
            Duration: formatDuration(totalDuration), 
            AudioTotalDuration: formatDuration(totalDuration), 
            BitRate: bitrateString,
            AudioBitrate: bitrateString, 
            Dimension: dimensionStr || prev.Dimension,
            Masterquality: quality || prev.Masterquality,
            files: filesMetadata, 
        }));

        toast.success("File(s) scanned and fields populated!", { id: toastId });

    } catch (err) {
        console.error(err);
        toast.error("Error scanning files", { id: toastId });
    }
    
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleChange = async (e: any) => {
    const { name, value } = e.target;
    
     if (name === "fkEventCode") {
        const selectedEvent = eventCodeOptions.find(opt => opt.EventCode === value);
        setFormData(prev => ({
            ...prev,
            fkEventCode: value,
            EventName: selectedEvent?.EventName || "",
            Yr: selectedEvent?.Yr || "",
            NewEventCategory: selectedEvent?.NewEventCategory || ""
        }));
    }
   else if (name === "MLUniqueID") {
    const selectedML = mlIdOptions.find(opt => opt.MLUniqueID === value);
    setFormData(prev => ({
        ...prev,
        MLUniqueID: value,
        Detail: selectedML?.Detail || "",
        fkGranth: selectedML?.fkGranth || "",
        Number: selectedML?.Number || "",
        Topic: selectedML?.Topic || "",
        ContentFrom: selectedML?.ContentFrom || "",
        SatsangStart: selectedML?.SatsangStart || "",
        SatsangEnd: selectedML?.SatsangEnd || "",
        fkCity: selectedML?.fkCity || "",
        SubDuration: selectedML?.SubDuration || "",
        Remarks: selectedML?.Remarks || "",
    }));
}
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectEntry = (item: any) => { setFormData(item); setActiveCommentId(item._id); setEditingId(null); };
  
  const handleEditClick = (item: any, e: any) => { 
      e.stopPropagation(); 
      if (!canEditEntry(item)) {
          if (hasEditAccess) {
              toast.error("Only entries marked 'Needs Revision' can be edited.");
          } else {
              toast.error("You do not have permission to edit.");
          }
          return;
      }
      setFormData(item); 
      setActiveCommentId(item._id); 
      setEditingId(item._id); 
  };
  
  const enableEditing = () => { if(activeCommentId) setEditingId(activeCommentId); };
  const handleStatusClick = (id: number, e: any) => { e.stopPropagation(); if (openStatusDropdown === id) setOpenStatusDropdown(null); else setOpenStatusDropdown(id); };
  const updateStatus = (id: number, newStatus: string, e: any) => { e.stopPropagation(); setQueue(prev => prev.map(item => item._id === id ? { ...item, _status: newStatus } : item)); setOpenStatusDropdown(null); };
  const toggleGroup = (group: string) => { const newSet = new Set(expandedGroups); if (newSet.has(group)) newSet.delete(group); else newSet.add(group); setExpandedGroups(newSet); };
  
  function parseDurationToSeconds(duration: string): number {
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  }

  function isValidDurationFormat(duration: string): boolean {
    return /^(\d{2}):[0-5]\d:[0-5]\d$/.test(duration) || /^[0-5]?\d:[0-5]\d$/.test(duration);
  }

  function validateForm(formData: any) {
    const errors: {[key: string]: string} = {};
    if (!formData.RecordingCode || formData.RecordingCode.length !== 11) {
      errors.RecordingCode = "DR code must be exactly 11 characters.";
    } else if (formData.fkEventCode && formData.RecordingCode.slice(0, 7) !== formData.fkEventCode.slice(0, 7)) {
      errors.RecordingCode = "First 7 characters of DR code must match the Event Code.";
    }
    if (formData.MLUniqueID && formData.fkEventCode && formData.MLUniqueID.slice(0, 7) !== formData.fkEventCode.slice(0, 7)) {
      errors.MLUniqueID = "First 7 characters of ML Unique ID must match the Event Code.";
    }
    if (formData.Duration && !isValidDurationFormat(formData.Duration)) {
      errors.Duration = "Duration must be in hh:mm:ss format.";
    }
    if (formData.Duration && formData.SubDuration) {
      const dur1 = parseDurationToSeconds(formData.Duration);
      const dur2 = parseDurationToSeconds(formData.SubDuration);
      if (Math.abs(dur1 - dur2) > 60) {
        errors.Duration = "Difference between Duration and MLID's SubDuration is more than 60 seconds.";
      }
    }
    if (!formData.fkEventCode) {
      errors.fkEventCode = "Event Code is required.";
    }
    if (!formData.RecordingCode) {
      errors.RecordingCode = "Recording Code is required.";
    }
    return errors;
  }

  // --- SAVE / UPDATE HANDLER ---
  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the errors in the form.");
      return;
    }
    
    // Validations
    if (!formData.RecordingCode || formData.RecordingCode.length !== 11) {
        toast.error("Recording Code (DR code) must be exactly 11 characters.");
        return;
    }
    if (formData.fkEventCode && formData.RecordingCode.slice(0, 7) !== formData.fkEventCode.slice(0, 7)) {
        toast.error("First 7 characters of DR code must match the Event Code.");
        return;
    }
    if (!formData.fkEventCode || !formData.RecordingCode) {
        toast.error("Event Code and Recording Code are required.");
        return;
    }

    if (editingId) {
        // UPDATE EXISTING ENTRY
        const existingItem = queue.find(item => item._id === editingId);
        
        const updatedItem = { 
            ...formData, 
            _id: editingId, 
            comments: existingItem?.comments || [], 
            _status: existingItem?._status || 'incomplete' 
        };

        setQueue(prev => prev.map(item => {
            if (item._id === editingId) {
                return updatedItem;
            }
            return item;
        }));

        try {
            const token = localStorage.getItem('app-token');
            const res = await fetch(`${cleanBaseUrl}/api/google-sheet/digital-recordings`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    ...updatedItem,
                    Logchats: formatLogchats(updatedItem.comments)
                }),
            });

            if (!res.ok) throw new Error("Failed to sync update to Sheet");
            toast.success("Entry Updated in Google Sheet");
        } catch (error) {
            console.error(error);
            toast.error("Updated locally, but failed to sync with Google Sheet");
        }

        setEditingId(null); 
        setFormData(initialFormState); 
        setActiveCommentId(null); 
        
    } else {
        // CREATE NEW ENTRY
        const newItem = { ...formData, _id: Date.now(), comments: [], _status: 'incomplete' };
        try {
            const token = localStorage.getItem('app-token');
            const res = await fetch(`${cleanBaseUrl}/api/google-sheet/digital-recordings`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    ...newItem,
                    Logchats: formatLogchats(newItem.comments)
                }),
            });
            if (!res.ok) throw new Error("Failed to sync");
            toast.success("Added to Google Sheet");
        } catch (error) {
            console.error(error);
            toast.error("Failed to add to Google Sheet");
        }
        setQueue(prev => [newItem, ...prev]);
        toast.success("Added to Queue");
        setFormData(initialFormState);
    }
  };

  const handleResetForm = () => { setIsResetting(true); setFormData(initialFormState); setTimeout(() => setIsResetting(false), 700); };
  const handleCancelSelection = () => { setEditingId(null); setActiveCommentId(null); setFormData(initialFormState); };
  const handleCloseComments = () => { setActiveCommentId(null); };

  // --- USER MENTION CLICK HANDLER ---
  const handleMentionClick = async () => {
    // 1. Toggle visibility
    const isOpening = !showUserDropdown;
    setShowUserDropdown(isOpening);

    // 2. Fetch only if opening
    if (isOpening) {
        try {
            const token = localStorage.getItem('app-token');
            const res = await fetch(`${cleanBaseUrl}/api/users/mention-list`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                }
            });

            if (res.ok) {
                const users = await res.json();
                setUserList(users);
            } else {
                console.error("Failed to fetch users");
                toast.error("Could not load user list");
            }
        } catch (error) {
            console.error("API Error:", error);
        }
    }
  };

  const handleSendComment = async () => {
    if (!commentInput.trim() || !activeCommentId) return;

    setQueue(prev => prev.map(item => {
        if (item._id === activeCommentId) {
            let updatedComments;
            if (editingCommentId) {
                updatedComments = item.comments.map((c: any) => 
                    c.id === editingCommentId 
                        ? { ...c, text: commentInput, isEdited: true } 
                        : c
                );
            } 
            else {
                const newComment = {
                    id: Date.now(),
                    text: commentInput,
                    user: userEmail || "User",
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    replyTo: replyTo ? { user: replyTo.user, text: replyTo.text, id: replyTo.id } : undefined
                };
                updatedComments = [...(item.comments || []), newComment];
            }

            fetch(`${cleanBaseUrl}/api/google-sheet/digital-recordings`, {
                method: "POST", // Chat updates typically use POST logic in your backend to append/update chat column
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...item,
                    Logchats: formatLogchats(updatedComments)
                }),
            });

            return { ...item, comments: updatedComments };
        }
        return item;
    }));
    setCommentInput("");
    setReplyTo(null);
    setEditingCommentId(null);
    setShowUserDropdown(false);
  };

  const handleEditCommentAction = (comment: any) => { setCommentInput(comment.text); setEditingCommentId(comment.id); setReplyTo(null); const inputEl = document.getElementById("chat-input-field"); if(inputEl) inputEl.focus(); };
  
  const handleDeleteComment = (commentId: number) => {
    if (!activeCommentId) return;
    if (!window.confirm("Delete this message?")) return;

    setQueue(prev => prev.map(item => {
        if (item._id === activeCommentId) {
            const updatedComments = item.comments.filter((c: any) => c.id !== commentId);
            fetch(`${cleanBaseUrl}/api/google-sheet/digital-recordings`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...item, Logchats: formatLogchats(updatedComments) }),
            });
            return { ...item, comments: updatedComments };
        }
        return item;
    }));
  };

  const handleCancelChatAction = () => { setReplyTo(null); setEditingCommentId(null); setCommentInput(""); };
  const toggleSelection = (id: number, e: any) => { e.stopPropagation(); const newSet = new Set(selectedIndices); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); setSelectedIndices(newSet); };
  const handleDelete = (id: number, e: any) => { e.stopPropagation(); setQueue(prev => prev.filter(item => item._id !== id)); if (editingId === id || activeCommentId === id) handleCancelSelection(); const newSet = new Set(selectedIndices); newSet.delete(id); setSelectedIndices(newSet); };
  
  const handleUploadSelected = async () => {
    if (selectedIndices.size === 0) return;
    const selectedItems = queue.filter(item => selectedIndices.has(item._id));
    const incompleteItems = selectedItems.filter(item => item._status !== 'complete');
    if (incompleteItems.length > 0) {
        toast.error(`Cannot approve! ${incompleteItems.length} items are not marked 'Complete'.`);
        return;
    }
    setIsSubmitting(true);
    const token = localStorage.getItem('app-token');
    let failedIds: number[] = [];

    for (const item of selectedItems) {
        try {
            const { _id, comments, _status, ...cleanPayload } = item;
            const finalPayload = { 
                ...cleanPayload, 
                LastModifiedBy: userEmail || "System",
                Logchats: formatLogchats(comments || []) 
            };
           await fetch(`${cleanBaseUrl}/api/digitalrecording/approve`, {
                method: "POST", 
                headers: { 
                    "Content-Type": "application/json", 
                    "Authorization": token ? `Bearer ${token}` : '' 
                },
                body: JSON.stringify(finalPayload),
            }).then(async res => { 
                if (!res.ok) {
                    let errMsg = "DB Transaction Failed";
                    try {
                        const err = await res.json();
                        errMsg = err.message || err.error || JSON.stringify(err);
                    } catch (e) {
                        errMsg = await res.text();
                    }
                    throw new Error(errMsg);
                }
            });
        } catch (error: any) {
            console.error("Approval Error:", error);
            failedIds.push(item._id);
            toast.error(
              <>
                <b>Approval Error</b>
                <div style={{whiteSpace: 'pre-wrap'}}>{error.message}</div>
              </>
            );
        }
    }
    setQueue(prev => prev.filter(item => !selectedIndices.has(item._id) || failedIds.includes(item._id)));
    setSelectedIndices(new Set());
    if (activeCommentId && !failedIds.includes(activeCommentId)) setActiveCommentId(null);
    if (failedIds.length === 0) {
        toast.success("Entries Approved & Linked successfully");
    } else {
        toast.warning(`Some entries failed to approve.`);
    }
    setIsSubmitting(false);
  };
  
  const isEditing = !!editingId;
  const isViewing = !!activeCommentId && !isEditing;
  const getGridTemplate = () => { 
      // --- MODIFIED GRID TEMPLATE LOGIC ---
      if (isTableView) {
        // If Comments are open, split roughly 65% Table / 35% Comments. Otherwise Full Table.
        return isCommentsOpen ? "0fr 2.5fr 1.5fr" : "0fr 1fr 0fr"; 
      }
      // List/Card View Logic
      if (isCommentsOpen) { 
          if (windowWidth < 1280) return "1.2fr 1fr 1fr"; 
          if (windowWidth < 1500) return "3fr 1.5fr 2fr"; 
          return "3.5fr 2fr 2fr"; 
      } else { 
          if (windowWidth < 1280) return "1.2fr 0.8fr 0fr"; 
          return "4fr 2fr 0fr"; 
      } 
  };
  
  const renderField = (label: string, name: string, theme: any, options: any = {}) => ( <div style={{ ...styles.inputWrapper, gridColumn: options.full ? "1 / -1" : options.medium ? "span 2" : "auto" }}> <Label style={{...styles.label, color: focusedField === name && !options.disabled ? theme.to : styles.label.color }}> {label} {options.required && <span style={{ color: theme.from, fontSize: "1.2em", lineHeight: 0 }}>*</span>} </Label> <Input name={name} type={options.type || "text"} value={(formData as any)[name]} onChange={handleChange} onFocus={() => setFocusedField(name)} onBlur={() => setFocusedField(null)} disabled={options.disabled} style={{ ...styles.input(theme, options.disabled, isCompact), borderColor: formErrors[name] ? "#ef4444" : (focusedField === name && !options.disabled ? theme.to : "rgba(255,255,255,0.1)") }} autoComplete="off" /> {formErrors[name] && <div style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: 2 }}>{formErrors[name]}</div>} </div> );
  
  const getGroupedQueue = (data: any[], groupBy: string) => { 
      const groups: any = {}; 
      data.forEach(item => { 
          let key = item[groupBy] || 'Uncategorized';
          if (groupBy === '_status') key = item._status || 'incomplete';
          if (!groups[key]) groups[key] = []; 
          groups[key].push(item); 
      }); 
      return groups; 
  };

  const renderQueueItem = (item: any) => { 
    const isSelected = selectedIndices.has(item._id);
    const isActive = activeCommentId === item._id; 
    const isItemEditing = editingId === item._id;
    const currentStatus = item._status || 'incomplete';
    const statusConfig = STATUS_OPTIONS.find(s => s.id === currentStatus) || STATUS_OPTIONS[0];
    
    // Determine visual state for edit button
    const isEditable = canEditEntry(item);

    return (
        <div key={item._id} style={styles.queueItem(isActive, isItemEditing)} onClick={() => handleSelectEntry(item)}>
            <div style={{display: "flex", alignItems: "flex-start", gap: "10px"}}>
                <div onClick={(e) => toggleSelection(item._id, e)} style={{ paddingTop: 2, flexShrink: 0 }}>{isSelected ? <CheckSquare size={18} color="#10b981" /> : <Square size={18} color="rgba(255,255,255,0.3)" />}</div>
                <div style={{flex: 1, minWidth: 0 }}>
                    <div title={item.fkEventCode || "Untitled"} style={{ fontWeight: '600', color: isItemEditing ? '#f59e0b' : isActive ? '#3b82f6' : '#fff', fontSize: '0.9rem', marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.fkEventCode || "Untitled"}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.EventName}</div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>{item.comments?.length > 0 && (<span style={{fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', color: '#cbd5e1', padding: '1px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3}}><MessageSquare size={10} /> {item.comments.length}</span>)}</div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0, marginTop: -2}}>
                   <div style={{position: 'relative'}}>
                       <div onClick={hasEditAccess ? (e) => handleStatusClick(item._id, e) : undefined} style={{ ...styles.statusBadge(currentStatus), cursor: hasEditAccess ? "pointer" : "not-allowed", opacity: hasEditAccess ? 1 : 0.5, whiteSpace: "nowrap" }} title={hasEditAccess ? "Change Status" : "View Only"}>
                        <statusConfig.icon size={12} strokeWidth={3} /> {!isCompact && (currentStatus === 'revision' ? 'Revise' : currentStatus)}
                       </div>
                      {openStatusDropdown === item._id && hasEditAccess && !isTableView && (
                        <div className="hide-scrollbar" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 5, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 5, zIndex: 50, width: '140px', maxHeight: '300px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>{STATUS_OPTIONS.map(opt => (<div key={opt.id} onClick={(e) => updateStatus(item._id, opt.id, e)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px', fontSize: '0.75rem', color: '#fff', cursor: 'pointer', borderRadius: 4, background: currentStatus === opt.id ? 'rgba(255,255,255,0.1)' : 'transparent' }}><opt.icon size={14} color={opt.color} /> {opt.label}</div>))}</div>
                      )}
                    </div>
                    {/* EDIT BUTTON with Conditional Styling and Logic */}
                    <button 
                        onClick={(e) => {
                            if (!isEditable) {
                                e.stopPropagation();
                                if(hasEditAccess) toast.error("Only entries marked 'Needs Revision' can be edited.");
                                else toast.error("You do not have permission to edit.");
                                return;
                            }
                            handleEditClick(item, e);
                        }} 
                        style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            color: isItemEditing ? '#f59e0b' : (isEditable ? '#64748b' : 'rgba(100, 116, 139, 0.3)'), 
                            cursor: isEditable ? 'pointer' : 'not-allowed', 
                            padding: 5 
                        }} 
                        title={isEditable ? "Edit" : "Editing locked (Status must be 'Needs Revision')"} 
                    >
                        <Pencil size={16} />
                    </button>
                    
                    
                </div>
            </div>
        </div>
    );
  };
  
  // --- TABLE VIEW RENDERER ---
  const renderTableView = () => {
    // Group Data Logic
    const groups = getGroupedQueue(queue, groupByField);
    const groupKeys = Object.keys(groups);
    
    // Sort keys if grouping by status to match workflow order
    if (groupByField === '_status') {
         const order = ['incomplete', 'revision', 'inwarding', 'submission_confirmed', 'complete'];
         groupKeys.sort((a,b) => order.indexOf(a) - order.indexOf(b));
    }

    return (
        <div 
            ref={tableContainerRef}
            style={{ height: "100%", width: "100%", overflow: "auto", position: 'relative' }} 
            className="custom-scrollbar" // Changed from hide-scrollbar to custom-scrollbar
        >
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 5px; border: 2px solid #0f172a; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
                .custom-scrollbar::-webkit-scrollbar-corner { background: #0f172a; }
            `}</style>
            
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, tableLayout: 'fixed' }}>
                <thead>
                    <tr>
                         {TABLE_COLUMNS.map((col) => (
                             <th 
                                key={col.id} 
                                style={{
                                    ...styles.tableHeader, 
                                    width: colWidths[col.id], 
                                    minWidth: colWidths[col.id],
                                    maxWidth: colWidths[col.id],
                                    position: 'sticky',
                                    left: col.frozen ? (col.id === 'select' ? 0 : 40) : 'auto',
                                    zIndex: col.frozen ? 20 : 10,
                                    boxShadow: col.frozen && col.id === 'actions' ? '2px 0 5px rgba(0,0,0,0.5)' : 'none'
                                }}
                            >
                                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                                    {col.id === 'select' ? (
                                        <div onClick={() => setSelectedIndices(new Set(queue.map(q => q._id)))} style={{cursor: 'pointer', display: 'flex', justifyContent: 'center', width: '100%'}}>
                                            {selectedIndices.size === queue.length && queue.length > 0 ? <CheckSquare size={16} color="#10b981"/> : <Square size={16} color="#64748b"/>}
                                        </div>
                                    ) : (
                                        <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis'}}>{col.label}</span>
                                    )}
                                    
                                    {/* Column Resizer Grip */}
                                    {col.id !== 'select' && (
                                        <div 
                                            onMouseDown={(e) => handleResizeStart(e, col.id)}
                                            style={{ cursor: 'col-resize', padding: '0 2px', opacity: 0.5, marginLeft: 4 }}
                                            className="hover:opacity-100"
                                        >
                                            <GripVertical size={12} />
                                        </div>
                                    )}
                                </div>
                             </th>
                         ))}
                    </tr>
                </thead>
                <tbody>
                    {groupKeys.map(groupKey => (
                        <React.Fragment key={groupKey}>
                            {/* Group Header Row if grouped */}
                            {groupByField !== 'none' && (
                                <tr>
                                    <td colSpan={TABLE_COLUMNS.length} style={{ background: '#1e293b', padding: '10px 12px', fontSize: '0.75rem', fontWeight: 800, color: '#fff', borderTop: '1px solid rgba(255,255,255,0.1)', position: 'sticky', left: 0 }}>
                                        {groupByField === '_status' ? STATUS_OPTIONS.find(s => s.id === groupKey)?.label || groupKey : groupKey} ({groups[groupKey].length})
                                    </td>
                                </tr>
                            )}
                            
                            {/* Items in group */}
                            {groups[groupKey].map((item: any) => {
                                const isSelected = selectedIndices.has(item._id);
                                const isActive = activeCommentId === item._id;
                                const currentStatus = item._status || 'incomplete';
                                const statusConfig = STATUS_OPTIONS.find(s => s.id === currentStatus) || STATUS_OPTIONS[0];

                                return (
                                    <tr key={item._id} onClick={() => handleSelectEntry(item)} style={styles.tableRow(isActive)}>
                                        {TABLE_COLUMNS.map(col => {
                                            const commonStyle = {
                                                ...styles.tableCell,
                                                width: colWidths[col.id],
                                                minWidth: colWidths[col.id],
                                                maxWidth: colWidths[col.id],
                                                position: col.frozen ? 'sticky' : undefined,
                                                left: col.frozen ? (col.id === 'select' ? 0 : 40) : undefined,
                                                zIndex: col.frozen ? 5 : undefined,
                                                background: col.frozen ? (isActive ? 'rgba(59, 130, 246, 0.2)' : '#0f172a') : undefined, // Maintain background for sticky cols
                                                boxShadow: col.frozen && col.id === 'actions' ? '2px 0 5px rgba(0,0,0,0.5)' : 'none'
                                            } as React.CSSProperties;

                                            if (col.id === 'select') {
                                                return (
                                                    <td key={col.id} style={{...commonStyle, textAlign: 'center'}} onClick={(e) => toggleSelection(item._id, e)}>
                                                        {isSelected ? <CheckSquare size={16} color="#10b981" /> : <Square size={16} color="rgba(255,255,255,0.3)" />}
                                                    </td>
                                                );
                                            }
                                            if (col.id === 'actions') {
                                                return (
                                                    <td key={col.id} style={commonStyle}>
                                                        <div style={{display: 'flex', gap: 6, justifyContent: 'center'}}>
                                                            <button onClick={(e) => { e.stopPropagation(); handleSelectEntry(item); }} title="View Comments" style={{background: 'transparent', border: 'none', cursor: 'pointer', color: item.comments?.length > 0 ? '#3b82f6' : '#64748b'}}>
                                                                <MessageSquare size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                );
                                            }
                                            if (col.id === 'status') {
                                                return (
                                                    <td key={col.id} style={commonStyle}>
                                                        <div 
                                                            onClick={hasEditAccess ? (e) => {
                                                                e.stopPropagation();
                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                setDropdownPos({ top: rect.bottom + 4, left: rect.left });
                                                                setOpenStatusDropdown(openStatusDropdown === item._id ? null : item._id);
                                                            } : undefined} 
                                                            style={{ ...styles.statusBadge(currentStatus), cursor: hasEditAccess ? "pointer" : "not-allowed", opacity: hasEditAccess ? 1 : 0.5, width: 'fit-content' }}
                                                        >
                                                            <statusConfig.icon size={12} strokeWidth={3} /> {statusConfig.label}
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            // Default Text Cell
                                            return (
                                                <td key={col.id} style={{...commonStyle, fontWeight: col.id === 'RecordingCode' ? 600 : 400, color: col.id === 'RecordingCode' ? '#fff' : '#e2e8f0'}} title={item[col.id]}>
                                                    {item[col.id]}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </React.Fragment>
                    ))}
                    {queue.length === 0 && (
                        <tr>
                            <td colSpan={TABLE_COLUMNS.length} style={{ padding: "40px 0", textAlign: "center", color: "rgba(255,255,255,0.2)" }}>
                                <Inbox size={48} style={{ marginBottom: 10, opacity: 0.5 }} />
                                <p>Queue is Empty</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
  };

  // --- PROJECTS HUB VIEW ---
  if (viewMode === 'hub') {
    // CALCULATE PROGRESS FOR AUDIO MERGE
    const totalItems = queue.length;
    const completedItems = queue.filter(i => i._status === 'complete').length;
    const audioMergeProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    const allProjects = [
      { 
        id: 'audio_merge', 
        title: 'Audio Merge Project', 
        description: 'Ingest, process, and approve new Digital Recordings (DRs) with automated metadata scanning.', 
        icon: Wand2, 
        color: colors.primary, 
        stats: { label: 'In Progress', value: queue.length }, 
        progress: audioMergeProgress, // DYNAMIC PROGRESS
        tags: ['Audio', 'Ingest'], 
        
        isVisible: canViewAudioMerge 
      },
      { 
        id: 'video_archival', 
        title: 'Video Archival', 
        description: 'Master archival process for raw video footage, proxy generation, and tagging.', 
        icon: Video, 
        color: colors.secondary, 
        stats: { label: 'Pending Approval', value: 5 }, 
        progress: 30, 
        tags: ['Video', 'Archive'], 
        status: "PENDING_APPROVAL",
        isVisible: true 
      },
      { 
        id: 'ai_transcription', 
        title: 'AI Transcription', 
        description: 'Automated speech-to-text generation review and manual subtitle correction.', 
        icon: FileText, 
        color: colors.success, 
        stats: { label: 'Approved', value: 84 }, 
        progress: 88, 
        tags: ['AI', 'Text'], 
        status: "APPROVED",
        isVisible: true 
      }
    ];

    const visibleProjects = allProjects.filter(p => p.isVisible);

    const tabs = [];
   
    return (
      <div className="px-8 py-10 animate-in fade-in duration-1000" style={{...styles.wrapper, display: 'block', overflowY: 'auto', padding: isMobile ? "20px 10px" : "20px 40px"}}>
        <style>{`
          .glass-card { background: #131b2e; border-radius: 20px; padding: 24px; position: relative; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.05); }
          .animate-in { animation: fadeIn 0.5s ease-out forwards; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>

        {/* --- PILL HEADER NAVIGATION --- */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', width: '100%' }}>
            <div style={{ background: '#131b2e', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '9999px', padding: '4px', display: 'flex', gap: '4px' }}>
              
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                
                {loggedInUser?.picture ? (
                    <div style={{ padding: '2px', border: '1px solid rgba(245, 158, 11, 0.5)', borderRadius: '50%' }}>
                        <Avatar className="w-9 h-9 border-2 border-background cursor-pointer">
                            <AvatarImage src={loggedInUser.picture} alt={loggedInUser.name} />
                            <AvatarFallback>{loggedInUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </div>
                ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                        G
                    </div>
                )}
            </div>
        </div>

        {/* Project Hub Title */}
        <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '-20px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.3)'
                }}>
                    <Layout size={24} color="white" />
                </div>
                <h1 style={{
                    fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: '800',
                    background: 'linear-gradient(to right, #fff, #94a3b8)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    margin: 0, letterSpacing: '-1px'
                }}>
                    Project Hub
                </h1>
            </div>
        </div>

        {/* {canViewAudioMerge && (
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
             <StatWidget label="Total DRs" value={queue.length.toString()} trend={4} />
             <StatWidget
                label="Active Tasks"
                value={queue.filter(item => (item._status || 'incomplete') === 'incomplete').length.toString()}
                trend={-2}
             />
             <StatWidget
                label="Avg. Waiting"
                value={queue.filter(item => (item._status || 'incomplete') === 'revision').length.toString()}
             />
             <StatWidget label="Project Health" value="97.5%" />
           </div>
        )} */}

{showAnalytics && canViewAudioMerge && (
  <div style={{
    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
    background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
  }}>
    <div style={{
      background: "#131b2e", borderRadius: 20, padding: 32, minWidth: isMobile ? "95%" : 600, minHeight: 400,
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)", position: "relative"
    }}>
      <button
  onClick={() => {
    setShowAnalytics(false);
     
  }}
  style={{
    position: "absolute", top: 16, right: 16, background: "transparent",
    border: "none", color: "#fff", fontSize: 22, cursor: "pointer"
  }}
  title="Close"
>
  ×
</button>
     <h2 style={{ color: "#fff", marginBottom: 24, textAlign: "center" }}>Audio Merge Project Analytics</h2>
<div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
  {/*<StatusPieChart queue={queue} /> */}
</div>
    </div>
  </div>
)}

        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', // Auto-fit for responsive cards
            gap: '2rem' 
        }}>
          {visibleProjects.length > 0 ? (
            visibleProjects.map((project) => (
            <div 
              key={project.id}
              onClick={() => { if(project.id === 'audio_merge') setViewMode('form'); else toast.info("Project coming soon"); }}
              style={{ background: '#131b2e', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255, 255, 255, 0.05)', position: 'relative', cursor: 'pointer', minHeight: '320px', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <span style={{ 
                    padding: '0.35rem 0.85rem', 
                    borderRadius: '0.5rem', 
                    fontSize: '0.65rem', 
                    fontWeight: 800, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em', 
                    
                  
                    color: project.status === 'APPROVED' ? '#34d399' : project.status === 'PENDING_APPROVAL' ? '#fbbf24' : '#94a3b8' 
                }}>
                    
                </span>
                <ArrowRight size={20} color="#64748b" />
              </div>

              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '0.75rem', lineHeight: 1.1 }}>{project.title}</h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: 'auto', fontWeight: 500 }}>{project.description}</p>
              
              <div style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '0.75rem' }}>
                    <span>Completion Status</span>
                    <span style={{ color: 'white' }}>{project.progress}%</span>
                </div>
                <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '9999px', height: '0.35rem', overflow: 'hidden' }}>
                    <div style={{ 
                        width: `${project.progress}%`, 
                        height: '100%', 
                        background: '#f59e0b',
                    }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                 <div style={{ display: 'flex' }}>
                    {project.id === 'audio_merge' ? (
                        <>
                            {userList.slice(0, 3).map((u, i) => (
                                <div key={i} title={u.name} style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid #131b2e', backgroundColor: '#334155', marginLeft: i === 0 ? 0 : '-0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'white', fontWeight: 700 }}>
                                    {getInitials(u.name)}
                                </div>
                            ))}
                            {userList.length > 3 && (
                                <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid #131b2e', backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: '-0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8' }}>+{userList.length - 3}</div>
                            )}
                        </>
                    ) : (
                        // Static Demo Users for other cards
                        <>
                            {[1, 2].map(id => (
                                <div key={id} style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid #131b2e', backgroundColor: '#334155', marginLeft: id === 1 ? 0 : '-0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'white', fontWeight: 700 }}>
                                    {id === 1 ? 'JD' : 'AS'}
                                </div>
                            ))}
                            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid #131b2e', backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: '-0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8' }}>+3</div>
                        </>
                    )}
                 </div>
                 <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>{project.stats.value} Items</span>
              </div>
            </div>
          ))
          ) : (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "#64748b", padding: "40px" }}>
              You do not have access to any projects. Please contact an Administrator.
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- FORM VIEW (INGEST TOOL) ---
  if (!canViewAudioMerge) {
      return (
          <div style={{ ...styles.wrapper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                  <Lock size={64} style={{ margin: '0 auto 20px', opacity: 0.5 }} />
                  <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '10px' }}>Access Denied</h2>
                  <p>You do not have permission to access the Audio Merge Project form.</p>
                  <button 
                    onClick={() => setViewMode('hub')}
                    style={{ marginTop: '20px', padding: '10px 20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}
                  >
                    Return to Hub
                  </button>
              </div>
          </div>
      );
  }

  const isCurrentEntryEditable = activeEntry ? canEditEntry(activeEntry) : false;

  return (
    <div style={styles.wrapper}>
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
      
      <div style={styles.header(isCompact)}>
        <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}>
            <button onClick={() => setViewMode('hub')} style={{ background: 'transparent', border: `1px solid rgba(255,255,255,0.2)`, borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color='white'}} onMouseLeave={(e) => {e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color='#94a3b8'}}>
                <ArrowLeft size={20} />
            </button>
        </div>

        <div style={{ textAlign: 'center' }}>
           
            <h1 style={styles.title(isCompact)}>Audio Merge Project</h1>
        </div>
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileScan} style={{ display: "none" }} multiple />

      <div style={{ ...styles.mainContainer, gridTemplateColumns: getGridTemplate(), gap: isCompact ? "12px" : "20px" }}>
        
        {/* COLUMN 1: FORM ENTRY - Hidden in Table View for better space */}
        {!isTableView && (
            <div style={{...styles.columnScroll, display: isMobile && isCommentsOpen ? 'none' : 'block' }} className="hide-scrollbar">
                <div style={styles.unifiedCard(isCompact)}>
                    
                    {isEditing && <div style={{marginBottom: 15, padding: "8px 12px", background: "rgba(245, 158, 11, 0.1)", border: "1px solid #f59e0b", borderRadius: 8, color: "#f59e0b", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8}}><Pencil size={14}/> Editing Mode - Changes will update the entry</div>}
                    {isViewing && <div style={{marginBottom: 15, padding: "8px 12px", background: "rgba(59, 130, 246, 0.1)", border: "1px solid #3b82f6", borderRadius: 8, color: "#3b82f6", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8}}><Eye size={14}/> View Mode - Read Only</div>}

                    <div style={styles.sectionBlock}>
                        <SectionTitle icon={Database} title="Core Identity" theme={colors.core} />
                        <div style={styles.gridFields}>
                    
    <SearchableSelect label="Event Code" name="fkEventCode" options={eventCodeOptions.map(opt => opt.EventCode)} value={formData.fkEventCode} onChange={handleChange} theme={colors.core} required={true} disabled={!hasEditAccess || isViewing} isCompact={isCompact} medium={true} />
    {renderField("Event Name", "EventName", colors.core, { full: true,required: true, disabled: !hasEditAccess || isViewing  })}
    {renderField("Year", "Yr", colors.core, { required: true, disabled: !hasEditAccess || isViewing  })}
    {renderField("Event Category", "NewEventCategory", colors.core, {medium: true,required: true, disabled: !hasEditAccess || isViewing  })}
    {renderField("Recording Code", "RecordingCode", colors.core, { required: true, disabled: !hasEditAccess || isViewing })}
    {renderField("Recording Name", "RecordingName", colors.core, { required: true, full: true, disabled: !hasEditAccess || isViewing })}

                        </div>
                    </div>
                    <div style={styles.sectionBlock}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <SectionTitle icon={FileAudio} title="Technical Specs" theme={colors.tech} />
                            
                            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!hasEditAccess || isViewing} style={{ background: "rgba(6, 182, 212, 0.15)", color: "#22d3ee", border: "1px solid rgba(6, 182, 212, 0.3)", borderRadius: "6px", padding: "4px 10px", fontSize: "0.75rem", fontWeight: 600, cursor: hasEditAccess && !isViewing ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px", opacity: hasEditAccess && !isViewing ? 1 : 0.5 }}>
                                <FileSearch size={14} /> Scan File(s)
                            </button>
                        </div>

                        <div style={styles.gridFields}>
                        {renderField("Duration", "Duration", colors.tech, { disabled: !hasEditAccess || isViewing })}
                        {renderField("File Size", "Filesize", colors.tech, { disabled: !hasEditAccess || isViewing })}
                        {renderField("FilesizeInBytes", "FilesizeInBytes", colors.tech, { disabled: !hasEditAccess || isViewing })}
                        {renderField("Media Type", "fkMediaName", colors.tech, { disabled: !hasEditAccess || isViewing })}
                        {renderField("Bit Rate", "BitRate", colors.tech, { disabled: !hasEditAccess || isViewing })}
                        {renderField("No. Of Files", "NoOfFiles", colors.tech, { type: "number", disabled: !hasEditAccess || isViewing })}
                        {renderField("Audio Bitrate", "AudioBitrate", colors.tech, { disabled: !hasEditAccess || isViewing })}
                        </div>
                    </div>
                    <div style={styles.sectionBlock}>
                        <SectionTitle icon={Layers} title="Classification" theme={colors.class} />
                        <div style={styles.gridFields}>
                        <SearchableSelect label="Master Quality" name="Masterquality" options={MASTER_QUALITY_OPTIONS} value={formData.Masterquality} onChange={handleChange} theme={colors.class} disabled={!hasEditAccess || isViewing} isCompact={isCompact} medium={true} />
                        </div>
                    </div>
                    <div style={{...styles.sectionBlock, marginBottom: 0}}>
                        <SectionTitle icon={CheckCircle} title="QC Log" theme={colors.qc} />
                        <div style={styles.gridFields}>
                        <SearchableSelect label="PreservationStatus" name="PreservationStatus" options={PRESERVATION_STATUS_OPTIONS} value={formData.PreservationStatus} onChange={handleChange} theme={colors.qc} required disabled={!hasEditAccess || isViewing} isCompact={isCompact} medium={true} />
                        {renderField("DMS Remarks", "RecordingRemarks", colors.qc, { full: true, disabled: !hasEditAccess || isViewing })}
                        </div>
                    </div>
                    <div style={{...styles.sectionBlock, marginBottom: 0}}><br/>
                        <SectionTitle icon={FileAudio} title="Unique Identifiers" theme={colors.tech} />
                        <div style={styles.gridFields}>
                            <SearchableSelect label="ML Unique ID" name="MLUniqueID" options={mlIdOptions.map(opt => opt.MLUniqueID)} value={formData.MLUniqueID} onChange={handleChange} theme={colors.core} disabled={!hasEditAccess || isViewing} isCompact={isCompact} medium={true} />
                            {renderField("Audio WAV Code", "AudioWAVDRCode", colors.core, { disabled: !hasEditAccess || isViewing })}
                            {renderField("Audio MP3 Code", "AudioMP3DRCode", colors.core, { disabled: !hasEditAccess || isViewing })}
                            {renderField("Granth", "fkGranth", colors.core, {medium: true, disabled: !hasEditAccess || isViewing })}
                            {renderField("Patrank", "Number", colors.core, {  disabled: !hasEditAccess || isViewing })}
                                {renderField("Topic", "Topic", colors.core, { full: true, disabled: !hasEditAccess || isViewing })}
                                {renderField("Date From", "ContentFrom", colors.core, { disabled: !hasEditAccess || isViewing })}
                                {renderField("SatsangStart", "SatsangStart", colors.core, { full: true,disabled: !hasEditAccess || isViewing })}
                                {renderField("SatsangEnd", "SatsangEnd", colors.core, {full: true, disabled: !hasEditAccess || isViewing })}
                                    {renderField("fkCity", "fkCity", colors.core, { disabled: !hasEditAccess || isViewing })}
                                    {renderField("SubDuration", "SubDuration", colors.core, { disabled: !hasEditAccess || isViewing })}
                            {renderField("Detail", "Detail", colors.core, {full: true, disabled: !hasEditAccess || isViewing })}
                            {renderField("Remarks", "Remarks", colors.core, {full: true, disabled: !hasEditAccess || isViewing })}
                        </div>
                    </div>
                    
                    <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
                        {(isEditing || isViewing) && ( <button type="button" onClick={handleCancelSelection} style={styles.cancelBtn}> {isEditing ? "Cancel Edit" : "Close"} </button> )}
                        {!isEditing && !isViewing && ( <button type="button" onClick={handleResetForm} title="Reset Form" style={styles.resetBtn} disabled={isResetting}> <RotateCcw size={16} className={isResetting ? "animate-spin" : ""} /> </button> )}
                        {isViewing ? ( 
                            <button 
                                type="button" 
                                onClick={enableEditing} 
                                disabled={!isCurrentEntryEditable}
                                title={!isCurrentEntryEditable ? "Only entries marked 'Needs Revision' can be edited." : ""}
                                style={{ ...styles.addBtn(false, true), opacity: isCurrentEntryEditable ? 1 : 0.5, cursor: isCurrentEntryEditable ? 'pointer' : 'not-allowed' }}
                            > 
                                <Pencil size={18} style={{marginRight:6}}/> Edit This Entry 
                            </button> 
                        ) : ( 
                            <button type="button" onClick={handleSaveDraft} style={styles.addBtn(isEditing, false)} disabled={!hasEditAccess} title={!hasEditAccess ? "Only users with edit access can add or update" : ""}> {isEditing ? (<> <Save size={18} /> Update Entry </>) : (<> <Plus size={18} /> Add to Queue </>)} </button> 
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* COLUMN 2: PENDING QUEUE (Swaps between Card View and Table View) */}
        <div style={{ ...styles.columnScroll, height: "100%", overflowY: "auto", gridColumn: isTableView ? (isCommentsOpen ? "1 / span 2" : "1 / -1") : "auto", display: isMobile && isCommentsOpen ? 'none' : 'block' }} className="hide-scrollbar">
            <div style={{ ...styles.queueCard(isCompact), height: "100%", overflowY: "hidden", paddingRight: "8px", display: "flex", flexDirection: "column" }}>
                
                {/* Header with Tabs and Group By */}
                <div style={{...styles.queueHeader, marginBottom: 10, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 10 : 15}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 15}}>
                        <div style={{ display: 'flex', background: 'rgba(30, 41, 59, 0.5)', borderRadius: 8, padding: 2 }}>
                            <button 
                                onClick={() => setIsTableView(false)}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, border: 'none', background: !isTableView ? 'rgba(59, 130, 246, 0.2)' : 'transparent', color: !isTableView ? '#fff' : '#94a3b8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                                <LayoutList size={14} /> List
                            </button>
                            <button 
                                onClick={() => setIsTableView(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, border: 'none', background: isTableView ? 'rgba(59, 130, 246, 0.2)' : 'transparent', color: isTableView ? '#fff' : '#94a3b8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                                <TableProperties size={14} /> Table
                            </button>
                        </div>
                        <span style={{fontSize: '0.9rem', fontWeight: 700}}>Queue ({queue.length})</span>
                    </div>

                    <div style={{display:'flex', alignItems: 'center', gap: 15, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-start'}}>
                         {/* Group By Dropdown for Table View */}
                         {isTableView && queue.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Group by:</span>
                                <div style={{ position: 'relative' }}>
                                   <select
  value={groupByField}
  onChange={(e) => setGroupByField(e.target.value)}
  style={{
    background: '#202d4b',           // navy blue
    border: '2px solid #474f5c',
    color: '#ffffff',
    fontSize: '0.75rem',
    padding: '6px 10px',  
    borderRadius: 6,
    outline: 'none',
    cursor: 'pointer',
    
  }}
>

                                        <option value="none">None</option>
                                        <option value="_status">Status</option>
                                        <option value="fkEventCode">Event Code</option>
                                        <option value="EventName">Event Name</option>
                                        <option value="Yr">Year</option>
                                        <option value="NewEventCategory">Event Category</option>
                                        <option value="RecordingName">Recording Name</option>
                                        <option value="fkMediaName">Media Type</option>
                                        <option value="Masterquality">Quality</option>
                                        <option value="MLUniqueID">MLUniqueID</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {queue.length > 0 && !isTableView && (<span onClick={() => setIsGrouped(!isGrouped)} style={{ fontSize: '0.75rem', color: isGrouped ? '#3b82f6' : '#667fa3', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: isGrouped ? 600 : 400 }}><ListFilter size={14} /> Group by Status</span>)}
                        {queue.length > 0 && !isTableView && (<span style={{fontSize: '0.8rem', color: '#94a3b8', cursor: 'pointer'}} onClick={() => setSelectedIndices(new Set(queue.map(q => q._id)))}>Select All</span>)}
                    </div>
                </div>

                {/* Content Area */}
                {queue.length === 0 ? (
                    <div style={{ padding: "40px 0", textAlign: "center", color: "rgba(255,255,255,0.2)" }}><Inbox size={48} style={{ marginBottom: 10, opacity: 0.5 }} /><p>Empty</p></div>
                ) : (
                    isTableView ? (
                        // --- TABLE VIEW COMPONENT ---
                        renderTableView()
                    ) : (
                        // --- CARD VIEW COMPONENT ---
                        <div style={{ overflowY: 'auto', flex: 1 }} className="hide-scrollbar">
                            {isGrouped ? (
                                <div>
                                    {(() => {
                                        // Use the helper to group by status specifically for List view
                                        const groups = getGroupedQueue(queue, '_status');
                                        const renderGroup = (statusId: string, label: string) => {
                                            const groupItems = groups[statusId];
                                            if(!groupItems || groupItems.length === 0) return null;
                                            const isExpanded = expandedGroups.has(statusId);
                                            return (
                                                <div key={statusId}>
                                                    <div onClick={() => toggleGroup(statusId)} style={styles.groupTitle(statusId, isExpanded)}>{isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />} {label} ({groupItems.length})</div>
                                                    {isExpanded && groupItems.map(renderQueueItem)}
                                                </div>
                                            )
                                        };
                                        return ( <>{renderGroup('incomplete', 'Submitted to MM')} {renderGroup('revision', 'Needs Revision')} {renderGroup('inwarding', 'Inwarding')} {renderGroup('submission_confirmed', 'Submission Confirmed')} {renderGroup('complete', 'Complete')}</> );
                                    })()}
                                </div>
                            ) : ( queue.map(renderQueueItem) )}
                        </div>
                    )
                )}
            </div>
        </div>

        {/* COLUMN 3: COMMUNICATION / DETAILS */}
        {isCommentsOpen ? (
            <div style={{...styles.commentCard, gridColumn: isMobile ? '1' : isTablet ? '2' : 'auto', zIndex: 50}}>
                <div style={styles.chatHeader}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                        <div><h4 style={{margin: 0, color: '#fff', fontSize: '0.95rem', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{activeEntry.EventName}</h4><span style={{fontSize: '0.75rem', color: '#3b82f6'}}>{activeEntry.fkEventCode}</span></div>
                        <button onClick={handleCloseComments} style={{background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer'}}><X size={18} /></button>
                    </div>
                    <div style={{marginTop: 15, padding: 10, background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontSize: '0.75rem', color: '#cbd5e1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8}}>
                            <div><span style={{color:'#64748b'}}>DRCode:</span> {activeEntry.RecordingCode}</div> 
                            <div><span style={{color:'#64748b'}}>EventCategory:</span> {activeEntry.NewEventCategory}</div> 
                            <div><span style={{color:'#64748b'}}>NoOfFiles:</span> {activeEntry.NoOfFiles}</div> 
                            <div><span style={{color:'#64748b'}}>MLUniqueID:</span> {activeEntry.MLUniqueID || "Pending"}</div>
                    </div>
                </div>
                <div style={styles.chatBody} className="hide-scrollbar">
                    <div style={styles.msgBubble(true)}>{isEditing ? "Editing entry..." : "Viewing entry details."}</div>
                    {activeEntry.comments && activeEntry.comments.map((msg: any) => {
                        const isCurrentUser = msg.user === userEmail; const isBeingEdited = editingCommentId === msg.id;
                        return (
                            <div key={msg.id} style={{ ...styles.msgBubble(false), alignSelf: isCurrentUser ? "flex-end" : "flex-start", background: isBeingEdited ? "rgba(245, 158, 11, 0.2)" : isCurrentUser ? "linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%)" : "rgba(59, 130, 246, 0.15)", color: isCurrentUser ? "#fff" : "#e2e8f0", borderTopRightRadius: isCurrentUser ? "2px" : "12px", borderTopLeftRadius: isCurrentUser ? "12px" : "2px", maxWidth: "90%", marginLeft: isCurrentUser ? "auto" : undefined, marginRight: isCurrentUser ? 0 : undefined, position: 'relative', border: isBeingEdited ? "1px solid #f59e0b" : "none" }}>
                                <div style={{ fontSize: '0.7rem', color: isCurrentUser ? "#dbeafe" : "#94a3b8", marginBottom: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}><span style={{ color: isCurrentUser ? "#fff" : "#3b82f6", fontWeight: 600 }}>{msg.user}</span><span>{msg.timestamp}</span></div>
                                {msg.replyTo && (<div style={{ margin: "4px 0 8px 0", padding: "6px 10px", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: "6px", borderLeft: `3px solid ${isCurrentUser ? '#fff' : '#3b82f6'}`, fontSize: "0.75rem", display: 'flex', flexDirection: 'column' }}><span style={{fontWeight: 600, fontSize: '0.65rem', marginBottom: 2, opacity: 0.8}}>{msg.replyTo.user}</span><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.9 }}>{msg.replyTo.text}</span></div>)}
                                <div style={{ wordBreak: "break-word" }}>{msg.text} {msg.isEdited && <span style={{fontSize: '0.6rem', opacity: 0.7, fontStyle: 'italic'}}>(edited)</span>}</div>
                                <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.1)", display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                    <button onClick={() => setReplyTo(msg)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.8 }} title="Reply"><CornerUpLeft size={12} color={isCurrentUser ? "#fff" : "#cbd5e1"} /></button>
                                    {isCurrentUser && (<><button onClick={() => handleEditCommentAction(msg)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.8 }} title="Edit"><Pencil size={12} color="#fff" /></button><button onClick={() => handleDeleteComment(msg.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.8 }} title="Delete"><Trash2 size={12} color="#fca5a5" /></button></>)}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={chatBottomRef} />
                </div>
                <div style={styles.chatFooter}>
                    
                    {/* RESPONSIVE USER DROPDOWN */}
                    {showUserDropdown && ( 
                        <div style={{ 
                            position: "absolute", 
                            bottom: "100%", // Pushes it upwards
                            left: 10,       // Aligns left near the @ button
                            marginBottom: 10, 
                            background: "#1e293b", 
                            border: "1px solid #3b82f6", 
                            borderRadius: 12, 
                            zIndex: 100, 
                            padding: "8px 0", 
                            boxShadow: "0 -4px 20px rgba(0,0,0,0.5)", 
                            width: "280px", // WIDER FIXED WIDTH
                            maxWidth: "90vw", // Responsive constraint
                            maxHeight: "250px", 
                            overflowY: "auto",
                            display: "flex",
                            flexDirection: "column"
                        }} className="hide-scrollbar"> 
                            <div style={{padding: "4px 12px", fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, position: 'sticky', top: 0, background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                                Select User
                            </div> 
                            {userList.length > 0 ? ( 
                                userList.map((u, idx) => ( 
                                    <div key={idx} 
                                        style={{ padding: "8px 12px", cursor: "pointer", color: "#fff", fontSize: "0.85rem", borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 2 }} 
                                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)"} 
                                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"} 
                                        onClick={() => { setCommentInput(commentInput + `@${u.name} `); setShowUserDropdown(false); }}
                                    > 
                                        <div style={{fontWeight: 600}}>{u.name}</div> 
                                        <div style={{fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={u.email}>{u.email}</div> 
                                    </div> 
                                )) 
                            ) : ( 
                                <div style={{padding: "12px", color: "#94a3b8", fontSize: "0.8rem", textAlign: "center"}}>Loading users...</div> 
                            )} 
                        </div> 
                    )}

                    <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                         {(replyTo || editingCommentId) && ( <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: "4px 10px", marginBottom: 6, borderRadius: 6, background: editingCommentId ? "rgba(245, 158, 11, 0.15)" : "rgba(59, 130, 246, 0.15)", borderLeft: `3px solid ${editingCommentId ? "#f59e0b" : "#3b82f6"}`, fontSize: "0.75rem", color: "#fff" }}> <span> {editingCommentId ? ( <><b>Editing</b> your message...</> ) : ( <>Replying to: <b>{replyTo.user}</b></> )} </span> <button onClick={handleCancelChatAction} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#cbd5e1" }}> <X size={14} /> </button> </div> )}
                        <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                            <button type="button" style={{ background: "transparent", border: "none", color: "#3b82f6", cursor: "pointer" }} onClick={handleMentionClick} title="Mention user"><AtSign size={18} /></button>
                            <input id="chat-input-field" style={{ ...styles.input(colors.core, false, isCompact), flex: 1, borderRadius: 20 }} placeholder={editingCommentId ? "Update your message..." : "Write a comment..."} value={commentInput} onChange={(e) => setCommentInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendComment()} autoComplete="off" />
                            <button onClick={handleSendComment} style={{ background: editingCommentId ? "#f59e0b" : "#3b82f6", border: 'none', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'all 0.2s' }}> {editingCommentId ? <CheckCircle size={16} /> : <Send size={16} />} </button>
                        </div>
                    </div>
                </div>
            </div>
        ) : ( <div style={{display: 'none'}}></div> )}
      </div>

      {queue.length > 0 && (
        <div style={styles.actionBar}>
            <span style={{ color: "#fff", fontSize: "0.9rem", fontWeight: 600 }}>{selectedIndices.size} Selected</span>
            <button type="button" onClick={handleUploadSelected} disabled={isSubmitting || selectedIndices.size === 0 || !canApprove} style={{ background: `linear-gradient(to right, #10b981, #059669)`, border: "none", borderRadius: "100px", padding: "0 30px", height: "44px", fontSize: "0.9rem", fontWeight: "600", color: "white", display: "flex", alignItems: "center", gap: "8px", cursor: selectedIndices.size === 0 || !canApprove ? 'not-allowed' : 'pointer', opacity: selectedIndices.size === 0 || !canApprove ? 0.5 : 1, boxShadow: "0 0 20px rgba(16, 185, 129, 0.4)", }} title={!canApprove ? "Only users with edit access can approve" : ""}>
                {isSubmitting ? ( <> <Activity className="animate-spin" size={18} /> Processing... </> ) : ( <> <UploadCloud size={18} /> Approve Selected </> )}
            </button>
        </div>
      )}

      {/* Global Status Dropdown Renderer (Moved outside table to fix positioning issues) */}
      {openStatusDropdown && isTableView && (() => {
        const item = queue.find(q => q._id === openStatusDropdown);
        if (!item) return null;
        const currentStatus = item._status || 'incomplete';
        return (
            <div 
                className="hide-scrollbar" 
                style={{ 
                    position: 'fixed', 
                    top: dropdownPos.top, 
                    left: dropdownPos.left, 
                    background: '#1e293b', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: 8, 
                    padding: 5, 
                    zIndex: 9999, 
                    width: '180px', 
                    maxHeight: '300px', 
                    overflowY: 'auto', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.8)' 
                }}
            >
                {STATUS_OPTIONS.map(opt => (
                    <div key={opt.id} onClick={(e) => updateStatus(item._id, opt.id, e)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px', fontSize: '0.75rem', color: '#fff', cursor: 'pointer', borderRadius: 4, background: currentStatus === opt.id ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
                        <opt.icon size={14} color={opt.color} /> {opt.label}
                    </div>
                ))}
            </div>
        );
      })()}
    </div>
  );
}

// Helper Widget for Hub View
const StatWidget = ({ label, value, trend }: { label: string, value: string, trend?: number }) => (
  <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.05)', position: 'relative', overflow: 'hidden' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
      <h4 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>{label}</h4>
      {trend !== undefined && (
        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.125rem 0.5rem', borderRadius: '9999px', backgroundColor: trend > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', color: trend > 0 ? '#34d399' : '#fb7185' }}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '1.875rem', fontWeight: 700, color: 'white' }}>{value}</span>
      <div style={{ width: '4rem', height: '2rem', overflow: 'hidden', opacity: 0.3 }}>
        <svg viewBox="0 0 100 40" style={{ width: '100%', height: '100%' }}>
           <path d="M0,40 Q25,10 50,30 T100,20" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#f59e0b' }} />
        </svg>
      </div>
    </div>
  </div>
);