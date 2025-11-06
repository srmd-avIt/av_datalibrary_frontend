import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Input } from "./ui/input";
import { GripVertical, ChevronRight, ChevronDown } from "lucide-react";
import { cn, getColorForString, getGlassForString } from "./ui/utils";
import { ListItem, Column } from "./types";

// Interfaces for props and DnD items
interface GroupByConfig { key: string; direction: "asc" | "desc"; }
interface DraggableResizableTableProps { data: ListItem[] | Record<string, any>; columns: Column[]; sortedData?: ListItem[]; onRowSelect: (item: ListItem) => void; onSort: (columnKey: string) => void; getSortIcon: (columnKey: string) => React.ReactNode; groupedData: Record<string, any>; groupByFields: GroupByConfig[]; idKey?: string; frozenColumnKey: string | null; columnOrder: string[]; columnSizing: Record<string, number>; setViewColumnOrder: (newOrder: string[]) => void; editingCell?: { rowIndex: number; columnKey: string } | null; editValue?: any; setEditValue?: (value: any) => void; setEditingCell?: (cell: { rowIndex: number; columnKey: string } | null) => void; handleUpdateCell?: () => Promise<void>; handleCellDoubleClick?: (rowIndex: number, column: Column, value: any) => void; handleCellEdit?: (rowIndex: number, column: Column, newValue: any) => void; isMobile?: boolean; }
const ITEM_TYPE = "COLUMN";
interface DragItem { index: number; key: string; type: string; }
interface DraggableHeaderProps { column: Column; index: number; moveColumn: (dragIndex: number, hoverIndex: number) => void; onSort: (columnKey: string) => void; getSortIcon: (columnKey: string) => React.ReactNode; width: number; onResize: (columnKey: string, width: number) => void; isFrozen: boolean; isLastFrozen: boolean; leftOffset: number; }

// --- DraggableHeader Component ---
function DraggableHeader({ column, index, moveColumn, onSort, getSortIcon, width, onResize, isFrozen, isLastFrozen, leftOffset }: DraggableHeaderProps) {
  const ref = useRef<HTMLTableCellElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: string | symbol | null }>({ accept: ITEM_TYPE, collect(monitor) { return { handlerId: monitor.getHandlerId() }; }, hover(item: DragItem, monitor) { if (!ref.current) return; const dragIndex = item.index; const hoverIndex = index; if (dragIndex === hoverIndex) return; const hoverBoundingRect = ref.current.getBoundingClientRect(); const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2; const clientOffset = monitor.getClientOffset(); const hoverClientX = (clientOffset?.x ?? 0) - hoverBoundingRect.left; if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) return; if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) return; moveColumn(dragIndex, hoverIndex); item.index = hoverIndex; } });
  const [{ isDragging }, drag] = useDrag({ type: ITEM_TYPE, item: () => ({ key: column.key, index }), collect: (monitor) => ({ isDragging: monitor.isDragging() }) });
  const handleMouseDown = useCallback((e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setIsResizing(true); const startX = e.clientX; const startWidth = width; const handleMouseMove = (e: MouseEvent) => { const newWidth = Math.max(80, startWidth + (e.clientX - startX)); onResize(column.key, newWidth); }; const handleMouseUp = () => { setIsResizing(false); document.removeEventListener("mousemove", handleMouseMove); document.removeEventListener("mouseup", handleMouseUp); }; document.addEventListener("mousemove", handleMouseMove); document.addEventListener("mouseup", handleMouseUp); }, [column.key, onResize, width]);
  drag(drop(ref));
  const headerStyle: React.CSSProperties = { opacity: isDragging ? 0.4 : 1, width: `${width}px`, minWidth: `${width}px`, position: "sticky", top: 0, zIndex: isFrozen ? 40 : 35, left: isFrozen ? leftOffset : undefined, background: isFrozen ? "oklch(0.07 0 0)" : "oklch(0.145 0 0)", borderRight: isFrozen && isLastFrozen ? "2px solid hsl(var(--border))" : undefined };
  return (
    <th ref={ref} style={headerStyle} className={cn("group relative hover:bg-muted/40 font-medium text-muted-foreground border-r border-border/30 h-12 px-6 py-4 align-middle whitespace-nowrap tracking-wide uppercase text-xs border-b border-border/50 transition-colors", column.sortable && "cursor-pointer hover:text-foreground", isResizing && "select-none", "first:pl-8 last:pr-8")} data-handler-id={handlerId}>
      <div className="flex items-center justify-between gap-3"><GripVertical className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-grab hover:text-foreground" /><div className="flex items-center justify-center gap-2 flex-1 transition-colors" onClick={() => column.sortable && onSort(column.key)}><span className="truncate font-medium">{column.label}</span>{column.sortable && getSortIcon(column.key)}</div><div className="w-3 h-3"></div></div>
      <div onMouseDown={handleMouseDown} className="absolute top-0 right-0 h-full w-4 cursor-col-resize z-50"><div className="w-0.5 h-full bg-primary opacity-0 group-hover:opacity-100 group-hover:scale-y-125 transition-all duration-200 mx-auto" /></div>
    </th>
  );
}

