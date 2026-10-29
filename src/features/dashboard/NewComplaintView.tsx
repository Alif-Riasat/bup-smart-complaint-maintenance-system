import React, { useState } from 'react';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Building2,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ComplaintPriority } from '../../types/complaint';

interface NewComplaintViewProps {
  onSuccess: (complaintId: string) => void;
  onCancel: () => void;
  initialLocationName?: string;
}

export const NewComplaintView: React.FC<NewComplaintViewProps> = ({
  onSuccess,
  onCancel,
  initialLocationName,
}) => {
  const { categories, locations, submitComplaint, currentUser } = useApp();

  const initialLoc = initialLocationName
    ? locations.find((l) => l.buildingName.toLowerCase().includes(initialLocationName.toLowerCase()))?.id || locations[0]?.id
    : locations[0]?.id || '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationId, setLocationId] = useState(initialLoc);
  const [priority, setPriority] = useState<ComplaintPriority>('Normal');
  const [isEmergency, setIsEmergency] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError('Selected photo exceeds 8MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl(event.target.result as string);
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      setError('Selected video exceeds 12MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setVideoUrl(event.target.result as string);
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 5) {
      setError('Give the complaint a title of at least 5 characters.');
      return;
    }
    if (!description.trim() || description.length < 20) {
      setError('Please enter at least 20 characters in the description.');
      return;
    }
    if (!categoryId) {
      setError('Please select a complaint category.');
      return;
    }
    if (currentUser.isRedFlagged) {
      setError('This account is paused for repeated complaints. An administrator has to clear the flag before you can submit again.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const created = await submitComplaint({
        title: title.trim(),
        description: description.trim(),
        categoryId,
        locationId,
        priority: isEmergency ? 'Urgent' : priority,
        imageUrl: imageUrl || undefined,
        videoUrl: videoUrl || undefined,
        isEmergency,
      });
      setIsSubmitting(false);
      onSuccess(created.id);
    } catch (err: any) {
      setError(err.message || 'Failed to submit complaint.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl font-sans pb-16 space-y-6">
      {/* Header Banner matching Image 2 */}
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
          New complaint
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Tell us what needs attention. You can submit 3 complaints every 10 minutes, and the same complaint cannot be sent again within 24 hours.
        </p>
      </div>

      {currentUser.isRedFlagged && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-3 shadow-2xs">
          <span className="text-base shrink-0 mt-0.5">🚩</span>
          <div className="space-y-0.5">
            <span className="font-extrabold uppercase tracking-wider text-[11px] block text-red-800">
              Account Flagged for Spam Moderation
            </span>
            <p className="text-red-700 font-medium leading-relaxed text-[11px]">
              This account is paused ({currentUser.flagReason || 'repeated complaints'}). New complaints stay blocked until an administrator clears the flag.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 01: Issue details Card (Pixel-match of Image 2) */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/90 shadow-xs space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              01
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 leading-tight">Issue details</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Describe the maintenance issue you've encountered.
              </p>
            </div>
          </div>

          <div className="space-y-5 pl-0 sm:pl-13">
            {/* Complaint title */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Complaint title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Air conditioner not cooling"
                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black transition-colors"
              />
              <span className="block text-[11px] text-zinc-400 mt-1">Keep it brief and specific.</span>
            </div>

            {/* Detailed description */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Detailed description
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened? When did you first notice it? Add any details that may help..."
                className="w-full bg-white border border-zinc-200 rounded-xl p-4 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-black transition-colors leading-relaxed"
              />
              <span className="block text-[11px] text-zinc-400 mt-1">Minimum 20 characters</span>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Category
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setCategoryId(nextId);
                  const next = categories.find((item) => item.id === nextId);
                  if (next?.defaultPriority && !isEmergency) setPriority(next.defaultPriority);
                }}
                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs text-zinc-900 focus:outline-none focus:border-black transition-colors"
              >
                <option value="">Select a category</option>
                {[...categories].sort((a, b) => {
                  const other = (name: string) => ['other', 'others'].includes(name.trim().toLowerCase());
                  if (other(a.name) !== other(b.name)) return other(a.name) ? 1 : -1;
                  return a.name.localeCompare(b.name);
                }).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 02: Location & Urgency */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/90 shadow-xs space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              02
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 leading-tight">Location &amp; urgency</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Specify campus area and how quickly it needs attention.
              </p>
            </div>
          </div>

          <div className="space-y-5 pl-0 sm:pl-13">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Campus Facility / Room
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs text-zinc-900 focus:outline-none focus:border-black transition-colors"
              >
                {[...locations]
                  .sort((a, b) => a.buildingName.localeCompare(b.buildingName))
                  .map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.floor === 'Campus' ? loc.buildingName : `${loc.buildingName} · ${loc.roomArea}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Urgency Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Low', 'Normal', 'High', 'Urgent'] as ComplaintPriority[]).map((p) => {
                  const isSelected = (isEmergency ? 'Urgent' : priority) === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setPriority(p);
                        if (p !== 'Urgent') setIsEmergency(false);
                      }}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        isSelected
                          ? p === 'Urgent'
                            ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                            : 'bg-black text-white border-black shadow-sm'
                          : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <label className="mt-3 flex items-start gap-2 text-xs text-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEmergency}
                  onChange={(e) => {
                    setIsEmergency(e.target.checked);
                    if (e.target.checked) setPriority('Urgent');
                  }}
                  className="mt-0.5 accent-black"
                />
                <span>
                  <span className="font-bold text-zinc-900">Flag as emergency.</span> The responsible maintenance officer and the administrator are notified immediately.
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Step 03: Supporting Evidence */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/90 shadow-xs space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              03
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 leading-tight">Photo proof</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Add a photo of the problem. Officers and administrators see it with the complaint.
              </p>
            </div>
          </div>

          <div className="pl-0 sm:pl-13 space-y-4">
            {/* Direct File Upload Dropzone */}
            <label className="border-2 border-dashed border-zinc-200 hover:border-black rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors bg-zinc-50/50 hover:bg-zinc-50 group">
              <Upload className="w-5 h-5 text-zinc-400 group-hover:text-black mb-1.5 transition-colors" />
              <span className="text-xs font-bold text-zinc-800">
                Add a photo as proof
              </span>
              <span className="text-[11px] text-zinc-400 mt-0.5">PNG, JPG, or WEBP up to 8MB</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileUpload} className="hidden" />
            </label>
            <label className="border-2 border-dashed border-zinc-200 hover:border-black rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white">
              <span className="text-xs font-bold text-zinc-800">Attach a short video</span>
              <span className="text-[11px] text-zinc-400 mt-0.5">MP4 or WebM up to 12MB</span>
              <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
            </label>
            {videoUrl && (
              <p className="text-xs font-semibold text-zinc-700">Video attached. <button type="button" className="text-red-600" onClick={() => setVideoUrl('')}>Remove</button></p>
            )}

            {/* Quick Demo Presets */}
            <div>
              <span className="text-[11px] font-semibold text-zinc-500 block mb-2">
                Or select a demonstration photo:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'AC Unit Leak', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80' },
                  { label: 'Projector Issue', url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=80' },
                  { label: 'Power Socket', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80' },
                  { label: 'Wi-Fi AP Outage', url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&auto=format&fit=crop&q=80' },
                ].map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => setImageUrl(sample.url)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                      imageUrl === sample.url
                        ? 'bg-black text-white border-black'
                        : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    + {sample.label}
                  </button>
                ))}
              </div>
            </div>

            {imageUrl && (
              <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
                <img
                  src={imageUrl}
                  alt="Attachment preview"
                  className="w-16 h-16 rounded-xl object-cover border border-zinc-200 shadow-2xs"
                />
                <div>
                  <span className="text-xs font-bold text-zinc-900 block">Attachment Ready</span>
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="text-xs font-semibold text-red-600 hover:underline cursor-pointer mt-0.5"
                  >
                    Remove photo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2"
          >
            <span>{isSubmitting ? 'Submitting...' : 'Submit complaint'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
