// USER HEADER COMPONENT: Display authenticated user info in header area
import { useState } from 'react';
import { LogOut, User, Settings, Mail } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';

export const UserHeader = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-4 p-4 bg-slate-900/50 backdrop-blur-xl border-b border-slate-700/50">
      {/* USER HEADER: Welcome message */}
      <div className="flex-1">
        <h1 className="text-lg text-white">Welcome back, {user.name.split(' ')[0]}!</h1>
        <p className="text-sm text-slate-400">Manage your data library and user invitations</p>
      </div>

      {/* USER HEADER: Authenticated status indicator */}
      <Badge variant="outline" className="text-green-400 border-green-400/50">
        <Mail className="w-3 h-3 mr-1" />
        Gmail Connected
      </Badge>

      {/* USER HEADER: User profile dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.picture} alt={user.name} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-slate-800/95 backdrop-blur-xl border-slate-700/50" align="end" forceMount>
          <div className="flex flex-col space-y-1 p-2">
            <p className="text-sm font-medium text-slate-100">{user.name}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
          <DropdownMenuSeparator className="bg-slate-700/50" />
          <DropdownMenuItem className="text-slate-100 hover:bg-slate-700/50">
            <User className="mr-2 h-4 w-4" />
            Profile Settings
          </DropdownMenuItem>
          <DropdownMenuItem className="text-slate-100 hover:bg-slate-700/50">
            <Settings className="mr-2 h-4 w-4" />
            App Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-slate-700/50" />
          <DropdownMenuItem 
            className="text-red-400 hover:bg-red-500/20"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};