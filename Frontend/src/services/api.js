/**
 * API Service Layer
 * Handles all HTTP requests to the backend API
 */

// API base URL resolution:
// - If VITE_API_URL is a relative path (e.g. '/api'), the Vite dev proxy rewrites
//   /api → /api/v1 on the backend, so we use it as-is.
// - If VITE_API_URL is a full URL (e.g. 'http://localhost:8000'), we append '/api/v1'
//   so the final URLs are correct without relying on the proxy.
const _rawApiUrl = import.meta.env.VITE_API_URL || '/api';
const API_BASE_URL = _rawApiUrl.startsWith('http')
    ? `${_rawApiUrl.replace(/\/$/, '')}/api/v1`
    : _rawApiUrl;  // proxy path — Vite rewrites /api → /api/v1

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
};

// Auth APIs
export const authAPI = {
    // Register new user
    register: async (userData) => {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Registration failed');
        }

        return response.json();
    },

    // Login user
    login: async (email, password) => {
        console.log("api: login request starting for", email);
        const formData = new URLSearchParams();
        formData.append('username', email);  // OAuth2 uses 'username' field
        formData.append('password', password);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData,
            });
            console.log("api: login response received with status:", response.status);

            if (!response.ok) {
                let detail = 'Login failed';
                try {
                    const error = await response.json();
                    detail = error.detail || detail;
                } catch (_) {
                    // Response wasn't JSON (e.g. CORS-blocked response)
                    detail = response.status === 0
                        ? 'Cannot connect to server. Check that the backend is running.'
                        : `Server error (${response.status})`;
                }
                console.error("api: login failed with error:", detail);
                throw new Error(detail);
            }

            const data = await response.json();
            console.log("api: login successful, returning data.");
            return data;
        } catch (error) {
            if (error.message === 'Failed to fetch') {
                throw new Error('Cannot connect to server. Check that the backend is running and CORS is configured.');
            }
            console.error("api: login network or parsing error:", error);
            throw error;
        }
    },

    // Forgot password request
    forgotPassword: async (email) => {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Request failed');
        }

        return response.json();
    },

    // Verify reset token
    verifyResetToken: async (token) => {
        const response = await fetch(`${API_BASE_URL}/auth/verify-token?token=${token}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Invalid or expired token');
        }

        return response.json();
    },

    // Verify OTP
    verifyOTP: async (email, otp) => {
        const response = await fetch(`${API_BASE_URL}/auth/verify-otp?email=${email}&otp=${otp}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Invalid or expired OTP');
        }

        return response.json();
    },

    // Reset password with token
    resetPassword: async (token, newPassword) => {

        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, new_password: newPassword }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Password reset failed');
        }

        return response.json();
    },
};

// User APIs
export const userAPI = {
    // Get current user info
    getMe: async () => {
        console.log("api: getMe starting...");
        try {
            const response = await fetch(`${API_BASE_URL}/users/me`, {
                headers: getAuthHeaders(),
            });
            console.log("api: getMe response status:", response.status);

            if (!response.ok) {
                console.error("api: getMe failed");
                throw new Error('Failed to fetch user info');
            }

            const data = await response.json();
            console.log("api: getMe successful");
            return data;
        } catch (error) {
            console.error("api: getMe error:", error);
            throw error;
        }
    },

    // Get user dashboard
    getDashboard: async () => {
        const response = await fetch(`${API_BASE_URL}/users/dashboard`, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch dashboard');
        }

        return response.json();
    },

    // Update profile
    updateProfile: async (fullName, avatarUrl) => {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                full_name: fullName,
                avatar_url: avatarUrl
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to update profile');
        }

        return response.json();
    },

    // Verify current password
    verifyPassword: async (password) => {
        const response = await fetch(`${API_BASE_URL}/users/verify-password`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Incorrect password');
        }

        return response.json();
    },

    // Change password
    changePassword: async (currentPassword, newPassword) => {
        const response = await fetch(`${API_BASE_URL}/users/change-password`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to change password');
        }

        return response.json();
    },
};

// Admin APIs
export const adminAPI = {
    // Get all users
    getUsers: async (skip = 0, limit = 100) => {
        const response = await fetch(
            `${API_BASE_URL}/admin/users?skip=${skip}&limit=${limit}`,
            { headers: getAuthHeaders() }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }

        return response.json();
    },

    // Create user
    createUser: async (userData) => {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create user');
        }

        return response.json();
    },

    // Update user
    updateUser: async (userId, userData) => {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update user');
        }

        return response.json();
    },

    // Delete user
    deleteUser: async (userId) => {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to delete user');
        }

        return response.json();
    },

    // Get analytics
    getAnalytics: async () => {
        const response = await fetch(`${API_BASE_URL}/admin/analytics`, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch analytics');
        }

        return response.json();
    },

    // Get all images
    getImages: async () => {
        const response = await fetch(`${API_BASE_URL}/admin/images`, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("api: getImages failed with detail:", errorData.detail || 'Unknown error');
            throw new Error(errorData.detail || 'Failed to fetch images');
        }

        return response.json();
    },

    // Reset System (Admin only, requires password)
    resetSystem: async (password) => {
        const response = await fetch(`${API_BASE_URL}/admin/reset-system?password=${password}`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'System reset failed');
        }

        return response.json();
    },

    // Wipe All Users (Admin only, requires password)
    wipeAllUsers: async (password) => {
        const response = await fetch(`${API_BASE_URL}/admin/wipe-all-users?password=${password}`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'User wipe failed');
        }

        return response.json();
    },

    // Get Admin Settings
    getSettings: async () => {
        const response = await fetch(`${API_BASE_URL}/admin/settings`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch settings');
        return response.json();
    },

    // Update Admin Settings
    updateSettings: async (settings) => {
        const response = await fetch(`${API_BASE_URL}/admin/settings`, {
            method: 'PUT',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(settings),
        });
        if (!response.ok) throw new Error('Failed to update settings');
        return response.json();
    },
};



// Results APIs
export const resultsAPI = {
    getHistory: async (skip = 0, limit = 100) => {
        const headers = getAuthHeaders();
        const url = `${API_BASE_URL}/history?skip=${skip}&limit=${limit}`;
        console.log("api: getHistory calling URL:", url);
        console.log("api: getHistory headers:", headers);

        const response = await fetch(url, {
            headers: headers,
        });

        if (!response.ok) {
            throw new Error('Failed to fetch history');
        }

        return response.json();
    },
};

import { mlAPI } from './mlApi';

export { mlAPI };
export default { authAPI, userAPI, adminAPI, mlAPI, resultsAPI };
