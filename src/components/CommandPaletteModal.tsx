import React, { useState, useEffect } from 'react';
import { Search, X, ArrowRight, FileText, Plus, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  onSelectComplaint: (id: string) => void;
  onNewComplaint: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onToggle,
  onSelectComplaint,
  onNewComplaint,
}) => {
  const { complaints, currentUser } = useApp();
  const canFileComplaint = currentUser.role === 'student' || currentUser.role === 'faculty';
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onToggle();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onToggle]);

  if (!isOpen) return null;

  const results = complaints.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.id.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.categoryName.toLowerCase().includes(q) ||
      c.buildingName.toLowerCase().includes(q)
    );
  }).slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden border border-zinc-200 animate-in fade-in zoom-in-95">
        <div className="p-4 border-b border-zinc-100 flex items-center gap-3">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search complaints by ID, title, or room..."
            className="flex-1 bg-transparent text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-2 max-h-80 overflow-y-auto divide-y divide-zinc-50">
          {canFileComplaint && <button
            onClick={() => {
              onNewComplaint();
              onClose();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 text-left text-xs font-semibold text-zinc-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span>Create a new complaint</span>
          </button>}

          {results.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                onSelectComplaint(c.id);
                onClose();
              }}
              className="p-3 rounded-xl hover:bg-zinc-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
            >
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-900">{c.id}</span>
                  <span className="text-zinc-400">•</span>
                  <span className="text-zinc-700 font-semibold truncate">{c.title}</span>
                </div>
                <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                  {c.categoryName} · {c.buildingName} · {c.roomArea}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700 shrink-0">
                {c.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
