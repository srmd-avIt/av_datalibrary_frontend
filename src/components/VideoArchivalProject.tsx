

import React, { useState, useEffect, useMemo, CSSProperties } from "react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext"; 
import { 
  ArrowLeft, 
  PlayCircle, 
  Film, 
  Loader2, 
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Maximize2, 
  Minimize2,
  Layers,      
  ChevronDown, 
  ChevronUp,
  Download,
  Lock,
  Unlock,
  X,
  AlertTriangle,
  Search,
  Columns 
} from "lucide-react";

// --- TYPES & INTERFACES ---

interface VideoArchivalProjectProps {
  onBack: () => void;
  userEmail?: string;
}

interface ArchivalItem {
  MLUniqueID: string;
  EventRefMLID: string;
  ContentFrom: string;
  CounterFrom: string;
  CounterTo: string;
  EventName: string;
  Yr: string;
  Detail: string;
  Dimension: string;
  Topic: string;
  ProductionBucket: string;
  LockStatus?: string | null;
  LockedBy?: string | null;
  ReelCount?: number;
  EditingStatus?: string;
  Remarks?: string;
  LastModifiedBy?: string;
  [key: string]: any;
}

type TabType = 'used' | 'unused';

interface ColumnDef {
  key: string;
  label: string;
  width: number;
  render?: (item: ArchivalItem, idx: number) => React.ReactNode;
}

// --- ENV SETUP ---
const API_BASE_URL = import.meta.env.VITE_API_URL;
const cleanBaseUrl = API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');

const SERVER_PAGE_SIZE = 50;
const GROUP_INNER_PAGE_SIZE = 50; 

