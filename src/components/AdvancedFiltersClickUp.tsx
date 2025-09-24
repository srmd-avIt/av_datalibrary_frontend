/**
 * AdvancedFiltersClickUp Component
 * 
 * A comprehensive filtering interface inspired by ClickUp's advanced filter system.
 * This component provides a sophisticated filtering experience with multiple filter groups,
 * complex logical operations (AND/OR), and various filter types.
 * 
 * Features:
 * - Multiple filter groups with inter-group logic (AND/OR)
 * - Multiple filter rules within each group with intra-group logic
 * - Support for different data types: text, select, date, number, checkbox
 * - Dynamic operator selection based on field type
 * - Save and load custom filter configurations
 * - Glassmorphism dark theme styling
 * - Real-time filter count display
 * 
 * @component
 */

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Filter, Plus, X, RotateCcw, Calendar as CalendarIcon, Save, Star } from "lucide-react";
import { format } from "../data/date-fns";

/**
 * Represents a single filter rule within a filter group
 */
interface FilterRule {
  id: string;           // Unique identifier for the rule
  field: string;        // The data field to filter on
  operator: string;     // The comparison operator (equals, contains, etc.)
  value: any;          // The value to compare against
  logic?: "AND" | "OR"; // Logic operator connecting this rule to the next
}

/**
 * Represents a group of filter rules with shared logic
 */
interface FilterGroup {
  id: string;           // Unique identifier for the group
  rules: FilterRule[];  // Array of filter rules in this group
  logic: "AND" | "OR";  // Logic operator connecting this group to the next
}

/**
 * Configuration for a filterable field
 */
interface FilterConfig {
  key: string;                                                    // Field key in the data
  label: string;                                                  // Human-readable label
  type: "text" | "select" | "date" | "number" | "checkbox";      // Data type for appropriate UI
  options?: string[];                                             // Predefined options for select type
}

/**
 * Props for the AdvancedFiltersClickUp component
 */
interface AdvancedFiltersClickUpProps {
  filters: FilterConfig[];                                        // Available filter configurations
  onFiltersChange: (filterGroups: FilterGroup[]) => void;        // Callback when filters are applied
  data: any[];                                                   // Data array for extracting unique values
  onSaveFilter?: (name: string, filterGroups: FilterGroup[]) => void; // Optional save filter callback
}

/**
 * Operator definitions for different field types
 * Each field type has specific operators that make sense for that data type
 * This configuration drives the operator dropdown selection UI
 */
const OPERATORS = {
  // Text field operators - for string-based filtering
  text: [
    { value: "contains", label: "Contains" },                    // Partial match (case-insensitive)
    { value: "not_contains", label: "Does not contain" },       // Inverse partial match
    { value: "equals", label: "Equals" },                       // Exact match
    { value: "not_equals", label: "Does not equal" },           // Inverse exact match
    { value: "starts_with", label: "Starts with" },             // Prefix match
    { value: "ends_with", label: "Ends with" },                 // Suffix match
    { value: "is_empty", label: "Is empty" },                   // Field is null/undefined/empty
    { value: "is_not_empty", label: "Is not empty" }            // Field has a value
  ],
  // Select field operators - for dropdown/categorical data
  select: [
    { value: "equals", label: "Equals" },                       // Single value match
    { value: "not_equals", label: "Does not equal" },           // Single value inverse match
    { value: "in", label: "Is any of" },                        // Multiple value match (OR logic)
    { value: "not_in", label: "Is none of" }                    // Multiple value inverse match
  ],
  // Number field operators - for numeric comparisons
  number: [
    { value: "equals", label: "Equals" },                       // Exact numeric match
    { value: "not_equals", label: "Does not equal" },           // Inverse numeric match
    { value: "greater", label: "Greater than" },                // Value > threshold
    { value: "greater_equal", label: "Greater than or equal" }, // Value >= threshold
    { value: "less", label: "Less than" },                      // Value < threshold
    { value: "less_equal", label: "Less than or equal" },       // Value <= threshold
    { value: "between", label: "Between" }                      // Min <= Value <= Max
  ],
  // Date field operators - for temporal comparisons
  date: [
    { value: "equals", label: "Is" },                           // Exact date match
    { value: "not_equals", label: "Is not" },                   // Inverse date match
    { value: "before", label: "Is before" },                    // Date < threshold
    { value: "after", label: "Is after" },                      // Date > threshold
    { value: "between", label: "Is between" },                  // Start <= Date <= End
    { value: "is_empty", label: "Is empty" },                   // No date set
    { value: "is_not_empty", label: "Is not empty" }            // Date is set
  ]
};

