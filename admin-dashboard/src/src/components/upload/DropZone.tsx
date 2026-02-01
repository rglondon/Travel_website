/**
 * DropZone Component
 * Drag-and-drop file upload zone with radar animation
 */

import React, { useCallback, useState, useRef } from 'react';
import { RadarScan, ProgressRing } from './RadarAnimation';
import { UploadFile, UploadStatus } from '../../types';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing?: boolean;
  processingStatus?: string;
  uploadProgress?: number;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxFileSizeMB?: number;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  isProcessing = false,
  processingStatus = '',
  uploadProgress = 0,
  maxFiles = 20,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  maxFileSizeMB = 50,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter <= 1) {
      setIsDragOver(false);
    }
  }, [dragCounter]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFiles = useCallback((files: File[]): { valid: File[]; invalid: { file: File; reason: string }[] } => {
    const valid: File[] = [];
    const invalid: { file: File; reason: string }[] = [];

    files.forEach(file => {
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        invalid.push({
          file,
          reason: `Invalid type: ${file.type.split('/')[1] || 'unknown'}`,
        });
        return;
      }

      // Check file size
      if (file.size > maxFileSizeBytes) {
        invalid.push({
          file,
          reason: `Too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max: ${maxFileSizeMB}MB)`,
        });
        return;
      }

      valid.push(file);
    });

    return { valid, invalid };
  }, [acceptedTypes, maxFileSizeBytes, maxFileSizeMB]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);

    if (isProcessing) return;

    const files = Array.from(e.dataTransfer.files);
    const { valid, invalid } = validateFiles(files);

    if (invalid.length > 0) {
      // Could emit invalid files event for UI feedback
      console.warn('Invalid files:', invalid);
    }

    if (valid.length > 0) {
      onFilesSelected(valid.slice(0, maxFiles));
    }
  }, [isProcessing, validateFiles, onFilesSelected, maxFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const { valid, invalid } = validateFiles(files);

    if (invalid.length > 0) {
      console.warn('Invalid files:', invalid);
    }

    if (valid.length > 0) {
      onFilesSelected(valid.slice(0, maxFiles));
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [validateFiles, onFilesSelected, maxFiles]);

  const handleClick = useCallback(() => {
    if (!isProcessing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [isProcessing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isProcessing) {
      e.preventDefault();
      handleClick();
    }
  }, [isProcessing, handleClick]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload photos"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`drop-zone ${isDragOver ? 'active' : ''}`}
      style={{
        width: '100%',
        minHeight: 300,
        borderStyle: isProcessing ? 'solid' : 'dashed',
        borderWidth: 2,
        borderColor: isDragOver 
          ? 'var(--color-accent)' 
          : isProcessing 
            ? 'var(--color-accent)' 
            : 'var(--color-line-light)',
        background: isDragOver 
          ? 'var(--color-accent-light)' 
          : isProcessing 
            ? 'var(--color-bg)' 
            : 'var(--color-bg)',
        cursor: isProcessing ? 'default' : 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-2xl)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={isProcessing}
      />

      {/* Processing State */}
      {isProcessing ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-lg)',
          }}
        >
          {/* Radar Scan Animation */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RadarScan size={100} color="#0066FF" speed={2} />
            <div style={{ position: 'absolute' }}>
              <ProgressRing
                progress={uploadProgress}
                size={60}
                strokeWidth={4}
                color="#0066FF"
                backgroundColor="#E5E5E5"
              />
            </div>
          </div>

          {/* Status Text */}
          <div
            style={{
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'IBM Plex Mono, monospace',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--space-xs)',
              }}
            >
              {processingStatus || 'Processing...'}
            </div>
            <div
              style={{
                fontSize: 12,
                fontFamily: 'IBM Plex Mono, monospace',
                color: 'var(--color-text-secondary)',
              }}
            >
              {Math.round(uploadProgress)}% complete
            </div>
          </div>

          {/* Processing Steps Indicator */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-sm)',
              marginTop: 'var(--space-md)',
            }}
          >
            {['Uploading', 'EXIF', 'AI Analysis', 'Saving'].map((step, index) => {
              const stepProgress = uploadProgress / 25; // Divide into 4 steps
              const isComplete = uploadProgress > (index + 1) * 25;
              const isActive = uploadProgress > index * 25 && uploadProgress <= (index + 1) * 25;

              return (
                <div
                  key={step}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: isComplete
                        ? 'var(--color-success)'
                        : isActive
                          ? 'var(--color-accent)'
                          : 'var(--color-line-light)',
                      transition: 'background 0.3s ease',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: 'IBM Plex Mono, monospace',
                      color: isComplete || isActive
                        ? 'var(--color-text-primary)'
                        : 'var(--color-text-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Idle State */
        <div className="drop-zone-content">
          {/* Icon */}
          <div
            style={{
              width: 64,
              height: 64,
              marginBottom: 'var(--space-lg)',
              opacity: isDragOver ? 1 : 0.5,
              transition: 'opacity 0.2s ease',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: '100%', height: '100%' }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          {/* Text */}
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              fontFamily: 'IBM Plex Mono, monospace',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-xs)',
            }}
          >
            {isDragOver ? 'Drop photos here' : 'Drag & drop photos'}
          </div>

          <div
            style={{
              fontSize: 12,
              fontFamily: 'IBM Plex Mono, monospace',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-md)',
            }}
          >
            or click to browse
          </div>

          {/* File requirements */}
          <div
            style={{
              fontSize: 10,
              fontFamily: 'IBM Plex Mono, monospace',
              color: 'var(--color-text-tertiary)',
              textAlign: 'center',
            }}
          >
            <div>JPEG, PNG, WebP, HEIC</div>
            <div>Max {maxFileSizeMB}MB per file • Up to {maxFiles} files</div>
          </div>
        </div>
      )}

      {/* Drag over overlay effect */}
      {isDragOver && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 102, 255, 0.05)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

export default DropZone;
