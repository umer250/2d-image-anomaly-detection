import React from 'react';

/**
 * 32×32 favicon icon — magnifying glass with anomaly warning dot.
 * Color: indigo-500 (#6366f1)
 */
const FaviconSVG = ({ size = 32, color = '#6366f1' }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        {/* Background */}
        <rect width="32" height="32" rx="7" fill="#18181b" />
        {/* Lens */}
        <circle cx="13" cy="13" r="8" stroke={color} strokeWidth="2.2" />
        {/* Handle */}
        <line x1="19" y1="19" x2="25" y2="25" stroke={color} strokeWidth="2.8" strokeLinecap="round" />
        {/* Scan line inside lens */}
        <line x1="9" y1="13" x2="17" y2="13" stroke={color} strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
        {/* Anomaly indicator (red dot, top-right) */}
        <circle cx="21" cy="8" r="4" fill="#ef4444" />
        <line x1="21" y1="6.5" x2="21" y2="9" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="21" cy="10.5" r="0.7" fill="white" />
    </svg>
);

export default FaviconSVG;
