/**
 * Gallery Summary Service
 * Generates AI-powered project introductions using MiniMax M2.1
 * 
 * System Prompt for Gallery Summaries:
 * "Act as a Senior Travel Editor for a prestige publication. Analyze the provided 
 * field notes and image descriptions for this project. Synthesize them into a 
 * 150-word narrative introduction that captures the atmosphere, cultural significance, 
 * and emotional core of the journey. Avoid marketing clichés; use an observational, 
 * ethnographic, and sophisticated tone."
 */

import { miniMaxVisionService } from './minimaxService';

interface StoryContext {
  caption?: string;
  storyContext?: string;
  altText?: string;
  location?: string;
}

interface SummaryRequest {
  galleryId: string;
  galleryName: string;
  galleryDescription?: string;
  storyContexts: StoryContext[];
  style?: 'narrative' | 'poetic' | 'informative' | 'ethnographic';
}

interface SummaryResponse {
  intro: string;
  tokensUsed: number;
  generatedAt: Date;
}

export class GallerySummaryService {
  private static instance: GallerySummaryService;

  static getInstance(): GallerySummaryService {
    if (!GallerySummaryService.instance) {
      GallerySummaryService.instance = new GallerySummaryService();
    }
    return GallerySummaryService.instance;
  }

  /**
   * Generate project introduction from story contexts
   */
  async generateProjectIntro(request: SummaryRequest): Promise<SummaryResponse> {
    const { galleryName, galleryDescription, storyContexts, style = 'narrative' } = request;

    // Collect all story contexts
    const contextTexts = storyContexts
      .filter(ctx => ctx.storyContext || ctx.caption)
      .map((ctx, index) => {
        let text = `Image ${index + 1}: `;
        if (ctx.location) text += `Location: ${ctx.location}. `;
        if (ctx.storyContext) text += `Field Note: ${ctx.storyContext}. `;
        if (ctx.caption) text += `Caption: ${ctx.caption}. `;
        return text;
      })
      .join('\n\n');

    if (!contextTexts) {
      return {
        intro: `This ${galleryName} collection captures the essence of the journey through a visual narrative.`,
        tokensUsed: 0,
        generatedAt: new Date(),
      };
    }

    // System prompt as specified
    const systemPrompt = `Act as a Senior Travel Editor for a prestige publication. Analyze the provided field notes and image descriptions for this project. Synthesize them into a 150-word narrative introduction that captures the atmosphere, cultural significance, and emotional core of the journey. Avoid marketing clichés; use an observational, ethnographic, and sophisticated tone.`;

    // User prompt
    const userPrompt = `Project: ${galleryName}
Description: ${galleryDescription || 'A photographic journey'}

Field Notes & Descriptions:
${contextTexts}

Please write a 150-word narrative introduction for this gallery. Style: ${style}`;

    try {
      const result = await miniMaxVisionService.analyzeImage(
        '', // No image URL - using text analysis
        userPrompt,
        systemPrompt
      );

      // Extract the intro from the response
      const intro = this.extractIntroFromResult(result);

      return {
        intro,
        tokensUsed: result.tokensUsed || 0,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to generate gallery summary:', error);
      // Fallback summary
      return {
        intro: `This ${galleryName} collection presents a nuanced exploration of place and culture. Through careful observation, these images document the subtle interactions between environment and experience. The work reflects a commitment to authentic representation without the embellishment of conventional travel photography.`,
        tokensUsed: 0,
        generatedAt: new Date(),
      };
    }
  }

  /**
   * Extract intro text from MiniMax response
   */
  private extractIntroFromResult(result: { caption?: string; storyContext?: string; altText?: string; keywords?: string[] }): string {
    // The result might be parsed from the response
    if (result.storyContext && result.storyContext.length > 100) {
      return result.storyContext;
    }
    if (result.caption && result.caption.length > 100) {
      return result.caption;
    }
    // Return a placeholder
    return `This collection captures the essence of the journey through a series of carefully composed images that document the cultural landscape.`;
  }

  /**
   * Generate summary for multiple galleries in batch
   */
  async generateBatchSummaries(
    galleries: Array<{ id: string; name: string; description?: string; photos: SafariPhoto[] }>
  ): Promise<Map<string, SummaryResponse>> {
    const results = new Map<string, SummaryResponse>();

    for (const gallery of galleries) {
      const storyContexts = gallery.photos
        .filter(p => p.storyContext || p.caption)
        .map(p => ({
          caption: p.caption,
          storyContext: p.storyContext,
          altText: p.altText,
          location: p.location,
        }));

      const summary = await this.generateProjectIntro({
        galleryId: gallery.id,
        galleryName: gallery.name,
        galleryDescription: gallery.description,
        storyContexts,
      });

      results.set(gallery.id, summary);
    }

    return results;
  }
}

export const gallerySummaryService = GallerySummaryService.getInstance();
export default GallerySummaryService;
