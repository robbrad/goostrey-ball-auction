import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { formatTime } from "./formatString.js";

/**
 * Feature: auction-overhaul
 * Property 8: Countdown format correctness
 *
 * For any positive millisecond duration, formatTime SHALL produce a string that:
 * 1. Contains only the units d, h, m, s with numeric prefixes
 * 2. Omits leading zero-value units (e.g., no "0d" prefix when days=0)
 * 3. The numeric values, when converted back to milliseconds, equal the original
 *    duration (within 1 second tolerance due to rounding)
 *
 * Validates: Requirements 5.2
 */
describe("Property 8: Countdown format correctness", () => {
  // Regex that matches the expected output format:
  // Optional parts like "1d ", "2h ", "3m ", and "4s" or "4.5s"
  const FORMAT_REGEX = /^(\d+d\s)?(\d+h\s)?(\d+m\s)?(\d+(\.\d+)?s)?$/;

  it("output contains only valid unit tokens (d, h, m, s with numeric prefixes)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 7 * 86400 * 1000 }), // 1ms to 7 days
        (ms) => {
          const result = formatTime(ms);

          // The result should be non-empty for positive input
          expect(result.length).toBeGreaterThan(0);

          // Each space-separated token should match "Xd", "Xh", "Xm", or "Xs"/"X.Xs"
          const tokens = result.split(/\s+/);
          for (const token of tokens) {
            expect(token).toMatch(/^\d+(\.\d+)?[dhms]$/);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it("omits leading zero-value units", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 7 * 86400 * 1000 }),
        (ms) => {
          const result = formatTime(ms);
          const tokens = result.split(/\s+/);

          // Compute expected values
          const totalSeconds = ms / 1000;
          const days = Math.floor(totalSeconds / 86400);
          const hours = Math.floor((totalSeconds % 86400) / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);

          // If days is 0, "0d" should not appear
          if (days === 0) {
            expect(tokens.some((t) => t.startsWith("0d"))).toBe(false);
            // Also should not have any "d" token at all
            expect(tokens.some((t) => t.endsWith("d"))).toBe(false);
          }

          // If days is 0 and hours is 0, "0h" should not appear
          if (days === 0 && hours === 0) {
            expect(tokens.some((t) => t.startsWith("0h"))).toBe(false);
            expect(tokens.some((t) => t.endsWith("h"))).toBe(false);
          }

          // If days is 0 and hours is 0 and minutes is 0, "0m" should not appear
          if (days === 0 && hours === 0 && minutes === 0) {
            expect(tokens.some((t) => t.startsWith("0m"))).toBe(false);
            expect(tokens.some((t) => t.endsWith("m"))).toBe(false);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it("reconstructed milliseconds equal original within 1 second tolerance", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 7 * 86400 * 1000 }), // Start at 1s to avoid sub-second edge cases
        (ms) => {
          const result = formatTime(ms);
          const tokens = result.split(/\s+/);

          let reconstructedMs = 0;
          for (const token of tokens) {
            const numericPart = parseFloat(token);
            const unit = token.replace(/[\d.]/g, "");

            switch (unit) {
              case "d":
                reconstructedMs += numericPart * 86400 * 1000;
                break;
              case "h":
                reconstructedMs += numericPart * 3600 * 1000;
                break;
              case "m":
                reconstructedMs += numericPart * 60 * 1000;
                break;
              case "s":
                reconstructedMs += numericPart * 1000;
                break;
            }
          }

          // Within 1 second tolerance due to rounding
          expect(Math.abs(reconstructedMs - ms)).toBeLessThanOrEqual(1000);
        }
      ),
      { numRuns: 200 }
    );
  });
});
