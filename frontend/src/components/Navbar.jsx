import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Train, 
  AlertTriangle, 
  PackageSearch, 
  BarChart3, 
  ShieldCheck, 
  LogOut, 
  User, 
  Menu, 
  X,
  FilePlus,
  Compass
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isStaffOrAdmin = role === 'railway_staff' || role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = (path) => {
    const active = location.pathname === path;
    return `inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg transition-smooth ${
      active
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50/60'
    }`;
  };

  return (
    <nav className="bg-white border-b border-emerald-100 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <Link to={isAuthenticated ? '/dashboard' : '/login'} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-200 group-hover:bg-emerald-700 transition-smooth">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-emerald-950 tracking-tight">RailAlert</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Gov Cloud
                </span>
              </div>
              <p className="text-[11px] text-emerald-600/90 font-medium -mt-0.5">
                Indian Railways Grievance & Lost Vault
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1.5">
              <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                <Compass className="w-4 h-4 text-emerald-600" />
                <span>Dashboard</span>
              </Link>

              <Link to="/file-complaint" className={navLinkClass('/file-complaint')}>
                <FilePlus className="w-4 h-4 text-emerald-600" />
                <span>File Complaint</span>
              </Link>

              <Link to="/report-lost-item" className={navLinkClass('/report-lost-item')}>
                <PackageSearch className="w-4 h-4 text-emerald-600" />
                <span>Report Lost Item</span>
              </Link>

              {isStaffOrAdmin && (
                <>
                  <div className="h-5 w-px bg-emerald-100 mx-1" />
                  <Link to="/staff/queue" className={navLinkClass('/staff/queue')}>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Staff Queue</span>
                  </Link>

                  <Link to="/admin/analytics" className={navLinkClass('/admin/analytics')}>
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    <span>Analytics</span>
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Right Actions / User Profile */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-800 flex items-center justify-end gap-1.5">
                    <span>{user?.name}</span>
                  </div>
                  <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                    {user?.role?.replace('_', ' ')}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-smooth border border-transparent hover:border-rose-100"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-smooth"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-200 transition-smooth"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-emerald-100 bg-white px-4 pt-3 pb-5 space-y-2">
          {isAuthenticated ? (
            <>
              <div className="pb-3 border-b border-emerald-100 mb-2">
                <p className="text-sm font-bold text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <span className="mt-1 inline-block text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 capitalize">
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>

              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Compass className="w-4 h-4 text-emerald-600" />
                My Dashboard
              </Link>

              <Link
                to="/file-complaint"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-emerald-50 hover:text-emerald-700"
              >
                <FilePlus className="w-4 h-4 text-emerald-600" />
                File Grievance
              </Link>

              <Link
                to="/report-lost-item"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-emerald-50 hover:text-emerald-700"
              >
                <PackageSearch className="w-4 h-4 text-emerald-600" />
                Report Lost Item
              </Link>

              {isStaffOrAdmin && (
                <>
                  <Link
                    to="/staff/queue"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Staff Queue
                  </Link>
                  <Link
                    to="/admin/analytics"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    Analytics Dashboard
                  </Link>
                </>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-rose-600 rounded-lg hover:bg-rose-50 mt-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg shadow-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
