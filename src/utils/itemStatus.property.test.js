import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { itemStatus } from "./itemStatus.js";

/**
 * Feature: auction-overhaul, Property 5: Item status derivation
 *
 * For any item with a defined endTime, startingPrice, optional reservePrice (≥0),
 * and zero or more bids, the derived status follows deterministic rules based on
 * whether the item has ended and the relationship between bids and reserve price.
 *
 * Validates: Requirements 2.3, 2.4, 2.7, 5.4, 5.5, 5.6, 6.8
 */

// --- Generators ---

/** Generate a future date (endTime in the future → item is active) */
const futureDateArb = fc.integer({ min: 60000, max: 86400000 }).map((offset) =>
  new Date(Date.now() + offset).toISOString()
);

/** Generate a past date (endTime in the past → item has ended) */
const pastDateArb = fc.integer({ min: 60000, max: 86400000 }).map((offset) =>
  new Date(Date.now() - offset).toISOString()
);

/** Generate a positive starting price */
const startingPriceArb = fc.double({ min: 0.01, max: 999999.99, noNaN: true });

/** Generate a reserve price: either 0 (no reserve), undefined, or a positive value */
const reservePriceArb = fc.oneof(
  fc.constant(undefined),
  fc.constant(null),
  fc.constant(0),
  fc.double({ min: 0.01, max: 999999.99, noNaN: true })
);

/** Generate a positive reserve price (> 0) */
const positiveReservePriceArb = fc.double({ min: 0.01, max: 999999.99, noNaN: true });

/** Generate a bids object with n bids, each with amount and uid */
const bidsArb = (minBids, maxBids) =>
  fc.integer({ min: minBids, max: maxBids }).chain((numBids) => {
    if (numBids === 0) return fc.constant({});
    // Generate increasing bid amounts
    return fc.array(
      fc.record({
        amount: fc.double({ min: 1, max: 999999.99, noNaN: true }),
        uid: fc.string({ minLength: 1, maxLength: 20 }),
      }),
      { minLength: numBids, maxLength: numBids }
    ).map((bidsArray) => {
      // Sort by amount ascending to simulate realistic bidding
      bidsArray.sort((a, b) => a.amount - b.amount);
      const bidsObj = {};
      bidsArray.forEach((bid, i) => {
        bidsObj[i + 1] = bid;
      });
      return bidsObj;
    });
  });

describe("Property 5: Item status derivation", () => {
  it("returns 'active' when endTime is in the future and reserve is met or not set", () => {
    fc.assert(
      fc.property(
        futureDateArb,
        startingPriceArb,
        fc.oneof(fc.constant(undefined), fc.constant(null), fc.constant(0)),
        bidsArb(0, 5),
        (endTime, startingPrice, reservePrice, bids) => {
          const item = { endTime, startingPrice, reservePrice, bids };
          const result = itemStatus(item);
          expect(result.status).toBe("active");
          expect(result.ended).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns 'reserve-not-met' when active but reserve is not met", () => {
    fc.assert(
      fc.property(
        futureDateArb,
        startingPriceArb,
        fc.double({ min: 100, max: 999999.99, noNaN: true }),
        (endTime, startingPrice, reservePrice) => {
          // No bids or bids below reserve
          const item = { endTime, startingPrice, reservePrice, bids: {} };
          const result = itemStatus(item);
          expect(result.status).toBe("reserve-not-met");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns 'reserve-not-met' when ended, no bids, and reservePrice > 0", () => {
    fc.assert(
      fc.property(
        pastDateArb,
        startingPriceArb,
        positiveReservePriceArb,
        (endTime, startingPrice, reservePrice) => {
          const item = { endTime, startingPrice, reservePrice, bids: {} };
          const result = itemStatus(item);
          expect(result.status).toBe("reserve-not-met");
          expect(result.ended).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns 'reserve-not-met' when ended and highest bid < reservePrice", () => {
    fc.assert(
      fc.property(
        pastDateArb,
        startingPriceArb,
        // Generate a reserve price and ensure highest bid is below it
        fc.double({ min: 10, max: 999999.99, noNaN: true }).chain((reservePrice) =>
          fc.tuple(
            fc.constant(reservePrice),
            // Generate bids where the highest is strictly less than reservePrice
            fc.array(
              fc.record({
                amount: fc.double({ min: 0.01, max: reservePrice - 0.01, noNaN: true }),
                uid: fc.string({ minLength: 1, maxLength: 20 }),
              }),
              { minLength: 1, maxLength: 5 }
            )
          )
        ),
        (endTime, startingPrice, [reservePrice, bidsArray]) => {
          // Sort bids ascending
          bidsArray.sort((a, b) => a.amount - b.amount);
          const bids = {};
          bidsArray.forEach((bid, i) => {
            bids[i + 1] = bid;
          });

          const item = { endTime, startingPrice, reservePrice, bids };
          const result = itemStatus(item);
          expect(result.status).toBe("reserve-not-met");
          expect(result.ended).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns 'sold' when ended and highest bid >= reservePrice (reserve > 0)", () => {
    fc.assert(
      fc.property(
        pastDateArb,
        startingPriceArb,
        // Generate a reserve price and ensure highest bid meets or exceeds it
        fc.double({ min: 1, max: 500000, noNaN: true }).chain((reservePrice) =>
          fc.tuple(
            fc.constant(reservePrice),
            // Generate bids where the highest is >= reservePrice
            fc.array(
              fc.record({
                amount: fc.double({ min: reservePrice, max: 999999.99, noNaN: true }),
                uid: fc.string({ minLength: 1, maxLength: 20 }),
              }),
              { minLength: 1, maxLength: 5 }
            )
          )
        ),
        (endTime, startingPrice, [reservePrice, bidsArray]) => {
          // Sort bids ascending
          bidsArray.sort((a, b) => a.amount - b.amount);
          const bids = {};
          bidsArray.forEach((bid, i) => {
            bids[i + 1] = bid;
          });

          const item = { endTime, startingPrice, reservePrice, bids };
          const result = itemStatus(item);
          expect(result.status).toBe("sold");
          expect(result.ended).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns 'sold' when ended, bids exist, and no reserve is set (undefined/null)", () => {
    fc.assert(
      fc.property(
        pastDateArb,
        startingPriceArb,
        fc.oneof(fc.constant(undefined), fc.constant(null)),
        bidsArb(1, 5),
        (endTime, startingPrice, reservePrice, bids) => {
          const item = { endTime, startingPrice, reservePrice, bids };
          const result = itemStatus(item);
          expect(result.status).toBe("sold");
          expect(result.ended).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns 'sold' when ended, bids exist, and reservePrice is 0", () => {
    fc.assert(
      fc.property(
        pastDateArb,
        startingPriceArb,
        bidsArb(1, 5),
        (endTime, startingPrice, bids) => {
          const item = { endTime, startingPrice, reservePrice: 0, bids };
          const result = itemStatus(item);
          expect(result.status).toBe("sold");
          expect(result.ended).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns 'ended-no-bids' when ended, no bids, and no reserve (undefined/null/0)", () => {
    fc.assert(
      fc.property(
        pastDateArb,
        startingPriceArb,
        fc.oneof(fc.constant(undefined), fc.constant(null), fc.constant(0)),
        (endTime, startingPrice, reservePrice) => {
          const item = { endTime, startingPrice, reservePrice, bids: {} };
          const result = itemStatus(item);
          expect(result.status).toBe("ended-no-bids");
          expect(result.ended).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
