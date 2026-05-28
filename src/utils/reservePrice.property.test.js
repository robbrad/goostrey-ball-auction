import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validateReservePrice } from "./validation.js";

describe("Feature: auction-overhaul, Property 6: Reserve price validation", () => {
  /**
   * Validates: Requirements 2.1, 6.5
   *
   * For any numeric value in the range [0.00, 999999.99] with at most 2 decimal places,
   * validateReservePrice SHALL accept it. For any value that is negative, exceeds 999999.99,
   * has more than 2 decimal places, or is non-numeric, validateReservePrice SHALL reject it.
   */

  it("accepts any valid numeric value in [0.00, 999999.99] with at most 2 decimal places", () => {
    fc.assert(
      fc.property(
        // Generate integers 0–99999999, divide by 100 to get values 0.00–999999.99
        fc.integer({ min: 0, max: 99999999 }),
        (intValue) => {
          const value = intValue / 100;
          // Format as string with up to 2 decimal places (no trailing zeros required)
          const str = value % 1 === 0
            ? value.toString()
            : value.toFixed(2).replace(/0$/, "").replace(/\.$/, "");

          // Use a consistent format: toFixed(2) for decimals, plain for integers
          const formatted = Number.isInteger(value)
            ? value.toString()
            : value.toFixed(2);

          const result = validateReservePrice(formatted);
          expect(result.valid).toBe(true);
          expect(result.error).toBe("");
        }
      ),
      { numRuns: 200 }
    );
  });

  it("accepts valid whole numbers in range [0, 999999]", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 999999 }),
        (value) => {
          const result = validateReservePrice(value.toString());
          expect(result.valid).toBe(true);
          expect(result.error).toBe("");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("accepts valid values with 1 decimal place", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 9999999 }),
        (intValue) => {
          const value = intValue / 10;
          // Only test values within range
          if (value > 999999.99) return;
          const formatted = value.toFixed(1);
          const result = validateReservePrice(formatted);
          expect(result.valid).toBe(true);
          expect(result.error).toBe("");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects negative numbers", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -99999999, max: -1 }),
        (intValue) => {
          const value = intValue / 100;
          const formatted = value.toFixed(2);
          const result = validateReservePrice(formatted);
          expect(result.valid).toBe(false);
          expect(result.error).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects values exceeding 999999.99", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100000000, max: 999999999 }),
        (intValue) => {
          const value = intValue / 100;
          const formatted = value.toFixed(2);
          const result = validateReservePrice(formatted);
          expect(result.valid).toBe(false);
          expect(result.error).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects values with more than 2 decimal places", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 999999 }),
        fc.integer({ min: 100, max: 999 }),
        (wholePart, decimalPart) => {
          // Create a string with 3 decimal places
          const formatted = `${wholePart}.${decimalPart}`;
          const result = validateReservePrice(formatted);
          expect(result.valid).toBe(false);
          expect(result.error).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects non-numeric strings", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }).filter(
          (str) => !/^\s*\d+(\.\d{1,2})?\s*$/.test(str)
        ),
        (str) => {
          const result = validateReservePrice(str);
          expect(result.valid).toBe(false);
          expect(result.error).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });
});
