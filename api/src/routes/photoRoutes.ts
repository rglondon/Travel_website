import { Router } from 'express';
import { PhotoController } from '../controllers/PhotoController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', PhotoController.getAll);
router.get('/featured', PhotoController.getFeatured);
router.get('/stats/categories', PhotoController.getStats);
router.get('/:id', PhotoController.getById);

// Semi-protected routes (like needs auth but not admin)
router.post('/:id/like', PhotoController.like);

// Admin-only routes (require authentication)
router.post('/', authMiddleware, PhotoController.create);
router.put('/:id', authMiddleware, PhotoController.update);
router.patch('/:id/telemetry', authMiddleware, PhotoController.updateTelemetry);
router.delete('/:id', authMiddleware, PhotoController.delete);

export default router;
