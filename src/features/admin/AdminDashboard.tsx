import React, { useState } from 'react';
import {
  ShieldAlert,
  Inbox,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  Building2,
  BarChart3,
  Database,
  Users,
  Settings,
  ChevronRight,
  ArrowUpDown,
  Send,
  Sparkles,
  FileSpreadsheet,
  Layers,
  Wrench,
  XCircle,
  Plus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Complaint, ComplaintPriority, ComplaintStatus } from '../../types/complaint';
import { AdminComplaintTriageModal } from './AdminComplaintTriageModal';
import { AdminAnalyticsView } from './AdminAnalyticsView';
import { ComplaintDetailModal } from '../user/ComplaintDetailModal';

type AdminTab = 'triage' | 'all-complaints' | 'analytics' | 'departments' | 'facilities';

export const AdminDashboard: React.FC = () => {
  const {
    complaints,
    categories,
    locations,
    departments,
    maintenanceStaff,
    closeComplaint,
    currentUser,
    addCategory,
    addLocation,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('triage');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [triageComplaint, setTriageComplaint] = useState<Complaint | null>(null);
  const [viewDetailId, setViewDetailId] = useState<string | null>(null);

  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [showAddLocModal, setShowAddLocModal] = useState(false);
  const [newLocBuilding, setNewLocBuilding] = useState('');
  const [newLocFloor, setNewLocFloor] = useState('');
  const [newLocRoom, setNewLocRoom] = useState('');

  const triageQueue = complaints.filter(
    (c) => c.status === 'Pending' || (!c.assignedStaffId && c.status !== 'Rejected' && c.status !== 'Closed')
  );

  const pendingCount = complaints.filter((c) => c.status === 'Pending').length;
  const emergencyCount = complaints.filter((c) => c.priority === 'Emergency' && c.status !== 'Closed').length;
  const inProgressCount = complaints.filter((c) => c.status === 'In Progress' || c.status === 'Assigned').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;

  const filteredAllComplaints = complaints.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.userName.toLowerCase().includes(q) ||
        c.buildingName.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;
    if (categoryFilter !== 'all' && c.categoryId !== categoryFilter) return false;
    return true;
  });

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory({
      name: newCatName.trim(),
      description: newCatDesc.trim() || 'Campus facility category',
      iconName: 'Wrench',
      departmentId: departments[0]?.id || 'dept-estate',
      defaultPriority: 'Medium',
    });
    setNewCatName('');
    setNewCatDesc('');
    setShowAddCatModal(false);
  };

  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocBuilding.trim() || !newLocRoom.trim()) return;
    addLocation({
      buildingName: newLocBuilding.trim(),
      floor: newLocFloor.trim() || '1st Floor',
      roomArea: newLocRoom.trim(),
    });
    setNewLocBuilding('');
    setNewLocFloor('');
    setNewLocRoom('');
    setShowAddLocModal(false);
  };

  return (
    <div className="space-y-6 text-[#f2e7d1]">
      {/* Admin Command Header Banner */}
      <div className="rounded-2xl border-2 border-[#f2e7d1]/20 bg-[#121212] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-white text-black flex items-center gap-1.5 shadow-sm">
              <ShieldAlert className="w-3.5 h-3.5" />
              Administrative Command Center
            </span>
            <span className="text-xs text-[#f2e7d1]/70">• Estate &amp; Maintenance Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Campus Complaint &amp; Maintenance Governance
          </h1>
          <p className="text-xs sm:text-sm text-[#f2e7d1]/80 mt-1 max-w-xl leading-relaxed">
            Triage new tickets, assign specialized field staff, enforce SLA resolution times, and review institutional reports.
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          {emergencyCount > 0 && (
            <div className="px-3 py-2 rounded-xl bg-red-950 border border-red-700 text-red-300 text-xs font-bold flex items-center gap-2 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>{emergencyCount} Emergency Ticket{emergencyCount === 1 ? '' : 's'}</span>
            </div>
          )}

          <div className="px-3.5 py-2 rounded-xl bg-black border border-[#f2e7d1]/20 text-xs text-[#f2e7d1]">
            Logged Admin: <strong className="text-white">{currentUser.name}</strong>
          </div>
        </div>
      </div>

      {/* Admin KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setActiveTab('triage')}
          className="p-4 rounded-xl bg-[#141414] border border-[#f2e7d1]/20 hover:border-orange-500/60 cursor-pointer transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#f2e7d1]/70">Pending Triage</span>
            <div className="p-1.5 rounded-lg bg-orange-600/20 text-orange-400 border border-orange-500/30">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-orange-400">{pendingCount}</div>
          <span className="text-[11px] text-[#f2e7d1]/50">Requires review &amp; assignment</span>
        </div>

        <div 
          onClick={() => setActiveTab('all-complaints')}
          className="p-4 rounded-xl bg-[#141414] border border-[#f2e7d1]/20 hover:border-white cursor-pointer transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#f2e7d1]/70">Active Work Orders</span>
            <div className="p-1.5 rounded-lg bg-white text-black font-bold">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{inProgressCount}</div>
          <span className="text-[11px] text-[#f2e7d1]/50">Assigned / In Progress</span>
        </div>

        <div 
          onClick={() => setActiveTab('all-complaints')}
          className="p-4 rounded-xl bg-[#141414] border border-[#f2e7d1]/20 hover:border-[#f2e7d1] cursor-pointer transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#f2e7d1]/70">Resolved &amp; Closed</span>
            <div className="p-1.5 rounded-lg bg-[#f2e7d1] text-black">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#f2e7d1]">{resolvedCount}</div>
          <span className="text-[11px] text-[#f2e7d1]/50">Completed maintenance</span>
        </div>

        <div 
          onClick={() => setActiveTab('departments')}
          className="p-4 rounded-xl bg-[#141414] border border-[#f2e7d1]/20 hover:border-orange-500/60 cursor-pointer transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#f2e7d1]/70">Maintenance Teams</span>
            <div className="p-1.5 rounded-lg bg-[#222222] text-[#f2e7d1]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{maintenanceStaff.length}</div>
          <span className="text-[11px] text-[#f2e7d1]/50">Active technicians</span>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex border-b border-[#f2e7d1]/15 overflow-x-auto no-scrollbar gap-2 pb-1">
        {[
          { id: 'triage', label: 'Triage & Dispatch Queue', badge: pendingCount > 0 ? String(pendingCount) : undefined, icon: Inbox },
          { id: 'all-complaints', label: 'All Complaints Master Registry', icon: Filter },
          { id: 'analytics', label: 'Campus Analytics & Reports (FR-14)', icon: BarChart3 },
          { id: 'departments', label: 'Departments & Staff', icon: Users },
          { id: 'facilities', label: 'Categories & Locations', icon: Building2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#f2e7d1] text-black shadow-sm'
                  : 'text-[#f2e7d1]/70 hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-black text-[#f2e7d1]' : 'bg-orange-600 text-white'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: TRIAGE & DISPATCH QUEUE */}
      {activeTab === 'triage' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Inbox className="w-4 h-4 text-orange-400" />
              <span>Incoming Complaints Requiring Admin Triage (Activity Diagram Fig 05)</span>
            </h2>
            <span className="text-xs text-[#f2e7d1]/70">{triageQueue.length} pending assignment</span>
          </div>

          {triageQueue.length === 0 ? (
            <div className="p-12 text-center bg-[#121212] border-2 border-[#f2e7d1]/20 rounded-2xl">
              <CheckCircle2 className="w-10 h-10 text-[#f2e7d1] mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white mb-1">Queue is Clear!</h3>
              <p className="text-xs text-[#f2e7d1]/70">All submitted complaints have been triaged and dispatched to maintenance staff.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {triageQueue.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-[#141414] border border-[#f2e7d1]/20 hover:border-orange-500/60 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-black bg-[#f2e7d1] px-2.5 py-0.5 rounded shadow-sm">
                        {item.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.priority === 'Emergency'
                            ? 'bg-red-950 text-red-300 border border-red-700'
                            : item.priority === 'High'
                            ? 'bg-orange-950 text-orange-300 border border-orange-600'
                            : 'bg-black text-[#f2e7d1]/70 border border-[#f2e7d1]/20'
                        }`}
                      >
                        {item.priority} Priority
                      </span>
                      <span className="text-xs font-bold text-[#f2e7d1]/90">• {item.categoryName}</span>
                      <span className="text-[11px] text-[#f2e7d1]/50">• {item.submissionDate}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    <p className="text-xs text-[#f2e7d1]/70 line-clamp-2 max-w-3xl leading-relaxed">{item.description}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#f2e7d1]/70 pt-1">
                      <span className="flex items-center gap-1.5 text-white font-medium">
                        <Building2 className="w-3.5 h-3.5 text-orange-400" />
                        {item.buildingName} - {item.roomArea} ({item.floor})
                      </span>
                      <span>
                        Submitter: <strong className="text-white">{item.userName}</strong> ({item.studentOrEmployeeId} • {item.userPhone})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-[#f2e7d1]/15">
                    <button
                      onClick={() => setViewDetailId(item.id)}
                      className="px-3 py-2 rounded-xl bg-[#222222] hover:bg-[#333333] text-[#f2e7d1] text-xs font-bold transition-colors cursor-pointer"
                    >
                      View Details
                    </button>

                    <button
                      onClick={() => setTriageComplaint(item)}
                      className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-700/40 transition-all cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Triage &amp; Assign</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL COMPLAINTS MASTER REGISTRY */}
      {activeTab === 'all-complaints' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#121212] border border-[#f2e7d1]/20 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#f2e7d1]/40 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by ID, Title, Room, or Submitter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black border border-[#f2e7d1]/20 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#f2e7d1]/40 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-black border border-[#f2e7d1]/20 rounded-lg px-2.5 py-2 text-xs text-[#f2e7d1] focus:outline-none focus:border-orange-500"
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
                  className="bg-black border border-[#f2e7d1]/20 rounded-lg px-2.5 py-2 text-xs text-[#f2e7d1] focus:outline-none focus:border-orange-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="Emergency">Emergency</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-black border border-[#f2e7d1]/20 rounded-lg px-2.5 py-2 text-xs text-[#f2e7d1] focus:outline-none focus:border-orange-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Master Table */}
          <div className="overflow-x-auto rounded-2xl border-2 border-[#f2e7d1]/20 bg-[#121212] shadow-2xl">
            <table className="w-full text-left text-xs text-[#f2e7d1]">
              <thead className="bg-black text-[#f2e7d1]/60 uppercase text-[10px] tracking-wider border-b border-[#f2e7d1]/15">
                <tr>
                  <th className="px-4 py-3 font-bold">Ticket ID</th>
                  <th className="px-4 py-3 font-bold">Title &amp; Category</th>
                  <th className="px-4 py-3 font-bold">Campus Location</th>
                  <th className="px-4 py-3 font-bold">Submitter</th>
                  <th className="px-4 py-3 font-bold">Assigned Staff</th>
                  <th className="px-4 py-3 font-bold">Priority</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2e7d1]/10 font-mono">
                {filteredAllComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-4 py-3 font-bold text-orange-400 whitespace-nowrap">
                      {c.id}
                    </td>
                    <td className="px-4 py-3 font-sans max-w-xs">
                      <div className="font-bold text-white truncate">{c.title}</div>
                      <div className="text-[11px] text-[#f2e7d1]/60 truncate">{c.categoryName}</div>
                    </td>
                    <td className="px-4 py-3 font-sans whitespace-nowrap text-[#f2e7d1]">
                      <div>{c.buildingName}</div>
                      <div className="text-[11px] text-[#f2e7d1]/50">{c.roomArea}</div>
                    </td>
                    <td className="px-4 py-3 font-sans whitespace-nowrap">
                      <div className="text-white font-bold">{c.userName}</div>
                      <div className="text-[10px] text-[#f2e7d1]/50">{c.studentOrEmployeeId}</div>
                    </td>
                    <td className="px-4 py-3 font-sans whitespace-nowrap">
                      {c.assignedStaffName ? (
                        <div>
                          <div className="text-[#f2e7d1] font-bold">{c.assignedStaffName}</div>
                          <div className="text-[10px] text-[#f2e7d1]/50">{c.departmentName}</div>
                        </div>
                      ) : (
                        <span className="text-orange-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-sans whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.priority === 'Emergency'
                            ? 'bg-red-950 text-red-300 border border-red-700'
                            : c.priority === 'High'
                            ? 'bg-orange-950 text-orange-300 border border-orange-600'
                            : 'bg-black text-[#f2e7d1]/70 border border-[#f2e7d1]/20'
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded ${
                          c.status === 'Resolved'
                            ? 'bg-[#f2e7d1] text-black'
                            : c.status === 'In Progress'
                            ? 'bg-orange-600 text-white'
                            : c.status === 'Assigned'
                            ? 'bg-white text-black'
                            : c.status === 'Rejected'
                            ? 'bg-red-900 text-red-200'
                            : c.status === 'Closed'
                            ? 'bg-[#262626] text-[#f2e7d1]'
                            : 'bg-black text-orange-400 border border-orange-500/30'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans whitespace-nowrap text-right space-x-1.5">
                      <button
                        onClick={() => setViewDetailId(c.id)}
                        className="px-2.5 py-1 rounded bg-[#222222] hover:bg-[#333333] text-[#f2e7d1] text-xs font-bold transition-colors"
                      >
                        Details
                      </button>

                      <button
                        onClick={() => setTriageComplaint(c)}
                        className="px-2.5 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CAMPUS ANALYTICS & REPORTS */}
      {activeTab === 'analytics' && <AdminAnalyticsView />}

      {/* TAB 4: DEPARTMENTS & STAFF */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-400" />
              <span>Campus Maintenance Units &amp; Field Technicians (Figure 08: DEPARTMENT &amp; MAINTENANCE_STAFF)</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map((dept) => {
              const deptStaff = maintenanceStaff.filter((s) => s.departmentId === dept.id);
              return (
                <div key={dept.id} className="p-5 rounded-2xl bg-[#141414] border border-[#f2e7d1]/20 space-y-3 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white text-sm">{dept.name}</h3>
                      <p className="text-xs text-[#f2e7d1]/70 mt-0.5">Head: {dept.headName}</p>
                    </div>
                    <span className="text-[10px] text-black bg-[#f2e7d1] px-2 py-0.5 rounded font-bold">
                      {deptStaff.length} Staff Members
                    </span>
                  </div>

                  <div className="text-xs text-[#f2e7d1]/70 space-y-1 bg-black p-3 rounded-xl border border-[#f2e7d1]/15">
                    <div>Contact: <span className="text-white font-mono">{dept.contactInfo}</span></div>
                    <div>Email: <span className="text-white font-mono">{dept.email}</span></div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#f2e7d1]/15">
                    <span className="text-[11px] font-bold text-[#f2e7d1]/80 uppercase tracking-wider block">
                      Active Technicians
                    </span>
                    {deptStaff.map((staff) => (
                      <div key={staff.id} className="flex items-center justify-between text-xs bg-black p-2.5 rounded-lg border border-[#f2e7d1]/15">
                        <div>
                          <span className="text-white font-bold">{staff.name}</span>
                          <span className="text-[#f2e7d1]/50 block text-[10px]">{staff.specialization}</span>
                        </div>
                        <span className="text-[11px] font-mono text-orange-400 font-bold">
                          {staff.activeTasksCount} active tasks
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: CATEGORIES & LOCATIONS */}
      {activeTab === 'facilities' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#141414] border border-[#f2e7d1]/20 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Complaint Categories (COMPLAINT_CATEGORY)</h3>
                <p className="text-xs text-[#f2e7d1]/70">Classrooms, labs, vending machines, shuttles, network</p>
              </div>
              <button
                onClick={() => setShowAddCatModal(true)}
                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {categories.map((c) => (
                <div key={c.id} className="p-3.5 rounded-xl bg-black border border-[#f2e7d1]/15 space-y-1">
                  <span className="text-xs font-bold text-white block">{c.name}</span>
                  <p className="text-[11px] text-[#f2e7d1]/60 line-clamp-2">{c.description}</p>
                  <span className="text-[10px] text-orange-400 block pt-1 font-bold">Default: {c.defaultPriority}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#141414] border border-[#f2e7d1]/20 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Campus Locations (LOCATION)</h3>
                <p className="text-xs text-[#f2e7d1]/70">BUP Buildings, academic floors, labs, and shuttle stops</p>
              </div>
              <button
                onClick={() => setShowAddLocModal(true)}
                className="px-3 py-1.5 rounded-lg bg-[#f2e7d1] hover:bg-white text-black text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Location</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {locations.map((loc) => (
                <div key={loc.id} className="p-3.5 rounded-xl bg-black border border-[#f2e7d1]/15 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Building2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span className="truncate">{loc.buildingName}</span>
                  </div>
                  <p className="text-xs text-[#f2e7d1] font-bold">{loc.roomArea}</p>
                  <span className="text-[10px] text-[#f2e7d1]/50 block">{loc.floor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AdminComplaintTriageModal
        complaint={triageComplaint}
        onClose={() => setTriageComplaint(null)}
        onSuccess={() => setTriageComplaint(null)}
      />

      <ComplaintDetailModal
        complaintId={viewDetailId}
        onClose={() => setViewDetailId(null)}
      />

      {/* Add Category Modal */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs text-[#f2e7d1]">
          <div className="bg-[#121212] border-2 border-[#f2e7d1]/20 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Add New Complaint Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="text-xs text-[#f2e7d1]/70 block mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Elevators &amp; Lifts"
                  className="w-full bg-black border border-[#f2e7d1]/20 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-[#f2e7d1]/70 block mb-1">Description</label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="e.g. Malfunctioning doors, button lights..."
                  className="w-full bg-black border border-[#f2e7d1]/20 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#222222] text-xs text-[#f2e7d1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-orange-600 text-xs text-white font-bold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {showAddLocModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs text-[#f2e7d1]">
          <div className="bg-[#121212] border-2 border-[#f2e7d1]/20 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Add Campus Facility Location</h3>
            <form onSubmit={handleCreateLocation} className="space-y-3">
              <div>
                <label className="text-xs text-[#f2e7d1]/70 block mb-1">Building Name</label>
                <input
                  type="text"
                  required
                  value={newLocBuilding}
                  onChange={(e) => setNewLocBuilding(e.target.value)}
                  placeholder="e.g. Vista Hall Complex"
                  className="w-full bg-black border border-[#f2e7d1]/20 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-[#f2e7d1]/70 block mb-1">Floor</label>
                <input
                  type="text"
                  value={newLocFloor}
                  onChange={(e) => setNewLocFloor(e.target.value)}
                  placeholder="e.g. 2nd Floor"
                  className="w-full bg-black border border-[#f2e7d1]/20 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-[#f2e7d1]/70 block mb-1">Room or Area</label>
                <input
                  type="text"
                  required
                  value={newLocRoom}
                  onChange={(e) => setNewLocRoom(e.target.value)}
                  placeholder="e.g. Server Room B"
                  className="w-full bg-black border border-[#f2e7d1]/20 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLocModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#222222] text-xs text-[#f2e7d1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#f2e7d1] text-xs text-black font-bold"
                >
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
