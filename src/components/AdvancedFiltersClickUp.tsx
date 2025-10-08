/// <reference types="vite/client" />
import React, { useState, useEffect, useMemo } from "react";
import { Button as ShadcnButton } from "./ui/button";
import { Input as ShadcnInput } from "./ui/input";
import { Label } from "./ui/label";
import { Select as ShadcnSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Filter, Plus, X, RotateCcw, Save, Star } from "lucide-react";
import { FilterConfig, FilterGroup, FilterRule } from "./types"; // Import shared types

// (Styled components remain unchanged)
interface StyledButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  baseStyle?: React.CSSProperties;
  hoverStyle?: React.CSSProperties;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

const StyledButton: React.FC<StyledButtonProps> = ({ baseStyle, hoverStyle, children, onClick, disabled, ...props }) => {
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

interface StyledSelectItemProps {
  children: React.ReactNode;
  value: string;
}

const StyledSelectItem: React.FC<StyledSelectItemProps> = ({ children, value }) => {
  const [isHovered, setIsHovered] = useState(false);
  const baseStyle = {
    cursor: "pointer",
    position: "relative" as React.CSSProperties["position"],
    display: "flex",
    alignItems: "center",
    borderRadius: "0.25rem",
    padding: "0.25rem 2rem 0.25rem 0.5rem",
    fontSize: "0.875rem",
    outline: "none",
    backgroundColor: isHovered ? "#f1f5f9" : "transparent",
    color: "inherit",
  };
  const combinedStyle = { ...baseStyle };

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


// --- MODIFICATION: Configuration for all dynamic dropdowns ---
// This object makes it easy to add more dynamic dropdowns in the future.
// key: The 'field' key from App.tsx.
// endpoint: The API endpoint to fetch data from.
// dataKey: The name of the property in the returned JSON objects to use for the dropdown label/value.
const DYNAMIC_FIELD_CONFIG = {
  'NewEventCategory': { endpoint: '/new-event-category/options', dataKey: 'NewEventCategoryName' },
  'Audio': { endpoint: '/audio/options', dataKey: 'AudioList' },
  'BhajanType': { endpoint: '/bhajan-type/options', dataKey: 'BhajanName' },
  'EditingType': { endpoint: '/editing-type/options', dataKey: 'EdType' },
  'fkCountry': { endpoint: '/countries/options', dataKey: 'Country' },
  'fkState': { endpoint: '/states/options', dataKey: 'State' },
  'fkCity': { endpoint: '/cities/options', dataKey: 'City' },
  'fkDigitalMasterCategory': { endpoint: '/digital-master-category/options', dataKey: 'DMCategory_name' },
  'fkGranth': { endpoint: '/granths/options', dataKey: 'Name' },
  'Language': { endpoint: '/language/options', dataKey: 'TitleLanguage' },
  'fkDistributionLabel': { endpoint: '/distribution-label/options', dataKey: 'LabelName' },
  'fkEventCategory': { endpoint: '/event-category/options', dataKey: 'EventCategory' },
  'FootageType': { endpoint: '/footage-type/options', dataKey: 'FootageTypeList' },
  'fkOccasion': { endpoint: '/occasion/options', dataKey: 'Occasion' },
  'TopicSource': { endpoint: '/topic-source/options', dataKey: 'TNName' },
  'NumberSource': { endpoint: '/topic-source/options', dataKey: 'TNName' },
  'FormateType': { endpoint: '/format-type/options', dataKey: 'Type' },
} as const;

type DynamicFieldKey = keyof typeof DYNAMIC_FIELD_CONFIG;

// (Interfaces and OPERATORS remain unchanged)
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
};

export function AdvancedFiltersClickUp({
  filters,
  onFiltersChange,
  data,
  onSaveFilter,
}: {
  filters: FilterConfig[];
  onFiltersChange: (filterGroups: FilterGroup[]) => void;
  data?: any;
  onSaveFilter?: (filterName: string, filterGroups: FilterGroup[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    { id: "group1", rules: [], logic: "AND" }
  ]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState("");

  // --- MODIFICATION: Generalized state for all dynamic options ---
  const [dynamicOptions, setDynamicOptions] = useState<{ [key: string]: { value: string; label: string }[] }>({});
  const [loadingFields, setLoadingFields] = useState<{ [key: string]: boolean }>({});
  const [errorFields, setErrorFields] = useState<{ [key: string]: string | null }>({});

  // --- MODIFICATION: Generalized useEffect to fetch data for any required dynamic field ---
  useEffect(() => {
    if (!isOpen) return;

    const fetchOptionsForField = async (field: string) => {
      const config = DYNAMIC_FIELD_CONFIG[field as DynamicFieldKey];
      // Don't fetch if no config exists, or if we are already loading, or if we already have the data.
      if (!config || loadingFields[field] || dynamicOptions[field]) {
        return;
      }

      setLoadingFields(prev => ({ ...prev, [field]: true }));
      setErrorFields(prev => ({ ...prev, [field]: null }));
      
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}${config.endpoint}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const jsonData = await response.json();
        
        const formattedOptions = jsonData.map((item: any) => ({
          value: item[config.dataKey],
          label: item[config.dataKey],
        })).filter((option: any) => option.value); // Filter out any items with null/empty values

        setDynamicOptions(prev => ({ ...prev, [field]: formattedOptions }));
      } catch (error) {
        console.error(`Error fetching options for ${field}:`, error);
        setErrorFields(prev => ({ ...prev, [field]: "Could not load options." }));
      } finally {
        setLoadingFields(prev => ({ ...prev, [field]: false }));
      }
    };

    // Check all current rules and fetch data if needed
    filterGroups.forEach(group => {
      group.rules.forEach(rule => {
        if (DYNAMIC_FIELD_CONFIG[rule.field as DynamicFieldKey]) {
          fetchOptionsForField(rule.field);
        }
      });
    });

  }, [isOpen, filterGroups]); // Re-run when the modal opens or when rules change

  // (All handler functions remain unchanged)
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
  const removeFilterRule = (groupId: string, ruleId: string) => {
    setFilterGroups((groups) =>
      groups.map((group) => (group.id === groupId ? { ...group, rules: group.rules.filter((rule) => rule.id !== ruleId) } : group))
    );
  };
  const updateFilterRule = (groupId: string, ruleId: string, updates: Partial<FilterRule>) => {
    setFilterGroups((groups) =>
      groups.map((group) =>
        group.id === groupId
          ? { ...group, rules: group.rules.map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule)) }
          : group
      )
    );
  };
  const addFilterGroup = () => {
    const newGroup: FilterGroup = { id: `group_${Date.now()}`, rules: [], logic: "OR" as "AND" | "OR" };
    setFilterGroups([...filterGroups, newGroup]);
  };
  const removeFilterGroup = (groupId: string) => {
    if (filterGroups.length > 1) {
      setFilterGroups((groups) => groups.filter((group) => group.id !== groupId));
    }
  };
  const updateGroupLogic = (groupId: string, logic: "AND" | "OR") => {
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


  // --- MODIFICATION: Generalized renderValueInput function ---
  const renderValueInput = (groupId: string, rule: FilterRule, filterConfig: FilterConfig) => {
    const { operator, value, field } = rule;

    if (["is_empty", "is_not_empty"].includes(operator)) {
      return null;
    }

    const commonStyle = {
        height: "2rem",
        backgroundColor: "#ffffff",
        border: "1px solid #cbd5e1",
        color: "#0f172a",
        borderRadius: "0.375rem",
    };

    // 1. Handle Hard-coded Static Dropdowns
    if (field === 'Segment Category') {
      const segmentCategoryOptions = [
        { value: 'Pravachan', label: 'Pravachan' }, { value: 'Prasangik Udbodhan', label: 'Prasangik Udbodhan' }, { value: 'SU', label: 'SU' }, { value: 'SU-GM', label: 'SU-GM' }, { value: 'SU-Revision', label: 'SU-Revision' }, { value: 'Satsang', label: 'Satsang' }, { value: 'Informal Satsang', label: 'Informal Satsang' }, { value: 'SRMD-Shibirs/Session/Training/Workshops', label: 'SRMD-Shibirs/Session/Training/Workshops' }, { value: 'Non-SRMD-Shibirs/Session/Training/Workshops', label: 'Non-SRMD-Shibirs/Session/Training/Workshops' }, { value: 'SU SRMD-Shibirs/Session/Training/Workshops', label: 'SU SRMD-Shibirs/Session/Training/Workshops' }, { value: 'Pratishtha', label: 'Pratishtha' }, { value: 'Padhramani', label: 'Padhramani' }, { value: 'Meditation', label: 'Meditation' }, { value: 'Drama/Skit', label: 'Drama/Skit' }, { value: 'Prathana', label: 'Prathana' }, { value: 'Bhakti', label: 'Bhakti' }, { value: '__EMPTY__', label: '(No Value)' }, { value: 'Celebrations', label: 'Celebrations' }, { value: 'Celebrations:Bhakti', label: 'Celebrations:Bhakti' }, { value: 'Celebrations:Drama/Skit', label: 'Celebrations:Drama/Skit' }, { value:'Heartfelt Experiences', label: 'Heartfelt Experiences' }, { value: 'Highlights', label: 'Highlights' }, { value: 'Highlights - Informal', label: 'Highlights - Informal' }, { value: 'Highlights - Mixed', label: 'Highlights - Mixed' }, { value: 'PEP - PostEvent Promo', label: 'PEP - PostEvent Promo' }, { value: 'Satsang Clips', label: 'Satsang Clips' }, { value: 'Other Clips', label: 'Other Clips' }, { value: 'Pujan', label: 'Pujan' }, { value: 'Promo', label: 'Promo' }, { value: 'None', label: 'None' }, { value: 'Documentary', label: 'Documentary' }, { value:'Other Edited Videos', label: 'Other Edited Videos' }, { value: 'Celebrations:Heartfelt Experiences', label: 'Celebrations:Heartfelt Experiences' }, { value: 'Product/Webseries', label: 'Product/Webseries' }, { value: 'Bhakti Drama/Skit', label: 'Bhakti Drama/Skit' },
      ];
      return (
        <ShadcnSelect value={value || ""} onValueChange={(selectedValue: string) => updateFilterRule(groupId, rule.id, { value: selectedValue })}>
          <SelectTrigger style={commonStyle}><SelectValue placeholder="Select a category" /></SelectTrigger>
          <SelectContent side="bottom" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a", maxHeight: '250px', overflowY: 'auto' }}>
            {segmentCategoryOptions.map(option => (<StyledSelectItem key={option.value} value={option.value}>{option.label}</StyledSelectItem>))}
          </SelectContent>
        </ShadcnSelect>
      );
    } 
    
    // --- MODIFIED: Removed duplicated 'if' statement ---
    if ((field as DynamicFieldKey) in DYNAMIC_FIELD_CONFIG) {
      const dynamicFieldKey = field as DynamicFieldKey;
      if (loadingFields[dynamicFieldKey]) {
        return <ShadcnSelect><SelectTrigger style={commonStyle} disabled><SelectValue placeholder="Loading..." /></SelectTrigger></ShadcnSelect>;
      }
      if (errorFields[dynamicFieldKey]) {
        return <ShadcnSelect><SelectTrigger style={{...commonStyle, color: '#f87171'}} disabled><SelectValue placeholder={errorFields[dynamicFieldKey]} /></SelectTrigger></ShadcnSelect>;
      }
      return (
        <ShadcnSelect value={value || ""} onValueChange={(selectedValue: string) => updateFilterRule(groupId, rule.id, { value: selectedValue })}>
          <SelectTrigger style={commonStyle}><SelectValue placeholder="Select an option" /></SelectTrigger>
          <SelectContent side="bottom" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a", maxHeight: '250px', overflowY: 'auto' }}>
            {(dynamicOptions[dynamicFieldKey] || []).map(option => (<StyledSelectItem key={option.value} value={option.value}>{option.label}</StyledSelectItem>))}
          </SelectContent>
        </ShadcnSelect>
        
      );


    }
    
    // 3. Fallback to a standard text input
    return (
      <ShadcnInput value={value || ""} onChange={(e) => updateFilterRule(groupId, rule.id, { value: e.target.value })} placeholder="Enter value" style={commonStyle} />
    );
  };

  // (The rest of the component's JSX remains unchanged)
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <ShadcnButton
          style={{
            display: "flex",
            gap: "0.5rem",
            height: "2rem",
            backgroundColor: "oklch(0.44 0 0 / 0.17)",
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
    className="w-64 p-3" align="start"
    style={{ width:"500px",
     maxHeight: "500px", 
     overflowY: "auto",
      backgroundColor: "#ffffff", 
        border: "1px solid #e2e8f0", 
        color: "#0f172a",
         borderRadius: "0.5rem", 
       
        }} 
         >
        <Card style={{ borderWidth: 0, boxShadow: "none", backgroundColor: "transparent", color: "#0f172a" }}>
          <CardHeader style={{ padding: "1rem", paddingBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <CardTitle style={{ fontSize: "1.125rem", color: "#0f172a" }}>Advanced Filters</CardTitle>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <StyledButton onClick={clearAllFilters} disabled={false} baseStyle={{ height: "2rem", padding: "0 0.5rem", fontSize: "0.75rem", color: "#475569", backgroundColor: "transparent", display: "flex", alignItems: "center", gap: "0.25rem", borderRadius: "0.375rem" }} hoverStyle={{ backgroundColor: "#f1f5f9", color: "#0f172a" }}>
                  <RotateCcw style={{ width: "0.75rem", height: "0.75rem" }} /> Clear All
                </StyledButton>
                <StyledButton onClick={() => setIsOpen(false)} disabled={false} baseStyle={{ height: "2rem", width: "2rem", padding: 0, color: "#64748b", backgroundColor: "transparent", borderRadius: "0.375rem" }} hoverStyle={{ backgroundColor: "#f1f5f9", color: "#0f172a" }}>
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
                    <ShadcnSelect value={group.logic} onValueChange={(value: string) => updateGroupLogic(group.id, value as "AND" | "OR")}>
                      <SelectTrigger style={{ width: "5rem", height: "2rem", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", color: "#0f172a", borderRadius: "0.375rem", fontSize: "0.875rem" }}><SelectValue /></SelectTrigger>
                      <SelectContent side="bottom" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a" }}>
                        <StyledSelectItem value="AND">AND</StyledSelectItem>
                        <StyledSelectItem value="OR">OR</StyledSelectItem>
                      </SelectContent>
                    </ShadcnSelect>
                  </div>
                )}
                <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#0f172a" }}>Filter Group {groupIndex + 1}</span>
                    {filterGroups.length > 1 && (<StyledButton onClick={() => removeFilterGroup(group.id)} disabled={false} baseStyle={{ height: "1.5rem", width: "1.5rem", padding: 0, color: "#64748b", backgroundColor: "transparent", borderRadius: "0.375rem" }} hoverStyle={{ backgroundColor: "#e2e8f0", color: "#0f172a" }}><X style={{ width: "0.875rem", height: "0.875rem" }} /></StyledButton>)}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {group.rules.map((rule, ruleIndex) => {
                      const filterConfig = filters.find((f: FilterConfig) => f.key === rule.field) as FilterConfig | undefined;
                      const operators = filterConfig ? OPERATORS[filterConfig.type as keyof typeof OPERATORS] || [] : [];
                      return (
                        <div key={rule.id} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {ruleIndex > 0 && (
                            <div style={{ display: "flex", alignItems: "center" }}>
                              <ShadcnSelect value={rule.logic || "AND"} onValueChange={(value: string) => updateFilterRule(group.id, rule.id, { logic: value as "AND" | "OR" })}>
                                <SelectTrigger style={{ width: "4rem", height: "1.5rem", fontSize: "0.75rem", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", color: "#475569", borderRadius: "0.375rem" }}><SelectValue /></SelectTrigger>
                                <SelectContent side="bottom" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a" }}>
                                  <StyledSelectItem value="AND">AND</StyledSelectItem>
                                  <StyledSelectItem value="OR">OR</StyledSelectItem>
                                </SelectContent>
                              </ShadcnSelect>
                            </div>
                          )}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: "0.5rem", alignItems: "flex-start" }}>
                            <div style={{ gridColumn: "span 3" }}>
                              <ShadcnSelect value={rule.field} onValueChange={(value: string) => updateFilterRule(group.id, rule.id, { field: value, operator: "contains", value: "" })}>
                                <SelectTrigger style={{ height: "2rem", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "0.375rem" }}><SelectValue placeholder="Field" /></SelectTrigger>
                                <SelectContent side="bottom" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a" }}>
                                  {filters.map((filter: FilterConfig) => <StyledSelectItem key={filter.key} value={filter.key}>{filter.label}</StyledSelectItem>)}
                                </SelectContent>
                              </ShadcnSelect>
                            </div>
                            <div style={{ gridColumn: "span 3" }}>
                              <ShadcnSelect value={rule.operator} onValueChange={(value: string) => updateFilterRule(group.id, rule.id, { operator: value, value: "" })}>
                                <SelectTrigger style={{ height: "2rem", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "0.375rem" }}><SelectValue placeholder="Operator" /></SelectTrigger>
                                <SelectContent side="bottom" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a" }}>
                                  {operators.map((operator: { value: string; label: string }) => <StyledSelectItem key={operator.value} value={operator.value}>{operator.label}</StyledSelectItem>)}
                                </SelectContent>
                              </ShadcnSelect>
                            </div>
                            <div style={{ gridColumn: "span 5" }}>
                              {filterConfig && renderValueInput(group.id, rule, filterConfig)}
                            </div>
                            <div style={{ gridColumn: "span 1" }}>
                              <StyledButton onClick={() => removeFilterRule(group.id, rule.id)} disabled={false} baseStyle={{ height: "2rem", width: "2rem", padding: 0, color: "#64748b", backgroundColor: "transparent" }} hoverStyle={{ backgroundColor: "#e2e8f0", color: "#0f172a" }}><X style={{ width: "0.875rem", height: "0.875rem" }} /></StyledButton>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <StyledButton onClick={() => addFilterRule(group.id)} disabled={false} baseStyle={{ width: "auto", height: "1.75rem", padding: "0 0.5rem", fontSize: "0.75rem", color: "#475569", backgroundColor: "transparent", display: "flex", alignItems: "center", gap: "0.375rem", border: "1px dashed #cbd5e1", borderRadius: "0.375rem",}} hoverStyle={{ backgroundColor: "#0f172a", color: "#ffffff", border: "1px solid #0f172a", borderRadius: "0.5rem" }}>
                    <Plus style={{ width: "0.875rem", height: "0.875rem" }} /> Add Rule
                  </StyledButton>
                </div>
              </React.Fragment>
            ))}
            <StyledButton onClick={addFilterGroup} disabled={false} baseStyle={{ width: "100%", height: "2rem", padding: "0 0.5rem", fontSize: "0.875rem", color: "#475569", backgroundColor: "transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", border: "1px dashed #cbd5e1", borderRadius: "0.375rem", }} hoverStyle={{ backgroundColor: "#0f172a", color: "#ffffff", border: "1px solid #0f172a", borderRadius: "0.5rem" }}>
              <Plus style={{ width: "1rem", height: "1rem" }} /> Add Filter Group
            </StyledButton>
            <Separator style={{ backgroundColor: "#e2e8f0", height: "1px", margin: "1rem 0" }} />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-start" }}>
              <StyledButton onClick={applyFilters} disabled={false} baseStyle={{ flex: 1, height: "2.25rem", padding: "0 1rem", fontSize: "0.875rem", color: "#ffffff", backgroundColor: "#1e293b", border: "none", borderRadius: "0.375rem", display: "inline-flex", alignItems: "center", justifyContent: "center",}} hoverStyle={{ backgroundColor: "#0f172a" }}>
                Apply Filters ({getActiveFiltersCount()})
              </StyledButton>
              {onSaveFilter && getActiveFiltersCount() > 0 && (
                <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                  <DialogTrigger asChild>
                    <StyledButton
                      onClick={() => {}} 
                      disabled={false}
                      baseStyle={{ height: "2.25rem", padding: "0 1rem", fontSize: "0.875rem", color: "#0f172a", backgroundColor: "#ffffff", border: "1px solid #000000", borderRadius: "0.375rem", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.25rem",}}
                      hoverStyle={{ backgroundColor: "#f1f5f9" }}
                    >
                      <Star style={{ width: "0.875rem", height: "0.875rem" }} /> Save
                    </StyledButton>
                  </DialogTrigger>
                  <DialogContent style={{ maxWidth: "28rem", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a", borderRadius: "0.5rem" }}>
                    <DialogHeader><DialogTitle style={{ color: "#0f172a" }}>Save Filter</DialogTitle></DialogHeader>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                     <div>
                        <Label htmlFor="filter-name" style={{ color: "#334155", marginBottom: "0.8rem", display: "block" }}>Filter Name</Label>
                        <ShadcnInput id="filter-name" placeholder="Enter filter name..." value={filterName} onChange={(e) => setFilterName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSaveFilter()} style={{ height: "2rem", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "0.375rem", width: "100%", padding: "0 0.75rem" }}/>
                     </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <StyledButton onClick={handleSaveFilter} disabled={!filterName.trim()} baseStyle={{ flex: 1, display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center", backgroundColor: "#1e293b", color: "white", borderRadius: "0.375rem", height: "2.25rem", opacity: !filterName.trim() ? 0.5 : 1,}} hoverStyle={{ backgroundColor: "#0f172a" }}><Save style={{ width: "1rem", height: "1rem" }} /> Save Filter</StyledButton>
                        <StyledButton onClick={() => setShowSaveDialog(false)} disabled={false} baseStyle={{ height: "2.25rem", padding: "0 1rem", backgroundColor: "#ffffff", border: "1px solid #000000", color: "#0f172a", borderRadius: "0.375rem",}} hoverStyle={{ backgroundColor: "#f1f5f9" }}>Cancel</StyledButton>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <StyledButton onClick={clearAllFilters} disabled={false} baseStyle={{ height: "2.25rem", padding: "0 1rem", fontSize: "0.875rem", color: "#0f172a", backgroundColor: "#ffffff", border: "1px solid #000000", borderRadius: "0.375rem", display: "inline-flex", alignItems: "center", justifyContent: "center",}} hoverStyle={{ backgroundColor: "#f1f5f9" }}>Clear</StyledButton>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
  }