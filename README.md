# Human IDs

Cross-platform human-readable ID generation using UUIDv7 and Crockford's Base32 encoding.

## Features

- 🆔 **UUIDv7-based**: Uses cryptographically secure UUIDv7 with timestamp ordering
- 🎯 **Crockford Base32**: Human-readable encoding that avoids confusion (no I, L, O, U)
- 🌐 **Cross-platform**: Works in browsers, Node.js, Edge Workers, Cloudflare Workers
- 📏 **Length guaranteed**: IDs never exceed 255 characters
- 🔧 **StandardSchema**: Compatible with modern validation libraries
- 🚀 **Zero dependencies**: No runtime dependencies (only Zod peer dep for legacy support)
- ⚡ **Fast & lightweight**: Minimal bundle size with tree-shaking support

## Installation

```bash
# npm
npm install human-ids

# pnpm
pnpm add human-ids

# yarn
yarn add human-ids
```

## Quick Start

```typescript
import { generatePrefixedId, parsePrefixedId, validatePrefixedId } from 'human-ids';

// Generate IDs with prefixes
const userId = generatePrefixedId('user');   // user_01HQR7V2M3NG4K8YXJ9WQBR2FG
const orderId = generatePrefixedId('ord');   // ord_01HQR7V2M3PH5L9ZYK0XRCST3H

// Parse IDs to get prefix and UUID
const { prefix, uuid } = parsePrefixedId(userId);
console.log(prefix); // 'user'
console.log(uuid);   // '01234567-89ab-7def-8123-456789abcdef'

// Validate IDs against expected prefix
const isValidUser = validatePrefixedId(userId, 'user'); // true
const isValidOrder = validatePrefixedId(userId, 'ord'); // false
```

## Security & Best Practices

### 🔒 **Enumeration Attack Prevention**

Traditional sequential IDs leak sensitive business information:

```typescript
// ❌ BAD: Sequential IDs are predictable and leak information
// POST /api/users -> { id: 1001 }
// POST /api/users -> { id: 1002 }
// Attacker knows you have ~1000 users and can enumerate all of them

// ✅ GOOD: Cryptographically secure, impossible to guess
const userId = generatePrefixedId('user'); // user_01HQR7V2M3NG4K8YXJ9WQBR2FG
```

### 📋 **Prefix Naming Guidelines** (Stripe-Inspired)

Following industry best practices from companies like Stripe:

```typescript
// ✅ GOOD: Short, clear prefixes (2-5 characters)
generatePrefixedId('user');        // user_...
generatePrefixedId('cust');        // cust_... (customer)
generatePrefixedId('pay');         // pay_... (payment)
generatePrefixedId('inv');         // inv_... (invoice)
generatePrefixedId('ord');         // ord_... (order)

// ✅ GOOD: Standard abbreviations when widely understood
generatePrefixedId('pi');          // pi_... (payment_intent)
generatePrefixedId('sub');         // sub_... (subscription)

// ❌ AVOID: Confusing or unclear abbreviations
generatePrefixedId('u');           // Too short, unclear
generatePrefixedId('usr');         // Ambiguous abbreviation
generatePrefixedId('customer');    // Too long, exceeds 5 characters
```

**Best Practices:**
- Use 2-5 character prefixes for readability
- Be consistent across your application
- Document your prefix conventions in a style guide
- Consider environment prefixes (`live_`, `test_`) for safety

## API Reference

This library provides a minimal, focused API with just four essential functions:

### `generatePrefixedId(prefix: string): string`

Generates a prefixed ID using UUIDv7 and Crockford Base32 encoding.

```typescript
const userId = generatePrefixedId('user');   // user_01HQR7V2M3NG4K8YXJ9WQBR2FG
const orderId = generatePrefixedId('ord');   // ord_01HQR7V2M3PH5L9ZYK0XRCST3H
```

**Features:**
- Any prefix is allowed (no character restrictions)
- Generated ID never exceeds 255 characters
- Cryptographically secure and time-ordered
- Human-readable with Crockford Base32 encoding

### `parsePrefixedId(id: string): { prefix: string; uuid: string }`

Parses a prefixed ID to extract the prefix and UUID components.

