import React, { useState } from 'react';
import { Building2, Plus, Wrench, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CategoriesLocationsView: React.FC = () => {
  const { categories, locations, addCategory, addLocation, departments } = useApp();

  const [showAddCat, setShowAddCat] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const [showAddLoc, setShowAddLoc] = useState(false);
  const [locBuilding, setLocBuilding] = useState('');
  const [locFloor, setLocFloor] = useState('');
  const [locRoom, setLocRoom] = useState('');

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    addCategory({
      name: catName.trim(),
      description: catDesc.trim() || 'Campus facility maintenance category',
      iconName: 'Wrench',
      departmentId: departments[0]?.id || 'dept-estate',
      defaultPriority: 'Medium',
    });
    setCatName('');
    setCatDesc('');
    setShowAddCat(false);
  };

  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locBuilding.trim() || !locRoom.trim()) return;
    addLocation({
      buildingName: locBuilding.trim(),
      floor: locFloor.trim() || '1st Floor',
      roomArea: locRoom.trim(),
    });
    setLocBuilding('');
    setLocFloor('');
    setLocRoom('');
    setShowAddLoc(false);
  };

  return (
    <div className="space-y-8 font-sans pb-16">
      <div>
        <div className="text-xs text-zinc-400 mb-1">
          Administration / <span className="text-zinc-600 font-medium">Categories &amp; locations</span>
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
          Categories &amp; Campus Facilities
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage institutional classifications and campus buildings per Figure 08 ER diagram.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="rounded-2xl bg-white border border-zinc-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Complaint Categories</h2>
            <p className="text-xs text-zinc-500">Facility issues routing to specialized departments</p>
          </div>
          <button
            onClick={() => setShowAddCat(true)}
            className="px-3.5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add category</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...categories].sort((a, b) => {
            const other = (name: string) => ['other', 'others'].includes(name.trim().toLowerCase());
            if (other(a.name) !== other(b.name)) return other(a.name) ? 1 : -1;
            return a.name.localeCompare(b.name);
          }).map((c) => (
            <div key={c.id} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
              <span className="font-bold text-zinc-900 text-xs block">{c.name}</span>
              <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">{c.description}</p>
              <span className="text-[10px] text-zinc-400 block pt-1 font-medium">
                Default: {c.defaultPriority}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Locations Grid */}
      <div className="rounded-2xl bg-white border border-zinc-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Campus Locations</h2>
            <p className="text-xs text-zinc-500">Buildings, blocks, laboratories, and grounds</p>
          </div>
          <button
            onClick={() => setShowAddLoc(true)}
            className="px-3.5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add location</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {locations.map((loc) => (
            <div key={loc.id} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                <Building2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="truncate">{loc.buildingName}</span>
              </div>
              <p className="text-xs text-zinc-800 font-semibold">{loc.roomArea}</p>
              <span className="text-[11px] text-zinc-400 block">{loc.floor}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Category Dialog */}
      {showAddCat && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 border border-zinc-200">
            <h3 className="font-bold text-sm text-zinc-900">Add New Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-600 block mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Elevators &amp; Lifts"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-600 block mb-1">Description</label>
                <input
                  type="text"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="e.g. Malfunctioning doors, button indicator..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCat(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-black text-white text-xs font-semibold"
                >
                  Save category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Location Dialog */}
      {showAddLoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 border border-zinc-200">
            <h3 className="font-bold text-sm text-zinc-900">Add Campus Location</h3>
            <form onSubmit={handleCreateLocation} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-600 block mb-1">Building Name</label>
                <input
                  type="text"
                  required
                  value={locBuilding}
                  onChange={(e) => setLocBuilding(e.target.value)}
                  placeholder="e.g. Academic Block"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-600 block mb-1">Floor</label>
                <input
                  type="text"
                  value={locFloor}
                  onChange={(e) => setLocFloor(e.target.value)}
                  placeholder="e.g. 4th Floor"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-600 block mb-1">Room or Area</label>
                <input
                  type="text"
                  required
                  value={locRoom}
                  onChange={(e) => setLocRoom(e.target.value)}
                  placeholder="e.g. 402"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLoc(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-black text-white text-xs font-semibold"
                >
                  Save location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
