import { Request, Response, NextFunction } from 'express';
export declare class PhotoController {
    /**
     * GET /api/photos - Get all photos with optional filtering
     */
    static getAll(req: Request, res: Response, next: NextFunction): Promise<void | any[]>;
    /**
     * GET /api/photos/featured - Get featured photos
     */
    static getFeatured(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/photos/:id - Get a single photo by ID
     */
    static getById(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/photos - Create a new photo (Admin only)
     */
    static create(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * PUT /api/photos/:id - Update a photo (Admin only)
     */
    static update(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * PATCH /api/photos/:id/telemetry - Update photo telemetry (Admin only)
     */
    static updateTelemetry(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/photos/:id - Delete a photo (Admin only)
     */
    static delete(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/photos/:id/like - Like a photo
     */
    static like(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/photos/stats/categories - Get photo counts by category
     */
    static getStats(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export default PhotoController;
//# sourceMappingURL=PhotoController.d.ts.map