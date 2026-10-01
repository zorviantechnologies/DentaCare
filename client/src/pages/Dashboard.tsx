import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  Users, 
  Calendar as CalendarIcon, 
  Package, 
  CheckSquare, 
  ArrowRight, 
  Plus,
  Clock
} from 'lucide-react';

// Charts
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    pendingTasks: 0,
    inventoryAlerts: 0,
  });
  
  const [statusCounts, setStatusCounts] = useState<number[]>([0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [aptsResponse, tasksResponse, invResponse, patientsResponse] = await Promise.all([
          api.get('/appointments'),
          api.get('/tasks'),
          api.get('/inventory'),
          api.get('/patients?limit=1'),
        ]);

        const aptsList = aptsResponse.data || [];
        const now = new Date();
        const isSameDay = (d1: Date, d2: Date) =>
          d1.getFullYear() === d2.getFullYear() &&
          d1.getMonth() === d2.getMonth() &&
          d1.getDate() === d2.getDate();

        const todayApts = aptsList.filter((apt: any) => {
          if (!apt.dateTime) return false;
          return isSameDay(new Date(apt.dateTime), now);
        }).length;

        const totalApts = aptsList.length;
        const totalP = patientsResponse.data?.total ?? (patientsResponse.data?.patients?.length || 0);

        const lowStock = (invResponse.data || []).filter((item: any) => 
          item.quantity <= item.minQuantityAlert
        ).length;

        const pendingT = (tasksResponse.data || []).filter((t: any) => 
          t.status !== 'Done'
        ).length;

        // Dynamic status breakdown calculation
        const scheduledCount = aptsList.filter((a: any) => a.status === 'SCHEDULED').length;
        const checkedInCount = aptsList.filter((a: any) => a.status === 'CHECKED_IN').length;
        const inProgressCount = aptsList.filter((a: any) => a.status === 'IN_PROGRESS').length;
        const completedCount = aptsList.filter((a: any) => a.status === 'COMPLETED').length;
        const cancelledCount = aptsList.filter((a: any) => a.status === 'CANCELLED' || a.status === 'NO_SHOW').length;

        setStatusCounts([scheduledCount, checkedInCount, inProgressCount, completedCount, cancelledCount]);

        setStats({
          totalPatients: totalP,
          totalAppointments: totalApts,
          todayAppointments: todayApts,
          pendingTasks: pendingT,
          inventoryAlerts: lowStock,
        });
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
        setStats({
          totalPatients: 0,
          totalAppointments: 0,
          todayAppointments: 0,
          pendingTasks: 0,
          inventoryAlerts: 0,
        });
        setStatusCounts([0, 0, 0, 0, 0]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const doughnutChartData = {
    labels: ['Scheduled', 'Checked In', 'In Progress', 'Completed', 'Cancelled / No Show'],
    datasets: [
      {
        data: statusCounts,
        backgroundColor: [
          '#60A5FA', // Scheduled
          '#F59E0B', // Checked In
          '#10B981', // In Progress
          '#94A3B8', // Completed
          '#EF4444', // Cancelled
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Sky Blue Greeting Banner with Action Buttons on Right */}
      <div className="bg-gradient-to-r from-sky-400 via-sky-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg shadow-sky-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden border border-sky-300/30">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/20 rounded-full blur-2xl pointer-events-none" />
        
        {/* Left: Greeting Message & Date */}
        <div className="z-10 flex-1">
          <div className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl border border-white/30 text-[11px] font-bold text-white shadow-sm mb-2">
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl drop-shadow-sm">
            Namaste, {user?.name || 'Doctor'}!
          </h1>
          <p className="text-sky-100 text-xs sm:text-sm mt-1 font-medium">
            Here is a quick overview of your clinic operations today.
          </p>
        </div>

        {/* Right: Action Buttons (+ Add Patient & Book Slot) */}
        <div className="z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate('/clinic/patients/new')}
            className="bg-white hover:bg-sky-50 text-sky-700 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-sky-900/10 transition-all flex items-center gap-1.5 active:scale-95 border border-white/80"
          >
            <Plus size={16} className="text-sky-600" /> Add Patient
          </button>
          <button
            onClick={() => navigate('/clinic/appointments')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-95"
          >
            <CalendarIcon size={16} className="text-slate-600" /> Book Slot
          </button>
        </div>
      </div>

      {/* METRIC CARD GRID (3 CARDS: Total Patients, Total Appointments, Today Appointments) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 p-5 rounded-2xl h-24 animate-pulse flex flex-col justify-between">
              <div className="h-4 bg-slate-100 rounded w-2/3"></div>
              <div className="h-6 bg-slate-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Card 1: Total Patients */}
          <div
            onClick={() => navigate('/clinic/patients')}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4 cursor-pointer hover:shadow-md hover:border-blue-400 hover:scale-[1.02] active:scale-95 transition-all group"
            title="Click to view all patients"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center p-3 shrink-0 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Users size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider leading-none">Total Patients</p>
                <h3 className="text-2xl font-heading font-extrabold text-slate-800 mt-1.5">
                  {stats.totalPatients}
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">Registered in Clinic</span>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
          </div>

          {/* Card 2: Total Appointments */}
          <div
            onClick={() => navigate('/clinic/appointments')}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4 cursor-pointer hover:shadow-md hover:border-indigo-400 hover:scale-[1.02] active:scale-95 transition-all group"
            title="Click to view all appointments"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center p-3 shrink-0 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <CalendarIcon size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider leading-none">Total Appointments</p>
                <h3 className="text-2xl font-heading font-extrabold text-slate-800 mt-1.5">
                  {stats.totalAppointments}
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">All Booked Schedules</span>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0" />
          </div>

          {/* Card 3: Today Appointments */}
          <div
            onClick={() => navigate('/clinic/appointments')}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4 cursor-pointer hover:shadow-md hover:border-emerald-400 hover:scale-[1.02] active:scale-95 transition-all group"
            title="Click to view today's appointments schedule"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center p-3 shrink-0 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider leading-none">Today Appointments</p>
                <h3 className="text-2xl font-heading font-extrabold text-slate-800 mt-1.5">
                  {stats.todayAppointments}
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">Scheduled for Today</span>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0" />
          </div>
        </div>
      )}

      {/* DASHBOARD CHARTS & ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointment Status Pie */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-heading font-bold text-slate-800 text-base">
              Bookings Status Breakdown
            </h3>
            <span className="text-xs text-slate-400 font-medium">Real-time Appointment Statuses</span>
          </div>
          <div className="h-64 relative flex justify-center">
            <Doughnut data={doughnutChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* FOOTER ALERTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inventory alerts */}
        {stats.inventoryAlerts > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-3.5 text-amber-800">
            <Package className="text-amber-500 mt-0.5" size={20} />
            <div>
              <h4 className="font-heading font-bold text-sm">Inventory Re-order Alerts</h4>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                You have {stats.inventoryAlerts} items running low on stock or close to expiry.
              </p>
              <Link to="/clinic/inventory" className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-blue-600 hover:underline">
                Manage Stock <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        )}

        {/* Task lists alerts */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-3.5 text-blue-800">
          <CheckSquare className="text-blue-500 mt-0.5" size={20} />
          <div>
            <h4 className="font-heading font-bold text-sm">Outstanding Clinical Tasks</h4>
            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
              You have {stats.pendingTasks} incomplete clinic follow-ups or sterilizer filter checklist tasks.
            </p>
            <Link to="/clinic/tasks" className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-blue-600 hover:underline">
              Checklist <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
