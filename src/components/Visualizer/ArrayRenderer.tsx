import React from 'react';
import { StructureInfo } from '../../types/trace';

interface ArrayRendererProps {
  structure: StructureInfo;
  previousData?: any[];
  isReducedMotion?: boolean;
}

const CELL_WIDTH = 48; // px
const CELL_GAP = 6; // px

const POINTER_COLORS = [
  { bg: '#38bdf8', text: '#0284c7', border: '#0284c7', cellBg: 'rgba(56, 189, 248, 0.18)', cellBorder: '#38bdf8' }, // sky/blue
  { bg: '#f43f5e', text: '#e11d48', border: '#e11d48', cellBg: 'rgba(244, 63, 94, 0.18)', cellBorder: '#f43f5e' }, // rose/red
  { bg: '#10b981', text: '#059669', border: '#059669', cellBg: 'rgba(16, 185, 129, 0.18)', cellBorder: '#10b981' }, // emerald/green
  { bg: '#a855f7', text: '#9333ea', border: '#9333ea', cellBg: 'rgba(168, 85, 247, 0.18)', cellBorder: '#a855f7' }, // purple
  { bg: '#f59e0b', text: '#d97706', border: '#d97706', cellBg: 'rgba(245, 158, 11, 0.18)', cellBorder: '#f59e0b' }, // amber/yellow
  { bg: '#06b6d4', text: '#0891b2', border: '#0891b2', cellBg: 'rgba(6, 182, 212, 0.18)', cellBorder: '#06b6d4' }  // cyan
];

function getPointerColor(name: string, index: number) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
  }
  const colorIdx = Math.abs(hash) % POINTER_COLORS.length;
  return POINTER_COLORS[colorIdx];
}

export const ArrayRenderer: React.FC<ArrayRendererProps> = ({
  structure,
  previousData,
  isReducedMotion = false
}) => {
  const data = Array.isArray(structure.data) ? structure.data : [];
  const pointers = structure.pointers || {};
  const highlighted = structure.highlighted || [];

  // Group pointers by index
  const pointersByIndex: Record<number, Array<{ name: string; idx: number; color: typeof POINTER_COLORS[0] }>> = {};
  const pointerEntries = Object.entries(pointers);
  pointerEntries.forEach(([pName, pIdx], i) => {
    const idx = Number(pIdx);
    if (!isNaN(idx)) {
      if (!pointersByIndex[idx]) pointersByIndex[idx] = [];
      pointersByIndex[idx].push({
        name: pName,
        idx,
        color: getPointerColor(pName, i)
      });
    }
  });

  // Find max stack of pointers to give enough top spacing
  const maxPointerStack = Math.max(
    1,
    ...Object.values(pointersByIndex).map((arr) => arr.length)
  );
  const pointerAreaHeight = maxPointerStack * 22 + 8;

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
        {Object.entries(pointersByIndex).map(([idxStr, ptrItems]) => {
          const idx = parseInt(idxStr, 10);
          const isOOB = idx < 0 || idx >= data.length;
          const leftPx = isOOB
            ? Math.max(0, Math.min(data.length * (CELL_WIDTH + CELL_GAP), idx * (CELL_WIDTH + CELL_GAP)))
            : idx * (CELL_WIDTH + CELL_GAP);

          const primaryColor = ptrItems[0]?.color || POINTER_COLORS[0];

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
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: isOOB
                    ? '6px solid var(--semantic-error)'
                    : `6px solid ${primaryColor.bg}`
                }}
              />
              {/* Stacked pointer label pills */}
              {ptrItems.map(({ name, color }) => (
                <span
                  key={name}
                  style={{
                    background: isOOB ? 'var(--semantic-error)' : color.bg,
                    color: isOOB ? '#ffffff' : '#0f172a',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    lineHeight: 1.2,
                    boxShadow: isOOB
                      ? '0 0 6px rgba(239, 68, 68, 0.6)'
                      : `0 2px 4px rgba(0,0,0,0.25), 0 0 8px ${color.bg}88}`,
                    border: `1px solid ${isOOB ? '#dc2626' : color.border}`
                  }}
                  title={isOOB ? `${name} = ${idx} (Out of Bounds!)` : `${name} = ${idx}`}
                >
                  {isOOB ? `⚠ ${name}[${idx}]` : `${name}[${idx}]`}
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
          const activePointers = pointersByIndex[idx] || [];
          const hasPointers = activePointers.length > 0;
          const firstPointer = activePointers[0];

          let bg = 'var(--bg-tertiary)';
          let border = '1px solid var(--border-strong)';
          let color = 'var(--text-primary)';
          let boxShadow = 'none';

          if (isHighlighted && hasPointers && firstPointer) {
            bg = firstPointer.color.cellBg;
            border = `2.5px solid ${firstPointer.color.cellBorder}`;
            color = firstPointer.color.bg;
            boxShadow = `0 0 12px ${firstPointer.color.cellBorder}88`;
          } else if (hasPointers && firstPointer) {
            bg = firstPointer.color.cellBg;
            border = `2px solid ${firstPointer.color.cellBorder}`;
            color = 'var(--text-primary)';
            boxShadow = `0 0 8px ${firstPointer.color.cellBorder}55`;
          } else if (isHighlighted) {
            bg = 'var(--semantic-changed-bg)';
            border = '2px solid var(--semantic-changed)';
            color = 'var(--semantic-changed)';
            boxShadow = '0 0 8px rgba(234, 179, 8, 0.35)';
          }

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
                  background: bg,
                  border,
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '13px',
                  color,
                  transition: isReducedMotion ? 'none' : 'all 200ms ease-out',
                  transform: (isHighlighted || hasPointers) && !isReducedMotion ? 'scale(1.05)' : 'scale(1)',
                  boxShadow
                }}
              >
                {val !== null && val !== undefined ? String(val) : '—'}
              </div>

              {/* Index label */}
              <span
                style={{
                  fontSize: '10px',
                  color: hasPointers ? (firstPointer ? firstPointer.color.bg : 'var(--accent)') : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: hasPointers ? 700 : 400,
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
