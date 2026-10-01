import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FdiDentalChart } from '../components/FdiDentalChart';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldAlert, 
  Calendar, 
  Receipt, 
  Plus, 
  Printer, 
  Eye, 
  CheckCircle,
  Clock,
  Heart,
  ChevronRight,
  FilePlus,
  IndianRupee,
  FileText
} from 'lucide-react';

export const PatientProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chart' | 'visits' | 'billing' | 'imaging'>('chart');
  
  // Custom modals/forms
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<any>(null);
  
  // Visit Form States
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [addPrescription, setAddPrescription] = useState(false);
  const [meds, setMeds] = useState<any[]>([]);
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('1-0-1');
  const [duration, setDuration] = useState(5);
  const [instructions, setInstructions] = useState('After food');
  const [submittingVisit, setSubmittingVisit] = useState(false);

  // Payment Form States
  const [payAmount, setPayAmount] = useState(0);
  const [payMode, setPayMode] = useState<'CASH' | 'UPI' | 'CARD' | 'CHEQUE' | 'NET_BANKING'>('UPI');
  const [payRef, setPayRef] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/patients/${id}`);
      setPatient(response.data);
    } catch {
      console.error('Failed to load patient profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const handleUpdateTooth = async (toothNumber: number, status: string, notes: string, surfaces?: any[]) => {
    try {
      await api.post(`/patients/${id}/tooth-history`, {
        toothNumber,
        status,
        notes,
        surfaces: surfaces ?? [],
      });
      fetchPatientData(); // reload tooth records
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update tooth');
      throw err;
    }
  };

  const addMed = () => {
    if (!medName) return;
    setMeds([...meds, { medicineName: medName, dosage, durationDays: Number(duration), instructions }]);
    setMedName('');
    setInstructions('After food');
  };

  const removeMed = (idx: number) => {
    setMeds(meds.filter((_, i) => i !== idx));
  };

  const handleAddVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chiefComplaint) return;
    setSubmittingVisit(true);

    try {
      const visitPayload: any = {
        patientId: id,
        chiefComplaint,
        diagnosis,
        clinicalNotes,
      };

      if (addPrescription && meds.length > 0) {
        visitPayload.prescription = {
          doctorSignature: currentUser?.name || 'Authorized Signature',
          items: meds,
        };
      }

      await api.post('/visits', visitPayload);
      setShowVisitModal(false);
      // Reset form states
      setChiefComplaint('');
      setDiagnosis('');
      setClinicalNotes('');
      setAddPrescription(false);
      setMeds([]);
      fetchPatientData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save visit record');
    } finally {
      setSubmittingVisit(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;
    setSubmittingPayment(true);

    try {
      await api.post('/payments', {
        invoiceId: showPaymentModal.id,
        amount: Number(payAmount),
        paymentMode: payMode,
        referenceNumber: payRef,
      });
      setShowPaymentModal(null);
      setPayAmount(0);
      setPayRef('');
      fetchPatientData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const triggerPrescriptionPrint = (prescription: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = prescription.items
      .map(
        (item: any) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: 600;">${item.medicineName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.dosage}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.durationDays} Days</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; font-style: italic;">${item.instructions || '—'}</td>
      </tr>`
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Prescription - ${patient.name}</title>
          <style>
            body { font-family: 'Helvetica Neue', sans-serif; color: #333; margin: 40px; }
            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .clinic-title { font-size: 24px; font-weight: bold; color: #1e3a8a; }
            .patient-details { background: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 14px; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { text-align: left; background: #3b82f6; color: white; padding: 10px; }
            .signature { float: right; margin-top: 50px; text-align: center; font-size: 14px; }
            .sig-line { width: 200px; border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <div class="clinic-title">${currentUser?.clinicName}</div>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">Delhi Office &bull; Ph: 98765 43210</div>
          </div>
          <h3>Clinical Prescription</h3>
          <div class="patient-details">
            <strong>Patient Name:</strong> ${patient.name} &bull; <strong>Patient Number:</strong> ${patient.patientNumber} <br/>
            <strong>Gender/Age:</strong> ${patient.gender || '—'} / ${patient.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : '—'} YRS &bull; <strong>Date:</strong> ${new Date(prescription.createdAt).toLocaleDateString()}
          </div>
          <table>
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Dosage Pattern</th>
                <th>Duration</th>
                <th>Special Instructions</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="signature">
            <div class="sig-line">Doctor Signature</div>
            <strong>${prescription.doctorSignature}</strong>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-sm">Patient profile not found.</p>
        <Link to="/clinic/patients" className="text-blue-600 font-semibold hover:underline mt-2 inline-block">
          Go back to Patients Registry
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* LEFT COLUMN: Patient Info */}
      <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm shadow-blue-100/30 flex flex-col gap-5 self-start">
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center font-heading font-bold text-blue-700 text-lg">
            {patient.name.split(' ').map((n: any) => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="font-heading font-bold text-slate-800 leading-snug">{patient.name}</h2>
            <p className="text-xs text-blue-600 font-bold tracking-wider uppercase">{patient.patientNumber}</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-3 border-b border-slate-100 pb-4 text-xs text-slate-600">
          <p className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {patient.phone}</p>
          {patient.email && <p className="flex items-center gap-2"><Mail size={14} className="text-slate-400" /> {patient.email}</p>}
          {patient.address && <p className="flex items-start gap-2"><MapPin size={14} className="text-slate-400 mt-0.5" /> {patient.address}</p>}
        </div>

        {/* Medical History */}
        <div className="border-b border-slate-100 pb-4 space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Medical History</h4>
          {patient.medicalHistory.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No medical history recorded</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {patient.medicalHistory.map((item: string) => (
                <span key={item} className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 text-[10px] font-semibold rounded-lg flex items-center gap-1">
                  <ShieldAlert size={10} />
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Allergies */}
        <div className="border-b border-slate-100 pb-4 space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Allergies</h4>
          {patient.allergies.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No allergies recorded</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {patient.allergies.map((item: string) => (
                <span key={item} className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-semibold rounded-lg flex items-center gap-1">
                  <ShieldAlert size={10} />
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => setShowVisitModal(true)}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 transition-all"
          >
            <FilePlus size={14} /> Record Visit
          </button>
          <button
            onClick={() => navigate(`/clinic/billing`)}
            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <Receipt size={14} /> Generate Invoice
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Tabs (Chart, Visits, Invoices) */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        
        {/* Navigation Tabs */}
        <div className="flex border border-slate-200 rounded-2xl p-1 bg-white shadow-sm max-w-md">
          {([
            { id: 'chart', label: 'Dental Chart' },
            { id: 'visits', label: 'Visits & Rx' },
            { id: 'billing', label: 'Invoices' },
            { id: 'imaging', label: 'Imaging' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}
        
        {/* Dental Chart Tab */}
        {activeTab === 'chart' && (
          <FdiDentalChart
            toothHistory={patient.toothHistory || []}
            onUpdateTooth={handleUpdateTooth}
          />
        )}

        {/* Clinical Visits Tab */}
        {activeTab === 'visits' && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm shadow-blue-100/30 flex flex-col gap-5">
            <h3 className="font-heading font-bold text-slate-800 text-lg">Visits Timeline & Notes</h3>
            {patient.visits.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No clinical visits recorded for this patient yet.
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-100 pl-6 ml-3 space-y-8">
                {patient.visits.map((v: any) => (
                  <div key={v.id} className="relative">
                    {/* Circle icon on timeline */}
                    <span className="absolute -left-[31px] top-0.5 w-4.5 h-4.5 rounded-full bg-blue-500 border-4 border-white shadow"></span>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">
                          {new Date(v.date).toLocaleDateString()} &bull; {new Date(v.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="bg-slate-50/50 border border-slate-100 p-4.5 rounded-2xl flex flex-col gap-3 shadow-sm">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Chief Complaint</p>
                          <p className="text-sm font-semibold text-slate-800 mt-0.5">{v.chiefComplaint}</p>
                        </div>
                        {v.diagnosis && (
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Diagnosis</p>
                            <p className="text-xs font-medium text-slate-700 mt-0.5">{v.diagnosis}</p>
                          </div>
                        )}
                        {v.clinicalNotes && (
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Treatment Notes</p>
                            <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{v.clinicalNotes}</p>
                          </div>
                        )}

                        {/* Prescription print trigger */}
                        {v.prescription && (
                          <div className="border-t border-slate-100 pt-3 mt-1 flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                              <FileText size={14} className="text-blue-500" />
                              Prescription Attached ({v.prescription.items.length} items)
                            </span>
                            <button
                              onClick={() => triggerPrescriptionPrint(v.prescription)}
                              className="px-3 py-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1 transition-colors"
                            >
                              <Printer size={12} /> Print Rx
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'billing' && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm shadow-blue-100/30 flex flex-col gap-4">
            <h3 className="font-heading font-bold text-slate-800 text-lg">Invoices & Balances</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase">
                    <th className="py-2.5 px-3">Invoice No.</th>
                    <th className="py-2.5 px-3">Billed Date</th>
                    <th className="py-2.5 px-3">Billed Total</th>
                    <th className="py-2.5 px-3">Remaining Balance</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {patient.invoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No billing invoices generated for this patient.
                      </td>
                    </tr>
                  ) : (
                    patient.invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-bold text-slate-800 text-xs">{inv.invoiceNumber}</td>
                        <td className="py-3 px-3 text-xs text-slate-400">{new Date(inv.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">₹{inv.total.toLocaleString('en-IN')}</td>
                        <td className={`py-3 px-3 font-bold ${inv.balance > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                          ₹{inv.balance.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            inv.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : inv.paymentStatus === 'PARTIAL' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100'
                          }`}>
                            {inv.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {inv.balance > 0 ? (
                            <button
                              onClick={() => setShowPaymentModal(inv)}
                              className="px-2.5 py-1 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                            >
                              Add Payment
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 flex items-center justify-end gap-1"><CheckCircle size={12} className="text-emerald-500" /> Settled</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Imaging Tab */}
        {activeTab === 'imaging' && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm shadow-blue-100/30 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <h3 className="font-heading font-bold text-slate-800 text-lg">Imaging & Radiography</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {/* Mock items for demonstrating radiography uploads */}
              <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 flex flex-col gap-2 hover:shadow-md transition-shadow">
                <div className="bg-slate-900 aspect-square rounded-lg flex items-center justify-center text-xs font-mono text-slate-500 font-bold tracking-widest border border-slate-800">
                  🦷 [ X-RAY MOCK ]
                </div>
                <div className="px-1 text-left">
                  <p className="text-xs font-bold text-slate-700 truncate">Panoramic OPG</p>
                  <p className="text-[9px] text-slate-400">OPG - May 10, 2026</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 flex flex-col gap-2 hover:shadow-md transition-shadow">
                <div className="bg-slate-900 aspect-square rounded-lg flex items-center justify-center text-xs font-mono text-slate-500 font-bold tracking-widest border border-slate-800">
                  🦷 [ IOPA MOCK ]
                </div>
                <div className="px-1 text-left">
                  <p className="text-xs font-bold text-slate-700 truncate">IOPA Tooth #36</p>
                  <p className="text-[9px] text-slate-400">IOPA - Jun 20, 2026</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RECORD VISIT MODAL */}
      {showVisitModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form
            onSubmit={handleAddVisit}
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 border border-slate-100 flex flex-col gap-4 animate-scale-up my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="font-heading font-bold text-lg text-slate-800">Record Clinical Visit Case</h3>
              <button
                type="button"
                onClick={() => setShowVisitModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Chief Complaint *</label>
              <input
                type="text"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="e.g. Sharp pain in lower right molar, bleeding gums"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Clinical Diagnosis</label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Apical Periodontitis tooth #36"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Clinical Remarks / Treatment Notes</label>
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Access cavity done, working length determined..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              ></textarea>
            </div>

            {/* Prescription checkbox */}
            <div className="border-t border-slate-100 pt-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={addPrescription}
                  onChange={(e) => setAddPrescription(e.target.checked)}
                  className="rounded text-blue-600 border-slate-300 w-4 h-4"
                />
                <span className="text-xs text-slate-700 font-semibold">Write Clinical Prescription</span>
              </label>
            </div>

            {/* Prescription Sub-Form */}
            {addPrescription && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Add Medicines</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    placeholder="Medicine Name (e.g. Amoxicillin)"
                    className="col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                  />
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="Dosage (e.g. 1-0-1)"
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                  />
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    placeholder="Days (e.g. 5)"
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                  />
                  <input
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Instructions (e.g. After food)"
                    className="col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={addMed}
                  className="py-1.5 text-xs font-semibold text-blue-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  + Add Medicine
                </button>

                {/* Selected Meds list */}
                {meds.length > 0 && (
                  <div className="border-t border-slate-100 pt-3 space-y-1.5">
                    {meds.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{item.medicineName}</p>
                          <p className="text-[10px] text-slate-400">Pattern: {item.dosage} &bull; Days: {item.durationDays} &bull; {item.instructions}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMed(idx)}
                          className="text-red-500 text-[10px] hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submittingVisit}
              className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-md transition-colors"
            >
              {submittingVisit ? 'Saving Case...' : 'Record Visit Case'}
            </button>
          </form>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleAddPayment}
            className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 border border-slate-100 flex flex-col gap-4 animate-scale-up"
          >
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="font-heading font-bold text-slate-800">Add Invoice Payment</h3>
              <button
                type="button"
                onClick={() => setShowPaymentModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-400">Invoice Ref</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{showPaymentModal.invoiceNumber}</p>
              <p className="text-xs text-slate-500 mt-1">Outstanding Balance: ₹{showPaymentModal.balance.toLocaleString('en-IN')}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Amount (INR)</label>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                max={showPaymentModal.balance}
                min={1}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Mode</label>
              <select
                value={payMode}
                onChange={(e) => setPayMode(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card Swipe</option>
                <option value="CHEQUE">Cheque</option>
                <option value="NET_BANKING">Net Banking</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Reference Number / Transaction ID</label>
              <input
                type="text"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="e.g. TXN99881122"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submittingPayment}
              className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-md transition-colors"
            >
              {submittingPayment ? 'Submitting Payment...' : 'Record Payment'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
