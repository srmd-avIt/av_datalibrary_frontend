import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  X,
  ExternalLink,
  Mail,
  Calendar,
  FileAudio,
  ListChecks,
  Loader2,
  AlertTriangle,
  ChevronRight,
  FileText,
  Lock,
  BookOpen,
  Globe,
  Edit,
  Save,
  Users,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";

// TypeScript fix for Vite's import.meta.env
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// @ts-ignore
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "";

type SidebarStackItem = {
  type: string;
  data: Record<string, any>;
  title: string;
};

interface DetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onPopSidebar?: () => void;
  data: any;
  type: string;
  title: string;
  onPushSidebar: (item: SidebarStackItem) => void;
  zIndex: number;
  positionOffset: number;
  sidebarStack: SidebarStackItem[]; // <-- Add this line
}

function DigitalRecordingsList({
  eventCode,
  onPushSidebar,
}: {
  eventCode: string;
  onPushSidebar: (item: SidebarStackItem) => void;
}) {
  const [recordings, setRecordings] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/digitalrecording?fkEventCode=${encodeURIComponent(
            eventCode
          )}`
        );
        if (!response.ok)
          throw new Error(`Failed to fetch recordings (Status: ${response.status})`);
        const result = await response.json();
        setRecordings(result.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRecordings();
  }, [eventCode]);

  if (loading)
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  if (error)
    return (
      <div className="text-destructive p-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        {error}
      </div>
    );
  if (!recordings || recordings.length === 0)
    return (
      <div className="text-muted-foreground p-4 text-center">
        No recordings found.
      </div>
    );

  return (
    <div className="space-y-2">
      {recordings.map((rec) => (
        <Card
          key={rec.RecordingCode}
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() =>
            onPushSidebar({
              type: "digitalrecording",
              data: rec,
              title: "Recording Details",
            })
          }
        >
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{rec.RecordingName}</p>
              <p className="text-xs text-muted-foreground">
                {rec.RecordingCode}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


function MediaLogsList({
  recordingCode,
  onPushSidebar,
}: {
  recordingCode: string;
  onPushSidebar: (item: SidebarStackItem) => void;
}) {
  const [logs, setLogs] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/newmedialog?fkDigitalRecordingCode=${encodeURIComponent(
            recordingCode
          )}`
        );
        if (!response.ok)
          throw new Error(`Failed to fetch media logs (Status: ${response.status})`);
        const result = await response.json();
        setLogs(result.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [recordingCode]);

  if (loading)
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  if (error)
    return (
      <div className="text-destructive p-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        {error}
      </div>
    );
  if (!logs || logs.length === 0)
    return (
      <div className="text-muted-foreground p-4 text-center">
        No media logs found.
      </div>
    );

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <Card
          key={log.MLUniqueID}
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() =>
            onPushSidebar({
              type: "medialog",
              data: log,
              title: "Media Log Details",
            })
          }
        >
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{log.Topic}</p>
              <p className="text-xs text-muted-foreground">
                {log.Detail || `ID: ${log.MLUniqueID}`}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DrilldownButton({
  id,
  apiEndpoint,
  targetType,
  titlePrefix,
  onPushSidebar,
  children,
}: {
  id: string;
  apiEndpoint: string;
  targetType: string;
  titlePrefix: string;
  onPushSidebar: (item: SidebarStackItem) => void;
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}${apiEndpoint}/${encodeURIComponent(id)}`
      );
      if (!response.ok) throw new Error(`Failed to fetch (Status: ${response.status})`);
      const result = await response.json();

      if (!result || Object.keys(result).length === 0) {
        throw new Error("Item not found.");
      }

      onPushSidebar({
        type: targetType,
        data: result,
        title: `${titlePrefix} Details`,
      });
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="link"
      className="p-0 h-auto font-medium text-base text-blue-400 hover:text-blue-300"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : error ? (
        <span className="text-destructive text-sm flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Error
        </span>
      ) : (
        <>
          {children}
          <ChevronRight className="w-4 h-4 ml-1" />
        </>
      )}
    </Button>
  );
}

// =================================================================
// UTILITY COMPONENTS
// =================================================================

function getColorForString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `#${hslToHex(hue, 60, 85)}`;
}

function hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `${f(0)}${f(8)}${f(4)}`;
}

function exportToCSV(
  data: any[],
  columns: { key: string; label: string }[],
  filename: string = "export.csv"
) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    alert("No data to export.");
    return;
  }
  const csvRows: string[] = [];
  csvRows.push(columns.map(col => `"${col.label.replace(/"/g, '""')}"`).join(","));
  for (const row of data) {
    csvRows.push(
      columns
        .map(col => {
          let val = row[col.key];
          if (val === undefined || val === null) val = "";
          if (typeof val === "string") val = val.replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(",")
    );
  }
  const csvContent = csvRows.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const categoryTagRenderer = (value: string | null | undefined) => {
    if (!value) return <span className="text-slate-500"></span>;
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
                    <div key={index} className="inline-block whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold border backdrop-blur-sm" style={{ backgroundColor: `${bgColor}40`, borderColor: `${bgColor}66`, color: getTextColorForBg(bgColor) }}>
                        {val}
                    </div>
                );
            })}
        </div>
    );
};

// =================================================================
// DATA TABLE VIEW COMPONENTS
// =================================================================

