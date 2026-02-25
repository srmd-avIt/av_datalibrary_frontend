import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search, X, Eye, ArrowRight } from "lucide-react";
import { ClickUpListViewUpdated } from "./ClickUpListViewUpdated";
import { getColorForString } from "./ui/utils";

// --- Helper Renderer for Tags (Centered) ---
const categoryTagRenderer = (value: string | null | undefined) => {
  // CHANGED: Removed the "-" so it renders completely blank when empty
  if (!value) return <div style={{ textAlign: "center", width: "100%" }}></div>;
  
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

// --- Helper for Centering Standard Text ---
const centerTextRenderer = (value: any) => (
  <div style={{ textAlign: "center", width: "100%" }}>
    {/* CHANGED: Render value, or an empty string if null/undefined */}
    {value || ""}
  </div>
);

// --- Column Configuration ---
const SEARCH_COLUMNS = [
  { key: "Yr", label: "Year", sortable: true, editable: true, render: centerTextRenderer },
  {
    key: "EventDisplay",
    label: "Event Name - EventCode",
    sortable: true,
    editable: true,
    render: (_v: any, row: any) => {
      const en = row.EventName || "";
      const ec = row.EventCode || row.fkEventCode || "";
      return (
        <div style={{ textAlign: "center", width: "100%" }}>
          {`${en}${en && ec ? " - " : ""}${ec}`}
        </div>
      );
    },
  },
  { key: "NewEventCategory", label: "New Event Category", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "FootageSrNo", label: "FootageSrNo", sortable: true, editable: true, render: centerTextRenderer },
  { key: "LogSerialNo", label: "LogSerialNo", sortable: true, editable: true, render: centerTextRenderer },
  { key: "EventCode", label: "Event Code", sortable: true, editable: true, render: centerTextRenderer },
  { key: "fkDigitalRecordingCode", label: "DR Code", sortable: true, editable: true, render: centerTextRenderer },
  { key: "MLUniqueID", label: "MLUniqueID", sortable: true, editable: true, render: centerTextRenderer },
  { key: "ContentFrom", label: "Content From", sortable: true, editable: true, render: centerTextRenderer },
  { key: "ContentTo", label: "Content To", sortable: true, editable: true, render: centerTextRenderer },
  { key: "TimeOfDay", label: "Time Of Day", sortable: true, editable: true, render: centerTextRenderer },

  { key: "fkOccasion", label: "Occasion", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "EditingStatus", label: "Editing Status", sortable: true, render: categoryTagRenderer, editable: true },

  { key: "FootageType", label: "Footage Type", sortable: true, render: categoryTagRenderer, editable: true },

  { key: "VideoDistribution", label: "Video Distribution", sortable: true, render: categoryTagRenderer, editable: true },
  {
    key: "DetailSub",
    label: "Detail - SubDetail",
    sortable: true,
    editable: true,
    render: (_v: any, row: any) => {
      const d = row.Detail || "";
      const s = row.SubDetail || "";
      return (
        <div style={{ textAlign: "center", width: "100%" }}>
          {`${d}${d && s ? " - " : ""}${s}`}
        </div>
      );
    },
  },

  { key: "Segment Category", label: "Segment Category", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "CounterFrom", label: "Counter From", sortable: true, editable: true, render: centerTextRenderer },
  { key: "CounterTo", label: "Counter To", sortable: true, editable: true, render: centerTextRenderer },
  { key: "SubDuration", label: "Sub Duration", sortable: true, editable: true, render: centerTextRenderer },
  { key: "TotalDuration", label: "Total Duration", sortable: true, editable: true, render: centerTextRenderer },
  { key: "Language", label: "Language", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "SpeakerSinger", label: "Speaker / Singer", sortable: true, editable: true, render: centerTextRenderer },
  { key: "fkOrganization", label: "Organization", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "Designation", label: "Designation", sortable: true, editable: true, render: centerTextRenderer },
  { key: "fkCountry", label: "Country", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "fkState", label: "State", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "fkCity", label: "City", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "Venue", label: "Venue", sortable: true, editable: true, render: centerTextRenderer },
  { key: "LocationWithinAshram", label: "LocationWithinAshram", sortable: true, editable: true, render: centerTextRenderer },
  { key: "fkGranth", label: "Granth", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "Number", label: "Number", sortable: true, editable: true, render: centerTextRenderer },
  { key: "Topic", label: "Topic", sortable: true, editable: true, render: centerTextRenderer },
  { key: "TopicGivenBy", label: "TopicGivenBy", sortable: true, editable: true, render: centerTextRenderer },
  { key: "Synopsis", label: "Synopsis", sortable: true, editable: true, render: centerTextRenderer },
  { key: "Keywords", label: "Keywords", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "SeriesName", label: "Series Name", sortable: true, editable: true, render: centerTextRenderer },
  { key: "SatsangStart", label: "Satsang Start", sortable: true, editable: true, render: centerTextRenderer },
  { key: "SatsangEnd", label: "Satsang End", sortable: true, editable: true, render: centerTextRenderer },

  { key: "AudioMP3Distribution", label: "AudioMP3Distribution", sortable: true, editable: true, render: centerTextRenderer },
  { key: "AudioWAVDistribution", label: "AudioWAVDistribution", sortable: true, editable: true, render: centerTextRenderer },
  { key: "AudioMP3DRCode", label: "AudioMP3DRCode", sortable: true, editable: true, render: centerTextRenderer },
  { key: "AudioWAVDRCode", label: "AudioWAVDRCode", sortable: true, editable: true, render: centerTextRenderer },
  { key: "FullWAVDRCode", label: "FullWAVDRCode", sortable: true, editable: true, render: centerTextRenderer },
  { key: "Remarks", label: "Remarks", sortable: true, editable: true, render: centerTextRenderer },
  { key: "IsStartPage", label: "IsStartPage", sortable: true, editable: true, render: centerTextRenderer },
  { key: "EndPage", label: "EndPage", sortable: true, editable: true, render: centerTextRenderer },
  { key: "IsInformal", label: "IsInformal", sortable: true, editable: true, render: centerTextRenderer },
  { key: "IsPPGNotPresent", label: "IsPPGNotPresent", sortable: true, editable: true, render: centerTextRenderer },
  { key: "Guidance", label: "Guidance", sortable: true, editable: true, render: centerTextRenderer },
  { key: "DiskMasterDuration", label: "DiskMasterDuration", sortable: true, editable: true, render: centerTextRenderer },
  { key: "EventRefRemarksCounters", label: "EventRefRemarksCounters", sortable: true, editable: true, render: centerTextRenderer },
  { key: "EventRefMLID", label: "EventRefMLID", sortable: true, editable: true, render: centerTextRenderer },

  { key: "EventRefMLID2", label: "EventRefMLID2", sortable: true, editable: true, render: centerTextRenderer },
  { key: "DubbedLanguage", label: "DubbedLanguage", sortable: true, editable: true, render: centerTextRenderer },
  { key: "DubbingArtist", label: "DubbingArtist", sortable: true, editable: true, render: centerTextRenderer },
  { key: "HasSubtitle", label: "HasSubtitle", sortable: true, editable: true, render: centerTextRenderer },
  { key: "SubTitlesLanguage", label: "SubTitlesLanguage", sortable: true, render: categoryTagRenderer, editable: true },

  { key: "EditingType", label: "EditingType", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "BhajanType", label: "BhajanType", sortable: true, render: categoryTagRenderer, editable: true },

  { key: "Grading", label: "Grading", sortable: true, editable: true, render: centerTextRenderer },

  { key: "ProductionBucket", label: "Production Bucket", sortable: true, render: categoryTagRenderer, editable: true },
];

export function SearchDetailsByMLID() {
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedFilter, setAppliedFilter] = useState<Record<string, any> | undefined>(undefined);

  // --- NEW: Debounce Logic to trigger search while typing ---
  useEffect(() => {
    // 1. Create a timeout to wait for user to stop typing
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        // If there is text, trigger the search
        setAppliedFilter({ search: searchTerm.trim() });
      } else {
        // If text is cleared, reset the filter (shows empty state)
        setAppliedFilter(undefined);
      }
    }, 500); // 500ms delay

    // 2. Cleanup function clears the timeout if the user types again before 500ms
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]); // Re-run this effect whenever searchTerm changes

  const handleManualSearch = () => {
    if (!searchTerm.trim()) {
      setAppliedFilter(undefined);
      return;
    }
    setAppliedFilter({ search: searchTerm.trim() });
  };

  const handleClear = () => {
    setSearchTerm("");
    setAppliedFilter(undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleManualSearch();
    }
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "rgba(2,6,23,0.5)",
        boxSizing: "border-box"
      }}
    >
      {/* Search Header Section */}
      <div
        style={{
          padding: "32px",
          maxWidth: "1920px",
          margin: "0 auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          boxSizing: "border-box"
        }}
      >
        <Card
          style={{
            border: "1px solid #1e293b",
            background: "linear-gradient(to bottom right,#0f172a,#0f172a,#020617)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
            borderRadius: "16px",
            overflow: "hidden"
          }}
        >
          <CardHeader
            style={{
              borderBottom: "1px solid rgba(30,41,59,0.5)",
              padding: "24px"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    padding: "10px",
                    borderRadius: "12px",
                    background: "rgba(6,182,212,0.1)", // Cyan tint
                    border: "1px solid rgba(6,182,212,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Eye style={{ width: "24px", height: "24px", color: "#22d3ee" }} />
                </div>

                <div>
                  <CardTitle
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      background: "linear-gradient(to right,#ffffff,#94a3b8)",
                      WebkitBackgroundClip: "text",
                      color: "transparent"
                    }}
                  >
                    Search Details
                  </CardTitle>

                  <CardDescription
                    style={{
                      color: "#94a3b8",
                      marginTop: "4px",
                      fontSize: "14px"
                    }}
                  >
                    Search by Detail, remarks, speaker singer, organization 
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent style={{ padding: "24px 24px 32px 24px" }}>
            <div style={{ maxWidth: "768px" }}>
              <label
                htmlFor="searchDetails"
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#cbd5e1",
                  marginBottom: "10px",
                  marginLeft: "4px"
                }}
              >
                Enter Search Text
              </label>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap"
                }}
              >
                <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#64748b"
                    }}
                  >
                    <Search style={{ width: "20px", height: "20px" }} />
                  </div>

                  <Input
                    id="searchDetails"
                    placeholder="Search by Detail,remarks, speaker singer, organization  ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{
                      width: "100%",
                      paddingLeft: "44px",
                      paddingRight: "40px",
                      height: "48px",
                      background: "rgba(2,6,23,0.5)",
                      border: "1px solid #334155",
                      color: "#e2e8f0",
                      borderRadius: "12px",
                      outline: "none",
                      transition: "all 0.2s ease"
                    }}
                  />

                  {searchTerm && (
                    <button
                      onClick={handleClear}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        padding: "4px",
                        borderRadius: "50%",
                        color: "#64748b",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer"
                      }}
                    >
                      <X style={{ width: "16px", height: "16px" }} />
                    </button>
                  )}
                </div>

                <Button
                  size="lg"
                  onClick={handleManualSearch}
                  style={{
                    height: "48px",
                    padding: "0 32px",
                    background: "#06b6d4", // Cyan button
                    color: "#fff",
                    borderRadius: "12px",
                    boxShadow: "0 10px 20px rgba(8,145,178,0.3)",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    transition: "all 0.2s ease"
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "#0891b2")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "#06b6d4")}
                >
                  <span style={{ fontWeight: 500 }}>Search</span>
                  <ArrowRight style={{ width: "16px", height: "16px", marginLeft: "8px" }} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div style={{ minHeight: "400px" }}>
          {appliedFilter ? (
            <ClickUpListViewUpdated
              title={`Results for: ${appliedFilter.search}`}
              viewId="search-details-by-mlid"
              apiEndpoint="/search-details-global"
              idKey="MLUniqueID"
              columns={SEARCH_COLUMNS}
              initialFilters={appliedFilter}
              onViewChange={() => {}}
              showAddButton={false}
            />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "260px",
                borderRadius: "16px",
                border: "2px dashed #1e293b",
                background: "rgba(15,23,42,0.2)",
                textAlign: "center",
                padding: "24px"
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "rgba(30,41,59,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px"
                }}
              >
                <Eye style={{ width: "32px", height: "32px", color: "#475569" }} />
              </div>

              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 500,
                  color: "#cbd5e1",
                  marginBottom: "4px"
                }}
              >
                No details searched
              </h3>

              <p
                style={{
                  fontSize: "14px",
                  color: "#64748b",
                  maxWidth: "320px"
                }}
              >
                Enter text in the search bar above to find matching Details, Topics, Keywords, etc.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}