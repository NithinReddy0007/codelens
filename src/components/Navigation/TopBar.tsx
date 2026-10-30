import React from 'react';
import {
  Play,
  Share2,
  Settings,
  Sun,
  Moon,
  Loader2,
  Code2
} from 'lucide-react';
import { SupportedLanguage } from '../../types/trace';

interface TopBarProps {
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onRun: () => void;
  isRunning: boolean;
  pyodideStatus: { state: string; message?: string };
  onShare: () => void;
  onOpenSettings: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  selectedExample: string;
  onSelectExample: (id: string) => void;
  examples: Array<{ id: string; title: string; language: SupportedLanguage }>;
}

export const TopBar: React.FC<TopBarProps> = ({
  language,
  onLanguageChange,
  onRun,
  isRunning,
  pyodideStatus,
  onShare,
  onOpenSettings,
  theme,
  onToggleTheme,
  selectedExample,
  onSelectExample,
  examples
}) => {
  return (
    <header className="top-bar">
      {/* Brand / Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 700,
            fontSize: '14px',
            letterSpacing: '-0.02em'
          }}
        >
          <Code2 size={18} color="var(--accent)" />
          <span>CodeLens</span>
        </div>
        <span
          style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            borderLeft: '1px solid var(--border-subtle)',
            paddingLeft: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}
        >
          Tracer
        </span>
      </div>

      {/* Language & Examples Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Language:</label>
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
            style={{ fontSize: '12px' }}
          >
            <option value="python">Python</option>
            <option value="java">Java (in-browser)</option>
            <option value="cpp">C++ (in-browser)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Examples:</label>
          <select
            value={selectedExample}
            onChange={(e) => onSelectExample(e.target.value)}
            style={{ fontSize: '12px', maxWidth: '170px' }}
          >
            <option value="">Load an example...</option>
            {examples.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title} [{ex.language.toUpperCase()}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {pyodideStatus.state === 'loading' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: 'var(--accent)'
            }}
          >
            <Loader2 size={12} className="animate-spin" />
            <span>Pyodide loading...</span>
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          className="primary"
          onClick={onRun}
          disabled={isRunning}
          style={{ minWidth: '85px', height: '28px' }}
          title="Record execution trace"
        >
          {isRunning ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span>Tracing</span>
            </>
          ) : (
            <>
              <Play size={13} fill="currentColor" />
              <span>Run</span>
            </>
          )}
        </button>

        <button onClick={onShare} title="Copy shareable permalink" style={{ height: '28px' }}>
          <Share2 size={13} />
          <span>Share</span>
        </button>

        <button onClick={onOpenSettings} title="Settings & API Key" style={{ height: '28px' }}>
          <Settings size={13} />
        </button>

        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{ height: '28px', padding: '4px 8px' }}
        >
          {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
        </button>
      </div>
    </header>
  );
};
