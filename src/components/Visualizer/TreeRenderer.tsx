import React from 'react';
import { StructureInfo } from '../../types/trace';

interface TreeRendererProps {
  structure: StructureInfo;
}

export const TreeRenderer: React.FC<TreeRendererProps> = ({ structure }) => {
  const nodes = structure.data?.nodes || [];
  const edges = structure.data?.edges || [];

  if (nodes.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Empty Tree (null)</div>;
  }

  // Calculate layout coordinates for nodes
  // ID is e.g. "0", "0L", "0R", "0LL", "0LR"
  const coords: Record<string, { x: number; y: number }> = {};
  const width = 360;
  const levelHeight = 55;

  for (const node of nodes) {
    const id = node.id;
    const depth = id.length - 1; // root is "0" (depth 0)
    const y = 30 + depth * levelHeight;

    // Horizontal offset based on branch path
    let x = width / 2;
    let span = width / 4;
    for (let i = 1; i < id.length; i++) {
      if (id[i] === 'L') {
        x -= span;
      } else if (id[i] === 'R') {
        x += span;
      }
      span /= 2;
    }
    coords[id] = { x, y };
  }

  const maxY = Math.max(120, ...Object.values(coords).map((c) => c.y + 35));

  return (
    <div style={{ overflowX: 'auto', padding: '6px' }}>
      <svg width={width} height={maxY} style={{ display: 'block', margin: '0 auto' }}>
        {/* Draw edges */}
        {edges.map((edge: { from: string; to: string }, i: number) => {
          const from = coords[edge.from];
          const to = coords[edge.to];
          if (!from || !to) return null;

          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="var(--border-strong)"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Draw nodes */}
        {nodes.map((node: { id: string; val: any }) => {
          const pos = coords[node.id];
          if (!pos) return null;

          return (
            <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
              <circle
                r="16"
                fill="var(--bg-tertiary)"
                stroke="var(--accent)"
                strokeWidth="1.5"
              />
              <text
                textAnchor="middle"
                dy="4"
                fill="var(--text-primary)"
                fontSize="11"
                fontWeight="600"
                fontFamily="var(--font-mono)"
              >
                {String(node.val)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

