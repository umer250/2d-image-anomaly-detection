import React from 'react';

/**
 * AnomalyDetect App Logo
 * Uses the project logo image + wordmark.
 *
 * Props:
 *   size     {number}  icon size in px, default 32
 *   color    {string}  accent color for wordmark, default "#6366f1"
 *   showText {bool}    show wordmark next to icon, default true
 *   textSize {number}  font size for wordmark in px, default 15
 */
const AppLogo = ({ size, width, color = '#6366f1', showText = true, textSize = 15 }) => {
    // Some components pass width instead of size
    const actualSize = size || width || 32;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
                src="/logo.png"
                alt="AnomalyDetect logo"
                width={actualSize}
                height={actualSize}
                style={{ objectFit: 'contain', flexShrink: 0, borderRadius: 6 }}
            />
            {showText && (
                <span style={{
                    fontFamily: 'Outfit, Inter, system-ui, sans-serif',
                    fontWeight: 700,
                    fontSize: textSize,
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
