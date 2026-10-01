import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Eye, Edit, Trash2, ArrowLeft, ArrowRight, User } from 'lucide-react';

interface Patient {
  id: string;
  patientNumber: string;
  name: string;
  phone: string;
  email: string | null;
  gender: string | null;
  dob: string | null;
  createdAt: string;
}

export const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/patients', {
        params: { search, page, limit: 8 },
      });
      setPatients(response.data.patients);
      setTotalPages(response.data.pages);
    } catch {
      console.error('Failed to fetch patients list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search, page]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this patient records? This will delete all clinical history, visits, invoices, and dental charts for this patient.')) {
      try {
        await api.delete(`/patients/${id}`);
        fetchPatients();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to delete patient');
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-slate-800">Patients Registry</h1>
          <p className="text-xs text-slate-500 mt-1">Search and manage all clinical patient profiles.</p>
        </div>
        <button
          onClick={() => navigate('/clinic/patients/new')}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/10 flex items-center gap-1.5 transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus size={14} />
          Register Patient
        </button>
      </div>

      {/* Control filters */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm shadow-blue-100/20 flex items-center max-w-md w-full">
        <span className="text-slate-400 mr-2">
          <Search size={18} />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, phone, or DC patient number..."
          className="w-full text-sm focus:outline-none bg-transparent text-slate-700"
        />
      </div>

      {/* Table grid */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden shadow-blue-100/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Patient ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4">Age / DOB</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-center">Dental Chart</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm text-slate-600">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-12"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                    <td className="py-4 px-4 text-center"><div className="h-7 bg-slate-100 rounded w-20 mx-auto"></div></td>
                    <td className="py-4 px-4 text-right"><div className="h-8 bg-slate-100 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <User size={36} className="mx-auto text-slate-200 mb-2" />
                    No patient registry records found matching details.
                  </td>
                </tr>
              ) : (
                patients.map((p) => {
                  const age = p.dob ? new Date().getFullYear() - new Date(p.dob).getFullYear() : 'N/A';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-blue-600 text-xs tracking-wider">{p.patientNumber}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{p.name}</td>
                      <td className="py-3.5 px-4">{p.phone}</td>
                      <td className="py-3.5 px-4 text-xs font-semibold">{p.gender || '—'}</td>
                      <td className="py-3.5 px-4">
                        {p.dob ? (
                          <span>
                            {age} Years <span className="text-[10px] text-slate-400">({new Date(p.dob).toLocaleDateString()})</span>
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>

                      {/* Dedicated Dental Chart Column with View Icon */}
                      <td className="py-3.5 px-4 text-center">
                        <Link
                          to={`/clinic/patients/${p.id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-100/80 shadow-sm transition-all active:scale-95"
                          title="View Dental Chart & Profile"
                        >
                          <Eye size={14} />
                          <span>View Chart</span>
                        </Link>
                      </td>

                      {/* Actions Column */}
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <Link
                          to={`/clinic/patients/${p.id}/edit`}
                          className="inline-flex p-1.5 rounded-lg border border-slate-100 text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Edit Patient Details"
                        >
                          <Edit size={14} />
                        </Link>
                        {hasPermission('settings') && (
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="inline-flex p-1.5 rounded-lg border border-slate-100 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Patient Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-300 rounded-lg transition-colors flex items-center gap-1"
              >
                <ArrowLeft size={12} /> Prev
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-300 rounded-lg transition-colors flex items-center gap-1"
              >
                Next <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
