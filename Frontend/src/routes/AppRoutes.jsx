import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

// Public Pages
import Landing from '../pages/shared/Landing';
import Login from '../pages/shared/Login';
import Register from '../pages/shared/Register';
import ResetPassword from '../pages/shared/ResetPassword';
import About from '../pages/shared/About';

// User Pages
import Dashboard from '../pages/user/Dashboard';
import Profile from '../pages/user/Profile';
import Settings from '../pages/user/Settings';
import Upload from '../pages/user/Upload';
import Results from '../pages/user/Results';
import History from '../pages/user/History';

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/about" element={<About />} />

            {/* Protected User Routes */}
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

            {/* Admin Routes Placeholder */}
            <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <Dashboard /> {/* Reusing Dashboard for now */}
                </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;
