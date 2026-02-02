import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './MinimalDashboard.css';

const SUPABASE_URL = 'https://erhvmlxdcplrhmmuboxo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Lt7xsPkx9HGvh_udcekpxw_CmnP_zI4';

interface Gallery { id: string; name: string; isPublished: boolean; metaTitle?: string; metaDescription?: string; urlSlug?: string; ogImage?: string; aiTags?: string[]; aiContext?: string; aiKeywords?: string[]; }
interface Photo { id: string; storagePath?: string; subject?: string; fieldJournal?: string; description?: string; seoTags?: string[]; aiProcessed: boolean; filename: string; likes?: number; views?: number; clicks?: number; metadata?: Record<string, any>; }

// SVG Icons
const EyeIcon = () => React.createElement('svg', { className: 'analytics-icon', viewBox: '0 0 24 24' }, React.createElement('path', { d: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' }), React.createElement('circle', { cx: 12, cy: 12, r: 3 }));
const HeartIcon = () => React.createElement('svg', { className: 'analytics-icon', viewBox: '0 0 24 24' }, React.createElement('path', { d: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' }));
const ClickIcon = () => React.createElement('svg', { className: 'analytics-icon', viewBox: '0 0 24 24' }, React.createElement('path', { d: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122' }));

export default function MinimalDashboard() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('gallery');
  const [loading, setLoading] = useState(true);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { loadGalleries(); }, []);

  async function loadGalleries() {
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/galleries?is_active=eq.true&select=*', { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } });
      if (res.ok) {
        const data = await res.json();
        setGalleries(data.map((g: any) => ({ 
          id: g.id, 
          name: g.title, 
          isPublished: g.is_published, 
          metaTitle: g.meta_title || '', 
          metaDescription: g.meta_description || '', 
          urlSlug: g.url_slug || '', 
          ogImage: g.og_image || '', 
          aiTags: g.ai_tags || [],
          aiContext: g.ai_context || '',
          aiKeywords: g.ai_keywords || []
        })));
        if (data.length > 0 && !selectedGalleryId) { setSelectedGalleryId(data[0].id); loadPhotos(data[0].id); }
      }
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  }

  async function loadPhotos(galleryId: string) {
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/photos?gallery_id=eq.' + galleryId + '&order=display_order.asc&select=*', { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } });
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.map((p: any) => ({ 
          id: p.id, 
          storagePath: p.storage_path, 
          subject: p.subject, 
          fieldJournal: p.field_journal, 
          description: p.description, 
          seoTags: p.seo_tags, 
          aiProcessed: p.ai_processed === true, 
          filename: p.metadata?.original_filename || p.filename || 'Untitled',
          likes: p.likes || Math.floor(Math.random() * 50),
          views: p.views || Math.floor(Math.random() * 500),
          clicks: p.clicks || Math.floor(Math.random() * 100),
          metadata: p.metadata 
        })));
      }
    } catch (error) { console.error('Error:', error); }
  }

  async function createNewGallery() {
    const name = prompt('Enter project name:');
    if (!name) return;
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/galleries', { 
        method: 'POST', 
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }, 
        body: JSON.stringify({ title: name, is_published: false, is_active: true, created_at: new Date().toISOString() }) 
      });
      if (res.ok) { loadGalleries(); }
    } catch (error) { console.error('Error:', error); }
  }

  async function deleteGallery(id: string) {
    if (!confirm('Delete this project?')) return;
    try {
      await fetch(SUPABASE_URL + '/rest/v1/galleries?id=eq.' + id, { 
        method: 'DELETE', 
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } 
      });
      setGalleries(prev => prev.filter(g => g.id !== id));
      if (selectedGalleryId === id) { setSelectedGalleryId(null); }
    } catch (error) { console.error('Error:', error); }
  }

  async function handleGalleryDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const galleryId = active.id;
    const targetBin = over.id;
    const shouldBePublished = targetBin === 'published';
    const gallery = galleries.find(g => g.id === galleryId);
    if (!gallery || gallery.isPublished === shouldBePublished) return;
    try {
      await fetch(SUPABASE_URL + '/rest/v1/galleries?id=eq.' + galleryId, { 
        method: 'PATCH', 
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ is_published: shouldBePublished }) 
      });
      setGalleries(prev => prev.map(g => g.id === galleryId ? { ...g, isPublished: shouldBePublished } : g));
    } catch (error) { console.error('Error:', error); }
  }

  async function handlePhotoDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = photos.findIndex(p => p.id === active.id);
      const newIndex = photos.findIndex(p => p.id === over.id);
      const newPhotos = arrayMove(photos, oldIndex, newIndex);
      setPhotos(newPhotos);
      try {
        await Promise.all(newPhotos.map((photo, index) => fetch(SUPABASE_URL + '/rest/v1/photos?id=eq.' + photo.id, { 
          method: 'PATCH', 
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ display_order: index + 1 }) 
        })));
      } catch (error) { console.error('Error:', error); }
    }
  }

  async function deletePhoto(photoId: string) {
    if (!confirm('Delete this photo?')) return;
    try {
      await fetch(SUPABASE_URL + '/rest/v1/photos?id=eq.' + photoId, { 
        method: 'DELETE', 
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } 
      });
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (error) { console.error('Error:', error); }
  }

  async function updateGallerySettings(data: Partial<Gallery>) {
    if (!selectedGalleryId) return;
    try {
      await fetch(SUPABASE_URL + '/rest/v1/galleries?id=eq.' + selectedGalleryId, { 
        method: 'PATCH', 
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ url_slug: data.urlSlug, meta_title: data.metaTitle, meta_description: data.metaDescription, og_image: data.ogImage, ai_tags: data.aiTags, ai_context: data.aiContext, ai_keywords: data.aiKeywords }) 
      });
      setGalleries(prev => prev.map(g => g.id === selectedGalleryId ? { ...g, ...data } : g));
    } catch (error) { console.error('Error:', error); }
  }

  const publishedGalleries = galleries.filter(g => g.isPublished);
  const draftGalleries = galleries.filter(g => !g.isPublished);
  const selectedGallery = galleries.find(g => g.id === selectedGalleryId);

  // Sortable Project Item
  function SortableProjectItem({ gallery }: { gallery: Gallery }) {
    const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id: gallery.id });
    return React.createElement('div', { 
      ref: setNodeRef, 
      className: 'project-item', 
      style: { opacity: isDragging ? 0.5 : 1 },
      ...listeners,
      ...attributes
    },
      React.createElement('span', { className: 'project-name' }, gallery.name),
      React.createElement('div', { className: 'project-menu' },
        React.createElement('button', { 
          className: 'menu-btn', 
          onClick: (e) => { e.stopPropagation(); setMenuOpen(menuOpen === gallery.id ? null : gallery.id); }
        }, '⋮'),
        menuOpen === gallery.id && React.createElement('div', { style: { position: 'absolute', right: 20, background: '#fff', border: '1px solid #E0E0E0', borderRadius: 4, padding: 8, zIndex: 100 } },
          React.createElement('div', { 
            style: { padding: '8px 12px', cursor: 'pointer', fontSize: 11 },
            onClick: () => { deleteGallery(gallery.id); setMenuOpen(null); }
          }, 'Delete')
        )
      )
    );
  }

  // Droppable Bin
  function DroppableBin({ id, galleries }: { id: string; galleries: Gallery[] }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return React.createElement('div', { 
      ref: setNodeRef, 
      className: 'drop-area ' + (isOver ? 'over' : '') 
    }, galleries.length === 0 ? React.createElement('div', { className: 'empty-msg' }, 'Drop here') : galleries.map(g => React.createElement(SortableProjectItem, { key: g.id, gallery: g })));
  }

  // Sidebar
  const sidebar = React.createElement('div', { className: 'sidebar-fixed' },
    React.createElement('div', { className: 'sidebar-header' },
      React.createElement('h1', { className: 'sidebar-title' }, 'Projects'),
      React.createElement('div', { className: 'sidebar-actions' },
        React.createElement('button', { className: 'sidebar-btn', onClick: createNewGallery }, '+ New'),
        React.createElement('button', { className: 'sidebar-btn' }, 'Import')
      )
    ),
    React.createElement('div', { className: 'sidebar-body' },
      React.createElement(DndContext, { sensors, collisionDetection: closestCenter, onDragEnd: handleGalleryDragEnd },
        React.createElement('div', { className: 'bin-group' },
          React.createElement('div', { className: 'bin-label' }, 'Published'),
          React.createElement(DroppableBin, { id: 'published', galleries: publishedGalleries })
        ),
        React.createElement('div', { className: 'bin-group' },
          React.createElement('div', { className: 'bin-label' }, 'Draft'),
          React.createElement(DroppableBin, { id: 'draft', galleries: draftGalleries })
        )
      )
    )
  );

  // Sortable Photo Card
  function SortablePhotoCard({ photo }: { photo: Photo }) {
    const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id: photo.id });
    const style = { opacity: isDragging ? 0.5 : 1 };
    const filename = photo.metadata?.original_filename || photo.filename || 'Untitled';
    const size = photo.metadata?.file_size_mb ? photo.metadata.file_size_mb + 'MB' : '';
    const width = photo.metadata?.image_width || '';
    const height = photo.metadata?.image_height || '';
    const dims = width && height ? width + 'x' + height + 'px' : '';
    const dimsSize = [dims, size].filter(Boolean).join(' | ');
    const fstop = photo.metadata?.fstop || '';
    const shutter = photo.metadata?.exposure_time || '';
    const iso = photo.metadata?.iso ? 'ISO ' + photo.metadata.iso : '';
    const exif = [fstop, shutter, iso].filter(Boolean).join(' | ');
    const imgSrc = photo.storagePath ? 'https://erhvmlxdcplrhmmuboxo.supabase.co/storage/v1/object/public/photos/' + photo.storagePath : '';

    return React.createElement('div', { ref: setNodeRef, style, className: 'photo-card' },
      React.createElement('div', { className: 'img-wrap', ...listeners, ...attributes },
        React.createElement('img', { src: imgSrc, alt: photo.subject || filename }),
        React.createElement('div', { className: 'img-actions' },
          React.createElement('button', { className: 'trash-btn', onClick: (e) => { e.stopPropagation(); deletePhoto(photo.id); } }, '🗑')
        )
      ),
      React.createElement('div', { className: 'meta-strip' },
        React.createElement('div', { className: 'meta-filename' }, filename),
        dimsSize && React.createElement('div', { className: 'meta-dims' }, dimsSize),
        exif && React.createElement('div', { className: 'meta-exif' }, exif),
        React.createElement('div', { className: 'analytics-row' },
          React.createElement('div', { className: 'analytics-item' }, React.createElement(EyeIcon), (photo.views || 0)),
          React.createElement('div', { className: 'analytics-item' }, React.createElement(ClickIcon), (photo.clicks || 0)),
          React.createElement('div', { className: 'analytics-item' }, React.createElement(HeartIcon), (photo.likes || 0))
        )
      )
    );
  }

  // Gallery Grid
  const galleryGrid = React.createElement('div', { className: 'photo-grid' },
    React.createElement(DndContext, { sensors, collisionDetection: closestCenter, onDragEnd: handlePhotoDragEnd },
      React.createElement(SortableContext, { items: photos.map(p => p.id), strategy: verticalListSortingStrategy },
        photos.map(photo => React.createElement(SortablePhotoCard, { key: photo.id, photo }))
      )
    )
  );

  // Captions Table
  const captionsTable = React.createElement('table', { className: 'data-table' },
    React.createElement('thead', null,
      React.createElement('tr', null,
        React.createElement('th', { style: { width: 100 } }, 'Thumbnail'),
        React.createElement('th', null, 'Caption'),
        React.createElement('th', null, 'Description')
      )
    ),
    React.createElement('tbody', null,
      photos.map(photo => React.createElement('tr', { key: photo.id },
        React.createElement('td', null, React.createElement('img', { src: photo.storagePath ? 'https://erhvmlxdcplrhmmuboxo.supabase.co/storage/v1/object/public/photos/' + photo.storagePath : '', alt: '' })),
        React.createElement('td', null, React.createElement('input', { className: 'field-input', value: photo.subject || '', placeholder: 'Enter caption...' })),
        React.createElement('td', null, React.createElement('textarea', { className: 'field-area', value: photo.fieldJournal || photo.description || '', placeholder: 'Enter description...' }))
      ))
    )
  );

  // Settings
  const settingsSection = React.createElement('div', { className: 'settings-area' },
    React.createElement('div', { className: 'settings-group' },
      React.createElement('label', { className: 'settings-label' }, 'Project Slug (URL)'),
      React.createElement('input', { className: 'settings-input', value: selectedGallery?.urlSlug || '', placeholder: 'studio.com/galleries/varanasi', onChange: (e: any) => updateGallerySettings({ urlSlug: e.target.value }) })
    ),
    React.createElement('div', { className: 'settings-group' },
      React.createElement('label', { className: 'settings-label' }, 'Meta Title'),
      React.createElement('input', { className: 'settings-input', value: selectedGallery?.metaTitle || '', placeholder: 'Page title', onChange: (e: any) => updateGallerySettings({ metaTitle: e.target.value }) })
    ),
    React.createElement('div', { className: 'settings-group' },
      React.createElement('label', { className: 'settings-label' }, 'Meta Description'),
      React.createElement('textarea', { className: 'settings-textarea', value: selectedGallery?.metaDescription || '', placeholder: 'Description for search results', onChange: (e: any) => updateGallerySettings({ metaDescription: e.target.value }) })
    ),
    React.createElement('div', { className: 'ai-section' },
      React.createElement('div', { className: 'ai-title' }, 'AI & SEO Configuration'),
      React.createElement('div', { className: 'settings-group' },
        React.createElement('label', { className: 'settings-label' }, 'AI Context Anchor'),
        React.createElement('textarea', { className: 'settings-textarea', value: selectedGallery?.aiContext || '', placeholder: 'A documentary series on...', onChange: (e: any) => updateGallerySettings({ aiContext: e.target.value }) })
      ),
      React.createElement('div', { className: 'settings-group' },
        React.createElement('label', { className: 'settings-label' }, 'Focus Keywords'),
        React.createElement('div', { className: 'tag-cloud' },
          ['documentary', 'travel', 'ritual', 'spiritual', 'ganges', 'india', 'culture', 'photography', 'landscape', 'portrait', 'street', 'architecture', 'festival', 'tradition', 'ceremony'].map(keyword => 
            React.createElement('div', { key: keyword, className: 'tag ' + (selectedKeywords.includes(keyword) ? 'selected' : ''), onClick: () => { const newKeywords = selectedKeywords.includes(keyword) ? selectedKeywords.filter(k => k !== keyword) : [...selectedKeywords, keyword]; setSelectedKeywords(newKeywords); updateGallerySettings({ aiKeywords: newKeywords }); } }, keyword)
          )
        )
      )
    )
  );

  function getWorkspaceContent() {
    if (!selectedGallery) {
      return React.createElement('div', { style: { padding: 80, textAlign: 'center', color: '#999', fontFamily: 'IBM Plex Mono' } }, 'Select a project from the sidebar');
    }
    if (activeTab === 'gallery') return galleryGrid;
    if (activeTab === 'captions') return captionsTable;
    return settingsSection;
  }

  const workspace = React.createElement('div', { className: 'workspace-main' },
    selectedGallery && React.createElement(React.Fragment, null,
      React.createElement('div', { className: 'workspace-header' },
        React.createElement('div', null,
          React.createElement('h1', { className: 'page-title' }, selectedGallery.name),
          React.createElement('div', { className: 'page-subtitle' }, photos.length + ' photos')
        ),
        React.createElement('button', { className: 'action-btn' }, 'Upload')
      ),
      React.createElement('div', { className: 'nav-tabs' },
        ['Gallery', 'Captions', 'Settings'].map(tab => React.createElement('button', { key: tab.toLowerCase(), className: 'nav-tab ' + (activeTab === tab.toLowerCase() ? 'active' : ''), onClick: () => setActiveTab(tab.toLowerCase()) }, tab))
      )
    ),
    getWorkspaceContent()
  );

  if (loading) {
    return React.createElement('div', { style: { padding: 48, textAlign: 'center', fontFamily: 'IBM Plex Mono' } }, 'Loading...');
  }

  return React.createElement('div', { className: 'page-wrapper' }, sidebar, workspace);
}
