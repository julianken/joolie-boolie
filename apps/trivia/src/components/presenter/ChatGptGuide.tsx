'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'jb-trivia-chatgpt-guide-expanded';

const PROMPT_TEMPLATE = `Create a set of trivia questions about [YOUR TOPIC HERE] in JSON format.

Requirements:
- Return a JSON array of question objects
- Each question must have these fields:
  - "question": the question text
  - "options": array of exactly 4 answer choices
  - "correctAnswer": the full text of the correct option (must exactly match one of the options)
  - "category": a topic category (e.g., science, history, geography, entertainment, sports)
  - "explanation": a brief explanation of why the answer is correct
- Generate 10 questions
- Make questions clear and unambiguous
- Vary the difficulty

Return ONLY the JSON array, no other text.

Example of one question:
{
  "question": "What is the capital of France?",
  "options": ["London", "Paris", "Berlin", "Madrid"],
  "correctAnswer": "Paris",
  "category": "geography",
  "explanation": "Paris has been the capital of France since the 10th century."
}`;

const EXAMPLE_OUTPUT = `[
  {
    "question": "What is the capital of France?",
    "options": ["London", "Paris", "Berlin", "Madrid"],
    "correctAnswer": "Paris",
    "category": "geography",
    "explanation": "Paris has been the capital of France since the 10th century."
  },
  {
    "question": "Which planet is known as the Red Planet?",
    "options": ["Venus", "Jupiter", "Mars", "Saturn"],
    "correctAnswer": "Mars",
    "category": "science",
    "explanation": "Mars appears red due to iron oxide on its surface."
  },
  {
    "question": "In which year did World War II end?",
    "options": ["1943", "1944", "1945", "1946"],
    "correctAnswer": "1945",
    "category": "history",
    "explanation": "WWII ended in 1945 with Germany surrendering in May and Japan in September."
  }
]`;

const ACCEPTED_FIELDS = [
  { name: 'question', required: true, description: 'The question text' },
  { name: 'options', required: true, description: 'Array of 2\u20134 answer choices' },
  {
    name: 'correctAnswer',
    required: true,
    description: 'The full text of the correct option, or a letter (A/B/C/D)',
  },
  {
    name: 'category',
    required: false,
    description: 'e.g., science, history, geography, entertainment, sports',
  },
  { name: 'explanation', required: false, description: 'Shown after the answer is revealed' },
  {
    name: 'type',
    required: false,
    description: 'multiple_choice or true_false (auto-detected if omitted)',
  },
];

const STEPS = [
  {
    label: 'Copy the prompt',
    detail: 'click "Copy prompt" above',
  },
  {
    label: 'Open ChatGPT',
    detail: 'go to chatgpt.com and paste the prompt. Change [YOUR TOPIC HERE] to your topic',
  },
  {
    label: 'Copy the response',
    detail: 'select all the JSON text ChatGPT generates and copy it',
  },
  {
    label: 'Save as a file',
    detail:
      'paste into a text editor and save as questions.json. Or skip this step and use the "Paste JSON" option below',
  },
  {
    label: 'Upload here',
    detail: 'drag the file onto the drop zone below, or click to browse',
  },
];

const PANEL_ID = 'chatgpt-guide-panel';

export function ChatGptGuide() {
  const [expanded, setExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [copyLabel, setCopyLabel] = useState('Copy prompt');
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(expanded));
    } catch {
      // localStorage unavailable
    }
  }, [expanded]);

  // Cleanup the copy feedback timer on unmount
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(PROMPT_TEMPLATE);
      setCopyLabel('Copied!');
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = setTimeout(() => {
        setCopyLabel('Copy prompt');
        copyTimerRef.current = null;
      }, 2000);
    } catch {
      // Clipboard API unavailable
    }
  }, []);

  const codeBlockClasses =
    'font-mono text-sm leading-relaxed bg-muted/30 border border-border rounded-lg p-4 overflow-x-auto whitespace-pre-wrap';

  return (
    <div className="border border-border rounded-lg">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full px-4 min-h-[48px] py-3 text-left text-base font-medium flex items-center justify-between hover:bg-muted/50 transition-colors rounded-lg"
        aria-expanded={expanded}
        aria-controls={PANEL_ID}
      >
        <span>Create questions with ChatGPT</span>
        <span aria-hidden="true">{expanded ? '\u25B2' : '\u25BC'}</span>
      </button>

      <div id={PANEL_ID} hidden={!expanded}>
        <div className="px-4 pb-4 space-y-6">
          {/* Section A: Prompt Template */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-base font-medium">ChatGPT Prompt Template</h4>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 min-h-[44px] py-1.5 text-base rounded-lg border border-border hover:bg-muted/50 transition-colors inline-flex items-center gap-2"
              >
                {copyLabel}
              </button>
            </div>
            <pre className={codeBlockClasses}>
              <code>{PROMPT_TEMPLATE}</code>
            </pre>
          </div>

          {/* Section B: Example Output */}
          <div className="space-y-2">
            <h4 className="text-base font-medium">Example Output</h4>
            <pre className={codeBlockClasses}>
              <code>{EXAMPLE_OUTPUT}</code>
            </pre>
          </div>

          {/* Section C: Accepted Fields */}
          <div className="space-y-2">
            <h4 className="text-base font-medium">Accepted Fields</h4>
            <ul className="space-y-1.5 text-base">
              {ACCEPTED_FIELDS.map((field) => (
                <li key={field.name} className="flex gap-2">
                  <code className="font-mono text-base shrink-0">{field.name}</code>
                  <span className="text-muted-foreground">
                    ({field.required ? 'required' : 'optional'}) &mdash; {field.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section D: Step-by-Step Instructions */}
          <div className="space-y-2">
            <h4 className="text-base font-medium">Step-by-Step Instructions</h4>
            <ol className="space-y-2 text-base list-decimal list-inside">
              {STEPS.map((step, i) => (
                <li key={i}>
                  <span className="font-medium">{step.label}</span>
                  <span className="text-muted-foreground"> &mdash; {step.detail}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
