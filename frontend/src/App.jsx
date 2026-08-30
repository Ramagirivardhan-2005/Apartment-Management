import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import api from './api/client';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import InitialSetup from './pages/auth/InitialSetup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyOtp from './pages/auth/VerifyOtp';
import ActivateAccount from './pages/auth/ActivateAccount';
import ForceChangePassword from './pages/auth/ForceChangePassword';

// Super Admin Pages
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard';
import BlocksManagement from './pages/super-admin/BlocksManagement';
import BlockAdminsManagement from './pages/super-admin/BlockAdminsManagement';
import AllRoomsManagement from './pages/super-admin/AllRoomsManagement';
import AllParkingManagement from './pages/super-admin/AllParkingManagement';
import AllResidentsManagement from './pages/super-admin/AllResidentsManagement';
import SystemReports from './pages/super-admin/SystemReports';
import AuditLogsViewer from './pages/super-admin/AuditLogsViewer';

// Block Admin Pages
import BlockAdminDashboard from './pages/block-admin/BlockAdminDashboard';
import RoomManagement from './pages/block-admin/RoomManagement';
import OverduePayments from './pages/block-admin/OverduePayments';
import ParkingManagement from './pages/block-admin/ParkingManagement';
import ReceptionistsManagement from './pages/block-admin/ReceptionistsManagement';
import BlockResidents from './pages/block-admin/BlockResidents';
import BlockComplaints from './pages/block-admin/BlockComplaints';
import BlockAnnouncements from './pages/block-admin/BlockAnnouncements';
import BlockRevenue from './pages/block-admin/BlockRevenue';

// Receptionist Pages
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard';
import UserSearchAndRegister from './pages/receptionist/UserSearchAndRegister';
import BookingWizard from './pages/receptionist/BookingWizard';
import ReceptionRooms from './pages/receptionist/ReceptionRooms';
import ReceptionParking from './pages/receptionist/ReceptionParking';
import ReceptionPayments from './pages/receptionist/ReceptionPayments';
import ReceptionVisitors from './pages/receptionist/ReceptionVisitors';

// Resident Pages
import ResidentDashboard from './pages/resident/ResidentDashboard';
import ResidentRoom from './pages/resident/ResidentRoom';
import ResidentRoomBooking from './pages/resident/ResidentRoomBooking';
import ResidentPayments from './pages/resident/ResidentPayments';
import ResidentParking from './pages/resident/ResidentParking';
import ResidentComplaints from './pages/resident/ResidentComplaints';
import ResidentAnnouncements from './pages/resident/ResidentAnnouncements';
import ResidentRoomHistory from './pages/resident/ResidentRoomHistory';
import ResidentProfile from './pages/resident/ResidentProfile';

// Security Desk Pages
import SecurityDashboard from './pages/security/SecurityDashboard';
import VisitorCheckIn from './pages/security/VisitorCheckIn';
import VisitorCheckOut from './pages/security/VisitorCheckOut';
import ResidentMovements from './pages/security/ResidentMovements';
import ResidentLookup from './pages/security/ResidentLookup';
import SecurityLogs from './pages/security/SecurityLogs';

// Helper Root Redirect based on user role
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'super_admin':
      return <Navigate to="/super-admin/dashboard" replace />;
    case 'block_admin':
      return <Navigate to="/block-admin/dashboard" replace />;
    case 'receptionist':
      return <Navigate to="/receptionist/dashboard" replace />;
    case 'security':
      return <Navigate to="/security/dashboard" replace />;
    case 'resident':
    default:
      return <Navigate to="/resident/dashboard" replace />;
  }
};

const App = () => {
  useEffect(() => {
    // Proactively warm up backend service on Render to eliminate cold-start latency
    api.get('/health').catch(() => {});
  }, []);

  return (
    <Routes>
      {/* Root Route */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/setup" element={<InitialSetup />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/verify-email" element={<VerifyOtp />} />
      <Route path="/set-password" element={<VerifyOtp />} />
      <Route path="/activate-account" element={<ActivateAccount />} />
      <Route
        path="/force-change-password"
        element={
          <ProtectedRoute>
            <ForceChangePassword />
          </ProtectedRoute>
        }
      />

      {/* SUPER ADMIN ROUTES */}
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="blocks" element={<BlocksManagement />} />
        <Route path="block-admins" element={<BlockAdminsManagement />} />
        <Route path="rooms" element={<AllRoomsManagement />} />
        <Route path="parking" element={<AllParkingManagement />} />
        <Route path="residents" element={<AllResidentsManagement />} />
        <Route path="reports" element={<SystemReports />} />
        <Route path="audit-logs" element={<AuditLogsViewer />} />
      </Route>

      {/* BLOCK ADMIN ROUTES */}
      <Route
        path="/block-admin"
        element={
          <ProtectedRoute allowedRoles={['block_admin']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<BlockAdminDashboard />} />
        <Route path="rooms" element={<RoomManagement />} />
        <Route path="parking" element={<ParkingManagement />} />
        <Route path="receptionists" element={<ReceptionistsManagement />} />
        <Route path="residents" element={<BlockResidents />} />
        <Route path="overdue" element={<OverduePayments />} />
        <Route path="revenue" element={<BlockRevenue />} />
        <Route path="complaints" element={<BlockComplaints />} />
        <Route path="announcements" element={<BlockAnnouncements />} />
      </Route>

      {/* RECEPTIONIST ROUTES */}
      <Route
        path="/receptionist"
        element={
          <ProtectedRoute allowedRoles={['receptionist']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<ReceptionistDashboard />} />
        <Route path="users" element={<UserSearchAndRegister />} />
        <Route path="book-room" element={<BookingWizard />} />
        <Route path="rooms" element={<ReceptionRooms />} />
        <Route path="parking" element={<ReceptionParking />} />
        <Route path="payments" element={<ReceptionPayments />} />
        <Route path="visitors" element={<ReceptionVisitors />} />
      </Route>

      {/* RESIDENT / USER ROUTES */}
      <Route
        path="/resident"
        element={
          <ProtectedRoute allowedRoles={['resident']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<ResidentDashboard />} />
        <Route path="room" element={<ResidentRoom />} />
        <Route path="book-room" element={<ResidentRoomBooking />} />
        <Route path="payments" element={<ResidentPayments />} />
        <Route path="parking" element={<ResidentParking />} />
        <Route path="complaints" element={<ResidentComplaints />} />
        <Route path="announcements" element={<ResidentAnnouncements />} />
        <Route path="history" element={<ResidentRoomHistory />} />
        <Route path="profile" element={<ResidentProfile />} />
      </Route>

      {/* SECURITY DESK ROUTES */}
      <Route
        path="/security"
        element={
          <ProtectedRoute allowedRoles={['security']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<SecurityDashboard />} />
        <Route path="check-in" element={<VisitorCheckIn />} />
        <Route path="check-out" element={<VisitorCheckOut />} />
        <Route path="movements" element={<ResidentMovements />} />
        <Route path="lookup" element={<ResidentLookup />} />
        <Route path="logs" element={<SecurityLogs />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
