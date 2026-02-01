"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PhotoController_1 = require("../controllers/PhotoController");
const PhotoModel_1 = require("../models/PhotoModel");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const express_validator_1 = require("express-validator");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// Helper aliases for middleware
const authenticateToken = auth_1.authMiddleware;
const isAdmin = auth_1.adminMiddleware;
/**
 * GET /api/admin/photos - List all photos (including unpublished)
 */
router.get('/photos', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    (0, express_validator_1.query)('isPublished').optional().isBoolean().withMessage('isPublished must be boolean'),
], validation_1.handleValidationErrors, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const photos = await PhotoController_1.PhotoController.getAll(req, res, next);
        if (!photos || photos.length === 0) {
            return res.json({
                success: true,
                data: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                },
            });
        }
        res.json({
            success: true,
            data: photos,
            pagination: {
                page,
                limit,
                total: photos.length,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/admin/photos/:id - Get photo details for editing
 */
router.get('/photos/:id', [(0, express_validator_1.param)('id').isUUID().withMessage('Invalid photo ID')], validation_1.handleValidationErrors, PhotoController_1.PhotoController.getById);
/**
 * POST /api/admin/photos - Create new photo with optional image upload
 */
router.post('/photos', upload_1.uploadMiddleware.single('image'), [
    (0, express_validator_1.body)('imageUrl').optional().isURL().withMessage('Invalid image URL'),
    (0, express_validator_1.body)('caption').optional().isLength({ max: 255 }).withMessage('Caption too long'),
    (0, express_validator_1.body)('location').optional().isLength({ max: 100 }).withMessage('Location too long'),
    (0, express_validator_1.body)('category').optional().isIn(['wildlife', 'landscape', 'culture', 'accommodation', 'food', 'activity', 'people']),
    (0, express_validator_1.body)('isPublished').optional().isBoolean().withMessage('isPublished must be boolean'),
    (0, express_validator_1.body)('isFeatured').optional().isBoolean().withMessage('isFeatured must be boolean'),
    (0, express_validator_1.body)('displayOrder').optional().isInt({ min: 0 }).withMessage('displayOrder must be non-negative'),
    (0, express_validator_1.body)('tags').optional().isArray().withMessage('Tags must be an array'),
], validation_1.handleValidationErrors, PhotoController_1.PhotoController.create);
/**
 * PUT /api/admin/photos/:id - Update photo (including telemetry)
 */
router.put('/photos/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid photo ID'),
    (0, express_validator_1.body)('imageUrl').optional().isURL().withMessage('Invalid image URL'),
    (0, express_validator_1.body)('altText').optional().isLength({ max: 255 }).withMessage('Alt text too long'),
    (0, express_validator_1.body)('caption').optional().isLength({ max: 255 }).withMessage('Caption too long'),
    (0, express_validator_1.body)('storyContext').optional().isString().withMessage('Story context must be text'),
    (0, express_validator_1.body)('views').optional().isInt({ min: 0 }).withMessage('Views must be non-negative'),
    (0, express_validator_1.body)('likes').optional().isInt({ min: 0 }).withMessage('Likes must be non-negative'),
    (0, express_validator_1.body)('shares').optional().isInt({ min: 0 }).withMessage('Shares must be non-negative'),
    (0, express_validator_1.body)('downloads').optional().isInt({ min: 0 }).withMessage('Downloads must be non-negative'),
], validation_1.handleValidationErrors, PhotoController_1.PhotoController.update);
/**
 * PATCH /api/admin/photos/:id/telemetry - Quick update telemetry only
 */
router.patch('/photos/:id/telemetry', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid photo ID'),
    (0, express_validator_1.body)('views').optional().isInt({ min: 0 }),
    (0, express_validator_1.body)('likes').optional().isInt({ min: 0 }),
    (0, express_validator_1.body)('shares').optional().isInt({ min: 0 }),
    (0, express_validator_1.body)('downloads').optional().isInt({ min: 0 }),
], validation_1.handleValidationErrors, PhotoController_1.PhotoController.updateTelemetry);
/**
 * DELETE /api/admin/photos/:id - Delete photo
 */
router.delete('/photos/:id', [(0, express_validator_1.param)('id').isUUID().withMessage('Invalid photo ID')], validation_1.handleValidationErrors, PhotoController_1.PhotoController.delete);
/**
 * POST /api/admin/photos/reorder - Bulk update display order
 */
router.post('/photos/reorder', [
    (0, express_validator_1.body)('orders').isArray().withMessage('Orders must be an array'),
    (0, express_validator_1.body)('orders.*.id').isUUID().withMessage('Invalid photo ID'),
    (0, express_validator_1.body)('orders.*.displayOrder').isInt({ min: 0 }).withMessage('Invalid display order'),
], validation_1.handleValidationErrors, async (req, res, next) => {
    try {
        const { orders } = req.body;
        // Version 1.8: Use optimized reorder method
        const reorderInput = orders.map((order) => ({
            photoId: order.id,
            newOrder: order.displayOrder
        }));
        await PhotoModel_1.PhotoModel.reorder(reorderInput);
        res.json({
            success: true,
            message: 'Display order updated successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * Version 1.8: Batch update publish status (Published/Draft bins)
 * POST /api/admin/photos/batch-publish
 */
router.post('/photos/batch-publish', authenticateToken, isAdmin, async (req, res, next) => {
    try {
        const { photoIds, isPublished } = req.body;
        if (!Array.isArray(photoIds)) {
            return res.status(400).json({
                success: false,
                error: 'photoIds must be an array',
            });
        }
        await PhotoModel_1.PhotoModel.batchUpdatePublishStatus({ photoIds, isPublished });
        res.json({
            success: true,
            message: `Successfully moved ${photoIds.length} photos to ${isPublished ? 'Published' : 'Draft'}`,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * Version 1.8: Update AI fields for a photo
 * PUT /api/admin/photos/:id/ai
 */
router.put('/photos/:id/ai', authenticateToken, isAdmin, async (req, res, next) => {
    try {
        const { aiSubject, aiDescription } = req.body;
        const { id } = req.params;
        if (!aiSubject || !aiDescription) {
            return res.status(400).json({
                success: false,
                error: 'aiSubject and aiDescription are required',
            });
        }
        const photo = await PhotoModel_1.PhotoModel.updateAIFields(id, aiSubject, aiDescription);
        res.json({
            success: true,
            data: photo,
            message: 'AI fields updated successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * Version 1.8: Get all photos for admin (including drafts)
 * GET /api/admin/photos/all
 */
router.get('/photos/all', authenticateToken, isAdmin, async (req, res, next) => {
    try {
        const photos = await PhotoModel_1.PhotoModel.findAllForAdmin();
        res.json({
            success: true,
            data: photos,
            count: photos.length,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/admin/stats - Get dashboard statistics
 */
router.get('/stats', async (req, res, next) => {
    try {
        const stats = await PhotoController_1.PhotoController.getStats(req, res, next);
        res.json({
            success: true,
            data: {
                photos: stats,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map