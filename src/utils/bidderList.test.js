import { describe, it, expect } from "vitest";
import { sortBidders } from "./bidderList";

describe("sortBidders", () => {
  it("returns bidders sorted descending by amount, skipping key 0", () => {
    const bids = {
      0: { amount: 10, uid: "metadata" },
      1: { amount: 25, uid: "user1" },
      2: { amount: 50, uid: "user2" },
      3: { amount: 30, uid: "user3" },
    };

    const result = sortBidders(bids);

    expect(result).toEqual([
      { uid: "user2", amount: 50, timestamp: null },
      { uid: "user3", amount: 30, timestamp: null },
      { uid: "user1", amount: 25, timestamp: null },
    ]);
  });

  it("returns empty array when no bids exist (only key 0)", () => {
    const bids = {
      0: { amount: 10, uid: "metadata" },
    };

    expect(sortBidders(bids)).toEqual([]);
  });

  it("returns empty array for null or undefined input", () => {
    expect(sortBidders(null)).toEqual([]);
    expect(sortBidders(undefined)).toEqual([]);
  });

  it("returns empty array for empty object", () => {
    expect(sortBidders({})).toEqual([]);
  });

  it("handles single bid correctly", () => {
    const bids = {
      0: { amount: 5, uid: "meta" },
      1: { amount: 100, uid: "bidder1" },
    };

    expect(sortBidders(bids)).toEqual([{ uid: "bidder1", amount: 100, timestamp: null }]);
  });
});
