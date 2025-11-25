import React, { useState, useMemo, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { GripVertical, ArrowLeft, ArrowRight, Eye, EyeOff, ChevronDown, User, Users, Plus, Trash2, Loader2 } from 'lucide-react';
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
  isCustom?: boolean; // Flag for columns added on the front-end
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

// --- Draggable Column Component (Helper) ---
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
  apiEndpoint?: string; // <--- NEW PROP ADDED HERE
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
  apiEndpoint // <--- Receive API Endpoint
}) => {
  const [internalColumns, setInternalColumns] = useState<Column[]>([]);
  const [currentVisible, setCurrentVisible] = useState<Column[]>([]);
  const [currentHidden, setCurrentHidden] = useState<Column[]>([]);
  const [isLoadingBackend, setIsLoadingBackend] = useState(false); // Loading state
  
  const [isUserSelectOpen, setIsUserSelectOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');

  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newColumnLabel, setNewColumnLabel] = useState('');

  // --- MAIN LOGIC: Fetch backend columns and merge ---
  useEffect(() => {
    if (!isOpen) return;

    const initializeColumns = async () => {
      // 1. Start with columns defined in frontend config (VIEW_CONFIGS)
      let mergedColumns = [...allColumns];

      // 2. If apiEndpoint is provided, fetch from backend to discover ALL DB columns
      if (apiEndpoint) {
        setIsLoadingBackend(true);
        try {
          // Fetch just 1 item to get the keys (schema)
          const fetchUrl = `${API_BASE_URL}${apiEndpoint}${apiEndpoint.includes('?') ? '&' : '?'}limit=1`;
          const response = await fetch(fetchUrl);
          
          if (response.ok) {
            const data = await response.json();
            // Handle standard response format { data: [...] }
            const rows = Array.isArray(data) ? data : (data.data || []);
            
            if (rows.length > 0) {
              const sampleRow = rows[0];
              const backendKeys = Object.keys(sampleRow);
              
              // Identify keys that are ALREADY in frontend config
              const existingKeys = new Set(mergedColumns.map(c => c.key));
              
              // Filter: Keep keys found in DB but NOT in frontend config
              const newDiscoveredColumns: Column[] = backendKeys
                .filter(key => !existingKeys.has(key))
                .map(key => ({
                  key: key,
                  // Format label: camelCase -> Title Case (e.g. "pra_su_duration" -> "Pra Su Duration")
                  label: key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim().replace(/^./, str => str.toUpperCase()),
                  sortable: true,
                  editable: false, 
                  isCustom: false
                }));

              // Merge backend columns into the master list
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

      // 3. Separate into Visible vs Hidden
      
      // A. Visible: Based strictly on `visibleColumnKeys` passed from parent (active view settings)
      const visibleOrdered = visibleColumnKeys
        .map(key => mergedColumns.find(c => c.key === key))
        .filter((c): c is Column => !!c);
      
      const visibleKeysSet = new Set(visibleOrdered.map(c => c.key));

      // B. Hidden: Everything in the merged list that is NOT visible
      const hidden = mergedColumns.filter(c => !visibleKeysSet.has(c.key));

      // Sort hidden list alphabetically for easier searching
      hidden.sort((a, b) => a.label.localeCompare(b.label));

      setCurrentVisible(visibleOrdered);
      setCurrentHidden(hidden);
    };

    initializeColumns();

  }, [isOpen, allColumns, visibleColumnKeys, apiEndpoint]);

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
      // Hiding: Remove from Visible -> Add to Hidden
      const columnToHide = currentVisible.find(c => c.key === columnKey);
      if (columnToHide) {
        setCurrentVisible(prev => prev.filter(c => c.key !== columnKey));
        setCurrentHidden(prev => [...prev, columnToHide].sort((a, b) => a.label.localeCompare(b.label)));
      }
    } else {
      // Showing: Remove from Hidden -> Add to Visible
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
    
    // Pass the complete merged list (Front+Backend) back up
    onColumnsUpdate(internalColumns);

    const visibleKeys = currentVisible.map(c => c.key);
    const visibleKeysSet = new Set(visibleKeys);
    const hiddenKeys = internalColumns
      .filter(c => !visibleKeysSet.has(c.key))
      .map(c => c.key);
      
    onSave({ viewId, visibleKeys, hiddenKeys, target });
    onClose();
    setIsUserSelectOpen(false);
    setSelectedUserIds([]);
    setUserSearch('');
  };
  
  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    return users.filter(u =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);
  
  const UserSelectionDialog = (
    <Dialog open={isUserSelectOpen} onOpenChange={setIsUserSelectOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Users</DialogTitle>
          {/* Fixed: Use div or p instead of DialogDescription if using custom modal wrapper in parent */}
          <div className="text-sm text-muted-foreground">
            Apply this column layout to the selected users. This will override their existing custom layout for this view.
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Input 
            placeholder="Search by name or email..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
          <ScrollArea className="h-72 w-full rounded-md border p-2">
            <div className="flex items-center space-x-2 p-2 border-b">
              <Checkbox
                id="select-all-users"
                checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                onCheckedChange={(checked) => setSelectedUserIds(checked ? filteredUsers.map(u => u.id) : [])}
              />
              <label htmlFor="select-all-users" className="text-sm font-medium">Select All ({filteredUsers.length})</label>
            </div>
            {filteredUsers.map(user => (
              <div key={user.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50">
                <Checkbox
                  id={`user-${user.id}`}
                  checked={selectedUserIds.includes(user.id)}
                  onCheckedChange={(checked) => setSelectedUserIds(prev => checked ? [...prev, user.id] : prev.filter(id => id !== user.id))}
                />
                <label htmlFor={`user-${user.id}`} className="text-sm w-full cursor-pointer">
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </label>
              </div>
            ))}
          </ScrollArea>
        </div>
       <DialogFooter className="flex gap-3">
        <Button variant="outline" onClick={() => setIsUserSelectOpen(false)} className="flex-1 py-2 text-base">Cancel</Button>
        <Button onClick={() => handleSave({ type: 'specific_users', userIds: selectedUserIds })} disabled={selectedUserIds.length === 0} className="flex-1 py-2 text-base">Save for {selectedUserIds.length} User(s)</Button>
      </DialogFooter>
      </DialogContent>
    </Dialog>
  );

 

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent style={{ maxWidth: "800px", width: "90%", padding: "20px", borderRadius: "12px" }}>
          <DialogHeader>
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle>Manage Columns</DialogTitle>
                <div className="text-sm text-muted-foreground">
                  Drag to reorder, use arrows to show/hide. "Hidden" list includes all available database fields.
                </div>
              </div>
              
            </div>
          </DialogHeader>

          <DndProvider backend={HTML5Backend}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", paddingTop: "16px" }}>
              
              {/* Visible Columns */}
              <Card style={{ padding: "12px" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" /> Visible ({currentVisible.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-96 overflow-y-auto">
                  {currentVisible.map((col, i) => (
                    <DraggableColumn key={col.key} index={i} column={col} moveCard={moveVisibleCard} onToggle={() => toggleColumn(col.key, true)} isVisible={true} onRemove={() => handleRemoveColumn(col.key)} isCustom={col.isCustom} />
                  ))}
                  {currentVisible.length === 0 && <div className="text-center text-sm text-muted-foreground mt-10">No visible columns.</div>}
                </CardContent>
              </Card>

              {/* Hidden Columns */}
              <Card style={{ padding: "12px" }}>
                <CardHeader className="flex flex-row justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <EyeOff className="w-5 h-5" /> Hidden ({currentHidden.length})
                  </CardTitle>
                  {/* Show loading spinner while fetching backend columns */}
                  {isLoadingBackend && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                </CardHeader>
                <CardContent className="h-96 overflow-y-auto">
                  {currentHidden.map((col, i) => (
                    <DraggableColumn key={col.key} index={i} column={col} moveCard={() => {}} onToggle={() => toggleColumn(col.key, false)} isVisible={false} onRemove={() => handleRemoveColumn(col.key)} isCustom={col.isCustom} />
                  ))}
                  {!isLoadingBackend && currentHidden.length === 0 && <div className="text-center text-sm text-muted-foreground mt-10">All columns are visible.</div>}
                </CardContent>
              </Card>

            </div>
          </DndProvider>

          <DialogFooter style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "20px" }}>
            <Button variant="outline" onClick={onClose} style={{ flex: 1, minWidth: "140px", padding: "10px 0", fontSize: "15px" }}>Cancel</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button style={{ flex: 1, minWidth: "140px", padding: "10px 0", fontSize: "15px" }}>
                  Save As <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => handleSave({ type: "global_guest" })}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Save for All Guests</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setIsUserSelectOpen(true)}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Save for Specific Users...</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {UserSelectionDialog}
      
    </>
  );
};