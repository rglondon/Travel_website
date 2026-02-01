/**
 * AdminDashboard - Full dnd-kit implementation with Captions Hub
 */

// RELOADED VERSION 3
console.log('--- RELOADED VERSION 3 ---');

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { callMiniMaxVision, handlePhotoUpload } from '../../services/minimax';

// Initialize Supabase client
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

// Debug: Log environment values (client-side only)
console.log('🔍 Environment Check:');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? '***' : 'NOT SET');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '***' + supabaseAnonKey.slice(-10) : 'NOT SET');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
interface Gallery {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  photoCount: number;
  totalViews: number;
  isActive: boolean;
  isPublished: boolean;
  visibilitySettings: { isPublic: boolean; showOnHomepage: boolean; homepageOrder: number };
  seoSettings: Record<string, unknown>;
  displaySettings: { layout: string; photoPerPage: number; showLocation: boolean; showDate: boolean; showPhotographer: boolean; enableLightbox: boolean; enableDownload: boolean };
  createdAt: Date;
  updatedAt: Date;
}

interface Photo {
  id: string;
  galleryId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  altText?: string;
  fieldJournal?: string;
  displayOrder: number;
  views: number;
  likes: number;
  shares: number;
  isPublished: boolean;
  isFeatured: boolean;
  isAiProcessing?: boolean;
  aiError?: string;
  aiProcessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Icons
const Icons = {
  Grid: () => <span style={{ fontSize: 14 }}>▦</span>,
  List: () => <span style={{ fontSize: 14 }}>≡</span>,
  Upload: () => <span style={{ fontSize: 14 }}>↑</span>,
  Save: () => <span style={{ fontSize: 12 }}>💾</span>,
  Trash: () => <span style={{ fontSize: 12 }}>🗑</span>,
  View: () => <span>👁</span>,
  ViewOff: () => <span style={{ opacity: 0.4 }}>👁</span>, // Hidden/Not published
  Heart: () => <span>♥</span>,
  Share: () => <span>↗</span>,
  Brain: () => <span style={{ fontSize: 12 }}>🧠</span>, // AI Brain icon
  Sparkle: () => <span style={{ fontSize: 12 }}>✨</span>, // AI Processing icon
  Star: () => <span>★</span>, // Cover image selector
  Edit: () => <span>✎</span>, // Edit icon
  Close: () => <span>✕</span>, // Close modal
};

// ============================================================================
// EDIT PHOTO MODAL
// ============================================================================
const EditPhotoModal: React.FC<{
  photo: Photo | null;
  onClose: () => void;
  onSave: (photoId: string, updates: Partial<Photo>) => Promise<void>;
}> = ({ photo, onClose, onSave }) => {
  const [altText, setAltText] = useState('');
  const [fieldJournal, setFieldJournal] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (photo) {
      setAltText(photo.altText || '');
      setFieldJournal(photo.fieldJournal || '');
    }
  }, [photo]);

  if (!photo) return null;

  const handleSave = async () => {
    setSaving(true);
    await onSave(photo.id, { altText, fieldJournal });
    setSaving(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000,
    }} onClick={onClose}>
      <div style={{
        background: '#FFF', width: '90%', maxWidth: '600px', maxHeight: '90vh',
        borderRadius: 4, overflow: 'auto',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid #E5E5E5',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h3 style={{ margin: 0, fontSize: '14px' }}>Edit Photo</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Icons.Close />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
            <img
              src={photo.imageUrl}
              alt={altText}
              style={{ width: '200px', height: '150px', objectFit: 'cover', borderRadius: 4 }}
            />
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 600 }}>
                Alt Text
              </label>
              <textarea
                value={altText}
                onChange={e => setAltText(e.target.value)}
                placeholder="Brief description for accessibility..."
                style={{
                  width: '100%', height: '60px', padding: '8px',
                  border: '1px solid #E5E5E5', borderRadius: 2,
                  fontFamily: 'inherit', fontSize: '12px', resize: 'vertical',
                }}
              />
            </div>
          </div>

          <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 600 }}>
            Field Journal (Story Context)
          </label>
          <textarea
            value={fieldJournal}
            onChange={e => setFieldJournal(e.target.value)}
            placeholder="Tell the story behind this photo..."
            style={{
              width: '100%', height: '150px', padding: '12px',
              border: '1px solid #E5E5E5', borderRadius: 2,
              fontFamily: 'inherit', fontSize: '12px', resize: 'vertical',
            }}
          />
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #E5E5E5',
          display: 'flex', justifyContent: 'flex-end', gap: '12px',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', background: '#E5E5E5', border: 'none',
              cursor: 'pointer', fontSize: '12px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '8px 24px', background: '#0066FF', color: '#FFF',
              border: 'none', cursor: 'pointer', fontSize: '12px',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SORTABLE PHOTO CARD
