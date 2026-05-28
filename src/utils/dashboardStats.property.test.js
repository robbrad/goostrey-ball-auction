import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { computeDashboardStats } from "./dashboardStats.js";

/**
 * Feature: admin-user-enhancements, Property 6: Dashboard statistics computation
 *
 * Validates: Requirements 6.1, 6.3
 */

// --- Arbitraries / Generators ---

/**
 * Generates a bid object entry: { amount, uid }
 */
const bidEntryArb = fc.record({
  amount: fc.integer({ min: 1, max: 99999 }).map((cents) => cents / 100),
  uid: fc.string({ minLength: 3, maxLength: 10 }),
});

/**
 * Generates a bids object with numeric keys > 0 mapping to bid entries.
 * May also include a key 0 (metadata) which should not count as a bid.
 */
const bidsArb = fc
  .integer({ min: 0, max: 5 })
  .chain((numBids) => {
    if (numBids === 0) {
      return fc.constant({});
    }
    return fc
      .array(bidEntryArb, { minLength: numBids, maxLength: numBids })
      .map((entries) => {
        const bids = {};
        entries.forEach((entry, idx) => {
          bids[idx + 1] = entry;
        });
        return bids;
      });
  });

/**
 * Generates a reserve price: either null (no reserve) or a positive number.
 */
const reservePriceArb = fc.oneof(
  fc.constant(null),
  fc.integer({ min: 1, max: 99999 }).map((cents) => cents / 100)
);

/**
 * Generates an endTime that is either in the past or in the future.
 * Uses a fixed "now" reference to ensure consistency within a single test run.
 */
const endTimeArb = fc.boolean().map((isPast) => {
  const now = Date.now();
  if (isPast) {
    // Past: 1 hour to 30 days ago
    return new Date(now - (3600000 + Math.floor(Math.random() * 2592000000)));
  } else {
    // Future: 1 hour to 30 days from now
    return new Date(now + (3600000 + Math.floor(Math.random() * 2592000000)));
  }
});

/**
 * Generates a single auction item with id, title, endTime, reservePrice, and bids.
 */
const auctionItemArb = fc
  .tuple(
    fc.integer({ min: 1, max: 9999 }),
    fc.string({ minLength: 1, maxLength: 20 }),
    endTimeArb,
    reservePriceArb,
    bidsArb
  )
  .map(([id, title, endTime, reservePrice, bids]) => ({
    id,
    title,
    endTime,
    reservePrice,
    bids,
  }));

/**
 * Generates an array of auction items (0-10 items).
 */
const itemsArrayArb = fc.array(auctionItemArb, { minLength: 0, maxLength: 10 });

// --- Property 6: Dashboard statistics computation ---

describe("Feature: admin-user-enhancements, Property 6: Dashboard statistics computation", () => {
  /**
   * Validates: Requirements 6.1, 6.3
   *
   * For any array of auction items, computeDashboardStats SHALL return:
   * - totalItems equal to the array length
   * - activeItems equal to the count of items whose endTime is in the future
   * - endedItems equal to totalItems minus activeItems
   * - totalBids equal to the sum of bid counts (keys > 0) across all items
   * - revenue equal to the sum of the highest bid for each ended item where
   *   the highest bid meets or exceeds the reserve price (or no reserve set)
   */
  it("totalItems equals the array length", () => {
    fc.assert(
      fc.property(itemsArrayArb, (items) => {
        const stats = computeDashboardStats(items);
        expect(stats.totalItems).toBe(items.length);
      }),
      { numRuns: 200 }
    );
  });

  it("activeItems + endedItems equals totalItems", () => {
    fc.assert(
      fc.property(itemsArrayArb, (items) => {
        const stats = computeDashboardStats(items);
        expect(stats.activeItems + stats.endedItems).toBe(stats.totalItems);
      }),
      { numRuns: 200 }
    );
  });

  it("activeItems equals count of items with endTime in the future", () => {
    fc.assert(
      fc.property(itemsArrayArb, (items) => {
        const now = new Date();
        const stats = computeDashboardStats(items);
        const expectedActive = items.filter((item) => item.endTime > now).length;
        expect(stats.activeItems).toBe(expectedActive);
      }),
      { numRuns: 200 }
    );
  });

  it("endedItems equals totalItems minus activeItems", () => {
    fc.assert(
      fc.property(itemsArrayArb, (items) => {
        const stats = computeDashboardStats(items);
        expect(stats.endedItems).toBe(stats.totalItems - stats.activeItems);
      }),
      { numRuns: 200 }
    );
  });

  it("totalBids equals sum of bid counts (keys > 0) across all items", () => {
    fc.assert(
      fc.property(itemsArrayArb, (items) => {
        const stats = computeDashboardStats(items);
        const expectedTotalBids = items.reduce((sum, item) => {
          const bidKeys = Object.keys(item.bids || {}).filter(
            (k) => Number(k) > 0
          );
          return sum + bidKeys.length;
        }, 0);
        expect(stats.totalBids).toBe(expectedTotalBids);
      }),
      { numRuns: 200 }
    );
  });

  it("revenue equals sum of highest bid for each ended item where reserve is met or no reserve", () => {
    fc.assert(
      fc.property(itemsArrayArb, (items) => {
        const now = new Date();
        const stats = computeDashboardStats(items);

        const expectedRevenue = items.reduce((sum, item) => {
          const ended = item.endTime <= now;
          if (!ended) return sum;

          const bidKeys = Object.keys(item.bids || {}).filter(
            (k) => Number(k) > 0
          );
          if (bidKeys.length === 0) return sum;

          const highestBid = Math.max(
            ...bidKeys.map((k) => item.bids[k].amount)
          );

          const reserveMet =
            item.reservePrice == null ||
            item.reservePrice <= 0 ||
            highestBid >= item.reservePrice;

          return reserveMet ? sum + highestBid : sum;
        }, 0);

        expect(stats.revenue).toBe(expectedRevenue);
      }),
      { numRuns: 200 }
    );
  });
});
