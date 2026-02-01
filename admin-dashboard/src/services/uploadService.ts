/**
 * Upload Service
 * Handles file uploads with progress tracking, EXIF extraction, and AI analysis
 */

import { UploadFile, UploadStatus, UploadConfig, AISuggestions, EXIFData } from '../types';
import { exifExtractor } from './exifService';
import { miniMaxVisionService } from './minimaxService';
import { imageOptimizer } from './imageOptimizer';

interface UploadProgress {
  fileId: string;
  status: UploadStatus;
  progress: number;
  message?: string;
}

interface UploadCallbacks {
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (file: UploadFile) => void;
  onError?: (fileId: string, error: Error) => void;
}

export class UploadService {
  private config: UploadConfig;
  private queue: Map<string, UploadFile> = new Map();
  private activeUploads: number = 0;
  private maxConcurrent: number;

  constructor(config?: Partial<UploadConfig>) {
    this.config = {
      maxFileSize: config?.maxFileSize || 50 * 1024 * 1024, // 50MB
      allowedTypes: config?.allowedTypes || [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/tiff',
      ],
      maxConcurrent: config?.maxConcurrent || 3,
      autoPublish: config?.autoPublish ?? true,
      extractEXIF: config?.extractEXIF ?? true,
      analyzeAI: config?.analyzeAI ?? true,
    };
    this.maxConcurrent = this.config.maxConcurrent;
  }

  /**
   * Upload a single file with full processing pipeline
   */
  async uploadFile(
    file: File,
    callbacks?: UploadCallbacks
  ): Promise<UploadFile> {
    const uploadId = this.generateId();
    
    const uploadFile: UploadFile = {
      id: uploadId,
      file,
      status: 'pending',
      progress: 0,
    };

    this.queue.set(uploadId, uploadFile);

    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      this.updateFileStatus(uploadId, 'error', 0, validation.error);
      callbacks?.onError?.(uploadId, new Error(validation.error));
      throw new Error(validation.error);
    }

    // Wait for available slot
    await this.waitForSlot();

