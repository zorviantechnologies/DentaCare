import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash2, ClipboardList } from 'lucide-react';

interface Treatment {
  id: string;
  category: string;
  name: string;
  description: string | null;
  defaultCost: number;
  isActive: boolean;
}

export const TreatmentsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modal States
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Treatment | null>(null);
  
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchTreatments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/treatments');
      setTreatments(res.data);
    } catch {
      console.error('Failed to load treatments catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreatments();
  }, []);

  const handleOpenAdd = () => {
    setSelectedItem(null);
    setCategory('');
    setName('');
    setDescription('');
    setCost(0);
    setShowModal(true);
  };

  const handleOpenEdit = (item: Treatment) => {
    setSelectedItem(item);
    setCategory(item.category);
    setName(item.name);
    setDescription(item.description || '');
    setCost(item.defaultCost);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !name || cost < 0) return;
    setSubmitting(true);

    const payload = {
      category,
      name,
      description: description || null,
      defaultCost: Number(cost),
    };

    try {
      if (selectedItem) {
        await api.put(`/treatments/${selectedItem.id}`, payload);
      } else {
        await api.post('/treatments', payload);
      }
      setShowModal(false);
      fetchTreatments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save treatment item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item from the catalog?')) {
      try {
        await api.delete(`/treatments/${id}`);
        fetchTreatments();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to delete item');
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-slate-800 font-bold">Treatments Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">Configure standard procedures and billing templates.</p>
        </div>
        {hasPermission('settings') && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <Plus size={14} /> Add Item
          </button>
        )}
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="min-h-[30vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : treatments.length === 0 ? (
        <div className="bg-white border border-slate-100 p-12 rounded-2xl text-center text-slate-400">
          <ClipboardList size={36} className="mx-auto text-slate-200 mb-2" />
          No procedures cataloged in database yet.
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm shadow-blue-100/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Procedure Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Base Cost</th>
                  {hasPermission('settings') && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600">
                {treatments.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-xs font-bold bg-blue-50/30 text-blue-600 rounded-lg inline-block m-2">
                      {t.category}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{t.name}</td>
                    <td className="py-3 px-4 text-xs text-slate-400 truncate max-w-xs">{t.description || '—'}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">₹{t.defaultCost.toLocaleString('en-IN')}</td>
                    {hasPermission('settings') && (
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="inline-flex p-1.5 rounded-lg border border-slate-100 text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="inline-flex p-1.5 rounded-lg border border-slate-100 text-slate-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
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
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 border border-slate-100 flex flex-col gap-4 animate-scale-up"
          >
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="font-heading font-bold text-slate-800">
                {selectedItem ? 'Edit Procedure Details' : 'Add Procedure Item'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category *</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Endodontics, Implants"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Procedure Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Root Canal Treatment (RCT)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Base Price (INR) *</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                min={0}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Brief Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="e.g. Includes cavity access and obturation..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-md transition-colors"
            >
              {submitting ? 'Saving changes...' : 'Save Catalog Item'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
