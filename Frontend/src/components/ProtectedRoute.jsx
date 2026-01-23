
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    // TODO: Replace with real authentication logic (context or store)
    const isAuthenticated = true; // Mock: User is logged in
    const userRole = 'user'; // Mock: Current user role ('user' or 'admin')
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        // Redirect to appropriate dashboard if authorized but wrong role
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
