import React from 'react';
import { TraceStep } from '../../types/trace';
import { Layers, CornerDownRight, Variable } from 'lucide-react';

interface CallStackRendererProps {
  currentStepData?: TraceStep | null;
}

export const CallStackRenderer: React.FC<CallStackRendererProps> = ({ currentStepData }) => {
  const frames = currentStepData?.callStack && currentStepData.callStack.length > 0
    ? currentStepData.callStack
    : [
        {
          name: currentStepData?.frame || '<main>',
          line: currentStepData?.line || 1,
          params: undefined,
          variables: currentStepData?.vars
            ? Object.fromEntries(Object.entries(currentStepData.vars).map(([k, v]) => [k, v.value]))
            : {}
        }
      ];

  const activeDepth = frames.length;
  const isReturn = currentStepData?.event === 'return';

  return (
    <div style={{ padding: '8px 12px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--text-muted)',
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Layers size={12} color="var(--accent)" />
          <span>Call Stack ({activeDepth} active {activeDepth === 1 ? 'frame' : 'frames'})</span>
        </span>
      </div>

      {/* Stack Frames: bottom of stack at bottom, topmost (active) on top */}
      <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '6px' }}>
        {frames.map((frame, idx) => {
          const isTop = idx === frames.length - 1;
          const paramEntries = frame.params ? Object.entries(frame.params) : [];
          const varEntries = frame.variables
            ? Object.entries(frame.variables).filter(([k]) => !frame.params || !(k in frame.params))
            : [];

          return (
            <div
              key={`${frame.name}_${idx}`}
              style={{
                background: isTop ? 'var(--bg-elevated)' : 'var(--bg-tertiary)',
                border: isTop ? '1.5px solid var(--accent)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                transition: 'all 200ms ease',
                boxShadow: isTop ? '0 2px 6px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              {/* Header: Function Name + Line */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: isTop ? 700 : 500 }}>
                  <span style={{ color: isTop ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {isTop ? '▶' : '•'}
                  </span>
                  <span style={{ color: isTop ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {frame.name}
                  </span>
                  {paramEntries.length > 0 && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                      ({paramEntries.map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ')})
                    </span>
                  )}
                </span>
                <span
                  style={{
                    color: isTop ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '1px 5px',
                    background: isTop ? 'var(--accent-muted)' : 'transparent',
                    borderRadius: '3px'
                  }}
                >
                  line {frame.line}
                </span>
              </div>

              {/* Local Variables within frame */}
              {varEntries.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    paddingTop: '2px',
                    borderTop: '1px dashed var(--border-subtle)',
                    fontSize: '10px'
                  }}
                >
                  {varEntries.slice(0, 6).map(([k, v]) => (
                    <span
                      key={k}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        padding: '1px 4px',
                        borderRadius: '2px',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>{k}:</span>{' '}
                      <span style={{ color: 'var(--text-primary)' }}>{JSON.stringify(v)}</span>
                    </span>
                  ))}
                  {varEntries.length > 6 && (
                    <span style={{ color: 'var(--text-muted)' }}>+{varEntries.length - 6} more</span>
                  )}
                </div>
              )}
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
            border: '1px solid rgba(34, 197, 94, 0.3)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <CornerDownRight size={11} />
          <span>Returning from {frames[frames.length - 1]?.name || '<main>'}</span>
        </div>
      )}
    </div>
  );
};
