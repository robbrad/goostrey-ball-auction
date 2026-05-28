import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validateBidAmount } from "./validation.js";

describe("Feature: auction-overhaul, Property 7: Bid amount validation", () => {
  /**
   * Validates: Requirements 3.1, 3.2
   *
   * For any positive numeric string with at most 2 decimal places representing
   * a value ≤ 999999.99 that is ≥ (currentHighest + minIncrement),
   * validateBidAmount SHALL accept it.
   */
  describe("valid bids are accepted", () => {
    it("accepts any valid bid amount that meets all criteria", () => {
      fc.assert(
        fc.property(
          fc
            .record({
              currentHighest: fc.integer({ min: 0, max: 999998 }),
              minIncrement: fc.constant(1),
            })
            .chain(({ currentHighest, minIncrement }) => {
              const minimumBid = currentHighest + minIncrement;
              const maxBid = Math.min(999999.99, 999999.99);
              // Generate a valid bid amount between minimumBid and 999999.99
              // Use integer cents to ensure at most 2 decimal places
              const minCents = Math.ceil(minimumBid * 100);
              const maxCents = Math.floor(maxBid * 100);
              return fc
                .integer({ min: minCents, max: maxCents })
                .map((cents) => ({
                  currentHighest,
                  minIncrement,
                  amount: (cents / 100).toFixed(2),
                }));
            }),
          ({ currentHighest, minIncrement, amount }) => {
            const result = validateBidAmount(amount, currentHighest, minIncrement);
            expect(result.valid).toBe(true);
            expect(result.error).toBe("");
          }
        ),
        { numRuns: 200 }
      );
    });

    it("accepts whole number bids without decimal places", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 999998 }).chain((currentHighest) => {
            const minBid = currentHighest + 1;
            const maxBid = Math.min(999999, 999999);
            return fc.integer({ min: minBid, max: maxBid }).map((bid) => ({
              currentHighest,
              amount: bid.toString(),
            }));
          }),
          ({ currentHighest, amount }) => {
            const result = validateBidAmount(amount, currentHighest, 1);
            expect(result.valid).toBe(true);
            expect(result.error).toBe("");
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Validates: Requirements 3.1, 3.2
   *
   * For any bid amount that is non-numeric, non-positive, has more than 2
   * decimal places, exceeds 999999.99, or is less than currentHighest +
   * minIncrement, validateBidAmount SHALL reject it.
   */
  describe("invalid bids are rejected", () => {
    it("rejects bids below the minimum required amount", () => {
      fc.assert(
        fc.property(
          fc
            .record({
              currentHighest: fc.integer({ min: 1, max: 999998 }),
              minIncrement: fc.constant(1),
            })
            .chain(({ currentHighest, minIncrement }) => {
              const minimumRequired = currentHighest + minIncrement;
              // Generate a bid that is valid format but below minimum
              const maxCents = Math.max(1, Math.floor((minimumRequired - 0.01) * 100));
              return fc
                .integer({ min: 1, max: maxCents })
                .map((cents) => ({
                  currentHighest,
                  minIncrement,
                  amount: (cents / 100).toFixed(2),
                }));
            }),
          ({ currentHighest, minIncrement, amount }) => {
            const result = validateBidAmount(amount, currentHighest, minIncrement);
            expect(result.valid).toBe(false);
            expect(result.error).toBeTruthy();
          }
        ),
        { numRuns: 200 }
      );
    });

    it("rejects non-numeric strings", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter((s) => {
            // Filter to strings that are genuinely non-numeric
            const trimmed = s.trim();
            return trimmed.length > 0 && !/^\d+(\.\d{1,2})?$/.test(trimmed);
          }),
          (amount) => {
            const result = validateBidAmount(amount, 0, 1);
            expect(result.valid).toBe(false);
            expect(result.error).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects negative values", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 999999 }).map((n) => `-${n}`),
          (amount) => {
            const result = validateBidAmount(amount, 0, 1);
            expect(result.valid).toBe(false);
            expect(result.error).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects amounts with more than 2 decimal places", () => {
      fc.assert(
        fc.property(
          fc.record({
            whole: fc.integer({ min: 1, max: 9999 }),
            decimals: fc.integer({ min: 3, max: 6 }),
          }).chain(({ whole, decimals }) => {
            return fc.integer({ min: 100, max: Math.pow(10, decimals) - 1 }).map(
              (frac) => ({
                amount: `${whole}.${frac.toString().padStart(decimals, "0")}`,
              })
            );
          }),
          ({ amount }) => {
            const result = validateBidAmount(amount, 0, 1);
            expect(result.valid).toBe(false);
            expect(result.error).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects amounts exceeding 999999.99", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100000000, max: 999999999 }).map((cents) => {
            return (cents / 100).toFixed(2);
          }),
          (amount) => {
            const result = validateBidAmount(amount, 0, 1);
            expect(result.valid).toBe(false);
            expect(result.error).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
