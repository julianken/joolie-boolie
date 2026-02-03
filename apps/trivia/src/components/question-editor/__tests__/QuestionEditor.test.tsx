import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuestionEditor } from '../QuestionEditor';
import type { QuestionFormData } from '../QuestionSetEditorModal.utils';

/**
 * Test utilities
 */
const createMockQuestion = (overrides?: Partial<QuestionFormData>): QuestionFormData => ({
  id: 'test-question-1',
  question: 'What is the capital of France?',
  type: 'multiple_choice',
  options: ['Paris', 'London', 'Berlin', 'Madrid'],
  correctIndex: 0,
  category: 'general_knowledge',
  explanation: '',
  ...overrides,
});

const createTrueFalseQuestion = (): QuestionFormData => ({
  id: 'test-question-tf',
  question: 'The Earth is flat.',
  type: 'true_false',
  options: ['True', 'False'],
  correctIndex: 1,
  category: 'general_knowledge',
  explanation: '',
});

/**
 * QuestionEditor Tests
 */
describe('QuestionEditor', () => {
  describe('Rendering', () => {
    it('should render with question data', () => {
      const question = createMockQuestion();
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByLabelText(/question text/i)).toHaveValue(question.question);
    });

    it('should display round number in header', () => {
      const question = createMockQuestion();
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={2}
          roundIndex={1}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      expect(screen.getByText(/round 2/i)).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      const question = createMockQuestion();
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      expect(screen.getByLabelText(/question text/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/question type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/explanation/i)).toBeInTheDocument();
    });

    it('should disable remove button when canRemove is false', () => {
      const question = createMockQuestion();
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={false}
        />
      );

      const removeButton = screen.getByRole('button', { name: /remove question 1/i });
      expect(removeButton).toBeDisabled();
    });
  });

  describe('Question Text Validation', () => {
    it('should show error when question text is empty and touched', async () => {
      const question = createMockQuestion({ question: '' });
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      const input = screen.getByLabelText(/question text/i);
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText(/question text is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when question text is too short', async () => {
      const question = createMockQuestion({ question: '' });
      const onUpdate = vi.fn((q) => {
        question.question = q.question;
      });
      const onRemove = vi.fn();

      const { rerender } = render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      const input = screen.getByLabelText(/question text/i);
      fireEvent.change(input, { target: { value: 'ab' } });

      // Rerender with updated question
      rerender(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText(/question must be at least 3 characters/i)).toBeInTheDocument();
      });
    });

    it('should show character counter', () => {
      const question = createMockQuestion({ question: 'Test question' });
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      expect(screen.getByText(/13\/500 characters/i)).toBeInTheDocument();
    });

    it('should call onUpdateQuestion when question text changes', () => {
      const question = createMockQuestion();
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      const input = screen.getByLabelText(/question text/i);
      fireEvent.change(input, { target: { value: 'New question' } });

      expect(onUpdate).toHaveBeenCalled();
    });
  });

  describe('Question Type Switching', () => {
    it('should display Multiple Choice by default for 4-option questions', () => {
      const question = createMockQuestion();
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      const typeSelect = screen.getByLabelText(/question type/i);
      expect(typeSelect).toHaveValue('multiple_choice');
    });

    it('should display True/False for True/False questions', () => {
      const question = createTrueFalseQuestion();
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      const typeSelect = screen.getByLabelText(/question type/i);
      expect(typeSelect).toHaveValue('true_false');
    });

    it('should convert to True/False when type is changed', () => {
      const question = createMockQuestion();
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      const typeSelect = screen.getByLabelText(/question type/i);
      fireEvent.change(typeSelect, { target: { value: 'true_false' } });

      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          options: ['True', 'False'],
          correctIndex: 0,
        })
      );
    });

    it('should convert to Multiple Choice when type is changed', () => {
      const question = createTrueFalseQuestion();
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      const typeSelect = screen.getByLabelText(/question type/i);
      fireEvent.change(typeSelect, { target: { value: 'multiple_choice' } });

      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          options: ['', '', '', ''],
          correctIndex: 0,
        })
      );
    });
  });

  describe('Options Management', () => {
    it('should render all options for Multiple Choice', () => {
      const question = createMockQuestion();
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      expect(screen.getByPlaceholderText(/option a/i)).toHaveValue('Paris');
      expect(screen.getByPlaceholderText(/option b/i)).toHaveValue('London');
      expect(screen.getByPlaceholderText(/option c/i)).toHaveValue('Berlin');
      expect(screen.getByPlaceholderText(/option d/i)).toHaveValue('Madrid');
    });

    it('should render fixed options for True/False', () => {
      const question = createTrueFalseQuestion();
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      expect(screen.getByText('True')).toBeInTheDocument();
      expect(screen.getByText('False')).toBeInTheDocument();
    });

    it('should allow adding options for Multiple Choice (up to 4)', () => {
      const question = createMockQuestion({ options: ['Option 1', 'Option 2'] });
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      const addButton = screen.getByRole('button', { name: /add option/i });
      fireEvent.click(addButton);

      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          options: ['Option 1', 'Option 2', ''],
        })
      );
    });

    it('should allow removing options for Multiple Choice (min 2)', () => {
      const question = createMockQuestion({ options: ['A', 'B', 'C'] });
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      // Find remove button for option C
      const removeButtons = screen.getAllByRole('button', { name: /remove option/i });
      fireEvent.click(removeButtons[2]); // Remove option C

      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          options: ['A', 'B'],
        })
      );
    });
  });

  describe('Correct Answer Selection', () => {
    it('should mark the correct option for Multiple Choice', () => {
      const question = createMockQuestion({ correctIndex: 1 });
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons[1]).toBeChecked();
    });

    it('should allow changing correct answer for Multiple Choice', () => {
      const question = createMockQuestion({ correctIndex: 0 });
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      const radioButtons = screen.getAllByRole('radio');
      fireEvent.click(radioButtons[2]); // Select option C

      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          correctIndex: 2,
        })
      );
    });

    it('should mark the correct option for True/False', () => {
      const question = createTrueFalseQuestion();
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      const falseRadio = screen.getByLabelText(/mark "false" as correct answer/i);
      expect(falseRadio).toBeChecked();
    });
  });

  describe('Category Selection', () => {
    it('should render category selector', () => {
      const question = createMockQuestion();
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    });

    it('should have all 7 categories available', () => {
      const question = createMockQuestion();
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      const categorySelect = screen.getByLabelText(/category/i);
      const options = Array.from(categorySelect.querySelectorAll('option'));

      expect(options).toHaveLength(7);
      expect(options.map((o) => o.textContent)).toEqual([
        'General Knowledge',
        'Science',
        'History',
        'Geography',
        'Entertainment',
        'Sports',
        'Art & Literature',
      ]);
    });
  });

  describe('Remove Button', () => {
    it('should call onRemoveQuestion when clicked', () => {
      const question = createMockQuestion();
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      const removeButton = screen.getByRole('button', { name: /remove question 1/i });
      fireEvent.click(removeButton);

      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when canRemove is false', () => {
      const question = createMockQuestion();
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={false}
        />
      );

      const removeButton = screen.getByRole('button', { name: /remove question 1/i });
      expect(removeButton).toBeDisabled();
    });

    it('should be disabled when component is disabled', () => {
      const question = createMockQuestion();
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
          disabled={true}
        />
      );

      const removeButton = screen.getByRole('button', { name: /remove question 1/i });
      expect(removeButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels and ARIA attributes', () => {
      const question = createMockQuestion();
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      const questionInput = screen.getByLabelText(/question text/i);
      expect(questionInput).toHaveAttribute('aria-invalid', 'false');

      const typeSelect = screen.getByLabelText(/question type/i);
      expect(typeSelect).toBeInTheDocument();

      const categorySelect = screen.getByLabelText(/category/i);
      expect(categorySelect).toBeInTheDocument();
    });

    it('should show aria-describedby for errors', async () => {
      const question = createMockQuestion({ question: '' });
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      const input = screen.getByLabelText(/question text/i);
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAttribute('aria-describedby');
      });
    });

    it('should have minimum 44px touch targets', () => {
      const question = createMockQuestion();
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      const removeButton = screen.getByRole('button', { name: /remove question 1/i });
      // Check className includes min-h-[44px] pattern
      expect(removeButton.className).toMatch(/min-h-\[44px\]/);
    });

    it('should have minimum 56px height for inputs', () => {
      const question = createMockQuestion();
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      render(
        <QuestionEditor
          question={question}
          questionIndex={0}
          roundIndex={0}
          onUpdateQuestion={onUpdate}
          onRemoveQuestion={onRemove}
          canRemove={true}
        />
      );

      const questionInput = screen.getByLabelText(/question text/i);
      // Check className includes min-h-[56px] pattern
      expect(questionInput.className).toMatch(/min-h-\[56px\]/);
    });
  });
});
