/**
 * Human-readable ID generation library using UUIDv7 and Crockford's Base32 encoding
 * Cross-platform compatible: Browser, Node.js, Edge Workers, Cloudflare Workers
 */

// Crockford's Base32 alphabet (excludes I, L, O, U to avoid confusion)
const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const DECODE_MAP = new Map<string, number>();

// Initialize decode map with case-insensitive mapping and confusion-resistant characters
for (let i = 0; i < CROCKFORD_ALPHABET.length; i++) {
  const char = CROCKFORD_ALPHABET[i];
  DECODE_MAP.set(char, i);
  DECODE_MAP.set(char.toLowerCase(), i);
}
// Handle confusion-prone characters as per Crockford spec
DECODE_MAP.set('I', 1); DECODE_MAP.set('i', 1);
DECODE_MAP.set('L', 1); DECODE_MAP.set('l', 1);
DECODE_MAP.set('O', 0); DECODE_MAP.set('o', 0);

/**
 * Encodes a BigInt to Crockford Base32
 */
function encodeCrockfordBase32(num: bigint): string {
  if (num === 0n) return "0";
  
  let result = "";
  while (num > 0n) {
    result = CROCKFORD_ALPHABET[Number(num % 32n)] + result;
    num = num / 32n;
  }
  return result;
}

/**
 * Decodes a Crockford Base32 string to BigInt
 */
function decodeCrockfordBase32(str: string): bigint {
  let result = 0n;
  for (const char of str) {
    const value = DECODE_MAP.get(char);
    if (value === undefined) {
      throw new Error(`Invalid Crockford Base32 character: ${char}`);
    }
    result = result * 32n + BigInt(value);
  }
  return result;
}

/**
 * Cross-platform cryptographically secure UUIDv7 generation
 */
function generateUUIDv7(): string {
  // Get current timestamp in milliseconds
  const timestamp = BigInt(Date.now());
  
  // Get crypto random bytes (12 bytes for rand_a and rand_b)
  let randomBytes: Uint8Array;
  
  // Cross-platform crypto detection
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Browser, Worker, or modern Node with crypto global
    randomBytes = new Uint8Array(12);
    crypto.getRandomValues(randomBytes);
  } else if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    // Fallback for different global contexts
    randomBytes = new Uint8Array(12);
    globalThis.crypto.getRandomValues(randomBytes);
  } else {
    // Node.js fallback (should not happen in modern environments)
    throw new Error('Crypto API not available');
  }
  
  // Build UUIDv7: 48-bit timestamp + 12-bit rand_a + 2 version bits + 6-bit rand_b + 2 variant bits + 56-bit rand_c
  const bytes = new Uint8Array(16);
  
  // 48-bit timestamp (6 bytes)
  bytes[0] = Number((timestamp >> 40n) & 0xFFn);
  bytes[1] = Number((timestamp >> 32n) & 0xFFn);
  bytes[2] = Number((timestamp >> 24n) & 0xFFn);
  bytes[3] = Number((timestamp >> 16n) & 0xFFn);
  bytes[4] = Number((timestamp >> 8n) & 0xFFn);
  bytes[5] = Number(timestamp & 0xFFn);
  
  // 12-bit rand_a + 4-bit version (bytes 6-7)
  bytes[6] = randomBytes[0];
  bytes[7] = (randomBytes[1] & 0x0F) | 0x70; // Version 7
  
  // 2-bit variant + 62-bit rand_b (bytes 8-15)
  bytes[8] = (randomBytes[2] & 0x3F) | 0x80; // Variant 10
  bytes[9] = randomBytes[3];
  bytes[10] = randomBytes[4];
  bytes[11] = randomBytes[5];
  bytes[12] = randomBytes[6];
  bytes[13] = randomBytes[7];
  bytes[14] = randomBytes[8];
  bytes[15] = randomBytes[9];
  
  // Convert to hex string and format as UUID
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Converts UUID to Crockford Base32
 */
function uuidToCrockfordBase32(uuid: string): string {
  const hex = uuid.replace(/-/g, '');
  const num = BigInt('0x' + hex);
  return encodeCrockfordBase32(num);
}

/**
 * Converts Crockford Base32 to UUID
 */
function crockfordBase32ToUuid(base32: string): string {
  const num = decodeCrockfordBase32(base32);
  const hex = num.toString(16).padStart(32, '0');
  
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Validates if a string is a valid UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}


/**
 * StandardSchema interface implementation
 */
interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (value: unknown) => { success: true; data: Output } | { success: false; issues: Array<{ message: string }> };
  };
}

/**
 * Creates a StandardSchema-compatible validator for prefixed IDs
 */
function createIdSchema<T extends string>(prefix: T): StandardSchemaV1<string, string> {
  return {
    '~standard': {
      version: 1,
      vendor: 'human-ids',
      validate: (value: unknown) => {
        if (typeof value !== 'string') {
          return { success: false, issues: [{ message: 'Expected string' }] };
        }
        
        try {
          const parsed = parsePrefixedId(value);
          if (parsed.prefix !== prefix) {
            return { success: false, issues: [{ message: `Invalid ${prefix} ID format` }] };
          }
          return { success: true, data: value };
        } catch (error) {
          return { success: false, issues: [{ message: error instanceof Error ? error.message : 'Invalid ID format' }] };
        }
      }
    }
  };
}

/**
 * Generates a prefixed ID using UUIDv7 and Crockford Base32 encoding
 * @param prefix - Prefix for the ID
 * @returns A human-readable prefixed ID
 */
export function generatePrefixedId(prefix: string): string {
  const uuid = generateUUIDv7();
  const base32 = uuidToCrockfordBase32(uuid);
  const id = `${prefix}_${base32}`;
  
  // Ensure ID never exceeds 255 characters
  if (id.length > 255) {
    throw new Error(`Generated ID exceeds 255 characters: ${id.length}`);
  }
  
  return id;
}

/**
 * Parses a prefixed ID to extract prefix and UUID
 * @param id - The prefixed ID to parse
 * @returns Object containing prefix and uuid
 */
export function parsePrefixedId(id: string): { prefix: string; uuid: string } {
  const underscoreIndex = id.indexOf('_');
  if (underscoreIndex === -1) {
    throw new Error(`Invalid prefixed ID format: ${id}`);
  }
  
  const prefix = id.slice(0, underscoreIndex);
  const base32 = id.slice(underscoreIndex + 1);
  
  try {
    const uuid = crockfordBase32ToUuid(base32);
    
    if (!isValidUUID(uuid)) {
      throw new Error(`Invalid UUID: ${uuid}`);
    }
    
    return { prefix, uuid };
  } catch (error) {
    throw new Error(`Failed to parse ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates a prefixed ID against a specific prefix
 * @param id - The ID to validate
 * @param prefix - The expected prefix
 * @returns true if valid, false otherwise
 */
export function validatePrefixedId(id: string, prefix: string): boolean {
  try {
    const parsed = parsePrefixedId(id);
    return parsed.prefix === prefix;
  } catch {
    return false;
  }
}

/**
 * Creates a StandardSchema-compatible validator for prefixed IDs
 * @param prefix - The expected prefix for validation
 * @returns StandardSchema validator instance
 */
export function IdSchema<T extends string>(prefix: T): StandardSchemaV1<string, string> {
  return createIdSchema(prefix);
}


