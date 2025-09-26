// DEVELOPMENT BANNER: Info banner for demo mode and authentication status
import { useState } from 'react';
import { X, Info, Mail, Shield } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';

export const DevelopmentBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const { user } = useAuth();

  if (!isVisible || !user) return null;

  const isDemoMode = user.id === 'demo_user_123' || user.accessToken === 'demo_access_token_123';

  if (!isDemoMode) return null;

  return (
    <Alert className="mx-4 mt-4 bg-gradient-to-r from-amber-500/15 to-orange-500/15 border-amber-500/30 text-amber-100 shadow-lg">
      <Info className="h-4 w-4 text-amber-400" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <strong className="text-amber-300 text-lg">🎭 Demo Mode Active</strong>
            <p className="text-sm text-amber-200/90 mt-1">
              This is a demonstration of the Data Library App UI. All data is mocked and features are simulated for showcase purposes.
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-amber-300 border-amber-400/50 bg-amber-500/10">
              <Shield className="w-3 h-3 mr-1" />
              Demo User
            </Badge>
            <Badge variant="outline" className="text-amber-300 border-amber-400/50 bg-amber-500/10">
              <Mail className="w-3 h-3 mr-1" />
              Mock Data
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
};