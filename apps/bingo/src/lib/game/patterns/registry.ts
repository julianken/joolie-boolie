import { BingoPattern, PatternCategory } from '@/types';
import { validateCells } from './validators';

/**
 * Pattern registry following the Open-Closed principle.
 * New patterns can be added without modifying existing code.
 */
class PatternRegistry {
  private patterns: Map<string, BingoPattern> = new Map();

  /**
   * Register a new pattern.
   * Throws if a pattern with the same ID already exists.
   */
  register(pattern: BingoPattern): void {
    if (this.patterns.has(pattern.id)) {
      throw new Error(`Pattern with id "${pattern.id}" already registered`);
    }
    if (!validateCells(pattern.cells)) {
      throw new Error(`Pattern "${pattern.id}" has invalid cell positions`);
    }
    this.patterns.set(pattern.id, pattern);
  }

  /**
   * Register multiple patterns at once.
   */
  registerAll(patterns: BingoPattern[]): void {
    for (const pattern of patterns) {
      this.register(pattern);
    }
  }

  /**
   * Get a pattern by ID.
   */
  get(id: string): BingoPattern | undefined {
    return this.patterns.get(id);
  }

  /**
   * Check if a pattern exists.
   */
  has(id: string): boolean {
    return this.patterns.has(id);
  }

  /**
   * Get all registered patterns.
   */
  getAll(): BingoPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get patterns by category.
   */
  getByCategory(category: PatternCategory): BingoPattern[] {
    return this.getAll().filter((p) => p.category === category);
  }

  /**
   * Get the count of registered patterns.
   */
  get count(): number {
    return this.patterns.size;
  }

  /**
   * Get all unique categories.
   */
  getCategories(): PatternCategory[] {
    const categories = new Set<PatternCategory>();
    for (const pattern of this.patterns.values()) {
      categories.add(pattern.category);
    }
    return Array.from(categories);
  }

  /**
   * Clear all patterns (mainly for testing).
   */
  clear(): void {
    this.patterns.clear();
  }
}

// Singleton instance
export const patternRegistry = new PatternRegistry();

/**
 * Helper to create a pattern object.
 */
export function createPattern(
  id: string,
  name: string,
  category: PatternCategory,
  cells: { row: number; col: number }[],
  description?: string
): BingoPattern {
  return {
    id,
    name,
    category,
    cells,
    description,
  };
}
