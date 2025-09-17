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

export default function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedRowData, setSelectedRowData] = useState(null);
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
      
      case "countries": // This is your "Events" view
        return (
          <ClickUpListViewUpdated
            title="Events"
            // ✅ FIX 2: Correctly point to the full API endpoint
            apiEndpoint="/events" 
            // ✅ FIX 1: Correct the typo from "EvnetID" to "EventID"
            idKey="EventID"
            onRowSelect={(row) => handleRowSelect(row, "event")}
            filterConfigs={getFilterConfigs("countries")}
            columns={[
              // The `key` values must exactly match the names from your database/API
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
      case "cities":
        return (
          <ClickUpListViewUpdated
            title="Cities"
            apiEndpoint="/api/cities" // Make sure this endpoint exists on your server
            idKey="id" 
            columns={[
              { key: "id", label: "ID", sortable: true },
              { key: "name", label: "City Name", sortable: true },
              { key: "country", label: "Country", sortable: true, filterable: true },
            ]}
            onRowSelect={(row) => handleRowSelect(row, "city")}
          />
        );
      
      // Add other cases for your views here
      
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="dark flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className={`flex-1 overflow-auto transition-all duration-300 ${detailsSidebarOpen ? 'mr-96' : ''}`}>
        {renderView()}
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