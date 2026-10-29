import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Filter,
  Check,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NotificationsViewProps {
  onSelectComplaint: (id: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  onSelectComplaint,
}) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, currentUser } = useApp();
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'resolution' | 'assignment'>('all');

  const userNotifications = currentUser.role === 'admin' || currentUser.role === 'authority'
    ? notifications
    : notifications.filter((n) => n.userId === currentUser.id);

  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  const filtered = userNotifications.filter((n) => {
    if (filterType === 'unread') return !n.isRead;
    if (filterType === 'resolution') return n.type === 'resolution';
    if (filterType === 'assignment') return n.type === 'assignment';
    return true;
  });

  return (
    <div className="space-y-6 font-sans pb-16 max-w-4xl text-zinc-900">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-zinc-400 mb-1">
            Workspace / <span className="text-zinc-600 font-medium">Notifications</span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            Notifications &amp; Activity
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Live status updates on campus ticket assignments, technician arrival, and issue completions.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsAsRead}
            className="px-4 py-2.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-800 flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-zinc-600" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { key: 'all', label: `All Updates (${userNotifications.length})` },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'resolution', label: 'Resolutions' },
          { key: 'assignment', label: 'Dispatches & Tasks' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterType === tab.key
                ? 'bg-black text-white shadow-xs'
                : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications Cards Feed */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-zinc-200/90 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-3 text-zinc-400">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">No notifications found</h3>
            <p className="text-xs text-zinc-500 mt-1">
              {filterType === 'unread' ? 'You have marked all updates as read!' : 'You have no notifications in this category.'}
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                markNotificationAsRead(item.id);
                if (item.complaintId) onSelectComplaint(item.complaintId);
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                item.isRead
                  ? 'bg-white hover:bg-zinc-50/80 border-zinc-200 shadow-2xs'
                  : 'bg-zinc-50 hover:bg-zinc-100/90 border-zinc-300 shadow-xs ring-1 ring-black/5'
              }`}
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className="shrink-0 mt-0.5">
                  {item.type === 'resolution' ? (
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : item.type === 'rejection' ? (
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-800 flex items-center justify-center font-bold">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-zinc-200 text-zinc-800 flex items-center justify-center font-bold">
                      <Clock className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-zinc-900 bg-white border border-zinc-200 px-2 py-0.5 rounded-md">
                      {item.complaintId}
                    </span>
                    <span className="text-zinc-300">•</span>
                    <span className="text-[11px] text-zinc-400 font-medium">{item.notificationDate}</span>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-black ml-1" title="Unread" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-800 leading-relaxed font-medium">
                    {item.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <span className="text-xs font-bold text-zinc-900 hover:underline flex items-center gap-1">
                  <span>View ticket</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
