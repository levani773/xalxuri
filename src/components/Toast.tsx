import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2 } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage } = useAuth();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 border border-emerald-500/40 text-slate-100 shadow-2xl text-xs sm:text-sm animate-fade-in backdrop-blur-md">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      <span>{toastMessage}</span>
    </div>
  );
};
