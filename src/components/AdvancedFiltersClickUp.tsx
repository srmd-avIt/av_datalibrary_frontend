import React, { useState, useEffect } from "react";
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
import { Filter, Plus, X, RotateCcw, Calendar as CalendarIcon } from "lucide-react";
import { format } from "../data/date-fns";

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
}

const OPERATORS = {
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
  ]
};

export function AdvancedFiltersClickUp({ filters, onFiltersChange, data }: AdvancedFiltersClickUpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    { id: "group1", rules: [], logic: "AND" }
  ]);

  const getUniqueValues = (key: string) => {
    const values = data.map(item => item[key]).filter(Boolean);
    return [...new Set(values)].sort();
  };

  const addFilterRule = (groupId: string) => {
    const newRule: FilterRule = {
      id: `rule_${Date.now()}`,
      field: filters[0]?.key || "",
      operator: "contains",
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
  };

  const applyFilters = () => {
    onFiltersChange(filterGroups);
    setIsOpen(false);
  };

  const renderValueInput = (groupId: string, rule: FilterRule, filterConfig: FilterConfig) => {
    const { operator, value } = rule;

    // Don't show value input for certain operators
    if (["is_empty", "is_not_empty"].includes(operator)) {
      return null;
    }

    switch (filterConfig.type) {
      case "text":
        return (
          <Input
            placeholder="Enter value"
            value={value || ""}
            onChange={(e) => updateFilterRule(groupId, rule.id, { value: e.target.value })}
            className="h-8"
          />
        );

      case "select":
        if (["in", "not_in"].includes(operator)) {
          const options = filterConfig.options || getUniqueValues(filterConfig.key);
          const selectedValues = Array.isArray(value) ? value : [];
          
          return (
            <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
              {options.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${rule.id}-${option}`}
                    checked={selectedValues.includes(option)}
                    onCheckedChange={(checked) => {
                      const newValues = checked
                        ? [...selectedValues, option]
                        : selectedValues.filter(v => v !== option);
                      updateFilterRule(groupId, rule.id, { value: newValues });
                    }}
                  />
                  <Label htmlFor={`${rule.id}-${option}`} className="text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          );
        } else {
          const options = filterConfig.options || getUniqueValues(filterConfig.key);
          return (
            <Select
              value={value || ""}
              onValueChange={(newValue) => updateFilterRule(groupId, rule.id, { value: newValue })}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select value" />
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
        }

      case "number":
        if (operator === "between") {
          const [min, max] = Array.isArray(value) ? value : [value?.min || "", value?.max || ""];
          return (
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={min}
                onChange={(e) => updateFilterRule(groupId, rule.id, { value: [e.target.value, max] })}
                className="h-8"
              />
              <Input
                type="number"
                placeholder="Max"
                value={max}
                onChange={(e) => updateFilterRule(groupId, rule.id, { value: [min, e.target.value] })}
                className="h-8"
              />
            </div>
          );
        } else {
          return (
            <Input
              type="number"
              placeholder="Enter number"
              value={value || ""}
              onChange={(e) => updateFilterRule(groupId, rule.id, { value: e.target.value })}
              className="h-8"
            />
          );
        }

      case "date":
        if (operator === "between") {
          const [fromDate, toDate] = Array.isArray(value) ? value : [value?.from, value?.to];
          return (
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-8 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(new Date(fromDate), "PPP") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fromDate ? new Date(fromDate) : undefined}
                    onSelect={(date) => updateFilterRule(groupId, rule.id, { value: [date?.toISOString(), toDate] })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-8 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(new Date(toDate), "PPP") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={toDate ? new Date(toDate) : undefined}
                    onSelect={(date) => updateFilterRule(groupId, rule.id, { value: [fromDate, date?.toISOString()] })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          );
        } else {
          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {value ? format(new Date(value), "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={value ? new Date(value) : undefined}
                  onSelect={(date) => updateFilterRule(groupId, rule.id, { value: date?.toISOString() })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          );
        }

      default:
        return null;
    }
  };

  const getActiveFiltersCount = () => {
    return filterGroups.reduce((count, group) => count + group.rules.length, 0);
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
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Advanced Filters</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-8 px-2 text-xs"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Clear All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {filterGroups.map((group, groupIndex) => (
                  <div key={group.id} className="space-y-3">
                    {groupIndex > 0 && (
                      <div className="flex items-center justify-center">
                        <Select
                          value={group.logic}
                          onValueChange={(value: "AND" | "OR") => updateGroupLogic(group.id, value)}
                        >
                          <SelectTrigger className="w-20 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AND">AND</SelectItem>
                            <SelectItem value="OR">OR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Filter Group {groupIndex + 1}</span>
                        {filterGroups.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFilterGroup(group.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>

                      {group.rules.map((rule, ruleIndex) => {
                        const filterConfig = filters.find(f => f.key === rule.field);
                        const operators = filterConfig ? OPERATORS[filterConfig.type] || [] : [];

                        return (
                          <div key={rule.id} className="space-y-2">
                            {ruleIndex > 0 && (
                              <div className="flex items-center">
                                <Select
                                  value={rule.logic || "AND"}
                                  onValueChange={(value: "AND" | "OR") => updateFilterRule(group.id, rule.id, { logic: value })}
                                >
                                  <SelectTrigger className="w-16 h-6 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="AND">AND</SelectItem>
                                    <SelectItem value="OR">OR</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            <div className="grid grid-cols-12 gap-2 items-start">
                              <div className="col-span-3">
                                <Select
                                  value={rule.field}
                                  onValueChange={(value) => updateFilterRule(group.id, rule.id, { field: value, operator: "contains", value: "" })}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Field" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {filters.map((filter) => (
                                      <SelectItem key={filter.key} value={filter.key}>
                                        {filter.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="col-span-3">
                                <Select
                                  value={rule.operator}
                                  onValueChange={(value) => updateFilterRule(group.id, rule.id, { operator: value, value: "" })}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Operator" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {operators.map((operator) => (
                                      <SelectItem key={operator.value} value={operator.value}>
                                        {operator.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="col-span-5">
                                {filterConfig && renderValueInput(group.id, rule, filterConfig)}
                              </div>

                              <div className="col-span-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFilterRule(group.id, rule.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addFilterRule(group.id)}
                        className="w-full h-8 border-dashed border"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Rule
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addFilterGroup}
                  className="w-full h-8 border-dashed border"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Filter Group
                </Button>

                <Separator />
                <div className="flex gap-2">
                  <Button size="sm" onClick={applyFilters} className="flex-1">
                    Apply Filters ({getActiveFiltersCount()})
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAllFilters}>
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>
  );
}