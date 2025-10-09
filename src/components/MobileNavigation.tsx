import React, { useState } from 'react';
import { Menu, X, Home, Database, Bot, Users, Settings } from 'lucide-react';
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

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'clickup', label: 'Data View', icon: Database },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
    { id: 'user-management', label: 'Users', icon: Users },
  ];

  const handleItemClick = (viewId: string) => {
    onViewChange(viewId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white/90 backdrop-blur-sm"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm">
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 mt-8">
                Data Library
              </h2>
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`
                        w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors
                        ${activeView === item.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-4 h-16">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`
                  flex flex-col items-center justify-center space-y-1 transition-colors
                  ${activeView === item.id
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
