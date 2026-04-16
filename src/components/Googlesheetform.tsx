

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { 
  Save, FileAudio, Database, Activity, CheckCircle, 
  Sparkles, Layers, Plus, ListChecks, Trash2, UploadCloud, 
  CheckSquare, Square, Inbox, Pencil, X, MessageSquare, Send, Eye, RotateCcw,
  AlertCircle, XCircle, ChevronDown, ChevronRight, CheckCircle2, ListFilter, Loader2,
  AtSign, CornerUpLeft, FileSearch, Lock, RefreshCw, Download,
  // Hub Icons
  Layout, Wand2, Video, FileText, ArrowRight, ArrowLeft,
  // New Icons for Table View
  TableProperties, LayoutList, Grip, GripVertical,ArrowUpDown,ArrowDown, ArrowUp, Filter, Group, Ungroup,
  // Submitters ML Icons
  Users, Search, SearchCheck, ListTree, Link as LinkIcon,
  ChevronsRight,
  ChevronsLeft, AlertTriangle
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import * as mm from 'music-metadata-browser';

// --- IMPORT THE NEW COMPONENTS HERE ---
import { VideoArchivalProject } from "./VideoArchivalProject"; 
import { CheckMLReference } from "./CheckMLReference";
import { SearchNewMLEventCode } from "./SearchNewMLEventCode";
import { SearchDetailsByMLID } from "./SearchDetailsByMLID";
import { MLSummaryByEventCode } from "./MLSummaryByEventCode";
import { SearchNewMediaExtensively } from "./SearchNewMediaExtensively";
import { ProjectHubWorkflow } from "./ProjectHubWorkflow";
import { AdvancedFiltersClickUp } from "./AdvancedFiltersClickUp";
import { FilterConfig, FilterGroup } from "./types"; // Assuming types are in ./types.ts

const API_BASE_URL = (import.meta as any).env.VITE_API_URL;
const cleanBaseUrl = API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');

const STORAGE_KEY = "mis_queue_data_v1";
const PRESERVATION_STATUS_OPTIONS = ["Preserve"];
const MASTER_QUALITY_OPTIONS = ["Audio - High Res", "Audio - Low Res"];

const STATUS_OPTIONS = [
  { id: "incomplete", label: "Submitted to MM", icon: AlertCircle, color: "#f87171" },
  { id: "revision", label: "Needs Revision", icon: RotateCcw, color: "#60a5fa" },
  { id: "inwarding", label: "Inwarding", icon: Loader2, color: "#f59e42" },
  { id: "submission_confirmed", label: "Submission Confirmed", icon: CheckCircle2, color: "#24fbf0" },
  { id: "complete", label: "Complete", icon: CheckCircle, color: "#34d399" }
];

const TABLE_COLUMNS = [
  { id: 'select', label: '', width: 40, frozen: true },
  { id: 'actions', label: 'Actions', width: 70, frozen: true },
  { id: 'status', label: 'Status', width: 160 },
  { id: 'RecordingCode', label: 'Audio DRCode', width: 130 },
  { id: 'fkEventCode', label: 'Event Code', width: 100 },
  { id: 'EventName', label: 'Event Name', width: 250 },
  { id: 'Yr', label: 'Year', width: 60 },
  { id: 'NewEventCategory', label: 'Event Category', width: 140 },
  { id: 'RecordingName', label: 'Audio Recording Name', width: 250 },
  { id: 'Detail', label: 'Detail', width: 200 },
  { id: 'Duration', label: 'Duration', width: 80 },
  { id: 'Filesize', label: 'File Size', width: 90 },
  { id: 'FilesizeInBytes', label: 'Bytes', width: 100 },
  { id: 'fkMediaName', label: 'Media Type', width: 100 },

  { id: 'NoOfFiles', label: 'No. Files', width: 80 },
  { id: 'AudioBitrate', label: 'Audio Bitrate', width: 100 },
  { id: 'Masterquality', label: 'Master Quality', width: 120 },
  { id: 'PreservationStatus', label: 'Preservation', width: 120 },
  { id: 'RecordingRemarks', label: 'DMS Remarks', width: 200 },
  { id: 'MLUniqueID', label: 'ML Unique ID', width: 130 },
  
  { id: 'fkGranth', label: 'Granth', width: 120 },
  { id: 'Number', label: 'Number', width: 80 },
  { id: 'Topic', label: 'Topic', width: 200 },
  { id: 'ContentFrom', label: 'Date From', width: 100 },
  { id: 'SatsangStart', label: 'Satsang Start', width: 80 },
  { id: 'SatsangEnd', label: 'Satsang End', width: 80 },
  { id: 'fkCity', label: 'City', width: 120 },
  { id: 'SubDuration', label: 'Sub Duration', width: 100 },
  
  { id: 'Remarks', label: 'Remarks', width: 200 },
];

const BATCH_TABLE_COLUMNS = [
  { id: 'MLUniqueID', label: 'ML Unique ID', width: 130, sticky: true, left: 40 },
  { id: 'Detail', label: 'Detail', width: 250 },
  { id: 'SubDetail', label: 'Sub Detail', width: 120 },
  { id: 'SubDuration', label: 'Sub Duration', width: 100 },
  { id: 'fkGranth', label: 'Granth', width: 120 },
  { id: 'Number', label: 'Patrank', width: 100 },
  { id: 'Topic', label: 'Topic', width: 180 },
  { id: 'SatsangStart', label: 'Satsang Start', width: 100 },
  { id: 'SatsangEnd', label: 'Satsang End', width: 100 },
  { id: 'Segment Category', label: 'Segment Category', width: 140 },
  { id: 'ContentFrom', label: 'Date From', width: 100 },
  { id: 'ContentTo', label: 'Date To', width: 100 },
  { id: 'FootageType', label: 'Footage Type', width: 120 },
  { id: 'EditingStatus', label: 'Editing Status', width: 130 },
  { id: 'Remarks', label: 'Remarks', width: 200 },
  { id: 'CounterFrom', label: 'Counter From', width: 120 },
  { id: 'CounterTo', label: 'Counter To', width: 120 },
  { id: 'FootageSrNo', label: 'Footage Sr No', width: 120 },
  { id: 'LogSerialNo', label: 'Log Serial No', width: 120 }, 
  
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

const formatLogchats = (comments: any[] = []) =>
  comments.map(c => `[LOGS]: [${c.user}]: ${c.text}`).join('\n');

const parseLogchats = (logString: string) => {
    if (!logString) return [];
    try {
        return logString.split('\n').map((line, index) => {
            const match = line.match(/\[LOGS\]: \[(.*?)\]: (.*)/);
            if (match) {
                return {
                    id: Date.now() + index, 
                    user: match[1],
                    text: match[2],
                    timestamp: "",
                    isEdited: false
                };
            }
            return null;
        }).filter(Boolean);
    } catch (e) {
        return [];
    }
};

const mapSheetRowToQueueItem = (row: any) => {
    const statusID = (row['StatusID'] || row['statusid'] || '').toLowerCase().trim();
    
    // 2. FALLBACK: Check the human-readable QC Status column
    let status = statusID;
    if (!status) {
        const qcStatus = (row['QC Status'] || row['QcStatus'] || '').toLowerCase();
        if(qcStatus.includes('complete')) status = 'complete';
        else if(qcStatus.includes('revision')) status = 'revision';
        else if(qcStatus.includes('inwarding')) status = 'inwarding';
        else if(qcStatus.includes('confirmed')) status = 'submission_confirmed';
        else status = 'incomplete';
    }

    const getVal = (keys: string[]) => {
        for (const k of keys) {
            if (row[k] !== undefined && row[k] !== null) return row[k];
        }
        return "";
    };
     // --- NEW: Identify the row by a permanent Key ---
    const permanentKey = String(getVal(['Key', 'uuid', '_id']) || '').trim();
    const recCode = String(getVal(['Recording Code', 'RecordingCode']) || '').trim();
    const mlId = String(getVal(['ML Unique ID', 'MLUniqueID']) || '').trim();
    
     const uniqueId = permanentKey || (recCode && mlId ? `${recCode}_${mlId}` : Math.random().toString(36).substring(2, 9));
    
    return {
        _id: permanentKey || (recCode && mlId ? `${recCode}_${mlId}` : Math.random().toString(36).substring(2, 9)),
        Key: permanentKey,
        _status: status,
        StatusID: status,
        QcStatus: getVal(['QC Status', 'QcStatus']), 
        fkEventCode: getVal(['Event Code', 'fkEventCode']), 
        EventName: getVal(['Event Name', 'EventName', 'Recording Name', 'RecordingName']), 
        Yr: getVal(['Year', 'Yr']), 
        NewEventCategory: getVal(['Digital Master Category', 'NewEventCategory', 'fkDigitalMasterCategory']),
        RecordingName: getVal(['Recording Name', 'RecordingName']),
        RecordingCode: recCode,
        Duration: getVal(['Duration']),
        Filesize: getVal(['File Size', 'Filesize']),
        FilesizeInBytes: getVal(['File Size (Bytes)', 'FilesizeInBytes']),
        fkMediaName: getVal(['Media Name', 'fkMediaName']),
       
        NoOfFiles: getVal(['Number of Files', 'NoOfFiles']) || "1",
        AudioBitrate: getVal(['Audio Bitrate', 'AudioBitrate']),
        Masterquality: getVal(['Master Quality', 'Masterquality']),
        PreservationStatus: getVal(['Preservation Status', 'PreservationStatus']) || "Pending",
        RecordingRemarks: getVal(['Recording Remarks', 'RecordingRemarks']),
        MLUniqueID: mlId,
         DistributionDriveLink: getVal(['Distribution Drive Link', 'DistributionDriveLink']),
        fkGranth: getVal(['fkGranth', 'Granth']),
        Number: getVal(['Number', 'Patrank']),
        Topic: getVal(['Topic']),
        ContentFrom: getVal(['Date From', 'ContentFrom']),
        SatsangStart: getVal(['Satsang Start', 'SatsangStart']),
        SatsangEnd: getVal(['Satsang End', 'SatsangEnd']),
        fkCity: getVal(['City', 'fkCity']),
        SubDuration: getVal(['Sub Duration', 'SubDuration']),
        Detail: getVal(['Detail']),
        Remarks: getVal(['Remarks']),
        
        AudioWAVDRCode: getVal(['Audio WAV DR Code', 'AudioWAVDRCode']),
        AudioMP3DRCode: getVal(['Audio MP3 DR Code', 'AudioMP3DRCode']),
        comments: parseLogchats(getVal(['Logchats'])),
        LastModifiedBy: getVal(['Last Modified By', 'LastModifiedBy'])
    };
};

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    function handleResize() { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return windowSize;
}

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
  unifiedCard: (isCompact: boolean) => ({ background: "rgba(30, 41, 59, 0.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "20px", padding: isCompact ? "16px" : "24px", width: "100%", boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.5)", transition: "padding 0.3s ease", display: "flex", flexDirection: "column" as "column" }),
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
 input: (theme: any, disabled: boolean, isCompact: boolean) => ({
    // Change background to be slightly more solid when disabled for better contrast
    backgroundColor: disabled ? "rgba(15, 23, 42, 0.6)" : colors.inputBg, 
    border: disabled ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.1)",
    
    // CHANGE THIS COLOR:
    // From #94a3b8 (muted) to #f1f5f9 (bright/visible)
    color: disabled ? "#f1f5f9" : "#fff", 
    
    // Add font weight for disabled state to make it even clearer
    fontWeight: disabled ? "600" : "400",
    
    height: isCompact ? "34px" : "38px",
    borderRadius: "8px",
    padding: "0 12px",
    transition: "all 0.2s ease",
    outline: "none",
    fontSize: "0.85rem",
    width: "100%",
    cursor: disabled ? "default" : "text",
    // Ensure text opacity is 1 even if the browser tries to mute disabled inputs
    opacity: 1, 
    WebkitTextFillColor: disabled ? "#f1f5f9" : "unset" // Needed for some Safari/Chrome versions
}),
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
  
  groupTitle: (key: string, isActive: boolean) => {
      let color = '#3b82f6';
      if (key === 'complete') color = '#34d399';
      if (key === 'revision') color = '#60a5fa';
      if (key === 'inwarding') color = '#f59e42';
      if (key === 'submission_confirmed') color = '#24fbf0';
      if (key === 'incomplete') color = '#f87171';
      
     return { 
        color, 
        fontSize: '0.75rem', 
        fontWeight: 800, 
        textTransform: 'uppercase' as 'uppercase', 
        marginTop: 4, // Reduced from 20
        marginBottom: 2, // Reduced from 10
        padding: "8px 5px", 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8, 
        cursor: 'pointer', 
        opacity: isActive ? 1 : 0.7, 
        transition: "opacity 0.2s" 
    }
},
  // Update header height to 40px strictly for vertical sticky calculation
  tableHeader: { height: '40px', padding: '0 10px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' as 'uppercase', color: '#94a3b8', background: 'rgba(30, 41, 59, 0.95)', position: 'sticky' as 'sticky', top: 0, zIndex: 20, whiteSpace: 'nowrap' as 'nowrap', borderBottom: '2px solid rgba(255,255,255,0.08)', userSelect: 'none' as 'none' },
  tableCell: { padding: '8px 10px', fontSize: '0.8rem', color: '#e2e8f0', borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' as 'nowrap', verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis' },
  tableRow: (isActive: boolean) => ({ background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent', cursor: 'pointer', transition: 'background 0.2s' })
};

// --- GENERIC COMPONENTS ---
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

// ============================================================================
// --- COMPONENT: SubmittersMLHub ---
// ============================================================================
const SubmittersMLHub = ({ onBack }: { onBack: () => void }) => {
  const { user } = useAuth();
  const { width: windowWidth } = useWindowSize(); 
  const isMobile = windowWidth < 768; 
  
  const allTabs = useMemo(() => [
    { id: "check-ml-reference", label: "Check ML Reference", icon: CheckSquare, permissionKey: "Check ML Reference" },
    { id: "search-new-ml-event-code", label: "Search ML by EventCode", icon: Search, permissionKey: "Search ML by EventCode" },
    { id: "Search Details by MLID", label: "Search New Media for Person Event", icon: Eye, permissionKey: "Search New Media for Person Event" },
    { id: "Search New Media Extensively", label: "Search New Media Extensively", icon: SearchCheck, permissionKey: "Search New Media Extensively" },
    { id: "ML Summary by event code", label: "ML Summary by event code", icon: ListTree, permissionKey: "ML Summary by event code" }
  ], []);

  const visibleTabs = useMemo(() => {
    if (!user) return [];
    if (user.role === "Owner" || user.role === "Admin") return allTabs;
    const permittedResources = new Set(
      (user.permissions || [])
        .filter(p => p.actions.includes("read") || p.actions.includes("write"))
        .map(p => p.resource)
    );
    return allTabs.filter(tab => permittedResources.has(tab.permissionKey));
  }, [user, allTabs]);

  const [activeTab, setActiveTab] = useState<string>(visibleTabs.length > 0 ? visibleTabs[0].id : "");

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.find(t => t.id === activeTab)) {
        setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={styles.header(false)}>
        <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}>
            <button 
              onClick={onBack} 
              style={{ background: 'transparent', border: `1px solid rgba(255,255,255,0.2)`, borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', cursor: 'pointer', transition: 'all 0.2s' }} 
              onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color='white'}} 
              onMouseLeave={(e) => {e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color='#94a3b8'}}
            >
                <ArrowLeft size={20} />
            </button>
        </div>
        <div style={{ textAlign: 'center' }}>
            <h1 style={styles.title(false)}>Submitters ML</h1>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "16px", marginTop: "10px", overflow: "hidden" }}>
        {visibleTabs.length > 0 ? (
          <>
          <div 
              style={{ 
                display: "flex", flexDirection: "row", gap: isMobile ? "8px" : "4px", overflowX: "auto", 
                padding: isMobile ? "0 10px 12px 10px" : "0 4px 8px 4px", justifyContent: "flex-start", 
                flexShrink: 0, WebkitOverflowScrolling: "touch", width: "100%"
              }} 
              className="custom-scrollbar"
            >
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: isMobile ? "10px 16px" : "6px 10px", fontSize: isMobile ? "0.9rem" : "0.75rem",
                    borderRadius: "8px", border: "1px solid",
                    borderColor: activeTab === tab.id ? "rgba(59, 130, 246, 0.5)" : "transparent",
                    background: activeTab === tab.id ? "rgba(59, 130, 246, 0.1)" : "rgba(30, 41, 59, 0.5)",
                    color: activeTab === tab.id ? "#fff" : "#94a3b8", cursor: "pointer", transition: "all 0.2s", 
                    textAlign: "center", fontWeight: activeTab === tab.id ? 600 : 500, whiteSpace: "nowrap", flexShrink: 0 
                  }}
                  onMouseEnter={(e) => { if (activeTab !== tab.id) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={(e) => { if (activeTab !== tab.id) e.currentTarget.style.background = "rgba(30, 41, 59, 0.5)"; }}
                >
                  <tab.icon size={isMobile ? 16 : 14} color={activeTab === tab.id ? "#3b82f6" : "#64748b"} /> 
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "20px", display: "flex", flexDirection: "column", overflowY: "auto", overflowX: "hidden" }} className="custom-scrollbar">
              {activeTab === "check-ml-reference" && <CheckMLReference />}
              {activeTab === "search-new-ml-event-code" && <SearchNewMLEventCode />}
              {activeTab === "Search Details by MLID" && <SearchDetailsByMLID />}
              {activeTab === "Search New Media Extensively" && <SearchNewMediaExtensively />}
              {activeTab === "ML Summary by event code" && <MLSummaryByEventCode />}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", color: "#94a3b8" }}>
              <Lock size={64} style={{ marginBottom: "20px", opacity: 0.5 }} />
              <h2 style={{ color: "#fff", fontSize: "1.5rem", marginBottom: "10px" }}>Access Denied</h2>
              <p>You do not have permission to view any modules in this section.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// --- MAIN COMPONENT ---
