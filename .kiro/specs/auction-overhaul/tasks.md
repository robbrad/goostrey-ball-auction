# Implementation Plan: Auction Overhaul

## Overview

This plan implements the auction overhaul across four areas: enhanced registration with first name/surname, reserve price mechanism, Firebase deployment configuration, and bid validation/auth flow improvements. The implementation uses React 18 + Vite with Firebase (Firestore + Auth), adding Vitest and fast-check for testing.

## Tasks

- [x] 1. Set up testing infrastructure and validation utilities
  - [x] 1.1 Add test dependencies and configure Vitest
    - Install `vitest`, `fast-check`, `@testing-library/react`, `@testing-library/jest-dom`, and `jsdom` as dev dependencies
    - Add `test` script to package.json: `"test": "vitest --run"`
    - Add test configuration to `vite.config.js` with jsdom environment, globals: true, and setupFiles
    - Create `src/test/setup.js` with `@testing-library/jest-dom` import
    - _Requirements: Testing Strategy from design_

  - [x] 1.2 Create validation utility module `src/utils/validation.js`
    - Implement `isWhitespaceOnly(str)` — returns true if string is empty or only whitespace
    - Implement `validateName(name)` — returns `{ valid, error }`, rejects whitespace-only, < 2 chars, > 50 chars, and chars other than letters/hyphens/apostrophes
    - Implement `validateBidAmount(amount, currentHighest, minIncrement)` — returns `{ valid, error }`, validates positive numeric, ≤ 2 decimal places, ≤ 999999.99, ≥ currentHighest + minIncrement
    - Implement `validateReservePrice(value)` — returns `{ valid, error }`, validates numeric, 0.00–999999.99, ≤ 2 decimal places
    - _Requirements: 1.2, 1.3, 1.7, 2.1, 3.1, 3.2, 6.5_

  - [x] 1.3 Write property tests for name validation (Properties 1–3)
    - **Property 1: Whitespace-only names are rejected**
    - **Property 2: Invalid names are rejected**
    - **Property 3: Valid names are accepted**
    - **Validates: Requirements 1.2, 1.3, 1.7**

  - [x] 1.4 Write property test for reserve price validation (Property 6)
    - **Property 6: Reserve price validation**
    - **Validates: Requirements 2.1, 6.5**

  - [x] 1.5 Write property test for bid amount validation (Property 7)
    - **Property 7: Bid amount validation**
    - **Validates: Requirements 3.1, 3.2**

- [x] 2. Extend item status and format utilities
  - [x] 2.1 Extend `src/utils/itemStatus.js` with reserve price logic
    - Update `itemStatus(item)` to return `{ bids, amount, winner, ended, status }` where status is one of: `'active'`, `'sold'`, `'reserve-not-met'`, `'ended-no-bids'`
    - Implement status derivation: active if endTime in future; sold if highest bid ≥ reservePrice (or no reserve); reserve-not-met if highest bid < reservePrice or no bids with reserve set; ended-no-bids if ended with no bids and no reserve
    - _Requirements: 2.3, 2.4, 2.7, 5.4, 5.5, 5.6, 6.8_

  - [x] 2.2 Add `extractFirstName` to `src/utils/formatString.js`
    - Implement `extractFirstName(displayName)` — returns substring before first space
    - Export alongside existing utilities
    - _Requirements: 1.6_

  - [x] 2.3 Write property test for item status derivation (Property 5)
    - **Property 5: Item status derivation**
    - **Validates: Requirements 2.3, 2.4, 2.7, 5.4, 5.5, 5.6, 6.8**

  - [x] 2.4 Write property test for first name extraction (Property 4)
    - **Property 4: First name extraction**
    - **Validates: Requirements 1.6**

  - [x] 2.5 Write property test for countdown format (Property 8)
    - **Property 8: Countdown format correctness**
    - **Validates: Requirements 5.2**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create AuthProvider context and update authentication flow
  - [x] 4.1 Create `src/contexts/AuthProvider.jsx`
    - Create AuthProvider context that manages: `user` (Firebase user object or null), `admin` (boolean), `loading` (boolean), `signOutUser` (async function)
    - Subscribe to `onAuthStateChanged` for real-time auth state
    - Fetch admin status from Firestore `users/{uid}` document on auth change
    - Handle sign-out with error handling (display "Sign-out was unsuccessful" on failure)
    - Export `useAuth` hook for consuming components
    - _Requirements: 4.1, 4.5, 4.6_

  - [x] 4.2 Update `src/App.jsx` to use AuthProvider
    - Wrap app with `AuthProvider` in the Providers component
    - Remove `AutoSignIn` usage from App, consume `useAuth` instead
    - Pass auth state to ProtectedRoute via context instead of prop drilling
    - _Requirements: 4.1, 4.5_

  - [x] 4.3 Update `src/components/Navbar.jsx` to use AuthProvider
    - Consume `useAuth` context instead of receiving `admin` prop
    - Display first name greeting using `extractFirstName(user.displayName)` when signed in
    - Show "Login", "Sign up", "Forgot Password" buttons when signed out
    - Wire sign-out button to `signOutUser` from context
    - _Requirements: 1.6, 4.5, 4.6_

- [x] 5. Enhance registration form with name fields
  - [x] 5.1 Update SignUpModal in `src/components/Modal.jsx`
    - Add first name and surname input fields (mandatory, max 50 chars each)
    - Add inline validation using `validateName` from validation utility
    - On successful registration: store firstName and surname in Firestore `users/{uid}` document
    - Set Firebase Auth displayName to "FirstName Surname" format
    - Auto-sign-in after registration, close modal within 2 seconds
    - Display Firebase error messages on failure, preserve entered email
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 4.1, 4.3_

  - [x] 5.2 Write unit tests for registration form
    - Test form renders first name, surname, email, password fields
    - Test validation errors display for empty/whitespace names
    - Test validation errors for names < 2 chars or invalid characters
    - Test Firebase error message display
    - _Requirements: 1.1, 1.2, 1.3, 1.7, 4.3_

