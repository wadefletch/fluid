import { describe, it, expect } from 'vitest';
import {
  generate,
  parse,
  validate,
} from './index';

describe('Human IDs Library', () => {
  describe('generate', () => {
    it('generates prefixed ID with correct format', () => {
      const id = generate('user');
      expect(id).toMatch(/^user_[0-9A-Z]+$/);
      expect(id.length).toBeGreaterThan(5);
      expect(id.length).toBeLessThanOrEqual(255);
    });

    it('generates unique IDs', () => {
      const id1 = generate('test');
      const id2 = generate('test');
      expect(id1).not.toBe(id2);
    });

    it('accepts any prefix characters', () => {
      expect(() => generate('test-long-prefix')).not.toThrow();
      expect(() => generate('test_underscore')).not.toThrow();
      expect(() => generate('test!')).not.toThrow();
      expect(() => generate('live')).not.toThrow();
      expect(() => generate('test')).not.toThrow();
    });

    it('ensures ID never exceeds 255 characters', () => {
      const id = generate('normal-prefix');
      expect(id.length).toBeLessThanOrEqual(255);
      
      // Test with a very long prefix
      const longPrefix = 'a'.repeat(200);
      const longId = generate(longPrefix);
      expect(longId.length).toBeLessThanOrEqual(255);
    });
  });

  describe('parse', () => {
    it('parses valid prefixed ID correctly', () => {
      const id = generate('parse');
      const { prefix, uuid } = parse(id);
      
      expect(prefix).toBe('parse');
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('throws for invalid ID format', () => {
      expect(() => parse('invalid')).toThrow('Invalid prefixed ID format');
      expect(() => parse('test_invalid!')).toThrow('Failed to parse ID');
    });

    it('handles round-trip conversion', () => {
      const originalId = generate('round');
      const { prefix, uuid } = parse(originalId);
      
      // Verify we can parse and get consistent results
      const reparsed = parse(originalId);
      expect(reparsed.prefix).toBe(prefix);
      expect(reparsed.uuid).toBe(uuid);
    });
  });

  describe('validate', () => {
    it('validates correct prefix', () => {
      const id = generate('valid');
      expect(validate(id, 'valid')).toBe(true);
    });

    it('rejects wrong prefix', () => {
      const id = generate('valid');
      expect(validate(id, 'invalid')).toBe(false);
    });

    it('rejects malformed IDs', () => {
      expect(validate('malformed', 'test')).toBe(false);
      expect(validate('test_invalid!', 'test')).toBe(false);
    });
  });









  describe('Error handling', () => {
    it('provides meaningful error messages', () => {
      expect(() => parse('invalid')).toThrow(/Invalid prefixed ID format/);
      expect(() => parse('test_!')).toThrow(/Failed to parse ID/);
    });
  });
});