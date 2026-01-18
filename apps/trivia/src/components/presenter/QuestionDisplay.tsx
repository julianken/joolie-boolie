'use client';

import type { Question } from '@/types';

interface QuestionDisplayProps {
  question: Question | null;
  peekAnswer: boolean;
  onTogglePeek: () => void;
  progress: string;
  isOnDisplay: boolean;
}

export function QuestionDisplay({
  question,
  peekAnswer,
  onTogglePeek,
  progress,
  isOnDisplay,
}: QuestionDisplayProps) {
  if (!question) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-muted-foreground">
          Select a question from the list to view it here.
        </p>
      </div>
    );
  }

  const isMultipleChoice = question.type === 'multiple_choice';

  return (
    <div className="space-y-4">
      {/* Header with progress and controls */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-medium text-muted-foreground">
          {progress}
        </span>
        <div className="flex items-center gap-2">
          {/* Display status indicator */}
          {isOnDisplay && (
            <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-600 rounded">
              On Display
            </span>
          )}
          {/* Peek answer toggle */}
          <button
            onClick={onTogglePeek}
            className={`
              flex items-center justify-center gap-2 w-24 py-1.5 rounded-lg text-sm font-medium
              transition-colors duration-200
              ${
                peekAnswer
                  ? 'bg-amber-500 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }
            `}
            title={peekAnswer ? 'Hide answer' : 'Peek at answer (local only)'}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {peekAnswer ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              )}
            </svg>
            {peekAnswer ? question.correctAnswers.join(', ') : 'Peek'}
          </button>
        </div>
      </div>

      {/* Question text */}
      <div className="text-center py-4">
        <p className="text-2xl font-semibold text-foreground leading-relaxed">
          {question.text}
        </p>
      </div>

      {/* Options grid */}
      <div
        className={`grid gap-3 ${
          isMultipleChoice ? 'grid-cols-2' : 'grid-cols-2'
        }`}
      >
        {question.options.map((option, index) => {
          const optionText = question.optionTexts[index];
          const isTrueFalse = option === optionText;

          return (
            <div
              key={option}
              className="p-4 rounded-xl border-2 bg-background border-border"
            >
              {isTrueFalse ? (
                <span className="text-lg font-semibold text-foreground">
                  {option}
                </span>
              ) : (
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold bg-muted text-muted-foreground">
                    {option}
                  </span>
                  <span className="text-lg text-foreground">{optionText}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
