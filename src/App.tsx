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
import { getColorForString } from "./components/ui/utils";

// ===================================================================================
// --- 1. VIEW CONFIGURATIONS & HELPERS ---
// All column definitions and view-specific settings are centralized here.
// This makes the main component JSX much cleaner.
// ===================================================================================

const categoryTagRenderer = (value: string | null | undefined) => {
    if (!value) return <span className="text-slate-500">N/A</span>;
    const bgColor = getColorForString(value);
    const getTextColorForBg = (hex: string): string => {
        if (!hex || hex.length < 7) return "#0f172a";
        const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.7 ? "#f2f4f7ff" : "#f1f5f9";
    };
    return (
        <div
            className="inline-block whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold border backdrop-blur-sm"
            style={{ backgroundColor: `${bgColor}40`, borderColor: `${bgColor}66`, color: getTextColorForBg(bgColor) }}
        >
            {value}
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
        { key: "EventID", label: "Event ID", sortable: true }, { key: "EventCode", label: "Event Code", sortable: true }, { key: "Yr", label: "Year", sortable: true }, { key: "SubmittedDate", label: "Submitted Date", sortable: true }, { key: "FromDate", label: "From Date", sortable: true }, { key: "ToDate", label: "To Date", sortable: true }, { key: "EventName", label: "Event Name", sortable: true }, { key: "fkEventCategory", label: "Category", sortable: true, filterable: true,render: categoryTagRenderer }, { key: "NewEventCategory", label: "New Event Category", sortable: true, filterable: true, render: categoryTagRenderer }, { key: "EventRemarks", label: "Event Remarks", sortable: true }, { key: "EventMonth", label: "Event Month", sortable: true }, { key: "CommonID", label: "Common ID", sortable: true }, { key: "IsSubEvent1", label: "Is Sub Event1", sortable: true }, { key: "IsAudioRecorded", label: "Is Audio Record", sortable: true }, { key: "PravachanCount", label: "Pravachan Count", sortable: true }, { key: "UdgoshCount", label: "Udgosh Count", sortable: true }, { key: "PaglaCount", label: "Pagla Count", sortable: true }, { key: "PratishthaCount", label: "Pratishtha Count", sortable: true }, { key: "SummaryRemarks", label: "Summary Remarks", sortable: true }, { key: "Pra-SU-duration", label: "Pra-SU-duration", sortable: true }, { key: "LastModifiedBy", label: "Last Modified By", sortable: true }, { key: "LastModifiedTimestamp", label: "Last Modified Timestamp", sortable: true }, { key: "NewEventFrom", label: "New Event From", sortable: true }, { key: "NewEventTo", label: "New Event To", sortable: true },
    ],
  },
  medialog: {
    title: "Media Log",
    apiEndpoint: "/newmedialog",
    idKey: "MLUniqueID",
    detailsType: "medialog",
    views: [
        { id: "all", name: "All", apiEndpoint: "/newmedialog" }, { id: "all-except-satsang", name: "All Except Satsang", apiEndpoint: "/newmedialog/all-except-satsang" }, { id: "satsang-extracted-clips", name: "Satsang Extracted Clips", apiEndpoint: "/newmedialog/satsang-extracted-clips" }, { id: "satsang-category", name: "Satsang Category", apiEndpoint: "/newmedialog/satsang-category" },
    ],
    columns: [
        { key: "MLUniqueID", label: "MLUniqueID", sortable: true }, { key: "FootageSrNo", label: "FootageSrNo", sortable: true }, { key: "LogSerialNo", label: "LogSerialNo", sortable: true }, { key: "fkDigitalRecordingCode", label: "fkDigitalRecordingCode", sortable: true }, { key: "ContentFrom", label: "ContentFrom", sortable: true }, { key: "ContentTo", label: "ContentTo", sortable: true }, { key: "TimeOfDay", label: "TimeOfDay", sortable: true }, { key: "fkOccasion", label: "fkOccasion", sortable: true,render: categoryTagRenderer }, { key: "EditingStatus", label: "EditingStatus", sortable: true }, { key: "FootageType", label: "FootageType", sortable: true,render: categoryTagRenderer }, { key: "VideoDistribution", label: "VideoDistribution", sortable: true }, { key: "Detail", label: "Detail", sortable: true }, { key: "SubDetail", label: "SubDetail", sortable: true }, { key: "CounterFrom", label: "CounterFrom", sortable: true }, { key: "CounterTo", label: "CounterTo", sortable: true }, { key: "SubDuration", label: "SubDuration", sortable: true }, { key: "TotalDuration", label: "TotalDuration", sortable: true }, { key: "Language", label: "Language", sortable: true,render: categoryTagRenderer }, { key: "SpeakerSinger", label: "SpeakerSinger", sortable: true }, { key: "fkOrganization", label: "fkOrganization", sortable: true }, { key: "Designation", label: "Designation", sortable: true }, { key: "fkCountry", label: "fkCountry", sortable: true,render: categoryTagRenderer }, { key: "fkState", label: "fkState", sortable: true ,render: categoryTagRenderer}, { key: "fkCity", label: "fkCity", sortable: true,render: categoryTagRenderer }, { key: "Venue", label: "Venue", sortable: true }, { key: "fkGranth", label: "fkGranth", sortable: true ,render: categoryTagRenderer}, { key: "Number", label: "Number", sortable: true }, { key: "Topic", label: "Topic", sortable: true }, { key: "SeriesName", label: "SeriesName", sortable: true }, { key: "SatsangStart", label: "SatsangStart", sortable: true }, { key: "SatsangEnd", label: "SatsangEnd", sortable: true }, { key: "IsAudioRecorded", label: "IsAudioRecorded", sortable: true }, { key: "AudioMP3Distribution", label: "AudioMP3Distribution", sortable: true }, { key: "AudioWAVDistribution", label: "AudioWAVDistribution", sortable: true }, { key: "AudioMP3DRCode", label: "AudioMP3DRCode", sortable: true }, { key: "AudioWAVDRCode", label: "AudioWAVDRCode", sortable: true }, { key: "FullWAVDRCode", label: "FullWAVDRCode", sortable: true }, { key: "Remarks", label: "Remarks", sortable: true }, { key: "IsStartPage", label: "IsStartPage", sortable: true }, { key: "EndPage", label: "EndPage", sortable: true }, { key: "IsInformal", label: "IsInformal", sortable: true }, { key: "IsPPGNotPresent", label: "IsPPGNotPresent", sortable: true }, { key: "Guidance", label: "Guidance", sortable: true }, { key: "DiskMasterDuration", label: "DiskMasterDuration", sortable: true }, { key: "EventRefRemarksCounters", label: "EventRefRemarksCounters", sortable: true }, { key: "EventRefMLID", label: "EventRefMLID", sortable: true }, { key: "EventRefMLID2", label: "EventRefMLID2", sortable: true }, { key: "DubbedLanguage", label: "DubbedLanguage", sortable: true }, { key: "DubbingArtist", label: "DubbingArtist", sortable: true }, { key: "HasSubtitle", label: "HasSubtitle", sortable: true }, { key: "SubTitlesLanguage", label: "SubTitlesLanguage", sortable: true,render: categoryTagRenderer }, { key: "EditingDeptRemarks", label: "EditingDeptRemarks", sortable: true }, { key: "EditingType", label: "EditingType", sortable: true ,render: categoryTagRenderer}, { key: "BhajanType", label: "BhajanType", sortable: true ,render: categoryTagRenderer}, { key: "IsDubbed", label: "IsDubbed", sortable: true }, { key: "NumberSource", label: "NumberSource", sortable: true ,render: categoryTagRenderer}, { key: "TopicSource", label: "TopicSource", sortable: true ,render: categoryTagRenderer}, { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true }, { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true }, { key: "Synopsis", label: "Synopsis", sortable: true }, { key: "LocationWithinAshram", label: "LocationWithinAshram", sortable: true }, { key: "Keywords", label: "Keywords", sortable: true }, { key: "Grading", label: "Grading", sortable: true },{ key: "Segment Category", label: "Segment Category", sortable: true, render: categoryTagRenderer }, { key: "Segment Duration", label: "Segment Duration", sortable: true }, { key: "TopicGivenBy", label: "TopicGivenBy", sortable: true },
    ],
  },
  digitalrecordings: {
    title: "Digital Recordings",
    apiEndpoint: "/digitalrecording",
    idKey: "RecordingCode",
    detailsType: "digitalrecording",
    columns: [
        { key: "fkEventCode", label: "fkEventCode", sortable: true }, { key: "RecordingName", label: "RecordingName", sortable: true }, { key: "RecordingCode", label: "RecordingCode", sortable: true }, { key: "NoOfFiles", label: "NoOfFiles", sortable: true }, { key: "fkDigitalMasterCategory", label: "fkDigitalMasterCategory", sortable: true,render: categoryTagRenderer }, { key: "fkMediaName", label: "fkMediaName", sortable: true }, { key: "BitRate", label: "BitRate", sortable: true }, { key: "AudioBitrate", label: "AudioBitrate", sortable: true }, { key: "Filesize", label: "Filesize", sortable: true }, { key: "Duration", label: "Duration", sortable: true }, { key: "AudioTotalDuration", label: "AudioTotalDuration", sortable: true }, { key: "RecordingRemarks", label: "RecordingRemarks", sortable: true }, { key: "CounterError", label: "CounterError", sortable: true }, { key: "ReasonError", label: "ReasonError", sortable: true }, { key: "QcRemarksCheckedOn", label: "QcRemarksCheckedOn", sortable: true }, { key: "PreservationStatus", label: "PreservationStatus", sortable: true }, { key: "QCSevak", label: "QCSevak", sortable: true }, { key: "MasterProductTitle", label: "MasterProductTitle", sortable: true }, { key: "QcStatus", label: "QcStatus", sortable: true }, { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true }, { key: "fkDistributionLabel", label: "fkDistributionLabel", sortable: true,render: categoryTagRenderer }, { key: "SubmittedDate", label: "SubmittedDate", sortable: true }, { key: "PresStatGuidDt", label: "PresStatGuidDt", sortable: true }, { key: "InfoOnCassette", label: "InfoOnCassette", sortable: true }, { key: "Masterquality", label: "Masterquality", sortable: true }, { key: "IsInformal", label: "IsInformal", sortable: true }, { key: "FilesizeInBytes", label: "FilesizeInBytes", sortable: true }, { key: "AssociatedDR", label: "AssociatedDR", sortable: true }, { key: "Dimension", label: "Dimension", sortable: true }, { key: "ProductionBucket", label: "ProductionBucket", sortable: true }, { key: "DistributionDriveLink", label: "DistributionDriveLink", sortable: true }, { key: "Teams", label: "Teams", sortable: true },
    ],
  },
  aux: {
    title: "Aux File",
    apiEndpoint: "/auxfiles",
    idKey: "new_auxid",
    detailsType: "aux",
    columns: [
        { key: "new_auxid", label: "New aux id", sortable: true }, { key: "AuxCode", label: "AuxCode", sortable: true }, { key: "AuxFileType", label: "AuxFileType", sortable: true }, { key: "AuxLanguage", label: "AuxLanguage", sortable: true }, { key: "fkMLID", label: "fkMLID", sortable: true }, { key: "AuxTopic", label: "AuxTopic", sortable: true }, { key: "NotesRemarks", label: "NotesRemarks", sortable: true }, { key: "GoogleDriveLink", label: "GoogleDriveLink", sortable: true }, { key: "NoOfFiles", label: "NoOfFiles", sortable: true }, { key: "FilesizeBytes", label: "FilesizeBytes", sortable: true }, { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true }, { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true }, { key: "ProjFileCode", label: "ProjFileCode", sortable: true }, { key: "ProjFileSize", label: "ProjFileSize", sortable: true }, { key: "ProjFileName", label: "ProjFileName", sortable: true }, { key: "SRTLink", label: "SRTLink", sortable: true }, { key: "CreatedOn", label: "CreatedOn", sortable: true }, { key: "CreatedBy", label: "CreatedBy", sortable: true }, { key: "ModifiedOn", label: "ModifiedOn", sortable: true }, { key: "ModifiedBy", label: "ModifiedBy", sortable: true },
    ],
  },
  audio: {
    title: "Audio",
    apiEndpoint: "/audio",
    idKey: "AID",
    detailsType: "audio",
    columns: [
      { key: "AID", label: "Audio ID", sortable: true },
      { key: "AudioList", label: "AudioList", sortable: true },
      { key: "Distribution", label: "Distribution", sortable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
     
    ],
  },
  bhajanType: {
    title: "Bhajan Type",
    apiEndpoint: "/bhajan-type",
    idKey: "BTID",
    detailsType: "bhajanType",
    columns: [
      { key: "BTID", label: "BTID", sortable: true },
      { key: "BhajanName", label: "BhajanName", sortable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
    ],
  },
  digitalMasterCategory: {
    title: "Digital Master Category",
    apiEndpoint: "/digital-master-category",
    idKey: "DMCID",
    detailsType: "digitalMasterCategory",
    columns: [
      { key: "DMCID", label: "DMCID", sortable: true },
      { key: "DMCategory_name", label: "DMCategory_name", sortable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
    ],
  },
  distributionLabel: {
    title: "Distribution Label",
    apiEndpoint: "/distribution-label",
    idKey: "LabelID",
    detailsType: "distributionLabel",
    columns: [
      { key: "LabelID", label: "Label ID", sortable: true },
      { key: "LabelName", label: "Label Name", sortable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
    ],
  },
  editingType: {
    title: "Editing Type",
    apiEndpoint: "/editing-type",
    idKey: "EdID",
    detailsType: "editingType",
    columns: [
      { key: "EdID", label: "EdID", sortable: true },
      { key: "EdType", label: "EdType", sortable: true },
      { key: "AudioVideo", label: "AudioVideo", sortable: true },
    ],
  },
  eventCategory: {
    title: "Event Category",
    apiEndpoint: "/event-category",
    idKey: "EventCategoryID",
    detailsType: "eventCategory",
    columns: [
      { key: "EventCategoryID", label: "EventCategoryID", sortable: true },
      { key: "EventCategory", label: "EventCategory", sortable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
    ],
  },
  footageType: {
    title: "Footage Type",
    apiEndpoint: "/footage-type",
    idKey: "FootageID",
    detailsType: "footageType",
    columns: [
      { key: "FootageID", label: "Footage ID", sortable: true },
      { key: "FootageTypeList", label: "FootageTypeList", sortable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
    ],
  },
  formatType: {
    title: "Format Type",
    apiEndpoint: "/format-type",
    idKey: "FTID",
    detailsType: "formatType",
    columns: [
      { key: "FTID", label: "FTID", sortable: true },
      { key: "Type", label: "Type", sortable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
    ],
  },
  granths: {
    title: "Granths",
    apiEndpoint: "/granths",
    idKey: "ID",
    detailsType: "granths",
    columns: [
      { key: "ID", label: "ID", sortable: true },
      { key: "Name", label: "Name", sortable: true }
      
    ],
  },
  language: {
    title: "Language",
    apiEndpoint: "/language",
    idKey: "STID",
    detailsType: "language",
    columns: [
      { key: "STID", label: "STID", sortable: true },
      { key: "TitleLanguage", label: "TitleLanguage", sortable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
    ],
  },
  newEventCategory: {
    title: "New Event Category",
    apiEndpoint: "/new-event-category",
    idKey: "SrNo",
    detailsType: "newEventCategory",
    columns: [
      { key: "SrNo", label: "SrNo", sortable: true },
      { key: "NewEventCategoryName", label: "NewEventCategoryName", sortable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
      { key: "MARK_DISCARD", label: "MARK_DISCARD", sortable: true },
    ],
  },
  newCities: {
    title: "New Cities",
    apiEndpoint: "/new-cities",
    idKey: "CityID",
    detailsType: "newCities",
    columns: [
      { key: "CityID", label: "City ID", sortable: true },
      { key: "City", label: "City", sortable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true }
    
    ],
  },
  newCountries: {
    title: "New Countries",
    apiEndpoint: "/new-countries",
    idKey: "CountryID",
    detailsType: "newCountries",
    columns: [
      { key: "CountryID", label: "Country ID", sortable: true },
      { key: "Country", label: "Country", sortable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
    ],
  },
  newStates: {
    title: "New States",
    apiEndpoint: "/new-states",
    idKey: "StateID",
    detailsType: "newStates",
    columns: [
      { key: "StateID", label: "State ID", sortable: true },
      { key: "State", label: "State", sortable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
    ],
  },
  occasions: {
    title: "Occasions",
    apiEndpoint: "/occasions",
    idKey: "OccasionID",
    detailsType: "occasions",
    columns: [
      { key: "OccasionID", label: "Occasion ID", sortable: true },
      { key: "Occasion", label: "Occasion", sortable: true },
      { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
    ],
  },
  
  topicNumberSource: {
    title: "Topic Number Source",
    apiEndpoint: "/topic-number-source",
    idKey: "TNID",
    detailsType: "topicNumberSource",
    columns: [
      { key: "TNID", label: "TNID", sortable: true },
      { key: "TNName", label: "TNName", sortable: true }
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

  // --- Handlers ---
  const handleCloseSidebar = () => setSidebarStack([]);
  const handlePopSidebar = () => setSidebarStack((prev) => prev.slice(0, -1));

  const handleRowSelect = (row: any, type: string) => {
    const titleMap: { [key: string]: string } = {
      event: "Event Details",
      medialog: "Media Log Details",
      digitalrecording: "Recording Details",
      aux: "Aux File Details",
    };
    setSidebarStack([{ type, data: row, title: titleMap[type] || "Details" }]);
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
    return <Dashboard />;
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