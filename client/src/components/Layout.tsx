import React, { useState } from 'react';
import { Navigate, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CheckSquare, 
  Menu, 
  X, 
  Package, 
  RefreshCw, 
  BarChart3, 
  Settings, 
  Plus,
  ClipboardList,
  Activity,
  FileText,
  DollarSign
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { token, loading, user, hasPermission } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-healthcareBg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Loading DentaCare Workspace...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Mobile Bottom Navigation Links (most accessed)
  const mobileNavItems = [
    { label: 'Home', path: '/clinic', icon: LayoutDashboard, module: 'dashboard' },
    { label: 'Patients', path: '/clinic/patients', icon: Users, module: 'patients' },
    { label: 'Calendar', path: '/clinic/appointments', icon: Calendar, module: 'appointments' },
    { label: 'Billing', path: '/clinic/billing', icon: DollarSign, module: 'billing' },
  ].filter(item => hasPermission(item.module));

  // Drawer menu items for "More" button on mobile
  const drawerItems = [
    { name: 'Treatments Catalog', path: '/clinic/treatments', icon: ClipboardList, module: 'treatments' },
    { name: 'Treatment Plans', path: '/clinic/treatment-plans', icon: Activity, module: 'treatment-plans' },
    { name: 'Visits Log', path: '/clinic/visits', icon: Activity, module: 'visits' },
    { name: 'Prescriptions', path: '/clinic/prescriptions', icon: FileText, module: 'prescriptions' },
    { name: 'Billing & Invoices', path: '/clinic/billing', icon: DollarSign, module: 'billing' },
    { name: 'Inventory Stock', path: '/clinic/inventory', icon: Package, module: 'inventory' },
    { name: 'Reports & Stats', path: '/clinic/reports', icon: BarChart3, module: 'reports' },
    { name: 'Settings', path: '/clinic/settings', icon: Settings, module: 'settings' },
  ].filter(item => hasPermission(item.module));

  return (
    <div className="min-h-screen flex bg-healthcareBg font-sans">
      {/* Desktop Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Main Content Pane */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'md:pl-24' : 'md:pl-64'
        }`}
      >
        <Header collapsed={sidebarCollapsed} />

        <main className="flex-1 p-4 md:p-6 mt-16 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 flex items-center justify-around px-2 z-30 shadow-lg">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 ${
                isActive ? 'text-blue-600 font-semibold' : 'text-slate-400'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}

        {/* Floating Quick Action Button */}
        {hasPermission('patients') && (
          <div className="relative">
            <button
              onClick={() => setShowFabMenu(!showFabMenu)}
              className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all -translate-y-4"
            >
              <Plus size={24} className={`transition-transform duration-200 ${showFabMenu ? 'rotate-45' : ''}`} />
            </button>

            {showFabMenu && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-white rounded-2xl border border-slate-100 shadow-xl p-3 flex flex-col gap-2 w-40 z-50">
                <button
                  onClick={() => { navigate('/clinic/patients/new'); setShowFabMenu(false); }}
                  className="text-left text-xs font-semibold px-2 py-1.5 hover:bg-slate-50 rounded-lg text-slate-700"
                >
                  + Add Patient
                </button>
                <button
                  onClick={() => { navigate('/clinic/appointments'); setShowFabMenu(false); }}
                  className="text-left text-xs font-semibold px-2 py-1.5 hover:bg-slate-50 rounded-lg text-slate-700"
                >
                  + Appointment
                </button>
              </div>
            )}
          </div>
        )}

        {/* More Options drawer activator */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-slate-400`}
        >
          <Menu size={20} />
          <span className="text-[10px]">More</span>
        </button>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-80 bg-white h-full shadow-2xl flex flex-col p-4 relative animate-slide-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <span className="font-heading font-bold text-slate-800">Clinic Directory</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-50"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto space-y-1">
              {drawerItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all ${
                      isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {user && (
              <div className="border-t border-slate-100 pt-4 mt-auto">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">{user.clinicName}</p>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">{user.name}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
