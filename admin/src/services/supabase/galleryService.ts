/**
 * Supabase Gallery Service
 * CRUD operations for galleries with Supabase integration
 */

import { supabase } from './client';
import { Gallery, GalleryFormData, SafariPhoto } from '../../types';

// Type definitions matching Supabase schema
interface SupabaseGallery {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  cover_thumbnail_url: string | null;
  project_context: string | null;
  visibility_settings: {
    is_public: boolean;
    show_on_homepage: boolean;
  };
  seo_settings: Record<string, unknown>;
  is_published: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

interface SupabasePhoto {
  id: string;
  gallery_id: string;
  image_url: string;
  thumbnail_url: string | null;
  alt_text: string | null;
  field_journal: string | null;
  ai_keywords: string[] | null;
  display_order: number;
  views: number;
  likes: number;
  shares: number;
  category: string | null;
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

// Convert Supabase gallery to app Gallery type
const mapGallery = (g: SupabaseGallery): Gallery => ({
  id: g.id,
  name: g.title,
  slug: g.slug,
  description: g.description || undefined,
  coverImageUrl: g.cover_image_url || undefined,
  thumbnailUrl: g.cover_thumbnail_url || undefined,
  projectContext: g.project_context || undefined,
  visibilitySettings: {
    isPublic: g.visibility_settings?.is_public ?? true,
    showOnHomepage: g.visibility_settings?.show_on_homepage ?? false,
  },
  seoSettings: g.seo_settings as Gallery['seoSettings'],
  isPublished: g.is_published,
  isActive: g.is_active,
  createdAt: new Date(g.created_at),
  updatedAt: new Date(g.updated_at),
  publishedAt: g.published_at ? new Date(g.published_at) : undefined,
});

// Convert Supabase photo to SafariPhoto type
const mapPhoto = (p: SupabasePhoto): SafariPhoto => ({
  id: p.id,
  imageUrl: p.image_url,
  thumbnailUrl: p.thumbnail_url || undefined,
  altText: p.alt_text || undefined,
  caption: p.field_journal || undefined,
  storyContext: p.field_journal || undefined,
  displayOrder: p.display_order,
  views: p.views,
  likes: p.likes,
  shares: p.shares,
  category: p.category as SafariPhoto['category'],
  isPublished: p.is_published,
  isFeatured: p.is_featured,
  createdAt: new Date(p.created_at),
  updatedAt: new Date(p.updated_at),
});

export class SupabaseGalleryService {
  private static instance: SupabaseGalleryService;
  private isConfigured: boolean = false;

  private constructor() {
    const url = (supabase as { supabaseUrl?: string }).supabaseUrl;
    const key = (supabase as { supabaseKey?: string }).supabaseKey;
    this.isConfigured = !!url && !!key;
  }

  static getInstance(): SupabaseGalleryService {
    if (!SupabaseGalleryService.instance) {
      SupabaseGalleryService.instance = new SupabaseGalleryService();
    }
    return SupabaseGalleryService.instance;
  }

  /**
   * Create a new gallery (Project)
   */
  async create(data: GalleryFormData): Promise<Gallery | null> {
    if (!this.isConfigured) {
      console.warn('Supabase not configured');
      return null;
    }

    try {
      const { data: gallery, error } = await supabase
        .from('galleries')
        .insert({
          title: data.name,
          slug: this.generateSlug(data.name),
          description: data.description,
          cover_image_url: data.coverImageUrl,
          project_context: data.projectContext,
          visibility_settings: {
            is_public: data.visibilitySettings?.isPublic ?? true,
            show_on_homepage: data.visibilitySettings?.showOnHomepage ?? false,
          },
          seo_settings: data.seoSettings,
          is_published: data.isPublished ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      if (!gallery) return null;

      return mapGallery(gallery);
    } catch (error) {
      console.error('Failed to create gallery:', error);
      return null;
    }
  }

  /**
   * Update an existing gallery
   */
  async update(id: string, data: Partial<GalleryFormData>): Promise<Gallery | null> {
    if (!this.isConfigured) {
      console.warn('Supabase not configured');
      return null;
    }

    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (data.name !== undefined) {
        updateData.title = data.name;
        updateData.slug = this.generateSlug(data.name);
      }
      if (data.description !== undefined) updateData.description = data.description;
      if (data.coverImageUrl !== undefined) updateData.cover_image_url = data.coverImageUrl;
      if (data.projectContext !== undefined) updateData.project_context = data.projectContext;
      if (data.visibilitySettings !== undefined) {
        updateData.visibility_settings = {
          is_public: data.visibilitySettings.isPublic,
          show_on_homepage: data.visibilitySettings.showOnHomepage,
        };
      }
      if (data.seoSettings !== undefined) updateData.seo_settings = data.seoSettings;
      if (data.isPublished !== undefined) {
        updateData.is_published = data.isPublished;
        if (data.isPublished) {
          updateData.published_at = new Date().toISOString();
        }
      }

      const { data: gallery, error } = await supabase
        .from('galleries')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!gallery) return null;

      return mapGallery(gallery);
    } catch (error) {
      console.error('Failed to update gallery:', error);
      return null;
    }
  }

