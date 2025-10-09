import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ChevronRight, Edit, Trash2 } from 'lucide-react';

interface MobileTableProps {
  data: any[];
  columns: any[];
  onRowSelect?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
}

export const MobileTable: React.FC<MobileTableProps> = ({
  data,
  columns,
  onRowSelect,
  onEdit,
  onDelete,
}) => {
  const primaryColumn = columns[0];
  const displayColumns = columns.slice(1, 4); // Show first 3 additional columns

  const formatValue = (value: any, column: any) => {
    if (column.render) {
      return column.render(value);
    }
    
    if (typeof value === 'string' && value.length > 30) {
      return value.substring(0, 30) + '...';
    }
    
    return value || 'N/A';
  };

  return (
    <div className="space-y-3 p-4">
      {data.map((row, index) => (
        <Card key={index} className="shadow-sm border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                {/* Primary field as title */}
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {primaryColumn.label}: {formatValue(row[primaryColumn.key], primaryColumn)}
                </h3>
                
                {/* Display key fields */}
                <div className="mt-2 space-y-1">
                  {displayColumns.map((column) => (
                    <div key={column.key} className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 min-w-0 flex-shrink-0">
                        {column.label}:
                      </span>
                      <span className="text-xs text-gray-900 truncate">
                        {formatValue(row[column.key], column)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center space-x-2 ml-4">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(row);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(row);
                    }}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                {onRowSelect && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRowSelect(row)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
