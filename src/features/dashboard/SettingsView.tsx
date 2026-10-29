import React, { useState } from 'react';
import {
  Settings,
  User,
  Bell,
  Shield,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Lock,
  Mail,
  Phone,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SECURITY_QUESTIONS } from '../../../server/catalog.js';

export const SettingsView: React.FC = () => {
  const { currentUser, resetToDefaultData, changePassword, saveSecurityQuestion } = useApp();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [questionPassword, setQuestionPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState(currentUser.securityQuestion || SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [questionMessage, setQuestionMessage] = useState('');
  const [questionError, setQuestionError] = useState('');

  const handlePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    if (newPassword.length < 6) {
      setPasswordError('The new password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('The new passwords do not match.');
      return;
    }
    try {
      const message = await changePassword(currentPassword, newPassword);
      setPasswordMessage(message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'The password could not be changed.');
    }
  };

  const handleQuestion = async (event: React.FormEvent) => {
    event.preventDefault();
    setQuestionError('');
    setQuestionMessage('');
    if (securityAnswer.trim().length < 2) {
      setQuestionError('Enter an answer of at least 2 characters.');
      return;
    }
    try {
      await saveSecurityQuestion(questionPassword, securityQuestion, securityAnswer.trim());
      setQuestionMessage('Security question saved. It will be used if you forget your password.');
      setQuestionPassword('');
      setSecurityAnswer('');
    } catch (err: any) {
      setQuestionError(err.message || 'The security question could not be saved.');
    }
  };

  const handleReset = async () => {
    await resetToDefaultData();
    setShowResetConfirm(false);
    setResetSuccess(true);
  };

  return (
    <div className="space-y-8 font-sans pb-16 max-w-4xl text-zinc-900">
      {/* Header */}
      <div>
        <div className="text-xs text-zinc-400 mb-1">
          Administration / <span className="text-zinc-600 font-medium">Settings</span>
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
          System &amp; Account Settings
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage your profile and account. Updates appear in the portal notification list.
        </p>
      </div>

      {resetSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Demo complaints and staff assignments have been successfully reset to proposal defaults.</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/90 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-black text-white font-extrabold text-lg flex items-center justify-center shadow-xs">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">{currentUser.name}</h2>
              <p className="text-xs text-zinc-500">{currentUser.departmentName}</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-800 uppercase tracking-wider border border-zinc-200">
            {currentUser.role}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Institutional Email
            </span>
            <span className="font-semibold text-zinc-900">{currentUser.email}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Student / Employee ID
            </span>
            <span className="font-mono font-bold text-zinc-900">{currentUser.studentOrEmployeeId}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Emergency Phone
            </span>
            <span className="font-mono font-medium text-zinc-900">{currentUser.phone || '+880 1700-000000'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Portal Permissions
            </span>
            <span className="font-semibold text-zinc-900">
              {currentUser.role === 'admin'
                ? 'Full Administration (Triage, RBAC, Dispatch)'
                : currentUser.role === 'maintenance'
                ? 'Field Technician (Repair, Resolution Logging)'
                : 'Campus Submitter (File Tickets, Track Progress)'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/90 shadow-xs space-y-5">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Password</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Change the password for this account. Other sessions on this account are signed out.</p>
        </div>
        <form onSubmit={handlePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" className="bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs" />
          <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs" />
          <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs" />
          <div className="sm:col-span-3 flex items-center justify-between gap-3">
            {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}
            {passwordMessage && <p className="text-xs text-emerald-700">{passwordMessage}</p>}
            <button type="submit" className="ml-auto px-4 py-2 rounded-xl bg-black text-white text-xs font-semibold">Update password</button>
          </div>
        </form>
      </div>

      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/90 shadow-xs space-y-5">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Security question</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {currentUser.securityQuestion
              ? `Saved question: ${currentUser.securityQuestion}`
              : 'No question is saved yet. Add one so Forgot password can verify this account.'}
          </p>
        </div>
        <form onSubmit={handleQuestion} className="space-y-3">
          <select value={securityQuestion} onChange={(e) => setSecurityQuestion(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-xs">
            {SECURITY_QUESTIONS.map((question) => (
              <option key={question} value={question}>{question}</option>
            ))}
          </select>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" required value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} placeholder="Answer" className="bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs" />
            <input type="password" required value={questionPassword} onChange={(e) => setQuestionPassword(e.target.value)} placeholder="Current password" className="bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs" />
          </div>
          <div className="flex items-center justify-between gap-3">
            {questionError && <p className="text-xs text-red-600">{questionError}</p>}
            {questionMessage && <p className="text-xs text-emerald-700">{questionMessage}</p>}
            <button type="submit" className="ml-auto px-4 py-2 rounded-xl bg-black text-white text-xs font-semibold">Save question</button>
          </div>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/90 shadow-xs space-y-5">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Notifications</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Alerts stay inside the portal. Email, SMS, and phone notices are turned off for now.</p>
        </div>
        <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
          <span className="font-bold text-xs text-zinc-900 block">In-app alerts</span>
          <span className="text-[11px] text-zinc-500">Assignment, progress, and resolution updates appear under Notifications.</span>
        </div>
      </div>

      {/* Demo Controls & System Maintenance */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/90 shadow-xs space-y-5">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Demonstration &amp; Data Tools</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Manage the demonstration data used in this portal</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-zinc-800 flex items-center gap-2 transition-colors cursor-pointer border border-zinc-200"
          >
            <RotateCcw className="w-4 h-4 text-zinc-600" />
            <span>Reset Demo Data to Proposal Default</span>
          </button>

        </div>
      </div>

      {/* Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 border border-zinc-200 shadow-2xl">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900">Reset Demo Data?</h3>
              <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                This will reload all preloaded complaints, audit trail history, and technician workloads as defined in the BUP capstone proposal.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-semibold cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
