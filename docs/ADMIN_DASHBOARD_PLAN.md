# Admin Dashboard Implementation Plan

## Overview
Build a simple Admin Dashboard for Henry Travel Website to manage photos without touching code. The dashboard will allow uploading images, editing telemetry, and managing photo metadata.

---

## Phase 1: Backend API (Already Implemented)

### Completed
- ✅ Supabase schema with `safari_photos` table
- ✅ RESTful API endpoints for CRUD operations
- ✅ JWT authentication middleware
- ✅ Admin role verification
- ✅ Image upload support via Multer

### API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/photos` | List all photos (with pagination) | Admin |
| GET | `/api/admin/photos/:id` | Get photo details | Admin |
| POST | `/api/admin/photos` | Create photo (with image upload) | Admin |
| PUT | `/api/admin/photos/:id` | Update photo & telemetry | Admin |
| PATCH | `/api/admin/photos/:id/telemetry` | Quick telemetry update | Admin |
| DELETE | `/api/admin/photos/:id` | Delete photo | Admin |
| POST | `/api/admin/photos/reorder` | Bulk update display order | Admin |
| GET | `/api/admin/stats` | Dashboard statistics | Admin |

---

## Phase 2: Admin Dashboard Frontend

### Tech Stack Options

**Option A: Simple HTML/JS (Quick)**
- Pure HTML + JavaScript
- No build step required
- Good for simple CRUD operations

**Option B: React/Vue (Recommended)**
- Modern SPA framework
- Better state management
- Component-based UI
- More maintainable

**Option C: React Admin / AdminJS**
- Ready-made admin interface
- Fastest to implement
- Limited customization

### Recommended: React + Vite

```bash
# Setup
npm create vite@latest admin-dashboard -- --template react-ts
cd admin-dashboard
npm install @supabase/supabase-js react-router-dom react-hook-form
npm install -D tailwindcss
```

### Dashboard Features

#### 1. **Dashboard Home**
- Total photo count
- Photos by category (chart)
- Top performing photos (by views/likes)
- Recent activity

#### 2. **Photo Management**
- [ ] Photo list with thumbnails
- [ ] Filter by category
- [ ] Search by caption/location
- [ ] Sort by date, views, display order
- [ ] Bulk actions (delete, reorder, publish/unpublish)

#### 3. **Add/Edit Photo Form**
```
- Image Upload (drag & drop)
- Image URL (alternative)
- Thumbnail URL (auto-generated option)
- Caption
- Alt Text
- Location
- Photographer
- Date Taken
- Category (dropdown)
- Tags (comma-separated or multi-select)
- Story Context (textarea)
- Display Order (number input)
- Publish toggle
- Featured toggle
```

#### 4. **Telemetry Editor**
- Manual override fields:
  - Views (number)
  - Likes (number)
  - Shares (number)
  - Downloads (number)
- Reset telemetry button
- View analytics charts (optional)

#### 5. **Reorder Interface**
- Drag and drop photo grid
- Visual display order numbers
- Save new order button

---

## Phase 3: Implementation Steps

### Step 1: Create React Admin Panel

```typescript
// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalPhotos: 0,
    publishedPhotos: 0,
    featuredPhotos: 0,
    totalViews: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    const { data } = await supabase
      .from('safari_photos')
      .select('is_published, is_featured, views');
    
    if (data) {
      setStats({
        totalPhotos: data.length,
        publishedPhotos: data.filter(p => p.is_published).length,
        featuredPhotos: data.filter(p => p.is_featured).length,
        totalViews: data.reduce((sum, p) => sum + (p.views || 0), 0),
      });
    }
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <StatCard title="Total Photos" value={stats.totalPhotos} />
        <StatCard title="Published" value={stats.publishedPhotos} />
        <StatCard title="Featured" value={stats.featuredPhotos} />
        <StatCard title="Total Views" value={stats.totalViews} />
      </div>
    </div>
  );
}
```

### Step 2: Photo Editor Component

