import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search, X, Edit, ArrowRight } from "lucide-react";
import { ClickUpListViewUpdated } from "./ClickUpListViewUpdated";
import { getColorForString } from "./ui/utils";

// --- Helper Renderer for Tags ---
const categoryTagRenderer = (value: string | null | undefined) => {
  if (!value) return <span className="text-slate-500">-</span>;
  const getTextColorForBg = (hex: string): string => {
    if (!hex || hex.length < 7) return "#0f172a";
    const r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.7 ? "#f7f9fcff" : "#f1f5f9";
  };
  const values = value.split(",").map((v) => v.trim()).filter(Boolean);
  return (
    <div className="flex flex-wrap gap-1.5">
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

// --- Column Configuration ---
const CHECK_ML_COLUMNS = [
  { key: "Yr", label: "Year", sortable: true, editable: true },
  {
    key: "EventDisplay",
    label: "Event Name - EventCode",
    sortable: true,
    editable: true,
    render: (_v: any, row: any) => {
      const en = row.EventName || "";
      const ec = row.EventCode || row.fkEventCode || "";
      return `${en}${en && ec ? " - " : ""}${ec}`;
    },
  },
  { key: "NewEventCategory", label: "New Event Category", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "FootageSrNo", label: "FootageSrNo", sortable: true, editable: true },
  { key: "LogSerialNo", label: "LogSerialNo", sortable: true, editable: true },
  { key: "EventCode", label: "Event Code", sortable: true, editable: true },
  { key: "fkDigitalRecordingCode", label: "DR Code", sortable: true, editable: true },
  { key: "MLUniqueID", label: "MLUniqueID", sortable: true, editable: true },
  { key: "ContentFrom", label: "Content From", sortable: true, editable: true },
  { key: "ContentTo", label: "Content To", sortable: true, editable: true },
  { key: "TimeOfDay", label: "Time Of Day", sortable: true, editable: true },

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
      return `${d}${d && s ? " - " : ""}${s}`;
    },
  },


  { key: "Segment Category", label: "Segment Category", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "CounterFrom", label: "Counter From", sortable: true, editable: true },
  { key: "CounterTo", label: "Counter To", sortable: true, editable: true },
  { key: "SubDuration", label: "Sub Duration", sortable: true, editable: true },
  { key: "TotalDuration", label: "Total Duration", sortable: true, editable: true },
  { key: "Language", label: "Language", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "SpeakerSinger", label: "Speaker / Singer", sortable: true, editable: true },
  { key: "fkOrganization", label: "Organization", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "Designation", label: "Designation", sortable: true, editable: true },
  { key: "fkCountry", label: "Country", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "fkState", label: "State", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "fkCity", label: "City", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "Venue", label: "Venue", sortable: true, editable: true },
  { key: "LocationWithinAshram", label: "LocationWithinAshram", sortable: true, editable: true },
  { key: "fkGranth", label: "Granth", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "Number", label: "Number", sortable: true, editable: true },
  { key: "Topic", label: "Topic", sortable: true, editable: true },
  { key: "TopicGivenBy", label: "TopicGivenBy", sortable: true, editable: true },
  { key: "Synopsis", label: "Synopsis", sortable: true, editable: true },
  { key: "Keywords", label: "Keywords", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "SeriesName", label: "Series Name", sortable: true, editable: true },
  { key: "SatsangStart", label: "Satsang Start", sortable: true, editable: true },
  { key: "SatsangEnd", label: "Satsang End", sortable: true, editable: true },


  { key: "AudioMP3Distribution", label: "AudioMP3Distribution", sortable: true, editable: true },
  { key: "AudioWAVDistribution", label: "AudioWAVDistribution", sortable: true, editable: true },
  { key: "AudioMP3DRCode", label: "AudioMP3DRCode", sortable: true, editable: true },
  { key: "AudioWAVDRCode", label: "AudioWAVDRCode", sortable: true, editable: true },
  { key: "FullWAVDRCode", label: "FullWAVDRCode", sortable: true, editable: true },
  { key: "Remarks", label: "Remarks", sortable: true, editable: true },
  { key: "IsStartPage", label: "IsStartPage", sortable: true, editable: true },
  { key: "EndPage", label: "EndPage", sortable: true, editable: true },
  { key: "IsInformal", label: "IsInformal", sortable: true, editable: true },
  { key: "IsPPGNotPresent", label: "IsPPGNotPresent", sortable: true, editable: true },
  { key: "Guidance", label: "Guidance", sortable: true, editable: true },
  { key: "DiskMasterDuration", label: "DiskMasterDuration", sortable: true, editable: true },
  { key: "EventRefRemarksCounters", label: "EventRefRemarksCounters", sortable: true, editable: true },
  { key: "EventRefMLID", label: "EventRefMLID", sortable: true, editable: true },

  { key: "EventRefMLID2", label: "EventRefMLID2", sortable: true, editable: true },
  { key: "DubbedLanguage", label: "DubbedLanguage", sortable: true, editable: true },
  { key: "DubbingArtist", label: "DubbingArtist", sortable: true, editable: true },
  { key: "HasSubtitle", label: "HasSubtitle", sortable: true, editable: true },
  { key: "SubTitlesLanguage", label: "SubTitlesLanguage", sortable: true, render: categoryTagRenderer, editable: true },

  { key: "EditingType", label: "EditingType", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "BhajanType", label: "BhajanType", sortable: true, render: categoryTagRenderer, editable: true },

  { key: "Grading", label: "Grading", sortable: true, editable: true },

  { key: "ProductionBucket", label: "Production Bucket", sortable: true, render: categoryTagRenderer, editable: true },
];

