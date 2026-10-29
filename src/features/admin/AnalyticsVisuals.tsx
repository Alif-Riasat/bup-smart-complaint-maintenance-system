import React from 'react';
import { useApp } from '../../context/AppContext';
import { priorityLabel } from '../../utils/priority';

const SLA_HOURS: Record<string, number> = { Urgent: 2, High: 8, Normal: 24, Low: 72 };

function hoursBetween(start?: string, end?: string) {
  if (!start || !end) return null;
  const from = new Date(start.replace(' ', 'T')).getTime();
  const to = new Date(end.replace(' ', 'T')).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return null;
  return (to - from) / 36e5;
}

export const AnalyticsVisuals: React.FC = () => {
  const { complaints, departments } = useApp();
  const total = Math.max(complaints.length, 1);
  const statuses = ['Pending', 'Assigned', 'In Progress', 'On Hold', 'Escalated', 'Resolved', 'Closed', 'Rejected'];
  const statusCounts = statuses.map((status) => ({
    status,
    count: complaints.filter((complaint) => complaint.status === status).length,
  })).filter((item) => item.count > 0);

  const priorities = ['Low', 'Normal', 'High', 'Urgent'];
  const priorityCounts = priorities.map((priority) => ({
    priority,
    count: complaints.filter((complaint) => priorityLabel(complaint.priority) === priority).length,
  }));
  const maxPriority = Math.max(...priorityCounts.map((item) => item.count), 1);

  const byDay = new Map<string, number>();
  complaints.forEach((complaint) => {
    const day = (complaint.submissionDate || '').slice(0, 10);
    if (day) byDay.set(day, (byDay.get(day) || 0) + 1);
  });
  const days = Array.from(byDay.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const maxDay = Math.max(...days.map(([, count]) => count), 1);

  const deptCounts = departments.map((dept) => ({
    name: dept.name,
    open: complaints.filter((complaint) => complaint.departmentId === dept.id && !['Resolved', 'Closed', 'Rejected'].includes(complaint.status)).length,
    done: complaints.filter((complaint) => complaint.departmentId === dept.id && ['Resolved', 'Closed'].includes(complaint.status)).length,
  }));

  let cursor = 0;
  const slices = statusCounts.map((item, index) => {
    const sweep = (item.count / total) * 360;
    const start = cursor;
    cursor += sweep;
    const shades = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8', '#f97316', '#ea580c', '#44403c'];
    return { ...item, start, sweep, color: shades[index % shades.length] };
  });

  const polar = (angle: number, radius: number) => {
    const radians = ((angle - 90) * Math.PI) / 180;
    return [50 + radius * Math.cos(radians), 50 + radius * Math.sin(radians)];
  };
  const donut = slices.map((slice) => {
    const [x1, y1] = polar(slice.start, 38);
    const [x2, y2] = polar(slice.start + slice.sweep, 38);
    const large = slice.sweep > 180 ? 1 : 0;
    return `${slice.color} ${x1} ${y1} ${x2} ${y2} ${large}`;
  });

  const breached = complaints.filter((complaint) => complaint.slaBreached && !['Resolved', 'Closed', 'Rejected'].includes(complaint.status));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs">
          <h3 className="text-base font-bold text-zinc-900">Status mix</h3>
          <p className="text-xs text-zinc-500 mt-0.5 mb-4">Share of complaints in each stage</p>
          <div className="flex items-center gap-6">
            <svg viewBox="0 0 100 100" className="w-36 h-36 shrink-0">
              {slices.length === 0 ? <circle cx="50" cy="50" r="38" fill="none" stroke="#e4e4e7" strokeWidth="12" /> : slices.map((slice, index) => {
                const [x1, y1] = polar(slice.start, 38);
                const [x2, y2] = polar(Math.max(slice.start + slice.sweep - 0.01, slice.start), 38);
                const large = slice.sweep > 180 ? 1 : 0;
                return (
                  <path
                    key={slice.status}
                    d={`M ${x1} ${y1} A 38 38 0 ${large} 1 ${x2} ${y2}`}
                    fill="none"
                    stroke={['#18181b', '#52525b', '#a1a1aa', '#f97316', '#ea580c', '#44403c', '#d4d4d8', '#27272a'][index % 8]}
                    strokeWidth="14"
                    strokeLinecap="butt"
                  />
                );
              })}
              <circle cx="50" cy="50" r="24" fill="white" />
              <text x="50" y="52" textAnchor="middle" className="fill-zinc-900" fontSize="10" fontWeight="700">{complaints.length}</text>
            </svg>
            <div className="space-y-1.5 text-xs">
              {statusCounts.map((item) => (
                <div key={item.status} className="flex justify-between gap-6">
                  <span className="font-semibold text-zinc-800">{item.status}</span>
                  <span className="font-mono text-zinc-500">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
          <span className="sr-only">{donut.join(' ')}</span>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs">
          <h3 className="text-base font-bold text-zinc-900">Priority columns</h3>
          <p className="text-xs text-zinc-500 mt-0.5 mb-4">Low, Normal, High, and Urgent</p>
          <div className="flex items-end gap-4 h-40">
            {priorityCounts.map((item) => (
              <div key={item.priority} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                <span className="text-[11px] font-bold text-zinc-700">{item.count}</span>
                <div className="w-full bg-zinc-100 rounded-xl overflow-hidden flex items-end" style={{ height: '120px' }}>
                  <div className="w-full bg-zinc-900 rounded-xl" style={{ height: `${Math.max((item.count / maxPriority) * 100, item.count ? 8 : 0)}%` }} />
                </div>
                <span className="text-[11px] font-semibold text-zinc-600">{item.priority}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs">
          <h3 className="text-base font-bold text-zinc-900">Submissions by day</h3>
          <p className="text-xs text-zinc-500 mt-0.5 mb-4">Volume from the dates stored in MySQL</p>
          <div className="flex items-end gap-2 h-36">
            {days.length === 0 && <p className="text-xs text-zinc-400">No submissions yet.</p>}
            {days.map(([day, count]) => (
              <div key={day} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                <div className="w-full bg-black rounded-t-md" style={{ height: `${Math.max((count / maxDay) * 100, 8)}%` }} title={`${day}: ${count}`} />
                <span className="text-[9px] text-zinc-400 rotate-0">{day.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs space-y-3">
          <h3 className="text-base font-bold text-zinc-900">Resolution target vs actual</h3>
          <p className="text-xs text-zinc-500">Urgent 2h, High 8h, Normal 24h, Low 72h</p>
          {priorities.map((priority) => {
            const samples = complaints
              .filter((complaint) => priorityLabel(complaint.priority) === priority)
              .map((complaint) => hoursBetween(complaint.submissionDate, complaint.resolvedDate))
              .filter((value): value is number => value !== null);
            const average = samples.length ? samples.reduce((sum, value) => sum + value, 0) / samples.length : 0;
            const target = SLA_HOURS[priority];
            const width = Math.min(100, average ? (average / (target * 1.5)) * 100 : 0);
            return (
              <div key={priority} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-zinc-800">{priority}</span>
                  <span className="text-zinc-500">{samples.length ? `${average.toFixed(1)}h avg` : 'No completed sample'} / {target}h target</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                  <div className={`h-full rounded-full ${average > target ? 'bg-orange-600' : 'bg-zinc-900'}`} style={{ width: `${Math.max(width, samples.length ? 6 : 0)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs space-y-3">
          <h3 className="text-base font-bold text-zinc-900">Department workload</h3>
          {deptCounts.map((dept) => (
            <div key={dept.name} className="flex items-center justify-between text-xs border-b border-zinc-100 pb-2">
              <span className="font-semibold text-zinc-800">{dept.name}</span>
              <span className="text-zinc-500">{dept.open} open · {dept.done} done</span>
            </div>
          ))}
        </div>
        <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs space-y-3">
          <h3 className="text-base font-bold text-zinc-900">Target breaches</h3>
          <p className="text-xs text-zinc-500">Open complaints past the priority target. Officers and the administrator are alerted again every six hours.</p>
          {breached.length === 0 ? (
            <p className="text-xs text-emerald-700 font-semibold">No open complaint is past its target.</p>
          ) : breached.map((complaint) => (
            <div key={complaint.id} className="text-xs">
              <span className="font-bold text-zinc-900">{complaint.id}</span>
              <span className="text-zinc-500"> · {priorityLabel(complaint.priority)} · due {complaint.slaDueAt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
