const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface Gallery {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  isPublished: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryPhoto {
  id: string;
  galleryId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  altText?: string;
  fieldJournal?: string;
  displayOrder: number;
  isPublished: boolean;
  isFeatured: boolean;
  views: number;
  likes: number;
  shares: number;
  technicalNotes?: {
    camera?: string;
    lens?: string;
    iso?: number;
    aperture?: string;
    shutterSpeed?: string;
    focalLength?: string;
    fileSize?: number;
    imageWidth?: number;
    imageHeight?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GalleryWithPhotos {
  gallery: Gallery;
  photos: GalleryPhoto[];
}

// Transform API photo to frontend format
export function transformPhoto(photo: GalleryPhoto): {
  src: string;
  alt: string;
  iso: string;
  aperture: string;
  shutter: string;
  camera: string;
  lens: string;
  location: string;
  fieldJournal?: string;
} {
  const tech = photo.technicalNotes || {};
  return {
    src: photo.imageUrl,
    alt: photo.altText || 'Photo',
    iso: tech.iso?.toString() || 'N/A',
    aperture: tech.aperture || 'N/A',
    shutter: tech.shutterSpeed || 'N/A',
    camera: tech.camera || 'Unknown',
    lens: tech.lens || 'Unknown',
    location: photo.fieldJournal?.split('\n')[0] || 'Unknown Location',
    fieldJournal: photo.fieldJournal,
  };
}

export async function fetchGalleries(): Promise<Gallery[]> {
  try {
    const response = await fetch(`${API_URL}/galleries`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch galleries');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error fetching galleries:', error);
    return [];
  }
}

export async function fetchGalleryBySlug(slug: string): Promise<GalleryWithPhotos | null> {
  try {
    const response = await fetch(`${API_URL}/galleries/${slug}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch gallery');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error fetching gallery:', error);
    return null;
  }
}

export async function fetchGalleryPhotos(slug: string): Promise<GalleryPhoto[]> {
  try {
    const response = await fetch(`${API_URL}/galleries/${slug}/photos`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch photos');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error fetching photos:', error);
    return [];
  }
}

export async function recordPhotoView(photoId: string): Promise<void> {
  try {
    await fetch(`${API_URL}/galleries/photos/${photoId}/view`, {
      method: 'POST',
    });
  } catch (error) {
    console.error('Error recording view:', error);
  }
}