  /**
   * Delete a gallery (cascades to photos via foreign key)
   */
  async delete(id: string): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn('Supabase not configured');
      return false;
    }

    try {
      const { error } = await supabase
        .from('galleries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to delete gallery:', error);
      return false;
    }
  }

  /**
   * Fetch all galleries
   */
  async list(): Promise<Gallery[]> {
    if (!this.isConfigured) {
      console.warn('Supabase not configured');
      return [];
    }

    try {
      const { data: galleries, error } = await supabase
        .from('galleries')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!galleries) return [];

      return galleries.map(mapGallery);
    } catch (error) {
      console.error('Failed to fetch galleries:', error);
      return [];
    }
  }

  /**
   * Get a single gallery by ID
   */
  async getById(id: string): Promise<Gallery | null> {
    if (!this.isConfigured) {
      console.warn('Supabase not configured');
      return null;
    }

    try {
      const { data: gallery, error } = await supabase
        .from('galleries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!gallery) return null;

      return mapGallery(gallery);
    } catch (error) {
      console.error('Failed to fetch gallery:', error);
      return null;
    }
  }

  /**
   * Get gallery by slug
   */
  async getBySlug(slug: string): Promise<Gallery | null> {
    if (!this.isConfigured) {
      console.warn('Supabase not configured');
      return null;
    }

    try {
      const { data: gallery, error } = await supabase
        .from('galleries')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      if (!gallery) return null;

      return mapGallery(gallery);
    } catch (error) {
      console.error('Failed to fetch gallery by slug:', error);
      return null;
    }
  }

  /**
   * Fetch photos for a gallery with ordering
   */
  async getPhotos(galleryId: string): Promise<SafariPhoto[]> {
    if (!this.isConfigured) {
      console.warn('Supabase not configured');
      return [];
    }

    try {
      const { data: photos, error } = await supabase
        .from('photos')
        .select('*')
        .eq('gallery_id', galleryId)
        .eq('is_published', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      if (!photos) return [];

      return photos.map(mapPhoto);
    } catch (error) {
      console.error('Failed to fetch photos:', error);
      return [];
    }
  }

  /**
   * Update photo display order (bulk reorder)
   */
  async reorderPhotos(
    galleryId: string,
    photoOrders: Array<{ photoId: string; displayOrder: number }>
  ): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn('Supabase not configured');
      return false;
    }

    try {
      // Use upsert for efficient bulk update
      const updates = photoOrders.map(({ photoId, displayOrder }) => ({
        id: photoId,
        gallery_id: galleryId,
        display_order: displayOrder,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('photos')
        .upsert(updates, {
          onConflict: 'id',
          ignoreDuplicates: false,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to reorder photos:', error);
      return false;
    }
  }

  /**
   * Delete a photo
   */
  async deletePhoto(photoId: string): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn('Supabase not configured');
      return false;
    }

    try {
      // First, get the photo to delete from storage
      const { data: photo, error: fetchError } = await supabase
        .from('photos')
        .select('image_url, thumbnail_url')
        .eq('id', photoId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // Delete from storage if URLs exist
      if (photo?.image_url) {
        try {
          const imagePath = photo.image_url.split('/').pop();
          if (imagePath) {
            await supabase.storage.from('galleries').remove([imagePath]);
          }
        } catch (storageError) {
          console.warn('Failed to delete from storage:', storageError);
        }
      }

      // Delete database record
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to delete photo:', error);
      return false;
    }
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

export const supabaseGalleryService = SupabaseGalleryService.getInstance();
export default SupabaseGalleryService;
