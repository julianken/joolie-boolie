/**
 * Scene navigation button config table.
 *
 * Maps each AudienceScene to forward/back button behavior.
 * Pure module — no React, no Zustand imports.
 *
 * Authority: WU-03 (SceneNavButtons Component + Config Table)
 */

import type { AudienceScene } from '@/types/audience-scene';
import { SCENE_TRIGGERS } from '@/lib/game/scene';

// =============================================================================
// NAV ACTION TYPES
// =============================================================================

export type NavAction =
  | { kind: 'advanceScene'; trigger: string }
  | { kind: 'startGame' }
  | { kind: 'none' };

export interface SceneNavConfig {
  forward: NavAction;
  forwardLabel: string;
  back: NavAction;
  backLabel: string;
}

// =============================================================================
// SCENE NAV CONFIG TABLE
// =============================================================================

export const SCENE_NAV_CONFIG: Record<AudienceScene, SceneNavConfig> = {
  waiting: {
    forward: { kind: 'startGame' },
    forwardLabel: 'Start Game',
    back: { kind: 'none' },
    backLabel: '',
  },
  game_intro: {
    forward: { kind: 'advanceScene', trigger: SCENE_TRIGGERS.SKIP },
    forwardLabel: 'Skip Intro',
    back: { kind: 'none' },
    backLabel: '',
  },
  round_intro: {
    forward: { kind: 'advanceScene', trigger: SCENE_TRIGGERS.SKIP },
    forwardLabel: 'Skip Round Intro',
    back: { kind: 'none' },
    backLabel: '',
  },
  question_anticipation: {
    forward: { kind: 'advanceScene', trigger: SCENE_TRIGGERS.SKIP },
    forwardLabel: 'Show Question',
    back: { kind: 'none' },
    backLabel: '',
  },
  question_display: {
    forward: { kind: 'none' },
    forwardLabel: '',
    back: { kind: 'none' },
    backLabel: '',
  },
  question_closed: {
    forward: { kind: 'advanceScene', trigger: SCENE_TRIGGERS.CLOSE },
    forwardLabel: 'Next',
    back: { kind: 'none' },
    backLabel: '',
  },
  answer_reveal: {
    forward: { kind: 'advanceScene', trigger: SCENE_TRIGGERS.ADVANCE },
    forwardLabel: 'Next Answer',
    back: { kind: 'none' },
    backLabel: '',
  },
  round_summary: {
    forward: { kind: 'advanceScene', trigger: SCENE_TRIGGERS.ADVANCE },
    forwardLabel: 'Review Answers',
    back: { kind: 'none' },
    backLabel: '',
  },
  recap_title: {
    forward: { kind: 'advanceScene', trigger: SCENE_TRIGGERS.ADVANCE },
    forwardLabel: 'Start Q&A Review',
    back: { kind: 'advanceScene', trigger: SCENE_TRIGGERS.BACK },
    backLabel: 'Back to Summary',
  },
  recap_qa: {
    forward: { kind: 'advanceScene', trigger: SCENE_TRIGGERS.ADVANCE },
    forwardLabel: 'Next',
    back: { kind: 'advanceScene', trigger: SCENE_TRIGGERS.BACK },
    backLabel: 'Previous',
  },
  recap_scores: {
    forward: { kind: 'advanceScene', trigger: SCENE_TRIGGERS.ADVANCE },
    forwardLabel: 'Continue',
    back: { kind: 'advanceScene', trigger: SCENE_TRIGGERS.BACK },
    backLabel: 'Back to Q&A',
  },
  final_buildup: {
    forward: { kind: 'advanceScene', trigger: SCENE_TRIGGERS.SKIP },
    forwardLabel: 'Skip to Podium',
    back: { kind: 'none' },
    backLabel: '',
  },
  final_podium: {
    forward: { kind: 'none' },
    forwardLabel: '',
    back: { kind: 'none' },
    backLabel: '',
  },
  paused: {
    forward: { kind: 'none' },
    forwardLabel: '',
    back: { kind: 'none' },
    backLabel: '',
  },
  emergency_blank: {
    forward: { kind: 'none' },
    forwardLabel: '',
    back: { kind: 'none' },
    backLabel: '',
  },
};