```typescript
// src/components/PhotoEditor.tsx
import { useForm } from 'react-hook-form';

interface PhotoFormData {
  caption: string;
  altText: string;
  location: string;
  category: string;
  storyContext: string;
  displayOrder: number;
  views: number;
  likes: number;
  shares: number;
  downloads: number;
  isPublished: boolean;
  isFeatured: boolean;
}

export function PhotoEditor({ photo, onSave }) {
  const { register, handleSubmit, formState: { errors } } = useForm<PhotoFormData>({
    defaultValues: photo,
  });

  return (
    <form onSubmit={handleSubmit(onSave)}>
      <div className="form-group">
        <label>Caption</label>
        <input {...register('caption', { maxLength: 255 })} />
        {errors.caption && <span>Too long</span>}
      </div>
      
      <div className="form-group">
        <label>Story Context</label>
        <textarea {...register('storyContext')} rows={5} />
      </div>
      
      <div className="form-group">
        <label>Views (Telemetry)</label>
        <input type="number" {...register('views', { min: 0 })} />
      </div>
      
      <div className="form-group">
        <label>Likes (Telemetry)</label>
        <input type="number" {...register('likes', { min: 0 })} />
      </div>
      
      <button type="submit">Save Changes</button>
    </form>
  );
}
```

### Step 3: Image Upload Component

```typescript
// src/components/ImageUploader.tsx
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function ImageUploader({ onUpload, folder = 'safari-photos' }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) await uploadFile(file);
  }, []);

  async function uploadFile(file: File) {
    setUploading(true);
    setProgress(0);
    
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('photos')
      .upload(`${folder}/${fileName}`, file, {
        onUploadProgress: (p) => setProgress((p.loaded / p.total) * 100),
      });

    if (error) {
      console.error('Upload error:', error);
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(data.path);
      
      onUpload(publicUrl);
    }
    
    setUploading(false);
  }

  return (
    <div 
      className="upload-zone"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {uploading ? (
        <div className="progress-bar">
          <div style={{ width: `${progress}%` }} />
        </div>
      ) : (
        <p>Drag & drop an image here, or click to select</p>
      )}
      <input 
        type="file" 
        accept="image/*" 
        onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} 
      />
    </div>
  );
}
```

---

## Phase 4: Supabase Storage Setup

### Create Storage Bucket

```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true);

-- Set up storage policies
CREATE POLICY "Public access to photos" ON storage.objects
  FOR SELECT USING ( bucket_id = 'photos' );

CREATE POLICY "Authenticated can upload" ON storage.objects
  FOR INSERT WITH CHECK ( 
    bucket_id = 'photos' AND 
    auth.role() IN ('authenticated', 'admin') 
  );

CREATE POLICY "Admin can delete" ON storage.objects
  FOR DELETE USING ( 
    bucket_id = 'photos' AND 
    auth.role() = 'admin' 
  );
```

---

## Phase 5: Deployment

### Vercel (Recommended for React)

```bash
# Build
npm run build

# Deploy
vercel --prod
```

### Environment Variables Needed

```env
# Backend (.env)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://your-admin-domain.com

# Frontend (.env.production)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## Quick Start Checklist

- [ ] Create Supabase project
- [ ] Run migration SQL (migrations/001_create_safari_photos.sql)
- [ ] Set up storage bucket for images
- [ ] Add admin user with role in Supabase Auth
- [ ] Install dependencies: `npm install`
- [ ] Start dev server: `npm run dev`
- [ ] Create admin panel frontend
- [ ] Test all CRUD operations
- [ ] Deploy to production

---

## Security Considerations

1. **Admin Authentication**
   - Use Supabase Auth with email/password or OAuth
   - Set user metadata `role: 'admin'`
   - Use RLS policies in Supabase

2. **Image Validation**
   - File type validation on client and server
   - Size limit (10MB max)
   - Virus scan (optional)

3. **Rate Limiting**
   - Already implemented in Express backend
   - Add to frontend API calls if needed

4. **CSRF Protection**
   - Supabase handles this automatically
   - Use proper CORS settings
