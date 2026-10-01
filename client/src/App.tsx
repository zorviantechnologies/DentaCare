import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Protected Pages
import { Dashboard } from './pages/Dashboard';
import { PatientsPage } from './pages/PatientsPage';
import { PatientProfilePage } from './pages/PatientProfilePage';
import { PatientNewEditPage } from './pages/PatientNewEditPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { TreatmentsPage } from './pages/TreatmentsPage';
import { TreatmentPlansPage } from './pages/TreatmentPlansPage';
import { VisitsPage } from './pages/VisitsPage';
import { PrescriptionsPage } from './pages/PrescriptionsPage';
import { BillingPage } from './pages/BillingPage';
import { InventoryPage } from './pages/InventoryPage';
import { TasksPage } from './pages/TasksPage';
import { RecallsPage } from './pages/RecallsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient();

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Access Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Multi-Tenant SaaS Workspace */}
            <Route path="/clinic" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="patients" element={<PatientsPage />} />
              <Route path="patients/new" element={<PatientNewEditPage />} />
              <Route path="patients/:id" element={<PatientProfilePage />} />
              <Route path="patients/:id/edit" element={<PatientNewEditPage />} />
              
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="treatments" element={<TreatmentsPage />} />
              <Route path="treatment-plans" element={<TreatmentPlansPage />} />
              
              <Route path="visits" element={<VisitsPage />} />
              <Route path="prescriptions" element={<PrescriptionsPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              
              <Route path="tasks" element={<TasksPage />} />
              <Route path="recalls" element={<RecallsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />

              {/* Fallback helper redirects */}
              <Route path="chart" element={<Navigate to="/clinic/patients" replace />} />
              <Route path="billing/daily-summary" element={<Navigate to="/clinic/billing" replace />} />
            </Route>

            {/* General Catch-All Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
