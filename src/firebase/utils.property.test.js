import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { computeEditUpdates, parseField } from "./utils.jsx";
import { formatField } from "../utils/formatString.js";

/**
 * Feature: auction-overhaul, Property 9: Update operation preserves bids and reserve prices
 * Feature: auction-overhaul, Property 10: Reset operation removes only bids
 *
 * Validates: Requirements 6.1, 6.2
 */

/**
 * Feature: admin-user-enhancements, Property 4: Item edit preserves existing bids
 *
 * Validates: Requirements 4.3
 */

// --- Arbitraries / Generators ---

/**
 * Generates a valid item ID (positive integer, 1-99999 to fit the field format).
 */
const itemIdArb = fc.integer({ min: 1, max: 99999 });

/**
 * Generates a reserve price: either null (no reserve) or a positive number.
 */
const reservePriceArb = fc.oneof(
  fc.constant(null),
  fc.integer({ min: 1, max: 99999999 }).map((cents) => cents / 100)
);

/**
 * Generates a bid amount (positive number with up to 2 decimal places).
 */
const bidAmountArb = fc.integer({ min: 100, max: 99999999 }).map((cents) => cents / 100);

/**
 * Generates a new item config object (what comes from items.yml after parsing).
 */
const newItemConfigArb = (itemId) =>
  fc.record({
    id: fc.constant(itemId),
    title: fc.string({ minLength: 1, maxLength: 20 }),
    subtitle: fc.string({ minLength: 1, maxLength: 20 }),
    detail: fc.string({ minLength: 0, maxLength: 50 }),
    currency: fc.constant("£"),
    amount: fc.integer({ min: 0, max: 1000 }),
    endTime: fc.constant("2025-07-01T18:00:00Z"),
  });

/**
 * Generates a Firestore document data object with item config (bid 0) and bid entries.
 * Returns { docData, fields, itemIds, bidFields, configFields }
 */
const firestoreDocArb = fc
  .integer({ min: 1, max: 3 })
  .chain((numItems) => {
    const itemIds = Array.from({ length: numItems }, (_, i) => i + 1);

    return fc
      .tuple(
        // Reserve prices for each item
        fc.tuple(...itemIds.map(() => reservePriceArb)),
        // Number of bids per item (0-4)
        fc.tuple(...itemIds.map(() => fc.integer({ min: 0, max: 4 }))),
        // Bid amounts (generate enough for max bids)
        fc.array(bidAmountArb, { minLength: 12, maxLength: 12 })
      )
      .map(([reservePrices, bidCounts, bidAmounts]) => {
        const docData = {};
        const fields = [];
        const bidFields = [];
        const configFields = [];
        let bidAmountIdx = 0;

        itemIds.forEach((itemId, idx) => {
          // Item config field (bid 0)
          const configField = formatField(itemId, 0);
          const configData = {
            title: `Item ${itemId}`,
            subtitle: `Subtitle ${itemId}`,
            detail: `Detail ${itemId}`,
            currency: "£",
            amount: 0,
            endTime: "2025-07-01T18:00:00Z",
          };
          if (reservePrices[idx] !== null) {
            configData.reservePrice = reservePrices[idx];
          } else {
            configData.reservePrice = null;
          }
          docData[configField] = configData;
          fields.push(configField);
          configFields.push(configField);

          // Bid entries
          const numBids = bidCounts[idx];
          for (let b = 1; b <= numBids; b++) {
            const bidField = formatField(itemId, b);
            docData[bidField] = {
              amount: bidAmounts[bidAmountIdx % bidAmounts.length],
              uid: `user-${b}`,
            };
            bidAmountIdx++;
            fields.push(bidField);
            bidFields.push(bidField);
          }
        });

        return { docData, fields, itemIds, bidFields, configFields, reservePrices };
      });
  });

// --- Property 9: Update operation preserves bids and reserve prices ---

