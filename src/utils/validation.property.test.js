import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { validateItemForm } from "./validation.js";

/**
 * Feature: admin-user-enhancements, Property 3: Item form validation
 *
 * Validates: Requirements 3.2, 4.2
 *
 * For any ItemFormData object, the validation function SHALL reject the submission
 * if the title is empty/whitespace-only, the starting price is negative or non-numeric,
 * or the end time is not in the future; and SHALL accept the submission if all three
 * conditions are met. The validation result SHALL be deterministic for the same input.
 */

// --- Arbitraries / Generators ---

/**
 * Generates a non-empty, non-whitespace-only title string.
 */
const validTitleArb = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0);

/**
 * Generates an invalid title: empty string or whitespace-only.
 */
const invalidTitleArb = fc.oneof(
  fc.constant(""),
  fc.integer({ min: 1, max: 10 }).map((len) => " ".repeat(len)),
  fc.integer({ min: 1, max: 5 }).map((len) => "\t".repeat(len)),
  fc.integer({ min: 1, max: 5 }).map((len) => "\n".repeat(len))
);

/**
 * Generates a valid non-negative starting price (number >= 0).
 */
const validStartingPriceArb = fc
  .integer({ min: 0, max: 99999999 })
  .map((cents) => cents / 100);

/**
 * Generates an invalid starting price: negative number, NaN-producing value, or non-numeric.
 */
const invalidStartingPriceArb = fc.oneof(
  fc.integer({ min: -99999999, max: -1 }).map((cents) => cents / 100),
  fc.constant(NaN),
  fc.constant(""),
  fc.constant(null),
  fc.constant(undefined),
  fc.constant("abc")
);

/**
 * Generates a valid future ISO datetime string.
 * Uses dates 1 day to 365 days in the future to ensure they're always in the future.
 */
const validEndTimeArb = fc
  .integer({ min: 1, max: 365 })
  .map((daysAhead) => {
    const future = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    return future.toISOString();
  });

/**
 * Generates an invalid end time: past date, invalid string, or empty.
 */
const invalidEndTimeArb = fc.oneof(
  // Past date (1 to 365 days ago)
  fc.integer({ min: 1, max: 365 }).map((daysAgo) => {
    const past = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    return past.toISOString();
  }),
  // Invalid date string
  fc.constant("not-a-date"),
  fc.constant(""),
  // Whitespace only
  fc.constant("   ")
);

/**
 * Generates a fully valid ItemFormData object.
 */
const validItemFormArb = fc.record({
  title: validTitleArb,
  startingPrice: validStartingPriceArb,
  endTime: validEndTimeArb,
});

// --- Property Tests ---

describe("Feature: admin-user-enhancements, Property 3: Item form validation", () => {
  it("valid forms return { valid: true, errors: {} }", () => {
    fc.assert(
      fc.property(validItemFormArb, (formData) => {
        const result = validateItemForm(formData);

        expect(result.valid).toBe(true);
        expect(result.errors).toEqual({});
      }),
      { numRuns: 200 }
    );
  });

  it("forms with invalid title return { valid: false } with title error", () => {
    fc.assert(
      fc.property(
        fc.record({
          title: invalidTitleArb,
          startingPrice: validStartingPriceArb,
          endTime: validEndTimeArb,
        }),
        (formData) => {
          const result = validateItemForm(formData);

          expect(result.valid).toBe(false);
          expect(result.errors.title).toBeDefined();
        }
      ),
      { numRuns: 200 }
    );
  });

  it("forms with invalid startingPrice return { valid: false } with startingPrice error", () => {
    fc.assert(
      fc.property(
        fc.record({
          title: validTitleArb,
          startingPrice: invalidStartingPriceArb,
          endTime: validEndTimeArb,
        }),
        (formData) => {
          const result = validateItemForm(formData);

          expect(result.valid).toBe(false);
          expect(result.errors.startingPrice).toBeDefined();
        }
      ),
      { numRuns: 200 }
    );
  });

  it("forms with invalid endTime return { valid: false } with endTime error", () => {
    fc.assert(
      fc.property(
        fc.record({
          title: validTitleArb,
          startingPrice: validStartingPriceArb,
          endTime: invalidEndTimeArb,
        }),
        (formData) => {
          const result = validateItemForm(formData);

          expect(result.valid).toBe(false);
          expect(result.errors.endTime).toBeDefined();
        }
      ),
      { numRuns: 200 }
    );
  });

  it("validation is deterministic: same input always produces same output", () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 0, maxLength: 30 }),
          startingPrice: fc.oneof(
            validStartingPriceArb,
            fc.constant(-1),
            fc.constant(NaN),
            fc.constant("")
          ),
          endTime: fc.oneof(validEndTimeArb, invalidEndTimeArb),
        }),
        (formData) => {
          const result1 = validateItemForm(formData);
          const result2 = validateItemForm(formData);

          expect(result1.valid).toBe(result2.valid);
          expect(result1.errors).toEqual(result2.errors);
        }
      ),
      { numRuns: 200 }
    );
  });
});
