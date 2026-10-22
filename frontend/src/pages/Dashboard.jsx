import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { complaintsAPI, lostItemsAPI } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import ComplaintModal from '../components/ComplaintModal';
import { 
  FilePlus, 
  PackageSearch, 
  Train, 
  Calendar, 
  MapPin, 
  Eye, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Sparkles,
  Search
} from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('complaints'); // 'complaints' | 'lost-items'
  
  const [complaints, setComplaints] = useState([]);
  const [lostItems, setLostItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [compRes, lostRes] = await Promise.all([
        complaintsAPI.getPassengerComplaints(),
        lostItemsAPI.getPassengerItems(),
      ]);
      setComplaints(compRes || []);
      setLostItems(lostRes || []);
    } catch (err) {
      console.error('Failed to load dashboard records:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalComplaints = complaints.length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length;
  const inProgressCount = complaints.filter(c => c.status === 'in_progress').length;
  const pendingCount = complaints.filter(c => c.status === 'registered').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-white border border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Indian Railways Passenger Helpdesk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Namaste, {user?.name || 'Passenger'}
            </h1>
            <p className="text-sm text-gray-600 max-w-xl">
              Track your registered train grievances in real-time or monitor lost property recovery custody under the AWS Cloud Railway Vault.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/file-complaint"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200 transition-smooth"
            >
              <FilePlus className="w-4 h-4" />
              <span>File New Grievance</span>
            </Link>
            <Link
              to="/report-lost-item"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-sm border border-emerald-200 shadow-sm transition-smooth"
            >
              <PackageSearch className="w-4 h-4 text-emerald-600" />
              <span>Report Lost Item</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Complaints</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-gray-900">{totalComplaints}</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Train className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Resolved</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-emerald-600">{resolvedCount}</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">In Progress</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-amber-600">{inProgressCount}</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Pending Attention</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-rose-600">{pendingCount}</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Sections with Dual Tabs */}
      <div className="space-y-4">
        
        {/* Navigation Tabs & Refresh */}
        <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('complaints')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-smooth flex items-center gap-2 ${
                activeTab === 'complaints'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                  : 'bg-white text-gray-600 hover:bg-emerald-50 border border-emerald-100'
              }`}
            >
              <Train className="w-4 h-4" />
              <span>My Complaints ({complaints.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('lost-items')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-smooth flex items-center gap-2 ${
                activeTab === 'lost-items'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                  : 'bg-white text-gray-600 hover:bg-emerald-50 border border-emerald-100'
              }`}
            >
              <PackageSearch className="w-4 h-4" />
              <span>Lost Property ({lostItems.length})</span>
            </button>
          </div>

          <button
            onClick={fetchData}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-smooth border border-emerald-100 bg-white"
            title="Refresh records"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>

        {/* Complaints Tab Content */}
        {activeTab === 'complaints' && (
          <div>
            {loading ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-emerald-100">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-600">Retrieving railway grievance records...</p>
              </div>
            ) : complaints.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-emerald-100 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">No Grievances Filed Yet</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                    Your journeys have been incident-free! If you face any cleanliness, pantry, or electrical issues onboard, log them right away.
                  </p>
                </div>
                <Link
                  to="/file-complaint"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm shadow-emerald-200 hover:bg-emerald-700 transition-smooth"
                >
                  <FilePlus className="w-4 h-4" />
                  <span>File First Complaint</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {complaints.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedComplaint(item)}
                    className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm hover:border-emerald-300 hover:shadow-card-hover transition-smooth cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-100">
                            Train {item.train_number}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            Coach {item.coach_number} / {item.seat_number}
                          </span>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                            {item.category}
                          </span>
                          <span className="text-xs text-gray-300">&bull;</span>
                          <span className="text-xs text-gray-400">Priority: {item.priority || 'Medium'}</span>
                        </div>
                        <p className="text-sm text-gray-800 font-medium line-clamp-3">
                          {item.description}
                        </p>
                      </div>

                      {item.photo_url && (
                        <div className="h-28 rounded-xl overflow-hidden bg-emerald-50/40 border border-emerald-100/60 relative">
                          <img
                            src={item.photo_url}
                            alt="Attached Evidence"
                            className="w-full h-full object-cover group-hover:scale-105 transition-smooth duration-300"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=400';
                            }}
                          />
                          <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-medium backdrop-blur-sm">
                            S3 Vault Photo
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-emerald-50 flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className="text-emerald-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-smooth">
                        <span>Details</span>
                        <Eye className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lost Items Tab Content */}
        {activeTab === 'lost-items' && (
          <div>
            {loading ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-emerald-100">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-600">Retrieving lost property custody records...</p>
              </div>
            ) : lostItems.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-emerald-100 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mx-auto">
                  <PackageSearch className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">No Lost Items Reported</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                    Have you misplaced baggage, wallets, electronics, or tickets during your train journey? Report them to notify railway custody vaults.
                  </p>
                </div>
                <Link
                  to="/report-lost-item"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm shadow-emerald-200 hover:bg-emerald-700 transition-smooth"
                >
                  <PackageSearch className="w-4 h-4" />
                  <span>Report Lost Property</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {lostItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm hover:border-emerald-300 hover:shadow-card-hover transition-smooth flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-100">
                          Train {item.train_number}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-900 text-base">{item.item_name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.coach_number ? `Coach ${item.coach_number}` : ''} {item.seat_number ? `/ Seat ${item.seat_number}` : ''}
                        </p>
                      </div>

                      <p className="text-xs text-gray-700 line-clamp-3">
                        {item.description}
                      </p>

                      {item.photo_url && (
                        <div className="h-28 rounded-xl overflow-hidden bg-emerald-50/40 border border-emerald-100/60">
                          <img
                            src={item.photo_url}
                            alt={item.item_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-emerald-50 flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className="font-mono text-[11px] text-gray-400">
                        {item.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Complaint Detail / Status Modal */}
      {selectedComplaint && (
        <ComplaintModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onUpdateStatus={async () => {
            // Passengers cannot change status from dashboard
            setSelectedComplaint(null);
          }}
          currentUserId={user?.id}
        />
      )}

    </div>
  );
};

export default Dashboard;
