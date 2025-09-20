import React, { useState, useRef, useCallback } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { GripVertical } from "lucide-react";
import { cn } from "./ui/utils";

interface ListItem {
  id?: string;
  [key: string]: any;
}

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, item: ListItem) => React.ReactNode;
  width?: number;
}

interface DraggableResizableTableProps {
  data: ListItem[];
  columns: Column[];
  onRowSelect: (item: ListItem) => void;
  onSort: (columnKey: string) => void;
  getSortIcon: (columnKey: string) => React.ReactNode;
  groupedData: Record<string, ListItem[]>;
  activeGroupBy?: string;
  idKey?: string;
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
}

function DraggableHeader({
  column,
  index,
  moveColumn,
  onSort,
  getSortIcon,
  width,
  onResize,
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

  const opacity = isDragging ? 0.4 : 1;

  return (
    <th
      ref={ref}
      style={{ opacity, width: `${width}px`, minWidth: `${width}px` }}
      className={cn(
        // ENHANCED TABLE STYLING: Professional ClickUp-style headers with better padding (px-6 py-4), uppercase text, and improved visual hierarchy
        // ENHANCED TABLE STYLING: Better borders with refined border colors (border-border/30) and glassmorphism effects (bg-muted/20)
        // DARK THEME OPTIMIZATION: Consistent color schemes with muted colors and smooth hover transitions
        // TABLE HEADER FONT STYLING: text-xs (12px) for compact headers, font-medium (500 weight) for professional weight
        // TABLE HEADER FONT STYLING: uppercase transform for ClickUp-style headers, tracking-wide for improved letter spacing
        // TABLE HEADER FONT STYLING: text-muted-foreground for subdued header color, whitespace-nowrap prevents text wrapping
        // TEXT ALIGNMENT: text-left for standard left-aligned headers, align-middle for vertical centering in header cells
        // TABLE HEADER FONT STYLING: hover:text-foreground for interactive headers that become more prominent on hover
        "relative group hover:bg-muted/40 bg-muted/20 font-medium text-muted-foreground border-r border-border/30 h-12 px-6 py-4 text-left align-middle whitespace-nowrap tracking-wide uppercase text-xs border-b border-border/50 transition-colors",
        column.sortable && "cursor-pointer hover:text-foreground",
        isResizing && "select-none",
        // ENHANCED TABLE STYLING: Special edge padding for first/last columns to give data breathing room
        "first:pl-8 last:pr-8"
      )}
      data-handler-id={handlerId}
    >
      {/* TEXT ALIGNMENT: flex items-center for horizontal centering and vertical alignment of header content */}
      <div className="flex items-center gap-3">
        {/* ENHANCED TABLE STYLING: Enhanced drag handles with better hover states and smooth transitions */}
        <GripVertical className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-grab hover:text-foreground" />
        {/* TEXT ALIGNMENT: flex items-center gap-2 for proper spacing and alignment of header text and sort icons */}
        <div 
          className="flex items-center gap-2 flex-1 transition-colors"
          onClick={() => column.sortable && onSort(column.key)}
        >
          {/* TABLE HEADER FONT STYLING: font-medium for header text emphasis, truncate to prevent overflow */}
          <span className="truncate font-medium">{column.label}</span>
          {column.sortable && getSortIcon(column.key)}
        </div>
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
  onRowSelect,
  onSort,
  getSortIcon,
  groupedData,
  activeGroupBy,
  idKey = "id",
}: DraggableResizableTableProps) {
  const [columns, setColumns] = useState(initialColumns);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const widths: Record<string, number> = {};
    initialColumns.forEach((col) => {
      widths[col.key] = col.width || 150;
    });
    return widths;
  });

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
      <div className="overflow-x-auto relative border border-border rounded-lg bg-card shadow-sm" style={{ maxHeight: '60vh' }}>
        <Table className="min-w-full table-fixed">
          <TableHeader>
            <TableRow className="border-b border-border/50">
              {columns.map((column, index) => (
                <DraggableHeader
                  key={column.key}
                  column={column}
                  index={index}
                  moveColumn={moveColumn}
                  onSort={onSort}
                  getSortIcon={getSortIcon}
                  width={columnWidths[column.key] || 150}
                  onResize={handleResize}
                />
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(groupedData).map(([groupName, items]) => (
              <React.Fragment key={groupName}>
                {/* ENHANCED TABLE STYLING: Glassmorphism effects with backdrop blur for group headers */}
                {activeGroupBy && activeGroupBy !== "none" && (
                  <TableRow className="sticky top-12 z-[15] bg-muted/80 backdrop-blur">
                    <TableCell 
                      colSpan={columns.length} 
                      // GROUP HEADER FONT STYLING: font-semibold (600 weight) for group headers to stand out from regular cells
                      // GROUP HEADER FONT STYLING: text-foreground (full opacity) for maximum prominence and readability
                      className="bg-muted/90 backdrop-blur-sm font-semibold text-foreground px-8 py-3 border-b border-border/30"
                    >
                      {groupName} ({items.length})
                    </TableCell>
                  </TableRow>
                )}
                {/* ENHANCED TABLE STYLING: Smooth interactions with enhanced hover states and better transitions */}
                {items.map((item) => (
                  <TableRow
                    key={item[idKey] || item.id}
                    className="hover:bg-muted/30 cursor-pointer border-b border-border/50 transition-all duration-200 group"
                    onClick={() => onRowSelect(item)}
                  >
                    {columns.map((column, index) => (
                      <TableCell 
                        key={column.key} 
                        className={cn(
                          // ENHANCED TABLE STYLING: Better padding (px-6 py-4) increased from px-2 py-3 for more breathing room
                          // ENHANCED TABLE STYLING: Improved visual hierarchy with better contrast ratios for dark theme optimization
                          // ENHANCED TABLE STYLING: Special edge padding (first:pl-8 last:pr-8) so data isn't too close to edges
                          // TABLE CELL FONT STYLING: text-sm (14px) for readable cell content, larger than header text for better data readability
                          // TABLE CELL FONT STYLING: text-foreground/90 (90% opacity) for subtle data text, group-hover:text-foreground for emphasis on hover
                          // TABLE CELL FONT STYLING: transition-colors for smooth opacity changes when hovering over rows
                          "px-6 py-4 text-sm text-foreground/90 group-hover:text-foreground transition-colors",
                          index === 0 && "sticky left-0 z-10 bg-card group-hover:bg-muted/30",
                          "first:pl-8 last:pr-8"
                        )}
                        style={{ 
                          width: `${columnWidths[column.key] || 150}px`,
                          minWidth: `${columnWidths[column.key] || 150}px`,
                          maxWidth: `${columnWidths[column.key] || 150}px`
                        }}
                      >
                        {/* TABLE CELL CONTENT STYLING: truncate class prevents text overflow and maintains table layout consistency */}
                        <div className="truncate">
                          {column.render ? column.render(item[column.key], item) : String(item[column.key] ?? '')}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </DndProvider>
  );
}