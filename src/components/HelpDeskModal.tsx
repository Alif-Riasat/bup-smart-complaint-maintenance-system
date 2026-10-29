import React, { useState } from 'react';
import {
  X,
  Phone,
  Mail,
  Building2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Hammer,
  Ambulance,
  Shield,
  PhoneCall,
  Search,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HelpDeskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpDeskModal: React.FC<HelpDeskModalProps> = ({ isOpen, onClose }) => {
  const { departments, emergencyContacts } = useApp();
  const [activeTab, setActiveTab] = useState<'emergency' | 'departments'>('emergency');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEmergencyContacts = (emergencyContacts || []).filter((contact) => {
    const matchesCategory = selectedCategory === 'All' || contact.category === selectedCategory;
    const matchesQuery =
      searchQuery === '' ||
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.contactNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.designation && contact.designation.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  const filteredDepartments = departments.filter((dept) => {
    return (
      searchQuery === '' ||
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.contactInfo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs font-sans text-zinc-900 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-zinc-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
          <div>
            <div className="text-[11px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              BUP 24/7 HELPDESK &amp; EMERGENCY DIRECTORY
            </div>
            <h3 className="font-extrabold text-lg text-zinc-900">
              Campus Maintenance &amp; Emergency Hub
            </h3>
            <p className="text-xs text-zinc-500">
              Official contact channels for lift breakdown, emergency services &amp; departments
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs & Search */}
        <div className="px-5 sm:px-6 pt-4 pb-2 border-b border-zinc-100 space-y-3 bg-white">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('emergency')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'emergency'
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                🚨 Emergency &amp; Lifts ({emergencyContacts?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('departments')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'departments'
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                🏢 Academic Departments ({departments.length})
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search contact, lift, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-black bg-zinc-50 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Sub-category pills for Emergency Tab */}
          {activeTab === 'emergency' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              {['All', 'West Campus Lifts', 'East Campus Lifts', 'Engineering Services', 'Important Contacts'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-black text-white shadow-2xs'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border border-zinc-200/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable Directory Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 max-h-[55vh]">
          {activeTab === 'emergency' && (
            <>
              {/* Telephone Instruction Notice Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-2xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-extrabold text-[11px] uppercase tracking-wider block text-amber-800">
                    BANGLADESH UNIVERSITY OF PROFESSIONALS (BUP) — TELEPHONE INSTRUCTION
                  </span>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    For lift emergency contacts, enter <strong className="font-mono bg-amber-200 px-1 py-0.2 rounded text-amber-950">9</strong> before the mobile number when calling through the internal telephone system.
                  </p>
                </div>
              </div>

              {/* Contact Cards Grid */}
              <div className="space-y-2.5">
                {filteredEmergencyContacts.length === 0 ? (
                  <div className="p-8 text-center text-zinc-400 text-xs">
                    No emergency contacts matching your query.
                  </div>
                ) : (
                  filteredEmergencyContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-3.5 bg-zinc-50/80 border border-zinc-200/90 rounded-2xl flex items-center justify-between gap-3 hover:border-zinc-300 transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                            contact.category.includes('West')
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : contact.category.includes('East')
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : contact.category.includes('Engineering')
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {contact.category.includes('Lift') ? (
                            <Zap className="w-4.5 h-4.5" />
                          ) : contact.category.includes('Engineering') ? (
                            <Hammer className="w-4.5 h-4.5" />
                          ) : contact.name.includes('Medical') ? (
                            <Ambulance className="w-4.5 h-4.5" />
                          ) : contact.name.includes('Security') ? (
                            <Shield className="w-4.5 h-4.5" />
                          ) : (
                            <PhoneCall className="w-4.5 h-4.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-zinc-900 truncate">
                              {contact.name}
                            </h4>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-zinc-200/80 text-zinc-700 truncate">
                              {contact.category}
                            </span>
                          </div>
                          <div className="text-[12px] font-mono font-extrabold text-zinc-900 flex items-center gap-1.5 mt-0.5">
                            <span>{contact.contactNumber}</span>
                            {contact.designation && (
                              <span className="font-sans font-normal text-zinc-400 text-[11px] truncate">
                                • {contact.designation}
                              </span>
                            )}
                          </div>
                          {contact.instruction && (
                            <div className="text-[10px] text-zinc-500 font-medium truncate mt-0.5">
                              {contact.instruction}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopy(contact.contactNumber, contact.id)}
                          className="p-2 rounded-lg bg-white hover:bg-zinc-100 text-zinc-600 border border-zinc-200 transition-colors cursor-pointer"
                          title="Copy number"
                        >
                          {copiedId === contact.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {contact.contactNumber.startsWith('http') || contact.contactNumber.startsWith('www') ? (
                          <a
                            href={contact.contactNumber.startsWith('http') ? contact.contactNumber : `https://${contact.contactNumber}`}
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
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === 'departments' && (
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <span>
                  University administrative wings and faculty liaison offices coordinate with Department of Estate &amp; Maintenance.
                </span>
              </div>

              {filteredDepartments.map((dept) => (
                <div
                  key={dept.id}
                  className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-xs space-y-1.5 shadow-2xs"
                >
                  <div className="font-bold text-zinc-900 text-xs">{dept.name}</div>
                  <div className="flex flex-wrap items-center justify-between text-zinc-500 pt-1 gap-2">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-mono text-zinc-800 font-semibold">{dept.contactInfo}</span>
                    </span>
                    <a
                      href={`mailto:${dept.email}`}
                      className="flex items-center gap-1.5 text-zinc-700 hover:text-black hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{dept.email}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="text-[11px] text-zinc-400">
            Estate Office: Ground Floor, Academic Building • PABX Line 3137
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Close directory
          </button>
        </div>
      </div>
    </div>
  );
};
