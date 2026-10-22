import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FileComplaint from './pages/FileComplaint';
import ReportLostItem from './pages/ReportLostItem';
import StaffQueue from './pages/StaffQueue';
import Analytics from './pages/Analytics';

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-emerald-50/40 text-gray-800 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Passenger Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/file-complaint"
                element={
                  <ProtectedRoute>
                    <FileComplaint />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report-lost-item"
                element={
                  <ProtectedRoute>
                    <ReportLostItem />
                  </ProtectedRoute>
                }
              />

              {/* Protected Railway Staff & Admin Routes */}
              <Route
                path="/staff/queue"
                element={
                  <ProtectedRoute allowedRoles={['railway_staff', 'admin']}>
                    <StaffQueue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'railway_staff']}>
                    <Analytics />
                  </ProtectedRoute>
                }
              />

              {/* Default Fallback */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-emerald-100 py-6 text-center text-xs text-emerald-800/80">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-950">RailAlert Cloud Portal</span>
                <span>&bull;</span>
                <span>Indian Railways Grievance & Lost Vault System</span>
              </div>
              <p className="text-gray-400">
                AWS Free Tier Optimized &bull; Fast, Secure, Serverless S3 Storage
              </p>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
