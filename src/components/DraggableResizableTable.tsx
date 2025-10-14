import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Input } from "./ui/input";
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
  // Editing props
  editingCell?: { rowIndex: number; columnKey: string } | null;
  editValue?: any;
  setEditValue?: (value: any) => void;
  setEditingCell?: (cell: { rowIndex: number; columnKey: string } | null) => void;
  handleUpdateCell?: () => void;
  handleCellDoubleClick?: (rowIndex: number, column: Column, value: any) => void;
  handleCellEdit?: (rowIndex: number, column: Column, newValue: any) => void;
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
    item: () => ({ key: column.key, index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
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
    position: "sticky",
    top: 0,
    zIndex: isFrozen ? 40 : 35,
    left: isFrozen ? leftOffset : undefined,
    // --- MODIFIED: Use black background when frozen ---
    background: isFrozen ? "#000" : "oklch(0.145 0 0)",
    borderRight: isFrozen && isLastFrozen ? "2px solid hsl(var(--border))" : undefined,
  };

  return (
    <th
      ref={ref}
      style={headerStyle}
      className={cn(
        "group relative hover:bg-muted/40 font-medium text-muted-foreground border-r border-border/30 h-12 px-6 py-4 align-middle whitespace-nowrap tracking-wide uppercase text-xs border-b border-border/50 transition-colors",
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
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 right-0 h-full w-4 cursor-col-resize z-50"
      >
        <div className="w-0.5 h-full bg-primary opacity-0 group-hover:opacity-100 group-hover:scale-y-125 transition-all duration-200 mx-auto" />
      </div>
    </th>
  );
}


export function DraggableResizableTable({
  data,
  columns: initialColumns,
  sortedData = [],
  onRowSelect,
  onSort,
  getSortIcon,
  groupedData,
  activeGroupBy,
  idKey = "id",
  frozenColumnKey,
  columnOrder,
  columnSizing,
  editingCell,
  editValue,
  setEditValue,
  setEditingCell,
  handleUpdateCell,
  handleCellDoubleClick,
  handleCellEdit,
}: DraggableResizableTableProps) {
  const [columns, setColumns] = useState(initialColumns);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const widths: Record<string, number> = {};
    initialColumns.forEach(col => {
      widths[col.key] = 150;
    });
    return widths;
  });
  const [tableData, setTableData] = useState<ListItem[]>(data);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setColumns(initialColumns);
    setColumnWidths(prevWidths => {
      const newWidths: Record<string, number> = {};
      initialColumns.forEach(col => {
        newWidths[col.key] = prevWidths[col.key] || 150;
      });
      return newWidths;
    });
  }, [initialColumns]);

  const { frozenColumns, leftOffsets } = useMemo(() => {
    if (!frozenColumnKey) {
      return { frozenColumns: [], leftOffsets: {} };
    }
    const orderedVisibleKeys = columnOrder.filter(key => columns.some(c => c.key === key));
    const freezeIndex = orderedVisibleKeys.indexOf(frozenColumnKey);
    
    if (freezeIndex === -1) {
      return { frozenColumns: [], leftOffsets: {} };
    }
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

  return (
    <DndProvider backend={HTML5Backend}>
      <Table className="min-w-full table-fixed border-separate" style={{ borderSpacing: 0 }}>
        {(!activeGroupBy || activeGroupBy === "none") && (
          <TableHeader>
            <TableRow>
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
                {activeGroupBy && activeGroupBy !== "none" && expandedGroups.has(groupName) && (
                   <TableRow>
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
                 {(!activeGroupBy || activeGroupBy === "none" || expandedGroups.has(groupName)) && items.map((item) => {
                  const absoluteIndex = sortedData.findIndex(d => d[idKey as keyof ListItem] === item[idKey as keyof ListItem]);

                  return (
                    <TableRow
                      key={item[idKey] || item.id}
                      className="border-b border-border/50 transition-all duration-200 group"
                    >
                      {columns.map((column) => {
                        const isFrozen = frozenColumns.includes(column.key);
                        const cellValue = item[column.key];
                        const isEditing = editingCell?.rowIndex === absoluteIndex && editingCell?.columnKey === column.key;

                        const cellStyle: React.CSSProperties = {
                          width: `${columnWidths[column.key] || 150}px`,
                          minWidth: `${columnWidths[column.key] || 150}px`,
                          maxWidth: `${columnWidths[column.key] || 150}px`,
                          position: isFrozen ? "sticky" : undefined,
                          left: isFrozen ? leftOffsets[column.key] : undefined,
                          zIndex: isFrozen ? 20 : undefined,
                          // --- MODIFIED: Use black background when frozen ---
                          background: isFrozen ? "#000" : undefined,
                          borderRight: isFrozen && column.key === lastFrozenColumnKey ? "2px solid hsl(var(--border))" : undefined,
                        };

                        return (
                          <TableCell
                            key={column.key}
                            style={cellStyle}
                            className={cn(
                              "px-6 py-4 text-sm text-foreground/90 transition-colors group-hover:bg-muted/30",
                              isFrozen && "group-hover:bg-black/80", // Adjust hover for frozen cells
                              "cursor-pointer"
                            )}
                            onClick={() => {
                              if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
                              clickTimeoutRef.current = setTimeout(() => {
                                onRowSelect(item);
                              }, 250);
                            }}
                            onDoubleClick={(e) => {
                              if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
                              e.stopPropagation();
                              if (handleCellDoubleClick && column.editable) {
                                handleCellDoubleClick(absoluteIndex, column, cellValue);
                              }
                            }}
                          >
                            {isEditing && handleUpdateCell && setEditValue && setEditingCell ? (
                              <Input
                                type="text"
                                value={editValue ?? ''}
                                onChange={(e) => setEditValue && setEditValue(e.target.value)}
                                onBlur={() => handleCellEdit && handleCellEdit(absoluteIndex, column, editValue)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCellEdit && handleCellEdit(absoluteIndex, column, editValue);
                                  if (e.key === 'Enter') setEditingCell && setEditingCell(null);
                                }}
                                autoFocus
                                className="w-full bg-background p-1 border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            ) : (
                                <div className="truncate">
                                  {column.render
                                    ? column.render(cellValue, item)
                                    : String(cellValue ?? "")}
                                </div>
                              )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  )
                })}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </DndProvider>
  );
}