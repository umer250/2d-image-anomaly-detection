import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import UserLayout from '../components/layout/UserLayout';
import AdminLayout from '../components/layout/AdminLayout';

// Public Pages
import Landing from '../pages/shared/Landing';
import Auth from '../pages/shared/Auth';
import ForgotPassword from '../pages/shared/ForgotPassword';
import ConfirmResetPassword from '../pages/shared/ConfirmResetPassword';
import About from '../pages/shared/About';
import NotFound from '../pages/shared/NotFound';
import AccessDenied from '../pages/shared/AccessDenied';
import VerifyOTP from '../pages/shared/VerifyOTP';



// User Pages
import Dashboard from '../pages/user/Dashboard';
import Profile from '../pages/user/Profile';
import Settings from '../pages/user/Settings';
import Upload from '../pages/user/Upload';
import Results from '../pages/user/Results';
import History from '../pages/user/History';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import UserManagement from '../pages/admin/UserManagement';
import ImageMonitoring from '../pages/admin/ImageMonitoring';
import Reports from '../pages/admin/Reports';
import AdminSettings from '../pages/admin/AdminSettings';

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/confirm-reset" element={<ConfirmResetPassword />} />

            <Route path="/reset-password" element={<ConfirmResetPassword />} />
            <Route path="/about" element={<About />} />
            <Route path="/403" element={<AccessDenied />} />


            {/* Protected User Routes */}
            <Route element={<UserLayout />}>
                <Route path="/dashboard" element={
                    <ProtectedRoute allowedRoles={['user', 'admin']}>
                        <Dashboard />
                    </ProtectedRoute>
                } />
                <Route path="/profile" element={
                    <ProtectedRoute allowedRoles={['user', 'admin']}>
                        <Profile />
                    </ProtectedRoute>
                } />
                <Route path="/settings" element={
                    <ProtectedRoute allowedRoles={['user', 'admin']}>
                        <Settings />
                    </ProtectedRoute>
                } />
                <Route path="/upload" element={
                    <ProtectedRoute allowedRoles={['user', 'admin']}>
                        <Upload />
                    </ProtectedRoute>
                } />
                <Route path="/results" element={
                    <ProtectedRoute allowedRoles={['user', 'admin']}>
                        <Results />
                    </ProtectedRoute>
                } />
                <Route path="/history" element={
                    <ProtectedRoute allowedRoles={['user', 'admin']}>
                        <History />
                    </ProtectedRoute>
                } />
            </Route>

            {/* Protected Admin Routes */}
            <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <UserManagement />
                    </ProtectedRoute>
                } />
                <Route path="/admin/images" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <ImageMonitoring />
                    </ProtectedRoute>
                } />
                <Route path="/admin/reports" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <Reports />
                    </ProtectedRoute>
                } />
                <Route path="/admin/settings" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminSettings />
                    </ProtectedRoute>
                } />
            </Route>

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AppRoutes;
