import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  Upload,
  AlertCircle,
  Building2,
  MapPin,
  Clock,
  Sparkles,
  Coffee,
  Bus,
  Cpu,
  Wifi,
  Wind,
  Zap,
  Droplets,
  Armchair,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ComplaintPriority } from '../../types/complaint';

interface SubmitComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (complaintId: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Coffee,
  Bus,
  Cpu,
  Wifi,
  Wind,
  Zap,
  Droplets,
  Armchair,
};

const SAMPLE_EVIDENCE_IMAGES = [
  { label: 'Vending Machine Jam', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80' },
  { label: 'Shuttle Congestion', url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80' },
  { label: 'Lab Instrument Fault', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80' },
  { label: 'AC Unit Leakage', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80' },
  { label: 'Wi-Fi Router Outage', url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&auto=format&fit=crop&q=80' },
  { label: 'Electrical Socket', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80' },
];

export const SubmitComplaintModal: React.FC<SubmitComplaintModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { categories, locations, submitComplaint, currentUser } = useApp();

  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [locationId, setLocationId] = useState(locations[0]?.id || '');
  const [priority, setPriority] = useState<ComplaintPriority>('Medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [customFilePreview, setCustomFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomFilePreview(reader.result as string);
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a complaint title / issue summary.');
      return;
    }
    if (!description.trim() || description.length < 15) {
      setError('Please describe the problem in more detail (at least 15 characters).');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const newComplaint = await submitComplaint({
        title: title.trim(),
        description: description.trim(),
        categoryId,
        locationId,
        priority,
        imageUrl: customFilePreview || imageUrl || undefined,
      });

      setIsSubmitting(false);
      onSuccess(newComplaint.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to register complaint.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs text-[#f2e7d1]">
      <div className="bg-[#121212] border-2 border-[#f2e7d1]/20 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-[#f2e7d1]/15 flex items-center justify-between bg-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f2e7d1] text-black flex items-center justify-center font-bold">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Lodge Campus Complaint</h2>
              <p className="text-xs text-[#f2e7d1]/70">
                Reporting as <span className="text-orange-400 font-bold">{currentUser.name}</span> ({currentUser.studentOrEmployeeId})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#f2e7d1]/60 hover:text-white hover:bg-[#222222] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Category Selection */}
          <div>
            <label className="block text-xs font-bold text-[#f2e7d1]/90 uppercase tracking-wider mb-2">
              1. Issue Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[...categories].sort((a, b) => {
                const other = (name: string) => ['other', 'others'].includes(name.trim().toLowerCase());
                if (other(a.name) !== other(b.name)) return other(a.name) ? 1 : -1;
                return a.name.localeCompare(b.name);
              }).map((cat) => {
                const Icon = CATEGORY_ICONS[cat.iconName] || Coffee;
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategoryId(cat.id);
                      setPriority(cat.defaultPriority);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between h-20 ${
                      isSelected
                        ? 'bg-[#f2e7d1] text-black border-white shadow-sm font-bold'
                        : 'bg-black border-[#f2e7d1]/20 text-[#f2e7d1]/70 hover:border-[#f2e7d1]/50 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-black' : 'text-orange-400'}`} />
                    <span className="text-xs font-bold leading-tight line-clamp-2">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Campus Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#f2e7d1]/90 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-orange-400" />
                <span>Campus Location / Facility</span>
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full bg-black border border-[#f2e7d1]/20 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                {[...locations]
                  .sort((a, b) => a.buildingName.localeCompare(b.buildingName))
                  .map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.floor === 'Campus' ? loc.buildingName : `${loc.buildingName} - ${loc.roomArea}`}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Priority Level */}
            <div>
              <label className="block text-xs font-bold text-[#f2e7d1]/90 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                <span>Urgency / Priority</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['Low', 'Medium', 'High', 'Emergency'] as ComplaintPriority[]).map((p) => {
                  const isSelected = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 px-1 text-center rounded-lg text-xs font-bold border transition-all ${
                        isSelected
                          ? p === 'Emergency'
                            ? 'bg-red-700 text-white border-red-500 shadow-sm'
                            : p === 'High'
                            ? 'bg-orange-600 text-white border-orange-500'
                            : 'bg-[#f2e7d1] text-black border-white'
                          : 'bg-black border-[#f2e7d1]/20 text-[#f2e7d1]/60 hover:border-[#f2e7d1]/40'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Title */}
          <div>
            <label className="block text-xs font-bold text-[#f2e7d1]/90 uppercase tracking-wider mb-1.5">
              Complaint Subject / Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Broken AC remote and water leakage in Classroom 204"
              className="w-full bg-black border border-[#f2e7d1]/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#f2e7d1]/40 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* 5. Detailed Description */}
          <div>
            <label className="block text-xs font-bold text-[#f2e7d1]/90 uppercase tracking-wider mb-1.5">
              Problem Description &amp; Details
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details to help the maintenance team diagnose and fix the issue quickly (e.g. error codes, which bench or machine, times it occurred)..."
              className="w-full bg-black border border-[#f2e7d1]/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#f2e7d1]/40 focus:outline-none focus:border-orange-500 leading-relaxed"
            />
          </div>

          {/* 6. Image Attachment */}
          <div>
            <label className="block text-xs font-bold text-[#f2e7d1]/90 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Photo Evidence / Supporting Image (Optional)</span>
              <span className="text-[10px] text-[#f2e7d1]/60 font-normal">Helps rapid triage</span>
            </label>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_EVIDENCE_IMAGES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setImageUrl(sample.url);
                      setCustomFilePreview(null);
                    }}
                    className={`text-[10px] px-2.5 py-1 rounded-md border font-semibold transition-all ${
                      imageUrl === sample.url && !customFilePreview
                        ? 'bg-[#f2e7d1] text-black border-white'
                        : 'bg-black text-[#f2e7d1]/70 border-[#f2e7d1]/20 hover:text-white'
                    }`}
                  >
                    + {sample.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-black border border-[#f2e7d1]/20 hover:border-[#f2e7d1]/50 text-xs text-[#f2e7d1] transition-colors">
                  <Upload className="w-3.5 h-3.5 text-orange-400" />
                  <span>Upload from device</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {(customFilePreview || imageUrl) && (
                  <div className="flex items-center gap-2">
                    <img
                      src={customFilePreview || imageUrl}
                      alt="Attachment Preview"
                      className="w-10 h-10 rounded-lg object-cover border border-[#f2e7d1]/40"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        setCustomFilePreview(null);
                      }}
                      className="text-[11px] text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-[#f2e7d1]/15 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#222222] hover:bg-[#333333] text-[#f2e7d1] text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-700/40 flex items-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Register Complaint'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
