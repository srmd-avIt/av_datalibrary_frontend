import React from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Eye } from 'lucide-react';
import { DraggableResizableTable } from './DraggableResizableTable';
import { ListItem, Column } from "./types"; // Assuming types are in this file

// --- MobileTableCard (No changes here) ---
interface MobileTableCardProps {
  item: any;
  columns: any[];
  onRowSelect?: (item: any) => void;
  idKey: string;
  isActive?: boolean;
}

export const MobileTableCard: React.FC<MobileTableCardProps> = ({ item, columns, onRowSelect, idKey, isActive = false }) => {
  const primaryColumns = columns.slice(0, 3);
  const secondaryColumns = columns.slice(3, 6);
  const remainingColumns = columns.slice(6);

  const renderValue = (column: any, value: any) => {
    if (column.render) return column.render(value, item);
    if (value === null || value === undefined || value === '') return <span className="text-gray-400 text-sm">N/A</span>;
    if (typeof value === 'boolean') return <Badge variant={value ? 'default' : 'secondary'} className="text-xs">{value ? 'Yes' : 'No'}</Badge>;
    if (typeof value === 'string' && value.length > 50) return <span className="text-sm line-clamp-2" title={value}>{value}</span>;
    return <span className="text-sm">{String(value)}</span>;
  };

  return (
    <Card className={`p-4 mb-3 mx-1 transition-all duration-200 border-l-4 ${isActive ? 'border-l-blue-500 bg-blue-50/50 shadow-md' : 'border-l-gray-200 hover:border-l-blue-300 hover:shadow-md active:bg-gray-50'}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs font-mono">{item[idKey]}</Badge>
            {primaryColumns[0] && item[primaryColumns[0].key] && (<span className="font-medium text-gray-900 truncate max-w-[150px]">{renderValue(primaryColumns[0], item[primaryColumns[0].key])}</span>)}
          </div>
          {onRowSelect && (<Button variant="ghost" size="sm" onClick={() => onRowSelect(item)} className="p-2 flex-shrink-0"><Eye className="h-4 w-4" /></Button>)}
        </div>
        {primaryColumns.length > 1 && (
          <div className="grid grid-cols-1 gap-2">
            {primaryColumns.slice(1).map((column) => {
              const value = item[column.key];
              if (!value && value !== 0) return null;
              return (<div key={column.key} className="flex justify-between items-start gap-2"><span className="text-xs font-medium text-gray-500 uppercase tracking-wide flex-shrink-0 min-w-[80px]">{column.label}:</span><div className="flex-1 text-right">{renderValue(column, value)}</div></div>);
            })}
          </div>
        )}
        {secondaryColumns.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {secondaryColumns.map((column) => {
                const value = item[column.key];
                if (!value && value !== 0) return null;
                return (<div key={column.key} className="space-y-1"><span className="text-gray-500 font-medium truncate">{column.label}</span><div className="text-gray-900">{renderValue(column, value)}</div></div>);
              })}
            </div>
          </div>
        )}
        {remainingColumns.length > 0 && (
          <details className="pt-2 border-t border-gray-100">
            <summary className="text-xs font-medium text-blue-600 cursor-pointer hover:text-blue-800">View {remainingColumns.length} more fields</summary>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {remainingColumns.map((column) => {
                const value = item[column.key];
                if (!value && value !== 0) return null;
                return (<div key={column.key} className="flex justify-between items-start text-xs gap-2"><span className="text-gray-500 font-medium flex-shrink-0 min-w-[60px]">{column.label}:</span><div className="flex-1 text-right text-gray-900">{renderValue(column, value)}</div></div>);
              })}
            </div>
          </details>
        )}
      </div>
    </Card>
  );
};


interface MobileTableViewProps {
  items: ListItem[];
  columns: Column[];
  onRowSelect?: (item: ListItem) => void;
  idKey: string;
  sortedData?: ListItem[];
  // Grouping props
  groupedData: Record<string, ListItem[]>;
  activeGroupBy?: string;
  // Editing props
  editingCell?: { rowIndex: number; columnKey: string } | null;
  editValue?: any;
  setEditValue?: (value: any) => void;
  setEditingCell?: (cell: { rowIndex: number; columnKey: string } | null) => void;
  handleUpdateCell?: () => void;
  handleCellDoubleClick?: (rowIndex: number, column: Column, value: any) => void;
  // Freeze props
  frozenColumnKey: string | null;
  columnOrder: string[];
  columnSizing: Record<string, number>;
  // Sorting props
  onSort: (columnKey: string) => void;
  getSortIcon: (columnKey: string) => React.ReactNode;
  // Additional props for mobile controls
  activeView?: string;
  isLoading?: boolean;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  setSortBy?: (value: string) => void;
  setSortDirection?: (value: "asc" | "desc") => void;
  groupBy?: string;
  groupDirection?: "asc" | "desc";
  setGroupBy?: (value: string) => void;
  setGroupDirection?: (value: "asc" | "desc") => void;
  setFrozenColumnKey?: (value: string | null) => void;
  hiddenColumns?: string[];
  setHiddenColumns?: (value: string[]) => void;
  viewMode?: 'table' | 'cards';
  setViewMode?: (value: 'table' | 'cards') => void;
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
  sortedData,
}) => {
  if (isLoading) {
    return (<div className="space-y-2">{[...Array(5)].map((_, i) => (<div key={i} className="animate-pulse"><div className="h-10 bg-gray-200 rounded"></div></div>))}</div>);
  }
  if (items.length === 0) {
    return (<div className="p-8 text-center"><div className="text-gray-500"><div className="text-4xl mb-2">📋</div><p className="text-sm">No data found</p></div></div>);
  }

  // --- FIX 1: REMOVE the problematic wrapper div ---
  return (
    <DraggableResizableTable
      data={items}
      columns={columns}
      sortedData={sortedData}
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
  );
};


interface MobileTableProps {
  items: ListItem[];
  columns: Column[];
  onRowSelect?: (item: ListItem) => void;
  onSort: (columnKey: string) => void;
  getSortIcon: (columnKey: string) => React.ReactNode;
  groupedData: Record<string, ListItem[]>;
  activeGroupBy?: string;
  activeView?: string;
  idKey: string;
  isLoading?: boolean;
  frozenColumnKey: string | null;
  columnOrder: string[];
  columnSizing: Record<string, number>;
  editingCell: { rowIndex: number; columnKey: string } | null;
  editValue: any;
  setEditValue: (value: any) => void;
  setEditingCell: (cell: { rowIndex: number; columnKey: string } | null) => void;
  handleUpdateCell: () => void;
  handleCellDoubleClick: (rowIndex: number, column: Column, value: any) => void;
  sortedData?: ListItem[];
  viewMode?: 'table' | 'cards';
  setViewMode?: (mode: 'table' | 'cards') => void;
  // Add missing props
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  setSortBy?: (value: string) => void;
  setSortDirection?: (value: "asc" | "desc") => void;
  groupBy?: string;
  groupDirection?: "asc" | "desc";
  setGroupBy?: (value: string) => void;
  setGroupDirection?: (value: "asc" | "desc") => void;
  setFrozenColumnKey?: (value: string | null) => void;
  hiddenColumns?: string[];
  setHiddenColumns?: (value: string[]) => void;
}

export const MobileTable: React.FC<MobileTableProps> = ({
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
  sortedData,
  viewMode: propViewMode = 'table',
  setViewMode: propSetViewMode,
}) => {
  const [localViewMode, setLocalViewMode] = React.useState<'table' | 'cards'>('table');
  const viewMode = propSetViewMode ? propViewMode : localViewMode;

  const visibleColumns = React.useMemo(() => columns, [columns]);

  if (isLoading) {
    return (<div className="space-y-3">{viewMode === 'cards' ? ([...Array(5)].map((_, i) => (<Card key={i} className="p-4 animate-pulse"><div className="space-y-2"><div className="h-4 bg-gray-200 rounded w-3/4"></div><div className="h-3 bg-gray-200 rounded w-1/2"></div><div className="h-3 bg-gray-200 rounded w-2/3"></div></div></Card>))) : (<div className="space-y-2">{[...Array(5)].map((_, i) => (<div key={i} className="animate-pulse"><div className="h-10 bg-gray-200 rounded"></div></div>))}</div>)}</div>);
  }
  if (items.length === 0) {
    return (<div className="p-8 text-center"><div className="text-gray-500"><div className="text-4xl mb-2">📋</div><p className="text-sm">No data found</p></div></div>);
  }

  return (
    <div className="space-y-3">
      {viewMode === 'table' ? (
        // --- FIX 2: CHANGE overflowX from 'hidden' to 'auto' on the main scrolling container ---
        <div className="mobile-table-wrapper custom-scrollbar" style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto', overflowX: 'auto' }}>
          <MobileTableView
            items={items}
            columns={visibleColumns}
            onRowSelect={onRowSelect}
            onSort={onSort}
            getSortIcon={getSortIcon}
            groupedData={groupedData}
            activeGroupBy={activeGroupBy}
            idKey={idKey}
            isLoading={isLoading}
            frozenColumnKey={frozenColumnKey}
            columnOrder={columnOrder}
            columnSizing={columnSizing}
            editingCell={editingCell}
            editValue={editValue}
            setEditValue={setEditValue}
            setEditingCell={setEditingCell}
            handleUpdateCell={handleUpdateCell}
            handleCellDoubleClick={handleCellDoubleClick}
            sortedData={sortedData}
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