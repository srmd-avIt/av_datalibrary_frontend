import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
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
  X 
} from "lucide-react";

// --- ENV SETUP ---
const API_BASE_URL = (import.meta as any).env.VITE_API_URL;
const cleanBaseUrl = API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');

// Items per page for Server Side (Normal view)
const SERVER_PAGE_SIZE = 50;
// Default Items to show inside a group initially
const GROUP_INNER_PAGE_SIZE = 50; 
// Local Storage Key for saving "Picked" status locally
const LS_FLAGS_KEY = "video_archival_flags";

// --- STYLES ---
const styles = {
  tableHeader: { 
    padding: '12px 10px', 
    fontSize: '0.7rem', 
    fontWeight: 700, 
    textTransform: 'uppercase' as const, 
    color: '#94a3b8', 
    background: 'rgba(30, 41, 59, 0.95)', 
    position: 'sticky' as const, 
    top: 0, 
    zIndex: 10, 
    whiteSpace: 'nowrap' as const, 
    borderBottom: '2px solid rgba(255,255,255,0.08)',
    cursor: 'pointer', 
    userSelect: 'none' as const,
    transition: 'background 0.2s'
  },
  innerTableHeader: {
    padding: '10px 10px', 
    fontSize: '0.65rem', 
    fontWeight: 700, 
    textTransform: 'uppercase' as const, 
    color: '#cbd5e1', 
    background: 'rgba(15, 23, 42, 0.95)', 
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    cursor: 'pointer', 
    userSelect: 'none' as const,
    position: 'sticky' as const,
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
    textOverflow: 'ellipsis' 
  },
  groupRow: {
    background: 'rgba(59, 130, 246, 0.15)',
    cursor: 'pointer',
    userSelect: 'none' as const,
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
    textAlign: 'center' as const
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
    textAlign: 'center' as const,
    outline: 'none'
  },
  modalOverlay: {
    position: 'fixed' as const,
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
    maxWidth: '1000px', 
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
  }
};

type GroupByOption = 'none' | 'EventName' | 'Yr' | 'SourceMLID';

interface VideoArchivalProjectProps {
  onBack: () => void;
  userEmail?: string;
}

