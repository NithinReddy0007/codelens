import React from 'react';
import { StructureInfo, CellMark, CellMarkKind } from '../../types/trace';

interface MatrixRendererProps {
  structure: StructureInfo;
  isReducedMotion?: boolean;
}

interface KindStyle {
  color: string;
  badge: string;
  text: string;
  priority: number;
  solid?: boolean;
}

const KIND_STYLE: Record<CellMarkKind, KindStyle> = {
  hit: { color: '#ef4444', badge: '✕', text: 'Condition true on this cell', priority: 7, solid: true },
  place: { color: '#22c55e', badge: '+', text: 'About to place (write non-zero)', priority: 6 },
  remove: { color: '#f97316', badge: '−', text: 'About to clear (backtrack)', priority: 6 },
  write: { color: '#14b8a6', badge: '✎', text: 'About to write', priority: 5 },
  placed: { color: '#22c55e', badge: '✓', text: 'Just placed', priority: 4, solid: true },
  removed: { color: '#f97316', badge: '↩', text: 'Just removed (backtracked)', priority: 4, solid: true },
  read: { color: '#3b82f6', badge: '?', text: 'Being checked / read', priority: 3 },
  cursor: { color: '#a855f7', badge: '▶', text: 'Current position (row, col)', priority: 1 }
};

const CELL = 40;

export const MatrixRenderer: React.FC<MatrixRendererProps> = ({
  structure,
  isReducedMotion = false
}) => {
  const matrix = Array.isArray(structure.data) ? structure.data : [];

  if (matrix.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Empty Matrix</div>;
  }

  const numCols = Array.isArray(matrix[0]) ? matrix[0].length : 0;
  const marks: CellMark[] = structure.marks || [];
  const rowNames = structure.axis?.row || {};
  const colNames = structure.axis?.col || {};

  const byCell = new Map<string, CellMark[]>();
  for (const m of marks) {
    const key = `${m.r},${m.c}`;
    const arr = byCell.get(key);
    if (arr) arr.push(m);
    else byCell.set(key, [m]);
  }
  const presentKinds = Array.from(new Set(marks.map((m) => m.kind))).sort(
    (a, b) => KIND_STYLE[b].priority - KIND_STYLE[a].priority
  );

  const headerBase: React.CSSProperties = {
    textAlign: 'center',
    fontSize: '10px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)'
  };

  const chip = (name: string) => (
    <span
      style={{
        display: 'inline-block',
        padding: '0 4px',
        borderRadius: '8px',
        background: '#a855f7',
        color: '#fff',
        fontWeight: 700,
        fontSize: '10px',
        lineHeight: '14px'
      }}
    >
      {name}
    </span>
  );

  return (
    <div style={{ display: 'inline-block', overflowX: 'auto', padding: '6px' }}>
      {/* Column Headers */}
      <div style={{ display: 'flex', marginLeft: '72px', gap: '4px', marginBottom: '4px' }}>
        {Array.from({ length: numCols }).map((_, cIdx) => {
          const name = colNames[String(cIdx)];
          return (
            <div key={cIdx} style={{ ...headerBase, width: `${CELL}px`, height: '30px', color: name ? '#a855f7' : headerBase.color, fontWeight: name ? 700 : 400 }}>
              <div>[{cIdx}]</div>
              <div style={{ height: '14px' }}>{name ? chip(name) : null}</div>
            </div>
          );
        })}
      </div>

      {/* Rows */}
      {matrix.map((row: any[], rIdx: number) => {
        const rName = rowNames[String(rIdx)];
        return (
          <div key={rIdx} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
            <div
              style={{
                ...headerBase,
                width: '68px',
                textAlign: 'right',
                color: rName ? '#a855f7' : headerBase.color,
                fontWeight: rName ? 700 : 400,
                paddingRight: '2px'
              }}
            >
              {rName ? <>{chip(rName)} </> : null}[{rIdx}]
            </div>

            {row.map((cell: any, cIdx: number) => {
              const cellMarks = byCell.get(`${rIdx},${cIdx}`) || [];
              const sorted = [...cellMarks].sort((a, b) => KIND_STYLE[b.kind].priority - KIND_STYLE[a.kind].priority);
              const primary = sorted[0];
              const ps = primary ? KIND_STYLE[primary.kind] : null;
              const hasCursor = cellMarks.some((m) => m.kind === 'cursor');
              const tooltip = sorted.map((m) => `${KIND_STYLE[m.kind].text}: ${m.label}`).join('\n');

              return (
                <div
                  key={cIdx}
                  title={tooltip || undefined}
                  style={{
                    position: 'relative',
                    width: `${CELL}px`,
                    height: `${CELL}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: ps ? (ps.solid ? ps.color : `${ps.color}33`) : 'var(--bg-tertiary)',
                    border: ps ? `2px solid ${ps.color}` : '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: ps && ps.priority >= 4 ? `0 0 8px ${ps.color}` : 'none',
                    outline: hasCursor && primary && primary.kind !== 'cursor' ? '2px dashed #a855f7' : 'none',
                    outlineOffset: '2px',
                    boxSizing: 'border-box',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: ps && ps.solid ? '#fff' : 'var(--text-primary)',
                    transition: isReducedMotion ? 'none' : 'background 200ms ease, box-shadow 200ms ease'
                  }}
                >
                  {cell !== null && cell !== undefined ? String(cell) : '—'}
                  {ps && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-7px',
                        right: '-5px',
                        minWidth: '14px',
                        height: '14px',
                        borderRadius: '7px',
                        background: ps.color,
                        color: '#fff',
                        fontSize: '9px',
                        lineHeight: '14px',
                        textAlign: 'center',
                        fontWeight: 700
                      }}
                    >
                      {ps.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Legend: only what is active on this step */}
      {presentKinds.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', marginTop: '8px', fontSize: '10px', color: 'var(--text-secondary, var(--text-muted))' }}>
          {presentKinds.map((k) => (
            <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: KIND_STYLE[k].color, color: '#fff', fontSize: '8px', lineHeight: '12px', textAlign: 'center', fontWeight: 700 }}>
                {KIND_STYLE[k].badge}
              </span>
              {KIND_STYLE[k].text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
