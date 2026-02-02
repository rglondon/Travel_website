/**
 * Radar Scan Animation Component
 * Used during upload processing to indicate ongoing analysis
 */

import React from 'react';

interface RadarScanProps {
  size?: number;
  color?: string;
  speed?: number;
  label?: string;
}

export const RadarScan: React.FC<RadarScanProps> = ({
  size = 120,
  color = '#0066FF',
  speed = 2,
  label,
}) => {
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Outer ring */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          border: `2px solid ${color}20`,
          borderRadius: '50%',
        }}
      />

      {/* Scanning ring */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          border: `2px solid ${color}`,
          borderRadius: '50%',
          animation: `radar-scan ${speed}s linear infinite`,
        }}
      />

      {/* Inner scanning ring (offset) */}
      <div
        style={{
          position: 'absolute',
          width: '80%',
          height: '80%',
          border: `2px solid ${color}`,
          borderRadius: '50%',
          animation: `radar-scan ${speed}s linear infinite`,
          animationDelay: `-${speed / 2}s`,
          opacity: 0.6,
        }}
      />

      {/* Center dot */}
      <div
        style={{
          width: 8,
          height: 8,
          background: color,
          borderRadius: '50%',
          zIndex: 1,
        }}
      />

      {/* Crosshairs */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: 1,
            background: `${color}30`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 1,
            background: `${color}30`,
          }}
        />
      </div>

      {/* Label */}
      {label && (
        <div
          style={{
            position: 'absolute',
            bottom: -24,
            fontSize: 10,
            fontFamily: 'IBM Plex Mono, monospace',
            color: color,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      )}

      <style>{`
        @keyframes radar-scan {
          0% {
            transform: rotate(0deg);
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            transform: rotate(360deg);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Processing Pulse Animation
 * Shows when AI is analyzing
 */
export const ProcessingPulse: React.FC<{ color?: string }> = ({
  color = '#0066FF',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        alignItems: 'center',
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            background: color,
            borderRadius: '50%',
            animation: `pulse-wave 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes pulse-wave {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.4;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Success Checkmark Animation
 */
export const SuccessCheck: React.FC<{ size?: number; color?: string }> = ({
  size = 48,
  color = '#00D4AA',
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        style={{ width: '100%', height: '100%' }}
      >
        <circle
          cx="12"
          cy="12"
          r="11"
          stroke={color}
          strokeWidth="2"
        />
        <path
          d="M7 12l3 3 7-7"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <style>{`
        path {
          stroke-dasharray: 30;
          stroke-dashoffset: 30;
          animation: check-draw 0.5s ease forwards;
        }
        @keyframes check-draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Upload Progress Ring
 */
export const ProgressRing: React.FC<{
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
}> = ({
  progress,
  size = 80,
  strokeWidth = 6,
  color = '#0066FF',
  backgroundColor = '#E5E5E5',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.3s ease',
          }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontFamily: 'IBM Plex Mono, monospace',
          fontWeight: 600,
          color: color,
        }}
      >
        {Math.round(progress)}%
      </div>
    </div>
  );
};

/**
 * Loading Spinner
 */
export const LoadingSpinner: React.FC<{
  size?: number;
  color?: string;
}> = ({ size = 24, color = '#0066FF' }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `2px solid ${color}20`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );
};

/**
 * Status Indicator Dot
 */
export const StatusDot: React.FC<{
  status: 'pending' | 'processing' | 'complete' | 'error';
}> = ({ status }) => {
  const colors = {
    pending: '#999999',
    processing: '#0066FF',
    complete: '#00D4AA',
    error: '#FF4444',
  };

  const animations = {
    pending: 'none',
    processing: 'pulse 1.5s infinite',
    complete: 'none',
    error: 'none',
  };

  return (
    <div
      style={{
        width: 8,
        height: 8,
        background: colors[status],
        borderRadius: '50%',
        animation: animations[status] as string,
      }}
    />
  );
};

export default RadarScan;
