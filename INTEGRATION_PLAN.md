# Travel Website Integration Plan

**Document Created:** 2026-02-02
**Last Updated:** 2026-02-02 19:05 UTC
**Author:** Claude Code Assistant
**Project:** Travel Photography Portfolio - Monorepo Unification

---

## Executive Summary

This document outlines the plan to consolidate two separate codebases into a unified monorepo structure:
1. **travel-website** (Backend API + Admin Dashboard)
2. **photography-landing-demo** (Public Frontend - "Arrival Terminal")

The goal is to create a single, well-organized repository with shared types, unified deployment, and proper documentation.

---

## Current State Analysis

### Repository 1: travel-website
- **Hetzner Location:** `/root/clawd/travel-website/`
- **GitHub:** `rglondon/Travel_website`
- **Contains:** Backend API (Express), Admin Dashboard (React)
- **Issues:**
  - Duplicate `src/src` folder in admin-dashboard
  - `frontend-public/` contains only compiled files (no source)
  - No shared types between components

### Repository 2: photography-landing-demo
- **Hetzner Location:** `/home/clawdbot/clawd/photography-landing-demo/`
- **GitHub:** Separate/Unknown
- **Contains:** Public Frontend React app (HUD-style gallery)
- **Issues:**
  - Photos hardcoded in `safari.ts`
  - No API integration with backend
  - Separate from main project

---

## Target State: Unified Monorepo

```
travel-website/
├── README.md
├── INTEGRATION_PLAN.md          # This document
├── .env.example
├── package.json                 # Root workspace config
│
├── api/                         # Backend API
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
│
├── admin/                       # Admin Dashboard
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── frontend/                    # Public Frontend
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── shared/                      # Shared types & utilities
│   └── types/
│
├── migrations/
└── docs/
```

---

## Phase Checklist

### Phase 1: Repository Consolidation
- [x] 1.1 Backup current state on Hetzner
- [x] 1.2 Clean up duplicate `src/src` folder in admin-dashboard
- [x] 1.3 Copy frontend source into main repository
- [x] 1.4 Restructure directories (api/, admin/, frontend/)
- [x] 1.5 Create root package.json for monorepo
- [x] 1.6 Remove old `frontend-public/` compiled files
- [x] 1.7 Commit and push to GitHub

### Phase 2: API Integration
- [ ] 2.1 Create `galleryApi.ts` service in frontend
- [ ] 2.2 Add GalleryModel to backend API (if not exists)
- [ ] 2.3 Add gallery routes to backend API (if not exists)
- [ ] 2.4 Update Home.tsx to fetch galleries dynamically
- [ ] 2.5 Update SafariGallery.tsx to accept photos as props
- [ ] 2.6 Remove hardcoded data from safari.ts
- [ ] 2.7 Add environment variables for API URL
- [ ] 2.8 Test API integration end-to-end

### Phase 3: Code Review & Improvements
- [ ] 3.1 Review frontend component structure
- [ ] 3.2 Split large components (Home.tsx)
- [ ] 3.3 Remove unused UI components
- [ ] 3.4 Add proper error handling
- [ ] 3.5 Add loading states and skeletons
- [ ] 3.6 Improve TypeScript types
- [ ] 3.7 Add accessibility improvements
- [ ] 3.8 Performance optimizations (lazy loading, memoization)

### Phase 4: Documentation
- [ ] 4.1 Create comprehensive README.md
- [ ] 4.2 Document API endpoints
- [ ] 4.3 Document environment variables
- [ ] 4.4 Add architecture diagrams
- [ ] 4.5 Add deployment instructions
- [ ] 4.6 Add development setup guide

### Phase 5: Sync & Deploy
- [ ] 5.1 Final commit and push to GitHub
- [ ] 5.2 Pull changes to local development
- [ ] 5.3 Install dependencies
- [ ] 5.4 Build all packages
- [ ] 5.5 Deploy and verify
- [ ] 5.6 Update DNS/routing if needed

---

## Progress Log

### 2026-02-02 (Phase 1 Complete)
- Created integration plan document
- Analyzed current repository structure
- Identified issues and target state
- **Phase 1 Completed:**
  - Created backups: `travel-website-backup-20260202`, `photography-landing-demo-backup-20260202`
  - Removed duplicate `admin-dashboard/src/src/` folder
  - Copied frontend source from `photography-landing-demo` to `frontend/`
  - Renamed `src/` to `api/` and `admin-dashboard/` to `admin/`
  - Created monorepo root package.json with workspaces
  - Removed old `frontend-public/` compiled files
  - Updated api/src/app.ts path references

---

## Technical Notes

### Backend API Endpoints (Existing + New)
- `GET /api/galleries` - List all published galleries
- `GET /api/galleries/:slug` - Get gallery with photos
- `GET /api/galleries/:slug/photos` - Get photos only
- `POST /api/galleries/photos/:id/view` - Record view

### Frontend Data Flow (Target)
1. Home.tsx mounts → fetches `/api/galleries`
2. Renders Beacon components for each gallery
3. Click Beacon → fetches `/api/galleries/:slug`
4. SafariGallery receives photos array as prop
5. Photos displayed with EXIF metadata from database

### Environment Variables Required
```
# API
SUPABASE_URL=
SUPABASE_ANON_KEY=
PORT=3001

# Admin Dashboard
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Frontend
VITE_API_URL=http://localhost:3001/api
```

---

## Rollback Plan

If issues occur during integration:
1. Backups stored at `/root/clawd/travel-website-backup-20260202/`
2. Git history allows reverting to any previous commit
3. Original `photography-landing-demo` backup at `/root/clawd/photography-landing-demo-backup-20260202/`

---

## Sign-Off

| Phase | Completed | Date | Notes |
|-------|-----------|------|-------|
| Phase 1 | ✅ | 2026-02-02 | Repository consolidated |
| Phase 2 | ⏳ | - | - |
| Phase 3 | ⏳ | - | - |
| Phase 4 | ⏳ | - | - |
| Phase 5 | ⏳ | - | - |

---

*This document will be updated as each phase progresses.*
