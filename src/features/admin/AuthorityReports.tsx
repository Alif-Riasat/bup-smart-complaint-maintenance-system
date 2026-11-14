import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Complaint, MaintenanceStaff } from '../../types/complaint';
import { AuthorityReportKind, downloadAuthorityReport, monthTitle } from './reportPdf';

const REPORTS: { kind: AuthorityReportKind; title: string; detail: string }[] = [
  {
    kind: 'monthly',
    title: 'Monthly Campus Maintenance Report',
    detail: 'Period totals, categories, locations, and the complaint register.',
  },
  {
    kind: 'executive',
    title: 'Executive Summary Report',
    detail: 'Short brief for campus authority, with items that need attention.',
  },
  {
    kind: 'pending',
    title: 'Pending & Overdue',
    detail: 'Every open complaint, split into on-time and past the resolution target.',
  },
  {
    kind: 'staff',
    title: 'Staff Performance',
    detail: 'Assigned, resolved, overdue, hours, and rating for each officer.',
  },
];

interface AuthorityReportsProps {
  complaints: Complaint[];
  staff: MaintenanceStaff[];
  preparedBy: string;
  preparedId: string;
}

export const AuthorityReports: React.FC<AuthorityReportsProps> = ({
  complaints,
  staff,
  preparedBy,
  preparedId,
}) => {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const download = (kind: AuthorityReportKind) => {
    downloadAuthorityReport({ kind, month, complaints, staff, preparedBy, preparedId });
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">Authority reports</h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-zinc-500">
            Download a PDF for {monthTitle(month)}. Pending and overdue uses the live register. The other three reports use complaints filed in the selected month.
          </p>
        </div>
        <label className="text-xs font-semibold text-zinc-700">
          Reporting month
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="mt-1 block rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900"
          />
        </label>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {REPORTS.map((report) => (
          <button
            key={report.kind}
            type="button"
            onClick={() => download(report.kind)}
            className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition-colors hover:border-black hover:bg-white cursor-pointer"
          >
            <span>
              <span className="block text-sm font-bold text-zinc-900">{report.title}</span>
              <span className="mt-1 block text-xs leading-relaxed text-zinc-500">{report.detail}</span>
            </span>
            <Download className="mt-0.5 h-4 w-4 shrink-0 text-zinc-700" />
          </button>
        ))}
      </div>
    </section>
  );
};
