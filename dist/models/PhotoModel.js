"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhotoModel = void 0;
const database_1 = require("../config/database");
class PhotoModel {
    /**
     * Get all photos with optional filtering and pagination
     */
    static async findAll(params = {}) {
        let query = database_1.supabase
            .from('safari_photos')
            .select('*');
        // Apply filters
        if (params.isPublished !== undefined) {
            query = query.eq('is_published', params.isPublished);
        }
        if (params.category) {
            query = query.eq('category', params.category);
        }
        if (params.isFeatured !== undefined) {
            query = query.eq('is_featured', params.isFeatured);
        }
        if (params.tags && params.tags.length > 0) {
            query = query.contains('tags', params.tags);
        }
        // Apply sorting
        const sortField = params.sortBy || 'display_order';
        const sortOrder = params.sortOrder || 'asc';
        query = query.order(sortField, { ascending: sortOrder === 'asc' });
        // Apply pagination
        const limit = params.limit || 50;
        const offset = params.offset || 0;
        query = query.range(offset, offset + limit - 1);
        const { data, error } = await query;
        if (error) {
            throw new Error(`Error fetching photos: ${error.message}`);
        }
        return data?.map(this.mapDbToPhoto) || [];
    }
    /**
     * Get all photos (both published and draft)
     */
    static async findAllForAdmin() {
        const { data, error } = await database_1.supabase
            .from('safari_photos')
            .select('*')
            .order('display_order', { ascending: true });
        if (error) {
            throw new Error(`Error fetching photos: ${error.message}`);
        }
        return data?.map(this.mapDbToPhoto) || [];
    }
    /**
     * Get a single photo by ID
     */
    static async findById(id) {
        const { data, error } = await database_1.supabase
            .from('safari_photos')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                return null; // Not found
            }
            throw new Error(`Error fetching photo: ${error.message}`);
        }
        return this.mapDbToPhoto(data);
    }
    /**
     * Get featured photos
     */
    static async findFeatured(limit = 10) {
        const { data, error } = await database_1.supabase
            .from('safari_photos')
            .select('*')
            .eq('is_featured', true)
            .eq('is_published', true)
            .order('display_order', { ascending: true })
            .limit(limit);
        if (error) {
            throw new Error(`Error fetching featured photos: ${error.message}`);
        }
        return data?.map(this.mapDbToPhoto) || [];
    }
    /**
     * Create a new photo
     */
    static async create(input, userId) {
        const photoData = {
            image_url: input.imageUrl,
            thumbnail_url: input.thumbnailUrl,
            alt_text: input.altText,
            caption: input.caption,
            location: input.location,
            photographer: input.photographer,
            date_taken: input.dateTaken?.toISOString(),
            story_context: input.storyContext,
            display_order: input.displayOrder ?? await this.getNextDisplayOrder(),
            category: input.category,
            tags: input.tags,
            is_published: input.isPublished ?? true,
            is_featured: input.isFeatured ?? false,
            // Version 1.8 fields
            ai_subject: input.aiSubject,
            ai_description: input.aiDescription,
            ai_processed: input.aiProcessed ?? false,
            gallery_layout: input.galleryLayout ?? 'tiles',
            meta_title: input.metaTitle,
            meta_description: input.metaDescription,
            created_by: userId,
        };
        const { data, error } = await database_1.supabase
            .from('safari_photos')
            .insert(photoData)
            .select()
            .single();
        if (error) {
            throw new Error(`Error creating photo: ${error.message}`);
        }
        return this.mapDbToPhoto(data);
    }
    /**
     * Get the next display_order (for chronological integrity - newest first)
     */
    static async getNextDisplayOrder() {
        const { data, error } = await database_1.supabase
            .from('safari_photos')
            .select('display_order')
            .order('display_order', { ascending: false })
            .limit(1)
            .single();
        if (error || !data) {
            return 0; // First photo
        }
        return data.display_order + 1;
    }
    /**
     * Update an existing photo
     */
    static async update(id, input, userId) {
        const updateData = {
            updated_by: userId,
        };
        // Map input fields to database columns
        if (input.imageUrl !== undefined)
            updateData.image_url = input.imageUrl;
        if (input.thumbnailUrl !== undefined)
            updateData.thumbnail_url = input.thumbnailUrl;
        if (input.altText !== undefined)
            updateData.alt_text = input.altText;
        if (input.caption !== undefined)
            updateData.caption = input.caption;
        if (input.location !== undefined)
            updateData.location = input.location;
        if (input.photographer !== undefined)
            updateData.photographer = input.photographer;
        if (input.dateTaken !== undefined)
            updateData.date_taken = input.dateTaken.toISOString();
        if (input.storyContext !== undefined)
            updateData.story_context = input.storyContext;
        if (input.displayOrder !== undefined)
            updateData.display_order = input.displayOrder;
        if (input.category !== undefined)
            updateData.category = input.category;
        if (input.tags !== undefined)
            updateData.tags = input.tags;
        if (input.isPublished !== undefined)
            updateData.is_published = input.isPublished;
        if (input.isFeatured !== undefined)
            updateData.is_featured = input.isFeatured;
        // Version 1.8 fields
        if (input.aiSubject !== undefined)
            updateData.ai_subject = input.aiSubject;
        if (input.aiDescription !== undefined)
            updateData.ai_description = input.aiDescription;
        if (input.aiProcessed !== undefined)
            updateData.ai_processed = input.aiProcessed;
        if (input.galleryLayout !== undefined)
            updateData.gallery_layout = input.galleryLayout;
        if (input.metaTitle !== undefined)
            updateData.meta_title = input.metaTitle;
        if (input.metaDescription !== undefined)
            updateData.meta_description = input.metaDescription;
        const { data, error } = await database_1.supabase
            .from('safari_photos')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            throw new Error(`Error updating photo: ${error.message}`);
        }
        return this.mapDbToPhoto(data);
    }
    /**
     * Delete a photo
     */
    static async delete(id) {
        const { error } = await database_1.supabase
            .from('safari_photos')
            .delete()
            .eq('id', id);
        if (error) {
            throw new Error(`Error deleting photo: ${error.message}`);
        }
        return true;
    }
    /**
     * Version 1.8: Batch update publish status (Published/Draft bins)
     */
    static async batchUpdatePublishStatus(input) {
        const { error } = await database_1.supabase
            .from('safari_photos')
            .update({
            is_published: input.isPublished,
            ai_processed: false, // Reset AI processing when published
        })
            .in('id', input.photoIds);
        if (error) {
            throw new Error(`Error updating publish status: ${error.message}`);
        }
        return true;
    }
    /**
     * Version 1.8: Reorder photos (drag-and-drop)
     */
    static async reorder(orders) {
        // Update each photo's display_order
        for (const order of orders) {
            const { error } = await database_1.supabase
                .from('safari_photos')
                .update({ display_order: order.newOrder })
                .eq('id', order.photoId);
            if (error) {
                throw new Error(`Error reordering photos: ${error.message}`);
            }
        }
        return true;
    }
    /**
     * Version 1.8: Update AI fields
     */
    static async updateAIFields(id, aiSubject, aiDescription) {
        const { data, error } = await database_1.supabase
            .from('safari_photos')
            .update({
            ai_subject: aiSubject,
            ai_description: aiDescription,
            ai_processed: true,
        })
            .eq('id', id)
            .select()
            .single();
        if (error) {
            throw new Error(`Error updating AI fields: ${error.message}`);
        }
        return this.mapDbToPhoto(data);
    }
    /**
     * Update photo telemetry (views, likes, etc.)
     */
    static async updateTelemetry(id, telemetry) {
        const updateData = {};
        if (telemetry.views !== undefined)
            updateData.views = telemetry.views;
        if (telemetry.likes !== undefined)
            updateData.likes = telemetry.likes;
        if (telemetry.shares !== undefined)
            updateData.shares = telemetry.shares;
        if (telemetry.downloads !== undefined)
            updateData.downloads = telemetry.downloads;
        const { data, error } = await database_1.supabase
            .from('safari_photos')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            throw new Error(`Error updating telemetry: ${error.message}`);
        }
        return this.mapDbToPhoto(data);
    }
    /**
     * Increment view count (optimized for high traffic)
     */
    static async incrementView(id) {
        const { error } = await database_1.supabase.rpc('increment_view_count', { photo_id: id });
        if (error) {
            // Fallback to regular update if RPC doesn't exist
            const photo = await this.findById(id);
            if (photo) {
                await this.updateTelemetry(id, { views: photo.views + 1 });
            }
        }
    }
    /**
     * Map database row to SafariPhoto type
     */
    static mapDbToPhoto(row) {
        return {
            id: row.id,
            imageUrl: row.image_url,
            thumbnailUrl: row.thumbnail_url,
            altText: row.alt_text,
            caption: row.caption,
            location: row.location,
            photographer: row.photographer,
            dateTaken: row.date_taken ? new Date(row.date_taken) : undefined,
            views: row.views || 0,
            likes: row.likes || 0,
            shares: row.shares || 0,
            downloads: row.downloads || 0,
            avgTimeWatchedSeconds: row.avg_time_watched_seconds || 0,
            bounceRate: row.bounce_rate || 0,
            storyContext: row.story_context,
            displayOrder: row.display_order || 0,
            category: row.category,
            tags: row.tags,
            isPublished: row.is_published || false,
            isFeatured: row.is_featured || false,
            // Version 1.8 fields
            aiSubject: row.ai_subject,
            aiDescription: row.ai_description,
            aiProcessed: row.ai_processed || false,
            galleryLayout: row.gallery_layout,
            metaTitle: row.meta_title,
            metaDescription: row.meta_description,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            createdBy: row.created_by,
            updatedBy: row.updated_by,
        };
    }
}
exports.PhotoModel = PhotoModel;
exports.default = PhotoModel;
//# sourceMappingURL=PhotoModel.js.map