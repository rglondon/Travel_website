import { Router, Request, Response, NextFunction } from 'express';
import { PhotoController } from '../controllers/PhotoController';
import { PhotoModel } from '../models/PhotoModel';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { uploadMiddleware } from '../middleware/upload';
import { body, param, query } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();

// Helper aliases for middleware
const authenticateToken = authMiddleware;
const isAdmin = adminMiddleware;

/**
 * GET /api/admin/photos - List all photos (including unpublished)
 */
router.get(
  '/photos',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    query('isPublished').optional().isBoolean().withMessage('isPublished must be boolean'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const photos = await PhotoController.getAll(req, res, next);
      
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
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/photos/:id - Get photo details for editing
 */
router.get(
  '/photos/:id',
  [param('id').isUUID().withMessage('Invalid photo ID')],
  handleValidationErrors,
  PhotoController.getById
);

/**
 * POST /api/admin/photos - Create new photo with optional image upload
 */
router.post(
  '/photos',
  uploadMiddleware.single('image'),
  [
    body('imageUrl').optional().isURL().withMessage('Invalid image URL'),
    body('caption').optional().isLength({ max: 255 }).withMessage('Caption too long'),
    body('location').optional().isLength({ max: 100 }).withMessage('Location too long'),
    body('category').optional().isIn(['wildlife', 'landscape', 'culture', 'accommodation', 'food', 'activity', 'people']),
    body('isPublished').optional().isBoolean().withMessage('isPublished must be boolean'),
    body('isFeatured').optional().isBoolean().withMessage('isFeatured must be boolean'),
    body('displayOrder').optional().isInt({ min: 0 }).withMessage('displayOrder must be non-negative'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
  ],
  handleValidationErrors,
  PhotoController.create
);

/**
 * PUT /api/admin/photos/:id - Update photo (including telemetry)
 */
router.put(
  '/photos/:id',
  [
    param('id').isUUID().withMessage('Invalid photo ID'),
    body('imageUrl').optional().isURL().withMessage('Invalid image URL'),
    body('altText').optional().isLength({ max: 255 }).withMessage('Alt text too long'),
    body('caption').optional().isLength({ max: 255 }).withMessage('Caption too long'),
    body('storyContext').optional().isString().withMessage('Story context must be text'),
    body('views').optional().isInt({ min: 0 }).withMessage('Views must be non-negative'),
    body('likes').optional().isInt({ min: 0 }).withMessage('Likes must be non-negative'),
    body('shares').optional().isInt({ min: 0 }).withMessage('Shares must be non-negative'),
    body('downloads').optional().isInt({ min: 0 }).withMessage('Downloads must be non-negative'),
  ],
  handleValidationErrors,
  PhotoController.update
);

/**
 * PATCH /api/admin/photos/:id/telemetry - Quick update telemetry only
 */
router.patch(
  '/photos/:id/telemetry',
  [
    param('id').isUUID().withMessage('Invalid photo ID'),
    body('views').optional().isInt({ min: 0 }),
    body('likes').optional().isInt({ min: 0 }),
    body('shares').optional().isInt({ min: 0 }),
    body('downloads').optional().isInt({ min: 0 }),
  ],
  handleValidationErrors,
  PhotoController.updateTelemetry
);

/**
 * DELETE /api/admin/photos/:id - Delete photo
 */
router.delete(
  '/photos/:id',
  [param('id').isUUID().withMessage('Invalid photo ID')],
  handleValidationErrors,
  PhotoController.delete
);

/**
 * POST /api/admin/photos/reorder - Bulk update display order
 */
router.post(
  '/photos/reorder',
  [
    body('orders').isArray().withMessage('Orders must be an array'),
    body('orders.*.id').isUUID().withMessage('Invalid photo ID'),
    body('orders.*.displayOrder').isInt({ min: 0 }).withMessage('Invalid display order'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orders } = req.body;
      
      // Version 1.8: Use optimized reorder method
      const reorderInput = orders.map((order: { id: string, displayOrder: number }) => ({
        photoId: order.id,
        newOrder: order.displayOrder
      }));
      
      await PhotoModel.reorder(reorderInput);

      res.json({
        success: true,
        message: 'Display order updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Version 1.8: Batch update publish status (Published/Draft bins)
 * POST /api/admin/photos/batch-publish
 */
router.post(
  '/photos/batch-publish',
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { photoIds, isPublished } = req.body;

      if (!Array.isArray(photoIds)) {
        return res.status(400).json({
          success: false,
          error: 'photoIds must be an array',
        });
      }

      await PhotoModel.batchUpdatePublishStatus({ photoIds, isPublished });

      res.json({
        success: true,
        message: `Successfully moved ${photoIds.length} photos to ${isPublished ? 'Published' : 'Draft'}`,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Version 1.8: Update AI fields for a photo
 * PUT /api/admin/photos/:id/ai
 */
router.put(
  '/photos/:id/ai',
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { aiSubject, aiDescription } = req.body;
      const { id } = req.params;

      if (!aiSubject || !aiDescription) {
        return res.status(400).json({
          success: false,
          error: 'aiSubject and aiDescription are required',
        });
      }

      const photo = await PhotoModel.updateAIFields(id, aiSubject, aiDescription);

      res.json({
        success: true,
        data: photo,
        message: 'AI fields updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Version 1.8: Get all photos for admin (including drafts)
 * GET /api/admin/photos/all
 */
router.get(
  '/photos/all',
  authenticateToken,
  isAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const photos = await PhotoModel.findAllForAdmin();

      res.json({
        success: true,
        data: photos,
        count: photos.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/stats - Get dashboard statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await PhotoController.getStats(req, res, next);

    res.json({
      success: true,
      data: {
        photos: stats,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
