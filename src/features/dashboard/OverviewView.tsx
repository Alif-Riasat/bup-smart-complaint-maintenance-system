import React from 'react';
import {
  Plus,
  FileText,
  Clock,
  Settings,
  Check,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Complaint, ComplaintPriority, ComplaintStatus } from '../../types/complaint';

interface OverviewViewProps {
  onNewComplaint: () => void;
  onViewAllComplaints: () => void;
  onSelectComplaint: (complaintId: string) => void;
  onOpenHelpDesk: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNewComplaint,
  onViewAllComplaints,
  onSelectComplaint,
  onOpenHelpDesk,
}) => {
  const { currentUser, complaints, statusHistory } = useApp();
  const canFileComplaint = currentUser.role === 'student' || currentUser.role === 'faculty';

  const firstName = currentUser.name.split(' ')[0];

  const totalCount = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === 'Pending').length;
  const inProgressCount = complaints.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;
  const resolutionRate = totalCount === 0 ? 0 : Math.round((resolvedCount / totalCount) * 100);

  const now = new Date();
  const sameMonth = (value?: string) => {
    if (!value) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  };
  const sameDay = (value?: string) => {
    if (!value) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date.toDateString() === now.toDateString();
  };
  const addedThisMonth = complaints.filter((c) => sameMonth(c.submissionDate)).length;
  const needAssignment = complaints.filter(
    (c) => !c.assignedStaffId && (c.status === 'Pending' || c.status === 'Assigned'),
  ).length;
  const inProgressIds = new Set(
    complaints.filter((c) => c.status === 'In Progress').map((c) => c.id),
  );
  const updatedToday = new Set(
    statusHistory
      .filter((item) => sameDay(item.updatedDate) && inProgressIds.has(item.complaintId))
      .map((item) => item.complaintId),
  ).size;

  // Recent 5 complaints matching screenshot
  const recentComplaints = complaints.slice(0, 5);

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(new Date()).toUpperCase();

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Top Banner / Greeting matching Image 1 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            {todayFormatted}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
            Good morning, {firstName}.
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Here's what's happening across campus maintenance today.
          </p>
        </div>

        {canFileComplaint && (
        <button
          onClick={onNewComplaint}
          className="px-4 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New complaint</span>
        </button>
        )}
      </div>

      {/* 4 Metric Cards Grid matching Image 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total complaints */}
        <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-zinc-600">Total complaints</span>
            <div className="w-9 h-9 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-zinc-900 tracking-tight">{totalCount}</div>
            <div className="text-xs text-zinc-400 mt-1">{addedThisMonth} added this month</div>
          </div>
        </div>

        {/* Card 2: Pending */}
        <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-zinc-600">Pending</span>
            <div className="w-9 h-9 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-zinc-900 tracking-tight">
              {pendingCount}
            </div>
            <div className="text-xs text-zinc-400 mt-1">{needAssignment} require assignment</div>
          </div>
        </div>

        {/* Card 3: In progress */}
        <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-zinc-600">In progress</span>
            <div className="w-9 h-9 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-600">
              <Settings className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-zinc-900 tracking-tight">
              {inProgressCount}
            </div>
            <div className="text-xs text-zinc-400 mt-1">{updatedToday} updated today</div>
          </div>
        </div>

        {/* Card 4: Resolved */}
        <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-zinc-600">Resolved</span>
            <div className="w-9 h-9 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-600">
              <Check className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-zinc-900 tracking-tight">
              {resolvedCount}
            </div>
            <div className="text-xs text-zinc-400 mt-1">{resolutionRate}% resolution rate</div>
          </div>
        </div>
      </div>

      {/* Recent Complaints Card matching Image 1 */}
      <div className="rounded-2xl bg-white border border-zinc-200/90 shadow-xs overflow-hidden">
        {/* Table Header */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Recent complaints</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Latest requests submitted across campus</p>
          </div>

          <button
            onClick={onViewAllComplaints}
            className="px-3.5 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">REFERENCE</th>
                <th className="px-6 py-3.5">COMPLAINT</th>
                <th className="px-6 py-3.5">LOCATION</th>
                <th className="px-6 py-3.5">CREATED</th>
                <th className="px-6 py-3.5">PRIORITY</th>
                <th className="px-6 py-3.5">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {recentComplaints.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-zinc-500">
                    No complaints yet.{canFileComplaint ? ' Use New complaint to add the first one.' : ''}
                  </td>
                </tr>
              )}
              {recentComplaints.map((item) => {
                const isUrgent = item.priority === 'Emergency' || item.priority === 'High';
                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectComplaint(item.id)}
                    className="hover:bg-zinc-50/80 transition-colors cursor-pointer"
                  >
                    {/* REFERENCE */}
                    <td className="px-6 py-4 font-bold text-zinc-900 whitespace-nowrap">
                      {item.id}
                    </td>

                    {/* COMPLAINT */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-900">{item.title}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">{item.categoryName}</div>
                    </td>

                    {/* LOCATION */}
                    <td className="px-6 py-4 text-zinc-600 whitespace-nowrap">
                      {item.buildingName} · {item.roomArea}
                    </td>

                    {/* CREATED */}
                    <td className="px-6 py-4 text-zinc-500 whitespace-nowrap">
                      {item.submissionDate}
                    </td>

                    {/* PRIORITY */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-3.5 rounded-full ${
                            item.priority === 'Emergency'
                              ? 'bg-orange-600'
                              : item.priority === 'High'
                              ? 'bg-zinc-900'
                              : item.priority === 'Medium'
                              ? 'bg-zinc-400'
                              : 'bg-zinc-300'
                          }`}
                        />
                        <span className="font-semibold text-zinc-800">
                          {item.priority === 'Emergency' ? 'Urgent' : item.priority}
                        </span>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.status === 'Resolved' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black text-white text-[11px] font-bold">
                          ● Resolved
                        </span>
                      ) : item.status === 'Closed' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black text-white text-[11px] font-bold">
                          ● Closed
                        </span>
                      ) : item.status === 'Pending' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-dashed border-zinc-400 text-zinc-700 text-[11px] font-bold">
                          ● Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                          {item.status}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Bottom Help / Public Link (matching Image 1 & 3 bottom right) */}
      <div className="fixed bottom-6 right-6 flex items-center gap-2 z-20">
        <button
          onClick={onOpenHelpDesk}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-zinc-200 text-xs font-semibold text-zinc-800 shadow-md hover:bg-zinc-50 transition-all cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
          <span>Public site</span>
        </button>

        <button
          onClick={onOpenHelpDesk}
          className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shadow-lg hover:bg-zinc-800 transition-all cursor-pointer"
          title="Campus Help & Support"
        >
          <span className="font-bold text-sm">?</span>
        </button>
      </div>
    </div>
  );
};
