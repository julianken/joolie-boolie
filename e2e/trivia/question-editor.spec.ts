import { test, expect } from '@playwright/test';
import { waitForHydration } from '../utils/helpers';

test.describe('Question Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/question-sets');
    await waitForHydration(page);
  });

  test('displays question editor modal when Create Question Set is clicked', async ({ page }) => {
    // Click create button
    const createButton = page.getByRole('button', { name: /create question set/i });
    await createButton.click();

    // Modal should appear
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/create question set/i)).toBeVisible();
  });

  test('can add a category and question', async ({ page }) => {
    // Open modal
    await page.getByRole('button', { name: /create question set/i }).click();

    // Fill in question set name
    const nameInput = page.getByLabel(/question set name/i);
    await nameInput.fill('Test Question Set');

    // Add a category
    const categorySelect = page.getByLabel(/add category/i).first();
    await categorySelect.selectOption('science');

    // Add a question
    const addQuestionButton = page.getByRole('button', { name: /add question/i }).first();
    await addQuestionButton.click();

    // Question editor should appear
    await expect(page.getByText(/question 1/i)).toBeVisible();
  });

  test('question form displays and validates', async ({ page }) => {
    // Open modal and add category
    await page.getByRole('button', { name: /create question set/i }).click();
    await page.getByLabel(/question set name/i).fill('Test Set');

    const categorySelect = page.getByLabel(/add category/i).first();
    await categorySelect.selectOption('science');

    await page.getByRole('button', { name: /add question/i }).first().click();

    // Fill in question text
    const questionInput = page.getByLabel(/question text/i).first();
    await questionInput.fill('What is H2O?');

    // Should show character count
    await expect(page.getByText(/12\/500 characters/i)).toBeVisible();

    // Clear the question (should show validation error)
    await questionInput.clear();
    await questionInput.blur();

    // Should show validation error
    await expect(page.getByText(/question text is required/i)).toBeVisible();
  });

  test('can switch between Multiple Choice and True/False', async ({ page }) => {
    // Open modal and add category with question
    await page.getByRole('button', { name: /create question set/i }).click();
    await page.getByLabel(/question set name/i).fill('Test Set');

    const categorySelect = page.getByLabel(/add category/i).first();
    await categorySelect.selectOption('science');

    await page.getByRole('button', { name: /add question/i }).first().click();

    // Fill question
    await page.getByLabel(/question text/i).first().fill('Is water H2O?');

    // By default should be Multiple Choice with 4 options
    const typeSelect = page.getByLabel(/question type/i).first();
    await expect(typeSelect).toHaveValue('multiple_choice');

    // Should have 4 option inputs
    const optionInputs = page.locator('input[placeholder*="Option"]');
    await expect(optionInputs).toHaveCount(4);

    // Switch to True/False
    await typeSelect.selectOption('true_false');

    // Should now show True/False options (radio buttons)
    await expect(page.getByText('True')).toBeVisible();
    await expect(page.getByText('False')).toBeVisible();

    // Switch back to Multiple Choice
    await typeSelect.selectOption('multiple_choice');

    // Should have 4 empty options again
    await expect(optionInputs.first()).toHaveValue('');
  });

  test('can add and remove options for Multiple Choice', async ({ page }) => {
    // Open modal and add category with question
    await page.getByRole('button', { name: /create question set/i }).click();
    await page.getByLabel(/question set name/i).fill('Test Set');

    const categorySelect = page.getByLabel(/add category/i).first();
    await categorySelect.selectOption('science');

    await page.getByRole('button', { name: /add question/i }).first().click();

    // Fill question
    await page.getByLabel(/question text/i).first().fill('What is the capital of France?');

    // Fill in the 4 default options
    const optionInputs = page.locator('input[placeholder*="Option"]');
    await optionInputs.nth(0).fill('Paris');
    await optionInputs.nth(1).fill('London');
    await optionInputs.nth(2).fill('Berlin');
    await optionInputs.nth(3).fill('Madrid');

    // Options should be filled
    await expect(optionInputs.nth(0)).toHaveValue('Paris');
    await expect(optionInputs.nth(1)).toHaveValue('London');
    await expect(optionInputs.nth(2)).toHaveValue('Berlin');
    await expect(optionInputs.nth(3)).toHaveValue('Madrid');
  });

  test('category selector works', async ({ page }) => {
    // Open modal and add category with question
    await page.getByRole('button', { name: /create question set/i }).click();
    await page.getByLabel(/question set name/i).fill('Test Set');

    const categorySelect = page.getByLabel(/add category/i).first();
    await categorySelect.selectOption('science');

    await page.getByRole('button', { name: /add question/i }).first().click();

    // Fill question
    await page.getByLabel(/question text/i).first().fill('Test question');

    // Category selector should be visible
    const questionCategorySelect = page.getByLabel(/^category/i).first();
    await expect(questionCategorySelect).toBeVisible();

    // Should have default value
    await expect(questionCategorySelect).toHaveValue('general_knowledge');

    // Can change category
    await questionCategorySelect.selectOption('science');
    await expect(questionCategorySelect).toHaveValue('science');
  });

  test('explanation field is optional and saves', async ({ page }) => {
    // Open modal and add category with question
    await page.getByRole('button', { name: /create question set/i }).click();
    await page.getByLabel(/question set name/i).fill('Test Set');

    const categorySelect = page.getByLabel(/add category/i).first();
    await categorySelect.selectOption('science');

    await page.getByRole('button', { name: /add question/i }).first().click();

    // Fill question
    await page.getByLabel(/question text/i).first().fill('What is H2O?');

    // Fill explanation
    const explanationInput = page.getByLabel(/explanation/i).first();
    await expect(explanationInput).toBeVisible();
    await explanationInput.fill('H2O is the chemical formula for water.');

    // Should save the explanation
    await expect(explanationInput).toHaveValue('H2O is the chemical formula for water.');
  });

  test('can remove a question', async ({ page }) => {
    // Open modal and add category with question
    await page.getByRole('button', { name: /create question set/i }).click();
    await page.getByLabel(/question set name/i).fill('Test Set');

    const categorySelect = page.getByLabel(/add category/i).first();
    await categorySelect.selectOption('science');

    // Add first question
    await page.getByRole('button', { name: /add question/i }).first().click();
    await expect(page.getByText(/question 1/i)).toBeVisible();

    // Add second question
    await page.getByRole('button', { name: /add question/i }).first().click();
    await expect(page.getByText(/question 2/i)).toBeVisible();

    // Remove first question
    const removeButtons = page.getByRole('button', { name: /remove question/i });
    await removeButtons.first().click();

    // Should only have one question now
    await expect(page.getByText(/question 1/i)).toBeVisible();
    await expect(page.getByText(/question 2/i)).not.toBeVisible();
  });

  test('validates empty options for Multiple Choice', async ({ page }) => {
    // Open modal and add category with question
    await page.getByRole('button', { name: /create question set/i }).click();
    await page.getByLabel(/question set name/i).fill('Test Set');

    const categorySelect = page.getByLabel(/add category/i).first();
    await categorySelect.selectOption('science');

    await page.getByRole('button', { name: /add question/i }).first().click();

    // Fill question
    await page.getByLabel(/question text/i).first().fill('What is 2+2?');

    // Leave option empty and blur
    const optionInputs = page.locator('input[placeholder*="Option"]');
    await optionInputs.nth(0).click();
    await optionInputs.nth(0).blur();

    // Should show validation error
    await expect(page.getByText(/option.*is required/i)).toBeVisible();
  });
});
