import React, { useState, useCallback, memo, useRef, useEffect } from 'react';
import { FaMicrophone, FaTimes, FaPaperPlane } from 'react-icons/fa';

// --- QUERY PARSER LOGIC (The "Brain") ---
const getYear = (text) => {
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : null;
};

const getYearRange = (text) => {
  const match = text.match(/\b((19|20)\d{2})\s*–\s*((19|20)\d{2})\b/);
  if (match) {
    return { min: match[1], max: match[3] };
  }
  return null;
};

const parseQuery = (query, currentPath) => {
  const lowerQuery = query.toLowerCase();
  let result = {
    status: 'error',
    feedback: "Sorry, I didn't understand that. Please try rephrasing.",
    action: 'NONE',
    payload: {},
  };

  if (lowerQuery.includes('satsang')) {
    const speakerMatch = lowerQuery.match(/by speaker (.+)/i);
    const filters = speakerMatch ? { EventRemarks: speakerMatch[1].trim() } : {};
    return {
      status: 'success',
      feedback: `Okay, I'll navigate to Satsangs. ${speakerMatch ? `Filtering by speaker: ${speakerMatch[1].trim()}` : ''}`,
      action: 'NAVIGATE_AND_FILTER',
      payload: { path: '/digitalrecording', filters, searchQuery: speakerMatch ? '' : 'Satsang' },
    };
  }

  if (lowerQuery.includes('clip')) {
     const year = getYear(lowerQuery);
     const tagMatch = lowerQuery.match(/tagged ‘(.+?)’/i);
     let feedback = `Okay, searching for clips${year ? ` from ${year}` : ''}${tagMatch ? ` with the tag "${tagMatch[1]}"` : ''}.`;
     return {
        status: 'info',
        feedback: `${feedback} (Note: The "Clips" view is not yet implemented, but this is how I would search.)`,
        action: 'NONE',
        payload: {}
     }
  }
  
  if (currentPath === '/') {
    const yearRange = getYearRange(lowerQuery);
    const singleYear = getYear(lowerQuery);
    if (yearRange || singleYear || lowerQuery.includes('gujarat')) {
      const newFilters = {};
      let feedback = "Okay, searching events ";
      if (yearRange) {
        newFilters.Yr = { min: yearRange.min, max: yearRange.max };
        feedback += `between ${yearRange.min} and ${yearRange.max}`;
      } else if (singleYear) {
        newFilters.Yr = { min: singleYear, max: singleYear };
        feedback += `from ${singleYear}`;
      }
      if (lowerQuery.includes('gujarat')) {
        newFilters.EventRemarks = 'Gujarat';
        feedback += `${yearRange || singleYear ? ' in' : 'in'} Gujarat`;
      }
      return {
        status: 'success',
        feedback: feedback.trim() + '.',
        action: 'FILTER',
        payload: { filters: newFilters, searchQuery: '' },
      };
    }
  }

  return result;
};


// --- ASSISTANT COMPONENT (The UI and State) ---
const Assistant = memo(({ isOpen, onClose, onNavigate, onApplyFilters, onClearAllFilters, currentPath }) => {
  const initialMessage = { role: 'assistant', text: "Hello! How can I help you find data today?" };

  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([initialMessage]);
  const messagesEndRef = useRef(null);

  // --- Core Handler ---
  const handleApplyQuery = useCallback((query) => {
    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', text: query }]);
    
    // Parse the query
    const result = parseQuery(query, currentPath);

    // Add assistant feedback to UI
    setMessages(prev => [...prev, { role: 'assistant', text: result.feedback }]);
    
    // Execute the action if successful
    if (result.status === 'success') {
      onClearAllFilters(); // Always clear previous state before a new action

      const { payload } = result;
      if (result.action === 'FILTER') {
        onApplyFilters({ filters: payload.filters, searchQuery: payload.searchQuery });
      } else if (result.action === 'NAVIGATE_AND_FILTER') {
        onNavigate(payload.path);
        // Apply filters shortly after navigation to allow the parent component to update
        setTimeout(() => {
          onApplyFilters({ filters: payload.filters, searchQuery: payload.searchQuery });
        }, 100);
      }
    }
  }, [currentPath, onApplyFilters, onClearAllFilters, onNavigate]);

  // --- UI Event Handlers ---
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      handleApplyQuery(inputValue.trim());
      setInputValue('');
    }
  };

  const handleSuggestionClick = (query) => {
    handleApplyQuery(query);
  };

  const handleClearChat = useCallback(() => {
    setMessages([initialMessage]);
  }, [initialMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  const suggestions = [
    "List events held in Gujarat from 2020–2024",
    "Find all satsangs by a speaker",
    "Show clips tagged ‘Celebrations: Bhakti’ from 2023",
  ];

  return (
    <aside className="assistant-panel">
      <div className="assistant-panel-header">
        <h2><FaMicrophone /> Assistant</h2>
        <div className="assistant-header-actions">
          <button type="button" className="clear-chat-btn" title="Clear conversation" onClick={handleClearChat}>
            Clear
          </button>
          <button type="button" className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>
      </div>
      <div className="assistant-panel-body">
        <div className="chat-history">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.role}`}>
              <div className="chat-bubble">{msg.text}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="assistant-suggestions">
          {messages.length <= 1 && suggestions.map((q, i) => (
             <button key={i} className="suggestion-chip" onClick={() => handleSuggestionClick(q)}>{q}</button>
          ))}
        </div>
      </div>
       <div className="assistant-panel-footer">
        <form onSubmit={handleSubmit} className="assistant-input-form">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask something..."
            autoFocus
          />
          <button type="submit" title="Send"><FaPaperPlane /></button>
        </form>
      </div>
    </aside>
  );
});

export default Assistant;