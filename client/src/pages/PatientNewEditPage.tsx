import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, User, Phone, Mail, FileText, CheckCircle, ShieldAlert } from 'lucide-react';

export const PatientNewEditPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  
  // Arrays
  const [medHistory, setMedHistory] = useState<string[]>([]);
  const [medItem, setMedItem] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyItem, setAllergyItem] = useState('');
  
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const fetchPatient = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/patients/${id}`);
          const p = response.data;
          setName(p.name);
          setPhone(p.phone);
          setEmail(p.email || '');
          setGender(p.gender || 'Male');
          if (p.dob) {
            setDob(new Date(p.dob).toISOString().split('T')[0]);
          }
          setAddress(p.address || '');
          setMedHistory(p.medicalHistory || []);
          setAllergies(p.allergies || []);
          setEmergencyContact(p.emergencyContact || '');
          setEmergencyPhone(p.emergencyPhone || '');
        } catch {
          alert('Failed to load patient records');
        } finally {
          setLoading(false);
        }
      };
      fetchPatient();
    }
  }, [id, isEdit]);

  const addMedHistory = () => {
    if (!medItem) return;
    if (!medHistory.includes(medItem)) {
      setMedHistory([...medHistory, medItem]);
    }
    setMedItem('');
  };

  const removeMedHistory = (item: string) => {
    setMedHistory(medHistory.filter((i) => i !== item));
  };

  const addAllergy = () => {
    if (!allergyItem) return;
    if (!allergies.includes(allergyItem)) {
      setAllergies([...allergies, allergyItem]);
    }
    setAllergyItem('');
  };

  const removeAllergy = (item: string) => {
    setAllergies(allergies.filter((i) => i !== item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name,
      phone,
      email: email || null,
      gender,
      dob: dob || null,
      address: address || null,
      medicalHistory: medHistory,
      allergies,
      emergencyContact: emergencyContact || null,
      emergencyPhone: emergencyPhone || null,
    };

    try {
      if (isEdit) {
        await api.put(`/patients/${id}`, payload);
        navigate(`/clinic/patients/${id}`);
      } else {
        const response = await api.post('/patients', payload);
        navigate(`/clinic/patients/${response.data.id}`);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save patient. Verify limits if on Free plan.');
    } finally {
      setSaving(false);
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
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={isEdit ? `/clinic/patients/${id}` : '/clinic/patients'}
          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="font-heading font-bold text-lg text-slate-800">
            {isEdit ? 'Update Patient Profile' : 'Register New Patient'}
          </h1>
          <p className="text-xs text-slate-500">Record clinical details and history.</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm shadow-blue-100/30 flex flex-col gap-6">
        
        {/* Personal Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-2">Personal Details</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rajesh Kumar"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rajesh@email.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Residential Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House Number, Area, Landmark, City"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Clinical Parameters (Medical History & Allergies) */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-2">Medical Conditions & Allergies</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Medical History */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-600">Medical History</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={medItem}
                  onChange={(e) => setMedItem(e.target.value)}
                  placeholder="e.g. Hypertension, Diabetes"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:outline-none focus:bg-white"
                />
                <button
                  type="button"
                  onClick={addMedHistory}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                >
                  Add
                </button>
              </div>

              {/* History list tags */}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {medHistory.map((item) => (
                  <span key={item} className="px-2 py-0.5 bg-red-50 border border-red-100 text-red-700 font-semibold text-[10px] rounded-lg flex items-center gap-1.5 shadow-sm">
                    {item}
                    <button type="button" onClick={() => removeMedHistory(item)} className="hover:text-red-950 font-bold">×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-600">Allergies</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={allergyItem}
                  onChange={(e) => setAllergyItem(e.target.value)}
                  placeholder="e.g. Penicillin, Latex"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:outline-none focus:bg-white"
                />
                <button
                  type="button"
                  onClick={addAllergy}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                >
                  Add
                </button>
              </div>

              {/* Allergies list tags */}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {allergies.map((item) => (
                  <span key={item} className="px-2 py-0.5 bg-amber-50 border border-amber-100 text-amber-700 font-semibold text-[10px] rounded-lg flex items-center gap-1.5 shadow-sm">
                    {item}
                    <button type="button" onClick={() => removeAllergy(item)} className="hover:text-amber-950 font-bold">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-2">Emergency Contact details</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Emergency Contact Name</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Sunita Kumar (Spouse)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Emergency Phone Number</label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="9876543211"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-lg shadow-blue-500/10 transition-all mt-4 active:scale-95 disabled:bg-blue-300"
        >
          {saving ? 'Saving patient details...' : isEdit ? 'Update Patient details' : 'Register and Setup Patient'}
        </button>
      </form>
    </div>
  );
};
