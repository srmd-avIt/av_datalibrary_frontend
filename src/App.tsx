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

// REMOVED: All mock data imports

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
    // This function remains the same as in your original code
    // ...
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
      
      case "countries":
        return (
          <ClickUpListViewUpdated
            title="Events"
            apiEndpoint="/users" 
            idKey="EvnetID"// <-- THE FIX: Change the endpoint to "/users"
            onRowSelect={(row) => handleRowSelect(row, "event")}
            filterConfigs={getFilterConfigs("countries")}
            views={[
              { id: "all", name: "All" },
              { id: "active", name: "Active", filters: { status: "Active" } },
              { id: "planned", name: "Planned", filters: { status: "Planned" } },
              { id: "by-continent", name: "By Continent", groupBy: "continent" }
            ]}
            columns={[
              // It's important that these `key` values match the field names 
              // returned by your /users API endpoint.
              { key: "EventID", label: "Event ID", sortable: true }, 
               { key: "EventCode", label: "Event Code" },// Example: Change 'id' to 'EventID' if that's what your API returns
             
             { key: "Yr", label: "Year", sortable: true },
             {key:"SubmittedDate", label: "Submitted Date", sortable: true},
             {key:"FromDate", label: "From Date", sortable: true},
             {key:"ToDate", label: "To Date", sortable: true},
              { key: "EventName", label: "Event Name", sortable: true },
              { key: "fkEventCategory", label: "Category", sortable: true, filterable: true },
              {key:"NewEventCategory", label: "New Event Category", sortable: true, filterable: true},
              {key:"EventRemarks", label: "Event Remarks", sortable: true},
              {key:"EvnetMonth", label: "Event Month", sortable: true},
              {key:"CommonID", label: "Common ID", sortable: true},
              {key:"IsSubEvent1", label: "Is Sub Event1", sortable: true},
              {key:"IsAudioRecorded", label: "Is Audio Record", sortable: true},
              {key:"PravachanCount", label: "Pravachan Count", sortable: true},
              {key:"UdgoshCount", label: "Udgosh Count", sortable: true},
              {key:"PaglaCount", label: "Pagla Count", sortable: true},
              {key:"PratishthaCount", label: "Pratishtha Count", sortable: true},
              {key:"SummaryRemarks", label: "Summary Remarks", sortable: true},
              {key:"Pra-SU-duration", label: "Pra-SU-duration", sortable: true},
              {key:"LastModifiedBy", label: "Last Modified By", sortable: true},
              {key:"LastModifiedTimestamp", label: "Last Modified Timestamp", sortable: true},
              {key:"NewEventFrom", label: "New Event From", sortable: true},
              {key:"NewEventTo", label: "New Event To", sortable: true},

              // Add other columns that match your '/users' API response
            ]}
          />
        );
      case "cities":
        return (
          <ClickUpListViewUpdated
            title="Cities"
            apiEndpoint="/cities" // Pass the API endpoint
            onRowSelect={(row) => handleRowSelect(row, "city")}
            // ... and so on for the other views
          />
        );
      
      // Add other cases for "satsang", "pratishthas", etc. in the same way
      
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