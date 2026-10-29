import React, { useState } from 'react';
import {
  Wrench,
  CheckCircle2,
  Clock,
  Play,
  AlertTriangle,
  Building2,
  User,
  Phone,
  Mail,
  Filter,
  Check,
  X,
  Send,
  Camera,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Complaint, ComplaintPriority } from '../../types/complaint';
import { ComplaintDetailModal } from '../user/ComplaintDetailModal';

export const MaintenanceDashboard: React.FC = () => {
  const { complaints, updateStaffProgress, currentUser, maintenanceStaff } = useApp();

  const [filterMode, setFilterMode] = useState<'all' | 'assigned' | 'in-progress' | 'resolved'>('all');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  // Resolution Modal State
  const [resolvingComplaint, setResolvingComplaint] = useState<Complaint | null>(null);
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [isSubmittingResolution, setIsSubmittingResolution] = useState(false);

  const isTechnician = currentUser.role === 'maintenance';
  const technicianId = currentUser.id === 'staff-1-user' ? 'staff-1' : currentUser.id;

  const technicianTasks = complaints.filter((c) => {
    if (isTechnician) {
      if (c.assignedStaffId === technicianId) return true;
      if (c.departmentId === 'dept-electrical' && !c.assignedStaffId) return true;
      return false;
    }
    return !!c.assignedStaffId;
  });

  const displayTasks = technicianTasks.filter((t) => {
    if (filterMode === 'assigned' && t.status !== 'Assigned') return false;
    if (filterMode === 'in-progress' && t.status !== 'In Progress') return false;
    if (filterMode === 'resolved' && t.status !== 'Resolved' && t.status !== 'Closed') return false;
    return true;
  });

  const handleStartWork = (complaintId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateStaffProgress(
      complaintId,
      'In Progress',
      `Technician ${currentUser.name} has arrived on site and started diagnostic and repair work.`
    );
  };

  const handleOpenResolveModal = (complaint: Complaint, e: React.MouseEvent) => {
    e.stopPropagation();
    setResolvingComplaint(complaint);
    setResolutionRemarks('');
  };

  const handleSubmitResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingComplaint || !resolutionRemarks.trim()) return;

    setIsSubmittingResolution(true);
    updateStaffProgress(
      resolvingComplaint.id,
      'Resolved',
      resolutionRemarks.trim()
    );
    setIsSubmittingResolution(false);
    setResolvingComplaint(null);
  };

  const pendingCount = technicianTasks.filter((t) => t.status === 'Assigned').length;
  const inProgressCount = technicianTasks.filter((t) => t.status === 'In Progress').length;
  const resolvedCount = technicianTasks.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;

  return (
    <div className="space-y-6 text-[#f2e7d1]">
      {/* Technician Banner */}
      <div className="rounded-2xl border-2 border-[#f2e7d1]/20 bg-[#121212] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-orange-600 text-white flex items-center gap-1.5 shadow-sm">
              <Wrench className="w-3.5 h-3.5" />
              Field Technician &amp; Maintenance Portal
            </span>
            <span className="text-xs text-[#f2e7d1]/70">• Estate &amp; Facilities Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Assigned Work Orders — {currentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#f2e7d1]/80 mt-1 max-w-xl leading-relaxed">
            Update work status directly from the field, add repair notes, and mark tasks as resolved for user verification.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="text-right hidden sm:block bg-black px-4 py-2 rounded-xl border border-[#f2e7d1]/20">
            <div className="text-[11px] text-[#f2e7d1]/60 font-medium">Technician ID</div>
            <div className="text-sm font-mono font-bold text-orange-400">{currentUser.studentOrEmployeeId}</div>
          </div>
        </div>
      </div>

      {/* Task Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#141414] border border-[#f2e7d1]/20 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-[#f2e7d1]/70 font-bold block mb-1">Awaiting Inspection</span>
            <span className="text-2xl font-black text-orange-400">{pendingCount}</span>
            <span className="text-[11px] text-[#f2e7d1]/50 block">Assigned but not started</span>
          </div>
          <div className="p-3 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#141414] border border-[#f2e7d1]/20 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-[#f2e7d1]/70 font-bold block mb-1">Currently In Progress</span>
            <span className="text-2xl font-black text-white">{inProgressCount}</span>
            <span className="text-[11px] text-[#f2e7d1]/50 block">Under active repair</span>
          </div>
          <div className="p-3 rounded-xl bg-white text-black font-bold">
            <Play className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#141414] border border-[#f2e7d1]/20 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-[#f2e7d1]/70 font-bold block mb-1">Resolved Tasks</span>
            <span className="text-2xl font-black text-[#f2e7d1]">{resolvedCount}</span>
            <span className="text-[11px] text-[#f2e7d1]/50 block">Repairs completed</span>
          </div>
          <div className="p-3 rounded-xl bg-[#f2e7d1] text-black">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-[#121212] p-2 rounded-xl border border-[#f2e7d1]/20">
        {[
          { id: 'all', label: `All Tasks (${technicianTasks.length})` },
          { id: 'assigned', label: `Awaiting Start (${pendingCount})` },
          { id: 'in-progress', label: `In Progress (${inProgressCount})` },
          { id: 'resolved', label: `Resolved (${resolvedCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterMode(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterMode === tab.id
                ? 'bg-[#f2e7d1] text-black shadow-xs'
                : 'text-[#f2e7d1]/70 hover:text-white hover:bg-[#222222]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {displayTasks.length === 0 ? (
          <div className="p-12 text-center bg-[#121212] border-2 border-[#f2e7d1]/20 rounded-2xl">
            <Wrench className="w-10 h-10 text-[#f2e7d1]/40 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">No tasks in this category</h3>
            <p className="text-xs text-[#f2e7d1]/70">All assigned maintenance tickets are currently caught up.</p>
          </div>
        ) : (
          displayTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedComplaintId(task.id)}
              className="p-5 rounded-2xl bg-[#141414] border border-[#f2e7d1]/20 hover:border-orange-500/60 transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group shadow-sm"
            >
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-black bg-[#f2e7d1] px-2.5 py-0.5 rounded shadow-sm">
                    {task.id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      task.priority === 'Emergency'
                        ? 'bg-red-950 text-red-300 border border-red-700'
                        : task.priority === 'High'
                        ? 'bg-orange-950 text-orange-300 border border-orange-600'
                        : 'bg-black text-[#f2e7d1]/70 border border-[#f2e7d1]/20'
                    }`}
                  >
                    {task.priority} Priority
                  </span>
                  <span className="text-xs font-bold text-[#f2e7d1]/90">• {task.categoryName}</span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                  {task.title}
                </h3>

                <p className="text-xs text-[#f2e7d1]/70 line-clamp-2 max-w-2xl leading-relaxed">
                  {task.description}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#f2e7d1]/70 pt-1">
                  <span className="flex items-center gap-1.5 text-white font-medium">
                    <Building2 className="w-3.5 h-3.5 text-orange-400" />
                    {task.buildingName} - {task.roomArea} ({task.floor})
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#f2e7d1]/50" />
                    {task.userName} ({task.userPhone})
                  </span>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-[#f2e7d1]/15">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    task.status === 'Resolved'
                      ? 'bg-[#f2e7d1] text-black'
                      : task.status === 'In Progress'
                      ? 'bg-orange-600 text-white'
                      : 'bg-black text-[#f2e7d1] border border-[#f2e7d1]/20'
                  }`}
                >
                  {task.status}
                </span>

                {task.status === 'Assigned' && (
                  <button
                    onClick={(e) => handleStartWork(task.id, e)}
                    className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-700/40 transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Start Work</span>
                  </button>
                )}

                {task.status === 'In Progress' && (
                  <button
                    onClick={(e) => handleOpenResolveModal(task, e)}
                    className="px-3.5 py-2 rounded-xl bg-[#f2e7d1] hover:bg-white text-black text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                    <span>Mark Resolved</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedComplaintId(task.id)}
                  className="p-2 rounded-xl bg-[#222222] hover:bg-[#333333] text-[#f2e7d1] text-xs transition-colors"
                  title="View full ticket details"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mark Resolved Modal */}
      {resolvingComplaint && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs text-[#f2e7d1]">
          <div className="bg-[#121212] border-2 border-[#f2e7d1]/20 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2e7d1]/15">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#f2e7d1] text-black">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Complete &amp; Resolve Task</h3>
                  <span className="font-mono text-xs text-orange-400 font-bold">{resolvingComplaint.id}</span>
                </div>
              </div>
              <button
                onClick={() => setResolvingComplaint(null)}
                className="text-[#f2e7d1]/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#f2e7d1]/80">
              Ticket: <strong className="text-white">{resolvingComplaint.title}</strong>
            </p>

            <form onSubmit={handleSubmitResolution} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#f2e7d1]/90 mb-1">
                  Resolution Remarks &amp; Actions Taken (FR-08)
                </label>
                <textarea
                  rows={4}
                  required
                  value={resolutionRemarks}
                  onChange={(e) => setResolutionRemarks(e.target.value)}
                  placeholder="Describe what was repaired or replaced (e.g., cleared drain line, replaced power fuse, calibrated sensor, reset access point)..."
                  className="w-full bg-black border border-[#f2e7d1]/20 rounded-xl p-3 text-xs text-white placeholder-[#f2e7d1]/40 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingComplaint(null)}
                  className="px-4 py-2 rounded-xl bg-[#222222] text-[#f2e7d1] text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResolution}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Submit &amp; Mark Resolved</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complaint Details Modal */}
      <ComplaintDetailModal
        complaintId={selectedComplaintId}
        onClose={() => setSelectedComplaintId(null)}
      />
    </div>
  );
};
