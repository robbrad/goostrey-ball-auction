import { describe, it, expect } from 'vitest';
import { sortUsers, filterUsers, roleDisplayLabel, formatUserCount } from './userManagement.js';

describe('sortUsers', () => {
  it('sorts by surname alphabetically (case-insensitive)', () => {
    const users = [
      { firstName: 'Alice', surname: 'Zeta' },
      { firstName: 'Bob', surname: 'Alpha' },
      { firstName: 'Charlie', surname: 'Mango' },
    ];
    const sorted = sortUsers(users);
    expect(sorted[0].surname).toBe('Alpha');
    expect(sorted[1].surname).toBe('Mango');
    expect(sorted[2].surname).toBe('Zeta');
  });

  it('sorts by firstName when surnames are equal', () => {
    const users = [
      { firstName: 'Zara', surname: 'Smith' },
      { firstName: 'Adam', surname: 'Smith' },
      { firstName: 'Mike', surname: 'Smith' },
    ];
    const sorted = sortUsers(users);
    expect(sorted[0].firstName).toBe('Adam');
    expect(sorted[1].firstName).toBe('Mike');
    expect(sorted[2].firstName).toBe('Zara');
  });

  it('is case-insensitive', () => {
    const users = [
      { firstName: 'alice', surname: 'BETA' },
      { firstName: 'Bob', surname: 'alpha' },
    ];
    const sorted = sortUsers(users);
    expect(sorted[0].surname).toBe('alpha');
    expect(sorted[1].surname).toBe('BETA');
  });

  it('does not mutate the original array', () => {
    const users = [
      { firstName: 'B', surname: 'Z' },
      { firstName: 'A', surname: 'A' },
    ];
    const original = [...users];
    sortUsers(users);
    expect(users).toEqual(original);
  });

  it('handles empty array', () => {
    expect(sortUsers([])).toEqual([]);
  });
});

describe('filterUsers', () => {
  const users = [
    { firstName: 'Alice', surname: 'Smith', email: 'alice@example.com' },
    { firstName: 'Bob', surname: 'Jones', email: 'bob@test.org' },
    { firstName: 'Charlie', surname: 'Brown', email: 'charlie@example.com' },
  ];

  it('filters by firstName (case-insensitive)', () => {
    const result = filterUsers(users, 'alice');
    expect(result).toHaveLength(1);
    expect(result[0].firstName).toBe('Alice');
  });

  it('filters by surname (case-insensitive)', () => {
    const result = filterUsers(users, 'JONES');
    expect(result).toHaveLength(1);
    expect(result[0].surname).toBe('Jones');
  });

  it('filters by email (case-insensitive)', () => {
    const result = filterUsers(users, 'example.com');
    expect(result).toHaveLength(2);
  });

  it('returns all users when searchText is empty', () => {
    expect(filterUsers(users, '')).toEqual(users);
  });

  it('returns empty array when no match', () => {
    expect(filterUsers(users, 'zzzzz')).toEqual([]);
  });

  it('matches partial substrings', () => {
    const result = filterUsers(users, 'li');
    // Matches "Alice" and "Charlie"
    expect(result).toHaveLength(2);
  });
});

describe('roleDisplayLabel', () => {
  it('maps "admin" to "Admin"', () => {
    expect(roleDisplayLabel('admin')).toBe('Admin');
  });

  it('maps "editor" to "Editor"', () => {
    expect(roleDisplayLabel('editor')).toBe('Editor');
  });

  it('maps "" to "User"', () => {
    expect(roleDisplayLabel('')).toBe('User');
  });

  it('maps unknown values to "User"', () => {
    expect(roleDisplayLabel('superadmin')).toBe('User');
    expect(roleDisplayLabel('moderator')).toBe('User');
    expect(roleDisplayLabel(undefined)).toBe('User');
    expect(roleDisplayLabel(null)).toBe('User');
  });
});

describe('formatUserCount', () => {
  it('formats count correctly', () => {
    expect(formatUserCount(3, 12)).toBe('Showing 3 of 12 users');
  });

  it('handles zero filtered', () => {
    expect(formatUserCount(0, 10)).toBe('Showing 0 of 10 users');
  });

  it('handles equal filtered and total', () => {
    expect(formatUserCount(5, 5)).toBe('Showing 5 of 5 users');
  });

  it('handles zero total', () => {
    expect(formatUserCount(0, 0)).toBe('Showing 0 of 0 users');
  });
});
