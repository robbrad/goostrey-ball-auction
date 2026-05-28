import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { computeExtendedTime } from "./timeExtension.js";

/**
 * Feature: admin-user-enhancements, Property 5: Extend time adds exact duration
 *
 * Validates: Requirements 5.2
 */

describe("Feature: admin-user-enhancements, Property 5: Extend time adds exact duration", () => {
  /**
   * For any valid end time (Date) and any extension duration in {5, 15, 30} minutes,
   * the computed new end time SHALL equal the original end time plus exactly the
   * selected duration in milliseconds.
   */
  it("new end time equals original plus exact milliseconds for the given duration", () => {
    // Constrain dates to a realistic range that won't overflow when extended by 30 minutes
    const validDateArb = fc.date({
      min: new Date("2000-01-01T00:00:00Z"),
      max: new Date("2100-12-31T23:59:59Z"),
    });

    fc.assert(
      fc.property(
        validDateArb,
        fc.constantFrom(5, 15, 30),
        (endTime, minutes) => {
          const result = computeExtendedTime(endTime, minutes);
          const expectedMs = endTime.getTime() + minutes * 60 * 1000;

          expect(result.getTime()).toBe(expectedMs);
        }
      ),
      { numRuns: 200 }
    );
  });
});
