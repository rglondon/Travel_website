/**
 * MiniMax AI Service - Vision & Text Generation
 * Client-side only implementation with retry logic and 60s timeout
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase (client-side only via import.meta.env - browser only)
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// MiniMax API Configuration
const MINIMAX_API_URL = 'https://api.minimax.chat/v1/text/chatcompletion_v2';
const MINIMAX_MODEL = 'abab6.5s-chat';
const MINIMAX_TIMEOUT_MS = 60000; // 60 seconds timeout

// ============================================================================
// TYPES
// ============================================================================

export interface AIResponse {
  success: boolean;
  fieldJournal?: string;
  altText?: string;
  error?: string;
}

export interface GalleryContext {
  title: string;
  description: string;
  projectContext?: string;
}

export interface PhotoWithAI extends Photo {
  isAiProcessing?: boolean;
  aiError?: string;
}

export interface Photo {
  id: string;
  galleryId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  altText?: string;
  fieldJournal?: string;
  displayOrder: number;
  views: number;
  likes: number;
  shares: number;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// RETRY LOGIC WITH EXPONENTIAL BACKOFF
// ============================================================================

/**
 * Retry a function with exponential backoff (up to 3 attempts)
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error as Error;
      const isRetryable = lastError.message.includes('fetch') || 
                          lastError.message.includes('network') ||
                          lastError.message.includes('Failed to fetch') ||
                          lastError.message.includes('ERR_NAME_NOT_RESOLVED') ||
                          lastError.message.includes('timeout') ||
                          lastError.name === 'AbortError';
      
      if (!isRetryable || attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`⚠️ Attempt ${attempt}/${maxRetries} failed: ${lastError.message}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

/**
 * Build the context-aware system prompt for photo captioning
 */
function buildVisionSystemPrompt(galleryContext: GalleryContext): string {
  return `Act as a Senior Travel Editor for a prestige publication. Analyze this image with ethnographic precision. Focus on textures, cultural artifacts (like ritual flowers and river debris), and atmospheric lighting. Write a 3-sentence "Field Journal" entry that captures the raw, unvarnished reality of the scene. Avoid clichés like "memorable" or "beautiful".

For each image, provide:
1. FIELD JOURNAL (3 sentences, observational style): A narrative description written in first-person observational style. Include sensory details, cultural context, and the specific moment captured. Be specific about textures, lighting, and artifacts in the scene. Make it feel like a traveler's notebook entry—raw, precise, unvarnished.

2. ALT TEXT (15 words max): A concise, factual description for accessibility. Focus on the subject, action, setting, and notable details visible in the image.`;
}

/**
 * Build the user prompt for a specific photo
 */
function buildVisionUserPrompt(imageUrl: string, galleryContext: GalleryContext): string {
  return `[IMAGE_URL]: ${imageUrl}

Analyze this photo in the context of the "${galleryContext.title}" project.

FIELD JOURNAL (100 words, observational style):
[Write your field journal entry here]

ALT TEXT:
[Write concise alt text here]

Respond in JSON format:
{
  "field_journal": "your 100-word narrative here",
  "alt_text": "concise description here"
}`;
}

// ============================================================================
// MINIMAX API CALL WITH TIMEOUT AND RETRIES
// ============================================================================

