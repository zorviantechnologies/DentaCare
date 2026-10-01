import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Check, Clock, Trash2, RefreshCw } from 'lucide-react';

interface Recall {
  id: string;
  recallType: string;
  dueDate: string;
  status: string;
  notes: string | null;
  patient: {
    id: string;
    name: string;
    phone: string;
    patientNumber: string;
  };
}

export const RecallsPage: React.FC = () => {
  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [recallType, setRecallType] = useState('ROUTINE_CHECKUP');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRecallsAndPatients = async () => {
    try {
      setLoading(true);
      const [recallRes, patientRes] = await Promise.all([
        api.get('/recalls'),
        api.get('/patients?limit=50'),
      ]);
      setRecalls(recallRes.data);
      setPatients(patientRes.data.patients || []);
    } catch {
      console.error('Failed to load recalls logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecallsAndPatients();
  }, []);

  const handleCreateRecall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !dueDate) return;
    setSubmitting(true);

    try {
      await api.post('/recalls', {
        patientId,
        recallType,
        dueDate,
        notes: notes || null,
        status: 'Pending',
      });
      setShowModal(false);
      setPatientId('');
      setNotes('');
      setDueDate('');
      fetchRecallsAndPatients();
    } catch {
      alert('Failed to save recall entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Pending' ? 'Contacted' : currentStatus === 'Contacted' ? 'Scheduled' : 'Pending';
    try {
      await api.put(`/recalls/${id}`, { status: nextStatus });
      fetchRecallsAndPatients();
    } catch {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this recall record?')) {
      try {
        await api.delete(`/recalls/${id}`);
        fetchRecallsAndPatients();
      } catch {
        alert('Failed to delete recall entry');
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-slate-800 font-bold">Recalls Tracker</h1>
          <p className="text-xs text-slate-500 mt-1">Monitor routine cleaning cycles, checkups, and follow-up schedules.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus size={14} /> Add Recall Entry
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="min-h-[30vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : recalls.length === 0 ? (
        <div className="bg-white border border-slate-100 p-12 rounded-2xl text-center text-slate-400">
          <RefreshCw size={36} className="mx-auto text-slate-200 mb-2 animate-spin-slow" />
          No patient recall alerts pending.
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm shadow-blue-100/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Patient ID</th>
                  <th className="py-3 px-4">Recall Type</th>
                  <th className="py-3 px-4">Recall Date</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600">
                {recalls.map((recall) => (
                  <tr key={recall.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-800">{recall.patient.name}</td>
                    <td className="py-3 px-4 font-bold text-blue-600 text-xs">{recall.patient.patientNumber}</td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-500">
                      {recall.recallType.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {new Date(recall.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400 max-w-xs truncate">{recall.notes || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                        recall.status === 'Scheduled' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : recall.status === 'Contacted' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>
                        {recall.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleUpdateStatus(recall.id, recall.status)}
                        className="px-2 py-1 text-[9px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg shadow-sm"
                      >
                        Flow Status
                      </button>
                      <button
                        onClick={() => handleDelete(recall.id)}
                        className="inline-flex p-1.5 rounded-lg border border-slate-100 text-slate-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreateRecall}
            className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 border border-slate-100 flex flex-col gap-4 animate-scale-up"
          >
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="font-heading font-bold text-slate-800">Add Recall Entry</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Select Patient *</label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                required
              >
                <option value="">Choose Patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.patientNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Recall Type</label>
              <select
                value={recallType}
                onChange={(e) => setRecallType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
              >
                <option value="ROUTINE_CHECKUP">Routine Checkup</option>
                <option value="CLEANING">Dental Cleaning</option>
                <option value="FOLLOW_UP">Follow Up Consultation</option>
                <option value="ORTHODONTIC_REVIEW">Orthodontic Review</option>
                <option value="PERIODONTAL_REVIEW">Periodontal Review</option>
                <option value="IMPLANT_REVIEW">Implant Review</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks / Recall Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Schedule scaling and checkup..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-md transition-colors"
            >
              {submitting ? 'Adding entry...' : 'Confirm Recall Schedule'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
