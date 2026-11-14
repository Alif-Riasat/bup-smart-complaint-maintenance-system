import React, { useState } from 'react';
import {
  Wrench,
  Play,
  CheckCircle2,
  Clock,
  Building2,
  User,
  Check,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Complaint } from '../../types/complaint';

interface MaintenanceTasksViewProps {
  onSelectComplaint: (id: string) => void;
}

export const MaintenanceTasksView: React.FC<MaintenanceTasksViewProps> = ({
  onSelectComplaint,
}) => {
  const { complaints, statusHistory, updateStaffProgress, sendProgressUpdate, passToHigherAuthority, currentUser } = useApp();

  const [resolvingComplaint, setResolvingComplaint] = useState<Complaint | null>(null);
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [elseComplaint, setElseComplaint] = useState<Complaint | null>(null);
  const [elseStatus, setElseStatus] = useState<'On Hold' | 'Escalated'>('On Hold');
  const [elseRemarks, setElseRemarks] = useState('');
  const [progressComplaint, setProgressComplaint] = useState<Complaint | null>(null);
  const [progressNote, setProgressNote] = useState('');
  const [passComplaint, setPassComplaint] = useState<Complaint | null>(null);
  const [passRemarks, setPassRemarks] = useState('');
  const [actionError, setActionError] = useState('');
  const [boxError, setBoxError] = useState('');

  const isMine = (c: Complaint) =>
    currentUser.staffId ? c.assignedStaffId === currentUser.staffId : c.assignedStaffName === currentUser.name;
  const technicianTasks = complaints.filter(isMine);
  const passedOn = complaints.filter((c) => !isMine(c));
  const latestNote = (id: string) => {
    const notes = statusHistory.filter((item) => item.complaintId === id);
    const latest = notes.reduce<(typeof notes)[number] | null>((current, item) => {
      if (!current) return item;
      if (item.updatedDate !== current.updatedDate) return item.updatedDate > current.updatedDate ? item : current;
      return item.id > current.id ? item : current;
    }, null);
    return latest?.remarks;
  };

  const handleStartWork = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionError('');
    try {
      await updateStaffProgress(
        id,
        'In Progress',
        `${currentUser.name} started work on site.`
      );
    } catch (err: any) {
      setActionError(err.message || 'The status could not be updated.');
    }
  };

  const handleOpenResolve = (c: Complaint, e: React.MouseEvent) => {
    e.stopPropagation();
    setResolvingComplaint(c);
    setResolutionRemarks('');
    setBoxError('');
  };

  const shortNote = (value: string) => value.trim().length < 8;

  const handleSubmitResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingComplaint) return;
    if (shortNote(resolutionRemarks)) {
      setBoxError('Write at least 8 characters.');
      return;
    }
    setBoxError('');
    setActionError('');
    try {
      await updateStaffProgress(resolvingComplaint.id, 'Resolved', resolutionRemarks.trim());
      setResolvingComplaint(null);
    } catch (err: any) {
      setActionError(err.message || 'The complaint could not be marked done.');
    }
  };

  const handleSubmitElse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!elseComplaint) return;
    if (shortNote(elseRemarks)) {
      setBoxError('Write at least 8 characters.');
      return;
    }
    setBoxError('');
    try {
      await updateStaffProgress(elseComplaint.id, elseStatus, elseRemarks.trim());
      setElseComplaint(null);
    } catch (err: any) {
      setActionError(err.message || 'The flag could not be saved.');
    }
  };

  const handleProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressComplaint) return;
    if (shortNote(progressNote)) {
      setBoxError('Write at least 8 characters.');
      return;
    }
    setBoxError('');
    try {
      await sendProgressUpdate(progressComplaint.id, progressNote.trim());
      setProgressComplaint(null);
      setProgressNote('');
    } catch (err: any) {
      setActionError(err.message || 'The progress update could not be sent.');
    }
  };

  return (
    <div className="space-y-6 font-sans pb-16">
      <div>
        <div className="text-xs text-zinc-400 mb-1">
          Technician / <span className="text-zinc-600 font-medium">Assigned work orders</span>
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
          Assigned Work Orders
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Complaints routed to you. After you pass one up, it stays here with the senior officer’s name and later progress.
        </p>
      </div>
      {actionError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">{actionError}</div>
      )}

      <div className="space-y-3">
        {technicianTasks.length === 0 ? (
          <div className="p-12 text-center bg-white border border-zinc-200 rounded-2xl">
            <Wrench className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-zinc-900">No active work orders</h3>
            <p className="text-xs text-zinc-500 mt-1">You are all caught up!</p>
          </div>
        ) : (
          technicianTasks.map((t) => (
            <div
              key={t.id}
              onClick={() => onSelectComplaint(t.id)}
              className="p-5 rounded-2xl bg-white border border-zinc-200 hover:border-black/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer shadow-xs"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-900">{t.id}</span>
                  <span className="text-zinc-400">•</span>
                  <span className="text-xs font-semibold text-zinc-600">{t.categoryName}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                    {t.priority}
                  </span>
                </div>

                <h3 className="font-bold text-zinc-900 text-sm">{t.title}</h3>
                <p className="text-xs text-zinc-500 line-clamp-1">{t.description}</p>
                {t.issueFacedAt && (
                  <p className="text-[11px] text-zinc-600">Faced the issue: {t.issueFacedAt.slice(0, 16)}</p>
                )}
                {t.imageUrl && (
                  <img src={t.imageUrl} alt="Photo proof" loading="lazy" decoding="async" className="mt-2 h-16 w-16 rounded-lg object-cover border border-zinc-200" />
                )}

                <div className="flex items-center gap-4 text-xs text-zinc-500 pt-1">
                  <span className="flex items-center gap-1 text-zinc-800 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                    {t.buildingName} · {t.roomArea}
                  </span>
                  <span>Contact: {t.userName} ({t.userPhone})</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-800">
                  {t.status}
                </span>

                {['Assigned', 'On Hold', 'Escalated', 'Pending'].includes(t.status) && (
                  <button
                    onClick={(e) => handleStartWork(t.id, e)}
                    className="px-3.5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3" />
                    <span>In progress</span>
                  </button>
                )}

                {['Assigned', 'In Progress', 'On Hold', 'Escalated'].includes(t.status) && (
                  <>
                    <button
                      onClick={(e) => handleOpenResolve(t, e)}
                      className="px-3.5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Done</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setElseComplaint(t);
                        setElseRemarks('');
                        setElseStatus('On Hold');
                        setBoxError('');
                      }}
                      className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold"
                    >
                      Other
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionError('');
                        setBoxError('');
                        setPassComplaint(t);
                        setPassRemarks('');
                      }}
                      className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold"
                    >
                      Pass up
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProgressComplaint(t);
                        setProgressNote('');
                        setBoxError('');
                      }}
                      className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold"
                    >
                      Notify progress
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {passedOn.length > 0 && (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-extrabold text-zinc-900">Passed to a senior officer</h2>
            <p className="text-xs text-zinc-500 mt-1">You can see who has the complaint now and what they have done since.</p>
          </div>
          {passedOn.map((t) => (
            <div
              key={t.id}
              onClick={() => onSelectComplaint(t.id)}
              className="p-5 rounded-2xl bg-white border border-zinc-200 hover:border-black/30 transition-all cursor-pointer shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-zinc-900">{t.id}</span>
                  <span className="text-zinc-400">•</span>
                  <span className="text-xs font-semibold text-zinc-600 truncate">{t.title}</span>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-800 shrink-0">{t.status}</span>
              </div>
              <p className="text-xs text-zinc-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>Now with <strong>{t.assignedStaffName || 'the next office'}</strong>{t.assignedStaffRole ? `, ${t.assignedStaffRole}` : ''}</span>
              </p>
              {latestNote(t.id) && (
                <p className="text-xs text-zinc-500 line-clamp-2">Latest progress: {latestNote(t.id)}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resolve Dialog */}
      {resolvingComplaint && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="font-bold text-sm text-zinc-900">Complete &amp; Resolve Work Order</h3>
              <button
                onClick={() => setResolvingComplaint(null)}
                className="text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-600">
              Ticket: <strong className="text-zinc-900">{resolvingComplaint.title}</strong> ({resolvingComplaint.id})
            </p>

            <form noValidate onSubmit={handleSubmitResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Resolution notes &amp; actions taken
                </label>
                <textarea
                  rows={4}
                  required
                  value={resolutionRemarks}
                  onChange={(e) => { setResolutionRemarks(e.target.value); setBoxError(''); }}
                  placeholder="Describe repair actions (e.g. replaced power breaker, cleared drain blockage, updated router config)..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-zinc-900 focus:outline-none focus:border-black"
                />
                {boxError && <p className="text-xs text-red-600 mt-1">{boxError}</p>}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingComplaint(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-semibold"
                >
                  Mark done
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {elseComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <form noValidate onSubmit={handleSubmitElse} className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 border border-zinc-200">
            <h3 className="font-bold text-sm">Flag {elseComplaint.id}</h3>
            <select value={elseStatus} onChange={(e) => setElseStatus(e.target.value as 'On Hold' | 'Escalated')} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-xs">
              <option value="On Hold">On hold</option>
              <option value="Escalated">Escalated to supervisor</option>
            </select>
            <textarea required rows={4} value={elseRemarks} onChange={(e) => { setElseRemarks(e.target.value); setBoxError(''); }} placeholder="Why is this not done yet?" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs" />
            {boxError && <p className="text-xs text-red-600">{boxError}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setElseComplaint(null)} className="px-4 py-2 rounded-xl border text-xs">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-black text-white text-xs font-semibold">Save flag</button>
            </div>
          </form>
        </div>
      )}

      {passComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (passRemarks.trim().length < 8) {
                setBoxError('Write at least 8 characters.');
                return;
              }
              setBoxError('');
              setActionError('');
              try {
                await passToHigherAuthority(passComplaint.id, passRemarks.trim());
                setPassComplaint(null);
                setPassRemarks('');
              } catch (err: any) {
                setActionError(err.message || 'The complaint could not be passed up.');
              }
            }}
            noValidate
            className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 border border-zinc-200"
          >
            <h3 className="font-bold text-sm">Pass {passComplaint.id} to the next authority</h3>
            <p className="text-xs text-zinc-500">Say why this needs a senior officer. The reason is saved on your record and shown to the administrator.</p>
            {actionError && <p className="text-xs text-red-600">{actionError}</p>}
            <textarea
              required
              rows={4}
              value={passRemarks}
              onChange={(e) => { setPassRemarks(e.target.value); setBoxError(''); }}
              placeholder="This needs a decision from the next office because..."
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs"
            />
            {boxError && <p className="text-xs text-red-600">{boxError}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPassComplaint(null)} className="px-4 py-2 rounded-xl border text-xs">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-black text-white text-xs font-semibold">Pass up</button>
            </div>
          </form>
        </div>
      )}

      {progressComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <form noValidate onSubmit={handleProgress} className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 border border-zinc-200">
            <h3 className="font-bold text-sm">Notify progress for {progressComplaint.id}</h3>
            <p className="text-xs text-zinc-500">The person who filed this complaint and the administrator both receive this note.</p>
            <textarea required rows={4} value={progressNote} onChange={(e) => { setProgressNote(e.target.value); setBoxError(''); }} placeholder="What has been done so far?" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs" />
            {boxError && <p className="text-xs text-red-600">{boxError}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setProgressComplaint(null)} className="px-4 py-2 rounded-xl border text-xs">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-black text-white text-xs font-semibold">Send update</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