// ============================================================================

export function GoogleSheetForm({ config, userEmail }: { config: any; userEmail?: string }) {
  const { user: loggedInUser } = useAuth();
// Define the logic within your component
const workflow = useMemo(() => {
    const roles = (loggedInUser?.role || "").toLowerCase();
    const isAdmin = roles.includes("admin") || roles.includes("owner");
    
    return {
        isSubmitter: roles.includes("submitter") || isAdmin,
        isIngester: roles.includes("ingester") || isAdmin,
        isValidator: roles.includes("data validator") || isAdmin,
        isAdmin
    };
}, [loggedInUser]);

// RULE: Determine if fields are read-only
const isRecordLockedForUser = (item: any) => {
    if (workflow.isAdmin) return false; 
    const status = (item._status || 'incomplete').toLowerCase();

    // 1. SUBMITTER: Only unlocked if status is 'revision'
    // If status is 'incomplete', 'inwarding', or 'submission_confirmed', they are LOCKED.
    if (workflow.isSubmitter && !workflow.isIngester && !workflow.isValidator) {
        return status !== 'revision'; 
    }
    
    // 2. INGESTER: Ingesters can only change status. Data fields are ALWAYS locked for them.
    if (workflow.isIngester && !workflow.isValidator) {
        return true; 
    }

    // 3. VALIDATOR: Only unlocks data if entry is 'submission_confirmed'
    if (workflow.isValidator) {
        return status !== 'submission_confirmed';
    }
    
    return true; 
};

// RULE: Define status flow
const getAllowedStatusTransitions = (item: any) => {
    const current = (item._status || 'incomplete').toLowerCase().trim();
    
    // 1. ADMIN & DATA VALIDATOR: Get full access to all options
    if (workflow.isAdmin || workflow.isValidator) {
        return STATUS_OPTIONS.map(s => s.id);
    }

    const allowed: string[] = [];
    // 2. SUBMITTER: Can ONLY move revision -> inwarding
    if (workflow.isSubmitter && current === 'revision') {
        allowed.push('inwarding');
    }

    // 3. INGESTER: Can move early stages to Revision or Confirmed
    if (workflow.isIngester) {
        if (['incomplete', 'inwarding', 'revision'].includes(current)) {
            allowed.push('revision', 'submission_confirmed');
        }
    }

    return allowed;
};
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1280;
  const isCompact = windowWidth < 1440 || windowHeight < 800; 
  const [isFormExpanded, setIsFormExpanded] = useState(false);
 
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
 const [viewMode, setViewMode] = useState<'hub' | 'form' | 'video_archival' | 'submitters_ml' | 'project_hub_workflow'>('hub');
  
  const [isTableView, setIsTableView] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);
// Inside GoogleSheetForm component...
// Inside GoogleSheetForm component, right after const { user: loggedInUser } = useAuth();


 const [mlIdOptions, setMlIdOptions] = useState<any[]>([]); // Move this here!
  const [mlAdvancedFilters, setMlAdvancedFilters] = useState<FilterGroup[]>([]);
 const [mlSortConfig, setMlSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({ 
  key: 'FootageSrNo', // Changed from LogSerialNo to FootageSrNo
  direction: 'asc' 
});

  // --- 2. DEFINE CONFIGURATIONS ---
  // Define this ONCE. Delete the other 'batchFilterConfigs' at line 663.
  const batchFilterConfigs: FilterConfig[] = [
    { key: 'MLUniqueID', label: 'ML Unique ID', type: 'text' },
    { key: 'Detail', label: 'Detail', type: 'text' },
    {key:'SubDetail', label:'Sub Detail', type:'text'},
    {key:'SubDuration', label:'Sub Duration', type:'text'},
    { key: 'Topic', label: 'Topic', type: 'text' },
    { key: 'fkGranth', label: 'Granth', type: 'text' },
    { key: 'Number', label: 'Patrank', type: 'text' },
    {key:'SatsangStart',  label:'Satsang Start', type:'text'},
    {key:'SatsangEnd',  label:'Satsang End', type:'text'},
    { key: 'ContentFrom', label: 'Date From', type: 'date' },
    { key: 'Segment Category', label: 'Segment Category', type: 'text' },
    {key: 'ContentFrom', label: 'Date From', type: 'date' },
    {key: 'ContentTo', label: 'Date To', type: 'date' },
    {key:'FootageType', label:'Footage Type', type:'text'},
    {key:'EditingStatus', label:'Editing Status', type:'text'},
    {key:'Remarks', label:'Remarks', type:'text'},
    {key:'CounterFrom', label:'Counter From', type:'text'},
    {key:'CounterTo', label:'Counter To', type:'text'},
    {key:'FootageSrNo', label:'Footage Sr No', type:'text'},
    {key:'LogSerialNo', label:'Log Serial No', type:'text'},

  ];

 const [mlSortConfigs, setMlSortConfigs] = useState<{ key: string; direction: 'asc' | 'desc' }[]>([]);
  // This must come AFTER mlIdOptions is declared
const filteredAndSortedMlOptions = useMemo(() => {
    let result = [...mlIdOptions];

    // --- 1. Apply Advanced Filters ---
    if (mlAdvancedFilters.length > 0) {
        result = result.filter(item => {
            return mlAdvancedFilters.every(group => {
                const groupResults = group.rules.map(rule => {
                    const val = String(item[rule.field] || "").toLowerCase();
                    const target = String(rule.value || "").toLowerCase();
                    switch (rule.operator) {
                        case "contains": return val.includes(target);
                        case "equals": return val === target;
                        case "starts_with": return val.startsWith(target);
                        case "is_empty": return !val;
                        case "is_not_empty": return !!val;
                        default: return true;
                    }
                });
                return group.logic === "OR" ? groupResults.some(r => r) : groupResults.every(r => r);
            });
        });
    }

    // --- 2. Apply NESTED Numeric Sort ---
    result.sort((a, b) => {
        // A. Handle User-selected primary sort (from clicking column headers)
        if (mlSortConfig.key && mlSortConfig.direction) {
            const dir = mlSortConfig.direction === 'asc' ? 1 : -1;
            const valA = String(a[mlSortConfig.key] || "");
            const valB = String(b[mlSortConfig.key] || "");
            
            // Use numeric localeCompare (handles 1, 2, 10 correctly)
            const primaryCmp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
            
            // If primary values are different, return the result
            if (primaryCmp !== 0) return primaryCmp * dir;
        }

        // B. Nested Fallback (If primary is equal or no primary set)
        // Level 1: Footage Sr No
        const footA = String(a.FootageSrNo || "");
        const footB = String(b.FootageSrNo || "");
        const footCmp = footA.localeCompare(footB, undefined, { numeric: true });

        if (footCmp !== 0) return footCmp;

        // Level 2: Log Serial No
        const logA = String(a.LogSerialNo || "");
        const logB = String(b.LogSerialNo || "");
        return logA.localeCompare(logB, undefined, { numeric: true });
    });

    return result;
}, [mlIdOptions, mlAdvancedFilters, mlSortConfig]);
  

// Helper to handle sort clicks
const handleMlSort = (key: string) => {
  setMlSortConfig(prev => ({
    key,
    direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
  }));
};
  // --- NEW WIZARD STATE ---
  const [currentStep, setCurrentStep] = useState<number>(1);

  // --- NEW: Multi-Select Table State for new ML additions ---
  const [selectedMlIds, setSelectedMlIds] = useState<Set<string>>(new Set());
  const [showMultiAddConfirm, setShowMultiAddConfirm] = useState(false);

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [showMobileForm, setShowMobileForm] = useState(false);

  const canViewAudioMerge = useMemo(() => {
    if (!loggedInUser) return false;
    if (loggedInUser.role === "Admin" || loggedInUser.role === "Owner") return true;
    return !!loggedInUser.permissions?.some((p: any) => 
      p.resource === "Audio Merge Project" && 
      (p.actions.includes("read") || p.actions.includes("write"))
    );
  }, [loggedInUser]);
// Inside GoogleSheetForm component

const canViewProjectHubWorkflow = useMemo(() => {
  if (!loggedInUser) return false;
  // Owners and Admins usually see everything
  if (loggedInUser.role === "Admin" || loggedInUser.role === "Owner") return true;
  
  // Check specifically for the "Submission & Que Sheet" resource
  return !!loggedInUser.permissions?.some((p: any) => 
    p.resource === "Submission & Que Sheet" && 
    (p.actions.includes("read") || p.actions.includes("write"))
  );
}, [loggedInUser]);

const hasProjectHubWriteAccess = useMemo(() => {
  if (!loggedInUser) return false;
  if (loggedInUser.role === "Admin" || loggedInUser.role === "Owner") return true;
  
  return !!loggedInUser.permissions?.some((p: any) => 
    p.resource === "Submission & Que Sheet" && p.actions.includes("write")
  );
}, [loggedInUser]);
  const canViewWisdomReels = useMemo(() => {
    if (!loggedInUser) return false;
    if (loggedInUser.role === "Admin" || loggedInUser.role === "Owner") return true;
    return !!loggedInUser.permissions?.some((p: any) => 
      p.resource === "Wisdom Reels Archival" && 
      (p.actions.includes("read") || p.actions.includes("write"))
    );
  }, [loggedInUser]);

  
  
  const canViewSubmittersML = useMemo(() => {
    if (!loggedInUser) return false;
    if (loggedInUser.role === "Owner" || loggedInUser.role === "Admin") return true;
    return !!loggedInUser.permissions?.some(p => 
        p.resource === "Submitters ML" && 
        (p.actions.includes("read") || p.actions.includes("write"))
    );
  }, [loggedInUser]);

const hasEditAccess = 
    workflow.isAdmin || 
    workflow.isIngester || 
    workflow.isValidator || 
    workflow.isSubmitter;
    
  const canApprove = hasEditAccess;

  const canEditEntry = (item: any) => {
    const status = item._status || 'incomplete';
    return hasEditAccess && status === 'revision';
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
 const [groupByField, setGroupByField] = useState<string>('EventName_RecordingName');
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 }); 

  // Queue Table Column Widths
  const [colWidths, setColWidths] = useState<{[key: string]: number}>(() => {
    const initial: any = {};
    TABLE_COLUMNS.forEach(col => initial[col.id] = col.width);
    return initial;
});
// --- MOVE THIS HERE (AFTER colWidths) ---

const [freezeThreshold, setFreezeThreshold] = useState<string | null>(null);

