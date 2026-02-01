# React Admin Dashboard - Component Architecture

## Design System: HUD (Heads-Up Display)

```
Background:  #FAFAFA (Off-white, paper-like)
Lines:       #1A1A1A (Near-black, sharp contrast)
Typography:  IBM Plex Mono (Monospace, technical feel)
Accent:      #0066FF (Electric blue for interactive)
Success:     #00D4AA (Teal for positive states)
Warning:     #FF6B35 (Orange for alerts)
```

---

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│  AdminDashboard (Page)                                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  HeaderBar                                                  ││
│  │  - Logo + Title                                             ││
│  │  - Stats Overview (Total, Published, Featured, Views)       ││
│  │  - Upload Button (Triggers UploadModal)                     ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────┬─────────────────────────────────────┐ │
│  │  LightTableGrid     │  QuickEditSidebar                    │ │
│  │  (Main Content)     │  (Collapsible, slides from right)    │ │
│  │                     │                                     │ │
│  │  ┌───────────────┐ │  ┌─────────────────────────────────┐ │ │
│  │  │ SortControls  │ │  │  PhotoPreview                   │ │ │
│  │  │ - Category    │ │  │  - Large thumbnail              │ │ │
│  │  │ - Search      │ │  │  - Quick stats overlay          │ │ │
│  │  │ - Filter      │ │  └─────────────────────────────────┘ │ │
│  │  └───────────────┘ │  ┌─────────────────────────────────┐ │ │
│  │                     │  │  TelemetryForm                  │ │ │
│  │  ┌───────────────┐ │  │  - GPS Lat/Long/Alt             │ │ │
│  │  │ PhotoCard     │ │  │  - EXIF Data Display            │ │ │
│  │  │ (Draggable)   │ │  │  - Manual input fields          │ │ │
│  │  └───────────────┘ │  └─────────────────────────────────┘ │ │
│  │                     │  ┌─────────────────────────────────┐ │ │
│  │  ┌───────────────┐ │  │  StoryEditor                    │ │ │
│  │  │ PhotoCard     │ │  │  - story_context textarea       │ │ │
│  │  │ (Draggable)   │ │  │  - Word count indicator         │ │ │
│  │  └───────────────┘ │  └─────────────────────────────────┘ │ │
│  │                     │  ┌─────────────────────────────────┐ │ │
│  │  ┌───────────────┐ │  │  AIBrainSection                 │ │ │
│  │  │ PhotoCard     │ │  │  - Suggested Keywords           │ │ │
│  │  │ (Draggable)   │ │  │  - Suggested Alt Text           │ │ │
│  │  └───────────────┘ │  │  - Approve/Edit workflow        │ │ │
│  │                     │  └─────────────────────────────────┘ │ │
│  │  ┌───────────────┐ │  ┌─────────────────────────────────┐ │ │
│  │  │ EmptyState    │ │  │  ActionButtons                  │ │ │
│  │  │ (No photos)   │ │  │  - Save Changes                 │ │ │
│  │  └───────────────┘ │ │  - Delete Photo                  │ │ │
│  │                     │ │  - Cancel                        │ │ │
│  │                     │  └─────────────────────────────────┘ │ │
│  └─────────────────────┴─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  UploadModal (Overlay)                                       ││
│  │  ┌─────────────────────────────────────────────────────────┐││
│  │  │  DropZone                                               │││
│  │  │  - Radar Scan Animation                                 │││
│  │  │  - Drag & drop visual feedback                          │││
│  │  │  - Progress indicator                                   │││
│  │  └─────────────────────────────────────────────────────────┘││
│  │  ┌─────────────────────────────────────────────────────────┐││
│  │  │  ProcessingQueue                                        │││
│  │  │  - Upload progress                                      │││
│  │  │  - EXIF extraction status                               │││
│  │  │  - AI analysis status                                   │││
│  │  │  - Completion confirmation                              │││
│  │  └─────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. `AdminDashboard.tsx` (Page Container)
**Responsibilities:**
- Manage global state (selected photo, sidebar open/close, photo list)
- Handle keyboard shortcuts (Escape to close sidebar, Ctrl+U to upload)
- Coordinate between grid and sidebar
- Persist user preferences (sidebar width, view mode)

**State:**
```typescript
interface DashboardState {
  photos: SafariPhoto[];
  selectedPhotoId: string | null;
  sidebarOpen: boolean;
  sidebarMode: 'edit' | 'view';
  filters: PhotoFilters;
  sortOrder: SortOrder;
  isUploadModalOpen: boolean;
}
```

