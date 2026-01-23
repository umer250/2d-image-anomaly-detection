import React from 'react';

export const SkeletonCard = () => (
    <div className="bg-zinc-900 border border-zinc-800 overflow-hidden shadow rounded-lg p-5 animate-pulse">
        <div className="flex items-center">
            <div className="flex-shrink-0 bg-zinc-800 rounded-md h-12 w-12"></div>
            <div className="ml-5 w-full">
                <div className="h-4 bg-zinc-800 rounded w-1/3 mb-2"></div>
                <div className="h-6 bg-zinc-800 rounded w-1/2"></div>
            </div>
        </div>
    </div>
);

export const SkeletonChart = () => (
    <div className="bg-zinc-900 border border-zinc-800 overflow-hidden shadow rounded-lg p-6 animate-pulse h-96">
        <div className="h-6 bg-zinc-800 rounded w-1/4 mb-6"></div>
        <div className="h-64 bg-zinc-800 rounded w-full"></div>
    </div>
);