function EventDataTableView({
  eventCode,
  onPushSidebar,
}: {
  eventCode: string;
  onPushSidebar: (item: SidebarStackItem) => void;
}) {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [mediaLogs, setMediaLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns = [   { key: "Yr", label: "Year", sortable: true, editable: true },
      {
        key: "EventDisplay",
        label: "Event Name - EventCode",
        sortable: true,
        editable: true,
        render: (_v: any, row: any) => {
          const en = row.EventName || row.EventName || "";
          const ec = row.EventCode || row.fkEventCode || "";
          return `${en}${en && ec ? " - " : ""}${ec}`;
        },
      },
        { key: "EventCode", label: "Event Code", sortable: true, editable: true },
      { key: "fkDigitalRecordingCode", label: "DR Code", sortable: true, editable: true },
       
      // Core ML columns requested
      { key: "ContentFrom", label: "Content From", sortable: true, editable: true },
      { key: "ContentTo", label: "Content To", sortable: true, editable: true },
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
      
 

      { key: "EditingStatus", label: "Editing Status", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "FootageType", label: "Footage Type", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "fkOccasion", label: "Occasion", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Segment Category", label: "Segment Category", sortable: true, render: categoryTagRenderer, editable: true },

      // Counters / durations / language / speaker / org / designation
      { key: "CounterFrom", label: "Counter From", sortable: true, editable: true },
      { key: "CounterTo", label: "Counter To", sortable: true, editable: true },
      { key: "SubDuration", label: "Sub Duration", sortable: true, editable: true },
      { key: "Language", label: "Language", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "SpeakerSinger", label: "Speaker / Singer", sortable: true, editable: true },
      { key: "fkOrganization", label: "Organization", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Designation", label: "Designation", sortable: true, editable: true },

      // 4 location fields
      { key: "fkCountry", label: "Country", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "fkState", label: "State", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "fkCity", label: "City", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Venue", label: "Venue", sortable: true, editable: true },

      // keep existing/other ML fields (preserve original keys)
      { key: "MLUniqueID", label: "MLUniqueID", sortable: true, editable: true },
      { key: "FootageSrNo", label: "FootageSrNo", sortable: true, editable: true },
      { key: "LogSerialNo", label: "LogSerialNo", sortable: true, editable: true },
      
      { key: "IsAudioRecorded", label: "IsAudioRecorded", sortable: true, render: categoryTagRenderer, editable: true },
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
     {
  key: "ContentFromDetailCity",
  label: "Content - Detail - City",
  sortable: true,
  editable: false,
  render: (_v: any, row: any) => {
    // Use backend-computed field if available
    if (row.ContentFromDetailCity) {
      return row.ContentFromDetailCity;
    }

    // ✅ Prevent fallback when EventRefMLID is empty
    if (!row.EventRefMLID) {
      return ""; // or return null;
    }

    // Fallback: build value manually if needed
    const parts = [row.ContentFrom, row.Detail, row.fkCity].filter(Boolean);
    return parts.join(" - ");
  },
}
,
      { key: "EventRefMLID2", label: "EventRefMLID2", sortable: true, editable: true },
      { key: "DubbedLanguage", label: "DubbedLanguage", sortable: true, editable: true },
      { key: "DubbingArtist", label: "DubbingArtist", sortable: true, editable: true },
      { key: "HasSubtitle", label: "HasSubtitle", sortable: true, editable: true },
      { key: "SubTitlesLanguage", label: "SubTitlesLanguage", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "EditingDeptRemarks", label: "EditingDeptRemarks", sortable: true, editable: true },
      { key: "EditingType", label: "EditingType", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "BhajanType", label: "BhajanType", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "IsDubbed", label: "IsDubbed", sortable: true, editable: true },
      { key: "NumberSource", label: "NumberSource", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "TopicSource", label: "TopicSource", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true, editable: true },
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true, editable: true },
      { key: "Synopsis", label: "Synopsis", sortable: true, editable: true },
      { key: "LocationWithinAshram", label: "LocationWithinAshram", sortable: true, editable: true },
      { key: "Keywords", label: "Keywords", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Grading", label: "Grading", sortable: true, editable: true },
      
      { key: "Segment Duration", label: "Segment Duration", sortable: true, editable: true },
      { key: "TopicGivenBy", label: "TopicGivenBy", sortable: true, editable: true },

      // DR specific and then rest of existing ML fields
      { key: "RecordingName", label: "Recording Name", sortable: true, editable: true },
      { key: "Masterquality", label: "DR Master Quality", sortable: true, render: categoryTagRenderer, editable: true },
 ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [recordingsResponse, mediaLogsResponse] = await Promise.all([ fetch(`${API_BASE_URL}/digitalrecording?fkEventCode=${encodeURIComponent(eventCode)}`), fetch(`${API_BASE_URL}/newmedialog?EventCode=${encodeURIComponent(eventCode)}`), ]);
        if (!recordingsResponse.ok) throw new Error(`Failed to fetch recordings (Status: ${recordingsResponse.status})`);
        if (!mediaLogsResponse.ok) throw new Error(`Failed to fetch media logs (Status: ${mediaLogsResponse.status})`);
        const recordingsResult = await recordingsResponse.json();
        const mediaLogsResult = await mediaLogsResponse.json();
        setRecordings(recordingsResult.data || []);
        setMediaLogs(mediaLogsResult.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [eventCode]);

  if (loading) return <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    color: "white",
    fontSize: "14px",
  }}
>
  <Loader2
    style={{
      marginRight: "8px",
      width: "20px",
      height: "20px",
      animation: "spin 1s linear infinite",
    }}
  />

  {/* Inline keyframes for spin */}
  <style>
    {`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}
  </style>

  Loading event data...
</div>
;
  if (error) return <div className="text-destructive p-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="recordings" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="recordings">Digital Recordings</TabsTrigger>
          <TabsTrigger value="medialogs">Media Log</TabsTrigger>
        </TabsList>
        <TabsContent value="recordings">
          <CardContent className="p-0">
            {recordings.length > 0 ? (
              <>
                 <div className="flex justify-between items-center mb-4 px-2">
                    <h2 className="text-xl font-semibold px-2 text-white">Digital Recordings</h2>
                    <Button variant="outline" size="sm" onClick={() => exportToCSV(recordings, [ { key: "Yr", label: "Year" }, { key: "EventName", label: "Event Name" }, { key: "fkEventCategory", label: "Event Category" }, { key: "fkEventCode", label: "fkEventCode" }, { key: "RecordingName", label: "Recording Name" }, { key: "RecordingCode", label: "Recording Code" }, { key: "Duration", label: "Duration" }, { key: "DistributionDriveLink", label: "Distribution Drive Link" }, { key: "BitRate", label: "Bit Rate" }, { key: "Dimension", label: "Dimension" }, { key: "Masterquality", label: "Masterquality" }, { key: "fkMediaName", label: "fkMediaName" }, { key: "Filesize", label: "Filesize" }, { key: "FilesizeInBytes", label: "FilesizeInBytes" }, { key: "NoOfFiles", label: "No Of Files" }, { key: "RecordingRemarks", label: "Recording Remarks" }, { key: "CounterError", label: "Counter Error" }, { key: "ReasonError", label: "Reason Error" }, { key: "MasterProductTitle", label: "Master Product Title" }, { key: "fkDistributionLabel", label: "fkDistributionLabel" }, { key: "ProductionBucket", label: "Production Bucket" }, { key: "fkDigitalMasterCategory", label: "fkDigitalMasterCategory" }, { key: "AudioBitrate", label: "Audio Bitrate" }, { key: "AudioTotalDuration", label: "Audio Total Duration" }, { key: "QcRemarksCheckedOn", label: "Qc Remarks Checked On" }, { key: "PreservationStatus", label: "Preservation Status" }, { key: "QCSevak", label: "QC Sevak" }, { key: "QcStatus", label: "Qc Status" }, { key: "LastModifiedTimestamp", label: "Last Modified Timestamp" }, { key: "SubmittedDate", label: "Submitted Date" }, { key: "PresStatGuidDt", label: "Pres Stat Guid Dt" }, { key: "InfoOnCassette", label: "Info On Cassette" }, { key: "IsInformal", label: "Is Informal" }, { key: "AssociatedDR", label: "Associated DR" }, { key: "Teams", label: "Teams" }, ], "digital_recordings.csv")}>Export CSV</Button>
                </div>
                <div className="w-full overflow-x-auto max-h-[600px] overflow-y-auto text-white">
                  <Table className="border">
                    <TableHeader className="sticky top-0 bg-background z-10 shadow text-white">
                      <TableRow className="border"><TableHead className="border whitespace-nowrap text-white px-3 py-2">Year</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Event Name</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Event Category</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">fkEventCode</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Recording Name</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Recording Code</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Duration</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Distribution Drive Link</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Bit Rate</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Dimension</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Masterquality</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">fkMediaName</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Filesize</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">FilesizeInBytes</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">No Of Files</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Recording Remarks</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Counter Error</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Reason Error</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Master Product Title</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">fkDistributionLabel</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Production Bucket</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">fkDigitalMasterCategory</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Audio Bitrate</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Audio Total Duration</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Qc Remarks Checked On</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Preservation Status</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">QC Sevak</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Qc Status</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Last Modified Timestamp</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Submitted Date</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Pres Stat Guid Dt</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Info On Cassette</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Is Informal</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Associated DR</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recordings.map((rec) => (<TableRow key={rec.RecordingCode} className="border"><TableCell className="border px-3 py-2">{rec.Yr}</TableCell><TableCell className="border px-3 py-2">{rec.EventName}</TableCell><TableCell className="border px-3 py-2">{categoryTagRenderer(rec.fkEventCategory)}</TableCell><TableCell className="border px-3 py-2">{rec.fkEventCode}</TableCell><TableCell className="border px-3 py-2">{rec.RecordingName}</TableCell><TableCell className="border px-3 py-2">{rec.RecordingCode}</TableCell><TableCell className="border px-3 py-2">{rec.Duration}</TableCell>
                      <TableCell className="border px-3 py-2">{rec.DistributionDriveLink }</TableCell><TableCell className="border px-3 py-2">{rec.BitRate}</TableCell><TableCell className="border px-3 py-2">{rec.Dimension}</TableCell><TableCell className="border px-3 py-2">{rec.Masterquality}</TableCell><TableCell className="border px-3 py-2">{rec.fkMediaName}</TableCell><TableCell className="border px-3 py-2">{rec.Filesize}</TableCell><TableCell className="border px-3 py-2">{rec.FilesizeInBytes}</TableCell><TableCell className="border px-3 py-2">{rec.NoOfFiles}</TableCell><TableCell className="border px-3 py-2">{rec.RecordingRemarks}</TableCell><TableCell className="border px-3 py-2">{rec.CounterError}</TableCell><TableCell className="border px-3 py-2">{rec.ReasonError}</TableCell><TableCell className="border px-3 py-2">{rec.MasterProductTitle}</TableCell><TableCell className="border px-3 py-2">{rec.fkDistributionLabel}</TableCell><TableCell className="border px-3 py-2">{rec.ProductionBucket}</TableCell><TableCell className="border px-3 py-2">{rec.fkDigitalMasterCategory}</TableCell><TableCell className="border px-3 py-2">{rec.AudioBitrate}</TableCell><TableCell className="border px-3 py-2">{rec.AudioTotalDuration}</TableCell><TableCell className="border px-3 py-2">{rec.QcRemarksCheckedOn}</TableCell><TableCell className="border px-3 py-2">{rec.PreservationStatus}</TableCell><TableCell className="border px-3 py-2">{rec.QCSevak}</TableCell><TableCell className="border px-3 py-2">{rec.QcStatus}</TableCell><TableCell className="border px-3 py-2">{rec.LastModifiedTimestamp}</TableCell><TableCell className="border px-3 py-2">{rec.SubmittedDate}</TableCell><TableCell className="border px-3 py-2">{rec.PresStatGuidDt}</TableCell><TableCell className="border px-3 py-2">{rec.InfoOnCassette}</TableCell><TableCell className="border px-3 py-2">{rec.IsInformal}</TableCell><TableCell className="border px-5 py-2">{rec.AssociatedDR}</TableCell></TableRow>))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (<p className="text-sm text-muted-foreground text-center p-4">No recordings found for this event.</p>)}
          </CardContent>
        </TabsContent>
        <TabsContent value="medialogs">
          <CardContent className="p-0">
            {mediaLogs.length > 0 ? (
              <>
                <div className="flex justify-between items-center mb-4 px-2">
                    <h2 className="text-xl font-semibold px-2 text-white">Media Log</h2>
                    <Button variant="outline" size="sm" onClick={() => exportToCSV(mediaLogs, columns, "media_logs.csv")}>Export CSV</Button>
                </div>
                <div className="w-full overflow-x-auto max-h-[600px] overflow-y-auto text-white">
                  <Table className="border">
                    <TableHeader className="sticky top-0 bg-background z-10 shadow text-white">
                      <TableRow className="border text-white">
                        {columns.map((col) => (<TableHead key={col.key} className="border font-semibold whitespace-nowrap text-white px-3 py-2">{col.label}</TableHead>))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mediaLogs.map((row) => (<TableRow key={row.MLUniqueID} className="border">{columns.map((col) => (<TableCell key={col.key} className="border whitespace-nowrap max-w-[250px] truncate  px-3 py-2 ">{row[col.key] ?? " "}</TableCell>))}</TableRow>))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (<p className="text-sm text-muted-foreground text-center p-4">No media logs found for this event.</p>)}
          </CardContent>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DigitalRecordingDataTableView({
  recordingCode,
  eventCode,
  onPushSidebar,
}: {
  recordingCode: string;
  eventCode: string;
  onPushSidebar: (item: SidebarStackItem) => void;
}) {
  const [event, setEvent] = useState<any | null>(null);
  const [mediaLogs, setMediaLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const eventColumns = [ { key: "Yr", label: "Year" }, { key: "NewEventCategory", label: "New Event Category" }, { key: "FromDate", label: "From Date" }, { key: "ToDate", label: "To Date" }, { key: "EventName", label: "Event Name" }, { key: "EventCode", label: "Event Code" }, { key: "EventRemarks", label: "Event Remarks" }, ];
  const mediaLogColumns = [ { key: "Yr", label: "Year" }, { key: "EventDisplay", label: "Event Name - EventCode" }, { key: "EventCode", label: "Event Code" }, { key: "fkDigitalRecordingCode", label: "DR Code" }, { key: "ContentFrom", label: "Content From" }, { key: "ContentTo", label: "Content To" }, { key: "DetailSub", label: "Detail - SubDetail" }, { key: "EditingStatus", label: "Editing Status" }, { key: "FootageType", label: "Footage Type" }, { key: "fkOccasion", label: "Occasion" }, { key: "Segment Category", label: "Segment Category" }, { key: "CounterFrom", label: "Counter From" }, { key: "CounterTo", label: "Counter To" }, { key: "SubDuration", label: "Sub Duration" }, { key: "Language", label: "Language" }, { key: "SpeakerSinger", label: "Speaker / Singer" }, { key: "fkOrganization", label: "Organization" }, { key: "Designation", label: "Designation" }, { key: "fkCountry", label: "Country" }, { key: "fkState", label: "State" }, { key: "fkCity", label: "City" }, { key: "Venue", label: "Venue" }, { key: "MLUniqueID", label: "MLUniqueID" }, { key: "FootageSrNo", label: "FootageSrNo" }, { key: "LogSerialNo", label: "LogSerialNo" }, { key: "IsAudioRecorded", label: "IsAudioRecorded" }, { key: "AudioMP3Distribution", label: "AudioMP3Distribution" }, { key: "AudioWAVDistribution", label: "AudioWAVDistribution" }, { key: "AudioMP3DRCode", label: "AudioMP3DRCode" }, { key: "AudioWAVDRCode", label: "AudioWAVDRCode" }, { key: "FullWAVDRCode", label: "FullWAVDRCode" }, { key: "Remarks", label: "Remarks" }, { key: "IsStartPage", label: "IsStartPage" }, { key: "EndPage", label: "EndPage" }, { key: "IsInformal", label: "IsInformal" }, { key: "IsPPGNotPresent", label: "IsPPGNotPresent" }, { key: "Guidance", label: "Guidance" }, { key: "DiskMasterDuration", label: "DiskMasterDuration" }, { key: "EventRefRemarksCounters", label: "EventRefRemarksCounters" }, { key: "EventRefMLID", label: "EventRefMLID" }, { key: "ContentFromDetailCity", label: "Content - Detail - City" }, { key: "EventRefMLID2", label: "EventRefMLID2" }, { key: "DubbedLanguage", label: "DubbedLanguage" }, { key: "DubbingArtist", label: "DubbingArtist" }, { key: "HasSubtitle", label: "HasSubtitle" }, { key: "SubTitlesLanguage", label: "SubTitlesLanguage" }, { key: "EditingDeptRemarks", label: "EditingDeptRemarks" }, { key: "EditingType", label: "EditingType" }, { key: "BhajanType", label: "BhajanType" }, { key: "IsDubbed", label: "IsDubbed" }, { key: "NumberSource", label: "NumberSource" }, { key: "TopicSource", label: "TopicSource" }, { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp" }, { key: "LastModifiedBy", label: "LastModifiedBy" }, { key: "Synopsis", label: "Synopsis" }, { key: "LocationWithinAshram", label: "LocationWithinAshram" }, { key: "Keywords", label: "Keywords" }, { key: "Grading", label: "Grading" }, { key: "Segment Duration", label: "Segment Duration" }, { key: "TopicGivenBy", label: "TopicGivenBy" }, { key: "RecordingName", label: "Recording Name" }, { key: "Masterquality", label: "DR Master Quality" }, ];
 const mediaLogColumnRenderers: { [key: string]: (v: any, row: any) => React.ReactNode } = {
  'EventDisplay': (_v, row) => `${row.EventName||""}${row.EventName&&row.EventCode?" - ":""}${row.EventCode||row.fkEventCode||""}`,
  'DetailSub': (_v, row) => `${row.Detail||""}${row.Detail&&row.SubDetail?" - ":""}${row.SubDetail||""}`,
  'ContentFromDetailCity': (_v, row) =>
      row.ContentFromDetailCity
        ? row.ContentFromDetailCity
        : !row.EventRefMLID
        ? ""
        : [row.ContentFrom, row.Detail, row.fkCity].filter(Boolean).join(" - "),

  // 🔥 FIX: RecordingName renderer
  'RecordingName': (v, row) =>
      row.RecordingName ||
      row.Recording_Name ||
      row.recordingName ||
      "-",

  // existing category mappings…
  'EditingStatus': (v) => categoryTagRenderer(v),
  'FootageType': (v) => categoryTagRenderer(v),
  'fkOccasion': (v) => categoryTagRenderer(v),
  'Segment Category': (v) => categoryTagRenderer(v),
  'Language': (v) => categoryTagRenderer(v),
  'fkOrganization': (v) => categoryTagRenderer(v),
  'fkCountry': (v) => categoryTagRenderer(v),
  'fkState': (v) => categoryTagRenderer(v),
  'fkCity': (v) => categoryTagRenderer(v),
  'IsAudioRecorded': (v) => categoryTagRenderer(v),
  'SubTitlesLanguage': (v) => categoryTagRenderer(v),
  'EditingType': (v) => categoryTagRenderer(v),
  'BhajanType': (v) => categoryTagRenderer(v),
  'NumberSource': (v) => categoryTagRenderer(v),
  'TopicSource': (v) => categoryTagRenderer(v),
  'Keywords': (v) => categoryTagRenderer(v),
  'Masterquality': (v) => categoryTagRenderer(v),
};

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const requests = [ eventCode ? fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventCode)}`) : Promise.resolve(null), recordingCode ? fetch(`${API_BASE_URL}/newmedialog?fkDigitalRecordingCode=${encodeURIComponent(recordingCode)}`) : Promise.resolve(null), ];
        const [eventResponse, mediaLogsResponse] = await Promise.all(requests);
        if (eventResponse) { if (!eventResponse.ok) throw new Error(`Failed to fetch event (Status: ${eventResponse.status})`); const eventResult = await eventResponse.json(); setEvent(eventResult); }
        if (mediaLogsResponse) { if (!mediaLogsResponse.ok) throw new Error(`Failed to fetch media logs (Status: ${mediaLogsResponse.status})`); const mediaLogsResult = await mediaLogsResponse.json(); setMediaLogs(mediaLogsResult.data || []); }
      } catch (err: any) { setError(err.message); } finally { setLoading(false); }
    };
    fetchData();
  }, [recordingCode, eventCode]);

  if (loading) return <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    color: "white",
    fontSize: "14px",
  }}
