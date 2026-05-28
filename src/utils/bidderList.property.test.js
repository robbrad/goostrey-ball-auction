import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { sortBidders } from "./bidderList.js";

/**
 * Feature: admin-user-enhancements, Property 1: Bidder list is sorted descending by bid amount
 *
 * Validates: Requirements 1.2
 */

// --- Arbitraries / Generators ---

/**
 * Generates a single bid entry with a positive amount and a uid string.
 */
const bidEntryArb = fc.record({
  amount: fc.integer({ min: 1, max: 99999999 }).map((cents) => cents / 100),
  uid: fc.string({ minLength: 1, maxLength: 20 }),
});

/**
 * Generates a bids object where key 0 is metadata (always present)
 * and keys 1..N are actual bids.
 */
const bidsObjectArb = fc
  .array(bidEntryArb, { minLength: 1, maxLength: 20 })
  .map((bidsArray) => {
    const bids = {};
    // Key 0 is always metadata (should be skipped by sortBidders)
    bids[0] = { amount: 0, title: "Item metadata", uid: "" };
    // Keys 1..N are actual bids
    bidsArray.forEach((bid, idx) => {
      bids[idx + 1] = bid;
    });
    return bids;
  });

// --- Property 1: Bidder list is sorted descending by bid amount ---

describe("Feature: admin-user-enhancements, Property 1: Bidder list is sorted descending by bid amount", () => {
  it("output is sorted in descending order by amount (each element's amount >= next element's amount)", () => {
    fc.assert(
      fc.property(bidsObjectArb, (bids) => {
        const result = sortBidders(bids);

        // Check descending order: each element's amount >= next element's amount
        for (let i = 0; i < result.length - 1; i++) {
          expect(result[i].amount).toBeGreaterThanOrEqual(result[i + 1].amount);
        }
      }),
      { numRuns: 200 }
    );
  });

  it("result length equals the number of bid keys (keys > 0)", () => {
    fc.assert(
      fc.property(bidsObjectArb, (bids) => {
        const result = sortBidders(bids);
        const expectedLength = Object.keys(bids).filter(
          (key) => Number(key) > 0
        ).length;

        expect(result.length).toBe(expectedLength);
      }),
      { numRuns: 200 }
    );
  });

  it("each entry in the result has uid and amount properties", () => {
    fc.assert(
      fc.property(bidsObjectArb, (bids) => {
        const result = sortBidders(bids);

        for (const entry of result) {
          expect(entry).toHaveProperty("uid");
          expect(entry).toHaveProperty("amount");
          expect(typeof entry.uid).toBe("string");
          expect(typeof entry.amount).toBe("number");
        }
      }),
      { numRuns: 200 }
    );
  });
});
