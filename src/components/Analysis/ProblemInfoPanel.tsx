import React from 'react';
import { ProblemAnalysis } from '../../types/problem';
import { Sparkles, Brain, Clock, HardDrive, ShieldCheck, HelpCircle } from 'lucide-react';

interface ProblemInfoPanelProps {
  analysis: ProblemAnalysis | null;
  isLoading?: boolean;
}

export const ProblemInfoPanel: React.FC<ProblemInfoPanelProps> = ({
  analysis,
  isLoading = false
}) => {
  if (!analysis) return null;

  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return (
          <span
            style={{
              color: 'var(--semantic-success)',
              background: 'var(--semantic-success-bg)',
              padding: '1px 6px',
              borderRadius: '3px',
              fontSize: '10px',
              fontWeight: 600
            }}
          >
            HIGH CONFIDENCE
          </span>
        );
      case 'medium':
        return (
          <span
            style={{
              color: 'var(--accent)',
              background: 'var(--accent-muted)',
              padding: '1px 6px',
              borderRadius: '3px',
              fontSize: '10px',
              fontWeight: 600
            }}
          >
            MEDIUM CONFIDENCE
          </span>
        );
      case 'low':
      default:
        return (
          <span
            style={{
              color: 'var(--text-muted)',
              background: 'var(--bg-elevated)',
              padding: '1px 6px',
              borderRadius: '3px',
              fontSize: '10px',
              fontWeight: 600
            }}
          >
            LOW CONFIDENCE
          </span>
        );
    }
  };

  const getSourceBadge = (source: string) => {
    if (source === 'ai_gemini') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--semantic-active)' }}>
          <Sparkles size={11} /> Gemini AI
        </span>
      );
    }
    if (source === 'ai_openai') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--semantic-active)' }}>
          <Sparkles size={11} /> OpenAI
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)' }}>
        <Brain size={11} /> Local Heuristic
      </span>
    );
  };

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '10px 14px',
        fontSize: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
            {analysis.problemName}
          </h2>
          {getConfidenceBadge(analysis.confidence)}
        </div>
        <div style={{ fontSize: '11px' }}>{getSourceBadge(analysis.source)}</div>
      </div>

      <div style={{ color: 'var(--text-secondary)', lineHeight: 1.45, fontSize: '12px' }}>
        {analysis.description}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '2px', fontSize: '11px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Pattern:</span>
          <strong style={{ color: 'var(--text-primary)' }}>{analysis.technique}</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} style={{ color: 'var(--text-muted)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Time:</span>
          <code className="font-mono" style={{ color: 'var(--text-primary)' }}>{analysis.timeComplexity}</code>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <HardDrive size={12} style={{ color: 'var(--text-muted)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Space:</span>
          <code className="font-mono" style={{ color: 'var(--text-primary)' }}>{analysis.spaceComplexity}</code>
        </div>
      </div>
    </div>
  );
};

