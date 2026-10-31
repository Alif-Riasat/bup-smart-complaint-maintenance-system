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

function parsedDate(value?: string) {
  if (!value) return null;
  const date = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? null : date;
}

function shade(count: number, max: number) {
  if (!count || !max) return { background: '#f4f4f5', color: '#3f3f46' };
  const ratio = count / max;
  if (ratio > 0.75) return { background: '#18181b', color: '#ffffff' };
  if (ratio > 0.45) return { background: '#3f3f46', color: '#ffffff' };
  if (ratio > 0.2) return { background: '#a1a1aa', color: '#18181b' };
  return { background: '#e4e4e7', color: '#18181b' };
}

function InsightCard({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="h-full p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-xs flex flex-col">
      <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
      <p className="text-[11px] text-zinc-500 mt-0.5 mb-4 min-h-8">{note}</p>
      <div className="flex-1">{children}</div>
    </section>
  );
}

const OPEN_STATUSES = new Set(['Pending', 'Assigned', 'In Progress', 'On Hold', 'Escalated']);
const SANKEY_COLUMNS = [
  ['Submitted'],
  ['Assigned'],
  ['In progress', 'On hold', 'Escalated'],
  ['Resolved', 'Closed', 'Rejected'],
];

function lifecycleChain(status: string) {
  switch (status) {
    case 'Assigned': return ['Submitted', 'Assigned'];
    case 'In Progress': return ['Submitted', 'Assigned', 'In progress'];
    case 'On Hold': return ['Submitted', 'Assigned', 'On hold'];
    case 'Escalated': return ['Submitted', 'Assigned', 'Escalated'];
    case 'Resolved': return ['Submitted', 'Assigned', 'In progress', 'Resolved'];
    case 'Closed': return ['Submitted', 'Assigned', 'In progress', 'Resolved', 'Closed'];
    case 'Rejected': return ['Submitted', 'Rejected'];
    default: return ['Submitted'];
  }
}

const WEEKDAY_ROWS = [
  { day: 6, label: 'Sat' },
  { day: 0, label: 'Sun' },
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
];
const HOUR_LABELS = ['12a', '4a', '8a', '12p', '4p', '8p'];
const AGE_BANDS = [
  { label: 'Under 8h', test: (hours: number) => hours < 8 },
  { label: '8–24h', test: (hours: number) => hours >= 8 && hours < 24 },
  { label: '1–3 days', test: (hours: number) => hours >= 24 && hours < 72 },
  { label: '3–7 days', test: (hours: number) => hours >= 72 && hours < 168 },
  { label: 'Over 7 days', test: (hours: number) => hours >= 168 },
];

