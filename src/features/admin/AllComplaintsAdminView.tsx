import React, { useState } from 'react';
import {
  Search,
  Filter,
  UserCheck,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Complaint, ComplaintPriority, ComplaintStatus } from '../../types/complaint';
import { AdminComplaintTriageModal } from './AdminComplaintTriageModal';

interface AllComplaintsAdminViewProps {
  onSelectComplaint: (id: string) => void;
}

export const AllComplaintsAdminView: React.FC<AllComplaintsAdminViewProps> = ({
  onSelectComplaint,
}) => {
  const { complaints, categories } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [triageComplaint, setTriageComplaint] = useState<Complaint | null>(null);

  const filtered = complaints.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.userName.toLowerCase().includes(q) ||
        c.buildingName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    const headerLine = 'Complaint_ID,Title,Category,Building,Room,Priority,Status,Submitter,Assigned_Staff\n';
    const rows = filtered.map((c) =>
      `"${c.id}","${c.title.replace(/"/g, '""')}","${c.categoryName}","${c.buildingName}","${c.roomArea}","${c.priority}","${c.status}","${c.userName}","${c.assignedStaffName || 'Unassigned'}"`
    );
    const blob = new Blob([headerLine + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BUP_Complaints_Master_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-sans pb-16">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-zinc-400 mb-1">
            Administration / <span className="text-zinc-600 font-medium">All complaints</span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            Master Complaints Registry
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Review, verify validity, assign maintenance staff, and update ticket lifecycle.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4 text-zinc-500" />
          <span>Export Registry CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by ticket ID, title, submitter, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:border-black"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:border-black"
          >
            <option value="all">All Priorities</option>
            <option value="Emergency">Emergency</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Master Table */}
      <div className="rounded-2xl bg-white border border-zinc-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">REFERENCE</th>
                <th className="px-6 py-3.5">COMPLAINT</th>
                <th className="px-6 py-3.5">LOCATION</th>
                <th className="px-6 py-3.5">SUBMITTER</th>
                <th className="px-6 py-3.5">ASSIGNED STAFF</th>
                <th className="px-6 py-3.5">PRIORITY</th>
                <th className="px-6 py-3.5">STATUS</th>
                <th className="px-6 py-3.5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td
                    onClick={() => onSelectComplaint(item.id)}
                    className="px-6 py-4 font-bold text-zinc-900 cursor-pointer whitespace-nowrap"
                  >
                    {item.id}
                  </td>
                  <td
                    onClick={() => onSelectComplaint(item.id)}
                    className="px-6 py-4 cursor-pointer max-w-xs"
                  >
                    <div className="font-bold text-zinc-900 truncate">{item.title}</div>
                    <div className="text-[11px] text-zinc-400 truncate">{item.categoryName}</div>
                  </td>
                  <td className="px-6 py-4 text-zinc-600 whitespace-nowrap">
                    {item.buildingName} · {item.roomArea}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-zinc-800">{item.userName}</div>
                    <div className="text-[10px] text-zinc-400">{item.studentOrEmployeeId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.assignedStaffName ? (
                      <div>
                        <div className="font-bold text-zinc-900">{item.assignedStaffName}</div>
                        <div className="text-[10px] text-zinc-400">{item.departmentName}</div>
                      </div>
                    ) : (
                      <span className="text-orange-600 font-semibold italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        item.priority === 'Emergency'
                          ? 'bg-orange-100 text-orange-800 border border-orange-300'
                          : item.priority === 'High'
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      {item.priority === 'Emergency' ? 'Urgent' : item.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.status === 'Resolved' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black text-white text-[11px] font-bold">
                        ● Resolved
                      </span>
                    ) : item.status === 'Closed' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black text-white text-[11px] font-bold">
                        ● Closed
                      </span>
                    ) : item.status === 'Pending' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-dashed border-zinc-400 text-zinc-700 text-[11px] font-bold">
                        ● Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 text-[11px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                        {item.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => setTriageComplaint(item)}
                      className="px-3 py-1.5 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Triage &amp; Assign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AdminComplaintTriageModal
        complaint={triageComplaint}
        onClose={() => setTriageComplaint(null)}
        onSuccess={() => setTriageComplaint(null)}
      />
    </div>
  );
};