export function CheckMLReference() {
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedFilter, setAppliedFilter] = useState<Record<string, any> | undefined>(undefined);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setAppliedFilter(undefined);
      return;
    }
    // Set the filter to trigger the backend query
    setAppliedFilter({ MLUniqueID: searchTerm.trim() });
  };

  const handleClear = () => {
    setSearchTerm("");
    setAppliedFilter(undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
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
    padding: "24px 40px" // ✅ Added outer margin spacing
  }}
>
  {/* Search Header Section */}
  <div
    style={{
      maxWidth: "1600px", // ✅ Centered dashboard width
      margin: "0 auto",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "32px" // ✅ More breathing space
    }}
  >
    <Card
      style={{
        border: "1px solid #1e293b",
        background:
          "linear-gradient(to bottom right,#0f172a,#0f172a,#020617)",
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        borderRadius: "16px",
        margin: "0 6px"
      }}
    >
      {/* Header */}
      <CardHeader
        style={{
          borderBottom: "1px solid rgba(30,41,59,0.5)",
          padding: "26px 32px" // ✅ Balanced padding
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
                background: "rgba(59,130,246,0.1)",
                border: "1px solid rgba(59,130,246,0.2)"
              }}
            >
              <Edit style={{ width: "24px", height: "24px", color: "#60a5fa" }} />
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
                Enter ML Ref
              </CardTitle>

              <CardDescription
                style={{
                  color: "#94a3b8",
                  marginTop: "4px"
                }}
              >
                Search MLID to see entry details
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent
        style={{
          padding: "30px 32px" // ✅ Increased spacing
        }}
      >
        <div style={{ maxWidth: "720px" }}>
          <label
            htmlFor="searchMLID"
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 500,
              color: "#cbd5f5",
              marginBottom: "12px",
              marginLeft: "4px"
            }}
          >
            Enter ML Unique ID
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
                id="searchMLID"
                placeholder="e.g. DE0836_1a.1"
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
                background: "#3b82f6",
                color: "#fff",
                borderRadius: "12px",
                boxShadow: "0 10px 20px rgba(37,99,235,0.3)",
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
          title={`Results for MLID: ${appliedFilter.MLUniqueID}`}
          viewId="check_ml_reference"
          apiEndpoint="/check-ml-reference"
          idKey="MLUniqueID"
          columns={CHECK_ML_COLUMNS}
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
            height: "300px", // ✅ Taller empty panel
            borderRadius: "16px",
            border: "2px dashed #1e293b",
            background: "rgba(15,23,42,0.2)",
            textAlign: "center",
            padding: "36px" // ✅ More breathing space
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
            <Edit style={{ width: "32px", height: "32px", color: "#475569" }} />
          </div>

          <h3 style={{ fontSize: "18px", fontWeight: 500, color: "#cbd5f5", marginBottom: "4px" }}>
            No MLID selected
          </h3>

          <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "320px" }}>
            Enter an MLID in the search bar above to see entry details.
          </p>
        </div>
      )}
    </div>
  </div>
</div>

  );
}