/**
 * Resolves the effective role from a user document.
 *
 * Resolution rules:
 * - If role is "admin", return "admin"
 * - If role is absent/empty and admin is truthy (legacy field), return "admin"
 * - If role is "editor", return "editor"
 * - Otherwise return ""
 *
 * @param {object} userDoc - Firestore user document with optional `role` and `admin` fields
 * @returns {"admin" | "editor" | ""}
 */
export const resolveRole = (userDoc) => {
  if (!userDoc) return "";

  const { role, admin } = userDoc;

  if (role === "admin") return "admin";
  if (role === "editor") return "editor";
  if (!role && admin) return "admin";

  return "";
};
