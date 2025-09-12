import React, { useState, useCallback, memo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FaListAlt, FaFolderOpen, FaVideo, FaTable, FaTag, FaMicrophone,
  FaInfoCircle, FaCommentDots, FaShareAlt, FaTimes, FaBars,
  FaSearch, FaFilter, FaFileExport,
  FaChevronRight, FaArrowLeft,
  FaStream, FaChartBar,FaHome,FaUser
} from 'react-icons/fa';
import './users.css';
import AssistantPanel from './AssistantPanel'; // Correctly import the component


// --- SUB-COMPONENTS ---

const SidebarItem = memo(({ icon, text, onClick, active }) => ( <li onClick={onClick} className={`flex items-center gap-2 p-2 cursor-pointer rounded-md ${active ? "bg-blue-600 text-white" : "hover:bg-gray-200"}`} > {icon} <span>{text}</span> </li> ));
const Sidebar = memo(({ isOpen, setViewTitle, onClose, navigate, onOpenAssistant, isAssistantOpen }) =>
 { const location = useLocation(); const handleAssistantClick = () => 
 { onOpenAssistant(); onClose(); }; 
 return ( 
 <> <div className={`sidebar-overlay ${isOpen ? "show" : ""}`} onClick={onClose}></div>
  <aside className={`sidebar ${isOpen ? "open" : ""}`}> 
    <div className="sidebar-header"> 
<h3><FaTag color="#4a90e2" /> Data library - All Depts</h3>
 <button onClick={onClose} className="close-sidebar-btn"><FaTimes /></button>
  </div>
  
  <ul>  <SidebarItem icon={<FaHome />} text="Home" onClick={() => navigate("/")} active={location.pathname === "/"} />

    {/* CHANGE: "Events" now points to /events */}
    <SidebarItem icon={<FaTable />} text="Events" onClick={() => navigate("/events")} active={location.pathname === "/events"} />
    
   <SidebarItem icon={<FaListAlt />} text="NewMediaLog" onClick={() => navigate("/newmedialog")} active={location.pathname === "/newmedialog"} /> 
   <SidebarItem icon={<FaFolderOpen />} text="Digital Recording" onClick={() => navigate("/digitalrecording")} active={location.pathname === "/digitalrecording"} />
    <SidebarItem icon={<FaChartBar />} text="AuxFiles" onClick={() => navigate("/auxfiles")} active={location.pathname === "/auxfiles"} /> 
    <SidebarItem icon={<FaVideo />} text="Satsang Extracted Clips" onClick={() => setViewTitle("Satsang Extracted Clips")} active={false} /> 
    <SidebarItem icon={<FaTable />} text="All Data View - Formal - Informal" />
     <SidebarItem icon={<FaStream />} text="Timeline" onClick={() => navigate("/timeline")} active={location.pathname === "/timeline"} /> <li className="sidebar-divider"></li> 
     <SidebarItem icon={<FaMicrophone />} text="Assistant" onClick={handleAssistantClick} active={isAssistantOpen} /> 
     <SidebarItem icon={<FaInfoCircle />} text="About" onClick={() => alert("App version 1.0.0\nCreated by Gaurav.")} active={false} /> 
     <SidebarItem icon={<FaCommentDots />} text="Feedback" onClick={() => alert("Send your feedback to feedback@example.com")} active={false} /> 
     <SidebarItem icon={<FaShareAlt />} text="Share" onClick={() => alert("Share this app: https://yourapp.com")} active={false} />
     
      </ul> 
       <div className="sidebar-profile"
                                style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', padding: '1rem', cursor: 'pointer' }}>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)' }}>
                                       <div style={{width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#4a4f58', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaUser /></div>
                                        <div> <span style={{ fontWeight: 600 }}>Admin User</span>
                                         <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Settings / Logout</div>
                                          </div>
                                          
                                           </div> 
                                          
                                          </div> 
      
      </aside> </> ); });
