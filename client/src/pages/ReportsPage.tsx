import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Bar, Doughnut } from 'react-chartjs-2';
import { ShieldAlert, Lock, Sparkles, BarChart3, TrendingUp, IndianRupee, HelpCircle } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      if (user?.subscription !== 'PRO') {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/reports');
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load report analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  // If locked, render premium upsell panel
  if (user?.subscription !== 'PRO') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-100 rounded-3xl p-8 text-center flex flex-col gap-6 shadow-xl shadow-blue-900/5 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
          <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto shadow-sm">
            <Lock size={24} />
          </div>
          <div>
            <h2 className="font-heading font-bold text-slate-800 text-lg">Reports & Analytics Locked</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Revenue trends, collections breakdown, and patient demographic charts are exclusive features of the <span className="text-blue-600 font-bold uppercase">Pro Practice</span> plan.
            </p>
          </div>

          <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl text-left space-y-2.5 text-xs text-slate-600">
            <p className="flex items-center gap-2 font-semibold text-slate-700">
              <Sparkles size={14} className="text-blue-500" />
              What is included in PRO?
            </p>
            <p>&bull; Interactive monthly revenue growth line charts.</p>
            <p>&bull; Detailed payment collection modes breakdown.</p>
            <p>&bull; Gender & age patient growth demographics.</p>
          </div>

          <a
            href="/clinic/settings"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl text-center shadow-lg shadow-blue-600/15 transition-all mt-2 active:scale-95"
          >
            Upgrade Clinic Plan
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <ShieldAlert className="mx-auto text-red-500 mb-2" size={32} />
        <p className="text-slate-500 text-sm font-semibold">{error || 'An error occurred while loading reports.'}</p>
      </div>
    );
  }

  // Construct charts data from server responses
  const collectionsModeData = {
    labels: Object.keys(data.collectionsByMode),
    datasets: [
      {
        data: Object.values(data.collectionsByMode),
        backgroundColor: ['#3B82F6', '#10B981', '#6366F1', '#F59E0B', '#94A3B8'],
        borderWidth: 1,
      },
    ],
  };

  const genderData = {
    labels: Object.keys(data.genderDemographics),
    datasets: [
      {
        data: Object.values(data.genderDemographics),
        backgroundColor: ['#60A5FA', '#F472B6', '#C084FC', '#94A3B8'],
        borderWidth: 1,
      },
    ],
  };

  const revenueMonths = Object.keys(data.monthlyRevenue);
  const billedValues = Object.values(data.monthlyRevenue).map((item: any) => item.billed);
  const collectedValues = Object.values(data.monthlyRevenue).map((item: any) => item.collected);

  const monthlyRevBarData = {
    labels: revenueMonths.length > 0 ? revenueMonths : ['Current Month'],
    datasets: [
      {
        label: 'Invoiced Amount (INR)',
        data: billedValues.length > 0 ? billedValues : [data.summary.totalBilled],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'Collected Amount (INR)',
        data: collectedValues.length > 0 ? collectedValues : [data.summary.totalCollected],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
      },
    ],
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-xl sm:text-2xl text-slate-800 font-bold">Analytics & Operations</h1>
        <p className="text-xs text-slate-500 mt-1">Review clinic financial KPIs, collections breakdowns, and client registration growth.</p>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm shadow-blue-100/10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp size={18} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">Total Invoiced</p>
            <h3 className="text-base font-bold text-slate-800 mt-1">₹{data.summary.totalBilled.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm shadow-blue-100/10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee size={18} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">Total Collected</p>
            <h3 className="text-base font-bold text-slate-800 mt-1">₹{data.summary.totalCollected.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm shadow-blue-100/10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <HelpCircle size={18} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">Outstanding Balance</p>
            <h3 className="text-base font-bold text-slate-800 mt-1">₹{data.summary.totalPending.toLocaleString('en-IN')}</h3>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly comparative bar chart */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm shadow-blue-100/20 lg:col-span-2 flex flex-col gap-4">
          <h3 className="font-heading font-bold text-slate-800 text-sm">Monthly Revenue Comparison</h3>
          <div className="h-64 relative">
            <Bar data={monthlyRevBarData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Collections Breakdown pie */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm shadow-blue-100/20 flex flex-col gap-4">
          <h3 className="font-heading font-bold text-slate-800 text-sm">Collections by Mode</h3>
          <div className="h-56 relative flex justify-center">
            <Doughnut data={collectionsModeData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Demographics Breakdown pie */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm shadow-blue-100/20 flex flex-col gap-4">
          <h3 className="font-heading font-bold text-slate-800 text-sm">Patient Demographics (Gender)</h3>
          <div className="h-56 relative flex justify-center">
            <Doughnut data={genderData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
    </div>
  );
};
