import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { extractFirstName } from "./formatString.js";

describe("Feature: auction-overhaul, Property 4: First name extraction", () => {
  /**
   * Validates: Requirements 1.6
   *
   * Property 4: For any display name string in the format "FirstName Surname"
   * (where both parts are non-empty and separated by a space),
   * extractFirstName SHALL return exactly the substring before the first space.
   */
  it("returns the substring before the first space for any 'FirstName Surname' input", () => {
    const nonEmptyNoSpaces = fc.string({ minLength: 1 }).filter((s) => !s.includes(" ") && s.length > 0);

    fc.assert(
      fc.property(nonEmptyNoSpaces, nonEmptyNoSpaces, (firstName, surname) => {
        const displayName = `${firstName} ${surname}`;
        const result = extractFirstName(displayName);
        expect(result).toBe(firstName);
      })
    );
  });

  it("returns the first part when display name has multiple spaces", () => {
    const nonEmptyNoSpaces = fc.string({ minLength: 1 }).filter((s) => !s.includes(" ") && s.length > 0);

    fc.assert(
      fc.property(nonEmptyNoSpaces, nonEmptyNoSpaces, nonEmptyNoSpaces, (first, middle, last) => {
        const displayName = `${first} ${middle} ${last}`;
        const result = extractFirstName(displayName);
        expect(result).toBe(first);
      })
    );
  });

  it("returns the full string when there is no space (single word)", () => {
    const nonEmptyNoSpaces = fc.string({ minLength: 1 }).filter((s) => !s.includes(" ") && s.length > 0);

    fc.assert(
      fc.property(nonEmptyNoSpaces, (name) => {
        const result = extractFirstName(name);
        expect(result).toBe(name);
      })
    );
  });

  it("returns empty string for empty string input", () => {
    expect(extractFirstName("")).toBe("");
  });

  it("returns empty string for null input", () => {
    expect(extractFirstName(null)).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(extractFirstName(undefined)).toBe("");
  });
});
