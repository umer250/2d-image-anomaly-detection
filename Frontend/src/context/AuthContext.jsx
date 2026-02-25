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
    } catch (error) {
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
                    // Decode token to get user info
                    const decoded = decodeToken(storedToken);

                    // Check if token is expired
                    if (decoded && decoded.exp * 1000 > Date.now()) {
                        console.log("initAuth: Fetching user data...");
                        const userData = await userAPI.getMe();
                        console.log("initAuth: User data fetched successfully:", userData);
                        setUser(userData);
                        setToken(storedToken);
                    } else {
                        // Token expired, clear it
                        console.log("initAuth: Token expired, clearing...");
                        localStorage.removeItem('access_token');
                        setToken(null);
                        setUser(null);
                    }
                } catch (error) {
                    console.error('initAuth: Failed to fetch user:', error);
                    localStorage.removeItem('access_token');
                    setToken(null);
                    setUser(null);
                }
            } else {
                console.log("initAuth: No token found");
            }
            console.log("initAuth: Loading set to false");
            setLoading(false);
        };

        initAuth();

        // Multi-tab logout sync
        const handleStorageChange = (e) => {
            if (e.key === 'access_token' && !e.newValue) {
                // Token was removed in another tab
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
            console.log("AuthContext: login starting for", email);
            const response = await authAPI.login(email, password);
            console.log("AuthContext: login response received", response);

            const { access_token } = response;

            // Store token
            localStorage.setItem('access_token', access_token);
            setToken(access_token);
            console.log("AuthContext: Token stored and state set in AuthContext");

            // Decode token to get user info
            const decoded = decodeToken(access_token);
            console.log("AuthContext: Token decoded", decoded);

            // Fetch full user details
            console.log("AuthContext: Fetching full user details (getMe)...");
            const userData = await userAPI.getMe();
            console.log("AuthContext: User details fetched successfully", userData);
            setUser(userData);

            return { success: true, role: userData.role };
        } catch (error) {
            console.error("AuthContext: Login error caught in AuthContext:", error);
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
                    console.warn("Session expired due to inactivity (30m)");
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

    // Register function (doesn't auto-login)

    const register = async (userData) => {
        try {
            await authAPI.register(userData);
            return { success: true };
        } catch (error) {
            throw error;
        }
    };

    // Reset password function
    const resetPassword = async (email, newPassword) => {
        try {
            await authAPI.resetPassword(email, newPassword);
            return { success: true };
        } catch (error) {
            throw error;
        }
    };

    // Update user data (after profile update)
    const updateUser = async () => {
        try {
            const userData = await userAPI.getMe();
            setUser(userData);
        } catch (error) {
            console.error('Failed to update user:', error);
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
