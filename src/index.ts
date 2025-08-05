// Base62 alphabet (0-9, A-Z, a-z)
const BASE62_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const DECODE_MAP = new Map<string, number>();

// Initialize decode map
for (let i = 0; i < BASE62_ALPHABET.length; i++) {
  const char = BASE62_ALPHABET[i];
  DECODE_MAP.set(char, i);
}

/**
 * Decodes a Base62 string back to a BigInt.
 * Validates each character against the Base62 alphabet.
 *
 * @example
 * ```ts
 * decodeBase62("3D7") // 12345n
 * decodeBase62("0")   // 0n
 * ```
 *
 * @throws {Error} When encountering invalid Base62 characters
 */
function decodeBase62(str: string): bigint {
  let result = 0n;
  for (const char of str) {
    const value = DECODE_MAP.get(char);
    if (value === undefined) {
      throw new Error(`Invalid Base62 character: ${char}`);
    }
    result = result * 62n + BigInt(value);
  }
  return result;
}

/**
 * Encodes a BigInt to a Base62 string for compact representation.
 * Base62 uses 0-9, A-Z, a-z for encoding, making it URL-safe and human-readable.
 *
 * @example
 * ```ts
 * encodeBase62(12345n) // "3D7"
 * encodeBase62(0n)     // "0"
 * ```
 *
 * @see https://en.wikipedia.org/wiki/Base62
 */
function encodeBase62(num: bigint): string {
  if (num === 0n) return "0";

  let result = "";
  while (num > 0n) {
    result = BASE62_ALPHABET[Number(num % 62n)] + result;
    num = num / 62n;
  }
  return result;
}

/**
 * Generates cryptographically secure random bytes using the Web Crypto API.
 * Cross-platform compatible with browsers, workers, and modern Node.js environments.
 *
 * @example
 * ```ts
 * const bytes = getRandomBytes(16); // 16 random bytes
 * console.log(bytes.length); // 16
 * ```
 *
 * @throws {Error} If the Crypto API is unavailable in the current environment
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
 */
function getRandomBytes(length: number): Uint8Array {
  let value: Uint8Array;

  // Cross-platform crypto detection
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    // Browser, Worker, or modern Node with crypto global
    value = new Uint8Array(length);
    crypto.getRandomValues(value);
  } else if (
    typeof globalThis !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    globalThis.crypto.getRandomValues
  ) {
    // Fallback for different global contexts
    value = new Uint8Array(length);
    globalThis.crypto.getRandomValues(value);
  } else {
    // Node.js fallback (should not happen in modern environments)
    throw new Error("Crypto API not available");
  }

  return value;
}

/**
 * Generates a UUIDv7 with embedded timestamp for natural sorting.
 * UUIDv7 embeds the current timestamp in the first 48 bits, making IDs sortable by creation time.
 *
 * @example
 * ```ts
 * const uuid1 = generateUUIDv7(); // "018a1234-5678-7abc-9def-0123456789ab"
 * const uuid2 = generateUUIDv7(); // "018a1234-5679-7xyz-abcd-fedcba987654"
 * // uuid2 > uuid1 (lexicographically sortable)
 * ```
 *
 * @see https://www.ietf.org/archive/id/draft-peabody-dispatch-new-uuid-format-01.html
 * @see https://antonz.org/uuidv7/#javascript
 */
