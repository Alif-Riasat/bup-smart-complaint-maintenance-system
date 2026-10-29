import React, { useState, useMemo } from 'react';
import {
  Users,
  ShieldCheck,
  Wrench,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  Flag,
  CheckCircle2,
  Search,
  Filter,
  ShieldAlert,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const UsersAccessView: React.FC = () => {
  const { availableUsers, maintenanceStaff, toggleUserFlag, departments, addMaintenanceOfficer } = useApp();
  const [officerForm, setOfficerForm] = useState({
    name: '',
    email: '',
    phone: '',
    employeeId: '',
    departmentId: '',
    specialization: '',
    password: '',
  });
  const [officerMessage, setOfficerMessage] = useState('');
  const [officerError, setOfficerError] = useState('');

  const [activeTab, setActiveTab] = useState<'all' | 'students' | 'flagged' | 'faculty' | 'maintenance' | 'admin'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customReason, setCustomReason] = useState('Repeated duplicate complaints / spamming portal');

  // Filter Users
  const filteredUsers = useMemo(() => {
    return availableUsers.filter((u) => {
      const matchRole =
        activeTab === 'all'
          ? true
          : activeTab === 'students'
          ? u.role === 'student'
          : activeTab === 'flagged'
          ? !!u.isRedFlagged
          : activeTab === 'faculty'
          ? u.role === 'faculty'
          : activeTab === 'maintenance'
          ? u.role === 'maintenance'
          : u.role === 'admin' || u.role === 'authority';

      const matchSearch =
        searchQuery === '' ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.studentOrEmployeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.departmentName && u.departmentName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchRole && matchSearch;
    });
  }, [availableUsers, activeTab, searchQuery]);

  const flaggedUsersCount = availableUsers.filter((u) => u.isRedFlagged).length;
  const studentsCount = availableUsers.filter((u) => u.role === 'student').length;
  const facultyCount = availableUsers.filter((u) => u.role === 'faculty').length;

  return (
    <div className="space-y-6 font-sans pb-16">
      {/* 1. Header */}
      <div>
        <div className="text-xs text-zinc-400 mb-1">
          Administration / <span className="text-zinc-600 font-medium">Users &amp; access</span>
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
          Users &amp; Access Control
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Students, faculty, and officers register themselves. Administrator accounts are created only with a MySQL command.
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4">
        <div>
          <h2 className="font-bold text-sm text-zinc-900">Add a maintenance officer</h2>
          <p className="text-xs text-zinc-500 mt-1">Officers receive complaints for their department and can mark them in progress, done, on hold, or escalated.</p>
        </div>
        <form
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setOfficerError('');
            setOfficerMessage('');
            try {
              await addMaintenanceOfficer({
                ...officerForm,
                departmentId: officerForm.departmentId || departments[0]?.id || '',
              });
              setOfficerMessage(`${officerForm.name} can now sign in and receive complaints.`);
              setOfficerForm({ name: '', email: '', phone: '', employeeId: '', departmentId: '', specialization: '', password: '' });
            } catch (err: any) {
              setOfficerError(err.message || 'The officer could not be added.');
            }
          }}
        >
          <input required value={officerForm.name} onChange={(e) => setOfficerForm({ ...officerForm, name: e.target.value })} placeholder="Full name" className="border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
          <input required type="email" value={officerForm.email} onChange={(e) => setOfficerForm({ ...officerForm, email: e.target.value })} placeholder="name@bup.edu.bd" className="border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
          <input required value={officerForm.employeeId} onChange={(e) => setOfficerForm({ ...officerForm, employeeId: e.target.value })} placeholder="Employee ID" className="border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
          <input value={officerForm.phone} onChange={(e) => setOfficerForm({ ...officerForm, phone: e.target.value })} placeholder="Phone" className="border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
          <select value={officerForm.departmentId} onChange={(e) => setOfficerForm({ ...officerForm, departmentId: e.target.value })} className="border border-zinc-200 rounded-xl px-3 py-2 text-xs">
            <option value="">Department</option>
            {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
          </select>
          <input value={officerForm.specialization} onChange={(e) => setOfficerForm({ ...officerForm, specialization: e.target.value })} placeholder="Specialization" className="border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
          <input required type="password" value={officerForm.password} onChange={(e) => setOfficerForm({ ...officerForm, password: e.target.value })} placeholder="Temporary password" className="border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
          <button type="submit" className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold">Add officer</button>
        </form>
        {officerMessage && <p className="text-xs text-emerald-700">{officerMessage}</p>}
        {officerError && <p className="text-xs text-red-600">{officerError}</p>}
        <p className="text-[11px] text-zinc-500">To add another administrator, run the commented INSERT in <span className="font-mono">scripts/add-admin.sql</span> inside MySQL. The portal will refuse that role.</p>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Total Accounts
          </div>
          <div className="text-2xl font-black text-zinc-900 mt-1">
            {availableUsers.length}
          </div>
          <div className="text-[11px] text-zinc-500 font-medium mt-1">
            Enrolled in system
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Students
          </div>
          <div className="text-2xl font-black text-zinc-900 mt-1">
            {studentsCount}
          </div>
          <div className="text-[11px] text-zinc-500 font-medium mt-1">
            Campus submitters
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Faculty &amp; Staff
          </div>
          <div className="text-2xl font-black text-zinc-900 mt-1">
            {facultyCount}
          </div>
          <div className="text-[11px] text-zinc-500 font-medium mt-1">
            Academic liaison
          </div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-xs transition-colors ${
          flaggedUsersCount > 0
            ? 'bg-red-50/70 border-red-200 text-red-950'
            : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
        }`}>
          <div className="text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Red-Flagged for Spam</span>
            <Flag className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-black mt-1">
            {flaggedUsersCount}
          </div>
          <div className="text-[11px] font-medium mt-1">
            {flaggedUsersCount > 0 ? 'Throttled / Under review' : 'No spam violations detected'}
          </div>
        </div>
      </div>

      {/* 3. Anti-Spam Governance System Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-start gap-3 shadow-2xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-amber-900 block text-xs">
            Automated Student Anti-Spam Policy Active
          </span>
          <p className="text-[11px] text-amber-900/90 leading-relaxed">
            Students who submit 3 or more complaints rapidly within a single session or trigger anomalous frequencies are automatically red-flagged by the system. Red-flagged students receive submission cooldowns and administrative audit notices. You can manually flag or restore any account below.
          </p>
        </div>
      </div>

      {/* 4. Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-black text-white shadow-2xs'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
            }`}
          >
            All Accounts ({availableUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'students'
                ? 'bg-black text-white shadow-2xs'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
            }`}
          >
            Students ({studentsCount})
          </button>
          <button
            onClick={() => setActiveTab('flagged')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'flagged'
                ? 'bg-red-600 text-white shadow-2xs'
                : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
            }`}
          >
            <Flag className="w-3 h-3" />
            <span>🚩 Flagged for Spam ({flaggedUsersCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('faculty')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'faculty'
                ? 'bg-black text-white shadow-2xs'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
            }`}
          >
            Faculty
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'maintenance'
                ? 'bg-black text-white shadow-2xs'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
            }`}
          >
            Technicians
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'admin'
                ? 'bg-black text-white shadow-2xs'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
            }`}
          >
            Admins
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search student ID, name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white text-xs focus:outline-none focus:border-black transition-colors"
          />
        </div>
      </div>

      {/* 5. Stakeholders Directory Table */}
      <div className="rounded-2xl bg-white border border-zinc-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-zinc-900">Campus Stakeholders Directory</h2>
          <span className="text-xs text-zinc-500">{filteredUsers.length} Users Displayed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">USER</th>
                <th className="px-6 py-3.5">ID / SECTION</th>
                <th className="px-6 py-3.5">EMAIL</th>
                <th className="px-6 py-3.5">ROLE PRIVILEGE</th>
                <th className="px-6 py-3.5">STATUS &amp; SPAM AUDIT</th>
                <th className="px-6 py-3.5">ADMIN MODERATION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-400">
                    No users matching the active filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {u.isRedFlagged && (
                          <span title="Red-flagged for spam complaints" className="text-red-500 font-bold">
                            🚩
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400">{u.departmentName}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-zinc-700">
                      {u.studentOrEmployeeId}
                    </td>
                    <td className="px-6 py-4 text-zinc-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-black text-white'
                          : u.role === 'maintenance'
                          ? 'bg-orange-100 text-orange-900 border border-orange-300'
                          : 'bg-zinc-100 text-zinc-800'
                      }`}>
                        {u.role === 'admin' ? 'Administrator' : u.role === 'maintenance' ? 'Field Technician' : u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.isRedFlagged ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 font-bold text-[10px]">
                            🚩 Red-Flagged (Spam)
                          </span>
                          {u.flagReason && (
                            <div className="text-[10px] text-red-600 font-medium max-w-xs truncate">
                              {u.flagReason}
                            </div>
                          )}
                          {u.flaggedDate && (
                            <div className="text-[9px] text-zinc-400 font-mono">
                              Flagged: {u.flaggedDate}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Good Standing
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.isRedFlagged ? (
                        <button
                          onClick={() => toggleUserFlag(u.id)}
                          className="px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Clear Flag</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleUserFlag(u.id, customReason)}
                          className="px-3 py-1 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Flag className="w-3.5 h-3.5 text-red-600" />
                          <span>Flag for Spam</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Field Technicians Workload Table */}
      <div className="rounded-2xl bg-white border border-zinc-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-zinc-900">Maintenance Technicians Workload</h2>
          <span className="text-xs text-zinc-500">{maintenanceStaff.length} On Duty</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">TECHNICIAN</th>
                <th className="px-6 py-3.5">DEPARTMENT</th>
                <th className="px-6 py-3.5">SPECIALIZATION</th>
                <th className="px-6 py-3.5">ACTIVE TASKS</th>
                <th className="px-6 py-3.5">PHONE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {maintenanceStaff.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-900">{s.name}</td>
                  <td className="px-6 py-4 text-zinc-600">{s.departmentName}</td>
                  <td className="px-6 py-4 text-zinc-600">{s.specialization}</td>
                  <td className="px-6 py-4 font-bold text-zinc-900">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200">
                      {s.activeTasksCount} active
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-600">{s.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
