import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Download, X } from 'lucide-react';
import { Card } from './ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
  };

  if (!showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <Card className="fixed bottom-20 left-4 right-4 z-40 p-4 shadow-lg bg-white md:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Download className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Install Data Library App
            </h3>
            <p className="text-xs text-gray-600">
              Get the full app experience
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            onClick={handleInstallClick}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Install
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
