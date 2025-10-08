import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Input } from "./ui/input";
import { GripVertical, ChevronRight } from "lucide-react";
import { cn, getColorForString } from "./ui/utils";
import { Column, ListItem } from "./types"; // Import shared types

interface DraggableResizableTableProps {
  data: ListItem[];
  columns: Column[];
  sortedData: ListItem[]; // Add sortedData prop
  onRowSelect: (item: ListItem) => void;
  onSort: (columnKey: string) => void;
  getSortIcon: (columnKey: string) => React.ReactNode;
  groupedData: Record<string, ListItem[]>;
  activeGroupBy?: string;
  idKey?: string;
  frozenColumnKey: string | null;
  columnOrder: string[];
  columnSizing: Record<string, number>;
  // --- Add editing props ---
  editingCell: { rowIndex: number; columnKey: string } | null;
  editValue: any;
  setEditValue: (value: any) => void;
  setEditingCell: (cell: { rowIndex: number; columnKey: string } | null) => void; // Add setter prop
  handleUpdateCell: () => void;
  handleCellDoubleClick: (rowIndex: number, column: Column, value: any) => void;
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
  isFrozen,
  isLastFrozen,
  leftOffset,
}: DraggableHeaderProps) {
  const ref = useRef<HTMLTableCellElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: string | symbol | null }>({
    accept: ITEM_TYPE,
    collect(monitor: import("react-dnd").DropTargetMonitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor: import("react-dnd").DropTargetMonitor) {
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
    item: () => ({ key: column.key, index }),
    collect: (monitor: import("react-dnd").DragSourceMonitor) => ({ isDragging: monitor.isDragging() }),
  });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
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
    },
    [column.key, onResize, width]
  );

  drag(drop(ref));

  const headerStyle: React.CSSProperties = {
    opacity: isDragging ? 0.4 : 1,
    width: `${width}px`,
    minWidth: `${width}px`,
    position: "sticky", // sticky for vertical scroll
    top: 0,             // stick at top
    zIndex: isFrozen ? 40 : 35,
    left: isFrozen ? leftOffset : undefined, // frozen column
    background: isFrozen ? "#000" : "#111",  // solid header bg
    borderRight: isFrozen && isLastFrozen ? "2px solid hsl(var(--border))" : undefined,
    boxShadow: isFrozen && isLastFrozen ? "2px 0 0 hsl(var(--border))" : undefined,
  };

  return (
    <th
      ref={ref}
      style={headerStyle}
      className={cn(
        "relative group hover:bg-muted/40 bg-muted/20 font-medium text-muted-foreground border-r border-border/30 h-12 px-6 py-4 align-middle whitespace-nowrap tracking-wide uppercase text-xs border-b border-border/50 transition-colors",
        column.sortable && "cursor-pointer hover:text-foreground",
        isResizing && "select-none",
        "first:pl-8 last:pr-8"
      )}
      data-handler-id={handlerId}
    >
      <div className="flex items-center justify-between gap-3">
        <GripVertical className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-grab hover:text-foreground" />
        <div
          className="flex items-center justify-center gap-2 flex-1 transition-colors"
          onClick={() => column.sortable && onSort(column.key)}
        >
          <span className="truncate font-medium">{column.label}</span>
          {column.sortable && getSortIcon(column.key)}
        </div>
        <div className="w-3 h-3"></div>
      </div>
      {/* --- MODIFIED: Resize handle now shows a '|>' icon on hover --- */}
      <div
        className="absolute top-0 bottom-0 -right-2 w-4 flex items-center justify-center cursor-col-resize z-30 group/resize"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center h-full opacity-0 group-hover/resize:opacity-100 transition-opacity duration-200">
          <span className="border-l border-white h-1/3" />
          <ChevronRight className="w-4 h-4 text-white -ml-1.5" />
        </div>
      </div>
    </th>
  );
}

