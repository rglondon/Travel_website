import React, { useState, useEffect } from 'react';
import { Save, Sparkles, RefreshCw, Check } from 'lucide-react';
import type { SafariPhoto } from '../../types';

interface CaptionsHubProps {
  photos: SafariPhoto[];
  selectedPhoto: SafariPhoto | null;
  onSelectPhoto: (photo: SafariPhoto) => void;
  onUpdatePhoto: (id: string, updates: Partial<SafariPhoto>) => void;
}

// Version 1.8: National Geographic Journalistic Voice Prompt
const AI_JOURNALISTIC_VOICE = `You are a National Geographic photo editor. Write compelling, journalistically rigorous captions that:

1. SUBJECT (Alt-Text): Describe the photo in 1-2 sentences that would make someone pause while scrolling. Use sensory language and specific details. Focus on the essential story element.

2. FIELD JOURNAL (Description): Write a rich, narrative description (3-5 sentences) that places the viewer in the scene. Include:
- Specific location and environmental context
- Emotional resonance or historical significance
- Technical insight (why this moment matters)
- A subtle call to wonder

Style: National Geographic meets New York Times photo essay. Evocative, precise, and transportive.

Respond with JSON format:
{
  "subject": "your subject text",
  "description": "your description text"
}`;

export function CaptionsHub({
  photos,
  selectedPhoto,
  onSelectPhoto,
  onUpdatePhoto,
}: CaptionsHubProps) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load selected photo's AI fields
  useEffect(() => {
    if (selectedPhoto) {
      setSubject(selectedPhoto.aiSubject || '');
      setDescription(selectedPhoto.aiDescription || '');
      setHasChanges(false);
    }
  }, [selectedPhoto?.id]);

  const handleSubjectChange = (value: string) => {
    setSubject(value);
    setHasChanges(true);
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedPhoto) return;
    
    onUpdatePhoto(selectedPhoto.id, {
      aiSubject: subject,
      aiDescription: description,
      aiProcessed: true,
    });
    
    setLastSaved(new Date());
    setHasChanges(false);
  };

  const handleAIGenerate = async () => {
    if (!selectedPhoto) return;
    
    setIsGenerating(true);
    
    // Version 1.8: AI Integration with National Geographic Voice
    // This would call the AI API - simulated here
    try {
      // Simulated AI response (replace with actual API call)
      const aiResponse = await simulateAIGeneration(selectedPhoto);
      
      setSubject(aiResponse.subject);
      setDescription(aiResponse.description);
      setHasChanges(true);
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate word count
  const subjectWordCount = subject.trim().split(/\s+/).filter(Boolean).length;
  const descriptionWordCount = description.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="captions-hub">
      <div className="captions-hub-header">
        <h2 className="captions-hub-title">
          <Sparkles size={20} />
          SEO Workspace
        </h2>
        <div className="captions-hub-actions">
          {hasChanges && (
            <span className="unsaved-indicator">Unsaved changes</span>
          )}
          {lastSaved && (
            <span className="saved-indicator">
              <Check size={14} />
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!hasChanges || !selectedPhoto}
          >
            <Save size={16} />
            Save
          </button>
        </div>
      </div>

      {/* Photo Selection */}
      <div className="captions-photo-selector">
        <label>Select Photo</label>
        <select
          value={selectedPhoto?.id || ''}
          onChange={(e) => {
            const photo = photos.find(p => p.id === e.target.value);
            if (photo) onSelectPhoto(photo);
          }}
          disabled={photos.length === 0}
        >
          <option value="">Choose a photo...</option>
          {photos.map((photo) => (
            <option key={photo.id} value={photo.id}>
              {photo.altText || photo.imageUrl.split('/').pop() || 'Untitled'}
            </option>
          ))}
        </select>
      </div>

      {selectedPhoto ? (
        <>
          {/* Preview */}
          <div className="captions-preview">
            <img
              src={selectedPhoto.thumbnailUrl || selectedPhoto.imageUrl}
              alt={selectedPhoto.altText || 'Selected photo'}
            />
            <div className="captions-preview-info">
              <span className="photo-id">ID: {selectedPhoto.id.slice(0, 8)}</span>
              {selectedPhoto.aiProcessed && (
                <span className="ai-processed-badge">
                  <Sparkles size={12} />
                  AI Processed
                </span>
              )}
            </div>
          </div>

          {/* Subject Field */}
          <div className="captions-field">
            <div className="captions-field-header">
              <label>Subject (Alt-Text)</label>
              <span className="word-count">{subjectWordCount} words</span>
            </div>
            <textarea
              value={subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              placeholder="Describe the photo in 1-2 sentences for accessibility and SEO..."
              rows={3}
              className="captions-textarea"
            />
          </div>

          {/* Description Field */}
          <div className="captions-field">
            <div className="captions-field-header">
              <label>Field Journal (Description)</label>
              <span className="word-count">{descriptionWordCount} words</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Write a rich, narrative description (3-5 sentences) that transports the viewer..."
              rows={6}
              className="captions-textarea"
            />
          </div>

          {/* AI Generation */}
          <div className="captions-ai-section">
            <button
              className="btn btn-ai"
              onClick={handleAIGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className="spinning" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate with AI
                </>
              )}
            </button>
            <p className="ai-hint">
              Uses National Geographic Journalistic Voice to craft compelling captions
            </p>
          </div>
        </>
      ) : (
        <div className="captions-empty">
          <p>Select a photo to edit its captions and descriptions</p>
        </div>
      )}
    </div>
  );
}

// Version 1.8: Simulated AI generation (replace with actual API call)
async function simulateAIGeneration(photo: SafariPhoto): Promise<{ subject: string; description: string }> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return simulated response based on photo
  return {
    subject: `A breathtaking moment captured in ${photo.location || 'the wild'}, showcasing the natural beauty and raw emotion of the scene.`,
    description: `In this stunning photograph, we find ourselves drawn into a world where light and shadow dance across the landscape. The composition invites the viewer to explore every detail, from the subtle textures to the sweeping vistas that stretch toward an endless horizon. This image captures not just a moment, but a feeling—the quiet wonder that comes from witnessing nature in its most authentic form.`,
  };
}

export default CaptionsHub;
