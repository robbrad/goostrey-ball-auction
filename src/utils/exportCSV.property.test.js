import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { generateCSV } from "./exportCSV.js";

/**
 * Feature: admin-user-enhancements, Property 7: CSV export contains only qualifying items with correct columns
 *
 * Validates: Requirements 7.1, 7.2
 */

// --- Arbitraries / Generators ---

/**
 * Generates a uid string (alphanumeric, no commas).
 */
const uidArb = fc.stringMatching(/^[a-zA-Z0-9]{3,12}$/);

/**
 * Generates a user lookup entry with name and email (no commas for simpler assertion).
 */
const userEntryArb = fc.record({
  name: fc.stringMatching(/^[a-zA-Z ]{1,20}$/),
  email: fc.stringMatching(/^[a-z]{2,8}@[a-z]{2,6}\.[a-z]{2,4}$/),
});

/**
 * Generates a user lookup map: uid -> { name, email }
 */
const userLookupArb = fc
  .array(fc.tuple(uidArb, userEntryArb), { minLength: 1, maxLength: 5 })
  .map((entries) => Object.fromEntries(entries));

/**
 * Generates a bid amount (positive number).
 */
const bidAmountArb = fc.integer({ min: 1, max: 100000 }).map((v) => v / 100);

/**
 * Generates a bids object with keys > 0 and uid values drawn from a provided uid pool.
 */
const bidsArb = (uids) =>
  fc
    .integer({ min: 0, max: 4 })
    .chain((numBids) => {
      if (numBids === 0) return fc.constant({});
      return fc
        .tuple(
          ...Array.from({ length: numBids }, () =>
            fc.tuple(
              bidAmountArb,
              fc.constantFrom(...(uids.length > 0 ? uids : ["defaultuid"]))
            )
          )
        )
        .map((bidEntries) => {
          const bids = {};
          bidEntries.forEach(([amount, uid], idx) => {
            bids[idx + 1] = { amount, uid };
          });
          return bids;
        });
    });

/**
 * Generates an endTime that is either in the past or future.
 */
const endTimeArb = fc.boolean().map((isPast) => {
  const now = Date.now();
  if (isPast) {
    return new Date(now - 3600000); // 1 hour ago
  }
  return new Date(now + 3600000); // 1 hour from now
});

/**
 * Generates a reserve price: null or a positive number.
 */
const reservePriceArb = fc.oneof(
  fc.constant(null),
  fc.integer({ min: 1, max: 100000 }).map((v) => v / 100)
);

/**
 * Generates an item title (no commas for simpler CSV assertion).
 */
const titleArb = fc.stringMatching(/^[a-zA-Z0-9 ]{1,20}$/);

/**
 * Generates an auction item with configurable properties.
 */
const itemArb = (uids) =>
  fc
    .tuple(
      fc.integer({ min: 1, max: 999 }),
      titleArb,
      endTimeArb,
      reservePriceArb,
      bidsArb(uids)
    )
    .map(([id, title, endTime, reservePrice, bids]) => ({
      id,
      title,
      endTime,
      reservePrice,
      bids,
    }));

/**
 * Generates a full test scenario: items array + userLookup.
 */
const scenarioArb = userLookupArb.chain((userLookup) => {
  const uids = Object.keys(userLookup);
  return fc
    .array(itemArb(uids), { minLength: 0, maxLength: 8 })
    .map((items) => ({ items, userLookup }));
});

// --- Helper: determine qualifying items independently ---

function isQualifyingItem(item) {
  const now = new Date();
  // Must have ended
  if (!item.endTime || item.endTime >= now) return false;

  // Must have actual bids (key > 0)
  const actualBids = Object.entries(item.bids || {})
    .filter(([key]) => Number(key) > 0)
    .map(([, bid]) => bid);

  if (actualBids.length === 0) return false;

  // Find winning bid
  const winningBid = actualBids.reduce(
    (max, bid) => (bid.amount > max.amount ? bid : max),
    actualBids[0]
  );

  // Check reserve price
  if (item.reservePrice != null && winningBid.amount < item.reservePrice) return false;

  return true;
}

function getWinningBid(item) {
  const actualBids = Object.entries(item.bids || {})
    .filter(([key]) => Number(key) > 0)
    .map(([, bid]) => bid);

  return actualBids.reduce(
    (max, bid) => (bid.amount > max.amount ? bid : max),
    actualBids[0]
  );
}

// --- Property 7: CSV export contains only qualifying items with correct columns ---

describe("Feature: admin-user-enhancements, Property 7: CSV export contains only qualifying items with correct columns", () => {
  /**
   * Validates: Requirements 7.1, 7.2
   *
   * For any array of auction items and a user lookup map, generateCSV SHALL produce
   * output containing exactly one data row per ended item that has a winning bid
   * meeting or exceeding the reserve price (or has no reserve and has bids), and
   * each row SHALL contain the item title, winning bid amount, winner name, and winner email.
   */
  it("CSV has header row 'Item Title,Winning Bid,Winner Name,Winner Email'", () => {
    fc.assert(
      fc.property(scenarioArb, ({ items, userLookup }) => {
        const csv = generateCSV(items, userLookup);
        const lines = csv.split("\n");
        expect(lines[0]).toBe("Item Title,Winning Bid,Winner Name,Winner Email");
      }),
      { numRuns: 200 }
    );
  });

  it("CSV has exactly one data row per qualifying ended item", () => {
    fc.assert(
      fc.property(scenarioArb, ({ items, userLookup }) => {
        const csv = generateCSV(items, userLookup);
        const lines = csv.split("\n");
        const dataRows = lines.slice(1).filter((line) => line.length > 0);

        const qualifyingItems = items.filter(isQualifyingItem);
        expect(dataRows.length).toBe(qualifyingItems.length);
      }),
      { numRuns: 200 }
    );
  });

  it("each data row contains item title, winning bid amount, winner name, and winner email", () => {
    fc.assert(
      fc.property(scenarioArb, ({ items, userLookup }) => {
        const csv = generateCSV(items, userLookup);
        const lines = csv.split("\n");
        const dataRows = lines.slice(1).filter((line) => line.length > 0);

        const qualifyingItems = items.filter(isQualifyingItem);

        for (let i = 0; i < qualifyingItems.length; i++) {
          const item = qualifyingItems[i];
          const row = dataRows[i];
          const winningBid = getWinningBid(item);
          const winner = userLookup[winningBid.uid];
          const expectedName = winner ? winner.name : "Unknown";
          const expectedEmail = winner ? winner.email : "Unknown";

          // Row should contain the item title
          expect(row).toContain(item.title);
          // Row should contain the winning bid amount
          expect(row).toContain(String(winningBid.amount));
          // Row should contain the winner name
          expect(row).toContain(expectedName);
          // Row should contain the winner email
          expect(row).toContain(expectedEmail);
        }
      }),
      { numRuns: 200 }
    );
  });

  it("each data row has exactly 4 columns", () => {
    fc.assert(
      fc.property(scenarioArb, ({ items, userLookup }) => {
        const csv = generateCSV(items, userLookup);
        const lines = csv.split("\n");
        const dataRows = lines.slice(1).filter((line) => line.length > 0);

        for (const row of dataRows) {
          // Split by comma but respect quoted values
          const columns = row.split(",");
          // Since we generate titles without commas, each row should have exactly 4 columns
          expect(columns.length).toBe(4);
        }
      }),
      { numRuns: 200 }
    );
  });
});