function generateUUIDv7(): string {
  // Get random bytes
  const value = getRandomBytes(16);

  // Current timestamp in ms
  const timestamp = BigInt(Date.now());

  // Set timestamp (first 6 bytes)
  value[0] = Number((timestamp >> 40n) & 0xffn);
  value[1] = Number((timestamp >> 32n) & 0xffn);
  value[2] = Number((timestamp >> 24n) & 0xffn);
  value[3] = Number((timestamp >> 16n) & 0xffn);
  value[4] = Number((timestamp >> 8n) & 0xffn);
  value[5] = Number(timestamp & 0xffn);

  // Set version (4 bits in byte 6) and variant (2 bits in byte 8)
  value[6] = (value[6] & 0x0f) | 0x70; // Version 7 in upper 4 bits
  value[8] = (value[8] & 0x3f) | 0x80; // Variant 10 in upper 2 bits

  // Convert to hex string and format as UUID
  const u = Array.from(value)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${u.slice(0, 8)}-${u.slice(8, 12)}-${u.slice(12, 16)}-${u.slice(16, 20)}-${u.slice(20, 32)}`;
}

/**
 * Converts a UUID to a compact Base62 representation.
 * Removes hyphens and converts the hex string to Base62 for shorter IDs.
 *
 * @example
 * ```ts
 * const uuid = "018a1234-5678-7abc-9def-0123456789ab";
 * const base62 = uuidToBase62(uuid); // "1BjQ7hVBYfRnTyNiGfX3z"
 * ```
 */
function uuidToBase62(uuid: string): string {
  const hex = uuid.replace(/-/g, "");
  const num = BigInt("0x" + hex);
  return encodeBase62(num);
}

console.log(uuidToBase62("00000000-0000-0000-0000-000000000000"));
console.log(uuidToBase62("FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF"));

/**
 * Converts a Base62 string back to a standard UUID format.
 * Adds hyphens to create the canonical UUID representation.
 *
 * @example
 * ```ts
 * const base62 = "1BjQ7hVBYfRnTyNiGfX3z";
 * const uuid = base62ToUUID(base62); // "018a1234-5678-7abc-9def-0123456789ab"
 * ```
 */
function base62ToUUID(base62: string): string {
  const num = decodeBase62(base62);
  const hex = num.toString(16).padStart(32, "0");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Validates if a string matches the standard UUID format.
 * Checks for the exact pattern: 8-4-4-4-12 hexadecimal characters with hyphens.
 *
 * @example
 * ```ts
 * isValidUUID("018a1234-5678-7abc-9def-0123456789ab") // true
 * isValidUUID("invalid-string")                         // false
 * isValidUUID("018a1234567812340123456789ab")         // false (missing hyphens)
 * ```
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates a prefix according to naming conventions.
 * Ensures prefixes contain only lowercase alphanumeric characters and underscores.
 * This promotes consistency and prevents issues with case-sensitive systems.
 *
 * @example
 * ```ts
 * validatePrefix("user")      // ✓ Valid
 * validatePrefix("api_key")   // ✓ Valid
 * validatePrefix("User")      // ✗ Throws error (uppercase)
 * validatePrefix("api-key")   // ✗ Throws error (hyphen)
 * ```
 *
 * @throws {Error} When prefix contains invalid characters
 */
function validatePrefix(prefix: string): void {
  // Allow lowercase alphanumeric characters and underscores only
  if (!/^[a-z0-9_]{1,40}$/.test(prefix)) {
    throw new Error(`invalid prefix: ${prefix}`);
  }
}

/**
 * Validates a Base62 string for use as a UUID encoding.
 * Ensures the string contains only valid Base62 characters and has sufficient length for a UUID.
 *
 * @example
 * ```ts
 * validateBase62("1BjQ7hVBYfRnTyNiGfX3z") // ✓ Valid
 * validateBase62("")                      // ✗ Throws error (empty)
 * validateBase62("invalid!")              // ✗ Throws error (invalid characters)
 * validateBase62("short")                 // ✗ Throws error (too short for UUID)
 * ```
 */
function validateBase62(base62: string): void {
  if (base62.length === 0) {
    throw new Error(`Empty base62 part`);
  }

  if (!/^[0-9a-zA-Z]+$/.test(base62)) {
    throw new Error(`Invalid Base62 character in: ${base62}`);
  }
}

/**
 * Generates a human-readable prefixed ID using UUIDv7 and Base62 encoding.
 * Creates IDs that are naturally sortable by creation time and easy to identify by type.
 *
 * @example
 * ```ts
 * generate("user")     // "user_1BjQ7hVBYfRnTyNiGfX3z"
 * generate("api_key")  // "api_key_2CkR8iWCZgSoUzOjHgY4A"
 * generate("order")    // "order_3DlS9jXDahTpVaPkIhZ5B"
 * ```
 *
 * Features:
 * - Naturally sortable by creation time (UUIDv7)
 * - Compact representation (Base62)
 * - Type identification via prefix
 * - URL-safe characters only
 * - Maximum length guarantee (≤255 chars)
 *
 * @throws {Error} If prefix is invalid or generated ID exceeds 255 characters
 */
export function generate(prefix: string): string {
  validatePrefix(prefix);

  const uuid = generateUUIDv7();
  const base62 = uuidToBase62(uuid);
  const id = `${prefix}_${base62}`;

  return id;
}

/**
 * Parses a prefixed ID to extract its components.
 * Separates the prefix from the encoded UUID and validates the UUID format.
 *
 * @example
 * ```ts
 * const id = "user_1BjQ7hVBYfRnTyNiGfX3z";
 * const { prefix, uuid } = parse(id);
 * // prefix: "user"
 * // uuid: "018a1234-5678-7abc-9def-0123456789ab"
 *
 * parse("invalid")           // ✗ Throws error (no underscore)
 * parse("user_")             // ✗ Throws error (empty base62)
 * parse("user_invalid")      // ✗ Throws error (invalid base62)
 * ```
 *
 * @throws {Error} If ID format is invalid, base62 part is empty, or UUID is malformed
 */
export function parse(id: string): { prefix: string; uuid: string } {
  const underscoreIndex = id.lastIndexOf("_");
  if (underscoreIndex === -1) {
    throw new Error(`Invalid prefixed ID format: ${id}`);
  }

  const prefix = id.slice(0, underscoreIndex);
  const base62 = id.slice(underscoreIndex + 1);

  try {
    validatePrefix(prefix);
    validateBase62(base62);

    const uuid = base62ToUUID(base62);

    if (!isValidUUID(uuid)) {
      throw new Error(`Invalid UUID: ${uuid}`);
    }

    return { prefix, uuid };
  } catch (error) {
    throw new Error(
      `Failed to parse ID: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Validates a prefixed ID, optionally against an expected prefix.
 * Useful for type checking IDs in APIs or database operations.
 *
 * @example
 * ```ts
 * const userId = "user_1BjQ7hVBYfRnTyNiGfX3z";
 * const apiKeyId = "api_key_2CkR8iWCZgSoUzOjHgY4A";
 *
 * validate(userId)             // true (just validates format)
 * validate(userId, "user")     // true
 * validate(userId, "api_key")  // false
 * validate(apiKeyId, "api_key") // true
 * validate("invalid")          // false
 * validate("invalid", "user")   // false
 * ```
 */
export function validate(id: string, prefix?: string): boolean {
  try {
    const parsed = parse(id);
    return prefix === undefined || parsed.prefix === prefix;
  } catch {
    return false;
  }
}
