Fluid
=====

**Friendly Labeled Unique Identifiers**

[![npm](https://img.shields.io/npm/v/@wadefletch/fluid?color=gray&label=%20&logo=npm)][npm]
[![includes TypeScript types](https://img.shields.io/npm/types/@wadefletch/fluid?color=333&label=%20&logo=typescript&logoColor=58baee)][typescript]
![node-current](https://img.shields.io/node/v/@wadefletch/fluid?color=444&label=%20&logo=node.js)
[![MIT license](https://img.shields.io/npm/l/@wadefletch/fluid?color=3ae)][license]

[npm]: https://www.npmjs.com/package/@wadefletch/fluid
[typescript]: https://github.com/wadefletcher/fluid/blob/main/src/index.ts
[license]: ./LICENSE


Cross-platform human-readable ID generation using UUIDv7 and Base62 encoding.

## Features

- 🆔 **UUIDv7-based**: Uses cryptographically secure UUIDv7 with timestamp ordering
- 🎯 **Base62 encoding**: Compact, URL-safe encoding using 0-9, A-Z, a-z
- 🌐 **Cross-platform**: Works in browsers, Node.js, Edge Workers, Cloudflare Workers
- 📏 **Compact format**: Efficient representation with reasonable length limits
- 🚀 **Zero dependencies**: No runtime dependencies
- ⚡ **Fast & lightweight**: Minimal bundle size with tree-shaking support

## Installation

```bash
# npm
npm install fluid

# pnpm
pnpm add fluid

# yarn
yarn add fluid
```

## Quick Start

```typescript
import { generate, parse, validate } from "fluid";

// Generate IDs with prefixes
const userId = generate("user"); // user_1BjQ7hVBYfRnTyNiGfX3z
const orderId = generate("order"); // order_2CkR8iWCZgSoUzOjHgY4A

// Parse IDs to get prefix and UUID
const { prefix, uuid } = parse(userId);
console.log(prefix); // 'user'
console.log(uuid); // '018a1234-5678-7abc-9def-0123456789ab'

// Validate IDs against expected prefix
const isValidUser = validate(userId, "user"); // true
const isValidOrder = validate(userId, "order"); // false
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
const userId = generate("user"); // user_1BjQ7hVBYfRnTyNiGfX3z
```

### 📋 **Prefix Naming Guidelines** (Stripe-Inspired)

Following industry best practices from companies like Stripe:

```typescript
// ✅ GOOD: Short, clear prefixes (2-5 characters)
generate("user"); // user_...
generate("cust"); // cust_... (customer)
generate("pay"); // pay_... (payment)
generate("inv"); // inv_... (invoice)
generate("ord"); // ord_... (order)

// ✅ GOOD: Standard abbreviations when widely understood
generate("pi"); // pi_... (payment_intent)
generate("sub"); // sub_... (subscription)

// ❌ AVOID: Confusing or unclear abbreviations
generate("u"); // Too short, unclear
generate("usr"); // Ambiguous abbreviation
generate("customer"); // Too long, exceeds 5 characters
```

**Prefix Requirements:**

- Only lowercase letters, numbers, and underscores allowed
- Maximum 40 characters in length
- Cannot be empty
- Be consistent across your application
- Document your prefix conventions in a style guide

## API Reference

This library provides a minimal, focused API with just three essential functions:

### `generate(prefix: string): string`

Generates a prefixed ID using UUIDv7 and Base62 encoding.

```typescript
const userId = generate("user"); // user_1BjQ7hVBYfRnTyNiGfX3z
const orderId = generate("order"); // order_2CkR8iWCZgSoUzOjHgY4A
```

**Features:**

- Prefix must contain only lowercase letters, numbers, and underscores
- Cryptographically secure and time-ordered
- Compact representation with Base62 encoding

### `parse(id: string): { prefix: string; uuid: string }`

Parses a prefixed ID to extract the prefix and UUID components.

```typescript
const { prefix, uuid } = parse("user_1BjQ7hVBYfRnTyNiGfX3z");
console.log(prefix); // 'user'
console.log(uuid); // '018a1234-5678-7abc-9def-0123456789ab'

// Extract just what you need with destructuring
const { uuid } = parse(userId); // Get UUID only
const { prefix } = parse(userId); // Get prefix only
```

### `validate(id: string, prefix?: string): boolean`

Validates that an ID has the correct format, and optionally checks against an expected prefix.

```typescript
const userId = generate("user");
validate(userId); // true - validates format only
validate(userId, "user"); // true - validates format and prefix
validate(userId, "admin"); // false - wrong prefix
validate("invalid", "user"); // false - invalid format
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

## Why Base62?

Base62 encoding provides an optimal balance for human-readable IDs:

- **URL-safe**: Uses only alphanumeric characters (0-9, A-Z, a-z)
- **Compact**: More efficient than hex or Base32 encoding
- **Readable**: No special characters that could cause confusion
- **Standard**: Widely used encoding format

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

// Reconstruct prefixed ID for API responses
// You would need to implement UUID to Base62 conversion or store the full ID
const user = {
  id: `user_${/* base62 encoded UUID from userRecord.id */}`,
  email: userRecord.email,
  // ... other fields
};

// For polymorphic relationships, store the full prefixed ID
CREATE TABLE activities (
  id UUID PRIMARY KEY,
  subject_id VARCHAR(255),               -- 'user_1BjQ7hVBYfRnTyNiGfX3z' or 'order_2CkR8iWCZgSoUzOjHgY4A'
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
