/// <reference types="vite/client" />
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { GripVertical, ArrowLeft, ArrowRight, Eye, EyeOff, User, Users, Trash2, Loader2, CheckSquare, X } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';

const ITEM_TYPE = 'COLUMN';
const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL) || "";

// --- Type Definitions ---
export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  editable?: boolean;
  isCustom?: boolean; 
}

interface SimpleUser {
  id: string;
  name: string;
  email: string;
}

export type SaveTarget = 
  | { type: 'global_guest' }
  | { type: 'specific_users'; userIds: string[] };

export interface SaveConfig {
  viewId: string;
  visibleKeys: string[];
  hiddenKeys: string[];
  target: SaveTarget;
}

// --- Draggable Column Component ---
interface DraggableColumnProps {
  column: Column;
  index: number;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
  onToggle: () => void;
  isVisible: boolean;
  onRemove: () => void;
  isCustom?: boolean;
  listId: string; 
}

const DraggableColumn: React.FC<DraggableColumnProps> = ({ 
  column, 
  index, 
  moveCard, 
  onToggle, 
  isVisible, 
  onRemove, 
  isCustom,
  listId 
}) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: ITEM_TYPE,
    hover(item: { index: number; listId: string }, monitor) {
      if (!ref.current) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;
      const sourceListId = item.listId;

      if (sourceListId !== listId) return;
      if (dragIndex === hoverIndex) return;
      
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      
      moveCard(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: ITEM_TYPE,
    item: { index, listId }, 
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    canDrag: isVisible, 
  });

  preview(drop(ref));

  return (
    <div 
      ref={ref} 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        marginBottom: '8px',
        borderRadius: '8px',
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        opacity: isDragging ? 0.4 : 1,
        transition: 'background-color 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flex: 1 }}>
        {isVisible && (
          <div ref={(node) => { drag(node as any); }} style={{ cursor: 'grab', padding: '2px', flexShrink: 0 }}>
            <GripVertical style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
          </div>
        )}
        <span style={{ fontSize: '14px', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }} title={column.label}>
          {column.label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        {isCustom && (
          <Button variant="ghost" size="sm" onClick={onRemove} style={{ padding: '6px', height: 'auto' }} title="Remove custom column">
            <Trash2 style={{ width: '16px', height: '16px', color: '#ef4444' }} />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onToggle} style={{ padding: '6px', height: 'auto', color: '#cbd5e1' }} title={isVisible ? 'Hide' : 'Show'}>
          {isVisible ? <ArrowRight style={{ width: '16px', height: '16px' }} /> : <ArrowLeft style={{ width: '16px', height: '16px' }} />}
        </Button>
      </div>
    </div>
  );
};

// --- Main Dialog Component ---
interface ManageColumnsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  allColumns: Column[];
  visibleColumnKeys: string[];
  onSave: (saveConfig: SaveConfig) => void;
  viewId: string;
  users?: SimpleUser[];
  onColumnsUpdate: (newAllColumns: Column[]) => void;
  apiEndpoint?: string; 
}