function LifecycleSankey({ nodeValue, linkValue }: { nodeValue: Map<string, number>; linkValue: Map<string, number> }) {
  const height = 188;
  const columnsX = [28, 176, 324, 472];
  const boxes = SANKEY_COLUMNS.flatMap((ids, column) => {
    const gap = 8;
    const inner = height - 16 - gap * (ids.length - 1);
    const weights = ids.map((id) => Math.max(nodeValue.get(id) || 0, 0.4));
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
    let y = 8;
    return ids.map((id, index) => {
      const h = (weights[index] / weightSum) * inner;
      const box = { id, x: columnsX[column], y, w: 8, h, value: nodeValue.get(id) || 0 };
      y += h + gap;
      return box;
    });
  });
  const byId = new Map(boxes.map((box) => [box.id, box]));
  const sourceUsed = new Map<string, number>();
  const targetUsed = new Map<string, number>();
  const ribbons = Array.from(linkValue.entries()).flatMap(([key, count]) => {
    if (!count) return [];
    const [from, to] = key.split('>');
    const source = byId.get(from);
    const target = byId.get(to);
    if (!source || !target) return [];
    const sourceThickness = source.value ? (count / source.value) * source.h : 4;
    const targetThickness = target.value ? (count / target.value) * target.h : 4;
    const y1 = source.y + (sourceUsed.get(from) || 0);
    const y2 = target.y + (targetUsed.get(to) || 0);
    sourceUsed.set(from, (sourceUsed.get(from) || 0) + sourceThickness);
    targetUsed.set(to, (targetUsed.get(to) || 0) + targetThickness);
    const x1 = source.x + source.w;
    const x2 = target.x;
    const bend = (x2 - x1) / 2;
    return [{
      key,
      d: `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2} L ${x2} ${y2 + targetThickness} C ${x2 - bend} ${y2 + targetThickness}, ${x1 + bend} ${y1 + sourceThickness}, ${x1} ${y1 + sourceThickness} Z`,
    }];
  });

  return (
    <div>
      <svg viewBox="0 0 520 188" className="w-full h-44" role="img" aria-label="Lifecycle Sankey diagram">
        {ribbons.map((ribbon) => <path key={ribbon.key} d={ribbon.d} fill="#18181b" opacity="0.16" />)}
        {boxes.map((box) => (
          <rect key={box.id} x={box.x} y={box.y} width={box.w} height={Math.max(box.h, 2)} rx="2" fill="#18181b" />
        ))}
      </svg>
      <div className="grid grid-cols-4 gap-3 mt-2">
        {SANKEY_COLUMNS.map((column) => (
          <div key={column[0]} className="space-y-1 min-w-0">
            {column.map((id) => (
              <div key={id} className="flex items-center justify-between gap-2 text-[10px]">
                <span className="font-semibold text-zinc-700 truncate">{id}</span>
                <span className="font-mono text-zinc-500">{nodeValue.get(id) || 0}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export const AnalyticsVisuals: React.FC = () => {
  const { complaints, departments, statusHistory } = useApp();
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

  const nodeValue = new Map<string, number>();
  const linkValue = new Map<string, number>();
  complaints.forEach((complaint) => {
    const chain = lifecycleChain(complaint.status);
    chain.forEach((node) => nodeValue.set(node, (nodeValue.get(node) || 0) + 1));
    for (let index = 0; index < chain.length - 1; index += 1) {
      const key = `${chain[index]}>${chain[index + 1]}`;
      linkValue.set(key, (linkValue.get(key) || 0) + 1);
    }
  });

  const heatmap = WEEKDAY_ROWS.map((row) => HOUR_LABELS.map((_, hourIndex) => (
    complaints.filter((complaint) => {
      const date = parsedDate(complaint.submissionDate);
      return !!date && date.getDay() === row.day && Math.floor(date.getHours() / 4) === hourIndex;
    }).length
  )));
  const heatMax = Math.max(...heatmap.flat(), 1);

  const openComplaints = complaints.filter((complaint) => OPEN_STATUSES.has(complaint.status));
  const ageHours = (complaint: (typeof complaints)[number]) => {
    const filed = parsedDate(complaint.submissionDate);
    if (!filed) return 0;
    return Math.max(0, (Date.now() - filed.getTime()) / 36e5);
  };
  const aging = AGE_BANDS.map((band) => ({
    label: band.label,
    count: openComplaints.filter((complaint) => band.test(ageHours(complaint))).length,
  }));
  const agingMax = Math.max(...aging.map((band) => band.count), 1);
  const risk = AGE_BANDS.map((band) => priorities.map((priority) => (
    openComplaints.filter((complaint) => band.test(ageHours(complaint)) && priorityLabel(complaint.priority) === priority).length
  )));
  const riskMax = Math.max(...risk.flat(), 1);

  const now = new Date();
  const calendarYear = now.getFullYear();
  const calendarMonth = now.getMonth();
  const monthStart = new Date(calendarYear, calendarMonth, 1);
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const monthCounts = Array.from({ length: daysInMonth }, (_, index) => {
    const key = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`;
    return complaints.filter((complaint) => String(complaint.submissionDate || '').startsWith(key)).length;
  });
  const monthMax = Math.max(...monthCounts, 1);

  const reached = (complaint: (typeof complaints)[number], stage: string) => {
    const history = statusHistory.filter((item) => item.complaintId === complaint.id);
    if (stage === 'Submitted') return true;
    if (stage === 'Assigned') return complaint.status !== 'Pending' || history.some((item) => item.status === 'Assigned');
    if (stage === 'In progress') return ['In Progress', 'On Hold', 'Escalated', 'Resolved', 'Closed'].includes(complaint.status) || history.some((item) => item.status === 'In Progress');
    if (stage === 'Resolved') return complaint.status === 'Resolved' || complaint.status === 'Closed' || !!complaint.resolvedDate;
    return !!complaint.feedbackRating;
  };
  const stageHours = (stage: string) => {
    const samples = complaints.map((complaint) => {
      if (!reached(complaint, stage)) return null;
      const filed = parsedDate(complaint.submissionDate);
      if (!filed) return null;
      if (stage === 'Submitted') return 0;
      if (stage === 'Feedback') {
        const feedback = parsedDate(complaint.feedbackDate);
        return feedback ? (feedback.getTime() - filed.getTime()) / 36e5 : null;
      }
      const statusName = stage === 'In progress' ? 'In Progress' : stage;
      const hit = statusHistory
        .filter((item) => item.complaintId === complaint.id && item.status === statusName)
        .map((item) => parsedDate(item.updatedDate))
        .filter((date): date is Date => !!date)
        .sort((a, b) => a.getTime() - b.getTime())[0];
      return hit ? (hit.getTime() - filed.getTime()) / 36e5 : null;
    }).filter((value): value is number => value !== null && value >= 0);
    if (!samples.length) return null;
    return samples.reduce((sum, value) => sum + value, 0) / samples.length;
  };
  const journey = ['Submitted', 'Assigned', 'In progress', 'Resolved', 'Feedback'].map((stage) => ({
    stage,
    count: complaints.filter((complaint) => reached(complaint, stage)).length,
    hours: stageHours(stage),
  }));

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

      <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs">
        <h3 className="text-base font-bold text-zinc-900">Department workload</h3>
        <div className="mt-3 max-h-56 overflow-y-auto space-y-3 pr-1">
          {deptCounts.length === 0 && <p className="text-xs text-zinc-500">No departments are loaded yet.</p>}
          {deptCounts.map((dept) => (
            <div key={dept.name} className="flex items-center justify-between text-xs border-b border-zinc-100 pb-2">
              <span className="font-semibold text-zinc-800">{dept.name}</span>
              <span className="text-zinc-500 whitespace-nowrap">{dept.open} open · {dept.done} done</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <InsightCard title="Lifecycle Sankey" note="How complaints move from filing to a closed, resolved, or rejected result.">
          <LifecycleSankey nodeValue={nodeValue} linkValue={linkValue} />
        </InsightCard>

        <InsightCard title="Day and time heatmap" note="Saturday through Friday, in four-hour blocks. Darker cells mean more filings.">
          <div className="grid grid-cols-[2.25rem_repeat(6,minmax(0,1fr))] gap-1">
            <div />
            {HOUR_LABELS.map((label) => (
              <div key={label} className="text-center text-[10px] font-semibold text-zinc-500">{label}</div>
            ))}
            {WEEKDAY_ROWS.map((row, rowIndex) => (
              <React.Fragment key={row.label}>
                <div className="h-7 flex items-center text-[10px] font-semibold text-zinc-600">{row.label}</div>
                {heatmap[rowIndex].map((count, column) => {
                  const tone = shade(count, heatMax);
                  return (
                    <div
                      key={`${row.label}-${column}`}
                      className="h-7 rounded-md text-[10px] font-bold flex items-center justify-center"
                      style={{ background: tone.background, color: tone.color }}
                      title={`${row.label} ${HOUR_LABELS[column]}: ${count}`}
                    >
                      {count || ''}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </InsightCard>

        <InsightCard title="User journey timeline" note="How many complaints reach each step, and the average hours from filing.">
          <div className="relative pt-1">
            <div className="absolute left-[10%] right-[10%] top-3 h-px bg-zinc-200" />
            <div className="grid grid-cols-5">
              {journey.map((step) => (
                <div key={step.stage} className="flex flex-col items-center text-center px-1">
                  <span className="relative z-10 w-7 h-7 rounded-full bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center">
                    {step.count}
                  </span>
                  <span className="mt-2 text-[11px] font-semibold text-zinc-800 leading-tight">{step.stage}</span>
                  <span className="mt-1 text-[10px] text-zinc-500">{step.hours === null ? '—' : `${step.hours.toFixed(1)}h`}</span>
                </div>
              ))}
            </div>
          </div>
        </InsightCard>

        <InsightCard title="Campus maintenance risk matrix" note="Open complaints by how long they have waited and how urgent they are.">
          <div className="grid grid-cols-[4.5rem_repeat(4,minmax(0,1fr))] gap-1 items-stretch">
            <div />
            {priorities.map((priority) => (
              <div key={priority} className="text-center text-[10px] font-semibold text-zinc-500">{priority}</div>
            ))}
            {AGE_BANDS.map((band, rowIndex) => (
              <React.Fragment key={band.label}>
                <div className="h-8 flex items-center text-[10px] font-semibold text-zinc-600">{band.label}</div>
                {priorities.map((priority, column) => {
                  const count = risk[rowIndex][column];
                  const tone = shade(count, riskMax);
                  return (
                    <div
                      key={`${band.label}-${priority}`}
                      className="h-8 rounded-md text-[11px] font-bold flex items-center justify-center"
                      style={{ background: tone.background, color: tone.color }}
                    >
                      {count}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </InsightCard>

        <InsightCard title="Calendar and complaint volume" note={`${monthStart.toLocaleString('en-US', { month: 'long', year: 'numeric' })}. Each day shows how many complaints were filed.`}>
          <div className="grid grid-cols-7 gap-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((label) => (
              <div key={label} className="text-center text-[10px] font-semibold text-zinc-500">{label}</div>
            ))}
            {Array.from({ length: monthStart.getDay() }, (_, index) => (
              <div key={`pad-${index}`} className="h-8" />
            ))}
            {monthCounts.map((count, index) => {
              const tone = shade(count, monthMax);
              return (
                <div
                  key={index + 1}
                  className="h-8 rounded-md flex flex-col items-center justify-center leading-none"
                  style={{ background: tone.background, color: tone.color }}
                >
                  <span className="text-[10px] font-semibold">{index + 1}</span>
                  {count > 0 && <span className="text-[8px] font-bold">{count}</span>}
                </div>
              );
            })}
          </div>
        </InsightCard>

        <InsightCard title="Unresolved complaint aging" note="Open complaints grouped by how long they have been waiting.">
          <div className="space-y-3">
            {aging.map((band) => (
              <div key={band.label}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-zinc-800">{band.label}</span>
                  <span className="font-mono text-zinc-500">{band.count}</span>
                </div>
                <div className="h-2.5 rounded-full bg-zinc-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-zinc-900"
                    style={{ width: `${band.count ? Math.max((band.count / agingMax) * 100, 8) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </InsightCard>
      </div>
    </div>
  );
};
