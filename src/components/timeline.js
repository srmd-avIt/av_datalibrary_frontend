import React, { useState, useCallback, memo, useMemo } from 'react';
import { useNavigate,useLocation} from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// --- ICON & CSS IMPORTS ---
import {
  FaListAlt, FaFolderOpen, FaVideo, FaTable, FaTag, FaMicrophone,
  FaInfoCircle, FaCommentDots, FaShareAlt, FaTimes, FaBars,
  FaSearch, FaFilter, FaFileExport, FaChevronRight, FaArrowLeft, FaStream,
  FaClock, FaThLarge, FaCalendarAlt, FaHashtag, FaCheckCircle,FaChartBar
} from 'react-icons/fa';
import './users.css';
import './timeline.css';

// --- DATE-FNS IMPORT ---
import { format, isValid, parse } from 'date-fns';


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
          <SidebarItem icon={<FaTable />} text="All Data View - Formal - Informal" />
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
    if (searchVisible && searchQuery) {
      onSearchChange({ target: { value: '' } });
    }
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
          <input type="text" placeholder="Search Event Code, Name, or Year..." value={searchQuery} onChange={onSearchChange}/>
          <FaFilter className="filter-icon" title="Advanced Filters" onClick={onFilterClick}/>
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
    {key:'EventID',label:'Event ID',type:'range'},{key:'EventCode',label:'Event Code',type:'text'},{key:'Yr',label:'Year',type:'range'},{key:'SubmittedDate',label:'Submitted Date',type:'text'},{key:'FromDate',label:'From Date',type:'text'},{key:'ToDate',label:'To Date',type:'text'},{key:'EventName',label:'Event Name',type:'text'},{key:'fkEventCategory',label:'Event Category',type:'text'},{key:'EventRemarks',label:'Event Remarks',type:'text'},{key:'EventMonth',label:'Event Month',type:'text'},{key:'CommonID',label:'Common ID',type:'text'},{key:'IsSubEvent1',label:'Is Sub Event?',type:'select',options:['All','Yes','No']},{key:'IsAudioRecorded',label:'Is Audio Recorded?',type:'select',options:['All','Yes','No']},{key:'PravachanCount',label:'Pravachan Count',type:'text'},{key:'UdhgoshCount',label:'Udhgosh Count',type:'text'},{key:'PaglaCount',label:'Pagla Count',type:'text'},{key:'PratisthaCount',label:'Pratistha Count',type:'text'},{key:'SummaryRemarks',label:'Summary Remarks',type:'text'},{key:'PraSUduration',label:'Pra-SU Duration',type:'text'},{key:'LastModifiedBy',label:'Last Modified By',type:'text'},{key:'LastModifiedTimestamp',label:'Last Modified Timestamp',type:'text'},{key:'NewEventCategory',label:'New Event Category',type:'text'},{key:'NewDateForm',label:'New Date Form',type:'text'}
];

