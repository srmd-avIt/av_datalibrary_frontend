import React, { useEffect, useState } from 'react';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  className?: string;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  sidebar,
  className = '',
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className={`min-h-screen bg-gray-50 pb-16 ${className}`}>
        <main className="px-4 py-6">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen bg-gray-50 ${className}`}>
      {sidebar && (
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200">
          {sidebar}
        </aside>
      )}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};
