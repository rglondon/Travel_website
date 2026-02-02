import { Request, Response, NextFunction } from 'express';
import { PhotoModel } from '../models/PhotoModel';
import { CreateSafariPhotoInput, UpdateSafariPhotoInput, PhotoCategory } from '../types/safariPhoto';

export class PhotoController {
  /**
   * GET /api/photos - Get all photos with optional filtering
   */
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void | any[]> {
    try {
      const {
        category,
        isFeatured,
        isPublished,
        tags,
        limit,
        offset,
        sortBy,
        sortOrder,
      } = req.query;

      const params = {
        category: category as PhotoCategory | undefined,
        isFeatured: isFeatured ? isFeatured === 'true' : undefined,
        isPublished: isPublished ? isPublished === 'true' : undefined,
        tags: tags ? (tags as string).split(',') : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        sortBy: sortBy as 'createdAt' | 'displayOrder' | 'views' | 'likes' | undefined,
        sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      };

      const photos = await PhotoModel.findAll(params);

      res.json({
        success: true,
        data: photos,
        count: photos.length,
      });
      
      return photos;
    } catch (error) {
      next(error);
      return [];
    }
  }

  /**
   * GET /api/photos/featured - Get featured photos
   */
  static async getFeatured(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const photos = await PhotoModel.findFeatured(limit);

      res.json({
        success: true,
        data: photos,
        count: photos.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/photos/:id - Get a single photo by ID
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const photo = await PhotoModel.findById(id);

      if (!photo) {
        return res.status(404).json({
          success: false,
          error: 'Photo not found',
        });
      }

      // Increment view count
      await PhotoModel.incrementView(id);

      res.json({
        success: true,
        data: photo,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/photos - Create a new photo (Admin only)
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input: CreateSafariPhotoInput = {
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
      const userId = (req as any).user?.id;

      const photo = await PhotoModel.create(input, userId);

      res.status(201).json({
        success: true,
        data: photo,
        message: 'Photo created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/photos/:id - Update a photo (Admin only)
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input: UpdateSafariPhotoInput = req.body;

      // Get user ID from auth middleware
      const userId = (req as any).user?.id;

      const photo = await PhotoModel.update(id, input, userId);

      res.json({
        success: true,
        data: photo,
        message: 'Photo updated successfully',
      });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
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
  static async updateTelemetry(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { views, likes, shares, downloads } = req.body;

      const photo = await PhotoModel.updateTelemetry(id, {
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/photos/:id - Delete a photo (Admin only)
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await PhotoModel.delete(id);

      res.json({
        success: true,
        message: 'Photo deleted successfully',
      });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
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
  static async like(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const photo = await PhotoModel.findById(id);

      if (!photo) {
        return res.status(404).json({
          success: false,
          error: 'Photo not found',
        });
      }

      await PhotoModel.updateTelemetry(id, { likes: photo.likes + 1 });

      res.json({
        success: true,
        message: 'Photo liked successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/photos/stats/categories - Get photo counts by category
   */
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      // Version 1.8: Simplified stats
      const totalPhotos = await PhotoModel.findAll({});
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
    } catch (error) {
      next(error);
    }
  }
}

export default PhotoController;
