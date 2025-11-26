import React, { useState, useMemo, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { GripVertical, ArrowLeft, ArrowRight, Eye, EyeOff, User, Users, Trash2, Loader2, CheckSquare } from 'lucide-react';
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
}

const DraggableColumn: React.FC<DraggableColumnProps> = ({ column, index, moveCard, onToggle, isVisible, onRemove, isCustom }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: ITEM_TYPE,
    hover(item: { index: number }, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
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
    item: { index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  preview(drop(ref));

  return (
    <div ref={ref} className={`flex items-center justify-between p-2 mb-2 rounded-md border bg-muted/30 ${isDragging ? 'opacity-50' : 'opacity-100'}`}>
      <div className="flex items-center gap-2 overflow-hidden">
        <div ref={(node) => { drag(node as any); }} className="cursor-grab p-1 flex-shrink-0">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <span className="text-sm truncate" title={column.label}>{column.label}</span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {isCustom && (
          <Button variant="ghost" size="sm" onClick={onRemove} title="Remove custom column">
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onToggle} title={isVisible ? 'Hide' : 'Show'}>
          {isVisible ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
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
  
  // --- User Selection State ---
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [showColumnEditor, setShowColumnEditor] = useState(false); // Controls View Switching
  
  const [lastUserSummary, setLastUserSummary] = useState<string | null>(null);
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newColumnLabel, setNewColumnLabel] = useState('');

  // --- Reset state when dialog opens/closes ---
  useEffect(() => {
    if (!isOpen) {
      setSelectedUserIds([]);
      setShowColumnEditor(false);
      setUserSearch('');
    }
  }, [isOpen]);

  // --- MAIN LOGIC: Fetch backend columns and merge (Runs when Editor Opens) ---
  useEffect(() => {
    if (!isOpen || !showColumnEditor) return;

    const initializeColumns = async () => {
      // 1. Start with columns defined in frontend config
      let mergedColumns = [...allColumns];

      // 2. Fetch from backend if endpoint provided
      if (apiEndpoint) {
        setIsLoadingBackend(true);
        try {
          const fetchUrl = `${API_BASE_URL}${apiEndpoint}${apiEndpoint.includes('?') ? '&' : '?'}limit=1`;
          const response = await fetch(fetchUrl);
          
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
          toast.error("Could not fetch full column list from database.");
        } finally {
          setIsLoadingBackend(false);
        }
      }

      setInternalColumns(mergedColumns);

      // 3. Determine Visible vs Hidden
      let initialVisibleKeys = visibleColumnKeys;

      // --- SINGLE USER MODE: Check localStorage ---
      // If only 1 user is selected, we try to load their specific previous config.
      // If MULTIPLE users are selected, we default to the view's base config (safer than loading User A's config for User B).
      if (selectedUserIds.length === 1) {
        const savedConfigStr = localStorage.getItem(`columnConfig-${viewId}-${selectedUserIds[0]}`);
        if (savedConfigStr) {
          try {
            const savedConfig = JSON.parse(savedConfigStr);
            if (savedConfig && Array.isArray(savedConfig.visible)) {
              initialVisibleKeys = savedConfig.visible;
              
              // Load summary for the UI
              const summary = localStorage.getItem(`columnChangesSummary-${viewId}-${selectedUserIds[0]}`);
              setLastUserSummary(summary || null);
            }
          } catch (e) {
            console.error("Error parsing saved config", e);
          }
        } else {
            setLastUserSummary(null);
        }
      } else {
        // Multi-user mode: Clear summary, start fresh from default
        setLastUserSummary(null);
      }

      // A. Visible
      const visibleOrdered = initialVisibleKeys
        .map(key => mergedColumns.find(c => c.key === key))
        .filter((c): c is Column => !!c);
      
      const visibleKeysSet = new Set(visibleOrdered.map(c => c.key));

      // B. Hidden (Everything else)
      const hidden = mergedColumns.filter(c => !visibleKeysSet.has(c.key));
      hidden.sort((a, b) => a.label.localeCompare(b.label));

      setCurrentVisible(visibleOrdered);
      setCurrentHidden(hidden);
    };

    initializeColumns();

  }, [isOpen, showColumnEditor, allColumns, visibleColumnKeys, apiEndpoint, selectedUserIds, viewId]); 

  // --- Handlers ---

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    // If all filtered users are selected, deselect them. Otherwise, select all filtered.
    const filtered = getFilteredUsers();
    const filteredIds = filtered.map(u => u.id);
    const allSelected = filteredIds.every(id => selectedUserIds.includes(id));

    if (allSelected) {
      // Remove filtered IDs from selection
      setSelectedUserIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // Add missing filtered IDs
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

  const moveVisibleCard = (dragIndex: number, hoverIndex: number) => {
    const dragCard = currentVisible[dragIndex];
    setCurrentVisible(prev => {
      const newCards = [...prev];
      newCards.splice(dragIndex, 1);
      newCards.splice(hoverIndex, 0, dragCard);
      return newCards;
    });
  };

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
  
  const handleAddColumn = () => {
    if (!newColumnLabel.trim()) {
      toast.error("Column Label is required.");
      return;
    }
    const generateKey = (label: string) => {
      return label.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s+/g, '');
    };
    let baseKey = generateKey(newColumnLabel);
    let finalKey = baseKey;
    let counter = 1;
    while (internalColumns.some(c => c.key === finalKey)) {
      finalKey = `${baseKey}${counter++}`;
    }
    const newColumnDef: Column = { 
      key: finalKey, 
      label: newColumnLabel, 
      sortable: true,
      editable: true,
      isCustom: true
    };
    
    const newAll = [...internalColumns, newColumnDef];
    setInternalColumns(newAll);
    setCurrentHidden(prev => [...prev, newColumnDef].sort((a, b) => a.label.localeCompare(b.label)));
    
    setIsAddColumnOpen(false);
    setNewColumnLabel('');
    toast.success(`Column "${newColumnLabel}" added.`);
  };

  const handleRemoveColumn = (keyToRemove: string) => {
    setInternalColumns(prev => prev.filter(c => c.key !== keyToRemove));
    setCurrentVisible(prev => prev.filter(c => c.key !== keyToRemove));
    setCurrentHidden(prev => prev.filter(c => c.key !== keyToRemove));
    toast.info("Custom column removed.");
  };

  const handleSave = (target: SaveTarget) => {
    if (currentVisible.length === 0) {
      toast.warning("Cannot save an empty layout. Please make at least one column visible.");
      return;
    }

    onColumnsUpdate(internalColumns);

    const visibleKeys = currentVisible.map(c => c.key);
    const visibleKeysSet = new Set(visibleKeys);
    const hiddenKeys = internalColumns
      .filter(c => !visibleKeysSet.has(c.key))
      .map(c => c.key);
    
    const summaryText = `Visible: ${visibleKeys.join(', ')}, Hidden: ${hiddenKeys.join(', ')}`;

    // Save config for ALL selected users locally
    if (target.type === 'specific_users') {
      target.userIds.forEach(uid => {
        localStorage.setItem(
          `columnConfig-${viewId}-${uid}`,
          JSON.stringify({ visible: visibleKeys, hidden: hiddenKeys })
        );
        localStorage.setItem(
          `columnChangesSummary-${viewId}-${uid}`,
          summaryText
        );
      });
      
      // Update UI state immediately if just 1 user (for better UX if dialog reopens)
      if (target.userIds.length === 1) {
        setLastUserSummary(summaryText);
      }
    }

    onSave({ viewId, visibleKeys, hiddenKeys, target });
    onClose();
    // Reset internal state
    setShowColumnEditor(false);
    setSelectedUserIds([]);
    setUserSearch('');
  };

  // --- RENDER 1: User Selection Screen ---
  if (!showColumnEditor) {
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

         <ScrollArea
  style={{
    height: "18rem",        // h-72
    width: "100%",          // w-full
    border: "1px solid #e5e7eb",   // border
    borderRadius: "8px",    // rounded-md
    padding: "8px",         // p-2
    overflowY: "auto"
  }}
>
  {filteredUsers.length === 0 ? (
    <div
      style={{
        textAlign: "center",
        padding: "16px 0",
        color: "var(--muted-foreground)"
      }}
    >
      No users found
    </div>
  ) : (
    filteredUsers.map(user => {
      const isSelected = selectedUserIds.includes(user.id);

      return (
        <div
          key={user.id}
          onClick={() => handleToggleUser(user.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",                 // space-x-3
            padding: "8px",              // p-2
            borderRadius: "8px",         // rounded-md
            cursor: "pointer",
            backgroundColor: isSelected
              ? "var(--muted)"
              : "transparent",
            transition: "background 0.2s"
          }}
          onMouseEnter={e => {
            if (!isSelected) e.currentTarget.style.background = "var(--muted-hover)";
          }}
          onMouseLeave={e => {
            if (!isSelected) e.currentTarget.style.background = "transparent";
          }}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => handleToggleUser(user.id)}
          />

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "14px" }}>
              {user.name}
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
              {user.email}
            </div>
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
            <div
  style={{
    display: "flex",
    gap: "8px",         // replaces gap-2
    marginTop: "8px"    // optional (remove if not needed)
  }}
>
  <Button
    variant="ghost"
    onClick={onClose}
    style={{
      padding: "8px 16px",
      fontSize: "14px",
      borderRadius: "6px"
    }}
  >
    Cancel
  </Button>

  <Button
    onClick={() => setShowColumnEditor(true)}
    disabled={selectedUserIds.length === 0}
    style={{
      padding: "8px 16px",
      fontSize: "14px",
      borderRadius: "6px"
    }}
  >
    Next
  </Button>
</div>

          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // --- RENDER 2: Column Editor Screen ---

  const getUserLabel = () => {
    if (selectedUserIds.length === 1) {
      return users.find(u => u.id === selectedUserIds[0])?.name || "User";
    }
    return `${selectedUserIds.length} Users`;
  };

  return (
  <Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent
    style={{
      maxWidth: "850px",
      width: "90%",
      height: "90vh",
      maxHeight: "90vh",
      padding: "20px",
      borderRadius: "12px",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden" 
    }}
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
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "20px",
      paddingTop: "10px",
      flex: 1,
      overflow: "hidden"
    }}
  >

    {/* Visible Columns */}
    <Card
      style={{
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      <CardHeader>
        <CardTitle
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <Eye className="w-5 h-5" /> Visible ({currentVisible.length})
        </CardTitle>
      </CardHeader>

      <CardContent
        style={{
          flex: 1,
          overflowY: "auto",
          minHeight: 0
        }}
      >
        {currentVisible.map((col, i) => (
          <DraggableColumn
            key={col.key}
            index={i}
            column={col}
            moveCard={moveVisibleCard}
            onToggle={() => toggleColumn(col.key, true)}
            isVisible={true}
            onRemove={() => handleRemoveColumn(col.key)}
            isCustom={col.isCustom}
          />
        ))}

        {currentVisible.length === 0 && (
          <div
            style={{
              textAlign: "center",
              fontSize: "14px",
              color: "var(--muted-foreground)",
              marginTop: "40px"
            }}
          >
            No visible columns.
          </div>
        )}
      </CardContent>
    </Card>

    {/* Hidden Columns */}
    <Card
      style={{
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      <CardHeader
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <CardTitle
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            padding: "4px 0"
          }}
        >
          <EyeOff className="w-5 h-5" /> Hidden ({currentHidden.length})
        </CardTitle>

        {isLoadingBackend && (
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#3b82f6" }} />
        )}
      </CardHeader>

      <CardContent
        style={{
          flex: 1,
          overflowY: "auto",
          minHeight: 0
        }}
      >
        {currentHidden.map((col, i) => (
          <DraggableColumn
            key={col.key}
            index={i}
            column={col}
            moveCard={() => {}}
            onToggle={() => toggleColumn(col.key, false)}
            isVisible={false}
            onRemove={() => handleRemoveColumn(col.key)}
            isCustom={col.isCustom}
          />
        ))}

        {!isLoadingBackend && currentHidden.length === 0 && (
          <div
            style={{
              textAlign: "center",
              fontSize: "14px",
              color: "var(--muted-foreground)",
              marginTop: "40px"
            }}
          >
            All columns are visible.
          </div>
        )}
      </CardContent>
    </Card>

  </div>
</DndProvider>


    <DialogFooter
      style={{
        display: "flex",
        justifyContent: "space-between", // Changed for Back button
        gap: "12px",
        paddingTop: "20px"
      }}
    >
      <Button 
         variant="ghost" 
         onClick={() => setShowColumnEditor(false)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Users
      </Button>

     <div
  style={{
    display: "flex",
    gap: "8px" // gap-2
  }}
>
  <Button
    variant="outline"
    onClick={onClose}
    style={{
      padding: "8px 16px",
      fontSize: "14px",
      borderRadius: "6px"
    }}
  >
    Cancel
  </Button>

  <Button
    onClick={() => handleSave({ type: "specific_users", userIds: selectedUserIds })}
    style={{
      minWidth: "140px",   // min-w-[140px]
      padding: "8px 16px",
      fontSize: "14px",
      borderRadius: "6px"
    }}
  >
    Save for {getUserLabel()}
  </Button>
</div>

    </DialogFooter>

  </DialogContent>
</Dialog>
  );
};