const Header = memo(({ viewTitle, onMenuClick, onExportClick, searchQuery, onSearchChange, onFilterClick }) => { const [searchVisible, setSearchVisible] = useState(false); const handleSearchToggle = () => { if (searchVisible && searchQuery) { onSearchChange({ target: { value: '' } }); } setSearchVisible(prev => !prev); }; return ( <header className="header"> <div className="header-left"> <button className="menu-btn" onClick={onMenuClick}><FaBars /></button> <h2 className="view-title">{viewTitle}</h2> </div> <div className="header-right"> <div className={`search-container ${searchVisible ? 'visible' : ''}`}> <input type="text" placeholder="Search Event Code, Name, or Year..." value={searchQuery} onChange={onSearchChange} /> <FaFilter className="filter-icon" title="Advanced Filters" onClick={onFilterClick} /> </div> <button className="icon-btn search-toggle-btn" onClick={handleSearchToggle}> {searchVisible ? <FaTimes /> : <FaSearch />} </button> <button onClick={onExportClick} className="export-btn"> <FaFileExport /> <span>Export</span> </button> </div> </header> ); });
const filterFields = [ { key: 'EventID', label: 'Event ID', type: 'range' }, { key: 'EventCode', label: 'Event Code', type: 'text' }, { key: 'Yr', label: 'Year', type: 'range' }, { key: 'SubmittedDate', label: 'Submitted Date', type: 'text' }, { key: 'FromDate', label: 'From Date', type: 'text' }, { key: 'ToDate', label: 'To Date', type: 'text' }, { key: 'EventName', label: 'Event Name', type: 'text' }, { key: 'fkEventCategory', label: 'Event Category', type: 'text' }, { key: 'EventRemarks', label: 'Event Remarks', type: 'text' }, { key: 'EventMonth', label: 'Event Month', type: 'text' }, { key: 'CommonID', label: 'Common ID', type: 'text' }, { key: 'IsSubEvent1', label: 'Is Sub Event?', type: 'text' }, { key: 'IsAudioRecorded', label: 'Is Audio Recorded?', type: 'text' }, { key: 'PravachanCount', label: 'Pravachan Count', type: 'text' }, { key: 'UdhgoshCount', label: 'Udhgosh Count', type: 'text' }, { key: 'PaglaCount', label: 'Pagla Count', type: 'text' }, { key: 'PratisthaCount', label: 'Pratistha Count', type: 'text' }, { key: 'SummaryRemarks', label: 'Summary Remarks', type: 'text' }, { key: 'PraSUduration', label: 'Pra-SU Duration', type: 'text' }, { key: 'LastModifiedBy', label: 'Last Modified By', type: 'text' }, { key: 'LastModifiedTimestamp', label: 'Last Modified Timestamp', type: 'text' }, { key: 'NewEventCategory', label: 'New Event Category', type: 'text' }, { key: 'NewEventForm', label: 'New Date Form', type: 'text' }, {key: 'NewEventTo', label: 'New Event To', type: 'text' } ];
const FilterSidebar = memo(({ isOpen, onClose, filters, onFilterChange, onApply, onClear, activeFilter, onSelectFilter, onGoBack }) => { const renderFieldList = () => ( <ul className="filter-field-list"> {filterFields.map(field => ( <li key={field.key} onClick={() => onSelectFilter(field.key)}> <div className="filter-field-label"> <span>{field.label}</span> </div> <FaChevronRight /> </li> ))} </ul> ); const renderValueInput = () => { const field = filterFields.find(f => f.key === activeFilter); if (!field) return null; const renderContent = () => { if (field.type === 'range') { return ( <div className="filter-group filter-range-group"> <label htmlFor={`filter-input-${field.key}-min`}>Min</label> <input type="number" id={`filter-input-${field.key}-min`} name={field.key} data-range-part="min" value={filters[field.key]?.min || ''} onChange={onFilterChange} placeholder={`e.g. 100`} autoFocus /> <label htmlFor={`filter-input-${field.key}-max`}>Max</label> <input type="number" id={`filter-input-${field.key}-max`} name={field.key} data-range-part="max" value={filters[field.key]?.max || ''} onChange={onFilterChange} placeholder={`e.g. 200`} /> </div> ); } if (field.type === 'select') { return ( <div className="filter-group"> <label htmlFor={`filter-input-${field.key}`}>{field.label}</label> <select id={`filter-input-${field.key}`} name={field.key} value={filters[field.key] || 'All'} onChange={onFilterChange} > {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)} </select> </div> ); } return ( <div className="filter-group"> <label htmlFor={`filter-input-${field.key}`}>Search</label> <input type={field.type} id={`filter-input-${field.key}`} name={field.key} value={filters[field.key] || ''} onChange={onFilterChange} placeholder={field.placeholder} autoFocus /> </div> ); }; return ( <div className="filter-value-view"> <button onClick={onGoBack} className="filter-back-button"> <FaArrowLeft /> <span>All Filters</span> </button> {renderContent()} </div> ); }; const headerTitle = activeFilter ? filterFields.find(f => f.key === activeFilter)?.label || 'Filter' : 'Filters'; return ( <> <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={onClose}></div> <aside className={`filter-sidebar ${isOpen ? 'open' : ''}`}> <div className="filter-sidebar-header"> <li className="filter-close-list-item" onClick={onClose}><FaArrowLeft /></li> <h3>{headerTitle}</h3> <button onClick={onClose} className="close-sidebar-btn" title="Dismiss"><FaTimes /></button> </div> <div className="filter-sidebar-body">{activeFilter ? renderValueInput() : renderFieldList()}</div> <div className="filter-sidebar-footer"> <button className="btn-secondary" onClick={onClear}>Clear All</button> <button className="btn-primary" onClick={onApply}>Apply Filters</button> </div> </aside> </> ); });
const ActiveFiltersDisplay = memo(({ filters, searchQuery, onRemoveFilter, onClearAll }) => { const activeFiltersList = []; if (searchQuery) { activeFiltersList.push({ key: 'searchQuery', label: 'Search', value: `"${searchQuery}"` }); } Object.keys(filters).forEach(key => { const value = filters[key]; const field = filterFields.find(f => f.key === key); if (!field) return; if (field.type === 'range') { if (value.min || value.max) { let displayValue = ''; if (value.min && value.max) displayValue = `${value.min} - ${value.max}`; else if (value.min) displayValue = `> ${value.min}`; else if (value.max) displayValue = `< ${value.max}`; activeFiltersList.push({ key, label: field.label, value: displayValue }); } } else if (value && value !== 'All') { activeFiltersList.push({ key, label: field.label, value }); } }); if (activeFiltersList.length === 0) return null; return ( <div className="active-filters-container"> <div className="active-filters-list"> {activeFiltersList.map(filter => ( <div key={filter.key} className="filter-chip"> <span><strong>{filter.label}:</strong> {filter.value}</span> <button onClick={() => onRemoveFilter(filter.key)} title={`Remove ${filter.label} filter`}> <FaTimes /> </button> </div> ))} </div> <button onClick={onClearAll} className="clear-all-filters-btn">Clear All</button> </div> ); });
const Pagination = memo(({ currentPage, totalPages, onPageChange }) => { if (totalPages <= 1) return null; return ( <nav className="pagination"> <button className="pagination-arrow" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>{'<< Previous'}</button> <span className="pagination-info">Page {currentPage} of {totalPages}</span> <button className="pagination-arrow" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>{'Next >>'}</button> </nav> ); });
const formatBoolean = (value) => { if (value === true) return 'Yes'; if (value === false) return 'No'; return 'N/A'; };

