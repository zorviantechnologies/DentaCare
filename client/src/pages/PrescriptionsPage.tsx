import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Printer, FileText, Search, Plus, Trash2, X, CheckCircle2, Pill } from 'lucide-react';

interface MedicineItem {
  medicineName: string;
  dosage: string;
  durationDays: number;
  instructions: string;
}

export const PrescriptionsPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState(new Date().toISOString().split('T')[0]);
  const [doctorSignature, setDoctorSignature] = useState(currentUser?.name || 'Dr. Ramesh Sharma');
  const [chiefComplaint, setChiefComplaint] = useState('Dental Examination & Prescription');
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Prescription Items
  const [items, setItems] = useState<MedicineItem[]>([
    { medicineName: 'Amoxicillin 500mg', dosage: '1-0-1', durationDays: 5, instructions: 'After meals' },
    { medicineName: 'Paracetamol 650mg', dosage: '1-0-1', durationDays: 3, instructions: 'When required for pain' },
  ]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/patients?limit=100');
      const patientList = res.data.patients || [];
      setPatients(patientList);

      const list: any[] = [];
      for (const p of patientList) {
        const detail = await api.get(`/patients/${p.id}`);
        const patientData = detail.data;
        if (patientData.visits) {
          patientData.visits.forEach((v: any) => {
            if (v.prescription) {
              list.push({
                ...v.prescription,
                patientId: patientData.id,
                patientName: patientData.name,
                patientNumber: patientData.patientNumber,
                gender: patientData.gender,
                age: patientData.dob ? new Date().getFullYear() - new Date(patientData.dob).getFullYear() : null,
                chiefComplaint: v.chiefComplaint,
                date: v.createdAt || v.date,
              });
            }
          });
        }
      }

      // Sort by date descending
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPrescriptions(list);
    } catch (err) {
      console.error('Failed to load prescriptions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const handleAddMedicine = () => {
    setItems([...items, { medicineName: '', dosage: '1-0-1', durationDays: 5, instructions: 'After meals' }]);
  };

  const handleRemoveMedicine = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof MedicineItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert('Please select a patient.');
      return;
    }
    const validItems = items.filter((item) => item.medicineName.trim().length > 0);
    if (validItems.length === 0) {
      alert('Please add at least one valid medicine.');
      return;
    }

    try {
      setSaving(true);
      await api.post('/visits', {
        patientId: selectedPatientId,
        chiefComplaint: chiefComplaint || 'Clinical Prescription',
        clinicalNotes: clinicalNotes || 'Prescription issued from Prescriptions tab',
        prescription: {
          doctorSignature: doctorSignature || currentUser?.name || 'Dr. Ramesh Sharma',
          items: validItems.map((item) => ({
            medicineName: item.medicineName,
            dosage: item.dosage,
            durationDays: Number(item.durationDays) || 1,
            instructions: item.instructions,
          })),
        },
      });

      setShowModal(false);
      // Reset form
      setSelectedPatientId('');
      setChiefComplaint('Dental Examination & Prescription');
      setClinicalNotes('');
      setItems([
        { medicineName: 'Amoxicillin 500mg', dosage: '1-0-1', durationDays: 5, instructions: 'After meals' },
      ]);
      await fetchPrescriptions();
    } catch (err: any) {
      console.error('Failed to create prescription', err);
      alert(err.response?.data?.error || 'Failed to create prescription');
    } finally {
      setSaving(false);
    }
  };

  const triggerPrint = (rx: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = (rx.items || [])
      .map(
        (item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #1e293b;">${item.medicineName}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #334155;">${item.dosage}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #334155;">${item.durationDays} Days</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-style: italic; color: #64748b;">${item.instructions || '—'}</td>
      </tr>`
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Prescription - ${rx.patientName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 40px; }
            .header { border-bottom: 3px solid #2563eb; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
            .clinic-title { font-size: 26px; font-weight: bold; color: #1e40af; }
            .clinic-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
            .patient-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; font-size: 14px; margin-bottom: 25px; }
            .patient-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 35px; }
            th { text-align: left; background: #2563eb; color: white; padding: 12px 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
            .signature { float: right; margin-top: 40px; text-align: center; font-size: 13px; color: #334155; }
            .sig-line { width: 220px; border-top: 1.5px solid #475569; margin-top: 45px; padding-top: 6px; font-weight: bold; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <div>
              <div class="clinic-title">${currentUser?.clinicName || 'DentaCare Clinic'}</div>
              <div class="clinic-sub">Professional Dental Care & Healthcare Services</div>
            </div>
            <div style="text-align: right; font-size: 12px; color: #64748b;">
              Rx ID: RX-${rx.id ? rx.id.substring(0, 8) : 'NEW'}<br/>
              Date: ${new Date(rx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>

          <h3 style="font-size: 18px; color: #1e3a8a; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">Medical Prescription</h3>

          <div class="patient-card">
            <div class="patient-grid">
              <div><strong>Patient Name:</strong> ${rx.patientName}</div>
              <div><strong>Patient ID:</strong> ${rx.patientNumber}</div>
              <div><strong>Gender / Age:</strong> ${rx.gender || 'N/A'} ${rx.age ? `(${rx.age} yrs)` : ''}</div>
              <div><strong>Complaint:</strong> ${rx.chiefComplaint || 'Routine Checkup'}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Dosage Pattern</th>
                <th>Duration</th>
                <th>Instructions</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="signature">
            <div class="sig-line">${rx.doctorSignature || currentUser?.name || 'Dr. Ramesh Sharma'}</div>
            <span style="font-size: 11px; color: #94a3b8;">Dental Surgeon / Clinician</span>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filtered = prescriptions.filter(
    (rx) =>
      rx.patientName.toLowerCase().includes(search.toLowerCase()) ||
      rx.patientNumber.toLowerCase().includes(search.toLowerCase()) ||
      (rx.items && rx.items.some((i: any) => i.medicineName.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Add Button */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-slate-800">Prescriptions Hub</h1>
          <p className="text-xs text-slate-500 mt-1">Issue, manage, and print full digital prescriptions for all clinic patients.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-95 shrink-0 self-start sm:self-auto"
        >
          <Plus size={16} /> Add Prescription
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <span className="text-slate-400 pl-1">
          <Search size={18} />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by patient name, ID, or medicine..."
          className="w-full text-sm focus:outline-none bg-transparent text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* Full-Page Prescriptions List / Table Cards */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center bg-white border border-slate-200 rounded-2xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-medium">Loading clinic prescriptions...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 rounded-2xl text-center text-slate-400 flex flex-col items-center gap-3">
          <FileText size={42} className="text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">No prescriptions found</p>
          <p className="text-xs text-slate-400 max-w-sm">Click "+ Add Prescription" above to create and print a prescription for any patient.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((rx, idx) => (
            <div key={rx.id || idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
              {/* Top Row: Patient Info & Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm shrink-0">
                    {rx.patientName ? rx.patientName.substring(0, 2).toUpperCase() : 'PT'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-bold text-slate-800 text-base">{rx.patientName}</h3>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {rx.patientNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Date: <span className="font-medium text-slate-600">{new Date(rx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span> &bull; Dr. {rx.doctorSignature || 'Ramesh Sharma'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => triggerPrint(rx)}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/60 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shrink-0 self-start sm:self-auto"
                >
                  <Printer size={15} /> Print Prescription
                </button>
              </div>

              {/* Medicines Table (Full Width) */}
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Medicine Name</th>
                      <th className="p-3">Dosage Pattern</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rx.items && rx.items.length > 0 ? (
                      rx.items.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                            <Pill size={14} className="text-blue-500" />
                            {item.medicineName}
                          </td>
                          <td className="p-3 font-medium text-slate-700">{item.dosage}</td>
                          <td className="p-3 font-semibold text-slate-600">{item.durationDays} Days</td>
                          <td className="p-3 text-slate-500 italic">{item.instructions || '—'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-3 text-center text-slate-400 italic">No medicine items recorded</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE PRESCRIPTION MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText size={20} />
                <h2 className="font-heading font-bold text-lg">Create New Prescription</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreatePrescription} className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
              {/* Select Patient & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Select Patient <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.patientNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Prescription Date
                  </label>
                  <input
                    type="date"
                    value={prescriptionDate}
                    onChange={(e) => setPrescriptionDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                  />
                </div>
              </div>

              {/* Doctor Signature & Complaints */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Doctor Signature / Name
                  </label>
                  <input
                    type="text"
                    value={doctorSignature}
                    onChange={(e) => setDoctorSignature(e.target.value)}
                    placeholder="e.g. Dr. Ramesh Sharma"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Chief Complaint / Diagnosis
                  </label>
                  <input
                    type="text"
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder="e.g. Toothache, Scaling, Root Canal"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                  />
                </div>
              </div>

              {/* Prescription Items (Medications) Section */}
              <div className="border-t border-slate-100 pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Pill size={15} className="text-blue-600" /> Prescribed Medicines ({items.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddMedicine}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Medicine
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col gap-2 relative">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicine(index)}
                          className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1"
                          title="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pr-6 sm:pr-0">
                        <div className="sm:col-span-5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Medicine Name</label>
                          <input
                            type="text"
                            value={item.medicineName}
                            onChange={(e) => handleItemChange(index, 'medicineName', e.target.value)}
                            placeholder="e.g. Amoxicillin 500mg"
                            required
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-medium"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Dosage</label>
                          <input
                            type="text"
                            value={item.dosage}
                            onChange={(e) => handleItemChange(index, 'dosage', e.target.value)}
                            placeholder="e.g. 1-0-1"
                            required
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-medium"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Days</label>
                          <input
                            type="number"
                            min="1"
                            value={item.durationDays}
                            onChange={(e) => handleItemChange(index, 'durationDays', Number(e.target.value))}
                            required
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-medium"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Instructions</label>
                          <input
                            type="text"
                            value={item.instructions}
                            onChange={(e) => handleItemChange(index, 'instructions', e.target.value)}
                            placeholder="After meals"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? (
                    'Saving...'
                  ) : (
                    <>
                      <CheckCircle2 size={15} /> Save & Issue Prescription
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
