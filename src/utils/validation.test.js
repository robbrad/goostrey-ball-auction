import { describe, it, expect } from "vitest";
import {
  isWhitespaceOnly,
  validateName,
  validateBidAmount,
  validateReservePrice,
} from "./validation.js";

describe("isWhitespaceOnly", () => {
  it("returns true for empty string", () => {
    expect(isWhitespaceOnly("")).toBe(true);
  });

  it("returns true for spaces only", () => {
    expect(isWhitespaceOnly("   ")).toBe(true);
  });

  it("returns true for tabs and newlines", () => {
    expect(isWhitespaceOnly("\t\n\r")).toBe(true);
  });

  it("returns false for non-whitespace content", () => {
    expect(isWhitespaceOnly("hello")).toBe(false);
  });

  it("returns false for mixed content", () => {
    expect(isWhitespaceOnly(" a ")).toBe(false);
  });
});

describe("validateName", () => {
  it("rejects empty string", () => {
    const result = validateName("");
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("rejects whitespace-only string", () => {
    const result = validateName("   ");
    expect(result.valid).toBe(false);
  });

  it("rejects single character", () => {
    const result = validateName("A");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("at least 2");
  });

  it("rejects names longer than 50 characters", () => {
    const longName = "A".repeat(51);
    const result = validateName(longName);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("50");
  });

  it("accepts valid 2-character name", () => {
    const result = validateName("Jo");
    expect(result.valid).toBe(true);
    expect(result.error).toBe("");
  });

  it("accepts valid 50-character name", () => {
    const name = "A".repeat(50);
    const result = validateName(name);
    expect(result.valid).toBe(true);
  });

  it("accepts names with hyphens", () => {
    const result = validateName("Anne-Marie");
    expect(result.valid).toBe(true);
  });

  it("accepts names with apostrophes", () => {
    const result = validateName("O'Brien");
    expect(result.valid).toBe(true);
  });

  it("accepts Unicode letters", () => {
    const result = validateName("José");
    expect(result.valid).toBe(true);
  });

  it("rejects names with numbers", () => {
    const result = validateName("John2");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("letters, hyphens, and apostrophes");
  });

  it("rejects names with spaces", () => {
    const result = validateName("Jo hn");
    expect(result.valid).toBe(false);
  });

  it("rejects names with special characters", () => {
    const result = validateName("John!");
    expect(result.valid).toBe(false);
  });
});

describe("validateBidAmount", () => {
  it("accepts valid bid above minimum", () => {
    const result = validateBidAmount("15.00", 10, 1);
    expect(result.valid).toBe(true);
    expect(result.error).toBe("");
  });

  it("accepts bid exactly at minimum required", () => {
    const result = validateBidAmount("11.00", 10, 1);
    expect(result.valid).toBe(true);
  });

  it("rejects bid below minimum required", () => {
    const result = validateBidAmount("10.50", 10, 1);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("at least");
  });

  it("rejects non-numeric input", () => {
    const result = validateBidAmount("abc", 10, 1);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("valid monetary amount");
  });

  it("rejects negative values", () => {
    const result = validateBidAmount("-5", 0, 1);
    expect(result.valid).toBe(false);
  });

  it("rejects more than 2 decimal places", () => {
    const result = validateBidAmount("10.123", 5, 1);
    expect(result.valid).toBe(false);
  });

  it("rejects amounts exceeding 999999.99", () => {
    const result = validateBidAmount("1000000.00", 0, 1);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("999,999.99");
  });

  it("accepts amount with 1 decimal place", () => {
    const result = validateBidAmount("15.5", 10, 1);
    expect(result.valid).toBe(true);
  });

  it("accepts whole number amount", () => {
    const result = validateBidAmount("15", 10, 1);
    expect(result.valid).toBe(true);
  });

  it("rejects empty string", () => {
    const result = validateBidAmount("", 10, 1);
    expect(result.valid).toBe(false);
  });
});

describe("validateReservePrice", () => {
  it("accepts 0.00 (no reserve)", () => {
    const result = validateReservePrice("0.00");
    expect(result.valid).toBe(true);
    expect(result.error).toBe("");
  });

  it("accepts valid reserve price", () => {
    const result = validateReservePrice("50.00");
    expect(result.valid).toBe(true);
  });

  it("accepts maximum value 999999.99", () => {
    const result = validateReservePrice("999999.99");
    expect(result.valid).toBe(true);
  });

  it("rejects value exceeding 999999.99", () => {
    const result = validateReservePrice("1000000.00");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("999,999.99");
  });

  it("rejects non-numeric input", () => {
    const result = validateReservePrice("abc");
    expect(result.valid).toBe(false);
  });

  it("rejects more than 2 decimal places", () => {
    const result = validateReservePrice("10.123");
    expect(result.valid).toBe(false);
  });

  it("rejects negative values", () => {
    const result = validateReservePrice("-5");
    expect(result.valid).toBe(false);
  });

  it("accepts whole number", () => {
    const result = validateReservePrice("100");
    expect(result.valid).toBe(true);
  });

  it("accepts value with 1 decimal place", () => {
    const result = validateReservePrice("25.5");
    expect(result.valid).toBe(true);
  });
});
