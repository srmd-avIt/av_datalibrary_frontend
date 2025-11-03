import React, { useState, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { GripVertical, ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Column } from './types';
import { toast } from 'sonner';

const ITEM_TYPE = 'COLUMN';

interface DraggableColumnProps {
  column: Column;
  index: number;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
  onToggle: () => void;
  isVisible: boolean;
}

const DraggableColumn: React.FC<DraggableColumnProps> = ({ column, index, moveCard, onToggle, isVisible }) => {
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
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  preview(drop(ref));

  return (
    <div
      ref={ref}
      className={`flex items-center justify-between p-2 mb-2 rounded-md border bg-muted/30 ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <div className="flex items-center gap-2">
        <div ref={(node) => { drag(node as any); }} className="cursor-grab p-1">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <span className="text-sm">{column.label}</span>
      </div>
      <Button variant="ghost" size="sm" onClick={onToggle} title={isVisible ? 'Hide' : 'Show'}>
        {isVisible ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
      </Button>
    </div>
  );
};

interface ManageColumnsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  allColumns: Column[];
  visibleColumnKeys: string[];
  // now provide hidden keys and optional viewId so parent can persist and react
  onSave: (newVisibleKeys: string[], hiddenKeys: string[], viewId?: string) => void;
  viewId?: string; // optional view identifier - used to persist global layout per view
}

export const ManageColumnsDialog: React.FC<ManageColumnsDialogProps> = ({ isOpen, onClose, allColumns, visibleColumnKeys, onSave, viewId }) => {
  const [currentVisible, setCurrentVisible] = useState<Column[]>([]);
  const [currentHidden, setCurrentHidden] = useState<Column[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      const visible = visibleColumnKeys.map(key => allColumns.find(c => c.key === key)).filter((c): c is Column => !!c);
      const hidden = allColumns.filter(c => !visibleColumnKeys.includes(c.key));
      setCurrentVisible(visible);
      setCurrentHidden(hidden);
    }
  }, [isOpen, allColumns, visibleColumnKeys]);

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
        setCurrentHidden(prev => [...prev, columnToHide]);
      }
    } else {
      const columnToShow = currentHidden.find(c => c.key === columnKey);
      if (columnToShow) {
        setCurrentHidden(prev => prev.filter(c => c.key !== columnKey));
        setCurrentVisible(prev => [...prev, columnToShow]);
      }
    }
  };

  const handleSave = async () => {
    const newVisibleKeys = currentVisible.map(c => c.key);
    const hiddenKeys = currentHidden.map(c => c.key);

    // Try to save global layout to server (so it applies for all users)
    // Backend endpoint example: PUT /api/views/{viewId}/columns
    if (viewId) {
      try {
        const apiUrl = (import.meta as any).env?.VITE_API_URL || '';
        if (apiUrl) {
          const resp = await fetch(`${apiUrl}/views/${encodeURIComponent(String(viewId))}/columns`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visible: newVisibleKeys, hidden: hiddenKeys }),
          });
          if (!resp.ok) throw new Error(`Server responded ${resp.status}`);
          toast.success('Column layout saved for all users (server).');
        } else {
          // fallback to localStorage if no API base configured
          localStorage.setItem(`global-column-order-${String(viewId).replace(/\s/g, "")}`, JSON.stringify(newVisibleKeys));
          localStorage.setItem(`global-hidden-columns-${String(viewId).replace(/\s/g, "")}`, JSON.stringify(hiddenKeys));
          toast.success('Column layout saved for all users (local fallback).');
        }
      } catch (err) {
        console.error('Failed saving global layout to server, falling back to localStorage', err);
        try {
          localStorage.setItem(`global-column-order-${String(viewId).replace(/\s/g, "")}`, JSON.stringify(newVisibleKeys));
          localStorage.setItem(`global-hidden-columns-${String(viewId).replace(/\s/g, "")}`, JSON.stringify(hiddenKeys));
          toast.success('Column layout saved to localStorage (fallback).');
        } catch (e) {
          console.error('LocalStorage fallback failed', e);
          toast.error('Failed to save column layout.');
        }
      }
    } else {
      // No viewId: still persist locally for convenience
      try {
        const key = `global-column-order-unknown`;
        localStorage.setItem(key, JSON.stringify(newVisibleKeys));
        localStorage.setItem(`${key}-hidden`, JSON.stringify(hiddenKeys));
        toast.success('Column layout saved to localStorage.');
      } catch (e) {
        console.error('Failed to save global layout to localStorage', e);
        toast.error('Failed to save column layout.');
      }
    }

    // notify parent with both visible & hidden lists and viewId
    onSave(newVisibleKeys, hiddenKeys, viewId);
    onClose();
  };

  return (
   <Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent
    style={{
      maxWidth: "800px", // smaller, clean width
      width: "90%", // responsive
      padding: "20px",
      borderRadius: "12px",
    }}
  >
    <DialogHeader>
      <DialogTitle>Manage Columns</DialogTitle>
      <DialogDescription>
        Drag and drop to reorder, or use the arrows to show/hide columns. Changes will apply to all users.
      </DialogDescription>
    </DialogHeader>

    <DndProvider backend={HTML5Backend}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          paddingTop: "16px",
        }}
      >
        <Card style={{ padding: "12px" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" /> Visible Columns
            </CardTitle>
          </CardHeader>
          <CardContent className="h-96 overflow-y-auto">
            {currentVisible.map((col, i) => (
              <DraggableColumn
                key={col.key}
                index={i}
                column={col}
                moveCard={moveVisibleCard}
                onToggle={() => toggleColumn(col.key, true)}
                isVisible={true}
              />
            ))}
          </CardContent>
        </Card>

        <Card style={{ padding: "12px" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <EyeOff className="w-5 h-5" /> Hidden Columns
            </CardTitle>
          </CardHeader>
          <CardContent className="h-96 overflow-y-auto">
            {currentHidden.map((col, i) => (
              <DraggableColumn
                key={col.key}
                index={i}
                column={col}
                moveCard={() => {}}
                onToggle={() => toggleColumn(col.key, false)}
                isVisible={false}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </DndProvider>

    <DialogFooter
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: "12px",
        padding: "12px 16px",
        flexWrap: "wrap", // ✅ makes buttons wrap on smaller screens
      }}
    >
      <Button
        variant="outline"
        onClick={onClose}
        style={{
          padding: "8px 18px",
          fontSize: "14px",
          minWidth: "100px",
          flex: "1 1 auto", // ✅ allows resizing on small screens
        }}
      >
        Cancel
      </Button>
      <Button
        onClick={handleSave}
        style={{
          padding: "8px 18px",
          fontSize: "14px",
          minWidth: "150px",
          flex: "1 1 auto", // ✅ responsive width
        }}
      >
        Save for All Users
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

  );
};