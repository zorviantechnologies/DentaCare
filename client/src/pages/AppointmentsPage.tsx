import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Scheduler } from '../components/Scheduler';

export const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedulerData = async () => {
    try {
      setLoading(true);
      const [aptsRes, usersRes, patientsRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/settings/users'),
        api.get('/patients?limit=100'), // Grab first 100 for search selection
      ]);

      setAppointments(aptsRes.data);
      // Doctors: filter to roles OWNER and DOCTOR
      const doctorUsers = usersRes.data.filter((u: any) => u.role === 'DOCTOR' || u.role === 'OWNER');
      setDoctors(doctorUsers);
      setPatients(patientsRes.data.patients || []);
    } catch {
      console.error('Failed to load scheduler parameters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedulerData();
  }, []);

  const handleAddAppointment = async (payload: any) => {
    await api.post('/appointments', payload);
    fetchSchedulerData(); // reload calendar slots
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    await api.put(`/appointments/${id}`, { status });
    fetchSchedulerData();
  };

  const handleDeleteAppointment = async (id: string) => {
    await api.delete(`/appointments/${id}`);
    fetchSchedulerData();
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Scheduler Wrapper */}
      <Scheduler
        appointments={appointments}
        doctors={doctors}
        patients={patients}
        onAddAppointment={handleAddAppointment}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDeleteAppointment}
      />
    </div>
  );
};