    try {
      // Stage 1: Read file buffer for processing
      const fileBuffer = await this.readFileBuffer(file);
      
      // Create thumbnail for preview (300x300)
      const thumbnailBuffer = await imageOptimizer.createThumbnail(fileBuffer, 300);
      
      // Stage 1a: Upload original to Supabase Storage
      this.updateFileStatus(uploadId, 'uploading', 10, 'Uploading to storage...');
      const publicUrl = await this.uploadToStorage(file, (progress) => {
        this.updateFileStatus(uploadId, 'uploading', 10 + progress * 0.2, 'Uploading...');
        callbacks?.onProgress?.({
          fileId: uploadId,
          status: 'uploading',
          progress: 10 + progress * 0.2,
          message: 'Uploading...',
        });
      });
      uploadFile.uploadedUrl = publicUrl;

      // Create preview URL from buffer
      uploadFile.previewUrl = URL.createObjectURL(
        new Blob([new Uint8Array(thumbnailBuffer)], { type: 'image/jpeg' })
      );

      // Stage 2: Extract EXIF data
      if (this.config.extractEXIF) {
        this.updateFileStatus(uploadId, 'extracting_exif', 35, 'Extracting metadata...');
        const [exifData, gpsResult] = await Promise.all([
          this.extractEXIFData(file),
          this.extractGPSData(file),
        ]);
        uploadFile.exifData = exifData;
        if (gpsResult.hasGPS) {
          uploadFile.gpsData = gpsResult.gpsData!;
        }
      }

      // Stage 3: AI Vision Analysis (using OPTIMIZED proxy)
      if (this.config.analyzeAI && publicUrl) {
        this.updateFileStatus(uploadId, 'analyzing_ai', 55, 'Creating AI proxy...');
        
        try {
          // Create low-res proxy for AI (max 1000px, ~50-100KB)
          const proxyResult = await imageOptimizer.createAIProxy(fileBuffer, {
            maxWidth: 1000,
            maxHeight: 1000,
            quality: 80,
          });
          
          console.log(`[AI Proxy] Original: ${(proxyResult.originalSize / 1024).toFixed(1)}KB → Proxy: ${(proxyResult.proxySize / 1024).toFixed(1)}KB (${proxyResult.reductionPercent}% reduction)`);
          
          // Upload proxy to get a URL for AI analysis
          // The proxy is small enough for MiniMax Vision API
          this.updateFileStatus(uploadId, 'analyzing_ai', 65, 'Analyzing with MiniMax M2.1...');
          
          const proxyUrl = await this.uploadProxyToStorage(proxyResult.buffer, file.name);
          
          if (proxyUrl) {
            const aiSuggestions = await miniMaxVisionService.analyzeImage(proxyUrl);
            uploadFile.aiSuggestions = aiSuggestions;
            
            console.log(`[MiniMax M2.1] Keywords: ${aiSuggestions.keywords.length} | Categories: ${[...new Set(aiSuggestions.keywords.map(k => k.category))].join(', ')}`);
          }
        } catch (error) {
          console.warn('MiniMax analysis failed, continuing without it:', error);
        }
      }

      // Stage 4: Save to database
      this.updateFileStatus(uploadId, 'saving', 90, 'Saving to database...');
      const photoData = await this.saveToDatabase(uploadFile);
      uploadFile.photoId = photoData.id;

      // Complete
      this.updateFileStatus(uploadId, 'complete', 100, 'Complete');
      this.queue.delete(uploadId);
      callbacks?.onComplete?.(uploadFile);

      return uploadFile;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Upload failed');
      this.updateFileStatus(uploadId, 'error', 0, err.message);
      callbacks?.onError?.(uploadId, err);
      this.queue.delete(uploadId);
      throw err;
    } finally {
      this.activeUploads--;
    }
  }

  /**
   * Upload multiple files in queue
   */
  async uploadQueue(
    files: File[],
    callbacks?: UploadCallbacks
  ): Promise<UploadFile[]> {
    const results: UploadFile[] = [];
    const errors: { file: File; error: Error }[] = [];

    for (const file of files) {
      try {
        await this.uploadFile(file, {
          onProgress: callbacks?.onProgress,
          onComplete: (uploadFile) => {
            results.push(uploadFile);
            callbacks?.onComplete?.(uploadFile);
          },
          onError: (fileId, error) => {
            errors.push({ file: this.queue.get(fileId)?.file || file, error });
            callbacks?.onError?.(fileId, error);
          },
        });
      } catch {
        // Errors handled in uploadFile
      }
    }

    return results;
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!this.config.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type: ${file.type}. Allowed: ${this.config.allowedTypes.join(', ')}`,
      };
    }

    // Check file size
    if (file.size > this.config.maxFileSize) {
      return {
        valid: false,
        error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: ${this.config.maxFileSize / 1024 / 1024}MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Upload file to Supabase Storage
   */
  private async uploadToStorage(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const fileName = this.generateFileName(file);
    const filePath = `safari-photos/${fileName}`;

    // This would be replaced with actual Supabase Storage call
    // For now, return a placeholder
    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: file,
    });

    if (!response.ok) {
      throw new Error('Upload to storage failed');
    }

    onProgress?.(1);
    return response.url;
  }

  /**
   * Upload AI proxy image to storage (smaller file for OpenAI Vision API)
   */
  private async uploadProxyToStorage(proxyBuffer: Buffer, originalName: string): Promise<string | null> {
    try {
      const fileName = `proxy-${Date.now()}-${Math.random().toString(36).substr(2, 6)}.jpg`;
      const formData = new FormData();
      
      // Convert buffer to Blob
      const uint8Array = new Uint8Array(proxyBuffer);
      const blob = new Blob([new Uint8Array(uint8Array)], { type: 'image/jpeg' });
      formData.append('file', blob, fileName);
      formData.append('folder', 'ai-proxies');
      
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.warn('Proxy upload failed, will use original URL');
        return null;
      }

      const data = await response.json();
      return data.url || null;
    } catch (error) {
      console.warn('Proxy upload error:', error);
      return null;
    }
  }

  /**
   * Read file as ArrayBuffer
   */
  private async readFileBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Extract EXIF data from file
   */
  private async extractEXIFData(file: File): Promise<EXIFData> {
    try {
      return await exifExtractor.extractFromFile(file);
    } catch (error) {
      console.warn('EXIF extraction failed:', error);
      return {};
    }
  }

  /**
   * Extract GPS data from file
   */
  private async extractGPSData(file: File) {
    try {
      return await exifExtractor.extractGPS(file);
    } catch (error) {
      console.warn('GPS extraction failed:', error);
      return { gpsData: null, hasGPS: false };
    }
  }

  /**
   * Save complete photo record to database
   */
  private async saveToDatabase(uploadFile: UploadFile): Promise<{ id: string }> {
    const photoData = {
      imageUrl: uploadFile.uploadedUrl,
      thumbnailUrl: uploadFile.previewUrl,
      altText: uploadFile.aiSuggestions?.altText?.value,
      caption: uploadFile.aiSuggestions?.caption?.value,
      storyContext: uploadFile.aiSuggestions?.storyContext?.value,
      location: uploadFile.gpsData ? this.formatLocation(uploadFile.gpsData) : undefined,
      dateTaken: uploadFile.exifData?.captureDate,
      category: this.inferCategory(uploadFile.aiSuggestions),
      tags: this.extractTags(uploadFile.aiSuggestions),
      isPublished: this.config.autoPublish,
      displayOrder: 999, // Will be set by user
      exifData: uploadFile.exifData,
      gpsData: uploadFile.gpsData,
      aiSuggestions: uploadFile.aiSuggestions,
    };

    const response = await fetch('/api/admin/photos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify(photoData),
    });

    if (!response.ok) {
      throw new Error('Failed to save photo to database');
    }

    return response.json().then(data => data.data);
  }

  /**
   * Update file status in queue
   */
  private updateFileStatus(
    fileId: string,
    status: UploadStatus,
    progress: number,
    message?: string
  ): void {
    const file = this.queue.get(fileId);
    if (file) {
      file.status = status;
      file.progress = progress;
      if (message) {
        // Store last message if needed
      }
    }
  }

  /**
   * Wait for available upload slot
   */
  private async waitForSlot(): Promise<void> {
    while (this.activeUploads >= this.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    this.activeUploads++;
  }

  /**
   * Generate unique upload ID
   */
  private generateId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique file name
   */
  private generateFileName(file: File): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    const ext = file.name.split('.').pop() || 'jpg';
    return `${timestamp}-${random}.${ext}`;
  }

  /**
   * Get auth token for API calls
   */
  private getAuthToken(): string {
    // Get from localStorage or auth context
    return localStorage.getItem('auth_token') || '';
  }

  /**
   * Format location from GPS coordinates
   */
  private formatLocation(gps: { latitude: number; longitude: number }): string {
    const lat = Math.abs(gps.latitude).toFixed(4);
    const lon = Math.abs(gps.longitude).toFixed(4);
    const latDir = gps.latitude >= 0 ? 'N' : 'S';
    const lonDir = gps.longitude >= 0 ? 'E' : 'W';
    return `${lat}${latDir}, ${lon}${lonDir}`;
  }

  /**
   * Infer category from AI suggestions
   */
  private inferCategory(aiSuggestions?: AISuggestions): string | undefined {
    if (!aiSuggestions) return undefined;

    const allKeywords = aiSuggestions.keywords.map(k => k.value.toLowerCase());
    
    const categoryKeywords: Record<string, string[]> = {
      wildlife: ['animal', 'wildlife', 'lion', 'elephant', 'bird', 'mammal', 'fauna', 'predator', 'ungulate', 'avifauna'],
      landscape: ['mountain', 'savanna', 'plain', 'horizon', 'terrain', 'ecosystem', 'vegetation', 'geological'],
      culture: ['tribe', 'village', 'traditional', 'ritualistic', 'ethnographic', 'communal', 'ceremonial', 'vernacular'],
      accommodation: ['camp', 'lodge', 'hotel', 'tent', 'shelter', 'dwelling', 'habitation'],
    };

    // Also check new keyword categories
    const newCategoryMap: Record<string, string> = {
      'topographical': 'landscape',
      'observational': 'culture',
      'technical': 'landscape',
    };

    const allKeywords = aiSuggestions.keywords.map(k => k.value.toLowerCase());

    // Check original keywords
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(kw => allKeywords.includes(kw))) {
        return category;
      }
    }

    // Check new taxonomy keywords
    for (const keyword of aiSuggestions.keywords) {
      if (newCategoryMap[keyword.category]) {
        return newCategoryMap[keyword.category];
      }
    }

    return undefined;
  }

  /**
   * Extract tags from AI suggestions
   */
  private extractTags(aiSuggestions?: AISuggestions): string[] | undefined {
    if (!aiSuggestions) return undefined;

    return aiSuggestions.keywords
      .filter(k => k.confidence >= 0.7)
      .map(k => k.value)
      .slice(0, 10);
  }

  /**
   * Cancel all pending uploads
   */
  cancelAll(): void {
    this.queue.forEach((file, id) => {
      if (file.status === 'pending' || file.status === 'uploading') {
        this.updateFileStatus(id, 'error', 0, 'Cancelled by user');
      }
    });
    this.queue.clear();
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): { total: number; completed: number; failed: number; active: number } {
    let completed = 0;
    let failed = 0;
    let active = 0;

    this.queue.forEach(file => {
      switch (file.status) {
        case 'complete':
          completed++;
          break;
        case 'error':
          failed++;
          break;
        case 'uploading':
        case 'extracting_exif':
        case 'analyzing_ai':
        case 'saving':
          active++;
          break;
      }
    });

    return {
      total: this.queue.size,
      completed,
      failed,
      active,
    };
  }
}

export const uploadService = new UploadService();
export default UploadService;
