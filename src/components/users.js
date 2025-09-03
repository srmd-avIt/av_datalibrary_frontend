import React, { useState, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FaListAlt, FaFolderOpen, FaVideo, FaTable, FaTag, FaMicrophone,
  FaInfoCircle, FaCommentDots, FaShareAlt, FaTimes, FaBars,
  FaSearch, FaFilter, FaFileExport,
  FaChevronRight, FaArrowLeft,
  FaStream, FaChartBar
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
  
  <ul> <SidebarItem icon={<FaTable />} text="Events" onClick={() => navigate("/")} active={location.pathname === "/"} />
   <SidebarItem icon={<FaListAlt />} text="All Except Satsang" onClick={() => navigate("/newmedialog")} active={location.pathname === "/newmedialog"} /> 
   <SidebarItem icon={<FaFolderOpen />} text="Satsang Category" onClick={() => navigate("/digitalrecording")} active={location.pathname === "/digitalrecording"} />
    <SidebarItem icon={<FaChartBar />} text="AuxFiles" onClick={() => navigate("/auxfiles")} active={location.pathname === "/auxfiles"} /> 
    <SidebarItem icon={<FaVideo />} text="Satsang Extracted Clips" onClick={() => setViewTitle("Satsang Extracted Clips")} active={false} /> 
    <SidebarItem icon={<FaTable />} text="All Data View - Formal - Informal" />
     <SidebarItem icon={<FaStream />} text="Timeline" onClick={() => navigate("/timeline")} active={location.pathname === "/timeline"} /> <li className="sidebar-divider"></li> 
     <SidebarItem icon={<FaMicrophone />} text="Assistant" onClick={handleAssistantClick} active={isAssistantOpen} /> 
     <SidebarItem icon={<FaInfoCircle />} text="About" onClick={() => alert("App version 1.0.0\nCreated by Gaurav.")} active={false} /> 
     <SidebarItem icon={<FaCommentDots />} text="Feedback" onClick={() => alert("Send your feedback to feedback@example.com")} active={false} /> 
     <SidebarItem icon={<FaShareAlt />} text="Share" onClick={() => alert("Share this app: https://yourapp.com")} active={false} /> </ul> </aside> </> ); });
const Header = memo(({ viewTitle, onMenuClick, onExportClick, searchQuery, onSearchChange, onFilterClick }) => { const [searchVisible, setSearchVisible] = useState(false); const handleSearchToggle = () => { if (searchVisible && searchQuery) { onSearchChange({ target: { value: '' } }); } setSearchVisible(prev => !prev); }; return ( <header className="header"> <div className="header-left"> <button className="menu-btn" onClick={onMenuClick}><FaBars /></button> <h2 className="view-title">{viewTitle}</h2> </div> <div className="header-right"> <div className={`search-container ${searchVisible ? 'visible' : ''}`}> <input type="text" placeholder="Search Event Code, Name, or Year..." value={searchQuery} onChange={onSearchChange} /> <FaFilter className="filter-icon" title="Advanced Filters" onClick={onFilterClick} /> </div> <button className="icon-btn search-toggle-btn" onClick={handleSearchToggle}> {searchVisible ? <FaTimes /> : <FaSearch />} </button> <button onClick={onExportClick} className="export-btn"> <FaFileExport /> <span>Export</span> </button> </div> </header> ); });

// --- DATA DEFINITIONS ---