export async function callMiniMaxVision(
  imageUrl: string,
  galleryContext: GalleryContext
): Promise<AIResponse> {
  const apiKey = import.meta.env?.VITE_MINIMAX_API_KEY;

  if (!apiKey) {
    return { success: false, error: 'MiniMax API key not configured (VITE_MINIMAX_API_KEY)' };
  }

  const makeRequest = async (): Promise<AIResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MINIMAX_TIMEOUT_MS);

    try {
      const response = await fetch(MINIMAX_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MINIMAX_MODEL,
          messages: [
            {
              role: 'system',
              content: buildVisionSystemPrompt(galleryContext),
            },
            {
              role: 'user',
              content: buildVisionUserPrompt(imageUrl, galleryContext),
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.message || `API error: ${response.status}` };
      }

      const data = await response.json();
      
      // Parse the AI response
      const content = data.choices?.[0]?.message?.content || '';
      
      // Try to extract JSON from the response
      try {
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
        const parsed = JSON.parse(jsonStr);

        return {
          success: true,
          fieldJournal: parsed.field_journal || '',
          altText: parsed.alt_text || '',
        };
      } catch (parseError) {
        const fieldJournalMatch = content.match(/field_journal["']?\s*:\s*["']?([^"'\n]+)["']?/i);
        const altTextMatch = content.match(/alt_text["']?\s*:\s*["']?([^"'\n]+)["']?/i);

        return {
          success: true,
          fieldJournal: fieldJournalMatch?.[1]?.trim() || content.substring(0, 300),
          altText: altTextMatch?.[1]?.trim() || 'Travel photography',
        };
      }
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      const err = error as { name?: string; message?: string };
      if (err.name === 'AbortError') {
        throw new Error(`MiniMax request timed out after ${MINIMAX_TIMEOUT_MS / 1000} seconds`);
      }
      throw new Error(err.message || 'Unknown error');
    }
  };

  // Retry the request up to 3 times with exponential backoff
  return retryWithBackoff(makeRequest, 3, 2000);
}

// ============================================================================
// GALLERY SUMMARY GENERATION
// ============================================================================

export async function generateGalleryIntro(
  galleryId: string,
  galleryContext: GalleryContext
): Promise<{ success: boolean; intro?: string; error?: string }> {
  const apiKey = import.meta.env?.VITE_MINIMAX_API_KEY;

  if (!apiKey) {
    return { success: false, error: 'MiniMax API key not configured' };
  }

  const makeRequest = async (): Promise<{ success: boolean; intro?: string; error?: string }> => {
    try {
      // Get photos from Supabase (client-side only)
      const { data: photos, error } = await supabase
        .from('photos')
        .select('field_journal, alt_text')
        .eq('gallery_id', galleryId)
        .eq('is_published', true);

      if (error) throw error;

      const captions = photos
        .map(p => p.field_journal)
        .filter(Boolean)
        .join('\n\n---\n\n');

      if (!captions) {
        return { success: false, error: 'No photo captions found to synthesize' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), MINIMAX_TIMEOUT_MS);

      const response = await fetch(MINIMAX_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MINIMAX_MODEL,
          messages: [
            {
              role: 'system',
              content: `Act as a Senior Travel Editor. Synthesize these field notes into a 150-word narrative introduction for a photography project about "${galleryContext.title}". 
              
The tone should be observational, ethnographic, and sophisticated—like a prestige travel journal. Avoid marketing clichés.
Write in first person, as if documenting your journey.`,
            },
            {
              role: 'user',
              content: `FIELD NOTES:\n${captions}\n\nWrite a 150-word narrative introduction.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return { success: false, error: `API error: ${response.status}` };
      }

      const data = await response.json();
      const intro = data.choices?.[0]?.message?.content || '';

      return { success: true, intro };
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      if (err.name === 'AbortError') {
        throw new Error(`MiniMax request timed out after ${MINIMAX_TIMEOUT_MS / 1000} seconds`);
      }
      throw err;
    }
  };

  return retryWithBackoff(makeRequest, 3, 2000);
}

// ============================================================================
// UPLOAD HANDLER WITH AI PROCESSING
// ============================================================================

export interface UploadResult {
  success: boolean;
  photo?: Photo;
  aiResult?: AIResponse;
  error?: string;
}

/**
 * Handle photo upload with automatic AI captioning
 * Client-side only implementation with retry logic
 */
export async function handlePhotoUpload(
  file: File,
  galleryId: string,
  galleryContext: GalleryContext,
  onProgress?: (status: string) => void
): Promise<UploadResult> {
  onProgress?.('Uploading...');

  try {
    // 1. Upload image to Supabase Storage (client-side)
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('galleries')
      .upload(fileName, file);

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 2. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('galleries')
      .getPublicUrl(fileName);

    onProgress?.('Creating record...');

    // 3. Create photo record in Supabase (client-side)
    const { data: photoRecord, error: dbError } = await supabase
      .from('photos')
      .insert({
        gallery_id: galleryId,
        image_url: publicUrl,
        display_order: 0,
        is_published: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // 4. Trigger AI Vision processing with timeout and retry
    onProgress?.('AI analyzing... (up to 60s)');

    const aiResult = await callMiniMaxVision(publicUrl, galleryContext);

    if (aiResult.success && aiResult.fieldJournal) {
      // 5. Update photo with AI-generated content (client-side)
      await supabase
        .from('photos')
        .update({
          alt_text: aiResult.altText,
          field_journal: aiResult.fieldJournal,
          ai_processed: true,
          ai_model: 'MiniMax M2.1 Vision',
          ai_processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', photoRecord.id);
    }

    onProgress?.('Done!');

    return {
      success: true,
      photo: {
        ...photoRecord,
        galleryId: photoRecord.gallery_id,
        imageUrl: photoRecord.image_url,
        altText: aiResult.altText,
        fieldJournal: aiResult.fieldJournal,
        displayOrder: photoRecord.display_order,
        isPublished: photoRecord.is_published,
        isFeatured: photoRecord.is_featured,
        createdAt: new Date(photoRecord.created_at),
        updatedAt: new Date(photoRecord.updated_at),
      },
      aiResult,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { success: false, error: err.message || 'Upload failed' };
  }
}

export default {
  callMiniMaxVision,
  generateGalleryIntro,
  handlePhotoUpload,
};
