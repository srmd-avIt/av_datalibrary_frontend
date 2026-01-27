

import React, { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { 
  Save, FileAudio, Database, Activity, CheckCircle, 
  Sparkles, Layers, Plus, ListChecks, Trash2, UploadCloud, 
  CheckSquare, Square, Inbox, Pencil, X, MessageSquare, Send, Eye, RotateCcw,
  AlertCircle, XCircle, ChevronDown, ChevronRight, CheckCircle2, ListFilter, Loader2,
  AtSign, CornerUpLeft
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const API_BASE_URL = (import.meta as any).env.VITE_API_URL;

const STORAGE_KEY = "mis_queue_data_v1";

// --- STYLES ---

const colors = {
    core: { from: "#f43f5e", to: "#ec4899", shadow: "rgba(244, 63, 94, 0.2)" },
    tech: { from: "#06b6d4", to: "#3b82f6", shadow: "rgba(6, 182, 212, 0.2)" },
    class: { from: "#8b5cf6", to: "#d946ef", shadow: "rgba(139, 92, 246, 0.2)" },
    qc: { from: "#f59e0b", to: "#f97316", shadow: "rgba(245, 158, 11, 0.2)" },
    bg: "#0f172a", text: "#ffffff", inputBg: "rgba(0, 0, 0, 0.3)",
};

const styles = {
  wrapper: {
    height: "100vh", 
    width: "100%", 
    backgroundColor: "#020617",
    backgroundImage: `radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.1) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(244, 63, 94, 0.1) 0px, transparent 50%)`,
    padding: "20px", 
    fontFamily: "'Inter', sans-serif", 
    color: colors.text, 
    overflow: "hidden", 
    display: "flex",
    flexDirection: "column" as "column",
  },
  
  header: {
    height: "80px", 
    flexShrink: 0,
    marginBottom: "20px",
    textAlign: "center" as "center",
  },
  title: {
    fontSize: "2rem", fontWeight: "800", background: "linear-gradient(to right, #fff, #94a3b8)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "8px", letterSpacing: "-0.5px",
  },

  // --- 3-COLUMN FIXED GRID LAYOUT ---
  mainContainer: {
    display: "grid",
    gridTemplateColumns: (commentsOpen: boolean) => commentsOpen ? "3.5fr 2fr 2fr" : "4fr 2fr 0fr",
    gap: "20px",
    width: "100%",
    maxWidth: "1800px",
    margin: "0 auto",
    flex: 1, 
    minHeight: 0, 
    transition: "all 0.3s ease", 
  },

  columnScroll: {
    height: "100%",
    overflowY: "auto" as "auto",
    paddingRight: "8px", 
    paddingBottom: "100px", 
  },

  unifiedCard: {
    background: "rgba(30, 41, 59, 0.7)", 
    backdropFilter: "blur(20px)", 
    border: "1px solid rgba(255, 255, 255, 0.08)", 
    borderRadius: "20px", 
    padding: "24px", 
    width: "100%",
    boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.5)",
  },

  queueCard: {
    background: "rgba(15, 23, 42, 0.6)", 
    backdropFilter: "blur(20px)", 
    border: "1px solid rgba(255, 255, 255, 0.08)", 
    borderRadius: "20px", 
    padding: "20px", 
    width: "100%",
  },

  commentCard: {
    background: "#0f172a", 
    border: "1px solid rgba(255, 255, 255, 0.08)", 
    borderRadius: "20px", 
    display: "flex", 
    flexDirection: "column" as "column", 
    height: "100%", 
    overflow: "hidden", 
    boxShadow: "-10px 0 30px rgba(0,0,0,0.3)",
  },

  queueItem: (isActive: boolean, isEditing: boolean) => ({
    background: isEditing 
        ? "rgba(245, 158, 11, 0.1)" 
        : isActive 
            ? "linear-gradient(90deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05))" 
            : "rgba(30, 41, 59, 0.4)",
    borderLeft: isEditing ? "4px solid #f59e0b" : isActive ? "4px solid #3b82f6" : "4px solid transparent",
    border: "1px solid rgba(255,255,255,0.05)", borderLeftWidth: "4px",
    borderRadius: "8px", padding: "16px", marginBottom: "10px", cursor: "pointer", transition: "all 0.2s ease",
  }),

  chatHeader: { padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(30, 41, 59, 0.5)" },
  chatBody: { flex: 1, overflowY: "auto" as "auto", padding: "20px", display: "flex", flexDirection: "column" as "column", gap: "15px" },
  chatFooter: { padding: "15px", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(30, 41, 59, 0.5)", display: "flex", gap: "10px", position: "relative" as "relative" },
  msgBubble: (isSystem: boolean) => ({
    alignSelf: isSystem ? "center" : "flex-start", background: isSystem ? "transparent" : "rgba(59, 130, 246, 0.15)",
    padding: isSystem ? "5px" : "10px 14px", borderRadius: "12px", borderBottomLeftRadius: isSystem ? "12px" : "2px",
    maxWidth: "90%", fontSize: "0.85rem", color: isSystem ? "#64748b" : "#e2e8f0", border: isSystem ? "none" : "1px solid rgba(59, 130, 246, 0.2)",
  }),
  
  sectionBlock: { marginBottom: "24px" },
  sectionHeader: (theme: any) => ({
    display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", paddingBottom: "10px", borderBottom: `1px solid rgba(255,255,255,0.05)`,
  }),
  iconBox: (theme: any) => ({
    width: "28px", height: "28px", borderRadius: "6px", background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
    display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 16px -4px ${theme.shadow}`, color: "#fff",
  }),
  sectionTitle: { fontSize: "0.95rem", fontWeight: "700", color: "#fff", margin: 0 },
  gridFields: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", rowGap: "16px" },
  inputWrapper: { display: "flex", flexDirection: "column" as "column", gap: "6px" },
  label: { fontSize: "0.65rem", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" as "uppercase", letterSpacing: "0.05em" },
  
  // Basic input style
  input: (theme: any, disabled: boolean) => ({
    backgroundColor: disabled ? "rgba(255,255,255,0.03)" : colors.inputBg, 
    border: "1px solid rgba(255,255,255,0.1)", 
    color: disabled ? "#94a3b8" : "#fff", 
    height: "38px",
    borderRadius: "8px", padding: "0 12px", transition: "all 0.2s ease", outline: "none", fontSize: "0.85rem", width: "100%",
    cursor: disabled ? "default" : "text"
  }),

  // Dropdown UI
  dropdownContainer: { position: 'relative' as 'relative', width: '100%' },
  dropdownList: {
    position: 'absolute' as 'absolute', top: '100%', left: 0, width: '100%',
    maxHeight: '200px', overflowY: 'auto' as 'auto',
    backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', zIndex: 1000, marginTop: '4px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
  },
  dropdownItem: {
    padding: '8px 12px', fontSize: '0.85rem', color: '#fff', cursor: 'pointer',
    borderBottom: '1px solid rgba(255,255,255,0.05)'
  },

  actionBar: {
    position: "absolute" as "absolute", bottom: "30px", left: "50%", transform: "translateX(-50%)",
    background: "rgba(15, 23, 42, 0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.1)",
    padding: "10px 20px", borderRadius: "100px", display: "flex", alignItems: "center", gap: "20px", boxShadow: "0 10px 50px rgba(0,0,0,0.8)", zIndex: 100,
  },
  addBtn: (isEditing: boolean, isViewing: boolean) => ({
    background: isEditing 
        ? `linear-gradient(to right, #f59e0b, #d97706)` 
        : isViewing 
            ? `rgba(255,255,255,0.1)` 
            : `linear-gradient(to right, #6366f1, #a855f7)`, 
    border: isViewing ? "1px solid rgba(255,255,255,0.2)" : "none",
    borderRadius: "8px", padding: "0 30px", height: "40px", fontSize: "0.9rem", fontWeight: "600", color: "white",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", flex: 1, 
  }),
  resetBtn: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    width: "44px", height: "40px",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#94a3b8", cursor: "pointer",
    transition: "all 0.2s ease",
  },
  cancelBtn: {
    background: "transparent", border: `1px solid rgba(255,255,255,0.2)`, borderRadius: "8px", padding: "0 20px",
    height: "40px", color: "#cbd5e1", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem",
  },
  queueHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 8,
    borderBottom: "1px solid rgba(255,255,255,0.07)"
  },
  
  statusBadge: (status: string) => {
    let bg, color, border;
    switch(status) {
        case 'complete': bg="rgba(16, 185, 129, 0.15)"; color="#34d399"; border="#059669"; break;
        case 'revision': bg="rgba(59, 130, 246, 0.15)"; color="#60a5fa"; border="#2563eb"; break;
        default:         bg="rgba(239, 68, 68, 0.15)";  color="#f87171"; border="#dc2626"; break;
    }
    return {
        display: "flex", alignItems: "center", gap: 5,
        fontSize: "0.65rem", fontWeight: "700", textTransform: "uppercase" as "uppercase",
        background: bg, color: color, border: `1px solid ${border}`,
        padding: "2px 8px", borderRadius: "100px", cursor: "pointer",
        transition: "all 0.2s"
    };
  },

  groupTitle: (status: string, isActive: boolean) => ({
      color: status === 'complete' ? '#34d399' : status === 'revision' ? '#60a5fa' : '#f87171',
      fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' as 'uppercase',
      marginTop: 20, marginBottom: 10, padding: "8px 5px",
      display: 'flex', alignItems: 'center', gap: 8,
      cursor: 'pointer',
      opacity: isActive ? 1 : 0.7,
      transition: "opacity 0.2s"
  })
};

// --- STATUS CONFIGURATION ---
const STATUS_OPTIONS = [
    { id: 'incomplete', label: 'Incomplete', icon: XCircle, color: '#ef4444' },
    { id: 'revision',   label: 'Needs Revision', icon: AlertCircle, color: '#3b82f6' },
    { id: 'complete',   label: 'Complete', icon: CheckCircle2, color: '#10b981' },
];

// --- COMPONENTS ---

const FormField = ({ label, name, theme, type = "text", required = false, full = false, value, onChange, onFocus, onBlur, isFocused, disabled }: any) => {
    return (
      <div style={{ ...styles.inputWrapper, gridColumn: full ? "1 / -1" : "auto" }}>
        <Label style={{...styles.label, color: isFocused && !disabled ? theme.to : styles.label.color }}>
          {label} {required && <span style={{ color: theme.from, fontSize: "1.2em", lineHeight: 0 }}>*</span>}
        </Label>
        <Input 
            name={name} type={type} value={value} onChange={onChange} onFocus={onFocus} onBlur={onBlur} disabled={disabled}
            style={{...styles.input(theme, disabled), borderColor: isFocused && !disabled ? theme.to : "rgba(255,255,255,0.1)"}} 
            autoComplete="off" 
        />
      </div>
    );
};

// --- UPGRADED SEARCHABLE SELECT (With Infinite Scroll) ---
const SearchableSelect = ({ label, name, options, value, onChange, theme, required, disabled, full }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [displayLimit, setDisplayLimit] = useState(50); 
    
    const wrapperRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter((opt: string) => 
        String(opt).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const visibleOptions = filteredOptions.slice(0, displayLimit);

    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setDisplayLimit(50);
        }
    }, [isOpen]);

    useEffect(() => {
        setDisplayLimit(50);
    }, [searchTerm]);

    const handleSelect = (val: string) => {
        onChange({ target: { name, value: val } }); 
        setIsOpen(false);
        setSearchTerm("");
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollTop + clientHeight >= scrollHeight - 20) {
            if (displayLimit < filteredOptions.length) {
                setDisplayLimit(prev => prev + 50);
            }
        }
    };

    return (
        <div style={{ ...styles.inputWrapper, gridColumn: full ? "1 / -1" : "auto" }} ref={wrapperRef}>
            <Label style={{...styles.label, color: isOpen ? theme.to : styles.label.color }}>
                {label} {required && <span style={{ color: theme.from, fontSize: "1.2em", lineHeight: 0 }}>*</span>}
            </Label>
            <div style={styles.dropdownContainer}>
                <Input
                    name={name}
                    value={isOpen ? searchTerm : value}
                    onChange={(e) => {
                        if (isOpen) setSearchTerm(e.target.value);
                        else onChange(e); 
                    }}
                    onFocus={() => {
                        if (!disabled) {
                            setIsOpen(true);
                            setSearchTerm("");
                        }
                    }}
                    placeholder={isOpen ? "Type to search..." : "Select or type..."}
                    style={{...styles.input(theme, disabled), borderColor: isOpen ? theme.to : "rgba(255,255,255,0.1)"}}
                    disabled={disabled}
                    autoComplete="off"
                />
                
                {isOpen && !disabled && (
                    <div 
                        style={styles.dropdownList} 
                        className="hide-scrollbar" 
                        onScroll={handleScroll}
                        ref={listRef}
                    >
                        {visibleOptions.length > 0 ? (
                            <>
                                {visibleOptions.map((opt: string, idx: number) => (
                                    <div 
                                        key={idx} 
                                        style={styles.dropdownItem}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                        onClick={() => handleSelect(opt)}
                                    >
                                        {opt}
                                    </div>
                                ))}
                                {displayLimit < filteredOptions.length && (
                                    <div style={{...styles.dropdownItem, textAlign: 'center', color: '#64748b', fontSize: '0.75rem'}}>
                                        <Loader2 className="animate-spin inline-block mr-2" size={12}/> Loading more...
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{...styles.dropdownItem, color: '#94a3b8', cursor: 'default'}}>No matches found</div>
                        )}
                    </div>
                )}
                <div style={{position: 'absolute', right: 10, top: 10, pointerEvents: 'none', color: '#64748b'}}>
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
            </div>
        </div>
    );
};

