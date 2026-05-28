import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { computeUserBids } from "./userBids.js";

/**
 * Feature: admin-user-enhancements, Property 8: User bids computation with standing
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4
 */

// --- Arbitraries / Generators ---

/**
 * Generates a userId string.
 */
const userIdArb = fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.trim().length > 0);

/**
 * Generates a bid amount (positive integer to avoid floating point issues).
 */
const bidAmountArb = fc.integer({ min: 1, max: 100000 });

/**
 * Generates a uid for a bidder (other than the target user).
 */
const otherUidArb = fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.trim().length > 0);

/**
 * Generates an items array with bids from multiple users, ensuring some bids
 * belong to the target userId.
 */
const itemsWithUserBidsArb = userIdArb.chain((userId) => {
  const bidEntryArb = fc.oneof(
    // Bid from the target user
    bidAmountArb.map((amount) => ({ amount, uid: userId })),
    // Bid from another user
    fc.tuple(bidAmountArb, otherUidArb).map(([amount, uid]) => ({
      amount,
      uid: uid === userId ? uid + "_other" : uid,
    }))
  );

  const bidsArb = fc
    .array(bidEntryArb, { minLength: 1, maxLength: 8 })
    .map((bidArray) => {
      const bids = {};
      bidArray.forEach((bid, idx) => {
        bids[idx + 1] = bid;
      });
      return bids;
    });

  return fc
    .integer({ min: 1, max: 10 })
    .chain((numItems) => {
      // Generate unique IDs by creating an array of items with index-based IDs
      const itemArbs = Array.from({ length: numItems }, (_, idx) =>
        fc.tuple(fc.string({ minLength: 1, maxLength: 30 }), bidsArb).map(
          ([title, bids]) => ({
            id: idx + 1,
            title,
            bids,
          })
        )
      );
      return fc.tuple(...itemArbs);
    })
    .map((items) => {
      // Ensure at least one item has a bid from the target user
      const hasUserBid = items.some((item) =>
        Object.entries(item.bids).some(
          ([key, bid]) => Number(key) > 0 && bid.uid === userId
        )
      );
      if (!hasUserBid) {
        // Force the first item to have a bid from the target user
        const firstBidKey =
          Math.max(
            ...Object.keys(items[0].bids)
              .map(Number)
              .filter((k) => k > 0)
          ) + 1;
        items[0].bids[firstBidKey] = { amount: 50, uid: userId };
      }
      return { items, userId };
    });
});

// --- Property 8: User bids computation with standing ---

describe("Feature: admin-user-enhancements, Property 8: User bids computation with standing", () => {
  /**
   * Validates: Requirements 8.1
   *
   * Result contains exactly the items where userId appears in at least one bid (key > 0).
   */
  it("returns exactly the items where userId has at least one bid", () => {
    fc.assert(
      fc.property(itemsWithUserBidsArb, ({ items, userId }) => {
        const result = computeUserBids(items, userId);

        // Compute expected set of item IDs where user has bids
        const expectedItemIds = items
          .filter((item) =>
            Object.entries(item.bids).some(
              ([key, bid]) => Number(key) > 0 && bid.uid === userId
            )
          )
          .map((item) => item.id);

        const resultItemIds = result.map((r) => r.itemId);

        expect(resultItemIds.length).toBe(expectedItemIds.length);
        for (const id of expectedItemIds) {
          expect(resultItemIds).toContain(id);
        }
        for (const id of resultItemIds) {
          expect(expectedItemIds).toContain(id);
        }
      }),
      { numRuns: 200 }
    );
  });

  /**
   * Validates: Requirements 8.2
   *
   * For each result item: userHighestBid = max amount among user's bids;
   * currentHighestBid = max amount among ALL bids.
   */
  it("computes correct userHighestBid and currentHighestBid for each item", () => {
    fc.assert(
      fc.property(itemsWithUserBidsArb, ({ items, userId }) => {
        const result = computeUserBids(items, userId);

        for (const entry of result) {
          const item = items.find((i) => i.id === entry.itemId);
          const allBids = Object.entries(item.bids)
            .filter(([key]) => Number(key) > 0)
            .map(([, bid]) => bid);

          const userBids = allBids.filter((b) => b.uid === userId);
          const expectedUserHighest = Math.max(...userBids.map((b) => b.amount));
          const expectedCurrentHighest = Math.max(...allBids.map((b) => b.amount));

          expect(entry.userHighestBid).toBe(expectedUserHighest);
          expect(entry.currentHighestBid).toBe(expectedCurrentHighest);
        }
      }),
      { numRuns: 200 }
    );
  });

  /**
   * Validates: Requirements 8.3, 8.4
   *
   * Standing = "Winning" if userHighestBid === currentHighestBid, "Outbid" otherwise.
   */
  it("determines standing correctly based on bid comparison", () => {
    fc.assert(
      fc.property(itemsWithUserBidsArb, ({ items, userId }) => {
        const result = computeUserBids(items, userId);

        for (const entry of result) {
          if (entry.userHighestBid === entry.currentHighestBid) {
            expect(entry.standing).toBe("Winning");
          } else {
            expect(entry.standing).toBe("Outbid");
          }
        }
      }),
      { numRuns: 200 }
    );
  });
});