>
  <Loader2
    style={{
      marginRight: "8px",
      width: "20px",
      height: "20px",
      animation: "spin 1s linear infinite",
    }}
  />

  {/* Inline keyframe animation */}
  <style>
    {`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}
  </style>

  Loading data...
</div>
;
  if (error) return <div className="text-destructive p-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</div>;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="mb-4"><TabsTrigger value="medialogs">Media Log</TabsTrigger><TabsTrigger value="events">Event</TabsTrigger></TabsList>
        <TabsContent value="events">
          <CardContent className="p-0">
            {event ? (<> <div className="flex justify-between items-center mb-4 px-2"><h2 className="text-xl font-semibold px-2 text-white">Event Details</h2><Button variant="outline" size="sm" onClick={() => exportToCSV([event], eventColumns, "event.csv")}>Export CSV</Button></div> <div className="w-full overflow-x-auto max-h-[600px] overflow-y-auto text-white"><Table className="border"><TableHeader className="sticky top-0 bg-background z-10 shadow"><TableRow className="border">{eventColumns.map((col) => (<TableHead key={col.key} className="border whitespace-nowrap text-white px-3 py-2">{col.label}</TableHead>))}</TableRow></TableHeader><TableBody><TableRow className="border">{eventColumns.map((col) => (<TableCell key={col.key} className="border whitespace-nowrap px-3 py-2">{col.key === 'NewEventCategory' ? categoryTagRenderer(event[col.key]) : event[col.key] ?? " "}</TableCell>))}</TableRow></TableBody></Table></div> </>) : (<p className="text-sm text-muted-foreground text-center p-4">No event found for this recording.</p>)}
          </CardContent>
        </TabsContent>
        <TabsContent value="medialogs">
          <CardContent className="p-0">
            {mediaLogs.length > 0 ? (<> <div className="flex justify-between items-center mb-4 px-2"><h2 className="text-xl font-semibold px-2 text-white">Media Log</h2><Button variant="outline" size="sm" onClick={() => exportToCSV(mediaLogs, mediaLogColumns, "media_logs.csv")}>Export CSV</Button></div> <div className="w-full overflow-x-auto max-h-[600px] overflow-y-auto text-white"><Table className="border"><TableHeader className="sticky top-0 bg-background z-10 shadow"><TableRow className="border">{mediaLogColumns.map((col) => (<TableHead key={col.key} className="border whitespace-nowrap text-white px-3 py-2">{col.label}</TableHead>))}</TableRow></TableHeader><TableBody>{mediaLogs.map((log, idx) => (<TableRow key={log.MLUniqueID || idx} className="border">{mediaLogColumns.map((col) => (<TableCell key={col.key} className="border whitespace-nowrap px-3 py-2 max-w-[250px] truncate">{mediaLogColumnRenderers[col.key] ? mediaLogColumnRenderers[col.key](log[col.key], log) : log[col.key] ?? " "}</TableCell>))}</TableRow>))}</TableBody></Table></div> </>) : (<p className="text-sm text-muted-foreground text-center p-4">No media logs found for this recording.</p>)}
          </CardContent>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MediaLogDataTableView({
  recordingCode,
  eventCode,
  mlid
}: {
  recordingCode?: string;
  eventCode?: string;
  mlid?: string;
}) {
const [recordings, setRecordings] = useState<any[]>([]);
  const [event, setEvent] = useState<any | null>(null);
  const [auxList, setAuxList] = useState<any[]>([]); // <-- Add this line
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // ---------------- RECORDING COLUMNS ----------------
  const recordingColumns = [
    { key: "Yr", label: "Year", sortable: true, editable: true },
    { key: "EventName", label: "Event Name", sortable: true, editable: true },
    { key: "fkEventCategory", label: "Event Category", sortable: true, render: categoryTagRenderer, editable: true },
    { key: "fkEventCode", label: "fkEventCode", sortable: true, editable: true },
    { key: "RecordingName", label: "RecordingName", sortable: true, editable: true },
    { key: "RecordingCode", label: "RecordingCode", sortable: true, editable: true },
    { key: "Duration", label: "Duration", sortable: true, editable: true },
    { key: "DistributionDriveLink", label: "DistributionDriveLink", sortable: true, editable: true },
    { key: "BitRate", label: "BitRate", sortable: true, editable: true },
    { key: "Dimension", label: "Dimension", sortable: true, render: categoryTagRenderer, editable: true },
    { key: "Masterquality", label: "Masterquality", sortable: true, render: categoryTagRenderer, editable: true },
    { key: "fkMediaName", label: "fkMediaName", sortable: true, render: categoryTagRenderer, editable: true },
    { key: "Filesize", label: "Filesize", sortable: true, editable: true },
    { key: "FilesizeInBytes", label: "FilesizeInBytes", sortable: true, editable: true },
    { key: "NoOfFiles", label: "NoOfFiles", sortable: true, editable: true },
    { key: "RecordingRemarks", label: "RecordingRemarks", sortable: true, editable: true },
    { key: "CounterError", label: "CounterError", sortable: true, editable: true },
    { key: "ReasonError", label: "ReasonError", sortable: true, editable: true },
    { key: "MasterProductTitle", label: "MasterProductTitle", sortable: true, editable: true },
    { key: "fkDistributionLabel", label: "fkDistributionLabel", sortable: true, render: categoryTagRenderer, editable: true },
    { key: "ProductionBucket", label: "ProductionBucket", sortable: true, render: categoryTagRenderer, editable: true },
    { key: "fkDigitalMasterCategory", label: "fkDigitalMasterCategory", sortable: true, render: categoryTagRenderer, editable: true },
    { key: "AudioBitrate", label: "AudioBitrate", sortable: true, editable: true },
    { key: "AudioTotalDuration", label: "AudioTotalDuration", sortable: true, editable: true },
    { key: "QcRemarksCheckedOn", label: "QcRemarksCheckedOn", sortable: true, editable: true },
    { key: "PreservationStatus", label: "PreservationStatus", sortable: true, render: categoryTagRenderer, editable: true },
    { key: "QCSevak", label: "QCSevak", sortable: true, editable: true },
    { key: "QcStatus", label: "QcStatus", sortable: true, editable: true },
    { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true, editable: true },
    { key: "SubmittedDate", label: "SubmittedDate", sortable: true, editable: true },
    { key: "PresStatGuidDt", label: "PresStatGuidDt", sortable: true, editable: true },
    { key: "InfoOnCassette", label: "InfoOnCassette", sortable: true, editable: true },
    { key: "IsInformal", label: "IsInformal", sortable: true, editable: true },
    { key: "AssociatedDR", label: "AssociatedDR", sortable: true, editable: true },
    
  ];

  // ---------------- EVENT COLUMNS ----------------
  const auxColumns = [
  { key: "new_auxid", label: "New aux id", sortable: true, editable: true },
  { key: "AuxCode", label: "AuxCode", sortable: true, editable: true },
  { key: "AuxFileType", label: "AuxFileType", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "AuxLanguage", label: "AuxLanguage", sortable: true, editable: true },
  { key: "fkMLID", label: "fkMLID", sortable: true, editable: true },
  { key: "AuxTopic", label: "AuxTopic", sortable: true, editable: true },
  { key: "NotesRemarks", label: "NotesRemarks", sortable: true, editable: true },
  { key: "GoogleDriveLink", label: "GoogleDriveLink", sortable: true, editable: true },
  { key: "NoOfFiles", label: "NoOfFiles", sortable: true, editable: true },
  { key: "FilesizeBytes", label: "FilesizeBytes", sortable: true, editable: true },
  { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true, editable: true },
  { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true, editable: true },
  { key: "ProjFileCode", label: "ProjFileCode", sortable: true, editable: true },
  { key: "ProjFileSize", label: "ProjFileSize", sortable: true, editable: true },
  { key: "ProjFileName", label: "ProjFileName", sortable: true, editable: true },
  { key: "SRTLink", label: "SRTLink", sortable: true, editable: true },
  { key: "CreatedOn", label: "CreatedOn", sortable: true, editable: true },
  { key: "CreatedBy", label: "CreatedBy", sortable: true, editable: true },
  { key: "ModifiedOn", label: "ModifiedOn", sortable: true, editable: true },
  { key: "ModifiedBy", label: "ModifiedBy", sortable: true, editable: true },
];


  // ---------------- FETCH DATA ----------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

       const recordingRequest = recordingCode
  ? fetch(`${API_BASE_URL}/digitalrecording?RecordingCode=${encodeURIComponent(recordingCode)}`)
  : eventCode
  ? fetch(`${API_BASE_URL}/digitalrecording?fkEventCode=${encodeURIComponent(eventCode)}`)
  : Promise.resolve(null);


        const eventRequest = eventCode
          ? fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventCode)}`)
          : Promise.resolve(null);

      const auxRequest = mlid
  ? fetch(`${API_BASE_URL}/auxfiles?fkMLID=${encodeURIComponent(mlid)}`)
  : Promise.resolve(null);



        const [recordingResponse, eventResponse, auxResponse] = await Promise.all([
          recordingRequest,
          eventRequest,
          auxRequest,
        ]);

        if (recordingResponse) {
          if (!recordingResponse.ok) throw new Error(`Failed to fetch recordings`);
          const result = await recordingResponse.json();
          setRecordings(result.data || []);
        }

        if (eventResponse) {
          if (!eventResponse.ok) throw new Error(`Failed to fetch event`);
          const eventData = await eventResponse.json();
          setEvent(eventData || null);
        }

        if (auxResponse) {
          if (!auxResponse.ok) throw new Error(`Failed to fetch aux data`);
          const auxData = await auxResponse.json();
          setAuxList(auxData.data || []);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventCode, recordingCode, mlid]);

  if (loading)
    return (
     <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    color: "white",
    fontSize: "14px",
  }}
