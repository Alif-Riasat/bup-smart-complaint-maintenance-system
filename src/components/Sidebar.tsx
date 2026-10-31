import React from 'react';
import {
  LayoutGrid,
  Plus,
  FileText,
  Bell,
  BarChart3,
  Users,
  Building2,
  Settings,
  Wrench,
  HelpCircle,
  X,
  MapPin,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export type NavItemKey =
  | 'overview'
  | 'new-complaint'
  | 'my-complaints'
  | 'campus-map'
  | 'notifications'
  | 'admin-analytics'
  | 'all-complaints'
  | 'users-access'
  | 'categories-locations'
  | 'settings'
  | 'maintenance-tasks'
  | 'solved';

interface SidebarProps {
  currentNav: NavItemKey;
  onNavigate: (key: NavItemKey) => void;
  onOpenHelpDesk: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentNav,
  onNavigate,
  onOpenHelpDesk,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { currentUser, notifications } = useApp();

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'authority';
  const isMaintenance = currentUser.role === 'maintenance';
  const canFileComplaint = currentUser.role === 'student' || currentUser.role === 'faculty';

  const userNotifications = isAdmin
    ? notifications
    : notifications.filter((n) => n.userId === currentUser.id);
  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  const handleNavClick = (key: NavItemKey) => {
    onNavigate(key);
    if (onCloseMobile) onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col justify-between h-full">
      {/* Top Brand Block */}
      <div>
        <div className="p-5 flex items-center justify-between border-b border-[#1a1c22]">
          <button
            type="button"
            onClick={() => handleNavClick('overview')}
            className="flex items-center gap-3 text-left min-w-0"
            aria-label="Go to overview"
          >
            <div className="w-10 h-10 rounded-xl bg-black border border-zinc-700/80 flex items-center justify-center font-black text-xs text-white tracking-wider shadow-sm shrink-0">
              BUP
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-white text-sm tracking-tight leading-tight truncate">
                Maintenance
              </h1>
              <p className="text-xs text-zinc-400 truncate">Smart service portal</p>
            </div>
          </button>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-850"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-6">
          {/* WORKSPACE SECTION */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              WORKSPACE
            </div>

            <button
              onClick={() => handleNavClick('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                currentNav === 'overview'
                  ? 'bg-white text-black shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span>Overview</span>
            </button>

            {canFileComplaint && (
            <button
              onClick={() => handleNavClick('new-complaint')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                currentNav === 'new-complaint'
                  ? 'bg-white text-black shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>New complaint</span>
            </button>
            )}

            {!isAdmin && (
            <button
              onClick={() => handleNavClick('my-complaints')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                currentNav === 'my-complaints'
                  ? 'bg-white text-black shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>{isMaintenance ? 'Active tasks' : 'My complaints'}</span>
            </button>
            )}

            <button
              onClick={() => handleNavClick('campus-map')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                currentNav === 'campus-map'
                  ? 'bg-white text-black shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <MapPin className="w-4 h-4 shrink-0" />
              <span>Campus map</span>
            </button>

            <button
              onClick={() => handleNavClick('notifications')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                currentNav === 'notifications'
                  ? 'bg-white text-black shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 shrink-0" />
                <span>Notifications</span>
              </div>
              {unreadCount > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  currentNav === 'notifications'
                    ? 'bg-black text-white'
                    : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                }`}>
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                currentNav === 'settings'
                  ? 'bg-white text-black shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Settings</span>
            </button>
          </div>

          {/* TECHNICIAN OPERATIONS */}
          {isMaintenance && (
            <div className="space-y-1">
              <div className="px-3 pb-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                TECHNICIAN
              </div>
              <button
                onClick={() => handleNavClick('maintenance-tasks')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                  currentNav === 'maintenance-tasks'
                    ? 'bg-white text-black shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                <Wrench className="w-4 h-4 shrink-0" />
                <span>Assigned work orders</span>
              </button>
              <button
                onClick={() => handleNavClick('solved')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                  currentNav === 'solved'
                    ? 'bg-white text-black shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                <Check className="w-4 h-4 shrink-0" />
                <span>Solved work</span>
              </button>
            </div>
          )}

          {/* ADMINISTRATION SECTION */}
          {isAdmin && (
            <div className="space-y-1">
              <div className="px-3 pb-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                ADMINISTRATION
              </div>

              <button
                onClick={() => handleNavClick('admin-analytics')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                  currentNav === 'admin-analytics'
                    ? 'bg-white text-black shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span>Admin analytics</span>
              </button>

              <button
                onClick={() => handleNavClick('all-complaints')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                  currentNav === 'all-complaints'
                    ? 'bg-white text-black shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>All complaints</span>
              </button>

              <button
                onClick={() => handleNavClick('users-access')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                  currentNav === 'users-access'
                    ? 'bg-white text-black shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Users &amp; access</span>
              </button>

              <button
                onClick={() => handleNavClick('solved')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                  currentNav === 'solved'
                    ? 'bg-white text-black shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                <Check className="w-4 h-4 shrink-0" />
                <span>Solved work</span>
              </button>

              <button
                onClick={() => handleNavClick('categories-locations')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                  currentNav === 'categories-locations'
                    ? 'bg-white text-black shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Categories &amp; locations</span>
              </button>


            </div>
          )}
        </div>
      </div>

      {/* Bottom Assistance Block */}
      <div className="p-4 border-t border-[#1a1c22]">
        <div className="p-3.5 rounded-2xl bg-[#121418] border border-[#21242d] space-y-2">
          <h4 className="font-bold text-xs text-white">Need assistance?</h4>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Contact campus support for urgent maintenance.
          </p>
          <button
            onClick={() => {
              onOpenHelpDesk();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full py-2 rounded-xl bg-[#1c1f26] hover:bg-[#252a34] text-xs font-semibold text-zinc-200 transition-colors cursor-pointer text-center"
          >
            View help desk
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#0b0c0e] border-r border-[#1a1c22] flex-col justify-between shrink-0 min-h-screen text-zinc-300 font-sans sticky top-0 h-screen overflow-y-auto selection:bg-orange-500 selection:text-white">
        {navContent}
      </aside>

      {/* 2. Mobile Responsive Off-Canvas Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity cursor-pointer animate-fadeIn"
            onClick={onCloseMobile}
          />
          <aside className="fixed inset-y-0 left-0 w-72 bg-[#0b0c0e] border-r border-[#1a1c22] z-50 flex flex-col justify-between text-zinc-300 font-sans shadow-2xl animate-in slide-in-from-left duration-200 overflow-y-auto">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
};
