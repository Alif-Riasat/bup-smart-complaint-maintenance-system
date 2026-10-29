import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  X,
  Filter
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectComplaint?: (complaintId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onSelectComplaint,
}) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, currentUser } = useApp();
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');

  const userNotifications = currentUser.role === 'admin' || currentUser.role === 'authority'
    ? notifications
    : notifications.filter((n) => n.userId === currentUser.id);

  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  const displayList = filterMode === 'unread'
    ? userNotifications.filter((n) => !n.isRead)
    : userNotifications;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end font-sans">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity cursor-pointer animate-fadeIn"
        onClick={onClose} 
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white border-l border-zinc-200 shadow-2xl flex flex-col z-10 h-full text-zinc-900 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold shadow-2xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-zinc-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black text-white">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Real-time updates on ticket dispatch &amp; resolution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="text-xs text-zinc-600 hover:text-black flex items-center gap-1 font-semibold px-2 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark all</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tab bar */}
        <div className="px-5 py-2.5 border-b border-zinc-100 flex items-center justify-between bg-white text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-zinc-100 text-zinc-900 font-bold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              All ({userNotifications.length})
            </button>
            <button
              onClick={() => setFilterMode('unread')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filterMode === 'unread'
                  ? 'bg-zinc-100 text-zinc-900 font-bold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {/* List of Notifications */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {displayList.length === 0 ? (
            <div className="py-24 text-center text-zinc-400 text-xs">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                <Bell className="w-6 h-6 opacity-60" />
              </div>
              <p className="font-semibold text-zinc-600">No notifications to show</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {filterMode === 'unread' ? 'You have read all your updates.' : 'Updates on campus requests will appear here.'}
              </p>
            </div>
          ) : (
            displayList.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  markNotificationAsRead(notif.id);
                  if (onSelectComplaint && notif.complaintId) {
                    onSelectComplaint(notif.complaintId);
                    onClose();
                  }
                }}
                className={`p-4 rounded-2xl transition-all cursor-pointer flex gap-3 border ${
                  notif.isRead
                    ? 'bg-white hover:bg-zinc-50 border-zinc-200/80 text-zinc-700'
                    : 'bg-zinc-50/90 hover:bg-zinc-100/90 border-zinc-300 shadow-2xs text-zinc-900 ring-1 ring-black/5'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {notif.type === 'resolution' ? (
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : notif.type === 'rejection' ? (
                    <div className="w-8 h-8 rounded-xl bg-red-100 text-red-800 flex items-center justify-center font-bold">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center font-bold">
                      <Clock className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-xs font-bold text-zinc-900">
                      {notif.complaintId}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {notif.notificationDate}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-700 line-clamp-3">
                    {notif.message}
                  </p>
                  <div className="mt-2.5 flex items-center text-[11px] text-zinc-900 font-bold hover:underline">
                    <span>View complaint details</span>
                    <ArrowRight className="w-3 h-3 ml-1 text-zinc-500" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/70 text-center text-xs text-zinc-400">
          BUP Smart Maintenance Notification Desk
        </div>
      </div>
    </div>
  );
};
