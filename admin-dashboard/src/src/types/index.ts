// ============================================================================
// SafariPhoto Types (Extended for Admin Dashboard)
// ============================================================================

export interface SafariPhoto {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  altText?: string;
  caption?: string;
  location?: string;
  photographer?: string;
  dateTaken?: Date;
  
  // Telemetry
  views: number;
  likes: number;
  shares: number;
  downloads: number;
  avgTimeWatchedSeconds: number;
  bounceRate: number;
  
  // Extended fields
  storyContext?: string;
  displayOrder: number;
  
  // Categorization
  category?: PhotoCategory;
  tags?: string[];
  
  // EXIF Data (Extracted during upload)
  exifData?: EXIFData;
  
  // GPS Telemetry
  gpsData?: GPSData;
  
  // AI Suggestions (pending approval)
  aiSuggestions?: AISuggestions;
  
  // Status
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

// ============================================================================
// EXIF Data
// ============================================================================

export interface EXIFData {
  cameraMake?: string;
  cameraModel?: string;
  lens?: string;
  lensModel?: string;
  iso?: number;
  aperture?: string;      // e.g., "f/1.8"
  shutterSpeed?: string;  // e.g., "1/500"
  focalLength?: string;   // e.g., "50mm"
  focalLength35mm?: number;
  exposureCompensation?: string;
  whiteBalance?: string;
  flash?: string;
  meteringMode?: string;
  captureDate?: Date;
  fileSize?: number;
  imageWidth?: number;
  imageHeight?: number;
  colorSpace?: string;
  orientation?: number;
}

// ============================================================================
// GPS Data
// ============================================================================

export interface GPSData {
  latitude: number;
  longitude: number;
  altitude?: number;  // meters
  latitudeRef?: 'N' | 'S';
  longitudeRef?: 'E' | 'W';
  altitudeRef?: number;  // above/below sea level
  gpsTime?: Date;
  gpsDate?: string;
  processingMethod?: 'EXIF' | 'manual' | 'estimated';
}

// ============================================================================
// AI Vision Suggestions
// ============================================================================

export interface AISuggestions {
  // Keywords with categories and confidence
  keywords: AISuggestionItem[];
  
  // Generated content
  altText: AIValueSuggestion;
  caption: AIValueSuggestion;
  storyContext: AIValueSuggestion;
  
  // Technical analysis
  technicalAnalysis?: string;
  compositionNotes?: string;
  lightingNotes?: string;
  
  // Processing metadata
  model: string;        // e.g., "gpt-4o"
  processedAt: Date;
}

export interface AISuggestionItem {
  value: string;
  category: 'wildlife' | 'landscape' | 'technical' | 'artistic' | 'emotional' | 'location';
  confidence: number;   // 0.0 - 1.0
  approved: boolean;
}

export interface AIValueSuggestion {
  value: string;
  confidence: number;
  approved: boolean;
  edited?: boolean;
}

// ============================================================================
// Category Types
// ============================================================================

export type PhotoCategory = 
  | 'wildlife'
  | 'landscape'
  | 'culture'
  | 'accommodation'
  | 'food'
  | 'activity'
  | 'people'
  | 'aerial';

// ============================================================================
// Upload Types
// ============================================================================

export interface UploadFile {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  previewUrl?: string;
  error?: string;
  exifData?: EXIFData;
  gpsData?: GPSData;
  aiSuggestions?: AISuggestions;
  uploadedUrl?: string;
  photoId?: string;
}

export type UploadStatus = 
  | 'pending'
  | 'uploading'
  | 'extracting_exif'
  | 'analyzing_ai'
  | 'saving'
  | 'complete'
  | 'error';

export interface UploadConfig {
  maxFileSize: number;        // bytes
  allowedTypes: string[];     // MIME types
  maxConcurrent: number;
  autoPublish: boolean;
  extractEXIF: boolean;
  analyzeAI: boolean;
}

// ============================================================================
// Form Types
// ============================================================================

export interface TelemetryFormData {
  // GPS
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  
  // Manual telemetry
  views: number;
  likes: number;
  shares: number;
  downloads: number;
}

export interface PhotoFormData {
  imageUrl?: string;
  thumbnailUrl?: string;
  altText?: string;
  caption?: string;
  location?: string;
  photographer?: string;
  dateTaken?: Date | null;
  storyContext?: string;
  displayOrder?: number;
  category?: PhotoCategory;
  tags?: string[];
  isPublished?: boolean;
  isFeatured?: boolean;
  gpsData?: Partial<GPSData>;
  exifData?: Partial<EXIFData>;
}

// ============================================================================
// Filter & Sort Types
// ============================================================================

export interface PhotoFilters {
  category?: PhotoCategory;
  isPublished?: boolean | null;
  isFeatured?: boolean | null;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

export type SortField = 'createdAt' | 'displayOrder' | 'views' | 'likes' | 'dateTaken';
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// ============================================================================
// Dashboard State Types
// ============================================================================

export interface DashboardState {
  photos: SafariPhoto[];
  selectedPhotoId: string | null;
  sidebarOpen: boolean;
  sidebarMode: 'edit' | 'view';
  filters: PhotoFilters;
  sortConfig: SortConfig;
  isUploadModalOpen: boolean;
  isLoading: boolean;
  error?: string;
}

export interface SelectionState {
  selectedIds: string[];
  lastSelectedId: string | null;
  selectionMode: boolean;
}

// ============================================================================
// Animation Types
// ============================================================================

export interface RadarAnimationProps {
  size?: number;
  color?: string;
  speed?: number;
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ============================================================================
// GALLERY TYPES
// ============================================================================

export interface Gallery {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  
  // Settings (JSONB)
  seoSettings: SEOSettings;
  visibilitySettings: VisibilitySettings;
  displaySettings: DisplaySettings;
  