// --- STYLES ---
const styles: Record<string, CSSProperties> = {
  tableHeader: { 
    padding: '12px 10px', 
    fontSize: '0.7rem', 
    fontWeight: 700, 
    textTransform: 'uppercase', 
    color: '#94a3b8', 
    background: '#1e293b', 
    borderBottom: '2px solid rgba(255,255,255,0.08)',
    cursor: 'pointer', 
    userSelect: 'none',
    whiteSpace: 'nowrap',
    transition: 'background 0.2s',
    position: 'sticky', 
    top: 0,             
    zIndex: 10
  },
  innerTableHeader: {
    padding: '10px 10px', 
    fontSize: '0.65rem', 
    fontWeight: 700, 
    textTransform: 'uppercase', 
    color: '#cbd5e1', 
    background: '#0f172a', 
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    cursor: 'pointer', 
    userSelect: 'none',
    position: 'sticky', 
    top: 0,
    zIndex: 9, 
  },
  tableCell: { 
    padding: '8px 10px', 
    fontSize: '0.8rem', 
    color: '#e2e8f0', 
    borderBottom: '1px solid rgba(255,255,255,0.05)', 
    verticalAlign: 'top', 
    overflow: 'hidden', 
    textOverflow: 'ellipsis',
    background: 'transparent' 
  },
  // --- CHANGED SECTION START ---
  stickyBase: {
    position: 'sticky',
    background: '#13223a', // Changed to Navy Blue for frozen body cells
    boxShadow: '4px 0 8px rgba(0,0,0,0.5)', // Increased shadow slightly for depth
    borderRight: '1px solid rgba(148, 163, 184, 0.2)', // Slightly lighter border to pop
    zIndex: 5
  }, 
  stickyHeaderBase: {
    position: 'sticky',
    background: '#0a1d3a', // Darker Navy Blue for frozen header cells
    boxShadow: '4px 0 8px rgba(0,0,0,0.5)',
    borderRight: '1px solid rgba(148, 163, 184, 0.2)',
    zIndex: 20
  },
  // --- CHANGED SECTION END ---
  groupRow: {
    background: 'rgba(59, 130, 246, 0.15)', 
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background 0.2s'
  },
  groupCell: {
    padding: '12px 10px',
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#93c5fd',
    borderBottom: '1px solid rgba(255,255,255,0.05)'
  },
  loadMoreRow: {
    background: 'rgba(30, 41, 59, 0.3)',
    cursor: 'pointer',
    textAlign: 'center'
  },
  paginationContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '15px 0',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    gap: '8px',
    color: '#94a3b8',
    fontSize: '0.85rem'
  },
  pageButton: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    padding: '6px 12px',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'all 0.2s',
    minWidth: '36px',
    fontSize: '0.8rem',
    fontWeight: 600
  },
  goButton: {
    background: 'rgba(59, 130, 246, 0.3)',
    border: '1px solid rgba(59, 130, 246, 0.4)',
    color: '#60a5fa',
    borderRadius: '6px',
    padding: '5px 10px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  select: {
    background: '#0f2952', 
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e2e8f0',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '0.85rem',
    outline: 'none',
    cursor: 'pointer'
  },
  pageInput: {
    background: 'rgba(30, 41, 59, 0.6)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    borderRadius: '6px',
    padding: '5px 8px',
    fontSize: '0.85rem',
    width: '60px',
    textAlign: 'center',
    outline: 'none'
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    background: '#0f2952',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    padding: '6px 10px',
    marginRight: '15px',
    width: '250px',
    transition: 'border 0.2s'
  },
  searchInput: {
    background: 'transparent',
    border: 'none',
    color: '#e2e8f0',
    fontSize: '0.85rem',
    marginLeft: '8px',
    outline: 'none',
    width: '100%'
  },
  modalOverlay: {
    position: 'fixed', 
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(5px)'
  },
  modalContent: {
    background: '#1e293b',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '1200px', 
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
  },
  confirmBox: {
    background: '#1e293b',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '24px',
    width: '400px',
    maxWidth: '90%',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  confirmButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px'
  },
  primaryBtn: {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  secondaryBtn: {
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid #475569',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};

export function VideoArchivalProject({ onBack, userEmail }: VideoArchivalProjectProps) {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('used');
  const [data, setData] = useState<ArchivalItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchState, setSearchState] = useState<{ used: string; unused: string }>({
    used: "",
    unused: ""
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(1);
  const [jumpToPage, setJumpToPage] = useState(""); 
  const [serverTotalRecords, setServerTotalRecords] = useState(0);
  
  const [expandedColumns, setExpandedColumns] = useState<Record<string, boolean>>({});
  const [groupByState, setGroupByState] = useState<{ used: string; unused: string }>({
    used: 'none',
    unused: 'none'
  });

  const [frozenColumn, setFrozenColumn] = useState('none');

  const currentGroupBy = groupByState[activeTab];
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [groupPageCounts, setGroupPageCounts] = useState<Record<string, number>>({});

  const [showRelatedModal, setShowRelatedModal] = useState(false);
  const [relatedReels, setRelatedReels] = useState<ArchivalItem[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState("");

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    mlid: string;
    currentLockStatus: string | null;
    actionType: 'lock' | 'unlock';
    message: string;
  }>({
    isOpen: false,
    mlid: "",
    currentLockStatus: null,
    actionType: 'lock',
    message: ""
  });

  const canEdit = useMemo(() => {
    if (!user) return false;
    if (user.role === 'Owner' || user.role === 'Admin') return true;
    const resourceName = "Wisdom Reels Archival";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const permission = user.permissions?.find((p: any) => p.resource === resourceName);
    return permission?.actions?.includes('write') ?? false;
  }, [user]);

  // --- COLUMN DEFINITIONS (Ordered) ---
  const getBucketBadgeStyle = (bucket?: string): CSSProperties => {
    const value = (bucket || "").toLowerCase();
    const map: Record<string, { tint: string; color: string }> = {
      "wisdom reels": { tint: "16,185,129", color: "#34d399" },
      "wisdom clips/reels": { tint: "59,130,246", color: "#60a5fa" },
    };
    const matched = Object.keys(map).find(k => value.includes(k));
    const style = matched ? map[matched] : { tint: "148,163,184", color: "#d6a345" };

    return {
      background: `linear-gradient(135deg, rgba(${style.tint}, 0.18), rgba(${style.tint}, 0.08))`,
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      border: `1px solid rgba(${style.tint}, 0.35)`,
      boxShadow: `0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)`,
      color: style.color,
      padding: "2px 12px",
      borderRadius: 999,
      fontSize: "0.7rem",
      fontWeight: 700,
      letterSpacing: "0.4px",
      transition: "all 0.25s ease"
    };
  };

  const columnDefs: ColumnDef[] = useMemo(() => [
    {
      key: 'Action',
      label: 'Action',
      width: 100,
      render: (item) => {
        const isLocked = item.LockStatus === 'Locked';
        const currentUserEmail = user?.email?.toLowerCase() || userEmail?.toLowerCase() || '';
        const lockerEmail = item.LockedBy ? item.LockedBy.toLowerCase() : '';
        const lockedByMe = isLocked && (lockerEmail === currentUserEmail);
        const lockedByOther = isLocked && !lockedByMe;

        return (
          <button 
            onClick={() => openLockConfirmation(item.MLUniqueID, item.LockStatus)}
            disabled={!canEdit || lockedByOther}
            style={{
              background: !canEdit ? 'transparent' : lockedByOther ? 'transparent' : (lockedByMe ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'), 
              border: !canEdit ? '1px solid rgba(255,255,255,0.05)' : lockedByOther ? '1px solid rgba(255,255,255,0.1)' : (lockedByMe ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)'),
              color: !canEdit ? '#64748b' : lockedByOther ? '#64748b' : (lockedByMe ? '#f87171' : '#34d399'),
              padding: '4px 12px', borderRadius: 6, cursor: (!canEdit || lockedByOther) ? 'not-allowed' : 'pointer',
              fontSize: '0.7rem', fontWeight: 600, opacity: (!canEdit || lockedByOther) ? 0.6 : 1, width: '100%', transition: 'all 0.2s'
            }}
          >
            {!canEdit ? (isLocked ? "Locked" : "View Only") : (lockedByOther ? "Locked" : (lockedByMe ? "Unpick" : "Pick"))}
          </button>
        );
      }
    },
    {
      key: 'LockStatus',
      label: 'Status',
      width: 140,
      render: (item) => {
        const isLocked = item.LockStatus === 'Locked';
        const currentUserEmail = user?.email?.toLowerCase() || userEmail?.toLowerCase() || '';
        const lockerEmail = item.LockedBy ? item.LockedBy.toLowerCase() : '';
        const lockedByMe = isLocked && (lockerEmail === currentUserEmail);
        const lockedByOther = isLocked && !lockedByMe;

        if (isLocked) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: lockedByMe ? '#10b981' : '#f59e0b', fontSize: '0.75rem', fontWeight: 600 }}>
                {lockedByMe ? <UserCheck size={14} /> : <Lock size={14} />} {lockedByMe ? "Picked" : "Locked"}
              </span>
              {lockedByOther && <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 2 }}>by {item.LockedBy?.split('@')[0]}</span>}
            </div>
          );
        }
        return <span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}><Unlock size={12} /> Available</span>;
      }
    },

     { key: 'LockedBy', label: 'LockedBy', width: 180 },
    { key: 'MLUniqueID', label: 'MLUniqueID', width: 120 },
    { 
      key: 'EventRefMLID', 
      label: 'EventRefMLID', 
      width: 150,
      render: (item) => <span style={{ fontWeight: 700, color: '#f8fafc' }}>{item.EventRefMLID}</span>
    },
    {
      key: 'Reels',
      label: 'Reels',
      width: 100,
      render: (item) => {
        if (activeTab === 'used') {
          return (
            <button 
              onClick={() => handleViewRelated(item.EventRefMLID)}
              style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', cursor: 'pointer' }}
            >
              {item.ReelCount}
            </button>
          );
        }
        return <span style={{ color: '#64748b', fontSize: '0.75rem' }}>-</span>;
      }
    },
    { key: 'ContentFrom', label: 'ContentFrom', width: 150 },
    { key: 'CounterFrom', label: 'CounterFrom', width: 150 },
    { key: 'CounterTo', label: 'CounterTo', width: 150 },
    { key: 'EventName', label: 'Event', width: 200 },
    { key: 'Yr', label: 'Year', width: 150 },
    { key: 'Detail', label: 'Details', width: 250 },
    { key: 'Dimension', label: 'Dimension', width: 150 },
    { key: 'Topic', label: 'Topic', width: 200 },
    {
      key: 'ProductionBucket',
      label: 'Production Bucket',
      width: 200,
      render: (item) => <span style={getBucketBadgeStyle(item.ProductionBucket)}>{item.ProductionBucket || ''}</span>
    },
   
  ], [user, canEdit, activeTab, userEmail]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchState[activeTab]);
    }, 500); 
    return () => clearTimeout(timer);
  }, [searchState, activeTab]); 

  useEffect(() => {
    setPage(1);
    setExpandedGroups({}); 
    setGroupPageCounts({});
    setJumpToPage(""); 
    setDebouncedSearch(searchState[activeTab]);
  }, [activeTab, currentGroupBy]); 

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]); 

  useEffect(() => {
    fetchData();
  }, [page, activeTab, currentGroupBy, debouncedSearch]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('app-token');
      const isGrouping = currentGroupBy !== 'none';
      const limit = isGrouping ? 5000 : SERVER_PAGE_SIZE;
      const apiPage = isGrouping ? 1 : page;

      const endpoint = activeTab === 'used' 
        ? '/api/video-archival/satsang-reels'
        : '/api/video-archival/unused-satsangs';

      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        page: apiPage.toString()
      });

      if (debouncedSearch) {
        queryParams.append('search', debouncedSearch);
      }

      const res = await fetch(`${cleanBaseUrl}${endpoint}?${queryParams}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        const result = await res.json();
        const fetchedData = result.data || [];
        setData(fetchedData);
        
        if (result.pagination) {
          setServerTotalRecords(result.pagination.total || 0);
        } else {
          setServerTotalRecords((result.data || []).length);
        }
      } else {
        toast.error("Failed to load archival data");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const handleViewRelated = async (sourceMLID: string) => {
    if (!sourceMLID) return;
    setSelectedSourceId(sourceMLID);
    setRelatedReels([]); 
    setShowRelatedModal(true);
    setModalLoading(true);

    try {
      const token = localStorage.getItem('app-token');
      const res = await fetch(`${cleanBaseUrl}/api/video-archival/related-reels?sourceMLID=${encodeURIComponent(sourceMLID)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setRelatedReels(data);
      } else {
        toast.error("Failed to fetch related reels.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading related reels.");
    } finally {
      setModalLoading(false);
    }
  };

  const openLockConfirmation = (mlid: string, currentLockStatus: string | null | undefined) => {
    if (!canEdit) {
      toast.error("You have view-only access.");
      return;
    }

    const isLocked = currentLockStatus === 'Locked';
    const action = isLocked ? 'unlock' : 'lock';
    
    const message = isLocked 
      ? "Are you sure you want to release (Unpick) this entry? It will become available for others." 
      : "Are you sure you want to pick this entry? It will be locked for others.";

    setConfirmDialog({
      isOpen: true,
      mlid,
      currentLockStatus: currentLockStatus || null,
      actionType: action,
      message
    });
  };

  const executeLockAction = async () => {
    const { mlid, actionType } = confirmDialog;
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));

    if (!canEdit) {
       toast.error("Permission denied.");
       return;
    }

    try {
      const token = localStorage.getItem('app-token');
      const res = await fetch(`${cleanBaseUrl}/api/video-archival/lock-entry`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ MLUniqueID: mlid.trim(), action: actionType })
      });

      if (res.ok) {
        const result = await res.json();
        
        const updateItem = (item: ArchivalItem): ArchivalItem => {
             if (item.MLUniqueID === mlid) {
                return { 
                  ...item, 
                  LockStatus: result.status, 
                  LockedBy: result.by 
                };
             }
             return item;
        };

        setData(prev => prev.map(updateItem));
        setRelatedReels(prev => prev.map(updateItem));
        
        toast.success(actionType === 'lock' ? "Entry Picked & Locked" : "Entry Unpicked & Released");
      } else {
        const err = await res.json();
        toast.error(err.error || "Action failed");
        fetchData(); 
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error");
    }
  };

  const processedData = useMemo(() => {
    if (currentGroupBy === 'none') {
      return { isGrouped: false, items: data, totalPages: Math.ceil(serverTotalRecords / SERVER_PAGE_SIZE), groups: [] };
    }
    const groups: Record<string, ArchivalItem[]> = {};
    data.forEach(item => {
      let key = item[currentGroupBy];
      if (!key) key = "Unknown / Other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    const groupKeys = Object.keys(groups).sort();
    const groupList = groupKeys.map(key => ({ key, items: groups[key] }));
    return { isGrouped: true, groups: groupList, totalRecords: data.length, totalPages: 1 };
  }, [data, currentGroupBy, serverTotalRecords]);

  const handlePageChange = (newPage: number) => {
    const max = processedData.totalPages;
    if (newPage >= 1 && newPage <= max) {
      setPage(newPage);
      setJumpToPage(""); 
    }
  };

  const handleJumpToPageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpToPage);
    if (!isNaN(target) && target >= 1 && target <= processedData.totalPages) {
      handlePageChange(target);
    } else {
      if (jumpToPage !== "") toast.error(`Please enter a page between 1 and ${processedData.totalPages}`);
    }
  };

  const toggleColumn = (key: string) => {
    setExpandedColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const loadMoreForGroup = (groupKey: string) => {
    setGroupPageCounts(prev => ({
      ...prev,
      [groupKey]: (prev[groupKey] || GROUP_INNER_PAGE_SIZE) + GROUP_INNER_PAGE_SIZE
    }));
  };

  // --- Sticky / Freeze Helpers ---
  const frozenIndex = useMemo(() => {
    if (frozenColumn === 'none') return -1;
    return columnDefs.findIndex(col => col.key === frozenColumn);
  }, [frozenColumn, columnDefs]);

  const getStickyLeft = (index: number) => {
    // If not frozen, return auto (not used, but logical fallback)
    if (index > frozenIndex) return 'auto';
    // Sum widths of all columns BEFORE this one
    let left = 0;
    for (let i = 0; i < index; i++) {
        left += columnDefs[i].width;
    }
    return left;
  };

  const getHeaderStyle = (col: ColumnDef, index: number, isInner?: boolean): CSSProperties => {
    const baseStyle = isInner ? styles.innerTableHeader : styles.tableHeader;
    const isFrozen = index <= frozenIndex;

    const merged: CSSProperties = {
      ...baseStyle,
      width: col.width,
      minWidth: col.width,
      maxWidth: col.width,
      // Ensure stickiness is applied to all headers
      position: 'sticky',
      top: 0
    };

    if (isFrozen) {
        return {
            ...merged,
            ...styles.stickyHeaderBase,
            left: getStickyLeft(index),
            // Frozen headers (Left + Top) need highest z-index
            zIndex: isInner ? 25 : 20, 
        };
    }
    
    // Normal Columns - Sticky Top Only
    merged.zIndex = isInner ? 9 : 10;
    
    return merged;
  };

  const getBodyCellStyle = (col: ColumnDef, index: number): CSSProperties => {
    const isExpanded = expandedColumns[col.key];
    const isFrozen = index <= frozenIndex;

    const baseStyle: CSSProperties = {
      ...styles.tableCell,
      width: col.width,
      minWidth: col.width,
      maxWidth: col.width,
      whiteSpace: isExpanded ? 'normal' : 'nowrap',
      wordBreak: isExpanded ? 'break-word' : undefined
    };

    if (isFrozen) {
      return { 
        ...baseStyle, 
        ...styles.stickyBase,
        left: getStickyLeft(index)
      };
    }
    return baseStyle;
  };

  const ExpandableHeader = ({ col, index, isInner = false }: { col: ColumnDef, index: number, isInner?: boolean }) => {
    const isExpanded = expandedColumns[col.key];
    const isFrozen = index <= frozenIndex;

    return (
      <th 
        style={getHeaderStyle(col, index, isInner)} 
        onClick={() => toggleColumn(col.key)}
        title="Click to expand/collapse column"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
          <span style={{textOverflow: 'ellipsis', overflow: 'hidden'}}>{col.label}</span>
          {isExpanded ? <Minimize2 size={12} opacity={0.7} style={{minWidth: 12}} /> : <Maximize2 size={12} opacity={0.4} style={{minWidth: 12}} />}
          {isFrozen && <Lock size={10} color="#60a5fa" style={{ marginLeft: 'auto', minWidth: 10 }} />}
        </div>
      </th>
    );
  };

  const HeaderRow = ({ isInner = false }: { isInner?: boolean }) => {
    return (
      <tr>
        {columnDefs.map((col, index) => (
            <ExpandableHeader key={col.key} col={col} index={index} isInner={isInner} />
        ))}
      </tr>
    );
  };

  const renderItemRow = (item: ArchivalItem, idx: number) => {
    return (
      <tr key={item.MLUniqueID || idx} style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {columnDefs.map((col, colIdx) => (
            <td 
                key={col.key} 
                style={getBodyCellStyle(col, colIdx)}
                title={!expandedColumns[col.key] && typeof item[col.key] === 'string' ? item[col.key] : ''}
            >
                {col.render ? col.render(item, idx) : item[col.key]}
            </td>
        ))}
      </tr>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col relative">
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 41, 59, 0.5); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }

        .modal-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
        .modal-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
        .modal-scrollbar::-webkit-scrollbar-thumb { 
          background: #676b70; 
          border-radius: 5px; 
          border: 2px solid #0f172a; 
        }
        .modal-scrollbar::-webkit-scrollbar-corner { background: #0f172a; }
        
        @keyframes spinLoader { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* CONFIRMATION POPUP */}
      {confirmDialog.isOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: 10, borderRadius: '50%' }}>
                <AlertTriangle size={24} color="#fbbf24" />
              </div>
              <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 700 }}>Confirmation</h3>
            </div>
            
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.5 }}>
              {confirmDialog.message}
            </p>

            <div style={styles.confirmButtons}>
              <button 
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} 
                style={styles.secondaryBtn}
              >
                Cancel
              </button>
              <button 
                onClick={executeLockAction} 
                style={{
                  ...styles.primaryBtn,
                  background: confirmDialog.actionType === 'unlock' ? '#ef4444' : '#10b981'
                }}
              >
                {confirmDialog.actionType === 'unlock' ? 'Unpick & Release' : 'Pick Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL POPUP */}
      {showRelatedModal && (
        <div style={styles.modalOverlay} onClick={() => setShowRelatedModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>Reels from Source</h3>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>Source: <strong style={{color: '#60a5fa'}}>{selectedSourceId}</strong></p>
              </div>
              <button 
                onClick={() => setShowRelatedModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-scrollbar" style={{ padding: '0', overflow: 'auto', flex: 1, position: 'relative' }}>
              {modalLoading ? (
                 <div style={{ padding: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#94a3b8', flexDirection: 'column', gap: 10 }}>
                    <Loader2 size={32} style={{ animation: 'spinLoader 1s linear infinite' }} />
                    <span>Loading details...</span>
                 </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#1e293b', zIndex: 10 }}>
                    <tr>
                      <th style={styles.tableHeader}>MLUniqueID</th>
                      <th style={styles.tableHeader}>ContentFrom</th>
                      <th style={styles.tableHeader}>CounterFrom</th>
                      <th style={styles.tableHeader}>CounterTo</th>
                      <th style={styles.tableHeader}>Event Name</th>
                      <th style={styles.tableHeader}>Details</th>
                      <th style={styles.tableHeader}>Dimension</th>
                      <th style={styles.tableHeader}>Topic</th>
                      <th style={styles.tableHeader}>Production Bucket</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedReels.length === 0 && (
                        <tr><td colSpan={9} style={{padding: 20, textAlign: 'center', color: '#64748b'}}>No records found.</td></tr>
                    )}
                    {relatedReels.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                          <td style={styles.tableCell}>{item.MLUniqueID}</td>
                          <td style={styles.tableCell}>{item.ContentFrom}</td>
                          <td style={styles.tableCell}>{item.CounterFrom}</td>
                          <td style={styles.tableCell}>{item.CounterTo}</td>
                          <td style={styles.tableCell}>{item.EventName}</td>
                          <td style={styles.tableCell}>{item.Detail}</td>
                          <td style={styles.tableCell}>{item.Dimension}</td>
                          <td style={styles.tableCell}>{item.Topic}</td>
                          <td style={styles.tableCell}>
                            <span style={getBucketBadgeStyle(item.ProductionBucket)}>
                              {item.ProductionBucket }
                            </span>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 15 }}>
        <button 
          onClick={onBack} 
          style={{ 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '50%', 
            width: 40, height: 40, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            color: '#fff', cursor: 'pointer' 
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>Wisdom Reels Archival</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>Track satsangs used for reels and manage editing workflow.</p>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            onClick={() => setActiveTab('used')} 
            style={{ 
              padding: '8px 16px', borderRadius: '8px', 
              background: activeTab === 'used' ? 'rgba(59, 130, 246, 0.2)' : 'transparent', 
              color: activeTab === 'used' ? '#60a5fa' : '#94a3b8',
              border: activeTab === 'used' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
              fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <PlayCircle size={16} /> Used for Reels
          </button>
          <button 
            onClick={() => setActiveTab('unused')} 
            style={{ 
              padding: '8px 16px', borderRadius: '8px', 
              background: activeTab === 'unused' ? 'rgba(244, 63, 94, 0.2)' : 'transparent', 
              color: activeTab === 'unused' ? '#f43f5e' : '#94a3b8',
              border: activeTab === 'unused' ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid transparent',
              fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <Film size={16} /> Not Used Yet
          </button>
        </div>

        {/* Toolbar: Search, Freeze, Group By */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          
          <div style={styles.searchContainer}>
            <Search size={16} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchState[activeTab]} 
              onChange={(e) => setSearchState(prev => ({ ...prev, [activeTab]: e.target.value }))}
              style={styles.searchInput}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: '0.85rem' }}>
            <Columns size={14} />
            <span>Freeze:</span>
          </div>
          <select 
            value={frozenColumn} 
            onChange={(e) => setFrozenColumn(e.target.value)}
            style={styles.select}
          >
            <option value="none">None</option>
            {columnDefs.map(col => (
                <option key={col.key} value={col.key}>{col.label}</option>
            ))}
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: '0.85rem' }}>
            <Layers size={14} />
            <span>Group By:</span>
          </div>
          <select 
            value={currentGroupBy} 
            onChange={(e) => {
              const newVal = e.target.value;
              setGroupByState(prev => ({
                ...prev,
                [activeTab]: newVal
              }));
            }}
            style={styles.select}
          >
            <option value="none">None </option>
            <option value="Detail">Details</option>
            <option value="EventRefMLID">EventRefMLID</option>
            <option value="EventName">Event Name</option>
            <option value="Yr">Year</option>
            <option value="Topic">Topic</option>
            <option value="ProductionBucket">ProductionBucket</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div style={{ flex: 1, overflow: 'hidden', background: 'rgba(30, 41, 59, 0.4)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <Loader2 size={32} style={{ animation: 'spinLoader 1s linear infinite' }} />
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }} className="custom-scrollbar">
              
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                {/* Main Header - Only shown if NOT grouped */}
                {!processedData.isGrouped && (
                  <thead>
                    <HeaderRow isInner={false} />
                  </thead>
                )}

                <tbody>
                  {data.length === 0 && (
                     <tr><td colSpan={15} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No records found.</td></tr>
                  )}

                  {/* 1. FLAT VIEW */}
                  {!processedData.isGrouped && processedData.items?.map((item, idx) => renderItemRow(item, idx))}

                  {/* 2. GROUPED VIEW */}
                  {processedData.isGrouped && processedData.groups?.map((group) => {
                    const groupKey = group.key;
                    const isExpanded = expandedGroups[groupKey];
                    const count = group.items.length;
                    
                    const limit = groupPageCounts[groupKey] || GROUP_INNER_PAGE_SIZE;
                    const visibleItems = isExpanded ? group.items.slice(0, limit) : [];
                    const hasMore = isExpanded && count > limit;

                    return (
                      <React.Fragment key={groupKey}>
                        {/* Group Header Row */}
                        <tr onClick={() => toggleGroup(groupKey)} style={styles.groupRow}>
                          <td colSpan={15} style={styles.groupCell}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              <span>{groupKey || "Unknown"}</span>
                              <span style={{ 
                                background: 'rgba(255,255,255,0.1)', 
                                padding: '2px 8px', borderRadius: 12, 
                                fontSize: '0.7rem', color: '#e2e8f0', fontWeight: 400
                              }}>
                                {count} items
                              </span>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Group Content - Headers + Rows */}
                        {isExpanded && (
                          <>
                            {/* Inner Header Row rendered directly as a row, NOT wrapped in <thead> */}
                            <HeaderRow isInner={true} />
                            
                            {visibleItems.map((item, idx) => renderItemRow(item, idx))}
                            
                            {hasMore && (
                              <tr>
                                <td colSpan={15} onClick={() => loadMoreForGroup(groupKey)} style={{ ...styles.tableCell, ...styles.loadMoreRow }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#60a5fa', fontSize: '0.8rem', fontWeight: 600 }}>
                                    <Download size={14} />
                                    Show next 50 items (Showing {limit} of {count})
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls - Only Show in Flat View */}
            <div style={styles.paginationContainer}>
              <span style={{ marginRight: 'auto', paddingLeft: 10 }}>
                {processedData.isGrouped 
                  ? `Showing All Groups (${processedData.groups?.length || 0})` 
                  : `Total: ${serverTotalRecords} records`
                }
              </span>
              
              {!processedData.isGrouped && (
                <>
                  <button 
                    onClick={() => handlePageChange(1)}
                    disabled={page === 1}
                    style={{ ...styles.pageButton, opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                    title="First Page"
                  >
                    <ChevronsLeft size={16} /> First
                  </button>

                  <button 
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    style={{ ...styles.pageButton, opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                    title="Previous Page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  <span style={{ fontWeight: 600, color: '#e2e8f0', margin: '0 8px' }}>
                    Page {page} of {processedData.totalPages}
                  </span>
                  
                  <button 
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === processedData.totalPages}
                    style={{ ...styles.pageButton, opacity: page === processedData.totalPages ? 0.5 : 1, cursor: page === processedData.totalPages ? 'not-allowed' : 'pointer' }}
                    title="Next Page"
                  >
                    <ChevronRight size={16} />
                  </button>

                  <button 
                    onClick={() => handlePageChange(processedData.totalPages)}
                    disabled={page === processedData.totalPages}
                    style={{ ...styles.pageButton, opacity: page === processedData.totalPages ? 0.5 : 1, cursor: page === processedData.totalPages ? 'not-allowed' : 'pointer' }}
                    title="Last Page"
                  >
                     Last <ChevronsRight size={16} />
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 10, paddingLeft: 10, borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                    <form onSubmit={handleJumpToPageSubmit} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                     <button type="submit" style={styles.goButton}>Go To</button>
                      <input 
                        type="number"
                        min={1}
                        max={processedData.totalPages}
                        value={jumpToPage}
                        onChange={(e) => setJumpToPage(e.target.value)}
                        style={styles.pageInput}
                      />
                    </form>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}