export function AdvancedFiltersClickUp({ filters, onFiltersChange, data, onSaveFilter }: AdvancedFiltersClickUpProps) {
  // State Management
  const [isOpen, setIsOpen] = useState(false);                    // Controls the main popover visibility
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    { id: "group1", rules: [], logic: "AND" }                     // Initialize with one empty filter group
  ]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);    // Controls save filter dialog visibility
  const [filterName, setFilterName] = useState("");              // Stores the name for saving filters

  /**
   * Extracts unique values from the data for a specific field
   * Used to populate dropdown options for select fields dynamically
   * @param key - The field key to extract values from
   * @returns Sorted array of unique values
   */
  const getUniqueValues = (key: string) => {
    const values = data.map(item => item[key]).filter(Boolean);   // Extract non-empty values
    return [...new Set(values)].sort();                          // Remove duplicates and sort
  };

  /**
   * Filter Rule Management Functions
   * These functions handle CRUD operations for individual filter rules within groups
   */

  /**
   * Adds a new filter rule to a specific filter group
   * @param groupId - The ID of the group to add the rule to
   */
  const addFilterRule = (groupId: string) => {
    const newRule: FilterRule = {
      id: `rule_${Date.now()}`,                                   // Generate unique ID using timestamp
      field: filters[0]?.key || "",                              // Default to first available filter field
      operator: "contains",                                      // Default operator
      value: "",                                                 // Empty value initially
      logic: "AND"                                               // Default to AND logic
    };

    // Update the specific group by adding the new rule to its rules array
    setFilterGroups(groups =>
      groups.map(group =>
        group.id === groupId
          ? { ...group, rules: [...group.rules, newRule] }       // Add rule to matching group
          : group                                                // Keep other groups unchanged
      )
    );
  };

  /**
   * Removes a specific filter rule from a specific filter group
   * @param groupId - The ID of the group containing the rule
   * @param ruleId - The ID of the rule to remove
   */
  const removeFilterRule = (groupId: string, ruleId: string) => {
    setFilterGroups(groups =>
      groups.map(group =>
        group.id === groupId
          ? { ...group, rules: group.rules.filter(rule => rule.id !== ruleId) } // Remove specific rule
          : group                                                                // Keep other groups unchanged
      )
    );
  };

  /**
   * Updates specific properties of a filter rule
   * @param groupId - The ID of the group containing the rule
   * @param ruleId - The ID of the rule to update
   * @param updates - Partial FilterRule object with properties to update
   */
  const updateFilterRule = (groupId: string, ruleId: string, updates: Partial<FilterRule>) => {
    setFilterGroups(groups =>
      groups.map(group =>
        group.id === groupId
          ? {
              ...group,
              rules: group.rules.map(rule =>
                rule.id === ruleId ? { ...rule, ...updates } : rule  // Merge updates for matching rule
              )
            }
          : group                                                     // Keep other groups unchanged
      )
    );
  };

  /**
   * Filter Group Management Functions
   * These functions handle CRUD operations for filter groups
   */

  /**
   * Adds a new filter group to the filter configuration
   * New groups default to OR logic since they typically represent alternative filter paths
   */
  const addFilterGroup = () => {
    const newGroup: FilterGroup = {
      id: `group_${Date.now()}`,                                 // Generate unique ID using timestamp
      rules: [],                                                // Start with no rules
      logic: "OR"                                               // Default to OR for inter-group logic
    };
    setFilterGroups([...filterGroups, newGroup]);              // Append new group to existing groups
  };

  /**
   * Removes a specific filter group
   * Prevents removal if only one group exists (minimum requirement)
   * @param groupId - The ID of the group to remove
   */
  const removeFilterGroup = (groupId: string) => {
    if (filterGroups.length > 1) {                             // Ensure at least one group remains
      setFilterGroups(groups => groups.filter(group => group.id !== groupId));
    }
  };

  /**
   * Updates the logical operator for a specific filter group
   * This determines how this group connects to the next group (AND/OR)
   * @param groupId - The ID of the group to update
   * @param logic - The new logical operator (AND/OR)
   */
  const updateGroupLogic = (groupId: string, logic: "AND" | "OR") => {
    setFilterGroups(groups =>
      groups.map(group =>
        group.id === groupId ? { ...group, logic } : group     // Update logic for matching group
      )
    );
  };

  /**
   * Utility Functions
   * Helper functions for filter operations and state management
   */

  /**
   * Resets all filters to the initial state
   * Creates a single empty filter group with AND logic
   */
  const clearAllFilters = () => {
    setFilterGroups([{ id: "group1", rules: [], logic: "AND" }]);
  };

  /**
   * Applies the current filter configuration
   * Calls the parent component's callback and closes the filter popover
   */
  const applyFilters = () => {
    onFiltersChange(filterGroups);                              // Pass filter configuration to parent
    setIsOpen(false);                                           // Close the filter interface
  };

  /**
   * Handles saving the current filter configuration with a custom name
   * Only proceeds if name is provided, save callback exists, and filters are active
   */
  const handleSaveFilter = () => {
    if (filterName.trim() && onSaveFilter && getActiveFiltersCount() > 0) {
      onSaveFilter(filterName.trim(), filterGroups);           // Save with trimmed name
      setFilterName("");                                       // Clear the input
      setShowSaveDialog(false);                                // Close save dialog
      setIsOpen(false);                                        // Close main filter interface
    }
  };

  /**
   * Renders the appropriate input component for filter values based on field type and operator
   * This is the core UI rendering function that adapts to different data types and operations
   * 
   * @param groupId - ID of the filter group containing this rule
   * @param rule - The filter rule being rendered
   * @param filterConfig - Configuration object defining the field type and options
   * @returns JSX element for the value input or null if no input needed
   */
  const renderValueInput = (groupId: string, rule: FilterRule, filterConfig: FilterConfig) => {
    const { operator, value } = rule;

    // Operators that don't require a value input (existence checks)
    if (["is_empty", "is_not_empty"].includes(operator)) {
      return null;
    }

    // Switch based on field type to render appropriate input component
    switch (filterConfig.type) {
      case "text":
        // Simple text input for string-based filtering
        return (
          <Input
            placeholder="Enter value"
            value={value || ""}
            onChange={(e) => updateFilterRule(groupId, rule.id, { value: e.target.value })}
              className="h-8 bg-slate-900/50 border-slate-700/50 text-slate-100 placeholder:text-slate-400" style={{ backgroundColor: "#0f172a80" }}
          />
        );

      case "select":
        // Handle select fields with different UI based on operator type
        if (["in", "not_in"].includes(operator)) {
          // Multiple selection with checkboxes for "any of" / "none of" operators
          const options = filterConfig.options || getUniqueValues(filterConfig.key);
          const selectedValues = Array.isArray(value) ? value : [];
          
          return (
            <div className="space-y-2 max-h-32 overflow-y-auto border border-slate-700/50 rounded p-2 bg-slate-900/50" style={{ backgroundColor: "#0f172a80" }}>
              {options.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${rule.id}-${option}`}
                    checked={selectedValues.includes(option)}
                    onCheckedChange={(checked) => {
                      // Add or remove option from selected values array
                      const newValues = checked
                        ? [...selectedValues, option]
                        : selectedValues.filter(v => v !== option);
                      updateFilterRule(groupId, rule.id, { value: newValues });
                    }}
                  />
                  <Label htmlFor={`${rule.id}-${option}`} className="text-sm text-slate-200">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          );
        } else {
          // Single selection dropdown for "equals" / "not equals" operators
          const options = filterConfig.options || getUniqueValues(filterConfig.key);
          return (
            <Select
              value={value || ""}
              onValueChange={(newValue) => updateFilterRule(groupId, rule.id, { value: newValue })}
            >
              <SelectTrigger className="h-8 bg-slate-900/50 border-slate-700/50 text-slate-100" style={{ backgroundColor: "#0f172a80" }}>
                <SelectValue placeholder="Select value" />
              </SelectTrigger>
              <SelectContent className=" backdrop-blur-xl border-slate-700/50 text-slate-100" style={{ backgroundColor: "#1e293bF2" }}>
                {options.map((option) => (
                  <SelectItem key={option} value={option} className="text-slate-100 hover:bg-slate-700/50 focus:bg-slate-700/50" style={{ backgroundColor: "#33415580" }}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }

      case "number":
        // Handle numeric inputs with special case for range operators
        if (operator === "between") {
          // Range input with min/max fields for "between" operator
          const [min, max] = Array.isArray(value) ? value : [value?.min || "", value?.max || ""];
          return (
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={min}
                onChange={(e) => updateFilterRule(groupId, rule.id, { value: [e.target.value, max] })}
                className="h-8 bg-slate-900/50 border-slate-700/50 text-slate-100 placeholder:text-slate-400" style={{ backgroundColor: "#0f172a80" }}
              />
              <Input
                type="number"
                placeholder="Max"
                value={max}
                onChange={(e) => updateFilterRule(groupId, rule.id, { value: [min, e.target.value] })}
                className="h-8 bg-slate-900/50 border-slate-700/50 text-slate-100 placeholder:text-slate-400" style={{ backgroundColor: "#0f172a80" }}
              />
            </div>
          );
        } else {
          // Single number input for comparison operators
          return (
            <Input
              type="number"
              placeholder="Enter number"
              value={value || ""}
              onChange={(e) => updateFilterRule(groupId, rule.id, { value: e.target.value })}
              className="h-8 bg-slate-900/50 border-slate-700/50 text-slate-100 placeholder:text-slate-400" style={{ backgroundColor: "#0f172a80" }}
            />
          );
        }

      case "date":
        // Handle date inputs with calendar popover interface
        if (operator === "between") {
          // Date range picker with separate "from" and "to" calendars
          const [fromDate, toDate] = Array.isArray(value) ? value : [value?.from, value?.to];
          return (
            <div className="flex gap-2">
              {/* From Date Selector */}
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
              {/* To Date Selector */}
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
          // Single date picker for comparison operators
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
        // Fallback for unsupported field types
        return null;
    }
  };

  /**
   * Calculates the total number of active filter rules across all groups
   * Used for displaying filter count badges and enabling/disabling save functionality
   * @returns Total count of filter rules
   */
  const getActiveFiltersCount = () => {
    return filterGroups.reduce((count, group) => count + group.rules.length, 0);
  };

  /**
   * Main Component Render
   * The component structure follows this hierarchy:
   * 1. Popover trigger button with filter count badge
   * 2. Popover content with filter configuration interface
   * 3. Multiple filter groups, each containing multiple filter rules
   * 4. Action buttons for apply, save, and clear operations
   */
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      {/* Filter Trigger Button with Active Filter Count */}
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8">
          <Filter className="w-4 h-4" />
          Filter
          {/* Show filter count badge when filters are active */}
          {getActiveFiltersCount() > 0 && (
            <Badge variant="secondary" className="ml-1">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      {/* Main Filter Configuration Interface */}
      {/* Glassmorphism styled popover with dark theme and backdrop blur */}
      <PopoverContent className="w-[600px] p-0 max-h-[500px] overflow-y-auto text-white backdrop-blur-xl border-slate-700/50 text-slate-100" style={{ backgroundColor: "#1e293bF2" }} align="start">
        <Card className="border-0 shadow-none bg-transparent text-white text-slate-100"  style={{ backgroundColor: "#1e293bF2" }}>
          {/* Header Section with Title and Action Buttons */}
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-slate-100 text-white">Advanced Filters</CardTitle>
              <div className="flex gap-2">
                {/* Clear All Filters Button */}
              <Button
  variant="ghost"
  size="sm"
  onClick={clearAllFilters}
  className="h-8 px-2 text-xs text-white hover:bg-accent hover:text-accent-foreground transition-colors"
>
  <RotateCcw className="w-3 h-3 mr-1" /> {/* no text-white here */}
  Clear All
</Button>

                {/* Close Filter Interface Button */}
               <Button
  variant="ghost"
  size="sm"
  onClick={() => setIsOpen(false)}
  className="h-8 w-8 p-0 text-white hover:bg-accent hover:text-accent-foreground transition-colors"
>
  <X className="w-4 h-4" /> {/* removed text-white */}
</Button>

              </div>
            </div>
          </CardHeader>
          {/* Filter Groups Section */}
          <CardContent className="space-y-4" >
            {/* Render each filter group */}
            {filterGroups.map((group, groupIndex) => (
             <div
  key={group.id}
  className="space-y-3 rounded-xl"
  style={{ backgroundColor: "#0f172aF2" }}
>

                {/* Inter-group Logic Selector (appears between groups) */}
                {groupIndex > 0 && (
                  <div className="flex items-center justify-center" >
                    <Select
                      value={group.logic}
                      onValueChange={(value: "AND" | "OR") => updateGroupLogic(group.id, value)}
                    >
                      <SelectTrigger className="w-20 h-8 bg-slate-900/50 border-slate-700/50 text-slate-100" style={{ backgroundColor: "#0f172a80" }} >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className=" backdrop-blur-xl border-slate-700/50 text-slate-100" style={{ backgroundColor: "#1e293bF2" }}>
                        <SelectItem value="AND" className="text-slate-100 hover:bg-slate-700/50 focus:bg-slate-700/50" style={{ backgroundColor: "#33415580" }}>AND</SelectItem>
                        <SelectItem value="OR" className="text-slate-100 hover:bg-slate-700/50 focus:bg-slate-700/50" style={{ backgroundColor: "#33415580" }}>OR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Individual Filter Group Container */}
                <div className="border border-slate-700/50 rounded-lg p-4 space-y-3 bg-slate-900/30">
                  {/* Group Header with Title and Remove Button */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white text-slate-200">Filter Group {groupIndex + 1}</span>
                    {/* Only show remove button if more than one group exists */}
                    {filterGroups.length > 1 && (
                   <Button
  variant="ghost"
  size="sm"
  onClick={() => removeFilterGroup(group.id)}
  className="h-6 w-6 p-0 border border-white text-white hover:bg-accent hover:text-accent-foreground transition-colors"
>
  <X className="w-3 h-3" />
</Button>

                    )}
                  </div>

                  {/* Filter Rules within the Group */}
                  {group.rules.map((rule, ruleIndex) => {
                    // Find the configuration for the selected field
                    const filterConfig = filters.find(f => f.key === rule.field);
                    // Get available operators for this field type
                    const operators = filterConfig ? OPERATORS[filterConfig.type] || [] : [];

                    return (
                      <div key={rule.id} className="space-y-2 text-white">
                        {/* Intra-rule Logic Selector (appears between rules in a group) */}
                        {ruleIndex > 0 && (
                          <div className="flex items-center text-white justify-center">
                            <Select
                              value={rule.logic || "AND"}
                              onValueChange={(value: "AND" | "OR") => updateFilterRule(group.id, rule.id, { logic: value })}
                            >
                              <SelectTrigger className="w-16 h-6 text-xs bg-slate-900/50 border-slate-700/50 text-white" style={{ backgroundColor: "#0f172a80" }}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className=" backdrop-blur-xl border-slate-700/50 text-slate-100 text-white" style={{ backgroundColor: "#1e293bF2" }}>
                                <SelectItem value="AND" className="text-slate-100 hover:bg-slate-700/50 focus:bg-slate-700/50 text-white" style={{ backgroundColor: "#33415580" }}>AND</SelectItem>
                                <SelectItem value="OR" className="text-slate-100 hover:bg-slate-700/50 focus:bg-slate-700/50 text-white" style={{ backgroundColor: "#33415580" }}>OR</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Filter Rule Configuration Row */}
                        <div className="grid grid-cols-12 gap-2 items-start">
                          {/* Field Selection (Column 1-3) */}
                          <div className="col-span-3">
                            <Select
                              value={rule.field}
                              onValueChange={(value) => updateFilterRule(group.id, rule.id, { field: value, operator: "contains", value: "" })}
                            >
                              <SelectTrigger className="h-8 bg-slate-900/50 border-slate-700/50 text-slate-100 text-white" style={{ backgroundColor: "#0f172a80" }}>
                                <SelectValue placeholder="Field" />
                              </SelectTrigger>
                              <SelectContent className=" backdrop-blur-xl border-slate-700/50 text-slate-100 text-white" style={{ backgroundColor: "#1e293bF2" }}>
                                {filters.map((filter) => (
                                  <SelectItem key={filter.key} value={filter.key} className="text-slate-100 hover:bg-slate-700/50 focus:bg-slate-700/50 text-white" style={{ backgroundColor: "#33415580" }}>
                                    {filter.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Operator Selection (Column 4-6) */}
                          <div className="col-span-3 text-white">
                            <Select
                              value={rule.operator}
                              onValueChange={(value) => updateFilterRule(group.id, rule.id, { operator: value, value: "" })}
                            >
                              <SelectTrigger className="h-8 bg-slate-900/50 border-slate-700/50 text-slate-100 text-white" style={{ backgroundColor: "#0f172a80" }}>
                                <SelectValue placeholder="Operator" />
                              </SelectTrigger>
                              <SelectContent className=" backdrop-blur-xl border-slate-700/50 text-slate-100 text-white" style={{ backgroundColor: "#1e293bF2" }}>
                                {operators.map((operator) => (
                                  <SelectItem key={operator.value} value={operator.value} className="text-slate-100 hover:bg-slate-700/50 focus:bg-slate-700/50 text-white" style={{ backgroundColor: "#33415580" }}>
                                    {operator.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Value Input (Column 7-11) - Dynamic based on field type */}
                          <div className="col-span-5">
                            {filterConfig && renderValueInput(group.id, rule, filterConfig)}
                          </div>

                          {/* Remove Rule Button (Column 12) */}
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

                  {/* Add New Rule Button */}
                <Button
  variant="ghost"
  size="sm"
  onClick={() => addFilterRule(group.id)}
  className="w-full h-8 border border-white text-white hover:bg-accent hover:text-accent-foreground transition-colors"
>
  <Plus className="w-4 h-4 mr-2" />
  Add Rule
</Button>


                </div>
              </div>
            ))}

            {/* Add New Filter Group Button */}
         <Button
  variant="ghost"
  size="sm"
  onClick={addFilterGroup}
  className="w-full h-8 border border-white text-white hover:bg-accent hover:text-accent-foreground transition-colors"
>
  <Plus className="w-4 h-4 mr-2" />
  Add Filter Group
</Button>



            {/* Action Buttons Section */}
            <Separator />
            <div className="flex gap-2">
              {/* Apply Filters Button - Primary action */}
              <Button size="sm" onClick={applyFilters} className="flex-1">
                Apply Filters ({getActiveFiltersCount()})
              </Button>
              
              {/* Save Filter Button - Only show if callback provided and filters exist */}
              {onSaveFilter && getActiveFiltersCount() > 0 && (
                <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Star className="w-3 h-3" />
                      Save
                    </Button>
                  </DialogTrigger>
                  {/* Save Filter Dialog */}
                 <DialogContent
  style={{
    backgroundColor: "#1e293bF2",
    width: "500px",
    height: "200px",
  }}
  className="backdrop-blur-xl border-slate-700/50 text-slate-100"
>

                    <DialogHeader>
                      <DialogTitle className="text-slate-100 text-white">Save Filter</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="filter-name" className="text-slate-200 text-white">Filter Name</Label>
                        <Input
                          id="filter-name"
                          placeholder="Enter filter name..."
                          value={filterName}
                          onChange={(e) => setFilterName(e.target.value)}
                          className="mt-1 bg-slate-900/50 border-slate-700/50 text-slate-100" style={{ backgroundColor: "#0f172a80" }}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveFilter()}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveFilter} disabled={!filterName.trim()} className="flex-1">
                          <Save className="w-4 h-4 mr-2" />
                          Save Filter
                        </Button>
                        <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              
              {/* Clear All Filters Button */}
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