>
  <Loader2
    style={{
      marginRight: "8px",
      width: "16px",
      height: "16px",
      animation: "spin 1s linear infinite",
    }}
  />

  <style>
    {`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}
  </style>

  Loading related data...
</div>

    );

  if (error)
    return (
      <div className="text-destructive p-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" /> {error}
      </div>
    );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="recordings">
        <TabsList className="mb-4">
  <TabsTrigger value="recordings">Digital Recordings</TabsTrigger>
  <TabsTrigger value="aux">AUX</TabsTrigger>
</TabsList>


    {/* RECORDINGS TAB */}
<TabsContent value="recordings">
          <CardContent className="p-0">
            {recordings.length > 0 ? (
              <>
                 <div className="flex justify-between items-center mb-4 px-2">
                    <h2 className="text-xl font-semibold px-2 text-white">Digital Recordings</h2>
                    <Button variant="outline" size="sm" onClick={() => exportToCSV(recordings, [ { key: "Yr", label: "Year" }, { key: "EventName", label: "Event Name" }, { key: "fkEventCategory", label: "Event Category" }, { key: "fkEventCode", label: "fkEventCode" }, { key: "RecordingName", label: "Recording Name" }, { key: "RecordingCode", label: "Recording Code" }, { key: "Duration", label: "Duration" }, { key: "DistributionDriveLink", label: "Distribution Drive Link" }, { key: "BitRate", label: "Bit Rate" }, { key: "Dimension", label: "Dimension" }, { key: "Masterquality", label: "Masterquality" }, { key: "fkMediaName", label: "fkMediaName" }, { key: "Filesize", label: "Filesize" }, { key: "FilesizeInBytes", label: "FilesizeInBytes" }, { key: "NoOfFiles", label: "No Of Files" }, { key: "RecordingRemarks", label: "Recording Remarks" }, { key: "CounterError", label: "Counter Error" }, { key: "ReasonError", label: "Reason Error" }, { key: "MasterProductTitle", label: "Master Product Title" }, { key: "fkDistributionLabel", label: "fkDistributionLabel" }, { key: "ProductionBucket", label: "Production Bucket" }, { key: "fkDigitalMasterCategory", label: "fkDigitalMasterCategory" }, { key: "AudioBitrate", label: "Audio Bitrate" }, { key: "AudioTotalDuration", label: "Audio Total Duration" }, { key: "QcRemarksCheckedOn", label: "Qc Remarks Checked On" }, { key: "PreservationStatus", label: "Preservation Status" }, { key: "QCSevak", label: "QC Sevak" }, { key: "QcStatus", label: "Qc Status" }, { key: "LastModifiedTimestamp", label: "Last Modified Timestamp" }, { key: "SubmittedDate", label: "Submitted Date" }, { key: "PresStatGuidDt", label: "Pres Stat Guid Dt" }, { key: "InfoOnCassette", label: "Info On Cassette" }, { key: "IsInformal", label: "Is Informal" }, { key: "AssociatedDR", label: "Associated DR" }, { key: "Teams", label: "Teams" }, ], "digital_recordings.csv")}>Export CSV</Button>
                </div>
                <div className="w-full overflow-x-auto max-h-[600px] overflow-y-auto text-white">
                  <Table className="border">
                    <TableHeader className="sticky top-0 bg-background z-10 shadow text-white">
                      <TableRow className="border"><TableHead className="border whitespace-nowrap text-white px-3 py-2 ">Year</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Event Name</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Event Category</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">fkEventCode</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Recording Name</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Recording Code</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Duration</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Distribution Drive Link</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Bit Rate</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Dimension</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Masterquality</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">fkMediaName</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Filesize</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">FilesizeInBytes</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">No Of Files</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Recording Remarks</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Counter Error</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Reason Error</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Master Product Title</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">fkDistributionLabel</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Production Bucket</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">fkDigitalMasterCategory</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Audio Bitrate</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Audio Total Duration</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Qc Remarks Checked On</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Preservation Status</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">QC Sevak</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Qc Status</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Last Modified Timestamp</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Submitted Date</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Pres Stat Guid Dt</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Info On Cassette</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Is Informal</TableHead><TableHead className="border whitespace-nowrap text-white px-3 py-2">Associated DR</TableHead>
</TableRow>
                    </TableHeader>
                    <TableBody>
                      {recordings.map((rec) => (<TableRow key={rec.RecordingCode} className="border"><TableCell className="border px-3 py-2">{rec.Yr}</TableCell><TableCell className="border px-3 py-2">{rec.EventName}</TableCell><TableCell className="border px-3 py-2">{categoryTagRenderer(rec.fkEventCategory)}</TableCell><TableCell className="border px-3 py-2">{rec.fkEventCode}</TableCell><TableCell className="border px-3 py-2">{rec.RecordingName}</TableCell><TableCell className="border px-3 py-2">{rec.RecordingCode}</TableCell><TableCell className="border px-3 py-2">{rec.Duration}</TableCell>
                      <TableCell className="border px-3 py-2">{rec.DistributionDriveLink }</TableCell><TableCell className="border px-3 py-2">{rec.BitRate}</TableCell><TableCell className="border px-3 py-2">{rec.Dimension}</TableCell><TableCell className="border px-3 py-2">{rec.Masterquality}</TableCell><TableCell className="border px-3 py-2">{rec.fkMediaName}</TableCell><TableCell className="border px-3 py-2">{rec.Filesize}</TableCell><TableCell className="border px-3 py-2">{rec.FilesizeInBytes}</TableCell><TableCell className="border px-3 py-2">{rec.NoOfFiles}</TableCell><TableCell className="border px-3 py-2">{rec.RecordingRemarks}</TableCell><TableCell className="border px-3 py-2">{rec.CounterError}</TableCell><TableCell className="border px-3 py-2">{rec.ReasonError}</TableCell><TableCell className="border px-3 py-2">{rec.MasterProductTitle}</TableCell><TableCell className="border px-3 py-2">{rec.fkDistributionLabel}</TableCell><TableCell className="border px-3 py-2">{rec.ProductionBucket}</TableCell><TableCell className="border px-3 py-2">{rec.fkDigitalMasterCategory}</TableCell><TableCell className="border px-3 py-2">{rec.AudioBitrate}</TableCell><TableCell className="border px-3 py-2">{rec.AudioTotalDuration}</TableCell><TableCell className="border px-3 py-2">{rec.QcRemarksCheckedOn}</TableCell><TableCell className="border px-3 py-2">{rec.PreservationStatus}</TableCell><TableCell className="border px-3 py-2">{rec.QCSevak}</TableCell><TableCell className="border px-3 py-2">{rec.QcStatus}</TableCell><TableCell className="border px-3 py-2">{rec.LastModifiedTimestamp}</TableCell><TableCell className="border px-3 py-2">{rec.SubmittedDate}</TableCell><TableCell className="border px-3 py-2">{rec.PresStatGuidDt}</TableCell><TableCell className="border px-3 py-2">{rec.InfoOnCassette}</TableCell><TableCell className="border px-3 py-2">{rec.IsInformal}</TableCell><TableCell className="border px-3 py-2">{rec.AssociatedDR}</TableCell>
                      </TableRow>))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (<p className="text-sm text-muted-foreground text-center p-4">No recordings found for this event.</p>)}
          </CardContent>
        </TabsContent>

        {/* AUX TAB */}
      <TabsContent value="aux">
  <CardContent className="p-0">
    {auxList.length > 0 ? (
      <>
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-xl font-semibold px-2 text-white">AUX Files</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(auxList, auxColumns, "aux_files.csv")}
          >
            Export CSV
          </Button>
        </div>
        <div className="w-full overflow-x-auto max-h-[600px] overflow-y-auto text-white">
        <Table className="text-white pd-2 py-3">
          <TableHeader className=" text-white">
            <TableRow className=" text-white">
              {auxColumns.map(col => (
                <TableHead className=" text-white px-3 py-2" key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {auxList.map((row, idx) => (
              <TableRow key={idx}>
                {auxColumns.map(col => (
                  <TableCell key={col.key} className="border whitespace-nowrap px-3 py-2 text-white">
                    {col.render ? col.render(row[col.key]) : row[col.key] ?? " "}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </>
    ) : (
      <p className="text-sm text-muted-foreground text-center p-4">
        No AUX data found.
      </p>
    )}
  </CardContent>
</TabsContent>

      </Tabs>
    </div>
  );
}


function AuxMediaLogDataTableView({
  mlid,
  onPushSidebar,
}: {
  mlid: string;
  onPushSidebar: (item: SidebarStackItem) => void;
}) {
  const [mediaLogs, setMediaLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------
  // 🔥 Column Renderers (Same Logic From Parent Table)
  // -----------------------------
  const mediaLogColumnRenderers: {
    [key: string]: (v: any, row: any) => React.ReactNode;
  } = {
    EventDisplay: (_v, row) =>
      `${row.EventName || ""}${
        row.EventName && row.EventCode ? " - " : ""
      }${row.EventCode || row.fkEventCode || ""}`,

    DetailSub: (_v, row) =>
      `${row.Detail || ""}${
        row.Detail && row.SubDetail ? " - " : ""
      }${row.SubDetail || ""}`,

    ContentFromDetailCity: (_v, row) =>
      row.ContentFromDetailCity
        ? row.ContentFromDetailCity
        : !row.EventRefMLID
        ? ""
        : [row.ContentFrom, row.Detail, row.fkCity]
            .filter(Boolean)
            .join(" - "),

    RecordingName: (v, row) =>
      row.RecordingName ||
      row.Recording_Name ||
      row.recordingName ||
      "-",

    // CATEGORY MAPPINGS
    EditingStatus: (v) => categoryTagRenderer(v),
    FootageType: (v) => categoryTagRenderer(v),
    fkOccasion: (v) => categoryTagRenderer(v),
    "Segment Category": (v) => categoryTagRenderer(v),
    Language: (v) => categoryTagRenderer(v),
    fkOrganization: (v) => categoryTagRenderer(v),
    fkCountry: (v) => categoryTagRenderer(v),
    fkState: (v) => categoryTagRenderer(v),
    fkCity: (v) => categoryTagRenderer(v),
    IsAudioRecorded: (v) => categoryTagRenderer(v),
    SubTitlesLanguage: (v) => categoryTagRenderer(v),
    EditingType: (v) => categoryTagRenderer(v),
    BhajanType: (v) => categoryTagRenderer(v),
    NumberSource: (v) => categoryTagRenderer(v),
    TopicSource: (v) => categoryTagRenderer(v),
    Keywords: (v) => categoryTagRenderer(v),
    Masterquality: (v) => categoryTagRenderer(v),
  };

  // -----------------------------
  // 🧾 TABLE COLUMNS
  // -----------------------------
  const columns = [
    { key: "Yr", label: "Year" },
    { key: "EventDisplay", label: "Event Name - EventCode" },
    { key: "EventCode", label: "Event Code" },
    { key: "fkDigitalRecordingCode", label: "DR Code" },
    { key: "ContentFrom", label: "Content From" },
    { key: "ContentTo", label: "Content To" },
    { key: "DetailSub", label: "Detail - SubDetail" },
    { key: "EditingStatus", label: "Editing Status" },
    { key: "FootageType", label: "Footage Type" },
    { key: "fkOccasion", label: "Occasion" },
    { key: "Segment Category", label: "Segment Category" },
    { key: "CounterFrom", label: "Counter From" },
    { key: "CounterTo", label: "Counter To" },
    { key: "SubDuration", label: "Sub Duration" },
    { key: "Language", label: "Language" },
    { key: "SpeakerSinger", label: "Speaker / Singer" },
    { key: "fkOrganization", label: "Organization" },
    { key: "Designation", label: "Designation" },
    { key: "fkCountry", label: "Country" },
    { key: "fkState", label: "State" },
    { key: "fkCity", label: "City" },
    { key: "Venue", label: "Venue" },
    { key: "MLUniqueID", label: "MLUniqueID" },
    { key: "FootageSrNo", label: "FootageSrNo" },
    { key: "LogSerialNo", label: "LogSerialNo" },
    { key: "IsAudioRecorded", label: "IsAudioRecorded" },
    { key: "AudioMP3Distribution", label: "AudioMP3Distribution" },
    { key: "AudioWAVDistribution", label: "AudioWAVDistribution" },
    { key: "AudioMP3DRCode", label: "AudioMP3DRCode" },
    { key: "AudioWAVDRCode", label: "AudioWAVDRCode" },
    { key: "FullWAVDRCode", label: "FullWAVDRCode" },
    { key: "Remarks", label: "Remarks" },
    { key: "IsStartPage", label: "IsStartPage" },
    { key: "EndPage", label: "EndPage" },
    { key: "IsInformal", label: "IsInformal" },
    { key: "IsPPGNotPresent", label: "IsPPGNotPresent" },
    { key: "Guidance", label: "Guidance" },
    { key: "DiskMasterDuration", label: "DiskMasterDuration" },
    { key: "EventRefRemarksCounters", label: "EventRefRemarksCounters" },
    { key: "EventRefMLID", label: "EventRefMLID" },
    { key: "ContentFromDetailCity", label: "Content - Detail - City" },
    { key: "EventRefMLID2", label: "EventRefMLID2" },
    { key: "DubbedLanguage", label: "DubbedLanguage" },
    { key: "DubbingArtist", label: "DubbingArtist" },
    { key: "HasSubtitle", label: "HasSubtitle" },
    { key: "SubTitlesLanguage", label: "SubTitlesLanguage" },
    { key: "EditingDeptRemarks", label: "EditingDeptRemarks" },
    { key: "EditingType", label: "EditingType" },
    { key: "BhajanType", label: "BhajanType" },
    { key: "IsDubbed", label: "IsDubbed" },
    { key: "NumberSource", label: "NumberSource" },
    { key: "TopicSource", label: "TopicSource" },
    { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp" },
    { key: "LastModifiedBy", label: "LastModifiedBy" },
    { key: "Synopsis", label: "Synopsis" },
    { key: "LocationWithinAshram", label: "LocationWithinAshram" },
    { key: "Keywords", label: "Keywords" },
    { key: "Grading", label: "Grading" },
    { key: "Segment Duration", label: "Segment Duration" },
    { key: "TopicGivenBy", label: "TopicGivenBy" },
    { key: "RecordingName", label: "Recording Name" },
    { key: "Masterquality", label: "DR Master Quality" },
  ];

  // -----------------------------
  // 📡 FETCH DATA
  // -----------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Step 1: Fetch the specific media log by MLID to get fkDigitalRecordingCode and fkEventCode
        const mediaLogResponse = await fetch(
          `${API_BASE_URL}/newmedialog/${encodeURIComponent(mlid)}`
        );

        if (!mediaLogResponse.ok) {
          throw new Error(
            `Failed to fetch media log (Status: ${mediaLogResponse.status})`
          );
        }

        const mediaLogResult = await mediaLogResponse.json();
        const mediaLog = Array.isArray(mediaLogResult)
          ? mediaLogResult[0]
          : mediaLogResult.data
          ? mediaLogResult.data[0]
          : mediaLogResult;

        if (!mediaLog) {
          throw new Error("Media log not found");
        }

        const recordingCode = mediaLog.fkDigitalRecordingCode;
        const eventCode = mediaLog.fkEventCode || mediaLog.EventCode;

        // Step 2: Fetch all media logs for the recording code (same as parent logic)
        const mediaLogsResponse = await fetch(
          `${API_BASE_URL}/newmedialog?fkDigitalRecordingCode=${encodeURIComponent(recordingCode)}`
        );

        if (!mediaLogsResponse.ok) {
          throw new Error(
            `Failed to fetch media logs (Status: ${mediaLogsResponse.status})`
          );
        }

        const mediaLogsResult = await mediaLogsResponse.json();
        const allMediaLogs = mediaLogsResult.data || [];

        // Step 3: Filter to get the specific media log by MLID
        const filteredMediaLog = allMediaLogs.find(
          (log: any) => log.MLUniqueID === mlid
        );

        if (!filteredMediaLog) {
          throw new Error("Media log not found in recording");
        }

        // Step 4: Fetch the event if eventCode exists (same as parent logic)
        let eventData = {};
        if (eventCode) {
          const eventResponse = await fetch(
            `${API_BASE_URL}/events/${encodeURIComponent(eventCode)}`
          );
          if (eventResponse.ok) {
            const eventResult = await eventResponse.json();
            eventData = eventResult; // Merge Yr, EventName, etc.
          }
        }

        // Step 5: Merge the filtered media log with event data
        const mergedMediaLog = { ...filteredMediaLog, ...eventData };
        setMediaLogs([mergedMediaLog]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (mlid) fetchData();
  }, [mlid]);

  // -----------------------------
  // LOADING
  // -----------------------------
  if (loading)
    return (
      <>
      {/* Inline keyframes */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Loader UI */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          color: "white",
        }}
      >
        <div
          style={{
            marginRight: "8px",
            width: "20px",
            height: "20px",
            border: "2px solid white",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        ></div>

        Loading media log data...
      </div>
    </>
    );

  // -----------------------------
  // ERROR
  // -----------------------------
  if (error)
    return (
      <div className="flex items-center gap-2 text-destructive p-4">
        <AlertTriangle className="w-4 h-4" /> {error}
      </div>
    );

  // -----------------------------
  // TABLE RENDER
  // -----------------------------
 return (
  <Tabs defaultValue="medialogs" className="w-full">
    {/* Only one tab */}
    <TabsList className=" mb-4">
      <TabsTrigger value="medialogs">Media Logs</TabsTrigger>
    </TabsList>

    <TabsContent value="medialogs" className="p-0">
      {mediaLogs.length > 0 ? (
        <>
          <div className="flex justify-end items-center mb-4 px-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(mediaLogs, columns, "media_logs.csv")}
            >
              Export CSV
            </Button>
          </div>

          <div className="w-full overflow-x-auto max-h-[600px] overflow-y-auto text-white">
            <Table className="border">
              <TableHeader className="sticky top-0 bg-background z-10 shadow text-white">
                <TableRow className="border text-white">
                  {columns.map((col) => (
                    <TableHead
                      key={col.key}
                      className="border text-white whitespace-nowrap px-3 py-2 font-semibold"
                    >
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {mediaLogs.map((row, idx) => (
                  <TableRow key={row.MLUniqueID || idx} className="border">
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className="border whitespace-nowrap max-w-[250px] truncate px-3 py-2"
                      >
                        {mediaLogColumnRenderers[col.key]
                          ? mediaLogColumnRenderers[col.key](row[col.key], row)
                          : row[col.key] ?? " "}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground text-center p-4">
          No media log data found for this MLID.
        </p>
      )}
    </TabsContent>
  </Tabs>
);
}


// 1. EXTRACTED COMPONENT
function AuxDetailsView({
  data,
  hasAccess,
  onPushSidebar,
}: {
  data: any;
  hasAccess: (resource: string, access?: 'read' | 'write') => boolean;
  onPushSidebar: (item: SidebarStackItem) => void;
}) {
  // Hooks are now safe here because this is a valid Component
  const [isEditingSRT, setIsEditingSRT] = useState(false);
  const [srtLink, setSrtLink] = useState(data.SRTLink || "");
  const [isSaving, setIsSaving] = useState(false);

  const renderIcon = (icon: React.ReactNode, gradient: string) => (
    <div
      className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${gradient} flex items-center justify-center`}
    >
      {icon}
    </div>
  );

  const handleSaveSRTLink = async () => {
    setIsSaving(true);
    const savingToast = toast.loading("Saving SRT Link...");

    try {
      const response = await fetch(
        `${API_BASE_URL}/aux/${encodeURIComponent(data.new_auxid)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ SRTLink: srtLink }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update SRT Link");
      }

      data.SRTLink = srtLink;

      toast.success("SRT Link updated successfully!", { id: savingToast });
      setIsEditingSRT(false);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: savingToast });
      console.error("Error updating SRT Link:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditingSRT(false);
    setSrtLink(data.SRTLink || "");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        {renderIcon(
          <FileText className="w-8 h-8 text-white" />,
          "from-purple-500 to-red-600"
        )}
        <h3 className="text-xl font-bold">
          {data.AuxTopic || "Auxiliary File"}
        </h3>
        <p className="text-muted-foreground">ID: {data.new_auxid}</p>
        <Badge className="mt-2">{data.AuxFileType}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg px-2">File Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          {data.fkMLID && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                background: "rgba(59,130,246,0.12)",
                borderRadius: "10px",
                marginTop: "10px",
              }}
            >
              <span
                style={{
                  color: "var(--muted-foreground)",
                  fontWeight: 500,
                  fontSize: "14px",
                }}
              >
                fkMLID
              </span>

           
{data.fkMLID && hasAccess("Media Log", "read") ? (
  <Button
    size="sm"
    variant="ghost"
    onClick={() =>
      onPushSidebar({
        type: "aux_data",
        data: { mlid: data.fkMLID },
        title: `Media Log Table for MLID ${data.fkMLID}`,
      })
    }
    style={{
      padding: "4px 10px",
      fontSize: "14px",
      fontWeight: 600,
      background: "#1e40af",
      color: "#fff",
      borderRadius: "6px",
      display: "inline-flex",
      alignItems: "center",
      border: "none",
      cursor: "pointer",
    }}
  >
    {data.fkMLID}
    <ChevronRight style={{ width: 16, height: 16, marginLeft: 6 }} />
  </Button>
) : (
  <span
    style={{
      fontSize: "14px",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      color: "var(--muted-foreground)",
      fontWeight: 500,
    }}
  >
    <Lock style={{ width: 12, height: 12 }} />
    {data.fkMLID}
  </span>
)}
            </div>
          )}

          {/* Simple reusable row for read-only fields */}
          <div className="flex justify-between items-start gap-4">
            <span className="text-muted-foreground flex-shrink-0">
              Language
            </span>
            <Badge variant="secondary">{data.AuxLanguage}</Badge>
          </div>

          <div className="flex justify-between items-start gap-4">
            <span className="text-muted-foreground flex-shrink-0">
              File Name
            </span>
            <span className="font-medium text-right break-words">
              {data.ProjFileName}
            </span>
          </div>

          <div className="flex justify-between items-start gap-4">
            <span className="text-muted-foreground flex-shrink-0">
              File Size
            </span>
            <span className="font-medium">
              {data.FilesizeBytes
                ? `${(data.FilesizeBytes / 1024 / 1024).toFixed(2)} MB`
                : undefined}
            </span>
          </div>

          <Separator />
          {data.GoogleDriveLink && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Google Drive</span>
              <Button size="sm" variant="ghost" asChild>
                <a
                  href={data.GoogleDriveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Link <ExternalLink className="w-3 h-3 ml-2" />
                </a>
              </Button>
            </div>
          )}

          <div className="flex justify-between items-center gap-2">
            <span className="text-muted-foreground flex-shrink-0">
              SRT Link
            </span>

            {isEditingSRT ? (
              <div className="flex items-center gap-2 w-full max-w-[220px]">
                <Input
                  type="text"
                  value={srtLink}
                  onChange={(e) => setSrtLink(e.target.value)}
                  placeholder="Enter URL..."
                  className="h-8 text-sm"
                  disabled={isSaving}
                />
                <Button
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={handleSaveSRTLink}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {srtLink ? (
                  <Button size="sm" variant="ghost" asChild>
                    <a
                      href={srtLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Link <ExternalLink className="w-3 h-3 ml-2" />
                    </a>
                  </Button>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Not set
                  </span>
                )}
                {hasAccess("Aux Files", "write") && (
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => setIsEditingSRT(true)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {data.NotesRemarks && (
            <div>
              <span className="text-muted-foreground">Remarks</span>
              <p className="mt-1 text-sm bg-muted p-3 rounded-lg">
                {data.NotesRemarks}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg px-2">Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="flex justify-between items-start gap-4">
            <span className="text-muted-foreground flex-shrink-0">
              Modified By
            </span>
            <Badge variant="secondary">{data.ModifiedBy}</Badge>
          </div>
          <div className="flex justify-between items-start gap-4">
            <span className="text-muted-foreground flex-shrink-0">
              Modified On
            </span>
            <span className="font-medium text-right break-words">
              {data.ModifiedOn}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
// =================================================================
// MAIN SIDEBAR COMPONENT
// =================================================================
export function DetailsSidebar({
  onClose,
  onPopSidebar,
  data,
  type,
  title,
  onPushSidebar,
  zIndex,
  positionOffset,
  sidebarStack, // <-- Add sidebarStack prop
}: DetailsSidebarProps & { sidebarStack: SidebarStackItem[] }) {
  const { user } = useAuth();

  const hasAccess = useMemo(() => (resourceName: string, accessLevel: 'read' | 'write' = 'read'): boolean => {
    if (!user) return false;
    if (user.role === 'Admin' || user.role === 'Owner') return true;
    const permission = user.permissions.find((p) => p.resource === resourceName);
    if (!permission) return false;
    return permission.actions.includes(accessLevel);
  }, [user]);

  const FieldRow = ({ label, value, children }: { label: string; value?: any; children?: React.ReactNode }) => {
    if (value === undefined || value === null || String(value).trim() === "" || String(value).toUpperCase() === "N/A") return null;
    return (
      <div className="flex justify-between items-start gap-4">
        <span className="text-muted-foreground flex-shrink-0">{label}</span>
        <span className="font-medium text-right break-words">{children ?? value}</span>
      </div>
    );
  };
  
  if (!data) return null;
  
  const renderIcon = (icon: React.ReactNode, gradient: string) => (
    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${gradient} flex items-center justify-center`}>{icon}</div>
  );
  
  const renderContent = () => {
    switch (type) {
      case "event":
        return (
          <div className="space-y-6">
            <div className="text-center">
              {renderIcon(<Calendar className="w-8 h-8 text-white" />, "from-blue-500 to-purple-600")}
              <h3 className="text-xl font-bold">{data.EventName}</h3>
              <p className="text-muted-foreground">Event ID: {data.EventID}</p>
              <Badge className="mt-2">{data.NewEventCategory || "N/A"}</Badge>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-lg px-2">Event Details</CardTitle></CardHeader>
              <CardContent className="space-y-4 p-4">
               {data.EventCode && (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 12px",
      background: "rgba(59,130,246,0.08)", // soft blue highlight
      borderRadius: "10px",
      marginTop: "10px",
    }}
  >
    {/* Label */}
    <span style={{ color: "var(--muted-foreground)" }}>Event Code</span>

    {/* Value */}
    {hasAccess("Digital Recordings", "read") || hasAccess("Media Log", "read") ? (
      <button
        onClick={() =>
          onPushSidebar({
            type: "event_data_table",
            data: { eventCode: data.EventCode },
            title: `Data for ${data.EventCode}`,
          })
        }
        style={{
          padding: "4px 10px",
          fontSize: "14px",
          fontWeight: 600,
          background: "#1e40af",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          display: "inline-flex",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        {data.EventCode}
        <ChevronRight style={{ width: 16, height: 16, marginLeft: 6 }} />
      </button>
    ) : (
      <span
        style={{
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          color: "var(--muted-foreground)",
          fontWeight: 500,
        }}
      >
        <Lock style={{ width: 12, height: 12 }} />
        {data.EventCode}
      </span>
    )}
  </div>
)}

                <FieldRow label="Year" value={data.Yr} />
                <FieldRow label="EventName" value={data.EventName}><span className="font-medium text-right break-words">{data.EventName}</span></FieldRow>
                <Separator />
                <FieldRow label="From Date" value={data.FromDate}><span className="font-medium">{data.FromDate ? new Date(data.FromDate).toLocaleDateString() : undefined}</span></FieldRow>
                <FieldRow label="To Date" value={data.ToDate}><span className="font-medium">{data.ToDate ? new Date(data.ToDate).toLocaleDateString() : undefined}</span></FieldRow>
                <Separator />
                <div><span className="text-muted-foreground">Remarks</span><p className="mt-1 text-sm bg-muted p-3 rounded-lg">{data.EventRemarks || "No remarks provided."}</p></div>
              </CardContent>
            </Card>
           <Card className="w-full">
            <CardHeader><CardTitle className="text-lg px-2">Metadata</CardTitle></CardHeader>
            <CardContent className="space-y-4 p-4"><FieldRow label="LastModifiedBy" value={data.LastModifiedBy}><Badge variant="secondary">{data.LastModifiedBy}</Badge></FieldRow><FieldRow label="LastModifiedTs" value={data.LastModifiedTimestamp}><Badge variant="secondary">{data.LastModifiedTimestamp}</Badge></FieldRow></CardContent>
            </Card>
          </div>
        );

      case "event_data_table": return (<EventDataTableView eventCode={data.eventCode} onPushSidebar={onPushSidebar} />);
      
      case "digitalrecording_related_data": return (<DigitalRecordingDataTableView recordingCode={data.recordingCode} eventCode={data.eventCode} onPushSidebar={onPushSidebar} />);

      case "medialog_related_data": 
        return (
            <MediaLogDataTableView 
                recordingCode={data.recordingCode} 
                eventCode={data.eventCode} 
                mlid={data.mlid} // <<< PASS THE mlid PROP
            />
        );
      case "digitalrecording_list": return (<Card><CardHeader><CardTitle className="text-lg px-2">Refer for DigitalRecordings</CardTitle></CardHeader><CardContent className="p-4"><DigitalRecordingsList eventCode={data.eventCode} onPushSidebar={onPushSidebar} /></CardContent></Card>);

      case "medialog_list": {
        const renderListItem = (log: any) => {
          const cardProps = { key: log.MLUniqueID, className: "cursor-pointer hover:bg-muted/50 transition-colors", onClick: () => onPushSidebar({ type: "medialog", data: log, title: "Media Log Details", }) };
          let primaryText = log.Topic || log['Segment Category'] || `ID: ${log.MLUniqueID}`; let secondaryText = log.Detail || `ID: ${log.MLUniqueID}`;
          if (title.includes("Cities") || title.includes("Countries")) { primaryText = log.fkCity ? `${log.fkCity}, ${log.fkCountry}` : log.fkCountry; secondaryText = log.Topic || `ID: ${log.MLUniqueID}`; } else if (title.includes("Padhramnis")) { primaryText = log['Segment Category']; secondaryText = log.Topic || `ID: ${log.MLUniqueID}`; } else if (title.includes("Pratishthas")) { primaryText = log['Segment Category']; secondaryText = log.Topic || `ID: ${log.MLUniqueID}`; }
          return (<Card {...cardProps}><CardContent className="p-3 flex items-center justify-between"><div><p className="font-semibold text-sm">{primaryText}</p><p className="text-xs text-muted-foreground">{secondaryText}</p></div><ChevronRight className="w-4 h-4 text-muted-foreground" /></CardContent></Card>);
        };
        return (<Card><CardHeader><CardTitle className="text-lg px-2">{title}</CardTitle></CardHeader><CardContent className="p-4"><div className="space-y-2">{data.items.map((log: any) => renderListItem(log))}</div></CardContent></Card>);
      }

      
      case "digitalrecording":
        return (
          <div className="space-y-6">
            <div className="text-center">
              {renderIcon(<FileAudio className="w-8 h-8 text-white" />, "from-green-500 to-blue-600")}
             
              
            </div>
            <Card>
              <CardHeader><CardTitle className="text-lg px-2">Recording Details</CardTitle></CardHeader>
              <CardContent className="space-y-4 p-4">
                <FieldRow label="EventCode" value={data.fkEventCode} />

            {data.RecordingCode && (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 12px",
      background: "rgba(59,130,246,0.08)", // soft blue highlight
      borderRadius: "10px",
      marginTop: "10px",
    }}
  >
    {/* Label */}
    <span style={{ color: "var(--muted-foreground)" }}>Recording Code</span>

    {/* Value */}
    {hasAccess("Events", "read") || hasAccess("Media Log", "read") ? (
      <button
        onClick={() =>
          onPushSidebar({
            type: "digitalrecording_related_data",
            data: {
              recordingCode: data.RecordingCode,
              eventCode: data.fkEventCode || "",
            },
            title: `Recording ${data.RecordingCode}`,
          })
        }
        style={{
          padding: "4px 10px",
          fontSize: "14px",
          fontWeight: 600,
          background: "#1e40af",
          color: "#fff",
          borderRadius: "6px",
          display: "inline-flex",
          alignItems: "center",
          border: "none",
          cursor: "pointer",
        }}
      >
        {data.RecordingCode}
        <ChevronRight style={{ width: 16, height: 16, marginLeft: 6 }} />
      </button>
    ) : (
      <span
        style={{
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          color: "var(--muted-foreground)",
          fontWeight: 500,
        }}
      >
        <Lock style={{ width: 12, height: 12 }} />
        {data.RecordingCode}
      </span>
    )}
  </div>
)}

                <FieldRow label="RecordingName" value={data.RecordingName} />
                <FieldRow label="Duration" value={data.Duration}><Badge variant="secondary">{data.Duration}</Badge></FieldRow>
                <FieldRow label="File Size" value={data.FilesizeInBytes}><span className="font-medium">{data.FilesizeInBytes ? `${(data.FilesizeInBytes / 1024 / 1024).toFixed(2)} MB` : undefined}</span></FieldRow>
                <FieldRow label="Preservation" value={data.PreservationStatus}><span className="font-medium">{data.PreservationStatus}</span></FieldRow>
                {data.DistributionDriveLink && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Link</span>
                    <Button size="sm" variant="ghost" asChild><a href={data.DistributionDriveLink} target="_blank" rel="noopener noreferrer">Open Link <ExternalLink className="w-3 h-3 ml-2" /></a></Button>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg px-2">Metadata</CardTitle></CardHeader>
              <CardContent className="space-y-4 p-4">
                <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
                <FieldRow label="Last Modified By" value={data.LastModifiedBy} />
                <FieldRow label="QcStatus" value={data.QcStatus} />
                </CardContent>
            </Card>
          
          </div>
        );

      case "medialog": {
          const hasValue = (v: any): boolean => v !== undefined && v !== null && String(v).trim() !== "" && String(v).toUpperCase() !== "N/A";
          const hasLogDetails = [data.EventName, data.ContentFrom, data.ContentTo, data.TimeOfDay, data.Detail, data.SubDetail, data.fkOccasion, data.TotalDuration].some(hasValue);
          const hasStatusDetails = [data.FootageType, data.EditingStatus, data['Segment Category'], data.Remarks, data.Guidance, data.IsInformal].some(hasValue);
          const hasTopicDetails = [data.fkGranth, data.NumberSource, data.Topic, data.Synopsis, data.Keywords, data.TopicGivenBy, data.SatsangStart, data.SatsangEnd, data.HasSubtitle, data.SubTitlesLanguage, data.IsDubbed, data.DubbedLanguage, data.DubbedArtist].some(hasValue);
          const hasLocationDetails = [data.Language, data.SpeakerSinger, data.fkOrganization, data.Designation, data.fkCountry, data.fkCity, data.fkState, data.Venue].some(hasValue);
          const hasMetadata = [data.EventCode, data.fkDigitalRecordingCode, data.MLUniqueID, data.FootageSrNo, data.LogSerialNo, data.CounterFrom, data.CounterTo, data.SubDuration, data.TotalDuration].some(hasValue);
          return (
            <div className="space-y-6">
              <div className="text-center">{renderIcon(<ListChecks className="w-8 h-8 text-white" />, "from-teal-500 to-cyan-600")}</div>
              {hasLogDetails && (<Card><CardHeader><CardTitle className="text-lg px-2">Log Details</CardTitle></CardHeader><CardContent className="space-y-4 p-4"><FieldRow label="EventName" value={data.EventName} /><FieldRow label="Content From" value={data.ContentFrom} /><FieldRow label="Content To" value={data.ContentTo} /><FieldRow label="Time Of Day" value={data.TimeOfDay} /><FieldRow label=" Detail" value={data.Detail} /><FieldRow label=" Sub Detail" value={data.SubDetail} /><FieldRow label="Occasion" value={data.fkOccasion} /><FieldRow label="Duration" value={data.TotalDuration} /></CardContent></Card>)}
              {hasStatusDetails && (<Card><CardHeader><CardTitle className="text-lg px-2">Status</CardTitle></CardHeader><CardContent className="space-y-4 p-4"><FieldRow label="Footage Type" value={data.FootageType} /><FieldRow label="Editing Status" value={data.EditingStatus} /><FieldRow label="Segment Category" value={data['Segment Category']} /><FieldRow label="Remarks" value={data.Remarks} /><FieldRow label="Guidance" value={data.Guidance} /><FieldRow label="IsInformal" value={data.IsInformal} /></CardContent></Card>)}
              {hasTopicDetails && (<Card><CardHeader><CardTitle className="text-lg px-2">Details</CardTitle></CardHeader><CardContent className="space-y-4 p-4"><FieldRow label="Granth" value={data.fkGranth} /><FieldRow label="Number" value={data.NumberSource} /><FieldRow label="Topic" value={data.Topic} /><FieldRow label="Synopsis" value={data.Synopsis} /><FieldRow label="Keywords" value={data.Keywords} /><FieldRow label="TopicGivenBy" value={data.TopicGivenBy} /><FieldRow label="SatsangStart" value={data.SatsangStart} /><FieldRow label="SatsangEnd" value={data.SatsangEnd} /><FieldRow label="Has Subtitle" value={data.HasSubtitle} /><FieldRow label="Subtitle Language" value={data.SubTitlesLanguage} /><FieldRow label="IsDubbed" value={data.IsDubbed} /><FieldRow label="Dubbed Language" value={data.DubbedLanguage} /><FieldRow label="Dubbed Artist" value={data.DubbedArtist} /></CardContent></Card>)}
              {hasLocationDetails && (<Card><CardHeader><CardTitle className="text-lg px-2">Locations</CardTitle></CardHeader><CardContent className="space-y-4 p-4"><FieldRow label="Language" value={data.Language} /><FieldRow label="Speaker" value={data.SpeakerSinger} /><FieldRow label="Organization" value={data.fkOrganization} /><FieldRow label="Designation" value={data.Designation} /><FieldRow label="Country" value={data.fkCountry} /><FieldRow label="City" value={data.fkCity} /><FieldRow label="State" value={data.fkState} /><FieldRow label="Venue" value={data.Venue} /></CardContent></Card>)}
              {hasMetadata && (
                <Card>
                  <CardHeader><CardTitle className="text-lg px-2">Metadata</CardTitle></CardHeader>
                  <CardContent className="space-y-4 p-4">
                    {data.EventCode && (
  <div className="flex justify-between items-center">
    <span className="text-muted-foreground">Event Code</span>
    <span className="font-medium text-white">{data.EventCode}</span>
  </div>
)}

                  {data.fkDigitalRecordingCode && (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 12px",
      background: "rgba(59,130,246,0.08)",      // soft highlight
      borderRadius: "10px",
      marginTop: "10px",
    }}
  >
    <span style={{ color: "var(--muted-foreground)" }}>
      Recording Code
    </span>

    {data.fkDigitalRecordingCode ? (
      hasAccess("Digital Recordings", "read") ? (
        <button
          onClick={() =>
            onPushSidebar({
              type: "medialog_related_data",
              data: {
                eventCode: data.EventCode,
                recordingCode: data.fkDigitalRecordingCode,
                mlid: data.MLUniqueID,
              },
              title: `Related Data for ML ${data.MLUniqueID}`,
            })
          }
          style={{
            padding: "4px 10px",
            fontSize: "14px",
            fontWeight: 600,
            background: "#1e40af",
            color: "#fff",
            borderRadius: "6px",
            display: "inline-flex",
            alignItems: "center",
            border: "none",
            cursor: "pointer",
          }}
        >
          {data.fkDigitalRecordingCode}
          <ChevronRight style={{ width: 16, height: 16, marginLeft: 6 }} />
        </button>
      ) : (
        <span
          style={{
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--muted-foreground)",
            fontWeight: 500,
          }}
        >
          <Lock style={{ width: 12, height: 12 }} />
          {data.fkDigitalRecordingCode}
        </span>
      )
    ) : (
      <span style={{ color: "var(--muted-foreground)", fontWeight: 500 }}>
        N/A
      </span>
    )}
  </div>
)}

             {data.MLUniqueID && (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 12px",
      background: "rgba(59,130,246,0.08)",   // soft blue highlight
      borderRadius: "10px",
      marginTop: "10px",
    }}
  >
    {/* Label */}
    <span style={{ color: "var(--muted-foreground)" }}>MLID</span>

    {/* Value */}
    {data.MLUniqueID ? (
      hasAccess("Aux Files", "read") ? (
        <button
          onClick={() =>
            onPushSidebar({
              type: "aux_related_data",
              data: {
                mlid: data.MLUniqueID,
                eventCode: data.EventCode,
                recordingCode: data.fkDigitalRecordingCode,
              },
              title: `Related Data for ML ${data.MLUniqueID}`,
            })
          }
          style={{
            padding: "4px 10px",
            fontSize: "14px",
            fontWeight: 600,
            background: "#1e40af",
            color: "#fff",
            borderRadius: "6px",
            display: "inline-flex",
            alignItems: "center",
            border: "none",
            cursor: "pointer",
          }}
        >
          {data.MLUniqueID}
          <ChevronRight style={{ width: 16, height: 16, marginLeft: 6 }} />
        </button>
      ) : (
        <span
          style={{
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--muted-foreground)",
            fontWeight: 500,
          }}
        >
          <Lock style={{ width: 12, height: 12 }} />
          {data.MLUniqueID}
        </span>
      )
    ) : (
      <span style={{ color: "var(--muted-foreground)", fontWeight: 500 }}>
        N/A
      </span>
    )}
  </div>
)}

