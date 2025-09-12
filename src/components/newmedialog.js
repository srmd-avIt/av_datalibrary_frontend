import React, { useState, useCallback, memo, useEffect } from 'react';
import './users.css';
import './link-button.css';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// Import all necessary icons
import {
  FaListAlt, FaFolderOpen, FaVideo, FaTable, FaTag, FaMicrophone,
  FaInfoCircle, FaCommentDots, FaShareAlt, FaTimes, FaBars,
  FaSearch, FaFilter, FaFileExport,
  FaChevronRight, FaArrowLeft, FaStream, FaChartBar, FaHome, FaUser,
  FaChevronDown,FaBookOpen,FaClipboardList,FaPray // Added for the collapsible menu
} from 'react-icons/fa';

// Import the self-contained Assistant component
import AssistantPanel from './AssistantPanel';

// --- HELPER OBJECT for displaying view names ---
const viewDisplayNames = {
  'all-except-satsang': 'All Except Satsang',
  'satsang-category': 'Satsang Category',
  'satsang-extracted-clips': 'Satsang Extracted Clips',
};

// --- SUB-COMPONENTS ---

const SidebarItem = memo(({ icon, text, onClick, active }) => (
  <li
    onClick={onClick}
    className={`flex items-center gap-2 p-2 cursor-pointer rounded-md
      ${active ? "bg-blue-600 text-white" : "hover:bg-gray-200"}`}
  >
    {icon && icon} {/* Conditionally render icon */}
    <span>{text}</span>
  </li>
));