---

### 2. `LightTableGrid.tsx` (Main Grid)
**Responsibilities:**
- @dnd-kit grid implementation for drag-and-drop reordering
- Responsive masonry/grid layout
- Virtualized rendering for performance (1000+ photos)
- Selection state management

**Key Features:**
- `DndContext` with `SortableContext` for drag operations
- `onDragEnd` triggers `updateDisplayOrder` API call
- Visual indicator during drag (lift effect)
- Smooth layout animations using `@dnd-kit/utilities`

**Props:**
```typescript
interface LightTableGridProps {
  photos: SafariPhoto[];
  onPhotoClick: (photo: SafariPhoto) => void;
  onReorder: (photoIds: string[]) => void;
  selectedIds: string[];
}
```

---

### 3. `PhotoCard.tsx` (Grid Item)
**Responsibilities:**
- Display thumbnail with overlay on hover
- Show key metadata (views, likes count badges)
- Drag handle for reordering
- Selectable for bulk actions
- Quick actions on hover (preview, edit)

**Visual States:**
- Default: Clean thumbnail with minimal metadata
- Selected: Blue border + selection checkbox
- Dragging: Lifted with shadow, reduced opacity
- Processing: Blur effect + loading spinner

**HUD Styling:**
```css
.photo-card {
  background: #FAFAFA;
  border: 1px solid #1A1A1A;
  font-family: 'IBM Plex Mono', monospace;
}

.photo-card.selected {
  border-color: #0066FF;
  box-shadow: 0 0 0 1px #0066FF;
}
```

---

### 4. `QuickEditSidebar.tsx` (Slide-out Panel)
**Responsibilities:**
- Slide animation from right (300px wide default)
- Form-based editing with validation
- Auto-save on blur (debounced)
- Unsaved changes detection

**Sub-components:**
- `PhotoPreview` - Large thumbnail with zoom
- `TelemetryForm` - GPS + EXIF editing
- `StoryEditor` - Rich text for story_context
- `AIBrainSection` - AI suggestions with approval flow
- `ActionButtons` - Save/Cancel/Delete

---

### 5. `TelemetryForm.tsx`
**Fields:**
```typescript
interface TelemetryFields {
  // GPS Data
  latitude: number;    // From EXIF or manual
  longitude: number;   // From EXIF or manual
  altitude: number;    // From EXIF (meters)
  
  // EXIF Display (read-only, extracted)
  cameraMake: string;
  cameraModel: string;
  lens: string;
  iso: number;
  aperture: string;    // f/1.8 format
  shutterSpeed: string; // 1/500 format
  focalLength: string; // 50mm format
  
  // Manual telemetry
  views: number;
  likes: number;
  shares: number;
  downloads: number;
}
```

**Features:**
- Auto-populate from EXIF extraction
- Map integration link (Google Maps, Apple Maps)
- Manual input with validation
- Change detection for unsaved state

---

### 6. `AIBrainSection.tsx` (AI Integration)
**Responsibilities:**
- Display AI-generated suggestions
- Approval workflow (Approve | Edit | Reject)
- Finalize values to database

**AI Output Structure:**
```typescript
interface AISuggestions {
  keywords: {
    value: string;
    category: 'wildlife' | 'landscape' | 'technical' | 'artistic';
    confidence: number;  // 0-1
    approved: boolean;
  }[];
  
  altText: {
    value: string;
    confidence: number;
    approved: boolean;
  };
  
  caption: {
    value: string;
    confidence: number;
    approved: boolean;
  };
  
  storyContext: {
    value: string;
    confidence: number;
    approved: boolean;
  };
}
```

**UI:**
- Keywords as clickable tags with confidence indicator
- Alt Text with "Approve" / "Edit" buttons
- Visual diff between current and suggested values
- Bulk approve all suggestions

---

### 7. `UploadModal.tsx` (Drag & Drop)
**Responsibilities:**
- Full-screen modal overlay
- Radar Scan animation during processing
- Multi-file upload queue
- Real-time progress tracking

**Sub-components:**
- `DropZone` - Visual drag target with radar animation
- `ProcessingQueue` - List of files with status
- `UploadProgress` - Per-file and total progress
- `EXIFExtractionStatus` - EXIF read progress
- `AIAnalysisStatus` - AI vision progress

**Radar Scan Animation:**
```css
@keyframes radar-scan {
  0% { transform: rotate(0deg); opacity: 1; }
  100% { transform: rotate(360deg); opacity: 0; }
}

.radar-ring {
  border: 2px solid #0066FF;
  border-radius: 50%;
  animation: radar-scan 2s linear infinite;
}
```

