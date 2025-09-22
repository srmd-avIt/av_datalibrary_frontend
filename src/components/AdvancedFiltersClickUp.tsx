import React, { useState } from "react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Filter, Plus, X, RotateCcw, Calendar as CalendarIcon, Save, Trash2 } from "lucide-react";
import { format } from 'date-fns';

// --- Interfaces (assuming they are defined here or imported) ---
interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: any;
  logic?: "AND" | "OR";
}

interface FilterGroup {
  id: string;
  rules: FilterRule[];
  logic: "AND" | "OR";
}

interface SavedFilter {
  name: string;
  filterGroups: FilterGroup[];
}

interface FilterConfig {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "number" | "checkbox";
  options?: string[];
}

interface AdvancedFiltersClickUpProps {
  filters: FilterConfig[];
  onFiltersChange: (filterGroups: FilterGroup[]) => void;
  data: any[];
  savedFilters: SavedFilter[];
  onSaveFilter: (name: string, filterGroups: FilterGroup[]) => void;
  onDeleteFilter: (name: string) => void;
}

// --- Constants ---
// ✅ FIX #1: Added "checkbox" to the OperatorType union.
type OperatorType = "text" | "select" | "number" | "date" | "checkbox";

const OPERATORS: Record<OperatorType, { value: string; label: string }[]> = {
  text: [
    { value: "contains", label: "Contains" },
    { value: "not_contains", label: "Does not contain" },
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Does not equal" },
    { value: "starts_with", label: "Starts with" },
    { value: "ends_with", label: "Ends with" },
    { value: "is_empty", label: "Is empty" },
    { value: "is_not_empty", label: "Is not empty" }
  ],
  select: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Does not equal" },
    { value: "in", label: "Is any of" },
    { value: "not_in", label: "Is none of" }
  ],
  number: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Does not equal" },
    { value: "greater", label: "Greater than" },
    { value: "greater_equal", label: "Greater than or equal" },
    { value: "less", label: "Less than" },
    { value: "less_equal", label: "Less than or equal" },
    { value: "between", label: "Between" }
  ],
  date: [
    { value: "equals", label: "Is" },
    { value: "not_equals", label: "Is not" },
    { value: "before", label: "Is before" },
    { value: "after", label: "Is after" },
    { value: "between", label: "Is between" },
    { value: "is_empty", label: "Is empty" },
    { value: "is_not_empty", label: "Is not empty" }
  ],
  checkbox: [
    { value: "equals", label: "Is" },
  ]
};

