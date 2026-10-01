import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash2, Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  condition: string | null;
  supplier: string | null;
  quantity: number;
  minQuantityAlert: number;
  expiryDate: string | null;
}

export const InventoryPage: React.FC = () => {
  const { hasPermission } = useAuth();
  
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [alertOnly, setAlertOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form Modal States
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Consumables');
  const [condition, setCondition] = useState('New');
  const [supplier, setSupplier] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [minAlert, setMinAlert] = useState(5);
  const [expiry, setExpiry] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory', {
        params: { alertOnly: alertOnly.toString() },
      });
      setItems(res.data);
    } catch {
      console.error('Failed to load inventory stock');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [alertOnly]);

  const handleOpenAdd = () => {
    setSelectedItem(null);
    setName('');
    setCategory('Consumables');
    setCondition('New');
    setSupplier('');
    setQuantity(0);
    setMinAlert(5);
    setExpiry('');
    setShowModal(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setName(item.name);
    setCategory(item.category);
    setCondition(item.condition || 'New');
    setSupplier(item.supplier || '');
    setQuantity(item.quantity);
    setMinAlert(item.minQuantityAlert);
    setExpiry(item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || quantity < 0) return;
    setSubmitting(true);

    const payload = {
      name,
      category,
      condition: category === 'Equipment' ? condition : null,
      supplier: supplier || null,
      quantity: Number(quantity),
      minQuantityAlert: Number(minAlert),
      expiryDate: expiry || null,
    };

    try {
      if (selectedItem) {
        await api.put(`/inventory/${selectedItem.id}`, payload);
      } else {
        await api.post('/inventory', payload);
      }
      setShowModal(false);
      fetchInventory();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save inventory item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this item from the inventory?')) {
      try {
        await api.delete(`/inventory/${id}`);
        fetchInventory();
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
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-slate-800 font-bold">Inventory Stock</h1>
          <p className="text-xs text-slate-500 mt-1">Track clinical materials, equipment servicing, and drug stocks.</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          {/* Toggle reorder alerts */}
          <button
            onClick={() => setAlertOnly(!alertOnly)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
              alertOnly
                ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Show low stock alerts
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
          >
            <Plus size={14} /> Add Stock
          </button>
        </div>
      </div>

      {/* Grid Stock items */}
      {loading ? (
        <div className="min-h-[30vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-100 p-12 rounded-2xl text-center text-slate-400">
          <Package size={36} className="mx-auto text-slate-200 mb-2" />
          No items found in inventory stock logs.
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm shadow-blue-100/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">Remaining Qty</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Status Alert</th>
                  {hasPermission('settings') && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600">
                {items.map((item) => {
                  const isLow = item.quantity <= item.minQuantityAlert;
                  const isExpired = item.expiryDate && new Date(item.expiryDate).getTime() < Date.now();
                  const isNearExpiry = item.expiryDate && new Date(item.expiryDate).getTime() < Date.now() + 30 * 24 * 60 * 60 * 1000 && !isExpired;

                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/50 ${isExpired ? 'bg-red-50/10' : isLow ? 'bg-amber-50/10' : ''}`}>
                      <td className="py-3 px-4 font-semibold text-slate-800">{item.name}</td>
                      <td className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">{item.category}</td>
                      <td className="py-3 px-4 text-xs text-slate-400">
                        {item.category === 'Equipment' ? `Cond: ${item.condition || 'New'}` : `Supplier: ${item.supplier || '—'}`}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">{item.quantity} Units</td>
                      <td className="py-3 px-4 text-xs">
                        {item.expiryDate ? (
                          <span className={`${isExpired ? 'text-red-600 font-bold' : isNearExpiry ? 'text-amber-600 font-semibold' : 'text-slate-500'}`}>
                            {new Date(item.expiryDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">No Expiration</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {isExpired ? (
                          <span className="px-2 py-0.5 bg-red-50 border border-red-100 text-red-700 font-bold rounded-lg flex items-center gap-1.5 w-max">
                            <AlertTriangle size={12} /> Expired
                          </span>
                        ) : isNearExpiry ? (
                          <span className="px-2 py-0.5 bg-amber-50 border border-amber-100 text-amber-700 font-semibold rounded-lg flex items-center gap-1.5 w-max">
                            <Clock size={12} /> Expiring soon
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 bg-amber-50 border border-amber-100 text-amber-700 font-semibold rounded-lg flex items-center gap-1.5 w-max">
                            <AlertTriangle size={12} /> Low stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold rounded-lg flex items-center gap-1.5 w-max">
                            <CheckCircle size={12} /> Adequate
                          </span>
                        )}
                      </td>
                      {hasPermission('settings') && (
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="inline-flex p-1.5 rounded-lg border border-slate-100 text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="inline-flex p-1.5 rounded-lg border border-slate-100 text-slate-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
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
                {selectedItem ? 'Edit Stock item' : 'Add Stock Item'}
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
              <label className="block text-xs font-semibold text-slate-600 mb-1">Item Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Disposable Mouth Mirrors"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                >
                  <option value="Consumables">Consumables</option>
                  <option value="Material">Material</option>
                  <option value="Medicine">Medicine</option>
                  <option value="Equipment">Equipment</option>
                </select>
              </div>
              {category === 'Equipment' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good Condition</option>
                    <option value="Needs Repair">Needs Servicing</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Supplier Name</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="e.g. Apex Biotech"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Current Stock Qty *</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Safety Alert Qty</label>
                <input
                  type="number"
                  value={minAlert}
                  onChange={(e) => setMinAlert(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>
            </div>

            {category !== 'Equipment' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Expiration Date</label>
                <input
                  type="date"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-md transition-colors"
            >
              {submitting ? 'Saving stock details...' : 'Save Stock Record'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
