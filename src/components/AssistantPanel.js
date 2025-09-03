import React, { useState, useCallback, memo, useRef, useEffect } from 'react';
import { FaMicrophone, FaTimes, FaPaperPlane } from 'react-icons/fa';

// --- QUERY PARSER LOGIC (The "Brain") - Updated for ALL Views ---
const parseQuery = (query, currentPath) => {
  const lowerQuery = query.toLowerCase();
  let result = {
    status: 'error',
    feedback: "Sorry, I didn't understand that. Please try rephrasing.",
    action: 'NONE',
    payload: {},
  };
  
  // --- CONTEXT: TIMELINE PAGE ---
  if (currentPath === '/timeline') {
    if (lowerQuery.includes('group by year')) { return { status: 'success', feedback: 'Grouping by Year.', action: 'SET_VIEW_OPTIONS', payload: { groupBy: 'Yr' } }; }
    if (lowerQuery.includes('group by month')) { return { status: 'success', feedback: 'Grouping by Month.', action: 'SET_VIEW_OPTIONS', payload: { groupBy: 'EventMonth' } }; }
    if (lowerQuery.includes('show grid')) { return { status: 'success', feedback: 'Switching to Grid View.', action: 'SET_VIEW_OPTIONS', payload: { viewMode: 'grid' } }; }
    if (lowerQuery.includes('show timeline')) { return { status: 'success', feedback: 'Switching to Timeline View.', action: 'SET_VIEW_OPTIONS', payload: { viewMode: 'timeline' } }; }
    const yearMatch = lowerQuery.match(/\b(20\d{2})\b/);
    if (yearMatch) { return { status: 'success', feedback: `Filtering for events in ${yearMatch[0]}.`, action: 'FILTER', payload: { filters: { Yr: { min: yearMatch[0], max: yearMatch[0] } }, searchQuery: '' } }; }
  }

  // --- CONTEXT: AUX FILES PAGE ---
  if (currentPath === '/auxfiles') {
    const typeMatch = lowerQuery.match(/(?:file type|type) (.+)/i);
    if (typeMatch && typeMatch[1]) {
      return { status: 'success', feedback: `Okay, filtering for file type: "${typeMatch[1].trim()}".`, action: 'FILTER', payload: { filters: { AuxFileType: typeMatch[1].trim() }, searchQuery: '' } };
    }
  }

  // --- CONTEXT: NEW MEDIA LOG PAGE ---
  if (currentPath === '/newmedialog') {
    // --- NEW: Handle filtering by State/Location for this page ---
    if (lowerQuery.includes('gujarat')) {
        return {
            status: 'success',
            feedback: `Okay, finding for Events held in Gujarat.`,
            action: 'FILTER',
            payload: { filters: { fkState: 'Gujarat' }, searchQuery: '' },
        };
    }

    const specialSpeakers = { 'pujya gurudevshri': 'Pujya Gurudevshri', 'gurudevshri': 'Pujya Gurudevshri' };
    for (const key in specialSpeakers) {
      if (lowerQuery.includes(key)) {
        return { status: 'success', feedback: `Okay, searching for logs by ${specialSpeakers[key]}.`, action: 'FILTER', payload: { filters: { SpeakerSinger: specialSpeakers[key] }, searchQuery: '' } };
      }
    }
    const speakerMatch = lowerQuery.match(/(?:speaker|by) (.+)/i);
    if (speakerMatch && speakerMatch[1]) {
      const speakerName = speakerMatch[1].trim();
      if (speakerName.length > 2) {
          return { status: 'success', feedback: `Searching for logs with speaker/singer: "${speakerName}".`, action: 'FILTER', payload: { filters: { SpeakerSinger: speakerName }, searchQuery: '' } };
      }
    }
    const languageMatch = lowerQuery.match(/\b(gujarati|hindi|english)\b/);
    if (languageMatch && languageMatch[1]) {
        const lang = languageMatch[1];
        const formattedLang = lang.charAt(0).toUpperCase() + lang.slice(1); 
        return { status: 'success', feedback: `Okay, filtering for language: "${formattedLang}".`, action: 'FILTER', payload: { filters: { Language: [formattedLang] }, searchQuery: '' } };
    }
  }
  
  // --- CONTEXT: DIGITAL RECORDING PAGE ---
  if (currentPath === '/digitalrecording') {
    const qcMatch = lowerQuery.match(/(?:qc status|status) (done|pending|error)/i);
    if (qcMatch && qcMatch[1]) {
      const status = qcMatch[1].charAt(0).toUpperCase() + qcMatch[1].slice(1);
      return { status: 'success', feedback: `Filtering recordings with QC Status: "${status}".`, action: 'FILTER', payload: { filters: { Qcstatus: status }, searchQuery: '' } };
    }
  }

  // --- General Navigation Queries ---
  if (lowerQuery.includes('show events') || lowerQuery.includes('go to events')) {
    return { status: 'success', feedback: `Okay, I'll navigate to the Events page.`, action: 'NAVIGATE_AND_FILTER', payload: { path: '/', filters: {}, searchQuery: '' } };
  }
  if (lowerQuery.includes('media log')) {
    return { status: 'success', feedback: `Okay, I'll navigate to the New Media Log page.`, action: 'NAVIGATE_AND_FILTER', payload: { path: '/newmedialog', filters: {}, searchQuery: '' } };
  }

  return result;
};


