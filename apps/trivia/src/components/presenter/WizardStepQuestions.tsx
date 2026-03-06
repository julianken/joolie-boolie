'use client';

/**
 * T4.2: WizardStepQuestions
 *
 * Step 1 of the SetupWizard. Handles all question content setup:
 * CSV/JSON import, question set selection, API importer, category filter,
 * question count display, and save-as-set button.
 */

import { QuestionSetSelector } from '@/components/presenter/QuestionSetSelector';
import { TriviaApiImporter } from '@/components/presenter/TriviaApiImporter';
import type { Question } from '@/types';

export interface WizardStepQuestionsProps {
  questions: Question[];
  onSaveQuestionSet: () => void;
}

export function WizardStepQuestions({
  questions,
  onSaveQuestionSet,
}: WizardStepQuestionsProps) {

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-foreground">Questions</h2>
        <p className="text-sm text-foreground-secondary mt-0.5">
          Fetch from our trivia database or import your own
        </p>
      </div>

      {/* Question count summary */}
      {questions.length > 0 && (
        <div className="px-4 py-3 bg-success/10 border border-success/30 rounded-xl">
          <p className="text-sm font-medium text-success">
            {questions.length} question{questions.length !== 1 ? 's' : ''} loaded
          </p>
        </div>
      )}

      {/* Trivia API Importer (primary, always visible) */}
      <div className="bg-surface border-2 border-primary rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-primary/15 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
            RECOMMENDED
          </span>
        </div>
        <TriviaApiImporter disabled={false} />
      </div>

      {/* Question Set Selector */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Load from Saved Set</h3>
        <QuestionSetSelector disabled={false} />
      </div>

      {/* Save Questions as Set */}
      <button
        onClick={onSaveQuestionSet}
        disabled={questions.length === 0}
        className={`w-full px-4 py-3 rounded-xl text-sm font-medium
          transition-colors duration-200 min-h-[44px]
          ${questions.length > 0
            ? 'bg-primary hover:bg-primary-hover text-primary-foreground'
            : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
          }`}
        aria-disabled={questions.length === 0}
      >
        Save Questions as Set
      </button>
    </div>
  );
}
