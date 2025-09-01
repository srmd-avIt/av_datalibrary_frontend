// src/components/AuxFiles.js

import React, { useState, useCallback, memo } from 'react';
import { useNavigate,useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FaListAlt, FaFolderOpen, FaVideo, FaTable, FaTag, FaMicrophone,
  FaInfoCircle, FaCommentDots, FaShareAlt, FaTimes, FaBars,
  FaSearch, FaFilter, FaFileExport,
  FaChevronRight, FaArrowLeft,
  FaStream, FaChartBar
} from 'react-icons/fa';
import './users.css'; // Assuming you want to reuse the same styles
import './link-button.css'; // Add this import for the link button style


// --- SUB-COMPONENTS (Sidebar, Header, Filter components remain the same as you provided) ---

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
          <input type="text" placeholder="Search Code, Topic, Remarks..." value={searchQuery} onChange={onSearchChange} />
          <FaFilter className="filter-icon" title="Advanced Filters" onClick={onFilterClick} />
        </div>
        <button className="icon-btn search-toggle-btn" onClick={handleSearchToggle}>
          {searchVisible ? <FaTimes /> : <FaSearch />}
        </button>
        <button onClick={onExportClick} className="export-btn">
          <FaFileExport /> <span>Export</span>
        </button>
      </div>
    </header>
  );
});

const filterFields = [
  { key: 'AUXID', label: 'AUXID', type: 'text' },
  { key: 'new_auxid', label: 'new_auxid', type: 'text' },
  { key: 'AuxCode', label: 'AuxCode', type: 'text' },
  { key: 'AuxFileType', label: 'AuxFileType', type: 'text' },
  { key: 'AuxLanguage', label: 'AuxLanguage', type: 'text' },
  { key: 'fkMLID', label: 'fkMLID', type: 'text' },
  { key: 'AuxTopic', label: 'AuxTopic', type: 'text' },
  { key: 'NotesRemarks', label: 'NotesRemarks', type: 'text' },
  { key: 'GoogleDriveLink', label:  'GoogleDriveLink', type: 'text' },
  { key: 'NoOfFiles', label: 'NoOfFiles', type: 'range' },
  { key: 'FilesizeBytes', label: 'FilesizeBytes', type: 'range' },
  
  { key: 'LastModifiedTimestamp', label: 'LastModifiedTimestamp', type: 'text' },
  { key: 'LastModifiedBy', label: 'LastModifiedBy', type: 'text' },
  { key: 'ProjFileCode', label: 'ProjFileCode', type: 'text' },
  { key: 'ProjFileSize', label: 'ProjFileSize', type: 'range' },
  { key: 'ProjFileName', label: 'ProjFileName', type: 'text' },
  { key: 'SRTLink', label: 'SRTLink', type: 'text' },
  { key: 'CreatedOn', label: 'CreatedOn', type: 'text' },
  { key: 'CreatedBy', label: 'CreatedBy', type: 'text' },
  { key: 'ModifiedOn', label: 'ModifiedOn', type: 'text' },
  { key: 'ModifiedBy', label: 'ModifiedBy', type: 'text' },
  
];