export const ManageColumnsDialog: React.FC<ManageColumnsDialogProps> = ({ 
  isOpen, 
  onClose, 
  allColumns, 
  visibleColumnKeys, 
  onSave, 
  viewId, 
  users = [], 
  onColumnsUpdate,
  apiEndpoint 
}) => {
  const [internalColumns, setInternalColumns] = useState<Column[]>([]);
  const [currentVisible, setCurrentVisible] = useState<Column[]>([]);
  const [currentHidden, setCurrentHidden] = useState<Column[]>([]);
  const [isLoadingBackend, setIsLoadingBackend] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [showColumnEditor, setShowColumnEditor] = useState(false); 
  const [isSaving, setIsSaving] = useState(false);
  
  const [lastUserSummary, setLastUserSummary] = useState<string | null>(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSelectedUserIds([]);
      setShowColumnEditor(false);
      setUserSearch('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !showColumnEditor) return;

    const initializeColumns = async () => {
      let mergedColumns = [...allColumns];

      // Fetch dynamic columns from backend API if endpoint provided
      if (apiEndpoint) {
        setIsLoadingBackend(true);
        try {
          const fetchUrl = `${API_BASE_URL}${apiEndpoint}${apiEndpoint.includes('?') ? '&' : '?'}limit=1`;
          const token = localStorage.getItem('app-token');

          const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : '', 
            }
          });

          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('app-token');
            localStorage.removeItem('google-token');
            window.location.href = '/'; 
            return;
          }

          if (response.ok) {
            const data = await response.json();
            const rows = Array.isArray(data) ? data : (data.data || []);
            
            if (rows.length > 0) {
              const sampleRow = rows[0];
              const backendKeys = Object.keys(sampleRow);
              const existingKeys = new Set(mergedColumns.map(c => c.key));
              
              const newDiscoveredColumns: Column[] = backendKeys
                .filter(key => !existingKeys.has(key))
                .map(key => ({
                  key: key,
                  label: key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim().replace(/^./, str => str.toUpperCase()),
                  sortable: true,
                  editable: false, 
                  isCustom: false
                }));

              if (newDiscoveredColumns.length > 0) {
                mergedColumns = [...mergedColumns, ...newDiscoveredColumns];
              }
            }
          }
        } catch (error) {
          console.error("Failed to fetch backend columns", error);
        } finally {
          setIsLoadingBackend(false);
        }
      }

      setInternalColumns(mergedColumns);

      let initialVisibleKeys = visibleColumnKeys;
      const referenceUserId = selectedUserIds.length > 0 ? selectedUserIds[0] : null;

      // FETCH FROM DATABASE RATHER THAN LOCALSTORAGE
      if (referenceUserId) {
        try {
          const token = localStorage.getItem('app-token');
          // FIXED: Added /api/ to the endpoint
          const configRes = await fetch(`${API_BASE_URL}/user-column-preferences?viewId=${viewId}&userId=${referenceUserId}`, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '', 
            }
          });

          if (configRes.ok) {
            const savedConfig = await configRes.json();
            if (savedConfig && Array.isArray(savedConfig.visible)) {
              initialVisibleKeys = savedConfig.visible;
              if (selectedUserIds.length === 1) {
                setLastUserSummary(savedConfig.summary || null);
              } else {
                setLastUserSummary(null);
              }
              // Update local cache for immediate app availability 
              localStorage.setItem(`columnConfig-${viewId}-${referenceUserId}`, JSON.stringify({ visible: savedConfig.visible, hidden: savedConfig.hidden }));
            }
          } else {
             // Fallback to local storage if DB call fails
             const savedConfigStr = localStorage.getItem(`columnConfig-${viewId}-${referenceUserId}`);
             if (savedConfigStr) {
               const savedConfig = JSON.parse(savedConfigStr);
               if (savedConfig && Array.isArray(savedConfig.visible)) {
                 initialVisibleKeys = savedConfig.visible;
                 if (selectedUserIds.length === 1) {
                   setLastUserSummary(localStorage.getItem(`columnChangesSummary-${viewId}-${referenceUserId}`));
                 }
               }
             }
          }
        } catch (e) {
          console.error("Error fetching user config from database", e);
        }
      } else {
        setLastUserSummary(null);
      }

      const visibleOrdered = initialVisibleKeys
        .map(key => mergedColumns.find(c => c.key === key))
        .filter((c): c is Column => !!c);
      
      const visibleKeysSet = new Set(visibleOrdered.map(c => c.key));
      const hidden = mergedColumns.filter(c => !visibleKeysSet.has(c.key));
      hidden.sort((a, b) => a.label.localeCompare(b.label));

      setCurrentVisible(visibleOrdered);
      setCurrentHidden(hidden);
    };

    initializeColumns();
  }, [isOpen, showColumnEditor, allColumns, visibleColumnKeys, apiEndpoint, selectedUserIds, viewId]); 

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    const filtered = getFilteredUsers();
    const filteredIds = filtered.map(u => u.id);
    const allSelected = filteredIds.every(id => selectedUserIds.includes(id));

    if (allSelected) {
      setSelectedUserIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      const newIds = [...selectedUserIds];
      filteredIds.forEach(id => {
        if (!newIds.includes(id)) newIds.push(id);
      });
      setSelectedUserIds(newIds);
    }
  };

  const getFilteredUsers = () => {
    return !userSearch
      ? users
      : users.filter(u =>
          u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(userSearch.toLowerCase())
        );
  };

  const moveVisibleCard = useCallback((dragIndex: number, hoverIndex: number) => {
    setCurrentVisible(prev => {
      const newCards = [...prev];
      if (dragIndex < 0 || dragIndex >= newCards.length || hoverIndex < 0 || hoverIndex >= newCards.length) return prev;
      const dragCard = newCards[dragIndex];
      newCards.splice(dragIndex, 1);
      newCards.splice(hoverIndex, 0, dragCard);
      return newCards;
    });
  }, []);

  const toggleColumn = (columnKey: string, isVisible: boolean) => {
    if (isVisible) {
      const columnToHide = currentVisible.find(c => c.key === columnKey);
      if (columnToHide) {
        setCurrentVisible(prev => prev.filter(c => c.key !== columnKey));
        setCurrentHidden(prev => [...prev, columnToHide].sort((a, b) => a.label.localeCompare(b.label)));
      }
    } else {
      const columnToShow = currentHidden.find(c => c.key === columnKey);
      if (columnToShow) {
        setCurrentHidden(prev => prev.filter(c => c.key !== columnKey));
        setCurrentVisible(prev => [...prev, columnToShow]);
      }
    }
  };
  
  const handleRemoveColumn = (keyToRemove: string) => {
    setInternalColumns(prev => prev.filter(c => c.key !== keyToRemove));
    setCurrentVisible(prev => prev.filter(c => c.key !== keyToRemove));
    setCurrentHidden(prev => prev.filter(c => c.key !== keyToRemove));
    toast.info("Custom column removed.");
  };

  // UPDATED handleSave TO PUSH TO DATABASE
  const handleSave = async (target: SaveTarget) => {
    if (currentVisible.length === 0) {
      toast.warning("Cannot save an empty layout. Please make at least one column visible.");
      return;
    }

    setIsSaving(true);
    onColumnsUpdate(internalColumns);

    const visibleKeys = currentVisible.map(c => c.key);
    const visibleKeysSet = new Set(visibleKeys);
    const hiddenKeys = internalColumns
      .filter(c => !visibleKeysSet.has(c.key))
      .map(c => c.key);
    
    const summaryText = `Visible: ${visibleKeys.join(', ')}, Hidden: ${hiddenKeys.join(', ')}`;

    if (target.type === 'specific_users') {
      try {
        const token = localStorage.getItem('app-token');
        // FIXED: Added /api/ to the endpoint
        await fetch(`${API_BASE_URL}/user-column-preferences`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({
            viewId,
            userIds: target.userIds,
            visibleKeys,
            hiddenKeys,
            summaryText
          })
        });

        // Save local cache for immediate availability
        target.userIds.forEach(uid => {
          localStorage.setItem(`columnConfig-${viewId}-${uid}`, JSON.stringify({ visible: visibleKeys, hidden: hiddenKeys }));
          localStorage.setItem(`columnChangesSummary-${viewId}-${uid}`, summaryText);
        });

        if (target.userIds.length === 1) setLastUserSummary(summaryText);
        toast.success("Layout saved successfully!");
      } catch (e) {
        console.error("Failed to save layout to DB", e);
        toast.error("Network error. Saved layout locally.");
      }
    }

    onSave({ viewId, visibleKeys, hiddenKeys, target });
    setIsSaving(false);
    onClose();
    setShowColumnEditor(false);
    setSelectedUserIds([]);
    setUserSearch('');
  };

  const getUserLabel = () => {
    if (selectedUserIds.length === 1) {
      return users.find(u => u.id === selectedUserIds[0])?.name || "User";
    }
    return `${selectedUserIds.length} Users`;
  };

  // ==========================================
  // 📱 PERFECT MOBILE UI 
  // ==========================================
  const renderMobileUserSelection = () => {
    if (!isOpen) return null;
    const filteredUsers = getFilteredUsers();
    
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: '#0b1120', color: 'white', display: 'flex', flexDirection: 'column', height: '100dvh' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', backgroundColor: 'rgba(15,23,42,0.95)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: '#f8fafc' }}>Select Users</h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0 0' }}>Select users to apply settings</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} style={{ padding: 0, height: 36, width: 36, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <X style={{ width: '20px', height: '20px', color: '#cbd5e1' }} />
          </Button>
        </div>

        <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexShrink: 0 }}>
            <Input
              placeholder="Search users..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white', height: 44, borderRadius: 8, fontSize: 16 }}
            />
            <Button variant="outline" onClick={handleSelectAllUsers} style={{ height: 44, backgroundColor: '#1e293b', borderColor: '#334155', color: 'white', borderRadius: 8 }}>
              {filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.includes(u.id)) ? "Deselect All" : "Select All"}
            </Button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #1e293b', borderRadius: 12, backgroundColor: '#0f172a', padding: 8 }}>
            {filteredUsers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b", fontSize: 14 }}>No users found</div>
            ) : (
              filteredUsers.map(user => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => handleToggleUser(user.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "8px",
                      backgroundColor: isSelected ? "rgba(59,130,246,0.15)" : "transparent",
                      border: isSelected ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
                      marginBottom: 4, cursor: 'pointer'
                    }}
                  >
                    <Checkbox checked={isSelected} onCheckedChange={() => handleToggleUser(user.id)} onClick={e => e.stopPropagation()} style={{ borderColor: '#64748b' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "15px", color: isSelected ? '#fff' : '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                      <div style={{ fontSize: "13px", color: "#64748b", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #1e293b', backgroundColor: 'rgba(15,23,42,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexShrink: 0, paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          <div style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>
            {selectedUserIds.length} selected
          </div>
          <Button
            onClick={() => setShowColumnEditor(true)}
            disabled={selectedUserIds.length === 0}
            style={{ backgroundColor: '#2563eb', color: 'white', borderRadius: 8, height: 44, padding: '0 24px', fontWeight: 600 }}
          >
            Next <ArrowRight style={{ width: '16px', height: '16px', marginLeft: '8px' }} />
          </Button>
        </div>
      </div>
    );
  };

  const renderMobileColumnEditor = () => {
    if (!isOpen) return null;

    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: '#0b1120', color: 'white', display: 'flex', flexDirection: 'column', height: '100dvh' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', backgroundColor: 'rgba(15,23,42,0.95)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button variant="ghost" onClick={() => setShowColumnEditor(false)} style={{ padding: 0, height: 36, width: 36, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <ArrowLeft style={{ width: '20px', height: '20px', color: '#cbd5e1' }} />
          </Button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Cols: {getUserLabel()}
            </h2>
          </div>
        </div>

        <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {selectedUserIds.length > 1 && (
            <div style={{ padding: '12px', borderRadius: 8, backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
               <Users style={{ width: '20px', height: '20px', flexShrink: 0 }} />
               <span>Applying layout to <strong>{selectedUserIds.length}</strong> users.</span>
            </div>
          )}

          <DndProvider backend={HTML5Backend}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 50%', minHeight: '300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexShrink: 0 }}>
                <Eye style={{ width: '18px', height: '18px', color: '#60a5fa' }} />
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: '#f8fafc' }}>Visible ({currentVisible.length})</h3>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 8 }}>
                {currentVisible.map((col, i) => (
                  <DraggableColumn
                    key={col.key} index={i} column={col} moveCard={moveVisibleCard} onToggle={() => toggleColumn(col.key, true)}
                    isVisible={true} onRemove={() => handleRemoveColumn(col.key)} isCustom={col.isCustom} listId="VISIBLE"
                  />
                ))}
                {currentVisible.length === 0 && <div style={{ textAlign: "center", color: "#64748b", padding: "20px 0", fontSize: 14 }}>No visible columns.</div>}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 50%', minHeight: '300px' }}>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <EyeOff style={{ width: '18px', height: '18px', color: '#64748b' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: '#cbd5e1' }}>Hidden ({currentHidden.length})</h3>
                </div>
                {isLoadingBackend && (
                  <Loader2 style={{ width: '16px', height: '16px', color: '#60a5fa', animation: 'spin 1s linear infinite' }} />
                )}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 8 }}>
                {currentHidden.map((col, i) => (
                  <DraggableColumn
                    key={col.key} index={i} column={col} moveCard={() => {}} onToggle={() => toggleColumn(col.key, false)}
                    isVisible={false} onRemove={() => handleRemoveColumn(col.key)} isCustom={col.isCustom} listId="HIDDEN"
                  />
                ))}
                {!isLoadingBackend && currentHidden.length === 0 && <div style={{ textAlign: "center", color: "#64748b", padding: "20px 0", fontSize: 14 }}>All columns are visible.</div>}
              </div>
            </div>
          </DndProvider>
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #1e293b', backgroundColor: 'rgba(15,23,42,0.95)', display: 'flex', gap: 12, flexShrink: 0, paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          <Button variant="outline" onClick={onClose} style={{ flex: 1, backgroundColor: '#1e293b', borderColor: '#334155', color: 'white', height: 44, borderRadius: 8 }}>
            Cancel
          </Button>
          <Button disabled={isSaving} onClick={() => handleSave({ type: "specific_users", userIds: selectedUserIds })} style={{ flex: 2, backgroundColor: '#2563eb', color: 'white', height: 44, borderRadius: 8, fontWeight: 600 }}>
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Save Layout"}
          </Button>
        </div>
      </div>
    );
  };

  // ==========================================
  // 💻 DESKTOP UI
  // ==========================================
  const renderDesktopUserSelection = () => {
    const filteredUsers = getFilteredUsers();
    
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Users</DialogTitle>
            <div className="text-sm text-muted-foreground">
              Select one or more users to apply column settings.
            </div>
          </DialogHeader>
          
          <div className="flex gap-2 items-center mb-2">
            <Input
              placeholder="Search by name or email..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={handleSelectAllUsers}>
              {filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.includes(u.id)) ? "Deselect All" : "Select All"}
            </Button>
          </div>

          <ScrollArea style={{ height: "18rem", width: "100%", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px", overflowY: "auto" }}>
            {filteredUsers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "16px 0", color: "var(--muted-foreground)" }}>No users found</div>
            ) : (
              filteredUsers.map(user => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => handleToggleUser(user.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px", padding: "8px", borderRadius: "8px", cursor: "pointer",
                      backgroundColor: isSelected ? "var(--muted)" : "transparent", transition: "background 0.2s"
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "var(--muted-hover)"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    <Checkbox checked={isSelected} onCheckedChange={() => handleToggleUser(user.id)} onClick={e => e.stopPropagation()} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "14px" }}>{user.name}</div>
                      <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{user.email}</div>
                    </div>
                  </div>
                );
              })
            )}
          </ScrollArea>

          <DialogFooter className="flex justify-between sm:justify-between w-full mt-4">
             <div className="text-sm text-muted-foreground self-center">
                {selectedUserIds.length} user{selectedUserIds.length !== 1 && 's'} selected
             </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <Button variant="ghost" onClick={onClose} style={{ padding: "8px 16px", fontSize: "14px", borderRadius: "6px" }}>Cancel</Button>
              <Button onClick={() => setShowColumnEditor(true)} disabled={selectedUserIds.length === 0} style={{ padding: "8px 16px", fontSize: "14px", borderRadius: "6px" }}>Next</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const renderDesktopColumnEditor = () => {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          style={{ maxWidth: "850px", width: "90%", height: "90vh", maxHeight: "90vh", padding: "20px", borderRadius: "12px", display: "flex", flexDirection: "column", overflow: "hidden" }}
        >
          <DialogHeader>
            <DialogTitle>Manage Columns for {getUserLabel()}</DialogTitle>
            <div className="text-sm text-muted-foreground">
              Drag to reorder, use arrows to show/hide. "Hidden" list includes all available database fields.
            </div>
          </DialogHeader>

          {lastUserSummary && selectedUserIds.length === 1 && (
            <div className="mb-2 p-2 border rounded bg-muted/30 text-sm text-muted-foreground">
              <strong>Last changes for this user:</strong>
              <div className="line-clamp-2">{lastUserSummary}</div>
            </div>
          )}

          {selectedUserIds.length > 1 && (
            <div className="mb-2 p-2 border rounded bg-blue-50/50 text-blue-800 text-sm flex items-center gap-2">
               <Users className="w-4 h-4" />
               <span>You are applying this layout to <strong>{selectedUserIds.length}</strong> users at once.</span>
            </div>
          )}

          <DndProvider backend={HTML5Backend}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", paddingTop: "10px", flex: 1, overflow: "hidden" }}>
              
              <Card style={{ padding: "12px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <CardHeader>
                  <CardTitle style={{ display: "flex", alignItems: "center", gap: "8px" }}><Eye className="w-5 h-5" /> Visible ({currentVisible.length})</CardTitle>
                </CardHeader>
                <CardContent style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                  {currentVisible.map((col, i) => (
                    <DraggableColumn
                      key={col.key} index={i} column={col} moveCard={moveVisibleCard} onToggle={() => toggleColumn(col.key, true)}
                      isVisible={true} onRemove={() => handleRemoveColumn(col.key)} isCustom={col.isCustom} listId="VISIBLE" 
                    />
                  ))}
                  {currentVisible.length === 0 && <div style={{ textAlign: "center", fontSize: "14px", color: "var(--muted-foreground)", marginTop: "40px" }}>No visible columns.</div>}
                </CardContent>
              </Card>

              <Card style={{ padding: "12px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <CardHeader style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <CardTitle style={{ display: "flex", alignItems: "center", gap: "16px", padding: "4px 0" }}><EyeOff className="w-5 h-5" /> Hidden ({currentHidden.length})</CardTitle>
                  {isLoadingBackend && <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#3b82f6" }} />}
                </CardHeader>
                <CardContent style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                  {currentHidden.map((col, i) => (
                    <DraggableColumn
                      key={col.key} index={i} column={col} moveCard={() => {}} onToggle={() => toggleColumn(col.key, false)}
                      isVisible={false} onRemove={() => handleRemoveColumn(col.key)} isCustom={col.isCustom} listId="HIDDEN" 
                    />
                  ))}
                  {!isLoadingBackend && currentHidden.length === 0 && <div style={{ textAlign: "center", fontSize: "14px", color: "var(--muted-foreground)", marginTop: "40px" }}>All columns are visible.</div>}
                </CardContent>
              </Card>

            </div>
          </DndProvider>

          <DialogFooter style={{ display: "flex", justifyContent: "space-between", gap: "12px", paddingTop: "20px" }}>
            <Button variant="ghost" onClick={() => setShowColumnEditor(false)}><ArrowLeft className="w-4 h-4 mr-2" /> Back to Users</Button>
            <div style={{ display: "flex", gap: "8px" }}>
              <Button variant="outline" onClick={onClose} style={{ padding: "8px 16px", fontSize: "14px", borderRadius: "6px" }}>Cancel</Button>
              <Button
                disabled={isSaving}
                onClick={() => handleSave({ type: "specific_users", userIds: selectedUserIds })}
                style={{
                  minWidth: "140px",
                  padding: "8px 16px",
                  fontSize: "14px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {isSaving ? (
                  <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
                ) : (
                  `Save for ${getUserLabel()}`
                )}
              </Button>
            </div>
          </DialogFooter>

        </DialogContent>
      </Dialog>
    );
  };

  if (isMobile) {
    return !showColumnEditor ? renderMobileUserSelection() : renderMobileColumnEditor();
  } else {
    return !showColumnEditor ? renderDesktopUserSelection() : renderDesktopColumnEditor();
  }
};