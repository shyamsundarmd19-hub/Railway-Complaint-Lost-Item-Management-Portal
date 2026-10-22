import React from 'react';
import { CheckCircle2, Clock, AlertCircle, HelpCircle } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  const normStatus = (status || '').toLowerCase();

  if (normStatus === 'resolved' || normStatus === 'found' || normStatus === 'handed_over') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span className="capitalize">{normStatus.replace('_', ' ')}</span>
      </span>
    );
  }

  if (normStatus === 'in_progress' || normStatus === 'claim_pending') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
        <span className="capitalize">{normStatus.replace('_', ' ')}</span>
      </span>
    );
  }

  // registered, reported, pending
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 shadow-sm">
      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
      <span className="capitalize">{normStatus.replace('_', ' ')}</span>
    </span>
  );
};

export default StatusBadge;