describe("Feature: auction-overhaul, Property 9: Update operation preserves bids and reserve prices", () => {
  /**
   * Validates: Requirements 6.1
   *
   * For any Firestore items document containing bid entries and reserve prices,
   * after running the update operation with new item configuration data,
   * all existing bid entries (bid > 0) SHALL remain unchanged and all
   * reservePrice values SHALL remain unchanged.
   */
  it("update operation does not modify any bid entries (bid > 0)", () => {
    fc.assert(
      fc.property(
        firestoreDocArb.chain((docState) => {
          // Generate new item configs for each item
          return fc
            .tuple(...docState.itemIds.map((id) => newItemConfigArb(id)))
            .map((newItems) => ({ ...docState, newItems }));
        }),
        ({ docData, fields, bidFields, newItems }) => {
          const DELETE_SENTINEL = Symbol("DELETE");

          const updates = computeEditUpdates({
            items: newItems,
            fields,
            currentDocData: docData,
            update: true,
            reset: false,
            deleteFieldSentinel: DELETE_SENTINEL,
          });

          // No bid field should appear in the updates object
          for (const bidField of bidFields) {
            expect(updates[bidField]).toBeUndefined();
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it("update operation preserves existing reservePrice values in updated config fields", () => {
    fc.assert(
      fc.property(
        firestoreDocArb.chain((docState) => {
          return fc
            .tuple(...docState.itemIds.map((id) => newItemConfigArb(id)))
            .map((newItems) => ({ ...docState, newItems }));
        }),
        ({ docData, fields, configFields, newItems }) => {
          const DELETE_SENTINEL = Symbol("DELETE");

          const updates = computeEditUpdates({
            items: newItems,
            fields,
            currentDocData: docData,
            update: true,
            reset: false,
            deleteFieldSentinel: DELETE_SENTINEL,
          });

          // For each config field that was updated, the reservePrice must match the original
          for (const configField of configFields) {
            if (updates[configField] !== undefined) {
              const originalReservePrice = docData[configField]?.reservePrice ?? null;
              expect(updates[configField].reservePrice).toBe(originalReservePrice);
            }
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it("update operation updates config fields (bid 0) with new item data", () => {
    fc.assert(
      fc.property(
        firestoreDocArb.chain((docState) => {
          return fc
            .tuple(...docState.itemIds.map((id) => newItemConfigArb(id)))
            .map((newItems) => ({ ...docState, newItems }));
        }),
        ({ docData, fields, configFields, newItems }) => {
          const DELETE_SENTINEL = Symbol("DELETE");

          const updates = computeEditUpdates({
            items: newItems,
            fields,
            currentDocData: docData,
            update: true,
            reset: false,
            deleteFieldSentinel: DELETE_SENTINEL,
          });

          // Each config field should be updated with the new item's data
          for (const configField of configFields) {
            const { item: itemId } = parseField(configField);
            const newItem = newItems.find((i) => i.id === itemId);
            if (newItem && updates[configField]) {
              // The updated field should contain the new item's title
              expect(updates[configField].title).toBe(newItem.title);
              expect(updates[configField].id).toBe(newItem.id);
            }
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});

// --- Property 10: Reset operation removes only bids ---

describe("Feature: auction-overhaul, Property 10: Reset operation removes only bids", () => {
  /**
   * Validates: Requirements 6.2
   *
   * For any Firestore items document containing item configuration (bid 0)
   * with reserve prices and bid entries (bid > 0), after running the reset
   * operation, all bid entries SHALL be removed and all item configuration
   * fields (including reservePrice) SHALL remain unchanged.
   */
  it("reset operation marks all bid entries for deletion", () => {
    fc.assert(
      fc.property(
        firestoreDocArb.filter(({ bidFields }) => bidFields.length > 0),
        ({ docData, fields, bidFields, itemIds }) => {
          const DELETE_SENTINEL = Symbol("DELETE");

          // Create minimal item configs for the reset operation
          const items = itemIds.map((id) => ({ id }));

          const updates = computeEditUpdates({
            items,
            fields,
            currentDocData: docData,
            update: false,
            reset: true,
            deleteFieldSentinel: DELETE_SENTINEL,
          });

          // Every bid field should be marked for deletion
          for (const bidField of bidFields) {
            expect(updates[bidField]).toBe(DELETE_SENTINEL);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it("reset operation does not modify any config fields (bid 0)", () => {
    fc.assert(
      fc.property(
        firestoreDocArb,
        ({ docData, fields, configFields, itemIds }) => {
          const DELETE_SENTINEL = Symbol("DELETE");

          const items = itemIds.map((id) => ({ id }));

          const updates = computeEditUpdates({
            items,
            fields,
            currentDocData: docData,
            update: false,
            reset: true,
            deleteFieldSentinel: DELETE_SENTINEL,
          });

          // No config field should appear in the updates object
          for (const configField of configFields) {
            expect(updates[configField]).toBeUndefined();
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it("reset operation preserves reserve prices (config fields untouched)", () => {
    fc.assert(
      fc.property(
        firestoreDocArb.filter(
          ({ reservePrices }) => reservePrices.some((rp) => rp !== null)
        ),
        ({ docData, fields, configFields, itemIds }) => {
          const DELETE_SENTINEL = Symbol("DELETE");

          const items = itemIds.map((id) => ({ id }));

          const updates = computeEditUpdates({
            items,
            fields,
            currentDocData: docData,
            update: false,
            reset: true,
            deleteFieldSentinel: DELETE_SENTINEL,
          });

          // Config fields should not be in updates at all, meaning
          // the original data (including reservePrice) is preserved
          for (const configField of configFields) {
            expect(updates[configField]).toBeUndefined();
          }

          // Verify the original docData still has its reserve prices intact
          // (the function is pure and doesn't mutate input)
          for (const configField of configFields) {
            const originalData = docData[configField];
            if (originalData?.reservePrice !== null) {
              expect(originalData.reservePrice).toBeTypeOf("number");
            }
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});


// --- Property 4: Item edit preserves existing bids (admin-user-enhancements) ---

describe("Feature: admin-user-enhancements, Property 4: Item edit preserves existing bids", () => {
  /**
   * Validates: Requirements 4.3
   *
   * For any auction item with existing bids, when computing the Firestore update
   * for an item edit operation, the resulting updates object SHALL NOT contain any
   * bid fields (bid > 0), and SHALL only modify the item metadata field (bid 0)
   * with the new values while preserving the existing reservePrice.
   */

  /**
   * Generates a single item with existing bids and a new metadata object for editing.
   * Returns { itemId, fields, currentDocData, newMetadata, bidFields, configField, originalReservePrice }
   */
  const editScenarioArb = fc
    .record({
      itemId: fc.integer({ min: 1, max: 99999 }),
      numBids: fc.integer({ min: 1, max: 10 }),
      reservePrice: fc.oneof(
        fc.constant(null),
        fc.integer({ min: 1, max: 99999999 }).map((cents) => cents / 100)
      ),
      newTitle: fc.string({ minLength: 1, maxLength: 30 }),
      newSubtitle: fc.string({ minLength: 1, maxLength: 30 }),
      newDetail: fc.string({ minLength: 0, maxLength: 50 }),
      newAmount: fc.integer({ min: 0, max: 10000 }),
    })
    .chain(({ itemId, numBids, reservePrice, newTitle, newSubtitle, newDetail, newAmount }) =>
      fc
        .array(
          fc.integer({ min: 100, max: 99999999 }).map((cents) => cents / 100),
          { minLength: numBids, maxLength: numBids }
        )
        .map((bidAmounts) => {
          const configField = formatField(itemId, 0);
          const currentDocData = {};
          const fields = [];
          const bidFields = [];

          // Item metadata (bid 0)
          currentDocData[configField] = {
            id: itemId,
            title: `Original Title ${itemId}`,
            subtitle: `Original Subtitle ${itemId}`,
            detail: `Original Detail ${itemId}`,
            currency: "£",
            amount: 0,
            endTime: "2025-07-01T18:00:00Z",
            reservePrice,
          };
          fields.push(configField);

          // Existing bids (bid > 0)
          for (let b = 1; b <= numBids; b++) {
            const bidField = formatField(itemId, b);
            currentDocData[bidField] = {
              amount: bidAmounts[b - 1],
              uid: `user-${b}`,
            };
            fields.push(bidField);
            bidFields.push(bidField);
          }

          const newMetadata = {
            id: itemId,
            title: newTitle,
            subtitle: newSubtitle,
            detail: newDetail,
            currency: "£",
            amount: newAmount,
            endTime: "2025-08-01T18:00:00Z",
          };

          return {
            itemId,
            fields,
            currentDocData,
            newMetadata,
            bidFields,
            configField,
            originalReservePrice: reservePrice,
          };
        })
    );

  it("edit updates object never contains bid fields (bid > 0)", () => {
    fc.assert(
      fc.property(
        editScenarioArb,
        ({ fields, currentDocData, newMetadata, bidFields }) => {
          const DELETE_SENTINEL = Symbol("DELETE");

          const updates = computeEditUpdates({
            items: [newMetadata],
            fields,
            currentDocData,
            update: true,
            reset: false,
            deleteFieldSentinel: DELETE_SENTINEL,
          });

          // No bid field (bid > 0) should appear in the updates object
          for (const bidField of bidFields) {
            expect(updates[bidField]).toBeUndefined();
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it("edit updates only the bid-0 metadata field with new values", () => {
    fc.assert(
      fc.property(
        editScenarioArb,
        ({ fields, currentDocData, newMetadata, configField }) => {
          const DELETE_SENTINEL = Symbol("DELETE");

          const updates = computeEditUpdates({
            items: [newMetadata],
            fields,
            currentDocData,
            update: true,
            reset: false,
            deleteFieldSentinel: DELETE_SENTINEL,
          });

          // The config field (bid 0) should be present in updates
          expect(updates[configField]).toBeDefined();

          // The updated metadata should contain the new values
          expect(updates[configField].title).toBe(newMetadata.title);
          expect(updates[configField].subtitle).toBe(newMetadata.subtitle);
          expect(updates[configField].detail).toBe(newMetadata.detail);
          expect(updates[configField].amount).toBe(newMetadata.amount);
          expect(updates[configField].id).toBe(newMetadata.id);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("edit preserves the existing reservePrice in the updated metadata", () => {
    fc.assert(
      fc.property(
        editScenarioArb,
        ({ fields, currentDocData, newMetadata, configField, originalReservePrice }) => {
          const DELETE_SENTINEL = Symbol("DELETE");

          const updates = computeEditUpdates({
            items: [newMetadata],
            fields,
            currentDocData,
            update: true,
            reset: false,
            deleteFieldSentinel: DELETE_SENTINEL,
          });

          // The reservePrice in the updated field must match the original
          expect(updates[configField].reservePrice).toBe(originalReservePrice);
        }
      ),
      { numRuns: 200 }
    );
  });
});
