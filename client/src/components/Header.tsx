import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, LogOut, Shield } from 'lucide-react';

interface HeaderProps {
  collapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ collapsed = true }) => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Mock notifications for alerts demo
  const notifications = [
    { id: 1, title: 'Low Stock Alert', message: 'Anaesthetic Cartridges are below safety levels (3 remaining).', time: '10 mins ago', read: false },
    { id: 2, title: 'Upcoming Recall', message: 'Rajesh Kumar is due for a Routine Checkup.', time: '2 hours ago', read: false },
    { id: 3, title: 'Task Assigned', message: 'New task: "Autoclave filter replacement" assigned to you.', time: '1 day ago', read: true },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className={`fixed top-0 right-0 left-0 ${collapsed ? 'md:left-24' : 'md:left-64'} h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-6 flex items-center justify-between z-20 transition-all duration-300`}>
      
      {/* Left: Mobile Brand / Spacer */}
      <div className="flex-1 flex items-center justify-start">
        <div className="font-heading font-bold text-blue-600 sm:hidden">DentaCare</div>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-md flex justify-center">
        <div className="relative w-full max-w-sm hidden sm:block">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search patient, invoice..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Right: Action Buttons & User Profile */}
      <div className="flex-1 flex items-center justify-end gap-3">
        {/* Super Admin badge/indicator */}
        {user?.role === 'SUPER_ADMIN' && (
          <div className="flex items-center gap-1 bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-violet-100">
            <Shield size={12} />
            Super Admin
          </div>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-blue-900/5 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-heading font-semibold text-slate-800">Notifications</span>
                <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 hover:bg-slate-50 transition-colors flex gap-2 border-b border-slate-50 last:border-0 ${
                      !n.read ? 'bg-blue-50/20' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center font-heading font-bold text-blue-700 text-sm">
                {user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</p>
                <p className="text-[10px] text-slate-400 uppercase leading-none mt-0.5 font-bold tracking-wider">{user.role}</p>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-blue-900/5 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100 sm:hidden">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase mt-0.5 font-bold">{user.role}</p>
                </div>
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase leading-none font-bold">Clinic</p>
                  <p className="text-xs font-semibold text-blue-600 truncate mt-1">{user.clinicName}</p>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-rose-600 hover:bg-slate-50 transition-colors mt-1"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