const filterFields = [
  { key: 'EventID', label: 'Event ID', type: 'range' },
  { key: 'EventCode', label: 'Event Code', type: 'text' },
  { key: 'Yr', label: 'Year', type: 'range' },
  { key: 'SubmittedDate', label: 'Submitted Date', type: 'text' },
  { key: 'FromDate', label: 'From Date', type: 'text' },
  { key: 'ToDate', label: 'To Date', type: 'text' },
  { key: 'EventName', label: 'Event Name', type: 'text' },
  { key: 'fkEventCategory', label: 'Event Category', type: 'text' },
  { key: 'EventRemarks', label: 'Event Remarks', type: 'text' },
  { key: 'EventMonth', label: 'Event Month', type: 'text' },
  { key: 'CommonID', label: 'Common ID', type: 'text' },
  { key: 'IsSubEvent1', label: 'Is Sub Event?', type: 'text' },
  { key: 'IsAudioRecorded', label: 'Is Audio Recorded?', type: 'text' },
  { key: 'PravachanCount', label: 'Pravachan Count', type: 'text' },
  { key: 'UdhgoshCount', label: 'Udhgosh Count', type: 'text' },
  { key: 'PaglaCount', label: 'Pagla Count', type: 'text' },
  { key: 'PratisthaCount', label: 'Pratistha Count', type: 'text' },
  { key: 'SummaryRemarks', label: 'Summary Remarks', type: 'text' },
  { key: 'PraSUduration', label: 'Pra-SU Duration', type: 'text' },
  { key: 'LastModifiedBy', label: 'Last Modified By', type: 'text' },
  { key: 'LastModifiedTimestamp', label: 'Last Modified Timestamp', type: 'text' },
  { key: 'NewEventCategory', label: 'New Event Category', type: 'text' },
  { key: 'NewEventForm', label: 'New Date Form', type: 'text' },
  {key: 'NewEventTo', label: 'New Event To', type: 'text' }
];

