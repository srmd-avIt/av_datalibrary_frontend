import React from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { getColorForString } from "./ui/utils";

// Fields that should be rendered as colored tag badges
const TAG_FIELD_KEYS = new Set([
  "NewEventCategory",
  "fkOccasion",
  "EditingStatus",
  "FootageType",
  "VideoDistribution",
  "Segment Category",
  "Language",
  "fkOrganization",
  "fkCountry",
  "fkState",
  "fkCity",
  "fkGranth",
  "Keywords",
  "SubTitlesLanguage",
  "EditingType",
  "BhajanType",
  "ProductionBucket",
  "StorageLocation",
  "fkDistributed",
]);

interface ColumnDef {
  key: string;
  label: string;
  isTag?: boolean;
}

interface MLDetailPanelProps {
  item: Record<string, any>;
  columns: ColumnDef[];
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  isMobile?: boolean;
  idKey?: string;
}

const getTextColorForBg = (hex: string): string => {
  if (!hex || hex.length < 7) return "#0f172a";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.7 ? "#f7f9fcff" : "#f1f5f9";
};

const renderTagValue = (value: string) => {
  const values = value.split(",").map((v) => v.trim()).filter(Boolean);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
      {values.map((val, i) => {
        const bgColor = getColorForString(val);
        return (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "3px 10px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: 500,
              border: `1px solid ${bgColor}40`,
              backgroundColor: `${bgColor}25`,
              color: getTextColorForBg(bgColor),
            }}
          >
            {val}
          </span>
        );
      })}
    </div>
  );
};

const renderFieldValue = (key: string, value: any) => {
  if (value === null || value === undefined || value === "") {
    return <span style={{ color: "#475569", fontSize: "14px" }}>—</span>;
  }

  const strVal = String(value);

  if (TAG_FIELD_KEYS.has(key)) {
    return renderTagValue(strVal);
  }

  return (
    <span style={{ color: "#e2e8f0", fontSize: "14px", lineHeight: "1.5" }}>
      {strVal}
    </span>
  );
};

export function MLDetailPanel({
  item,
  columns,
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  isMobile = false,
  idKey = "MLUniqueID",
}: MLDetailPanelProps) {
  const entryId = item[idKey] || "Details";

  // Compute composite display fields
  const getDisplayValue = (col: ColumnDef): any => {
    if (col.key === "EventDisplay") {
      const en = item.EventName || "";
      const ec = item.EventCode || item.fkEventCode || "";
      return `${en}${en && ec ? " - " : ""}${ec}` || null;
    }
    if (col.key === "DetailSub") {
      const d = item.Detail || "";
      const s = item.SubDetail || "";
      return `${d}${d && s ? " - " : ""}${s}` || null;
    }
    return item[col.key];
  };

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100dvh",
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0b1120",
        color: "white",
        overflowY: "auto",
      }
    : {
        position: "fixed",
        top: 0,
        right: 0,
        width: "420px",
        height: "100vh",
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0d1829",
        borderLeft: "1px solid rgba(30,41,59,0.8)",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
        color: "white",
        overflowY: "hidden",
      };

  return (
    <>
      {/* Backdrop (desktop only) */}
      {!isMobile && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "calc(100% - 420px)",
            height: "100vh",
            zIndex: 59,
            background: "rgba(0,0,0,0.3)",
            cursor: "pointer",
          }}
        />
      )}

      <div style={panelStyle}>
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            background: "rgba(15,23,42,0.9)",
            borderBottom: "1px solid rgba(30,41,59,0.8)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexShrink: 0,
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Nav arrows */}
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              onClick={onPrev}
              disabled={!hasPrev}
              style={{
                background: hasPrev ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                border: "none",
                color: hasPrev ? "#e2e8f0" : "#334155",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: hasPrev ? "pointer" : "not-allowed",
                flexShrink: 0,
              }}
            >
              <ChevronLeft style={{ width: 18, height: 18 }} />
            </button>
            <button
              onClick={onNext}
              disabled={!hasNext}
              style={{
                background: hasNext ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                border: "none",
                color: hasNext ? "#e2e8f0" : "#334155",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: hasNext ? "pointer" : "not-allowed",
                flexShrink: 0,
              }}
            >
              <ChevronRight style={{ width: 18, height: 18 }} />
            </button>
          </div>

          {/* Title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#f1f5f9",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {entryId}
            </h2>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              color: "#94a3b8",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Body - field list */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 0 24px 0",
          }}
        >
          {columns.map((col) => {
            const value = getDisplayValue(col);
            return (
              <div
                key={col.key}
                style={{
                  padding: "12px 20px",
                  borderBottom: "1px solid rgba(30,41,59,0.4)",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "4px",
                  }}
                >
                  {col.label}
                </div>
                <div>{renderFieldValue(col.key, value)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
