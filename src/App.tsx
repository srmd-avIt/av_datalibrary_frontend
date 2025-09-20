"use client";

import * as React from "react";
import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { ClickUpListViewUpdated } from "./components/ClickUpListViewUpdated";
import { AIAssistant } from "./components/AIAssistant";
import { UserManagement } from "./components/UserManagement";
import { DetailsSidebar } from "./components/DetailsSidebar";
import { Badge } from "./components/ui/badge";
import { title } from "process";


export default function App() {
  const [activeView, setActiveView] = useState("dashboard");
  type SelectedRowData = { type: string } & Record<string, any>;
  const [selectedRowData, setSelectedRowData] = useState<SelectedRowData | null>(null);
  const [detailsSidebarOpen, setDetailsSidebarOpen] = useState(false);

  const handleRowSelect = (row: any, type: string) => {
    setSelectedRowData({ ...row, type });
    setDetailsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setDetailsSidebarOpen(false);
    setSelectedRowData(null);
  };

  const getFilterConfigs = (viewType: string) => {
    // This function can be expanded later if needed
    return [];
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard />;
      
      case "ai-assistant":
        return <AIAssistant />;
      
      case "user-management":
        return <UserManagement />;
      
      case "events": 
        return (
          <ClickUpListViewUpdated
            title="Events"
            apiEndpoint="/events" 
            idKey="EventID"
            onRowSelect={(row) => handleRowSelect(row, "event")}
            filterConfigs={getFilterConfigs("countries")}
            columns={[
              
              { key: "EventID", label: "Event ID", sortable: true }, 
              { key: "EventCode", label: "Event Code" },
              { key: "Yr", label: "Year", sortable: true },
              { key: "SubmittedDate", label: "Submitted Date", sortable: true },
              { key: "FromDate", label: "From Date", sortable: true },
              { key: "ToDate", label: "To Date", sortable: true },
              { key: "EventName", label: "Event Name", sortable: true },
              { key: "fkEventCategory", label: "Category", sortable: true, filterable: true },
              { key: "NewEventCategory", label: "New Event Category", sortable: true, filterable: true },
              { key: "EventRemarks", label: "Event Remarks", sortable: true },
              { key: "EventMonth", label: "Event Month", sortable: true },
              { key: "CommonID", label: "Common ID", sortable: true },
              { key: "IsSubEvent1", label: "Is Sub Event1", sortable: true },
              { key: "IsAudioRecorded", label: "Is Audio Record", sortable: true },
              { key: "PravachanCount", label: "Pravachan Count", sortable: true },
              { key: "UdgoshCount", label: "Udgosh Count", sortable: true },
              { key: "PaglaCount", label: "Pagla Count", sortable: true },
              { key: "PratishthaCount", label: "Pratishtha Count", sortable: true },
              { key: "SummaryRemarks", label: "Summary Remarks", sortable: true },
              { key: "Pra-SU-duration", label: "Pra-SU-duration", sortable: true },
              { key: "LastModifiedBy", label: "Last Modified By", sortable: true },
              { key: "LastModifiedTimestamp", label: "Last Modified Timestamp", sortable: true },
              { key: "NewEventFrom", label: "New Event From", sortable: true },
              { key: "NewEventTo", label: "New Event To", sortable: true },
            ]}
          />
        );
      case "medialog":
  return (
    <ClickUpListViewUpdated
      title="Media Log"
      apiEndpoint="/newmedialog" // 👈 default view endpoint
      idKey="MLUniqueID"
      onRowSelect={(row) => handleRowSelect(row, "medialog")}
      filterConfigs={getFilterConfigs("medialog")}
      views={[
        { id: "all", name: "All", apiEndpoint: "/newmedialog" },
        { id: "all-except-satsang", name: "All Except Satsang", apiEndpoint: "/newmedialog/all-except-satsang" },
        { id: "satsang-extracted-clips", name: "Satsang Extracted Clips", apiEndpoint: "/newmedialog/satsang-extracted-clips" },
        { id: "satsang-category", name: "Satsang Category", apiEndpoint: "/newmedialog/satsang-category" }
      ]}
      columns={[
        { key: "MLUniqueID", label: "MLUniqueID", sortable: true },
        { key: "FootageSrNo", label: "FootageSrNo", sortable: true },
        { key: "LogSerialNo", label: "LogSerialNo", sortable: true },
        { key: "fkDigitalRecordingCode", label: "fkDigitalRecordingCode", sortable: true },
        { key: "ContentFrom", label: "ContentFrom", sortable: true },
        { key: "ContentTo", label: "ContentTo", sortable: true },
        { key: "TimeOfDay", label: "TimeOfDay", sortable: true },
        { key: "fkOccasion", label: "fkOccasion", sortable: true },
        { key: "EditingStatus", label: "EditingStatus", sortable: true },
        { key: "FootageType", label: "FootageType", sortable: true },
        { key: "VideoDistribution", label: "VideoDistribution", sortable: true },
        { key: "Detail", label: "Detail", sortable: true },
        { key: "SubDetail", label: "SubDetail", sortable: true },
        { key: "CounterFrom", label: "CounterFrom", sortable: true },
        { key: "CounterTo", label: "CounterTo", sortable: true },
        { key: "SubDuration", label: "SubDuration", sortable: true },
        { key: "TotalDuration", label: "TotalDuration", sortable: true },
        { key: "Language", label: "Language", sortable: true },
        { key: "SpeakerSinger", label: "SpeakerSinger", sortable: true },
        { key: "fkOrganization", label: "fkOrganization", sortable: true },
        { key: "Designation", label: "Designation", sortable: true },
        { key: "fkCountry", label: "fkCountry", sortable: true },
        { key: "fkState", label: "fkState", sortable: true },
        { key: "fkCity", label: "fkCity", sortable: true },
        { key: "Venue", label: "Venue", sortable: true },
        { key: "fkGranth", label: "fkGranth", sortable: true },
        { key: "Number", label: "Number", sortable: true },
        { key: "Topic", label: "Topic", sortable: true },
        { key: "SeriesName", label: "SeriesName", sortable: true },
        { key: "SatsangStart", label: "SatsangStart", sortable: true },
        { key: "SatsangEnd", label: "SatsangEnd", sortable: true },
        { key: "IsAudioRecorded", label: "IsAudioRecorded", sortable: true },
        { key: "AudioMP3Distribution", label: "AudioMP3Distribution", sortable: true },
        { key: "AudioWAVDistribution", label: "AudioWAVDistribution", sortable: true },
        { key: "AudioMP3DRCode", label: "AudioMP3DRCode", sortable: true },
        { key: "AudioWAVDRCode", label: "AudioWAVDRCode", sortable: true },
        { key: "FullWAVDRCode", label: "FullWAVDRCode", sortable: true },
        { key: "Remarks", label: "Remarks", sortable: true },
        { key: "IsStartPage", label: "IsStartPage", sortable: true },
        { key: "EndPage", label: "EndPage", sortable: true },
        { key: "IsInformal", label: "IsInformal", sortable: true },
        { key: "IsPPGNotPresent", label: "IsPPGNotPresent", sortable: true },
        { key: "Guidance", label: "Guidance", sortable: true },
        { key: "DiskMasterDuration", label: "DiskMasterDuration", sortable: true },
        { key: "EventRefRemarksCounters", label: "EventRefRemarksCounters", sortable: true },
        { key: "EventRefMLID", label: "EventRefMLID", sortable: true },
        { key: "EventRefMLID2", label: "EventRefMLID2", sortable: true },
        { key: "DubbedLanguage", label: "DubbedLanguage", sortable: true },
        { key: "DubbingArtist", label: "DubbingArtist", sortable: true },
        { key: "HasSubtitle", label: "HasSubtitle", sortable: true },
        { key: "SubTitlesLanguage", label: "SubTitlesLanguage", sortable: true },
        { key: "EditingDeptRemarks", label: "EditingDeptRemarks", sortable: true },
        { key: "EditingType", label: "EditingType", sortable: true },
        { key: "BhajanType", label: "BhajanType", sortable: true },
        { key: "IsDubbed", label: "IsDubbed", sortable: true },
        { key: "NumberSource", label: "NumberSource", sortable: true },
        { key: "TopicSource", label: "TopicSource", sortable: true },
        { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
        { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true },
        { key: "Synopsis", label: "Synopsis", sortable: true },
        { key: "LocationWithinAshram", label: "LocationWithinAshram", sortable: true },
        { key: "Keywords", label: "Keywords", sortable: true },
        { key: "Grading", label: "Grading", sortable: true },
        { key: "Segment Category", label: "Segment Category", sortable: true },
        { key: "Segment Duration", label: "Segment Duration", sortable: true },
        { key: "TopicGivenBy", label: "TopicGivenBy", sortable: true },
      ]}
    />
  );

      case "digitalrecordings":
        return (
          <ClickUpListViewUpdated
            title="Digital Recordings"
            apiEndpoint="/digitalrecording"
            idKey="RecordingCode"
            onRowSelect={(row) => handleRowSelect(row, "digitalrecording")}
            filterConfigs={getFilterConfigs("digitalrecordings")}
            columns={[
              { key: "fkEventCode", label: "fkEventCode", sortable: true },
              { key: "RecordingName", label: "RecordingName", sortable: true },
              { key: "RecordingCode", label: "RecordingCode", sortable: true },
              { key: "NoOfFiles", label: "NoOfFiles", sortable: true },
              { key: "fkDigitalMasterCategory", label: "fkDigitalMasterCategory", sortable: true },
              { key: "fkMediaName", label: "fkMediaName", sortable: true },
              { key: "BitRate", label: "BitRate", sortable: true },
              { key: "AudioBitrate", label: "AudioBitrate", sortable: true },
              { key: "Filesize", label: "Filesize", sortable: true },
              { key: "Duration", label: "Duration", sortable: true },
              { key: "AudioTotalDuration", label: "AudioTotalDuration", sortable: true },
              { key: "RecordingRemarks", label: "RecordingRemarks", sortable: true },
              { key: "CounterError", label: "CounterError", sortable: true },
              { key: "ReasonError", label: "ReasonError", sortable: true },
              { key: "QcRemarksCheckedOn", label: "QcRemarksCheckedOn", sortable: true },
              { key: "PreservationStatus", label: "PreservationStatus", sortable: true },
              { key: "QCSevak", label: "QCSevak", sortable: true },
              { key: "MasterProductTitle", label: "MasterProductTitle", sortable: true },
              { key: "QcStatus", label: "QcStatus", sortable: true },
              { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
              { key: "fkDistributionLabel", label: "fkDistributionLabel", sortable: true },
              { key: "SubmittedDate", label: "SubmittedDate", sortable: true },
              { key: "PresStatGuidDt", label: "PresStatGuidDt", sortable: true },
              { key: "InfoOnCassette", label: "InfoOnCassette", sortable: true },
              { key: "Masterquality", label: "Masterquality", sortable: true },
              { key: "IsInformal", label: "IsInformal", sortable: true },
              { key: "FilesizeInBytes", label: "FilesizeInBytes", sortable: true },
              { key: "AssociatedDR", label: "AssociatedDR", sortable: true },
              { key: "Dimension", label: "Dimension", sortable: true },
              { key: "ProductionBucket", label: "ProductionBucket", sortable: true },
              { key: "DistributionDriveLink", label: "DistributionDriveLink", sortable: true },
              { key: "Teams", label: "Teams", sortable: true },
            ]}
          />
        );

      case "aux":
        return (
          <ClickUpListViewUpdated
            apiEndpoint="/auxfiles"
            idKey="new_auxid"
            onRowSelect={(row) => handleRowSelect(row, "aux")}
            title="Aux File"
            filterConfigs={getFilterConfigs("auxfiles")}
            columns={[
            
              { key: "new_auxid", label: "New aux id", sortable: true },
              { key: "AuxCode", label: "AuxCode", sortable: true },
              { key: "AuxFileType", label: "AuxFileType", sortable: true },
              { key: "AuxLanguage", label: "AuxLanguage", sortable: true },
              { key: "fkMLID", label: "fkMLID", sortable: true },
              { key: "AuxTopic", label: "AuxTopic", sortable: true },
              { key: "NotesRemarks", label: "NotesRemarks", sortable: true },
              { key: "GoogleDriveLink", label: "GoogleDriveLink", sortable: true },
              { key: "NoOfFiles", label: "NoOfFiles", sortable: true },
              { key: "FilesizeBytes", label: "FilesizeBytes", sortable: true },
              { key: "LastModifiedTimestamp", label: "LastModifiedTimestamp", sortable: true },
              { key: "LastModifiedBy", label: "LastModifiedBy", sortable: true },
              { key: "ProjFileCode", label: "ProjFileCode", sortable: true },
              { key: "ProjFileSize", label: "ProjFileSize", sortable: true },
              { key: "ProjFileName", label: "ProjFileName", sortable: true },
              { key: "SRTLink", label: "SRTLink", sortable: true },
              { key: "CreatedOn", label: "CreatedOn", sortable: true },
              { key: "CreatedBy", label: "CreatedBy", sortable: true },
              { key: "ModifiedOn", label: "ModifiedOn", sortable: true },
              { key: "ModifiedBy", label: "ModifiedBy", sortable: true },
            ]}
           
          />
        ); // Add other cases for your views here

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="dark flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className={`flex-1 overflow-auto transition-all duration-300 ${detailsSidebarOpen ? 'mr-96' : ''}`}>
  <div key={activeView}>
    {renderView()}
  </div>
</main>

      
      <DetailsSidebar
        isOpen={detailsSidebarOpen}
        onClose={handleCloseSidebar}
        data={selectedRowData}
        type={selectedRowData?.type || ""}
      />
    </div>
  );
}