const frozenColumnData = useMemo(() => {
    let currentLeft = 0;
    const data: Record<string, { isFrozen: boolean; left: number }> = {};
    const alwaysFrozen = ['select', 'actions'];
    const thresholdIndex = TABLE_COLUMNS.findIndex(c => c.id === freezeThreshold);

    TABLE_COLUMNS.forEach((col, index) => {
        const isAlwaysFrozen = alwaysFrozen.includes(col.id);
        const isUserFrozen = thresholdIndex !== -1 && index <= thresholdIndex && !isAlwaysFrozen;
        const isFrozen = isAlwaysFrozen || isUserFrozen;

        if (isFrozen) {
            data[col.id] = { isFrozen: true, left: currentLeft };
            currentLeft += colWidths[col.id] || col.width;
        } else {
            data[col.id] = { isFrozen: false, left: 0 };
        }
    });
    return data;
}, [freezeThreshold, colWidths]); // Now colWidths is defined, so no error!
  // Batch Selection Table Column Widths
  const [batchColWidths, setBatchColWidths] = useState<{[key: string]: number}>(() => {
    const initial: any = {};
    BATCH_TABLE_COLUMNS.forEach(col => initial[col.id] = col.width);
    return initial;
  });

  const [eventCodeOptions, setEventCodeOptions] = useState<{ EventCode: string, EventName: string, Yr?: string, NewEventCategory?: string }[]>([]);
  const [userList, setUserList] = useState<{name: string, email: string}[]>([]); 
 

  const [wisdomUserList, setWisdomUserList] = useState<{name: string, email: string}[]>([]);
  const [submittersMLUserList, setSubmittersMLUserList] = useState<{name: string, email: string}[]>([]);
  const [wisdomPickedCount, setWisdomPickedCount] = useState(0);
  const [wisdomTotalCount, setWisdomTotalCount] = useState(0);

  const [queue, setQueue] = useState<any[]>(() => { try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : []; } catch (e) { return []; } });
  
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
      try { 
          const saved = localStorage.getItem(STORAGE_KEY); 
          const parsedQueue = saved ? JSON.parse(saved) : []; 
          const defaultGroups = parsedQueue.map((q:any) => q.RecordingCode || 'Uncategorized');
          return new Set([...defaultGroups, 'incomplete', 'revision', 'inwarding', 'submission_confirmed', 'complete']); 
      } catch (e) { 
          return new Set(['incomplete', 'revision', 'inwarding', 'submission_confirmed', 'complete']); 
      }
  });



  const [selectedIndices, setSelectedIndices] = useState<Set<string>>(new Set());
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null); 
  const [editingId, setEditingId] = useState<string | null>(null); 
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null); 
  const [commentInput, setCommentInput] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null); 
  const [editingCommentId, setEditingCommentId] = useState<string | number | null>(null); 
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  
  const activeEntry = queue.find(q => q._id === activeCommentId);
  const isCommentsOpen = !!activeCommentId && !!activeEntry;

  const initialFormState = {Key: "",fkEventCode: "", EventName: "", Yr: "", NewEventCategory: "", RecordingName: "", RecordingCode: "", Duration: "", DistributionDriveLink: "",  Dimension: "", Masterquality: "", fkMediaName: "", Filesize: "", FilesizeInBytes: "", NoOfFiles: "1", RecordingRemarks: "", CounterError: "", ReasonError: "", MasterProductTitle: "", fkDistributionLabel: "", ProductionBucket: "", fkDigitalMasterCategory: "", AudioBitrate: "", AudioTotalDuration: "", QcRemarksCheckedOn: "", PreservationStatus: "Preserve", QCSevak: "", QcStatus: "", SubmittedDate: "", PresStatGuidDt: "", InfoOnCassette: "", IsInformal: "", AssociatedDR: "", Teams: "", MLUniqueID: "", Detail: "", AudioWAVDRCode: "", fkGranth: "", Number: "", Topic: "", ContentFrom: "", SatsangStart: "", SatsangEnd: "", fkCity: "", SubDuration: "", Remarks: "", files: [] as any[] };
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(queue)); }, [queue]);
  
  useEffect(() => { if (chatBottomRef.current) chatBottomRef.current.scrollIntoView({ behavior: "smooth" }); }, [activeEntry?.comments, activeCommentId]);

  useEffect(() => {
    const handleScroll = () => { if (openStatusDropdown) setOpenStatusDropdown(null); };
    const div = tableContainerRef.current;
    if (div) div.addEventListener('scroll', handleScroll);
    return () => { if (div) div.removeEventListener('scroll', handleScroll); };
  }, [openStatusDropdown]);
  
  useEffect(() => { setOpenStatusDropdown(null); }, [isTableView]);

  useEffect(() => {
      const fetchMlOptions = async () => {
          if (!formData.fkEventCode) {
              setMlIdOptions([]);
              return;
          }
          try {
              const url = `${cleanBaseUrl}/api/ml-unique-id/options?eventCode=${encodeURIComponent(formData.fkEventCode)}`;
              const res = await fetch(url);
              if (res.ok) setMlIdOptions(await res.json());
          } catch (e) {
              console.error("Error fetching ML options:", e);
          }
      };
      fetchMlOptions();
  }, [formData.fkEventCode]);

  useEffect(() => {
      const fetchData = async () => {
          try {
              const ecRes = await fetch(`${cleanBaseUrl}/api/event-code/options`); 
              if (ecRes.ok) setEventCodeOptions(await ecRes.json());
          } catch (e) { console.error(e); }
      }; 

      const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('app-token');
            const res = await fetch(`${cleanBaseUrl}/api/users/mention-list`, { headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) } });
            if (res.ok) setUserList(await res.json());
        } catch (e) { console.error(e); }
      };

      const fetchWisdomUsers = async () => {
        try {
            const token = localStorage.getItem('app-token');
            const res = await fetch(`${cleanBaseUrl}/api/users/wisdom-list`, { headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) } });
            if (res.ok) setWisdomUserList(await res.json()); else setWisdomUserList([]);
        } catch (e) { console.error("Error fetching wisdom users", e); }
      };

      const fetchSubmittersMLUsers = async () => {
        try {
            const token = localStorage.getItem('app-token');
            const res = await fetch(`${cleanBaseUrl}/api/users/submitters-ml-list`, { headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) } });
            if (res.ok) setSubmittersMLUserList(await res.json()); else setSubmittersMLUserList([]);
        } catch (e) { console.error("Error fetching submitters ML users", e); }
      };

      fetchData(); fetchUsers(); fetchWisdomUsers(); fetchSubmittersMLUsers();
  }, []);

  useEffect(() => {
    const fetchWisdomPickedCount = async () => {
        if (!canViewWisdomReels) return;
        try {
            const token = localStorage.getItem('app-token');
            const [usedRes, unusedRes] = await Promise.all([
                fetch(`${cleanBaseUrl}/api/video-archival/satsang-reels?limit=10000`, { headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) } }),
                fetch(`${cleanBaseUrl}/api/video-archival/unused-satsangs?limit=10000`, { headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) } })
            ]);

            let picked = 0; let total = 0;
            if (usedRes.ok) {
                const usedData = await usedRes.json();
                picked += (usedData.data || []).filter((i: any) => i.LockStatus === 'Locked').length;
                total += (usedData.data || []).length;
            }
            if (unusedRes.ok) {
                const unusedData = await unusedRes.json();
                picked += (unusedData.data || []).filter((i: any) => i.LockStatus === 'Locked').length;
                total += (unusedData.data || []).length;
            }
            setWisdomPickedCount(picked); setWisdomTotalCount(total);
        } catch (e) { console.error("Error fetching wisdom picked count", e); }
    };
    fetchWisdomPickedCount();
  }, [canViewWisdomReels]);

  const fetchSheetData = async () => {
    try {
      const token = localStorage.getItem('app-token');
      const res = await fetch(`${cleanBaseUrl}/api/google-sheet/digital-recordings?limit=500`, { 
          headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const result = await res.json();
        if (result.data && Array.isArray(result.data)) {
          const freshQueue = result.data.map(mapSheetRowToQueueItem);
          const savedData = localStorage.getItem(STORAGE_KEY);
          const localQueue = savedData ? JSON.parse(savedData) : [];

          const mergedQueue = freshQueue.map((freshItem: any) => {
              const localItem = localQueue.find((l: any) => l._id === freshItem._id);
              if (localItem) {
                  return { ...freshItem, _status: localItem._status, QcStatus: localItem.QcStatus, comments: localItem.comments?.length > 0 ? localItem.comments : freshItem.comments };
              }
              return freshItem; 
          });

          setQueue(mergedQueue);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedQueue));
        }
      }
    } catch (error) { console.error("Error syncing with Google Sheet:", error); }
  };

  useEffect(() => { if(canViewAudioMerge) fetchSheetData(); }, [canViewAudioMerge]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleManualRefresh = async () => {
      setIsRefreshing(true);
      await fetchSheetData();
      setIsRefreshing(false);
      toast.success("Synced with Google Sheet");
  };

  const handleResizeStart = (e: React.MouseEvent, columnId: string) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX;
    const startWidth = colWidths[columnId] || 100;

    const handleMouseMove = (moveEvent: MouseEvent) => {
        setColWidths(prev => ({ ...prev, [columnId]: Math.max(50, startWidth + (moveEvent.clientX - startX)) }));
    };
    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleBatchResizeStart = (e: React.MouseEvent, columnId: string) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX;
    const startWidth = batchColWidths[columnId] || 100;

    const handleMouseMove = (moveEvent: MouseEvent) => {
        setBatchColWidths(prev => ({ ...prev, [columnId]: Math.max(50, startWidth + (moveEvent.clientX - startX)) }));
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
        let totalBytes = 0; let totalDuration = 0; let maxRes = { w: 0, h: 0 };
        const distinctExtensions = new Set<string>();
        
        let recordingName = "";
        if (files.length > 0) recordingName = files[0].name.substring(0, files[0].name.lastIndexOf('.')) || files[0].name;

        const mediaFiles = files.filter(f => f.name !== ".DS_Store" && f.size > 0);
        mediaFiles.forEach(f => {
            const parts = f.name.split('.');
            if(parts.length > 1) distinctExtensions.add(parts.pop()!.toLowerCase());
        });
        const fileTypeString = Array.from(distinctExtensions).join(', ');

        const metadataPromises = mediaFiles.map(async (file) => {
            totalBytes += file.size;
            const meta = await getMediaMetadata(file);
            return { name: file.name, size: file.size, type: file.type, duration: meta.duration, width: meta.width, height: meta.height, bitrate: meta.bitrate };
        });
        const filesMetadata = await Promise.all(metadataPromises);

        filesMetadata.forEach(meta => {
            totalDuration += meta.duration;
            if (meta.width > maxRes.w) maxRes = { w: meta.width, h: meta.height };
        });
 const totalMB = totalBytes / (1024 * 1024); // Convert bytes to MB
    const filesizeNumeric = parseFloat(totalMB.toFixed(2)); // Result: 5.08
        let bitrateKbps = filesMetadata.length > 0 ? filesMetadata[0].bitrate : null;
    if (!bitrateKbps) bitrateKbps = totalDuration > 0 ? ((totalBytes * 8) / totalDuration) / 1000 : 0;
    const bitrateNumeric = Math.floor(bitrateKbps || 0); // Result: 320
        
        const bitrateString = bitrateKbps > 0 ? `${Math.floor(bitrateKbps)} kbps` : "";
        const dimensionStr = maxRes.w > 0 ? `${maxRes.w}x${maxRes.h}` : "";

        let quality = "";
        if (maxRes.h >= 2160) quality = "4K";
        else if (maxRes.h >= 1080) quality = "HD";
        else if (maxRes.h >= 720) quality = "HD Ready";
        else if (maxRes.h > 0) quality = "SD";

       setFormData(prev => ({
        ...prev, 
        RecordingName: recordingName, 
        NoOfFiles: mediaFiles.length.toString(), 
        // Only the number goes here:
        Filesize: filesizeNumeric.toString(), 
        FilesizeInBytes: totalBytes.toString(), 
        fkMediaName: fileTypeString, 
        Duration: formatDuration(totalDuration), 
        AudioTotalDuration: formatDuration(totalDuration), 
        // Only the number goes here:
        AudioBitrate: bitrateNumeric.toString(), 
        Dimension: maxRes.w > 0 ? `${maxRes.w}x${maxRes.h}` : prev.Dimension,
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
    
   if (name === "fkEventCode")  {
    let actualCode = value;

    // Check if the value contains the " - " separator (meaning it came from a dropdown selection)
    if (value.includes(" - ")) {
        const parts = value.split(" - ");
        actualCode = parts[parts.length - 1]; // Extract just the Code (the last part)
    }
       const selectedEvent = eventCodeOptions.find(opt => opt.EventCode === actualCode);
    
    // We only want to store the Code in the database/form state
  
        setSelectedMlIds(new Set());
    setMlIdOptions([]);
    setFormData(prev => ({
        ...prev, 
        fkEventCode: actualCode, // Only store the code
        EventName: selectedEvent?.EventName || "", 
        Yr: selectedEvent?.Yr || "", 
        NewEventCategory: selectedEvent?.NewEventCategory || "",
        MLUniqueID: "", Detail: "", fkGranth: "", Number: "", Topic: "", 
        ContentFrom: "", SatsangStart: "", SatsangEnd: "", fkCity: "", 
        SubDuration: "", Remarks: ""
    }));
}
    else if (name === "MLUniqueID") {
        const selectedML = mlIdOptions.find(opt => opt.MLUniqueID === value);
        setFormData(prev => ({
            ...prev, MLUniqueID: value, Detail: selectedML?.Detail || "", fkGranth: selectedML?.fkGranth || "", Number: selectedML?.Number || "",
            Topic: selectedML?.Topic || "", ContentFrom: selectedML?.ContentFrom || "", SatsangStart: selectedML?.SatsangStart || "",
            SatsangEnd: selectedML?.SatsangEnd || "", fkCity: selectedML?.fkCity || "", SubDuration: selectedML?.SubDuration || "", Remarks: selectedML?.Remarks || "",
        }));
    }
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

 // Find this function (around line 520) and update it:
const handleSelectEntry = (item: any) => { 
    setFormData(item);             // Populate Form
    setActiveCommentId(item._id);     // Open Sidebar
    setEditingId(null);            // Ensure not in edit mode
    setShowMobileForm(false); 
    setCurrentStep(1); 
    
    // --- KEY ADDITION ---
    setIsTableView(false);         // Switch from Table to Form/Details view
    setIsFormExpanded(false);      // Exit full screen if active
};
  
 const handleEditClick = (item: any, e: any) => { 
    e.stopPropagation(); 
    if (!canEditEntry(item)) { 
        toast.error(hasEditAccess ? "Only entries marked 'Needs Revision' can be edited." : "You do not have permission to edit."); 
        return; 
    }
    
    // Switch to Form View
    setIsTableView(false);     
    // Close sidebar immediately
    setActiveCommentId(null);  
    // Reset full screen form if it was active
    setIsFormExpanded(false);  
    
    setFormData(item); 
    setEditingId(item._id); 
    setCurrentStep(1); 

    if (isMobile) setShowMobileForm(true);
};
  
  const enableEditing = () => { if(activeCommentId) setEditingId(activeCommentId); if(isMobile) setShowMobileForm(true); };
  
  const handleStatusClick = (id: string, e: any) => { e.stopPropagation(); if (openStatusDropdown === id) setOpenStatusDropdown(null); else setOpenStatusDropdown(id); };

  const updateStatus = async (id: string, newStatus: string, e: any) => { 
    e.stopPropagation(); 
    const itemToUpdate = queue.find(item => item._id === id);
    if (!itemToUpdate) return;

    const statusMap: Record<string, string> = { 
        'incomplete': 'Submitted to MM', 
        'revision': 'Needs Revision', 
        'inwarding': 'Inwarding', 
        'submission_confirmed': 'Submission Confirmed', 
        'complete': 'Complete' 
    };
    const mappedLabel = statusMap[newStatus] || newStatus;

    // --- STEP 1: OPTIMISTIC UPDATE (Update UI immediately) ---
    setQueue(prev => prev.map(item => 
        item._id === id ? { ...item, _status: newStatus, StatusID: newStatus, QcStatus: mappedLabel } : item
    ));

    try {
        const token = localStorage.getItem('app-token');
        const res = await fetch(`${cleanBaseUrl}/api/google-sheet/digital-recordings`, {
            method: "PUT", 
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ 
                ...itemToUpdate, 
                _status: newStatus,  // This targets StatusID in backend
                QcStatus: mappedLabel // This targets QC Status in backend
            }),
        });

        if (!res.ok) {
            const errorResult = await res.json();
            throw new Error(errorResult.error || "Sync failed");
        }
        
        toast.success(`Status updated to ${mappedLabel}`);
        
        // --- STEP 2: RE-SYNC WITH SERVER ---
        await fetchSheetData(); 
    } catch (error: any) {
        toast.error(error.message);
        // Rollback on error
        fetchSheetData(); 
    }
    setOpenStatusDropdown(null);
};

  const toggleGroup = (group: string) => { const newSet = new Set(expandedGroups); if (newSet.has(group)) newSet.delete(group); else newSet.add(group); setExpandedGroups(newSet); };
  
function parseDurationToSeconds(duration: any): number {
    if (!duration) return 0;
    if (typeof duration === 'number') return duration;
    
    // Clean string and split by colon
    const parts = String(duration).trim().split(':').map(val => parseInt(val, 10) || 0);
    
    if (parts.length === 3) {
        // Format hh:mm:ss
        return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    } else if (parts.length === 2) {
        // Format mm:ss (treat as minutes and seconds)
        return (parts[0] * 60) + parts[1];
    } else if (parts.length === 1) {
        // Just seconds
        return parts[0];
    }
    return 0;
}
  function isValidDurationFormat(duration: string): boolean { return /^(\d{2}):[0-5]\d:[0-5]\d$/.test(duration) || /^[0-5]?\d:[0-5]\d$/.test(duration); }

function validateForm(formData: any, selectedMlList: any[] = []) {
    const errors: { [key: string]: string } = {};
    let driftWarning: string | null = null; // New variable for soft warnings

    if (!formData.fkEventCode) errors.fkEventCode = "Event Code is required.";
    if (!formData.RecordingCode) errors.RecordingCode = "Recording Code is required.";
    
    // 1. Check Duration Format for manual entry
     const durationRegex = /^(\d{1,2}:)?([0-5]?\d):([0-5]\d)$/;
    if (formData.Duration && !durationRegex.test(formData.Duration)) {
        errors.Duration = "Invalid Format. Use HH:MM:SS or MM:SS";
        return { errors, driftWarning }; 
    }

   const scanSeconds = parseDurationToSeconds(formData.Duration);
    const checkDrift = (subDur: any) => {
        if (!scanSeconds || !subDur) return false;
        const mlSeconds = parseDurationToSeconds(subDur);
        return Math.abs(scanSeconds - mlSeconds) > 60;
    };

    // 2. Check single ML (Manual Step 3 or Edit Mode)
   if (formData.MLUniqueID && formData.SubDuration) {
        if (checkDrift(formData.SubDuration)) {
            driftWarning = `Note: Entered Duration (${formData.Duration}) and ML (${formData.SubDuration}) differ by more than 60s.`;
        }
    }
   // 3. Soft Warning: Check Batch MLs drift
    if (selectedMlList.length > 0) {
        const driftViolation = selectedMlList.find(ml => checkDrift(ml.SubDuration));
        if (driftViolation) {
            driftWarning = `Note: Batch Drift detected. ML ID ${driftViolation.MLUniqueID} (${driftViolation.SubDuration}) differs from Entered Duration (${formData.Duration}) by > 60s.`;
        }
    }

    return { errors, driftWarning };
}

  const processAddQueue = async () => {
    setShowMultiAddConfirm(false);
    setIsSubmitting(true);
    const token = localStorage.getItem('app-token');
    let newItems = [];
    
    // --- FIX: Generate keys INSIDE the loop so every row is unique ---
    if (selectedMlIds.size > 0) {
        for (const mlid of selectedMlIds) {
            const mlDetails = mlIdOptions.find(opt => opt.MLUniqueID === mlid) || {};
            
            // GENERATE UNIQUE KEY FOR EVERY INDIVIDUAL ITEM
            const itemUniqueKey = `ID-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

            newItems.push({
                ...formData,
                Key: itemUniqueKey, // Unique key for backend/Google Sheet
                _id: itemUniqueKey, // Unique ID for frontend state
                MLUniqueID: mlid,
                Detail: mlDetails.Detail || "",
                fkGranth: mlDetails.fkGranth || "",
                Number: mlDetails.Number || "",
                Topic: mlDetails.Topic || "",
                ContentFrom: mlDetails.ContentFrom || "",
                SatsangStart: mlDetails.SatsangStart || "",
                SatsangEnd: mlDetails.SatsangEnd || "",
                fkCity: mlDetails.fkCity || "",
                SubDuration: mlDetails.SubDuration || "",
                Remarks: mlDetails.Remarks || "",
                comments: [],
                _status: 'incomplete',
                QcStatus: 'Submitted to MM',
                "QC Status": 'Submitted to MM'
            });
        }
    } else {
        // Single Add Logic
        const singleKey = `ID-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        newItems.push({
            ...formData,
            Key: singleKey,
            _id: singleKey,
            comments: [],
            _status: 'incomplete',
            QcStatus: 'Submitted to MM',
            "QC Status": 'Submitted to MM'
        });
    }

    let addedItems = [];
    try {
        // Loop through the prepared unique items and send them to the server
        for (const item of newItems) {
            const res = await fetch(`${cleanBaseUrl}/api/google-sheet/digital-recordings`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json", 
                    ...(token ? { "Authorization": `Bearer ${token}` } : {}) 
                },
                body: JSON.stringify({ ...item, Logchats: formatLogchats(item.comments) }),
            });
            if (!res.ok) throw new Error("Failed to sync item");
            addedItems.push(item);
        }
        
        toast.success(`Successfully added ${addedItems.length} entry/entries to Google Sheet and Queue`);
        
        // Update local state
        setQueue(prev => [...addedItems, ...prev]);
        
        // Reset form
        setFormData(initialFormState);
        setSelectedMlIds(new Set());
        setCurrentStep(1);
        setShowMobileForm(false);
    } catch (error) {
        console.error(error);
        toast.error("Failed to sync some entries with Google Sheet.");
        if (addedItems.length > 0) {
            setQueue(prev => [...addedItems, ...prev]);
        }
    } finally {
        setIsSubmitting(false);
    }
};
const [validationError, setValidationError] = useState<{ title: string; message: string } | null>(null);
const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedMlDataObjects = mlIdOptions.filter(opt => selectedMlIds.has(opt.MLUniqueID));
    const { errors, driftWarning } = validateForm(formData, selectedMlDataObjects);
    setFormErrors(errors);

    // 1. BLOCK: Only for Hard Errors (Format)
    if (errors.Duration) {
        setValidationError({
            title: "Format Error",
            message: errors.Duration
        });
        return;
    }

    // 2. WARNING: Show popup but DO NOT return (let the code continue to save)
    if (driftWarning && !isEditing && !isViewing) {
    setValidationError({
        title: "Duration Warning",
        message: driftWarning
    });
}
    if (Object.keys(errors).length > 0) {
        toast.error("Please fix form errors.");
        return;
    }

    // 3. ADDITIONAL STRICTURES
    if (!formData.RecordingCode || formData.RecordingCode.length !== 11) {
        toast.error("Recording Code must be exactly 11 characters.");
        return;
    }
    if (formData.fkEventCode && formData.RecordingCode.slice(0, 7) !== formData.fkEventCode.slice(0, 7)) {
        toast.error("First 7 characters of DR code must match the Event Code.");
        return;
    }

    // 4. DUPLICATE CHECK
    let isDuplicateDR = false;
    let dupId = "";

    if (!isEditing && selectedMlIds.size > 0) {
        // Check every selected ML ID in the batch
        for (const mlid of selectedMlIds) {
            if (queue.some(item => item.RecordingCode === formData.RecordingCode && item.MLUniqueID === mlid)) {
                isDuplicateDR = true;
                dupId = mlid;
                break;
            }
        }
    } else {
        // Check single entry
        isDuplicateDR = queue.some(item => 
            item.RecordingCode === formData.RecordingCode && 
            item.MLUniqueID === formData.MLUniqueID && 
            item._id !== editingId
        );
        dupId = formData.MLUniqueID;
    }

    if (isDuplicateDR) {
        setFormErrors(prev => ({ ...prev, RecordingCode: "Duplicate found." }));
        setDuplicateWarning(`${formData.RecordingCode} (ML ID: ${dupId || 'N/A'})`);
        return;
    }

    // 5. EXECUTE SAVE/UPDATE
    if (editingId) {
        // EDIT MODE: Update existing item
        const existingItem = queue.find(item => item._id === editingId);
        const updatedItem = { 
            ...formData, 
            _id: editingId, 
             Key: existingItem.Key || editingId,
            comments: existingItem?.comments || [], 
            _status: existingItem?._status || 'incomplete', 
            QcStatus: existingItem?.QcStatus || 'Submitted to MM' 
        };

        setQueue(prev => prev.map(item => item._id === editingId ? updatedItem : item));

        try {
        const token = localStorage.getItem('app-token');
        const res = await fetch(`${cleanBaseUrl}/api/google-sheet/digital-recordings`, {
            method: "PUT", 
            headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) },
            body: JSON.stringify(updatedItem),
        });

        if (!res.ok) {
            // NEW: Parse the error message from the backend
            const errorResult = await res.json();
            throw new Error(errorResult.error || "Failed to update Sheet");
        }
        
        toast.success("Entry Updated in Google Sheet");
        
        // ONLY reset the form if the API succeeded
        setEditingId(null); 
        setFormData(initialFormState); 
        setActiveCommentId(null); 
        setCurrentStep(1); 
        setShowMobileForm(false);

    } catch (error: any) {
        console.error(error);
        toast.error(`Update failed: ${error.message}`);
        // Optional: refresh queue to sync back with sheet data
        fetchSheetData(); 
    }
} else {
        // ADD MODE: Check if we show Multi-Add confirmation or just process
        if (!isEditing && mlIdOptions.length > 0 && selectedMlIds.size > 0) {
            setShowMultiAddConfirm(true); 
        } else {
            processAddQueue(); 
        }
    }
};

  const handleResetForm = () => { 
      setIsResetting(true); 
      setFormData(initialFormState); 
      setSelectedMlIds(new Set()); 
      setCurrentStep(1);
      setTimeout(() => setIsResetting(false), 700); 
  };
  
  const handleCancelSelection = () => { 
      setEditingId(null); setActiveCommentId(null); setFormData(initialFormState); setSelectedMlIds(new Set()); setCurrentStep(1); setShowMobileForm(false); 
  };
  const handleCloseComments = () => { setActiveCommentId(null); setEditingId(null); setFormData(initialFormState); setCurrentStep(1); };

  const handleMentionClick = async () => {
      const isOpening = !showUserDropdown;
      setShowUserDropdown(isOpening);
      if (isOpening) {
          try {
              const token = localStorage.getItem('app-token');
              const res = await fetch(`${cleanBaseUrl}/api/users/mention-list`, { method: "GET", headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) } });
              if (res.ok) setUserList(await res.json()); else toast.error("Could not load user list");
          } catch (error) { console.error("API Error:", error); }
      }
  };

  const handleSendComment = async () => {
      if (!commentInput.trim() || !activeCommentId) return;
      const token = localStorage.getItem('app-token'); 
      
      setQueue(prev => prev.map(item => {
          if (item._id === activeCommentId) {
              let updatedComments;
              if (editingCommentId) updatedComments = item.comments.map((c: any) => c.id === editingCommentId ? { ...c, text: commentInput, isEdited: true } : c);
              else {
                  const newComment = { id: Date.now(), text: commentInput, user: userEmail || "User", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), replyTo: replyTo ? { user: replyTo.user, text: replyTo.text, id: replyTo.id } : undefined };
                  updatedComments = [...(item.comments || []), newComment];
              }

              fetch(`${cleanBaseUrl}/api/google-sheet/digital-recordings`, {
                  method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                  body: JSON.stringify({ ...item, Logchats: formatLogchats(updatedComments) }),
              }).catch(err => { toast.error("Failed to sync chat"); console.error(err); });

              return { ...item, comments: updatedComments };
          }
          return item;
      }));
      setCommentInput(""); setReplyTo(null); setEditingCommentId(null); setShowUserDropdown(false);
  };

  const handleEditCommentAction = (comment: any) => { setCommentInput(comment.text); setEditingCommentId(comment.id); setReplyTo(null); document.getElementById("chat-input-field")?.focus(); };
  
  const handleDeleteComment = (commentId: number) => {
      if (!activeCommentId || !window.confirm("Delete this message?")) return;
      const token = localStorage.getItem('app-token'); 

      setQueue(prev => prev.map(item => {
          if (item._id === activeCommentId) {
              const updatedComments = item.comments.filter((c: any) => c.id !== commentId);
              
              fetch(`${cleanBaseUrl}/api/google-sheet/digital-recordings`, {
                  method: "POST", 
                  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                  body: JSON.stringify({ ...item, Logchats: formatLogchats(updatedComments) }),
              })
              .then(res => {
                  if (!res.ok) throw new Error("Failed to sync deletion");
                  toast.success("Comment deleted");
              })
              .catch(err => {
                  console.error("Delete error:", err);
                  toast.error("Failed to delete comment from server");
              });

              return { ...item, comments: updatedComments };
          }
          return item;
      }));
  };

  const handleCancelChatAction = () => { setReplyTo(null); setEditingCommentId(null); setCommentInput(""); };
  const toggleSelection = (id: string, e: any) => { e.stopPropagation(); const newSet = new Set(selectedIndices); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); setSelectedIndices(newSet); };
  
  const handleGroupSelect = (groupItems: any[], e: React.MouseEvent) => {
      e.stopPropagation();
      const groupIds = groupItems.map(item => item._id);
      const isAllSelected = groupIds.length > 0 && groupIds.every(id => selectedIndices.has(id));
      
      setSelectedIndices(prev => {
          const next = new Set(prev);
          if (isAllSelected) {
              groupIds.forEach(id => next.delete(id));
          } else {
              groupIds.forEach(id => next.add(id));
          }
          return next;
      });
  };

  const handleUploadSelected = async () => {
      if (selectedIndices.size === 0) return;
      const selectedItems = queue.filter(item => selectedIndices.has(item._id));
      if (selectedItems.some(item => item._status !== 'complete')) { toast.error(`Cannot approve! Items must be marked 'Complete'.`); return; }
      
      setIsSubmitting(true);
      const token = localStorage.getItem('app-token');
      let failedIds: string[] = [];

      for (const item of selectedItems) {
          try {
            const { _id, comments, ...cleanPayload } = item; 
const finalPayload = { 
    ...cleanPayload, 
    _status: item._status, // Explicitly ensure this is sent
    LastModifiedBy: userEmail || "System", 
    Logchats: formatLogchats(comments || []) 
};
             await fetch(`${cleanBaseUrl}/api/digitalrecording/approve`, {
                  method: "POST", headers: { "Content-Type": "application/json", "Authorization": token ? `Bearer ${token}` : '' },
                  body: JSON.stringify(finalPayload),
              }).then(async res => { 
                  if (!res.ok) {
                      let errMsg = "DB Transaction Failed";
                      try { const err = await res.json(); errMsg = err.message || err.error || JSON.stringify(err); } 
                      catch (e) { errMsg = await res.text(); }
                      throw new Error(errMsg);
                  }
              });
          } catch (error: any) { console.error(error); failedIds.push(item._id); toast.error(<><b>Approval Error</b><div>{error.message}</div></>); }
      }
      setQueue(prev => prev.filter(item => !selectedIndices.has(item._id) || failedIds.includes(item._id)));
      setSelectedIndices(new Set());
      if (activeCommentId && !failedIds.includes(activeCommentId)) setActiveCommentId(null);
      if (failedIds.length === 0) toast.success("Entries Approved & Linked successfully");
      else toast.warning(`Some entries failed to approve.`);
      setIsSubmitting(false);
  };

  const handleSetStep = (s: number) => {
    // 1. Validation for moving FROM Step 1 TO Step 2
    if (s === 2) {
        if (!formData.fkEventCode) {
            toast.error("Please select an Event Code first.");
            return;
        }
        if (!formData.EventName || !formData.Yr) {
            toast.error("Please complete all Event Details.");
            return;
        }
    }

    // 2. Validation for moving FROM Step 2 TO Step 3 (DMS Details check)
    if (s === 3) {
        // Ensure Step 1 was actually done
        if (!formData.fkEventCode) {
            toast.error("Please select an Event Code first.");
            setCurrentStep(1);
            return;
        }

        // --- DMS DETAILS VALIDATION ---
        if (!formData.RecordingCode || formData.RecordingCode.length !== 11) {
            toast.error("Recording Code must be exactly 11 characters.");
            setFormErrors(prev => ({ ...prev, RecordingCode: "Must be 11 chars" }));
            return;
        }

        // Logic check: First 7 chars of DR must match first 7 of Event Code
        if (formData.RecordingCode.slice(0, 7) !== formData.fkEventCode.slice(0, 7)) {
            toast.error(`DR Code prefix must match Event Code (${formData.fkEventCode.slice(0, 7)})`);
            setFormErrors(prev => ({ ...prev, RecordingCode: "Prefix mismatch" }));
            return;
        }

        if (!formData.RecordingName) {
            toast.error("Recording Name is required.");
            setFormErrors(prev => ({ ...prev, RecordingName: "Required" }));
            return;
        }

      const { errors, driftWarning } = validateForm(formData);
    
    // If hard errors exist, stop
    if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        if (errors.RecordingCode) toast.error(errors.RecordingCode);
        return;
    }

    // If only a drift warning exists, show the popup but ALLOW the step change
   if (driftWarning && !isEditing && !isViewing) {
    setValidationError({
        title: "Duration Warning",
        message: driftWarning
    });
}

      
        
        // Clear errors if everything is valid
        setFormErrors({});
    }

    // If all checks pass, allow changing the step
    setCurrentStep(s);
  };

  const exportToCSV = () => {
    if (queue.length === 0) {
        toast.error("No data to export");
        return;
    }
    
    const exportCols = TABLE_COLUMNS.filter(col => col.id !== 'select' && col.id !== 'actions');
    
    const headers = exportCols.map(col => `"${col.label}"`).join(",");
    
    const csvRows = queue.map(row => {
        return exportCols.map(col => {
            let val = row[col.id] || "";
            val = String(val).replace(/"/g, '""');
            return `"${val}"`;
        }).join(",");
    });
    
    const csvString = [headers, ...csvRows].join("\n");
    
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Audio_Merge_Queue_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isEditing = !!editingId;
  const isViewing = !!activeCommentId && !isEditing;
  const isCurrentEntryEditable = activeEntry ? canEditEntry(activeEntry) : false;

 

// This variable will be used for all inputs
const isLocked = isRecordLockedForUser(formData);
  
const getGridTemplate = () => { 
    if (isMobile) return "none";
    
    // If Full Screen Form is active
    if (isFormExpanded) return "1fr 0fr 0fr";
    
    // If Table View is active
    if (isTableView) {
        // If chat is open: Hide Form (0fr), show Table and Chat
        return isCommentsOpen ? "0fr 2.5fr 1.5fr" : "0fr 1fr 0fr"; 
    }

    // Standard List/Form View
    if (isCommentsOpen) {
        return windowWidth < 1280 ? "1.2fr 1fr 1fr" : "3.5fr 2fr 2fr"; 
    }
    return windowWidth < 1280 ? "1.2fr 0.8fr 0fr" : "4fr 2fr 0fr"; 
};
  
  const renderField = (label: string, name: string, theme: any, options: any = {}) => ( 
      <div style={{ ...styles.inputWrapper, gridColumn: options.full ? "1 / -1" : options.medium ? "span 2" : "auto" }}> 
          <Label style={{...styles.label, color: focusedField === name && !options.disabled ? theme.to : styles.label.color }}> 
            {label} {options.required && <span style={{ color: theme.from, fontSize: "1.2em", lineHeight: 0 }}>*</span>} 
          </Label> 
          <Input 
            name={name} type={options.type || "text"} value={(formData as any)[name] || ""} 
            onChange={(e) => { let value = e.target.value; if (options.uppercase) value = value.toUpperCase(); e.target.value = value; handleChange(e); }}
            onFocus={() => setFocusedField(name)} onBlur={() => setFocusedField(null)} disabled={options.disabled} 
            style={{ ...styles.input(theme, options.disabled, isCompact), borderColor: formErrors[name] ? "#ef4444" : (focusedField === name && !options.disabled ? theme.to : "rgba(255,255,255,0.1)"), textTransform: options.uppercase ? 'uppercase' : 'none' }} autoComplete="off" 
          /> 
          {formErrors[name] && <div style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: 2 }}>{formErrors[name]}</div>} 
      </div> 
  );
  
