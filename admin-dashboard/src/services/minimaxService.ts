/**
 * MiniMax Vision Service
 * Uses MiniMax M2.1 for image analysis and metadata generation
 * 
 * MiniMax API: https://api.minimax.chat
 * Model: abab6.5s-chat (for text) or abab6.5-vision (for multimodal)
 */

import { AISuggestions, AISuggestionItem, AIValueSuggestion } from '../types';

interface MiniMaxConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

interface MiniMaxMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: { url: string };
  }>;
}

interface MiniMaxResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage: {
    total_tokens: number;
  };
}

const DEFAULT_CONFIG: Partial<MiniMaxConfig> = {
  baseUrl: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
  model: 'abab6.5s-chat', // Using chat model with vision support
  maxTokens: 2000,
  temperature: 0.7,
};

export class MiniMaxVisionService {
  private static instance: MiniMaxVisionService;
  private config: MiniMaxConfig;

  private constructor(config?: Partial<MiniMaxConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config } as MiniMaxConfig;
  }

  static getInstance(options?: Partial<MiniMaxConfig>): MiniMaxVisionService {
    if (!MiniMaxVisionService.instance) {
      MiniMaxVisionService.instance = new MiniMaxVisionService(options);
    } else if (options) {
      MiniMaxVisionService.instance.updateConfig(options);
    }
    return MiniMaxVisionService.instance;
  }

  updateConfig(options: Partial<MiniMaxConfig>): void {
    this.config = { ...this.config, ...options };
  }

  /**
   * Analyze an image and generate metadata using MiniMax M2.1
   * Leverages 200k context window for complete persona + rules
   */
  async analyzeImage(imageUrl: string): Promise<AISuggestions> {
    if (!this.config.apiKey) {
      throw new Error('MiniMax API key not configured');
    }

    const messages = this.buildVisionPrompt(imageUrl);

    try {
      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MiniMax API error: ${response.status} - ${errorText}`);
      }

      const data: MiniMaxResponse = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content in MiniMax response');
      }

      console.log(`[MiniMax] Tokens used: ${data.usage?.total_tokens || 'N/A'}`);

      return this.parseAIResponse(content);
    } catch (error) {
      console.error('MiniMax Vision analysis failed:', error);
      throw error;
    }
  }

  /**
   * Build vision prompt with complete Senior Photo Editor persona
   */
  private buildVisionPrompt(imageUrl: string): MiniMaxMessage[] {
    // Full 200k context window persona - no truncation needed
    const systemPrompt = `You are a Senior Photo Editor for an elite Documentary Journal in the tradition of National Geographic or Magnum Photos.

## YOUR IDENTITY & AUTHORITY
You are a veteran photo editor with 30 years of experience curating images for international documentary publications. You speak with clinical precision and documentary authority. You are the gatekeeper of visual truth.

## STRICT OUTPUT RULES

### 1. KEYWORD TAXONOMY (MANDATORY - 10-12 keywords)
You MUST generate keywords in exactly these THREE categories:

**CATEGORY 1: TOPOGRAPHICAL / GEOGRAPHICAL**
Use specific terrain, ecosystem, water feature, geological formation, or architectural typology terms.
EXAMPLES: Riparian-zone, Arid-savanna, Laterite-outcrop, Sacred-architecture, High-altitude, Lacustrine, Dendrological, Vertisol, Alluvial-fan, Granite-escarpment, Vernacular-shelter, Ghat-steps, Riverbank, Narrow-alley, Temple-complex, Pilgrimage-site, Burning-ghat, Cremation-ground

**CATEGORY 2: OBSERVATIONAL / NARRATIVE**
Use specific social-documentary context, behavioral pattern, ritual practice, or ethnographic marker terms.
EXAMPLES: Ethnographic-portrait, Labor-praxis, Pastoral-transhumance, Market-economy, Communal-gathering, Ritualistic-sequence, Social-stratification, Documentary-archival, Patrilineal-structure, Animist-practice, Agrarian-cycle, Sadhus, Puja, Aarti, Sandhya-puja, Havan, Ceremonial-fire, Processional, Devotees, Ritual-bathing, Funerary-rites

**CATEGORY 3: TECHNICAL TEXTURE**
Use specific light quality, color characteristic, optical property, or temporal condition terms.
EXAMPLES: Low-chroma, High-contrast, Ambient-diffusion, Optical-compression, Backlit-silhouette, Sidelit, Hard-shadow, Golden-hour, Diffused-overcast, Reflectance-surface, Chromatic-density, Thermal-distortion, Smoke-density, Back-smoke, Side-lighting, Harsh-midday, Soft-evening, Dust-atmosphere

### 2. BLACKLISTED WORDS - NEVER USE
beautiful, stunning, breathtaking, aesthetic, cinematic, mesmerizing, ethereal, serene, peaceful, tranquil, amazing, incredible, wonderful, spectacular, gorgeous, magical, divine, soul-stirring, heart-warming

### 3. FIELD JOURNAL ENTRY (story_context)
Write in first-person present or past tense as a FIELD RECORD. Document:
- Subject identity (specific, not generic)
- Action or behavior observed
- Environmental context
- Temporal markers (time of day, season)
- Physical details that provide evidentiary value

DO NOT: Use marketing language, emotional claims, superlatives, travel-brochure tone, or subjective assessments.

EXAMPLE OF APPROPRIATE TONE:
"Late afternoon observation at Dashashwamedh Ghat. Three sadhu figures positioned at water's edge, facing east. Smoke from ceremonial fire visible in foreground. Individual at center, estimated age 55-60, with ash.apply markings on forehead. 30° solar angle creating long shadows. Approximately 40 devotees visible in background, some bathing, others in prayer."

EXAMPLE OF INAPPROPRIATE TONE (NEVER WRITE THIS):
"The breathtaking sunset over the sacred ghats creates a magical atmosphere. The stunning sadhus exude a peaceful serenity that touches the soul. This beautiful moment captures the ethereal essence of spiritual India."

### 4. ALT TEXT (for accessibility + SEO)
Describe what is physically present: subject, action, setting, materials. Be specific. Include species names, architectural terms, tool types. No emotional framing. 60-120 characters.

### 5. CAPTION (for archival display)
Archival gallery tone: informative, precise, minimal. Include subject ID, location precision, temporal context. Omit editorializing. 80-150 characters.

## OUTPUT FORMAT
You must output ONLY valid JSON. No markdown, no explanations, no conversational text.

{
  "keywords": [
    {"value": "keyword-here", "category": "topographical|observational|technical", "confidence": 0.0-1.0}
  ],
  "altText": "factual description here",
  "caption": "archival caption here",
  "storyContext": "field journal entry here",
  "technicalAnalysis": "brief technical note here",
  "compositionNotes": "brief note on framing here",
  "lightingNotes": "note on light conditions here"
}

## CRITICAL REMINDERS
- Use hyphenated compound terms (e.g., "riparian-zone", "ceremonial-fire")
- Be specific: "burning-ghat" not just "ghats"; "sandhya-puja" not just "prayer"
- Include confidence scores based on how certain you are
- If uncertain about a detail, reflect that in the confidence score
- Prioritize documentary accuracy over poetic description
- The 200k context window means you can hold all these rules in mind - follow them precisely`;

    const userMessage: MiniMaxMessage = {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Analyze this image using the Senior Photo Editor persona and output the metadata as specified.',
        },
        {
          type: 'image_url',
          image_url: { url: imageUrl },
        },
      ],
    };

    return [
      { role: 'system', content: systemPrompt },
      userMessage,
    ];
  }

  /**
   * Parse MiniMax response into structured format
   */
  private parseAIResponse(content: string): AISuggestions {
    try {
      // Clean up any markdown code blocks if present
      const cleaned = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^```$/gm, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      const suggestions: AISuggestions = {
        keywords: this.parseKeywords(parsed.keywords),
        altText: {
          value: parsed.altText || '',
          confidence: 0.85,
          approved: false,
        },
        caption: {
          value: parsed.caption || '',
          confidence: 0.85,
          approved: false,
        },
        storyContext: {
          value: parsed.storyContext || '',
          confidence: 0.80,
          approved: false,
        },
        technicalAnalysis: parsed.technicalAnalysis,
        compositionNotes: parsed.compositionNotes,
        lightingNotes: parsed.lightingNotes,
        model: this.config.model,
        processedAt: new Date(),
      };

      return suggestions;
    } catch (error) {
      console.error('Failed to parse MiniMax response:', error);
      console.error('Raw content:', content);
      
      return {
        keywords: [],
        altText: { value: '', confidence: 0, approved: false },
        caption: { value: '', confidence: 0, approved: false },
        storyContext: { value: '', confidence: 0, approved: false },
        model: this.config.model,
        processedAt: new Date(),
      };
    }
  }

  /**
   * Parse and validate keyword array
   */
  private parseKeywords(keywords: any[]): AISuggestionItem[] {
    if (!Array.isArray(keywords)) return [];

    const validCategories = ['topographical', 'observational', 'technical'];

    return keywords
      .filter((k): k is { value: string; category: string; confidence: number } => 
        typeof k?.value === 'string' && 
        typeof k?.confidence === 'number' &&
        validCategories.includes(k.category?.toLowerCase?.())
      )
      .map(k => ({
        value: k.value.toLowerCase().trim(),
        category: k.category.toLowerCase() as AISuggestionItem['category'],
        confidence: Math.max(0, Math.min(1, k.confidence)),
        approved: false,
      }));
  }

  /**
   * Batch analyze multiple images
   */
  async analyzeBatch(
    imageUrls: string[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<AISuggestions[]> {
    const results: AISuggestions[] = [];
    
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const suggestions = await this.analyzeImage(imageUrls[i]);
        results.push(suggestions);
      } catch (error) {
        console.error(`Failed to analyze image ${i}:`, error);
        results.push({
          keywords: [],
          altText: { value: '', confidence: 0, approved: false },
          caption: { value: '', confidence: 0, approved: false },
          storyContext: { value: '', confidence: 0, approved: false },
          model: this.config.model,
          processedAt: new Date(),
        });
      }

      if (onProgress) {
        onProgress(i + 1, imageUrls.length);
      }

      // MiniMax rate limiting - wait 200ms between requests
      if (i < imageUrls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return results;
  }

  /**
   * Generate SEO keywords from context (text-only version)
   */
  async generateKeywordsFromContext(
    caption: string,
    location?: string,
    category?: string
  ): Promise<string[]> {
    if (!this.config.apiKey) {
      return this.generateBasicKeywords(caption, location, category);
    }

    const prompt = `Generate 10 SEO keywords for a photo with:
- Caption: "${caption}"
- Location: ${location || 'Unknown'}
- Category: ${category || 'General'}

Use the keyword taxonomy: topographical, observational, technical.
Respond with JSON array only: ["keyword1", "keyword2", ...]`;

    try {
      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'user', content: prompt },
          ],
          max_tokens: 500,
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error('API error');
      }

      const data: MiniMaxResponse = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (content) {
        try {
          return JSON.parse(content);
        } catch {
          // Fallback
        }
      }
    } catch {
      // Fallback to basic generation
    }

    return this.generateBasicKeywords(caption, location, category);
  }

  /**
   * Basic keyword generation without AI
   */
  private generateBasicKeywords(
    caption: string,
    location?: string,
    category?: string
  ): string[] {
    const keywords: string[] = [];
    
    if (category) keywords.push(category);
    if (location) keywords.push(location.toLowerCase().replace(/\s+/g, '-'));
    
    const words = caption.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'a', 'an', 'in', 'on', 'at', 'with', 'and', 'or', 'of', 'for', 'to'];
    
    words.forEach(word => {
      if (word.length > 3 && !stopWords.includes(word)) {
        keywords.push(word.replace(/[^a-z]/g, ''));
      }
    });

    keywords.push('documentary', 'photojournalism');
    
    return [...new Set(keywords)].slice(0, 10);
  }
}

export const miniMaxVisionService = MiniMaxVisionService.getInstance();
export default MiniMaxVisionService;