const FilterSidebar = memo(({ isOpen, onClose, filters, onFilterChange, onApply, onClear, activeFilter, onSelectFilter, onGoBack }) => { const renderFieldList = () => ( <ul className="filter-field-list"> {filterFields.map(field => ( <li key={field.key} onClick={() => onSelectFilter(field.key)}> <div className="filter-field-label"> <span>{field.label}</span> </div> <FaChevronRight /> </li> ))} </ul> ); const renderValueInput = () => { const field = filterFields.find(f => f.key === activeFilter); if (!field) return null; const renderContent = () => { if (field.type === 'range') { return ( <div className="filter-group filter-range-group"> <label htmlFor={`filter-input-${field.key}-min`}>Min</label> <input type="number" id={`filter-input-${field.key}-min`} name={field.key} data-range-part="min" value={filters[field.key]?.min || ''} onChange={onFilterChange} placeholder={`e.g. 100`} autoFocus /> <label htmlFor={`filter-input-${field.key}-max`}>Max</label> <input type="number" id={`filter-input-${field.key}-max`} name={field.key} data-range-part="max" value={filters[field.key]?.max || ''} onChange={onFilterChange} placeholder={`e.g. 200`} /> </div> ); } if (field.type === 'select') { return ( <div className="filter-group"> <label htmlFor={`filter-input-${field.key}`}>{field.label}</label> <select id={`filter-input-${field.key}`} name={field.key} value={filters[field.key] || 'All'} onChange={onFilterChange} > {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)} </select> </div> ); } return ( <div className="filter-group"> <label htmlFor={`filter-input-${field.key}`}>Search</label> <input type={field.type} id={`filter-input-${field.key}`} name={field.key} value={filters[field.key] || ''} onChange={onFilterChange} placeholder={field.placeholder} autoFocus /> </div> ); }; return ( <div className="filter-value-view"> <button onClick={onGoBack} className="filter-back-button"> <FaArrowLeft /> <span>All Filters</span> </button> {renderContent()} </div> ); }; const headerTitle = activeFilter ? filterFields.find(f => f.key === activeFilter)?.label || 'Filter' : 'Filters'; return ( <> <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={onClose}></div> <aside className={`filter-sidebar ${isOpen ? 'open' : ''}`}> <div className="filter-sidebar-header"> <li className="filter-close-list-item" onClick={onClose}><FaArrowLeft /></li> <h3>{headerTitle}</h3> <button onClick={onClose} className="close-sidebar-btn" title="Dismiss"><FaTimes /></button> </div> <div className="filter-sidebar-body">{activeFilter ? renderValueInput() : renderFieldList()}</div> <div className="filter-sidebar-footer"> <button className="btn-secondary" onClick={onClear}>Clear All</button> <button className="btn-primary" onClick={onApply}>Apply Filters</button> </div> </aside> </> ); });
const ActiveFiltersDisplay = memo(({ filters, searchQuery, onRemoveFilter, onClearAll }) => { const activeFiltersList = []; if (searchQuery) { activeFiltersList.push({ key: 'searchQuery', label: 'Search', value: `"${searchQuery}"` }); } Object.keys(filters).forEach(key => { const value = filters[key]; const field = filterFields.find(f => f.key === key); if (!field) return; if (field.type === 'range') { if (value.min || value.max) { let displayValue = ''; if (value.min && value.max) displayValue = `${value.min} - ${value.max}`; else if (value.min) displayValue = `> ${value.min}`; else if (value.max) displayValue = `< ${value.max}`; activeFiltersList.push({ key, label: field.label, value: displayValue }); } } else if (value && value !== 'All') { activeFiltersList.push({ key, label: field.label, value }); } }); if (activeFiltersList.length === 0) return null; return ( <div className="active-filters-container"> <div className="active-filters-list"> {activeFiltersList.map(filter => ( <div key={filter.key} className="filter-chip"> <span><strong>{filter.label}:</strong> {filter.value}</span> <button onClick={() => onRemoveFilter(filter.key)} title={`Remove ${filter.label} filter`}> <FaTimes /> </button> </div> ))} </div> <button onClick={onClearAll} className="clear-all-filters-btn">Clear All</button> </div> ); });
const Pagination = memo(({ currentPage, totalPages, onPageChange }) => { if (totalPages <= 1) return null; return ( <nav className="pagination"> <button className="pagination-arrow" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>{'<< Previous'}</button> <span className="pagination-info">Page {currentPage} of {totalPages}</span> <button className="pagination-arrow" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>{'Next >>'}</button> </nav> ); });
const formatBoolean = (value) => { if (value === true) return 'Yes'; if (value === false) return 'No'; return 'N/A'; };
const EventsTable = memo(({ events, onViewDetails, selectedEventId }) => { if (events.length === 0) { return <div className="no-data-message">No data found. Try adjusting your search or filters.</div>; } return ( <div className="table-container"> 
  <table className="user-table"> 
    <thead>
       <tr>
         <th>Event ID</th>
         <th>Event Code</th>
         <th>Year</th>
         <th>Submitted Date</th>
         <th>From Date</th>
         <th>To Date</th>
         <th>Event Name</th>
         <th>fkEventCategory</th>
         <th>NewEventCategory</th>
         <th>Event Remarks</th>
         <th>Event Month</th>
         <th>Common ID</th>
         <th>Is Sub Event</th>
         <th>Is Audio Recorded</th>
         <th>PravachanCount</th>
         <th>UdhgoshCount</th>
         <th>PaglaCount</th>
         <th>PratisthaCount</th>
         <th>SummaryRemarks</th>
         <th>Pra-SU-duration</th>
         <th>LastModifiedBy</th>
         <th>LastModifiedTimestamp</th>
         <th>NewEventFrom</th>
         <th>NewEventTo</th> 
         </tr> 
         </thead> 
         <tbody> 
          {events.map((event) => ( <tr key={event.EventID} className={`main-row ${selectedEventId === event.EventID ? 'selected' : ''}`} onClick={() => onViewDetails(event)}> 
            <td data-label="Event ID">{event.EventID || 'N/A'}</td>
            <td data-label="Event Code">{event.EventCode || 'N/A'}</td>
            <td data-label="Year">{event.Yr || 'N/A'}</td>
            <td data-label="Submitted Date">{event.SubmittedDate || 'N/A'}</td>
            <td data-label="From Date">{event.FromDate || 'N/A'}</td>
            <td data-label="To Date">{event.ToDate || 'N/A'}</td>
            <td data-label="Event Name">{event.EventName || 'N/A'}</td>
            <td data-label="Event Category">{event.fkEventCategory || 'N/A'}</td>
            <td data-label="New Event Category">{event.NewEventCategory || 'N/A'}</td>
            <td data-label="Event Remarks">{event.EventRemarks || 'N/A'}</td>
            <td data-label="Event Month">{event.EventMonth || 'N/A'}</td>
            <td data-label="Common ID">{event.CommonID || 'N/A'}</td>
            <td data-label="Is Sub Event">{event.IsSubEvent1}</td>
            <td data-label="Is Audio Recorded">{event.IsAudioRecorded}</td>
            <td data-label="Pravachan Count">{event.PravachanCount || 'N/A'}</td>
            <td data-label="Udhgosh Count">{event.UdhgoshCount || 'N/A'}</td>
            <td data-label="Pagla Count">{event.PaglaCount || 'N/A'}</td>
            <td data-label="Pratistha Count">{event.PratisthaCount || 'N/A'}</td>
            <td data-label="Summary Remarks">{event.SummaryRemarks || 'N/A'}</td>
            <td data-label="Pra-SU Duration">{event.PraSUduration || 'N/A'}</td>
            <td data-label="Last Modified By">{event.LastModifiedBy || 'N/A'}</td>
            <td data-label="Last Modified Timestamp">{event.LastModifiedTimestamp || 'N/A'}</td>
            <td data-label="NewEventFrom">{event.NewEventFrom || 'N/A'}</td>
            <td data-label="NewEventTo">{event.NewEventTo || 'N/A'}</td> 
            </tr> ))} </tbody> </table> </div> ); });
