import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { ClickUpListViewUpdated } from "./components/ClickUpListViewUpdated";
import { AIAssistant } from "./components/AIAssistant";
import { UserManagement } from "./components/UserManagement";
import { DetailsSidebar } from "./components/DetailsSidebar";
import { DevelopmentBanner } from "./components/DevelopmentBanner";
import { MobileNavigation } from "./components/MobileNavigation";
import { ResponsiveLayout, useMobile } from "./components/ResponsiveLayout";
import { InstallPrompt } from "./components/InstallPrompt";
import { Button } from "./components/ui/button";
import { Menu, X, AlertTriangle } from "lucide-react";
import { getColorForString } from "./components/ui/utils";
import { EventTimeline } from "./components/EventTimeline";
import { SatsangDashboard } from "./components/SatsangDashboard";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./components/ui/card";
import { useAuth } from "./contexts/AuthContext";
import { toast } from "sonner";

// --- NEW --- Import the updated dialog and its types
import { ManageColumnsDialog, SaveConfig } from "./components/ManageColumnsDialog";


const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL) || "";

// ===================================================================================
// --- 1. VIEW CONFIGURATIONS & HELPERS ---
// (This section remains unchanged, so it's collapsed for brevity)
// ===================================================================================
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
const VIEW_CONFIGS: Record<string, any> = {
  events: {
    title: "Events",
    apiEndpoint: "/events",
    idKey: "EventID",
    detailsType: "event",
    columns: [
      
       
       { key: "Yr", label: "Year", sortable: true, editable: true }, 
        { key: "NewEventCategory", label: "New Event Category", sortable: true, filterable: true, render: categoryTagRenderer, editable: true },
       { key: "FromDate", label: "From Date", sortable: true, editable: true }, 
       { key: "ToDate", label: "To Date", sortable: true, editable: true }, 
       { key: "EventName", label: "Event Name", sortable: true, editable: true }, 
        { key: "EventCode", label: "Event Code", sortable: true, editable: true }, 
       { key: "EventRemarks", label: "Event Remarks", sortable: true, editable: true },

    ],
  },
  satsang_dashboard: {
    title: "Satsang Dashboard",
  },
  // ... other configs for medialog, digitalrecordings, aux, etc.
  medialog_all: {
    title: "Media Log: ML formal & Informal",
    apiEndpoint: "/newmedialog",
    idKey: "MLUniqueID",
    detailsType: "medialog",
     // Default multi-column sort when this view opens (backend should support comma-separated keys)
 sortBy: "EventCode,FootageSrNo,LogSerialNo",
   sortDirection: "asc",
    columns: [
       { key: "Yr", label: "Year", sortable: true, editable: true },
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

     
     
    ],
  },

medialog_formal: {
    title: "Media Log: Formal View",
    apiEndpoint: "/newmedialog/formal", // adjust endpoint if backend differs
    idKey: "MLUniqueID",
    detailsType: "medialog",
    columns: [
      { key: "Yr", label: "Year", sortable: true, editable: true },
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


    ],
  },

  medialog_all_except_satsang: {
    title: "Media Log: All Except Satsang",
    apiEndpoint: "/newmedialog/all-except-satsang",
    idKey: "MLUniqueID",
    detailsType: "medialog",
    columns: [
      { key: "Yr", label: "Year", sortable: true, editable: true },
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
      

      // Core ML columns requested
      { key: "ContentFrom", label: "Content From", sortable: true, editable: true },
      { key: "ContentTo", label: "Content To", sortable: true, editable: true },
      { key: "fkDigitalRecordingCode", label: "DR Code", sortable: true, editable: true },
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

     

  
    ],
  },
  medialog_satsang_extracted_clips: {
    title: "Media Log: Satsang Extracted Clips",
    apiEndpoint: "/newmedialog/satsang-extracted-clips",
    idKey: "MLUniqueID",
    detailsType: "medialog",
    columns: [
     { key: "Yr", label: "Year", sortable: true, editable: true },
     
      // Requested primary columns
      { key: "ContentFrom", label: "Content From", sortable: true, editable: true },
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
      { key: "Segment Category", label: "Segment Category", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "TopicSource", label: "Topic", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "SubDuration", label: "Duration", sortable: true, editable: true },
      { key: "Language", label: "Language", sortable: true, render: categoryTagRenderer, editable: true },

      // Subtitle fields
      { key: "HasSubtitle", label: "Has Subtitle", sortable: true, editable: true },
      { key: "SubTitlesLanguage", label: "Subtitle Language", sortable: true, render: categoryTagRenderer, editable: true },

      // Text/meta
      { key: "Synopsis", label: "Synopsis", sortable: true, editable: true },

      // Satsang start / end words
      { key: "SatsangStart", label: "Satsang Start Words", sortable: true, editable: true },
      { key: "SatsangEnd", label: "Satsang End Words", sortable: true, editable: true },

      // Audio codes / master quality / DR filename
      { key: "AudioMP3DRCode", label: "Audio MP3 Code", sortable: true, editable: true },
     

      // Location: City (requested)
      { key: "fkCity", label: "City", sortable: true, render: categoryTagRenderer, editable: true },

      // Keep identifiers / minimal extras
      
     
   
    ],
  },
  medialog_satsang_category: {
    title: "Media Log: Satsang Category",
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

      // DR filename and other ML identifiers
     

    
     
    ],
  },
  // ...existing code...
  digitalrecordings: {
    title: "Digital Recordings",
    apiEndpoint: "/digitalrecording",
    idKey: "RecordingCode",
    detailsType: "digitalrecording",
    groupBy: "Yr", // <-- MODIFIED: Added default grouping configuration
    columns : [
      // <-- ADDED: show event-related columns in digitalrecordings
      { key: "Yr", label: "Year", sortable: true, editable: true },
      { key: "EventName", label: "Event Name", sortable: true, editable: true },
      { key: "fkEventCategory", label: "Event Category", sortable: true, render: categoryTagRenderer, editable: true },

      { key: "fkEventCode", label: "fkEventCode", sortable: true, editable: true },
      { key: "RecordingName", label: "RecordingName", sortable: true, editable: true },
      { key: "RecordingCode", label: "RecordingCode", sortable: true, editable: true },
       { key: "Duration", label: "Duration", sortable: true, editable: true },
        { key: "DistributionDriveLink", label: "DistributionDriveLink", sortable: true, editable: true },
        { key: "BitRate", label: "BitRate", sortable: true, editable: true },
        { key: "Dimension", label: "Dimension", sortable: true,render: categoryTagRenderer, editable: true },
         { key: "Masterquality", label: "Masterquality", sortable: true,render: categoryTagRenderer, editable: true },
          { key: "fkMediaName", label: "fkMediaName", sortable: true,render: categoryTagRenderer, editable: true },
          { key: "Filesize", label: "Filesize", sortable: true, editable: true },
           { key: "FilesizeInBytes", label: "FilesizeInBytes", sortable: true, editable: true },
      { key: "NoOfFiles", label: "NoOfFiles", sortable: true, editable: true },
      { key: "RecordingRemarks", label: "RecordingRemarks", sortable: true, editable: true },
      { key: "CounterError", label: "CounterError", sortable: true, editable: true },
      { key: "ReasonError", label: "ReasonError", sortable: true, editable: true },
      { key: "MasterProductTitle", label: "MasterProductTitle", sortable: true, editable: true },
      { key: "fkDistributionLabel", label: "fkDistributionLabel", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "ProductionBucket", label: "ProductionBucket", sortable: true,render: categoryTagRenderer, editable: true },
      { key: "fkDigitalMasterCategory", label: "fkDigitalMasterCategory", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "AudioBitrate", label: "AudioBitrate", sortable: true, editable: true },
      { key: "AudioTotalDuration", label: "AudioTotalDuration", sortable: true, editable: true },
      { key: "QcRemarksCheckedOn", label: "QcRemarksCheckedOn", sortable: true, editable: true },
      { key: "PreservationStatus", label: "PreservationStatus", sortable: true,render: categoryTagRenderer, editable: true },
      { key: "QCSevak", label: "QCSevak", sortable: true, editable: true },
      { key: "QcStatus", label: "QcStatus", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true, editable: true },
      { key: "SubmittedDate", label: "SubmittedDate", sortable: true, editable: true },
      { key: "PresStatGuidDt", label: "PresStatGuidDt", sortable: true, editable: true },
      { key: "InfoOnCassette", label: "InfoOnCassette", sortable: true, editable: true },
      { key: "IsInformal", label: "IsInformal", sortable: true, editable: true },
      { key: "AssociatedDR", label: "AssociatedDR", sortable: true, editable: true },
      { key: "Teams", label: "Teams", sortable: true, render: categoryTagRenderer, editable: true },
    ],
  },
