export interface SafariPhoto {
    id: string;
    imageUrl: string;
    thumbnailUrl?: string;
    altText?: string;
    caption?: string;
    location?: string;
    photographer?: string;
    dateTaken?: Date;
    views: number;
    likes: number;
    shares: number;
    downloads: number;
    avgTimeWatchedSeconds: number;
    bounceRate: number;
    storyContext?: string;
    displayOrder: number;
    category?: PhotoCategory;
    tags?: string[];
    isPublished: boolean;
    isFeatured: boolean;
    aiSubject?: string;
    aiDescription?: string;
    aiProcessed: boolean;
    galleryLayout?: 'tiles' | 'filmstrip' | 'storyMap';
    metaTitle?: string;
    metaDescription?: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    updatedBy?: string;
}
export type PhotoCategory = 'wildlife' | 'landscape' | 'culture' | 'accommodation' | 'food' | 'activity' | 'people';
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
export interface ReorderInput {
    photoId: string;
    newOrder: number;
}
export interface PublishStatusInput {
    photoIds: string[];
    isPublished: boolean;
}
//# sourceMappingURL=safariPhoto.d.ts.map