const DetailItem = memo(({ label, value, isBoolean = false }) => (<div className="detail-view-group"><label>{label}</label><span>{isBoolean ? formatBoolean(value) : (value !== null && value !== undefined ? String(value) : 'N/A')}</span></div>));
const EventDetailsPanel = memo(({ event, onClose }) => { if (!event) return null; return ( <aside className="details-panel"> <div className="details-panel-header">
  <h2>Event Details</h2>
  <button type="button" className="close-btn" onClick={onClose}><FaTimes /></button>
  </div> 
  <div className="details-panel-body"> 
    <DetailItem label="Event ID" value={event.EventID} />
    <DetailItem label="Event Code" value={event.EventCode} />
    <DetailItem label="Year" value={event.Yr} />
    <DetailItem label="Submitted Date" value={event.SubmittedDate} />
    <DetailItem label="From Date" value={event.FromDate} />
    <DetailItem label="To Date" value={event.ToDate} />
    <DetailItem label="Event Name" value={event.EventName} />
    <DetailItem label="Event Category" value={event.fkEventCategory} />
    <DetailItem label="New Event Category" value={event.NewEventCategory} />
    <DetailItem label="Event Remarks" value={event.EventRemarks} />
    <DetailItem label="Event Month" value={event.EventMonth} />
    <DetailItem label="Common ID" value={event.CommonID} />
    <DetailItem label="Is Sub Event?" value={event.IsSubEvent1} />
    <DetailItem label="Is Audio Recorded?" value={event.IsAudioRecorded} />
    <DetailItem label="Pravachan Count" value={event.PravachanCount} />
    <DetailItem label="Udhgosh Count" value={event.UdhgoshCount} />
    <DetailItem label="Pagla Count" value={event.PaglaCount} />
    <DetailItem label="Pratistha Count" value={event.PratisthaCount} />
    <DetailItem label="Summary Remarks" value={event.SummaryRemarks} />
    <DetailItem label="Pra-SU Duration" value={event.PraSUduration} />
    <DetailItem label="Last Modified By" value={event.LastModifiedBy} />
    <DetailItem label="Last Modified Timestamp" value={event.LastModifiedTimestamp} />
    <DetailItem label="New Event From" value={event.NewEventFrom} />
    <DetailItem label="New Event To" value={event.NewEventTo} /> </div> </aside> ); });

const API_BASE_URL = process.env.REACT_APP_API_URL;

