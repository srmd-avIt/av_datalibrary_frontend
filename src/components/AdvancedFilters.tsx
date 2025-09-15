import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { Filter, Calendar as CalendarIcon, X, RotateCcw } from "lucide-react";
import { format } from "../data/date-fns";

interface FilterConfig {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "number" | "checkbox";
  options?: string[];
}

interface AdvancedFiltersProps {
  filters: FilterConfig[];
  onFiltersChange: (filters: Record<string, any>) => void;
  data: any[];
}

export function AdvancedFilters({ filters, onFiltersChange, data }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filterValues, [key]: value };
    setFilterValues(newFilters);
    
    // Update active filters
    const newActiveFilters = Object.keys(newFilters).filter(k => {
      const val = newFilters[k];
      return val !== undefined && val !== "" && val !== null && 
             (Array.isArray(val) ? val.length > 0 : true);
    });
    setActiveFilters(newActiveFilters);
    
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setFilterValues({});
    setActiveFilters([]);
    onFiltersChange({});
  };

  const removeFilter = (key: string) => {
    const newFilters = { ...filterValues };
    delete newFilters[key];
    setFilterValues(newFilters);
    
    const newActiveFilters = activeFilters.filter(f => f !== key);
    setActiveFilters(newActiveFilters);
    
    onFiltersChange(newFilters);
  };

  const getUniqueValues = (key: string) => {
    const values = data.map(item => item[key]).filter(Boolean);
    return [...new Set(values)].sort();
  };

  const renderFilterInput = (filter: FilterConfig) => {
    switch (filter.type) {
      case "text":
        return (
          <Input
            placeholder={`Enter ${filter.label.toLowerCase()}`}
            value={filterValues[filter.key] || ""}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
          />
        );

      case "select":
        const options = filter.options || getUniqueValues(filter.key);
        return (
          <Select
            value={filterValues[filter.key] || ""}
            onValueChange={(value) => handleFilterChange(filter.key, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${filter.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "date":
        return (
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterValues[`${filter.key}_from`] ? (
                    format(filterValues[`${filter.key}_from`], "PPP")
                  ) : (
                    <span>From date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filterValues[`${filter.key}_from`]}
                  onSelect={(date) => handleFilterChange(`${filter.key}_from`, date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterValues[`${filter.key}_to`] ? (
                    format(filterValues[`${filter.key}_to`], "PPP")
                  ) : (
                    <span>To date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filterValues[`${filter.key}_to`]}
                  onSelect={(date) => handleFilterChange(`${filter.key}_to`, date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        );

      case "number":
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filterValues[`${filter.key}_min`] || ""}
              onChange={(e) => handleFilterChange(`${filter.key}_min`, e.target.value)}
            />
            <Input
              type="number"
              placeholder="Max"
              value={filterValues[`${filter.key}_max`] || ""}
              onChange={(e) => handleFilterChange(`${filter.key}_max`, e.target.value)}
            />
          </div>
        );

      case "checkbox":
        const checkboxOptions = filter.options || getUniqueValues(filter.key);
        return (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {checkboxOptions.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${filter.key}-${option}`}
                  checked={(filterValues[filter.key] || []).includes(option)}
                  onCheckedChange={(checked) => {
                    const currentValues = filterValues[filter.key] || [];
                    const newValues = checked
                      ? [...currentValues, option]
                      : currentValues.filter((v: string) => v !== option);
                    handleFilterChange(filter.key, newValues);
                  }}
                />
                <Label 
                  htmlFor={`${filter.key}-${option}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Toggle and Active Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Advanced Filters
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Advanced Filters</CardTitle>
                  {activeFilters.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 px-2 text-xs"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {filters.map((filter) => (
                  <div key={filter.key} className="space-y-2">
                    <Label className="text-sm font-medium">{filter.label}</Label>
                    {renderFilterInput(filter)}
                  </div>
                ))}
                {filters.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setIsOpen(false)} className="flex-1">
                        Apply Filters
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearFilters}>
                        Reset
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>

        {/* Active Filter Tags */}
        {activeFilters.map((filterKey) => {
          const filter = filters.find(f => f.key === filterKey);
          const value = filterValues[filterKey];
          
          if (!filter || !value) return null;
          
          let displayValue = value;
          if (Array.isArray(value)) {
            displayValue = value.length > 1 ? `${value.length} selected` : value[0];
          }
          
          return (
            <Badge key={filterKey} variant="secondary" className="gap-1">
              {filter.label}: {displayValue}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeFilter(filterKey)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}