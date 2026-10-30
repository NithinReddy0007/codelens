import React, { useState } from 'react';
import { TestCase } from '../../types/testCase';
import { Check, X, AlertCircle, Plus, Edit2 } from 'lucide-react';

interface TestCaseSelectorProps {
  testCases: TestCase[];
  selectedCaseId: string;
  onSelectCase: (caseId: string) => void;
  onAddCase: (testCase: TestCase) => void;
  onUpdateCase: (updated: TestCase) => void;
}

export const TestCaseSelector: React.FC<TestCaseSelectorProps> = ({
  testCases,
  selectedCaseId,
  onSelectCase,
  onAddCase,
  onUpdateCase
}) => {
  const [editingCase, setEditingCase] = useState<TestCase | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('Custom Case');
  const [newArgsText, setNewArgsText] = useState('[]');

  const handleCreateCase = () => {
    try {
      const parsedArgs = JSON.parse(newArgsText);
      const newCase: TestCase = {
        id: 'case_' + Date.now(),
        label: newLabel || 'Custom Case',
        inputs: {},
        args: Array.isArray(parsedArgs) ? parsedArgs : [parsedArgs],
        hasExpected: false,
        status: 'untested'
      };
      onAddCase(newCase);
      setIsAdding(false);
      setNewArgsText('[]');
      onSelectCase(newCase.id);
    } catch (e: any) {
      alert('Invalid JSON in arguments: ' + e.message);
    }
  };

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'passed':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              color: 'var(--semantic-success)',
              background: 'var(--semantic-success-bg)',
              padding: '1px 5px',
              borderRadius: '3px',
              fontSize: '10px',
              fontWeight: 600
            }}
          >
            <Check size={10} /> PASS
          </span>
        );
      case 'failed':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              color: 'var(--semantic-error)',
              background: 'var(--semantic-error-bg)',
              padding: '1px 5px',
              borderRadius: '3px',
              fontSize: '10px',
              fontWeight: 600
            }}
          >
            <X size={10} /> FAIL
          </span>
        );
      case 'error':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              color: 'var(--semantic-error)',
              background: 'var(--semantic-error-bg)',
              padding: '1px 5px',
              borderRadius: '3px',
              fontSize: '10px',
              fontWeight: 600
            }}
          >
            <AlertCircle size={10} /> ERR
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 12px',
        gap: '8px',
        overflowX: 'auto',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)'
      }}
    >
      <span
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          flexShrink: 0
        }}
      >
        Test Cases:
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, overflowX: 'auto' }}>
        {testCases.map((tc, idx) => {
          const isSelected = tc.id === selectedCaseId;
          const inputPreview = tc.args && tc.args.length > 0
            ? tc.args.map(a => JSON.stringify(a)).join(', ')
            : '[]';
          const expectedPreview = tc.hasExpected ? JSON.stringify(tc.expectedOutput) : null;

          return (
            <button
              key={tc.id}
              onClick={() => onSelectCase(tc.id)}
              style={{
                background: isSelected ? 'var(--bg-elevated)' : 'var(--bg-tertiary)',
                borderColor: isSelected ? 'var(--accent)' : 'var(--border-subtle)',
                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                padding: '4px 10px',
                fontSize: '11px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '2px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                <span style={{ fontWeight: 600 }}>{tc.label || `Case ${idx + 1}`}</span>
                {renderStatusBadge(tc.status)}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: isSelected ? 'var(--text-secondary)' : 'var(--text-muted)',
                  display: 'flex',
                  gap: '6px'
                }}
              >
                <span>in: {inputPreview.length > 20 ? inputPreview.slice(0, 18) + '…' : inputPreview}</span>
                {expectedPreview !== null && (
                  <span>exp: {expectedPreview.length > 15 ? expectedPreview.slice(0, 13) + '…' : expectedPreview}</span>
                )}
              </div>
            </button>
          );
        })}

        <button
          onClick={() => setIsAdding(true)}
          style={{
            padding: '3px 8px',
            fontSize: '11px',
            flexShrink: 0,
            borderStyle: 'dashed'
          }}
          title="Add custom test case"
        >
          <Plus size={11} />
          <span>Add Case</span>
        </button>
      </div>

      {isAdding && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              width: '360px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <h3 style={{ fontSize: '13px', fontWeight: 600 }}>Add Custom Test Case</h3>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Case Label:
              </label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 8px'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Arguments JSON (array of arguments):
              </label>
              <textarea
                value={newArgsText}
                onChange={(e) => setNewArgsText(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px'
                }}
                placeholder='e.g. [[2, 7, 11, 15], 9]'
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setIsAdding(false)}>Cancel</button>
              <button className="primary" onClick={handleCreateCase}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

