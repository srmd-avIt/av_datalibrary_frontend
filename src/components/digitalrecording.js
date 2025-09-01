import React, { useState, useCallback, memo } from 'react';
import './users.css';
import './link-button.css';
import { useNavigate,useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// Import all necessary icons
import {
  FaListAlt, FaFolderOpen, FaVideo, FaTable, FaTag, FaMicrophone,
  FaInfoCircle, FaCommentDots, FaShareAlt, FaTimes, FaBars,
  FaSearch, FaFilter, FaFileExport,
  FaChevronRight, FaArrowLeft, FaStream,FaChartBar 
} from 'react-icons/fa';

// --- SUB-COMPONENTS ---

const SidebarItem = memo(({ icon, text, onClick, active }) => (
  <li
    onClick={onClick}
    className={`flex items-center gap-2 p-2 cursor-pointer rounded-md
      ${active ? "bg-blue-600 text-white" : "hover:bg-gray-200"}`}
  >
    {icon}
    <span>{text}</span>
  </li>
));

const Sidebar = memo(({ isOpen, setViewTitle, onClose, navigate }) => {
  const location = useLocation(); // ✅ gets current URL path

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? "show" : ""}`} onClick={onClose}></div>
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h3><FaTag color="#4a90e2" /> Data library - All Depts</h3>
          <button onClick={onClose} className="close-sidebar-btn"><FaTimes /></button>
        </div>
        <ul>
          <SidebarItem icon={<FaTable />} text="Events" onClick={() => navigate("/")} active={location.pathname === "/"} />
          <SidebarItem icon={<FaListAlt />} text="All Except Satsang" onClick={() => navigate("/newmedialog")} active={location.pathname === "/newmedialog"} />
          <SidebarItem icon={<FaFolderOpen />} text="Satsang Category" onClick={() => navigate("/digitalrecording")} active={location.pathname === "/digitalrecording"} />
          <SidebarItem icon={<FaChartBar />} text="AuxFiles" onClick={() => navigate("/auxfiles")} active={location.pathname === "/auxfiles"} />
          <SidebarItem icon={<FaVideo />} text="Satsang Extracted Clips" onClick={() => setViewTitle("Satsang Extracted Clips")} active={false} />
          <SidebarItem icon={<FaTable />} text="All Data View - Formal - Informal"  />
          <SidebarItem icon={<FaStream />} text="Timeline" onClick={() => navigate("/timeline")} active={location.pathname === "/timeline"} />

          <li className="sidebar-divider"></li>

          <SidebarItem icon={<FaMicrophone />} text="Assistant" onClick={() => alert("Voice Assistant feature coming soon!")} active={false} />
          <SidebarItem icon={<FaInfoCircle />} text="About" onClick={() => alert("App version 1.0.0\nCreated by Gaurav.")} active={false} />
          <SidebarItem icon={<FaCommentDots />} text="Feedback" onClick={() => alert("Send your feedback to feedback@example.com")} active={false} />
          <SidebarItem icon={<FaShareAlt />} text="Share" onClick={() => alert("Share this app: https://yourapp.com")} active={false} />
        </ul>
      </aside>
    </>
  );
});

const Header = memo(({ viewTitle, onMenuClick, onExportClick, searchQuery, onSearchChange, onFilterClick }) => {
    const [searchVisible, setSearchVisible] = useState(false);
    const handleSearchToggle = () => {
        if (searchVisible && searchQuery) { onSearchChange({ target: { value: '' } }); }
        setSearchVisible(prev => !prev);
    };
    return (
    <header className="header">
        <div className="header-left">
            <button className="menu-btn" onClick={onMenuClick}><FaBars /></button>
            <h2 className="view-title">{viewTitle}</h2>
        </div>
        <div className="header-right">
            <div className={`search-container ${searchVisible ? 'visible' : ''}`}>
                <input type="text" placeholder="Search fkEventCode or RecordingName..." value={searchQuery} onChange={onSearchChange} />
                <FaFilter className="filter-icon" title="Advanced Filters" onClick={onFilterClick} />
            </div>
            <button className="icon-btn search-toggle-btn" onClick={handleSearchToggle}>
                {searchVisible ? <FaTimes /> : <FaSearch />}
            </button>
            <button onClick={onExportClick} className="export-btn">
                <FaFileExport />
                <span>Export</span>
            </button>
        </div>
    </header>
    );
});

// --- NEW: Enhanced filterFields definition with types ---
const filterFields = [
  { key: 'fkEventCode', label: 'Event Code', type: 'text', placeholder: 'e.g., EVT123' },
  { key: 'RecordingName', label: 'Recording Name', type: 'text', placeholder: 'e.g., Pravachan...' },
  { key: 'RecordingCode', label: 'Recording Code', type: 'text'},
  { key: 'NoOfFiles', label: 'No of files', type: 'range'}, // Changed to 'range'
  { key: 'fkDigitalMasterCategory', label: 'Digital Master Category', type: 'text', placeholder: 'e.g., Audio' },
  { key: 'fkMediaName', label: 'Media Name', type: 'text'},
  { key: 'BitRate', label: 'Bit Rate', type: 'text'},
  { key: 'AudioBitrate', label: 'Audio Bitrate', type: 'text'},
  { key: 'Filesize', label: 'Filesize', type: 'text'},
  { key: 'Duration', label: 'Duration', type: 'text'},
  { key: 'AudioTotalDuration', label: 'Audio Total Duration', type: 'text'},
  { key: 'RecordingRemarks', label: 'Recording Remarks', type: 'text'},
  { key: 'CounterError', label: 'Counter Error', type: 'text'},
  { key: 'ReasonError', label: 'Reason Error', type: 'text'},
  { key: 'QcRemarksCheckedOn', label: 'Qc Remarks Checked On', type: 'text'},
  { key: 'PreservationStatus', label: 'Preservation Status', type: 'text'},
  { key: 'QcSevak', label: 'Qc Sevak', type: 'text'},
  { key: 'MasterProductTitle', label: 'Master Product Title', type: 'text'},
  { key: 'Qcstatus', label: 'Qc Status', type: 'select', options: ['All', 'Done', 'Pending', 'In Progress', 'Error'] }, // Changed to 'select'
  { key: 'LastModifiedTimestamp', label: 'Last Modified Timestamp', type: 'text'},
  { key: 'fkDistributionLabel', label: 'Distribution Label', type: 'text'},
  { key: 'SubmittedDate', label: 'Submitted Date', type: 'text'},
  { key: 'PresStatGuidDt', label: 'PresStatGuidDt', type: 'text'},
  { key: 'InfoOnCassette', label: 'Info On Cassette', type: 'text'},
  { key: 'Masterquality', label: 'Master quality', type: 'text'},
  { key: 'IsInformal', label: 'Is Informal', type: 'select', options: ['All', 'Yes', 'No'] }, // Changed to 'select'
  { key: 'FilesizeInBytes', label: 'Filesize In Bytes', type: 'range'}, // Changed to 'range'
  { key: 'AssociatedDR', label: 'Associated DR', type: 'text'},
  { key: 'Dimension', label: 'Dimension', type: 'text'},
  { key: 'ProductionBucket', label: 'Production Bucket', type: 'text'},
  { key: 'DistributionDriveLink', label: 'Distribution Drive Link', type: 'text'},
  { key: 'Teams', label: 'Teams', type: 'text'},
];

// --- NEW: Upgraded FilterSidebar component ---
const FilterSidebar = memo(({ isOpen, onClose, filters, onFilterChange, onApply, onClear, activeFilter, onSelectFilter, onGoBack }) => {
  const renderFieldList = () => (
    <ul className="filter-field-list">
      {filterFields.map(field => (
        <li key={field.key} onClick={() => onSelectFilter(field.key)}>
          <div className="filter-field-label"><span>{field.label}</span></div>
          <FaChevronRight />
        </li>
      ))}
    </ul>
  );

  const renderValueInput = () => {
    const field = filterFields.find(f => f.key === activeFilter);
    if (!field) return null;

    const renderContent = () => {
      if (field.type === 'range') {
        return (
          <div className="filter-group filter-range-group">
            <label htmlFor={`filter-input-${field.key}-min`}>Min</label>
            <input type="number" id={`filter-input-${field.key}-min`} name={field.key} data-range-part="min" value={filters[field.key]?.min || ''} onChange={onFilterChange} placeholder={`e.g. 1`} autoFocus />
            <label htmlFor={`filter-input-${field.key}-max`}>Max</label>
            <input type="number" id={`filter-input-${field.key}-max`} name={field.key} data-range-part="max" value={filters[field.key]?.max || ''} onChange={onFilterChange} placeholder={`e.g. 10`} />
          </div>
        );
      }
      if (field.type === 'select') {
        return (
          <div className="filter-group">
            <label htmlFor={`filter-input-${field.key}`}>{field.label}</label>
            <select id={`filter-input-${field.key}`} name={field.key} value={filters[field.key] || 'All'} onChange={onFilterChange}>
              {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        );
      }
      return (
        <div className="filter-group">
          <label htmlFor={`filter-input-${field.key}`}>Search</label>
          <input type={field.type} id={`filter-input-${field.key}`} name={field.key} value={filters[field.key] || ''} onChange={onFilterChange} placeholder={field.placeholder} autoFocus />
        </div>
      );
    };

    return (
      <div className="filter-value-view">
        <button onClick={onGoBack} className="filter-back-button"><FaArrowLeft /><span>All Filters</span></button>
        {renderContent()}
      </div>
    );
  };

  const headerTitle = activeFilter ? filterFields.find(f => f.key === activeFilter)?.label || 'Filter' : 'Filters';
  
  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={onClose}></div>
      <aside className={`filter-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="filter-sidebar-header">
          <li className="filter-close-list-item" onClick={onClose}><FaArrowLeft /></li>
          <h3>{headerTitle}</h3>
          <button onClick={onClose} className="close-sidebar-btn" title="Dismiss"><FaTimes /></button>
        </div>
        <div className="filter-sidebar-body">{activeFilter ? renderValueInput() : renderFieldList()}</div>
        <div className="filter-sidebar-footer">
          <button className="btn-secondary" onClick={onClear}>Clear All</button>
          <button className="btn-primary" onClick={onApply}>Apply Filters</button>
        </div>
      </aside>
    </>
  );
});

