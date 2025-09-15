import { useState } from "react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Download, FileSpreadsheet, FileText, Settings } from "lucide-react";

interface ExportDataProps {
  data: any[];
  columns: { key: string; label: string }[];
  filename?: string;
}

export function ExportData({ data, columns, filename = "export" }: ExportDataProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(columns.map(col => col.key));
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");

  const handleColumnToggle = (columnKey: string, checked: boolean) => {
    if (checked) {
      setSelectedColumns([...selectedColumns, columnKey]);
    } else {
      setSelectedColumns(selectedColumns.filter(key => key !== columnKey));
    }
  };

  const exportToCSV = () => {
    const selectedColumnObjs = columns.filter(col => selectedColumns.includes(col.key));
    const headers = selectedColumnObjs.map(col => col.label);
    
    const csvContent = [
      headers.join(","),
      ...data.map(row => 
        selectedColumnObjs.map(col => {
          const value = row[col.key];
          // Handle values that might contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || "";
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportToJSON = () => {
    const selectedColumnObjs = columns.filter(col => selectedColumns.includes(col.key));
    const exportData = data.map(row => {
      const filteredRow: any = {};
      selectedColumnObjs.forEach(col => {
        filteredRow[col.key] = row[col.key];
      });
      return filteredRow;
    });

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExport = () => {
    if (selectedColumns.length === 0) {
      alert("Please select at least one column to export.");
      return;
    }

    if (exportFormat === "csv") {
      exportToCSV();
    } else {
      exportToJSON();
    }
    
    setIsOpen(false);
  };

  const selectAllColumns = () => {
    setSelectedColumns(columns.map(col => col.key));
  };

  const deselectAllColumns = () => {
    setSelectedColumns([]);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Export Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Export Format */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Export Format</Label>
              <div className="flex gap-2">
                <Button
                  variant={exportFormat === "csv" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExportFormat("csv")}
                  className="flex-1"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant={exportFormat === "json" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExportFormat("json")}
                  className="flex-1"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  JSON
                </Button>
              </div>
            </div>

            <Separator />

            {/* Column Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Select Columns</Label>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAllColumns}
                    className="h-6 px-2 text-xs"
                  >
                    All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={deselectAllColumns}
                    className="h-6 px-2 text-xs"
                  >
                    None
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                {columns.map((column) => (
                  <div key={column.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`export-${column.key}`}
                      checked={selectedColumns.includes(column.key)}
                      onCheckedChange={(checked) => 
                        handleColumnToggle(column.key, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`export-${column.key}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="text-xs text-muted-foreground">
                {selectedColumns.length} of {columns.length} columns selected
              </div>
            </div>

            <Separator />

            {/* Export Actions */}
            <div className="flex gap-2">
              <Button onClick={handleExport} className="flex-1" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export {data.length} Records
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}