```typescript
const { prefix, uuid } = parsePrefixedId('user_01HQR7V2M3NG4K8YXJ9WQBR2FG');
console.log(prefix); // 'user'
console.log(uuid);   // '01234567-89ab-7def-8123-456789abcdef'

// Extract just what you need with destructuring
const { uuid } = parsePrefixedId(userId);        // Get UUID only
const { prefix } = parsePrefixedId(userId);      // Get prefix only
```

### `validatePrefixedId(id: string, prefix: string): boolean`

Validates that an ID has the correct prefix and format.

```typescript
const userId = generatePrefixedId('user');
validatePrefixedId(userId, 'user');    // true
validatePrefixedId(userId, 'admin');   // false
validatePrefixedId('invalid', 'user'); // false
```

### `IdSchema<T>(prefix: T): StandardSchemaV1<string, string>`

Creates a StandardSchema-compatible validator for use with modern validation libraries.

```typescript
import { IdSchema } from 'human-ids';

const userIdSchema = IdSchema('user');

// Use with any StandardSchema-compatible library
const result = userIdSchema['~standard'].validate('user_01HQR7V2M3NG4K8YXJ9WQBR2FG');
if (result.success) {
  console.log('Valid ID:', result.data);
} else {
  console.log('Validation errors:', result.issues);
}
```

## Cross-Platform Compatibility

This library works in all modern JavaScript environments:

- ✅ **Browsers** (Chrome, Firefox, Safari, Edge)
- ✅ **Node.js** (18+)
- ✅ **Edge Workers** (Vercel, Netlify)
- ✅ **Cloudflare Workers**
- ✅ **Bun**, **Deno**

The library uses the Web Crypto API (`crypto.getRandomValues`) which is available in all these environments.

## Why UUIDv7?

UUIDv7 provides several advantages over UUIDv4:

- **Time-ordered**: IDs sort chronologically
- **Database-friendly**: Better for primary keys and indexes
- **Collision-resistant**: Cryptographically secure random bits
- **Future-proof**: Latest UUID standard (RFC 4122 bis)

## Why Crockford Base32?

Crockford's Base32 is superior to Base64 for human-readable IDs:

- **No confusion**: Excludes I, L, O, U to prevent misreading
- **Case-insensitive**: Works with sloppy typing
- **URL-safe**: No special characters that need encoding
- **Compact**: More efficient than hex encoding

## Database Integration

### Recommended Storage Pattern

Store only the UUID portion in your database, not the full prefixed ID. The prefix can be inferred from the table name or context:

```sql
-- ✅ RECOMMENDED: Store only UUID, infer prefix from context
CREATE TABLE users (
  id UUID PRIMARY KEY,                    -- '01234567-89ab-7def-8123-456789abcdef'
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY,                    -- '01234567-89ab-7def-8123-456789abcdef'  
  user_id UUID REFERENCES users(id),
  total DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Working with Database Records

When reading from the database, reconstruct the prefixed ID as needed:

```typescript
// Database query returns raw UUID
const userRecord = await db.users.findById(uuid);

// Reconstruct prefixed ID for API responses using internal library logic
// (The encoding is handled internally by generatePrefixedId)
const user = {
  id: `user_${/* base32 encoded UUID from userRecord.id */}`,
  email: userRecord.email,
  // ... other fields
};

// For polymorphic relationships, store the full prefixed ID
CREATE TABLE activities (
  id UUID PRIMARY KEY,
  subject_id VARCHAR(255),               -- 'user_01HQR7V2M3NG4K8YXJ9WQBR2FG' or 'ord_01HQR7V2M3PH5L9ZYK0XRCST3H'
  action VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Benefits of This Approach

- **Storage efficiency**: UUIDs use less space than full prefixed strings
- **Database performance**: Native UUID types are optimized for indexing and queries  
- **Flexibility**: Easy to change prefix conventions without database migrations
- **Clean separation**: Business logic (prefixes) separate from storage layer

## Development

This project uses [pnpm](https://pnpm.io/) with corepack for package management:

```bash
# Enable corepack (if not already enabled)
corepack enable

# Install dependencies
pnpm install

# Build the library
pnpm run build

# Run tests
pnpm run test

# Run tests with coverage
pnpm run test:coverage

# Create a changeset (for releases)
pnpm changeset
```

## License

MIT