import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Check, ChevronRight, Activity, ClipboardList } from 'lucide-react';

export const TreatmentPlansPage: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Form Modal States
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [planName, setPlanName] = useState('');
  const [treatments, setTreatments] = useState<any[]>([]);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState('');
  const [selectedTeeth, setSelectedTeeth] = useState<string>('');
  const [stageName, setStageName] = useState('Phase 1');
  const [addedItems, setAddedItems] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchPatientsAndCatalog = async () => {
    try {
      const [patRes, treatRes] = await Promise.all([
        api.get('/patients?limit=50'),
        api.get('/treatments'),
      ]);
      setPatients(patRes.data.patients || []);
      setTreatments(treatRes.data || []);
    } catch {
      console.error('Failed to load patient lists');
    }
  };

  useEffect(() => {
    fetchPatientsAndCatalog();
  }, []);

  const loadPatientPlans = async (patId: string) => {
    if (!patId) {
      setPlans([]);
      return;
    }
    try {
      setLoadingPlans(true);
      const res = await api.get(`/treatment-plans/patient/${patId}`);
      setPlans(res.data);
    } catch {
      console.error('Failed to load treatment plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const handlePatientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedPatientId(val);
    loadPatientPlans(val);
  };

  const handleAddItem = () => {
    const treat = treatments.find((t) => t.id === selectedTreatmentId);
    if (!treat) return;

    const toothNumbers = selectedTeeth
      .split(',')
      .map((t) => parseInt(t.trim()))
      .filter((num) => !isNaN(num));

    setAddedItems([
      ...addedItems,
      {
        treatmentName: treat.name,
        toothNumbers,
        cost: treat.defaultCost,
        discount: 0,
        status: 'Pending',
      },
    ]);
    setSelectedTreatmentId('');
    setSelectedTeeth('');
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !planName || addedItems.length === 0) return;
    setSubmitting(true);

    try {
      const payload = {
        patientId: selectedPatientId,
        name: planName,
        status: 'Active',
        stages: [
          {
            name: stageName,
            order: 1,
            items: addedItems,
          },
        ],
      };

      await api.post('/treatment-plans', payload);
      setShowAddPlan(false);
      setPlanName('');
      setAddedItems([]);
      loadPatientPlans(selectedPatientId);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateItemStatus = async (itemId: string, newStatus: string) => {
    try {
      await api.put(`/treatment-plans/item/${itemId}`, { status: newStatus });
      loadPatientPlans(selectedPatientId);
    } catch {
      alert('Failed to update status');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-slate-800 font-bold">Treatment Plans</h1>
          <p className="text-xs text-slate-500 mt-1">Design stages and coordinate clinical procedures.</p>
        </div>
        {selectedPatientId && (
          <button
            onClick={() => setShowAddPlan(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <Plus size={14} /> Create Plan
          </button>
        )}
      </div>

      {/* Select Patient Dropdown */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm shadow-blue-100/20 max-w-md">
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Select Patient Profile</label>
        <select
          value={selectedPatientId}
          onChange={handlePatientChange}
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
        >
          <option value="">Choose Patient...</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.patientNumber})
            </option>
          ))}
        </select>
      </div>

      {/* Plans List */}
      {!selectedPatientId ? (
        <div className="bg-slate-50/50 border border-dashed border-slate-200 p-12 rounded-2xl text-center text-slate-400 text-sm">
          Please select a patient above to view or manage treatment plans.
        </div>
      ) : loadingPlans ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white border border-slate-100 p-12 rounded-2xl text-center text-slate-400 text-sm shadow-sm shadow-blue-100/10">
          <Activity size={32} className="mx-auto text-slate-200 mb-2" />
          No treatment plans recorded for this patient.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm shadow-blue-100/25 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div>
                  <h3 className="font-heading font-bold text-slate-800 text-base">{plan.name}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Status: {plan.status}</p>
                </div>
                <span className="text-xs text-slate-400">Created: {new Date(plan.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Stages */}
              <div className="space-y-4">
                {plan.stages.map((stage: any) => (
                  <div key={stage.id} className="space-y-2">
                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50/50 inline-block px-2.5 py-1 rounded-lg border border-blue-100/30">
                      {stage.name}
                    </h4>

                    {/* Stage Items */}
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold">
                            <th className="py-2 px-3">Procedure</th>
                            <th className="py-2 px-3">Target Teeth</th>
                            <th className="py-2 px-3">Price (INR)</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-600">
                          {stage.items.map((item: any) => (
                            <tr key={item.id} className="hover:bg-slate-50/20">
                              <td className="py-2.5 px-3 font-semibold text-slate-700">{item.treatmentName}</td>
                              <td className="py-2.5 px-3 text-slate-400 font-mono">
                                {item.toothNumbers.length === 0 ? 'General' : item.toothNumbers.join(', ')}
                              </td>
                              <td className="py-2.5 px-3 font-semibold">₹{item.cost.toLocaleString('en-IN')}</td>
                              <td className="py-2.5 px-3">
                                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                                  item.status === 'Completed'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {item.status !== 'Completed' ? (
                                  <button
                                    onClick={() => handleUpdateItemStatus(item.id, 'Completed')}
                                    className="px-2 py-1 text-[9px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-0.5 ml-auto shadow-sm"
                                  >
                                    <Check size={10} /> Done
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-semibold italic">Completed</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PLAN CREATION MODAL */}
      {showAddPlan && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form
            onSubmit={handleCreatePlan}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-100 flex flex-col gap-4 animate-scale-up max-h-[90vh] overflow-y-auto"
          >
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="font-heading font-bold text-slate-800">Draft Treatment Plan</h3>
              <button
                type="button"
                onClick={() => setShowAddPlan(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Plan Name *</label>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="e.g. RCT & Crown Plan"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Staging Label</label>
              <input
                type="text"
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                placeholder="e.g. Phase 1 - Endodontic"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
              />
            </div>

            {/* Add Items block */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-2.5">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Configure Procedure Items</p>
              <div>
                <select
                  value={selectedTreatmentId}
                  onChange={(e) => setSelectedTreatmentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                >
                  <option value="">Select Procedure...</option>
                  {treatments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (₹{t.defaultCost})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={selectedTeeth}
                  onChange={(e) => setSelectedTeeth(e.target.value)}
                  placeholder="Target Teeth (e.g. 14, 15 - blank if general)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-4 py-2 text-xs font-bold text-blue-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Draft list summary */}
            {addedItems.length > 0 && (
              <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-500">
                      <th className="py-2 px-3">Procedure</th>
                      <th className="py-2 px-3">Teeth</th>
                      <th className="py-2 px-3">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-600">
                    {addedItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-semibold">{item.treatmentName}</td>
                        <td className="py-2 px-3 font-mono">{item.toothNumbers.join(', ') || '—'}</td>
                        <td className="py-2 px-3">₹{item.cost.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || addedItems.length === 0}
              className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-md transition-colors"
            >
              {submitting ? 'Creating Plan...' : 'Finalize and Save Plan'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
