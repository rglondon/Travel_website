/**
 * Image Optimization Service
 * Creates low-res proxies for AI analysis to reduce API payload size
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

interface ProxyOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

const DEFAULT_OPTIONS: ProxyOptions = {
  maxWidth: 1000,      // Max dimension for AI proxy
  maxHeight: 1000,
  quality: 80,         // JPEG quality
  format: 'jpeg',
};

export class ImageOptimizer {
  private static instance: ImageOptimizer;

  static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  /**
   * Create a low-res proxy for AI analysis
   * Reduces 40MB+ images to ~50-100KB for OpenAI Vision API
   */
  async createAIProxy(
    inputBuffer: Buffer,
    options?: Partial<ProxyOptions>
  ): Promise<{
    buffer: Buffer;
    width: number;
    height: number;
    originalSize: number;
    proxySize: number;
    reductionPercent: number;
  }> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const originalSize = inputBuffer.length;

    try {
      // Get image metadata first
      const metadata = await sharp(inputBuffer).metadata();
      const originalWidth = metadata.width || 0;
      const originalHeight = metadata.height || 0;

      // Calculate new dimensions (maintain aspect ratio)
      let newWidth = originalWidth;
      let newHeight = originalHeight;

      if (originalWidth > opts.maxWidth!) {
        newWidth = opts.maxWidth!;
        newHeight = Math.round((originalHeight / originalWidth) * opts.maxWidth!);
      }

      if (newHeight > opts.maxHeight!) {
        newHeight = opts.maxHeight!;
        newWidth = Math.round((originalWidth / originalHeight) * opts.maxHeight!);
      }

      // Create optimized proxy
      const proxyBuffer = await sharp(inputBuffer)
        .resize(newWidth, newHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          quality: opts.quality!,
          progressive: true,
          mozjpeg: true,
        })
        .toBuffer();

      const proxySize = proxyBuffer.length;

      return {
        buffer: proxyBuffer,
        width: newWidth,
        height: newHeight,
        originalSize,
        proxySize,
        reductionPercent: Math.round((1 - proxySize / originalSize) * 100),
      };
    } catch (error) {
      console.warn('Image optimization failed, using original:', error);
      // Return original if optimization fails
      return {
        buffer: inputBuffer,
        width: 0,
        height: 0,
        originalSize,
        proxySize: originalSize,
        reductionPercent: 0,
      };
    }
  }

  /**
   * Create a thumbnail for the UI grid
   */
  async createThumbnail(
    inputBuffer: Buffer,
    size: number = 300
  ): Promise<Buffer> {
    try {
      return await sharp(inputBuffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 70, progressive: true })
        .toBuffer();
    } catch (error) {
      console.warn('Thumbnail creation failed:', error);
      return inputBuffer;
    }
  }

  /**
   * Create multiple sizes for different use cases
   */
  async createImageSet(
    inputBuffer: Buffer
  ): Promise<{
    thumbnail: Buffer;    // 300x300 - UI grid
    preview: Buffer;      // 800x800 - Quick view
    proxy: Buffer;        // 1000x1000 - AI analysis
    original: Buffer;     // Original - Full resolution
  }> {
    const [thumbnail, preview, proxy] = await Promise.all([
      this.createThumbnail(inputBuffer, 300),
      this.createThumbnail(inputBuffer, 800),
      this.createAIProxy(inputBuffer).then(r => r.buffer),
    ]);

    return {
      thumbnail,
      preview,
      proxy,
      original: inputBuffer,
    };
  }

  /**
   * Validate image file
   */
  async validateImage(buffer: Buffer): Promise<{
    valid: boolean;
    width?: number;
    height?: number;
    format?: string;
    error?: string;
  }> {
    try {
      const metadata = await sharp(buffer).metadata();
      
      if (!metadata.width || !metadata.height) {
        return { valid: false, error: 'Invalid image dimensions' };
      }

      // Check minimum size
      if (metadata.width < 100 || metadata.height < 100) {
        return { valid: false, error: 'Image too small (minimum 100x100)' };
      }

      // Check maximum size (50MB for original)
      if (buffer.length > 50 * 1024 * 1024) {
        return { valid: false, error: 'Image too large (maximum 50MB)' };
      }

      return {
        valid: true,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
      };
    } catch (error) {
      return { valid: false, error: 'Invalid image file' };
    }
  }

  /**
   * Get image metadata
   */
  async getMetadata(buffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    space: string;
    channels: number;
    depth: string;
    density: number;
    hasAlpha: boolean;
  } | null> {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        space: metadata.space || 'unknown',
        channels: metadata.channels || 0,
        depth: metadata.depth || 'unknown',
        density: metadata.density || 72,
        hasAlpha: metadata.hasAlpha || false,
      };
    } catch {
      return null;
    }
  }
}

export const imageOptimizer = ImageOptimizer.getInstance();
export default ImageOptimizer;
