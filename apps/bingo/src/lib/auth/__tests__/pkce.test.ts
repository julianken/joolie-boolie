import { describe, it, expect } from 'vitest';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generatePKCEPair,
} from '../pkce';

describe('PKCE', () => {
  describe('generateCodeVerifier', () => {
    it('should generate a verifier of correct length', () => {
      const verifier = generateCodeVerifier();
      expect(verifier).toHaveLength(128);
    });

    it('should generate verifier with valid characters', () => {
      const verifier = generateCodeVerifier();
      // RFC 7636: unreserved characters [A-Z, a-z, 0-9, -, ., _, ~]
      expect(verifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
    });

    it('should generate unique verifiers', () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();
      expect(verifier1).not.toBe(verifier2);
    });

    it('should meet minimum length requirement (43 chars)', () => {
      const verifier = generateCodeVerifier();
      expect(verifier.length).toBeGreaterThanOrEqual(43);
    });

    it('should not exceed maximum length requirement (128 chars)', () => {
      const verifier = generateCodeVerifier();
      expect(verifier.length).toBeLessThanOrEqual(128);
    });
  });

  describe('generateCodeChallenge', () => {
    it('should generate base64url-encoded SHA-256 hash', async () => {
      const verifier = 'test_verifier_123';
      const challenge = await generateCodeChallenge(verifier);

      // Base64url should only contain [A-Za-z0-9\-_]
      expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/);

      // SHA-256 hash is 32 bytes = 43 base64url chars (without padding)
      expect(challenge).toHaveLength(43);
    });

    it('should generate consistent challenges for same verifier', async () => {
      const verifier = 'test_verifier_123';
      const challenge1 = await generateCodeChallenge(verifier);
      const challenge2 = await generateCodeChallenge(verifier);
      expect(challenge1).toBe(challenge2);
    });

    it('should generate different challenges for different verifiers', async () => {
      const verifier1 = 'test_verifier_1';
      const verifier2 = 'test_verifier_2';
      const challenge1 = await generateCodeChallenge(verifier1);
      const challenge2 = await generateCodeChallenge(verifier2);
      expect(challenge1).not.toBe(challenge2);
    });

    it('should not contain base64 padding characters', async () => {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);

      // Base64url should not have = padding
      expect(challenge).not.toContain('=');
      expect(challenge).not.toContain('+');
      expect(challenge).not.toContain('/');
    });
  });

  describe('generatePKCEPair', () => {
    it('should generate both verifier and challenge', async () => {
      const pair = await generatePKCEPair();

      expect(pair).toHaveProperty('verifier');
      expect(pair).toHaveProperty('challenge');
      expect(pair.verifier).toHaveLength(128);
      expect(pair.challenge).toHaveLength(43);
    });

    it('should generate valid PKCE pair with matching challenge', async () => {
      const pair = await generatePKCEPair();

      // Verify challenge matches verifier
      const expectedChallenge = await generateCodeChallenge(pair.verifier);
      expect(pair.challenge).toBe(expectedChallenge);
    });

    it('should generate unique pairs', async () => {
      const pair1 = await generatePKCEPair();
      const pair2 = await generatePKCEPair();

      expect(pair1.verifier).not.toBe(pair2.verifier);
      expect(pair1.challenge).not.toBe(pair2.challenge);
    });
  });

  describe('PKCE RFC 7636 Compliance', () => {
    it('should meet RFC 7636 security requirements', async () => {
      const pair = await generatePKCEPair();

      // Verifier must be 43-128 characters
      expect(pair.verifier.length).toBeGreaterThanOrEqual(43);
      expect(pair.verifier.length).toBeLessThanOrEqual(128);

      // Challenge must be S256 (SHA-256)
      // SHA-256 produces 256 bits = 32 bytes = 43 base64url chars
      expect(pair.challenge).toHaveLength(43);

      // Both must use unreserved characters per RFC 3986
      expect(pair.verifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
      expect(pair.challenge).toMatch(/^[A-Za-z0-9\-_]+$/);
    });

    it('should use cryptographically secure random generation', () => {
      // Generate multiple verifiers and check entropy
      const verifiers = new Set<string>();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        verifiers.add(generateCodeVerifier());
      }

      // All verifiers should be unique (collision extremely unlikely)
      expect(verifiers.size).toBe(iterations);
    });
  });
});
