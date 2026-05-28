import { describe, it, expect } from "vitest";
import { generateCSV } from "./exportCSV.js";

describe("generateCSV", () => {
  const pastDate = new Date(Date.now() - 60000);
  const futureDate = new Date(Date.now() + 60000);

  it("returns header only for empty items array", () => {
    const result = generateCSV([], {});
    expect(result).toBe("Item Title,Winning Bid,Winner Name,Winner Email");
  });

  it("returns header only for null/undefined items", () => {
    expect(generateCSV(null, {})).toBe("Item Title,Winning Bid,Winner Name,Winner Email");
    expect(generateCSV(undefined, {})).toBe("Item Title,Winning Bid,Winner Name,Winner Email");
  });

  it("includes ended item with winning bid meeting reserve", () => {
    const items = [
      {
        id: 1,
        title: "Golf Day",
        endTime: pastDate,
        reservePrice: 50,
        bids: {
          0: { amount: 10, uid: "meta" },
          1: { amount: 60, uid: "user1" },
          2: { amount: 75, uid: "user2" },
        },
      },
    ];
    const userLookup = {
      user2: { name: "John Smith", email: "john@example.com" },
    };

    const result = generateCSV(items, userLookup);
    const lines = result.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("Item Title,Winning Bid,Winner Name,Winner Email");
    expect(lines[1]).toBe("Golf Day,75,John Smith,john@example.com");
  });

  it("excludes ended item where winning bid does not meet reserve", () => {
    const items = [
      {
        id: 1,
        title: "Golf Day",
        endTime: pastDate,
        reservePrice: 100,
        bids: {
          0: { amount: 10, uid: "meta" },
          1: { amount: 60, uid: "user1" },
        },
      },
    ];

    const result = generateCSV(items, {});
    const lines = result.split("\n");
    expect(lines).toHaveLength(1);
  });

  it("includes ended item with no reserve and bids", () => {
    const items = [
      {
        id: 1,
        title: "Spa Day",
        endTime: pastDate,
        reservePrice: null,
        bids: {
          0: { amount: 5, uid: "meta" },
          1: { amount: 30, uid: "user1" },
        },
      },
    ];
    const userLookup = {
      user1: { name: "Jane Doe", email: "jane@example.com" },
    };

    const result = generateCSV(items, userLookup);
    const lines = result.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe("Spa Day,30,Jane Doe,jane@example.com");
  });

  it("excludes active items (endTime in the future)", () => {
    const items = [
      {
        id: 1,
        title: "Active Item",
        endTime: futureDate,
        reservePrice: null,
        bids: { 0: { amount: 5, uid: "meta" }, 1: { amount: 30, uid: "user1" } },
      },
    ];

    const result = generateCSV(items, {});
    const lines = result.split("\n");
    expect(lines).toHaveLength(1);
  });

  it("excludes ended items with no actual bids", () => {
    const items = [
      {
        id: 1,
        title: "No Bids Item",
        endTime: pastDate,
        reservePrice: null,
        bids: { 0: { amount: 5, uid: "meta" } },
      },
    ];

    const result = generateCSV(items, {});
    const lines = result.split("\n");
    expect(lines).toHaveLength(1);
  });

  it("uses 'Unknown' when winner not found in userLookup", () => {
    const items = [
      {
        id: 1,
        title: "Mystery Item",
        endTime: pastDate,
        reservePrice: null,
        bids: { 0: { amount: 5, uid: "meta" }, 1: { amount: 40, uid: "unknown_user" } },
      },
    ];

    const result = generateCSV(items, {});
    const lines = result.split("\n");
    expect(lines[1]).toBe("Mystery Item,40,Unknown,Unknown");
  });

  it("quotes values containing commas", () => {
    const items = [
      {
        id: 1,
        title: "Golf, Spa, and More",
        endTime: pastDate,
        reservePrice: null,
        bids: { 0: { amount: 5, uid: "meta" }, 1: { amount: 50, uid: "user1" } },
      },
    ];
    const userLookup = {
      user1: { name: "Smith, John", email: "john@example.com" },
    };

    const result = generateCSV(items, userLookup);
    const lines = result.split("\n");
    expect(lines[1]).toContain('"Golf, Spa, and More"');
    expect(lines[1]).toContain('"Smith, John"');
  });
});
