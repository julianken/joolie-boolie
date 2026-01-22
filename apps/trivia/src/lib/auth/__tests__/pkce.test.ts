import { describe, it, expect } from 'vitest';
import { generatePKCE } from '../pkce';

describe('generatePKCE', () => {
  it('should generate code_verifier with valid length', async () => {
    const { codeVerifier } = await generatePKCE();
    expect(codeVerifier.length).toBeGreaterThanOrEqual(43);
    expect(codeVerifier.length).toBeLessThanOrEqual(128);
  });

  it('should generate base64url encoded strings', async () => {
    const { codeVerifier, codeChallenge } = await generatePKCE();
    // base64url should not contain +, /, or =
    expect(codeVerifier).not.toMatch(/[+/=]/);
    expect(codeChallenge).not.toMatch(/[+/=]/);
  });

  it('should generate different values on each call', async () => {
    const result1 = await generatePKCE();
    const result2 = await generatePKCE();
    expect(result1.codeVerifier).not.toBe(result2.codeVerifier);
    expect(result1.codeChallenge).not.toBe(result2.codeChallenge);
  });

  it('should generate valid SHA-256 challenge from verifier', async () => {
    const { codeChallenge } = await generatePKCE();
    // SHA-256 hash encoded as base64url should be 43 characters
    expect(codeChallenge.length).toBe(43);
  });
});
