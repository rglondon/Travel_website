"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhotoController = void 0;
const PhotoModel_1 = require("../models/PhotoModel");
class PhotoController {
    /**
     * GET /api/photos - Get all photos with optional filtering
     */
    static async getAll(req, res, next) {
        try {
            const { category, isFeatured, isPublished, tags, limit, offset, sortBy, sortOrder, } = req.query;
            const params = {
                category: category,
                isFeatured: isFeatured ? isFeatured === 'true' : undefined,
                isPublished: isPublished ? isPublished === 'true' : undefined,
                tags: tags ? tags.split(',') : undefined,
                limit: limit ? parseInt(limit) : undefined,
                offset: offset ? parseInt(offset) : undefined,
                sortBy: sortBy,
                sortOrder: sortOrder,
            };
            const photos = await PhotoModel_1.PhotoModel.findAll(params);
            res.json({
                success: true,
                data: photos,
                count: photos.length,
            });
            return photos;
        }
        catch (error) {
            next(error);
            return [];
        }
    }
    /**
     * GET /api/photos/featured - Get featured photos
     */
    static async getFeatured(req, res, next) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const photos = await PhotoModel_1.PhotoModel.findFeatured(limit);
            res.json({
                success: true,
                data: photos,
                count: photos.length,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/photos/:id - Get a single photo by ID
     */
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const photo = await PhotoModel_1.PhotoModel.findById(id);
            if (!photo) {
                return res.status(404).json({
                    success: false,
                    error: 'Photo not found',
                });
            }
            // Increment view count
            await PhotoModel_1.PhotoModel.incrementView(id);
            res.json({
                success: true,
                data: photo,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/photos - Create a new photo (Admin only)
     */
    static async create(req, res, next) {
        try {
            const input = {
                imageUrl: req.body.imageUrl,
                thumbnailUrl: req.body.thumbnailUrl,
                altText: req.body.altText,
                caption: req.body.caption,
                location: req.body.location,
                photographer: req.body.photographer,
                dateTaken: req.body.dateTaken ? new Date(req.body.dateTaken) : undefined,
                storyContext: req.body.storyContext,
                displayOrder: req.body.displayOrder,
                category: req.body.category,
                tags: req.body.tags,
                isPublished: req.body.isPublished,
                isFeatured: req.body.isFeatured,
            };
            // Get user ID from auth middleware (if implemented)
            const userId = req.user?.id;
            const photo = await PhotoModel_1.PhotoModel.create(input, userId);
            res.status(201).json({
                success: true,
                data: photo,
                message: 'Photo created successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /api/photos/:id - Update a photo (Admin only)
     */
    static async update(req, res, next) {
        try {
            const { id } = req.params;
            const input = req.body;
            // Get user ID from auth middleware
            const userId = req.user?.id;
            const photo = await PhotoModel_1.PhotoModel.update(id, input, userId);
            res.json({
                success: true,
                data: photo,
                message: 'Photo updated successfully',
            });
        }
        catch (error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    error: 'Photo not found',
                });
            }
            next(error);
        }
    }
    /**
     * PATCH /api/photos/:id/telemetry - Update photo telemetry (Admin only)
     */
    static async updateTelemetry(req, res, next) {
        try {
            const { id } = req.params;
            const { views, likes, shares, downloads } = req.body;
            const photo = await PhotoModel_1.PhotoModel.updateTelemetry(id, {
                views,
                likes,
                shares,
                downloads,
            });
            res.json({
                success: true,
                data: photo,
                message: 'Telemetry updated successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/photos/:id - Delete a photo (Admin only)
     */
    static async delete(req, res, next) {
        try {
            const { id } = req.params;
            await PhotoModel_1.PhotoModel.delete(id);
            res.json({
                success: true,
                message: 'Photo deleted successfully',
            });
        }
        catch (error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    error: 'Photo not found',
                });
            }
            next(error);
        }
    }
    /**
     * POST /api/photos/:id/like - Like a photo
     */
    static async like(req, res, next) {
        try {
            const { id } = req.params;
            const photo = await PhotoModel_1.PhotoModel.findById(id);
            if (!photo) {
                return res.status(404).json({
                    success: false,
                    error: 'Photo not found',
                });
            }
            await PhotoModel_1.PhotoModel.updateTelemetry(id, { likes: photo.likes + 1 });
            res.json({
                success: true,
                message: 'Photo liked successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/photos/stats/categories - Get photo counts by category
     */
    static async getStats(req, res, next) {
        try {
            // Version 1.8: Simplified stats
            const totalPhotos = await PhotoModel_1.PhotoModel.findAll({});
            const publishedPhotos = totalPhotos.filter(p => p.isPublished);
            const draftPhotos = totalPhotos.filter(p => !p.isPublished);
            const featuredPhotos = totalPhotos.filter(p => p.isFeatured);
            const aiProcessed = totalPhotos.filter(p => p.aiProcessed);
            res.json({
                success: true,
                data: {
                    total: totalPhotos.length,
                    published: publishedPhotos.length,
                    draft: draftPhotos.length,
                    featured: featuredPhotos.length,
                    aiProcessed: aiProcessed.length,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PhotoController = PhotoController;
exports.default = PhotoController;
//# sourceMappingURL=PhotoController.js.map