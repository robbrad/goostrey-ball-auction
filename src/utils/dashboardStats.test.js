import { describe, it, expect } from "vitest";
import { computeDashboardStats } from "./dashboardStats";

describe("computeDashboardStats", () => {
  it("returns zeros for an empty items array", () => {
    const result = computeDashboardStats([]);
    expect(result).toEqual({
      totalItems: 0,
      activeItems: 0,
      endedItems: 0,
      totalBids: 0,
      revenue: 0,
    });
  });

  it("counts active items correctly (endTime in the future)", () => {
    const futureDate = new Date(Date.now() + 60000);
    const items = [
      { id: 1, title: "Item 1", endTime: futureDate, reservePrice: null, bids: {} },
      { id: 2, title: "Item 2", endTime: futureDate, reservePrice: null, bids: {} },
    ];
    const result = computeDashboardStats(items);
    expect(result.totalItems).toBe(2);
    expect(result.activeItems).toBe(2);
    expect(result.endedItems).toBe(0);
  });

  it("counts ended items correctly (endTime in the past)", () => {
    const pastDate = new Date(Date.now() - 60000);
    const items = [
      { id: 1, title: "Item 1", endTime: pastDate, reservePrice: null, bids: {} },
      { id: 2, title: "Item 2", endTime: pastDate, reservePrice: null, bids: {} },
    ];
    const result = computeDashboardStats(items);
    expect(result.totalItems).toBe(2);
    expect(result.activeItems).toBe(0);
    expect(result.endedItems).toBe(2);
  });

  it("counts total bids across all items (only keys > 0)", () => {
    const futureDate = new Date(Date.now() + 60000);
    const items = [
      {
        id: 1,
        title: "Item 1",
        endTime: futureDate,
        reservePrice: null,
        bids: { 1: { amount: 10, uid: "a" }, 2: { amount: 20, uid: "b" } },
      },
      {
        id: 2,
        title: "Item 2",
        endTime: futureDate,
        reservePrice: null,
        bids: { 1: { amount: 15, uid: "c" } },
      },
    ];
    const result = computeDashboardStats(items);
    expect(result.totalBids).toBe(3);
  });

  it("calculates revenue for ended items with no reserve", () => {
    const pastDate = new Date(Date.now() - 60000);
    const items = [
      {
        id: 1,
        title: "Item 1",
        endTime: pastDate,
        reservePrice: null,
        bids: { 1: { amount: 50, uid: "a" }, 2: { amount: 100, uid: "b" } },
      },
    ];
    const result = computeDashboardStats(items);
    expect(result.revenue).toBe(100);
  });

  it("calculates revenue for ended items where reserve is met", () => {
    const pastDate = new Date(Date.now() - 60000);
    const items = [
      {
        id: 1,
        title: "Item 1",
        endTime: pastDate,
        reservePrice: 80,
        bids: { 1: { amount: 50, uid: "a" }, 2: { amount: 100, uid: "b" } },
      },
    ];
    const result = computeDashboardStats(items);
    expect(result.revenue).toBe(100);
  });

  it("excludes revenue for ended items where reserve is NOT met", () => {
    const pastDate = new Date(Date.now() - 60000);
    const items = [
      {
        id: 1,
        title: "Item 1",
        endTime: pastDate,
        reservePrice: 200,
        bids: { 1: { amount: 50, uid: "a" }, 2: { amount: 100, uid: "b" } },
      },
    ];
    const result = computeDashboardStats(items);
    expect(result.revenue).toBe(0);
  });

  it("does not count revenue for active items", () => {
    const futureDate = new Date(Date.now() + 60000);
    const items = [
      {
        id: 1,
        title: "Item 1",
        endTime: futureDate,
        reservePrice: null,
        bids: { 1: { amount: 500, uid: "a" } },
      },
    ];
    const result = computeDashboardStats(items);
    expect(result.revenue).toBe(0);
  });

  it("handles a mix of active and ended items", () => {
    const pastDate = new Date(Date.now() - 60000);
    const futureDate = new Date(Date.now() + 60000);
    const items = [
      {
        id: 1,
        title: "Ended no reserve",
        endTime: pastDate,
        reservePrice: null,
        bids: { 1: { amount: 25, uid: "a" } },
      },
      {
        id: 2,
        title: "Ended reserve met",
        endTime: pastDate,
        reservePrice: 10,
        bids: { 1: { amount: 30, uid: "b" } },
      },
      {
        id: 3,
        title: "Ended reserve not met",
        endTime: pastDate,
        reservePrice: 100,
        bids: { 1: { amount: 20, uid: "c" } },
      },
      {
        id: 4,
        title: "Active with bids",
        endTime: futureDate,
        reservePrice: null,
        bids: { 1: { amount: 40, uid: "d" }, 2: { amount: 60, uid: "e" } },
      },
    ];
    const result = computeDashboardStats(items);
    expect(result.totalItems).toBe(4);
    expect(result.activeItems).toBe(1);
    expect(result.endedItems).toBe(3);
    expect(result.totalBids).toBe(5);
    expect(result.revenue).toBe(55); // 25 + 30, not 20 (reserve not met), not active
  });
});