- [x] 6. Implement reserve price mechanism
  - [x] 6.1 Create `src/components/ReservePriceInput.jsx`
    - Create controlled input component for reserve price entry
    - Validate input using `validateReservePrice` on change/blur
    - Display validation error for invalid values (non-numeric, negative, > 999999.99)
    - Accept 0.00 as "no reserve" value
    - _Requirements: 2.1, 2.2, 6.4, 6.5, 6.8_

  - [x] 6.2 Update `src/pages/Admin.jsx` with reserve price management
    - Add reserve price column to the items table display
    - Integrate `ReservePriceInput` component for each item
    - Persist reserve price to Firestore `itemXXXXX_bid00000` field on save
    - Display winning user's display name in table
    - Add confirmation messages for Update All / Reset All operations
    - Add error handling for items.yml load failure
    - _Requirements: 2.2, 2.6, 6.1, 6.2, 6.3, 6.4, 6.6, 6.7_

  - [x] 6.3 Update `src/components/Table.jsx` and `src/components/Row.jsx`
    - Add reserve price column to table header and row display
    - Display winning user's display name column
    - _Requirements: 6.3_

  - [x] 6.4 Update `src/components/Item.jsx` with status display
    - Display "Sold" when item ended and highest bid ≥ reserve (or no reserve with bids)
    - Display "Reserve Not Met" when item ended and highest bid < reserve or no bids with reserve
    - Display "Item Ended" when countdown reaches zero (generic ended state)
    - Hide reserve price value from non-admin users
    - Use extended `itemStatus` utility for status derivation
    - _Requirements: 2.3, 2.4, 2.5, 2.7, 5.3, 5.4, 5.5_

  - [x] 6.5 Update `src/contexts/ItemsProvider.jsx` to parse reserve price
    - Parse `reservePrice` from item configuration data (bid 0 field)
    - Include reservePrice in item objects provided via context
    - _Requirements: 2.1_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Improve bid validation and authentication flow in bidding modal
  - [x] 8.1 Update ItemModal (bid modal) in `src/components/Modal.jsx`
    - Validate bid using `validateBidAmount` before submission
    - Check if user is signed in — display "You must be logged in to place a bid" if not
    - Check if user has displayName — redirect to Registration_Form if missing
    - Check if item has ended — display "Sorry, this item has ended!", close modal after 1 second
    - Disable submit button during bid submission to prevent duplicates
    - Display appropriate error messages for each validation failure
    - Write bid to Firestore with user's UID and amount on success
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 8.2 Write unit tests for bid validation flow
    - Test bid rejection when not signed in
    - Test bid rejection when no display name
    - Test bid rejection when item ended
    - Test bid rejection when amount too low
    - Test submit button disabled during submission
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 9. Implement real-time display enhancements
  - [x] 9.1 Update countdown and real-time display in `src/components/Item.jsx`
    - Ensure countdown timer updates every second in format "Xd Xh Xm Xs" omitting zero-value leading units
    - Display "Item Ended" when countdown reaches zero
    - Display starting price and "0 bids" when no bids exist
    - Ensure real-time bid updates propagate via existing onSnapshot listener
    - Continue displaying last received data if connection is lost
    - _Requirements: 5.1, 5.2, 5.3, 5.6, 5.7_

- [x] 10. Add Firebase deployment configuration
  - [x] 10.1 Create Firebase configuration files at project root
    - Create `firebase.json` referencing firestore.rules and firestore.indexes.json
    - Create `.firebaserc` mapping default project to "goostrey-ball-auction"
    - Create `firestore.rules` with read/write rules for auction/items and users/{userId}
    - Create `firestore.indexes.json` with empty indexes array
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.7_

  - [x] 10.2 Update GitHub Actions workflow for Firebase deployment
    - Add Firebase deploy step to `.github/workflows/pages.yml` (or create new workflow)
    - Deploy Firestore rules and indexes on push to main branch
    - Ensure deployment fails on syntax errors in rules file
    - _Requirements: 7.4, 7.5, 7.6_

- [x] 11. Implement update/reset operations with reserve price preservation
  - [x] 11.1 Update `src/firebase/utils.jsx` for reserve-price-aware operations
    - Update the "Update All" operation to preserve existing bid history AND reserve prices when updating item config from items.yml
    - Update the "Reset All" operation to remove all bid entries (bid > 0) while preserving item configuration fields including reservePrice
    - _Requirements: 6.1, 6.2_

  - [x] 11.2 Write property tests for update/reset operations (Properties 9–10)
    - **Property 9: Update operation preserves bids and reserve prices**
    - **Property 10: Reset operation removes only bids**
    - **Validates: Requirements 6.1, 6.2**

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project uses JavaScript (JSX) with React 18, Vite, and Firebase
- Vitest + fast-check are used for property-based testing
- All validation logic is extracted into pure utility functions for testability

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "10.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "2.2", "10.2"] },
    { "id": 2, "tasks": ["1.3", "1.4", "1.5", "2.3", "2.4", "2.5"] },
    { "id": 3, "tasks": ["4.1", "6.1", "6.5"] },
    { "id": 4, "tasks": ["4.2", "4.3", "5.1", "6.2", "6.3", "6.4", "9.1"] },
    { "id": 5, "tasks": ["5.2", "8.1", "11.1"] },
    { "id": 6, "tasks": ["8.2", "11.2"] }
  ]
}
```
