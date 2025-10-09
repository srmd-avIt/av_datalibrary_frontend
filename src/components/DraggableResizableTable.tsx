import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { GripVertical, ChevronRight, ChevronDown } from "lucide-react";
import { cn, getColorForString } from "./ui/utils";
import { ListItem, Column } from "./types";

interface DraggableResizableTableProps {
  data: ListItem[];
  columns: Column[];
  sortedData?: ListItem[];
  onRowSelect: (item: ListItem) => void;
  onSort: (columnKey: string) => void;
  getSortIcon: (columnKey: string) => React.ReactNode;
  groupedData: Record<string, ListItem[]>;
  activeGroupBy?: string;
  idKey?: string;
  // Column freezing props
  frozenColumnKey: string | null;
  columnOrder: string[];
  columnSizing: Record<string, number>;
  // Editing props (optional for compatibility)
  editingCell?: { rowIndex: number; columnKey: string } | null;
  editValue?: any;
  setEditValue?: (value: any) => void;
  setEditingCell?: (cell: { rowIndex: number; columnKey: string } | null) => void;
  handleUpdateCell?: () => void;
  handleCellDoubleClick?: (rowIndex: number, column: any, value: any) => void;
}

const ITEM_TYPE = "COLUMN";

interface DragItem {
  index: number;
  key: string;
  type: string;
}

interface DraggableHeaderProps {
  column: Column;
  index: number;
  moveColumn: (dragIndex: number, hoverIndex: number) => void;
  onSort: (columnKey: string) => void;
  getSortIcon: (columnKey: string) => React.ReactNode;
  width: number;
  onResize: (columnKey: string, width: number) => void;
  // --- NEW PROPS for applying sticky styles ---
  isFrozen: boolean;
  isLastFrozen: boolean;
  leftOffset: number;
}

