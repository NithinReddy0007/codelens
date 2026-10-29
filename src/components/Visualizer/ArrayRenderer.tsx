import React from 'react';
import { StructureInfo } from '../../types/trace';

interface ArrayRendererProps {
  structure: StructureInfo;
  previousData?: any[];
  isReducedMotion?: boolean;
}

const CELL_WIDTH = 48; // px
const CELL_GAP = 6; // px

export const ArrayRenderer: React.FC<ArrayRendererProps> = ({
  structure,
  previousData,
  isReducedMotion = false
}) => {
  const data = Array.isArray(structure.data) ? structure.data : [];
  const pointers = structure.pointers || {};
  const highlighted = structure.highlighted || [];

  // Group pointers by index
  const pointersByIndex: Record<number, string[]> = {};
  for (const [pName, pIdx] of Object.entries(pointers)) {
    const idx = Number(pIdx);
    if (!isNaN(idx)) {
      if (!pointersByIndex[idx]) pointersByIndex[idx] = [];
      pointersByIndex[idx].push(pName);
    }
  }

  // Find max stack of pointers to give enough top spacing
  const maxPointerStack = Math.max(
    1,
    ...Object.values(pointersByIndex).map((arr) => arr.length)
  );
  const pointerAreaHeight = maxPointerStack * 20 + 8;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        padding: '8px 4px',
        overflowX: 'auto',
        maxWidth: '100%'
      }}
    >
      {/* Pointer labels area */}
      <div
        style={{
          height: `${pointerAreaHeight}px`,
          position: 'relative',
          marginBottom: '4px'
        }}
      >
        {Object.entries(pointersByIndex).map(([idxStr, ptrNames]) => {
          const idx = parseInt(idxStr, 10);
          const isOOB = idx < 0 || idx >= data.length;
          const leftPx = isOOB
            ? Math.max(0, Math.min(data.length * (CELL_WIDTH + CELL_GAP), idx * (CELL_WIDTH + CELL_GAP)))
            : idx * (CELL_WIDTH + CELL_GAP);

          return (
            <div
              key={idxStr}
              style={{
                position: 'absolute',
                left: `${leftPx}px`,
                width: `${CELL_WIDTH}px`,
                bottom: '2px',
                display: 'flex',
                flexDirection: 'column-reverse',
                alignItems: 'center',
                gap: '2px',
                transition: isReducedMotion ? 'none' : 'left 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                zIndex: 5
              }}
            >
              {/* Pointer arrow pointing down to cell */}
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderTop: isOOB ? '5px solid var(--semantic-error)' : '5px solid var(--semantic-active)'
                }}
              />
              {/* Stacked pointer label pills */}
              {ptrNames.map((name) => (
                <span
                  key={name}
                  style={{
                    background: isOOB ? 'var(--semantic-error)' : 'var(--semantic-active)',
                    color: isOOB ? '#ffffff' : '#0f172a',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    fontSize: '10px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    lineHeight: 1.2,
                    boxShadow: isOOB ? '0 0 6px rgba(239, 68, 68, 0.6)' : '0 1px 2px rgba(0,0,0,0.2)'
                  }}
                  title={isOOB ? `${name} = ${idx} (Out of Bounds!)` : `${name} = ${idx}`}
                >
                  {isOOB ? `⚠ ${name}[${idx}]` : name}
                </span>
              ))}
            </div>
          );
        })}
      </div>

      {/* Cells Row */}
      <div style={{ display: 'flex', gap: `${CELL_GAP}px`, position: 'relative' }}>
        {data.map((val: any, idx: number) => {
          const isHighlighted = highlighted.includes(idx);
          const hasPointers = Boolean(pointersByIndex[idx]);

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: `${CELL_WIDTH}px`,
                flexShrink: 0
              }}
            >
              <div
                style={{
                  width: `${CELL_WIDTH}px`,
                  height: `${CELL_WIDTH}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isHighlighted
                    ? 'var(--semantic-changed-bg)'
                    : hasPointers
                    ? 'var(--bg-elevated)'
                    : 'var(--bg-tertiary)',
                  border: isHighlighted
                    ? '2px solid var(--semantic-changed)'
                    : hasPointers
                    ? '1.5px solid var(--semantic-active)'
                    : '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: isHighlighted ? 'var(--semantic-changed)' : 'var(--text-primary)',
                  transition: isReducedMotion ? 'none' : 'all 200ms ease-out',
                  transform: isHighlighted && !isReducedMotion ? 'scale(1.04)' : 'scale(1)',
                  boxShadow: isHighlighted ? '0 0 8px rgba(234, 179, 8, 0.25)' : 'none'
                }}
              >
                {val !== null && val !== undefined ? String(val) : '—'}
              </div>

              {/* Index label */}
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '4px'
                }}
              >
                {idx}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
