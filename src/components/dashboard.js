import React, { useState, useCallback, memo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet'; // Import Leaflet library itself

import {
  FaListAlt, FaFolderOpen, FaTable, FaTag, FaMicrophone, FaTimes, FaBars, FaSearch, FaUser, FaHome, FaGlobeAmericas, FaChartBar, FaVideo, FaStream, FaInfoCircle, FaCommentDots, FaShareAlt, FaSyncAlt, FaRegClock
} from 'react-icons/fa';

import 'leaflet/dist/leaflet.css'; // <-- IMPORTANT: Add this for Leaflet to work
import './users.css';      // Global layout, sidebar, and header styles
import './Dashboard.css';  // Specific styles for dashboard content
import AssistantPanel from './AssistantPanel';

// --- CONFIGURATION: API Base URL from environment variables ---
const API_BASE_URL = process.env.REACT_APP_API_URL;

// --- MOCK DATA ---
const mockSatsangHoursData = { yearwise: { '2025': 1250, '2024': 1840, '2023': 1420 }, countrywise: { '2025': { 'India': 450, 'USA': 320, 'UK': 180, 'Canada': 120, 'Australia': 80, 'Germany': 60, 'France': 40, 'Japan': 35, 'Singapore': 25, 'UAE': 30 }, '2024': { 'India': 680, 'USA': 480, 'UK': 240, 'Canada': 180, 'Australia': 120, 'Germany': 80, 'France': 60, 'Japan': 45 }, '2023': { 'India': 520, 'USA': 360, 'UK': 200, 'Canada': 140, 'Australia': 100, 'Germany': 70 }, } };

// --- SUB-COMPONENTS ---
const SidebarItem = memo(({ icon, text, onClick, active }) => ( <li onClick={onClick} className={`flex items-center gap-2 p-2 cursor-pointer rounded-md ${active ? "bg-blue-600 text-white" : "hover:bg-gray-200"}`}> {icon} <span>{text}</span> </li> ));
const Sidebar = memo(({ isOpen, setViewTitle, onClose, navigate, onOpenAssistant, isAssistantOpen }) => { const location = useLocation(); const handleAssistantClick = () => { onOpenAssistant(); onClose(); }; return ( <> <div className={`sidebar-overlay ${isOpen ? "show" : ""}`} onClick={onClose}></div> <aside className={`sidebar ${isOpen ? "open" : ""}`}> <div className="sidebar-header"> <h3><FaTag color="#4a90e2" /> Data library</h3> <button onClick={onClose} className="close-sidebar-btn"><FaTimes /></button> </div> <ul> <SidebarItem icon={<FaHome />} text="Home" onClick={() => navigate("/")} active={location.pathname === "/"} /> <SidebarItem icon={<FaTable />} text="Events" onClick={() => navigate("/events")} active={location.pathname === "/events"} /> <SidebarItem icon={<FaListAlt />} text="NewMediaLog" onClick={() => navigate("/newmedialog")} active={location.pathname === "/newmedialog"} /> <SidebarItem icon={<FaFolderOpen />} text="Digital Recording" onClick={() => navigate("/digitalrecording")} active={location.pathname === "/digitalrecording"} /> <SidebarItem icon={<FaChartBar />} text="AuxFiles" onClick={() => navigate("/auxfiles")} active={location.pathname === "/auxfiles"} /> <SidebarItem icon={<FaVideo />} text="Satsang Extracted Clips" onClick={() => alert("Page coming soon!")} active={false} /> <SidebarItem icon={<FaStream />} text="Timeline" onClick={() => navigate("/timeline")} active={location.pathname === "/timeline"} /> <SidebarItem icon={<FaGlobeAmericas />} text="Places" onClick={() => alert("Places page coming soon!")} active={false} /> <SidebarItem icon={<FaSearch />} text="Search" onClick={() => alert("Global search page coming soon!")} active={false} /> <li className="sidebar-divider"></li> <SidebarItem icon={<FaMicrophone />} text="Assistant" onClick={handleAssistantClick} active={isAssistantOpen} /> <SidebarItem icon={<FaInfoCircle />} text="About" onClick={() => alert("App version 1.0.0\nCreated by Gaurav.")} active={false} /> <SidebarItem icon={<FaCommentDots />} text="Feedback" onClick={() => alert("Send feedback to feedback@example.com")} active={false} /> <SidebarItem icon={<FaShareAlt />} text="Share" onClick={() => alert("Share this app!")} active={false} /> </ul> <div className="sidebar-profile" style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', padding: '1rem', cursor: 'pointer' }}> <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)' }}> <div style={{width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#4a4f58', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaUser /></div> <div> <span style={{ fontWeight: 600 }}>Admin User</span> <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Settings / Logout</div> </div> </div> </div> </aside> </> ); });
const Header = memo(({ viewTitle, onMenuClick }) => ( <header className="header"> <div className="header-left"> <button className="menu-btn" onClick={onMenuClick}><FaBars /></button> <h2 className="view-title">{viewTitle}</h2> </div> </header> ));
const AssistantSearchBar = memo(({ onSearchClick }) => ( <div className="assistant-search-bar"> <input type="text" placeholder="Ask Assistant (e.g., ‘Show visits in 2024’)" /> <button className="icon-btn" title="Search" onClick={onSearchClick}><FaSearch /></button> <button className="icon-btn" title="Voice Search"><FaMicrophone /></button> </div> ));

// --- THIS IS YOUR ORIGINAL, UNCHANGED COMPONENT ---
const DataDetailsSheet = ({ isOpen, onClose, dataType, selectedItem, year }) => {
    // State for the three views
    const [viewMode, setViewMode] = useState('logs'); // 'logs', 'events', 'drilldown'
    
    // Data states
    const [logData, setLogData] = useState([]);
    const [eventData, setEventData] = useState([]);
    const [filteredLogData, setFilteredLogData] = useState([]);
    const [selectedEventInfo, setSelectedEventInfo] = useState(null);

    // Loading and error states
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch initial log data when the sheet opens
    useEffect(() => {
        if (isOpen && (dataType === 'Country' || dataType === 'City') && selectedItem && year > 0) {
            const fetchInitialLogs = async () => {
                setIsLoading(true);
                setError(null);
                // Reset all states
                setLogData([]);
                setEventData([]);
                setFilteredLogData([]);
                setViewMode('logs');

                const endpoint = dataType === 'Country'
                    ? `/dashboard/events-by-country?year=${year}&country=${encodeURIComponent(selectedItem)}`
                    : `/dashboard/events-by-city?year=${year}&city=${encodeURIComponent(selectedItem)}`;
                
                try {
                    const response = await fetch(`${API_BASE_URL}${endpoint}`);
                    if (!response.ok) throw new Error('Failed to fetch data.');
                    const data = await response.json();
                    setLogData(data);
                } catch (err) {
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchInitialLogs();
        }
    }, [isOpen, dataType, selectedItem, year]);

    // Function to toggle to the "Group by Event" view
    const handleGroupByEvent = async () => {
        setIsLoading(true);
        setViewMode('events');
        
        // Use the new grouped endpoint
        const filterKey = dataType === 'Country' ? 'country' : 'city';
        const endpoint = `/dashboard/events-by-group?year=${year}&${filterKey}=${encodeURIComponent(selectedItem)}`;
        
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`);
            if (!response.ok) throw new Error('Failed to fetch grouped data.');
            const data = await response.json();
            setEventData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Function to handle drilling down from the "Event View"
    const handleEventClick = (event) => {
        // We already have all the logs, so we just filter them client-side
        const filtered = logData.filter(log => log.EventCode === event.EventCode);
        setFilteredLogData(filtered);
        setSelectedEventInfo(event);
        setViewMode('drilldown');
    };

    // --- RENDER LOGIC ---

    const renderHeaderControls = () => (
        <div className="sheet-view-controls">
            <button className={`control-btn ${viewMode === 'logs' ? 'active' : ''}`} onClick={() => setViewMode('logs')}>
                Log View
            </button>
            <button className={`control-btn ${viewMode === 'events' ? 'active' : ''}`} onClick={handleGroupByEvent}>
                Group by Event
            </button>
        </div>
    );
    
    const renderLogView = (logs) => (
        <ul className="details-list">
            {logs.map(item => (
                <li key={item.MLUniqueID} className="details-list-item">
                    <div className="item-header">
                        <strong className="item-title">{item.EventName || 'Untitled Event'}</strong>
                        <span className="item-code">{item.EventCode}</span>
                    </div>
                    <div className="item-body">
                      <p><strong>Content Detail:</strong> {item.Detail || 'N/A'}</p>
    {dataType === 'City' && (
        <p><strong>Country:</strong> {item.fkCountry || 'N/A'}</p>
    )}
    {dataType === 'Country' && (
        <p><strong>City:</strong> {item.fkCity || 'N/A'}</p>
    )}
                    </div>
                </li>
            ))}
        </ul>
    );

    const renderEventView = () => (
        <ul className="details-list">
            {eventData.map(event => (
                <li key={event.EventCode} className="details-list-item clickable" onClick={() => handleEventClick(event)}>
                    <div className="item-header">
                        <strong className="item-title">{event.EventName || 'Untitled Event'}</strong>
                        <span className="item-code">{event.EventCode}</span>
                    </div>
                    <div className="item-body">
                        <p><strong>Counts:</strong> {event.ContentCount}</p>
                        <p><strong>Content:</strong> {event.ContentDetail || 'N/A'}</p>
                        <p><strong>City:</strong> {event.fkCity || 'N/A'}</p>
        
                        <p><strong>FromDate: </strong>{event.FromDate || 'N/A'}</p>
                        <p><strong>ToDate: </strong>{event.ToDate || 'N/A'}</p>
                    </div>
                    <div className="item-footer">Click to see all {event.ContentCount} entries &rarr;</div>
                </li>
            ))}
        </ul>
    );
    
    const renderDrilldownView = () => (
        <div>
            <button onClick={() => setViewMode('events')} className="back-button">&larr; Back to Event Groups</button>
            <h3>{selectedEventInfo.EventName}</h3>
            <p className="summary-count">Showing {filteredLogData.length} entries for Event Code: <strong>{selectedEventInfo.EventCode}</strong></p>
            {renderLogView(filteredLogData)}
        </div>
    );

    const renderContent = () => {
        if (isLoading) return <div className="sheet-feedback">Loading...</div>;
        if (error) return <div className="sheet-feedback error">{error}</div>;

        switch (viewMode) {
            case 'events':
                return renderEventView();
            case 'drilldown':
                return renderDrilldownView();
            case 'logs':
            default:
                return renderLogView(logData);
        }
    };
    
    if (!isOpen) return null;
    
    const sheetTitle = `Event Logs in ${selectedItem} (${year})`;

    return (
        <div className="sheet-overlay" onClick={onClose}>
            <div className={`sheet-content ${isOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="sheet-header">
                    <h2>{sheetTitle}</h2>
                    <button onClick={onClose} className="close-sheet-btn"><FaTimes /></button>
                </div>
                {renderHeaderControls()}
                <div className="sheet-body">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
// --- ADDITION 1 of 3: A NEW, SEPARATE COMPONENT FOR MAP POPUP DETAILS ---
const MapEventDetailsSheet = ({ isOpen, onClose, dataType, selectedItem, year }) => {
    const [details, setDetails] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && (dataType === 'Pratishtha' || dataType === 'Padhramani') && selectedItem && year > 0) {
            const fetchMapDetails = async () => {
                setIsLoading(true);
                setError(null);
                setDetails([]);
                const endpoint = dataType === 'Pratishtha'
                    ? `/dashboard/pratishtha-events?year=${year}&country=${encodeURIComponent(selectedItem)}`
                    : `/dashboard/padhramani-events?year=${year}&country=${encodeURIComponent(selectedItem)}`;
                try {
                    const response = await fetch(`${API_BASE_URL}${endpoint}`);
                    if (!response.ok) { throw new Error('Failed to fetch event data.'); }
                    const data = await response.json();
                    setDetails(data);
                } catch (err) {
                    setError(err.message || 'An error occurred.');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchMapDetails();
        }
    }, [isOpen, dataType, selectedItem, year]);

    if (!isOpen) return null;

    const sheetTitle = `${dataType} Events in ${selectedItem} (${year})`;

    return (
        <div className="sheet-overlay" onClick={onClose}>
            <div className={`sheet-content ${isOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="sheet-header"><h2>{sheetTitle}</h2><button onClick={onClose} className="close-sheet-btn"><FaTimes /></button></div>
                <div className="sheet-body">
                    {isLoading && <div className="sheet-feedback">Loading details...</div>}
                    {error && <div className="sheet-feedback error">{error}</div>}
                    {!isLoading && !error && details.length === 0 && <div className="sheet-feedback">No {dataType} events found.</div>}
                    {!isLoading && !error && details.length > 0 && (
                        <ul className="details-list">
                            {details.map((item, index) => (
                                <li key={`${item.EventCode}-${index}`} className="details-list-item">
                                    <div className="item-header"><strong className="item-title">{item.EventName || 'N/A'}</strong><span className="item-code">{item.EventCode}</span></div>
                                    <div className="item-body">
                                        <p><strong>Content:</strong> {item.ContentDetails || 'N/A'}</p>
                                        <p><strong>City:</strong> {item.fkCity || 'N/A'}</p>
                                        <p><strong>Date:</strong> {item.FromDate ? new Date(item.FromDate).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};


const FlippableCityCard = memo(({ year, onYearChange, years = [], data, isLoading, error, onItemClick }) => { const [isFlipped, setIsFlipped] = useState(false); const cityCount = Array.isArray(data) ? data.length : 0; const currentCities = Array.isArray(data) ? data : []; const handleItemClick = (e, cityName) => { e.stopPropagation(); onItemClick('City', cityName); }; return ( <div className="chart-widget"> <div className="chart-widget-header"> <h3>Cities Visited</h3> <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}> {years.length > 0 ? ( <select value={year} onChange={(e) => onYearChange(Number(e.target.value))} onClick={(e) => e.stopPropagation()} > {years.map(y => <option key={y} value={y}>{y}</option>)} </select> ) : ( <select disabled><option>Loading...</option></select> )} {isFlipped && (<button className="icon-btn" title="Show count" onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}><FaSyncAlt /></button>)} </div> </div> <div className="chart-container" onClick={() => !isLoading && !error && cityCount > 0 && setIsFlipped(!isFlipped)}> {isLoading ? ( <div className="chart-feedback">Loading...</div> ) : error ? ( <div className="chart-feedback error">{error}</div> ) : cityCount === 0 ? ( <div className="chart-feedback">No data available for {year}.</div> ) : ( <div className="flippable-card-content"> {!isFlipped ? ( <div className="city-count-view"> <div className="count">{cityCount}</div> <p className="muted-text">Cities visited in {year}</p> <p className="muted-text" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Click to view list</p> </div> ) : ( <div className="city-list-view"> <div className="city-list-grid"> {currentCities.map((city, index) => ( <div key={`${city.name}-${index}`} className="city-list-item" onClick={(e) => handleItemClick(e, city.name)}> <div className="city-list-item-index">{index + 1}</div> <span className="city-list-item-name">{city.name}</span> <FaInfoCircle className="item-details-icon" /> </div> ))} </div> </div> )} </div> )} </div> </div> ); });
const FlippableCountryCard = memo(({ year, onYearChange, years = [], data, isLoading, error, onItemClick }) => { const [isFlipped, setIsFlipped] = useState(false); const countryCount = Array.isArray(data) ? data.length : 0; const currentCountries = Array.isArray(data) ? data : []; const handleItemClick = (e, countryName) => { e.stopPropagation(); onItemClick('Country', countryName); }; return ( <div className="chart-widget"> <div className="chart-widget-header"> <h3>Countries Visited</h3> <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}> {years.length > 0 ? ( <select value={year} onChange={(e) => onYearChange(Number(e.target.value))} onClick={(e) => e.stopPropagation()} > {years.map(y => <option key={y} value={y}>{y}</option>)} </select> ) : ( <select disabled><option>Loading...</option></select> )} {isFlipped && (<button className="icon-btn" title="Show count" onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}><FaSyncAlt /></button>)} </div> </div> <div className="chart-container" onClick={() => !isLoading && !error && countryCount > 0 && setIsFlipped(!isFlipped)}> {isLoading ? ( <div className="chart-feedback">Loading...</div> ) : error ? ( <div className="chart-feedback error">{error}</div> ) : countryCount === 0 ? ( <div className="chart-feedback">No data available for {year}.</div> ) : ( <div className="flippable-card-content"> {!isFlipped ? ( <div className="city-count-view"> <div className="count" style={{color: '#00C4FF'}}>{countryCount}</div> <p className="muted-text">Countries visited in {year}</p> <p className="muted-text" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Click to view list</p> </div> ) : ( <div className="city-list-view"> <div className="city-list-grid"> {currentCountries.map((country, index) => ( <div key={`${country.name}-${index}`} className="city-list-item" onClick={(e) => handleItemClick(e, country.name)}> <div className="city-list-item-index" style={{backgroundColor: '#00C4FF'}}>{index + 1}</div> <span className="city-list-item-name">{country.name}</span> <FaInfoCircle className="item-details-icon" /> </div> ))} </div> </div> )} </div> )} </div> </div> ); });
const SatsangHoursWidget = memo(({ year, onYearChange, years = [], data, isLoading, error, onItemClick }) => { const [viewMode, setViewMode] = useState('yearwise'); if (isLoading) return <div className="chart-widget"><div className="chart-feedback">Loading Satsang Data...</div></div>; if (error) return <div className="chart-widget"><div className="chart-feedback error">{error}</div></div>; if (!data) return <div className="chart-widget"><div className="chart-feedback">No Satsang Data available.</div></div>; const totalHours = data?.yearwise?.[year] || 0; const countryHours = data?.countrywise?.[year] || {}; const countryEntries = Object.entries(countryHours).sort((a, b) => b[1] - a[1]); return ( <div className="chart-widget"> <div className="chart-widget-header"> <h3><FaRegClock style={{ marginRight: '8px' }}/>Satsang Hours</h3> <select value={year} onChange={(e) => onYearChange(Number(e.target.value))}> {years.map(y => <option key={y} value={y}>{y}</option>)} </select> </div> <div className="view-toggle"> <button className={`toggle-btn ${viewMode === 'yearwise' ? 'active' : ''}`} onClick={() => setViewMode('yearwise')}>Year Total</button> <button className={`toggle-btn ${viewMode === 'countrywise' ? 'active' : ''}`} onClick={() => setViewMode('countrywise')}>By Country</button> </div> <div className="chart-container"> {viewMode === 'yearwise' ? ( <div className="city-count-view"> <div className="count" style={{color: '#FFBB28'}}>{totalHours}</div> <p className="muted-text">Total hours in {year}</p> <p className="muted-text" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Across all countries</p> </div> ) : ( <div className="city-list-view"> <div className="satsang-list"> {countryEntries.map(([country, hours], index) => ( <div key={country} className="satsang-list-item" onClick={() => onItemClick('satsangHours', country)}> <div className="satsang-list-item-info"> <div className="city-list-item-index" style={{backgroundColor: '#FFBB28'}}>{index + 1}</div> <span>{country}</span> </div> <div className="satsang-hours-display"> <strong>{hours}</strong> <span>hrs</span> <FaInfoCircle className="item-details-icon" /> </div> </div> ))} </div> </div> )} </div> </div> ); });

// --- ADDITION 2 of 3: Update DynamicLeafletMap to accept onPopupClick ---
const DynamicLeafletMap = memo(({ year, onYearChange, years, data, isLoading, error, onPopupClick }) => {
    if (isLoading) return <div className="chart-widget1"><div className="chart-feedback">Loading Map Data...</div></div>;
    if (error) return <div className="chart-widget1"><div className="chart-feedback error">{error}</div></div>;
    const createCustomIcon = (total) => { const size = 15; return L.divIcon({ className: 'leaflet-div-icon-custom', iconSize: [size, size], iconAnchor: [size / 2, size / 2], }); };
    return (<div className="chart-widget1"><div className="chart-widget-header"><h3>Global Distribution</h3><select value={year} onChange={(e) => onYearChange(Number(e.target.value))}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div><div className="chart-container"><MapContainer center={[25, 20]} zoom={2} scrollWheelZoom={false} style={{ width: '100%', height: '100%' }}><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />{data.map((country) => { const total = country.pratishthas + country.padhramanis; if (total === 0) return null; return (<Marker key={country.name} position={[country.lat, country.lng]} icon={createCustomIcon(total)}><Popup><div className="map-popup-content"><h4>{country.name}</h4><div className="map-popup-row clickable" onClick={() => onPopupClick('Pratishtha', country.name)}><span>Pratishthas:</span> <strong>{country.pratishthas}</strong></div><div className="map-popup-row clickable" onClick={() => onPopupClick('Padhramani', country.name)}><span>Padhramanis:</span> <strong>{country.padhramanis}</strong></div></div></Popup></Marker>);})}</MapContainer></div></div>);
});


// --- MAIN DASHBOARD COMPONENT ---
function Dashboard() {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [viewTitle, setViewTitle] = useState("Dashboard");
    const [selectedYear, setSelectedYear] = useState(0);
    const [availableYears, setAvailableYears] = useState([]);
    const [countryData, setCountryData] = useState([]);
    const [isCountryDataLoading, setIsCountryDataLoading] = useState(true);
    const [countryDataError, setCountryDataError] = useState(null);
    const [cityData, setCityData] = useState([]);
    const [isCityDataLoading, setIsCityDataLoading] = useState(true);
    const [cityDataError, setCityDataError] = useState(null);
    const [worldMapData, setWorldMapData] = useState([]);
    const [isWorldMapLoading, setIsWorldMapLoading] = useState(true);
    const [worldMapError, setWorldMapError] = useState(null);
    const [satsangHoursData, setSatsangHoursData] = useState(null);
    const [isSatsangHoursLoading, setIsSatsangHoursLoading] = useState(true);
    const [satsangHoursError, setSatsangHoursError] = useState(null);
    
    // This state is for the ORIGINAL sheet (for City/Country cards) and is UNCHANGED
    const [sheetState, setSheetState] = useState({ isOpen: false, dataType: null, selectedItem: null });
    const handleOpenDetails = useCallback((dataType, selectedItem) => { setSheetState({ isOpen: true, dataType, selectedItem }); }, []);
    const handleCloseDetails = useCallback(() => { setSheetState(prev => ({ ...prev, isOpen: false })); }, []);

    // --- ADDITION 3 of 3: New state and handlers exclusively for the map popup ---
    const [mapSheetState, setMapSheetState] = useState({ isOpen: false, dataType: null, selectedItem: null });
    const handleMapPopupClick = useCallback((dataType, selectedItem) => {
        setMapSheetState({ isOpen: true, dataType, selectedItem });
    }, []);
    const handleCloseMapSheet = useCallback(() => {
        setMapSheetState({ isOpen: false, dataType: null, selectedItem: null });
    }, []);
    
    const handleMenuClick = useCallback(() => setMenuOpen(prev => !prev), []);
    const handleCloseSidebar = useCallback(() => setMenuOpen(false), []);
    const handleOpenAssistant = useCallback(() => { setIsAssistantOpen(true); setMenuOpen(false); }, []);
    const handleCloseAssistant = useCallback(() => setIsAssistantOpen(false), []);

    useEffect(() => {
        const years = [2025, 2024, 2023];
        setAvailableYears(years);
        setSelectedYear(years[0]);
    }, []);

    useEffect(() => {
        if (!selectedYear || selectedYear === 0) return;
        setIsCountryDataLoading(true);
        setIsCityDataLoading(true);
        setIsWorldMapLoading(true);
        const fetchDashboardData = async () => {
            try {
                const countriesPromise = fetch(`${API_BASE_URL}/dashboard/countries-visited?year=${selectedYear}`);
                const citiesPromise = fetch(`${API_BASE_URL}/dashboard/cities-visited?year=${selectedYear}`);
                const worldMapPromise = fetch(`${API_BASE_URL}/dashboard/global-distribution?year=${selectedYear}`);
                const [countriesRes, citiesRes, worldMapRes] = await Promise.all([countriesPromise, citiesPromise, worldMapPromise]);
                if (countriesRes.ok) { const data = await countriesRes.json(); setCountryData(Array.isArray(data) ? data : []); } else { setCountryDataError("Could not load country data."); }
                if (citiesRes.ok) { const data = await citiesRes.json(); setCityData(Array.isArray(data) ? data : []); } else { setCityDataError("Could not load city data."); }
                if (worldMapRes.ok) { const data = await worldMapRes.json(); setWorldMapData(Array.isArray(data) ? data : []); } else { setWorldMapError("Could not load map data."); }
            } catch (error) {
                setCountryDataError("Network error loading data.");
                setCityDataError("Network error loading data.");
                setWorldMapError("Network error loading data.");
            } finally {
                setIsCountryDataLoading(false);
                setIsCityDataLoading(false);
                setIsWorldMapLoading(false);
            }
        };
        fetchDashboardData();
        setIsSatsangHoursLoading(true);
        setTimeout(() => {
            setSatsangHoursData(mockSatsangHoursData || null);
            setIsSatsangHoursLoading(false);
        }, 300);
    }, [selectedYear]);

    return (
        <div className={`layout ${menuOpen ? 'sidebar-open' : ''}`}>
            <Sidebar isOpen={menuOpen} setViewTitle={setViewTitle} onClose={handleCloseSidebar} navigate={navigate} onOpenAssistant={handleOpenAssistant} isAssistantOpen={isAssistantOpen} />
            <main className="main-content">
                <Header viewTitle={viewTitle} onMenuClick={handleMenuClick} />
                <div className="content-area">
                  <div className="dashboard-content-wrapper">
                    <AssistantSearchBar onSearchClick={handleOpenAssistant} />
                    <div className="charts-grid">
                        <FlippableCityCard year={selectedYear} onYearChange={setSelectedYear} years={availableYears} data={cityData} isLoading={isCityDataLoading} error={cityDataError} onItemClick={handleOpenDetails} />
                        <FlippableCountryCard year={selectedYear} onYearChange={setSelectedYear} years={availableYears} data={countryData} isLoading={isCountryDataLoading} error={countryDataError} onItemClick={handleOpenDetails} />
                        <SatsangHoursWidget year={selectedYear} onYearChange={setSelectedYear} years={availableYears} data={satsangHoursData} isLoading={isSatsangHoursLoading} error={satsangHoursError} onItemClick={handleOpenDetails} />
                    </div>
                    <br/>
                    <div className="charts-grid1">
                         <DynamicLeafletMap 
                            year={selectedYear} 
                            onYearChange={setSelectedYear} 
                            years={availableYears} 
                            data={worldMapData} 
                            isLoading={isWorldMapLoading} 
                            error={worldMapError} 
                            onPopupClick={handleMapPopupClick} // Pass the NEW handler
                        />
                    </div>
                  </div>
                </div>
                <AssistantPanel isOpen={isAssistantOpen} onClose={handleCloseAssistant} currentPath="/" onNavigate={navigate} />
                
                {/* The ORIGINAL sheet, driven by the ORIGINAL state */}
                <DataDetailsSheet 
                    isOpen={sheetState.isOpen} 
                    onClose={handleCloseDetails} 
                    dataType={sheetState.dataType} 
                    selectedItem={sheetState.selectedItem} 
                    year={selectedYear} 
                />

                {/* The NEW sheet, driven by the NEW state */}
                <MapEventDetailsSheet 
                    isOpen={mapSheetState.isOpen}
                    onClose={handleCloseMapSheet}
                    dataType={mapSheetState.dataType}
                    selectedItem={mapSheetState.selectedItem}
                    year={selectedYear}
                />
            </main>
        </div>
    );
}

export default Dashboard;