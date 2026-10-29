import React from 'react';

interface NotFoundPageProps {
  onHome: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onHome }) => {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-zinc-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <a
          href="https://bup.edu.bd/"
          className="w-12 h-12 rounded-xl bg-black text-white font-black text-xs inline-flex items-center justify-center"
        >
          BUP
        </a>
        <p className="mt-6 text-xs font-bold tracking-wider uppercase text-zinc-400">404</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-zinc-500">
          That address is not part of the maintenance portal.
        </p>
        <button
          type="button"
          onClick={onHome}
          className="mt-6 px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold"
        >
          Back to the portal
        </button>
      </div>
    </div>
  );
};
