/**
 * EXIF Extraction Service
 * Extracts metadata from image files including GPS, camera specs, and technical data
 * Uses exifr library for modern, promise-based EXIF parsing
 */

import EXIFData from './EXIFData';

// Import exifr for type definitions (actual import is dynamic for browser compatibility)
import type exifr from 'exifr';

export class EXIFExtractor {
  private static instance: EXIFExtractor;

  static getInstance(): EXIFExtractor {
    if (!EXIFExtractor.instance) {
      EXIFExtractor.instance = new EXIFExtractor();
    }
    return EXIFExtractor.instance;
  }

  /**
   * Extract all EXIF data from a file using exifr
   */
  async extractFromFile(file: File): Promise<EXIFData> {
    if (typeof window === 'undefined') {
      return {};
    }

    try {
      // Dynamic import of exifr
      const exifrModule = await import('exifr');
      const exifr = exifrModule.default || exifrModule;

      // Parse EXIF data - exifr returns a flat object with all tags
      const tags = await exifr.parse(file, {
        tiff: true,
        exif: true,
        gps: true,
        interop: true,
        ifd0: true,
        ifd1: true,
      }) || {};

      return this.parseEXIFData(tags);
    } catch (error) {
      console.warn('EXIF extraction failed:', error);
      return {};
    }
  }

  /**
   * Parse raw EXIF data from exifr into structured format
   */
  private parseEXIFData(tags: Record<string, any>): EXIFData {
    return {
      // Camera Make/Model
      cameraMake: tags.Make,
      cameraModel: tags.Model,
      lens: tags.LensModel || this.formatLens(tags),
      
      // Exposure settings
      iso: tags.ISO,
      aperture: this.formatAperture(tags.FNumber),
      shutterSpeed: this.formatShutterSpeed(tags.ExposureTime),
      focalLength: this.formatFocalLength(tags.FocalLength),
      focalLength35mm: tags.FocalLenIn35mmFilm,
      exposureCompensation: this.formatExposureCompensation(tags.ExposureBiasValue),
      whiteBalance: tags.WhiteBalance,
      flash: this.formatFlash(tags.Flash),
      meteringMode: tags.MeteringMode,
      
      // Date/Time
      captureDate: this.parseDateTime(tags.DateTimeOriginal, tags.DateTimeDigitized),
      
      // File info
      fileSize: tags.FileSize,
      imageWidth: tags.ImageWidth || tags.PixelXDimension,
      imageHeight: tags.ImageHeight || tags.PixelYDimension,
      colorSpace: tags.ColorSpace === 1 ? 'sRGB' : undefined,
      orientation: tags.Orientation,
    };
  }

  /**
   * Extract GPS coordinates from EXIF using exifr
   */
  async extractGPS(file: File): Promise<{
    gpsData: Partial<import('../types').GPSData> | null;
    hasGPS: boolean;
  }> {
    if (typeof window === 'undefined') {
      return { gpsData: null, hasGPS: false };
    }

    try {
      const exifrModule = await import('exifr');
      const exifr = exifrModule.default || exifrModule;

      // Parse GPS data specifically
      const gps = await exifr.gps(file);
      
      if (!gps || !gps.latitude || !gps.longitude) {
        return { gpsData: null, hasGPS: false };
      }

      return {
        gpsData: {
          latitude: gps.latitude,
          longitude: gps.longitude,
          altitude: gps.altitude ? Math.round(gps.altitude * 10) / 10 : undefined,
          latitudeRef: gps.latitudeRef as 'N' | 'S',
          longitudeRef: gps.longitudeRef as 'E' | 'W',
          altitudeRef: gps.altitudeRef,
          gpsDate: gps.GPSDateStamp,
          gpsTime: this.formatGPSTime([gps.GPSTimeStamp?.hours, gps.GPSTimeStamp?.minutes, gps.GPSTimeStamp?.seconds]),
          processingMethod: 'EXIF' as const,
        },
        hasGPS: true,
      };
    } catch (error) {
      console.warn('GPS extraction failed:', error);
      return { gpsData: null, hasGPS: false };
    }
  }

  /**
   * Convert DMS (Degrees, Minutes, Seconds) to Decimal Degrees
   */
  private convertDMSToDD(dms: number[], ref?: string): number {
    if (!dms || dms.length < 3) return 0;

    const degrees = dms[0];
    const minutes = dms[1];
    const seconds = dms[2];

    let dd = degrees + minutes / 60 + seconds / 3600;

    if (ref === 'S' || ref === 'W') {
      dd = dd * -1;
    }

    return Math.round(dd * 1000000) / 1000000; // 6 decimal places
  }

  /**
   * Format aperture from F-Number
   */
  private formatAperture(fNumber?: number): string | undefined {
    if (!fNumber) return undefined;
    return `f/${fNumber}`;
  }

  /**
   * Format shutter speed from decimal seconds
   */
  private formatShutterSpeed(exposureTime?: number): string | undefined {
    if (!exposureTime) return undefined;

    if (exposureTime >= 1) {
      return `${Math.round(exposureTime)}s`;
    }

    const denominator = Math.round(1 / exposureTime);
    return `1/${denominator}`;
  }

  /**
   * Format focal length from mm
   */
  private formatFocalLength(focalLength?: number): string | undefined {
    if (!focalLength) return undefined;
    return `${Math.round(focalLength)}mm`;
  }

  /**
   * Format lens model from various tags
   */
  private formatLens(tags: any): string | undefined {
    return tags.LensModel || tags.LensInfo || undefined;
  }

  /**
   * Format exposure compensation
   */
  private formatExposureCompensation(bias?: number): string | undefined {
    if (bias === undefined || bias === 0) return undefined;
    const sign = bias > 0 ? '+' : '';
    return `${sign}${bias.toFixed(1)} EV`;
  }

  /**
   * Format flash information
   */
  private formatFlash(flash?: number): string | undefined {
    if (flash === undefined) return undefined;
    const fired = (flash & 1) !== 0;
    return fired ? 'Flash Fired' : 'No Flash';
  }

  /**
   * Parse EXIF date format
   */
  private parseDateTime(dateTimeOriginal?: string, dateTimeDigitized?: string): Date | undefined {
    const dateStr = dateTimeOriginal || dateTimeDigitized;
    if (!dateStr) return undefined;

    try {
      // EXIF format: "2024:01:15 14:30:45"
      const [datePart, timePart] = dateStr.split(' ');
      const [year, month, day] = datePart.split(':').map(Number);
      const [hours, minutes, seconds] = (timePart || '00:00:00').split(':').map(Number);

      return new Date(year, month - 1, day, hours, minutes, seconds);
    } catch {
      return undefined;
    }
  }

  /**
   * Format GPS time stamp
   */
  private formatGPSTime(timeStamp?: number[]): string | undefined {
    if (!timeStamp || timeStamp.length < 3) return undefined;
    const [hours, minutes, seconds] = timeStamp;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(Math.floor(seconds)).padStart(2, '0')}`;
  }
}

export const exifExtractor = EXIFExtractor.getInstance();
export default EXIFExtractor;
