import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User, UserPlus, MoreVertical, Edit, CheckCircle } from 'lucide-react';

interface AppointmentData {
  id: string;
  patient: {
    id: string;
    name: string;
    phone: string;
    patientNumber: string;
  };
  doctor: {
    id: string;
    name: string;
  };
  dateTime: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  reason?: string | null;
  notes?: string | null;
}

interface SchedulerProps {
  appointments: AppointmentData[];
  doctors: { id: string; name: string }[];
  onAddAppointment: (data: any) => Promise<void>;
  onUpdateStatus: (id: string, status: AppointmentData['status']) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  patients: { id: string; name: string; patientNumber: string }[];
}

const STATUS_DETAILS = {
  SCHEDULED: { label: 'Scheduled', color: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-500' },
  CHECKED_IN: { label: 'Checked In', color: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
  COMPLETED: { label: 'Completed', color: 'bg-slate-50 text-slate-600 border-slate-100', dot: 'bg-slate-400' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-100', dot: 'bg-red-500' },
  NO_SHOW: { label: 'No Show', color: 'bg-indigo-50 text-indigo-700 border-indigo-100', dot: 'bg-indigo-500' },
};

export const Scheduler: React.FC<SchedulerProps> = ({
  appointments,
  doctors,
  onAddAppointment,
  onUpdateStatus,
  onDelete,
  patients,
}) => {
  const [view, setView] = useState<'day' | 'week' | 'month'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<AppointmentData | null>(null);

  // Form states for adding
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(30);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Month navigation calculations
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDayOfWeek = startOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = endOfMonth.getDate();

  // Create grid cells for month view
  const blankCells = Array.from({ length: startDayOfWeek }, (_, i) => null);
  const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthGrid = [...blankCells, ...dayCells];

  const handlePrev = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (view === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (view === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const formatMonthHeader = () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  const getAppointmentsForDay = (day: number) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.dateTime);
      return (
        aptDate.getDate() === day &&
        aptDate.getMonth() === currentDate.getMonth() &&
        aptDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const getAppointmentsForDate = (d: Date) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.dateTime);
      return (
        aptDate.getDate() === d.getDate() &&
        aptDate.getMonth() === d.getMonth() &&
        aptDate.getFullYear() === d.getFullYear()
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !doctorId || !date || !time) {
      alert('Please fill out all fields');
      return;
    }

    setSaving(true);
    try {
      const combinedDateTime = new Date(`${date}T${time}:00`).toISOString();
      await onAddAppointment({
        patientId,
        doctorId,
        dateTime: combinedDateTime,
        durationMinutes: Number(duration),
        reason,
        notes,
        status: 'SCHEDULED',
      });
      setShowAddModal(false);
      // Reset form
      setPatientId('');
      setDoctorId('');
      setDate('');
      setReason('');
      setNotes('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to schedule appointment');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: AppointmentData['status']) => {
    try {
      await onUpdateStatus(id, newStatus);
      if (showDetailModal && showDetailModal.id === id) {
        setShowDetailModal({ ...showDetailModal, status: newStatus });
      }
    } catch {
      alert('Failed to update appointment status');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to cancel and delete this appointment booking?')) {
      try {
        await onDelete(id);
        setShowDetailModal(null);
      } catch {
        alert('Failed to delete appointment');
      }
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm shadow-blue-100/50 flex flex-col gap-6">
      {/* Scheduler Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="text-blue-600" size={24} />
          <div>
            <h2 className="font-heading font-bold text-lg text-slate-800">Clinic Bookings Scheduler</h2>
            <p className="text-xs text-slate-500">Manage patient consultations and schedules.</p>
          </div>
        </div>

        {/* View toggles & additions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Navigation */}
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden mr-2">
            <button onClick={handlePrev} className="p-2 hover:bg-slate-50 text-slate-500 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50/50 select-none">
              {formatMonthHeader()}
            </span>
            <button onClick={handleNext} className="p-2 hover:bg-slate-50 text-slate-500 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* View Toggles */}
          <div className="flex border border-slate-200 rounded-xl p-0.5 bg-slate-50">
            {(['day', 'week', 'month'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                  view === v
                    ? 'bg-white text-blue-600 shadow-sm border-slate-100'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/10 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <UserPlus size={14} />
            Book Slot
          </button>
        </div>
      </div>

      {/* MONTH VIEW CALENDAR GRID */}
      {view === 'month' && (
        <div className="border border-slate-100 rounded-2xl overflow-hidden">
          {/* Days of week */}
          <div className="grid grid-cols-7 bg-slate-50/80 border-b border-slate-100 text-center py-2.5">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <span key={d} className="text-xs font-semibold text-slate-500">
                {d}
              </span>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 grid-flow-row divide-x divide-y divide-slate-100 border-b border-r border-slate-100">
            {monthGrid.map((day, idx) => {
              const dateApts = day ? getAppointmentsForDay(day) : [];
              const isToday =
                day &&
                new Date().getDate() === day &&
                new Date().getMonth() === currentDate.getMonth() &&
                new Date().getFullYear() === currentDate.getFullYear();

              return (
                <div key={idx} className="min-h-[100px] p-2 bg-white flex flex-col gap-1 hover:bg-slate-50/50">
                  {day && (
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={`w-6 h-6 flex items-center justify-center text-xs font-semibold rounded-full ${
                          isToday ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700'
                        }`}
                      >
                        {day}
                      </span>
                    </div>
                  )}

                  {/* Appointments list */}
                  <div className="flex-1 overflow-y-auto max-h-[80px] space-y-1">
                    {dateApts.slice(0, 3).map((apt) => {
                      const meta = STATUS_DETAILS[apt.status];
                      return (
                        <button
                          key={apt.id}
                          onClick={() => setShowDetailModal(apt)}
                          className={`w-full text-left truncate text-[10px] px-2 py-1 rounded border flex items-center gap-1.5 transition-all hover:scale-[1.01] ${meta.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}></span>
                          <span className="font-semibold truncate">{apt.patient.name}</span>
                        </button>
                      );
                    })}
                    {dateApts.length > 3 && (
                      <div className="text-[9px] text-center text-slate-400 font-bold">
                        + {dateApts.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAY VIEW LIST */}
      {view === 'day' && (
        <div className="border border-slate-100 rounded-2xl p-4 divide-y divide-slate-100">
          <div className="text-sm font-semibold text-slate-700 pb-3 uppercase tracking-wider">
            Appointments Scheduled for {currentDate.toDateString()}
          </div>
          {getAppointmentsForDate(currentDate).length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              No appointments scheduled for this date.
            </div>
          ) : (
            getAppointmentsForDate(currentDate).map((apt) => {
              const meta = STATUS_DETAILS[apt.status];
              const formattedTime = new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={apt.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50/50 text-blue-600 flex flex-col items-center justify-center border border-blue-100/50">
                      <Clock size={16} />
                      <span className="text-[8px] font-bold mt-0.5">{formattedTime}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{apt.patient.name}</h4>
                      <p className="text-xs text-slate-400">
                        Doctor: {apt.doctor.name} &bull; Reason: {apt.reason || 'General checkup'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${meta.color}`}>
                      {meta.label}
                    </span>
                    <button
                      onClick={() => setShowDetailModal(apt)}
                      className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-slate-500"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* WEEK VIEW LIST */}
      {view === 'week' && (
        <div className="grid grid-cols-7 gap-2 overflow-x-auto min-w-[700px]">
          {Array.from({ length: 7 }).map((_, idx) => {
            const startOfWeek = new Date(currentDate);
            const offset = idx - startOfWeek.getDay();
            const cellDate = new Date(startOfWeek.setDate(startOfWeek.getDate() + offset));
            const weekApts = getAppointmentsForDate(cellDate);

            return (
              <div key={idx} className="bg-slate-50/30 border border-slate-100 rounded-xl p-3 flex flex-col gap-2 min-h-[300px]">
                <div className="text-center border-b border-slate-100 pb-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][cellDate.getDay()]}
                  </p>
                  <p className="text-sm font-semibold text-slate-800">{cellDate.getDate()}</p>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[250px]">
                  {weekApts.map((apt) => {
                    const meta = STATUS_DETAILS[apt.status];
                    const timeStr = new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div
                        key={apt.id}
                        onClick={() => setShowDetailModal(apt)}
                        className={`cursor-pointer p-2 rounded-lg border text-left flex flex-col gap-0.5 hover:scale-[1.02] transition-all ${meta.color}`}
                      >
                        <p className="text-[9px] font-bold opacity-80">{timeStr}</p>
                        <p className="text-[10px] font-semibold truncate">{apt.patient.name}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BOOKING MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-100 flex flex-col gap-4 animate-scale-up"
          >
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="font-heading font-bold text-lg text-slate-800">Book Patient Appointment</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>

            {/* Select Patient */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Patient</label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Select Patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.patientNumber})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Doctor */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned Doctor</label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Select Doctor...</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Duration (Minutes)</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              >
                <option value={15}>15 Mins</option>
                <option value={30}>30 Mins</option>
                <option value={45}>45 Mins</option>
                <option value={60}>60 Mins</option>
                <option value={90}>90 Mins</option>
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Reason for Visit</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Tooth ache, Cleaning, Followup"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-md mt-2 transition-all active:scale-95"
            >
              {saving ? 'Scheduling...' : 'Confirm Appointment Booking'}
            </button>
          </form>
        </div>
      )}

      {/* DETAIL VIEW / UPDATE STATUS MODAL */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 border border-slate-100 flex flex-col gap-4 animate-scale-up">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="font-heading font-bold text-slate-800">Booking Summary</h3>
              <button
                type="button"
                onClick={() => setShowDetailModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                Close
              </button>
            </div>

            {/* Detail rows */}
            <div className="space-y-3">
              <div className="flex gap-3.5">
                <User className="text-slate-400 min-w-5" size={20} />
                <div>
                  <p className="text-xs text-slate-400 font-medium">Patient</p>
                  <p className="text-sm font-bold text-slate-800">{showDetailModal.patient.name}</p>
                  <p className="text-xs text-slate-500">ID: {showDetailModal.patient.patientNumber} &bull; Ph: {showDetailModal.patient.phone}</p>
                </div>
              </div>

              <div className="flex gap-3.5">
                <Clock className="text-slate-400 min-w-5" size={20} />
                <div>
                  <p className="text-xs text-slate-400 font-medium">Schedule</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {new Date(showDetailModal.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  <p className="text-xs text-slate-500">Duration: {showDetailModal.durationMinutes} Minutes</p>
                </div>
              </div>

              <div className="flex gap-3.5">
                <User className="text-slate-400 min-w-5" size={20} />
                <div>
                  <p className="text-xs text-slate-400 font-medium">Assigned Doctor</p>
                  <p className="text-sm font-semibold text-slate-800">{showDetailModal.doctor.name}</p>
                </div>
              </div>

              {showDetailModal.reason && (
                <div className="bg-slate-50 p-2.5 rounded-xl text-xs text-slate-600 border border-slate-100">
                  <span className="font-semibold text-slate-700">Reason:</span> {showDetailModal.reason}
                </div>
              )}
            </div>

            {/* Workflow statuses */}
            <div className="border-t border-slate-100 pt-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Update Status Flow</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(STATUS_DETAILS) as Array<keyof typeof STATUS_DETAILS>).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(showDetailModal.id, st)}
                    className={`text-[10px] py-1.5 px-2 rounded-lg border font-semibold text-left transition-all ${
                      showDetailModal.status === st
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {STATUS_DETAILS[st].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Delete / Cancel option */}
            <button
              onClick={() => handleDelete(showDetailModal.id)}
              className="w-full py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border border-transparent rounded-xl transition-all"
            >
              Cancel Booking Slot
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