// ============================================================================
const SortablePhotoCard: React.FC<{
  photo: Photo;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onTogglePublished: () => void;
  onSetFeatured: () => void;
}> = ({ photo, isSelected, onClick, onDelete, onEdit, onTogglePublished, onSetFeatured }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`photo-card ${isSelected ? 'selected' : ''}`}
    >
      <img src={photo.imageUrl} alt={photo.altText || ''} />
      
      {/* AI Processing Overlay */}
      {photo.isAiProcessing && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0, 212, 170, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column',
          animation: 'pulse 1.5s infinite',
        }}>
          <Icons.Sparkle />
          <span style={{
            marginTop: 4, fontSize: 10, fontFamily: 'IBM Plex Mono',
            color: '#00D4AA', background: 'rgba(0,0,0,0.7)',
            padding: '2px 8px', borderRadius: 2,
          }}>
            AI Processing...
          </span>
        </div>
      )}
      
      {/* AI Done Indicator */}
      {!photo.isAiProcessing && (photo.fieldJournal || photo.altText) && (
        <div style={{
          position: 'absolute', top: 32, right: 8,
          width: 20, height: 20, background: '#0066FF', color: '#FFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '50%', fontSize: 10,
        }}>
          <Icons.Brain />
        </div>
      )}
      
      <div className="photo-card-overlay">
        <div className="photo-card-stats">
          <span><Icons.View /> {photo.views}</span>
          <span><Icons.Heart /> {photo.likes}</span>
          <span><Icons.Share /> {photo.shares}</span>
        </div>
      </div>
      
      {/* Order badge */}
      <div style={{
        position: 'absolute', top: 8, left: 8,
        width: 24, height: 24, background: '#1A1A1A', color: '#FFF',
        fontSize: 10, fontFamily: 'IBM Plex Mono', display: 'flex',
        alignItems: 'center', justifyContent: 'center', borderRadius: 2,
      }}>
        {photo.displayOrder}
      </div>

      {/* Featured/Cover Star */}
      <button
        onClick={(e) => { e.stopPropagation(); onSetFeatured(); }}
        title="Set as cover"
        style={{
          position: 'absolute', top: 8, left: 36,
          width: 24, height: 24, 
          background: photo.isFeatured ? '#FFD700' : 'rgba(26, 26, 26, 0.6)',
          color: photo.isFeatured ? '#000' : '#FFF',
          border: 'none', borderRadius: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', opacity: 0, transition: 'opacity 0.15s',
        }}
        className="action-btn"
      >
        <Icons.Star />
      </button>

      {/* Visibility Toggle (Eye) */}
      <button
        onClick={(e) => { e.stopPropagation(); onTogglePublished(); }}
        title={photo.isPublished ? 'Hide' : 'Show'}
        style={{
          position: 'absolute', top: 8, left: 64,
          width: 24, height: 24, 
          background: photo.isPublished ? 'rgba(26, 26, 26, 0.6)' : 'rgba(255, 68, 68, 0.8)',
          color: '#FFF', border: 'none', borderRadius: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', opacity: 0, transition: 'opacity 0.15s',
        }}
        className="action-btn"
      >
        {photo.isPublished ? <Icons.View /> : <Icons.ViewOff />}
      </button>

      {/* Edit Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        title="Edit details"
        style={{
          position: 'absolute', top: 8, left: 92,
          width: 24, height: 24, background: 'rgba(26, 26, 26, 0.6)',
          color: '#FFF', border: 'none', borderRadius: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', opacity: 0, transition: 'opacity 0.15s',
        }}
        className="action-btn"
      >
        <Icons.Edit />
      </button>

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        style={{
          position: 'absolute', top: 8, right: 8,
          width: 24, height: 24, background: 'rgba(26, 26, 26, 0.8)', color: '#FFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'grab', borderRadius: 2, opacity: 0, transition: 'opacity 0.15s',
        }}
        className="drag-handle"
      >
        ⠿
      </div>

      {/* Show buttons on hover */}
      <style>{`
        .photo-card:hover .action-btn,
        .photo-card:hover .drag-handle {
          opacity: 1 !important;
        }
      `}</style>

      {/* Metadata Section - Displayed below thumbnail */}
      {(photo.altText || photo.fieldJournal) && (
        <div style={{
          padding: '8px',
          background: '#F5F5F5',
          borderTop: '1px solid #E5E5E5',
          fontSize: '10px',
        }}>
          {photo.altText && (
            <div style={{ fontWeight: 500, marginBottom: photo.fieldJournal ? '4px' : 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              📷 {photo.altText}
            </div>
          )}
          {photo.fieldJournal && (
            <div style={{ color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              📝 {photo.fieldJournal}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CAPTIONS HUB - Bulk editing list view
// ============================================================================
const CaptionsHub: React.FC<{
  photos: Photo[];
  onUpdatePhoto: (photoId: string, updates: Partial<Photo>) => Promise<void>;
}> = ({ photos, onUpdatePhoto }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ altText: '', fieldJournal: '' });
  const [saving, setSaving] = useState<string | null>(null);

  const startEdit = (photo: Photo) => {
    setEditingId(photo.id);
    setEditForm({
      altText: photo.altText || '',
      fieldJournal: photo.fieldJournal || '',
    });
  };

  const saveEdit = async (photoId: string) => {
    setSaving(photoId);
    await onUpdatePhoto(photoId, editForm);
    setSaving(null);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ altText: '', fieldJournal: '' });
  };

  return (
    <div style={{ padding: '24px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Captions Hub - Bulk Edit</h3>
      
      {/* Table Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '60px 1fr 1fr 80px',
        gap: '12px',
        padding: '8px 12px',
        background: '#E5E5E5',
        fontSize: '10px',
        fontWeight: 600,
        textTransform: 'uppercase',
        fontFamily: 'IBM Plex Mono',
      }}>
        <span>#</span>
        <span>Alt Text</span>
        <span>Field Journal (Story Context)</span>
        <span>Action</span>
      </div>

      {/* Photo Rows */}
      {photos.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
          No photos in this project yet.
        </div>
      ) : (
        photos.map((photo) => (
          <div
            key={photo.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr 1fr 80px',
              gap: '12px',
              padding: '12px',
              borderBottom: '1px solid #E5E5E5',
              alignItems: 'start',
              background: editingId === photo.id ? '#F5F5F5' : 'transparent',
            }}
          >
            {/* Thumbnail + Order */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img
                src={photo.imageUrl}
                alt=""
                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: 2 }}
              />
              <span style={{ fontSize: '10px', fontFamily: 'IBM Plex Mono' }}>{photo.displayOrder}</span>
            </div>

            {/* Alt Text */}
            <div>
              {editingId === photo.id ? (
                <textarea
                  value={editForm.altText}
                  onChange={(e) => setEditForm(f => ({ ...f, altText: e.target.value }))}
                  placeholder="Enter alt text..."
                  style={{
                    width: '100%', minHeight: '60px', padding: '8px',
                    fontFamily: 'inherit', fontSize: '12px', border: '1px solid #E5E5E5',
                  }}
                />
              ) : (
                <div style={{ fontSize: '12px', color: photo.altText ? '#1A1A1A' : '#999' }}>
                  {photo.altText || <em style={{ color: '#999' }}>No alt text</em>}
                </div>
              )}
            </div>

            {/* Field Journal */}
            <div>
              {editingId === photo.id ? (
                <textarea
                  value={editForm.fieldJournal}
                  onChange={(e) => setEditForm(f => ({ ...f, fieldJournal: e.target.value }))}
                  placeholder="Enter field journal entry..."
                  style={{
                    width: '100%', minHeight: '60px', padding: '8px',
                    fontFamily: 'inherit', fontSize: '12px', border: '1px solid #E5E5E5',
                  }}
                />
              ) : (
                <div style={{ fontSize: '12px', color: photo.fieldJournal ? '#1A1A1A' : '#999' }}>
                  {photo.fieldJournal || <em style={{ color: '#999' }}>No field journal</em>}
                </div>
              )}
            </div>

            {/* Actions */}
            <div>
              {editingId === photo.id ? (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => saveEdit(photo.id)}
                    disabled={saving === photo.id}
                    style={{
                      padding: '4px 8px', fontSize: '10px', background: '#1A1A1A', color: '#FFF',
                      border: 'none', cursor: 'pointer', fontFamily: 'IBM Plex Mono',
                    }}
                  >
                    {saving === photo.id ? '...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={{
                      padding: '4px 8px', fontSize: '10px', background: '#E5E5E5',
                      border: 'none', cursor: 'pointer', fontFamily: 'IBM Plex Mono',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startEdit(photo)}
                  style={{
                    padding: '4px 8px', fontSize: '10px', background: '#F5F5F5',
                    border: '1px solid #E5E5E5', cursor: 'pointer', fontFamily: 'IBM Plex Mono',
                  }}
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        ))
      )}

      <div style={{ marginTop: '16px', fontSize: '10px', color: '#999', fontFamily: 'IBM Plex Mono' }}>
        {photos.length} photos • Click "Edit" to modify Alt Text and Field Journal entries
      </div>
    </div>
  );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================
export const AdminDashboard: React.FC = () => {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [activeTab, setActiveTab] = useState<'photos' | 'captions' | 'settings'>('photos');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [dataSource, setDataSource] = useState<'supabase' | 'mock' | 'loading'>('loading');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const selectedGallery = galleries.find(g => g.id === selectedGalleryId);

  // Load galleries from Supabase (DIRECT FETCH WITH CORS HANDLING)
  const loadGalleries = useCallback(async () => {
    console.log('🔄 Loading galleries from Supabase...');
    
    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('⚠️ Supabase not configured');
      setDataSource('mock');
      loadMockData();
      return;
    }

    try {
      console.log('📡 Making direct REST API call...');
      
      // Direct REST API call
      const response = await fetch(
        `${supabaseUrl}/rest/v1/galleries?is_active=eq.true&order=created_at.desc`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('⚠️ Supabase API error:', response.status, errorText);
        setDataSource('mock');
        loadMockData();
        return;
      }

      const data = await response.json();
      console.log('✅ Supabase connection successful! Data:', data);
      
      // Mark as LIVE if we got a successful response (even if empty)
      setDataSource('supabase');
      
      if (data && data.length > 0) {
        // Use real data from Supabase (only columns that exist)
        setGalleries(data.map((g: { id: string; title: string; slug: string; description?: string; is_published: boolean; is_active: boolean; created_at: string; updated_at: string }) => ({
          id: g.id,
          name: g.title,
          slug: g.slug,
          description: g.description,
          coverImageUrl: undefined,
          photoCount: 0,
          totalViews: 0,
          isActive: g.is_active,
          isPublished: g.is_published,
          visibilitySettings: { isPublic: true, showOnHomepage: false, homepageOrder: 0 },
          seoSettings: {},
          displaySettings: { layout: 'grid', photoPerPage: 20, showLocation: true, showDate: true, showPhotographer: true, enableLightbox: true, enableDownload: false },
          createdAt: new Date(g.created_at),
          updatedAt: new Date(g.updated_at),
        })));
        setSelectedGalleryId(data[0].id);
        loadPhotos(data[0].id);
      } else {
        // Supabase is connected but empty - still LIVE, just no data yet
        console.log('📭 Supabase connected but no galleries found');
        setGalleries([]);
        setPhotos([]);
        setSelectedGalleryId(null);
        setIsLoading(false);
      }
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      console.warn('⚠️ Fetch error:', err.name, err.message);
      setDataSource('mock');
      loadMockData();
    }
  }, []);

  // Load photos for selected gallery (DIRECT FETCH)
  const loadPhotos = async (galleryId: string) => {
    if (!supabaseUrl || !supabaseAnonKey) return;

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/photos?gallery_id=eq.${galleryId}&order=display_order.asc`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.warn('Failed to load photos:', response.status);
        const errorText = await response.text();
        console.warn('Error:', errorText);
        return;
      }

      const data = await response.json();
      console.log('📷 Photos loaded:', data?.length || 0);
      
      if (data && data.length > 0) {
        setPhotos(data.map((p: { id: string; gallery_id: string; image_url: string; alt_text?: string; field_journal?: string; display_order?: number; is_published?: boolean; is_featured?: boolean; views?: number; likes?: number; shares?: number; created_at: string; updated_at?: string }) => ({
          id: p.id,
          galleryId: p.gallery_id,
          imageUrl: p.image_url,
          altText: p.alt_text || '',
          fieldJournal: p.field_journal || '',
          displayOrder: p.display_order || 0,
          isPublished: p.is_published !== false,
          isFeatured: p.is_featured || false,
          views: p.views || 0,
          likes: p.likes || 0,
          shares: p.shares || 0,
          createdAt: new Date(p.created_at),
          updatedAt: p.updated_at ? new Date(p.updated_at) : new Date(p.created_at),
        })));
        console.log('✅ Photos set to state');
      }
    } catch (error) {
      console.warn('Failed to load photos:', error);
    }
  };

  // Mock data fallback
  const loadMockData = () => {
    const mockGalleries: Gallery[] = [
      {
        id: '1', name: 'Varanasi', slug: 'varanasi', description: 'A visual journey through the ghats',
        coverImageUrl: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=300',
        photoCount: 24, isActive: true, isPublished: true,
        visibilitySettings: { isPublic: true, showOnHomepage: true, homepageOrder: 0 },
        seoSettings: { metaTitle: 'Varanasi' },
        displaySettings: { layout: 'grid', photoPerPage: 20, showLocation: true, showDate: true, showPhotographer: true, enableLightbox: true, enableDownload: false },
        totalViews: 12450, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-15'),
      },
      {
        id: '2', name: 'Masai Mara', slug: 'masai-mara', description: 'Wildlife encounters',
        coverImageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=300',
        photoCount: 48, isActive: true, isPublished: true,
        visibilitySettings: { isPublic: true, showOnHomepage: true, homepageOrder: 0 },
        seoSettings: { metaTitle: 'Masai Mara' },
        displaySettings: { layout: 'grid', photoPerPage: 20, showLocation: true, showDate: true, showPhotographer: true, enableLightbox: true, enableDownload: false },
        totalViews: 3210, createdAt: new Date('2024-01-05'), updatedAt: new Date('2024-01-20'),
      },
    ];

    const mockPhotos: Photo[] = [
      { id: '1', galleryId: '2', imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400', altText: 'Lion in Serengeti', fieldJournal: 'Male lion resting in the afternoon heat.', displayOrder: 1, views: 1247, likes: 89, shares: 12, isPublished: true, isFeatured: true, createdAt: new Date(), updatedAt: new Date() },
      { id: '2', galleryId: '2', imageUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400', altText: 'Elephant family', fieldJournal: 'Matriarch leading herd to water hole.', displayOrder: 2, views: 892, likes: 67, shares: 8, isPublished: true, isFeatured: false, createdAt: new Date(), updatedAt: new Date() },
      { id: '3', galleryId: '2', imageUrl: 'https://images.unsplash.com/photo-1504618223053-559bdef9dd5a?w=400', altText: 'Zebra migration', fieldJournal: 'Zebras on the move during Great Migration.', displayOrder: 3, views: 2103, likes: 156, shares: 34, isPublished: true, isFeatured: true, createdAt: new Date(), updatedAt: new Date() },
    ];

    setGalleries(mockGalleries);
    setSelectedGalleryId('2');
    setPhotos(mockPhotos);
    setDataSource('mock');
    setIsLoading(false);
  };

  // Initial load
  useEffect(() => {
    loadGalleries();
  }, [loadGalleries]);

  // Handle gallery selection
  const handleSelectGallery = (galleryId: string) => {
    setSelectedGalleryId(galleryId);
    setSelectedPhotoId(null);
    setActiveTab('photos');
    loadPhotos(galleryId);
  };

  // =========================================================================
  // DRAG AND DROP REORDERING - PERSISTS TO DATABASE
  // =========================================================================
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = photos.findIndex(p => p.id === active.id);
      const newIndex = photos.findIndex(p => p.id === over.id);

      // 1. Reorder locally for instant feedback
      const newPhotos = arrayMove(photos, oldIndex, newIndex);
      const updatedPhotos = newPhotos.map((photo, index) => ({
        ...photo,
        displayOrder: index + 1,
      }));

      setPhotos(updatedPhotos);
      setSelectedPhotoId(null);
      setSaveStatus('success'); // Show toast

      // 2. Persist to Supabase
      if (selectedGalleryId) {
        const photoOrders = updatedPhotos.map((photo) => ({
          photo_id: photo.id,
          display_order: photo.displayOrder,
        }));

        try {
          // Call RPC function for bulk update
          const { error } = await supabase.rpc('reorder_photos', {
            p_gallery_id: selectedGalleryId,
            p_photo_orders: photoOrders,
          });

          if (error) throw error;
          console.log('✅ Photo order persisted to Supabase');
          setSaveStatus('success');
        } catch (error) {
          console.error('Failed to persist reorder:', error);
          setSaveStatus('error');
          // Fallback: update individually
          for (const photo of updatedPhotos) {
            await supabase
              .from('photos')
              .update({ display_order: photo.displayOrder, updated_at: new Date().toISOString() })
              .eq('id', photo.id);
          }
        }
      }

      // Auto-hide toast after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  // =========================================================================
  // UPDATE PHOTO (for Captions Hub)
  // =========================================================================
  const handleUpdatePhoto = async (photoId: string, updates: Partial<Photo>) => {
    try {
      const { error } = await supabase
        .from('photos')
        .update({
          alt_text: updates.altText,
          field_journal: updates.fieldJournal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', photoId);

      if (error) throw error;

      // Update local state
      setPhotos(prev => prev.map(p =>
        p.id === photoId ? { ...p, ...updates, updatedAt: new Date() } : p
      ));

      return { success: true };
    } catch (error) {
      console.error('Failed to update photo:', error);
      return { success: false, error };
    }
  };

  // =========================================================================
  // TOGGLE PUBLISHED (Visibility)
  // =========================================================================
  const handleTogglePublished = async (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;

    const newPublished = !photo.isPublished;

    try {
      const { error } = await supabase
        .from('photos')
        .update({ is_published: newPublished, updated_at: new Date().toISOString() })
        .eq('id', photoId);

      if (error) throw error;

      // Update local state
      setPhotos(prev => prev.map(p =>
        p.id === photoId ? { ...p, isPublished: newPublished, updatedAt: new Date() } : p
      ));

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to toggle published:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  // =========================================================================
  // SET FEATURED (Cover Image)
  // =========================================================================
  const handleSetFeatured = async (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;

    try {
      // First, clear featured from all photos in this gallery
      await supabase
        .from('photos')
        .update({ is_featured: false, updated_at: new Date().toISOString() })
        .eq('gallery_id', selectedGalleryId);

      // Then set this photo as featured
      const { error } = await supabase
        .from('photos')
        .update({ is_featured: true, updated_at: new Date().toISOString() })
        .eq('id', photoId);

      if (error) throw error;

      // Update local state
      setPhotos(prev => prev.map(p => ({
        ...p,
        isFeatured: p.id === photoId,
        updatedAt: new Date(),
      })));

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to set featured:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  // =========================================================================
  // DELETE PHOTO
  // =========================================================================
  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      // Get photo data first
      const { data: photo } = await supabase
        .from('photos')
        .select('image_url')
        .eq('id', photoId)
        .single();

      // Delete from storage
      if (photo?.image_url) {
        const fileName = photo.image_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('galleries').remove([fileName]);
        }
      }

      // Delete database record
      const { error } = await supabase.from('photos').delete().eq('id', photoId);
      if (error) throw error;

      // Update local state
      setPhotos(prev => {
        const updated = prev.filter(p => p.id !== photoId);
        // Reorder remaining photos
        return updated.map((p, i) => ({ ...p, displayOrder: i + 1 }));
      });
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  };

  // =========================================================================
  // CREATE NEW GALLERY
  // =========================================================================
  const handleCreateGallery = async () => {
    // Only include columns that exist in the database schema
    const newGallery = {
      title: 'New Project',
      slug: `new-project-${Date.now()}`,
      description: '',
      is_published: false,
      is_active: true,
    };

    try {
      const { data, error } = await supabase
        .from('galleries')
        .insert(newGallery)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        alert(`Failed to create gallery: ${error.message}`);
        return;
      }

      console.log('✅ Gallery created:', data);

      // Add the new gallery to state with proper mapping
      const mappedGallery: Gallery = {
        id: data.id,
        name: data.title,
        slug: data.slug,
        description: data.description,
        coverImageUrl: undefined,
        photoCount: 0,
        totalViews: 0,
        isActive: data.is_active,
        isPublished: data.is_published,
        visibilitySettings: { isPublic: true, showOnHomepage: false, homepageOrder: 0 },
        seoSettings: {},
        displaySettings: { layout: 'grid', photoPerPage: 20, showLocation: true, showDate: true, showPhotographer: true, enableLightbox: true, enableDownload: false },
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setGalleries(prev => [...prev, mappedGallery]);
      setSelectedGalleryId(data.id);
      setPhotos([]); // Clear photos for new gallery
      setActiveTab('photos');
    } catch (error) {
      console.error('Failed to create gallery:', error);
      alert(`Error creating gallery: ${error}`);
    }
  };

  // =========================================================================
  // DELETE GALLERY
  // =========================================================================
  const handleDeleteGallery = async (galleryId: string) => {
    if (!confirm('Are you sure? This will delete all photos in the gallery.')) return;

    try {
      const { error } = await supabase.from('galleries').delete().eq('id', galleryId);
      if (error) throw error;

      setGalleries(prev => prev.filter(g => g.id !== galleryId));
      if (selectedGalleryId === galleryId) {
        setSelectedGalleryId(null);
        setPhotos([]);
      }
    } catch (error) {
      console.error('Failed to delete gallery:', error);
    }
  };

  // =========================================================================
  // UPLOAD PHOTO WITH AI PROCESSING
  // =========================================================================
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedGalleryId) return;

    const file = files[0];
    const gallery = galleries.find(g => g.id === selectedGalleryId);
    if (!gallery) return;

    setUploadStatus('Uploading...');

    try {
      // Create a preview URL for immediate display
      const previewUrl = URL.createObjectURL(file);
      const tempPhoto: Photo = {
        id: `temp-${Date.now()}`,
        galleryId: selectedGalleryId,
        imageUrl: previewUrl,
        displayOrder: photos.length + 1,
        views: 0,
        likes: 0,
        shares: 0,
        isPublished: true,
        isFeatured: false,
        isAiProcessing: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add temporary photo to UI
      setPhotos(prev => [...prev, tempPhoto]);
      setUploadStatus('AI analyzing...');

      // Get gallery context for AI
      const galleryContext = {
        title: gallery.name,
        description: gallery.description || '',
        projectContext: gallery.projectContext,
      };

      // Call MiniMax Vision API
      const aiResult = await callMiniMaxVision(previewUrl, galleryContext);

      // Add to Supabase with AI results
      const { data: photoRecord, error: dbError } = await supabase
        .from('photos')
        .insert({
          gallery_id: selectedGalleryId,
          image_url: previewUrl, // In production, upload to Supabase Storage first
          alt_text: aiResult.altText || '',
          field_journal: aiResult.fieldJournal || '',
          display_order: photos.length + 1,
          is_published: true,
          ai_processed: true,
          ai_model: 'MiniMax M2.1 Vision',
          ai_processed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Replace temporary photo with real one
      setPhotos(prev => prev.map(p => 
        p.id === tempPhoto.id 
          ? {
              ...p,
              id: photoRecord.id,
              imageUrl: photoRecord.image_url,
              altText: aiResult.altText || '',
              fieldJournal: aiResult.fieldJournal || '',
              isAiProcessing: false,
              aiProcessedAt: new Date(),
            }
          : p
      ));

      setUploadStatus('Done!');
      setTimeout(() => setUploadStatus(null), 2000);

    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Upload failed:', err.message);
      setUploadStatus(`Error: ${err.message || 'Upload failed'}`);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#FAFAFA', fontFamily: "'IBM Plex Mono', monospace" }}>
      {/* SIDEBAR */}
      <div style={{ width: '280px', background: '#FFFFFF', borderRight: '1px solid #E5E5E5', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #E5E5E5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Projects</h3>
          <button
            onClick={handleCreateGallery}
            style={{
              padding: '4px 8px', fontSize: '10px', background: '#1A1A1A', color: '#FFF',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px',
            }}
          >
            <Icons.Upload /> New
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {galleries.map(gallery => (
            <div
              key={gallery.id}
              onClick={() => handleSelectGallery(gallery.id)}
              style={{
                padding: '8px 12px', cursor: 'pointer', borderRadius: '2px', marginBottom: '4px',
                background: gallery.id === selectedGalleryId ? '#F5F5F5' : 'transparent',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 500 }}>{gallery.name}</div>
              <div style={{ fontSize: '10px', color: '#999' }}>{gallery.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* TOP BAR */}
        <div style={{ padding: '16px 24px', background: '#FFFFFF', borderBottom: '1px solid #E5E5E5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px' }}>{selectedGallery?.name || 'Select a Project'}</h2>
            <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>{selectedGallery?.description}</div>
          </div>
          <div style={{ display: 'flex', gap: '24px', fontSize: '12px', alignItems: 'center' }}>
            <span><strong>{photos.length}</strong> PHOTOS</span>
            <span><strong>{photos.filter(p => p.isPublished).length}</strong> PUBLISHED</span>
            <span><strong>{photos.reduce((s, p) => s + p.views, 0).toLocaleString()}</strong> VIEWS</span>
            <span style={{ 
              padding: '2px 8px', 
              fontSize: '10px', 
              background: dataSource === 'supabase' ? '#00D4AA' : '#FF6B35',
              color: '#FFF',
              borderRadius: '2px',
              fontFamily: 'IBM Plex Mono',
            }}>
              {dataSource === 'supabase' ? '● LIVE' : '● MOCK'}
            </span>
          </div>

          {/* EMERGENCY UPLOAD BUTTON - Always Visible */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              marginLeft: '24px',
              padding: '8px 20px',
              fontSize: '12px',
              fontFamily: 'inherit',
              background: '#FF0000',
              color: '#FFF',
              border: '4px solid #FF0000',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 'bold',
            }}
          >
            <span style={{ fontSize: 16 }}>↑</span> UPLOAD PHOTO
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          
          {/* Toast Notification */}
          {saveStatus === 'success' && (
            <div style={{
              position: 'fixed', top: '80px', right: '24px',
              background: '#00D4AA', color: '#FFF', padding: '8px 16px',
              fontSize: '12px', fontFamily: 'IBM Plex Mono',
              borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '8px',
              animation: 'fadeIn 0.2s ease',
              zIndex: 9999,
            }}>
              <span>✓</span> Saved
            </div>
          )}
          {saveStatus === 'error' && (
            <div style={{
              position: 'fixed', top: '80px', right: '24px',
              background: '#FF4444', color: '#FFF', padding: '8px 16px',
              fontSize: '12px', fontFamily: 'IBM Plex Mono',
              borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '8px',
              animation: 'fadeIn 0.2s ease',
              zIndex: 9999,
            }}>
              <span>✗</span> Error saving
            </div>
          )}
        </div>

        {/* TABS */}
        <div style={{ padding: '0 24px', background: '#FFFFFF', borderBottom: '1px solid #E5E5E5', display: 'flex', gap: '4px', alignItems: 'center' }}>
          {(['photos', 'captions', 'settings'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px', fontSize: '11px', fontFamily: 'inherit',
                background: activeTab === tab ? '#1A1A1A' : 'transparent',
                color: activeTab === tab ? '#FFF' : '#1A1A1A',
                border: 'none', cursor: 'pointer', textTransform: 'capitalize',
              }}
            >
              {tab === 'photos' && <span style={{ marginRight: 4 }}><Icons.Grid /></span>}
              {tab === 'captions' && <span style={{ marginRight: 4 }}><Icons.List /></span>}
              {tab === 'settings' && <span style={{ marginRight: 4 }}>⚙</span>}
              {tab}
            </button>
          ))}

          {/* Upload Button */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {uploadStatus && (
              <span style={{ fontSize: '10px', color: uploadStatus.includes('Error') ? '#FF4444' : '#00D4AA' }}>
                {uploadStatus}
              </span>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '8px 16px', fontSize: '11px', fontFamily: 'inherit',
                background: '#1A1A1A', color: '#FFF',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              <Icons.Upload /> Upload Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* CONTENT AREA */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {isLoading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>Loading...</div>
          ) : activeTab === 'photos' ? (
            /* PHOTO GRID WITH DRAG-AND-DROP */
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={photos.map(p => p.id)} strategy={rectSortingStrategy}>
                <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  {photos.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', padding: '48px', textAlign: 'center', color: '#999' }}>
                      No photos yet. Click "Upload" to add photos.
                    </div>
                  ) : (
                    photos.map(photo => (
                      <SortablePhotoCard
                        key={photo.id}
                        photo={photo}
                        isSelected={photo.id === selectedPhotoId}
                        onClick={() => setSelectedPhotoId(photo.id)}
                        onDelete={() => handleDeletePhoto(photo.id)}
                        onEdit={() => setEditingPhoto(photo)}
                        onTogglePublished={() => handleTogglePublished(photo.id)}
                        onSetFeatured={() => handleSetFeatured(photo.id)}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          ) : activeTab === 'captions' ? (
            /* CAPTIONS HUB - LIST VIEW FOR BULK EDITING */
            <CaptionsHub photos={photos} onUpdatePhoto={handleUpdatePhoto} />
          ) : (
            /* SETTINGS */
            <div style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0' }}>Project Settings</h3>
              <p style={{ color: '#999' }}>Settings panel coming soon...</p>
              <button
                onClick={() => selectedGalleryId && handleDeleteGallery(selectedGalleryId)}
                style={{
                  marginTop: '24px', padding: '8px 16px', background: '#FF4444', color: '#FFF',
                  border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit',
                }}
              >
                <Icons.Trash /> Delete Project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* DEBUG PANEL - Shows connection info */}
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.85)',
        color: '#FFF',
        padding: '12px',
        fontSize: '10px',
        fontFamily: 'IBM Plex Mono',
        borderRadius: '4px',
        maxWidth: '320px',
        zIndex: 9999,
      }}>
        <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>DEBUG PANEL</strong>
          <button 
            onClick={() => {
              const url = import.meta.env?.VITE_SUPABASE_URL || '';
              const key = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';
              alert(`Supabase URL: ${url}\nKey: ${key ? key.substring(0, 20) + '...' : 'NOT SET'}`);
            }}
            style={{ background: '#333', border: 'none', color: '#FFF', padding: '2px 6px', cursor: 'pointer', fontSize: '9px' }}
          >
            SHOW ENV
          </button>
        </div>
        <div>URL: {supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : '❌ NOT SET'}</div>
        <div>Key: {supabaseAnonKey ? '✅ SET' : '❌ NOT SET'}</div>
        <div style={{ marginTop: '8px', color: dataSource === 'supabase' ? '#00D4AA' : '#FF6B35' }}>
          Source: {dataSource.toUpperCase()}
        </div>
        {dataSource === 'mock' && (
          <div style={{ marginTop: '8px', fontSize: '8px', color: '#FF6B35' }}>
            ⚠️ Check console for CORS/RLS errors
            <br />
            📝 Ensure Supabase CORS includes:
            <br />
            http://localhost:5173
            <br />
            http://95.216.147.140:5173
          </div>
        )}
        <div style={{ marginTop: '8px', fontSize: '9px', color: '#999' }}>
          {dataSource === 'supabase' ? '✅ Browser connected to Supabase!' : '💡 Browser DNS → Supabase'}
        </div>
      </div>

      {/* EDIT PHOTO MODAL */}
      <EditPhotoModal
        photo={editingPhoto}
        onClose={() => setEditingPhoto(null)}
        onSave={handleUpdatePhoto}
      />

      {/* DEBUG PANEL */}
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.85)',
        color: '#FFF',
        padding: '12px',
        fontSize: '10px',
        fontFamily: 'IBM Plex Mono',
        borderRadius: '4px',
        maxWidth: '320px',
        zIndex: 9999,
      }}>
        <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>DEBUG PANEL</strong>
          <button 
            onClick={() => {
              const url = import.meta.env?.VITE_SUPABASE_URL || '';
              const key = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';
              alert(`Supabase URL: ${url}\nKey: ${key ? key.substring(0, 20) + '...' : 'NOT SET'}`);
            }}
            style={{ background: '#333', border: 'none', color: '#FFF', padding: '2px 6px', cursor: 'pointer', fontSize: '9px' }}
          >
            SHOW ENV
          </button>
        </div>
        <div>URL: {supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : '❌ NOT SET'}</div>
        <div>Key: {supabaseAnonKey ? '✅ SET' : '❌ NOT SET'}</div>
        <div style={{ marginTop: '8px', color: dataSource === 'supabase' ? '#00D4AA' : '#FF6B35' }}>
          Source: {dataSource.toUpperCase()}
        </div>
        {dataSource === 'mock' && (
          <div style={{ marginTop: '8px', fontSize: '8px', color: '#FF6B35' }}>
            ⚠️ Check console for CORS/RLS errors
            <br />
            📝 Ensure Supabase CORS includes:
            <br />
            http://localhost:5173
            <br />
            http://95.216.147.140:5173
          </div>
        )}
        <div style={{ marginTop: '8px', fontSize: '9px', color: '#999' }}>
          {dataSource === 'supabase' ? '✅ Browser connected to Supabase!' : '💡 Browser DNS → Supabase'}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
