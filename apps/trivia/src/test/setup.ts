import '@testing-library/jest-dom/vitest';
import { expect, vi } from 'vitest';
import * as matchers from 'vitest-axe/matchers';

// Extend vitest's expect with vitest-axe matchers
expect.extend(matchers);

// Mock next/font/google (build-time transform that doesn't exist at runtime)
vi.mock('next/font/google', () => ({
  Space_Grotesk: () => ({ className: 'mock-space-grotesk', variable: '--font-display', style: { fontFamily: 'Space Grotesk' } }),
  Plus_Jakarta_Sans: () => ({ className: 'mock-jakarta-sans', variable: '--font-sans', style: { fontFamily: 'Plus Jakarta Sans' } }),
}));
