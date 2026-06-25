import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search, X, ArrowRight, ArrowLeft, Database, FileText, Calendar, Disc } from "lucide-react";
import { ClickUpListViewUpdated } from "./ClickUpListViewUpdated";
import { getColorForString } from "./ui/utils";
import { MLDetailPanel } from "./MLDetailPanel";

const API_BASE_URL = (import.meta as any).env.VITE_API_URL;

const centeredTextRenderer = (value: any) => (
  <div className="w-full flex items-center justify-center text-center">{value || ""}</div>
);

const categoryTagRenderer = (value: string | null | undefined) => {
  if (!value) return <div className="w-full flex items-center justify-center text-slate-500"></div>;

  const getTextColorForBg = (hex: string): string => {
    if (!hex || hex.length < 7) return "#0f172a";
    const r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.7 ? "#f7f9fcff" : "#f1f5f9";
  };

  const values = value.split(",").map((v) => v.trim()).filter(Boolean);
  return (
    <div className="flex flex-wrap gap-1.5 justify-center w-full">
      {values.map((val, index) => {
        const bgColor = getColorForString(val);
        return (
          <div
            key={index}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-sm backdrop-blur-sm transition-all hover:scale-105 cursor-default"
            style={{
              backgroundColor: `${bgColor}25`,
              borderColor: `${bgColor}40`,
              color: getTextColorForBg(bgColor),
            }}
          >
            {val}
          </div>
        );
      })}
    </div>
  );
};

const ML_COLUMNS = [
  { key: "MLUniqueID", label: "ML Unique ID", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "fkDigitalRecordingCode", label: "DR Code", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "Yr", label: "Year", sortable: true, editable: true, render: centeredTextRenderer },
  {
    key: "EventDisplay",
    label: "Event Name - EventCode",
    sortable: true,
    editable: true,
    render: (_v: any, row: any) => {
      const en = row.EventName || "";
      const ec = row.EventCode || row.fkEventCode || "";
      const text = `${en}${en && ec ? " - " : ""}${ec}`;
      return <div className="w-full flex items-center justify-center text-center">{text}</div>;
    },
  },
  { key: "ContentFrom", label: "Content From", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "ContentTo", label: "Content To", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "FootageSrNo", label: "Footage Sr No", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "LogSerialNo", label: "Log Serial No", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "EditingStatus", label: "Editing Status", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "FootageType", label: "Footage Type", sortable: true, render: categoryTagRenderer, editable: true },
  {
    key: "DetailSub",
    label: "Detail - SubDetail",
    sortable: true,
    editable: true,
    render: (_v: any, row: any) => {
      const d = row.Detail || "";
      const s = row.SubDetail || "";
      const text = `${d}${d && s ? " - " : ""}${s}`;
      return <div className="w-full flex items-center justify-center text-center">{text}</div>;
    },
  },
  { key: "Segment Category", label: "Segment Category", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "SubDuration", label: "Sub Duration", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "TotalDuration", label: "Total Duration", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "Language", label: "Language", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "SpeakerSinger", label: "Speaker / Singer", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "fkCity", label: "City", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "Topic", label: "Topic", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "fkGranth", label: "Granth", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "Number", label: "Number", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "SatsangStart", label: "Satsang Start", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "SatsangEnd", label: "Satsang End", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "CounterFrom", label: "Counter From", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "CounterTo", label: "Counter To", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "AudioMP3DRCode", label: "Audio MP3 DR Code", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "AudioWAVDRCode", label: "Audio WAV DR Code", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "VideoDistribution", label: "Video Distribution", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "TimeOfDay", label: "Time Of Day", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "fkOccasion", label: "Occasion", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "IsInformal", label: "Is Informal", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "Remarks", label: "Remarks", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "Synopsis", label: "Synopsis", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "Keywords", label: "Keywords", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "Grading", label: "Grading", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "EventRefMLID", label: "Event Ref ML ID", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "LastModifiedBy", label: "Last Modified By", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "LastModifiedTimestamp", label: "Last Modified", sortable: true, editable: true, render: centeredTextRenderer },
];

interface DRDetails {
  RecordingName?: string;
  Masterquality?: string;
  EventName?: string;
  EventCode?: string;
  Yr?: string | number;
  DistributionDriveLink?: string;
  ProductionBucket?: string;
}

