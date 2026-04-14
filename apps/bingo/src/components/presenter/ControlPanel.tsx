'use client';

import { useState } from 'react';
import { Button, Modal } from "@hosted-game-night/ui";
import { GameStatus } from '@/types';
import { SaveTemplateModal } from './SaveTemplateModal';

export interface ControlPanelProps {
  isProcessing?: boolean;
  status: GameStatus;
  canCall: boolean;
  canStart: boolean;
  canPause: boolean;
  canResume: boolean;
  canUndo: boolean;
  onStart: () => void;
  onCallBall: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onUndo: () => void;
  /** Whether the reset confirmation dialog is open */
  showResetConfirm?: boolean;
  /** Called when the user confirms the reset */
  onConfirmReset?: () => void;
  /** Called when the user cancels the reset */
  onCancelReset?: () => void;
}

export function ControlPanel({
  isProcessing,
  status,
  canCall,
  canStart,
  canPause,
  canResume,
  canUndo,
  onStart,
  onCallBall,
  onPause,
  onResume,
  onReset,
  onUndo,
  showResetConfirm = false,
  onConfirmReset,
  onCancelReset,
}: ControlPanelProps) {
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-3" role="group" aria-label="Game controls">
        {/* Primary action button */}
        <div className="flex flex-col gap-2" role="group" aria-label="Primary actions">
          {status === 'idle' && (
            <Button
              variant="primary"
              size="lg"
              onClick={onStart}
              disabled={!canStart}
              className="w-full"
            >
              Start Game
            </Button>
          )}

          {(status === 'playing' || status === 'paused') && (
            /* Gradient roll button — blue gradient matching bingo theme */
            <button
              onClick={onCallBall}
              disabled={!canCall || isProcessing}
              data-processing={isProcessing}
              className="
                w-full min-h-[var(--size-touch-xl)] px-6
                rounded-xl font-bold text-xl text-white
                flex items-center justify-center gap-3
                transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed
                focus-visible:outline-2 focus-visible:outline-offset-3
              "
              style={{
                background: (!canCall || isProcessing)
                  ? 'var(--secondary)'
                  : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                boxShadow: (!canCall || isProcessing)
                  ? 'none'
                  : '0 0 20px 4px rgba(126, 82, 228, 0.35), 0 4px 12px rgba(0,0,0,0.4)',
              }}
              aria-label={isProcessing ? 'Calling ball...' : 'Roll next ball (Space)'}
            >
              <span>{isProcessing ? 'Calling...' : 'Roll'}</span>
              <kbd
                className="
                  text-sm font-mono px-2 py-0.5 rounded
                  bg-white/20 text-white/80
                "
                aria-hidden="true"
              >
                Space
              </kbd>
            </button>
          )}
        </div>

        {/* Secondary control buttons */}
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Secondary controls">
          {canPause && (
            <button
              onClick={onPause}
              className="
                min-h-[var(--size-touch)] px-4 rounded-lg
                bg-surface-elevated border border-border
                text-foreground font-medium text-base
                hover:bg-surface-hover transition-colors duration-150
                flex items-center justify-center gap-2
                focus-visible:outline-2 focus-visible:outline-offset-3
              "
              aria-label="Pause game (P)"
            >
              Pause
              <kbd className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted text-foreground-muted" aria-hidden="true">P</kbd>
            </button>
          )}

          {canResume && (
            <Button variant="primary" size="md" onClick={onResume}>
              Resume
              <kbd className="ml-1 text-xs font-mono px-1.5 py-0.5 rounded bg-white/20 text-white/80" aria-hidden="true">P</kbd>
            </Button>
          )}

          <button
            onClick={onUndo}
            disabled={!canUndo || isProcessing}
            className="
              min-h-[var(--size-touch)] px-4 rounded-lg
              bg-surface-elevated border border-border
              text-foreground font-medium text-base
              hover:bg-surface-hover transition-colors duration-150
              disabled:opacity-40 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
              focus-visible:outline-2 focus-visible:outline-offset-3
            "
            aria-label="Undo last call (U)"
          >
            Undo
            <kbd className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted text-foreground-muted" aria-hidden="true">U</kbd>
          </button>

          {/* Reset button — danger color per design plan */}
          <button
            onClick={onReset}
            className="
              min-h-[var(--size-touch)] px-4 rounded-lg
              border border-error/40
              text-error font-medium text-base
              hover:bg-error/10 transition-colors duration-150
              flex items-center justify-center gap-2
              focus-visible:outline-2 focus-visible:outline-offset-3
            "
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)' }}
            aria-label="Reset game (R)"
          >
            Reset
            <kbd className="text-xs font-mono px-1.5 py-0.5 rounded bg-error/20 text-error" aria-hidden="true">R</kbd>
          </button>
        </div>

        {/* Save as Template button */}
        <button
          onClick={() => setShowSaveTemplateModal(true)}
          className="
            w-full min-h-[var(--size-touch)] px-4 rounded-lg
            bg-surface-elevated border border-border
            text-foreground font-medium text-base
            hover:bg-surface-hover transition-colors duration-150
            flex items-center justify-center
            focus-visible:outline-2 focus-visible:outline-offset-3
          "
          aria-label="Save current settings as a template"
        >
          Save as Template
        </button>

        {/* Status indicator */}
        <div
          className="flex items-center justify-center gap-2 py-1"
          role="status"
          aria-live="polite"
          aria-label={`Game status: ${status}`}
        >
          <span
            aria-hidden="true"
            className={`
              w-2.5 h-2.5 rounded-full
              ${status === 'playing' ? 'bg-success animate-pulse motion-reduce:animate-none' : ''}
              ${status === 'paused' ? 'bg-warning' : ''}
              ${status === 'idle' ? 'bg-foreground-muted' : ''}
              ${status === 'ended' ? 'bg-error' : ''}
            `}
          />
          <span className="text-base font-medium capitalize text-foreground-secondary">{status}</span>
        </div>
      </div>

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={showSaveTemplateModal}
        onClose={() => setShowSaveTemplateModal(false)}
      />

      {/* Reset Confirmation Dialog */}
      <Modal
        isOpen={showResetConfirm}
        onClose={onCancelReset ?? (() => {})}
        title="Reset Game?"
        variant="danger"
        confirmLabel="Reset"
        cancelLabel="Cancel"
        onConfirm={onConfirmReset}
      >
        <p>
          This will end the current game and clear all called numbers. Are you sure?
        </p>
      </Modal>
    </>
  );
}
