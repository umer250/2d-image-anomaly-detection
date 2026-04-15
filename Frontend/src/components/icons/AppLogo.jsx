import React from 'react';

/**
 * AnomalyDetect App Logo
 * Magnifying glass with a circuit/scan line inside the lens + wordmark.
 *
 * Props:
 *   width  {number}  default 160
 *   color  {string}  default "#6366f1"  (indigo-500)
 *   showText {bool}  default true
 */
const AppLogo = ({ width = 160, color = '#6366f1', showText = true }) => {
    const iconSize = 28;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width }}>
            {/* Icon */}
            <svg
                width={iconSize}
                height={iconSize}
                viewBox="0 0 28 28"
                fill="none"
                aria-label="AnomalyDetect logo icon"
            >
                {/* Lens circle */}
                <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
                {/* Circuit lines inside lens */}
                <line x1="8" y1="12" x2="10.5" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                <line x1="10.5" y1="12" x2="10.5" y2="9.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                <line x1="10.5" y1="9.5" x2="13" y2="9.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                <line x1="13" y1="9.5" x2="13" y2="14.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                <line x1="13" y1="14.5" x2="15.5" y2="14.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                <line x1="15.5" y1="14.5" x2="15.5" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                <line x1="15.5" y1="12" x2="16.5" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                {/* Handle */}
                <line x1="19" y1="19" x2="23.5" y2="23.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
                {/* Small anomaly dot on lens edge */}
                <circle cx="18.5" cy="6" r="2.5" fill="#ef4444" />
                <line x1="17.5" y1="6" x2="19.5" y2="6" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
            </svg>

            {/* Wordmark */}
            {showText && (
                <span style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontWeight: 700,
                    fontSize: 15,
                    letterSpacing: '-0.02em',
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    lineHeight: 1,
                }}>
                    Anomaly<span style={{ color }}>Detect</span>
                </span>
            )}
        </div>
    );
};

export default AppLogo;
