import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Gauge,
  FastForward
} from 'lucide-react';

interface PlaybackControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  onPlayPause: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onRestart: () => void;
  onSeek: (step: number) => void;
  onSpeedChange: (speed: number) => void;
  variables: string[];
  selectedVarJump: string;
  onVarJumpSelect: (varName: string) => void;
  onJumpNextChange: () => void;
  onJumpPrevChange: () => void;
  disabled?: boolean;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  currentStep,
  totalSteps,
  isPlaying,
  speed,
  onPlayPause,
  onStepForward,
  onStepBack,
  onRestart,
  onSeek,
  onSpeedChange,
  variables,
  selectedVarJump,
  onVarJumpSelect,
  onJumpNextChange,
  onJumpPrevChange,
  disabled = false
}) => {
  const speeds = [0.25, 0.5, 1, 2, 4];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        gap: '12px',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '12px'
      }}
    >
      {/* Left: Transport buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={onRestart}
          disabled={disabled || totalSteps === 0 || currentStep === 0}
          title="Restart (Home)"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>

        <button
          onClick={onStepBack}
          disabled={disabled || totalSteps === 0 || currentStep <= 0}
          title="Step Back (Left Arrow)"
        >
          <SkipBack size={14} />
          <span>Back</span>
        </button>

        <button
          className="primary"
          onClick={onPlayPause}
          disabled={disabled || totalSteps === 0}
          title="Play / Pause (Space)"
          style={{ minWidth: '78px' }}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        <button
          onClick={onStepForward}
          disabled={disabled || totalSteps === 0 || currentStep >= totalSteps - 1}
          title="Step Forward (Right Arrow)"
        >
          <SkipForward size={14} />
          <span>Step</span>
        </button>
      </div>

      {/* Middle: Scrubber slider and step counter */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          maxWidth: '460px'
        }}
      >
        <span
          className="font-mono tabular-nums"
          style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            minWidth: '95px',
            textAlign: 'right'
          }}
        >
          {totalSteps > 0
            ? `Step ${currentStep + 1} / ${totalSteps}`
            : '0 / 0 steps'}
        </span>

        <input
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={totalSteps > 0 ? currentStep : 0}
          disabled={disabled || totalSteps === 0}
          onChange={(e) => onSeek(parseInt(e.target.value, 10))}
          style={{
            flex: 1,
            cursor: totalSteps > 0 ? 'pointer' : 'default',
            accentColor: 'var(--accent)'
          }}
        />
      </div>

      {/* Right: Variable Jump & Speed */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {variables.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Jump on:</span>
            <select
              value={selectedVarJump}
              onChange={(e) => onVarJumpSelect(e.target.value)}
              style={{ fontSize: '11px', padding: '2px 6px' }}
            >
              <option value="">(any variable)</option>
              {variables.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <button
              onClick={onJumpPrevChange}
              disabled={disabled || totalSteps === 0 || currentStep <= 0}
              title="Jump to previous change"
              style={{ padding: '2px 6px' }}
            >
              &lt;
            </button>
            <button
              onClick={onJumpNextChange}
              disabled={disabled || totalSteps === 0 || currentStep >= totalSteps - 1}
              title="Jump to next change"
              style={{ padding: '2px 6px' }}
            >
              &gt;
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Gauge size={13} style={{ color: 'var(--text-muted)' }} />
          <select
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            style={{ fontSize: '11px', padding: '2px 6px' }}
          >
            {speeds.map((s) => (
              <option key={s} value={s}>
                {s}x
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

