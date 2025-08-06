import { describe, it, expect } from "vitest";
import { generate, parse, validate, timestamp } from "./index";

describe("generate", () => {
  describe("format and length", () => {
    it("generates prefixed id with correct format", () => {
      const id = generate("user");
      expect(id).toMatch(/^user_[0-9A-Za-z]+$/);
      expect(id.length).toBeGreaterThan(5);
      expect(id.length).toBeLessThanOrEqual(63);
    });

    it("ensures id never exceeds 63 characters with normal and long prefix", () => {
      const normalId = generate("normal_prefix");
      const longPrefix = "a".repeat(40);
      const longId = generate(longPrefix);
      expect(normalId.length).toBeLessThanOrEqual(63);
      expect(longId.length).toBeLessThanOrEqual(63);
    });
  });

  describe("uniqueness", () => {
    it("generates unique ids", () => {
      const id1 = generate("test");
      const id2 = generate("test");
      expect(id1).not.toBe(id2);
    });

    it("generates multiple unique ids in sequence", () => {
      const ids = Array.from({ length: 100 }, () => generate("seq"));
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(100);
    });
  });

  describe("prefix validation", () => {
    const validPrefixes = [
      "test_underscore",
      "live",
      "test",
      "test123",
      "test_123",
      "a",
      "ab",
      "abc",
      "test123",
      "test_underscore",
      "test_mixed_case",
      "_underscore_start",
      "underscore_end_",
      "user_caps",
    ];

    const invalidPrefixes = [
      "",
      "test-dash",
      "test!",
      "test.dot",
      "test@domain",
      "test+plus",
      "test=equals",
      "test/slash",
      "test:colon",
      "test-long-prefix",
      "test!exclamation",
      "test#hash",
      "test$dollar",
      "test%percent",
      "test^caret",
      "test&ampersand",
      "test*asterisk",
      "test(paren",
      "test[bracket",
      "test{brace",
      "test|pipe",
      "test\\backslash",
      "test'quote",
      'test"doublequote',
      "test`backtick",
      "test~tilde",
      "test space",
      "Mixed_Case_123",
      "CaseSensitive",
      "a".repeat(41), // prefix longer than 40 chars
      "a".repeat(50), // prefix longer than 40 chars
    ];

    it.each(validPrefixes)("accepts valid prefix: %s", (prefix) => {
      expect(() => generate(prefix)).not.toThrow();
    });

    it.each(invalidPrefixes)("rejects invalid prefix: %s", (prefix) => {
      expect(() => generate(prefix)).toThrow(/invalid prefix/);
    });
  });

  describe("base62 encoding", () => {
    it("generates ids with consistent base62 encoding format", () => {
      const id = generate("test");
      const base62Part = id.split("_")[1];
      expect(base62Part).toMatch(/^[0-9A-Za-z]+$/);
    });
  });

  describe("timestamp and order", () => {
    it("generates ids with increasing timestamps when called rapidly", () => {
      const ids = Array.from({ length: 10 }, () => generate("time"));
      const parsed = ids.map((id) => parse(id));

      const timestamps = parsed.map(({ uuid }) => {
        const timestampHex = uuid.replace(/-/g, "").slice(0, 12);
        return parseInt(timestampHex, 16);
      });

      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1] - 1);
      }
    });
  });
});

