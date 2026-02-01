import { SafariPhoto, CreateSafariPhotoInput, UpdateSafariPhotoInput, PhotoQueryParams, ReorderInput, PublishStatusInput } from '../types/safariPhoto';
export declare class PhotoModel {
    /**
     * Get all photos with optional filtering and pagination
     */
    static findAll(params?: PhotoQueryParams): Promise<SafariPhoto[]>;
    /**
     * Get all photos (both published and draft)
     */
    static findAllForAdmin(): Promise<SafariPhoto[]>;
    /**
     * Get a single photo by ID
     */
    static findById(id: string): Promise<SafariPhoto | null>;
    /**
     * Get featured photos
     */
    static findFeatured(limit?: number): Promise<SafariPhoto[]>;
    /**
     * Create a new photo
     */
    static create(input: CreateSafariPhotoInput, userId?: string): Promise<SafariPhoto>;
    /**
     * Get the next display_order (for chronological integrity - newest first)
     */
    private static getNextDisplayOrder;
    /**
     * Update an existing photo
     */
    static update(id: string, input: UpdateSafariPhotoInput, userId?: string): Promise<SafariPhoto>;
    /**
     * Delete a photo
     */
    static delete(id: string): Promise<boolean>;
    /**
     * Version 1.8: Batch update publish status (Published/Draft bins)
     */
    static batchUpdatePublishStatus(input: PublishStatusInput): Promise<boolean>;
    /**
     * Version 1.8: Reorder photos (drag-and-drop)
     */
    static reorder(orders: ReorderInput[]): Promise<boolean>;
    /**
     * Version 1.8: Update AI fields
     */
    static updateAIFields(id: string, aiSubject: string, aiDescription: string): Promise<SafariPhoto>;
    /**
     * Update photo telemetry (views, likes, etc.)
     */
    static updateTelemetry(id: string, telemetry: {
        views?: number;
        likes?: number;
        shares?: number;
        downloads?: number;
    }): Promise<SafariPhoto>;
    /**
     * Increment view count (optimized for high traffic)
     */
    static incrementView(id: string): Promise<void>;
    /**
     * Map database row to SafariPhoto type
     */
    private static mapDbToPhoto;
}
export default PhotoModel;
//# sourceMappingURL=PhotoModel.d.ts.map