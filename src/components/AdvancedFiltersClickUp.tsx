import React, { useState } from "react";
import { Button as ShadcnButton } from "./ui/button";
import { Input as ShadcnInput } from "./ui/input";
import { Label } from "./ui/label";
import { Select as ShadcnSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Filter, Plus, X, RotateCcw, Calendar as CalendarIcon, Save, Star } from "lucide-react";
import { format } from "../data/date-fns";

const StyledButton = ({ baseStyle, hoverStyle, children, onClick, disabled, ...props }) => {
  const [isHovered, setIsHovered] = useState(false);
  const combinedStyle = { ...baseStyle, ...(isHovered && !disabled && hoverStyle) };
  return (
    <ShadcnButton
      style={combinedStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </ShadcnButton>
  );
};

const StyledSelectItem = ({ children, value }) => {
  const [isHovered, setIsHovered] = useState(false);
  const baseStyle = {
    color: "rgb(241, 245, 249)", // Text color
    cursor: "pointer",
    position: "relative",
    display: "flex",
    alignItems: "center",
    borderRadius: "0.25rem",
    padding: "0.25rem 2rem 0.25rem 0.5rem",
    fontSize: "0.875rem",
    outline: "none",
  };
  const hoverStyle = { backgroundColor: "transparent" }; // Transparent hover effect
  const combinedStyle = { ...baseStyle, ...(isHovered && hoverStyle) };

  return (
    <SelectItem
      value={value}
      style={combinedStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </SelectItem>
  );
};

interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: any;
  logic?: "AND" | "OR";
}

interface FilterGroup {
  id: string;
  rules: FilterRule[]; // Correctly define the type of `rules`
  logic: "AND" | "OR";
}

interface FilterConfig {
  key: string;
  label: string;
  type: "text" | "select" | "number" | "date"; // Extend as needed
  options?: { value: string; label: string }[]; // For select type
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
  // Add other types (select, number, date) as needed
};

export function AdvancedFiltersClickUp({ filters, onFiltersChange, data, onSaveFilter }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    { id: "group1", rules: [], logic: "AND" }
  ]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState("");

  const getUniqueValues = (key) => {
    const values = data.map((item) => item[key]).filter(Boolean);
    return [...new Set(values)].sort();
  };

  const addFilterRule = (groupId: string) => {
    const newRule: FilterRule = {
      id: `rule_${Date.now()}`,
      field: filters[0]?.key || "",
      operator: "contains",
      value: "",
      logic: "AND",
    };

    setFilterGroups((groups) =>
      groups.map((group) =>
        group.id === groupId
          ? { ...group, rules: [...(group.rules || []), newRule] }
          : group
      )
    );
  };

  const removeFilterRule = (groupId, ruleId) => {
    setFilterGroups((groups) =>
      groups.map((group) => (group.id === groupId ? { ...group, rules: group.rules.filter((rule) => rule.id !== ruleId) } : group))
    );
  };

  const updateFilterRule = (groupId, ruleId, updates) => {
    setFilterGroups((groups) =>
      groups.map((group) =>
        group.id === groupId
          ? { ...group, rules: group.rules.map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule)) }
          : group
      )
    );
  };

  const addFilterGroup = () => {
    const newGroup = { id: `group_${Date.now()}`, rules: [], logic: "OR" };
    setFilterGroups([...filterGroups, newGroup]);
  };

  const removeFilterGroup = (groupId) => {
    if (filterGroups.length > 1) {
      setFilterGroups((groups) => groups.filter((group) => group.id !== groupId));
    }
  };

  const updateGroupLogic = (groupId, logic) => {
    setFilterGroups((groups) => groups.map((group) => (group.id === groupId ? { ...group, logic } : group)));
  };

  const clearAllFilters = () => setFilterGroups([{ id: "group1", rules: [], logic: "AND" }]);

  const applyFilters = () => {
    onFiltersChange(filterGroups);
    setIsOpen(false);
  };

  const handleSaveFilter = () => {
    if (filterName.trim() && onSaveFilter && getActiveFiltersCount() > 0) {
      onSaveFilter(filterName.trim(), filterGroups);
      setFilterName("");
      setShowSaveDialog(false);
      setIsOpen(false);
    }
  };

  const getActiveFiltersCount = () => filterGroups.reduce((count, group) => count + group.rules.length, 0);

  const renderValueInput = (groupId: string, rule: FilterRule, filterConfig: FilterConfig) => {
    const { operator, value } = rule;

    if (["is_empty", "is_not_empty"].includes(operator)) {
      return null;
    }

    switch (filterConfig.type) {
      case "text":
        return (
          <ShadcnInput
            value={value || ""}
            onChange={(e) => updateFilterRule(groupId, rule.id, { value: e.target.value })}
            placeholder="Enter value"
            style={{
              height: "2rem",
              backgroundColor: "rgba(15, 23, 42, 0.5)",
              border: "1px solid rgba(51, 65, 85, 0.5)",
              color: "rgb(241, 245, 249)",
              borderRadius: "0.375rem",
            }}
          />
        );
      // Add cases for "select", "number", "date", etc.
      default:
        return null;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <ShadcnButton
          style={{
            display: "flex",
            gap: "0.5rem",
            height: "2rem",
            backgroundColor: "oklch(0.44 0 0 / 0.17)", // Black background when popup is open
            border: "1px solid rgba(51, 65, 85, 0.5)",
            color: "rgb(241, 245, 249)",
          }}
        >
          <Filter style={{ width: "1rem", height: "1rem" }} /> Filter
          {getActiveFiltersCount() > 0 && (
            <Badge style={{ marginLeft: "0.25rem", backgroundColor: "#2f2f30ff", color: "#ffffff" }}>
              {getActiveFiltersCount()}
            </Badge>
          )}
        </ShadcnButton>
      </PopoverTrigger>
    <PopoverContent 
    style={{ width: "600px", 
    padding: 0,
     maxHeight: "500px", 
     overflowY: "auto",
      backgroundColor: "rgba(30, 41, 59, 0.95)",
       backdropFilter: "blur(16px)",
        border: "1px solid rgba(51, 65, 85, 0.5)", 
        color: "rgb(241, 245, 249)",
         borderRadius: "0.5rem", 
        }} 
         >

        <Card style={{ borderWidth: 0, boxShadow: "none", backgroundColor: "transparent", color: "rgb(241, 245, 249)" }}>
          <CardHeader style={{ padding: "1rem", paddingBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <CardTitle style={{ fontSize: "1.125rem", color: "rgb(241, 245, 249)" }}>Advanced Filters</CardTitle>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {/* Clear All Button */}
                <StyledButton
                  onClick={clearAllFilters}
                  disabled={false}
                  baseStyle={{
                    height: "2rem",
                    padding: "0 0.5rem",
                    fontSize: "0.75rem",
                    color: "rgba(245, 246, 248, 1)", // Dark text color
                    backgroundColor: "transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    borderRadius: "0.375rem",
                  }}
                  hoverStyle={{
                    backgroundColor: "white", // White background on hover
                    color: "rgb(15, 23, 42)", // Dark text color for contrast
                  }}
                >
                  <RotateCcw style={{ width: "0.75rem", height: "0.75rem" }} /> Clear All
                </StyledButton>

                {/* Close Filter Interface Button */}
                <StyledButton
                  onClick={() => setIsOpen(false)}
                  disabled={false}
                  baseStyle={{
                    height: "2rem",
                    width: "2rem",
                    padding: 0,
                    color: "rgb(156, 163, 175)", // Default text color
                    backgroundColor: "transparent",
                    borderRadius: "0.375rem",
                  }}
                  hoverStyle={{
                    backgroundColor: "white", // White background on hover
                    color: "rgb(15, 23, 42)", // Dark text color for contrast
                  }}
                >
                  <X style={{ width: "1rem", height: "1rem" }} />
                </StyledButton>
              </div>
            </div>
          </CardHeader>
          <CardContent style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "0 1rem 1rem 1rem" }}>
            {filterGroups.map((group, groupIndex) => (
              <React.Fragment key={group.id}>
                {groupIndex > 0 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "-0.5rem 0" }}>
                    <ShadcnSelect value={group.logic} onValueChange={(value) => updateGroupLogic(group.id, value)}>
                      <SelectTrigger style={{ width: "5rem", height: "2rem", backgroundColor: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(51, 65, 85, 0.5)", color: "#cbd5e1", borderRadius: "0.375rem", fontSize: "0.875rem" }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{ backgroundColor: "rgba(30, 41, 59, 0.95)", backdropFilter: "blur(16px)", border: "1px solid rgba(51, 65, 85, 0.5)", color: "rgb(241, 245, 249)" }}>
                        <StyledSelectItem value="AND">AND</StyledSelectItem>
                        <StyledSelectItem value="OR">OR</StyledSelectItem>
                      </SelectContent>
                    </ShadcnSelect>
                  </div>
                )}
                <div style={{ backgroundColor: "#0f172a", border: "1px solid rgba(51, 65, 85, 0.5)", borderRadius: "0.75rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "rgb(226, 232, 240)" }}>Filter Group {groupIndex + 1}</span>
                    {filterGroups.length > 1 && (
                      <StyledButton
                        onClick={() => removeFilterGroup(group.id)}
                        disabled={false}
                        baseStyle={{
                          height: "1.5rem",
                          width: "1.5rem",
                          padding: 0,
                          color: "rgb(156, 163, 175)", // Default text color
                          backgroundColor: "transparent",
                          borderRadius: "0.375rem",
                        }}
                        hoverStyle={{
                          backgroundColor: "white", // White background on hover
                          color: "rgb(15, 23, 42)", // Dark text color for contrast
                        }}
                      >
                        <X style={{ width: "0.875rem", height: "0.875rem" }} />
                      </StyledButton>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {group.rules.map((rule, ruleIndex) => {
                      const filterConfig = filters.find((f) => f.key === rule.field);
                      const operators = filterConfig ? OPERATORS[filterConfig.type] || [] : [];
                      return (
                        <div key={rule.id} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {ruleIndex > 0 && (
                            <div style={{ display: "flex", alignItems: "center" }}>
                              <ShadcnSelect value={rule.logic || "AND"} onValueChange={(value) => updateFilterRule(group.id, rule.id, { logic: value })}>
                                <SelectTrigger style={{ width: "4rem", height: "1.5rem", fontSize: "0.75rem", backgroundColor: "rgba(15, 23, 42, 0.5)", border: "1px solid rgba(51, 65, 85, 0.5)", color: "rgb(241, 245, 249)", borderRadius: "0.375rem" }}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent style={{ backgroundColor: "rgba(30, 41, 59, 0.95)", backdropFilter: "blur(16px)", border: "1px solid rgba(51, 65, 85, 0.5)", color: "rgb(241, 245, 249)" }}>
                                  <StyledSelectItem value="AND">AND</StyledSelectItem>
                                  <StyledSelectItem value="OR">OR</StyledSelectItem>
                                </SelectContent>
                              </ShadcnSelect>
                            </div>
                          )}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: "0.5rem", alignItems: "flex-start" }}>
                            <div style={{ gridColumn: "span 3" }}>
                              <ShadcnSelect value={rule.field} onValueChange={(value) => updateFilterRule(group.id, rule.id, { field: value, operator: "contains", value: "" })}>
                                <SelectTrigger style={{ height: "2rem", backgroundColor: "rgba(15, 23, 42, 0.5)", border: "1px solid rgba(51, 65, 85, 0.5)", color: "rgb(241, 245, 249)", borderRadius: "0.375rem" }}>
                                  <SelectValue placeholder="Field" />
                                </SelectTrigger>
                                <SelectContent style={{ backgroundColor: "rgba(30, 41, 59, 0.95)", backdropFilter: "blur(16px)", border: "1px solid rgba(51, 65, 85, 0.5)", color: "rgb(241, 245, 249)" }}>
                                  {filters.map((filter) => <StyledSelectItem key={filter.key} value={filter.key}>{filter.label}</StyledSelectItem>)}
                                </SelectContent>
                              </ShadcnSelect>
                            </div>
                            <div style={{ gridColumn: "span 3" }}>
                              <ShadcnSelect value={rule.operator} onValueChange={(value) => updateFilterRule(group.id, rule.id, { operator: value, value: "" })}>
                                <SelectTrigger style={{ height: "2rem", backgroundColor: "rgba(15, 23, 42, 0.5)", border: "1px solid rgba(51, 65, 85, 0.5)", color: "rgb(241, 245, 249)", borderRadius: "0.375rem" }}>
                                  <SelectValue placeholder="Operator" />
                                </SelectTrigger>
                                <SelectContent style={{ backgroundColor: "rgba(30, 41, 59, 0.95)", backdropFilter: "blur(16px)", border: "1px solid rgba(51, 65, 85, 0.5)", color: "rgb(241, 245, 249)" }}>
                                  {operators.map((operator) => <StyledSelectItem key={operator.value} value={operator.value}>{operator.label}</StyledSelectItem>)}
                                </SelectContent>
                              </ShadcnSelect>
                            </div>
                            <div style={{ gridColumn: "span 5" }}>
                              {filterConfig && renderValueInput(group.id, rule, filterConfig)}
                            </div>
                            <div style={{ gridColumn: "span 1" }}>
                              {/* Remove Filter Rule Button */}
                              <StyledButton onClick={() => removeFilterRule(group.id, rule.id)} baseStyle={{ height: "2rem", width: "2rem", padding: 0, color: "rgb(156, 163, 175)", backgroundColor: "transparent" }} hoverStyle={{ backgroundColor: "rgba(51, 65, 85, 0.5)", color: "rgb(226, 232, 240)" }}>
                                <X style={{ width: "0.875rem", height: "0.875rem" }} />
                              </StyledButton>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* +Add Rule Button */}
                  <StyledButton
                    onClick={() => addFilterRule(group.id)}
                    disabled={false}
                    baseStyle={{
                      width: "auto",
                      height: "1.75rem",
                      padding: "0 0.5rem",
                      fontSize: "0.75rem",
                      color: "rgb(203, 213, 225)",
                      backgroundColor: "transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      border: "1px dashed rgb(71, 85, 105)",
                      borderRadius: "0.375rem", // Default border radius
                    }}
                    hoverStyle={{
                      backgroundColor: "white", // White background on hover
                      color: "rgb(15, 23, 42)", // Dark text color for contrast
                      border: "1px solid rgb(71, 85, 105)", // Solid border on hover
                      borderRadius: "0.5rem", // Slightly more rounded corners on hover
                    }}
                  >
                    <Plus style={{ width: "0.875rem", height: "0.875rem" }} /> Add Rule
                  </StyledButton>
                </div>
              </React.Fragment>
            ))}
            {/* +Add Filter Group Button */}
            <StyledButton
              onClick={addFilterGroup}
              disabled={false}
              baseStyle={{
                width: "100%",
                height: "2rem",
                padding: "0 0.5rem",
                fontSize: "0.875rem",
                color: "rgb(203, 213, 225)",
                backgroundColor: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                border: "1px dashed rgb(71, 85, 105)",
                borderRadius: "0.375rem", // Default border radius
              }}
              hoverStyle={{
                backgroundColor: "white", // White background on hover
                color: "rgb(15, 23, 42)", // Dark text color for contrast
                border: "1px solid rgb(71, 85, 105)", // Solid border on hover
                borderRadius: "0.5rem", // Slightly more rounded corners on hover
              }}
            >
              <Plus style={{ width: "1rem", height: "1rem" }} /> Add Filter Group
            </StyledButton>
            <Separator style={{ backgroundColor: "rgba(51, 65, 85, 0.5)", height: "1px", margin: "1rem 0" }} />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-start" }}>
              {/* Apply Filters Button */}
              <StyledButton
                onClick={applyFilters}
                disabled={false}
                baseStyle={{
                  flex: 1,
                  height: "2.25rem",
                  padding: "0 1rem",
                  fontSize: "0.875rem",
                  color: "white",
                  backgroundColor: "#0f0f20", // Dark background color
                  border: "none",
                  borderRadius: "0.375rem",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                hoverStyle={{ backgroundColor: "#1a1a2e" }} // Slightly lighter hover color
              >
                Apply Filters ({getActiveFiltersCount()})
              </StyledButton>

              {/* Save Button */}
              {onSaveFilter && getActiveFiltersCount() > 0 && (
                <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                  <DialogTrigger asChild>
                    <StyledButton
                      baseStyle={{
                        height: "2.25rem",
                        padding: "0 1rem",
                        fontSize: "0.875rem",
                        color: "#0f172a", // Dark text color for contrast
                        backgroundColor: "white", // White background
                        border: "1px solid #e2e8f0", // Light border color
                        borderRadius: "0.375rem",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.25rem",
                      }}
                      hoverStyle={{ backgroundColor: "#f1f5f9" }} // Slightly lighter hover color
                    >
                      <Star style={{ width: "0.875rem", height: "0.875rem" }} /> Save
                    </StyledButton>
                  </DialogTrigger>
                  {/* Save Filter Dialog */}
                  <DialogContent style={{ maxWidth: "28rem", backgroundColor: "rgba(30, 41, 59, 0.95)", backdropFilter: "blur(16px)", border: "1px solid rgba(51, 65, 85, 0.5)", color: "rgb(241, 245, 249)", borderRadius: "0.5rem" }}>
                    <DialogHeader>
                      <DialogTitle style={{ color: "rgb(241, 245, 249)" }}>Save Filter</DialogTitle>
                    </DialogHeader>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                     <div>
  <Label 
    htmlFor="filter-name" 
    style={{ color: "rgb(226, 232, 240)", marginBottom: "0.8rem", display: "block" }}
  >
    Filter Name
  </Label>

  <ShadcnInput
    id="filter-name"
    placeholder="Enter filter name..."
    value={filterName}
    onChange={(e) => setFilterName(e.target.value)}
    onKeyDown={(e) => e.key === "Enter" && handleSaveFilter()}
    style={{
      height: "2rem",
      backgroundColor: "rgba(15, 23, 42, 0.5)",
      border: "1px solid rgba(51, 65, 85, 0.5)",
      color: "rgb(241, 245, 249)",
      borderRadius: "0.375rem",
      width: "100%",
      padding: "0 0.75rem"
    }}
  />
</div>

                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <StyledButton
                          onClick={handleSaveFilter}
                          disabled={!filterName.trim()}
                          baseStyle={{
                            flex: 1,
                            display: "flex",
                            gap: "0.5rem",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#0f0f20", // Dark background color
                            color: "white",
                            borderRadius: "0.375rem",
                            height: "2.25rem",
                            opacity: !filterName.trim() ? 0.5 : 1,
                          }}
                          hoverStyle={{ backgroundColor: "#1a1a2e" }} // Slightly lighter hover color
                        >
                          <Save style={{ width: "1rem", height: "1rem" }} /> Save Filter
                        </StyledButton>
                        <StyledButton
                          onClick={() => setShowSaveDialog(false)}
                          disabled={false}
                          baseStyle={{
                            height: "2.25rem",
                            padding: "0 1rem",
                            backgroundColor: "white", // White background
                            border: "1px solid #e2e8f0", // Light border color
                            color: "#0f172a", // Dark text color for contrast
                            borderRadius: "0.375rem",
                          }}
                          hoverStyle={{ backgroundColor: "#f1f5f9" }} // Slightly lighter hover color
                        >
                          Cancel
                        </StyledButton>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Clear Button */}
              <StyledButton
                onClick={clearAllFilters}
                disabled={false}
                baseStyle={{
                  height: "2.25rem",
                  padding: "0 1rem",
                  fontSize: "0.875rem",
                  color: "#0f172a", // Dark text color for contrast
                  backgroundColor: "white", // White background
                  border: "1px solid #e2e8f0", // Light border color
                  borderRadius: "0.375rem",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                hoverStyle={{ backgroundColor: "#f1f5f9" }} // Slightly lighter hover color
              >
                Clear
              </StyledButton>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}