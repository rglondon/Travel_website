import React, { useState } from 'react';
import { ChevronDown, Search, Grid, List, Layout, Settings, GripVertical } from 'lucide-react';
import type { SafariPhoto } from '../../types';

interface GallerySidebarProps {
  photos: SafariPhoto[];
  selectedPhoto: SafariPhoto | null;
  onSelectPhoto: (photo: SafariPhoto) => void;
  onSearch: (query: string) => void;
  onCategoryChange: (category: string | null) => void;
  onLayoutChange: (layout: 'tiles' | 'filmstrip' | 'storyMap') => void;
  currentLayout: 'tiles' | 'filmstrip' | 'storyMap';
  categories: string[];
  selectedCategory: string | null;
}

export function GallerySidebar({
  photos,
  selectedPhoto,
  onSelectPhoto,
  onSearch,
  onCategoryChange,
  onLayoutChange,
  currentLayout,
  categories,
  selectedCategory,
}: GallerySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPublishedExpanded, setIsPublishedExpanded] = useState(true);
  const [isDraftExpanded, setIsDraftExpanded] = useState(true);

  // Version 1.8: Separate published and draft photos
  const publishedPhotos = photos.filter((p) => p.isPublished);
  const draftPhotos = photos.filter((p) => !p.isPublished);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  // Version 1.8: Format metadata - show all available EXIF data
  const formatMetadata = (photo: SafariPhoto) => {
    const parts: string[] = [];
    
    // Camera Model (from exifData or photographer)
    if (photo.exifData?.cameraModel) {
      parts.push(photo.exifData.cameraModel);
    } else if (photo.photographer) {
      parts.push(photo.photographer);
    }
    
    // If no metadata, show extracting message
    if (parts.length === 0) {
      return 'Extracting EXIF...';
    }
    
    return parts.join(' | ');
  };

  const PhotoItem = ({ photo, isPublished }: { photo: SafariPhoto; isPublished: boolean }) => (
    <div
      className={`sidebar-photo-item ${selectedPhoto?.id === photo.id ? 'selected' : ''}`}
      onClick={() => onSelectPhoto(photo)}
    >
      <div className="drag-handle" title="Drag to reorder">
        <GripVertical size={14} />
      </div>
      <img
        src={photo.thumbnailUrl || photo.imageUrl}
        alt={photo.altText || 'Photo'}
        className="sidebar-thumbnail"
        loading="lazy"
      />
      <div className="sidebar-photo-info">
        <span className="sidebar-photo-title">
          {photo.altText || 'Untitled'}
        </span>
        <span className="sidebar-photo-meta">
          {formatMetadata(photo)}
        </span>
      </div>
    </div>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">
          <Layout size={20} />
          GALLERY
        </h2>
        <button className="icon-button" aria-label="Settings">
          <Settings size={20} />
        </button>
      </div>

      {/* Version 1.8: Published Bin */}
      <div className="sidebar-section">
        <button
          className="sidebar-section-header"
          onClick={() => setIsPublishedExpanded(!isPublishedExpanded)}
        >
          <span className="section-title">
            <span className="status-indicator published"></span>
            PUBLISHED
          </span>
          <span className="count-badge">{publishedPhotos.length}</span>
          <ChevronDown
            size={16}
            className={`chevron ${isPublishedExpanded ? 'expanded' : ''}`}
          />
        </button>

        {isPublishedExpanded && (
          <div className="sidebar-photo-list">
            {publishedPhotos.length === 0 ? (
              <div className="empty-state">No published photos</div>
            ) : (
              publishedPhotos.map((photo) => (
                <PhotoItem key={photo.id} photo={photo} isPublished={true} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Version 1.8: Draft Bin */}
      <div className="sidebar-section">
        <button
          className="sidebar-section-header"
          onClick={() => setIsDraftExpanded(!isDraftExpanded)}
        >
          <span className="section-title">
            <span className="status-indicator draft"></span>
            DRAFT
          </span>
          <span className="count-badge draft">{draftPhotos.length}</span>
          <ChevronDown
            size={16}
            className={`chevron ${isDraftExpanded ? 'expanded' : ''}`}
          />
        </button>

        {isDraftExpanded && (
          <div className="sidebar-photo-list">
            {draftPhotos.length === 0 ? (
              <div className="empty-state">No draft photos</div>
            ) : (
              draftPhotos.map((photo) => (
                <PhotoItem key={photo.id} photo={photo} isPublished={false} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Layout Selector */}
      <div className="sidebar-footer">
        <div className="layout-selector">
          <button
            className={`layout-button ${currentLayout === 'tiles' ? 'active' : ''}`}
            onClick={() => onLayoutChange('tiles')}
            title="Tiles Layout"
          >
            <Grid size={18} />
          </button>
          <button
            className={`layout-button ${currentLayout === 'filmstrip' ? 'active' : ''}`}
            onClick={() => onLayoutChange('filmstrip')}
            title="Filmstrip Layout"
          >
            <List size={18} />
          </button>
          <button
            className={`layout-button ${currentLayout === 'storyMap' ? 'active' : ''}`}
            onClick={() => onLayoutChange('storyMap')}
            title="Story Map Layout"
          >
            <Layout size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default GallerySidebar;
