import { Router, Request, Response, NextFunction } from 'express';
import { GalleryModel } from '../models/GalleryModel';

const router = Router();

/**
 * GET /api/galleries - Get all published galleries
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const galleries = await GalleryModel.findAllPublished();

    res.json({
      success: true,
      data: galleries,
      count: galleries.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/galleries/:slug - Get gallery by slug with photos
 */
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const result = await GalleryModel.findBySlugWithPhotos(slug);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Gallery not found',
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/galleries/:slug/photos - Get photos for a gallery
 */
router.get('/:slug/photos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const gallery = await GalleryModel.findBySlug(slug);

    if (!gallery) {
      return res.status(404).json({
        success: false,
        error: 'Gallery not found',
      });
    }

    const photos = await GalleryModel.getGalleryPhotos(gallery.id, true);

    res.json({
      success: true,
      data: photos,
      count: photos.length,
      gallery: {
        id: gallery.id,
        title: gallery.title,
        slug: gallery.slug,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/galleries/photos/:photoId/view - Increment photo view count
 */
router.post('/photos/:photoId/view', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { photoId } = req.params;
    await GalleryModel.incrementPhotoView(photoId);

    res.json({
      success: true,
      message: 'View recorded',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
