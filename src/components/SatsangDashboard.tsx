import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Search, Check, ChevronsUpDown } from 'lucide-react';
import { ClickUpListViewUpdated } from './ClickUpListViewUpdated';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';

// --- Reusable Searchable Dropdown (Combobox) Component ---
interface ComboboxProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  style?: React.CSSProperties;
}

const Combobox: React.FC<ComboboxProps> = ({ options, value, onChange, placeholder, style }) => {
  const [open, setOpen] = useState(false);
  const currentLabel = useMemo(() => options.find(option => option.value === value)?.label, [options, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between" style={style}>
          <span className="truncate">{currentLabel || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map(option => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value === value ? '' : option.value);
                    setOpen(false);
                  }}
                >
                  <Check className={`mr-2 h-4 w-4 ${value === option.value ? 'opacity-100' : 'opacity-0'}`} />
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


// Provide a minimal local fallback for VIEW_CONFIGS to avoid a missing-module compile error.
// Replace or remove this fallback once a proper ../view-configs module exists.

const categoryTagRenderer = (value: string | null | undefined) => {
    if (!value) return <span className="text-slate-500"></span>;

    // deterministic color generator from a string -> hex color
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

      // Content timing + details
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

      // Topic / Number / Granth / language / durations / categories
      { key: "Topic", label: "Topic", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Number", label: "Number", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Granths", label: "Granth", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Language", label: "Language", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "SubDuration", label: "Sub Duration", sortable: true, editable: true },
      { key: "Segment Category", label: "Segment Category", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "FootageType", label: "Footage Type", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "fkOccasion", label: "Occasion", sortable: true, render: categoryTagRenderer, editable: true },

    

      // Location fields (4)
      { key: "fkCountry", label: "Country", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "fkState", label: "State", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "fkCity", label: "City", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Venue", label: "Venue", sortable: true, editable: true },

      // Additional textual/meta fields
      { key: "Guidance", label: "Guidance", sortable: true, editable: true },
      { key: "Remarks", label: "Remarks", sortable: true, editable: true },
      { key: "Synopsis", label: "Synopsis", sortable: true, editable: true },
      { key: "Keywords", label: "Keywords", sortable: true, render: categoryTagRenderer, editable: true },

      // Satsang specific start/end words (use your actual field names if different)
      { key: "SatsangStart", label: "Satsang Start Words", sortable: true, editable: true },
      { key: "SatsangEnd", label: "Satsang End Words", sortable: true, editable: true },

      // Audio codes / master quality / distribution
      { key: "AudioWAVDRCode", label: "Audio WAV Code", sortable: true, editable: true },
      { key: "AudioMP3DRCode", label: "Audio MP3 Code", sortable: true, editable: true },
      { key: "Masterquality", label: "DR Master Quality", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "DistributionDriveLink", label: "DR Distribution Link", sortable: true, editable: true },

      ],
  },
};

const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL) || "";

// --- MODIFIED: Add onShowDetails to props ---
export function SatsangDashboard({ onShowDetails }: { onShowDetails?: (item: { type: string; data: any; title: string }) => void }) {
  const [searchFilters, setSearchFilters] = useState<Record<string, any>>({});
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any> | undefined>(undefined);
  
  // --- REMOVED: Local state for sidebar is no longer needed ---
  // const [selectedItem, setSelectedItem] = useState<Record<string, any> | null>(null);

  // --- State for dropdown options ---
  const [countryOptions, setCountryOptions] = useState<{ value: string; label: string }[]>([]);
  const [stateOptions, setStateOptions] = useState<{ value: string; label: string }[]>([]);
  const [cityOptions, setCityOptions] = useState<{ value: string; label: string }[]>([]);
  // --- NEW: State for Event Category options ---
  const [eventCategoryOptions, setEventCategoryOptions] = useState<{ value: string; label: string }[]>([]);
  // --- NEW: State for Number dropdown options ---
  const [numberOptions, setNumberOptions] = useState<{ value: string; label: string }[]>([]);

  // --- NEW: Fetch options for dropdowns on component mount ---
  useEffect(() => {
    const fetchOptions = async (endpoint: string, dataKey: string, setter: React.Dispatch<React.SetStateAction<{ value: string; label: string }[]>>) => {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) throw new Error(`Failed to fetch ${dataKey}`);
        const data = await response.json();

        // Normalize values to strings, split comma-separated entries, remove falsy values,
        // dedupe using Set and sort — this ensures TypeScript infers string[].
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
    // --- NEW: Fetch Event Category options ---
    fetchOptions('/event-category/options', 'fkEventCategory', setEventCategoryOptions);
    fetchOptions('/number/options', 'Number', setNumberOptions); // Number dropdown options
  }, []); // Pre-fetch Number options if needed
  


  const handleInputChange = (field: string, value: string) => {
    setSearchFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    const activeFilters = Object.entries(searchFilters).reduce((acc, [key, value]) => {
      if (value) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    setAppliedFilters(activeFilters);
  };

  const handleClear = () => {
    setSearchFilters({});
    setAppliedFilters(undefined);
  };

  // --- MODIFIED: Row selection now calls the onShowDetails prop ---
  const handleRowSelect = (item: Record<string, any>) => {
    if (onShowDetails) {
      onShowDetails({
        type: 'medialog', // The type expected by DetailsSidebar
        data: item,
        title: 'Media Log Details'
      });
    }
  };

  const satsangCategoryConfig = VIEW_CONFIGS['medialog_satsang_category'];

  return (
    <div className="p-4 space-y-6">
      {/* Top Search Panel */}
<Card style={{ padding: "24px", border: "1px solid #474849ff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
  <CardHeader style={{ paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
    <CardTitle style={{ fontSize: "20px", fontWeight: 600, color: "#f0f3f8ff" }}>
      Satsang Search
    </CardTitle>
  </CardHeader>

  <CardContent style={{ paddingTop: "24px" }}>
    {/* Input Grid */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "20px",
      }}
    >
      {/* --- NEW: Event Category Combobox --- */}
      <div>
        <Label htmlFor="fkEventCategory" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>
          Event Category
        </Label>
        <Combobox
          options={eventCategoryOptions}
          value={searchFilters.fkEventCategory || ''}
          onChange={value => handleInputChange('fkEventCategory', value)}
          placeholder="Select an event category..."
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #474849ff",
            fontSize: "14px",
            height: 'auto',
          }}
        />
      </div>

      {/* --- MODIFIED: City is now a Combobox --- */}
      <div>
        <Label htmlFor="fkCity" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>
          City
        </Label>
        <Combobox
          options={cityOptions}
          value={searchFilters.fkCity || ''}
          onChange={value => handleInputChange('fkCity', value)}
          placeholder="Select a city..."
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #474849ff",
            fontSize: "14px",
            height: 'auto',
          }}
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
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #474849ff",
            fontSize: "14px",
          }}
        />
      </div>

      <div>
        <Label htmlFor="Number" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>
          Number
        </Label>
        <Combobox
         options={numberOptions}
          value={searchFilters.Number || ''}
          onChange={value => handleInputChange('Number', value)}
          placeholder="Select or type a number..."
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #474849ff",
            fontSize: "14px",
            height: 'auto',
          }}
        />
      </div>

      {/* --- MODIFIED: Country is now a Combobox --- */}
      <div>
        <Label htmlFor="fkCountry" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>
          Country
        </Label>
        <Combobox
          options={countryOptions}
          value={searchFilters.fkCountry || ''}
          onChange={value => handleInputChange('fkCountry', value)}
          placeholder="Select a country..."
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #474849ff",
            fontSize: "14px",
            height: 'auto',
          }}
        />
      </div>

      {/* --- MODIFIED: State is now a Combobox --- */}
      <div>
        <Label htmlFor="fkState" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>
          State
        </Label>
        <Combobox
          options={stateOptions}
          value={searchFilters.fkState || ''}
          onChange={value => handleInputChange('fkState', value)}
          placeholder="Select a state..."
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #474849ff",
            fontSize: "14px",
            height: 'auto',
          }}
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
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #474849ff",
            fontSize: "14px",
          }}
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
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #474849ff",
            fontSize: "14px",
          }}
        />
      </div>

