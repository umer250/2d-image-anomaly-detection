/**
 * Authentication Context
 * Provides global authentication state and functions throughout the app
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, userAPI } from '../services/api';

const AuthContext = createContext(null);

// Helper function to decode JWT token
const decodeToken = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('access_token'));
    const [loading, setLoading] = useState(true);

    // Check if user is authenticated on mount
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('access_token');

            if (storedToken) {
                try {
                    const decoded = decodeToken(storedToken);

                    if (decoded && decoded.exp * 1000 > Date.now()) {
                        const userData = await userAPI.getMe();
                        setUser(userData);
                        setToken(storedToken);
                    } else {
                        // Token expired
                        localStorage.removeItem('access_token');
                        setToken(null);
                        setUser(null);
                    }
                } catch {
                    localStorage.removeItem('access_token');
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };

        initAuth();

        // Multi-tab logout sync
        const handleStorageChange = (e) => {
            if (e.key === 'access_token' && !e.newValue) {
                setToken(null);
                setUser(null);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Login function
    const login = async (email, password) => {
        try {
            const response = await authAPI.login(email, password);
            const { access_token } = response;

            localStorage.setItem('access_token', access_token);
            setToken(access_token);

            const userData = await userAPI.getMe();
            setUser(userData);

            return { success: true, role: userData.role };
        } catch (error) {
            if (error.message === 'Failed to fetch') {
                throw new Error('Cannot connect to the server. Make sure the backend is running.');
            }
            throw error;
        }
    };

    // Logout function
    const logout = React.useCallback(() => {
        localStorage.removeItem('access_token');
        setToken(null);
        setUser(null);
    }, []);

    // Inactivity Timer (30 minutes)
    useEffect(() => {
        let timeout;
        const INACTIVITY_LIMIT = 30 * 60 * 1000;

        const resetTimer = () => {
            if (timeout) clearTimeout(timeout);
            if (token && user) {
                timeout = setTimeout(() => {
                    logout();
                }, INACTIVITY_LIMIT);
            }
        };

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => window.addEventListener(event, resetTimer));
        resetTimer();

        return () => {
            if (timeout) clearTimeout(timeout);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, [token, user, logout]);

    const register = async (userData) => {
        try {
            await authAPI.register(userData);
            return { success: true };
        } catch (error) {
            throw error;
        }
    };

    const resetPassword = async (email, newPassword) => {
        try {
            await authAPI.resetPassword(email, newPassword);
            return { success: true };
        } catch (error) {
            throw error;
        }
    };

    const updateUser = async () => {
        try {
            const userData = await userAPI.getMe();
            setUser(userData);
        } catch {
            // silently ignore — user stays as-is
        }
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        login,
        logout,
        register,
        resetPassword,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
