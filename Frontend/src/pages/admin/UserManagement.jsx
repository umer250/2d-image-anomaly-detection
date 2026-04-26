import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
    Users, UserPlus, Search, Edit2, Trash2, Mail,
    Shield, AlertCircle, CheckCircle2, ShieldCheck, Printer
} from 'lucide-react';
import UserModal from './UserModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
            showToast('Failed to fetch users', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSaveUser = async (formData) => {
        if (modal.data) {
            await adminAPI.updateUser(modal.data.id, formData);
            showToast('User updated successfully');
        } else {
            await adminAPI.createUser(formData);
            showToast('User created successfully');
        }
        fetchUsers();
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await adminAPI.deleteUser(userId);
            showToast('User deleted successfully');
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch {
            showToast('Failed to delete user', 'error');
        }
    };

    const handlePromoteToAdmin = async (userId) => {
        if (!window.confirm('Promote this user to Admin?')) return;
        try {
            await adminAPI.updateUser(userId, { role: 'admin' });
            showToast('User promoted to Admin');
            fetchUsers();
        } catch {
            showToast('Failed to promote user', 'error');
        }
    };

    const filteredUsers = users.filter(user => {
        const q = searchQuery.toLowerCase();
        return (
            user.full_name?.toLowerCase().includes(q) ||
            user.email?.toLowerCase().includes(q) ||
            user.id.toString().includes(q)
        );
    });

    const printPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' });

        // Header bar
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 297, 38, 'F');

        // Logo square
        doc.setFillColor(99, 102, 241);
        doc.roundedRect(14, 10, 18, 18, 3, 3, 'F');
        doc.setFontSize(13);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('AD', 18, 23);

        doc.setFontSize(18);
        doc.text('AnomalyDetect — User Management Report', 40, 20);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(180, 180, 200);
        doc.text(`Generated: ${new Date().toLocaleString()}  |  Total Users: ${filteredUsers.length}`, 40, 29);

        autoTable(doc, {
            startY: 48,
            head: [['S.No', 'Full Name', 'Email Address', 'Role', 'DB ID', 'Status']],
            body: filteredUsers.map((u, i) => [
                i + 1,
                u.full_name || 'N/A',
                u.email,
                u.role.toUpperCase(),
                `#${u.id}`,
                u.is_active ? 'Active' : 'Inactive',
            ]),
            theme: 'grid',
            headStyles: {
                fillColor: [99, 102, 241],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 9,
                font: 'helvetica',
            },
            bodyStyles: { fontSize: 9, font: 'helvetica' },
            alternateRowStyles: { fillColor: [245, 247, 255] },
            columnStyles: {
                0: { cellWidth: 15, halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'center' },
                5: { halign: 'center' },
            },
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
                `AnomalyDetect System  |  Page ${i} of ${pageCount}`,
                148.5,
                doc.internal.pageSize.height - 8,
                { align: 'center' }
            );
        }

        doc.save(`user-report-${Date.now()}.pdf`);
    };

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3 font-outfit">
                        <Users className="text-indigo-400" size={24} />
                        User Management
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1 font-sans">Manage system accounts, roles, and permissions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={printPDF}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border border-zinc-700 active:scale-95"
                        title="Print PDF of all users"
                    >
                        <Printer size={16} />
                        Print PDF
                    </button>
                    <button
                        onClick={() => setModal({ isOpen: true, data: null })}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
                    >
                        <UserPlus size={16} />
                        New Account
                    </button>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                {/* Search Bar */}
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, email, or ID..."
                            className="w-full bg-black border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white font-sans focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-600"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm font-sans">
                        <thead className="bg-zinc-950 border-b border-zinc-800">
                            <tr>
                                {['S.No', 'Profile', 'Role', 'DB ID', 'Actions'].map(h => (
                                    <th
                                        key={h}
                                        className={`px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-sans ${h === 'Actions' ? 'text-right' : ''}`}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-zinc-800/50">
                            {loading && users.length === 0 ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-5"><div className="h-4 w-4 bg-zinc-800 rounded" /></td>
                                        <td className="px-6 py-5"><div className="h-10 w-48 bg-zinc-800 rounded-lg" /></td>
                                        <td className="px-6 py-5"><div className="h-6 w-20 bg-zinc-800 rounded-lg" /></td>
                                        <td className="px-6 py-5"><div className="h-6 w-16 bg-zinc-800 rounded-lg" /></td>
                                        <td className="px-6 py-5 flex justify-end gap-2">
                                            <div className="h-8 w-8 bg-zinc-800 rounded-lg" />
                                            <div className="h-8 w-8 bg-zinc-800 rounded-lg" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="p-3 bg-zinc-800 rounded-2xl mb-4">
                                                <Users size={32} className="text-zinc-600" />
                                            </div>
                                            <p className="text-zinc-400 font-medium font-sans">No users found</p>
                                            <p className="text-zinc-600 text-xs mt-1 font-sans">Try adjusting your search query</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.map((user, index) => (
                                <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-5 text-zinc-500 font-mono text-xs">{index + 1}</td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-900/40 to-zinc-900 flex items-center justify-center font-bold text-indigo-400 border border-indigo-500/20 group-hover:border-indigo-500/40 transition-colors font-outfit text-sm">
                                                {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-white font-sans">{user.full_name}</div>
                                                <div className="text-zinc-500 text-xs flex items-center gap-1 mt-0.5 font-sans">
                                                    <Mail size={11} />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={clsx(
                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border font-sans",
                                            user.role === 'admin' 
                                                ? "bg-amber-500/5 text-amber-500 border-amber-500/20" 
                                                : "bg-indigo-500/5 text-indigo-400 border-indigo-500/20"
                                        )}>
                                            <Shield size={10} />
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <code className="text-[11px] text-zinc-500 px-2 py-1 bg-black/40 rounded border border-zinc-800 font-mono">#{user.id}</code>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {user.role !== 'admin' && (
                                                <button
                                                    onClick={() => handlePromoteToAdmin(user.id)}
                                                    className="p-2 text-zinc-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-xl transition-all"
                                                    title="Promote to Admin"
                                                >
                                                    <ShieldCheck size={15} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setModal({ isOpen: true, data: user })}
                                                className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                                title="Edit User"
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                                title="Delete User"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer count */}
                {filteredUsers.length > 0 && (
                    <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/30">
                        <p className="text-[10px] text-zinc-600 font-sans uppercase tracking-widest">
                            Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                )}
            </div>

            <UserModal
                isOpen={modal.isOpen}
                editingUser={modal.data}
                onClose={() => setModal({ isOpen: false, data: null })}
                onSave={handleSaveUser}
            />

            {toast && (
                <div className={`fixed bottom-8 right-8 z-[60] flex items-center p-4 rounded-2xl shadow-2xl border animate-in fade-in slide-in-from-bottom-4 duration-300 font-sans ${toast.type === 'error' ? 'bg-red-950 border-red-500/30 text-red-300' : 'bg-zinc-900 border-green-500/30 text-green-300'}`}>
                    {toast.type === 'error' ? <AlertCircle size={18} className="mr-3 shrink-0" /> : <CheckCircle2 size={18} className="mr-3 shrink-0" />}
                    <p className="text-sm font-semibold">{toast.message}</p>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
