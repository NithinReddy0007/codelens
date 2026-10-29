import React from 'react';
import { StructureInfo } from '../../types/trace';
import { ArrowRight } from 'lucide-react';

interface LinkedListRendererProps {
  structure: StructureInfo;
  isReducedMotion?: boolean;
}

export const LinkedListRenderer: React.FC<LinkedListRendererProps> = ({
  structure,
  isReducedMotion = false
}) => {
  const nodes = structure.data?.nodes || [];

  if (nodes.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Empty List (null)</div>;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', padding: '12px 4px' }}>
      {nodes.map((node: any, idx: number) => {
        const isCycle = node.id === 'cycle';
        return (
          <React.Fragment key={node.id || idx}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {idx === 0 && (
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    color: 'var(--semantic-active)',
                    textTransform: 'uppercase',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  head
                </span>
              )}
              <div
                style={{
                  minWidth: '44px',
                  height: '44px',
                  padding: '0 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isCycle ? 'var(--semantic-error-bg)' : 'var(--bg-tertiary)',
                  border: isCycle
                    ? '2px solid var(--semantic-error)'
                    : '1.5px solid var(--border-strong)',
                  borderRadius: '22px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: isCycle ? 'var(--semantic-error)' : 'var(--text-primary)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                }}
              >
                {String(node.val)}
              </div>
            </div>

            {idx < nodes.length - 1 && (
              <ArrowRight size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
            )}
          </React.Fragment>
        );
      })}

      <div
        style={{
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          marginLeft: '4px'
        }}
      >
        / null
      </div>
    </div>
  );
};

