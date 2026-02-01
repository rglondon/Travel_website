// SafariPhoto Type Definition
// Version 1.8 - Professional CMS with AI Integration

export interface SafariPhoto {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  altText?: string;
  caption?: string;
  location?: string;
  photographer?: string;
  dateTaken?: Date;
  
  // Telemetry fields
  views: number;
  likes: number;
  shares: number;
  downloads: number;
  avgTimeWatchedSeconds: number;
  bounceRate: number;
  
  // Story & Ordering
  storyContext?: string;
  displayOrder: number;
  
  // Categorization
  category?: PhotoCategory;
  tags?: string[];
  
  // Status
  isPublished: boolean;
  isFeatured: boolean;
  
  // Version 1.8: AI Integration
  aiSubject?: string;        // Subject (Alt-Text)
  aiDescription?: string;    // Field Journal (Description)
  aiProcessed: boolean;      // Has AI processed this photo?
  
  // Version 1.8: Gallery Settings
  galleryLayout?: 'tiles' | 'filmstrip' | 'storyMap';
  metaTitle?: string;
  metaDescription?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export type PhotoCategory = 
  | 'wildlife'
  | 'landscape'
  | 'culture'
  | 'accommodation'
  | 'food'
  | 'activity'
  | 'people';

export interface CreateSafariPhotoInput {
  imageUrl: string;
  thumbnailUrl?: string;
  altText?: string;
  caption?: string;
  location?: string;
  photographer?: string;
  dateTaken?: Date;
  storyContext?: string;
  displayOrder?: number;
  category?: PhotoCategory;
  tags?: string[];
  isPublished?: boolean;
  isFeatured?: boolean;
  
  // Version 1.8
  aiSubject?: string;
  aiDescription?: string;
  aiProcessed?: boolean;
  galleryLayout?: 'tiles' | 'filmstrip' | 'storyMap';
  metaTitle?: string;
  metaDescription?: string;
}

export interface UpdateSafariPhotoInput {
  imageUrl?: string;
  thumbnailUrl?: string;
  altText?: string;
  caption?: string;
  location?: string;
  photographer?: string;
  dateTaken?: Date;
  storyContext?: string;
  displayOrder?: number;
  category?: PhotoCategory;
  tags?: string[];
  isPublished?: boolean;
  isFeatured?: boolean;
  
  // Version 1.8
  aiSubject?: string;
  aiDescription?: string;
  aiProcessed?: boolean;
  galleryLayout?: 'tiles' | 'filmstrip' | 'storyMap';
  metaTitle?: string;
  metaDescription?: string;
}

export interface PhotoQueryParams {
  category?: PhotoCategory;
  isFeatured?: boolean;
  isPublished?: boolean;
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'displayOrder' | 'views' | 'likes';
  sortOrder?: 'asc' | 'desc';
}

export interface PhotoTelemetry {
  views: number;
  likes: number;
  shares: number;
  downloads: number;
  avgTimeWatchedSeconds: number;
  bounceRate: number;
}

// Version 1.8: Reorder input for drag-and-drop
export interface ReorderInput {
  photoId: string;
  newOrder: number;
}

// Version 1.8: Batch update for Published/Draft bins
export interface PublishStatusInput {
  photoIds: string[];
  isPublished: boolean;
}