  // Statistics
  photoCount: number;
  totalViews: number;
  
  // Status
  isPublished: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  
  // Relationships (populated on fetch)
  photos?: GalleryPhoto[];
  summary?: GallerySummary;
}

// ============================================================================
// SEO Settings (JSONB)
// ============================================================================

export interface SEOSettings {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}

// ============================================================================
// Visibility Settings (JSONB)
// ============================================================================

export interface VisibilitySettings {
  isPublic: boolean;
  password?: string | null;
  allowedRoles?: string[];
  showOnHomepage: boolean;
  homepageOrder: number;
  startDate?: string | null;  // ISO date string
  endDate?: string | null;    // ISO date string
}

// ============================================================================
// Display Settings (JSONB)
// ============================================================================

export interface DisplaySettings {
  layout: 'grid' | 'masonry' | 'carousel' | 'fullscreen';
  photoPerPage: number;
  showLocation: boolean;
  showDate: boolean;
  showPhotographer: boolean;
  enableLightbox: boolean;
  enableDownload: boolean;
}

// ============================================================================
// Gallery Photo Junction
// ============================================================================

export interface GalleryPhoto {
  id: string;
  galleryId: string;
  photoId: string;
  displayOrder: number;
  isFeatured: boolean;
  captionOverride?: string;
  photo?: SafariPhoto;  // Populated when fetching
  createdAt: Date;
}

// ============================================================================
// Gallery Summary (AI-generated)
// ============================================================================

export interface GallerySummary {
  id: string;
  galleryId: string;
  
  // Generated content
  projectIntro?: string;
  executiveSummary?: string;
  highlights?: string[];
  
  // AI metadata
  generationModel?: string;
  generationPrompt?: string;
  generationParams?: Record<string, unknown>;
  tokensUsed?: number;
  
  // Status
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Gallery Form Data
// ============================================================================

export interface GalleryFormData {
  name: string;
  description?: string;
  coverImageUrl?: string;
  seoSettings?: Partial<SEOSettings>;
  visibilitySettings?: Partial<VisibilitySettings>;
  displaySettings?: Partial<DisplaySettings>;
  isPublished?: boolean;
}

// ============================================================================
// PROJECT TYPES (alias for Gallery for business logic)
// ============================================================================

export interface Project extends Gallery {}
export interface ProjectFormData extends GalleryFormData {}

// ============================================================================
// Gallery Filters
// ============================================================================

export interface GalleryFilters {
  isPublished?: boolean | null;
  isActive?: boolean | null;
  showOnHomepage?: boolean | null;
  searchQuery?: string;
}

// ============================================================================
// Gallery API Response Types
// ============================================================================

export interface GalleryApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface GalleryPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// ============================================================================
// Summary Generation Types
// ============================================================================

export interface SummaryGenerationRequest {
  galleryId: string;
  photos?: string[];  // Optional photo IDs to include in summary
  style?: 'adventure' | 'educational' | 'poetic' | 'professional';
  tone?: 'exciting' | 'informative' | 'reflective' | 'neutral';
  maxLength?: number;
}

export interface SummaryGenerationResponse {
  projectIntro: string;
  executiveSummary: string;
  highlights: string[];
  tokensUsed: number;
  generationTime: number;
}

// ============================================================================
// Gallery State Types (for Dashboard)
// ============================================================================

export interface GalleryState {
  galleries: Gallery[];
  selectedGalleryId: string | null;
  sidebarOpen: boolean;
  activeTab: 'photos' | 'settings' | 'captions' | 'summary';
  filters: GalleryFilters;
  isLoading: boolean;
  error?: string;
}

// ============================================================================
// Caption Types
// ============================================================================

export interface PhotoCaption {
  id: string;
  galleryId: string;
  photoId: string;
  originalCaption?: string;
  generatedCaption?: string;
  approvedCaption?: string;
  isApproved: boolean;
  needsReview: boolean;
  generatedAt?: Date;
  approvedAt?: Date;
}

export interface CaptionGenerationRequest {
  photoUrls: string[];
  galleryContext?: string;
  style?: 'descriptive' | 'story' | 'poetic' | 'informative';
}

export interface CaptionGenerationResponse {
  captions: Array<{
    photoUrl: string;
    caption: string;
    altText: string;
    keywords: string[];
  }>;
  tokensUsed: number;
}