interface RenderGroupRowsProps {
  groupData: any;
  columns: Column[];
  level: number;
  onRowSelect: (item: ListItem) => void;
  sortedData: ListItem[];
  idKey: string;
  editingCell: { rowIndex: number; columnKey: string } | null;
  editValue: any;
  setEditValue: (value: any) => void;
  setEditingCell: (cell: { rowIndex: number; columnKey: string } | null) => void;
  handleCellDoubleClick: (rowIndex: number, column: Column, value: any) => void;
  handleCellEdit: (rowIndex: number, column: Column, newValue: any) => void;
  isMobile?: boolean;
  frozenColumnKey?: string | null;
  columnOrder: string[];
  columnSizing: Record<string, number>;
  columnWidths: Record<string, number>;
  expandedGroups: Set<string>;
  toggleGroup: (key: string) => void;
  groupKeyPrefix?: string;
  onSort: (columnKey: string) => void;
  getSortIcon: (columnKey: string) => React.ReactNode;
  moveColumn: (dragIndex: number, hoverIndex: number) => void;
  handleResize: (columnKey: string, width: number) => void;
  isGroupingActive: boolean;
}

function RenderGroupRows({ groupData, columns, level, onRowSelect, sortedData, idKey, editingCell, editValue, setEditValue, setEditingCell, handleCellDoubleClick, handleCellEdit, isMobile, frozenColumnKey, columnOrder, columnSizing, columnWidths, expandedGroups, toggleGroup, groupKeyPrefix, onSort, getSortIcon, moveColumn, handleResize, isGroupingActive }: RenderGroupRowsProps) {
  const { frozenColumns, leftOffsets, lastFrozenColumnKey } = useMemo(() => {
    if (!frozenColumnKey) return { frozenColumns: [] as string[], leftOffsets: {} as Record<string, number>, lastFrozenColumnKey: null };
    const orderedVisibleKeys = columnOrder.filter((key: string) => columns.some((c: Column) => c.key === key));
    const freezeIndex = orderedVisibleKeys.indexOf(frozenColumnKey);
    if (freezeIndex === -1) return { frozenColumns: [] as string[], leftOffsets: {} as Record<string, number>, lastFrozenColumnKey: null };
    const frozenKeys = orderedVisibleKeys.slice(0, freezeIndex + 1);
    const offsets: Record<string, number> = {};
    let cumulativeLeft = 0;
    for (const key of frozenKeys) { offsets[key] = cumulativeLeft; const columnWidth = columnSizing[key] || columnWidths[key] || 150; cumulativeLeft += columnWidth; }
    return { frozenColumns: frozenKeys, leftOffsets: offsets, lastFrozenColumnKey: frozenKeys[frozenKeys.length - 1] };
  }, [frozenColumnKey, columnOrder, columns, columnWidths, columnSizing]);

  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (Array.isArray(groupData)) {
    return groupData.map((item) => {
      const absoluteIndex = sortedData.findIndex((d: ListItem) => d[idKey as keyof ListItem] === item[idKey as keyof ListItem]);
      return (
        <TableRow key={item[idKey] || item.id} className="border-b border-border/50 transition-all duration-200 group">
          {columns.map((column: Column) => {
            const isFrozen = frozenColumns.includes(column.key);
            const cellValue = item[column.key];
            const isEditing = editingCell?.rowIndex === absoluteIndex && editingCell?.columnKey === column.key;
            
            // --- MODIFIED: Remove background color logic ---
            const hasPendingChange = item.pendingChanges && item.pendingChanges[column.key] !== undefined;

            const cellStyle: React.CSSProperties = { 
              width: `${columnWidths[column.key] || 150}px`, 
              minWidth: `${columnWidths[column.key] || 150}px`, 
              maxWidth: `${columnWidths[column.key] || 150}px`, 
              position: isFrozen ? "sticky" : undefined, 
              left: isFrozen ? leftOffsets[column.key] : undefined, 
              zIndex: isFrozen ? 20 : undefined, 
              background: isFrozen ? "oklch(0.07 0 0)" : undefined, // Set background to undefined for non-frozen cells
              borderRight: isFrozen && column.key === lastFrozenColumnKey ? "2px solid hsl(var(--border))" : undefined 
            };
            
            return (
              <TableCell key={column.key} style={cellStyle} className={cn("px-6 py-4 text-sm text-foreground/90 transition-colors group-hover:bg-muted/30", isFrozen && "group-hover:bg-black/80", "cursor-pointer relative")} onClick={() => { if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current); clickTimeoutRef.current = setTimeout(() => onRowSelect(item), 250); }} onDoubleClick={(e) => { if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current); e.stopPropagation(); if (handleCellDoubleClick && column.editable) handleCellDoubleClick(absoluteIndex, column, cellValue); }}>
                {hasPendingChange && !isEditing && (
                  <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-blue-400" title="Unsaved change"></div>
                )}
                {isEditing ? (
                  <Input type="text" value={editValue ?? ''} onChange={(e) => setEditValue && setEditValue(e.target.value)} onBlur={() => { handleCellEdit && handleCellEdit(absoluteIndex, column, editValue); setEditingCell && setEditingCell(null); }} onKeyDown={(e) => { if (e.key === 'Enter') { handleCellEdit && handleCellEdit(absoluteIndex, column, editValue); setEditingCell && setEditingCell(null); } if (e.key === 'Escape') setEditingCell && setEditingCell(null); }} autoFocus className="w-full bg-background p-1 border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                ) : (
                  <div className="truncate">{column.render ? column.render(cellValue, item) : String(cellValue ?? "")}</div>
                )}
              </TableCell>
            );
          })}
        </TableRow>
      );
    });
  }

  return Object.entries(groupData).map(([groupName, content]) => {
    if (!isGroupingActive && groupName === "") {
        return <RenderGroupRows key="flat-list" level={0} groupData={content} {...{ columns, onRowSelect, sortedData, idKey, editingCell, editValue, setEditValue, setEditingCell, handleCellDoubleClick, handleCellEdit, isMobile, frozenColumnKey, columnOrder, columnSizing, columnWidths, expandedGroups, toggleGroup, onSort, getSortIcon, moveColumn, handleResize, isGroupingActive: false, groupKeyPrefix: "" }} />;
    }

    const compositeKey = groupKeyPrefix ? `${groupKeyPrefix}|${groupName}` : groupName;
    const isExpanded = expandedGroups.has(compositeKey);
    
    const countItemsRecursively = (data: any): number => {
        if (Array.isArray(data)) {
            return data.length;
        }
        if (typeof data === 'object' && data !== null) {
            return Object.values(data).reduce((sum: number, value: any) => sum + countItemsRecursively(value), 0);
        }
        return 0;
    };
    const itemCount = countItemsRecursively(content);
    
    const glass = getGlassForString(groupName);
    const groupHeaderHeight = 53; // Assuming a fixed height for group headers

    return (
      <React.Fragment key={compositeKey}>
        <TableRow 
          className="sticky z-20 bg-card hover:brightness-95 transition-all cursor-pointer" 
          style={{ top: level * groupHeaderHeight }}
          onClick={() => toggleGroup(compositeKey)}
        >
          <TableCell colSpan={columns.length} className="bg-muted/40 font-semibold px-4 py-3 border-b border-border/30 text-left">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 20}px` }}>
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="px-3 py-1 rounded-md text-sm font-semibold border backdrop-blur-sm shadow-sm" style={{ backgroundColor: glass.background, borderColor: glass.border, color: "#ffffff", WebkitBackdropFilter: "blur(6px)", backdropFilter: "blur(6px)" }}>{groupName || "Ungrouped"}</span>
              <span className="text-muted-foreground">({itemCount})</span>
            </div>
          </TableCell>
        </TableRow>
        {isExpanded && (
          <>
            {Array.isArray(content) && (
              <TableRow 
                className="sticky z-30"
                style={{ top: (level + 1) * groupHeaderHeight }}
              >
                {columns.map((column: Column, index: number) => {
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
                      leftOffset={isFrozen ? leftOffsets[column.key] || 0 : 0}
                    />
                  );
                })}
              </TableRow>
            )}
            <RenderGroupRows groupData={content} level={level + 1} groupKeyPrefix={compositeKey} {...{ columns, onRowSelect, sortedData, idKey, editingCell, editValue, setEditValue, setEditingCell, handleCellDoubleClick, handleCellEdit, isMobile, frozenColumnKey, columnOrder, columnSizing, columnWidths, expandedGroups, toggleGroup, onSort, getSortIcon, moveColumn, handleResize, isGroupingActive: true }} />
          </>
        )}
      </React.Fragment>
    );
  });
}

// --- Main Table Component ---
export function DraggableResizableTable({ data, columns: initialColumns, sortedData = [], onRowSelect, onSort, getSortIcon, groupedData, groupByFields, idKey = "id", frozenColumnKey, columnOrder, columnSizing, setViewColumnOrder, editingCell = null, editValue = undefined, setEditValue = () => {}, setEditingCell = () => {}, handleCellDoubleClick = () => {}, handleCellEdit = () => {}, isMobile = false, ...rest }: DraggableResizableTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => { const widths: Record<string, number> = {}; initialColumns.forEach(col => widths[col.key] = 150); return widths; });
  
  const orderedColumns = useMemo(() => {
    const columnMap = new Map(initialColumns.map(c => [c.key, c]));
    return columnOrder.map(key => columnMap.get(key)).filter((c): c is Column => !!c);
  }, [initialColumns, columnOrder]);

  const { frozenColumns, leftOffsets, lastFrozenColumnKey } = useMemo(() => {
    if (!frozenColumnKey) return { frozenColumns: [] as string[], leftOffsets: {} as Record<string, number>, lastFrozenColumnKey: null };
    const orderedVisibleKeys = orderedColumns.map(c => c.key);
    const freezeIndex = orderedVisibleKeys.indexOf(frozenColumnKey);
    if (freezeIndex === -1) return { frozenColumns: [] as string[], leftOffsets: {} as Record<string, number>, lastFrozenColumnKey: null };
    const frozenKeys = orderedVisibleKeys.slice(0, freezeIndex + 1);
    const offsets: Record<string, number> = {};
    let cumulativeLeft = 0;
    for (const key of frozenKeys) {
      offsets[key] = cumulativeLeft;
      const columnWidth = columnSizing[key] || columnWidths[key] || 150;
      cumulativeLeft += columnWidth;
    }
    return { frozenColumns: frozenKeys, leftOffsets: offsets, lastFrozenColumnKey: frozenKeys[frozenKeys.length - 1] };
  }, [frozenColumnKey, orderedColumns, columnWidths, columnSizing]);

  useEffect(() => {
    setColumnWidths(prevWidths => {
      const newWidths: Record<string, number> = {};
      initialColumns.forEach(col => newWidths[col.key] = prevWidths[col.key] || 150);
      return newWidths;
    });
  }, [initialColumns]);
  
  const toggleGroup = (compositeKey: string) => { setExpandedGroups(prev => { const newSet = new Set(prev); if (newSet.has(compositeKey)) newSet.delete(compositeKey); else newSet.add(compositeKey); return newSet; }); };
  
  const moveColumn = useCallback((dragIndex: number, hoverIndex: number) => {
    const reorderedKeys = [...columnOrder];
    const draggedItem = reorderedKeys.splice(dragIndex, 1)[0];
    reorderedKeys.splice(hoverIndex, 0, draggedItem);
    setViewColumnOrder(reorderedKeys);
  }, [columnOrder, setViewColumnOrder]);

  const handleResize = useCallback((columnKey: string, width: number) => { setColumnWidths((prev) => ({ ...prev, [columnKey]: width })); }, []);
  const isGrouping = groupByFields && groupByFields.length > 0;

  return (
    <DndProvider backend={HTML5Backend}>
      <Table className="min-w-full table-fixed border-separate" style={{ borderSpacing: 0 }}>
        {!isGrouping && (
          <TableHeader>
            <TableRow>
              {orderedColumns.map((column, index) => {
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
                    leftOffset={isFrozen ? leftOffsets[column.key] || 0 : 0}
                  />
                );
              })}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          <RenderGroupRows
            groupData={isGrouping ? groupedData : { "": data }}
            level={0}
            columns={orderedColumns}
            onRowSelect={onRowSelect}
            sortedData={sortedData}
            idKey={idKey}
            editingCell={editingCell}
            editValue={editValue}
            setEditValue={setEditValue}
            setEditingCell={setEditingCell}
            handleCellDoubleClick={handleCellDoubleClick}
            handleCellEdit={handleCellEdit}
            isMobile={isMobile}
            frozenColumnKey={frozenColumnKey}
            columnOrder={columnOrder}
            columnSizing={columnSizing}
            columnWidths={columnWidths}
            expandedGroups={expandedGroups}
            toggleGroup={toggleGroup}
            groupKeyPrefix=""
            onSort={onSort}
            getSortIcon={getSortIcon}
            moveColumn={moveColumn}
            handleResize={handleResize}
            isGroupingActive={isGrouping}
            {...rest}
          />
        </TableBody>
      </Table>
    </DndProvider>
  );
}