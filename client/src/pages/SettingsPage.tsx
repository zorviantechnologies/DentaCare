import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Building, 
  Users, 
  Save, 
  UserPlus
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateClinicName, hasPermission } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'clinic' | 'users'>('clinic');
  const [loading, setLoading] = useState(true);

  // Clinic detail inputs
  const [clinicName, setClinicName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gst, setGst] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [savingClinic, setSavingClinic] = useState(false);

  // Staff members states
  const [staff, setStaff] = useState<any[]>([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<'DOCTOR' | 'ASSISTANT'>('DOCTOR');
  const [submittingStaff, setSubmittingStaff] = useState(false);

  const fetchSettingsData = async () => {
    try {
      setLoading(true);
      const [settingsRes, usersRes] = await Promise.all([
        api.get('/settings'),
        api.get('/settings/users'),
      ]);

      const c = settingsRes.data;
      setClinicName(c.name);
      setPhone(c.phone || '');
      setAddress(c.address || '');
      setGst(c.gstNumber || '');
      if (c.settings) {
        setPrimaryColor(c.settings.primaryColor);
      }
      setStaff(usersRes.data);
    } catch {
      console.error('Failed to load clinic settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const handleSaveClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingClinic(true);
    try {
      await api.put('/settings', {
        name: clinicName,
        phone,
        address,
        gstNumber: gst,
        primaryColor,
      });
      updateClinicName(clinicName);
      alert('Clinic settings updated successfully');
      fetchSettingsData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSavingClinic(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffEmail || !staffPassword) return;
    setSubmittingStaff(true);

    try {
      await api.post('/settings/users', {
        name: staffName,
        email: staffEmail,
        password: staffPassword,
        role: staffRole,
        isActive: true,
      });
      setShowAddStaff(false);
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
      fetchSettingsData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add staff member.');
    } finally {
      setSubmittingStaff(false);
    }
  };

  const toggleUserStatus = async (staffId: string, currentActive: boolean) => {
    try {
      await api.put(`/settings/users/${staffId}`, {
        isActive: !currentActive,
      });
      fetchSettingsData();
    } catch {
      alert('Failed to update staff status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* Navigation tabs */}
      <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm shadow-blue-100/20 flex flex-col gap-1.5 self-start">
        <button
          onClick={() => setActiveTab('clinic')}
          className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2.5 ${
            activeTab === 'clinic' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Building size={16} /> Clinic Details
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2.5 ${
            activeTab === 'users' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Users size={16} /> Clinic Users & Staff
        </button>
      </div>

      {/* Tab panel contents */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        
        {/* Clinic details tab */}
        {activeTab === 'clinic' && (
          <form
            onSubmit={handleSaveClinic}
            className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm shadow-blue-100/20 flex flex-col gap-5"
          >
            <div>
              <h3 className="font-heading font-bold text-slate-800 text-base">Clinic Configuration</h3>
              <p className="text-xs text-slate-400 mt-0.5">Customize clinic identity and print heading branding details.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Clinic Name *</label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Clinic Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={gst}
                  onChange={(e) => setGst(e.target.value)}
                  placeholder="07AAAAA1111A1Z1"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Branding Theme Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded border-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-500 font-mono">{primaryColor}</span>
                </div>
              </div>
            </div>

            {hasPermission('settings') ? (
              <button
                type="submit"
                disabled={savingClinic}
                className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-colors self-start mt-2"
              >
                <Save size={14} /> {savingClinic ? 'Saving Configuration...' : 'Save Configuration'}
              </button>
            ) : (
              <p className="text-xs text-amber-600 italic">Configuration changes are restricted to Owner profile.</p>
            )}
          </form>
        )}

        {/* Users / staff tab */}
        {activeTab === 'users' && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm shadow-blue-100/20 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div>
                <h3 className="font-heading font-bold text-slate-800 text-base">Users & Permissions</h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage administrative roles and active staff logins.</p>
              </div>
              {hasPermission('settings') && (
                <button
                  onClick={() => setShowAddStaff(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-1 transition-all"
                >
                  <UserPlus size={12} /> Add User
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase">
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Status</th>
                    {hasPermission('settings') && <th className="py-2.5 px-3 text-right">Toggle Active</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {staff.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/20">
                      <td className="py-3 px-3 font-semibold text-slate-800">{member.name}</td>
                      <td className="py-3 px-3 text-xs">{member.email}</td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg">
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs">
                        {member.isActive ? (
                          <span className="text-emerald-600 font-semibold">Active Login</span>
                        ) : (
                          <span className="text-red-500 font-semibold">Deactivated</span>
                        )}
                      </td>
                      {hasPermission('settings') && (
                        <td className="py-3 px-3 text-right">
                          {member.role !== 'OWNER' ? (
                            <button
                              onClick={() => toggleUserStatus(member.id, member.isActive)}
                              className={`px-2 py-1 text-[10px] font-bold rounded-lg border ${
                                member.isActive
                                  ? 'text-red-600 bg-red-50 border-red-100'
                                  : 'text-emerald-600 bg-emerald-50 border-emerald-100'
                              }`}
                            >
                              {member.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">Owner profile</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ADD STAFF MODAL */}
      {showAddStaff && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <form
            onSubmit={handleAddStaff}
            className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 border border-slate-100 flex flex-col gap-4 animate-scale-up"
          >
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="font-heading font-bold text-slate-800">Add Staff Account</h3>
              <button
                type="button"
                onClick={() => setShowAddStaff(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Staff Member Name *</label>
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="Dr. Priya Patel"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address *</label>
              <input
                type="email"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                placeholder="priya@dentacare.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Login Password *</label>
              <input
                type="password"
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Clinic Role *</label>
              <select
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
              >
                <option value="DOCTOR">Doctor (Full clinical access)</option>
                <option value="ASSISTANT">Assistant (Scheduling & front office)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submittingStaff}
              className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-md transition-colors"
            >
              {submittingStaff ? 'Creating account...' : 'Create Staff User'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
