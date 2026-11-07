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
    </div>
  );
};