---

### 8. `DropZone.tsx`
**Responsibilities:**
- Visual feedback on drag over
- File type validation (JPEG, PNG, WebP, RAW)
- Size limit enforcement (50MB max)
- Trigger radar animation on drag over

**States:**
- Default: Dashed border, "Drop photos here"
- Drag Over: Solid border, radar animation, highlight color
- Processing: Blur content, show progress
- Complete: Success checkmark, "Upload complete"

---

## Service Layer

```
┌─────────────────────────────────────────────────────────────────┐
│  services/                                                      │
│  ├── api.ts                    # Base API client (Axios)       │
│  ├── photoService.ts           # Photo CRUD operations         │
│  ├── uploadService.ts          # Upload with progress tracking │
│  ├── exifService.ts            # EXIF extraction (exif-js)     │
│  ├── aiService.ts              # OpenAI Vision API             │
│  └── reorderService.ts         # Batch reorder operations      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Hooks

```
hooks/
├── usePhotos.ts           # Photo list state + CRUD
├── usePhotoSelection.ts   # Multi-select logic
├── useDragAndDrop.ts      # @dnd-kit integration
├── useAutoSave.ts         # Debounced auto-save
├── useTelemetry.ts        # Telemetry form state
├── useAIAnalysis.ts       # AI suggestion management
└── useUploadQueue.ts      # Upload queue state
```

---

## Context

```
context/
├── DashboardContext.tsx   # Global dashboard state
├── UploadContext.tsx      # Upload modal state
└── SelectionContext.tsx   # Photo selection state
```

---

## Key Libraries

```json
{
  "dependencies": {
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "exif-js": "^2.3.0",
    "openai": "^4.20.0",
    "axios": "^1.6.2",
    "react-hook-form": "^7.49.0",
    "@hookform/resolvers": "^3.3.2",
    "zod": "^3.22.4",
    "framer-motion": "^10.16.16",
    "lucide-react": "^0.303.0",
    "date-fns": "^3.0.6"
  }
}
```

---

## Data Flow

```
User drops photo
      ↓
DropZone detects file
      ↓
UploadModal shows Radar Scan
      ↓
uploadService.upload() → Multer → Supabase Storage
      ↓
exifService.extract() reads EXIF data (GPS, Camera)
      ↓
aiService.analyze() → OpenAI Vision API
      ↓
Combine: URL + EXIF + AI Suggestions
      ↓
POST /api/admin/photos (complete payload)
      ↓
Database insert with all metadata
      ↓
Dashboard refresh → LightTableGrid updates
```

---

## File Structure

```
admin-dashboard/src/
├── components/
│   ├── dashboard/
│   │   ├── AdminDashboard.tsx
│   │   ├── LightTableGrid.tsx
│   │   ├── PhotoCard.tsx
│   │   ├── SortControls.tsx
│   │   └── StatsOverview.tsx
│   ├── photo/
│   │   ├── PhotoPreview.tsx
│   │   ├── TelemetryForm.tsx
│   │   └── StoryEditor.tsx
│   ├── sidebar/
│   │   ├── QuickEditSidebar.tsx
│   │   ├── AIBrainSection.tsx
│   │   └── ActionButtons.tsx
│   ├── upload/
│   │   ├── UploadModal.tsx
│   │   ├── DropZone.tsx
│   │   ├── RadarAnimation.tsx
│   │   ├── ProcessingQueue.tsx
│   │   └── UploadProgress.tsx
│   └── common/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── LoadingSpinner.tsx
├── services/
│   ├── api.ts
│   ├── photoService.ts
│   ├── uploadService.ts
│   ├── exifService.ts
│   └── aiService.ts
├── hooks/
│   ├── usePhotos.ts
│   ├── useDragAndDrop.ts
│   ├── useAutoSave.ts
│   └── useAIAnalysis.ts
├── types/
│   └── index.ts
├── utils/
│   └── formatters.ts
├── styles/
│   ├── hud-theme.css
│   └── animations.css
├── App.tsx
└── main.tsx
```

---

## Next Steps

1. Create TypeScript types (`types/index.ts`)
2. Build service layer (`services/`)
3. Create HUD design system styles
4. Implement upload flow with EXIF + AI
5. Build LightTableGrid with @dnd-kit
6. Create QuickEditSidebar with all sections
7. Add radar animation for upload
8. Integrate all components in AdminDashboard

Shall I proceed with implementing the TypeScript types and services first?
