# Henry Travel Website - Database Migration Guide

## Prerequisites

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Note your project URL and API keys

2. **Get Connection Details**
   - Go to Settings → API in Supabase dashboard
   - Copy `SUPABASE_URL` and `SUPABASE_ANON_KEY`
   - For admin operations, also get `SUPABASE_SERVICE_KEY` from Service keys

## Step 1: Run Database Migration

### Option A: Supabase Dashboard (Easiest)

1. Go to **SQL Editor** in Supabase dashboard
2. Click **New Query**
3. Copy contents of `migrations/001_create_safari_photos.sql`
4. Click **Run**
5. Verify tables created in **Table Editor**

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Login
supabase login

# Link to project
cd travel-website
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Step 2: Configure Environment

```bash
# Copy example env
cp .env.example .env

# Edit with your values
nano .env
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Start Development Server

```bash
npm run dev
```

Server will start at http://localhost:3000

## Step 5: Seed Sample Data (Optional)

The migration already includes sample data. To add more:

```sql
INSERT INTO safari_photos (image_url, alt_text, caption, location, category, story_context, display_order, tags)
VALUES (
  'https://example.com/your-image.jpg',
  'Photo description',
  'Caption here',
  'Location name',
  'wildlife',
  'Story behind the photo...',
  4,
  ARRAY['tag1', 'tag2']
);
```

## API Testing

### Test Public Endpoints

```bash
# Get all photos
curl http://localhost:3000/api/photos

# Get featured photos
curl http://localhost:3000/api/photos/featured

# Get single photo
curl http://localhost:3000/api/photos/{id}
```

### Test Admin Endpoints

```bash
# First, get JWT token from Supabase Auth
# Then use it in requests

# Create photo (with auth)
curl -X POST http://localhost:3000/api/admin/photos \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/new-photo.jpg",
    "caption": "New photo caption",
    "category": "wildlife",
    "storyContext": "Story about this photo",
    "displayOrder": 5
  }'

# Update photo
curl -X PUT http://localhost:3000/api/admin/photos/{id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "caption": "Updated caption",
    "views": 1500
  }'

# Delete photo
curl -X DELETE http://localhost:3000/api/admin/photos/{id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Setting Up Admin Users

### Method 1: Manual in Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Add user or invite existing user
3. Click user → **Edit User**
4. Add to user_metadata:
   ```json
   {
     "role": "admin"
   }
   ```
5. Save

### Method 2: Using SQL

```sql
-- Update existing user to admin
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'
WHERE email = 'admin@example.com';

-- Or set role on signup (RLS policy handles this)
-- Users need to have role: 'admin' in their metadata
```

## Troubleshooting

### Migration Errors

**"relation already exists"**
- Migration already ran. Check Table Editor.

**"extension uuid-ossp not found"**
- Supabase already has this extension. Continue.

### API Errors

**401 Unauthorized**
- Check JWT token is valid and not expired
- Verify Authorization header format: `Bearer <token>`

**403 Forbidden**
- User doesn't have admin role
- Update user metadata with `role: 'admin'`

**Connection refused**
- Server not running: `npm run dev`
- Wrong PORT in .env

### Supabase Storage

If using image uploads:
1. Create storage bucket named 'photos'
2. Set bucket to public
3. Add storage policies from docs/ADMIN_DASHBOARD_PLAN.md

## Next Steps

1. **Build Admin Dashboard** - See `docs/ADMIN_DASHBOARD_PLAN.md`
2. **Add Image Upload** - Integrate Supabase Storage
3. **Analytics Tracking** - Implement photo_analytics table
4. **Deploy** - Push to production
