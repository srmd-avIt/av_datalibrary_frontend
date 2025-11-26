/// <reference types="vite/client" />
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Search, Check, ChevronsUpDown, X } from 'lucide-react';
import { ClickUpListViewUpdated } from './ClickUpListViewUpdated';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';

// -----------------
// MultiSelect component (searchable, multi-select badges) - FIXED
// -----------------
interface Option {
  value: string;
  label: string;
}

interface MultiSelectComboboxProps {
  options: Option[];
  value: string[]; // array of selected values
  onChange: (value: string[]) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  maxVisibleBadges?: number; // how many labels to show before summarizing (default 2)
}

const MultiSelectCombobox: React.FC<MultiSelectComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  style,
  maxVisibleBadges = 2,
}) => {
  const [open, setOpen] = useState(false);

  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter(v => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const clearOne = (e: React.MouseEvent, val: string) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== val));
  };

  const clearAll = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange([]);
  };

  const selectedOptions = useMemo(
    () => options.filter(o => value.includes(o.value)),
    [options, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}
        >
        
<div
  style={{
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
    overflow: 'hidden'
  }}
>
  {selectedOptions.length === 0 ? (
    <span style={{ opacity: 0.75 }}>{placeholder}</span>
  ) : (
    <>
      {selectedOptions.length <= maxVisibleBadges
        ? selectedOptions.map(opt => (
            <span
              key={opt.value}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#111827',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: 8,
                fontSize: 12
              }}
            >
              <span
                style={{
                  maxWidth: 120,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {opt.label}
              </span>

              {/* BUTTON FIX: stop propagation on pointer/mouse down and on click */}
              <button
                type="button"
                aria-label={`Remove ${opt.label}`}
                onMouseDown={(e) => {
                  e.preventDefault();   // prevents focus jump in some cases
                  e.stopPropagation();  // stop parent handlers that run on mousedown
                }}
                onClick={(e) => {
                  e.stopPropagation();  // extra safety
                  clearOne(e, opt.value);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X style={{ width: 12, height: 12, pointerEvents: 'none' }} />
              </button>
            </span>
          ))
        : (
          <span style={{ color: '#e6eef9' }}>{`${selectedOptions.length} selected`}</span>
        )}
    </>
  )}
</div>


          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
           
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)', maxHeight: 320, overflow: 'auto' }}>
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map(opt => {
                const isSelected = value.includes(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.label} // Value used for searching
                    onSelect={() => toggle(opt.value)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${isSelected ? "opacity-100" : "opacity-0"}`}
                    />
                    <span>{opt.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// ----------------- end MultiSelect component
// -----------------

const categoryTagRenderer = (value: string | null | undefined) => {
  if (!value) return <span className="text-slate-500"></span>;

  const getColorForString = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash | 0;
    }
    const h = Math.abs(hash) % 360;
    const s = 60;
    const l = 50;

    const hslToRgb = (h: number, s: number, l: number) => {
      s /= 100;
      l /= 100;
      const k = (n: number) => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = (n: number) => {
        const color = l - a * Math.max(Math.min(k(n) - 3, 9 - k(n), 1), -1);
        return Math.round(255 * color);
      };
      return [f(0), f(8), f(4)];
    };

    const [r, g, b] = hslToRgb(h, s, l);
    const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    return hex;
  };

  const getTextColorForBg = (hex: string): string => {
    if (!hex || hex.length < 7) return "#0f172a";
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.7 ? "#f7f9fcff" : "#f1f5f9";
  };

  const values = value.split(',').map(v => v.trim()).filter(Boolean);

  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {values.map((val, index) => {
        const bgColor = getColorForString(val);
        return (
          <div
            key={index}
            className="inline-block whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold border backdrop-blur-sm"
            style={{ backgroundColor: `${bgColor}40`, borderColor: `${bgColor}66`, color: getTextColorForBg(bgColor) }}
          >
            {val}
          </div>
        );
      })}
    </div>
  );
};

const VIEW_CONFIGS: Record<string, any> = {
  medialog_satsang_category: {
    apiEndpoint: "/newmedialog/satsang-category",
    idKey: "MLUniqueID",
    detailsType: "medialog",
    columns: [
      { key: "Yr", label: "Year", sortable: true, editable: true },
      {
        key: "EventName - EventCode",
        label: "Event Name - EventCode",
        sortable: true,
        editable: true,
        render: (_v: any, row: any) => {
          const en = row.EventName || row.EventRefName || "";
          const ec = row.EventCode || row.fkEventCode || "";
          return `${en}${en && ec ? " - " : ""}${ec}`;
        },
      },
      { key: "fkDigitalRecordingCode", label: "DR Code", sortable: true, editable: true },

      { key: "ContentFrom", label: "Content From", sortable: true, editable: true },
      { key: "ContentTo", label: "Content To", sortable: true, editable: true },
      {
        key: "DetailSub",
        label: "Detail - SubDetail",
        sortable: true,
        editable: true,
        render: (_v: any, row: any) => {
          const d = row.Detail || row.DetailMain || "";
          const s = row.SubDetail || row.DetailSub || "";
          return `${d}${d && s ? " - " : ""}${s}`;
        },
      },

      { key: "Topic", label: "Topic", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Number", label: "Number", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Granths", label: "Granth", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Language", label: "Language", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "SubDuration", label: "Sub Duration", sortable: true, editable: true },
      { key: "Segment Category", label: "Segment Category", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "FootageType", label: "Footage Type", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "fkOccasion", label: "Occasion", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "NewEventCategory", label: "New Event Category", sortable: true, render: categoryTagRenderer, editable: true },

      { key: "fkCountry", label: "Country", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "fkState", label: "State", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "fkCity", label: "City", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Venue", label: "Venue", sortable: true, editable: true },

      { key: "Guidance", label: "Guidance", sortable: true, editable: true },
      { key: "Remarks", label: "Remarks", sortable: true, editable: true },
      { key: "Synopsis", label: "Synopsis", sortable: true, editable: true },
      { key: "Keywords", label: "Keywords", sortable: true, render: categoryTagRenderer, editable: true },

      { key: "SatsangStart", label: "Satsang Start Words", sortable: true, editable: true },
      { key: "SatsangEnd", label: "Satsang End Words", sortable: true, editable: true },

      { key: "AudioWAVDRCode", label: "Audio WAV Code", sortable: true, editable: true },
      { key: "AudioMP3DRCode", label: "Audio MP3 Code", sortable: true, editable: true },
      { key: "Masterquality", label: "DR Master Quality", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "DistributionDriveLink", label: "DR Distribution Link", sortable: true, editable: true },
    ],
  },
};

const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL) || "";

export function SatsangDashboard({ onShowDetails }: { onShowDetails?: (item: { type: string; data: any; title: string }) => void }) {
  const [searchFilters, setSearchFilters] = useState<Record<string, any>>({});
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any> | undefined>(undefined);

  const [countryOptions, setCountryOptions] = useState<Option[]>([]);
  const [stateOptions, setStateOptions] = useState<Option[]>([]);
  const [cityOptions, setCityOptions] = useState<Option[]>([]);
  const [eventCategoryOptions, setEventCategoryOptions] = useState<Option[]>([]);
  const [numberOptions, setNumberOptions] = useState<Option[]>([]);

  useEffect(() => {
    const fetchOptions = async (endpoint: string, dataKey: string, setter: React.Dispatch<React.SetStateAction<Option[]>>) => {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) throw new Error(`Failed to fetch ${dataKey}`);
        const data = await response.json();
        const allValues = (data || []).map((item: any) => item[dataKey]);
        const normalized: string[] = allValues
          .flatMap((v: any) => {
            if (v === null || v === undefined) return [];
            if (typeof v === "string" && v.includes(",")) {
              return v.split(",").map((s: string) => s.trim()).filter(Boolean);
            }
            return [v];
          })
          .map((v: any) => String(v).trim())
          .filter(Boolean);

        const uniqueValues = Array.from(new Set(normalized)).sort((a, b) => a.localeCompare(b));
        setter(uniqueValues.map((val) => ({ value: val, label: val })));
      } catch (error) {
        console.error(error);
      }
    };

    fetchOptions('/countries/options', 'fkCountry', setCountryOptions);
    fetchOptions('/states/options', 'fkState', setStateOptions);
    fetchOptions('/cities/options', 'fkCity', setCityOptions);
    fetchOptions('/new-event-category/options', 'NewEventCategory', setEventCategoryOptions);
    fetchOptions('/number/options', 'Number', setNumberOptions);
  }, []);

  const handleInputChange = (field: string, value: string | string[]) => {
    setSearchFilters(prev => ({ ...prev, [field]: value }));
  };

 // ...existing code...
// ...existing code...
const handleSearch = () => {
  const activeFilters = Object.entries(searchFilters).reduce((acc, [key, value]) => {
    // Check if value exists. 
    // If it's an array, ensure it has items. If it's a string, ensure it's not empty.
    if (value && (Array.isArray(value) ? value.length > 0 : true)) {
      
      // ✅ FIX: Do NOT join arrays with commas. Pass the raw array.
      // This allows the API/Backend to treat it as multiple values (OR logic) 
      // instead of one long string.
      acc[key] = value; 
    }
    return acc;
  }, {} as Record<string, any>);

  setAppliedFilters(activeFilters);
};
// ...existing code...
// ...existing code...
 
  const handleClear = () => {
    setSearchFilters({});
    setAppliedFilters(undefined);
  };

  const handleRowSelect = (item: Record<string, any>) => {
    if (onShowDetails) {
      onShowDetails({
        type: 'medialog',
        data: item,
        title: 'Media Log Details'
      });
    }
  };

  const satsangCategoryConfig = VIEW_CONFIGS['medialog_satsang_category'];

  return (
    <div className="p-4 space-y-6">
      <Card style={{ padding: "24px", border: "1px solid #474849ff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <CardHeader style={{ paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
          <CardTitle style={{ fontSize: "20px", fontWeight: 600, color: "#f0f3f8ff" }}>
            Satsang Search
          </CardTitle>
        </CardHeader>

        <CardContent style={{ paddingTop: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>

            <div>
              <Label htmlFor="NewEventCategory" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>
                New Event Category
              </Label>
              <MultiSelectCombobox
                options={eventCategoryOptions}
                value={searchFilters.NewEventCategory || []}
                onChange={value => handleInputChange('NewEventCategory', value)}
                placeholder="Select event categories..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px", height: 'auto' }}
              />
            </div>

            <div>
              <Label htmlFor="fkCity" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>
                City
              </Label>
              <MultiSelectCombobox
                options={cityOptions}
                value={searchFilters.fkCity || []}
                onChange={value => handleInputChange('fkCity', value)}
                placeholder="Select cities..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px", height: 'auto' }}
              />
            </div>

            <div>
              <Label htmlFor="Topic" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>
                Topic
              </Label>
              <Input
                id="Topic"
                placeholder="e.g., Bhakti"
                value={searchFilters.Topic || ''}
                onChange={e => handleInputChange('Topic', e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px" }}
              />
            </div>

            <div>
              <Label htmlFor="Number" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>
                Number
              </Label>
              <MultiSelectCombobox
                options={numberOptions}
                value={searchFilters.Number || []}
                onChange={value => handleInputChange('Number', value)}
                placeholder="Select numbers..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px", height: 'auto' }}
              />
            </div>

            <div>
              <Label htmlFor="fkCountry" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>
                Country
              </Label>
              <MultiSelectCombobox
                options={countryOptions}
                value={searchFilters.fkCountry || []}
                onChange={value => handleInputChange('fkCountry', value)}
                placeholder="Select countries..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px", height: 'auto' }}
              />
            </div>

            <div>
              <Label htmlFor="fkState" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>
                State
              </Label>
              <MultiSelectCombobox
                options={stateOptions}
                value={searchFilters.fkState || []}
                onChange={value => handleInputChange('fkState', value)}
                placeholder="Select states..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px", height: 'auto' }}
              />
            </div>

            <div>
              <Label htmlFor="ContentFrom" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>
                Content From
              </Label>
              <Input
                id="ContentFrom"
                placeholder="e.g., dd.mm.yyyy"
                value={searchFilters.ContentFrom || ''}
                onChange={e => handleInputChange('ContentFrom', e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px" }}
              />
            </div>

            <div>
              <Label htmlFor="ContentTo" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>
                Content To
              </Label>
              <Input
                id="ContentTo"
                placeholder="e.g., dd.mm.yyyy"
                value={searchFilters.ContentTo || ''}
                onChange={e => handleInputChange('ContentTo', e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px" }}
              />
            </div>

            <div>
              <Label htmlFor="MLUniqueID" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>
                EventRef MLUniqueID
              </Label>
              <Input
                id="EventRefMLID"
                placeholder="e.g., E00001_001.1"
                value={searchFilters.EventRefMLID || ''}
                onChange={e => handleInputChange('EventRefMLID', e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px" }}
              />
            </div>

            <div>
              <Label htmlFor="EventCCode" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>
                Event Code
              </Label>
              <Input
                id="EventCode"
                placeholder="e.g., E00001"
                value={searchFilters.EventCode || ''}
                onChange={e => handleInputChange('EventCode', e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px" }}
              />
            </div>

          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px", marginTop: "28px" }}>
            <Button
              variant="outline"
              onClick={handleClear}
              style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #1b1b1bff", backgroundColor: "#19191aff", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}
            >
              Clear Search
            </Button>
            <Button
              size="lg"
              onClick={handleSearch}
              style={{ padding: "10px 24px", borderRadius: "8px", backgroundColor: "#161616ff", color: "#fff", fontWeight: 600, fontSize: "15px", cursor: "pointer" }}
            >
              <Search style={{ marginRight: "8px", width: "18px", height: "18px" }} />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {appliedFilters && (
        <div className="mt-6">
          {satsangCategoryConfig ? (
            <ClickUpListViewUpdated
              title="Search Results"
              columns={satsangCategoryConfig.columns}
              apiEndpoint={satsangCategoryConfig.apiEndpoint}
              viewId={satsangCategoryConfig.idKey || 'medialog_satsang_category'}
              idKey={satsangCategoryConfig.idKey}
              initialFilters={appliedFilters}
              onViewChange={() => setAppliedFilters(undefined)}
              onRowSelect={handleRowSelect}
            />
          ) : (
            <Card>
              <CardHeader><CardTitle>Error</CardTitle></CardHeader>
              <CardContent>
                <p className="text-red-500">Satsang Category view configuration not found.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}