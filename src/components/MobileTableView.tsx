import React, { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Eye, Edit, Trash2, Table, Grid, Pin, Users, ArrowUpDown, X, EyeOff } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { DraggableResizableTable } from './DraggableResizableTable';

interface MobileTableCardProps {
  item: any;
  columns: any[];
  onRowSelect?: (item: any) => void;
  idKey: string;
  isActive?: boolean;
}

export const MobileTableCard: React.FC<MobileTableCardProps> = ({
  item,
  columns,
  onRowSelect,
  idKey,
  isActive = false,
}) => {
  // Get the first few important columns to display prominently
  const primaryColumns = columns.slice(0, 3);
  const secondaryColumns = columns.slice(3, 6);
  const remainingColumns = columns.slice(6);

  const renderValue = (column: any, value: any) => {
    if (column.render) {
      return column.render(value, item);
    }
    
    // Handle different data types
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400 text-sm">N/A</span>;
    }
    
    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'} className="text-xs">
          {value ? 'Yes' : 'No'}
        </Badge>
      );
    }
    
    if (typeof value === 'string' && value.length > 50) {
      return (
        <span className="text-sm line-clamp-2" title={value}>
          {value}
        </span>
      );
    }
    
    return <span className="text-sm">{String(value)}</span>;
  };

  return (
    <Card className={`p-4 mb-3 mx-1 transition-all duration-200 border-l-4 ${isActive ? 'border-l-blue-500 bg-blue-50/50 shadow-md' : 'border-l-gray-200 hover:border-l-blue-300 hover:shadow-md active:bg-gray-50'}`}>
      {/* Primary Information */}
      <div className="space-y-3">
        {/* ID and main identifier */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs font-mono">
              {item[idKey]}
            </Badge>
            {primaryColumns[0] && item[primaryColumns[0].key] && (
              <span className="font-medium text-gray-900 truncate max-w-[150px]">
                {renderValue(primaryColumns[0], item[primaryColumns[0].key])}
              </span>
            )}
          </div>
          {onRowSelect && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRowSelect(item)}
              className="p-2 flex-shrink-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Primary columns grid */}
        {primaryColumns.length > 1 && (
          <div className="grid grid-cols-1 gap-2">
            {primaryColumns.slice(1).map((column) => {
              const value = item[column.key];
              if (!value && value !== 0) return null;
              
              return (
                <div key={column.key} className="flex justify-between items-start gap-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide flex-shrink-0 min-w-[80px]">
                    {column.label}:
                  </span>
                  <div className="flex-1 text-right">
                    {renderValue(column, value)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Secondary columns in compact format */}
        {secondaryColumns.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {secondaryColumns.map((column) => {
                const value = item[column.key];
                if (!value && value !== 0) return null;
                
                return (
                  <div key={column.key} className="space-y-1">
                    <span className="text-gray-500 font-medium truncate">
                      {column.label}
                    </span>
                    <div className="text-gray-900">
                      {renderValue(column, value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Expandable section for remaining columns */}
        {remainingColumns.length > 0 && (
          <details className="pt-2 border-t border-gray-100">
            <summary className="text-xs font-medium text-blue-600 cursor-pointer hover:text-blue-800">
              View {remainingColumns.length} more fields
            </summary>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {remainingColumns.map((column) => {
                const value = item[column.key];
                if (!value && value !== 0) return null;
                
                return (
                  <div key={column.key} className="flex justify-between items-start text-xs gap-2">
                    <span className="text-gray-500 font-medium flex-shrink-0 min-w-[60px]">
                      {column.label}:
                    </span>
                    <div className="flex-1 text-right text-gray-900">
                      {renderValue(column, value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        )}
      </div>
    </Card>
  );
};

// Mobile table view component with full desktop functionality
interface MobileTableViewProps {
  items: any[];
  columns: any[];
  onRowSelect?: (item: any) => void;
  onSort: (columnKey: string) => void;
  getSortIcon: (columnKey: string) => React.ReactNode;
  groupedData: Record<string, any[]>;
  activeGroupBy?: string;
  idKey: string;
  isLoading?: boolean;
  frozenColumnKey: string | null;
  columnOrder: string[];
  columnSizing: Record<string, number>;
  // Add editing props
  editingCell: { rowIndex: number; columnKey: string } | null;
  editValue: any;
  setEditValue: (value: any) => void;
  setEditingCell: (cell: { rowIndex: number; columnKey: string } | null) => void;
  handleUpdateCell: () => void;
  handleCellDoubleClick: (rowIndex: number, column: any, value: any) => void;
  // Additional mobile controls
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  setSortBy?: (sortBy: string) => void;
  setSortDirection?: (direction: "asc" | "desc") => void;
  groupBy?: string;
  groupDirection?: "asc" | "desc";
  setGroupBy?: (groupBy: string) => void;
  setGroupDirection?: (direction: "asc" | "desc") => void;
  setFrozenColumnKey?: (key: string | null) => void;
  hiddenColumns?: string[];
  setHiddenColumns?: (columns: string[]) => void;
  sortedData?: any[];
}

export const MobileTableView: React.FC<MobileTableViewProps> = ({
  items,
  columns,
  onRowSelect,
  onSort,
  getSortIcon,
  groupedData,
  activeGroupBy,
  idKey,
  isLoading = false,
  frozenColumnKey,
  columnOrder,
  columnSizing,
  editingCell,
  editValue,
  setEditValue,
  setEditingCell,
  handleUpdateCell,
  handleCellDoubleClick,
  // Additional mobile controls
  sortBy = "none",
  sortDirection = "asc",
  setSortBy,
  setSortDirection,
  groupBy = "none",
  groupDirection = "asc",
  setGroupBy,
  setGroupDirection,
  setFrozenColumnKey,
  hiddenColumns = [],
  setHiddenColumns,
  sortedData,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-sm">No data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <DraggableResizableTable
        data={items}
        columns={columns}
        sortedData={items}
        onRowSelect={onRowSelect || (() => {})}
        onSort={onSort}
        getSortIcon={getSortIcon}
        groupedData={groupedData}
        activeGroupBy={activeGroupBy}
        idKey={idKey}
        frozenColumnKey={frozenColumnKey}
        columnOrder={columnOrder}
        columnSizing={columnSizing}
        editingCell={editingCell}
        editValue={editValue}
        setEditValue={setEditValue}
        setEditingCell={setEditingCell}
        handleUpdateCell={handleUpdateCell}
        handleCellDoubleClick={handleCellDoubleClick}
      />
    </div>
  );
};

// Mobile-optimized combined component with view toggle
interface MobileTableProps {
  items: any[];
  columns: any[];
  onRowSelect?: (item: any) => void;
  onSort: (columnKey: string) => void;
  getSortIcon: (columnKey: string) => React.ReactNode;
  groupedData: Record<string, any[]>;
  activeGroupBy?: string;
  activeView?: string;
  idKey: string;
  isLoading?: boolean;
  frozenColumnKey: string | null;
  columnOrder: string[];
  columnSizing: Record<string, number>;
  // Add editing props
  editingCell: { rowIndex: number; columnKey: string } | null;
  editValue: any;
  setEditValue: (value: any) => void;
  setEditingCell: (cell: { rowIndex: number; columnKey: string } | null) => void;
  handleUpdateCell: () => void;
  handleCellDoubleClick: (rowIndex: number, column: any, value: any) => void;
  // Additional mobile-specific control props
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  setSortBy?: (sortBy: string) => void;
  setSortDirection?: (direction: "asc" | "desc") => void;
  groupBy?: string;
  groupDirection?: "asc" | "desc";
  setGroupBy?: (groupBy: string) => void;
  setGroupDirection?: (direction: "asc" | "desc") => void;
  setFrozenColumnKey?: (key: string | null) => void;
  hiddenColumns?: string[];
  setHiddenColumns?: (columns: string[]) => void;
  sortedData?: any[];
  viewMode?: 'table' | 'cards';
  setViewMode?: (mode: 'table' | 'cards') => void;
}

export const MobileTable: React.FC<MobileTableProps> = ({
  items,
  columns,
  onRowSelect,
  onSort,
  getSortIcon,
  groupedData,
  activeGroupBy,
  activeView,
  idKey,
  isLoading = false,
  frozenColumnKey,
  columnOrder,
  columnSizing,
  editingCell,
  editValue,
  setEditValue,
  setEditingCell,
  handleUpdateCell,
  handleCellDoubleClick,
  // Additional mobile-specific control props
  sortBy = "none",
  sortDirection = "asc",
  setSortBy,
  setSortDirection,
  groupBy = "none",
  groupDirection = "asc",
  setGroupBy,
  setGroupDirection,
  setFrozenColumnKey,
  hiddenColumns = [],
  setHiddenColumns,
  sortedData,
  viewMode: propViewMode = 'table',
  setViewMode: propSetViewMode,
}) => {
  // Use prop values if provided, otherwise use local state
  const [localViewMode, setLocalViewMode] = React.useState<'table' | 'cards'>('table');
  const viewMode = propViewMode;
  const setViewMode = propSetViewMode || setLocalViewMode;
  
  // State for mobile controls (fallback if not provided as props)
  const [localSortBy, setLocalSortBy] = React.useState<string>("none");
  const [localSortDirection, setLocalSortDirection] = React.useState<"asc" | "desc">("asc");
  const [localGroupBy, setLocalGroupBy] = React.useState<string>("none");
  const [localGroupDirection, setLocalGroupDirection] = React.useState<"asc" | "desc">("asc");
  const [localFrozenColumnKey, setLocalFrozenColumnKey] = React.useState<string | null>(null);
  const [localHiddenColumns, setLocalHiddenColumns] = React.useState<string[]>([]);
  
  // Use props if provided, otherwise use local state
  const currentSortBy = sortBy !== "none" ? sortBy : localSortBy;
  const currentSortDirection = sortDirection || localSortDirection;
  const currentGroupBy = groupBy !== "none" ? groupBy : localGroupBy;
  const currentGroupDirection = groupDirection || localGroupDirection;
  const currentFrozenColumnKey = frozenColumnKey || localFrozenColumnKey;
  const currentHiddenColumns = hiddenColumns.length > 0 ? hiddenColumns : localHiddenColumns;
  
  // Handlers that use props or fallback to local state
  const handleSortBy = setSortBy || setLocalSortBy;
  const handleSortDirection = setSortDirection || setLocalSortDirection;
  const handleGroupBy = setGroupBy || setLocalGroupBy;
  const handleGroupDirection = setGroupDirection || setLocalGroupDirection;
  const handleFrozenColumnKey = setFrozenColumnKey || setLocalFrozenColumnKey;
  const handleHiddenColumns = setHiddenColumns || setLocalHiddenColumns;
  
  // Helper functions for mobile controls
  const getAvailableGroupByFields = () => { 
    return columns.filter(col => col.filterable !== false).map(col => ({ value: col.key, label: col.label })); 
  };
  
  const getAvailableSortFields = () => { 
    return columns.filter(col => col.sortable !== false).map(col => ({ value: col.key, label: col.label })); 
  };
  
  const visibleColumns = React.useMemo(() => 
    columns.filter(col => !localHiddenColumns.includes(col.key)), 
    [columns, localHiddenColumns]
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {viewMode === 'cards' ? (
          [...Array(5)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </Card>
          ))
        ) : (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-sm">No data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Content based on view mode */}
      {viewMode === 'table' ? (
        <div className="mobile-table-wrapper custom-scrollbar" style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto', overflowX: 'hidden' }}>
          <MobileTableView
            items={items}
            columns={visibleColumns}
            onRowSelect={onRowSelect}
            onSort={onSort}
            getSortIcon={getSortIcon}
            groupedData={groupedData}
            activeGroupBy={activeGroupBy || currentGroupBy}
            idKey={idKey}
            isLoading={isLoading}
            frozenColumnKey={currentFrozenColumnKey}
            columnOrder={columnOrder}
            columnSizing={columnSizing}
            editingCell={editingCell}
            editValue={editValue}
            setEditValue={setEditValue}
            setEditingCell={setEditingCell}
            handleUpdateCell={handleUpdateCell}
            handleCellDoubleClick={handleCellDoubleClick}
          />
        </div>
      ) : (
        <div className="space-y-1 pb-32 px-1 -mx-1">
          {items.map((item, index) => (
            <MobileTableCard
              key={item[idKey] || index}
              item={item}
              columns={columns}
              onRowSelect={onRowSelect}
              idKey={idKey}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Add mobile-specific CSS for better table responsiveness
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    /* Mobile table container with horizontal scrolling */
    .mobile-table-container {
      overflow-x: auto;
      overflow-y: hidden;
      width: 100%;
      max-height: calc(100vh - 400px);
      /* Make table columns more compact on mobile */
    }
    
    .mobile-table-container th {
      padding: 6px 3px !important;
      font-size: 10px !important;
      min-width: 80px !important;
      white-space: nowrap !important;
    }
    
    .mobile-table-container td {
      padding: 6px 3px !important;
      font-size: 11px !important;
      min-width: 80px !important;
      white-space: nowrap !important;
    }
    
    .mobile-table-container .w-3,
    .mobile-table-container .w-4 {
      width: 8px !important;
      height: 8px !important;
    }
    
    /* Make frozen columns more visible on mobile */
    .mobile-table-container [style*="position: sticky"] {
      box-shadow: 2px 0 4px rgba(0,0,0,0.15) !important;
      z-index: 25 !important;
    }
    
    /* Enhanced mobile vertical scrolling for wrapper */
    .mobile-table-wrapper::-webkit-scrollbar {
      width: 12px;
    }
    
    .mobile-table-wrapper::-webkit-scrollbar-track {
      background: #e2e8f0;
      border-radius: 6px;
      margin: 2px;
      border: 1px solid #cbd5e0;
    }
    
    .mobile-table-wrapper::-webkit-scrollbar-thumb {
      background: #64748b;
      border-radius: 6px;
      border: 2px solid #e2e8f0;
      min-height: 20px;
    }
    
    .mobile-table-wrapper::-webkit-scrollbar-thumb:hover {
      background: #475569;
    }
    
    /* Firefox scrollbar support for wrapper */
    .mobile-table-wrapper {
      scrollbar-width: thin;
      scrollbar-color: #64748b #e2e8f0;
    }
    
    /* Enhanced mobile horizontal scrolling for table container */
    .mobile-table-container::-webkit-scrollbar {
      height: 8px;
    }
    
    .mobile-table-container::-webkit-scrollbar-track {
      background: #f8f9fa;
      border-radius: 4px;
      margin: 2px;
    }
    
    .mobile-table-container::-webkit-scrollbar-thumb {
      background: #cbd5e0;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
    
    .mobile-table-container::-webkit-scrollbar-thumb:hover {
      background: #a0aec0;
    }
    
    /* Ensure table takes full width and columns are properly spaced */
    .mobile-table-container table {
      min-width: max-content !important;
      table-layout: fixed !important;
    }
    
    /* Better mobile header styling */
    .mobile-table-container th .flex {
      gap: 4px !important;
    }
    
    .mobile-table-container th .truncate {
      max-width: 60px !important;
    }
    
    /* Mobile drag handle styling */
    .mobile-table-container .group:hover .opacity-0 {
      opacity: 1 !important;
    }
    
    /* Enhanced hover effects for sorting */
    .mobile-table-container th:hover {
      background-color: rgba(59, 130, 246, 0.1) !important;
    }
    
    .mobile-table-container th.cursor-pointer:hover {
      background-color: rgba(59, 130, 246, 0.15) !important;
    }
    
    .mobile-table-container th:hover .text-muted-foreground {
      color: rgb(59, 130, 246) !important;
    }
    
    /* Freeze column enhancements */
    .mobile-table-container [style*="position: sticky"][style*="left: 0"] {
      background: rgba(0, 0, 0, 0.95) !important;
      border-right: 2px solid rgba(59, 130, 246, 0.3) !important;
    }
    
    .mobile-table-container [style*="position: sticky"]:not([style*="left: 0"]) {
      background: rgba(0, 0, 0, 0.9) !important;
    }
    
    /* Improve resize handle visibility */
    .mobile-table-container .cursor-col-resize {
      background: rgba(59, 130, 246, 0.3) !important;
      width: 2px !important;
    }
    
    .mobile-table-container .cursor-col-resize:hover {
      background: rgba(59, 130, 246, 0.6) !important;
      width: 3px !important;
    }
  `;
  
  if (!document.head.querySelector('style[data-mobile-table]')) {
    style.setAttribute('data-mobile-table', 'true');
    document.head.appendChild(style);
  }
}
