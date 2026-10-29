import React from 'react';
import { TraceStep } from '../../types/trace';
import { Layers } from 'lucide-react';

interface CallStackRendererProps {
  currentStepData?: TraceStep | null;
}

export const CallStackRenderer: React.FC<CallStackRendererProps> = ({ currentStepData }) => {
  const frameName = currentStepData?.frame || '<main>';
  const line = currentStepData?.line || 1;
  const depth = currentStepData?.depth || 0;
  const isReturn = currentStepData?.event === 'return';

  return (
    <div style={{ padding: '8px 12px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--text-muted)',
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Layers size={11} />
          <span>Call Stack (Depth: {depth + 1})</span>
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '4px' }}>
        {Array.from({ length: depth + 1 }).map((_, dIdx) => {
          const isTop = dIdx === depth;
          return (
            <div
              key={dIdx}
              style={{
                background: isTop ? 'var(--bg-elevated)' : 'var(--bg-tertiary)',
                border: isTop ? '1.5px solid var(--accent)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: isTop ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}
            >
              <span>
                {isTop ? '▶ ' : '  '}
                {isTop ? frameName : `frame_${dIdx}`}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                line {isTop ? line : '—'}
              </span>
            </div>
          );
        })}
      </div>

      {isReturn && (
        <div
          style={{
            fontSize: '10px',
            color: 'var(--semantic-success)',
            background: 'var(--semantic-success-bg)',
            padding: '2px 6px',
            borderRadius: '3px',
            fontFamily: 'var(--font-mono)'
          }}
        >
          ↵ Returning from {frameName}
        </div>
      )}
    </div>
  );
};

