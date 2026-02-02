# Henry Travel Admin Dashboard

High-end React Admin Dashboard for managing Henry Travel Website photos with AI-powered automation.

## 🎯 Features

### Light Table Interface
- **Visual Grid**: Minimalist photo grid with drag-and-drop reordering using @dnd-kit
- **Quick-Edit Sidebar**: Slide-out panel for editing photo metadata
- **HUD Design System**: Clean aesthetic with #FAFAFA background, #1A1A1A lines, IBM Plex Mono typography

### Automated Intelligence
- **EXIF Extraction**: Auto-extract GPS coordinates, altitude, camera specs on upload
- **AI Vision Integration**: OpenAI GPT-4o analyzes photos to generate:
  - SEO Keywords (prioritizing Cinematic, Fine Art, Documentary)
  - Suggested Alt Text for accessibility
  - Story Context and Captions
- **Approval Workflow**: Review and approve AI suggestions before finalizing

### Upload Flow
- **Drag & Drop**: Large drop zone with radar scan animation
- **Real-time Progress**: Upload → EXIF extraction → AI analysis → Save
- **Batch Processing**: Queue multiple photos for processing

## 📁 Project Structure

```
admin-dashboard/
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   └── AdminDashboard.tsx     # Main dashboard with LightTableGrid
│   │   ├── photo/
│   │   │   └── PhotoCard.tsx          # Sortable photo card
│   │   ├── sidebar/
│   │   │   ├── QuickEditSidebar.tsx   # Slide-out editing panel
│   │   │   └── AIBrainSection.tsx     # AI suggestions with approval
│   │   ├── upload/
│   │   │   ├── DropZone.tsx           # Drag & drop upload zone
│   │   │   └── RadarAnimation.tsx     # Radar scan animation
│   │   └── common/
│   │       └── Button.tsx
│   ├── services/
│   │   ├── api.ts                     # Base API client
│   │   ├── uploadService.ts           # Upload with processing pipeline
│   │   ├── exifService.ts             # EXIF extraction (exif-js)
│   │   └── aiService.ts               # OpenAI Vision API
│   ├── hooks/
│   │   └── usePhotos.ts
│   ├── types/
│   │   └── index.ts                   # TypeScript definitions
│   ├── styles/
│   │   └── hud-theme.css              # HUD design system
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Running backend server (port 3000)
- OpenAI API key for AI features

### Installation

```bash
cd admin-dashboard
npm install
```

### Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000
VITE_OPENAI_API_KEY=your-openai-api-key
```

### Development

```bash
npm run dev
```

Dashboard runs at http://localhost:5173

### Production Build

```bash
npm run build
```

## 🔧 Configuration

### Upload Service (`services/uploadService.ts`)

```typescript
const config: UploadConfig = {
  maxFileSize: 50 * 1024 * 1024,  // 50MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  maxConcurrent: 3,
  autoPublish: true,
  extractEXIF: true,
  analyzeAI: true,
};
```

### AI Service (`services/aiService.ts`)

```typescript
const options: AIAnalysisOptions = {
  apiKey: 'your-openai-key',
  model: 'gpt-4o',
  maxTokens: 1500,
  includeTechnical: true,
};
```

## 📊 Data Types

### SafariPhoto
```typescript
interface SafariPhoto {
  id: string;
  imageUrl: string;
  altText?: string;
  caption?: string;
  storyContext?: string;
  displayOrder: number;
  views: number;
  likes: number;
  shares: number;
  downloads: number;
  category?: PhotoCategory;
  tags?: string[];
  exifData?: EXIFData;       // Extracted from image
  gpsData?: GPSData;         // GPS coordinates
  aiSuggestions?: AISuggestions; // AI-generated
  isPublished: boolean;
  isFeatured: boolean;
}
```

### EXIF Data
```typescript
interface EXIFData {
  cameraMake?: string;
  cameraModel?: string;
  lens?: string;
  iso?: number;
  aperture?: string;      // f/1.8
  shutterSpeed?: string;  // 1/500
  focalLength?: string;   // 50mm
  captureDate?: Date;
}
```

### GPS Data
```typescript
interface GPSData {
  latitude: number;
  longitude: number;
  altitude?: number;  // meters
  processingMethod: 'EXIF' | 'manual' | 'estimated';
}
```

### AI Suggestions
```typescript
interface AISuggestions {
  keywords: AISuggestionItem[];
  altText: AIValueSuggestion;
  caption: AIValueSuggestion;
  storyContext: AIValueSuggestion;
  technicalAnalysis?: string;
  model: string;
  processedAt: Date;
}
```

## 🎨 HUD Design System

### Colors
```css
--color-bg: #FAFAFA;           /* Background */
--color-line: #1A1A1A;         /* Lines/Borders */
--color-accent: #0066FF;       /* Interactive */
--color-success: #00D4AA;      /* Success */
--color-warning: #FF6B35;      /* Warning */
```

### Typography
```css
font-family: 'IBM Plex Mono', monospace;
```

### Components
- Sharp edges (0px border-radius)
- Monospace labels
- Minimalist badges
- Hover overlays on photo cards

## 🔒 Security

1. **Authentication**: JWT token required for all admin endpoints
2. **Role-based**: User must have `role: 'admin'` in Supabase auth metadata
3. **RLS Policies**: Database-level row security in Supabase
4. **API Validation**: Server-side input validation on all endpoints

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/photos` | List all photos |
| POST | `/api/admin/photos` | Create photo |
| PUT | `/api/admin/photos/:id` | Update photo |
| DELETE | `/api/admin/photos/:id` | Delete photo |
| POST | `/api/admin/photos/reorder` | Bulk reorder |
| POST | `/api/admin/upload` | Upload file to storage |

## 🤖 AI Workflow

1. User drops photo in drop zone
2. Upload to Supabase Storage
3. Extract EXIF data (GPS, camera specs)
4. Send image URL to OpenAI Vision API
5. Parse AI response for:
   - Keywords with confidence scores
   - Alt text suggestion
   - Caption and story context
6. Display suggestions in QuickEditSidebar
7. Admin reviews and approves/edits
8. Final save to database with approved values

## 📱 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Esc` | Close sidebar |
| `Ctrl+U` | Open upload modal |

## 🛠 Tech Stack

- **React 18** - UI framework
- **@dnd-kit** - Drag and drop
- **TypeScript** - Type safety
- **Vite** - Build tool
- **exif-js** - EXIF extraction
- **OpenAI GPT-4o** - Vision analysis

## 📄 License

MIT
