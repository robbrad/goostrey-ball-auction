import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { sortUsers, filterUsers, roleDisplayLabel, formatUserCount } from './userManagement.js';

/**
 * Feature: user-management, Property 3: Search filter correctness
 *
 * For any array of user objects and any search string, filterUsers(users, searchText)
 * SHALL return only users where at least one of firstName, surname, or email contains
 * searchText as a case-insensitive substring, and SHALL not exclude any user that matches.
 *
 * Validates: Requirements 3.2, 3.3
 */
describe('Feature: user-management, Property 3: Search filter correctness', () => {
  const userArb = fc.record({
    firstName: fc.string(),
    surname: fc.string(),
    email: fc.string(),
  });

  const usersArb = fc.array(userArb);
  const searchArb = fc.string();

  it('every returned user contains the search text in at least one field (case-insensitive)', () => {
    fc.assert(
      fc.property(usersArb, searchArb, (users, searchText) => {
        const result = filterUsers(users, searchText);

        if (!searchText) {
          // Empty search returns all users
          expect(result).toEqual(users);
          return;
        }

        const term = searchText.toLowerCase();

        for (const user of result) {
          const firstName = (user.firstName || '').toLowerCase();
          const surname = (user.surname || '').toLowerCase();
          const email = (user.email || '').toLowerCase();
          const matches =
            firstName.includes(term) ||
            surname.includes(term) ||
            email.includes(term);
          expect(matches).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('no matching user is excluded from the result', () => {
    fc.assert(
      fc.property(usersArb, searchArb, (users, searchText) => {
        const result = filterUsers(users, searchText);

        if (!searchText) {
          expect(result.length).toBe(users.length);
          return;
        }

        const term = searchText.toLowerCase();

        for (const user of users) {
          const firstName = (user.firstName || '').toLowerCase();
          const surname = (user.surname || '').toLowerCase();
          const email = (user.email || '').toLowerCase();
          const shouldMatch =
            firstName.includes(term) ||
            surname.includes(term) ||
            email.includes(term);

          if (shouldMatch) {
            expect(result).toContain(user);
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: user-management, Property 2: Role display label mapping
 *
 * For any role value in {"admin", "editor", ""}, roleDisplayLabel(role) SHALL return
 * "Admin", "Editor", or "User" respectively, and for any string not in that set,
 * it SHALL return "User".
 *
 * Validates: Requirements 2.2
 */
describe('Feature: user-management, Property 2: Role display label mapping', () => {
  it('maps known roles to correct labels', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('admin', 'editor', ''),
        (role) => {
          const label = roleDisplayLabel(role);
          if (role === 'admin') expect(label).toBe('Admin');
          else if (role === 'editor') expect(label).toBe('Editor');
          else expect(label).toBe('User');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('maps unknown/arbitrary role strings to "User"', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s !== 'admin' && s !== 'editor' && s !== ''),
        (role) => {
          expect(roleDisplayLabel(role)).toBe('User');
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: user-management, Property 1: User list sorting is correct
 *
 * For any array of user objects with surname and firstName fields,
 * sortUsers(users) SHALL return an array where each element's surname is
 * lexicographically less than or equal to the next element's surname,
 * and where surnames are equal, firstName is less than or equal to the
 * next element's firstName (case-insensitive comparison).
 *
 * Validates: Requirements 2.1
 */
describe('Feature: user-management, Property 1: User list sorting is correct', () => {
  const userArb = fc.record({
    firstName: fc.string(),
    surname: fc.string(),
  });

  const usersArb = fc.array(userArb);

  it('output is ordered by surname then firstName (case-insensitive)', () => {
    fc.assert(
      fc.property(usersArb, (users) => {
        const sorted = sortUsers(users);

        for (let i = 0; i < sorted.length - 1; i++) {
          const surnameA = (sorted[i].surname || '').toLowerCase();
          const surnameB = (sorted[i + 1].surname || '').toLowerCase();

          if (surnameA === surnameB) {
            const firstA = (sorted[i].firstName || '').toLowerCase();
            const firstB = (sorted[i + 1].firstName || '').toLowerCase();
            expect(firstA <= firstB).toBe(true);
          } else {
            expect(surnameA < surnameB).toBe(true);
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: user-management, Property 4: User count formatting
 *
 * For any non-negative integers filtered and total where filtered <= total,
 * formatUserCount(filtered, total) SHALL return the string
 * "Showing {filtered} of {total} users".
 *
 * Validates: Requirements 3.5
 */
describe('Feature: user-management, Property 4: User count formatting', () => {
  it('should return "Showing {filtered} of {total} users" for any valid filtered <= total', () => {
    fc.assert(
      fc.property(
        fc.nat().chain((total) =>
          fc.tuple(fc.integer({ min: 0, max: total }), fc.constant(total))
        ),
        ([filtered, total]) => {
          const result = formatUserCount(filtered, total);
          expect(result).toBe(`Showing ${filtered} of ${total} users`);
        }
      ),
      { numRuns: 100 }
    );
  });
});
