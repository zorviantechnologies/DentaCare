import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Activity,
  FileText,
  DollarSign,
  Package,
  CheckSquare,
  RefreshCw,
  BarChart3,
  Settings,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { logout, hasPermission } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/clinic', icon: LayoutDashboard, module: 'dashboard' },
    { name: 'Patients', path: '/clinic/patients', icon: Users, module: 'patients' },
    { name: 'Appointments', path: '/clinic/appointments', icon: Calendar, module: 'appointments' },
    { name: 'Treatments Catalog', path: '/clinic/treatments', icon: ClipboardList, module: 'treatments' },
    { name: 'Visits Log', path: '/clinic/visits', icon: Activity, module: 'visits' },
    { name: 'Prescriptions', path: '/clinic/prescriptions', icon: FileText, module: 'prescriptions' },
    { name: 'Billing & Invoices', path: '/clinic/billing', icon: DollarSign, module: 'billing' },
    { name: 'Inventory Stock', path: '/clinic/inventory', icon: Package, module: 'inventory' },
    { name: 'Reports & Stats', path: '/clinic/reports', icon: BarChart3, module: 'reports' },
    { name: 'Settings', path: '/clinic/settings', icon: Settings, module: 'settings' },
  ];

  const filteredItems = menuItems.filter((item) => hasPermission(item.module));

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-gradient-to-b from-blue-900 via-blue-950 to-slate-900 text-slate-100 flex flex-col justify-between border-r border-blue-800/40 z-30 transition-all duration-300 ${
        collapsed ? 'w-24' : 'w-64'
      } hidden md:flex overflow-hidden`}
    >
      {/* Brand Logo & Name */}
      <div className="flex-none flex flex-col items-center justify-center py-3.5 px-1.5 gap-1 border-b border-blue-800/40">
        <div className="w-10 h-10 min-w-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-xl">
          D
        </div>
        <span className="font-heading font-bold text-[10px] text-blue-200 uppercase tracking-wider truncate max-w-full">
          DentaCare
        </span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 min-h-0 p-1.5 space-y-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/clinic'}
              title={collapsed ? item.name : undefined}
              className={({ isActive }) =>
                `flex items-center transition-all duration-200 ${
                  collapsed
                    ? 'flex-col justify-center py-1.5 px-1 rounded-xl text-center group'
                    : 'gap-3 px-3 py-2.5 rounded-xl font-medium'
                } ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-blue-800/20'
                }`
              }
            >
              <Icon size={18} className="min-w-[18px]" />
              {collapsed ? (
                <span className="text-[9px] font-medium leading-tight mt-0.5 text-center w-full break-words px-0.5">
                  {item.name}
                </span>
              ) : (
                <span className="text-sm truncate">{item.name}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Logout */}
      <div className="flex-none p-1.5 border-t border-blue-800/40 bg-blue-950/60">
        <button
          onClick={logout}
          title={collapsed ? 'Logout' : undefined}
          className={`w-full flex items-center transition-all text-slate-400 hover:text-rose-200 hover:bg-rose-950/20 rounded-xl font-medium ${
            collapsed ? 'flex-col justify-center py-1.5 px-1 text-center' : 'gap-3 px-3 py-2.5'
          }`}
        >
          <LogOut size={18} className="min-w-[18px]" />
          {collapsed ? (
            <span className="text-[9px] font-medium leading-tight mt-0.5 text-center w-full truncate">
              Logout
            </span>
          ) : (
            <span className="text-sm">Logout</span>
          )}
        </button>
      </div>
    </aside>
  );
};

