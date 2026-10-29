import React from 'react';
import { StructureInfo } from '../../types/trace';

interface MatrixRendererProps {
  structure: StructureInfo;
  isReducedMotion?: boolean;
}

export const MatrixRenderer: React.FC<MatrixRendererProps> = ({
  structure,
  isReducedMotion = false
}) => {
  const matrix = Array.isArray(structure.data) ? structure.data : [];

  if (matrix.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Empty Matrix</div>;
  }

  const numCols = Array.isArray(matrix[0]) ? matrix[0].length : 0;

  return (
    <div style={{ display: 'inline-block', overflowX: 'auto', padding: '6px' }}>
      {/* Column Headers */}
      <div style={{ display: 'flex', marginLeft: '32px', gap: '4px', marginBottom: '4px' }}>
        {Array.from({ length: numCols }).map((_, cIdx) => (
          <div
            key={cIdx}
            style={{
              width: '40px',
              textAlign: 'center',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)'
            }}
          >
            [{cIdx}]
          </div>
        ))}
      </div>

      {/* Rows */}
      {matrix.map((row: any[], rIdx: number) => (
        <div key={rIdx} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
          {/* Row Header */}
          <div
            style={{
              width: '28px',
              textAlign: 'right',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)'
            }}
          >
            [{rIdx}]
          </div>

          {/* Row Cells */}
          {row.map((cell: any, cIdx: number) => {
            return (
              <div
                key={cIdx}
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  transition: isReducedMotion ? 'none' : 'background 200ms ease'
                }}
              >
                {cell !== null && cell !== undefined ? String(cell) : '—'}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