export function DraggableResizableTable({
  data,
  columns: initialColumns,
  onRowSelect,
  onSort,
  getSortIcon,
  groupedData,
  activeGroupBy,
  idKey = "id",
  frozenColumnKey,
  columnOrder,
  columnSizing,
  // --- Destructure editing props ---
  editingCell,
  editValue,
  setEditValue,
  setEditingCell, // Destructure the new prop
  handleUpdateCell,
  handleCellDoubleClick,
  sortedData, // Destructure the new prop
}: DraggableResizableTableProps) {
  const [columns, setColumns] = useState(initialColumns);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  // --- NEW: Ref to manage the single-click timer ---
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const widths: Record<string, number> = {};
    initialColumns.forEach((col) => (widths[col.key] = 150));
    return widths;
  });

  useEffect(() => {
    setColumns(initialColumns);
    setColumnWidths((prevWidths) => {
      const newWidths: Record<string, number> = {};
      initialColumns.forEach((col) => {
        newWidths[col.key] = prevWidths[col.key] || 150;
      });
      return newWidths;
    });
  }, [initialColumns]);

  const { frozenColumns, leftOffsets } = useMemo(() => {
    if (!frozenColumnKey) return { frozenColumns: [], leftOffsets: {} };
    const orderedVisibleKeys = columnOrder.filter((key) => columns.some((c) => c.key === key));
    const freezeIndex = orderedVisibleKeys.indexOf(frozenColumnKey);
    if (freezeIndex === -1) return { frozenColumns: [], leftOffsets: {} };
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
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) newSet.delete(groupName);
      else newSet.add(groupName);
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
    setColumnWidths((prev) => ({ ...prev, [columnKey]: width }));
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <Table className="min-w-full table-fixed border-separate" style={{ borderSpacing: 0 }}>
        {/* Main header */}
        {(!activeGroupBy || activeGroupBy === "none") && (
          <TableHeader>
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
            const isDarkBg = ["#F7D379"].includes(bgColor);
            const textColor = isDarkBg ? "hsl(222.2 47.4% 11.2%)" : "hsl(222.2 84% 4.9%)";

            return (
              <React.Fragment key={groupName}>
                {activeGroupBy && activeGroupBy !== "none" && (
                 <TableRow style={{ position: "sticky", top: 0, zIndex: 20, backgroundColor: "#1a1a1a", transition: "all 0.2s" }}>
  <TableCell
    colSpan={columns.length}
    style={{
      backgroundColor: "#2a2a2a",
      fontWeight: 600,
      padding: 0,
      borderBottom: "1px solid #444", // replace border-border/30
    }}
  >
    <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
      {/* Expander */}
      <div
        onClick={() => toggleGroup(groupName)}
        style={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          padding: "0.75rem",
          height: "100%",
          backgroundColor: "transparent",
          transition: "background-color 0.2s",
        }}
      >
        {/* Vertical line | */}
        <span
          style={{
            display: "inline-block",
            borderLeft: "1px solid white",
            height: "1.25rem", // 5/4 rem
          }}
        />
        {/* Arrow > */}
        <ChevronRight
          style={{
            width: "1rem",
            height: "1rem",
            color: "white",
            marginLeft: "0.25rem",
            transition: "transform 0.2s",
            transform: expandedGroups.has(groupName) ? "rotate(90deg)" : "rotate(0deg)",
          }}
        />
      </div>

      {/* Group title */}
      <div style={{ display: "flex", alignItems: "center", marginLeft: "0.5rem" }}>
        <span
          style={{
            padding: "0.125rem 0.625rem",
            borderRadius: "0.25rem",
            fontSize: "0.875rem",
            backgroundColor: bgColor,
            color: textColor,
          }}
        >
          {groupName}
        </span>
        <span style={{ marginLeft: "0.5rem", color: "#aaa" }}>{`(${items.length})`}</span>
      </div>
    </div>
  </TableCell>
</TableRow>

                )}

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

                {(!activeGroupBy || activeGroupBy === "none" || expandedGroups.has(groupName)) &&
                  items.map((item, index) => {
                    // Find the absolute index for editing state management
                    const absoluteIndex = (activeGroupBy === 'none' ? index : sortedData.findIndex(d => d[idKey] === item[idKey]));

                    return (
                      <TableRow
                        key={item[idKey] || item.id}
                        className="hover:bg-muted/30 border-b border-border/50 transition-all duration-200 group"
                        // --- REMOVED: onClick is now handled by the cells ---
                      >
                        {columns.map((column) => {
                          const isFrozen = frozenColumns.includes(column.key);
                          const leftPosition = isFrozen ? leftOffsets[column.key] : undefined;
                          
                          // --- NEW: Check if the current cell is being edited ---
                          const isEditing = editingCell?.rowIndex === absoluteIndex && editingCell?.columnKey === column.key;
                          const cellValue = item[column.key];

                          return (
                            <TableCell
                              key={column.key}
                              className={cn(
                                "px-6 py-4 text-sm text-foreground/90 transition-colors",
                                isFrozen && "sticky z-10 bg-card/95 backdrop-blur-sm",
                                isFrozen && column.key === lastFrozenColumnKey && "border-r-2 border-primary/40",
                                "cursor-pointer" // All cells are clickable
                              )}
                              style={{
                                width: `${columnSizing[column.key] || 150}px`,
                                minWidth: `${columnSizing[column.key] || 150}px`,
                                maxWidth: `${columnSizing[column.key] || 150}px`,
                                left: leftPosition,
                              }}
                              // --- MODIFIED: onClick now has a delay ---
                              onClick={() => {
                                // Clear any pending double-click timer
                                if (clickTimeoutRef.current) {
                                  clearTimeout(clickTimeoutRef.current);
                                }
                                // Set a timer to handle the single click
                                clickTimeoutRef.current = setTimeout(() => {
                                  onRowSelect(item);
                                }, 250); // 250ms delay
                              }}
                              // --- MODIFIED: onDoubleClick clears the single-click timer ---
                              onDoubleClick={(e) => {
                                // Clear the pending single-click action
                                if (clickTimeoutRef.current) {
                                  clearTimeout(clickTimeoutRef.current);
                                }
                                e.stopPropagation();
                                handleCellDoubleClick(absoluteIndex, column, cellValue);
                              }}
                            >
                              {isEditing ? (
                                <Input
                                  type="text"
                                  value={editValue ?? ''}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={handleUpdateCell}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdateCell();
                                    if (e.key === 'Escape') setEditingCell(null); // Use the passed-in setter
                                  }}
                                  autoFocus
                                  className="w-full bg-background p-1 border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                              ) : (
                                <div className="truncate">
                                  {column.render ? column.render(cellValue, item) : String(cellValue ?? "")}
                                </div>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </DndProvider>
  );
}
