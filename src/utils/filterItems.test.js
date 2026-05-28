import { describe, it, expect } from "vitest";
import { filterItems } from "./filterItems";

const makeItem = (overrides = {}) => ({
  id: 1,
  title: "Golf Day",
  subtitle: "Four players",
  endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
  bids: {},
  startingPrice: 50,
  ...overrides,
});

const defaultFilter = {
  searchText: "",
  status: "all",
  priceMin: null,
  priceMax: null,
  endingSoon: false,
};

describe("filterItems", () => {
  it("returns all items when no filters are active", () => {
    const items = [makeItem(), makeItem({ id: 2, title: "Spa Day" })];
    const result = filterItems(items, defaultFilter);
    expect(result).toHaveLength(2);
  });

  it("filters by searchText on title (case-insensitive)", () => {
    const items = [
      makeItem({ title: "Golf Day" }),
      makeItem({ id: 2, title: "Spa Day" }),
    ];
    const result = filterItems(items, { ...defaultFilter, searchText: "golf" });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Golf Day");
  });

  it("filters by searchText on subtitle (case-insensitive)", () => {
    const items = [
      makeItem({ subtitle: "Four players" }),
      makeItem({ id: 2, subtitle: "Relaxation package" }),
    ];
    const result = filterItems(items, { ...defaultFilter, searchText: "RELAX" });
    expect(result).toHaveLength(1);
    expect(result[0].subtitle).toBe("Relaxation package");
  });

  it("skips text filter when searchText is empty", () => {
    const items = [makeItem(), makeItem({ id: 2 })];
    const result = filterItems(items, { ...defaultFilter, searchText: "" });
    expect(result).toHaveLength(2);
  });

  it("filters by status 'active'", () => {
    const items = [
      makeItem({ endTime: new Date(Date.now() + 60000) }), // active
      makeItem({ id: 2, endTime: new Date(Date.now() - 60000) }), // ended
    ];
    const result = filterItems(items, { ...defaultFilter, status: "active" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("filters by status 'ended'", () => {
    const items = [
      makeItem({ endTime: new Date(Date.now() + 60000) }), // active
      makeItem({ id: 2, endTime: new Date(Date.now() - 60000) }), // ended
    ];
    const result = filterItems(items, { ...defaultFilter, status: "ended" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it("skips status filter when status is 'all'", () => {
    const items = [
      makeItem({ endTime: new Date(Date.now() + 60000) }),
      makeItem({ id: 2, endTime: new Date(Date.now() - 60000) }),
    ];
    const result = filterItems(items, { ...defaultFilter, status: "all" });
    expect(result).toHaveLength(2);
  });

  it("filters by priceMin using highest bid", () => {
    const items = [
      makeItem({ bids: { 1: { amount: 100, uid: "a" } }, startingPrice: 50 }),
      makeItem({ id: 2, bids: { 1: { amount: 30, uid: "b" } }, startingPrice: 20 }),
    ];
    const result = filterItems(items, { ...defaultFilter, priceMin: 50 });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("filters by priceMax using highest bid", () => {
    const items = [
      makeItem({ bids: { 1: { amount: 100, uid: "a" } }, startingPrice: 50 }),
      makeItem({ id: 2, bids: { 1: { amount: 30, uid: "b" } }, startingPrice: 20 }),
    ];
    const result = filterItems(items, { ...defaultFilter, priceMax: 50 });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it("uses startingPrice when no bids exist (key > 0)", () => {
    const items = [
      makeItem({ bids: {}, startingPrice: 75 }),
    ];
    const result = filterItems(items, { ...defaultFilter, priceMin: 50, priceMax: 100 });
    expect(result).toHaveLength(1);
  });

  it("skips price filter when priceMin and priceMax are null", () => {
    const items = [makeItem({ startingPrice: 10 }), makeItem({ id: 2, startingPrice: 1000 })];
    const result = filterItems(items, { ...defaultFilter, priceMin: null, priceMax: null });
    expect(result).toHaveLength(2);
  });

  it("filters endingSoon: only active items with <30 min remaining", () => {
    const items = [
      makeItem({ endTime: new Date(Date.now() + 10 * 60 * 1000) }), // 10 min left
      makeItem({ id: 2, endTime: new Date(Date.now() + 60 * 60 * 1000) }), // 60 min left
      makeItem({ id: 3, endTime: new Date(Date.now() - 60000) }), // ended
    ];
    const result = filterItems(items, { ...defaultFilter, endingSoon: true });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("skips endingSoon filter when false", () => {
    const items = [
      makeItem({ endTime: new Date(Date.now() + 60 * 60 * 1000) }),
    ];
    const result = filterItems(items, { ...defaultFilter, endingSoon: false });
    expect(result).toHaveLength(1);
  });

  it("applies multiple filters as intersection", () => {
    const items = [
      makeItem({ title: "Golf Day", bids: { 1: { amount: 100, uid: "a" } }, endTime: new Date(Date.now() + 10 * 60 * 1000) }),
      makeItem({ id: 2, title: "Golf Trip", bids: { 1: { amount: 20, uid: "b" } }, endTime: new Date(Date.now() + 10 * 60 * 1000) }),
      makeItem({ id: 3, title: "Spa Day", bids: { 1: { amount: 100, uid: "c" } }, endTime: new Date(Date.now() + 10 * 60 * 1000) }),
    ];
    const result = filterItems(items, {
      searchText: "golf",
      status: "active",
      priceMin: 50,
      priceMax: null,
      endingSoon: true,
    });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Golf Day");
  });

  it("returns empty array when no items match", () => {
    const items = [makeItem({ title: "Golf Day" })];
    const result = filterItems(items, { ...defaultFilter, searchText: "xyz" });
    expect(result).toHaveLength(0);
  });

  it("handles empty items array", () => {
    const result = filterItems([], defaultFilter);
    expect(result).toHaveLength(0);
  });
});
