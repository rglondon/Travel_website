/**
 * QuickEditSidebar Component
 * Slide-out sidebar for photo editing with telemetry and AI suggestions
 */

import React, { useState, useEffect } from 'react';
import { SafariPhoto, AISuggestions, EXIFData, GPSData } from '../../types';
import { AIBrainSection } from './AIBrainSection';

interface QuickEditSidebarProps {
  photo: SafariPhoto | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (photoId: string, updates: Partial<SafariPhoto>) => Promise<void>;
  onDelete: (photoId: string) => Promise<void>;
}

export const QuickEditSidebar: React.FC<QuickEditSidebarProps> = ({
  photo,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'telemetry' | 'ai'>('details');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<SafariPhoto>>({});
  const [gpsData, setGpsData] = useState<Partial<GPSData>>({});
  const [approvedKeywords, setApprovedKeywords] = useState<string[]>([]);

  // Reset form when photo changes
  useEffect(() => {
    if (photo) {
      setFormData({
        caption: photo.caption,
        altText: photo.altText,
        storyContext: photo.storyContext,
        location: photo.location,
        category: photo.category,
        tags: photo.tags,
        displayOrder: photo.displayOrder,
        isPublished: photo.isPublished,
        isFeatured: photo.isFeatured,
        views: photo.views,
        likes: photo.likes,
        shares: photo.shares,
        downloads: photo.downloads,
      });
      setGpsData(photo.gpsData || {});
      setApprovedKeywords(
        photo.aiSuggestions?.keywords
          .filter(k => k.approved)
          .map(k => k.value) || []
      );
      setHasChanges(false);
    }
  }, [photo]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleGpsChange = (field: string, value: number | undefined) => {
    setGpsData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!photo) return;

    setIsSaving(true);
    try {
      await onSave(photo.id, {
        ...formData,
        gpsData: gpsData as GPSData,
        aiSuggestions: {
          ...photo.aiSuggestions,
          keywords: photo.aiSuggestions?.keywords.map(k => ({
            ...k,
            approved: approvedKeywords.includes(k.value),
          })) || [],
          altText: {
            ...photo.aiSuggestions?.altText,
            approved: true, // Mark as approved when saving
          },
          caption: {
            ...photo.aiSuggestions?.caption,
            approved: true,
          },
          storyContext: {
            ...photo.aiSuggestions?.storyContext,
            approved: true,
          },
        },
      });
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!photo) return;
    if (!window.confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(photo.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  if (!photo) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(26, 26, 26, 0.3)',
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transition: 'all 0.2s ease',
          zIndex: 99,
        }}
      />

      {/* Sidebar */}
      <div
        className={`sidebar ${isOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: 380,
          background: 'var(--color-bg-surface)',
          borderLeft: '1px solid var(--color-line)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Header */}
        <div
          className="sidebar-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-md)',
            borderBottom: '1px solid var(--color-line-light)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span
              style={{
                fontSize: 10,
                fontFamily: 'IBM Plex Mono, monospace',
                color: 'var(--color-text-tertiary)',
              }}
            >
              EDITING
            </span>
            <span
              style={{
                fontSize: 10,
                fontFamily: 'IBM Plex Mono, monospace',
                padding: '2px 6px',
                background: 'var(--color-accent-light)',
                color: 'var(--color-accent)',
                borderRadius: 2,
              }}
            >
              #{photo.displayOrder}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 'var(--space-xs)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Preview */}
        <div
          style={{
            padding: 'var(--space-md)',
            borderBottom: '1px solid var(--color-line-light)',
          }}
        >
          <img
            src={photo.imageUrl}
            alt={photo.altText || photo.caption || 'Photo'}
            style={{
              width: '100%',
              aspectRatio: '4/3',
              objectFit: 'cover',
              border: '1px solid var(--color-line-light)',
            }}
          />
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-line-light)',
          }}
        >
          {['details', 'telemetry', 'ai'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              style={{
                flex: 1,
                padding: 'var(--space-sm)',
                fontSize: 10,
                fontFamily: 'IBM Plex Mono, monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: activeTab === tab ? 'var(--color-line)' : 'var(--color-bg)',
                color: activeTab === tab ? 'var(--color-bg-surface)' : 'var(--color-text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          className="sidebar-body"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-md)',
          }}
        >
          {activeTab === 'details' && (
            <div className="tab-content">
              {/* Caption */}
              <div className="input-group">
                <label className="input-label">Caption</label>
                <textarea
                  className="input"
                  value={formData.caption || ''}
                  onChange={(e) => handleChange('caption', e.target.value)}
                  rows={3}
                  placeholder="Photo caption..."
                />
              </div>

              {/* Alt Text */}
              <div className="input-group">
                <label className="input-label">Alt Text</label>
                <textarea
                  className="input"
                  value={formData.altText || ''}
                  onChange={(e) => handleChange('altText', e.target.value)}
                  rows={2}
                  placeholder="Accessibility description..."
                />
                <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                  {(formData.altText || '').length} characters
                </div>
              </div>

              {/* Story Context */}
              <div className="input-group">
                <label className="input-label">Story Context</label>
                <textarea
                  className="input"
                  value={formData.storyContext || ''}
                  onChange={(e) => handleChange('storyContext', e.target.value)}
                  rows={5}
                  placeholder="The story behind this photo..."
                />
                <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                  {(formData.storyContext || '').length} characters
                </div>
              </div>

              {/* Location */}
              <div className="input-group">
                <label className="input-label">Location</label>
                <input
                  type="text"
                  className="input"
                  value={formData.location || ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g., Serengeti, Tanzania"
                />
              </div>

              {/* Category */}
              <div className="input-group">
                <label className="input-label">Category</label>
                <select
                  className="input"
                  value={formData.category || ''}
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  <option value="">Select category</option>
                  <option value="wildlife">Wildlife</option>
                  <option value="landscape">Landscape</option>
                  <option value="culture">Culture</option>
                  <option value="accommodation">Accommodation</option>
                  <option value="food">Food</option>
                  <option value="activity">Activity</option>
                  <option value="people">People</option>
                </select>
              </div>

              {/* Tags */}
              <div className="input-group">
                <label className="input-label">Tags (comma-separated)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) => handleChange('tags', e.target.value.split(',').map(t => t.trim()))}
                  placeholder="lion, sunset, serengeti"
                />
              </div>

              {/* Display Order */}
              <div className="input-group">
                <label className="input-label">Display Order</label>
                <input
                  type="number"
                  className="input"
                  value={formData.displayOrder || 0}
                  onChange={(e) => handleChange('displayOrder', parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>

              {/* Toggles */}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-md)',
                  marginTop: 'var(--space-md)',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.isPublished || false}
                    onChange={(e) => handleChange('isPublished', e.target.checked)}
                  />
                  Published
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.isFeatured || false}
                    onChange={(e) => handleChange('isFeatured', e.target.checked)}
                  />
                  Featured
                </label>
              </div>
            </div>
          )}

          {activeTab === 'telemetry' && (
            <div className="tab-content">
              {/* GPS Coordinates */}
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h4
                  style={{
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: 'var(--space-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)',
                  }}
                >
                  📍 GPS Coordinates
                </h4>
                
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--space-sm)',
                  }}
                >
                  <div>
                    <label className="input-label">Latitude</label>
                    <input
                      type="number"
                      className="input"
                      value={gpsData.latitude || ''}
                      onChange={(e) => handleGpsChange('latitude', parseFloat(e.target.value))}
                      step="0.000001"
                      placeholder="-2.3333"
                    />
                  </div>
                  <div>
                    <label className="input-label">Longitude</label>
                    <input
                      type="number"
                      className="input"
                      value={gpsData.longitude || ''}
                      onChange={(e) => handleGpsChange('longitude', parseFloat(e.target.value))}
                      step="0.000001"
                      placeholder="34.8333"
                    />
                  </div>
                </div>
                
                <div style={{ marginTop: 'var(--space-sm)' }}>
                  <label className="input-label">Altitude (meters)</label>
                  <input
                    type="number"
                    className="input"
                    value={gpsData.altitude || ''}
                    onChange={(e) => handleGpsChange('altitude', parseFloat(e.target.value))}
                    step="0.1"
                    placeholder="1500"
                  />
                </div>

                {/* Map Link */}
                {gpsData.latitude && gpsData.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${gpsData.latitude},${gpsData.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm"
                    style={{ marginTop: 'var(--space-sm)', display: 'inline-flex' }}
                  >
                    ↗ View on Maps
                  </a>
                )}
              </div>

              {/* EXIF Data (Read-only) */}
              {photo.exifData && (
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                  <h4
                    style={{
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      marginBottom: 'var(--space-md)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-sm)',
                    }}
                  >
                    📷 EXIF Data
                  </h4>
                  
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {(photo.exifData.cameraMake || photo.exifData.cameraModel) && (
                      <div style={{ marginBottom: 4 }}>
                        {photo.exifData.cameraMake} {photo.exifData.cameraModel}
                      </div>
                    )}
                    {photo.exifData.lens && (
                      <div style={{ marginBottom: 4 }}>
                        {photo.exifData.lens}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
                      {photo.exifData.iso && (
                        <span>ISO {photo.exifData.iso}</span>
                      )}
                      {photo.exifData.aperture && (
                        <span>{photo.exifData.aperture}</span>
                      )}
                      {photo.exifData.shutterSpeed && (
                        <span>{photo.exifData.shutterSpeed}</span>
                      )}
                      {photo.exifData.focalLength && (
                        <span>{photo.exifData.focalLength}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Telemetry */}
              <div>
                <h4
                  style={{
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: 'var(--space-md)',
                  }}
                >
                  📊 Manual Counts
                </h4>
                
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 'var(--space-sm)',
                  }}
                >
                  <div>
                    <label className="input-label">Views</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.views || 0}
                      onChange={(e) => handleChange('views', parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="input-label">Likes</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.likes || 0}
                      onChange={(e) => handleChange('likes', parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="input-label">Shares</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.shares || 0}
                      onChange={(e) => handleChange('shares', parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="input-label">Downloads</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.downloads || 0}
                      onChange={(e) => handleChange('downloads', parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <AIBrainSection
              suggestions={photo.aiSuggestions}
              approvedKeywords={approvedKeywords}
              onApproveKeyword={(k) => setApprovedKeywords(prev => [...prev, k.value])}
              onRejectKeyword={(k) => setApprovedKeywords(prev => prev.filter(v => v !== k.value))}
              onApproveAltText={(v) => handleChange('altText', v)}
              onApproveCaption={(v) => handleChange('caption', v)}
              onApproveStory={(v) => handleChange('storyContext', v)}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="sidebar-footer"
          style={{
            display: 'flex',
            gap: 'var(--space-sm)',
            borderTop: '1px solid var(--color-line-light)',
          }}
        >
          <button
            className="btn btn-sm"
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              borderColor: 'var(--color-error)',
              color: 'var(--color-error)',
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
          <div style={{ flex: 1 }} />
          <button
            className="btn btn-sm"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
};

export default QuickEditSidebar;
