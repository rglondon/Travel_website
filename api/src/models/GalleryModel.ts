import { supabase } from '../config/database';

export interface Gallery {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  isPublished: boolean;
  isActive: boolean;
  photoCount?: number;
  createdAt: Date;
  updatedAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

export class GalleryModel {
  /**
   * Get all published galleries
   */
  static async findAllPublished(): Promise<Gallery[]> {
    const { data, error } = await supabase
      .from('galleries')
      .select('*')
      .eq('is_published', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching galleries: ${error.message}`);
    }

    return data?.map(this.mapDbToGallery) || [];
  }

  /**
   * Get a gallery by slug (URL-friendly name)
   */
  static async findBySlug(slug: string): Promise<Gallery | null> {
    const { data, error } = await supabase
      .from('galleries')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error fetching gallery: ${error.message}`);
    }

    return this.mapDbToGallery(data);
  }

  /**
   * Get a gallery by ID
   */
  static async findById(id: string): Promise<Gallery | null> {
    const { data, error } = await supabase
      .from('galleries')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error fetching gallery: ${error.message}`);
    }

    return this.mapDbToGallery(data);
  }

  /**
   * Get photos for a gallery
   */
  static async getGalleryPhotos(galleryId: string, publishedOnly: boolean = true): Promise<GalleryPhoto[]> {
    let query = supabase
      .from('photos')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('display_order', { ascending: true });

    if (publishedOnly) {
      query = query.eq('is_published', true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching gallery photos: ${error.message}`);
    }

    return data?.map(this.mapDbToPhoto) || [];
  }

  /**
   * Get gallery with photos (combined query)
   */
  static async findBySlugWithPhotos(slug: string): Promise<{ gallery: Gallery; photos: GalleryPhoto[] } | null> {
    const gallery = await this.findBySlug(slug);

    if (!gallery) {
      return null;
    }

    const photos = await this.getGalleryPhotos(gallery.id, true);

    return { gallery, photos };
  }

  /**
   * Get gallery with photos by ID
   */
  static async findByIdWithPhotos(id: string): Promise<{ gallery: Gallery; photos: GalleryPhoto[] } | null> {
    const gallery = await this.findById(id);

    if (!gallery) {
      return null;
    }

    const photos = await this.getGalleryPhotos(gallery.id, true);

    return { gallery, photos };
  }

  /**
   * Increment view count for a photo
   */
  static async incrementPhotoView(photoId: string): Promise<void> {
    const { data: photo } = await supabase
      .from('photos')
      .select('views')
      .eq('id', photoId)
      .single();

    if (photo) {
      await supabase
        .from('photos')
        .update({ views: (photo.views || 0) + 1 })
        .eq('id', photoId);
    }
  }

  /**
   * Map database row to Gallery type
   */
  private static mapDbToGallery(row: Record<string, unknown>): Gallery {
    return {
      id: row.id as string,
      title: row.title as string,
      slug: row.slug as string,
      description: row.description as string | undefined,
      coverImageUrl: row.cover_image_url as string | undefined,
      isPublished: (row.is_published as boolean) || false,
      isActive: (row.is_active as boolean) || false,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  /**
   * Map database row to GalleryPhoto type
   */
  private static mapDbToPhoto(row: Record<string, unknown>): GalleryPhoto {
    const technicalNotes = row.technical_notes as Record<string, unknown> | null;

    return {
      id: row.id as string,
      galleryId: row.gallery_id as string,
      imageUrl: row.image_url as string,
      thumbnailUrl: row.thumbnail_url as string | undefined,
      altText: row.alt_text as string | undefined,
      fieldJournal: row.field_journal as string | undefined,
      displayOrder: (row.display_order as number) || 0,
      isPublished: (row.is_published as boolean) || false,
      isFeatured: (row.is_featured as boolean) || false,
      views: (row.views as number) || 0,
      likes: (row.likes as number) || 0,
      shares: (row.shares as number) || 0,
      technicalNotes: technicalNotes ? {
        camera: technicalNotes.camera as string | undefined,
        lens: technicalNotes.lens as string | undefined,
        iso: technicalNotes.iso as number | undefined,
        aperture: technicalNotes.aperture as string | undefined,
        shutterSpeed: technicalNotes.shutterSpeed as string | undefined,
        focalLength: technicalNotes.focalLength as string | undefined,
        fileSize: technicalNotes.fileSize as number | undefined,
        imageWidth: technicalNotes.imageWidth as number | undefined,
        imageHeight: technicalNotes.imageHeight as number | undefined,
      } : undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}

export default GalleryModel;
