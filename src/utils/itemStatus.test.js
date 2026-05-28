import { describe, it, expect } from "vitest";
import { itemStatus } from "./itemStatus";

// Helper to create a future date
const futureDate = () => new Date(Date.now() + 60000);
// Helper to create a past date
const pastDate = () => new Date(Date.now() - 60000);

describe("itemStatus", () => {
  describe("return shape", () => {
    it("returns bids, amount, winner, ended, and status", () => {
      const item = { bids: {}, startingPrice: 10, endTime: futureDate() };
      const result = itemStatus(item);
      expect(result).toHaveProperty("bids");
      expect(result).toHaveProperty("amount");
      expect(result).toHaveProperty("winner");
      expect(result).toHaveProperty("ended");
      expect(result).toHaveProperty("status");
    });
  });

  describe("status: active", () => {
    it("returns active when endTime is in the future", () => {
      const item = { bids: {}, startingPrice: 10, endTime: futureDate() };
      const result = itemStatus(item);
      expect(result.status).toBe("active");
      expect(result.ended).toBe(false);
    });

    it("returns active with bids when endTime is in the future", () => {
      const item = {
        bids: { 1: { amount: 15, uid: "user1" } },
        startingPrice: 10,
        endTime: futureDate(),
        reservePrice: 20,
      };
      const result = itemStatus(item);
      expect(result.status).toBe("active");
      expect(result.bids).toBe(1);
      expect(result.amount).toBe(15);
      expect(result.winner).toBe("user1");
    });
  });

  describe("status: sold", () => {
    it("returns sold when highest bid >= reservePrice", () => {
      const item = {
        bids: { 1: { amount: 20, uid: "user1" } },
        startingPrice: 10,
        endTime: pastDate(),
        reservePrice: 15,
      };
      const result = itemStatus(item);
      expect(result.status).toBe("sold");
      expect(result.ended).toBe(true);
    });

    it("returns sold when highest bid equals reservePrice", () => {
      const item = {
        bids: { 1: { amount: 15, uid: "user1" } },
        startingPrice: 10,
        endTime: pastDate(),
        reservePrice: 15,
      };
      const result = itemStatus(item);
      expect(result.status).toBe("sold");
    });

    it("returns sold when no reserve price is set and bids exist", () => {
      const item = {
        bids: { 1: { amount: 5, uid: "user1" } },
        startingPrice: 10,
        endTime: pastDate(),
      };
      const result = itemStatus(item);
      expect(result.status).toBe("sold");
    });

    it("returns sold when reservePrice is 0 and bids exist", () => {
      const item = {
        bids: { 1: { amount: 5, uid: "user1" } },
        startingPrice: 10,
        endTime: pastDate(),
        reservePrice: 0,
      };
      const result = itemStatus(item);
      expect(result.status).toBe("sold");
    });
  });

  describe("status: reserve-not-met", () => {
    it("returns reserve-not-met when highest bid < reservePrice", () => {
      const item = {
        bids: { 1: { amount: 10, uid: "user1" } },
        startingPrice: 5,
        endTime: pastDate(),
        reservePrice: 20,
      };
      const result = itemStatus(item);
      expect(result.status).toBe("reserve-not-met");
      expect(result.ended).toBe(true);
    });

    it("returns reserve-not-met when no bids and reserve is set", () => {
      const item = {
        bids: {},
        startingPrice: 10,
        endTime: pastDate(),
        reservePrice: 15,
      };
      const result = itemStatus(item);
      expect(result.status).toBe("reserve-not-met");
    });
  });

  describe("status: ended-no-bids", () => {
    it("returns ended-no-bids when ended with no bids and no reserve", () => {
      const item = {
        bids: {},
        startingPrice: 10,
        endTime: pastDate(),
      };
      const result = itemStatus(item);
      expect(result.status).toBe("ended-no-bids");
      expect(result.ended).toBe(true);
    });

    it("returns ended-no-bids when ended with no bids and reserve is 0", () => {
      const item = {
        bids: {},
        startingPrice: 10,
        endTime: pastDate(),
        reservePrice: 0,
      };
      const result = itemStatus(item);
      expect(result.status).toBe("ended-no-bids");
    });
  });

  describe("backward compatibility", () => {
    it("still returns correct bids count", () => {
      const item = {
        bids: { 1: { amount: 5, uid: "a" }, 2: { amount: 10, uid: "b" } },
        startingPrice: 1,
        endTime: futureDate(),
      };
      const result = itemStatus(item);
      expect(result.bids).toBe(2);
    });

    it("returns startingPrice as amount when no bids", () => {
      const item = { bids: {}, startingPrice: 25, endTime: futureDate() };
      const result = itemStatus(item);
      expect(result.amount).toBe(25);
    });

    it("returns highest bid amount when bids exist", () => {
      const item = {
        bids: { 1: { amount: 5, uid: "a" }, 2: { amount: 12, uid: "b" } },
        startingPrice: 1,
        endTime: futureDate(),
      };
      const result = itemStatus(item);
      expect(result.amount).toBe(12);
    });

    it("returns empty string as winner when no bids", () => {
      const item = { bids: {}, startingPrice: 10, endTime: futureDate() };
      const result = itemStatus(item);
      expect(result.winner).toBe("");
    });

    it("handles null bids gracefully", () => {
      const item = { startingPrice: 10, endTime: futureDate() };
      const result = itemStatus(item);
      expect(result.bids).toBe(0);
      expect(result.amount).toBe(10);
      expect(result.winner).toBe("");
    });
  });
});
