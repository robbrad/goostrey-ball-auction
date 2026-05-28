import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validateName } from "./validation.js";

describe("Feature: auction-overhaul, Property 1: Whitespace-only names are rejected", () => {
  /**
   * Validates: Requirements 1.2, 1.3
   *
   * For any string composed entirely of whitespace characters (including empty
   * string, spaces, tabs, newlines), validateName SHALL return an invalid result
   * with an appropriate error message.
   */
  it("rejects any whitespace-only string", () => {
    const whitespaceOnly = fc.stringMatching(/^[\s]*$/);

    fc.assert(
      fc.property(whitespaceOnly, (name) => {
        const result = validateName(name);
        expect(result.valid).toBe(false);
        expect(result.error).toBeTruthy();
      }),
      { numRuns: 100 }
    );
  });
});

describe("Feature: auction-overhaul, Property 2: Invalid names are rejected", () => {
  /**
   * Validates: Requirements 1.7
   *
   * For any string that is shorter than 2 characters OR contains characters
   * other than letters (Unicode), hyphens, or apostrophes, validateName SHALL
   * return an invalid result.
   */
  it("rejects any single non-whitespace character (too short after trim)", () => {
    // Generate single printable characters that aren't whitespace
    const singleChar = fc.stringMatching(/^[^\s]$/);

    fc.assert(
      fc.property(singleChar, (name) => {
        const result = validateName(name);
        expect(result.valid).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects names containing digits", () => {
    // Generate names that have at least one digit mixed with letters
    const nameWithDigit = fc
      .tuple(
        fc.stringMatching(/^[\p{L}]{1,10}$/u),
        fc.stringMatching(/^[0-9]{1,3}$/),
        fc.stringMatching(/^[\p{L}]{1,10}$/u)
      )
      .map(([prefix, digits, suffix]) => prefix + digits + suffix);

    fc.assert(
      fc.property(nameWithDigit, (name) => {
        const result = validateName(name);
        expect(result.valid).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects names containing special characters (not letters, hyphens, or apostrophes)", () => {
    const invalidChars = fc.constantFrom(
      "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "=", "+",
      "[", "]", "{", "}", "|", "\\", ";", ":", '"', ",", ".",
      "<", ">", "/", "?", "~", "`", " "
    );

    const nameWithInvalidChar = fc
      .tuple(
        fc.stringMatching(/^[\p{L}]{1,10}$/u),
        invalidChars,
        fc.stringMatching(/^[\p{L}]{1,10}$/u)
      )
      .map(([prefix, invalid, suffix]) => prefix + invalid + suffix);

    fc.assert(
      fc.property(nameWithInvalidChar, (name) => {
        const result = validateName(name);
        expect(result.valid).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

describe("Feature: auction-overhaul, Property 3: Valid names are accepted", () => {
  /**
   * Validates: Requirements 1.2, 1.3, 1.7
   *
   * For any string of 2–50 characters composed only of letters, hyphens, and
   * apostrophes (not starting/ending with hyphen or apostrophe), validateName
   * SHALL return a valid result.
   */
  it("accepts any valid name (2-50 chars, letters/hyphens/apostrophes, not starting/ending with hyphen or apostrophe)", () => {
    // Valid name: starts with letter, ends with letter, middle can have letters/hyphens/apostrophes
    const validName = fc
      .tuple(
        fc.stringMatching(/^[\p{L}]$/u),
        fc.stringMatching(/^[\p{L}'\-]{0,48}$/u),
        fc.stringMatching(/^[\p{L}]$/u)
      )
      .map(([first, middle, last]) => first + middle + last)
      .filter((name) => name.length >= 2 && name.length <= 50);

    fc.assert(
      fc.property(validName, (name) => {
        const result = validateName(name);
        expect(result.valid).toBe(true);
        expect(result.error).toBe("");
      }),
      { numRuns: 100 }
    );
  });

  it("accepts names of exactly 2 characters (both letters)", () => {
    const twoLetterName = fc.stringMatching(/^[\p{L}]{2}$/u);

    fc.assert(
      fc.property(twoLetterName, (name) => {
        const result = validateName(name);
        expect(result.valid).toBe(true);
        expect(result.error).toBe("");
      }),
      { numRuns: 100 }
    );
  });

  it("accepts names of exactly 50 characters (BMP letters, length === 50)", () => {
    // Use BMP-only letters (no surrogate pairs) so JS .length matches character count
    const fiftyCharName = fc.stringMatching(/^[a-zA-ZÀ-ÖØ-öø-ÿ]{50}$/);

    fc.assert(
      fc.property(fiftyCharName, (name) => {
        expect(name.length).toBe(50);
        const result = validateName(name);
        expect(result.valid).toBe(true);
        expect(result.error).toBe("");
      }),
      { numRuns: 100 }
    );
  });
});