export function SearchByDRCode() {
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedFilter, setAppliedFilter] = useState<Record<string, any> | undefined>(undefined);
  const [showMobileResults, setShowMobileResults] = useState(false);
  const [drDetails, setDrDetails] = useState<DRDetails | null>(null);
  const [loadingDR, setLoadingDR] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Record<string, any> | null>(null);

  const handleRowSelect = useCallback((item: any) => {
    setSelectedItem(item);
  }, []);

  useEffect(() => {
    const checkIsMobile = () => {
      const mobileState = window.innerWidth <= 768;
      setIsMobile(mobileState);
      if (mobileState) document.body.style.backgroundColor = "#0b1120";
      else document.body.style.backgroundColor = "";
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => {
      window.removeEventListener("resize", checkIsMobile);
      document.body.style.backgroundColor = "";
    };
  }, []);

  const fetchDRDetails = async (drCode: string) => {
    setLoadingDR(true);
    setDrDetails(null);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(
        `${API_BASE_URL}/search-ml-by-dr-code?drCode=${encodeURIComponent(drCode)}&limit=1`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return;
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        const row = json.data[0];
        setDrDetails({
          RecordingName: row.RecordingName,
          Masterquality: row.Masterquality,
          EventName: row.EventName,
          EventCode: row.EventCode,
          Yr: row.Yr,
          DistributionDriveLink: row.DistributionDriveLink,
          ProductionBucket: row.ProductionBucket,
        });
      }
    } catch (_) {
    } finally {
      setLoadingDR(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setAppliedFilter(undefined);
      setDrDetails(null);
      setShowMobileResults(false);
      return;
    }
    const code = searchTerm.trim();
    setAppliedFilter({ drCode: code });
    fetchDRDetails(code);
    if (isMobile) {
      setShowMobileResults(true);
      window.scrollTo(0, 0);
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    setAppliedFilter(undefined);
    setDrDetails(null);
    setShowMobileResults(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const renderDRDetailsCard = (drCode: string) => {
    if (loadingDR) {
      return (
        <div style={{ padding: "12px 16px", background: "rgba(30,41,59,0.6)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.07)", color: "#64748b", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Database size={14} className="animate-pulse" /> Loading DR details...
        </div>
      );
    }
    if (!drDetails) return null;

    const fields = [
      { label: "Recording Name", value: drDetails.RecordingName, icon: <Disc size={12} /> },
      { label: "Event", value: drDetails.EventName && drDetails.EventCode ? `${drDetails.EventName} — ${drDetails.EventCode}` : (drDetails.EventName || drDetails.EventCode), icon: <Calendar size={12} /> },
      { label: "Year", value: drDetails.Yr, icon: <FileText size={12} /> },
      { label: "Master Quality", value: drDetails.Masterquality, icon: <Database size={12} /> },
      { label: "Production Bucket", value: drDetails.ProductionBucket, icon: <FileText size={12} /> },
    ].filter(f => f.value);

    return (
      <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "12px", padding: "16px 20px", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <div style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "8px", padding: "6px 8px", display: "flex", alignItems: "center" }}>
            <Database size={14} color="#818cf8" />
          </div>
          <div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.05em" }}>DR Details</span>
            <span style={{ marginLeft: "8px", fontSize: "12px", color: "#64748b" }}>— {drCode}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {fields.map((f, i) => (
            <div key={i} style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "8px 12px", minWidth: "160px", flex: "1 1 160px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#64748b", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>
                {f.icon} {f.label}
              </div>
              <div style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: 500 }}>{f.value}</div>
            </div>
          ))}
        </div>
        {drDetails.DistributionDriveLink && (
          <div style={{ marginTop: "10px" }}>
            <a href={drDetails.DistributionDriveLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#60a5fa", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <FileText size={12} /> Distribution Drive Link ↗
            </a>
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // MOBILE VIEW
  // ==========================================
  if (isMobile) {
    if (showMobileResults && appliedFilter) {
      return (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100dvh", zIndex: 40, display: "flex", flexDirection: "column", backgroundColor: "#0b1120", color: "white" }}>
          <div style={{ padding: "16px 20px", backgroundColor: "rgba(15,23,42,0.6)", borderBottom: "1px solid rgba(30,41,59,0.8)", display: "flex", alignItems: "center", gap: "16px", backdropFilter: "blur(12px)", flexShrink: 0 }}>
            <button onClick={() => setShowMobileResults(false)} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "white", width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <ArrowLeft style={{ width: 22, height: 22 }} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "white" }}>Search Results</h1>
              <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                DR Code: {appliedFilter.fkDigitalRecordingCode}
              </p>
            </div>
          </div>
          {drDetails && (
            <div style={{ padding: "12px 16px", flexShrink: 0 }}>
              {renderDRDetailsCard(appliedFilter.fkDigitalRecordingCode)}
            </div>
          )}
          <div className="hide-results-bottom-bar" style={{ flex: 1, width: "100%", overflow: "hidden", backgroundColor: "#0f172a", display: "flex", flexDirection: "column" }}>
            <style>{`.hide-results-bottom-bar div[style*="position: fixed"][style*="bottom"] { display: none !important; }`}</style>
            <ClickUpListViewUpdated
              title=""
              viewId="search-ml-by-dr-code"
              apiEndpoint="/search-ml-by-dr-code"
              idKey="MLUniqueID"
              columns={ML_COLUMNS}
              initialFilters={appliedFilter}
              onViewChange={() => {}}
              showAddButton={false}
              onRowSelect={handleRowSelect}
            />
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100dvh", backgroundColor: "#0b1120", color: "white" }}>
        <div style={{ padding: "24px 20px 16px", backgroundColor: "rgba(15,23,42,0.6)", borderBottom: "1px solid rgba(30,41,59,0.8)", backdropFilter: "blur(12px)", flexShrink: 0 }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
            <Database style={{ width: "20px", height: "20px", color: "#818cf8" }} />
            Search by DR Code
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>Retrieve all media log entries for a specific Digital Recording code</p>
        </div>
        <div style={{ padding: "20px", flexShrink: 0 }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#cbd5e1", marginBottom: "8px" }}>Enter DR Code</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}>
                <Search style={{ width: "18px", height: "18px" }} />
              </div>
              <Input
                placeholder="e.g. DR001234"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ paddingLeft: "42px", paddingRight: "40px", height: "48px", background: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "10px", fontSize: "16px" }}
              />
              {searchTerm && (
                <button onClick={handleClear} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#94a3b8", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X style={{ width: "18px", height: "18px" }} />
                </button>
              )}
            </div>
            <Button onClick={handleSearch} style={{ height: "48px", background: "#4f46e5", color: "#fff", borderRadius: "10px", fontWeight: 600, fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              Search <ArrowRight style={{ width: "18px", height: "18px" }} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // DESKTOP VIEW
  // ==========================================
  return (
    <>
    <div style={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column", background: "rgba(2,6,23,0.5)", padding: "24px 40px" }}>
      <div style={{ maxWidth: "1600px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Search Card */}
        <Card style={{ border: "1px solid #1e293b", background: "linear-gradient(to bottom right,#0f172a,#0f172a,#020617)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)", margin: "0 8px", borderRadius: "16px" }}>
          <CardHeader style={{ borderBottom: "1px solid rgba(30,41,59,0.5)", padding: "28px 32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <Database style={{ width: "24px", height: "24px", color: "#818cf8" }} />
              </div>
              <div>
                <CardTitle style={{ fontSize: "24px", fontWeight: "bold", background: "linear-gradient(to right,#fff,#94a3b8)", WebkitBackgroundClip: "text", color: "transparent" }}>
                  Search by DR Code
                </CardTitle>
                <CardDescription style={{ color: "#94a3b8", marginTop: "4px" }}>
                  Retrieve all media log entries associated with a specific Digital Recording code
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent style={{ padding: "32px" }}>
            <div style={{ maxWidth: "768px" }}>
              <label htmlFor="searchDRCode" style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#cbd5f5", marginBottom: "10px", marginLeft: "4px" }}>
                Enter DR Code
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}>
                    <Search style={{ width: "20px", height: "20px" }} />
                  </div>
                  <Input
                    id="searchDRCode"
                    placeholder="e.g. DR001234"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{ paddingLeft: "44px", paddingRight: "40px", height: "48px", background: "rgba(2,6,23,0.5)", border: "1px solid #334155", color: "#e2e8f0", borderRadius: "12px", width: "100%" }}
                  />
                  {searchTerm && (
                    <button onClick={handleClear} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", padding: "4px", borderRadius: "50%", background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}>
                      <X style={{ width: "16px", height: "16px" }} />
                    </button>
                  )}
                </div>
                <Button size="lg" onClick={handleSearch} style={{ height: "48px", padding: "0 32px", background: "#4f46e5", color: "#fff", borderRadius: "12px", border: "none", cursor: "pointer", boxShadow: "0 10px 20px rgba(67,56,202,0.3)", display: "flex", alignItems: "center" }}>
                  <span style={{ fontWeight: 500 }}>Search</span>
                  <ArrowRight style={{ width: "16px", height: "16px", marginLeft: "8px" }} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DR Details + Results */}
        <div style={{ minHeight: "420px", marginTop: "0px", padding: "0 8px" }}>
          {appliedFilter ? (
            <>
              {renderDRDetailsCard(appliedFilter.fkDigitalRecordingCode)}
              <ClickUpListViewUpdated
                title={`ML Entries for DR Code: ${appliedFilter.fkDigitalRecordingCode}`}
                viewId="search-ml-by-dr-code"
                apiEndpoint="/search-ml-by-dr-code"
                idKey="MLUniqueID"
                columns={ML_COLUMNS}
                initialFilters={appliedFilter}
                onViewChange={() => {}}
                showAddButton={false}
                onRowSelect={handleRowSelect}
              />
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "420px", borderRadius: "16px", border: "1px dashed rgba(99,102,241,0.2)", background: "rgba(15,23,42,0.3)" }}>
              <div style={{ padding: "20px", borderRadius: "50%", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", marginBottom: "20px" }}>
                <Database style={{ width: "40px", height: "40px", color: "#818cf8" }} />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 600, color: "#e2e8f0", marginBottom: "8px" }}>Enter a DR Code to Search</h3>
              <p style={{ color: "#64748b", maxWidth: "400px", textAlign: "center", fontSize: "14px" }}>
                Type a Digital Recording code above and press Search to view all associated media log entries.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    {selectedItem && (
      <MLDetailPanel
        item={selectedItem}
        columns={ML_COLUMNS}
        onClose={() => setSelectedItem(null)}
        isMobile={isMobile}
        idKey="MLUniqueID"
      />
    )}
    </>
  );
}
