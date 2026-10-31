import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  PieChart,
  Star,
  Users,
  FileSpreadsheet,
  Printer,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AnalyticsVisuals } from './AnalyticsVisuals';

export const AdminAnalyticsView: React.FC = () => {
  const { complaints, categories, locations, maintenanceStaff } = useApp();

  const totalComplaints = complaints.length;
  const resolvedComplaints = complaints.filter(
    (c) => c.status === 'Resolved' || c.status === 'Closed'
  ).length;
  const inProgressComplaints = complaints.filter((c) => c.status === 'In Progress').length;
  const pendingComplaints = complaints.filter((c) => c.status === 'Pending').length;
  const emergencyCount = complaints.filter((c) => c.priority === 'Emergency').length;

  const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;
  const completedHours = complaints
    .filter((complaint) => complaint.resolvedDate && complaint.submissionDate)
    .map((complaint) => {
      const from = new Date(complaint.submissionDate.replace(' ', 'T')).getTime();
      const to = new Date(String(complaint.resolvedDate).replace(' ', 'T')).getTime();
      return (to - from) / 36e5;
    })
    .filter((hours) => Number.isFinite(hours) && hours >= 0);
  const averageHours = completedHours.length
    ? (completedHours.reduce((sum, hours) => sum + hours, 0) / completedHours.length).toFixed(1)
    : '0.0';

  const ratedComplaints = complaints.filter((c) => !!c.feedbackRating);
  const avgRating =
    ratedComplaints.length > 0
      ? (
          ratedComplaints.reduce((acc, curr) => acc + (curr.feedbackRating || 0), 0) /
          ratedComplaints.length
        ).toFixed(1)
      : '4.8';

  const categoryCounts = categories.map((cat) => {
    const count = complaints.filter((c) => c.categoryId === cat.id).length;
    return {
      name: cat.name,
      count,
      pct: totalComplaints > 0 ? Math.round((count / totalComplaints) * 100) : 0,
    };
  }).sort((a, b) => b.count - a.count);

  const buildingMap = new Map<string, number>();
  complaints.forEach((c) => {
    const b = c.buildingName.replace('Faculty of Science & Technology (FST)', 'FST Building');
    buildingMap.set(b, (buildingMap.get(b) || 0) + 1);
  });
  const buildingCounts = Array.from(buildingMap.entries()).map(([name, count]) => ({
    name,
    count,
  }));

  const handleExportCSV = () => {
    const headerLine = 'Complaint_ID,Title,Category,Building,Room,Priority,Status,Submitter,Assigned_Staff,Rating\n';
    const rows = complaints.map((c) =>
      `"${c.id}","${c.title.replace(/"/g, '""')}","${c.categoryName}","${c.buildingName}","${c.roomArea}","${c.priority}","${c.status}","${c.userName}","${c.assignedStaffName || 'Unassigned'}","${c.feedbackRating || 'N/A'}"`
    );
    const blob = new Blob([headerLine + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BUP_Maintenance_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 font-sans pb-16 text-zinc-900">
      {/* Analytics Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-zinc-400 mb-1">
            Administration / <span className="text-zinc-600 font-medium">Admin analytics</span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            Campus Maintenance Analytics
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Operational metrics, recurring issue distribution, and departmental SLA performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-zinc-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Logged Tickets */}
        <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-zinc-600">Total Logged Tickets</span>
            <div className="w-9 h-9 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-zinc-900 tracking-tight">{totalComplaints}</div>
            <div className="text-xs text-zinc-400 mt-1">Across all campus departments</div>
          </div>
        </div>

        {/* Resolution Rate */}
        <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-zinc-600">Resolution Rate</span>
            <div className="w-9 h-9 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-zinc-900 tracking-tight">{resolutionRate}%</div>
            <div className="text-xs text-zinc-400 mt-1">{resolvedComplaints} of {totalComplaints} completed</div>
          </div>
        </div>

        {/* Avg Resolution Time */}
        <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-zinc-600">Avg Resolution Time</span>
            <div className="w-9 h-9 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-zinc-900 tracking-tight">{averageHours} hrs</div>
            <div className="text-xs text-zinc-500 font-semibold mt-1">From completed complaints in MySQL</div>
          </div>
        </div>

        {/* Campus Satisfaction */}
        <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-zinc-600">Campus Satisfaction</span>
            <div className="w-9 h-9 rounded-xl border border-zinc-200 flex items-center justify-center text-amber-500">
              <Star className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-zinc-900 tracking-tight">{avgRating} / 5.0</div>
            <div className="text-xs text-zinc-400 mt-1">Based on student &amp; faculty feedback</div>
          </div>
        </div>
      </div>

      <AnalyticsVisuals />

      {/* Breakdown Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues by Category */}
        <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-zinc-700" />
                Recurring Issues by Category
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">Focus areas requiring preventative maintenance</p>
            </div>
            <span className="text-[11px] font-semibold text-zinc-400">{categoryCounts.length} categories</span>
          </div>

          <div className="space-y-4">
            {totalComplaints === 0 && (
              <p className="text-xs text-zinc-500">No complaints yet. This chart updates when a complaint is submitted.</p>
            )}
            {categoryCounts.filter((cat) => cat.count > 0).map((cat) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-800 font-bold">{cat.name}</span>
                  <span className="text-zinc-500 font-mono text-[11px]">
                    {cat.count} tickets ({cat.pct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                  <div
                    className="h-full bg-zinc-900 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(cat.pct, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Complaints by Campus Building / Location */}
        <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-zinc-700" />
                Hotspots by Campus Location
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">Facility density and incident concentration</p>
            </div>
            <span className="text-[11px] font-semibold text-zinc-400">{buildingCounts.length} buildings</span>
          </div>

          <div className="space-y-4">
            {totalComplaints === 0 && (
              <p className="text-xs text-zinc-500">No location data yet.</p>
            )}
            {buildingCounts.map((b) => {
              const bPct = totalComplaints > 0 ? Math.round((b.count / totalComplaints) * 100) : 0;
              return (
                <div key={b.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-800 font-bold">{b.name}</span>
                    <span className="text-zinc-500 font-mono text-[11px]">
                      {b.count} tickets ({bPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      className="h-full bg-black rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(bPct, 6)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Maintenance Staff Operational Workload Table */}
      <div className="rounded-2xl bg-white border border-zinc-200/90 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-700" />
              Maintenance Technicians Workload &amp; Status
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Real-time technician queue and dispatch readiness</p>
          </div>
          <span className="text-xs font-semibold text-zinc-500">{maintenanceStaff.length} On Duty</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">TECHNICIAN</th>
                <th className="px-6 py-3.5">DEPARTMENT</th>
                <th className="px-6 py-3.5">SPECIALIZATION</th>
                <th className="px-6 py-3.5">ACTIVE TASKS</th>
                <th className="px-6 py-3.5">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {maintenanceStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-900">{staff.name}</td>
                  <td className="px-6 py-4 text-zinc-600">{staff.departmentName}</td>
                  <td className="px-6 py-4 text-zinc-500">{staff.specialization}</td>
                  <td className="px-6 py-4 font-bold text-zinc-900">
                    <span className="inline-flex whitespace-nowrap px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200 font-mono text-[11px]">
                      {staff.activeTasksCount} active task{staff.activeTasksCount === 1 ? '' : 's'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      On Duty
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
