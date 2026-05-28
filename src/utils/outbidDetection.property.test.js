import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { detectOutbids } from "./outbidDetection.js";

/**
 * Feature: admin-user-enhancements, Property 9: Outbid detection
 *
 * Validates: Requirements 9.1, 9.2, 9.4
 *
 * For any previous items state, current items state, and userId: if the user had
 * the highest bid on an item in the previous state but no longer has the highest
 * bid in the current state, detectOutbids SHALL return a notification for that item
 * containing the item title and new highest bid amount. If the userId is null or
 * the user had no bids in the previous state, the function SHALL return an empty array.
 */

// --- Arbitraries / Generators ---

/**
 * Generates a userId string or null.
 */
const userIdArb = fc.oneof(
  fc.constant(null),
  fc.string({ minLength: 1, maxLength: 10 })
);

/**
 * Generates a non-null userId string.
 */
const validUserIdArb = fc.string({ minLength: 1, maxLength: 10 });

/**
 * Generates a bid object with amount and uid.
 */
const bidArb = (uidArb) =>
  fc.record({
    amount: fc.integer({ min: 1, max: 10000 }),
    uid: uidArb,
  });

/**
 * Generates a bids object (Record<number, { amount, uid }>) with keys > 0.
 */
const bidsObjectArb = (uidArb) =>
  fc
    .array(bidArb(uidArb), { minLength: 1, maxLength: 5 })
    .map((bidsArray) => {
      const bids = {};
      bidsArray.forEach((bid, index) => {
        bids[index + 1] = bid;
      });
      return bids;
    });

/**
 * Generates an auction item with id, title, currency, and bids.
 */
const itemArb = (uidArb) =>
  fc.record({
    id: fc.integer({ min: 1, max: 100 }),
    title: fc.string({ minLength: 1, maxLength: 20 }),
    currency: fc.constantFrom("£", "$", "€"),
    bids: bidsObjectArb(uidArb),
  });

/**
 * Generates an item with no bids (empty bids object).
 */
const itemNoBidsArb = fc.record({
  id: fc.integer({ min: 1, max: 100 }),
  title: fc.string({ minLength: 1, maxLength: 20 }),
  currency: fc.constantFrom("£", "$", "€"),
  bids: fc.constant({}),
});

// --- Helper functions ---

function getHighestBidder(bids) {
  const entries = Object.entries(bids)
    .filter(([key]) => Number(key) > 0)
    .map(([, bid]) => bid);
  if (entries.length === 0) return null;
  const maxAmount = Math.max(...entries.map((b) => b.amount));
  return entries.find((b) => b.amount === maxAmount);
}

function userHasHighestBid(bids, userId) {
  const entries = Object.entries(bids)
    .filter(([key]) => Number(key) > 0)
    .map(([, bid]) => bid);
  if (entries.length === 0) return false;
  const maxAmount = Math.max(...entries.map((b) => b.amount));
  return entries.some((b) => b.uid === userId && b.amount === maxAmount);
}

// --- Property 9: Outbid detection ---