export async function fetchEvents() {
  const res = await fetch(`${API_BASE_URL}/users`, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache"
    }
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

  const { data: events = [], isLoading, error } = useQuery({ queryKey: ['events'], queryFn: fetchEvents });

  const handleSelectEvent = useCallback((event) => { setSelectedEvent(event); setIsAssistantOpen(false); }, []);
  const handleCloseDetails = useCallback(() => setSelectedEvent(null), []);
  const handleMenuClick = useCallback(() => setMenuOpen(prev => !prev), []);
  const handleCloseSidebar = useCallback(() => setMenuOpen(false), []);
  const handleSearchChange = useCallback((event) => { setSearchQuery(event.target.value); setCurrentPage(1); }, []);
  const handleOpenFilter = useCallback(() => setIsFilterOpen(true), []);
  const handleCloseFilter = useCallback(() => { setIsFilterOpen(false); setActiveFilter(null); }, []);
  const handleOpenAssistant = useCallback(() => { setIsAssistantOpen(true); setSelectedEvent(null); }, []);
  const handleCloseAssistant = useCallback(() => setIsAssistantOpen(false), []);
  const handleFilterChange = useCallback((e) => { const { name, value } = e.target; const rangePart = e.target.dataset.rangePart; setFilters(prev => { if (rangePart) { return { ...prev, [name]: { ...prev[name], [rangePart]: value } }; } return { ...prev, [name]: value }; }); }, []);
  const handleApplyFilters = useCallback(() => { setCurrentPage(1); setIsFilterOpen(false); setActiveFilter(null); }, []);
  const handleClearSidebarFilters = useCallback(() => { setFilters(initialFilterState()); setActiveFilter(null); }, [initialFilterState]);
  const handleSelectFilter = useCallback((filterKey) => setActiveFilter(filterKey), []);
  const handleGoBack = useCallback(() => setActiveFilter(null), []);
  const handleRemoveFilter = useCallback((filterKey) => { if (filterKey === 'searchQuery') { setSearchQuery(''); } else { setFilters(prev => ({ ...prev, [filterKey]: initialFilterState()[filterKey] })); } setCurrentPage(1); }, [initialFilterState]);
  const handleClearAll = useCallback(() => { setSearchQuery(''); setFilters(initialFilterState()); setCurrentPage(1); }, [initialFilterState]);

  // Handler for the Assistant to update the parent component's state
  const handleApplyParsedFilters = useCallback(({ filters: newFilters, searchQuery: newSearchQuery }) => {
    setFilters(prev => ({ ...initialFilterState(), ...newFilters }));
    setSearchQuery(newSearchQuery || '');
    setCurrentPage(1);
  }, [initialFilterState]);

  const filteredEvents = React.useMemo(() => {
    const query = searchQuery.toLowerCase(); let results = events;
    if (query) { results = results.filter((event) => { const eventCode = event.EventCode ? event.EventCode.toLowerCase() : ''; const eventName = event.EventName ? event.EventName.toLowerCase() : ''; const year = event.Yr ? String(event.Yr) : ''; return eventCode.includes(query) || year.includes(query) || eventName.includes(query); }); }
    const checkString = (field, filterValue) => { if (!filterValue) return true; const fieldValue = (field || '').toString().toLowerCase(); return fieldValue.includes(filterValue.toLowerCase()); };
    const checkSelect = (field, filterValue) => { if (filterValue === 'All' || !filterValue) return true; const fieldValue = field === true ? 'Yes' : (field === false ? 'No' : String(field)); return fieldValue === filterValue; };
    const checkRange = (value, range) => { if (!range || (range.min === '' && range.max === '')) return true; const numValue = parseInt(value, 10); if (isNaN(numValue)) return false; const min = range.min !== '' ? parseInt(range.min, 10) : -Infinity; const max = range.max !== '' ? parseInt(range.max, 10) : Infinity; const isMinOk = isNaN(min) || numValue >= min; const isMaxOk = isNaN(max) || numValue <= max; return isMinOk && isMaxOk; };
    results = results.filter(event => { return Object.keys(filters).every(key => { const fieldDef = filterFields.find(f => f.key === key); if (!fieldDef) return true; const filterValue = filters[key]; const eventValue = event[key]; switch (fieldDef.type) { case 'text': return checkString(eventValue, filterValue); case 'range': return checkRange(eventValue, filterValue); case 'select': return checkSelect(eventValue, filterValue); default: return true; } }); });
    return results;
  }, [events, searchQuery, filters]);

  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
  const currentEvents = filteredEvents.slice((currentPage - 1) * eventsPerPage, currentPage * eventsPerPage);

  const handleExport = useCallback(() => { if (filteredEvents.length === 0) { alert("No data to export."); return; } const headers = Object.keys(filteredEvents[0]); const csvContent = "data:text/csv;charset=utf-8," + [ headers.join(','), ...filteredEvents.map(event => headers.map(header => `"${String(event[header]).replace(/"/g, '""')}"`).join(',')) ].join('\n'); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", "events_export.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link); }, [filteredEvents]);

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
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
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