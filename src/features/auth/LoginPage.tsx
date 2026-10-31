import React, { useState, useEffect } from 'react';
import {
  Mail,
  User as UserIcon,
  Phone,
  Shield,
  Zap,
  Clock,
  Wifi,
  AlertTriangle,
  ArrowRight,
  Ambulance,
  PhoneCall,
  Flame,
  Radio,
  Eye,
  EyeOff,
  Copy,
  Check,
  Droplets,
  Hammer,
  Fan,
  Building2,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ACADEMIC_DEPARTMENTS, SECURITY_QUESTIONS } from '../../../server/catalog.js';

interface ServiceNode {
  id: string;
  name: string;
  shortName: string;
  category: string;
  phone: string;
  mobile: string;
  ext: string;
  dutyPerson: string;
  dutyRole: string;
  location: string;
  availability: string;
  icon: React.ElementType;
  color: string;
  bgLight: string;
}

export const LoginPage: React.FC = () => {
  const { login, registerUser, emergencyContacts, sessionNotice, clearSessionNotice } = useApp();
  const demoAccounts = [
    { label: 'Nusrat (student)', id: '24549010088' },
    { label: 'Suman (faculty)', id: 'FAC-IOT-108' },
    { label: 'Zahid (admin)', id: 'ADM-BUP-001' },
    { label: 'Rafiqul (officer)', id: 'STF-ELEC-401' },
    { label: 'Ayesha (harassment)', id: 'STF-HAR-501' },
    { label: 'Kamrul (drug desk)', id: 'STF-DRG-502' },
    { label: 'Hasan (security)', id: 'STF-SEC-503' },
    { label: 'Minhaz (miscellaneous)', id: 'STF-MSC-504' },
  ];

  // Mode: 'login' or 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotId, setForgotId] = useState('');
  const [forgotQuestion, setForgotQuestion] = useState('');
  const [forgotAnswer, setForgotAnswer] = useState('');
  const [forgotPassword, setForgotPassword] = useState('');
  const [forgotConfirm, setForgotConfirm] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotBusy, setForgotBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Right-side Carousel Slide: 0 = Network Hub, 1 = Emergency Numbers, 2 = Our Servicers
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('elec');
  const [selectedEmergencyCategory, setSelectedEmergencyCategory] = useState<string>('All');

  // Sign In Form State
  const [loginEmailOrId, setLoginEmailOrId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regId, setRegId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDepartment, setRegDepartment] = useState(ACADEMIC_DEPARTMENTS[0]);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regQuestion, setRegQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [regAnswer, setRegAnswer] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Handle Quick Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    clearSessionNotice();

    if (!loginEmailOrId.trim() || !loginPassword.trim()) {
      setLoginError('Enter your BUP ID or email and your password.');
      return;
    }

    setLoginBusy(true);
    try {
      await login(loginEmailOrId.trim(), loginPassword, rememberMe);
    } catch (err: any) {
      setLoginError(err.message || 'Sign-in failed.');
    } finally {
      setLoginBusy(false);
    }
  };

  const handleQuickFill = (account: { id: string }) => {
    setLoginEmailOrId(account.id);
    setLoginPassword('123456');
    setLoginError('');
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regFullName.trim() || !regId.trim() || !regEmail.trim()) {
      setRegError('Please provide your Full Name, ID, and BUP Institutional Email.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match. Please re-enter.');
      return;
    }

    if (regAnswer.trim().length < 2) {
      setRegError('Enter an answer to your security question.');
      return;
    }

    if (!regEmail.trim().toLowerCase().endsWith('@bup.edu.bd')) {
      setRegError('Use your BUP email address ending in @bup.edu.bd.');
      return;
    }

    try {
      await registerUser({
        name: regFullName.trim(),
        studentOrEmployeeId: regId.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim() || '+880 1700-000000',
        password: regPassword,
        departmentName: regDepartment,
        role: 'student',
        securityQuestion: regQuestion,
        securityAnswer: regAnswer.trim(),
      });
      setRegSuccess('Account created. Signing you in...');
      await login(regEmail.trim(), regPassword, true);
    } catch (err: any) {
      setRegError(err.message || 'The account could not be created.');
    }
  };

  const handleForgotLookup = async (event: React.FormEvent) => {
    event.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setForgotBusy(true);
    try {
      const response = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotId.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'The account could not be found.');
      setForgotQuestion(data.question);
    } catch (err: any) {
      setForgotQuestion('');
      setForgotError(err.message || 'The account could not be found.');
    } finally {
      setForgotBusy(false);
    }
  };

  const handleForgotReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    if (forgotPassword.length < 6) {
      setForgotError('The new password must be at least 6 characters.');
      return;
    }
    if (forgotPassword !== forgotConfirm) {
      setForgotError('The new passwords do not match.');
      return;
    }
    setForgotBusy(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: forgotId.trim(),
          answer: forgotAnswer.trim(),
          password: forgotPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'The password could not be reset.');
      setForgotSuccess(data.message);
      setLoginEmailOrId(forgotId.trim());
      setLoginPassword('');
    } catch (err: any) {
      setForgotError(err.message || 'The password could not be reset.');
    } finally {
      setForgotBusy(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 8 Surrounding Campus Nodes for the Right Column Network Graph
  const serviceNodes: ServiceNode[] = [
    {
      id: 'sec',
      name: 'Campus Security & Proctor',
      shortName: 'Security',
      category: 'Safety & Surveillance',
      phone: '+880 2-8000448',
      mobile: '+880 1769-021200',
      ext: 'Ext. 111',
      dutyPerson: 'Major (Retd) Anwar Hossain',
      dutyRole: 'Chief Proctor Office',
      location: 'Main Campus Gate Plaza',
      availability: '24 Hours / 7 Days',
      icon: Shield,
      color: '#2563eb',
      bgLight: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    {
      id: 'elec',
      name: 'Electrical & Power Wing',
      shortName: 'Electrical',
      category: 'Power & Substation',
      phone: '+880 2-8000452',
      mobile: '+880 1769-021220',
      ext: 'Ext. 114',
      dutyPerson: 'Engr. Rezaul Karim',
      dutyRole: 'Superintending Engineer',
      location: 'Substation & Power Block',
      availability: '8:00 AM – 10:00 PM',
      icon: Zap,
      color: '#f59e0b',
      bgLight: 'bg-amber-50 text-amber-600 border-amber-200'
    },
    {
      id: 'med',
      name: 'Medical Center & Ambulance',
      shortName: 'Medical',
      category: 'Emergency Healthcare',
      phone: '+880 2-8000445',
      mobile: '+880 1769-021210',
      ext: 'Ext. 119',
      dutyPerson: 'Dr. Shahana Akhter',
      dutyRole: 'Chief Medical Officer',
      location: 'Student Hostel Complex GF',
      availability: '24 Hours Emergency On-Call',
      icon: Ambulance,
      color: '#e11d48',
      bgLight: 'bg-rose-50 text-rose-600 border-rose-200'
    },
    {
      id: 'ict',
      name: 'ICT Network NOC Helpdesk',
      shortName: 'ICT & Wi-Fi',
      category: 'Campus Fiber & Servers',
      phone: '+880 2-8000455',
      mobile: '+880 1769-021230',
      ext: 'Ext. 115',
      dutyPerson: 'Md. Shahidul Islam',
      dutyRole: 'Senior Network Administrator',
      location: 'Academic Block 1, Room 401',
      availability: '8:30 AM – 6:00 PM',
      icon: Wifi,
      color: '#6366f1',
      bgLight: 'bg-indigo-50 text-indigo-600 border-indigo-200'
    },
    {
      id: 'fire',
      name: 'Fire Safety & Disaster Desk',
      shortName: 'Fire Safety',
      category: 'Hazards & Evacuation',
      phone: '+880 2-8000465',
      mobile: '+880 1769-021205',
      ext: 'Ext. 999',
      dutyPerson: 'Safety Officer Kamal',
      dutyRole: 'Emergency Dispatcher',
      location: 'Command Office Level 1',
      availability: '24 Hours Emergency Line',
      icon: Flame,
      color: '#ea580c',
      bgLight: 'bg-orange-50 text-orange-600 border-orange-200'
    },
    {
      id: 'hvac',
      name: 'HVAC & Central Air Conditioning',
      shortName: 'HVAC / AC',
      category: 'Chillers & Ventilation',
      phone: '+880 2-8000453',
      mobile: '+880 1769-021225',
      ext: 'Ext. 113',
      dutyPerson: 'Rafiqul Islam',
      dutyRole: 'Lead HVAC Technician',
      location: 'Engineering Services Wing',
      availability: '8:00 AM – 8:00 PM',
      icon: Fan,
      color: '#0284c7',
      bgLight: 'bg-sky-50 text-sky-600 border-sky-200'
    },
    {
      id: 'water',
      name: 'Water Supply & Plumbing',
      shortName: 'Plumbing',
      category: 'Sanitation & Filtration',
      phone: '+880 2-8000460',
      mobile: '+880 1769-021228',
      ext: 'Ext. 117',
      dutyPerson: 'Nurul Huda',
      dutyRole: 'Senior Facilities Plumber',
      location: 'Estate Office Basement',
      availability: '7:30 AM – 8:00 PM',
      icon: Droplets,
      color: '#0891b2',
      bgLight: 'bg-cyan-50 text-cyan-600 border-cyan-200'
    },
    {
      id: 'civil',
      name: 'General Civil & Carpentry',
      shortName: 'Civil Works',
      category: 'Structural & Furniture',
      phone: '+880 2-8000441',
      mobile: '+880 1769-021235',
      ext: 'Ext. 110',
      dutyPerson: 'Engr. Masud Rana',
      dutyRole: 'Estate Works Supervisor',
      location: 'Logistics Building Level 1',
      availability: '8:00 AM – 5:00 PM',
      icon: Hammer,
      color: '#475569',
      bgLight: 'bg-slate-50 text-slate-700 border-slate-200'
    }
  ];

  // Campus Servicers Data
  const campusServicers = [
    {
      id: 'serv-1',
      name: 'Rafiqul Islam',
      role: 'Lead Field Technician',
      department: 'Electrical & Mechanical Wing',
      specialty: 'HVAC Chillers, Substation & 3-Phase Power',
      phone: '+880 1711-234567',
      email: 'rafiqul.maint@bup.edu.bd',
      activeTasks: 2,
      resolvedCount: 148,
      rating: 4.9,
      status: 'On Duty',
      avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=160&auto=format&fit=crop&q=80'
    },
    {
      id: 'serv-2',
      name: 'Tariqul Alam',
      role: 'Senior Network Technician',
      department: 'ICT & Network Support Desk',
      specialty: 'Campus Wi-Fi 6, Fiber Splice & Access Points',
      phone: '+880 1819-345678',
      email: 'tariqul.ict@bup.edu.bd',
      activeTasks: 1,
      resolvedCount: 215,
      rating: 4.85,
      status: 'On Duty',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80'
    },
    {
      id: 'serv-3',
      name: 'Nurul Huda',
      role: 'Facilities & Plumbing Specialist',
      department: 'Estate & Maintenance Office',
      specialty: 'Clean Water Flow, Pressure Valves & Drainage',
      phone: '+880 1912-456789',
      email: 'nurul.estate@bup.edu.bd',
      activeTasks: 1,
      resolvedCount: 182,
      rating: 4.8,
      status: 'On Duty',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80'
    },
    {
      id: 'serv-4',
      name: 'Kamrul Hasan',
      role: 'Transport & Logistics Officer',
      department: 'Transport & Shuttle Service',
      specialty: 'Student Shuttle Fleets & Vending Machines',
      phone: '+880 1515-567890',
      email: 'kamrul.transport@bup.edu.bd',
      activeTasks: 1,
      resolvedCount: 96,
      rating: 4.75,
      status: 'Standby',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&auto=format&fit=crop&q=80'
    }
  ];

  const selectedNode = serviceNodes.find((n) => n.id === selectedNodeId) || serviceNodes[1];

  return (
    <div className="min-h-screen bg-[#fafafb] text-zinc-900 font-sans flex flex-col justify-between selection:bg-zinc-900 selection:text-white">
      
      {/* ============================================================ */}
      {/* 1. TOP BROWSER / SYSTEM HEADER BAR (Matching Clean Aesthetic) */}
      {/* ============================================================ */}
      <header className="h-14 bg-white border-b border-zinc-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 min-w-0" aria-label="BUP maintenance portal home">
            <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center font-black text-[11px] tracking-tight shadow-xs">
              BUP
            </div>
            <span className="font-bold text-xs tracking-tight text-zinc-900 hidden sm:inline-block">
              Bangladesh University of Professionals
            </span>
          </a>
          <div className="flex items-center gap-2">
            <span className="text-zinc-300 hidden sm:inline-block">•</span>
            <span className="text-[11px] text-zinc-500 font-medium hidden md:inline-block">
              Smart Complaint Maintenance Portal
            </span>
          </div>
        </div>

        {/* Right Action: Helpline button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveSlide(1);
            }}
            className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5 text-red-600" />
            <span className="hidden sm:inline">Emergency:</span>
            <span className="font-mono text-[11px] font-bold">+8809666790799</span>
          </button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. SPLIT SCREEN LOGIN & EMERGENCY / SERVICERS LAYOUT         */}
      {/* Exactly matching user's uploaded image UI                     */}
      {/* ============================================================ */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">

          {/* ---------------------------------------------------------- */}
          {/* LEFT PORTION: AUTHENTIC MINIMALIST LOGIN FORM               */}
          {/* Exactly matching screenshot: No Google/GitHub options      */}
          {/* ---------------------------------------------------------- */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="max-w-[420px] w-full mx-auto py-6 sm:py-10">
              
              {/* Top Center App Icon (Matching black rounded squircle in screenshot) */}
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-md mx-auto mb-5 transition-transform hover:scale-105">
                <svg
                  className="w-6 h-6 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="18" x="3" y="3" rx="5" />
                  <path d="M9 10h.01" />
                  <path d="M15 10h.01" />
                  <path d="M9.5 15a3.5 3.5 0 0 0 5 0" />
                </svg>
              </div>

              {/* Title & Subtitle (Matching screenshot typography) */}
              <div className="text-center mb-7">
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
                  {authMode === 'login' ? 'Sign in' : 'Create an account'}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 mt-1.5 leading-relaxed">
                  {authMode === 'login'
                    ? 'Use your BUP ID to open the maintenance portal.'
                    : 'Everyone registers as a general user.'}
                </p>
              </div>

              {/* Segmented Mode Switcher (Sign In vs Register) */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200/80 mb-6 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setLoginError('');
                    setRegError('');
                  }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setForgotOpen(false);
                    setLoginError('');
                    setRegError('');
                  }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  Register New
                </button>
              </div>

              {/* ====================================================== */}
              {/* OPTION 1: SIGN IN VIEW                                 */}
              {/* ====================================================== */}
              {authMode === 'login' && forgotOpen ? (
                <form onSubmit={forgotQuestion ? handleForgotReset : handleForgotLookup} className="space-y-3.5">
                  <p className="text-xs text-zinc-500">Enter your BUP ID or email. You will be asked the security question saved when the account was registered.</p>
                  {forgotError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">{forgotError}</div>
                  )}
                  {forgotSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">{forgotSuccess}</div>
                  )}
                  <input
                    type="text"
                    required
                    value={forgotId}
                    onChange={(e) => {
                      setForgotId(e.target.value);
                      setForgotQuestion('');
                    }}
                    placeholder="BUP ID or email"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs"
                  />
                  {forgotQuestion && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">Security question</label>
                        <p className="text-xs text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5">{forgotQuestion}</p>
                      </div>
                      <input
                        type="text"
                        required
                        value={forgotAnswer}
                        onChange={(e) => setForgotAnswer(e.target.value)}
                        placeholder="Your answer"
                        className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs"
                      />
                      <input
                        type="password"
                        required
                        value={forgotPassword}
                        onChange={(e) => setForgotPassword(e.target.value)}
                        placeholder="New password"
                        className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs"
                      />
                      <input
                        type="password"
                        required
                        value={forgotConfirm}
                        onChange={(e) => setForgotConfirm(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs"
                      />
                    </>
                  )}
                  <button type="submit" className="w-full py-3.5 px-4 rounded-xl bg-[#0f172a] hover:bg-black text-white font-semibold text-sm cursor-pointer">
                    {forgotBusy ? 'Checking...' : forgotQuestion ? 'Set new password' : 'Show my question'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotOpen(false);
                      setForgotError('');
                      setForgotSuccess('');
                    }}
                    className="w-full text-xs text-zinc-600 hover:text-black font-medium cursor-pointer"
                  >
                    Back to sign in
                  </button>
                </form>
              ) : authMode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  
                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600 leading-relaxed">
                    Everyone registers as a general user. Officers and administrators sign in with the account already issued to them.
                  </div>

                  {sessionNotice && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-800 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block"></span>
                      <span>{sessionNotice}</span>
                    </div>
                  )}

                  {/* Email / Student ID Input Field */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      Email or University ID
                    </label>
                    <input
                      type="text"
                      required
                      value={loginEmailOrId}
                      onChange={(e) => {
                        setLoginEmailOrId(e.target.value);
                        if (loginError) setLoginError('');
                      }}
                      placeholder="e.g. 24549010088 or nusrat@bup.edu.bd"
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black transition-colors shadow-2xs"
                    />
                  </div>

                  {/* Password Input Field with Eye Toggle */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          if (loginError) setLoginError('');
                        }}
                        placeholder="••••••••••••"
                        className="w-full bg-white border border-zinc-200 rounded-xl pl-4 pr-11 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black transition-colors shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer p-1"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Red Error Message (Matching screenshot: "● Please enter the correct password") */}
                  {loginError && (
                    <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium pt-0.5 animate-fadeIn">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block"></span>
                      <span>{loginError}</span>
                    </div>
                  )}

                  {/* Remember Me Checkbox & Forgot Password Link */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 text-zinc-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-black border-zinc-300 focus:ring-0 cursor-pointer accent-black"
                      />
                      <span className="font-medium">Remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setForgotId(loginEmailOrId);
                        setForgotQuestion('');
                        setForgotAnswer('');
                        setForgotPassword('');
                        setForgotConfirm('');
                        setForgotError('');
                        setForgotSuccess('');
                        setForgotOpen(true);
                      }}
                      className="text-zinc-600 hover:text-black font-medium transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Sleek Primary Button (Matching screenshot: dark "Continue" button) */}
                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-xl bg-[#0f172a] hover:bg-black text-white font-semibold text-sm tracking-wide transition-all duration-200 shadow-sm cursor-pointer mt-2"
                  >
                    {loginBusy ? 'Checking credentials...' : 'Continue'}
                  </button>

                  {/* Quick Fill Test Accounts Chips */}
                  <div className="pt-2">
                    <div className="text-[11px] font-medium text-zinc-400 text-center mb-2">
                      Quick test credentials (click to fill):
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {demoAccounts.map((account) => (
                        <button
                          key={account.id}
                          type="button"
                          onClick={() => handleQuickFill(account)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200/90 text-zinc-700 text-[11px] font-medium transition-colors border border-zinc-200 cursor-pointer"
                        >
                          {account.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Have Trouble Signing In Link */}
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveSlide(1)}
                      className="text-xs text-zinc-600 hover:text-black font-medium transition-colors cursor-pointer"
                    >
                      Have trouble signing in?
                    </button>
                  </div>
                </form>
              ) : (
                /* ====================================================== */
                /* OPTION 2: REGISTER VIEW                                */
                /* ====================================================== */
                <form onSubmit={handleRegister} className="space-y-3.5">
                  {regError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{regError}</span>
                    </div>
                  )}

                  {regSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{regSuccess}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Nusrat Jahan"
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Student/Employee ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={regId}
                      onChange={(e) => setRegId(e.target.value)}
                      placeholder="e.g. 24549010088"
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Institutional Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="name@bup.edu.bd"
                        className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+880 1712-000000"
                        className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Department / Wing
                    </label>
                    <select
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-black transition-colors"
                    >
                      {ACADEMIC_DEPARTMENTS.map((department) => (
                        <option key={department} value={department}>{department}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Security question *
                    </label>
                    <select
                      value={regQuestion}
                      onChange={(e) => setRegQuestion(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-black transition-colors"
                    >
                      {SECURITY_QUESTIONS.map((question) => (
                        <option key={question} value={question}>{question}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Answer *
                    </label>
                    <input
                      type="text"
                      required
                      value={regAnswer}
                      onChange={(e) => setRegAnswer(e.target.value)}
                      placeholder="Used only if you forget your password"
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Confirm
                      </label>
                      <input
                        type="password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-xl bg-[#0f172a] hover:bg-black text-white font-semibold text-xs tracking-wide transition-all shadow-sm cursor-pointer mt-2"
                  >
                    Create Account &amp; Enter Portal
                  </button>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    This account can file and track complaints. Officer and administrator accounts are issued separately.
                  </p>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="text-xs text-zinc-600 hover:text-black font-medium transition-colors cursor-pointer"
                    >
                      Already have an account? Sign In
                    </button>
                  </div>
                </form>
              )}

              {/* Bottom Terms & Privacy Text (Matching screenshot) */}
              <div className="mt-8 text-center text-[11px] text-zinc-400 leading-relaxed">
                By continuing, you agree to our{' '}
                <a href="https://bup.edu.bd/" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="https://bup.edu.bd/" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:underline">
                  Privacy Policy
                </a>
                .
              </div>

            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* RIGHT PORTION: EMERGENCY NUMBERS & CAMPUS SERVICERS        */}
          {/* Symmetrically styled after the screenshot's right card     */}
          {/* ---------------------------------------------------------- */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="w-full h-full min-h-[580px] bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 lg:p-10 shadow-sm flex flex-col justify-between relative overflow-hidden">
              
              {/* Subtle background radial glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-zinc-100 rounded-full blur-3xl pointer-events-none -z-0 opacity-60"></div>

              {/* Top Heading (Mirroring "Select & Combine & Integrate.") */}
              <div className="text-center relative z-10">
                <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
                  {activeSlide === 0
                    ? 'Select & Contact & Resolve.'
                    : activeSlide === 1
                    ? 'BUP Emergency Contact List'
                    : 'Our Certified Campus Servicers'}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-md mx-auto leading-relaxed">
                  {activeSlide === 0
                    ? 'Direct 24/7 helplines and certified on-duty servicers across BUP.'
                    : activeSlide === 1
                    ? 'Bangladesh University of Professionals official lift, engineering & emergency directory.'
                    : 'Dedicated technicians maintaining campus electrical, HVAC, Wi-Fi, and utilities.'}
                </p>
              </div>

              {/* ====================================================== */}
              {/* SLIDE 0: INTERACTIVE NETWORK NODES DIAGRAM (From Image)*/}
              {/* ====================================================== */}
              {activeSlide === 0 && (
                <div className="my-auto py-6 relative z-10 flex flex-col items-center">
                  
                  {/* Symmetrical 3x3 Hub-and-Spoke Grid matching screenshot */}
                  <div className="relative w-full max-w-[380px] h-[340px] flex items-center justify-center">
                    
                    {/* SVG Dotted Connecting Lines from Center to Outer Nodes */}
                    <svg viewBox="0 0 380 340" className="absolute inset-0 w-full h-full pointer-events-none text-zinc-300">
                      {/* Center to Top-Left */}
                      <line x1="190" y1="170" x2="60" y2="40" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                      {/* Center to Top-Center */}
                      <line x1="190" y1="170" x2="190" y2="30" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                      {/* Center to Top-Right */}
                      <line x1="190" y1="170" x2="320" y2="40" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                      {/* Center to Right-Center */}
                      <line x1="190" y1="170" x2="330" y2="170" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                      {/* Center to Bottom-Right */}
                      <line x1="190" y1="170" x2="320" y2="300" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                      {/* Center to Bottom-Center */}
                      <line x1="190" y1="170" x2="190" y2="310" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                      {/* Center to Bottom-Left */}
                      <line x1="190" y1="170" x2="60" y2="300" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                      {/* Center to Left-Center */}
                      <line x1="190" y1="170" x2="50" y2="170" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                    </svg>

                    {/* CENTER HUB: BUP Maintenance Central Node (Black Squircle in screenshot) */}
                    <div className="relative z-20 w-16 h-16 rounded-2xl bg-black text-white flex flex-col items-center justify-center shadow-lg border-2 border-zinc-800 transition-transform hover:scale-105 cursor-pointer">
                      <div className="font-black text-xs tracking-wider">BUP</div>
                      <div className="text-[8px] text-zinc-400 font-mono mt-0.5">HUB</div>
                    </div>

                    {/* NODE 1: Top-Left -> Security */}
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('sec')}
                      className={`absolute top-2 left-6 z-20 w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                        selectedNodeId === 'sec'
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-110'
                          : 'bg-white text-zinc-700 border border-zinc-200 hover:border-blue-400'
                      }`}
                      title="Campus Security"
                    >
                      <Shield className="w-5 h-5" />
                    </button>

                    {/* NODE 2: Top-Center -> Electrical */}
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('elec')}
                      className={`absolute top-0 left-1/2 -translate-x-1/2 z-20 w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                        selectedNodeId === 'elec'
                          ? 'bg-amber-500 text-white ring-4 ring-amber-100 scale-110'
                          : 'bg-white text-zinc-700 border border-zinc-200 hover:border-amber-400'
                      }`}
                      title="Electrical & Power"
                    >
                      <Zap className="w-5 h-5" />
                    </button>

                    {/* NODE 3: Top-Right -> Medical */}
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('med')}
                      className={`absolute top-2 right-6 z-20 w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                        selectedNodeId === 'med'
                          ? 'bg-rose-600 text-white ring-4 ring-rose-100 scale-110'
                          : 'bg-white text-zinc-700 border border-zinc-200 hover:border-rose-400'
                      }`}
                      title="Medical Center"
                    >
                      <Ambulance className="w-5 h-5" />
                    </button>

                    {/* NODE 4: Right-Center -> ICT Helpdesk */}
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('ict')}
                      className={`absolute top-1/2 -translate-y-1/2 right-2 z-20 w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                        selectedNodeId === 'ict'
                          ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 scale-110'
                          : 'bg-white text-zinc-700 border border-zinc-200 hover:border-indigo-400'
                      }`}
                      title="ICT & Wi-Fi"
                    >
                      <Wifi className="w-5 h-5" />
                    </button>

                    {/* NODE 5: Bottom-Right -> Fire Safety */}
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('fire')}
                      className={`absolute bottom-2 right-6 z-20 w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                        selectedNodeId === 'fire'
                          ? 'bg-orange-600 text-white ring-4 ring-orange-100 scale-110'
                          : 'bg-white text-zinc-700 border border-zinc-200 hover:border-orange-400'
                      }`}
                      title="Fire Safety"
                    >
                      <Flame className="w-5 h-5" />
                    </button>

                    {/* NODE 6: Bottom-Center -> HVAC */}
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('hvac')}
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 z-20 w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                        selectedNodeId === 'hvac'
                          ? 'bg-sky-600 text-white ring-4 ring-sky-100 scale-110'
                          : 'bg-white text-zinc-700 border border-zinc-200 hover:border-sky-400'
                      }`}
                      title="HVAC & AC"
                    >
                      <Fan className="w-5 h-5" />
                    </button>

                    {/* NODE 7: Bottom-Left -> Plumbing */}
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('water')}
                      className={`absolute bottom-2 left-6 z-20 w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                        selectedNodeId === 'water'
                          ? 'bg-cyan-600 text-white ring-4 ring-cyan-100 scale-110'
                          : 'bg-white text-zinc-700 border border-zinc-200 hover:border-cyan-400'
                      }`}
                      title="Plumbing"
                    >
                      <Droplets className="w-5 h-5" />
                    </button>

                    {/* NODE 8: Left-Center -> Civil Works */}
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('civil')}
                      className={`absolute top-1/2 -translate-y-1/2 left-2 z-20 w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                        selectedNodeId === 'civil'
                          ? 'bg-slate-700 text-white ring-4 ring-slate-100 scale-110'
                          : 'bg-white text-zinc-700 border border-zinc-200 hover:border-slate-400'
                      }`}
                      title="Civil Works"
                    >
                      <Hammer className="w-5 h-5" />
                    </button>

                  </div>

                  {/* Node Detail Card: Shows instant phone and contact for selected node */}
                  {selectedNode && (
                    <div className="mt-4 w-full max-w-[390px] p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs animate-fadeIn">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${selectedNode.bgLight}`}>
                          <selectedNode.icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-xs text-zinc-900 truncate">
                              {selectedNode.name}
                            </h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-700">
                              {selectedNode.ext}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-zinc-600 font-semibold mt-0.5">
                            {selectedNode.mobile}
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate">
                            {selectedNode.dutyPerson} • {selectedNode.availability}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedNode.mobile, selectedNode.id)}
                          className="p-2 rounded-lg bg-white hover:bg-zinc-100 text-zinc-600 border border-zinc-200 transition-colors cursor-pointer"
                          title="Copy number"
                        >
                          {copiedId === selectedNode.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={`tel:${selectedNode.mobile}`}
                          className="px-2.5 py-1.5 rounded-lg bg-black hover:bg-zinc-800 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                          title="Dial directly"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ====================================================== */}
              {/* SLIDE 1: BUP OFFICIAL EMERGENCY DIRECTORY              */}
              {/* ====================================================== */}
              {activeSlide === 1 && (
                <div className="my-auto py-2 relative z-10 space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {/* Telephone Instruction Notice Banner */}
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs flex items-start gap-2.5 shadow-2xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-[11px] uppercase tracking-wider block text-amber-800">
                        IMPORTANT TELEPHONE INSTRUCTION
                      </span>
                      <p className="text-[11px] text-amber-900/90 font-medium leading-relaxed">
                        For lift emergency contacts, enter <span className="font-bold font-mono px-1 py-0.2 bg-amber-200/80 rounded text-amber-950">9</span> before the mobile number when calling through the campus telephone system.
                      </p>
                    </div>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                    {['All', 'West Campus Lifts', 'East Campus Lifts', 'Engineering Services', 'Important Contacts'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedEmergencyCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                          selectedEmergencyCategory === cat
                            ? 'bg-black text-white shadow-2xs'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border border-zinc-200/80'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Emergency Contact List */}
                  <div className="space-y-2">
                    {(emergencyContacts || [])
                      .filter(
                        (contact) =>
                          selectedEmergencyCategory === 'All' ||
                          contact.category === selectedEmergencyCategory
                      )
                      .map((contact) => (
                        <div
                          key={contact.id}
                          className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-between gap-3 hover:border-zinc-300 transition-all shadow-2xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                              contact.category.includes('West')
                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                : contact.category.includes('East')
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : contact.category.includes('Engineering')
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {contact.category.includes('Lift') ? (
                                <Zap className="w-4 h-4" />
                              ) : contact.category.includes('Engineering') ? (
                                <Hammer className="w-4 h-4" />
                              ) : contact.name.includes('Medical') ? (
                                <Ambulance className="w-4 h-4" />
                              ) : contact.name.includes('Security') ? (
                                <Shield className="w-4 h-4" />
                              ) : (
                                <PhoneCall className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-bold text-xs text-zinc-900 truncate">
                                  {contact.name}
                                </h4>
                                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-700 truncate max-w-[140px]">
                                  {contact.category}
                                </span>
                              </div>
                              <div className="text-[11px] font-mono font-extrabold text-zinc-900 flex items-center gap-1.5 mt-0.5">
                                <span>{contact.contactNumber}</span>
                                {contact.designation && (
                                  <span className="font-sans font-normal text-zinc-400 text-[10px] truncate max-w-[160px]">
                                    • {contact.designation}
                                  </span>
                                )}
                              </div>
                              {contact.instruction && (
                                <div className="text-[10px] text-zinc-500 font-medium truncate">
                                  {contact.instruction}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(contact.contactNumber, contact.id)}
                              className="p-2 rounded-lg bg-white hover:bg-zinc-100 text-zinc-600 border border-zinc-200 transition-colors cursor-pointer"
                              title="Copy contact number"
                            >
                              {copiedId === contact.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {contact.contactNumber.startsWith('http') || contact.contactNumber.startsWith('www') ? (
                              <a
                                href="https://bup.edu.bd/"
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1.5 rounded-lg bg-black hover:bg-zinc-800 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Open</span>
                              </a>
                            ) : contact.email ? (
                              <a
                                href={`mailto:${contact.email}`}
                                className="px-2.5 py-1.5 rounded-lg bg-black hover:bg-zinc-800 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                                title="Send Email"
                              >
                                <Mail className="w-3 h-3" />
                                <span>Mail</span>
                              </a>
                            ) : (
                              <a
                                href={`tel:${contact.contactNumber}`}
                                className="px-2.5 py-1.5 rounded-lg bg-black hover:bg-zinc-800 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                                title="Dial number"
                              >
                                <Phone className="w-3 h-3" />
                                <span>Call</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* ====================================================== */}
              {/* SLIDE 2: OUR CERTIFIED CAMPUS SERVICERS                */}
              {/* ====================================================== */}
              {activeSlide === 2 && (
                <div className="my-auto py-2 relative z-10 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {campusServicers.map((serv) => (
                    <div
                      key={serv.id}
                      className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-between gap-3 hover:border-zinc-300 transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={serv.avatar}
                          alt={serv.name}
                          className="w-10 h-10 rounded-xl object-cover border border-zinc-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-zinc-900 truncate">
                              {serv.name}
                            </h4>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {serv.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 font-medium truncate">
                            {serv.role} • {serv.department}
                          </p>
                          <div className="text-[10px] text-zinc-700 font-mono font-semibold flex items-center gap-2 mt-0.5">
                            <span>{serv.phone}</span>
                            <span className="text-zinc-300">•</span>
                            <span className="text-amber-600 font-sans font-bold">★ {serv.rating}</span>
                            <span className="text-zinc-400 font-sans">({serv.resolvedCount} resolved)</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(serv.phone, serv.id)}
                          className="p-2 rounded-lg bg-white hover:bg-zinc-100 text-zinc-600 border border-zinc-200 transition-colors cursor-pointer"
                          title="Copy phone"
                        >
                          {copiedId === serv.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={`tel:${serv.phone}`}
                          className="px-2.5 py-1.5 rounded-lg bg-black hover:bg-zinc-800 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Pagination Dots (Matching screenshot's 3 dots: ● ○ ○) */}
              <div className="flex items-center justify-center gap-2 pt-4 relative z-10">
                <button
                  type="button"
                  onClick={() => setActiveSlide(0)}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                    activeSlide === 0
                      ? 'bg-black w-6'
                      : 'bg-zinc-300 hover:bg-zinc-400'
                  }`}
                  title="Campus Network Hub"
                />
                <button
                  type="button"
                  onClick={() => setActiveSlide(1)}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                    activeSlide === 1
                      ? 'bg-black w-6'
                      : 'bg-zinc-300 hover:bg-zinc-400'
                  }`}
                  title="Emergency Numbers"
                />
                <button
                  type="button"
                  onClick={() => setActiveSlide(2)}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                    activeSlide === 2
                      ? 'bg-black w-6'
                      : 'bg-zinc-300 hover:bg-zinc-400'
                  }`}
                  title="Our Campus Servicers"
                />
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* ============================================================ */}
      {/* 3. MINIMAL FOOTER                                            */}
      {/* ============================================================ */}
      <footer className="h-10 bg-white border-t border-zinc-200/80 px-4 sm:px-8 flex items-center justify-between text-[11px] text-zinc-400">
        <div>
          © 2026{' '}
          <a href="https://bup.edu.bd/" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-black">
            Bangladesh University of Professionals
          </a>
          . Department of ICT, FST.
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveSlide(1)}
            className="text-zinc-600 hover:text-black transition-colors cursor-pointer"
          >
            Emergency Directory
          </button>
          <button
            onClick={() => setActiveSlide(2)}
            className="text-zinc-600 hover:text-black transition-colors cursor-pointer"
          >
            On-Duty Servicers
          </button>
        </div>
      </footer>

    </div>
  );
};
