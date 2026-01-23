import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { historyData } from '../../data/mockData';
import clsx from 'clsx';

const History = () => {
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        // Simulate loading
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    // Filter logic
    const filteredData = historyData.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'All' || item.result === filterStatus;
        return matchesSearch && matchesFilter;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const currentData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const TableSkeleton = () => (
        <div className="animate-pulse">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-4 border-b border-zinc-800">
                    <div className="h-4 bg-zinc-800 rounded w-1/6"></div>
                    <div className="h-4 bg-zinc-800 rounded w-1/4"></div>
                    <div className="h-4 bg-zinc-800 rounded w-1/6"></div>
                    <div className="h-4 bg-zinc-800 rounded w-1/6"></div>
                    <div className="h-4 bg-zinc-800 rounded w-1/6"></div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-white">Inspection History</h1>
                <button className="inline-flex items-center px-4 py-2 border border-zinc-700 rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                </button>
            </div>

            <div className="bg-zinc-900 shadow rounded-lg overflow-hidden border border-zinc-800">
                {/* Filters & Search */}
                <div className="p-4 border-b border-zinc-800 bg-zinc-900 sm:flex sm:items-center sm:justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-zinc-500" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-zinc-700 rounded-md leading-5 bg-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:placeholder-zinc-400 focus:ring-1 focus:ring-white focus:border-white sm:text-sm"
                            placeholder="Search by ID or filename..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="mt-3 sm:mt-0 flex items-center space-x-3">
                        <div className="relative">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="block w-full pl-3 pr-10 py-2 text-base border-zinc-700 bg-zinc-800 text-white focus:outline-none focus:ring-white focus:border-white sm:text-sm rounded-md"
                            >
                                <option value="All">All Results</option>
                                <option value="Normal">Normal</option>
                                <option value="Anomaly">Anomaly</option>
                            </select>
                        </div>
                        <button className="inline-flex items-center px-3 py-2 border border-zinc-700 shadow-sm text-sm leading-4 font-medium rounded-md text-zinc-300 bg-zinc-800 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white">
                            <Filter className="h-4 w-4 mr-2" />
                            More Filters
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-6">
                            <TableSkeleton />
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-zinc-800">
                            <thead className="bg-zinc-950">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                        Image ID
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                        Filename
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                        Date & Time
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                        Confidence
                                    </th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                                {currentData.map((item) => (
                                    <tr key={item.id} className="hover:bg-zinc-800 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                            {item.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                            {new Date(item.date).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={clsx(
                                                "px-2 inline-flex text-xs leading-5 font-semibold rounded-full border",
                                                item.result === 'Anomaly' ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-green-500/10 text-green-400 border-green-500/20"
                                            )}>
                                                {item.result}
                                            </span>
                                            {item.result === 'Anomaly' && (
                                                <span className="ml-2 text-xs text-zinc-500">({item.type})</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                            <div className="flex items-center">
                                                <div className="w-16 bg-zinc-700 rounded-full h-2 mr-2">
                                                    <div
                                                        className="bg-blue-500 h-2 rounded-full"
                                                        style={{ width: `${item.confidence}%` }}
                                                    ></div>
                                                </div>
                                                {item.confidence}%
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-zinc-500 hover:text-white">
                                                <MoreVertical className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                <div className="bg-zinc-900 px-4 py-3 border-t border-zinc-800 flex items-center justify-between sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-zinc-400">
                                Showing <span className="font-medium text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-white">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of <span className="font-medium text-white">{filteredData.length}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-zinc-700 bg-zinc-800 text-sm font-medium text-zinc-400 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="sr-only">Previous</span>
                                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={clsx(
                                            "relative inline-flex items-center px-4 py-2 border text-sm font-medium",
                                            currentPage === i + 1
                                                ? "z-10 bg-zinc-700 border-zinc-600 text-white"
                                                : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                                        )}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-zinc-700 bg-zinc-800 text-sm font-medium text-zinc-400 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="sr-only">Next</span>
                                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default History;
