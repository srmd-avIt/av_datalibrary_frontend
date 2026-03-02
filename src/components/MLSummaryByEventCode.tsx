import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search, X, ListTree, ArrowRight, ArrowLeft } from "lucide-react";
import { ClickUpListViewUpdated } from "./ClickUpListViewUpdated";
import { getColorForString } from "./ui/utils";

const categoryTagRenderer = (value: string | null | undefined) => {
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

// --- Helper: Standard Centered Text Renderer ---
const centeredTextRenderer = (value: any) => {
  return (
    <div className="w-full flex items-center justify-center text-center">
      {value || ""}
    </div>
  );
};

// --- Column Configuration matching the screenshot ---
const ML_SUMMARY_COLUMNS = [

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

  { key: "ContentFrom", label: "Content From", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "ContentTo", label: "Content To", sortable: true, editable: true, render: centeredTextRenderer },
 
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
   { key: "SpeakerSinger", label: "Speaker / Singer", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "fkOrganization", label: "Organization", sortable: true, render: categoryTagRenderer, editable: true },
  
  { key: "fkCountry", label: "Country", sortable: true, render: categoryTagRenderer, editable: true },
  
  { key: "fkCity", label: "City", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "Venue", label: "Venue", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "Remarks", label: "Remarks", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "fkDigitalRecordingCode", label: "DR Code", sortable: true, editable: true, render: centeredTextRenderer },
   
   { key: "MLUniqueID", label: "MLUniqueID", sortable: true, editable: true, render: centeredTextRenderer },
   { key: "EventCode", label: "Event Code", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "FootageSrNo", label: "FootageSrNo", sortable: true, editable: true, render: centeredTextRenderer },
  { key: "LogSerialNo", label: "LogSerialNo", sortable: true, editable: true, render: centeredTextRenderer },
  
];

export function MLSummaryByEventCode() {
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedFilter, setAppliedFilter] = useState<Record<string, any> | undefined>(undefined);
  const [showMobileResults, setShowMobileResults] = useState(false);

  // --- Check mobile sizing ---
  useEffect(() => {
    const checkIsMobile = () => {
      const mobileState = window.innerWidth <= 768;
      setIsMobile(mobileState);
      if (mobileState) {
        document.body.style.backgroundColor = "#0b1120";
      } else {
        document.body.style.backgroundColor = "";
      }
    };
    
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => {
      window.removeEventListener("resize", checkIsMobile);
      document.body.style.backgroundColor = "";
    };
  }, []);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setAppliedFilter(undefined);
      setShowMobileResults(false);
      return;
    }
    // Set the filter to trigger the backend query for the specific Event Code
    setAppliedFilter({ fkEventCode: searchTerm.trim() });
    
    if (isMobile) {
      setShowMobileResults(true);
      window.scrollTo(0, 0);
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    setAppliedFilter(undefined);
    setShowMobileResults(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // ==========================================
  // 📱 MOBILE APP UI
  // ==========================================
  const renderMobileView = () => {
    
    // VIEW 1: Search Results Page (Full Screen Overlay)
    if (showMobileResults && appliedFilter) {
      return (
        <div
          style={{
            position: "fixed", 
            top: 0,
            left: 0,
            width: "100%",
            height: "100dvh",
            zIndex: 40,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#0b1120",
            color: "white",
          }}
        >
          {/* Back Header */}
          <div
            style={{
              padding: "16px 20px",
              backgroundColor: "rgba(15,23,42,0.6)",
              borderBottom: "1px solid rgba(30,41,59,0.8)",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              backdropFilter: "blur(12px)",
              flexShrink: 0
            }}
          >
            <button
              onClick={() => setShowMobileResults(false)}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "none",
                color: "white",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0
              }}
            >
              <ArrowLeft style={{ width: 22, height: 22 }} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Summary
              </h1>
              <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Event Code: {appliedFilter.fkEventCode}
              </p>
            </div>
          </div>

          {/* Results List Area */}
          <div className="hide-results-bottom-bar" style={{ flex: 1, width: "100%", overflow: "hidden", backgroundColor: "#0f172a", display: "flex", flexDirection: "column" }}>
             <style>{`
               .hide-results-bottom-bar div[style*="position: fixed"][style*="bottom"] {
                 display: none !important;
               }
             `}</style>
             <ClickUpListViewUpdated
              title=""
              viewId="ml_summary_event_code"
              apiEndpoint="/ml-summary-event-code"
              idKey="MLUniqueID"
              columns={ML_SUMMARY_COLUMNS}
              initialFilters={appliedFilter}
              onViewChange={() => {}}
              showAddButton={false}
             />
          </div>
        </div>
      );
    }

    // VIEW 2: Search Input Page
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100dvh", backgroundColor: "#0b1120", color: "white" }}>
        {/* Mobile Header */}
        <div style={{ padding: "24px 20px 16px", backgroundColor: "rgba(15,23,42,0.6)", borderBottom: "1px solid rgba(30,41,59,0.8)", backdropFilter: "blur(12px)", flexShrink: 0 }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
            <ListTree style={{ width: "20px", height: "20px", color: "#34d399" }} /> 
            ML Summary
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px", lineHeight: 1.4 }}>
            Enter an Event Code to view all related Media Log entries.
          </p>
        </div>

        {/* Mobile Search Box */}
        <div style={{ padding: "20px", flexShrink: 0 }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#cbd5e1", marginBottom: "8px" }}>
            Enter Event Code
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}>
                <Search style={{ width: "18px", height: "18px" }} />
              </div>
              <Input
                placeholder="e.g. E003945"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ paddingLeft: "42px", paddingRight: "40px", height: "48px", background: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "10px", fontSize: "16px" }}
              />
              {searchTerm && (
                <button
                  onClick={handleClear}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#94a3b8", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <X style={{ width: "18px", height: "18px" }} />
                </button>
              )}
            </div>
            <Button
              onClick={handleSearch}
              style={{ height: "48px", background: "#10b981", color: "#fff", borderRadius: "10px", fontWeight: 600, fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              Search
              <ArrowRight style={{ width: "18px", height: "18px" }} />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // 💻 DESKTOP UI
  // ==========================================
  const renderDesktopView = () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "rgba(2,6,23,0.5)",
        padding: "24px 40px"
      }}
    >
      {/* Search Header Section */}
      <div
        style={{
          maxWidth: "1600px",
          margin: "0 auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "32px"
        }}
      >
        <Card
          style={{
            border: "1px solid #1e293b",
            background: "linear-gradient(to bottom right,#0f172a,#0f172a,#020617)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
            borderRadius: "16px",
            margin: "0 6px"
          }}
        >
          {/* Header */}
          <CardHeader
            style={{
              borderBottom: "1px solid rgba(30,41,59,0.5)",
              padding: "26px 32px"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "16px",
                alignItems: "center"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    padding: "10px",
                    borderRadius: "12px",
                    background: "rgba(16,185,129,0.1)", // Green tint for this specific tab
                    border: "1px solid rgba(16,185,129,0.2)"
                  }}
                >
                  <ListTree style={{ width: "24px", height: "24px", color: "#34d399" }} />
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
                    ML Summary by Event Code
                  </CardTitle>

                  <CardDescription
                    style={{
                      color: "#94a3b8",
                      marginTop: "4px"
                    }}
                  >
                    Enter an Event Code to view all related Media Log entries.
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Content */}
          <CardContent
            style={{
              padding: "30px 32px"
            }}
          >
            <div style={{ maxWidth: "720px" }}>
              <label
                htmlFor="searchEventCode"
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#cbd5f5",
                  marginBottom: "12px",
                  marginLeft: "4px"
                }}
              >
                Enter Event Code
              </label>

              <div
                style={{
                  display: "flex",
                  gap: "12px"
                }}
              >
                <div style={{ position: "relative", flex: 1 }}>
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
                    id="searchEventCode"
                    placeholder="e.g. E003945"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{
                      paddingLeft: "44px",
                      paddingRight: "40px",
                      height: "48px",
                      background: "rgba(2,6,23,0.5)",
                      border: "1px solid #334155",
                      color: "#e2e8f0",
                      borderRadius: "12px"
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
                  onClick={handleSearch}
                  style={{
                    height: "48px",
                    padding: "0 32px",
                    background: "#10b981", // Matching green tint
                    color: "#fff",
                    borderRadius: "12px",
                    boxShadow: "0 10px 20px rgba(16,185,129,0.3)",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  <span style={{ fontWeight: 500 }}>Search</span>
                  <ArrowRight style={{ width: "16px", height: "16px", marginLeft: "8px" }} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div style={{ minHeight: "420px", marginTop: "6px" }}>
          {appliedFilter ? (
            <ClickUpListViewUpdated
              title={`ML Summary for Event: ${appliedFilter.fkEventCode}`}
              viewId="ml_summary_event_code"
              apiEndpoint="/ml-summary-event-code" // Standard ML endpoint, filtered by EventCode
              idKey="MLUniqueID"
              columns={ML_SUMMARY_COLUMNS}
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
                height: "300px",
                borderRadius: "16px",
                border: "2px dashed #1e293b",
                background: "rgba(15,23,42,0.2)",
                textAlign: "center",
                padding: "36px"
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
                <ListTree style={{ width: "32px", height: "32px", color: "#475569" }} />
              </div>

              <h3 style={{ fontSize: "18px", fontWeight: 500, color: "#cbd5f5", marginBottom: "4px" }}>
                No Event Code selected
              </h3>

              <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "320px" }}>
                Enter an Event Code in the search bar above to generate a summary of Media Log entries.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return isMobile ? renderMobileView() : renderDesktopView();
}