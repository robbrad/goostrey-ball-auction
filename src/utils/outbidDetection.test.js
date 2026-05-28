import { describe, it, expect } from "vitest";
import { detectOutbids } from "./outbidDetection.js";

describe("detectOutbids", () => {
  it("returns empty array when userId is null", () => {
    const prevItems = [
      { id: 1, title: "Item 1", currency: "£", bids: { 0: { amount: 10 }, 1: { amount: 20, uid: "user1" } } },
    ];
    const currItems = [...prevItems];
    expect(detectOutbids(prevItems, currItems, null)).toEqual([]);
  });

  it("returns empty array when userId is undefined", () => {
    const prevItems = [
      { id: 1, title: "Item 1", currency: "£", bids: { 0: { amount: 10 }, 1: { amount: 20, uid: "user1" } } },
    ];
    expect(detectOutbids(prevItems, prevItems, undefined)).toEqual([]);
  });

  it("returns empty array when prevItems is not an array", () => {
    expect(detectOutbids(null, [], "user1")).toEqual([]);
    expect(detectOutbids(undefined, [], "user1")).toEqual([]);
  });

  it("returns empty array when currItems is not an array", () => {
    expect(detectOutbids([], null, "user1")).toEqual([]);
  });

  it("returns empty array when user had no bids in previous state", () => {
    const prevItems = [
      { id: 1, title: "Item 1", currency: "£", bids: { 0: { amount: 10 }, 1: { amount: 20, uid: "otherUser" } } },
    ];
    const currItems = [
      { id: 1, title: "Item 1", currency: "£", bids: { 0: { amount: 10 }, 1: { amount: 20, uid: "otherUser" }, 2: { amount: 30, uid: "anotherUser" } } },
    ];
    expect(detectOutbids(prevItems, currItems, "user1")).toEqual([]);
  });

  it("returns empty array when user still has highest bid", () => {
    const prevItems = [
      { id: 1, title: "Item 1", currency: "£", bids: { 0: { amount: 10 }, 1: { amount: 50, uid: "user1" }, 2: { amount: 30, uid: "user2" } } },
    ];
    const currItems = [
      { id: 1, title: "Item 1", currency: "£", bids: { 0: { amount: 10 }, 1: { amount: 50, uid: "user1" }, 2: { amount: 30, uid: "user2" }, 3: { amount: 40, uid: "user3" } } },
    ];
    expect(detectOutbids(prevItems, currItems, "user1")).toEqual([]);
  });

  it("returns notification when user is outbid", () => {
    const prevItems = [
      { id: 1, title: "Golf Day", currency: "£", bids: { 0: { amount: 10 }, 1: { amount: 50, uid: "user1" }, 2: { amount: 30, uid: "user2" } } },
    ];
    const currItems = [
      { id: 1, title: "Golf Day", currency: "£", bids: { 0: { amount: 10 }, 1: { amount: 50, uid: "user1" }, 2: { amount: 30, uid: "user2" }, 3: { amount: 60, uid: "user3" } } },
    ];
    const result = detectOutbids(prevItems, currItems, "user1");
    expect(result).toHaveLength(1);
    expect(result[0].itemTitle).toBe("Golf Day");
    expect(result[0].newHighestBid).toBe(60);
    expect(result[0].currency).toBe("£");
    expect(result[0].id).toMatch(/^outbid-/);
    expect(result[0].timestamp).toBeTypeOf("number");
  });

  it("returns multiple notifications when user is outbid on multiple items", () => {
    const prevItems = [
      { id: 1, title: "Item A", currency: "£", bids: { 0: { amount: 5 }, 1: { amount: 50, uid: "user1" } } },
      { id: 2, title: "Item B", currency: "$", bids: { 0: { amount: 5 }, 1: { amount: 40, uid: "user1" } } },
    ];
    const currItems = [
      { id: 1, title: "Item A", currency: "£", bids: { 0: { amount: 5 }, 1: { amount: 50, uid: "user1" }, 2: { amount: 60, uid: "user2" } } },
      { id: 2, title: "Item B", currency: "$", bids: { 0: { amount: 5 }, 1: { amount: 40, uid: "user1" }, 2: { amount: 45, uid: "user3" } } },
    ];
    const result = detectOutbids(prevItems, currItems, "user1");
    expect(result).toHaveLength(2);
    expect(result[0].itemTitle).toBe("Item A");
    expect(result[0].newHighestBid).toBe(60);
    expect(result[0].currency).toBe("£");
    expect(result[1].itemTitle).toBe("Item B");
    expect(result[1].newHighestBid).toBe(45);
    expect(result[1].currency).toBe("$");
  });

  it("skips items with no bids (only metadata at key 0)", () => {
    const prevItems = [
      { id: 1, title: "Item 1", currency: "£", bids: { 0: { amount: 10 } } },
    ];
    const currItems = [
      { id: 1, title: "Item 1", currency: "£", bids: { 0: { amount: 10 }, 1: { amount: 20, uid: "user2" } } },
    ];
    expect(detectOutbids(prevItems, currItems, "user1")).toEqual([]);
  });

  it("skips items not found in current state", () => {
    const prevItems = [
      { id: 1, title: "Item 1", currency: "£", bids: { 0: { amount: 10 }, 1: { amount: 50, uid: "user1" } } },
    ];
    const currItems = [];
    expect(detectOutbids(prevItems, currItems, "user1")).toEqual([]);
  });

  it("generates unique notification ids", () => {
    const prevItems = [
      { id: 1, title: "Item A", currency: "£", bids: { 0: { amount: 5 }, 1: { amount: 50, uid: "user1" } } },
      { id: 2, title: "Item B", currency: "£", bids: { 0: { amount: 5 }, 1: { amount: 40, uid: "user1" } } },
    ];
    const currItems = [
      { id: 1, title: "Item A", currency: "£", bids: { 0: { amount: 5 }, 1: { amount: 50, uid: "user1" }, 2: { amount: 60, uid: "user2" } } },
      { id: 2, title: "Item B", currency: "£", bids: { 0: { amount: 5 }, 1: { amount: 40, uid: "user1" }, 2: { amount: 45, uid: "user3" } } },
    ];
    const result = detectOutbids(prevItems, currItems, "user1");
    expect(result[0].id).not.toBe(result[1].id);
  });
});
