import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Check, Clock, Trash2, CheckSquare } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  assignedTo: { id: string; name: string } | null;
}

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Todo');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTasksAndStaff = async () => {
    try {
      setLoading(true);
      const [taskRes, staffRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/settings/users'),
      ]);
      setTasks(taskRes.data);
      setStaff(staffRes.data);
    } catch {
      console.error('Failed to load clinic tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndStaff();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setSubmitting(true);

    try {
      await api.post('/tasks', {
        title,
        description: desc || null,
        priority,
        status,
        dueDate: dueDate || null,
        assignedToId: assigneeId || null,
      });
      setShowModal(false);
      setTitle('');
      setDesc('');
      setDueDate('');
      setAssigneeId('');
      fetchTasksAndStaff();
    } catch {
      alert('Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Todo' ? 'In Progress' : currentStatus === 'In Progress' ? 'Done' : 'Todo';
    try {
      await api.put(`/tasks/${id}`, { status: nextStatus });
      fetchTasksAndStaff();
    } catch {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this task?')) {
      try {
        await api.delete(`/tasks/${id}`);
        fetchTasksAndStaff();
      } catch {
        alert('Failed to delete task');
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-slate-800 font-bold">Clinical Checklist</h1>
          <p className="text-xs text-slate-500 mt-1">Assign duties, followups, and monitor sterilization tasks.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus size={14} /> Add Checklist Task
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="min-h-[30vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white border border-slate-100 p-12 rounded-2xl text-center text-slate-400">
          <CheckSquare size={36} className="mx-auto text-slate-200 mb-2" />
          Task checklist is empty. All operations clear!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm shadow-blue-100/25 flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-2 border-b border-slate-50 pb-2">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                  task.priority === 'High' ? 'bg-red-50 text-red-700 border-red-100' : task.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  {task.priority} Priority
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  task.status === 'Done' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : task.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                }`}>
                  {task.status}
                </span>
              </div>

              <div>
                <h4 className={`text-sm font-semibold ${task.status === 'Done' ? 'line-through text-slate-400 font-normal' : 'text-slate-800'}`}>{task.title}</h4>
                {task.description && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{task.description}</p>}
              </div>

              <div className="flex justify-between items-center border-t border-slate-50 pt-2 text-[10px] text-slate-400 font-medium">
                {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                {task.assignedTo ? <span>Assignee: {task.assignedTo.name}</span> : <span>Unassigned</span>}
              </div>

              {/* Action buttons */}
              <div className="flex gap-1.5 justify-end mt-1">
                <button
                  onClick={() => handleUpdateStatus(task.id, task.status)}
                  className="px-3 py-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Clock size={10} /> Progress Flow
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="p-1.5 border border-slate-100 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FORM MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <form
            onSubmit={handleCreateTask}
            className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 border border-slate-100 flex flex-col gap-4 animate-scale-up"
          >
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="font-heading font-bold text-slate-800">Add Clinical Task</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Task Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Call supplier for Composite resins"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Description / Notes</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={2}
                placeholder="Details of the chore..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned Staff</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                >
                  <option value="">Choose Staff...</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-md transition-colors"
            >
              {submitting ? 'Creating Task...' : 'Confirm Checklist Entry'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
