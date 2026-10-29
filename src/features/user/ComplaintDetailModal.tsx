import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  User,
  Building2,
  AlertTriangle,
  Star,
  Send,
  Calendar,
  Wrench,
  Printer,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Complaint, ComplaintStatus } from '../../types/complaint';
import { priorityClass, priorityLabel } from '../../utils/priority';

interface ComplaintDetailModalProps {
  complaintId: string | null;
  onClose: () => void;
}

const LIFECYCLE_STEPS: { status: ComplaintStatus; label: string; desc: string }[] = [
  { status: 'Pending', label: 'Submitted', desc: 'Complaint logged in portal' },
  { status: 'Assigned', label: 'Assigned', desc: 'Routed to maintenance team' },
  { status: 'In Progress', label: 'In Progress', desc: 'Technician on-site repairing' },
  { status: 'Resolved', label: 'Resolved', desc: 'Work completed by staff' },
  { status: 'Closed', label: 'Closed', desc: 'Verified & completed' },
];

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaintId,
  onClose,
}) => {
  const { complaints, statusHistory, submitFeedback, requestFollowUp, currentUser, availableUsers } = useApp();
  const [rating, setRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [followUpNote, setFollowUpNote] = useState('');
  const [followUpError, setFollowUpError] = useState('');
  const [followUpSent, setFollowUpSent] = useState(false);

  const complaint = complaints.find((c) => c.id === complaintId);
  const submitter = availableUsers?.find(
    (u) => u.id === complaint?.userId || u.studentOrEmployeeId === complaint?.studentOrEmployeeId
  );
  const history = statusHistory
    .filter((h) => h.complaintId === complaintId)
    .sort((a, b) => {
      if (a.updatedDate !== b.updatedDate) return a.updatedDate < b.updatedDate ? 1 : -1;
      return a.id < b.id ? 1 : -1;
    });

  if (!complaint) return null;

  const stepStatus = complaint.status === 'Escalated' || complaint.escalated ? 'In Progress' : complaint.status;
  const currentStepIndex = LIFECYCLE_STEPS.findIndex((s) => s.status === stepStatus);
  const isRejected = complaint.status === 'Rejected';

  const handleCopyId = () => {
    navigator.clipboard.writeText(complaint.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitFeedback(complaint.id, rating, feedbackComment);
    setFeedbackSubmitted(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs font-sans text-zinc-900 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-zinc-200/90 flex flex-col max-h-[92vh] relative">
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-zinc-100 flex items-start justify-between bg-zinc-50/70 gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <button
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-zinc-900 bg-white border border-zinc-200 px-2.5 py-1 rounded-lg hover:bg-zinc-100 transition-colors shadow-2xs cursor-pointer"
                title="Click to copy Ticket ID"
              >
                <span>{complaint.id}</span>
                {copiedId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                )}
              </button>

              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${priorityClass(complaint.priority)}`}>
                {priorityLabel(complaint.priority)} Priority
              </span>

              <span className="text-xs text-zinc-500 font-medium">
                • {complaint.categoryName}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 leading-snug">
              {complaint.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
              title="Print work order"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
          {/* Status Lifecycle Stepper */}
          {!isRejected ? (
            <div className="p-5 rounded-2xl bg-zinc-50/80 border border-zinc-200/80">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Lifecycle Progress
                </span>
                <span className="text-xs font-bold text-zinc-900 bg-white border border-zinc-200 px-2.5 py-1 rounded-full shadow-2xs">
                  Current Status: <span className="font-extrabold">{complaint.status}</span>
                </span>
              </div>

              {/* Step indicator */}
              <div className="grid grid-cols-5 gap-2 relative">
                {LIFECYCLE_STEPS.map((step, idx) => {
                  const isCompleted = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={step.status} className="flex flex-col items-center text-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all shadow-2xs ${
                          isCurrent
                            ? 'bg-black text-white ring-4 ring-zinc-200 scale-105'
                            : isCompleted
                            ? 'bg-zinc-900 text-white'
                            : 'bg-white text-zinc-400 border border-zinc-200'
                        }`}
                      >
                        {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span
                        className={`text-xs font-bold leading-tight ${
                          isCurrent
                            ? 'text-zinc-900'
                            : isCompleted
                            ? 'text-zinc-800'
                            : 'text-zinc-400'
                        }`}
                      >
                        {step.label}
                      </span>
                      <span className="text-[10px] text-zinc-400 hidden sm:block mt-0.5 leading-none">
                        {step.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-red-900">Complaint Rejected</h4>
                <p className="text-xs text-red-700 mt-1 leading-relaxed">
                  Reason: {complaint.rejectionReason || 'Does not qualify for campus facilities maintenance.'}
                </p>
              </div>
            </div>
          )}

          {/* Location & Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs space-y-2">
              <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                Facility Location
              </h4>
              <p className="text-sm text-zinc-900 font-bold">{complaint.buildingName}</p>
              <div className="text-xs text-zinc-600 flex items-center gap-3">
                <span>Floor: <strong className="text-zinc-900 font-semibold">{complaint.floor}</strong></span>
                <span>Room/Area: <strong className="text-zinc-900 font-semibold">{complaint.roomArea}</strong></span>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs space-y-2">
              <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-500" />
                Reported By
              </h4>
              <p className="text-sm text-zinc-900 font-bold flex items-center gap-2 flex-wrap">
                <span>{complaint.userName}</span>
                <span className="text-xs font-normal text-zinc-500">({complaint.studentOrEmployeeId})</span>
                {submitter?.isRedFlagged && (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 text-[10px] font-bold">
                    🚩 Red-Flagged for Spam
                  </span>
                )}
              </p>
              <div className="text-xs text-zinc-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="capitalize font-semibold text-zinc-800">{complaint.userType}</span>
                <span className="flex items-center gap-1 text-zinc-500">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  {complaint.submissionDate}
                </span>
                {complaint.userPhone && (
                  <span className="font-mono text-zinc-500">{complaint.userPhone}</span>
                )}
              </div>
            </div>
          </div>

          {/* Full Description & Attached Image */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
              Issue Description
            </h4>
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs sm:text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </div>

            {complaint.acknowledgement && (
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700">
                <span className="font-bold text-zinc-900 block mb-1">Acknowledgement</span>
                {complaint.acknowledgement}
              </div>
            )}

            {complaint.status === 'On Hold' && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
                The officer flagged this complaint as <strong>On Hold</strong>. It is still open.
              </div>
            )}

            {complaint.escalated && complaint.userId === currentUser.id && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
                This complaint has been escalated to a senior officer{complaint.assignedStaffName ? `, ${complaint.assignedStaffName}` : ''}.
              </div>
            )}

            {currentUser.role === 'maintenance' && complaint.assignedStaffId && complaint.assignedStaffId !== currentUser.staffId && (
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700">
                You passed this complaint to <strong>{complaint.assignedStaffName}</strong>{complaint.assignedStaffRole ? `, ${complaint.assignedStaffRole}` : ''}. Their later progress is in the history below.
              </div>
            )}

            {complaint.imageUrl && (
              <div className="pt-2">
                <span className="text-xs text-zinc-600 font-bold block mb-2">
                  Supporting Photo Evidence:
                </span>
                <div className="rounded-2xl overflow-hidden border border-zinc-200 max-h-72 max-w-lg bg-zinc-100 shadow-xs">
                  <img
                    src={complaint.imageUrl}
                    alt="Photo proof for this complaint"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover hover:scale-102 transition-transform duration-300"
                  />
                </div>
              </div>
            )}
          </div>

            {complaint.videoUrl && (
              <div className="pt-2">
                <span className="text-xs text-zinc-600 font-bold block mb-2">Supporting video</span>
                <video src={complaint.videoUrl} controls className="w-full max-w-lg rounded-2xl border border-zinc-200" />
              </div>
            )}

          {/* Assignment & Resolution Info */}
          {complaint.assignedStaffName && (
            <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-zinc-700" />
                Assigned Maintenance Personnel
              </h4>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                <div>
                  <span className="text-zinc-900 font-bold text-sm">{complaint.assignedStaffName}</span>
                  <span className="text-zinc-500 block text-xs mt-0.5">{complaint.departmentName}</span>
                </div>
                {complaint.assignedDate && (
                  <span className="text-xs text-zinc-400 font-medium bg-zinc-50 px-2.5 py-1 rounded-lg border border-zinc-200">
                    Dispatched: {complaint.assignedDate}
                  </span>
                )}
              </div>

              {complaint.resolutionRemarks && (
                <div className="mt-3 pt-3 border-t border-zinc-100">
                  <span className="text-xs font-bold text-zinc-800 block mb-1">
                    Technician Resolution Summary:
                  </span>
                  <p className="text-xs text-zinc-700 bg-emerald-50/60 border border-emerald-200/80 p-3.5 rounded-xl leading-relaxed italic">
                    "{complaint.resolutionRemarks}"
                  </p>
                  {complaint.resolvedDate && (
                    <span className="text-[11px] text-zinc-400 block mt-1.5">
                      Completed on: {complaint.resolvedDate}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {complaint.userId === currentUser.id && !['Resolved', 'Closed', 'Rejected'].includes(complaint.status) && (
            <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Request a follow-up</h4>
              {complaint.canFollowUp ? (
                <form
                  className="space-y-3"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setFollowUpError('');
                    try {
                      await requestFollowUp(complaint.id, followUpNote.trim());
                      setFollowUpSent(true);
                      setFollowUpNote('');
                    } catch (err: any) {
                      setFollowUpError(err.message || 'The follow-up could not be sent.');
                    }
                  }}
                >
                  <p className="text-xs text-zinc-600">This complaint is past the waiting period for its priority. Tell the officer what still needs attention.</p>
                  <textarea
                    value={followUpNote}
                    onChange={(e) => setFollowUpNote(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs"
                    placeholder="The repair has not started and the room is still unusable."
                  />
                  {followUpError && <p className="text-xs text-red-600">{followUpError}</p>}
                  {followUpSent && <p className="text-xs text-emerald-700">Follow-up sent to the officer and the administrator.</p>}
                  <button type="submit" className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold">Send follow-up</button>
                </form>
              ) : (
                <p className="text-xs text-zinc-600">
                  A follow-up can be sent after {complaint.followUpEligibleAt || 'the waiting period'}. Current follow-ups: {complaint.followUpCount || 0}.
                </p>
              )}
            </div>
          )}

          {/* Feedback & Star Rating Form */}
          {(complaint.status === 'Resolved' || complaint.status === 'Closed') && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Service Quality &amp; Satisfaction Rating
                </h4>
                {complaint.feedbackRating && (
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {complaint.feedbackRating} / 5 Stars
                  </span>
                )}
              </div>

              {complaint.feedbackRating ? (
                <div className="text-xs text-zinc-700 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                  <p className="italic">"{complaint.feedbackComment || 'No comments provided.'}"</p>
                  <span className="text-[11px] text-zinc-400 block mt-2">
                    Submitted on: {complaint.feedbackDate || complaint.resolvedDate}
                  </span>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-3.5">
                  <p className="text-xs text-zinc-600">
                    How satisfied are you with the resolution of this issue?
                  </p>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-115 transition-transform cursor-pointer"
                        title={`${star} Star`}
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= rating
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-zinc-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-zinc-800 ml-2">
                      {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : 'Needs Improvement'}
                    </span>
                  </div>

                  <input
                    type="text"
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Optional feedback comment for the facilities administration..."
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black transition-colors"
                  />

                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Feedback &amp; Close Ticket</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Audit History Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              Audit Trail &amp; Status History
            </h4>
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
              {history.map((item) => (
                <div key={item.id} className="relative group">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-zinc-900 ring-4 ring-white" />
                  <div className="bg-white p-3.5 rounded-xl border border-zinc-200 text-xs shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-zinc-900">
                        Status updated to{' '}
                        <span className="text-black font-extrabold">{item.status}</span>
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">{item.updatedDate}</span>
                    </div>
                    <p className="text-zinc-600 text-xs leading-relaxed">{item.remarks}</p>
                    <div className="text-[10px] text-zinc-400 mt-1.5">
                      By: <span className="text-zinc-700 font-semibold">{item.updatedByName}</span> ({item.role})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 border-t border-zinc-100 bg-zinc-50/70 flex items-center justify-between">
          <div className="text-xs text-zinc-400">
            BUP Smart Maintenance System
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
