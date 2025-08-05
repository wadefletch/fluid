import { describe, it, expect } from 'vitest';
import {
  generatePrefixedId,
  parsePrefixedId,
  validatePrefixedId,
  extractUUID,
  extractPrefix,
  hasPrefix,
  handleIdByPrefix,
  isValidPrefixedId,
  getIdPattern,
  generateUUIDv7,
  isValidUUID,
  IdSchema,
  encodeCrockfordBase32,
  decodeCrockfordBase32,
  uuidToCrockfordBase32,
  crockfordBase32ToUuid,
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
      const parsed = parsePrefixedId(id);
      
      expect(parsed.prefix).toBe('parse');
      expect(isValidUUID(parsed.uuid)).toBe(true);
    });

    it('throws for invalid ID format', () => {
      expect(() => parsePrefixedId('invalid')).toThrow('Invalid prefixed ID format');
      expect(() => parsePrefixedId('invalid_badbase32')).toThrow('Failed to parse ID');
    });

    it('handles round-trip conversion', () => {
      const originalId = generatePrefixedId('round');
      const parsed = parsePrefixedId(originalId);
      
      // Reconstruct ID from parts
      const reconstructedBase32 = uuidToCrockfordBase32(parsed.uuid);
      const reconstructedId = `${parsed.prefix}_${reconstructedBase32}`;
      
      expect(reconstructedId).toBe(originalId);
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
      expect(validatePrefixedId('test_badbase32', 'test')).toBe(false);
    });
  });

  describe('extractUUID', () => {
    it('extracts valid UUID from prefixed ID', () => {
      const id = generatePrefixedId('extract');
      const uuid = extractUUID(id);
      
      expect(isValidUUID(uuid)).toBe(true);
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('throws for invalid ID', () => {
      expect(() => extractUUID('invalid')).toThrow();
    });
  });

  describe('generateUUIDv7', () => {
    it('generates valid UUIDv7', () => {
      const uuid = generateUUIDv7();
      expect(isValidUUID(uuid)).toBe(true);
      expect(uuid[14]).toBe('7'); // Version 7
      expect(['8', '9', 'a', 'b']).toContain(uuid[19].toLowerCase()); // Variant bits
    });

    it('generates unique UUIDs', () => {
      const uuid1 = generateUUIDv7();
      const uuid2 = generateUUIDv7();
      expect(uuid1).not.toBe(uuid2);
    });

    it('generates UUIDs with increasing timestamps', () => {
      const uuid1 = generateUUIDv7();
      // Small delay to ensure different timestamp
      const start = Date.now();
      while (Date.now() - start < 2) { /* wait */ }
      const uuid2 = generateUUIDv7();
      
      // Extract timestamps (first 12 hex chars)
      const timestamp1 = uuid1.replace(/-/g, '').slice(0, 12);
      const timestamp2 = uuid2.replace(/-/g, '').slice(0, 12);
      
      expect(parseInt(timestamp2, 16)).toBeGreaterThanOrEqual(parseInt(timestamp1, 16));
    });
  });

  describe('Crockford Base32 encoding', () => {
    it('encodes and decodes correctly', () => {
      const testCases = [0n, 1n, 32n, 1024n, BigInt('123456789012345678901234567890')];
      
      testCases.forEach(num => {
        const encoded = encodeCrockfordBase32(num);
        const decoded = decodeCrockfordBase32(encoded);
        expect(decoded).toBe(num);
      });
    });

    it('handles confusion-resistant characters', () => {
      // Test that I, L, O are properly decoded as 1, 1, 0
      expect(decodeCrockfordBase32('I')).toBe(1n);
      expect(decodeCrockfordBase32('L')).toBe(1n);
      expect(decodeCrockfordBase32('O')).toBe(0n);
      expect(decodeCrockfordBase32('i')).toBe(1n);
      expect(decodeCrockfordBase32('l')).toBe(1n);
      expect(decodeCrockfordBase32('o')).toBe(0n);
    });

    it('throws for invalid characters', () => {
      expect(() => decodeCrockfordBase32('U')).toThrow('Invalid Crockford Base32 character');
      expect(() => decodeCrockfordBase32('!')).toThrow('Invalid Crockford Base32 character');
    });

    it('is case insensitive for valid characters', () => {
      const encoded = encodeCrockfordBase32(1234n);
      const decoded1 = decodeCrockfordBase32(encoded);
      const decoded2 = decodeCrockfordBase32(encoded.toLowerCase());
      
      expect(decoded1).toBe(decoded2);
    });
  });

  describe('UUID to Base32 conversion', () => {
    it('converts UUID to Base32 and back', () => {
      const originalUuid = generateUUIDv7();
      const base32 = uuidToCrockfordBase32(originalUuid);
      const convertedUuid = crockfordBase32ToUuid(base32);
      
      expect(convertedUuid.toLowerCase()).toBe(originalUuid.toLowerCase());
    });

    it('produces shorter strings than hex', () => {
      const uuid = generateUUIDv7();
      const hex = uuid.replace(/-/g, '');
      const base32 = uuidToCrockfordBase32(uuid);
      
      expect(base32.length).toBeLessThan(hex.length);
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

  describe('isValidUUID', () => {
    it('validates correct UUID formats', () => {
      const uuid = generateUUIDv7();
      expect(isValidUUID(uuid)).toBe(true);
      
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('rejects invalid UUID formats', () => {
      expect(isValidUUID('invalid')).toBe(false);
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000-extra')).toBe(false);
      expect(isValidUUID('')).toBe(false);
    });
  });

  describe('Polymorphic ID utilities', () => {
    it('extracts prefix correctly', () => {
      const id = generatePrefixedId('user');
      const prefix = extractPrefix(id);
      expect(prefix).toBe('user');
    });

    it('hasPrefix type guard works', () => {
      const id = generatePrefixedId('user');
      expect(hasPrefix(id, 'user')).toBe(true);
      expect(hasPrefix(id, 'admin')).toBe(false);
    });

    it('handleIdByPrefix routes to correct handler', () => {
      const userId = generatePrefixedId('user');
      const adminId = generatePrefixedId('admin');
      
      const result1 = handleIdByPrefix(userId, {
        user: (uuid) => `User UUID: ${uuid}`,
        admin: (uuid) => `Admin UUID: ${uuid}`,
      });
      
      const result2 = handleIdByPrefix(adminId, {
        user: (uuid) => `User UUID: ${uuid}`,
        admin: (uuid) => `Admin UUID: ${uuid}`,
      });
      
      expect(result1).toMatch(/^User UUID: /);
      expect(result2).toMatch(/^Admin UUID: /);
    });

    it('handleIdByPrefix returns null for unknown prefix', () => {
      const id = generatePrefixedId('unknown');
      
      const result = handleIdByPrefix(id, {
        user: (uuid) => `User: ${uuid}`,
        admin: (uuid) => `Admin: ${uuid}`,
      });
      
      expect(result).toBeNull();
    });

    it('handleIdByPrefix returns null for invalid ID', () => {
      const result = handleIdByPrefix('invalid_id', {
        user: (uuid) => `User: ${uuid}`,
      });
      
      expect(result).toBeNull();
    });
  });

  describe('Validation utilities', () => {
    it('isValidPrefixedId validates format', () => {
      const validId = generatePrefixedId('test');
      expect(isValidPrefixedId(validId)).toBe(true);
      
      expect(isValidPrefixedId('invalid')).toBe(false);
      expect(isValidPrefixedId('test_')).toBe(false);
      expect(isValidPrefixedId('_ABC123')).toBe(false);
    });

    it('getIdPattern creates correct regex', () => {
      const pattern = getIdPattern('user');
      const validId = generatePrefixedId('user');
      const invalidId = generatePrefixedId('admin');
      
      expect(pattern.test(validId)).toBe(true);
      expect(pattern.test(invalidId)).toBe(false);
    });

    it('getIdPattern handles special regex characters', () => {
      const pattern = getIdPattern('test-prefix');
      const validId = generatePrefixedId('test-prefix');
      
      expect(pattern.test(validId)).toBe(true);
      expect(pattern.test('testXprefix_ABC123')).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('provides meaningful error messages', () => {
      expect(() => parsePrefixedId('invalid')).toThrow(/Invalid prefixed ID format/);
      expect(() => decodeCrockfordBase32('!')).toThrow(/Invalid Crockford Base32 character/);
    });
  });
});