// --- NEW: ActiveFiltersDisplay component for showing active filters ---
const ActiveFiltersDisplay = memo(({ filters, searchQuery, onRemoveFilter, onClearAll }) => {
  const activeFiltersList = [];

  if (searchQuery) {
    activeFiltersList.push({ key: 'searchQuery', label: 'Search', value: `"${searchQuery}"` });
  }

  Object.keys(filters).forEach(key => {
    const value = filters[key];
    const field = filterFields.find(f => f.key === key);
    if (!field) return;

    if (field.type === 'range') {
      if (value.min || value.max) {
        let displayValue = '';
        if (value.min && value.max) displayValue = `${value.min} - ${value.max}`;
        else if (value.min) displayValue = `> ${value.min}`;
        else if (value.max) displayValue = `< ${value.max}`;
        activeFiltersList.push({ key, label: field.label, value: displayValue });
      }
    } else if (value && value !== 'All') {
      activeFiltersList.push({ key, label: field.label, value });
    }
  });

  if (activeFiltersList.length === 0) return null;

  return (
    <div className="active-filters-container">
      <div className="active-filters-list">
        {activeFiltersList.map(filter => (
          <div key={filter.key} className="filter-chip">
            <span><strong>{filter.label}:</strong> {filter.value}</span>
            <button onClick={() => onRemoveFilter(filter.key)} title={`Remove ${filter.label} filter`}>
              <FaTimes />
            </button>
          </div>
        ))}
      </div>
      <button onClick={onClearAll} className="clear-all-filters-btn">Clear All</button>
    </div>
  );
});


