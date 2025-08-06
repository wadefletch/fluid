# Fluid

_**F**riendly **L**abeled **U**nique **Id**entifiers_

[![npm](https://img.shields.io/npm/v/@wadefletch/fluid?color=gray&label=%20&logo=npm)][npm]
[![includes TypeScript types](https://img.shields.io/npm/types/@wadefletch/fluid?color=333&label=%20&logo=typescript&logoColor=58baee)][typescript]
![node-current](https://img.shields.io/node/v/@wadefletch/fluid?color=444&label=%20&logo=node.js)
[![MIT license](https://img.shields.io/npm/l/@wadefletch/fluid?color=3ae)][license]

[npm]: https://www.npmjs.com/package/@wadefletch/fluid
[typescript]: https://github.com/wadefletcher/human-ids/blob/main/src/index.ts
[license]: ./LICENSE

Generate time-ordered prefixed IDs like `user_1BjQ7hVBYfRnTyNiGfX3z` and `order_2CkR8iWCZgSoUzOjHgY4A` using UUIDv7 and Base62 encoding.

```typescript
import { generate, parse, validate } from "@wadefletch/fluid";

// Generate time-ordered IDs with meaningful prefixes
const userId = generate("user"); // user_1BjQ7hVBYfRnTyNiGfX3z
const orderId = generate("order"); // order_2CkR8iWCZgSoUzOjHgY4A

// Parse to extract components
const { prefix, uuid } = parse(userId);
console.log(prefix); // "user"
console.log(uuid); // "018a1234-5678-7abc-9def-0123456789ab"

// Validate format and prefix
validate(userId, "user"); // true
validate(userId, "order"); // false
```

## Installation

```bash
npm install @wadefletch/fluid
```

## Usage

### Generating IDs

```typescript
import { generate, parse, validate } from "@wadefletch/fluid";

// Generate IDs with meaningful prefixes
const userId = generate("user"); // user_1BjQ7hVBYfRnTyNiGfX3z
const orderId = generate("order"); // order_2CkR8iWCZgSoUzOjHgY4A
const apiKey = generate("api_key"); // api_key_3ElT0kYEbiVqWbQlJiA6C
```

### Parsing IDs

```typescript
const id = "user_1BjQ7hVBYfRnTyNiGfX3z";
const { prefix, uuid } = parse(id);

console.log(prefix); // "user"
console.log(uuid); // "018a1234-5678-7abc-9def-0123456789ab"
```

### Validation

```typescript
const userId = generate("user");

// Validate format only
validate(userId); // true

// Validate format and prefix
validate(userId, "user"); // true
validate(userId, "admin"); // false

// Invalid IDs return false
validate("not-an-id"); // false
```

## Features

- **Time-ordered**: IDs sort chronologically using UUIDv7
- **Compact**: Base62 encoding for shorter, cleaner IDs
- **Type-safe**: Full TypeScript support with strict typing
- **Cross-platform**: Works in browsers, Node.js, Deno, and edge runtimes
- **Zero dependencies**: No external dependencies
- **Prefix validation**: Enforces consistent naming conventions

## Should I Use This?

Fluid is designed for applications that need:

- **Human-readable IDs** that can be easily identified by type
- **Sortable identifiers** that maintain chronological order
- **URL-safe strings** without special characters
- **Database-friendly** primary keys that index efficiently

Consider alternatives if you need:

- Maximum performance (raw UUIDs are faster)
- Shorter IDs (consider nanoid or similar)
- Custom encoding schemes
- Cryptographic guarantees beyond standard UUIDv7

## Database Integration

### Storage Strategy

```typescript
// Generate ID for new user
const userId = generate("user"); // user_1BjQ7hVBYfRnTyNiGfX3z
const { uuid } = parse(userId); // Extract UUID for database

// Store UUID in database, use prefixed ID in APIs
await db.users.create({
  id: uuid, // Store raw UUID: 018a1234-5678-7abc-9def-0123456789ab
  email: "user@example.com",
});

// Return prefixed ID in API responses
return { id: userId, email: "user@example.com" };
```

### Database Schema

```sql
-- Store UUIDs for efficient indexing
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- For polymorphic relationships, store full prefixed IDs
CREATE TABLE activities (
  id UUID PRIMARY KEY,
  subject_id VARCHAR(255), -- "user_1BjQ7hVBYfRnTyNiGfX3z"
  action VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## References

- [ui7](https://github.com/silverlyra/ui7)
- [UUIDv7 in 33 languages](https://antonz.org/uuidv7/#javascript)
- [Designing APIs for humans: Object IDs](https://dev.to/stripe/designing-apis-for-humans-object-ids-3o5a)
- [Stripe keys and IDs](https://gist.github.com/fnky/76f533366f75cf75802c8052b577e2a5)
