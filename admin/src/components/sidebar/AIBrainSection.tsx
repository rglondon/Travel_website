/**
 * AIBrainSection Component
 * Displays AI-generated suggestions with approval workflow
 */

import React, { useState } from 'react';
import { AISuggestions, AISuggestionItem, AIValueSuggestion } from '../../types';
import { ProcessingPulse } from '../upload/RadarAnimation';

interface AIBrainSectionProps {
  suggestions?: AISuggestions;
  isAnalyzing?: boolean;
  onApproveKeyword?: (keyword: AISuggestionItem) => void;
  onRejectKeyword?: (keyword: AISuggestionItem) => void;
  onApproveAltText?: (value: string) => void;
  onRejectAltText?: () => void;
  onApproveCaption?: (value: string) => void;
  onRejectCaption?: () => void;
  onApproveStory?: (value: string) => void;
  onRejectStory?: () => void;
  approvedKeywords?: string[];
}

export const AIBrainSection: React.FC<AIBrainSectionProps> = ({
  suggestions,
  isAnalyzing = false,
  onApproveKeyword,
  onRejectKeyword,
  onApproveAltText,
  onRejectAltText,
  onApproveCaption,
  onRejectCaption,
  onApproveStory,
  onRejectStory,
  approvedKeywords = [],
}) => {
  const [editingAltText, setEditingAltText] = useState(false);
  const [altTextValue, setAltTextValue] = useState(suggestions?.altText?.value || '');

  // Handle AI analysis in progress
  if (isAnalyzing) {
    return (
      <div className="ai-brain-section">
        <div className="section-header">
          <h4 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            🤖 AI Analysis
          </h4>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
            padding: 'var(--space-lg)',
            background: 'var(--color-accent-light)',
            border: '1px solid var(--color-accent)',
          }}
        >
          <ProcessingPulse color="#0066FF" />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>
              Analyzing Image
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
              Extracting metadata and generating suggestions...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No suggestions yet
  if (!suggestions || (!suggestions.keywords.length && !suggestions.altText.value)) {
    return null;
  }

  const approvedKeywordSet = new Set(approvedKeywords);

  return (
    <div className="ai-brain-section">
      {/* Header */}
      <div
        className="section-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-md)',
        }}
      >
        <h4 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          🤖 AI Suggestions
        </h4>
        <span
          style={{
            fontSize: 10,
            fontFamily: 'IBM Plex Mono, monospace',
            color: 'var(--color-text-tertiary)',
          }}
        >
          {suggestions.model}
        </span>
      </div>

      {/* Keywords */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <label
          style={{
            display: 'block',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-sm)',
          }}
        >
          Keywords ({suggestions.keywords.filter(k => approvedKeywordSet.has(k.value)).length}/{suggestions.keywords.length} approved)
        </label>
        
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-xs)',
          }}
        >
          {suggestions.keywords.map((keyword, index) => {
            const isApproved = approvedKeywordSet.has(keyword.value);
            
            return (
              <div
                key={index}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  fontSize: 11,
                  fontFamily: 'IBM Plex Mono, monospace',
                  border: `1px solid ${isApproved ? 'var(--color-success)' : 'var(--color-line-light)'}`,
                  background: isApproved ? 'var(--color-success-light)' : 'var(--color-bg-surface)',
                  color: isApproved ? 'var(--color-success)' : 'var(--color-text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => {
                  if (isApproved) {
                    onRejectKeyword?.(keyword);
                  } else {
                    onApproveKeyword?.(keyword);
                  }
                }}
                title={`Confidence: ${Math.round(keyword.confidence * 100)}%`}
              >
                <span>{keyword.value}</span>
                {isApproved ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Alt Text */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <label
          style={{
            display: 'block',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-sm)',
          }}
        >
          Suggested Alt Text
          <span
            style={{
              marginLeft: 'var(--space-sm)',
              fontSize: 9,
              padding: '2px 4px',
              background: 'var(--color-accent-light)',
              color: 'var(--color-accent)',
              borderRadius: 2,
            }}
          >
            SEO
          </span>
        </label>
        
        {!editingAltText ? (
          <div
            style={{
              padding: 'var(--space-sm)',
              background: suggestions.altText.approved 
                ? 'var(--color-success-light)' 
                : 'var(--color-bg)',
              border: `1px solid ${suggestions.altText.approved ? 'var(--color-success)' : 'var(--color-line-light)'}`,
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            {suggestions.altText.value}
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-sm)',
                marginTop: 'var(--space-sm)',
              }}
            >
              <button
                className="btn btn-sm"
                onClick={() => {
                  setAltTextValue(suggestions.altText.value);
                  setEditingAltText(true);
                }}
              >
                Edit
              </button>
              {!suggestions.altText.approved && (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => onApproveAltText?.(suggestions.altText.value)}
                >
                  Approve
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <textarea
              className="input"
              value={altTextValue}
              onChange={(e) => setAltTextValue(e.target.value)}
              rows={3}
              style={{ resize: 'vertical' }}
            />
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-sm)',
                marginTop: 'var(--space-sm)',
              }}
            >
              <button
                className="btn btn-sm"
                onClick={() => {
                  setEditingAltText(false);
                  setAltTextValue(suggestions.altText.value);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  onApproveAltText?.(altTextValue);
                  setEditingAltText(false);
                }}
              >
                Save & Approve
              </button>
            </div>
          </div>
        )}
        
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 'var(--space-xs)',
            fontSize: 9,
            color: 'var(--color-text-tertiary)',
          }}
        >
          <span>{suggestions.altText.value.length} characters</span>
          <span>Confidence: {Math.round(suggestions.altText.confidence * 100)}%</span>
        </div>
      </div>

      {/* Caption */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <label
          style={{
            display: 'block',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-sm)',
          }}
        >
          Suggested Caption
        </label>
        
        <div
          style={{
            padding: 'var(--space-sm)',
            background: suggestions.caption.approved 
              ? 'var(--color-success-light)' 
              : 'var(--color-bg)',
            border: `1px solid ${suggestions.caption.approved ? 'var(--color-success)' : 'var(--color-line-light)'}`,
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          {suggestions.caption.value}
          
          {!suggestions.caption.approved && (
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-sm)',
                marginTop: 'var(--space-sm)',
              }}
            >
              <button className="btn btn-sm">Edit</button>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => onApproveCaption?.(suggestions.caption.value)}
              >
                Approve
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Story Context */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <label
          style={{
            display: 'block',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-sm)',
          }}
        >
          Suggested Story Context
        </label>
        
        <div
          style={{
            padding: 'var(--space-sm)',
            background: suggestions.storyContext.approved 
              ? 'var(--color-success-light)' 
              : 'var(--color-bg)',
            border: `1px solid ${suggestions.storyContext.approved ? 'var(--color-success)' : 'var(--color-line-light)'}`,
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          {suggestions.storyContext.value.length > 200 
            ? `${suggestions.storyContext.value.substring(0, 200)}...`
            : suggestions.storyContext.value}
          
          {!suggestions.storyContext.approved && (
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-sm)',
                marginTop: 'var(--space-sm)',
              }}
            >
              <button className="btn btn-sm">Edit</button>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => onApproveStory?.(suggestions.storyContext.value)}
              >
                Approve
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Technical Notes (if available) */}
      {suggestions.technicalAnalysis && (
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <label
            style={{
              display: 'block',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-sm)',
            }}
          >
            Technical Analysis
          </label>
          <div
            style={{
              padding: 'var(--space-sm)',
              fontSize: 11,
              lineHeight: 1.6,
              color: 'var(--color-text-secondary)',
              fontStyle: 'italic',
            }}
          >
            {suggestions.technicalAnalysis}
          </div>
        </div>
      )}

      {/* Bulk Approve */}
      {(!suggestions.altText.approved || !suggestions.caption.approved || !suggestions.storyContext.approved) && (
        <button
          className="btn btn-sm w-full"
          style={{ marginTop: 'var(--space-md)' }}
          onClick={() => {
            onApproveAltText?.(suggestions.altText.value);
            onApproveCaption?.(suggestions.caption.value);
            onApproveStory?.(suggestions.storyContext.value);
            suggestions.keywords.forEach(k => onApproveKeyword?.(k));
          }}
        >
          ✓ Approve All Suggestions
        </button>
      )}
    </div>
  );
};

export default AIBrainSection;
