import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { resolveRole } from "./roleResolution.js";

/**
 * Feature: admin-user-enhancements, Property 2: Role resolution from user document
 *
 * Validates: Requirements 2.1, 2.7
 *
 * For any Firestore user document containing either a `role` field (with values
 * "admin", "editor", or "") or a legacy boolean `admin` field (or both), the role
 * resolution function SHALL return "admin" if `role` is "admin" OR if `role` is
 * absent and `admin` is truthy; "editor" if `role` is "editor"; and "" otherwise.
 */

// --- Arbitraries / Generators ---

/**
 * Generates an arbitrary role field value: "admin", "editor", "", or undefined (absent).
 */
const roleFieldArb = fc.oneof(
  fc.constant("admin"),
  fc.constant("editor"),
  fc.constant(""),
  fc.constant(undefined)
);

/**
 * Generates an arbitrary admin field value: true, false, or undefined (absent).
 */
const adminFieldArb = fc.oneof(
  fc.constant(true),
  fc.constant(false),
  fc.constant(undefined)
);

/**
 * Generates an arbitrary user document with combinations of `role` and `admin` fields.
 */
const userDocArb = fc
  .tuple(roleFieldArb, adminFieldArb)
  .map(([role, admin]) => {
    const doc = {};
    if (role !== undefined) doc.role = role;
    if (admin !== undefined) doc.admin = admin;
    return doc;
  });

// --- Helper: expected role based on resolution rules ---

function expectedRole(userDoc) {
  const role = userDoc.role;
  const admin = userDoc.admin;

  if (role === "admin") return "admin";
  if (role === "editor") return "editor";
  if (!role && admin) return "admin";
  return "";
}

// --- Property 2: Role resolution from user document ---

describe("Feature: admin-user-enhancements, Property 2: Role resolution from user document", () => {
  it("resolves role correctly for arbitrary user documents with role and admin field combinations", () => {
    fc.assert(
      fc.property(userDocArb, (userDoc) => {
        const result = resolveRole(userDoc);
        const expected = expectedRole(userDoc);
        expect(result).toBe(expected);
      }),
      { numRuns: 200 }
    );
  });

  it("returns 'admin' when role is 'admin' regardless of admin field", () => {
    fc.assert(
      fc.property(adminFieldArb, (adminValue) => {
        const doc = { role: "admin" };
        if (adminValue !== undefined) doc.admin = adminValue;
        expect(resolveRole(doc)).toBe("admin");
      }),
      { numRuns: 200 }
    );
  });

  it("returns 'admin' when role is absent and admin is truthy (legacy migration)", () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(undefined), fc.constant("")),
        (roleValue) => {
          const doc = { admin: true };
          if (roleValue !== undefined) doc.role = roleValue;
          expect(resolveRole(doc)).toBe("admin");
        }
      ),
      { numRuns: 200 }
    );
  });

  it("returns 'editor' when role is 'editor' regardless of admin field", () => {
    fc.assert(
      fc.property(adminFieldArb, (adminValue) => {
        const doc = { role: "editor" };
        if (adminValue !== undefined) doc.admin = adminValue;
        expect(resolveRole(doc)).toBe("editor");
      }),
      { numRuns: 200 }
    );
  });

  it("returns empty string for null/undefined user documents", () => {
    expect(resolveRole(null)).toBe("");
    expect(resolveRole(undefined)).toBe("");
  });

  it("returns empty string when role is absent and admin is falsy", () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(false), fc.constant(undefined)),
        fc.oneof(fc.constant(undefined), fc.constant("")),
        (adminValue, roleValue) => {
          const doc = {};
          if (adminValue !== undefined) doc.admin = adminValue;
          if (roleValue !== undefined) doc.role = roleValue;
          expect(resolveRole(doc)).toBe("");
        }
      ),
      { numRuns: 200 }
    );
  });
});