const FilterSidebar = memo(({ isOpen, onClose, filters, onFilterChange, onApply, onClear, activeFilter, onSelectFilter, onGoBack }) => {
  const renderFieldList = () => (
    <ul className="filter-field-list">
      {filterFields.map(field => (
        <li key={field.key} onClick={() => onSelectFilter(field.key)}>
          <div className="filter-field-label"><span>{field.label}</span></div> <FaChevronRight />
        </li>
      ))}
    </ul>
  );
  const renderValueInput = () => {
    const field = filterFields.find(f => f.key === activeFilter);
    if (!field) return null;
    const renderContent = () => {
      if (field.type === 'range') { return ( <div className="filter-group filter-range-group"> <label htmlFor={`filter-input-${field.key}-min`}>Min</label> <input type="number" id={`filter-input-${field.key}-min`} name={field.key} data-range-part="min" value={filters[field.key]?.min || ''} onChange={onFilterChange} autoFocus /> <label htmlFor={`filter-input-${field.key}-max`}>Max</label> <input type="number" id={`filter-input-${field.key}-max`} name={field.key} data-range-part="max" value={filters[field.key]?.max || ''} onChange={onFilterChange} /> </div> ); }
      if (field.type === 'select') { return ( <div className="filter-group"> <label htmlFor={`filter-input-${field.key}`}>{field.label}</label> <select id={`filter-input-${field.key}`} name={field.key} value={filters[field.key] || 'All'} onChange={onFilterChange}> {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)} </select> </div> ); }
      return ( <div className="filter-group"> <label htmlFor={`filter-input-${field.key}`}>{field.label}</label> <input type={field.type} id={`filter-input-${field.key}`} name={field.key} value={filters[field.key] || ''} onChange={onFilterChange} autoFocus /> </div> );
    };
    return ( <div className="filter-value-view"> <button onClick={onGoBack} className="filter-back-button"><FaArrowLeft /><span>All Filters</span></button> {renderContent()} </div> );
  };
  const headerTitle = activeFilter ? filterFields.find(f => f.key === activeFilter)?.label || 'Filter' : 'Filters';
  return ( <> <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={onClose}></div> <aside className={`filter-sidebar ${isOpen ? 'open' : ''}`}> <div className="filter-sidebar-header"> <li className="filter-close-list-item" onClick={onClose}><FaArrowLeft /></li> <h3>{headerTitle}</h3> <button onClick={onClose} className="close-sidebar-btn" title="Dismiss"><FaTimes /></button> </div> <div className="filter-sidebar-body">{activeFilter ? renderValueInput() : renderFieldList()}</div> <div className="filter-sidebar-footer"> <button className="btn-secondary" onClick={onClear}>Clear All</button> <button className="btn-primary" onClick={onApply}>Apply Filters</button> </div> </aside> </> );
});

const ActiveFiltersDisplay = memo(({ filters, searchQuery, onRemoveFilter, onClearAll }) => {
  const activeFiltersList = [];
  if (searchQuery) { activeFiltersList.push({ key: 'searchQuery', label: 'Search', value: `"${searchQuery}"` }); }
  Object.keys(filters).forEach(key => {
    const value = filters[key]; const field = filterFields.find(f => f.key === key); if (!field) return;
    if (field.type === 'range') { if (value.min || value.max) { let displayValue = ''; if (value.min && value.max) displayValue = `${value.min} - ${value.max}`; else if (value.min) displayValue = `> ${value.min}`; else if (value.max) displayValue = `< ${value.max}`; activeFiltersList.push({ key, label: field.label, value: displayValue }); } } else if (value && value !== 'All') { activeFiltersList.push({ key, label: field.label, value }); }
  });
  if (activeFiltersList.length === 0) return null;
  return ( <div className="active-filters-container"> <div className="active-filters-list"> {activeFiltersList.map(filter => ( <div key={filter.key} className="filter-chip"> <span><strong>{filter.label}:</strong> {filter.value}</span> <button onClick={() => onRemoveFilter(filter.key)} title={`Remove ${filter.label} filter`}><FaTimes /></button> </div> ))} </div> <button onClick={onClearAll} className="clear-all-filters-btn">Clear All</button> </div> );
});