describe("Feature: admin-user-enhancements, Property 9: Outbid detection", () => {
  it("returns empty array when userId is null", () => {
    fc.assert(
      fc.property(
        fc.array(itemArb(validUserIdArb), { minLength: 0, maxLength: 5 }),
        fc.array(itemArb(validUserIdArb), { minLength: 0, maxLength: 5 }),
        (prevItems, currItems) => {
          const result = detectOutbids(prevItems, currItems, null);
          expect(result).toEqual([]);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("returns empty array when user had no bids in previous state", () => {
    fc.assert(
      fc.property(
        validUserIdArb,
        fc.array(itemNoBidsArb, { minLength: 1, maxLength: 5 }),
        fc.array(itemArb(validUserIdArb), { minLength: 0, maxLength: 5 }),
        (userId, prevItems, currItems) => {
          // prevItems have no bids at all, so user cannot have had highest bid
          const result = detectOutbids(prevItems, currItems, userId);
          expect(result).toEqual([]);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("produces notification when user loses highest-bid position", () => {
    fc.assert(
      fc.property(
        validUserIdArb,
        fc.integer({ min: 1, max: 100 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.constantFrom("£", "$", "€"),
        fc.integer({ min: 1, max: 5000 }),
        fc.integer({ min: 1, max: 5000 }),
        (userId, itemId, title, currency, userBidAmount, extraAmount) => {
          // Ensure the other bidder outbids the user
          const otherUid = userId + "_other";
          const higherAmount = userBidAmount + extraAmount;

          const prevItem = {
            id: itemId,
            title,
            currency,
            bids: { 1: { amount: userBidAmount, uid: userId } },
          };

          const currItem = {
            id: itemId,
            title,
            currency,
            bids: {
              1: { amount: userBidAmount, uid: userId },
              2: { amount: higherAmount, uid: otherUid },
            },
          };

          const result = detectOutbids([prevItem], [currItem], userId);
          expect(result.length).toBe(1);
          expect(result[0].itemTitle).toBe(title);
          expect(result[0].newHighestBid).toBe(higherAmount);
          expect(result[0].currency).toBe(currency);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("does not produce notification when user still has highest bid", () => {
    fc.assert(
      fc.property(
        validUserIdArb,
        fc.integer({ min: 1, max: 100 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.constantFrom("£", "$", "€"),
        fc.integer({ min: 1, max: 5000 }),
        fc.integer({ min: 0, max: 4999 }),
        (userId, itemId, title, currency, userBidAmount, lowerDelta) => {
          // User still has the highest bid
          const otherUid = userId + "_other";
          const lowerAmount = Math.max(1, userBidAmount - lowerDelta - 1);

          const prevItem = {
            id: itemId,
            title,
            currency,
            bids: { 1: { amount: userBidAmount, uid: userId } },
          };

          const currItem = {
            id: itemId,
            title,
            currency,
            bids: {
              1: { amount: userBidAmount, uid: userId },
              2: { amount: lowerAmount, uid: otherUid },
            },
          };

          const result = detectOutbids([prevItem], [currItem], userId);
          expect(result).toEqual([]);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("notifications are produced exactly when user loses highest-bid position across multiple items", () => {
    fc.assert(
      fc.property(
        validUserIdArb,
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            title: fc.string({ minLength: 1, maxLength: 20 }),
            currency: fc.constantFrom("£", "$", "€"),
            userBid: fc.integer({ min: 1, max: 5000 }),
            otherBid: fc.integer({ min: 1, max: 10000 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (userId, itemSpecs) => {
          const otherUid = userId + "_other";

          // Deduplicate item IDs
          const seen = new Set();
          const uniqueSpecs = itemSpecs.filter((spec) => {
            if (seen.has(spec.id)) return false;
            seen.add(spec.id);
            return true;
          });

          // Build prevItems where user has highest bid on all items
          const prevItems = uniqueSpecs.map((spec) => ({
            id: spec.id,
            title: spec.title,
            currency: spec.currency,
            bids: { 1: { amount: spec.userBid, uid: userId } },
          }));

          // Build currItems where some items have a higher other bid
          const currItems = uniqueSpecs.map((spec) => ({
            id: spec.id,
            title: spec.title,
            currency: spec.currency,
            bids: {
              1: { amount: spec.userBid, uid: userId },
              2: { amount: spec.otherBid, uid: otherUid },
            },
          }));

          const result = detectOutbids(prevItems, currItems, userId);

          // Count how many items the user was outbid on
          const expectedOutbids = uniqueSpecs.filter(
            (spec) => spec.otherBid > spec.userBid
          );

          expect(result.length).toBe(expectedOutbids.length);

          // Verify each notification matches an outbid item
          for (const notification of result) {
            const matchingSpec = expectedOutbids.find(
              (spec) => spec.title === notification.itemTitle
            );
            expect(matchingSpec).toBeDefined();
            expect(notification.newHighestBid).toBe(matchingSpec.otherBid);
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
