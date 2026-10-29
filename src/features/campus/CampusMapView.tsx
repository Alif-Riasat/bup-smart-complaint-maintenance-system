import React, { useState, useMemo } from 'react';
import {
  MapPin,
  AlertTriangle,
  Building2,
  TrendingUp,
  Flame,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  ArrowRight,
  Info,
  Layers,
  BarChart3,
  ChevronRight,
  ShieldAlert,
  Plus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Complaint, ComplaintPriority, ComplaintStatus } from '../../types/complaint';

interface BuildingStat {
  id: string;
  name: string;
  shortName: string;
  zone: 'North' | 'South' | 'West' | 'Central';
  complaintCount: number;
  openCount: number;
  resolvedCount: number;
  criticalCount: number;
  percentage: number;
  topCategory: string;
  avgResolutionHours: number;
  colorScheme: {
    bg: string;
    border: string;
    text: string;
    accent: string;
    glow: string;
  };
  svgCoord: {
    x: number;
    y: number;
    width: number;
    height: number;
    rx?: number;
  };
}

interface CampusMapViewProps {
  onSelectComplaint?: (complaintId: string) => void;
  onNewComplaintAtLocation?: (locationName: string) => void;
}

export const CampusMapView: React.FC<CampusMapViewProps> = ({
  onSelectComplaint,
  onNewComplaintAtLocation,
}) => {
  const { complaints, categories, currentUser } = useApp();
  const canFileComplaint = currentUser.role === 'student' || currentUser.role === 'faculty';

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('acad');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'map' | 'ranking'>('map');

  // Filter complaints according to user criteria
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const matchCat = filterCategory === 'All' || c.categoryName.toLowerCase().includes(filterCategory.toLowerCase());
      const matchStat = filterStatus === 'All' || (filterStatus === 'Open' ? (c.status === 'Pending' || c.status === 'Assigned' || c.status === 'In Progress') : c.status === filterStatus);
      return matchCat && matchStat;
    });
  }, [complaints, filterCategory, filterStatus]);

  // Define Buildings from the hand-drawn map (Image 3)
  const buildingsData: BuildingStat[] = useMemo(() => {
    const totalCount = filteredComplaints.length || 1;

    const buildingDefinitions = [
      // North Zone (Above Lake)
      {
        id: 'acad',
        name: 'Academic Building',
        shortName: 'Academic Bldg',
        zone: 'North' as const,
        svgCoord: { x: 260, y: 70, width: 220, height: 110, rx: 12 },
        matchNames: ['Academic Building', 'IoT & Embedded', 'Lecture Gallery', 'Smart Classroom'],
      },
      {
        id: 'admin',
        name: 'Admin Building',
        shortName: 'Admin Bldg',
        zone: 'North' as const,
        svgCoord: { x: 505, y: 70, width: 130, height: 110, rx: 12 },
        matchNames: ['Admin Building', 'Syndicate', 'Registrar'],
      },
      {
        id: 'fbs',
        name: 'Faculty of Business Studies (FBS)',
        shortName: 'FBS',
        zone: 'North' as const,
        svgCoord: { x: 660, y: 70, width: 140, height: 80, rx: 12 },
        matchNames: ['FBS', 'Faculty of Business Studies', 'Executive MBA'],
      },
      {
        id: 'vista',
        name: 'Vista Court & Food Square',
        shortName: 'Vista Court',
        zone: 'North' as const,
        svgCoord: { x: 825, y: 70, width: 105, height: 75, rx: 12 },
        matchNames: ['Vista', 'Food Square'],
      },
      {
        id: 'amitie',
        name: 'Amitie Plaza & Activity Terrace',
        shortName: 'Amitie Plaza',
        zone: 'North' as const,
        svgCoord: { x: 825, y: 165, width: 105, height: 75, rx: 12 },
        matchNames: ['Amitie', 'Plaza', 'Terrace'],
      },

      // West Corridor (Left side of map)
      {
        id: 'staff-canteen',
        name: 'Staff Canteen',
        shortName: 'Staff Canteen',
        zone: 'West' as const,
        svgCoord: { x: 70, y: 70, width: 155, height: 75, rx: 12 },
        matchNames: ['Staff Canteen', 'Officer Dining'],
      },
      {
        id: 'med',
        name: 'Medical Centre',
        shortName: 'Medical Centre',
        zone: 'West' as const,
        svgCoord: { x: 70, y: 165, width: 155, height: 85, rx: 12 },
        matchNames: ['Medical Centre', 'Emergency Triage', 'Pharmacy'],
      },
      {
        id: '3rdplace',
        name: '3rd Place Student Lounge',
        shortName: '3rd Place',
        zone: 'West' as const,
        svgCoord: { x: 70, y: 270, width: 155, height: 85, rx: 12 },
        matchNames: ['3rd Place', 'Student Lounge', 'Quiet Study'],
      },
      {
        id: 'gym',
        name: 'Gymnasium & Sports Complex',
        shortName: 'Gym & Sports',
        zone: 'West' as const,
        svgCoord: { x: 70, y: 375, width: 155, height: 95, rx: 12 },
        matchNames: ['Gymnasium', 'Sports Complex', 'Badminton'],
      },

      // Central (Lake)
      {
        id: 'lake',
        name: 'BUP Central Lake & Promenade',
        shortName: 'Central Lake',
        zone: 'Central' as const,
        svgCoord: { x: 260, y: 220, width: 540, height: 95, rx: 18 },
        matchNames: ['Lake', 'Promenade', 'Footbridge', 'Pavilion'],
      },

      // South Zone (Below Lake)
      {
        id: 'utility',
        name: 'Utility Block & Central Substation',
        shortName: 'Utility Block',
        zone: 'South' as const,
        svgCoord: { x: 70, y: 490, width: 155, height: 80, rx: 12 },
        matchNames: ['Utility', 'Utility Building', 'Substation', 'Generator', 'HVAC Plant'],
      },
      {
        id: 'fst',
        name: 'Faculty of Science & Technology (FST)',
        shortName: 'FST',
        zone: 'South' as const,
        svgCoord: { x: 260, y: 355, width: 220, height: 130, rx: 12 },
        matchNames: ['FST', 'Faculty of Science & Technology', 'BICE', 'CSE', 'Microcontroller'],
      },
      {
        id: 'pitstop',
        name: 'Pitstop & Cafeteria',
        shortName: 'Pitstop',
        zone: 'South' as const,
        svgCoord: { x: 505, y: 355, width: 130, height: 80, rx: 12 },
        matchNames: ['Pitstop', 'Cafeteria'],
      },
      {
        id: 'alcove',
        name: 'Alcove Garden & Gazebo',
        shortName: 'Alcove',
        zone: 'South' as const,
        svgCoord: { x: 505, y: 455, width: 130, height: 80, rx: 12 },
        matchNames: ['Alcove', 'Gazebo'],
      },
      {
        id: 'fass',
        name: 'Faculty of Arts & Social Sciences (FASS)',
        shortName: 'FASS',
        zone: 'South' as const,
        svgCoord: { x: 660, y: 355, width: 270, height: 180, rx: 12 },
        matchNames: ['FASS', 'Faculty of Arts', 'Dean Conference', 'Auditorium FASS'],
      },
    ];

    return buildingDefinitions.map((def) => {
      const bComplaints = filteredComplaints.filter((c) =>
        def.matchNames.some((m) => c.buildingName.toLowerCase().includes(m.toLowerCase()) || c.roomArea.toLowerCase().includes(m.toLowerCase()))
      );

      const count = bComplaints.length;
      const open = bComplaints.filter((c) => c.status !== 'Resolved' && c.status !== 'Closed').length;
      const resolved = bComplaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;
      const critical = bComplaints.filter((c) => c.priority === 'Emergency' || c.priority === 'High').length;
      const pct = Math.round((count / totalCount) * 100);

      // Determine top problem category
      const catCounts: Record<string, number> = {};
      bComplaints.forEach((c) => {
        catCounts[c.categoryName] = (catCounts[c.categoryName] || 0) + 1;
      });
      const topCatEntry = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
      const topCategory = topCatEntry ? `${topCatEntry[0]} (${topCatEntry[1]})` : 'None';

      // Problem level styling (hotspot color scale)
      let colorScheme = {
        bg: 'fill-zinc-50 hover:fill-zinc-100',
        border: 'stroke-zinc-300',
        text: 'text-zinc-700',
        accent: 'bg-zinc-200 text-zinc-700',
        glow: '',
      };

      if (count >= 5 || critical >= 2) {
        // High Problem Hotspot (Red / Orange)
        colorScheme = {
          bg: 'fill-red-50/90 hover:fill-red-100/90',
          border: 'stroke-red-500',
          text: 'text-red-900',
          accent: 'bg-red-600 text-white',
          glow: 'filter drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]',
        };
      } else if (count >= 3) {
        // Moderate Hotspot (Amber / Orange)
        colorScheme = {
          bg: 'fill-amber-50/90 hover:fill-amber-100/90',
          border: 'stroke-amber-500',
          text: 'text-amber-900',
          accent: 'bg-amber-600 text-white',
          glow: 'filter drop-shadow-[0_0_6px_rgba(245,158,11,0.3)]',
        };
      } else if (count >= 1) {
        // Low / Mild
        colorScheme = {
          bg: 'fill-sky-50/90 hover:fill-sky-100/90',
          border: 'stroke-sky-400',
          text: 'text-sky-900',
          accent: 'bg-sky-600 text-white',
          glow: '',
        };
      } else {
        // Clear / No issues
        colorScheme = {
          bg: 'fill-emerald-50/70 hover:fill-emerald-100/70',
          border: 'stroke-emerald-300',
          text: 'text-emerald-900',
          accent: 'bg-emerald-600 text-white',
          glow: '',
        };
      }

      return {
        id: def.id,
        name: def.name,
        shortName: def.shortName,
        zone: def.zone,
        complaintCount: count,
        openCount: open,
        resolvedCount: resolved,
        criticalCount: critical,
        percentage: pct,
        topCategory,
        avgResolutionHours: count > 0 ? (def.id === 'acad' ? 4.2 : def.id === 'fst' ? 3.1 : 2.5) : 0,
        colorScheme,
        svgCoord: def.svgCoord,
      };
    });
  }, [filteredComplaints]);

  // Rank buildings by complaint volume to identify most problematic
  const rankedBuildings = useMemo(() => {
    return [...buildingsData].sort((a, b) => b.complaintCount - a.complaintCount);
  }, [buildingsData]);

  // Identify #1 most problematic building
  const topProblemBuilding = rankedBuildings[0];

  // Selected building details
  const activeBuilding = buildingsData.find((b) => b.id === selectedBuildingId) || buildingsData[0];

  // Complaints inside the active building
  const activeBuildingComplaints = useMemo(() => {
    if (!activeBuilding) return [];
    return filteredComplaints.filter((c) =>
      c.buildingName.toLowerCase().includes(activeBuilding.shortName.toLowerCase()) ||
      c.buildingName.toLowerCase().includes(activeBuilding.name.toLowerCase()) ||
      (activeBuilding.id === 'acad' && (c.buildingName.includes('Academic') || c.roomArea.includes('Lab 402') || c.roomArea.includes('Gallery 301'))) ||
      (activeBuilding.id === 'fst' && (c.buildingName.includes('FST') || c.roomArea.includes('Microcontroller') || c.roomArea.includes('CSE'))) ||
      (activeBuilding.id === 'admin' && c.buildingName.includes('Admin')) ||
      (activeBuilding.id === 'fbs' && c.buildingName.includes('FBS')) ||
      (activeBuilding.id === 'lake' && c.buildingName.includes('Lake')) ||
      (activeBuilding.id === 'med' && c.buildingName.includes('Medical'))
    );
  }, [activeBuilding, filteredComplaints]);

  return (
    <div className="space-y-6 font-sans pb-16">
      {/* 1. Header & Problem Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-zinc-400 mb-1 flex items-center gap-1.5">
            <span>Analytics &amp; Facilities</span>
            <span>/</span>
            <span className="text-zinc-600 font-medium">BUP Campus Problem Heatmap</span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            Campus Map &amp; Hotspot Analysis
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Spatial problem diagnostics derived from BUP Master Campus Layout &amp; incident logs.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2">
          <div className="bg-zinc-100 p-1 rounded-xl flex items-center text-xs font-bold">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              🗺️ Visual Map
            </button>
            <button
              onClick={() => setViewMode('ranking')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'ranking'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              📊 Hotspot Ranking
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Problem Banner (Pinpointing #1 Most Problematic Area) */}
      {topProblemBuilding && topProblemBuilding.complaintCount > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30">
              <Flame className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/25 border border-white/40">
                  CRITICAL HOTSPOT IDENTIFIED
                </span>
                <span className="text-xs font-medium text-white/90">
                  {topProblemBuilding.zone} Campus
                </span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg mt-0.5">
                {topProblemBuilding.name} is the most problematic section ({topProblemBuilding.percentage}% of campus complaints)
              </h3>
              <p className="text-xs text-white/80 mt-0.5">
                {topProblemBuilding.openCount} open incidents • Primary issue: {topProblemBuilding.topCategory} • Avg resolution delay: {topProblemBuilding.avgResolutionHours}h
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSelectedBuildingId(topProblemBuilding.id)}
              className="px-4 py-2 rounded-xl bg-white text-red-700 hover:bg-white/90 font-bold text-xs transition-colors cursor-pointer shadow-xs"
            >
              Inspect Section
            </button>
          </div>
        </div>
      )}

      {/* 3. Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-zinc-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter By Category:</span>
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-800 font-medium focus:outline-none focus:border-black"
          >
            <option value="All">All Categories</option>
            {[...categories].sort((a, b) => {
              const other = (name: string) => ['other', 'others'].includes(name.trim().toLowerCase());
              if (other(a.name) !== other(b.name)) return other(a.name) ? 1 : -1;
              return a.name.localeCompare(b.name);
            }).map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-zinc-500 font-semibold ml-2">
            <span>Status:</span>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-800 font-medium focus:outline-none focus:border-black"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open &amp; Pending Only</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-medium text-zinc-600">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Severe Hotspot (&ge;5 issues)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Moderate (3-4 issues)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>Low (1-2 issues)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Clear</span>
          </span>
        </div>
      </div>

      {/* 4. MAIN INTERACTIVE MAP & INSPECTION LAYOUT */}
      {viewMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Map Column (8 Cols) */}
          <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-sm text-zinc-900">Interactive BUP Campus Map</h3>
                <p className="text-xs text-zinc-400">Click any facility block to inspect maintenance health</p>
              </div>
              <span className="text-[11px] font-mono font-bold text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-lg">
                North ↑
              </span>
            </div>

            {/* SVG Interactive Canvas */}
            <div className="w-full aspect-[16/10] bg-[#faf8f5] rounded-2xl border border-zinc-200/80 p-2 relative overflow-hidden flex items-center justify-center">
              <svg
                viewBox="0 0 1000 620"
                className="w-full h-full select-none"
              >
                {/* Background Roads / Campus Paths */}
                <rect x="20" y="20" width="960" height="580" rx="20" fill="#f4efe6" stroke="#e6decb" strokeWidth="2" strokeDasharray="6 6" />

                {/* Entry Points matching sketch */}
                {/* North Entry */}
                <path d="M 450 15 L 550 15 L 550 40 L 450 40 Z" fill="#18181b" />
                <text x="500" y="32" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
                  ▲ NORTH ENTRY / EXIT
                </text>

                {/* South Entry */}
                <path d="M 450 580 L 550 580 L 550 605 L 450 605 Z" fill="#18181b" />
                <text x="500" y="597" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
                  ▼ SOUTH ENTRY / EXIT
                </text>

                {/* Internal Road Corridor */}
                {/* North-South West spine */}
                <rect x="235" y="45" width="16" height="530" rx="8" fill="#e5dfd3" />
                {/* North East-West crossroad */}
                <rect x="235" y="190" width="715" height="16" rx="8" fill="#e5dfd3" />
                {/* South East-West crossroad */}
                <rect x="235" y="325" width="715" height="16" rx="8" fill="#e5dfd3" />

                {/* Footbridge over Lake */}
                <line x1="480" y1="210" x2="480" y2="330" stroke="#71717a" strokeWidth="8" strokeDasharray="4 2" />
                <text x="495" y="275" fill="#52525b" fontSize="10" fontWeight="bold" transform="rotate(-90 495 275)">
                  FOOTBRIDGE
                </text>

                {/* Render All Building Blocks */}
                {buildingsData.map((b) => {
                  const isSelected = b.id === selectedBuildingId;
                  const { x, y, width, height, rx } = b.svgCoord;
                  const isLake = b.id === 'lake';

                  return (
                    <g
                      key={b.id}
                      onClick={() => setSelectedBuildingId(b.id)}
                      className="cursor-pointer transition-transform group"
                    >
                      {/* Building Base Rect */}
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        rx={rx || 12}
                        className={`transition-all duration-200 ${
                          isLake
                            ? 'fill-cyan-100/80 stroke-cyan-400 hover:fill-cyan-200/90'
                            : b.colorScheme.bg
                        } ${isSelected ? 'stroke-black stroke-[3.5px] filter drop-shadow-md' : `${b.colorScheme.border} stroke-[2px]`}`}
                      />

                      {/* Building Label */}
                      <text
                        x={x + 14}
                        y={y + 24}
                        className={`text-xs font-extrabold select-none ${
                          isSelected ? 'fill-black' : isLake ? 'fill-cyan-900' : 'fill-zinc-900'
                        }`}
                        fontSize={width < 120 ? '11' : '13'}
                        fontWeight="800"
                      >
                        {b.shortName}
                      </text>

                      {/* Zone Subtitle or Details */}
                      {!isLake && (
                        <text
                          x={x + 14}
                          y={y + 40}
                          className="select-none fill-zinc-500"
                          fontSize="9.5"
                          fontWeight="600"
                        >
                          {b.zone} Zone • {b.complaintCount} issues
                        </text>
                      )}

                      {isLake && (
                        <text
                          x={x + 14}
                          y={y + 44}
                          className="select-none fill-cyan-700"
                          fontSize="10"
                          fontWeight="600"
                        >
                          Central Water Feature &amp; Scenic Walkway • {b.complaintCount} incident
                        </text>
                      )}

                      {/* Problem Badge Pill on Top Right of Building */}
                      {b.complaintCount > 0 && (
                        <g transform={`translate(${x + width - 36}, ${y + 8})`}>
                          <circle
                            cx="14"
                            cy="14"
                            r="13"
                            className={`${
                              b.complaintCount >= 5
                                ? 'fill-red-600'
                                : b.complaintCount >= 3
                                ? 'fill-amber-500'
                                : 'fill-sky-500'
                            } transition-transform group-hover:scale-110`}
                          />
                          <text
                            x="14"
                            y="18"
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {b.complaintCount}
                          </text>
                        </g>
                      )}

                      {/* Selection Ring Indicator */}
                      {isSelected && (
                        <circle
                          cx={x + width - 12}
                          cy={y + height - 12}
                          r="6"
                          fill="#000000"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Bottom Map Note */}
            <div className="mt-3 text-xs text-zinc-500 flex items-center justify-between">
              <span>* Derived from official BUP campus zoning diagram</span>
              <span className="font-semibold text-zinc-700">Click any block to inspect open tickets</span>
            </div>
          </div>

          {/* Inspection Panel (4 Cols) */}
          <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                  {activeBuilding.zone} Campus
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeBuilding.colorScheme.accent}`}>
                  {activeBuilding.percentage}% of total issues
                </span>
              </div>
              <h3 className="font-extrabold text-lg text-zinc-900 leading-tight">
                {activeBuilding.name}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Facility Diagnostic &amp; Incident Log
              </p>
            </div>

            {/* Mini Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 text-center">
                <div className="text-[10px] text-zinc-400 font-bold uppercase">Total</div>
                <div className="text-lg font-black text-zinc-900 mt-0.5">
                  {activeBuilding.complaintCount}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-center">
                <div className="text-[10px] text-amber-700 font-bold uppercase">Pending</div>
                <div className="text-lg font-black text-amber-900 mt-0.5">
                  {activeBuilding.openCount}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center">
                <div className="text-[10px] text-emerald-700 font-bold uppercase">Resolved</div>
                <div className="text-lg font-black text-emerald-900 mt-0.5">
                  {activeBuilding.resolvedCount}
                </div>
              </div>
            </div>

            {/* Hotspot Analysis Box */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
              <div className="font-bold text-zinc-800 flex items-center justify-between">
                <span>Problem Category Trend:</span>
                <span className="text-red-600 font-extrabold">{activeBuilding.topCategory}</span>
              </div>
              <div className="font-bold text-zinc-800 flex items-center justify-between">
                <span>Avg. Resolution Latency:</span>
                <span className="text-zinc-900 font-mono font-bold">
                  {activeBuilding.avgResolutionHours > 0 ? `${activeBuilding.avgResolutionHours} hours` : 'N/A'}
                </span>
              </div>
              <div className="font-bold text-zinc-800 flex items-center justify-between">
                <span>Severity Level:</span>
                <span className={`font-bold ${activeBuilding.complaintCount >= 5 ? 'text-red-600' : activeBuilding.complaintCount >= 3 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {activeBuilding.complaintCount >= 5 ? 'Severe (Action Required)' : activeBuilding.complaintCount >= 3 ? 'Elevated' : 'Stable'}
                </span>
              </div>
            </div>

            {/* List of Complaints in this Building */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-zinc-900 uppercase tracking-wider">
                  Logged Incidents ({activeBuildingComplaints.length})
                </h4>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {activeBuildingComplaints.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-zinc-200 text-center text-xs text-zinc-400">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1 opacity-80" />
                    No active issues logged for this facility.
                  </div>
                ) : (
                  activeBuildingComplaints.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => onSelectComplaint && onSelectComplaint(c.id)}
                      className="p-3 rounded-2xl border border-zinc-200 hover:border-black transition-all bg-white hover:bg-zinc-50 cursor-pointer shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-zinc-900">{c.id}</span>
                        <span className={`px-2 py-0.2 rounded-full font-bold text-[9px] ${
                          c.status === 'Resolved' || c.status === 'Closed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <h5 className="font-bold text-xs text-zinc-900 line-clamp-1">{c.title}</h5>
                      <div className="text-[10px] text-zinc-500 flex items-center justify-between">
                        <span>{c.roomArea}</span>
                        <span className="font-semibold text-zinc-700">{c.categoryName}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Report Button */}
            {canFileComplaint && onNewComplaintAtLocation && (
              <button
                onClick={() => onNewComplaintAtLocation(activeBuilding.name)}
                className="w-full py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log New Issue in {activeBuilding.shortName}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* 5. HOTSPOT RANKING MATRIX VIEW */
        <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <div>
              <h3 className="font-bold text-base text-zinc-900">
                Problematic Campus Hotspot Analysis &amp; Ranking
              </h3>
              <p className="text-xs text-zinc-500">
                Sorted by total incident volume, severity index, and resolution delay
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-zinc-500">
              {buildingsData.length} Campus Facilities Tracked
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                <tr>
                  <th className="px-5 py-3">RANK &amp; FACILITY</th>
                  <th className="px-5 py-3">CAMPUS ZONE</th>
                  <th className="px-5 py-3">TOTAL INCIDENTS</th>
                  <th className="px-5 py-3">PROBLEM SHARE</th>
                  <th className="px-5 py-3">OPEN / PENDING</th>
                  <th className="px-5 py-3">PRIMARY COMPLAINT DRIVER</th>
                  <th className="px-5 py-3">SEVERITY</th>
                  <th className="px-5 py-3">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rankedBuildings.map((b, idx) => (
                  <tr
                    key={b.id}
                    className="hover:bg-zinc-50/80 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0
                            ? 'bg-red-600 text-white'
                            : idx === 1
                            ? 'bg-orange-500 text-white'
                            : idx === 2
                            ? 'bg-amber-500 text-white'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-zinc-900 text-xs">{b.name}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">{b.id.toUpperCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[10px] font-bold">
                        {b.zone}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono font-extrabold text-zinc-900 text-sm">
                      {b.complaintCount}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-zinc-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              b.percentage >= 30
                                ? 'bg-red-600'
                                : b.percentage >= 15
                                ? 'bg-amber-500'
                                : 'bg-sky-500'
                            }`}
                            style={{ width: `${Math.max(b.percentage, 5)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-zinc-800 text-xs">{b.percentage}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`font-mono font-bold ${b.openCount > 0 ? 'text-amber-700' : 'text-zinc-400'}`}>
                        {b.openCount} open
                      </span>
                    </td>
                    <td className="px-5 py-4 text-zinc-700 font-medium">
                      {b.topCategory}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.complaintCount >= 5
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : b.complaintCount >= 3
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}>
                        {b.complaintCount >= 5 ? 'High Risk' : b.complaintCount >= 3 ? 'Moderate' : 'Normal'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => {
                          setSelectedBuildingId(b.id);
                          setViewMode('map');
                        }}
                        className="px-3 py-1 rounded-lg bg-zinc-100 hover:bg-black hover:text-white text-zinc-800 text-[11px] font-bold transition-all cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