// ...existing code...
  aux: {
    title: "Aux File",
    apiEndpoint: "/auxfiles",
    idKey: "new_auxid",
    detailsType: "aux",
     columns : [
        { key: "new_auxid", label: "New aux id", sortable: true, editable: true },
        { key: "AuxCode", label: "AuxCode", sortable: true, editable: true },
        { key: "AuxFileType", label: "AuxFileType", sortable: true,render: categoryTagRenderer, editable: true },
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
    ],
  },
  // All dropdown configs
  auxfiletype: {
    title: "Aux File Type", apiEndpoint: "/aux-file-type", idKey: "AuxTypeID", detailsType: "auxfiletype", isDropdown: true,
    columns: [
      { key: "AuxTypeID", label: "AuxTypeID", sortable: true, editable: true },
      { key: "AuxFileType", label: "AuxFileType", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true },
    ],
  },
  audio: {
    title: "Audio", apiEndpoint: "/audio", idKey: "AID", detailsType: "audio", isDropdown: true,
    columns: [
      { key: "AID", label: "Audio ID", sortable: true, editable: true },
      { key: "AudioList", label: "AudioList", sortable: true, editable: true },
      { key: "Distribution", label: "Distribution", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true }, 
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true },
    ],
  },
  bhajanType: {
    title: "Bhajan Type", apiEndpoint: "/bhajan-type", idKey: "BTID", detailsType: "bhajanType", isDropdown: true,
    columns: [
      { key: "BTID", label: "BTID", sortable: true, editable: true },
      { key: "BhajanName", label: "BhajanName", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true },
    ],
  },
  digitalMasterCategory: {
    title: "Digital Master Category", apiEndpoint: "/digital-master-category", idKey: "DMCID", detailsType: "digitalMasterCategory", isDropdown: true,
    columns: [
      { key: "DMCID", label: "DMCID", sortable: true, editable: true },
      { key: "DMCategory_name", label: "DMCategory_name", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true },
    ],
  },
  distributionLabel: {
    title: "Distribution Label", apiEndpoint: "/distribution-label", idKey: "LabelID", detailsType: "distributionLabel", isDropdown: true,
    columns: [
      { key: "LabelID", label: "Label ID", sortable: true, editable: true },
      { key: "LabelName", label: "Label Name", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true },
    ],
  },
  editingType: {
    title: "Editing Type", apiEndpoint: "/editing-type", idKey: "EdID", detailsType: "editingType", isDropdown: true,
    columns: [
      { key: "EdID", label: "EdID", sortable: true, editable: true },
      { key: "EdType", label: "EdType", sortable: true, editable: true },
      { key: "AudioVideo", label: "AudioVideo", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true },
    ],
  },
  editingstatus: {
    title: "Editing Status", apiEndpoint: "/editing-status", idKey: "EdID", detailsType: "editingStatus", isDropdown: true,
    columns: [
      { key: "EdID", label: "EdID", sortable: true, editable: true },
      { key: "EdType", label: "EdType", sortable: true, editable: true },
      { key: "AudioVideo", label: "AudioVideo", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true },
    ],
  },
  eventCategory: {
    title: "Event Category", apiEndpoint: "/event-category", idKey: "EventCategoryID", detailsType: "eventCategory", isDropdown: true,
    columns: [
      { key: "EventCategoryID", label: "EventCategoryID", sortable: true, editable: true },
      { key: "EventCategory", label: "EventCategory", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true },
    ],
  },
  footageType: {
    title: "Footage Type", apiEndpoint: "/footage-type", idKey: "FootageID", detailsType: "footageType", isDropdown: true,
    columns: [
      { key: "FootageID", label: "Footage ID", sortable: true, editable: true },
      { key: "FootageTypeList", label: "FootageTypeList", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true },
    ],
  },
  formatType: {
    title: "Format Type", apiEndpoint: "/format-type", idKey: "FTID", detailsType: "formatType", isDropdown: true,
    columns: [
      { key: "FTID", label: "FTID", sortable: true, editable: true },
      { key: "Type", label: "Type", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true},
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true},
    ],
  },
  granths: {
    title: "Granths", apiEndpoint: "/granths", idKey: "ID", detailsType: "granths", isDropdown: true,
    columns: [
      { key: "ID", label: "ID", sortable: true, editable: true },
      { key: "Name", label: "Name", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true },
    ],
  },
  language: {
    title: "Language", apiEndpoint: "/language", idKey: "STID", detailsType: "language", isDropdown: true,
    columns: [
      { key: "STID", label: "STID", sortable: true, editable: true },
      { key: "TitleLanguage", label: "TitleLanguage", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true},
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true},
    ],
  },
  newEventCategory: {
    title: "New Event Category", apiEndpoint: "/new-event-category", idKey: "SrNo", detailsType: "newEventCategory", isDropdown: true,
    columns: [
      { key: "SrNo", label: "SrNo", sortable: true, editable: true },
      { key: "NewEventCategoryName", label: "NewEventCategoryName", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true },
      { key: "MARK_DISCARD", label: "MARK_DISCARD", sortable: true, editable: true },
    ],
  },
  newCities: {
    title: "New Cities", apiEndpoint: "/new-cities", idKey: "CityID", detailsType: "newCities", isDropdown: true,
    columns: [
      { key: "CityID", label: "City ID", sortable: true, editable: true },
      { key: "City", label: "City", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true },
    ],
  },
  newCountries: {
    title: "New Countries", apiEndpoint: "/new-countries", idKey: "CountryID", detailsType: "newCountries", isDropdown: true,
    columns: [
      { key: "CountryID", label: "Country ID", sortable: true, editable: true },
      { key: "Country", label: "Country", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true },
    ],
  },
  newStates: {
    title: "New States", apiEndpoint: "/new-states", idKey: "StateID", detailsType: "newStates", isDropdown: true,
    columns: [
      { key: "StateID", label: "State ID", sortable: true, editable: true },
      { key: "State", label: "State", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true},
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true},
    ],
  },
  masterquality: {
    title: "Master Quality", apiEndpoint: "/master-quality", idKey: "MQID", detailsType: "masterquality", isDropdown: true,
    columns: [
      { key: "MQID", label: "MQID", sortable: true, editable: true },
      { key: "MQName", label: "MQName", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true},
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true},
    ],
  },
  organization: {
    title: "Organizations", apiEndpoint: "/organizations", idKey: "OrganizationID", detailsType: "organization", isDropdown: true,
    columns: [
      { key: "OrganizationID", label: "Organization ID", sortable: true, editable: true },
      { key: "Organization", label: "Organization", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true },
    ],
  },
  occasions: {
    title: "Occasions", apiEndpoint: "/occasions", idKey: "OccasionID", detailsType: "occasions", isDropdown: true,
    columns: [
      { key: "OccasionID", label: "Occasion ID", sortable: true, editable: true },
      { key: "Occasion", label: "Occasion", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true },
    ],
  },
  topicNumberSource: {
    title: "Topic Number Source", apiEndpoint: "/topic-number-source", idKey: "TNID", detailsType: "topicNumberSource", isDropdown: true,
    columns: [
      { key: "TNID", label: "TNID", sortable: true, editable: true },
      { key: "TNName", label: "TNName", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true },
    ],
  },
  timeOfDay: {
    title: "Time of Day", apiEndpoint: "/time-of-day", idKey: "TimeID", detailsType: "timeOfDay", isDropdown: true,
    columns: [
      { key: "TimeID", label: "Time ID", sortable: true, editable: true },
      { key: "TimeList", label: "Time List", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true },
    ],
  },
  topicgivenby: {
    title: "Topic Given By", apiEndpoint: "/topic-given-by", idKey: "TGBID", detailsType: "topicgivenby", isDropdown: true,
    columns: [
      { key: "TGBID", label: "TGBID", sortable: true, editable: true },
      { key: "TGB_Name", label: "TGB_Name", sortable: true, editable: true },
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true},
      { key: "LastModifiedTs", label: "LastModifiedTs", sortable: true },
    ],
  },
  segmentcategory: {
    title: "Segment Category", apiEndpoint: "/segment-category", idKey: "SegCatID", detailsType: "segmentcategory", isDropdown: true,
    columns: [
      { key: "SegCatID", label: "SegCatID", sortable: true, editable: true },
      { key: "SegCatName", label: "SegCatName", sortable: true, editable: true },
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true  },
      { key: "LastModifiedTs", label: "LastModifiedTs", sortable: true },
    ],
  },
  // --- NEW --- Add the configuration for the Event Timeline view
  eventtimeline: {
    title: "Event Timeline",
    apiEndpoint: "/events",
    idKey: "EventID",
    detailsType: "event",
    isTimeline: true, // This special flag tells our render function to use the new component
    columns: [
       { key: "EventID", label: "Event ID", sortable: true, editable: true }, 
       { key: "EventCode", label: "Event Code", sortable: true, editable: true }, 
       { key: "Yr", label: "Year", sortable: true, editable: true }, 
       { key: "SubmittedDate", label: "Submitted Date", sortable: true, editable: true }, 
       { key: "FromDate", label: "From Date", sortable: true, editable: true }, 
       { key: "ToDate", label: "To Date", sortable: true, editable: true }, 
       { key: "EventName", label: "Event Name", sortable: true, editable: true }, 
       { key: "fkEventCategory", label: "Category", sortable: true, filterable: true, render: categoryTagRenderer, editable: true }, 
       { key: "NewEventCategory", label: "New Event Category", sortable: true, filterable: true, render: categoryTagRenderer, editable: true }, 
       { key: "EventRemarks", label: "Event Remarks", sortable: true, editable: true }, 
       { key: "EventMonth", label: "Event Month", sortable: true, editable: true }, 
       { key: "CommonID", label: "Common ID", sortable: true, editable: true }, 
       { key: "IsSubEvent1", label: "Is Sub Event1", sortable: true, editable: true }, 
       { key: "IsAudioRecorded", label: "Is Audio Record", sortable: true, editable: true }, 
       { key: "PravachanCount", label: "Pravachan Count", sortable: true, editable: true }, 
       { key: "UdgoshCount", label: "Udgosh Count", sortable: true, editable: true }, 
       { key: "PaglaCount", label: "Pagla Count", sortable: true, editable: true }, 
       { key: "PratishthaCount", label: "Pratishtha Count", sortable: true, editable: true }, 
       { key: "SummaryRemarks", label: "Summary Remarks", sortable: true, editable: true }, 
       { key: "Pra-SU-duration", label: "Pra-SU-duration", sortable: true, editable: true }, 
       { key: "LastModifiedBy", label: "Last Modified By", sortable: true, editable: true }, 
       { key: "LastModifiedTimestamp", label: "Last Modified Timestamp", sortable: true, editable: true }, 
       { key: "NewEventFrom", label: "New Event From", sortable: true, editable: true }, 
       { key: "NewEventTo", label: "New Event To", sortable: true, editable: true },
    ],
  },


    edited_highlights: {
    title: "List of Edited Highlights",
    apiEndpoint: "/edited-highlights",
    idKey: "RecordingCode",
    detailsType: "highlight",
    columns: [
     { key: "Yr", label: "Event Year", sortable: true, editable: true },

     {
        key: "EventDisplay",
        label: "Event Name - EventCode",
        sortable: true,
        editable: false,
        render: (_v: any, row: any) => {
          const en = row.EventName || "";
          const ec = row.EventCode || "";
          return `${en}${en && ec ? " - " : ""}${ec}`;
        },
      },
     
      { key: "RecordingName", label: "Recording Name", sortable: true, editable: true },
      { key: "Duration", label: "Duration", sortable: true, editable: true },
      { key: "RecordingCode", label: "Recording Code", sortable: true, editable: true },
       { key: "FromDate", label: "Event From Date", sortable: true, editable: true },
      { key: "ToDate", label: "Event To Date", sortable: true, editable: true },
      { key: "Teams", label: "Teams", sortable: true, render: categoryTagRenderer, editable: true },
     
     
    ],
  },
};
type SidebarStackItem = {
  type: string;
  data: Record<string, any>;
  title: string;
};

