import React from 'react';

export const BrandMark: React.FC<{ size?: number; compact?: boolean }> = ({ size = 32, compact = false }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: compact ? 8 : 10,
        backgroundColor: '#F28C52',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(242, 140, 82, 0.35)',
        position: 'relative',
      }}
    >
      <svg
        width={size * 0.65}
        height={size * 0.65}
        viewBox="0 0 108 108"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#0B0E14"
          d="m39 43-10 10 10 10 5-5-5-5 5-5Zm17 0-5 5 5 5-5 5 5 5 10-10Z"
        />
      </svg>
      {/* WEB pill badge */}
      <div
        style={{
          position: 'absolute',
          bottom: -3,
          right: -4,
          backgroundColor: '#8EA8FF',
          color: '#001F58',
          fontSize: Math.max(7, Math.floor(size * 0.24)),
          fontWeight: 900,
          padding: '1px 3px',
          borderRadius: 4,
          border: '1px solid #0B0E14',
          lineHeight: 1,
          letterSpacing: '-0.3px',
        }}
      >
        WEB
      </div>
    </div>
  );
};
