"use client";

import * as React from "react";
import { useState } from "react";
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
import { Menu, X } from "lucide-react";
import { getColorForString } from "./components/ui/utils";
import { time } from "motion/react";

// ===================================================================================
// --- 1. VIEW CONFIGURATIONS & HELPERS ---
// All column definitions and view-specific settings are centralized here.
// This makes the main component JSX much cleaner.
// ===================================================================================

const categoryTagRenderer = (value: string | null | undefined) => {
    if (!value) return <span className="text-slate-500">N/A</span>;

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
  events: {
    title: "Events",
    apiEndpoint: "/events",
    idKey: "EventID",
    detailsType: "event",
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
  medialog_all: {
    title: "Media Log: All",
    apiEndpoint: "/newmedialog",
    idKey: "MLUniqueID",
    detailsType: "medialog",
    columns: [
      { key: "MLUniqueID", label: "MLUniqueID", sortable: true, editable: true },
      { key: "FootageSrNo", label: "FootageSrNo", sortable: true, editable: true },
      { key: "LogSerialNo", label: "LogSerialNo", sortable: true, editable: true },
      { key: "fkDigitalRecordingCode", label: "fkDigitalRecordingCode", sortable: true, editable: true },
      { key: "ContentFrom", label: "ContentFrom", sortable: true, editable: true },
      { key: "ContentTo", label: "ContentTo", sortable: true, editable: true },
      { key: "TimeOfDay", label: "TimeOfDay", sortable: true,render: categoryTagRenderer, editable: true },
      { key: "fkOccasion", label: "fkOccasion", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "EditingStatus", label: "EditingStatus", sortable: true,render: categoryTagRenderer, editable: true },
      { key: "FootageType", label: "FootageType", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "VideoDistribution", label: "VideoDistribution", sortable: true, editable: true },
      { key: "Detail", label: "Detail", sortable: true,render: categoryTagRenderer, editable: true },
      { key: "SubDetail", label: "SubDetail", sortable: true, editable: true },
      { key: "CounterFrom", label: "CounterFrom", sortable: true, editable: true },
      { key: "CounterTo", label: "CounterTo", sortable: true, editable: true },
      { key: "SubDuration", label: "SubDuration", sortable: true, editable: true },
      { key: "TotalDuration", label: "TotalDuration", sortable: true, editable: true },
      { key: "Language", label: "Language", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "SpeakerSinger", label: "SpeakerSinger", sortable: true, editable: true },
      { key: "fkOrganization", label: "fkOrganization", sortable: true,render: categoryTagRenderer, editable: true },
      { key: "Designation", label: "Designation", sortable: true, editable: true },
      { key: "fkCountry", label: "fkCountry", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "fkState", label: "fkState", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "fkCity", label: "fkCity", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Venue", label: "Venue", sortable: true, editable: true },
      { key: "fkGranth", label: "fkGranth", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Number", label: "Number", sortable: true, editable: true },
      { key: "Topic", label: "Topic", sortable: true, editable: true },
      { key: "SeriesName", label: "SeriesName", sortable: true, editable: true },
      { key: "SatsangStart", label: "SatsangStart", sortable: true, editable: true },
      { key: "SatsangEnd", label: "SatsangEnd", sortable: true, editable: true },
      { key: "IsAudioRecorded", label: "IsAudioRecorded", sortable: true, editable: true },
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
      { key: "Keywords", label: "Keywords", sortable: true,render: categoryTagRenderer, editable: true },
      { key: "Grading", label: "Grading", sortable: true, editable: true },
      { key: "Segment Category", label: "Segment Category", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Segment Duration", label: "Segment Duration", sortable: true, editable: true , render: categoryTagRenderer},
      { key: "TopicGivenBy", label: "TopicGivenBy", sortable: true, editable: true , render: categoryTagRenderer},
    ],
  },
  medialog_all_except_satsang: {
    title: "Media Log: All Except Satsang",
    apiEndpoint: "/newmedialog/all-except-satsang",
    idKey: "MLUniqueID",
    detailsType: "medialog",
    columns: [
      { key: "MLUniqueID", label: "MLUniqueID", sortable: true, editable: true },
      { key: "FootageSrNo", label: "FootageSrNo", sortable: true, editable: true },
      { key: "LogSerialNo", label: "LogSerialNo", sortable: true, editable: true },
      { key: "fkDigitalRecordingCode", label: "fkDigitalRecordingCode", sortable: true, editable: true },
      { key: "ContentFrom", label: "ContentFrom", sortable: true, editable: true },
      { key: "ContentTo", label: "ContentTo", sortable: true, editable: true },
      { key: "TimeOfDay", label: "TimeOfDay", sortable: true,render: categoryTagRenderer, editable: true },
      { key: "fkOccasion", label: "fkOccasion", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "EditingStatus", label: "EditingStatus", sortable: true,render: categoryTagRenderer, editable: true },
      { key: "FootageType", label: "FootageType", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "VideoDistribution", label: "VideoDistribution", sortable: true, editable: true },
      { key: "Detail", label: "Detail", sortable: true,render: categoryTagRenderer, editable: true },
      { key: "SubDetail", label: "SubDetail", sortable: true, editable: true },
      { key: "CounterFrom", label: "CounterFrom", sortable: true, editable: true },
      { key: "CounterTo", label: "CounterTo", sortable: true, editable: true },
      { key: "SubDuration", label: "SubDuration", sortable: true, editable: true },
      { key: "TotalDuration", label: "TotalDuration", sortable: true, editable: true },
      { key: "Language", label: "Language", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "SpeakerSinger", label: "SpeakerSinger", sortable: true, editable: true },
      { key: "fkOrganization", label: "fkOrganization", sortable: true,render: categoryTagRenderer, editable: true },
      { key: "Designation", label: "Designation", sortable: true, editable: true },
      { key: "fkCountry", label: "fkCountry", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "fkState", label: "fkState", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "fkCity", label: "fkCity", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Venue", label: "Venue", sortable: true, editable: true },
      { key: "fkGranth", label: "fkGranth", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Number", label: "Number", sortable: true, editable: true },
      { key: "Topic", label: "Topic", sortable: true, editable: true },
      { key: "SeriesName", label: "SeriesName", sortable: true, editable: true },
      { key: "SatsangStart", label: "SatsangStart", sortable: true, editable: true },
      { key: "SatsangEnd", label: "SatsangEnd", sortable: true, editable: true },
      { key: "IsAudioRecorded", label: "IsAudioRecorded", sortable: true, editable: true },
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
      { key: "Keywords", label: "Keywords", sortable: true,render: categoryTagRenderer, editable: true },
      { key: "Grading", label: "Grading", sortable: true, editable: true },
      { key: "Segment Category", label: "Segment Category", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Segment Duration", label: "Segment Duration", sortable: true, editable: true },
      { key: "TopicGivenBy", label: "TopicGivenBy", sortable: true, editable: true },
    ],
  },
  medialog_satsang_extracted_clips: {
    title: "Media Log: Satsang Extracted Clips",
    apiEndpoint: "/newmedialog/satsang-extracted-clips",
    idKey: "MLUniqueID",
    detailsType: "medialog",
    columns: [
      { key: "MLUniqueID", label: "MLUniqueID", sortable: true, editable: true },
      { key: "FootageSrNo", label: "FootageSrNo", sortable: true, editable: true },
      { key: "LogSerialNo", label: "LogSerialNo", sortable: true, editable: true },
      { key: "fkDigitalRecordingCode", label: "fkDigitalRecordingCode", sortable: true, editable: true },
      { key: "ContentFrom", label: "ContentFrom", sortable: true, editable: true },
      { key: "ContentTo", label: "ContentTo", sortable: true, editable: true },
      { key: "TimeOfDay", label: "TimeOfDay", sortable: true,render: categoryTagRenderer, editable: true },
      { key: "fkOccasion", label: "fkOccasion", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "EditingStatus", label: "EditingStatus", sortable: true,render: categoryTagRenderer, editable: true },
      { key: "FootageType", label: "FootageType", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "VideoDistribution", label: "VideoDistribution", sortable: true, editable: true },
      { key: "Detail", label: "Detail", sortable: true,render: categoryTagRenderer, editable: true },
      { key: "SubDetail", label: "SubDetail", sortable: true, editable: true },
      { key: "CounterFrom", label: "CounterFrom", sortable: true, editable: true },
      { key: "CounterTo", label: "CounterTo", sortable: true, editable: true },
      { key: "SubDuration", label: "SubDuration", sortable: true, editable: true },
      { key: "TotalDuration", label: "TotalDuration", sortable: true, editable: true },
      { key: "Language", label: "Language", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "SpeakerSinger", label: "SpeakerSinger", sortable: true, editable: true },
      { key: "fkOrganization", label: "fkOrganization", sortable: true,render: categoryTagRenderer, editable: true },
      { key: "Designation", label: "Designation", sortable: true, editable: true },
      { key: "fkCountry", label: "fkCountry", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "fkState", label: "fkState", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "fkCity", label: "fkCity", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Venue", label: "Venue", sortable: true, editable: true },
      { key: "fkGranth", label: "fkGranth", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Number", label: "Number", sortable: true, editable: true },
      { key: "Topic", label: "Topic", sortable: true, editable: true },
      { key: "SeriesName", label: "SeriesName", sortable: true, editable: true },
      { key: "SatsangStart", label: "SatsangStart", sortable: true, editable: true },
      { key: "SatsangEnd", label: "SatsangEnd", sortable: true, editable: true },
      { key: "IsAudioRecorded", label: "IsAudioRecorded", sortable: true, editable: true },
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
      { key: "Keywords", label: "Keywords", sortable: true,render: categoryTagRenderer, editable: true },
      { key: "Grading", label: "Grading", sortable: true, editable: true },
      { key: "Segment Category", label: "Segment Category", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Segment Duration", label: "Segment Duration", sortable: true, editable: true },
      { key: "TopicGivenBy", label: "TopicGivenBy", sortable: true, editable: true },
    ],
  },
  medialog_satsang_category: {
    title: "Media Log: Satsang Category",
    apiEndpoint: "/newmedialog/satsang-category",
    idKey: "MLUniqueID",
    detailsType: "medialog",
    columns: [
      { key: "MLUniqueID", label: "MLUniqueID", sortable: true, editable: true },
      { key: "FootageSrNo", label: "FootageSrNo", sortable: true, editable: true },
      { key: "LogSerialNo", label: "LogSerialNo", sortable: true, editable: true },
      { key: "fkDigitalRecordingCode", label: "fkDigitalRecordingCode", sortable: true, editable: true },
      { key: "ContentFrom", label: "ContentFrom", sortable: true, editable: true },
      { key: "ContentTo", label: "ContentTo", sortable: true, editable: true },
      { key: "TimeOfDay", label: "TimeOfDay", sortable: true,render: categoryTagRenderer, editable: true },
      { key: "fkOccasion", label: "fkOccasion", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "EditingStatus", label: "EditingStatus", sortable: true,render: categoryTagRenderer, editable: true },
      { key: "FootageType", label: "FootageType", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "VideoDistribution", label: "VideoDistribution", sortable: true, editable: true },
      { key: "Detail", label: "Detail", sortable: true,render: categoryTagRenderer, editable: true },
      { key: "SubDetail", label: "SubDetail", sortable: true, editable: true },
      { key: "CounterFrom", label: "CounterFrom", sortable: true, editable: true },
      { key: "CounterTo", label: "CounterTo", sortable: true, editable: true },
      { key: "SubDuration", label: "SubDuration", sortable: true, editable: true },
      { key: "TotalDuration", label: "TotalDuration", sortable: true, editable: true },
      { key: "Language", label: "Language", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "SpeakerSinger", label: "SpeakerSinger", sortable: true, editable: true },
      { key: "fkOrganization", label: "fkOrganization", sortable: true,render: categoryTagRenderer, editable: true },
      { key: "Designation", label: "Designation", sortable: true, editable: true },
      { key: "fkCountry", label: "fkCountry", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "fkState", label: "fkState", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "fkCity", label: "fkCity", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Venue", label: "Venue", sortable: true, editable: true },
      { key: "fkGranth", label: "fkGranth", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Number", label: "Number", sortable: true, editable: true },
      { key: "Topic", label: "Topic", sortable: true, editable: true },
      { key: "SeriesName", label: "SeriesName", sortable: true, editable: true },
      { key: "SatsangStart", label: "SatsangStart", sortable: true, editable: true },
      { key: "SatsangEnd", label: "SatsangEnd", sortable: true, editable: true },
      { key: "IsAudioRecorded", label: "IsAudioRecorded", sortable: true, editable: true },
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
      { key: "Keywords", label: "Keywords", sortable: true,render: categoryTagRenderer, editable: true },
      { key: "Grading", label: "Grading", sortable: true, editable: true },
      { key: "Segment Category", label: "Segment Category", sortable: true, render: categoryTagRenderer, editable: true },
      { key: "Segment Duration", label: "Segment Duration", sortable: true, editable: true },
      { key: "TopicGivenBy", label: "TopicGivenBy", sortable: true, editable: true },
    ],
  },
  digitalrecordings: {
    title: "Digital Recordings",
    apiEndpoint: "/digitalrecording",
    idKey: "RecordingCode",
    detailsType: "digitalrecording",
    columns : [
  { key: "fkEventCode", label: "fkEventCode", sortable: true, editable: true },
  { key: "RecordingName", label: "RecordingName", sortable: true, editable: true },
  { key: "RecordingCode", label: "RecordingCode", sortable: true, editable: true },
  { key: "NoOfFiles", label: "NoOfFiles", sortable: true, editable: true },
  { key: "fkDigitalMasterCategory", label: "fkDigitalMasterCategory", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "fkMediaName", label: "fkMediaName", sortable: true,render: categoryTagRenderer, editable: true },
  { key: "BitRate", label: "BitRate", sortable: true, editable: true },
  { key: "AudioBitrate", label: "AudioBitrate", sortable: true, editable: true },
  { key: "Filesize", label: "Filesize", sortable: true, editable: true },
  { key: "Duration", label: "Duration", sortable: true, editable: true },
  { key: "AudioTotalDuration", label: "AudioTotalDuration", sortable: true, editable: true },
  { key: "RecordingRemarks", label: "RecordingRemarks", sortable: true, editable: true },
  { key: "CounterError", label: "CounterError", sortable: true, editable: true },
  { key: "ReasonError", label: "ReasonError", sortable: true, editable: true },
  { key: "QcRemarksCheckedOn", label: "QcRemarksCheckedOn", sortable: true, editable: true },
  { key: "PreservationStatus", label: "PreservationStatus", sortable: true,render: categoryTagRenderer, editable: true },
  { key: "QCSevak", label: "QCSevak", sortable: true, editable: true },
  { key: "MasterProductTitle", label: "MasterProductTitle", sortable: true, editable: true },
  { key: "QcStatus", label: "QcStatus", sortable: true, editable: true },
  { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true, editable: true },
  { key: "fkDistributionLabel", label: "fkDistributionLabel", sortable: true, render: categoryTagRenderer, editable: true },
  { key: "SubmittedDate", label: "SubmittedDate", sortable: true, editable: true },
  { key: "PresStatGuidDt", label: "PresStatGuidDt", sortable: true, editable: true },
  { key: "InfoOnCassette", label: "InfoOnCassette", sortable: true, editable: true },
  { key: "Masterquality", label: "Masterquality", sortable: true,render: categoryTagRenderer, editable: true },
  { key: "IsInformal", label: "IsInformal", sortable: true, editable: true },
  { key: "FilesizeInBytes", label: "FilesizeInBytes", sortable: true, editable: true },
  { key: "AssociatedDR", label: "AssociatedDR", sortable: true, editable: true },
  { key: "Dimension", label: "Dimension", sortable: true,render: categoryTagRenderer, editable: true },
  { key: "ProductionBucket", label: "ProductionBucket", sortable: true,render: categoryTagRenderer, editable: true },
  { key: "DistributionDriveLink", label: "DistributionDriveLink", sortable: true, editable: true },
  { key: "Teams", label: "Teams", sortable: true,render: categoryTagRenderer, editable: true },
],

  },
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
  auxfiletype: {
    title: "Aux File Type",
    apiEndpoint: "/aux-file-type",
    idKey: "AuxTypeID",
    detailsType: "auxfiletype",
    columns: [
      { key: "AuxTypeID", label: "AuxTypeID", sortable: true, editable: true },
      { key: "AuxFileType", label: "AuxFileType", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true, editable: true },
    ],
  },
  audio: {
    title: "Audio",
    apiEndpoint: "/audio",
    idKey: "AID",
    detailsType: "audio",
    columns: [
     { key: "AID", label: "Audio ID", sortable: true, editable: true },
  { key: "AudioList", label: "AudioList", sortable: true, editable: true },
  { key: "Distribution", label: "Distribution", sortable: true, editable: true },
  { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true, editable: true }, 
     
    ],
  },
  bhajanType: {
    title: "Bhajan Type",
    apiEndpoint: "/bhajan-type",
    idKey: "BTID",
    detailsType: "bhajanType",
    columns: [
      { key: "BTID", label: "BTID", sortable: true, editable: true },
  { key: "BhajanName", label: "BhajanName", sortable: true, editable: true },
  { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true, editable: true },
    ],
  },
  digitalMasterCategory: {
    title: "Digital Master Category",
    apiEndpoint: "/digital-master-category",
    idKey: "DMCID",
    detailsType: "digitalMasterCategory",
    columns: [
     { key: "DMCID", label: "DMCID", sortable: true, editable: true },
  { key: "DMCategory_name", label: "DMCategory_name", sortable: true, editable: true },
  { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true, editable: true },
    ],
  },
  distributionLabel: {
    title: "Distribution Label",
    apiEndpoint: "/distribution-label",
    idKey: "LabelID",
    detailsType: "distributionLabel",
    columns: [
   { key: "LabelID", label: "Label ID", sortable: true, editable: true },
  { key: "LabelName", label: "Label Name", sortable: true, editable: true },
  { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true, editable: true },
    ],
  },
  editingType: {
    title: "Editing Type",
    apiEndpoint: "/editing-type",
    idKey: "EdID",
    detailsType: "editingType",
    columns: [
     { key: "EdID", label: "EdID", sortable: true, editable: true },
  { key: "EdType", label: "EdType", sortable: true, editable: true },
  { key: "AudioVideo", label: "AudioVideo", sortable: true, editable: true },
    ],
  },
  
  editingstatus: {
    title: "Editing Status",
    apiEndpoint: "/editing-status",
    idKey: "EdID",
    detailsType: "editingStatus",
    columns: [
      { key: "EdID", label: "EdID", sortable: true, editable: true },
      { key: "EdType", label: "EdType", sortable: true, editable: true },
      { key: "AudioVideo", label: "AudioVideo", sortable: true, editable: true },
    ],
  },

  eventCategory: {
    title: "Event Category",
    apiEndpoint: "/event-category",
    idKey: "EventCategoryID",
    detailsType: "eventCategory",
    columns: [
      { key: "EventCategoryID", label: "EventCategoryID", sortable: true, editable: true },
      { key: "EventCategory", label: "EventCategory", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true, editable: true },
    ],
  },
  footageType: {
    title: "Footage Type",
    apiEndpoint: "/footage-type",
    idKey: "FootageID",
    detailsType: "footageType",
    columns: [
      { key: "FootageID", label: "Footage ID", sortable: true, editable: true },
      { key: "FootageTypeList", label: "FootageTypeList", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true, editable: true },
    ],
  },
  formatType: {
    title: "Format Type",
    apiEndpoint: "/format-type",
    idKey: "FTID",
    detailsType: "formatType",
    columns: [
      { key: "FTID", label: "FTID", sortable: true, editable: true },
      { key: "Type", label: "Type", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true, editable: true },

    ],
  },
  granths: {
    title: "Granths",
    apiEndpoint: "/granths",
    idKey: "ID",
    detailsType: "granths",
    columns: [
      { key: "ID", label: "ID", sortable: true, editable: true },
      { key: "Name", label: "Name", sortable: true, editable: true }
    ],
  },
  language: {
    title: "Language",
    apiEndpoint: "/language",
    idKey: "STID",
    detailsType: "language",
    columns: [
      { key: "STID", label: "STID", sortable: true, editable: true },
      { key: "TitleLanguage", label: "TitleLanguage", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true, editable: true },
    ],
  },
  newEventCategory: {
    title: "New Event Category",
    apiEndpoint: "/new-event-category",
    idKey: "SrNo",
    detailsType: "newEventCategory",
    columns: [
      { key: "SrNo", label: "SrNo", sortable: true, editable: true },
      { key: "NewEventCategoryName", label: "NewEventCategoryName", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true, editable: true },
      { key: "MARK_DISCARD", label: "MARK_DISCARD", sortable: true, editable: true },
    ],
  },
  newCities: {
    title: "New Cities",
    apiEndpoint: "/new-cities",
    idKey: "CityID",
    detailsType: "newCities",
    columns: [
      { key: "CityID", label: "City ID", sortable: true, editable: true },
      { key: "City", label: "City", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true, editable: true }
    ],
  },
  newCountries: {
    title: "New Countries",
    apiEndpoint: "/new-countries",
    idKey: "CountryID",
    detailsType: "newCountries",
    columns: [
      { key: "CountryID", label: "Country ID", sortable: true, editable: true },
      { key: "Country", label: "Country", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true, editable: true },
    ],
  },
  newStates: {
    title: "New States",
    apiEndpoint: "/new-states",
    idKey: "StateID",
    detailsType: "newStates",
    columns: [
      { key: "StateID", label: "State ID", sortable: true, editable: true },
      { key: "State", label: "State", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true, editable: true },
    ],
  },

  masterquality: {
    title: "Master Quality",
    apiEndpoint: "/master-quality",
    idKey: "MQID",
    detailsType: "masterquality",
    columns: [
      { key: "MQID", label: "MQID", sortable: true, editable: true },
      { key: "MQName", label: "MQName", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true, editable: true },
    ],
  },

  organization: {
    title: "Organizations",
    apiEndpoint: "/organizations",
    idKey: "OrganizationID",
    detailsType: "organization",
    columns: [
      { key: "OrganizationID", label: "Organization ID", sortable: true, editable: true },
      { key: "Organization", label: "Organization", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true, editable: true },
    ],
  },
  occasions: {
    title: "Occasions",
    apiEndpoint: "/occasions",
    idKey: "OccasionID",
    detailsType: "occasions",
    columns: [
      { key: "OccasionID", label: "Occasion ID", sortable: true, editable: true },
      { key: "Occasion", label: "Occasion", sortable: true, editable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true, editable: true },
    ],
  },
  
  topicNumberSource: {
    title: "Topic Number Source",
    apiEndpoint: "/topic-number-source",
    idKey: "TNID",
    detailsType: "topicNumberSource",
    columns: [
      { key: "TNID", label: "TNID", sortable: true, editable: true },
      { key: "TNName", label: "TNName", sortable: true, editable: true }
    ],
  },

  timeOfDay: {
    title: "Time of Day",
    apiEndpoint: "/time-of-day",
    idKey: "TimeID",
    detailsType: "timeOfDay",
    columns: [
      { key: "TimeID", label: "Time ID", sortable: true, editable: true },
      { key: "TimeList", label: "Time List", sortable: true, editable: true }
    ],
  },

  topicgivenby: {
    title: "Topic Given By",
    apiEndpoint: "/topic-given-by",
    idKey: "TGBID",
    detailsType: "topicgivenby",
    columns: [
      { key: "TGBID", label: "TGBID", sortable: true, editable: true },
      { key: "TGB_Name", label: "TGB_Name", sortable: true, editable: true },
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true, editable: true },
      { key: "LastModifiedTs", label: "LastModifiedTs", sortable: true, editable: true },

    ],
  },

  segmentcategory: {
    title: "Segment Category",
    apiEndpoint: "/segment-category", 
    idKey: "SegCatID",
    detailsType: "segmentcategory",
    columns: [
      { key: "SegCatID", label: "SegCatID", sortable: true, editable: true },
      { key: "SegCatName", label: "SegCatName", sortable: true, editable: true },
      { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true, editable: true },
      { key: "LastModifiedTs", label: "LastModifiedTs", sortable: true, editable: true },

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
  const isMobile = useMobile();
  
  // For mobile, we start with sidebar closed
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // --- Handlers ---
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

  // --- 3. DYNAMIC VIEW RENDERER ---
  // This function now reads from the config object to render the correct view.
  const renderView = () => {
    // A) Handle non-list views (which don't use the config object)
    switch (activeView) {
      case "dashboard": return <Dashboard onShowDetails={handlePushSidebar} />;
      case "ai-assistant": return <AIAssistant />;
      case "user-management": return <UserManagement />;
    }

    // B) Handle all list views dynamically using the config object
    const config = VIEW_CONFIGS[activeView];
    if (config) {
      return (
        <ClickUpListViewUpdated
          title={config.title}
          apiEndpoint={config.apiEndpoint}
          idKey={config.idKey}
          onRowSelect={(row) => handleRowSelect(row, config.detailsType)}
          columns={config.columns}
          views={config.views} // This will be undefined for views that don't have it, which is fine
          filterConfigs={[]} // You can add this to your config object too
        />
      );
    }
    
    // C) Fallback to the dashboard if no view matches
    return <Dashboard onShowDetails={handlePushSidebar} />;
  };

  // --- Layout Calculation ---
  const sidebarWidth = 384;
  const cascadeOffset = 24;
  const sidebarContainerWidth = sidebarStack.length > 0 ? sidebarWidth + (sidebarStack.length - 1) * cascadeOffset : 0;

  // ===================================================================================
  // --- 4. JSX LAYOUT ---
  // Note: AuthProvider and ProtectedRoute have been removed from here.
  // They should wrap this App component in your main index.tsx or main.tsx file.
  // ===================================================================================
  if (isMobile) {
    return (
      <div className="dark min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Mobile Header Bar */}
        <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 px-4 py-3 flex items-center justify-between shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 -ml-2 text-white hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-white truncate">
            {VIEW_CONFIGS[activeView]?.title || 'Dashboard'}
          </h1>
          <div className="w-10"></div> {/* Spacer for centered title */}
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)}>
            <div 
              className="fixed left-0 top-0 h-full w-80 max-w-[90vw] bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-out" 
              onClick={(e) => e.stopPropagation()}
              style={{ transform: mobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}
            >
              {/* Mobile Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b bg-slate-900 border-slate-700">
                <h2 className="text-lg font-semibold text-white">Navigation</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-2 text-white hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Sidebar Content */}
              <div className="h-full overflow-y-auto pb-20">
                <Sidebar
                  activeView={activeView}
                  onViewChange={(view) => {
                    setActiveView(view);
                    setMobileSidebarOpen(false); // Close sidebar when item is selected
                  }}
                  collapsed={false}
                  onToggleCollapse={() => setMobileSidebarOpen(false)}
                />
              </div>
            </div>
          </div>
        )}

        <InstallPrompt />
        <ResponsiveLayout>
          <DevelopmentBanner />
          <div key={activeView} className="w-full">
            {renderView()}
          </div>
          {/* Mobile Details Modal */}
          {sidebarStack.length > 0 && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
              <div className="absolute bottom-0 left-0 right-0 bg-slate-900 rounded-t-xl max-h-[80vh] overflow-hidden animate-slide-up border-t border-slate-700">
                {sidebarStack.map((item, index) => (
                  <DetailsSidebar
                    key={index}
                    isOpen={true}
                    onClose={index === 0 ? handleCloseSidebar : handlePopSidebar}
                    data={item.data}
                    type={item.type}
                    title={item.title}
                    onPushSidebar={handlePushSidebar}
                    zIndex={100 + index}
                    positionOffset={0}
                  />
                ))}
              </div>
            </div>
          )}
        </ResponsiveLayout>

        {/* Bottom Navigation for Mobile */}
        <MobileNavigation activeView={activeView} onViewChange={setActiveView} />
      </div>
    );
  }

  return (
    <div className="dark flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* MAIN SIDEBAR */}
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* MAIN CONTENT + STACKED SIDE PANELS */}
      <div className="flex-1 flex overflow-hidden">
        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-auto transition-all duration-300 ease-in-out">
          <DevelopmentBanner />
          <div key={activeView}>{renderView()}</div>
        </main>

        {/* STACKED SIDE DETAILS */}
        <div
          className="relative transition-all duration-300 ease-in-out flex-shrink-0"
          style={{ width: `${sidebarContainerWidth}px` }}
        >
          {sidebarStack.map((item, index) => (
            <DetailsSidebar
              key={index}
              isOpen={true}
              onClose={index === 0 ? handleCloseSidebar : handlePopSidebar}
              data={item.data}
              type={item.type}
              title={item.title}
              onPushSidebar={handlePushSidebar}
              zIndex={100 + index}
              positionOffset={index * cascadeOffset}
            />
          ))}
        </div>
      </div>
    </div>
  );
}