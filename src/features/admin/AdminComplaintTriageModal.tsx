import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  UserCheck,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Send,
  UserX,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Complaint, ComplaintPriority } from '../../types/complaint';

interface AdminComplaintTriageModalProps {
  complaint: Complaint | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminComplaintTriageModal: React.FC<AdminComplaintTriageModalProps> = ({
  complaint,
  onClose,
  onSuccess,
}) => {
  const { maintenanceStaff, assignComplaint, rejectComplaint, closeComplaint } = useApp();

  const [selectedStaffId, setSelectedStaffId] = useState(
    complaint?.assignedStaffId || maintenanceStaff[0]?.id || ''
  );
  const [priority, setPriority] = useState<ComplaintPriority>(
    complaint?.priority || 'Medium'
  );
  const [assignNotes, setAssignNotes] = useState('');
  
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  if (!complaint) return null;

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) return;

    assignComplaint(complaint.id, selectedStaffId, priority, assignNotes);
    onSuccess();
    onClose();
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;

    rejectComplaint(complaint.id, rejectionReason.trim());
    onSuccess();
    onClose();
  };

  const handleCloseVerified = () => {
    closeComplaint(complaint.id, 'Verified and closed by University Administration.');
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs font-sans text-zinc-900 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-zinc-200/90 relative">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center font-bold shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900">Admin Triage &amp; Work Dispatch</h2>
                <span className="font-mono text-xs font-bold text-zinc-800 bg-zinc-200/80 px-2 py-0.5 rounded-md">
                  {complaint.id}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Verify report validity and route to campus maintenance division
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Complaint Summary Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-700">{complaint.categoryName}</span>
              <span className="text-xs text-zinc-400">{complaint.submissionDate}</span>
            </div>
            <h3 className="text-sm font-bold text-zinc-900">{complaint.title}</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">{complaint.description}</p>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 pt-2 border-t border-zinc-200/70">
              <span className="flex items-center gap-1 text-zinc-800 font-semibold">
                <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                {complaint.buildingName} · {complaint.roomArea}
              </span>
              <span>
                Reported by: <strong className="text-zinc-800">{complaint.userName}</strong> ({complaint.studentOrEmployeeId})
              </span>
            </div>
          </div>

          {!isRejecting ? (
            <form onSubmit={handleAssign} className="space-y-5">
              {/* Priority Selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Triage Priority / Urgency
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Low', 'Normal', 'High', 'Urgent'] as ComplaintPriority[]).map((p) => {
                    const isSelected = priority === p || (p === 'Normal' && priority === 'Medium') || (p === 'Urgent' && priority === 'Emergency');
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? p === 'Urgent'
                              ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                              : 'bg-black text-white border-black shadow-2xs'
                            : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Maintenance Staff Assignment */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Assign To Maintenance Personnel</span>
                  <span className="text-[11px] text-zinc-400 font-normal">Active task load</span>
                </label>

                <div className="space-y-2">
                  {maintenanceStaff.map((staff) => {
                    const isSelected = selectedStaffId === staff.id;
                    return (
                      <div
                        key={staff.id}
                        onClick={() => setSelectedStaffId(staff.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                            : 'bg-white border-zinc-200 text-zinc-800 hover:border-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isSelected ? 'bg-white text-black' : 'bg-zinc-100 text-zinc-700'
                            }`}
                          >
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-xs">{staff.name}</div>
                            <div className={`text-[11px] ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                              {staff.departmentName} • {staff.specialization}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                            isSelected
                              ? 'bg-zinc-800 text-white border-zinc-700'
                              : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                          }`}>
                            {staff.activeTasksCount} active task{staff.activeTasksCount === 1 ? '' : 's'}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-white bg-white text-black' : 'border-zinc-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-black stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Administrative Notes / Priority Instructions
                </label>
                <input
                  type="text"
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. Inspect before 2:00 PM lecture; bring replacement HDMI cable..."
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black transition-colors"
                />
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  className="px-3.5 py-2.5 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Reject Complaint</span>
                </button>

                <div className="flex items-center gap-2">
                  {complaint.status === 'Resolved' && (
                    <button
                      type="button"
                      onClick={handleCloseVerified}
                      className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verify &amp; Close Ticket</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch &amp; Assign</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleReject} className="space-y-4 bg-red-50/70 border border-red-200 p-5 rounded-2xl">
              <div className="flex items-center gap-2 text-red-700 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Formal Complaint Rejection</span>
              </div>
              <p className="text-xs text-red-800 leading-relaxed">
                Specify the institutional reason for declining this request. The submitter will receive this message in their notification feed.
              </p>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Rejection Reason / Justification
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Outside campus maintenance jurisdiction; duplicate report; equipment scheduled for university decommissioning..."
                  className="w-full bg-white border border-red-200 rounded-xl p-3 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsRejecting(false)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 text-xs font-semibold hover:bg-zinc-50 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer shadow-2xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