const Pagination = memo(({ currentPage, totalPages, onPageChange }) => { if (totalPages <= 1) { return null; } return ( <nav className="pagination"> <button className="pagination-arrow" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>{'<< Previous'}</button> <span className="pagination-info">Page {currentPage} of {totalPages}</span> <button className="pagination-arrow" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>{'Next >>'}</button> </nav> ); });
const DetailItem = memo(({ label, value }) => ( <div className="detail-view-group"><label>{label}</label><span>{value !== null && value !== undefined ? String(value) : 'N/A'}</span></div> ));

const EventsTable = memo(({ events, onViewDetails, selectedEventId }) => {
    if (events.length === 0) { return <div className="no-data-message">No data found.</div>; }
    return (
        <div className="table-container">
            <table className="user-table">
                <thead>
                    <tr>
                        <th>fkEventCode</th>
                         <th>RecordingName</th>
                          <th>RecordingCode</th> 
                          <th>NoOfFiles</th>
                           <th>fkDigitalMasterCategory</th>
                            <th>fkMediaName</th>
                             <th>BitRate</th> 
                             <th>AudioBitrate</th> 
                             <th>Filesize</th> 
                             <th>Duration</th>
                              <th>AudioTotalDuration</th> 
                              <th>RecordingRemarks</th>
                               <th>CounterError</th>
                                <th>ReasonError</th> 
                                <th>QcRemarksCheckedOn</th>
                                 <th>PreservationStatus</th> 
                                 <th>QcSevak</th>
                                  <th>MasterProductTitle</th>
                                   <th>Qcstatus</th>
                                    <th>LastModifiedTimestamp</th>
                                     <th>fkDistributionLabel</th> 
                                     <th>SubmittedDate</th>
                                      <th>PresStatGuidDt</th>
                                       <th>InfoOnCassette</th>
                                        <th>Masterquality</th>
                                         <th>IsInformal</th>
                                          <th>FilesizeInBytes</th>
                                           <th>AssociatedDR</th>
                                            <th>Dimension</th>
                                             <th>ProductionBucket</th>
                                              <th>DistributionDriveLink</th>
                                               <th>Teams</th>
                    </tr>
                </thead>
                <tbody>
                    {events.map((event) => (
                        <tr key={event.RecordingCode} className={`main-row ${selectedEventId === event.RecordingCode ? 'selected' : ''}`} onClick={() => onViewDetails(event)}>
                           <td data-label="fkEventCode">{event.fkEventCode || 'N/A'}</td>
                           <td data-label="RecordingName">{event.RecordingName || 'N/A'}</td>
                           <td data-label="RecordingCode">{event.RecordingCode || 'N/A'}</td>
                           <td data-label="NoOfFiles">{event.NoOfFiles || 'N/A'}</td>
                           <td data-label="fkDigitalMasterCategory">{event.fkDigitalMasterCategory || 'N/A'}</td>
                           <td data-label="fkMediaName">{event.fkMediaName || 'N/A'}</td>
                           <td data-label="BitRate">{event.BitRate || 'N/A'}</td>
                           <td data-label="AudioBitrate">{event.AudioBitrate || 'N/A'}</td>
                           <td data-label="Filesize">{event.Filesize || 'N/A'}</td>
                           <td data-label="Duration">{event.Duration || 'N/A'}</td>
                           <td data-label="AudioTotalDuration">{event.AudioTotalDuration || 'N/A'}</td>
                           <td data-label="RecordingRemarks">{event.RecordingRemarks || 'N/A'}</td>
                           <td data-label="CounterError">{event.CounterError || 'N/A'}</td>
                           <td data-label="ReasonError">{event.ReasonError || 'N/A'}</td>
                           <td data-label="QcRemarksCheckedOn">{event.QcRemarksCheckedOn || 'N/A'}</td>
                           <td data-label="PreservationStatus">{event.PreservationStatus || 'N/A'}</td>
                           <td data-label="QcSevak">{event.QcSevak || 'N/A'}</td>
                           <td data-label="MasterProductTitle">{event.MasterProductTitle || 'N/A'}</td>
                           <td data-label="Qcstatus">{event.Qcstatus || 'N/A'}</td>
                           <td data-label="LastModifiedTimestamp">{event.LastModifiedTimestamp || 'N/A'}</td>
                           <td data-label="fkDistributionLabel">{event.fkDistributionLabel || 'N/A'}</td>
                           <td data-label="SubmittedDate">{event.SubmittedDate || 'N/A'}</td>
                           <td data-label="PresStatGuidDt">{event.PresStatGuidDt || 'N/A'}</td>
                           <td data-label="InfoOnCassette">{event.InfoOnCassette || 'N/A'}</td>
                           <td data-label="Masterquality">{event.Masterquality || 'N/A'}</td>
                           <td data-label="IsInformal">{event.IsInformal ? 'Yes' : 'No'}</td>
                           <td data-label="FilesizeInBytes">{event.FilesizeInBytes || 'N/A'}</td>
                           <td data-label="AssociatedDR">{event.AssociatedDR || 'N/A'}</td>
                           <td data-label="Dimension">{event.Dimension || 'N/A'}</td>
                           <td data-label="ProductionBucket">{event.ProductionBucket || 'N/A'}</td>
                           <td data-label="DistributionDriveLink">
                            {event.DistributionDriveLink ? 
                            (<a href={event.DistributionDriveLink} 
                            target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                              {event.DistributionDriveLink}</a>) : ('N/A')}</td>
                              <td data-label="Teams">{event.Teams || 'N/A'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});

const RecordingDetailsPanel = memo(({ event, onClose, onViewEventDetails }) => {
    if (!event) return null;
    return (
        <aside className="details-panel">
            <div className="details-panel-header"><h2>Recording Details: {event.RecordingCode}</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div>
            <div className="details-panel-body">
                <div className="detail-view-group"><label>Event Code</label>{event.fkEventCode ? (<button className="link-button" onClick={() => onViewEventDetails(event.fkEventCode)}>{event.fkEventCode} <FaChevronRight size="1.2em" style={{ marginLeft: '190px', opacity: 0.7 }}/></button>) : ( <span>N/A</span> )}</div>
                <DetailItem label="Recording Name" value={event.RecordingName} />
                <DetailItem label="Recording Code" value={event.RecordingCode} />
                <DetailItem label="No. of Files" value={event.NoOfFiles} />
                <DetailItem label="fkDigitalMasterCategory" value={event.fkDigitalMasterCategory} />
                <DetailItem label="fkMediaName" value={event.fkMediaName} />
                <DetailItem label="Bit Rate" value={event.BitRate} />
                <DetailItem label="Audio Bitrate" value={event.AudioBitrate} />
                <DetailItem label="Filesize" value={event.Filesize} />
                <DetailItem label="Duration" value={event.Duration} />
                <DetailItem label="Audio Total Duration" value={event.AudioTotalDuration} />
                <DetailItem label="Recording Remarks" value={event.RecordingRemarks} />
                <DetailItem label="Counter Error" value={event.CounterError} />
                <DetailItem label="Reason Error" value={event.ReasonError} />
                <DetailItem label="Qc Remarks Checked On" value={event.QcRemarksCheckedOn} />
                <DetailItem label="Preservation Status" value={event.PreservationStatus} />
                <DetailItem label="Qc Sevak" value={event.QcSevak} />
                <DetailItem label="Master Product Title" value={event.MasterProductTitle} />
                <DetailItem label="Qc Status" value={event.Qcstatus} />
                <DetailItem label="Last Modified Timestamp" value={event.LastModifiedTimestamp} />
                <DetailItem label="fkDistributionLabel" value={event.fkDistributionLabel} />
                <DetailItem label="Submitted Date" value={event.SubmittedDate} />
                <DetailItem label="PresStatGuidDt" value={event.PresStatGuidDt} />
                <DetailItem label="Info On Cassette" value={event.InfoOnCassette} />
                <DetailItem label="Master quality" value={event.Masterquality} />
                <DetailItem label="Is Informal" value={event.IsInformal ? 'Yes' : 'No'} />
                <DetailItem label="Filesize In Bytes" value={event.FilesizeInBytes} />
                <DetailItem label="Associated DR" value={event.AssociatedDR} />
                <DetailItem label="Dimension" value={event.Dimension} />
                <DetailItem label="Production Bucket" value={event.ProductionBucket} />
                <div className="detail-view-group">
                  <label>Distribution Drive Link</label>
                  {event.DistributionDriveLink ? 
                  (<a href={event.DistributionDriveLink} 
                  target="_blank" rel="noopener noreferrer" className="detail-link">
                    {event.DistributionDriveLink}</a>) : (<span>N/A</span>)}</div>
                    <DetailItem label="Teams" value={event.Teams} />
            </div>
        </aside>
    );
});

const EventDetailsPanel = memo(({ event, onClose, isLoading, isError, error }) => {
    if (isLoading) { return ( <aside className="details-panel"><div className="details-panel-header"><h2>Loading Event...</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div><div className="details-panel-body"><div className="loader"></div></div></aside> ); }
    if (isError) { return ( <aside className="details-panel"><div className="details-panel-header"><h2>Error</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div><div className="details-panel-body"><div className="error-message">{error.message}</div></div></aside> ); }
    if (!event) { return ( <aside className="details-panel"><div className="details-panel-header"><h2>Not Found</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div><div className="details-panel-body"><div className="error-message">Event details could not be found.</div></div></aside> ); }
    return (
        <aside className="details-panel">
            <div className="details-panel-header"><h2>Event Details: {event.EventCode}</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div>
            <div className="details-panel-body">
                 <DetailItem label="Event ID" value={event.EventID} /><DetailItem label="Event Code" value={event.EventCode} /><DetailItem label="Year" value={event.Yr} /><DetailItem label="Submitted Date" value={event.SubmittedDate} /><DetailItem label="From Date" value={event.FromDate} /><DetailItem label="To Date" value={event.ToDate} /><DetailItem label="Event Name" value={event.EventName} /><DetailItem label="Event Category" value={event.fkEventCategory} /><DetailItem label="Event Remarks" value={event.EventRemarks} /><DetailItem label="Event Month" value={event.EventMonth} /><DetailItem label="Common ID" value={event.CommonID} /><DetailItem label="Is Sub Event" value={event.IsSubEvent1} /><DetailItem label="Is Audio Recorded" value={event.IsAudioRecorded} /><DetailItem label="Pravachan Count" value={event.PravachanCount} /><DetailItem label="Udhgosh Count" value={event.UdhgoshCount} /><DetailItem label="Pagla Count" value={event.PaglaCount} /><DetailItem label="Pratistha Count" value={event.PratisthaCount} /><DetailItem label="Summary Remarks" value={event.SummaryRemarks} /><DetailItem label="Pra-SU Duration" value={event.PraSUduration} /><DetailItem label="Last Modified By" value={event.LastModifiedBy} /><DetailItem label="Last Modified Timestamp" value={event.LastModifiedTimestamp} /><DetailItem label="New Event Category" value={event.NewEventCategory} /><DetailItem label="New Date Form" value={event.NewDateForm} />
            </div>
        </aside>
    );
});

// API Fetch Functions
const fetchDigitalRecordings = async () => { const res = await fetch('http://localhost:5000/api/digitalrecording'); if (!res.ok) { throw new Error('Failed to fetch digital recordings'); } return res.json(); };
const fetchEventDetails = async (eventCode) => { const res = await fetch(`http://localhost:5000/api/events/${eventCode}`); if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `Event with code ${eventCode} not found.`); } return res.json(); };

// --- MAIN COMPONENT ---
function Digitalrecording() {
  const navigate = useNavigate();
  // UI State
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewTitle, setViewTitle] = useState("Digital Recording");
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 50;

  // Details Panel State
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [selectedEventCodeForDetails, setSelectedEventCodeForDetails] = useState(null);

  // Filter Sidebar State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);

  // --- NEW: Dynamic initial state generation for filters ---
  const initialFilterState = useCallback(() => {
    const state = {};
    filterFields.forEach(field => {
      if (field.type === 'range') {
        state[field.key] = { min: '', max: '' };
      } else if (field.type === 'select') {
        state[field.key] = 'All';
      } else {
        state[field.key] = '';
      }
    });
    return state;
  }, []);
  const [filters, setFilters] = useState(initialFilterState());

  // Data Queries
  const { data: recordings = [], isLoading: isRecordingsLoading, error: recordingsError, } = useQuery({ queryKey: ['digitalRecordings'], queryFn: fetchDigitalRecordings, });
  const { data: eventDetails, isLoading: isEventDetailsLoading, isError: isEventDetailsError, error: eventDetailsError, } = useQuery({ queryKey: ['eventDetails', selectedEventCodeForDetails], queryFn: () => fetchEventDetails(selectedEventCodeForDetails), enabled: !!selectedEventCodeForDetails, });

  // --- NEW & UPDATED: Handlers for advanced filtering ---
  const handleSelectRecording = useCallback((recording) => { setSelectedRecording(recording); setSelectedEventCodeForDetails(null); }, []);
  const handleCloseDetails = useCallback(() => { setSelectedRecording(null); setSelectedEventCodeForDetails(null);}, []);
  const handleViewEventDetails = useCallback((eventCode) => { setSelectedEventCodeForDetails(eventCode); }, []);
  const handleCloseEventDetails = useCallback(() => { setSelectedEventCodeForDetails(null); }, []);
  const handleSearchChange = useCallback((event) => { setSearchQuery(event.target.value); setCurrentPage(1); }, []);
  const handleMenuClick = useCallback(() => setMenuOpen(prev => !prev), []);
  const handleCloseSidebar = useCallback(() => setMenuOpen(false), []);
  const handleOpenFilter = useCallback(() => setIsFilterOpen(true), []);
  const handleCloseFilter = useCallback(() => { setIsFilterOpen(false); setActiveFilter(null); }, []);
  
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    const rangePart = e.target.dataset.rangePart;
    setFilters(prev => {
      if (rangePart) {
        return { ...prev, [name]: { ...prev[name], [rangePart]: value } };
      }
      return { ...prev, [name]: value };
    });
  }, []);

  const handleApplyFilters = useCallback(() => { setCurrentPage(1); setIsFilterOpen(false); setActiveFilter(null); }, []);
  const handleClearSidebarFilters = useCallback(() => { setFilters(initialFilterState()); setActiveFilter(null); }, [initialFilterState]);
  const handleSelectFilter = useCallback((filterKey) => { setActiveFilter(filterKey); }, []);
  const handleGoBack = useCallback(() => { setActiveFilter(null); }, []);

  const handleRemoveFilter = useCallback((filterKey) => {
    if (filterKey === 'searchQuery') {
      setSearchQuery('');
    } else {
      setFilters(prev => ({ ...prev, [filterKey]: initialFilterState()[filterKey] }));
    }
    setCurrentPage(1);
  }, [initialFilterState]);

  const handleClearAll = useCallback(() => {
    setSearchQuery('');
    setFilters(initialFilterState());
    setCurrentPage(1);
  }, [initialFilterState]);

  // --- NEW: Replaced with robust filtering logic ---
  const filteredEvents = React.useMemo(() => {
    const query = searchQuery.toLowerCase();
    let results = recordings;

    // 1. Apply the main search query first
    if (query) {
      results = results.filter((e) => (
        (e.fkEventCode?.toLowerCase().includes(query) || e.RecordingName?.toLowerCase().includes(query))
      ));
    }
    
    // 2. Define reusable helper functions for clarity
    const checkString = (field, filterValue) => {
        if (!filterValue) return true;
        const fieldValue = (field || '').toString().toLowerCase();
        return fieldValue.includes(filterValue.toLowerCase());
    };
    
    const checkSelect = (field, filterValue) => {
        if (filterValue === 'All' || !filterValue) return true;
        const fieldValue = field === true ? 'Yes' : (field === false ? 'No' : field);
        return fieldValue === filterValue;
    };

    const checkRange = (value, range) => {
      if (!range || (range.min === '' && range.max === '')) return true;
      const numValue = parseInt(value, 10);
      if (isNaN(numValue)) return false;

      const min = range.min !== '' ? parseInt(range.min, 10) : -Infinity;
      const max = range.max !== '' ? parseInt(range.max, 10) : Infinity;

      const isMinOk = isNaN(min) || numValue >= min;
      const isMaxOk = isNaN(max) || numValue <= max;

      return isMinOk && isMaxOk;
    };

    // 3. Apply the dynamic advanced filters
    results = results.filter(recording => {
        return Object.keys(filters).every(key => {
            const fieldDef = filterFields.find(f => f.key === key);
            if (!fieldDef) return true;

            const filterValue = filters[key];
            const recordValue = recording[key];
            
            switch (fieldDef.type) {
                case 'text':
                    return checkString(recordValue, filterValue);
                case 'range':
                    return checkRange(recordValue, filterValue);
                case 'select':
                    return checkSelect(recordValue, filterValue);
                default:
                    return true;
            }
        });
    });

    return results;
  }, [recordings, searchQuery, filters]);
  // --- END OF NEW LOGIC ---

  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
  const currentEvents = filteredEvents.slice((currentPage - 1) * eventsPerPage, currentPage * eventsPerPage);

  const handleExport = useCallback(() => {
    if (filteredEvents.length === 0) { alert("No data to export."); return; }
    const headers = Object.keys(filteredEvents[0]);
    const csvHeader = headers.join(',');
    const csvRows = filteredEvents.map(event => headers.map(header => { const value = event[header]; const strValue = String(value === null || value === undefined ? '' : value); return strValue.includes(',') ? `"${strValue}"` : strValue; }).join(','));
    const csvContent = [csvHeader, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Digital_Recording_export.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }, [filteredEvents]);

  return (
    <div className={`layout ${menuOpen ? 'sidebar-open' : ''}`}>
      <Sidebar isOpen={menuOpen} setViewTitle={setViewTitle} onClose={handleCloseSidebar} navigate={navigate} />
      <FilterSidebar isOpen={isFilterOpen} onClose={handleCloseFilter} filters={filters} onFilterChange={handleFilterChange} onApply={handleApplyFilters} onClear={handleClearSidebarFilters} activeFilter={activeFilter} onSelectFilter={handleSelectFilter} onGoBack={handleGoBack} />

      <main className="main-content">
        <Header viewTitle={viewTitle} onMenuClick={handleMenuClick} onExportClick={handleExport} searchQuery={searchQuery} onSearchChange={handleSearchChange} onFilterClick={handleOpenFilter} />
        
        {/* --- NEW: Active filters display added --- */}
        <ActiveFiltersDisplay filters={filters} searchQuery={searchQuery} onRemoveFilter={handleRemoveFilter} onClearAll={handleClearAll} />

        <div className={`content-area ${selectedRecording || selectedEventCodeForDetails ? 'details-visible' : ''}`}>
          <div className="table-wrapper">
            {isRecordingsLoading && <div className="loader">Loading Recordings...</div>}
            {recordingsError && <div className="error-message">{recordingsError.message}</div>}
            {!isRecordingsLoading && !recordingsError && (
              <>
                <EventsTable events={currentEvents} onViewDetails={handleSelectRecording} selectedEventId={selectedRecording?.RecordingCode} />
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </>
            )}
          </div>

          {selectedEventCodeForDetails ? (
            <EventDetailsPanel event={eventDetails} onClose={handleCloseEventDetails} isLoading={isEventDetailsLoading} isError={isEventDetailsError} error={eventDetailsError} />
          ) : selectedRecording ? (
            <RecordingDetailsPanel event={selectedRecording} onClose={handleCloseDetails} onViewEventDetails={handleViewEventDetails} />
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default Digitalrecording;