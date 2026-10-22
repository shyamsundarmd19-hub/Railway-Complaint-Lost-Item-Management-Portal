import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { complaintsAPI, lostItemsAPI } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import ComplaintModal from '../components/ComplaintModal';
import { 
  ShieldCheck, 
  Filter, 
  Search, 
  RefreshCw, 
  Train, 
  PackageSearch, 
  Eye, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronRight
} from 'lucide-react';

export const StaffQueue = () => {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('complaints'); // 'complaints' | 'lost'
  const [complaints, setComplaints] = useState([]);
  const [lostItems, setLostItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [trainSearch, setTrainSearch] = useState('');

  // Active Selected Complaint for Modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const fetchStaffData = async () => {
    try {
      setRefreshing(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;

      const [complaintsData, lostData] = await Promise.all([
        complaintsAPI.getAllComplaints(params),
        lostItemsAPI.getAllItems({
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(trainSearch ? { train_number: trainSearch } : {}),
        }),
      ]);
      setComplaints(complaintsData || []);
      setLostItems(lostData || []);
    } catch (err) {
      console.error('Failed to load staff queue:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [statusFilter, categoryFilter]);

  const handleUpdateComplaintStatus = async (complaintId, payload) => {
    await complaintsAPI.updateStatus(complaintId, payload);
    // Refresh records after update
    fetchStaffData();
  };

  const handleUpdateLostItemStatus = async (itemId, newStatus) => {
    try {
      await lostItemsAPI.updateStatus(itemId, { status: newStatus });
      fetchStaffData();
    } catch (err) {
      console.error('Failed to update lost item:', err);
    }
  };

  // Client-side train search filter for complaints
  const filteredComplaints = complaints.filter((c) => {
    if (!trainSearch) return true;
    return (
      c.train_number.toLowerCase().includes(trainSearch.toLowerCase()) ||
      c.coach_number?.toLowerCase().includes(trainSearch.toLowerCase()) ||
      c.id?.toLowerCase().includes(trainSearch.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Railway Staff Operations Queue
            </h1>
          </div>
          <p className="text-xs text-gray-600">
            Real-time division dispatch console for resolving passenger grievances and custody verification.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-smooth flex items-center gap-1.5 ${
              activeTab === 'complaints'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                : 'bg-white text-gray-700 hover:bg-emerald-50 border border-emerald-100'
            }`}
          >
            <Train className="w-3.5 h-3.5" />
            <span>Complaints ({filteredComplaints.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('lost')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-smooth flex items-center gap-1.5 ${
              activeTab === 'lost'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                : 'bg-white text-gray-700 hover:bg-emerald-50 border border-emerald-100'
            }`}
          >
            <PackageSearch className="w-3.5 h-3.5" />
            <span>Lost Property ({lostItems.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 bg-white border border-emerald-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="registered">Registered</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Category Filter (for complaints tab) */}
          {activeTab === 'complaints' && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-1.5 px-3 bg-white border border-emerald-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Categories</option>
              <option value="cleanliness">Cleanliness</option>
              <option value="pantry">Pantry & Food</option>
              <option value="electrical">Electrical</option>
              <option value="security">Security</option>
              <option value="other">Other</option>
            </select>
          )}
        </div>

        {/* Search input & Refresh */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search train / coach / ID..."
              value={trainSearch}
              onChange={(e) => setTrainSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-emerald-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={fetchStaffData}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-smooth border border-emerald-100 bg-white"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Complaints Queue Table */}
      {activeTab === 'complaints' && (
        <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-600">Loading operations queue...</p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-gray-800 text-sm">No Grievances Matching Filters</h3>
              <p className="text-xs text-gray-500">All registered train complaints have been resolved or filter returned zero results.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-emerald-50/60 border-b border-emerald-100 text-emerald-950 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Train & Seat</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Description</th>
                    <th className="px-5 py-3.5">Priority</th>
                    <th className="px-5 py-3.5">Passenger</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {filteredComplaints.map((c) => (
                    <tr 
                      key={c.id} 
                      onClick={() => setSelectedComplaint(c)}
                      className="hover:bg-emerald-50/40 cursor-pointer transition-smooth group"
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900 text-sm">Train {c.train_number}</div>
                        <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                          Coach {c.coach_number} &bull; Berth {c.seat_number}
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="capitalize px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-100">
                          {c.category}
                        </span>
                      </td>

                      <td className="px-5 py-4 max-w-xs">
                        <p className="truncate text-gray-800 font-medium">{c.description}</p>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          c.priority === 'Urgent'
                            ? 'bg-rose-100 text-rose-800'
                            : c.priority === 'High'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-50 text-emerald-800'
                        }`}>
                          {c.priority || 'Medium'}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-gray-800 font-semibold">{c.passenger?.name || 'Passenger'}</div>
                        <div className="text-[11px] text-gray-400">{c.passenger?.email || ''}</div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={c.status} />
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedComplaint(c);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-200 transition-smooth inline-flex items-center gap-1"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Lost Property Registry Tab */}
      {activeTab === 'lost' && (
        <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-600">Loading lost property registry...</p>
            </div>
          ) : lostItems.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <PackageSearch className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-gray-800 text-sm">No Lost Items in Custody</h3>
              <p className="text-xs text-gray-500">No lost property reports matching current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-emerald-50/60 border-b border-emerald-100 text-emerald-950 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Item Name</th>
                    <th className="px-5 py-3.5">Train & Coach</th>
                    <th className="px-5 py-3.5">Distinguishing Features</th>
                    <th className="px-5 py-3.5">Reported By</th>
                    <th className="px-5 py-3.5">Custody Status</th>
                    <th className="px-5 py-3.5 text-right">Update Custody</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {lostItems.map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-50/40 transition-smooth">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900 text-sm">{item.item_name}</div>
                        <span className="text-[10px] text-gray-400 font-mono">Ref: {item.id.slice(0, 8)}</span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-800">Train {item.train_number}</div>
                        <div className="text-[11px] text-emerald-700">
                          {item.coach_number ? `Coach ${item.coach_number}` : ''} {item.seat_number ? `/ Berth ${item.seat_number}` : ''}
                        </div>
                      </td>

                      <td className="px-5 py-4 max-w-xs">
                        <p className="truncate text-gray-700">{item.description}</p>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-800">{item.passenger?.name || 'Passenger'}</div>
                        <div className="text-[11px] text-gray-400">{item.passenger?.email || ''}</div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <select
                          value={item.status}
                          onChange={(e) => handleUpdateLostItemStatus(item.id, e.target.value)}
                          className="py-1 px-2.5 bg-white border border-emerald-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-500"
                        >
                          <option value="reported">Reported</option>
                          <option value="found">Found in Vault</option>
                          <option value="handed_over">Handed Over</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Review & Status Update Modal */}
      {selectedComplaint && (
        <ComplaintModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onUpdateStatus={handleUpdateComplaintStatus}
          currentUserId={user?.id}
        />
      )}

    </div>
  );
};

export default StaffQueue;