<FieldRow label="FootageSrNo" value={data.FootageSrNo} /><FieldRow label="LogSerialNo" value={data.LogSerialNo} /><FieldRow label="CounterFrom" value={data.CounterFrom} /><FieldRow label="CounterTo" value={data.CounterTo} /><FieldRow label="SubDuration" value={data.SubDuration} /><FieldRow label="TotalDuration" value={data.TotalDuration} />
                  </CardContent>
                </Card>
              )}
            </div>
          );

      }

       case "aux_related_data":
        return (
            <MediaLogDataTableView
            mlid={data.mlid}
            eventCode={data.eventCode} // <<< PASS THE eventCode PROP
            recordingCode={data.recordingCode} // <<< PASS THE recordingCode PROP
            />
        );

        case "aux_data":
      return (
        <AuxMediaLogDataTableView 
            mlid={data.mlid} 
            onPushSidebar={onPushSidebar} 
        />
      );
   case "aux":
      return (
        <AuxDetailsView
          data={data}
          hasAccess={hasAccess}
          onPushSidebar={onPushSidebar}
        />
      );
     case "audio": {
      const [isEditingAudioList, setIsEditingAudioList] = useState(false);
      const [audioList, setAudioList] = useState(data.AudioList || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveAudioList = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Audio List...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/audio/${encodeURIComponent(data.AID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ AudioList: audioList }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Audio List");
          }
    
          data.AudioList = audioList;
    
          toast.success("Audio List updated successfully!", { id: savingToast });
          setIsEditingAudioList(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Audio List:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingAudioList(false);
        setAudioList(data.AudioList || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<FileAudio className="w-8 h-8 text-white" />, "from-blue-500 to-purple-600")}
            <h3 className="text-xl font-bold">{data.AudioList || "Audio"}</h3>
            <p className="text-muted-foreground">Audio ID: {data.AID}</p>
            <Badge className="mt-2">{data.Distribution || "N/A"}</Badge>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Audio Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Audio List</span>
    
                {isEditingAudioList ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={audioList}
                      onChange={(e) => setAudioList(e.target.value)}
                      placeholder="Enter Audio List..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveAudioList}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {audioList ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {audioList}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Audio", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingAudioList(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "auxfiletype": {
      const [isEditingAuxFileType, setIsEditingAuxFileType] = useState(false);
      const [auxFileType, setAuxFileType] = useState(data.AuxFileType || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveAuxFileType = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Aux File Type...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/aux-file-type/${encodeURIComponent(data.AuxTypeID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ AuxFileType: auxFileType }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Aux File Type");
          }
    
          data.AuxFileType = auxFileType;
    
          toast.success("Aux File Type updated successfully!", { id: savingToast });
          setIsEditingAuxFileType(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Aux File Type:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingAuxFileType(false);
        setAuxFileType(data.AuxFileType || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<FileText className="w-8 h-8 text-white" />, "from-purple-500 to-pink-600")}
            <h3 className="text-xl font-bold">{data.AuxFileType || "Aux File Type"}</h3>
            <p className="text-muted-foreground">ID: {data.AuxTypeID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Aux File Type Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">File Type Name</span>
    
                {isEditingAuxFileType ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={auxFileType}
                      onChange={(e) => setAuxFileType(e.target.value)}
                      placeholder="Enter file type..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveAuxFileType}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {auxFileType ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {auxFileType}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Aux File Type", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingAuxFileType(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "bhajanType": {
      const [isEditingBhajanName, setIsEditingBhajanName] = useState(false);
      const [bhajanName, setBhajanName] = useState(data.BhajanName || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveBhajanName = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Bhajan Name...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/bhajantype/${encodeURIComponent(data.BTID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ BhajanName: bhajanName }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Bhajan Name");
          }
    
          data.BhajanName = bhajanName;
    
          toast.success("Bhajan Name updated successfully!", { id: savingToast });
          setIsEditingBhajanName(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Bhajan Name:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingBhajanName(false);
        setBhajanName(data.BhajanName || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<ListChecks className="w-8 h-8 text-white" />, "from-green-500 to-blue-600")}
            <h3 className="text-xl font-bold">{data.BhajanName || "Bhajan Type"}</h3>
            <p className="text-muted-foreground">BTID: {data.BTID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Bhajan Type Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Bhajan Name</span>
    
                {isEditingBhajanName ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={bhajanName}
                      onChange={(e) => setBhajanName(e.target.value)}
                      placeholder="Enter Bhajan Name..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveBhajanName}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {bhajanName ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {bhajanName}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Bhajan Type", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingBhajanName(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "digitalMasterCategory": {
      const [isEditingDMCategoryName, setIsEditingDMCategoryName] = useState(false);
      const [dmCategoryName, setDMCategoryName] = useState(data.DMCategory_name || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveDMCategoryName = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving DM Category Name...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/digitalmastercategory/${encodeURIComponent(data.DMCID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ DMCategory_name: dmCategoryName }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update DM Category Name");
          }
    
          data.DMCategory_name = dmCategoryName;
    
          toast.success("DM Category Name updated successfully!", { id: savingToast });
          setIsEditingDMCategoryName(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating DM Category Name:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingDMCategoryName(false);
        setDMCategoryName(data.DMCategory_name || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<FileText className="w-8 h-8 text-white" />, "from-blue-500 to-red-600")}
            <h3 className="text-xl font-bold">{data.DMCategory_name || "Digital Master Category"}</h3>
            <p className="text-muted-foreground">DMCID: {data.DMCID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Digital Master Category Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">DM Category Name</span>
    
                {isEditingDMCategoryName ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={dmCategoryName}
                      onChange={(e) => setDMCategoryName(e.target.value)}
                      placeholder="Enter DM Category Name..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveDMCategoryName}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {dmCategoryName ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {dmCategoryName}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Digital Master Category", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingDMCategoryName(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "distributionLabel": {
      const [isEditingLabelName, setIsEditingLabelName] = useState(false);
      const [labelName, setLabelName] = useState(data.LabelName || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveLabelName = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Label Name...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/distributionlabel/${encodeURIComponent(data.LabelID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ LabelName: labelName }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Label Name");
          }
    
          data.LabelName = labelName;
    
          toast.success("Label Name updated successfully!", { id: savingToast });
          setIsEditingLabelName(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Label Name:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingLabelName(false);
        setLabelName(data.LabelName || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<Mail className="w-8 h-8 text-white" />, "from-teal-500 to-cyan-600")}
            <h3 className="text-xl font-bold">{data.LabelName || "Distribution Label"}</h3>
            <p className="text-muted-foreground">Label ID: {data.LabelID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Distribution Label Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Label Name</span>
    
                {isEditingLabelName ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={labelName}
                      onChange={(e) => setLabelName(e.target.value)}
                      placeholder="Enter Label Name..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveLabelName}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {labelName ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {labelName}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Distribution Label", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingLabelName(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "editingType": {
      const [isEditingEdType, setIsEditingEdType] = useState(false);
      const [edType, setEdType] = useState(data.EdType || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveEdType = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Editing Type...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/editingtype/${encodeURIComponent(data.EdID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ EdType: edType }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Editing Type");
          }
    
          data.EdType = edType;
    
          toast.success("Editing Type updated successfully!", { id: savingToast });
          setIsEditingEdType(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Editing Type:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingEdType(false);
        setEdType(data.EdType || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<Calendar className="w-8 h-8 text-white" />, "from-orange-500 to-blue-600")}
            <h3 className="text-xl font-bold">{data.EdType || "Editing Type"}</h3>
            <p className="text-muted-foreground">EdID: {data.EdID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Editing Type Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Editing Type</span>
    
                {isEditingEdType ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={edType}
                      onChange={(e) => setEdType(e.target.value)}
                      placeholder="Enter Editing Type..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveEdType}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {edType ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {edType}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Editing Type", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingEdType(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Audio/Video" value={data.AudioVideo} />
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "editingStatus": {
      const [isEditingEdType, setIsEditingEdType] = useState(false);
      const [edType, setEdType] = useState(data.EdType || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveEdType = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Editing Status...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/editingstatus/${encodeURIComponent(data.EdID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ EdType: edType }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Editing Status");
          }
    
          data.EdType = edType;
    
          toast.success("Editing Status updated successfully!", { id: savingToast });
          setIsEditingEdType(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Editing Status:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingEdType(false);
        setEdType(data.EdType || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<Calendar className="w-8 h-8 text-white" />, "from-orange-500 to-blue-600")}
            <h3 className="text-xl font-bold">{data.EdType || "Editing Type"}</h3>
            <p className="text-muted-foreground">EdID: {data.EdID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Editing Status Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Editing Type</span>
    
                {isEditingEdType ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={edType}
                      onChange={(e) => setEdType(e.target.value)}
                      placeholder="Enter Editing Type..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveEdType}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {edType ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {edType}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Editing Type", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingEdType(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Audio/Video" value={data.AudioVideo} />
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "eventCategory": {
      const [isEditingEventCategory, setIsEditingEventCategory] = useState(false);
      const [eventCategory, setEventCategory] = useState(data.EventCategory || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveEventCategory = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Event Category...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/eventcategory/${encodeURIComponent(data.EventCategoryID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ EventCategory: eventCategory }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Event Category");
          }
    
          data.EventCategory = eventCategory;
    
          toast.success("Event Category updated successfully!", { id: savingToast });
          setIsEditingEventCategory(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Event Category:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingEventCategory(false);
        setEventCategory(data.EventCategory || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<Calendar className="w-8 h-8 text-white" />, "from-blue-500 to-pink-600")}
            <h3 className="text-xl font-bold">{data.EventCategory || "Event Category"}</h3>
            <p className="text-muted-foreground">Event Category ID: {data.EventCategoryID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Event Category Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Event Category</span>
    
                {isEditingEventCategory ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={eventCategory}
                      onChange={(e) => setEventCategory(e.target.value)}
                      placeholder="Enter Event Category..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveEventCategory}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {eventCategory ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {eventCategory}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Event Category", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingEventCategory(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }

       case "highlight":
        return (
          <div className="space-y-6">
            <div className="text-center">
              {renderIcon(<FileAudio className="w-8 h-8 text-white" />, "from-purple-500 to-red-600")}
              <h3 className="text-xl font-bold">
                {data.RecordingName || "Edited Highlight"}
              </h3>
              
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg px-2">Highlight Details</CardTitle>
              </CardHeader>
             <CardContent className="space-y-4 p-4">
  {/* EventName–Code Plain Display */}
  <FieldRow
    label="EventName-Code"
    value={
      data.EventName
        ? `${data.EventName} (${data.EventCode})`
        : data.EventCode || "N/A"
    }
  />

  <FieldRow label="Recording Name" value={data.RecordingName} />
  <FieldRow label="Recording Code" value={data.RecordingCode} />
  <FieldRow label="Duration" value={data.Duration}>
    <Badge variant="secondary">{data.Duration}</Badge>
  </FieldRow>
  <FieldRow label="Teams" value={data.Teams} />
  <Separator />
  <FieldRow label="From Date" value={data.FromDate ? new Date(data.FromDate).toLocaleDateString() : undefined} />
  <FieldRow label="To Date" value={data.ToDate ? new Date(data.ToDate).toLocaleDateString() : undefined} />
  <FieldRow label="Year" value={data.Yr} />
</CardContent>

            </Card>
          </div>
        );

    case "footageType": {
      const [isEditingFootageType, setIsEditingFootageType] = useState(false);
      const [footageType, setFootageType] = useState(data.FootageTypeList || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveFootageType = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Footage Type...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/footagetype/${encodeURIComponent(data.FootageID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ FootageTypeList: footageType }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Footage Type");
          }
    
          data.FootageTypeList = footageType;
    
          toast.success("Footage Type updated successfully!", { id: savingToast });
          setIsEditingFootageType(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Footage Type:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingFootageType(false);
        setFootageType(data.FootageTypeList || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<Calendar className="w-8 h-8 text-white" />, "from-orange-500 to-pink-600")}
            <h3 className="text-xl font-bold">{data.FootageTypeList || "Footage Type"}</h3>
            <p className="text-muted-foreground">Footage ID: {data.FootageID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Footage Type Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Footage Type</span>
    
                {isEditingFootageType ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={footageType}
                      onChange={(e) => setFootageType(e.target.value)}
                      placeholder="Enter Footage Type..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveFootageType}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {footageType ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {footageType}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Footage Type", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingFootageType(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "formatType": {
      const [isEditingType, setIsEditingType] = useState(false);
      const [type, setType] = useState(data.Type || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveType = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Format Type...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/formattype/${encodeURIComponent(data.FTID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ Type: type }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Format Type");
          }
    
          data.Type = type;
    
          toast.success("Format Type updated successfully!", { id: savingToast });
          setIsEditingType(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Format Type:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingType(false);
        setType(data.Type || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<FileText className="w-8 h-8 text-white" />, "from-green-500 to-red-600")}
            <h3 className="text-xl font-bold">{data.Type || "Format Type"}</h3>
            <p className="text-muted-foreground">FTID: {data.FTID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Format Type Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Format Type</span>
    
                {isEditingType ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      placeholder="Enter Format Type..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveType}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {type ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {type}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Format Type", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingType(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "granths": {
      const [isEditingName, setIsEditingName] = useState(false);
      const [name, setName] = useState(data.Name || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveName = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Granth Name...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/granths/${encodeURIComponent(data.ID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ Name: name }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Granth Name");
          }
    
          data.Name = name;
    
          toast.success("Granth Name updated successfully!", { id: savingToast });
          setIsEditingName(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Granth Name:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingName(false);
        setName(data.Name || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<BookOpen className="w-8 h-8 text-white" />, "from-purple-500 to-pink-600")}
            <h3 className="text-xl font-bold">{data.Name || "Granths"}</h3>
            <p className="text-muted-foreground">ID: {data.ID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Granths Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Name</span>
    
                {isEditingName ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter Granth Name..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveName}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {name ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {name}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Granths", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingName(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <FieldRow label="ID" value={data.ID} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "language": {
      const [isEditingTitleLanguage, setIsEditingTitleLanguage] = useState(false);
      const [titleLanguage, setTitleLanguage] = useState(data.TitleLanguage || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveTitleLanguage = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Title Language...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/language/${encodeURIComponent(data.STID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ TitleLanguage: titleLanguage }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Title Language");
          }
    
          data.TitleLanguage = titleLanguage;
    
          toast.success("Title Language updated successfully!", { id: savingToast });
          setIsEditingTitleLanguage(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Title Language:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingTitleLanguage(false);
        setTitleLanguage(data.TitleLanguage || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<Globe className="w-8 h-8 text-white" />, "from-green-500 to-red-600")}
            <h3 className="text-xl font-bold">{data.TitleLanguage || "Language"}</h3>
            <p className="text-muted-foreground">STID: {data.STID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Language Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Title Language</span>
    
                {isEditingTitleLanguage ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={titleLanguage}
                      onChange={(e) => setTitleLanguage(e.target.value)}
                      placeholder="Enter Title Language..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveTitleLanguage}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {titleLanguage ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {titleLanguage}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Language", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingTitleLanguage(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="STID" value={data.STID} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "masterquality": {
      const [isEditingMQName, setIsEditingMQName] = useState(false);
      const [mqName, setMQName] = useState(data.MQName || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveMQName = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Master Quality...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/master-quality/${encodeURIComponent(data.MQID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ MQName: mqName }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Master Quality");
          }
    
          data.MQName = mqName;
    
          toast.success("Master Quality updated successfully!", { id: savingToast });
          setIsEditingMQName(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Master Quality:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingMQName(false);
        setMQName(data.MQName || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<ListChecks className="w-8 h-8 text-white" />, "from-green-500 to-red-600")}
            <h3 className="text-xl font-bold">{data.MQName || "Master Quality"}</h3>
            <p className="text-muted-foreground">MQID: {data.MQID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Master Quality Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Quality Name</span>
    
                {isEditingMQName ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={mqName}
                      onChange={(e) => setMQName(e.target.value)}
                      placeholder="Enter Quality Name..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveMQName}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {mqName ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {mqName}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Master Quality", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingMQName(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "newEventCategory": {
      const [isEditingNewEventCategoryName, setIsEditingNewEventCategoryName] = useState(false);
      const [newEventCategoryName, setNewEventCategoryName] = useState(data.NewEventCategoryName || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveNewEventCategoryName = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Event Category Name...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/neweventcategory/${encodeURIComponent(data.CategoryID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ NewEventCategoryName: newEventCategoryName }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Event Category Name");
          }
    
          data.NewEventCategoryName = newEventCategoryName;
    
          toast.success("Event Category Name updated successfully!", { id: savingToast });
          setIsEditingNewEventCategoryName(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Event Category Name:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingNewEventCategoryName(false);
        setNewEventCategoryName(data.NewEventCategoryName || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<FileText className="w-8 h-8 text-white" />, "from-orange-500 to-purple-600")}
            <h3 className="text-xl font-bold">{data.NewEventCategoryName || "New Event Category"}</h3>
            <p className="text-muted-foreground">Category ID: {data.CategoryID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">New Event Category Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Event Category Name</span>
    
                {isEditingNewEventCategoryName ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={newEventCategoryName}
                      onChange={(e) => setNewEventCategoryName(e.target.value)}
                      placeholder="Enter Event Category Name..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveNewEventCategoryName}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {newEventCategoryName ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {newEventCategoryName}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("New Event Category", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingNewEventCategoryName(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
              <FieldRow label="MARKDISCARD" value={data.MARK_DISCARD} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "newCities": {
      const [isEditingCity, setIsEditingCity] = useState(false);
      const [city, setCity] = useState(data.City || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveCity = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving City...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/newcities/${encodeURIComponent(data.CityID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ City: city }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update City");
          }
    
          data.City = city;
    
          toast.success("City updated successfully!", { id: savingToast });
          setIsEditingCity(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating City:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingCity(false);
        setCity(data.City || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<Globe className="w-8 h-8 text-white" />, "from-orange-500 to-pink-600")}
            <h3 className="text-xl font-bold">{data.City || "New Cities"}</h3>
            <p className="text-muted-foreground">City ID: {data.CityID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">New Cities Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">City</span>
    
                {isEditingCity ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Enter City..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveCity}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {city ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {city}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("New Cities", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingCity(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "newCountries": {
      const [isEditingCountry, setIsEditingCountry] = useState(false);
      const [country, setCountry] = useState(data.Country || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveCountry = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Country...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/newcountries/${encodeURIComponent(data.CountryID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ Country: country }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Country");
          }
    
          data.Country = country;
    
          toast.success("Country updated successfully!", { id: savingToast });
          setIsEditingCountry(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Country:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingCountry(false);
        setCountry(data.Country || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<Globe className="w-8 h-8 text-white" />, "from-green-500 to-purple-600")}
            <h3 className="text-xl font-bold">{data.Country || "New Countries"}</h3>
            <p className="text-muted-foreground">Country ID: {data.CountryID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">New Countries Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Country</span>
    
                {isEditingCountry ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Enter Country..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveCountry}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {country ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {country}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("New Countries", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingCountry(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "newStates": {
      const [isEditingState, setIsEditingState] = useState(false);
      const [state, setState] = useState(data.State || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveState = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving State...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/newstates/${encodeURIComponent(data.StateID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ State: state }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update State");
          }
    
          data.State = state;
    
          toast.success("State updated successfully!", { id: savingToast });
          setIsEditingState(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating State:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingState(false);
        setState(data.State || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<Globe className="w-8 h-8 text-white" />, "from-purple-500 to-pink-600")}
            <h3 className="text-xl font-bold">{data.State || "New States"}</h3>
            <p className="text-muted-foreground">State ID: {data.StateID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">New States Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">State</span>
    
                {isEditingState ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Enter State..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveState}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {state ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {state}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("New States", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingState(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "organization": {
      const [isEditingOrg, setIsEditingOrg] = useState(false);
      const [organization, setOrganization] = useState(data.Organization || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveOrganization = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Organization...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/organizations/${encodeURIComponent(data.OrganizationID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ Organization: organization }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Organization");
          }
    
          data.Organization = organization;
    
          toast.success("Organization updated successfully!", { id: savingToast });
          setIsEditingOrg(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Organization:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingOrg(false);
        setOrganization(data.Organization || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<Users className="w-8 h-8 text-white" />, "from-green-500 to-purple-600")}
            <h3 className="text-xl font-bold">{data.Organization || "Organization"}</h3>
            <p className="text-muted-foreground">ID: {data.OrganizationID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Organization Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Organization Name</span>
    
                {isEditingOrg ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Enter Organization Name..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveOrganization}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {organization ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {organization}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Organizations", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingOrg(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "occasions": {
      const [isEditingOccasion, setIsEditingOccasion] = useState(false);
      const [occasion, setOccasion] = useState(data.Occasion || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveOccasion = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Occasion...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/occasions/${encodeURIComponent(data.OccasionID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ Occasion: occasion }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Occasion");
          }
    
          data.Occasion = occasion;
    
          toast.success("Occasion updated successfully!", { id: savingToast });
          setIsEditingOccasion(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Occasion:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingOccasion(false);
        setOccasion(data.Occasion || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<FileText className="w-8 h-8 text-white" />, "from-purple-500 to-red-600")}
            <h3 className="text-xl font-bold">{data.Occasion || "Occasions"}</h3>
            <p className="text-muted-foreground">Occasion ID: {data.OccasionID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Occasions Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Occasion</span>
    
                {isEditingOccasion ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={occasion}
                      onChange={(e) => setOccasion(e.target.value)}
                      placeholder="Enter Occasion..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveOccasion}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {occasion ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {occasion}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Occasions", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingOccasion(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "topicNumberSource": {
      const [isEditingTNName, setIsEditingTNName] = useState(false);
      const [tnName, setTNName] = useState(data.TNName || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveTNName = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Topic Name...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/topicnumbersource/${encodeURIComponent(data.TNID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ TNName: tnName }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Topic Name");
          }
    
          data.TNName = tnName;
    
          toast.success("Topic Name updated successfully!", { id: savingToast });
          setIsEditingTNName(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Topic Name:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingTNName(false);
        setTNName(data.TNName || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<FileText className="w-8 h-8 text-white" />, "from-teal-500 to-blue-600")}
            <h3 className="text-xl font-bold">{data.TNName || "Topic Number Source"}</h3>
            <p className="text-muted-foreground">Topic ID: {data.TNID}</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Topic Number Source Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Topic Name</span>
    
                {isEditingTNName ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={tnName}
                      onChange={(e) => setTNName(e.target.value)}
                      placeholder="Enter Topic Name..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveTNName}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {tnName ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {tnName}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Topic Number Source", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingTNName(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "timeOfDay": {
      const [isEditingTimeList, setIsEditingTimeList] = useState(false);
      const [timeList, setTimeList] = useState(data.TimeList || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveTimeList = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Time of Day...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/time-of-day/${encodeURIComponent(data.TimeID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ TimeList: timeList }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Time of Day");
          }
    
          data.TimeList = timeList;
    
          toast.success("Time of Day updated successfully!", { id: savingToast });
          setIsEditingTimeList(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Time of Day:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingTimeList(false);
        setTimeList(data.TimeList || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<Calendar className="w-8 h-8 text-white" />, "from-green-500 to-purple-600")}
            <h3 className="text-xl font-bold">{data.TimeList || "Time of Day"}</h3>
            <p className="text-muted-foreground">Time ID: {data.TimeID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Time of Day Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Time List</span>
    
                {isEditingTimeList ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={timeList}
                      onChange={(e) => setTimeList(e.target.value)}
                      placeholder="Enter Time List..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveTimeList}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {timeList ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {timeList}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Time of Day", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingTimeList(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    case "topicgivenby": {
      const [isEditingTGBName, setIsEditingTGBName] = useState(false);
      const [tgbName, setTGBName] = useState(data.TGB_Name || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveTGBName = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Topic Given By...");
        try {
          const response = await fetch(
            `${API_BASE_URL}/topic-given-by/${encodeURIComponent(data.TGBID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ TGB_Name: tgbName }),
            }
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Topic Given By");
          }
          data.TGB_Name = tgbName;
          toast.success("Topic Given By updated successfully!", { id: savingToast });
          setIsEditingTGBName(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Topic Given By:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingTGBName(false);
        setTGBName(data.TGB_Name || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<Users className="w-8 h-8 text-white" />, "from-blue-500 to-purple-600")}
            <h3 className="text-xl font-bold">{data.TGB_Name || "Topic Given By"}</h3>
            <p className="text-muted-foreground">TGBID: {data.TGBID}</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Topic Given By Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Name</span>
                {isEditingTGBName ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={tgbName}
                      onChange={(e) => setTGBName(e.target.value)}
                      placeholder="Enter Name..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveTGBName}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {tgbName ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {tgbName}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Topic Given By", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingTGBName(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <FieldRow label="Last Modified By" value={data.LastModifiedBy} />
              <FieldRow label="Last Modified" value={data.LastModifiedTs} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "segmentcategory": {
      const [isEditingSegCatName, setIsEditingSegCatName] = React.useState(false);
      const [segCatName, setSegCatName] = React.useState(data.SegCatName || "");
      const [isSaving, setIsSaving] = React.useState(false);
    
      const handleSaveSegCatName = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Segment Category...");
        try {
          const response = await fetch(
            `${API_BASE_URL}/segment-category/${encodeURIComponent(data.SegCatID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ SegCatName: segCatName }),
            }
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Segment Category");
          }
          data.SegCatName = segCatName;
          toast.success("Segment Category updated successfully!", { id: savingToast });
          setIsEditingSegCatName(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Segment Category:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingSegCatName(false);
        setSegCatName(data.SegCatName || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<ListChecks className="w-8 h-8 text-white" />, "from-blue-500 to-purple-600")}
            <h3 className="text-xl font-bold">{data.SegCatName || "Segment Category"}</h3>
            <p className="text-muted-foreground">SegCatID: {data.SegCatID}</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Segment Category Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Name</span>
                {isEditingSegCatName ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={segCatName}
                      onChange={(e) => setSegCatName(e.target.value)}
                      placeholder="Enter Name..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveSegCatName}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {segCatName ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {segCatName}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Segment Category", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingSegCatName(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <FieldRow label="Last Modified By" value={data.LastModifiedBy} />
              <FieldRow label="Last Modified" value={data.LastModifiedTs} />
            </CardContent>
          </Card>
        </div>
      );
    }
      // ... other cases ...
      default: return (<div className="text-center p-4">Details view not implemented for type: "{type}"</div>);
    }
  };

  return (
<>
  {/* Background Overlay */}
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    style={{
      zIndex: zIndex - 1,
      position: "fixed",
      inset: 0,
      background: "rgba(30, 32, 38, 0.25)",
      backdropFilter: "blur(1px)",
    }}
    onClick={onClose}
  />

  {/* Main Popup */}
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ type: "spring", damping: 25, stiffness: 200 }}
    style={{
      zIndex,
      position: "fixed",
      // Positioning based on screen size
      top: window.innerWidth >= 1024 ? "65px" : "50%", // Laptop/Desktop/4K: offset, others: center
      left: window.innerWidth >= 1024 ? "330px" : "50%", // Laptop/Desktop/4K: offset, others: center
      transform: "translate(-50%, -50%)",
      width: (() => {
        if (window.innerWidth >= 2560) return "clamp(320px, calc(100vw - 360px), 2000px)"; // 4K
        if (window.innerWidth >= 1440) return "clamp(320px, calc(100vw - 360px), 1400px)"; // Desktop
        if (window.innerWidth >= 1024) return "clamp(320px, calc(100vw - 360px), 1000px)"; // Laptop
        if (window.innerWidth >= 768) return "clamp(320px, 90vw, 800px)"; // Tablet
        if (window.innerWidth >= 480) return "clamp(320px, 95vw, 600px)"; // Mobile large
        return "95vw"; // Mobile medium/small
      })(),
      maxWidth: "95vw",
      maxHeight: window.innerWidth >= 1024 ? "90vh" : "100vh", // Laptop/Desktop/4K: 90vh, others: full height
      background: "var(--background)",
      borderRadius: window.innerWidth >= 1024 ? "16px" : "0px", // Laptop/Desktop/4K: rounded, others: full-screen
      boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      border: window.innerWidth >= 1024 ? "1px solid var(--border)" : "none", // Laptop/Desktop/4K: border, others: none
      overflow: "hidden",
    }}
  >
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: (() => {
            if (window.innerWidth >= 1440) return "16px"; // Desktop/4K
            if (window.innerWidth >= 1024) return "15px"; // Laptop
            if (window.innerWidth >= 768) return "14px"; // Tablet
            return "12px"; // Mobile
          })(),
          borderBottom: window.innerWidth >= 1024 ? "1px solid var(--border)" : "none", // Laptop/Desktop/4K: border, others: none
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Back Button */}
          {sidebarStack && sidebarStack.length > 1 && (
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                if (typeof onPopSidebar === "function") onPopSidebar();
              }}
              style={{
                height: "32px",
                width: "32px",
                borderRadius: "6px",
                marginRight: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Back"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M11 14L6 9L11 4" stroke="#fdfafaff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          )}
          <h2
            style={{
              fontSize: (() => {
                if (window.innerWidth >= 1440) return "1.125rem"; // Desktop/4K
                if (window.innerWidth >= 1024) return "1.0625rem"; // Laptop
                if (window.innerWidth >= 768) return "1.0625rem"; // Tablet
                return "1rem"; // Mobile
              })(),
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              paddingRight: "16px",
            }}
          >
            {title}
          </h2>
        </div>

        <Button
          size="icon"
          onClick={() => {
            if (typeof onPopSidebar === "function") {
              onPopSidebar();
            } else {
              onClose();
            }
          }}
          style={{
            height: "32px",
            width: "32px",
            flexShrink: 0,
            background: "#faf8f8ff",
            color: "#181717ff",
            border: "1px solid #444",
            borderRadius: "6px",
          }}
        >
          <X style={{ width: "16px", height: "16px", color: "#0c0c0cff" }} />
        </Button>
      </div>

      {/* Body / Scroll */}
      <div
        style={{
          flex: 1,
          padding: (() => {
            if (window.innerWidth >= 1440) return "24px"; // Desktop/4K
            if (window.innerWidth >= 1024) return "22px"; // Laptop
            if (window.innerWidth >= 768) return "20px"; // Tablet
            return "16px"; // Mobile
          })(),
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "#888 #272525ff",
          maxHeight: window.innerWidth >= 1024 ? "calc(90vh - 64px)" : "calc(100vh - 64px)", // Laptop/Desktop/4K: 90vh, others: full height
        }}
      >
        {renderContent()}
      </div>
    </div>
  </motion.div>
</>





  );
}