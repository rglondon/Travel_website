/**
 * Gallery Service
 * Handles CRUD operations for galleries with SEO/visibility settings
 */

import {
  Gallery,
  GalleryFormData,
  GalleryFilters,
  GalleryPhoto,
  GalleryApiResponse,
  GalleryPaginatedResponse,
  SEOSettings,
  VisibilitySettings,
  DisplaySettings,
} from '../types';

interface GalleryCreateRequest {
  name: string;
  description?: string;
  coverImageUrl?: string;
  seoSettings?: Partial<SEOSettings>;
  visibilitySettings?: Partial<VisibilitySettings>;
  displaySettings?: Partial<DisplaySettings>;
  isPublished?: boolean;
}

interface GalleryUpdateRequest extends Partial<GalleryCreateRequest> {
  isActive?: boolean;
}

interface GalleryListParams {
  page?: number;
  limit?: number;
  filters?: GalleryFilters;
  sortBy?: 'name' | 'createdAt' | 'photoCount' | 'totalViews';
  sortOrder?: 'asc' | 'desc';
}

const API_BASE = '/api/admin/galleries';

// Helper to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export class GalleryService {
  /**
   * Fetch all galleries with optional pagination and filters
   */
  static async list(params: GalleryListParams = {}): Promise<GalleryPaginatedResponse<Gallery>> {
    const { page = 1, limit = 20, filters, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    // Build query params
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder,
    });

    if (filters?.isPublished !== null && filters?.isPublished !== undefined) {
      queryParams.append('isPublished', filters.isPublished.toString());
    }
    if (filters?.isActive !== null && filters?.isActive !== undefined) {
      queryParams.append('isActive', filters.isActive.toString());
    }
    if (filters?.showOnHomepage) {
      queryParams.append('showOnHomepage', 'true');
    }
    if (filters?.searchQuery) {
      queryParams.append('q', filters.searchQuery);
    }

    try {
      const response = await fetch(`${API_BASE}?${queryParams.toString()}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data: GalleryApiResponse<Gallery[]> = await response.json();
        return {
          data: data.data || [],
          pagination: {
            page,
            limit,
            total: data.data?.length || 0,
            hasMore: data.data?.length === limit,
          },
        };
      }
    } catch (error) {
      console.warn('Gallery API unavailable, using mock data');
    }

    // Return mock data for demo
    return this.getMockGalleries(page, limit, filters);
  }

  /**
   * Get a single gallery by ID
   */
  static async getById(id: string): Promise<Gallery | null> {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data: GalleryApiResponse<Gallery> = await response.json();
        return data.data || null;
      }
    } catch (error) {
      console.warn('Gallery API unavailable, using mock data');
    }

    // Return mock gallery for demo
    const mockGalleries = this.getMockGalleriesData();
    return mockGalleries.find(g => g.id === id) || mockGalleries[0] || null;
  }

  /**
   * Get gallery by slug
   */
  static async getBySlug(slug: string): Promise<Gallery | null> {
    try {
      const response = await fetch(`${API_BASE}/slug/${slug}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data: GalleryApiResponse<Gallery> = await response.json();
        return data.data || null;
      }
    } catch (error) {
      console.warn('Gallery API unavailable, using mock data');
    }

    // Return mock gallery for demo
    const mockGalleries = this.getMockGalleriesData();
    return mockGalleries.find(g => g.slug === slug) || null;
  }

  /**
   * Create a new gallery
   */
  static async create(data: GalleryCreateRequest): Promise<Gallery> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result: GalleryApiResponse<Gallery> = await response.json();
        return result.data!;
      }
    } catch (error) {
      console.warn('Gallery API unavailable, using mock data');
    }

    // Create mock gallery for demo
    const newGallery: Gallery = {
      id: `gallery_${Date.now()}`,
      name: data.name,
      slug: this.generateSlug(data.name),
      description: data.description,
      coverImageUrl: data.coverImageUrl,
      seoSettings: {
        metaTitle: data.name,
        metaDescription: data.description,
        keywords: [],
        ...data.seoSettings,
      },
      visibilitySettings: {
        isPublic: true,
        showOnHomepage: false,
        homepageOrder: 0,
        ...data.visibilitySettings,
      },
      displaySettings: {
        layout: 'grid',
        photoPerPage: 20,
        showLocation: true,
        showDate: true,
        showPhotographer: true,
        enableLightbox: true,
        enableDownload: false,
        ...data.displaySettings,
      },
      photoCount: 0,
      totalViews: 0,
      isPublished: data.isPublished ?? false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: data.isPublished ? new Date() : undefined,
    };

    return newGallery;
  }

  /**
   * Update an existing gallery
   */
  static async update(id: string, data: GalleryUpdateRequest): Promise<Gallery | null> {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result: GalleryApiResponse<Gallery> = await response.json();
        return result.data || null;
      }
    } catch (error) {
      console.warn('Gallery API unavailable, using mock data');
    }

    // Return updated mock gallery for demo
    const mockGalleries = this.getMockGalleriesData();
    const existing = mockGalleries.find(g => g.id === id);
    if (existing) {
      return { ...existing, ...data, updatedAt: new Date() };
    }
    return null;
  }

  /**
   * Delete a gallery
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      return response.ok;
    } catch (error) {
      console.warn('Gallery API unavailable, mock delete always succeeds');
      return true;
    }
  }

  /**
   * Update gallery SEO settings
   */
  static async updateSEOSettings(id: string, seoSettings: Partial<SEOSettings>): Promise<Gallery | null> {
    return this.update(id, { seoSettings } as GalleryUpdateRequest);
  }

  /**
   * Update gallery visibility settings
   */
  static async updateVisibilitySettings(id: string, visibilitySettings: Partial<VisibilitySettings>): Promise<Gallery | null> {
    return this.update(id, { visibilitySettings } as GalleryUpdateRequest);
  }

  /**
   * Update gallery display settings
   */
  static async updateDisplaySettings(id: string, displaySettings: Partial<DisplaySettings>): Promise<Gallery | null> {
    return this.update(id, { displaySettings } as GalleryUpdateRequest);
  }

  /**
   * Add photo to gallery
   */
  static async addPhoto(galleryId: string, photoId: string, displayOrder?: number): Promise<GalleryPhoto | null> {
    try {
      const response = await fetch(`${API_BASE}/${galleryId}/photos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ photoId, displayOrder }),
      });

      if (response.ok) {
        const data: GalleryApiResponse<GalleryPhoto> = await response.json();
        return data.data || null;
      }
    } catch (error) {
      console.warn('Gallery API unavailable, using mock data');
    }

    // Return mock GalleryPhoto for demo
    return {
      id: `gp_${Date.now()}`,
      galleryId,
      photoId,
      displayOrder: displayOrder || 0,
      isFeatured: false,
      createdAt: new Date(),
    };
  }

  /**
   * Remove photo from gallery
   */
  static async removePhoto(galleryId: string, photoId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/${galleryId}/photos/${photoId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      return response.ok;
    } catch (error) {
      console.warn('Gallery API unavailable, mock remove always succeeds');
      return true;
    }
  }

  /**
   * Reorder photos in gallery
   */
  static async reorderPhotos(galleryId: string, photoOrders: Array<{ photoId: string; displayOrder: number }>): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/${galleryId}/photos/reorder`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ photoOrders }),
      });

      return response.ok;
    } catch (error) {
      console.warn('Gallery API unavailable, mock reorder always succeeds');
      return true;
    }
  }

  /**
   * Publish gallery
   */
  static async publish(id: string): Promise<Gallery | null> {
    return this.update(id, { isPublished: true });
  }

  /**
   * Unpublish gallery
   */
  static async unpublish(id: string): Promise<Gallery | null> {
    return this.update(id, { isPublished: false });
  }

  /**
   * Duplicate gallery
   */
  static async duplicate(id: string, newName?: string): Promise<Gallery | null> {
    const original = await this.getById(id);
    if (!original) return null;

    return this.create({
      name: newName || `${original.name} (Copy)`,
      description: original.description,
      coverImageUrl: original.coverImageUrl,
      seoSettings: original.seoSettings,
      visibilitySettings: original.visibilitySettings,
      displaySettings: original.displaySettings,
      isPublished: false,
    });
  }

  /**
   * Generate URL-friendly slug from name
   */
  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // =========================================================================
  // Mock Data Methods (for demo when API unavailable)
  // =========================================================================

  private static getMockGalleriesData(): Gallery[] {
    return [
      {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Serengeti Wildlife Safari',
        slug: 'serengeti-wildlife-safari',
        description: 'Experience the breathtaking wildlife of Serengeti National Park in Tanzania. From majestic lions to massive elephant herds.',
        coverImageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800',
        seoSettings: {
          metaTitle: 'Serengeti Wildlife Safari Photos | Henry Travel',
          metaDescription: 'Browse stunning wildlife photography from our Serengeti safari expedition.',
          keywords: ['serengeti', 'wildlife', 'safari', 'tanzania', 'lions', 'elephants'],
          ogImage: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800',
        },
        visibilitySettings: {
          isPublic: true,
          showOnHomepage: true,
          homepageOrder: 1,
        },
        displaySettings: {
          layout: 'grid',
          photoPerPage: 20,
          showLocation: true,
          showDate: true,
          showPhotographer: true,
          enableLightbox: true,
          enableDownload: false,
        },
        photoCount: 15,
        totalViews: 12450,
        isPublished: true,
        isActive: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        publishedAt: new Date('2024-01-16'),
      },
      {
        id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        name: 'Masai Mara Adventure',
        slug: 'masai-mara-adventure',
        description: 'Join us on an unforgettable journey through the iconic Masai Mara, home to the Great Migration.',
        coverImageUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800',
        seoSettings: {
          metaTitle: 'Masai Mara Safari Photos | Henry Travel',
          metaDescription: 'Experience the magic of Masai Mara with our photo gallery.',
          keywords: ['masai mara', 'safari', 'kenya', 'migration', 'wildebeest'],
        },
        visibilitySettings: {
          isPublic: true,
          showOnHomepage: true,
          homepageOrder: 2,
        },
        displaySettings: {
          layout: 'grid',
          photoPerPage: 20,
          showLocation: true,
          showDate: true,
          showPhotographer: true,
          enableLightbox: true,
          enableDownload: false,
        },
        photoCount: 12,
        totalViews: 8920,
        isPublished: true,
        isActive: true,
        createdAt: new Date('2024-01-14'),
        updatedAt: new Date('2024-01-19'),
        publishedAt: new Date('2024-01-15'),
      },
      {
        id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        name: 'Ngorongoro Crater',
        slug: 'ngorongoro-crater',
        description: 'Explore the wonders of Ngorongoro Crater, a UNESCO World Heritage Site and natural wonder.',
        coverImageUrl: 'https://images.unsplash.com/photo-1504618223053-559bdef9dd5a?w=800',
        seoSettings: {
          metaTitle: 'Ngorongoro Crater Photography | Henry Travel',
          metaDescription: 'Discover the stunning landscapes and wildlife of Ngorongoro Crater.',
          keywords: ['ngorongoro', 'crater', 'tanzania', 'landscape', 'photography'],
        },
        visibilitySettings: {
          isPublic: true,
          showOnHomepage: false,
          homepageOrder: 0,
        },
        displaySettings: {
          layout: 'grid',
          photoPerPage: 20,
          showLocation: true,
          showDate: true,
          showPhotographer: true,
          enableLightbox: true,
          enableDownload: false,
        },
        photoCount: 8,
        totalViews: 5430,
        isPublished: true,
        isActive: true,
        createdAt: new Date('2024-01-13'),
        updatedAt: new Date('2024-01-18'),
        publishedAt: new Date('2024-01-14'),
      },
      {
        id: 'd4e5f6a7-b8c9-0123-def0-1234567890123',
        name: 'Victoria Falls Expedition',
        slug: 'victoria-falls-expedition',
        description: 'Witness the raw power and beauty of the world\'s largest waterfall.',
        coverImageUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800',
        seoSettings: {
          metaTitle: 'Victoria Falls Photos | Henry Travel',
          metaDescription: 'Experience the thundering beauty of Victoria Falls.',
          keywords: ['victoria falls', 'waterfall', 'zambia', 'zimbabwe', 'rainbow'],
        },
        visibilitySettings: {
          isPublic: true,
          showOnHomepage: false,
          homepageOrder: 0,
        },
        displaySettings: {
          layout: 'grid',
          photoPerPage: 20,
          showLocation: true,
          showDate: true,
          showPhotographer: true,
          enableLightbox: true,
          enableDownload: false,
        },
        photoCount: 6,
        totalViews: 3210,
        isPublished: true,
        isActive: true,
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-17'),
        publishedAt: new Date('2024-01-13'),
      },
    ];
  }

  private static getMockGalleries(page: number, limit: number, filters?: GalleryFilters): GalleryPaginatedResponse<Gallery> {
    let galleries = this.getMockGalleriesData();

    // Apply filters
    if (filters?.isPublished !== null && filters?.isPublished !== undefined) {
      galleries = galleries.filter(g => g.isPublished === filters.isPublished);
    }
    if (filters?.isActive !== null && filters?.isActive !== undefined) {
      galleries = galleries.filter(g => g.isActive === filters.isActive);
    }
    if (filters?.showOnHomepage) {
      galleries = galleries.filter(g => g.visibilitySettings.showOnHomepage);
    }
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      galleries = galleries.filter(
        g => g.name.toLowerCase().includes(query) || g.description?.toLowerCase().includes(query)
      );
    }

    return {
      data: galleries,
      pagination: {
        page,
        limit,
        total: galleries.length,
        hasMore: false,
      },
    };
  }
}

export const galleryService = GalleryService;
export default GalleryService;