// --- NEW HELPER FUNCTION TO FORMAT DB COLUMN NAMES ---
// Turns "EventCode" into "Event Code", "fkEventCategory" into "Fk Event Category"
const formatHeader = (header) => {
  return header
    .replace(/([A-Z])/g, ' $1') // Add space before uppercase letters
    .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
};

// --- MODIFIED EventsTable COMPONENT TO BE DYNAMIC ---
const EventsTable = memo(({ events, onViewDetails, selectedEventId }) => {
  if (!events || events.length === 0) {
    return <div className="no-data-message">No data found. Try adjusting your search or filters.</div>;
  }

  // 1. Get headers dynamically from the first data object
  const headers = Object.keys(events[0]);

  return (
    <div className="table-container">
      <table className="user-table">
        <thead>
          <tr>
            {/* 2. Create table headers by mapping over the headers array */}
            {headers.map((header) => (
              <th key={header}>{formatHeader(header)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* 3. Create a row for each event object */}
          {events.map((event) => (
            <tr
              key={event.EventID} // Assuming EventID is the unique primary key
              className={`main-row ${selectedEventId === event.EventID ? 'selected' : ''}`}
              onClick={() => onViewDetails(event)}
            >
              {/* 4. For each row, create a cell for each header */}
              {headers.map((header) => (
                <td key={header} data-label={formatHeader(header)}>
                  {event[header] !== null && event[header] !== undefined ? String(event[header]) : 'N/A'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

const DetailItem = memo(({ label, value, isBoolean = false }) => (<div className="detail-view-group"><label>{label}</label><span>{isBoolean ? formatBoolean(value) : (value !== null && value !== undefined ? String(value) : 'N/A')}</span></div>));
const EventDetailsPanel = memo(({ event, onClose }) => { if (!event) return null; return ( <aside className="details-panel"> <div className="details-panel-header"> <h2>Event Details</h2> <button type="button" className="close-btn" onClick={onClose}><FaTimes /></button> </div> <div className="details-panel-body"> <DetailItem label="Event ID" value={event.EventID} /> <DetailItem label="Event Code" value={event.EventCode} /> <DetailItem label="Year" value={event.Yr} /> <DetailItem label="Submitted Date" value={event.SubmittedDate} /> <DetailItem label="From Date" value={event.FromDate} /> <DetailItem label="To Date" value={event.ToDate} /> <DetailItem label="Event Name" value={event.EventName} /> <DetailItem label="Event Category" value={event.fkEventCategory} /> <DetailItem label="New Event Category" value={event.NewEventCategory} /> <DetailItem label="Event Remarks" value={event.EventRemarks} /> <DetailItem label="Event Month" value={event.EventMonth} /> <DetailItem label="Common ID" value={event.CommonID} /> <DetailItem label="Is Sub Event?" value={event.IsSubEvent1} /> <DetailItem label="Is Audio Recorded?" value={event.IsAudioRecorded} /> <DetailItem label="Pravachan Count" value={event.PravachanCount} /> <DetailItem label="Udhgosh Count" value={event.UdhgoshCount} /> <DetailItem label="Pagla Count" value={event.PaglaCount} /> <DetailItem label="Pratistha Count" value={event.PratisthaCount} /> <DetailItem label="Summary Remarks" value={event.SummaryRemarks} /> <DetailItem label="Pra-SU Duration" value={event.PraSUduration} /> <DetailItem label="Last Modified By" value={event.LastModifiedBy} /> <DetailItem label="Last Modified Timestamp" value={event.LastModifiedTimestamp} /> <DetailItem label="New Event From" value={event.NewEventFrom} /> <DetailItem label="New Event To" value={event.NewEventTo} /> </div> </aside> ); });

// --- API LAYER & MAIN COMPONENT (No changes needed here from previous version) ---
const API_BASE_URL = process.env.REACT_APP_API_URL;

export async function fetchEvents({ page, limit, searchQuery, filters }) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (searchQuery) {
    params.append('search', searchQuery);
  }
  Object.keys(filters).forEach(key => {
    const value = filters[key];
    if (value) {
      if (typeof value === 'object' && (value.min || value.max)) {
        if (value.min) params.append(`${key}_min`, value.min);
        if (value.max) params.append(`${key}_max`, value.max);
      } else if (typeof value === 'string' && value.trim() !== '' && value !== 'All') {
        params.append(key, value);
      }
    }
  });

  const res = await fetch(`${API_BASE_URL}/users?${params.toString()}`, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" }
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`API error: ${res.status}\n${text}`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error("Response is not valid JSON. Response was:\n" + text);
  }
}

console.log('API_BASE_URL:', API_BASE_URL);

// --- MAIN COMPONENT ---
function Users() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [viewTitle, setViewTitle] = useState("Events");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 50;
  
  const initialFilterState = useCallback(() => { const state = {}; filterFields.forEach(field => { if (field.type === 'range') { state[field.key] = { min: '', max: '' }; } else if (field.type === 'select') { state[field.key] = 'All'; } else { state[field.key] = ''; } }); return state; }, []);
  const [filters, setFilters] = useState(initialFilterState);
  const [activeFilter, setActiveFilter] = useState(null);

  const { data: paginatedData, isLoading, error } = useQuery({
    queryKey: ['events', currentPage, searchQuery, filters],
    queryFn: () => fetchEvents({ page: currentPage, limit: eventsPerPage, searchQuery, filters }),
    keepPreviousData: true,
  });

  const currentEvents = paginatedData?.data || [];
  const totalPages = paginatedData?.totalPages || 1;

  useEffect(() => {
    if (searchQuery || Object.values(filters).some(v => v && (v.min || v.max || (typeof v === 'string' && v !== 'All' && v !== '')))) {
        setCurrentPage(1);
    }
  }, [searchQuery, filters]);

  const handleSelectEvent = useCallback((event) => { setSelectedEvent(event); setIsAssistantOpen(false); }, []);
  const handleCloseDetails = useCallback(() => setSelectedEvent(null), []);
  const handleMenuClick = useCallback(() => setMenuOpen(prev => !prev), []);
  const handleCloseSidebar = useCallback(() => setMenuOpen(false), []);
  const handleSearchChange = useCallback((event) => { setSearchQuery(event.target.value); }, []);
  const handleOpenFilter = useCallback(() => setIsFilterOpen(true), []);
  const handleCloseFilter = useCallback(() => { setIsFilterOpen(false); setActiveFilter(null); }, []);
  const handleOpenAssistant = useCallback(() => { setIsAssistantOpen(true); setSelectedEvent(null); }, []);
  const handleCloseAssistant = useCallback(() => setIsAssistantOpen(false), []);
  const handleFilterChange = useCallback((e) => { const { name, value } = e.target; const rangePart = e.target.dataset.rangePart; setFilters(prev => { if (rangePart) { return { ...prev, [name]: { ...prev[name], [rangePart]: value } }; } return { ...prev, [name]: value }; }); }, []);
  const handleApplyFilters = useCallback(() => { setIsFilterOpen(false); setActiveFilter(null); }, []);
  const handleClearSidebarFilters = useCallback(() => { setFilters(initialFilterState()); setActiveFilter(null); }, [initialFilterState]);
  const handleSelectFilter = useCallback((filterKey) => setActiveFilter(filterKey), []);
  const handleGoBack = useCallback(() => setActiveFilter(null), []);
  const handleRemoveFilter = useCallback((filterKey) => { if (filterKey === 'searchQuery') { setSearchQuery(''); } else { setFilters(prev => ({ ...prev, [filterKey]: initialFilterState()[filterKey] })); } }, [initialFilterState]);
  const handleClearAll = useCallback(() => { setSearchQuery(''); setFilters(initialFilterState()); }, [initialFilterState]);
  const handleApplyParsedFilters = useCallback(({ filters: newFilters, searchQuery: newSearchQuery }) => { setFilters(prev => ({ ...initialFilterState(), ...newFilters })); setSearchQuery(newSearchQuery || ''); }, [initialFilterState]);
  const handleExport = useCallback(() => {
    if (currentEvents.length === 0) {
      alert("No data to export.");
      return;
    }
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value) {
            if (typeof value === 'object' && (value.min || value.max)) {
                if (value.min) params.append(`${key}_min`, value.min);
                if (value.max) params.append(`${key}_max`, value.max);
            } else if (typeof value === 'string' && value.trim() !== '' && value !== 'All') {
                params.append(key, value);
            }
        }
    });
    
    const exportUrl = `${API_BASE_URL}/users/export?${params.toString()}`;
    window.open(exportUrl, '_blank');
  }, [searchQuery, filters, currentEvents.length]);

  const contentAreaClasses = [ 'content-area', selectedEvent ? 'details-visible' : '', isAssistantOpen ? 'assistant-visible' : '' ].join(' ').trim();

  return (
    <div className={`layout ${menuOpen ? 'sidebar-open' : ''}`}>
      <Sidebar isOpen={menuOpen} setViewTitle={setViewTitle} onClose={handleCloseSidebar} navigate={navigate} onOpenAssistant={handleOpenAssistant} isAssistantOpen={isAssistantOpen} />
      <FilterSidebar isOpen={isFilterOpen} onClose={handleCloseFilter} filters={filters} onFilterChange={handleFilterChange} onApply={handleApplyFilters} onClear={handleClearSidebarFilters} activeFilter={activeFilter} onSelectFilter={handleSelectFilter} onGoBack={handleGoBack} />
      <main className="main-content">
        <Header viewTitle={viewTitle} onMenuClick={handleMenuClick} onExportClick={handleExport} searchQuery={searchQuery} onSearchChange={handleSearchChange} onFilterClick={handleOpenFilter} />
        <ActiveFiltersDisplay filters={filters} searchQuery={searchQuery} onRemoveFilter={handleRemoveFilter} onClearAll={handleClearAll} />
        <div className={contentAreaClasses}>
          <div className="table-wrapper">
            {isLoading && <div className="loader">Loading...</div>}
            {error && <div className="error-message">{error.message}</div>}
            {!isLoading && !error && (
              <>
                <EventsTable events={currentEvents} onViewDetails={handleSelectEvent} selectedEventId={selectedEvent?.EventID} />
                <Pagination 
                  currentPage={currentPage} 
                  totalPages={totalPages} 
                  onPageChange={setCurrentPage} 
                />
              </>
            )}
          </div>
          <AssistantPanel
            isOpen={isAssistantOpen}
            onClose={handleCloseAssistant}
            currentPath={location.pathname}
            onNavigate={navigate}
            onApplyFilters={handleApplyParsedFilters}
            onClearAllFilters={handleClearAll}
          />
          {selectedEvent && ( <EventDetailsPanel event={selectedEvent} onClose={handleCloseDetails} /> )}
        </div>
      </main>
    </div>
  );
}

export default Users;