describe("parse", () => {
  it("parses valid prefixed id correctly and returns valid UUID format", () => {
    const id = generate("parse");
    const { prefix, uuid } = parse(id);

    expect(prefix).toBe("parse");
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it.for(["invalid", "test_invalid!"])(
    "throws for invalid id format: %s",
    (invalidId) => {
      expect(() => parse(invalidId)).toThrow();
    },
  );

  it("handles round-trip conversion consistently", () => {
    const originalId = generate("round");
    const { prefix, uuid } = parse(originalId);

    // Verify we can parse and get consistent results
    const reparsed = parse(originalId);
    expect(reparsed.prefix).toBe(prefix);
    expect(reparsed.uuid).toBe(uuid);
  });

  it.for([
    "user_01HKP7X8R6GQ8N2V9M5T3J4K0W",
    "order_01HKP7X8R6GQ8N2V9M5T3J4K0X",
    "product_01HKP7X8R6GQ8N2V9M5T3J4K0Y",
    "test_0123456789ABCDEFGHJKMNPQRST",
    "api_ZYXWVUTSRQPNMKJHGFEDCBA9876543210",
  ])("parses manually created id: %s", (id) => {
    const { prefix, uuid } = parse(id);
    expect(prefix).toBe(id.split("_")[0]);
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it.for([
    [""],
    ["_noprefix"],
    ["onlyprefix_"],
    ["long_prefix_but_no_uuid_"],
    ["nounderscore"],
    ["test_invalid!"],
    ["test_!@#$%"],
    ["01987c17-a695-70ed-baaf-ff3cd4a1537f"],
    ["rZgVp6nKvmKLXzhXzhjdvz5PkQ1EsicsKLDyOuXWHj5N7oPu"],
  ])("throws for invalid id: %s", ([invalidId]) => {
    expect(() => parse(invalidId)).toThrow();
  });

  it("extracts correct timestamp from UUIDv7", () => {
    const startTime = Date.now();
    const id = generate("time");
    const endTime = Date.now();

    const { uuid } = parse(id);

    // Extract timestamp from UUIDv7 (first 48 bits)
    const timestampHex = uuid.replace(/-/g, "").slice(0, 12);
    const timestamp = parseInt(timestampHex, 16);

    expect(timestamp).toBeGreaterThanOrEqual(startTime);
    expect(timestamp).toBeLessThanOrEqual(endTime);
  });
});

describe("validate", () => {
  it("validates correct prefix", () => {
    const id = generate("valid");
    expect(validate(id, "valid")).toBe(true);
  });

  it("rejects wrong prefix", () => {
    const id = generate("valid");
    expect(validate(id, "invalid")).toBe(false);
  });

  it.for(["malformed", "test_invalid!"])(
    "rejects malformed ids: %s",
    (malformedId) => {
      expect(validate(malformedId, "test")).toBe(false);
    },
  );

  it.for([
    ["user", "user"],
    ["order", "order"],
    ["api_key", "api_key"],
  ])(
    "validates correct prefix '%s' against expected '%s'",
    ([generatePrefix, validatePrefix]) => {
      const id = generate(generatePrefix);
      expect(validate(id, validatePrefix)).toBe(true);
    },
  );

  it.for([
    ["user", "admin"],
    ["order", "product"],
    ["api_key", "api_token"],
  ])(
    "rejects incorrect prefix '%s' against expected '%s'",
    ([generatePrefix, validatePrefix]) => {
      const id = generate(generatePrefix);
      expect(validate(id, validatePrefix)).toBe(false);
    },
  );

  it.for([
    "malformed",
    "test_",
    "_noprefix",
    "test_invalid!",
    "no_underscore_but_long",
    "test_!@#",
  ])("rejects invalid id format: %s", (invalidId) => {
    expect(validate(invalidId, "test")).toBe(false);
  });

  it.for([
    "simple",
    "with_underscore",
    "123numeric",
    "_underscore_start",
    "underscore_end_",
  ])("validates ids with different prefix patterns: %s", (prefix) => {
    const id = generate(prefix);
    expect(validate(id, prefix)).toBe(true);
    expect(validate(id, prefix + "wrong")).toBe(false);
  });

  it("is case-sensitive for prefix validation", () => {
    const id = generate("casesensitive");
    expect(validate(id, "casesensitive")).toBe(true);
  });

  it("rejects case-mismatched prefixes", () => {
    const id = generate("casesensitive");
    expect(validate(id, "CaseSensitive")).toBe(false);
    expect(validate(id, "CASESENSITIVE")).toBe(false);
  });
});

describe("error handling", () => {
  it.for([
    ["invalid", "invalid prefix"],
    ["test_", "failed to parse id"],
    ["test_invalid!", "failed to parse id"],
    ["_empty", "invalid prefix"],
  ])(
    "throws appropriate error for invalid input '%s'",
    ([input, expectedErrorPattern]) => {
      expect(() => parse(input)).toThrow(new RegExp(expectedErrorPattern, "i"));
    },
  );

  it("handles edge cases gracefully with very long prefix", () => {
    const veryLongPrefix = "a".repeat(41);
    expect(() => {
      generate(veryLongPrefix);
    }).toThrow(/invalid prefix/);
  });
});

describe("cross-platform compatibility", () => {
  it("generates consistent format across calls", () => {
    const ids = Array.from({ length: 50 }, () => generate("compat"));

    ids.forEach((id) => {
      expect(id).toMatch(/^compat_[0-9A-Za-z]+$/);
      const { prefix, uuid } = parse(id);
      expect(prefix).toBe("compat");
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });

  it("generates UUIDv7 with correct version bits", () => {
    const ids = Array.from({ length: 20 }, () => generate("uuid"));

    ids.forEach((id) => {
      const { uuid } = parse(id);

      // Check version (4 bits should be 0111 = 7)
      const versionChar = uuid.charAt(14);
      expect(versionChar).toBe("7");
    });
  });

  it("generates UUIDv7 with correct variant bits", () => {
    const ids = Array.from({ length: 20 }, () => generate("uuid"));

    ids.forEach((id) => {
      const { uuid } = parse(id);

      // Check variant (first 2 bits of 17th char should be 10)
      const variantChar = uuid.charAt(19);
      expect(["8", "9", "a", "b"]).toContain(variantChar.toLowerCase());
    });
  });

  it("maintains temporal ordering", () => {
    const ids: string[] = [];

    // Generate IDs with small delays to ensure different timestamps
    for (let i = 0; i < 5; i++) {
      ids.push(generate("temp"));
      // Small delay to ensure timestamp difference
      const start = Date.now();
      while (Date.now() - start < 2) {
        // Busy wait for 2ms
      }
    }

    const timestamps = ids.map((id) => {
      const { uuid } = parse(id);
      const timestampHex = uuid.replace(/-/g, "").slice(0, 12);
      return parseInt(timestampHex, 16);
    });

    // Check that timestamps are generally increasing
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
    }
  });
});

describe("timestamp", () => {
  it("extracts correct timestamp from generated prefixed ID", () => {
    const startTime = Date.now();
    const id = generate("test");
    const endTime = Date.now();

    const ts = timestamp(id);

    expect(ts).toBeInstanceOf(Date);
    expect(ts.getTime()).toBeGreaterThanOrEqual(startTime);
    expect(ts.getTime()).toBeLessThanOrEqual(endTime);
  });

  it("returns consistent timestamp for same ID", () => {
    const id = generate("consistent");
    const timestamp1 = timestamp(id);
    const timestamp2 = timestamp(id);

    expect(timestamp1.getTime()).toBe(timestamp2.getTime());
  });

  it("throws for invalid prefixed ID", () => {
    expect(() => timestamp("invalid")).toThrow();
    expect(() => timestamp("test_invalid!")).toThrow();
    expect(() => timestamp("")).toThrow();
  });

  it("works with different prefix types", () => {
    const userTime = Date.now();
    const userId = generate("user");
    const apiKeyId = generate("api_key");

    const userTimestamp = timestamp(userId);
    const apiKeyTimestamp = timestamp(apiKeyId);

    expect(userTimestamp).toBeInstanceOf(Date);
    expect(apiKeyTimestamp).toBeInstanceOf(Date);
    expect(Math.abs(userTimestamp.getTime() - userTime)).toBeLessThan(100);
    expect(Math.abs(apiKeyTimestamp.getTime() - userTime)).toBeLessThan(100);
  });

  it("maintains temporal ordering between different IDs", () => {
    const id1 = generate("first");
    // Small delay to ensure different timestamp
    const start = Date.now();
    while (Date.now() - start < 2) {
      // Busy wait
    }
    const id2 = generate("second");

    const timestamp1 = timestamp(id1);
    const timestamp2 = timestamp(id2);

    expect(timestamp2.getTime()).toBeGreaterThanOrEqual(timestamp1.getTime());
  });
});
