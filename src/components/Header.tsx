import React, { useState } from 'react';
import {
  Search,
  Bell,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Menu,
  UserCheck,
  Settings as SettingsIcon,
  HelpCircle,
  Users
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  pageTitle: string;
  onOpenNotifications: () => void;
  onOpenSearch: () => void;
  onOpenMobileMenu?: () => void;
  onNavigateSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  pageTitle,
  onOpenNotifications,
  onOpenSearch,
  onOpenMobileMenu,
  onNavigateSettings,
}) => {
  const { currentUser, notifications, logout, lastSyncedAt } = useApp();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'authority';
  const userNotifications = isAdmin
    ? notifications
    : notifications.filter((n) => n.userId === currentUser.id);
  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(currentUser.name);

  return (
    <header className="h-16 bg-white border-b border-zinc-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 font-sans">
      {/* Left: Mobile Hamburger + Title / Breadcrumbs */}
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-zinc-600 hover:text-black hover:bg-zinc-100 transition-colors cursor-pointer"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-400">
              BUP SERVICE DESK
            </span>
            <button
              onClick={logout}
              className="text-[10px] font-medium text-zinc-500 hover:text-black hover:underline cursor-pointer transition-colors"
              title="Return to Public Landing Page"
            >
              • Public site
            </button>
          </div>
          <h2 className="text-base font-bold text-zinc-900 tracking-tight leading-tight flex items-center gap-2">
            {pageTitle}
            {lastSyncedAt && <span className="text-[10px] font-semibold text-emerald-700">Live {lastSyncedAt}</span>}
          </h2>
        </div>
      </div>

      {/* Right: Search, Notification & Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Search Bar */}
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-full border border-zinc-200 bg-zinc-50/80 hover:bg-zinc-100/80 text-xs text-zinc-500 transition-colors w-60 lg:w-64 justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">Search complaints, rooms...</span>
          </div>
          <kbd className="text-[10px] bg-white border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-400 font-mono flex items-center gap-0.5 shadow-2xs">
            <span>⌘</span>
            <span>K</span>
          </kbd>
        </button>

        {/* Search icon button on mobile */}
        <button
          onClick={onOpenSearch}
          className="md:hidden p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications Icon Button */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Avatar with Initials */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-1.5 p-1 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center shadow-sm">
              {initials}
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500 hidden sm:block" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-zinc-200 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="pb-3 border-b border-zinc-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-zinc-900 truncate">{currentUser.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-zinc-100 text-zinc-800">
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 truncate mt-0.5">{currentUser.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200">
                  <ShieldCheck className="w-3 h-3 text-zinc-600" />
                  <span>
                    {currentUser.role === 'admin'
                      ? 'Administrator (Full Access)'
                      : currentUser.role === 'maintenance'
                      ? 'Field Technician'
                      : 'Student / Faculty'}
                  </span>
                </div>
              </div>

              <div className="py-2.5 border-b border-zinc-100 px-1">
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  This session stays on {currentUser.role}. Sign out to use another BUP account.
                </p>
              </div>

              {/* Settings Action */}
              {onNavigateSettings && (
                <div className="py-1.5 border-b border-zinc-100">
                  <button
                    onClick={() => {
                      onNavigateSettings();
                      setShowProfileMenu(false);
                    }}
                    className="w-full py-1.5 px-2.5 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <SettingsIcon className="w-3.5 h-3.5 text-zinc-500" />
                    <span>System settings</span>
                  </button>
                </div>
              )}

              {/* Logout Button */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
