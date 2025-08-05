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
import { generatePrefixedId, parsePrefixedId, handleIdByPrefix } from 'human-ids';

// Generate IDs with prefixes
const userId = generatePrefixedId('user');   // user_01HQR7V2M3NG4K8YXJ9WQBR2FG
const orderId = generatePrefixedId('order'); // order_01HQR7V2M3PH5L9ZYK0XRCST3H

// Parse IDs to get prefix and UUID
const { prefix, uuid } = parsePrefixedId(userId);
console.log(prefix); // 'user'
console.log(uuid);   // '01234567-89ab-7def-8123-456789abcdef'

// Polymorphic lookups based on prefix
const result = handleIdByPrefix(userId, {
  user: (uuid) => fetchUser(uuid),
  order: (uuid) => fetchOrder(uuid),
  product: (uuid) => fetchProduct(uuid),
});
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
// ✅ GOOD: Clear, descriptive prefixes
generatePrefixedId('user');        // user_...
generatePrefixedId('customer');    // customer_...
generatePrefixedId('payment');     // payment_...
generatePrefixedId('invoice');     // invoice_...

// ✅ GOOD: Consistent abbreviations when needed
generatePrefixedId('pi');          // pi_... (payment_intent)
generatePrefixedId('sub');         // sub_... (subscription)

// ❌ AVOID: Confusing or unclear abbreviations
generatePrefixedId('u');           // Too short, unclear
generatePrefixedId('usr');         // Ambiguous abbreviation
```

**Best Practices:**
- Use 2-5 character prefixes for readability
- Be consistent across your application
- Document your prefix conventions in a style guide
- Consider environment prefixes (`live_`, `test_`) for safety

## API Reference

### Core Functions

#### `generatePrefixedId(prefix: string): string`

Generates a prefixed ID using UUIDv7 and Crockford Base32 encoding.

```typescript
const id = generatePrefixedId('user'); // user_01HQR7V2M3NG4K8YXJ9WQBR2FG
```

**Constraints:**
- Any prefix is allowed (no character restrictions)
- Generated ID never exceeds 255 characters

#### `parsePrefixedId(id: string): { prefix: string; uuid: string }`

Parses a prefixed ID to extract the prefix and UUID.

```typescript
const { prefix, uuid } = parsePrefixedId('user_01HQR7V2M3NG4K8YXJ9WQBR2FG');
```

#### `validatePrefixedId(id: string, prefix: string): boolean`

Validates that an ID has the correct prefix and format.

```typescript
const isValid = validatePrefixedId('user_01HQR7V2M3NG4K8YXJ9WQBR2FG', 'user'); // true
```

#### `extractUUID(id: string): string`

Extracts just the UUID portion from a prefixed ID.

```typescript
const uuid = extractUUID('user_01HQR7V2M3NG4K8YXJ9WQBR2FG');
```

#### `extractPrefix(id: string): string`

Extracts just the prefix portion from a prefixed ID.

```typescript
const prefix = extractPrefix('user_01HQR7V2M3NG4K8YXJ9WQBR2FG'); // 'user'
```

### Polymorphic ID Utilities

#### `handleIdByPrefix<T>(id: string, handlers: T): ReturnType<T[keyof T]> | null`

Route ID handling based on prefix - perfect for polymorphic lookups.

```typescript
const result = handleIdByPrefix('user_01HQR7V2M3NG4K8YXJ9WQBR2FG', {
  user: (uuid) => getUserById(uuid),
  order: (uuid) => getOrderById(uuid),
  product: (uuid) => getProductById(uuid),
});
// Automatically calls getUserById with the UUID portion
```

#### `hasPrefix<T>(id: string, prefix: T): id is \`${T}_${string}\``

Type-safe prefix checking with TypeScript type guards.

```typescript
if (hasPrefix(someId, 'user')) {
  // TypeScript knows someId is of type `user_${string}`
  console.log('This is a user ID');
}
```

### Validation Utilities

#### `isValidPrefixedId(id: string): boolean`

Validates if a string matches the general prefixed ID format.

```typescript
isValidPrefixedId('user_01HQR7V2M3NG4K8YXJ9WQBR2FG'); // true
isValidPrefixedId('invalid'); // false
```

#### `getIdPattern(prefix: string): RegExp`

Gets a regex pattern for validating IDs with a specific prefix.

```typescript
const userIdPattern = getIdPattern('user');
userIdPattern.test('user_01HQR7V2M3NG4K8YXJ9WQBR2FG'); // true
userIdPattern.test('admin_01HQR7V2M3NG4K8YXJ9WQBR2FG'); // false
```

### Validation (StandardSchema)

#### `IdSchema<T>(prefix: T): StandardSchemaV1<string, string>`

Creates a StandardSchema-compatible validator for prefixed IDs.

```typescript
import { IdSchema } from 'human-ids';

const userIdSchema = IdSchema('user');

// Use with any StandardSchema-compatible library
const result = userIdSchema['~standard'].validate('user_01HQR7V2M3NG4K8YXJ9WQBR2FG');
if (result.success) {
  console.log('Valid ID:', result.data);
}
```

### Utility Functions

#### `generateUUIDv7(): string`

Generates a cryptographically secure UUIDv7.

```typescript
const uuid = generateUUIDv7(); // 01234567-89ab-7def-8123-456789abcdef
```

#### `isValidUUID(uuid: string): boolean`

Validates UUID format.

```typescript
const isValid = isValidUUID('01234567-89ab-7def-8123-456789abcdef'); // true
```

### Encoding Functions

#### `encodeCrockfordBase32(num: bigint): string`
#### `decodeCrockfordBase32(str: string): bigint`
#### `uuidToCrockfordBase32(uuid: string): string`
#### `crockfordBase32ToUuid(base32: string): string`

Low-level encoding utilities for advanced use cases.

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

### Store Full Prefixed IDs

Store the complete prefixed ID in your database for consistency and ease of use:

```sql
-- ✅ GOOD: Store full prefixed ID
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY, -- 'user_01HQR7V2M3NG4K8YXJ9WQBR2FG'
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ❌ AVOID: Separating prefix and ID complicates queries
CREATE TABLE users (
  prefix VARCHAR(10),
  uuid_part VARCHAR(245),
  -- ... more complex to work with
);
```

### Example Usage with Popular ORMs

#### Prisma
```typescript
// schema.prisma
model User {
  id    String @id @default("user_" + uuid())
  email String @unique
}

// Usage
const user = await prisma.user.create({
  data: {
    id: generatePrefixedId('user'),
    email: 'user@example.com'
  }
});
```

#### TypeORM
```typescript
@Entity()
export class User {
  @PrimaryColumn()
  id: string = generatePrefixedId('user');
  
  @Column()
  email: string;
}
```

#### Sequelize
```typescript
const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING(255),
    primaryKey: true,
    defaultValue: () => generatePrefixedId('user')
  },
  email: DataTypes.STRING
});
```

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