<div>
  <Label htmlFor="MLUniqueID" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>
    EventRef MLUniqueID
  </Label>
  <Input
    id="EventRefMLID"
    placeholder="e.g., ML-12345"
    value={searchFilters.EventRefMLID || ''}
    onChange={e => handleInputChange('EventRefMLID', e.target.value)}
    style={{
      width: "100%",
      padding: "10px 12px",
      borderRadius: "8px",
      border: "1px solid #474849ff",
      fontSize: "14px",
    }}
  />
</div>

<div>
  <Label htmlFor="EventCCode" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>
    Event Code
  </Label>
  <Input
    id="EventCode"
    placeholder="e.g., EC-123"
    value={searchFilters.EventCode || ''}
    onChange={e => handleInputChange('EventCode', e.target.value)} // <-- fixed key here
    style={{
      width: "100%",
      padding: "10px 12px",
      borderRadius: "8px",
      border: "1px solid #474849ff",
      fontSize: "14px",
    }}
  />
</div>

      
    </div>

    {/* Buttons */}
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "10px",
        marginTop: "28px",
      }}
    >
      <Button
        variant="outline"
        onClick={handleClear}
        style={{
          padding: "10px 20px",
          borderRadius: "8px",
          border: "1px solid #1b1b1bff",
          backgroundColor: "#19191aff",
          fontSize: "14px",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Clear Search
      </Button>
      <Button
        size="lg"
        onClick={handleSearch}
        style={{
          padding: "10px 24px",
          borderRadius: "8px",
          backgroundColor: "#161616ff",
          color: "#fff",
          fontWeight: 600,
          fontSize: "15px",
          cursor: "pointer",
        }}
      >
        <Search style={{ marginRight: "8px", width: "18px", height: "18px" }} />
        Search
      </Button>
    </div>
  </CardContent>
</Card>


      {/* Results View (appears after search) */}
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
              onRowSelect={handleRowSelect} // Pass the updated handler
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

      {/* --- REMOVED: The local sidebar rendering is no longer needed here --- */}
    </div>
  );
}