// --- ASSISTANT COMPONENT (The UI and State) ---
const AssistantPanel = memo(({ isOpen, onClose, onNavigate, onApplyFilters, onClearAllFilters, onSetViewOptions, currentPath }) => {
  const initialMessage = { role: 'assistant', text: "Hello! How can I help you find data today?" };
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([initialMessage]);
  const messagesEndRef = useRef(null);

  const handleApplyQuery = useCallback((query) => {
    setMessages(prev => [...prev, { role: 'user', text: query }]);
    const result = parseQuery(query, currentPath);
    setMessages(prev => [...prev, { role: 'assistant', text: result.feedback }]);
    
    if (result.status === 'success') {
      const { payload } = result;
      if (result.action === 'FILTER') {
        onClearAllFilters();
        onApplyFilters({ filters: payload.filters, searchQuery: payload.searchQuery });
      } else if (result.action === 'NAVIGATE_AND_FILTER') {
        onClearAllFilters();
        onNavigate(payload.path);
        setTimeout(() => {
          onApplyFilters({ filters: payload.filters, searchQuery: payload.searchQuery });
        }, 100);
      } else if (result.action === 'SET_VIEW_OPTIONS' && onSetViewOptions) {
        onSetViewOptions(payload);
      }
    }
  }, [currentPath, onApplyFilters, onClearAllFilters, onNavigate, onSetViewOptions]);

  const handleSubmit = (e) => { e.preventDefault(); if (inputValue.trim()) { handleApplyQuery(inputValue.trim()); setInputValue(''); } };
  const handleSuggestionClick = (query) => handleApplyQuery(query);
  const handleClearChat = useCallback(() => setMessages([initialMessage]), [initialMessage]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  if (!isOpen) return null;
  
  let suggestions = [];
  if (currentPath === '/timeline' || currentPath === '/') {
    suggestions = ["show events from 2023", "show me the media log"];
  } else if (currentPath === '/auxfiles') {
    suggestions = ["Find file type srt", "Show files in Gujarati", "Show me the media log"];
  } else if (currentPath === '/newmedialog') {
    // Updated suggestion to include the new feature for this page
    suggestions = ["Find Events held in Gujarat", "Find all satsangs by Pujya Gurudevshri", "Show me all Gujarati language Satsangs"];
  } else if (currentPath === '/digitalrecording') {
    suggestions = ["Show recordings with status done", "Find informal recordings", "Show me the media log"];
  } else {
    suggestions = ["Show me the media log", "Go to events"];
  }

  return (
    <aside className="assistant-panel">
      <div className="assistant-panel-header">
        <h2><FaMicrophone /> Assistant</h2>
        <div className="assistant-header-actions">
          <button type="button" className="clear-chat-btn" title="Clear conversation" onClick={handleClearChat}>Clear</button>
          <button type="button" className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>
      </div>
      <div className="assistant-panel-body">
        <div className="chat-history">
          {messages.map((msg, index) => (<div key={index} className={`chat-message ${msg.role}`}><div className="chat-bubble">{msg.text}</div></div>))}
          <div ref={messagesEndRef} />
        </div>
        <div className="assistant-suggestions">
          {messages.length <= 1 && suggestions.map((q, i) => (<button key={i} className="suggestion-chip" onClick={() => handleSuggestionClick(q)}>{q}</button>))}
        </div>
      </div>
       <div className="assistant-panel-footer">
        <form onSubmit={handleSubmit} className="assistant-input-form">
          <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Ask something..." autoFocus />
          <button type="submit" title="Send"><FaPaperPlane /></button>
        </form>
      </div>
    </aside>
  );
});

export default AssistantPanel;