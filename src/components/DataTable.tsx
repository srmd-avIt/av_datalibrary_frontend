import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { AdvancedFilters } from "./AdvancedFilters";
import { ExportData } from "./ExportData";
// import { motion } from "motion/react";

interface DataTableProps {
  title: string;
  data: any[];
  columns: {
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
  }[];
  searchKey?: string;
  onRowSelect?: (row: any) => void;
  selectedRow?: any;
  filterConfigs?: {
    key: string;
    label: string;
    type: "text" | "select" | "date" | "number" | "checkbox";
    options?: string[];
  }[];
}

export function DataTable({ 
  title, 
  data, 
  columns, 
  searchKey = "name", 
  onRowSelect,
  selectedRow,
  filterConfigs = []
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const itemsPerPage = 15;

  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item[searchKey]?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply advanced filters
    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value === undefined || value === "" || value === null) return;

      if (key.endsWith('_from') || key.endsWith('_to')) {
        const baseKey = key.replace(/_from|_to$/, '');
        const fromDate = appliedFilters[`${baseKey}_from`];
        const toDate = appliedFilters[`${baseKey}_to`];
        
        if (fromDate || toDate) {
          filtered = filtered.filter(item => {
            const itemDate = new Date(item[baseKey]);
            if (fromDate && itemDate < fromDate) return false;
            if (toDate && itemDate > toDate) return false;
            return true;
          });
        }
      } else if (key.endsWith('_min') || key.endsWith('_max')) {
        const baseKey = key.replace(/_min|_max$/, '');
        const minValue = appliedFilters[`${baseKey}_min`];
        const maxValue = appliedFilters[`${baseKey}_max`];
        
        if (minValue !== undefined || maxValue !== undefined) {
          filtered = filtered.filter(item => {
            const itemValue = Number(item[baseKey]);
            if (minValue !== undefined && itemValue < Number(minValue)) return false;
            if (maxValue !== undefined && itemValue > Number(maxValue)) return false;
            return true;
          });
        }
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          filtered = filtered.filter(item => value.includes(item[key]));
        }
      } else {
        filtered = filtered.filter(item => 
          item[key]?.toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    return filtered;
  }, [data, searchTerm, searchKey, appliedFilters]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleRowClick = (row: any) => {
    if (onRowSelect) {
      onRowSelect(row);
    }
  };

  const isRowSelected = (row: any) => {
    return selectedRow && selectedRow.id === row.id;
  };

  return (
    <div className="p-6">
      <Card className="shadow-xl border-0 bg-gradient-to-br from-background via-background to-muted/20">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-t-lg border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                {title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredData.length} total records
                {filteredData.length !== data.length && (
                  <span className="text-primary"> (filtered from {data.length})</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ExportData 
                data={filteredData} 
                columns={columns} 
                filename={title.toLowerCase().replace(/\s+/g, '-')}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${title.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 bg-background/50 backdrop-blur-sm"
              />
            </div>
            {filterConfigs.length > 0 && (
              <AdvancedFilters
                filters={filterConfigs}
                onFiltersChange={(filters) => {
                  setAppliedFilters(filters);
                  setCurrentPage(1);
                }}
                data={data}
              />
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/50">
                  {columns.map((column) => (
                    <TableHead key={column.key} className="font-semibold text-foreground">
                      {column.label}
                    </TableHead>
                  ))}
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item, index) => (
                  <TableRow
                    key={item.id || index}
                    className={`
                      cursor-pointer transition-all duration-200 hover:bg-muted/50 border-b border-border/50
                      ${isRowSelected(item) ? 'bg-primary/10 border-primary/30' : ''}
                    `}
                    onClick={() => handleRowClick(item)}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.key} className="py-4">
                        {column.render
                          ? column.render(item[column.key], item)
                          : item[column.key]}
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(item);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">
                      No data found. Try adjusting your search or filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-muted/20 border-t">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredData.length)}</span> of{" "}
                <span className="font-medium">{filteredData.length}</span> results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 7) {
                      page = i + 1;
                    } else if (currentPage <= 4) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      page = totalPages - 6 + i;
                    } else {
                      page = currentPage - 3 + i;
                    }
                    
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}