function DraggableHeader({
  column,
  index,
  moveColumn,
  onSort,
  getSortIcon,
  width,
  onResize,
// --- DESTRUCTURE NEW PROPS ---
  isFrozen, isLastFrozen, leftOffset,
}: DraggableHeaderProps) {
  const ref = useRef<HTMLTableCellElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: string | symbol | null }>({
    accept: ITEM_TYPE,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientX = (clientOffset?.x ?? 0) - hoverBoundingRect.left;

      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) return;
      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) return;

      moveColumn(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: () => {
      return { key: column.key, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(80, startWidth + (e.clientX - startX));
      onResize(column.key, newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [column.key, onResize, width]);

  // Connect drag and drop
  drag(drop(ref));

// --- NEW: Dynamic style object for freezing ---
const headerStyle: React.CSSProperties = {
  opacity: isDragging ? 0.4 : 1,
  width: `${width}px`,
  minWidth: `${width}px`,
  position: isFrozen ? "sticky" : undefined,
  left: isFrozen ? leftOffset : undefined,
  zIndex: isFrozen ? 30 : undefined,
  background: isFrozen ? "#000" : undefined, // Changed to black for frozen columns
  borderRight: isFrozen && isLastFrozen ? "2px solid hsl(var(--border))" : undefined,
  boxShadow: isFrozen && isLastFrozen ? "2px 0 0 hsl(var(--border))" : undefined,
};



  return (
  <th
      ref={ref}
      style={headerStyle} // Apply the combined style object
      className={cn( "relative group hover:bg-muted/40 bg-muted/20 font-medium text-muted-foreground border-r border-border/30 h-12 px-6 py-4 align-middle whitespace-nowrap tracking-wide uppercase text-xs border-b border-border/50 transition-colors", column.sortable && "cursor-pointer hover:text-foreground", isResizing && "select-none", "first:pl-8 last:pr-8" )}
      data-handler-id={handlerId}
    >
      {/* The main flex container for the header content */}
      <div className="flex items-center justify-between gap-3">
        {/* Drag handle remains on the left */}
        <GripVertical className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-grab hover:text-foreground" />
        
        {/* This container now centers the text and sort icon */}
        <div 
          className="flex items-center justify-center gap-2 flex-1 transition-colors"
          onClick={() => column.sortable && onSort(column.key)}
        >
          <span className="truncate font-medium">{column.label}</span>
          {column.sortable && getSortIcon(column.key)}
        </div>

        {/* Add a placeholder to balance the flex layout, keeping the text centered */}
        <div className="w-3 h-3"></div>
      </div>
      
      {/* ENHANCED TABLE STYLING: Responsive resize handles made more subtle and responsive with better hover states */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 bg-transparent hover:bg-primary/40 cursor-col-resize z-20 transition-all duration-200 hover:w-1.5"
        onMouseDown={handleMouseDown}
      />
    </th>
  );
}

export function DraggableResizableTable({
  data,
  columns: initialColumns,
  sortedData,
  onRowSelect,
  onSort,
  getSortIcon,
  groupedData,
  activeGroupBy,
  idKey = "id",
  // Column freezing props
  frozenColumnKey,
  columnOrder,
  columnSizing,
  // Editing props (optional)
  editingCell,
  editValue,
  setEditValue,
  setEditingCell,
  handleUpdateCell,
  handleCellDoubleClick,
}: DraggableResizableTableProps) {
  const [columns, setColumns] = useState(initialColumns);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const widths: Record<string, number> = {};
    initialColumns.forEach(col => {
      widths[col.key] = 150; // Default width
    });
    return widths;
  });

  // --- FIX: Sync internal state when visible columns change from parent ---
  useEffect(() => {
    setColumns(initialColumns);
    setColumnWidths(prevWidths => {
      const newWidths: Record<string, number> = {};
      initialColumns.forEach(col => {
        // Keep existing width if column was already visible, otherwise set default
        newWidths[col.key] = prevWidths[col.key] || 150;
      });
      return newWidths;
    });
  }, [initialColumns]);

   // --- CORE FREEZING LOGIC ---
  const { frozenColumns, leftOffsets } = useMemo(() => {
    if (!frozenColumnKey) {
      return { frozenColumns: [], leftOffsets: {} };
    }
    const orderedVisibleKeys = columnOrder.filter(key => columns.some(c => c.key === key));
    const freezeIndex = orderedVisibleKeys.indexOf(frozenColumnKey);
    
    if (freezeIndex === -1) {
      return { frozenColumns: [], leftOffsets: {} };
    }
    // --- MODIFICATION: Only freeze the single selected column ---
    const frozenKeys = [frozenColumnKey];
    
    const offsets: Record<string, number> = {};
    let cumulativeLeft = 0;
    
    for (const key of frozenKeys) {
      offsets[key] = cumulativeLeft;
      const columnWidth = columnSizing[key] || columnWidths[key] || 150;
      cumulativeLeft += columnWidth;
    }
    return { frozenColumns: frozenKeys, leftOffsets: offsets };
  }, [frozenColumnKey, columnOrder, columns, columnWidths, columnSizing]);

  const lastFrozenColumnKey = frozenColumns[frozenColumns.length - 1];

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  const moveColumn = useCallback((dragIndex: number, hoverIndex: number) => {
    setColumns((prevColumns) => {
      const newColumns = [...prevColumns];
      const draggedColumn = newColumns[dragIndex];
      newColumns.splice(dragIndex, 1);
      newColumns.splice(hoverIndex, 0, draggedColumn);
      return newColumns;
    });
  }, []);

  const handleResize = useCallback((columnKey: string, width: number) => {
    setColumnWidths((prev) => ({
      ...prev,
      [columnKey]: width,
    }));
  }, []);

  // REMOVED the wrapping <div> with `overflow-x-auto`.
  // The parent component now controls the scrolling container.
  return (
    <DndProvider backend={HTML5Backend}>
      <Table className="min-w-full table-fixed border-separate" style={{ borderSpacing: 0 }}>
        {/* Only show the main header if no grouping is active */}
        {(!activeGroupBy || activeGroupBy === "none") && (
          <TableHeader>
            {/* The TableRow is now the sticky element, ensuring the entire header freezes */}
            <TableRow className="sticky top-0 z-30 bg-card">
              {columns.map((column, index) => {
                const isFrozen = frozenColumns.includes(column.key);
                return (
                  <DraggableHeader
                    key={column.key}
                    column={column}
                    index={index}
                    moveColumn={moveColumn}
                    onSort={onSort}
                    getSortIcon={getSortIcon}
                    width={columnWidths[column.key] || 150}
                    onResize={handleResize}
                    isFrozen={isFrozen}
                    isLastFrozen={column.key === lastFrozenColumnKey}
                    leftOffset={isFrozen ? leftOffsets[column.key] : 0}
                  />
                );
              })}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Object.entries(groupedData).map(([groupName, items]) => {
            const bgColor = getColorForString(groupName);
            // Simple check to determine text color for contrast.
            // Add more dark pastel colors to this array if needed.
            const isDarkBg = ["#F7D379"].includes(bgColor);
            const textColor = isDarkBg ? "hsl(222.2 47.4% 11.2%)" : "hsl(222.2 84% 4.9%)";

            return (
              <React.Fragment key={groupName}>
                {/* ENHANCED TABLE STYLING: Group headers are now opaque for better freezing behavior */}
                {activeGroupBy && activeGroupBy !== "none" && (
                  <TableRow className="sticky top-0 z-20 bg-card hover:brightness-95 transition-all cursor-pointer" onClick={() => toggleGroup(groupName)}>
                    <TableCell
                      colSpan={columns.length}
                      className="bg-muted/40 font-semibold px-4 py-3 border-b border-border/30 text-left"
                    >
                      <div className="flex items-center gap-2">
                        {expandedGroups.has(groupName) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <span
                          className="px-2.5 py-0.5 rounded-md text-sm"
                          style={{ backgroundColor: bgColor, color: textColor }}
                        >
                          {groupName}
                        </span>
                        <span className="text-muted-foreground">({items.length})</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {/* Show headers within each group if grouping is active and the group is expanded */}
                {activeGroupBy && activeGroupBy !== "none" && expandedGroups.has(groupName) && (
                  <TableRow className="sticky top-[53px] z-20 bg-card">
                    {columns.map((column, index) => {
                      const isFrozen = frozenColumns.includes(column.key);
                      return (
                        <DraggableHeader
                          key={column.key}
                          column={column}
                          index={index}
                          moveColumn={moveColumn}
                          onSort={onSort}
                          getSortIcon={getSortIcon}
                          width={columnWidths[column.key] || 150}
                          onResize={handleResize}
                          isFrozen={isFrozen}
                          isLastFrozen={column.key === lastFrozenColumnKey}
                          leftOffset={isFrozen ? leftOffsets[column.key] : 0}
                        />
                      );
                    })}
                  </TableRow>
                )}
                {/* ENHANCED TABLE STYLING: Smooth interactions with enhanced hover states and better transitions */}
                 {(!activeGroupBy || activeGroupBy === "none" || expandedGroups.has(groupName)) && items.map((item) => (
                 <TableRow
  key={item[idKey] || item.id}
  className="hover:bg-muted/30 cursor-pointer border-b border-border/50 transition-all duration-200 group"
  onClick={() => onRowSelect(item)}
>
  {columns.map((column) => {
    const isFrozen = frozenColumns.includes(column.key);
// Body cell inline style
const cellStyle: React.CSSProperties = {
  width: `${columnWidths[column.key] || 150}px`,
  minWidth: `${columnWidths[column.key] || 150}px`,
  maxWidth: `${columnWidths[column.key] || 150}px`,
  position: isFrozen ? "sticky" : undefined,
  left: isFrozen ? leftOffsets[column.key] : undefined,
  zIndex: isFrozen ? 20 : undefined,
  background: isFrozen ? "#000" : undefined, // Changed to black for frozen columns
  borderRight: isFrozen && column.key === lastFrozenColumnKey ? "2px solid hsl(var(--border))" : undefined,
  boxShadow: isFrozen && column.key === lastFrozenColumnKey ? "2px 0 0 hsl(var(--border))" : undefined,
};

    return (
      <TableCell
        key={column.key}
        style={cellStyle}
        className={cn(
          "px-6 py-4 text-sm text-foreground/90 transition-colors",
          isFrozen && "bg-black" // force bg for frozen
        )}
      >
        <div className="truncate">
          {column.render
            ? column.render(item[column.key], item)
            : String(item[column.key] ?? "")}
        </div>
      </TableCell>
    );
  })}
</TableRow>

                ))}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </DndProvider>
  );
}