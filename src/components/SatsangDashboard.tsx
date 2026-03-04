/// <reference types="vite/client" />
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Search, Check, ChevronsUpDown, X, ArrowLeft, ChevronDown, ChevronRight, MapPin, Calendar, LayoutList, Hash } from 'lucide-react';
import { ClickUpListViewUpdated } from './ClickUpListViewUpdated';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';

// -----------------
// MultiSelect component (searchable, multi-select badges)
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
  maxVisibleBadges?: number; 
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
  const [searchInput, setSearchInput] = useState('');
  
  const isMobileSize = typeof window !== 'undefined' && window.innerWidth <= 768;

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
          className="w-full"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '8px', 
            minHeight: '40px',
            height: 'auto',
            padding: '6px 10px', 
            fontSize: isMobileSize ? '14px' : 'inherit',
            fontWeight: 'normal',
            textAlign: 'left',
            ...style 
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '4px', 
              alignItems: 'center',
              flexWrap: 'wrap',
              flex: 1,
              minWidth: 0, 
              paddingTop: '2px',
              paddingBottom: '2px'
            }}
          >
            {selectedOptions.length === 0 ? (
              <span style={{ opacity: 0.75, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                {placeholder}
              </span>
            ) : (
              <>
                {selectedOptions.length <= maxVisibleBadges
                  ? selectedOptions.map(opt => (
                      <span
                        key={opt.value}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px', 
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#e2e8f0',
                          padding: '0 6px', 
                          height: '20px', 
                          borderRadius: '4px', 
                          fontSize: '11px', 
                          fontWeight: 500,
                        }}
                      >
                        <span style={{ maxWidth: isMobileSize ? 70 : 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '20px' }}>
                          {opt.label}
                        </span>
                        <button
                          type="button"
                          aria-label={`Remove ${opt.label}`}
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onClick={(e) => { e.stopPropagation(); clearOne(e, opt.value); }}
                          style={{ background: 'transparent', border: 'none', padding: 0, margin: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', height: '100%' }}
                        >
                          <X style={{ width: 10, height: 10, pointerEvents: 'none', opacity: 0.7 }} />
                        </button>
                      </span>
                    ))
                  : (
                    <span style={{ color: '#e6eef9', fontWeight: 500, fontSize: '13px' }}>{`${selectedOptions.length} selected`}</span>
                  )}
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)', maxHeight: 320, overflow: 'auto' }}>
        <Command>
          <CommandInput
            placeholder="Search..."
            value={searchInput}
            onValueChange={setSearchInput}
            style={{ fontSize: isMobileSize ? '16px' : 'inherit', minHeight: isMobileSize ? '48px' : 'auto' }}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options
                .filter(opt => !searchInput ? true : opt.label.toLowerCase().includes(searchInput.toLowerCase()))
                .map(opt => {
                  const isSelected = value.includes(opt.value);
                  return (
                    <CommandItem key={opt.value} value={opt.label} onSelect={() => toggle(opt.value)}>
                      <Check className={`mr-2 h-4 w-4 ${isSelected ? "opacity-100" : "opacity-0"}`} />
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

const categoryTagRenderer = (value: string | null | undefined) => {
  if (!value) return <span className="text-slate-500"></span>;

  const getColorForString = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); hash = hash | 0; }
    const h = Math.abs(hash) % 360;
    const s = 60, l = 50;
    const hslToRgb = (h: number, s: number, l: number) => {
      s /= 100; l /= 100;
      const k = (n: number) => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = (n: number) => { const color = l - a * Math.max(Math.min(k(n) - 3, 9 - k(n), 1), -1); return Math.round(255 * color); };
      return [f(0), f(8), f(4)];
    };
    const [r, g, b] = hslToRgb(h, s, l);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
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
    apiEndpoint: "/newmedialog/satsang-dashboard",
    idKey: "MLUniqueID",
    detailsType: "medialog",
    columns: [
      { key: "Yr", label: "Year", sortable: true, editable: true },
      {
        key: "EventName - EventCode", label: "Event Name - EventCode", sortable: true, editable: true,
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
        key: "DetailSub", label: "Detail - SubDetail", sortable: true, editable: true,
        render: (_v: any, row: any) => {
          const d = row.Detail || row.DetailMain || "";
          const s = row.SubDetail || row.DetailSub || "";
          return `${d}${d && s ? " - " : ""}${s}`;
        },
      },
      { key: "Topic", label: "Topic", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Number", label: "Number", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "fkGranth", label: "Granth", sortable: true, render: categoryTagRenderer, editable: true },
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
      { key: "NewEventFrom", label: "Event From Date", sortable: true, editable: true },
      { key: "NewEventTo", label: "Event To Date", sortable: true, editable: true },
    ],
  },
};

const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL) || "";

export function SatsangDashboard({ onShowDetails }: { onShowDetails?: (item: { type: string; data: any; title: string }) => void }) {
  const [isMobile, setIsMobile] = useState(false);
  const [searchFilters, setSearchFilters] = useState<Record<string, any>>({});
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any> | undefined>(undefined);
  const [showMobileResults, setShowMobileResults] = useState(false);
  const [showOverridePopup, setShowOverridePopup] = useState(false);
  const [pendingEventCode, setPendingEventCode] = useState<string | null>(null);

  const [countryOptions, setCountryOptions] = useState<Option[]>([]);
  const [stateOptions, setStateOptions] = useState<Option[]>([]);
  const [granthOptions, setGranthOptions] = useState<Option[]>([]);
  const [cityOptions, setCityOptions] = useState<Option[]>([]);
  const [eventCategoryOptions, setEventCategoryOptions] = useState<Option[]>([]);
  const [numberOptions, setNumberOptions] = useState<Option[]>([]);
  const [segmentCategoryOptions, setSegmentCategoryOptions] = useState<Option[]>([]);
  const [occasionOptions, setOccasionOptions] = useState<Option[]>([]);

  const [searchResult, setSearchResult] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Mobile Accordion State
  const [openSections, setOpenSections] = useState({
    core: true,
    location: false,
    dates: false,
    advanced: false
  });

  useEffect(() => {
    const checkIsMobile = () => {
      const mobileState = window.innerWidth <= 768;
      setIsMobile(mobileState);
      if (mobileState) document.body.style.backgroundColor = "#0b1120";
      else document.body.style.backgroundColor = "";
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => { window.removeEventListener("resize", checkIsMobile); document.body.style.backgroundColor = ""; };
  }, []);

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
            if (typeof v === "string" && v.includes(",")) return v.split(",").map((s: string) => s.trim()).filter(Boolean);
            return [v];
          })
          .map((v: any) => String(v).trim()).filter(Boolean);

        const uniqueValues = Array.from(new Set(normalized)).sort((a, b) => a.localeCompare(b));
        setter(uniqueValues.map((val) => ({ value: val, label: val })));
      } catch (error) { console.error(error); }
    };

    fetchOptions('/countries/options', 'fkCountry', setCountryOptions);
    fetchOptions('/states/options', 'fkState', setStateOptions);
    fetchOptions('/granths/options', 'fkGranth', setGranthOptions);
    fetchOptions('/cities/options', 'fkCity', setCityOptions);
    fetchOptions('/new-event-category/options', 'NewEventCategory', setEventCategoryOptions);
    fetchOptions('/number/options', 'Number', setNumberOptions);
    fetchOptions('/occasion/options', 'fkOccasion', setOccasionOptions);
    
    const specificSegmentCategories = [
      'Prasangik Udbodhan', 'SU', 'SU - GM', 'SU - Revision', 'Satsang', 
      'Informal Satsang', 'Pravachan', 'Product/Webseries', 'SU - Extracted', 
      'Satsang Clips', 'SU - Capsule'
    ].sort();
    setSegmentCategoryOptions(specificSegmentCategories.map(val => ({ value: val, label: val })));
  }, []);

  const handleInputChange = (field: string, value: string | string[]) => {
    setSearchFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    const activeFilters = Object.entries(searchFilters).reduce((acc, [key, value]) => {
      if (value && (Array.isArray(value) ? value.length > 0 : true)) acc[key] = value;
      return acc;
    }, {} as Record<string, any>);

    setAppliedFilters(activeFilters);
    setSearchResult([]);
    if (isMobile) { setShowMobileResults(true); window.scrollTo(0, 0); }
  };

  useEffect(() => {
    if (!appliedFilters) return;
    setSearchLoading(true);
    fetch(`${API_BASE_URL}${satsangCategoryConfig.apiEndpoint}?${new URLSearchParams(appliedFilters).toString()}`)
      .then(res => res.json())
      .then(data => {
        setSearchResult(data.data || []);
        setSearchLoading(false);
        if (appliedFilters.EventCode && Object.keys(appliedFilters).length > 1 && (!data.data || data.data.length === 0)) {
          setShowOverridePopup(true);
          setPendingEventCode(appliedFilters.EventCode);
        }
      })
      .catch(() => setSearchLoading(false));
  }, [appliedFilters]);

  const handleClear = () => {
    setSearchFilters({});
    setAppliedFilters(undefined);
    setShowMobileResults(false);
  };

  const handleRowSelect = (item: Record<string, any>) => {
    if (onShowDetails) onShowDetails({ type: 'medialog', data: item, title: 'Media Log Details' });
  };

  const satsangCategoryConfig = VIEW_CONFIGS['medialog_satsang_category'];

  // Mobile Override Popup Component
  const MobileOverridePopup = () => (
    <div onClick={() => setShowOverridePopup(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", backdropFilter: "blur(6px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#0f172a", width: "100%", maxWidth: "320px", borderRadius: "16px", padding: "24px", textAlign: "center", border: "1px solid #334155", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "white" }}>Filter Override</h2>
        <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "24px", lineHeight: 1.6 }}>No results found for your filters. Showing results for Event Code only.</p>
        <Button onClick={() => { setShowOverridePopup(false); if (pendingEventCode) { setAppliedFilters({ EventCode: pendingEventCode }); setPendingEventCode(null); } }} style={{ width: "100%", height: "46px", borderRadius: "10px", backgroundColor: "#3b82f6", color: "white", fontWeight: 600 }}>
          Understand
        </Button>
      </div>
    </div>
  );

  // Helper to count active filters in a section for mobile badges
  const countActiveFilters = (keys: string[]) => {
    return keys.filter(key => {
      const val = searchFilters[key];
      return val && (Array.isArray(val) ? val.length > 0 : String(val).trim() !== "");
    }).length;
  };

  // ==========================================
  // 📱 MOBILE APP UI (Accordions + Compact Grid)
  // ==========================================
  const renderMobileView = () => {
    const mLabelStyle = { marginBottom: "6px", display: "block", fontWeight: 500, color: "#cbd5e1", fontSize: "13px" };
    const mInputStyle = { width: "100%", minHeight: "40px", borderRadius: "8px", backgroundColor: "#1e293b", border: "1px solid #334155", color: "white", fontSize: "14px", padding: "8px 12px" };
    const mSelectStyle = { width: "100%", borderRadius: "8px", backgroundColor: "#1e293b", border: "1px solid #334155", color: "white" };
    
    // Accordion UI Wrapper
    const AccordionSection = ({ title, icon: Icon, sectionKey, filterKeys, children }: any) => {
      const isOpen = (openSections as any)[sectionKey];
      const activeCount = countActiveFilters(filterKeys);
      return (
        <div style={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "1px solid #1e293b", overflow: "hidden", marginBottom: "16px" }}>
          <button
            onClick={() => setOpenSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey as keyof typeof prev] }))}
            style={{ width: "100%", padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "transparent", border: "none", color: "white", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Icon size={18} color="#60a5fa" />
              <span style={{ fontSize: "15px", fontWeight: 600 }}>{title}</span>
              {activeCount > 0 && (
                <span style={{ background: "#3b82f6", color: "white", fontSize: "11px", fontWeight: "bold", padding: "2px 8px", borderRadius: "10px", marginLeft: "4px" }}>
                  {activeCount} active
                </span>
              )}
            </div>
            {isOpen ? <ChevronDown size={18} color="#64748b" /> : <ChevronRight size={18} color="#64748b" />}
          </button>
          {isOpen && (
            <div style={{ padding: "0 16px 16px 16px", borderTop: "1px solid #1e293b", display: "flex", flexDirection: "column", gap: "12px", paddingTop: "16px" }}>
              {children}
            </div>
          )}
        </div>
      );
    };

    if (showMobileResults) {
      return (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100dvh", zIndex: 40, display: "flex", flexDirection: "column", backgroundColor: "#0b1120", color: "white" }}>
          <div style={{ padding: "16px 20px", backgroundColor: "rgba(15,23,42,0.6)", borderBottom: "1px solid rgba(30,41,59,0.8)", display: "flex", alignItems: "center", gap: "16px", backdropFilter: "blur(12px)" }}>
            <button onClick={() => setShowMobileResults(false)} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "white", width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ArrowLeft style={{ width: 22, height: 22 }} /></button>
            <div>
              <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "white" }}>Search Results</h1>
              <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "2px" }}>Satsang Dashboard</p>
            </div>
          </div>
          <div style={{ padding: "20px", flex: 1, overflowY: "auto" }}>
            {appliedFilters && satsangCategoryConfig ? (
              <div style={{ backgroundColor: "#0f172a", borderRadius: "12px", overflow: "hidden", border: "1px solid #1e293b" }}>
                <ClickUpListViewUpdated title="" columns={satsangCategoryConfig.columns} apiEndpoint={satsangCategoryConfig.apiEndpoint} viewId={satsangCategoryConfig.idKey || "medialog_satsang_category"} idKey={satsangCategoryConfig.idKey} initialFilters={appliedFilters} onViewChange={() => { setAppliedFilters(undefined); setShowMobileResults(false); }} onRowSelect={handleRowSelect} />
              </div>
            ) : (<p style={{ color: "#ef4444" }}>Configuration not found.</p>)}
          </div>
          {showOverridePopup && <MobileOverridePopup />}
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh", backgroundColor: "#0b1120", color: "white" }}>
      

        <div style={{ padding: "20px 16px 128px 16px" }}>
          
          {/* Core Details Accordion */}
          <AccordionSection title="Category & Topic Details" icon={LayoutList} sectionKey="core" filterKeys={['NewEventCategory', 'Segment Category', 'Topic', 'EventCode']}>
            <div>
              <Label style={mLabelStyle}>New Event Category</Label>
              <MultiSelectCombobox options={eventCategoryOptions} value={searchFilters.NewEventCategory || []} onChange={(v) => handleInputChange("NewEventCategory", v)} placeholder="Select categories..." style={mSelectStyle} maxVisibleBadges={2} />
            </div>
            <div>
              <Label style={mLabelStyle}>Segment Category</Label>
              <MultiSelectCombobox options={segmentCategoryOptions} value={searchFilters["Segment Category"] || []} onChange={(v) => handleInputChange("Segment Category", v)} placeholder="Select segments..." style={mSelectStyle} maxVisibleBadges={2} />
            </div>
            <div>
              <Label style={mLabelStyle}>Topic</Label>
              <Input placeholder="e.g., Bhakti" value={searchFilters.Topic || ""} onChange={(e) => handleInputChange("Topic", e.target.value)} style={mInputStyle} />
            </div>
            <div>
              <Label style={mLabelStyle}>Event Code</Label>
              <Input placeholder="e.g., E00001" value={searchFilters.EventCode || ""} onChange={(e) => handleInputChange("EventCode", e.target.value)} style={mInputStyle} />
            </div>
          </AccordionSection>

          {/* Location Accordion */}
          <AccordionSection title="Location" icon={MapPin} sectionKey="location" filterKeys={['fkCountry', 'fkState', 'fkCity']}>
           
              <div>
                <Label style={mLabelStyle}>Country</Label>
                <MultiSelectCombobox options={countryOptions} value={searchFilters.fkCountry || []} onChange={(v) => handleInputChange("fkCountry", v)} placeholder="Countries..." style={mSelectStyle} maxVisibleBadges={1} />
              </div>
              <div>
                <Label style={mLabelStyle}>State</Label>
                <MultiSelectCombobox options={stateOptions} value={searchFilters.fkState || []} onChange={(v) => handleInputChange("fkState", v)} placeholder="States..." style={mSelectStyle} maxVisibleBadges={1} />
              </div>
            
            <div>
              <Label style={mLabelStyle}>City</Label>
              <MultiSelectCombobox options={cityOptions} value={searchFilters.fkCity || []} onChange={(v) => handleInputChange("fkCity", v)} placeholder="Cities..." style={mSelectStyle} maxVisibleBadges={2} />
            </div>
          </AccordionSection>

          {/* Dates Accordion */}
          <AccordionSection title="Dates & Timeline" icon={Calendar} sectionKey="dates" filterKeys={['NewEventFrom', 'NewEventTo', 'ContentFrom', 'Yr']}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <Label style={mLabelStyle}>Event From</Label>
                <Input placeholder="dd-mm-yyyy" value={searchFilters.NewEventFrom || ""} onChange={(e) => handleInputChange("NewEventFrom", e.target.value)} style={mInputStyle} />
              </div>
              <div>
                <Label style={mLabelStyle}>Event To</Label>
                <Input placeholder="dd-mm-yyyy" value={searchFilters.NewEventTo || ""} onChange={(e) => handleInputChange("NewEventTo", e.target.value)} style={mInputStyle} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <Label style={mLabelStyle}>ML Date</Label>
                <Input placeholder="dd.mm.yyyy" value={searchFilters.ContentFrom || ""} onChange={(e) => handleInputChange("ContentFrom", e.target.value)} style={mInputStyle} />
              </div>
              <div>
                <Label style={mLabelStyle}>Year</Label>
                <Input placeholder="YYYY" value={searchFilters.Yr || ""} onChange={(e) => handleInputChange("Yr", e.target.value)} style={mInputStyle} />
              </div>
            </div>
          </AccordionSection>

          {/* Advanced / Other Accordion */}
          <AccordionSection title="Granth & Occasion Details" icon={Hash} sectionKey="advanced" filterKeys={['fkOccasion', 'fkGranth', 'Number', 'MLUniqueID']}>
           
              <div>
                <Label style={mLabelStyle}>Granth</Label>
                <MultiSelectCombobox options={granthOptions} value={searchFilters.fkGranth || []} onChange={(v) => handleInputChange("fkGranth", v)} placeholder="Granth..." style={mSelectStyle} maxVisibleBadges={1} />
              </div>
              <div>
                <Label style={mLabelStyle}>Number</Label>
                <MultiSelectCombobox options={numberOptions} value={searchFilters.Number || []} onChange={(v) => handleInputChange("Number", v)} placeholder="Numbers..." style={mSelectStyle} maxVisibleBadges={1} />
              </div>
            
            <div>
              <Label style={mLabelStyle}>Occasion</Label>
              <MultiSelectCombobox options={occasionOptions} value={searchFilters.fkOccasion || []} onChange={(v) => handleInputChange("fkOccasion", v)} placeholder="Occasion..." style={mSelectStyle} maxVisibleBadges={2} />
            </div>
            <div>
              <Label style={mLabelStyle}>ML Unique ID</Label>
              <Input placeholder="e.g., E00001_001.1" value={searchFilters.MLUniqueID || ""} onChange={(e) => handleInputChange("MLUniqueID", e.target.value)} style={mInputStyle} />
            </div>
          </AccordionSection>

        </div>

        {/* Sticky Bottom Bar */}
        <div style={{ position: "fixed", bottom: 0, left: 0, width: "100%", padding: "16px", backgroundColor: "rgba(11,17,32,0.9)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(30,41,59,0.8)", display: "flex", gap: "12px", zIndex: 30, boxShadow: "0 -10px 20px rgba(0,0,0,0.3)" }}>
          <Button onClick={handleClear} style={{ flex: 1, height: "48px", borderRadius: "12px", backgroundColor: "#1e293b", border: "1px solid #334155", color: "white", fontWeight: 600 }}>
            Clear
          </Button>
          <Button onClick={handleSearch} style={{ flex: 2, height: "48px", borderRadius: "12px", background: "linear-gradient(to right, #2563eb, #7c3aed)", color: "white", fontWeight: 600, boxShadow: "0 4px 14px rgba(37,99,235,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <Search style={{ width: "20px", height: "20px" }} />
            Search
          </Button>
        </div>

        {showOverridePopup && <MobileOverridePopup />}
      </div>
    );
  };

  // ==========================================
  // 💻 DESKTOP UI
  // ==========================================
  const renderDesktopView = () => (
    <div className="p-4 space-y-6 w-full">
      <Card style={{ padding: "24px", border: "1px solid #474849ff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <CardHeader style={{ paddingBottom: "16px", borderBottom: "1px solid #2e3033" }}>
          <CardTitle style={{ fontSize: "20px", fontWeight: 600, color: "#f0f3f8ff" }}>
            Satsang Search
          </CardTitle>
        </CardHeader>

        <CardContent style={{ paddingTop: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
            <div>
              <Label htmlFor="NewEventCategory" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>New Event Category</Label>
              <MultiSelectCombobox options={eventCategoryOptions} value={searchFilters.NewEventCategory || []} onChange={value => handleInputChange('NewEventCategory', value)} placeholder="Select event categories..." style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px", height: 'auto' }} />
            </div>
            <div>
              <Label htmlFor="SegmentCategory" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>Segment Category</Label>
              <MultiSelectCombobox options={segmentCategoryOptions} value={searchFilters['Segment Category'] || []} onChange={value => handleInputChange('Segment Category', value)} placeholder="Select segment categories..." style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px", height: 'auto' }} />
            </div>
            <div>
              <Label htmlFor="fkOccasion" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>Occasion</Label>
              <MultiSelectCombobox options={occasionOptions} value={searchFilters.fkOccasion || []} onChange={value => handleInputChange('fkOccasion', value)} placeholder="Select occasion..." style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px", height: 'auto' }} />
            </div>
            <div>
              <Label htmlFor="fkCity" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>City</Label>
              <MultiSelectCombobox options={cityOptions} value={searchFilters.fkCity || []} onChange={value => handleInputChange('fkCity', value)} placeholder="Select cities..." style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px", height: 'auto' }} />
            </div>
            <div>
              <Label htmlFor="Topic" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>Topic</Label>
              <Input id="Topic" placeholder="e.g., Bhakti" value={searchFilters.Topic || ''} onChange={e => handleInputChange('Topic', e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px" }} />
            </div>
            <div>
              <Label htmlFor="Number" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>Number</Label>
              <MultiSelectCombobox options={numberOptions} value={searchFilters.Number || []} onChange={value => handleInputChange('Number', value)} placeholder="Select numbers..." style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px", height: 'auto' }} />
            </div>
            <div>
              <Label htmlFor="fkCountry" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>Country</Label>
              <MultiSelectCombobox options={countryOptions} value={searchFilters.fkCountry || []} onChange={value => handleInputChange('fkCountry', value)} placeholder="Select countries..." style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px", height: 'auto' }} />
            </div>
            <div>
              <Label htmlFor="fkState" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>State</Label>
              <MultiSelectCombobox options={stateOptions} value={searchFilters.fkState || []} onChange={value => handleInputChange('fkState', value)} placeholder="Select states..." style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px", height: 'auto' }} />
            </div>
            <div>
              <Label htmlFor="fkGranth" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>Granth</Label>
              <MultiSelectCombobox options={granthOptions} value={searchFilters.fkGranth || []} onChange={value => handleInputChange('fkGranth', value)} placeholder="Select granth..." style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px", height: 'auto' }} />
            </div>
            <div>
              <Label htmlFor="ContentFrom" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>ML Content Date</Label>
              <Input id="ContentFrom" placeholder="e.g., dd.mm.yyyy" value={searchFilters.ContentFrom || ''} onChange={e => handleInputChange('ContentFrom', e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px" }} />
            </div>
           <div>
              <Label htmlFor="EventFrom" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>New Event From</Label>
              <Input id="EventFrom" placeholder="e.g., dd-mm-yyyy" value={searchFilters.NewEventFrom || ''} onChange={e => handleInputChange('NewEventFrom', e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px" }} />
            </div>
            <div>
              <Label htmlFor="EventTo" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>New Event To</Label>
              <Input id="EventTo" placeholder="e.g., dd-mm-yyyy" value={searchFilters.NewEventTo || ''} onChange={e => handleInputChange('NewEventTo', e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px" }} />
            </div>
            <div>
              <Label htmlFor="MLUniqueID" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>MLUniqueID</Label>
              <Input id="MLUniqueID" placeholder="e.g., E00001_001.1" value={searchFilters.MLUniqueID || ''} onChange={e => handleInputChange('MLUniqueID', e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px" }} />
            </div>
            <div>
              <Label htmlFor="EventCode" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>Event Code</Label>
              <Input id="EventCode" placeholder="e.g., E00001" value={searchFilters.EventCode || ''} onChange={e => handleInputChange('EventCode', e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px" }} />
            </div>
            <div>
              <Label htmlFor="Yr" style={{ marginBottom: "6px", display: "block", fontWeight: 500, color: "#f7f8faff" }}>Year</Label>
              <Input id="Yr" placeholder="e.g., 2024" value={searchFilters.Yr || ''} onChange={e => handleInputChange('Yr', e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #474849ff", fontSize: "14px" }} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px", marginTop: "28px" }}>
            <Button variant="outline" onClick={handleClear} style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #1b1b1bff", backgroundColor: "#19191aff", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>
              Clear Search
            </Button>
            <Button size="lg" onClick={handleSearch} style={{ padding: "10px 24px", borderRadius: "8px", backgroundColor: "#161616ff", color: "#fff", fontWeight: 600, fontSize: "15px", cursor: "pointer" }}>
              <Search style={{ marginRight: "8px", width: "18px", height: "18px" }} />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Popup */}
      {showOverridePopup && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }} onClick={() => setShowOverridePopup(false)}>
          <div style={{ background: "#fff", padding: "32px 24px", borderRadius: "12px", minWidth: 320, boxShadow: "0 4px 24px rgba(0,0,0,0.15)", textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, color: "#1b1b1b" }}>Event Code Overrides Other Filters</h2>
            <p style={{ color: "#444", marginBottom: 24 }}>No results found for the combination of Event Code and other filters.<br />Showing results for Event Code only.</p>
            <Button onClick={() => { setShowOverridePopup(false); if (pendingEventCode) { setAppliedFilters({ EventCode: pendingEventCode }); setPendingEventCode(null); } }} style={{ width: "100%", padding: "8px 24px", borderRadius: "8px", background: "#161616ff", color: "#fff", fontWeight: 600 }}>
              OK
            </Button>
          </div>
        </div>
      )}

      {/* Desktop Results */}
      {appliedFilters && (
        <div className="mt-6 w-full overflow-x-auto">
          {satsangCategoryConfig ? (
            <ClickUpListViewUpdated title="Search Results" columns={satsangCategoryConfig.columns} apiEndpoint={satsangCategoryConfig.apiEndpoint} viewId={satsangCategoryConfig.idKey || 'medialog_satsang_category'} idKey={satsangCategoryConfig.idKey} initialFilters={appliedFilters} onViewChange={() => setAppliedFilters(undefined)} onRowSelect={handleRowSelect} />
          ) : (
            <Card><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent><p className="text-red-500">Satsang Category view configuration not found.</p></CardContent></Card>
          )}
        </div>
      )}
    </div>
  );

  return isMobile ? renderMobileView() : renderDesktopView();
}