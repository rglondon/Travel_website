# Henry Travel Website - Core Functionality Implementation

## 1. Supabase Schema (Run in Supabase SQL Editor)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- GALLERIES TABLE (Projects)
CREATE TABLE galleries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  cover_image_url TEXT,
  project_context TEXT,
  visibility_settings JSONB DEFAULT '{"is_public": true}'::jsonb,
  seo_settings JSONB DEFAULT '{}'::jsonb,
  is_published BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- PHOTOS TABLE
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text TEXT,
  field_journal TEXT,
  ai_keywords TEXT[],
  display_order INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- REORDER FUNCTION
CREATE OR REPLACE FUNCTION reorder_photos(
  p_gallery_id UUID,
  p_photo_orders ARRAY<JSON>
) RETURNS VOID AS $$
DECLARE
  order_item JSON;
BEGIN
  FOR order_item IN SELECT * FROM json_array_elements(p_photo_orders)
  LOOP
    UPDATE photos
    SET display_order = (order_item->>'order')::INTEGER,
        updated_at = NOW()
    WHERE id = (order_item->>'photo_id')::UUID
      AND gallery_id = p_gallery_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- INDEXES
CREATE INDEX idx_photos_gallery_id ON photos(gallery_id);
CREATE INDEX idx_photos_display_order ON photos(gallery_id, display_order);
```

---

## 2. onDragEnd Reordering (Core Function)

Located in: `AdminDashboard.tsx`

```typescript
/**
 * Handle drag end - reorder photos and persist to database
 * This is the core function for drag-and-drop ordering persistence
 */
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;

  if (over && active.id !== over.id) {
    const oldIndex = photos.findIndex(p => p.id === active.id);
    const newIndex = photos.findIndex(p => p.id === over.id);

    // Reorder locally first for instant feedback
    const newPhotos = arrayMove(photos, oldIndex, newIndex);

    // Update display orders with 1-based indexing
    const updatedPhotos = newPhotos.map((photo, index) => ({
      ...photo,
      displayOrder: index + 1,
    }));

    setPhotos(updatedPhotos);
    setActiveId(null);

    // Persist to Supabase - bulk update display_order
    if (selectedGalleryId) {
      const photoOrders = updatedPhotos.map((photo) => ({
        photoId: photo.id,
        displayOrder: photo.displayOrder,
      }));

      // Async persist - don't await to avoid blocking UI
      persistReorder(selectedGalleryId, photoOrders);
    }
  } else {
    setActiveId(null);
  }
};

/**
 * Persist photo reordering to Supabase
 * Uses bulk upsert for efficient database updates
 */
const persistReorder = async (
  galleryId: string,
  photoOrders: Array<{ photoId: string; displayOrder: number }>
) => {
  try {
    const success = await supabaseGalleryService.reorderPhotos(galleryId, photoOrders);
    if (!success) {
      console.warn('Failed to persist photo reorder to Supabase');
    }
  } catch (error) {
    console.error('Error persisting reorder:', error);
  }
};
```

---

## 3. Project Save Function

Located in: `AdminDashboard.tsx`

```typescript
/**
 * Save project to Supabase
 * Handles both create (new project) and update (existing project)
 */
const handleSaveProject = async (projectData: {
  name: string;
  slug: string;
  description: string;
  visibilitySettings: { isPublic: boolean; showOnHomepage?: boolean };
}) => {
  if (!selectedGalleryId) return;

  setIsSaving(true);
  setSaveStatus('saving');

  try {
    const saved = await supabaseGalleryService.update(selectedGalleryId, {
      name: projectData.name,
      slug: projectData.slug,
      description: projectData.description,
      visibilitySettings: projectData.visibilitySettings,
    });

    if (saved) {
      // Update local state with saved data
      setGalleries(prev => prev.map(g =>
        g.id === selectedGalleryId ? { ...g, ...saved } : g
      ));
      setSaveStatus('success');
    } else {
      // Mock save for demo mode
      setGalleries(prev => prev.map(g =>
        g.id === selectedGalleryId
          ? {
              ...g,
              name: projectData.name,
              slug: projectData.slug,
              description: projectData.description,
              visibilitySettings: projectData.visibilitySettings,
              updatedAt: new Date(),
            }
          : g
      ));
      setSaveStatus('success');
    }

    // Auto-clear success message
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('idle');
    }, 2000);
  } catch (error) {
    console.error('Failed to save project:', error);
    setSaveStatus('error');
  } finally {
    setIsSaving(false);
  }
};
```

---

## 4. Supabase Gallery Service (Key Methods)

Located in: `src/services/supabase/galleryService.ts`

```typescript
/**
 * Create a new gallery (Project) - POST to galleries table
 */
async create(data: GalleryFormData): Promise<Gallery | null> {
  const { data: gallery, error } = await supabase
    .from('galleries')
    .insert({
      title: data.name,
      slug: this.generateSlug(data.name),
      description: data.description,
      cover_image_url: data.coverImageUrl,
      project_context: data.projectContext,
      visibility_settings: {
        is_public: data.visibilitySettings?.isPublic ?? true,
        show_on_homepage: data.visibilitySettings?.showOnHomepage ?? false,
      },
      is_published: data.isPublished ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  return mapGallery(gallery);
}

/**
 * Update existing gallery - PUT request
 */
async update(id: string, data: Partial<GalleryFormData>): Promise<Gallery | null> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.name) {
    updateData.title = data.name;
    updateData.slug = this.generateSlug(data.name);
  }
  if (data.description) updateData.description = data.description;
  if (data.visibilitySettings) {
    updateData.visibility_settings = {
      is_public: data.visibilitySettings.isPublic,
      show_on_homepage: data.visibilitySettings.showOnHomepage,
    };
  }

  const { data: gallery, error } = await supabase
    .from('galleries')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapGallery(gallery);
}

/**
 * Bulk update photo display order
 */
async reorderPhotos(
  galleryId: string,
  photoOrders: Array<{ photoId: string; displayOrder: number }>
): Promise<boolean> {
  const updates = photoOrders.map(({ photoId, displayOrder }) => ({
    id: photoId,
    gallery_id: galleryId,
    display_order: displayOrder,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('photos')
    .upsert(updates, {
      onConflict: 'id',
      ignoreDuplicates: false,
    });

  if (error) throw error;
  return true;
}

/**
 * Delete photo (record + storage file)
 */
async deletePhoto(photoId: string): Promise<boolean> {
  // Get photo data first
  const { data: photo } = await supabase
    .from('photos')
    .select('image_url')
    .eq('id', photoId)
    .single();

  // Delete from storage
  if (photo?.image_url) {
    const imagePath = photo.image_url.split('/').pop();
    await supabase.storage.from('galleries').remove([imagePath]);
  }

  // Delete database record
  await supabase.from('photos').delete().eq('id', photoId);
  return true;
}
```

---

## 5. Environment Configuration

Create `.env` file:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# MiniMax M2.1 Configuration
MINIMAX_API_KEY=your_minimax_api_key
MINIMAX_MODEL=abab6.5s-chat
```

---

## 6. Next Steps

To complete the integration:

1. **Set up Supabase Storage**: Create 'galleries' bucket (public)
2. **Configure RLS Policies**: Set up row-level security for galleries/photos tables
3. **Add Delete Button Logic**: Connect sidebar delete button to `supabaseGalleryService.delete()`
4. **Implement Captions Hub**: Connect CaptionsHub to save field_journal updates
5. **MiniMax Vision Integration**: Pass `gallery.project_context` as context to AI prompts