export function AdvancedFiltersClickUp({ filters, onFiltersChange, data, savedFilters, onSaveFilter, onDeleteFilter }: AdvancedFiltersClickUpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    { id: "group1", rules: [], logic: "AND" }
  ]);
  const [saveFilterName, setSaveFilterName] = useState("");

  const handleSaveFilterClick = () => {
    if (saveFilterName.trim()) {
      const cleanedGroups = getCleanedFilterGroups(filterGroups);
      if (cleanedGroups.length > 0) {
        onSaveFilter(saveFilterName.trim(), cleanedGroups);
        setSaveFilterName("");
      }
    }
  };

  const handleApplySavedFilter = (savedFilter: SavedFilter) => {
    onFiltersChange(savedFilter.filterGroups);
    setIsOpen(false);
  };

  const getUniqueValues = (key: string) => {
    const values = data.map(item => item[key]).filter(val => val !== null && val !== undefined);
    return [...new Set(values)].sort();
  };

  const getDefaultOperator = (fieldType: OperatorType): string => {
    return OPERATORS[fieldType]?.[0]?.value || "";
  };
  
  const getEmptyValueForOperator = (operator: string) => {
    if (["in", "not_in", "between"].includes(operator)) return [];
    return "";
  }

  const addFilterRule = (groupId: string) => {
    const firstFilter = filters[0];
    if (!firstFilter) return;

    const defaultFieldType = firstFilter.type as OperatorType;
    
    const newRule: FilterRule = {
      id: `rule_${Date.now()}`,
      field: firstFilter.key,
      operator: getDefaultOperator(defaultFieldType),
      value: "",
      logic: "AND"
    };

    setFilterGroups(groups =>
      groups.map(group =>
        group.id === groupId
          ? { ...group, rules: [...group.rules, newRule] }
          : group
      )
    );
  };
  
  const handleFieldChange = (groupId: string, ruleId: string, newField: string) => {
      const newFilterConfig = filters.find(f => f.key === newField);
      if (!newFilterConfig) return;

      const newFieldType = newFilterConfig.type as OperatorType;
      const newOperator = getDefaultOperator(newFieldType);
      
      updateFilterRule(groupId, ruleId, { 
          field: newField, 
          operator: newOperator, 
          value: getEmptyValueForOperator(newOperator)
      });
  };
  
  const handleOperatorChange = (groupId: string, ruleId: string, newOperator: string) => {
      updateFilterRule(groupId, ruleId, { 
          operator: newOperator, 
          value: getEmptyValueForOperator(newOperator) 
      });
  }

  const removeFilterRule = (groupId: string, ruleId: string) => {
    setFilterGroups(groups =>
      groups.map(group =>
        group.id === groupId
          ? { ...group, rules: group.rules.filter(rule => rule.id !== ruleId) }
          : group
      )
    );
  };

  const updateFilterRule = (groupId: string, ruleId: string, updates: Partial<FilterRule>) => {
    setFilterGroups(groups =>
      groups.map(group =>
        group.id === groupId
          ? {
              ...group,
              rules: group.rules.map(rule =>
                rule.id === ruleId ? { ...rule, ...updates } : rule
              )
            }
          : group
      )
    );
  };

  const addFilterGroup = () => {
    const newGroup: FilterGroup = {
      id: `group_${Date.now()}`,
      rules: [],
      logic: "OR"
    };
    setFilterGroups([...filterGroups, newGroup]);
  };

  const removeFilterGroup = (groupId: string) => {
    if (filterGroups.length > 1) {
      setFilterGroups(groups => groups.filter(group => group.id !== groupId));
    }
  };

  const updateGroupLogic = (groupId: string, logic: "AND" | "OR") => {
    setFilterGroups(groups =>
      groups.map(group =>
        group.id === groupId ? { ...group, logic } : group
      )
    );
  };

  const clearAllFilters = () => {
    setFilterGroups([{ id: "group1", rules: [], logic: "AND" }]);
    onFiltersChange([]); // Also clear the parent state
  };

  const getCleanedFilterGroups = (groups: FilterGroup[]) => {
    return groups.map(group => ({
      ...group,
      rules: group.rules.filter(rule => {
        const needsValue = !["is_empty", "is_not_empty"].includes(rule.operator);
        if (!needsValue) return true;
        if (Array.isArray(rule.value)) return rule.value.length > 0;
        return rule.value !== "" && rule.value !== null && rule.value !== undefined;
      })
    })).filter(group => group.rules.length > 0);
  }

  const applyFilters = () => {
    const cleanedGroups = getCleanedFilterGroups(filterGroups);
    onFiltersChange(cleanedGroups);
    setIsOpen(false);
  };

  const renderValueInput = (groupId: string, rule: FilterRule, filterConfig: FilterConfig) => {
    const { operator, value } = rule;

    if (["is_empty", "is_not_empty"].includes(operator)) return null;

    switch (filterConfig.type) {
      case "text":
        return ( <Input placeholder="Enter value" value={value || ""} onChange={(e) => updateFilterRule(groupId, rule.id, { value: e.target.value })} className="h-8"/>);
      case "select":
        if (["in", "not_in"].includes(operator)) {
          const options = filterConfig.options || getUniqueValues(filterConfig.key);
          const selectedValues = Array.isArray(value) ? value : [];
          return (<div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">{options.map((option) => (<div key={option} className="flex items-center space-x-2"><Checkbox id={`${rule.id}-${option}`} checked={selectedValues.includes(option)} onCheckedChange={(checked) => { const newValues = checked ? [...selectedValues, option] : selectedValues.filter(v => v !== option); updateFilterRule(groupId, rule.id, { value: newValues }); }} /><Label htmlFor={`${rule.id}-${option}`} className="text-sm">{String(option)}</Label></div>))}</div>);
        } else {
          const options = filterConfig.options || getUniqueValues(filterConfig.key);
          return (<Select value={String(value || "")} onValueChange={(newValue) => updateFilterRule(groupId, rule.id, { value: newValue })}><SelectTrigger className="h-8"><SelectValue placeholder="Select value" /></SelectTrigger><SelectContent>{options.map((option) => (<SelectItem key={String(option)} value={String(option)}>{String(option)}</SelectItem>))}</SelectContent></Select>);
        }
      // ✅ FIX #2: Added a render case for the "checkbox" type.
      case "checkbox":
        return (
          <Select
            // The value sent to the API will be a boolean, but the Select component works with strings.
            value={String(value)}
            onValueChange={(newValue) => updateFilterRule(groupId, rule.id, { value: newValue === 'true' })}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Checked</SelectItem>
              <SelectItem value="false">Unchecked</SelectItem>
            </SelectContent>
          </Select>
        );
      case "number":
        if (operator === "between") {
          const [min, max] = Array.isArray(value) ? value : [value?.min || "", value?.max || ""];
          return (<div className="flex gap-2"><Input type="number" placeholder="Min" value={min} onChange={(e) => updateFilterRule(groupId, rule.id, { value: [e.target.value, max] })} className="h-8"/><Input type="number" placeholder="Max" value={max} onChange={(e) => updateFilterRule(groupId, rule.id, { value: [min, e.target.value] })} className="h-8"/></div>);
        } else {
          return (<Input type="number" placeholder="Enter number" value={value || ""} onChange={(e) => updateFilterRule(groupId, rule.id, { value: e.target.value })} className="h-8"/>);
        }
      case "date":
        if (operator === "between") {
          const [fromDate, toDate] = Array.isArray(value) && value.length === 2 ? value : [undefined, undefined];
          return (<div className="flex gap-2"><Popover><PopoverTrigger asChild><Button variant="outline" className="h-8 justify-start text-left font-normal w-full"><CalendarIcon className="mr-2 h-4 w-4" />{fromDate ? format(new Date(fromDate), "PPP") : "From"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={fromDate ? new Date(fromDate) : undefined} onSelect={(date) => updateFilterRule(groupId, rule.id, { value: [date?.toISOString(), toDate] })} initialFocus/></PopoverContent></Popover><Popover><PopoverTrigger asChild><Button variant="outline" className="h-8 justify-start text-left font-normal w-full"><CalendarIcon className="mr-2 h-4 w-4" />{toDate ? format(new Date(toDate), "PPP") : "To"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={toDate ? new Date(toDate) : undefined} onSelect={(date) => updateFilterRule(groupId, rule.id, { value: [fromDate, date?.toISOString()] })} initialFocus/></PopoverContent></Popover></div>);
        } else {
          return (<Popover><PopoverTrigger asChild><Button variant="outline" className="h-8 justify-start text-left font-normal w-full"><CalendarIcon className="mr-2 h-4 w-4" />{value ? format(new Date(value), "PPP") : "Select date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={value ? new Date(value) : undefined} onSelect={(date) => updateFilterRule(groupId, rule.id, { value: date?.toISOString() })} initialFocus/></PopoverContent></Popover>);
        }
      default:
        return null;
    }
  };

  const getActiveFiltersCount = () => {
    return filterGroups.reduce((count, group) => count + group.rules.filter(rule => rule.field && rule.operator && rule.value).length, 0);
  };

  return (
     <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8">
          <Filter className="w-4 h-4" />
          Filter
          {getActiveFiltersCount() > 0 && (
            <Badge variant="secondary" className="ml-1">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0 max-h-[500px] overflow-y-auto" align="start">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4 sticky top-0 bg-popover z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Advanced Filters</CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-8 px-2 text-xs"><RotateCcw className="w-3 h-3 mr-1" />Clear All</Button>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8 w-8 p-0"><X className="w-4 h-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* --- NEW: Saved Filters Section --- */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Saved Filters</h4>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled={getActiveFiltersCount() === 0}>
                      <Save className="w-3 h-3" />
                      Save current filter
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Save Filter</AlertDialogTitle>
                      <AlertDialogDescription>Enter a name for your current filter configuration.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <Input 
                      placeholder="e.g., 'High Priority Tasks'" 
                      value={saveFilterName}
                      onChange={(e) => setSaveFilterName(e.target.value)}
                    />
                    <AlertDialogFooter className="flex justify-end gap-2">
  <AlertDialogCancel
    onClick={() => setSaveFilterName("")}
    className="w-32"
  >
    Cancel
  </AlertDialogCancel>
  <AlertDialogAction
    onClick={handleSaveFilterClick}
    disabled={!saveFilterName.trim()}
    className="w-32"
  >
    Save
  </AlertDialogAction>
</AlertDialogFooter>

                  </AlertDialogContent>
                </AlertDialog>
              </div>
              {savedFilters.length > 0 ? (
                <div className="space-y-2">
                  {savedFilters.map(sf => (
                    <div key={sf.name} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                      <button className="text-sm text-left flex-1" onClick={() => handleApplySavedFilter(sf)}>
                        {sf.name}
                      </button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDeleteFilter(sf.name)} title={`Delete '${sf.name}'`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">No saved filters yet.</p>
              )}
            </div>
            <Separator />
            {filterGroups.map((group, groupIndex) => (
              <div key={group.id} className="space-y-3">
                {groupIndex > 0 && (
                  <div className="flex items-center justify-center"><Select value={group.logic} onValueChange={(value: "AND" | "OR") => updateGroupLogic(group.id, value)}><SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="OR">OR</SelectItem><SelectItem value="AND">AND</SelectItem></SelectContent></Select></div>
                )}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">Where</span>
                        <Select value={group.logic} onValueChange={(value: "AND" | "OR") => updateGroupLogic(group.id, value)}><SelectTrigger className="w-20 h-7 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="AND">All</SelectItem><SelectItem value="OR">Any</SelectItem></SelectContent></Select>
                        <span className="text-sm text-muted-foreground">of the following apply:</span>
                    </div>
                    {filterGroups.length > 1 && (<Button variant="ghost" size="sm" onClick={() => removeFilterGroup(group.id)} className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"><X className="w-3 h-3" /></Button>)}
                  </div>
                  {group.rules.map((rule, ruleIndex) => {
                    const filterConfig = filters.find(f => f.key === rule.field);
                    const operators = filterConfig ? (OPERATORS[filterConfig.type as OperatorType] || []) : [];
                    return (
                      <div key={rule.id} className="space-y-2">
                         {ruleIndex > 0 && (
                            <div className="pl-4 text-xs font-semibold text-muted-foreground">{group.logic}</div>
                         )}
                        <div className="grid grid-cols-12 gap-2 items-start">
                          <div className="col-span-3">
                            <Select value={rule.field} onValueChange={(value) => handleFieldChange(group.id, rule.id, value)}>
                              <SelectTrigger className="h-8"><SelectValue placeholder="Field" /></SelectTrigger>
                              <SelectContent>{filters.map((filter) => (<SelectItem key={filter.key} value={filter.key}>{filter.label}</SelectItem>))}</SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-3">
                            <Select value={rule.operator} onValueChange={(value) => handleOperatorChange(group.id, rule.id, value)}>
                              <SelectTrigger className="h-8"><SelectValue placeholder="Operator" /></SelectTrigger>
                              <SelectContent>{operators.map((op) => (<SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>))}</SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-5">{filterConfig && renderValueInput(group.id, rule, filterConfig)}</div>
                          <div className="col-span-1 flex justify-end">
                            <Button variant="ghost" size="sm" onClick={() => removeFilterRule(group.id, rule.id)} className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"><X className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <Button variant="outline" size="sm" onClick={() => addFilterRule(group.id)} className="w-full h-8 border-dashed border text-muted-foreground hover:text-foreground"><Plus className="w-4 h-4 mr-2" />Add new filter</Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addFilterGroup} className="w-full h-8 border-dashed border text-muted-foreground hover:text-foreground"><Plus className="w-4 h-4 mr-2" />Add filter group</Button>
            <Separator />
           <div className="flex justify-end gap-2 sticky bottom-0 bg-popover py-4 px-4 -mx-4 -mb-4">
  <Button
    variant="ghost"
    size="sm"
    onClick={() => setIsOpen(false)}
    className="w-32"
  >
    Cancel
  </Button>
  <Button
    size="sm"
    onClick={applyFilters}
    className="w-32"
  >
    Apply filters
  </Button>
</div>
 
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}