const Sidebar = memo(({ isOpen, onClose, navigate, onOpenAssistant, isAssistantOpen }) => {
    const location = useLocation();

    // State for the collapsible media log menu
    const [isMediaLogMenuOpen, setIsMediaLogMenuOpen] = useState(
      location.pathname.startsWith('/newmedialog')
    );

    // Effect to open the menu when navigating to a media log page
    useEffect(() => {
        if (location.pathname.startsWith('/newmedialog')) {
            setIsMediaLogMenuOpen(true);
        }
    }, [location.pathname]);

    const handleAssistantClick = () => {
        onOpenAssistant();
        onClose();
    };

    const handleMediaLogToggle = (e) => {
        e.stopPropagation();
        setIsMediaLogMenuOpen(prev => !prev);
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
                  <SidebarItem icon={<FaHome />} text="Home" onClick={() => navigate("/")} active={location.pathname === "/"} />
                  <SidebarItem icon={<FaTable />} text="Events" onClick={() => navigate("/events")} active={location.pathname === "/events"} />
                

                  {/* --- COLLAPSIBLE MENU ITEM --- */}
                  <li
                    className={`sidebar-menu-toggle ${isMediaLogMenuOpen ? 'open' : ''} ${location.pathname.startsWith('/newmedialog') ? 'active-parent' : ''}`}
                    onClick={handleMediaLogToggle}
                  >
                    <div className="toggle-content">
                      <FaListAlt />
                      <span>NewMediaLog </span>
                    </div>
                    {isMediaLogMenuOpen ? <FaChevronDown /> : <FaChevronRight />}
                  </li>
                  
                  {/* --- SUB-MENU ITEMS (conditionally rendered) --- */}
               {isMediaLogMenuOpen && (
                    <ul className="sidebar-submenu">
                        <SidebarItem icon={<FaBookOpen />} text="All Media Logs" onClick={() => navigate("/newmedialog")} active={location.pathname === "/newmedialog"} />
                        <SidebarItem icon={<FaClipboardList />} text="All Except Satsang" onClick={() => navigate("/newmedialog/all-except-satsang")} active={location.pathname === "/newmedialog/all-except-satsang"} />
                        <SidebarItem icon={<FaPray />} text="Satsang Category" onClick={() => navigate("/newmedialog/satsang-category")} active={location.pathname === "/newmedialog/satsang-category"} />
                        <SidebarItem icon={<FaVideo />} text="Satsang Extracted Clips" onClick={() => navigate("/newmedialog/satsang-extracted-clips")} active={location.pathname === "/newmedialog/satsang-extracted-clips"} />
                    </ul>
                  )}

                 
                  <SidebarItem icon={<FaFolderOpen />} text="Digital Recording" onClick={() => navigate("/digitalrecording")} active={location.pathname === "/digitalrecording"} />
                  <SidebarItem icon={<FaChartBar />} text="AuxFiles" onClick={() => navigate("/auxfiles")} active={location.pathname === "/auxfiles"} />
                  <SidebarItem icon={<FaTable />} text="All Data View - Formal - Informal" />
                  <SidebarItem icon={<FaStream />} text="Timeline" onClick={() => navigate("/timeline")} active={location.pathname === "/timeline"} />
                  <li className="sidebar-divider"></li>
                  <SidebarItem icon={<FaMicrophone />} text="Assistant" onClick={handleAssistantClick} active={isAssistantOpen} />
                  <SidebarItem icon={<FaInfoCircle />} text="About" onClick={() => alert("App version 1.0.0\nCreated by Gaurav.")} active={false} />
                  <SidebarItem icon={<FaCommentDots />} text="Feedback" onClick={() => alert("Send your feedback to feedback@example.com")} active={false} />
                  <SidebarItem icon={<FaShareAlt />} text="Share" onClick={() => alert("Share this app: https://yourapp.com")} active={false} />
                </ul>

                <div className="sidebar-profile" style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', padding: '1rem', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)' }}>
                    <div style={{width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#4a4f58', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaUser /></div>
                    <div>
                      <span style={{ fontWeight: 600 }}>Admin User</span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Settings / Logout</div>
                    </div>
                  </div>
                </div>
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

const filterFields = [ {key: 'MLUniqueID', label: 'ML Unique ID', type: 'text'}, { key: 'FootageSrNo', label: 'Footage Serial No', type: 'text' }, { key: 'LogSerialNo', label: 'Log Serial No', type: 'range' }, { key: 'fkDigitalRecordingCode', label: 'Digital Recording Code', type: 'text' }, { key: 'ContentFrom', label: 'Content From', type: 'text' }, { key: 'ContentTo', label: 'Content To', type: 'text' }, { key: 'TimeOfDay', label: 'Time of Day', type: 'checkbox', options: [ { label: '(Empty)', value: '__EMPTY__' }, { label: 'Morning', value: 'Morn' }, { label: 'Afternoon', value: 'Aft' }, { label: 'Evening', value: 'Eve' }, { label: 'Night', value: 'Night' }, ] }, { key: 'Language', label: 'Language', type: 'checkbox', options: [ { label: '(Empty)', value: '__EMPTY__' }, { label: 'Gujarati', value: 'Gujarati' }, { label: 'Hindi', value: 'Hindi' }, { label: 'Eng-Guj', value: 'Eng-Guj' }, { label: 'English', value: 'English' }, { label: 'Other', value: 'Other' }, { label: 'Guj-Hin', value: 'Guj-Hin' }, { label: 'Eng-Hin', value: 'Eng-Hin' }, { label: 'Marathi', value: 'Marathi' }, { label: 'Kannada', value: 'Kannada' }, { label: 'Bengali', value: 'Bengali' }, { label: 'Spanish', value: 'Spanish' }, { label: 'Tamil', value: 'Tamil' }, { label: 'Sanskrit', value: 'Sanskrit' }, { label: 'French', value: 'French' }, { label: 'S', value: 'S' }, ] }, { key: 'fkOccasion', label: 'Occasion', type: 'text' }, { key: 'EditingStatus', label: 'Editing Status', type: 'text' }, { key: 'FootageType', label: 'Footage Type', type: 'text'}, { key: 'VideoDistribution', label: 'Video Distribution', type: 'text' }, { key: 'Detail', label: 'Detail', type: 'text' }, { key: 'SubDetail', label: 'Sub Detail', type: 'text' }, { key: 'CounterFrom', label: 'Counter From', type: 'number' }, { key: 'CounterTo', label: 'Counter To', type: 'number' }, { key: 'SubDuration', label: 'Sub Duration (mins)', type: 'number' }, { key: 'TotalDuration', label: 'Total Duration (mins)', type: 'number' }, { key: 'SpeakerSinger', label: 'Speaker/Singer', type: 'text' }, { key: 'fkOrganization', label: 'Organization', type: 'text' }, { key: 'Designation', label: 'Designation', type: 'text' }, { key: 'fkCountry', label: 'Country', type: 'text' }, { key:'fkState' ,label:'State' ,type:'text' }, { key: 'fkCity', label: 'City', type: 'text' }, { key: 'Venue', label: 'Venue', type: 'text' }, { key: 'fkGranth', label: 'Granth', type: 'text' }, { key: 'Number', label: 'Number', type: 'text' }, { key: 'Topic', label: 'Topic', type: 'text' }, { key: 'SeriesName', label: 'Series Name', type: 'text' }, { key: 'SatsangStart', label: 'Satsang Start Time', type: 'text' }, { key:'SatsangEnd' ,label:'Satsang End Time' ,type:'text' }, { key:'IsAudioRecorded' ,label:'Is Audio Recorded?' ,type:'text' }, { key:'AudioMP3Distribution' ,label:'Audio MP3 Distribution' ,type:'text' }, { key:'AudioWAVDistribution' ,label:'Audio WAV Distribution' ,type:'text' }, { key:'AudioMp3DRCode' ,label:'Audio MP3 DR Code' ,type:'text' }, { key:'AudioWAVDRCode' ,label:'Audio WAV DR Code' ,type:'text' }, { key:'FullWAVDRCode' ,label:'Full WAV DR Code' ,type:'text' }, { key:'Remarks' ,label:'Remarks' ,type:'text' ,placeholder:''}, { key:'IsStartPage' ,label:'Is Start Page?' ,type:'text' }, { key:'EndPage' ,label:'End Page Number' ,type:'number' }, { key:'IsInformal' ,label:'Is Informal?' ,type:'text' }, { key:'IsPPGNotPresent' ,label:'Is PPG Not Present?' ,type:'text'}, { key: 'Guidance', label: 'Guidance', type: 'text', placeholder: '' }, { key: 'DiskMasterDuration', label: 'Disk Master Duration', type: 'text' }, { key: 'EventRefRemarksCounters', label: 'Event Ref Remarks Counters', type: 'text' }, { key: 'EventRefMLID', label: 'Event Ref MLID', type: 'text' }, { key: 'EventRefMLID2', label: 'Event Ref MLID 2', type: 'text' }, { key: 'DubbedLanguage', label: 'Dubbed Language', type: 'text' }, { key: 'DubbingArtist', label: 'Dubbing Artist', type: 'text' }, { key:'HasSubtitle' ,label:'Has Subtitle?' ,type:'text' }, { key:'SubTitlesLanguage' ,label:'Subtitles Language' ,type:'text' }, { key:'EditingDeptRemarks' ,label:'Editing Dept Remarks' ,type:'text' }, { key:'EditingType' ,label:'Editing Type' ,type:'text' }, { key:'BhajanType' ,label:'Bhajan Type' ,type:'text' }, { key:'IsDubbed' ,label:'Is Dubbed?' ,type:'checkbox' }, { key:'NumberSource' ,label:'Number Source' ,type:'text' }, { key:'TopicSource' ,label:'Topic Source' ,type:'text' }, { key:'LastModifiedTimestamp' ,label:'Last Modified Timestamp' ,type:'text'}, { key:'LastModifiedBy' ,label:'Last Modified By' ,type:'text' }, { key:'Synopsis' ,label:'Synopsis' ,type:'text' ,placeholder:''}, { key:'LocationWithinAshram' ,label:'Location Within Ashram' ,type:'text' }, { key:'Keywords' ,label:'Keywords' ,type:'text' }, { key:'Grading' ,label:'Grading (1-5)' ,type:'number', placeholder:''}, { key: 'Segment Category', label: 'Segment Category', type: 'checkbox', options: [ { label: '(Empty)', value: '__EMPTY__' }, { label: 'Pravachan', value: 'Pravachan' }, { label: 'Bhakti', value: 'Bhakti' }, { label: 'Other Edited Videos', value: 'Other Edited Videos' }, { label: 'Highlights', value: 'Highlights' }, { label: 'Documentary', value: 'Documentary' }, { label: 'Satsang Clips', value: 'Satsang Clips' }, { label: 'Highlights-Mixed', value: 'Highlights-Mixed' }, { label: 'PEP-Post Event Promo', value: 'PEP-Post Event Promo' }, { label: 'Celebrations', value: 'Celebrations' }, { label: 'SU-Revision', value: 'SU-Revision' }, { label: 'Other Clips', value: 'Other Clips' }, { label: 'Celebrations:Heartfelt Experience', value: 'Celebrations:Heartfelt Experience' }, { label: 'Prasangik Udbodhan', value: 'Prasangik Udbodhan' }, { label: 'Padhramani', value: 'Padhramani' }, { label: 'Non-SRMD-Shibirs/Session/Trainig/Workshop', value: 'Non-SRMD-Shibirs/Session/Trainig/Workshop' }, { label: 'SRMD-Shibirs/Session/Trainig/Workshop', value: 'SRMD-Shibirs/Session/Trainig/Workshop' }, { label: 'Celebrations:Drama/Skit', value: 'Celebrations:Drama/Skit' }, { label: 'Drama/Skit', value: 'Drama/Skit' }, { label: 'Meditation', value: 'Meditation' }, { label: 'Highlights-Informal', value: 'Highlights-Informal' }, { label: 'SU-Extracted', value: 'SU-Extracted' }, { label: 'Satsang', value: 'Satsang' }, { label: 'SU-GM', value: 'SU-GM' }, { label: 'Product/Webseries', value: 'Product/Webseries' }, { label: 'Promo', value: 'Promo' }, { label: 'Pujan', value: 'Pujan' }, { label: 'SU', value: 'SU' }, { label: 'Pratishtha', value: 'Pratishtha' }, { label: 'Heartfelt Experiences', value: 'Heartfelt Experiences' }, { label: 'SU:SRMD-Shibir/Session/Training/Workshop', value: 'SU:SRMD-Shibir/Session/Training/Workshop' }, { label: 'Prathana', value: 'Prathana' }, { label: 'Celebrations:Bhakti', value: 'Celebrations:Bhakti' }, { label: 'Bhakti:Drama/Skit', value: 'Bhakti:Drama/Skit' }, { label: 'Informal Satsang', value: 'Informal Satsang' }, ] }, { key:'SegmentDuration' ,label:'Segment Duration (mins)' ,type:'number'}, { key:'TopicGivenBy' ,label:'Topic Given By' ,type:'text'} ];

const FilterSidebar = memo(({ isOpen, onClose, filters, onFilterChange, onApply, onClear, activeFilter, onSelectFilter, onGoBack }) => { const [checkboxSearchTerm, setCheckboxSearchTerm] = useState(''); useEffect(() => { if (activeFilter) { setCheckboxSearchTerm(''); } }, [activeFilter]); const renderFieldList = () => ( <ul className="filter-field-list"> {filterFields.map(field => ( <li key={field.key} onClick={() => onSelectFilter(field.key)}> <div className="filter-field-label"><span>{field.label}</span></div> <FaChevronRight /> </li> ))} </ul> ); const renderValueInput = () => { const field = filterFields.find(f => f.key === activeFilter); if (!field) return null; const renderContent = () => { if (field.type === 'range') { return ( <div className="filter-group filter-range-group"> <label htmlFor={`filter-input-${field.key}-min`}>Minimum</label> <input type="number" id={`filter-input-${field.key}-min`} name={field.key} data-range-part="min" value={filters[field.key]?.min || ''} onChange={onFilterChange} autoFocus /> <label htmlFor={`filter-input-${field.key}-max`}>Maximum</label> <input type="number" id={`filter-input-${field.key}-max`} name={field.key} data-range-part="max" value={filters[field.key]?.max || ''} onChange={onFilterChange} /> </div> ); } if (field.type === 'checkbox') { const filteredOptions = field.options.filter(option => option.label.toLowerCase().includes(checkboxSearchTerm.toLowerCase())); return ( <div className="filter-group filter-checkbox-group"> <input type="text" className="checkbox-search-input" placeholder={`Search ${field.label}...`} value={checkboxSearchTerm} onChange={(e) => setCheckboxSearchTerm(e.target.value)} autoFocus /> <div className="checkbox-list-container"> {filteredOptions.map(option => ( <div key={option.value} className="checkbox-item"> <input type="checkbox" id={`filter-checkbox-${field.key}-${option.value}`} name={field.key} value={option.value} checked={(filters[field.key] || []).includes(option.value)} onChange={onFilterChange} data-filter-type="checkbox" /> <label htmlFor={`filter-checkbox-${field.key}-${option.value}`}>{option.label}</label> </div> ))} </div> </div> ); } return ( <div className="filter-group"> <label htmlFor={`filter-input-${field.key}`}>{field.label}</label> <input type={field.type} id={`filter-input-${field.key}`} name={field.key} value={filters[field.key] || ''} onChange={onFilterChange} autoFocus /> </div> ); }; return ( <div className="filter-value-view"> <button onClick={onGoBack} className="filter-back-button"><FaArrowLeft /><span>All Filters</span></button> {renderContent()} </div> ); }; const headerTitle = activeFilter ? filterFields.find(f => f.key === activeFilter)?.label || 'Filter' : 'Filters'; return ( <> <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={onClose}></div> <aside className={`filter-sidebar ${isOpen ? 'open' : ''}`}> <div className="filter-sidebar-header"> <li className="filter-close-list-item" onClick={onClose}><FaArrowLeft /></li> <h3>{headerTitle}</h3> <button onClick={onClose} className="close-sidebar-btn" title="Dismiss"><FaTimes /></button> </div> <div className="filter-sidebar-body">{activeFilter ? renderValueInput() : renderFieldList()}</div> <div className="filter-sidebar-footer"> <button className="btn-secondary" onClick={onClear}>Clear All</button> <button className="btn-primary" onClick={onApply}>Apply Filters</button> </div> </aside> </> ); });

const ActiveFiltersDisplay = memo(({ filters, searchQuery, onRemoveFilter, onClearAll, activeView }) => {
  const activeFiltersList = [];

  const viewName = viewDisplayNames[activeView];
  if (viewName) {
    activeFiltersList.push({ key: 'view', label: 'View', value: viewName, isView: true });
  }

  if (searchQuery) { activeFiltersList.push({ key: 'searchQuery', label: 'Search', value: `"${searchQuery}"` }); }
  
  Object.keys(filters).forEach(key => {
    const value = filters[key]; const field = filterFields.find(f => f.key === key); if (!field) return;
    if (field.type === 'range') { if ((value.min) || (value.max)) { let displayValue = ''; if (value.min && value.max) displayValue = `${value.min} - ${value.max}`; else if (value.min) displayValue = `≥ ${value.min}`; else if (value.max) displayValue = `≤ ${value.max}`; activeFiltersList.push({ key, label: field.label, value: displayValue }); } }
    else if (field.type === 'checkbox') { if (Array.isArray(value) && value.length > 0) { const displayValue = value.map(val => { const option = field.options.find(opt => opt.value === val); return option ? option.label : val; }).join(', '); activeFiltersList.push({ key, label: field.label, value: displayValue }); } }
    else if (value) { activeFiltersList.push({ key, label: field.label, value }); }
  });
  
  if (activeFiltersList.length === 0) return null;
  return (
    <div className="active-filters-container">
      <div className="active-filters-list">
        {activeFiltersList.map(filter => (
          <div key={filter.key} className={`filter-chip ${filter.isView ? 'view-chip' : ''}`}>
            <span><strong>{filter.label}:</strong> {filter.value}</span>
            {!filter.isView && (
              <button onClick={() => onRemoveFilter(filter.key)} title={`Remove ${filter.label} filter`}><FaTimes /></button>
            )}
          </div>
        ))}
      </div>
      <button onClick={onClearAll} className="clear-all-filters-btn">Clear All</button>
    </div>
  );
});

const Pagination = memo(({ currentPage, totalPages, onPageChange }) => { if (totalPages <= 1) { return null; } return ( <nav className="pagination"> <button className="pagination-arrow" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>{'<< Previous'}</button> <span className="pagination-info">Page {currentPage} of {totalPages}</span> <button className="pagination-arrow" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>{'Next >>'}</button> </nav> ); });
const DetailItem = memo(({ label, value, isBoolean = false }) => (<div className="detail-view-group"><label>{label}</label><span>{isBoolean ? formatBoolean(value) : (value !== null && value !== undefined ? String(value) : 'N/A')}</span></div>));
const LogDetailsPanel = memo(({ event, onClose, onViewRecordingDetails }) => { if (!event) return null; return ( <aside className="details-panel"> <div className="details-panel-header"><h2>Log Details: {event.MLUniqueID}</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div> <div className="details-panel-body"> <DetailItem label="ML Unique ID" value={event.MLUniqueID} /> <div className="detail-view-group"> <label>Digital Recording Code</label> {event.fkDigitalRecordingCode ? ( <button className="link-button" onClick={() => onViewRecordingDetails(event.fkDigitalRecordingCode)}> {event.fkDigitalRecordingCode} <FaChevronRight size="1.2em" style={{ marginLeft: '190px', opacity: 0.7 }}/> </button> ) : ( <span>N/A</span> )} </div> <DetailItem label="Footage Serial No" value={event.FootageSrNo} /> <DetailItem label="Log Serial No" value={event.LogSerialNo} /> <DetailItem label="Content From" value={event.ContentFrom || 'N/A'} /> <DetailItem label="Content To" value={event.ContentTo || 'N/A'} /> <DetailItem label="Time of Day" value={event.TimeOfDay || 'N/A'} /> <DetailItem label="Occasion" value={event.fkOccasion || 'N/A'} /> <DetailItem label="Editing Status" value={event.EditingStatus || 'N/A'} /> <DetailItem label="Footage Type" value={event.FootageType || 'N/A'} /> <DetailItem label="Video Distribution" value={event.VideoDistribution || 'N/A'} /> <DetailItem label="Detail" value={event.Detail || 'N/A'} /> <DetailItem label="Sub Detail" value={event.SubDetail || 'N/A'} /> <DetailItem label="Counter From" value={event.CounterFrom || 'N/A'} /> <DetailItem label="Counter To" value={event.CounterTo || 'N/A'} /> <DetailItem label="Sub Duration" value={event.SubDuration || 'N/A'} /> <DetailItem label="Total Duration" value={event.TotalDuration || 'N/A'} /> <DetailItem label="Language" value={event.Language || 'N/A'} /> <DetailItem label="Speaker/Singer" value={event.SpeakerSinger || 'N/A'} /> <DetailItem label="Organization" value={event.fkOrganization || 'N/A'} /> <DetailItem label="Designation" value={event.Designation || 'N/A'} /> <DetailItem label="Country" value={event.fkCountry || 'N/A'} /> <DetailItem label="State" value={event.fkState || 'N/A'} /> <DetailItem label="City" value={event.fkCity || 'N/A'} /> <DetailItem label="Venue" value={event.Venue || 'N/A'} /> <DetailItem label="Granth" value={event.fkGranth || 'N/A'} /> <DetailItem label="Number" value={event.Number || 'N/A'} /> <DetailItem label="Topic" value={event.Topic || 'N/A'} /> <DetailItem label="Series Name" value={event.SeriesName || 'N/A'} /> <DetailItem label="Satsang Start" value={event.SatsangStart|| 'N/A'} /> <DetailItem label="Satsang End" value={event.SatsangEnd || 'N/A'} /> <DetailItem label="Is Audio Recorded" value={formatBoolean(event.IsAudioRecorded)} /> <DetailItem label="Audio MP3 Distribution" value={event.AudioMP3Distribution || 'N/A'} /> <DetailItem label="Audio WAV Distribution" value={event.AudioWAVDistribution || 'N/A'} /> <DetailItem label="Audio MP3 DR Code" value={event.AudioMp3DRCode || 'N/A'} /> <DetailItem label="Audio WAV DR Code" value={event.AudioWAVDRCode || 'N/A'} /> <DetailItem label="Full WAV DR Code" value={event.FullWAVDRCode || 'N/A'} /> <DetailItem label="Remarks" value={event.Remarks || 'N/A'} /> <DetailItem label="Is Start Page" value={formatBoolean(event.IsStartPage)} /> <DetailItem label="End Page" value={event.EndPage || 'N/A'} /> <DetailItem label="Is Informal" value={formatBoolean(event.IsInformal)} /> <DetailItem label="Is PPG Not Present" value={formatBoolean(event.IsPPGNotPresent)} /> <DetailItem label="Guidance" value={event.Guidance || 'N/A'} /> <DetailItem label="Disk Master Duration" value={event.DiskMasterDuration || 'N/A'} /> <DetailItem label="Event Ref Remarks Counters" value={event.EventRefRemarksCounters || 'N/A'} /> <DetailItem label="Event Ref MLID" value={event.EventRefMLID || 'N/A'} /> <DetailItem label="Event Ref MLID 2" value={event.EventRefMLID2 || 'N/A'} /> <DetailItem label="Dubbed Language" value={event.DubbedLanguage || 'N/A'} /> <DetailItem label="Dubbing Artist" value={event.DubbingArtist || 'N/A'} /> <DetailItem label="Has Subtitle" value={formatBoolean(event.HasSubtitle)} /> <DetailItem label="Subtitles Language" value={event.SubTitlesLanguage || 'N/A'} /> <DetailItem label="Editing Dept Remarks" value={event.EditingDeptRemarks || 'N/A'} /> <DetailItem label="Editing Type" value={event.EditingType || 'N/A'} /> <DetailItem label="Bhajan Type" value={event.BhajanType || 'N/A'} /> <DetailItem label="Is Dubbed" value={formatBoolean(event.IsDubbed)} /> <DetailItem label="Number Source" value={event.NumberSource || 'N/A'} /> <DetailItem label="Topic Source" value={event.TopicSource || 'N/A'} /> <DetailItem label="Last Modified Timestamp" value={event.LastModifiedTimestamp || 'N/A'} /> <DetailItem label="Last Modified By" value={event.LastModifiedBy || 'N/A'} /> <DetailItem label="Synopsis" value={event.Synopsis || 'N/A'} /> <DetailItem label="Location Within Ashram" value={event.LocationWithinAshram || 'N/A'} /> <DetailItem label="Keywords" value={event.Keywords || 'N/A'} /> <DetailItem label="Grading" value={event.Grading || 'N/A'} /> <DetailItem label="Segment Category" value={event.SegmentCategory || 'N/A'} /> <DetailItem label="Segment Duration" value={event.SegmentDuration || 'N/A'} /> <DetailItem label="Topic Given By" value={event.TopicGivenBy || 'N/A'} /> </div> </aside> ); });
const RecordingDetailsPanel = memo(({ event, onClose, isLoading, isError, error, onViewEventDetails }) => { if (isLoading) { return ( <aside className="details-panel"><div className="details-panel-header"><h2>Loading Recording...</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div><div className="details-panel-body"><div className="loader"></div></div></aside> ); } if (isError) { return ( <aside className="details-panel"><div className="details-panel-header"><h2>Error</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div><div className="details-panel-body"><div className="error-message">{error?.message}</div></div></aside> ); } if (!event) { return ( <aside className="details-panel"><div className="details-panel-header"><h2>Not Found</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div><div className="details-panel-body"><div className="error-message">Details for this recording could not be found.</div></div></aside> ); } return ( <aside className="details-panel"> <div className="details-panel-header"><h2>Recording Details: {event.RecordingCode}</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div> <div className="details-panel-body"> <div className="detail-view-group"> <label>Event Code</label> {event.fkEventCode ? (<button className="link-button" onClick={() => onViewEventDetails(event.fkEventCode)}> {event.fkEventCode} <FaChevronRight size="1.2em" style={{ marginLeft: '190px', opacity: 0.7 }}/> </button>) : (<span>N/A</span>)} </div> <DetailItem label="Recording Name" value={event.RecordingName} /> <DetailItem label="Recording Code" value={event.RecordingCode} /> <DetailItem label="No. of Files" value={event.NoOfFiles} /> <DetailItem label="fkDigitalMasterCategory" value={event.fkDigitalMasterCategory} /> <DetailItem label="fkMediaName" value={event.fkMediaName} /> <DetailItem label="Bit Rate" value={event.BitRate} /> <DetailItem label="Audio Bitrate" value={event.AudioBitrate} /> <DetailItem label="Filesize" value={event.Filesize} /> <DetailItem label="Duration" value={event.Duration} /> <DetailItem label="Audio Total Duration" value={event.AudioTotalDuration} /> <DetailItem label="Recording Remarks" value={event.RecordingRemarks} /> <DetailItem label="Counter Error" value={event.CounterError} /> <DetailItem label="Reason Error" value={event.ReasonError} /> <DetailItem label="Qc Remarks Checked On" value={event.QcRemarksCheckedOn} /> <DetailItem label="Preservation Status" value={event.PreservationStatus} /> <DetailItem label="Qc Sevak" value={event.QcSevak} /> <DetailItem label="Master Product Title" value={event.MasterProductTitle} /> <DetailItem label="Qc Status" value={event.Qcstatus} /> <DetailItem label="Last Modified Timestamp" value={event.LastModifiedTimestamp} /> <DetailItem label="fkDistributionLabel" value={event.fkDistributionLabel} /> <DetailItem label="Submitted Date" value={event.SubmittedDate} /> <DetailItem label="PresStatGuidDt" value={event.PresStatGuidDt} /> <DetailItem label="Info On Cassette" value={event.InfoOnCassette} /> <DetailItem label="Master quality" value={event.Masterquality} /> <DetailItem label="Is Informal" value={event.IsInformal ? 'Yes' : 'No'} /> <DetailItem label="Filesize In Bytes" value={event.FilesizeInBytes} /> <DetailItem label="Associated DR" value={event.AssociatedDR} /> <DetailItem label="Dimension" value={event.Dimension} /> <DetailItem label="Production Bucket" value={event.ProductionBucket} /> <div className="detail-view-group"> <label>Distribution Drive Link</label> {event.DistributionDriveLink ? (<a href={event.DistributionDriveLink} target="_blank" rel="noopener noreferrer" className="detail-link"> {event.DistributionDriveLink}</a>) : (<span>N/A</span>)}</div> <DetailItem label="Teams" value={event.Teams} /> </div> </aside> ); });
const EventDetailsPanel = memo(({ event, onClose, isLoading, isError, error }) => { if (isLoading) { return ( <aside className="details-panel"><div className="details-panel-header"><h2>Loading Event...</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div><div className="details-panel-body"><div className="loader"></div></div></aside> ); } if (isError) { return ( <aside className="details-panel"><div className="details-panel-header"><h2>Error</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div><div className="details-panel-body"><div className="error-message">{error?.message}</div></div></aside> ); } if (!event) { return ( <aside className="details-panel"><div className="details-panel-header"><h2>Not Found</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div><div className="details-panel-body"><div className="error-message">Details for this event could not be found.</div></div></aside> ); } return ( <aside className="details-panel"> <div className="details-panel-header"><h2>Event Details: {event.EventCode}</h2><button type="button" className="close-btn" onClick={onClose}><FaTimes /></button></div> <div className="details-panel-body"> <DetailItem label="Event ID" value={event.EventID} /> <DetailItem label="Event Code" value={event.EventCode} /> <DetailItem label="Year" value={event.Yr} /> <DetailItem label="Submitted Date" value={event.SubmittedDate} /> <DetailItem label="From Date" value={event.FromDate} /> <DetailItem label="To Date" value={event.ToDate} /> <DetailItem label="Event Name" value={event.EventName} /> <DetailItem label="Event Category" value={event.fkEventCategory} /> <DetailItem label="New Event Category" value={event.NewEventCategory} /> <DetailItem label="Event Remarks" value={event.EventRemarks} /> <DetailItem label="Event Month" value={event.EventMonth} /> <DetailItem label="Common ID" value={event.CommonID} /> <DetailItem label="Is Sub Event?" value={event.IsSubEvent1} /> <DetailItem label="Is Audio Recorded?" value={event.IsAudioRecorded} /> <DetailItem label="Pravachan Count" value={event.PravachanCount} /> <DetailItem label="Udhgosh Count" value={event.UdhgoshCount} /> <DetailItem label="Pagla Count" value={event.PaglaCount} /> <DetailItem label="Pratistha Count" value={event.PratisthaCount} /> <DetailItem label="Summary Remarks" value={event.SummaryRemarks} /> <DetailItem label="Pra-SU Duration" value={event.PraSUduration} /> <DetailItem label="Last Modified By" value={event.LastModifiedBy} /> <DetailItem label="Last Modified Timestamp" value={event.LastModifiedTimestamp} /> <DetailItem label="New Event From" value={event.NewEventFrom} /> <DetailItem label="New Event To" value={event.NewEventTo} /> </div> </aside> ); });

// --- HELPER FUNCTIONS ---
const formatBoolean = (value) => value === true || value === 1 ? 'Yes' : (value === false || value === 0 ? 'No' : 'N/A');
const formatHeader = (header) => header.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

// --- DYNAMIC TABLE COMPONENT ---
const EventsTable = memo(({ events, onViewDetails, selectedEventId }) => {
  if (!events || events.length === 0) {
    return <div className="no-data-message">No data found. Try adjusting your search or filters.</div>;
  }
  const headers = Object.keys(events[0]);
  return (
    <div className="table-container">
      <table className="user-table">
        <thead> <tr> {headers.map((header) => (<th key={header}>{formatHeader(header)}</th>))} </tr> </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.MLUniqueID} className={`main-row ${selectedEventId === event.MLUniqueID ? 'selected' : ''}`} onClick={() => onViewDetails(event)}>
              {headers.map((header) => ( <td key={header} data-label={formatHeader(header)}> {event[header] !== null && event[header] !== undefined ? String(event[header]) : 'N/A'} </td> ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});


// --- API LAYER ---
const API_BASE_URL = process.env.REACT_APP_API_URL;

// ######################################################################
// ############# THIS IS THE ONLY SECTION THAT HAS BEEN CHANGED #############
// ######################################################################
export async function fetchNewMediaLog({ page, limit, searchQuery, filters, view }) {
  
  let endpoint;
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  // Decide the base URL path based on the 'view' parameter
  switch (view) {
    case 'all-except-satsang':
      endpoint = `${API_BASE_URL}/newmedialog/all-except-satsang`;
      // For this specific, pre-filtered endpoint, we only need pagination params.
      // Search and other filters are handled by the backend logic for this route.
      break;
      
    case 'satsang-category':
      // When you create this backend endpoint, it will work automatically here
      endpoint = `${API_BASE_URL}/newmedialog/satsang-category`;
      break;

    case 'satsang-extracted-clips':
      endpoint = `${API_BASE_URL}/newmedialog/satsang-extracted-clips`;
      break;

    default:
      // This handles the "All Media Logs" view (when 'view' is undefined)
      // and any other generic views you might add.
      endpoint = `${API_BASE_URL}/newmedialog`;
      
      // The generic endpoint supports full searching and filtering
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value) {
          if (typeof value === 'object' && !Array.isArray(value) && (value.min || value.max)) { // Range
            if (value.min) params.append(`${key}_min`, value.min);
            if (value.max) params.append(`${key}_max`, value.max);
          } else if (Array.isArray(value) && value.length > 0) { // Checkbox
            value.forEach(v => params.append(key, v));
          } else if (typeof value === 'string' && value.trim() !== '') { // Text
            params.append(key, value);
          }
        }
      });
      break;
  }
  
  const finalUrl = `${endpoint}?${params.toString()}`;
  console.log("Fetching from URL:", finalUrl); // Very helpful for debugging

  // The rest of the function remains the same
  const res = await fetch(finalUrl, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" }
  });
  
  const text = await res.text();
  if (!res.ok) throw new Error(`API error: ${res.status}\n${text}`);
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error("Response is not valid JSON. Response was:\n" + text);
  }
}
// ######################################################################
// ####################### END OF MODIFIED SECTION ######################
// ######################################################################


const fetchDigitalRecordingDetails = async (recordingCode) => { if (!recordingCode) return null; const res = await fetch(`${API_BASE_URL}/digitalrecording/${recordingCode}`); if (!res.ok) throw new Error('Failed to fetch recording details'); return res.json(); };
const fetchEventDetails = async (eventCode) => { if (!eventCode) return null; const res = await fetch(`${API_BASE_URL}/events/${eventCode}`); if (!res.ok) throw new Error('Failed to fetch event details'); return res.json(); };

// --- MAIN COMPONENT ---
function Newmedialog() {
  const navigate = useNavigate();
  const location = useLocation();
  const { view } = useParams();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewTitle, setViewTitle] = useState("Media Logs");
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 50;
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedRecordingCodeForDetails, setSelectedRecordingCodeForDetails] = useState(null);
  const [selectedEventCodeForDetails, setSelectedEventCodeForDetails] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const initialFilterState = useCallback(() => ( Object.fromEntries(filterFields.map(field => { if (field.type === 'range') return [field.key, { min: '', max: '' }]; if (field.type === 'checkbox') return [field.key, []]; return [field.key, '']; })) ), []);
  const [filters, setFilters] = useState(initialFilterState());
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  useEffect(() => {
    setViewTitle(viewDisplayNames[view] || "All Media Logs");
  }, [view]);

  const { data: paginatedData, isLoading, error } = useQuery({
    queryKey: ['newMediaLog', currentPage, searchQuery, filters, view],
    queryFn: () => fetchNewMediaLog({ page: currentPage, limit: eventsPerPage, searchQuery, filters, view }),
    keepPreviousData: true,
  });

  const currentEvents = paginatedData?.data || [];
  const totalPages = paginatedData?.totalPages || 1;
  
  const { data: recordingDetails, isLoading: isRecordingDetailsLoading, isError: isRecordingDetailsError, error: recordingDetailsError, } = useQuery({ queryKey: ['digitalRecordingDetails', selectedRecordingCodeForDetails], queryFn: () => fetchDigitalRecordingDetails(selectedRecordingCodeForDetails), enabled: !!selectedRecordingCodeForDetails, });
  const { data: eventDetails, isLoading: isEventDetailsLoading, isError: isEventDetailsError, error: eventDetailsError, } = useQuery({ queryKey: ['eventDetails', selectedEventCodeForDetails], queryFn: () => fetchEventDetails(selectedEventCodeForDetails), enabled: !!selectedEventCodeForDetails, });
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, view]);

  const handleSelectEvent = useCallback((event) => { setSelectedEventCodeForDetails(null); setSelectedRecordingCodeForDetails(null); setSelectedEvent(event); setIsAssistantOpen(false); }, []);
  const handleCloseDetails = useCallback(() => setSelectedEvent(null), []);
  const handleViewRecordingDetails = useCallback((recordingCode) => { setSelectedEventCodeForDetails(null); setSelectedRecordingCodeForDetails(recordingCode); }, []);
  const handleCloseRecordingDetails = useCallback(() => setSelectedRecordingCodeForDetails(null), []);
  const handleViewEventDetails = useCallback((eventCode) => { setSelectedEventCodeForDetails(eventCode); }, []);
  const handleCloseEventDetails = useCallback(() => setSelectedEventCodeForDetails(null), []);
  const handleMenuClick = useCallback(() => setMenuOpen(prev => !prev), []);
  const handleCloseSidebar = useCallback(() => setMenuOpen(false), []);
  const handleOpenFilter = useCallback(() => setIsFilterOpen(true), []);
  const handleCloseFilter = useCallback(() => { setIsFilterOpen(false); setActiveFilter(null); }, []);
  const handleFilterChange = useCallback((e) => { const { name, value, checked } = e.target; const filterType = e.target.dataset.filterType; const rangePart = e.target.dataset.rangePart; setFilters(prev => { if (filterType === 'checkbox') { const currentValues = prev[name] || []; if (checked) { return { ...prev, [name]: [...currentValues, value] }; } else { return { ...prev, [name]: currentValues.filter(v => v !== value) }; } } if (rangePart) { return { ...prev, [name]: { ...prev[name], [rangePart]: value } }; } return { ...prev, [name]: value }; }); }, []);
  const handleSearchChange = useCallback((event) => { setSearchQuery(event.target.value); }, []);
  const handleApplyFilters = useCallback(() => { setIsFilterOpen(false); setActiveFilter(null); }, []);
  const handleClearSidebarFilters = useCallback(() => { setFilters(initialFilterState()); setActiveFilter(null); }, [initialFilterState]);
  const handleSelectFilter = useCallback((filterKey) => setActiveFilter(filterKey), []);
  const handleGoBack = useCallback(() => setActiveFilter(null), []);
  const handleRemoveFilter = useCallback((filterKey) => { if (filterKey === 'searchQuery') { setSearchQuery(''); } else { setFilters(prev => ({ ...prev, [filterKey]: initialFilterState()[filterKey] })); } }, [initialFilterState]);
  const handleClearAll = useCallback(() => { setSearchQuery(''); setFilters(initialFilterState()); }, [initialFilterState]);
  const handleOpenAssistant = useCallback(() => { setSelectedEvent(null); setSelectedRecordingCodeForDetails(null); setSelectedEventCodeForDetails(null); setIsAssistantOpen(true); }, []);
  const handleCloseAssistant = useCallback(() => setIsAssistantOpen(false), []);
  const handleApplyParsedFilters = useCallback(({ filters: newFilters, searchQuery: newSearchQuery }) => { setFilters(prev => ({ ...initialFilterState(), ...newFilters })); setSearchQuery(newSearchQuery || ''); }, [initialFilterState]);

  const handleExport = useCallback(() => {
    const params = new URLSearchParams();
    if (view) { params.append('view', view); }
    if (searchQuery) { params.append('search', searchQuery); }
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value) {
        if (typeof value === 'object' && !Array.isArray(value) && (value.min || value.max)) {
          if (value.min) params.append(`${key}_min`, value.min);
          if (value.max) params.append(`${key}_max`, value.max);
        } else if (Array.isArray(value) && value.length > 0) {
          value.forEach(v => params.append(key, v));
        } else if (typeof value === 'string' && value.trim() !== '') {
          params.append(key, value);
        }
      }
    });
    const exportUrl = `${API_BASE_URL}/newmedialog/export?${params.toString()}`;
    window.open(exportUrl, '_blank');
  }, [searchQuery, filters, view]);

  const isDetailsPanelVisible = selectedEvent || selectedRecordingCodeForDetails || selectedEventCodeForDetails;
  const contentAreaClasses = [ 'content-area', isDetailsPanelVisible ? 'details-visible' : '', isAssistantOpen ? 'assistant-visible' : '' ].join(' ').trim();

  return (
    <div className={`layout ${menuOpen ? 'sidebar-open' : ''}`}>
      <Sidebar isOpen={menuOpen} onClose={handleCloseSidebar} navigate={navigate} onOpenAssistant={handleOpenAssistant} isAssistantOpen={isAssistantOpen} />
      <FilterSidebar isOpen={isFilterOpen} onClose={handleCloseFilter} filters={filters} onFilterChange={handleFilterChange} onApply={handleApplyFilters} onClear={handleClearSidebarFilters} activeFilter={activeFilter} onSelectFilter={handleSelectFilter} onGoBack={handleGoBack} />
      
      <main className="main-content">
        <Header viewTitle={viewTitle} onMenuClick={handleMenuClick} onExportClick={handleExport} searchQuery={searchQuery} onSearchChange={handleSearchChange} onFilterClick={handleOpenFilter} />
        <ActiveFiltersDisplay filters={filters} searchQuery={searchQuery} onRemoveFilter={handleRemoveFilter} onClearAll={handleClearAll} activeView={view} />
        
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
          <AssistantPanel isOpen={isAssistantOpen} onClose={handleCloseAssistant} currentPath={location.pathname} onNavigate={navigate} onApplyFilters={handleApplyParsedFilters} onClearAllFilters={handleClearAll} />
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