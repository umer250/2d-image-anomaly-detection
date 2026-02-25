
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const userRole = user?.role || 'user';

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        // Redirect to 403 Access Denied page if authorized but wrong role
        return <Navigate to="/403" replace />;
    }

    return children;
};

export default ProtectedRoute;