const FilterSidebar = memo(({isOpen, onClose, filters, onFilterChange, onApply, onClear, activeFilter, onSelectFilter, onGoBack}) => {
  const renderFieldList = () => (
    <ul className="filter-field-list">
      {filterFields.map(field => (
        <li key={field.key} onClick={() => onSelectFilter(field.key)}>
          <div className="filter-field-label">
            <span>{field.label}</span>
          </div>
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
            <input type="number" id={`filter-input-${field.key}-min`} name={field.key} data-range-part="min" value={filters[field.key]?.min || ''} onChange={onFilterChange} placeholder="e.g. 100" autoFocus />
            <label htmlFor={`filter-input-${field.key}-max`}>Max</label>
            <input type="number" id={`filter-input-${field.key}-max`} name={field.key} data-range-part="max" value={filters[field.key]?.max || ''} onChange={onFilterChange} placeholder="e.g. 200"/>
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
          <input type="text" id={`filter-input-${field.key}`} name={field.key} value={filters[field.key] || ''} onChange={onFilterChange} placeholder={field.placeholder} autoFocus/>
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

    if (activeFiltersList.length === 0) {
        return null;
    }

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

const Pagination = memo(({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }
  return (
    <nav className="pagination">
      <button className="pagination-arrow" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>{'<< Previous'}</button>
      <span className="pagination-info">Page {currentPage} of {totalPages}</span>
      <button className="pagination-arrow" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>{'Next >>'}</button>
    </nav>
  );
});

const formatBoolean = (value) => {
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    return 'N/A';
}

const DetailItem = memo(({ label, value, isBoolean = false }) => (
    <div className="detail-view-group">
        <label>{label}</label>
        <span>{isBoolean ? formatBoolean(value) : (value !== null && value !== undefined ? String(value) : 'N/A')}</span>
    </div>
));

const EventDetailsPanel = memo(({ event, onClose }) => {
    if (!event) return null;
    return (
        <aside className="details-panel">
            <div className="details-panel-header">
                <h2>Event Details</h2>
                <button type="button" className="close-btn" onClick={onClose}><FaTimes /></button>
            </div>
            <div className="details-panel-body">
                <DetailItem label="Event ID" value={event.EventID} /><DetailItem label="Event Code" value={event.EventCode} /><DetailItem label="Year" value={event.Yr} /><DetailItem label="Submitted Date" value={event.SubmittedDate} /><DetailItem label="From Date" value={event.FromDate} /><DetailItem label="To Date" value={event.ToDate} /><DetailItem label="Event Name" value={event.EventName} /><DetailItem label="Event Category" value={event.fkEventCategory} /><DetailItem label="Event Remarks" value={event.EventRemarks} /><DetailItem label="Event Month" value={event.EventMonth} /><DetailItem label="Common ID" value={event.CommonID} />
                <DetailItem label="Is Sub Event" value={event.IsSubEvent1} isBoolean={true} /><DetailItem label="Is Audio Recorded" value={event.IsAudioRecorded} isBoolean={true} />
                <DetailItem label="Pravachan Count" value={event.PravachanCount} /><DetailItem label="Udhgosh Count" value={event.UdhgoshCount} /><DetailItem label="Pagla Count" value={event.PaglaCount} /><DetailItem label="Pratistha Count" value={event.PratisthaCount} /><DetailItem label="Summary Remarks" value={event.SummaryRemarks} /><DetailItem label="Pra-SU Duration" value={event.PraSUduration} /><DetailItem label="Last Modified By" value={event.LastModifiedBy} /><DetailItem label="Last Modified Timestamp" value={event.LastModifiedTimestamp} /><DetailItem label="New Event Category" value={event.NewEventCategory} /><DetailItem label="New Date Form" value={event.NewDateForm} />
            </div>
        </aside>
    );
});

const fetchEvents = async () => {
  const res = await fetch('http://localhost:5000/api/users');
  if (!res.ok) throw new Error('Network response was not ok');
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Data from API is not in the expected array format.");
  return data;
};

// --- VIEW COMPONENTS ---

const TimelineControls = memo(({ groupBy, onGroupByChange, viewMode, onViewModeChange }) => (
    <div className="view-controls">
        <div className="view-controls-group">
            <label htmlFor="group-by-select"><FaClock/> Group By:</label>
            <select id="group-by-select" className="control-select" value={groupBy} onChange={e => onGroupByChange(e.target.value)}>
                <option value="Yr">Year</option>
                <option value="EventMonth">Event Month</option>
                <option value="OnThisDay">On This Day (Month-Day)</option>
                <option value="SubmittedDate">Submission Date</option>
            </select>
        </div>
        <div className="view-mode-toggle">
            <button className={`view-mode-btn ${viewMode === 'timeline' ? 'active' : ''}`} onClick={() => onViewModeChange('timeline')} title="Timeline View">
                <FaStream />
            </button>
            <button className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => onViewModeChange('grid')} title="Grid View">
                <FaThLarge />
            </button>
        </div>
    </div>
));

const TimelineView = memo(({ events, onViewDetails, selectedEventId, groupBy }) => {
  const { groupedEvents, sortedGroupKeys } = useMemo(() => {
    if (events.length === 0) return { groupedEvents: {}, sortedGroupKeys: [] };
    const getGroupKey = (event) => {
      let date;
      switch (groupBy) {
        case 'OnThisDay': date = new Date(event.FromDate); return isValid(date) ? format(date, 'MM-dd') : 'Invalid Date';
        case 'EventMonth': date = new Date(event.FromDate); return isValid(date) ? format(date, 'yyyy-MM (MMMM)') : 'Invalid Date';
        case 'SubmittedDate': date = new Date(event.SubmittedDate); return isValid(date) ? format(date, 'yyyy-MM-dd') : 'Invalid Date';
        case 'Yr': default: return event.Yr || 'Unknown Year';
      }
    };
    const grouped = events.reduce((acc, event) => {
      const key = getGroupKey(event);
      if (key !== 'Invalid Date') {
        if (!acc[key]) acc[key] = [];
        acc[key].push(event);
      }
      return acc;
    }, {});
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      if (groupBy === 'OnThisDay') {
        const todayKey = format(new Date(), 'MM-dd');
        if (a === todayKey) return -1;
        if (b === todayKey) return 1;
        return a.localeCompare(b);
      }
      return b.localeCompare(a);
    });
    return { groupedEvents: grouped, sortedGroupKeys: sortedKeys };
  }, [events, groupBy]);

  if (sortedGroupKeys.length === 0) return <div className="no-data-message">No events found. Try adjusting your search or filters.</div>;

  return (
    <div className="timeline-container professional">
      {sortedGroupKeys.map(key => {
        let displayHeader = key;
        if (groupBy === 'OnThisDay' && isValid(parse(key, 'MM-dd', new Date()))) {
            displayHeader = format(parse(key, 'MM-dd', new Date()), 'MMMM dd');
        }
        return (
          <div key={key} className="timeline-section">
            <h2 className="timeline-header">{displayHeader}</h2>
            <ul className="timeline-list">
              {groupedEvents[key]
                .sort((a, b) => new Date(b.FromDate) - new Date(a.FromDate))
                .map(event => (
                  <li key={event.EventID} className={`timeline-item ${selectedEventId === event.EventID ? 'selected' : ''}`} onClick={() => onViewDetails(event)}>
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <h3 className="timeline-title">{event.EventName || 'Untitled Event'}</h3>
                      <div className="timeline-meta">
                        <span>
                          <FaCalendarAlt /> 
                          {event.FromDate || 'N/A'} {event.ToDate && event.ToDate !== event.FromDate ? ` - ${event.ToDate}` : ''}
                        </span>
                        <span>
                          <FaHashtag /> 
                          {event.EventCode || 'N/A'}
                        </span>
                      </div>
                      <div className="timeline-tags">
                        {event.fkEventCategory && <span className="tag-pill category">{event.fkEventCategory}</span>}
                        {event.IsAudioRecorded === true && <span className="tag-pill audio"><FaCheckCircle /> Audio Recorded</span>}
                      </div>
                    </div>
                  </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  );
});

const GridView = memo(({ events, onViewDetails, selectedEventId, groupBy }) => {
    const { groupedEvents, sortedGroupKeys } = useMemo(() => {
      if (events.length === 0) return { groupedEvents: {}, sortedGroupKeys: [] };
      const getGroupKey = (event) => {
        let date;
        switch (groupBy) {
          case 'OnThisDay': date = new Date(event.FromDate); return isValid(date) ? format(date, 'MM-dd') : 'Invalid Date';
          case 'EventMonth': date = new Date(event.FromDate); return isValid(date) ? format(date, 'yyyy-MM (MMMM)') : 'Invalid Date';
          case 'SubmittedDate': date = new Date(event.SubmittedDate); return isValid(date) ? format(date, 'yyyy-MM-dd') : 'Invalid Date';
          case 'Yr': default: return event.Yr || 'Unknown Year';
        }
      };
      const grouped = events.reduce((acc, event) => {
        const key = getGroupKey(event);
        if (key !== 'Invalid Date') {
          if (!acc[key]) acc[key] = [];
          acc[key].push(event);
        }
        return acc;
      }, {});
      const sortedKeys = Object.keys(grouped).sort((a, b) => {
        if (groupBy === 'OnThisDay') {
          const todayKey = format(new Date(), 'MM-dd');
          if (a === todayKey) return -1;
          if (b === todayKey) return 1;
          return a.localeCompare(b);
        }
        return b.localeCompare(a);
      });
      return { groupedEvents: grouped, sortedGroupKeys: sortedKeys };
    }, [events, groupBy]);

    const formatCardDate = (dateString) => {
        const date = new Date(dateString);
        return isValid(date) ? format(date, 'MMM dd, yyyy') : 'Invalid Date';
    };
  
    if (sortedGroupKeys.length === 0) return <div className="no-data-message">No events found. Try adjusting your search or filters.</div>;
  
    return (
      <div className="timeline-container">
        {sortedGroupKeys.map(key => {
          let displayHeader = key;
          if (groupBy === 'OnThisDay' && isValid(parse(key, 'MM-dd', new Date()))) {
              displayHeader = format(parse(key, 'MM-dd', new Date()), 'MMMM dd');
          }
          return (
            <div key={key} className="timeline-section">
              <h2 className="timeline-header">{displayHeader}</h2>
              <div className="grid-container">
                {groupedEvents[key]
                  .sort((a, b) => new Date(b.FromDate) - new Date(a.FromDate))
                  .map(event => (
                    <div key={event.EventID} className={`grid-card ${selectedEventId === event.EventID ? 'selected' : ''}`} onClick={() => onViewDetails(event)}>
                        <div className="grid-card-year">{event.Yr || '----'}</div>
                        <h3 className="grid-card-title">{event.EventName || 'Untitled Event'}</h3>
                        <div className="grid-card-meta">
                            <span><FaCalendarAlt /> {formatCardDate(event.FromDate)}</span>
                            <span><FaHashtag /> {event.EventCode || 'N/A'}</span>
                        </div>
                        <div className="grid-card-footer">
                            {event.fkEventCategory && <span className="tag-pill category">{event.fkEventCategory}</span>}
                        </div>
                    </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    );
});


// --- MAIN COMPONENT ---
function Timeline() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [groupBy, setGroupBy] = useState('Yr');
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'grid'
  const eventsPerPage = 50;
  
  // --- [CHANGE 1] - DYNAMIC INITIAL FILTER STATE ---
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
  const [activeFilter, setActiveFilter] = useState(null);
  const { data: events = [], isLoading, error } = useQuery({ queryKey: ['timelineEvents'], queryFn: fetchEvents });
  
  const handleSelectEvent = useCallback((event) => setSelectedEvent(event), []);
  const handleCloseDetails = useCallback(() => setSelectedEvent(null), []);
  const handleMenuClick = useCallback(() => setMenuOpen(prev => !prev), []);
  const handleCloseSidebar = useCallback(() => setMenuOpen(false), []);
  const handleSearchChange = useCallback((e) => { setSearchQuery(e.target.value); setCurrentPage(1); }, []);
  const handleOpenFilter = useCallback(() => setIsFilterOpen(true), []);
  const handleCloseFilter = useCallback(() => { setIsFilterOpen(false); setActiveFilter(null); }, []);
  
  // --- [CHANGE 2] - IMPROVED FILTER CHANGE HANDLER ---
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
  const handleSelectFilter = useCallback((filterKey) => setActiveFilter(filterKey), []);
  const handleGoBack = useCallback(() => setActiveFilter(null), []);
  
  const handleRemoveFilter = useCallback((filterKey) => {
    if (filterKey === 'searchQuery') {
      setSearchQuery('');
    } else {
      setFilters(prev => ({
        ...prev,
        [filterKey]: initialFilterState()[filterKey]
      }));
    }
    setCurrentPage(1);
  }, [initialFilterState]);

  const handleClearAll = useCallback(() => {
    setSearchQuery('');
    setFilters(initialFilterState());
    setCurrentPage(1);
  }, [initialFilterState]);
  
  // --- [CHANGE 3] - DYNAMIC AND ROBUST FILTERING LOGIC ---
  const filteredEvents = useMemo(() => {
    const query = searchQuery.toLowerCase();
    let results = events;

    if (query) {
      results = results.filter((event) => {
        const eventCode = event.EventCode ? event.EventCode.toLowerCase() : '';
        const eventName = event.EventName ? event.EventName.toLowerCase() : '';
        const year = event.Yr ? String(event.Yr) : '';
        return eventCode.includes(query) || year.includes(query) || eventName.includes(query);
      });
    }

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

    results = results.filter(event => {
        return Object.keys(filters).every(key => {
            const fieldDef = filterFields.find(f => f.key === key);
            if (!fieldDef) return true;

            const filterValue = filters[key];
            const eventValue = event[key];
            
            switch (fieldDef.type) {
                case 'text':
                    return checkString(eventValue, filterValue);
                case 'range':
                    return checkRange(eventValue, filterValue);
                case 'select':
                    return checkSelect(eventValue, filterValue);
                default:
                    return true;
            }
        });
    });

    return results;
  }, [events, searchQuery, filters]);
  
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
  const currentEvents = filteredEvents.slice((currentPage - 1) * eventsPerPage, currentPage * eventsPerPage);

  // --- [CHANGE 4] - FUNCTIONAL CSV EXPORT ---
  const handleExport = useCallback(() => { 
    if (filteredEvents.length === 0) {
      alert("No data to export.");
      return;
    }
    const headers = Object.keys(filteredEvents[0]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [
          headers.join(','), 
          ...filteredEvents.map(event => headers.map(header => `"${String(event[header]).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "timeline_events_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredEvents]);

  return (
    <div className={`layout ${menuOpen ? 'sidebar-open' : ''}`}>
      <Sidebar isOpen={menuOpen} setViewTitle={() => {}} onClose={handleCloseSidebar} navigate={navigate} />
      <FilterSidebar isOpen={isFilterOpen} onClose={handleCloseFilter} filters={filters} onFilterChange={handleFilterChange} onApply={handleApplyFilters} onClear={handleClearSidebarFilters} activeFilter={activeFilter} onSelectFilter={handleSelectFilter} onGoBack={handleGoBack} />
      <main className="main-content">
        <Header viewTitle="Timeline Explorer" onMenuClick={handleMenuClick} onExportClick={handleExport} searchQuery={searchQuery} onSearchChange={handleSearchChange} onFilterClick={handleOpenFilter} />
        <ActiveFiltersDisplay filters={filters} searchQuery={searchQuery} onRemoveFilter={handleRemoveFilter} onClearAll={handleClearAll} />
        <TimelineControls 
          groupBy={groupBy} 
          onGroupByChange={setGroupBy} 
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        <div className={`content-area ${selectedEvent ? 'details-visible' : ''}`}>
          <div className="table-wrapper">
            {isLoading && <div className="loader">Loading...</div>}
            {error && <div className="error-message">{error.message}</div>}
            {!isLoading && !error && (
              <>
                {viewMode === 'timeline' ? (
                   <TimelineView 
                    events={currentEvents} 
                    onViewDetails={handleSelectEvent} 
                    selectedEventId={selectedEvent?.EventID} 
                    groupBy={groupBy} 
                  />
                ) : (
                  <GridView 
                    events={currentEvents} 
                    onViewDetails={handleSelectEvent} 
                    selectedEventId={selectedEvent?.EventID} 
                    groupBy={groupBy} 
                  />
                )}
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </>
            )}
          </div>
          {selectedEvent && (<EventDetailsPanel event={selectedEvent} onClose={handleCloseDetails} />)}
        </div>
      </main>
    </div>
  );
}

export default Timeline;