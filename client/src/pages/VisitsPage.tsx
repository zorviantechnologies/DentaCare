import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Printer, Eye, Activity, FileText } from 'lucide-react';

export const VisitsPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [visits, setVisits] = useState<any[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(false);

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients?limit=50');
      setPatients(res.data.patients || []);
    } catch {
      console.error('Failed to load patient registries');
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const loadPatientVisits = async (patId: string) => {
    if (!patId) {
      setVisits([]);
      return;
    }
    try {
      setLoadingVisits(true);
      const res = await api.get(`/visits/patient/${patId}`);
      setVisits(res.data);
    } catch {
      console.error('Failed to load visits');
    } finally {
      setLoadingVisits(false);
    }
  };

  const handlePatientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedPatientId(val);
    loadPatientVisits(val);
  };

  const triggerPrescriptionPrint = (visit: any, patient: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !visit.prescription) return;

    const itemsHtml = visit.prescription.items
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
            <strong>Gender/Age:</strong> ${patient.gender || '—'} &bull; <strong>Date:</strong> ${new Date(visit.date).toLocaleDateString()}
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
            <strong>${visit.prescription.doctorSignature}</strong>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-xl sm:text-2xl text-slate-800 font-bold">Visits Log</h1>
        <p className="text-xs text-slate-500 mt-1">Review clinical reports, chief complaints, and print medical prescriptions.</p>
      </div>

      {/* Select Patient */}
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

      {/* Visits List */}
      {!selectedPatientId ? (
        <div className="bg-slate-50/50 border border-dashed border-slate-200 p-12 rounded-2xl text-center text-slate-400 text-sm">
          Please select a patient above to load clinical visit logs.
        </div>
      ) : loadingVisits ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : visits.length === 0 ? (
        <div className="bg-white border border-slate-100 p-12 rounded-2xl text-center text-slate-400 text-sm shadow-sm shadow-blue-100/10">
          <Activity size={32} className="mx-auto text-slate-200 mb-2" />
          No visits recorded for this patient yet.
        </div>
      ) : (
        <div className="space-y-6">
          {visits.map((v) => (
            <div key={v.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm shadow-blue-100/25 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <span className="text-xs font-bold text-slate-400">
                  {new Date(v.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
                {v.prescription && (
                  <button
                    onClick={() => triggerPrescriptionPrint(v, selectedPatient)}
                    className="px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Printer size={12} /> Print Prescription
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Chief Complaint</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{v.chiefComplaint}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Diagnosis</p>
                  <p className="text-xs text-slate-700 mt-1">{v.diagnosis || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Clinical Notes</p>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">{v.clinicalNotes || '—'}</p>
                </div>
              </div>

              {/* Prescription Items Preview */}
              {v.prescription && (
                <div className="border-t border-slate-50 pt-3 mt-1.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 flex items-center gap-1.5"><FileText size={12} className="text-blue-500" /> Prescribed Medicines</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {v.prescription.items.map((item: any) => (
                      <div key={item.id} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex flex-col text-xs">
                        <span className="font-bold text-slate-800">{item.medicineName}</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">Pattern: {item.dosage} &bull; Days: {item.durationDays}</span>
                        {item.instructions && <span className="text-[9px] text-slate-400 italic mt-0.5">{item.instructions}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
