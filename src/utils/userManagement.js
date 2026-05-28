/**
 * Sorts users alphabetically by surname then firstName (case-insensitive).
 * @param {Array<{surname: string, firstName: string}>} users
 * @returns {Array<{surname: string, firstName: string}>}
 */
export function sortUsers(users) {
  return [...users].sort((a, b) => {
    const surnameA = (a.surname || '').toLowerCase();
    const surnameB = (b.surname || '').toLowerCase();
    if (surnameA < surnameB) return -1;
    if (surnameA > surnameB) return 1;
    const firstA = (a.firstName || '').toLowerCase();
    const firstB = (b.firstName || '').toLowerCase();
    if (firstA < firstB) return -1;
    if (firstA > firstB) return 1;
    return 0;
  });
}

/**
 * Filters users by search text (case-insensitive substring match on firstName, surname, email).
 * @param {Array<{firstName: string, surname: string, email: string}>} users
 * @param {string} searchText
 * @returns {Array<{firstName: string, surname: string, email: string}>}
 */
export function filterUsers(users, searchText) {
  if (!searchText) return users;
  const term = searchText.toLowerCase();
  return users.filter((user) => {
    const firstName = (user.firstName || '').toLowerCase();
    const surname = (user.surname || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    return firstName.includes(term) || surname.includes(term) || email.includes(term);
  });
}

/**
 * Maps a role field value to its display label.
 * @param {"admin" | "editor" | ""} role
 * @returns {"Admin" | "Editor" | "User"}
 */
export function roleDisplayLabel(role) {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'editor':
      return 'Editor';
    default:
      return 'User';
  }
}

/**
 * Formats the count string for filtered results.
 * @param {number} filtered
 * @param {number} total
 * @returns {string}
 */
export function formatUserCount(filtered, total) {
  return `Showing ${filtered} of ${total} users`;
}
