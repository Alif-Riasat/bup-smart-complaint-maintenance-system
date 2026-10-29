import React from 'react';
import { Check, Clock, FileText, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Complaint } from '../../types/complaint';

function isSolved(complaint: Complaint) {
  return complaint.status === 'Resolved' || complaint.status === 'Closed';
}

function isOpen(complaint: Complaint) {
  return complaint.status !== 'Resolved' && complaint.status !== 'Closed' && complaint.status !== 'Rejected';
}

function hoursToSolve(complaint: Complaint) {
  if (!complaint.resolvedDate || !complaint.submissionDate) return null;
  const start = new Date(complaint.submissionDate).getTime();
  const end = new Date(complaint.resolvedDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return (end - start) / 36e5;
}

function formatHours(hours: number | null) {
  if (hours === null) return '—';
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  return `${hours.toFixed(hours < 10 ? 1 : 0)} h`;
}

export const SolvedPerformanceView: React.FC = () => {
  const { complaints, currentUser, maintenanceStaff, escalations } = useApp();
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'authority';
  const mine = isAdmin
    ? complaints
    : complaints.filter((item) => item.assignedStaffId && item.assignedStaffId === currentUser.staffId);
  const solved = mine.filter(isSolved);
  const open = mine.filter(isOpen);
  const durations = solved.map(hoursToSolve).filter((value): value is number => value !== null);
  const averageHours = durations.length
    ? durations.reduce((sum, value) => sum + value, 0) / durations.length
    : null;
  const resolutionRate = mine.length === 0 ? 0 : Math.round((solved.length / mine.length) * 100);

  const officerRows = maintenanceStaff.map((officer) => {
    const assigned = complaints.filter((item) => item.assignedStaffId === officer.id);
    const done = assigned.filter(isSolved);
    const stillOpen = assigned.filter(isOpen);
    const times = done.map(hoursToSolve).filter((value): value is number => value !== null);
    const average = times.length ? times.reduce((sum, value) => sum + value, 0) / times.length : null;
    const rate = assigned.length === 0 ? 0 : Math.round((done.length / assigned.length) * 100);
    const autoEscalated = escalations.filter((item) => item.kind === 'auto' && item.fromStaffId === officer.id).length;
    return { officer, assigned: assigned.length, done: done.length, stillOpen: stillOpen.length, average, rate, autoEscalated };
  });

  return (
    <div className="space-y-8 font-sans pb-16">
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Solved work</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {isAdmin
            ? 'Resolved and closed complaints, and how each officer is performing.'
            : 'Complaints you have marked done, and how quickly they were closed.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-zinc-600">Solved</span>
            <Check className="w-4 h-4 text-zinc-600" />
          </div>
          <div className="text-3xl font-extrabold text-zinc-900">{solved.length}</div>
          <div className="text-xs text-zinc-400 mt-1">{resolutionRate}% of assigned work</div>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-zinc-600">Still open</span>
            <FileText className="w-4 h-4 text-zinc-600" />
          </div>
          <div className="text-3xl font-extrabold text-zinc-900">{open.length}</div>
          <div className="text-xs text-zinc-400 mt-1">Not resolved or closed</div>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-zinc-600">Average time</span>
            <Clock className="w-4 h-4 text-zinc-600" />
          </div>
          <div className="text-3xl font-extrabold text-zinc-900">{formatHours(averageHours)}</div>
          <div className="text-xs text-zinc-400 mt-1">From submission to solved</div>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-zinc-600">Officers</span>
            <Users className="w-4 h-4 text-zinc-600" />
          </div>
          <div className="text-3xl font-extrabold text-zinc-900">{isAdmin ? maintenanceStaff.length : 1}</div>
          <div className="text-xs text-zinc-400 mt-1">{isAdmin ? 'On the maintenance roster' : 'Your own record'}</div>
        </div>
      </div>

      {isAdmin && (
        <div className="rounded-2xl bg-white border border-zinc-200/90 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-zinc-100">
            <h2 className="text-base font-bold text-zinc-900">Officer performance</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Auto-escalated counts the complaints that left an officer because the deadline passed.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/70 border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Officer</th>
                  <th className="px-6 py-3.5">Assigned</th>
                  <th className="px-6 py-3.5">Solved</th>
                  <th className="px-6 py-3.5">Open</th>
                  <th className="px-6 py-3.5">Average time</th>
                  <th className="px-6 py-3.5">Solved rate</th>
                  <th className="px-6 py-3.5">Auto-escalated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {officerRows.map((row) => (
                  <tr key={row.officer.id}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-900">{row.officer.name}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">{row.officer.departmentName}</div>
                    </td>
                    <td className="px-6 py-4 text-zinc-700">{row.assigned}</td>
                    <td className="px-6 py-4 text-zinc-700">{row.done}</td>
                    <td className="px-6 py-4 text-zinc-700">{row.stillOpen}</td>
                    <td className="px-6 py-4 text-zinc-700">{formatHours(row.average)}</td>
                    <td className="px-6 py-4 font-semibold text-zinc-900">{row.rate}%</td>
                    <td className="px-6 py-4 font-semibold text-zinc-900">{row.autoEscalated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white border border-zinc-200/90 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-zinc-100">
          <h2 className="text-base font-bold text-zinc-900">Escalation history</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isAdmin
              ? 'Auto-escalations are recorded against the officer who missed the deadline. Manual passes include the reason they wrote.'
              : 'Complaints that left you because the deadline passed, and complaints you passed up with a reason.'}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">When</th>
                <th className="px-6 py-3.5">Complaint</th>
                {isAdmin && <th className="px-6 py-3.5">Officer</th>}
                <th className="px-6 py-3.5">How</th>
                <th className="px-6 py-3.5">Passed to</th>
                <th className="px-6 py-3.5">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {escalations.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-10 text-center text-zinc-500">
                    No escalations yet.
                  </td>
                </tr>
              )}
              {escalations.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-zinc-500 whitespace-nowrap">{item.date}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-zinc-900">{item.complaintId}</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{item.complaintTitle}</div>
                  </td>
                  {isAdmin && <td className="px-6 py-4 text-zinc-700">{item.fromStaffName}</td>}
                  <td className="px-6 py-4">
                    <span className="inline-flex px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 text-[11px] font-bold">
                      {item.kind === 'auto' ? 'Deadline missed' : 'Passed up'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-700">{item.toStaffName}</td>
                  <td className="px-6 py-4 text-zinc-600 max-w-xs">{item.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-zinc-200/90 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-zinc-100">
          <h2 className="text-base font-bold text-zinc-900">Solved complaints</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Resolved and closed items only.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Reference</th>
                <th className="px-6 py-3.5">Complaint</th>
                <th className="px-6 py-3.5">Officer</th>
                <th className="px-6 py-3.5">Time taken</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {solved.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-zinc-500">
                    No solved complaints yet. Mark a work order Done and it will appear here.
                  </td>
                </tr>
              )}
              {solved.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 font-bold text-zinc-900 whitespace-nowrap">{item.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-zinc-900">{item.title}</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{item.buildingName}</div>
                  </td>
                  <td className="px-6 py-4 text-zinc-600">{item.assignedStaffName || '—'}</td>
                  <td className="px-6 py-4 text-zinc-600">{formatHours(hoursToSolve(item))}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-3 py-1 rounded-full bg-black text-white text-[11px] font-bold">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