// ===================================================================================
// --- 2. MAIN APP COMPONENT ---
// ===================================================================================

export default function App() {
  const [sidebarStack, setSidebarStack] = useState<SidebarStackItem[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [initialFilters, setInitialFilters] = useState<Record<string, any> | undefined>(undefined);
  const isMobile = useMobile();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user } = useAuth();
  
  const [selectedViewsForMgmt, setSelectedViewsForMgmt] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isColumnMgmtDialogOpen, setIsColumnMgmtDialogOpen] = useState(false);

  // --- MODIFIED: Initialize summary from localStorage to make it persistent ---
  const [changesSummary, setChangesSummary] = useState<string[]>(() => {
    try {
      const savedSummary = localStorage.getItem('columnChangesSummary');
      return savedSummary ? JSON.parse(savedSummary) : [];
    } catch (error) {
      console.error("Failed to parse changes summary from localStorage", error);
      return [];
    }
  });

  // --- NEW: A helper function to update both state and localStorage ---
  const updateChangesSummary = (newSummary: string) => {
    setChangesSummary(prev => {
      const updatedSummary = [...prev, newSummary];
      localStorage.setItem('columnChangesSummary', JSON.stringify(updatedSummary));
      return updatedSummary;
    });
  };

  // --- NEW: A function to clear the summary ---
  const clearChangesSummary = () => {
    setChangesSummary([]);
    localStorage.removeItem('columnChangesSummary');
  };

  // --- NEW: Fetch all users for column management dialog ---
  const { data: allUsers } = useQuery({
    queryKey: ['allUsersForColumnMgmt'],
    queryFn: async () => {
      const resp = await fetch(`${API_BASE_URL}/users`);
      if (!resp.ok) throw new Error('Failed to fetch users');
      const users = await resp.json();
      // --- MODIFIED: Ensure 'name' is prioritized, fallback to email if name is missing ---
      return users.map((u: any) => ({ 
        id: u.id, 
        name: u.name || u.email, // Use name, but have email as a fallback
        email: u.email 
      }));
    },
    // Only fetch if the user is an admin/owner and the management page is potentially active
    enabled: !!user && (user.role === 'Admin' || user.role === 'Owner'),
  });

  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  const handleCloseSidebar = () => setSidebarStack([]);
  const handlePopSidebar = () => setSidebarStack((prev) => prev.slice(0, -1));

  const handleRowSelect = (row: any, type: string) => {
    const config = Object.values(VIEW_CONFIGS).find(v => v.detailsType === type);
    const title = config ? `${config.title} Details` : "Details";
    setSidebarStack([{ type, data: row, title }]);
  };

  const handlePushSidebar = (item: SidebarStackItem) => {
    setSidebarStack((prev) => [...prev, item]);
  };
  
  // --- NEW: A more versatile key generation function for layouts ---
  const getLayoutKeys = (viewId: string, userId?: string | null) => {
    // If a userId is provided, create a user-specific key. Otherwise, create a global key.
    const prefix = userId ? `user-${userId}-view-${viewId}` : `global-view-${viewId}`;
    return {
      orderKey: `column-order-${prefix}`,
      hiddenKey: `hidden-columns-${prefix}`,
    };
  };

  const manageableViews = useMemo(() => {
    return Object.entries(VIEW_CONFIGS)
      .filter(([, config]) => config.apiEndpoint && config.columns)
      .map(([id, config]) => ({ id, title: config.title, columns: config.columns }));
  }, []);

  const getVisibleColumnKeysForMgmt = (viewId: string) => {
    const config = VIEW_CONFIGS[viewId];
    if (!config) return [];
    // For editing, we always load the GLOBAL/GUEST layout as the base
    const { orderKey } = getLayoutKeys(viewId); 
    const savedState = localStorage.getItem(orderKey);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        return Array.isArray(parsed) ? parsed : config.columns.map((c: any) => c.key);
      } catch (e) { console.error("Failed to parse column order", e); }
    }
    return config.columns.map((c: any) => c.key);
  };


  const [eventsLookup, setEventsLookup] = React.useState<Record<string, any>>({});

  React.useEffect(() => {
    if (activeView === "digitalrecordings") {
      fetch(`${API_BASE_URL}/events`)
        .then((res) => res.json())
        .then((data) => {
          const lookup: Record<string, any> = {};
          (Array.isArray(data) ? data : []).forEach((ev) => {
            if (ev.EventCode) lookup[ev.EventCode] = ev;
          });
          setEventsLookup(lookup);
        })
        .catch(() => setEventsLookup({}));
    }
  }, [activeView]);

 const renderView = () => {
  switch (activeView) {
    case "dashboard": return <Dashboard onShowDetails={handlePushSidebar} />;
    case "ai-assistant": return <AIAssistant />;
    case "user-management": return <UserManagement />;
    case "column-management":
    if (user?.role !== 'Admin' && user?.role !== 'Owner') {
      return (
        <div className="p-4 md:p-6 flex flex-col items-center justify-center text-center h-full">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
            <h1 className="text-2xl font-bold text-white">Permission Denied</h1>
            <p className="text-slate-400 mt-2">You do not have permission to access the Column Management page.</p>
        </div>
      );
    }
  return (
<div
  style={{
    padding: "1rem",
  }}
>
  <h1
    style={{
      fontSize: "1.875rem",
      fontWeight: "bold",
      color: "var(--foreground)",
      marginBottom: "1.5rem",
    }}
  >
    Column Management
  </h1>

  <Card
    style={{
      maxWidth: "1200px",
      
      margin: "2rem auto",
      padding: "1.5rem",
      borderRadius: "0.75rem",
      boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      height: "480px", // 👈 Smaller card height
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#000", // same dark look
      border: "1px solid rgb(51 65 85)",
    }}
  >
    <CardHeader>
      <CardTitle
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
        }}
      >
        Manage Column Layouts
      </CardTitle>
      <CardDescription
        style={{
          fontSize: "1rem",
          color: "rgb(148 163 184)",
        }}
      >
        Select views to configure their default column layout for guests or
        specific users.
      </CardDescription>
    </CardHeader>

    <CardContent
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        paddingTop: "0.5rem",
        overflow: "hidden",
      }}
    >
      {/* Scrollable list of selectable views */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          borderRadius: "0.5rem",
          border: "1px solid rgb(51 65 85)",
          padding: "0.5rem",
          backgroundColor: "#000",
          scrollbarWidth: "thin",
          scrollbarColor: "#475569 #1e293b",
        }}
        className="scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800"
      >
        {manageableViews.map((view) => (
          <label
            key={view.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.4rem 0.5rem",
              cursor: "pointer",
              borderRadius: "0.375rem",
            }}
            className="hover:bg-slate-800/50"
          >
            <input
              type="checkbox"
              checked={selectedViewsForMgmt.includes(view.id)}
              onChange={(e) => {
                if (e.target.checked)
                  setSelectedViewsForMgmt([
                    ...selectedViewsForMgmt,
                    view.id,
                  ]);
                else
                  setSelectedViewsForMgmt(
                    selectedViewsForMgmt.filter((id) => id !== view.id)
                  );
              }}
              style={{
                height: "1rem",
                width: "1rem",
                borderRadius: "0.25rem",
                backgroundColor: "rgb(51 65 85)",
                border: "1px solid rgb(71 85 105)",
                accentColor: "#3b82f6",
              }}
            />
            <span style={{ color: "rgb(226 232 240)" }}>{view.title}</span>
          </label>
        ))}
      </div>

      {/* Manage button */}
      <Button
        onClick={() => {
          if (selectedViewsForMgmt.length > 0) {
            setCurrentIndex(0);
            setIsColumnMgmtDialogOpen(true);
          }
        }}
        disabled={selectedViewsForMgmt.length === 0}
        style={{
          width: "50%",
          fontSize: "1.125rem",
          padding: "0.75rem 0",
          alignSelf: "center",
        }}
      >
        Manage Layouts for Selected Views
      </Button>

      {/* Summary of changes */}
      {changesSummary.length > 0 && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            border: "1px solid rgb(51 65 85)",
            borderRadius: "0.5rem",
            backgroundColor: "rgb(30 41 59 / 0.5)",
            overflowY: "auto",
            maxHeight: "120px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <h3
              style={{
                fontWeight: 600,
                color: "rgb(226 232 240)",
              }}
            >
              Summary of Changes
            </h3>
            {/* --- NEW: Clear button for the summary --- */}
            <Button
              variant="link"
              onClick={clearChangesSummary}
              style={{ padding: 0, height: "auto", color: "rgb(148 163 184)" }}
            >
              Clear
            </Button>
          </div>
          <ul
            style={{
              fontSize: "0.875rem",
              color: "rgb(203 213 225)",
              listStyle: "none",
              paddingLeft: 0,
              margin: 0,
            }}
          >
            {changesSummary.map((item, idx) => (
              <li key={idx}>✅ {item}</li>
            ))}
          </ul>
        </div>
      )}
    </CardContent>
  </Card>

  {/* Dialog Component */}
  {selectedViewsForMgmt.length > 0 && selectedViewsForMgmt[currentIndex] && (
    <ManageColumnsDialog
      isOpen={isColumnMgmtDialogOpen}
      onClose={() => {
        setIsColumnMgmtDialogOpen(false);
        if (currentIndex + 1 < selectedViewsForMgmt.length) {
          setCurrentIndex(currentIndex + 1);
          setIsColumnMgmtDialogOpen(true);
        } else {
          setCurrentIndex(0);
          setSelectedViewsForMgmt([]);
        }
      }}
      allColumns={
        manageableViews.find(
          (v) => v.id === selectedViewsForMgmt[currentIndex]
        )?.columns || []
      }
      visibleColumnKeys={getVisibleColumnKeysForMgmt(
        selectedViewsForMgmt[currentIndex]
      )}
     viewId={selectedViewsForMgmt[currentIndex]}
     tableName={manageableViews.find((v) => v.id === selectedViewsForMgmt[currentIndex])?.title || selectedViewsForMgmt[currentIndex]}
      users={allUsers || []}
      onUpdateColumns={(...args: any[]) => {
        // noop handler to satisfy ManageColumnsDialogProps; can be extended to preview changes
      }}
      onSave={(saveConfig: SaveConfig) => {
        const { viewId, visibleKeys, hiddenKeys, target } = saveConfig;
        const viewTitle =
          manageableViews.find((v) => v.id === viewId)?.title || viewId;

        if (target.type === "global_guest") {
          const { orderKey, hiddenKey } = getLayoutKeys(viewId);
          localStorage.setItem(orderKey, JSON.stringify(visibleKeys));
          localStorage.setItem(hiddenKey, JSON.stringify(hiddenKeys));
          const summaryMsg = `Guest layout for "${viewTitle}" was updated.`;
          updateChangesSummary(summaryMsg); // --- MODIFIED: Use the new helper function
          toast.success(summaryMsg);
        } else if (target.type === "specific_users") {
          target.userIds.forEach((userId) => {
            const { orderKey, hiddenKey } = getLayoutKeys(viewId, userId);
            localStorage.setItem(orderKey, JSON.stringify(visibleKeys));
            localStorage.setItem(hiddenKey, JSON.stringify(hiddenKeys));
          });

          // --- MODIFIED: Generate summary message with user emails instead of names ---
          const selectedUsers = (allUsers || []).filter((u: any) => target.userIds.includes(u.id));
          const userEmails = selectedUsers.map((u: any) => u.email); // Use email instead of name
          let userSummaryText = '';

          if (userEmails.length === 1) {
            userSummaryText = `for ${userEmails[0]}`;
          } else if (userEmails.length > 1 && userEmails.length <= 3) {
            userSummaryText = `for ${userEmails.slice(0, -1).join(', ')} and ${userEmails.slice(-1)}`;
          } else if (userEmails.length > 3) {
            userSummaryText = `for ${userEmails.slice(0, 2).join(', ')} and ${userEmails.length - 2} others`;
          } else {
            userSummaryText = `for ${target.userIds.length} user(s)`;
          }

          const summaryMsg = `Layout for "${viewTitle}" was updated ${userSummaryText}.`;
          updateChangesSummary(summaryMsg); // --- MODIFIED: Use the new helper function
          toast.success(summaryMsg);
        }
      }}
    />
  )}
