import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  FileText,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Layers,
  Database,
  Star,
  Check,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FunctionalRequirement } from '../../types/complaint';

interface FunctionalRequirementsViewProps {
  onNavigateToFeature?: (navKey: string) => void;
  onOpenHelpDesk?: () => void;
}

export const FunctionalRequirementsView: React.FC<FunctionalRequirementsViewProps> = ({
  onNavigateToFeature,
  onOpenHelpDesk,
}) => {
  const { functionalRequirements } = useApp();

  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFrId, setSelectedFrId] = useState<string | null>(null);

  // Filter requirements
  const filteredRequirements = useMemo(() => {
    return (functionalRequirements || []).filter((fr) => {
      const matchPriority = selectedPriority === 'All' || fr.priority === selectedPriority;
      const matchSearch =
        searchQuery === '' ||
        fr.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fr.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fr.implementedIn.toLowerCase().includes(searchQuery.toLowerCase());
      return matchPriority && matchSearch;
    });
  }, [functionalRequirements, selectedPriority, searchQuery]);

  const mandatoryCount = functionalRequirements.filter((f) => f.priority === 'Mandatory').length;
  const desirableCount = functionalRequirements.filter((f) => f.priority === 'Desirable').length;
  const optionalCount = functionalRequirements.filter((f) => f.priority === 'Optional').length;

  const handleActionClick = (fr: FunctionalRequirement) => {
    if (fr.actionKey === 'help-desk' && onOpenHelpDesk) {
      onOpenHelpDesk();
      return;
    }
    if (fr.actionKey && onNavigateToFeature) {
      onNavigateToFeature(fr.actionKey);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-16">
      {/* 1. Page Header */}
      <div>
        <div className="text-xs text-zinc-400 mb-1 flex items-center gap-1.5">
          <span>System Documentation</span>
          <span>/</span>
          <span className="text-zinc-600 font-medium">Functional Requirements Verification Matrix</span>
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
          Requirements (FR-1 to FR-19, NFR-1 to NFR-12)
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Full traceability matrix verifying all mandatory, desirable, and optional specifications against system features.
        </p>
      </div>

      {/* 2. Top KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Total Requirements
          </div>
          <div className="text-2xl font-black text-zinc-900 mt-1">
            {functionalRequirements.length}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            100% Implemented
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-red-50/60 border border-red-200 shadow-xs">
          <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider">
            Mandatory
          </div>
          <div className="text-2xl font-black text-red-950 mt-1">
            {mandatoryCount}
          </div>
          <div className="text-[11px] text-red-700 font-semibold mt-1">
            Core system controls
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 shadow-xs">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            Desirable
          </div>
          <div className="text-2xl font-black text-blue-950 mt-1">
            {desirableCount}
          </div>
          <div className="text-[11px] text-blue-700 font-semibold mt-1">
            Campus services
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-100/70 border border-zinc-200 shadow-xs">
          <div className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
            Optional
          </div>
          <div className="text-2xl font-black text-zinc-900 mt-1">
            {optionalCount}
          </div>
          <div className="text-[11px] text-zinc-600 font-semibold mt-1">
            Reporting and audit
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['All', 'Mandatory', 'Desirable', 'Optional'].map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPriority(p)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedPriority === p
                  ? 'bg-black text-white shadow-2xs'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by FR code, title, module..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white text-xs focus:outline-none focus:border-black transition-colors"
          />
        </div>
      </div>

      {/* 4. Requirements Traceability Table */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-zinc-900">
              Requirements Implementation Matrix
            </h3>
            <p className="text-xs text-zinc-400">
              Correlated with Figure 08 Relational Database Architecture
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-zinc-500">
            {filteredRequirements.length} of {functionalRequirements.length} Requirements
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
              <tr>
                <th className="px-6 py-3.5">ID</th>
                <th className="px-6 py-3.5">REQUIREMENT TITLE</th>
                <th className="px-6 py-3.5">PRIORITY</th>
                <th className="px-6 py-3.5">DESCRIPTION</th>
                <th className="px-6 py-3.5">IMPLEMENTED IN</th>
                <th className="px-6 py-3.5">STATUS</th>
                <th className="px-6 py-3.5">LIVE TEST</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredRequirements.map((fr) => (
                <tr
                  key={fr.id}
                  className="hover:bg-zinc-50/80 transition-colors"
                >
                  <td className="px-6 py-4 font-mono font-bold text-zinc-900">
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200 text-xs">
                      {fr.id}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-zinc-900">
                    {fr.title}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        fr.priority === 'Mandatory'
                          ? 'bg-red-100 text-red-900 border border-red-300'
                          : fr.priority === 'Desirable'
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : 'bg-zinc-100 text-zinc-800 border border-zinc-300'
                      }`}
                    >
                      {fr.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-600 leading-relaxed max-w-sm">
                    {fr.description}
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-zinc-700">
                    <span className="px-2 py-0.5 rounded bg-zinc-50 border border-zinc-200">
                      {fr.implementedIn}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {fr.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleActionClick(fr)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                    >
                      <span>Open View</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Database ER Diagram Mapping Card */}
      <div className="p-6 rounded-3xl bg-zinc-900 text-white shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Database className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="font-extrabold text-base">Figure 08 ER Architecture Conformance</h3>
            <p className="text-xs text-zinc-400">
              Direct mapping between functional requirements and relational schema entities
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-mono font-bold text-orange-300">USER &amp; ROLE</div>
            <div className="text-zinc-400 text-[11px]">Powers FR-01, FR-02, FR-03, FR-14 with RBAC and spam flagging.</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-mono font-bold text-orange-300">COMPLAINT &amp; LOCATION</div>
            <div className="text-zinc-400 text-[11px]">Powers FR-04, FR-05, FR-09, FR-11 with campus map hotspotting.</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-mono font-bold text-orange-300">ASSIGNMENT &amp; STAFF</div>
            <div className="text-zinc-400 text-[11px]">Powers FR-06, FR-07, FR-08 for maintenance dispatch &amp; tracking.</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-mono font-bold text-orange-300">STATUS_HISTORY &amp; NOTIF</div>
            <div className="text-zinc-400 text-[11px]">Powers FR-08, FR-12, FR-13 for complete audit logging.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