const getGroupedQueue = (data: any[], groupBy: string) => { 
    const groups: any = {}; 
    data.forEach(item => { 
        // Hierarchy: Event Name -> DR Filename
        if (groupBy === 'EventName_RecordingName') {
            const eventKey = item.EventName || 'Uncategorized Event';
            const drFileKey = item.RecordingName || 'Uncategorized DR File';
            
            if (!groups[eventKey]) groups[eventKey] = {};
            if (!groups[eventKey][drFileKey]) groups[eventKey][drFileKey] = [];
            
            groups[eventKey][drFileKey].push(item);
        } else {
            let key = item[groupBy] || 'Uncategorized';
            if (!groups[key]) groups[key] = []; 
            groups[key].push(item); 
        }
    }); 
    return groups; 
};

  const renderQueueItem = (item: any) => { 
      const isSelected = selectedIndices.has(item._id); const isActive = activeCommentId === item._id; 
      const isItemEditing = editingId === item._id; const currentStatus = item._status || 'incomplete';
      const statusConfig = STATUS_OPTIONS.find(s => s.id === currentStatus) || STATUS_OPTIONS[0];
      const isEditable = canEditEntry(item);

      return (
          <div key={item._id} style={styles.queueItem(isActive, isItemEditing)} onClick={() => handleSelectEntry(item)}>
              <div style={{display: "flex", alignItems: "flex-start", gap: "10px"}}>
                  <div onClick={(e) => toggleSelection(item._id, e)} style={{ paddingTop: 2, flexShrink: 0 }}>{isSelected ? <CheckSquare size={18} color="#10b981" /> : <Square size={18} color="rgba(255,255,255,0.3)" />}</div>
                  <div style={{flex: 1, minWidth: 0 }}>
                      <div title={item.RecordingCode || "Untitled"} style={{ fontWeight: '600', color: isItemEditing ? '#f59e0b' : isActive ? '#3b82f6' : '#fff', fontSize: '0.9rem', marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.RecordingCode || "No Recording Code"}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.EventName}</div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>{item.comments?.length > 0 && (<span style={{fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', color: '#cbd5e1', padding: '1px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3}}><MessageSquare size={10} /> {item.comments.length}</span>)}</div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0, marginTop: -2}}>
              <div style={{position: 'relative'}}>
    <div 
    onClick={(workflow.isValidator || workflow.isIngester || workflow.isAdmin) ? (e) => { 
        e.stopPropagation(); 
        setOpenStatusDropdown(openStatusDropdown === item._id ? null : item._id); 
    } : undefined} 
    style={{ ...styles.statusBadge(currentStatus), cursor: "pointer", width: 'fit-content' }}
>
        <statusConfig.icon size={12} strokeWidth={3} /> 
        {!isCompact && (currentStatus === 'revision' ? 'Needs Revision' : currentStatus)}
    </div>
    
    {/* DROPDOWN MENU */}
    {openStatusDropdown === item._id && !isTableView && (
        <div className="hide-scrollbar" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 5, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 5, zIndex: 50, width: '140px', maxHeight: '300px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>
            {STATUS_OPTIONS
                .filter(opt => getAllowedStatusTransitions(item).includes(opt.id))
                .map(opt => (
                    <div key={opt.id} onClick={(e) => updateStatus(item._id, opt.id, e)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px', fontSize: '0.75rem', color: '#fff', cursor: 'pointer', borderRadius: 4, background: currentStatus === opt.id ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
                        <opt.icon size={14} color={opt.color} /> {opt.label}
                    </div>
                ))
            }
        </div>
    )}
</div>
                   {canEditEntry(item) && (
        <button 
            onClick={(e) => { 
                handleEditClick(item, e); 
            }} 
            style={{ 
                background: 'transparent', 
                border: 'none', 
                color: '#f59e0b', 
                cursor: 'pointer', 
                padding: 5 
            }}
        >
            <Pencil size={16} />
        </button>
    )}
                  </div>
              </div>
          </div>
      );
  };

const renderTableView = () => {
    const groups = getGroupedQueue(queue, groupByField);
    const groupKeys = Object.keys(groups).sort();

    return (
        <div ref={tableContainerRef} style={{ height: "100%", width: "100%", overflow: "auto", position: 'relative' }} className="custom-scrollbar">
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, tableLayout: 'fixed' }}>
                <thead>
                    <tr>
                        {TABLE_COLUMNS.map((col) => {
    const freezeInfo = frozenColumnData[col.id];
    return (
        <th key={col.id} style={{
            ...styles.tableHeader,
            width: colWidths[col.id],
            minWidth: colWidths[col.id],
            maxWidth: colWidths[col.id],
            position: freezeInfo.isFrozen ? 'sticky' : 'static',
            left: freezeInfo.isFrozen ? freezeInfo.left : undefined,
            zIndex: freezeInfo.isFrozen ? 21 : 20,
            // Apply shadow only to the last frozen column
            boxShadow: freezeThreshold === col.id || (col.id === 'actions' && !freezeThreshold)
                ? '2px 0 5px rgba(0,0,0,0.5)'
                : 'none',
            borderRight: freezeInfo.isFrozen ? '1px solid rgba(255,255,255,0.1)' : 'none'
        }}>
                                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                                    {col.id === 'select' ? ( 
                                        <div style={{display: 'flex', justifyContent: 'center', width: '100%'}}>
                                            {groupByField === 'none' && (
                                                <div onClick={() => setSelectedIndices(new Set(queue.map(q => q._id)))} style={{cursor: 'pointer', display: 'flex'}}> 
                                                    {selectedIndices.size === queue.length && queue.length > 0 ? <CheckSquare size={16} color="#10b981"/> : <Square size={16} color="#64748b"/>} 
                                                </div>
                                            )}
                                        </div> 
                                    ) : ( <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis'}}>{col.label}</span> )}
                                    {col.id !== 'select' && ( <div onMouseDown={(e) => handleResizeStart(e, col.id)} style={{ cursor: 'col-resize', padding: '0 2px', opacity: 0.5, marginLeft: 4 }}><GripVertical size={12} /></div> )}
                                </div>
                             </th>
                         );
                         })}
                    </tr>
                </thead>
                <tbody>
                    {groupKeys.map(eventKey => {
                        const eventGroupValue = groups[eventKey];
                        const isHierarchical = groupByField === 'EventName_RecordingName';
                        const isEventExpanded = expandedGroups.has(eventKey);
                        
                        // Calculate total items for the top-level Event folder
                        const eventItems = isHierarchical ? Object.values(eventGroupValue).flat() : eventGroupValue;

                        return (
                        <React.Fragment key={eventKey}>
                            {/* LEVEL 1: EVENT NAME HEADER */}
                            {groupByField !== 'none' && (
                                <tr onClick={() => toggleGroup(eventKey)} style={{ cursor: 'pointer' }}>
                                    <td colSpan={TABLE_COLUMNS.length} style={{ background: '#1e293b', padding: 0, borderTop: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: '40px', zIndex: 15 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', position: 'sticky', left: 0, width: 'max-content' }}>
                                            <div onClick={(e) => handleGroupSelect(eventItems, e)} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginRight: 4 }}>
                                                {eventItems.length > 0 && eventItems.every((item: any) => selectedIndices.has(item._id)) ? <CheckSquare size={16} color="#10b981" /> : <Square size={16} color="#64748b" />}
                                            </div>
                                            {isEventExpanded ? <ChevronDown size={16} color="#3b82f6" /> : <ChevronRight size={16} color="#94a3b8" />}
                                            <LayoutList size={14} color="#3b82f6" style={{opacity: 0.7}} />
                                            <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 800 }}>
                                                {eventKey}
                                                <span style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '1px 8px', borderRadius: '4px', marginLeft: 8 }}>{eventItems.length}</span>
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            
                            {/* LEVEL 2: RECORDING NAME HEADERS (If Hierarchical) */}
                            {isEventExpanded && isHierarchical && Object.keys(eventGroupValue).sort().map(drName => {
                                const drItems = eventGroupValue[drName];
                                const subGroupKey = `${eventKey}_${drName}`;
                                const isDrExpanded = expandedGroups.has(subGroupKey);

                                return (
                                    <React.Fragment key={drName}>
                                        <tr onClick={() => toggleGroup(subGroupKey)} style={{ cursor: 'pointer' }}>
                                            <td colSpan={TABLE_COLUMNS.length} style={{ background: '#16233a', padding: 0, borderTop: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: '76px', zIndex: 14 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px 8px 30px', position: 'sticky', left: 0, width: 'max-content' }}>
                                                    <div onClick={(e) => handleGroupSelect(drItems, e)} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginRight: 4 }}>
                                                        {drItems.length > 0 && drItems.every((item: any) => selectedIndices.has(item._id)) ? <CheckSquare size={14} color="#10b981" /> : <Square size={14} color="#64748b" />}
                                                    </div>
                                                    {isDrExpanded ? <ChevronDown size={14} color="#3b82f6" /> : <ChevronRight size={14} color="#94a3b8" />}
                                                    <FileText size={12} color="#94a3b8" />
                                                    <span style={{ color: '#cbd5e1', fontSize: '0.75rem', fontWeight: 600 }}>
                                                        {drName}
                                                        <span style={{ color: '#3b82f6', marginLeft: 8 }}>({drItems.length})</span>
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* RENDER ITEMS UNDER DR NAME */}
                                        {isDrExpanded && drItems.map((item: any) => renderTableRow(item))}
                                    </React.Fragment>
                                );
                            })}

                            {/* STANDARD VIEW (Non-hierarchical expansion) */}
                            {isEventExpanded && !isHierarchical && eventItems.map((item: any) => renderTableRow(item))}
                        </React.Fragment>
                    )})}
                </tbody>
            </table>
        </div>
    );
};

// Helper function to render a single row for cleaner table logic
const renderTableRow = (item: any) => {
    const isSelected = selectedIndices.has(item._id); 
    const isActive = activeCommentId === item._id; 
    const currentStatus = item._status || 'incomplete';
    const statusConfig = STATUS_OPTIONS.find(s => s.id === currentStatus) || STATUS_OPTIONS[0];

    return (
        <tr 
            key={item._id} 
            // 1. CLICKING THE ROW: Switches to Form View to show Details
            onClick={() => handleSelectEntry(item)} 
            style={styles.tableRow(isActive)}
        >
             {TABLE_COLUMNS.map(col => {
                const freezeInfo = frozenColumnData[col.id];
                const commonStyle: React.CSSProperties = { 
                    ...styles.tableCell, 
                    width: colWidths[col.id], 
                    minWidth: colWidths[col.id], 
                    maxWidth: colWidths[col.id], 
                    position: freezeInfo.isFrozen ? 'sticky' : 'static', 
                    left: freezeInfo.isFrozen ? freezeInfo.left : undefined, 
                    zIndex: freezeInfo.isFrozen ? 5 : undefined, 
                    background: col.frozen || freezeInfo.isFrozen ? (isActive ? '#1e293b' : '#0f172a') : 'transparent',
                    borderRight: freezeInfo.isFrozen ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    boxShadow: freezeThreshold === col.id || (col.id === 'actions' && !freezeThreshold)
                        ? '2px 0 5px rgba(0,0,0,0.5)'
                        : 'none'
                };

                if (col.id === 'select') return <td key={col.id} style={{...commonStyle, textAlign: 'center'}} onClick={(e) => toggleSelection(item._id, e)}>{isSelected ? <CheckSquare size={16} color="#10b981" /> : <Square size={16} color="rgba(255,255,255,0.3)" />}</td>;
                
                if (col.id === 'actions') return (
                    <td key={col.id} style={commonStyle}>
                        <div style={{display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center'}}>
                            {/* 2. CLICKING CHAT ICON: Only opens sidebar, stays on Table View */}
                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); // Stops handleSelectEntry from firing
                                    setActiveCommentId(item._id); 
                                }} 
                                title="Open Chat Only" 
                                style={{background: 'transparent', border: 'none', cursor: 'pointer', color: item.comments?.length > 0 ? '#3b82f6' : '#64748b', padding: 0}}
                            >
                                <MessageSquare size={16} />
                            </button>

                            {/* 3. CLICKING PENCIL ICON: Switches to Form View in Edit Mode */}
                               {canEditEntry(item) && (
                <button 
                    onClick={(e) => handleEditClick(item, e)} 
                    title="Edit Entry" 
                    style={{background: 'transparent', border: 'none', cursor: 'pointer', color: editingId === item._id ? '#f59e0b' : '#64748b', padding: 0}}
                >
                    <Pencil size={15} />
                </button>
            )}
                        </div>
                    </td>
                );
                const allowedTransitions = getAllowedStatusTransitions(item);
            if (col.id === 'status') {
    const allowedTransitions = getAllowedStatusTransitions(item);
    const isDropdownOpen = openStatusDropdown === item._id;

    return (
        <td 
            key={col.id} 
            style={{ 
                ...commonStyle, 
                overflow: 'visible', // Allow dropdown to pop out
                zIndex: isDropdownOpen ? 100 : 1 // Ensure this row stays on top when open
            }}
        >
            {/* FIX: This relative wrapper acts as the anchor for the absolute dropdown */}
            <div style={{ position: 'relative', width: 'fit-content' }}>
                <div 
                    onClick={(allowedTransitions.length > 0) ? (e) => {
                        e.stopPropagation();
                        handleStatusClick(item._id, e);
                    } : undefined} 
                    style={{ 
                        ...styles.statusBadge(currentStatus), 
                        cursor: (allowedTransitions.length > 0) ? "pointer" : "default",
                        opacity: (allowedTransitions.length > 0) ? 1 : 0.7,
                        width: 'fit-content'
                    }}
                >
                    <statusConfig.icon size={12} strokeWidth={3} /> 
                    {statusConfig.label}
                </div>

                {/* DROPDOWN MENU */}
                {isDropdownOpen && (
                    <div className="hide-scrollbar" style={{ 
                        position: 'absolute', 
                        top: '100%', 
                        left: 0, 
                        marginTop: '4px', 
                        background: '#1e293b', 
                        border: '1px solid rgba(255,255,255,0.2)', 
                        borderRadius: '8px', 
                        padding: '5px', 
                        zIndex: 9999, // High z-index to overlap table rows
                        width: '180px', 
                        maxHeight: '250px', 
                        overflowY: 'auto', 
                        boxShadow: '0 10px 30px rgba(0,0,0,0.8)' 
                    }}>
                        {STATUS_OPTIONS
                            .filter(opt => allowedTransitions.includes(opt.id))
                            .map(opt => (
                                <div 
                                    key={opt.id} 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        updateStatus(item._id, opt.id, e);
                                    }} 
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 8, 
                                        padding: '8px', 
                                        fontSize: '0.75rem', 
                                        color: '#fff', 
                                        cursor: 'pointer', 
                                        borderRadius: 4,
                                        background: currentStatus === opt.id ? 'rgba(255,255,255,0.1)' : 'transparent'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentStatus === opt.id ? 'rgba(255,255,255,0.1)' : 'transparent'}
                                >
                                    <opt.icon size={14} color={opt.color} /> {opt.label}
                                </div>
                            ))
                        }
                    </div>
                )}
            </div>
        </td>
    );
}
                
                return <td key={col.id} style={{...commonStyle, fontWeight: (col.id === 'RecordingCode' || col.id === 'MLUniqueID') ? 600 : 400, color: (col.id === 'RecordingCode' || col.id === 'MLUniqueID') ? '#fff' : '#e2e8f0'}} title={item[col.id]}>{item[col.id]}</td>;
            })}
        </tr>
    );
};
  const renderStepIndicator = () => {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Step 1 */}
        <div onClick={() => handleSetStep(1)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: currentStep >= 1 ? 1 : 0.5, transition: 'all 0.2s' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '13px', background: currentStep === 1 ? '#3b82f6' : currentStep > 1 ? '#10b981' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' }}>
                {currentStep > 1 ? <CheckCircle size={14} /> : '1'}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: currentStep === 1 ? 700 : 500, color: currentStep === 1 ? '#fff' : '#94a3b8' }}>Event Details</span>
        </div>
        
        <div style={{ flex: 1, height: '2px', background: currentStep > 1 ? '#10b981' : 'rgba(255,255,255,0.1)', margin: '0 15px', transition: 'all 0.3s' }} />

        {/* Step 2 */}
        <div onClick={() => handleSetStep(2)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: currentStep >= 2 ? 1 : 0.5, transition: 'all 0.2s' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '13px', background: currentStep === 2 ? '#3b82f6' : currentStep > 2 ? '#10b981' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' }}>
                {currentStep > 2 ? <CheckCircle size={14} /> : '2'}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: currentStep === 2 ? 700 : 500, color: currentStep === 2 ? '#fff' : '#94a3b8' }}>DMS Details</span>
        </div>

        <div style={{ flex: 1, height: '2px', background: currentStep > 2 ? '#10b981' : 'rgba(255,255,255,0.1)', margin: '0 15px', transition: 'all 0.3s' }} />

        {/* Step 3 */}
        <div onClick={() => handleSetStep(3)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: currentStep === 3 ? 1 : 0.5, transition: 'all 0.2s' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '13px', background: currentStep === 3 ? '#3b82f6' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' }}>
                3
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: currentStep === 3 ? 700 : 500, color: currentStep === 3 ? '#fff' : '#94a3b8' }}>MediaLog Link</span>
        </div>
      </div>
    );
  };

  if (viewMode === 'hub') {
      const totalItems = queue.length; const completedItems = queue.filter(i => i._status === 'complete').length; const audioMergeProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
     const allProjects = [
  { id: 'audio_merge', title: 'Audio Merge Project', description: 'Ingest, process, and approve new Digital Recordings (DRs) with automated metadata scanning.', icon: Wand2, color: colors.primary, stats: { label: 'In Progress', value: queue.length }, progress: audioMergeProgress, tags: ['Audio', 'Ingest'], isVisible: canViewAudioMerge },
  
  // NEW PROJECT HUB WORKFLOW CARD ADDED HERE
 { 
  id: 'project_hub_workflow', 
  title: 'Submission & Que Sheet', 
  description: 'Create projects, manage media files (DR), and add media logs (ML) with templates and auto-validations.', 
  icon: Layers, 
  color: { from: "#3b82f6", to: "#06b6d4" }, 
  stats: { label: 'New', value: 'System' }, 
  progress: 100, 
  tags: ['DR', 'ML', 'Projects'], 
  status: "APPROVED", 
  isVisible: canViewProjectHubWorkflow // This now correctly points to "Submission & Que Sheet"
},
  { id: 'video_archival', title: 'Wisdom Reels Archival', description: 'Track satsangs used for reels and manage editing workflow.', icon: Video, color: colors.secondary, stats: { label: 'Picked', value: wisdomPickedCount }, progress: wisdomTotalCount > 0 ? Math.round((wisdomPickedCount / wisdomTotalCount) * 100) : 0, tags: ['Video', 'Archive'], status: "PENDING_APPROVAL", isVisible: canViewWisdomReels },
  { id: 'submitters_ml', title: 'Submitters ML', description: 'Manage ML references, extensive searches, and ML summaries by event code.', icon: Users, color: colors.success, stats: { label: 'Modules', value: 5 }, tags: ['ML', 'Search'], status: "APPROVED", isVisible: canViewSubmittersML }
];
      const visibleProjects = allProjects.filter(p => p.isVisible);

      return (
        <div className="px-8 py-10 animate-in fade-in duration-1000" style={{...styles.wrapper, display: 'block', overflowY: 'auto', padding: isMobile ? "20px 10px" : "20px 40px"}}>
          <style>{`.glass-card { background: #131b2e; border-radius: 20px; padding: 24px; position: relative; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.05); } .animate-in { animation: fadeIn 0.5s ease-out forwards; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', width: '100%' }}>
              <div style={{ background: '#131b2e', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '9999px', padding: '4px', display: 'flex', gap: '4px' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {loggedInUser?.picture ? ( <div style={{ padding: '2px', border: '1px solid rgba(245, 158, 11, 0.5)', borderRadius: '50%' }}><Avatar className="w-9 h-9 border-2 border-background cursor-pointer"><AvatarImage src={loggedInUser.picture} alt={loggedInUser.name} /><AvatarFallback>{loggedInUser.name.charAt(0)}</AvatarFallback></Avatar></div> ) : ( <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>G</div> )}
              </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '-20px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.3)' }}><Layout size={24} color="white" /></div>
                  <h1 style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: '800', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, letterSpacing: '-1px' }}>Project Hub</h1>
              </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {visibleProjects.length > 0 ? (
              visibleProjects.map((project) => (
              <div key={project.id} onClick={() => { 
  if(project.id === 'audio_merge') setViewMode('form'); 
  else if(project.id === 'project_hub_workflow') setViewMode('project_hub_workflow'); // Added route here
  else if(project.id === 'video_archival') setViewMode('video_archival'); 
  else if(project.id === 'submitters_ml') setViewMode('submitters_ml'); 
  else toast.info("Project coming soon"); 
}} style={{ background: '#131b2e', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255, 255, 255, 0.05)', position: 'relative', cursor: 'pointer', minHeight: '320px', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <span style={{ padding: '0.35rem 0.85rem', borderRadius: '0.5rem', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: project.status === 'APPROVED' ? '#34d399' : project.status === 'PENDING_APPROVAL' ? '#fbbf24' : '#94a3b8' }}></span>
                  <ArrowRight size={20} color="#64748b" />
                </div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '0.75rem', lineHeight: 1.1 }}>{project.title}</h3>
                <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: 'auto', fontWeight: 500 }}>{project.description}</p>
                <div style={{ marginTop: '2rem' }}>
                  {project.id !== 'submitters_ml' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '0.75rem' }}><span>Completion Status</span><span style={{ color: 'white' }}>{project.progress}%</span></div>
                      <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '9999px', height: '0.35rem', overflow: 'hidden' }}><div style={{ width: `${project.progress}%`, height: '100%', background: '#f59e0b' }} /></div>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                   <div style={{ display: 'flex' }}>
                      {project.id === 'audio_merge' ? ( <>{userList.slice(0, 3).map((u, i) => ( <div key={i} title={u.name} style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid #131b2e', backgroundColor: '#334155', marginLeft: i === 0 ? 0 : '-0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'white', fontWeight: 700 }}>{getInitials(u.name)}</div> ))} {userList.length > 3 && ( <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid #131b2e', backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: '-0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8' }}>+{userList.length - 3}</div> )}</> ) : project.id === 'video_archival' ? ( <>{wisdomUserList.length > 0 ? ( <>{wisdomUserList.slice(0, 3).map((u, i) => ( <div key={i} title={u.name} style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid #131b2e', backgroundColor: '#334155', marginLeft: i === 0 ? 0 : '-0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'white', fontWeight: 700 }}>{getInitials(u.name)}</div> ))} {wisdomUserList.length > 3 && ( <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid #131b2e', backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: '-0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8' }}>+{wisdomUserList.length - 3}</div> )}</> ) : ( <div style={{ fontSize: '0.65rem', color: '#64748b', fontStyle: 'italic' }}>No users</div> )}</> ) : project.id === 'submitters_ml' ? ( <>{submittersMLUserList.length > 0 ? ( <>{submittersMLUserList.slice(0, 3).map((u, i) => ( <div key={i} title={u.name} style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid #131b2e', backgroundColor: '#334155', marginLeft: i === 0 ? 0 : '-0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'white', fontWeight: 700 }}>{getInitials(u.name)}</div> ))} {submittersMLUserList.length > 3 && ( <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid #131b2e', backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: '-0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8' }}>+{submittersMLUserList.length - 3}</div> )}</> ) : ( <div style={{ fontSize: '0.65rem', color: '#64748b', fontStyle: 'italic' }}>No users</div> )}</> ) : ( <>{[1, 2].map(id => ( <div key={id} style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid #131b2e', backgroundColor: '#334155', marginLeft: id === 1 ? 0 : '-0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'white', fontWeight: 700 }}>{id === 1 ? 'JD' : 'AS'}</div> ))} <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid #131b2e', backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: '-0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8' }}>+3</div></> )}
                   </div>
                   <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>{project.stats.value} Items</span>
                </div>
              </div>
            ))
            ) : ( <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "#64748b", padding: "40px" }}>You do not have access to any projects. Please contact an Administrator.</div> )}
          </div>
        </div>
      );
  }

  if (viewMode === 'video_archival') return <div style={styles.wrapper}><VideoArchivalProject onBack={() => setViewMode('hub')} userEmail={userEmail} /></div>;
  if (viewMode === 'submitters_ml') return <div style={styles.wrapper}><SubmittersMLHub onBack={() => setViewMode('hub')} /></div>;
 if (viewMode === 'project_hub_workflow') {
  // Use the same permission check here
  if (!canViewProjectHubWorkflow) {
    return (
      <div style={{ ...styles.wrapper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <Lock size={64} style={{ margin: '0 auto 20px', opacity: 0.5 }} />
          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '10px' }}>Access Denied</h2>
          <p>You do not have permission to access the Submission & Que Sheet.</p>
          <button onClick={() => setViewMode('hub')} style={{ ...styles.resetBtn, width: 'auto', padding: '0 20px' }}>
            Return to Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', padding: '20px', background: '#020617' }}>
      <ProjectHubWorkflow 
        onBack={() => setViewMode('hub')} 
         
      />
    </div>
  );
}
  if (!canViewAudioMerge) {
      return (
          <div style={{ ...styles.wrapper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: '#94a3b8' }}><Lock size={64} style={{ margin: '0 auto 20px', opacity: 0.5 }} /><h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '10px' }}>Access Denied</h2><p>You do not have permission to access the Audio Merge Project form.</p><button onClick={() => setViewMode('hub')} style={{ marginTop: '20px', padding: '10px 20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>Return to Hub</button></div>
          </div>
      );
  }

  return (
    <div style={styles.wrapper}>
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }`}</style>
      
     <div style={styles.header(isCompact)}>
  <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '12px' }}>
      {/* BACK BUTTON */}
      <button onClick={() => setViewMode('hub')} style={{ background: 'transparent', border: `1px solid rgba(255,255,255,0.2)`, borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', cursor: 'pointer', transition: 'all 0.2s' }}>
          <ArrowLeft size={20} />
      </button>

      {/* NEW TOGGLE BUTTON (Outside Form Card) */}
      {!isMobile && !isTableView && (
          <button 
              onClick={() => setIsFormExpanded(!isFormExpanded)}
              style={{ 
                  background: isFormExpanded ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)', 
                  border: `1px solid ${isFormExpanded ? '#3b82f6' : 'rgba(255,255,255,0.2)'}`, 
                  borderRadius: '12px', 
                  padding: '0 15px', 
                  height: 40, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  color: isFormExpanded ? '#3b82f6' : '#fff', 
                  fontSize: '0.75rem', 
                  fontWeight: '700', 
                  cursor: 'pointer', 
                  transition: 'all 0.3s ease' 
              }}
          >
              {isFormExpanded ? (
                  <><ChevronsLeft size={18} /> SHOW QUEUE</>
              ) : (
                  <><ChevronsRight size={18} /> FULL SCREEN</>
              )}
          </button>
      )}
  </div>
  <div style={{ textAlign: 'center' }}>
      <h1 style={styles.title(isCompact)}>Audio Merge Project</h1>
  </div>
</div>

      <input type="file" ref={fileInputRef} onChange={handleFileScan} style={{ display: "none" }} multiple />

      <div style={{ ...styles.mainContainer, display: isMobile ? "flex" : "grid", flexDirection: isMobile ? "column" : "row", gridTemplateColumns: isMobile ? "none" : getGridTemplate(), gap: isCompact ? "12px" : "20px", position: "relative" }}>
        
        {/* COLUMN 1: FORM */}
   {(!isTableView || (isMobile && (showMobileForm || isEditing))) && (
    <div style={{ 
    ...styles.columnScroll, 
    display: isMobile ? ((showMobileForm || isEditing) ? 'block' : 'none') : 'block',
    transition: "all 0.5s ease-in-out",
    width: "100%" 
}} className="hide-scrollbar">

    <div style={styles.unifiedCard(isCompact)}>
        
       

                    {/* Step Wizard Header */}
                    {renderStepIndicator()}

                    {isEditing && <div style={{marginBottom: 15, padding: "8px 12px", background: "rgba(245, 158, 11, 0.1)", border: "1px solid #f59e0b", borderRadius: 8, color: "#f59e0b", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8}}><Pencil size={14}/> Editing Mode - Changes will update the entry</div>}
                    {isViewing && <div style={{marginBottom: 15, padding: "8px 12px", background: "rgba(59, 130, 246, 0.1)", border: "1px solid #3b82f6", borderRadius: 8, color: "#3b82f6", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8}}><Eye size={14}/> View Mode - Read Only</div>}

                    {/* STEP 1: EVENT DETAILS */}
                    {currentStep === 1 && (
                        <div className="animate-in fade-in duration-300" style={styles.sectionBlock}>
                            <SectionTitle icon={Database} title="Event Details" theme={colors.core} />
                            <div style={styles.gridFields}>
                 <SearchableSelect 
    label="Event Code" 
    name="fkEventCode" 
    options={eventCodeOptions.map(opt => `${opt.EventName} - ${opt.EventCode}`)} 
    value={formData.fkEventCode || ""} 
    onChange={handleChange} 
    theme={colors.core} 
    required={true} 
    isCompact={isCompact} 
    full={true} 
    // ADD THIS LINE BELOW:
    disabled={!hasEditAccess || isViewing} 
/>
                                {renderField("Event Name", "EventName", colors.core, { full: true,required: true, disabled: !hasEditAccess || isViewing  })}
                                {renderField("Year", "Yr", colors.core, { required: true, disabled: !hasEditAccess || isViewing  })}
                                {renderField("Event Category", "NewEventCategory", colors.core, {medium: true,required: true, disabled: !hasEditAccess || isViewing  })}
                            </div>
                        </div>
                    )}

                   {/* STEP 2: DMS DETAILS */}
{currentStep === 2 && (
    <div className="animate-in fade-in duration-300" style={styles.sectionBlock}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <SectionTitle icon={FileAudio} title="DMS details" theme={colors.tech} />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!hasEditAccess || isViewing} style={{ background: "rgba(6, 182, 212, 0.15)", color: "#22d3ee", border: "1px solid rgba(6, 182, 212, 0.3)", borderRadius: "6px", padding: "4px 10px", fontSize: "0.75rem", fontWeight: 600, cursor: hasEditAccess && !isViewing ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px", opacity: hasEditAccess && !isViewing ? 1 : 0.5 }}><FileSearch size={14} /> Scan File</button>
        </div>

        <div style={styles.gridFields}>
          {renderField("Audio DRCode", "RecordingCode", colors.core, { 
    required: true, 
    disabled: isViewing // Removed "!hasEditAccess ||" so it works in Edit Mode
})}
            {renderField("Recording Name", "RecordingName", colors.core, { required: true, full: true, disabled: !hasEditAccess || isViewing })}
            
            {/* NEW: Distribution Drive Link (Text field) */}
            {renderField("Distribution Drive Link", "DistributionDriveLink", colors.tech, { full: true, disabled: !hasEditAccess || isViewing })}

           {renderField("Duration", "Duration", colors.tech, { 
    type: "text", 
    pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$", 
    placeholder: "hh:mm:ss", 
    disabled: !hasEditAccess || isViewing 
})}
            
            {/* UPDATED: File Size (Number with decimal support) */}
            {renderField("File Size", "Filesize", colors.tech, { 
                type: "number", 
                step: "0.01", 
                disabled: !hasEditAccess || isViewing 
            })}
            
            {/* UPDATED: Audio Bitrate (Number) */}
            {renderField("Audio Bitrate", "AudioBitrate", colors.tech, { 
                type: "number", 
                disabled: !hasEditAccess || isViewing 
            })}

            {renderField("FilesizeInBytes", "FilesizeInBytes", colors.tech, { type: "number", disabled: !hasEditAccess || isViewing })}
            {renderField("Media Type", "fkMediaName", colors.tech, { disabled: !hasEditAccess || isViewing, uppercase: true })}
            {renderField("No. Of Files", "NoOfFiles", colors.tech, { type: "number", disabled: !hasEditAccess || isViewing })}
            
            <div style={{ gridColumn: "span 2" }}>
                <SearchableSelect label="Master Quality" name="Masterquality" options={MASTER_QUALITY_OPTIONS} value={formData.Masterquality} onChange={handleChange} theme={colors.class} disabled={!hasEditAccess || isViewing} isCompact={isCompact} medium={true} />
            </div>
            {renderField("DMS Remarks", "RecordingRemarks", colors.qc, { full: true, disabled: !hasEditAccess || isViewing })}
        </div>
    </div>
)}

                   {/* STEP 3: MEDIALOG DETAILS */}
{currentStep === 3 && (
  <div className="animate-in fade-in duration-300" style={{...styles.sectionBlock, marginBottom: 0}}>
    {(!isEditing && !isViewing) ? (
      <div style={{ gridColumn: "1 / -1" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <SectionTitle icon={LinkIcon} title="Batch Link MediaLog Entries" theme={colors.tech} />
          
          {/* FILTER BAR */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <AdvancedFiltersClickUp 
              filters={batchFilterConfigs} 
              onFiltersChange={setMlAdvancedFilters} 
              data={mlIdOptions}
            />
            {mlAdvancedFilters.length > 0 && (
              <button 
                onClick={() => setMlAdvancedFilters([])}
                style={{ fontSize: '0.7rem', color: '#f87171', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                Reset Filters
              </button>
            )}

             {/* NEW SORT BUTTON */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setOpenStatusDropdown(openStatusDropdown === 'ml-sort' ? null : 'ml-sort')}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  height: "2rem",
                  padding: "0 12px",
                  backgroundColor: mlSortConfig.key ? "rgba(59, 130, 246, 0.2)" : "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "6px",
                  color: mlSortConfig.key ? "#3b82f6" : "#f1f5f9",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <ArrowUpDown size={14} /> 
                Sort {mlSortConfig.key && `(${BATCH_TABLE_COLUMNS.find(c => c.id === mlSortConfig.key)?.label})`}
              </button>

              {/* SORT POPOVER */}
              {openStatusDropdown === 'ml-sort' && (
                <div style={{
                  position: 'absolute', right: 0, top: '110%', width: '280px', 
                  backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '12px', padding: '16px', zIndex: 1000,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Sort by fields</span>
                    <button onClick={() => setOpenStatusDropdown(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={14}/></button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Field Selector */}
                    <select 
                      value={mlSortConfig.key || ""} 
                      onChange={(e) => setMlSortConfig(prev => ({ ...prev, key: e.target.value }))}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem' }}
                    >
                      <option value="">Select field...</option>
                      {BATCH_TABLE_COLUMNS.map(col => (
                        <option key={col.id} value={col.id}>{col.label}</option>
                      ))}
                    </select>

                    {/* Direction Selector */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select 
                        value={mlSortConfig.direction || "asc"} 
                        onChange={(e) => setMlSortConfig(prev => ({ ...prev, direction: e.target.value as 'asc' | 'desc' }))}
                        style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem' }}
                      >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                      </select>
                      
                      <button 
                        onClick={() => setMlSortConfig({ key: '', direction: 'asc' })}
                        style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#f87171' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RESET ALL BUTTON */}
            {(mlAdvancedFilters.length > 0 || mlSortConfig.key) && (
              <button 
                onClick={() => { setMlAdvancedFilters([]); setMlSortConfig({ key: '', direction: 'asc' }); }}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <RotateCcw size={12} /> Clear All
              </button>
            )}
          </div>
        </div>
          

        

        {!formData.fkEventCode ? (
          <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
            Please select an Event Code to view available MediaLog entries.
          </div>
        ) : filteredAndSortedMlOptions.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: '#f87171', background: 'rgba(239,68,68,0.05)', borderRadius: 8, border: '1px dashed rgba(239,68,68,0.2)', fontSize: '0.85rem' }}>
            No MediaLog entries match your current filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, marginTop: 6, maxHeight: '350px' }} className="custom-scrollbar">
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.75rem', color: '#e2e8f0', textAlign: 'left', tableLayout: 'fixed' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 20 }}>
                <tr>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)', width: 40, minWidth: 40, position: 'sticky', left: 0, background: '#1e293b', zIndex: 21 }}>
                    <div onClick={() => {
                      if (selectedMlIds.size === filteredAndSortedMlOptions.length) setSelectedMlIds(new Set());
                      else setSelectedMlIds(new Set(filteredAndSortedMlOptions.map(opt => opt.MLUniqueID)));
                    }} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                      {selectedMlIds.size === filteredAndSortedMlOptions.length && filteredAndSortedMlOptions.length > 0 ? <CheckSquare size={16} color="#3b82f6" /> : <Square size={16} color="#64748b" />}
                    </div>
                  </th>
            {BATCH_TABLE_COLUMNS.map(col => (
  <th 
    key={col.id} 
    style={{ 
      padding: 0,
      borderBottom: '1px solid rgba(255,255,255,0.1)', 
      width: batchColWidths[col.id], 
      background: '#1e293b',
      position: col.sticky ? 'sticky' : 'static',
      left: col.sticky ? col.left : 'auto',
      zIndex: col.sticky ? 21 : 20,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
      
      {/* 1. Label Area (Trigger Sort on click) */}
      <div 
        onClick={() => handleMlSort(col.id)} 
        style={{ 
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '10px 8px 10px 12px', flex: 1, 
          cursor: 'pointer', overflow: 'hidden', userSelect: 'none'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {col.label}
        </span>
        {mlSortConfig.key === col.id && (
          mlSortConfig.direction === 'asc' ? <ArrowUp size={12} color="#3b82f6" /> : <ArrowDown size={12} color="#3b82f6" />
        )}
      </div>

      {/* 2. Resizer (Does NOT trigger sort) */}
      <div 
        onMouseDown={(e) => { e.stopPropagation(); handleBatchResizeStart(e, col.id); }}
        onClick={(e) => e.stopPropagation()}
        style={{ cursor: 'col-resize', width: '10px', height: '24px', opacity: 0.3 }}
      >
        <GripVertical size={10} />
      </div>
    </div>
  </th>
))}
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedMlOptions.map(opt => {
                  const isSelected = selectedMlIds.has(opt.MLUniqueID);
                  return (
                    <tr key={opt.MLUniqueID} 
                        onClick={() => {
                          const newSet = new Set(selectedMlIds);
                          if (isSelected) newSet.delete(opt.MLUniqueID);
                          else newSet.add(opt.MLUniqueID);
                          setSelectedMlIds(newSet);
                        }}
                        style={{ background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent', cursor: 'pointer' }}
                                                                onMouseEnter={(e) => { if(!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                                                                onMouseLeave={(e) => { if(!isSelected) e.currentTarget.style.background = 'transparent' }}
                                                            >
                                                                <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', left: 0, background: isSelected ? '#16233a' : '#0f172a', zIndex: 1, textAlign: 'center' }}>
                                                                    {isSelected ? <CheckSquare size={16} color="#3b82f6" /> : <Square size={16} color="#64748b" />}
                                                                </td>
                                                                {BATCH_TABLE_COLUMNS.map(col => {
                                                                    const cellValue = col.id === 'Detail' ? `${opt.Detail} ${opt.SubDetail ? `- ${opt.SubDetail}` : ''}` : opt[col.id];
                                                                    return (
                                                                        <td key={col.id} style={{ 
                                                                            padding: '10px 12px', 
                                                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                                            width: batchColWidths[col.id], 
                                                                            minWidth: batchColWidths[col.id],
                                                                            maxWidth: batchColWidths[col.id],
                                                                            whiteSpace: 'nowrap', 
                                                                            overflow: 'hidden', 
                                                                            textOverflow: 'ellipsis',
                                                                            position: col.sticky ? 'sticky' : 'static', 
                                                                            left: col.sticky ? col.left : 'auto', 
                                                                            background: col.sticky ? (isSelected ? '#16233a' : '#0f172a') : 'transparent', 
                                                                            zIndex: col.sticky ? 1 : 'auto', 
                                                                            borderRight: col.sticky ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                                                            fontWeight: col.id === 'MLUniqueID' ? 600 : 400
                                                                        }} title={cellValue}>
                                                                            {cellValue}
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // IF EDITING OR VIEWING: SHOW ORIGINAL SINGLE RECORD FIELDS
                                <div>
                                    <SectionTitle icon={FileAudio} title="MediaLog Details" theme={colors.tech} />
                                    <div style={styles.gridFields}>
                                        <SearchableSelect label="ML Unique ID" name="MLUniqueID" options={mlIdOptions.map(opt => opt.MLUniqueID)} value={formData.MLUniqueID} onChange={handleChange} theme={colors.core} disabled={!hasEditAccess || isViewing} isCompact={isCompact} medium={true} />
                                        {renderField("Detail", "Detail", colors.core, {medium: true, disabled: !hasEditAccess || isViewing })} 
                                        {renderField("SubDetail", "SubDetail", colors.core, {medium: true, disabled: !hasEditAccess || isViewing })} 
                                         {renderField("SubDuration", "SubDuration", colors.core, { disabled: !hasEditAccess || isViewing })}
                                        {renderField("Granth", "fkGranth", colors.core, {medium: true, disabled: !hasEditAccess || isViewing })}
                                        
                                        {renderField("Number", "Number", colors.core, {  disabled: !hasEditAccess || isViewing })}
                                        {renderField("Topic", "Topic", colors.core, { full: true, disabled: !hasEditAccess || isViewing })}
                                         {renderField("SatsangStart", "SatsangStart", colors.core, { disabled: !hasEditAccess || isViewing })}
                                          {renderField("SatsangEnd", "SatsangEnd", colors.core, { disabled: !hasEditAccess || isViewing })}
                                           {renderField("Segment Category", "Segment Category", colors.core, { disabled: !hasEditAccess || isViewing })}
                                        {renderField("Date From", "ContentFrom", colors.core, { disabled: !hasEditAccess || isViewing })}
                                        {renderField("Date To", "ContentTo", colors.core, { disabled: !hasEditAccess || isViewing })}
                                        {renderField("Footage Type", "FootageType", colors.core, { disabled: !hasEditAccess || isViewing })}
                                        {renderField("Editing Status", "EditingStatus", colors.core, { disabled: !hasEditAccess || isViewing })}
                                        {renderField("Remarks", "Remarks", colors.core, {full: true, disabled: !hasEditAccess || isViewing })}
                                        {renderField("CounterFrom", "CounterFrom", colors.core, {full: true, disabled: !hasEditAccess || isViewing })}
                                        {renderField("CounterTo", "CounterTo", colors.core, {full: true, disabled: !hasEditAccess || isViewing })}
                                        {renderField("Footage Sr No", "FootageSrNo", colors.core, { disabled: !hasEditAccess || isViewing })}
                                        {renderField("Log Serial No", "LogSerialNo", colors.core, {full: true, disabled: !hasEditAccess || isViewing })}
                                        
                                       
                                       
                                        
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* WIZARD ACTION BUTTONS */}
                    <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {(isEditing || isViewing) && ( <button type="button" onClick={handleCancelSelection} style={styles.cancelBtn}> {isEditing ? "Cancel Edit" : "Close"} </button> )}
                            {!isEditing && !isViewing && ( <button type="button" onClick={handleResetForm} title="Reset Form" style={styles.resetBtn} disabled={isResetting}> <RotateCcw size={16} className={isResetting ? "animate-spin" : ""} /> </button> )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            {currentStep > 1 && (
                                <button type="button" onClick={() => handleSetStep(currentStep - 1)} style={{...styles.cancelBtn, border: '1px solid rgba(255,255,255,0.2)'}}>Back</button>
                            )}

                            {currentStep < 3 ? (
                                <button type="button" onClick={() => handleSetStep(currentStep + 1)} style={{...styles.addBtn(false, false), width: '120px', flex: 'none'}}>Next</button>
                            ) : isViewing ? ( 
                                <button type="button" onClick={enableEditing} disabled={!isCurrentEntryEditable} title={!isCurrentEntryEditable ? "Only entries marked 'Needs Revision' can be edited." : ""} style={{ ...styles.addBtn(false, true), opacity: isCurrentEntryEditable ? 1 : 0.5, cursor: isCurrentEntryEditable ? 'pointer' : 'not-allowed', width: 'auto' }}> 
                                    <Pencil size={18} style={{marginRight:6}}/> Edit This Entry 
                                </button> 
                            ) : ( 
                                <button type="button" onClick={handleSaveDraft} style={{...styles.addBtn(isEditing, false), padding: '0 20px', width: 'auto'}} disabled={!hasEditAccess} title={!hasEditAccess ? "Only users with edit access can add or update" : ""}> 
                                    {isEditing ? (<> <Save size={18} /> Update Entry </>) : (<> <Plus size={18} /> Add to Queue {selectedMlIds.size > 0 && `(${selectedMlIds.size})`}</>)} 
                                </button> 
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* COLUMN 2: PENDING QUEUE */}
   <div style={{ 
    ...styles.columnScroll, 
    height: "100%", 
    overflowY: "auto", 
    transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
    
    // Slide/Hide Logic
    opacity: isFormExpanded ? 0 : 1,
    transform: isFormExpanded ? "translateX(100px)" : "translateX(0)",
    pointerEvents: isFormExpanded ? "none" : "auto",
    display: isMobile 
        ? ((!showMobileForm && !isEditing && !isCommentsOpen) ? 'block' : 'none') 
        : (isFormExpanded ? 'none' : 'block'), // Hide when Expanded is true
    
    gridColumn: (isTableView) && !isMobile ? (isCommentsOpen ? "1 / span 2" : "1 / -1") : "auto", 
}} className="hide-scrollbar">
            <div style={{ ...styles.queueCard(isCompact), height: "100%", overflowY: "hidden", paddingRight: "8px", display: "flex", flexDirection: "column" }}>
                
            <div style={{...styles.queueHeader, marginBottom: 10, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 10 : 15}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 15}}>
        
        {/* 1. EXPAND/COLLAPSE BUTTON (Moved to the start) */}
       {/* UPDATED EXPAND/COLLAPSE BUTTON */}


        {/* 2. LIST/TABLE TOGGLE */}
        <div style={{ display: 'flex', background: 'rgba(30, 41, 59, 0.5)', borderRadius: 8, padding: 2 }}>
            <button onClick={() => setIsTableView(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, border: 'none', background: !isTableView ? 'rgba(59, 130, 246, 0.2)' : 'transparent', color: !isTableView ? '#fff' : '#94a3b8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                <LayoutList size={14} /> List
            </button>
            <button onClick={() => setIsTableView(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, border: 'none', background: isTableView ? 'rgba(59, 130, 246, 0.2)' : 'transparent', color: isTableView ? '#fff' : '#94a3b8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                <TableProperties size={14} /> Table
            </button>
        </div>

        <span style={{fontSize: '0.9rem', fontWeight: 700}}>Queue ({queue.length})</span>
    </div>

                    <div style={{display:'flex', alignItems: 'center', gap: 15, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-start'}}>
                       {isTableView && queue.length > 0 && (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* FREEZE COLUMN DROPDOWN */}
        <div style={{ position: 'relative' }}>
            <select 
                value={freezeThreshold || ""} 
                onChange={(e) => setFreezeThreshold(e.target.value || null)}
                style={{ 
                    background: 'rgb(35, 56, 90)', 
                    border: '1px solid rgba(59, 130, 246, 0.3)', 
                    color: '#f0f1f3', 
                    fontSize: '0.75rem', 
                    padding: '4px 8px', 
                    borderRadius: 6, 
                    outline: 'none', 
                    cursor: 'pointer',
                    fontWeight: 600
                }}
            >
                <option value="">❄️ Freeze: None</option>
                {TABLE_COLUMNS.slice(2, 10).map(col => (
                    <option key={col.id} value={col.id}>{col.label}</option>
                ))}
            </select>
        </div>
                            <button 
                                onClick={exportToCSV} 
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(59, 130, 246, 0.3)', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)' }}
                                title="Export to CSV"
                            >
                                <Download size={14} /> Export
                            </button>
                        </div>
)}
                        
                         {isTableView && queue.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Group by:</span>
                                <div style={{ position: 'relative' }}>
                                   <select value={groupByField} onChange={(e) => setGroupByField(e.target.value)} style={{ background: '#202d4b', border: '2px solid #474f5c', color: '#ffffff', fontSize: '0.75rem', padding: '6px 10px', borderRadius: 6, outline: 'none', cursor: 'pointer' }}>
                                        <option value="none">None</option>
                                         <option value="EventName_RecordingName">Event DRFilename </option>
                                        <option value="RecordingCode">Recording Code</option>
                                        <option value="_status">Status</option>
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
                        {queue.length > 0 && !isTableView && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <ListFilter size={14} color="#94a3b8" />
                                <select value={groupByField} onChange={(e) => setGroupByField(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.75rem', outline: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                  <option value="EventName_RecordingName">Event DRFilename </option>
                                    <option value="RecordingCode">Recording Code</option>
                                    <option value="_status">Status</option>
                                    <option value="none">None</option>
                                </select>
                            </div>
                        )}
                        {queue.length > 0 && !isTableView && groupByField === 'none' && (<span style={{fontSize: '0.8rem', color: '#94a3b8', cursor: 'pointer'}} onClick={() => setSelectedIndices(new Set(queue.map(q => q._id)))}>Select All</span>)}
                    </div>
                </div>

                {queue.length === 0 ? (
                    <div style={{ padding: "40px 0", textAlign: "center", color: "rgba(255,255,255,0.2)" }}><Inbox size={48} style={{ marginBottom: 10, opacity: 0.5 }} /><p>Empty</p></div>
                ) : (
                    isTableView ? ( renderTableView() ) : (
                        <div style={{ overflowY: 'auto', flex: 1 }} className="hide-scrollbar">
                        {groupByField !== 'none' ? (
    <div style={{ paddingBottom: '100px' }}>
        {(() => {
            const groups = getGroupedQueue(queue, groupByField);
            const groupKeys = Object.keys(groups).sort();

            // --- LEVEL 1: EVENT NAME FOLDERS ---
            if (groupByField === 'EventName_RecordingName') {
             return groupKeys.map(eventKey => {
    const drGroups = groups[eventKey];
    const drFileNames = Object.keys(drGroups).sort();
    const isEventExpanded = expandedGroups.has(eventKey);
    const totalEntriesInEvent = Object.values(drGroups).flat().length;

    return (
        <div key={eventKey} style={{ marginBottom: 4 }}>
            {/* EVENT HEADER */}
            <div onClick={() => toggleGroup(eventKey)} 
                 style={{ ...styles.groupTitle('complete', isEventExpanded), margin: 0, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                {isEventExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />} 
                <LayoutList size={14} style={{ opacity: 0.6 }} />
                <span style={{ flex: 1, color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>{eventKey}</span>
                
                {/* ACTIVE COLOR COUNT FOR EVENT */}
                <span style={{ color: '#3b82f6', fontSize: '0.85rem', fontWeight: '800', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    {totalEntriesInEvent}
                </span>
            </div>

            {isEventExpanded && (
                <div style={{ marginLeft: 12, borderLeft: '1px solid rgba(255,255,255,0.1)', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {drFileNames.map(drName => {
                        const items = drGroups[drName];
                        const subGroupKey = `${eventKey}_${drName}`;
                        const isDrExpanded = expandedGroups.has(subGroupKey);

                        // Inside the drFileNames.map section for List View:
// Inside the drFileNames.map section of List View (around line 1400):
return (
    <div key={drName}>
        <div onClick={() => toggleGroup(subGroupKey)} 
             style={{ ...styles.groupTitle('revision', isDrExpanded), margin: '2px 0', padding: '6px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
            <div onClick={(e) => handleGroupSelect(items, e)} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginRight: 4 }}>
                {items.length > 0 && items.every((item: any) => selectedIndices.has(item._id)) ? <CheckSquare size={14} color="#10b981" /> : <Square size={14} color="#64748b" />}
            </div>
            
            <FileText size={12} style={{ opacity: 0.6, marginLeft: 4 }} />
            <span style={{ fontSize: '0.75rem', flex: 1, color: '#cbd5e1', fontWeight: 500 }}>{drName}</span>
            
            <span style={{ color: '#3b82f6', fontSize: '0.75rem', fontWeight: '700' }}>
                {items.length}
            </span>
        </div>

        {/* Individual cards are no longer rendered here */}
    </div>
);
                    })}
                </div>
            )}
        </div>
    );
});
            }

            // STANDARD SINGLE-LEVEL GROUPING (Status, etc.)
            return groupKeys.map(groupKey => {
                const groupItems = groups[groupKey];
                const isExpanded = expandedGroups.has(groupKey);
                let displayLabel = groupKey;
                if (groupByField === '_status') displayLabel = STATUS_OPTIONS.find(s => s.id === groupKey)?.label || groupKey;
                
                return (
                    <div key={groupKey}>
                        <div onClick={() => toggleGroup(groupKey)} style={styles.groupTitle(groupKey, isExpanded)}>
                            <div onClick={(e) => handleGroupSelect(groupItems, e)} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginRight: 4 }}>
                                {groupItems.length > 0 && groupItems.every((item: any) => selectedIndices.has(item._id)) ? <CheckSquare size={14} color="#10b981" /> : <Square size={14} color="#64748b" />}
                            </div>
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />} 
                            <span style={{flex: 1}}>{displayLabel}</span>
                            <span>({groupItems.length})</span>
                        </div>
                        {isExpanded && groupItems.map(renderQueueItem)}
                    </div>
                );
            });
        })()}
    </div>
) : (
    queue.map(renderQueueItem)
)}
                        </div>
                    )
                )}

                {isMobile && !showMobileForm && !isEditing && !isCommentsOpen && hasEditAccess && (
                     <button onClick={() => setShowMobileForm(true)} style={{ position: "fixed", bottom: queue.length > 0 && selectedIndices.size > 0 ? "90px" : "30px", right: "20px", width: "56px", height: "56px", borderRadius: "28px", background: "linear-gradient(to right, #6366f1, #a855f7)", color: "white", border: "none", boxShadow: "0 8px 24px rgba(99, 102, 241, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, cursor: "pointer" }}><Plus size={28} /></button>
                )}
            </div>
        </div>

        {/* COLUMN 3: COMMUNICATION / DETAILS */}
        {isCommentsOpen && !(isMobile && (showMobileForm || isEditing)) ? (
            <div style={{ ...styles.commentCard, gridColumn: isMobile ? '1' : isTablet ? '2' : 'auto', zIndex: 100, ...(isMobile ? { position: 'fixed', inset: 0, borderRadius: 0, height: '100dvh', background: '#0b1120' } : {}) }}>
                <div style={styles.chatHeader}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                        <div><h4 style={{margin: 0, color: '#fff', fontSize: '0.95rem', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{activeEntry.EventName}</h4><span style={{fontSize: '0.75rem', color: '#3b82f6'}}>{activeEntry.fkEventCode}</span></div>
                        <button onClick={handleCloseComments} style={{background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6}}>{isMobile ? <><ArrowLeft size={18} /> Back</> : <X size={18} />}</button>
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
                    {showUserDropdown && ( 
                        <div style={{ position: "absolute", bottom: "100%", left: 10, marginBottom: 10, background: "#1e293b", border: "1px solid #3b82f6", borderRadius: 12, zIndex: 100, padding: "8px 0", boxShadow: "0 -4px 20px rgba(0,0,0,0.5)", width: "280px", maxWidth: "90vw", maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column" }} className="hide-scrollbar"> 
                            <div style={{padding: "4px 12px", fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, position: 'sticky', top: 0, background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>Select User</div> 
                            {userList.length > 0 ? ( userList.map((u, idx) => ( <div key={idx} style={{ padding: "8px 12px", cursor: "pointer", color: "#fff", fontSize: "0.85rem", borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 2 }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"} onClick={() => { setCommentInput(commentInput + `@${u.name} `); setShowUserDropdown(false); }}> <div style={{fontWeight: 600}}>{u.name}</div> <div style={{fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={u.email}>{u.email}</div> </div> )) ) : ( <div style={{padding: "12px", color: "#94a3b8", fontSize: "0.8rem", textAlign: "center"}}>Loading users...</div> )} 
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
        <div style={{ ...styles.actionBar, bottom: isMobile ? "20px" : "30px", left: "50%", transform: "translateX(-50%)", width: isMobile ? "calc(100% - 40px)" : "auto", justifyContent: "space-between", padding: isMobile ? "10px 15px" : "10px 20px" }}>
            <span style={{ color: "#fff", fontSize: "0.9rem", fontWeight: 600 }}>{selectedIndices.size} Selected</span>
             <button 
            type="button" 
            onClick={handleUploadSelected} 
            // 1. Only Validator can click this
            // 2. Only if items are selected
            disabled={!workflow.isValidator || selectedIndices.size === 0} 
            style={{ 
                ...styles.addBtn(false, false),
                background: `linear-gradient(to right, #10b981, #059669)`,
                opacity: (!workflow.isValidator || selectedIndices.size === 0) ? 0.5 : 1,
                cursor: (!workflow.isValidator || selectedIndices.size === 0) ? 'not-allowed' : 'pointer',
            }}
        >
            {isSubmitting ? <Activity className="animate-spin" /> : <UploadCloud />} 
            Approve Selected
        </button>
        </div>
      )}

     

      {/* --- MULTIPLE ADD CONFIRMATION MODAL --- */}
      {showMultiAddConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="animate-in fade-in zoom-in duration-200" style={{ background: '#1e293b', border: '1px solid #3b82f6', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#3b82f6' }}>
                    <ListChecks size={28} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#fff' }}>Confirm Batch Add</h3>
                </div>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
                    Are you sure you want to add the following MediaLog entries to the queue for Recording Code <strong style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>{formData.RecordingCode || 'N/A'}</strong>?
                </p>
                <div style={{ marginTop: '5px', maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }} className="custom-scrollbar">
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#fff', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {Array.from(selectedMlIds).map(id => (
                            <li key={id} style={{ fontWeight: 600, color: '#3b82f6', letterSpacing: '0.5px' }}>{id}</li>
                        ))}
                    </ul>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px', gap: '10px' }}>
                    <button onClick={() => setShowMultiAddConfirm(false)} style={styles.cancelBtn}>Cancel</button>
                    <button 
                        onClick={processAddQueue} disabled={isSubmitting}
                        style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        {isSubmitting ? <><Activity className="animate-spin" size={16}/> Processing</> : 'Confirm & Add'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- DUPLICATE DR WARNING MODAL --- */}
      {duplicateWarning && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="animate-in fade-in zoom-in duration-200" style={{ background: '#1e293b', border: '1px solid #ef4444', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444' }}>
                    <AlertCircle size={28} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#fff' }}>Duplicate Combination</h3>
                </div>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
                    The entry <strong style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>{duplicateWarning}</strong> is already present in the queue!
                    <br/><br/>
                    Please verify your Recording Code and ML ID selection.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button onClick={() => setDuplicateWarning(null)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>Got it</button>
                </div>
            </div>
        </div>
      )}

      {/* --- DURATION/DRIFT VALIDATION ERROR MODAL --- */}
{validationError && (
  <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="animate-in fade-in zoom-in duration-200" style={{ background: '#1e293b', border: '1px solid #f59e0b', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* HEADER SECTION: Changed color to Orange and Icon to AlertTriangle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#f59e0b' }}>
              <AlertTriangle size={28} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#fff' }}>{validationError.title}</h3>
          </div>
          
          {/* WARNING MESSAGE BOX: Changed background/border to match warning theme */}
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '12px', borderRadius: '8px' }}>
              <p style={{ color: '#fbbf24', fontSize: '0.95rem', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
                  {validationError.message}
              </p>
          </div>

          <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>
              Tip: Ensure your duration matches the MediaLog duration within 60 seconds and follows the HH:MM:SS format.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button 
                onClick={() => setValidationError(null)} 
                style={{ 
                    background: '#f59e0b', 
                    color: '#000', // Black text looks better on yellow background
                    border: 'none', 
                    borderRadius: '8px', 
                    padding: '10px 24px', 
                    fontWeight: 700, 
                    cursor: 'pointer', 
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#d97706'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f59e0b'}
              >
                  Close
              </button>
          </div>
      </div>
  </div>
)}
    </div>
  );
} 