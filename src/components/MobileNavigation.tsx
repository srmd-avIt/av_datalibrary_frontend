import React, { useState } from 'react';
import { Menu, X, Home, Database, Bot, Users, Map, Calendar, FileText, Music, Hash, Layers, Gift, Flag, MapPin, Tag, Globe, Book, Film, Edit, User } from 'lucide-react';
import { Button } from './ui/button';

interface MobileNavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeView,
  onViewChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Main navigation items (most commonly used)
  const mainNavigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'events', label: 'Events', icon: Map },
    { id: 'medialog', label: 'Media Log', icon: Database },
    { id: 'digitalrecordings', label: 'Recordings', icon: Calendar },
  ];

  // All navigation items for the sidebar menu
  const allNavigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'events', label: 'Events', icon: Map },
    { id: 'digitalrecordings', label: 'Digital Recordings', icon: Calendar },
    { id: 'medialog', label: 'Media Log', icon: Database },
    { id: 'aux', label: 'Aux Files', icon: FileText },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
    { id: 'user-management', label: 'User Management', icon: User },
    // Master Data items
    { id: 'audio', label: 'Audio', icon: Music },
    { id: 'bhajanType', label: 'Bhajan Type', icon: Music },
    { id: 'digitalMasterCategory', label: 'Digital Master Category', icon: Database },
    { id: 'distributionLabel', label: 'Distribution Label', icon: Tag },
    { id: 'editingType', label: 'Editing Type', icon: Edit },
    { id: 'eventCategory', label: 'Event Category', icon: Calendar },
    { id: 'footageType', label: 'Footage Type', icon: Film },
    { id: 'formatType', label: 'Format Type', icon: Layers },
    { id: 'granths', label: 'Granths', icon: Book },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'newEventCategory', label: 'New Event Category', icon: Tag },
    { id: 'newCities', label: 'New Cities', icon: MapPin },
    { id: 'newCountries', label: 'New Countries', icon: Flag },
    { id: 'newStates', label: 'New States', icon: Map },
    { id: 'occasions', label: 'Occasions', icon: Gift },
    { id: 'topicNumberSource', label: 'Topic Number Source', icon: Hash },
  ];

  const handleItemClick = (viewId: string) => {
    onViewChange(viewId);
    setIsOpen(false);
  };

  // Find the current active view details
  const currentActiveItem = [...mainNavigationItems, ...allNavigationItems].find(item => item.id === activeView);
  const currentActiveLabel = currentActiveItem?.label || 'Dashboard';

  return null; // No mobile footer - navigation handled by sidebar
};
