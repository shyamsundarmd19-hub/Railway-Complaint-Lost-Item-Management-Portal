import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Train, 
  MapPin, 
  User, 
  Mail, 
  Calendar, 
  Image as ImageIcon,
  Send,
  ShieldCheck
} from 'lucide-react';
import StatusBadge from './StatusBadge';

export const ComplaintModal = ({ complaint, onClose, onUpdateStatus, currentUserId }) => {
  if (!complaint) return null;

  const [status, setStatus] = useState(complaint.status || 'registered');
  const [remarks, setRemarks] = useState(complaint.description_notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onUpdateStatus(complaint.id, {
        status,
        assigned_staff_id: currentUserId || null,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to update complaint status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-emerald-950/20 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full border border-emerald-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-50/60 border-b border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-base">
                  Train {complaint.train_number}
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Coach {complaint.coach_number} / Berth {complaint.seat_number}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                ID: {complaint.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-emerald-100/60 rounded-lg transition-smooth"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100">
              <span className="text-[11px] font-semibold text-emerald-800 block">Category</span>
              <span className="text-xs font-bold text-gray-800 capitalize mt-0.5 block">
                {complaint.category}
              </span>
            </div>
            <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100">
              <span className="text-[11px] font-semibold text-emerald-800 block">Priority</span>
              <span className="text-xs font-bold text-gray-800 mt-0.5 block">
                {complaint.priority || 'Medium'}
              </span>
            </div>
            <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100">
              <span className="text-[11px] font-semibold text-emerald-800 block">Current Status</span>
              <div className="mt-0.5">
                <StatusBadge status={complaint.status} />
              </div>
            </div>
            <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100">
              <span className="text-[11px] font-semibold text-emerald-800 block">Logged Time</span>
              <span className="text-xs font-medium text-gray-700 mt-0.5 block">
                {new Date(complaint.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Passenger Information */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-emerald-100/70 text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-gray-700">
              <User className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold">{complaint.passenger?.name || 'Verified Passenger'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4 text-emerald-600" />
              <span>{complaint.passenger?.email || 'Registered account'}</span>
            </div>
          </div>

          {/* Grievance Description */}
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
              Grievance Description
            </label>
            <div className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-xl text-sm text-gray-800 leading-relaxed">
              {complaint.description}
            </div>
          </div>

          {/* S3 Photo Attachment */}
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
              Photo Evidence (AWS S3 Vault)
            </label>
            {complaint.photo_url ? (
              <div className="rounded-xl overflow-hidden border border-emerald-100 bg-emerald-50/30 p-2">
                <img
                  src={complaint.photo_url}
                  alt="Complaint Evidence"
                  className="max-h-64 w-full object-cover rounded-lg"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800';
                  }}
                />
                <p className="text-[11px] text-gray-500 mt-2 px-1 flex items-center justify-between">
                  <span>Encrypted via AWS S3 (AES256)</span>
                  <a 
                    href={complaint.photo_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-emerald-600 font-semibold hover:underline"
                  >
                    Open original photo &rarr;
                  </a>
                </p>
              </div>
            ) : (
              <div className="p-6 border border-dashed border-emerald-200 rounded-xl bg-emerald-50/20 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-2">
                <ImageIcon className="w-8 h-8 text-emerald-300" />
                <span>No photographic evidence was attached to this complaint ticket.</span>
              </div>
            )}
          </div>

          {/* Status Update Form (Railway Staff Action) */}
          <form onSubmit={handleSubmit} className="pt-4 border-t border-emerald-100 space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
                Update Grievance Status
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'registered', label: 'Registered', color: 'border-rose-200 hover:bg-rose-50 text-rose-800' },
                  { id: 'in_progress', label: 'In Progress', color: 'border-amber-200 hover:bg-amber-50 text-amber-800' },
                  { id: 'resolved', label: 'Resolved', color: 'border-emerald-200 hover:bg-emerald-50 text-emerald-800' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStatus(s.id)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-smooth flex items-center justify-center gap-1.5 ${
                      status === s.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200'
                        : `bg-white ${s.color}`
                    }`}
                  >
                    {s.id === 'resolved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {s.id === 'in_progress' && <Clock className="w-3.5 h-3.5" />}
                    {s.id === 'registered' && <AlertCircle className="w-3.5 h-3.5" />}
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {status === 'resolved' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Automated Passenger Alert:</span>
                  <p className="mt-0.5 text-emerald-800">
                    Marking this issue as resolved will trigger an AWS SES email notification to {complaint.passenger?.email || 'the passenger'}.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-white border border-emerald-200 hover:bg-emerald-50 rounded-xl transition-smooth"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-200 flex items-center gap-2 transition-smooth disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Save & Update Status'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ComplaintModal;
