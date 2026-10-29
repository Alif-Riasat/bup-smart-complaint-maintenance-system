import React, { useState } from 'react';
import {
  ShieldAlert,
  Bell,
  UserCheck,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Layers,
  Wrench,
  GraduationCap,
  Briefcase,
  LogOut
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NavbarProps {
  activePortal: 'user' | 'maintenance' | 'admin';
  setActivePortal: (portal: 'user' | 'maintenance' | 'admin') => void;
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePortal,
  setActivePortal,
  onOpenNotifications,
}) => {
  const { currentUser, setCurrentUser, availableUsers, notifications, resetToDefaultData, logout } = useApp();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Filter unread notifications
  const userNotifications =
    currentUser.role === 'admin' || currentUser.role === 'authority'
      ? notifications
      : notifications.filter((n) => n.userId === currentUser.id);
  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  const handleSelectUser = (user: typeof currentUser) => {
    setCurrentUser(user);
    if (user.role === 'admin' || user.role === 'authority') {
      setActivePortal('admin');
    } else if (user.role === 'maintenance') {
      setActivePortal('maintenance');
    } else {
      setActivePortal('user');
    }
    setShowUserDropdown(false);
  };

  return (
    <header className="bg-black border-b border-[#f2e7d1]/15 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & BUP Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f2e7d1] text-black font-black flex items-center justify-center text-xs tracking-wider shadow-sm shrink-0">
              BUP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-tight leading-tight">
                  BUP Smart Maintenance
                </span>
                <span className="hidden md:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-600/20 text-orange-400 border border-orange-500/30">
                  FST • ICT Dept
                </span>
              </div>
              <p className="text-[11px] text-[#f2e7d1]/70 hidden sm:block">
                Complaint &amp; Maintenance Management System
              </p>
            </div>
          </div>

          {/* Portal Switcher Tabs (Separated Dashboards) */}
          <div className="hidden lg:flex items-center bg-[#121212] p-1 rounded-xl border border-[#f2e7d1]/15">
            <button
              onClick={() => setActivePortal('user')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePortal === 'user'
                  ? 'bg-[#f2e7d1] text-black shadow-sm'
                  : 'text-[#f2e7d1]/70 hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student &amp; Faculty Portal</span>
            </button>

            <button
              onClick={() => setActivePortal('maintenance')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePortal === 'maintenance'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-[#f2e7d1]/70 hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Maintenance Staff</span>
            </button>

            <button
              onClick={() => setActivePortal('admin')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePortal === 'admin'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-[#f2e7d1]/70 hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
          </div>

          {/* Right Action Icons: Notification, User Switcher, Logout, Reset */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-[#f2e7d1]/80 hover:text-white hover:bg-[#1a1a1a] transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-orange-500 text-white font-bold text-[10px] flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Quick Reset Data Button */}
            <div className="relative">
              <button
                onClick={() => setShowResetConfirm(!showResetConfirm)}
                className="p-2 rounded-lg text-[#f2e7d1]/70 hover:text-white hover:bg-[#1a1a1a] transition-colors"
                title="Reset demo data to proposal default"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {showResetConfirm && (
                <div className="absolute right-0 mt-2 w-64 bg-[#121212] border-2 border-[#f2e7d1]/20 rounded-xl p-3 shadow-2xl z-50">
                  <p className="text-xs text-white font-bold mb-1">Reset to Proposal Data?</p>
                  <p className="text-[11px] text-[#f2e7d1]/70 mb-3">
                    Restores all initial complaints, categories, and locations from the project proposal.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        resetToDefaultData();
                        setShowResetConfirm(false);
                      }}
                      className="px-2.5 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold"
                    >
                      Reset Now
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="px-2.5 py-1 rounded bg-[#262626] hover:bg-[#333333] text-[#f2e7d1] text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#171717] hover:bg-[#222222] border border-[#f2e7d1]/20 transition-all text-left"
              >
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-[#f2e7d1]/30"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#f2e7d1] text-black flex items-center justify-center font-bold text-xs">
                    {currentUser.name[0]}
                  </div>
                )}
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-white leading-none truncate max-w-[120px]">
                    {currentUser.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-orange-400 capitalize font-medium mt-0.5">
                    {currentUser.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#f2e7d1]/60 hidden sm:block" />
              </button>

              {/* Dropdown Menu */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-[#121212] border-2 border-[#f2e7d1]/20 rounded-xl shadow-2xl p-2 z-50 space-y-1">
                  <div className="px-2.5 py-1.5 text-[11px] font-bold text-[#f2e7d1]/60 uppercase tracking-wider border-b border-[#f2e7d1]/15">
                    Switch Test Account
                  </div>
                  {availableUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left text-xs transition-colors ${
                        currentUser.id === user.id
                          ? 'bg-[#f2e7d1] text-black font-bold'
                          : 'hover:bg-[#1f1f1f] text-[#f2e7d1]'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-[#262626] flex items-center justify-center text-[10px] font-bold text-[#f2e7d1] shrink-0">
                        {user.role === 'admin' ? 'AD' : user.role === 'maintenance' ? 'MT' : user.role === 'faculty' ? 'FC' : 'ST'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold truncate ${currentUser.id === user.id ? 'text-black' : 'text-white'}`}>
                          {user.name}
                        </div>
                        <div className={`text-[10px] truncate ${currentUser.id === user.id ? 'text-black/80' : 'text-[#f2e7d1]/60'}`}>
                          {user.departmentName}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        currentUser.id === user.id ? 'bg-black text-[#f2e7d1]' : 'bg-[#262626] text-[#f2e7d1]/70'
                      }`}>
                        {user.role}
                      </span>
                    </button>
                  ))}

                  {/* Sign Out Action inside Dropdown */}
                  <div className="pt-2 border-t border-[#f2e7d1]/15 mt-1">
                    <button
                      onClick={logout}
                      className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs font-bold bg-orange-600/20 text-orange-400 hover:bg-orange-600 hover:text-white transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out &amp; Return to Login</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Logout Button */}
            <button
              onClick={logout}
              className="p-2 rounded-lg text-[#f2e7d1]/80 hover:text-orange-400 hover:bg-[#1a1a1a] transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Portal Navigation Bar */}
        <div className="flex lg:hidden overflow-x-auto gap-2 py-2 border-t border-[#f2e7d1]/15 no-scrollbar">
          <button
            onClick={() => setActivePortal('user')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
              activePortal === 'user'
                ? 'bg-[#f2e7d1] text-black'
                : 'text-[#f2e7d1]/70 bg-[#171717]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>User Portal</span>
          </button>
          <button
            onClick={() => setActivePortal('maintenance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
              activePortal === 'maintenance'
                ? 'bg-orange-600 text-white'
                : 'text-[#f2e7d1]/70 bg-[#171717]'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Maintenance Staff</span>
          </button>
          <button
            onClick={() => setActivePortal('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
              activePortal === 'admin'
                ? 'bg-white text-black'
                : 'text-[#f2e7d1]/70 bg-[#171717]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Admin Panel</span>
          </button>
        </div>
      </div>
    </header>
  );
};
