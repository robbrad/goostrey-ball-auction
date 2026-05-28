import { describe, it, expect } from "vitest";
import { computeUserBids } from "./userBids.js";

describe("computeUserBids", () => {
  it("returns empty array when items is null or empty", () => {
    expect(computeUserBids(null, "user1")).toEqual([]);
    expect(computeUserBids([], "user1")).toEqual([]);
  });

  it("returns empty array when userId is null or empty", () => {
    const items = [{ id: 1, title: "Item 1", bids: { 0: { amount: 10 }, 1: { amount: 20, uid: "user1" } } }];
    expect(computeUserBids(items, null)).toEqual([]);
    expect(computeUserBids(items, "")).toEqual([]);
  });

  it("skips items where user has no bids", () => {
    const items = [
      { id: 1, title: "Item 1", bids: { 0: { amount: 10 }, 1: { amount: 20, uid: "other" } } },
    ];
    expect(computeUserBids(items, "user1")).toEqual([]);
  });

  it("returns items where user has bids with correct standing", () => {
    const items = [
      {
        id: 1,
        title: "Golf Day",
        bids: {
          0: { amount: 10 },
          1: { amount: 25, uid: "user1" },
          2: { amount: 30, uid: "user2" },
        },
      },
      {
        id: 2,
        title: "Spa Voucher",
        bids: {
          0: { amount: 5 },
          1: { amount: 50, uid: "user1" },
          2: { amount: 40, uid: "user2" },
        },
      },
    ];

    const result = computeUserBids(items, "user1");
    expect(result).toEqual([
      { title: "Golf Day", userHighestBid: 25, currentHighestBid: 30, standing: "Outbid", itemId: 1 },
      { title: "Spa Voucher", userHighestBid: 50, currentHighestBid: 50, standing: "Winning", itemId: 2 },
    ]);
  });

  it("uses the highest of multiple user bids", () => {
    const items = [
      {
        id: 1,
        title: "Item 1",
        bids: {
          0: { amount: 5 },
          1: { amount: 10, uid: "user1" },
          2: { amount: 20, uid: "user1" },
          3: { amount: 15, uid: "user2" },
        },
      },
    ];

    const result = computeUserBids(items, "user1");
    expect(result).toEqual([
      { title: "Item 1", userHighestBid: 20, currentHighestBid: 20, standing: "Winning", itemId: 1 },
    ]);
  });

  it("skips bid key 0 (metadata)", () => {
    const items = [
      {
        id: 1,
        title: "Item 1",
        bids: {
          0: { amount: 100, uid: "user1" },
          1: { amount: 20, uid: "user2" },
        },
      },
    ];

    // user1 only appears in key 0 which is metadata - should be skipped
    expect(computeUserBids(items, "user1")).toEqual([]);
  });

  it("handles items with no bids object", () => {
    const items = [
      { id: 1, title: "Item 1", bids: null },
      { id: 2, title: "Item 2" },
    ];
    expect(computeUserBids(items, "user1")).toEqual([]);
  });
});
