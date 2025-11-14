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
import { Filter, Plus, X, RotateCcw, Save, Star, Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
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

// --- NEW: MultiSelect Component for AuxFileType ---
interface MultiSelectProps {
  options: { value: string; label: string }[];
  value: string; // Expects a comma-separated string
  onChange: (value: string) => void; // Returns a comma-separated string
  placeholder?: string;
  style?: React.CSSProperties;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, value, onChange, placeholder = "Select...", style }) => {
  const [open, setOpen] = useState(false);
  const selectedValues = useMemo(() => new Set(value ? value.split(',') : []), [value]);

  const handleSelect = (currentValue: string) => {
    const newSelectedValues = new Set(selectedValues);
    if (newSelectedValues.has(currentValue)) {
      newSelectedValues.delete(currentValue);
    } else {
      newSelectedValues.add(currentValue);
    }
    onChange(Array.from(newSelectedValues).join(','));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ShadcnButton
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          style={style}
        >
          <span className="truncate">
            {selectedValues.size > 0
              ? `${selectedValues.size} selected`
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </ShadcnButton>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${selectedValues.has(option.value) ? "opacity-100" : "opacity-0"}`}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
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
  'NewEventCategory': { endpoint: '/new-event-category/options', dataKey: 'NewEventCategory' },
  'Audio': { endpoint: '/audio/options', dataKey: 'AudioList' },
  'BhajanType': { endpoint: '/bhajan-type/options', dataKey: 'BhajanType' },
  'EditingType': { endpoint: '/editing-type/options', dataKey: 'EditingType' },
  'fkCountry': { endpoint: '/countries/options', dataKey: 'fkCountry' },
  'fkState': { endpoint: '/states/options', dataKey: 'fkState' },
  'fkCity': { endpoint: '/cities/options', dataKey: 'fkCity' },
  'fkDigitalMasterCategory': { endpoint: '/digital-master-category/options', dataKey: 'fkDigitalMasterCategory' },
  'fkGranth': { endpoint: '/granths/options', dataKey: 'fkGranth' },
  'Language': { endpoint: '/language/options', dataKey: 'Language' },
  'fkDistributionLabel': { endpoint: '/distribution-label/options', dataKey: 'fkDistributionLabel' },
  'fkEventCategory': { endpoint: '/event-category/options', dataKey: 'fkEventCategory' },
  
  'FootageType': { endpoint: '/footage-type/options', dataKey: 'FootageType' },
  'fkOccasion': { endpoint: '/occasion/options', dataKey: 'fkOccasion' },
  'TopicSource': { endpoint: '/topic-source/options', dataKey: 'TopicSource' },
  'NumberSource': { endpoint: '/number-source/options', dataKey: 'NumberSource' },
  'fkMediaName': { endpoint: '/format-type/options', dataKey: 'fkMediaName' },
  'EditingStatus': { endpoint: '/editing-status/options', dataKey: 'EditingStatus' },
  'Masterquality': { endpoint: '/master-quality/options', dataKey: 'Masterquality' },
  'fkOrganization': { endpoint: '/organizations/options', dataKey: 'fkOrganization' },
  'TimeOfDay': { endpoint: '/time-of-day/options', dataKey: 'TimeOfDay' },
  'AuxFileType': { endpoint: '/aux-file-type/options', dataKey: 'AuxFileType' },
  'Keywords': { endpoint: '/keywords/options', dataKey: 'Keywords' },
  'Dimension': { endpoint: '/dimension/options', dataKey: 'Dimension' },
  'ProductionBucket': { endpoint: '/production-bucket/options', dataKey: 'ProductionBucket' },
  'PreservationStatus': { endpoint: '/preservation-status/options', dataKey: 'PreservationStatus' },
  'Teams': { endpoint: '/teams/options', dataKey: 'Teams' },
  'TopicGivenBy': { endpoint: '/topic-given-by/options', dataKey: 'TopicGivenBy' },
  'Segment Category': { endpoint: '/segment-category/options', dataKey: 'Segment Category' },
  'IsAudioRecorded': { endpoint: '/is-audio-recorded/options', dataKey: 'IsAudioRecorded' },


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

  // --- Mobile detection ---
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        
        // MODIFICATION: Split comma-separated values for all fields
        const allValues = jsonData.flatMap((item: any) => {
          const itemValue = item[config.dataKey];
          if (typeof itemValue === 'string' && itemValue.includes(',')) {
            return itemValue.split(',').map((v: string) => v.trim()).filter(Boolean);
          }
          return itemValue;
        });

        const uniqueValues = [...new Set(allValues)].filter(Boolean).sort();

        const formattedOptions = (uniqueValues as string[]).map((val) => ({
          value: val,
          label: val,
        }));

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
    // Normalize operator-only updates so is_empty / is_not_empty carry a sentinel value.
    // This is needed because the UI hides the value input for those operators.
    const normalized = { ...updates } as Partial<FilterRule>;
    if (updates.operator) {
      if (updates.operator === "is_empty") {
        // use __EMPTY__ sentinel (matches existing codebase convention)
        normalized.value = "__EMPTY__";
      } else if (updates.operator === "is_not_empty") {
        normalized.value = "__NOT_EMPTY__";
      } else {
        // clear value when operator changes to one that expects a value, unless a value was explicitly provided
        if (!("value" in normalized)) normalized.value = "";
      }
    }

    setFilterGroups((groups) =>
      groups.map((group) =>
        group.id === groupId
          ? { ...group, rules: group.rules.map((rule) => (rule.id === ruleId ? { ...rule, ...normalized } : rule)) }
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
  const clearAllFilters = () => {
    setFilterGroups([{ id: "group1", rules: [], logic: "AND" }]);
    onFiltersChange([{ id: "group1", rules: [], logic: "AND" }]); // <-- This line ensures data is reset
  };
  
  // Define which fields are multi-select
  const multiSelectFields = ['NewEventCategory',
  'Audio',
  'BhajanType',
  'EditingType',
  'fkCountry',
  'fkState',
  'fkCity',
  'fkDigitalMasterCategory',
  'fkGranth',
  'Language',
  'fkDistributionLabel',
  'fkEventCategory',
  'FootageType',
  'fkOccasion',
  'TopicSource',
  'NumberSource',
  'fkMediaName',
  'EditingStatus',
  'Masterquality',
  'fkOrganization',
  'TimeOfDay',
  'AuxFileType',
  'Keywords',
  'Dimension',
  'ProductionBucket',
  'PreservationStatus',
  'Teams',
  'TopicGivenBy',
  'Segment Category'
];
  
  // ========================================================================
  // === START: CORRECTED applyFilters FUNCTION ===
  // ========================================================================
  const applyFilters = () => {
    const finalFilterGroups: FilterGroup[] = [];
    let groupCounter = 0; // To generate unique group IDs

    filterGroups.forEach((group, groupIndex) => {
      let currentStandardRules: FilterRule[] = [];
      let isFirstChunkInGroup = true;

      // Helper function to push the buffered standard rules as a new group
      const flushStandardRules = () => {
        if (currentStandardRules.length > 0) {
          // Determine the logic for this chunk.
          // - If it's the first chunk of the first UI group, it's 'AND'.
          // - If it's the first chunk of a subsequent UI group, it's that group's inter-group logic.
          // - If it's not the first chunk, its logic is determined by the first rule it contains.
          const chunkLogic = isFirstChunkInGroup
            ? (groupIndex === 0 ? 'AND' : group.logic)
            : (currentStandardRules[0].logic || 'AND');

          finalFilterGroups.push({
            id: `group_std_${group.id}_${groupCounter++}`,
            logic: chunkLogic,
            rules: currentStandardRules,
          });

          currentStandardRules = []; // Reset the buffer
          isFirstChunkInGroup = false;
        }
      };

      // Process rules sequentially to maintain logical order
      group.rules.forEach(rule => {
        if (multiSelectFields.includes(rule.field) && rule.value) {
          // 1. A multi-select rule is found. First, flush any standard rules before it.
          flushStandardRules();

          // 2. Now, create and push a dedicated group for this multi-select rule.
          const values = rule.value.split(',').map((v: string) => v.trim()).filter(Boolean);
          if (values.length > 0) {
            // Determine the logic for this new multi-select group.
            // It's connected by the UI group's logic if it's the first element,
            // otherwise, it's connected by its own rule's logic.
            const chunkLogic = isFirstChunkInGroup
              ? (groupIndex === 0 ? 'AND' : group.logic)
              : (rule.logic || 'AND');
            
            finalFilterGroups.push({
              id: `group_multi_${rule.id}`,
              logic: chunkLogic,
              rules: values.map((val: string, index: number) => ({
                id: `rule_multi_${rule.id}_${index}`,
                field: rule.field,
                operator: rule.operator || 'contains',
                value: val,
                // Logic *inside* a multi-select group is always OR.
                // By convention, the first rule is 'AND' and subsequent are 'OR'.
                logic: index === 0 ? 'AND' : 'OR',
              }))
            });
            isFirstChunkInGroup = false;
          }
        } else {
          // 3. It's a standard rule. Add it to the current buffer.
          currentStandardRules.push(rule);
        }
      });

      // 4. After the loop, flush any remaining standard rules at the end of the group.
      flushStandardRules();
    });
    
    // Filter out any empty groups that might have been created
    const nonEmptyGroups = finalFilterGroups.filter(g => g.rules && g.rules.length > 0);

    onFiltersChange(nonEmptyGroups);
    setIsOpen(false);
  };
  // ========================================================================
  // === END: CORRECTED applyFilters FUNCTION ===
  // ========================================================================


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
      height: isMobile ? "1.75rem" : "2rem",
      backgroundColor: "#ffffff",
      border: "1px solid #cbd5e1",
      color: "#0f172a",
      borderRadius: "0.375rem",
      fontSize: isMobile ? "0.75rem" : "0.875rem",
    };

    // --- Make all dropdowns multi-select ---
    if (multiSelectFields.includes(field)) {
      const dynamicFieldKey = field as DynamicFieldKey;
      if (loadingFields[dynamicFieldKey]) {
        return <ShadcnSelect><SelectTrigger style={commonStyle} disabled><SelectValue placeholder="Loading..." /></SelectTrigger></ShadcnSelect>;
      }
      if (errorFields[dynamicFieldKey]) {
        return <ShadcnSelect><SelectTrigger style={{...commonStyle, color: '#f87171'}} disabled><SelectValue placeholder={errorFields[dynamicFieldKey]} /></SelectTrigger></ShadcnSelect>;
      }
      return (
        <MultiSelect
          options={dynamicOptions[dynamicFieldKey] || []}
          value={value || ""}
          onChange={(selectedValue: string) => updateFilterRule(groupId, rule.id, { value: selectedValue, operator: rule.operator || 'contains' })}
          placeholder={`Select ${filterConfig.label.toLowerCase()}...`}
          style={commonStyle}
        />
      );
    }

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
    
    // --- MODIFICATION: Handle multi-select fields ---
    if (['AuxFileType', 'Keywords'].includes(field)) {
      const dynamicFieldKey = field as DynamicFieldKey;
      if (loadingFields[dynamicFieldKey]) {
        return <ShadcnSelect><SelectTrigger style={commonStyle} disabled><SelectValue placeholder="Loading..." /></SelectTrigger></ShadcnSelect>;
      }
      if (errorFields[dynamicFieldKey]) {
        return <ShadcnSelect><SelectTrigger style={{...commonStyle, color: '#f87171'}} disabled><SelectValue placeholder={errorFields[dynamicFieldKey]} /></SelectTrigger></ShadcnSelect>;
      }
      return (
        <MultiSelect
          options={dynamicOptions[dynamicFieldKey] || []}
          value={value || ""}
          onChange={(selectedValue: string) => updateFilterRule(groupId, rule.id, { value: selectedValue, operator: 'contains' })}
          placeholder={`Select ${field === 'Keywords' ? 'keywords' : 'file types'}...`}
          style={commonStyle}
        />
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
    className={isMobile ? "w-screen p-1" : "w-64 p-3"} 
    align={isMobile ? "center" : "start"}
    style={isMobile ? {
      width: "calc(100vw - 24px)",
      maxWidth: "400px",
      maxHeight: "70vh", 
      overflowY: "auto",
      backgroundColor: "#ffffff", 
      border: "1px solid #e2e8f0", 
      color: "#0f172a",
      borderRadius: "0.375rem",
      fontSize: "0.875rem",
      margin: "0 auto"
    } : {
      width: "500px",
      maxHeight: "500px", 
      overflowY: "auto",
      backgroundColor: "#ffffff", 
      border: "1px solid #e2e8f0", 
      color: "#0f172a",
      borderRadius: "0.5rem"
    }} 
         >
        <Card style={{ borderWidth: 0, boxShadow: "none", backgroundColor: "transparent", color: "#0f172a" }}>
          <CardHeader style={{ padding: isMobile ? "0.5rem" : "1rem", paddingBottom: isMobile ? "0.5rem" : "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: isMobile ? "wrap" : "nowrap", gap: isMobile ? "0.25rem" : "0" }}>
              <CardTitle style={{ fontSize: isMobile ? "0.875rem" : "1.125rem", color: "#0f172a", fontWeight: "600" }}>Advanced Filters</CardTitle>
              <div style={{ display: "flex", gap: "0.25rem" }}>
                <StyledButton onClick={clearAllFilters} disabled={false} baseStyle={{ height: isMobile ? "1.5rem" : "2rem", padding: isMobile ? "0 0.25rem" : "0 0.5rem", fontSize: isMobile ? "0.625rem" : "0.75rem", color: "#475569", backgroundColor: "transparent", display: "flex", alignItems: "center", gap: "0.125rem", borderRadius: "0.25rem" }} hoverStyle={{ backgroundColor: "#f1f5f9", color: "#0f172a" }}>
                  <RotateCcw style={{ width: isMobile ? "0.625rem" : "0.75rem", height: isMobile ? "0.625rem" : "0.75rem" }} /> {isMobile ? "Clear" : "Clear All"}
                </StyledButton>
                <StyledButton onClick={() => setIsOpen(false)} disabled={false} baseStyle={{ height: isMobile ? "1.5rem" : "2rem", width: isMobile ? "1.5rem" : "2rem", padding: 0, color: "#64748b", backgroundColor: "transparent", borderRadius: "0.25rem" }} hoverStyle={{ backgroundColor: "#f1f5f9", color: "#0f172a" }}>
                  <X style={{ width: isMobile ? "0.75rem" : "1rem", height: isMobile ? "0.75rem" : "1rem" }} />
                </StyledButton>
              </div>
            </div>
          </CardHeader>
          <CardContent style={{ display: "flex", flexDirection: "column", gap: isMobile ? "0.5rem" : "1rem", padding: isMobile ? "0 0.5rem 0.5rem 0.5rem" : "0 1rem 1rem 1rem" }}>
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
                <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: isMobile ? "0.5rem" : "0.75rem", padding: isMobile ? "0.5rem" : "1rem", display: "flex", flexDirection: "column", gap: isMobile ? "0.5rem" : "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: isMobile ? "0.75rem" : "0.875rem", fontWeight: 500, color: "#0f172a" }}>Filter Group {groupIndex + 1}</span>
                    {filterGroups.length > 1 && (<StyledButton onClick={() => removeFilterGroup(group.id)} disabled={false} baseStyle={{ height: isMobile ? "1.25rem" : "1.5rem", width: isMobile ? "1.25rem" : "1.5rem", padding: 0, color: "#64748b", backgroundColor: "transparent", borderRadius: "0.25rem" }} hoverStyle={{ backgroundColor: "#e2e8f0", color: "#0f172a" }}><X style={{ width: isMobile ? "0.75rem" : "0.875rem", height: isMobile ? "0.75rem" : "0.875rem" }} /></StyledButton>)}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "0.5rem" : "0.75rem" }}>
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
                          {isMobile ? (
                            // Mobile: Stack elements vertically with compact styling
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              <div style={{ display: "flex", gap: "0.25rem" }}>
                                <div style={{ flex: 1 }}>
                                  <ShadcnSelect value={rule.field} onValueChange={(value: string) => updateFilterRule(group.id, rule.id, { field: value, operator: "contains", value: "" })}>
                                    <SelectTrigger style={{ height: "1.75rem", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "0.25rem", fontSize: "0.75rem", padding: "0 0.5rem" }}><SelectValue placeholder="Field" /></SelectTrigger>
                                    <SelectContent side="bottom" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a" }}>
                                      {filters.map((filter: FilterConfig) => <StyledSelectItem key={filter.key} value={filter.key}>{filter.label}</StyledSelectItem>)}
                                    </SelectContent>
                                  </ShadcnSelect>
                                </div>
                                <StyledButton onClick={() => removeFilterRule(group.id, rule.id)} disabled={false} baseStyle={{ height: "1.75rem", width: "1.75rem", padding: 0, color: "#64748b", backgroundColor: "transparent", flexShrink: 0, borderRadius: "0.25rem" }} hoverStyle={{ backgroundColor: "#e2e8f0", color: "#0f172a" }}><X style={{ width: "0.75rem", height: "0.75rem" }} /></StyledButton>
                              </div>
                              <div>
                                <ShadcnSelect value={rule.operator} onValueChange={(value: string) => updateFilterRule(group.id, rule.id, { operator: value, value: "" })}>
                                  <SelectTrigger style={{ height: "1.75rem", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "0.25rem", fontSize: "0.75rem", padding: "0 0.5rem" }}><SelectValue placeholder="Operator" /></SelectTrigger>
                                  <SelectContent side="bottom" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a" }}>
                                    {operators.map((operator: { value: string; label: string }) => <StyledSelectItem key={operator.value} value={operator.value}>{operator.label}</StyledSelectItem>)}
                                  </SelectContent>
                                </ShadcnSelect>
                              </div>
                              <div>
                                {filterConfig && renderValueInput(group.id, rule, filterConfig)}
                              </div>
                            </div>
                          ) : (
                            // Desktop: Keep original grid layout
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
                          )}
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
            <Separator style={{ backgroundColor: "#e2e8f0", height: "1px", margin: isMobile ? "0.75rem 0" : "1rem 0" }} />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-start", flexDirection: isMobile ? "column" : "row" }}>
              <StyledButton onClick={applyFilters} disabled={false} baseStyle={{ flex: 1, height: isMobile ? "2.5rem" : "2.25rem", padding: isMobile ? "0 0.75rem" : "0 1rem", fontSize: isMobile ? "1rem" : "0.875rem", color: "#ffffff", backgroundColor: "#1e293b", border: "none", borderRadius: "0.375rem", display: "inline-flex", alignItems: "center", justifyContent: "center",}} hoverStyle={{ backgroundColor: "#0f172a" }}>
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