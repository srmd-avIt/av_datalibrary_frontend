import React, { useState, useCallback, memo, useEffect } from 'react';
import './users.css';
import './link-button.css';
import { useNavigate,useLocation} from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// Import all necessary icons
import {
  FaListAlt, FaFolderOpen, FaVideo, FaTable, FaTag, FaMicrophone,
  FaInfoCircle, FaCommentDots, FaShareAlt, FaTimes, FaBars,
  FaSearch, FaFilter, FaFileExport,
  FaChevronRight, FaArrowLeft,FaStream, FaChartBar
} from 'react-icons/fa';

// Import the self-contained Assistant component
import AssistantPanel from './AssistantPanel';

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

const Sidebar = memo(({ isOpen, setViewTitle, onClose, navigate, onOpenAssistant, isAssistantOpen }) => {
    const location = useLocation();
    const handleAssistantClick = () => {
        onOpenAssistant();
        onClose();
    };
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
                    <SidebarItem icon={<FaMicrophone />} text="Assistant" onClick={handleAssistantClick} active={isAssistantOpen} />
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
            <input
            type="text"
            placeholder="Search MLUniqueID, Topic, or Speaker..."
            value={searchQuery}
            onChange={onSearchChange}
            />
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

const filterFields = [ {key: 'MLUniqueID', label: 'ML Unique ID', type: 'text'},
   { key: 'FootageSrNo', label: 'Footage Serial No', type: 'text' }, 
   { key: 'LogSerialNo', label: 'Log Serial No', type: 'range' }, 
   { key: 'fkDigitalRecordingCode', label: 'Digital Recording Code', type: 'text' },
    { key: 'ContentFrom', label: 'Content From', type: 'text' },
    { key: 'ContentTo', label: 'Content To', type: 'text' },
     { key: 'TimeOfDay', label: 'Time of Day', type: 'checkbox', options: [ { label: '(Empty)', value: '__EMPTY__' }, { label: 'Morning', value: 'Morn' }, { label: 'Afternoon', value: 'Aft' }, { label: 'Evening', value: 'Eve' }, { label: 'Night', value: 'Night' }, ] }, 
     
    { key: 'Language', label: 'Language', type: 'checkbox', options: [ { label: '(Empty)', value: '__EMPTY__' }, { label: 'Gujarati', value: 'Gujarati' }, { label: 'Hindi', value: 'Hindi' }, { label: 'Eng-Guj', value: 'Eng-Guj' }, { label: 'English', value: 'English' }, { label: 'Other', value: 'Other' }, { label: 'Guj-Hin', value: 'Guj-Hin' }, { label: 'Eng-Hin', value: 'Eng-Hin' }, { label: 'Marathi', value: 'Marathi' }, { label: 'Kannada', value: 'Kannada' }, { label: 'Bengali', value: 'Bengali' }, { label: 'Spanish', value: 'Spanish' }, { label: 'Tamil', value: 'Tamil' }, { label: 'Sanskrit', value: 'Sanskrit' }, { label: 'French', value: 'French' }, { label: 'S', value: 'S' }, ] }, { key: 'fkOccasion', label: 'Occasion', type: 'text' }, { key: 'EditingStatus', label: 'Editing Status', type: 'text' }, 
    { key: 'FootageType', label: 'Footage Type', type: 'text'}, 
    { key: 'VideoDistribution', label: 'Video Distribution', type: 'text' },
     { key: 'Detail', label: 'Detail', type: 'text' }, 
     { key: 'SubDetail', label: 'Sub Detail', type: 'text' }, 
     { key: 'CounterFrom', label: 'Counter From', type: 'number' }, 
     { key: 'CounterTo', label: 'Counter To', type: 'number' }, 
     { key: 'SubDuration', label: 'Sub Duration (mins)', type: 'number' }, 
     { key: 'TotalDuration', label: 'Total Duration (mins)', type: 'number' }, 
     { key: 'SpeakerSinger', label: 'Speaker/Singer', type: 'text' }, 
     { key: 'fkOrganization', label: 'Organization', type: 'text' }, 
     { key: 'Designation', label: 'Designation', type: 'text' },
      { key: 'fkCountry', label: 'Country', type: 'text' }, 
      { key:'fkState' ,label:'State' ,type:'text' }, 
      { key: 'fkCity', label: 'City', type: 'text' }, 
      { key: 'Venue', label: 'Venue', type: 'text' }, 
      { key: 'fkGranth', label: 'Granth', type: 'text' }, 
      { key: 'Number', label: 'Number', type: 'text' }, 
      { key: 'Topic', label: 'Topic', type: 'text' }, 
      { key: 'SeriesName', label: 'Series Name', type: 'text' }, 
      { key: 'SatsangStart', label: 'Satsang Start Time', type: 'text' }, 
      { key:'SatsangEnd' ,label:'Satsang End Time' ,type:'text' }, 
      { key:'IsAudioRecorded' ,label:'Is Audio Recorded?' ,type:'text' }, 
      { key:'AudioMP3Distribution' ,label:'Audio MP3 Distribution' ,type:'text' }, 
      
      { key:'AudioWAVDistribution' ,label:'Audio WAV Distribution' ,type:'text' }, 
      { key:'AudioMp3DRCode' ,label:'Audio MP3 DR Code' ,type:'text' }, 
      { key:'AudioWAVDRCode' ,label:'Audio WAV DR Code' ,type:'text' }, 
      { key:'FullWAVDRCode' ,label:'Full WAV DR Code' ,type:'text' }, 
      { key:'Remarks' ,label:'Remarks' ,type:'text' ,placeholder:''}, 
      { key:'IsStartPage' ,label:'Is Start Page?' ,type:'text' }, 
      { key:'EndPage' ,label:'End Page Number' ,type:'number' }, 
      { key:'IsInformal' ,label:'Is Informal?' ,type:'text' }, 
      { key:'IsPPGNotPresent' ,label:'Is PPG Not Present?' ,type:'text'}, 
      { key: 'Guidance', label: 'Guidance', type: 'text', placeholder: '' },
       { key: 'DiskMasterDuration', label: 'Disk Master Duration', type: 'text' }, 
       { key: 'EventRefRemarksCounters', label: 'Event Ref Remarks Counters', type: 'text' }, 
       { key: 'EventRefMLID', label: 'Event Ref MLID', type: 'text' }, 
       { key: 'EventRefMLID2', label: 'Event Ref MLID 2', type: 'text' }, 
       { key: 'DubbedLanguage', label: 'Dubbed Language', type: 'text' }, 
       { key: 'DubbingArtist', label: 'Dubbing Artist', type: 'text' }, 
       { key:'HasSubtitle' ,label:'Has Subtitle?' ,type:'text' }, 
       { key:'SubTitlesLanguage' ,label:'Subtitles Language' ,type:'text' }, 
       { key:'EditingDeptRemarks' ,label:'Editing Dept Remarks' ,type:'text' },
        { key:'EditingType' ,label:'Editing Type' ,type:'text' }, 
        { key:'BhajanType' ,label:'Bhajan Type' ,type:'text' }, 
        { key:'IsDubbed' ,label:'Is Dubbed?' ,type:'checkbox' }, 
        { key:'NumberSource' ,label:'Number Source' ,type:'text' }, 
        { key:'TopicSource' ,label:'Topic Source' ,type:'text' }, 
        { key:'LastModifiedTimestamp' ,label:'Last Modified Timestamp' ,type:'text'},
         { key:'LastModifiedBy' ,label:'Last Modified By' ,type:'text' }, 
         { key:'Synopsis' ,label:'Synopsis' ,type:'text' ,placeholder:''}, 
         { key:'LocationWithinAshram' ,label:'Location Within Ashram' ,type:'text' }, 
         { key:'Keywords' ,label:'Keywords' ,type:'text' },
          { key:'Grading' ,label:'Grading (1-5)' ,type:'number', placeholder:''}, 
          { key: 'SegmentCategory', label: 'Segment Category', type: 'checkbox', options: [ { label: '(Empty)', value: '__EMPTY__' }, { label: 'Pravachan', value: 'Pravachan' }, { label: 'Bhakti', value: 'Bhakti' }, { label: 'Other Edited Videos', value: 'Other Edited Videos' }, { label: 'Highlights', value: 'Highlights' }, { label: 'Documentary', value: 'Documentary' }, { label: 'Satsang Clips', value: 'Satsang Clips' }, { label: 'Highlights-Mixed', value: 'Highlights-Mixed' }, { label: 'PEP-Post Event Promo', value: 'PEP-Post Event Promo' }, { label: 'Celebrations', value: 'Celebrations' }, { label: 'SU-Revision', value: 'SU-Revision' }, { label: 'Other Clips', value: 'Other Clips' }, { label: 'Celebrations:Heartfelt Experience', value: 'Celebrations:Heartfelt Experience' }, { label: 'Prasangik Udbodhan', value: 'Prasangik Udbodhan' }, { label: 'Padhramani', value: 'Padhramani' }, { label: 'Non-SRMD-Shibirs/Session/Trainig/Workshop', value: 'Non-SRMD-Shibirs/Session/Trainig/Workshop' }, { label: 'SRMD-Shibirs/Session/Trainig/Workshop', value: 'SRMD-Shibirs/Session/Trainig/Workshop' }, { label: 'Celebrations:Drama/Skit', value: 'Celebrations:Drama/Skit' }, { label: 'Drama/Skit', value: 'Drama/Skit' }, { label: 'Meditation', value: 'Meditation' }, { label: 'Highlights-Informal', value: 'Highlights-Informal' }, { label: 'SU-Extracted', value: 'SU-Extracted' }, { label: 'Satsang', value: 'Satsang' }, { label: 'SU-GM', value: 'SU-GM' }, { label: 'Product/Webseries', value: 'Product/Webseries' }, { label: 'Promo', value: 'Promo' }, { label: 'Pujan', value: 'Pujan' }, { label: 'SU', value: 'SU' }, { label: 'Pratishtha', value: 'Pratishtha' }, { label: 'Heartfelt Experiences', value: 'Heartfelt Experiences' }, { label: 'SU:SRMD-Shibir/Session/Training/Workshop', value: 'SU:SRMD-Shibir/Session/Training/Workshop' }, { label: 'Prathana', value: 'Prathana' }, { label: 'Celebrations:Bhakti', value: 'Celebrations:Bhakti' }, { label: 'Bhakti:Drama/Skit', value: 'Bhakti:Drama/Skit' }, { label: 'Informal Satsang', value: 'Informal Satsang' }, ] }, { key:'SegmentDuration' ,label:'Segment Duration (mins)' ,type:'number'},
           { key:'TopicGivenBy' ,label:'Topic Given By' ,type:'text'} ];
const FilterSidebar = memo(({ isOpen, onClose, filters, onFilterChange, onApply, onClear, activeFilter, onSelectFilter, onGoBack }) => { const [checkboxSearchTerm, setCheckboxSearchTerm] = useState(''); useEffect(() => { if (activeFilter) { setCheckboxSearchTerm(''); } }, [activeFilter]); const renderFieldList = () => ( <ul className="filter-field-list"> {filterFields.map(field => ( <li key={field.key} onClick={() => onSelectFilter(field.key)}> <div className="filter-field-label"><span>{field.label}</span></div> <FaChevronRight /> </li> ))} </ul> ); const renderValueInput = () => { const field = filterFields.find(f => f.key === activeFilter); if (!field) return null; const renderContent = () => { if (field.type === 'range') { return ( <div className="filter-group filter-range-group"> <label htmlFor={`filter-input-${field.key}-min`}>Minimum</label> <input type="number" id={`filter-input-${field.key}-min`} name={field.key} data-range-part="min" value={filters[field.key]?.min || ''} onChange={onFilterChange} autoFocus /> <label htmlFor={`filter-input-${field.key}-max`}>Maximum</label> <input type="number" id={`filter-input-${field.key}-max`} name={field.key} data-range-part="max" value={filters[field.key]?.max || ''} onChange={onFilterChange} /> </div> ); } if (field.type === 'checkbox') { const filteredOptions = field.options.filter(option => option.label.toLowerCase().includes(checkboxSearchTerm.toLowerCase())); return ( <div className="filter-group filter-checkbox-group"> <input type="text" className="checkbox-search-input" placeholder={`Search ${field.label}...`} value={checkboxSearchTerm} onChange={(e) => setCheckboxSearchTerm(e.target.value)} autoFocus /> <div className="checkbox-list-container"> {filteredOptions.map(option => ( <div key={option.value} className="checkbox-item"> <input type="checkbox" id={`filter-checkbox-${field.key}-${option.value}`} name={field.key} value={option.value} checked={(filters[field.key] || []).includes(option.value)} onChange={onFilterChange} data-filter-type="checkbox" /> <label htmlFor={`filter-checkbox-${field.key}-${option.value}`}>{option.label}</label> </div> ))} </div> </div> ); } return ( <div className="filter-group"> <label htmlFor={`filter-input-${field.key}`}>{field.label}</label> <input type={field.type} id={`filter-input-${field.key}`} name={field.key} value={filters[field.key] || ''} onChange={onFilterChange} autoFocus /> </div> ); }; return ( <div className="filter-value-view"> <button onClick={onGoBack} className="filter-back-button"><FaArrowLeft /><span>All Filters</span></button> {renderContent()} </div> ); }; const headerTitle = activeFilter ? filterFields.find(f => f.key === activeFilter)?.label || 'Filter' : 'Filters'; return ( <> <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={onClose}></div> <aside className={`filter-sidebar ${isOpen ? 'open' : ''}`}> <div className="filter-sidebar-header"> <li className="filter-close-list-item" onClick={onClose}><FaArrowLeft /></li> <h3>{headerTitle}</h3> <button onClick={onClose} className="close-sidebar-btn" title="Dismiss"><FaTimes /></button> </div> <div className="filter-sidebar-body">{activeFilter ? renderValueInput() : renderFieldList()}</div> <div className="filter-sidebar-footer"> <button className="btn-secondary" onClick={onClear}>Clear All</button> <button className="btn-primary" onClick={onApply}>Apply Filters</button> </div> </aside> </> ); });
const ActiveFiltersDisplay = memo(({ filters, searchQuery, onRemoveFilter, onClearAll }) => { const activeFiltersList = []; if (searchQuery) { activeFiltersList.push({ key: 'searchQuery', label: 'Search', value: `"${searchQuery}"` }); } Object.keys(filters).forEach(key => { const value = filters[key]; const field = filterFields.find(f => f.key === key); if (!field) return; if (field.type === 'range') { if ((value.min) || (value.max)) { let displayValue = ''; if (value.min && value.max) displayValue = `${value.min} - ${value.max}`; else if (value.min) displayValue = `≥ ${value.min}`; else if (value.max) displayValue = `≤ ${value.max}`; activeFiltersList.push({ key, label: field.label, value: displayValue }); } } else if (field.type === 'checkbox') { if (Array.isArray(value) && value.length > 0) { const displayValue = value.map(val => { const option = field.options.find(opt => opt.value === val); return option ? option.label : val; }).join(', '); activeFiltersList.push({ key, label: field.label, value: displayValue }); } } else if (value) { activeFiltersList.push({ key, label: field.label, value }); } }); if (activeFiltersList.length === 0) return null; return ( <div className="active-filters-container"> <div className="active-filters-list"> {activeFiltersList.map(filter => ( <div key={filter.key} className="filter-chip"> <span><strong>{filter.label}:</strong> {filter.value}</span> <button onClick={() => onRemoveFilter(filter.key)} title={`Remove ${filter.label} filter`}><FaTimes /></button> </div> ))} </div> <button onClick={onClearAll} className="clear-all-filters-btn">Clear All</button> </div> ); });
const EventsTable = memo(({ events, onViewDetails, selectedEventId }) => { if (events.length === 0) { return <div className="no-data-message">No data found. Try adjusting your search or filters.</div>; } const formatDate = (dateString) => { if (!dateString) return 'N/A'; const date = new Date(dateString); return isNaN(date.getTime()) ? dateString : date.toLocaleDateString(); }; return ( <div className="table-container"> <table className="user-table"> 
  <thead> 
    <tr> 
  <th>MLUniqueID</th>
  <th>FootageSrNo</th>
  <th>LogSerialNo</th>
  <th>fkDigitalRecordingCode</th>
  <th>ContentFrom</th>
  <th>ContentTo</th>
  <th>TimeOfDay</th>
  <th>fkOccasion</th>
  <th>EditingStatus</th>
  <th>FootageType</th>
  <th>VideoDistribution</th>
  <th>Detail</th>
  <th>SubDetail</th>
  <th>CounterFrom</th>
  <th>CounterTo</th>
  <th>SubDuration</th>
  <th>TotalDuration</th>
  <th>Language</th>
  <th>SpeakerSinger</th>
  <th>fkOrganization</th>
  <th>Designation</th>
  <th>fkCountry</th>
  <th>fkState</th>
  <th>fkCity</th>
  <th>Venue</th>
  <th>fkGranth</th>
  <th>Number</th>
  <th>Topic</th>
  <th>SeriesName</th>
  <th>SatsangStart</th>
  <th>SatsangEnd</th>
  <th>IsAudioRecorded</th>
  <th>AudioMP3Distribution</th>
  <th>AudioWAVDistribution</th>
  <th>AudioMp3DRCode</th>
  <th>AudioWAVDRCode</th>
  <th>FullWAVDRCode</th>
  <th>Remarks</th>
  <th>IsStartPage</th>
  <th>EndPage</th>
  <th>IsInformal</th>
  <th>IsPPGNotPresent</th>
  <th>Guidance</th>
  <th>DiskMasterDuration</th>
  <th>EventRefRemarksCounters</th>
  <th>EventRefMLID</th>
  <th>EventRefMLID2</th>
  <th>DubbedLanguage</th>
  <th>DubbingArtist</th>
  <th>HasSubtitle</th>
  <th>SubTitlesLanguage</th>
  <th>EditingDeptRemarks</th>
  <th>EditingType</th>
  <th>BhajanType</th>
  <th>IsDubbed</th>
  <th>NumberSource</th>
  <th>TopicSource</th>
  <th>LastModifiedTimestamp</th>
  <th>LastModifiedBy</th>
  <th>Synopsis</th>
  <th>LocationWithinAshram</th>
  <th>Keywords</th>
  <th>Grading</th>
  <th>SegmentCategory</th>
  <th>SegmentDuration</th>
  <th>TopicGivenBy</th>
  </tr> 
  </thead> 
  <tbody> 
  
  {events.map((event) => ( <tr key={event.MLUniqueID} className={`main-row ${selectedEventId === event.MLUniqueID ? 'selected' : ''}`} onClick={() => onViewDetails(event)}> 
  <td data-label="MLUniqueID">{event.MLUniqueID || 'N/A'}</td>
  <td data-label="FootageSrNo">{event.FootageSrNo || 'N/A'}</td>
  <td data-label="LogSerialNo">{event.LogSerialNo || 'N/A'}</td>
  <td data-label="fkDigitalRecordingCode">{event.fkDigitalRecordingCode || 'N/A'}</td>
  <td data-label="ContentFrom">{event.ContentFrom || 'N/A'}</td>
  <td data-label="ContentTo">{event.ContentTo || 'N/A'}</td>
  <td data-label="TimeOfDay">{event.TimeOfDay || 'N/A'}</td>
  <td data-label="fkOccasion">{event.fkOccasion || 'N/A'}</td>
  <td data-label="EditingStatus">{event.EditingStatus || 'N/A'}</td>
  <td data-label="FootageType">{event.FootageType || 'N/A'}</td>
  <td data-label="VideoDistribution">{event.VideoDistribution || 'N/A'}</td>
  <td data-label="Detail">{event.Detail || 'N/A'}</td>
  <td data-label="SubDetail">{event.SubDetail || 'N/A'}</td>
  <td data-label="CounterFrom">{event.CounterFrom || 'N/A'}</td>
  <td data-label="CounterTo">{event.CounterTo || 'N/A'}</td>
  <td data-label="SubDuration">{event.SubDuration || 'N/A'}</td>
  <td data-label="TotalDuration">{event.TotalDuration || 'N/A'}</td>
  <td data-label="Language">{event.Language || 'N/A'}</td>
  <td data-label="SpeakerSinger">{event.SpeakerSinger || 'N/A'}</td>
  <td data-label="fkOrganization">{event.fkOrganization || 'N/A'}</td>
  <td data-label="Designation">{event.Designation || 'N/A'}</td>
  <td data-label="fkCountry">{event.fkCountry || 'N/A'}</td>
  <td data-label="fkState">{event.fkState || 'N/A'}</td>
  <td data-label="fkCity">{event.fkCity || 'N/A'}</td>
  <td data-label="Venue">{event.Venue || 'N/A'}</td>
  <td data-label="fkGranth">{event.fkGranth || 'N/A'}</td>
  <td data-label="Number">{event.Number || 'N/A'}</td>
  <td data-label="Topic">{event.Topic || 'N/A'}</td>
  <td data-label="SeriesName">{event.SeriesName || 'N/A'}</td>
  <td data-label="SatsangStart">{event.SatsangStart || 'N/A'}</td>
  <td data-label="SatsangEnd">{event.SatsangEnd || 'N/A'}</td>
  <td data-label="IsAudioRecorded">{formatBoolean(event.IsAudioRecorded)}</td>
  <td data-label="AudioMP3Distribution">{event.AudioMP3Distribution || 'N/A'}</td>
  <td data-label="AudioWAVDistribution">{event.AudioWAVDistribution || 'N/A'}</td>
  <td data-label="AudioMp3DRCode">{event.AudioMp3DRCode || 'N/A'}</td>
  <td data-label="AudioWAVDRCode">{event.AudioWAVDRCode || 'N/A'}</td>
  <td data-label="FullWAVDRCode">{event.FullWAVDRCode || 'N/A'}</td>
  <td data-label="Remarks">{event.Remarks || 'N/A'}</td>
  <td data-label="IsStartPage">{formatBoolean(event.IsStartPage)}</td>
  <td data-label="EndPage">{event.EndPage || 'N/A'}</td>
  <td data-label="IsInformal">{formatBoolean(event.IsInformal)}</td>
  <td data-label="IsPPGNotPresent">{formatBoolean(event.IsPPGNotPresent)}</td>
  <td data-label="Guidance">{event.Guidance || 'N/A'}</td>
  <td data-label="DiskMasterDuration">{event.DiskMasterDuration || 'N/A'}</td>
  <td data-label="EventRefRemarksCounters">{event.EventRefRemarksCounters || 'N/A'}</td>
  <td data-label="EventRefMLID">{event.EventRefMLID || 'N/A'}</td>
  <td data-label="EventRefMLID2">{event.EventRefMLID2 || 'N/A'}</td>
  <td data-label="DubbedLanguage">{event.DubbedLanguage || 'N/A'}</td>
  <td data-label="DubbingArtist">{event.DubbingArtist || 'N/A'}</td>
  <td data-label="HasSubtitle">{formatBoolean(event.HasSubtitle)}</td>
  <td data-label="SubTitlesLanguage">{event.SubTitlesLanguage || 'N/A'}</td>
  <td data-label="EditingDeptRemarks">{event.EditingDeptRemarks || 'N/A'}</td>
  <td data-label="EditingType">{event.EditingType || 'N/A'}</td>
  <td data-label="BhajanType">{event.BhajanType || 'N/A'}</td>
  <td data-label="IsDubbed">{formatBoolean(event.IsDubbed)}</td>
  <td data-label="NumberSource">{event.NumberSource || 'N/A'}</td>
  <td data-label="TopicSource">{event.TopicSource || 'N/A'}</td>
  <td data-label="LastModifiedTimestamp">{event.LastModifiedTimestamp}</td>
  <td data-label="LastModifiedBy">{event.LastModifiedBy || 'N/A'}</td>
  <td data-label="Synopsis">{event.Synopsis || 'N/A'}</td>
  <td data-label="LocationWithinAshram">{event.LocationWithinAshram || 'N/A'}</td>
  <td data-label="Keywords">{event.Keywords || 'N/A'}</td>
  <td data-label="Grading">{event.Grading || 'N/A'}</td>
  <td data-label="SegmentCategory">{event.SegmentCategory || 'N/A'}</td>
  <td data-label="SegmentDuration">{event.SegmentDuration || 'N/A'}</td>
  <td data-label="TopicGivenBy">{event.TopicGivenBy || 'N/A'}</td>
   </tr> ))}
    </tbody>
     </table>
     </div> ); 
     });
const Pagination = memo(({ currentPage, totalPages, onPageChange }) => { if (totalPages <= 1) { return null; } return ( <nav className="pagination"> <button className="pagination-arrow" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>{'<< Previous'}</button> <span className="pagination-info">Page {currentPage} of {totalPages}</span> <button className="pagination-arrow" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>{'Next >>'}</button> </nav> ); });
const formatBoolean = (value) => value === true ? 'Yes' : (value === false ? 'No' : 'N/A');
const DetailItem = memo(({ label, value, isBoolean = false }) => (<div className="detail-view-group"><label>{label}</label><span>{isBoolean ? formatBoolean(value) : (value !== null && value !== undefined ? String(value) : 'N/A')}</span></div>));
const LogDetailsPanel = memo(({ event, onClose, onViewRecordingDetails }) => { if (!event) return null; return ( <aside className="details-panel"> <div className="details-panel-header"><h2>Log Details: {event.MLUniqueID}</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div> <div className="details-panel-body"> <DetailItem label="ML Unique ID" value={event.MLUniqueID} /> <div className="detail-view-group"> <label>Digital Recording Code</label> {event.fkDigitalRecordingCode ? ( <button className="link-button" onClick={() => onViewRecordingDetails(event.fkDigitalRecordingCode)}> {event.fkDigitalRecordingCode} <FaChevronRight size="1.2em" style={{ marginLeft: '190px', opacity: 0.7 }}/> </button> ) : ( <span>N/A</span> )} </div>
 <DetailItem label="Footage Serial No" value={event.FootageSrNo} /> 
 <DetailItem label="Log Serial No" value={event.LogSerialNo} /> 
 <DetailItem label="Content From" value={event.ContentFrom || 'N/A'} />
  <DetailItem label="Content To" value={event.ContentTo || 'N/A'} />
   <DetailItem label="Time of Day" value={event.TimeOfDay || 'N/A'} /> 
   <DetailItem label="Occasion" value={event.fkOccasion || 'N/A'} />
    <DetailItem label="Editing Status" value={event.EditingStatus || 'N/A'} />
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
             <DetailItem label="Is Audio Recorded" value={formatBoolean(event.IsAudioRecorded)} />
              <DetailItem label="Audio MP3 Distribution" value={event.AudioMP3Distribution || 'N/A'} /> 
              <DetailItem label="Audio WAV Distribution" value={event.AudioWAVDistribution || 'N/A'} /> 
              <DetailItem label="Audio MP3 DR Code" value={event.AudioMp3DRCode || 'N/A'} />
               <DetailItem label="Audio WAV DR Code" value={event.AudioWAVDRCode || 'N/A'} /> 
               <DetailItem label="Full WAV DR Code" value={event.FullWAVDRCode || 'N/A'} /> 
               <DetailItem label="Remarks" value={event.Remarks || 'N/A'} /> 
               <DetailItem label="Is Start Page" value={formatBoolean(event.IsStartPage)} /> 
               <DetailItem label="End Page" value={event.EndPage || 'N/A'} /> 
               <DetailItem label="Is Informal" value={formatBoolean(event.IsInformal)} /> 
               <DetailItem label="Is PPG Not Present" value={formatBoolean(event.IsPPGNotPresent)} />
                <DetailItem label="Guidance" value={event.Guidance || 'N/A'} />
                 <DetailItem label="Disk Master Duration" value={event.DiskMasterDuration || 'N/A'} />
                  <DetailItem label="Event Ref Remarks Counters" value={event.EventRefRemarksCounters || 'N/A'} />
                   <DetailItem label="Event Ref MLID" value={event.EventRefMLID || 'N/A'} />
                    <DetailItem label="Event Ref MLID 2" value={event.EventRefMLID2 || 'N/A'} />
                     <DetailItem label="Dubbed Language" value={event.DubbedLanguage || 'N/A'} /> 
                     <DetailItem label="Dubbing Artist" value={event.DubbingArtist || 'N/A'} />
                      <DetailItem label="Has Subtitle" value={formatBoolean(event.HasSubtitle)} /> 
                      <DetailItem label="Subtitles Language" value={event.SubTitlesLanguage || 'N/A'} />
                       <DetailItem label="Editing Dept Remarks" value={event.EditingDeptRemarks || 'N/A'} />
                        <DetailItem label="Editing Type" value={event.EditingType || 'N/A'} /> 
                        <DetailItem label="Bhajan Type" value={event.BhajanType || 'N/A'} />
                         <DetailItem label="Is Dubbed" value={formatBoolean(event.IsDubbed)} />
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
                                </aside> ); });
const RecordingDetailsPanel = memo(({ event, onClose, isLoading, isError, error, onViewEventDetails }) => { if (isLoading) { return ( <aside className="details-panel"><div className="details-panel-header"><h2>Loading Recording...</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div><div className="details-panel-body"><div className="loader"></div></div></aside> ); } if (isError) { return ( <aside className="details-panel"><div className="details-panel-header"><h2>Error</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div><div className="details-panel-body"><div className="error-message">{error?.message}</div></div></aside> ); } if (!event) { return ( <aside className="details-panel"><div className="details-panel-header"><h2>Not Found</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div><div className="details-panel-body"><div className="error-message">Details for this recording could not be found.</div></div></aside> ); } return ( <aside className="details-panel"> <div className="details-panel-header"><h2>Recording Details: {event.RecordingCode}</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div> <div className="details-panel-body"> <div className="detail-view-group"> <label>Event Code</label> {event.fkEventCode ? (<button className="link-button" onClick={() => onViewEventDetails(event.fkEventCode)}> {event.fkEventCode} <FaChevronRight size="1.2em" style={{ marginLeft: '190px', opacity: 0.7 }}/> </button>) : (<span>N/A</span>)} </div> 
<DetailItem label="Recording Name" value={event.RecordingName} /> 
<DetailItem label="Recording Code" value={event.RecordingCode} /> 
<DetailItem label="No. of Files" value={event.NoOfFiles} />
 <DetailItem label="In Disc Master" value={event.InDiscMaster} />
  <DetailItem label="Digital Master Category" value={event.fkDigitalMasterCategory} /> 
  <DetailItem label="Media Name" value={event.fkMediaName} /> 
  <DetailItem label="Editing Status" value={event.EditingStatus} /> 
  <DetailItem label="QC Status" value={event.Qcstatus} />
   <DetailItem label="Preservation Status" value={event.PreservationStatus} /> 
   <DetailItem label="Submitted Date" value={event.SubmittedDate} /> 
   <DetailItem label="Last Modified" value={event.LastModifiedTimestamp} /> </div> </aside> ); });
const EventDetailsPanel = memo(({ event, onClose, isLoading, isError, error }) => { if (isLoading) { return ( <aside className="details-panel"><div className="details-panel-header"><h2>Loading Event...</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div><div className="details-panel-body"><div className="loader"></div></div></aside> ); } if (isError) { return ( <aside className="details-panel"><div className="details-panel-header"><h2>Error</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div><div className="details-panel-body"><div className="error-message">{error?.message}</div></div></aside> ); } if (!event) { return ( <aside className="details-panel"><div className="details-panel-header"><h2>Not Found</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div><div className="details-panel-body"><div className="error-message">Details for this event could not be found.</div></div></aside> ); } return ( <aside className="details-panel"> <div className="details-panel-header"><h2>Event Details: {event.EventCode}</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div> <div className="details-panel-body"> 
<DetailItem label="Event ID" value={event.EventID} />
<DetailItem label="Event Code" value={event.EventCode} />
<DetailItem label="Year" value={event.Yr} />
<DetailItem label="Event Name" value={event.EventName} />
<DetailItem label="Event Category" value={event.fkEventCategory} />
<DetailItem label="Is Sub Event" value={event.IsSubEvent1} isBoolean={true} />
<DetailItem label="Is Audio Recorded" value={event.IsAudioRecorded} isBoolean={true} />
<DetailItem label="Pravachan Count" value={event.PravachanCount} />
<DetailItem label="Last Modified By" value={event.LastModifiedBy} />

</div> </aside> ); });
const fetchNewMediaLog = async () => { const res = await fetch('http://localhost:5000/api/newmedialog'); if (!res.ok) { throw new Error('Failed to fetch media logs'); } return res.json(); };
const fetchDigitalRecordingDetails = async (recordingCode) => { const res = await fetch(`http://localhost:5000/api/digitalrecording/${recordingCode}`); if (!res.ok) { const errorData = await res.json().catch(() => ({})); throw new Error(errorData.message || `Recording with code ${recordingCode} not found.`); } return res.json(); };
const fetchEventDetails = async (eventCode) => { const res = await fetch(`http://localhost:5000/api/events/${eventCode}`); if (!res.ok) { const errorData = await res.json().catch(() => ({})); throw new Error(errorData.message || `Event with code ${eventCode} not found.`); } return res.json(); };

// --- MAIN COMPONENT ---
function Newmedialog() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewTitle, setViewTitle] = useState("New Media Log");
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 50;
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedRecordingCodeForDetails, setSelectedRecordingCodeForDetails] = useState(null);
  const [selectedEventCodeForDetails, setSelectedEventCodeForDetails] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const initialFilterState = useCallback(() => ( Object.fromEntries(filterFields.map(field => { if (field.type === 'range') return [field.key, { min: '', max: '' }]; if (field.type === 'checkbox') return [field.key, []]; return [field.key, '']; })) ), []);
  const [filters, setFilters] = useState(initialFilterState());
  const [isAssistantOpen, setIsAssistantOpen] = useState(false); // Assistant state

  const { data: events = [], isLoading, error } = useQuery({ queryKey: ['newMediaLog'], queryFn: fetchNewMediaLog });
  const { data: recordingDetails, isLoading: isRecordingDetailsLoading, isError: isRecordingDetailsError, error: recordingDetailsError, } = useQuery({ queryKey: ['digitalRecordingDetails', selectedRecordingCodeForDetails], queryFn: () => fetchDigitalRecordingDetails(selectedRecordingCodeForDetails), enabled: !!selectedRecordingCodeForDetails, });
  const { data: eventDetails, isLoading: isEventDetailsLoading, isError: isEventDetailsError, error: eventDetailsError, } = useQuery({ queryKey: ['eventDetails', selectedEventCodeForDetails], queryFn: () => fetchEventDetails(selectedEventCodeForDetails), enabled: !!selectedEventCodeForDetails, });

  const handleSelectEvent = useCallback((event) => { setSelectedEventCodeForDetails(null); setSelectedRecordingCodeForDetails(null); setSelectedEvent(event); setIsAssistantOpen(false); }, []);
  const handleCloseDetails = useCallback(() => setSelectedEvent(null), []);
  const handleViewRecordingDetails = useCallback((recordingCode) => { setSelectedEventCodeForDetails(null); setSelectedRecordingCodeForDetails(recordingCode); }, []);
  const handleCloseRecordingDetails = useCallback(() => setSelectedRecordingCodeForDetails(null), []);
  const handleViewEventDetails = useCallback((eventCode) => { setSelectedEventCodeForDetails(eventCode); }, []);
  const handleCloseEventDetails = useCallback(() => setSelectedEventCodeForDetails(null), []);
  const handleMenuClick = useCallback(() => setMenuOpen(prev => !prev), []);
  const handleCloseSidebar = useCallback(() => setMenuOpen(false), []);
  const handleSearchChange = useCallback((event) => { setSearchQuery(event.target.value); setCurrentPage(1); }, []);
  const handleOpenFilter = useCallback(() => setIsFilterOpen(true), []);
  const handleCloseFilter = useCallback(() => { setIsFilterOpen(false); setActiveFilter(null); }, []);
  const handleFilterChange = useCallback((e) => { const { name, value, checked } = e.target; const filterType = e.target.dataset.filterType; const rangePart = e.target.dataset.rangePart; setFilters(prev => { if (filterType === 'checkbox') { const currentValues = prev[name] || []; if (checked) { return { ...prev, [name]: [...currentValues, value] }; } else { return { ...prev, [name]: currentValues.filter(v => v !== value) }; } } if (rangePart) { return { ...prev, [name]: { ...prev[name], [rangePart]: value } }; } return { ...prev, [name]: value }; }); }, []);
  const handleApplyFilters = useCallback(() => { setCurrentPage(1); setIsFilterOpen(false); setActiveFilter(null); }, []);
  const handleClearSidebarFilters = useCallback(() => { setFilters(initialFilterState()); setActiveFilter(null); setCurrentPage(1); }, [initialFilterState]);
  const handleSelectFilter = useCallback((filterKey) => setActiveFilter(filterKey), []);
  const handleGoBack = useCallback(() => setActiveFilter(null), []);
  const handleRemoveFilter = useCallback((filterKey) => { if (filterKey === 'searchQuery') { setSearchQuery(''); } else { setFilters(prev => ({ ...prev, [filterKey]: initialFilterState()[filterKey] })); } setCurrentPage(1); }, [initialFilterState]);
  const handleClearAll = useCallback(() => { setSearchQuery(''); setFilters(initialFilterState()); setCurrentPage(1); }, [initialFilterState]);
  const handleOpenAssistant = useCallback(() => { setSelectedEvent(null); setSelectedRecordingCodeForDetails(null); setSelectedEventCodeForDetails(null); setIsAssistantOpen(true); }, []);
  const handleCloseAssistant = useCallback(() => setIsAssistantOpen(false), []);
  const handleApplyParsedFilters = useCallback(({ filters: newFilters, searchQuery: newSearchQuery }) => { setFilters(prev => ({ ...initialFilterState(), ...newFilters })); setSearchQuery(newSearchQuery || ''); setCurrentPage(1); }, [initialFilterState]);

  const filteredEvents = React.useMemo(() => { const query = searchQuery.toLowerCase(); let results = events; if (query) { results = results.filter((event) => { const mlUniqueID = event.MLUniqueID ? String(event.MLUniqueID).toLowerCase() : ''; const topic = event.Topic ? String(event.Topic).toLowerCase() : ''; const speaker = event.SpeakerSinger ? String(event.SpeakerSinger).toLowerCase() : ''; return mlUniqueID.includes(query) || topic.includes(query) || speaker.includes(query); }); } const checkString = (field, filterValue) => !filterValue || (String(field) || '').toLowerCase().includes(filterValue.toLowerCase()); const checkRange = (value, range) => { if (!range || (range.min === '' && range.max === '')) return true; const numValue = parseInt(value, 10); if (isNaN(numValue)) return false; const min = range.min !== '' ? parseInt(range.min, 10) : -Infinity; const max = range.max !== '' ? parseInt(range.max, 10) : Infinity; return (isNaN(min) || numValue >= min) && (isNaN(max) || numValue <= max); }; const checkCheckbox = (fieldValue, filterValues) => { if (!filterValues || filterValues.length === 0) return true; if (filterValues.includes('__EMPTY__') && (fieldValue === null || fieldValue === '')) return true; return filterValues.includes(fieldValue); }; results = results.filter(event => { return Object.keys(filters).every(key => { const fieldDef = filterFields.find(f => f.key === key); if (!fieldDef) return true; const filterValue = filters[key]; const eventValue = event[key]; switch (fieldDef.type) { case 'range': return checkRange(eventValue, filterValue); case 'checkbox': return checkCheckbox(eventValue, filterValue); default: return checkString(eventValue, filterValue); } }); }); return results; }, [events, searchQuery, filters]);
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
  const currentEvents = filteredEvents.slice((currentPage - 1) * eventsPerPage, currentPage * eventsPerPage);

  const handleExport = useCallback(() => { if (filteredEvents.length === 0) { alert("No data to export."); return; } const headers = Object.keys(filteredEvents[0]); const csvHeader = headers.join(','); const csvRows = filteredEvents.map(event => headers.map(header => { const value = event[header]; const strValue = String(value === null || value === undefined ? '' : value); if (strValue.includes(',') || strValue.includes('"')) { return `"${strValue.replace(/"/g, '""')}"`; } return strValue; }).join(',')); const csvContent = [csvHeader, ...csvRows].join('\n'); const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); const url = URL.createObjectURL(blob); link.setAttribute('href', url); link.setAttribute('download', 'media_log_export.csv'); document.body.appendChild(link); link.click(); document.body.removeChild(link); }, [filteredEvents]);

  const isDetailsPanelVisible = selectedEvent || selectedRecordingCodeForDetails || selectedEventCodeForDetails;
  const contentAreaClasses = [ 'content-area', isDetailsPanelVisible ? 'details-visible' : '', isAssistantOpen ? 'assistant-visible' : '' ].join(' ').trim();

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
                <EventsTable events={currentEvents} onViewDetails={handleSelectEvent} selectedEventId={selectedEvent?.MLUniqueID} />
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

          {selectedEventCodeForDetails ? (
            <EventDetailsPanel event={eventDetails} onClose={handleCloseEventDetails} isLoading={isEventDetailsLoading} isError={isEventDetailsError} error={eventDetailsError} />
          ) : selectedRecordingCodeForDetails ? (
            <RecordingDetailsPanel event={recordingDetails} onClose={handleCloseRecordingDetails} isLoading={isRecordingDetailsLoading} isError={isRecordingDetailsError} error={recordingDetailsError} onViewEventDetails={handleViewEventDetails} />
          ) : selectedEvent ? (
            <LogDetailsPanel event={selectedEvent} onClose={handleCloseDetails} onViewRecordingDetails={handleViewRecordingDetails} />
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default Newmedialog;