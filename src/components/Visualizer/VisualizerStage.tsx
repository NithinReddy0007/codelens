import React from 'react';
import { TraceStep, ExecutionResult, StructureInfo } from '../../types/trace';
import { ArrayRenderer } from './ArrayRenderer';
import { MatrixRenderer } from './MatrixRenderer';
import { LinkedListRenderer } from './LinkedListRenderer';
import { TreeRenderer } from './TreeRenderer';
import { VariablesPanel } from './VariablesPanel';
import { CallStackRenderer } from './CallStackRenderer';
import {
  Terminal,
  Layers,
  Database,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCw
} from 'lucide-react';

interface VisualizerStageProps {
  currentStepData?: TraceStep | null;
  previousStepData?: TraceStep | null;
  executionResult?: ExecutionResult | null;
  expectedOutput?: any;
  hasExpected?: boolean;
  isRunning: boolean;
  isReducedMotion?: boolean;
}

export const VisualizerStage: React.FC<VisualizerStageProps> = ({
  currentStepData,
  previousStepData,
  executionResult,
  expectedOutput,
  hasExpected = false,
  isRunning,
  isReducedMotion = false
}) => {
  const error = executionResult?.error;

  const renderStructure = (s: StructureInfo) => {
    switch (s.kind) {
      case 'array':
        return (
          <ArrayRenderer
            structure={s}
            isReducedMotion={isReducedMotion}
          />
        );
      case 'matrix':
        return (
          <MatrixRenderer
            structure={s}
            isReducedMotion={isReducedMotion}
          />
        );
      case 'linkedlist':
        return (
          <LinkedListRenderer
            structure={s}
            isReducedMotion={isReducedMotion}
          />
        );
      case 'tree':
        return <TreeRenderer structure={s} />;
      case 'map':
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {Object.entries(s.data || {}).map(([k, v]) => (
              <div
                key={k}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px'
                }}
              >
                <strong>{k}</strong> : <span>{JSON.stringify(v)}</span>
              </div>
            ))}
          </div>
        );
      case 'set':
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(Array.isArray(s.data) ? s.data : []).map((item, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  padding: '3px 7px',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px'
                }}
              >
                {JSON.stringify(item)}
              </div>
            ))}
          </div>
        );
      default:
        return (
          <pre style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            {JSON.stringify(s.data, null, 2)}
          </pre>
        );
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        background: 'var(--bg-primary)'
      }}
    >
      {/* Top Banner / Event Bar */}
      <div
        style={{
          padding: '8px 12px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          minHeight: '36px',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {currentStepData ? (
            <>
              <span
                style={{
                  background: 'var(--accent-muted)',
                  color: 'var(--accent)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontWeight: 600,
                  fontSize: '11px'
                }}
              >
                Line {currentStepData.line}
              </span>

              <span style={{ color: 'var(--text-secondary)' }}>
                Frame: <strong style={{ color: 'var(--text-primary)' }}>{currentStepData.frame}</strong>
              </span>

              {/* Loop badge */}
              {currentStepData.loop && (
                <span
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-strong)',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '11px',
                    color: 'var(--semantic-active)',
                    fontWeight: 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RotateCw size={11} />
                  <span>Iteration {currentStepData.loop.iteration}</span>
                </span>
              )}

              {/* Branch flash badge */}
              {currentStepData.branch && (
                <span
                  style={{
                    background: currentStepData.branch.result
                      ? 'var(--semantic-success-bg)'
                      : 'var(--semantic-error-bg)',
                    color: currentStepData.branch.result
                      ? 'var(--semantic-success)'
                      : 'var(--semantic-error)',
                    border: currentStepData.branch.result
                      ? '1px solid var(--semantic-success)'
                      : '1px solid var(--semantic-error)',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontWeight: 600,
                    transition: 'all 200ms ease'
                  }}
                >
                  Branch: {currentStepData.branch.condition} →{' '}
                  {currentStepData.branch.result ? 'TRUE' : 'FALSE'}
                </span>
              )}
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>
              {isRunning ? 'Recording trace...' : 'Ready. Click Run or Play to begin execution.'}
            </span>
          )}
        </div>

        {executionResult?.truncated && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--accent)',
              fontSize: '11px',
              fontWeight: 500
            }}
          >
            <AlertTriangle size={13} />
            <span>Execution stopped: step limit reached</span>
          </div>
        )}
      </div>

      {/* Error notification if any */}
      {error && (
        <div
          style={{
            margin: '8px 12px',
            padding: '8px 12px',
            background: 'var(--semantic-error-bg)',
            border: '1px solid var(--semantic-error)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--semantic-error)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '12px',
            flexShrink: 0
          }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 600 }}>
              {error.type || 'Runtime Exception'} (Line {error.line})
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', marginTop: '2px', whiteSpace: 'pre-wrap' }}>
              {error.message}
            </div>
          </div>
        </div>
      )}

      {/* Main visualization grid */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 300px) 1fr',
          gridTemplateRows: '1fr 140px',
          gap: '1px',
          background: 'var(--border-subtle)',
          overflow: 'hidden'
        }}
      >
        {/* Left: Locals & Variables */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div className="section-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={13} />
              <span>Locals & Scope</span>
            </span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            <VariablesPanel
              vars={currentStepData?.vars || {}}
              changed={currentStepData?.changed || []}
              previousVars={previousStepData?.vars}
            />
          </div>
        </div>

        {/* Right: Heap & Data Structures Stage */}
        <div
          style={{
            background: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div className="section-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={13} />
              <span>Heap & Animated Structures</span>
            </span>
          </div>
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {currentStepData && currentStepData.structures.length > 0 ? (
              currentStepData.structures.map((s) => (
                <div
                  key={s.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}
                  >
                    <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {s.id} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({s.kind})</span>
                    </span>
                  </div>

                  {renderStructure(s)}
                </div>
              ))
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '12px'
                }}
              >
                No active data structures in current frame
              </div>
            )}
          </div>
        </div>

        {/* Bottom Left: Call Stack Frame */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            overflowY: 'auto'
          }}
        >
          <CallStackRenderer currentStepData={currentStepData} />
        </div>

        {/* Bottom Right: Stdout & Output / Comparison */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div className="section-header" style={{ height: '24px', fontSize: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Terminal size={12} />
              <span>Standard Output & Return Value</span>
            </span>
          </div>
          <div
            style={{
              flex: 1,
              padding: '8px 12px',
              overflowY: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            {executionResult?.stdout ? (
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                {executionResult.stdout}
              </pre>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>[No stdout output]</span>
            )}

            {executionResult?.returnValue !== undefined && (
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Actual Return:</span>
                  <strong style={{ color: 'var(--semantic-success)' }}>
                    {JSON.stringify(executionResult.returnValue)}
                  </strong>
                </div>

                {hasExpected && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Expected:</span>
                    <code>{JSON.stringify(expectedOutput)}</code>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