const SectionTitle = ({ icon: Icon, title, theme }: any) => (
    <div style={styles.sectionHeader(theme)}>
        <div style={styles.iconBox(theme)}><Icon size={16} /></div>
        <h3 style={styles.sectionTitle}>{title}</h3>
    </div>
);

// --- MAIN COMPONENT ---

export function GoogleSheetForm({ config, userEmail }: { config: any; userEmail?: string }) {
  const { user: loggedInUser } = useAuth();

  const hasEditAccess =
  (loggedInUser?.role === "Admin" || loggedInUser?.role === "Owner") ||
  !!loggedInUser?.permissions?.some(
    (p: any) =>
      (p.resource === "Digital Recordings" || p.resource === "Audio Merge Project") &&
      p.actions.includes("write")
  );

  const hasViewOnlyAccess =
    !!loggedInUser?.permissions?.some(
      (p: any) =>
        (p.resource === "Digital Recordings" || p.resource === "Audio Merge Project") &&
        p.actions.length === 1 &&
        p.actions.includes("read")
    );

  const canApprove = hasEditAccess;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const [isResetting, setIsResetting] = useState(false);
  const [isGrouped, setIsGrouped] = useState(false); 
  
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['incomplete', 'revision', 'complete']));

  // --- DROPDOWN OPTIONS STATE ---
  const [eventCodeOptions, setEventCodeOptions] = useState<{ EventCode: string, EventName: string }[]>([]);
  
  // UPDATED: Store Objects containing ID and Detail
  const [mlIdOptions, setMlIdOptions] = useState<{ MLUniqueID: string, Detail: string }[]>([]);
  
  // --- FETCH OPTIONS ON MOUNT ---
  useEffect(() => {
      const fetchOptions = async () => {
          try {
              const cleanBase = API_BASE_URL.replace(/\/api\/?$/, '');

              // Fetch Event Codes
              const ecRes = await fetch(`${cleanBase}/api/event-code/options`);
              if (ecRes.ok) {
                const ecData = await ecRes.json();
                setEventCodeOptions(ecData); 
              }

              // Fetch ML IDs (now containing Detail)
              const mlRes = await fetch(`${cleanBase}/api/ml-unique-id/options`);
              if (mlRes.ok) {
                  const mlData = await mlRes.json();
                  // Store the full object (ID + Detail)
                  setMlIdOptions(mlData);
              }
              // Removed Fetch Recording Options as they are now manual fields

          } catch (error) {
              console.error("Failed to fetch dropdown options", error);
          }
      };

      fetchOptions();
  }, []);

  // --- QUEUE LOGIC ---
  const [queue, setQueue] = useState<any[]>(() => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  }, [queue]);

  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null); 
  const [editingId, setEditingId] = useState<number | null>(null); 
  const [openStatusDropdown, setOpenStatusDropdown] = useState<number | null>(null); 
  
  // --- CHAT STATE ---
  const [commentInput, setCommentInput] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null); 
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null); 
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userList, setUserList] = useState<string[]>(["user1@org.com", "user2@org.com", "admin@org.com"]);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const activeEntry = queue.find(q => q._id === activeCommentId);

  const initialFormState = {
    fkEventCode: "", EventName: "", RecordingName: "", RecordingCode: "", Duration: "",
    DistributionDriveLink: "", BitRate: "", Dimension: "", Masterquality: "",
    fkMediaName: "", Filesize: "", FilesizeInBytes: "", NoOfFiles: "",
    RecordingRemarks: "", CounterError: "", ReasonError: "", MasterProductTitle: "",
    fkDistributionLabel: "", ProductionBucket: "", fkDigitalMasterCategory: "",
    AudioBitrate: "", AudioTotalDuration: "", QcRemarksCheckedOn: "",
    PreservationStatus: "", QCSevak: "", QcStatus: "", SubmittedDate: "",
    PresStatGuidDt: "", InfoOnCassette: "", IsInformal: "", AssociatedDR: "",
    Teams: "", MLUniqueID: "", Detail: "", AudioWAVDRCode: ""
  };

  const [formData, setFormData] = useState(initialFormState);

  // --- OPTIMIZED HANDLER LOGIC ---
  const handleChange = async (e: any) => {
    const { name, value } = e.target;
    
    // Auto-fill Event Code when Event Name is selected
    if (name === "EventName") {
      const selectedEvent = eventCodeOptions.find(opt => opt.EventName === value);
      setFormData(prev => ({
        ...prev,
        EventName: value,
        fkEventCode: selectedEvent ? selectedEvent.EventCode : prev.fkEventCode
      }));
    }

    // --- ML UNIQUE ID SELECTED ---
    else if (name === "MLUniqueID") {
        // Find the full object from our cached list
        const selectedML = mlIdOptions.find(opt => opt.MLUniqueID === value);
        
        setFormData(prev => ({
            ...prev,
            MLUniqueID: value,
            // Auto-fill Detail field
            Detail: selectedML ? (selectedML.Detail || "") : prev.Detail
        }));
    }
    
    // Default logic (Includes RecordingName and RecordingCode which are now manual)
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    if (chatBottomRef.current) {
        chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeEntry?.comments, activeCommentId]);

  // --- ACTIONS ---

  const handleSelectEntry = (item: any) => {
    setFormData(item);
    setActiveCommentId(item._id); 
    setEditingId(null); 
  };

  const handleEditClick = (item: any, e: any) => {
    e.stopPropagation();
    setFormData(item);
    setActiveCommentId(item._id);
    setEditingId(item._id); 
  };

  const enableEditing = () => {
    if(activeCommentId) setEditingId(activeCommentId);
  };

  const handleStatusClick = (id: number, e: any) => {
    e.stopPropagation();
    if (openStatusDropdown === id) setOpenStatusDropdown(null);
    else setOpenStatusDropdown(id);
  };

  const updateStatus = (id: number, newStatus: string, e: any) => {
    e.stopPropagation();
    setQueue(prev => prev.map(item => item._id === id ? { ...item, _status: newStatus } : item));
    setOpenStatusDropdown(null);
  };

  const toggleGroup = (group: string) => {
    const newSet = new Set(expandedGroups);
    if (newSet.has(group)) newSet.delete(group);
    else newSet.add(group);
    setExpandedGroups(newSet);
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fkEventCode || !formData.RecordingCode) {
        toast.error("Event Code and Recording Code are required.");
        return;
    }

    if (editingId) {
        setQueue(prev => prev.map(item => {
            if (item._id === editingId) {
                return { ...formData, _id: editingId, comments: item.comments, _status: item._status || 'incomplete' }; 
            }
            return item;
        }));
        
        setEditingId(null); 
        setFormData(initialFormState); 
        setActiveCommentId(null); 
        toast.success("Entry Updated");
    } else {
        const newItem = { ...formData, _id: Date.now(), comments: [], _status: 'incomplete' };

        try {
            const token = localStorage.getItem('app-token');
            await fetch(`${API_BASE_URL}/google-sheet/digital-recordings`, {
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
            toast.success("Added to Google Sheet");
        } catch (error) {
            toast.error("Failed to add to Google Sheet");
        }

        setQueue(prev => [newItem, ...prev]);
        toast.success("Added to Queue");
        setFormData(initialFormState);
    }
  };

  const handleResetForm = () => {
      setIsResetting(true);
      setFormData(initialFormState);
      toast.info("Form Cleared");
      setTimeout(() => setIsResetting(false), 700); 
  };

  const handleCancelSelection = () => {
    setEditingId(null);
    setActiveCommentId(null);
    setFormData(initialFormState);
  };

  const handleCloseComments = () => {
    setActiveCommentId(null);
  };

  const handleSendComment = async () => {
    if (!commentInput.trim() || !activeCommentId) return;

    setQueue(prev => prev.map(item => {
        if (item._id === activeCommentId) {
            let updatedComments;
            // Edit
            if (editingCommentId) {
                updatedComments = item.comments.map((c: any) => 
                    c.id === editingCommentId 
                        ? { ...c, text: commentInput, isEdited: true } 
                        : c
                );
            } 
            // New
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

            fetch(`${API_BASE_URL}/google-sheet/digital-recordings`, {
                method: "POST",
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

  const handleEditCommentAction = (comment: any) => {
      setCommentInput(comment.text);
      setEditingCommentId(comment.id);
      setReplyTo(null); 
      const inputEl = document.getElementById("chat-input-field");
      if(inputEl) inputEl.focus();
  };

  const handleDeleteComment = (commentId: number) => {
    if (!activeCommentId) return;
    if (!window.confirm("Delete this message?")) return;

    setQueue(prev => prev.map(item => {
        if (item._id === activeCommentId) {
            const updatedComments = item.comments.filter((c: any) => c.id !== commentId);
            fetch(`${API_BASE_URL}/google-sheet/digital-recordings`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...item, Logchats: formatLogchats(updatedComments) }),
            });
            return { ...item, comments: updatedComments };
        }
        return item;
    }));
  };

  const handleCancelChatAction = () => {
      setReplyTo(null);
      setEditingCommentId(null);
      setCommentInput("");
  };

  const toggleSelection = (id: number, e: any) => {
    e.stopPropagation();
    const newSet = new Set(selectedIndices);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedIndices(newSet);
  };

  const handleDelete = (id: number, e: any) => {
    e.stopPropagation(); 
    setQueue(prev => prev.filter(item => item._id !== id));
    if (editingId === id || activeCommentId === id) handleCancelSelection();
    const newSet = new Set(selectedIndices); newSet.delete(id); setSelectedIndices(newSet);
  };

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
            
            // CONSTRUCT PAYLOAD FOR TRANSACTION API
            const finalPayload = { 
                ...cleanPayload, 
                LastModifiedBy: userEmail || "System",
                // Passing logs to backend (to be handled by DB or appended to remarks if DB supports)
                Logchats: formatLogchats(comments || []) 
            };

            // CALL THE NEW APPROVE ENDPOINT (SQL TRANSACTION)
            await fetch(`${API_BASE_URL}/digitalrecording/approve`, {
                method: "POST", 
                headers: { 
                    "Content-Type": "application/json", 
                    "Authorization": token ? `Bearer ${token}` : '' 
                },
                body: JSON.stringify(finalPayload),
            }).then(res => { 
                if (!res.ok) return res.json().then(err => { throw new Error(err.message || "DB Transaction Failed") });
            });

        } catch (error: any) { 
            console.error("Approval Error:", error);
            failedIds.push(item._id); 
            toast.error(`Failed to approve ${item.RecordingName}: ${error.message}`);
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
  const isCommentsOpen = !!activeCommentId && !!activeEntry;

  const renderField = (label: string, name: string, theme: any, options: any = {}) => (
    <FormField 
        key={name} label={label} name={name} theme={theme} 
        value={(formData as any)[name]} onChange={handleChange} 
        onFocus={() => setFocusedField(name)} onBlur={() => setFocusedField(null)} 
        isFocused={focusedField === name} 
        disabled={isViewing || hasViewOnlyAccess} 
        {...options} 
    />
  );

const renderQueueItem = (item: any) => {
    const isSelected = selectedIndices.has(item._id);
    const isActive = activeCommentId === item._id; 
    const isItemEditing = editingId === item._id;
    const currentStatus = item._status || 'incomplete';
    const statusConfig = STATUS_OPTIONS.find(s => s.id === currentStatus) || STATUS_OPTIONS[0];

    // Responsive: Compact mode for small screens
    const isCompact = typeof window !== "undefined" ? window.innerWidth < 500 : false;

    return (
        <div 
            key={item._id} 
            style={styles.queueItem(isActive, isItemEditing)}
            onClick={() => handleSelectEntry(item)} 
        >
            <div style={{display: "flex", alignItems: "flex-start", gap: "10px"}}>
                
                {/* 1. CHECKBOX (Fixed Width) */}
                <div onClick={(e) => toggleSelection(item._id, e)} style={{ paddingTop: 2, flexShrink: 0 }}>
                    {isSelected ? <CheckSquare size={18} color="#10b981" /> : <Square size={18} color="rgba(255,255,255,0.3)" />}
                </div>

                {/* 2. TEXT CONTENT (Flexible & Truncating) */}
                <div style={{flex: 1, minWidth: 0 /* CRITICAL for truncation in flexbox */ }}>
                    <div 
                        title={item.RecordingCode || "Untitled"} 
                        style={{ 
                            fontWeight: '600', 
                            color: isItemEditing ? '#f59e0b' : isActive ? '#3b82f6' : '#fff', 
                            fontSize: '0.9rem', 
                            marginBottom: 4,
                            whiteSpace: "nowrap",       // Prevent wrapping
                            overflow: "hidden",         // Hide overflow
                            textOverflow: "ellipsis"    // Add "..."
                        }}
                    >
                        {item.RecordingCode || "Untitled"}
                    </div>
                    
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.fkEventCode}
                    </div>
                    
                    <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
                        {item.comments?.length > 0 && (
                            <span style={{fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', color: '#cbd5e1', padding: '1px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3}}>
                                <MessageSquare size={10} /> {item.comments.length}
                            </span>
                        )}
                    </div>
                </div>

                {/* 3. ACTIONS & STATUS (Fixed Group) */}
                <div style={{display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0, marginTop: -2}}>
                   <div style={{position: 'relative'}}>
                       <div
                        onClick={hasEditAccess ? (e) => handleStatusClick(item._id, e) : undefined}
                        style={{ ...styles.statusBadge(currentStatus), cursor: hasEditAccess ? "pointer" : "not-allowed", opacity: hasEditAccess ? 1 : 0.5, whiteSpace: "nowrap" }}
                        title={hasEditAccess ? "Change Status" : "View Only"}
                       >
                        <statusConfig.icon size={12} strokeWidth={3} />
                        {/* Hide text on very small screens if isCompact is true, otherwise show */}
                        {!isCompact && (currentStatus === 'revision' ? 'Revise' : currentStatus)}
                       </div>

                      {openStatusDropdown === item._id && hasEditAccess && (
                        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 5, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 5, zIndex: 50, width: '140px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>
                            {STATUS_OPTIONS.map(opt => (
                                <div key={opt.id} onClick={(e) => updateStatus(item._id, opt.id, e)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px', fontSize: '0.75rem', color: '#fff', cursor: 'pointer', borderRadius: 4, background: currentStatus === opt.id ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
                                    <opt.icon size={14} color={opt.color} /> {opt.label}
                                </div>
                            ))}
                        </div>
                      )}
                    </div>

                    <button onClick={(e) => handleEditClick(item, e)} style={{ background: 'transparent', border: 'none', color: isItemEditing ? '#f59e0b' : '#64748b', cursor: hasEditAccess ? 'pointer' : 'not-allowed', padding: 5, opacity: hasEditAccess ? 1 : 0.5 }} title="Edit" disabled={!hasEditAccess}>
                        <Pencil size={16} />
                    </button>
                    <button onClick={(e) => handleDelete(item._id, e)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: hasEditAccess ? 'pointer' : 'not-allowed', padding: 5, opacity: hasEditAccess ? 1 : 0.5 }} title="Delete" disabled={!hasEditAccess}>
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
  };
  const getGroupedQueue = () => {
      const groups: any = { incomplete: [], revision: [], complete: [] };
      queue.forEach(item => { const s = item._status || 'incomplete'; if(groups[s]) groups[s].push(item); });
      return groups;
  };

  return (
    <div style={styles.wrapper}>
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
      
      {/* HEADER */}
      <div style={styles.header}>
        <div style={{ display: 'inline-flex', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Sparkles size={14} color="#fbbf24" style={{marginRight: 6}} /> 
          <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 500 }}>Master Ingest System</span>
        </div>
        <h1 style={styles.title}>Audio Merge Project</h1>
      </div>

      <div style={{ ...styles.mainContainer, gridTemplateColumns: styles.mainContainer.gridTemplateColumns(isCommentsOpen) }}>
        
        {/* COLUMN 1: FORM ENTRY */}
        <div style={styles.columnScroll} className="hide-scrollbar">
            <div style={styles.unifiedCard}>
                
                {isEditing && <div style={{marginBottom: 15, padding: "8px 12px", background: "rgba(245, 158, 11, 0.1)", border: "1px solid #f59e0b", borderRadius: 8, color: "#f59e0b", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8}}><Pencil size={14}/> Editing Mode - Changes will update the entry</div>}
                {isViewing && <div style={{marginBottom: 15, padding: "8px 12px", background: "rgba(59, 130, 246, 0.1)", border: "1px solid #3b82f6", borderRadius: 8, color: "#3b82f6", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8}}><Eye size={14}/> View Mode - Read Only</div>}

                <div style={styles.sectionBlock}>
                    <SectionTitle icon={Database} title="Core Identity" theme={colors.core} />
                    <div style={styles.gridFields}>
                       <SearchableSelect 
                            label="Event Name" name="EventName" 
                            options={eventCodeOptions.map(opt => opt.EventName || "")} 
                            value={formData.EventName} 
                            onChange={handleChange} theme={colors.core} required={true} 
                            disabled={!hasEditAccess || isViewing}
                        />
                       {renderField("Event Code", "fkEventCode", colors.core, { required: true, disabled: !hasEditAccess || isViewing })}
                        
                        {/* CHANGED: Recording Code is standard Input (manual) */}
                        {renderField("Recording Code", "RecordingCode", colors.core, { required: true, disabled: !hasEditAccess || isViewing })}
                      
                        {/* CHANGED: Recording Name is standard Input (manual), replaced SearchableSelect */}
                        {renderField("Recording Name", "RecordingName", colors.core, { required: true, full: true, disabled: !hasEditAccess || isViewing })}

                      {renderField("Assoc. DR", "AssociatedDR", colors.core, { disabled: !hasEditAccess || isViewing })}
                      {renderField("Teams", "Teams", colors.core, { disabled: !hasEditAccess || isViewing })}
                      {renderField("Informal?", "IsInformal", colors.core, { disabled: !hasEditAccess || isViewing })}
                    </div>
                </div>
                <div style={styles.sectionBlock}>
                    <SectionTitle icon={FileAudio} title="Technical Specs" theme={colors.tech} />
                    <div style={styles.gridFields}>
                       {renderField("Duration", "Duration", colors.tech, { disabled: !hasEditAccess || isViewing })}
                       {renderField("File Size", "Filesize", colors.tech, { disabled: !hasEditAccess || isViewing })}
                       {renderField("Bit Rate", "BitRate", colors.tech, { disabled: !hasEditAccess || isViewing })}
                       {renderField("Dimension", "Dimension", colors.tech, { disabled: !hasEditAccess || isViewing })}
                       {renderField("Files", "NoOfFiles", colors.tech, { type: "number", disabled: !hasEditAccess || isViewing })}
                       {renderField("Audio Bitrate", "AudioBitrate", colors.tech, { disabled: !hasEditAccess || isViewing })}
                       {renderField("Drive Link", "DistributionDriveLink", colors.tech, { full: true, disabled: !hasEditAccess || isViewing })}
                    </div>
                </div>
                <div style={styles.sectionBlock}>
                    <SectionTitle icon={Layers} title="Classification" theme={colors.class} />
                    <div style={styles.gridFields}>
                       {renderField("Master Quality", "Masterquality", colors.class, { disabled: !hasEditAccess || isViewing })}
                        {renderField("Bucket", "ProductionBucket", colors.class, { disabled: !hasEditAccess || isViewing })}
                        {renderField("Category", "fkDigitalMasterCategory", colors.class, { disabled: !hasEditAccess || isViewing })}
                        {renderField("Label", "fkDistributionLabel", colors.class, { disabled: !hasEditAccess || isViewing })}
                        {renderField("Product Title", "MasterProductTitle", colors.class, { disabled: !hasEditAccess || isViewing })}
                        {renderField("Date", "SubmittedDate", colors.class, { disabled: !hasEditAccess || isViewing })}
                    </div>
                </div>
                <div style={{...styles.sectionBlock, marginBottom: 0}}>
                    <SectionTitle icon={CheckCircle} title="QC Log" theme={colors.qc} />
                    <div style={styles.gridFields}>
                       {renderField("QC Sevak", "QCSevak", colors.qc, { disabled: !hasEditAccess || isViewing })}
                        {renderField("Status", "QcStatus", colors.qc, { disabled: !hasEditAccess || isViewing })}
                        {renderField("Checked On", "QcRemarksCheckedOn", colors.qc, { disabled: !hasEditAccess || isViewing })}
                        {renderField("Preservation", "PreservationStatus", colors.qc, { disabled: !hasEditAccess || isViewing })}
                        {renderField("Error Count", "CounterError", colors.qc, { disabled: !hasEditAccess || isViewing })}
                        {renderField("Error Reason", "ReasonError", colors.qc, { disabled: !hasEditAccess || isViewing })}
                        {renderField("Remarks", "RecordingRemarks", colors.qc, { full: true, disabled: !hasEditAccess || isViewing })}
                    </div>
                </div>
                 <div style={{...styles.sectionBlock, marginBottom: 0}}><br/>
                    <SectionTitle icon={FileAudio} title="Unique Identifiers" theme={colors.tech} />
                    <div style={styles.gridFields}>
                        
                        
                        {/* ML ID Remains a dropdown per previous request */}
                        <SearchableSelect 
                            label="ML Unique ID" 
                            name="MLUniqueID" 
                            options={mlIdOptions.map(opt => opt.MLUniqueID)} 
                            value={formData.MLUniqueID} 
                            onChange={handleChange} 
                            theme={colors.core} 
                            disabled={!hasEditAccess || isViewing}
                        />
                         {renderField("Audio WAV Code", "AudioWAVDRCode", colors.core, { disabled: !hasEditAccess || isViewing })}
                        {renderField("Detail", "Detail", colors.core, { full: true, disabled: !hasEditAccess || isViewing })}
                       
                    </div>
                </div>
                
                <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
                    {(isEditing || isViewing) && (
                        <button type="button" onClick={handleCancelSelection} style={styles.cancelBtn}>
                             {isEditing ? "Cancel Edit" : "Close"}
                        </button>
                    )}
                    
                    {!isEditing && !isViewing && (
                       <button
                          type="button" onClick={handleResetForm} title="Reset Form"
                          style={{
                            width: "42px", height: "42px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                            display: "flex", alignItems: "center", justifyContent: "center", cursor: isResetting ? "not-allowed" : "pointer", color: "#cbd5e1",
                            transition: "all 0.2s ease", boxShadow: isResetting ? "0 0 12px rgba(99,102,241,0.4)" : "none", opacity: isResetting ? 0.7 : 1,
                          }}
                          disabled={isResetting}
                        >
                          <RotateCcw size={16} className={isResetting ? "animate-spin" : ""} />
                        </button>
                    )}

                    {isViewing ? (
                        <button type="button" onClick={enableEditing} style={styles.addBtn(false, true)}>
                             <Pencil size={18} style={{marginRight:6}}/> Edit This Entry
                        </button>
                    ) : (
                       <button
                            type="button"
                            onClick={handleSaveDraft}
                            style={styles.addBtn(isEditing, false)}
                            disabled={!hasEditAccess}
                            title={!hasEditAccess ? "Only users with edit access can add or update" : ""}
                        >
                            {isEditing ? (<> <Save size={18} /> Update Entry </>) : (<> <Plus size={18} /> Add to Queue </>)}
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* COLUMN 2: PENDING QUEUE */}
        <div style={styles.columnScroll} className="hide-scrollbar">
            <div style={styles.queueCard}>
                <div style={styles.queueHeader}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                        <ListChecks size={20} color="#10b981" />
                        <span>Queue ({queue.length})</span>
                    </div>
                    <div style={{display:'flex', alignItems: 'center', gap: 15}}>
                        {queue.length > 0 && (
                            <span onClick={() => setIsGrouped(!isGrouped)} style={{ fontSize: '0.75rem', color: isGrouped ? '#3b82f6' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: isGrouped ? 600 : 400 }}>
                                <ListFilter size={14} /> Group by Status
                            </span>
                        )}
                        {queue.length > 0 && (
                            <span style={{fontSize: '0.8rem', color: '#94a3b8', cursor: 'pointer'}} onClick={() => setSelectedIndices(new Set(queue.map(q => q._id)))}>
                                Select All
                            </span>
                        )}
                    </div>
                </div>

                {queue.length === 0 ? (
                    <div style={{ padding: "40px 0", textAlign: "center", color: "rgba(255,255,255,0.2)" }}>
                        <Inbox size={48} style={{ marginBottom: 10, opacity: 0.5 }} />
                        <p>Empty</p>
                    </div>
                ) : (
                    isGrouped ? (
                        <div>
                            {(() => {
                                const groups = getGroupedQueue();
                                const renderGroup = (statusId: string, label: string) => {
                                    if(groups[statusId].length === 0) return null;
                                    const isExpanded = expandedGroups.has(statusId);
                                    
                                    return (
                                        <div key={statusId}>
                                            <div 
                                                onClick={() => toggleGroup(statusId)} 
                                                style={styles.groupTitle(statusId, isExpanded)}
                                            >
                                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />} 
                                                {label} ({groups[statusId].length})
                                            </div>
                                            {isExpanded && groups[statusId].map(renderQueueItem)}
                                        </div>
                                    )
                                };
                                return (
                                    <>
                                        {renderGroup('incomplete', 'Incomplete')}
                                        {renderGroup('revision', 'Needs Revision')}
                                        {renderGroup('complete', 'Complete')}
                                    </>
                                );
                            })()}
                        </div>
                    ) : (
                        queue.map(renderQueueItem)
                    )
                )}
            </div>
        </div>

        {/* COLUMN 3: COMMUNICATION / DETAILS */}
        {isCommentsOpen ? (
            <div style={styles.commentCard}>
                <div style={styles.chatHeader}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                        <div>
                            <h4 style={{margin: 0, color: '#fff', fontSize: '0.95rem', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{activeEntry.RecordingName}</h4>
                            <span style={{fontSize: '0.75rem', color: '#3b82f6'}}>{activeEntry.fkEventCode}</span>
                        </div>
                        <button onClick={handleCloseComments} style={{background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer'}}>
                            <X size={18} />
                        </button>
                    </div>
                    <div style={{marginTop: 15, padding: 10, background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontSize: '0.75rem', color: '#cbd5e1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8}}>
                            <div><span style={{color:'#64748b'}}>Code:</span> {activeEntry.RecordingCode}</div>
                            <div><span style={{color:'#64748b'}}>Dur:</span> {activeEntry.Duration}</div>
                            <div><span style={{color:'#64748b'}}>Size:</span> {activeEntry.Filesize}</div>
                            <div><span style={{color:'#64748b'}}>QC:</span> {activeEntry.QcStatus || "Pending"}</div>
                    </div>
                </div>

                <div style={styles.chatBody} className="hide-scrollbar">
                    <div style={styles.msgBubble(true)}>
                        {isEditing ? "Editing entry..." : "Viewing entry details."}
                    </div>
                    {activeEntry.comments && activeEntry.comments.map((msg: any) => {
                        const isCurrentUser = msg.user === userEmail;
                        const isBeingEdited = editingCommentId === msg.id;
                        return (
                            <div key={msg.id}
                                style={{
                                    ...styles.msgBubble(false),
                                    alignSelf: isCurrentUser ? "flex-end" : "flex-start",
                                    background: isBeingEdited ? "rgba(245, 158, 11, 0.2)" : isCurrentUser ? "linear-gradient(90deg, #3b82f6 20%, #06b6d4 100%)" : "rgba(59, 130, 246, 0.15)",
                                    color: isCurrentUser ? "#fff" : "#e2e8f0",
                                    borderTopRightRadius: isCurrentUser ? "2px" : "12px", borderTopLeftRadius: isCurrentUser ? "12px" : "2px",
                                    maxWidth: "90%", marginLeft: isCurrentUser ? "auto" : undefined, marginRight: isCurrentUser ? 0 : undefined,
                                    position: 'relative', border: isBeingEdited ? "1px solid #f59e0b" : "none"
                                }}>
                                <div style={{ fontSize: '0.7rem', color: isCurrentUser ? "#dbeafe" : "#94a3b8", marginBottom: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                                    <span style={{ color: isCurrentUser ? "#fff" : "#3b82f6", fontWeight: 600 }}>{msg.user}</span>
                                    <span>{msg.timestamp}</span>
                                </div>

                                {msg.replyTo && (
                                    <div style={{
                                        margin: "4px 0 8px 0", padding: "6px 10px", 
                                        backgroundColor: "rgba(0,0,0,0.2)", borderRadius: "6px",
                                        borderLeft: `3px solid ${isCurrentUser ? '#fff' : '#3b82f6'}`,
                                        fontSize: "0.75rem", display: 'flex', flexDirection: 'column'
                                    }}>
                                        <span style={{fontWeight: 600, fontSize: '0.65rem', marginBottom: 2, opacity: 0.8}}>{msg.replyTo.user}</span>
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.9 }}>{msg.replyTo.text}</span>
                                    </div>
                                )}

                                <div style={{ wordBreak: "break-word" }}>
                                    {msg.text} {msg.isEdited && <span style={{fontSize: '0.6rem', opacity: 0.7, fontStyle: 'italic'}}>(edited)</span>}
                                </div>

                                <div style={{ 
                                    marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.1)", 
                                    display: 'flex', justifyContent: 'flex-end', gap: 10 
                                }}>
                                    <button onClick={() => setReplyTo(msg)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.8 }} title="Reply">
                                        <CornerUpLeft size={12} color={isCurrentUser ? "#fff" : "#cbd5e1"} />
                                    </button>
                                    {isCurrentUser && (
                                        <>
                                            <button onClick={() => handleEditCommentAction(msg)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.8 }} title="Edit">
                                                <Pencil size={12} color="#fff" />
                                            </button>
                                            <button onClick={() => handleDeleteComment(msg.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.8 }} title="Delete">
                                                <Trash2 size={12} color="#fca5a5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={chatBottomRef} />
                </div>

                <div style={styles.chatFooter}>
                    {showUserDropdown && (
                        <div style={{
                            position: "absolute", bottom: "100%", right: 150, marginBottom: 10,
                            background: "#1e293b", border: "1px solid #3b82f6",
                            borderRadius: 8, zIndex: 100, padding: "8px 0",
                            boxShadow: "0 -4px 20px rgba(0,0,0,0.5)", minWidth: "160px"
                        }}>
                            <div style={{padding: "4px 12px", fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase"}}>Mention User</div>
                            {userList.map(u => (
                                <div key={u}
                                    style={{ padding: "8px 12px", cursor: "pointer", color: "#fff", fontSize: "0.85rem" }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                    onClick={() => { setCommentInput(commentInput + `@${u.split("@")[0]} `); setShowUserDropdown(false); }}
                                >
                                    @{u.split("@")[0]}
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                         {(replyTo || editingCommentId) && (
                            <div style={{ 
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: "4px 10px", marginBottom: 6, borderRadius: 6,
                                background: editingCommentId ? "rgba(245, 158, 11, 0.15)" : "rgba(59, 130, 246, 0.15)", 
                                borderLeft: `3px solid ${editingCommentId ? "#f59e0b" : "#3b82f6"}`,
                                fontSize: "0.75rem", color: "#fff"
                            }}>
                                <span>
                                    {editingCommentId ? ( <><b>Editing</b> your message...</> ) : ( <>Replying to: <b>{replyTo.user}</b></> )}
                                </span>
                                <button onClick={handleCancelChatAction} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#cbd5e1" }}>
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                        
                        <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                            <button type="button" style={{ background: "transparent", border: "none", color: "#3b82f6", cursor: "pointer" }} onClick={() => setShowUserDropdown(!showUserDropdown)} title="Mention user">
                                <AtSign size={18} />
                            </button>

                            <input
                                id="chat-input-field"
                                style={{ ...styles.input(colors.core, false), flex: 1, borderRadius: 20 }}
                                placeholder={editingCommentId ? "Update your message..." : "Write a comment..."}
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                                autoComplete="off"
                            />
                            
                            <button onClick={handleSendComment}
                                style={{
                                    background: editingCommentId ? "#f59e0b" : "#3b82f6", border: 'none', borderRadius: '50%',
                                    width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'all 0.2s'
                                }}
                            >
                                {editingCommentId ? <CheckCircle size={16} /> : <Send size={16} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
             <div style={{display: 'none'}}></div> 
        )}

      </div>

      {queue.length > 0 && (
        <div style={styles.actionBar}>
            <span style={{ color: "#fff", fontSize: "0.9rem", fontWeight: 600 }}>
                {selectedIndices.size} Selected
            </span>
            <button 
                type="button" 
                onClick={handleUploadSelected} 
                disabled={isSubmitting || selectedIndices.size === 0 || !canApprove} 
                style={{
                    background: `linear-gradient(to right, #10b981, #059669)`, border: "none", borderRadius: "100px", padding: "0 30px", height: "44px",
                    fontSize: "0.9rem", fontWeight: "600", color: "white", display: "flex", alignItems: "center", gap: "8px", cursor: selectedIndices.size === 0 || !canApprove ? 'not-allowed' : 'pointer',
                    opacity: selectedIndices.size === 0 || !canApprove ? 0.5 : 1, boxShadow: "0 0 20px rgba(16, 185, 129, 0.4)",
                }}
                title={!canApprove ? "Only users with edit access can approve" : ""}
            >
                {isSubmitting ? (
                    <> <Activity className="animate-spin" size={18} /> Processing... </>
                ) : (
                    <> <UploadCloud size={18} /> Approve Selected </>
                )}
            </button>
        </div>
      )}

    </div>
  );
}

// Helper to format comments for Logchats
const formatLogchats = (comments: any[] = []) =>
  comments.map(c => `[LOGS]: [${c.user}]: ${c.text}`).join('\n');