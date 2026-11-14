import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Complaint, MaintenanceStaff } from '../../types/complaint';
import { priorityLabel } from '../../utils/priority';

export type AuthorityReportKind = 'monthly' | 'executive' | 'pending' | 'staff';

const OPEN = new Set(['Pending', 'Assigned', 'In Progress', 'On Hold', 'Escalated']);
const DONE = new Set(['Resolved', 'Closed']);
const SLA_HOURS: Record<string, number> = {
  Urgent: 2,
  Emergency: 2,
  High: 8,
  Normal: 24,
  Medium: 24,
  Low: 72,
};

export interface ReportRequest {
  kind: AuthorityReportKind;
  month: string;
  complaints: Complaint[];
  staff: MaintenanceStaff[];
  preparedBy: string;
  preparedId: string;
}

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatWhen(date: Date) {
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDay(value?: string | Date | null) {
  const date = value instanceof Date ? value : parseDate(value || undefined);
  if (!date) return 'n/a';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function monthTitle(month: string) {
  const [year, mon] = month.split('-').map(Number);
  if (!year || !mon) return month;
  return new Date(year, mon - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function inMonth(value: string | undefined, month: string) {
  return String(value || '').slice(0, 7) === month;
}

function hoursBetween(from?: string, to?: string) {
  const start = parseDate(from);
  const end = parseDate(to);
  if (!start || !end) return null;
  const hours = (end.getTime() - start.getTime()) / 36e5;
  return Number.isFinite(hours) && hours >= 0 ? hours : null;
}

function dueAt(complaint: Complaint) {
  const explicit = parseDate(complaint.slaDueAt);
  if (explicit) return explicit;
  const filed = parseDate(complaint.submissionDate);
  if (!filed) return null;
  const hours = SLA_HOURS[priorityLabel(complaint.priority)] ?? 24;
  return new Date(filed.getTime() + hours * 36e5);
}

function isOpen(complaint: Complaint) {
  return OPEN.has(complaint.status);
}

function isOverdue(complaint: Complaint, now = new Date()) {
  if (!isOpen(complaint)) return false;
  if (complaint.slaBreached) return true;
  const due = dueAt(complaint);
  return !!due && due.getTime() < now.getTime();
}

function clip(value: string, max = 72) {
  const text = value.replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function place(complaint: Complaint) {
  return clip(`${complaint.buildingName}${complaint.roomArea ? `, ${complaint.roomArea}` : ''}`, 42);
}

function average(values: number[]) {
  if (!values.length) return 'n/a';
  return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
}

function tally(complaints: Complaint[], label: (complaint: Complaint) => string) {
  const counts = new Map<string, number>();
  complaints.forEach((complaint) => {
    const name = label(complaint) || 'Unspecified';
    counts.set(name, (counts.get(name) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function openDoc(title: string, reference: string, request: ReportRequest) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const width = doc.internal.pageSize.getWidth();
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, width, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Bangladesh University of Professionals', 14, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Smart Complaint and Maintenance Portal', 14, 17);
  doc.text(reference, width - 14, 11, { align: 'right' });
  doc.text('Official record for campus authority', width - 14, 17, { align: 'right' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, 14, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 78);
  const details = [
    `Reporting period: ${monthTitle(request.month)}`,
    `Generated: ${formatWhen(new Date())}`,
    `Prepared by: ${request.preparedBy || 'Campus administrator'}${request.preparedId ? ` (${request.preparedId})` : ''}`,
  ];
  details.forEach((line, index) => doc.text(line, 14, 48 + index * 5));
  return doc;
}

function heading(doc: jsPDF, text: string, y: number) {
  let cursor = y;
  if (cursor > 255) {
    doc.addPage();
    cursor = 18;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(text, 14, cursor);
  return cursor + 3;
}

function prose(doc: jsPDF, text: string, y: number) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(40, 40, 46);
  const lines = doc.splitTextToSize(text, 182);
  let cursor = y;
  if (cursor + lines.length * 4.6 > 275) {
    doc.addPage();
    cursor = 18;
  }
  doc.text(lines, 14, cursor);
  return cursor + lines.length * 4.6 + 2;
}

function table(doc: jsPDF, y: number, head: string[], body: string[][]) {
  const rows = body.length
    ? body
    : [[{ content: 'No records in this section.', colSpan: head.length, styles: { textColor: [90, 90, 96] as [number, number, number], fontStyle: 'italic' as const } }]];
  autoTable(doc, {
    startY: y,
    head: [head],
    body: rows,
    margin: { left: 14, right: 14, bottom: 18 },
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.7, textColor: [30, 30, 35], overflow: 'linebreak' },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [247, 247, 249] },
    theme: 'grid',
  });
  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  return finalY + 8;
}

function stampPages(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(220, 220, 225);
    doc.line(14, height - 12, width - 14, height - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 116);
    doc.text('Bangladesh University of Professionals  |  Official maintenance record', 14, height - 7);
    doc.text(`Page ${page} of ${pages}`, width - 14, height - 7, { align: 'right' });
  }
}

function complaintRow(complaint: Complaint, now: Date) {
  const due = dueAt(complaint);
  const overdue = isOverdue(complaint, now);
  const late = overdue && due ? `${Math.max(1, Math.round((now.getTime() - due.getTime()) / 36e5))} h` : 'n/a';
  return [
    complaint.id,
    clip(complaint.title, 48),
    priorityLabel(complaint.priority),
    complaint.status,
    place(complaint),
    complaint.assignedStaffName || 'Unassigned',
    formatDay(complaint.submissionDate),
    due ? formatDay(due) : 'n/a',
    late,
  ];
}

function writeMonthly(doc: jsPDF, request: ReportRequest) {
  const filed = request.complaints.filter((complaint) => inMonth(complaint.submissionDate, request.month));
  const resolved = filed.filter((complaint) => DONE.has(complaint.status));
  const open = filed.filter(isOpen);
  const overdue = filed.filter((complaint) => isOverdue(complaint));
  const hours = resolved
    .map((complaint) => hoursBetween(complaint.submissionDate, complaint.resolvedDate))
    .filter((value): value is number => value !== null);
  let y = heading(doc, '1. Period summary', 68);
  y = prose(
    doc,
    `This report covers complaints filed during ${monthTitle(request.month)}. It is prepared for submission to campus authority and for the maintenance office record.`,
    y + 4,
  );
  y = table(doc, y, ['Measure', 'Count'], [
    ['Complaints filed', String(filed.length)],
    ['Resolved or closed', String(resolved.length)],
    ['Still open', String(open.length)],
    ['Open and past the resolution target', String(overdue.length)],
    ['Average hours to resolve', average(hours)],
  ]);
  y = heading(doc, '2. Status', y);
  y = table(doc, y, ['Status', 'Complaints'], tally(filed, (complaint) => complaint.status).map(([name, count]) => [name, String(count)]));
  y = heading(doc, '3. Category', y);
  y = table(doc, y, ['Category', 'Complaints'], tally(filed, (complaint) => complaint.categoryName).map(([name, count]) => [clip(name, 60), String(count)]));
  y = heading(doc, '4. Campus location', y);
  y = table(doc, y, ['Building', 'Complaints'], tally(filed, (complaint) => complaint.buildingName).map(([name, count]) => [clip(name, 60), String(count)]));
  y = heading(doc, '5. Complaint register', y);
  table(
    doc,
    y,
    ['ID', 'Title', 'Priority', 'Status', 'Location', 'Officer'],
    filed.map((complaint) => [
      complaint.id,
      clip(complaint.title, 42),
      priorityLabel(complaint.priority),
      complaint.status,
      place(complaint),
      complaint.assignedStaffName || 'Unassigned',
    ]),
  );
}

function writeExecutive(doc: jsPDF, request: ReportRequest) {
  const filed = request.complaints.filter((complaint) => inMonth(complaint.submissionDate, request.month));
  const resolved = filed.filter((complaint) => DONE.has(complaint.status));
  const open = filed.filter(isOpen);
  const overdue = filed.filter((complaint) => isOverdue(complaint));
  const escalated = filed.filter((complaint) => complaint.status === 'Escalated' || complaint.escalated);
  const rate = filed.length ? Math.round((resolved.length / filed.length) * 100) : 0;
  const hours = resolved
    .map((complaint) => hoursBetween(complaint.submissionDate, complaint.resolvedDate))
    .filter((value): value is number => value !== null);
  const ratings = filed.map((complaint) => complaint.feedbackRating).filter((value): value is number => !!value);
  const categories = tally(filed, (complaint) => complaint.categoryName);
  const buildings = tally(filed, (complaint) => complaint.buildingName);
  const topCategory = categories[0] ? `${categories[0][0]} (${categories[0][1]})` : 'none';
  const topBuilding = buildings[0] ? `${buildings[0][0]} (${buildings[0][1]})` : 'none';
  let y = heading(doc, '1. Summary for authority', 68);
  y = prose(
    doc,
    `During ${monthTitle(request.month)}, the portal recorded ${filed.length} complaint${filed.length === 1 ? '' : 's'}. ${resolved.length} ${resolved.length === 1 ? 'was' : 'were'} resolved or closed (${rate} percent). ${open.length} remain open, and ${overdue.length} of those are past the resolution target. ${escalated.length} ${escalated.length === 1 ? 'has' : 'have'} been escalated.`,
    y + 4,
  );
  y = prose(
    doc,
    `The busiest category was ${topCategory}. The busiest building was ${topBuilding}. Completed work took ${average(hours)} hours on average. The average service rating was ${average(ratings)} out of 5.`,
    y,
  );
  y = table(doc, y, ['Indicator', 'Figure'], [
    ['Filed in the period', String(filed.length)],
    ['Resolution rate', `${rate}%`],
    ['Open', String(open.length)],
    ['Past resolution target', String(overdue.length)],
    ['Escalated', String(escalated.length)],
    ['Average resolution hours', average(hours)],
    ['Average rating', average(ratings)],
  ]);
  y = heading(doc, '2. Where attention is needed', y);
  const attention = filed.filter((complaint) => isOverdue(complaint) || complaint.status === 'Escalated' || complaint.escalated);
  table(
    doc,
    y,
    ['ID', 'Title', 'Priority', 'Status', 'Location', 'Officer'],
    attention.map((complaint) => [
      complaint.id,
      clip(complaint.title, 42),
      priorityLabel(complaint.priority),
      complaint.status,
      place(complaint),
      complaint.assignedStaffName || 'Unassigned',
    ]),
  );
}

function writePending(doc: jsPDF, request: ReportRequest) {
  const now = new Date();
  const open = request.complaints.filter(isOpen);
  const overdue = open.filter((complaint) => isOverdue(complaint, now));
  const waiting = open.filter((complaint) => !isOverdue(complaint, now));
  let y = heading(doc, '1. Live register', 68);
  y = prose(
    doc,
    `This list is the campus position at ${formatWhen(now)}. It includes every open complaint, including those filed before ${monthTitle(request.month)}. Resolution targets are Urgent 2 hours, High 8 hours, Normal 24 hours, and Low 72 hours.`,
    y + 4,
  );
  y = table(doc, y, ['Measure', 'Count'], [
    ['Open complaints', String(open.length)],
    ['Past the resolution target', String(overdue.length)],
    ['Still inside the target', String(waiting.length)],
  ]);
  y = heading(doc, '2. Past the resolution target', y);
  y = table(
    doc,
    y,
    ['ID', 'Title', 'Priority', 'Status', 'Location', 'Officer', 'Filed', 'Due', 'Late by'],
    overdue.map((complaint) => complaintRow(complaint, now)),
  );
  y = heading(doc, '3. Other open complaints', y);
  table(
    doc,
    y,
    ['ID', 'Title', 'Priority', 'Status', 'Location', 'Officer', 'Filed', 'Due', 'Late by'],
    waiting.map((complaint) => complaintRow(complaint, now)),
  );
}

function writeStaff(doc: jsPDF, request: ReportRequest) {
  const filed = request.complaints.filter((complaint) => inMonth(complaint.submissionDate, request.month));
  const roster = new Map<string, { name: string; department: string; specialization: string; active: number }>();
  request.staff.forEach((member) => {
    roster.set(member.id, {
      name: member.name,
      department: member.departmentName,
      specialization: member.specialization,
      active: member.activeTasksCount,
    });
  });
  filed.forEach((complaint) => {
    const key = complaint.assignedStaffId || complaint.assignedStaffName;
    if (!key || roster.has(key)) return;
    roster.set(key, {
      name: complaint.assignedStaffName || 'Unassigned officer',
      department: complaint.departmentName || 'n/a',
      specialization: complaint.assignedStaffRole || 'n/a',
      active: 0,
    });
  });
  const rows = [...roster.entries()].map(([key, member]) => {
    const owned = filed.filter((complaint) => complaint.assignedStaffId === key || complaint.assignedStaffName === member.name);
    const resolved = owned.filter((complaint) => DONE.has(complaint.status));
    const hours = resolved
      .map((complaint) => hoursBetween(complaint.submissionDate, complaint.resolvedDate))
      .filter((value): value is number => value !== null);
    const ratings = owned.map((complaint) => complaint.feedbackRating).filter((value): value is number => !!value);
    return {
      member,
      received: owned.length,
      resolved: resolved.length,
      open: owned.filter(isOpen).length,
      overdue: owned.filter((complaint) => isOverdue(complaint)).length,
      hours: average(hours),
      rating: average(ratings),
    };
  }).sort((a, b) => b.overdue - a.overdue || b.resolved - a.resolved || a.member.name.localeCompare(b.member.name));

  let y = heading(doc, '1. Officer results for the period', 68);
  y = prose(
    doc,
    `Figures count complaints filed in ${monthTitle(request.month)} and assigned to each officer. Active tasks are the officer's current open workload, which may include earlier months.`,
    y + 4,
  );
  table(
    doc,
    y,
    ['Officer', 'Desk', 'Filed', 'Resolved', 'Open', 'Overdue', 'Avg hours', 'Rating', 'Active now'],
    rows.map((row) => [
      row.member.name,
      clip(row.member.department, 28),
      String(row.received),
      String(row.resolved),
      String(row.open),
      String(row.overdue),
      row.hours,
      row.rating,
      String(row.member.active),
    ]),
  );
}

const TITLES: Record<AuthorityReportKind, { title: string; code: string; file: string }> = {
  monthly: { title: 'Monthly Campus Maintenance Report', code: 'MONTHLY', file: 'Monthly_Campus_Maintenance_Report' },
  executive: { title: 'Executive Summary Report', code: 'EXECUTIVE', file: 'Executive_Summary_Report' },
  pending: { title: 'Pending and Overdue Report', code: 'PENDING', file: 'Pending_and_Overdue' },
  staff: { title: 'Staff Performance Report', code: 'STAFF', file: 'Staff_Performance' },
};

export function buildAuthorityReport(request: ReportRequest) {
  const spec = TITLES[request.kind];
  const reference = `BUP-MNT-${request.month}-${spec.code}`;
  const doc = openDoc(spec.title, reference, request);
  if (request.kind === 'monthly') writeMonthly(doc, request);
  if (request.kind === 'executive') writeExecutive(doc, request);
  if (request.kind === 'pending') writePending(doc, request);
  if (request.kind === 'staff') writeStaff(doc, request);
  stampPages(doc);
  return { doc, filename: `BUP_${spec.file}_${request.month}.pdf` };
}

export function downloadAuthorityReport(request: ReportRequest) {
  const { doc, filename } = buildAuthorityReport(request);
  doc.save(filename);
}
