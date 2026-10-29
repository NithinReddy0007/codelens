import React, { useState } from 'react';
import { Key, Shield, X, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey
}) => {
  const [keyInput, setKeyInput] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(keyInput.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200
      }}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-md)',
          width: '440px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
            <Key size={16} color="var(--accent)" />
            <span>Settings & Optional AI Key</span>
          </div>
          <button onClick={onClose} style={{ padding: '4px', border: 'none', background: 'transparent' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          CodeLens includes full built-in offline heuristics for ~60 algorithmic problems and automatic test generation.
          An AI key is strictly optional for supplemental explanations and creative test edge cases.
        </div>

        <div
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '11px',
            color: 'var(--text-muted)'
          }}
        >
          <Shield size={16} color="var(--semantic-active)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            Privacy guarantee: Your key is stored in your browser's <code>localStorage</code> only. It is never transmitted to any third-party server or telemetry.
          </span>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>
            Gemini or OpenAI API Key:
          </label>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="AIzaSy... or sk-..."
            style={{
              width: '100%',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 10px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={handleSave}>
            {saved ? (
              <>
                <Check size={14} /> Saved
              </>
            ) : (
              'Save Key'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

