import { describe, it, expect } from "vitest";
import { resolveRole } from "./roleResolution.js";

describe("resolveRole", () => {
  it('returns "admin" when role is "admin"', () => {
    expect(resolveRole({ role: "admin" })).toBe("admin");
  });

  it('returns "admin" when role is absent and admin is truthy', () => {
    expect(resolveRole({ admin: true })).toBe("admin");
  });

  it('returns "admin" when role is empty string and admin is truthy', () => {
    expect(resolveRole({ role: "", admin: true })).toBe("admin");
  });

  it('returns "editor" when role is "editor"', () => {
    expect(resolveRole({ role: "editor" })).toBe("editor");
  });

  it('returns "" when role is absent and admin is falsy', () => {
    expect(resolveRole({ admin: false })).toBe("");
  });

  it('returns "" when role is an unrecognised value', () => {
    expect(resolveRole({ role: "viewer" })).toBe("");
  });

  it('returns "" for null/undefined userDoc', () => {
    expect(resolveRole(null)).toBe("");
    expect(resolveRole(undefined)).toBe("");
  });

  it('returns "" for empty object', () => {
    expect(resolveRole({})).toBe("");
  });

  it('role "admin" takes precedence even if admin field is false', () => {
    expect(resolveRole({ role: "admin", admin: false })).toBe("admin");
  });

  it('role "editor" takes precedence over truthy admin field', () => {
    expect(resolveRole({ role: "editor", admin: true })).toBe("editor");
  });
});
