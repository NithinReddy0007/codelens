import React, { useRef } from 'react';
import { VariableValue } from '../../types/trace';

interface VariablesPanelProps {
  vars: Record<string, VariableValue>;
  changed: string[];
  previousVars?: Record<string, VariableValue> | null;
}

export const VariablesPanel: React.FC<VariablesPanelProps> = ({
  vars,
  changed,
  previousVars
}) => {
  const varEntries = Object.entries(vars);

  if (varEntries.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center', marginTop: '20px' }}>
        No active local variables
      </div>
    );
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
      <thead>
        <tr
          style={{
            borderBottom: '1px solid var(--border-subtle)',
            textAlign: 'left',
            color: 'var(--text-muted)',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}
        >
          <th style={{ padding: '4px 6px' }}>Name</th>
          <th style={{ padding: '4px 6px' }}>Type</th>
          <th style={{ padding: '4px 6px' }}>Value</th>
        </tr>
      </thead>
      <tbody>
        {varEntries.map(([name, info]) => {
          const isChanged = changed.includes(name);
          const oldVal = previousVars ? previousVars[name]?.raw : null;
          const currVal = info.raw || JSON.stringify(info.value);

          return (
            <tr
              key={name}
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: isChanged ? 'var(--semantic-changed-bg)' : 'transparent',
                transition: 'background 250ms ease'
              }}
            >
              <td
                style={{
                  padding: '5px 6px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  color: isChanged ? 'var(--semantic-changed)' : 'var(--text-primary)'
                }}
              >
                {name}
              </td>
              <td
                style={{
                  padding: '5px 6px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px'
                }}
              >
                {info.type}
              </td>
              <td
                className="tabular-nums font-mono"
                style={{
                  padding: '5px 6px',
                  color: isChanged ? 'var(--semantic-changed)' : 'var(--text-primary)',
                  wordBreak: 'break-all'
                }}
              >
                {isChanged && oldVal && oldVal !== currVal ? (
                  <span>
                    <span style={{ textDecoration: 'line-through', opacity: 0.6, marginRight: '4px' }}>
                      {oldVal}
                    </span>
                    <span>→ {currVal}</span>
                  </span>
                ) : (
                  currVal
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