</div>


  );

    case "satsang_dashboard": return (
        <div className="p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {VIEW_CONFIGS.satsang_dashboard.title}
          </h1>
          <SatsangDashboard />
        </div>
      );
  }

  const config = VIEW_CONFIGS[activeView];
  if (config) {
    if (config.isTimeline) {
      return (
        <EventTimeline
          apiEndpoint={config.apiEndpoint}
          title={config.title}
          onShowDetails={(eventData) =>
            handlePushSidebar({
              type: config.detailsType,
              data: eventData,
              title: "Event Details",
            })
          }
        />
      );
    }
    
    // --- IMPORTANT ---
    // For the specific user layouts to work, you must update ClickUpListViewUpdated.tsx.
    // It needs to check for a user-specific layout in localStorage first,
    // then fall back to the global layout, and finally to the default config.
    // Example logic for ClickUpListViewUpdated:
    // const { user } = useAuth();
    // const userLayoutKey = `user-${user.id}-view-${viewId}`;
    // const globalLayoutKey = `global-view-${viewId}`;
    // const userOrder = localStorage.getItem(`column-order-${userLayoutKey}`);
    // const globalOrder = localStorage.getItem(`column-order-${globalLayoutKey}`);
    // // ... then use the most specific layout found.

    const extraProps = activeView === "digitalrecordings"
      ? {
          groupEnabled: true,
          rowTransformer: (row: any) => {
            const ev = eventsLookup[row.fkEventCode || row.EventCode || row.RecordingEventCode] || null;
            const Yr = row.Yr || (row.SubmittedDate ? new Date(row.SubmittedDate).getFullYear() : ev && (ev.Yr || (ev.FromDate ? new Date(ev.FromDate).getFullYear() : undefined)));
            return { ...row, Yr, EventName: row.EventName || ev?.EventName || "", fkEventCategory: row.fkEventCategory || ev?.fkEventCategory || "", };
          },
        }
      : {};

    return (
      <ClickUpListViewUpdated
        key={activeView}
        title={config.title}
        viewId={activeView}
        apiEndpoint={config.apiEndpoint}
        idKey={config.idKey}
        onRowSelect={(row) => handleRowSelect(row, config.detailsType)}
        columns={config.columns}
        views={config.views}
        filterConfigs={[]}
        showAddButton={!!config.isDropdown}
        initialGroupBy={config.groupBy}
        initialSortBy={config.sortBy}
        initialSortDirection={config.sortDirection}
        initialFilters={initialFilters}
        onViewChange={() => setInitialFilters(undefined)}
        {...extraProps}
      />
    );
  }
  
  return <Dashboard onShowDetails={handlePushSidebar} />;
};
  
  const sidebarWidth = 384;
  const cascadeOffset = 24;
  const sidebarContainerWidth = sidebarStack.length > 0 ? sidebarWidth + (sidebarStack.length - 1) * cascadeOffset : 0;

  // ===================================================================================
  // --- 4. JSX LAYOUT ---
 
  // (This section remains unchanged)
  // ===================================================================================
  if (isMobile) {
    return (
      <div className="dark min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 px-4 py-3 flex items-center justify-between shadow-sm">
          <Button variant="ghost" size="sm" onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} className="p-2 -ml-2 text-white hover:bg-slate-800" >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-white truncate">{VIEW_CONFIGS[activeView]?.title || 'Dashboard'}</h1>
          <div className="w-10"></div>
        </div>
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)}>
            <div className="fixed left-0 top-0 h-full w-80 max-w-[90vw] bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-out" onClick={(e) => e.stopPropagation()} style={{ transform: mobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }} >
              <div className="flex items-center justify-between p-4 border-b bg-slate-900 border-slate-700">
                <h2 className="text-lg font-semibold text-white">Navigation</h2>
                <Button variant="ghost" size="sm" onClick={() => setMobileSidebarOpen(false)} className="p-2 text-white hover:bg-slate-800" >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="h-full overflow-y-auto pb-20">
                <Sidebar activeView={activeView} onViewChange={(view) => { setActiveView(view); setMobileSidebarOpen(false); }} collapsed={false} isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
              </div>
            </div>
          </div>
        )}
        <InstallPrompt />
        <ResponsiveLayout>
          <DevelopmentBanner />
          <div key={activeView} className="w-full">{renderView()}</div>
          {sidebarStack.length > 0 && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
              <div className="absolute bottom-0 left-0 right-0 bg-slate-900 rounded-t-xl max-h-[80vh] overflow-hidden animate-slide-up border-t border-slate-700">
                {sidebarStack.map((item, index) => (<DetailsSidebar key={index} isOpen={true} onClose={index === 0 ? handleCloseSidebar : handlePopSidebar} data={item.data} type={item.type} title={item.title} onPushSidebar={handlePushSidebar} zIndex={100 + index} positionOffset={0} />))}
              </div>
            </div>
          )}
        </ResponsiveLayout>
        <MobileNavigation activeView={activeView} onViewChange={setActiveView} />
      </div>
    );
  }

  return (
    <div className="dark flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <Sidebar activeView={activeView} onViewChange={setActiveView} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-auto transition-all duration-300 ease-in-out">
          <DevelopmentBanner />
          <div key={activeView}>{renderView()}</div>
        </main>
        <div className="relative transition-all duration-300 ease-in-out flex-shrink-0" style={{ width: `${sidebarContainerWidth}px` }} >
          {sidebarStack.map((item, index) => (
            <DetailsSidebar key={index} isOpen={true} onClose={index === 0 ? handleCloseSidebar : handlePopSidebar} data={item.data} type={item.type} title={item.title} onPushSidebar={handlePushSidebar} zIndex={100 + index} positionOffset={index * cascadeOffset} />
          ))}
        </div>
      </div>
    </div>
  );
}