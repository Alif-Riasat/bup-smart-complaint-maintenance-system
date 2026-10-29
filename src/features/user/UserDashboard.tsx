import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  ArrowRight,
  Sparkles,
  Inbox,
  Star,
  Layers,
  GraduationCap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Complaint, ComplaintStatus } from '../../types/complaint';
import { SubmitComplaintModal } from './SubmitComplaintModal';
import { ComplaintDetailModal } from './ComplaintDetailModal';

export const UserDashboard: React.FC = () => {
  const { complaints, currentUser, categories } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  const [viewScope, setViewScope] = useState<'my' | 'all'>('my');

  const filteredComplaints = complaints.filter((c) => {
    if (viewScope === 'my' && c.userId !== currentUser.id) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = c.id.toLowerCase().includes(q);
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchDesc = c.description.toLowerCase().includes(q);
      const matchLoc = `${c.buildingName} ${c.roomArea}`.toLowerCase().includes(q);
      if (!matchId && !matchTitle && !matchDesc && !matchLoc) return false;
    }

    if (selectedCategory !== 'all' && c.categoryId !== selectedCategory) {
      return false;
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && (c.status === 'Resolved' || c.status === 'Closed' || c.status === 'Rejected')) return false;
      if (statusFilter === 'resolved' && c.status !== 'Resolved' && c.status !== 'Closed') return false;
      if (statusFilter === 'pending' && c.status !== 'Pending') return false;
    }

    return true;
  });

  const userComplaints = complaints.filter((c) => c.userId === currentUser.id);
  const activeCount = userComplaints.filter(
    (c) => c.status === 'Pending' || c.status === 'Assigned' || c.status === 'In Progress'
  ).length;
  const resolvedCount = userComplaints.filter(
    (c) => c.status === 'Resolved' || c.status === 'Closed'
  ).length;
  const needFeedbackCount = userComplaints.filter(
    (c) => c.status === 'Resolved' && !c.feedbackRating
  ).length;

  return (
    <div className="space-y-6 text-[#f2e7d1]">
      {/* User Welcome Banner with Cream and Black Styling */}
      <div className="rounded-2xl border-2 border-[#f2e7d1]/20 bg-[#121212] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#f2e7d1] text-black flex items-center gap-1.5 shadow-sm">
              <GraduationCap className="w-3.5 h-3.5" />
              {currentUser.userType === 'faculty' ? 'Faculty Portal' : 'Student & Staff Portal'}
            </span>
            <span className="text-xs text-[#f2e7d1]/70">• {currentUser.departmentName}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Welcome, {currentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#f2e7d1]/80 mt-1 max-w-xl leading-relaxed">
            Submit, track, and monitor campus maintenance requests across BUP facilities (Vending machines, Shuttles, Labs, AC, Wi-Fi, Electrical &amp; Washrooms).
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="relative z-10 px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs tracking-wide flex items-center gap-2 shadow-lg shadow-orange-700/40 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Lodge New Complaint</span>
        </button>
      </div>

      {/* Metrics Row (Black / Cream Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#141414] border border-[#f2e7d1]/20 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#f2e7d1]/70">My Complaints</span>
            <div className="p-1.5 rounded-lg bg-[#f2e7d1] text-black">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{userComplaints.length}</div>
          <span className="text-[11px] text-[#f2e7d1]/60">Total submitted by you</span>
        </div>

        <div className="p-4 rounded-xl bg-[#141414] border border-[#f2e7d1]/20 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#f2e7d1]/70">Active / In Progress</span>
            <div className="p-1.5 rounded-lg bg-orange-600 text-white">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-orange-400">{activeCount}</div>
          <span className="text-[11px] text-[#f2e7d1]/60">Assigned or being fixed</span>
        </div>

        <div className="p-4 rounded-xl bg-[#141414] border border-[#f2e7d1]/20 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#f2e7d1]/70">Resolved &amp; Closed</span>
            <div className="p-1.5 rounded-lg bg-white text-black">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{resolvedCount}</div>
          <span className="text-[11px] text-[#f2e7d1]/60">Successfully resolved</span>
        </div>

        <div className="p-4 rounded-xl bg-[#141414] border border-[#f2e7d1]/20 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#f2e7d1]/70">Awaiting Feedback</span>
            <div className="p-1.5 rounded-lg bg-[#f2e7d1]/20 text-orange-400">
              <Star className="w-4 h-4 fill-orange-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-orange-400">{needFeedbackCount}</div>
          <span className="text-[11px] text-[#f2e7d1]/60">Rate completed repairs</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#121212] border border-[#f2e7d1]/20 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Scope Toggle (My Complaints vs All Campus) */}
          <div className="flex items-center bg-black p-1 rounded-lg border border-[#f2e7d1]/20 text-xs shrink-0">
            <button
              onClick={() => setViewScope('my')}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
                viewScope === 'my'
                  ? 'bg-[#f2e7d1] text-black shadow-xs'
                  : 'text-[#f2e7d1]/70 hover:text-white'
              }`}
            >
              My Complaints ({userComplaints.length})
            </button>
            <button
              onClick={() => setViewScope('all')}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
                viewScope === 'all'
                  ? 'bg-[#f2e7d1] text-black shadow-xs'
                  : 'text-[#f2e7d1]/70 hover:text-white'
              }`}
            >
              All Campus Issues ({complaints.length})
            </button>
          </div>

          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#f2e7d1]/40 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ID, keyword, or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-[#f2e7d1]/20 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#f2e7d1]/40 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Sub-filters: Status & Category */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#f2e7d1]/15">
          <span className="text-xs text-[#f2e7d1]/80 flex items-center gap-1 font-bold mr-1">
            <Filter className="w-3.5 h-3.5 text-orange-400" />
            Status:
          </span>
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending' },
            { id: 'active', label: 'In Progress' },
            { id: 'resolved', label: 'Resolved' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === item.id
                  ? 'bg-[#f2e7d1] text-black font-bold'
                  : 'text-[#f2e7d1]/70 hover:bg-[#222222] hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}

          <div className="h-4 w-px bg-[#f2e7d1]/20 mx-2 hidden sm:block" />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-black border border-[#f2e7d1]/20 rounded-md text-xs text-[#f2e7d1] px-2.5 py-1 focus:outline-none focus:border-orange-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Complaints List / Cards */}
      <div className="space-y-3">
        {filteredComplaints.length === 0 ? (
          <div className="p-12 text-center bg-[#121212] border-2 border-[#f2e7d1]/20 rounded-2xl">
            <Inbox className="w-10 h-10 text-[#f2e7d1]/40 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">No complaints found</h3>
            <p className="text-xs text-[#f2e7d1]/70 max-w-sm mx-auto mb-4">
              {viewScope === 'my'
                ? "You haven't submitted any complaints matching this filter yet."
                : "No campus complaints match your current search criteria."}
            </p>
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold"
            >
              Lodge Complaint Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredComplaints.map((item) => {
              const isUrgent = item.priority === 'High' || item.priority === 'Emergency';

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedComplaintId(item.id)}
                  className="p-5 rounded-2xl bg-[#141414] border border-[#f2e7d1]/20 hover:border-orange-500/60 hover:bg-[#1a1a1a] transition-all cursor-pointer flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    {/* Top row: ID, Category & Priority */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-black bg-[#f2e7d1] px-2 py-0.5 rounded shadow-sm">
                          {item.id}
                        </span>
                        <span className="text-xs font-bold text-[#f2e7d1]/90">
                          {item.categoryName}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.priority === 'Emergency'
                            ? 'bg-red-950 text-red-300 border border-red-700'
                            : item.priority === 'High'
                            ? 'bg-orange-950 text-orange-300 border border-orange-600'
                            : 'bg-black text-[#f2e7d1]/70 border border-[#f2e7d1]/20'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>

                    {/* Complaint Title */}
                    <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1 mb-1.5">
                      {item.title}
                    </h3>

                    {/* Description snippet */}
                    <p className="text-xs text-[#f2e7d1]/70 line-clamp-2 leading-relaxed mb-3">
                      {item.description}
                    </p>

                    {/* Location Badge */}
                    <div className="flex items-center gap-1.5 text-xs text-[#f2e7d1]/80 bg-black px-2.5 py-1.5 rounded-lg border border-[#f2e7d1]/15 mb-3">
                      <Building2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span className="truncate">
                        {item.buildingName} • {item.roomArea}
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom: Status & Action */}
                  <div className="pt-3 border-t border-[#f2e7d1]/15 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${
                          item.status === 'Resolved'
                            ? 'bg-[#f2e7d1] text-black'
                            : item.status === 'In Progress'
                            ? 'bg-orange-600 text-white'
                            : item.status === 'Assigned'
                            ? 'bg-white text-black'
                            : item.status === 'Rejected'
                            ? 'bg-red-900 text-red-200'
                            : item.status === 'Closed'
                            ? 'bg-[#262626] text-[#f2e7d1]'
                            : 'bg-[#1b1712] text-orange-400 border border-orange-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'In Progress'
                              ? 'bg-white animate-pulse'
                              : item.status === 'Resolved'
                              ? 'bg-black'
                              : 'bg-orange-400'
                          }`}
                        />
                        {item.status}
                      </span>

                      {item.feedbackRating && (
                        <span className="text-[11px] text-orange-400 font-bold flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
                          {item.feedbackRating}★
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-orange-400 font-bold group-hover:translate-x-0.5 transition-transform">
                      <span>Track Status</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <SubmitComplaintModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSuccess={(id) => {
          setSelectedComplaintId(id);
        }}
      />

      <ComplaintDetailModal
        complaintId={selectedComplaintId}
        onClose={() => setSelectedComplaintId(null)}
      />
    </div>
  );
};
