/**
 * AI Service Compatibility Wrapper
 * Redirects to MiniMax M2.1 Vision Service
 * 
 * This file maintains backward compatibility with existing code
 * that imports from aiService. It now uses MiniMax M2.1.
 */

import { miniMaxVisionService } from './minimaxService';
import { AISuggestions } from '../types';

// Re-export MiniMax service as the default AI service
export const aiVisionService = miniMaxVisionService;
export default aiVisionService;

// Keep the old class for reference (deprecated)
export { MiniMaxVisionService } from './minimaxService';

/**
 * @deprecated Use miniMaxVisionService.analyzeImage() instead
 */
export async function analyzeImage(imageUrl: string): Promise<AISuggestions> {
  return miniMaxVisionService.analyzeImage(imageUrl);
}

/**
 * @deprecated Use miniMaxVisionService.analyzeBatch() instead
 */
export async function analyzeBatch(
  imageUrls: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<AISuggestions[]> {
  return miniMaxVisionService.analyzeBatch(imageUrls, onProgress);
}
