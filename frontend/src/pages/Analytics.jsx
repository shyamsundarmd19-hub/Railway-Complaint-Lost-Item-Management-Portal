import React, { useState, useEffect } from 'react';
import { adminAPI } from '../api/client';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  PackageSearch, 
  RefreshCw, 
  ShieldCheck, 
  Activity,
  Layers
} from 'lucide-react';

export const Analytics = () => {
  const [metrics, setMetrics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const [analyticsData, logsData] = await Promise.all([
        adminAPI.getAnalytics(),
        adminAPI.getAuditLogs().catch(() => []),
      ]);
      setMetrics(analyticsData);
      setAuditLogs(logsData || []);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-700">Loading CloudGov analytics telemetry...</p>
      </div>
    );
  }

  const categoryBreakdown = metrics?.category_breakdown || {};
  const totalCategoryComplaints = Object.values(categoryBreakdown).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ministry of Railways Division Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Grievance Resolution & Lost Vault Analytics
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Real-time monitoring of passenger satisfaction, resolution velocity, and lost property recovery rates.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-smooth self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Complaints */}
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Complaints Filed</span>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-3xl font-black text-gray-900">{metrics?.total_complaints || 0}</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Layers className="w-5 h-5" />
              </div>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-4 pt-3 border-t border-emerald-50">
            Across Indian Railways Express Routes
          </p>
        </div>

        {/* Resolution Rate */}
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Resolution Rate</span>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-3xl font-black text-emerald-600">
                {metrics?.resolution_percentage || 0}%
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-emerald-50">
            <div className="w-full bg-emerald-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(metrics?.resolution_percentage || 0, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Pending & In Progress */}
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Active In-Flight Issues</span>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-3xl font-black text-amber-600">
                {(metrics?.registered_complaints || 0) + (metrics?.in_progress_complaints || 0)}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-4 pt-3 border-t border-emerald-50">
            {metrics?.registered_complaints || 0} Registered &bull; {metrics?.in_progress_complaints || 0} Under Inspection
          </p>
        </div>

        {/* Lost Property Recovered */}
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Lost Items Restored</span>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-3xl font-black text-emerald-700">
                {metrics?.lost_items_handed_over || 0}
                <span className="text-sm font-normal text-gray-400"> / {metrics?.total_lost_items || 0}</span>
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <PackageSearch className="w-5 h-5" />
              </div>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-4 pt-3 border-t border-emerald-50">
            Handed over to rightful owners
          </p>
        </div>

      </div>

      {/* Grievance Category Breakdown */}
      <div className="bg-white border border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-gray-900 text-lg">Grievance Distribution by Category</h3>
            <p className="text-xs text-gray-500 mt-0.5">Identifies departments requiring operational reinforcement.</p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Category Breakdown
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(categoryBreakdown).map(([cat, count]) => {
            const pct = Math.round((count / totalCategoryComplaints) * 100);
            return (
              <div key={cat} className="space-y-2 p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100/70">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="capitalize text-gray-800">{cat}</span>
                  <span className="text-emerald-700">{count} complaints ({pct}%)</span>
                </div>
                <div className="w-full bg-emerald-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security Audit Trail Log */}
      <div className="bg-white border border-emerald-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-emerald-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-gray-900 text-base">System Security & Audit Trail</h3>
            <p className="text-xs text-gray-500 mt-0.5">Immutable record of security logins, complaints filed, and staff status mutations.</p>
          </div>
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500">
            No audit events recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs">
              <thead className="bg-emerald-50/60 sticky top-0 text-emerald-950 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Details</th>
                  <th className="px-5 py-3 font-mono">User ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-emerald-50/30 transition-smooth">
                    <td className="px-5 py-3 whitespace-nowrap text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap font-bold text-emerald-800">
                      {log.action}
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {log.details || '&mdash;'}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap font-mono text-[11px] text-gray-400">
                      {log.user_id ? log.user_id.slice(0, 8) : 'System'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Analytics;
