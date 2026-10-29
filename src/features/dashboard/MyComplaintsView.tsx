import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Complaint } from '../../types/complaint';
import { priorityClass, priorityLabel } from '../../utils/priority';

interface MyComplaintsViewProps {
  onNewComplaint: () => void;
  onSelectComplaint: (complaintId: string) => void;
}

export const MyComplaintsView: React.FC<MyComplaintsViewProps> = ({
  onNewComplaint,
  onSelectComplaint,
}) => {
  const { currentUser, complaints } = useApp();
  const canFileComplaint = currentUser.role === 'student' || currentUser.role === 'faculty';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pending' | 'Assigned' | 'Resolved' | 'In Progress' | 'Escalated' | 'On Hold'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const isOfficer = currentUser.role === 'maintenance';
  const filters = isOfficer
    ? (['All', 'In Progress', 'Escalated', 'On Hold'] as const)
    : (['All', 'Pending', 'Assigned', 'Resolved'] as const);

  const baseList = isOfficer
    ? complaints.filter((c) => {
        const mine = currentUser.staffId ? c.assignedStaffId === currentUser.staffId : c.assignedStaffName === currentUser.name;
        return mine && !['Resolved', 'Closed', 'Rejected'].includes(c.status);
      })
    : complaints.filter((c) => c.userId === currentUser.id);

  const filtered = baseList.filter((item) => {
    if (activeFilter !== 'All' && item.status !== activeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = item.id.toLowerCase().includes(q);
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchLoc = `${item.buildingName} ${item.roomArea}`.toLowerCase().includes(q);
      if (!matchId && !matchTitle && !matchLoc) return false;
    }
    return true;
  });

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 font-sans pb-16">
      {/* Breadcrumb & Heading matching Image 3 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-zinc-400 mb-1">
            Workspace / <span className="text-zinc-600 font-medium">{isOfficer ? 'Active tasks' : 'My complaints'}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            {isOfficer ? 'Active tasks' : 'My complaints'}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isOfficer
              ? 'Complaints currently assigned to you.'
              : 'Review and track every request you have submitted.'}
          </p>
        </div>

        {canFileComplaint && (
        <button
          onClick={onNewComplaint}
          className="px-4 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New complaint</span>
        </button>
        )}
      </div>

      {/* Filter Row matching Image 3 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input with rounded pill design */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by reference or title..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setActiveFilter(filter);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === filter
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              {filter}
            </button>
          ))}

          <button
            onClick={() => setActiveFilter('All')}
            className="px-3.5 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
            <span>More filters</span>
          </button>
        </div>
      </div>

      {/* Complaints Table Card matching Image 3 */}
      <div className="rounded-2xl bg-white border border-zinc-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">REFERENCE</th>
                <th className="px-6 py-3.5">COMPLAINT</th>
                <th className="px-6 py-3.5">LOCATION</th>
                <th className="px-6 py-3.5">CREATED</th>
                <th className="px-6 py-3.5">PRIORITY</th>
                <th className="px-6 py-3.5">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    {isOfficer ? 'No active tasks match this view.' : 'No complaints match your search query.'}
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectComplaint(item.id)}
                    className="hover:bg-zinc-50/80 transition-colors cursor-pointer"
                  >
                    {/* REFERENCE */}
                    <td className="px-6 py-4 font-bold text-zinc-900 whitespace-nowrap">
                      {item.id}
                    </td>

                    {/* COMPLAINT */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-900">{item.title}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">{item.categoryName}</div>
                    </td>

                    {/* LOCATION */}
                    <td className="px-6 py-4 text-zinc-600 whitespace-nowrap">
                      {item.buildingName} · {item.roomArea}
                    </td>

                    {/* CREATED */}
                    <td className="px-6 py-4 text-zinc-500 whitespace-nowrap">
                      {item.submissionDate}
                    </td>

                    {/* PRIORITY */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${priorityClass(item.priority)}`}>
                          {priorityLabel(item.priority)}
                        </span>
                      </div>
                    </td>

                    {/* STATUS */}
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination matching Image 3 */}
        <div className="p-4 sm:px-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <div>
            Showing {Math.min(startIndex + 1, totalItems)}–
            {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} complaints
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 font-semibold text-zinc-700 cursor-pointer"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  currentPage === page
                    ? 'bg-black text-white'
                    : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 font-semibold text-zinc-700 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
