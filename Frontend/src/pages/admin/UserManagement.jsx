import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Users, UserPlus, Search, Edit2, Trash2, Mail, Shield, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

import UserModal from './UserModal';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [modal, setModal] = useState({ isOpen: false, data: null });
    const [toast, setToast] = useState(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await adminAPI.getUsers();
            setUsers(data);
        } catch (error) {
            showToast("Failed to fetch users", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSaveUser = async (formData) => {
        try {
            if (modal.data) {
                // Update
                await adminAPI.updateUser(modal.data.id, formData);
                showToast("User updated successfully");
            } else {
                // Create
                await adminAPI.createUser(formData);
                showToast("User created successfully");
            }
            fetchUsers();
        } catch (error) {
            throw error; // Let the modal handle visual error
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;

        try {
            await adminAPI.deleteUser(userId);
            showToast("User deleted successfully");
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (error) {
            showToast("Failed to delete user", "error");
        }
    };

    const handlePromoteToAdmin = async (userId) => {
        if (!window.confirm("Are you sure you want to promote this user to Admin?")) return;
        try {
            await adminAPI.updateUser(userId, { role: 'admin' });
            showToast("User promoted to Admin successfully");
            fetchUsers();
        } catch (error) {
            showToast("Failed to promote user", "error");
        }
    };

    const filteredUsers = users.filter(user => {
        // Task 3: Exclude admins from user management table
        if (user.role === 'admin') return false;

        const searchLower = searchQuery.toLowerCase();
        return (
            user.full_name?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            user.id.toString().includes(searchLower)
        );
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center">
                        <Users className="mr-3 text-blue-500" />
                        User Management
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">Manage system accounts, roles, and permissions.</p>
                </div>
                <button
                    onClick={() => setModal({ isOpen: true, data: null })}
                    className="bg-white text-black px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center hover:bg-zinc-200 transition-all shadow-lg shadow-white/5 active:scale-95"
                >
                    <UserPlus size={18} className="mr-2" />
                    New Account
                </button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl">
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, email, or DB ID..."
                            className="w-full bg-black border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] font-bold tracking-widest">
                            <tr>
                                <th className="px-6 py-5">S.No</th>
                                <th className="px-6 py-5">Profile</th>
                                <th className="px-6 py-5">Role</th>
                                <th className="px-6 py-5">DB ID</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-zinc-800/50">
                            {loading && users.length === 0 ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-5"><div className="h-4 w-4 bg-zinc-800/50 rounded"></div></td>
                                        <td className="px-6 py-5"><div className="h-10 w-48 bg-zinc-800/50 rounded-lg"></div></td>
                                        <td className="px-6 py-5"><div className="h-6 w-20 bg-zinc-800/50 rounded-lg"></div></td>
                                        <td className="px-6 py-5"><div className="h-6 w-16 bg-zinc-800/50 rounded-lg"></div></td>
                                        <td className="px-6 py-5 flex justify-end gap-2"><div className="h-8 w-8 bg-zinc-800/50 rounded-lg"></div><div className="h-8 w-8 bg-zinc-800/50 rounded-lg"></div></td>
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="p-3 bg-zinc-800 rounded-2xl mb-4">
                                                <Users size={32} className="text-zinc-500" />
                                            </div>
                                            <p className="text-zinc-400 font-medium">No users found</p>
                                            <p className="text-zinc-600 text-xs mt-1">Try adjusting your search query or filter</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.map((user, index) => (
                                <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-5 text-zinc-500 font-mono text-xs">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center font-bold text-zinc-400 border border-zinc-700/50 group-hover:border-blue-500/30 transition-colors">
                                                {user.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="ml-4">
                                                <div className="font-bold text-white">{user.full_name}</div>
                                                <div className="text-zinc-500 text-xs flex items-center mt-0.5">
                                                    <Mail size={12} className="mr-1" />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${user.role === 'admin'
                                            ? 'bg-red-500/5 text-red-500 border-red-500/10'
                                            : 'bg-blue-500/5 text-blue-500 border-blue-500/10'
                                            }`}>
                                            <Shield size={10} className="mr-1.5" />
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <code className="text-[11px] text-zinc-600 px-2 py-1 bg-black/30 rounded border border-zinc-800/50">#{user.id}</code>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button
                                                onClick={() => handlePromoteToAdmin(user.id)}
                                                className="p-2 text-zinc-500 hover:text-purple-400 hover:bg-purple-500/5 rounded-xl transition-all"
                                                title="Promote to Admin"
                                            >
                                                <ShieldCheck size={16} />
                                            </button>
                                            <button
                                                onClick={() => setModal({ isOpen: true, data: user })}
                                                className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                                title="Edit User"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                                                title="Delete User"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Modal */}
            <UserModal
                isOpen={modal.isOpen}
                editingUser={modal.data}
                onClose={() => setModal({ isOpen: false, data: null })}
                onSave={handleSaveUser}
            />

            {/* Toast System */}
            {toast && (
                <div
                    className={`fixed bottom-8 right-8 z-[60] flex items-center p-4 rounded-2xl shadow-2xl border animate-in fade-in slide-in-from-bottom-4 duration-300 ${toast.type === 'error' ? 'bg-red-900 border-red-500 text-red-100' : 'bg-green-900 border-green-500 text-green-100'
                        }`}
                >
                    {toast.type === 'error' ? <AlertCircle size={20} className="mr-3" /> : <CheckCircle2 size={20} className="mr-3" />}
                    <p className="text-sm font-bold">{toast.message}</p>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
