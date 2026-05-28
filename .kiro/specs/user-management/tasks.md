# Implementation Plan: User Management

## Overview

Implement an admin-only User Management page for the Goostrey PTA Ball Auction app. The page allows administrators to view all registered users, search/filter them, and change their roles. Implementation uses the existing React/Vite/Firebase stack with Bootstrap styling, Firestore for persistence, and fast-check for property-based testing.

## Tasks

- [x] 1. Create utility functions and property tests
  - [x] 1.1 Create `src/utils/userManagement.js` with sortUsers, filterUsers, roleDisplayLabel, and formatUserCount functions
    - Implement `sortUsers(users)` — sorts alphabetically by surname then firstName (case-insensitive)
    - Implement `filterUsers(users, searchText)` — case-insensitive substring match on firstName, surname, email
    - Implement `roleDisplayLabel(role)` — maps "admin"→"Admin", "editor"→"Editor", ""→"User", unknown→"User"
    - Implement `formatUserCount(filtered, total)` — returns "Showing {filtered} of {total} users"
    - _Requirements: 2.1, 2.2, 3.2, 3.3, 3.5_

  - [x] 1.2 Write property test for sortUsers ordering invariant
    - **Property 1: User list sorting is correct**
    - Generate arbitrary arrays of user objects with surname and firstName fields using fast-check
    - Assert that the output array is ordered by surname then firstName (case-insensitive)
    - **Validates: Requirements 2.1**

  - [x] 1.3 Write property test for roleDisplayLabel mapping
    - **Property 2: Role display label mapping**
    - Generate role values from {"admin", "editor", ""} and arbitrary strings
    - Assert known roles map to correct labels and unknown roles map to "User"
    - **Validates: Requirements 2.2**

  - [x] 1.4 Write property test for filterUsers correctness
    - **Property 3: Search filter correctness**
    - Generate arbitrary user arrays and search strings
    - Assert every returned user contains the search text in at least one field (firstName, surname, email)
    - Assert no matching user is excluded from the result
    - **Validates: Requirements 3.2, 3.3**

  - [x] 1.5 Write property test for formatUserCount string format
    - **Property 4: User count formatting**
    - Generate non-negative integers filtered and total where filtered <= total
    - Assert output equals `"Showing {filtered} of {total} users"`
    - **Validates: Requirements 3.5**

- [x] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implement UserManagementPage component
  - [x] 3.1 Create `src/pages/UserManagement.jsx` with full page implementation
    - Fetch all user documents from Firestore `users` collection on mount using `getDocs`
    - Manage state: users array, loading boolean, error string, searchText string, statusMessage object
    - Use `useAuth()` hook to get current user uid and role
    - Render loading spinner while fetching
    - Render error alert with retry button if fetch fails
    - Render "No users found" message when collection is empty
    - Render search input above user list table
    - Render Bootstrap table with columns: Name (surname, firstName), Email, Role (RoleSelector)
    - Use `sortUsers` and `filterUsers` from utility module
    - Display filtered count using `formatUserCount`
    - Implement RoleSelector as a `<select>` with options Admin/Editor/User
    - Pre-select current role value for each user
    - Disable RoleSelector for the currently signed-in admin (self-demotion prevention) with aria-disabled="true" and helper text
    - On role change: disable selector, write to Firestore, show success message for 5s, or revert and show error for 5s
    - _Requirements: 1.1, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2_

  - [x] 3.2 Write unit tests for UserManagementPage
    - Test loading state renders spinner
    - Test error state renders error alert
    - Test empty user list renders "no users found" message
    - Test RoleSelector is disabled for current user
    - Test role change triggers Firestore write and shows success message
    - Test failed role change reverts selector and shows error message
    - _Requirements: 1.5, 2.3, 2.4, 2.5, 4.2, 4.3, 4.4, 5.1, 5.2_

- [x] 4. Register route and update navigation
  - [x] 4.1 Add `/users` route in `src/App.jsx` with ProtectedRoute roles={["admin"]}
    - Import UserManagementPage (lazy-loaded with Suspense)
    - Add Route element wrapping UserManagementPage in ProtectedRoute with roles={["admin"]}
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 4.2 Add "Users" button to `src/components/Navbar.jsx` visible only for admin role
    - Add a "Users" button that navigates to the user management page route
    - Only render when `effectiveRole === "admin"` (not for editors)
    - Use `navigate()` for client-side navigation (no full page reload)
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 4.3 Write unit tests for route access control and navbar visibility
    - Test admin can access /users route (renders page)
    - Test editor is redirected from /users route
    - Test regular user is redirected from /users route
    - Test unauthenticated user is redirected from /users route
    - Test "Users" button visible for admin, hidden for editor and regular user
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 6.2, 6.3_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update Firestore security rules
  - [x] 6.1 Update `firestore.rules` to enforce admin-only user collection access
    - Admin can read any user document (role == "admin" check via get())
    - Non-admin can only read their own document (auth.uid == userId)
    - Admin can write any user document including role field changes
    - Non-admin can write own document only if role field is not modified
    - Admin cannot change their own role field (self-demotion server-side enforcement)
    - Unauthenticated requests are denied
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 5.3_

  - [x] 6.2 Write integration tests for Firestore security rules
    - Test admin can read all user docs
    - Test non-admin cannot read other user docs
    - Test any user can read own doc
    - Test admin can update role field on other users
    - Test non-admin cannot update role field
    - Test user can write own doc without role change
    - Test unauthenticated access is denied
    - Test admin cannot change own role field
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 5.3_

- [ ] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases
- The app uses JavaScript (React/JSX) with Vite and vitest for testing
- fast-check is already in devDependencies for property-based testing
- Firestore security rules integration tests require the Firebase emulator

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5"] },
    { "id": 2, "tasks": ["3.1", "4.1", "4.2"] },
    { "id": 3, "tasks": ["3.2", "4.3", "6.1"] },
    { "id": 4, "tasks": ["6.2"] }
  ]
}
```
