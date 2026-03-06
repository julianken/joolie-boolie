'use client';

/**
 * T4.3: WizardStepSettings
 *
 * Step 2 of the SetupWizard. Handles game settings:
 * rounds and questions per round configuration.
 *
 * Fully presentational — zero store access, zero hooks, zero effects.
 * Supports three render states:
 *   A) isByCategory=false → Rounds slider + QPR slider
 *   B) isByCategory=true, questions loaded → Rounds slider + category badge pills
 *   C) isByCategory=true, no questions → Rounds slider + empty-state message
 */

import { Slider, Toggle } from '@joolie-boolie/ui';
import { SETTINGS_RANGES } from '@/stores/settings-store';
import type { SettingsState } from '@/stores/settings-store';
import type { PerRoundBreakdown } from '@/types';
import { getCategoryName, getCategoryBadgeClasses } from '@/lib/categories';

export interface WizardStepSettingsProps {
  roundsCount: number;
  questionsPerRound: number;
  isByCategory: boolean;
  perRoundBreakdown: PerRoundBreakdown[];
  onUpdateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  onToggleByCategory: (isByCategory: boolean) => void;
}

export function WizardStepSettings({
  roundsCount,
  questionsPerRound,
  isByCategory,
  perRoundBreakdown,
  onUpdateSetting,
  onToggleByCategory,
}: WizardStepSettingsProps) {
  // Determine which state we're in
  const firstRound = perRoundBreakdown[0];
  const hasBreakdown = !!firstRound && firstRound.categories.length > 0;

  // Aggregate category totals across all rounds for badge display
  const categoryTotals = new Map<string, number>();
  if (isByCategory && hasBreakdown) {
    for (const round of perRoundBreakdown) {
      for (const cat of round.categories) {
        categoryTotals.set(
          cat.categoryId,
          (categoryTotals.get(cat.categoryId) ?? 0) + cat.questionCount
        );
      }
    }
  }

  // Total questions across all rounds
  const totalQuestions = perRoundBreakdown.reduce((sum, r) => sum + r.totalCount, 0);

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
        <p className="text-sm text-foreground-secondary mt-0.5">
          Configure rounds and questions
        </p>
      </div>

      {/* Game Configuration */}
      <div className="bg-surface border border-border rounded-xl p-4 space-y-6">
        {/* By Category toggle — always visible */}
        <Toggle
          checked={isByCategory}
          onChange={onToggleByCategory}
          label="By Category"
        />

        {/* Rounds slider — always visible */}
        <Slider
          value={roundsCount}
          onChange={(value) => onUpdateSetting('roundsCount', value)}
          min={SETTINGS_RANGES.roundsCount.min}
          max={SETTINGS_RANGES.roundsCount.max}
          step={1}
          label="Number of Rounds"
        />

        {/* State A: QPR slider (By Count mode) */}
        {!isByCategory && (
          <Slider
            value={questionsPerRound}
            onChange={(value) => onUpdateSetting('questionsPerRound', value)}
            min={SETTINGS_RANGES.questionsPerRound.min}
            max={SETTINGS_RANGES.questionsPerRound.max}
            step={1}
            label="Questions Per Round"
          />
        )}

        {/* State B: Category badge pills (By Category, questions loaded) */}
        {isByCategory && hasBreakdown && (
          <div className="space-y-3">
            <p className="text-sm text-foreground-secondary">
              {roundsCount} {roundsCount === 1 ? 'round' : 'rounds'} &bull; {totalQuestions}{' '}
              {totalQuestions === 1 ? 'question' : 'questions'}
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from(categoryTotals.entries()).map(([categoryId, count]) => (
                <span
                  key={categoryId}
                  className={[
                    'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
                    getCategoryBadgeClasses(categoryId as Parameters<typeof getCategoryBadgeClasses>[0]),
                  ].join(' ')}
                >
                  {getCategoryName(categoryId as Parameters<typeof getCategoryName>[0])}: {count}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* State C: Empty state (By Category, no questions) */}
        {isByCategory && !hasBreakdown && (
          <p className="text-sm text-foreground-secondary">
            No questions imported yet. Import questions in Step 1 to see the breakdown.
          </p>
        )}
      </div>
    </div>
  );
}
