import React, { useState } from 'react';
import { Save, Layout, Globe, FileText } from 'lucide-react';
import type { SafariPhoto } from '../../types';

interface GallerySettingsProps {
  photos: SafariPhoto[];
  selectedPhoto: SafariPhoto | null;
  onUpdatePhoto: (id: string, updates: Partial<SafariPhoto>) => void;
  onBatchUpdate: (photoIds: string[], updates: Partial<SafariPhoto>) => void;
}

export function GallerySettings({
  photos,
  selectedPhoto,
  onUpdatePhoto,
  onBatchUpdate,
}: GallerySettingsProps) {
  const [layout, setLayout] = useState<SafariPhoto['galleryLayout']>('tiles');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load selected photo's settings
  useEffect(() => {
    if (selectedPhoto) {
      setLayout(selectedPhoto.galleryLayout || 'tiles');
      setMetaTitle(selectedPhoto.metaTitle || '');
      setMetaDescription(selectedPhoto.metaDescription || '');
      setHasChanges(false);
    }
  }, [selectedPhoto?.id]);

  const handleLayoutChange = (value: SafariPhoto['galleryLayout']) => {
    setLayout(value);
    setHasChanges(true);
  };

  const handleMetaTitleChange = (value: string) => {
    setMetaTitle(value);
    setHasChanges(true);
  };

  const handleMetaDescriptionChange = (value: string) => {
    setMetaDescription(value);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!selectedPhoto) return;
    
    onUpdatePhoto(selectedPhoto.id, {
      galleryLayout: layout,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
    });
    
    setLastSaved(new Date());
    setHasChanges(false);
  };

  const handleBatchApply = () => {
    // Apply settings to all photos
    const allPhotoIds = photos.map(p => p.id);
    onBatchUpdate(allPhotoIds, {
      galleryLayout: layout,
    });
    setLastSaved(new Date());
    setHasChanges(false);
  };

  return (
    <div className="gallery-settings">
      <div className="settings-header">
        <h2 className="settings-title">
          <Layout size={20} />
          Design Settings
        </h2>
        {hasChanges && (
          <span className="unsaved-indicator">Unsaved changes</span>
        )}
        {lastSaved && (
          <span className="saved-indicator">
            Saved {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Design Tab */}
      <div className="settings-section">
        <h3 className="settings-section-title">
          <Layout size={16} />
          Frontend Layout
        </h3>
        
        <div className="layout-selector-large">
          <label className={`layout-option ${layout === 'tiles' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="layout"
              value="tiles"
              checked={layout === 'tiles'}
              onChange={() => handleLayoutChange('tiles')}
            />
            <div className="layout-preview tiles">
              <div></div>
              <div></div>
              <div></div>
            </div>
            <span>Tiles</span>
          </label>

          <label className={`layout-option ${layout === 'filmstrip' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="layout"
              value="filmstrip"
              checked={layout === 'filmstrip'}
              onChange={() => handleLayoutChange('filmstrip')}
            />
            <div className="layout-preview filmstrip">
              <div></div>
              <div></div>
              <div></div>
            </div>
            <span>Filmstrip</span>
          </label>

          <label className={`layout-option ${layout === 'storyMap' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="layout"
              value="storyMap"
              checked={layout === 'storyMap'}
              onChange={() => handleLayoutChange('storyMap')}
            />
            <div className="layout-preview story-map">
              <div></div>
              <div></div>
              <div></div>
            </div>
            <span>Story Map</span>
          </label>
        </div>

        <button
          className="btn btn-secondary"
          onClick={handleBatchApply}
          disabled={photos.length === 0}
        >
          Apply to All Photos
        </button>
      </div>

      {/* SEO Settings */}
      <div className="settings-section">
        <h3 className="settings-section-title">
          <Globe size={16} />
          SEO Settings
        </h3>

        <div className="settings-field">
          <label>Gallery Meta Title</label>
          <input
            type="text"
            value={metaTitle}
            onChange={(e) => handleMetaTitleChange(e.target.value)}
            placeholder="Enter SEO title..."
            maxLength={60}
          />
          <span className="char-count">{metaTitle.length}/60</span>
        </div>

        <div className="settings-field">
          <label>Gallery Meta Description</label>
          <textarea
            value={metaDescription}
            onChange={(e) => handleMetaDescriptionChange(e.target.value)}
            placeholder="Enter SEO description..."
            rows={3}
            maxLength={160}
          />
          <span className="char-count">{metaDescription.length}/160</span>
        </div>
      </div>

      {/* Save Button */}
      <div className="settings-footer">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!hasChanges || !selectedPhoto}
        >
          <Save size={16} />
          Save Settings
        </button>
      </div>
    </div>
  );
}

export default GallerySettings;