const Pagination = memo(({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return ( <nav className="pagination"> <button className="pagination-arrow" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>{'<< Previous'}</button> <span className="pagination-info">Page {currentPage} of {totalPages}</span> <button className="pagination-arrow" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>{'Next >>'}</button> </nav> );
});

const formatBoolean = (value) => value === true || value === 1 ? 'Yes' : (value === false || value === 0 ? 'No' : 'N/A');

// --- DATA DISPLAY COMPONENTS ---

const AuxFilesTable = memo(({ auxFiles, onViewDetails, selectedAuxFileId }) => {
  if (auxFiles.length === 0) { return <div className="no-data-message">No data found. Try adjusting your search or filters.</div>; }
  return (
    <div className="table-container">
      <table className="user-table">
        <thead>
          <tr>
            <th>AUXID</th>
            <th>newauxid</th>
            <th>AuxCode</th>
             <th>AuxFileType</th>
             <th>AuxLanguage</th>
            <th>fkMLID</th>
            <th>AuxTopic</th>
            <th>NotesRemarks</th>
            <th>GoogleDriveLink</th>
            <th>NoOfFiles</th>
            <th>FilesizeBytes</th>
            <th>LastModifiedTimestamp</th>
            <th>LastModifiedBy</th>
            <th>ProjFileCode</th>
            <th>ProjFileSize</th>
            <th>ProjFileName</th>
            <th>SRTLink</th>
            <th>CreatedOn</th>
            <th>CreatedBy</th>
            <th>ModifiedOn</th>
            <th>ModifiedBy</th>
            
          </tr>
        </thead>
        <tbody>
          {auxFiles.map((auxFile) => (
            <tr key={auxFile.AuxCode} className={`main-row ${selectedAuxFileId === auxFile.AuxCode ? 'selected' : ''}`} onClick={() => onViewDetails(auxFile)}>
              <td data-label="AUXID">{auxFile.AUXID || 'N/A'}</td>
              <td data-label="newauxid">{auxFile.new_auxid || 'N/A'}</td>
              <td data-label="AuxCode">{auxFile.AuxCode || 'N/A'}</td>
               <td data-label="AuxFileType">{auxFile.AuxFileType || 'N/A'}</td>
               <td data-label="AuxLanguage">{auxFile.AuxLanguage || 'N/A'}</td>
              <td data-label="fkMLID">{auxFile.fkMLID || 'N/A'}</td> 
              <td data-label="AuxTopic">{auxFile.AuxTopic || 'N/A'}</td>
              <td data-label="NotesRemarks">{auxFile.NotesRemarks || 'N/A'}</td>
              <td data-label="GoogleDriveLink">{auxFile.GoogleDriveLink ? 
              (<a href= {auxFile.GoogleDriveLink}
                target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  {auxFile.GoogleDriveLink}</a>):('N/A')}</td>
              <td data-label="NoOfFiles">{auxFile.NoOfFiles !== null && auxFile.NoOfFiles !== undefined ? auxFile.NoOfFiles : 'N/A'}</td>
              <td data-label="FilesizeBytes">{auxFile.FilesizeBytes !== null && auxFile.FilesizeBytes !== undefined ? auxFile.FilesizeBytes : 'N/A'}</td>
              <td data-label="LastModifiedTimestamp">{auxFile.LastModifiedTimestamp || 'N/A'}</td>
              <td data-label="LastModifiedBy">{auxFile.LastModifiedBy || 'N/A'}</td>
              <td data-label="ProjFileCode">{auxFile.ProjFileCode || 'N/A'}</td>
              <td data-label="ProjFileSize">{auxFile.ProjFileSize !== null && auxFile.ProjFileSize !== undefined ? auxFile.ProjFileSize : 'N/A'}</td>
              <td data-label="ProjFileName">{auxFile.ProjFileName || 'N/A'}</td>
              <td data-label="SRTLink">{auxFile.SRTLink ? 
              (<a href= {auxFile.SRTLink}
                target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  {auxFile.SRTLink}</a>):('N/A')}</td>
              <td data-label="CreatedOn">{auxFile.CreatedOn || 'N/A'}</td>
              <td data-label="CreatedBy">{auxFile.CreatedBy || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

const DetailItem = memo(({ label, value, isBoolean = false }) => (<div className="detail-view-group"><label>{label}</label><span>{isBoolean ? formatBoolean(value) : (value !== null && value !== undefined ? String(value) : 'N/A')}</span></div>));

const AuxFileDetailsPanel = memo(({ auxFile, onClose, onViewNewMediaLogDetails }) => {
    if (!auxFile) return null;
    return (
        <aside className="details-panel">
            <div className="details-panel-header"><h2>AuxCode Details: {auxFile.AuxCode}</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div>
            <div className="details-panel-body">
                <DetailItem label="AUXID" value={auxFile.AUXID} />
                <DetailItem label="newauxid" value={auxFile.new_auxid} />
                <DetailItem label="AuxCode" value={auxFile.AuxCode} />
                 <DetailItem label="File Type" value={auxFile.AuxFileType} />
                 <DetailItem label="Language" value={auxFile.AuxLanguage} />

                <div className="detail-view-group">
                    <label>fkMLID</label>
                    {auxFile.fkMLID ? (
                        <button className="link-button" onClick={() => onViewNewMediaLogDetails(auxFile.fkMLID)}>
                            {auxFile.fkMLID} <FaChevronRight size="1.2em" style={{ marginLeft: '190px', opacity: 0.7 }}/>
                        </button>
                    ) : ( <span>N/A</span> )}
                </div>

               
                <DetailItem label="Topic" value={auxFile.AuxTopic} />
                <DetailItem label="Notes/Remarks" value={auxFile.NotesRemarks} />
                <div className="detail-view-group">
                  <label>Google Drive Link</label>
                  {auxFile.GoogleDriveLink ? 
                  (<a href={auxFile.GoogleDriveLink} 
                  target="_blank" rel="noopener noreferrer" className="detail-link">
                    {auxFile.GoogleDriveLink}</a>) : (<span>N/A</span>)}</div>

                <DetailItem label="No Of Files" value={auxFile.NoOfFiles} />
                <DetailItem label="Filesize (Bytes)" value={auxFile.FilesizeBytes} />                
                <DetailItem label="Last Modified Timestamp" value={auxFile.LastModifiedTimestamp} />
                <DetailItem label="Last Modified By" value={auxFile.LastModifiedBy} />
                <DetailItem label="Proj File Code" value={auxFile.ProjFileCode} />
                <DetailItem label="Proj File Size" value={auxFile.ProjFileSize} />
                <DetailItem label="Proj File Name" value={auxFile.ProjFileName} />
                <div className="detail-view-group">
                  <label>SRT Link</label>
                  {auxFile.SRTLink ? 
                  (<a href={auxFile.SRTLink}
                  target="_blank" rel="noopener noreferrer" className="detail-link">
                    {auxFile.SRTLink}</a>) : (<span>N/A</span>)}</div>
                <DetailItem label="Created On" value={auxFile.CreatedOn} />
                <DetailItem label="Created By" value={auxFile.CreatedBy} />
                <DetailItem label="Modified On" value={auxFile.ModifiedOn} />
                <DetailItem label="Modified By" value={auxFile.ModifiedBy} />
                <DetailItem label="Has Subtitle" value={auxFile.HasSubtitle} isBoolean />
            </div>
        </aside>
    );
});

// NEW: Component to show NewMediaLog details, adapted from your Newmedialog.js
const NewMediaLogDetailsPanel = memo(({ event, onClose, isLoading, isError, error }) => {
    if (isLoading) { return ( <aside className="details-panel"><div className="details-panel-header"><h2>Loading Log Details...</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div><div className="details-panel-body"><div className="loader"></div></div></aside> ); }
    if (isError) { return ( <aside className="details-panel"><div className="details-panel-header"><h2>Error</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div><div className="details-panel-body"><div className="error-message">{error?.message}</div></div></aside> ); }
    if (!event) { return ( <aside className="details-panel"><div className="details-panel-header"><h2>Not Found</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div><div className="details-panel-body"><div className="error-message">Details for this Media Log could not be found.</div></div></aside> ); }

    return (
    <aside className="details-panel">
        <div className="details-panel-header"><h2>MediaLog Details: {event.MLUniqueID}</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div>
        <div className="details-panel-body">
            <DetailItem label="ML Unique ID" value={event.MLUniqueID} />
            <DetailItem label="FootageType" value={event.FootageType} />
            <DetailItem label="LogSerialNo" value={event.LogSerialNo} />
            <DetailItem label="Digital Recording Code" value={event.fkDigitalRecordingCode} />
            <DetailItem label="ContentFrom" value={event.ContentFrom} />
            <DetailItem label="ContentTo" value={event.ContentTo} />
            <DetailItem label="TimeOfDay" value={event.TimeOfDay} />
            <DetailItem label="fkOccasion" value={event.fkOccasion} />
            <DetailItem label="EditingStatus" value={event.EditingStatus} />
              <DetailItem label="Footage Type" value={event.FootageType || 'N/A'} />
             <DetailItem label="Video Distribution" value={event.VideoDistribution || 'N/A'} />
             <DetailItem label="Detail" value={event.Detail || 'N/A'} />
             <DetailItem label="Sub Detail" value={event.SubDetail || 'N/A'} />
             <DetailItem label="Counter From" value={event.CounterFrom || 'N/A'} />
             <DetailItem label="Counter To" value={event.CounterTo || 'N/A'} />
             <DetailItem label="Sub Duration" value={event.SubDuration || 'N/A'} />
             <DetailItem label="Total Duration" value={event.TotalDuration || 'N/A'} />
             <DetailItem label="Language" value={event.Language || 'N/A'} />
             <DetailItem label="Speaker/Singer" value={event.SpeakerSinger || 'N/A'} />
             <DetailItem label="Organization" value={event.fkOrganization || 'N/A'} />
             <DetailItem label="Designation" value={event.Designation || 'N/A'} />
             <DetailItem label="Country" value={event.fkCountry || 'N/A'} />
             <DetailItem label="State" value={event.fkState || 'N/A'} />
             <DetailItem label="City" value={event.fkCity || 'N/A'} />
             <DetailItem label="Venue" value={event.Venue || 'N/A'} />
             <DetailItem label="Granth" value={event.fkGranth || 'N/A'} />
             <DetailItem label="Number" value={event.Number || 'N/A'} />
             <DetailItem label="Topic" value={event.Topic || 'N/A'} />
             <DetailItem label="Series Name" value={event.SeriesName || 'N/A'} />
             <DetailItem label="Satsang Start" value={event.SatsangStart|| 'N/A'} />
             <DetailItem label="Satsang End" value={event.SatsangEnd || 'N/A'} />
             <DetailItem label="Is Audio Recorded" value={event.IsAudioRecorded || 'N/A'} />
             <DetailItem label="Audio MP3 Distribution" value={event.AudioMP3Distribution || 'N/A'} />
             <DetailItem label="Audio WAV Distribution" value={event.AudioWAVDistribution || 'N/A'} />
             <DetailItem label="Audio MP3 DR Code" value={event.AudioMp3DRCode || 'N/A'} />
             <DetailItem label="Audio WAV DR Code" value={event.AudioWAVDRCode || 'N/A'} />
             <DetailItem label="Full WAV DR Code" value={event.FullWAVDRCode || 'N/A'} />
             <DetailItem label="Remarks" value={event.Remarks || 'N/A'} />
             <DetailItem label="Is Start Page" value={event.IsStartPage || 'N/A'} />
             <DetailItem label="End Page" value={event.EndPage || 'N/A'} />
             <DetailItem label="Is Informal" value={event.IsInformal || 'N/A'} />
             <DetailItem label="Is PPG Not Present" value={event.IsPPGNotPresent || 'N/A'} />
             <DetailItem label="Guidance" value={event.Guidance || 'N/A'} />
             <DetailItem label="Disk Master Duration" value={event.DiskMasterDuration || 'N/A'} />
             <DetailItem label="Event Ref Remarks Counters" value={event.EventRefRemarksCounters || 'N/A'} />
             <DetailItem label="Event Ref MLID" value={event.EventRefMLID || 'N/A'} />
             <DetailItem label="Event Ref MLID 2" value={event.EventRefMLID2 || 'N/A'} />
             <DetailItem label="Dubbed Language" value={event.DubbedLanguage || 'N/A'} />
             <DetailItem label="Dubbing Artist" value={event.DubbingArtist || 'N/A'} />
             <DetailItem label="Has Subtitle" value={event.HasSubtitle || 'N/A'} />
             <DetailItem label="Subtitles Language" value={event.SubTitlesLanguage || 'N/A'} />
             <DetailItem label="Editing Dept Remarks" value={event.EditingDeptRemarks || 'N/A'} />
             <DetailItem label="Editing Type" value={event.EditingType || 'N/A'} />
             <DetailItem label="Bhajan Type" value={event.BhajanType || 'N/A'} />
             <DetailItem label="Is Dubbed" value={event.IsDubbed || 'N/A'} />
             <DetailItem label="Number Source" value={event.NumberSource || 'N/A'} />
             <DetailItem label="Topic Source" value={event.TopicSource || 'N/A'} />
             <DetailItem label="Last Modified Timestamp" value={event.LastModifiedTimestamp || 'N/A'} />
             <DetailItem label="Last Modified By" value={event.LastModifiedBy || 'N/A'} />
             <DetailItem label="Synopsis" value={event.Synopsis || 'N/A'} />
             <DetailItem label="Location Within Ashram" value={event.LocationWithinAshram || 'N/A'} />
             <DetailItem label="Keywords" value={event.Keywords || 'N/A'} />
             <DetailItem label="Grading" value={event.Grading || 'N/A'} />
             <DetailItem label="Segment Category" value={event.SegmentCategory || 'N/A'} />
             <DetailItem label="Segment Duration" value={event.SegmentDuration || 'N/A'} />
             <DetailItem label="Topic Given By" value={event.TopicGivenBy || 'N/A'} />
        </div>
    </aside>
    );
});

// --- API FETCHING ---
const fetchAuxFiles = async () => {
  const res = await fetch('http://localhost:5000/api/auxfiles');
  if (!res.ok) throw new Error('Network response was not ok');
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Data from API is not in the expected array format.");
  return data;
};

const fetchNewMediaLogDetails = async (mlid) => {
    if (!mlid) return null;
    const res = await fetch(`http://localhost:5000/api/newmedialog/${mlid}`);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Media Log with ID ${mlid} not found.`);
    }
    return res.json();
};

// --- MAIN COMPONENT ---
function Auxfiles() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewTitle, setViewTitle] = useState("AuxFiles");
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 50;
  
  const [selectedAuxFile, setSelectedAuxFile] = useState(null);
  const [selectedMlidForDetails, setSelectedMlidForDetails] = useState(null);

  const initialFilterState = useCallback(() => (Object.fromEntries(filterFields.map(field => { if (field.type === 'range') return [field.key, { min: '', max: '' }]; if (field.type === 'select') return [field.key, 'All']; return [field.key, '']; }))), []);
  const [filters, setFilters] = useState(initialFilterState);
  const [activeFilter, setActiveFilter] = useState(null);

  const { data: auxFiles = [], isLoading, error } = useQuery({ queryKey: ['auxfiles'], queryFn: fetchAuxFiles });

  const { data: newMediaLogDetails, isLoading: isNewMediaLogDetailsLoading, isError: isNewMediaLogDetailsError, error: newMediaLogDetailsError, } = useQuery({
    queryKey: ['newMediaLogDetails', selectedMlidForDetails],
    queryFn: () => fetchNewMediaLogDetails(selectedMlidForDetails),
    enabled: !!selectedMlidForDetails,
  });

  const handleSelectAuxFile = useCallback((file) => {
    setSelectedMlidForDetails(null); 
    setSelectedAuxFile(file);
  }, []);
  const handleCloseDetails = useCallback(() => setSelectedAuxFile(null), []);

  const handleViewNewMediaLogDetails = useCallback((mlid) => {
    setSelectedMlidForDetails(mlid);
  }, []);
  const handleCloseNewMediaLogDetails = useCallback(() => setSelectedMlidForDetails(null), []);

  const handleMenuClick = useCallback(() => setMenuOpen(prev => !prev), []);
  const handleCloseSidebar = useCallback(() => setMenuOpen(false), []);
  const handleSearchChange = useCallback((event) => { setSearchQuery(event.target.value); setCurrentPage(1); }, []);
  const handleOpenFilter = useCallback(() => setIsFilterOpen(true), []);
  const handleCloseFilter = useCallback(() => { setIsFilterOpen(false); setActiveFilter(null); }, []);
  const handleFilterChange = useCallback((e) => { const { name, value } = e.target; const rangePart = e.target.dataset.rangePart; setFilters(prev => { if (rangePart) { return { ...prev, [name]: { ...prev[name], [rangePart]: value } }; } return { ...prev, [name]: value }; }); }, []);
  const handleApplyFilters = useCallback(() => { setCurrentPage(1); setIsFilterOpen(false); setActiveFilter(null); }, []);
  const handleClearFilters = useCallback(() => { setFilters(initialFilterState()); setActiveFilter(null); }, [initialFilterState]);
  const handleSelectFilter = useCallback((filterKey) => setActiveFilter(filterKey), []);
  const handleGoBack = useCallback(() => setActiveFilter(null), []);
  const handleRemoveFilter = useCallback((filterKey) => { if (filterKey === 'searchQuery') { setSearchQuery(''); } else { setFilters(prev => ({ ...prev, [filterKey]: initialFilterState()[filterKey] })); } setCurrentPage(1); }, [initialFilterState]);
  const handleClearAll = useCallback(() => { setSearchQuery(''); setFilters(initialFilterState()); setCurrentPage(1); }, [initialFilterState]);

  // --- !!! THIS IS THE CORRECTED FILTERING LOGIC !!! ---
  const filteredAuxFiles = React.useMemo(() => {
    const query = searchQuery.toLowerCase();
    let results = auxFiles;

    // 1. Apply the main search query first
    if (query) {
      results = results.filter((file) => {
        const code = (file.AuxCode || '').toLowerCase();
        const topic = (file.AuxTopic || '').toLowerCase();
        const remarks = (file.NotesRemarks || '').toLowerCase();
        return code.includes(query) || topic.includes(query) || remarks.includes(query);
      });
    }
    
    // 2. Define reusable helper functions for clarity
    const checkString = (field, filterValue) => {
        if (!filterValue) return true; // No filter value, so it passes
        const fieldValue = (field || '').toString().toLowerCase();
        return fieldValue.includes(filterValue.toLowerCase());
    };
    
    const checkSelect = (field, filterValue) => {
        if (filterValue === 'All' || !filterValue) return true;
        // Handles true/false and 1/0 as Yes/No
        const fieldValue = (field === true || field === 1) ? 'Yes' : ((field === false || field === 0) ? 'No' : field);
        return fieldValue === filterValue;
    };

    const checkRange = (value, range) => {
      if (!range || (range.min === '' && range.max === '')) return true;
      const numValue = parseInt(value, 10);
      if (isNaN(numValue)) return false; // If data is not a number, it can't be in a range

      const min = range.min !== '' ? parseInt(range.min, 10) : -Infinity;
      const max = range.max !== '' ? parseInt(range.max, 10) : Infinity;

      // Ensure min/max from filter are valid numbers before comparison
      const isMinOk = isNaN(min) || numValue >= min;
      const isMaxOk = isNaN(max) || numValue <= max;

      return isMinOk && isMaxOk;
    };

    // 3. Apply the dynamic advanced filters
    results = results.filter(file => {
      // Use .every() to ensure the file passes ALL active filter conditions
      return Object.keys(filters).every(key => {
        const fieldDef = filterFields.find(f => f.key === key);
        if (!fieldDef) return true; // If no definition found, don't filter

        const filterValue = filters[key];
        const fileValue = file[key];
        
        // Apply the correct check based on the field's defined type
        switch (fieldDef.type) {
          case 'text':
            return checkString(fileValue, filterValue);
          case 'range':
          case 'number': // Treat number like range for this purpose
            return checkRange(fileValue, filterValue);
          case 'select':
            return checkSelect(fileValue, filterValue);
          default:
            return true; // For any other type, don't filter
        }
      });
    });

    return results;
  }, [auxFiles, searchQuery, filters]);
  // --- END OF CORRECTED LOGIC ---

  const totalPages = Math.ceil(filteredAuxFiles.length / eventsPerPage);
  const currentAuxFiles = filteredAuxFiles.slice((currentPage - 1) * eventsPerPage, currentPage * eventsPerPage);

  const handleExport = useCallback(() => { 
    if (filteredAuxFiles.length === 0) { alert("No data to export."); return; }
    const headers = Object.keys(filteredAuxFiles[0]); const csvHeader = headers.join(',');
    const csvRows = filteredAuxFiles.map(row => headers.map(header => { const value = row[header]; const strValue = String(value === null || value === undefined ? '' : value); if (strValue.includes(',') || strValue.includes('"')) { return `"${strValue.replace(/"/g, '""')}"`; } return strValue; }).join(','));
    const csvContent = [csvHeader, ...csvRows].join('\n'); const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); const url = URL.createObjectURL(blob);
    link.setAttribute("href", url); link.setAttribute("download", "auxfiles_export.csv");
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  }, [filteredAuxFiles]);

  return (
    <div className={`layout ${menuOpen ? 'sidebar-open' : ''}`}>
      <Sidebar isOpen={menuOpen} setViewTitle={setViewTitle} onClose={handleCloseSidebar} navigate={navigate} />
      <FilterSidebar isOpen={isFilterOpen} onClose={handleCloseFilter} filters={filters} onFilterChange={handleFilterChange} onApply={handleApplyFilters} onClear={handleClearFilters} activeFilter={activeFilter} onSelectFilter={handleSelectFilter} onGoBack={handleGoBack} />
      
      <main className="main-content">
        <Header viewTitle={viewTitle} onMenuClick={handleMenuClick} onExportClick={handleExport} searchQuery={searchQuery} onSearchChange={handleSearchChange} onFilterClick={handleOpenFilter} />
        <ActiveFiltersDisplay filters={filters} searchQuery={searchQuery} onRemoveFilter={handleRemoveFilter} onClearAll={handleClearAll} />
        
        <div className={`content-area ${selectedAuxFile || selectedMlidForDetails ? 'details-visible' : ''}`}>
          <div className="table-wrapper">
            {isLoading && <div className="loader">Loading...</div>}
            {error && <div className="error-message">{error.message}</div>}
            {!isLoading && !error && (
              <>
                <AuxFilesTable auxFiles={currentAuxFiles} onViewDetails={handleSelectAuxFile} selectedAuxFileId={selectedAuxFile?.AuxCode} />
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </>
            )}
          </div>

          {/* --- Chained Conditional Rendering for Details Panels --- */}
          {selectedMlidForDetails ? (
            <NewMediaLogDetailsPanel
                event={newMediaLogDetails}
                onClose={handleCloseNewMediaLogDetails}
                isLoading={isNewMediaLogDetailsLoading}
                isError={isNewMediaLogDetailsError}
                error={newMediaLogDetailsError}
            />
          ) : selectedAuxFile ? (
            <AuxFileDetailsPanel 
                auxFile={selectedAuxFile} 
                onClose={handleCloseDetails}
                onViewNewMediaLogDetails={handleViewNewMediaLogDetails}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default Auxfiles;