export function VideoArchivalProject({ onBack, userEmail }: VideoArchivalProjectProps) {
  const [activeTab, setActiveTab] = useState<'used' | 'unused'>('used');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [jumpToPage, setJumpToPage] = useState(""); 
  const [serverTotalRecords, setServerTotalRecords] = useState(0);
  
  // Grouping State
  const [expandedColumns, setExpandedColumns] = useState<Record<string, boolean>>({});
// Store separate group-by values for each tab
const [groupByState, setGroupByState] = useState<Record<'used' | 'unused', GroupByOption>>({
  used: 'none',
  unused: 'none'
});

// Helper to get the current active group setting
const currentGroupBy = groupByState[activeTab];
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [groupPageCounts, setGroupPageCounts] = useState<Record<string, number>>({});

  // Related Reels Modal State
  const [showRelatedModal, setShowRelatedModal] = useState(false);
  const [relatedReels, setRelatedReels] = useState<any[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");

 useEffect(() => {
  setPage(1);
  setExpandedGroups({}); 
  setGroupPageCounts({});
  setJumpToPage(""); 
}, [activeTab, currentGroupBy]); // Changed 'groupBy' to 'currentGroupBy'

 useEffect(() => {
  fetchData();
}, [page, activeTab, currentGroupBy]); // Changed 'groupBy' to 'currentGroupBy'

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('app-token');
      const isGrouping = currentGroupBy !== 'none';
      const limit = isGrouping ? 5000 : SERVER_PAGE_SIZE;
      const apiPage = isGrouping ? 1 : page;

      // ⭐ SWITCH ENDPOINT BASED ON TAB
      const endpoint = activeTab === 'used' 
        ? '/api/video-archival/satsang-reels'
        : '/api/video-archival/unused-satsangs';

      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        page: apiPage.toString()
      });

      const res = await fetch(`${cleanBaseUrl}${endpoint}?${queryParams}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        const result = await res.json();
        let fetchedData = result.data || [];
        
        // --- Merge Local Storage Flags ---
        try {
          const localFlags = JSON.parse(localStorage.getItem(LS_FLAGS_KEY) || '{}');
          fetchedData = fetchedData.map((item: any) => {
            // Check flags by ReelMLID (used view) or just unique ID (unused view)
            if (localFlags[item.ReelMLID]) {
              return { ...item, EditingStatus: localFlags[item.ReelMLID] };
            }
            return item;
          });
        } catch (e) {
          console.error("Error reading local storage flags", e);
        }
        // ---------------------------------

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

  // --- View Related (Frontend Only) ---
  const handleViewRelated = (sourceMLID: string) => {
    if (!sourceMLID) return;
    
    // In "Unused" tab, this count is 0, so list will be empty, which is expected.
    // In "Used" tab, this filters the list currently in memory.
    setSelectedSourceId(sourceMLID);
    const related = data.filter(item => item.SourceMLID === sourceMLID);
    
    setRelatedReels(related);
    setShowRelatedModal(true);
  };

  // --- Flag Item & Save to LocalStorage ---
  const handleFlagItem = (mlid: string) => {
    if (!window.confirm("Are you sure you want to flag this item for editing?")) return;
    
    const statusString = `Reel In-Progress: ${userEmail || 'User'}`;
    
    // Helper to update status in a list locally
    const updateData = (list: any[]) => list.map(item => 
      item.ReelMLID === mlid || item.MLUniqueID === mlid
        ? { ...item, EditingStatus: statusString } 
        : item
    );

    // 1. Update React State
    setData(prev => updateData(prev));
    setRelatedReels(prev => updateData(prev)); 

    // 2. Save to Local Storage
    try {
      const localFlags = JSON.parse(localStorage.getItem(LS_FLAGS_KEY) || '{}');
      localFlags[mlid] = statusString;
      localStorage.setItem(LS_FLAGS_KEY, JSON.stringify(localFlags));
      toast.success("Flagged for editing (Saved Locally)");
    } catch (e) {
      console.error("Failed to save to local storage", e);
      toast.success("Flagged (Session only)");
    }
  };

  // --- Grouping Logic ---
  const processedData = useMemo(() => {
     if (currentGroupBy === 'none') {
    return { isGrouped: false, items: data, totalPages: Math.ceil(serverTotalRecords / SERVER_PAGE_SIZE) };
  }
    const groups: Record<string, any[]> = {};
  data.forEach(item => {
    // CHANGE HERE: Use currentGroupBy
    let key = item[currentGroupBy];
    if (!key) key = "Unknown / Other";
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  const groupKeys = Object.keys(groups).sort();
  const groupList = groupKeys.map(key => ({ key, items: groups[key] }));
  return { isGrouped: true, groups: groupList, totalRecords: data.length, totalPages: 1 };
}, [data, currentGroupBy, serverTotalRecords]);

  // --- Handlers ---
  const handlePageChange = (newPage: number) => {
    const max = processedData.totalPages;
    if (newPage >= 1 && newPage <= max) {
      setPage(newPage);
      setJumpToPage(""); 
    }
  };

  const handleJumpToPageSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  // --- Render Helpers ---
  const ExpandableHeader = ({ label, colKey, width, isInner = false }: { label: string, colKey: string, width?: number | string, isInner?: boolean }) => {
    const isExpanded = expandedColumns[colKey];
    const headerStyle = isInner ? styles.innerTableHeader : styles.tableHeader;
    return (
      <th 
        style={{ ...headerStyle, width }} 
        onClick={() => toggleColumn(colKey)}
        title="Click to expand/collapse column"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {label}
          {isExpanded ? <Minimize2 size={12} opacity={0.7} /> : <Maximize2 size={12} opacity={0.4} />}
        </div>
      </th>
    );
  };

  const HeaderRow = ({ isInner = false }: { isInner?: boolean }) => (
    <tr>
      <ExpandableHeader label="MLUniqueID" colKey="ReelMLID" width={120} isInner={isInner} />
      <ExpandableHeader label="EventRefMLID" colKey="SourceMLID" width={120} isInner={isInner} />
      {/* Disable sorting header click for count to keep simple */}
     <th
  style={{
    ...(isInner ? styles.innerTableHeader : styles.tableHeader),
    width: 70
  }}
>
  Reels
</th>

      
      <ExpandableHeader label="ContentFrom" colKey="ContentFrom" width={70} isInner={isInner} />
      <ExpandableHeader label="CounterFrom" colKey="CounterFrom" width={70} isInner={isInner} />
      <ExpandableHeader label="CounterTo" colKey="CounterTo" width={70} isInner={isInner} />
      <ExpandableHeader label="Event" colKey="EventName" width={200} isInner={isInner} />
      <ExpandableHeader label="Details" colKey="Detail" width={250} isInner={isInner} />
      <ExpandableHeader label="Dimension" colKey="Dimension" width={250} isInner={isInner} />
      <ExpandableHeader label="Topic" colKey="Topic" width={250} isInner={isInner} />
      <ExpandableHeader label="ProductionBucket" colKey="ProductionBucket" width={120} isInner={isInner} />
      <ExpandableHeader label="Year" colKey="Yr" width={80} isInner={isInner} />
      <ExpandableHeader label="Status" colKey="Status" width={80} isInner={isInner} />
      <ExpandableHeader label="Action" colKey="Action" width={80} isInner={isInner} />
    </tr>
  );

  const getCellStyle = (colKey: string) => ({
    ...styles.tableCell,
    whiteSpace: expandedColumns[colKey] ? 'normal' as const : 'nowrap' as const,
    wordBreak: expandedColumns[colKey] ? 'break-word' as const : undefined
  });

  const getBucketBadgeStyle = (bucket?: string) => {
    const value = (bucket || "").toLowerCase();
    const map: Record<string, any> = {
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
      letterSpacing: 0.4,
      transition: "all 0.25s ease"
    };
  };

  const renderItemRow = (item: any, idx: number) => {
    const isFlagged = item.EditingStatus && item.EditingStatus.includes("Reel In-Progress");
    const flaggedByMe = isFlagged && item.EditingStatus.includes(userEmail || "");

    return (
      <tr key={item.ReelMLID || idx} style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <td style={getCellStyle('ReelMLID')} title={!expandedColumns['ReelMLID'] ? item.ReelMLID : ''}>{item.ReelMLID}</td>
        <td style={getCellStyle('SourceMLID')} title={!expandedColumns['SourceMLID'] ? item.SourceMLID : ''}>{item.SourceMLID}</td>
        
        <td style={getCellStyle('ReelCount')}>
          <button 
            onClick={() => handleViewRelated(item.SourceMLID)}
            disabled={activeTab === 'unused'} 
            style={{ 
              background: activeTab === 'unused' ? 'transparent' : 'rgba(59, 130, 246, 0.15)', 
              border: activeTab === 'unused' ? 'none' : '1px solid rgba(59, 130, 246, 0.3)', 
              padding: '2px 8px', 
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: activeTab === 'unused' ? '#64748b' : '#60a5fa',
              cursor: activeTab === 'unused' ? 'default' : 'pointer',
              transition: 'all 0.2s'
            }}
            title={activeTab === 'used' ? "Click to view all reels from this source" : "No related reels"}
          >
            {item.ReelCount || 0}
          </button>
        </td>

        <td style={getCellStyle('ContentFrom')} title={!expandedColumns['ContentFrom'] ? item.ContentFrom : ''}>{item.ContentFrom}</td>
        <td style={getCellStyle('CounterFrom')} title={!expandedColumns['CounterFrom'] ? item.CounterFrom : ''}>{item.CounterFrom}</td>
        <td style={getCellStyle('CounterTo')} title={!expandedColumns['CounterTo'] ? item.CounterTo : ''}>{item.CounterTo}</td>
        <td style={getCellStyle('EventName')} title={!expandedColumns['EventName'] ? item.EventName : ''}>{item.EventName}</td>
        <td style={getCellStyle('Detail')} title={!expandedColumns['Detail'] ? item.Detail : ''}>{item.Detail}</td>
        <td style={getCellStyle('Dimension')} title={!expandedColumns['Dimension'] ? item.Dimension : ''}>{item.Dimension}</td>
        <td style={getCellStyle('Topic')} title={!expandedColumns['Topic'] ? item.Topic : ''}>{item.Topic}</td>
       
        <td style={getCellStyle('ProductionBucket')}>
          <span style={getBucketBadgeStyle(item.ProductionBucket)}>
            {item.ProductionBucket || ''}
          </span>
        </td>
        <td style={getCellStyle('Yr')}>{item.Yr}</td>
        <td style={styles.tableCell}>
          {isFlagged ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#f59e0b', fontSize: '0.75rem', fontWeight: 600 }}>
              <UserCheck size={14} /> {flaggedByMe ? "You" : "Others"}
            </span>
          ) : (
            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Done</span>
          )}
        </td>
        <td style={styles.tableCell}>
          <button 
            onClick={() => handleFlagItem(item.ReelMLID)}
            disabled={isFlagged}
            style={{ 
              background: isFlagged ? 'transparent' : 'rgba(59, 130, 246, 0.2)', 
              border: isFlagged ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(59, 130, 246, 0.4)', 
              color: isFlagged ? '#64748b' : '#60a5fa', 
              padding: '4px 12px', borderRadius: 6, cursor: isFlagged ? 'not-allowed' : 'pointer',
              fontSize: '0.7rem', fontWeight: 600, width: '100%',
              opacity: isFlagged ? 0.6 : 1
            }}
          >
            {isFlagged ? "Picked" : "Pick"}
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col relative">
      
      {/* Global Styles for Custom Scrollbars */}
      <style>{`
        /* Main Table Scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 41, 59, 0.5); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }

        /* Modal Scrollbar */
        .modal-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
        .modal-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
        .modal-scrollbar::-webkit-scrollbar-thumb { 
          background: #676b70; 
          border-radius: 5px; 
          border: 2px solid #0f172a; 
        }
        .modal-scrollbar::-webkit-scrollbar-corner { background: #0f172a; }
      `}</style>

      {/* ⭐ MODAL POPUP */}
      {showRelatedModal && (
        <div style={styles.modalOverlay} onClick={() => setShowRelatedModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>Reels from Source</h3>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>EventRefMLID: {selectedSourceId}</p>
              </div>
              <button 
                onClick={() => setShowRelatedModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-scrollbar" style={{ padding: '0', overflow: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#1e293b', zIndex: 10 }}>
                  <tr>
                    <th style={styles.tableHeader}>MLUniqueID</th>
                    <th style={styles.tableHeader}>ContentFrom</th>
                    <th style={styles.tableHeader}>Event Name</th>
                    <th style={styles.tableHeader}>Details</th>
                    <th style={styles.tableHeader}>Dimension</th>
                    <th style={styles.tableHeader}>Topic</th>
                    <th style={styles.tableHeader}>ProductionBucket</th>
                    <th style={styles.tableHeader}>CounterFrom</th>
                    <th style={styles.tableHeader}>CounterTo</th>
                    <th style={styles.tableHeader}>Status</th>
                    <th style={styles.tableHeader}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {relatedReels.map((item, idx) => {
                      const isFlagged = item.EditingStatus && item.EditingStatus.includes("Reel In-Progress");
                      const flaggedByMe = isFlagged && item.EditingStatus.includes(userEmail || "");
                      return (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={styles.tableCell}>{item.ReelMLID}</td>
                        <td style={styles.tableCell}>{item.ContentFrom}</td>
                        <td style={styles.tableCell}>{item.EventName}</td>
                        <td style={styles.tableCell}>{item.Detail}</td>
                        <td style={styles.tableCell}>{item.Dimension}</td>
                        <td style={styles.tableCell}>{item.Topic}</td>
                        <td style={styles.tableCell}>
                          <span style={getBucketBadgeStyle(item.ProductionBucket)}>
                            {item.ProductionBucket || 'Reel'}
                          </span>
                        </td>
                        <td style={styles.tableCell}>{item.CounterFrom}</td>
                        <td style={styles.tableCell}>{item.CounterTo}</td>
                        <td style={styles.tableCell}>
                          {isFlagged ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#f59e0b', fontSize: '0.75rem', fontWeight: 600 }}>
                              <UserCheck size={14} /> {flaggedByMe ? "You" : "Others"}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Done</span>
                          )}
                        </td>
                        <td style={styles.tableCell}>
                          <button 
                            onClick={() => handleFlagItem(item.ReelMLID)}
                            disabled={isFlagged}
                            style={{ 
                              background: isFlagged ? 'transparent' : 'rgba(59, 130, 246, 0.2)', 
                              border: isFlagged ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(59, 130, 246, 0.4)', 
                              color: isFlagged ? '#64748b' : '#60a5fa', 
                              padding: '4px 12px', borderRadius: 6, cursor: isFlagged ? 'not-allowed' : 'pointer',
                              fontSize: '0.7rem', fontWeight: 600,
                              opacity: isFlagged ? 0.6 : 1
                            }}
                          >
                            {isFlagged ? "Picked" : "Pick"}
                          </button>
                        </td>
                      </tr>
                      )
                  })}
                </tbody>
              </table>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10 }}>
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

        {/* Group By Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: '0.85rem' }}>
            <Layers size={14} />
            <span>Group By:</span>
          </div>
          <select 
  value={currentGroupBy} // Value comes from the derived variable
  onChange={(e) => {
    const newVal = e.target.value as GroupByOption;
    // Update only the key for the current tab
    setGroupByState(prev => ({
      ...prev,
      [activeTab]: newVal
    }));
  }}
  style={styles.select}
>
  <option value="none">None </option>
  <option value="Detail">Details</option>
  <option value="SourceMLID">EventRefMLID</option>
  <option value="EventName">Event Name</option>
  <option value="Yr">Year</option>
  <option value="Topic">Topic</option>
  <option value="ProductionBucket">ProductionBucket</option>
</select>
        </div>
      </div>

      {/* Table Content */}
      <div style={{ flex: 1, overflow: 'hidden', background: 'rgba(30, 41, 59, 0.4)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
              
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                {!processedData.isGrouped && (
                  <thead>
                    <HeaderRow isInner={false} />
                  </thead>
                )}

                <tbody>
                  {data.length === 0 && (
                     <tr><td colSpan={14} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No records found.</td></tr>
                  )}

                  {/* 1. FLAT VIEW */}
                  {!processedData.isGrouped && processedData.items?.map((item: any, idx: number) => renderItemRow(item, idx))}

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
                        <tr onClick={() => toggleGroup(groupKey)} style={styles.groupRow}>
                          <td colSpan={14} style={styles.groupCell}>
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
                        
                        {isExpanded && <HeaderRow isInner={true} />}
                        {visibleItems.map((item: any, idx: number) => renderItemRow(item, idx))}
                        
                        {hasMore && (
                          <tr>
                            <td colSpan={14} onClick={() => loadMoreForGroup(groupKey)} style={{ ...styles.tableCell, ...styles.loadMoreRow }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#60a5fa', fontSize: '0.8rem', fontWeight: 600 }}>
                                <Download size={14} />
                                Show next 50 items (Showing {limit} of {count})
                              </div>
                            </td>
                          </tr>
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