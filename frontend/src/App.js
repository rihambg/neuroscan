// NeuroScan - App Root
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import LandingPage    from './pages/public/LandingPage';
import LoginPage      from './pages/public/LoginPage';
import RegisterPage   from './pages/public/RegisterPage';

import DoctorDashboard     from './pages/doctor/DoctorDashboard';
import DoctorPatients      from './pages/doctor/DoctorPatients';
import DoctorPatientDetail from './pages/doctor/DoctorPatientDetail';
import DoctorMRIReview     from './pages/doctor/DoctorMRIReview';
import DoctorRequests      from './pages/doctor/DoctorRequests';
import DoctorProfile       from './pages/doctor/DoctorProfile';

import PatientDashboard from './pages/patient/PatientDashboard';
import PatientMRI       from './pages/patient/PatientMRI';
import PatientDoctors   from './pages/patient/PatientDoctors';
import PatientReports   from './pages/patient/PatientReports';
import PatientProfile   from './pages/patient/PatientProfile';

import './styles/global.css';

function Spinner() {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--surface-2)'}}>
      <div style={{width:40,height:40,border:'3px solid var(--border)',borderTopColor:'var(--blue)',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
    </div>
  );
}

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'doctor' ? '/doctor' : '/patient'} replace />;
  return children;
}

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'doctor' ? '/doctor' : '/patient'} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ duration:3500, style:{ fontFamily:'Inter,sans-serif',fontSize:'14px',borderRadius:'10px',background:'var(--surface)',color:'var(--text-primary)',border:'1px solid var(--border)' }}} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <Routes>
            <Route path="/"         element={<LandingPage />} />
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/app"      element={<RoleRedirect />} />

            <Route path="/doctor"              element={<ProtectedRoute role="doctor"><DoctorDashboard /></ProtectedRoute>} />
            <Route path="/doctor/patients"     element={<ProtectedRoute role="doctor"><DoctorPatients /></ProtectedRoute>} />
            <Route path="/doctor/patients/:id" element={<ProtectedRoute role="doctor"><DoctorPatientDetail /></ProtectedRoute>} />
            <Route path="/doctor/mri/:scanId"  element={<ProtectedRoute role="doctor"><DoctorMRIReview /></ProtectedRoute>} />
            <Route path="/doctor/requests"     element={<ProtectedRoute role="doctor"><DoctorRequests /></ProtectedRoute>} />
            <Route path="/doctor/profile"      element={<ProtectedRoute role="doctor"><DoctorProfile /></ProtectedRoute>} />

            <Route path="/patient"             element={<ProtectedRoute role="patient"><PatientDashboard /></ProtectedRoute>} />
            <Route path="/patient/mri"         element={<ProtectedRoute role="patient"><PatientMRI /></ProtectedRoute>} />
            <Route path="/patient/doctors"     element={<ProtectedRoute role="patient"><PatientDoctors /></ProtectedRoute>} />
            <Route path="/patient/reports"     element={<ProtectedRoute role="patient"><PatientReports /></ProtectedRoute>} />
            <Route path="/patient/profile"     element={<ProtectedRoute role="patient"><PatientProfile /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
