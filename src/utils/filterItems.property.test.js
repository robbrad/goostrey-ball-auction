import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { filterItems } from "./filterItems.js";

/**
 * Feature: admin-user-enhancements
 * Property 10: Filter items applies combined filters as intersection
 *
 * For any array of auction items and any FilterState (searchText, status,
 * priceRange, endingSoon), filterItems SHALL return only items that satisfy
 * ALL active filter conditions simultaneously. An item appears in the result
 * if and only if it passes every active filter.
 *
 * Validates: Requirements 10.2, 10.3, 10.4, 10.5, 10.6
 */
describe("Property 10: Filter items applies combined filters as intersection", () => {
  // Use a fixed "now" reference for deterministic time comparisons
  const NOW = new Date("2025-06-15T12:00:00.000Z");

  // Helper: compute current price for an item (mirrors implementation logic)
  const getCurrentPrice = (item) => {
    const bidEntries = Object.entries(item.bids || {}).filter(
      ([key]) => Number(key) > 0
    );
    if (bidEntries.length === 0) return item.startingPrice;
    return Math.max(...bidEntries.map(([, bid]) => bid.amount));
  };

  // Helper: check if an item passes a single filter condition given a fixed "now"
  const passesFilter = (item, filterState, now) => {
    const { searchText, status, priceMin, priceMax, endingSoon } = filterState;

    // Text search filter
    if (searchText !== "") {
      const query = searchText.toLowerCase();
      const title = (item.title || "").toLowerCase();
      const subtitle = (item.subtitle || "").toLowerCase();
      if (!title.includes(query) && !subtitle.includes(query)) {
        return false;
      }
    }

    // Status filter
    if (status !== "all") {
      const isActive = item.endTime > now;
      if (status === "active" && !isActive) return false;
      if (status === "ended" && isActive) return false;
    }

    // Price range filter
    const currentPrice = getCurrentPrice(item);
    if (priceMin !== null && currentPrice < priceMin) return false;
    if (priceMax !== null && currentPrice > priceMax) return false;

    // Ending soon filter
    if (endingSoon) {
      const isActive = item.endTime > now;
      if (!isActive) return false;
      const msRemaining = item.endTime.getTime() - now.getTime();
      const thirtyMinutes = 30 * 60 * 1000;
      if (msRemaining >= thirtyMinutes) return false;
    }

    return true;
  };

  // Arbitrary: generate a bids object with numeric keys > 0
  const bidsArb = fc
    .array(
      fc.record({
        amount: fc.double({ min: 0.01, max: 10000, noNaN: true }),
        uid: fc.string({ minLength: 1, maxLength: 10 }),
      }),
      { minLength: 0, maxLength: 5 }
    )
    .map((bidsArr) => {
      const bids = {};
      bidsArr.forEach((bid, i) => {
        bids[i + 1] = bid;
      });
      return bids;
    });

  // Arbitrary: generate an auction item with endTime relative to NOW
  const itemArb = fc.record({
    id: fc.integer({ min: 1, max: 1000 }),
    title: fc.string({ minLength: 0, maxLength: 20 }),
    subtitle: fc.string({ minLength: 0, maxLength: 20 }),
    endTime: fc.oneof(
      // Active: 1ms to 2 hours in the future
      fc
        .integer({ min: 1, max: 2 * 60 * 60 * 1000 })
        .map((offset) => new Date(NOW.getTime() + offset)),
      // Ended: 1ms to 2 hours in the past
      fc
        .integer({ min: 1, max: 2 * 60 * 60 * 1000 })
        .map((offset) => new Date(NOW.getTime() - offset))
    ),
    bids: bidsArb,
    startingPrice: fc.double({ min: 0.01, max: 10000, noNaN: true }),
  });

  // Arbitrary: generate a filter state
  const filterStateArb = fc.record({
    searchText: fc.oneof(
      fc.constant(""),
      fc.string({ minLength: 1, maxLength: 5 })
    ),
    status: fc.constantFrom("all", "active", "ended"),
    priceMin: fc.oneof(
      fc.constant(null),
      fc.double({ min: 0, max: 5000, noNaN: true })
    ),
    priceMax: fc.oneof(
      fc.constant(null),
      fc.double({ min: 0, max: 10000, noNaN: true })
    ),
    endingSoon: fc.boolean(),
  });

  it("every returned item passes ALL active filters", () => {
    fc.assert(
      fc.property(
        fc.array(itemArb, { minLength: 0, maxLength: 10 }),
        filterStateArb,
        (items, filterState) => {
          // Mock Date.now to use our fixed NOW for the filterItems call
          const originalNow = Date.now;
          const originalDate = globalThis.Date;
          const FixedDate = class extends Date {
            constructor(...args) {
              if (args.length === 0) {
                super(NOW.getTime());
              } else {
                super(...args);
              }
            }
          };
          FixedDate.now = () => NOW.getTime();
          globalThis.Date = FixedDate;

          try {
            const result = filterItems(items, filterState);

            // Every item in the result must pass all filters
            for (const item of result) {
              expect(passesFilter(item, filterState, NOW)).toBe(true);
            }
          } finally {
            globalThis.Date = originalDate;
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it("every excluded item fails at least one active filter", () => {
    fc.assert(
      fc.property(
        fc.array(itemArb, { minLength: 0, maxLength: 10 }),
        filterStateArb,
        (items, filterState) => {
          const originalDate = globalThis.Date;
          const FixedDate = class extends Date {
            constructor(...args) {
              if (args.length === 0) {
                super(NOW.getTime());
              } else {
                super(...args);
              }
            }
          };
          FixedDate.now = () => NOW.getTime();
          globalThis.Date = FixedDate;

          try {
            const result = filterItems(items, filterState);
            const resultSet = new Set(result);

            // Every item NOT in the result must fail at least one filter
            for (const item of items) {
              if (!resultSet.has(item)) {
                expect(passesFilter(item, filterState, NOW)).toBe(false);
              }
            }
          } finally {
            globalThis.Date = originalDate;
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
