import { describe, it, expect } from 'vitest';
import {
  generatePrefixedId,
  parsePrefixedId,
  validatePrefixedId,
  IdSchema,
} from './index';

describe('Human IDs Library', () => {
  describe('generatePrefixedId', () => {
    it('generates prefixed ID with correct format', () => {
      const id = generatePrefixedId('user');
      expect(id).toMatch(/^user_[0-9A-Z]+$/);
      expect(id.length).toBeGreaterThan(5);
      expect(id.length).toBeLessThanOrEqual(255);
    });

    it('generates unique IDs', () => {
      const id1 = generatePrefixedId('test');
      const id2 = generatePrefixedId('test');
      expect(id1).not.toBe(id2);
    });

    it('accepts any prefix characters', () => {
      expect(() => generatePrefixedId('test-long-prefix')).not.toThrow();
      expect(() => generatePrefixedId('test_underscore')).not.toThrow();
      expect(() => generatePrefixedId('test!')).not.toThrow();
      expect(() => generatePrefixedId('live')).not.toThrow();
      expect(() => generatePrefixedId('test')).not.toThrow();
    });

    it('ensures ID never exceeds 255 characters', () => {
      const id = generatePrefixedId('normal-prefix');
      expect(id.length).toBeLessThanOrEqual(255);
      
      // Test with a very long prefix
      const longPrefix = 'a'.repeat(200);
      const longId = generatePrefixedId(longPrefix);
      expect(longId.length).toBeLessThanOrEqual(255);
    });
  });

  describe('parsePrefixedId', () => {
    it('parses valid prefixed ID correctly', () => {
      const id = generatePrefixedId('parse');
      const { prefix, uuid } = parsePrefixedId(id);
      
      expect(prefix).toBe('parse');
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('throws for invalid ID format', () => {
      expect(() => parsePrefixedId('invalid')).toThrow('Invalid prefixed ID format');
      expect(() => parsePrefixedId('test_invalid!')).toThrow('Failed to parse ID');
    });

    it('handles round-trip conversion', () => {
      const originalId = generatePrefixedId('round');
      const { prefix, uuid } = parsePrefixedId(originalId);
      
      // Verify we can parse and get consistent results
      const reparsed = parsePrefixedId(originalId);
      expect(reparsed.prefix).toBe(prefix);
      expect(reparsed.uuid).toBe(uuid);
    });
  });

  describe('validatePrefixedId', () => {
    it('validates correct prefix', () => {
      const id = generatePrefixedId('valid');
      expect(validatePrefixedId(id, 'valid')).toBe(true);
    });

    it('rejects wrong prefix', () => {
      const id = generatePrefixedId('valid');
      expect(validatePrefixedId(id, 'invalid')).toBe(false);
    });

    it('rejects malformed IDs', () => {
      expect(validatePrefixedId('malformed', 'test')).toBe(false);
      expect(validatePrefixedId('test_invalid!', 'test')).toBe(false);
    });
  });

  describe('parsePrefixedId destructuring', () => {
    it('allows extracting UUID via destructuring', () => {
      const id = generatePrefixedId('extract');
      const { uuid } = parsePrefixedId(id);
      
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('allows extracting prefix via destructuring', () => {
      const id = generatePrefixedId('testprefix');
      const { prefix } = parsePrefixedId(id);
      
      expect(prefix).toBe('testprefix');
    });
  });




  describe('StandardSchema compatibility', () => {
    it('creates valid StandardSchema instance', () => {
      const schema = IdSchema('schema');
      
      expect(schema).toHaveProperty('~standard');
      expect(schema['~standard'].version).toBe(1);
      expect(schema['~standard'].vendor).toBe('human-ids');
      expect(typeof schema['~standard'].validate).toBe('function');
    });

    it('validates correct IDs', () => {
      const schema = IdSchema('test');
      const id = generatePrefixedId('test');
      
      const result = schema['~standard'].validate(id);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(id);
      }
    });

    it('rejects incorrect IDs', () => {
      const schema = IdSchema('test');
      
      const result1 = schema['~standard'].validate('wrong_format');
      expect(result1.success).toBe(false);
      if (!result1.success) {
        expect(result1.issues).toBeDefined();
        expect(result1.issues.length).toBeGreaterThan(0);
      }

      const result2 = schema['~standard'].validate(123);
      expect(result2.success).toBe(false);
      if (!result2.success) {
        expect(result2.issues[0].message).toBe('Expected string');
      }
    });
  });




  describe('Error handling', () => {
    it('provides meaningful error messages', () => {
      expect(() => parsePrefixedId('invalid')).toThrow(/Invalid prefixed ID format/);
      expect(() => parsePrefixedId('test_!')).toThrow(/Failed to parse ID/);
    });
  });
});